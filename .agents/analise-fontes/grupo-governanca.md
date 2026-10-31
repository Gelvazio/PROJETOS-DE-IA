## Grupo GOVERNANÇA

> **Coleta:** 2026-10-18 13:28 (Brasília) · **Modo:** somente leitura (nenhum arquivo alterado) · **Escopo:** `rules-ai`, `CONFIG-DEEPSEEK`, raiz de `C:\fontes` e mapa × realidade.
> **Regra C23 respeitada:** `DEMAIS-PROJETOS-NAO-MEXER-AGORA\` **não auditada por regra C23** — não foi listada, lida nem indexada.

---

## 1. `rules-ai` — repositório das regras globais

**Propósito:** fonte única das regras de IA que valem para todos os projetos de `C:\fontes` e todas as IAs; `regras/*.md` → `scripts/sincronizar.mjs` → `dist/REGRAS-GLOBAIS.md` + `VERSAO.md` → arquivos globais de cada IA (Claude Code via `@import`, demais por cópia). `CONFLITOS.md` guarda as divergências que só entram no global com o "sim" do usuário. Desde a C36 (2026-10-18), cada projeto com GitHub recebe uma cópia `rules-local/` controlada pela `VERSAO.md`.

**Estrutura (topo do repo):**

| Item | Conteúdo | Estado |
|---|---|---|
| `AGENTS.md` | 36 linhas; regras locais C29 (uma sessão por vez, trava `tasks/.sessao-ativa`) e C31 (` · NN%` na coluna "Em uso por") | ok, mtime 17/10 17:54 |
| `regras/` | 20 arquivos = 19 regras + `INDEX.md`; índices e contagens conferem (INDEX lista 19; `VERSAO.md` lista 20 incluindo INDEX) | consistente |
| `dist/REGRAS-GLOBAIS.md` | 51.431 B, gerado 18/10 13:00:04; contém `rules-local` (24×), `herdr` (12×) e a linha Qoder | atual |
| `scripts/` | `sincronizar.mjs` (11.317 B), `instalar-rules-local.mjs` (14.208 B), `UPDATE.py` (8.624 B) e `rules-local/` com `sessao.mjs`/`baixar.mjs`/`comparar.mjs`/`conferir.mjs`/`aviso-agents.md` | ok |
| `tasks/` | `STATUS.md` (142 linhas, quadro), `task_complete.md` (**3 linhas**), `etapas/` (**22** arquivos), `GERENCIADOR-HERDR/` (4 arquivos, **untracked**) | quadro incompleto (item 5) |
| `dashboard/` | `index.html`, `graphs/` (agentes ao vivo, cena, `modelos/`), `prompts/`, `MODELOS-DE-IA/`, `assets/`, `scripts/`; 337 arquivos | 264,6 MB (98% do repo) |
| `spec/` | `README.md`, `verificar-spec.mjs`, `templates/` (`requisitos.md`, `invariantes.md`, `perguntas-abertas.md`) — C34 | ok |
| `graphify-out/` | `graph.json` 1,0 MB, `graph.html` 980 KB, `GRAPH_REPORT.md` 36 KB, `cache/`; 158 arquivos | 4,23 MB |
| `VERSAO.md` | versão **2026-10-18-988f933e** (20 entradas) | atual |
| `CONFLITOS.md` | C1–C38 decididas; **C14–C19 ainda pendentes** de decisão | ver achado A6 |
| `.env` | 140 B, mtime 17/10 16:55, **gitignored** (`.gitignore:69`) | chaveiro em texto puro fora do Git |

**Git:**

| Campo | Valor |
|---|---|
| Branch / remoto | `main` · `https://github.com/Gelvazio/rules-ai.git` (fetch/push) |
| Último commit | `7370f6089acdf9972ab505456b29b67bfc763ade` — 2026-10-18 13:00:33 — *chore(graphify): update após NIVEL-QODER.1…* |
| À frente / atrás de `origin/main` | **0 / 0** (sincronizado; `main` rastreia `origin/main`) |
| Árvore suja (`--porcelain`) | **10 linhas**: 1 modificado (`dashboard/prompts/MODELO-3D-REDE-NEURAL-04.md`, +43/−44) + 9 untracked (`dashboard/MODELOS-DE-IA/`, 4 PNG de prompt, `modelo.png`, `graphify-out/.graphify_python`, `task-sincronizador-local.png`, `tasks/GERENCIADOR-HERDR/`) |
| Rastreados | 296 arquivos · pack 1,15 MiB (o peso está fora do Git) |
| Higiene | 9 objetos `tmp_obj_*` órfãos em `.git/objects` (operações interrompidas) |

**Quadro (`tasks/STATUS.md`) — resumo:**

- **12 tarefas-mãe:** EFFORT-PADARIA, CONFEFFORT-GLOBAL, MODELO-GLOBAL, GERENCIADOR-GLOBAL, DASHBOARD-REDE-NEURAL, HERDR-GLOBAL, ESPEC-GLOBAL, NIVEL-DEEPSEEK, NIVEL-QODER, INDEX-REGRAS, DASHBOARD-AGENTES, UPDATE-REPOS.
- **Frentes ativas / "Em uso por":** coluna inteira em `—` ou `— (não reservável)`; **nenhuma reserva**; `tasks/.sessao-ativa` **não existe** → pasta livre no momento da coleta. ***Última atividade:*** registro 18/10 12:59 (NIVEL-QODER/C38) e commit 13:00:33.
- **Subtotais:** 31 ⬜ pendentes · 29 ✅ concluídas ainda no STATUS · 1 ⛔ (GERENCIADOR-GLOBAL.4, automático em pausa) · 2 👀 (MODELO-GLOBAL.2, mãe DASHBOARD-AGENTES).
- **Subtarefas livres por nível:** **PESADO 4** (GERENCIADOR-GLOBAL.3/.7, DASHBOARD-AGENTES.1/.2) · **MEDIO 9** (EFFORT-PADARIA.6/.7, CONFEFFORT-GLOBAL.4/.5, GERENCIADOR-GLOBAL.5, DASHBOARD-REDE-NEURAL.4, DASHBOARD-AGENTES.3/.4/.5) · **LEVE 15** (UPDATE-REPOS.2–.14 = 13 **prontas**; CONFEFFORT-GLOBAL.1; DASHBOARD-AGENTES.6 travada por .3/.4/.5) · **Usuário 3** (HERDR-GLOBAL.2, ESPEC-GLOBAL.4, INDEX-REGRAS.3).
- **Etapas abertas:** 002, 003, 004, 009, 013, 015, 016, 018, 020, 021 (+ a 017 referenciada por mãe ainda "🔄" apesar de todas as subtarefas ✅).
- **Pendências do usuário:** plano da DASHBOARD-AGENTES (👀), `MODELO-GLOBAL.2` (levar aos projetos, 👀), `HERDR-GLOBAL.2`, `ESPEC-GLOBAL.4`, `INDEX-REGRAS.3` (todos "Modelo: Usuário").
- **`task_complete.md`:** só **2 linhas** (RULES-LOCAL-GLOBAL e UPDATE-REPOS.1). A decisão C4 ("concluída vai para `task_complete.md`") está aplicada pela metade.

**`rules-local` / `VERSAO.md` — fluxo e estado:** a cada sessão nova, o gancho `SessionStart` (ou `node rules-local/sessao.mjs`) compara a `VERSAO.md` local com a do `rules-ai`; igual → não grava nada; diferente → baixa, escreve `RELATORIO.md` e emite **`DISPARAR A SINCRONIZAÇÃO DE TASKS`**, que cria 1 TASK por regra que exigir ajuste no quadro do projeto; o script nunca faz commit. **Estado atual: 20 projetos com `rules-local/` e todos atrás da versão global** — 18 em `2026-10-18-ef54a693` (aulasenai, 4 `aulas-senai-CLAUDE-*`, 9 `dashboard-ai-*`, REA-APP-CLONES, PLATAFORMA-ENVIO-CURRICULOS, template-inicial-tasks-ia, testes-de-frontend) e 2 em `2026-10-18-f4bfe8d8` (gerenciador-de-ia, testes-effort-padaria) contra **988f933e** no `rules-ai`. Faltam `regras/herdr.md` e `niveis-e-modelos.md`/`INDEX.md` novos em todos (conferido em `template-inicial-tasks-ia`).

**`STATUS_PROJETO.md` — a confusão:** o arquivo é do **rules-ai**, mas o título é "# Status do projeto DASHBOARD-AI", a fonte declarada é o quadro do repositório **`Gelvazio/rea-app-clones`** (commit `d4da53a`) e o cabeçalho diz "Atualizado em: 2026-10-16 15:20 · regravado de hora em hora" — texto herdado do projeto REA/DASHBOARD-AI da época em que o rules-ai era extensão dele. O corpo continua sendo alimentado (última entrada 18/10 **12:32**, histórico 12:35), mas: (a) o cabeçalho está 2 dias atrasado; (b) não há entrada da C38/NIVEL-QODER (12:59) nem do commit das 13:00, violando a regra da raiz ("toda mudança no rules-ai atualiza o `STATUS_PROJETO.md` no mesmo passo"); (c) há entradas **fora de ordem cronológica com horários no futuro** (`2026-10-18 13:49`/`13:50` listadas abaixo de `11:42`, quando a coleta foi às 13:28); (d) "O que espera de você" e "Quadro do REA" são legado já resolvido. Conclusão: documento híbrido, parcialmente mantido, incapaz de servir como status confiável do rules-ai.

**Tamanho (sem `.git`/`dist`/`node_modules`):** **566 arquivos, 269,34 MB** — `dashboard/` 337 arq / **264,58 MB** (5 `.glb` de ~40 MB em `dashboard/graphs/modelos/`, ignorados pelo `.gitignore`, + dump do Instagram em `dashboard/MODELOS-DE-IA/`, untracked), `graphify-out/` 4,23 MB, `tasks/` 0,29 MB, `regras/` 0,05 MB, `scripts/` 0,06 MB. O código/regras são leves; o peso é mídia não versionada — risco de backup, de varredura acidental e de ruído no graphify.

---

## 2. `CONFIG-DEEPSEEK`

- **O que é:** pasta sem Git (verificado: não há `.git`), 3 arquivos — `CLAUDE.md` (**15 bytes, só o texto "CONFIG-DEEPSEEK"**), `docs/templates/requirements.md` (3.644 B) e `docs/templates/design.md` (3.933 B).
- **Finalidade aparente:** pacote de templates do fluxo **spec-driven para tarefa PESADA** (mesmo tema da C34), mas **sem propósito documentado** — o `CLAUDE.md` é um título, não instrução. Nenhum template cita `rules-ai`, `C:\fontes` ou o gate `spec/verificar-spec.mjs`.
- **Estado:** sem Git, sem `rules-local/`, sem `.env`, sem README/quadro; fora do Git da raiz (a raiz `C:\fontes` também não é repositório Git).
- **Riscos:** (1) **segunda fonte** de templates de spec fora do controle do `rules-ai/spec` (nomes divergentes: `requirements`/`design` × `requisitos`/`invariantes`/`perguntas-abertas`), podendo gerar specs que o gate `verificar-spec.mjs` não reconhece; (2) conteúdo não versionado e sem status — muda sem rastro; (3) nome sugere configuração operacional do DeepSeek (algo que a C37 trata nas regras globais), mas o conteúdo não é isso.

---

## 3. Raiz de `C:\fontes`

**Portal (`index.html` + `atualizar-index.cmd` + `scripts/gerar-dados-index.mjs`):** o `index.html` (58 linhas, 4 cards + modais) **não lê Markdown direto** — abre via `file://`, então `gerar-dados-index.mjs` embute os textos em `assets/js/dados.js` (`window.DADOS_FONTES`). `atualizar-index.cmd` roda `node scripts\gerar-dados-index.mjs` e abre a página. O que o portal lê:

| Grupo | Arquivos-fonte | Última alteração da fonte |
|---|---|---|
| `claudeRaiz` | `C:\fontes\CLAUDE.md` (o **AGENTS.md da raiz não é lido**) | 17/10 10:56 |
| `rulesAi` | `rules-ai/AGENTS.md` + **todos** os `regras/*.md` (ordem alfabética) + `CONFLITOS.md` | 18/10 12:59 (regras/CONFLITOS) |
| `opusLider` | `aulas-senai-CLAUDE-OPUS-LIDER/CLAUDE.md` e `/AGENTS.md` | 17/10 10:20 e **18/10 13:03** |
| `tarefas` | `rules-ai/tasks/STATUS.md` e `task_complete.md` | 18/10 12:59 e 12:35 |

**`assets/js/dados.js` está desatualizado:** carimbo `"geradoEm": "17/10/2026, 10:56:41"`, arquivo com mtime 17/10 10:56:41 (66.744 B) — **~26 h defasado**. Não contém C34–C38, `herdr.md`, `rules-local.md`, `INDEX.md` novo, nem as mudanças do STATUS/CONFLITOS de 18/10. O portal exibe mapa antigo mesmo aberto hoje.

**`.agents/`, `.claude/`, `.vscode/`:**

| Pasta | Conteúdo | Observação |
|---|---|---|
| `.agents/skills/gerenciador-de-tarefas/` | `SKILL.md` 13.140 B + `modelo-de-brief.md` | cópia divergente (40 linhas) da versão em `.claude/`; aponta para `.Codex/skills`, `aulas-senai-Codex-*` e `~/.Codex.json` (pastas inexistentes) |
| `.claude/skills/gerenciador-de-tarefas/` | `SKILL.md` 13.186 B + `modelo-de-brief.md` | versão "claude"; duplicada sem fonte única |
| `.vscode/settings.json` | 42 B: `liveServer.settings.port: 5502` | único conteúdo |

**Diff `AGENTS.md` × `CLAUDE.md` da raiz:** não são iguais — **28 linhas divergentes (14 de cada lado)**; 10.156 B (AGENTS, mtime 17/10 20:36) × 10.185 B (CLAUDE, 17/10 10:56). Diferenças: título e auto-referências; precedência global (`C:\Users\gelva\.Codex\AGENTS.md` × `...\.claude\CLAUDE.md` — ambos existem); "sessões do Codex" × "sessões do Claude"; **nomes das pastas `dashboard-ai-*`** (AGENTS usa `dashboard-ai-Codex-*`, obsoleto; CLAUDE usa `dashboard-ai-claude-code-*`, correto); `.Codex\rules\` × `.claude\rules\`; e as frases de `aulasenai` — AGENTS: "*Salvar no `AGENTS.md`* significa salvar no `AGENTS.md`" (tautologia) e CLAUDE: "*Salvar no `CLAUDE.md`* significa salvar no `AGENTS.md`" (contradição). Os dois declaram "Atualizado em 2026-10-17".

---

## 4. Mapa × realidade

Realidade = `Get-ChildItem -Directory -Force` em `C:\fontes` (28 diretórios; 27 auditáveis + 1 proibida). Itens citados = tabela "Visão geral" e seções dos dois arquivos.

| Situação | Item | Observação |
|---|---|---|
| citado e existe | `aulasenai\` | ok (também na tabela) |
| citado e existe | `testes-de-frontend\`, `template-inicial-tasks-ia\`, `REA-APP-CLONES\`, `testes-effort-padaria\` | ok |
| citado e existe | `dashboard-ai-*\` (9 pastas) | existem 9, mas **nomes só batem no CLAUDE.md** (`dashboard-ai-claude-code-gmail/hotmail/senai`); no AGENTS.md estão `dashboard-ai-Codex-*` |
| citado e existe | `index.html`, `assets\`, `scripts\`, `atualizar-index.cmd` | ok (portal: ver seção 3) |
| citado e existe | `DEMAIS-PROJETOS-NAO-MEXER-AGORA\` | **não auditada por regra C23** |
| **citado e não existe** | `gerador-atividades\` | removido (ou movido para outra pasta) |
| citado e não existe | `plataforma-ia\` | removido; `CONFLITOS.md` C14 ainda discute suas regras |
| citado e não existe | `ajax-ai-by-pewdiepie\` | removido |
| citado e não existe | `dashboard-plataformas-de-ia\` e `gerenciador-youtube\` | removidos |
| citado e não existe | `acl-recovery-REA-APP-CLONES\` e `dsh-acl-recovery\` | removidos |
| citado e não existe | `DEMAIS-PROJETOS-DE-SISTEMAS-MANTER-OFFLINE\` | **regra C20 aponta para pasta inexistente** |
| citado e não existe | `qoderwake_latest_windows_amd64.exe` | binário de ~190 MB não está mais na raiz |
| **existe e não citado** | `aulas-senai-CLAUDE-HAIKU\`, `-OPUS\`, `-OPUS-LIDER\`, `-SONNET\` | 4 clones por modelo; só aparecem no STATUS do rules-ai |
| existe e não citado | `CONFIG-DEEPSEEK\` | ver seção 2 |
| existe e não citado | `gerenciador-de-ia\` | pasta com Git, CLAUDE.md e rules-local (citada no CONFLITOS/C29, não no mapa) |
| existe e não citado | `PLATAFORMA-ENVIO-CURRICULOS\` | projeto com Git, AGENTS.md e rules-local |
| existe e não citado | `.agents\`, `.claude\`, `.vscode\` | configuração de agentes/IDE da própria raiz |
| **citado no texto, fora da tabela** | `rules-ai\` | repositório central não tem linha na "Visão geral" |

**Descrições desatualizadas:**

1. Cabeçalho "Atualizado em 2026-10-17" nos dois arquivos — a raiz mudou em 18/10 (7 diretórios novos/removidos).
2. `dashboard-ai-*`: AGENTS.md com nomes `Codex-*` (reais: `claude-code-*`) e `.Codex\rules\` (real: `.claude\rules\` — conferido em aulasenai, REA, template, dashboard-ai-codex e testes-de-frontend); as 9 pastas são clones do **mesmo** remoto `Gelvazio/dashboard-ai.git`.
3. "A versão `dashboard-ai-*-gmail` tem só um README curto" — hoje tem `package.json`, `src/` e `rules-local/` (versão completa).
4. `plataforma-ia`: documentação citada (`README.md`, `PLATAFORMA_DE_IA.md`, `CLAUDE_CLI_SETUP.md`, `MCP_SERVER_ERROR.md`) não existe mais.
5. `ajax-ai-by-pewdiepie`: repositório, licença MIT e lista de subpastas — pasta não existe.
6. `template-inicial-tasks-ia` e `dashboard-ai-*`: "(`AGENTS.md`, `.Codex\rules\`)" — a pasta real é `.claude\rules\`.
7. Regra global "nunca ler de início `DEMAIS-PROJETOS-DE-SISTEMAS-MANTER-OFFLINE\` (C20)" — pasta não existe; a única pasta protegida real é a da C23.
8. Portal descrito como "4 cards (este arquivo, `rules-ai`, líder Opus e tarefas)" — o card "raiz" lê **`CLAUDE.md` apenas**, não o `AGENTS.md`, e não há card para `CONFIG-DEEPSEEK` nem para a tabela do mapa.

---

## 5. Achados de governança (priorizados)

1. **`rules-local/` defasado em 20 projetos (risco de enxurrada de TASKs).** Todos abaixo de `2026-10-18-988f933e`; 18 em `ef54a693` e 2 em `f4bfe8d8`; falta `regras/herdr.md` em todos. Como a C36 manda criar 1 TASK por regra alterada na primeira sessão de cada projeto, a próxima sessão tende a gerar dezenas de TASKs simultâneas sem que ninguém tenha decidido isso.
2. **O quadro deixou de ser fonte única.** Existem 22 arquivos em `etapas/`, mas só 12 mães no `STATUS.md`; **10 mães não têm linha em lugar nenhum** (GLOBAL, ESFORCO-GLOBAL, INDEX-FONTES, GATILHO-GLOBAL, GRAPHIFY-GLOBAL, SUBTAREFA-GLOBAL, STATUS-QUADRO-GLOBAL, PASTA-UNICA-GLOBAL, PONTO-GLOBAL, ACEITE-GLOBAL). O `task_complete.md` tem 2 linhas enquanto o `STATUS.md` mantém **29 ✅** — a C4 está aplicada pela metade.
3. **`STATUS_PROJETO.md` é enganoso e está atrasado.** Título de DASHBOARD-AI, fonte `rea-app-clones`, cabeçalho de 16/10, entradas com horários futuros e fora de ordem, sem a última mudança de regra (12:59) — descumpre a própria regra da raiz de atualizar o status no mesmo passo.
4. **Mapa duplicado e divergente.** `AGENTS.md` × `CLAUDE.md` com 28 linhas diferentes; 9 itens citados que não existem, 10 existentes não citados, `rules-ai` fora da tabela. O `AGENTS.md` foi editado por último (20:36) e ficou **mais** errado que o `CLAUDE.md` (`dashboard-ai-Codex-*`, `.Codex\rules\`).
5. **Portal congelado.** `assets/js/dados.js` de 17/10 10:56 (~26 h) exibe regras, quadro e conflitos antigos; e ignora `AGENTS.md` da raiz, etapas e `CONFIG-DEEPSEEK`.
6. **`CONFLITOS.md` com pendências impossíveis.** C14–C19 aguardam decisão sobre `plataforma-ia`, `gelvazio.github.io`, `PROJETO-CANIL-DOCE-LAR`, `controlemercadoria`, `c3tecnologia-site`, `PROJETO-EMAIL-SENAI`, `ANALISE-PLATAFORMAS-DE-IA` e `dashboard-ai-*` — vários inexistentes ou em pasta offline; C20 também aponta pasta inexistente. O registro de "versão antiga do STATUS do REA" continua no arquivo.
7. **`CONFIG-DEEPSEEK` é pasta órfã.** 15 bytes de `CLAUDE.md`, sem Git/README/quadro, duplicando os templates de spec da C34 com outros nomes (não compatíveis com o gate `spec/verificar-spec.mjs`).
8. **Skills duplicadas e divergentes.** `gerenciador-de-tarefas` existe em `.claude/` e `.agents/` com 40 linhas de diferença; a cópia de `.agents/` referencia `.Codex/skills`, `aulas-senai-Codex-*` e `~/.Codex.json`, que não existem mais.
9. **Estado Git do rules-ai saudável no essencial, sujo na prática.** `main` sincronizada (0/0), mas 10 entradas sujas, `tasks/GERENCIADOR-HERDR/` (status operacional, inclui `CONTAS-CLAUDE-CODE.md`) **fora do Git**, 9 objetos órfãos em `.git/objects` e 260 MB de mídia (5 `.glb` de ~40 MB ignorados + dump do Instagram untracked).
10. **Segredos em texto puro.** `rules-ai/.env` (140 B, chaveiro, gitignored) e `dashboard/graphs/.env`; como o repo também é a base de cópia dos projetos, um `robocopy`/zip sem filtro leva as chaves junto.

---

## 6. Pendências/ambiguidades (exigem decisão do lead/usuário)

| # | Assunto | O que decidir |
|---|---|---|
| P1 | `rules-local` defasado em 20 projetos | Sincronizar pelo script agora (gera TASKs), congelar a C36 ou sincronizar sem criar TASK? Quem roda o `--aplicar`? |
| P2 | `STATUS_PROJETO.md` | Renomear/reescrever como status do rules-ai (cabeçalho, fonte e seções legadas) ou aposentar? |
| P3 | Etapas sem linha no quadro | Recriar as 10 mães no `STATUS.md`, consolidar em `task_complete.md` ou só arquivar as etapas? |
| P4 | C4 (mover concluídas) | Aplicar às 29 subtarefas ✅ do `STATUS.md` ou mudar a regra para manter histórico no quadro? |
| P5 | C14–C19 e C20 | Reescrever contra a realidade atual (projetos inexistentes/offline) ou marcar como arquivadas? |
| P6 | `CONFIG-DEEPSEEK` | É projeto (Git + README + rules-local) ou deve ser fundido em `rules-ai/spec` e apagado? |
| P7 | Mapa × realidade | Gerar `AGENTS.md` e `CLAUDE.md` a partir de uma fonte única (e incluir o próprio `rules-ai` e os `aulas-senai-CLAUDE-*` na tabela)? |
| P8 | Portal | Regravar `dados.js` e acrescentar ao portal o `AGENTS.md`, as etapas e o `CONFIG-DEEPSEEK`? |
| P9 | Duplicação de skills | Fonte única para `gerenciador-de-tarefas` (`.claude` × `.agents`) e remoção das referências a `.Codex`/pastas `aulas-senai-Codex-*`. |
| P10 | `DEMAIS-PROJETOS-NAO-MEXER-AGORA` | Fora do escopo desta auditoria por C23 — precisa de autorização explícita para qualquer verificação futura. |
