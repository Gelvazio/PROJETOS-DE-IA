---
name: gerenciador-de-tarefas
description: Líder das pastas por modelo do projeto Aulas SENAI. Da pasta C:\fontes\aulas-senai-Codex-OPUS-LIDER (sem tarefa própria), lê o quadro, escolhe a subtarefa livre de cada nível e abre uma sessão do Codex na pasta do modelo certo (HAIKU = LEVE, SONNET = MEDIO, OPUS = PESADO) com o brief pronto; quando as sessões param, confere cada entrega com o verify e dispara a próxima rodada. Use quando o usuário pedir "gerencie as tarefas", "dispare os agentes", "rode as pastas", "distribua as tarefas" ou "/gerenciador-de-tarefas". Só para o Codex com Opus 5.5 ou superior, ou Fable, aberto na pasta do líder.
---

# Gerenciador de tarefas (pastas por modelo)

Origem: tarefa #251 do `aulasenai` (`tasks/etapas/ETAPA-378-780651a2-SKILL-GERENCIADOR-DE-TAREFAS.md`).
Fonte única: `C:\fontes\.Codex\skills\gerenciador-de-tarefas\`. O
`~/.Codex/skills/gerenciador-de-tarefas` é uma junção para cá (sessões abertas nos clones não
enxergam `C:\fontes\.Codex\skills`: a busca de skills para na raiz do repositório).

As regras do projeto valem inteiras (`AGENTS.md` → `.Codex/rules/`). O modo "pastas por modelo"
e as exceções dele estão em `.Codex/rules/niveis.md` (#251.3) — **só usar esta skill depois que
a #251.3 estiver na `main`**. Este modo é diferente do `liderar-equipe` (lá o líder reserva e
commita; aqui cada pasta reserva e commita a própria subtarefa).

## Pastas

| Papel | Pasta | Frente | Coluna Modelo que pega | `model` | `effort` |
|---|---|---|---|---|---|
| **Líder** | `C:\fontes\aulas-senai-Codex-OPUS-LIDER` | `local · main · lider` | **nenhuma** — só dispara e confere | (esta sessão) | — |
| Trabalhador | `C:\fontes\aulas-senai-Codex-HAIKU` | `local · main · haiku` | `LEVE · só Haiku` | `Codex-haiku-5-5` | `low` |
| Trabalhador | `C:\fontes\aulas-senai-Codex-SONNET` | `local · main · sonnet` | `MEDIO · só Sonnet` | `Codex-sonnet-5-5` | `medium` |
| Trabalhador | `C:\fontes\aulas-senai-Codex-OPUS` | `local · main · opus` | `PESADO · só Opus 5.5+ ou Fable` | `Codex-opus-5-5` | `high` |

- Cada pasta é um clone próprio do `Gelvazio/aulasenai`, sempre na `main` (sem worktree, sem
  branch), com índice do Git próprio: as pastas só se encontram no remoto (`pull --rebase`).
- **1 subtarefa por pasta por vez.** Uma sessão **nova** por subtarefa.
- Banco (SQL, RLS, seeds, consultas) é `PESADO`: só a pasta OPUS. HAIKU e SONNET contam como
  "frente sem banco" (exceção registrada em `seeds.md`).

## Quem faz o quê

| | Líder | Trabalhador |
|---|---|---|
| Escolher e disparar a subtarefa | ✅ | — |
| Reservar ("Em uso por") | ⛔ nunca | ✅ em nome próprio |
| Executar a subtarefa | ⛔ nunca (nem 1 linha) | ✅ só a que recebeu |
| Commit + push da subtarefa | — | ✅ na própria pasta |
| `verify` da entrega e coluna **Verificado** | ✅ | — |
| Classificar linha sem nível | ✅ (agente `classificador-tarefas`) | — |
| Criar subtarefa nova para corrigir entrega | ✅ (para o modelo certo) | — |
| Liberar reserva de outra frente | ⛔ só o usuário | ⛔ |

O líder não abre TASK para si nem reserva nada; o `verify` que ele faz a cada entrega não abre
TASK (exceção em `verificacao.md`). A frente dele fica com a situação `🧭 Líder (sem reserva)`.

## 1. Preparar (no começo de cada conversa do líder)

1. Esta sessão está em `C:\fontes\aulas-senai-Codex-OPUS-LIDER` e é Opus 5.5+ ou Fable? Senão,
   parar e avisar. O esforço desta sessão é `high` ou mais? Senão, avisar o usuário para subir
   (o `effort` da sessão disparada não pode passar o do líder) — a pasta OPUS só é disparada com
   `high`.
2. O pedido do usuário cita as pastas (ex.: "dispare nas pastas HAIKU, SONNET e OPUS")? Se não,
   confirmar numa linha antes do 1º disparo: "Disparar nas pastas HAIKU, SONNET e OPUS?". ⛔ Nunca
   abrir sessão sem `cwd` (ela abriria na pasta do líder).
3. Sincronizar: `git fetch --all --prune` + `git pull --rebase origin main` nesta pasta, e
   `git -C C:\fontes\rules-ai pull --rebase` (só o líder mexe no Git do `rules-ai`; as pastas só
   leem). `git status --porcelain` desta pasta tem de estar vazio — senão, parar e avisar.
4. Conferir o quadro: `tasks/task_complete.md` começa com `# ✅ Concluídas` e tem o cabeçalho
   `| Tarefa | Título |`; `tasks/STATUS.md` sem marca de conflito (`<<<<<<<`). Quebrado → parar
   e avisar (não disparar sobre quadro estragado).
5. Linha da frente `local · main · lider` em "🧭 Frentes": criar ou atualizar com "só dispara e
   confere", situação `🧭 Líder (sem reserva)` e a data e hora. Commit + push (modelo de commit
   no fim).
6. Cada pasta trabalhadora (só leitura; pasta que falhar não recebe disparo e o usuário é avisado):
   - `git -C <pasta> rev-parse --abbrev-ref HEAD` = `main`; `remote get-url origin` termina em
     `Gelvazio/aulasenai.git`;
   - pasta **confiável**: em `~/.Codex.json`, `projects["C:/fontes/<pasta>"].hasTrustDialogAccepted`
     = `true`. Se não, o usuário abre a pasta uma vez no Codex e aceita (sem isso o app não
     inicia a sessão e as permissões do projeto são ignoradas). ⛔ O líder não edita o
     `~/.Codex.json`;
   - `scripts/variaveis.js` e `.Codex/settings.local.json` existem? Se faltar, avisar (são chaves
     e configuração pessoal: o usuário copia de `C:\fontes\aulasenai`); subtarefa que dependa de
     `variaveis.js` não vai para essa pasta.
7. Data e hora de Brasília: `powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd HH:mm'"`.

## 2. Escolher a rodada

Depois de sincronizar, ler `tasks/STATUS.md`, `tasks/task_complete.md`, `tasks/RECADOS.md` e
`database/SEEDS-APLICADOS.md`.

**Linhas sem nível** (`⚠️ sem nível`): mandar ao agente `classificador-tarefas` (grava
`- **Nível:**` nas etapas), conferir, preencher a coluna Modelo e commitar antes da rodada. Se não
der, listar essas linhas no relato ao usuário ("paradas por falta de nível").

Para **cada pasta trabalhadora**:

1. **Ocupada** (não dispara) se valer qualquer um:
   - alguma linha de "📌 Tarefas" tem a frente da pasta em "Em uso por", **seja qual for o
     status** (🔄, 👀…) — reserva antiga: relatar ao usuário; só ele libera;
   - há sessão (`list_sessions`, sem filtro) com nome `haiku-…`/`sonnet-…`/`opus-…` da pasta ainda
     trabalhando ou esperando o usuário;
   - `git -C <pasta> status --porcelain` não vazio, `git -C <pasta> status -sb` com "ahead"
     (commit sem push) ou existe `<pasta>/.git/rebase-merge` ou `rebase-apply`.
2. **Candidatas** — subtarefa (nunca a mãe) com:
   - coluna **Modelo** exatamente a da pasta;
   - **Status exatamente `⬜ Pendente`** (sem texto depois: "⬜ Pendente — aguardar…" não vale) e
     **Em uso por** = `—`;
   - todas as **dependências** concluídas (linha no `task_complete.md` com ✅);
   - seção da subtarefa na etapa com o que fazer (Descrição/Critérios, ou o Pedido/Escopo da
     etapa) e **Próximo passo que não pede detalhe nem decisão do usuário** — se pedir, vai para
     o relato ao usuário;
   - mãe **grande** → plano com "sim" registrado nas Decisões da etapa;
   - não é aceite do usuário; 🟢 Baixa só se o usuário pediu nesta conversa.
3. **Ordem:** 🔴 → 🟠 → 🟡 (→ 🟢); empate = ordem do quadro.
4. **Sem colisão:** na mesma rodada, nunca duas subtarefas da **mesma mãe** nem duas cujas
   seções citem o **mesmo arquivo**; a segunda fica para a próxima rodada.
5. **Seeds:** com seed `PENDENTE`/`APLICADO`, a pasta OPUS faz o ciclo antes da subtarefa dela (o
   brief manda). Sem candidata `PESADO` e com seed pendente → relatar ao usuário (não existe
   disparo "só de seeds" sem linha no quadro).
6. Pasta sem candidata fica parada nesta rodada (1 linha no relato).

## 3. Disparar

Para cada pasta escolhida, preencher `modelo-de-brief.md` (desta pasta da skill) e abrir:

```
start_session({
  initiation: "user_asked",
  context: "fresh",
  cwd: "<pasta do trabalhador>",
  use_worktree: false,                 // a própria pasta, sem worktree
  model: "<model da tabela>",
  effort: "<effort da tabela>",
  name: "<haiku|sonnet|opus>-<número com - no lugar do .>",   // ex.: sonnet-249-1 (≤ 24)
  title: "<código> — <título curto>",  // < 60 caracteres
  prompt: "<brief preenchido>",
  background: "<pedido e objetivo da tarefa-mãe, 2 ou 3 frases>",
  wake_when_done: true
})
```

- Sem `permission_mode`: herda o desta sessão (no modo padrão, cada sessão pede as permissões
  dela ao usuário, na própria sessão).
- Chamada recusada → avisar o usuário com o motivo; ⛔ nunca repetir sem `cwd`, sem `model` ou
  com `effort` menor. Sem `start_session` (CLI) → ver "Modo manual".
- Depois de disparar: `list_sessions` **uma vez** para confirmar que cada sessão iniciou; dizer
  ao usuário, em 1 linha por pasta, o que foi para onde (com o link da sessão) e **encerrar a
  vez**. ⛔ Não ficar consultando.
- O app retoma o líder quando **todas** as sessões disparadas pararam (e ele está ocioso). Se o
  usuário escrever antes, tratar só as sessões que já pararam (uma consulta, sem laço).

## 4. Quando as sessões param

O aviso do app traz os primeiros 400 caracteres de cada sessão (o recap e depois a mensagem
final; o brief manda começar com `{CODIGO}: ENTREGUE | NÃO RESERVADA | BLOQUEADA — motivo`). É
pista, não prova; para ler a sessão inteira: `get_session`/`list_events`. Para cada sessão:

1. Sincronizar esta pasta (`fetch` + `pull --rebase`).
2. **Entregue** (linha no `task_complete.md` com ✅): `verify` só dessa subtarefa
   (`.Codex/rules/tasks/verificacao.md`, parte 2):
   - commit da entrega existe (`git log --oneline --grep "<código>"`) e traz os arquivos e o quadro
     (`git show --stat <hash>`);
   - `git show --numstat <hash> -- tasks/task_complete.md` com **0 linhas removidas** e o cabeçalho
     ainda no arquivo (senão é ❌ e o quadro é restaurado antes de tudo);
   - os arquivos têm a mudança pedida (leitura, `grep`); `node --check` nos `.js`,
     `python -m py_compile` nos `.py`, JSON válido; banco só por consulta de leitura;
   - a seção da etapa tem Entrega e Verificação; a linha saiu do `STATUS.md`.
   Resultado na etapa, seção `### Verificação (verify, <data hora>)`:
   - **✅ Feito** → `true` na coluna **Verificado** da linha (no `task_complete.md`);
   - **⚠️ Parcial / ❌ Não feito** → Verificado fica `—`; o que falta vira **subtarefa nova** da
     mesma mãe: linha logo abaixo da mãe (prioridade da mãe, Modelo do nível, Depende de = código
     verificado, Em uso por `—`, `⬜ Pendente`) + seção na etapa com `Nível`, `Modelo`, Descrição e
     Critérios. Se a mãe já estava no `task_complete.md`, ela **volta** para o `STATUS.md` (sem ✅)
     no mesmo commit. ⛔ O líder não corrige.
   Depois: `python scripts/regras/gerar_visualizador_regras.py`; commit (quadro, etapa e
   `.Codex/rules/index.html`) + push.
3. **Não reservada / bloqueada / 👀:** relatar ao usuário o motivo (da etapa ou da sessão).
4. **Parou no meio** (reserva da pasta sem commit de entrega, ou pasta suja): relatar e deixar a
   pasta parada; quem libera é o usuário.
5. Depois de tratar todas: nova rodada (passo 2). As sessões antigas ficam na barra lateral;
   arquivar só se o usuário pedir.

## 5. Parar

Parar e avisar quando nenhuma pasta tem candidata, quando o usuário pedir, quando a próxima
depende de decisão dele, ou quando a mesma subtarefa falhou duas vezes (anotar na etapa).
Ao parar: linha da frente `local · main · lider` → `⏹️ Encerrada` (ou `👀 Aguardando o usuário`),
commit + push. Relato final: entregues e verificadas, paradas e por quê, o que precisa do usuário.

## Modo manual (sem `start_session`)

Para cada pasta escolhida, mostrar ao usuário o brief preenchido e o passo a passo: abrir um
terminal na pasta, `Codex --model <haiku | sonnet | opus>`, colar o brief. O resto é igual.

## Commits do líder

Só os arquivos do quadro que ele mudou, sem `git add .`:

```
git add <arquivos>
git diff --cached --name-only
git commit -m "<tipo>(quadro): <descrição> por Codex (<modelo>) (local · main · lider)" -m "Co-Authored-By: Codex <modelo> <noreply@anthropic.com>" -- <arquivos>
git pull --rebase origin main
git push origin main
```

Conflito no rebase: no quadro, manter as linhas das duas frentes; `.Codex/rules/index.html` →
rodar o gerador de novo; `git add <arquivos>`; `git -c core.editor=true rebase --continue`.

## Proibido

- ⛔ O líder executar, reservar ou "dar um jeito" em subtarefa — mesmo de 1 linha.
- ⛔ Disparar para pasta de outro nível ou mudar o nível para caber numa pasta livre.
- ⛔ Mais de uma subtarefa por pasta; duas da mesma mãe ou do mesmo arquivo na mesma rodada.
- ⛔ Worktree, branch, `git merge`, `git push --force`, `git add .`; regravar o
  `task_complete.md` inteiro.
- ⛔ Consultar sessões em laço; abrir navegador ou servidor (o que só a tela mostra fica
  "conferir na tela" e o usuário confere).
