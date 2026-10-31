/**
 * Grafo HNSW (Hierarchical Navigable Small World) da busca aproximada no índice vetorial, como o
 * `vector::index` do original (`docs/inventario/vetores-grafo.md` §3): M = 16,
 * efConstruction = 200 e nível de cada nó sorteado com `lambda = 1/ln M`. Funções puras sobre
 * vetores já normalizados (norma 1), em que a similaridade de cosseno é o produto escalar.
 *
 * *(Inferido)*: seleção simples dos M vizinhos mais parecidos (sem a heurística de diversidade),
 * camada 0 com 2 × M conexões e efSearch padrão 50 — o inventário não revela esses detalhes.
 */

import type { CamadaHnsw, IndiceHnsw } from '../../compartilhado/tipos-vetores';
import {
  HNSW_EF_BUSCA,
  HNSW_EF_CONSTRUCTION,
  HNSW_FATOR_CONEXOES_CAMADA_ZERO,
  HNSW_M,
} from './constantes';
import { calcularNorma, calcularProdutoEscalar } from './similaridade';

/** Menor M aceito: com M = 1, `ln M` = 0 e o `lambda` seria infinito. */
const HNSW_M_MINIMO = 2;
const EF_MINIMO = 1;
const CAMADA_BASE = 0;
const NIVEL_INICIAL = 0;
const EF_CAMADAS_SUPERIORES = 1;
const UM = 1;

const MSG_M_INVALIDO = 'O M do HNSW deve ser um inteiro maior ou igual a 2';
const MSG_EF_INVALIDO = 'O ef do HNSW deve ser um inteiro maior ou igual a 1';

/** Nó com a similaridade em relação ao vetor procurado. */
export interface CandidatoHnsw {
  /** Posição do nó (a mesma da entrada no índice). */
  posicao: number;
  /** Similaridade de cosseno com o vetor procurado. */
  similaridade: number;
}

/** Opções da construção do grafo. */
export interface OpcoesConstrucaoHnsw {
  /** Conexões por nó nas camadas superiores (padrão `HNSW_M`). */
  m?: number;
  /** Tamanho da lista de candidatos na construção (padrão `HNSW_EF_CONSTRUCTION`). */
  efConstruction?: number;
  /** Gerador de número aleatório em [0, 1) para o nível dos nós (padrão `Math.random`). */
  sortear?: () => number;
}

/** Opções da busca no grafo. */
export interface OpcoesBuscaHnsw {
  /** Quantidade de resultados. */
  k: number;
  /** Tamanho da lista de candidatos na camada 0 (padrão `HNSW_EF_BUSCA`, nunca menor que k). */
  ef?: number;
}

/** Grafo e os vetores normalizados de onde ele foi montado (sempre usados juntos). */
export interface ContextoHnsw {
  indice: IndiceHnsw;
  vetores: number[][];
}

/** Ponto de partida e alcance de uma busca numa camada. */
interface BuscaCamada {
  entradas: CandidatoHnsw[];
  ef: number;
  camada: number;
}

/** Listas de trabalho da busca numa camada. */
interface EstadoBuscaCamada {
  visitados: Set<number>;
  candidatos: CandidatoHnsw[];
  resultados: CandidatoHnsw[];
  ef: number;
}

/**
 * Normaliza um vetor para norma 1; vetor de norma zero vira vetor de zeros.
 * @param {number[]} vetor - Vetor original (não é alterado).
 * @returns {number[]} Cópia normalizada.
 */
export function normalizarVetor(vetor: number[]): number[] {
  const norma = calcularNorma(vetor);
  if (norma === 0) return vetor.map(() => 0);
  return vetor.map((valor) => valor / norma);
}

/**
 * Garante que o valor é um inteiro maior ou igual ao mínimo.
 * @param {number} valor - Valor a conferir.
 * @param {number} minimo - Menor valor aceito.
 * @param {string} mensagem - Mensagem do erro.
 * @returns {void}
 * @throws {Error} Se o valor não for inteiro ou for menor que o mínimo.
 */
function validarInteiroMinimo(valor: number, minimo: number, mensagem: string): void {
  const valido = Number.isInteger(valor) && valor >= minimo;
  if (!valido) throw new Error(`${mensagem}: ${valor}`);
}

/**
 * Monta o candidato de um nó em relação ao vetor procurado.
 * @param {ContextoHnsw} contexto - Grafo e vetores.
 * @param {number[]} consulta - Vetor procurado (normalizado).
 * @param {number} posicao - Posição do nó.
 * @returns {CandidatoHnsw} Nó com a similaridade.
 */
function criarCandidato(
  contexto: ContextoHnsw,
  consulta: number[],
  posicao: number,
): CandidatoHnsw {
  return { posicao, similaridade: calcularProdutoEscalar(consulta, contexto.vetores[posicao]) };
}

/**
 * Insere um candidato numa lista ordenada da maior para a menor similaridade.
 * @param {CandidatoHnsw[]} lista - Lista ordenada (é alterada).
 * @param {CandidatoHnsw} candidato - Candidato a inserir.
 * @returns {void}
 */
function inserirOrdenado(lista: CandidatoHnsw[], candidato: CandidatoHnsw): void {
  let inicio = 0;
  let fim = lista.length;
  while (inicio < fim) {
    const meio = (inicio + fim) >>> 1;
    if (lista[meio].similaridade >= candidato.similaridade) inicio = meio + UM;
    else fim = meio;
  }
  lista.splice(inicio, 0, candidato);
}

/**
 * Lê os vizinhos de um nó numa camada.
 * @param {IndiceHnsw} indice - Grafo.
 * @param {number} camada - Camada (0 = base).
 * @param {number} posicao - Posição do nó.
 * @returns {number[]} Vizinhos (lista vazia se o nó não está na camada).
 */
function obterVizinhos(indice: IndiceHnsw, camada: number, posicao: number): number[] {
  return indice.layers[camada]?.neighbors[posicao] ?? [];
}

/**
 * Visita os vizinhos ainda não vistos de um nó e guarda os que cabem nos resultados.
 * @param {ContextoHnsw} contexto - Grafo e vetores.
 * @param {{ consulta: number[]; camada: number; atual: CandidatoHnsw }} visita - Vetor
 *   procurado, camada e nó cujos vizinhos serão visitados.
 * @param {EstadoBuscaCamada} estado - Listas de trabalho (são alteradas).
 * @returns {void}
 */
function expandirVizinhos(
  contexto: ContextoHnsw,
  visita: { consulta: number[]; camada: number; atual: CandidatoHnsw },
  estado: EstadoBuscaCamada,
): void {
  const { visitados, candidatos, resultados, ef } = estado;
  for (const vizinho of obterVizinhos(contexto.indice, visita.camada, visita.atual.posicao)) {
    if (visitados.has(vizinho)) continue;
    visitados.add(vizinho);

    const novo = criarCandidato(contexto, visita.consulta, vizinho);
    const pior = resultados[resultados.length - UM];
    const cabeNosResultados = resultados.length < ef || novo.similaridade > pior.similaridade;
    if (!cabeNosResultados) continue;

    inserirOrdenado(candidatos, novo);
    inserirOrdenado(resultados, novo);
    if (resultados.length > ef) resultados.pop();
  }
}

/**
 * Busca gulosa numa camada: parte das entradas e segue os vizinhos enquanto houver candidato
 * melhor que o pior dos `ef` resultados.
 * @param {ContextoHnsw} contexto - Grafo e vetores.
 * @param {number[]} consulta - Vetor procurado (normalizado).
 * @param {BuscaCamada} busca - Pontos de partida, `ef` e camada.
 * @returns {CandidatoHnsw[]} Até `ef` nós, do mais para o menos parecido.
 */
function buscarNaCamada(
  contexto: ContextoHnsw,
  consulta: number[],
  busca: BuscaCamada,
): CandidatoHnsw[] {
  const candidatos = [...busca.entradas].sort((a, b) => b.similaridade - a.similaridade);
  const estado: EstadoBuscaCamada = {
    visitados: new Set(busca.entradas.map((entrada) => entrada.posicao)),
    candidatos,
    resultados: candidatos.slice(0, busca.ef),
    ef: busca.ef,
  };

  while (estado.candidatos.length > 0) {
    const atual = estado.candidatos.shift() as CandidatoHnsw;
    const pior = estado.resultados[estado.resultados.length - UM];
    const naoMelhoraMais =
      estado.resultados.length >= busca.ef && atual.similaridade < pior.similaridade;
    if (naoMelhoraMais) break;
    expandirVizinhos(contexto, { consulta, camada: busca.camada, atual }, estado);
  }

  return estado.resultados;
}

/**
 * Diz quantas conexões cada nó pode ter numa camada (a camada 0 tem o dobro).
 * @param {IndiceHnsw} indice - Grafo.
 * @param {number} camada - Camada.
 * @returns {number} Limite de vizinhos por nó.
 */
function obterLimiteConexoes(indice: IndiceHnsw, camada: number): number {
  if (camada === CAMADA_BASE) return indice.max_connections * HNSW_FATOR_CONEXOES_CAMADA_ZERO;
  return indice.max_connections;
}

/**
 * Cria as camadas que faltam até a camada pedida, com uma lista vazia de vizinhos por nó.
 * @param {IndiceHnsw} indice - Grafo (é alterado).
 * @param {number} camada - Camada mais alta necessária.
 * @param {number} totalNos - Quantidade de nós do grafo.
 * @returns {void}
 */
function garantirCamadas(indice: IndiceHnsw, camada: number, totalNos: number): void {
  while (indice.layers.length <= camada) {
    const novaCamada: CamadaHnsw = { neighbors: Array.from({ length: totalNos }, () => []) };
    indice.layers.push(novaCamada);
  }
}

/**
 * Corta a lista de vizinhos de um nó, mantendo os mais parecidos com ele.
 * @param {ContextoHnsw} contexto - Grafo e vetores (o grafo é alterado).
 * @param {number} posicao - Nó cuja lista passou do limite.
 * @param {{ camada: number; limite: number }} corte - Camada e limite de vizinhos.
 * @returns {void}
 */
function podarVizinhos(
  contexto: ContextoHnsw,
  posicao: number,
  corte: { camada: number; limite: number },
): void {
  const lista = contexto.indice.layers[corte.camada].neighbors;
  const vetorNo = contexto.vetores[posicao];
  const ordenados = lista[posicao]
    .map((vizinho) => criarCandidato(contexto, vetorNo, vizinho))
    .sort((a, b) => b.similaridade - a.similaridade);
  lista[posicao] = ordenados.slice(0, corte.limite).map((candidato) => candidato.posicao);
}

/**
 * Liga um nó aos vizinhos escolhidos, nos dois sentidos, respeitando o limite da camada.
 * @param {ContextoHnsw} contexto - Grafo e vetores (o grafo é alterado).
 * @param {number} posicao - Nó novo.
 * @param {{ vizinhos: CandidatoHnsw[]; camada: number }} ligacao - Vizinhos (do mais para o
 *   menos parecido) e camada.
 * @returns {void}
 */
function conectar(
  contexto: ContextoHnsw,
  posicao: number,
  ligacao: { vizinhos: CandidatoHnsw[]; camada: number },
): void {
  const { camada } = ligacao;
  const limite = obterLimiteConexoes(contexto.indice, camada);
  const lista = contexto.indice.layers[camada].neighbors;
  lista[posicao] = ligacao.vizinhos.slice(0, limite).map((vizinho) => vizinho.posicao);

  for (const vizinho of lista[posicao]) {
    lista[vizinho].push(posicao);
    if (lista[vizinho].length > limite) podarVizinhos(contexto, vizinho, { camada, limite });
  }
}

/**
 * Desce pelas camadas superiores com ef = 1, do topo até a camada logo acima da pedida.
 * @param {ContextoHnsw} contexto - Grafo e vetores.
 * @param {number[]} consulta - Vetor procurado (normalizado).
 * @param {number} camadaFinal - Camada onde a descida para (não é visitada).
 * @returns {CandidatoHnsw[]} Melhor ponto de entrada para a camada final.
 */
function descerCamadas(
  contexto: ContextoHnsw,
  consulta: number[],
  camadaFinal: number,
): CandidatoHnsw[] {
  const { indice } = contexto;
  let atual = [criarCandidato(contexto, consulta, indice.entry_point as number)];
  for (let camada = indice.max_level; camada > camadaFinal; camada -= UM) {
    atual = buscarNaCamada(contexto, consulta, {
      entradas: atual,
      ef: EF_CAMADAS_SUPERIORES,
      camada,
    });
  }
  return atual;
}

/**
 * Insere um nó no grafo: desce até o nível sorteado e liga o nó em cada camada até a base.
 * @param {ContextoHnsw} contexto - Grafo e vetores (o grafo é alterado).
 * @param {number} posicao - Nó novo.
 * @param {number} nivel - Nível sorteado para o nó.
 * @returns {void}
 */
function inserirNo(contexto: ContextoHnsw, posicao: number, nivel: number): void {
  const { indice } = contexto;
  garantirCamadas(indice, nivel, contexto.vetores.length);
  indice.node_levels[posicao] = nivel;

  if (indice.entry_point === null) {
    indice.entry_point = posicao;
    indice.entry_point_level = nivel;
    indice.max_level = nivel;
    return;
  }

  const consulta = contexto.vetores[posicao];
  let atual = descerCamadas(contexto, consulta, nivel);
  for (let camada = Math.min(nivel, indice.max_level); camada >= CAMADA_BASE; camada -= UM) {
    const busca = { entradas: atual, ef: indice.ef_construction, camada };
    atual = buscarNaCamada(contexto, consulta, busca);
    const vizinhos = atual.filter((candidato) => candidato.posicao !== posicao);
    conectar(contexto, posicao, { vizinhos, camada });
  }

  if (nivel <= indice.max_level) return;
  indice.entry_point = posicao;
  indice.entry_point_level = nivel;
  indice.max_level = nivel;
}

/**
 * Sorteia o nível de um nó: `floor(-ln(U) × lambda)`, com U em (0, 1].
 * @param {number} lambda - Fator de nível (`1/ln M`).
 * @param {() => number} sortear - Gerador em [0, 1).
 * @returns {number} Nível do nó (0 = só a camada base).
 */
function sortearNivel(lambda: number, sortear: () => number): number {
  return Math.floor(-Math.log(UM - sortear()) * lambda);
}

/**
 * Monta o grafo HNSW de todos os vetores, na ordem dada (a posição de cada nó é a do vetor).
 * @param {number[][]} vetores - Vetores normalizados (veja `normalizarVetor`), todos da mesma
 *   dimensão.
 * @param {OpcoesConstrucaoHnsw} opcoes - M, efConstruction e gerador aleatório.
 * @returns {IndiceHnsw} Grafo no formato `HnswIndex` do original.
 * @throws {Error} Se M ou efConstruction forem inválidos, ou as dimensões diferirem.
 */
export function construirHnsw(
  vetores: number[][],
  opcoes: OpcoesConstrucaoHnsw = {},
): IndiceHnsw {
  const m = opcoes.m ?? HNSW_M;
  const efConstruction = opcoes.efConstruction ?? HNSW_EF_CONSTRUCTION;
  validarInteiroMinimo(m, HNSW_M_MINIMO, MSG_M_INVALIDO);
  validarInteiroMinimo(efConstruction, EF_MINIMO, MSG_EF_INVALIDO);

  const indice: IndiceHnsw = {
    lambda: UM / Math.log(m),
    layers: [],
    entry_point: null,
    entry_point_level: NIVEL_INICIAL,
    max_connections: m,
    ef_construction: efConstruction,
    max_level: NIVEL_INICIAL,
    node_levels: [],
  };
  const contexto: ContextoHnsw = { indice, vetores };
  const sortear = opcoes.sortear ?? Math.random;

  vetores.forEach((_, posicao) => {
    inserirNo(contexto, posicao, sortearNivel(indice.lambda, sortear));
  });
  return indice;
}

/**
 * Busca os k nós mais parecidos com a consulta no grafo HNSW.
 * @param {ContextoHnsw} grafo - Grafo montado por `construirHnsw` e os mesmos vetores
 *   normalizados usados na construção.
 * @param {number[]} consulta - Vetor da consulta, normalizado.
 * @param {OpcoesBuscaHnsw} opcoes - Quantidade `k` e `ef` da busca.
 * @returns {CandidatoHnsw[]} Até k nós, do mais para o menos parecido.
 * @throws {Error} Se o ef for inválido ou a dimensão da consulta for diferente.
 */
export function buscarHnsw(
  grafo: ContextoHnsw,
  consulta: number[],
  opcoes: OpcoesBuscaHnsw,
): CandidatoHnsw[] {
  if (grafo.indice.entry_point === null || opcoes.k === 0) return [];

  const ef = Math.max(opcoes.ef ?? HNSW_EF_BUSCA, opcoes.k);
  validarInteiroMinimo(ef, EF_MINIMO, MSG_EF_INVALIDO);

  const entradas = descerCamadas(grafo, consulta, CAMADA_BASE);
  const resultados = buscarNaCamada(grafo, consulta, { entradas, ef, camada: CAMADA_BASE });
  return resultados.slice(0, opcoes.k);
}
