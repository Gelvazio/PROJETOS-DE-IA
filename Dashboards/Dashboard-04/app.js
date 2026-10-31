const COR_DESTAQUE = '#6699ff';
const COR_LUCRO = '#4cd6a0';
const COR_TEXTO = '#8b8fb0';
const COR_GRADE = '#24243f';
const TRANSPARENCIA_AREA = '33';
const QUANTIDADE_TOP_CLIENTES = 7;
const MESES_NO_ANO = 12;
const PERCENTUAL = 100;
const TENSAO_LINHA = 0.35;
const RAIO_BARRA = 6;
const CASAS_MARGEM = 1;
const NOMES_MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const FORMATO_MOEDA = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
});
const FORMATO_NUMERO = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

/**
 * Converte o texto CSV (data,cliente,receita,custo) em uma lista de registros.
 * @param {string} texto - Conteúdo do CSV com cabeçalho.
 * @returns {{ano: number, mes: number, cliente: string, receita: number, custo: number}[]}
 */
function lerCsv(texto) {
  const linhas = texto.trim().split(/\r?\n/).slice(1);
  return linhas
    .filter((linha) => linha.trim() !== '')
    .map((linha) => {
      const [data, cliente, receita, custo] = linha.split(',');
      const [ano, mes] = data.split('-').map(Number);
      return { ano, mes, cliente: cliente.trim(), receita: Number(receita), custo: Number(custo) };
    });
}

/**
 * Soma receita, custo, lucro e margem de um conjunto de registros.
 * @param {{receita: number, custo: number, cliente: string}[]} registros - Registros do período.
 * @returns {{receita: number, custo: number, lucro: number, margem: number, clientes: number}}
 */
function totalizar(registros) {
  const receita = registros.reduce((soma, r) => soma + r.receita, 0);
  const custo = registros.reduce((soma, r) => soma + r.custo, 0);
  const lucro = receita - custo;
  const margem = receita > 0 ? (lucro / receita) * PERCENTUAL : 0;
  const clientes = new Set(registros.map((r) => r.cliente)).size;
  return { receita, custo, lucro, margem, clientes };
}

/**
 * Calcula a variação percentual entre dois valores.
 * @param {number} atual - Valor atual.
 * @param {number} anterior - Valor do período anterior.
 * @returns {number|null} Variação em %, ou null se não houver base de comparação.
 */
function variacaoPercentual(atual, anterior) {
  if (!anterior) return null;
  return ((atual - anterior) / anterior) * PERCENTUAL;
}

/**
 * Monta o texto e a classe de uma variação.
 * @param {number|null} valor - Variação calculada.
 * @param {string} unidade - Sufixo exibido ("%" ou " p.p.").
 * @returns {{texto: string, classe: string}}
 */
function descreverVariacao(valor, unidade) {
  if (valor === null) return { texto: 'sem ano anterior', classe: '' };
  const sinal = valor >= 0 ? '▲' : '▼';
  const classe = valor >= 0 ? 'kpi__variacao--positiva' : 'kpi__variacao--negativa';
  const numero = FORMATO_NUMERO.format(Math.abs(valor));
  return { texto: `${sinal} ${numero}${unidade} vs. ano anterior`, classe };
}

/**
 * Gera o HTML de um cartão de KPI.
 * @param {{rotulo: string, valor: string, variacao: {texto: string, classe: string}}} kpi
 * @returns {string} HTML do cartão.
 */
function montarKpi({ rotulo, valor, variacao }) {
  return `<article class="kpi">
    <div class="kpi__rotulo">${rotulo}</div>
    <div class="kpi__valor">${valor}</div>
    <div class="kpi__variacao ${variacao.classe}">${variacao.texto}</div>
  </article>`;
}

/**
 * Renderiza os quatro KPIs principais.
 * @param {object} atual - Totais do ano atual.
 * @param {object} anterior - Totais do ano anterior.
 */
function renderizarKpis(atual, anterior) {
  const diferencaMargem = anterior.receita ? atual.margem - anterior.margem : null;
  const kpis = [
    {
      rotulo: 'Faturamento no ano',
      valor: FORMATO_MOEDA.format(atual.receita),
      variacao: descreverVariacao(variacaoPercentual(atual.receita, anterior.receita), '%'),
    },
    {
      rotulo: 'Lucro líquido',
      valor: FORMATO_MOEDA.format(atual.lucro),
      variacao: descreverVariacao(variacaoPercentual(atual.lucro, anterior.lucro), '%'),
    },
    {
      rotulo: 'Margem líquida',
      valor: `${FORMATO_NUMERO.format(atual.margem)}%`,
      variacao: descreverVariacao(diferencaMargem, ' p.p.'),
    },
    {
      rotulo: 'Clientes ativos',
      valor: String(atual.clientes),
      variacao: descreverVariacao(variacaoPercentual(atual.clientes, anterior.clientes), '%'),
    },
  ];
  document.getElementById('kpis').innerHTML = kpis.map(montarKpi).join('');
}

/**
 * Agrupa os registros de um ano por mês.
 * @param {{mes: number}[]} registros - Registros do ano.
 * @returns {object[]} Totais de cada mês (12 posições).
 */
function totalizarPorMes(registros) {
  return Array.from({ length: MESES_NO_ANO }, (_, indice) =>
    totalizar(registros.filter((r) => r.mes === indice + 1)));
}

/**
 * Retorna os clientes com maior valor comprado.
 * @param {{cliente: string, receita: number}[]} registros - Registros do ano.
 * @param {number} limite - Quantidade de clientes.
 * @returns {{cliente: string, receita: number}[]} Clientes em ordem decrescente.
 */
function obterTopClientes(registros, limite) {
  const porCliente = new Map();
  registros.forEach((r) => {
    porCliente.set(r.cliente, (porCliente.get(r.cliente) || 0) + r.receita);
  });
  return [...porCliente.entries()]
    .map(([cliente, receita]) => ({ cliente, receita }))
    .sort((a, b) => b.receita - a.receita)
    .slice(0, limite);
}

/**
 * Preenche a tabela de top clientes.
 * @param {{cliente: string, receita: number}[]} clientes - Clientes ordenados.
 */
function renderizarTabela(clientes) {
  document.getElementById('tabelaClientes').innerHTML = clientes
    .map((c, i) => `<tr><td>${i + 1}</td><td>${c.cliente}</td>
      <td class="tabela__numero">${FORMATO_MOEDA.format(c.receita)}</td></tr>`)
    .join('');
}

/**
 * Cria as opções comuns de eixos e legenda dos gráficos.
 * @param {function(number): string} formatarEixo - Formata os rótulos do eixo Y.
 * @returns {object} Opções do Chart.js.
 */
function criarOpcoes(formatarEixo) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: COR_TEXTO } } },
    scales: {
      x: { ticks: { color: COR_TEXTO }, grid: { display: false } },
      y: { ticks: { color: COR_TEXTO, callback: formatarEixo }, grid: { color: COR_GRADE } },
    },
  };
}

/**
 * Cria um conjunto de dados de área para o Chart.js.
 * @param {string} rotulo - Nome da série.
 * @param {string} cor - Cor hexadecimal da série.
 * @param {number[]} valores - Valores mensais.
 * @returns {object} Dataset do Chart.js.
 */
function criarConjuntoArea(rotulo, cor, valores) {
  return {
    label: rotulo,
    data: valores,
    borderColor: cor,
    backgroundColor: cor + TRANSPARENCIA_AREA,
    fill: true,
    tension: TENSAO_LINHA,
  };
}

/**
 * Desenha o gráfico de área de faturamento x lucro.
 * @param {{receita: number, lucro: number}[]} meses - Totais mensais.
 */
function desenharGraficoArea(meses) {
  new Chart(document.getElementById('graficoArea'), {
    type: 'line',
    data: {
      labels: NOMES_MESES,
      datasets: [
        criarConjuntoArea('Faturamento', COR_DESTAQUE, meses.map((m) => m.receita)),
        criarConjuntoArea('Lucro', COR_LUCRO, meses.map((m) => m.lucro)),
      ],
    },
    options: criarOpcoes((valor) => FORMATO_MOEDA.format(valor)),
  });
}

/**
 * Desenha o gráfico de barras de margem líquida mensal.
 * @param {{margem: number}[]} meses - Totais mensais.
 */
function desenharGraficoMargem(meses) {
  const opcoes = criarOpcoes((valor) => `${valor}%`);
  opcoes.plugins.legend.display = false;
  new Chart(document.getElementById('graficoMargem'), {
    type: 'bar',
    data: {
      labels: NOMES_MESES,
      datasets: [{
        label: 'Margem líquida (%)',
        data: meses.map((m) => Number(m.margem.toFixed(CASAS_MARGEM))),
        backgroundColor: COR_DESTAQUE,
        borderRadius: RAIO_BARRA,
      }],
    },
    options: opcoes,
  });
}

/**
 * Inicializa o painel: lê o CSV embutido e renderiza todos os blocos.
 */
function iniciar() {
  const registros = lerCsv(DADOS_CSV);
  const anoAtual = Math.max(...registros.map((r) => r.ano));
  const doAno = registros.filter((r) => r.ano === anoAtual);
  const doAnoAnterior = registros.filter((r) => r.ano === anoAtual - 1);
  document.getElementById('periodo').textContent = `Ano de ${anoAtual}`;
  renderizarKpis(totalizar(doAno), totalizar(doAnoAnterior));
  renderizarTabela(obterTopClientes(doAno, QUANTIDADE_TOP_CLIENTES));
  const meses = totalizarPorMes(doAno);
  desenharGraficoArea(meses);
  desenharGraficoMargem(meses);
}

iniciar();
