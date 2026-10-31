/**
 * Constrói o clone em dist/: main e preload (CommonJS, Node) e renderer (navegador),
 * e copia o HTML e o CSS da interface.
 */
import { build } from 'esbuild';
import { copyFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PASTA_RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PASTA_DIST = path.join(PASTA_RAIZ, 'dist');
const PASTA_RENDERER = path.join(PASTA_RAIZ, 'src', 'renderer');
const ARQUIVOS_ESTATICOS = ['index.html', 'estilos.css'];
const VERSAO_NODE_ELECTRON = 'node22';
const VERSAO_CHROME_ELECTRON = 'chrome130';

const ALVOS = [
  { entrada: 'src/main/principal.ts', saida: 'main/principal.js', plataforma: 'node' },
  { entrada: 'src/preload/preload.ts', saida: 'preload/preload.js', plataforma: 'node' },
  { entrada: 'src/renderer/tela.ts', saida: 'renderer/tela.js', plataforma: 'browser' },
];

/**
 * Empacota um ponto de entrada com o esbuild.
 * @param {{entrada: string, saida: string, plataforma: 'node'|'browser'}} alvo
 * @returns {Promise<void>}
 */
async function empacotar(alvo) {
  const ehNavegador = alvo.plataforma === 'browser';
  await build({
    entryPoints: [path.join(PASTA_RAIZ, alvo.entrada)],
    outfile: path.join(PASTA_DIST, alvo.saida),
    bundle: true,
    platform: alvo.plataforma,
    format: ehNavegador ? 'iife' : 'cjs',
    target: ehNavegador ? VERSAO_CHROME_ELECTRON : VERSAO_NODE_ELECTRON,
    external: ['electron'],
    sourcemap: true,
    logLevel: 'warning',
  });
}

/**
 * Copia o HTML e o CSS da interface para dist/renderer.
 * @returns {Promise<void>}
 */
async function copiarEstaticos() {
  const destino = path.join(PASTA_DIST, 'renderer');
  await mkdir(destino, { recursive: true });
  for (const arquivo of ARQUIVOS_ESTATICOS) {
    await copyFile(path.join(PASTA_RENDERER, arquivo), path.join(destino, arquivo));
  }
}

/**
 * Limpa dist/ e constrói tudo.
 * @returns {Promise<void>}
 */
async function construir() {
  await rm(PASTA_DIST, { recursive: true, force: true });
  await Promise.all(ALVOS.map(empacotar));
  await copiarEstaticos();
  console.log('Build concluído em dist/');
}

try {
  await construir();
} catch (erro) {
  console.error(erro);
  process.exitCode = 1;
}
