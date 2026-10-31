// Renderizador de Markdown enxuto (títulos, listas, tabelas, código, citação e trechos em linha),
// suficiente para os arquivos de regras e do quadro. Escapa todo o HTML antes de formatar.

const PADRAO_CERCA_CODIGO = /^\s*```/;
const PADRAO_TITULO_MD = /^(#{1,6})\s+(.*)$/;
const PADRAO_ITEM_LISTA = /^\s*(?:[-*+]|\d+[.)])\s+(.*)$/;
const PADRAO_LINHA_TABELA = /^\s*\|.*\|\s*$/;
const PADRAO_SEPARADOR_TABELA = /^\s*\|?\s*:?-{2,}/;
const PADRAO_REGUA = /^\s*(-{3,}|\*{3,})\s*$/;
const NIVEL_MINIMO_TITULO = 2;

/**
 * Escapa os caracteres especiais de HTML.
 * @param {string} texto - Texto bruto.
 * @returns {string} Texto seguro para innerHTML.
 */
function escaparHtml(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Formata os trechos em linha: código, negrito, itálico, riscado e links.
 * @param {string} texto - Texto de uma linha.
 * @returns {string} HTML da linha.
 */
function formatarEmLinha(texto) {
  const trechosCodigo = [];
  let html = escaparHtml(texto).replace(/`([^`]+)`/g, (_, codigo) => {
    trechosCodigo.push(codigo);
    return "\u0000" + (trechosCodigo.length - 1) + "\u0000";
  });
  html = html
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/~~(.+?)~~/g, "<del>$1</del>")
    .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<span title="$2">$1</span>');
  return html.replace(/\u0000(\d+)\u0000/g,
    (_, indice) => "<code>" + trechosCodigo[indice] + "</code>");
}

/**
 * Separa as células de uma linha de tabela, respeitando `|` dentro de crases.
 * @param {string} linha - Linha da tabela.
 * @returns {string[]} Células.
 */
function dividirCelulasMd(linha) {
  const celulas = [];
  let atual = "";
  let dentroDeCrase = false;
  for (const caractere of linha.trim().replace(/^\||\|$/g, "")) {
    if (caractere === "`") dentroDeCrase = !dentroDeCrase;
    const fechaCelula = caractere === "|" && !dentroDeCrase && !atual.endsWith("\\");
    if (fechaCelula) {
      celulas.push(atual.trim());
      atual = "";
      continue;
    }
    atual += caractere;
  }
  celulas.push(atual.trim());
  return celulas;
}

/**
 * Monta uma tabela HTML a partir das linhas Markdown.
 * @param {string[]} linhas - Cabeçalho, separador e linhas de dados.
 * @returns {string} HTML da tabela.
 */
function montarTabelaMd(linhas) {
  const cabecalho = dividirCelulasMd(linhas[0])
    .map((celula) => "<th>" + formatarEmLinha(celula) + "</th>");
  const corpo = linhas.slice(2).map((linha) => {
    const celulas = dividirCelulasMd(linha)
      .map((celula) => "<td>" + formatarEmLinha(celula) + "</td>");
    return "<tr>" + celulas.join("") + "</tr>";
  });
  return '<div class="tabela-rolagem"><table><thead><tr>' + cabecalho.join("") +
    "</tr></thead><tbody>" + corpo.join("") + "</tbody></table></div>";
}

/**
 * Lê um bloco de linhas consecutivas que obedecem a uma condição.
 * @param {{linhas: string[], inicio: number, condicao: Function}} leitura - Linhas, posição
 *   e teste.
 * @returns {{bloco: string[], fim: number}} Linhas do bloco e a posição seguinte.
 */
function lerBlocoMd(leitura) {
  const { linhas, inicio, condicao } = leitura;
  let fim = inicio;
  while (fim < linhas.length && condicao(linhas[fim])) fim += 1;
  return { bloco: linhas.slice(inicio, fim), fim };
}

/**
 * Converte o bloco que começa na linha indicada e diz onde ele termina.
 * @param {string[]} linhas - Todas as linhas do texto.
 * @param {number} inicio - Linha atual.
 * @returns {{html: string, fim: number}} HTML do bloco e a próxima linha a ler.
 */
function converterBlocoMd(linhas, inicio) {
  const linha = linhas[inicio];
  if (PADRAO_CERCA_CODIGO.test(linha)) {
    const naoFechaCodigo = (item) => !PADRAO_CERCA_CODIGO.test(item);
    const { bloco, fim } = lerBlocoMd({ linhas, inicio: inicio + 1, condicao: naoFechaCodigo });
    const html = "<pre><code>" + escaparHtml(bloco.join("\n")) + "</code></pre>";
    return { html, fim: fim + 1 };
  }
  const titulo = linha.match(PADRAO_TITULO_MD);
  if (titulo) {
    const nivel = Math.max(titulo[1].length, NIVEL_MINIMO_TITULO);
    return { html: `<h${nivel}>${formatarEmLinha(titulo[2])}</h${nivel}>`, fim: inicio + 1 };
  }
  if (PADRAO_REGUA.test(linha)) return { html: "<hr>", fim: inicio + 1 };
  const proximaLinha = linhas[inicio + 1] || "";
  const ehTabela = PADRAO_LINHA_TABELA.test(linha) && PADRAO_SEPARADOR_TABELA.test(proximaLinha);
  if (ehTabela) {
    const ehLinhaTabela = (item) => PADRAO_LINHA_TABELA.test(item);
    const { bloco, fim } = lerBlocoMd({ linhas, inicio, condicao: ehLinhaTabela });
    return { html: montarTabelaMd(bloco), fim };
  }
  return converterBlocoTextoMd(linhas, inicio);
}

/**
 * Converte citação, lista ou parágrafo.
 * @param {string[]} linhas - Todas as linhas do texto.
 * @param {number} inicio - Linha atual.
 * @returns {{html: string, fim: number}} HTML do bloco e a próxima linha a ler.
 */
function converterBlocoTextoMd(linhas, inicio) {
  if (linhas[inicio].trim().startsWith(">")) {
    const ehCitacao = (item) => item.trim().startsWith(">");
    const { bloco, fim } = lerBlocoMd({ linhas, inicio, condicao: ehCitacao });
    const texto = bloco.map((item) => item.trim().replace(/^>\s?/, "")).join("\n");
    return { html: "<blockquote>" + markdownParaHtml(texto) + "</blockquote>", fim };
  }
  if (PADRAO_ITEM_LISTA.test(linhas[inicio])) {
    const continuaLista = (item) => PADRAO_ITEM_LISTA.test(item) || /^\s{2,}\S/.test(item);
    const { bloco, fim } = lerBlocoMd({ linhas, inicio, condicao: continuaLista });
    const itens = bloco.map((item) => {
      const conteudo = item.match(PADRAO_ITEM_LISTA)?.[1] ?? item.trim();
      return "<li>" + formatarEmLinha(conteudo) + "</li>";
    });
    return { html: "<ul>" + itens.join("") + "</ul>", fim };
  }
  const ehParagrafo = (item) => item.trim() !== "" && !PADRAO_TITULO_MD.test(item) &&
    !PADRAO_CERCA_CODIGO.test(item) && !PADRAO_LINHA_TABELA.test(item) &&
    !PADRAO_ITEM_LISTA.test(item);
  const { bloco, fim } = lerBlocoMd({ linhas, inicio, condicao: ehParagrafo });
  if (!bloco.length) {
    const linhaSolta = linhas[inicio].trim();
    if (!linhaSolta) return { html: "", fim: inicio + 1 };
    return { html: "<p>" + formatarEmLinha(linhaSolta) + "</p>", fim: inicio + 1 };
  }
  return { html: "<p>" + bloco.map(formatarEmLinha).join("<br>") + "</p>", fim };
}

/**
 * Converte um texto Markdown em HTML.
 * @param {string} texto - Markdown.
 * @returns {string} HTML.
 */
function markdownParaHtml(texto) {
  const linhas = String(texto || "").split(/\r?\n/);
  const partes = [];
  let posicao = 0;
  while (posicao < linhas.length) {
    const { html, fim } = converterBlocoMd(linhas, posicao);
    partes.push(html);
    posicao = fim;
  }
  return partes.join("\n");
}
