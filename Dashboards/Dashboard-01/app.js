/* Dashboard de Vendas: lê o CSV embutido (dados.js) e desenha KPIs, gráficos e ranking. */

const COR_DESTAQUE = '#00c896';
const COR_ALERTA = '#ff4d4d';
const COR_TEXTO = '#e8e8f2';
const COR_GRADE = 'rgba(160, 160, 192, 0.15)';
const CORES_CANAIS = ['#00c896', '#4da3ff', '#ffc233', '#b084ff', '#ff8a5c'];

const META_MENSAL = 85000;
const LIMITE_VERDE = 90;
const LIMITE_AMARELO = 70;
const PERCENTUAL_TOTAL = 100;
const STATUS_CONCLUIDO = 'Concluído';
const STATUS_CANCELADO = 'Cancelado';
const POSICAO_DIA_NA_DATA = 8;
const TRACEJADO_META = [6, 4];

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatoInteiro = new Intl.NumberFormat('pt-BR');
const formatoPercentual = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

/**
 * Converte o texto CSV em uma lista de pedidos.
 * @param {string} texto - Conteúdo CSV com cabeçalho data,valor,canal,vendedor,status.
 * @returns {{data: string, valor: number, canal: string, vendedor: string, status: string}[]}
 */
function lerCsv(texto) {
  const linhas = texto.trim().split(/\r?\n/).slice(1);
  return linhas.filter(Boolean).map((linha) => {
    const [data, valor, canal, vendedor, status] = linha.split(',').map((c) => c.trim());
    return { data, valor: Number(valor), canal, vendedor, status };
  });
}

/**
 * Soma os valores de uma lista de pedidos.
 * @param {{valor: number}[]} pedidos - Pedidos a somar.
 * @returns {number} Total somado.
 */
function somarValores(pedidos) {
  return pedidos.reduce((total, pedido) => total + pedido.valor, 0);
}

/**
 * Agrupa pedidos por uma chave e soma o valor de cada grupo.
 * @param {{valor: number}[]} pedidos - Pedidos a agrupar.
 * @param {string} chave - Nome do campo usado no agrupamento.
 * @returns {Map<string|number, number>} Total por valor da chave.
 */
function agruparPorChave(pedidos, chave) {
  const grupos = new Map();
  pedidos.forEach((pedido) => {
    grupos.set(pedido[chave], (grupos.get(pedido[chave]) || 0) + pedido.valor);
  });
  return grupos;
}

/**
 * Descobre ano, mês e quantidade de dias do mês dos pedidos.
 * @param {{data: string}[]} pedidos - Pedidos com data AAAA-MM-DD.
 * @returns {{ano: number, mes: number, dias: number}} Ano, mês (1-12) e total de dias.
 */
function obterMes(pedidos) {
  const [ano, mes] = pedidos[0].data.split('-').map(Number);
  return { ano, mes, dias: new Date(ano, mes, 0).getDate() };
}

/**
 * Define a cor semântica do atingimento de meta.
 * @param {number} percentual - Percentual da meta atingido.
 * @returns {{classe: string, rotulo: string}} Classe CSS do selo e texto.
 */
function classificarMeta(percentual) {
  if (percentual > LIMITE_VERDE) return { classe: 'selo--verde', rotulo: 'No alvo' };
  if (percentual >= LIMITE_AMARELO) return { classe: 'selo--amarelo', rotulo: 'Atenção' };
  return { classe: 'selo--vermelho', rotulo: 'Abaixo' };
}

/**
 * Escreve um texto em um elemento pelo id.
 * @param {string} id - Id do elemento.
 * @param {string} texto - Texto a exibir.
 * @param {string} [classe] - Classe extra opcional.
 * @returns {void}
 */
function escreverTexto(id, texto, classe) {
  const elemento = document.getElementById(id);
  elemento.textContent = texto;
  if (classe) elemento.classList.add(classe);
}

/**
 * Preenche os quatro KPIs do topo.
 * @param {{pedidos: object[], concluidos: object[], faturamento: number}} contexto
 * @returns {void}
 */
function desenharKpis({ pedidos, concluidos, faturamento }) {
  const percentual = (faturamento / META_MENSAL) * PERCENTUAL_TOTAL;
  const bateuMeta = percentual >= PERCENTUAL_TOTAL;
  const cancelados = pedidos.filter((p) => p.status === STATUS_CANCELADO).length;
  const classeMeta = bateuMeta ? 'kpi__detalhe--destaque' : 'kpi__detalhe--alerta';
  const ticket = faturamento / (concluidos.length || 1);
  escreverTexto('kpi-faturamento', formatoMoeda.format(faturamento), 'kpi__valor--destaque');
  escreverTexto('kpi-faturamento-detalhe', `${formatoPercentual.format(percentual)}% da meta`);
  escreverTexto('kpi-meta', formatoMoeda.format(META_MENSAL));
  escreverTexto('kpi-meta-detalhe', bateuMeta ? 'Meta batida' : 'Meta em andamento', classeMeta);
  escreverTexto('kpi-ticket', formatoMoeda.format(ticket));
  escreverTexto('kpi-pedidos', formatoInteiro.format(pedidos.length));
  escreverTexto('kpi-pedidos-detalhe', `${concluidos.length} concluídos, ${cancelados} cancelados`);
}

/**
 * Opções de eixos escuros para o Chart.js.
 * @returns {object} Configuração de escalas.
 */
function opcoesEscalas() {
  const eixo = { ticks: { color: COR_TEXTO }, grid: { color: COR_GRADE } };
  return { x: eixo, y: { ...eixo, beginAtZero: true } };
}

/**
 * Desenha o gráfico de barras de vendas por dia contra a meta diária.
 * @param {{concluidos: object[], mes: {dias: number}}} contexto
 * @returns {void}
 */
function desenharGraficoDias({ concluidos, mes }) {
  const comDia = concluidos.map((p) => ({ ...p, dia: Number(p.data.slice(POSICAO_DIA_NA_DATA)) }));
  const porDia = agruparPorChave(comDia, 'dia');
  const dias = Array.from({ length: mes.dias }, (_, i) => i + 1);
  const metaDiaria = META_MENSAL / mes.dias;
  const barras = { type: 'bar', label: 'Vendas do dia', backgroundColor: COR_DESTAQUE };
  const linha = { type: 'line', label: 'Meta diária', borderColor: COR_ALERTA, borderDash: TRACEJADO_META, pointRadius: 0 };
  new Chart(document.getElementById('grafico-dias'), {
    data: {
      labels: dias,
      datasets: [
        { ...barras, data: dias.map((d) => porDia.get(d) || 0) },
        { ...linha, data: dias.map(() => metaDiaria) },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: opcoesEscalas(),
      plugins: { legend: { labels: { color: COR_TEXTO } } },
    },
  });
}

/**
 * Desenha o gráfico de rosca de vendas por canal.
 * @param {{concluidos: object[]}} contexto - Pedidos concluídos.
 * @returns {void}
 */
function desenharGraficoCanais({ concluidos }) {
  const porCanal = agruparPorChave(concluidos, 'canal');
  const rotuloTooltip = (item) => `${item.label}: ${formatoMoeda.format(item.parsed)}`;
  new Chart(document.getElementById('grafico-canais'), {
    type: 'doughnut',
    data: {
      labels: [...porCanal.keys()],
      datasets: [{ data: [...porCanal.values()], backgroundColor: CORES_CANAIS, borderWidth: 0 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: COR_TEXTO } },
        tooltip: { callbacks: { label: rotuloTooltip } },
      },
    },
  });
}

/**
 * Cria uma célula de tabela com texto.
 * @param {string} texto - Conteúdo da célula.
 * @param {string} [classe] - Classe CSS opcional.
 * @returns {HTMLTableCellElement} Célula criada.
 */
function criarCelula(texto, classe) {
  const celula = document.createElement('td');
  celula.textContent = texto;
  if (classe) celula.className = classe;
  return celula;
}

/**
 * Cria a célula com o selo de status da meta.
 * @param {number} percentual - Percentual da meta atingido.
 * @returns {HTMLTableCellElement} Célula com selo.
 */
function criarCelulaStatus(percentual) {
  const { classe, rotulo } = classificarMeta(percentual);
  const selo = document.createElement('span');
  selo.className = `selo ${classe}`;
  selo.textContent = rotulo;
  const celula = document.createElement('td');
  celula.appendChild(selo);
  return celula;
}

/**
 * Monta a tabela de ranking de vendedores ordenada por vendas.
 * @param {{concluidos: object[]}} contexto - Pedidos concluídos.
 * @returns {void}
 */
function desenharRanking({ concluidos }) {
  const totais = [...agruparPorChave(concluidos, 'vendedor').entries()].sort((a, b) => b[1] - a[1]);
  const metaVendedor = META_MENSAL / totais.length;
  const corpo = document.getElementById('ranking');
  totais.forEach(([vendedor, total], indice) => {
    const percentual = (total / metaVendedor) * PERCENTUAL_TOTAL;
    const linha = document.createElement('tr');
    linha.append(
      criarCelula(String(indice + 1)),
      criarCelula(vendedor),
      criarCelula(formatoMoeda.format(total), 'direita'),
      criarCelula(formatoMoeda.format(metaVendedor), 'direita'),
      criarCelula(`${formatoPercentual.format(percentual)}%`, 'direita'),
      criarCelulaStatus(percentual),
    );
    corpo.appendChild(linha);
  });
}

/**
 * Exibe o período coberto pelos dados.
 * @param {{ano: number, mes: number}} mes - Ano e mês dos dados.
 * @returns {void}
 */
function mostrarPeriodo({ ano, mes }) {
  const nome = new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  escreverTexto('periodo', `Período: ${nome}`);
}

/**
 * Ponto de entrada: carrega o CSV e desenha todo o painel.
 * @returns {void}
 */
function iniciar() {
  const pedidos = lerCsv(CSV_EMBUTIDO);
  const concluidos = pedidos.filter((p) => p.status === STATUS_CONCLUIDO);
  const contexto = { pedidos, concluidos, mes: obterMes(pedidos), faturamento: somarValores(concluidos) };
  mostrarPeriodo(contexto.mes);
  desenharKpis(contexto);
  desenharGraficoDias(contexto);
  desenharGraficoCanais(contexto);
  desenharRanking(contexto);
}

iniciar();
