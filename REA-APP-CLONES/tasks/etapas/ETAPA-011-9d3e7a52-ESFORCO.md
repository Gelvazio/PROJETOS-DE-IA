## Etapa 011-9d3e7a52 — ESFORCO: Esforço (`effort`) fixo no frontmatter dos agentes

**Tarefa:** ESFORCO · **Pedido em:** 2026-10-16 12:49 · **Criada por:** Claude Code (Sonnet 5.5) (local · main)
**Pedido:** "NA SKILL DO AGENTE, TEM COMO COLOCAR O ESFORÇO QUE ELE VAI USAR?" → proposta da tabela
de esforço por agente → "SIM"
**Objetivo:** cada agente da equipe (`.agents/agents/*.md`) declara o esforço de raciocínio no
frontmatter (`effort:`), para valer sempre, sem depender do esforço da sessão do líder.

### Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-16 12:49 | Esforço por agente: `classificador-tarefas` e `executor-leve` = `low`; `executor-medio` = `medium`; `executor-pesado` = `high` | Gelvazio | Aprovou a tabela proposta com "SIM" (a sugestão era `high` ou `xhigh` para o pesado; ficou `high`, ajustável) |
| 2026-10-16 12:49 | Dividida em 2 subtarefas de até 2 arquivos (cada uma só `.md`, nível LEVE), em vez de 1 com 4 arquivos ligados (que seria PESADO) | Claude Code (Sonnet 5.5) | Regra de nível: "mais de 3 arquivos ligados" = PESADO; dividir é o caminho previsto em `frentes-e-reserva.md` |
| 2026-10-16 12:49 | A sessão que abriu a tarefa (Sonnet) **não** reservou: LEVE é de Haiku (regra "só o seu nível", NIVEL) | Claude Code (Sonnet 5.5) | Sem `IA_SEM_TRAVA=1`, que só vale com pedido do usuário |
| 2026-10-16 12:55 | Usuário liberou a sessão Sonnet a fazer ESFORCO.1 e ESFORCO.2 só desta vez, com `IA_SEM_TRAVA=1` | Gelvazio | "Libere esta sessão Sonnet a fazer ESFORCO.1 e ESFORCO.2 só desta vez (IA_SEM_TRAVA=1, por pedido meu)" |

### ESFORCO.1 — `effort` no classificador-tarefas e no executor-leve

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — só frontmatter de 2 arquivos `.md`, sem lógica · **Modelo:** Claude Code Haiku 5.5
- **Descrição:** em `.agents/agents/classificador-tarefas.md` e `.agents/agents/executor-leve.md`,
- **JEV-AI-SUGGESTION:** NAO
  acrescentar a linha `effort: low` depois de `model: haiku`. Só editar a fonte em `.agents/`;
  as cópias em `.claude/`, `.grok/` e `.gemini/` são regeradas pelo `pre-commit` (`npm run sync:agentes`).
- **Critérios de Aceitação:** os dois arquivos com `effort: low` no frontmatter; resto do arquivo
  intacto; `npm run check:agentes` sem diferença entre fonte e cópias.
- **Entrega:** commit `feat(ESFORCO.1)` · **Verificação:** `npm run sync:agentes` e `npm run check:agentes` sem diferença; `effort: low` logo abaixo de `model: haiku` nos dois arquivos. Feita por Claude Code (Sonnet 5.5) (local · main) com `IA_SEM_TRAVA=1`, a pedido do usuário, 2026-10-16.

### ESFORCO.2 — `effort` no executor-medio e no executor-pesado

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — só frontmatter de 2 arquivos `.md`, sem lógica · **Modelo:** Claude Code Haiku 5.5
- **Descrição:** em `.agents/agents/executor-medio.md` acrescentar `effort: medium` depois de
- **JEV-AI-SUGGESTION:** NAO
  `model: sonnet`; em `.agents/agents/executor-pesado.md` acrescentar `effort: high` depois de
  `model: opus`. Mesma regra de só editar a fonte.
- **Critérios de Aceitação:** como na ESFORCO.1, com os valores acima.
- **Entrega:** commit `feat(ESFORCO.2)` · **Verificação:** `npm run sync:agentes` e `npm run check:agentes` sem diferença; `effort: medium` no executor-medio e `effort: high` no executor-pesado, logo abaixo de `model:`. Feita por Claude Code (Sonnet 5.5) (local · main) com `IA_SEM_TRAVA=1`, a pedido do usuário, 2026-10-16.
