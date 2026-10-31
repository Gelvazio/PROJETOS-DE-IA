/**
 * Índice vetorial de um projeto (`projects\<id>\vectors.json`), como o `vector::index` do
 * original (`docs/inventario/vetores-grafo.md` §3 e `arquivos-locais.md`):
 * - a gravação escreve **só `entries`**; o HNSW é refeito na memória ao carregar;
 * - com menos de 1000 entradas não há HNSW e a busca é linear (cosseno com todas);
 * - a remoção é por `article_id` e marca o HNSW como desatualizado (`hnsw_stale`).
 *
 * *(Inferido)*: entrada nova com o mesmo `id` substitui a antiga; o artigo de uma entrada sem
 * `metadata.article_id` é o trecho do `id` antes do `#` (`a1#0` → `a1`); o `hnsw` lido do
 * arquivo é ignorado e refeito; o HNSW desatualizado é refeito na próxima busca.
 */

import type {
  EntradaIndice,
  IndiceHnsw,
  IndiceVetorial,
} from '../../compartilhado/tipos-vetores';
import { gravarJson, lerJson, type SistemaArquivos } from '../armazenamento/arquivo-json';
import { obterCaminhosProjeto } from '../armazenamento/caminhos';
import { HNSW_EF_CONSTRUCTION, HNSW_M, LIMITE_ENTRADAS_HNSW } from './constantes';
import { buscarHnsw, construirHnsw, normalizarVetor } from './hnsw';
import { buscarMaisParecidos, type EntradaComPontuacao } from './similaridade';

/** Separador entre o artigo e o trecho no `id` da entrada *(inferido: `a1#0`)*. */
const SEPARADOR_ARTIGO_ID = '#';

const MSG_ARQUIVO_INVALIDO = 'vectors.json sem a lista "entries"';
const MSG_ENTRADA_INVALIDA = 'Entrada inválida no índice vetorial';
const MSG_DIMENSAO_DIFERENTE = 'Dimensão do embedding diferente da do índice';
const MSG_K_INVALIDO = 'O valor de k deve ser um inteiro maior ou igual a zero';

/** Conteúdo gravado em `vectors.json`: só as entradas, como o original. */
export type ArquivoVetoresGravado = Pick<IndiceVetorial, 'entries'>;

/** Conteúdo aceito na leitura: `hnsw` e `hnsw_stale` podem vir, mas são ignorados. */
type ArquivoVetoresLido = Partial<IndiceVetorial>;

/** Opções do índice em memória. */
export interface OpcoesIndiceVetorial {
  /** Gerador aleatório em [0, 1) dos níveis do HNSW (padrão `Math.random`). */
  sortear?: () => number;
  /** Recebe as mensagens de log do índice (padrão: nenhuma). */
  registrarLog?: (mensagem: string) => void;
}

/** Opções de uma busca no índice. */
export interface OpcoesBuscaIndice {
  /** Quantidade de resultados. */
  k: number;
  /** efSearch do HNSW (só usado com 1000 entradas ou mais). */
  ef?: number;
}

/** Resumo do HNSW em memória (para log e diagnóstico). */
export interface ResumoHnsw {
  nos: number;
  camadas: number;
}

/** Erro do índice vetorial (entrada inválida, dimensão diferente, arquivo sem `entries`). */
export class ErroIndiceVetorial extends Error {
  /**
   * @param {string} mensagem - O que deu errado.
   */
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroIndiceVetorial';
  }
}

/**
 * Diz se o valor é uma lista não vazia de números finitos.
 * @param {unknown} valor - Valor a conferir.
 * @returns {boolean} true se servir de embedding.
 */
function ehEmbeddingValido(valor: unknown): valor is number[] {
  if (!Array.isArray(valor) || valor.length === 0) return false;
  return valor.every((numero) => typeof numero === 'number' && Number.isFinite(numero));
}

/**
 * Confere os 4 campos obrigatórios de uma entrada (`id`, `text`, `embedding`, `source_type`).
 * @param {unknown} valor - Entrada lida ou recebida.
 * @param {number} posicao - Posição na lista (para a mensagem de erro).
 * @returns {EntradaIndice} A própria entrada, tipada.
 * @throws {ErroIndiceVetorial} Se faltar campo obrigatório ou o embedding for inválido.
 */
function validarEntrada(valor: unknown, posicao: number): EntradaIndice {
  const entrada = valor as Partial<EntradaIndice> | null;
  const temTextos =
    typeof entrada?.id === 'string' &&
    typeof entrada.text === 'string' &&
    typeof entrada.source_type === 'string';
  const valida = temTextos && ehEmbeddingValido(entrada?.embedding);
  if (!valida) throw new ErroIndiceVetorial(`${MSG_ENTRADA_INVALIDA} (posição ${posicao})`);
  return entrada as EntradaIndice;
}

/**
 * Garante que todas as entradas têm a dimensão esperada.
 * @param {EntradaIndice[]} entradas - Entradas a conferir.
 * @param {number} dimensao - Dimensão esperada.
 * @returns {void}
 * @throws {ErroIndiceVetorial} Se alguma entrada tiver outra dimensão.
 */
function validarDimensoes(entradas: EntradaIndice[], dimensao: number): void {
  const diferente = entradas.find((entrada) => entrada.embedding.length !== dimensao);
  if (!diferente) return;
  const detalhe = `${diferente.id}: ${diferente.embedding.length} em vez de ${dimensao}`;
  throw new ErroIndiceVetorial(`${MSG_DIMENSAO_DIFERENTE} (${detalhe})`);
}

/**
 * Descobre o artigo de uma entrada.
 * @param {EntradaIndice} entrada - Entrada do índice.
 * @returns {string} `metadata.article_id`, ou o trecho do `id` antes do `#`.
 */
export function obterArtigoDaEntrada(entrada: EntradaIndice): string {
  const doMetadado = entrada.metadata?.article_id;
  if (doMetadado) return doMetadado;
  return entrada.id.split(SEPARADOR_ARTIGO_ID)[0];
}

/**
 * Junta entradas novas às existentes: mesmo `id` substitui no lugar, `id` novo vai para o fim.
 * @param {EntradaIndice[]} existentes - Entradas atuais.
 * @param {EntradaIndice[]} novas - Entradas a acrescentar.
 * @returns {EntradaIndice[]} Lista nova, sem `id` repetido.
 */
function juntarEntradas(existentes: EntradaIndice[], novas: EntradaIndice[]): EntradaIndice[] {
  const resultado = [...existentes];
  const posicaoPorId = new Map(resultado.map((entrada, posicao) => [entrada.id, posicao]));

  for (const nova of novas) {
    const posicao = posicaoPorId.get(nova.id);
    if (posicao !== undefined) {
      resultado[posicao] = nova;
      continue;
    }
    posicaoPorId.set(nova.id, resultado.length);
    resultado.push(nova);
  }
  return resultado;
}

/**
 * Índice vetorial em memória: entradas, HNSW (a partir de 1000 entradas) e busca. Não acessa
 * disco; quem grava e lê `vectors.json` é o repositório (`criarRepositorioIndiceVetorial`).
 */
export class IndiceVetorialMemoria {
  private entradas: EntradaIndice[];
  private hnsw: IndiceHnsw | null = null;
  private vetoresNormalizados: number[][] = [];
  private hnswDesatualizado = true;
  private readonly opcoes: OpcoesIndiceVetorial;

  /**
   * @param {EntradaIndice[]} entradas - Entradas iniciais (todas com a mesma dimensão).
   * @param {OpcoesIndiceVetorial} opcoes - Gerador aleatório e log.
   * @throws {ErroIndiceVetorial} Se alguma entrada for inválida ou de outra dimensão.
   */
  constructor(entradas: EntradaIndice[] = [], opcoes: OpcoesIndiceVetorial = {}) {
    const validas = entradas.map(validarEntrada);
    if (validas.length > 0) validarDimensoes(validas, validas[0].embedding.length);
    this.entradas = juntarEntradas([], validas);
    this.opcoes = opcoes;
  }

  /** Quantidade de entradas. */
  get quantidade(): number {
    return this.entradas.length;
  }

  /** Dimensão dos embeddings, ou null se o índice estiver vazio. */
  get dimensao(): number | null {
    return this.entradas[0]?.embedding.length ?? null;
  }

  /** Diz se o HNSW precisa ser refeito antes da próxima busca (`hnsw_stale`). */
  get hnswEstaDesatualizado(): boolean {
    return this.hnswDesatualizado;
  }

  /**
   * Lista as entradas, na ordem do índice.
   * @returns {readonly EntradaIndice[]} Entradas (não alterar).
   */
  listarEntradas(): readonly EntradaIndice[] {
    return this.entradas;
  }

  /**
   * Acrescenta entradas (mesmo `id` substitui) e marca o HNSW como desatualizado.
   * @param {EntradaIndice[]} novas - Entradas novas, com a dimensão do índice.
   * @returns {void}
   * @throws {ErroIndiceVetorial} Se alguma entrada for inválida ou de outra dimensão.
   */
  adicionar(novas: EntradaIndice[]): void {
    const validas = novas.map(validarEntrada);
    if (validas.length === 0) return;

    const dimensao = this.dimensao ?? validas[0].embedding.length;
    validarDimensoes(validas, dimensao);
    this.entradas = juntarEntradas(this.entradas, validas);
    this.hnswDesatualizado = true;
  }

  /**
   * Remove as entradas de um artigo e marca o HNSW como desatualizado, se algo saiu.
   * @param {string} idArtigo - ID do artigo.
   * @returns {number} Quantidade de entradas removidas.
   */
  removerArtigo(idArtigo: string): number {
    const restantes = this.entradas.filter((entrada) => {
      return obterArtigoDaEntrada(entrada) !== idArtigo;
    });
    const removidas = this.entradas.length - restantes.length;
    if (removidas === 0) return 0;

    this.entradas = restantes;
    this.hnswDesatualizado = true;
    this.opcoes.registrarLog?.(
      `VectorIndex: ${removidas} entries removidos para article_id=${idArtigo}`,
    );
    return removidas;
  }

  /**
   * Refaz o HNSW se houver 1000 entradas ou mais; abaixo disso, descarta o grafo.
   * @returns {void}
   */
  reconstruirHnsw(): void {
    this.hnswDesatualizado = false;
    if (this.entradas.length < LIMITE_ENTRADAS_HNSW) {
      this.hnsw = null;
      this.vetoresNormalizados = [];
      this.opcoes.registrarLog?.(
        `Índice HNSW não construído: ${this.entradas.length} entries ` +
          `(mínimo: ${LIMITE_ENTRADAS_HNSW})`,
      );
      return;
    }

    this.vetoresNormalizados = this.entradas.map((entrada) => normalizarVetor(entrada.embedding));
    this.hnsw = construirHnsw(this.vetoresNormalizados, { sortear: this.opcoes.sortear });
    this.opcoes.registrarLog?.(
      `Índice HNSW construído com ${this.entradas.length} entries ` +
        `(M=${HNSW_M}, efConstruction=${HNSW_EF_CONSTRUCTION})`,
    );
  }

  /**
   * Resume o HNSW em memória.
   * @returns {ResumoHnsw | null} Nós e camadas, ou null se não houver HNSW.
   */
  obterResumoHnsw(): ResumoHnsw | null {
    if (!this.hnsw) return null;
    return { nos: this.hnsw.node_levels.length, camadas: this.hnsw.layers.length };
  }

  /**
   * Busca as k entradas mais parecidas com a consulta: linear abaixo de 1000 entradas, HNSW a
   * partir disso (refeito antes, se estiver desatualizado).
   * @param {number[]} consulta - Embedding da consulta, com a dimensão do índice.
   * @param {OpcoesBuscaIndice} opcoes - Quantidade `k` e `ef` do HNSW.
   * @returns {EntradaComPontuacao[]} Até k entradas com o cosseno, da mais para a menos parecida.
   * @throws {ErroIndiceVetorial} Se k for inválido ou a dimensão da consulta for diferente.
   */
  buscar(consulta: number[], opcoes: OpcoesBuscaIndice): EntradaComPontuacao[] {
    const kValido = Number.isInteger(opcoes.k) && opcoes.k >= 0;
    if (!kValido) throw new ErroIndiceVetorial(`${MSG_K_INVALIDO}: ${opcoes.k}`);
    if (this.dimensao === null) return [];

    const dimensaoCerta = consulta.length === this.dimensao;
    if (!dimensaoCerta) {
      const detalhe = `consulta com ${consulta.length} em vez de ${this.dimensao}`;
      throw new ErroIndiceVetorial(`${MSG_DIMENSAO_DIFERENTE} (${detalhe})`);
    }

    if (this.hnswDesatualizado) this.reconstruirHnsw();
    if (!this.hnsw) return buscarMaisParecidos(consulta, this.entradas, opcoes.k);

    const grafo = { indice: this.hnsw, vetores: this.vetoresNormalizados };
    const encontrados = buscarHnsw(grafo, normalizarVetor(consulta), opcoes);
    return encontrados.map((candidato) => ({
      entrada: this.entradas[candidato.posicao],
      pontuacao: candidato.similaridade,
    }));
  }

  /**
   * Monta o conteúdo de `vectors.json` (só `entries`, como o original).
   * @returns {ArquivoVetoresGravado} Objeto pronto para gravar.
   */
  paraArquivo(): ArquivoVetoresGravado {
    return { entries: [...this.entradas] };
  }
}

/** Operações de armazenamento do índice vetorial de um projeto. */
export interface RepositorioIndiceVetorial {
  /** Lê `vectors.json` (ausente = índice vazio) e monta o HNSW, se couber. */
  carregar(idProjeto: string): Promise<IndiceVetorialMemoria>;
  /** Grava `vectors.json` com as entradas do índice. */
  gravar(idProjeto: string, indice: IndiceVetorialMemoria): Promise<void>;
}

/** Dependências do repositório. */
export interface DependenciasRepositorioIndiceVetorial {
  /** Pasta de dados (veja `obterPastaDados`). */
  pastaDados: string;
  /** Acesso a arquivos; sem ele, usa `node:fs`. */
  arquivos?: SistemaArquivos;
  /** Opções repassadas a cada índice carregado. */
  opcoesIndice?: OpcoesIndiceVetorial;
}

/**
 * Tira as entradas do conteúdo lido de `vectors.json`.
 * @param {unknown} conteudo - JSON lido.
 * @returns {unknown[]} Lista `entries`.
 * @throws {ErroIndiceVetorial} Se o conteúdo não for objeto com a lista `entries`.
 */
function extrairEntradasDoArquivo(conteudo: unknown): unknown[] {
  const arquivo = conteudo as ArquivoVetoresLido | null;
  const entradas = arquivo?.entries;
  if (!Array.isArray(entradas)) throw new ErroIndiceVetorial(MSG_ARQUIVO_INVALIDO);
  return entradas;
}

/**
 * Cria o repositório do índice vetorial (`projects\<id>\vectors.json`).
 * @param {DependenciasRepositorioIndiceVetorial} dependencias - Pasta de dados, acesso a
 *   arquivos e opções do índice.
 * @returns {RepositorioIndiceVetorial} Operações de carregar e gravar.
 */
export function criarRepositorioIndiceVetorial(
  dependencias: DependenciasRepositorioIndiceVetorial,
): RepositorioIndiceVetorial {
  const { pastaDados, arquivos, opcoesIndice } = dependencias;
  const caminhoVetores = (idProjeto: string): string => {
    return obterCaminhosProjeto(pastaDados, idProjeto).vetores;
  };

  return {
    async carregar(idProjeto) {
      const vazio: ArquivoVetoresGravado = { entries: [] };
      const conteudo = await lerJson<unknown>(caminhoVetores(idProjeto), vazio, arquivos);
      const entradas = extrairEntradasDoArquivo(conteudo) as EntradaIndice[];
      const indice = new IndiceVetorialMemoria(entradas, opcoesIndice);
      indice.reconstruirHnsw();
      return indice;
    },
    async gravar(idProjeto, indice) {
      await gravarJson(caminhoVetores(idProjeto), indice.paraArquivo(), arquivos);
    },
  };
}
