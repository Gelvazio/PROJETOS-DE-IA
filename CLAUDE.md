# CLAUDE.md — Mapa de todos os projetos em `C:\fontes`

Este arquivo fica na raiz de `C:\fontes` e descreve **o que existe em cada pasta** e **quais regras
valem para todas elas**. Ele não substitui o `CLAUDE.md` / `AGENTS.md` de cada projeto: ao trabalhar
dentro de um projeto, as regras dele vencem as deste arquivo.

**Ordem de precedência:** `CLAUDE.md` / `AGENTS.md` do projeto → este arquivo →
`C:\Users\gelva\.claude\CLAUDE.md` (global).

> Atualizado em 2026-10-31 (raiz agora é repositório Git; pastas novas e ausentes reconferidas); base: auditoria
> completa de 2026-10-18 (achados e recomendações em
> `ANALISE-DE-FONTES-2026-10-18.md`). Quando uma pasta nova entrar, uma existente mudar de propósito
> ou for removida, atualize a tabela correspondente aqui e regrave o portal com
> `atualizar-index.cmd`.
>
> **Duas cópias:** este mapa existe em `CLAUDE.md` (Claude) e `AGENTS.md` (Codex). Toda mudança deve
> ser feita nos dois; muda apenas o nome da IA e os caminhos globais.
>
> **Execução em 2026-10-18:** D1 (credenciais), D2 (`rules-local` em `988f933e` nos 20 projetos) e D5
> (quadro global + `STATUS_PROJETO.md`) concluídos; detalhes em `EXECUCAO-2026-10-18.md`. Os hashes de
> commit citados abaixo são a fotografia da auditoria (≈13:30), salvo indicação em contrário.

---

## Regras comuns a todos os projetos

- **Idioma:** respostas e comentários em português do Brasil, com acentuação correta. Termos técnicos
  e identificadores ficam como estão.
- **Documentação antes de editar:** ler o `CLAUDE.md` / `AGENTS.md` do projeto e a pasta `docs/`
  (quando existir) antes de modificar arquivos.
- **Sem testes automatizados novos.** A única exceção é uma tarefa de correção de bug.
- **Sem abrir navegador para validar.** A validação é feita por leitura do código, checagem de sintaxe
  e comandos de terminal.
- **Commit por tarefa:** cada pedido atendido vira um commit, feito com `git add` dos arquivos da
  tarefa (nunca `git add .`). O push segue a regra de cada projeto.
- **Sem git worktree** e sem branches paralelas, salvo quando o projeto disser o contrário.
- **Código:** princípios SOLID, funções de até 45 linhas, arquivos de até 1000 linhas, nomes em
  português sem acentos (exceto APIs, palavras reservadas e nomes já existentes no banco).
- **Segredos:** `.env`, chaves e credenciais nunca entram no Git (inclui `config-de-tarefa-agendada.txt`, na raiz). Ao encontrar segredo em arquivo
  versionado, avisar o usuário e remover antes de qualquer commit. A chave `service_role` do Supabase
  está em `aulasenai\scripts\variaveis.js` (ignorada, mas no disco — **rotacionar**); as credenciais
  de teste do `aulasenai\README.md` foram removidas em 2026-10-18 (D1).
- **Pasta offline:** nunca ler de início `DEMAIS-PROJETOS-DE-SISTEMAS-MANTER-OFFLINE\` (regra C20).
  Essa pasta **não existe mais** em `C:\fontes` (verificado em 2026-10-18); a regra continua valendo
  caso ela volte.
- **Projetos parados:** **nada** da pasta `DEMAIS-PROJETOS-NAO-MEXER-AGORA\` é lido nas sessões do
  Claude (nem listar, buscar, indexar, rodar graphify ou citar). Ela guarda projetos parados por
  tempo indeterminado; só entrar quando o usuário pedir o projeto pelo nome ou caminho (regra C23,
  `rules-ai\regras\pastas-ignoradas.md`).
- **`graphify`:** só roda quando o usuário pedir (`/graphify`).
- **Quadro de tarefas:** projetos que mudam algo registram a tarefa no quadro (`tasks/STATUS.md` ou
  `STATUS.md`) antes de executar.
- **Status do `rules-ai`:** toda vez que algo na pasta `C:\fontes\rules-ai\` for criado, alterado
  ou apagado, atualize no mesmo passo o status local do projeto,
  `C:\fontes\rules-ai\STATUS_PROJETO.md`, registrando o que mudou e a data e hora (Brasília).

---

## Visão geral

Desde 2026-10-31 a raiz `C:ontes` **é um repositório Git**, ligado (`origin`, branch `main`) a
`github.com/Gelvazio/PROJETOS-DE-IA`; ainda sem fetch, sem commit de conteúdo e sem push. Cada pasta de
projeto abaixo continua com o próprio `.git`: `aulasenai`, `rules-ai`, `ai-memory`, `consumo-ia`,
`REA-APP-CLONES`, `LOGIC-GAME-BLOCK`, `MATERIAL-AULAS-PROF-MAIRA`, `PROJETO-IMPRESSAO-3D`, `crm` e
`sistemafinanceiro` (remotos `github.com/Gelvazio/*`) e `controlemercadoria` (GitLab `c3tecnologia`).
⚠️ Repositório dentro de repositório: `git add` na raiz transforma essas pastas em submódulos quebrados
e arrasta pastas grandes; antes de commitar conteúdo, definir o `.gitignore` da raiz.

| Pasta | O que é | Tipo / stack |
|-------|---------|--------------|
| `aulasenai\` | Sistema de aulas do SENAI (aulas, cursos, turmas, provas, painel, correção discursiva) | Web (HTML/JS) + Supabase |
| `rules-ai\` | Regras globais de todas as IAs, quadro global, dashboard e scripts de sincronização | Markdown + Node |
| `ai-memory\` | Memória de longo prazo das IAs (servidor, hooks, plugins); fork `Gelvazio/ai-memory` | Rust + scripts |
| `consumo-ia\` | Painel de consumo de IA, com `api\`, scripts `.bat` e `TASKS-SESSAO-AI.md` | HTML/JS + API |
| `REA-APP-CLONES\` | Engenharia reversa com REA para entender apps e recriar funcionalidades | Node/TS + Electron + Python/FastAPI + Ghidra |
| `LOGIC-GAME-BLOCK\` | Jogo de lógica em blocos | Vite + JS (pnpm) |
| `dashboard-plataformas-de-ia\` | Dashboard de análise entre plataformas de IA (`index.html`, `docs\`, `STATUS.md`); sem Git | HTML/JS |
| `crm\` | CRM (atividade SA, `db.json`, pasta `Hackaton\`); `github.com/Gelvazio/crm` | Vite + JS |
| `sistemafinanceiro\` | Sistema financeiro, com `AGENTS.md`, `CLAUDE.md` e `.env` local; `github.com/Gelvazio/sistemafinanceiro` | Web |
| `controlemercadoria\` | Controle de mercadoria, com `ANALISE_SUPABASE_MCP.md`; remoto GitLab `c3tecnologia/controlemercadoria` | Web + Supabase |
| `PROJETO-IMPRESSAO-3D\` | Projeto de impressão 3D (`RENDA3D-DOWNLOADS`, `analise-site.py`); `github.com/Gelvazio/PROJETO-IMPRESSAO-3D` | Python + anotações |
| `MATERIAL-AULAS-PROF-MAIRA\` | Material de aulas de desenho técnico (pptx); `github.com/Gelvazio/MATERIAL-AULAS-PROF-MAIRA` | Documentos |
| `NOVOS-PROJETOS-CLAUDE-CODE\` | Novos projetos: `7-SISTEMAS-FIM-SEMANA`, `Dashboards`, `TABELAS-DE-PRECO`; sem Git | HTML/CSS |
| `HACKATON\` | Pasta só com `AGENTS.md`, `CLAUDE.md`, `.agents` e `.claude`; sem Git | Regras |
| `PROJETO-CERCA\` | Apenas um `index.html`; sem Git | HTML |
| `conglomerado-agentes-ia.md` | Documento de arquitetura: conselho C-Level e especialistas setoriais de agentes de IA | Markdown |
| `CONSERTO-ELANTRA-2.0\` | Lista de peças para conserto de um Elantra (`PECAS-INTERNET.md` + foto); sem Git | Anotações |
| `.agents\`, `.claude\` | Skills locais da raiz (cópias divergentes de `gerenciador-de-tarefas`) | Markdown |
| `.vscode\` | Configuração local (Live Server na porta 5502) | JSON |
| `index.html` e `atualizar-index.cmd` | Portal "Mapa de Projetos"; **quebrado**: faltam `assets\` e `scripts\` | HTML/JS + Node |
| `DEMAIS-PROJETOS-NAO-MEXER-AGORA\` | Projetos parados por tempo indeterminado — **nunca ler** (regra C23) | Coleção |

---

## Projetos da raiz

### `.agents\`, `.claude\` e `.vscode\`

- Skills da raiz: `gerenciador-de-tarefas` existe em `.claude\skills\` e `.agents\skills\` com ~40
  linhas de diferença; a cópia de `.agents` ainda aponta para `.Codex/skills`, `aulas-senai-Codex-*` e
  `~/.Codex.json`, que não existem mais. Decidir a fonte única (pendência D9 do relatório).
- `.vscode\settings.json` só define o Live Server na porta 5502.

### Portal (`index.html`, `assets\`, `scripts\` e `atualizar-index.cmd`)

- `index.html` tem 4 cards (este mapa, `rules-ai`, líder Opus e tarefas) e abre por `file://`; por
  isso `scripts/gerar-dados-index.mjs` embute os Markdown em `assets\js\dados.js`
  (`window.DADOS_FONTES`). `atualizar-index.cmd` roda o script e abre a página.
- **O portal lê o `CLAUDE.md` da raiz (não este `AGENTS.md`).**
- Fontes lidas: `CLAUDE.md`; `rules-ai\AGENTS.md` + `regras\*.md` (ordem alfabética) +
  `CONFLITOS.md`; `aulas-senai-CLAUDE-OPUS-LIDER\CLAUDE.md` e `AGENTS.md`; e o quadro
  `rules-ai\tasks\STATUS.md` + `task_complete.md`.
- ⚠️ Em 2026-10-24 `assets\` e `scripts\` **não existem** na raiz: o portal não abre e o
  `atualizar-index.cmd` não tem o que rodar. Restaurar as duas pastas ou remover o portal.

### `rules-ai\`

- Fonte única das regras globais: `regras\*.md` (19 regras + `INDEX.md`) → `scripts\sincronizar.mjs` →
  `dist\REGRAS-GLOBAIS.md` + `VERSAO.md` → arquivos globais de cada IA; `CONFLITOS.md` guarda as
  decisões (C1–C38; **C14–C19 pendentes**). `spec\` tem os templates e o gate
  `spec\verificar-spec.mjs` (C34).
- `rules-local\`: cópia das regras em cada projeto, controlada pela `VERSAO.md`. Hoje **20 projetos**
  têm a cópia, todos em `2026-10-18-988f933e` (sincronizados em 18/10, D2); o `sessao.mjs` é o script
  de sessão, e a C36 manda sincronizar as tasks quando a versão muda.
- Working tree: `main`, remoto `Gelvazio/rules-ai`, últimos commits `32c27bb` (D5) e `a1b5743` (18/10).
  **Uma sessão por vez** aqui (C29): conferir `tasks\.sessao-ativa` antes de trabalhar; registrar
  ` · NN%` no "Em uso por" (C31).
- Quadro próprio (`tasks\STATUS.md`): 23 tarefas-mãe (10 abertas + 13 concluídas), 43 linhas abertas,
  nenhuma ✅ no STATUS e 124 no `task_complete` (C4 aplicada em 18/10, D5); 23 etapas em
  `tasks\etapas\`; `dashboard\` tem o dashboard de agentes ao vivo.
- Regras: `AGENTS.md` (36 linhas; não há `CLAUDE.md`). Quadro: `tasks\STATUS.md`.
- ✅ `STATUS_PROJETO.md` reescrito em 18/10 (D8) como status do `rules-ai`: título, fontes, estado e
  histórico cronológico; a regra de atualizá-lo a cada mudança continua.
- **Memória (ai-memory, 23/10):** regra `regras\memoria-ai.md` (o quadro sempre vence a memória);
  instalado só no `aulasenai` (o `DASHBOARD-AI-PRINCIPAL` sumiu da raiz; os outros projetos ficam para depois,
  por decisão do usuário); só o Claude Code captura, sem o prompt digitado e sem hook global.
  Scripts `instalar-ai-memory.mjs`, `ai-memory-auditar.mjs` e `testes\ai-memory-invariantes.mjs`;
  docs `docs\AI-MEMORY-*.md`. Pendências: 10 retomadas, repositório privado do wiki, confiar as pastas.

### `aulasenai\`

- Sistema de aulas do SENAI: `index.html`, `login.html`, `cursos.html`, `turmas.html`, `alunos.html`,
  `painel-professor.html`, `correcao-discursiva.html`, `relatorioAtividades.html`; `js\`, `scripts\`,
  `database\` (SQL), `docs\`, `tasks\`, `MATERIAIS\`, `GERADOR-AULAS\`, `MATERIAL-PADRAO-PROVAS-SENAI\`.
- Stack: HTML/CSS/JS vanilla + Supabase via CDN (`hxlvonriearllcmfqeri.supabase.co`, chave **anon**,
  pública por desenho). Não há `package.json` na raiz. Subprojeto Node próprio em
  `MATERIAIS\AGENDA_COLABORADOR\AUTOMATIZACAO-WHATSAPP\` (Baileys) com quadro e regras próprios.
- Estado: base suja (17 alterações), `.git` de 2,1 GB com garbage; 1.254,7 MB de fontes/5.733 arquivos
  (833 MB ignorados). Quadro com 1.443 linhas e 428 etapas; 6 frentes ativas (3 paradas), 1 reserva
  velha (#171), 800 subtarefas livres.
- Regras: `AGENTS.md` (regras por assunto em `.claude\rules\`); `CLAUDE.md` só aponta para ele.
  Quadro: `tasks\STATUS.md`.
- ⚠️ Credenciais do `README.md` removidas em 18/10 (D1); a chave `service_role` segue em
  `scripts\variaveis.js` (ignorada; rotacionar).
- **Memória (ai-memory):** hooks do Claude Code por projeto (`.ai-memory.toml`, `ignore_paths`); só captura; o quadro vence a memória (`rules-ai\regras\memoria-ai.md`).

### `ai-memory\`

- Servidor e ferramentas da memória de longo prazo (`crates\`, `hooks\`, `plugins\`, `docs\`,
  `evals\`). Remoto `github.com/Gelvazio/ai-memory`, último commit `1bd86637` (2026-10-22).
- Instalado nos projetos pelo `rules-ai\scripts\instalar-ai-memory.mjs`; regra em
  `rules-ai\regras\memoria-ai.md`.

### `consumo-ia\`

- Painel de consumo de IA: `index.html`, `api\`, `assets\`, `scripts\`, atalhos `.bat`
  (`CRIAR-TAREFA`, `PUBLICAR-AGORA`, `REMOVER-TAREFA`) e `TASKS-SESSAO-AI.md`. Remoto
  `github.com/Gelvazio/consumo-ia`, último commit `dc4d89e` (2026-10-23).

### `LOGIC-GAME-BLOCK\`

- Jogo de lógica em blocos (Vite, pnpm), com `docs\` e `src\`. Remoto
  `github.com/Gelvazio/LOGIC-GAME-BLOCK`, último commit `c12dc5f` (2026-10-24).

### Projetos novos (conferidos em 2026-10-31)

- `crm\`, `sistemafinanceiro\` e `controlemercadoria\` têm `AGENTS.md`/`CLAUDE.md` próprios: ler antes de
  agir. `sistemafinanceiro\` e `crm\` têm `.env`/`node_modules` no disco (não versionar).
- `PROJETO-IMPRESSAO-3D\` e `MATERIAL-AULAS-PROF-MAIRA\` são repositórios de conteúdo (downloads,
  análise de site, pptx).
- `NOVOS-PROJETOS-CLAUDE-CODE\` (tem `AGENTS.md`), `HACKATON\`, `PROJETO-CERCA\` e
  `dashboard-plataformas-de-ia\` não têm Git próprio: entram direto no repositório da raiz.
- Detalhes de stack e quadro **não foram auditados**; ler o `AGENTS.md` do projeto antes de agir.

### Arquivos soltos na raiz

- `conglomerado-agentes-ia.md`, `DECISOES-D3-D4-2026-10-18.md`, `EXECUCAO-2026-10-18.md`,
  `ex_tmp.mjs` (script auxiliar que lê os quadros) e `config-de-tarefa-agendada.txt`.
- ⚠️ `config-de-tarefa-agendada.txt` contém **token de API em texto puro**: nunca versionar; excluir no
  `.gitignore` da raiz e rotacionar o token.

### `CONSERTO-ELANTRA-2.0\`

- Pasta sem Git com a lista de peças (`PECAS-INTERNET.md`) e a foto `pecas-elantra.jpeg`. Assunto
  pessoal, sem relação com os projetos de IA.

### `REA-APP-CLONES\`

- Usa o REA (engenharia reversa com IA) para entender aplicativos e recriar funcionalidades.
  `apps-to-be-clone\` (binários), `apps-cloned\chaos-code\` (clone TS/Electron + servidor Python/
  FastAPI), `tools\` (Ghidra 12.1.4 + JDK 21, fora do Git), `scripts\`, `guia\`, `tasks\`.
- Stack: Node/TS + Electron 44 (clone), Python/FastAPI (servidor); `package.json` com scripts
  `sync:agentes`/`check:agentes`/`hooks:instalar`; 16 etapas em `tasks\etapas\`.
- Regras: `AGENTS.md` (hash igual ao do template), `CLAUDE.md`, `GEMINI.md`, `.claude\rules\` (21),
  `.agents\` e `rules-local\`.
- ⚠️ Estado: `main` **sem upstream**, **2 commits à frente** (`9ee2177` + `73f5e33` da sincronização),
  árvore suja (10), `graphify-out\` versionado (diff de 88 mil linhas), `.git` de 683,7 MB. O
  `.gitignore` tem o typo `apps-to-be-cloned/` e deixa **≈ 768 MB** de executáveis fora do ignore
  (KiroCrew 559,5 MB + kiro-ide 201,4 MB + Hermes 7,9 MB): nunca rodar `git add .`.
- Quadro: frentes CLONE (38 subtarefas), SERVIDOR (22) e HERDR (2).

---

## Pasta `DEMAIS-PROJETOS-NAO-MEXER-AGORA\`

Projetos parados por tempo indeterminado. **Nada** dela é lido nas sessões (regra C23, 2026-10-17):
não listar, buscar, indexar, rodar graphify nem citar o conteúdo, mesmo ao varrer `C:\fontes`. Só
entrar quando o usuário pedir o projeto pelo nome ou o caminho. Regra:
`C:\fontes\rules-ai\regras\pastas-ignoradas.md`.

---

## Pastas que não existem mais

Sumiram entre 17/10 e 31/10/2026. Se alguma voltar, recrie a linha na tabela e a seção:

| Item | O que era |
|------|-----------|
| `gerador-atividades\` | Gerador de atividades HTML no padrão SENAI (Python) |
| `plataforma-ia\` | Plataforma de agentes de IA em Django |
| `ajax-ai-by-pewdiepie\` | Cópias de repositórios/skills de terceiros |
| `gerenciador-youtube\` | Gerenciador de downloads do YouTube |
| `acl-recovery-REA-APP-CLONES\` e `dsh-acl-recovery\` | Backups de ACL e relatórios |
| `qoderwake_latest_windows_amd64.exe` | Binário solto de ~190 MB |
| `DEMAIS-PROJETOS-DE-SISTEMAS-MANTER-OFFLINE\` | Projetos offline (regra C20) |
| `aulas-senai-CLAUDE-HAIKU\`, `-SONNET\`, `-OPUS\`, `-OPUS-LIDER\` | Clones do `aulasenai` por modelo |
| `dashboard-ai-*\` (9 cópias) e `DASHBOARD-AI-PRINCIPAL\` | Dashboard AI (`github.com/Gelvazio/dashboard-ai`); a última pasta sumiu entre 24 e 31/10 |
| `testes-de-frontend\` e `projeto-frontend-com-testes\` | Aulas/vitrine de frontend e projeto com Vitest; sumiram entre 24 e 31/10 |
| `gerenciador-de-ia\`, `PLATAFORMA-ENVIO-CURRICULOS\`, `template-inicial-tasks-ia\`, `testes-effort-padaria\`, `hermes-agent\`, `CONFIG-DEEPSEEK\` | Sumiram da raiz entre 18 e 24/10; paradeiro não conferido (a pasta `DEMAIS-PROJETOS-NAO-MEXER-AGORA\` não é lida) |

> Algumas regras do `rules-ai` ainda citam projetos dessas pastas (C14–C19, C20). Não são erros de
> digitação: são pendências de revisão das regras (D6 no relatório).

---

## Como usar este arquivo

- Ao abrir uma sessão em `C:\fontes`, use este mapa para localizar o projeto certo antes de agir.
- Para um projeto novo, copie a estrutura de `template-inicial-tasks-ia` e acrescente a linha na
  tabela de visão geral.
- Ao criar, renomear ou remover uma pasta, atualize este arquivo (e o `AGENTS.md`) no mesmo passo e
  regrave o portal com `atualizar-index.cmd`.
- Dúvidas de estado atual, riscos e pendências: ver `ANALISE-DE-FONTES-2026-10-18.md`.
