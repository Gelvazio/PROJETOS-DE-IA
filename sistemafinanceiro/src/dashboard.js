// ============================================================================
// DASHBOARD - card Previdência Privada FIESC e modal "Detalhes"
// ============================================================================
import { PREVIDENCIA_FIESC, CHAVE_ANALISE_PREVIDENCIA } from './previdenciaFiesc.js';
import {
  criarElemento,
  criarLista,
  criarSecaoModal,
  ligarFechamentoModal,
} from './elementosUi.js';
import { prepararModalCalculos } from './calculosPrevidencia.js';
import { obterAnaliseFinanceira, criarSeloStatus } from './analisesFinanceiras.js';

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
 * Cria um botão de ação do card.
 * @param {string} texto - Texto do botão.
 * @param {() => void} aoClicar - Chamado ao clicar.
 * @returns {HTMLButtonElement} Botão pronto.
 */
function criarBotaoAcao(texto, aoClicar) {
  const botao = criarElemento('button', 'btn ideia-detalhes', texto);
  botao.type = 'button';
  botao.addEventListener('click', aoClicar);
  return botao;
}

/**
 * Monta o card da Previdência Privada FIESC.
 * @param {() => void} aoAbrirDetalhes - Chamado ao clicar em Detalhes.
 * @param {() => void} aoAbrirCalculos - Chamado ao clicar em Cálculos.
 * @returns {HTMLElement} Card pronto.
 */
function criarCardPrevidencia(aoAbrirDetalhes, aoAbrirCalculos) {
  const card = criarElemento('article', 'dashboard-card');
  const topo = criarElemento('div', 'ideia-topo');
  topo.append(
    criarElemento('h2', 'dashboard-card-titulo', PREVIDENCIA_FIESC.nome),
    criarSeloStatus(CHAVE_ANALISE_PREVIDENCIA),
  );
  card.append(topo);

  const dados = criarElemento('dl', 'ideia-dados');
  PREVIDENCIA_FIESC.resumoCard.forEach(([rotulo, valor]) => dados.append(criarDadoCard(rotulo, valor)));
  card.append(dados);

  const acoes = criarElemento('div', 'dashboard-card-acoes');
  acoes.append(
    criarBotaoAcao('Cálculos', aoAbrirCalculos),
    criarBotaoAcao('Detalhes', aoAbrirDetalhes),
  );
  card.append(acoes);
  return card;
}

/**
 * Preenche o modal com os dados do plano, a análise (se existir) e as perguntas.
 * @param {HTMLElement} corpo - Elemento que recebe o conteúdo.
 * @returns {void}
 */
function preencherModal(corpo) {
  const analise = obterAnaliseFinanceira(CHAVE_ANALISE_PREVIDENCIA);
  const secaoAnalise = analise
    ? [criarSecaoModal('Análise financeira (CFO)', [criarElemento('pre', 'ideia-analise', analise)])]
    : [];
  const secoesPlano = PREVIDENCIA_FIESC.secoes.map(secao =>
    criarSecaoModal(secao.titulo, [criarLista(secao.itens)]));

  corpo.replaceChildren(
    ...secaoAnalise,
    ...secoesPlano,
    criarSecaoModal('Dados a informar para a análise', [criarLista(PREVIDENCIA_FIESC.dadosAInformar)]),
    criarSecaoModal('O que a análise precisa responder', [criarLista(PREVIDENCIA_FIESC.perguntasDaAnalise)]),
    criarElemento('p', 'ideia-aviso', 'Fontes: Regulamento do FIESCprev e Cartilha do Participante 2025. [CONFIRMAR] = dado que nenhum dos dois traz (fica no Plano de Custeio).'),
  );
}

/**
 * Abre o modal (<dialog>) com os detalhes do plano.
 * @param {HTMLDialogElement} modal - Elemento do modal.
 * @returns {void}
 */
function abrirModal(modal) {
  modal.querySelector('#ideia-modal-titulo').textContent = PREVIDENCIA_FIESC.nome;
  preencherModal(modal.querySelector('#ideia-modal-corpo'));
  modal.showModal();
}

/**
 * Inicializa a página: desenha o card e liga o modal.
 * @returns {void}
 */
function iniciar() {
  const area = document.getElementById('dashboard-cards');
  const modal = document.getElementById('ideia-modal');
  const modalCalculos = document.getElementById('calculos-modal');
  if (!area || !modal || !modalCalculos) return;

  ligarFechamentoModal(modal);
  ligarFechamentoModal(modalCalculos);
  const abrirCalculos = prepararModalCalculos(modalCalculos);
  area.replaceChildren(criarCardPrevidencia(() => abrirModal(modal), abrirCalculos));
}

iniciar();
