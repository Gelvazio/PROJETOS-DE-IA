/**
 * Reordenação (`graph::rerank`, `LlmReranker`): pede ao LLM notas de 0 a 10 para cada documento
 * candidato e reordena. Mantém a ordem original se o número de notas for diferente do número de
 * candidatos, se o JSON falhar ou se estourar o tempo limite (inventário `vetores-grafo.md` §5).
 * O cliente do LLM é injetado (Dependency Inversion).
 */

import type { ConfiguracaoReordenacao } from '../../compartilhado/tipos-vetores';
import { PROMPT_REORDENACAO_SISTEMA, montarPromptReordenacao } from './prompts';
import {
  CANDIDATOS_REORDENACAO,
  NOTA_MAXIMA_REORDENACAO,
  PADROES_PIPELINE_RAG,
  TEMPO_LIMITE_REORDENACAO_MS,
  TOP_K_FINAL_REORDENACAO,
} from '../vetores/constantes';

const NOTA_MINIMA_REORDENACAO = 0;
const SEPARADOR_DOCUMENTOS = '\n';
const PADRAO_OBJETO_JSON = /\{[\s\S]*\}/;
const MSG_TEMPO_LIMITE = 'Tempo limite da reordenação esgotado';

/** Pedido enviado ao LLM da reordenação. */
export interface PedidoReordenacaoLlm {
  /** Mensagem de sistema. */
  sistema: string;
  /** Pedido do usuário. */
  usuario: string;
}

/** Cliente do LLM: recebe o pedido e devolve o texto da resposta. */
export type CompletarLlm = (pedido: PedidoReordenacaoLlm) => Promise<string>;

/** Documento candidato à reordenação. */
export interface DocumentoCandidato {
  id: string;
  texto: string;
}

/** Documento com a nota dada pelo LLM. */
export interface DocumentoReordenado extends DocumentoCandidato {
  /** Nota de 0 a 10. */
  nota: number;
}

/** Dependências da reordenação. */
export interface DependenciasReordenacao {
  completarLlm: CompletarLlm;
}

/** Resultado da reordenação. */
export interface ResultadoReordenacao {
  /** Documentos na ordem final (no máximo `top_k_final`). */
  documentos: DocumentoCandidato[];
  /** Notas dos documentos devolvidos; vazio quando a ordem original foi mantida. */
  notas: number[];
  /** Verdadeiro quando o LLM reordenou; falso quando a ordem original foi mantida. */
  reordenou: boolean;
}

/**
 * Monta a lista numerada de documentos do pedido.
 * @param {DocumentoCandidato[]} candidatos - Documentos a avaliar.
 * @returns {string} Uma linha por documento, no formato `[i] texto`.
 */
export function formatarDocumentos(candidatos: DocumentoCandidato[]): string {
  return candidatos
    .map((candidato, posicao) => `[${posicao}] ${candidato.texto}`)
    .join(SEPARADOR_DOCUMENTOS);
}

/**
 * Lê as notas da resposta do LLM (`{"scores": [...]}`).
 * @param {string} resposta - Texto devolvido pelo LLM.
 * @returns {number[] | null} Notas, ou null se o JSON for inválido ou não tiver só números.
 */
export function lerNotas(resposta: string): number[] | null {
  const trecho = PADRAO_OBJETO_JSON.exec(resposta);
  if (!trecho) return null;

  try {
    const dados: unknown = JSON.parse(trecho[0]);
    const scores = (dados as { scores?: unknown }).scores;
    const saoNumeros = Array.isArray(scores) && scores.every((nota) => Number.isFinite(nota));
    return saoNumeros ? (scores as number[]) : null;
  } catch {
    return null;
  }
}

/**
 * Limita a nota à escala de 0 a 10.
 * @param {number} nota - Nota bruta do LLM.
 * @returns {number} Nota dentro da escala.
 */
function limitarNota(nota: number): number {
  return Math.min(NOTA_MAXIMA_REORDENACAO, Math.max(NOTA_MINIMA_REORDENACAO, nota));
}

/**
 * Executa a chamada ao LLM com tempo limite.
 * @param {Promise<string>} chamada - Chamada em andamento.
 * @param {number} tempoLimiteMs - Tempo limite em milissegundos.
 * @returns {Promise<string>} Resposta do LLM.
 * @throws {Error} Se o tempo limite esgotar.
 */
async function comTempoLimite(chamada: Promise<string>, tempoLimiteMs: number): Promise<string> {
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<never>((_, rejeitar) => {
    temporizador = setTimeout(() => rejeitar(new Error(MSG_TEMPO_LIMITE)), tempoLimiteMs);
  });

  try {
    return await Promise.race([chamada, limite]);
  } finally {
    clearTimeout(temporizador);
  }
}

/**
 * Ordena os candidatos pela nota (maior primeiro); empate mantém a ordem original.
 * @param {DocumentoCandidato[]} candidatos - Documentos avaliados.
 * @param {number[]} notas - Uma nota por candidato.
 * @returns {DocumentoReordenado[]} Documentos com nota, da mais para a menos relevante.
 */
export function ordenarPorNota(
  candidatos: DocumentoCandidato[],
  notas: number[],
): DocumentoReordenado[] {
  return candidatos
    .map((candidato, posicao) => ({ ...candidato, nota: limitarNota(notas[posicao]), posicao }))
    .sort((a, b) => b.nota - a.nota || a.posicao - b.posicao)
    .map(({ id, texto, nota }) => ({ id, texto, nota }));
}

/**
 * Pede as notas ao LLM; devolve null em qualquer falha (erro, tempo limite ou JSON inválido).
 * @param {string} consulta - Consulta do usuário.
 * @param {DocumentoCandidato[]} candidatos - Documentos a avaliar.
 * @param {{completarLlm: CompletarLlm, tempoLimiteMs: number}} contexto - LLM e tempo limite.
 * @returns {Promise<number[] | null>} Notas lidas, ou null.
 */
async function pedirNotas(
  consulta: string,
  candidatos: DocumentoCandidato[],
  contexto: { completarLlm: CompletarLlm; tempoLimiteMs: number },
): Promise<number[] | null> {
  const usuario = montarPromptReordenacao({
    consulta,
    documentos: formatarDocumentos(candidatos),
  });

  try {
    const pedido = { sistema: PROMPT_REORDENACAO_SISTEMA, usuario };
    const resposta = await comTempoLimite(
      contexto.completarLlm(pedido),
      contexto.tempoLimiteMs,
    );
    return lerNotas(resposta);
  } catch {
    return null;
  }
}

/**
 * Reordena os candidatos por relevância à consulta usando o LLM. Considera só os primeiros
 * `max_candidates` e devolve no máximo `top_k_final`. Se o LLM falhar, estourar o tempo ou
 * devolver número de notas diferente do de candidatos, mantém a ordem original.
 * @param {string} consulta - Consulta do usuário.
 * @param {DocumentoCandidato[]} candidatos - Documentos já ordenados pela busca.
 * @param {DependenciasReordenacao} dependencias - Cliente do LLM.
 * @param {Partial<ConfiguracaoReordenacao>} [configuracao] - Ajustes; padrão do pipeline RAG.
 * @returns {Promise<ResultadoReordenacao>} Documentos na ordem final.
 */
export async function reordenarDocumentos(
  consulta: string,
  candidatos: DocumentoCandidato[],
  dependencias: DependenciasReordenacao,
  configuracao: Partial<ConfiguracaoReordenacao> = {},
): Promise<ResultadoReordenacao> {
  const padrao: Partial<ConfiguracaoReordenacao> = PADROES_PIPELINE_RAG.rerank ?? {};
  const maxCandidatos =
    configuracao.max_candidates ?? padrao.max_candidates ?? CANDIDATOS_REORDENACAO;
  const topK = configuracao.top_k_final ?? padrao.top_k_final ?? TOP_K_FINAL_REORDENACAO;
  const tempoLimiteMs = configuracao.timeout_ms ?? TEMPO_LIMITE_REORDENACAO_MS;

  const avaliados = candidatos.slice(0, maxCandidatos);
  const mantida: ResultadoReordenacao = {
    documentos: candidatos.slice(0, topK),
    notas: [],
    reordenou: false,
  };
  if (avaliados.length === 0) return mantida;

  const notas = await pedirNotas(consulta, avaliados, {
    completarLlm: dependencias.completarLlm,
    tempoLimiteMs,
  });
  if (!notas || notas.length !== avaliados.length) return mantida;

  const ordenados = ordenarPorNota(avaliados, notas).slice(0, topK);
  return {
    documentos: ordenados.map(({ id, texto }) => ({ id, texto })),
    notas: ordenados.map((documento) => documento.nota),
    reordenou: true,
  };
}
