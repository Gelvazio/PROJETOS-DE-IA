/**
 * Provedor de embedding do modo `Gemini` (inventário `vetores-grafo.md` §2): chama
 * `embedContent` (um texto) ou `batchEmbedContents` (vários) na API Gemini, com a chave no
 * cabeçalho `x-goog-api-key` e a dimensão em `output_dimensionality`. O `fetch` é injetado e a
 * chave vem da config já preenchida por `preencherChavesEmbedder`.
 */

import type { ModoEmbeddingGemini } from '../../../compartilhado/tipos-vetores';
import {
  ENDPOINT_GEMINI_EMBED_CONTEUDO,
  ENDPOINT_GEMINI_EMBED_LOTE,
  URL_BASE_GEMINI_EMBEDDING,
} from '../constantes';
import { ErroLimiteTaxa } from '../provedor-embedding';
import type { ProvedorEmbedding } from '../provedor-embedding';

const STATUS_LIMITE_TAXA = 429;
const CABECALHO_CHAVE = 'x-goog-api-key';
const CABECALHO_RETRY_AFTER = 'retry-after';
const PREFIXO_MODELO = 'models/';
const MSG_INPUT_VAZIO = 'Input vazio para embedding';
const MSG_SEM_EMBEDDING = 'No embedding produced';
const MSG_ERRO_API = 'Gemini API error';
const MSG_SEM_CHAVE = 'Chave de API do Gemini não configurada';

/** Resposta mínima do `fetch` usada pelo provedor (compatível com `Response`). */
export interface RespostaHttpGemini {
  ok: boolean;
  status: number;
  headers: { get(nome: string): string | null };
  text(): Promise<string>;
}

/** Função `fetch` injetável. */
export type FetchGemini = (
  url: string,
  opcoes: { method: string; headers: Record<string, string>; body: string },
) => Promise<RespostaHttpGemini>;

/** Dependências do provedor. */
export interface DependenciasProvedorGemini {
  fetch: FetchGemini;
}

/**
 * Lê o `Retry-After` (segundos) de uma resposta 429.
 * @param {RespostaHttpGemini} resposta - Resposta HTTP.
 * @returns {number | null} Segundos, ou null se ausente ou inválido.
 */
function lerRetryAfter(resposta: RespostaHttpGemini): number | null {
  const valor = resposta.headers.get(CABECALHO_RETRY_AFTER);
  if (valor === null) return null;
  const segundos = Number(valor);
  return Number.isFinite(segundos) ? segundos : null;
}

/**
 * Monta o corpo de um pedido de embedding de um texto.
 * @param {string} texto - Texto a vetorizar.
 * @param {ModoEmbeddingGemini} modo - Modo configurado.
 * @param {boolean} incluirModelo - Se o pedido de lote exige o campo `model`.
 * @returns {Record<string, unknown>} Corpo do pedido.
 */
function montarPedidoTexto(
  texto: string,
  modo: ModoEmbeddingGemini,
  incluirModelo: boolean,
): Record<string, unknown> {
  const pedido: Record<string, unknown> = {
    content: { parts: [{ text: texto }] },
    output_dimensionality: modo.dimensions,
  };
  if (incluirModelo) pedido.model = `${PREFIXO_MODELO}${modo.model}`;
  return pedido;
}

/**
 * Extrai os vetores (`values`) de uma lista de embeddings da resposta.
 * @param {unknown} embeddings - Campo `embeddings` (ou `embedding`) da resposta.
 * @returns {number[][]} Vetores lidos.
 * @throws {Error} Se a resposta não trouxer vetores.
 */
function extrairVetores(embeddings: unknown): number[][] {
  const lista = Array.isArray(embeddings) ? embeddings : [embeddings];
  const vetores = lista.map((item) => (item as { values?: number[] } | null)?.values);
  if (vetores.length === 0 || vetores.some((v) => !Array.isArray(v) || v.length === 0)) {
    throw new Error(MSG_SEM_EMBEDDING);
  }
  return vetores as number[][];
}

/**
 * Envia o pedido ao Gemini e devolve o JSON da resposta.
 * @param {string} url - Endereço completo do endpoint.
 * @param {unknown} corpo - Corpo do pedido.
 * @param {{modo: ModoEmbeddingGemini, deps: DependenciasProvedorGemini}} contexto - Chave e fetch.
 * @returns {Promise<Record<string, unknown>>} JSON da resposta.
 * @throws {ErroLimiteTaxa} No HTTP 429.
 * @throws {Error} Em outro status de erro.
 */
async function enviarPedido(
  url: string,
  corpo: unknown,
  contexto: { modo: ModoEmbeddingGemini; deps: DependenciasProvedorGemini },
): Promise<Record<string, unknown>> {
  const resposta = await contexto.deps.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', [CABECALHO_CHAVE]: contexto.modo.api_key },
    body: JSON.stringify(corpo),
  });

  if (resposta.status === STATUS_LIMITE_TAXA) throw new ErroLimiteTaxa(lerRetryAfter(resposta));
  const texto = await resposta.text();
  if (!resposta.ok) throw new Error(`${MSG_ERRO_API} (${resposta.status}): ${texto}`);
  return JSON.parse(texto) as Record<string, unknown>;
}

/**
 * Cria o provedor de embedding Gemini.
 * @param {ModoEmbeddingGemini} modo - Modo `Gemini` com a chave já preenchida.
 * @param {DependenciasProvedorGemini} deps - `fetch` injetado.
 * @returns {ProvedorEmbedding} Provedor pronto para a fábrica.
 * @throws {Error} Se a chave de API estiver vazia.
 */
export function criarProvedorGemini(
  modo: ModoEmbeddingGemini,
  deps: DependenciasProvedorGemini,
): ProvedorEmbedding {
  if (!modo.api_key) throw new Error(MSG_SEM_CHAVE);
  const urlBase = `${URL_BASE_GEMINI_EMBEDDING}/${modo.model}`;

  return {
    tipo: 'Gemini',
    modelo: modo.model,
    dimensoes: modo.dimensions,
    async gerarEmbeddings(textos: string[]): Promise<number[][]> {
      if (textos.length === 0) return [];
      if (textos.some((texto) => texto.trim() === '')) throw new Error(MSG_INPUT_VAZIO);

      const contexto = { modo, deps };
      if (textos.length === 1) {
        const url = `${urlBase}:${ENDPOINT_GEMINI_EMBED_CONTEUDO}`;
        const corpo = montarPedidoTexto(textos[0], modo, false);
        const resposta = await enviarPedido(url, corpo, contexto);
        return extrairVetores(resposta.embedding ?? resposta.embeddings);
      }

      const url = `${urlBase}:${ENDPOINT_GEMINI_EMBED_LOTE}`;
      const requests = textos.map((texto) => montarPedidoTexto(texto, modo, true));
      const resposta = await enviarPedido(url, { requests }, contexto);
      const vetores = extrairVetores(resposta.embeddings);
      if (vetores.length !== textos.length) throw new Error(MSG_SEM_EMBEDDING);
      return vetores;
    },
  };
}
