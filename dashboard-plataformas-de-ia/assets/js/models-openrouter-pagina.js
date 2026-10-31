const elementos = {
  busca: document.getElementById('campoBusca'),
  fabricante: document.getElementById('filtroFabricante'),
  contexto: document.getElementById('filtroContexto'),
  ferramentas: document.getElementById('filtroFerramentas'),
  texto: document.getElementById('filtroTexto'),
  ordenacao: document.getElementById('ordenacao'),
  limpar: document.getElementById('botaoLimpar'),
  contador: document.getElementById('contador'),
  grade: document.getElementById('gradeModelos'),
  tema: document.getElementById('botaoTema'),
  dataExtracao: document.getElementById('dataExtracao'),
  aviso: document.getElementById('avisoCopia'),
};

/**
 * Cria um elemento com classe e texto (sempre via textContent, sem HTML).
 * @param {{tag: string, classe: string, texto: string}} opcoes - Dados do elemento.
 * @returns {HTMLElement} Elemento criado.
 */
function criarElemento({ tag, classe, texto }) {
  const elemento = document.createElement(tag);
  if (classe) elemento.className = classe;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

/**
 * Lê os valores atuais dos filtros da tela.
 * @returns {object} Filtros ativos.
 */
function obterFiltros() {
  return {
    busca: elementos.busca.value,
    fabricante: elementos.fabricante.value,
    contexto: elementos.contexto.value,
    somenteFerramentas: elementos.ferramentas.checked,
    somenteTexto: elementos.texto.checked,
  };
}

/**
 * Copia texto para a área de transferência, com alternativa para arquivo local.
 * @param {string} texto - Texto a copiar.
 * @returns {Promise<boolean>} true se a cópia funcionou.
 */
async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (erro) {
    const area = criarElemento({ tag: 'textarea', classe: 'area-oculta', texto });
    document.body.appendChild(area);
    area.select();
    const copiou = document.execCommand('copy');
    area.remove();
    return copiou;
  }
}

/**
 * Mostra uma mensagem rápida de confirmação.
 * @param {string} mensagem - Texto do aviso.
 */
function mostrarAviso(mensagem) {
  elementos.aviso.textContent = mensagem;
  elementos.aviso.classList.add('aviso-copia--visivel');
  setTimeout(() => elementos.aviso.classList.remove('aviso-copia--visivel'), TEMPO_AVISO_MS);
}

/**
 * Copia o ID do modelo e avisa o resultado.
 * @param {string} id - ID do modelo no OpenRouter.
 */
async function copiarId(id) {
  const copiou = await copiarTexto(id);
  mostrarAviso(copiou ? MSG_COPIADO : MSG_FALHA_COPIAR);
}

/**
 * Cria um selo informativo do card.
 * @param {{texto: string, modificador: string}} dados - Texto e variação de cor.
 * @returns {HTMLElement} Selo criado.
 */
function criarSelo({ texto, modificador }) {
  const classe = `selo selo--${modificador}`;
  return criarElemento({ tag: 'span', classe, texto });
}

/**
 * Monta a linha de selos (gratuito, contexto, ferramentas, saída).
 * @param {object} modelo - Modelo exibido.
 * @returns {HTMLElement} Linha com os selos.
 */
function criarLinhaSelos(modelo) {
  const linha = criarElemento({ tag: 'div', classe: 'cartao__selos' });
  linha.appendChild(criarSelo({ texto: 'Gratuito', modificador: 'gratis' }));
  linha.appendChild(criarSelo({ texto: `${formatarContexto(modelo.contexto)} tokens`, modificador: 'contexto' }));

  const ferramentas = modelo.temFerramentas
    ? { texto: 'Tool calling', modificador: 'sim' }
    : { texto: 'Sem tool calling', modificador: 'nao' };
  linha.appendChild(criarSelo(ferramentas));
  linha.appendChild(criarSelo({ texto: `Saída: ${modelo.saidas.join('+')}`, modificador: 'saida' }));
  return linha;
}

/**
 * Monta a linha com o ID do modelo e o botão de copiar.
 * @param {string} id - ID do modelo.
 * @returns {HTMLElement} Linha do ID.
 */
function criarLinhaId(id) {
  const linha = criarElemento({ tag: 'div', classe: 'cartao__id' });
  linha.appendChild(criarElemento({ tag: 'code', texto: id }));

  const botao = criarElemento({ tag: 'button', classe: 'botao botao--copiar', texto: 'Copiar ID' });
  botao.type = 'button';
  botao.addEventListener('click', () => copiarId(id));
  linha.appendChild(botao);
  return linha;
}

/**
 * Monta o card completo de um modelo.
 * @param {object} modelo - Modelo exibido.
 * @returns {HTMLElement} Card do modelo.
 */
function criarCartao(modelo) {
  const cartao = criarElemento({ tag: 'article', classe: 'cartao' });
  cartao.appendChild(criarElemento({ tag: 'h2', classe: 'cartao__nome', texto: modelo.nome }));
  cartao.appendChild(criarElemento({ tag: 'p', classe: 'cartao__fabricante', texto: modelo.fabricante }));
  cartao.appendChild(criarLinhaSelos(modelo));
  cartao.appendChild(criarLinhaId(modelo.id));
  cartao.appendChild(criarElemento({ tag: 'p', classe: 'cartao__descricao', texto: modelo.descricao }));
  return cartao;
}

/**
 * Desenha os cards na grade e atualiza o contador.
 * @param {object[]} modelos - Modelos a exibir.
 */
function renderizarModelos(modelos) {
  elementos.grade.replaceChildren();
  elementos.contador.textContent = `${modelos.length} de ${MODELOS_OPENROUTER.length} modelos`;

  if (modelos.length === 0) {
    elementos.grade.appendChild(criarElemento({ tag: 'p', classe: 'sem-resultados', texto: MSG_SEM_RESULTADOS }));
    return;
  }
  modelos.forEach((modelo) => elementos.grade.appendChild(criarCartao(modelo)));
}

/**
 * Reaplica filtros e ordenação e redesenha a lista.
 */
function atualizarLista() {
  const filtrados = filtrarModelos(MODELOS_OPENROUTER, obterFiltros());
  renderizarModelos(ordenarModelos(filtrados, elementos.ordenacao.value));
}

/**
 * Preenche o seletor de fabricantes com as opções existentes nos dados.
 */
function popularFabricantes() {
  listarFabricantes(MODELOS_OPENROUTER).forEach((fabricante) => {
    const opcao = criarElemento({ tag: 'option', texto: fabricante });
    opcao.value = fabricante;
    elementos.fabricante.appendChild(opcao);
  });
}

/**
 * Volta todos os filtros ao valor inicial.
 */
function limparFiltros() {
  elementos.busca.value = '';
  elementos.fabricante.value = VALOR_TODOS;
  elementos.contexto.value = VALOR_TODOS;
  elementos.ferramentas.checked = false;
  elementos.texto.checked = false;
  elementos.ordenacao.value = ORDENACAO_CONTEXTO;
  atualizarLista();
}

/**
 * Aplica o tema e o ícone do botão, e guarda a escolha.
 * @param {boolean} escuro - true para tema escuro.
 */
function aplicarTema(escuro) {
  document.documentElement.setAttribute('data-theme', escuro ? TEMA_ESCURO : TEMA_CLARO);
  elementos.tema.textContent = escuro ? ICONE_TEMA_ESCURO : ICONE_TEMA_CLARO;
  localStorage.setItem(CHAVE_TEMA, escuro ? TEMA_ESCURO : TEMA_CLARO);
}

/**
 * Liga os eventos dos filtros e do tema.
 */
function ligarEventos() {
  const camposQueAtualizam = [elementos.busca, elementos.fabricante, elementos.contexto, elementos.ferramentas, elementos.texto, elementos.ordenacao];
  camposQueAtualizam.forEach((campo) => {
    campo.addEventListener('input', atualizarLista);
    campo.addEventListener('change', atualizarLista);
  });
  elementos.limpar.addEventListener('click', limparFiltros);
  elementos.tema.addEventListener('click', () => {
    aplicarTema(document.documentElement.getAttribute('data-theme') !== TEMA_ESCURO);
  });
}

/**
 * Inicializa a página: tema, filtros, eventos e lista.
 */
function iniciarPagina() {
  aplicarTema(localStorage.getItem(CHAVE_TEMA) === TEMA_ESCURO);
  elementos.dataExtracao.textContent = DATA_EXTRACAO_MODELOS;
  popularFabricantes();
  ligarEventos();
  atualizarLista();
}

iniciarPagina();
