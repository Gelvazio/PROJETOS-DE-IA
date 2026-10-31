## Etapa 010 — STATUS-QUADRO-GLOBAL: todo status é mostrado em quadro

**Tarefa:** STATUS-QUADRO-GLOBAL · **Pedido em:** 2026-10-17 12:54 · **Criada por:** Claude Code (Opus 5.5) (local · main)
**Pedido:** "crie 1 regra global aqui que deve servir pra todas as IA, todos os staus devem sempre
ser mostrados em forma de quadro aqui no cmd ou no claude code IDE, registre isso como tarefa aqui"
**Objetivo:** em todos os projetos e IAs, toda resposta que mostra status (no terminal ou no chat
do IDE) mostra esse status num quadro (tabela), nunca em texto corrido ou lista solta.

> 🌐 **GLOBAL:** conflito C27, decidido pelo usuário no pedido.

### Texto novo de `regras/exibicao-de-status.md` (arquivo novo, sem mudar)

```markdown
# 📊 Exibição de status — sempre em quadro

Decidido em 2026-10-17 (C27). Vale para todos os projetos e todas as IAs, no terminal (cmd,
PowerShell, bash) e no chat do Claude Code no IDE.

- ✅ **Todo status é mostrado em quadro**: tabela Markdown com uma linha por item. Vale para
  tarefas e subtarefas, frentes e reservas, pendências, andamento de um projeto, resultado de
  conferências e de sincronização.
- Colunas mínimas para tarefas: **Tarefa · Título · Modelo · Status**, e **Em uso por** quando
  houver reserva; outros assuntos usam as colunas que fizerem sentido (ex.: Item · Situação · Detalhe).
- Status sempre com o emoji da legenda do quadro: ⬜ Pendente · 🔄 Em progresso · ✅ Concluído ·
  ⛔ Bloqueado · 👀 Aguardando o usuário.
- ⛔ Não mostrar status em texto corrido nem em lista solta. O texto fora do quadro fica só para o
  que a tabela não diz (próximo passo, pergunta, alerta).
- Onde o Markdown não é renderizado (saída de script no cmd), usar tabela em texto puro, com as
  colunas alinhadas.
- Exceção: ao encerrar uma tarefa, a resposta continua sendo só **TAREFA FINALIZADA E
  SINCRONIZADA!** (`ciclo-da-task.md`).
```

### STATUS-QUADRO-GLOBAL.1 — Regra global, conflito C27 e status do projeto

**Próximo passo:** — (entregue).

- **Nível:** LEVE — só `.md`.
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **Descrição:** (1) criar `regras/exibicao-de-status.md` com o texto acima; (2) em `CONFLITOS.md`,
- **JEV-AI-SUGGESTION:** NAO
  na tabela "Decididos depois", acrescentar no fim a linha
  `| C27 | Exibição de status | ✅ Todo status (tarefas, frentes, pendências, conferências) é mostrado em **quadro** (tabela), no terminal e no chat do IDE, com o emoji da legenda; nunca em texto corrido ou lista solta. Pedido do usuário em 2026-10-17; regra em `regras/exibicao-de-status.md` |`;
  (3) em `STATUS_PROJETO.md`, nova linha no topo de "O que mudou desde a última gravação" com data
  e hora (Brasília) e o que mudou.
- **Critério de pronto:** os 3 arquivos com o texto exato; nada mais alterado.
- **Entrega (2026-10-17 12:56, Haiku · executor-leve; líder Opus 5.5):** os 3 arquivos.
- **Verificação (líder):** `regras/exibicao-de-status.md` igual ao bloco da etapa (comparação por
  script); linha C27 depois da C26 em `CONFLITOS.md`; linha nova no topo do `STATUS_PROJETO.md`.

### STATUS-QUADRO-GLOBAL.2 — Rodar o sincronizador

**Próximo passo:** — (entregue).

- **Nível:** LEVE — rodar um script já existente.
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **Descrição:** a regra só chega às IAs depois do `--aplicar`; conferir que
- **JEV-AI-SUGGESTION:** NAO
  `dist/REGRAS-GLOBAIS.md` contém "Todo status é mostrado em quadro".
- **Entrega (2026-10-17 12:59, Haiku · executor-leve; líder Opus 5.5):** `sincronizar.mjs --aplicar` sem erro (saída 0); gravado em Gemini CLI, Codex, Grok, Qoder, opencode, Devin e Kiro; Claude Code igual (usa o `@import` do `dist`).
- **Verificação (líder):** a frase está em `dist/REGRAS-GLOBAIS.md`, `~/.gemini/GEMINI.md`, `~/.codex/AGENTS.md` e `~/.kiro/steering/rules-ai.md`.

## Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-17 12:54 | Todo status mostrado em quadro, em todas as IAs, no terminal e no IDE | Gelvazio | "todos os staus devem sempre ser mostrados em forma de quadro aqui no cmd ou no claude code IDE" |
| 2026-10-17 12:58 | Usuário autoriza rodar o `sincronizar.mjs --aplicar` | Gelvazio | "sim" à pergunta "Posso rodá-lo agora?" |
| 2026-10-17 13:17 | Tarefa reaberta para a `.3` (ampliar a C27), a pedido do usuário | Gelvazio | "sim, abra a subtarefa e atualize a C27" |
| 2026-10-17 12:54 | Executada pelo líder Opus 5.5 com o agente Haiku (subtarefa LEVE) | Claude Code (Opus 5.5) | Fluxo de equipe de `niveis-e-modelos.md` (C22) |

### STATUS-QUADRO-GLOBAL.3 — ID da tarefa e linha da mãe em todo quadro (ampliação da C27)

**Próximo passo:** — (entregue).

- **Nível:** LEVE — só `.md` e rodar um script já existente.
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **Pedido:** "sim, abra a subtarefa e atualize a C27" (2026-10-17 13:17), depois de "NESTE QUADRO ACIMA,N TEM O ID DA TAREFA E DAS SUBTASKS?".
- **Descrição:** (1) em `regras/exibicao-de-status.md`, trocar as 2 linhas do item que começa com
- **JEV-AI-SUGGESTION:** NAO
  "- Colunas mínimas para tarefas: **Tarefa · Título · Modelo · Status**" (termina em
  "(ex.: Item · Situação · Detalhe).") pelo bloco abaixo, sem mudar; (2) em `CONFLITOS.md`, no fim
  da linha C27 (antes do último ` |`), acrescentar
  ` · **Ampliada em 2026-10-17:** coluna Tarefa (ID) em todo quadro que fala de tarefa e linha da mãe junto das subtarefas (STATUS-QUADRO-GLOBAL.3)`;
  (3) nova linha no topo de "O que mudou desde a última gravação" do `STATUS_PROJETO.md`;
  (4) `node scripts/sincronizar.mjs --aplicar` e conferir que `dist/REGRAS-GLOBAIS.md` contém
  "Mãe junto das subtarefas".

```markdown
- Colunas mínimas para tarefas: **Tarefa (ID) · Título · Modelo · Status**, e **Em uso por**
  quando houver reserva; outros assuntos usam as colunas que fizerem sentido (ex.: Item · Situação
  · Detalhe).
- ✅ **ID sempre visível:** todo quadro que fala de tarefa ou subtarefa (inclusive comparação,
  perguntas, riscos ou decisões de uma tarefa) tem a coluna **Tarefa** com o ID (`<TAREFA>` ou
  `<TAREFA>.<n>`); se todas as linhas são da mesma subtarefa, o ID vai no título do quadro.
- ✅ **Mãe junto das subtarefas:** ao mostrar subtarefas, a linha da tarefa-mãe vem primeiro, em
  negrito, com o status dela.
```

- **Critério de pronto:** só esse item muda na regra; linha C27 ampliada; sincronizador sem erro.
- **Entrega (2026-10-17 13:19, Haiku · executor-leve; líder Opus 5.5):** `regras/exibicao-de-status.md`, `CONFLITOS.md`, `STATUS_PROJETO.md`; `sincronizar.mjs --aplicar` sem erro (7 IAs gravadas; Claude Code igual).
- **Verificação (líder):** `git diff --stat` = só os 3 arquivos; regra sem entidades HTML; `dist/REGRAS-GLOBAIS.md` contém "Mãe junto das subtarefas".
