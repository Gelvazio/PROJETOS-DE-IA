// Saída do `scripts/jev.mjs`: tabela Markdown (padrão) ou JSON (`--json`), e códigos de saída.

export const CODIGOS_SAIDA = Object.freeze({
  OK: 0,
  ERRO: 1,
  DESLIGADO: 2,
  REVISAR: 3,
  BLOQUEAR: 4,
  JEV_INDISPONIVEL: 5,
});
const CASAS_CONFIANCA = 2;

/**
 * Formata a confiança para a tabela.
 * @param {number|null|undefined} valor Confiança.
 * @returns {string} Texto com 2 casas, ou "—".
 */
export function formatarConfianca(valor) {
  return typeof valor === 'number' ? valor.toFixed(CASAS_CONFIANCA) : '—';
}

/**
 * Escapa o `|` de uma célula Markdown.
 * @param {unknown} valor Valor da célula.
 * @returns {string} Texto seguro para a tabela.
 */
function celula(valor) {
  return String(valor ?? '—').replaceAll('|', '\|').replace(/\s+/g, ' ');
}

/**
 * Monta uma tabela Markdown.
 * @param {string[]} colunas Cabeçalho.
 * @param {unknown[][]} linhas Linhas (mesmo tamanho do cabeçalho).
 * @returns {string} Tabela.
 */
export function montarTabela(colunas, linhas) {
  const cabecalho = `| ${colunas.join(' | ')} |`;
  const separador = `|${colunas.map(() => '---').join('|')}|`;
  const corpo = linhas.map((linha) => `| ${linha.map(celula).join(' | ')} |`);
  return [cabecalho, separador, ...corpo].join('\n');
}

/**
 * Imprime o resultado em JSON (`--json`) ou na forma de texto dada.
 * @param {{json: boolean, objeto: unknown, texto: string}} saida Formato e conteúdos.
 * @returns {void}
 */
export function imprimir(saida) {
  console.log(saida.json ? JSON.stringify(saida.objeto, null, 2) : saida.texto);
}
