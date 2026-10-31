## Etapa 016-3d8e2a71 — ESPEC-GLOBAL: fluxo de spec (requisitos, invariantes, perguntas abertas) em tarefa PESADA

**Tarefa:** ESPEC-GLOBAL · **Pedido em:** 2026-10-18 08:40 · **Criada por:** DeepSeek (Flash) (`CONFIG-DEEPSEEK` · local · main)
**Pedido:** "hoje eu tenho um projeto que se chama rules-ai, que importa as regras de IA pra dentro de
outros projetos, tem como eu adicionar isso nele?" — depois de analisar o Kiro (<https://kiro.dev>):
trazer ao `rules-ai` o **spec-driven development** (requisitos → design → tarefas), com exceção de
teste para `PESADO` e pacote `spec/` com templates + gate.
**Objetivo:** toda tarefa `PESADO` nascer com **requisito verificável**, **invariantes** e **perguntas
abertas fechadas** antes de o agente codar, entregue a todas as IAs pelo `sincronizar.mjs`.

> 🌐 **GLOBAL:** regra **C34**, decidida pelo usuário em 2026-10-18 08:45 (`;` respostas:
> "Abrir exceção só para tarefa PESADA" · "Completo: pasta spec/ com templates + gate" ·
> "Sim, seguir o protocolo completo").

### Escopo

- **Entra:** `regras/espec.md` (C34); exceção de teste de invariante em `regras/testes-validacao.md`
  (só `PESADO`); `spec/templates/` (requisitos, invariantes, perguntas abertas); `spec/README.md`;
  `spec/verificar-spec.mjs` (gate); C34 no `CONFLITOS.md`; linha no Registro de decisões.
- **Não entra:** rodar `--aplicar` (ação no computador do usuário → subtarefa .4); pasta `docs/specs/`
  em nenhum projeto (o plano continua sendo a etapa, C10); **exigir** property test (a exceção só
  **permite** o teste em `PESADO`).

### Riscos

| Risco | Plano B |
|---|---|
| Virar uma segunda convenção de plano (etapa × `spec/`) | A spec entra como **seções da própria etapa**; `spec/` guarda só os **blocos-modelo** e o gate, nunca o plano de uma tarefa |
| A exceção de teste virar "pode testar sempre" | A regra só permite teste de invariante/propriedade em `PESADO`, **declarado na seção Invariantes da etapa**, com o comando na Verificação |
| O gate travar entrega de `PESADO` que já estava em andamento | O gate só é exigido em `PESADO` criado **depois** da C34; etapas anteriores não são revalidadas |
| DeepSeek (Flash) executar `PESADO` (viola C22) | .1 fica ⬜ para Opus 5.5+/Fable; esta sessão só publica o quadro e entrega `LEVE`/`MEDIO` do seu nível |

### Decisões

| Data | Decisão | Quem | Palavras |
|---|---|---|---|
| 2026-10-18 08:45 | Teste de invariante: exceção **só** para tarefa `PESADO` | Gelvazio | "Abrir exceção só para tarefa PESADA" |
| 2026-10-18 08:45 | Pacote completo: pasta `spec/` com templates + gate | Gelvazio | "Completo: pasta spec/ com templates + gate" |
| 2026-10-18 08:45 | Criar TASK, commitar e dar push seguindo o protocolo do repo | Gelvazio | "Sim, seguir o protocolo completo" |

---

### ESPEC-GLOBAL.1 — Regra C34 e exceção de teste (`PESADO`)

**Próximo passo:** escrever `regras/espec.md` e a exceção em `regras/testes-validacao.md`.

- **Nível:** PESADO — muda regra global de todas as IAs (mesmo precedente da HERDR-GLOBAL.1).
- **Modelo:** só Opus 5.5+ ou Fable.
- **Effort:** high.
- **Descrição:** `regras/espec.md` (≤ 4 KB, sem repetir regra de outro arquivo, apontando para eles)
- **JEV-AI-SUGGESTION:** NAO
  com: quando vale (tarefa `PESADO`, conforme `ciclo-da-task.md`), e as **3 seções obrigatórias na
  etapa** antes de executar a primeira subtarefa — `### Requisitos` (cada requisito com critério
  **EARS**: `QUANDO… O SISTEMA DEVE…`), `### Invariantes` (regra que vale para toda entrada ou `N/A`
  justificado) e `### Perguntas abertas` (nenhuma ⬜ antes de codar). Mais: o gate
  `node spec/verificar-spec.mjs tasks/etapas/<etapa>.md` na Verificação da primeira subtarefa, e a
  exceção em `testes-validacao.md` (teste de invariante permitido **só** em `PESADO`, declarado na
  etapa).
- **Critérios de Aceitação:** `regras/espec.md` existe e aponta para `ciclo-da-task.md`,
  `testes-validacao.md` e `spec/README.md`; `testes-validacao.md` com a exceção de `PESADO` escrita
  no mesmo formato das outras exceções; C34 no `CONFLITOS.md`; `node scripts/sincronizar.mjs`
  (simulação) mostra a C34 no unificado das 9 IAs.

### ESPEC-GLOBAL.2 — Blocos-modelo em `spec/templates/`

**Próximo passo:** criar `spec/templates/requisitos.md`, `invariantes.md`, `perguntas-abertas.md` e
`spec/README.md`.

- **Nível:** LEVE — só `.md`, texto, sem lógica.
- **Modelo:** até Haiku/Flash.
- **Effort:** low.
- **Descrição:** os 3 blocos-modelo copiáveis para dentro da etapa, no formato do
- **JEV-AI-SUGGESTION:** NAO
  `tasks/etapas/ETAPA-*.md`, mais `spec/README.md` explicando o fluxo em 5 linhas e o comando do gate.
- **Critérios de Aceitação:** os 3 arquivos existem, cada um com o bloco `### …` no formato usado nas
  etapas; nenhum cita `docs/`; `spec/README.md` aponta para `regras/espec.md`.
- **Entrega:** `spec/README.md` + `spec/templates/{requisitos,invariantes,perguntas-abertas}.md`
  (commit `feat(ESPEC-GLOBAL.2)`).
- **Verificação:** leitura dos 4 arquivos; `Get-ChildItem spec -Recurse` lista os 5 caminhos; nenhum
  arquivo cita `docs/specs`.

### ESPEC-GLOBAL.3 — Gate `spec/verificar-spec.mjs` (`MEDIO`)

**Próximo passo:** criar `spec/verificar-spec.mjs` e rodar em `tasks/etapas/ETAPA-016-*.md`.

- **Nível:** MEDIO — código com lógica, 1 arquivo.
- **Modelo:** DeepSeek (raciocínio) ou Sonnet.
- **Effort:** medium.
- **Descrição:** lê a etapa (`node spec/verificar-spec.mjs <arquivo>` ou `--todas`) e confere, em
- **JEV-AI-SUGGESTION:** NAO
  **quadro** (C27): existe `### Requisitos` com ≥ 1 critério EARS; existe `### Invariantes` (ou `N/A`
  justificado); nenhuma pergunta aberta com ⬜; toda subtarefa tem `- **Nível:**`, `- **Modelo:**` e
  `- **Effort:**`. Sai com código 1 quando algo falta. ⛔ Não roda nem cria teste.
- **Critérios de Aceitação:** rodar em `ETAPA-016` dá ✅ nas 4 conferências; rodar numa etapa sem as
  seções dá ❌ com a lista do que falta; `node --check spec/verificar-spec.mjs` sem erro.

### ESPEC-GLOBAL.4 — Levar ao computador do usuário

**Próximo passo:** usuário roda os comandos da seção (ou pede a uma sessão local).

- **Nível:** — (ação no computador do usuário).
- **Modelo:** Usuário.
- **Descrição:** em `C:\fontes\rules-ai`: `git pull --rebase origin main` e
- **JEV-AI-SUGGESTION:** NAO
  `node scripts/sincronizar.mjs --aplicar`.
- **Critérios de Aceitação:** `dist/REGRAS-GLOBAIS.md` contém a C34; o bloco está nos arquivos globais
  de Claude Code, Codex, Grok, Qoder, opencode, Devin e Kiro.

---

### Entregas desta etapa

| Subtarefa | Commit | Verificação |
|---|---|---|
| ESPEC-GLOBAL.2 | `feat(ESPEC-GLOBAL.2)` | 4 arquivos em `spec/` (README + 3 templates), nenhum cita `docs/` |
| ESPEC-GLOBAL.1 | `feat(ESPEC-GLOBAL.1)` | `regras/espec.md` + exceção em `testes-validacao.md`; C34 no `CONFLITOS.md` |
| ESPEC-GLOBAL.3 | `feat(ESPEC-GLOBAL.3)` | gate ✅ em etapa com spec e ❌ na ETAPA-016; `node --check` sem erro |
