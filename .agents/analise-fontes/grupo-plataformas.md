## Grupo PLATAFORMAS

**Coleta:** 2026-10-18, 13:26–13:31 (America/Sao_Paulo) · **Escopo:** 5 repositórios em `C:\fontes` ·
**Modo:** somente leitura (git de consulta + leitura de arquivos); nenhum projeto foi alterado.
Tamanhos excluem `node_modules`, `.git`, `dist` e `build`; no REA os itens pesados aparecem à parte.
Nada de `DEMAIS-PROJETOS-*` foi listado, buscado ou citado (regra C23). Não rodei graphify, não abri
navegador, não criei/rodei testes e não fiz commit.

### Tabela-resumo

| Repositório | Propósito | Stack | Branch/remoto | Último commit | Árvore | Tamanho | Rules-local | Última atividade no quadro |
|---|---|---|---|---|---|---|---|---|
| `PLATAFORMA-ENVIO-CURRICULOS` | Página `index.html` com um card por pessoa para análise, otimização e crescimento de LinkedIn | HTML + CSS + JS puro (sem build/manifesto) | `main` · `origin` GitHub `Gelvazio/PLATAFORMA-ENVIO-CURRICULOS` (0/0) | `c40785f` 18/10 12:08:49 `feat(rules-local): ... RULES-LOCAL-GLOBAL.16` | limpa (0) | 1,7 MB · 44 arq (41 rastreados) | `2026-10-18-ef54a693` | 16/10 22:16 — LINKEDIN 👀 aguardando aceite; 1 frente encerrada |
| `REA-APP-CLONES` | Usar REA para entender aplicativos e recriar funcionalidades | Node/TS + Electron (clone), Python/FastAPI (servidor), Ghidra 12.1.4 + JDK 21 | `main` · `origin` GitHub `Gelvazio/rea-app-clones` · **sem upstream** | `9ee2177` 18/10 12:33:41 `docs(skills): classificar-tarefa...` (**não empurrado**) | **suja (10 entradas)** · 1 à frente | 1.736,3 MB · 5.655 arq (+ `.git` 683,7 MB) | `2026-10-18-ef54a693` | 18/10 07:34 — CLONE/SERVIDOR/HERDR em progresso |
| `template-inicial-tasks-ia` | Esqueleto base para projetos com IA: regras únicas + quadro em Markdown | Node (scripts `.mjs`) + Markdown; sem app | `main` · `origin` GitHub `Gelvazio/template-inicial-tasks-ia` (0/0) | `0320686` 18/10 12:33:42 `docs(skills): ...` | suja (3 entradas) | 0,3 MB · 100 arq (95 rastreados) | `2026-10-18-ef54a693` | 14/10 — quadro sem tarefas abertas |
| `testes-de-frontend` | Aulas e projetos de frontend, vitrine e repositórios de alunos | Vite 8.3.4 + HTML/CSS/JS; Vitest 5 no projeto aninhado | `main` · `origin` GitHub `Gelvazio/testes-de-frontend` (0/0) | `c447b63` 18/10 12:33:43 `docs(skills): ...` | suja (6 entradas) | 17,0 MB · 525 arq (`node_modules` 34 MB) | `2026-10-18-ef54a693` | 16/10 20:19 — PROJ/JSON/ES6/TEST aguardando usuário |
| `testes-effort-padaria` | Padaria fictícia (dados + desafio) para medir o `effort` dos modelos | Só Markdown; sem código | `main` · `origin` GitHub `Gelvazio/testes-effort-padaria` (0/0) | `5721e22` 18/10 12:25:26 `feat(rules-local): ... RULES-LOCAL-GLOBAL.20` | limpa (0) | 0,1 MB · 37 arq (37 rastreados) | `2026-10-18-f4bfe8d8` (**diferente**) | sem quadro local (tarefa `EFFORT-PADARIA` no `rules-ai`, etapa 003) |

### PLATAFORMA-ENVIO-CURRICULOS

- **Propósito:** análise, otimização e crescimento do LinkedIn de cada pessoa em uma página estática
  com um card por perfil. Parte de PDFs de currículo; o card novo entra em `js/dados-perfis.js` sem
  mexer em `js/app.js` (AGENTS.md linhas 16–21).
- **Entrada/stack:** `index.html` (30 linhas) + `css/estilo.css` (4.609 B) + `js/app.js` (11.657 B) +
  `js/dados-perfis.js` (27.988 B); abre por duplo clique. Não há `package.json` nem build — o único
  artefato executável é `node rules-local/sessao.mjs`, chamado pelo hook de sessão.
- **Documentação:** `AGENTS.md` (40 linhas, regras do projeto embutidas + bloco `rules-local`);
  `README.md` com 1 linha (só o título). **Não há** `CLAUDE.md`, `GEMINI.md`, `.claude/rules/`,
  `.agents/` nem `docs/`. `.claude/settings.json` tem **só** o hook `SessionStart` que roda
  `rules-local/sessao.mjs`.
- **Quadro:** `tasks/STATUS.md` (65 linhas) — etapa **LINKEDIN** 👀 "Aguardando aceite" e
  LINKEDIN.2 👀 "Aguardando o usuário"; card de JÉSSICA MORATELLI fica para depois; 2 etapas
  (`ETAPA-001`, `ETAPA-002`); 3 linhas concluídas em `tasks/task_complete.md`.
- **Git:** `main` limpa (0), 41 rastreados, sem PDFs rastreados; 0/0 contra `origin/main`;
  `hooksPath` **vazio** (hooks de Git do template não instalados).
- **Riscos:** os 3 PDFs de entrada estão soltos na raiz (`curriculo-taila-cellarius.pdf` 0,16 MB,
  `curriculo_gelvazio_camargo.pdf` 0,06 MB, `TEMPLATE-ORIENTACAO-CLAUDE.pdf` 1,40 MB). `*.pdf` está no
  `.gitignore` e nenhum foi versionado, mas o de Taila é de **menor de idade** (CPF/RG/endereço): cópia
  manual ou `git add -f` expõe dado sensível.

### REA-APP-CLONES

- **Propósito:** engenharia reversa com REA para entender aplicativos e recriar as funcionalidades
  (README.md linhas 1–13). Regras e quadro seguem o `template-inicial-tasks-ia` (README linha 17).
- **Entrada/stack:** `index.html` (guia), `tasks/STATUS.md` e `apps-cloned/chaos-code/` (`main` em
  `dist/main/principal.js`). `package.json` `rea-app-clones` 0.1.0 (scripts `sync:agentes`,
  `check:agentes`, `hooks:instalar`); clone `chaos-code-clone` 0.1.0 (Electron `^44.7.2`, TypeScript
  `^7.0.2`, esbuild `^0.28.2`); servidor FastAPI + `uvicorn`/`jinja2`/`itsdangerous`; Ghidra **12.1.4**
  (`tools/ghidra/bom.json`) e instalador JDK **21.0.12**.
- **Documentação:** `AGENTS.md` (62 linhas — hash idêntico ao do template), `CLAUDE.md`,
  `GEMINI.md`, `.claude/rules/` (21 arquivos, inclui `visualizador/` e regra própria de graphify),
  `.agents/skills/` (3) e `.agents/agents/` (4), `rules-local/` (27 arquivos, `ef54a693`), `tasks/etapas/`
  (16 etapas), `tasks/STATUS_TAREFAS_ANDAMENTO.md` e `tasks/RECADOS.md`.
- **Git:** `main` **sem upstream configurado** (`git status` mostra `## main`, não `## main...origin/main`);
  HEAD `9ee2177` está **1 commit à frente** de `origin/main` (`011b77f`, 12:09) — o commit
  `docs(skills)` de 12:33 **não foi empurrado**. Árvore suja com **10 entradas**: 6 `M`
  (`.gitignore` + 5 de `graphify-out/`) e 4 `??` (`Usersgelva.claude-contaC/`, os 2 `.exe` grandes e
  `tasks/PROMPT_FINANCEIRO.md`).
- **Quadro:** 15 frentes (14 encerradas; HERDR em execução); abertas: CLONE (38 subtarefas + aceite),
  SERVIDOR (22 + aceite), HERDR (2) e CONFEFFORT movida ao quadro global; risco de conflito no `STATUS.md`.
- **Riscos:** `.gitignore` com `apps-to-be-cloned/` (typo) em vez de `apps-to-be-clone/` — os
  executáveis **não estão ignorados**; `graphify-out/` versionado (graph.json 3,4 MB) com diff de
  **88.106 inserções**; `.exe` de 10,7 MB sem LFS; pasta lixo `Usersgelva.claude-contaC/` com
  `skipDangerousModePermissionPrompt: true`; `.git` 683,7 MB e `node_modules` 56,1 MB.

### REA-APP-CLONES: inventário

| Pasta/item | Conteúdo | Estágio |
|---|---|---|
| `apps-to-be-clone/` (771,6 MB, 3 arq) | `chaos-code-v3-client.exe` 10,7 MB (rastreado) — Chaos Code v3, Rust + Tauri; `kiro-ide-1.3.11-stable-win32-x64.exe` 201,4 MB e `KiroCrew-Setup.exe` 559,5 MB (**não rastreados, sem ignore**) | 2 binários baixados/aguardando análise; 1 analisado e em clonagem |
| `apps-cloned/chaos-code/` (1,9 MB; 164 rastreados) | `src/` (`main`, `preload`, `renderer`, `compartilhado`), `server/` Python/FastAPI (`banco`, `rotas`, `esquemas`, `seguranca`, `telas`), `docs/` (11 arquivos de inventário + `docs/original/` com os assets extraídos), `scripts/construir.mjs`, `dist/` gerado | **Em progresso** (ETAPA-005): 38 subtarefas de CLONE abertas e 22 de SERVIDOR; `typecheck`/`build` relatados ok; commit local pendente |
| `tools/` (954,5 MB) | `ghidra/` 12.1.4 (787,5 MB, 5.166 arq) + `jdk-21/jdk-21.0.12_windows-x64_bin.exe` (167,0 MB) — **fora do Git** (`.gitignore: tools/`) | Pronto para o REA |
| `scripts/` | `sincronizar-agentes.mjs` (gera cópias por IA) | Regular |
| `guia/` | só `estilo.css`; a página-guia é o `index.html` da raiz | Regular |
| `graphify-out/` | 6 arquivos versionados: `graph.html` 2,9 MB, `graph.json` 3,4 MB, `GRAPH_REPORT.md`, manifest e labels | Regeneração local suja a árvore |
| `tasks/` | 6 arquivos + 16 etapas; `STATUS_TAREFAS_ANDAMENTO.md` guarda o retomável da equipe herdr | Ativo |

### template-inicial-tasks-ia

- **Propósito:** esqueleto inicial de qualquer projeto com IA — regras únicas para todas as IAs e
  quadro de tarefas que sobrevive à queda da sessão (README.md linhas 1–5).
- **Stack/manifestos:** `package.json` 0.1.0 (`type: module`; scripts `sync:agentes`, `check:agentes`,
  `hooks:instalar`; sem deps). Guia de documentação: `index.html` (394 linhas) + `.claude/rules/visualizador/`.
- **Documentação:** `AGENTS.md` (62 linhas), `CLAUDE.md`, `GEMINI.md`, `.claude/rules/` (21),
  `.claude/hooks/` (3), `.agents/` (7: 4 agentes + 3 skills), `.githooks/` (4, instalados —
  `hooksPath .githooks`), `docs/` **vazio**, `guia/` só `estilo.css`.
- **Quadro:** `tasks/STATUS.md` (59 linhas) sem nenhuma tarefa aberta; 2 etapas (criar template e
  guia); última decisão 2026-10-14.
- **Git:** `main`, 0/0 contra `origin/main`, commit `0320686` (12:33:42). Suja com 3 entradas:
  `.codex/hooks.json`, `.codex/hooks/` (3 scripts) e `.vscode/settings.json` — todos legítimos, mas
  não versionados (`.vscode` também não está no `.gitignore`).
- **Riscos:** como é a fonte do padrão, está **atrás dos derivados** — REA e `testes-de-frontend` já
  versionam `.codex/hooks.json` + `.codex/hooks/`; o próximo commit pega os arquivos sem revisão.

### testes-de-frontend

- **Propósito:** projetos de frontend das matérias do Técnico em Informática, vitrine e repositórios
  de alunos; criado a partir do template (README linha 5).
- **Stack/manifestos:** `package.json` `testes-de-frontend` 0.1.0 — `vite ^8.3.4`; scripts
  `dev`/`build`/`preview` + os do template. Entrada Vite `index.html` + `src/` (11 arquivos). Projeto
  aninhado `aulas/projeto-frontend-com-testes`: Vitest `^5.0.4` (+ `@vitest/coverage-v8`, `@vitest/ui`)
  com scripts `test`, `test:run`, `test:coverage`, `test:report`.
- **Documentação:** `AGENTS.md`/`CLAUDE.md`/`GEMINI.md` iguais ao template, `.claude/rules/` (21),
  hooks (3), `.agents/` (7), `.githooks/` instalados, `guia/index.html`, `docs/` **vazio**.
  `README.md` é o do template com 2 linhas de contexto — ainda ensina "Como usar num projeto novo".
- **Quadro:** `tasks/STATUS.md` (85 linhas) com PROJ, JSON, ES6 e TEST; 14 etapas; nenhuma subtarefa
  livre de fato: `JSON.2`–`JSON.9` dependem de `JSON.1` (👀 usuário) e `PROJ.4`/`ES6.3`/`TEST.18`
  aguardam aceite. **Sem** seção "Frentes de trabalho" e **sem** coluna "Modelo" (padrão antigo).
- **Git:** `main`, 0/0 contra `origin/main`, commit `c447b63` (12:33:43). Árvore suja com 6 entradas:
  `M aulas/projeto-frontend-com-testes/.gitignore` (remove `coverage/` e `html/` do ignore), `D` de 3
  arquivos em `projetos-alunos/repositorios/marialmmarcelino-blip/meu-site/` (`LICENSE`, `README.md`,
  `.gitattributes`) e `??` de `LICENSE` + `html/` no mesmo projeto de aulas — movimentação/limpeza
  não commitada.
- **Riscos:** `aulas/projeto-frontend-com-testes/` tem **repositório Git aninhado** (`.git` próprio)
  dentro de pasta rastreada; `projetos-alunos/` concentra 15,1 MB/343 arquivos rastreados de terceiros.

### testes-effort-padaria

- **Propósito:** projeto fictício só para medir se o `effort` (`low`/`medium`/`high`) muda a resposta
  dos modelos (README.md linhas 1–7). Sem código, banco ou tela.
- **Dados:** `dados/` com `cardapio.md` (1.015 B), `estoque.md` (600 B), `pedidos.md` (338 B) e
  `regras.md` (1.909 B — reserva de 10% no francês, fornadas inteiras, compras por pacote, descontos
  8%/5%/10%, 2 fornos de 240 min) + `DESAFIO.md` (5 perguntas e bloco `RESPOSTA FINAL` obrigatório).
- **Quadro:** **não há** `tasks/` nem `STATUS.md` local; o teste vive na tarefa global
  `EFFORT-PADARIA` do `C:\fontes\rules-ai\tasks\STATUS.md` (etapa 003), que guarda o gabarito — o
  gabarito de propósito não fica nesta pasta.
- **Documentação/config:** `AGENTS.md` (34 linhas, regras do projeto), `README.md`; **sem**
  `CLAUDE.md`/`GEMINI.md`, `package.json`, `.githooks`, `.agents/`, `docs/`. `.claude/settings.json`
  só com `SessionStart` (`rules-local/sessao.mjs`).
- **Git:** limpo (0), 37 rastreados, `main` 0/0, commit `5721e22` (12:25:26).
- **Riscos:** `rules-local` está em versão **diferente** dos outros quatro (`f4bfe8d8`;
  `niveis-e-modelos.md` = `91b9063…` contra `ae07ca7…`); o `AGENTS.md` proíbe mudar número de
  `dados/` e o `DESAFIO.md` depois das rodadas, então qualquer edição invalida o gabarito.

### Divergência de padrão vs `template-inicial-tasks-ia`

| Item | template | PLATAFORMA | testes-de-frontend | REA | padaria |
|---|---|---|---|---|---|
| `AGENTS.md` "porta de entrada" (62 linhas) | ✔ | ✖ regras inline, 40 linhas | ✔ (hash idêntico) | ✔ (hash idêntico) | ✖ 34 linhas próprias |
| `CLAUDE.md` + `GEMINI.md` | ✔ | ✖ ausentes | ✔ | ✔ | ✖ ausentes |
| `.claude/rules/` + `.claude/hooks/` + `.agents/` | ✔ | ✖ (só `settings.json`) | ✔ | ✔ | ✖ (só `settings.json`) |
| `package.json` com `sync:agentes`/`hooks:instalar` | ✔ | ✖ ausente | ✔ (+ Vite) | ✔ | ✖ ausente |
| `.githooks/` + `core.hooksPath` | ✔ | ✖ não instalado | ✔ | ✔ | ✖ não instalado |
| `tasks/STATUS.md` local | ✔ (vazio) | ✔ | ✔ | ✔ | ✖ (quadro global) |
| Seção "Frentes de trabalho" | ✖ | ✔ | ✖ | ✔ | n/a |
| Coluna "Modelo" nas tarefas | ✖ | ✔ | ✖ | ✔ | n/a |
| `rules-local/VERSAO.md` | `ef54a693` | `ef54a693` | `ef54a693` | `ef54a693` | `f4bfe8d8` |
| `docs/` | vazio | ausente | vazio | ausente (docs do clone) | ausente |
| `README.md` customizado | — | só o título | texto do template | próprio | próprio |
| `graphify-out/` | ignorado | ignorado | ignorado | **versionado** | n/a |

Conclusão: REA e `testes-de-frontend` seguem as regras do template, mas o frontend usa um quadro mais
antigo (sem frentes/modelo) e o REA acrescenta `STATUS_TAREFAS_ANDAMENTO.md` e versiona o grafo.
`PLATAFORMA-ENVIO-CURRICULOS` e `testes-effort-padaria` adotaram só `AGENTS.md` + `rules-local` (sem
`.claude/rules` nem hooks de Git).

### Achados do grupo

- **[ALTO] REA: 760 MB de executáveis fora do ignore.** `KiroCrew-Setup.exe` (559,5 MB) e
  `kiro-ide-1.3.11-stable-win32-x64.exe` (201,4 MB) estão `??` porque o `.gitignore` diz
  `apps-to-be-cloned/` (typo). Um `git add .`/`-A` quebra o push (GitHub recusa >100 MB por arquivo).
- **[ALTO] REA: 1 commit local não empurrado e `main` sem upstream.** `git status` mostra `## main`;
  HEAD `9ee2177` está à frente de `origin/main` (`011b77f`) — o commit `docs(skills)` de 12:33 não subiu.
- **[ALTO] REA: `graphify-out/` versionado.** 5 arquivos modificados com 88.106 inserções (graph.json
  3,4 MB); cada execução do graphify cria um diff gigante para o próximo commit.
- **[ALTO] testes-de-frontend: movimentação de arquivos de aluno não commitada.** `LICENSE`, `README.md`
  e `.gitattributes` de `marialmmarcelino-blip/meu-site` aparecem como excluídos, há `LICENSE` e
  `html/` não rastreados no projeto de aulas e o `.gitignore` deixou de ignorar `coverage/` e `html/`.
- **[MÉDIO] `rules-local` divergente entre projetos.** Quatro em `2026-10-18-ef54a693` e
  `testes-effort-padaria` em `2026-10-18-f4bfe8d8` (`niveis-e-modelos.md` mudou) — a mesma regra
  global vale diferente em cada pasta.
- **[MÉDIO] PLATAFORMA e padaria com adoção parcial do template.** Sem `CLAUDE.md`/`GEMINI.md`,
  `.claude/rules/`, `.agents/`, `package.json` e hook de Git (`hooksPath` vazio); na PLATAFORMA o
  Claude Code só carrega regra pelo `SessionStart` e pela leitura manual do `AGENTS.md`.
- **[MÉDIO] template (a fonte) está atrás dos derivados.** `.codex/hooks.json`, `.codex/hooks/` e
  `.vscode/settings.json` sem versão no template, enquanto REA e `testes-de-frontend` já versionam
  esses mesmos hooks; `.vscode` não consta do `.gitignore`.
- **[MÉDIO] Dados pessoais em disco na PLATAFORMA.** 3 PDFs de currículo na raiz, incluindo o de uma
  menor de idade (CPF/RG/endereço); ignorados e nunca commitados (0 PDF em `git ls-files`), mas no
  workspace sem proteção além do `.gitignore`.
- **[BAIXO] REA:** `.exe` de 10,7 MB versionado sem LFS e pasta lixo `Usersgelva.claude-contaC/`
  (resíduo de expansão de caminho) com `skipDangerousModePermissionPrompt: true`.
- **[BAIXO] documentação incompleta:** `docs/` vazio em template e `testes-de-frontend`; `README.md` do
  frontend ainda é o manual do template; `README.md` da PLATAFORMA tem só o título.

### Pendências/ambiguidades

1. **REA — decisão do usuário:** empurrar o commit local? Corrigir o typo do `.gitignore` e decidir o
   destino dos 760 MB (LFS, mover para `tools/` ignorado ou apagar)? Manter `graphify-out/` versionado
   ou ignorá-lo (como no template)? Apagar a pasta `Usersgelva.claude-contaC/`?
2. **REA — quadro:** CLONE.6.11 liberada sem começar e sem LEVE livre; HERDR.1 continua travada por
   `HERDR-GLOBAL.1` no `rules-ai`; aceites pendentes de CLONE.14.3 e SERVIDOR.54.
3. **PLATAFORMA — usuário:** aceite do card LINKEDIN e, depois, o card de JÉSSICA MORATELLI.
   Ambiguidade: instalar os hooks de Git ou assumir que a página está fora do padrão de quadro.
4. **template — padrão:** definir se `.codex/hooks.json` + `.codex/hooks/` e `.vscode/settings.json`
   entram no Git (os derivados já os versionam) ou no `.gitignore`; hoje o template é a fonte e está
   desatualizado.
5. **testes-de-frontend — usuário:** confirmar se as exclusões em `marialmmarcelino-blip/meu-site` e
   o `html/` não rastreado são intencionais (tarefa PROJ em andamento) e aprovar `PROJ.4`, `ES6.3`,
   `TEST.18` e o plano `JSON.1`.
6. **padaria:** sincronizar os outros 4 repositórios com o `rules-local` mais novo (`f4bfe8d8`) ou
   voltar a padaria para `ef54a693`; rodadas e gabarito ficam na etapa 003 do `rules-ai` (fora do escopo).
7. **Geral:** nenhum dos 5 repositórios lista pendência de usuário própria além das acima; o grupo
   não tem credenciais/chaves aparentes em arquivo rastreado (0 padrões de chave e 0 `.env`).
