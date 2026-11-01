/**
 * Serviço de indexação vetorial de um projeto: lê os documentos, divide em pedaços
 * (`divisor.ts`), gera os embeddings (`provedor-embedding.ts` e `provedores/*`), grava o índice
 * (`indice.ts`, que monta o HNSW de `hnsw.ts`) e busca nele. Segue as fases do pipeline de
 * sincronização do original (`docs/inventario/vetores-grafo.md` §6: `fetching`, `chunking`,
 * `embedding`, `saving`, `done`/`cancelled`); extração de entidades e grafo ficam fora daqui.
 *
 * Política de embedding (§2): lotes de `embedding_batch_num`, até `embedding_func_max_async`
 * lotes ao mesmo tempo, limite de `embedding_rpm` × `embedding_rpm_usage_percent` por minuto e
 * novas tentativas após HTTP 429. Os valores vêm de `rag_pipeline_config.json` (injetado) ou das
 * constantes padrão.
 *
 * *(Inferido)*: o `id` de cada entrada é `<id do documento>#<chunk_index>` e o `source_type` é
 * `chunk` (exemplo de `arquivos-locais.md`); a indexação completa recria o índice do zero; a
 * incremental troca só os documentos recebidos; o RPM espaça o **início** de cada chamada.
 */

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type {
  ConfiguracaoPipelineRag,
  EntradaIndice,
  FaseSincronizacao,
  MetadadosPedaco,
  ModoEmbedding,
  ModoEmbeddingGemini,
  ModoEmbeddingOpenRouter,
  Pedaco,
  ProgressoSincronizacao,
  ResultadoBusca,
  TipoResultadoBusca,
} from '../../compartilhado/tipos-vetores';
import type { ProjetoLocal } from '../../compartilhado/tipos-armazenamento';
import {
  CONCORRENCIA_EMBEDDING,
  FATOR_USO_RPM_EMBEDDING,
  LOTE_EMBEDDING,
  RPM_EMBEDDING,
  TENTATIVAS_429_EMBEDDING,
} from './constantes';
import { dividirEmPedacos } from './divisor';
import {
  IndiceVetorialMemoria,
  type OpcoesIndiceVetorial,
  type RepositorioIndiceVetorial,
} from './indice';
import {
  dividirEmLotes,
  executarComNovasTentativas,
  FabricaProvedoresEmbedding,
  type ProvedorEmbedding,
} from './provedor-embedding';
import { criarProvedorGemini } from './provedores/gemini';
import { registrarProvedorOpenAi } from './provedores/openai';
import { criarProvedorOpenRouter } from './provedores/openrouter';
import { buscarMaisParecidos, type EntradaComPontuacao } from './similaridade';

/* ----------------------------- Constantes ----------------------------- */

/** `source_type` das entradas criadas aqui *(inferido: exemplo `"chunk"` do inventário)*. */
export const TIPO_FONTE_PEDACO = 'chunk';

/** Separador entre o documento e o número do pedaço no `id` da entrada (`a1#0`). */
const SEPARADOR_ID_PEDACO = '#';

/** Tipo do resultado de busca dos pedaços (prefixo `chunk:` do original, §5). */
const TIPO_RESULTADO_PEDACO: TipoResultadoBusca = 'chunk';

/** Quantidade padrão de resultados da busca (ferramenta MCP de busca, §5: `top_k` = 5). */
export const K_PADRAO_BUSCA = 5;

/** Quantidade máxima de resultados da busca (ferramenta MCP de busca, §5: `top_k` 1–100). */
export const K_MAXIMO_BUSCA = 100;

/** Tamanho máximo da consulta, em caracteres (comando `query_knowledge`, §5: 10.000). */
export const TAMANHO_MAXIMO_CONSULTA = 10000;

/** Extensões lidas pela fonte de documentos de pasta *(escolha do clone)*. */
export const EXTENSOES_DOCUMENTO_PADRAO: readonly string[] = ['.md', '.markdown', '.txt'];

/** Pastas nunca lidas pela fonte de documentos de pasta *(escolha do clone)*. */
const PASTAS_IGNORADAS: readonly string[] = ['node_modules'];

/** Prefixo de arquivo ou pasta oculta, também ignorada. */
const PREFIXO_OCULTO = '.';

const CODIFICACAO_TEXTO = 'utf-8';
const CODIGO_ARQUIVO_INEXISTENTE = 'ENOENT';
const SEPARADOR_ID_DOCUMENTO = '/';
const MILISSEGUNDOS_POR_MINUTO = 60000;
const CEM_POR_CENTO = 100;

const MSG_LENDO_DOCUMENTOS = 'Lendo documentos do projeto...';
const MSG_DIVIDINDO = 'Dividindo em chunks...';
const MSG_GRAVANDO = 'Gravando o índice vetorial...';
const MSG_CONCLUIDA = 'Indexação concluída';
const MSG_CANCELADA = 'Indexação cancelada pelo usuário';
const MSG_PROJETO_NAO_ENCONTRADO = 'Projeto não encontrado';
const MSG_DOCUMENTO_INVALIDO = 'Documento inválido: id vazio ou texto ausente';
const MSG_DOCUMENTO_REPETIDO = 'Documento repetido na indexação';
const MSG_VETORES_FALTANDO = 'O provedor devolveu uma quantidade de vetores diferente da pedida';
const MSG_DIMENSAO_MUDOU =
  'A dimensão dos embeddings mudou; refaça a indexação completa do projeto';
const MSG_CONSULTA_VAZIA = 'A consulta não pode ser vazia';
const MSG_CONSULTA_LONGA = 'A consulta passou do tamanho máximo';
const MSG_K_INVALIDO = 'O valor de k deve ser um inteiro entre 1 e';
const MSG_CONFIGURACAO_INVALIDA = 'Configuração de embedding inválida';

/* ----------------------------- Tipos ----------------------------- */

/** Documento a indexar (um artigo da wiki ou um arquivo do projeto). */
export interface DocumentoIndexavel {
  /** Identificador do documento (vai em `article_id`). */
  id: string;
  /** Título (vai em `article_title`); vazio usa o `id`. */
  titulo: string;
  /** Texto Markdown do documento. */
  texto: string;
}

/** De onde vêm os documentos de um projeto (wiki da plataforma, pasta local...). */
export interface FonteDocumentos {
  /** Lista todos os documentos atuais do projeto. */
  listar(idProjeto: string): Promise<DocumentoIndexavel[]>;
}

/** Progresso enviado durante a indexação (fase do `sync-progress` + mensagem). */
export interface ProgressoIndexacao extends ProgressoSincronizacao {
  mensagem: string;
  /** Documentos envolvidos, quando já se sabe. */
  documentos?: number;
  /** Pedaços envolvidos, quando já se sabe. */
  pedacos?: number;
}

/** Opções de uma indexação. */
export interface OpcoesIndexacao {
  /** Recebe cada mudança de fase. */
  aoProgredir?: (progresso: ProgressoIndexacao) => void;
  /** Cancela a indexação; nada é gravado depois do cancelamento. */
  sinal?: AbortSignal;
}

/** Resultado de uma indexação. */
export interface ResumoIndexacao {
  /** Documentos processados. */
  documentos: number;
  /** Pedaços (entradas) gerados. */
  pedacos: number;
  /** Entradas no índice depois da gravação. */
  totalEntradas: number;
  /** true se a indexação foi cancelada antes de gravar. */
  cancelada: boolean;
}

/** Opções de uma busca. */
export interface OpcoesBuscaIndexacao {
  /** Quantidade de resultados (1 a 100, padrão 5). */
  k?: number;
  /** efSearch do HNSW (só com 1000 entradas ou mais). */
  ef?: number;
  /** Só entradas com este `source_type` (busca linear sobre as filtradas). */
  tipoFonte?: string;
}

/** Resultado de busca de um pedaço, sem o embedding. */
export interface ResultadoBuscaPedaco extends ResultadoBusca {
  tipoFonte: string;
  metadata: MetadadosPedaco | null;
}

/** Função que devolve o provedor de embedding configurado agora. */
export type ObtentorProvedor = () => Promise<ProvedorEmbedding> | ProvedorEmbedding;

/** Dependências injetadas no serviço. */
export interface DependenciasServicoIndexacao {
  /** Confere se o projeto existe (o `RepositorioProjetos`). */
  repositorioProjetos: { buscarPorId(id: string): Promise<ProjetoLocal | null> };
  /** Lê e grava `vectors.json`. */
  repositorioIndice: RepositorioIndiceVetorial;
  /** Fonte dos documentos de cada projeto. */
  fonteDocumentos: FonteDocumentos;
  /** Provedor de embedding do modo configurado (veja `criarObtentorProvedor`). */
  obterProvedor: ObtentorProvedor;
  /** Ajustes de lote, concorrência e RPM (`rag_pipeline_config.json`). */
  configuracaoRag?: ConfiguracaoPipelineRag;
  /** Opções dos índices criados do zero. */
  opcoesIndice?: OpcoesIndiceVetorial;
  /** Espera injetável, em milissegundos (padrão: `setTimeout`). */
  esperar?: (milissegundos: number) => Promise<void>;
  /** Relógio em milissegundos (padrão: `Date.now`). */
  obterAgoraMs?: () => number;
  /** Recebe as mensagens de log (padrão: nenhuma). */
  registrarLog?: (mensagem: string) => void;
}

/** Ajustes de embedding já resolvidos (configuração + padrões). */
interface ConfiguracaoEmbedding {
  tamanhoLote: number;
  concorrencia: number;
  rpm: number;
  fatorUsoRpm: number;
  tentativasExtras: number;
  esperar: (milissegundos: number) => Promise<void>;
  obterAgoraMs: () => number;
}

/** O que a geração de vetores precisa numa chamada. */
interface ContextoEmbedding {
  provedor: ProvedorEmbedding;
  limitar: () => Promise<void>;
  configuracao: ConfiguracaoEmbedding;
  sinal?: AbortSignal;
}

/** Um pedaço com o documento de onde veio. */
interface PedacoDoDocumento {
  documento: DocumentoIndexavel;
  pedaco: Pedaco;
}

/** Erro de indexação (documento inválido, dimensão mudou, configuração inválida...). */
export class ErroIndexacao extends Error {
  /**
   * @param {string} mensagem - O que deu errado.
   */
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroIndexacao';
  }
}

/** Sinal interno de cancelamento (vira resumo com `cancelada: true`). */
class ErroIndexacaoCancelada extends Error {
  /** Cria o erro com a mensagem padrão de cancelamento. */
  constructor() {
    super(MSG_CANCELADA);
    this.name = 'ErroIndexacaoCancelada';
  }
}

/* ----------------------------- Auxiliares: política de embedding ----------------------------- */

/**
 * Espera um tempo real (padrão).
 * @param {number} milissegundos - Tempo de espera.
 * @returns {Promise<void>} Resolve ao fim da espera.
 */
function esperarDeVerdade(milissegundos: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, milissegundos));
}

/**
 * Para a operação se o sinal já foi cancelado.
 * @param {AbortSignal | undefined} sinal - Sinal de cancelamento.
 * @returns {void}
 * @throws {ErroIndexacaoCancelada} Se o sinal estiver cancelado.
 */
function lancarSeCancelado(sinal: AbortSignal | undefined): void {
  if (sinal?.aborted) throw new ErroIndexacaoCancelada();
}

/**
 * Junta a configuração do `rag_pipeline_config.json` com os padrões e a valida.
 * @param {DependenciasServicoIndexacao} dependencias - Configuração, espera e relógio.
 * @returns {ConfiguracaoEmbedding} Ajustes resolvidos.
 * @throws {ErroIndexacao} Se lote, concorrência, RPM ou percentual forem inválidos.
 */
function resolverConfiguracao(dependencias: DependenciasServicoIndexacao): ConfiguracaoEmbedding {
  const rag = dependencias.configuracaoRag ?? {};
  const percentual = rag.embedding_rpm_usage_percent;
  const configuracao: ConfiguracaoEmbedding = {
    tamanhoLote: rag.embedding_batch_num ?? LOTE_EMBEDDING,
    concorrencia: rag.embedding_func_max_async ?? CONCORRENCIA_EMBEDDING,
    rpm: rag.embedding_rpm ?? RPM_EMBEDDING,
    fatorUsoRpm: percentual === undefined ? FATOR_USO_RPM_EMBEDDING : percentual / CEM_POR_CENTO,
    tentativasExtras: TENTATIVAS_429_EMBEDDING,
    esperar: dependencias.esperar ?? esperarDeVerdade,
    obterAgoraMs: dependencias.obterAgoraMs ?? Date.now,
  };

  const concorrenciaValida =
    Number.isInteger(configuracao.concorrencia) && configuracao.concorrencia >= 1;
  const rpmValido = Number.isFinite(configuracao.rpm) && configuracao.rpm > 0;
  const fatorValido = configuracao.fatorUsoRpm > 0 && configuracao.fatorUsoRpm <= 1;
  if (!concorrenciaValida || !rpmValido || !fatorValido) {
    throw new ErroIndexacao(MSG_CONFIGURACAO_INVALIDA);
  }
  dividirEmLotes([], configuracao.tamanhoLote);
  return configuracao;
}

/**
 * Cria o limitador de taxa: cada chamada reserva o próximo horário livre, espaçado de
 * 60.000 / (RPM × fator) ms, e espera até ele.
 * @param {ConfiguracaoEmbedding} configuracao - RPM, fator, espera e relógio.
 * @returns {() => Promise<void>} Função a chamar antes de cada requisição.
 */
export function criarLimitadorTaxa(configuracao: ConfiguracaoEmbedding): () => Promise<void> {
  const intervaloMs = MILISSEGUNDOS_POR_MINUTO / (configuracao.rpm * configuracao.fatorUsoRpm);
  let proximoInicioMs = 0;

  return async () => {
    const agora = configuracao.obterAgoraMs();
    const inicio = Math.max(agora, proximoInicioMs);
    proximoInicioMs = inicio + intervaloMs;
    const espera = inicio - agora;
    if (espera > 0) await configuracao.esperar(espera);
  };
}

/**
 * Executa uma tarefa por item com no máximo `limite` ao mesmo tempo; para de pegar itens novos
 * na primeira falha.
 * @param {T[]} itens - Itens a processar.
 * @param {number} limite - Tarefas simultâneas (1 ou mais).
 * @param {(item: T) => Promise<R>} tarefa - Trabalho de cada item.
 * @returns {Promise<R[]>} Resultados na ordem dos itens.
 * @throws {Error} O erro da primeira tarefa que falhar.
 */
export async function executarComLimite<T, R>(
  itens: T[],
  limite: number,
  tarefa: (item: T) => Promise<R>,
): Promise<R[]> {
  const resultados: R[] = new Array<R>(itens.length);
  let proxima = 0;
  let interrompido = false;

  const trabalhar = async (): Promise<void> => {
    while (!interrompido && proxima < itens.length) {
      const posicao = proxima;
      proxima += 1;
      try {
        resultados[posicao] = await tarefa(itens[posicao]);
      } catch (erro) {
        interrompido = true;
        throw erro;
      }
    }
  };

  const trabalhadores = Math.min(Math.max(1, limite), itens.length);
  await Promise.all(Array.from({ length: trabalhadores }, () => trabalhar()));
  return resultados;
}

/**
 * Gera os vetores de qualquer quantidade de textos: lotes, concorrência, RPM e 429.
 * @param {string[]} textos - Textos a vetorizar (não vazios).
 * @param {ContextoEmbedding} contexto - Provedor, limitador, ajustes e cancelamento.
 * @returns {Promise<number[][]>} Um vetor por texto, na ordem de entrada.
 * @throws {ErroIndexacao} Se o provedor devolver quantidade errada de vetores.
 * @throws {ErroIndexacaoCancelada} Se o sinal for cancelado antes de um lote.
 */
async function gerarVetores(textos: string[], contexto: ContextoEmbedding): Promise<number[][]> {
  if (textos.length === 0) return [];
  const { provedor, limitar, configuracao, sinal } = contexto;
  const politica = {
    esperar: configuracao.esperar,
    tentativasExtras: configuracao.tentativasExtras,
  };

  const gerarLote = async (lote: string[]): Promise<number[][]> => {
    lancarSeCancelado(sinal);
    const vetores = await executarComNovasTentativas(async () => {
      await limitar();
      lancarSeCancelado(sinal);
      return provedor.gerarEmbeddings(lote);
    }, politica);
    if (vetores.length !== lote.length) throw new ErroIndexacao(MSG_VETORES_FALTANDO);
    return vetores;
  };

  const lotes = dividirEmLotes(textos, configuracao.tamanhoLote);
  const porLote = await executarComLimite(lotes, configuracao.concorrencia, gerarLote);
  return porLote.flat();
}

/* ----------------------------- Auxiliares: documentos e entradas ----------------------------- */

/**
 * Confere os documentos: `id` não vazio e único, texto presente.
 * @param {DocumentoIndexavel[]} documentos - Documentos recebidos.
 * @returns {void}
 * @throws {ErroIndexacao} Se algum documento for inválido ou repetido.
 */
function validarDocumentos(documentos: DocumentoIndexavel[]): void {
  const vistos = new Set<string>();
  for (const documento of documentos) {
    const valido =
      typeof documento?.id === 'string' &&
      documento.id.trim() !== '' &&
      typeof documento.texto === 'string';
    if (!valido) throw new ErroIndexacao(MSG_DOCUMENTO_INVALIDO);
    if (vistos.has(documento.id)) {
      throw new ErroIndexacao(`${MSG_DOCUMENTO_REPETIDO}: ${documento.id}`);
    }
    vistos.add(documento.id);
  }
}

/**
 * Divide todos os documentos em pedaços, guardando de qual documento cada um veio.
 * @param {DocumentoIndexavel[]} documentos - Documentos já validados.
 * @returns {PedacoDoDocumento[]} Pedaços na ordem dos documentos.
 */
function dividirDocumentos(documentos: DocumentoIndexavel[]): PedacoDoDocumento[] {
  return documentos.flatMap((documento) => {
    const pedacos = dividirEmPedacos({
      texto: documento.texto,
      tituloArtigo: documento.titulo || documento.id,
      idArtigo: documento.id,
    });
    return pedacos.map((pedaco) => ({ documento, pedaco }));
  });
}

/**
 * Monta as entradas do índice a partir dos pedaços e dos vetores (mesma ordem).
 * @param {PedacoDoDocumento[]} pedacos - Pedaços com o documento.
 * @param {number[][]} vetores - Um vetor por pedaço.
 * @returns {EntradaIndice[]} Entradas `<documento>#<chunk_index>` com `source_type` `chunk`.
 */
function montarEntradas(pedacos: PedacoDoDocumento[], vetores: number[][]): EntradaIndice[] {
  return pedacos.map(({ documento, pedaco }, posicao) => ({
    id: `${documento.id}${SEPARADOR_ID_PEDACO}${pedaco.metadata.chunk_index}`,
    text: pedaco.texto,
    embedding: vetores[posicao],
    source_type: TIPO_FONTE_PEDACO,
    metadata: pedaco.metadata,
  }));
}

/**
 * Garante que as entradas novas têm a dimensão do índice existente.
 * @param {IndiceVetorialMemoria} indice - Índice atual.
 * @param {EntradaIndice[]} entradas - Entradas novas.
 * @returns {void}
 * @throws {ErroIndexacao} Se a dimensão mudou (troca de modelo exige indexação completa).
 */
function validarDimensaoCompativel(indice: IndiceVetorialMemoria, entradas: EntradaIndice[]): void {
  const dimensaoNova = entradas[0]?.embedding.length;
  const incompativel =
    indice.dimensao !== null && dimensaoNova !== undefined && dimensaoNova !== indice.dimensao;
  if (!incompativel) return;
  throw new ErroIndexacao(`${MSG_DIMENSAO_MUDOU} (${dimensaoNova} em vez de ${indice.dimensao})`);
}

/**
 * Valida o texto da consulta.
 * @param {string} consulta - Pergunta do usuário.
 * @returns {string} Consulta sem espaços nas pontas.
 * @throws {ErroIndexacao} Se for vazia ou passar de 10.000 caracteres.
 */
function validarConsulta(consulta: string): string {
  const texto = typeof consulta === 'string' ? consulta.trim() : '';
  if (!texto) throw new ErroIndexacao(MSG_CONSULTA_VAZIA);
  if (texto.length > TAMANHO_MAXIMO_CONSULTA) {
    throw new ErroIndexacao(`${MSG_CONSULTA_LONGA} (${TAMANHO_MAXIMO_CONSULTA})`);
  }
  return texto;
}

/**
 * Valida a quantidade de resultados.
 * @param {number} k - Quantidade pedida.
 * @returns {number} O próprio k.
 * @throws {ErroIndexacao} Se k não for inteiro entre 1 e 100.
 */
function validarK(k: number): number {
  const kValido = Number.isInteger(k) && k >= 1 && k <= K_MAXIMO_BUSCA;
  if (!kValido) throw new ErroIndexacao(`${MSG_K_INVALIDO} ${K_MAXIMO_BUSCA}: ${k}`);
  return k;
}

/**
 * Busca no índice: HNSW/linear pelo próprio índice, ou linear sobre um `source_type`.
 * @param {IndiceVetorialMemoria} indice - Índice do projeto.
 * @param {number[]} vetor - Embedding da consulta.
 * @param {OpcoesBuscaIndexacao & { k: number }} opcoes - k, ef e filtro.
 * @returns {EntradaComPontuacao[]} Entradas da mais para a menos parecida.
 */
function buscarNoIndice(
  indice: IndiceVetorialMemoria,
  vetor: number[],
  opcoes: OpcoesBuscaIndexacao & { k: number },
): EntradaComPontuacao[] {
  if (opcoes.tipoFonte === undefined) return indice.buscar(vetor, { k: opcoes.k, ef: opcoes.ef });

  const filtradas = indice
    .listarEntradas()
    .filter((entrada) => entrada.source_type === opcoes.tipoFonte);
  return buscarMaisParecidos(vetor, filtradas, opcoes.k);
}

/**
 * Converte a entrada encontrada em resultado de busca, sem o embedding.
 * @param {EntradaComPontuacao} encontrada - Entrada e pontuação.
 * @returns {ResultadoBuscaPedaco} Resultado para a interface.
 */
function paraResultado(encontrada: EntradaComPontuacao): ResultadoBuscaPedaco {
  const { entrada, pontuacao } = encontrada;
  return {
    id: entrada.id,
    tipo: TIPO_RESULTADO_PEDACO,
    texto: entrada.text,
    pontuacao,
    tipoFonte: entrada.source_type,
    metadata: entrada.metadata ?? null,
  };
}

/**
 * Avisa o progresso, se houver quem escute.
 * @param {OpcoesIndexacao} opcoes - Opções com o ouvinte.
 * @param {FaseSincronizacao} fase - Fase atual.
 * @param {Omit<ProgressoIndexacao, 'phase'>} dados - Mensagem e contagens.
 * @returns {void}
 */
function notificar(
  opcoes: OpcoesIndexacao,
  fase: FaseSincronizacao,
  dados: Omit<ProgressoIndexacao, 'phase'>,
): void {
  opcoes.aoProgredir?.({ phase: fase, ...dados });
}

/* ----------------------------- Serviço ----------------------------- */

/** Indexa os documentos de cada projeto no `vectors.json` e busca nele. */
export class ServicoIndexacao {
  private readonly dependencias: DependenciasServicoIndexacao;
  private readonly configuracao: ConfiguracaoEmbedding;
  private readonly limitar: () => Promise<void>;
  private readonly indices = new Map<string, IndiceVetorialMemoria>();
  private readonly filas = new Map<string, Promise<unknown>>();

  /**
   * @param {DependenciasServicoIndexacao} dependencias - Repositórios, fonte, provedor e ajustes.
   * @throws {ErroIndexacao} Se a configuração de embedding for inválida.
   */
  constructor(dependencias: DependenciasServicoIndexacao) {
    this.dependencias = dependencias;
    this.configuracao = resolverConfiguracao(dependencias);
    this.limitar = criarLimitadorTaxa(this.configuracao);
    const { rpm, fatorUsoRpm } = this.configuracao;
    const percentual = fatorUsoRpm * CEM_POR_CENTO;
    dependencias.registrarLog?.(
      `Embedder rate limiter: ${rpm} RPM, ${percentual}% uso = ${rpm * fatorUsoRpm} RPM efetivo`,
    );
  }

  /**
   * Indexação completa: lê todos os documentos do projeto e recria o índice do zero.
   * @param {string} idProjeto - ID do projeto.
   * @param {OpcoesIndexacao} opcoes - Progresso e cancelamento.
   * @returns {Promise<ResumoIndexacao>} Contagens (ou `cancelada: true`).
   * @throws {Error} Se o projeto não existir, a leitura, o embedding ou a gravação falhar.
   */
  async indexarProjeto(idProjeto: string, opcoes: OpcoesIndexacao = {}): Promise<ResumoIndexacao> {
    await this.exigirProjeto(idProjeto);
    return this.enfileirar(idProjeto, () =>
      this.executarCancelavel(opcoes, async () => {
        notificar(opcoes, 'fetching', { mensagem: MSG_LENDO_DOCUMENTOS });
        const documentos = await this.dependencias.fonteDocumentos.listar(idProjeto);
        const entradas = await this.prepararEntradas(documentos, opcoes);

        const indice = new IndiceVetorialMemoria([], this.dependencias.opcoesIndice);
        indice.adicionar(entradas);
        return this.salvarIndice(idProjeto, indice, {
          opcoes,
          documentos: documentos.length,
          pedacos: entradas.length,
        });
      }),
    );
  }

  /**
   * Indexação incremental: troca no índice só os documentos recebidos (novos ou atualizados).
   * @param {string} idProjeto - ID do projeto.
   * @param {DocumentoIndexavel[]} documentos - Documentos a (re)indexar.
   * @param {OpcoesIndexacao} opcoes - Progresso e cancelamento.
   * @returns {Promise<ResumoIndexacao>} Contagens (ou `cancelada: true`).
   * @throws {ErroIndexacao} Se a dimensão dos embeddings mudou ou um documento for inválido.
   */
  async indexarDocumentos(
    idProjeto: string,
    documentos: DocumentoIndexavel[],
    opcoes: OpcoesIndexacao = {},
  ): Promise<ResumoIndexacao> {
    await this.exigirProjeto(idProjeto);
    return this.enfileirar(idProjeto, () =>
      this.executarCancelavel(opcoes, async () => {
        const entradas = await this.prepararEntradas(documentos, opcoes);
        const indice = await this.obterIndice(idProjeto);
        validarDimensaoCompativel(indice, entradas);

        this.indices.delete(idProjeto);
        documentos.forEach((documento) => indice.removerArtigo(documento.id));
        indice.adicionar(entradas);
        return this.salvarIndice(idProjeto, indice, {
          opcoes,
          documentos: documentos.length,
          pedacos: entradas.length,
        });
      }),
    );
  }

  /**
   * Tira do índice as entradas dos documentos (artigos apagados) e grava.
   * @param {string} idProjeto - ID do projeto.
   * @param {string[]} idsDocumentos - IDs dos documentos a remover.
   * @returns {Promise<number>} Quantidade de entradas removidas.
   * @throws {Error} Se o projeto não existir ou a gravação falhar.
   */
  async removerDocumentos(idProjeto: string, idsDocumentos: string[]): Promise<number> {
    await this.exigirProjeto(idProjeto);
    return this.enfileirar(idProjeto, async () => {
      const indice = await this.obterIndice(idProjeto);
      this.indices.delete(idProjeto);
      const removidas = idsDocumentos.reduce((soma, id) => soma + indice.removerArtigo(id), 0);
      if (removidas > 0) await this.dependencias.repositorioIndice.gravar(idProjeto, indice);
      this.indices.set(idProjeto, indice);
      return removidas;
    });
  }

  /**
   * Busca os pedaços mais parecidos com a consulta.
   * @param {string} idProjeto - ID do projeto.
   * @param {string} consulta - Pergunta (até 10.000 caracteres).
   * @param {OpcoesBuscaIndexacao} opcoes - k (1–100, padrão 5), ef e filtro por `source_type`.
   * @returns {Promise<ResultadoBuscaPedaco[]>} Resultados do mais para o menos parecido.
   * @throws {ErroIndexacao} Se a consulta ou o k forem inválidos.
   * @throws {Error} Se o projeto não existir ou o embedding falhar.
   */
  async buscar(
    idProjeto: string,
    consulta: string,
    opcoes: OpcoesBuscaIndexacao = {},
  ): Promise<ResultadoBuscaPedaco[]> {
    const texto = validarConsulta(consulta);
    const k = validarK(opcoes.k ?? K_PADRAO_BUSCA);
    await this.exigirProjeto(idProjeto);

    const indice = await this.obterIndice(idProjeto);
    if (indice.quantidade === 0) return [];

    const provedor = await this.dependencias.obterProvedor();
    const [vetor] = await gerarVetores([texto], this.criarContexto(provedor));
    return buscarNoIndice(indice, vetor, { ...opcoes, k }).map(paraResultado);
  }

  /**
   * Esquece o índice em memória do projeto (ex.: projeto removido ou trocado).
   * @param {string} idProjeto - ID do projeto.
   * @returns {void}
   */
  descartarCache(idProjeto: string): void {
    this.indices.delete(idProjeto);
  }

  /**
   * Valida, divide e vetoriza os documentos.
   * @param {DocumentoIndexavel[]} documentos - Documentos a indexar.
   * @param {OpcoesIndexacao} opcoes - Progresso e cancelamento.
   * @returns {Promise<EntradaIndice[]>} Entradas prontas para o índice.
   * @throws {ErroIndexacao} Se algum documento for inválido.
   */
  private async prepararEntradas(
    documentos: DocumentoIndexavel[],
    opcoes: OpcoesIndexacao,
  ): Promise<EntradaIndice[]> {
    validarDocumentos(documentos);
    lancarSeCancelado(opcoes.sinal);
    notificar(opcoes, 'chunking', { mensagem: MSG_DIVIDINDO, documentos: documentos.length });
    const pedacos = dividirDocumentos(documentos);

    lancarSeCancelado(opcoes.sinal);
    const mensagem = `Gerando embeddings (${pedacos.length} chunks)...`;
    notificar(opcoes, 'embedding', { mensagem, pedacos: pedacos.length });
    const textos = pedacos.map(({ pedaco }) => pedaco.texto);
    const vetores = textos.length === 0 ? [] : await this.vetorizar(textos, opcoes.sinal);

    lancarSeCancelado(opcoes.sinal);
    return montarEntradas(pedacos, vetores);
  }

  /**
   * Vetoriza textos com o provedor configurado agora.
   * @param {string[]} textos - Textos não vazios.
   * @param {AbortSignal | undefined} sinal - Cancelamento.
   * @returns {Promise<number[][]>} Um vetor por texto.
   */
  private async vetorizar(textos: string[], sinal: AbortSignal | undefined): Promise<number[][]> {
    const provedor = await this.dependencias.obterProvedor();
    return gerarVetores(textos, { ...this.criarContexto(provedor), sinal });
  }

  /**
   * Grava o índice, guarda em memória e avisa as fases `saving` e `done`.
   * @param {string} idProjeto - ID do projeto.
   * @param {IndiceVetorialMemoria} indice - Índice pronto.
   * @param {{opcoes: OpcoesIndexacao, documentos: number, pedacos: number}} dados - Opções e
   *   contagens.
   * @returns {Promise<ResumoIndexacao>} Resumo da indexação.
   */
  private async salvarIndice(
    idProjeto: string,
    indice: IndiceVetorialMemoria,
    dados: { opcoes: OpcoesIndexacao; documentos: number; pedacos: number },
  ): Promise<ResumoIndexacao> {
    const { opcoes, documentos, pedacos } = dados;
    lancarSeCancelado(opcoes.sinal);
    notificar(opcoes, 'saving', { mensagem: MSG_GRAVANDO, documentos, pedacos });
    await this.dependencias.repositorioIndice.gravar(idProjeto, indice);
    this.indices.set(idProjeto, indice);

    const totalEntradas = indice.quantidade;
    this.dependencias.registrarLog?.(
      `Indexação do projeto ${idProjeto}: ${documentos} documentos, ${pedacos} chunks, ` +
        `${totalEntradas} entries no índice`,
    );
    notificar(opcoes, 'done', { mensagem: MSG_CONCLUIDA, documentos, pedacos });
    return { documentos, pedacos, totalEntradas, cancelada: false };
  }

  /**
   * Roda a indexação e transforma o cancelamento em resumo com `cancelada: true`.
   * @param {OpcoesIndexacao} opcoes - Progresso (recebe a fase `cancelled`).
   * @param {() => Promise<ResumoIndexacao>} operacao - Indexação a rodar.
   * @returns {Promise<ResumoIndexacao>} Resumo da operação ou do cancelamento.
   * @throws {Error} Qualquer erro que não seja o cancelamento.
   */
  private async executarCancelavel(
    opcoes: OpcoesIndexacao,
    operacao: () => Promise<ResumoIndexacao>,
  ): Promise<ResumoIndexacao> {
    try {
      return await operacao();
    } catch (erro) {
      if (!(erro instanceof ErroIndexacaoCancelada)) throw erro;
      notificar(opcoes, 'cancelled', { mensagem: MSG_CANCELADA });
      return { documentos: 0, pedacos: 0, totalEntradas: 0, cancelada: true };
    }
  }

  /**
   * Monta o contexto de embedding com o limitador de taxa do serviço (compartilhado).
   * @param {ProvedorEmbedding} provedor - Provedor do modo atual.
   * @returns {ContextoEmbedding} Contexto sem sinal de cancelamento.
   */
  private criarContexto(provedor: ProvedorEmbedding): ContextoEmbedding {
    return { provedor, limitar: this.limitar, configuracao: this.configuracao };
  }

  /**
   * Devolve o índice em memória do projeto, carregando de `vectors.json` na primeira vez.
   * @param {string} idProjeto - ID do projeto.
   * @returns {Promise<IndiceVetorialMemoria>} Índice do projeto.
   */
  private async obterIndice(idProjeto: string): Promise<IndiceVetorialMemoria> {
    const emMemoria = this.indices.get(idProjeto);
    if (emMemoria) return emMemoria;

    const carregado = await this.dependencias.repositorioIndice.carregar(idProjeto);
    this.indices.set(idProjeto, carregado);
    return carregado;
  }

  /**
   * Garante que o projeto existe no registro.
   * @param {string} idProjeto - ID do projeto.
   * @returns {Promise<void>}
   * @throws {ErroIndexacao} Se o projeto não existir (ou o ID for inválido).
   */
  private async exigirProjeto(idProjeto: string): Promise<void> {
    const projeto = await this.dependencias.repositorioProjetos.buscarPorId(idProjeto);
    if (!projeto) throw new ErroIndexacao(`${MSG_PROJETO_NAO_ENCONTRADO}: ${idProjeto}`);
  }

  /**
   * Roda uma operação por vez em cada projeto (sem gravações simultâneas do `vectors.json`).
   * @param {string} idProjeto - ID do projeto.
   * @param {() => Promise<T>} operacao - Operação a rodar.
   * @returns {Promise<T>} Resultado da operação.
   */
  private enfileirar<T>(idProjeto: string, operacao: () => Promise<T>): Promise<T> {
    const anterior = this.filas.get(idProjeto) ?? Promise.resolve();
    const etapa = anterior.then(operacao);
    const segura = etapa.catch(() => undefined);
    this.filas.set(idProjeto, segura);
    void segura.then(() => {
      if (this.filas.get(idProjeto) === segura) this.filas.delete(idProjeto);
    });
    return etapa;
  }
}

/* ----------------------------- Montagem: provedores e fonte de pasta ----------------------------- */

/**
 * Cria a fábrica com os provedores existentes registrados (`Api`, `Gemini`, `OpenRouter`).
 * O modo `Custom` ainda não tem provedor: a fábrica responde com erro claro.
 * @param {typeof fetch} buscar - `fetch` injetado em todos os provedores.
 * @returns {FabricaProvedoresEmbedding} Fábrica pronta.
 */
export function criarFabricaProvedoresPadrao(buscar: typeof fetch): FabricaProvedoresEmbedding {
  const fabrica = new FabricaProvedoresEmbedding();
  registrarProvedorOpenAi(fabrica, buscar);
  fabrica.registrar('Gemini', (modo: ModoEmbedding) =>
    criarProvedorGemini(modo as ModoEmbeddingGemini, { fetch: buscar }),
  );
  fabrica.registrar('OpenRouter', (modo: ModoEmbedding) =>
    criarProvedorOpenRouter(modo as ModoEmbeddingOpenRouter, { buscar }),
  );
  return fabrica;
}

/**
 * Cria o obtentor de provedor: lê o modo atual (já com as chaves do cofre) e monta o provedor.
 * @param {{fabrica: FabricaProvedoresEmbedding, obterModo: () => Promise<ModoEmbedding>}}
 *   dependencias - Fábrica e leitura do modo de `embedder_config.json`.
 * @returns {ObtentorProvedor} Função para `DependenciasServicoIndexacao.obterProvedor`.
 */
export function criarObtentorProvedor(dependencias: {
  fabrica: FabricaProvedoresEmbedding;
  obterModo: () => Promise<ModoEmbedding>;
}): ObtentorProvedor {
  return async () => dependencias.fabrica.criar(await dependencias.obterModo());
}

/** Leitura de arquivos usada pela fonte de pasta (trocável por um falso). */
export interface LeitorArquivosProjeto {
  /** Lista os caminhos completos de todos os arquivos da pasta (recursivo; ausente = vazia). */
  listarArquivos(pasta: string): Promise<string[]>;
  /** Lê o arquivo como texto UTF-8. */
  lerTexto(caminho: string): Promise<string>;
}

/** Dependências da fonte de documentos de pasta. */
export interface DependenciasFontePasta {
  /** Pasta com os documentos de cada projeto. */
  obterPasta: (idProjeto: string) => string | Promise<string>;
  /** Leitura de arquivos (padrão: `node:fs`). */
  leitor?: LeitorArquivosProjeto;
  /** Extensões aceitas (padrão: `.md`, `.markdown`, `.txt`). */
  extensoes?: readonly string[];
}

/**
 * Diz se o erro do Node é "pasta não existe".
 * @param {unknown} erro - Erro capturado.
 * @returns {boolean} true para ENOENT.
 */
function ehInexistente(erro: unknown): boolean {
  return (erro as NodeJS.ErrnoException | undefined)?.code === CODIGO_ARQUIVO_INEXISTENTE;
}

/**
 * Cria a leitura de arquivos usando `node:fs/promises`.
 * @returns {LeitorArquivosProjeto} Implementação padrão.
 */
export function criarLeitorArquivosNode(): LeitorArquivosProjeto {
  return {
    async listarArquivos(pasta) {
      try {
        const itens = await readdir(pasta, { recursive: true, withFileTypes: true });
        return itens
          .filter((item) => item.isFile())
          .map((item) => path.join(item.parentPath, item.name));
      } catch (erro) {
        if (ehInexistente(erro)) return [];
        throw erro;
      }
    },
    lerTexto(caminho) {
      return readFile(caminho, CODIFICACAO_TEXTO);
    },
  };
}

/**
 * Diz se o arquivo entra na indexação: extensão aceita, fora de pasta oculta e de
 * `node_modules`.
 * @param {string} relativo - Caminho relativo à pasta, com `/`.
 * @param {readonly string[]} extensoes - Extensões aceitas, em minúsculas.
 * @returns {boolean} true se o arquivo deve ser lido.
 */
function deveIndexarArquivo(relativo: string, extensoes: readonly string[]): boolean {
  const partes = relativo.split(SEPARADOR_ID_DOCUMENTO);
  const ignorado = partes.some((parte) => {
    return parte.startsWith(PREFIXO_OCULTO) || PASTAS_IGNORADAS.includes(parte);
  });
  if (ignorado) return false;
  return extensoes.includes(path.extname(relativo).toLowerCase());
}

/**
 * Cria a fonte que lê os documentos de uma pasta: o `id` é o caminho relativo (com `/`) e o
 * título é o nome do arquivo sem extensão.
 * @param {DependenciasFontePasta} dependencias - Pasta por projeto, leitor e extensões.
 * @returns {FonteDocumentos} Fonte pronta para o serviço.
 */
export function criarFonteDocumentosPasta(dependencias: DependenciasFontePasta): FonteDocumentos {
  const leitor = dependencias.leitor ?? criarLeitorArquivosNode();
  const extensoes = (dependencias.extensoes ?? EXTENSOES_DOCUMENTO_PADRAO).map((extensao) => {
    return extensao.toLowerCase();
  });

  return {
    async listar(idProjeto) {
      const pasta = await dependencias.obterPasta(idProjeto);
      const relativos = (await leitor.listarArquivos(pasta))
        .map((caminho) => path.relative(pasta, caminho).split(path.sep).join('/'))
        .filter((relativo) => deveIndexarArquivo(relativo, extensoes))
        .sort();

      const documentos: DocumentoIndexavel[] = [];
      for (const relativo of relativos) {
        const texto = await leitor.lerTexto(path.join(pasta, relativo));
        const titulo = path.basename(relativo, path.extname(relativo));
        documentos.push({ id: relativo, titulo, texto });
      }
      return documentos;
    },
  };
}
