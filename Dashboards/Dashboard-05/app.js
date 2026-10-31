/**
 * Dashboard de Metas.
 * Le os CSVs embutidos em dados.js (CSV_METAS_MENSAIS e CSV_METAS_ANUAIS),
 * calcula atingimento e projecao de fechamento e desenha KPIs, graficos e tabela.
 */

const COR_REALIZADO = '#aaff00';
const COR_META = '#555555';
const COR_PROJECAO = '#a855f7';
const COR_TEXTO_GRAFICO = '#9a9aa3';
const COR_GRADE_GRAFICO = '#2a2a30';

const LIMITE_VERDE = 80;
const LIMITE_AMARELO = 60;
const PERCENTUAL_MAXIMO_BARRA = 100;
const MESES_NO_ANO = 12;

const CLASSE_VERDE = 'verde';
const CLASSE_AMARELO = 'amarelo';
const CLASSE_VERMELHO = 'vermelho';
const ROTULO_STATUS = {
  [CLASSE_VERDE]: 'No caminho',
  [CLASSE_AMARELO]: 'Atenção',
  [CLASSE_VERMELHO]: 'Crítico',
};

const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
});
const formatadorPercentual = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

/**
 * Converte um texto CSV (separado por virgula, com cabecalho) em lista de objetos.
 * @param {string} texto - Conteudo do CSV.
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
 * Agrupa as linhas mensais por area, mantendo a ordem de aparicao dos meses.
 * @param {Object[]} linhas - Linhas do CSV mensal.
 * @param {Object[]} anuais - Linhas do CSV de metas anuais.
 * @returns {Object[]} Areas com { nome, meses, metas, realizados, metaAnual }.
 */
function agruparPorArea(linhas, anuais) {
  const mapaAnual = Object.fromEntries(anuais.map((l) => [l.area, Number(l.meta_anual)]));
  const areas = new Map();
  linhas.forEach((linha) => {
    if (!areas.has(linha.area)) {
      areas.set(linha.area, {
        nome: linha.area, meses: [], metas: [], realizados: [], metaAnual: mapaAnual[linha.area] || 0,
      });
    }
    const area = areas.get(linha.area);
    area.meses.push(linha.mes);
    area.metas.push(Number(linha.meta));
    area.realizados.push(Number(linha.realizado));
  });
  return [...areas.values()];
}

/**
 * Soma os valores de uma lista.
 * @param {number[]} valores - Numeros a somar.
 * @returns {number} Soma total.
 */
function somar(valores) {
  return valores.reduce((total, valor) => total + valor, 0);
}

/**
 * Calcula o percentual atingido (realizado / meta acumulados ate o mes atual).
 * @param {number} realizado - Total realizado.
 * @param {number} meta - Total da meta.
 * @returns {number} Percentual (0 se a meta for zero).
 */
function calcularPercentual(realizado, meta) {
  if (!meta) return 0;
  return (realizado / meta) * PERCENTUAL_MAXIMO_BARRA;
}

/**
 * Define a faixa de cor pelo percentual: verde acima de 80, amarelo de 60 a 80, vermelho abaixo de 60.
 * @param {number} percentual - Percentual atingido.
 * @returns {string} Uma das classes CLASSE_VERDE, CLASSE_AMARELO ou CLASSE_VERMELHO.
 */
function classificarFaixa(percentual) {
  if (percentual > LIMITE_VERDE) return CLASSE_VERDE;
  if (percentual >= LIMITE_AMARELO) return CLASSE_AMARELO;
  return CLASSE_VERMELHO;
}

/**
 * Projeta o fechamento do ano por regressao linear simples (minimos quadrados)
 * sobre o realizado mensal: y = a + b * x, com x = indice do mes (0, 1, 2...).
 * Os meses restantes usam a reta (nunca abaixo de zero) e somam-se ao realizado ate agora.
 * Com menos de 2 meses de dados, usa a media do realizado como valor mensal.
 * @param {number[]} realizados - Realizado de cada mes ja fechado.
 * @returns {number} Total projetado para o ano.
 */
function projetarFechamento(realizados) {
  const quantidade = realizados.length;
  const acumulado = somar(realizados);
  const mesesRestantes = MESES_NO_ANO - quantidade;
  if (mesesRestantes <= 0 || quantidade === 0) return acumulado;
  if (quantidade < 2) return acumulado + realizados[0] * mesesRestantes;

  const mediaX = (quantidade - 1) / 2;
  const mediaY = acumulado / quantidade;
  let numerador = 0;
  let denominador = 0;
  realizados.forEach((y, x) => {
    numerador += (x - mediaX) * (y - mediaY);
    denominador += (x - mediaX) ** 2;
  });
  const inclinacao = numerador / denominador;
  const intercepto = mediaY - inclinacao * mediaX;
  let projetado = acumulado;
  for (let x = quantidade; x < MESES_NO_ANO; x += 1) {
    projetado += Math.max(0, intercepto + inclinacao * x);
  }
  return projetado;
}

/**
 * Calcula os indicadores consolidados de uma area.
 * @param {Object} area - Area agrupada.
 * @returns {Object} Area com metaAcumulada, realizadoAcumulado, percentual, faixa e projecao.
 */
function calcularIndicadores(area) {
  const metaAcumulada = somar(area.metas);
  const realizadoAcumulado = somar(area.realizados);
  const percentual = calcularPercentual(realizadoAcumulado, metaAcumulada);
  return {
    ...area,
    metaAcumulada,
    realizadoAcumulado,
    percentual,
    faixa: classificarFaixa(percentual),
    projecao: projetarFechamento(area.realizados),
  };
}

/**
 * Soma uma lista de listas posicao a posicao (ex.: total da empresa por mes).
 * @param {number[][]} listas - Listas de mesmo tamanho.
 * @returns {number[]} Lista com a soma de cada posicao.
 */
function somarPorPosicao(listas) {
  return listas[0].map((_, i) => somar(listas.map((lista) => lista[i])));
}

/**
 * Cria um elemento HTML com classe e texto.
 * @param {string} tag - Nome da tag.
 * @param {string} classe - Classe CSS.
 * @param {string} texto - Texto do elemento.
 * @returns {HTMLElement} Elemento criado.
 */
function criarElemento(tag, classe, texto) {
  const elemento = document.createElement(tag);
  if (classe) elemento.className = classe;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

/**
 * Monta o cartao de KPI de uma area, com barra de progresso colorida.
 * @param {Object} area - Area com indicadores.
 * @returns {HTMLElement} Cartao pronto.
 */
function montarCartaoKpi(area) {
  const cartao = criarElemento('article', 'kpi');
  const valor = criarElemento('div', `kpi__valor cor-${area.faixa}`,
    `${formatadorPercentual.format(area.percentual)}%`);
  const barra = criarElemento('div', 'barra');
  const preenchimento = criarElemento('div', `barra__preenchimento fundo-${area.faixa}`);
  preenchimento.style.width = `${Math.min(area.percentual, PERCENTUAL_MAXIMO_BARRA)}%`;
  barra.appendChild(preenchimento);
  const detalhe = `${formatadorMoeda.format(area.realizadoAcumulado)} de ${formatadorMoeda.format(area.metaAcumulada)}`;
  cartao.append(criarElemento('div', 'kpi__area', area.nome), valor, barra,
    criarElemento('div', 'kpi__detalhe', detalhe));
  return cartao;
}

/**
 * Renderiza os KPIs de todas as areas.
 * @param {Object[]} areas - Areas com indicadores.
 * @returns {void}
 */
function renderizarKpis(areas) {
  const container = document.getElementById('kpis');
  container.replaceChildren(...areas.map(montarCartaoKpi));
}

/**
 * Renderiza a tabela detalhada (meta, realizado, %, status e projecao).
 * @param {Object[]} areas - Areas com indicadores.
 * @returns {void}
 */
function renderizarTabela(areas) {
  const corpo = document.getElementById('corpo-tabela');
  const linhas = areas.map((area) => {
    const linha = document.createElement('tr');
    const status = criarElemento('td', `selo cor-${area.faixa}`, ROTULO_STATUS[area.faixa]);
    linha.append(
      criarElemento('td', '', area.nome),
      criarElemento('td', '', formatadorMoeda.format(area.metaAcumulada)),
      criarElemento('td', '', formatadorMoeda.format(area.realizadoAcumulado)),
      criarElemento('td', `cor-${area.faixa}`, `${formatadorPercentual.format(area.percentual)}%`),
      status,
      criarElemento('td', 'projecao', formatadorMoeda.format(area.projecao)),
    );
    return linha;
  });
  corpo.replaceChildren(...linhas);
}

/**
 * Opcoes de eixos e legenda compartilhadas pelos graficos (tema escuro).
 * @returns {Object} Opcoes do Chart.js.
 */
function opcoesBase() {
  const eixo = { ticks: { color: COR_TEXTO_GRAFICO }, grid: { color: COR_GRADE_GRAFICO } };
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: COR_TEXTO_GRAFICO } } },
    scales: { x: eixo, y: eixo },
  };
}

/**
 * Desenha o grafico de barras agrupadas: realizado x meta por mes (total da empresa).
 * @param {Object[]} areas - Areas com indicadores.
 * @returns {void}
 */
function desenharGraficoBarras(areas) {
  const metas = somarPorPosicao(areas.map((a) => a.metas));
  const realizados = somarPorPosicao(areas.map((a) => a.realizados));
  new Chart(document.getElementById('grafico-barras'), {
    type: 'bar',
    data: {
      labels: areas[0].meses,
      datasets: [
        { label: 'Realizado', data: realizados, backgroundColor: COR_REALIZADO },
        { label: 'Meta', data: metas, backgroundColor: COR_META },
      ],
    },
    options: opcoesBase(),
  });
}

/**
 * Calcula os totais da empresa: meta anual, projecao e diferenca.
 * @param {Object[]} areas - Areas com indicadores.
 * @returns {Object} { metaAnual, projecao, percentual }.
 */
function calcularTotaisEmpresa(areas) {
  const metaAnual = somar(areas.map((a) => a.metaAnual));
  const projecao = somar(areas.map((a) => a.projecao));
  return { metaAnual, projecao, percentual: calcularPercentual(projecao, metaAnual) };
}

/**
 * Renderiza o resumo da projecao (meta anual, projecao de fechamento e % da meta).
 * @param {Object} totais - Totais da empresa.
 * @returns {void}
 */
function renderizarResumoProjecao(totais) {
  const itens = [
    ['Meta anual', formatadorMoeda.format(totais.metaAnual), 'resumo__valor'],
    ['Projeção de fechamento', formatadorMoeda.format(totais.projecao), 'resumo__valor resumo__valor--projecao'],
    ['Projeção vs. meta', `${formatadorPercentual.format(totais.percentual)}%`,
      `resumo__valor cor-${classificarFaixa(totais.percentual)}`],
  ];
  const blocos = itens.map(([rotulo, valor, classe]) => {
    const bloco = criarElemento('div', 'resumo');
    bloco.append(criarElemento('div', 'resumo__rotulo', rotulo), criarElemento('div', classe, valor));
    return bloco;
  });
  document.getElementById('resumo-projecao').replaceChildren(...blocos);
}

/**
 * Desenha o grafico de projecao: projecao de fechamento x meta anual por area.
 * @param {Object[]} areas - Areas com indicadores.
 * @returns {void}
 */
function desenharGraficoProjecao(areas) {
  new Chart(document.getElementById('grafico-projecao'), {
    type: 'bar',
    data: {
      labels: areas.map((a) => a.nome),
      datasets: [
        { label: 'Projeção de fechamento', data: areas.map((a) => a.projecao), backgroundColor: COR_PROJECAO },
        { label: 'Meta anual', data: areas.map((a) => a.metaAnual), backgroundColor: COR_META },
      ],
    },
    options: opcoesBase(),
  });
}

/**
 * Escreve o subtitulo com o periodo coberto pelos dados.
 * @param {Object[]} areas - Areas com indicadores.
 * @returns {void}
 */
function renderizarSubtitulo(areas) {
  const meses = areas[0].meses;
  const texto = `Acumulado de ${meses[0]} a ${meses[meses.length - 1]} · projeção por tendência linear`;
  document.getElementById('subtitulo').textContent = texto;
}

/**
 * Ponto de entrada: carrega os dados embutidos e monta o dashboard.
 * @returns {void}
 */
function iniciar() {
  const linhas = lerCsv(CSV_METAS_MENSAIS);
  const anuais = lerCsv(CSV_METAS_ANUAIS);
  const areas = agruparPorArea(linhas, anuais).map(calcularIndicadores);
  if (!areas.length) return;

  renderizarSubtitulo(areas);
  renderizarKpis(areas);
  renderizarTabela(areas);
  renderizarResumoProjecao(calcularTotaisEmpresa(areas));
  desenharGraficoBarras(areas);
  desenharGraficoProjecao(areas);
}

iniciar();
