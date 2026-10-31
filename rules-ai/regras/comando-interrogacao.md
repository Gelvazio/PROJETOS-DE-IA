# ❓ Comando "?" — sincronizar e ver o que está pendente na sessão

Quando o usuário mandar só um ponto de interrogação (`?`) numa conversa, a IA faz isto, sem perguntar:

1. ✅ **Sincronizar com o remoto:** `git fetch origin` e depois `git pull --rebase origin main`
   (regra de `git-geral.md`; nunca `git merge` nem `git pull` sem `--rebase`). Se a branch da sessão
   tiver commits que o remoto não tem, eles ficam e entram na conta do item 2.
2. ✅ **Ver o que está pendente nesta sessão**, e só isto:
   - alterações sem commit (`git status --short`);
   - commits locais ainda não enviados (`git log origin/<branch>..HEAD`, ou os da branch se ela
     ainda não existir no remoto);
   - subtarefas que esta sessão reservou no `tasks/STATUS.md` e ainda não entregou (linhas com
     `🔄` cujo "Em uso por" é desta sessão);
   - trava de sessão do projeto (ex.: `tasks/.sessao-ativa`), se existir, e de quem é.
3. ✅ Responder com a lista do item 2 e dizer o que falta para cada item (ex.: "3 arquivos sem
   commit", "1 commit sem push"). Se não houver nada, dizer "nada pendente". ⛔ Não começar, não
   commitar e não enviar nada só por causa do `?`.
4. ✅ Se o projeto tiver trava de sessão, seguir a trava dele antes de sincronizar.

O `?` não gera commit: sincronizar e listar não muda arquivos do projeto.
