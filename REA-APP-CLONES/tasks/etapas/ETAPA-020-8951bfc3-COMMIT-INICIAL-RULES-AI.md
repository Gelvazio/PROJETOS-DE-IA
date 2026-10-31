## Etapa 020-8951bfc3 — COMMIT.INICIAL.RULES-AI: commit e push inicial do quadro

**Tarefa:** COMMIT.INICIAL.RULES-AI · **Pedido em:** 2026-10-23 09:38 · **Criada por:** Claude Code (Sonnet 5.5) (local · main)
**Pedido:** "agora faça commit e push em todos os projetos github, colocando em cada 1 deles 1 tarefa no quadro de cada 1 com o nome COMMIT.INICIAL.RULES-AI" (sessão do `aulasenai`, mudança em massa nos 5 repositórios com quadro)
**Objetivo:** registrar nesta frente a tarefa `COMMIT.INICIAL.RULES-AI` e publicá-la na `main` do GitHub (commit + push), sem tocar nos arquivos já modificados do projeto.

### Escopo

- **Entra:** `tasks/STATUS.md`, `tasks/task_complete.md` e esta etapa.
- **Não entra:** qualquer outro arquivo (os sujos que já existem ficam como estão); `rules-ai` e `ai-memory`.

### Riscos

- Conflito no `STATUS.md` com outra sessão: manter as duas partes e reler. Push recusado: parar e avisar (sem `--force`).

### Decisões

- 2026-10-23 09:38: o usuário escolheu "só a tarefa no quadro" e "os 5 com quadro, fora o rules-ai"; disse "sim" ao plano (sessão `aulasenai`).

### COMMIT.INICIAL.RULES-AI.1 — Registrar a tarefa no quadro, commit e push

**Próximo passo:** nenhum — entregue.

- **Nível:** PESADO — faz parte de uma mudança em massa (5 repositórios).
- **Modelo:** só Sonnet, Opus 5.5+ ou Fable — nunca outro
- **Effort:** high
- **Critérios de aceitação:** commits na `main` com só os arquivos de `tasks/`; push feito; repositório sem commits à frente do `origin/main`.
- **Entrega:** commits `9eb71df` (criar) e `98e52f1` (reservar) e o commit desta entrega, na `main` · **Verificação:** `git push` sem erro e `git rev-list @{u}..HEAD` = 0 (2026-10-23 09:43).
