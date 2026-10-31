## Etapa 042-b5e79055 — GRAPHIFY-FORA-DO-GIT: tirar o `graphify-out/` do Git

**Tarefa:** GRAPHIFY-FORA-DO-GIT · **Pedido em:** 2026-10-23 12:45 · **Criada por:** Claude Code (Opus 5.5) (local · main · rules-ai)
**Pedido:** "remova graphify-out do git"
**Objetivo:** cumprir a regra `regras/graphify.md` ("`graphify-out/` fica fora do Git"): hoje 196 arquivos (11 MB) estão versionados e cada `graphify update` suja a árvore.

### Escopo

- **Entra:** só o `rules-ai`: tirar `graphify-out/` do índice do Git (`git rm -r --cached`), sem apagar do disco, e acrescentar `graphify-out/` no `.gitignore`.
- **Não entra:** apagar a pasta do disco; reescrever o histórico do Git (os commits antigos continuam com os arquivos); outros projetos (ex.: `REA-APP-CLONES`, que também versiona a pasta).
- **Tamanho:** tarefa grande (mudança em massa: 196 arquivos saem do Git) — plano nesta etapa e execução só depois do "sim".

### Riscos

| Risco | Plano B |
|---|---|
| Algum script ou página lê o `graphify-out/` pelo GitHub | Conferido: só `instalar-ai-memory.mjs` e o teste citam o nome (como caminho ignorado); nada lê pelo GitHub. Se aparecer, `git revert` do commit |
| A REMOVER-TRIPO.7 (👀 do usuário) fala dos instantâneos antigos do `graphify-out/` | Eles continuam no disco e no histórico; a decisão da .7 segue com o usuário |
| Outra sessão commita o `graphify-out/` de novo | O `.gitignore` impede arquivos novos; o commit desta tarefa tira os já versionados |

### Decisões

- 2026-10-23 12:45: etapa criada e publicada; plano aguardando o "sim" do usuário (tarefa grande).
- 2026-10-23 12:48: **o usuário disse "sim, pode tirar o graphify-out do git"** — plano aprovado.

### GRAPHIFY-FORA-DO-GIT.1 — `git rm -r --cached graphify-out` e `graphify-out/` no `.gitignore`

**Próximo passo:** nenhum — entregue.

- **Nível:** PESADO — mudança em massa (196 arquivos saem do Git)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** acrescentar `graphify-out/` no `.gitignore`; `git rm -r --cached graphify-out`; um commit só com o `.gitignore`, a remoção e o quadro.
- **Critérios de Aceitação:** `git ls-files graphify-out` vazio; a pasta continua no disco (`GRAPH_REPORT.md` existe); `git status` não mostra mais `graphify-out/`; push feito.
- **Entrega:** `.gitignore` com `graphify-out/` e `git rm -r --cached graphify-out` (196 arquivos fora do Git) no commit desta entrega, por Claude Code (Opus 5.5) (local · main · rules-ai), 2026-10-23 12:49.
- **Verificação:** `git ls-files graphify-out` = 0; `graphify-out/GRAPH_REPORT.md` continua no disco; `git status` sem arquivos novos de `graphify-out/` (só as 196 remoções do índice neste commit); nada apagado do disco nem do histórico.
