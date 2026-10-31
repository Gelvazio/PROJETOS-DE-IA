#!/usr/bin/env node
/**
 * Grava o marker `.ai-memory.toml` na raiz de um projeto (AI-MEMORY-INTEGRATION.7).
 *
 * Uso: node scripts/instalar-ai-memory.mjs <pasta-do-projeto> [--dry-run] [--nome <projeto>]
 *        [--hooks [--mesmo-com-global]]
 *
 * - Idempotente: marker já existente nunca é sobrescrito.
 * - `--dry-run` mostra o que gravaria e não grava nada.
 * - Recusa projeto dentro de `DEMAIS-PROJETOS-*` (C20, C23) sem abrir a pasta.
 * - `--hooks` (.8) acrescenta ao fim de cada evento do `.claude/settings.json` do projeto
 *   as entradas do ai-memory, sem tocar nas demais (sessao.mjs, Jev, permissões, deny).
 *   Evento que o escopo global já entrega é pulado (evita captura em dobro), salvo
 *   `--mesmo-com-global`. Reexecução não duplica.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { basename, join, resolve, sep } from 'node:path';

const NOME_MARKER = '.ai-memory.toml';
const PREFIXO_PASTA_PROIBIDA = 'demais-projetos-';
const WORKSPACE_PADRAO = 'default';
const PASTA_RAIZ_FONTES = 'rules-ai';
const CODIGO_ERRO = 1;
const SERVIDOR_URL = 'http://127.0.0.1:49374';
const EVENTOS_HOOK = {
  SessionStart: 'session-start',
  PostToolUse: 'post-tool-use',
};

const IGNORE_PATHS = [
  '.env', '**/.env', '.env.*', '**/.env.*',
  '.mcp.json', '**/.mcp.json',
  'scripts/variaveis.js', '**/variaveis.js',
  'tasks/**', 'rules-local/**', 'graphify-out/**',
  '**/gabarito*/**', '**/*gabarito*',
  '**/*alunos*.csv', '**/*alunos*.xlsx', '**/*alunos*.json',
  '*.pdf', '**/*.pdf',
  'node_modules/**', '**/node_modules/**',
  'DEMAIS-PROJETOS-*/**',
  // Formas da raiz (AI-MEMORY-INTEGRATION.43): `**` + `/` exige ao menos uma pasta.
  'variaveis.js', 'gabarito*/**', '*gabarito*',
  '*alunos*.csv', '*alunos*.xlsx', '*alunos*.json',
  // Privacidade (docs/AI-MEMORY-PRIVACIDADE.md): currículos, alunos, chamada, documentos.
  '*curriculo*', '**/*curriculo*', '*currículo*', '**/*currículo*',
  '*curriculum*', '**/*curriculum*', '*cv*.docx', '**/*cv*.docx',
  'PLATAFORMA-ENVIO-CURRICULOS/**',
  'MATERIAIS/**', '**/MATERIAIS/**',
  '*alunos*.xls', '**/*alunos*.xls', '*alunos*.md', '**/*alunos*.md',
  '*alunos*.txt', '**/*alunos*.txt',
  '*chamada*', '**/*chamada*', '*matricula*', '**/*matricula*',
  '*notas*.csv', '**/*notas*.csv', '*notas*.xlsx', '**/*notas*.xlsx',
  'projetos-alunos/**', '**/projetos-alunos/**',
  '*.docx', '**/*.docx', '*.xlsx', '**/*.xlsx',
  '*cpf*', '**/*cpf*',
  // `*rg*.*` do doc pegaria "merge.js"; só rg como palavra do nome.
  'rg.*', '**/rg.*', '*-rg.*', '**/*-rg.*', '*_rg.*', '**/*_rg.*',
];

/**
 * Diz se o caminho está dentro de uma pasta `DEMAIS-PROJETOS-*`, só pelo texto do caminho.
 * @param {string} caminho Caminho absoluto do projeto.
 * @returns {boolean} true se algum trecho do caminho começa com o prefixo proibido.
 */
function estaEmPastaProibida(caminho) {
  return caminho.toLowerCase().split(sep).some((trecho) =>
    trecho.startsWith(PREFIXO_PASTA_PROIBIDA));
}

/**
 * Deduz o nome do projeto: remoto Git sem host em minúsculas, ou o nome da pasta.
 * @param {string} pasta Pasta do projeto.
 * @returns {string} Nome do projeto para o marker.
 */
function deduzirNome(pasta) {
  try {
    const remoto = execFileSync('git', ['-C', pasta, 'remote', 'get-url', 'origin'], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const partes = remoto.replace(/\.git$/, '').split(/[/:]/).filter(Boolean);
    if (partes.length >= 2) return partes.slice(-2).join('-').toLowerCase();
  } catch {
    // sem Git ou sem remoto: cai no nome da pasta
  }
  return basename(pasta).toLowerCase();
}

/**
 * Monta o texto do `.ai-memory.toml`.
 * @param {string} nome Nome do projeto.
 * @returns {string} Conteúdo do marker.
 */
function montarMarker(nome) {
  const linhas = IGNORE_PATHS.map((padrao) => `  "${padrao}",`).join('\n');
  return [
    `# ${NOME_MARKER} gerado por rules-ai/scripts/instalar-ai-memory.mjs`,
    `workspace = "${WORKSPACE_PADRAO}"`,
    `project = "${nome}"`,
    '',
    '[capture]',
    'ignore_paths = [',
    linhas,
    ']',
    '',
  ].join('\n');
}

/**
 * Lê os argumentos da linha de comando.
 * @param {string[]} argv Argumentos sem node e script.
 * @returns {{pasta: string|null, dryRun: boolean, nome: string|null,
 *   hooks: boolean, mesmoComGlobal: boolean}} Opções.
 */
function lerArgumentos(argv) {
  const opcoes = { pasta: null, dryRun: false, nome: null, hooks: false, mesmoComGlobal: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--dry-run') opcoes.dryRun = true;
    else if (argv[i] === '--hooks') opcoes.hooks = true;
    else if (argv[i] === '--mesmo-com-global') opcoes.mesmoComGlobal = true;
    else if (argv[i] === '--nome') { i += 1; opcoes.nome = argv[i] ?? null; }
    else opcoes.pasta = argv[i];
  }
  return opcoes;
}

/**
 * Valida o projeto e devolve o motivo da recusa, ou null se pode instalar.
 * @param {string|null} pasta Caminho informado.
 * @returns {string|null} Motivo da recusa.
 */
function motivoDaRecusa(pasta) {
  if (!pasta) return 'informe a pasta do projeto';
  const absoluta = resolve(pasta);
  if (estaEmPastaProibida(absoluta)) return 'projeto em DEMAIS-PROJETOS-* (C20, C23)';
  if (basename(absoluta) === PASTA_RAIZ_FONTES) return 'rules-ai é a fonte, não recebe marker';
  if (!existsSync(absoluta)) return `pasta não existe: ${absoluta}`;
  return null;
}

/**
 * Lê um JSON de configuração; arquivo ausente vira objeto vazio.
 * @param {string} arquivo Caminho do JSON.
 * @returns {object} Conteúdo.
 * @throws {Error} Se o JSON for inválido (nada é gravado).
 */
function lerJson(arquivo) {
  if (!existsSync(arquivo)) return {};
  return JSON.parse(readFileSync(arquivo, 'utf8'));
}

/**
 * Caminho do `settings.json` global do Claude Code.
 * @returns {string} Arquivo do escopo de usuário.
 */
function caminhoSettingsGlobal() {
  const base = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude');
  return join(base, 'settings.json');
}

/**
 * Diz se a entrada de evento é do ai-memory para o evento dado.
 * @param {object} entrada Entrada do array do evento.
 * @param {string} evento Nome do evento do ai-memory (ex.: `session-start`).
 * @returns {boolean} true se algum comando é o ai-memory daquele evento.
 */
function ehHookAiMemory(entrada, evento) {
  return (entrada?.hooks ?? []).some((gancho) =>
    String(gancho.command ?? '').toLowerCase().includes('ai-memory')
    && (gancho.args ?? []).includes(evento));
}

/**
 * Monta a entrada de hook do ai-memory (formato do `install-hooks`, sem `timeout`).
 * @param {string} evento Nome do evento do ai-memory.
 * @returns {object} Entrada para o array do evento.
 */
function montarHook(evento) {
  const local = process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local');
  const comando = join(local, 'Programs', 'ai-memory', 'ai-memory.exe');
  const args = ['--data-dir', join(local, 'ai-memory'), 'hook', '--event', evento,
    '--agent', 'claude-code', '--server-url', SERVIDOR_URL];
  return { matcher: '', hooks: [{ type: 'command', command: comando, args }] };
}

/**
 * Acrescenta ao fim de cada evento as entradas do ai-memory que faltam, sem tocar no resto.
 * @param {object} configuracao `settings.json` do projeto (alterado no lugar).
 * @param {object} globalSettings `settings.json` global, para evitar captura em dobro.
 * @param {boolean} mesmoComGlobal Se true, não pula evento que o global já entrega.
 * @returns {{adicionados: string[], jaExistem: string[], puladosGlobal: string[]}} Resumo.
 */
function acrescentarHooks(configuracao, globalSettings, mesmoComGlobal) {
  const resumo = { adicionados: [], jaExistem: [], puladosGlobal: [] };
  for (const [nomeEvento, evento] of Object.entries(EVENTOS_HOOK)) {
    const lista = configuracao.hooks?.[nomeEvento] ?? [];
    const noGlobal = (globalSettings.hooks?.[nomeEvento] ?? []).some((e) =>
      ehHookAiMemory(e, evento));
    if (lista.some((e) => ehHookAiMemory(e, evento))) resumo.jaExistem.push(nomeEvento);
    else if (noGlobal && !mesmoComGlobal) resumo.puladosGlobal.push(nomeEvento);
    else {
      configuracao.hooks = { ...(configuracao.hooks ?? {}),
        [nomeEvento]: [...lista, montarHook(evento)] };
      resumo.adicionados.push(nomeEvento);
    }
  }
  return resumo;
}

/**
 * Instala os hooks no `.claude/settings.json` do projeto (só grava se mudou e sem dry-run).
 * @param {string} raiz Pasta do projeto.
 * @param {{dryRun: boolean, mesmoComGlobal: boolean}} opcoes Opções.
 * @returns {number} Código de saída.
 */
function instalarHooks(raiz, { dryRun, mesmoComGlobal }) {
  const arquivo = join(raiz, '.claude', 'settings.json');
  const configuracao = lerJson(arquivo);
  const resumo = acrescentarHooks(configuracao, lerJson(caminhoSettingsGlobal()), mesmoComGlobal);
  console.log(`ai-memory: hooks — adicionar: ${resumo.adicionados.join(', ') || '—'}; `
    + `já existem: ${resumo.jaExistem.join(', ') || '—'}`
    + (resumo.puladosGlobal.length
      ? `; pulados (global já entrega): ${resumo.puladosGlobal.join(', ')}` : ''));
  if (dryRun || resumo.adicionados.length === 0) return 0;
  mkdirSync(join(raiz, '.claude'), { recursive: true });
  writeFileSync(arquivo, `${JSON.stringify(configuracao, null, 2)}\n`, 'utf8');
  console.log(`ai-memory: gravado ${arquivo}`);
  return 0;
}

/**
 * Grava (ou confere) o marker do projeto.
 * @param {string} raiz Pasta do projeto.
 * @param {{dryRun: boolean, nome: string|null}} opcoes Opções.
 * @returns {number} Código de saída.
 */
function instalarMarker(raiz, { dryRun, nome }) {
  const destino = join(raiz, NOME_MARKER);
  if (existsSync(destino)) {
    console.log(`ai-memory: ${NOME_MARKER} já existe; nada a fazer (${destino}).`);
    return 0;
  }
  const texto = montarMarker(nome ?? deduzirNome(raiz));
  if (dryRun) {
    console.log(`ai-memory: [dry-run] gravaria ${destino}:\n${texto}`);
    return 0;
  }
  writeFileSync(destino, texto, 'utf8');
  console.log(`ai-memory: gravado ${destino}`);
  return 0;
}

/**
 * Executa a instalação (marker e, com `--hooks`, os hooks).
 * @returns {number} Código de saída.
 */
function principal() {
  const opcoes = lerArgumentos(process.argv.slice(2));
  const motivo = motivoDaRecusa(opcoes.pasta);
  if (motivo) {
    console.error(`ai-memory: recusado — ${motivo}`);
    return CODIGO_ERRO;
  }
  const raiz = resolve(opcoes.pasta);
  try {
    const codigoMarker = instalarMarker(raiz, opcoes);
    return opcoes.hooks ? instalarHooks(raiz, opcoes) || codigoMarker : codigoMarker;
  } catch (erro) {
    console.error(`ai-memory: erro — ${erro.message}`);
    return CODIGO_ERRO;
  }
}

process.exitCode = principal();
