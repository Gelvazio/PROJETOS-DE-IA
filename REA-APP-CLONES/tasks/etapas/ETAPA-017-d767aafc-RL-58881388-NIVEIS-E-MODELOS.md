## Etapa 017-d767aafc — RL-58881388-NIVEIS-E-MODELOS: Ajustar o projeto à regra niveis-e-modelos.md (rules-local 2026-10-20-58881388)

**Tarefa:** RL-58881388-NIVEIS-E-MODELOS · **Pedido em:** 2026-10-20 07:32 · **Criada por:** Claude Code (Opus 5.5) (nuvem · main)
**Pedido:** sincronização de tasks do rules-local: mudado niveis-e-modelos.md, 2026-10-18-ef54a693 -> 2026-10-20-58881388
**Objetivo:** a matriz ferramenta × modelo × nível da skill `classificar-tarefa` do REA fica igual à
regra global `rules-local/regras/niveis-e-modelos.md`.

**O que mudou na regra:** a matriz ganhou as linhas do **OpenCode** (DeepSeek V4.1 Flash, Flash com
thinking e DeepSeek V4 Pro em `PESADO`, C37) e do **Qoder** (✅ `LEVE` e `MEDIO`, ⛔ `PESADO`); o
DeepSeek passou a pegar `PESADO` (C35).
**O que muda no projeto:** a matriz em `.agents/skills/classificar-tarefa/SKILL.md` ainda tem o
DeepSeek ⛔ em `PESADO` e não tem OpenCode nem Qoder (as cópias `.claude/`, `.grok/` e
`.gemini/` saem do `npm run sync:agentes`).

### RL-58881388-NIVEIS-E-MODELOS.1 — Matriz da skill `classificar-tarefa` igual à regra global

**Próximo passo:** na fonte `.agents/skills/classificar-tarefa/SKILL.md`, trocar a linha do DeepSeek
(`PESADO` ✅) e acrescentar as linhas OpenCode e Qoder como em `rules-local/regras/niveis-e-modelos.md`;
rodar `npm run sync:agentes`.

- **Nível:** LEVE — Jev `LEVE`, final proposto `LEVE`, confiança 0.76, ação `revisar` (só `.md`, sem lógica) · **Modelo:** só Haiku 5.5 · **Effort:** low
- **Arquivos:** `.agents/skills/classificar-tarefa/SKILL.md` (e as cópias geradas)
- **Critérios de aceitação:** a matriz da skill tem as mesmas linhas e células da regra global;
- **JEV-AI-SUGGESTION:** NAO
  `node scripts/sincronizar-agentes.mjs --checar` com código 0.
- **Entrega:** — · **Verificação:** —
