// Pacote de código que o `rules-local/` de cada projeto baixa com as regras (RULES-LOCAL-JEV.2):
// os scripts do próprio `rules-local/` (para ele se atualizar sozinho) e os arquivos do Jev que o
// gancho de prompt usa. A lista do Jev sai das importações dos ganchos (sem testes nem benchmark).
// Usado pelo `scripts/sincronizar.mjs` para gravar as tabelas da `VERSAO.md`. Caminhos com `/`
// (a tabela antiga de regras só aceita `<nome>.md` sem barra, então scripts antigos ignoram estas).
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PASTA_SCRIPTS_RULES_LOCAL = join(RAIZ, 'scripts', 'rules-local');
const PASTA_JEV = join(RAIZ, 'scripts', 'jev');
/** Pontos de entrada do Jev no projeto: os ganchos de prompt. */
const RAIZES_JEV = ['ganchos/claude-prompt.mjs', 'ganchos/codex-prompt.mjs'];
const EXTENSAO_SCRIPT = '.mjs';
/** Pasta do Jev dentro de `rules-local/` (os scripts ficam na raiz de `rules-local/`). */
export const PREFIXO_JEV = 'jev';
/** `import`/`export … from './x.mjs'`, `import './x.mjs'` e `import('./x.mjs')`. */
const PADROES_IMPORTACAO = [
  /\b(?:import|export)\s[^'"`;]*?\bfrom\s*['"](\.{1,2}\/[^'"]+)['"]/g,
  /\bimport\s*['"](\.{1,2}\/[^'"]+)['"]/g,
  /\bimport\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g,
];

/**
 * Lista os scripts `.mjs` do `scripts/rules-local/` (copiados para `rules-local/` do projeto).
 * @returns {string[]} Nomes dos arquivos, em ordem alfabética.
 */
export function listarScriptsRulesLocal() {
  return readdirSync(PASTA_SCRIPTS_RULES_LOCAL)
    .filter((nome) => nome.endsWith(EXTENSAO_SCRIPT))
    .sort();
}

/**
 * Acha as importações relativas de um arquivo do Jev.
 * @param {string} arquivo Caminho absoluto do `.mjs`.
 * @returns {string[]} Caminhos absolutos importados.
 */
function acharImportacoes(arquivo) {
  const texto = readFileSync(arquivo, 'utf8');
  const relativos = PADROES_IMPORTACAO.flatMap(
    (padrao) => [...texto.matchAll(padrao)].map((achado) => achado[1]),
  );
  return relativos.map((relativo) => resolve(dirname(arquivo), relativo));
}

/**
 * Lista os arquivos do Jev alcançados pelas importações dos ganchos.
 * @returns {string[]} Caminhos relativos a `scripts/jev/` (com `/`), em ordem alfabética.
 * @throws {Error} Se um gancho importar arquivo que não existe ou fora de `scripts/jev/`.
 */
export function listarArquivosJev() {
  const visitados = new Set();
  const pendentes = RAIZES_JEV.map((raiz) => join(PASTA_JEV, raiz));
  while (pendentes.length > 0) {
    const arquivo = pendentes.pop();
    if (visitados.has(arquivo)) continue;
    const relativo = relative(PASTA_JEV, arquivo);
    const estaFora = relativo.startsWith('..') || !existsSync(arquivo);
    if (estaFora) throw new Error(`importação do Jev fora do pacote ou ausente: ${relativo}`);
    visitados.add(arquivo);
    pendentes.push(...acharImportacoes(arquivo));
  }
  return [...visitados].map((arquivo) => relative(PASTA_JEV, arquivo).replaceAll('\\', '/'))
    .sort();
}

/**
 * Monta o pacote: caminho no projeto (relativo a `rules-local/`) → caminho na fonte. Na nuvem,
 * `jev/<x>` vem de `scripts/jev/<x>` e `<nome>.mjs` vem de `scripts/rules-local/<nome>.mjs`.
 * @returns {{destino: string, fonte: string}[]} Scripts do `rules-local/` e arquivos do Jev.
 */
export function montarPacote() {
  const scripts = listarScriptsRulesLocal().map((nome) => ({
    destino: nome, fonte: join(PASTA_SCRIPTS_RULES_LOCAL, nome),
  }));
  const jev = listarArquivosJev().map((caminho) => ({
    destino: `${PREFIXO_JEV}/${caminho}`, fonte: join(PASTA_JEV, caminho),
  }));
  return [...scripts, ...jev];
}
