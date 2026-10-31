## Etapa 009-a0c1d676 — GERENCIADOR-GLOBAL: gerenciador centralizado que chama as tarefas livres de cada modelo

**Tarefa:** GERENCIADOR-GLOBAL · **Pedido em:** 2026-10-17 15:55 · **Criada por:** Claude Code (Haiku 5.5) (local · main)
**Pedido:** "crie esta tarefa de forma global, e, rules-ai, pra todos os projetos de IA poder ter um GERENCIADOR CENTRALIZADO, QUE VAI CHAMANDO AUTOMATIVAMENTE AS TAREFAS LIVRE DE CADA MODELO DE IA"
**Objetivo:** ter um gerenciador central, em `rules-ai`, que olha os quadros de todos os projetos de IA e chama, sem intervenção, a próxima tarefa livre de cada modelo, respeitando a regra de níveis (C22) e o gatilho `;` (C24).

### Escopo

- **Entra:** regra global do gerenciador; um script central em `rules-ai/scripts/`; leitura do quadro de cada projeto pelo Git; disparo de sessões por modelo; vigilância periódica; registro de cada disparo; conferência sem navegador.
- **Não entra (nesta etapa):** escrever em quadros de outros projetos sem o `;` da própria IA; mudar a tabela de níveis (`niveis-e-modelos.md`); substituir o líder `gerenciador-de-tarefas` das `aulas-senai-*` sem decisão do usuário (ver Decisões); login, banco ou chave de API no script.

### Riscos

| Risco | Plano B |
|---|---|
| Sessão disparada sem supervisão mexe no projeto errado ou em loop | Lista fechada de projetos em arquivo de configuração; limite de disparos por hora; trava de execução (uma por vez); parada com um arquivo `PARAR`. |
| Gasto de tokens sem controle | Limite de disparos e de sessões ativas configurável; modo "só ver" como padrão. |
| Duas sessões pegam a mesma subtarefa | Não é o gerenciador que reserva: a própria sessão reserva pelo `frentes-e-reserva.md`. Se a reserva falhar, a sessão desiste e avisa. |
| Outro modelo pegar tarefa que não é dele | Cada disparo leva o modelo fixo (`--model`) e a regra C22 continua valendo dentro da sessão. |
| Conflito com o líder `gerenciador-de-tarefas` (aulas-senai) | Decisão do usuário antes da construção (ver Decisões). |
| Sessão que cai no meio | Retomar pelo quadro (ciclo-da-task.md); o gerenciador não guarda estado próprio além de um registro de disparos. |

### Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-17 13:34 | GERENCIADOR-GLOBAL.2 entregue: regra `regras/gerenciador-centralizado.md` (C28). O modo `disparar` fica condicionado a ordem explícita do usuário, a ordem vigente é a pausa de 13:30 (pedido do usuário); o automático de 16:12 fica para reativação | Claude Code (Haiku 5.5) | Conferência da .2; conflito pendente de decisão do usuário |
 que valem as regras de 16:12; abre a subtarefa .8 (Opus) só para conferir a decisão contra o plano de 13:01 | Gelvazio | "vale as regras daqui, abra uma sub-task em GERENCIADOR-GLOBAL nova so pra conferir isso e atribua ao CLAUDE OPUS" |
| 2026-10-17 13:30 | (a) `dashboard-ai-*` **entram**: as 9 pastas voltaram, todas com `tasks/STATUS.md` e Git; (b) **disparo automático em pausa** para todos os modelos, até nova ordem: o gerenciador só lê e avisa (modo `ver`); a `.4` fica ⛔ pausada; (c) o conflito de pasta única (`rules-ai` e `gerenciador-de-ia`) vai para uma tarefa nova (`PASTA-UNICA-GLOBAL`, etapa 011) | Gelvazio | "dashboard-ai-*  ja voltou;nao faca nenhum disparo automatico,deixe em pausa isso de automatico por enquanto;abra uma nova tarefa pra resolver conflitos de rules-ai e gerenciador-de-ia" |
| 2026-10-17 16:12 | **Respostas do usuário (supersedem a de 13:01 nos pontos em que divergem):** (1) projetos: `aulasenai`, `gerenciador-de-ia`, `dashboard-ai-*`, `aulasenai-*` (as `aulas-senai-*`) e `rules-ai`; (2) disparo **automático** para Haiku e Sonnet; (3) a cada **30 s**, projeto por projeto, vê qual modelo está ocioso e manda pegar a próxima tarefa livre; (4) só Claude Code; (5) **mescla** as regras com o `gerenciador-de-tarefas` e atribui a tarefa ao **Opus** (ver .7). Revoga o "só avisar até o aceite .6" e a exclusão das `aulas-senai-*` do plano de 13:01 | Gelvazio | "1-aulasenai,gerenciador-de-ia,dashboasr-ai-*,aulasenai-*,rules-ai;2-automatico para Haiku e Sonnet;3-a cada 30 segundos,vai de projeto em projeto,lendo o quadro de tasks e vendo qual modelo esta ocioso,e neste caso,ja manda este modelo pegar a proxima task disponivel;4-so claude;5-mescla as regras, atribua ao claude opus" |
| 2026-10-17 15:55 | Tarefa grande: só o plano e a registro no quadro agora. Execução depende de aprovação explícita. | Claude Code (Haiku 5.5) | Estrutura nova e disparo automático de sessões (regra de tarefa grande). |
| 2026-10-17 15:55 | Pendente de decisão do usuário: o `gerenciador-de-tarefas` das `aulas-senai-*` (skill já existente) será substituído, ampliado ou convivirá com este gerenciador? | — | Evitar dois gerenciadores disputando as mesmas pastas. |
| 2026-10-17 15:55 | Pendente de decisão do usuário: rodar sem supervisão (com `;` automático) ou só avisar e o usuário dispara? | — | Define o nível de risco aceito e o consumo de tokens. |
| 2026-10-17 13:01 | **Plano aprovado.** (1) Projetos: só `rules-ai` e `aulasenai` (`gerenciador-de-ia` não existe); (2) começa **só avisando**, disparo automático só depois do aceite `.6`; (3) ciclo a cada **1 minuto**; modelo **sem tarefa rodando** é verificado a cada **20 segundos** até chegar tarefa para ele; (4) só Claude Code; (5) convive com o `gerenciador-de-tarefas`: o central fica **fora** das pastas `aulas-senai-*` | Gelvazio | "1-sim;2-sim;3-intervalo a cada minuto, se o modelo nao tem tarefa rodando,fique verificando a cada 20 segundos se nao chegou tarefas pra ele;4-sim;5-sim" (respostas às recomendações) |
| 2026-10-17 13:01 | Hora "15:55" das linhas acima foi gravada com relógio adiantado (a etapa foi criada antes das 13:00); mantida como histórico | Claude Code (Opus 5.5) | Histórico não se apaga |

### Perguntas que precisam de resposta antes de executar

1. Lista de projetos que entram (por padrão: `aulasenai`, `gerenciador-de-ia`, `dashboard-ai-*`, `rules-ai`)?
2. Disparo automático ou só aviso? Se automático, quais modelos (padrão: só Haiku, LEVE)?
3. Intervalo de verificação e limite de disparos por hora?
4. Quais CLIs entram nesta primeira versão (padrão: só Claude Code)?
5. O gerenciador substitui o `gerenciador-de-tarefas` das `aulas-senai-*`, convive com ele, ou fica de fora dessas pastas?

### GERENCIADOR-GLOBAL.1 — Desenho e prova de conceito (aprovação antes)

**Próximo passo:** — (entregue).

- **Nível:** PESADO — arquitetura e disparo de sessões, mais de 3 arquivos ligados.
- **Modelo:** só Opus 5.5+ ou Fable — nunca outro.
- **Descrição:** desenhar o script central, a lista de projetos, o formato de disparo por modelo, os limites, a trava e o registro de disparos.
- **Critérios de Aceitação:** desenho escrito nesta seção; decisões das perguntas registradas; nenhum arquivo de projeto alterado.
- **Entrega (2026-10-17 13:10, Claude Code Opus 5.5):** prova de conceito e desenho abaixo.
- **Verificação:** `claude --help` (2.1.302) tem `-p/--print`, `--model`, `--effort`,
- **JEV-AI-SUGGESTION:** NAO
  `--output-format json`, `--max-budget-usd` e `--permission-mode`; prova de conceito numa pasta
  temporária: `claude -p "<pergunta>" --model haiku --output-format json` → saída 0, 5,4 s,
  `is_error: false`, `modelUsage` = `claude-haiku-5-5`, US$ 0,006. Nenhum quadro alterado.
- **Anotação:** o disparo com `;` depende da regra C24 (`GATILHO-GLOBAL`, ainda ⬜): ela tem de
  estar ✅ e sincronizada antes da `.4`.

#### Desenho

| Peça | Decisão |
|---|---|
| Script | `scripts/gerenciador.mjs` (Node, como o `sincronizar.mjs`), sem dependências externas |
| Configuração | `scripts/gerenciador.config.json`: projetos (`rules-ai`, `aulasenai`), modelos (`haiku`, `sonnet`, `opus`), `modo` (`ver` padrão · `disparar`), `cicloSegundos: 60`, `ociosoSegundos: 20`, `maxSessoesPorModelo: 1`, `maxBudgetUsd` por sessão |
| Pastas fora | `aulas-senai-*` (têm o líder `gerenciador-de-tarefas`), `DEMAIS-PROJETOS-*` (C20, C23) |
| Leitura do quadro | `git fetch` + `git show origin/main:tasks/STATUS.md` (nunca a pasta de trabalho); acha a tabela de "📌 Tarefas" pelos **nomes** das colunas (`Tarefa`, `Modelo`, `Depende de`, `Status`, `Em uso por`) |
| Subtarefa livre | `Status` começa com `⬜`; `Em uso por` = `—`; `Modelo` com "só Haiku/Sonnet/Opus/Fable"; toda dependência ✅ (no `STATUS.md` ou no `task_complete.md`). Fica de fora: "sem nível", `Usuário`, mãe (não reservável), `(nuvem)` |
| Modelo ocupado | Linha `🔄` com o nome do modelo em `Em uso por`, **ou** processo vivo aberto pelo gerenciador (PID no registro) |
| Ritmo | Uma volta a cada **20 s**; modelo **ocioso** é olhado em toda volta (20 s); modelo **ocupado**, a cada 3 voltas (**60 s**), só para ver se terminou |
| Modo `ver` (padrão até o `.6`) | Imprime o quadro de livres por projeto e modelo (tabela, C27) e avisa quando chega tarefa nova para um modelo ocioso; não abre sessão |
| Modo `disparar` (só depois do `.6`) | Para cada modelo ocioso com livre: `claude -p ";" --model <modelo> --effort <do nível> --output-format json --max-budget-usd <limite>` na pasta do projeto; a própria sessão reserva (C24 + `frentes-e-reserva.md`) |
| Trava | `scripts/.gerenciador.lock` com o PID: uma instância só; lock de PID morto é retomado |
| Parar | Arquivo `scripts/PARAR` → termina na próxima volta, sem abrir sessão |
| Registro | `scripts/gerenciador.log.jsonl` (fora do Git): hora, projeto, modelo, subtarefa vista, disparo, PID, saída, custo |
| Vigilância (`.5`) | O próprio laço de 20 s; o Agendador do Windows só **inicia** o script no logon (o Agendador não repete a menos de 1 min) |

### GERENCIADOR-GLOBAL.2 — Regra global do gerenciador

**Próximo passo:** nenhum. Entregue em 2026-10-17 13:34.

- **Nível:** LEVE — só `.md`.
- **Modelo:** só Haiku — nunca outro.
- **Descrição:** regra de quem pode ser disparado, quando, com que limites e como parar.
- **Critérios de Aceitação:** regra escrita e linkada no registro de decisões; sincronizador rodado só com autorização.
- **Entrega:** commit `docs(regras): regra do gerenciador centralizado (C28)` (`regras/gerenciador-centralizado.md`; C28 no `CONFLITOS.md`; registro na etapa) · **Verificação:** conferência por leitura do texto contra as decisões de 13:30 e 16:12. **Ordem vigente:** pausa do disparo automático (pedido do usuário, registrado em 13:30). O automático só para Haiku e Sonnet (16:12) fica para quando o usuário reativar; a regra já escreve o modo `ver` como padrão. **Anotação:** sincronizador não rodado (não autorizado nesta subtarefa).
- **JEV-AI-SUGGESTION:** NAO

### GERENCIADOR-GLOBAL.3 — Script central de leitura do quadro

**Próximo passo:** ✅ entregue em 2026-10-23; a .4 (disparo) é do Opus e fica parada.

- **Nível:** PESADO — mais de 3 arquivos ligados e lógica de leitura do quadro de vários projetos.
- **Modelo:** só Sonnet — nunca outro. (trocado do Opus em 2026-10-23, RECLASSIFICAR-PESADO-OPUS.2)
- **Descrição:** imprime, para cada projeto e modelo, as subtarefas livres e com dependências prontas.
- **Critérios de Aceitação:** a saída bate com a conferência manual do quadro de cada projeto; nenhum quadro é escrito.
- **Entrega (2026-10-23, Claude Code Sonnet 5.5 · agente; sem commit, o Haiku confere e commita):**
  `scripts/gerenciador.mjs` (CLI, modo `ver`), `scripts/gerenciador.config.json` (projetos,
  modelos, matriz nível→modelo, política de dependência) e módulos em `scripts/gerenciador/`:
  `quadro.mjs` (lê a tabela pelos NOMES das colunas, calcula livres/ocupação; funções puras),
  `repositorio.mjs` (`git fetch origin main` + `git show origin/main:<arquivo>`; só leitura) e
  `saida.mjs` (tabelas em texto puro). Opções: `--projeto`, `--sem-fetch`, `--json`, `--limite`,
  `--tudo`, `--config`; o modo `disparar` é recusado (código 2). Sem `PARAR` nem trava de
  instância: o plano da .1 os põe no laço/disparo (.4 e .5), não na leitura de uma volta.
- **Verificação:** `node --check` limpo nos 4 `.mjs`; `node scripts/gerenciador.mjs` leu
  `rules-ai` (d6e1a7c), `aulasenai` (26791e98) e `DASHBOARD-AI-PRINCIPAL` (5cd83ea). Conferência
  manual independente do `origin/main`: `rules-ai` livres Sonnet 1 (DASHBOARD-AGENTES.1), Opus 1 e
  Fable 1 (GERENCIADOR-GLOBAL.7), Haiku 0 — igual à saída; `DASHBOARD-AI-PRINCIPAL` Haiku 2
  (RL-4F19D945-NIVEIS-E-MODELOS.1, JEV-NAO.1) e Sonnet 3 (SUB-45.18, SUB-62.1, SUB-62.2) — igual;
  `aulasenai` (script próprio de contagem, outra lógica) Haiku 5, Sonnet 66, Opus 67 — igual
  (1481 linhas lidas nos dois). `--modo disparar` sai com 2; `--projeto zzz` sai com 1. Nenhum
  quadro escrito (só `git fetch`/`git show`; nenhum arquivo de projeto alterado).
- **Anotação:** (a) `gerenciador-de-ia` e `aulas-senai-*` não existem hoje em `C:\fontes`: saem
  como `ausente` no relatório, sem erro; `dashboard-ai-*` casa `DASHBOARD-AI-PRINCIPAL`; clones do
  mesmo `origin` são lidos uma vez (`duplicado`). (b) Dependência que não está nem no `STATUS.md`
  nem no `task_complete.md` (ex.: `GERENCIADOR-GLOBAL.1`, `#33`) é tratada como pronta
  (`dependenciaAusente: "pronta"` na config; `"bloqueia"` inverte) e aparece na coluna Obs.
  (c) Projeto sem coluna Modelo (dashboard) tem o modelo derivado do nível pela matriz da config
  (`LEVE`→Haiku, `MEDIO`→Sonnet, `PESADO`→Sonnet/Opus/Fable), marcado "modelo pelo nível". (d)
  Modelo ocupado = linha `🔄` cujo primeiro modelo citado em "Em uso por" é ele (não conta
  "líder X"); a checagem de processo vivo é da .4. (e) Fora da lista: `Usuário`, "sem nível",
  mãe, `(nuvem)`, modelos não configurados (DeepSeek, Gemini).
- **JEV-AI-SUGGESTION:** NAO

### GERENCIADOR-GLOBAL.4 — Disparo de sessões por modelo

**Próximo passo:** depois do .3 e do aceite do .1, acrescentar o disparo: para cada modelo com tarefa livre, abrir a sessão na pasta do projeto com o `;` e o modelo fixo, respeitando limites e a trava.

- **Nível:** PESADO — dispara sessões que alteram projetos sem supervisão.
- **Modelo:** só Opus 5.5+ ou Fable — nunca outro.
- **Descrição:** disparo, registro de cada disparo, limite por hora, arquivo `PARAR` que interrompe.
- **Critérios de Aceitação:** em modo "só ver", nenhum disparo; com o limite em 1, no máximo um disparo por hora; o registro mostra cada disparo.
- **Entrega:** — · **Verificação:** — · **Anotação:** —
- **JEV-AI-SUGGESTION:** NAO

### GERENCIADOR-GLOBAL.5 — Vigilância periódica

**Próximo passo:** depois do .4, prender o gerenciador a uma execução periódica (agendador do Windows ou loop), com o intervalo aprovado no .1.

- **Nível:** MEDIO — código com lógica em 1 a 3 arquivos.
- **Modelo:** só Sonnet — nunca outro.
- **Descrição:** execução no intervalo aprovado, sem duplicar execuções.
- **Critérios de Aceitação:** uma execução por intervalo; nenhuma execução paralela.
- **Entrega:** — · **Verificação:** — · **Anotação:** —
- **JEV-AI-SUGGESTION:** NAO

### GERENCIADOR-GLOBAL.6 — Aceite do usuário

**Próximo passo:** o usuário confere a saída do gerenciador em "só ver" e, se aprovado, liga o disparo.

- **Nível:** Usuário.
- **Modelo:** Usuário — nunca outro.
- **Descrição:** aceite e liberação do disparo automático.
- **Critérios de Aceitação:** o usuário responde "sim" com a configuração escolhida.
- **Entrega:** — · **Verificação:** — · **Anotação:** —
- **JEV-AI-SUGGESTION:** NAO

### GERENCIADOR-GLOBAL.8 — Conferir as respostas de 16:12

**Próximo passo:** — (entregue).

- **Nível:** PESADO — conferência de escopo de um gerenciador que dispara sessões.
- **Modelo:** só Opus 5.5+ ou Fable — nunca outro.
- **Descrição:** conferir ponto a ponto as cinco respostas de 16:12 (projetos, automático só para Haiku e Sonnet, ciclo de 30 s, só Claude Code, mesclagem atribuída ao Opus) contra o plano de 13:01 e o desenho da .1; listar o que conflita e o que a .7 precisa ajustar.
- **Critérios de Aceitação:** lista de cada resposta com "vale", "revogada" ou "pendente de decisão"; nenhuma sessão disparada.
- **Entrega (2026-10-17 13:22, Claude Code Opus 5.5):** conferência abaixo.
- **Verificação:** `Test-Path` e `git remote` nas pastas de `C:\fontes` (sem entrar em `DEMAIS-PROJETOS-*`); leitura do plano de 13:01, do desenho da `.1` e da `.7`. Nenhuma sessão disparada, nenhum outro projeto alterado.
- **Anotação:** a afirmação "`gerenciador-de-ia` não existe" (plano de 13:01) estava **errada**: a pasta existe, só falta no mapa `C:\fontes\CLAUDE.md`.
- **JEV-AI-SUGGESTION:** NAO

#### Conferência das respostas de 16:12

| Tarefa | Ponto | Resposta de 16:12 | Situação | O que a `.7` ajusta |
|---|---|---|---|---|
| `GERENCIADOR-GLOBAL.8` | 1a. Projetos `aulasenai`, `rules-ai`, `gerenciador-de-ia` | Entram | ✅ Vale | Os 3 têm `tasks/STATUS.md` e Git na `main` |
| `GERENCIADOR-GLOBAL.8` | 1b. `aulasenai-*` | Entram | ✅ Vale (lido como `aulas-senai-*`) | As 4 pastas `aulas-senai-CLAUDE-*` são clones do **mesmo** repositório e quadro do `aulasenai`: um quadro só, lido uma vez; a pasta escolhe o modelo (HAIKU, SONNET, OPUS) |
| `GERENCIADOR-GLOBAL.8` | 1c. `dashboard-ai-*` | Entram | 👀 Pendente | **Nenhuma** pasta `dashboard-ai-*` existe hoje em `C:\fontes`; e o quadro delas é `task-principal.md` (conflito C19, sem decisão) |
| `GERENCIADOR-GLOBAL.8` | 2. Disparo | Automático para Haiku e Sonnet | ✅ Vale; **revoga** o "só avisar até o `.6`" | Opus fica fora do automático. Depende da `GATILHO-GLOBAL` (C24, ainda ⬜): sem ela a sessão não sabe o que é `;` → `.4` depende da `GATILHO-GLOBAL` |
| `GERENCIADOR-GLOBAL.8` | 3. Ritmo | 30 s, projeto por projeto | ✅ Vale; **revoga** 20 s/60 s | Limite de disparos por hora e `--max-budget-usd` por sessão **não foram respondidos** → 👀 Pendente |
| `GERENCIADOR-GLOBAL.8` | 4. CLI | Só Claude Code | ✅ Vale (igual a 13:01) | — |
| `GERENCIADOR-GLOBAL.8` | 5. `gerenciador-de-tarefas` | Mesclar ao central, pelo Opus | ✅ Vale; **revoga** "convive / fora das `aulas-senai-*`" | Até a `.7` terminar, os dois não podem rodar juntos nas `aulas-senai-*` |
| `GERENCIADOR-GLOBAL.8` | 6. Mesma pasta, dois modelos | (não perguntado) | 👀 Pendente | `rules-ai` e `gerenciador-de-ia` têm uma pasta só: Haiku e Sonnet juntos nela brigam no Git → proposta: **1 sessão por pasta** de cada vez |

**O que sobra para o usuário:** (a) `dashboard-ai-*`: tirar da lista ou dizer onde estão; (b) limite de disparos por hora e de custo por sessão; (c) aceitar "1 sessão por pasta de cada vez" nos projetos de pasta única.

### GERENCIADOR-GLOBAL.7 — Mesclar o `gerenciador-de-tarefas` e revisar o desenho

**Próximo passo:** ler o líder `gerenciador-de-tarefas` (skill e a pasta `aulas-senai-CLAUDE-OPUS-LIDER`), listar as regras que entram no central e revisar o desenho da .1 com as respostas de 16:12.

- **Nível:** PESADO — mescla de dois gerenciadores que disparam sessões e mudança de escopo.
- **Modelo:** só Opus 5.5+ ou Fable — nunca outro.
- **Descrição:** (a) mesclar as regras do `gerenciador-de-tarefas` ao central e dizer o que sai; (b) revisar a .1: lista de projetos, automático só para Haiku e Sonnet, ciclo de 30 s por projeto, modelo ocioso = sem linha `🔄` dele e sem processo vivo; (c) cobrir o risco de 30 s com disparo automático: no máximo 1 sessão ativa por modelo e limite de disparos por hora; (d) evitar disputa com o líder nas pastas `aulas-senai-*` (uma trava por pasta).
- **Critérios de Aceitação:** desenho da .1 revisado, com a lista do que mudou; regras mescladas listadas nesta seção; nenhuma sessão disparada por esta etapa.
- **Entrega:** — · **Verificação:** — · **Anotação:** —
- **JEV-AI-SUGGESTION:** NAO

### GERENCIADOR-GLOBAL.9 — Testes do script central `scripts/gerenciador.mjs`

**Próximo passo:** ✅ entregue em 2026-10-23.

- **Nível:** LEVE — conferência ou ajuste de texto
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** manual
- **Descrição:** Escrever, rodar e confirmar testes (liberados pelo usuário, só Haiku/Gemini Flash/DeepSeek Flash) para `scripts/gerenciador.mjs` e `scripts/gerenciador/*.mjs`: lê o quadro, calcula livres por modelo, respeita dependência, recusa `--modo disparar`, nunca escreve em quadro. Sem alterar o código da .3: defeito achado vira relato.
- **Arquivos:** `scripts/gerenciador/testes/gerenciador.mjs`
- **Critérios de Aceitação:** `node scripts/gerenciador/testes/gerenciador.mjs` passa; relatório do que cada teste cobre.
- **Depende de:** GERENCIADOR-GLOBAL.3
- **Entrega:** Claude Code (Haiku 5.5 · agente), 2026-10-23: scripts/gerenciador/testes/gerenciador.mjs (9 testes)
- **Verificação:** `node --check` limpo; `node scripts/gerenciador/testes/gerenciador.mjs` → 9 testes: 9 passaram, 0 falharam; pasta temporária apagada: sim; nenhuma sobra em `%TEMP%`.
- **Anotação:** defeito achado, não corrigido (o código da .3 não foi alterado): quando a coluna Modelo existe, ela vence a matriz do nível. Prova: uma linha `PESADO · só Haiku` sai livre para Haiku (`scripts/gerenciador/quadro.mjs`, `definirElegiveis`). Contraria a C22 (Haiku só LEVE); a .4 precisa cruzar o modelo com a matriz antes de disparar.
