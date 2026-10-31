// Visualizador de regras e tarefas: estado, cartões, filtros e modal. Os dados não ficam embutidos:
// `inicio.js` lê os `.md` (local ou GitHub, ver `fonte.js`) e preenche DADOS ao abrir a página.

const TODOS = "Todos";
const TAMANHO_RESUMO_CARTAO = 170;
const ORDEM_SITUACOES = [
  "Em andamento", "Aguardando", "Pendente", "Cancelada/Bloqueada", "Concluída",
];
const DADOS = {
  carregadoEm: "",
  fonte: "",
  regras: [],
  tasks: { tarefas: [], frentes: [], aguardando: [] },
};
const estadoFiltros = {
  categoria: TODOS, tipo: TODOS, situacao: TODOS, buscaRegras: "", buscaTasks: "",
};

/**
 * Transforma um texto em sufixo de classe CSS (sem acentos, espaços ou barras).
 * @param {string} texto - Texto original.
 * @returns {string} Sufixo em kebab-case.
 */
function paraClasse(texto) {
  return String(texto).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    .replace("cancelada-bloqueada", "canceladabloqueada");
}

/**
 * Resume um Markdown em texto corrido para o cartão.
 * @param {string} texto - Markdown.
 * @returns {string} Começo do texto sem marcações.
 */
function resumirTexto(texto) {
  const limpo = String(texto || "").replace(/```[\s\S]*?```/g, " ").replace(/[#>*`|_~-]+/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\s+/g, " ").trim();
  if (limpo.length <= TAMANHO_RESUMO_CARTAO) return limpo;
  return limpo.slice(0, TAMANHO_RESUMO_CARTAO).trimEnd() + "…";
}

/**
 * Cria um elemento com classe e texto.
 * @param {string} tag - Nome da tag.
 * @param {string} classe - Classes CSS.
 * @param {string} [texto] - Texto do elemento.
 * @returns {HTMLElement} Elemento criado.
 */
function criarElemento(tag, classe, texto = "") {
  const elemento = document.createElement(tag);
  elemento.className = classe;
  elemento.textContent = texto;
  return elemento;
}

/**
 * Cria uma etiqueta colorida.
 * @param {string} texto - Texto da etiqueta.
 * @param {string} [classeCor] - Classe que define a cor.
 * @returns {HTMLElement} Etiqueta.
 */
function criarEtiqueta(texto, classeCor = "") {
  return criarElemento("span", ("etiqueta " + classeCor).trim(), texto);
}

/**
 * Abre o modal com título, etiquetas e conteúdo Markdown.
 * @param {{titulo: string, etiquetas: HTMLElement[], markdown: string}} conteudo - O que mostrar.
 */
function abrirModal(conteudo) {
  document.getElementById("modal-titulo").textContent = conteudo.titulo;
  document.getElementById("modal-etiquetas").replaceChildren(...conteudo.etiquetas);
  document.getElementById("modal-corpo").innerHTML = markdownParaHtml(conteudo.markdown);
  document.getElementById("modal").showModal();
}

/**
 * Cria um cartão clicável.
 * @param {{titulo: string, texto: string, classe: string, etiquetas: HTMLElement[]}} dados -
 *   Conteúdo do cartão.
 * @param {Function} aoClicar - Ação ao clicar.
 * @returns {HTMLButtonElement} Cartão.
 */
function criarCartao(dados, aoClicar) {
  const cartao = criarElemento("button", "cartao " + dados.classe);
  cartao.type = "button";
  const rodape = criarElemento("div", "cartao__rodape");
  rodape.append(...dados.etiquetas);
  cartao.append(criarElemento("span", "cartao__titulo", dados.titulo),
    criarElemento("span", "cartao__texto", dados.texto), rodape);
  cartao.addEventListener("click", aoClicar);
  return cartao;
}

/**
 * Cria a barra de chips de um filtro.
 * @param {{idDestino: string, opcoes: string[], chave: string}} filtro - Onde, quais opções e
 *   qual campo do estado.
 * @param {Function} aoMudar - Redesenho a chamar depois da escolha.
 */
function criarChips(filtro, aoMudar) {
  const destino = document.getElementById(filtro.idDestino);
  const opcoes = [TODOS, ...filtro.opcoes];
  const chips = opcoes.map((opcao) => {
    const chip = criarElemento("button", "chip", opcao);
    chip.type = "button";
    chip.classList.toggle("chip--ativo", opcao === estadoFiltros[filtro.chave]);
    chip.addEventListener("click", () => {
      estadoFiltros[filtro.chave] = opcao;
      chips.forEach((outro) => outro.classList.toggle("chip--ativo", outro === chip));
      aoMudar();
    });
    return chip;
  });
  destino.replaceChildren(...chips);
}

/**
 * Lista os valores distintos de um campo, na ordem em que aparecem.
 * @param {Object[]} itens - Registros.
 * @param {string} campo - Nome do campo.
 * @returns {string[]} Valores sem repetição.
 */
function valoresDistintos(itens, campo) {
  return [...new Set(itens.map((item) => item[campo]).filter(Boolean))];
}

/**
 * Diz se o texto do registro contém a busca (sem diferenciar maiúsculas).
 * @param {Object} registro - Registro com campos de texto.
 * @param {string} busca - Texto procurado.
 * @returns {boolean} Verdadeiro se combina ou se a busca está vazia.
 */
function combinaBusca(registro, busca) {
  if (!busca) return true;
  return JSON.stringify(registro).toLowerCase().includes(busca.toLowerCase());
}
