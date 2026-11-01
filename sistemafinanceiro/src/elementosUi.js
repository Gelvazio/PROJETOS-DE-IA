// ============================================================================
// ELEMENTOS DE INTERFACE - pequenos construtores de DOM usados pelas páginas
// ============================================================================

/**
 * Cria um elemento com classe e texto.
 * @param {string} tag - Nome da tag.
 * @param {string} classe - Classe CSS (pode ser vazia).
 * @param {string} [texto] - Texto do elemento.
 * @returns {HTMLElement} Elemento criado.
 */
export function criarElemento(tag, classe, texto = '') {
  const elemento = document.createElement(tag);
  if (classe) elemento.className = classe;
  elemento.textContent = texto;
  return elemento;
}

/**
 * Cria uma lista (<ul>) a partir de textos.
 * @param {string[]} itens - Textos dos itens.
 * @returns {HTMLUListElement} Lista pronta.
 */
export function criarLista(itens) {
  const lista = criarElemento('ul', 'ideia-lista');
  itens.forEach(item => lista.append(criarElemento('li', '', item)));
  return lista;
}

/**
 * Cria uma seção do modal (título + conteúdo).
 * @param {string} titulo - Título da seção.
 * @param {HTMLElement[]} conteudo - Elementos da seção.
 * @returns {HTMLElement} Seção pronta.
 */
export function criarSecaoModal(titulo, conteudo) {
  const secao = criarElemento('section', 'ideia-secao');
  secao.append(criarElemento('h3', '', titulo));
  secao.append(...conteudo);
  return secao;
}

/**
 * Liga o fechamento de um modal (<dialog>): botão Fechar e clique no fundo.
 * @param {HTMLDialogElement} modal - Elemento do modal.
 * @returns {void}
 */
export function ligarFechamentoModal(modal) {
  modal.querySelector('#ideia-modal-fechar').addEventListener('click', () => modal.close());
  modal.addEventListener('click', evento => {
    if (evento.target === modal) modal.close();
  });
}
