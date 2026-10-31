# 📍 Comando "." — atualizar e listar pendências

Quando o usuário mandar só um ponto (`.`) numa conversa, a IA faz isto, sem perguntar:

1. ✅ **Atualizar com o remoto:** `git fetch origin main` e depois `git pull --rebase origin main`
   (regra de `git-geral.md`; nunca `git merge` nem `git pull` sem `--rebase`). Se o remoto não
   tiver a branch principal, dizer isso e parar.
2. ✅ **Listar as pendências:** ler `tasks/STATUS.md` e listar **todas** as linhas de tarefa com
   `⬜` Pendente, `🔄` Em progresso, `👀` Aguardando o usuário ou `⛔` Bloqueado, com o ID, o nome e
   a situação. Agrupar por tarefa-mãe. ⛔ Não listar `✅` Concluído.
3. ✅ Responder com essa lista e mais nada. Se algo do quadro pede ação do usuário (`👀`), dizer
   qual ação. ⛔ Não começar nenhuma tarefa pendente só por causa do ponto.
4. ✅ Se o projeto tiver trava de sessão (como o `tasks/.sessao-ativa` do `rules-ai`), seguir a
   trava dele antes de atualizar.

O ponto não gera commit: a atualização do repositório não muda arquivos do projeto.
