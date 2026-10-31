/**
 * Resumo das comunidades (`graph::community`, inventário `vetores-grafo.md` §4 e
 * `prompts-agentes.md` §1.8): completa o `communities.json` que `detectarComunidades` montou.
 * O original gera o resumo curto sem LLM ("Grupo temático contendo: …") e guarda em
 * `summary_embedding` o embedding do resumo. Aqui, com `completarLlm` o resumo vira uma descrição
 * escrita pelo LLM *(escolha do clone: o inventário não traz o prompt de resumo com LLM)* e, com
 * `gerarEmbeddings`, cada resumo ganha o embedding. Qualquer falha mantém o resumo sem LLM.
 * LLM e embeddings são injetados e a entrada nunca é alterada.
 */

import type {
  Comunidade,
  Entidade,
  GrafoComunidades,
} from '../../compartilhado/tipos-grafo';
import { LOTE_EMBEDDING } from '../vetores/constantes';
import { dividirEmLotes } from '../vetores/provedor-embedding';
import type { CompletarLlm } from './reordenacao';

/** Quantos membros entram no pedido ao LLM. */
const LIMITE_MEMBROS_PROMPT = 20;
/** Tamanho máximo da descrição de cada membro no pedido. */
const LIMITE_DESCRICAO_MEMBRO = 200;
/** Tamanho máximo do resumo aceito do LLM. */
const LIMITE_RESUMO = 600;
/** Resumos pedidos ao LLM ao mesmo tempo. */
const RESUMOS_PARALELOS = 4;
const SEPARADOR_LINHAS = '\n';
const PADRAO_ESPACOS = /\s+/g;
const PROMPT_RESUMO_COMUNIDADE_SISTEMA =
  'Você resume grupos temáticos de um grafo de conhecimento. Responda com 1 ou 2 frases, ' +
  'no idioma dos nomes, dizendo o tema que une as entidades. Sem listas, sem títulos e sem ' +
  'repetir a lista de nomes.';

/** Dependências do resumo; sem nenhuma, o resultado é igual à entrada. */
export interface DependenciasResumoComunidades {
  /** Escreve o resumo de cada comunidade (opcional). */
  completarLlm?: CompletarLlm;
  /** Gera os embeddings de uma lista de textos (opcional; o lote é dividido aqui). */
  gerarEmbeddings?: (textos: string[]) => Promise<number[][]>;
}

/** Contagem do que aconteceu no resumo. */
export interface EstatisticaResumo {
  resumidasPorLlm: number;
  falhasLlm: number;
  comEmbedding: number;
}

/** Resultado do resumo. */
export interface ResultadoResumoComunidades {
  grafo: GrafoComunidades;
  estatistica: EstatisticaResumo;
}

/**
 * Monta o pedido ao LLM com os membros da comunidade e as descrições.
 * @param {Comunidade} comunidade - Comunidade a resumir.
 * @param {Map<string, Entidade>} entidades - Entidades por nome.
 * @returns {string} Texto do pedido do usuário.
 */
export function montarPedidoResumo(
  comunidade: Comunidade,
  entidades: Map<string, Entidade>,
): string {
  const linhas = comunidade.entity_ids.slice(0, LIMITE_MEMBROS_PROMPT).map((nome) => {
    const entidade = entidades.get(nome);
    const descricao = (entidade?.description ?? '').trim().slice(0, LIMITE_DESCRICAO_MEMBRO);
    const tipo = entidade?.entity_type ? ` (${entidade.entity_type})` : '';
    return descricao ? `- ${nome}${tipo}: ${descricao}` : `- ${nome}${tipo}`;
  });
  return `Entidades do grupo:${SEPARADOR_LINHAS}${linhas.join(SEPARADOR_LINHAS)}`;
}

/**
 * Limpa a resposta do LLM: junta espaços e corta no limite.
 * @param {string} resposta - Texto devolvido pelo LLM.
 * @returns {string} Resumo limpo (vazio se a resposta não tiver texto).
 */
export function limparResumo(resposta: string): string {
  return resposta.replace(PADRAO_ESPACOS, ' ').trim().slice(0, LIMITE_RESUMO);
}

/**
 * Pede ao LLM o resumo de uma comunidade; null em qualquer falha ou resposta vazia.
 * @param {Comunidade} comunidade - Comunidade a resumir.
 * @param {{completarLlm: CompletarLlm, entidades: Map<string, Entidade>}} contexto - LLM e dados.
 * @returns {Promise<string | null>} Resumo, ou null para manter o resumo atual.
 */
async function resumirComunidade(
  comunidade: Comunidade,
  contexto: { completarLlm: CompletarLlm; entidades: Map<string, Entidade> },
): Promise<string | null> {
  if (comunidade.entity_ids.length === 0) return null;

  try {
    const resposta = await contexto.completarLlm({
      sistema: PROMPT_RESUMO_COMUNIDADE_SISTEMA,
      usuario: montarPedidoResumo(comunidade, contexto.entidades),
    });
    return limparResumo(resposta) || null;
  } catch {
    return null;
  }
}

/**
 * Executa uma tarefa para cada item, com no máximo `RESUMOS_PARALELOS` ao mesmo tempo.
 * @param {T[]} itens - Itens a processar.
 * @param {(item: T) => Promise<R>} tarefa - Função de cada item.
 * @returns {Promise<R[]>} Resultados na ordem dos itens.
 */
async function executarComLimite<T, R>(
  itens: T[],
  tarefa: (item: T) => Promise<R>,
): Promise<R[]> {
  const resultados = new Array<R>(itens.length);
  let proximo = 0;
  const trabalhador = async (): Promise<void> => {
    while (proximo < itens.length) {
      const posicao = proximo++;
      resultados[posicao] = await tarefa(itens[posicao]);
    }
  };
  await Promise.all(Array.from({ length: RESUMOS_PARALELOS }, trabalhador));
  return resultados;
}

/**
 * Gera o embedding de cada resumo, em lotes; o lote que falhar fica com null.
 * @param {string[]} resumos - Resumos das comunidades.
 * @param {(textos: string[]) => Promise<number[][]>} gerar - Gerador de embeddings.
 * @returns {Promise<(number[] | null)[]>} Um vetor (ou null) por resumo, na mesma ordem.
 */
export async function gerarEmbeddingsDosResumos(
  resumos: string[],
  gerar: (textos: string[]) => Promise<number[][]>,
): Promise<(number[] | null)[]> {
  const vetores: (number[] | null)[] = [];
  for (const lote of dividirEmLotes(resumos, LOTE_EMBEDDING)) {
    try {
      const gerados = await gerar(lote);
      const completo = gerados.length === lote.length;
      vetores.push(...(completo ? gerados : lote.map(() => null)));
    } catch {
      vetores.push(...lote.map(() => null));
    }
  }
  return vetores;
}

/**
 * Completa as comunidades: resumo pelo LLM e embedding do resumo, ambos opcionais.
 * Comunidade sem entidades mantém "Comunidade sem entidades." e fica sem embedding.
 * @param {GrafoComunidades} grafo - Saída de `detectarComunidades` (não é alterada).
 * @param {Entidade[]} entidades - Entidades do grafo, para as descrições do pedido.
 * @param {DependenciasResumoComunidades} dependencias - LLM e gerador de embeddings.
 * @returns {Promise<ResultadoResumoComunidades>} Novo grafo de comunidades e a contagem.
 */
export async function resumirComunidades(
  grafo: GrafoComunidades,
  entidades: Entidade[],
  dependencias: DependenciasResumoComunidades = {},
): Promise<ResultadoResumoComunidades> {
  const { completarLlm, gerarEmbeddings } = dependencias;
  const porNome = new Map(entidades.map((entidade) => [entidade.name, entidade]));
  const estatistica: EstatisticaResumo = { resumidasPorLlm: 0, falhasLlm: 0, comEmbedding: 0 };

  const novosResumos = completarLlm
    ? await executarComLimite(grafo.communities, (comunidade) =>
        resumirComunidade(comunidade, { completarLlm, entidades: porNome }),
      )
    : grafo.communities.map(() => null);

  const communities = grafo.communities.map((comunidade, posicao) => {
    const novo = novosResumos[posicao];
    if (novo) estatistica.resumidasPorLlm += 1;
    else if (completarLlm && comunidade.entity_ids.length > 0) estatistica.falhasLlm += 1;
    return { ...comunidade, summary: novo ?? comunidade.summary };
  });

  if (gerarEmbeddings) {
    const vetores = await gerarEmbeddingsDosResumos(
      communities.map((comunidade) => comunidade.summary),
      gerarEmbeddings,
    );
    communities.forEach((comunidade, posicao) => {
      const temMembros = comunidade.entity_ids.length > 0;
      comunidade.summary_embedding = temMembros ? vetores[posicao] : null;
      if (comunidade.summary_embedding) estatistica.comEmbedding += 1;
    });
  }
  return { grafo: { ...grafo, communities }, estatistica };
}
