// ============================================================================
// ANÁLISES FINANCEIRAS - status ANALISAR/ANALISADO ligado ao arquivo do CFO
// A análise é um Markdown em docs/analises/ANALISE-FINANCEIRA-<chave>.md
// (ex.: "IDEIA 01", "PREVIDENCIA-FIESC"). O status só vira ANALISADO quando
// esse arquivo existe e não está vazio.
// ============================================================================
import { criarElemento } from './elementosUi.js';

const STATUS_ANALISAR = 'ANALISAR';
const STATUS_ANALISADO = 'ANALISADO';

const ANALISES_FINANCEIRAS = import.meta.glob('../docs/analises/ANALISE-FINANCEIRA-*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/**
 * Lê o markdown da análise financeira de um item.
 * @param {string} chave - Chave do item (ex.: "IDEIA 01").
 * @returns {string|null} Texto da análise, ou null se o arquivo não existir ou estiver vazio.
 */
export function obterAnaliseFinanceira(chave) {
  const texto = ANALISES_FINANCEIRAS[`../docs/analises/ANALISE-FINANCEIRA-${chave}.md`];
  const temTexto = typeof texto === 'string' && texto.trim() !== '';
  return temTexto ? texto : null;
}

/**
 * Cria o selo de status (ANALISAR até existir a análise do CFO).
 * @param {string} chave - Chave do item (ex.: "IDEIA 01").
 * @returns {HTMLElement} Selo de status.
 */
export function criarSeloStatus(chave) {
  const analisada = obterAnaliseFinanceira(chave) !== null;
  const selo = criarElemento('span', 'ideia-status', analisada ? STATUS_ANALISADO : STATUS_ANALISAR);
  selo.dataset.estado = analisada ? 'analisado' : 'analisar';
  return selo;
}
