/**
 * Extração de entidades e relações (`graph::extraction`): transforma pedaços de texto em
 * entidades e relações do grafo e grava pelo repositório, juntando duplicados (inventário
 * `vetores-grafo.md` §4 e `prompts-agentes.md` §1.7).
 *
 * Estratégias (`ExtractionConfig.strategy`, padrão `regex`):
 * - `regex`: nomes próprios e siglas, pelos padrões do original;
 * - `llm` (`LlmExtractor`): pede o JSON do prompt 1.7; falha → volta para regex, com o aviso
 *   "LlmExtractor falhou (…), fazendo fallback para regex";
 * - `hybrid` (`HybridExtractor`): junta regex e LLM.
 * Limites por pedaço: 50 entidades e 100 relações; até 12 pedaços ao mesmo tempo.
 *
 * Regras *(inferidas)*, que não aparecem na desmontagem:
 * - o `source_id` de um pedaço é `<article_id>#<chunk_index>` (o mesmo do repositório);
 * - o pedido de extração não tem mensagem de sistema no inventário: o clone manda uma curta;
 * - tipo desconhecido vira `other`; relação com ponta fora das entidades do pedaço, ou que liga a
 *   entidade a ela mesma, é descartada;
 * - confiança 0,9 para o LLM e 0,5 para o regex; relação nova nasce com peso 1 e 1 evidência;
 * - o regex não gera relações.
 */

import type {
  Entidade,
  EntidadeLlm,
  EstrategiaExtracao,
  Relacao,
  RelacaoLlm,
  RespostaExtracaoLlm,
  TipoEntidade,
  TipoRelacao,
} from '../../compartilhado/tipos-grafo';
import type { ConfiguracaoExtracao, Pedaco } from '../../compartilhado/tipos-vetores';
import {
  EXTRACAO_PEDACOS_PARALELOS,
  MAXIMO_ENTIDADES_POR_PEDACO,
  MAXIMO_RELACOES_POR_PEDACO,
} from '../vetores/constantes';
import {
  mesclarGrafo,
  normalizarNome,
  type DadosGrafo,
  type RepositorioGrafo,
} from './grafo.repositorio';
import { montarPromptExtracaoEntidades } from './prompts';
import type { CompletarLlm } from './reordenacao';

const ESTRATEGIA_PADRAO: EstrategiaExtracao = 'regex';
const SEPARADOR_ORIGEM = '#';
const PADRAO_OBJETO_JSON = /\{[\s\S]*\}/;
const PADRAO_NOME_PROPRIO = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
const PADRAO_SIGLA = /\b([A-Z]{2,})\b/g;
const TIPO_PADRAO_ENTIDADE: TipoEntidade = 'other';
const TIPO_PADRAO_RELACAO: TipoRelacao = 'other';
const CONFIANCA_LLM = 0.9;
const CONFIANCA_REGEX = 0.5;
const PESO_INICIAL_RELACAO = 1;
const EVIDENCIAS_INICIAIS = 1;
const ID_ARTIGO_TESTE = 'teste';
const INDICE_PEDACO_TESTE = 0;

/** Mensagem de sistema do pedido de extração *(inferida: o inventário não mostra uma)*. */
const PROMPT_EXTRACAO_SISTEMA =
  'Você é um extrator de entidades e relações. Responda APENAS com JSON válido.';

const MSG_RESPOSTA_INVALIDA = 'resposta do LLM sem o JSON de entidades';

const TIPOS_ENTIDADE: ReadonlySet<string> = new Set<TipoEntidade>([
  'person',
  'organization',
  'concept',
  'technology',
  'location',
  'event',
  'process',
  'metric',
  'other',
]);

const TIPOS_RELACAO: ReadonlySet<string> = new Set<TipoRelacao>([
  'uses',
  'causes',
  'part_of',
  'created_by',
  'depends_on',
  'implements',
  'extends',
  'contains',
  'produces',
  'related_to',
  'other',
]);

/** Dependências para extrair de um texto (sem gravar). */
export interface DependenciasExtracaoTexto {
  /** Cliente do LLM (usado nas estratégias `llm` e `hybrid`). */
  completarLlm: CompletarLlm;
  /** Recebe os avisos de fallback; padrão: `console.warn`. */
  avisar?: (mensagem: string) => void;
}

/** Dependências para extrair e gravar no grafo do projeto. */
export interface DependenciasExtracao extends DependenciasExtracaoTexto {
  /** Repositório onde o grafo é lido e gravado. */
  repositorio: RepositorioGrafo;
}

/** Ajustes da extração. */
export interface OpcoesExtracao {
  /** Estratégia e limites (`ExtractionConfig`); o que faltar vem do padrão. */
  extracao?: Partial<ConfiguracaoExtracao>;
  /** Pedaços processados ao mesmo tempo (`max_async`, padrão 12). */
  paralelos?: number;
}

/** Pedido de extração de um projeto. */
export interface PedidoExtracaoProjeto {
  /** Projeto cujo grafo recebe o resultado. */
  idProjeto: string;
  /** Pedaços (chunks) a analisar. */
  pedacos: Pedaco[];
}

/** De onde veio um pedaço: `source_id` e artigo. */
export interface OrigemPedaco {
  idOrigem: string;
  idArtigo: string;
}

/** Limites por pedaço. */
export interface LimitesExtracao {
  entidades: number;
  relacoes: number;
}

/** Tudo o que um extrator de pedaço precisa. */
interface EntradaExtrator {
  texto: string;
  origem: OrigemPedaco;
  limites: LimitesExtracao;
  dependencias: DependenciasExtracaoTexto;
}

/** Extrator de um pedaço, por estratégia. */
type ExtratorPedaco = (entrada: EntradaExtrator) => Promise<DadosGrafo>;

/** Dados vazios de entidades e relações. */
function criarDadosVazios(): DadosGrafo {
  return { entidades: [], relacoes: [] };
}

/**
 * Converte um limite configurado em inteiro não negativo, ou usa o padrão.
 * @param {number | undefined} valor - Limite configurado.
 * @param {number} padrao - Limite padrão.
 * @returns {number} Limite válido.
 */
function resolverLimite(valor: number | undefined, padrao: number): number {
  const valido = typeof valor === 'number' && Number.isFinite(valor) && valor >= 0;
  return valido ? Math.floor(valor) : padrao;
}

/**
 * Completa a configuração de extração com os padrões do original.
 * @param {Partial<ConfiguracaoExtracao>} [parcial] - Ajustes do `embedder_config.json`.
 * @returns {ConfiguracaoExtracao} Configuração completa.
 */
export function resolverConfiguracaoExtracao(
  parcial: Partial<ConfiguracaoExtracao> = {},
): ConfiguracaoExtracao {
  const estrategia = parcial.strategy;
  const estrategiaValida = estrategia !== undefined && Object.hasOwn(ESTRATEGIAS, estrategia);
  return {
    strategy: estrategiaValida ? (parcial.strategy as EstrategiaExtracao) : ESTRATEGIA_PADRAO,
    max_entities_per_chunk: resolverLimite(
      parcial.max_entities_per_chunk,
      MAXIMO_ENTIDADES_POR_PEDACO,
    ),
    max_relations_per_chunk: resolverLimite(
      parcial.max_relations_per_chunk,
      MAXIMO_RELACOES_POR_PEDACO,
    ),
  };
}

/**
 * Lê um texto da resposta do LLM, sem espaços nas pontas.
 * @param {unknown} valor - Valor vindo do JSON.
 * @returns {string} Texto, ou vazio se não for texto.
 */
function lerTexto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

/**
 * Lê o tipo da resposta do LLM; fora da lista permitida, usa o padrão.
 * @param {unknown} valor - Tipo vindo do JSON.
 * @param {ReadonlySet<string>} permitidos - Tipos aceitos.
 * @param {T} padrao - Tipo usado quando o valor não é aceito.
 * @returns {T} Tipo final.
 */
function lerTipo<T extends string>(valor: unknown, permitidos: ReadonlySet<string>, padrao: T): T {
  const tipo = lerTexto(valor).toLowerCase();
  return permitidos.has(tipo) ? (tipo as T) : padrao;
}

/**
 * Lê uma entidade da resposta do LLM.
 * @param {unknown} bruto - Item de `entities`.
 * @returns {EntidadeLlm | null} Entidade, ou null se não tiver nome.
 */
function lerEntidadeLlm(bruto: unknown): EntidadeLlm | null {
  const item = (bruto ?? {}) as Record<string, unknown>;
  const name = lerTexto(item.name);
  if (!name) return null;

  const aliasesBrutos = Array.isArray(item.aliases) ? item.aliases : [];
  const aliases = aliasesBrutos.map(lerTexto).filter(Boolean);
  return {
    name,
    type: lerTipo(item.type, TIPOS_ENTIDADE, TIPO_PADRAO_ENTIDADE),
    description: lerTexto(item.description),
    aliases,
  };
}

/**
 * Lê uma relação da resposta do LLM.
 * @param {unknown} bruto - Item de `relations`.
 * @returns {RelacaoLlm | null} Relação, ou null se faltar uma das pontas.
 */
function lerRelacaoLlm(bruto: unknown): RelacaoLlm | null {
  const item = (bruto ?? {}) as Record<string, unknown>;
  const source = lerTexto(item.source);
  const target = lerTexto(item.target);
  if (!source || !target) return null;

  return {
    source,
    target,
    type: lerTipo(item.type, TIPOS_RELACAO, TIPO_PADRAO_RELACAO),
    description: lerTexto(item.description),
  };
}

/**
 * Lê o JSON de extração da resposta do LLM (aceita texto ou cerca de código em volta).
 * @param {string} resposta - Texto devolvido pelo LLM.
 * @returns {RespostaExtracaoLlm | null} Entidades e relações válidas, ou null se o JSON for
 *   inválido ou não tiver a lista `entities`.
 */
export function lerRespostaExtracao(resposta: string): RespostaExtracaoLlm | null {
  const trecho = PADRAO_OBJETO_JSON.exec(resposta);
  if (!trecho) return null;

  let dados: { entities?: unknown; relations?: unknown };
  try {
    dados = JSON.parse(trecho[0]) as typeof dados;
  } catch {
    return null;
  }
  if (!dados || !Array.isArray(dados.entities)) return null;

  const relacoes = Array.isArray(dados.relations) ? dados.relations : [];
  return {
    entities: dados.entities.map(lerEntidadeLlm).filter((e): e is EntidadeLlm => e !== null),
    relations: relacoes.map(lerRelacaoLlm).filter((r): r is RelacaoLlm => r !== null),
  };
}

/**
 * Cria a entidade do grafo a partir do que foi extraído de um pedaço.
 * @param {EntidadeLlm} dados - Nome, tipo, descrição e aliases.
 * @param {OrigemPedaco} origem - `source_id` e artigo do pedaço.
 * @param {number} confianca - Confiança da extração, em fração.
 * @returns {Entidade} Entidade pronta para juntar ao grafo.
 */
function criarEntidade(dados: EntidadeLlm, origem: OrigemPedaco, confianca: number): Entidade {
  const nomeNormalizado = normalizarNome(dados.name);
  const aliases = dados.aliases.filter((alias) => normalizarNome(alias) !== nomeNormalizado);
  return {
    name: dados.name,
    entity_type: dados.type,
    description: dados.description,
    embedding: null,
    source_ids: [origem.idOrigem],
    metadata: {},
    aliases: [...new Set(aliases)],
    confidence: confianca,
    profile: null,
    article_id: origem.idArtigo,
  };
}

/**
 * Cria a relação do grafo a partir do que foi extraído de um pedaço.
 * @param {RelacaoLlm} dados - Pontas, tipo e descrição.
 * @param {OrigemPedaco} origem - `source_id` e artigo do pedaço.
 * @returns {Relacao} Relação pronta para juntar ao grafo.
 */
function criarRelacao(dados: RelacaoLlm, origem: OrigemPedaco): Relacao {
  return {
    source_entity: dados.source,
    target_entity: dados.target,
    relation_type: dados.type,
    weight: PESO_INICIAL_RELACAO,
    evidence_count: EVIDENCIAS_INICIAIS,
    keywords: [],
    description: dados.description,
    source_ids: [origem.idOrigem],
    article_id: origem.idArtigo,
  };
}

/**
 * Indica se a relação liga duas entidades diferentes do pedaço.
 * @param {Relacao} relacao - Relação já apontando para os nomes finais.
 * @param {Set<string>} nomes - Nomes das entidades do pedaço.
 * @returns {boolean} true se as duas pontas existem e são diferentes.
 */
function ligaEntidadesConhecidas(relacao: Relacao, nomes: Set<string>): boolean {
  const pontasConhecidas = nomes.has(relacao.source_entity) && nomes.has(relacao.target_entity);
  return pontasConhecidas && relacao.source_entity !== relacao.target_entity;
}

/**
 * Junta duplicados de um pedaço, descarta relações soltas e aplica os limites.
 * @param {DadosGrafo} dados - Entidades e relações como foram extraídas.
 * @param {LimitesExtracao} limites - Máximos por pedaço.
 * @returns {DadosGrafo} Grafo do pedaço, sem duplicados e dentro dos limites.
 */
function consolidarPedaco(dados: DadosGrafo, limites: LimitesExtracao): DadosGrafo {
  const unido = mesclarGrafo(criarDadosVazios(), dados);
  const entidades = unido.entidades.slice(0, limites.entidades);
  const nomes = new Set(entidades.map((entidade) => entidade.name));
  const relacoes = unido.relacoes
    .filter((relacao) => ligaEntidadesConhecidas(relacao, nomes))
    .slice(0, limites.relacoes);
  return { entidades, relacoes };
}

/**
 * Converte a resposta do LLM no grafo de um pedaço.
 * @param {RespostaExtracaoLlm} resposta - Entidades e relações lidas do JSON.
 * @param {OrigemPedaco} origem - `source_id` e artigo do pedaço.
 * @param {LimitesExtracao} limites - Máximos por pedaço.
 * @returns {DadosGrafo} Grafo do pedaço.
 */
export function converterRespostaLlm(
  resposta: RespostaExtracaoLlm,
  origem: OrigemPedaco,
  limites: LimitesExtracao,
): DadosGrafo {
  const dados: DadosGrafo = {
    entidades: resposta.entities.map((e) => criarEntidade(e, origem, CONFIANCA_LLM)),
    relacoes: resposta.relations.map((r) => criarRelacao(r, origem)),
  };
  return consolidarPedaco(dados, limites);
}

/**
 * Procura nomes próprios e siglas no texto, sem repetir e na ordem em que aparecem.
 * @param {string} texto - Texto do pedaço.
 * @returns {string[]} Nomes encontrados (nomes próprios primeiro, depois siglas).
 */
function encontrarNomesPorRegex(texto: string): string[] {
  const nomesProprios = [...texto.matchAll(PADRAO_NOME_PROPRIO)].map((achado) => achado[1]);
  const siglas = [...texto.matchAll(PADRAO_SIGLA)].map((achado) => achado[1]);
  return [...new Set([...nomesProprios, ...siglas])];
}

/**
 * Extrai entidades pelo regex do original (nomes próprios e siglas). Não gera relações.
 * @param {string} texto - Texto do pedaço.
 * @param {OrigemPedaco} origem - `source_id` e artigo do pedaço.
 * @param {LimitesExtracao} limites - Máximos por pedaço.
 * @returns {DadosGrafo} Grafo do pedaço (só entidades).
 */
export function extrairPorRegex(
  texto: string,
  origem: OrigemPedaco,
  limites: LimitesExtracao,
): DadosGrafo {
  const entidades = encontrarNomesPorRegex(texto).map((name) =>
    criarEntidade(
      { name, type: TIPO_PADRAO_ENTIDADE, description: '', aliases: [] },
      origem,
      CONFIANCA_REGEX,
    ),
  );
  return consolidarPedaco({ entidades, relacoes: [] }, limites);
}

/**
 * Extrai pelo LLM (prompt 1.7).
 * @param {EntradaExtrator} entrada - Texto, origem, limites e cliente do LLM.
 * @returns {Promise<DadosGrafo>} Grafo do pedaço.
 * @throws {Error} Se o LLM falhar ou a resposta não tiver o JSON esperado.
 */
async function extrairPorLlm(entrada: EntradaExtrator): Promise<DadosGrafo> {
  const usuario = montarPromptExtracaoEntidades(entrada.texto);
  const pedido = { sistema: PROMPT_EXTRACAO_SISTEMA, usuario };
  const resposta = lerRespostaExtracao(await entrada.dependencias.completarLlm(pedido));
  if (!resposta) throw new Error(MSG_RESPOSTA_INVALIDA);
  return converterRespostaLlm(resposta, entrada.origem, entrada.limites);
}

/**
 * Tenta o LLM; se falhar, avisa e devolve null (quem chama decide o fallback).
 * @param {EntradaExtrator} entrada - Texto, origem, limites e dependências.
 * @returns {Promise<DadosGrafo | null>} Grafo do LLM, ou null em caso de falha.
 */
async function tentarLlm(entrada: EntradaExtrator): Promise<DadosGrafo | null> {
  try {
    return await extrairPorLlm(entrada);
  } catch (erro) {
    const motivo = erro instanceof Error ? erro.message : String(erro);
    const avisar = entrada.dependencias.avisar ?? console.warn;
    avisar(`LlmExtractor falhou (${motivo}), fazendo fallback para regex`);
    return null;
  }
}

/** Extrator por estratégia (Open/Closed: estratégia nova = entrada nova no mapa). */
const ESTRATEGIAS: Record<EstrategiaExtracao, ExtratorPedaco> = {
  regex: async ({ texto, origem, limites }) => extrairPorRegex(texto, origem, limites),
  llm: async (entrada) =>
    (await tentarLlm(entrada)) ?? extrairPorRegex(entrada.texto, entrada.origem, entrada.limites),
  hybrid: async (entrada) => {
    const porRegex = extrairPorRegex(entrada.texto, entrada.origem, entrada.limites);
    const porLlm = (await tentarLlm(entrada)) ?? criarDadosVazios();
    return consolidarPedaco(mesclarGrafo(porLlm, porRegex), entrada.limites);
  },
};

/**
 * Monta a origem de um pedaço (`<article_id>#<chunk_index>`).
 * @param {Pedaco} pedaco - Pedaço de um artigo.
 * @returns {OrigemPedaco} `source_id` e artigo.
 */
function obterOrigem(pedaco: Pedaco): OrigemPedaco {
  const { article_id, chunk_index } = pedaco.metadata;
  return { idOrigem: `${article_id}${SEPARADOR_ORIGEM}${chunk_index}`, idArtigo: article_id };
}

/**
 * Extrai entidades e relações de um pedaço, sem gravar.
 * @param {Pedaco} pedaco - Pedaço (texto e metadados).
 * @param {DependenciasExtracaoTexto} dependencias - Cliente do LLM e aviso.
 * @param {Partial<ConfiguracaoExtracao>} [configuracao] - Estratégia e limites.
 * @returns {Promise<DadosGrafo>} Grafo do pedaço (vazio se o texto estiver vazio).
 */
export async function extrairDePedaco(
  pedaco: Pedaco,
  dependencias: DependenciasExtracaoTexto,
  configuracao: Partial<ConfiguracaoExtracao> = {},
): Promise<DadosGrafo> {
  if (!pedaco.texto.trim()) return criarDadosVazios();

  const config = resolverConfiguracaoExtracao(configuracao);
  const limites: LimitesExtracao = {
    entidades: config.max_entities_per_chunk,
    relacoes: config.max_relations_per_chunk,
  };
  const entrada = { texto: pedaco.texto, origem: obterOrigem(pedaco), limites, dependencias };
  return ESTRATEGIAS[config.strategy](entrada);
}

/**
 * Extrai de um texto solto (botão "Testar Extração" da configuração), sem gravar.
 * @param {string} texto - Texto de exemplo.
 * @param {DependenciasExtracaoTexto} dependencias - Cliente do LLM e aviso.
 * @param {Partial<ConfiguracaoExtracao>} [configuracao] - Estratégia e limites.
 * @returns {Promise<DadosGrafo>} Entidades e relações encontradas.
 */
export function extrairDeTexto(
  texto: string,
  dependencias: DependenciasExtracaoTexto,
  configuracao: Partial<ConfiguracaoExtracao> = {},
): Promise<DadosGrafo> {
  const pedaco: Pedaco = {
    texto,
    metadata: {
      chunk_index: INDICE_PEDACO_TESTE,
      section_title: null,
      article_title: '',
      overlap_with_prev: null,
      overlap_with_next: null,
      article_id: ID_ARTIGO_TESTE,
    },
  };
  return extrairDePedaco(pedaco, dependencias, configuracao);
}

/**
 * Executa uma tarefa por item com no máximo `limite` ao mesmo tempo, mantendo a ordem.
 * @param {T[]} itens - Itens a processar.
 * @param {number} limite - Tarefas simultâneas (mínimo 1).
 * @param {(item: T) => Promise<R>} tarefa - Trabalho de cada item.
 * @returns {Promise<R[]>} Resultados na ordem dos itens.
 */
async function executarEmParalelo<T, R>(
  itens: T[],
  limite: number,
  tarefa: (item: T) => Promise<R>,
): Promise<R[]> {
  const resultados: R[] = new Array<R>(itens.length);
  let proximo = 0;
  const trabalhar = async (): Promise<void> => {
    while (proximo < itens.length) {
      const posicao = proximo;
      proximo += 1;
      resultados[posicao] = await tarefa(itens[posicao]);
    }
  };
  const quantidade = Math.max(1, Math.min(limite, itens.length));
  await Promise.all(Array.from({ length: quantidade }, trabalhar));
  return resultados;
}

/**
 * Extrai entidades e relações dos pedaços de um projeto, junta os duplicados entre pedaços e
 * com o grafo já gravado, e grava pelo repositório.
 * @param {PedidoExtracaoProjeto} pedido - Projeto e pedaços.
 * @param {DependenciasExtracao} dependencias - Cliente do LLM, repositório e aviso.
 * @param {OpcoesExtracao} [opcoes] - Estratégia, limites e paralelismo.
 * @returns {Promise<DadosGrafo>} Grafo do projeto depois da gravação (sem pedaços com texto,
 *   devolve o grafo atual sem gravar).
 * @throws {Error} Se o repositório falhar ao ler ou gravar.
 */
export async function extrairEGravar(
  pedido: PedidoExtracaoProjeto,
  dependencias: DependenciasExtracao,
  opcoes: OpcoesExtracao = {},
): Promise<DadosGrafo> {
  const { idProjeto } = pedido;
  const pedacos = pedido.pedacos.filter((pedaco) => pedaco.texto.trim().length > 0);
  if (pedacos.length === 0) return dependencias.repositorio.carregar(idProjeto);

  const paralelos = resolverLimite(opcoes.paralelos, EXTRACAO_PEDACOS_PARALELOS);
  const grafos = await executarEmParalelo(pedacos, paralelos, (pedaco) =>
    extrairDePedaco(pedaco, dependencias, opcoes.extracao),
  );
  const unido = grafos.reduce(mesclarGrafo, criarDadosVazios());
  return dependencias.repositorio.adicionar(idProjeto, unido);
}
