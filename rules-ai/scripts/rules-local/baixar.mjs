// Download com tempo-limite das regras do rules-ai (nuvem). Nunca lança exceção:
// qualquer falha vira `{ ok: false, motivo }`. Só módulos `node:`/globais (Node 18+).

export const URL_RAW_BASE = 'https://raw.githubusercontent.com/Gelvazio/rules-ai/main';
export const TEMPO_LIMITE_MS = 5000;

const CAMINHO_VERSAO = 'VERSAO.md';
const PASTA_REGRAS = 'regras';
const MOTIVO_TEMPO_ESGOTADO = 'tempo esgotado';
const NOMES_ERRO_TEMPO = ['TimeoutError', 'AbortError'];

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
 * Baixa um arquivo de texto do `raw` com tempo-limite.
 * @param {string} caminhoRelativo Caminho dentro do repositório (ex.: 'VERSAO.md').
 * @param {{urlBase?: string, tempoLimiteMs?: number, buscar?: Function}} [opcoes]
 * @returns {Promise<{ok: true, texto: string} | {ok: false, motivo: string}>}
 */
export async function baixarTexto(caminhoRelativo, opcoes = {}) {
  const {
    urlBase = URL_RAW_BASE,
    tempoLimiteMs = TEMPO_LIMITE_MS,
    buscar = fetch,
  } = opcoes;

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
