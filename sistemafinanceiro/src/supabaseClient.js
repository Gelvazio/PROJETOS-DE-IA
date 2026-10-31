// ============================================================================
// SUPABASE CLIENT + CRUD
// ============================================================================
import { createClient } from '@supabase/supabase-js';
import { criarFetchComLoading } from './loading.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Faltam VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copie .env.example para .env.local.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  global: { fetch: criarFetchComLoading() },
});

const TABELA_RECORRENCIA = 'recorrencia';
const TIPOS_LANCAMENTO_VALIDOS = ['pagar', 'receber'];
const DIA_VENCIMENTO_MINIMO = 1;
const DIA_VENCIMENTO_MAXIMO = 31;
const STATUS_PAGO = 1;
const CODIGO_POSTGRES_DUPLICADO = '23505';
const FORMATO_DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const MENSAGEM_MES_JA_EFETIVADO = 'Este mês já foi efetivado.';
const MENSAGEM_TIPO_INVALIDO = "Tipo inválido: use 'pagar' ou 'receber'.";
const MENSAGEM_VALOR_INVALIDO = 'O valor deve ser maior que zero.';
const MENSAGEM_DIA_INVALIDO = 'O dia de vencimento deve estar entre 1 e 31.';
const MENSAGEM_DATA_FIM_INVALIDA = "Data de fim inválida: use o formato 'AAAA-MM-DD'.";
const MENSAGEM_DATA_FIM_ANTERIOR = 'A data de fim não pode ser anterior à data de início.';
const MENSAGEM_RECORRENCIA_NAO_ENCONTRADA = 'Recorrência não encontrada.';

// ── Auth ──────────────────────────────────────────────────────────────
export async function loginWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email, password, nome) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nome: nome || '' } },
  });
  if (error) throw error;

  const user = data.user;
  if (user) {
    const { error: profileError } = await supabase.from('usuarios').upsert({
      id: user.id,
      email,
      nome: nome || '',
      is_active: 1,
    });
    if (profileError) {
      // Perfil pode ser criado por trigger; não bloqueia o cadastro
      console.warn('Perfil usuarios:', profileError.message);
    }
  }
  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Envia o e-mail de recuperação; o link volta para a tela de login. */
export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login.html`,
  });
  if (error) throw error;
}

/** Define a nova senha do usuário autenticado pelo link de recuperação. */
export async function updatePassword(novaSenha) {
  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

/** Erro de conexão (offline, DNS, timeout) — diferente de token inválido/expirado. */
export function isNetworkError(err) {
  return !navigator.onLine ||
    err?.name === 'AuthRetryableFetchError' ||
    /failed to fetch|network|load failed/i.test(err?.message || '');
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}

// ── Helpers ───────────────────────────────────────────────────────────
async function requireUserId() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');
  return user.id;
}

function defaultLojaId() {
  const saved = localStorage.getItem('fin_loja_padrao');
  return saved ? Number(saved) : null;
}

// ── Lançamentos ───────────────────────────────────────────────────────
export async function getLancamentos() {
  const { data, error } = await supabase
    .from('lancamento')
    .select('*')
    .order('data_vencimento', { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * Resolve a loja a usar: a informada, a padrão salva ou a primeira loja ativa.
 * @param {number|null|undefined} lojaIdInformada - Loja enviada pelo chamador.
 * @returns {Promise<number>} Id da loja.
 * @throws {Error} Se não houver nenhuma loja configurada.
 */
async function resolverLojaId(lojaIdInformada) {
  const lojaId = lojaIdInformada ?? defaultLojaId();
  if (lojaId) return lojaId;

  const lojas = await getLojas();
  if (!lojas.length) throw new Error('Nenhuma loja configurada no banco de dados.');
  return lojas[0].id;
}

export async function createLancamento(lancamento) {
  const usuario_id = await requireUserId();
  const loja_id = await resolverLojaId(lancamento.loja_id);

  const row = {
    usuario_id,
    loja_id,
    descricao: lancamento.descricao,
    tipo: lancamento.tipo,
    data_vencimento: lancamento.data_vencimento,
    data_pagamento: lancamento.data_pagamento ?? null,
    qtd_parcelas: lancamento.qtd_parcelas ?? 1,
    parcela_atual: lancamento.parcela_atual ?? 1,
    valor: lancamento.valor,
    status: lancamento.status ?? 0,
    id_parcelamento: lancamento.id_parcelamento || null,
    grupo_id: lancamento.grupo_id || null,
    recorrencia_id: lancamento.recorrencia_id ?? null,
    competencia: lancamento.competencia ?? null,
  };

  const { data, error } = await supabase.from('lancamento').insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function updateLancamento(id, updates) {
  const payload = { ...updates };
  delete payload.id;
  delete payload.usuario_id;
  delete payload.created_at;

  const { data, error } = await supabase
    .from('lancamento')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error('Falha ao atualizar lançamento');
  return data;
}

export async function deleteLancamento(id) {
  const { error } = await supabase.from('lancamento').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function deleteLancamentos(ids) {
  if (!ids?.length) return true;
  const { error } = await supabase.from('lancamento').delete().in('id', ids);
  if (error) throw error;
  return true;
}

// ── Recorrências (contas fixas) ───────────────────────────────────────

/**
 * Devolve a data de hoje no fuso local, no formato 'AAAA-MM-DD' (sem converter para UTC).
 * @returns {string} Data de hoje.
 */
function obterDataLocalHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/**
 * Valida os campos de uma recorrência; campos ausentes só são exigidos se `exigirTodos`.
 * @param {{tipo?: string, valor?: number, dia_vencimento?: number}} campos - Campos a validar.
 * @param {boolean} exigirTodos - true na criação; false na atualização parcial.
 * @throws {Error} Se tipo, valor ou dia de vencimento forem inválidos.
 */
function validarCamposRecorrencia(campos, exigirTodos) {
  const deveValidarTipo = exigirTodos || campos.tipo !== undefined;
  if (deveValidarTipo && !TIPOS_LANCAMENTO_VALIDOS.includes(campos.tipo)) {
    throw new Error(MENSAGEM_TIPO_INVALIDO);
  }

  const deveValidarValor = exigirTodos || campos.valor !== undefined;
  if (deveValidarValor && !(Number(campos.valor) > 0)) {
    throw new Error(MENSAGEM_VALOR_INVALIDO);
  }

  if (!exigirTodos && campos.dia_vencimento === undefined) return;
  const dia = Number(campos.dia_vencimento);
  const diaEstaNaFaixa =
    Number.isInteger(dia) && dia >= DIA_VENCIMENTO_MINIMO && dia <= DIA_VENCIMENTO_MAXIMO;
  if (!diaEstaNaFaixa) throw new Error(MENSAGEM_DIA_INVALIDO);
}

/**
 * Lista todas as recorrências do usuário (ativas e inativas), ordenadas pela descrição.
 * O filtro por usuário é garantido pela RLS (auth.uid() = usuario_id).
 * @returns {Promise<object[]>} Recorrências do usuário.
 * @throws {Error} Erro do Supabase.
 */
export async function getRecorrencias() {
  const { data, error } = await supabase
    .from(TABELA_RECORRENCIA)
    .select('*')
    .order('descricao', { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * Busca uma recorrência pelo id.
 * @param {number} id - Id da recorrência.
 * @returns {Promise<object>} Recorrência encontrada.
 * @throws {Error} Se não existir (ou não for do usuário) ou erro do Supabase.
 */
async function buscarRecorrencia(id) {
  const { data, error } = await supabase
    .from(TABELA_RECORRENCIA)
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(MENSAGEM_RECORRENCIA_NAO_ENCONTRADA);
  return data;
}

/**
 * Cria uma recorrência para o usuário autenticado (usuario_id é sempre o da sessão).
 * @param {{descricao: string, tipo: string, valor: number, dia_vencimento: number,
 *   data_inicio: string, data_fim?: string|null, loja_id?: number, ativo?: number}} recorrencia
 * @returns {Promise<object>} Registro criado.
 * @throws {Error} Se os campos forem inválidos, sem loja ou erro do Supabase.
 */
export async function createRecorrencia(recorrencia) {
  validarCamposRecorrencia(recorrencia, true);
  const usuario_id = await requireUserId();
  const loja_id = await resolverLojaId(recorrencia.loja_id);

  const row = {
    usuario_id,
    loja_id,
    descricao: recorrencia.descricao,
    tipo: recorrencia.tipo,
    valor: recorrencia.valor,
    dia_vencimento: Number(recorrencia.dia_vencimento),
    data_inicio: recorrencia.data_inicio,
    data_fim: recorrencia.data_fim ?? null,
    ativo: recorrencia.ativo ?? 1,
  };

  const { data, error } = await supabase.from(TABELA_RECORRENCIA).insert(row).select().single();
  if (error) throw error;
  return data;
}

/**
 * Atualiza uma recorrência; nunca altera id, usuario_id nem created_at.
 * @param {number} id - Id da recorrência.
 * @param {object} updates - Campos a alterar.
 * @returns {Promise<object>} Registro atualizado.
 * @throws {Error} Se os campos forem inválidos ou erro do Supabase.
 */
export async function updateRecorrencia(id, updates) {
  const payload = { ...updates };
  delete payload.id;
  delete payload.usuario_id;
  delete payload.created_at;
  validarCamposRecorrencia(payload, false);

  const { data, error } = await supabase
    .from(TABELA_RECORRENCIA)
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error('Falha ao atualizar recorrência');
  return data;
}

/**
 * Encerra uma recorrência definindo a data de fim.
 * @param {number} id - Id da recorrência.
 * @param {string} dataFim - Data de fim no formato 'AAAA-MM-DD'.
 * @returns {Promise<object>} Registro atualizado.
 * @throws {Error} Se a data for inválida, anterior a data_inicio ou erro do Supabase.
 */
export async function encerrarRecorrencia(id, dataFim) {
  const dataFimEhValida = typeof dataFim === 'string' && FORMATO_DATA_ISO.test(dataFim);
  if (!dataFimEhValida) throw new Error(MENSAGEM_DATA_FIM_INVALIDA);

  const recorrencia = await buscarRecorrencia(id);
  // Datas 'AAAA-MM-DD' comparam corretamente como texto.
  if (dataFim < recorrencia.data_inicio) throw new Error(MENSAGEM_DATA_FIM_ANTERIOR);

  return updateRecorrencia(id, { data_fim: dataFim });
}

/**
 * Efetiva uma ocorrência virtual: cria o lançamento já pago daquela competência.
 * O índice único (recorrencia_id, competencia) impede efetivar o mesmo mês duas vezes.
 * @param {{recorrencia_id: number, competencia: string, descricao: string, tipo: string,
 *   loja_id?: number, data_vencimento: string, valor: number}} ocorrencia - Ocorrência virtual.
 * @param {{valor?: number, dataPagamento?: string}} [opcoes] - Valor pago e data do pagamento
 *   (padrão: valor da ocorrência e hoje, data local).
 * @returns {Promise<object>} Lançamento criado.
 * @throws {Error} 'Este mês já foi efetivado.' se duplicado; valor inválido; erro do Supabase.
 */
export async function efetivarRecorrencia(ocorrencia, { valor, dataPagamento } = {}) {
  const valorPago = valor ?? ocorrencia.valor;
  if (!(Number(valorPago) > 0)) throw new Error(MENSAGEM_VALOR_INVALIDO);

  try {
    return await createLancamento({
      loja_id: ocorrencia.loja_id,
      descricao: ocorrencia.descricao,
      tipo: ocorrencia.tipo,
      data_vencimento: ocorrencia.data_vencimento,
      data_pagamento: dataPagamento || obterDataLocalHoje(),
      qtd_parcelas: 1,
      parcela_atual: 1,
      valor: valorPago,
      status: STATUS_PAGO,
      recorrencia_id: ocorrencia.recorrencia_id,
      competencia: ocorrencia.competencia,
    });
  } catch (erro) {
    if (erro?.code === CODIGO_POSTGRES_DUPLICADO) throw new Error(MENSAGEM_MES_JA_EFETIVADO);
    throw erro;
  }
}

// ── Lojas ─────────────────────────────────────────────────────────────
export async function getLojas() {
  const { data, error } = await supabase
    .from('loja')
    .select('*')
    .eq('loj_ativo', 1)
    .order('loj_nome', { ascending: true });
  if (error) throw error;
  return data || [];
}

export function subscribeLancamentos(callback) {
  return supabase
    .channel('lancamento-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'lancamento' },
      payload => callback(payload)
    )
    .subscribe();
}
