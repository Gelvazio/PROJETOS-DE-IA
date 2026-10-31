// .claude/hooks/exigir-reserva.mjs — hook PreToolUse do Claude Code.
// Garante a regra "todo pedido que muda arquivo vira TASK antes de executar"
// (.claude/rules/tasks/ciclo-da-task.md): antes de Edit/Write/NotebookEdit num arquivo do
// projeto, exige no tasks/STATUS.md uma subtarefa "🔄 Em execução" reservada por Claude Code.
// Bloqueia com código 2 (o Claude lê a mensagem do stderr). Qualquer erro do próprio hook
// libera a edição (código 0), para nunca prender a sessão. Node, sem dependências.

import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';

const CODIGO_LIBERA = 0;
const CODIGO_BLOQUEIA = 2;
const VARIAVEL_ESCAPE = 'IA_SEM_TRAVA';
const VALOR_ESCAPE = '1';
const CAMINHO_QUADRO = join('tasks', 'STATUS.md');
const PASTA_QUADRO = 'tasks';
const MARCA_EM_EXECUCAO = '🔄';
const MARCA_FRENTE = 'Claude Code';
const COLUNA_STATUS = 4;
const COLUNA_EM_USO_POR = 5;
const MENSAGEM_BLOQUEIO = [
  'Edição barrada pelo hook exigir-reserva: não há subtarefa "🔄 Em execução" de',
  'Claude Code no tasks/STATUS.md. Todo pedido que muda arquivo vira TASK antes de executar',
  '(.claude/rules/tasks/ciclo-da-task.md): abra a tarefa (etapa + linhas no STATUS.md),',
  'reserve a subtarefa com commit "lock:" + push e só então edite. Arquivos em tasks/',
  `continuam liberados. Escape (só com pedido do usuário): ${VARIAVEL_ESCAPE}=${VALOR_ESCAPE}.`,
].join('\n');

/**
 * Lê todo o stdin (o Claude Code manda o evento do hook em JSON).
 * @returns {Promise<string>} Texto recebido.
 */
async function lerEntrada() {
  const pedacos = [];
  for await (const pedaco of process.stdin) pedacos.push(pedaco);
  return Buffer.concat(pedacos).toString('utf8');
}

/**
 * Pega o caminho do arquivo que a ferramenta vai alterar.
 * @param {{tool_input?: {file_path?: string, notebook_path?: string}}} evento - Evento do hook.
 * @returns {string|null} Caminho informado, ou null se não houver.
 */
function obterCaminhoAlvo(evento) {
  const entrada = evento.tool_input ?? {};
  return entrada.file_path ?? entrada.notebook_path ?? null;
}

/**
 * Diz se o arquivo precisa de reserva: dentro do projeto e fora de tasks/.
 * @param {string} caminhoAlvo - Arquivo que será alterado.
 * @param {string} pastaProjeto - Raiz do projeto.
 * @returns {boolean} true quando a edição exige reserva.
 */
function exigeReserva(caminhoAlvo, pastaProjeto) {
  const relativo = relative(pastaProjeto, resolve(pastaProjeto, caminhoAlvo));
  const foraDoProjeto = relativo.startsWith('..') || isAbsolute(relativo);
  if (foraDoProjeto) return false;

  const dentroDoQuadro = relativo === PASTA_QUADRO || relativo.startsWith(PASTA_QUADRO + '/')
    || relativo.startsWith(PASTA_QUADRO + '\\');
  return !dentroDoQuadro;
}

/**
 * Procura no quadro uma subtarefa em execução reservada por Claude Code.
 * @param {string} textoQuadro - Conteúdo do tasks/STATUS.md.
 * @returns {boolean} true se existir a reserva.
 */
function temReservaDoClaude(textoQuadro) {
  return textoQuadro.split('\n').some((linha) => {
    if (!linha.startsWith('| ')) return false;
    const colunas = linha.split('|').slice(1, -1).map((coluna) => coluna.trim());
    const emExecucao = (colunas[COLUNA_STATUS] ?? '').startsWith(MARCA_EM_EXECUCAO);
    return emExecucao && (colunas[COLUNA_EM_USO_POR] ?? '').includes(MARCA_FRENTE);
  });
}

/**
 * Decide se a edição passa. Erro ou dado faltando libera.
 * @returns {Promise<number>} Código de saída do hook.
 */
async function decidir() {
  if (process.env[VARIAVEL_ESCAPE] === VALOR_ESCAPE) return CODIGO_LIBERA;

  const evento = JSON.parse(await lerEntrada());
  const pastaProjeto = process.env.CLAUDE_PROJECT_DIR ?? evento.cwd ?? process.cwd();
  const caminhoAlvo = obterCaminhoAlvo(evento);
  if (!caminhoAlvo || !exigeReserva(caminhoAlvo, pastaProjeto)) return CODIGO_LIBERA;

  const caminhoQuadro = join(pastaProjeto, CAMINHO_QUADRO);
  if (!existsSync(caminhoQuadro)) return CODIGO_LIBERA;
  if (temReservaDoClaude(readFileSync(caminhoQuadro, 'utf8'))) return CODIGO_LIBERA;

  process.stderr.write(MENSAGEM_BLOQUEIO + '\n');
  return CODIGO_BLOQUEIA;
}

try {
  process.exitCode = await decidir();
} catch {
  process.exitCode = CODIGO_LIBERA;
}
