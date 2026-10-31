// Marca por mensagem (RULES-LOCAL-JEV.5, R2.2): quando dois ganchos (projeto e conta) recebem a
// MESMA mensagem quase ao mesmo tempo, só o primeiro chama o Jev. A marca é um arquivo pequeno
// com o instante da classificação, em `scripts/jev/saidas/` (fora do Git). Nunca grava o texto,
// só o hash. Falha ao ler ou gravar a marca nunca derruba a mensagem (vale "não repetida").
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Janela em que a mesma mensagem (mesmo hash) não é classificada de novo. */
export const JANELA_REPETIDA_MS = 10000;
const PREFIXO_MARCA = 'marca-';
const SUFIXO_MARCA = '.txt';
const REGEX_HASH = /^[0-9a-f]{8,64}$/;

/**
 * Caminho da marca de um hash, ou null se o hash não for hexadecimal seguro.
 * @param {string} pasta Pasta das marcas.
 * @param {string} hash Hash da mensagem.
 * @returns {string|null} Caminho do arquivo da marca.
 */
function caminhoDaMarca(pasta, hash) {
  if (typeof hash !== 'string' || !REGEX_HASH.test(hash)) return null;
  return join(pasta, `${PREFIXO_MARCA}${hash}${SUFIXO_MARCA}`);
}

/**
 * Diz se a mesma mensagem foi marcada há menos de {@link JANELA_REPETIDA_MS}.
 * @param {string} pasta Pasta das marcas.
 * @param {string} hash Hash da mensagem.
 * @param {number} agoraMs Instante atual em ms.
 * @returns {boolean} true se é repetida; erro de leitura vale false.
 */
export function ehMensagemRepetida(pasta, hash, agoraMs) {
  try {
    const caminho = caminhoDaMarca(pasta, hash);
    if (!caminho) return false;
    const marcadoEm = Number(readFileSync(caminho, 'utf8').trim());
    const decorrido = agoraMs - marcadoEm;
    return Number.isFinite(decorrido) && decorrido >= 0 && decorrido < JANELA_REPETIDA_MS;
  } catch {
    return false;
  }
}

/**
 * Grava a marca da mensagem. Nunca lança.
 * @param {string} pasta Pasta das marcas.
 * @param {string} hash Hash da mensagem.
 * @param {number} agoraMs Instante atual em ms.
 * @returns {void}
 */
export function marcarMensagem(pasta, hash, agoraMs) {
  try {
    const caminho = caminhoDaMarca(pasta, hash);
    if (!caminho) return;
    mkdirSync(pasta, { recursive: true });
    writeFileSync(caminho, String(agoraMs), 'utf8');
  } catch {
    // Sem marca, a próxima chamada igual apenas consulta o Jev de novo.
  }
}
