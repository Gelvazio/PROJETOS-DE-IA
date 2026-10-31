/**
 * Contrato dos provedores de embedding, fábrica por registro (Open/Closed) e política comum de
 * lote e novas tentativas após HTTP 429 (inventário `vetores-grafo.md` §2). As implementações
 * concretas (Api, Gemini, OpenRouter, Custom) ficam em módulos próprios e se registram aqui.
 */

import type { ModoEmbedding, TipoProvedorEmbedding } from '../../compartilhado/tipos-vetores';
import {
  ESPERA_BASE_429_SEGUNDOS,
  LOTE_EMBEDDING,
  LOTE_EMBEDDING_MAXIMO,
  LOTE_EMBEDDING_MINIMO,
  TENTATIVAS_429_EMBEDDING,
} from './constantes';

const MILISSEGUNDOS_POR_SEGUNDO = 1000;
const BASE_CRESCIMENTO_ESPERA = 2;
const MSG_MODO_DESCONHECIDO = 'Modo de embedding desconhecido';
const MSG_LOTE_INVALIDO = 'Tamanho de lote de embedding inválido';

/** Contrato que todo provedor de embedding cumpre. */
export interface ProvedorEmbedding {
  /** Tipo do provedor (campo `type` do modo). */
  readonly tipo: TipoProvedorEmbedding;
  /** Nome do modelo de embedding usado. */
  readonly modelo: string;
  /** Dimensão dos vetores devolvidos. */
  readonly dimensoes: number;
  /**
   * Gera os embeddings de uma lista de textos (já limitada ao tamanho de um lote).
   * @param {string[]} textos - Textos a vetorizar.
   * @returns {Promise<number[][]>} Um vetor por texto, na mesma ordem.
   * @throws {ErroLimiteTaxa} Quando o servidor responde HTTP 429.
   */
  gerarEmbeddings(textos: string[]): Promise<number[][]>;
}

/** Função que monta um provedor a partir do modo configurado. */
export type ConstrutorProvedorEmbedding = (modo: ModoEmbedding) => ProvedorEmbedding;

/** Erro de limite de taxa (HTTP 429), com o `Retry-After` em segundos quando o servidor enviou. */
export class ErroLimiteTaxa extends Error {
  readonly segundosRetryAfter: number | null;

  /**
   * @param {number | null} segundosRetryAfter - Valor do cabeçalho `Retry-After`, se houver.
   */
  constructor(segundosRetryAfter: number | null = null) {
    super('Limite de requisições de embedding excedido (HTTP 429)');
    this.name = 'ErroLimiteTaxa';
    this.segundosRetryAfter = segundosRetryAfter;
  }
}

/** Fábrica de provedores: cada tipo de modo registra o próprio construtor. */
export class FabricaProvedoresEmbedding {
  private readonly construtores = new Map<string, ConstrutorProvedorEmbedding>();

  /**
   * Registra (ou substitui) o construtor de um tipo de provedor.
   * @param {TipoProvedorEmbedding} tipo - Tipo do modo (`Api`, `Gemini`, ...).
   * @param {ConstrutorProvedorEmbedding} construtor - Monta o provedor a partir do modo.
   * @returns {this} A própria fábrica, para encadear registros.
   */
  registrar(tipo: TipoProvedorEmbedding, construtor: ConstrutorProvedorEmbedding): this {
    this.construtores.set(tipo, construtor);
    return this;
  }

  /**
   * Cria o provedor do modo configurado.
   * @param {ModoEmbedding} modo - Modo lido de `embedder_config.json`.
   * @returns {ProvedorEmbedding} Provedor pronto para uso.
   * @throws {Error} Se o tipo do modo não tiver construtor registrado.
   */
  criar(modo: ModoEmbedding): ProvedorEmbedding {
    const construtor = this.construtores.get(modo.type);
    if (!construtor) {
      const registrados = [...this.construtores.keys()].join(', ') || 'nenhum';
      throw new Error(`${MSG_MODO_DESCONHECIDO}: "${modo.type}" (registrados: ${registrados})`);
    }
    return construtor(modo);
  }
}

/** Opções da política de lote e novas tentativas. */
export interface OpcoesPoliticaEmbedding {
  /** Espera injetável, em milissegundos (padrão: `setTimeout`). */
  esperar?: (milissegundos: number) => Promise<void>;
  /** Textos por chamada (padrão: `LOTE_EMBEDDING`, entre 1 e 1000). */
  tamanhoLote?: number;
  /** Tentativas extras após o 429 (padrão: `TENTATIVAS_429_EMBEDDING`). */
  tentativasExtras?: number;
}

/**
 * Espera um tempo real (padrão da política).
 * @param {number} milissegundos - Tempo de espera.
 * @returns {Promise<void>} Resolve ao fim da espera.
 */
function esperarDeVerdade(milissegundos: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, milissegundos));
}

/**
 * Calcula a espera após um 429: `Retry-After` se válido, senão 5 × 2^tentativa segundos.
 * @param {number} tentativa - Número da nova tentativa já feita, começando em 0.
 * @param {number | null} segundosRetryAfter - Cabeçalho `Retry-After`, se houver.
 * @returns {number} Espera em milissegundos.
 */
export function calcularEsperaTentativaMs(
  tentativa: number,
  segundosRetryAfter: number | null,
): number {
  const retryAfterValido =
    segundosRetryAfter !== null && Number.isFinite(segundosRetryAfter) && segundosRetryAfter > 0;
  if (retryAfterValido) return segundosRetryAfter * MILISSEGUNDOS_POR_SEGUNDO;

  const segundos = ESPERA_BASE_429_SEGUNDOS * BASE_CRESCIMENTO_ESPERA ** tentativa;
  return segundos * MILISSEGUNDOS_POR_SEGUNDO;
}

/**
 * Executa uma operação e a repete após cada `ErroLimiteTaxa`, até o limite de tentativas.
 * @param {() => Promise<T>} operacao - Chamada ao provedor.
 * @param {OpcoesPoliticaEmbedding} opcoes - Espera e número de tentativas.
 * @returns {Promise<T>} Resultado da primeira chamada que der certo.
 * @throws {Error} O erro original se não for 429 ou se as tentativas acabarem.
 */
export async function executarComNovasTentativas<T>(
  operacao: () => Promise<T>,
  opcoes: OpcoesPoliticaEmbedding = {},
): Promise<T> {
  const esperar = opcoes.esperar ?? esperarDeVerdade;
  const tentativasExtras = opcoes.tentativasExtras ?? TENTATIVAS_429_EMBEDDING;

  for (let tentativa = 0; ; tentativa += 1) {
    try {
      return await operacao();
    } catch (erro) {
      const podeRepetir = erro instanceof ErroLimiteTaxa && tentativa < tentativasExtras;
      if (!podeRepetir) throw erro;
      await esperar(calcularEsperaTentativaMs(tentativa, erro.segundosRetryAfter));
    }
  }
}

/**
 * Divide uma lista em lotes de tamanho fixo (o último pode ser menor).
 * @param {T[]} itens - Itens a dividir.
 * @param {number} tamanhoLote - Itens por lote (1 a 1000).
 * @returns {T[][]} Lotes, na ordem original.
 * @throws {Error} Se o tamanho do lote for inválido.
 */
export function dividirEmLotes<T>(itens: T[], tamanhoLote: number): T[][] {
  const loteValido =
    Number.isInteger(tamanhoLote) &&
    tamanhoLote >= LOTE_EMBEDDING_MINIMO &&
    tamanhoLote <= LOTE_EMBEDDING_MAXIMO;
  if (!loteValido) throw new Error(`${MSG_LOTE_INVALIDO}: ${tamanhoLote}`);

  const lotes: T[][] = [];
  for (let inicio = 0; inicio < itens.length; inicio += tamanhoLote) {
    lotes.push(itens.slice(inicio, inicio + tamanhoLote));
  }
  return lotes;
}

/**
 * Gera embeddings de qualquer quantidade de textos: divide em lotes e repete cada lote no 429.
 * @param {ProvedorEmbedding} provedor - Provedor que gera os vetores de cada lote.
 * @param {string[]} textos - Textos a vetorizar.
 * @param {OpcoesPoliticaEmbedding} opcoes - Lote, tentativas e espera (injetável).
 * @returns {Promise<number[][]>} Um vetor por texto, na ordem de entrada.
 * @throws {Error} Se o lote for inválido ou um lote falhar de vez.
 */
export async function gerarEmbeddingsEmLotes(
  provedor: ProvedorEmbedding,
  textos: string[],
  opcoes: OpcoesPoliticaEmbedding = {},
): Promise<number[][]> {
  const lotes = dividirEmLotes(textos, opcoes.tamanhoLote ?? LOTE_EMBEDDING);
  const vetores: number[][] = [];

  for (const lote of lotes) {
    const vetoresDoLote = await executarComNovasTentativas(
      () => provedor.gerarEmbeddings(lote),
      opcoes,
    );
    vetores.push(...vetoresDoLote);
  }
  return vetores;
}
