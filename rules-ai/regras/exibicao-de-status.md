# 📊 Exibição de status — sempre em quadro

Decidido em 2026-10-17 (C27). Vale para todos os projetos e todas as IAs, no terminal (cmd,
PowerShell, bash) e no chat do Claude Code no IDE.

- ✅ **Todo status é mostrado em quadro**: tabela Markdown com uma linha por item. Vale para
  tarefas e subtarefas, frentes e reservas, pendências, andamento de um projeto, resultado de
  conferências e de sincronização.
- Colunas mínimas para tarefas: **Tarefa (ID) · Título · Modelo · Status**, e **Em uso por**
  quando houver reserva; outros assuntos usam as colunas que fizerem sentido (ex.: Item · Situação
  · Detalhe).
- O quadro mostrado é sempre tabela, mesmo com o `STATUS.md` no formato simplificado (C55):
  cada item do índice simplificado vira uma linha da tabela.
- ✅ **ID sempre visível:** todo quadro que fala de tarefa ou subtarefa (inclusive comparação,
  perguntas, riscos ou decisões de uma tarefa) tem a coluna **Tarefa** com o ID (`<TAREFA>` ou
  `<TAREFA>.<n>`); se todas as linhas são da mesma subtarefa, o ID vai no título do quadro.
- ✅ **Mãe junto das subtarefas:** ao mostrar subtarefas, a linha da tarefa-mãe vem primeiro, em
  negrito, com o status dela.
- Status sempre com o emoji da legenda do quadro: ⬜ Pendente · 🔄 Em progresso · ✅ Concluído ·
  ⛔ Bloqueado · 👀 Aguardando o usuário.
- ⛔ Não mostrar status em texto corrido nem em lista solta. O texto fora do quadro fica só para o
  que a tabela não diz (próximo passo, pergunta, alerta).
- Onde o Markdown não é renderizado (saída de script no cmd), usar tabela em texto puro, com as
  colunas alinhadas.
- Exceção: ao encerrar uma tarefa, a resposta continua sendo só **TAREFA FINALIZADA E
  SINCRONIZADA!** (`ciclo-da-task.md`).
