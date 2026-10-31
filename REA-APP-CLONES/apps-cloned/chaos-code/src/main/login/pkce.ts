/**
 * PKCE (RFC 7636) e `state` do login OAuth: recria o passo 4 do `start_login` do original
 * (docs/inventario/login.md — "gera `code_verifier`, deriva `code_challenge` com S256 e um `state`
 * aleatório", arq. `0x822d24`).
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import { METODO_PKCE } from '../../compartilhado/constantes';
import type { ParametrosPkce } from '../../compartilhado/tipos-login';

/**
 * Bytes aleatórios do `code_verifier`. *(inferido)* O tamanho não foi confirmado no código do
 * original; 32 bytes em base64url dão 43 caracteres, o mínimo e o padrão da RFC 7636 (seção 4.1).
 */
const TAMANHO_BYTES_VERIFICADOR = 32;

/** Bytes aleatórios do `state` *(inferido: mesmo tamanho do verifier)*. */
const TAMANHO_BYTES_STATE = 32;

const ALGORITMO_HASH_PKCE = 'sha256';
const CODIFICACAO_BASE64URL = 'base64url';
const CODIFICACAO_TEXTO = 'utf8';

/** Verifier válido pela RFC 7636 (seção 4.1): 43 a 128 caracteres "unreserved". */
const PADRAO_VERIFICADOR_PKCE = /^[A-Za-z0-9\-._~]{43,128}$/;

const MENSAGEM_VERIFICADOR_INVALIDO =
  'code_verifier inválido: use de 43 a 128 caracteres A-Z, a-z, 0-9, "-", ".", "_" ou "~"';

/** Fonte de bytes aleatórios (injetável; o padrão é `crypto.randomBytes`). */
export type FonteAleatoria = (quantidadeBytes: number) => Buffer;

/**
 * Gera um texto aleatório em base64url sem `=` (alfabeto `A-Z a-z 0-9 - _`).
 * @param quantidadeBytes - Quantidade de bytes aleatórios antes da codificação.
 * @param fonte - Fonte de bytes aleatórios.
 * @returns Texto em base64url.
 */
function gerarTextoAleatorio(quantidadeBytes: number, fonte: FonteAleatoria): string {
  return fonte(quantidadeBytes).toString(CODIFICACAO_BASE64URL);
}

/**
 * Calcula o SHA-256 de um texto em UTF-8.
 * @param texto - Texto a resumir.
 * @returns Resumo de 32 bytes.
 */
function resumirSha256(texto: string): Buffer {
  return createHash(ALGORITMO_HASH_PKCE).update(texto, CODIFICACAO_TEXTO).digest();
}

/**
 * Diz se um texto pode ser usado como `code_verifier` (RFC 7636, seção 4.1).
 * @param verificador - Texto a conferir.
 * @returns true se tiver de 43 a 128 caracteres do alfabeto permitido.
 */
export function ehVerificadorPkceValido(verificador: string): boolean {
  return PADRAO_VERIFICADOR_PKCE.test(verificador);
}

/**
 * Gera o `code_verifier`: 32 bytes aleatórios em base64url (43 caracteres).
 * @param fonte - Fonte de bytes aleatórios (padrão: `crypto.randomBytes`).
 * @returns Verifier novo.
 */
export function gerarVerificadorPkce(fonte: FonteAleatoria = randomBytes): string {
  return gerarTextoAleatorio(TAMANHO_BYTES_VERIFICADOR, fonte);
}

/**
 * Calcula o `code_challenge` pelo método S256: `BASE64URL(SHA256(ASCII(code_verifier)))`,
 * sem `=` no fim (RFC 7636, seção 4.2).
 * @param verificador - `code_verifier` do login.
 * @returns Desafio em base64url (43 caracteres).
 * @throws {Error} Se o verifier não seguir a RFC 7636.
 */
export function calcularDesafioPkce(verificador: string): string {
  if (!ehVerificadorPkceValido(verificador)) throw new Error(MENSAGEM_VERIFICADOR_INVALIDO);

  return resumirSha256(verificador).toString(CODIFICACAO_BASE64URL);
}

/**
 * Gera o `state` aleatório que protege o callback contra CSRF.
 * @param fonte - Fonte de bytes aleatórios (padrão: `crypto.randomBytes`).
 * @returns State em base64url.
 */
export function gerarStateOAuth(fonte: FonteAleatoria = randomBytes): string {
  return gerarTextoAleatorio(TAMANHO_BYTES_STATE, fonte);
}

/**
 * Gera tudo o que um login precisa: verifier, desafio S256, método e state.
 * @param fonte - Fonte de bytes aleatórios (padrão: `crypto.randomBytes`).
 * @returns Parâmetros PKCE do login.
 */
export function gerarParametrosPkce(fonte: FonteAleatoria = randomBytes): ParametrosPkce {
  const codeVerifier = gerarVerificadorPkce(fonte);

  return {
    code_verifier: codeVerifier,
    code_challenge: calcularDesafioPkce(codeVerifier),
    code_challenge_method: METODO_PKCE,
    state: gerarStateOAuth(fonte),
  };
}

/**
 * Compara o `state` recebido no callback com o esperado em tempo constante.
 * Os dois passam antes pelo SHA-256, para terem o mesmo tamanho e o `timingSafeEqual` não revelar
 * o comprimento do valor esperado.
 * @param esperado - State gerado no início do login.
 * @param recebido - State que chegou no callback (pode faltar).
 * @returns true só se os dois existirem e forem iguais.
 */
export function compararStateSeguro(esperado: string, recebido: string | undefined): boolean {
  if (!esperado || !recebido) return false;

  return timingSafeEqual(resumirSha256(esperado), resumirSha256(recebido));
}
