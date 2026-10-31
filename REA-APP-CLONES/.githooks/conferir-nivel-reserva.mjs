// .githooks/conferir-nivel-reserva.mjs — chamado pelo .githooks/pre-commit.
// Recusa o commit que reserva subtarefa acima do nível do modelo da frente (regra global C2):
// cada frente pega subtarefa até o máximo do seu nível, e mais leve só se não houver do seu nível
// (aviso, não recusa; .claude/rules/multiplas-ias.md). O nível da subtarefa
// vem da coluna "Modelo" do tasks/STATUS.md; o da frente, do modelo escrito no nome dela, pela
// matriz da skill classificar-tarefa. Vale para todas as IAs (é hook do Git).
// Uso: node conferir-nivel-reserva.mjs [quadro-antes quadro-depois] (sem argumentos lê do Git).
// Saída 0 = passa, 1 = recusa. Erro do próprio script deixa passar, para não prender ninguém.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const CODIGO_PASSA = 0;
const CODIGO_RECUSA = 1;
const PREFIXO = '[pre-commit nivel]';
const CAMINHO_QUADRO = 'tasks/STATUS.md';
const VARIAVEL_ESCAPE = 'IA_SEM_TRAVA';
const VALOR_ESCAPE = '1';
const MARCA_EM_EXECUCAO = '🔄';
const MARCA_LIVRE = '—';
const NIVEIS = ['LEVE', 'MEDIO', 'PESADO'];
const COLUNA = { tarefa: 'Tarefa', modelo: 'Modelo', status: 'Status', emUsoPor: 'Em uso por' };

// Matriz da skill classificar-tarefa: a primeira expressão que bater define o nível da frente.
const MATRIZ_FRENTES = [
  { expressao: /claude code.*\b(opus|fable)\b/i, nivel: 'PESADO' },
  { expressao: /claude code.*\bsonnet\b/i, nivel: 'MEDIO' },
  { expressao: /claude code.*\bhaiku\b/i, nivel: 'LEVE' },
  { expressao: /gemini.*\bflash\b/i, nivel: 'LEVE' },
  { expressao: /gemini.*\bpro\b/i, nivel: 'MEDIO' },
  { expressao: /antigravity/i, nivel: 'LEVE' },
  { expressao: /grok.*\b(rápido|rapido|fast|mini)\b/i, nivel: 'LEVE' },
  { expressao: /grok/i, nivel: 'MEDIO' },
  { expressao: /deepseek.*\bflash\b/i, nivel: 'LEVE' },
  { expressao: /deepseek/i, nivel: 'MEDIO' },
  { expressao: /codex/i, nivel: 'MEDIO' },
  { expressao: /cursor/i, nivel: 'MEDIO' },
  { expressao: /devin/i, nivel: 'LEVE' },
];

/**
 * Lê uma versão do quadro guardada no Git; vazia se não existir (ex.: primeiro commit).
 * @param {string} referencia - `HEAD:` ou `:` (o que está no commit).
 * @returns {string} Conteúdo do quadro.
 */
function lerQuadroDoGit(referencia) {
  try {
    return execFileSync('git', ['show', `${referencia}${CAMINHO_QUADRO}`], { encoding: 'utf8' });
  } catch {
    return '';
  }
}

/**
 * Separa uma linha de tabela Markdown em colunas sem espaços nas pontas.
 * @param {string} linha - Linha que começa com "| ".
 * @returns {string[]} Colunas.
 */
function separarColunas(linha) {
  return linha.split('|').slice(1, -1).map((coluna) => coluna.trim());
}

/**
 * Lê as linhas das tabelas de tarefas, achando as colunas pelo título do cabeçalho.
 * @param {string} texto - Conteúdo do quadro.
 * @returns {Array<Record<string, string>>} Uma entrada por linha (título → valor).
 */
function lerLinhasDeTarefas(texto) {
  const linhas = [];
  let cabecalho = null;
  for (const linha of texto.split(/\r?\n/)) {
    if (linha.startsWith('|---')) continue;
    if (!linha.startsWith('| ')) {
      cabecalho = null;
      continue;
    }
    const colunas = separarColunas(linha);
    const ehCabecalho = colunas.includes(COLUNA.tarefa) && colunas.includes(COLUNA.status);
    if (ehCabecalho) cabecalho = colunas;
    else if (cabecalho) linhas.push(Object.fromEntries(cabecalho.map((t, i) => [t, colunas[i]])));
  }
  return linhas;
}

/**
 * Separa as linhas em execução reservadas por alguma frente.
 * @param {Array<Record<string, string>>} linhas - Linhas do quadro.
 * @returns {Array<Record<string, string>>} Linhas reservadas.
 */
function filtrarReservas(linhas) {
  return linhas.filter((linha) => {
    const emExecucao = (linha[COLUNA.status] ?? '').startsWith(MARCA_EM_EXECUCAO);
    const temFrente = Boolean(linha[COLUNA.emUsoPor]) && linha[COLUNA.emUsoPor] !== MARCA_LIVRE;
    return emExecucao && temFrente;
  });
}

/**
 * Chave que identifica uma reserva (mesma subtarefa pela mesma frente).
 * @param {Record<string, string>} linha - Linha reservada.
 * @returns {string} Chave.
 */
function chaveDaReserva(linha) {
  const frente = (linha[COLUNA.emUsoPor] ?? '').replace(/\s*\(desde [^)]*\)\s*$/, '');
  return `${linha[COLUNA.tarefa]}|${frente}`;
}

/**
 * Nível da subtarefa pela coluna "Modelo" (`PESADO · Opus 5.5`).
 * @param {Record<string, string>} linha - Linha do quadro.
 * @returns {string|null} Nível, ou null (sem nível ou tarefa do usuário).
 */
function nivelDaSubtarefa(linha) {
  const nivel = (linha[COLUNA.modelo] ?? '').split('·')[0].trim();
  return NIVEIS.includes(nivel) ? nivel : null;
}

/**
 * Nível da frente pelo modelo escrito no nome dela.
 * @param {string} frente - Valor de "Em uso por".
 * @returns {string|null} Nível, ou null se o modelo não estiver na matriz.
 */
function nivelDaFrente(frente) {
  const achado = MATRIZ_FRENTES.find(({ expressao }) => expressao.test(frente));
  return achado ? achado.nivel : null;
}

/**
 * Confere as reservas novas (as que estão no commit e não estavam no HEAD).
 * @param {{antes: string, depois: string}} quadros - Texto do quadro antes e depois.
 * @returns {{erros: string[], avisos: string[]}} Problemas achados.
 */
function conferirReservasNovas({ antes, depois }) {
  const existentes = new Set(filtrarReservas(lerLinhasDeTarefas(antes)).map(chaveDaReserva));
  const novas = filtrarReservas(lerLinhasDeTarefas(depois))
    .filter((linha) => !existentes.has(chaveDaReserva(linha)));
  const erros = [];
  const avisos = [];
  for (const linha of novas) {
    const codigo = linha[COLUNA.tarefa];
    const frente = linha[COLUNA.emUsoPor];
    const nivelTarefa = nivelDaSubtarefa(linha);
    const nivelFrente = nivelDaFrente(frente);
    if (!nivelTarefa) continue;
    if (!nivelFrente) {
      avisos.push(`${codigo}: modelo da frente "${frente}" fora da matriz; nível não conferido.`);
      continue;
    }
    const posicaoTarefa = NIVEIS.indexOf(nivelTarefa);
    const posicaoFrente = NIVEIS.indexOf(nivelFrente);
    if (posicaoTarefa > posicaoFrente) {
      erros.push(`${codigo} é ${nivelTarefa}, acima do máximo de "${frente}" (${nivelFrente}).`);
    }
    if (posicaoTarefa < posicaoFrente) {
      avisos.push(`${codigo} é ${nivelTarefa}, mais leve que o nível de "${frente}" ` +
        `(${nivelFrente}): só vale se não havia subtarefa livre do seu nível.`);
    }
  }
  return { erros, avisos };
}

/**
 * Lê os quadros (dos argumentos ou do Git) e decide o código de saída.
 * @param {string[]} argumentos - Caminhos opcionais do quadro antes e depois.
 * @returns {number} Código de saída.
 */
function principal(argumentos) {
  if (process.env[VARIAVEL_ESCAPE] === VALOR_ESCAPE) return CODIGO_PASSA;

  const temArquivos = argumentos.length === 2;
  const antes = temArquivos ? readFileSync(argumentos[0], 'utf8') : lerQuadroDoGit('HEAD:');
  const depois = temArquivos ? readFileSync(argumentos[1], 'utf8') : lerQuadroDoGit(':');
  const { erros, avisos } = conferirReservasNovas({ antes, depois });
  avisos.forEach((aviso) => process.stderr.write(`${PREFIXO} AVISO: ${aviso}\n`));
  if (!erros.length) return CODIGO_PASSA;

  erros.forEach((erro) => process.stderr.write(`${PREFIXO} RECUSADO: ${erro}\n`));
  process.stderr.write(`${PREFIXO} Cada frente pega subtarefa até o máximo do seu nível ` +
    '(.claude/rules/multiplas-ias.md, regra global C2). Escolha outra subtarefa. Escape só com ' +
    `pedido do usuário: ${VARIAVEL_ESCAPE}=${VALOR_ESCAPE}.\n`);
  return CODIGO_RECUSA;
}

try {
  process.exitCode = principal(process.argv.slice(2));
} catch (erro) {
  process.stderr.write(`${PREFIXO} AVISO: conferência falhou (${erro.message}); seguindo.\n`);
  process.exitCode = CODIGO_PASSA;
}
