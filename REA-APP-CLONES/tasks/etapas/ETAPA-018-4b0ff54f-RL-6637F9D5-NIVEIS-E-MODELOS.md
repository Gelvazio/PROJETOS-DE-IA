## Etapa 018-4b0ff54f — RL-6637F9D5-NIVEIS-E-MODELOS: Ajustar o projeto à regra niveis-e-modelos.md (rules-local 2026-10-22-6637f9d5)

**Tarefa:** RL-6637F9D5-NIVEIS-E-MODELOS · **Pedido em:** 2026-10-22 16:48 · **Criada por:** Claude Code (Opus 5.5) (local · main)
**Pedido:** sincronização de tasks do rules-local: mudado niveis-e-modelos.md, 2026-10-22-00769678 -> 2026-10-22-6637f9d5
**Objetivo:** a matriz ferramenta × modelo × nível da skill `classificar-tarefa` do REA fica igual à
regra global `rules-local/regras/niveis-e-modelos.md`.

**O que mudou na regra:** C48 (2026-10-22): no Claude Code, o **Sonnet** passa a pegar `MEDIO` **e**
`PESADO` (antes só `MEDIO`).
**O que muda no projeto:** a matriz em `.agents/skills/classificar-tarefa/SKILL.md` ainda diz
"`PESADO` é só do Claude Code com Opus 5.5 ou superior, Fable, ou DeepSeek", e o
`multiplas-ias.md` diz "`PESADO` é só do modelo mais forte da matriz". Conferir também a trava do
`.githooks/pre-commit` (reserva acima do nível).

### RL-6637F9D5-NIVEIS-E-MODELOS.1 — Sonnet em `PESADO` na skill e nas regras do REA

**Próximo passo:** na fonte `.agents/skills/classificar-tarefa/SKILL.md`, trocar a célula `PESADO`
do Claude Code para "Sonnet, Opus 5.5 ou superior, ou Fable" e o texto abaixo da matriz; ajustar a
linha de `PESADO` em `.claude/rules/multiplas-ias.md`; conferir se o `.githooks/pre-commit` lê o
nível do Sonnet; rodar `npm run sync:agentes`.

- **Nível:** PESADO — mexe na trava de reserva (hook) e nas regras de quem pega cada nível · **Modelo:** só Opus 5.5+ ou Fable · **Effort:** high
- **Arquivos:** `.agents/skills/classificar-tarefa/SKILL.md` (e cópias geradas), `.claude/rules/multiplas-ias.md`, talvez `.githooks/pre-commit`
- **Critérios de aceitação:** matriz da skill igual à regra global; `npm run check:agentes` com código 0.
- **Entrega:** — · **Verificação:** —
- **JEV-AI-SUGGESTION:** NAO
