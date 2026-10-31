# D2 — sincronização do `rules-local` (C36) nos 20 projetos e publicação

- **Executado em:** 2026-10-18 13:41–13:55 (Brasília) · **Executor:** DeepSeek Harness
  (deepseek-flash) (local · main) · **Tarefa:** `task-5` (D2 da análise de `C:\fontes`)
- **Versão de destino:** `2026-10-18-988f933e` — **os 20 projetos com `rules-local/` estão nela**
- **Delta do `rules-local` (igual em todos):** `INDEX.md` mudado · `niveis-e-modelos.md` mudado
  (linhas OpenCode/C37 e Qoder/C38) · `herdr.md` novo (C33). Nenhum item removido, nenhum restaurado.
- **Método:** `node rules-local/sessao.mjs` em cada repositório-base, leitura do
  `rules-local/RELATORIO.md`, avaliação dos 3 itens contra o projeto, TASK só quando o projeto
  precisa mudar, um commit por repositório e `git push origin main`. Nos clones, só
  `git pull --ff-only` + conferência (`versão igual`), sem commit.
- **Restrições respeitadas:** nenhum `git add .` (só `rules-local/` + arquivos do quadro);
  `aulasenai/README.md` e `aulasenai/scripts/variaveis.js` não tocados; nada de
  `DEMAIS-PROJETOS-*`; `rules-local/` não editado à mão; sem graphify, navegador ou testes.

## 1. Repositórios-base — versão, avaliação, commit e push

| Projeto (repo-base) | Versão anterior → nova | Itens do relatório | Avaliação do delta | TASK criada | Commit | Push |
|---|---|---|---|---|---|---|
| `aulasenai` | `2026-10-18-ef54a693` → `988f933e` | 2 mudado + 1 adicionado | **exige ajuste** em `niveis-e-modelos.md` (`.claude/rules/niveis.md` com DeepSeek `⛔` em `PESADO` e sem OpenCode/Qoder); `INDEX.md` e `herdr.md` sem ajuste | ✅ `RL-988F933E-NIVEIS-E-MODELOS` | `4654a2d9` | ✅ `1c7f3817..4654a2d9` |
| `dashboard-ai-claude-code-gmail` (base dos dashboards) | `2026-10-18-ef54a693` → `988f933e` | 2 mudado + 1 adicionado | sem ajuste — a skill `.claude/skills/classificar-tarefa/SKILL.md` já está com a matriz de 18/10 12:33 (OpenCode, Qoder, DeepSeek em `PESADO`) | — | `a8a5eb4` | ✅ `4dc440c..a8a5eb4` |
| `gerenciador-de-ia` | `2026-10-18-f4bfe8d8` → `988f933e` | 2 mudado + 1 adicionado | **exige ajuste** em `niveis-e-modelos.md` (tabela "Níveis — quem pega o quê" do `CLAUDE.md` §8, linhas 232–240, só Claude Code e `PESADO` só Opus 5.5+/Fable); `INDEX.md` e `herdr.md` sem ajuste | ✅ `RL-988F933E-NIVEIS-E-MODELOS` | `a8dd795` | ✅ `290d5e4..a8dd795` |
| `PLATAFORMA-ENVIO-CURRICULOS` | `2026-10-18-ef54a693` → `988f933e` | 2 mudado + 1 adicionado | sem ajuste — o `AGENTS.md` (40 linhas) delega níveis à regra global e não tem matriz própria; não usa herdr | — | `eae9a78` | ✅ `c40785f..eae9a78` |
| `template-inicial-tasks-ia` | `2026-10-18-ef54a693` → `988f933e` | 2 mudado + 1 adicionado | sem ajuste — skill `classificar-tarefa` já atualizada em 12:33; sync já feita pelo lead, aqui só commit/push | — | `fa25faa` | ✅ `0320686..fa25faa` |
| `testes-de-frontend` | `2026-10-18-ef54a693` → `988f933e` | 2 mudado + 1 adicionado | sem ajuste — skill `classificar-tarefa` já atualizada; sem matriz própria de níveis; não usa herdr | — | `daa3541` | ✅ `c447b63..daa3541` |
| `testes-effort-padaria` | `2026-10-18-f4bfe8d8` → `988f933e` | 2 mudado + 1 adicionado | sem ajuste — `AGENTS.md` só tem regras do teste de esforço; sem matriz de níveis e sem quadro | — | `d6efa11` | ✅ `5721e22..d6efa11` |
| `REA-APP-CLONES` | `2026-10-18-ef54a693` → `988f933e` | 2 mudado + 1 adicionado | sem ajuste — skill `classificar-tarefa` já atualizada; `herdr.md` (C33) veio do próprio uso do REA (etapa 015) e o projeto já segue a regra | — | `73f5e33` | ⛔ **não empurrado** (sem upstream; 2 commits à frente do remoto) |

Itens do relatório em todos: `INDEX.md` (mudado), `niveis-e-modelos.md` (mudado), `herdr.md`
(adicionado) — 17 iguais, 0 removido, 0 restaurado.

## 2. Avaliação item por item (por que só dois projetos exigiram TASK)

| Item | Avaliação | Motivo |
|---|---|---|
| `INDEX.md` mudado | sem ajuste em todos | É o índice das regras da fonte (acrescenta `herdr.md` e renumera `atividades-e-idioma.md`). Nenhum projeto mantém cópia própria desse índice de regras globais; os índices locais (`.claude/rules/INDEX.md`) são de outra estrutura. |
| `niveis-e-modelos.md` mudado | exige ajuste em `aulasenai` e `gerenciador-de-ia`; sem ajuste nos outros 6 | A mudança é a matriz de ferramentas: linha **OpenCode** (C37) e linha **Qoder** (C38). Nos dashboards/template/testes/REA/PLATAFORMA/effort-padaria a matriz que vale na prática é a skill `classificar-tarefa`, já atualizada em 2026-10-18 12:33 (conferida: linhas 64–73 com OpenCode, Qoder e DeepSeek em `PESADO`). Os dois projetos com matriz própria ficaram defasados. |
| `herdr.md` adicionado | sem ajuste em todos | Nenhum projeto tem regra, script, hook ou configuração de herdr a mudar. `REA-APP-CLONES` já usa herdr conforme a C33 (etapa 015). No `aulasenai` os arquivos locais não versionados `tasks/PROMPT_PARA_O_LIDER.md` e `tasks/STATUS_TAREFAS_ANDAMENTO.md` citam "equipe herdr", mas já seguem o modelo da regra (painel = frente; só o líder usa Git) e não entram no Git. |

## 3. TASKs criadas (C36) — prioridade 🟡 Média, não reservadas nem executadas

| TASK | Projeto | Etapa | Subtarefa | Nível · modelo · effort |
|---|---|---|---|---|
| `RL-988F933E-NIVEIS-E-MODELOS` | `aulasenai` | [`ETAPA-403-cd13692b-AJUSTAR-NIVEIS-E-MODELOS.md`](../../aulasenai/tasks/etapas/ETAPA-403-cd13692b-AJUSTAR-NIVEIS-E-MODELOS.md) | `.1` — Atualizar a matriz de níveis de `.claude/rules/niveis.md` (OpenCode, Qoder e DeepSeek em `PESADO`) | `LEVE` · só Haiku · `effort low` |
| `RL-988F933E-NIVEIS-E-MODELOS` | `gerenciador-de-ia` | [`ETAPA-006-a6d57b86-AJUSTAR-NIVEIS-E-MODELOS.md`](../../gerenciador-de-ia/tasks/etapas/ETAPA-006-a6d57b86-AJUSTAR-NIVEIS-E-MODELOS.md) | `.1` — Atualizar a tabela de níveis do `CLAUDE.md` (§8) (OpenCode, Qoder e DeepSeek em `PESADO`) | `LEVE` · só Haiku · `effort low` |

- Formato conferido nas regras de cada projeto: `aulasenai` (`.claude/rules/tasks/quadro.md` e
  `ciclo-da-task.md`) e `gerenciador-de-ia` (`CLAUDE.md` §8 e `quadro.md` copiado na #1.1). Mãe com
  `— (não reservável)`, subtarefa com linha própria, etapa na tabela "🗂️ Etapas" e `tasks/etapas/`.
- R3.3 conferida: não existia `RL-` nem TASK equivalente no `STATUS.md` nem no `task_complete.md` dos
  dois projetos.

## 4. Grupos de mesmo repositório — clones só puxaram (sem commit)

Mesmo repositório, pastas diferentes: cada clone recebeu `git pull --ff-only` **depois** do push do
repo-base e o script confirmou `versão igual (2026-10-18-988f933e); nada a fazer.`

| Pasta (clone) | Repositório | Pull | Versão |
|---|---|---|---|
| `aulas-senai-CLAUDE-HAIKU` | `aulasenai` | ✅ `1c7f3817..4654a2d9` fast-forward | `988f933e` igual |
| `aulas-senai-CLAUDE-OPUS` | `aulasenai` | ✅ idem | `988f933e` igual |
| `aulas-senai-CLAUDE-OPUS-LIDER` | `aulasenai` | ✅ idem | `988f933e` igual |
| `aulas-senai-CLAUDE-SONNET` | `aulasenai` | ✅ idem | `988f933e` igual |
| `dashboard-ai-claude-code-hotmail` | `dashboard-ai` | ✅ `4dc440c..a8a5eb4` fast-forward | `988f933e` igual |
| `dashboard-ai-claude-code-senai` | `dashboard-ai` | ✅ idem | `988f933e` igual |
| `dashboard-ai-codex` | `dashboard-ai` | ✅ idem | `988f933e` igual |
| `dashboard-ai-deepseek` | `dashboard-ai` | ✅ idem | `988f933e` igual |
| `dashboard-ai-devin` | `dashboard-ai` | ✅ idem | `988f933e` igual |
| `dashboard-ai-gemini` | `dashboard-ai` | ✅ idem | `988f933e` igual |
| `dashboard-ai-kiro-crew` | `dashboard-ai` | ✅ idem | `988f933e` igual |
| `dashboard-ai-qoder` | `dashboard-ai` | ✅ idem | `988f933e` igual |

Estados locais preservados: `qoder` continua com `README.md` e `database/README.md` modificados;
`senai` continua com `laya/`, `dashboard-plataformas-de-ia/`, `.codex/` e `.kiro/` não versionados;
`deepseek` idem (extras ocultos por `.git/info/exclude`). Nenhum commit foi criado nesses clones.

## 5. Observações e pendências para o lead

1. **`REA-APP-CLONES` não foi empurrado** (sem upstream e com trabalho local antigo): commit local
   `73f5e33` sobre `9ee2177`, agora **2 commits à frente** do `main` remoto. O `rules-local` do
   projeto já está em `988f933e` no disco. Quem decidir o push precisa configurar o upstream/`push
   origin main` na hora — não fiz por instrução.
2. **Divergência pré-existente fora do delta:** `dashboard-ai-*`, `template-inicial-tasks-ia`,
   `testes-de-frontend` e `REA-APP-CLONES` têm em `.claude/rules/multiplas-ias.md` a frase
   "`PESADO` é só do Claude Code com Opus 5.5 ou superior, ou Fable" (no gmail idêntica). Isso já
   estava defasado antes desta versão (o C35, que libera o DeepSeek em `PESADO`, entrou na
   `ef54a693`), então **não é ajuste deste delta** e não criei TASK. Se o lead quiser alinhar, são
   ajustes de 1 linha em 4 repositórios (1 TASK `RL` em cada, ou uma só varredura).
3. **Mensagem dos commits:** usei o formato pedido,
   `chore(rules-local): versão <anterior> -> 2026-10-18-988f933e (<n> TASK nova) por DeepSeek
   Harness (deepseek-flash) (local · main)` — acrescentei ` (local · main)` para não divergir da
   convenção dos projetos (`… por <IA> (<frente>)`) e **não** usei `Co-Authored-By`, seguindo o
   precedente dos commits anteriores da mesma frente nestes repositórios.
4. **Nada mais foi commitado** por engano: em cada repositório o `git diff --cached --name-only`
   mostrou só `rules-local/…` (e, no `aulasenai` e no `gerenciador-de-ia`, `tasks/STATUS.md` +
   `tasks/etapas/ETAPA-…`). O `aulasenai/README.md` e o `scripts/variaveis.js` não foram tocados nem
   adicionados. O `gerenciador-de-ia` teve a trava local `tasks/.sessao-ativa` criada e apagada ao
   final (arquivo fora do Git).
