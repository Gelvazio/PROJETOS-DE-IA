// ============================================================================
// FILTROS SALVOS - preferência do dashboard guardada no navegador (localStorage)
// Guarda mês, tipo e status; o registro expira 1 hora depois da última gravação.
// ============================================================================
const CHAVE_FILTROS = 'fin_filtros';
const TIPOS_VALIDOS = ['todos', 'pagar', 'receber'];
const STATUS_VALIDOS = ['todos', '0', '1', '3'];
const FILTROS_PADRAO = { tipo: 'todos', status: 'todos', mes: null };
const FORMATO_MES = /^\d{4}-(0[1-9]|1[0-2])$/;
const VALIDADE_MILISSEGUNDOS = 60 * 60 * 1000;

/**
 * Indica se o registro salvo ainda está dentro do prazo de validade.
 * @param {{salvoEm?: number}} salvo - Registro lido do localStorage.
 * @returns {boolean} true se foi salvo há no máximo 1 hora.
 */
function estaDentroDaValidade(salvo) {
  if (typeof salvo.salvoEm !== 'number') return false;
  const idade = Date.now() - salvo.salvoEm;
  return idade >= 0 && idade <= VALIDADE_MILISSEGUNDOS;
}

/**
 * Lê os filtros salvos; registro expirado, ausente ou inválido volta ao padrão.
 * @returns {{tipo: string, status: string, mes: (string|null)}} Filtros e mês escolhido.
 */
export function carregarFiltros() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_FILTROS) || '{}');
    if (!estaDentroDaValidade(salvo)) {
      limparFiltros();
      return { ...FILTROS_PADRAO };
    }
    return {
      tipo: TIPOS_VALIDOS.includes(salvo.tipo) ? salvo.tipo : FILTROS_PADRAO.tipo,
      status: STATUS_VALIDOS.includes(salvo.status) ? salvo.status : FILTROS_PADRAO.status,
      mes: FORMATO_MES.test(salvo.mes) ? salvo.mes : FILTROS_PADRAO.mes,
    };
  } catch {
    return { ...FILTROS_PADRAO };
  }
}

/**
 * Salva os filtros e o mês atuais, renovando o prazo de 1 hora; falha de armazenamento
 * não interrompe o dashboard.
 * @param {{tipo: string, status: string, mes: string}} filtros - Filtros e mês escolhido.
 * @returns {void}
 */
export function salvarFiltros(filtros) {
  try {
    localStorage.setItem(CHAVE_FILTROS, JSON.stringify({ ...filtros, salvoEm: Date.now() }));
  } catch {
    // armazenamento indisponível (modo privado, cota cheia): segue sem persistir
  }
}

/**
 * Apaga os filtros salvos (usado no login, no logout e na expiração para recomeçar do padrão).
 * @returns {void}
 */
export function limparFiltros() {
  try {
    localStorage.removeItem(CHAVE_FILTROS);
  } catch {
    // nada a limpar
  }
}
