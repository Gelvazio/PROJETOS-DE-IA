## Etapa 014-3a7ab4ef — ACEITE-GLOBAL: a IA sempre aceita, nunca pede aceite ao usuário

**Tarefa:** ACEITE-GLOBAL · **Pedido em:** 2026-10-17 21:50 · **Criada por:** Claude Code (Opus 5.5) (local · main), aberto em `dashboard-ai-codex`
**Pedido:** "quero que aceite sempre tudo, isso esta na regra global ja em rules-ai, ela esta
sincronizada aqui?" e, depois da proposta em 3 itens, "1-SEMPRE ACEITE,NUNCA PERGUNTE;2-SIM;3-SIM".
**Objetivo:** em todos os projetos e IAs, nenhuma tarefa espera o aceite do usuário: quem entrega
confere e fecha. E as regras globais passam a carregar também nas contas `~/.claude-contaA/B/C`.

> 🌐 **GLOBAL:** regra C32, decidida pelo usuário no pedido.

### Escopo

- **Entra:** `regras/ciclo-da-task.md`, `regras/quadro-de-tarefas.md` e `regras/esforco.md` (tirar
  a subtarefa de aceite); C32 no `CONFLITOS.md`; Registro de decisões; `scripts/sincronizar.mjs`
  com as contas A, B e C do Claude Code; `node scripts/sincronizar.mjs --aplicar`; aceites deste
  quadro fechados pela nova regra.
- **Não entra:** a aprovação do plano de tarefa grande e a autorização de produção (não são aceite;
  continuam); aceites pendentes nos quadros dos outros projetos (cada projeto aplica ao sincronizar).

### Decisões

| Data | Decisão | Quem | Palavras |
|---|---|---|---|
| 2026-10-17 21:50 | Plano em 3 itens aprovado: regra global sem aceite, `CLAUDE.md` nas contas A/B/C só com o import, alinhar o `dashboard-ai-codex` | Gelvazio | "1-SEMPRE ACEITE,NUNCA PERGUNTE;2-SIM;3-SIM" |

### ACEITE-GLOBAL.1 — Regra C32 nas regras globais

**Próximo passo:** — (entregue).

- **Nível:** PESADO — muda regra global de todas as IAs.
- **Modelo:** só Opus 5.5+ ou Fable — nunca outro
- **Effort:** high
- **Descrição:** tirar a subtarefa "Aceite do usuário" do ciclo e do modelo do quadro; o 👀 fica só
- **JEV-AI-SUGGESTION:** NAO
  para o que só o usuário pode fazer.
- **Critérios de Aceitação:** nenhuma regra global manda criar aceite; C32 no `CONFLITOS.md`.
- **Entrega:** commit `feat(ACEITE-GLOBAL.1)`: `regras/ciclo-da-task.md` (item 2 de Encerrar),
  `regras/quadro-de-tarefas.md` (coluna Modelo e modelo da etapa), `regras/esforco.md`, C32 no
  `CONFLITOS.md` e Registro de decisões. Aceites deste quadro fechados pela regra: ESFORCO-GLOBAL.5
  e DASHBOARD-REDE-NEURAL.19 (entregas já feitas) → ✅ Concluído (C32), o que fecha a mãe
  ESFORCO-GLOBAL (com a .1, que tinha ficado no quadro); GERENCIADOR-GLOBAL.6 e
  DASHBOARD-REDE-NEURAL.5 (dependências ainda abertas) → ✅ Dispensado (C32). Todas movidas para o
  `task_complete.md`.
- **Verificação:** `grep -i aceite regras/` só encontra o texto da C32; linhas conferidas no
  `task_complete.md`, no fim da tabela.

### ACEITE-GLOBAL.2 — Sincronizador com as contas A, B e C e `--aplicar`

**Próximo passo:** — (entregue).

- **Nível:** PESADO — grava nos arquivos globais de todas as IAs.
- **Modelo:** só Opus 5.5+ ou Fable — nunca outro
- **Effort:** high
- **Descrição:** `~/.claude-contaA/CLAUDE.md`, `~/.claude-contaB/CLAUDE.md` e
- **JEV-AI-SUGGESTION:** NAO
  `~/.claude-contaC/CLAUDE.md` com o `@import` do `dist/REGRAS-GLOBAIS.md`.
- **Critérios de Aceitação:** os 3 arquivos existem com o bloco; o `dist` traz a C32.
- **Entrega:** commit `feat(ACEITE-GLOBAL.2)`: 3 destinos novos em `scripts/sincronizar.mjs`
  (`Claude Code (contaA/B/C)`, modo `importar`). `--aplicar` gravou os 3 `CLAUDE.md` novos e
  regravou o bloco de Gemini CLI, Codex, Grok, Qoder, opencode, Devin e Kiro (com `.bak`); o
  `~/.claude/CLAUDE.md` ficou igual.
- **Verificação:** `node --check`; simulação antes do `--aplicar`; os 3 arquivos lidos com o
  bloco `@C:/fontes/rules-ai/dist/REGRAS-GLOBAIS.md`; `grep C32` no `dist`, no Codex e no Gemini.
