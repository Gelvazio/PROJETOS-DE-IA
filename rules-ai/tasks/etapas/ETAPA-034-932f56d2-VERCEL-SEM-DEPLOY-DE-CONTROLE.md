## Etapa 034-932f56d2 — VERCEL-SEM-DEPLOY-DE-CONTROLE: `tasks/` e `rules-local/` nunca geram deploy na Vercel (C46)

**Tarefa:** VERCEL-SEM-DEPLOY-DE-CONTROLE · **Pedido em:** 2026-10-22 07:24 · **Criada por:** Claude Code (Sonnet 5.5) (local · main · aulasenai s36)
**Pedido:** "rules-local/ TAMBEM DEVE SER REMOVIDO SEMPRE, NUNCA DEVE IR PRO DEPLOY DA NUVEM,
ADICIONE ESTA REGRA GLOBAL, PRA SERVIR EM TODOS OS PROJETOS" e "ESTA TAREFA AQUI, 337 colocou o
ignoreCommand no vercel.json, TAMBEM DEVE VALER PRA TODOS OS PROJETOS, ADICIONE ELA NO RULES-AI,
PRA QUALQUER PROJETO QUE SEGUIR AS REGRAS DELE, FAZER ISSO"
**Objetivo:** todo projeto que publica na Vercel e segue as regras do `rules-ai` cancela o deploy
de push que só mexe em arquivos de controle (`tasks/` e `rules-local/`) e nunca leva
`rules-local/` ao site; isso enche o Deployment Storage (plano gratuito: 12,07 GB de 10 GB no
`aulasenai`) sem mudar nada do que o aluno vê.

### Escopo

- **Entra:** regra nova `regras/vercel-sem-deploy-de-controle.md` (C46), `regras/INDEX.md`,
  `CONFLITOS.md`, `dist/` e `VERSAO.md` pelo `scripts/sincronizar.mjs`; nos projetos de `C:\fontes`
  que têm `vercel.json` (`aulasenai` e `dashboard-ai`), `ignoreCommand` e `.vercelignore`.
- **Não entra:** `.claude/` e demais pastas (o `.claude/rules/index.html` do `aulasenai` é aberto
  pelo site), apagar deploys antigos, mudar plano da Vercel, projeto sem `vercel.json`
  (REA-APP-CLONES) e projetos que ainda não estão em `C:\fontes`.

### Requisitos

| ID | Requisito (EARS) | Cobre | Verificação |
|----|------------------|-------|-------------|
| R1 | O SISTEMA DEVE ter a regra `regras/vercel-sem-deploy-de-controle.md` listada no `regras/INDEX.md` e entregue no `dist/REGRAS-GLOBAIS.md` | VERCEL-SEM-DEPLOY-DE-CONTROLE.1 | `grep -c C46 dist/REGRAS-GLOBAIS.md` ≥ 1 |
| R2 | ONDE o projeto tem `vercel.json`, O SISTEMA DEVE ter nele o `ignoreCommand` que sai com 0 quando o push só muda `tasks/` e `rules-local/` | VERCEL-SEM-DEPLOY-DE-CONTROLE.2, .3 | `json.load` do `vercel.json` e `git diff --quiet` do comando padrão num commit só de `tasks/` (código 0) e noutro com código (código 1) |
| R3 | ONDE o projeto tem `vercel.json`, O SISTEMA DEVE ter `rules-local/` no `.vercelignore` | VERCEL-SEM-DEPLOY-DE-CONTROLE.2, .3 | `grep -n "rules-local/" .vercelignore` |
| R4 | QUANDO um push só muda `tasks/` ou `rules-local/`, O SISTEMA DEVE mostrar na Vercel o deploy como CANCELED ou não criar deploy | VERCEL-SEM-DEPLOY-DE-CONTROLE.2 | MCP da Vercel `list_deployments` do projeto após um push de teste só de `tasks/` e outro só de `rules-local/` |
| R5 | SE o push muda qualquer outro arquivo além de `tasks/` e `rules-local/`, ENTÃO O SISTEMA DEVE publicar o deploy normalmente | VERCEL-SEM-DEPLOY-DE-CONTROLE.2 | o commit de entrega da subtarefa aparece como READY |

### Invariantes

N/A — mudança de texto de regra e de configuração (`vercel.json`, `.vercelignore`), sem código nem
dado do aluno; a conferência é por `grep`, `json.load` e consulta aos deploys (R1–R5).

### Perguntas abertas

| # | Pergunta | Resposta | Situação |
|---|----------|----------|----------|
| 1 | Quais projetos de `C:\fontes` publicam na Vercel? | `aulasenai` e `dashboard-ai` têm `vercel.json`; `REA-APP-CLONES` não tem (conferido em 2026-10-22) | ✅ Fechada |
| 2 | A `tasks/` também sai do site (`.vercelignore`)? | Não: o pedido é só `rules-local/` no site; `tasks/` só entra no filtro do deploy | ✅ Fechada |
| 3 | O deploy por Git respeita o `.vercelignore`? | Não se sabe; a conferência é pelo URL do deploy (`/rules-local/VERSAO.md` deve dar 404), registrada na `.2` | ✅ Fechada |

### Riscos

| Risco | Plano B |
|---|---|
| O `.vercelignore` pode não valer em deploy por Git | conferir o 404 de `/rules-local/VERSAO.md` no site; se der 200, o `ignoreCommand` continua valendo e o risco vira nova tarefa |
| `VERCEL_GIT_PREVIOUS_SHA` vazio no 1º deploy | o comando cai em `HEAD^` e, se falhar, o deploy segue (falha para o lado seguro) |

### Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-22 07:24 | As duas mensagens do usuário viram uma só regra (C46) e uma só tarefa | Usuário (registrado por Claude Code (Sonnet 5.5)) | ambas pedem a mesma economia de deploy, global |
| 2026-10-22 07:24 | A subtarefa da regra global é `PESADO`; o Sonnet não a executa | Claude Code (Sonnet 5.5) | regra global em vários arquivos e repositórios (`niveis-e-modelos.md`) |

### VERCEL-SEM-DEPLOY-DE-CONTROLE.1 — Regra global C46 (texto, índice, C46, sincronização)

**Próximo passo:** ✅ entregue em 2026-10-23; seguem a .2 e a .3

- **Nível:** PESADO — regra global que vale para todas as IAs e projetos, vários arquivos ligados
- **Modelo:** só Sonnet ou DeepSeek — nunca outro (trocado do Opus em 2026-10-23, RECLASSIFICAR-PESADO-OPUS.2)
- **Effort:** high
- **Descrição:** regra com: o que é arquivo de controle (`tasks/`, `rules-local/`), o
- **JEV-AI-SUGGESTION:** NAO
  `ignoreCommand` padrão, `rules-local/` no `.vercelignore`, quando aplicar (todo projeto com
  `vercel.json`; projeto que passar a publicar na Vercel já nasce com os dois), o que não entra e
  como conferir.
- **Critérios de aceitação:** R1.
- **Entrega:** 2026-10-23, Claude Code (Sonnet 5.5): criada `regras/vercel-sem-deploy-de-controle.md`
  (comando padrão, arquivos de controle, `.vercelignore`, quando aplicar, o que não entra, como
  conferir); item 22 em `regras/INDEX.md`; linha C46 em `CONFLITOS.md` (entre a C45 e a C47);
  `node scripts/sincronizar.mjs --aplicar` regravou `dist/REGRAS-GLOBAIS.md`, `VERSAO.md`
  (versão `2026-10-23-36a51f03`) e os arquivos globais das IAs (Gemini, Codex, Grok, Qoder,
  opencode, Devin, Kiro, Hermes, Kilo); as quatro contas do Claude Code já estavam iguais (importam
  o `dist/`). Commit: a cargo do Haiku (conferência).
- **Verificação:** `node scripts/sincronizar.mjs` (prévia) mostrou "mudaria" nas 9 IAs e depois
  `--aplicar` deu "gravado" nas 9; `grep -c C46 dist/REGRAS-GLOBAIS.md` = 2 (≥ 1, R1 atendido);
  `grep -n "^22\." regras/INDEX.md` acha a regra nova.

### VERCEL-SEM-DEPLOY-DE-CONTROLE.2 — Aplicar no `aulasenai`

**Próximo passo:** ✅ arquivos prontos em 2026-10-23; falta commit/push no aulasenai e conferir na Vercel

- **Nível:** MEDIO — configuração de 2 arquivos, com lógica de comparação
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Descrição:** o `aulasenai` já tem o `ignoreCommand` só com `tasks/` (#337); acrescentar
- **JEV-AI-SUGGESTION:** NAO
  `rules-local/` e a linha no `.vercelignore`; depois do push, conferir com `list_deployments`
  e com o URL `/rules-local/VERSAO.md`.
- **Critérios de aceitação:** R2, R3, R4 e R5 no `aulasenai`.
- **Depende de:** VERCEL-SEM-DEPLOY-DE-CONTROLE.1
- **Entrega:** 2026-10-23, Claude Code (Sonnet 5.5): no `aulasenai`, `vercel.json` (`ignoreCommand`
  agora com `':(exclude)tasks/' ':(exclude)rules-local/'`), `.vercelignore` (comentário + linha
  `rules-local/`), nova etapa `tasks/etapas/ETAPA-484-77fe60ae-VERCEL-SEM-DEPLOY-DE-CONTROLE.md`,
  linha da frente e linha da etapa no `tasks/STATUS.md`, e mãe + subtarefa ✅ no
  `tasks/task_complete.md`. Commit/push: a cargo do Haiku; conferência na Vercel (R4/R5): líder.
- **Verificação:** `JSON.parse` do `vercel.json` ok; `git diff -- vercel.json .vercelignore` só com a
  linha do `ignoreCommand` mudada e as 2 linhas novas do `.vercelignore`; `git diff --quiet` do
  comando padrão deu código 0 no commit `725e717e` (só `rules-local/`) e código 1 no `94310bde`
  (código de login). R4 e R5 (consulta aos deploys) ainda não conferidos.

### VERCEL-SEM-DEPLOY-DE-CONTROLE.3 — Aplicar no `dashboard-ai`

**Próximo passo:** ✅ arquivos prontos em 2026-10-23; falta commit/push no dashboard-ai e conferir na Vercel

- **Nível:** MEDIO — configuração de 2 arquivos, com lógica de comparação
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Descrição:** o `dashboard-ai` tem `vercel.json` (`functions` e `rewrites`) sem
- **JEV-AI-SUGGESTION:** NAO
  `ignoreCommand` e sem `.vercelignore`; acrescentar sem mexer no resto; o pre-push do projeto
  exige `npm run check:agentes` em dia.
- **Critérios de aceitação:** R2 e R3 no `dashboard-ai`.
- **Depende de:** VERCEL-SEM-DEPLOY-DE-CONTROLE.1
- **Entrega:** 2026-10-23, Claude Code (Sonnet 5.5): em `C:\fontes\DASHBOARD-AI-PRINCIPAL`,
  `vercel.json` ganhou a chave `ignoreCommand` (comando padrão da C46; `functions` e `rewrites`
  intactos), criado `.vercelignore` só com `rules-local/`, criada a etapa
  `tasks/etapas/ETAPA-029-b7e41c93-VERCEL-SEM-DEPLOY-DE-CONTROLE.md` e acrescentadas a mãe e a
  subtarefa `VERCEL-SEM-DEPLOY-DE-CONTROLE.1` (MEDIO · só Sonnet, ⬜) ao `tasks/STATUS.md` do
  projeto (linhas em "📌 Tarefas" e em "🗂️ Etapas"). Commit/push: a cargo do Haiku (conferência).
- **Verificação:** `JSON.parse` do `vercel.json` ok (chaves `$schema`, `ignoreCommand`,
  `functions`, `rewrites`); `git diff -- vercel.json` só com a linha do `ignoreCommand`;
  `grep -n "rules-local/" .vercelignore` acha a linha 1; `.vercelignore` não está no `.gitignore`;
  comando padrão: código 0 no commit `901edb6` (só `rules-local/` e `tasks/`) e código 1 no
  `5cd83ea` (outros arquivos), ou seja, R2 e R3 atendidos; `npm run check:agentes` = 0
  desatualizado(s). Pendente (R4/R5): conferir na Vercel depois do push.
