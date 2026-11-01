// Plugin Vite (sem dependências extras) que gera o /sw.js no build.
// Lê src/sw.template.js, injeta a lista de arquivos do build e uma versão
// calculada pelo conteúdo — qualquer mudança no app troca a versão e o
// navegador instala o service worker novo.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// Pasta de PDFs grandes: vai no build, mas fica fora do pré-cache do app instalado
const PASTA_FORA_DO_PRECACHE = 'documentos/';

function listFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

/** Monta o texto final do service worker. Exportado para facilitar testes. */
export function buildServiceWorker({ template, bundle, publicDir }) {
  const hash = createHash('sha1');
  const urls = new Set(['/']);

  for (const [fileName, chunk] of Object.entries(bundle).sort(([a], [b]) => a.localeCompare(b))) {
    if (fileName.endsWith('.map')) continue;
    urls.add('/' + fileName);
    hash.update(fileName);
    hash.update(chunk.type === 'chunk' ? chunk.code : chunk.source);
  }

  if (publicDir && existsSync(publicDir)) {
    for (const file of listFiles(publicDir).sort()) {
      const rel = relative(publicDir, file).split(sep).join('/');
      if (rel.endsWith('.DS_Store') || rel.endsWith('.map')) continue;
      if (rel.startsWith(PASTA_FORA_DO_PRECACHE)) continue;
      urls.add('/' + rel);
      hash.update(rel);
      hash.update(readFileSync(file));
    }
  }

  const list = [...urls].sort();
  const version = hash.digest('hex').slice(0, 10);
  const out = template
    .split('__VERSION__').join(version)
    .split('__PRECACHE_URLS__').join(JSON.stringify(list, null, 2));

  // Falha o build em vez de publicar um service worker quebrado
  if (out.includes('__VERSION__') || out.includes('__PRECACHE_URLS__')) {
    throw new Error('pwa-plugin: marcador não substituído em sw.template.js');
  }
  return out;
}

export default function pwaPlugin() {
  let publicDir = null;
  return {
    name: 'financeiro-pwa-sw',
    apply: 'build',
    // 'post': roda depois do vite:build-html, quando index.html e login.html já
    // estão no bundle (entram no pré-cache e na versão do service worker)
    enforce: 'post',
    configResolved(config) {
      publicDir = config.publicDir || null;
    },
    generateBundle(_options, bundle) {
      const template = readFileSync(new URL('./src/sw.template.js', import.meta.url), 'utf8');
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: buildServiceWorker({ template, bundle, publicDir }),
      });
    },
  };
}
