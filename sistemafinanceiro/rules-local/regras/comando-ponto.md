# 📍 Comando "." — atualizar e listar as tarefas-mãe pendentes

Quando o usuário mandar só um ponto (`.`) numa conversa, a IA faz isto, sem perguntar:

1. ✅ **Atualizar com o remoto:** `git fetch origin main` e depois `git pull --rebase origin main`
   (regra de `git-geral.md`; nunca `git merge` nem `git pull` sem `--rebase`). Se o remoto não
   tiver a branch principal, dizer isso e parar.
2. ✅ **Listar só as tarefas-mãe pendentes (C68):** ler `tasks/STATUS.md` e listar **apenas as
   tarefas-mãe** com status `⬜` Pendente, com o ID, o título e quantas subtarefas abertas cada
   uma tem. ⛔ Não listar subtarefas, nem mãe `🔄` Em progresso, `👀`, `⛔`, `✅` ou `❌`.
   **Projeto no banco (C58)** (`rules-ai`; `aulasenai` depois do corte): ler as tabelas
   `quadro_*` do Supabase com a chave `anon` (ex.: `node scripts/gerenciador.mjs`), filtrando
   `tipo = 'mae'` e `status_codigo = 'pendente'`. ⛔ Sem arquivo de queda: sem
   rede ou com o Supabase fora do ar, dizer em 1 linha que o quadro está indisponível e parar
   (`quadro-de-tarefas.md`, "Quem não alcança o banco"). O `git pull` do passo 1 segue valendo
   para o código e as regras.
3. ✅ Responder com essa lista e mais nada. ⛔ Não começar nenhuma tarefa pendente só por causa
   do ponto.
4. ✅ Se o projeto tiver trava de sessão (como o `tasks/.sessao-ativa` do `rules-ai`), seguir a
   trava dele antes de atualizar.

O ponto não gera commit: a atualização do repositório não muda arquivos do projeto.
