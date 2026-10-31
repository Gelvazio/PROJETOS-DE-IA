// Leitura das regras do rules-ai: pasta local (C:\fontes\rules-ai) ou URL `raw` (nuvem).
// Nunca lança exceção: qualquer falha vira `{ ok: false, motivo }`. Só módulos `node:`/globais.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const URL_RAW_BASE = 'https://raw.githubusercontent.com/Gelvazio/rules-ai/main';
export const TEMPO_LIMITE_MS = 5000;

const CAMINHO_VERSAO = 'VERSAO.md';
const PASTA_REGRAS = 'regras';
const MOTIVO_TEMPO_ESGOTADO = 'tempo esgotado';
const NOMES_ERRO_TEMPO = ['TimeoutError', 'AbortError'];
const PADRAO_URL = /^https?:\/\//;

/**
 * Converte um erro de rede no motivo padronizado.
 * @param {unknown} erro Erro capturado no download.
 * @returns {string} 'tempo esgotado' ou 'erro de rede: <mensagem>'.
 */
function motivoDoErro(erro) {
  if (NOMES_ERRO_TEMPO.includes(erro?.name)) return MOTIVO_TEMPO_ESGOTADO;
  return `erro de rede: ${erro?.message ?? String(erro)}`;
}

/**
 * Lê um arquivo de texto da pasta local do rules-ai.
 * @param {string} pastaBase Pasta raiz do rules-ai.
 * @param {string} caminhoRelativo Caminho dentro da pasta (ex.: 'regras/INDEX.md').
 * @returns {Promise<{ok: true, texto: string} | {ok: false, motivo: string}>}
 */
async function lerTextoLocal(pastaBase, caminhoRelativo) {
  try {
    return { ok: true, texto: await readFile(join(pastaBase, caminhoRelativo), 'utf8') };
  } catch (erro) {
    const motivo = erro?.code === 'ENOENT' ? 'arquivo não encontrado' : `erro de leitura: ${erro?.message}`;
    return { ok: false, motivo };
  }
}

/**
 * Baixa um arquivo de texto do `raw` com tempo-limite, ou lê da pasta local do rules-ai.
 * @param {string} caminhoRelativo Caminho dentro do repositório (ex.: 'VERSAO.md').
 * @param {{urlBase?: string, tempoLimiteMs?: number, buscar?: Function}} [opcoes]
 *   `urlBase` com `http(s)://` baixa do `raw`; qualquer outro valor é pasta local.
 * @returns {Promise<{ok: true, texto: string} | {ok: false, motivo: string}>}
 */
export async function baixarTexto(caminhoRelativo, opcoes = {}) {
  const {
    urlBase = URL_RAW_BASE,
    tempoLimiteMs = TEMPO_LIMITE_MS,
    buscar = fetch,
  } = opcoes;

  if (!PADRAO_URL.test(urlBase)) return lerTextoLocal(urlBase, caminhoRelativo);

  try {
    const resposta = await buscar(`${urlBase}/${caminhoRelativo}`, {
      signal: AbortSignal.timeout(tempoLimiteMs),
    });
    if (!resposta.ok) return { ok: false, motivo: `HTTP ${resposta.status}` };
    return { ok: true, texto: await resposta.text() };
  } catch (erro) {
    return { ok: false, motivo: motivoDoErro(erro) };
  }
}

/**
 * Baixa a `VERSAO.md` da nuvem.
 * @param {object} [opcoes] Mesmas opções de `baixarTexto`.
 * @returns {Promise<{ok: true, texto: string} | {ok: false, motivo: string}>}
 */
export async function baixarVersao(opcoes = {}) {
  return baixarTexto(CAMINHO_VERSAO, opcoes);
}

/**
 * Baixa as regras listadas, em paralelo; falha se qualquer uma falhar.
 * @param {string[]} arquivos Nomes de arquivo da tabela da `VERSAO.md`.
 * @param {object} [opcoes] Mesmas opções de `baixarTexto`.
 * @returns {Promise<{ok: true, textos: Map<string, string>}
 *   | {ok: false, motivo: string, arquivo: string}>}
 */
export async function baixarRegras(arquivos, opcoes = {}) {
  const resultados = await Promise.all(
    arquivos.map((arquivo) => baixarTexto(`${PASTA_REGRAS}/${arquivo}`, opcoes)),
  );

  const textos = new Map();
  for (const [indice, resultado] of resultados.entries()) {
    if (!resultado.ok) {
      return { ok: false, motivo: resultado.motivo, arquivo: arquivos[indice] };
    }
    textos.set(arquivos[indice], resultado.texto);
  }
  return { ok: true, textos };
}
