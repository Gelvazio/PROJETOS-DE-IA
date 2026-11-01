/**
 * Serviço de consulta (`query_knowledge` do original): busca no índice vetorial e no grafo
 * conforme o modo (`local`, `global`, `hybrid`), com transformação da consulta
 * (`multi_query`/`hy_d_e`), reordenação pelo LLM e escolha adaptativa do modo.
 * Inventário: `vetores-grafo.md` §5.
 *
 * *(Inferido)*: `local` junta pedaços e entidades, `global` junta resumos de comunidades, e
 * `hybrid` junta os dois com prefixo `hybrid:` quando os dois modos contribuem; o modo
 * adaptativo marca "global" pelas palavras-gatilho do binário.
 */

import type { Comunidade, Entidade, Relacao } from '../../compartilhado/tipos-grafo';
import type {
  ConfiguracaoPipelineRag,
  ModoBusca,
  ResultadoBusca,
  TipoResultadoBusca,
} from '../../compartilhado/tipos-vetores';
import type { OpcoesBuscaIndexacao, ResultadoBuscaPedaco } from '../vetores/indexacao.servico';
import { normalizarNome, type RepositorioGrafo } from './grafo.repositorio';
import { descreverComunidadeParaBusca } from './comunidades';
import { transformarConsulta } from './transformar-consulta';
import { reordenarDocumentos, type CompletarLlm, type DocumentoCandidato } from './reordenacao';

/** Recorte do serviço de indexação usado pela consulta. */
export interface BuscadorVetores {
  buscar(
    idProjeto: string,
    consulta: string,
    opcoes?: OpcoesBuscaIndexacao,
  ): Promise<ResultadoBuscaPedaco[]>;
}

/** Dependências injetadas no serviço de consulta. */
export interface DependenciasServicoConsulta {
  buscadorVetores: BuscadorVetores;
  repositorioGrafo: RepositorioGrafo;
  /** LLM para transformar e reordenar (opcional; sem ele os dois passos ficam desligados). */
  completarLlm?: CompletarLlm;
  /** `rag_pipeline_config.json` (transformação, rerank, adaptive, mmr). */
  configuracaoRag?: ConfiguracaoPipelineRag;
  registrarLog?: (mensagem: string) => void;
}

/** Opções de uma consulta (`query_knowledge`: `query`, `topK`, `mode`). */
export interface OpcoesConsulta {
  modo?: ModoBusca;
  topK?: number;
}

/** Resultado da consulta, com o prefixo do tipo no `id` (como no original). */
export interface ResultadoConsulta extends ResultadoBusca {
  id: string;
  tipo: TipoResultadoBusca;
  texto: string;
  pontuacao: number;
}

/** Erro de consulta (consulta vazia/longa, topK ou modo inválido). */
export class ErroConsulta extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroConsulta';
  }
}

const TAMANHO_MAXIMO_CONSULTA = 10_000;
const TOP_K_PADRAO = 5;
const TOP_K_MINIMO = 1;
const TOP_K_MAXIMO = 100;
const K_CANDIDATOS_VETORES = 20;
const LIMITE_ENTIDADES_LOCAL = 20;
const PONTUACAO_ENTIDADE = 0.8;
const PONTUACAO_COMUNIDADE = 0.8;
const PONTUACAO_RELACAO = 0.6;

/** Palavras que marcam pergunta "global" no modo adaptativo (arq. `0x822fe9` do binário). */
const GATILHOS_GLOBAIS = [
  'quais', 'todos', 'todas', 'liste', 'listar', 'resuma', 'resumir', 'resumo',
  'visão geral', 'overview', 'explique', 'descreva', 'principais', 'como funciona',
  'what are', 'list all', 'summarize', 'describe',
];

const MODOS_VALIDOS: readonly ModoBusca[] = ['local', 'global', 'hybrid'];
const SEPARADOR_PREFIXO = ':';

/**
 * Divide a consulta em termos normalizados para a busca por texto.
 * @param {string} consulta - Pergunta do usuário.
 * @returns {string[]} Termos em minúsculas, sem acento e sem vazios.
 */
function termosDaConsulta(consulta: string): string[] {
  return normalizarNome(consulta)
    .split(/\s+/)
    .filter((termo) => termo.length > 2);
}

/**
 * Diz se o texto cobre algum termo da consulta.
 * @param {string} texto - Texto candidato.
 * @param {string[]} termos - Termos normalizados.
 * @returns {boolean} true quando algum termo aparece no texto.
 */
function cobreTermo(texto: string, termos: string[]): boolean {
  const normalizado = normalizarNome(texto);
  return termos.some((termo) => normalizado.includes(termo));
}

/**
 * Escolhe o modo no adaptativo: "global" quando a pergunta tem gatilho global, senão "hybrid".
 * @param {string} consulta - Pergunta do usuário.
 * @returns {ModoBusca} Modo escolhido.
 */
function escolherModoAdaptativo(consulta: string): ModoBusca {
  const texto = consulta.toLowerCase();
  return GATILHOS_GLOBAIS.some((gatilho) => texto.includes(gatilho)) ? 'global' : 'hybrid';
}

/** Serviço de consulta ao conhecimento do projeto. */
export class ServicoConsulta {
  private readonly deps: DependenciasServicoConsulta;

  constructor(dependencias: DependenciasServicoConsulta) {
    this.deps = dependencias;
  }

  /**
   * Responde a pergunta buscando pedaços, entidades e comunidades do projeto.
   * @param {string} idProjeto - ID do projeto.
   * @param {string} consulta - Pergunta (até 10.000 caracteres).
   * @param {OpcoesConsulta} opcoes - Modo e topK.
   * @returns {Promise<ResultadoConsulta[]>} Resultados ordenados, no máximo `topK`.
   * @throws {ErroConsulta} Se a consulta, o topK ou o modo forem inválidos.
   */
  async consultar(
    idProjeto: string,
    consulta: string,
    opcoes: OpcoesConsulta = {},
  ): Promise<ResultadoConsulta[]> {
    const texto = this.validarConsulta(consulta);
    const topK = this.validarTopK(opcoes.topK);
    const modo = this.resolverModo(texto, opcoes.modo);
    const consultas = await this.transformar(texto);
    const encontrados = await this.buscarNosModos(idProjeto, consultas, modo, topK);
    return this.reordenar(texto, encontrados, topK);
  }

  /**
   * Valida a consulta (1 a 10.000 caracteres).
   * @param {string} consulta - Pergunta bruta.
   * @returns {string} Texto aparado.
   * @throws {ErroConsulta} Se vazia ou longa demais.
   */
  private validarConsulta(consulta: string): string {
    const texto = consulta.trim();
    if (!texto) throw new ErroConsulta('Campo "consulta" não pode ser vazio');
    if (texto.length > TAMANHO_MAXIMO_CONSULTA) {
      throw new ErroConsulta(`Consulta excede ${TAMANHO_MAXIMO_CONSULTA} caracteres`);
    }
    return texto;
  }

  /**
   * Valida o topK (1–100, padrão 5).
   * @param {number | undefined} topK - Quantidade pedida.
   * @returns {number} topK validado.
   * @throws {ErroConsulta} Se fora da faixa.
   */
  private validarTopK(topK: number | undefined): number {
    const valor = topK ?? TOP_K_PADRAO;
    if (!Number.isInteger(valor) || valor < TOP_K_MINIMO || valor > TOP_K_MAXIMO) {
      throw new ErroConsulta(`Campo "topK" deve ser inteiro entre ${TOP_K_MINIMO} e ${TOP_K_MAXIMO}`);
    }
    return valor;
  }

  /**
   * Resolve o modo: adaptativo (quando ligado e sem modo pedido) ou o modo informado.
   * @param {string} consulta - Pergunta.
   * @param {ModoBusca | undefined} modo - Modo pedido.
   * @returns {ModoBusca} Modo efetivo.
   * @throws {ErroConsulta} Se o modo for desconhecido.
   */
  private resolverModo(consulta: string, modo: ModoBusca | undefined): ModoBusca {
    if (modo !== undefined) {
      if (!MODOS_VALIDOS.includes(modo)) throw new ErroConsulta('Modo de busca inválido');
      return modo;
    }
    const adaptativo = this.deps.configuracaoRag?.adaptive?.enabled === true;
    return adaptativo ? escolherModoAdaptativo(consulta) : 'hybrid';
  }

  /**
   * Aplica a transformação da consulta (multi_query/hyde) quando ligada e há LLM.
   * @param {string} consulta - Pergunta.
   * @returns {Promise<string[]>} Consultas a buscar.
   */
  private async transformar(consulta: string): Promise<string[]> {
    const { completarLlm, configuracaoRag } = this.deps;
    if (!completarLlm) return [consulta];
    const resultado = await transformarConsulta(
      consulta,
      { completarLlm },
      configuracaoRag?.query_transform ?? {},
    );
    return resultado.consultas;
  }

  /**
   * Busca as consultas nos modos escolhidos e junta os resultados sem repetir ids.
   * @param {string} idProjeto - ID do projeto.
   * @param {string[]} consultas - Consultas (original + variações).
   * @param {ModoBusca} modo - Modo efetivo.
   * @param {number} topK - Máximo de candidatos a manter.
   * @returns {Promise<ResultadoConsulta[]>} Candidatos mesclados.
   */
  private async buscarNosModos(
    idProjeto: string,
    consultas: string[],
    modo: ModoBusca,
    topK: number,
  ): Promise<ResultadoConsulta[]> {
    const encontrados = new Map<string, ResultadoConsulta>();
    const juntar = (lista: ResultadoConsulta[]): void => {
      for (const item of lista) {
        const anterior = encontrados.get(item.id);
        if (!anterior || item.pontuacao > anterior.pontuacao) encontrados.set(item.id, item);
      }
    };
    const buscaLocal = modo === 'local' || modo === 'hybrid';
    const buscaGlobal = modo === 'global' || modo === 'hybrid';
    for (const consulta of consultas) {
      if (buscaLocal) juntar(await this.buscarLocal(idProjeto, consulta, topK));
      if (buscaGlobal) juntar(await this.buscarGlobal(idProjeto, consulta));
    }
    const lista = [...encontrados.values()].sort((a, b) => b.pontuacao - a.pontuacao);
    if (modo === 'hybrid') return lista.slice(0, topK);
    return lista;
  }

  /**
   * Modo `local`: pedaços do índice vetorial + entidades e relações que cobrem os termos.
   * @param {string} idProjeto - ID do projeto.
   * @param {string} consulta - Pergunta.
   * @param {number} topK - k da busca vetorial.
   * @returns {Promise<ResultadoConsulta[]>} Resultados locais.
   */
  private async buscarLocal(
    idProjeto: string,
    consulta: string,
    topK: number,
  ): Promise<ResultadoConsulta[]> {
    const pedacos = await this.deps.buscadorVetores.buscar(idProjeto, consulta, {
      k: Math.max(topK, K_CANDIDATOS_VETORES),
    });
    const resultados: ResultadoConsulta[] = pedacos.map((pedaco) => ({
      id: `chunk${SEPARADOR_PREFIXO}${pedaco.id}`,
      tipo: 'chunk',
      texto: pedaco.texto,
      pontuacao: pedaco.pontuacao,
    }));
    const termos = termosDaConsulta(consulta);
    if (termos.length === 0) return resultados;
    const { entidades, relacoes } = await this.deps.repositorioGrafo.carregar(idProjeto);
    resultados.push(
      ...this.entidadesQueCobrem(entidades, termos).map((entidade) => ({
        id: `entity${SEPARADOR_PREFIXO}${entidade.name}`,
        tipo: 'entity' as TipoResultadoBusca,
        texto: `${entidade.name}: ${entidade.description}`,
        pontuacao: entidade.confidence * PONTUACAO_ENTIDADE,
      })),
      ...this.relacoesQueCobrem(relacoes, termos).map((relacao) => ({
        id: `relation${SEPARADOR_PREFIXO}${relacao.source_entity}-${relacao.target_entity}`,
        tipo: 'relation' as TipoResultadoBusca,
        texto: `${relacao.source_entity} ${relacao.relation_type} ${relacao.target_entity}: ${relacao.description}`,
        pontuacao: PONTUACAO_RELACAO * relacao.weight,
      })),
    );
    return resultados;
  }

  /**
   * Entidades cujo nome, apelidos ou descrição cobrem algum termo da consulta.
   * @param {Entidade[]} entidades - Entidades do grafo.
   * @param {string[]} termos - Termos normalizados.
   * @returns {Entidade[]} As que cobrem, no máximo `LIMITE_ENTIDADES_LOCAL`.
   */
  private entidadesQueCobrem(entidades: Entidade[], termos: string[]): Entidade[] {
    return entidades
      .filter((entidade) => {
        const campos = [entidade.name, entidade.description, entidade.profile ?? '',
          ...entidade.aliases].join(' ');
        return cobreTermo(campos, termos);
      })
      .slice(0, LIMITE_ENTIDADES_LOCAL);
  }

  /**
   * Relações cujas pontas ou descrição cobrem algum termo da consulta.
   * @param {Relacao[]} relacoes - Relações do grafo.
   * @param {string[]} termos - Termos normalizados.
   * @returns {Relacao[]} As que cobrem.
   */
  private relacoesQueCobrem(relacoes: Relacao[], termos: string[]): Relacao[] {
    return relacoes.filter((relacao) => {
      const campos = [
        relacao.source_entity, relacao.target_entity, relacao.description,
        ...relacao.keywords,
      ].join(' ');
      return cobreTermo(campos, termos);
    });
  }

  /**
   * Modo `global`: resumos de comunidades que cobrem os termos da consulta.
   * @param {string} idProjeto - ID do projeto.
   * @param {string} consulta - Pergunta.
   * @returns {Promise<ResultadoConsulta[]>} Resultados globais.
   */
  private async buscarGlobal(
    idProjeto: string,
    consulta: string,
  ): Promise<ResultadoConsulta[]> {
    const termos = termosDaConsulta(consulta);
    if (termos.length === 0) return [];
    const grafo = await this.deps.repositorioGrafo.carregarComunidades(idProjeto);
    return grafo.communities
      .filter((comunidade) =>
        cobreTermo(descreverComunidadeParaBusca(comunidade as Comunidade), termos))
      .map((comunidade) => ({
        id: `community${SEPARADOR_PREFIXO}${comunidade.id}`,
        tipo: 'community_summary' as TipoResultadoBusca,
        texto: comunidade.summary,
        pontuacao: PONTUACAO_COMUNIDADE,
      }));
  }

  /**
   * Reordena pelo LLM quando ligado; senão mantém a ordem por pontuação. Sempre limita a topK.
   * @param {string} consulta - Pergunta original.
   * @param {ResultadoConsulta[]} encontrados - Candidatos.
   * @param {number} topK - Máximo final.
   * @returns {Promise<ResultadoConsulta[]>} Resultados finais.
   */
  private async reordenar(
    consulta: string,
    encontrados: ResultadoConsulta[],
    topK: number,
  ): Promise<ResultadoConsulta[]> {
    const { completarLlm, configuracaoRag } = this.deps;
    const rerankAtivo = Boolean(completarLlm) && configuracaoRag?.rerank?.enabled === true;
    if (!rerankAtivo) return encontrados.slice(0, topK);
    const candidatos: DocumentoCandidato[] = encontrados.map((item) => ({
      id: item.id,
      texto: item.texto,
    }));
    const resultado = await reordenarDocumentos(
      consulta,
      candidatos,
      { completarLlm: completarLlm as CompletarLlm },
      configuracaoRag?.rerank ?? {},
    );
    if (!resultado.reordenou) return encontrados.slice(0, topK);
    const porId = new Map(encontrados.map((item) => [item.id, item]));
    return resultado.documentos
      .map((documento) => porId.get(documento.id))
      .filter((item): item is ResultadoConsulta => item !== undefined)
      .slice(0, topK);
  }
}
