// ============================================================================
// Navegação dos modais no celular
//  - Botão/gesto "voltar" fecha o modal aberto (em vez de sair do app)
//  - Esc fecha o modal do topo
//  - Ao focar um campo dentro do modal, rola até ele (teclado virtual)
//
// Não depende de como cada tela abre/fecha seus modais: observa o
// style.display dos elementos .modal-back e fecha "clicando" no fundo, que é
// o que cada tela já trata como cancelar.
//
// Histórico: existe no máximo UMA entrada nossa, e só enquanto houver algum
// modal aberto. A conciliação roda num setTimeout, então fechar um modal e
// abrir outro no mesmo instante (escopo -> formulário) não mexe no histórico.
// ============================================================================

const stack = [];      // modais abertos; o último é o do topo
let hasEntry = false;  // já empurramos uma entrada no histórico?
let ignorePops = 0;    // popstates provocados por nós mesmos
let timer = null;

const isOpen = el => getComputedStyle(el).display !== 'none';

function refreshStack() {
  document.querySelectorAll('.modal-back').forEach(el => {
    const i = stack.indexOf(el);
    const open = isOpen(el);
    if (open && i === -1) stack.push(el);
    else if (!open && i !== -1) stack.splice(i, 1);
  });
}

function reconcile() {
  timer = null;
  refreshStack();
  const want = stack.length > 0;
  if (want && !hasEntry) {
    history.pushState({ finModal: true }, '');
    hasEntry = true;
  } else if (!want && hasEntry) {
    hasEntry = false;
    ignorePops++;
    history.back();
  }
}

function schedule() {
  if (timer === null) timer = setTimeout(reconcile, 0);
}

const observer = new MutationObserver(schedule);
document.querySelectorAll('.modal-back').forEach(el => {
  observer.observe(el, { attributes: true, attributeFilter: ['style'] });
});
schedule();

// Usuário apertou "voltar"
window.addEventListener('popstate', () => {
  if (ignorePops > 0) { ignorePops--; return; }

  refreshStack();
  hasEntry = false;                       // o "voltar" consumiu a nossa entrada
  const top = stack[stack.length - 1];
  if (top) top.click();                   // mesmo caminho do toque no fundo = cancelar
  schedule();                             // sobrou modal aberto? recria a entrada
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  refreshStack();
  const top = stack[stack.length - 1];
  if (top) top.click();
});

// Teclado virtual cobrindo o campo focado
document.addEventListener('focusin', e => {
  const field = e.target;
  if (!(field instanceof HTMLElement) || !field.closest('.modal')) return;
  if (!field.matches('input, select, textarea')) return;
  setTimeout(() => field.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300);
});
