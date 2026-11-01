// ============================================================================
// SIMULADOR DA PREVIDÊNCIA - cálculos puros (sem DOM)
// Regras vindas da cartilha FIESCPrev 2025: 13 contribuições por ano, dedução de
// até 12% da renda bruta anual no IR (modelo completo), tabela regressiva e
// renda de 0,1% a 2% do saldo ao mês. O resto são premissas editáveis [Chute].
// ============================================================================

export const PARAMETROS_PADRAO = {
  salario: 6700,
  contribuicaoPct: 5,
  contrapartidaPct: 100,
  anos: 15,
  rentabilidadePct: 6,
  aliquotaIrPct: 27.5,
  modeloCompleto: true,
  recebimentoAnos: 10,
  rendaPct: 1,
};

const CONTRIBUICOES_POR_ANO = 13;
const LIMITE_DEDUCAO_IR = 0.12;
const MESES_POR_ANO = 12;
const ITERACOES_BUSCA_RENDA = 60;

// Tabela regressiva: [até quantos anos, alíquota]
const TABELA_REGRESSIVA = [[2, 0.35], [4, 0.3], [6, 0.25], [8, 0.2], [10, 0.15]];
const ALIQUOTA_REGRESSIVA_MINIMA = 0.1;

/**
 * Alíquota da tabela regressiva para o prazo de aplicação.
 * @param {number} anos - Prazo da aplicação em anos.
 * @returns {number} Alíquota (0 a 1).
 */
export function obterAliquotaRegressiva(anos) {
  const faixa = TABELA_REGRESSIVA.find(([limite]) => anos <= limite);
  return faixa ? faixa[1] : ALIQUOTA_REGRESSIVA_MINIMA;
}

/**
 * Projeta o saldo mês a mês, com 13 aportes por ano (o 13º cai em dezembro).
 * @param {number} aporteMensal - Aporte por contribuição.
 * @param {number} anos - Prazo em anos.
 * @param {number} rentabilidadeAnual - Rentabilidade anual (0 a 1).
 * @returns {number} Saldo ao final do prazo.
 */
export function projetarSaldo(aporteMensal, anos, rentabilidadeAnual) {
  const taxaMensal = (1 + rentabilidadeAnual) ** (1 / MESES_POR_ANO) - 1;
  let saldo = 0;
  for (let mes = 1; mes <= anos * MESES_POR_ANO; mes += 1) {
    saldo = saldo * (1 + taxaMensal) + aporteMensal;
    if (mes % MESES_POR_ANO === 0) saldo += aporteMensal;
  }
  return saldo;
}

/**
 * Saldo que sobra após receber, durante o prazo, benefícios iguais (13 por ano).
 * @param {number} saldoInicial - Saldo no início do recebimento.
 * @param {number} beneficio - Valor de cada benefício.
 * @param {{anos: number, rentabilidadeAnual: number}} prazo - Prazo e rendimento.
 * @returns {number} Saldo restante (negativo se os benefícios esgotam o saldo antes).
 */
function sobraAposBeneficios(saldoInicial, beneficio, prazo) {
  const taxaMensal = (1 + prazo.rentabilidadeAnual) ** (1 / MESES_POR_ANO) - 1;
  let saldo = saldoInicial;
  for (let mes = 1; mes <= prazo.anos * MESES_POR_ANO; mes += 1) {
    saldo = saldo * (1 + taxaMensal) - beneficio;
    if (mes % MESES_POR_ANO === 0) saldo -= beneficio;
  }
  return saldo;
}

/**
 * Benefício mensal que esgota o saldo exatamente ao fim do prazo (renda por prazo determinado).
 * @param {number} saldo - Saldo no início do recebimento.
 * @param {number} anos - Prazo de recebimento em anos.
 * @param {number} rentabilidadeAnual - Rendimento anual durante o recebimento (0 a 1).
 * @returns {number} Valor de cada benefício.
 */
export function calcularRendaPrazoDeterminado(saldo, anos, rentabilidadeAnual) {
  if (saldo <= 0 || anos <= 0) return 0;
  const prazo = { anos, rentabilidadeAnual };
  let minimo = 0;
  let maximo = saldo;
  for (let i = 0; i < ITERACOES_BUSCA_RENDA; i += 1) {
    const meio = (minimo + maximo) / 2;
    if (sobraAposBeneficios(saldo, meio, prazo) > 0) minimo = meio;
    else maximo = meio;
  }
  return (minimo + maximo) / 2;
}

/**
 * Calcula a economia anual de IR pela dedução das contribuições.
 * @param {object} p - Parâmetros: salario, contribuicaoMensal, aliquotaIrPct, modeloCompleto.
 * @returns {number} Economia de IR por ano.
 */
function calcularEconomiaIrAnual(p) {
  if (!p.modeloCompleto) return 0;
  const rendaAnual = p.salario * CONTRIBUICOES_POR_ANO;
  const contribuicaoAnual = p.contribuicaoMensal * CONTRIBUICOES_POR_ANO;
  const deducao = Math.min(contribuicaoAnual, rendaAnual * LIMITE_DEDUCAO_IR);
  return deducao * (p.aliquotaIrPct / 100);
}

/**
 * Calcula o que você recebe depois de aposentar (por prazo determinado e por percentual).
 * @param {number} saldo - Saldo projetado na aposentadoria.
 * @param {typeof PARAMETROS_PADRAO} entrada - Valores informados no formulário.
 * @param {number} aliquota - Alíquota do IR sobre o benefício (0 a 1).
 * @returns {object} Rendas brutas, líquidas e totais recebidos.
 */
function calcularRendas(saldo, entrada, aliquota) {
  const rentabilidade = entrada.rentabilidadePct / 100;
  const rendaPrazo = calcularRendaPrazoDeterminado(saldo, entrada.recebimentoAnos, rentabilidade);
  const rendaPct = saldo * (entrada.rendaPct / 100);
  return {
    rendaPrazo,
    rendaPrazoLiquida: rendaPrazo * (1 - aliquota),
    totalRecebidoPrazo: rendaPrazo * CONTRIBUICOES_POR_ANO * entrada.recebimentoAnos,
    rendaPct,
    rendaPctLiquida: rendaPct * (1 - aliquota),
  };
}

/**
 * Calcula o resultado da simulação a partir dos valores digitados.
 * @param {typeof PARAMETROS_PADRAO} entrada - Valores informados no formulário.
 * @returns {object} Resultados numéricos da simulação.
 */
export function calcularSimulacao(entrada) {
  const contribuicaoMensal = entrada.salario * (entrada.contribuicaoPct / 100);
  const contrapartidaMensal = contribuicaoMensal * (entrada.contrapartidaPct / 100);
  const rentabilidade = entrada.rentabilidadePct / 100;
  const economiaIrAno = calcularEconomiaIrAnual({ ...entrada, contribuicaoMensal });

  const saldoSemEmpresa = projetarSaldo(contribuicaoMensal, entrada.anos, rentabilidade);
  const saldo = projetarSaldo(contribuicaoMensal + contrapartidaMensal, entrada.anos, rentabilidade);
  const aliquotaResgate = obterAliquotaRegressiva(entrada.anos);
  const meusAportes = contribuicaoMensal * CONTRIBUICOES_POR_ANO * entrada.anos;
  const economiaIrTotal = economiaIrAno * entrada.anos;

  return {
    contribuicaoMensal,
    contrapartidaMensal,
    meusAportes,
    totalContribuicoes: meusAportes + contrapartidaMensal * CONTRIBUICOES_POR_ANO * entrada.anos,
    aportesEmpresa: contrapartidaMensal * CONTRIBUICOES_POR_ANO * entrada.anos,
    saldo,
    aliquotaResgate,
    saldoLiquido: saldo * (1 - aliquotaResgate),
    economiaIrAno,
    economiaIrTotal,
    custoReal: meusAportes - economiaIrTotal,
    ganhoContrapartida: saldo - saldoSemEmpresa,
    ...calcularRendas(saldo, entrada, aliquotaResgate),
  };
}
