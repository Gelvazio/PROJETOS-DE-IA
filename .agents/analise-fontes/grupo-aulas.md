## Grupo AULAS SENAI

**Coleta:** 2026-10-18, 13:29–13:36 (America/Sao_Paulo, domingo) · auditoria **somente leitura** · raiz `C:\fontes`.
**Escopo:** `aulasenai`, `aulas-senai-CLAUDE-HAIKU`, `aulas-senai-CLAUDE-OPUS`, `aulas-senai-CLAUDE-SONNET`, `aulas-senai-CLAUDE-OPUS-LIDER`.
**Regra C23 respeitada:** nada de `DEMAIS-PROJETOS-*` foi lido, listado, buscado ou citado.

### Tabela-resumo

| Repositório | Propósito | Stack | Branch / remoto | Último commit | Árvore | Tamanho¹ | Rules-local | Quadro (última atividade) |
|---|---|---|---|---|---|---|---|---|
| [aulasenai/](aulasenai/) | Base do sistema de aulas do SENAI: aulas, cursos, turmas, alunos, provas, painel do professor e correção discursiva ([AGENTS.md](aulasenai/AGENTS.md)) | HTML/JS puro + Supabase via CDN; **sem** `package.json` na raiz | `main` · `github.com/Gelvazio/aulasenai` | `1c7f3817` · 2026-10-18 12:33 · `docs(skills): classificar-tarefa…` | **Suja**: 18 entradas (4 M, 4 D, 10 ??) | 1.254,7 MB · 5.733 arq. | `2026-10-18-ef54a693` | 2026-10-17 23:09 |
| [aulas-senai-CLAUDE-HAIKU/](aulas-senai-CLAUDE-HAIKU/) | Clone de trabalho da IA Claude Haiku (nível LEVE)² | idem | idem | idem | Limpa (0) | 421,4 MB · 3.116 arq. | idem | idem |
| [aulas-senai-CLAUDE-OPUS/](aulas-senai-CLAUDE-OPUS/) | Clone de trabalho da IA Claude Opus (nível PESADO)² | idem | idem | idem | Limpa (0) | 421,4 MB · 3.116 arq. | idem | idem |
| [aulas-senai-CLAUDE-SONNET/](aulas-senai-CLAUDE-SONNET/) | Clone de trabalho da IA Claude Sonnet (nível MEDIO)² | idem | idem | idem | Limpa (0) | 421,4 MB · 3.116 arq. | idem | idem |
| [aulas-senai-CLAUDE-OPUS-LIDER/](aulas-senai-CLAUDE-OPUS-LIDER/) | Clone de trabalho da sessão líder/gerenciadora (Opus)² | idem | idem | idem | **Suja**: 2 entradas (?? `.agents/`, `.codex/`) | 421,5 MB · 3.142 arq. | idem | idem |

¹ Soma de arquivos regulares do worktree, **excluindo** `node_modules`, `.git`, `dist` e `build` (enumeração podada). ² Papel inferido do nome da pasta e das skills do projeto; o repositório não declara esse papel.

---

### `aulasenai` — base do projeto

- **Propósito:** sistema de aulas do SENAI; regras em [AGENTS.md](aulasenai/AGENTS.md#L1) (fonte única para todas as IAs, regras por assunto em `.claude/rules/`) e [CLAUDE.md](aulasenai/CLAUDE.md) apenas apontando para ele.
- **Stack:** HTML/CSS/JS vanilla + Supabase. [js/supabase.js](aulasenai/js/supabase.js#L5-L8) fixa `https://hxlvonriearllcmfqeri.supabase.co` e a chave **anon** (pública por desenho), carregando `@supabase/supabase-js@2` por CDN. SQL versionado em [database/](aulasenai/database/) (15+ scripts). Não há `package.json` na raiz.
- **Subprojeto aninhado:** [MATERIAIS/AGENDA_COLABORADOR/AUTOMATIZACAO-WHATSAPP](aulasenai/MATERIAIS/AGENDA_COLABORADOR/AUTOMATIZACAO-WHATSAPP/) é um projeto Node próprio — [package.json](aulasenai/MATERIAIS/AGENDA_COLABORADOR/AUTOMATIZACAO-WHATSAPP/package.json) `automatizacao-whatsapp` v1.0.0, Node ≥ 24, deps `@whiskeysockets/baileys` 7.0.0-rc14, `pino` 10.4.0, `qrcode` 1.5.4, scripts `iniciar`/`verificar`/`formatar`; quadro e `CLAUDE.md` próprios.
- **Entradas:** `index.html` (9.574 B), `login.html`, `painel-professor.html`, `cursos.html`, `turmas.html`, `alunos.html`, `correcao-discursiva.html`, `relatorioAtividades.html`; `GEMINI.md` e `pi.md` na raiz.
- **Git:** `git rev-parse --abbrev-ref HEAD` → `main`; upstream `origin/main` com `rev-list --left-right --count @{u}...HEAD` → `0 0`; HEAD `1c7f3817` (2026-10-18 12:33:33 -0300). `git status --porcelain` → **18** entradas: 4 modificadas (`README.md`, `CONTROLE-HORARIOS.txt`, `CALENDARIO AULAS ITIC.txt`, 1 `.pyc` em `__pycache__`), 4 deletadas (2 `.md` da ITIC, 1 `.docx`, 1 `.lnk`), 10 não rastreadas (`.agents/`, `.codex/`, `.vscode/`, `Python/`, 1 `.docx`, 3 `tasks/PROMPT_*`, 2 `.md` renomeadas); 41 entradas ignoradas.
- **Quadro:** [tasks/STATUS.md](aulasenai/tasks/STATUS.md) — 1.443 linhas / 342 KB, 428 etapas em `tasks/etapas/`, 168 arquivos em `docs/`. 38 frentes listadas: **6 `🔄 Ativa`**, 19 `👀 Aguardando o usuário`, o resto encerrada; **1 tarefa reservada** (`#171`, `nuvem · session_01Lj9hrzu…`, desde 2026-10-14 23:31); **869 linhas de tarefa**, das quais **800 livres** (⬜ com "Em uso por" = `—`). Última atividade registrada: **2026-10-17 23:09** (frente `nuvem · ccr-a26b3c0e-1ljztf`). Pendências do usuário: seção "Pendências (ficou para depois)" com 18 itens + muitos aceites `👀`.
- **Commit × quadro:** último commit que tocou o quadro foi `68f48658` (2026-10-18 02:09); os dois commits seguintes — `05b9878d` (12:08, `rules-local` + `AGENTS.md`) e `1c7f3817` (12:33, skill `classificar-tarefa`) — **não** criaram linha/etapa no quadro (`grep 'rules-local|classificar-tarefa' tasks/STATUS.md` → 0).
- **Rules-local:** [rules-local/VERSAO.md](aulasenai/rules-local/VERSAO.md) → versão **2026-10-18-ef54a693** (fonte `Gelvazio/rules-ai`), 19 regras em `rules-local/regras/` + 4 scripts `.mjs`; `AGENTS.md` atualizado em 05b9878d para rodar `node rules-local/sessao.mjs`.
- **Tamanho e binários:** 1.254,7 MB / 5.733 arquivos. Maiores (todos **ignorados** por `.gitignore`): `GERADOR-AULAS/OFFICE FACIL/WORD.pdf` 393,5 MB, `Excel Básico.pdf` 329,6 MB, `Powerpoint.pdf` 30,1 MB, `graphify-out/graph.json` 27,4 MB, PPTX de `MATERIAIS/` (5–22 MB cada). **Rastreado e pesado:** `.claude/rules/index.html` 27,1 MB (visualizador gerado). `.git` = **2.119,4 MB**.

---

### `aulas-senai-CLAUDE-HAIKU`

- Clone do mesmo projeto para o nível LEVE; sem trabalho local (árvore limpa, 0 entradas).
- HEAD, remoto, `rules-local`, `tasks/STATUS.md` e demais arquivos-chave **idênticos** à base (matriz abaixo); `README.md` mínimo de 2 linhas (35 B), sem as credenciais da base.
- 421,4 MB / 3.116 arquivos — exatamente o conjunto **rastreado** (nenhum extra ignorado) e `.git` de 364,9 MB. Sem `package.json` na raiz.

### `aulas-senai-CLAUDE-OPUS`

- Idêntico ao HAIKU em conteúdo e estado (árvore limpa, 421,4 MB / 3.116 arquivos, `.git` 364,9 MB). Nenhum arquivo divergente da base.

### `aulas-senai-CLAUDE-SONNET`

- Idêntico ao HAIKU em conteúdo e estado (árvore limpa, 421,4 MB / 3.116 arquivos, `.git` 364,9 MB). Nenhum arquivo divergente da base.

### `aulas-senai-CLAUDE-OPUS-LIDER`

- Mesmo commit e mesmos arquivos rastreados; único desvio: **2 não rastreados** (`.agents/` com `skills`, `.codex/` com `agents` e `hooks.json`) → árvore **suja**.
- 421,5 MB / 3.142 arquivos, `.git` 369,1 MB. `README.md` mínimo (35 B).

---

### Divergência entre os clones

SHA256 do **conteúdo** (fim de linha normalizado para LF; os 16 primeiros caracteres):

| Arquivo | `aulasenai` | HAIKU | OPUS | SONNET | OPUS-LIDER |
|---|---|---|---|---|---|
| `CLAUDE.md` | `D61B2FB125AE33ED` | `D61B2FB125AE33ED` | `D61B2FB125AE33ED` | `D61B2FB125AE33ED` | `D61B2FB125AE33ED` |
| `AGENTS.md` | `E235252FF8A0B56F` | `E235252FF8A0B56F` | `E235252FF8A0B56F` | `E235252FF8A0B56F` | `E235252FF8A0B56F` |
| `index.html` | `8C7F25226FEC8CF2` | `8C7F25226FEC8CF2` | `8C7F25226FEC8CF2` | `8C7F25226FEC8CF2` | `8C7F25226FEC8CF2` |
| `package.json` (raiz) | ausente | ausente | ausente | ausente | ausente |
| `rules-local/VERSAO.md` | `3071CD866E6770A4` | `3071CD866E6770A4` | `3071CD866E6770A4` | `3071CD866E6770A4` | `3071CD866E6770A4` |
| `tasks/STATUS.md` | `004ED43F39385483` | `004ED43F39385483` | `004ED43F39385483` | `004ED43F39385483` | `004ED43F39385483` |
| `README.md` | **`68661F7B88EFA477`** | `D016F144450CFBD7` | `D016F144450CFBD7` | `D016F144450CFBD7` | `D016F144450CFBD7` |

**Conclusão:** `aulasenai` é a **base de trabalho** (única com alterações locais e ativos ignorados). Os quatro clones estão no **mesmo commit** `1c7f3817`, com o mesmo `origin/main` e `0 0` à frente/atrás — **nenhum está à frente ou atrás**; são checkouts pristinos do mesmo HEAD. A única divergência de conteúdo é o `README.md` da base (modificado e **não commitado**, 98 B × 35 B, com credenciais de teste). Os tamanhos brutos de `CLAUDE.md`/`index.html` diferem só por EOL (base LF: 829 B/9.574 B; clones CRLF: 847 B/9.726 B) — conteúdo idêntico. Divergência operacional: os commits são os mesmos e já estão no remoto (`0 0`); apenas a base carrega o estado sujo (18 entradas) e ~833 MB de ativos ignorados (PDFs, `Python/` embutido, `graphify-out/`).

---

### Achados do grupo (priorizados)

- **Alto — chave `service_role` do Supabase em texto puro** em [scripts/variaveis.js](aulasenai/scripts/variaveis.js): o arquivo é ignorado (`.gitignore:4`) e **nunca foi commitado** (`git log --all -- scripts/variaveis.js` = 0 commit), mas a chave existe no disco e ignora o RLS; qualquer cópia/backup a expõe.
- **Alto — credenciais de teste no README da base, não commitadas:** [README.md](aulasenai/README.md) (98 B, marcado `M`) contém e-mail e senha de aluno em texto puro; os clones têm o README limpo (35 B). Um `git add .` publica o segredo.
- **Médio — `.git` da base inflado (2.119 MB × 365 MB dos clones):** `git count-objects -vH` avisa `garbage found` para `.git/objects/pack/tmp_pack_AM03nU` e três `tmp_obj_*`; o pack principal tem 1.988 MB. Precisa de `git fsck`/`git gc` (decisão do lead, pois é escrita).
- **Médio — peso e binários:** base 1.254,7 MB/5.733 arquivos contra 421,4 MB/3.116 dos clones; `.claude/rules/index.html` tem **27,1 MB rastreados** e é replicado 5× (~135 MB); PDFs ignorados somam 753 MB e `graphify-out/graph.json` 27,4 MB.
- **Médio — quadro desatualizado face aos commits:** [tasks/STATUS.md](aulasenai/tasks/STATUS.md) não registra os commits de 2026-10-18 12:08 (`rules-local`) e 12:33 (`classificar-tarefa`), contrariando a regra 1 do `AGENTS.md` ("toda tarefa que muda algo vira TASK").
- **Médio — frentes "Ativa" paradas e reserva velha:** 3 das 6 frentes `🔄 Ativa` não são atualizadas desde 10–11/10 (7–8 dias) e `#171` segue reservada desde 2026-10-14 23:31 — risco de quadro "mentir" sobre quem está trabalhando.
- **Baixo — trabalho não commitado na base:** 4 deleções (2 `.md` da ITIC, 1 `.docx`, 1 `.lnk`) e duas `.md` com nomes trocados entre si; commit com `git add .` misturaria essas mudanças. Bytecode versionado (`assets/gerador-indices/__pycache__/gerar_indices.cpython-314.pyc`) também aparece modificado.
- **Baixo — documentação e sobras:** `README.md` da base desatualizado (última mudança commitada em 2026-09-27); subprojeto Node aninhado com quadro/`CLAUDE.md` próprios em `MATERIAIS/`; `.env.teste` presente (token de teste, ignorado); `.agents/`, `.codex/`, `.vscode/` não rastreados na base e `.agents/`/`.codex/` no OPUS-LIDER.

---

### Pendências/ambiguidades

- O papel de cada clone (HAIKU=LEVE, SONNET=MEDIO, OPUS=PESADO, OPUS-LIDER=líder) é **inferência** do nome da pasta + skills existentes; o repositório não o declara em `README`/`AGENTS`.
- Não é possível saber se as frentes `🔄 Ativa` antigas morreram ou apenas não registraram atualização (o quadro é a única fonte).
- Não rodei `git fsck`/`git gc` no pack de 1,9 GB (proibido alterar): a composição exata dos objetos órfãos/temporários ficou não confirmada.
- Links: validei os 15 links do `AGENTS.md` (todos existem) e as 18 pendências do quadro; **não** validei as 428 etapas uma a uma.
- Não abri `.claude/rules/index.html` (27 MB, gerado) nem os PDFs/PPTX grandes; classificações de tamanho vêm só dos metadados.
- Tamanhos medidos no worktree (arquivos regulares); não incluem `.git`, que foi medido à parte.
