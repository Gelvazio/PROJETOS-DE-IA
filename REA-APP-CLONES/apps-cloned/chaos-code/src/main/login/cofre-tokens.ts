/**
 * Cofre dos tokens de login: recria o `auth::tokens` do original (docs/inventario/login.md,
 * seção "Cofre"; arquivos-locais.md, `auth_tokens.json` / `EncryptedEnvelope`).
 *
 * O original guarda no keyring do Windows e, se ele falhar, num `auth_tokens.json` cifrado; se
 * não conseguir cifrar, **não grava** ("tokens NÃO foram salvos por segurança"). No clone a
 * cifragem é a do `safeStorage` do Electron (DPAPI no Windows), injetada pela interface
 * `CifradorSeguro`, e o arquivo é sempre o envelope `{ v, data }`: nada em texto puro no disco.
 */
import type { EnvelopeTokensCifrado, TokensGuardados } from '../../compartilhado/tipos-login';
import { obterCaminhoTemporario } from '../armazenamento/caminhos';
import {
  criarSistemaArquivosNode,
  gravarJson,
  lerJson,
  type SistemaArquivos,
} from '../armazenamento/arquivo-json';

/** Versão do envelope gravado pelo clone (o original confere a versão ao ler). */
export const VERSAO_ENVELOPE_TOKENS = 1;

/** Backend do `safeStorage` no Linux sem chaveiro: só ofusca, não cifra de verdade. */
const BACKEND_SEM_CIFRAGEM = 'basic_text';

const CODIFICACAO_ENVELOPE: BufferEncoding = 'base64';
const PADRAO_BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

const MSG_CIFRAGEM_INDISPONIVEL =
  'Cifragem do sistema indisponível: tokens NÃO foram salvos por segurança';
const MSG_FALHA_CIFRAR = 'Falha ao cifrar tokens: tokens NÃO foram salvos por segurança';
const MSG_TOKENS_INVALIDOS = 'Tokens inválidos: access_token, refresh_token e expires_at';
const AVISO_ARQUIVO_ILEGIVEL = 'auth_tokens.json ilegível; seguindo sem tokens';
const AVISO_VERSAO_NAO_SUPORTADA =
  'Versão do envelope de tokens não suportada; seguindo sem tokens';
const AVISO_SEM_CIFRAGEM_LEITURA = 'Cifragem indisponível; não dá para ler os tokens guardados';
const AVISO_FALHA_DECIFRAR = 'Falha ao decifrar auth_tokens.json; seguindo sem tokens';
const AVISO_CONTEUDO_INVALIDO =
  'Conteúdo decifrado de auth_tokens.json inválido; seguindo sem tokens';

/** Cifragem do sistema usada pelo cofre (no Electron, um adaptador do `safeStorage`). */
export interface CifradorSeguro {
  /** Diz se dá para cifrar de verdade agora (sem isso o cofre recusa gravar). */
  estaDisponivel(): boolean;
  /** Cifra o texto; o resultado só abre neste usuário/aparelho. */
  cifrar(texto: string): Buffer;
  /** Decifra o que `cifrar` produziu. Lança erro se os dados não abrirem. */
  decifrar(dados: Buffer): string;
}

/** Parte do `safeStorage` do Electron que o adaptador usa (sem importar o Electron aqui). */
export interface ApiSafeStorage {
  isEncryptionAvailable(): boolean;
  encryptString(texto: string): Buffer;
  decryptString(dados: Buffer): string;
  /** Só existe no Linux; `basic_text` quer dizer que não há cifragem de verdade. */
  getSelectedStorageBackend?: () => string;
}

/** Dependências injetadas no cofre. */
export interface DependenciasCofreTokens {
  /** Caminho do `auth_tokens.json` (`obterCaminhosGlobais(...).tokensAutenticacao`). */
  caminhoArquivo: string;
  cifrador: CifradorSeguro;
  /** Acesso a arquivos (padrão: `node:fs`). */
  arquivos?: SistemaArquivos;
  /** Recebe os avisos (arquivo ilegível, versão desconhecida...). Nunca recebe os tokens. */
  registrarAviso: (mensagem: string) => void;
}

/** Operações do cofre. */
export interface CofreTokens {
  /** Cifra e grava os tokens. Lança `ErroCofreTokens` se não puder cifrar (nada é gravado). */
  gravar(tokens: TokensGuardados): Promise<void>;
  /** Lê e decifra os tokens; devolve null se não houver ou se o arquivo estiver ilegível. */
  ler(): Promise<TokensGuardados | null>;
  /** Apaga o arquivo e o `.tmp` (logout ou sessão inválida). */
  apagar(): Promise<void>;
}

/** Erro do cofre ao gravar (cifragem indisponível ou tokens inválidos). */
export class ErroCofreTokens extends Error {
  /**
   * @param mensagem - O que deu errado (sem os tokens).
   * @param causa - Erro original, se houver.
   */
  constructor(mensagem: string, causa?: unknown) {
    super(mensagem, { cause: causa });
    this.name = 'ErroCofreTokens';
  }
}

/**
 * Adapta o `safeStorage` do Electron para o cofre. No Linux sem chaveiro (`basic_text`) conta
 * como indisponível, para nunca gravar algo só ofuscado.
 * @param safeStorage - `safeStorage` importado de `electron` no processo principal.
 * @returns Cifrador para o cofre.
 */
export function criarCifradorElectron(safeStorage: ApiSafeStorage): CifradorSeguro {
  return {
    estaDisponivel() {
      const backend = safeStorage.getSelectedStorageBackend?.();
      return safeStorage.isEncryptionAvailable() && backend !== BACKEND_SEM_CIFRAGEM;
    },
    cifrar: (texto) => safeStorage.encryptString(texto),
    decifrar: (dados) => safeStorage.decryptString(dados),
  };
}

/**
 * Diz se o valor tem a forma de `TokensGuardados`.
 * @param valor - Valor a conferir.
 * @returns true se tiver os 2 tokens (texto não vazio) e `expires_at` numérico finito.
 */
function ehTokensGuardados(valor: unknown): valor is TokensGuardados {
  if (typeof valor !== 'object' || valor === null) return false;

  const tokens = valor as Partial<Record<keyof TokensGuardados, unknown>>;
  const temTextos =
    typeof tokens.access_token === 'string' &&
    tokens.access_token.length > 0 &&
    typeof tokens.refresh_token === 'string' &&
    tokens.refresh_token.length > 0;
  return temTextos && typeof tokens.expires_at === 'number' && Number.isFinite(tokens.expires_at);
}

/**
 * Diz se o valor tem a forma do envelope, em qualquer versão.
 * @param valor - Valor lido do arquivo.
 * @returns true se tiver `v` numérico e `data` em base64.
 */
function ehEnvelope(valor: unknown): valor is EnvelopeTokensCifrado {
  if (typeof valor !== 'object' || valor === null) return false;

  const envelope = valor as Partial<Record<keyof EnvelopeTokensCifrado, unknown>>;
  const temDados = typeof envelope.data === 'string' && PADRAO_BASE64.test(envelope.data);
  return typeof envelope.v === 'number' && temDados;
}

/**
 * Cifra os tokens e monta o envelope que vai para o disco.
 * @param tokens - Tokens a guardar (só os 3 campos do original).
 * @param cifrador - Cifragem do sistema.
 * @returns Envelope `{ v, data }` com `data` em base64.
 * @throws {ErroCofreTokens} Se a cifragem falhar.
 */
function montarEnvelope(tokens: TokensGuardados, cifrador: CifradorSeguro): EnvelopeTokensCifrado {
  const { access_token, refresh_token, expires_at } = tokens;
  const textoClaro = JSON.stringify({ access_token, refresh_token, expires_at });

  try {
    const cifrado = cifrador.cifrar(textoClaro);
    return { v: VERSAO_ENVELOPE_TOKENS, data: cifrado.toString(CODIFICACAO_ENVELOPE) };
  } catch (erro) {
    throw new ErroCofreTokens(MSG_FALHA_CIFRAR, erro);
  }
}

/**
 * Cifra e grava os tokens de forma atômica (`.tmp` + renomear).
 * Confere tudo **antes** de tocar no disco: sem cifragem, nenhum arquivo é criado.
 * @param tokens - Tokens a guardar.
 * @param dependencias - Caminho, cifrador e arquivos.
 * @returns Promessa resolvida quando o arquivo estiver gravado.
 * @throws {ErroCofreTokens} Se os tokens forem inválidos ou a cifragem estiver indisponível.
 */
async function gravarTokens(
  tokens: TokensGuardados,
  dependencias: DependenciasCofreTokens,
): Promise<void> {
  if (!ehTokensGuardados(tokens)) throw new ErroCofreTokens(MSG_TOKENS_INVALIDOS);
  if (!dependencias.cifrador.estaDisponivel()) {
    throw new ErroCofreTokens(MSG_CIFRAGEM_INDISPONIVEL);
  }

  const envelope = montarEnvelope(tokens, dependencias.cifrador);
  await gravarJson(dependencias.caminhoArquivo, envelope, dependencias.arquivos);
}

/**
 * Lê o envelope do disco sem lançar erro.
 * @param dependencias - Caminho, arquivos e aviso.
 * @returns Envelope válido, ou null (sem arquivo, ilegível ou versão desconhecida).
 */
async function lerEnvelope(
  dependencias: DependenciasCofreTokens,
): Promise<EnvelopeTokensCifrado | null> {
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
  if (conteudo.v !== VERSAO_ENVELOPE_TOKENS) {
    dependencias.registrarAviso(AVISO_VERSAO_NAO_SUPORTADA);
    return null;
  }
  return conteudo;
}

/**
 * Decifra o envelope e confere o conteúdo, sem lançar erro.
 * @param envelope - Envelope lido do disco.
 * @param dependencias - Cifrador e aviso.
 * @returns Tokens decifrados, ou null se não abrirem ou vierem inválidos.
 */
function abrirEnvelope(
  envelope: EnvelopeTokensCifrado,
  dependencias: DependenciasCofreTokens,
): TokensGuardados | null {
  let conteudo: unknown;
  try {
    const textoClaro = dependencias.cifrador.decifrar(
      Buffer.from(envelope.data, CODIFICACAO_ENVELOPE),
    );
    conteudo = JSON.parse(textoClaro);
  } catch {
    dependencias.registrarAviso(AVISO_FALHA_DECIFRAR);
    return null;
  }

  if (ehTokensGuardados(conteudo)) return conteudo;
  dependencias.registrarAviso(AVISO_CONTEUDO_INVALIDO);
  return null;
}

/**
 * Lê os tokens guardados. Arquivo ausente, corrompido, de versão desconhecida, que não abre ou
 * com conteúdo inválido vira "sem tokens" (com aviso), nunca erro.
 * @param dependencias - Caminho, cifrador, arquivos e aviso.
 * @returns Tokens, ou null.
 */
async function lerTokens(dependencias: DependenciasCofreTokens): Promise<TokensGuardados | null> {
  const envelope = await lerEnvelope(dependencias);
  if (!envelope) return null;

  if (!dependencias.cifrador.estaDisponivel()) {
    dependencias.registrarAviso(AVISO_SEM_CIFRAGEM_LEITURA);
    return null;
  }
  return abrirEnvelope(envelope, dependencias);
}

/**
 * Apaga o arquivo de tokens e o temporário da gravação atômica.
 * @param dependencias - Caminho e arquivos.
 * @returns Promessa resolvida quando os dois arquivos não existirem mais.
 */
async function apagarTokens(dependencias: DependenciasCofreTokens): Promise<void> {
  const arquivos = dependencias.arquivos ?? criarSistemaArquivosNode();
  await arquivos.remover(dependencias.caminhoArquivo);
  await arquivos.remover(obterCaminhoTemporario(dependencias.caminhoArquivo));
}

/**
 * Cria o cofre de tokens.
 * @param dependencias - Caminho do `auth_tokens.json`, cifrador, arquivos e aviso.
 * @returns Cofre com `gravar`, `ler` e `apagar`.
 */
export function criarCofreTokens(dependencias: DependenciasCofreTokens): CofreTokens {
  const completas: DependenciasCofreTokens = {
    ...dependencias,
    arquivos: dependencias.arquivos ?? criarSistemaArquivosNode(),
  };

  return {
    gravar: (tokens) => gravarTokens(tokens, completas),
    ler: () => lerTokens(completas),
    apagar: () => apagarTokens(completas),
  };
}
