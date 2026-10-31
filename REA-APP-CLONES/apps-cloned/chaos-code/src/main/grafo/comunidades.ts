/**
 * Detecção de comunidades do grafo de conhecimento: recria o `graph::community` do original
 * (docs/inventario/vetores-grafo.md, seção 4; arquivos-locais.md, `communities.json`).
 *
 * Algoritmo comprovado na desmontagem (função VA `0x140173fff`): **Louvain só na fase 1**
 * (movimento local, sem agregar níveis):
 * - ganho de mover o nó i para a comunidade C: `k_i,in(C) − Σtot(C) · k_i / (2m)`
 *   (`mulsd`/`divsd`/`subsd` em VA `0x140175171`; `2m` por `addsd xmm8, xmm8` em `0x140174a6d`);
 * - peso da aresta = `max(weight, 0.1)` (`maxss` com o float 0,1 de `0x14081fbcc`);
 * - no máximo 20 passadas (`cmp eax, 0x14` em VA `0x140174a79`), para antes se nada mudar;
 * - peso total ≤ ε (`0x14081fbf0`, 2,2e-16) → cada entidade fica sozinha;
 * - todas as comunidades com `level` 0 e resumo com até 10 membros (montagem em VA
 *   `0x14017382a`).
 * Diferença intencional: o original percorre os nós na ordem de um `HashMap` (aleatória); aqui a
 * ordem é estável (nomes ordenados), para o resultado sair igual a cada execução.
 */
import type {
  Comunidade,
  Entidade,
  GrafoComunidades,
  Relacao,
} from '../../compartilhado/tipos-grafo';
import {
  montarResumoComunidade,
  montarTextoComunidadeComEntidades,
  TEXTO_COMUNIDADE_SEM_ENTIDADES,
} from './prompts';

/** Peso mínimo de uma aresta (o original usa `max(weight, 0.1)`). */
const PESO_MINIMO_ARESTA = 0.1;
/** Máximo de passadas do movimento local (original: 20). */
const MAXIMO_PASSADAS = 20;
/** Peso total abaixo disso = grafo sem arestas (original: ε de f64). */
const PESO_TOTAL_MINIMO = Number.EPSILON;
/** Quantos membros entram no resumo sem LLM (original: 10). */
const LIMITE_MEMBROS_RESUMO = 10;
/** Quantos membros formam as palavras-chave *(inferido: o original não mostra como são feitas)*. */
const LIMITE_PALAVRAS_CHAVE = 3;
/** Nível único: o original não monta hierarquia. */
const NIVEL_COMUNIDADE = 0;
const SEPARADOR_MEMBROS = ', ';

/** Grafo não dirigido e ponderado, com os nós por índice. */
interface GrafoPonderado {
  /** Nomes das entidades, em ordem alfabética (o índice é a posição). */
  nos: string[];
  /** Vizinhos de cada nó: índice do vizinho → peso somado das arestas. */
  vizinhos: Map<number, number>[];
  /** Grau ponderado `k_i` de cada nó. */
  graus: number[];
  /** Soma dos pesos de todas as arestas (`m`). */
  pesoTotal: number;
}

/** Estado do movimento local. */
interface EstadoLouvain {
  grafo: GrafoPonderado;
  /** Comunidade de cada nó. */
  comunidadeDoNo: number[];
  /** `Σtot` de cada comunidade: soma dos graus dos membros. */
  somaGraus: number[];
}

/**
 * Junta os nomes das entidades e das pontas das relações, sem repetir e em ordem estável.
 * @param entidades - Entidades do grafo.
 * @param relacoes - Relações do grafo.
 * @returns Nomes ordenados.
 */
function listarNos(entidades: Entidade[], relacoes: Relacao[]): string[] {
  const nomes = new Set(entidades.map((entidade) => entidade.name));
  for (const relacao of relacoes) {
    nomes.add(relacao.source_entity);
    nomes.add(relacao.target_entity);
  }
  return [...nomes].sort((a, b) => a.localeCompare(b));
}

/**
 * Soma o peso de uma aresta nos dois sentidos e nos graus das duas pontas.
 * @param grafo - Grafo em montagem (alterado).
 * @param aresta - Índices das duas pontas e peso já com o mínimo aplicado.
 */
function adicionarAresta(
  grafo: GrafoPonderado,
  aresta: { origem: number; destino: number; peso: number },
): void {
  const { origem, destino, peso } = aresta;
  grafo.vizinhos[origem].set(destino, (grafo.vizinhos[origem].get(destino) ?? 0) + peso);
  grafo.vizinhos[destino].set(origem, (grafo.vizinhos[destino].get(origem) ?? 0) + peso);
  grafo.graus[origem] += peso;
  grafo.graus[destino] += peso;
  grafo.pesoTotal += peso;
}

/**
 * Monta o grafo ponderado das relações (relações são tratadas como não dirigidas).
 * Laços (entidade ligada a ela mesma) não entram *(inferido)*.
 * @param entidades - Entidades do grafo.
 * @param relacoes - Relações do grafo.
 * @returns Grafo com vizinhos, graus e peso total.
 */
export function montarGrafoPonderado(entidades: Entidade[], relacoes: Relacao[]): GrafoPonderado {
  const nos = listarNos(entidades, relacoes);
  const indice = new Map(nos.map((nome, posicao) => [nome, posicao]));
  const grafo: GrafoPonderado = {
    nos,
    vizinhos: nos.map(() => new Map<number, number>()),
    graus: nos.map(() => 0),
    pesoTotal: 0,
  };
  for (const relacao of relacoes) {
    const origem = indice.get(relacao.source_entity) as number;
    const destino = indice.get(relacao.target_entity) as number;
    if (origem === destino) continue;
    const peso = Math.max(relacao.weight, PESO_MINIMO_ARESTA);
    adicionarAresta(grafo, { origem, destino, peso });
  }
  return grafo;
}

/**
 * Soma, por comunidade vizinha, o peso das arestas do nó até ela (`k_i,in`).
 * @param estado - Estado do movimento local.
 * @param no - Índice do nó.
 * @returns Comunidade → peso, com as comunidades em ordem crescente.
 */
function somarPesosPorComunidade(estado: EstadoLouvain, no: number): Map<number, number> {
  const pesos = new Map<number, number>();
  for (const [vizinho, peso] of estado.grafo.vizinhos[no]) {
    const comunidade = estado.comunidadeDoNo[vizinho];
    pesos.set(comunidade, (pesos.get(comunidade) ?? 0) + peso);
  }
  return new Map([...pesos].sort(([a], [b]) => a - b));
}

/**
 * Ganho de modularidade (sem a constante) de pôr o nó na comunidade.
 * @param estado - Estado do movimento local.
 * @param dados - Peso até a comunidade, comunidade e grau do nó.
 * @returns `k_i,in − Σtot · k_i / (2m)`.
 */
function calcularGanho(
  estado: EstadoLouvain,
  dados: { pesoAteComunidade: number; comunidade: number; grauNo: number },
): number {
  const dobroPesoTotal = estado.grafo.pesoTotal * 2;
  const somaGraus = estado.somaGraus[dados.comunidade];
  return dados.pesoAteComunidade - (somaGraus * dados.grauNo) / dobroPesoTotal;
}

/**
 * Tira o nó da comunidade dele e o põe na de maior ganho (fica onde está em caso de empate).
 * @param estado - Estado do movimento local (alterado).
 * @param no - Índice do nó.
 * @returns true se o nó mudou de comunidade.
 */
function moverNo(estado: EstadoLouvain, no: number): boolean {
  const grauNo = estado.grafo.graus[no];
  const atual = estado.comunidadeDoNo[no];
  const pesos = somarPesosPorComunidade(estado, no);
  estado.somaGraus[atual] -= grauNo;

  let melhor = atual;
  let melhorGanho = calcularGanho(estado, {
    pesoAteComunidade: pesos.get(atual) ?? 0,
    comunidade: atual,
    grauNo,
  });
  for (const [comunidade, pesoAteComunidade] of pesos) {
    const ganho = calcularGanho(estado, { pesoAteComunidade, comunidade, grauNo });
    if (ganho <= melhorGanho) continue;
    melhor = comunidade;
    melhorGanho = ganho;
  }

  estado.somaGraus[melhor] += grauNo;
  estado.comunidadeDoNo[no] = melhor;
  return melhor !== atual;
}

/**
 * Louvain, fase 1: cada nó começa sozinho e muda para a comunidade vizinha de maior ganho, em
 * passadas sucessivas, até nada mudar ou chegar a 20 passadas.
 * @param grafo - Grafo ponderado.
 * @returns Rótulo (comunidade) de cada nó, na ordem de `grafo.nos`.
 */
export function detectarRotulos(grafo: GrafoPonderado): number[] {
  const rotulosIniciais = grafo.nos.map((_, posicao) => posicao);
  if (grafo.pesoTotal <= PESO_TOTAL_MINIMO) return rotulosIniciais;

  const estado: EstadoLouvain = {
    grafo,
    comunidadeDoNo: rotulosIniciais,
    somaGraus: [...grafo.graus],
  };
  for (let passada = 0; passada < MAXIMO_PASSADAS; passada++) {
    const moveuAlgum = grafo.nos
      .map((_, no) => moverNo(estado, no))
      .reduce((algum, moveu) => algum || moveu, false);
    if (!moveuAlgum) break;
  }
  return estado.comunidadeDoNo;
}

/**
 * Agrupa os nomes por rótulo, em ordem estável: grupos maiores primeiro, empate pelo 1º nome.
 * @param nos - Nomes dos nós.
 * @param rotulos - Rótulo de cada nó.
 * @returns Lista de grupos de nomes (cada grupo em ordem alfabética).
 */
function agruparPorRotulo(nos: string[], rotulos: number[]): string[][] {
  const grupos = new Map<number, string[]>();
  nos.forEach((nome, posicao) => {
    const grupo = grupos.get(rotulos[posicao]) ?? [];
    grupo.push(nome);
    grupos.set(rotulos[posicao], grupo);
  });
  return [...grupos.values()].sort(
    (a, b) => b.length - a.length || a[0].localeCompare(b[0]),
  );
}

/**
 * Monta o resumo sem LLM: "Grupo temático contendo: <até 10 membros>." (arq. `0x823223`).
 * @param membros - Nomes dos membros.
 * @returns Resumo da comunidade.
 */
export function montarResumoSemLlm(membros: string[]): string {
  if (membros.length === 0) return TEXTO_COMUNIDADE_SEM_ENTIDADES;

  const primeiros = membros.slice(0, LIMITE_MEMBROS_RESUMO).join(SEPARADOR_MEMBROS);
  return montarTextoComunidadeComEntidades(primeiros);
}

/**
 * Monta uma comunidade a partir dos membros.
 * @param membros - Nomes das entidades do grupo.
 * @param indice - Posição da comunidade (vira o `id`).
 * @returns Comunidade com resumo sem LLM e sem embedding (a CLONE.7.7 completa).
 */
function montarComunidade(membros: string[], indice: number): Comunidade {
  return {
    id: String(indice),
    entity_ids: membros,
    level: NIVEL_COMUNIDADE,
    summary: montarResumoSemLlm(membros),
    summary_embedding: null,
    // Palavras-chave = os primeiros membros (*inferido*: o original não mostra como são feitas).
    keywords: membros.slice(0, LIMITE_PALAVRAS_CHAVE),
  };
}

/**
 * Detecta as comunidades e monta o conteúdo de `communities.json` (`CommunityGraph`).
 * @param entidades - Entidades do grafo (`entities.json`).
 * @param relacoes - Relações do grafo (`graph.json`).
 * @returns Comunidades e o mapa entidade → id da comunidade.
 */
export function detectarComunidades(
  entidades: Entidade[],
  relacoes: Relacao[],
): GrafoComunidades {
  const grafo = montarGrafoPonderado(entidades, relacoes);
  const grupos = agruparPorRotulo(grafo.nos, detectarRotulos(grafo));
  const communities = grupos.map((membros, indice) => montarComunidade(membros, indice));

  const entity_to_community: Record<string, string> = {};
  for (const comunidade of communities) {
    for (const nome of comunidade.entity_ids) entity_to_community[nome] = comunidade.id;
  }
  return { communities, entity_to_community };
}

/**
 * Texto da comunidade nos resultados da busca global: "Grupo temático [n]: … (Membros: …)".
 * @param comunidade - Comunidade do `communities.json`.
 * @returns Linha de descrição do grupo.
 */
export function descreverComunidadeParaBusca(comunidade: Comunidade): string {
  return montarResumoComunidade({
    nivel: comunidade.level,
    resumo: comunidade.summary,
    membros: comunidade.entity_ids.slice(0, LIMITE_MEMBROS_RESUMO).join(SEPARADOR_MEMBROS),
  });
}
