// ============================================================================
// DOCUMENTOS DA PREVIDÊNCIA - modal com abas e um iframe para cada PDF
// ============================================================================
import { DOCUMENTOS_PREVIDENCIA } from './previdenciaFiesc.js';
import { criarElemento } from './elementosUi.js';

/**
 * Mostra um documento no iframe e destaca a aba correspondente.
 * @param {object} el - Elementos do modal (abas, iframe, link).
 * @param {{titulo: string, arquivo: string}} documento - Documento exibido.
 * @returns {void}
 */
function mostrarDocumento(el, documento) {
  el.iframe.src = documento.arquivo;
  el.iframe.title = documento.titulo;
  el.link.href = documento.arquivo;
  el.abas.querySelectorAll('button').forEach(aba => {
    aba.setAttribute('aria-selected', String(aba.textContent === documento.titulo));
  });
}

/**
 * Liga o modal de documentos: cria as abas e abre o primeiro documento ao abrir.
 * @param {HTMLDialogElement} modal - Elemento do modal de documentos.
 * @returns {() => void} Função que abre o modal.
 */
export function prepararModalDocumentos(modal) {
  const el = {
    abas: modal.querySelector('#documentos-abas'),
    iframe: modal.querySelector('#documentos-iframe'),
    link: modal.querySelector('#documentos-link'),
  };
  DOCUMENTOS_PREVIDENCIA.forEach(documento => {
    const aba = criarElemento('button', 'documentos-aba', documento.titulo);
    aba.type = 'button';
    aba.setAttribute('role', 'tab');
    aba.addEventListener('click', () => mostrarDocumento(el, documento));
    el.abas.append(aba);
  });

  modal.addEventListener('close', () => { el.iframe.src = 'about:blank'; });
  return () => {
    modal.showModal();
    mostrarDocumento(el, DOCUMENTOS_PREVIDENCIA[0]);
  };
}
