## Etapa 006-42e7edab — MODELO: Modelo de IA em cada subtarefa e divisão do CLONE

**Tarefa:** MODELO · **Pedido em:** 2026-10-15 23:23 · **Criada por:** Claude Code (Opus 5.5) (local · main)
**Pedido:** "adicione nas tasks faceis o modelo que deve eecutar elas, e anote isso no quadro pra eu
pegar com outro modelo em outra sessao, coloque o modelo em todas as tasks,e divida no maximo de
subtasks possivel,pradividir bem"
**Objetivo:** cada subtarefa diz no quadro qual modelo deve executá-la, e as subtarefas do CLONE
ficam pequenas o bastante para várias sessões (e modelos mais fracos) trabalharem em paralelo.

### MODELO.1 — Coluna "Modelo" no quadro e no modelo do quadro

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — só `.md` (quadro e regra do quadro) · **Modelo:** Claude Code Haiku 5.5
- **Descrição:** coluna `Modelo` (nível + modelo indicado pela matriz da skill
- **JEV-AI-SUGGESTION:** NAO
  `classificar-tarefa`) no `STATUS.md`, no `task_complete.md` e no modelo do `quadro.md`; linha
  `**Modelo:**` ao lado do `**Nível:**` nas seções das etapas (`multiplas-ias.md`).
- **Critérios de Aceitação:** todas as linhas abertas com o modelo preenchido.
- **Entrega:** commit `docs(MODELO.1)` · **Verificação:** coluna nas 2 tabelas e no `quadro.md`;
  o hook `.claude/hooks/exigir-reserva.mjs` (que lia Status/Em uso por pela posição e quebrou com a
  coluna nova) agora acha as colunas pelo título — `node --check` ok, libera com reserva (0) e
  barra sem reserva (2). Feita por Claude Code (Opus 5.5) (local · main), 2026-10-15.

### MODELO.2 — Dividir as subtarefas do CLONE no máximo possível

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — planejamento de várias subtarefas com dependências · **Modelo:** Claude Code Sonnet 5.5
- **Descrição:** trocar CLONE.1 e CLONE.3 a CLONE.14 por subtarefas de 1 arquivo/função cada,
- **JEV-AI-SUGGESTION:** NAO
  com nível, modelo e dependências, no `STATUS.md` e na ETAPA-005.
- **Critérios de Aceitação:** nenhuma subtarefa aberta do CLONE com mais de ~1 arquivo de código.
- **Entrega:** commit `docs(MODELO.2)` · **Verificação:** 108 linhas `CLONE.N.x` no `STATUS.md` e
  108 seções na ETAPA-005, cada uma com `**Nível:**`, `**Modelo:**` e `**Depende de:**`; seções
  antigas viraram nota "dividida em …". Script de geração na pasta da sessão (fora do repositório).
  Feita por Claude Code (Opus 5.5) (local · main), 2026-10-15.
