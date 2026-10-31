## Etapa 059-5a44c460 — RAIZ-FONTES-GLOBAL: as regras do rules-ai valem também na raiz `C:\fontes`

**Tarefa:** RAIZ-FONTES-GLOBAL · **Pedido em:** 2026-10-31 16:58 · **Criada por:** Claude Code (Opus 5.5) (local · main · fontes)
**Pedido:** "ajuste rules-ai,pra que aplique as relgras em c:\fontes tambem" · "use o maximo possivel
de agentes haiku para a tarefa" · antes: "faça commit e push pra cada tarefa finalizada, assim como
está ordenado em rules-ai"
**Objetivo:** tratar a raiz `C:\fontes` (repositório `Gelvazio/PROJETOS-DE-IA`, privado, `main`)
como mais um projeto das regras globais, com as proteções que ela exige por conter os outros
repositórios.

### Escopo

- **Entra:** regra nova `regras/raiz-fontes.md` (C57) e ajustes de escopo em `rules-local.md`,
  `jev.md`, `quadro-de-tarefas.md`, `graphify.md` e `git-geral.md`; `dist/` e `VERSAO.md`
  regerados sem `--aplicar`; na raiz: `.gitignore`, `rules-local/` com os ganchos (instalador
  existente, sem mudar código), bloco `rules-ai:global` e correções no `AGENTS.md`/`CLAUDE.md`,
  quadro próprio em `tasks/`.
- **Não entra:** `UPDATE.py` e `instalar-ai-memory.mjs` (exigem código e `ignore_paths` novos),
  gerenciador central, graphify na raiz, `--aplicar` nas IAs (fica com o usuário), apagar ou mover
  pastas.

### Critério de pronto

- `git -C C:/fontes status --short` não lista pasta com `.git` próprio, `DEMAIS-PROJETOS-*` nem
  `config-de-tarefa-agendada.txt`.
- `C:\fontes\rules-local\VERSAO.md` existe; o `.claude/settings.json` da raiz tem `SessionStart` e
  `UserPromptSubmit`.
- A C57 está em `regras/raiz-fontes.md`, no `regras/INDEX.md` e no `dist/REGRAS-GLOBAIS.md`.
- Cada subtarefa entregue com 1 commit + 1 push no repositório dela.

### Riscos e plano B

- `git add` na raiz transformar repositório aninhado em submódulo → o `.gitignore` (.5) vem antes
  de qualquer outro commit na raiz; conferir `git diff --cached --name-only` em todo commit.
- Ganchos da raiz rodarem sem `TYPESAFE_API_KEY` → os ganchos saem com código 0 (C44); plano B:
  tirar a entrada do `.claude/settings.json` da raiz.
- [Provável] O Claude Code não herda o `.claude/settings.json` da raiz nas sessões abertas num
  subprojeto (as configurações são por projeto); plano B: se herdar, mover os ganchos da raiz
  para `.claude/settings.local.json`.
- graphify na raiz varreria `DEMAIS-PROJETOS-*` (C20, C23) e os outros repositórios → a C57
  proíbe graphify na raiz.
- Token em `config-de-tarefa-agendada.txt` → fica no `.gitignore`; rotacionar é do usuário (.10).
- Haikus em paralelo no mesmo repositório → cada executor só edita os arquivos da sua subtarefa e
  não usa Git; um Haiku conferente commita uma subtarefa por vez (C41).

### Decisões

- 2026-10-31 16:58 · Claude Code (Opus 5.5): a raiz entra como projeto, com quadro próprio só para
  tarefas da raiz; tarefa de um projeto continua no quadro dele.
- 2026-10-31 16:58 · Claude Code (Opus 5.5): sem graphify na raiz; cada projeto mantém o seu (C25).
- 2026-10-31 16:58 · Claude Code (Opus 5.5): `UPDATE.py` continua sem a raiz; o pull da raiz é
  feito à parte (a C57 diz isso).
- 2026-10-31 16:58 · Claude Code (Opus 5.5): tarefa dividida em subtarefas de até 3 arquivos para
  rodar com vários Haikus em paralelo, a pedido do usuário; o nível de cada uma é do Jev (C52).

### RAIZ-FONTES-GLOBAL.1 — Criar a regra C57 `regras/raiz-fontes.md` e citá-la no `INDEX.md`

**Próximo passo:** aguardar o "sim" do usuário ao plano.

- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **Fonte:** sinais
- **Descrição:** criar `regras/raiz-fontes.md` no estilo das outras regras: a raiz é projeto
  (repositório próprio com mapa, portal, dashboard, `projetos.json` e perfis); `.gitignore`
  obrigatório com toda pasta de `.git` próprio, `DEMAIS-PROJETOS-*/`, arquivos com segredo e
  `graphify-out/`; pasta nova com `.git` próprio entra no `.gitignore` no mesmo commit em que entra
  no mapa; nunca `git add` de pasta com `.git` próprio; commit + push na `main` a cada tarefa;
  quadro próprio só para tarefas da raiz; `rules-local/` instalado por
  `scripts/instalar-rules-local.mjs C:/fontes`; sem graphify na raiz; `UPDATE.py` não cobre a raiz;
  sem `ai-memory` na raiz até haver `ignore_paths` que cubra os projetos e os segredos; regra do
  projeto vence na pasta dele. Citar no `regras/INDEX.md` (item novo, antes de
  `atividades-e-idioma.md`, renumerando o resto).
- **Critérios de Aceitação:** os dois arquivos com a C57; nenhuma linha acima de 100 caracteres.
- **JEV-AI-SUGGESTION:** NAO

### RAIZ-FONTES-GLOBAL.2 — Incluir a raiz no escopo de `rules-local.md` e `jev.md`

**Próximo passo:** aguardar o "sim" do usuário ao plano.

- **Nível:** LEVE — classificado (jev (confiança 0.96))
- **Modelo:** só Haiku 5.5 ou DeepSeek V4.1 Flash — nunca outro
- **Effort:** low
- **Fonte:** jev (confiança 0.96)
- **Descrição:** em `regras/rules-local.md`, a frase de escopo ("repositórios com GitHub de
  `C:\fontes`, fora `DEMAIS-PROJETOS-*`, `scripts` e o próprio `rules-ai`") passa a incluir a
  própria raiz `C:\fontes` (C57, `raiz-fontes.md`); em `regras/jev.md`, "em todo projeto de
  `C:\fontes`" vira "em todo projeto com `rules-local/` (inclusive a raiz, C57)".
- **Critérios de Aceitação:** `grep -n "C57" regras/rules-local.md regras/jev.md` acha as duas.
- **JEV-AI-SUGGESTION:** SIM

### RAIZ-FONTES-GLOBAL.3 — Apontar para a C57 em `quadro-de-tarefas.md`, `graphify.md` e `git-geral.md`

**Próximo passo:** aguardar o "sim" do usuário ao plano.

- **Nível:** LEVE — classificado (jev (confiança 0.96))
- **Modelo:** só Haiku 5.5 ou DeepSeek V4.1 Flash — nunca outro
- **Effort:** low
- **Fonte:** jev (confiança 0.96)
- **Descrição:** uma linha em cada: `quadro-de-tarefas.md` (a raiz `C:\fontes` tem quadro próprio só
  para tarefas dela, C57); `graphify.md` (a raiz não roda graphify, C57); `git-geral.md` (na raiz,
  `.gitignore` com as pastas de `.git` próprio e nunca `git add` delas, C57).
- **Critérios de Aceitação:** `grep -n "C57"` acha a linha nos 3 arquivos.
- **JEV-AI-SUGGESTION:** SIM

### RAIZ-FONTES-GLOBAL.4 — Registrar a C57 e regerar `dist/` e `VERSAO.md`

**Próximo passo:** esperar a .1, a .2 e a .3.

- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **Fonte:** sinais
- **Descrição:** linha da C57 no topo do "Registro de decisões" do `tasks/STATUS.md`; histórico em
  `STATUS_PROJETO.md`; `node scripts/sincronizar.mjs` (sem `--aplicar`) para regerar
  `dist/REGRAS-GLOBAIS.md` e `VERSAO.md`.
- **Critérios de Aceitação:** `grep -c "C57" dist/REGRAS-GLOBAIS.md` maior que 0; `VERSAO.md` com
  versão nova; push feito (a .6 baixa a versão do GitHub).
- **JEV-AI-SUGGESTION:** NAO

### RAIZ-FONTES-GLOBAL.5 — Criar o `.gitignore` da raiz `C:\fontes`

**Próximo passo:** aguardar o "sim" do usuário ao plano.

- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **Fonte:** sinais
- **Descrição:** `C:\fontes\.gitignore` ignorando as 11 pastas com `.git` próprio (`ai-memory/`,
  `aulasenai/`, `consumo-ia/`, `controlemercadoria/`, `crm/`, `LOGIC-GAME-BLOCK/`,
  `MATERIAL-AULAS-PROF-MAIRA/`, `PROJETO-IMPRESSAO-3D/`, `REA-APP-CLONES/`, `rules-ai/`,
  `sistemafinanceiro/`), `DEMAIS-PROJETOS-*/`, `config-de-tarefa-agendada.txt`, `.env*`,
  `graphify-out/` e `node_modules/`. Commit + push na raiz.
- **Critérios de Aceitação:** `git -C C:/fontes status --short` não lista nenhum desses.
- **JEV-AI-SUGGESTION:** NAO

### RAIZ-FONTES-GLOBAL.6 — Instalar o `rules-local/` na raiz

**Próximo passo:** esperar a .4 (com push) e a .5.

- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **Fonte:** sinais
- **Descrição:** `node C:\fontes\rules-ai\scripts\instalar-rules-local.mjs C:/fontes`; conferir
  `rules-local/VERSAO.md` (com a C57), `.claude/settings.json` (`SessionStart` e
  `UserPromptSubmit`) e `.codex/hooks.json`; commit + push na raiz só desses arquivos e do aviso que
  o instalador grava no `AGENTS.md`.
- **Critérios de Aceitação:** os 3 arquivos existem; `git diff --cached --name-only` só com eles e
  o `AGENTS.md`.
- **JEV-AI-SUGGESTION:** NAO

### RAIZ-FONTES-GLOBAL.7 — `AGENTS.md` e `CLAUDE.md` da raiz seguindo as regras

**Próximo passo:** esperar a .6.

- **Nível:** LEVE — classificado (sinais)
- **Modelo:** só Haiku 5.5 ou DeepSeek V4.1 Flash — nunca outro
- **Effort:** low
- **Fonte:** sinais
- **Descrição:** bloco `<!-- rules-ai:global -->` no topo dos dois (modelo: `rules-ai/AGENTS.md`);
  trocar "graphify só roda quando o usuário pedir" pela C57; push a cada tarefa na raiz (tirar
  "sem push"); corrigir "C:ontes"; mapa com `COORDENACAO-DE-PROJETOS\` no lugar de
  `NOVOS-PROJETOS-CLAUDE-CODE\` e com `dashboard\`, `projetos.json`, `update-projects-status.py`,
  `ANALISTA-SENIOR-LIDER.md` e `lider-coordenador.json`; as duas cópias iguais, menos o nome da IA
  e os caminhos globais. Commit + push na raiz.
- **Critérios de Aceitação:** `grep -n "rules-ai:global" C:/fontes/AGENTS.md C:/fontes/CLAUDE.md`
  acha os dois; nenhuma citação a `NOVOS-PROJETOS-CLAUDE-CODE` fora de "Pastas que não existem
  mais".
- **JEV-AI-SUGGESTION:** NAO

### RAIZ-FONTES-GLOBAL.8 — Quadro próprio da raiz

**Próximo passo:** aguardar o "sim" do usuário ao plano.

- **Nível:** LEVE — classificado (jev (confiança 0.96))
- **Modelo:** só Haiku 5.5 ou DeepSeek V4.1 Flash — nunca outro
- **Effort:** low
- **Fonte:** jev (confiança 0.96)
- **Descrição:** criar `C:\fontes\tasks\STATUS.md` (formato simplificado, C55),
  `tasks/task_complete.md` e `tasks/etapas/` (com um `.gitkeep`), pelos modelos de
  `regras/quadro-de-tarefas.md`, sem nenhuma tarefa aberta. Commit + push na raiz.
- **Critérios de Aceitação:** os 3 caminhos existem e seguem o modelo.
- **JEV-AI-SUGGESTION:** SIM

### RAIZ-FONTES-GLOBAL.9 — Levar às IAs (`node scripts/sincronizar.mjs --aplicar`)

**Próximo passo:** esperar a .4; só o usuário faz.

- **Descrição:** o usuário roda `--aplicar` para gravar a C57 nos arquivos globais de cada IA.
- **JEV-AI-SUGGESTION:** NAO

### RAIZ-FONTES-GLOBAL.10 — Rotacionar o token de `config-de-tarefa-agendada.txt`

**Próximo passo:** só o usuário faz.

- **Descrição:** o arquivo tem token em texto puro (segundo o mapa da raiz); trocar o token no
  serviço e no arquivo.
- **JEV-AI-SUGGESTION:** NAO
