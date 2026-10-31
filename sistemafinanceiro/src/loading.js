// ============================================================================
// LOADING GLOBAL - indicador de progresso para toda requisição de rede
// Barra no topo aparece rápido; o spinner central só se a espera demorar.
// ============================================================================
const ATRASO_BARRA_MS = 100;
const ATRASO_SPINNER_MS = 150;
const CLASSE_CARREGANDO = 'app-carregando';
const TEXTO_CARREGANDO = 'Aguarde, carregando...';

let requisicoesAtivas = 0;
let temporizadorBarra = null;
let temporizadorSpinner = null;
let elementoBarra = null;
let elementoSpinner = null;

/**
 * Cria (uma única vez) os elementos visuais do loading no <body>.
 * @returns {void}
 */
function garantirElementos() {
  if (elementoBarra) return;

  elementoBarra = document.createElement('div');
  elementoBarra.className = 'app-loading-barra';
  elementoBarra.setAttribute('aria-hidden', 'true');

  elementoSpinner = document.createElement('div');
  elementoSpinner.className = 'app-loading-fundo';
  elementoSpinner.setAttribute('role', 'status');
  elementoSpinner.setAttribute('aria-live', 'polite');
  elementoSpinner.innerHTML =
    `<div class="app-loading-caixa"><span class="app-loading-spinner"></span>` +
    `<span class="app-loading-texto">${TEXTO_CARREGANDO}</span></div>`;

  document.body.append(elementoBarra, elementoSpinner);
}

/**
 * Mostra ou esconde os elementos do loading.
 * @param {boolean} barra - Barra do topo visível.
 * @param {boolean} spinner - Spinner central visível.
 * @returns {void}
 */
function atualizarVisibilidade(barra, spinner) {
  garantirElementos();
  elementoBarra.classList.toggle('visivel', barra);
  elementoSpinner.classList.toggle('visivel', spinner);
}

/**
 * Registra o início de uma requisição e agenda a exibição do loading.
 * @returns {void}
 */
function iniciarRequisicao() {
  requisicoesAtivas += 1;
  if (requisicoesAtivas > 1) return;

  document.body.classList.add(CLASSE_CARREGANDO);
  temporizadorBarra = setTimeout(() => atualizarVisibilidade(true, false), ATRASO_BARRA_MS);
  temporizadorSpinner = setTimeout(() => atualizarVisibilidade(true, true), ATRASO_SPINNER_MS);
}

/**
 * Registra o fim de uma requisição; esconde o loading quando não resta nenhuma.
 * @returns {void}
 */
function finalizarRequisicao() {
  requisicoesAtivas = Math.max(0, requisicoesAtivas - 1);
  if (requisicoesAtivas > 0) return;

  clearTimeout(temporizadorBarra);
  clearTimeout(temporizadorSpinner);
  document.body.classList.remove(CLASSE_CARREGANDO);
  if (elementoBarra) atualizarVisibilidade(false, false);
}

/**
 * Cria um fetch que mostra o loading enquanto a requisição estiver em andamento.
 * Usado como `global.fetch` do cliente Supabase, cobrindo consulta, gravação e login.
 * @param {typeof fetch} [fetchBase] - Função de rede original.
 * @returns {typeof fetch} Fetch com indicador de loading.
 */
export function criarFetchComLoading(fetchBase = (...args) => fetch(...args)) {
  return async (...args) => {
    iniciarRequisicao();
    try {
      return await fetchBase(...args);
    } finally {
      finalizarRequisicao();
    }
  };
}
