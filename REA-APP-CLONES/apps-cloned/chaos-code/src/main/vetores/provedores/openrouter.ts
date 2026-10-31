/**
 * Provedor de embedding do modo `OpenRouter` (inventário `vetores-grafo.md` §2). O chat vai pelo
 * OpenRouter, mas o embedding usa `embedding_endpoint` próprio (padrão `https://api.openai.com`),
 * no formato da OpenAI (`/v1/embeddings`). A chave de embedding cai para a `api_key` se vazia.
 */

import type { ModoEmbeddingOpenRouter } from '../../../compartilhado/tipos-vetores';
import { CAMINHO_EMBEDDING_OPENAI, ENDPOINT_EMBEDDING_OPENROUTER_PADRAO } from '../constantes';
import { ErroLimiteTaxa, type ProvedorEmbedding } from '../provedor-embedding';

const STATUS_LIMITE_TAXA = 429;
const CABECALHO_RETRY_AFTER = 'retry-after';
const MSG_FALHA_HTTP = 'Falha na chamada de embedding do OpenRouter (HTTP';
const MSG_RESPOSTA_INVALIDA = 'Resposta de embedding do OpenRouter inválida';
const MSG_SEM_CHAVE = 'Chave de API de embedding do OpenRouter não configurada';

/** Dependências do provedor OpenRouter. */
export interface DependenciasProvedorOpenRouter {
  /** `fetch` injetado (testável). */
  buscar: typeof fetch;
}

/** Item `data[i]` da resposta no formato OpenAI. */
interface ItemEmbeddingResposta {
  index?: number;
  embedding?: unknown;
}

/**
 * Junta o endereço base ao caminho de embeddings, sem barras duplicadas.
 * @param {string} endpoint - `embedding_endpoint` (vazio usa o padrão).
 * @returns {string} URL completa de `/v1/embeddings`.
 */
export function montarUrlEmbeddingOpenRouter(endpoint: string): string {
  const base = (endpoint.trim() || ENDPOINT_EMBEDDING_OPENROUTER_PADRAO).replace(/\/+$/, '');
  return base.endsWith(CAMINHO_EMBEDDING_OPENAI) ? base : `${base}${CAMINHO_EMBEDDING_OPENAI}`;
}

/**
 * Lê o `Retry-After` (em segundos) de uma resposta 429.
 * @param {Response} resposta - Resposta HTTP.
 * @returns {number | null} Segundos, ou null se ausente ou inválido.
 */
function lerRetryAfter(resposta: Response): number | null {
  const valor = Number(resposta.headers.get(CABECALHO_RETRY_AFTER));
  return Number.isFinite(valor) && valor > 0 ? valor : null;
}

/**
 * Valida o corpo e devolve os vetores na ordem dos textos.
 * @param {unknown} corpo - JSON da resposta.
 * @param {number} quantidade - Quantidade de textos enviados.
 * @returns {number[][]} Um vetor por texto.
 * @throws {Error} Se o formato não for o esperado.
 */
function extrairVetores(corpo: unknown, quantidade: number): number[][] {
  const itens = (corpo as { data?: ItemEmbeddingResposta[] } | null)?.data;
  if (!Array.isArray(itens) || itens.length !== quantidade) {
    throw new Error(MSG_RESPOSTA_INVALIDA);
  }
  const ordenados = [...itens].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  return ordenados.map((item) => {
    if (!Array.isArray(item.embedding)) throw new Error(MSG_RESPOSTA_INVALIDA);
    return item.embedding as number[];
  });
}

/**
 * Cria o provedor de embedding do modo OpenRouter.
 * @param {ModoEmbeddingOpenRouter} modo - Modo já com as chaves preenchidas do cofre.
 * @param {DependenciasProvedorOpenRouter} dependencias - `fetch` injetado.
 * @returns {ProvedorEmbedding} Provedor pronto para a política de lote.
 */
export function criarProvedorOpenRouter(
  modo: ModoEmbeddingOpenRouter,
  dependencias: DependenciasProvedorOpenRouter,
): ProvedorEmbedding {
  const url = montarUrlEmbeddingOpenRouter(modo.embedding_endpoint);

  return {
    tipo: 'OpenRouter',
    modelo: modo.embedding_model,
    dimensoes: modo.dimensions,
    async gerarEmbeddings(textos: string[]): Promise<number[][]> {
      const chave = modo.embedding_api_key || modo.api_key;
      if (!chave) throw new Error(MSG_SEM_CHAVE);

      const resposta = await dependencias.buscar(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${chave}` },
        body: JSON.stringify({
          model: modo.embedding_model,
          input: textos,
          dimensions: modo.dimensions,
        }),
      });
      if (resposta.status === STATUS_LIMITE_TAXA) {
        throw new ErroLimiteTaxa(lerRetryAfter(resposta));
      }
      if (!resposta.ok) throw new Error(`${MSG_FALHA_HTTP} ${resposta.status})`);
      return extrairVetores(await resposta.json(), textos.length);
    },
  };
}
