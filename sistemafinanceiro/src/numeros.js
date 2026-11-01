// ============================================================================
// NÚMEROS - leitura de números digitados em formato brasileiro
// ============================================================================

/**
 * Converte um texto digitado em número (aceita "6.700,50", "6700,5" e "6700.5").
 * @param {string} texto - Texto digitado.
 * @returns {number} Número lido, ou 0 se inválido.
 */
export function analisarNumero(texto) {
  const limpo = String(texto).replace(/[R$\s%]/g, '');
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? Math.max(numero, 0) : 0;
}

/**
 * Converte um texto digitado em número, ou null quando está vazio.
 * @param {string} texto - Texto digitado.
 * @returns {number|null} Número lido, ou null se o campo estiver vazio.
 */
export function analisarNumeroOpcional(texto) {
  return String(texto).trim() === '' ? null : analisarNumero(texto);
}
