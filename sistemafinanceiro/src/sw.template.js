/* Service worker do Financeiro.
 *
 * Este arquivo é um TEMPLATE: o plugin de build (pwa-plugin.js) troca a
 * versão e a lista de arquivos pré-cacheados pelos valores reais e o publica
 * como /sw.js.
 *
 * Regras:
 *  - O "shell" do app (HTML, JS, CSS, ícones) é pré-cacheado e servido do cache.
 *  - NUNCA interceptamos chamadas ao Supabase (dados financeiros e tokens de
 *    sessão não passam pelo cache do service worker).
 *  - Fontes do Google: stale-while-revalidate (só estética).
 */
const VERSION = '__VERSION__';
const PRECACHE = `fin-shell-${VERSION}`;
const FONTS = 'fin-fonts-v1';
const PRECACHE_URLS = __PRECACHE_URLS__;
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil(
    precache().then(() => self.skipWaiting())
  );
});

async function precache() {
  const cache = await caches.open(PRECACHE);
  await Promise.all(PRECACHE_URLS.map(async url => {
    const res = await fetch(new Request(url, { cache: 'reload' }));
    if (!res.ok) throw new Error(`pré-cache falhou: ${url} (${res.status})`);
    // Navegador recusa servir resposta "redirected" a uma navegação (ex.: /login.html -> /login)
    const clean = res.redirected
      ? new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers: res.headers })
      : res;
    await cache.put(url, clean);
  }));
}

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k.startsWith('fin-shell-') && k !== PRECACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Fontes: mostra a versão em cache e atualiza em segundo plano
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // Qualquer outra origem (Supabase etc.) segue direto para a rede
  if (url.origin !== self.location.origin) return;

  // Navegação: o HTML pré-cacheado abre na hora, mesmo sem internet
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.open(PRECACHE).then(async cache =>
        (await cache.match(req, { ignoreSearch: true })) ||
        fetch(req).catch(async () => (await cache.match('/index.html')) || Response.error())
      )
    );
    return;
  }

  // Estáticos (JS/CSS com hash, ícones, manifest): cache primeiro
  event.respondWith(
    caches.open(PRECACHE).then(async cache =>
      (await cache.match(req)) || fetch(req)
    )
  );
});

async function staleWhileRevalidate(req) {
  const cache = await caches.open(FONTS);
  const cached = await cache.match(req);
  const network = fetch(req)
    .then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || network;
}
