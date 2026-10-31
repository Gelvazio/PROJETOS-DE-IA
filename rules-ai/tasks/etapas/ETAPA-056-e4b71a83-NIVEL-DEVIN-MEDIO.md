## Etapa 056-e4b71a83 — NIVEL-DEVIN: Devin (e Copilot) passa a pegar subtarefa MEDIO

**Tarefa:** NIVEL-DEVIN · **Pedido em:** 2026-10-26 19:09 · **Criada por:** Devin (SWE-2) (local · main · rules-ai)
**Pedido:** "mude a regra global,que fica em C:\fontes\rules-ai,permitindo o devin pegar medio tambem"
**Objetivo:** na matriz "Quem pega cada nível" (`regras/niveis-e-modelos.md`), a linha **Devin / Copilot** vira `✅ / ✅ / ⛔` — MEDIO liberado; PESADO continua proibido.

### Escopo

- **Entra:** `regras/niveis-e-modelos.md` (linha Devin/Copilot); `scripts/jev/modelos.mjs` (espelho em código — MEDIO ganha Devin e Copilot); `dist/REGRAS-GLOBAIS.md` + `VERSAO.md` regerados por `scripts/sincronizar.mjs` **sem** `--aplicar`; skill global `classificar-tarefa` (`~/.agents/skills/classificar-tarefa/SKILL.md`); decisão no Registro de decisões do `STATUS.md`.
- **Não entra:** `--aplicar` (regravar os arquivos globais das IAs) — fica para ordem do usuário; PESADO continua ⛔ para Devin/Copilot.

### Decisões

- 2026-10-26 19:09: pedido direto do usuário; tarefa **pequena** de texto em regras (sem banco, sem código de execução). **C54:** Devin/Copilot com `✅` em MEDIO.

### NIVEL-DEVIN.1 — Liberar MEDIO para Devin/Copilot na matriz e nas cópias

**Próximo passo:** nenhum — concluída. O `--aplicar` (regravar os arquivos globais das IAs) fica para ordem do usuário.

- **Nível:** LEVE — classificado (Jev, conf. 0,59; valendo a matriz)
- **Modelo:** só Haiku 5.5 ou DeepSeek V4.1 Flash — ordem escrita do usuário executada pelo Devin (mesmo caso das execuções diretas por pedido)
- **Effort:** low
- **Descrição:** trocar o `⛔` por `✅` na coluna MEDIO da linha Devin/Copilot em `regras/niveis-e-modelos.md`; acrescentar as entradas `Devin`/`Copilot` no `MEDIO` de `scripts/jev/modelos.mjs`; regerar `dist/REGRAS-GLOBAIS.md` e `VERSAO.md` (`node scripts/sincronizar.mjs`, sem `--aplicar`); alinhar `~/.agents/skills/classificar-tarefa/SKILL.md`; registrar a C54 no `STATUS.md`.
- **Critérios de Aceitação:** as 3 fontes (regra, espelho, skill) mostram Devin/Copilot ✅ em MEDIO; dist/ regerado; decisão gravada.
- **Depende de:** Nenhuma
- **Entrega:** commits `4bb8ef3` (matriz + espelho) e `0f58f2d` (`VERSAO.md`); `dist/REGRAS-GLOBAIS.md` regerado (linha Devin/Copilot `✅/✅/⛔`); skill `classificar-tarefa` (`~/.agents/skills/`) alinhada; C54 no Registro de decisões.
- **Verificação:** `node --check modelos.mjs` OK; grep "Devin" no `dist/` mostra `✅ ✅ ⛔`; sincronizador rodado sem `--aplicar` (arquivos das IAs ficam para ordem do usuário).
