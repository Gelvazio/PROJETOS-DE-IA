## Etapa 036-5b2c8e41 — SONNET-PESADO-GLOBAL: o Sonnet pode pegar tarefa PESADO

**Tarefa:** SONNET-PESADO-GLOBAL · **Pedido em:** 2026-10-22 · **Criada por:** Claude Code (Sonnet 5.5) (local · main · aulasenai)
**Pedido:** "abra uma excecao a regra nesta sessao e faça" → "2-mude a regra" → escopo "Sonnet pega qualquer PESADO"
(pedido na sessão do `aulasenai`, para o port do LightBot, #347.1)
**Objetivo:** a coluna `PESADO` do Claude Code passa a aceitar o Sonnet, além de Opus 5.5+ e Fable (altera a C22).

### Escopo

- **Entra:** `regras/niveis-e-modelos.md` (matriz e a frase "Haiku só LEVE, Sonnet só MEDIO…"), decisão **C48** no
  `CONFLITOS.md`, skill global `classificar-tarefa` alinhada, `sincronizar.mjs --aplicar`; no `aulasenai`:
  `.claude/rules/niveis.md` (espelho da global) e a trava `scripts/claude-hooks/verificar-modelo.js`
  (`MODELOS_POR_NIVEL.PESADO` ganha `sonnet`).
- **Não entra:** Haiku continua só `LEVE`; Opus/Fable e DeepSeek/OpenCode ficam como estão; banco continua só
  no Claude Code local (regra do projeto).

### Riscos

- A C47 (JEV-GRAVA-NIVEL.1, pendente) também edita `niveis-e-modelos.md`: fazer uma de cada vez (sessão única, C29).
- Sonnet em PESADO é decisão de custo/qualidade do usuário; fica registrada nas Decisões.

### Decisões

- 2026-10-22: o usuário escolheu "Sonnet pega qualquer PESADO" (pergunta de escopo, sessão `aulasenai`).
  
- 2026-10-22: o usuário disse "sim" ao plano (sessão `aulasenai`).

### SONNET-PESADO-GLOBAL.1 — Regra global e decisão C48

**Próximo passo:** depois do "sim", editar `niveis-e-modelos.md`, registrar a C48 e alinhar a skill `classificar-tarefa`.

- **Nível:** MEDIO — poucas edições `.md` (2 a 3 arquivos), sem código; muda a matriz do usuário.
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Critérios de aceitação:** matriz com Sonnet em `PESADO`; C48 no `CONFLITOS.md`; `sincronizar.mjs` sem divergência.
- **Entrega:** `niveis-e-modelos.md`, C48 no `CONFLITOS.md`, skill `classificar-tarefa` (commit desta entrega) · **Verificação:** `git diff` lido; `node scripts/sincronizar.mjs` gravou a versão `2026-10-22-6637f9d5` e mostrou `mudaria` nas IAs.
- **JEV-AI-SUGGESTION:** NAO

### SONNET-PESADO-GLOBAL.2 — Levar aos projetos e à trava do aulasenai

**Próximo passo:** `node scripts/sincronizar.mjs --aplicar` (usuário) e, no `aulasenai`, `niveis.md` e `verificar-modelo.js`.

- **Nível:** MEDIO — 1 arquivo JS pequeno + 1 `.md`.
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Depende de:** SONNET-PESADO-GLOBAL.1
- **Critérios de aceitação:** `node --check` do hook; reserva de Sonnet em subtarefa PESADO não é bloqueada.
- **Entrega:** `sincronizar.mjs --aplicar` (IAs atualizadas); no `aulasenai`: `niveis.md`, `verificar-modelo.js`, `HISTORICO-REGRAS.md` · **Verificação:** `node --check` ok; a reserva do Sonnet na #347.1 (PESADO) passou pela trava.
- **JEV-AI-SUGGESTION:** NAO
