## Etapa 053-a37505cb — MIGRAR-TAREFAS-API: migrar as tarefas do rules-ai para a API; os demais projetos ficam aguardando

**Tarefa:** MIGRAR-TAREFAS-API · **Pedido em:** 2026-10-23 19:49 · **Criada por:** Claude Code (Sonnet 5.5) (local · main · rules-ai)
**Pedido:** "crie 1 tarefa com o maximo de subtasks-possiveis,pra migrar todas as tarefas de *rules-ai*, para a api, e todas as tarefas de *aulasenai*, *dashboard-ai*, *DASHBOARD-AI-PRINCIPAL*, *REA-APP-CLONES*,demais projetos, crie 1 subtask, pra deixar com status aguardando e remova eles da lista de projetos monitorados"
**Objetivo:** as tarefas do `rules-ai` passam a viver na API (json-server, pasta `api/`); cada outro projeto ganha 1 subtarefa que o deixa com status Aguardando e o tira da lista de projetos monitorados.

### Escopo

- **Entra:** carga das tarefas do `rules-ai` (abertas, concluídas, frentes, decisões, riscos, pendências, lições, recados e os campos das etapas) na API; escrita pela API (reservar, entregar, criar subtarefa); leitura de queda pelo `api/db.json` do Git; adaptar leitores e regras que hoje usam `STATUS.md`; 1 subtarefa por projeto (aulasenai, aulas-senai-*, dashboard-ai-*, DASHBOARD-AI-PRINCIPAL, REA-APP-CLONES, projeto-frontend-com-testes, testes-de-frontend, gerenciador-de-ia) para deixá-lo Aguardando e tirá-lo da lista monitorada; ensaio, corte e rollback.
- **Entra (pedido de 2026-10-23 20:02):** nenhuma tarefa em markdown no `rules-ai`: as etapas (texto completo) vão para a API e os `.md` de tarefa são apagados depois da conferência de perda zero.
- **Entra (pedido de 2026-10-23 20:10):** os projetos filhos `aulasenai` e `dashboard-ai` também passam a ter as tarefas só na API do `rules-ai` (campo `projeto`), com a mesma regra de nada em markdown; subtarefas .53 a .70, depois do corte do `rules-ai`.
- **Não entra:** mexer no quadro de outro projeto fora das subtarefas .53 a .70 (cada projeto sincroniza o seu: `gerenciador-centralizado.md`); apagar tarefas; banco, Supabase ou autenticação; publicar a API na internet; as pastas `DEMAIS-PROJETOS-*` (C20, C23); projetos sem quadro (`CONSERTO-ELANTRA-2.0`, `ai-memory`, `consumo-ia`).

### Riscos

- **Muda a fonte única** (`quadro-de-tarefas.md`, C40) e a decisão P1 da etapa 049 (cópia só de leitura). Plano B: manter o `.md` como fonte e a API como cópia; a .30 deixa o rollback pronto.
- **A API só escuta em 127.0.0.1:** sessões de nuvem e outros computadores não a alcançam; plano B = `api/db.json` do Git, JSON, somente leitura.
- **Concorrência:** o json-server grava o arquivo inteiro e não tem compare-and-set; duas frentes podem reservar a mesma subtarefa. Mitigação nas subtarefas .6 e .13; pergunta P4.
- **Apagar os `.md` é irreversível fora do Git:** só depois da conferência de perda zero (INV-7), da tag de segurança e do alvo exato confirmado pelo usuário; rollback por `git revert` e reimportação.
- **Nuvem dos filhos:** o aulasenai usa muitas sessões de nuvem, que não alcançam a API local: só leem o `db.json` do Git e não reservam (.60); isso muda o fluxo deles e precisa de aviso.
- **Volume do aulasenai** (~1.440 linhas e ~430 etapas): tamanho e diff do `db.json` (.53).
- **Perda de dados:** `db.json` hoje está fora do Git; sem versionar, a migração perde tudo ao apagar a pasta (pergunta P2).
- **Muitos leitores** do `STATUS.md` (lista na .3): cada um migra separado; enquanto isso os `.md` continuam valendo até o corte (.32), e só então são apagados (.47).
- **Arquivos compartilhados:** as subtarefas .34 a .41 editam o mesmo `scripts/gerenciador.config.json` e `dashboard/projetos.json`; reservar uma por vez. `DASHBOARD-LE-API` e `AGENTES-REALTIME.*` mexem em `agentes.js`, `canal.js`, `config.js`: dois escritores nunca ao mesmo tempo.

### Decisões

- 2026-10-23 19:49: pedido do usuário; tarefa **grande e PESADO** (muda a fonte única das tarefas, mudança em massa, várias partes): spec (C34) e **aprovação explícita** antes de executar. Nada é reservado até as perguntas abertas serem fechadas.
- 2026-10-23 19:49: "deixar com status aguardando" foi entendido como registrar `status: aguardando` e `monitorado: false` na coleção `projetos` da API, **sem escrever no quadro do outro projeto** (regra do gerenciador); a pergunta P6 confirma.
- 2026-10-23 19:49: "demais projetos" foi lido como os projetos que existem em `C:\fontes` com quadro, mais os padrões que ainda estão na lista monitorada; a pergunta P7 confirma a lista.

- 2026-10-23 19:58: **P1 a P8 respondidas pelo usuário** (perguntas fechadas). Resposta da P7: o `aulasenai` **não fica aguardando**: continua monitorado e intocado (subtarefa .34 cancelada); as demais ficam aguardando. Decisões que decorrem: API é a fonte (P1) e `db.json` versionado (P2, revoga a P3 da etapa 049); reserva atômica por middleware mínimo do json-server (P4, 1 arquivo `--middlewares`; o json-server continua sendo a única dependência); etapas em `.md` (P5).
- 2026-10-23 20:00: **aprovação do usuário ao plano** ("1 sim"): pode começar pela .1 e seguir com 1 agente por subtarefa, no nível certo. Escopo aprovado = o desta etapa; mudança material pede nova aprovação.
- 2026-10-23 20:02: **novo pedido do usuário**: "No projeto rules-ai, deve existir nada de tarefa em markdown, apenas no banco da api". Efeitos: **substitui a P5** (as etapas passam a viver na API, não em `.md`) e a **P8** (não há espelho `.md`); o `db.json` versionado no Git (P2) é a leitura de queda de quem não alcança a API (nuvem), em JSON, sem markdown. Depois do corte não existem em `rules-ai`: `tasks/STATUS.md`, `tasks/task_complete.md`, `tasks/RECADOS.md` nem `tasks/etapas/*.md`. O histórico fica no Git (tag de segurança antes de apagar). O apagamento exige o **alvo exato confirmado pelo usuário** (subtarefa .46). Regras (`regras/*.md`), documentação e os quadros dos outros projetos **não** são tarefas e continuam em markdown.
- 2026-10-23 20:10: **novo pedido do usuário**: "Nos projetos filho, aulasenai, dashboard-ai, as tarefas tb devem sempre vir de rules-ai". Respostas: filhos = **aulasenai e dashboard-ai** (DASHBOARD-AI-PRINCIPAL e cópias); **nada em markdown nos filhos também**; sessões de nuvem dos filhos **só leem** o `db.json` do Git; ordem: **rules-ai primeiro, filhos depois**. Efeito: `aulasenai` e `dashboard-ai` **não ficam Aguardando** (subtarefas .34, .36 e .37 canceladas); continuam Aguardando e fora da lista só `REA-APP-CLONES`, `testes-de-frontend`, `projeto-frontend-com-testes`, `gerenciador-de-ia` e os clones `aulas-senai-*`. O "sim" do usuário ao plano vale para esta ampliação (pedido explícito, escopo definido por ele); o apagamento nos filhos continua exigindo o alvo confirmado (.62, .68).
- 2026-10-23 20:57: **respostas do usuário** às decisões da .53 e da .4: **opção B aprovada** (um arquivo por projeto em `api/dados/<projeto>.json`, um processo; lançador próprio só quando o `aulasenai` entrar); dados do `aulasenai` e do `dashboard-ai` **no Git do `rules-ai`**; **aceito o peso** de ~4 MB do `aulasenai` regravado a cada entrega; coleção **`bloqueios` mantida**.
- 2026-10-23 21:00: **mais respostas do usuário**: as tabelas internas das etapas (Requisitos, Invariantes, Perguntas abertas) **viram coleções** na API (`requisitos`, `invariantes`, `perguntas`; contra a recomendação de texto cru) — nova subtarefa .71 atualiza o `SCHEMA.md`, e a .10 e a .51 passam a depender dela; `tasks/GERENCIADOR-HERDR/*.md` **fica como documentação** (fora do apagamento); ids por hash do texto nas linhas sem código (aceito); a tarefa `DASHBOARD-LE-API` **espera a migração** (depende da .48).

### Mudança de escopo: Supabase Realtime no lugar do json-server (pedido em 2026-10-24)

**Pedido do usuário:** "altere em vez de usar json-server, deverá usar realtime supabase"; "aulasenai e rules-ai, todas as tarefas vão pro banco de dados, faça um migrador em python pra isso, pra criar um seed inicial".

**Decisões do usuário (2026-10-24):**
1. Fonte única do quadro: **tabelas no Supabase** (projeto atual do `aulasenai`, `hxlvonriearllcmfqeri`), com **Realtime** para avisar frentes e dashboard.
2. **Aposentar tudo**: json-server, `api/db.json` e qualquer export no Git. Sem arquivo de queda; se o Supabase cair, o quadro fica indisponível.
3. **Reserva atômica:** função **RPC no Postgres** com `UPDATE` condicional (`reservar`, `entregar`, `criar_subtarefa`, `liberar`, `mudar_status`).
4. **Acesso:** leitura com chave `anon` + RLS; escrita só pelas funções RPC, com a chave de serviço guardada **fora do Git** (variável de ambiente).
5. **Seed:** migrador em **Python** que lê os `.md` e usa os JSON de `api/dados/` como referência de conferência; cria o seed inicial de `rules-ai` e `aulasenai`.
6. Escopo de projetos: só `rules-ai` e `aulasenai` (o `dashboard-ai` está fora; cancelado em 2026-10-24).

**O que muda no plano (a detalhar depois do "sim"):**
- O que vale como entregue e continua: `SCHEMA.md` como desenho dos campos, os JSON de `api/dados/` (referência do seed) e as decisões de status (`👀 Pendente de revisão`).
- Para reescrever: `.13` a `.15` viram funções RPC; `.16` (leitura de queda) deixa de existir; `.17` a `.23` leem o Supabase; `.30` (rollback) passa a ser restaurar o quadro em Markdown do Git pela tag de segurança; `.52` aposenta também o json-server; as tabelas, a RLS, o Realtime e o migrador Python viram subtarefas novas.
- Outras tarefas afetadas: `API-QUADRO-JSON-SERVER` (cancelar o que não vale mais) e `DASHBOARD-LE-API` (lê do Supabase, não de `/tarefas`).

**Riscos novos:** (a) mudança de **banco e segurança** em produção (RLS errada expõe o quadro, que não pode ter segredo nem dado pessoal); (b) chave de serviço só em variável de ambiente, nunca em arquivo; (c) sessões de nuvem precisam de acesso de leitura ao Supabase; (d) sem export no Git, o rollback depende da tag `tasks-md-antes-da-api` e dos `.md` ainda existentes até o corte; (e) o `aulasenai` e o `dashboard` usam o mesmo projeto Supabase, então limites e RLS são compartilhados.

**Aprovação:** Gelvazio, 2026-10-24 08:49, "sim" ao plano acima (tarefa grande: banco + segurança). Tabelas, funções e chaves só entram pela .77, feita pelo usuário.

### Requisitos

| ID | Requisito (EARS) | Cobre | Verificação |
|----|------------------|-------|-------------|
| R1.1 | QUANDO a carga inicial rodar, O SISTEMA DEVE gravar na API todas as linhas de `tasks/STATUS.md` e `tasks/task_complete.md` do `rules-ai`, sem perder nem duplicar nenhuma | MIGRAR-TAREFAS-API.7, MIGRAR-TAREFAS-API.8, MIGRAR-TAREFAS-API.11 | contagem e ids comparados por script |
| R1.2 | SE o id da tarefa já existir na API, ENTÃO O SISTEMA DEVE atualizar a tarefa em vez de criar outra | MIGRAR-TAREFAS-API.7, MIGRAR-TAREFAS-API.11 | rodar a carga duas vezes e comparar o `db.json` |
| R2.1 | QUANDO uma IA reservar uma subtarefa pela API, O SISTEMA DEVE gravar `emUsoPor` e `em_execucao` somente se a subtarefa estiver livre, com dependências concluídas e do modelo da IA | MIGRAR-TAREFAS-API.13 | reservar uma livre e uma ocupada; só a livre grava |
| R2.2 | QUANDO uma subtarefa for entregue pela API, O SISTEMA DEVE marcá-la concluída, limpar `emUsoPor`, anotar entrega e verificação e liberar as dependentes | MIGRAR-TAREFAS-API.14 | entregar uma tarefa de teste e conferir as dependentes |
| R3.1 | QUANDO o corte terminar, O SISTEMA DEVE não ter nenhum arquivo `.md` de tarefa em `rules-ai` (`tasks/STATUS.md`, `tasks/task_complete.md`, `tasks/RECADOS.md`, `tasks/etapas/*.md`) | MIGRAR-TAREFAS-API.47, MIGRAR-TAREFAS-API.48 | `find tasks -name '*.md'` sem arquivo de tarefa |
| R3.2 | SE a API estiver fora do ar, ENTÃO OS LEITORES DEVEM ler `api/db.json` do Git, em JSON, só para leitura | MIGRAR-TAREFAS-API.16, MIGRAR-TAREFAS-API.17, MIGRAR-TAREFAS-API.21, MIGRAR-TAREFAS-API.23 | derrubar a API e rodar `gerenciador.mjs ver` |
| R4.1 | QUANDO um projeto for removido da lista, O SISTEMA DEVE registrá-lo na coleção `projetos` com `status: aguardando` e `monitorado: false` | MIGRAR-TAREFAS-API.12, MIGRAR-TAREFAS-API.34, MIGRAR-TAREFAS-API.41 | consultar `/projetos` |
| R4.2 | ONDE um projeto estiver com `monitorado: false`, O SISTEMA DEVE não ler o quadro dele (gerenciador, MCP e dashboard) | MIGRAR-TAREFAS-API.17, MIGRAR-TAREFAS-API.18, MIGRAR-TAREFAS-API.42 | `gerenciador.mjs ver` e `task_list` só mostram o `rules-ai`, o `aulasenai` e o `dashboard-ai` |
| R5.1 | O SISTEMA DEVE permitir voltar aos `.md` pelo Git (tag de segurança e `git revert`) e reimportar | MIGRAR-TAREFAS-API.30, MIGRAR-TAREFAS-API.44 | ensaio em cópia do repositório |
| R5.2 | O SISTEMA DEVE manter `api/db.json` versionado no Git com ordem de chaves fixa | MIGRAR-TAREFAS-API.5 | `git diff` após regerar sem mudança de dados é vazio |
| R6.1 | O SISTEMA DEVE guardar na API o texto completo de cada etapa (seções, subtarefas, decisões, riscos, requisitos) antes de qualquer `.md` ser apagado | MIGRAR-TAREFAS-API.10, MIGRAR-TAREFAS-API.45 | script de perda zero |
| R7.1 | ONDE um projeto for filho (`aulasenai`, `dashboard-ai`), O SISTEMA DEVE ter as tarefas dele na API do `rules-ai`, com o campo `projeto`, e nenhum `.md` de tarefa nele depois do corte do filho | MIGRAR-TAREFAS-API.54, MIGRAR-TAREFAS-API.63, MIGRAR-TAREFAS-API.65, MIGRAR-TAREFAS-API.69 | consulta por `projeto` e `find tasks -name '*.md'` no filho |

### Invariantes

| ID | Regra que vale sempre | Domínio da entrada | Como conferir | Teste automatizado |
|----|----------------------|--------------------|---------------|--------------------|
| INV-1 | Toda tarefa do quadro antes da migração existe na API depois, com o mesmo id, status, modelo, dependências e "em uso por" | todas as linhas de `STATUS.md` e `task_complete.md` | script de paridade campo a campo | sim: script da .11 |
| INV-2 | Os ids da coleção `tarefas` são únicos | qualquer número de cargas | contar ids repetidos | sim: script da .11 |
| INV-3 | Uma subtarefa nunca tem duas reservas ao mesmo tempo | N reservas simultâneas, N de 2 a 10 | disparar reservas em paralelo contra a API e contar `emUsoPor` | sim: script da .13 |
| INV-4 | O `db.json` não contém segredo nem dado pessoal | todo o arquivo | `grep` por `sk-`, `tsk_`, `Bearer`, `ghp_`, CPF, e-mail | não: conferência por comando na .11 |
| INV-5 | Rodar a carga N vezes dá o mesmo `db.json` (idempotência) | N de 1 a 5 | comparar o hash do arquivo | sim: script da .11 |
| INV-6 | A migração do `rules-ai` não altera nenhum arquivo dos outros projetos; os filhos só mudam nas subtarefas .54 a .69, depois do corte do `rules-ai` | todas as pastas de `C:ontes` exceto `rules-ai` | `git status` de cada projeto igual antes e depois | não: conferência por comando na .42 |
| INV-7 | Antes de apagar qualquer `.md` de tarefa, todo o texto dele existe na API (nada se perde) | todos os arquivos de `tasks/` que serão apagados | script que compara cada seção do `.md` com o campo da API | sim: script da .45 |

**Casos de borda que o código precisa sobreviver:**

- linha de tabela com `|` no título, emoji ausente, coluna a mais ou a menos, id com `#`, dependência para tarefa já concluída ou inexistente, `Em uso por` com percentual, tarefa repetida entre `STATUS.md` e `task_complete.md`, API fora do ar, `db.json` vazio ou corrompido.

### Perguntas abertas

| # | Pergunta | Resposta | Fechada em | Quem respondeu |
|---|----------|----------|------------|----------------|
| P1 | A API vira a **fonte de verdade** do `rules-ai` (o `STATUS.md` e o `task_complete.md` passam a ser espelhos gerados)? Recomendado: sim, é o que "migrar" pede; isso revoga a P1 da etapa 049 | ✅ Sim: a API é a fonte; `STATUS.md` e `task_complete.md` viram espelho | 2026-10-23 19:58 | usuário (AskUserQuestion) |
| P2 | `api/db.json` entra no **Git** (necessário para não perder as tarefas)? Recomendado: sim | ✅ Sim: `api/db.json` entra no Git | 2026-10-23 19:58 | usuário (AskUserQuestion) |
| P3 | Quem alcança a API? Ela só escuta em `127.0.0.1`: nuvem e outros PCs leem o espelho do Git, só leitura. Recomendado: só local | ✅ Só local; nuvem lê o espelho do Git | 2026-10-23 19:58 | usuário (AskUserQuestion) |
| P4 | Como evitar duas reservas da mesma subtarefa, já que o json-server não tem compare-and-set? Opções: (a) uma frente escreve por vez, com a trava de sessão; (b) um middleware mínimo do próprio json-server (`--middlewares`, 1 arquivo) que recusa reserva de subtarefa ocupada. Recomendado: (b) | ✅ Middleware mínimo do json-server (`--middlewares`, 1 arquivo) | 2026-10-23 19:58 | usuário (AskUserQuestion) |
| P5 | O texto longo das **etapas** vai para a API ou continua em `.md` (a API guarda só campos estruturados e o nome do arquivo)? Recomendado: continua em `.md` | ✅ Continua em `.md` | 2026-10-23 19:58 | usuário (AskUserQuestion) |
| P6 | "Status aguardando" dos outros projetos = `status: aguardando` e `monitorado: false` na coleção `projetos` da API, **sem tocar no quadro deles**? Recomendado: sim | ✅ Sim: só na API (`status: aguardando`, `monitorado: false`), sem tocar nos quadros deles | 2026-10-23 19:58 | usuário (AskUserQuestion) |
| P7 | A lista de projetos a deixar aguardando está certa (aulasenai, aulas-senai-*, dashboard-ai-*, DASHBOARD-AI-PRINCIPAL, REA-APP-CLONES, projeto-frontend-com-testes, testes-de-frontend, gerenciador-de-ia)? As pastas `aulas-senai-*`, `dashboard-ai-*` e `gerenciador-de-ia` já não existem em `C:\fontes`, então só saem da lista | ✅ Lista da etapa, **menos o `aulasenai`, que não fica aguardando** | 2026-10-23 19:58 | usuário (AskUserQuestion) |
| P8 | Depois do corte, o `STATUS.md` fica só como espelho gerado e somente leitura? Recomendado: sim | ✅ Sim: espelho só de leitura | 2026-10-23 19:58 | usuário (AskUserQuestion) |


### MIGRAR-TAREFAS-API.1 — Fechar as perguntas abertas e aprovar o plano

**Próximo passo:** ✅ concluída em 2026-10-23 20:00 (P1 a P8 respondidas e plano aprovado pelo usuário).

- **Nível:** LEVE — ação que só o usuário pode fazer
- **Modelo:** Usuário — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Responder as perguntas P1 a P8 da etapa (cada uma traz a opção recomendada) e dar o "sim" ao plano. Sem isso nada é reservado nem executado.
- **Critérios de Aceitação:** nenhuma pergunta `⬜` na etapa; aprovação registrada nas Decisões.
- **Depende de:** Nenhuma

- **Entrega:** respostas nas Perguntas abertas e aprovação nas Decisões (commit 08436c2 e este)
- **Verificação:** `node spec/verificar-spec.mjs` sem falha com as perguntas fechadas

### MIGRAR-TAREFAS-API.2 — Rodar o gate da spec e registrar a aprovação

**Próximo passo:** concluída; segue a .3 (inventário) e a .4 (contrato do schema).

- **Nível:** LEVE — só texto e configuração, sem lógica
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** `node spec/verificar-spec.mjs tasks/etapas/<esta etapa>` sem falha; registrar o resultado e a aprovação nas Decisões.
- **Critérios de Aceitação:** gate com código 0.
- **Depende de:** MIGRAR-TAREFAS-API.1
- **Entrega:** commit "chore(MIGRAR-TAREFAS-API.2)"
- **Verificação:** node spec/verificar-spec.mjs com código 0 (Requisitos, Invariantes, Perguntas abertas e Subtarefas ✅); aprovação do usuário registrada nas Decisões

### MIGRAR-TAREFAS-API.3 — Inventário do que lê ou escreve `STATUS.md`, `task_complete.md` e etapas no `rules-ai`

**Próximo passo:** concluída; as lacunas do inventário viraram as subtarefas .49 a .52.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Lista (arquivo, função, leitura ou escrita) de `mcp/`, `scripts/gerenciador*`, `scripts/jev*`, `dashboard/*.py`, `dashboard/assets/js`, `.github/workflows`, `regras/*.md`, `AGENTS.md`; gravar como tabela na seção da subtarefa.
- **Critérios de Aceitação:** todo arquivo do `grep STATUS.md` está na tabela.
- **Depende de:** MIGRAR-TAREFAS-API.2
- **Entrega:** commit "chore(MIGRAR-TAREFAS-API.3)" (api/INVENTARIO-LEITORES.md)
- **Verificação:** 60 arquivos que citam o quadro conferidos por comando contra a tabela (nenhum faltando); sem segredo

### MIGRAR-TAREFAS-API.4 — Contrato do schema da API como fonte (coleções, campos, chaves)

**Próximo passo:** concluída; segue a .5, .6, .7, .12 e .53 (decisões em aberto listadas na Anotação).

- **Nível:** PESADO — arquitetura, mudança em massa ou regra global
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Definir coleções `tarefas`, `etapas` (texto completo em seções), `frentes`, `decisoes`, `riscos`, `pendencias`, `licoes`, `recados` e `projetos`; campos de leitura e de escrita; chave de cada uma; ordem estável das chaves. Estende o formato da etapa 049. Nenhuma tarefa fica em markdown.
- **Critérios de Aceitação:** contrato escrito (arquivo `api/SCHEMA.md`) e aprovado; cobre as colunas do `STATUS.md` e `task_complete.md` e todas as seções das etapas.
- **Depende de:** MIGRAR-TAREFAS-API.2
- **Entrega:** commit "chore(MIGRAR-TAREFAS-API.4)" (api/SCHEMA.md)
- **Verificação:** SCHEMA.md conferido por leitura e grep: 7 seções, 11 coleções, todas as colunas das tabelas do quadro com campo, sem segredo
- **Anotação:** decisões do executor: id composto <projeto>:<codigo>; array ordenado por id; operações por POST /operacoes/<nome> com middleware e PATCH/PUT/DELETE direto recusados; 6 estados. Em aberto para o usuário: (1) coleção extra bloqueios (aprovar ou fundir em pendencias); (2) tabelas internas das etapas ficam como texto; (3) tasks/GERENCIADOR-HERDR/*.md: apagar ou manter (decidir na .46); (4) RECADOS.md não existe no rules-ai; (5) armazenamento multi-projeto: db único, arquivo por projeto, servidor por projeto ou híbrido (decide a .53; provisório: db único enquanto só o rules-ai, arquivo por projeto antes do aulasenai); (6) id de linha sem código usa hash do texto (editar o texto muda o id).

### MIGRAR-TAREFAS-API.5 — Versionar `api/db.json` (tirar do `.gitignore`) com formato estável

**Próximo passo:** concluída; segue a .7 e a .12 (o layout final dos arquivos depende da decisão B da .53).

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Revogar a P3 da etapa 049 (conforme a resposta P2 daqui); chaves em ordem fixa e fim de linha LF para o diff do Git ser legível.
- **Critérios de Aceitação:** `db.json` entra no Git sem diff de ruído ao regerar.
- **Depende de:** MIGRAR-TAREFAS-API.4
- **Entrega:** commit "feat(MIGRAR-TAREFAS-API.5)" (api/serializador.mjs, api/.gitattributes, db.json versionado)
- **Verificação:** node --check ok; geração duas vezes seguidas com o mesmo hash; db.json não ignorado, só LF; serializador com JSDoc
- **Anotação:** o gerar-db.mjs ainda produz o formato antigo da etapa 049; a migração de campos para o schema novo e o caminho final (api/dados/<projeto>.json, opção B da .53) ficam para a .7

### MIGRAR-TAREFAS-API.6 — Estratégia de concorrência e reserva atômica (conforme P4)

**Próximo passo:** concluída; a implementação (middleware, lançador com trava, recarregar, mtime) está na .13.

- **Nível:** PESADO — arquitetura, mudança em massa ou regra global
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** O json-server grava o arquivo inteiro e não tem compare-and-set: escolher e documentar como duas frentes não reservam a mesma subtarefa (INV-3).
- **Critérios de Aceitação:** estratégia escrita, com o caso de duas reservas simultâneas descrito e a verificação definida.
- **Depende de:** MIGRAR-TAREFAS-API.4
- **Entrega:** commit "chore(MIGRAR-TAREFAS-API.6)" (api/CONCORRENCIA.md)
- **Verificação:** trechos do json-server conferidos em node_modules (FileAsync, db.write não aguardado); experimento descartável do executor: 10 reservas simultâneas, 1 sucesso e 9 conflitos (controle com await: 7 sucessos); sem segredo; sem processo de experimento sobrando
- **Anotação:** o npm start ainda tem --watch (a .13 tira); o serializador entra no lugar do db.write(); recarregar e checagem de mtime viraram parte da .13; fora da proteção: várias máquinas, nuvem, dois clones no mesmo PC e escrita direta no arquivo

### MIGRAR-TAREFAS-API.7 — Carga inicial das tarefas abertas (`STATUS.md`)

**Próximo passo:** concluída; a .8 carrega as concluídas e recalcula `disponivel`; `rules-ai:DASHBOARD-JEV-CALLS.3` ficou como ausente no JSON até a .8

- **Nível:** PESADO — arquitetura, mudança em massa ou regra global
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Importador idempotente `api/migrar.mjs` (Node puro) que lê a seção "📌 Tarefas" e grava na coleção `tarefas`; roda N vezes sem duplicar (INV-5). **Caminho final (opção B aprovada):** o banco do `rules-ai` passa a `api/dados/rules-ai.json` (mover o `api/db.json` de hoje, ajustar README, serializador e `gerar-db.mjs`); a carga recebe `--projeto`.
- **Critérios de Aceitação:** todas as linhas abertas do `STATUS.md` na API, ids únicos.
- **Depende de:** MIGRAR-TAREFAS-API.4
- **Entrega:** commit "feat(MIGRAR-TAREFAS-API.7)" (api/migrar.mjs, api/dados/rules-ai.json)
- **Verificação:** node --check ok; carga idempotente (mesmo md5 em duas execuções seguidas); contagem independente igual à do importador; ids únicos; json-server segue a única dependência

### MIGRAR-TAREFAS-API.8 — Carga das tarefas concluídas (`task_complete.md`)

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Mesmo importador para as linhas ✅ (e ❌/⛔ movidas), sem perder nenhuma.
- **Critérios de Aceitação:** contagem igual à do `task_complete.md`.
- **Depende de:** MIGRAR-TAREFAS-API.7

### MIGRAR-TAREFAS-API.9 — Carga de frentes, decisões, riscos, pendências, lições e recados

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Importar as demais seções do `STATUS.md` e o `tasks/RECADOS.md` para as coleções do contrato.
- **Critérios de Aceitação:** cada seção tem a mesma quantidade de linhas na API.
- **Depende de:** MIGRAR-TAREFAS-API.7

### MIGRAR-TAREFAS-API.10 — Carga do texto completo das etapas na API (nada em markdown)

**Próximo passo:** aguardar as dependências.

- **Nível:** PESADO — arquitetura, mudança em massa ou regra global
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Importar cada `tasks/etapas/*.md` para a coleção `etapas` (cabeçalho, escopo, riscos, decisões, as coleções `requisitos`, `invariantes` e `perguntas` e o texto de cada subtarefa: Nível, Modelo, Effort, Descrição, Critérios, Próximo passo, Entrega, Verificação) e ligar cada subtarefa à sua etapa. Substitui a P5.
- **Critérios de Aceitação:** toda etapa e toda subtarefa com seção tem o texto completo na API.
- **Depende de:** MIGRAR-TAREFAS-API.7, MIGRAR-TAREFAS-API.71

### MIGRAR-TAREFAS-API.11 — Conferir a carga: paridade campo a campo, ids únicos e idempotência

**Próximo passo:** ❌ cancelada em 2026-10-24 08:49 (substituída pela .78 (conferência do seed no Supabase); plano aprovado em 2026-10-24)

- **Nível:** PESADO — arquitetura, mudança em massa ou regra global
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Script de invariante (permitido em PESADO) que compara a API com o quadro (INV-1, INV-2, INV-5) e roda a carga duas vezes.
- **Critérios de Aceitação:** zero diferença; segunda carga não muda nada.
- **Depende de:** MIGRAR-TAREFAS-API.8, MIGRAR-TAREFAS-API.9, MIGRAR-TAREFAS-API.10

### MIGRAR-TAREFAS-API.12 — Coleção `projetos` com `status` e `monitorado`

**Próximo passo:** concluída; as .35 e .38 a .41 usam `node api/projetos.mjs --id <projeto> --status aguardando --motivo "migração para a API"`

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Criar a coleção com `id`, `nome`, `status` (`ativo`/`aguardando`), `monitorado` (booleano) e `motivo`; `rules-ai` entra como `ativo` e `monitorado`. O arquivo da coleção é `api/dados/_projetos.json` (opção B).
- **Critérios de Aceitação:** coleção criada e lida pela API.
- **Depende de:** MIGRAR-TAREFAS-API.4
- **Entrega:** commit "feat(MIGRAR-TAREFAS-API.12)" (api/projetos.mjs, api/dados/_projetos.json)
- **Verificação:** node --check ok; upsert idempotente (mesmo md5 duas vezes); valores inválidos recusados sem gravar; JSON só LF

### MIGRAR-TAREFAS-API.13 — Cliente da RPC `reservar` e prova de exclusão com duas chamadas simultâneas

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** PESADO — arquitetura, mudança em massa ou regra global
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Operação de reserva (`PATCH`) que só grava se `emUsoPor` estiver vazio, a dependência estiver concluída e o modelo for o certo (C22, C50); segue a estratégia da .6. **Inclui os achados da .6 (`api/CONCORRENCIA.md`):** tirar `--watch` do `npm start`; `--middlewares` com a reserva síncrona (sem `await` entre conferir e mudar); lançador `api/iniciar.mjs` com a trava `api/.servidor.lock` (PID); serializador no lugar do `db.write()` simples; operação `recarregar` (depois de `git pull`) e checagem de `mtime` (409 `db_alterado_por_fora`); script do INV-3 `api/testes/inv3-reservas.mjs`.
- **Critérios de Aceitação:** reserva de subtarefa ocupada é recusada; reserva válida grava `emUsoPor` e `em_execucao`.
- **Depende de:** MIGRAR-TAREFAS-API.75, MIGRAR-TAREFAS-API.78
- **Mudança (2026-10-24):** a fonte do quadro passou do json-server para tabelas no Supabase com Realtime e RPC (ver "Mudança de escopo" desta etapa); onde esta seção citar `api/db.json`, `/tarefas` ou json-server, vale o Supabase.

### MIGRAR-TAREFAS-API.14 — Cliente da RPC `entregar` (move para concluída, com entrega e verificação)

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** PESADO — arquitetura, mudança em massa ou regra global
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Operação que marca concluída, limpa `emUsoPor`, anota `Entrega` e `Verificação` e libera as dependentes.
- **Critérios de Aceitação:** subtarefa entregue vira `concluida` e as dependentes ficam `disponivel`.
- **Depende de:** MIGRAR-TAREFAS-API.13
- **Mudança (2026-10-24):** a fonte do quadro passou do json-server para tabelas no Supabase com Realtime e RPC (ver "Mudança de escopo" desta etapa); onde esta seção citar `api/db.json`, `/tarefas` ou json-server, vale o Supabase.

### MIGRAR-TAREFAS-API.15 — Cliente da RPC `criar_subtarefa` na mãe atual (C26)

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Operação que cria `<TAREFA>.<n+1>` com nível, modelo e effort, só dentro de mãe aberta.
- **Critérios de Aceitação:** ids novos sequenciais; nunca cria mãe.
- **Depende de:** MIGRAR-TAREFAS-API.13
- **Mudança (2026-10-24):** a fonte do quadro passou do json-server para tabelas no Supabase com Realtime e RPC (ver "Mudança de escopo" desta etapa); onde esta seção citar `api/db.json`, `/tarefas` ou json-server, vale o Supabase.

### MIGRAR-TAREFAS-API.16 — Leitura de queda: leitores usam `api/db.json` do Git quando a API está fora

**Próximo passo:** ❌ cancelada em 2026-10-24 08:49 (sem arquivo de queda: json-server e `api/db.json` aposentados; plano aprovado em 2026-10-24)

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Padronizar como os leitores caem para o `api/db.json` versionado (JSON, só leitura) quando a API não responde; sem gerar nenhum `.md`. Substitui o espelho.
- **Critérios de Aceitação:** função de leitura única, usada pelos leitores, com queda para o `db.json`.
- **Depende de:** MIGRAR-TAREFAS-API.11

### MIGRAR-TAREFAS-API.17 — `scripts/gerenciador.mjs` e `scripts/gerenciador/quadro.mjs` leem a API

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Fonte = API (com queda para o `db.json` do Git); `projetos` vêm da coleção `projetos` (`monitorado: true`). **Os outros projetos (aulasenai, dashboard-ai…) continuam em `.md`: o gerenciador, o MCP e o `construir-golden.mjs` precisam manter a leitura de `.md` para eles.**
- **Critérios de Aceitação:** `node scripts/gerenciador.mjs ver` mostra o mesmo que antes.
- **Depende de:** MIGRAR-TAREFAS-API.78
- **Mudança (2026-10-24):** a fonte do quadro passou do json-server para tabelas no Supabase com Realtime e RPC (ver "Mudança de escopo" desta etapa); onde esta seção citar `api/db.json`, `/tarefas` ou json-server, vale o Supabase.

### MIGRAR-TAREFAS-API.18 — `mcp/` (config, quadro, projetos) lê e grava pela API

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** PESADO — arquitetura, mudança em massa ou regra global
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Trocar leitor/escritor do MCP-QUADRO pela API (reserva e entrega pelas operações .13 e .14); descoberta de projetos pela coleção `projetos`. **Os outros projetos (aulasenai, dashboard-ai…) continuam em `.md`: o gerenciador, o MCP e o `construir-golden.mjs` precisam manter a leitura de `.md` para eles.**
- **Critérios de Aceitação:** `task_list`, `task_next` e `task_finish` funcionam contra a API.
- **Depende de:** MIGRAR-TAREFAS-API.14

### MIGRAR-TAREFAS-API.19 — `scripts/jev/` (estado, gravacao, gravador, `jev.mjs`) grava nível pela API

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** PESADO — arquitetura, mudança em massa ou regra global
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** O Jev passa a gravar `Nível`, `Modelo` e `Effort` na tarefa da API (C47), mantendo o campo `JEV-AI-SUGGESTION`. **Os outros projetos (aulasenai, dashboard-ai…) continuam em `.md`: o gerenciador, o MCP e o `construir-golden.mjs` precisam manter a leitura de `.md` para eles.**
- **Critérios de Aceitação:** `jev.mjs classificar --dry-run` lê da API e `--gravar` grava na API.
- **Depende de:** MIGRAR-TAREFAS-API.14

### MIGRAR-TAREFAS-API.20 — `scripts/marcar_jev_ai_suggestion.py` e o que ainda usa o texto da etapa

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Adaptar o script (e qualquer outro achado na .3) à API.
- **Critérios de Aceitação:** script roda contra a API.
- **Depende de:** MIGRAR-TAREFAS-API.19

### MIGRAR-TAREFAS-API.21 — Python do dashboard (`quadro_tarefas.py`, `publicar_quadro.py`, `privacidade_quadro.py`)

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Ler a API (ou o `db.json` do Git) no lugar do `STATUS.md`; a privacidade do payload não muda.
- **Critérios de Aceitação:** `publicar_quadro.py --simular` gera o mesmo payload.
- **Depende de:** MIGRAR-TAREFAS-API.78
- **Mudança (2026-10-24):** a fonte do quadro passou do json-server para tabelas no Supabase com Realtime e RPC (ver "Mudança de escopo" desta etapa); onde esta seção citar `api/db.json`, `/tarefas` ou json-server, vale o Supabase.

### MIGRAR-TAREFAS-API.22 — Workflow `.github/workflows/publicar-quadro.yml`

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Gatilho e fonte coerentes com a API como fonte (o `db.json` versionado dispara o envio).
- **Critérios de Aceitação:** workflow válido (leitura) e coerente com o `publicar_quadro.py`.
- **Depende de:** MIGRAR-TAREFAS-API.21

### MIGRAR-TAREFAS-API.23 — Dashboard JS (`quadro.js`, `canal.js`, `agentes.js`, `config.js`) na nova fonte

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Alinhar com a tarefa `DASHBOARD-LE-API`: a API vira a leitura primária; sem reserva ao mesmo tempo nos mesmos arquivos.
- **Critérios de Aceitação:** a página mostra as mesmas tarefas de antes.
- **Depende de:** MIGRAR-TAREFAS-API.78
- **Mudança (2026-10-24):** a fonte do quadro passou do json-server para tabelas no Supabase com Realtime e RPC (ver "Mudança de escopo" desta etapa); onde esta seção citar `api/db.json`, `/tarefas` ou json-server, vale o Supabase.

### MIGRAR-TAREFAS-API.24 — Regra `quadro-de-tarefas.md`: fonte única = Supabase, nenhuma tarefa em markdown no `rules-ai`; nova decisão em `CONFLITOS.md`

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** PESADO — arquitetura, mudança em massa ou regra global
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Reescrever a tabela "Cada informação em um lugar só" e o modelo do quadro; registrar a decisão (C52) e o que muda para quem não alcança a API.
- **Critérios de Aceitação:** regra coerente com as respostas P1 a P5; `CONFLITOS.md` com a decisão.
- **Depende de:** MIGRAR-TAREFAS-API.14
- **Mudança (2026-10-24):** a fonte do quadro passou do json-server para tabelas no Supabase com Realtime e RPC (ver "Mudança de escopo" desta etapa); onde esta seção citar `api/db.json`, `/tarefas` ou json-server, vale o Supabase.

### MIGRAR-TAREFAS-API.25 — Regras `frentes-e-reserva.md` e `ciclo-da-task.md`: reservar e entregar pela API

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** PESADO — arquitetura, mudança em massa ou regra global
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Trocar "commit + push da reserva" pela operação da API (e o que sobra do Git); manter a regra maior (C50) e a trava de sessão.
- **Critérios de Aceitação:** regras sem contradição com `quadro-de-tarefas.md`.
- **Depende de:** MIGRAR-TAREFAS-API.24

### MIGRAR-TAREFAS-API.26 — Regras dos comandos `.`, `;` e `?`

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** `comando-ponto.md`, `comando-interrogacao.md` e o gatilho `;` leem a API (com o `db.json` do Git como queda).
- **Critérios de Aceitação:** texto coerente com a fonte nova.
- **Depende de:** MIGRAR-TAREFAS-API.24

### MIGRAR-TAREFAS-API.27 — Demais regras que citam `STATUS.md` (gerenciador, MCP, Jev, níveis, memória, rules-local, visualizador, regra maior)

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Trocar cada referência pelo caminho certo (API ou `db.json` do Git), sem mudar o sentido da regra.
- **Critérios de Aceitação:** `grep STATUS.md regras/` só acha menções históricas.
- **Depende de:** MIGRAR-TAREFAS-API.24

### MIGRAR-TAREFAS-API.28 — Regerar `dist/REGRAS-GLOBAIS.md` e `VERSAO.md` (`sincronizar.mjs` sem `--aplicar`)

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** LEVE — só texto e configuração, sem lógica
- **Modelo:** só Haiku ou DeepSeek — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Rodar o script e conferir o relatório.
- **Critérios de Aceitação:** versão nova gravada; `--aplicar` fica para o usuário.
- **Depende de:** MIGRAR-TAREFAS-API.25, MIGRAR-TAREFAS-API.26, MIGRAR-TAREFAS-API.27

### MIGRAR-TAREFAS-API.29 — `AGENTS.md`, `STATUS_PROJETO.md` e `api/README.md` com a fonte nova

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** LEVE — só texto e configuração, sem lógica
- **Modelo:** só Haiku ou DeepSeek — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Descrever a API como fonte, a leitura de queda pelo `db.json`, o rollback e como subir.
- **Critérios de Aceitação:** docs conferem com as regras.
- **Depende de:** MIGRAR-TAREFAS-API.28

### MIGRAR-TAREFAS-API.30 — Plano de rollback documentado e conferido

**Próximo passo:** aguardar as dependências.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Passo a passo para voltar aos `.md` pelo Git (tag `tasks-md-antes-da-api`, `git revert` e reimportação) com ensaio em cópia.
- **Critérios de Aceitação:** rollback descrito e ensaiado em cópia.
- **Depende de:** MIGRAR-TAREFAS-API.78
- **Mudança (2026-10-24):** a fonte do quadro passou do json-server para tabelas no Supabase com Realtime e RPC (ver "Mudança de escopo" desta etapa); onde esta seção citar `api/db.json`, `/tarefas` ou json-server, vale o Supabase.

### MIGRAR-TAREFAS-API.31 — Ensaio do corte: ciclo completo de uma tarefa de teste pela API

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** PESADO — arquitetura, mudança em massa ou regra global
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Criar, reservar, entregar e fechar uma tarefa de teste só pela API; conferir o `db.json`.
- **Critérios de Aceitação:** ciclo completo sem tocar no `STATUS.md` à mão.
- **Depende de:** MIGRAR-TAREFAS-API.18, MIGRAR-TAREFAS-API.25

### MIGRAR-TAREFAS-API.32 — Corte: avisar as frentes pela API e passar a ler só da API

**Próximo passo:** aguardar as dependências.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Registrar na coleção `recados` o aviso a todas as frentes ("a fonte agora é a API; `STATUS.md` deixa de ser editado") e passar os leitores a só a API; sem tocar nos `.md`.
- **Critérios de Aceitação:** aviso publicado na API; nenhuma frente edita `.md` de tarefa.
- **Depende de:** MIGRAR-TAREFAS-API.31

### MIGRAR-TAREFAS-API.33 — Rodar `node scripts/sincronizar.mjs --aplicar` e conferir nas IAs

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** LEVE — ação que só o usuário pode fazer
- **Modelo:** Usuário — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Levar as regras novas às IAs e aos projetos.
- **Critérios de Aceitação:** regras novas valendo nas IAs.
- **Depende de:** MIGRAR-TAREFAS-API.29

### MIGRAR-TAREFAS-API.34 — `aulasenai`: deixar com status Aguardando e remover da lista de monitorados

**Próximo passo:** ❌ cancelada em 2026-10-23 19:58 (resposta P7: o `aulasenai` não fica aguardando).

- **Nível:** LEVE — só texto e configuração, sem lógica
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Para `aulasenai` (o maior quadro, 800+ subtarefas): gravar na coleção `projetos` `status: aguardando` e `monitorado: false`, com o motivo "migração para a API"; tirar da lista monitorada (`projetos` de `scripts/gerenciador.config.json`, `dashboard/projetos.json` e a descoberta do MCP); o quadro do próprio projeto não é tocado.
- **Critérios de Aceitação:** projeto fora da lista, `status` aguardando na API, nenhum arquivo do projeto alterado.
- **Depende de:** MIGRAR-TAREFAS-API.12

### MIGRAR-TAREFAS-API.35 — `aulas-senai-*`: deixar com status Aguardando e remover da lista de monitorados

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** LEVE — só texto e configuração, sem lógica
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Para clones `aulas-senai-CLAUDE-HAIKU/SONNET/OPUS/OPUS-LIDER` (padrão `aulas-senai-*`): gravar na coleção `projetos` `status: aguardando` e `monitorado: false`, com o motivo "migração para a API"; tirar da lista monitorada (`projetos` de `scripts/gerenciador.config.json`, `dashboard/projetos.json` e a descoberta do MCP); o quadro do próprio projeto não é tocado.
- **Critérios de Aceitação:** projeto fora da lista, `status` aguardando na API, nenhum arquivo do projeto alterado.
- **Depende de:** MIGRAR-TAREFAS-API.12

### MIGRAR-TAREFAS-API.36 — `dashboard-ai-*`: deixar com status Aguardando e remover da lista de monitorados

**Próximo passo:** ❌ cancelada em 2026-10-23 20:10 (o `dashboard-ai` é filho: tem as tarefas na API, não fica Aguardando).

- **Nível:** LEVE — só texto e configuração, sem lógica
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Para `dashboard-ai` e as cópias `dashboard-ai-*` (padrão `dashboard-ai-*`): gravar na coleção `projetos` `status: aguardando` e `monitorado: false`, com o motivo "migração para a API"; tirar da lista monitorada (`projetos` de `scripts/gerenciador.config.json`, `dashboard/projetos.json` e a descoberta do MCP); o quadro do próprio projeto não é tocado.
- **Critérios de Aceitação:** projeto fora da lista, `status` aguardando na API, nenhum arquivo do projeto alterado.
- **Depende de:** MIGRAR-TAREFAS-API.12

### MIGRAR-TAREFAS-API.37 — `DASHBOARD-AI-PRINCIPAL`: deixar com status Aguardando e remover da lista de monitorados

**Próximo passo:** ❌ cancelada em 2026-10-23 20:10 (o `dashboard-ai` é filho: tem as tarefas na API, não fica Aguardando).

- **Nível:** LEVE — só texto e configuração, sem lógica
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Para `DASHBOARD-AI-PRINCIPAL`: gravar na coleção `projetos` `status: aguardando` e `monitorado: false`, com o motivo "migração para a API"; tirar da lista monitorada (`projetos` de `scripts/gerenciador.config.json`, `dashboard/projetos.json` e a descoberta do MCP); o quadro do próprio projeto não é tocado.
- **Critérios de Aceitação:** projeto fora da lista, `status` aguardando na API, nenhum arquivo do projeto alterado.
- **Depende de:** MIGRAR-TAREFAS-API.12

### MIGRAR-TAREFAS-API.38 — `REA-APP-CLONES`: deixar com status Aguardando e remover da lista de monitorados

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** LEVE — só texto e configuração, sem lógica
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Para `REA-APP-CLONES`: gravar na coleção `projetos` `status: aguardando` e `monitorado: false`, com o motivo "migração para a API"; tirar da lista monitorada (`projetos` de `scripts/gerenciador.config.json`, `dashboard/projetos.json` e a descoberta do MCP); o quadro do próprio projeto não é tocado.
- **Critérios de Aceitação:** projeto fora da lista, `status` aguardando na API, nenhum arquivo do projeto alterado.
- **Depende de:** MIGRAR-TAREFAS-API.12

### MIGRAR-TAREFAS-API.39 — `projeto-frontend-com-testes`: deixar com status Aguardando e remover da lista de monitorados

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** LEVE — só texto e configuração, sem lógica
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Para `projeto-frontend-com-testes`: gravar na coleção `projetos` `status: aguardando` e `monitorado: false`, com o motivo "migração para a API"; tirar da lista monitorada (`projetos` de `scripts/gerenciador.config.json`, `dashboard/projetos.json` e a descoberta do MCP); o quadro do próprio projeto não é tocado.
- **Critérios de Aceitação:** projeto fora da lista, `status` aguardando na API, nenhum arquivo do projeto alterado.
- **Depende de:** MIGRAR-TAREFAS-API.12

### MIGRAR-TAREFAS-API.40 — `testes-de-frontend`: deixar com status Aguardando e remover da lista de monitorados

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** LEVE — só texto e configuração, sem lógica
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Para `testes-de-frontend`: gravar na coleção `projetos` `status: aguardando` e `monitorado: false`, com o motivo "migração para a API"; tirar da lista monitorada (`projetos` de `scripts/gerenciador.config.json`, `dashboard/projetos.json` e a descoberta do MCP); o quadro do próprio projeto não é tocado.
- **Critérios de Aceitação:** projeto fora da lista, `status` aguardando na API, nenhum arquivo do projeto alterado.
- **Depende de:** MIGRAR-TAREFAS-API.12

### MIGRAR-TAREFAS-API.41 — `gerenciador-de-ia`: deixar com status Aguardando e remover da lista de monitorados

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** LEVE — só texto e configuração, sem lógica
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Para `gerenciador-de-ia`: gravar na coleção `projetos` `status: aguardando` e `monitorado: false`, com o motivo "migração para a API"; tirar da lista monitorada (`projetos` de `scripts/gerenciador.config.json`, `dashboard/projetos.json` e a descoberta do MCP); o quadro do próprio projeto não é tocado.
- **Critérios de Aceitação:** projeto fora da lista, `status` aguardando na API, nenhum arquivo do projeto alterado.
- **Depende de:** MIGRAR-TAREFAS-API.12

### MIGRAR-TAREFAS-API.42 — Conferir a lista de monitorados: só `rules-ai` (mãe), `aulasenai` e `dashboard-ai` (filhos) ficaram

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** `gerenciador.mjs ver`, `task_list` do MCP e `dashboard/projetos.json` só mostram o `rules-ai`, o `aulasenai` e o `dashboard-ai`; cada projeto removido aparece na API como `aguardando` (INV-6).
- **Critérios de Aceitação:** só `rules-ai`, `aulasenai` e `dashboard-ai` monitorados; todos os outros `aguardando`.
- **Depende de:** MIGRAR-TAREFAS-API.35, MIGRAR-TAREFAS-API.38, MIGRAR-TAREFAS-API.39, MIGRAR-TAREFAS-API.40, MIGRAR-TAREFAS-API.41

### MIGRAR-TAREFAS-API.43 — Fechamento: `STATUS_PROJETO.md`, grafo e mover a tarefa para `task_complete.md`

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** LEVE — só texto e configuração, sem lógica
- **Modelo:** só Haiku ou DeepSeek — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Entrada no histórico, atualização do grafo (regra graphify) e fechamento pelo ciclo da task.
- **Critérios de Aceitação:** mãe e subtarefas concluídas.
- **Depende de:** MIGRAR-TAREFAS-API.42, MIGRAR-TAREFAS-API.33

### MIGRAR-TAREFAS-API.44 — Tag de segurança do Git antes de apagar (`tasks-md-antes-da-api`)

**Próximo passo:** aguardar as dependências.

- **Nível:** LEVE — só texto e configuração, sem lógica
- **Modelo:** só Haiku ou DeepSeek — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Criar a tag no commit atual (`git tag tasks-md-antes-da-api`) e enviá-la (`git push origin tasks-md-antes-da-api`); sem branch.
- **Critérios de Aceitação:** tag existe no remoto.
- **Depende de:** MIGRAR-TAREFAS-API.31

### MIGRAR-TAREFAS-API.45 — Conferência de perda zero: todo texto de `tasks/**/*.md` está na API (INV-7)

**Próximo passo:** aguardar as dependências.

- **Nível:** PESADO — arquitetura, mudança em massa ou regra global
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Script de invariante que compara cada tabela, seção e subtarefa dos `.md` com o campo da API; zero diferença antes de qualquer apagamento.
- **Critérios de Aceitação:** relatório sem diferença; script no `api/`.
- **Depende de:** MIGRAR-TAREFAS-API.10, MIGRAR-TAREFAS-API.78
- **Mudança (2026-10-24):** a fonte do quadro passou do json-server para tabelas no Supabase com Realtime e RPC (ver "Mudança de escopo" desta etapa); onde esta seção citar `api/db.json`, `/tarefas` ou json-server, vale o Supabase.

### MIGRAR-TAREFAS-API.46 — Confirmar a lista exata dos arquivos `.md` a apagar

**Próximo passo:** aguardar as dependências.

- **Nível:** LEVE — ação que só o usuário pode fazer
- **Modelo:** Usuário — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** O usuário confirma o alvo exato: `tasks/STATUS.md`, `tasks/task_complete.md`, `tasks/RECADOS.md` e `tasks/etapas/*.md`; `tasks/GERENCIADOR-HERDR/*.md` fica fora do apagamento (decisão do usuário); diz o que fazer com `tasks/.sessao-ativa`.
- **Critérios de Aceitação:** lista confirmada por escrito nas Decisões.
- **Depende de:** MIGRAR-TAREFAS-API.45

### MIGRAR-TAREFAS-API.47 — Apagar do `rules-ai` os `.md` de tarefa

**Próximo passo:** aguardar as dependências.

- **Nível:** PESADO — arquitetura, mudança em massa ou regra global
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Apagar exatamente os arquivos confirmados na .46, com commit e push; só depois da tag (.44), da conferência (.45) e do corte (.32).
- **Critérios de Aceitação:** `find tasks -name '*.md'` não acha tarefa; histórico no Git.
- **Depende de:** MIGRAR-TAREFAS-API.32, MIGRAR-TAREFAS-API.44, MIGRAR-TAREFAS-API.46

### MIGRAR-TAREFAS-API.48 — Conferir que não sobrou tarefa em markdown e que leitores e regras apontam para a API

**Próximo passo:** aguardar as dependências.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** `find`/`grep` em `rules-ai`: nenhum `.md` de tarefa; nenhum leitor, script ou regra aponta para `tasks/STATUS.md`.
- **Critérios de Aceitação:** zero ocorrência fora de menções históricas.
- **Depende de:** MIGRAR-TAREFAS-API.47, MIGRAR-TAREFAS-API.49, MIGRAR-TAREFAS-API.50, MIGRAR-TAREFAS-API.51, MIGRAR-TAREFAS-API.52

### MIGRAR-TAREFAS-API.49 — Scripts de proteção da memória (`ai-memory-invariantes`, `ai-memory-auditar`, `instalar-ai-memory`) param de ler `tasks/*.md`

**Próximo passo:** aguardar as dependências.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Adaptar os 3 scripts que usam o quadro (achados no inventário `api/INVENTARIO-LEITORES.md`) para a API; `tasks/` fica fora do `ignore_paths` da memória só se ainda existir.
- **Critérios de Aceitação:** os 3 scripts rodam sem `tasks/STATUS.md`.
- **Depende de:** MIGRAR-TAREFAS-API.14

### MIGRAR-TAREFAS-API.50 — `.gitignore` e trava `tasks/.sessao-ativa` (AGENTS.md) sem depender de `tasks/*.md`

**Próximo passo:** aguardar as dependências.

- **Nível:** LEVE — só texto e configuração, sem lógica
- **Modelo:** só Haiku ou DeepSeek — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Ajustar o `.gitignore` e o texto da trava de sessão do `AGENTS.md` para o novo desenho (a trava passa para a API ou para um arquivo que não é markdown; decisão registrada).
- **Critérios de Aceitação:** `AGENTS.md` e `.gitignore` coerentes com a API.
- **Depende de:** MIGRAR-TAREFAS-API.25

### MIGRAR-TAREFAS-API.51 — Gate `spec/verificar-spec.mjs` lê as etapas da API em vez de `tasks/etapas`

**Próximo passo:** aguardar as dependências.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** O gate da C34 passa a ler a coleção `etapas` (com `--arquivo` só para os projetos que ainda usam `.md`).
- **Critérios de Aceitação:** o gate dá o mesmo resultado nas etapas migradas.
- **Depende de:** MIGRAR-TAREFAS-API.10, MIGRAR-TAREFAS-API.71

### MIGRAR-TAREFAS-API.52 — Aposentar o json-server e o `api/` (db.json, migradores Node, `gerar-db.mjs`) depois do corte

**Próximo passo:** aguardar as dependências.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Depois da .47, remover o gerador que lê o quadro em markdown (a carga `.7` já está feita) e ajustar o README e o `package.json` da `api/`.
- **Critérios de Aceitação:** `npm run gerar` removido; `api/` só sobe a API.
- **Depende de:** MIGRAR-TAREFAS-API.47
- **Mudança (2026-10-24):** a fonte do quadro passou do json-server para tabelas no Supabase com Realtime e RPC (ver "Mudança de escopo" desta etapa); onde esta seção citar `api/db.json`, `/tarefas` ou json-server, vale o Supabase.

### MIGRAR-TAREFAS-API.53 — Armazenamento multi-projeto: um `db.json` por projeto ou um só (volume do aulasenai)

**Próximo passo:** concluída; a opção B aguarda a aprovação do usuário (lançador próprio só quando o aulasenai entrar, .54).

- **Nível:** PESADO — arquitetura, mudança em massa ou regra global
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Com base no `api/SCHEMA.md` (.4): decidir e documentar como a API guarda as tarefas de vários projetos (campo `projeto`, ids compostos, um arquivo por projeto ou único), considerando o aulasenai (~1.440 linhas de quadro e ~430 etapas) no tamanho e no diff do Git.
- **Critérios de Aceitação:** decisão escrita e aprovada; json-server continua a única dependência.
- **Depende de:** MIGRAR-TAREFAS-API.4
- **Entrega:** commit "chore(MIGRAR-TAREFAS-API.53)" (api/ARMAZENAMENTO.md)
- **Verificação:** números conferidos por comando (aulasenai: STATUS ~2.182 linhas e ~510 etapas; rules-ai ~53 etapas); sem segredo
- **Anotação:** decisão recomendada: opção B (api/dados/<projeto>.json, um processo, uma porta, fila serial de reservas e trava de PID); só com o rules-ai o npm start comum atende, o lançador próprio só entra com o aulasenai; em aberto para o usuário: aprovar a opção B e a pasta api/dados/; dados dos filhos no Git do rules-ai (proposto); aceitar ~4 MB do aulasenai regravados a cada entrega; roteamento de vários routers do json-server 0.17 no mesmo Express ainda não testado

### MIGRAR-TAREFAS-API.54 — `aulasenai`: carga das tarefas abertas (`STATUS.md`) na API do rules-ai

**Próximo passo:** ❌ cancelada em 2026-10-24 08:49 (o seed em Python (.76/.78) cobre os dois projetos; plano aprovado em 2026-10-24)

- **Nível:** PESADO — arquitetura, mudança em massa ou regra global
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Importador idempotente do `STATUS.md` do aulasenai para a coleção `tarefas` com `projeto: aulasenai`; só roda depois do corte do `rules-ai` (.48).
- **Critérios de Aceitação:** todas as linhas abertas do aulasenai na API, ids únicos por projeto.
- **Depende de:** MIGRAR-TAREFAS-API.48, MIGRAR-TAREFAS-API.53

### MIGRAR-TAREFAS-API.55 — `aulasenai`: carga das tarefas concluídas (`task_complete.md`)

**Próximo passo:** ❌ cancelada em 2026-10-24 08:49 (o seed em Python (.76/.78) cobre os dois projetos; plano aprovado em 2026-10-24)

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Mesma carga para as linhas concluídas.
- **Critérios de Aceitação:** contagem igual à do `task_complete.md` do aulasenai.
- **Depende de:** MIGRAR-TAREFAS-API.54

### MIGRAR-TAREFAS-API.56 — `aulasenai`: carga do texto completo das ~430 etapas na API

**Próximo passo:** ❌ cancelada em 2026-10-24 08:49 (o seed em Python (.76/.78) cobre os dois projetos; plano aprovado em 2026-10-24)

- **Nível:** PESADO — arquitetura, mudança em massa ou regra global
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Importar cada etapa do aulasenai para a coleção `etapas` (`projeto: aulasenai`), com todas as seções e subtarefas.
- **Critérios de Aceitação:** toda etapa e subtarefa com texto completo na API.
- **Depende de:** MIGRAR-TAREFAS-API.54

### MIGRAR-TAREFAS-API.57 — `aulasenai`: conferência de perda zero (paridade, ids, idempotência, texto)

**Próximo passo:** aguardar as dependências.

- **Nível:** PESADO — arquitetura, mudança em massa ou regra global
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Script de invariante (INV-1, INV-2, INV-5, INV-7) para o aulasenai antes de qualquer apagamento.
- **Critérios de Aceitação:** zero diferença; carga repetida não muda nada.
- **Depende de:** MIGRAR-TAREFAS-API.78
- **Mudança (2026-10-24):** a fonte do quadro passou do json-server para tabelas no Supabase com Realtime e RPC (ver "Mudança de escopo" desta etapa); onde esta seção citar `api/db.json`, `/tarefas` ou json-server, vale o Supabase.

### MIGRAR-TAREFAS-API.58 — `aulasenai`: regras do projeto e hooks passam a usar a API

**Próximo passo:** aguardar as dependências.

- **Nível:** PESADO — arquitetura, mudança em massa ou regra global
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Adaptar `AGENTS.md`, `.claude/rules/tasks/*`, `.claude/rules/niveis.md`, `essentials.md` e os hooks `scripts/claude-hooks` (bloqueio de reserva por modelo) para reservar e entregar pela API do `rules-ai`; sem escrever no aulasenai à mão (mudança feita na sessão do aulasenai).
- **Critérios de Aceitação:** regras do aulasenai sem contradição com as do `rules-ai`; hooks leem a API.
- **Depende de:** MIGRAR-TAREFAS-API.57

### MIGRAR-TAREFAS-API.59 — `aulasenai`: skills, agentes e scripts (`liderar-equipe`, `proxima-task`, `verify`, `entregar`, `classificar-tarefa`, gerador do visualizador) leem a API

**Próximo passo:** aguardar as dependências.

- **Nível:** PESADO — arquitetura, mudança em massa ou regra global
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Trocar a leitura do `STATUS.md` e das etapas pelos endpoints da API (com `db.json` do Git na nuvem).
- **Critérios de Aceitação:** cada skill e script roda contra a API.
- **Depende de:** MIGRAR-TAREFAS-API.57

### MIGRAR-TAREFAS-API.60 — `aulasenai`: sessões de nuvem leem o Supabase com a chave `anon` (só leitura)

**Próximo passo:** aguardar as dependências.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Definir de onde a nuvem lê (URL do `api/db.json` em `Gelvazio/rules-ai`), que ela não reserva nem entrega, e como avisa o usuário quando precisa de ação local.
- **Critérios de Aceitação:** nuvem consulta e não grava; texto da regra pronto.
- **Depende de:** MIGRAR-TAREFAS-API.78
- **Mudança (2026-10-24):** a fonte do quadro passou do json-server para tabelas no Supabase com Realtime e RPC (ver "Mudança de escopo" desta etapa); onde esta seção citar `api/db.json`, `/tarefas` ou json-server, vale o Supabase.

### MIGRAR-TAREFAS-API.61 — `aulasenai`: ensaio do ciclo completo pela API (tarefa de teste)

**Próximo passo:** aguardar as dependências.

- **Nível:** PESADO — arquitetura, mudança em massa ou regra global
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Criar, reservar, entregar e fechar uma tarefa de teste do aulasenai só pela API.
- **Critérios de Aceitação:** ciclo completo sem tocar no `STATUS.md` do aulasenai.
- **Depende de:** MIGRAR-TAREFAS-API.58, MIGRAR-TAREFAS-API.59

### MIGRAR-TAREFAS-API.62 — `aulasenai`: confirmar a lista exata dos `.md` a apagar

**Próximo passo:** aguardar as dependências.

- **Nível:** LEVE — ação que só o usuário pode fazer
- **Modelo:** Usuário — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** O usuário confirma o alvo exato (`tasks/STATUS.md`, `task_complete.md`, `RECADOS.md`, `tasks/etapas/*.md` e o que mais o aulasenai tiver de tarefa).
- **Critérios de Aceitação:** lista confirmada por escrito.
- **Depende de:** MIGRAR-TAREFAS-API.57

### MIGRAR-TAREFAS-API.63 — `aulasenai`: tag de segurança e apagar os `.md` de tarefa

**Próximo passo:** aguardar as dependências.

- **Nível:** PESADO — arquitetura, mudança em massa ou regra global
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Tag `tasks-md-antes-da-api` no aulasenai e apagamento do alvo confirmado, com commit e push; só depois da .57, do ensaio .61 e da confirmação .62.
- **Critérios de Aceitação:** nenhum `.md` de tarefa no aulasenai; histórico no Git.
- **Depende de:** MIGRAR-TAREFAS-API.61, MIGRAR-TAREFAS-API.62

### MIGRAR-TAREFAS-API.64 — `aulasenai`: sincronização de tasks do `rules-local` (C36) cria a TASK na API

**Próximo passo:** aguardar as dependências.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Ajustar `regras/rules-local.md` e o `sessao.mjs` do pacote para criar a TASK `RL-…` na API do `rules-ai` em vez de no `STATUS.md` do projeto.
- **Critérios de Aceitação:** regra coerente; pacote do rules-local atualizado.
- **Depende de:** MIGRAR-TAREFAS-API.58

### MIGRAR-TAREFAS-API.65 — `dashboard-ai` (DASHBOARD-AI-PRINCIPAL e cópias): carga das tarefas e etapas na API

**Próximo passo:** ❌ cancelada em 2026-10-24 08:42 (pedido do usuário: migrar apenas `aulasenai` e `rules-ai`; o `dashboard-ai` não entra)

- **Nível:** PESADO — arquitetura, mudança em massa ou regra global
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Importar `tasks/STATUS.md`, `task_complete.md` e as etapas do dashboard-ai com `projeto: dashboard-ai`; depois do corte do `rules-ai` (.48).
- **Critérios de Aceitação:** tudo na API, ids únicos por projeto.
- **Depende de:** MIGRAR-TAREFAS-API.48, MIGRAR-TAREFAS-API.53

### MIGRAR-TAREFAS-API.66 — `dashboard-ai`: conferência de perda zero

**Próximo passo:** ❌ cancelada em 2026-10-24 08:42 (pedido do usuário: migrar apenas `aulasenai` e `rules-ai`; o `dashboard-ai` não entra)

- **Nível:** PESADO — arquitetura, mudança em massa ou regra global
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Mesmo script de invariante para o dashboard-ai.
- **Critérios de Aceitação:** zero diferença.
- **Depende de:** MIGRAR-TAREFAS-API.65

### MIGRAR-TAREFAS-API.67 — `dashboard-ai`: `AGENTS.md`, regras, scripts, hooks e worker usam a API

**Próximo passo:** ❌ cancelada em 2026-10-24 08:42 (pedido do usuário: migrar apenas `aulasenai` e `rules-ai`; o `dashboard-ai` não entra)

- **Nível:** PESADO — arquitetura, mudança em massa ou regra global
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Adaptar o que lê o quadro no dashboard-ai (`AGENTS.md`, `.claude/rules`, `rules-local`, worker LangGraph, `api/`) para a API do `rules-ai`; avaliar o que o app Supabase do dashboard-ai mostra de tarefas e se passa a ler a API (decisão registrada).
- **Critérios de Aceitação:** regras e código sem leitura de `tasks/*.md`.
- **Depende de:** MIGRAR-TAREFAS-API.66

### MIGRAR-TAREFAS-API.68 — `dashboard-ai`: confirmar a lista exata dos `.md` a apagar

**Próximo passo:** ❌ cancelada em 2026-10-24 08:42 (pedido do usuário: migrar apenas `aulasenai` e `rules-ai`; o `dashboard-ai` não entra)

- **Nível:** LEVE — ação que só o usuário pode fazer
- **Modelo:** Usuário — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** O usuário confirma o alvo exato do apagamento no dashboard-ai.
- **Critérios de Aceitação:** lista confirmada por escrito.
- **Depende de:** MIGRAR-TAREFAS-API.66

### MIGRAR-TAREFAS-API.69 — `dashboard-ai`: tag de segurança e apagar os `.md` de tarefa

**Próximo passo:** ❌ cancelada em 2026-10-24 08:42 (pedido do usuário: migrar apenas `aulasenai` e `rules-ai`; o `dashboard-ai` não entra)

- **Nível:** PESADO — arquitetura, mudança em massa ou regra global
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Tag `tasks-md-antes-da-api` e apagamento do alvo confirmado, com commit e push.
- **Critérios de Aceitação:** nenhum `.md` de tarefa no dashboard-ai; histórico no Git.
- **Depende de:** MIGRAR-TAREFAS-API.67, MIGRAR-TAREFAS-API.68

### MIGRAR-TAREFAS-API.70 — Fechamento dos filhos: monitorados = `rules-ai` (mãe), `aulasenai` e `dashboard-ai` (filhos)

**Próximo passo:** aguardar as dependências.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Conferir a coleção `projetos`, o `gerenciador.mjs ver`, o MCP e o `dashboard/projetos.json`: os três monitorados, os demais aguardando; nenhuma tarefa em markdown nos três.
- **Critérios de Aceitação:** listas conferidas por comando.
- **Depende de:** MIGRAR-TAREFAS-API.42, MIGRAR-TAREFAS-API.63

### MIGRAR-TAREFAS-API.71 — Atualizar o `api/SCHEMA.md`: coleções `requisitos`, `invariantes` e `perguntas`, opção B e bloqueios

**Próximo passo:** concluída; a .10 carrega as etapas nas coleções novas e a .13 decide o 409 pergunta_aberta e a rota /<projeto>/operacoes

- **Nível:** PESADO — arquitetura: contrato do schema
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** atualizar `api/SCHEMA.md` com as respostas do usuário: (a) as tabelas internas das etapas viram coleções `requisitos`, `invariantes` e `perguntas` (campos, chave composta `<projeto>:<etapa>:<id>`, relação com `etapas` e com as subtarefas que cobrem); (b) opção B decidida (item 7.1.6): `api/dados/<projeto>.json` e `api/dados/_projetos.json`; (c) coleção `bloqueios` mantida; (d) id por hash aceito; (e) o que a .6 trouxe (operações `recarregar`, checagem de `mtime`); (f) atualizar o mapeamento de INV-1..INV-7 e R1.1..R7.1.
- **Critérios de Aceitação:** SCHEMA.md coerente com as decisões da etapa; toda seção da etapa (inclusive tabelas internas) tem coleção ou campo.
- **Depende de:** MIGRAR-TAREFAS-API.4
- **Entrega:** commit "docs(MIGRAR-TAREFAS-API.71)" (api/SCHEMA.md)
- **Verificação:** seções das 3 coleções novas, opção B, bloqueios, motivo, recarregar e mtime conferidas por grep; sem segredo
- **Anotação:** em aberto: 409 pergunta_aberta no reservar e a rota com prefixo de projeto (decidir na .13); CONCORRENCIA.md ainda cita db.json e /operacoes sem prefixo; etapas sem Tarefa; roteamento de vários routers do json-server ainda não testado (.54)

### MIGRAR-TAREFAS-API.72 — Revisar as 165 subtarefas só-de-etapa do `rules-ai` ("Pendente de revisão")

**Próximo passo:** aguardar as dependências e pegar a subtarefa (livre, do modelo certo).

- **Nível:** PESADO — mudança em massa de status (165 registros) com decisão por evidência
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** a carga das etapas (.10) criou 165 tarefas em `api/dados/rules-ai.json` que só existiam na seção da etapa, sem linha no quadro (`extras["Origem da carga"]`), todas como `👀 Pendente de revisão`. Para cada uma, ler a seção da etapa (Entrega, Verificação, Próximo passo) e os commits citados e definir o status real: `concluido` (com a evidência), `cancelada`, `pendente` ou deixar `👀` com o motivo. Gravar a decisão pelo importador ou por script de revisão idempotente (nunca editar o JSON à mão) e registrar um resumo por mãe nas Decisões da etapa. Sem evidência clara, a tarefa fica `👀`, nunca `concluido` por palpite.
- **Critérios de Aceitação:** nenhuma das 165 fica sem decisão registrada; as que viram `concluido` têm a evidência em `entrega`/`verificacao`; contagem por status conferida por comando; segunda rodada sem mudança.
- **Depende de:** MIGRAR-TAREFAS-API.78
- **Mudança (2026-10-24):** a fonte do quadro passou do json-server para tabelas no Supabase com Realtime e RPC (ver "Mudança de escopo" desta etapa); onde esta seção citar `api/db.json`, `/tarefas` ou json-server, vale o Supabase.

### MIGRAR-TAREFAS-API.73 — Revisar as 304 subtarefas só-de-etapa do `aulasenai` ("Pendente de revisão")

**Próximo passo:** aguardar as dependências e pegar a subtarefa (livre, do modelo certo).

- **Nível:** PESADO — mudança em massa de status (304 registros) com decisão por evidência
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** a carga das etapas (.10) criou 304 tarefas em `api/dados/aulasenai.json` que só existiam na seção da etapa, sem linha no quadro (`extras["Origem da carga"]`), todas como `👀 Pendente de revisão`. Para cada uma, ler a seção da etapa (Entrega, Verificação, Próximo passo) e os commits citados e definir o status real: `concluido` (com a evidência), `cancelada`, `pendente` ou deixar `👀` com o motivo. Gravar a decisão pelo importador ou por script de revisão idempotente (nunca editar o JSON à mão) e registrar um resumo por mãe nas Decisões da etapa. Sem evidência clara, a tarefa fica `👀`, nunca `concluido` por palpite.
- **Critérios de Aceitação:** nenhuma das 304 fica sem decisão registrada; as que viram `concluido` têm a evidência em `entrega`/`verificacao`; contagem por status conferida por comando; segunda rodada sem mudança.
- **Depende de:** MIGRAR-TAREFAS-API.78
- **Mudança (2026-10-24):** a fonte do quadro passou do json-server para tabelas no Supabase com Realtime e RPC (ver "Mudança de escopo" desta etapa); onde esta seção citar `api/db.json`, `/tarefas` ou json-server, vale o Supabase.

### MIGRAR-TAREFAS-API.74 — SQL do quadro no Supabase: tabelas, índices, RLS de leitura (anon) e publicação Realtime (`database/quadro/`)

**Próximo passo:** aguardar as dependências.

- **Nível:** PESADO — banco, segurança e mudança em massa
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** escrever os arquivos SQL (sem aplicar) das tabelas do SCHEMA (`tarefas`, `etapas`, `frentes`, `decisoes`, `riscos`, `bloqueios`, `pendencias`, `licoes`, `recados`, `requisitos`, `invariantes`, `perguntas`, `projetos`), chaves `<projeto>:<codigo>`, índices, RLS (leitura `anon`; nenhuma escrita direta por `anon`/`authenticated`) e `alter publication supabase_realtime add table ...`.
- **Critérios de Aceitação:** SQL idempotente (`if not exists`/`create or replace`), sem segredo nem dado pessoal; `anon` só `select`; todas as tabelas no Realtime; revisado linha a linha antes de aplicar.
- **Depende de:** Nenhuma

### MIGRAR-TAREFAS-API.75 — Funções RPC do quadro: `reservar`, `entregar`, `criar_subtarefa`, `liberar` e `mudar_status` (UPDATE condicional, atômico)

**Próximo passo:** aguardar as dependências.

- **Nível:** PESADO — banco, segurança e mudança em massa
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** funções `security definer` em plpgsql com `UPDATE ... WHERE em_uso_por is null AND dependências concluídas AND modelo certo`, devolvendo conflito em corrida; `entregar` exige entrega e verificação; `criar_subtarefa` só na mãe atual (C26); transições do SCHEMA seção 3; `execute` só para a chave de serviço.
- **Critérios de Aceitação:** duas chamadas simultâneas de `reservar` na mesma subtarefa: uma vence e a outra recebe conflito; `anon` não executa as funções; transições fora da tabela do SCHEMA são recusadas.
- **Depende de:** MIGRAR-TAREFAS-API.74

### MIGRAR-TAREFAS-API.76 — Migrador em Python (`scripts/quadro_seed.py`): lê os `.md` de `rules-ai` e `aulasenai` e cria o seed no Supabase

**Próximo passo:** aguardar as dependências.

- **Nível:** PESADO — banco, segurança e mudança em massa
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** ler `tasks/STATUS.md`, `task_complete.md`, `RECADOS.md` e as etapas (`--projeto`, `--fonte`, `--dry-run`), montar os mesmos registros do SCHEMA (os JSON de `api/dados/` servem de referência) e gravar por upsert idempotente com a chave de serviço lida da variável de ambiente `SUPABASE_SERVICE_KEY`; subtarefas só-de-etapa entram como `👀 Pendente de revisão`; mascarar segredo (INV-4); a chave nunca é impressa nem gravada em arquivo.
- **Critérios de Aceitação:** `--dry-run` não grava; segunda rodada sem mudança; sem chave no código nem no log; contagens iguais às dos JSON de `api/dados/`.
- **Depende de:** MIGRAR-TAREFAS-API.74

### MIGRAR-TAREFAS-API.77 — Aplicar o SQL (.74 e .75) no Supabase `hxlvonriearllcmfqeri` e guardar `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_KEY` em variáveis de ambiente

**Próximo passo:** aguardar as dependências.

- **Nível:** Usuário — só o usuário pode fazer
- **Modelo:** Usuário
- **Effort:** —
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** o usuário confere o SQL, aplica no SQL Editor (ou autoriza a IA a aplicar pelo conector) e define as 3 variáveis de ambiente no computador e nas sessões de nuvem; nenhuma chave entra no Git.
- **Critérios de Aceitação:** tabelas, funções e Realtime existem; variáveis definidas fora do Git.
- **Depende de:** MIGRAR-TAREFAS-API.75

### MIGRAR-TAREFAS-API.78 — Rodar o seed (`rules-ai` e `aulasenai`) e conferir: paridade com os JSON de `api/dados/`, ids únicos e idempotência

**Próximo passo:** aguardar as dependências.

- **Nível:** PESADO — banco, segurança e mudança em massa
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** rodar `quadro_seed.py` nos dois projetos e comparar, campo a campo, o banco com os JSON de `api/dados/`; conferir ids únicos, segunda rodada sem mudança e as 469 subtarefas em `👀 Pendente de revisão`.
- **Critérios de Aceitação:** contagens iguais por coleção e projeto; zero divergência de campo; segunda rodada sem mudança; consulta `anon` lê e não escreve.
- **Depende de:** MIGRAR-TAREFAS-API.76, MIGRAR-TAREFAS-API.77
