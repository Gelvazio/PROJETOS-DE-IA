/* Dashboard Financeiro: lê CSV_EMBUTIDO (dados.js) e desenha KPIs, gráficos, alertas e contas a pagar. */

const SALDO_INICIAL = 25000;
const LIMIAR_ALERTA_PERCENTUAL = 15;
const DIAS_JANELA_PAGAR = 30;
const DIAS_ATENCAO_VENCIMENTO = 3;
const MILISSEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;
const CEM_PORCENTO = 100;
const MARCADOR_A_PAGAR = /\s*\[a pagar\]\s*/i;
const SEPARADOR_SUBCATEGORIA = ' - ';
const TIPO_RECEITA = 'receita';
const TIPO_DESPESA = 'despesa';
const MESES_ABREVIADOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const CORES = {
  texto: '#ffffff',
  textoSuave: '#9aa4b8',
  grade: '#2a3142',
  receita: '#3ddc97',
  despesa: '#ff6b6b',
  caixa: '#4dabf7',
  caixaFundo: 'rgba(77, 171, 247, 0.15)',
};

const STATUS_PAGAR = {
  vencido: { classe: 'selo--vencido', texto: 'Vencido' },
  atencao: { classe: 'selo--atencao', texto: 'Vence em até 3 dias' },
  noPrazo: { classe: 'selo--no-prazo', texto: 'No prazo' },
};

const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatadorPercentual = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * Converte texto 'AAAA-MM-DD' em Date local.
 * @param {string} texto - Data no formato ISO.
 * @returns {Date} Data local à meia-noite.
 */
function converterData(texto) {
  const [ano, mes, dia] = texto.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

/**
 * Gera a chave 'AAAA-MM' de uma data.
 * @param {Date} data - Data de origem.
 * @returns {string} Chave do mês.
 */
function chaveMes(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Converte a chave do mês em rótulo legível (ex.: 'Out/2026').
 * @param {string} chave - Chave 'AAAA-MM'.
 * @returns {string} Rótulo do mês.
 */
function rotuloMes(chave) {
  const [ano, mes] = chave.split('-');
  return `${MESES_ABREVIADOS[Number(mes) - 1]}/${ano}`;
}

/**
 * Formata data para o padrão brasileiro.
 * @param {Date} data - Data a formatar.
 * @returns {string} Data no formato dd/mm/aaaa.
 */
function formatarData(data) {
  return data.toLocaleDateString('pt-BR');
}

/**
 * Transforma uma linha do CSV em lançamento.
 * @param {string} linha - Linha com data, categoria, valor e descrição.
 * @returns {{data: Date, tipo: string, valor: number, descricao: string, subcategoria: string, aPagar: boolean}}
 */
function criarLancamento(linha) {
  const [data, tipo, valor, ...resto] = linha.split(',');
  const descricaoBruta = resto.join(',').trim();
  const aPagar = MARCADOR_A_PAGAR.test(descricaoBruta);
  const descricao = descricaoBruta.replace(MARCADOR_A_PAGAR, '').trim();
  const subcategoria = descricao.split(SEPARADOR_SUBCATEGORIA)[0];
  return { data: converterData(data.trim()), tipo: tipo.trim().toLowerCase(), valor: Number(valor), descricao, subcategoria, aPagar };
}

/**
 * Lê o CSV completo (primeira linha é o cabeçalho).
 * @param {string} texto - Conteúdo do CSV.
 * @returns {Array<object>} Lançamentos válidos.
 */
function analisarCsv(texto) {
  const linhas = texto.split(/\r?\n/).map((linha) => linha.trim()).filter(Boolean);
  return linhas.slice(1).map(criarLancamento).filter((item) => !Number.isNaN(item.valor));
}

/**
 * Soma receitas e despesas realizadas por mês.
 * @param {Array<object>} realizados - Lançamentos já pagos/recebidos.
 * @returns {{chaves: string[], totais: Object<string, {receita: number, despesa: number}>}}
 */
function agruparPorMes(realizados) {
  const totais = {};
  realizados.forEach((item) => {
    const chave = chaveMes(item.data);
    totais[chave] = totais[chave] || { receita: 0, despesa: 0 };
    totais[chave][item.tipo] += item.valor;
  });
  return { chaves: Object.keys(totais).sort(), totais };
}

/**
 * Calcula a variação percentual entre dois valores.
 * @param {number} atual - Valor atual.
 * @param {number} anterior - Valor de comparação.
 * @returns {number|null} Percentual ou null se não houver base.
 */
function calcularVariacao(atual, anterior) {
  if (!anterior) return null;
  return ((atual - anterior) / Math.abs(anterior)) * CEM_PORCENTO;
}

/**
 * Formata percentual com sinal.
 * @param {number} valor - Percentual.
 * @returns {string} Texto como '+12,3%'.
 */
function formatarPercentual(valor) {
  const sinal = valor > 0 ? '+' : '';
  return `${sinal}${formatadorPercentual.format(valor)}%`;
}

/**
 * Monta o resumo de um mês: receita, despesa, lucro e caixa de fechamento.
 * @param {object} agrupado - Retorno de agruparPorMes.
 * @param {number} indice - Posição do mês em agrupado.chaves.
 * @returns {{receita: number, despesa: number, lucro: number, caixa: number}}
 */
function resumirMes(agrupado, indice) {
  const { chaves, totais } = agrupado;
  const atual = totais[chaves[indice]];
  const acumulado = chaves.slice(0, indice + 1).reduce((soma, chave) => soma + totais[chave].receita - totais[chave].despesa, 0);
  return { receita: atual.receita, despesa: atual.despesa, lucro: atual.receita - atual.despesa, caixa: SALDO_INICIAL + acumulado };
}

/**
 * Cria um cartão de KPI no DOM.
 * @param {{rotulo: string, valor: number, variacao: number|null, altaEhBoa: boolean, detalhe: string}} dados
 * @returns {HTMLElement} Elemento do cartão.
 */
function criarCartaoKpi(dados) {
  const cartao = document.createElement('article');
  cartao.className = 'cartao';
  const temVariacao = dados.variacao !== null;
  const melhorou = dados.altaEhBoa ? dados.variacao >= 0 : dados.variacao <= 0;
  const classeVariacao = melhorou ? 'kpi__variacao--bom' : 'kpi__variacao--ruim';
  const textoVariacao = temVariacao ? `${formatarPercentual(dados.variacao)} vs. mês anterior` : 'Sem mês anterior';
  cartao.innerHTML = `
    <div class="kpi__rotulo">${dados.rotulo}</div>
    <div class="kpi__valor">${formatadorMoeda.format(dados.valor)}</div>
    <div class="kpi__variacao ${temVariacao ? classeVariacao : ''}">${textoVariacao}</div>
    <div class="kpi__detalhe">${dados.detalhe}</div>`;
  return cartao;
}

/**
 * Desenha os quatro KPIs do último mês com variação sobre o anterior.
 * @param {object} agrupado - Retorno de agruparPorMes.
 */
function renderizarKpis(agrupado) {
  const ultimo = agrupado.chaves.length - 1;
  const atual = resumirMes(agrupado, ultimo);
  const anterior = ultimo > 0 ? resumirMes(agrupado, ultimo - 1) : null;
  const variar = (campo) => (anterior ? calcularVariacao(atual[campo], anterior[campo]) : null);
  const detalhe = `Fechamento de ${rotuloMes(agrupado.chaves[ultimo])}`;
  const cartoes = [
    { rotulo: 'Receita total', valor: atual.receita, variacao: variar('receita'), altaEhBoa: true, detalhe },
    { rotulo: 'Despesas', valor: atual.despesa, variacao: variar('despesa'), altaEhBoa: false, detalhe },
    { rotulo: 'Lucro líquido', valor: atual.lucro, variacao: variar('lucro'), altaEhBoa: true, detalhe },
    { rotulo: 'Caixa disponível', valor: atual.caixa, variacao: variar('caixa'), altaEhBoa: true, detalhe: `${detalhe} (saldo inicial ${formatadorMoeda.format(SALDO_INICIAL)})` },
  ];
  const container = document.getElementById('kpis');
  container.replaceChildren(...cartoes.map(criarCartaoKpi));
}

/**
 * Soma despesas realizadas por subcategoria em um mês.
 * @param {Array<object>} realizados - Lançamentos realizados.
 * @param {string} chave - Mês 'AAAA-MM'.
 * @returns {Object<string, {total: number, maior: object}>} Totais e maior lançamento.
 */
function somarDespesasPorSubcategoria(realizados, chave) {
  const mapa = {};
  realizados
    .filter((item) => item.tipo === TIPO_DESPESA && chaveMes(item.data) === chave)
    .forEach((item) => {
      const atual = mapa[item.subcategoria] || { total: 0, maior: item };
      atual.total += item.valor;
      if (item.valor > atual.maior.valor) atual.maior = item;
      mapa[item.subcategoria] = atual;
    });
  return mapa;
}

/**
 * Encontra categorias de despesa que subiram acima do limiar.
 * @param {Array<object>} realizados - Lançamentos realizados.
 * @param {string[]} chaves - Meses ordenados.
 * @returns {Array<{categoria: string, variacao: number, motivo: string}>} Alertas ordenados.
 */
function detectarAlertas(realizados, chaves) {
  if (chaves.length < 2) return [];
  const [anterior, atual] = chaves.slice(-2).map((chave) => somarDespesasPorSubcategoria(realizados, chave));
  const nomeAtual = rotuloMes(chaves[chaves.length - 1]);
  const nomeAnterior = rotuloMes(chaves[chaves.length - 2]);
  return Object.keys(atual)
    .filter((categoria) => anterior[categoria])
    .map((categoria) => {
      const variacao = calcularVariacao(atual[categoria].total, anterior[categoria].total);
      const motivo = `${formatadorMoeda.format(atual[categoria].total)} em ${nomeAtual} contra ${formatadorMoeda.format(anterior[categoria].total)} em ${nomeAnterior}. Maior lançamento: ${atual[categoria].maior.descricao} (${formatadorMoeda.format(atual[categoria].maior.valor)}).`;
      return { categoria, variacao, motivo };
    })
    .filter((alerta) => alerta.variacao > LIMIAR_ALERTA_PERCENTUAL)
    .sort((a, b) => b.variacao - a.variacao);
}

/**
 * Cria o elemento visual de um alerta.
 * @param {{categoria: string, variacao: number, motivo: string}} alerta - Dados do alerta.
 * @returns {HTMLElement} Elemento do alerta.
 */
function criarElementoAlerta(alerta) {
  const elemento = document.createElement('div');
  elemento.className = 'alerta';
  elemento.innerHTML = `<strong>${alerta.categoria}: despesa subiu ${formatarPercentual(alerta.variacao)} vs. mês anterior</strong><span>${alerta.motivo}</span>`;
  return elemento;
}

/**
 * Desenha a lista de alertas (ou mensagem de normalidade).
 * @param {Array<object>} alertas - Alertas detectados.
 */
function renderizarAlertas(alertas) {
  const container = document.getElementById('alertas');
  if (alertas.length === 0) {
    container.innerHTML = `<div class="alerta alerta--ok">Nenhuma categoria de despesa subiu mais de ${LIMIAR_ALERTA_PERCENTUAL}% vs. o mês anterior.</div>`;
    return;
  }
  container.replaceChildren(...alertas.map(criarElementoAlerta));
}

/**
 * Aplica as cores padrão do Chart.js.
 */
function configurarPadroesGrafico() {
  Chart.defaults.color = CORES.textoSuave;
  Chart.defaults.borderColor = CORES.grade;
  Chart.defaults.maintainAspectRatio = false;
  Chart.defaults.plugins.legend.labels.color = CORES.texto;
}

/**
 * Formata valores do eixo Y em reais.
 * @param {number} valor - Valor numérico.
 * @returns {string} Texto em moeda.
 */
function formatarEixoMoeda(valor) {
  return formatadorMoeda.format(valor);
}

/**
 * Desenha o gráfico de barras agrupadas receita x despesas.
 * @param {object} agrupado - Retorno de agruparPorMes.
 */
function renderizarGraficoBarras(agrupado) {
  const { chaves, totais } = agrupado;
  new Chart(document.getElementById('graficoBarras'), {
    type: 'bar',
    data: {
      labels: chaves.map(rotuloMes),
      datasets: [
        { label: 'Receita', data: chaves.map((chave) => totais[chave].receita), backgroundColor: CORES.receita },
        { label: 'Despesas', data: chaves.map((chave) => totais[chave].despesa), backgroundColor: CORES.despesa },
      ],
    },
    options: {
      scales: { y: { ticks: { callback: formatarEixoMoeda } } },
      plugins: { tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatadorMoeda.format(ctx.parsed.y)}` } } },
    },
  });
}

/**
 * Calcula o saldo acumulado dia a dia.
 * @param {Array<object>} realizados - Lançamentos realizados.
 * @returns {{rotulos: string[], saldos: number[]}} Pontos da linha.
 */
function calcularCaixaDiario(realizados) {
  const porDia = {};
  realizados.forEach((item) => {
    const chave = item.data.getTime();
    porDia[chave] = (porDia[chave] || 0) + (item.tipo === TIPO_RECEITA ? item.valor : -item.valor);
  });
  const dias = Object.keys(porDia).map(Number).sort((a, b) => a - b);
  let saldo = SALDO_INICIAL;
  const saldos = dias.map((dia) => (saldo += porDia[dia]));
  return { rotulos: dias.map((dia) => formatarData(new Date(dia))), saldos };
}

/**
 * Desenha o gráfico de linha do fluxo de caixa acumulado.
 * @param {Array<object>} realizados - Lançamentos realizados.
 */
function renderizarGraficoCaixa(realizados) {
  const { rotulos, saldos } = calcularCaixaDiario(realizados);
  new Chart(document.getElementById('graficoCaixa'), {
    type: 'line',
    data: {
      labels: rotulos,
      datasets: [{ label: 'Caixa acumulado', data: saldos, borderColor: CORES.caixa, backgroundColor: CORES.caixaFundo, fill: true, tension: 0.25, pointRadius: 0 }],
    },
    options: {
      scales: { y: { ticks: { callback: formatarEixoMoeda } }, x: { ticks: { maxTicksLimit: 8 } } },
      plugins: { tooltip: { callbacks: { label: (ctx) => `Caixa: ${formatadorMoeda.format(ctx.parsed.y)}` } } },
    },
  });
}

/**
 * Define o status de uma conta conforme o vencimento.
 * @param {Date} vencimento - Data de vencimento.
 * @param {Date} referencia - Data de referência (hoje do dashboard).
 * @returns {{classe: string, texto: string}} Status visual.
 */
function definirStatus(vencimento, referencia) {
  const dias = Math.round((vencimento - referencia) / MILISSEGUNDOS_POR_DIA);
  if (dias < 0) return STATUS_PAGAR.vencido;
  if (dias <= DIAS_ATENCAO_VENCIMENTO) return STATUS_PAGAR.atencao;
  return STATUS_PAGAR.noPrazo;
}

/**
 * Seleciona contas vencidas ou que vencem dentro da janela.
 * @param {Array<object>} lancamentos - Todos os lançamentos.
 * @param {Date} referencia - Data de referência.
 * @returns {Array<object>} Contas a pagar ordenadas por vencimento.
 */
function selecionarContasAPagar(lancamentos, referencia) {
  const limite = referencia.getTime() + DIAS_JANELA_PAGAR * MILISSEGUNDOS_POR_DIA;
  return lancamentos
    .filter((item) => item.aPagar && item.tipo === TIPO_DESPESA && item.data.getTime() <= limite)
    .sort((a, b) => a.data - b.data);
}

/**
 * Cria a linha da tabela de contas a pagar.
 * @param {object} conta - Lançamento a pagar.
 * @param {Date} referencia - Data de referência.
 * @returns {HTMLTableRowElement} Linha da tabela.
 */
function criarLinhaConta(conta, referencia) {
  const status = definirStatus(conta.data, referencia);
  const linha = document.createElement('tr');
  linha.innerHTML = `
    <td>${formatarData(conta.data)}</td>
    <td>${conta.descricao}</td>
    <td>${formatadorMoeda.format(conta.valor)}</td>
    <td><span class="selo ${status.classe}">${status.texto}</span></td>`;
  return linha;
}

/**
 * Desenha a tabela de contas a pagar.
 * @param {Array<object>} contas - Contas selecionadas.
 * @param {Date} referencia - Data de referência.
 */
function renderizarTabelaPagar(contas, referencia) {
  const corpo = document.getElementById('tabelaPagar');
  if (contas.length === 0) {
    corpo.innerHTML = '<tr><td colspan="4">Nenhuma conta a pagar nos próximos 30 dias.</td></tr>';
    return;
  }
  corpo.replaceChildren(...contas.map((conta) => criarLinhaConta(conta, referencia)));
}

/**
 * Ponto de entrada: carrega o CSV embutido e monta o dashboard.
 */
function iniciar() {
  const lancamentos = analisarCsv(CSV_EMBUTIDO);
  const realizados = lancamentos.filter((item) => !item.aPagar);
  if (realizados.length === 0) return;

  const agrupado = agruparPorMes(realizados);
  const referencia = new Date(Math.max(...realizados.map((item) => item.data.getTime())));
  document.getElementById('periodo').textContent = `${rotuloMes(agrupado.chaves[0])} a ${rotuloMes(agrupado.chaves[agrupado.chaves.length - 1])} · posição em ${formatarData(referencia)}`;

  configurarPadroesGrafico();
  renderizarKpis(agrupado);
  renderizarAlertas(detectarAlertas(realizados, agrupado.chaves));
  renderizarGraficoBarras(agrupado);
  renderizarGraficoCaixa(realizados);
  renderizarTabelaPagar(selecionarContasAPagar(lancamentos, referencia), referencia);
}

iniciar();
