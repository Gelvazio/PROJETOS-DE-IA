/**
 * Acesso somente-leitura aos repositórios dos projetos: descoberta de pastas e leitura de
 * arquivos do `origin/main` pelo Git. Nada aqui grava em projeto algum.
 */

import { execFile } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MEGABYTE = 1024 * 1024;
const LIMITE_SAIDA_GIT = 64 * MEGABYTE;
const MILISSEGUNDOS_POR_SEGUNDO = 1000;
const PREFIXO_PASTA_PROIBIDA = 'demais-projetos-';
const SEPARADOR_RAMO = '/';
const CODIGO_FALHA_GENERICA = 1;

/**
 * Roda `git -C <pasta> ...` sem shell e devolve código, saída e erro (nunca lança).
 * @param {string} pasta - Pasta do repositório.
 * @param {string[]} argumentos - Argumentos do Git.
 * @param {number} timeoutSegundos - Tempo máximo.
 * @returns {Promise<{codigo: number, saida: string, erro: string}>} Resultado do comando.
 */
function executarGit(pasta, argumentos, timeoutSegundos) {
  const opcoes = {
    encoding: 'utf8',
    maxBuffer: LIMITE_SAIDA_GIT,
    timeout: timeoutSegundos * MILISSEGUNDOS_POR_SEGUNDO,
    windowsHide: true,
  };
  return new Promise((resolver) => {
    execFile('git', ['-C', pasta, ...argumentos], opcoes, (falha, saida, erro) => {
      const codigoDaFalha = typeof falha?.code === 'number' ? falha.code : CODIGO_FALHA_GENERICA;
      const codigo = falha ? codigoDaFalha : 0;
      resolver({ codigo, saida: saida ?? '', erro: erro || (falha?.message ?? '') });
    });
  });
}

/**
 * Diz se o nome de pasta é uma das proibidas (`DEMAIS-PROJETOS-*`, regras C20 e C23).
 * @param {string} nome - Nome da pasta.
 * @returns {boolean} true se for proibida.
 */
export function ehPastaProibida(nome) {
  return nome.toLowerCase().startsWith(PREFIXO_PASTA_PROIBIDA);
}

/**
 * Converte um padrão simples com `*` em expressão regular (sem diferenciar maiúsculas).
 * @param {string} padrao - Padrão como `dashboard-ai-*`.
 * @returns {RegExp} Expressão que casa o nome inteiro.
 */
function padraoParaRegex(padrao) {
  const escapado = padrao.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escapado}$`, 'i');
}

/**
 * Acha as pastas da raiz que casam com o padrão da configuração (nome exato ou com `*`).
 * Nunca devolve pasta `DEMAIS-PROJETOS-*`.
 * @param {string} raiz - Pasta que guarda os projetos (ex.: C:/fontes).
 * @param {string} padrao - Nome da pasta ou padrão com `*`.
 * @returns {string[]} Nomes das pastas encontradas, em ordem alfabética.
 */
export function descobrirPastas(raiz, padrao) {
  if (ehPastaProibida(padrao)) return [];
  if (!padrao.includes('*')) {
    return existsSync(join(raiz, padrao)) ? [padrao] : [];
  }
  const regex = padraoParaRegex(padrao);
  return readdirSync(raiz)
    .filter((nome) => regex.test(nome) && !ehPastaProibida(nome))
    .filter((nome) => statSync(join(raiz, nome)).isDirectory())
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Diz se a pasta é um repositório Git (tem `.git`, pasta ou arquivo).
 * @param {string} pasta - Caminho da pasta.
 * @returns {boolean} true se for repositório.
 */
export function ehRepositorioGit(pasta) {
  return existsSync(join(pasta, '.git'));
}

/**
 * Lê a URL do remoto `origin` (usada para não ler duas vezes clones do mesmo repositório).
 * @param {string} pasta - Pasta do repositório.
 * @param {number} timeoutSegundos - Tempo máximo.
 * @returns {Promise<string|null>} URL, ou null se não houver.
 */
export async function lerOrigem(pasta, timeoutSegundos) {
  const resultado = await executarGit(pasta, ['remote', 'get-url', 'origin'], timeoutSegundos);
  return resultado.codigo === 0 ? resultado.saida.trim() : null;
}

/**
 * Atualiza só a referência remota (`git fetch origin main`); não mexe na pasta de trabalho.
 * @param {string} pasta - Pasta do repositório.
 * @param {string} ramo - Ramo remoto, como `origin/main`.
 * @param {number} timeoutSegundos - Tempo máximo.
 * @returns {Promise<{ok: boolean, erro: string}>} Se deu certo e a mensagem de erro.
 */
export async function atualizarRemoto(pasta, ramo, timeoutSegundos) {
  const [remoto, ...resto] = ramo.split(SEPARADOR_RAMO);
  const argumentos = ['fetch', remoto, resto.join(SEPARADOR_RAMO)];
  const resultado = await executarGit(pasta, argumentos, timeoutSegundos);
  return { ok: resultado.codigo === 0, erro: resultado.erro.trim() };
}

/**
 * Lê o hash curto do commit do ramo remoto.
 * @param {string} pasta - Pasta do repositório.
 * @param {string} ramo - Ramo remoto, como `origin/main`.
 * @param {number} timeoutSegundos - Tempo máximo.
 * @returns {Promise<string|null>} Hash curto, ou null se o ramo não existir.
 */
export async function lerCommit(pasta, ramo, timeoutSegundos) {
  const resultado = await executarGit(pasta, ['rev-parse', '--short', ramo], timeoutSegundos);
  return resultado.codigo === 0 ? resultado.saida.trim() : null;
}

/**
 * Lê o primeiro dos arquivos candidatos que existir no ramo remoto (`git show ramo:arquivo`).
 * @param {string} pasta - Pasta do repositório.
 * @param {string} ramo - Ramo remoto, como `origin/main`.
 * @param {{candidatos: string[], timeoutSegundos: number}} opcoes - Caminhos e tempo máximo.
 * @returns {Promise<{caminho: string, texto: string}|null>} Arquivo lido, ou null.
 */
export async function lerArquivoDoRamo(pasta, ramo, opcoes) {
  for (const caminho of opcoes.candidatos) {
    const argumentos = ['show', `${ramo}:${caminho}`];
    const resultado = await executarGit(pasta, argumentos, opcoes.timeoutSegundos);
    if (resultado.codigo === 0) return { caminho, texto: resultado.saida };
  }
  return null;
}
