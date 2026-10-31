## Grupo DASHBOARDS

> **Coleta:** 2026-10-18, 13:26–13:31 (America/Sao_Paulo) · auditor: `auditor-dashboards` · workspace `C:\fontes`
> **Modo:** somente leitura; sem `git fetch` (o "0 à frente / 0 atrás" compara com `origin/main` local) · sem leitura de `DEMAIS-PROJETOS-*` (regra C23)
> **Escopo:** 9 pastas `dashboard-ai-*` + `gerenciador-de-ia` (tamanhos/hashes sem `node_modules`, `.git`, `dist`, `build`)

**Resumo executivo:** as 9 pastas `dashboard-ai-*` são **9 cópias completas do mesmo repositório** (`Gelvazio/dashboard-ai`), todas no **mesmo commit `4dc440c`**, com **1137 commits**, **418 arquivos rastreados idênticos** e **0 à frente / 0 atrás**. Não existe um clone "base" nem uma ordem de atualidade entre eles: a divergência de conteúdo é **zero** (só o `qoder` tem 2 arquivos modificados não commitados). O aviso do `AGENTS.md`/`CLAUDE.md` da raiz de que o `gmail` teria "só um README curto" **está desatualizado** — ele tem a árvore completa, igual aos demais.

### Tabela-resumo dos 9 dashboards

| Repositório | Completo? | Stack/versão | Branch/remoto | Último commit | Árvore | Tamanho* | Rules-local | Última atividade no quadro |
|---|---|---|---|---|---|---|---|---|
| `dashboard-ai-claude-code-gmail` | Sim (418 arq.) | dashboard-ai 0.1.0 · Node ≥22.12 · React 19.3 · TS ~5.9 · Vite ^8.3.4 · Tailwind 4.3 · Supabase JS 2.117 | `main` / `Gelvazio/dashboard-ai` · 0/0 | `4dc440c` 18/10 12:33:36 | limpa | 2,42 MB · 418 | 2026-10-18-ef54a693 | 17/10 (decisão C32); SUB-62.3 reservada desde 13/10 22:01 |
| `dashboard-ai-claude-code-hotmail` | Sim (418) | idem | idem · 0/0 | idem | limpa | 2,42 MB · 418 | idem | idem |
| `dashboard-ai-claude-code-senai` | Sim (418) | idem | idem · 0/0 | idem | **suja: 4 untracked** (`.codex/`, `.kiro/`, `dashboard-plataformas-de-ia/`, `laya/`) | 24,86 MB · 1 639 | idem | idem |
| `dashboard-ai-codex` | Sim (418) | idem | idem · 0/0 | idem | limpa (só artefato ignorado) | 6,94 MB · 514 | idem | idem |
| `dashboard-ai-deepseek` | Sim (418) | idem | idem · 0/0 | idem | limpa (extras no `info/exclude`) | 24,90 MB · 1 638 | idem | idem |
| `dashboard-ai-devin` | Sim (418) | idem | idem · 0/0 | idem | limpa | 2,48 MB · 423 | idem | idem |
| `dashboard-ai-gemini` | Sim (418) | idem | idem · 0/0 | idem | limpa | 2,42 MB · 418 | idem | idem |
| `dashboard-ai-kiro-crew` | Sim (418) | idem | idem · 0/0 | idem | limpa | 2,42 MB · 418 | idem | idem |
| `dashboard-ai-qoder` | Sim (418) | idem | idem · 0/0 | idem | **suja: 2 modificados** (`README.md`, `database/README.md`) | 2,48 MB · 422 | idem | idem + trabalho não commitado da SUB-62.3 |

\* Arquivos e MB fora de `node_modules`, `.git`, `dist` e `build`. O commit comum é `4dc440c9e06b07fba3466f86e53c5e0bba71f412` — `docs(skills): classificar-tarefa com OpenCode (modelos DeepSeek) e Qoder por DeepSeek Harness (deepseek-flash) (local · main)`.

### Por repositório (evidências)

- **gmail** — árvore completa: `AGENTS.md` (4 038 B), `CLAUDE.md` (825 B, só importa `@AGENTS.md`), `README.md` (38 976 B, 754 linhas), `docs/` com 8 arquivos, `rules-local/` com 19 regras + scripts, `.claude/`, `.agents/`, `api/`, `worker/`, `database/`, `src/`. **Não** é "só README". 0 extras, sem `node_modules`/`dist`.
- **hotmail** — espelho exato do gmail (0 extras, sem instalação).
- **senai** — espelho + **1 221 extras não rastreados**: `laya/` (1 188 arquivos, 35 MB **incluindo `.git` próprio**, ou seja, repositório Git aninhado), `dashboard-plataformas-de-ia/` (19), `.codex/` (8), `.kiro/` (2), `.claude/` (2), `.env` (100 linhas, ignorado), 1 em `database/`; tem `node_modules` (346,5 MB) e `dist/`.
- **codex** — espelho + `graphify-out/` (96 arquivos, ~4,5 MB, ignorado): é o clone onde o graphify rodou. Sem `node_modules`/`dist`.
- **deepseek** — espelho + os mesmos extras do senai (`laya/`, `dashboard-plataformas-de-ia/`, `.kiro/`, `.env`, `.env.local.off`), mas **silenciados por `.git/info/exclude`** (config local, não versionada) em vez de `.gitignore`; `node_modules` (355,3 MB) e `dist/` (4,6 MB). Árvore "limpa" só à custa desse exclude.
- **devin** — espelho + `.devin/config.local.json`, `scripts/__pycache__/` (4), `node_modules` e `dist/`.
- **gemini** e **kiro-crew** — espelhos exatos do gmail (0 extras, sem instalação).
- **qoder** — espelho + `scripts/__pycache__/` (4) e `node_modules`; único com **conteúdo rastreado alterado**: `README.md` (+49) e `database/README.md` (+6) ("Usuário criado não é acesso liberado"), exatamente a **SUB-62.3**, que o quadro marca como `🔄 Em execução` reservada por **Qoder (local · main) desde 2026-10-13 22:01** — 5 dias sem commit.

**Stack (idêntica nos 9):** `package.json` → nome `dashboard-ai`, versão `0.1.0`, `private`, ESM, Node ≥ 22.12. Scripts: `dev`, `dev:local`, `build`, `preview`, `typecheck[:api|:worker]`, `test`, `test:integration`, `check:env`, `validar`, `check:chunks`, `sync:agentes`, `check:agentes`, `worker`. Deps principais: `react`/`react-dom` 19.3, `@supabase/supabase-js` 2.117.3, `chart.js` 4.5 + `react-chartjs-2`, `lucide-react`, `clsx`, `tailwind-merge`. Dev: TypeScript ~5.9, Vite ^8.3.4, Tailwind 4.3, Vitest 5, LangChain/LangGraph (0.3/0.2 + checkpoint-postgres), `tsx`, Supabase CLI 2.120, `zod`. Entradas: `index.html` (872 B) + `src/main.tsx`/`src/App.tsx`; backend serverless em `api/` (MCP em `api/mcp.ts`), worker LangGraph em `worker/`, SQL em `database/`, painel legado em `public/painel.html` (58 KB).

**Documentação e quadro (idênticos):** `AGENTS.md` é a porta de entrada (aponta `.claude/rules/INDEX.md` e uma tabela de leitura obrigatória); `CLAUDE.md` só redireciona; `GEMINI.md`; `FERRAMENTAS-DE-IA.md`; `docs/` (8: backup R2, backup database, backup artifacts, langgraph-contrato, laya-server, cérebro de memória, supabase-local, VALIDACAO); `rules-local/` gerado; `tasks/STATUS.md` com 127 linhas, `tasks/etapas/` (25 etapas) e `tasks/task_complete.md` (410 KB). Quadro ativo: mães abertas **SUB-45, SUB-47, SUB-62**; subtarefas livres **SUB-45.18, SUB-62.1, SUB-62.2**; **SUB-47.11 👀 aguardando o usuário**; **SUB-62.3 🔄 Qoder desde 13/10 22:01**; última decisão 17/10 21:50 (C32) e último commit 18/10 12:33 (skills). Checagem heurística de links relativos em README/AGENTS/docs: **nenhum quebrado**.

### Divergência entre os clones

| Arquivo | SHA256 (16 primeiros) | Tamanho | Situação nos 9 clones |
|---|---|---|---|
| `CLAUDE.md` | `FF3CEFA352FDDC2C` | 825 B | idêntico nos 9 |
| `AGENTS.md` | `CE49E03C3E4BD465` | 4 038 B | idêntico nos 9 |
| `package.json` | `D2ECDFFF87E6FB73` | 1 986 B | idêntico nos 9 |
| `index.html` | `9A52454E53E367D0` | 872 B | idêntico; **deepseek** `C9E9E433E36F3DED` (855 B) = **mesmo blob Git `8d836be4`**, só LF × CRLF |
| `rules-local/VERSAO.md` | `3071CD866E6770A4` | 1 229 B | idêntico nos 9 |
| `tasks/STATUS.md` | `50014CD9FC0BD9D3` | 17 259 B | idêntico; **codex** `8D23FE7B6513277A` (17 132 B) = **mesmo blob `d0d99b1e`**, só LF × CRLF |
| `README.md` | `7E69E8A4B34892B9` | 38 976 B | idêntico; **qoder** `3B8D401202E8602B` (41 574 B) = **modificado não commitado** |

- **Base:** o repositório `Gelvazio/dashboard-ai` no commit `4dc440c`; **todos os 9 estão nesse HEAD** (1137 commits), com `package-lock.json` de SHA256 `2B351E4625E6…` idêntico → **nenhuma dependência desalinhada**.
- **Ordem de atualidade:** empate técnico. `qoder` é o único com trabalho em andamento (dirty); `senai`/`deepseek` têm mais artefatos locais; `codex` tem o `graphify-out`; `gmail`/`hotmail`/`gemini`/`kiro-crew` são espelhos limpos sem instalação.
- **As diferenças de bytes não são de conteúdo**: os 9 têm `core.autocrlf=true` e checkouts mistos LF/CRLF; `git diff --no-index` entre `index.html` de codex e deepseek é vazio, e os blobs confirmam texto igual.
- **`rules-local` (regras globais) está desatualizado nos 9 dashboards:** `2026-10-18-ef54a693`, instalado no commit `385b9a9` (`RULES-LOCAL-GLOBAL.15`, 12:08), **antes** das mudanças globais C37 (12:15) e C38 (13:00) do `rules-ai`. O `gerenciador-de-ia` tem `2026-10-18-f4bfe8d8` (`RULES-LOCAL-GLOBAL.17`, 12:17): já tem C37 (OpenCode/DeepSeek V4 Pro) mas **ainda não tem a linha Qoder (C38)**; a cópia dos dashboards nem o C37 tem. Ou seja: `rules-ai` atual (13:00) > gerenciador (12:17) > dashboards (12:08), e as três **divergem em `niveis-e-modelos.md`** (6 linhas de diferença dashboards × gerenciador).

### gerenciador-de-ia

- **Finalidade:** página **estática**, quase em tempo real, que mostra em cena 3D (Three.js 0.170.0 via import map) **qual tarefa está reservada, por qual IA/modelo/frente e há quanto tempo**, lendo só os `tasks/STATUS.md` públicos de `Gelvazio/aulasenai` e `Gelvazio/dashboard-ai` (API de commits + raw por SHA, sem token, sem login, sem banco). Regra dura do projeto: **nunca consome token de IA**.
- **Stack:** HTML + CSS + ES modules, **sem `package.json`/bundler**; `index.html` (2 072 B, só estrutura) + `assets/css/` (2) + `assets/js/` (17 módulos: `cena/`, `dados/`, `modelo/`, `tela/`, `utilitarios/`, `config/fontes.js` com as 2 fontes). Publicação prevista em GitHub Pages (`main`, raiz); abertura local por `python -m http.server`.
- **Git:** `main`, `origin` = `https://github.com/Gelvazio/gerenciador-de-ia.git`, **0 à frente / 0 atrás**, árvore **limpa**, **35 commits**. Último: `290d5e4` · 2026-10-18 12:17:37 · `feat(rules-local): instala as regras globais em rules-local/ (RULES-LOCAL-GLOBAL.17) por Claude Code (Opus 5.5 · herdr OP-19; líder sargento Opus 5.5)`.
- **Tamanho:** 63 arquivos rastreados, 0,26 MB (sem `.git`).
- **Quadro:** `tasks/STATUS.md` (70 linhas) — mãe **#2 (visualizador 3D) ⬜** com plano aprovado (17/10 11:42); **#2.10 ⬜ pendente** (`README.md` e conferência na tela, `LEVE · effort low`); frentes #2.8/#2.9/#4.1 ⏹️ encerradas; 5 etapas; 9 decisões; riscos e bloqueios vazios. **Pendência aberta que exige decisão do usuário:** intervalo de leitura da API do GitHub (2 fontes a cada 60 s = 120 req/h contra limite de 60/h sem token; opções 150 s/fonte, só raw ou token — este proibido na página).
- **Documentação/regras:** `CLAUDE.md` (280 linhas, é a doc real do projeto), `rules-local/` completo (19 regras + `sessao.mjs`/`baixar.mjs`/`comparar.mjs`/`conferir.mjs` + `RELATORIO.md`), `.claude/rules/tasks/` (4). **`README.md` tem só 2 linhas (stub)** e **não existe `docs/`**.
- **Riscos do gerenciador:** README stub/doc espalhada só no `CLAUDE.md`; `rules-local` uma mudança global atrás (C38); pendência de rate limit sem decisão; `tasks/.sessao-ativa` **ausente** (pasta livre hoje); sem `package.json`, logo sem lint/typecheck automatizável; links relativos conferidos (heurística) sem quebras; `fontes.js` só aponta repositórios públicos, sem token/segredo (verificado).

### Achados do grupo (priorizados)

1. **Não há divergência entre os 9 dashboards**: todos são o mesmo commit `4dc440c` (1137 commits, 418 arquivos rastreados) e nenhum está à frente/atrás do `origin/main`. Qualquer trabalho "por clone" está trabalhando sobre o **mesmo** repo remoto e o **mesmo** quadro — risco de conflito de push entre sessões paralelas.
2. **`qoder` é o único clone com trabalho real não commitado** (README + `database/README.md`, SUB-62.3), justamente a subtarefa que o quadro marca reservada por Qoder **desde 13/10 22:01** — reserva estagnada há 5 dias e entrega pendente de commit/push.
3. **A documentação da raiz está errada/desatualizada em dois pontos**: (a) diz que `dashboard-ai-Codex-gmail` tem "só um README curto" — o `gmail` está completo; (b) usa nomes `dashboard-ai-Codex-*` enquanto as pastas reais são `dashboard-ai-claude-code-*`.
4. **`rules-local` defasado**: dashboards em `2026-10-18-ef54a693` (sem C37/C38), gerenciador em `2026-10-18-f4bfe8d8` (sem C38); a matriz de níveis em `niveis-e-modelos.md` difere da fonte `rules-ai` atual (13:00). Sessões que só leem o arquivo local decidem com regra velha.
5. **Repositório Git aninhado dentro de clone**: `laya/` (1 188 arquivos, 35 MB, `.git` próprio) em `senai` e `deepseek`, além de `dashboard-plataformas-de-ia/` (19 arquivos). No `senai` aparecem como **untracked** em `git status` (risco de `git add` acidental); no `deepseek` só são escondidos por `.git/info/exclude` — configuração **local e não reproduzível**.
6. **Nenhum segredo real versionado**: `grep` de JWT/`sk-…` nos arquivos rastreados voltou vazio; `.env` locais (100 linhas) só em `senai` e `deepseek`, corretamente fora do Git, e `.env.example`/`.env.local.example` são placeholders. Risco baixo, mas os dois clones com `.env` não devem ser copiados publicados.
7. **Preparo de ambiente desigual**: só `senai` (346,5 MB), `deepseek` (355,3 MB), `devin` e `qoder` têm `node_modules`; `dist/` existe em `senai`, `deepseek` e `devin`. Os outros 5 clones exigem `npm ci` antes de `npm run build/dev`.
8. **Peso de documentação**: `tasks/task_complete.md` com **410 KB** (maior arquivo versionado) e `README.md` com 38 KB/754 linhas; o histórico congelado (`task-principal.md` 132 KB) também está no Git. Funciona, mas encarece leitura e revisão.
9. **`gerenciador-de-ia` é o único "projeto diferente"**: visualizador 3D estático (Three.js, sem `package.json`) que lê os quadros públicos; está limpo, no HEAD do seu próprio remoto, com a pendência decisória do intervalo da API e a etapa #2.10 (README) aberta.

### Pendências/ambiguidades

- **Sem `git fetch`:** o estado "0/0" é contra o `origin/main` local; convém o lead confirmar no GitHub se há commits remotos novos (o HEAD local é de hoje 12:33).
- **Qual clone é o "oficial"?** Hoje os 9 são espelhos; se cada conta/IA commitar do seu clone, o mesmo `tasks/STATUS.md` conflita. Decidir um clone por vez ou uma regra de sincronização.
- **Destino do trabalho do `qoder`** (SUB-62.3): commitar/push, ou descartar; e a reserva de 13/10 22:01 deve ser renovada ou liberada.
- **Atualizar `rules-local`** nos 9 dashboards e no gerenciador (rodar `node rules-local/sessao.mjs`) e registrar a versão vigente.
- **`laya/` e `dashboard-plataformas-de-ia/`**: definir se são cópias de terceiros (devem entrar no `.gitignore` versionado) ou se saem dos clones; o `info/exclude` do deepseek precisa ser substituído por `.gitignore` se a intenção é ignorar.
- **`gerenciador-de-ia`**: decidir o intervalo de leitura da API (150 s × raw × token) e escrever o `README.md`/`docs/` (etapa #2.10).
- **Corrigir o mapa da raiz** (`C:\fontes\AGENTS.md`/`CLAUDE.md`): nome das pastas e o aviso obsoleto do gmail "só README".
