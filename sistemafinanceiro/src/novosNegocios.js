// ============================================================================
// GESTÃO DE NOVOS NEGÓCIOS - cards das ideias e modal "Detalhes"
// ============================================================================
import { IDEIAS_NEGOCIOS, AVISO_ESTIMATIVAS } from './ideiasNegocios.js';
import { criarElemento, criarLista, criarSecaoModal, ligarFechamentoModal } from './elementosUi.js';
import { obterAnaliseFinanceira, criarSeloStatus } from './analisesFinanceiras.js';

const ROTULOS_CARD = [
  ['tempoAGastar', 'Tempo a gastar'],
  ['valorAGastar', 'Valor a gastar'],
  ['analiseRetorno', 'Análise de retorno'],
  ['tempoRetorno', 'Tempo de retorno'],
];

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
  topo.append(criarElemento('span', 'ideia-codigo', ideia.codigo), criarSeloStatus(ideia.codigo));
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
 * Preenche o modal com todos os detalhes da ideia.
 * @param {HTMLElement} corpo - Elemento que recebe o conteúdo.
 * @param {import('./ideiasNegocios.js').IdeiaNegocio} ideia - Ideia exibida.
 * @returns {void}
 */
function preencherModal(corpo, ideia) {
  const explicacao = ideia.explicacao.map(texto => criarElemento('p', '', texto));
  const analise = obterAnaliseFinanceira(ideia.codigo);
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
 * Inicializa a página: desenha os cards e liga o modal.
 * @returns {void}
 */
function iniciar() {
  const area = document.getElementById('ideias-cards');
  const modal = document.getElementById('ideia-modal');
  if (!area || !modal) return;

  ligarFechamentoModal(modal);
  const aoAbrir = ideia => abrirModal(modal, ideia);
  area.replaceChildren(...IDEIAS_NEGOCIOS.map(ideia => criarCardIdeia(ideia, aoAbrir)));
}

iniciar();
