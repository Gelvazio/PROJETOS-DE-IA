/**
 * Similaridade de cosseno entre vetores, busca dos k mais parecidos e seleção MMR (relevância
 * máxima marginal). Funções puras, sem acesso a disco ou rede. O MMR usa o peso `LAMBDA_MMR`
 * do inventário (`docs/inventario/vetores-grafo.md` §5: 0,7; 0 = diversidade, 1 = relevância).
 */

import type { EntradaIndice } from '../../compartilhado/tipos-vetores';
import { LAMBDA_MMR } from './constantes';

const MSG_DIMENSOES_DIFERENTES = 'Vetores com dimensões diferentes';
const MSG_K_INVALIDO = 'O valor de k deve ser um inteiro maior ou igual a zero';
const MSG_LAMBDA_INVALIDO = 'O lambda do MMR deve estar entre 0 e 1';
const SIMILARIDADE_NORMA_ZERO = 0;
const PESO_TOTAL = 1;

/** Entrada do índice com a similaridade calculada em relação à consulta. */
export interface EntradaComPontuacao {
  entrada: EntradaIndice;
  pontuacao: number;
}

/** Opções da seleção MMR. */
export interface OpcoesMmr {
  /** Quantidade de entradas a selecionar. */
  k: number;
  /** Peso da relevância, de 0 (só diversidade) a 1 (só relevância). Padrão: `LAMBDA_MMR`. */
  lambda?: number;
}

/**
 * Calcula a norma euclidiana de um vetor.
 * @param {number[]} vetor - Vetor a medir.
 * @returns {number} Raiz da soma dos quadrados (0 para vetor vazio).
 */
export function calcularNorma(vetor: number[]): number {
  let somaQuadrados = 0;
  for (const valor of vetor) somaQuadrados += valor * valor;
  return Math.sqrt(somaQuadrados);
}

/**
 * Calcula o produto escalar de dois vetores de mesma dimensão.
 * @param {number[]} a - Primeiro vetor.
 * @param {number[]} b - Segundo vetor.
 * @returns {number} Soma dos produtos elemento a elemento.
 * @throws {Error} Se as dimensões forem diferentes.
 */
export function calcularProdutoEscalar(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`${MSG_DIMENSOES_DIFERENTES}: ${a.length} e ${b.length}`);
  }

  let soma = 0;
  for (let i = 0; i < a.length; i += 1) soma += a[i] * b[i];
  return soma;
}

/**
 * Calcula a similaridade de cosseno entre dois vetores.
 * @param {number[]} a - Primeiro vetor.
 * @param {number[]} b - Segundo vetor.
 * @returns {number} Valor entre -1 e 1; 0 se algum dos vetores tiver norma zero.
 * @throws {Error} Se as dimensões forem diferentes.
 */
export function calcularSimilaridadeCosseno(a: number[], b: number[]): number {
  const produtoEscalar = calcularProdutoEscalar(a, b);
  const normaA = calcularNorma(a);
  const normaB = calcularNorma(b);

  const temNormaZero = normaA === 0 || normaB === 0;
  if (temNormaZero) return SIMILARIDADE_NORMA_ZERO;

  return produtoEscalar / (normaA * normaB);
}

/**
 * Valida o valor de k das buscas.
 * @param {number} k - Quantidade pedida.
 * @returns {void}
 * @throws {Error} Se k não for inteiro maior ou igual a zero.
 */
function validarK(k: number): void {
  const kValido = Number.isInteger(k) && k >= 0;
  if (!kValido) throw new Error(`${MSG_K_INVALIDO}: ${k}`);
}

/**
 * Pontua cada entrada pela similaridade de cosseno com a consulta.
 * @param {number[]} consulta - Vetor da consulta.
 * @param {EntradaIndice[]} entradas - Entradas do índice vetorial.
 * @returns {EntradaComPontuacao[]} Entradas com pontuação, na ordem de entrada.
 * @throws {Error} Se alguma entrada tiver dimensão diferente da consulta.
 */
function pontuarEntradas(consulta: number[], entradas: EntradaIndice[]): EntradaComPontuacao[] {
  return entradas.map((entrada) => ({
    entrada,
    pontuacao: calcularSimilaridadeCosseno(consulta, entrada.embedding),
  }));
}

/**
 * Busca as k entradas mais parecidas com a consulta (top-k), da mais para a menos parecida.
 * @param {number[]} consulta - Vetor da consulta.
 * @param {EntradaIndice[]} entradas - Entradas do índice vetorial.
 * @param {number} k - Quantidade de resultados; menos entradas que k devolve todas.
 * @returns {EntradaComPontuacao[]} Até k entradas com a pontuação de cosseno.
 * @throws {Error} Se k for inválido ou alguma dimensão for diferente da consulta.
 */
export function buscarMaisParecidos(
  consulta: number[],
  entradas: EntradaIndice[],
  k: number,
): EntradaComPontuacao[] {
  validarK(k);

  const pontuadas = pontuarEntradas(consulta, entradas);
  pontuadas.sort((a, b) => b.pontuacao - a.pontuacao);
  return pontuadas.slice(0, k);
}

/**
 * Calcula a maior similaridade de um candidato com as entradas já escolhidas.
 * @param {EntradaComPontuacao} candidato - Candidato avaliado.
 * @param {EntradaComPontuacao[]} escolhidas - Entradas já selecionadas.
 * @returns {number} Maior cosseno com as escolhidas (0 se não houver nenhuma).
 */
function calcularMaiorSimilaridadeComEscolhidas(
  candidato: EntradaComPontuacao,
  escolhidas: EntradaComPontuacao[],
): number {
  let maior = 0;
  for (const escolhida of escolhidas) {
    const similaridade = calcularSimilaridadeCosseno(
      candidato.entrada.embedding,
      escolhida.entrada.embedding,
    );
    if (similaridade > maior) maior = similaridade;
  }
  return maior;
}

/**
 * Acha o índice do candidato com a maior pontuação MMR.
 * @param {EntradaComPontuacao[]} candidatos - Candidatos ainda não escolhidos.
 * @param {EntradaComPontuacao[]} escolhidas - Entradas já selecionadas.
 * @param {number} lambda - Peso da relevância, de 0 a 1.
 * @returns {number} Posição do melhor candidato em `candidatos`.
 */
function acharMelhorCandidatoMmr(
  candidatos: EntradaComPontuacao[],
  escolhidas: EntradaComPontuacao[],
  lambda: number,
): number {
  let melhorPosicao = 0;
  let melhorValor = -Infinity;

  candidatos.forEach((candidato, posicao) => {
    const redundancia = calcularMaiorSimilaridadeComEscolhidas(candidato, escolhidas);
    const valor = lambda * candidato.pontuacao - (PESO_TOTAL - lambda) * redundancia;
    if (valor > melhorValor) {
      melhorValor = valor;
      melhorPosicao = posicao;
    }
  });

  return melhorPosicao;
}

/**
 * Seleciona k entradas por relevância máxima marginal (MMR): equilibra a semelhança com a
 * consulta e a diferença entre as entradas já escolhidas.
 * @param {number[]} consulta - Vetor da consulta.
 * @param {EntradaIndice[]} entradas - Candidatos do índice vetorial.
 * @param {OpcoesMmr} opcoes - Quantidade `k` e peso `lambda` (padrão `LAMBDA_MMR`).
 * @returns {EntradaComPontuacao[]} Até k entradas, na ordem de escolha; a pontuação é o cosseno
 *   com a consulta.
 * @throws {Error} Se k ou lambda forem inválidos, ou alguma dimensão for diferente.
 */
export function selecionarMmr(
  consulta: number[],
  entradas: EntradaIndice[],
  opcoes: OpcoesMmr,
): EntradaComPontuacao[] {
  const { k, lambda = LAMBDA_MMR } = opcoes;
  validarK(k);

  const lambdaValido = lambda >= 0 && lambda <= PESO_TOTAL;
  if (!lambdaValido) throw new Error(`${MSG_LAMBDA_INVALIDO}: ${lambda}`);

  const candidatos = pontuarEntradas(consulta, entradas);
  const escolhidas: EntradaComPontuacao[] = [];

  while (escolhidas.length < k && candidatos.length > 0) {
    const posicao = acharMelhorCandidatoMmr(candidatos, escolhidas, lambda);
    escolhidas.push(...candidatos.splice(posicao, 1));
  }

  return escolhidas;
}
