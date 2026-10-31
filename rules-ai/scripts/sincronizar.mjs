// Liga a pasta `regras/` aos arquivos globais de cada IA (bloco gerenciado, sem tocar no resto).
// Uso: node scripts/sincronizar.mjs            -> só mostra o que faria (nada é gravado)
//      node scripts/sincronizar.mjs --aplicar  -> grava, com cópia .bak do arquivo original
// Também instala o gancho de prompt do Jev (Claude Code e Codex): scripts/jev/ganchos/instalar.mjs
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sincronizarGanchos } from './jev/ganchos/instalar.mjs';
import { montarPacote } from './pacote-rules-local.mjs';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PASTA_REGRAS = join(RAIZ, 'regras');
const ARQUIVO_UNIFICADO = join(RAIZ, 'dist', 'REGRAS-GLOBAIS.md');
const ARQUIVO_VERSAO = join(RAIZ, 'VERSAO.md');
const ARQUIVO_INDICE = 'INDEX.md';
const TAMANHO_CODIGO_ARQUIVO = 16;
const TAMANHO_CODIGO_VERSAO = 8;
const FUSO_DA_VERSAO = 'America/Sao_Paulo';
const URL_FONTE_REGRAS = 'https://github.com/Gelvazio/rules-ai/tree/main/regras';
const DESCRICAO_ALGORITMO = 'sha256 do texto (sem BOM, fim de linha LF); '
  + `${TAMANHO_CODIGO_ARQUIVO} caracteres por arquivo, ${TAMANHO_CODIGO_VERSAO} na versão`;
/** Linha da versão na `VERSAO.md`: `- **Versão:** AAAA-MM-DD-<código>`. */
const PADRAO_LINHA_VERSAO = /^- \*\*Versão:\*\* (\d{4}-\d{2}-\d{2}-[0-9a-f]{8})$/m;
/** Link de regra local no índice: `](nome.md)`, sem barra no nome. */
const PADRAO_LINK_INDICE = /\]\(([^/()\s]+\.md)\)/g;
const MARCA_INICIO = '<!-- rules-ai:inicio (gerado por C:/fontes/rules-ai; não editar) -->';
const MARCA_FIM = '<!-- rules-ai:fim -->';
const APLICAR = process.argv.includes('--aplicar');
/** Pasta de configuração do usuário: %APPDATA% no Windows, ~/.config nos outros sistemas. */
const PASTA_CONFIG_USUARIO = process.env.APPDATA ?? join(homedir(), '.config');
/** Pasta de configuração do Hermes Agent: %LOCALAPPDATA%\hermes no Windows, ~/.hermes nos outros. */
const PASTA_HERMES = process.env.LOCALAPPDATA
  ? join(process.env.LOCALAPPDATA, 'hermes')
  : join(homedir(), '.hermes');

/**
 * Destinos: `importar` usa `@arquivo` (a IA lê o unificado); `embutir` copia o texto.
 * `criarPasta` cria a pasta do arquivo quando ela ainda não existe (só com --aplicar).
 * Cursor (regras do usuário só nas configurações) e DeepSeek ficam de fora: sem arquivo global.
 */
const DESTINOS = [
  { ia: 'Claude Code', arquivo: join(homedir(), '.claude', 'CLAUDE.md'), modo: 'importar' },
  // Contas extras do Claude Code (CLAUDE_CONFIG_DIR); sem isto as regras não carregam nelas
  ...['A', 'B', 'C'].map((conta) => ({
    ia: `Claude Code (conta${conta})`,
    arquivo: join(homedir(), `.claude-conta${conta}`, 'CLAUDE.md'),
    modo: 'importar',
  })),
  // Gemini CLI recusa @import fora da pasta do GEMINI.md global ("Path traversal attempt")
  { ia: 'Gemini CLI', arquivo: join(homedir(), '.gemini', 'GEMINI.md'), modo: 'embutir' },
  { ia: 'Codex', arquivo: join(homedir(), '.codex', 'AGENTS.md'), modo: 'embutir' },
  { ia: 'Grok', arquivo: join(homedir(), '.grok', 'AGENTS.md'), modo: 'embutir' },
  { ia: 'Qoder', arquivo: join(homedir(), '.qoder', 'AGENTS.md'), modo: 'embutir' },
  { ia: 'opencode', arquivo: join(homedir(), '.config', 'opencode', 'AGENTS.md'), modo: 'embutir' },
  { ia: 'Devin', arquivo: join(PASTA_CONFIG_USUARIO, 'devin', 'AGENTS.md'), modo: 'embutir' },
  {
    ia: 'Kiro',
    arquivo: join(homedir(), '.kiro', 'steering', 'rules-ai.md'),
    modo: 'embutir',
    criarPasta: true,
  },
  // Hermes Agent: o único arquivo global é o SOUL.md em HERMES_HOME; sem @import, então embutir
  { ia: 'Hermes Agent', arquivo: join(PASTA_HERMES, 'SOUL.md'), modo: 'embutir' },
  // Kilo Code: lê ~/.config/kilo/AGENTS.md em toda sessão e não usa o @import do rules-ai
  {
    ia: 'Kilo Code',
    arquivo: join(homedir(), '.config', 'kilo', 'AGENTS.md'),
    modo: 'embutir',
    criarPasta: true,
  },
];

/**
 * Lê do `regras/INDEX.md` a ordem dos arquivos linkados (só arquivos locais, sem `/`).
 * @returns {string[]} Nomes dos arquivos na ordem do índice, sem repetir; vazio sem índice.
 */
function lerOrdemDoIndice() {
  const caminho = join(PASTA_REGRAS, ARQUIVO_INDICE);
  if (!existsSync(caminho)) return [];

  const texto = readFileSync(caminho, 'utf8');
  const nomes = [...texto.matchAll(PADRAO_LINK_INDICE)].map((achado) => achado[1]);
  return [...new Set(nomes)].filter((nome) => nome !== ARQUIVO_INDICE);
}

/**
 * Monta a lista final de regras: primeiro as do índice, na ordem dele; depois as que
 * não estão no índice (alfabética, com aviso). Sem índice, tudo em ordem alfabética.
 * @returns {string[]} Nomes dos arquivos de `regras/` que entram no unificado.
 */
function listarArquivosDeRegras() {
  const existentes = readdirSync(PASTA_REGRAS)
    .filter((nome) => nome.endsWith('.md') && nome !== ARQUIVO_INDICE)
    .sort();
  const ordemDoIndice = lerOrdemDoIndice();

  const inexistentes = ordemDoIndice.filter((nome) => !existentes.includes(nome));
  inexistentes.forEach((nome) => {
    console.warn(`aviso: ${ARQUIVO_INDICE} aponta para "${nome}", que não existe (ignorado)`);
  });

  const indexadas = ordemDoIndice.filter((nome) => existentes.includes(nome));
  const foraDoIndice = existentes.filter((nome) => !indexadas.includes(nome));
  if (ordemDoIndice.length > 0) {
    foraDoIndice.forEach((nome) => {
      console.warn(`aviso: "${nome}" não está no ${ARQUIVO_INDICE}; inclua-o no índice`);
    });
  }
  return [...indexadas, ...foraDoIndice];
}

/**
 * Junta os arquivos de `regras/` em um texto único, na ordem do `regras/INDEX.md`
 * (o próprio índice fica de fora; sem índice, ordem alfabética).
 * @returns {string} Texto unificado das regras globais.
 */
function montarUnificado() {
  const nomes = listarArquivosDeRegras();
  const partes = nomes.map((nome) => readFileSync(join(PASTA_REGRAS, nome), 'utf8').trim());
  const cabecalho = '# Regras globais de IA (fonte: C:/fontes/rules-ai/regras)\n\n'
    + 'Valem em todos os projetos. A regra do projeto (`AGENTS.md`/`CLAUDE.md`) vale no projeto; '
    + 'divergências entre projetos ficam em `C:/fontes/rules-ai/CONFLITOS.md` '
    + 'até o usuário decidir.';
  return `${cabecalho}\n\n${partes.join('\n\n---\n\n')}\n`;
}

/**
 * Monta o bloco gerenciado de um destino.
 * @param {{modo: string}} destino - Destino com o modo de ligação.
 * @param {string} unificado - Texto unificado das regras.
 * @returns {string} Bloco entre as marcas de início e fim.
 */
function montarBloco(destino, unificado) {
  const corpo = destino.modo === 'importar'
    ? `@${ARQUIVO_UNIFICADO.replaceAll('\\', '/')}`
    : unificado;
  return `${MARCA_INICIO}\n${corpo.trim()}\n${MARCA_FIM}\n`;
}

/**
 * Troca o bloco gerenciado no texto, ou o acrescenta no fim se ainda não existir.
 * @param {string} atual - Conteúdo atual do arquivo.
 * @param {string} bloco - Bloco novo.
 * @returns {string} Conteúdo atualizado.
 */
function aplicarBloco(atual, bloco) {
  const inicio = atual.indexOf(MARCA_INICIO);
  const fim = atual.indexOf(MARCA_FIM);
  const temBloco = inicio !== -1 && fim > inicio;
  if (!temBloco) return `${atual.replace(/\s+$/, '')}\n\n${bloco}`;

  return atual.slice(0, inicio) + bloco + atual.slice(fim + MARCA_FIM.length).replace(/^\r?\n/, '');
}

/**
 * Sincroniza um destino (ou só informa, sem --aplicar).
 * @param {{ia: string, arquivo: string, modo: string, criarPasta?: boolean}} destino - Destino.
 * @param {string} unificado - Texto unificado das regras.
 */
function sincronizarDestino(destino, unificado) {
  const pastaArquivo = dirname(destino.arquivo);
  const pastaDaIa = destino.criarPasta ? dirname(pastaArquivo) : pastaArquivo;
  if (!existsSync(pastaDaIa)) return console.log(`pulado   ${destino.ia}: pasta não existe`);

  const atual = existsSync(destino.arquivo) ? readFileSync(destino.arquivo, 'utf8') : '';
  const novo = aplicarBloco(atual, montarBloco(destino, unificado));
  if (novo === atual) return console.log(`igual    ${destino.ia}: ${destino.arquivo}`);
  if (!APLICAR) return console.log(`mudaria  ${destino.ia}: ${destino.arquivo} (use --aplicar)`);

  mkdirSync(pastaArquivo, { recursive: true });
  if (atual) copyFileSync(destino.arquivo, `${destino.arquivo}.bak`);
  writeFileSync(destino.arquivo, novo, 'utf8');
  console.log(`gravado  ${destino.ia}: ${destino.arquivo}`);
}

/**
 * Normaliza o texto antes do código: sem BOM no início e com fim de linha LF.
 * @param {string} texto - Texto original.
 * @returns {string} Texto normalizado.
 */
const normalizarTexto = (texto) => texto.replace(/^﻿/, '').replace(/\r\n/g, '\n');

/**
 * Calcula o código (SHA-256 em hexadecimal) do texto normalizado.
 * @param {string} texto - Texto original.
 * @param {number} tamanho - Quantidade de caracteres do código.
 * @returns {string} Primeiros `tamanho` caracteres do SHA-256.
 */
const calcularCodigo = (texto, tamanho) =>
  createHash('sha256').update(normalizarTexto(texto), 'utf8').digest('hex').slice(0, tamanho);

/**
 * Lista as regras da `VERSAO.md` com o código de cada uma: o índice primeiro, depois as demais.
 * @returns {{arquivo: string, codigo: string}[]} Regras na ordem da tabela.
 */
function listarCodigosDasRegras() {
  const nomes = [ARQUIVO_INDICE, ...listarArquivosDeRegras()];
  return nomes.map((arquivo) => {
    const texto = readFileSync(join(PASTA_REGRAS, arquivo), 'utf8');
    return { arquivo, codigo: calcularCodigo(texto, TAMANHO_CODIGO_ARQUIVO) };
  });
}

/**
 * Calcula o código do conteúdo (da versão) a partir das linhas `<arquivo> <código>`.
 * @param {{arquivo: string, codigo: string}[]} regras - Regras na ordem da tabela.
 * @returns {string} Código do conteúdo.
 */
function calcularCodigoDoConteudo(regras) {
  const linhas = regras.map(({ arquivo, codigo }) => `${arquivo} ${codigo}\n`).join('');
  return calcularCodigo(linhas, TAMANHO_CODIGO_VERSAO);
}

/**
 * Lista o pacote do `rules-local/` (scripts e Jev) com o código de cada arquivo
 * (RULES-LOCAL-JEV.2).
 * @returns {{arquivo: string, codigo: string}[]} Caminho no projeto (relativo a `rules-local/`).
 */
function listarCodigosDoPacote() {
  return montarPacote().map(({ destino, fonte }) => ({
    arquivo: destino, codigo: calcularCodigo(readFileSync(fonte, 'utf8'), TAMANHO_CODIGO_ARQUIVO),
  }));
}

/**
 * Monta a seção do pacote da `VERSAO.md`. Fica fora do código da versão (que cobre só as regras)
 * para os `sessao.mjs` antigos dos projetos continuarem lendo a `VERSAO.md`; eles ignoram as
 * linhas com `/` e ressincronizam porque o texto mudou.
 * @param {{arquivo: string, codigo: string}[]} pacote - Arquivos do pacote.
 * @returns {string[]} Linhas da seção.
 */
function montarSecaoPacote(pacote) {
  const linhas = pacote.map(
    ({ arquivo, codigo }, indice) => `| ${indice} | ${arquivo} | ${codigo} |`,
  );
  return [
    '## Pacote do rules-local (scripts e Jev)',
    '',
    `- **Código do pacote:** ${calcularCodigoDoConteudo(pacote)}`,
    '',
    '| # | Arquivo | Código |',
    '|---|---------|--------|',
    ...linhas,
    '',
  ];
}

/**
 * Monta o texto da `VERSAO.md`.
 * @param {string} versao - Versão `AAAA-MM-DD-<código do conteúdo>`.
 * @param {{arquivo: string, codigo: string}[]} regras - Regras na ordem da tabela.
 * @param {{arquivo: string, codigo: string}[]} pacote - Pacote do `rules-local/`.
 * @returns {string} Conteúdo do arquivo, terminado em `\n`.
 */
function montarVersao(versao, regras, pacote) {
  const linhasRegras = regras.map(
    ({ arquivo, codigo }, indice) => `| ${indice} | ${arquivo} | ${codigo} |`,
  );
  return [
    '# VERSAO — regras globais do rules-ai',
    '',
    '<!-- gerado por scripts/sincronizar.mjs; não editar -->',
    '',
    `- **Versão:** ${versao}`,
    `- **Algoritmo:** ${DESCRICAO_ALGORITMO}`,
    `- **Fonte:** ${URL_FONTE_REGRAS}`,
    '',
    '## Regras',
    '',
    '| # | Arquivo | Código |',
    '|---|---------|--------|',
    ...linhasRegras,
    '',
    ...montarSecaoPacote(pacote),
  ].join('\n');
}

/**
 * Grava a `VERSAO.md` na raiz, sem mexer nela se nada mudou (R1.2). A data e o código da versão
 * só mudam quando as regras mudam; mudança só no pacote regrava a tabela com a versão atual.
 */
function gravarVersao() {
  const regras = listarCodigosDasRegras();
  const codigoConteudo = calcularCodigoDoConteudo(regras);
  const pacote = listarCodigosDoPacote();
  const atual = existsSync(ARQUIVO_VERSAO) ? readFileSync(ARQUIVO_VERSAO, 'utf8') : '';
  const versaoAtual = atual.match(PADRAO_LINHA_VERSAO)?.[1] ?? '';
  const regrasIguais = versaoAtual.endsWith(`-${codigoConteudo}`);
  const textoComVersaoAtual = montarVersao(versaoAtual, regras, pacote);
  if (regrasIguais && textoComVersaoAtual === atual) {
    return console.log(`versão sem mudança: ${versaoAtual}`);
  }

  const hoje = new Date().toLocaleDateString('en-CA', { timeZone: FUSO_DA_VERSAO });
  const versao = regrasIguais ? versaoAtual : `${hoje}-${codigoConteudo}`;
  writeFileSync(ARQUIVO_VERSAO, montarVersao(versao, regras, pacote), 'utf8');
  console.log(`versão gravada: ${versao} (${ARQUIVO_VERSAO})`);
}

/**
 * Confere que `regras/` é igual ao que está no GitHub (`origin/main`), sem arquivo local solto.
 * A sincronização só pode sair do GitHub (pedido do usuário, 2026-10-24).
 * @returns {{ok: boolean, motivo: string}} `ok` true quando a pasta bate com o remoto.
 */
function conferirRegrasComGitHub() {
  const opcoes = { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] };
  try {
    execFileSync('git', ['fetch', '--quiet', 'origin', 'main'], opcoes);
    execFileSync('git', ['diff', '--quiet', 'origin/main', '--', 'regras'], opcoes);
  } catch {
    return { ok: false, motivo: 'regras/ difere de origin/main (commit e push antes de sincronizar)' };
  }
  const naoRastreados = execFileSync('git', ['ls-files', '--others', '--exclude-standard', 'regras'], opcoes);
  if (naoRastreados.trim()) {
    return { ok: false, motivo: 'há arquivo em regras/ que não está no GitHub' };
  }
  return { ok: true, motivo: 'regras/ igual a origin/main' };
}

/** Gera o unificado, sincroniza todos os destinos e o gancho de prompt do Jev (C43). */
function principal() {
  const origem = conferirRegrasComGitHub();
  if (!origem.ok) {
    console.error(`sincronização recusada: ${origem.motivo}. Fonte única: https://github.com/Gelvazio/rules-ai`);
    process.exit(1);
  }
  console.log(`origem: ${origem.motivo}`);
  const unificado = montarUnificado();
  mkdirSync(dirname(ARQUIVO_UNIFICADO), { recursive: true });
  writeFileSync(ARQUIVO_UNIFICADO, unificado, 'utf8');
  console.log(`unificado: ${ARQUIVO_UNIFICADO}`);
  gravarVersao();
  DESTINOS.forEach((destino) => sincronizarDestino(destino, unificado));
  sincronizarGanchos({ aplicar: APLICAR });
}

principal();
