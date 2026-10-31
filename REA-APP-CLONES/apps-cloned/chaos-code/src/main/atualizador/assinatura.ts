/**
 * Conferência da assinatura minisign (Ed25519) do instalador, como o `tauri-plugin-updater` do
 * original faz com a crate `minisign-verify` (docs/inventario/imagem-atualizador.md).
 *
 * Formatos (minisign):
 * - chave pública: linha base64 de 42 bytes = `Ed` + key id (8) + chave Ed25519 (32);
 * - `.sig`: `untrusted comment: …` / base64 de 74 bytes = `ED` ou `Ed` + key id (8) +
 *   assinatura (64) / `trusted comment: …` / base64 da assinatura global (64 bytes).
 *   `ED` assina o BLAKE2b-512 do arquivo; `Ed` (legado) assina o arquivo inteiro.
 *   A assinatura global cobre `assinatura (64 bytes) + texto do trusted comment`.
 * O Tauri guarda a chave do config e o `signature` do `latest.json` como o **arquivo inteiro em
 * base64**; aqui se aceita esse formato e o texto puro.
 */
import { createHash, createPublicKey, verify, type KeyObject } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const PREFIXO_COMENTARIO_NAO_CONFIAVEL = 'untrusted comment:';
const PREFIXO_COMENTARIO_CONFIAVEL = 'trusted comment: ';
const ALGORITMO_CHAVE = 'Ed';
const ALGORITMO_LEGADO = 'Ed';
const ALGORITMO_PRE_HASH = 'ED';
const HASH_PRE_HASH = 'blake2b512';
const TAMANHO_ALGORITMO = 2;
const TAMANHO_ID_CHAVE = 8;
const TAMANHO_CHAVE_ED25519 = 32;
const TAMANHO_ASSINATURA_ED25519 = 64;
const TAMANHO_LINHA_CHAVE = TAMANHO_ALGORITMO + TAMANHO_ID_CHAVE + TAMANHO_CHAVE_ED25519;
const TAMANHO_LINHA_ASSINATURA =
  TAMANHO_ALGORITMO + TAMANHO_ID_CHAVE + TAMANHO_ASSINATURA_ED25519;
const PADRAO_BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;
const QUEBRA_LINHA = /\r?\n/;

/** Por que a conferência falhou. */
export type MotivoErroAssinatura =
  | 'chave_invalida'
  | 'assinatura_mal_formada'
  | 'algoritmo_nao_suportado'
  | 'chave_diferente'
  | 'assinatura_nao_confere'
  | 'comentario_nao_confere';

/** Erro da conferência, com motivo para a interface e o log. */
export class ErroAssinatura extends Error {
  /**
   * @param motivo - Tipo da falha.
   * @param mensagem - Texto do erro.
   */
  constructor(
    readonly motivo: MotivoErroAssinatura,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = 'ErroAssinatura';
  }
}

/** Chave pública minisign decodificada. */
export interface ChavePublicaMinisign {
  idChave: Buffer;
  chave: KeyObject;
}

/** Arquivo `.sig` do minisign decodificado. */
export interface AssinaturaMinisign {
  /** `ED` (pré-hash BLAKE2b-512) ou `Ed` (legado, arquivo inteiro). */
  algoritmo: string;
  idChave: Buffer;
  assinatura: Buffer;
  /** Texto depois de `trusted comment: ` (coberto pela assinatura global). */
  comentarioConfiavel: string;
  assinaturaGlobal: Buffer;
}

/**
 * Decodifica base64 estrito (só o alfabeto padrão, com `=` no fim).
 * @param texto - Texto em base64.
 * @returns Bytes, ou null se não for base64 válido.
 */
function decodificarBase64(texto: string): Buffer | null {
  const limpo = texto.trim();
  const ehBase64 = limpo.length > 0 && limpo.length % 4 === 0 && PADRAO_BASE64.test(limpo);
  return ehBase64 ? Buffer.from(limpo, 'base64') : null;
}

/**
 * Devolve o texto minisign: o próprio texto, ou o texto dentro do base64 (formato do Tauri).
 * @param entrada - Texto puro do minisign ou ele inteiro em base64.
 * @returns Linhas não vazias do texto minisign.
 */
export function abrirTextoMinisign(entrada: string): string[] {
  const texto = entrada.trim();
  if (!texto.startsWith(PREFIXO_COMENTARIO_NAO_CONFIAVEL)) {
    const decodificado = decodificarBase64(texto)?.toString('utf8');
    const ehArquivoEmBase64 = decodificado?.startsWith(PREFIXO_COMENTARIO_NAO_CONFIAVEL) ?? false;
    if (ehArquivoEmBase64 && decodificado) return separarLinhas(decodificado);
  }
  return separarLinhas(texto);
}

/**
 * Separa o texto em linhas, sem as vazias e sem espaços nas pontas.
 * @param texto - Texto com quebras `\n` ou `\r\n`.
 * @returns Linhas preenchidas.
 */
function separarLinhas(texto: string): string[] {
  return texto
    .split(QUEBRA_LINHA)
    .map((linha) => linha.trim())
    .filter((linha) => linha.length > 0);
}

/**
 * Cria a chave Ed25519 do Node a partir dos 32 bytes crus.
 * @param bytesChave - Chave pública Ed25519.
 * @returns Chave pronta para `crypto.verify`.
 */
function criarChaveEd25519(bytesChave: Buffer): KeyObject {
  const jwk = { kty: 'OKP', crv: 'Ed25519', x: bytesChave.toString('base64url') };
  return createPublicKey({ key: jwk, format: 'jwk' });
}

/**
 * Decodifica a chave pública minisign (texto do arquivo, ele em base64, ou só a linha da chave).
 * @param entrada - Chave como vem do config (`CHAVE_PUBLICA_ATUALIZACAO`).
 * @returns Key id e chave Ed25519.
 * @throws {ErroAssinatura} `chave_invalida` se o formato não for o do minisign.
 */
export function decodificarChavePublica(entrada: string): ChavePublicaMinisign {
  const linhas = abrirTextoMinisign(entrada);
  const temComentario = linhas[0]?.startsWith(PREFIXO_COMENTARIO_NAO_CONFIAVEL) ?? false;
  const linhaChave = temComentario ? linhas[1] : linhas[0];
  const bytes = linhaChave ? decodificarBase64(linhaChave) : null;
  const formatoValido =
    bytes !== null &&
    bytes.length === TAMANHO_LINHA_CHAVE &&
    bytes.subarray(0, TAMANHO_ALGORITMO).toString('latin1') === ALGORITMO_CHAVE;
  if (!formatoValido) {
    throw new ErroAssinatura('chave_invalida', 'Chave pública minisign inválida');
  }

  const inicioChave = TAMANHO_ALGORITMO + TAMANHO_ID_CHAVE;
  return {
    idChave: Buffer.from(bytes.subarray(TAMANHO_ALGORITMO, inicioChave)),
    chave: criarChaveEd25519(Buffer.from(bytes.subarray(inicioChave))),
  };
}

/**
 * Lê a linha da assinatura (74 bytes): algoritmo, key id e assinatura.
 * @param linha - Linha base64 do `.sig`.
 * @returns Partes da assinatura.
 * @throws {ErroAssinatura} Se o tamanho ou o algoritmo não forem os do minisign.
 */
function lerLinhaAssinatura(
  linha: string,
): Pick<AssinaturaMinisign, 'algoritmo' | 'idChave' | 'assinatura'> {
  const bytes = decodificarBase64(linha);
  if (bytes === null || bytes.length !== TAMANHO_LINHA_ASSINATURA) {
    throw new ErroAssinatura('assinatura_mal_formada', 'Linha da assinatura minisign inválida');
  }

  const algoritmo = bytes.subarray(0, TAMANHO_ALGORITMO).toString('latin1');
  const algoritmoConhecido = algoritmo === ALGORITMO_PRE_HASH || algoritmo === ALGORITMO_LEGADO;
  if (!algoritmoConhecido) {
    throw new ErroAssinatura('algoritmo_nao_suportado', `Algoritmo minisign "${algoritmo}"`);
  }
  const inicioAssinatura = TAMANHO_ALGORITMO + TAMANHO_ID_CHAVE;
  return {
    algoritmo,
    idChave: Buffer.from(bytes.subarray(TAMANHO_ALGORITMO, inicioAssinatura)),
    assinatura: Buffer.from(bytes.subarray(inicioAssinatura)),
  };
}

/**
 * Decodifica o arquivo `.sig` do minisign (texto puro ou ele inteiro em base64, como no
 * `signature` do `latest.json`).
 * @param entrada - Conteúdo da assinatura.
 * @returns Assinatura decodificada.
 * @throws {ErroAssinatura} `assinatura_mal_formada` ou `algoritmo_nao_suportado`.
 */
export function decodificarAssinatura(entrada: string): AssinaturaMinisign {
  const linhas = abrirTextoMinisign(entrada);
  const [comentario, linhaAssinatura, comentarioConfiavel, linhaGlobal] = linhas;
  const estruturaValida =
    linhas.length === 4 &&
    comentario.startsWith(PREFIXO_COMENTARIO_NAO_CONFIAVEL) &&
    comentarioConfiavel.startsWith(PREFIXO_COMENTARIO_CONFIAVEL);
  if (!estruturaValida) {
    throw new ErroAssinatura('assinatura_mal_formada', 'Arquivo de assinatura minisign inválido');
  }

  const assinaturaGlobal = decodificarBase64(linhaGlobal);
  if (assinaturaGlobal === null || assinaturaGlobal.length !== TAMANHO_ASSINATURA_ED25519) {
    throw new ErroAssinatura('assinatura_mal_formada', 'Assinatura global minisign inválida');
  }
  return {
    ...lerLinhaAssinatura(linhaAssinatura),
    comentarioConfiavel: comentarioConfiavel.slice(PREFIXO_COMENTARIO_CONFIAVEL.length),
    assinaturaGlobal,
  };
}

/**
 * Monta os bytes que a assinatura cobre: o BLAKE2b-512 do arquivo (`ED`) ou o arquivo (`Ed`).
 * @param algoritmo - Algoritmo da assinatura.
 * @param conteudo - Bytes do arquivo baixado.
 * @returns Mensagem assinada.
 */
function montarMensagemAssinada(algoritmo: string, conteudo: Uint8Array): Buffer {
  if (algoritmo === ALGORITMO_PRE_HASH) return createHash(HASH_PRE_HASH).update(conteudo).digest();
  return Buffer.from(conteudo);
}

/**
 * Confere a assinatura minisign de um conteúdo: key id, assinatura do arquivo e assinatura global.
 * @param conteudo - Bytes do arquivo baixado.
 * @param assinatura - `.sig` (texto ou base64, como no `latest.json`).
 * @param chavePublica - Chave pública minisign (texto, base64 do arquivo ou só a linha).
 * @returns Texto do trusted comment, já conferido.
 * @throws {ErroAssinatura} Se qualquer parte não conferir.
 */
export function conferirAssinatura(
  conteudo: Uint8Array,
  assinatura: string,
  chavePublica: string,
): string {
  const chave = decodificarChavePublica(chavePublica);
  const sig = decodificarAssinatura(assinatura);
  if (!chave.idChave.equals(sig.idChave)) {
    throw new ErroAssinatura('chave_diferente', 'A assinatura foi feita com outra chave');
  }

  const mensagem = montarMensagemAssinada(sig.algoritmo, conteudo);
  if (!verify(null, mensagem, chave.chave, sig.assinatura)) {
    throw new ErroAssinatura('assinatura_nao_confere', 'Assinatura do arquivo não confere');
  }

  const mensagemGlobal = Buffer.concat([sig.assinatura, Buffer.from(sig.comentarioConfiavel)]);
  if (!verify(null, mensagemGlobal, chave.chave, sig.assinaturaGlobal)) {
    throw new ErroAssinatura('comentario_nao_confere', 'Comentário confiável foi alterado');
  }
  return sig.comentarioConfiavel;
}

/** Dados para conferir a assinatura de um arquivo em disco. */
export interface PedidoConferenciaArquivo {
  /** Arquivo do instalador baixado. */
  caminho: string;
  /** `.sig` do `latest.json`. */
  assinatura: string;
  /** Chave pública minisign do app. */
  chavePublica: string;
  /** Leitura do arquivo (padrão: `fs.readFile`). */
  lerArquivo?: (caminho: string) => Promise<Uint8Array>;
}

/**
 * Lê o arquivo baixado e confere a assinatura dele.
 * @param pedido - Caminho, assinatura, chave e (opcional) a função de leitura.
 * @returns Texto do trusted comment, já conferido.
 * @throws {ErroAssinatura} Se a assinatura não conferir.
 * @throws {Error} Se o arquivo não puder ser lido.
 */
export async function conferirAssinaturaDoArquivo(
  pedido: PedidoConferenciaArquivo,
): Promise<string> {
  const lerArquivo = pedido.lerArquivo ?? readFile;
  const conteudo = await lerArquivo(pedido.caminho);
  return conferirAssinatura(conteudo, pedido.assinatura, pedido.chavePublica);
}
