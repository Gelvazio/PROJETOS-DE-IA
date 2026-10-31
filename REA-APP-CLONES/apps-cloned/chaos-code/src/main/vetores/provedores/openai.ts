/**
 * Provedor de embedding OpenAI (modo `Api` de `embedder_config.json`, inventário
 * `vetores-grafo.md` §2): `POST <endpoint>/v1/embeddings` com `Authorization: Bearer`. Serve
 * também para proxies compatíveis com a OpenAI. A chave vem da configuração já preenchida por
 * `preencherChavesEmbedder`; o `fetch` é injetado.
 */

import type { ModoEmbedding, ModoEmbeddingApi } from '../../../compartilhado/tipos-vetores';
import {
  CAMINHO_EMBEDDING_OPENAI,
  DIMENSOES_EMBEDDING_OPENAI_MAXIMA,
  DIMENSOES_EMBEDDING_OPENAI_MINIMA,
  URL_BASE_OPENAI_EMBEDDING,
} from '../constantes';
import {
  ErroLimiteTaxa,
  type FabricaProvedoresEmbedding,
  type ProvedorEmbedding,
} from '../provedor-embedding';

const STATUS_LIMITE_TAXA = 429;
const PREFIXO_MODELO_COM_DIMENSOES = 'text-embedding-3';
const CABECALHO_RETRY_AFTER = 'retry-after';
const LIMITE_TEXTO_ERRO = 300;
const MSG_ENTRADA_VAZIA = 'Input vazio para embedding';
const MSG_SEM_CHAVE = 'Chave da API OpenAI não configurada';
const MSG_DIMENSOES_INVALIDAS = 'Dimensões de embedding OpenAI fora do intervalo';
const MSG_SEM_EMBEDDING = 'No embedding produced';
const MSG_ERRO_API = 'OpenAI API error';

/** Resposta mínima de `fetch` usada pelo provedor (compatível com `Response`). */
export interface RespostaHttpEmbedding {
  ok: boolean;
  status: number;
  headers: { get(nome: string): string | null };
  json(): Promise<unknown>;
  text(): Promise<string>;
}

/** `fetch` injetado: só o que o provedor usa. */
export type BuscadorHttp = (
  url: string,
  opcoes: { method: 'POST'; headers: Record<string, string>; body: string },
) => Promise<RespostaHttpEmbedding>;

/** Item `data[i]` da resposta de `/v1/embeddings` (`ApiEmbeddingData`). */
interface ItemEmbeddingOpenAi {
  embedding: number[];
  index?: number;
}

/**
 * Monta a URL do endpoint de embeddings, sem barra dupla.
 * @param {string} endpoint - Endereço base (vazio usa o padrão da OpenAI).
 * @returns {string} URL completa de `/v1/embeddings`.
 */
export function montarUrlEmbeddingOpenAi(endpoint: string): string {
  const base = (endpoint.trim() || URL_BASE_OPENAI_EMBEDDING).replace(/\/+$/, '');
  return `${base}${CAMINHO_EMBEDDING_OPENAI}`;
}

/**
 * Lê o `Retry-After` (segundos) da resposta; ignora datas e valores inválidos.
 * @param {RespostaHttpEmbedding} resposta - Resposta HTTP 429.
 * @returns {number | null} Segundos, ou null.
 */
function lerRetryAfter(resposta: RespostaHttpEmbedding): number | null {
  const valor = resposta.headers.get(CABECALHO_RETRY_AFTER);
  if (valor === null) return null;
  const segundos = Number(valor);
  return Number.isFinite(segundos) && segundos > 0 ? segundos : null;
}

/**
 * Monta o corpo da requisição; `dimensions` só vai nos modelos `text-embedding-3*`.
 * @param {ModoEmbeddingApi} modo - Modo configurado.
 * @param {string[]} textos - Textos do lote.
 * @returns {string} Corpo JSON.
 */
function montarCorpo(modo: ModoEmbeddingApi, textos: string[]): string {
  const corpo: Record<string, unknown> = { model: modo.model, input: textos };
  if (modo.model.startsWith(PREFIXO_MODELO_COM_DIMENSOES)) corpo.dimensions = modo.dimensions;
  return JSON.stringify(corpo);
}

/**
 * Valida a resposta e devolve os vetores na ordem dos textos enviados.
 * @param {unknown} json - Corpo já decodificado.
 * @param {number} quantidade - Quantidade de textos enviados.
 * @returns {number[][]} Um vetor por texto.
 * @throws {Error} Se a resposta não trouxer um vetor por texto.
 */
function extrairVetores(json: unknown, quantidade: number): number[][] {
  const itens = (json as { data?: ItemEmbeddingOpenAi[] } | null)?.data;
  const completo = Array.isArray(itens) && itens.length === quantidade;
  if (!completo) throw new Error(`${MSG_SEM_EMBEDDING} (esperado ${quantidade})`);

  const ordenados = [...itens].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  if (ordenados.some((item) => !Array.isArray(item.embedding))) {
    throw new Error(MSG_SEM_EMBEDDING);
  }
  return ordenados.map((item) => item.embedding);
}

/**
 * Trata a resposta HTTP: 429 vira `ErroLimiteTaxa`; outro erro, `Error` com trecho do corpo.
 * @param {RespostaHttpEmbedding} resposta - Resposta recebida.
 * @returns {Promise<void>} Resolve se `ok`.
 * @throws {ErroLimiteTaxa} Se o status for 429.
 * @throws {Error} Se o status indicar outra falha.
 */
async function validarResposta(resposta: RespostaHttpEmbedding): Promise<void> {
  if (resposta.ok) return;
  if (resposta.status === STATUS_LIMITE_TAXA) throw new ErroLimiteTaxa(lerRetryAfter(resposta));

  const detalhe = (await resposta.text().catch(() => '')).slice(0, LIMITE_TEXTO_ERRO);
  throw new Error(`${MSG_ERRO_API} ${resposta.status}: ${detalhe}`);
}

/**
 * Valida o modo antes de montar o provedor.
 * @param {ModoEmbeddingApi} modo - Modo configurado.
 * @throws {Error} Se faltar a chave ou as dimensões estiverem fora de 1–4096.
 */
function validarModo(modo: ModoEmbeddingApi): void {
  if (!modo.api_key.trim()) throw new Error(MSG_SEM_CHAVE);
  const dimensoesValidas =
    Number.isInteger(modo.dimensions) &&
    modo.dimensions >= DIMENSOES_EMBEDDING_OPENAI_MINIMA &&
    modo.dimensions <= DIMENSOES_EMBEDDING_OPENAI_MAXIMA;
  if (!dimensoesValidas) throw new Error(`${MSG_DIMENSOES_INVALIDAS}: ${modo.dimensions}`);
}

/**
 * Cria o provedor OpenAI para o modo `Api`.
 * @param {ModoEmbeddingApi} modo - Modo com a chave já preenchida.
 * @param {BuscadorHttp} buscar - `fetch` injetado.
 * @returns {ProvedorEmbedding} Provedor pronto para uso.
 * @throws {Error} Se a chave faltar ou as dimensões forem inválidas.
 */
export function criarProvedorOpenAi(
  modo: ModoEmbeddingApi,
  buscar: BuscadorHttp,
): ProvedorEmbedding {
  validarModo(modo);
  const url = montarUrlEmbeddingOpenAi(modo.endpoint);

  return {
    tipo: 'Api',
    modelo: modo.model,
    dimensoes: modo.dimensions,
    async gerarEmbeddings(textos) {
      if (textos.length === 0 || textos.some((texto) => !texto.trim())) {
        throw new Error(MSG_ENTRADA_VAZIA);
      }
      const resposta = await buscar(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${modo.api_key}`,
        },
        body: montarCorpo(modo, textos),
      });
      await validarResposta(resposta);
      return extrairVetores(await resposta.json(), textos.length);
    },
  };
}

/**
 * Registra o provedor OpenAI na fábrica, para o tipo `Api`.
 * @param {FabricaProvedoresEmbedding} fabrica - Fábrica de provedores.
 * @param {BuscadorHttp} buscar - `fetch` injetado.
 * @returns {FabricaProvedoresEmbedding} A própria fábrica.
 */
export function registrarProvedorOpenAi(
  fabrica: FabricaProvedoresEmbedding,
  buscar: BuscadorHttp,
): FabricaProvedoresEmbedding {
  return fabrica.registrar('Api', (modo: ModoEmbedding) =>
    criarProvedorOpenAi(modo as ModoEmbeddingApi, buscar),
  );
}
