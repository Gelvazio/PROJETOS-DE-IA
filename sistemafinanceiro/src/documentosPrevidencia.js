// ============================================================================
// DOCUMENTOS DA PREVIDÊNCIA - modal com abas e um iframe para cada PDF
// ============================================================================
import { DOCUMENTOS_PREVIDENCIA } from './previdenciaFiesc.js';
import { criarElemento } from './elementosUi.js';

/**
 * Confere se o endereço realmente entrega um PDF. Se o arquivo não existir, o servidor
 * pode devolver a página do próprio sistema, que não deve aparecer dentro do iframe.
 * @param {string} arquivo - Endereço do PDF.
 * @returns {Promise<boolean>} true se a resposta for um PDF.
 */
async function ehPdf(arquivo) {
  try {
    const resposta = await fetch(arquivo, { method: 'HEAD' });
    return resposta.ok && (resposta.headers.get('content-type') || '').includes('pdf');
  } catch {
    return false;
  }
}

/**
 * Mostra um documento no iframe (ou um aviso, se o PDF não estiver disponível).
 * @param {object} el - Elementos do modal (abas, iframe, link, aviso).
 * @param {{titulo: string, arquivo: string}} documento - Documento exibido.
 * @returns {Promise<void>}
 */
async function mostrarDocumento(el, documento) {
  el.abas.querySelectorAll('button').forEach(aba => {
    aba.setAttribute('aria-selected', String(aba.textContent === documento.titulo));
  });
  el.link.href = documento.arquivo;
  el.iframe.title = documento.titulo;

  const disponivel = await ehPdf(documento.arquivo);
  el.iframe.hidden = !disponivel;
  el.aviso.hidden = disponivel;
  el.iframe.src = disponivel ? documento.arquivo : 'about:blank';
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
    aviso: modal.querySelector('#documentos-aviso'),
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
