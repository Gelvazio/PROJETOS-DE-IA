const COMPARADORES_ORDENACAO = Object.freeze({
  [ORDENACAO_CONTEXTO]: (a, b) => b.contexto - a.contexto || a.nome.localeCompare(b.nome),
  [ORDENACAO_NOME]: (a, b) => a.nome.localeCompare(b.nome),
});

/**
 * Remove acentos e converte para minúsculas, para comparar textos sem distinção.
 * @param {string} texto - Texto original.
 * @returns {string} Texto normalizado.
 */
function normalizarTexto(texto) {
  return String(texto).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Verifica se o termo buscado aparece no nome ou no ID do modelo.
 * @param {{nome: string, id: string}} modelo - Modelo avaliado.
 * @param {string} termo - Texto digitado na busca.
 * @returns {boolean} true se o termo estiver vazio ou for encontrado.
 */
function correspondeBusca(modelo, termo) {
  const termoNormalizado = normalizarTexto(termo).trim();
  if (!termoNormalizado) return true;

  const alvo = normalizarTexto(`${modelo.nome} ${modelo.id}`);
  return alvo.includes(termoNormalizado);
}

/**
 * Indica se o modelo gera apenas texto como saída.
 * @param {{saidas: string[]}} modelo - Modelo avaliado.
 * @returns {boolean} true se a única saída for texto.
 */
function geraSomenteTexto(modelo) {
  return modelo.saidas.length === 1 && modelo.saidas[0] === SAIDA_TEXTO;
}

/**
 * Aplica todos os filtros a um único modelo.
 * @param {object} modelo - Modelo avaliado.
 * @param {object} filtros - Filtros ativos da tela.
 * @returns {boolean} true se o modelo passa em todos os filtros.
 */
function passaNosFiltros(modelo, filtros) {
  if (!correspondeBusca(modelo, filtros.busca)) return false;

  const outroFabricante =
    filtros.fabricante !== VALOR_TODOS && modelo.fabricante !== filtros.fabricante;
  if (outroFabricante) return false;

  if (modelo.contexto < FAIXAS_CONTEXTO[filtros.contexto]) return false;
  if (filtros.somenteFerramentas && !modelo.temFerramentas) return false;
  if (filtros.somenteTexto && !geraSomenteTexto(modelo)) return false;

  return true;
}

/**
 * Filtra a lista de modelos conforme os filtros da tela.
 * @param {object[]} modelos - Lista completa de modelos.
 * @param {object} filtros - Filtros ativos da tela.
 * @returns {object[]} Modelos que passam em todos os filtros.
 */
function filtrarModelos(modelos, filtros) {
  return modelos.filter((modelo) => passaNosFiltros(modelo, filtros));
}

/**
 * Ordena os modelos sem alterar a lista original.
 * @param {object[]} modelos - Modelos a ordenar.
 * @param {string} criterio - Critério de ordenação (contexto ou nome).
 * @returns {object[]} Nova lista ordenada.
 */
function ordenarModelos(modelos, criterio) {
  const comparador = COMPARADORES_ORDENACAO[criterio] || COMPARADORES_ORDENACAO[ORDENACAO_NOME];
  return [...modelos].sort(comparador);
}

/**
 * Lista os fabricantes distintos, em ordem alfabética.
 * @param {{fabricante: string}[]} modelos - Lista de modelos.
 * @returns {string[]} Fabricantes sem repetição.
 */
function listarFabricantes(modelos) {
  const fabricantes = new Set(modelos.map((modelo) => modelo.fabricante));
  return [...fabricantes].sort();
}

/**
 * Formata a quantidade de tokens de contexto (ex.: 262144 vira 262K).
 * @param {number} tokens - Tamanho do contexto em tokens.
 * @returns {string} Texto curto com sufixo K ou M.
 */
function formatarContexto(tokens) {
  if (tokens >= MILHAO_TOKENS) {
    return `${(tokens / MILHAO_TOKENS).toFixed(1).replace('.0', '')}M`;
  }
  return `${Math.round(tokens / MIL_TOKENS)}K`;
}
