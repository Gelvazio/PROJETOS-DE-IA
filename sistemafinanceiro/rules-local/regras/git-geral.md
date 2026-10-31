# 🔀 Git — regras comuns a todos os projetos

Cada projeto pode ter regras mais específicas (hooks, push automático); elas valem no projeto,
exceto onde dizem expressamente "sem push".
Pontos de conflito entre projetos estão em `CONFLITOS.md`.

- ✅ Trabalhar direto na branch principal (`main`/`develop`). ⛔ Sem `git worktree` e sem branches
  paralelas, salvo se o projeto disser o contrário. Pasta `.worktrees`: apagar depois de conferir.
- ✅ **Um commit por tarefa concluída e conferida**, com mensagem descritiva. ⛔ Nada de commit
  de tarefa incompleta ou falhando, nem várias tarefas num commit só. Commit e atualização do
  quadro saem sem perguntar.
- ✅ **1 commit + 1 push a CADA ENTREGA** (regra principal, pedido do usuário em 2026-10-24): cada
  subtarefa entregue, cada lote de arquivos conferido e cada atualização do quadro vira um commit
  e um push na hora, sem esperar a tarefa-mãe fechar. ⛔ Juntar entregas num commit só, ou deixar
  entrega sem push para depois, é infração. Histórico já feito não se reescreve (sem `--force`).
- ✅ `git add <arquivos da tarefa>` pelo caminho; conferir com `git diff --cached --name-only`.
  ⛔ Nunca `git add .`.
- ⛔ `git merge` e `git pull` sem `--rebase` (usar `git pull --rebase`); sem PR para entregar tarefa.
- ⛔ `git status` repetido entre comandos ou depois do commit (o git já avisa erros).
- ✅ **Ao finalizar uma tarefa: commit + `git push`** (na branch principal), sem esperar pedido
  (C13, 2026-10-16). Push recusado porque o remoto andou → `git pull --rebase` e push de novo.
- ⛔ `git push --force`.
- ✅ Usuário pede "faça commit agora" → na hora, mesmo no meio da tarefa; "só commit, sem push"
  → respeitar (vale só para aquele pedido).
- ✅ Não versionar o que o projeto proíbe (`.env`, chaves, tokens, dados pessoais, gabaritos…).
- Rodar comandos de git sem perguntar "posso executar?".
