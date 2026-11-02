# 📍 Comando "." — atualizar e listar pendências

Quando o usuário mandar só um ponto (`.`) numa conversa, a IA faz isto, sem perguntar:

1. ✅ **Atualizar com o remoto:** `git fetch origin main` e depois `git pull --rebase origin main`
   (regra de `git-geral.md`; nunca `git merge` nem `git pull` sem `--rebase`). Se o remoto não
   tiver a branch principal, dizer isso e parar.
2. ✅ **Listar as pendências:** ler `tasks/STATUS.md` e listar **todas** as linhas de tarefa com
   `⬜` Pendente, `🔄` Em progresso, `👀` Aguardando o usuário ou `⛔` Bloqueado, com o ID, o nome e
   a situação. Agrupar por tarefa-mãe. ⛔ Não listar `✅` Concluído.
   **Projeto no banco (C58)** (`rules-ai`; `aulasenai` depois do corte): ler as tabelas
   `quadro_*` do Supabase com a chave `anon` (ex.: `node scripts/gerenciador.mjs`), com os mesmos
   filtros (`status_codigo` diferente de `concluido` e `cancelada`). ⛔ Sem arquivo de queda: sem
   rede ou com o Supabase fora do ar, dizer em 1 linha que o quadro está indisponível e parar
   (`quadro-de-tarefas.md`, "Quem não alcança o banco"). O `git pull` do passo 1 segue valendo
   para o código e as regras.
3. ✅ Responder com essa lista e mais nada. Se algo do quadro pede ação do usuário (`👀`), dizer
   qual ação. ⛔ Não começar nenhuma tarefa pendente só por causa do ponto.
4. ✅ Se o projeto tiver trava de sessão (como o `tasks/.sessao-ativa` do `rules-ai`), seguir a
   trava dele antes de atualizar.

O ponto não gera commit: a atualização do repositório não muda arquivos do projeto.
