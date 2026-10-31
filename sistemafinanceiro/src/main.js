// ── PWA / celular ─────────────────────────────────────────────────────
import {
  isStandalone,
  isIosSafari,
  onInstallAvailabilityChange,
  promptInstall
} from './pwa.js';
import './modal-nav.js';

// ── Supabase imports ──────────────────────────────────────────────────
import {
  supabase,
  getSession,
  getCurrentUser,
  onAuthStateChange,
  logout as supabaseLogout,
  isNetworkError,
  getLancamentos,
  createLancamento,
  createRecorrencia,
  updateLancamento,
  deleteLancamento,
  deleteLancamentos,
  getLojas,
  getRecorrencias,
  efetivarRecorrencia,
  updateRecorrencia,
  encerrarRecorrencia
} from './supabaseClient.js';
import { calcularOcorrenciasDoMes, calcularDataVencimento } from './recorrencia.js';

import { carregarFiltros, salvarFiltros, limparFiltros } from './filtrosSalvos.js';

// ── Auth guard ────────────────────────────────────────────────────────
/** Descarta a sessão local inválida (evita loop login ↔ dashboard) e volta ao login. */
async function voltarAoLogin() {
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    // sessão já inválida; o redirecionamento abaixo resolve
  }
  window.location.replace('/login.html');
}

const session = await getSession();
if (!session) {
  await voltarAoLogin();
}

let _currentUser = null;
try {
  _currentUser = await getCurrentUser();
} catch (err) {
  console.warn('Sessão inválida:', err.message);
  // Sem rede não dá para validar o token: mantém a sessão salva em vez de deslogar
  if (isNetworkError(err)) _currentUser = session?.user ?? null;
}
if (!_currentUser) {
  await voltarAoLogin();
}

// Observar mudanças de autenticação
// O wrapper de supabaseClient.js entrega só a sessão (sem o nome do evento)
onAuthStateChange(newSession => {
  if (!newSession) {
    window.location.replace('/login.html');
  }
});

// ─────────────────────────────────────────────────────────────────────
let allLojas = [];

// Declarada antes de getCurrentMonth() ser chamada na inicialização (evita zona morta do const)
const DIA_VIRADA_DO_MES = 25;

let allLancamentos = [];
let todasRecorrencias = [];
let recorrenciaEmEdicao = null;
const filtrosIniciais = carregarFiltros();
let selectedMonth = filtrosIniciais.mes || getCurrentMonth();
let filtroTipo = filtrosIniciais.tipo;
let filtroStatus = filtrosIniciais.status;
let _editScope = 'single';

/**
 * Mês exibido ao abrir a tela quando não há mês salvo: o mês civil em America/Sao_Paulo
 * (não depende do fuso do browser); depois do dia 25 avança para o mês seguinte.
 * @returns {string} Mês no formato 'AAAA-MM'.
 */
function getCurrentMonth() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const valorDe = tipo => Number(parts.find(p => p.type === tipo).value);
  const virouMes = valorDe('day') > DIA_VIRADA_DO_MES;
  const data = new Date(valorDe('year'), valorDe('month') - 1 + (virouMes ? 1 : 0), 1);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
}

function getTodaySaoPaulo() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()); // YYYY-MM-DD
}

function defaultVencimentoForMonth() {
  const today = getTodaySaoPaulo();
  if (today.startsWith(selectedMonth)) return today;
  return `${selectedMonth}-01`;
}

// ── Data ──────────────────────────────────────────────────────────────
let _lastLoad = 0;   // timestamp do último carregamento bem-sucedido
let _loading = false;

/** Erro de carga visível na tabela (desktop) E na lista de cards (celular). */
function renderLoadError(err) {
  const msg = esc(err?.message || 'erro desconhecido');
  document.getElementById('table-body').innerHTML =
    `<tr><td colspan="8" class="table-empty" style="color:var(--warn-red)">
      ⚠ Erro ao carregar lançamentos:<br>
      <code style="font-size:12px;color:var(--h3)">${msg}</code>
    </td></tr>`;
  const mobile = document.getElementById('mobile-list');
  if (mobile) {
    mobile.innerHTML =
      `<div class="table-empty load-error" style="color:var(--warn-red)">
        ⚠ Erro ao carregar lançamentos:
        <code>${msg}</code>
        <button type="button" class="btn btn-ghost" data-action="recarregar">Tentar de novo</button>
      </div>`;
  }
}

/**
 * Lê as recorrências (lançamentos fixos). Falha não quebra a tela.
 * @returns {Promise<Array<object>>} Recorrências, ou lista vazia se a leitura falhar.
 */
async function carregarRecorrenciasSeguro() {
  try {
    return (await getRecorrencias()) ?? [];
  } catch (err) {
    console.error('Erro ao carregar recorrências:', err);
    return [];
  }
}

/**
 * silent: mantém a lista atual na tela se falhar (só avisa por toast).
 * notify: confirma por toast quando atualizar.
 */
async function loadData({ silent = false, notify = false } = {}) {
  if (_loading) return;
  _loading = true;
  const btn = document.getElementById('btn-refresh');
  if (btn) { btn.disabled = true; btn.classList.add('spinning'); }
  try {
    const [lancamentos, lojas, recorrencias] = await Promise.all([
      getLancamentos(),
      getLojas(),
      carregarRecorrenciasSeguro()
    ]);
    allLancamentos = lancamentos;
    allLojas = lojas;
    todasRecorrencias = recorrencias;
    _lastLoad = Date.now();
    render();
    if (notify) showToast('✓ Dados atualizados');
  } catch (err) {
    console.error('Erro ao carregar dados:', err);
    if (silent && _lastLoad) showToast('Não foi possível atualizar os dados.', true);
    else renderLoadError(err);
  } finally {
    _loading = false;
    if (btn) { btn.disabled = false; btn.classList.remove('spinning'); }
  }
}

async function patchLancamento(id) {
  const today = new Date().toISOString().split('T')[0];
  const updated = await updateLancamento(id, { status: 1, data_pagamento: today });
  if (!updated) throw new Error('Falha ao atualizar');
  return updated;
}

// ── Filters ───────────────────────────────────────────────────────────
/**
 * Lançamentos reais do mês misturados às ocorrências fixas virtuais (só em memória),
 * ordenados por data de vencimento. Reutilizável por quem calcula totais.
 * @param {string} competencia - Mês no formato 'AAAA-MM'.
 * @returns {Array<object>} Lista do mês, sem filtros de tipo/status.
 */
function obterLancamentosDoMes(competencia) {
  const reais = allLancamentos.filter(l => l.data_vencimento.startsWith(competencia));
  const virtuais = calcularOcorrenciasDoMes(competencia, todasRecorrencias, allLancamentos);
  return [...reais, ...virtuais].sort((a, b) =>
    a.data_vencimento.localeCompare(b.data_vencimento)
  );
}

/**
 * Lançamentos do mês selecionado (reais + fixas virtuais), base dos cards de totais.
 * @returns {Array<object>} Lista do mês sem filtros de tipo/status.
 */
function getMonthData() {
  return obterLancamentosDoMes(selectedMonth);
}

function getFilteredData() {
  return obterLancamentosDoMes(selectedMonth).filter(l => {
    const okTipo   = filtroTipo === 'todos' || l.tipo === filtroTipo;
    const okStatus = filtroStatus === 'todos' || String(l.status) === filtroStatus;
    return okTipo && okStatus;
  });
}

// ── Format helpers ────────────────────────────────────────────────────
function fmt$(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function fmtDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function addMonths(dateStr, months) {
  if (!months) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  const target  = new Date(y, m - 1 + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  const day     = Math.min(d, lastDay);
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ── Installment group helpers ─────────────────────────────────────────
function findInstallmentGroup(lancamento) {
  if (lancamento.id_parcelamento) {
    return allLancamentos.filter(l => l.id_parcelamento === lancamento.id_parcelamento);
  }
  // Fallback for records created before id_parcelamento field
  if (lancamento.grupo_id) {
    return allLancamentos.filter(l => l.grupo_id === lancamento.grupo_id);
  }
  return allLancamentos.filter(l =>
    l.descricao    === lancamento.descricao &&
    l.tipo         === lancamento.tipo &&
    l.qtd_parcelas === lancamento.qtd_parcelas
  );
}

function getRecordsForScope(lancamento, scope) {
  const group = findInstallmentGroup(lancamento);
  if (scope === 'single') return [lancamento];
  if (scope === 'future') return group.filter(l => l.parcela_atual >= lancamento.parcela_atual);
  return group;
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Render ────────────────────────────────────────────────────────────
function formatMonthLabel(ym) {
  const [y, m] = ym.split('-');
  const label = new Date(+y, +m - 1, 1)
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function renderMonthLabel() {
  const label = formatMonthLabel(selectedMonth);
  const nav = document.getElementById('month-label');
  if (nav) nav.textContent = label;
  const display = document.getElementById('month-display');
  if (display) display.textContent = label;
  const picker = document.getElementById('month-picker');
  if (picker && picker.value !== selectedMonth) picker.value = selectedMonth;
}

function renderCards() {
  const data = getMonthData();

  const recList = data.filter(l => l.tipo === 'receber' && l.status !== 3);
  const pagList = data.filter(l => l.tipo === 'pagar'   && l.status !== 3);

  const totalRec = recList.reduce((s, l) => s + l.valor, 0);
  const totalPag = pagList.reduce((s, l) => s + l.valor, 0);
  const saldo    = totalRec - totalPag;

  document.getElementById('card-receber').textContent = fmt$(totalRec);
  document.getElementById('card-pagar').textContent   = fmt$(totalPag);

  const saldoEl = document.getElementById('card-saldo');
  saldoEl.textContent = fmt$(saldo);
  saldoEl.className = 'summary-card-value ' + (saldo >= 0 ? 'positive' : 'negative');

  // Despesa pendente: contas a pagar do mês ainda em Aberto
  const despesasAbertas = pagList.filter(l => l.status === 0);
  const totalDespesaPendente = despesasAbertas.reduce((s, l) => s + l.valor, 0);
  document.getElementById('card-pendente').textContent = fmt$(totalDespesaPendente);
  document.getElementById('card-pendente-sub').textContent =
    `${despesasAbertas.length} despesa${despesasAbertas.length !== 1 ? 's' : ''} a pagar`;

  // Receita pendente: contas a receber do mês ainda em Aberto
  const receitasAbertas = recList.filter(l => l.status === 0);
  const totalReceitaPendente = receitasAbertas.reduce((s, l) => s + l.valor, 0);
  document.getElementById('card-receita-pendente').textContent = fmt$(totalReceitaPendente);
  document.getElementById('card-receita-pendente-sub').textContent =
    `${receitasAbertas.length} receita${receitasAbertas.length !== 1 ? 's' : ''} a receber`;

  // Saldo Mensal: Receita - Despesa do mês
  const saldoMensalEl = document.getElementById('card-saldo-mensal');
  saldoMensalEl.textContent = fmt$(saldo);
  saldoMensalEl.className = 'summary-card-value ' + (saldo >= 0 ? 'positive' : 'negative');

  const recebidos = recList.filter(l => l.status === 1).length;
  const pagos     = pagList.filter(l => l.status === 1).length;

  document.getElementById('card-receber-sub').textContent =
    `${recebidos} de ${recList.length} recebido${recList.length !== 1 ? 's' : ''}`;
  document.getElementById('card-pagar-sub').textContent =
    `${pagos} de ${pagList.length} pago${pagList.length !== 1 ? 's' : ''}`;
  document.getElementById('card-saldo-sub').textContent =
    saldo >= 0 ? 'Saldo positivo ✓' : 'Saldo negativo ✗';
}

const STATUS_LABEL = { 0: 'Aberto', 1: 'Pago', 3: 'Cancelado' };

/**
 * Descrição da linha: selo "Fixa" para ocorrência virtual, "#ID" para lançamento real.
 * @param {object} l - Lançamento real ou ocorrência virtual.
 * @returns {string} HTML da descrição.
 */
function descricaoHtml(l) {
  if (l.virtual) return `<span class="selo-fixa">Fixa</span> ${esc(l.descricao)}`;
  return `<strong>#${l.id}</strong> ${esc(l.descricao)}`;
}

/**
 * Texto da parcela; ocorrência virtual não tem parcela.
 * @param {object} l - Lançamento real ou ocorrência virtual.
 * @returns {string} Parcela no formato X/Y ou "—".
 */
function parcelaTexto(l) {
  if (l.virtual) return '—';
  return `${l.parcela_atual}/${l.qtd_parcelas}`;
}

/**
 * Ações da linha. Virtual: só o botão de efetivar (Pagar/Receber) do mês.
 * @param {object} l - Lançamento real ou ocorrência virtual.
 * @returns {string} HTML das ações.
 */
function acoesHtml(l) {
  if (!l.virtual) return actionButtonsHtml(l);
  const rotulo = l.tipo === 'pagar' ? 'Pagar' : 'Receber';
  const classe = l.tipo === 'pagar' ? 'btn-pagar' : 'btn-receber';
  return `<button class="btn-action ${classe}" data-action="efetivar"
    data-recorrencia-id="${esc(l.recorrencia_id)}"
    data-competencia="${esc(l.competencia)}">${rotulo}</button>
    <button class="btn-action btn-editar" data-action="editar-fixa"
    data-recorrencia-id="${esc(l.recorrencia_id)}"
    data-competencia="${esc(l.competencia)}">Editar</button>
    <button class="btn-action btn-cancelar" data-action="encerrar-fixa"
    data-recorrencia-id="${esc(l.recorrencia_id)}"
    data-competencia="${esc(l.competencia)}">Parar de repetir</button>`;
}

function actionButtonsHtml(l) {
  const isAberto = l.status === 0;
  const btnLabel = l.tipo === 'pagar' ? 'Pagar' : 'Receber';
  const btnCls = l.tipo === 'pagar' ? 'btn-pagar' : 'btn-receber';
  const disabled = isAberto ? '' : 'disabled';
  const disabledEditCancel = (l.status === 1 || l.status === 3) ? 'disabled' : '';
  return `
    <button class="btn-action ${btnCls}" data-id="${l.id}" data-action="${l.tipo}" ${disabled}>${btnLabel}</button>
    <button class="btn-action btn-cancelar" data-id="${l.id}" data-action="cancelar" ${disabledEditCancel}>Cancelar</button>
    <button class="btn-action btn-editar" data-id="${l.id}" data-action="editar" ${disabledEditCancel}>Editar</button>
    <button class="btn-action btn-excluir" data-id="${l.id}" data-action="excluir">Excluir</button>`;
}

function renderTable() {
  const data = getFilteredData();
  const tbody = document.getElementById('table-body');
  const mobile = document.getElementById('mobile-list');

  if (data.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="table-empty">Nenhum lançamento encontrado.</td></tr>';
    if (mobile) {
      mobile.innerHTML =
        '<p class="table-empty" style="margin:0;padding:28px 12px;text-align:center">Nenhum lançamento encontrado.</p>';
    }
    return;
  }

  tbody.innerHTML = data.map(l => `
      <tr class="row-s${l.status}">
        <td class="col-desc">${descricaoHtml(l)}</td>
        <td><span class="tbadge tbadge-${l.tipo}">${l.tipo === 'pagar' ? 'Pagar' : 'Receber'}</span></td>
        <td class="col-date">${fmtDate(l.data_vencimento)}</td>
        <td class="col-date">${fmtDate(l.data_pagamento)}</td>
        <td class="col-parc">${parcelaTexto(l)}</td>
        <td class="col-valor">${fmt$(l.valor)}</td>
        <td><span class="sbadge sbadge-${l.status}">${STATUS_LABEL[l.status] ?? '—'}</span></td>
        <td>
          <div class="action-cell">
            ${acoesHtml(l)}
          </div>
        </td>
      </tr>`).join('');

  if (mobile) {
    mobile.innerHTML = data.map(l => `
      <article class="lanc-card row-s${l.status}">
        <div class="lanc-card-top">
          <div class="lanc-card-desc">${descricaoHtml(l)}</div>
          <div class="lanc-card-valor">${fmt$(l.valor)}</div>
        </div>
        <div class="lanc-card-meta">
          <span class="tbadge tbadge-${l.tipo}">${l.tipo === 'pagar' ? 'Pagar' : 'Receber'}</span>
          <span class="sbadge sbadge-${l.status}">${STATUS_LABEL[l.status] ?? '—'}</span>
          <span>Venc. ${fmtDate(l.data_vencimento)}</span>
          <span>Pag. ${fmtDate(l.data_pagamento)}</span>
          <span>Parc. ${parcelaTexto(l)}</span>
        </div>
        <div class="lanc-card-actions">
          ${acoesHtml(l)}
        </div>
      </article>`).join('');
  }
}

function render() {
  renderMonthLabel();
  renderCards();
  renderTable();
}

// ── Toast ─────────────────────────────────────────────────────────────
function showToast(msg, isError = false) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.display = 'block';
  el.style.borderColor = isError
    ? 'rgba(255,91,110,0.5)'
    : 'rgba(52,224,215,0.38)';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.display = 'none'; }, 3000);
}

// ── Efetivar fixa do mês ──────────────────────────────────────────────
/**
 * Data local de hoje (sem UTC) no formato AAAA-MM-DD.
 * @returns {string} Data de hoje.
 */
function obterHojeLocal() {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

/**
 * Monta o HTML dos campos (valor e data de pagamento) do modal de efetivação.
 * @param {object} ocorrencia - Ocorrência virtual.
 * @returns {string} HTML dos campos.
 */
function camposEfetivarHtml(ocorrencia) {
  return `<strong>${esc(ocorrencia.descricao)}</strong>
    <div class="efetivar-campos">
      <label for="efetivar-valor">Valor</label>
      <input type="number" id="efetivar-valor" step="0.01" min="0.01"
        value="${esc(String(ocorrencia.valor))}">
      <label for="efetivar-data">Data de pagamento</label>
      <input type="date" id="efetivar-data" value="${obterHojeLocal()}">
    </div>`;
}

/**
 * Efetiva a fixa do mês: confirma valor/data, cria o lançamento Pago e recarrega.
 * Não altera nenhum lançamento já existente.
 * @param {HTMLElement} btn - Botão clicado (com data-recorrencia-id e data-competencia).
 * @returns {Promise<void>}
 */
async function handleEfetivar(btn) {
  const { recorrenciaId, competencia } = btn.dataset;
  const ocorrencia = obterLancamentosDoMes(selectedMonth).find(
    l => l.virtual && String(l.recorrencia_id) === recorrenciaId && l.competencia === competencia
  );
  if (!ocorrencia) return;

  const ehPagar = ocorrencia.tipo === 'pagar';
  const ok = await confirmModal({
    icon: ehPagar ? '💰' : '📥',
    title: ehPagar ? 'Confirmar Pagamento' : 'Confirmar Recebimento',
    msg: camposEfetivarHtml(ocorrencia),
    color: ehPagar ? 'var(--warn-green)' : 'var(--h2)'
  });
  if (!ok) return;

  const valor = Number(document.getElementById('efetivar-valor').value);
  const dataPagamento = document.getElementById('efetivar-data').value;
  try {
    await efetivarRecorrencia(ocorrencia, { valor, dataPagamento });
    allLancamentos = await getLancamentos();
    render();
    showToast(ehPagar ? '✓ Pagamento registrado!' : '✓ Recebimento registrado!');
  } catch (err) {
    showToast(err?.message || 'Erro ao efetivar o lançamento.', true);
  }
}

// ── Parar de repetir fixa ─────────────────────────────────────────────
const DIA_MAXIMO_DO_MES = 31;

/**
 * Último dia do mês anterior à competência, sem UTC.
 * @param {string} competencia - Competência 'AAAA-MM'.
 * @returns {string} Data 'AAAA-MM-DD'.
 */
function obterUltimoDiaMesAnterior(competencia) {
  const [ano, mes] = competencia.split('-').map(Number);
  const anoAnterior = mes === 1 ? ano - 1 : ano;
  const mesAnterior = mes === 1 ? 12 : mes - 1;
  const competenciaAnterior = `${anoAnterior}-${String(mesAnterior).padStart(2, '0')}`;
  return calcularDataVencimento(competenciaAnterior, DIA_MAXIMO_DO_MES);
}

/**
 * Encerra a fixa a partir do mês clicado; lançamentos já efetivados não são alterados.
 * Se o mês clicado é o primeiro da fixa, desativa a recorrência por inteiro.
 * @param {HTMLElement} btn - Botão com data-recorrencia-id e data-competencia.
 * @returns {Promise<void>}
 */
async function handleEncerrarFixa(btn) {
  const { recorrenciaId, competencia } = btn.dataset;
  const recorrencia = todasRecorrencias.find(r => String(r.id) === recorrenciaId);
  if (!recorrencia) return;

  const ok = await confirmModal({
    icon: '⏹️',
    title: 'Parar de repetir',
    msg: `<strong>${esc(recorrencia.descricao)}</strong><br>A fixa deixa de aparecer a partir
      deste mês (${esc(competencia)}). Meses já efetivados são mantidos.`,
    color: 'var(--h3)'
  });
  if (!ok) return;

  const dataFim = obterUltimoDiaMesAnterior(competencia);
  const ehPrimeiroMes = dataFim < recorrencia.data_inicio;
  try {
    if (ehPrimeiroMes) await updateRecorrencia(recorrencia.id, { ativo: 0 });
    else await encerrarRecorrencia(recorrencia.id, dataFim);
    todasRecorrencias = await carregarRecorrenciasSeguro();
    render();
    showToast('✓ Fixa encerrada.');
  } catch (err) {
    showToast(err?.message || 'Erro ao encerrar a fixa.', true);
  }
}

// ── Event: table action (delegated) ──────────────────────────────────
async function handleLancamentoAction(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn || btn.disabled) return;

  const id     = Number(btn.dataset.id);
  const action = btn.dataset.action;

  if (action === 'recarregar') { loadData(); return; }
  if (action === 'efetivar') { await handleEfetivar(btn); return; }
  if (action === 'editar-fixa') { abrirModalEditarFixa(btn); return; }
  if (action === 'encerrar-fixa') { await handleEncerrarFixa(btn); return; }

  if (action === 'pagar' || action === 'receber') {
    const ok = await confirmModal(action === 'pagar'
      ? { icon: '💰', title: 'Confirmar Pagamento',   msg: 'Deseja registrar o pagamento deste lançamento?',   color: 'var(--warn-green)' }
      : { icon: '📥', title: 'Confirmar Recebimento', msg: 'Deseja registrar o recebimento deste lançamento?', color: 'var(--h2)' });
    if (!ok) return;
    btn.disabled = true;
    btn.textContent = '...';
    try {
      const updated = await patchLancamento(id);
      const idx = allLancamentos.findIndex(l => l.id === id);
      if (idx !== -1) allLancamentos[idx] = updated;
      render();
      showToast(action === 'pagar' ? '✓ Pagamento registrado!' : '✓ Recebimento registrado!');
    } catch {
      showToast('Erro ao atualizar o registro.', true);
      render();
    }
  } else if (action === 'cancelar') {
    await handleCancelar(id);
  } else if (action === 'editar') {
    openModalEdit(id);
  } else if (action === 'excluir') {
    await handleExcluir(id);
  }
}

document.getElementById('table-body').addEventListener('click', handleLancamentoAction);
const _mobileListEl = document.getElementById('mobile-list');
if (_mobileListEl) _mobileListEl.addEventListener('click', handleLancamentoAction);

// ── Cancelar ──────────────────────────────────────────────────────────
async function handleCancelar(id) {
  const ok = await confirmModal({
    icon: '⚠️', title: 'Cancelar Lançamento',
    msg: 'Deseja cancelar este lançamento?',
    color: 'var(--h3)'
  });
  if (!ok) return;
  try {
    const updated = await updateLancamento(id, { status: 3 });
    const idx = allLancamentos.findIndex(l => l.id === id);
    if (idx !== -1) allLancamentos[idx] = updated;
    render();
    showToast('✓ Lançamento cancelado.');
  } catch {
    showToast('Erro ao cancelar o lançamento.', true);
  }
}

// ── Modal de confirmação genérico (Promise-based) ────────────────────
function confirmModal({ icon = '❓', title = 'Confirmar', msg = 'Tem certeza?', color = 'var(--h2)' } = {}) {
  document.getElementById('modal-confirm-icon').textContent  = icon;
  document.getElementById('modal-confirm-title').textContent = title;
  document.getElementById('modal-confirm-title').style.color = color;
  document.getElementById('modal-confirm-msg').innerHTML     = msg;

  return new Promise(resolve => {
    const modal = document.getElementById('modal-confirm');
    modal.style.display = 'flex';

    const ok  = document.getElementById('btn-confirm-ok');
    const nok = document.getElementById('btn-confirm-cancel');

    function close(result) {
      modal.style.display = 'none';
      ok.removeEventListener('click', onOk);
      nok.removeEventListener('click', onNok);
      modal.removeEventListener('click', onBackdrop);
      resolve(result);
    }
    const onOk       = () => close(true);
    const onNok      = () => close(false);
    const onBackdrop = e => { if (e.target === modal) close(false); };

    ok.addEventListener('click', onOk);
    nok.addEventListener('click', onNok);
    modal.addEventListener('click', onBackdrop);
  });
}

// ── Modal de escopo (Promise-based) ──────────────────────────────────
function scopeModal({ icon = '❓', title = '', msg = '' } = {}) {
  document.getElementById('modal-scope-icon').textContent  = icon;
  document.getElementById('modal-scope-title').textContent = title;
  document.getElementById('modal-scope-msg').innerHTML     = msg;

  return new Promise(resolve => {
    const modal     = document.getElementById('modal-scope');
    modal.style.display = 'flex';

    const btnSingle = document.getElementById('btn-scope-single');
    const btnFuture = document.getElementById('btn-scope-future');
    const btnAll    = document.getElementById('btn-scope-all');
    const btnCancel = document.getElementById('btn-scope-cancel');

    function close(result) {
      modal.style.display = 'none';
      btnSingle.removeEventListener('click', onSingle);
      btnFuture.removeEventListener('click', onFuture);
      btnAll.removeEventListener('click', onAll);
      btnCancel.removeEventListener('click', onCancel);
      modal.removeEventListener('click', onBackdrop);
      resolve(result);
    }
    const onSingle   = () => close('single');
    const onFuture   = () => close('future');
    const onAll      = () => close('all');
    const onCancel   = () => close(null);
    const onBackdrop = e => { if (e.target === modal) close(null); };

    btnSingle.addEventListener('click', onSingle);
    btnFuture.addEventListener('click', onFuture);
    btnAll.addEventListener('click', onAll);
    btnCancel.addEventListener('click', onCancel);
    modal.addEventListener('click', onBackdrop);
  });
}

// ── Excluir ───────────────────────────────────────────────────────────
async function handleExcluir(id) {
  const lancamento = allLancamentos.find(l => l.id === id);
  if (!lancamento) return;

  let scope = 'single';

  if (lancamento.qtd_parcelas > 1) {
    scope = await scopeModal({
      icon: '🗑️',
      title: 'Excluir Lançamento',
      msg: `<b>#${lancamento.id} ${esc(lancamento.descricao)}</b><br>Parcela ${lancamento.parcela_atual}/${lancamento.qtd_parcelas} — Qual o escopo da exclusão?`
    });
    if (scope === null) return;
  } else {
    const confirmed = await confirmModal({
      icon: '🗑️', title: 'Excluir Lançamento',
      msg: 'Tem certeza que deseja excluir este lançamento?<br><span style="font-size:12px;color:var(--txt-soft)">Esta ação não pode ser desfeita.</span>',
      color: 'var(--warn-red)'
    });
    if (!confirmed) return;
  }

  const records = getRecordsForScope(lancamento, scope);
  const ids = records.map(l => l.id);

  try {
    await deleteLancamentos(ids);
    allLancamentos = allLancamentos.filter(l => !ids.includes(l.id));
    render();
    showToast(ids.length > 1 ? `✓ ${ids.length} lançamentos excluídos.` : '✓ Lançamento excluído.');
  } catch {
    showToast('Erro ao excluir.', true);
  }
}

// ── Lançamento fixo (recorrência mensal) ──────────────────────────────
const CAMPOS_IGNORADOS_NA_FIXA = [
  'campo-status', 'campo-pagamento', 'campo-qtd-parcelas', 'campo-parcela-atual'
];

/**
 * Mostra ou esconde os campos que não se aplicam a um lançamento fixo.
 * @param {boolean} ehFixa - true quando a opção "Fixa" está marcada.
 * @returns {void}
 */
function aplicarModoFixa(ehFixa) {
  CAMPOS_IGNORADOS_NA_FIXA.forEach(idCampo => {
    document.getElementById(idCampo).hidden = ehFixa;
  });
}

/**
 * Retorna o primeiro dia do mês corrente em data local (AAAA-MM-01).
 * @returns {string} Data no formato AAAA-MM-01.
 */
function obterPrimeiroDiaMesCorrente() {
  const hoje = new Date();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  return `${hoje.getFullYear()}-${mes}-01`;
}

/**
 * Cria a recorrência mensal a partir dos dados do formulário.
 * Não cria lançamento: a fixa só vale do mês corrente em diante.
 * @param {{descricao: string, tipo: string, vencimento: string, valor: number}} dados
 * @returns {Promise<void>}
 * @throws {Error} Se a gravação da recorrência falhar.
 */
async function gravarFixa({ descricao, tipo, vencimento, valor }) {
  const diaVencimento = Number(vencimento.slice(8, 10));
  await createRecorrencia({
    descricao,
    tipo,
    valor,
    dia_vencimento: diaVencimento,
    data_inicio: obterPrimeiroDiaMesCorrente()
  });
  todasRecorrencias = await carregarRecorrenciasSeguro();
  closeModal();
  render();
  showToast('✓ Lançamento fixo cadastrado!');
}

document.getElementById('f-fixa').addEventListener('change', e => {
  aplicarModoFixa(e.target.checked);
});

/**
 * Abre o modal preenchido com a recorrência da linha virtual clicada.
 * O vencimento mostrado é o da ocorrência do mês da linha; só o dia é gravado.
 * @param {HTMLElement} btn - Botão com data-recorrencia-id e data-competencia.
 * @returns {void}
 */
function abrirModalEditarFixa(btn) {
  const { recorrenciaId, competencia } = btn.dataset;
  const recorrencia = todasRecorrencias.find(r => String(r.id) === recorrenciaId);
  if (!recorrencia) return;

  fillForm({
    tipo: recorrencia.tipo,
    descricao: recorrencia.descricao,
    valor: recorrencia.valor,
    data_vencimento: calcularDataVencimento(competencia, recorrencia.dia_vencimento)
  });
  recorrenciaEmEdicao = recorrencia.id;
  document.getElementById('modal-form-title').textContent = 'Editar fixa';
  document.getElementById('campo-fixa').hidden = true;
  aplicarModoFixa(true);
  document.getElementById('modal-form').style.display = 'flex';
  document.getElementById('f-descricao').focus();
}

/**
 * Grava a edição da recorrência em edição. Não cria nem altera lançamentos reais.
 * @param {{descricao: string, tipo: string, vencimento: string, valor: number}} dados
 * @returns {Promise<void>}
 */
async function salvarEdicaoFixa({ descricao, tipo, vencimento, valor }) {
  const errEl = document.getElementById('form-err');
  const submitBtn = document.getElementById('btn-gravar');
  if (isNaN(valor) || valor <= 0) {
    errEl.textContent = 'Informe um valor maior que zero.';
    return;
  }
  submitBtn.disabled = true;
  submitBtn.textContent = 'Gravando...';
  try {
    await updateRecorrencia(recorrenciaEmEdicao, {
      descricao,
      tipo,
      valor,
      dia_vencimento: Number(vencimento.slice(8, 10))
    });
    todasRecorrencias = await carregarRecorrenciasSeguro();
    closeModal();
    render();
    showToast('✓ Fixa atualizada!');
  } catch {
    errEl.textContent = 'Erro ao atualizar a fixa. Tente novamente.';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Gravar';
  }
}

// ── Modal helpers ─────────────────────────────────────────────────────
function fillForm(fields) {
  document.getElementById('f-id').value                  = fields.id ?? '';
  document.getElementById('f-id-parcelamento').value     = fields.id_parcelamento ?? '';
  document.getElementById('f-tipo').value                = fields.tipo ?? 'pagar';
  document.getElementById('f-descricao').value           = fields.descricao ?? '';
  document.getElementById('f-vencimento').value          = fields.data_vencimento ?? '';
  document.getElementById('f-pagamento').value           = fields.data_pagamento ?? '';
  document.getElementById('f-qtd-parcelas').value        = fields.qtd_parcelas ?? 1;
  document.getElementById('f-parcela-atual').value       = fields.parcela_atual ?? 1;
  document.getElementById('f-valor').value               = fields.valor ?? '';
  document.getElementById('f-status').value              = String(fields.status ?? 0);
  document.getElementById('form-err').textContent        = '';
  document.getElementById('btn-gravar').disabled         = false;
  document.getElementById('btn-gravar').textContent      = 'Gravar';

  // Opção "Fixa" só existe ao criar; sempre começa desmarcada
  document.getElementById('f-fixa').checked = false;
  document.getElementById('campo-fixa').hidden = Boolean(fields.id);
  aplicarModoFixa(false);

  // Mostrar/ocultar campo de ID
  const idField = document.getElementById('id-field');
  if (fields.id) {
    document.getElementById('f-id-display').value = fields.id;
    idField.style.display = 'block';
  } else {
    idField.style.display = 'none';
  }
}

async function openModalInsert(tipo) {
  // Verificar se há lojas disponíveis
  if (allLojas.length === 0) {
    showToast(
      '⚠️ Nenhuma loja configurada. Execute o SQL no Supabase Dashboard.',
      true
    );
    return;
  }

  document.getElementById('modal-form-title').textContent =
    tipo === 'pagar' ? '➕ Nova Conta a Pagar' : '➕ Nova Conta a Receber';
  recorrenciaEmEdicao = null;
  fillForm({ tipo, data_vencimento: defaultVencimentoForMonth() });
  document.getElementById('modal-form').style.display = 'flex';
  document.getElementById('f-descricao').focus();
}

async function openModalEdit(id) {
  const l = allLancamentos.find(l => l.id === id);
  if (!l) return;

  if (l.qtd_parcelas > 1) {
    _editScope = await scopeModal({
      icon: '✏️',
      title: 'Editar Lançamento',
      msg: `<b>#${l.id} ${esc(l.descricao)}</b><br>Parcela ${l.parcela_atual}/${l.qtd_parcelas} — Qual o escopo da edição?`
    });
    if (_editScope === null) return;
  } else {
    _editScope = 'single';
  }

  document.getElementById('modal-form-title').textContent = '✏️ Editar Lançamento';
  recorrenciaEmEdicao = null;
  fillForm(l);
  document.getElementById('modal-form').style.display = 'flex';
  document.getElementById('f-descricao').focus();
}

function closeModal() {
  recorrenciaEmEdicao = null;
  document.getElementById('modal-form').style.display = 'none';
}

// ── Modal events ──────────────────────────────────────────────────────
document.getElementById('btn-modal-fechar').addEventListener('click', closeModal);
document.getElementById('modal-form').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-form')) closeModal();
});

document.getElementById('form-lanc').addEventListener('submit', async e => {
  e.preventDefault();
  const errEl    = document.getElementById('form-err');
  const submitBtn = document.getElementById('btn-gravar');
  errEl.textContent = '';

  const id                = document.getElementById('f-id').value;
  const idParcelamento    = document.getElementById('f-id-parcelamento').value;
  const tipo              = document.getElementById('f-tipo').value;
  const descricao         = document.getElementById('f-descricao').value.trim();
  const vencimento        = document.getElementById('f-vencimento').value;
  const pagamento         = document.getElementById('f-pagamento').value || null;
  const qtdParcelas       = parseInt(document.getElementById('f-qtd-parcelas').value) || 1;
  const parcelaAtual      = parseInt(document.getElementById('f-parcela-atual').value) || 1;
  const valor             = parseFloat(document.getElementById('f-valor').value);
  const status            = parseInt(document.getElementById('f-status').value);

  const ehFixa = !id && document.getElementById('f-fixa').checked;

  if (!descricao)             { errEl.textContent = 'Informe a descrição.'; return; }
  if (!vencimento)            { errEl.textContent = 'Informe a data de vencimento.'; return; }
  if (recorrenciaEmEdicao) {
    await salvarEdicaoFixa({ descricao, tipo, vencimento, valor });
    return;
  }
  if (ehFixa) {
    if (isNaN(valor) || valor <= 0) { errEl.textContent = 'Informe um valor maior que zero.'; return; }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Gravando...';
    try {
      await gravarFixa({ descricao, tipo, vencimento, valor });
    } catch {
      errEl.textContent = 'Erro ao gravar o lançamento fixo. Tente novamente.';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Gravar';
    }
    return;
  }
  if (isNaN(valor) || valor < 0) { errEl.textContent = 'Informe um valor válido.'; return; }
  if (parcelaAtual > qtdParcelas) { errEl.textContent = 'Parcela atual não pode ser maior que total de parcelas.'; return; }
  if (parcelaAtual < 1) { errEl.textContent = 'Parcela atual deve ser no mínimo 1.'; return; }

  const payload = { descricao, tipo, data_vencimento: vencimento, data_pagamento: pagamento,
                    qtd_parcelas: qtdParcelas, parcela_atual: parcelaAtual, valor, status,
                    id_parcelamento: idParcelamento };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Gravando...';

  try {
    if (id) {
      const lancamento = allLancamentos.find(l => l.id === Number(id));
      if (_editScope !== 'single' && lancamento) {
        const records = getRecordsForScope(lancamento, _editScope);
        const bulkPayload = { descricao, tipo, valor, qtd_parcelas: qtdParcelas };
        const results = await Promise.all(
          records.map(r => updateLancamento(r.id, bulkPayload))
        );
        results.forEach(updated => {
          const idx = allLancamentos.findIndex(l => l.id === updated.id);
          if (idx !== -1) allLancamentos[idx] = updated;
        });
        showToast(`✓ ${results.length} lançamento${results.length > 1 ? 's atualizados' : ' atualizado'}!`);
      } else {
        const updated = await updateLancamento(Number(id), payload);
        const idx = allLancamentos.findIndex(l => l.id === Number(id));
        if (idx !== -1) allLancamentos[idx] = updated;
        showToast('✓ Lançamento atualizado!');
      }
    } else {
      if (qtdParcelas > 1) {
        const grupoId = `g${Date.now()}`;
        const idParcel = `p${Date.now()}`;
        const records = [];
        for (let i = parcelaAtual; i <= qtdParcelas; i++) {
          const offset = i - parcelaAtual;
          records.push({
            ...payload,
            grupo_id: grupoId,
            id_parcelamento: idParcel,
            parcela_atual: i,
            data_vencimento: addMonths(vencimento, offset),
            data_pagamento: offset === 0 ? pagamento : null,
            status: offset === 0 ? status : 0,
          });
        }
        const results = await Promise.all(
          records.map(r => createLancamento(r))
        );
        allLancamentos.push(...results);
        showToast(`✓ ${results.length} parcela${results.length > 1 ? 's geradas' : ' gerada'}!`);
      } else {
        const created = await createLancamento(payload);
        allLancamentos.push(created);
        showToast('✓ Lançamento inserido!');
      }
    }
    closeModal();
    render();
  } catch (err) {
    let mensagemErro = 'Erro ao gravar. Tente novamente.';

    if (err.message.includes('Nenhuma loja')) {
      mensagemErro = '⚠️ Nenhuma loja configurada no banco de dados.';
    } else if (err.message.includes('Falha ao')) {
      mensagemErro = 'Erro ao atualizar. Verifique os dados.';
    } else if (err.message.includes('violates')) {
      mensagemErro = 'Dados inválidos ou duplicados. Verifique.';
    }

    errEl.textContent = mensagemErro;
    submitBtn.disabled = false;
    submitBtn.textContent = 'Gravar';
  }
});

// ── Insert buttons ────────────────────────────────────────────────────
document.getElementById('btn-ins-pagar').addEventListener('click', () => openModalInsert('pagar'));
document.getElementById('btn-ins-receber').addEventListener('click', () => openModalInsert('receber'));

/**
 * Grava mês, tipo e status escolhidos no localStorage (válidos por 1 hora).
 * @returns {void}
 */
function salvarPreferencias() {
  salvarFiltros({ tipo: filtroTipo, status: filtroStatus, mes: selectedMonth });
}

// ── Event: month navigation (mês atual + prev/next) ───────────────────
function shiftMonth(delta) {
  const [y, m] = selectedMonth.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  selectedMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  salvarPreferencias();
  render(); // atualiza label, cards/resumo e lista filtrada por data_vencimento
}

document.getElementById('btn-prev').addEventListener('click', () => shiftMonth(-1));
document.getElementById('btn-next').addEventListener('click', () => shiftMonth(+1));

const monthPicker = document.getElementById('month-picker');
monthPicker.addEventListener('change', e => {
  if (!e.target.value) return;
  selectedMonth = e.target.value;
  salvarPreferencias();
  render();
});

// Toque no rótulo abre o seletor nativo (opcional); setas são o caminho principal
document.getElementById('month-display').addEventListener('click', () => {
  try {
    if (typeof monthPicker.showPicker === 'function') monthPicker.showPicker();
    else monthPicker.click();
  } catch {
    monthPicker.focus();
  }
});

// ── Event: tipo filters ───────────────────────────────────────────────
document.querySelectorAll('[data-ftipo]').forEach(btn => {
  btn.addEventListener('click', () => {
    filtroTipo = btn.dataset.ftipo;
    document.querySelectorAll('[data-ftipo]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    salvarPreferencias();
    renderTable();
  });
});

// ── Event: status filters ─────────────────────────────────────────────
document.querySelectorAll('[data-fstatus]').forEach(btn => {
  btn.addEventListener('click', () => {
    filtroStatus = btn.dataset.fstatus;
    document.querySelectorAll('[data-fstatus]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    salvarPreferencias();
    renderTable();
  });
});

/** Marca como ativos os botões dos filtros restaurados do localStorage. */
function marcarFiltrosAtivos() {
  document.querySelectorAll('[data-ftipo]').forEach(b => {
    b.classList.toggle('active', b.dataset.ftipo === filtroTipo);
  });
  document.querySelectorAll('[data-fstatus]').forEach(b => {
    b.classList.toggle('active', b.dataset.fstatus === filtroStatus);
  });
}
marcarFiltrosAtivos();

// ── Logout ────────────────────────────────────────────────────────────
async function fazerLogout() {
  limparFiltros();
  try {
    await supabaseLogout();
    window.location.replace('/login.html');
  } catch (err) {
    console.error('Erro ao fazer logout:', err);
    window.location.replace('/login.html');
  }
}
document.getElementById('btn-logout').addEventListener('click', fazerLogout);
// No celular o "Sair" fica dentro das configurações
document.getElementById('btn-logout-cfg').addEventListener('click', fazerLogout);

// ── Atualizar dados (botão, ao voltar para o app e ao reconectar) ─────
document.getElementById('btn-refresh').addEventListener('click', () =>
  loadData({ silent: true, notify: true })
);
document.addEventListener('visibilitychange', () => {
  // App instalado fica aberto por horas: reatualiza ao voltar depois de 1 min
  if (document.visibilityState === 'visible' && Date.now() - _lastLoad > 60_000) {
    loadData({ silent: true });
  }
});
window.addEventListener('online', () => loadData({ silent: true }));

// ── Instalar app (PWA) ────────────────────────────────────────────────
const cfgInstall  = document.getElementById('cfg-install');
const btnInstall  = document.getElementById('btn-install');
const installHint = document.getElementById('cfg-install-hint');

onInstallAvailabilityChange(disponivel => {
  if (isStandalone()) { cfgInstall.hidden = true; return; }
  if (disponivel) {
    cfgInstall.hidden = false;
    btnInstall.hidden = false;
    installHint.textContent = 'Abre em tela cheia, direto da tela inicial.';
  } else if (isIosSafari()) {
    cfgInstall.hidden = false;
    btnInstall.hidden = true;
    installHint.textContent =
      'No iPhone: toque em Compartilhar e depois em “Adicionar à Tela de Início”.';
  } else {
    cfgInstall.hidden = true;
  }
});

btnInstall.addEventListener('click', async () => {
  const resultado = await promptInstall();
  if (resultado === 'accepted') showToast('✓ App instalado!');
});

// ── Config Modal ─────────────────────────────────────────────────────
async function openConfigModal() {
  const cfgEmail = document.getElementById('cfg-email');
  const cfgNome = document.getElementById('cfg-nome');
  const cfgLoja = document.getElementById('cfg-loja');
  const cfgDataSessao = document.getElementById('cfg-data-sessao');

  // Preencher com dados do usuário
  if (_currentUser) {
    cfgEmail.value = _currentUser.email || '—';
    cfgNome.value = _currentUser.user_metadata?.nome || '—';
  }

  // Recarregar lojas se vazio
  if (allLojas.length === 0) {
    try {
      allLojas = await getLojas();
    } catch (err) {
      console.error('Erro ao carregar lojas:', err);
    }
  }

  // Carregar lojas no select
  cfgLoja.innerHTML = '';
  if (allLojas.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = '⚠️ Nenhuma loja configurada';
    cfgLoja.appendChild(option);
    cfgLoja.disabled = true;
  } else {
    cfgLoja.disabled = false;
    // Obter loja padrão salva (ou primeira)
    const lojapadraoPref = localStorage.getItem('fin_loja_padrao');

    allLojas.forEach(loja => {
      const option = document.createElement('option');
      option.value = loja.id;
      option.textContent = `${loja.loj_nome} ${loja.loj_cidade ? '(' + loja.loj_cidade + ')' : ''}`;
      cfgLoja.appendChild(option);
    });

    // Selecionar loja padrão
    if (lojapadraoPref && allLojas.some(l => l.id == lojapadraoPref)) {
      cfgLoja.value = lojapadraoPref;
    } else {
      cfgLoja.value = allLojas[0]?.id || '';
    }
  }

  // Data da sessão
  cfgDataSessao.value = new Date().toLocaleString('pt-BR');

  document.getElementById('modal-config').style.display = 'flex';
}

function saveConfigModal() {
  const cfgLoja = document.getElementById('cfg-loja');

  if (cfgLoja.value) {
    localStorage.setItem('fin_loja_padrao', cfgLoja.value);
    showToast('✓ Loja padrão salva com sucesso!');
  }

  closeConfigModal();
}

function closeConfigModal() {
  document.getElementById('modal-config').style.display = 'none';
}

document.getElementById('btn-config').addEventListener('click', openConfigModal);
document.getElementById('btn-salvar-config').addEventListener('click', saveConfigModal);
document.getElementById('btn-fechar-config').addEventListener('click', closeConfigModal);
document.getElementById('modal-config').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-config')) closeConfigModal();
});

// ── Init ──────────────────────────────────────────────────────────────
document.getElementById('month-picker').value = selectedMonth;
renderMonthLabel();

// Mostra e-mail do usuário no navbar
if (_currentUser) {
  const navUser = document.getElementById('nav-user');
  if (navUser) navUser.textContent = _currentUser.email;
}
await loadData();

// Atalhos do ícone do app (manifest): /?novo=pagar e /?novo=receber
const _novo = new URLSearchParams(window.location.search).get('novo');
if ((_novo === 'pagar' || _novo === 'receber') && _lastLoad > 0) {
  window.history.replaceState(null, '', window.location.pathname);
  openModalInsert(_novo);
}
