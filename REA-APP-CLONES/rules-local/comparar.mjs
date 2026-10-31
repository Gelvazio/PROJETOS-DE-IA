/**
 * Comparação item por item das regras (função pura, sem disco nem rede).
 * Contrato: etapa ETAPA-019, seção "Formato combinado" (F4).
 */

/**
 * Compara a lista antiga de regras com a nova.
 * Regra renomeada aparece como removida (nome antigo) + adicionada (nome novo).
 * @param {Map<string, string>} antiga arquivo -> código (vazia sem VERSAO.md local válida)
 * @param {Map<string, string>} nova arquivo -> código da versão da nuvem
 * @returns {{mudado: string[], adicionado: string[], removido: string[], igual: string[]}}
 *   cada lista em ordem alfabética e sem repetição
 */
export function compararListas(antiga, nova) {
  const mudado = [];
  const adicionado = [];
  const removido = [];
  const igual = [];

  for (const [arquivo, codigo] of nova) {
    if (!antiga.has(arquivo)) adicionado.push(arquivo);
    else if (antiga.get(arquivo) === codigo) igual.push(arquivo);
    else mudado.push(arquivo);
  }
  for (const arquivo of antiga.keys()) {
    if (!nova.has(arquivo)) removido.push(arquivo);
  }

  return {
    mudado: mudado.sort(),
    adicionado: adicionado.sort(),
    removido: removido.sort(),
    igual: igual.sort(),
  };
}
