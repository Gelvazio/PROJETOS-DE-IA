// ============================================================================
// CÁLCULOS DA PREVIDÊNCIA - modal com formulário e resultado da simulação
// ============================================================================
import { PARAMETROS_PADRAO, calcularSimulacao } from './simuladorPrevidencia.js';
import { criarElemento } from './elementosUi.js';

const RECEBIMENTO_MINIMO_ANOS = 6;
const CAMPO_SALARIO = 'salario';

const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatarMoeda = valor => formatadorMoeda.format(valor);
const formatarPercentual = valor => `${(valor * 100).toLocaleString('pt-BR')}%`;

// Cada grupo do resultado: título e linhas [rótulo, chave do resultado, formatador]
const GRUPOS_RESULTADO = [
  { titulo: 'Contribuições', linhas: [
    ['Sua contribuição por mês', 'contribuicaoMensal', formatarMoeda],
    ['Contrapartida da empresa por mês', 'contrapartidaMensal', formatarMoeda],
    ['Total que você contribui', 'meusAportes', formatarMoeda],
    ['Total que a empresa contribui', 'aportesEmpresa', formatarMoeda],
    ['Total de contribuições (você + empresa)', 'totalContribuicoes', formatarMoeda],
  ] },
  { titulo: 'Saldo ao se aposentar', linhas: [
    ['Saldo projetado', 'saldo', formatarMoeda],
    ['Saldo após IR (tabela regressiva, estimativa)', 'saldoLiquido', formatarMoeda],
    ['Alíquota regressiva usada', 'aliquotaResgate', formatarPercentual],
    ['Ganho por ter a contrapartida da empresa', 'ganhoContrapartida', formatarMoeda],
  ] },
  { titulo: 'Quanto você recebe por mês (por benefício)', linhas: [
    ['Renda por prazo determinado (bruta)', 'rendaPrazo', formatarMoeda],
    ['Renda por prazo determinado (após IR)', 'rendaPrazoLiquida', formatarMoeda],
    ['Total recebido nesse prazo (bruto)', 'totalRecebidoPrazo', formatarMoeda],
    ['Renda por percentual do saldo (bruta)', 'rendaPct', formatarMoeda],
    ['Renda por percentual do saldo (após IR)', 'rendaPctLiquida', formatarMoeda],
  ] },
  { titulo: 'Imposto de Renda na contribuição', linhas: [
    ['Economia de IR por ano', 'economiaIrAno', formatarMoeda],
    ['Economia de IR no período', 'economiaIrTotal', formatarMoeda],
    ['Custo real para você (contribuição − economia)', 'custoReal', formatarMoeda],
  ] },
];

/**
 * Converte um texto digitado em número (aceita "6.700,50", "6700,5" e "6700.5").
 * @param {string} texto - Texto digitado.
 * @returns {number} Número lido, ou 0 se inválido.
 */
export function analisarNumero(texto) {
  const limpo = String(texto).replace(/[R$\s%]/g, '');
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? Math.max(numero, 0) : 0;
}

/**
 * Lê os campos do formulário e monta a entrada da simulação.
 * @param {HTMLFormElement} formulario - Formulário do modal.
 * @returns {typeof PARAMETROS_PADRAO} Valores informados.
 */
function lerEntrada(formulario) {
  const entrada = { ...PARAMETROS_PADRAO };
  formulario.querySelectorAll('[data-campo]').forEach(campo => {
    entrada[campo.dataset.campo] =
      campo.type === 'checkbox' ? campo.checked : analisarNumero(campo.value);
  });
  entrada.anos = Math.max(entrada.anos, 1);
  entrada.recebimentoAnos = Math.max(entrada.recebimentoAnos, RECEBIMENTO_MINIMO_ANOS);
  return entrada;
}

/**
 * Monta o bloco HTML de um grupo de resultados.
 * @param {{titulo: string, linhas: Array}} grupo - Grupo do resultado.
 * @param {object} resultado - Resultado da simulação.
 * @returns {HTMLElement} Bloco do grupo.
 */
function criarGrupoResultado(grupo, resultado) {
  const secao = criarElemento('section', 'ideia-secao');
  secao.append(criarElemento('h3', '', grupo.titulo));
  const lista = criarElemento('dl', 'calculos-lista');
  grupo.linhas.forEach(([rotulo, chave, formatar]) => {
    const linha = criarElemento('div', 'calculos-linha');
    linha.append(criarElemento('dt', '', rotulo), criarElemento('dd', '', formatar(resultado[chave])));
    lista.append(linha);
  });
  secao.append(lista);
  return secao;
}

/**
 * Calcula e mostra o resultado no modal.
 * @param {HTMLFormElement} formulario - Formulário do modal.
 * @param {HTMLElement} destino - Elemento que recebe o resultado.
 * @returns {void}
 */
function atualizarResultado(formulario, destino) {
  const entrada = lerEntrada(formulario);
  if (entrada.salario <= 0) {
    destino.replaceChildren(criarElemento('p', 'ideia-aviso', 'Informe o salário para calcular.'));
    return;
  }
  const resultado = calcularSimulacao(entrada);
  destino.replaceChildren(...GRUPOS_RESULTADO.map(grupo => criarGrupoResultado(grupo, resultado)));
}

/**
 * Preenche o formulário com os valores iniciais (salário 6.700).
 * @param {HTMLFormElement} formulario - Formulário do modal.
 * @returns {void}
 */
function preencherValoresIniciais(formulario) {
  formulario.querySelectorAll('[data-campo]').forEach(campo => {
    const valor = PARAMETROS_PADRAO[campo.dataset.campo];
    if (campo.type === 'checkbox') campo.checked = valor;
    else campo.value = String(valor).replace('.', ',');
  });
}

/**
 * Liga o modal de cálculos: valores iniciais, recálculo a cada mudança e abertura.
 * @param {HTMLDialogElement} modal - Elemento do modal de cálculos.
 * @returns {() => void} Função que abre o modal já calculado, com o salário selecionado.
 */
export function prepararModalCalculos(modal) {
  const formulario = modal.querySelector('#calculos-formulario');
  const destino = modal.querySelector('#calculos-resultado');
  preencherValoresIniciais(formulario);

  const recalcular = () => atualizarResultado(formulario, destino);
  formulario.addEventListener('input', recalcular);
  formulario.addEventListener('submit', evento => evento.preventDefault());

  return () => {
    recalcular();
    modal.showModal();
    const campoSalario = formulario.querySelector(`[data-campo="${CAMPO_SALARIO}"]`);
    campoSalario.focus();
    campoSalario.select();
  };
}
