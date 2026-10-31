/**
 * Cofre das chaves de API dos provedores (embedding, chat e imagem).
 *
 * O original grava as chaves em texto puro dentro de `embedder_config.json` (`api_key`,
 * `embedding_api_key`) e de `image_api_config.json` (docs/inventario/arquivos-locais.md).
 * *(Escolha do clone)*: as chaves ficam cifradas em `provider_keys.json`, com o mesmo
 * `CifradorSeguro` do cofre de tokens (DPAPI pelo `safeStorage` no Windows), e os dois JSON de
 * configuração vão para o disco com a chave vazia. `separarChaves*` tira as chaves da
 * configuração antes de gravar; `preencherChaves*` devolve a configuração completa para os
 * provedores. Sem cifragem disponível, nada é gravado (mesma regra do cofre de tokens).
 */
import type { CifradorSeguro } from '../login/cofre-tokens';
import { obterCaminhoTemporario } from '../armazenamento/caminhos';
import {
  criarSistemaArquivosNode,
  gravarJson,
  lerJson,
  type SistemaArquivos,
} from '../armazenamento/arquivo-json';
import type { ConfiguracaoEmbedder, ModoEmbedding } from '../../compartilhado/tipos-vetores';
import type { ConfiguracaoApiImagem } from '../../compartilhado/tipos-imagem';

/** Versão do envelope gravado em `provider_keys.json`. */
export const VERSAO_ENVELOPE_CHAVES = 1;

/** Cada chave guardada: modo de embedding (e chave própria de embedding) ou bloco de imagem. */
export const IDS_CHAVE_PROVEDOR = [
  'embedding.Api',
  'embedding.Gemini',
  'embedding.OpenRouter',
  'embedding.OpenRouter.embedding',
  'embedding.Custom',
  'embedding.Custom.embedding',
  'imagem.openai',
  'imagem.gemini',
] as const;

/** Identificador de uma chave guardada no cofre. */
export type IdChaveProvedor = (typeof IDS_CHAVE_PROVEDOR)[number];

/** Mapa id → chave, o que vai cifrado dentro do envelope. */
export type MapaChavesProvedores = Partial<Record<IdChaveProvedor, string>>;

/** Envelope gravado em `provider_keys.json`: `data` é o mapa cifrado, em base64. */
export interface EnvelopeChavesCifrado {
  v: number;
  data: string;
}

const CODIFICACAO_ENVELOPE: BufferEncoding = 'base64';
const PADRAO_BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;
const SUFIXO_EMBEDDING = '.embedding';
const PREFIXO_EMBEDDING = 'embedding.';
const CHAVE_VAZIA = '';
const CARACTERES_VISIVEIS_MASCARA = 4;
const TAMANHO_MINIMO_PARA_MOSTRAR_FIM = 12;
const MASCARA = '••••';

const MSG_CIFRAGEM_INDISPONIVEL =
  'Cifragem do sistema indisponível: chaves de API NÃO foram salvas por segurança';
const MSG_FALHA_CIFRAR = 'Falha ao cifrar as chaves de API: nada foi salvo';
const MSG_ID_INVALIDO = 'Identificador de chave de provedor desconhecido';
const AVISO_ARQUIVO_ILEGIVEL = 'provider_keys.json ilegível; seguindo sem chaves';
const AVISO_VERSAO_NAO_SUPORTADA =
  'Versão do envelope de chaves não suportada; seguindo sem chaves';
const AVISO_SEM_CIFRAGEM_LEITURA = 'Cifragem indisponível; não dá para ler as chaves de API';
const AVISO_FALHA_DECIFRAR = 'Falha ao decifrar provider_keys.json; seguindo sem chaves';

/** Dependências injetadas no cofre de chaves. */
export interface DependenciasCofreChaves {
  /** Caminho do `provider_keys.json` (`obterCaminhosGlobais(...).chavesProvedores`). */
  caminhoArquivo: string;
  cifrador: CifradorSeguro;
  /** Acesso a arquivos (padrão: `node:fs`). */
  arquivos?: SistemaArquivos;
  /** Recebe os avisos. Nunca recebe as chaves. */
  registrarAviso: (mensagem: string) => void;
}

/** Operações do cofre de chaves. */
export interface CofreChavesProvedores {
  /** Devolve a chave guardada, ou null se não houver (ou se o arquivo não abrir). */
  ler(id: IdChaveProvedor): Promise<string | null>;
  /** Guarda a chave; texto vazio remove. Lança `ErroCofreChaves` se não puder cifrar. */
  gravar(id: IdChaveProvedor, chave: string): Promise<void>;
  /** Remove a chave (não faz nada se não existir). */
  remover(id: IdChaveProvedor): Promise<void>;
  /** Lista os ids que têm chave guardada (para a tela mostrar "configurada"). */
  listarConfiguradas(): Promise<IdChaveProvedor[]>;
  /** Apaga o arquivo inteiro e o `.tmp`. */
  apagarTudo(): Promise<void>;
}

/** Erro do cofre de chaves (cifragem indisponível, falha ao cifrar, id desconhecido). */
export class ErroCofreChaves extends Error {
  /**
   * @param mensagem - O que deu errado (sem as chaves).
   * @param causa - Erro original, se houver.
   */
  constructor(mensagem: string, causa?: unknown) {
    super(mensagem, { cause: causa });
    this.name = 'ErroCofreChaves';
  }
}

/**
 * Diz se o texto é um identificador de chave conhecido.
 * @param id - Texto a conferir (pode vir do renderer).
 * @returns true se estiver em `IDS_CHAVE_PROVEDOR`.
 */
export function ehIdChaveProvedor(id: unknown): id is IdChaveProvedor {
  return typeof id === 'string' && (IDS_CHAVE_PROVEDOR as readonly string[]).includes(id);
}

/**
 * Mascara a chave para mostrar na tela (nunca mandar a chave inteira ao renderer).
 * @param chave - Chave completa.
 * @returns `••••` mais os 4 últimos caracteres (só `••••` se a chave for curta ou vazia).
 */
export function mascararChave(chave: string): string {
  const podeMostrarFim = chave.length >= TAMANHO_MINIMO_PARA_MOSTRAR_FIM;
  if (!podeMostrarFim) return MASCARA;
  return MASCARA + chave.slice(-CARACTERES_VISIVEIS_MASCARA);
}

/**
 * Diz se o valor tem a forma do envelope, em qualquer versão.
 * @param valor - Valor lido do arquivo.
 * @returns true se tiver `v` numérico e `data` em base64.
 */
function ehEnvelope(valor: unknown): valor is EnvelopeChavesCifrado {
  if (typeof valor !== 'object' || valor === null) return false;

  const envelope = valor as Partial<Record<keyof EnvelopeChavesCifrado, unknown>>;
  const temDados = typeof envelope.data === 'string' && PADRAO_BASE64.test(envelope.data);
  return typeof envelope.v === 'number' && temDados;
}

/**
 * Fica só com os pares id conhecido → texto não vazio.
 * @param valor - Conteúdo decifrado.
 * @returns Mapa limpo, ou null se não for um objeto.
 */
function limparMapa(valor: unknown): MapaChavesProvedores | null {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) return null;

  const mapa: MapaChavesProvedores = {};
  for (const [id, chave] of Object.entries(valor)) {
    const ehValido = ehIdChaveProvedor(id) && typeof chave === 'string' && chave.length > 0;
    if (ehValido) mapa[id] = chave;
  }
  return mapa;
}

/**
 * Lê o envelope do disco sem lançar erro.
 * @param dependencias - Caminho, arquivos e aviso.
 * @returns Envelope da versão atual, ou null (sem arquivo, ilegível ou versão desconhecida).
 */
async function lerEnvelope(
  dependencias: DependenciasCofreChaves,
): Promise<EnvelopeChavesCifrado | null> {
  let conteudo: unknown;
  try {
    conteudo = await lerJson<unknown>(dependencias.caminhoArquivo, null, dependencias.arquivos);
  } catch {
    dependencias.registrarAviso(AVISO_ARQUIVO_ILEGIVEL);
    return null;
  }

  if (conteudo === null) return null;
  if (!ehEnvelope(conteudo)) {
    dependencias.registrarAviso(AVISO_ARQUIVO_ILEGIVEL);
    return null;
  }
  if (conteudo.v !== VERSAO_ENVELOPE_CHAVES) {
    dependencias.registrarAviso(AVISO_VERSAO_NAO_SUPORTADA);
    return null;
  }
  return conteudo;
}

/**
 * Lê e decifra o mapa de chaves, sem lançar erro.
 * @param dependencias - Caminho, cifrador, arquivos e aviso.
 * @returns Mapa (vazio se não houver arquivo ou se ele não abrir).
 */
async function lerMapa(dependencias: DependenciasCofreChaves): Promise<MapaChavesProvedores> {
  const envelope = await lerEnvelope(dependencias);
  if (!envelope) return {};
  if (!dependencias.cifrador.estaDisponivel()) {
    dependencias.registrarAviso(AVISO_SEM_CIFRAGEM_LEITURA);
    return {};
  }

  try {
    const dados = Buffer.from(envelope.data, CODIFICACAO_ENVELOPE);
    const mapa = limparMapa(JSON.parse(dependencias.cifrador.decifrar(dados)));
    if (mapa) return mapa;
  } catch {
    // Cai no aviso abaixo: chave do usuário mudou, arquivo de outro aparelho ou corrompido.
  }
  dependencias.registrarAviso(AVISO_FALHA_DECIFRAR);
  return {};
}

/**
 * Cifra e grava o mapa inteiro de forma atômica. Confere a cifragem antes de tocar no disco.
 * @param mapa - Mapa id → chave.
 * @param dependencias - Caminho, cifrador e arquivos.
 * @returns Promessa resolvida quando o arquivo estiver gravado.
 * @throws {ErroCofreChaves} Se a cifragem estiver indisponível ou falhar.
 */
async function gravarMapa(
  mapa: MapaChavesProvedores,
  dependencias: DependenciasCofreChaves,
): Promise<void> {
  if (!dependencias.cifrador.estaDisponivel()) {
    throw new ErroCofreChaves(MSG_CIFRAGEM_INDISPONIVEL);
  }

  let envelope: EnvelopeChavesCifrado;
  try {
    const cifrado = dependencias.cifrador.cifrar(JSON.stringify(mapa));
    envelope = { v: VERSAO_ENVELOPE_CHAVES, data: cifrado.toString(CODIFICACAO_ENVELOPE) };
  } catch (erro) {
    throw new ErroCofreChaves(MSG_FALHA_CIFRAR, erro);
  }
  await gravarJson(dependencias.caminhoArquivo, envelope, dependencias.arquivos);
}

/**
 * Garante que o id é conhecido (o id pode chegar do renderer pelo IPC).
 * @param id - Identificador recebido.
 * @returns O próprio id.
 * @throws {ErroCofreChaves} Se o id for desconhecido.
 */
function validarIdChave(id: IdChaveProvedor): IdChaveProvedor {
  if (!ehIdChaveProvedor(id)) throw new ErroCofreChaves(MSG_ID_INVALIDO);
  return id;
}

/**
 * Cria o cofre de chaves. As alterações passam por uma fila, para duas gravações seguidas
 * não perderem uma à outra (cada uma lê, muda e grava o mapa inteiro).
 * @param dependencias - Caminho do `provider_keys.json`, cifrador, arquivos e aviso.
 * @returns Cofre com ler, gravar, remover, listar e apagar.
 */
export function criarCofreChavesProvedores(
  dependencias: DependenciasCofreChaves,
): CofreChavesProvedores {
  const arquivos = dependencias.arquivos ?? criarSistemaArquivosNode();
  const completas: DependenciasCofreChaves = { ...dependencias, arquivos };
  let fila: Promise<unknown> = Promise.resolve();

  const enfileirar = <T>(tarefa: () => Promise<T>): Promise<T> => {
    const resultado = fila.then(tarefa, tarefa);
    fila = resultado.catch(() => undefined);
    return resultado;
  };

  const alterar = (id: IdChaveProvedor, chave: string): Promise<void> =>
    enfileirar(async () => {
      const mapa = await lerMapa(completas);
      if (chave.length > 0) mapa[validarIdChave(id)] = chave;
      else delete mapa[validarIdChave(id)];
      await gravarMapa(mapa, completas);
    });

  return {
    ler: (id) => enfileirar(async () => (await lerMapa(completas))[validarIdChave(id)] ?? null),
    gravar: (id, chave) => alterar(id, chave.trim()),
    remover: (id) => alterar(id, CHAVE_VAZIA),
    listarConfiguradas: () =>
      enfileirar(async () => Object.keys(await lerMapa(completas)) as IdChaveProvedor[]),
    apagarTudo: () =>
      enfileirar(async () => {
        await arquivos.remover(completas.caminhoArquivo);
        await arquivos.remover(obterCaminhoTemporario(completas.caminhoArquivo));
      }),
  };
}

/* ------------------------- Ligação com as configurações em JSON ------------------------- */

/** Chave principal e chave própria de embedding de um modo (null quando o modo não tem). */
interface ChavesDoModo {
  principal: string;
  embedding: string | null;
}

/**
 * Lê as chaves que vieram dentro do modo de embedding.
 * @param modo - Modo de `embedder_config.json`.
 * @returns Chave principal e, em OpenRouter e Custom, a de embedding.
 */
function extrairChavesDoModo(modo: ModoEmbedding): ChavesDoModo {
  if (modo.type === 'OpenRouter' || modo.type === 'Custom') {
    return { principal: modo.api_key, embedding: modo.embedding_api_key ?? null };
  }
  return { principal: modo.api_key, embedding: null };
}

/**
 * Copia o modo trocando as chaves.
 * @param modo - Modo original.
 * @param chaves - Chaves a colocar (`embedding` só vale para OpenRouter e Custom).
 * @returns Novo modo, sem alterar o recebido.
 */
function trocarChavesDoModo(modo: ModoEmbedding, chaves: ChavesDoModo): ModoEmbedding {
  if (modo.type === 'OpenRouter') {
    return { ...modo, api_key: chaves.principal, embedding_api_key: chaves.embedding ?? '' };
  }
  if (modo.type === 'Custom') {
    return { ...modo, api_key: chaves.principal, embedding_api_key: chaves.embedding };
  }
  return { ...modo, api_key: chaves.principal };
}

/**
 * Monta os ids do cofre para um modo de embedding.
 * @param modo - Modo de embedding.
 * @returns Id da chave principal e da chave de embedding.
 */
function idsDoModo(modo: ModoEmbedding): Record<keyof ChavesDoModo, IdChaveProvedor> {
  const principal = `${PREFIXO_EMBEDDING}${modo.type}` as IdChaveProvedor;
  const embedding = `${principal}${SUFIXO_EMBEDDING}` as IdChaveProvedor;
  return { principal, embedding };
}

/**
 * Guarda no cofre as chaves que vieram na configuração do embedder e devolve a configuração
 * pronta para o disco, com as chaves vazias. Chave vazia na entrada não apaga a guardada
 * (a tela manda vazio quando o usuário não mexeu no campo).
 * @param config - Configuração recebida da tela (pode ter chaves).
 * @param cofre - Cofre de chaves.
 * @returns Configuração sem chaves, para gravar em `embedder_config.json`.
 * @throws {ErroCofreChaves} Se houver chave nova e a cifragem estiver indisponível.
 */
export async function separarChavesEmbedder(
  config: ConfiguracaoEmbedder,
  cofre: CofreChavesProvedores,
): Promise<ConfiguracaoEmbedder> {
  const ids = idsDoModo(config.mode);
  const chaves = extrairChavesDoModo(config.mode);

  if (chaves.principal) await cofre.gravar(ids.principal, chaves.principal);
  if (chaves.embedding) await cofre.gravar(ids.embedding, chaves.embedding);

  const embeddingVazia = chaves.embedding === null ? null : CHAVE_VAZIA;
  const vazia: ChavesDoModo = { principal: CHAVE_VAZIA, embedding: embeddingVazia };
  return { ...config, mode: trocarChavesDoModo(config.mode, vazia) };
}

/**
 * Devolve a configuração do embedder com as chaves do cofre, para os provedores usarem.
 * Se o cofre não tiver a chave, mantém a que estiver no arquivo (JSON trazido do original).
 * @param config - Configuração lida de `embedder_config.json`.
 * @param cofre - Cofre de chaves.
 * @returns Configuração completa (só no processo principal; nunca mandar ao renderer).
 */
export async function preencherChavesEmbedder(
  config: ConfiguracaoEmbedder,
  cofre: CofreChavesProvedores,
): Promise<ConfiguracaoEmbedder> {
  const ids = idsDoModo(config.mode);
  const doArquivo = extrairChavesDoModo(config.mode);
  const principal = (await cofre.ler(ids.principal)) ?? doArquivo.principal;
  const embedding = (await cofre.ler(ids.embedding)) ?? doArquivo.embedding;

  return { ...config, mode: trocarChavesDoModo(config.mode, { principal, embedding }) };
}

/**
 * Guarda no cofre as chaves de `image_api_config.json` e devolve a configuração sem elas.
 * Chave vazia na entrada não apaga a guardada.
 * @param config - Configuração recebida da tela.
 * @param cofre - Cofre de chaves.
 * @returns Configuração sem chaves, para gravar no disco.
 * @throws {ErroCofreChaves} Se houver chave nova e a cifragem estiver indisponível.
 */
export async function separarChavesImagem(
  config: ConfiguracaoApiImagem,
  cofre: CofreChavesProvedores,
): Promise<ConfiguracaoApiImagem> {
  if (config.openai?.api_key) await cofre.gravar('imagem.openai', config.openai.api_key);
  if (config.gemini?.api_key) await cofre.gravar('imagem.gemini', config.gemini.api_key);

  const semChaves: ConfiguracaoApiImagem = { ...config };
  if (config.openai) semChaves.openai = { ...config.openai, api_key: CHAVE_VAZIA };
  if (config.gemini) semChaves.gemini = { ...config.gemini, api_key: CHAVE_VAZIA };
  return semChaves;
}

/**
 * Devolve a configuração de imagem com as chaves do cofre (ou as do arquivo, se faltarem).
 * @param config - Configuração lida de `image_api_config.json`.
 * @param cofre - Cofre de chaves.
 * @returns Configuração completa (só no processo principal).
 */
export async function preencherChavesImagem(
  config: ConfiguracaoApiImagem,
  cofre: CofreChavesProvedores,
): Promise<ConfiguracaoApiImagem> {
  const completa: ConfiguracaoApiImagem = { ...config };
  if (config.openai) {
    const chave = (await cofre.ler('imagem.openai')) ?? config.openai.api_key;
    completa.openai = { ...config.openai, api_key: chave };
  }
  if (config.gemini) {
    const chave = (await cofre.ler('imagem.gemini')) ?? config.gemini.api_key;
    completa.gemini = { ...config.gemini, api_key: chave };
  }
  return completa;
}
