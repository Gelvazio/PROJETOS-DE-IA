// ============================================================================
// PWA — service worker, aviso de offline/atualização e instalação
// Importado por financas-pessoais.html (main.js) e login.html (login.js).
// ============================================================================

// ── Ambiente ──────────────────────────────────────────────────────────
export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
}

/** iPhone/iPad no Safari (que não oferece o prompt de instalação). */
export function isIosSafari() {
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return ios && !isStandalone();
}

// ── Instalação (Chrome/Edge/Android) ──────────────────────────────────
let deferredPrompt = null;
const installListeners = new Set();

function notifyInstall() {
  installListeners.forEach(fn => fn(deferredPrompt !== null));
}

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  notifyInstall();
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  notifyInstall();
});

/** Chama fn(disponivel) agora e sempre que a disponibilidade mudar. */
export function onInstallAvailabilityChange(fn) {
  installListeners.add(fn);
  fn(deferredPrompt !== null);
}

/** Abre o prompt nativo. Retorna 'accepted' | 'dismissed' | 'unavailable'. */
export async function promptInstall() {
  if (!deferredPrompt) return 'unavailable';
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  notifyInstall();
  return outcome;
}

// ── Banners ───────────────────────────────────────────────────────────
let bannerBox = null;

function getBannerBox() {
  if (bannerBox) return bannerBox;
  bannerBox = document.createElement('div');
  bannerBox.className = 'pwa-banners';
  if (document.querySelector('.navbar')) bannerBox.classList.add('below-navbar');
  document.body.appendChild(bannerBox);
  return bannerBox;
}

function createBanner(className, text) {
  const el = document.createElement('div');
  el.className = `pwa-banner ${className}`;
  el.setAttribute('role', 'status');
  const span = document.createElement('span');
  span.textContent = text;
  el.appendChild(span);
  return el;
}

// Offline
const offlineBanner = createBanner(
  'pwa-banner--offline',
  'Sem conexão: não dá para salvar agora.'
);
offlineBanner.hidden = true;

function syncOnlineState() {
  const offline = !navigator.onLine;
  document.documentElement.classList.toggle('is-offline', offline);
  if (offline && !offlineBanner.isConnected) getBannerBox().appendChild(offlineBanner);
  offlineBanner.hidden = !offline;
}
window.addEventListener('online', syncOnlineState);
window.addEventListener('offline', syncOnlineState);
syncOnlineState();

// Nova versão do app
function showUpdateBanner() {
  const banner = createBanner('pwa-banner--update', 'Nova versão do app disponível.');
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = 'Atualizar';
  btn.addEventListener('click', () => window.location.reload());
  banner.appendChild(btn);
  getBannerBox().appendChild(banner);
}

// ── Service worker (só no build de produção) ──────────────────────────
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // Na 1ª instalação o SW "assume" a página sem que isso seja uma atualização
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) showUpdateBanner();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        // App instalado fica aberto por dias: confere atualização ao voltar para ele
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') reg.update().catch(() => {});
        });
      })
      .catch(err => console.warn('Service worker não registrado:', err));
  });
}
