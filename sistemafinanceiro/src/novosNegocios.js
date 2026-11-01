// ============================================================================
// GESTÃO DE NOVOS NEGÓCIOS - cards das ideias e modal "Detalhes"
// ============================================================================
import { IDEIAS_NEGOCIOS, AVISO_ESTIMATIVAS } from './ideiasNegocios.js';

const STATUS_ANALISAR = 'ANALISAR';
const STATUS_ANALISADO = 'ANALISADO';

// Análises do CFO: docs/analises/ANALISE-FINANCEIRA-<código da ideia>.md (ex.: IDEIA 01).
// O status só vira ANALISADO quando esse arquivo existe e não está vazio.
const ANALISES_FINANCEIRAS = import.meta.glob('../docs/analises/ANALISE-FINANCEIRA-*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const ROTULOS_CARD = [
  ['tempoAGastar', 'Tempo a gastar'],
  ['valorAGastar', 'Valor a gastar'],
  ['analiseRetorno', 'Análise de retorno'],
  ['tempoRetorno', 'Tempo de retorno'],
];

/**
 * Cria um elemento com classe e texto.
 * @param {string} tag - Nome da tag.
 * @param {string} classe - Classe CSS (pode ser vazia).
 * @param {string} [texto] - Texto do elemento.
 * @returns {HTMLElement} Elemento criado.
 */
function criarElemento(tag, classe, texto = '') {
  const elemento = document.createElement(tag);
  if (classe) elemento.className = classe;
  elemento.textContent = texto;
  return elemento;
}

/**
 * Cria uma lista (<ul>) a partir de textos.
 * @param {string[]} itens - Textos dos itens.
 * @returns {HTMLUListElement} Lista pronta.
 */
function criarLista(itens) {
  const lista = criarElemento('ul', 'ideia-lista');
  itens.forEach(item => lista.append(criarElemento('li', '', item)));
  return lista;
}

/**
 * Lê o markdown da análise financeira de uma ideia.
 * @param {{codigo: string}} ideia - Ideia consultada.
 * @returns {string|null} Texto da análise, ou null se o arquivo não existir ou estiver vazio.
 */
function obterAnaliseFinanceira(ideia) {
  const texto = ANALISES_FINANCEIRAS[`../docs/analises/ANALISE-FINANCEIRA-${ideia.codigo}.md`];
  const temTexto = typeof texto === 'string' && texto.trim() !== '';
  return temTexto ? texto : null;
}

/**
 * Cria o selo de status da ideia (ANALISAR até existir a análise do CFO).
 * @param {{codigo: string}} ideia - Ideia exibida.
 * @returns {HTMLElement} Selo de status.
 */
function criarStatusIdeia(ideia) {
  const analisada = obterAnaliseFinanceira(ideia) !== null;
  const selo = criarElemento('span', 'ideia-status', analisada ? STATUS_ANALISADO : STATUS_ANALISAR);
  selo.dataset.estado = analisada ? 'analisado' : 'analisar';
  return selo;
}

/**
 * Cria o bloco de um dado do card (rótulo + valor).
 * @param {string} rotulo - Nome do dado.
 * @param {string} valor - Valor do dado.
 * @returns {HTMLElement} Bloco do dado.
 */
function criarDadoCard(rotulo, valor) {
  const bloco = criarElemento('div', 'ideia-dado');
  bloco.append(criarElemento('dt', 'ideia-dado-rotulo', rotulo));
  bloco.append(criarElemento('dd', 'ideia-dado-valor', valor));
  return bloco;
}

/**
 * Monta o card de uma ideia.
 * @param {import('./ideiasNegocios.js').IdeiaNegocio} ideia - Ideia exibida.
 * @param {(ideia: object) => void} aoAbrirDetalhes - Chamado ao clicar em Detalhes.
 * @returns {HTMLElement} Card pronto.
 */
function criarCardIdeia(ideia, aoAbrirDetalhes) {
  const card = criarElemento('article', 'ideia-card');
  const topo = criarElemento('div', 'ideia-topo');
  topo.append(criarElemento('span', 'ideia-codigo', ideia.codigo), criarStatusIdeia(ideia));
  card.append(topo);
  card.append(criarElemento('h2', 'ideia-nome', ideia.nome));

  const dados = criarElemento('dl', 'ideia-dados');
  ROTULOS_CARD.forEach(([campo, rotulo]) => dados.append(criarDadoCard(rotulo, ideia[campo])));
  card.append(dados);

  const botao = criarElemento('button', 'btn ideia-detalhes', 'Detalhes');
  botao.type = 'button';
  botao.addEventListener('click', () => aoAbrirDetalhes(ideia));
  card.append(botao);
  return card;
}

/**
 * Monta a tabela dos três cenários.
 * @param {import('./ideiasNegocios.js').Cenario[]} cenarios - Cenários da ideia.
 * @returns {HTMLTableElement} Tabela pronta.
 */
function criarTabelaCenarios(cenarios) {
  const tabela = criarElemento('table', 'ideia-tabela');
  const cabecalho = ['Cenário', 'Receita mensal', 'Custo mensal', 'Lucro mensal', 'Retorno'];
  const linhaCabecalho = criarElemento('tr', '');
  cabecalho.forEach(titulo => linhaCabecalho.append(criarElemento('th', '', titulo)));
  tabela.append(linhaCabecalho);

  cenarios.forEach(c => {
    const linha = criarElemento('tr', '');
    [c.nome, c.receitaMensal, c.custoMensal, c.lucroMensal, c.tempoRetorno]
      .forEach(valor => linha.append(criarElemento('td', '', valor)));
    tabela.append(linha);
  });
  return tabela;
}

/**
 * Cria uma seção do modal (título + conteúdo).
 * @param {string} titulo - Título da seção.
 * @param {HTMLElement[]} conteudo - Elementos da seção.
 * @returns {HTMLElement} Seção pronta.
 */
function criarSecaoModal(titulo, conteudo) {
  const secao = criarElemento('section', 'ideia-secao');
  secao.append(criarElemento('h3', '', titulo));
  secao.append(...conteudo);
  return secao;
}

/**
 * Preenche o modal com todos os detalhes da ideia.
 * @param {HTMLElement} corpo - Elemento que recebe o conteúdo.
 * @param {import('./ideiasNegocios.js').IdeiaNegocio} ideia - Ideia exibida.
 * @returns {void}
 */
function preencherModal(corpo, ideia) {
  const explicacao = ideia.explicacao.map(texto => criarElemento('p', '', texto));
  const analise = obterAnaliseFinanceira(ideia);
  const secaoAnalise = analise
    ? [criarSecaoModal('Análise financeira (CFO)', [criarElemento('pre', 'ideia-analise', analise)])]
    : [];
  corpo.replaceChildren(
    criarSecaoModal('Sobre a ideia', explicacao),
    ...secaoAnalise,
    criarSecaoModal('Cenários', [criarTabelaCenarios(ideia.cenarios)]),
    criarSecaoModal('Premissas', [criarLista(ideia.premissas)]),
    criarSecaoModal('Riscos', [criarLista(ideia.riscos)]),
    criarSecaoModal('Próximos passos', [criarLista(ideia.proximosPassos)]),
    criarElemento('p', 'ideia-aviso', AVISO_ESTIMATIVAS),
  );
}

/**
 * Abre o modal (<dialog>) com os detalhes de uma ideia.
 * @param {HTMLDialogElement} modal - Elemento do modal.
 * @param {import('./ideiasNegocios.js').IdeiaNegocio} ideia - Ideia exibida.
 * @returns {void}
 */
function abrirModal(modal, ideia) {
  modal.querySelector('#ideia-modal-titulo').textContent = `${ideia.codigo} — ${ideia.nome}`;
  preencherModal(modal.querySelector('#ideia-modal-corpo'), ideia);
  modal.showModal();
}

/**
 * Liga o fechamento do modal: botão Fechar e clique no fundo.
 * @param {HTMLDialogElement} modal - Elemento do modal.
 * @returns {void}
 */
function ligarFechamento(modal) {
  modal.querySelector('#ideia-modal-fechar').addEventListener('click', () => modal.close());
  modal.addEventListener('click', evento => {
    if (evento.target === modal) modal.close();
  });
}

/**
 * Inicializa a página: desenha os cards e liga o modal.
 * @returns {void}
 */
function iniciar() {
  const area = document.getElementById('ideias-cards');
  const modal = document.getElementById('ideia-modal');
  if (!area || !modal) return;

  ligarFechamento(modal);
  const aoAbrir = ideia => abrirModal(modal, ideia);
  area.replaceChildren(...IDEIAS_NEGOCIOS.map(ideia => criarCardIdeia(ideia, aoAbrir)));
}

iniciar();
