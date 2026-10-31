## Etapa 008 — SUBTAREFA-GLOBAL: a IA cria subtarefas na mãe atual e publica direto

**Tarefa:** SUBTAREFA-GLOBAL · **Pedido em:** 2026-10-17 12:46 · **Criada por:** Claude Code (Opus 5.5) (local · main)
**Pedido:** "um agente em 1 tarefa,pode criar mais tarefas e publicar no quadro pra outros agentes
pegar?" → "1-SOMENTE SUBTAREFAS DENTRO DA MAE ATUAL;2-PUBLICA DIRETO A TAREFA"
**Objetivo:** em todos os projetos e IAs, a IA que está numa subtarefa pode criar subtarefas novas
**só dentro da mãe atual** e as publica no quadro **sem esperar aprovação**, para outro agente do
modelo certo pegar.

> 🌐 **GLOBAL:** conflito C26, decidido pelo usuário na mesma conversa.

### Texto novo de `regras/ciclo-da-task.md`

Na seção `## Executar`, logo depois do item "⛔ **Nunca executar subtarefa que não é do seu
modelo**…" (2 linhas), inserir este item, sem mudar:

```markdown
- ✅ **Trabalho novo descoberto no caminho vira subtarefa da mãe atual** (C26, 2026-10-17): a IA
  que está numa subtarefa pode criar **subtarefas novas só dentro da mãe atual**
  (`<TAREFA>.<próximo número>`), com nível, modelo e `effort`, seção na etapa (descrição, critérios
  e próximo passo) e linha `⬜` livre no `STATUS.md`, e **publica direto** (commit + push do quadro,
  sem esperar aprovação do usuário). Não reserva a nova (segue na sua) e ⛔ **nunca cria
  tarefa-mãe nova**: trabalho fora da mãe atual → avisar o usuário. Na equipe de agentes do Claude
  Code, o executor avisa o líder, e o líder cria e publica.
```

### SUBTAREFA-GLOBAL.1 — Regra global, conflito C26 e status do projeto

**Próximo passo:** — (entregue).

- **Nível:** LEVE — só `.md`.
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **Descrição:** (1) inserir o item acima em `regras/ciclo-da-task.md`; (2) em `CONFLITOS.md`, na
- **JEV-AI-SUGGESTION:** NAO
  tabela "Decididos depois", acrescentar no fim a linha
  `| C26 | IA cria subtarefas no caminho | ✅ Só **subtarefas dentro da mãe atual** (nunca mãe nova), com nível, modelo e `effort`, publicadas direto (commit + push, sem aprovação); não reserva a nova; na equipe do Claude Code quem cria é o líder. Pedido do usuário em 2026-10-17; regra em `regras/ciclo-da-task.md` |`;
  (3) em `STATUS_PROJETO.md`, nova linha no topo de "O que mudou desde a última gravação" com data
  e hora (Brasília) e o que mudou.
- **Critério de pronto:** os 3 arquivos com o texto exato; nada mais alterado.
- **Entrega (2026-10-17 12:48, Haiku · executor-leve; líder Opus 5.5):** os 3 arquivos.
- **Verificação (líder):** `git diff --stat` = só os 3 arquivos (9 linhas inseridas); item C26 logo
  depois do "⛔ Nunca executar…" em `ciclo-da-task.md`; linha C26 depois da C25 em `CONFLITOS.md`;
  linha nova no topo do `STATUS_PROJETO.md`.

### SUBTAREFA-GLOBAL.2 — Rodar o sincronizador

**Próximo passo:** — (entregue).

- **Nível:** LEVE — rodar um script já existente.
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **Descrição:** a regra só chega às IAs depois do `--aplicar`; conferir que
- **JEV-AI-SUGGESTION:** NAO
  `dist/REGRAS-GLOBAIS.md` contém "Trabalho novo descoberto no caminho".
- **Entrega (2026-10-17 12:54, Haiku · executor-leve; líder Opus 5.5):** `node scripts/sincronizar.mjs
  --aplicar` sem erro (saída 0): `dist/REGRAS-GLOBAIS.md` regerado; gravado em Claude Code, Gemini
  CLI, Codex, Grok, Qoder, opencode, Devin e Kiro.
- **Verificação (líder):** a frase está em `dist/REGRAS-GLOBAIS.md`, `~/.gemini/GEMINI.md`,
  `~/.codex/AGENTS.md` e `~/.kiro/steering/rules-ai.md`; `~/.claude/CLAUDE.md` importa o `dist`
  (`@C:/fontes/rules-ai/dist/REGRAS-GLOBAIS.md`).

## Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-17 12:46 | Só subtarefas dentro da mãe atual; publicação direta, sem aprovação | Gelvazio | "1-SOMENTE SUBTAREFAS DENTRO DA MAE ATUAL;2-PUBLICA DIRETO A TAREFA" |
| 2026-10-17 12:52 | Usuário autoriza rodar o `sincronizar.mjs --aplicar` | Gelvazio | "sim" à pergunta "Posso rodar o sincronizador agora?" |
| 2026-10-17 12:46 | Executada pelo líder Opus 5.5 com o agente Haiku (subtarefa LEVE) | Claude Code (Opus 5.5) | Fluxo de equipe de `niveis-e-modelos.md` (C22) |
