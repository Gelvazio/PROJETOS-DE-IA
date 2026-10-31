# 🔀 Git Quick — Commit, push e hooks

Único lugar das regras de git do projeto. Vale para **local e nuvem** e para todas as IAs.

## Tudo na `main`

- Trabalho, quadro e regras vão direto para a **`main`** — também nas sessões de nuvem, mesmo que
  a ferramenta indique outra branch. ⛔ Sem branches paralelas, sem `git worktree`, sem PR para
  entregar tarefa (a reserva só vale para as outras IAs quando está na `main`).
- Push para a `main` recusado por **permissão** → parar e avisar o usuário; não publicar em outra
  branch como alternativa.

## Hooks (instalar 1x por clone)

```bash
git config core.hooksPath .githooks   # ativa os hooks versionados
git config pull.rebase true           # git pull simples já usa rebase
```

| Hook | O que faz |
|------|-----------|
| `.githooks/pre-push` | `git fetch --all --prune` e **recusa** o push se o remoto tem commits que você não tem |
| `.githooks/post-checkout` | Avisa quantos commits você está atrás ao trocar de branch |
| `.githooks/pre-commit` | Commit com arquivo de `.agents/` → roda `npm run sync:agentes` e põe as cópias no mesmo commit |
| `.githooks/pre-commit` (2) | **Recusa** reserva nova no `STATUS.md` acima do nível do modelo da frente; mais leve só avisa (`multiplas-ias.md`; escape `IA_SEM_TRAVA=1` só com pedido do usuário) |
| `.githooks/pre-push` (2) | **Recusa** o push se as cópias das skills estiverem diferentes de `.agents/` |
| `.githooks/pre-merge-commit` | **Recusa** commit de merge; recuperar com `git merge --abort` |

- Hook não roda → quase sempre fim de linha: `git ls-files --eol .githooks` deve mostrar `lf`.
- `--no-verify` só com motivo registrado na seção da subtarefa. Os hooks **não** substituem o
  `fetch` + `pull --rebase` antes de ler o quadro.

## Quando commitar

| Momento | Mensagem | O que vai no commit |
|---------|----------|---------------------|
| Reserva da subtarefa | `lock: assumindo sub-task <COD> por <frente>` | Só o `tasks/STATUS.md` — push imediato |
| **Entrega da subtarefa** | `feat(<COD>): <descrição> por <frente>` (ou `fix`/`docs`) | Arquivos da subtarefa + `tasks/STATUS.md` + etapa — **1 commit + push** |
| Mudança só no quadro | `docs(board): <descrição> por <frente>` | Quadro |
| Usuário pede "faça commit agora" | — | Na hora, mesmo no meio da tarefa |

Os prefixos `lock:` e `feat(<COD>)` são o padrão do quadro (ferramentas e outras IAs leem o
histórico por eles); não trocar.

## Fluxo

```bash
git fetch --all --prune          # sem isso o git status mente
git pull --rebase origin main    # nunca pull sem --rebase (gera merge)
git add <caminho1> <caminho2>    # só os arquivos da subtarefa + quadro
git diff --cached --name-only    # conferir o que vai no commit
git commit -m "feat(SUB-XX.N): descrição por <frente>

Co-Authored-By: <nome do modelo em uso> <e-mail noreply do fornecedor da IA>"
git push origin main
```

- Claude: `Co-Authored-By: Claude <modelo> <noreply@anthropic.com>`; outras IAs usam o nome e o
  e-mail noreply do próprio fornecedor.
- ✅ **Depois de cada push para a `main` que der certo**, mostrar ao usuário, sem ele pedir, a
  **tela de tarefas pendentes** lida do `tasks/STATUS.md` já com o push: uma tabela com as
  tarefas-mãe abertas (código, título, prioridade, status, próxima subtarefa livre ou reserva),
  depois os itens **👀** (dependem do usuário) e a próxima subtarefa pela prioridade. Na resposta
  final de uma tarefa, a tabela vem **antes** de "TAREFA FINALIZADA E SINCRONIZADA!"
  (esta regra é a exceção do projeto à "só a frase").
- Push recusado porque o remoto andou → `fetch` + `pull --rebase` + reler o quadro + push de novo.

## Proibido

- ⛔ `git add .` (arrasta arquivos de outra subtarefa ou de outra frente)
- ⛔ `git push --force`
- ⛔ `git pull` sem `--rebase`, `git pull --all` e `git merge`
- ⛔ `git status` repetido entre comandos ou depois do commit (o git já avisa erros)
- ⛔ Várias subtarefas num commit só, ou subtarefa entregue sem commit
- ⛔ Commit/push de subtarefa incompleta ou falhando

## O que nunca vai para o Git

`.env`, chaves, tokens, `.claude/settings.local.json`, `.claude/launch.json` e o
`CLAUDE.local.md` (instruções pessoais de cada um para o Claude Code; já no `.gitignore`).
O resto da pasta `.claude/` (regras, skills e hooks) vai para o Git.
