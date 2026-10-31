## Etapa 004-c5c1b50f — IGNORE: Ignorar o executável analisado em `apps-to-be-clone/`

**Tarefa:** IGNORE · **Pedido em:** 2026-10-14 09:30 · **Criada por:** Claude Code (Opus 5.5) (local · main)
**Pedido:** "O apps-to-be-clone/chaos-code-v3-client.exe, deve entrar no ignore sim"
**Objetivo:** não versionar os binários de terceiros que vamos analisar.

### IGNORE.1 — Pôr os binários de `apps-to-be-clone/` no `.gitignore`

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — 1 arquivo de configuração
- **Critérios de Aceitação:** `git check-ignore apps-to-be-clone/chaos-code-v3-client.exe` confirma.
- **Descrição:** `.gitignore` ganhou `apps-to-be-clone/**/*.exe` e `apps-to-be-clone/**/*.dll`
- **JEV-AI-SUGGESTION:** NAO
  (vale também para os próximos apps a analisar).
- **Entrega:** commit `feat(IGNORE.1)` · **Verificação:** `git check-ignore -v` aponta a regra nova
  para `apps-to-be-clone/chaos-code-v3-client.exe`.
