/**
 * Transformação da consulta (`graph::query_transform`): `multi_query` pede ao LLM variações da
 * pergunta (`{"queries": [...]}`) e `hy_d_e` (HyDE) pede uma resposta hipotética para buscar pelo
 * embedding dela (inventário `vetores-grafo.md` §5). Qualquer falha do LLM, ou transformação
 * desligada, devolve só a consulta original. O cliente do LLM é injetado.
 * *(Inferido)*: no HyDE a busca usa só o texto hipotético, e no multi_query a original vem
 * primeiro, seguida das variações sem repetição.
 */

import type { ConfiguracaoTransformacaoConsulta } from '../../compartilhado/tipos-vetores';
import { PADROES_PIPELINE_RAG, SUB_CONSULTAS_MAXIMAS } from '../vetores/constantes';
import {
  PROMPT_RESPOSTA_HIPOTETICA_SISTEMA,
  PROMPT_VARIACOES_CONSULTA_SISTEMA,
  montarPromptRespostaHipotetica,
  montarPromptVariacoesConsulta,
} from './prompts';
import type { CompletarLlm } from './reordenacao';

const PADRAO_OBJETO_JSON = /\{[\s\S]*\}/;
const ESTRATEGIA_PADRAO = 'multi_query';

/** Dependências da transformação. */
export interface DependenciasTransformacao {
  completarLlm: CompletarLlm;
}

/** Resultado da transformação. */
export interface ResultadoTransformacao {
  /** Textos a buscar: a original e as variações, ou só a resposta hipotética (HyDE). */
  consultas: string[];
  /** Verdadeiro quando o LLM gerou algo; falso quando ficou só a consulta original. */
  transformou: boolean;
}

/**
 * Lê as variações da resposta do LLM (`{"queries": [...]}`).
 * @param {string} resposta - Texto devolvido pelo LLM.
 * @returns {string[] | null} Variações em texto, ou null se o JSON for inválido.
 */
export function lerVariacoes(resposta: string): string[] | null {
  const trecho = PADRAO_OBJETO_JSON.exec(resposta);
  if (!trecho) return null;

  try {
    const queries = (JSON.parse(trecho[0]) as { queries?: unknown }).queries;
    if (!Array.isArray(queries)) return null;
    return queries.filter((item): item is string => typeof item === 'string');
  } catch {
    return null;
  }
}

/**
 * Junta a original e as variações, sem vazias nem repetidas (ignora caixa), até o limite.
 * @param {string} consulta - Consulta original (sempre a primeira).
 * @param {string[]} variacoes - Variações geradas.
 * @param {number} maximo - Máximo de variações aproveitadas.
 * @returns {string[]} Consultas a buscar.
 */
export function juntarVariacoes(consulta: string, variacoes: string[], maximo: number): string[] {
  const vistas = new Set([consulta.trim().toLowerCase()]);
  const consultas = [consulta];

  for (const variacao of variacoes) {
    const texto = variacao.trim();
    const chave = texto.toLowerCase();
    if (consultas.length > maximo) break;
    if (!texto || vistas.has(chave)) continue;
    vistas.add(chave);
    consultas.push(texto);
  }
  return consultas;
}

/**
 * Gera as variações da consulta (estratégia `multi_query`).
 * @param {string} consulta - Consulta original.
 * @param {CompletarLlm} completarLlm - Cliente do LLM.
 * @param {number} maximo - Variações pedidas ao LLM e aproveitadas.
 * @returns {Promise<string[] | null>} Consultas (original + variações), ou null se não houver.
 */
async function gerarVariacoes(
  consulta: string,
  completarLlm: CompletarLlm,
  maximo: number,
): Promise<string[] | null> {
  const usuario = montarPromptVariacoesConsulta({ consulta, quantidade: maximo });
  const resposta = await completarLlm({ sistema: PROMPT_VARIACOES_CONSULTA_SISTEMA, usuario });
  const variacoes = lerVariacoes(resposta);
  if (!variacoes) return null;

  const consultas = juntarVariacoes(consulta, variacoes, maximo);
  return consultas.length > 1 ? consultas : null;
}

/**
 * Gera a resposta hipotética da pergunta (estratégia HyDE).
 * @param {string} consulta - Pergunta do usuário.
 * @param {CompletarLlm} completarLlm - Cliente do LLM.
 * @returns {Promise<string[] | null>} Lista com a resposta hipotética, ou null se vier vazia.
 */
async function gerarRespostaHipotetica(
  consulta: string,
  completarLlm: CompletarLlm,
): Promise<string[] | null> {
  const usuario = montarPromptRespostaHipotetica(consulta);
  const resposta = await completarLlm({ sistema: PROMPT_RESPOSTA_HIPOTETICA_SISTEMA, usuario });
  const texto = resposta.trim();
  return texto ? [texto] : null;
}

/**
 * Transforma a consulta conforme a estratégia configurada. Desligada, sem texto, erro do LLM,
 * JSON inválido ou resposta vazia → devolve só a consulta original.
 * @param {string} consulta - Consulta do usuário.
 * @param {DependenciasTransformacao} dependencias - Cliente do LLM.
 * @param {Partial<ConfiguracaoTransformacaoConsulta>} [configuracao] - Ajustes; o padrão do
 *   pipeline RAG vem desligado, então quem chama costuma passar `enabled: true`.
 * @returns {Promise<ResultadoTransformacao>} Consultas a buscar.
 */
export async function transformarConsulta(
  consulta: string,
  dependencias: DependenciasTransformacao,
  configuracao: Partial<ConfiguracaoTransformacaoConsulta> = {},
): Promise<ResultadoTransformacao> {
  const padrao: Partial<ConfiguracaoTransformacaoConsulta> =
    PADROES_PIPELINE_RAG.query_transform ?? {};
  const ativa = configuracao.enabled ?? padrao.enabled ?? false;
  const estrategia = configuracao.strategy ?? padrao.strategy ?? ESTRATEGIA_PADRAO;
  const maximo = configuracao.max_sub_queries ?? padrao.max_sub_queries ?? SUB_CONSULTAS_MAXIMAS;
  const original: ResultadoTransformacao = { consultas: [consulta], transformou: false };
  if (!ativa || !consulta.trim() || maximo < 1) return original;

  try {
    const { completarLlm } = dependencias;
    const consultas =
      estrategia === 'hy_d_e'
        ? await gerarRespostaHipotetica(consulta, completarLlm)
        : await gerarVariacoes(consulta, completarLlm, maximo);
    return consultas ? { consultas, transformou: true } : original;
  } catch {
    return original;
  }
}
