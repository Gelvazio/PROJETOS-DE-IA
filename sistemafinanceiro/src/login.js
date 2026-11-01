// ============================================================================
// LOGIN - Supabase Auth
// ============================================================================
import './pwa.js';
import './modal-nav.js';
import {
  supabase, loginWithEmail, signUp, getSession, getCurrentUser, requestPasswordReset,
  updatePassword, isNetworkError,
} from './supabaseClient.js';

import { limparFiltros } from './filtrosSalvos.js';

// O link do e-mail de recuperação cria uma sessão; não pode redirecionar ao dashboard
const emRecuperacao = window.location.hash.includes('type=recovery');

// Se já estiver logado, vai direto pro dashboard
const session = await getSession();
if (session && !emRecuperacao) {
  let sessaoValida = false;
  try {
    sessaoValida = Boolean(await getCurrentUser());
  } catch (err) {
    // Sem rede não dá para validar: segue para o app (que abre do cache) em vez de deslogar
    sessaoValida = isNetworkError(err);
  }

  if (sessaoValida) {
    window.location.replace('/financas-pessoais.html');
  } else {
    // Token salvo inválido: limpa para não redirecionar em loop
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
  }
}

// ── Helpers ───────────────────────────────────────────────────────────
function showToast(msg, isError = false) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.borderColor = isError ? 'rgba(255,91,110,0.5)' : 'rgba(52,224,215,0.38)';
  el.style.display = 'block';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.display = 'none'; }, 3500);
}

// ── LOGIN ─────────────────────────────────────────────────────────────
document.getElementById('form-login').addEventListener('submit', async e => {
  e.preventDefault();
  const errEl = document.getElementById('login-err');
  const btn = document.getElementById('btn-entrar');
  errEl.textContent = '';

  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-senha').value;

  if (!email) { errEl.textContent = 'Informe o e-mail.'; return; }
  if (!senha) { errEl.textContent = 'Informe a senha.'; return; }

  btn.disabled = true;
  btn.textContent = 'Aguarde...';

  try {
    await loginWithEmail(email, senha);
    limparFiltros(); // novo login recomeça com os filtros no padrão
    window.location.replace('/financas-pessoais.html');
  } catch (err) {
    // Mensagens de erro mais amigáveis
    if (err.message.includes('Invalid login credentials')) {
      errEl.textContent = 'E-mail ou senha incorretos.';
    } else if (err.message.includes('Email not confirmed')) {
      errEl.textContent = 'E-mail não confirmado. Verifique sua caixa de entrada.';
    } else {
      errEl.textContent = err.message || 'Erro ao fazer login. Tente novamente.';
    }
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }
});

// ── MODAL: abrir / fechar ─────────────────────────────────────────────
function openCadastro() {
  document.getElementById('form-cadastro').reset();
  document.getElementById('cad-err').textContent = '';
  document.getElementById('btn-cad-submit').disabled = false;
  document.getElementById('btn-cad-submit').textContent = 'Cadastrar';
  document.getElementById('modal-cadastro').style.display = 'flex';
  document.getElementById('cad-email').focus();
}

function closeCadastro() {
  document.getElementById('modal-cadastro').style.display = 'none';
}

document.getElementById('btn-abrir-cadastro').addEventListener('click', openCadastro);
document.getElementById('btn-fechar-cadastro').addEventListener('click', closeCadastro);
document.getElementById('modal-cadastro').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-cadastro')) closeCadastro();
});

// ── MODAL: esqueci a senha ────────────────────────────────────────────
const modalEsqueci = document.getElementById('modal-esqueci');

document.getElementById('btn-esqueci-senha').addEventListener('click', () => {
  document.getElementById('form-esqueci').reset();
  document.getElementById('esq-err').textContent = '';
  document.getElementById('btn-esq-submit').disabled = false;
  document.getElementById('btn-esq-submit').textContent = 'Enviar link';
  document.getElementById('esq-email').value = document.getElementById('login-email').value.trim();
  modalEsqueci.style.display = 'flex';
  document.getElementById('esq-email').focus();
});

function closeEsqueci() {
  modalEsqueci.style.display = 'none';
}
document.getElementById('btn-fechar-esqueci').addEventListener('click', closeEsqueci);
modalEsqueci.addEventListener('click', e => {
  if (e.target === modalEsqueci) closeEsqueci();
});

document.getElementById('form-esqueci').addEventListener('submit', async e => {
  e.preventDefault();
  const errEl = document.getElementById('esq-err');
  const btn = document.getElementById('btn-esq-submit');
  errEl.textContent = '';

  const email = document.getElementById('esq-email').value.trim();
  if (!email) { errEl.textContent = 'Informe o e-mail.'; return; }
  if (!/\S+@\S+\.\S+/.test(email)) { errEl.textContent = 'E-mail inválido.'; return; }

  btn.disabled = true;
  btn.textContent = 'Enviando...';

  try {
    await requestPasswordReset(email);
    closeEsqueci();
    showToast('✓ Se o e-mail existir, enviamos o link de recuperação.');
  } catch (err) {
    errEl.textContent = err.message || 'Erro ao enviar o e-mail. Tente novamente.';
    btn.disabled = false;
    btn.textContent = 'Enviar link';
  }
});

// ── MODAL: nova senha (retorno do link do e-mail) ─────────────────────
const modalNovaSenha = document.getElementById('modal-nova-senha');

function abrirNovaSenha() {
  modalNovaSenha.style.display = 'flex';
  document.getElementById('nova-senha').focus();
}

if (emRecuperacao) abrirNovaSenha();
// Cobre também o fluxo PKCE, em que o evento chega sem `type=recovery` no hash
supabase.auth.onAuthStateChange(evento => {
  if (evento === 'PASSWORD_RECOVERY') abrirNovaSenha();
});

document.getElementById('form-nova-senha').addEventListener('submit', async e => {
  e.preventDefault();
  const errEl = document.getElementById('nova-err');
  const btn = document.getElementById('btn-nova-submit');
  errEl.textContent = '';

  const senha = document.getElementById('nova-senha').value;
  const senha2 = document.getElementById('nova-senha2').value;
  if (senha.length < 6) { errEl.textContent = 'A senha deve ter no mínimo 6 caracteres.'; return; }
  if (senha !== senha2) { errEl.textContent = 'As senhas não conferem.'; return; }

  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    await updatePassword(senha);
    window.location.replace('/financas-pessoais.html');
  } catch (err) {
    errEl.textContent = err.message || 'Erro ao salvar a senha. Tente novamente.';
    btn.disabled = false;
    btn.textContent = 'Salvar senha';
  }
});

// ── MODAL: cadastrar novo usuário ─────────────────────────────────────
document.getElementById('form-cadastro').addEventListener('submit', async e => {
  e.preventDefault();
  const errEl = document.getElementById('cad-err');
  const btn = document.getElementById('btn-cad-submit');
  errEl.textContent = '';

  const email = document.getElementById('cad-email').value.trim();
  const nome = document.getElementById('cad-nome').value.trim();
  const senha = document.getElementById('cad-senha').value;
  const senha2 = document.getElementById('cad-senha2').value;

  if (!email) { errEl.textContent = 'Informe o e-mail.'; return; }
  if (!/\S+@\S+\.\S+/.test(email)) { errEl.textContent = 'E-mail inválido.'; return; }
  if (!nome) { errEl.textContent = 'Informe o nome.'; return; }
  if (senha.length < 6) { errEl.textContent = 'A senha deve ter no mínimo 6 caracteres.'; return; }
  if (senha !== senha2) { errEl.textContent = 'As senhas não conferem.'; return; }

  btn.disabled = true;
  btn.textContent = 'Cadastrando...';

  try {
    await signUp(email, senha, nome);
    closeCadastro();
    document.getElementById('login-email').value = email;
    document.getElementById('login-senha').value = '';
    document.getElementById('login-senha').focus();
    showToast('✓ Usuário cadastrado! Faça o login.');
  } catch (err) {
    // Mensagens de erro mais amigáveis
    if (err.message.includes('already registered')) {
      errEl.textContent = 'Este e-mail já está cadastrado.';
    } else if (err.message.includes('invalid_grant')) {
      errEl.textContent = 'Credenciais inválidas.';
    } else {
      errEl.textContent = err.message || 'Erro ao cadastrar. Tente novamente.';
    }
    btn.disabled = false;
    btn.textContent = 'Cadastrar';
  }
});
