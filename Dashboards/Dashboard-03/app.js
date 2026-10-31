/* Dashboard 03 — Estoque. Depende de dados.js (CSV_ESTOQUE, CSV_MOVIMENTACAO, DATA_REFERENCIA) e Chart.js. */

const MS_POR_DIA = 24 * 60 * 60 * 1000;
const DIAS_PARADO = 60;
const PERCENTUAL_CRITICO = 0.5;
const LOCALE = 'pt-BR';
const COR_URGENTE = '#f85149';
const COR_OK = '#3fb950';
const COR_TEXTO = '#e6edf3';
const COR_GRADE = '#2a3441';
const COR_SUPERFICIE = '#1a212b';
const CORES_CATEGORIAS = ['#58a6ff', '#3fb950', '#d29922', '#bc8cff', '#f778ba', '#39c5cf', '#ff9f43'];
const NOMES_MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MSG_SEM_REPOSICAO = 'Nenhum produto abaixo do mínimo.';
const MSG_SEM_PARADOS = 'Nenhum produto parado.';
const COLUNAS_TABELA_REPOR = 5;
const COLUNAS_TABELA_PARADOS = 3;
const TENSAO_LINHA = 0.3;

/**
 * Converte texto CSV (separado por vírgula, sem aspas) em lista de objetos.
 * @param {string} texto - Conteúdo do CSV com cabeçalho na primeira linha.
 * @returns {Object[]} Linhas como objetos indexados pelo nome da coluna.
 */
function lerCsv(texto) {
  const linhas = texto.trim().split(/\r?\n/);
  const colunas = linhas[0].split(',').map((coluna) => coluna.trim());
  return linhas.slice(1).filter(Boolean).map((linha) => {
    const valores = linha.split(',');
    return Object.fromEntries(colunas.map((coluna, i) => [coluna, (valores[i] || '').trim()]));
  });
}

/**
 * Calcula quantos dias se passaram entre uma data ISO e a data de referência.
 * @param {string} dataIso - Data no formato AAAA-MM-DD.
 * @param {Date} referencia - Data de referência.
 * @returns {number} Dias inteiros decorridos.
 */
function diasEntre(dataIso, referencia) {
  return Math.round((referencia - new Date(`${dataIso}T00:00:00`)) / MS_POR_DIA);
}

/**
 * Converte as linhas do CSV de estoque em produtos tipados com campos calculados.
 * @param {Object[]} linhas - Linhas cruas do CSV.
 * @param {Date} referencia - Data de referência.
 * @returns {Object[]} Produtos com números, diasSemVender e valorTotal.
 */
function montarProdutos(linhas, referencia) {
  return linhas.map((linha) => {
    const quantidade = Number(linha.quantidade_atual);
    const custo = Number(linha.custo_unitario);
    return {
      nome: linha.produto,
      categoria: linha.categoria,
      quantidade,
      minimo: Number(linha.quantidade_minima),
      custo,
      diasSemVender: diasEntre(linha.ultima_venda, referencia),
      valorTotal: quantidade * custo,
    };
  });
}

/**
 * Formata um número como moeda brasileira.
 * @param {number} valor - Valor em reais.
 * @returns {string} Texto no formato R$ 1.234,56.
 */
function formatarMoeda(valor) {
  return valor.toLocaleString(LOCALE, { style: 'currency', currency: 'BRL' });
}

/**
 * Lista produtos abaixo do mínimo, do mais urgente (maior déficit relativo) ao menos.
 * @param {Object[]} produtos - Produtos do estoque.
 * @returns {Object[]} Produtos com a propriedade falta, ordenados por urgência.
 */
function listarParaRepor(produtos) {
  return produtos
    .filter((produto) => produto.quantidade < produto.minimo)
    .map((produto) => ({ ...produto, falta: produto.minimo - produto.quantidade }))
    .sort((a, b) => b.falta / b.minimo - a.falta / a.minimo);
}

/**
 * Lista produtos sem venda há mais de DIAS_PARADO dias, do mais antigo ao mais recente.
 * @param {Object[]} produtos - Produtos do estoque.
 * @returns {Object[]} Produtos parados.
 */
function listarParados(produtos) {
  return produtos
    .filter((produto) => produto.diasSemVender > DIAS_PARADO)
    .sort((a, b) => b.diasSemVender - a.diasSemVender);
}

/**
 * Soma o valor em estoque de uma lista de produtos.
 * @param {Object[]} produtos - Produtos.
 * @returns {number} Soma de valorTotal.
 */
function somarValor(produtos) {
  return produtos.reduce((soma, produto) => soma + produto.valorTotal, 0);
}

/**
 * Calcula o giro médio em dias (média de dias desde a última venda).
 * @param {Object[]} produtos - Produtos do estoque.
 * @returns {number} Média de dias, ou 0 sem produtos.
 */
function calcularGiroMedio(produtos) {
  if (!produtos.length) return 0;
  const totalDias = produtos.reduce((soma, produto) => soma + produto.diasSemVender, 0);
  return totalDias / produtos.length;
}

/**
 * Agrupa o valor em estoque por categoria.
 * @param {Object[]} produtos - Produtos do estoque.
 * @returns {Object} Mapa categoria -> valor em R$.
 */
function agruparPorCategoria(produtos) {
  return produtos.reduce((grupos, produto) => {
    grupos[produto.categoria] = (grupos[produto.categoria] || 0) + produto.valorTotal;
    return grupos;
  }, {});
}

/**
 * Escreve texto em um elemento pelo id.
 * @param {string} id - Id do elemento.
 * @param {string} texto - Texto a exibir.
 */
function definirTexto(id, texto) {
  document.getElementById(id).textContent = texto;
}

/**
 * Preenche os quatro KPIs.
 * @param {Object[]} produtos - Produtos do estoque.
 */
function renderizarKpis(produtos) {
  const totalItens = produtos.reduce((soma, produto) => soma + produto.quantidade, 0);
  definirTexto('kpiTotalItens', totalItens.toLocaleString(LOCALE));
  definirTexto('kpiValorParado', formatarMoeda(somarValor(listarParados(produtos))));
  definirTexto('kpiEmFalta', String(listarParaRepor(produtos).length));
  definirTexto('kpiGiroMedio', `${Math.round(calcularGiroMedio(produtos))} dias`);
}

/**
 * Cria uma célula de tabela.
 * @param {string} texto - Conteúdo.
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
 * Cria a célula com o selo de alerta conforme a gravidade da falta.
 * @param {Object} produto - Produto com quantidade e minimo.
 * @returns {HTMLTableCellElement} Célula com o selo.
 */
function criarCelulaAlerta(produto) {
  const critico = produto.quantidade <= produto.minimo * PERCENTUAL_CRITICO;
  const selo = document.createElement('span');
  selo.className = critico ? 'selo' : 'selo selo--atencao';
  selo.textContent = critico ? 'Crítico' : 'Repor';
  const celula = document.createElement('td');
  celula.appendChild(selo);
  return celula;
}

/**
 * Preenche um corpo de tabela com linhas, ou com uma mensagem de vazio.
 * @param {string} id - Id do tbody.
 * @param {Array<HTMLTableCellElement[]>} linhas - Células de cada linha.
 * @param {{mensagem: string, colunas: number}} vazio - Mensagem e colspan quando não há linhas.
 */
function preencherTabela(id, linhas, vazio) {
  const corpo = document.getElementById(id);
  corpo.replaceChildren();
  if (!linhas.length) {
    const celula = criarCelula(vazio.mensagem, 'texto-vazio');
    celula.colSpan = vazio.colunas;
    const linha = document.createElement('tr');
    linha.appendChild(celula);
    corpo.appendChild(linha);
    return;
  }
  linhas.forEach((celulas) => {
    const linha = document.createElement('tr');
    celulas.forEach((celula) => linha.appendChild(celula));
    corpo.appendChild(linha);
  });
}

/**
 * Renderiza a tabela "Repor agora".
 * @param {Object[]} produtos - Produtos do estoque.
 */
function renderizarTabelaRepor(produtos) {
  const linhas = listarParaRepor(produtos).map((produto) => [
    criarCelula(produto.nome),
    criarCelula(String(produto.quantidade), 'texto-urgente'),
    criarCelula(String(produto.minimo)),
    criarCelula(String(produto.falta)),
    criarCelulaAlerta(produto),
  ]);
  preencherTabela('tabelaRepor', linhas, { mensagem: MSG_SEM_REPOSICAO, colunas: COLUNAS_TABELA_REPOR });
}

/**
 * Renderiza a tabela de produtos parados.
 * @param {Object[]} produtos - Produtos do estoque.
 */
function renderizarTabelaParados(produtos) {
  const linhas = listarParados(produtos).map((produto) => [
    criarCelula(produto.nome),
    criarCelula(`${produto.diasSemVender} dias`, 'texto-urgente'),
    criarCelula(formatarMoeda(produto.valorTotal)),
  ]);
  preencherTabela('tabelaParados', linhas, { mensagem: MSG_SEM_PARADOS, colunas: COLUNAS_TABELA_PARADOS });
}

/**
 * Converte "AAAA-MM" em rótulo curto como "out/26".
 * @param {string} mes - Mês no formato AAAA-MM.
 * @returns {string} Rótulo curto.
 */
function rotuloMes(mes) {
  const [ano, numero] = mes.split('-');
  return `${NOMES_MESES[Number(numero) - 1]}/${ano.slice(2)}`;
}

/**
 * Retorna as escalas do Chart.js no tema escuro.
 * @returns {Object} Configuração de escalas.
 */
function opcoesEixos() {
  const eixo = { ticks: { color: COR_TEXTO }, grid: { color: COR_GRADE } };
  return { x: eixo, y: { ...eixo, beginAtZero: true } };
}

/**
 * Desenha o gráfico de linha de entradas x saídas.
 * @param {Object[]} movimentacao - Linhas com mes, entradas e saidas.
 */
function desenharGraficoMovimentacao(movimentacao) {
  const conjunto = (rotulo, campo, cor) => ({
    label: rotulo,
    data: movimentacao.map((linha) => Number(linha[campo])),
    borderColor: cor,
    backgroundColor: cor,
    tension: TENSAO_LINHA,
  });
  new Chart(document.getElementById('graficoMovimentacao'), {
    type: 'line',
    data: {
      labels: movimentacao.map((linha) => rotuloMes(linha.mes)),
      datasets: [conjunto('Entradas', 'entradas', COR_OK), conjunto('Saídas', 'saidas', COR_URGENTE)],
    },
    options: {
      maintainAspectRatio: false,
      scales: opcoesEixos(),
      plugins: { legend: { labels: { color: COR_TEXTO } } },
    },
  });
}

/**
 * Desenha o gráfico de rosca de estoque por categoria, com valor em R$ no tooltip.
 * @param {Object[]} produtos - Produtos do estoque.
 */
function desenharGraficoCategorias(produtos) {
  const grupos = agruparPorCategoria(produtos);
  new Chart(document.getElementById('graficoCategorias'), {
    type: 'doughnut',
    data: {
      labels: Object.keys(grupos),
      datasets: [{ data: Object.values(grupos), backgroundColor: CORES_CATEGORIAS, borderColor: COR_SUPERFICIE }],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: COR_TEXTO } },
        tooltip: { callbacks: { label: (item) => `${item.label}: ${formatarMoeda(item.parsed)}` } },
      },
    },
  });
}

/**
 * Ponto de entrada: lê os dados embutidos e renderiza o painel.
 */
function iniciar() {
  const referencia = new Date(`${DATA_REFERENCIA}T00:00:00`);
  const produtos = montarProdutos(lerCsv(CSV_ESTOQUE), referencia);
  definirTexto('dataReferencia', `Posição em ${referencia.toLocaleDateString(LOCALE)}`);
  renderizarKpis(produtos);
  renderizarTabelaRepor(produtos);
  renderizarTabelaParados(produtos);
  desenharGraficoMovimentacao(lerCsv(CSV_MOVIMENTACAO));
  desenharGraficoCategorias(produtos);
}

iniciar();
