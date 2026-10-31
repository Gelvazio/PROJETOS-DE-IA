// Subcomando `avaliar`: repassa os argumentos ao benchmark (scripts/jev/avaliar.mjs).
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CODIGOS_SAIDA } from './saida.mjs';

const SCRIPT_AVALIAR = join(dirname(fileURLToPath(import.meta.url)), '..', 'avaliar.mjs');

/**
 * Executa o benchmark com os mesmos argumentos (o que vem depois de `avaliar`).
 * @param {{argvOriginal: string[]}} argumentos Linha de comando original sem o subcomando.
 * @returns {Promise<number>} Código de saída do benchmark.
 */
export async function executarAvaliar({ argvOriginal }) {
  const resultado = spawnSync(process.execPath, [SCRIPT_AVALIAR, ...argvOriginal],
    { stdio: 'inherit' });
  return resultado.status ?? CODIGOS_SAIDA.ERRO;
}
