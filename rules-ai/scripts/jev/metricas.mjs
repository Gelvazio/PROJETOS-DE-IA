// Métricas do benchmark do Jev (JEV-RULES-AI.3): funções puras, sem rede e sem chave.
// Acurácia, matriz de confusão 3×3, recall/precisão/F1 por nível, macro-F1, IC de Wilson,
// Brier multiclasse, ECE, curva cobertura × precisão, percentis, McNemar exato e bootstrap pareado.
import { ORDEM_NIVEIS } from './modelos.mjs';

const Z_95 = 1.959964;
const TAMANHO_FAIXA_ECE = 10;
const LIMIARES_CURVA = Object.freeze([0, 0.2, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
const REPETICOES_BOOTSTRAP = 2000;
const PERCENTIL_INFERIOR = 0.025;
const PERCENTIL_SUPERIOR = 0.975;
const MODULO_PRNG = 4294967296;

/**
 * Cria um gerador pseudoaleatório determinístico (mulberry32) para o bootstrap.
 * @param {number} semente Semente inteira.
 * @returns {() => number} Função que devolve números em [0, 1).
 */
export function criarGerador(semente) {
  let estado = semente >>> 0;
  return () => {
    estado = (estado + 0x6D2B79F5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / MODULO_PRNG;
  };
}

/**
 * Calcula a razão, ou null se o denominador for zero.
 * @param {number} numerador Numerador.
 * @param {number} denominador Denominador.
 * @returns {number|null} Razão ou null.
 */
export function razao(numerador, denominador) {
  return denominador === 0 ? null : numerador / denominador;
}

/**
 * Monta a matriz de confusão 3×3 (linhas = esperado, colunas = previsto).
 * @param {{esperado: string, previsto: string|null}[]} pares Pares esperado/previsto.
 * @returns {Record<string, Record<string, number>>} Contagens por [esperado][previsto].
 */
export function matrizConfusao(pares) {
  const matriz = Object.fromEntries(ORDEM_NIVEIS.map((e) => [e,
    Object.fromEntries(ORDEM_NIVEIS.map((p) => [p, 0]))]));
  for (const par of pares) {
    if (matriz[par.esperado] && ORDEM_NIVEIS.includes(par.previsto)) {
      matriz[par.esperado][par.previsto] += 1;
    }
  }
  return matriz;
}

/**
 * Acurácia: acertos sobre o total de pares (previsto nulo conta como erro).
 * @param {{esperado: string, previsto: string|null}[]} pares Pares.
 * @returns {number|null} Acurácia ou null sem pares.
 */
export function acuracia(pares) {
  return razao(pares.filter((par) => par.esperado === par.previsto).length, pares.length);
}

/**
 * Intervalo de confiança de Wilson (95%) para uma proporção.
 * @param {number} sucessos Acertos.
 * @param {number} total Total.
 * @returns {{inferior: number, superior: number}|null} IC ou null sem total.
 */
export function intervaloWilson(sucessos, total) {
  if (total === 0) return null;

  const p = sucessos / total;
  const z2 = Z_95 ** 2;
  const centro = (p + z2 / (2 * total)) / (1 + z2 / total);
  const margem = (Z_95 * Math.sqrt((p * (1 - p)) / total + z2 / (4 * total ** 2)))
    / (1 + z2 / total);
  return { inferior: Math.max(0, centro - margem), superior: Math.min(1, centro + margem) };
}

/**
 * Recall, precisão e F1 de um nível a partir da matriz de confusão.
 * @param {Record<string, Record<string, number>>} matriz Matriz de {@link matrizConfusao}.
 * @param {string} nivel Nível.
 * @returns {object} `{recall, precisao, f1, suporte, ic_recall}`.
 */
export function metricasDoNivel(matriz, nivel) {
  const acertos = matriz[nivel][nivel];
  const suporte = ORDEM_NIVEIS.reduce((soma, p) => soma + matriz[nivel][p], 0);
  const previstos = ORDEM_NIVEIS.reduce((soma, e) => soma + matriz[e][nivel], 0);
  const recall = razao(acertos, suporte);
  const precisao = razao(acertos, previstos);
  const f1 = recall !== null && precisao !== null && recall + precisao > 0
    ? (2 * recall * precisao) / (recall + precisao) : 0;
  return { recall, precisao, f1, suporte, ic_recall: intervaloWilson(acertos, suporte) };
}

/**
 * Macro-F1: média simples do F1 dos níveis que aparecem no esperado (suporte > 0).
 * @param {Record<string, Record<string, number>>} matriz Matriz de confusão.
 * @returns {number} Macro-F1.
 */
export function macroF1(matriz) {
  const comSuporte = ORDEM_NIVEIS.map((nivel) => metricasDoNivel(matriz, nivel))
    .filter((metricas) => metricas.suporte > 0);
  const f1s = comSuporte.map((metricas) => metricas.f1);
  return f1s.reduce((soma, f1) => soma + f1, 0) / f1s.length;
}

/**
 * Brier multiclasse médio: soma dos quadrados do erro de probabilidade por nível.
 * @param {{esperado: string, probabilidades: Record<string, number>|null}[]} itens Itens.
 * @returns {number|null} Brier médio, ou null sem probabilidades.
 */
export function brierMulticlasse(itens) {
  const comProb = itens.filter((item) => item.probabilidades);
  const erros = comProb.map((item) => ORDEM_NIVEIS.reduce((soma, nivel) => {
    const alvo = nivel === item.esperado ? 1 : 0;
    return soma + ((item.probabilidades[nivel] ?? 0) - alvo) ** 2;
  }, 0));
  return razao(erros.reduce((soma, erro) => soma + erro, 0), erros.length);
}

/**
 * ECE (erro de calibração esperado) em faixas iguais de confiança.
 * @param {{confianca: number, acertou: boolean}[]} itens Confiança do previsto e acerto.
 * @returns {number|null} ECE ou null sem itens.
 */
export function calcularEce(itens) {
  if (itens.length === 0) return null;

  let ece = 0;
  for (let faixa = 0; faixa < TAMANHO_FAIXA_ECE; faixa += 1) {
    const dentro = itens.filter((item) => Math.min(Math.floor(item.confianca
      * TAMANHO_FAIXA_ECE), TAMANHO_FAIXA_ECE - 1) === faixa);
    if (dentro.length === 0) continue;
    const taxa = dentro.filter((item) => item.acertou).length / dentro.length;
    const media = dentro.reduce((soma, item) => soma + item.confianca, 0) / dentro.length;
    ece += (dentro.length / itens.length) * Math.abs(taxa - media);
  }
  return ece;
}

/**
 * Curva cobertura × precisão: para cada limiar, quantos itens passam e quantos acertam.
 * @param {{confianca: number, acertou: boolean}[]} itens Itens com confiança e acerto.
 * @returns {{limiar: number, cobertura: number, precisao: number|null}[]} Pontos da curva.
 */
export function curvaCoberturaPrecisao(itens) {
  return LIMIARES_CURVA.map((limiar) => {
    const aceitos = itens.filter((item) => item.confianca >= limiar);
    const acertos = aceitos.filter((item) => item.acertou).length;
    return { limiar, cobertura: razao(aceitos.length, itens.length) ?? 0,
      precisao: razao(acertos, aceitos.length) };
  });
}

/**
 * Percentil por interpolação linear.
 * @param {number[]} valores Valores (qualquer ordem).
 * @param {number} fracao Fração em [0, 1] (0,5 = mediana).
 * @returns {number|null} Valor do percentil, ou null sem valores.
 */
export function percentil(valores, fracao) {
  if (valores.length === 0) return null;

  const ordenados = [...valores].sort((a, b) => a - b);
  const posicao = (ordenados.length - 1) * fracao;
  const abaixo = Math.floor(posicao);
  const acima = Math.ceil(posicao);
  return ordenados[abaixo] + (ordenados[acima] - ordenados[abaixo]) * (posicao - abaixo);
}

/**
 * Probabilidade acumulada da binomial B(n, 1/2) até k (soma exata).
 * @param {number} n Tentativas.
 * @param {number} k Limite superior (inclusive).
 * @returns {number} P(X ≤ k).
 */
function binomialAcumulada(n, k) {
  let termo = 0.5 ** n;
  let soma = termo;
  for (let i = 1; i <= k; i += 1) {
    termo = (termo * (n - i + 1)) / i;
    soma += termo;
  }
  return Math.min(1, soma);
}

/**
 * Teste de McNemar exato (bilateral) para dois classificadores nos mesmos itens.
 * @param {{a: boolean, b: boolean}[]} pareados Acerto de A e de B por item.
 * @returns {{so_a: number, so_b: number, p_valor: number|null}} Discordâncias e p-valor.
 */
export function mcnemarExato(pareados) {
  const soA = pareados.filter((par) => par.a && !par.b).length;
  const soB = pareados.filter((par) => !par.a && par.b).length;
  const discordantes = soA + soB;
  if (discordantes === 0) return { so_a: soA, so_b: soB, p_valor: null };

  const cauda = binomialAcumulada(discordantes, Math.min(soA, soB));
  return { so_a: soA, so_b: soB, p_valor: Math.min(1, 2 * cauda) };
}

/**
 * Bootstrap pareado da diferença de acurácia (A − B) com IC percentil de 95%.
 * @param {{a: boolean, b: boolean}[]} pareados Acerto de A e de B por item.
 * @param {number} semente Semente do gerador (resultado reproduzível).
 * @returns {{diferenca: number, inferior: number, superior: number}|null} Diferença e IC.
 */
export function bootstrapDiferenca(pareados, semente) {
  if (pareados.length === 0) return null;

  const sortear = criarGerador(semente);
  const diferencas = [];
  for (let r = 0; r < REPETICOES_BOOTSTRAP; r += 1) {
    let soma = 0;
    for (let i = 0; i < pareados.length; i += 1) {
      const par = pareados[Math.floor(sortear() * pareados.length)];
      soma += Number(par.a) - Number(par.b);
    }
    diferencas.push(soma / pareados.length);
  }
  const total = pareados.reduce((soma, par) => soma + Number(par.a) - Number(par.b), 0);
  return {
    diferenca: total / pareados.length,
    inferior: percentil(diferencas, PERCENTIL_INFERIOR),
    superior: percentil(diferencas, PERCENTIL_SUPERIOR),
  };
}
