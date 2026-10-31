// .claude/hooks/lembrar-task.mjs — hook UserPromptSubmit do Claude Code.
// A cada pedido do usuário, acrescenta ao contexto um lembrete curto da regra
// "todo pedido que muda arquivo vira TASK antes de executar". O texto impresso no stdout
// vai para o contexto do Claude. Nunca bloqueia: termina sempre com código 0.

const CODIGO_LIBERA = 0;
const LEMBRETE = [
  '[hook lembrar-task] Se este pedido muda arquivo, banco ou configuração, ele vira TASK antes',
  'de executar: abra a etapa e as linhas no tasks/STATUS.md e reserve a subtarefa (lock + push).',
  'Pergunta ou explicação que não muda nada não vira TASK (.claude/rules/tasks/ciclo-da-task.md).',
].join('\n');

/**
 * Imprime o lembrete da regra de tarefas.
 * @returns {number} Código de saída do hook.
 */
function lembrar() {
  process.stdout.write(LEMBRETE + '\n');
  return CODIGO_LIBERA;
}

process.exitCode = lembrar();
