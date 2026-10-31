## Etapa 007 — GRAPHIFY-GLOBAL: ler o relatório antes de criar ou executar tarefa e atualizar ao fim

**Tarefa:** GRAPHIFY-GLOBAL · **Pedido em:** 2026-10-17 12:26 · **Criada por:** Claude Code (Opus 5.5) (local · main · aulasenai s14)
**Pedido:** "ajuste a regra global de graphify.md, pra sempre ler o graph_report.md antes de
executar 1 tarefa e antes de criar 1 tarefa, e ao final de 1 tarefa,sempre ao final da terefa,
atualize usando o *graphifyy update .* ao final da tarefa quando a mesma é completa e removida do
quadro de tarefas, grave esta regra nas regras globais,deve ser usada em todos os projetos e
sincronize as regras globais"
**Objetivo:** em todos os projetos e IAs, o `GRAPH_REPORT.md` é lido antes de criar e antes de
executar cada tarefa, e o grafo é atualizado (`graphify update .`) ao fim de cada tarefa concluída
e retirada do quadro.

> 🌐 **GLOBAL:** substitui a C11 (que mandava rodar só uma vez no início da conversa e proibia
> rodar ao finalizar tarefas). O usuário decidiu a regra na mesma mensagem (conflito C25, já
> decidido). Projetos com `graphify.md` próprio que contradizia (aulasenai, REA-APP-CLONES)
> passam a só apontar para a regra global.

### Texto novo de `regras/graphify.md` (substituir o arquivo inteiro, sem mudar)

```markdown
# 🕸️ graphify — grafo de conhecimento do projeto

Decidido em 2026-10-16 (C11) e mudado em 2026-10-17 (C25). Vale para todos os projetos e todas
as IAs; a regra do projeto só pode **acrescentar** (ex.: onde fica o comando), não contradizer.

**Comando:** o do `AGENTS.md`/`CLAUDE.md` do projeto; sem ele,
`C:\Python314\python.exe -m graphify update .` na raiz do projeto (na nuvem, `python3 -m graphify
update .`). Sem perguntar.

## Quando ler o `graphify-out/GRAPH_REPORT.md`

- ✅ **Antes de criar uma tarefa** e **antes de executar uma tarefa** (cada subtarefa reservada):
  ler e analisar o relatório do projeto ativo e usar o que for relevante (comunidades, nós
  principais, arquivos e relações) para achar os arquivos e entender o que a tarefa afeta.
- ✅ Também antes de responder sobre arquitetura, arquivos e relações; citar o arquivo de origem
  e dizer o que o grafo não cobre.
- Perguntas triviais (sintaxe, uma linha já aberta na conversa) dispensam a leitura.

## Quando atualizar o grafo

- ✅ **No início de cada conversa nova**, uma vez, antes do primeiro pedido (relatório em dia).
- ✅ **Ao fim de cada tarefa**: quando a tarefa fica **completa e é retirada do quadro** (linha da
  mãe ✅ movida para o `task_complete.md`), depois do commit + push da entrega, rodar o comando
  acima. Subtarefa entregue com a mãe ainda aberta não roda.
- ⛔ Fora desses momentos, não rodar (nem a cada commit ou pedido).

## Falhas

- `graphify-out/` fica fora do Git.
- Relatório ausente ou update com erro: avisar o usuário e seguir sem o relatório.
```

### GRAPHIFY-GLOBAL.1 — Regra global, conflito C25 e status do projeto

**Próximo passo:** — (entregue).

- **Nível:** LEVE — só `.md`.
- **Modelo:** só Haiku — nunca outro
- **Descrição:** (1) substituir `regras/graphify.md` pelo texto acima; (2) em `CONFLITOS.md`, na
- **JEV-AI-SUGGESTION:** NAO
  tabela "Decididos depois", acrescentar no fim a linha
  `| C25 | Graphify: ler antes de criar/executar tarefa e atualizar ao fim (substitui a C11) | ✅ Ler o `GRAPH_REPORT.md` antes de criar e antes de executar cada tarefa; `graphify update .` no início da conversa e ao fim de cada tarefa concluída e retirada do quadro. Pedido do usuário em 2026-10-17; regra em `regras/graphify.md` |`
  e, no fim da linha C11, acrescentar ` · **Substituída pela C25 (2026-10-17).**`; (3) em
  `STATUS_PROJETO.md`, nova linha no topo de "O que mudou desde a última gravação" com data e
  hora (Brasília) e o que mudou.
- **Entrega (2026-10-17 12:28, Haiku · executor-leve; líder Opus 5.5):** os 3 arquivos.
- **Verificação (líder):** `regras/graphify.md` igual ao texto da etapa (comparação feita por
  script); C11 marcada como substituída e linha C25 no fim de "Decididos depois"; linha nova no
  topo do `STATUS_PROJETO.md`.

### GRAPHIFY-GLOBAL.2 — Alinhar o `graphify.md` dos projetos

**Próximo passo:** — (entregue).

- **Nível:** LEVE — só `.md`.
- **Modelo:** só Haiku — nunca outro
- **Descrição:** `C:\fontes\aulasenai\.claude\rules\graphify.md` e
- **JEV-AI-SUGGESTION:** NAO
  `C:\fontes\REA-APP-CLONES\.claude\rules\graphify.md` contradizem a regra nova ("⛔ não rodar ao
  finalizar tarefas"); passam a só apontar para a global e manter o que é do projeto. As pastas
  `aulas-senai-CLAUDE-*` são cópias do repositório do aulasenai e recebem pelo `git pull`.
- **Entrega (2026-10-17 12:31, Haiku · executor-leve; líder Opus 5.5):** `aulasenai`:
  `.claude/rules/graphify.md` reescrito (só aponta para a C25 e guarda o comando, a skill e o
  aviso dos 5.000 nós) e `docs/HISTORICO-REGRAS.md` (commit `a4c754e6`); `REA-APP-CLONES`:
  `.claude/rules/graphify.md` (commit `500d5bf`). **Ajuste do líder:** a linha do `graphify.md`
  nos `INDEX.md` dos dois projetos (citava a C11). Visualizador do aulasenai regenerado.
- **Verificação (líder):** leitura dos dois arquivos: nenhum "⛔ não rodar ao finalizar"; ambos
  citam a C25.

### GRAPHIFY-GLOBAL.3 — Rodar o sincronizador

**Próximo passo:** — (entregue).

- **Nível:** LEVE — rodar um script já existente.
- **Modelo:** só Haiku — nunca outro
- **Descrição:** `node scripts/sincronizar.mjs --aplicar` (autorizado pelo usuário: "sincronize as
- **JEV-AI-SUGGESTION:** NAO
  regras globais"); conferir que `dist/REGRAS-GLOBAIS.md` tem o texto novo.
- **Entrega (2026-10-17 12:30, Haiku · executor-leve; líder Opus 5.5):** `node scripts/sincronizar.mjs
  --aplicar` sem erro: `dist/REGRAS-GLOBAIS.md` regerado; gravado em Gemini CLI, Codex, Grok,
  Qoder, opencode, Devin e Kiro; Claude Code já igual (usa `@import` do `dist`). **Ajuste do
  líder:** o `~/.claude/CLAUDE.md` tinha, fora do bloco do sincronizador, a seção antiga "Graphify
  no início de cada conversa" (C11), que contradizia a C25; trocada pelo texto da C25 (cópia
  `CLAUDE.md.bak3`).
- **Verificação:** `dist/REGRAS-GLOBAIS.md`, `~/.gemini/GEMINI.md` e `~/.codex/AGENTS.md` contêm
  "Antes de criar uma tarefa"; `~/.claude/CLAUDE.md` com a seção C25.
