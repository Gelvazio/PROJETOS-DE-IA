// Aba REGRAS: seções dos arquivos de .claude/rules/ em cartões, agrupadas por categoria e arquivo.

/**
 * Abre o modal com o texto completo de uma seção de regra.
 * @param {Object} secao - Seção (arquivo, título, categoria, tipo, texto).
 */
function abrirRegra(secao) {
  abrirModal({
    titulo: secao.titulo,
    etiquetas: [
      criarEtiqueta(secao.categoria),
      criarEtiqueta(secao.tipo, "tipo--" + paraClasse(secao.tipo)),
      criarEtiqueta(secao.arquivo),
    ],
    markdown: secao.texto,
  });
}

/**
 * Cria o cartão de uma seção de regra.
 * @param {Object} secao - Seção da regra.
 * @returns {HTMLButtonElement} Cartão.
 */
function criarCartaoRegra(secao) {
  const classeTipo = "tipo--" + paraClasse(secao.tipo);
  return criarCartao({
    titulo: secao.titulo,
    texto: resumirTexto(secao.texto),
    classe: classeTipo,
    etiquetas: [criarEtiqueta(secao.tipo, classeTipo), criarEtiqueta(secao.arquivo)],
  }, () => abrirRegra(secao));
}

/**
 * Filtra as seções pelo estado atual (categoria, tipo e busca).
 * @returns {Object[]} Seções visíveis.
 */
function filtrarRegras() {
  return DADOS.regras.filter((secao) => {
    const categoriaCombina = estadoFiltros.categoria === TODOS ||
      secao.categoria === estadoFiltros.categoria;
    const tipoCombina = estadoFiltros.tipo === TODOS || secao.tipo === estadoFiltros.tipo;
    return categoriaCombina && tipoCombina && combinaBusca(secao, estadoFiltros.buscaRegras);
  });
}

/**
 * Agrupa seções por uma chave, mantendo a ordem de chegada.
 * @param {Object[]} itens - Registros.
 * @param {string} campo - Campo usado como chave.
 * @returns {Map<string, Object[]>} Grupos.
 */
function agruparPor(itens, campo) {
  const grupos = new Map();
  itens.forEach((item) => {
    if (!grupos.has(item[campo])) grupos.set(item[campo], []);
    grupos.get(item[campo]).push(item);
  });
  return grupos;
}

/**
 * Monta o bloco de um arquivo: nome, assunto e a grade de cartões.
 * @param {string} arquivo - Nome do arquivo.
 * @param {Object[]} secoes - Seções desse arquivo.
 * @returns {HTMLElement} Bloco do arquivo.
 */
function montarBlocoArquivo(arquivo, secoes) {
  const bloco = criarElemento("div", "grupo__bloco");
  const titulo = criarElemento("p", "grupo__arquivo");
  const nome = criarElemento("code", "", arquivo);
  const assunto = secoes[0].assunto || secoes[0].tituloArquivo;
  titulo.append(nome, document.createTextNode(" — " + assunto));
  const grade = criarElemento("div", "grade");
  grade.append(...secoes.map(criarCartaoRegra));
  bloco.append(titulo, grade);
  return bloco;
}

/**
 * Redesenha a lista de regras conforme os filtros.
 */
function desenharRegras() {
  const visiveis = filtrarRegras();
  const destino = document.getElementById("lista-regras");
  document.getElementById("contagem-regras").textContent =
    `${visiveis.length} de ${DADOS.regras.length} seções de regras`;
  if (!visiveis.length) {
    destino.replaceChildren(criarElemento("p", "vazio", "Nenhuma regra encontrada."));
    return;
  }
  const grupos = [...agruparPor(visiveis, "categoria")].map(([categoria, secoes]) => {
    const grupo = criarElemento("section", "grupo");
    grupo.append(criarElemento("h2", "grupo__titulo", categoria));
    agruparPor(secoes, "arquivo").forEach((doArquivo, arquivo) => {
      grupo.append(montarBlocoArquivo(arquivo, doArquivo));
    });
    return grupo;
  });
  destino.replaceChildren(...grupos);
}

/**
 * Prepara a aba REGRAS: chips de categoria e tipo, busca e primeira renderização.
 */
function iniciarAbaRegras() {
  criarChips({ idDestino: "filtro-categorias", opcoes: valoresDistintos(DADOS.regras, "categoria"),
    chave: "categoria" }, desenharRegras);
  criarChips({ idDestino: "filtro-tipos", opcoes: valoresDistintos(DADOS.regras, "tipo"),
    chave: "tipo" }, desenharRegras);
  document.getElementById("busca-regras").addEventListener("input", (evento) => {
    estadoFiltros.buscaRegras = evento.target.value.trim();
    desenharRegras();
  });
  desenharRegras();
}
