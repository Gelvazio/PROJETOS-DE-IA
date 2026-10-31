# Contrato do schema da API como fonte das tarefas (MIGRAR-TAREFAS-API.4, revisado na .71)

Contrato **para aprovação**. Revisado na .71 em 2026-10-23 21:30 com as respostas do usuário das
21:00 (opção B, `bloqueios` mantida, ids por hash aceitos, tabelas das etapas viram coleções) e com a
estratégia da .6 (`CONCORRENCIA.md`: `recarregar`, `mtime`, sem `--watch`). Estende o formato da etapa
049. Define o que os arquivos `api/dados/<projeto>.json` guardam depois do corte, quando
`tasks/STATUS.md`, `tasks/task_complete.md`, `tasks/RECADOS.md` e `tasks/etapas/*.md` deixam de
existir no `rules-ai`. **Ponte antiga:** `api/db.json` e `api/gerar-db.mjs` (etapa 049) são só a
ponte de antes da carga; saem de uso e são aposentados na .52 (o `db.json` atual vira
`api/dados/rules-ai.json` na .5). Levantado em 2026-10-23 a partir de: `gerar-db.mjs`,
`INVENTARIO-LEITORES.md`, `ARMAZENAMENTO.md`, `CONCORRENCIA.md`, `tasks/STATUS.md`,
`tasks/task_complete.md`, as 53 etapas do `rules-ai` e, para os filhos, `aulasenai/tasks/STATUS.md`
e `RECADOS.md`.

Legenda das colunas: **Obrig.** = obrigatório (S/N) · **L/E** = L (só leitura para clientes; quem
grava é o carregador ou o middleware), E (cliente pode gravar por PATCH/operação), LE (os dois).

---

## 1. Visão e regras

1. **Fonte única:** depois do corte, os arquivos `api/dados/<projeto>.json` (opção B, seção 7.1.6) são
   a única fonte de tarefas do `rules-ai` e, da .54 em diante, dos filhos `aulasenai` e
   `dashboard-ai`; a lista de projetos fica em `api/dados/_projetos.json`. Nenhuma tarefa em markdown
   (decisões de 2026-10-23 20:02 e 20:10 da etapa 053). Regras (`regras/*.md`) e documentação
   continuam em markdown: não são tarefa.
2. **json-server 0.17.4 é a única dependência.** O middleware de escrita atômica (`--middlewares`) é
   **1 arquivo** em Node puro, sem pacote novo.
3. **Rede:** a API só escuta em `127.0.0.1`, **um processo e uma porta** (3333). A nuvem **só lê** o
   JSON do Git (`api/dados/<projeto>.json`, somente leitura) e **não reserva**.
4. **`api/dados/*.json` versionados no Git** (revoga a P3 da etapa 049; os dados dos filhos também
   ficam no Git do `rules-ai`): JSON, LF, 2 espaços, ordem de chaves fixa (seção 5). Cada arquivo
   tem **as mesmas coleções**; `projeto` continua em todo registro.
5. **Sem segredo e sem dado pessoal** (INV-4): nada de chave, token, CPF, e-mail. O carregador
   mascara/recusa o que casar com `sk-`, `tsk_`, `Bearer`, `ghp_`, CPF e e-mail.
6. **Cada fato em um lugar só:** dado de subtarefa mora na coleção `tarefas`; a etapa guarda só o
   cabeçalho e as seções gerais. Campos *derivados* são marcados `derivado` e recalculados pelo
   middleware/carregador, nunca digitados.
7. **Texto longo é preservado cru** (perda zero, INV-7): o que não tem campo próprio vai para
   `extras` (objeto `rótulo → texto`) ou `secoes[].texto`; o carregador nunca descarta rótulo.
8. **Cada registro carrega `projeto`** (R7.1), exceto `projetos` e `meta`.
9. **Ids (decisão):** string composta **`<projeto>:<codigo>`** em `tarefas`, `etapas`, `frentes`,
   `decisoes`, `riscos`, `bloqueios`, `pendencias`, `licoes` e `recados`. Justificativa: o json-server
   exige `id` único na coleção; o `codigo` bruto (`SUB-47.3`, `MIGRAR-TAREFAS-API.4`) repete entre
   projetos (o `aulasenai` e o `dashboard-ai` usam numeração própria, ex.: `#293`, `SUB-47`);
   id composto é legível, estável (não muda com a ordem de carga, ao contrário de número
   sequencial), idempotente (R1.2) e permite `GET /tarefas/aulasenai:293.1`. O campo `codigo`
   guarda a parte crua para exibição e `GET /tarefas?projeto=aulasenai`. Repetição dentro do mesmo
   projeto (hoje tratada por `garantirIdsUnicos`) recebe sufixo `#N` no id e `codigo` mantém o
   original, com aviso do carregador. O `:` vai codificado (`%3A`) na URL; o json-server aceita.
   Para linhas sem código natural (frentes, decisões, pendências, lições, recados, riscos,
   bloqueios) o id é `<projeto>:<data-hora ISO ou data>:<hash8 do texto principal>`, estável na
   recarga. **Decidido (usuário, 2026-10-23 21:00): o id por hash do texto foi aceito** nessas
   linhas; editar o texto muda o id (as linhas só se acrescentam). Nas coleções que nascem das
   tabelas das etapas (`requisitos`, `invariantes`, `perguntas`) o id é
   `<projeto>:<etapa>:<id da linha>` (ex.: `rules-ai:ETAPA-053:INV-3`), porque cada linha tem código
   próprio (`R1.1`, `INV-3`, `P1`).
10. **Ordem de exibição:** cada registro de lista tem `ordem` (inteiro, posição na tabela de origem)
    porque a ordem do array no arquivo é por id (seção 5).

---

## 2. Coleções

Chaves: `tarefas`, `etapas`, `requisitos`, `invariantes`, `perguntas`, `frentes`, `decisoes`,
`riscos`, `bloqueios`, `pendencias`, `licoes`, `recados`, `projetos`, `meta`. As três coleções
`requisitos`, `invariantes` e `perguntas` (seções 2.12 a 2.14) nasceram na .71: as tabelas internas
das etapas deixam de ser texto e viram coleções (decisão do usuário, 2026-10-23 21:00, contra a
recomendação de manter texto). A coleção **`bloqueios` foi mantida** (decisão do usuário,
2026-10-23 20:57): a seção `## Bloqueios` (Data | Item | Motivo | O que destrava | Resolvido em)
existe no quadro do `aulasenai` e o contrato não pode perder coluna.

### 2.1 `tarefas` (tabelas "📌 Tarefas" do STATUS.md e de task_complete.md + seções de subtarefa)

Chave: `id` = `<projeto>:<codigo>`. Mãe e subtarefa na mesma coleção (`tipo`).

| Campo | Tipo | Obrig. | L/E | Origem hoje | Exemplo |
|---|---|---|---|---|---|
| id | string | S | L | coluna `Tarefa` (com prefixo do projeto) | `rules-ai:MIGRAR-TAREFAS-API.4` |
| projeto | string (fk `projetos.id`) | S | L | novo (R7.1) | `rules-ai` |
| codigo | string | S | L | coluna `Tarefa` (sem `**`) | `MIGRAR-TAREFAS-API.4` |
| tipo | `mae`\|`sub` | S | L | derivado: sufixo `.N` e negrito na coluna `Tarefa` | `sub` |
| mae | string (fk tarefas.id da mãe) | S | L | derivado do código (mãe aponta para si) | `rules-ai:MIGRAR-TAREFAS-API` |
| titulo | string | S | LE | coluna `Título` (sem `**` e sem sufixo `· \`effort\``) | `Contrato do schema da API...` |
| prioridade | string | S | LE | coluna `Prioridade` | `🟡 Média` |
| modelo | string | S | LE | coluna `Modelo` (texto inteiro) | `PESADO · só Sonnet · effort high` |
| nivel | `LEVE`\|`MEDIO`\|`PESADO`\|null | N | LE | derivado de `Modelo`/`Título`; seção da etapa `- **Nível:**` | `PESADO` |
| nivelMotivo | string\|null | N | LE | seção `- **Nível:**` (texto depois do travessão) | `arquitetura, mudança em massa` |
| effort | `low`\|`medium`\|`high`\|`xhigh`\|null | N | LE | derivado de `Modelo`; seção `- **Effort:**` | `high` |
| modeloSecao | string\|null | N | LE | seção `- **Modelo:**` da etapa (quando diferente da coluna) | `só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro` |
| jevAiSuggestion | `SIM`\|`NAO`\|null | N | LE | seção `- **JEV-AI-SUGGESTION:**` | `NAO` |
| fonteNivel | string\|null | N | LE | seção `- **Fonte:**` (`jev (confiança X)` ou `sinais`) | `jev (confiança 0,86)` |
| dependeDe | string[] (ids de tarefas) | S | LE | coluna `Depende de` + seção `- **Depende de:**` | `["rules-ai:MIGRAR-TAREFAS-API.2"]` |
| dependeDeTexto | string | S | LE | coluna `Depende de` (texto cru: `Nenhuma`, `MAE (todas)`...) | `Nenhuma` |
| status | string | S | LE | coluna `Status` (emoji + 1 a 3 palavras) | `🔄 Em execução` |
| statusCodigo | enum (seção 3) | S | LE | derivado do emoji de `Status` | `em_execucao` |
| emUsoPor | string\|null | N | LE | coluna `Em uso por` (`—` e `— (não reservável)` viram null) | `Claude Code (Sonnet 5.5) (local · main · rules-ai) (desde 2026-10-23 20:02)` |
| reservadoEm | string ISO\|null | N | L (derivado) | data de `(desde ...)` em `Em uso por` | `2026-10-23T20:02:00-03:00` |
| travaEspecial | boolean | S | LE | `🔒` em `Status`/`Em uso por` | `false` |
| naoReservavel | boolean | S | L | `— (não reservável)` (mães) | `false` |
| concluida | boolean | S | L (derivado) | `statusCodigo === concluido` | `false` |
| arquivada | boolean | S | L (derivado) | linha mora em task_complete.md (concluida ou cancelada) | `false` |
| disponivel | boolean | S | L (derivado) | calculado: sub, `pendente`, sem reserva/trava, deps concluídas | `true` |
| etapaId | string (fk etapas.id)\|null | N | L | coluna `Etapa` (link `[ETAPA-NNN](etapas/...)`) | `rules-ai:ETAPA-053` |
| etapaArquivo | string\|null | N | L | coluna `Etapa` (nome do arquivo, só rastreio da carga) | `ETAPA-053-a37505cb-MIGRAR-TAREFAS-API.md` |
| proximoPasso | string | N | LE | seção `**Próximo passo:**` | `aguardar as dependências.` |
| descricao | string | N | LE | seção `- **Descrição:**` | `Definir coleções...` |
| criteriosAceitacao | string | N | LE | seção `- **Critérios de Aceitação:**` / `- **Critérios de aceitação:**` | `contrato escrito...` |
| criterioPronto | string | N | LE | seção `- **Critério de pronto:**` | texto |
| arquivos | string[] | N | LE | seção `- **Arquivos:**` | `["api/SCHEMA.md"]` |
| estimativa | string | N | LE | seção `- **Estimativa:**` | `30 min` |
| entrega | string | N | LE | seções `- **Entrega:**` / `- **Entregue:**` | `commit abc1234` |
| verificacao | string | N | LE | seções `- **Verificação:**`, `Verificação (líder)`, `(feita)`, `feita`, `(conferida pelo líder)`, `(OP-4, data)` etc. | `comandos rodados e resultado` |
| verificacaoRotulo | string\|null | N | L | rótulo cru quando tem sufixo (`Verificação (líder)`) | `Verificação (líder)` |
| anotacao | string | N | LE | seção `- **Anotação:**` | texto |
| extras | objeto rótulo→texto | N | LE | qualquer rótulo `- **X:**` sem campo próprio: `Origem`, `Conferido`, `Problema`, `Motivo`, `Correção`, `Versão`, `Versão anterior`, `Versão nova`, `Número da decisão`, `Totais`, `Pedido`, `Entra`, `Não entra` | `{"Origem": "..."}` |
| ordem | inteiro | S | L | posição da linha na tabela (abertas, depois concluídas) | `98` |
| criadaEm | string ISO\|null | N | L | data do commit/seção; null na carga inicial se desconhecida | `2026-10-23T19:49:00-03:00` |
| concluidaEm | string ISO\|null | N | LE | data do commit de entrega (campo novo da escrita; linha do `task_complete.md` não tem coluna de data) | `null` |
| atualizadoEm | string ISO | S | L (middleware) | novo: toda escrita atualiza | `2026-10-23T20:05:00-03:00` |

Os 8 cabeçalhos da tabela estão cobertos: `Tarefa` (id/codigo/tipo/mae), `Título` (titulo),
`Prioridade` (prioridade), `Modelo` (modelo/nivel/effort), `Depende de` (dependeDe/dependeDeTexto),
`Status` (status/statusCodigo), `Em uso por` (emUsoPor/reservadoEm), `Etapa` (etapaId/etapaArquivo).
`concluidaEm`, `criadaEm` e `atualizadoEm` não têm origem hoje (são metadados novos exigidos pela
escrita e pela auditoria); a carga os deixa `null`.

Relações: `mae` → mãe (`tipo=mae`, `mae` = própria `id`); `dependeDe` → outras `tarefas` (mesmo
projeto; dependência a id inexistente fica em `dependeDeTexto` e gera aviso da carga);
`etapaId` → `etapas`; `projeto` → `projetos`.

### 2.2 `etapas` (arquivos `tasks/etapas/ETAPA-*.md`, parte geral)

Chave: `id` = `<projeto>:ETAPA-<NNN>` (o número `NNN` é único por projeto; `hash8` fica em campo).
Etapas antigas sem hash (ex.: `ETAPA-002-ESFORCO-GLOBAL.md`) usam só o número.

| Campo | Tipo | Obrig. | L/E | Origem hoje | Exemplo |
|---|---|---|---|---|---|
| id | string | S | L | nome do arquivo (`ETAPA-NNN`) | `rules-ai:ETAPA-053` |
| projeto | string | S | L | novo | `rules-ai` |
| numero | inteiro | S | L | título `## Etapa NNN-...` | `53` |
| hash | string\|null | N | L | título `## Etapa NNN-<uuid8>` | `a37505cb` |
| arquivo | string | S | L | nome do arquivo (rastreio da carga) | `ETAPA-053-a37505cb-MIGRAR-TAREFAS-API.md` |
| tarefaMae | string (fk tarefas.id) | S | L | `**Tarefa:**` | `rules-ai:MIGRAR-TAREFAS-API` |
| titulo | string | S | LE | título depois do `—`/`:` na linha `## Etapa` | `migrar as tarefas do rules-ai para a API` |
| tituloLinha | string | S | L | linha `## Etapa ...` inteira (perda zero) | `## Etapa 053-... — ...` |
| pedidoEm | string | N | L | `**Pedido em:**` | `2026-10-23 19:49` |
| criadaPor | string | N | L | `**Criada por:**` | `Claude Code (Sonnet 5.5) (local · main · rules-ai)` |
| pedido | string | N | L | `**Pedido:**` (e `**Pedido (data):**`) | texto do usuário |
| objetivo | string | N | LE | `**Objetivo:**` | `as tarefas do rules-ai passam a viver na API` |
| situacao | string\|null | N | LE | `**Situação:**` / `**Status:**` no cabeçalho (etapas antigas) | `✅ concluída em 2026-10-18` |
| ehGrande | boolean | S | L | tem `### Requisitos`/`### Invariantes` (spec C34) | `true` |
| secoes | lista de `{ordem, tipo, titulo, texto, colecao, colunas}` | S | LE | todas as seções `###` que não são subtarefa e o corpo sem título (Escopo, Riscos, Decisões, Requisitos, Invariantes, Perguntas abertas, Entregas desta etapa, Critério de pronto, Validação geral, Casos de borda, `**Entra:**`, `**Não entra:**`, `**Fora do escopo:**`, `**Resultado do inventário:**` etc.). **Sem as tabelas** de Requisitos, Invariantes e Perguntas abertas, que vão para as coleções 2.12 a 2.14 | `{"ordem":1,"tipo":"escopo","titulo":"Escopo","texto":"- **Entra:** ...","colecao":null,"colunas":null}` |
| requisitos | string[] (ids de `requisitos`, em ordem) | S | L (derivado) | tabela da seção `### Requisitos` | `["rules-ai:ETAPA-053:R1.1", "..."]` |
| invariantes | string[] (ids de `invariantes`, em ordem) | S | L (derivado) | tabela da seção `### Invariantes` | `["rules-ai:ETAPA-053:INV-1", "..."]` |
| perguntas | string[] (ids de `perguntas`, em ordem) | S | L (derivado) | tabela ou lista da seção `### Perguntas abertas` | `["rules-ai:ETAPA-053:P1", "..."]` |
| subtarefas | string[] (ids de tarefas, em ordem) | S | L (derivado) | seções `### <TAREFA>.N — título` | `["rules-ai:MIGRAR-TAREFAS-API.1", "..."]` |
| arquivada | boolean | S | L (derivado) | mãe em task_complete.md | `false` |
| ordem | inteiro | S | L | ordem de leitura (por número) | `53` |
| atualizadoEm | string ISO | S | L | novo | `2026-10-23T20:05:00-03:00` |

`secoes[].tipo` é um enum aberto: `escopo`, `riscos`, `decisoes`, `requisitos`, `invariantes`,
`perguntas`, `entregas`, `criterio_pronto`, `validacao`, `casos_borda`, `corpo` (qualquer outro título,
guardado com `titulo` cru). O texto de cada subtarefa **não** é duplicado aqui: está em `tarefas`.
A linha `### TAREFA.N — título` da subtarefa gera `tarefas.titulo` e `etapaId`.

**Tabelas das etapas viram coleções (decisão de 2026-10-23 21:00).** As seções `### Requisitos`,
`### Invariantes` e `### Perguntas abertas` continuam em `secoes` (com `tipo` e `titulo`), mas o
`texto` guarda **só o que está fora da tabela** (introdução, notas, a lista "Casos de borda que o
código precisa sobreviver" etc.), e a tabela vai para `requisitos`, `invariantes` e `perguntas`.
Para a carga não perder texto (INV-7): (a) `secoes[].colecao` diz para onde a tabela foi
(`requisitos`, `invariantes`, `perguntas`) e `secoes[].colunas` guarda o cabeçalho original, na ordem
(permite reimportar para `.md`, R5.1); (b) cada linha lida vira **um** registro e a carga confere
`linhas da tabela = registros criados` (a etapa 053 tem 12 requisitos, 7 invariantes e 8 perguntas),
abortando se diferir; (c) coluna que não tem campo próprio (tabelas antigas variam, ver 2.12 a 2.14)
vai para `extras` do registro, nunca é descartada; (d) a linha crua da tabela fica também no registro
(`linhaCrua`) até o script da .45 provar a paridade, para comparar texto a texto; (e) o `texto` de
`secoes` que sobra deve ser igual ao arquivo menos as linhas da tabela (conferido pelo script da
.45).

### 2.3 `frentes` (tabela "🧭 Frentes de trabalho")

Chave: `id` = `<projeto>:<hash8 de frente>` (a mesma frente tem uma linha por tarefa; a linha é única
por `frente`+`tarefaTexto`).

| Campo | Tipo | Obrig. | L/E | Origem hoje | Exemplo |
|---|---|---|---|---|---|
| id | string | S | L | derivado | `rules-ai:9be1c2d4` |
| projeto | string | S | L | novo | `rules-ai` |
| frente | string | S | LE | coluna `Frente` | `Claude Code (Sonnet 5.5) (local · main · rules-ai)` |
| tarefaTexto | string | S | LE | coluna `Tarefa (etapa)` (texto cru) | `MIGRAR-TAREFAS-API.4 ([ETAPA-053](...))` |
| tarefaIds | string[] (fk tarefas.id) | N | LE | derivado de `Tarefa (etapa)` (pode citar várias: `.9, .10 e .14`) | `["rules-ai:MIGRAR-TAREFAS-API.4"]` |
| situacao | string | S | LE | coluna `Situação` | `🔄 Ativa` / `⏹️ Encerrada` |
| atualizadoEm | string | S | LE | coluna `Atualizado em` | `2026-10-23 20:02` |
| ordem | inteiro | S | L | posição na tabela | `1` |

### 2.4 `decisoes` (tabela "Registro de decisões")

Chave: `id` = `<projeto>:<AAAA-MM-DD HH:MM>:<hash8 da decisão>`.

| Campo | Tipo | Obrig. | L/E | Origem hoje | Exemplo |
|---|---|---|---|---|---|
| id | string | S | L | derivado | `rules-ai:2026-10-23T10:15:ab12cd34` |
| projeto | string | S | L | novo | `rules-ai` |
| data | string | S | LE | coluna `Data` | `2026-10-23 10:15` |
| decisao | string | S | LE | coluna `Decisão` | `C47: o Jev classifica e grava...` |
| quem | string | S | LE | coluna `Quem` | `Usuário (registrado por Claude Code (Sonnet 5.5))` |
| porque | string | S | LE | coluna `Por quê` | `tarefas ainda sem classificação automática` |
| etapaId | string\|null | N | LE | novo (decisão registrada numa etapa específica) | `rules-ai:ETAPA-053` |
| ordem | inteiro | S | L | posição (mais recente no topo) | `1` |

### 2.5 `riscos` (seção `## Riscos`: Risco | Chance | Impacto | Plano B | Situação)

Chave: `id` = `<projeto>:<hash8 do risco>`.

| Campo | Tipo | Obrig. | L/E | Origem hoje | Exemplo |
|---|---|---|---|---|---|
| id | string | S | L | derivado | `aulasenai:7c1d09ee` |
| projeto | string | S | L | novo | `aulasenai` |
| risco | string | S | LE | coluna `Risco` | texto |
| chance | string | N | LE | coluna `Chance` | `Média` |
| impacto | string | N | LE | coluna `Impacto` | `Alto` |
| planoB | string | N | LE | coluna `Plano B` | texto |
| situacao | string | N | LE | coluna `Situação` | `Aberto` |
| ordem | inteiro | S | L | posição | `1` |

### 2.6 `bloqueios` (seção `## Bloqueios`: Data | Item | Motivo | O que destrava | Resolvido em)

Chave: `id` = `<projeto>:<data>:<hash8 do item>`.

| Campo | Tipo | Obrig. | L/E | Origem hoje | Exemplo |
|---|---|---|---|---|---|
| id | string | S | L | derivado | `aulasenai:2026-10-05:5e0b7a11` |
| projeto | string | S | L | novo | `aulasenai` |
| data | string | S | LE | coluna `Data` | `2026-10-05` |
| item | string | S | LE | coluna `Item` | `6.8 (SQL das equipes)` |
| motivo | string | S | LE | coluna `Motivo` | texto |
| oQueDestrava | string | N | LE | coluna `O que destrava` | texto |
| resolvidoEm | string\|null | N | LE | coluna `Resolvido em` | `2026-10-05 13:38` |
| ordem | inteiro | S | L | posição | `1` |

### 2.7 `pendencias` (seção "Pendências (ficou para depois)": Data | Pendência | Motivo | Origem)

Chave: `id` = `<projeto>:<data hora>:<hash8 da pendência>`. O `rules-ai` também tem linhas de tarefa
dentro da tabela de pendências (ex.: `INTEGRACAO-DEEPSEEK`, `INTEGRACAO-DEEPSEEK.6`, vistas em
`STATUS.md` depois do cabeçalho `Pendências`): são linhas de **tarefa** (8 colunas) e vão para
`tarefas`, não para `pendencias`; o carregador separa pelo número de colunas e pelo cabeçalho da
tabela.

| Campo | Tipo | Obrig. | L/E | Origem hoje | Exemplo |
|---|---|---|---|---|---|
| id | string | S | L | derivado | `rules-ai:2026-10-23 14:45:3a9f0c21` |
| projeto | string | S | L | novo | `rules-ai` |
| data | string | S | LE | coluna `Data` | `2026-10-23 14:45` |
| pendencia | string | S | LE | coluna `Pendência` | `Contar as 10 retomadas...` |
| motivo | string | S | LE | coluna `Motivo` | `o piloto foi ligado...` |
| origem | string | S | LE | coluna `Origem` | `AI-MEMORY-INTEGRATION.25 (decisão do usuário)` |
| tarefaOrigem | string (fk tarefas.id)\|null | N | LE | derivado de `Origem` | `null` |
| resolvidaEm | string\|null | N | LE | novo (hoje a linha só é apagada ao resolver; histórico fica no Git) | `null` |
| ordem | inteiro | S | L | posição | `1` |

### 2.8 `licoes` (seção "Lições aprendidas": Data | O que aconteceu | Lição / nova regra)

Chave: `id` = `<projeto>:<data hora>:<hash8>`. O `rules-ai` hoje não tem a seção preenchida; o
`aulasenai` tem.

| Campo | Tipo | Obrig. | L/E | Origem hoje | Exemplo |
|---|---|---|---|---|---|
| id | string | S | L | derivado | `aulasenai:2026-10-14 11:00:b4c2d3e5` |
| projeto | string | S | L | novo | `aulasenai` |
| data | string | S | LE | coluna `Data` | `2026-10-14 11:00` |
| oQueAconteceu | string | S | LE | coluna `O que aconteceu` | texto |
| licao | string | S | LE | coluna `Lição / nova regra` | texto |
| ordem | inteiro | S | L | posição | `1` |

### 2.9 `recados` (`tasks/RECADOS.md`: tabelas "Abertos" e "Cumpridos")

Hoje o `rules-ai` **não tem** `tasks/RECADOS.md` (conferido: não existe); o `aulasenai` tem. A regra
`frentes-e-reserva.md` o cita, então a coleção existe e pode ficar vazia no `rules-ai`.
Chave: `id` = `<projeto>:<data e hora>:<hash8 do recado>`.

| Campo | Tipo | Obrig. | L/E | Origem hoje | Exemplo |
|---|---|---|---|---|---|
| id | string | S | L | derivado | `aulasenai:2026-10-19 13:10:8f1a2b3c` |
| projeto | string | S | L | novo | `aulasenai` |
| dataHora | string | S | LE | coluna `Data e hora` | `2026-10-19 13:10` |
| de | string | S | LE | coluna `De` | `local · main · DeepSeek Harness` |
| para | string | S | LE | coluna `Para` (`todas` ou frente) | `todas` |
| recado | string | S | LE | coluna `Recado` | texto |
| etapaTarefa | string | N | LE | coluna `Etapa/tarefa` | `#293` |
| tarefaId | string (fk)\|null | N | LE | derivado de `Etapa/tarefa` | `null` |
| cumprido | boolean | S | LE | está em "Cumpridos" | `false` |
| cumpridoEm | string\|null | N | LE | coluna `Cumprido em / o que foi feito` (data) | `null` |
| cumpridoNota | string\|null | N | LE | coluna `Cumprido em / o que foi feito` (texto) | `null` |
| ordem | inteiro | S | L | posição | `1` |

Regra de uso (`RECADOS.md`): só se **acrescenta**; `PATCH` só muda `cumprido`, `cumpridoEm` e
`cumpridoNota`; `DELETE` é recusado pelo middleware.

### 2.10 `projetos`

Chave: `id` = nome curto estável do projeto (sem prefixo). Esta coleção mora em
`api/dados/_projetos.json` (não em um arquivo de projeto) e é lida pelo lançador; quem grava é
`node api/projetos.mjs --id <id> [--nome ..] [--tipo mae|filho] [--status ativo|aguardando]
[--monitorado true|false] [--motivo ..] [--caminho ..] [--repositorio ..]` (upsert; `--listar` mostra).
**Regra do upsert:** `status=aguardando` sem informar `monitorado` vira `monitorado=false`;
`aguardando` com `monitorado=true` é **erro** ("Projeto aguardando nao pode ficar monitorado=true");
projeto novo nasce `tipo=filho` e `cortadoEm=null`. Só os projetos que a API conhece;
`status`/`monitorado` mandam em quem os leitores (gerenciador, MCP, dashboard) leem (R4.2).

| Campo | Tipo | Obrig. | L/E | Origem hoje | Exemplo |
|---|---|---|---|---|---|
| id | string | S | L | nome do projeto | `rules-ai` |
| nome | string | S | LE | `scripts/gerenciador.config.json`, `dashboard/projetos.json`, título `# STATUS — <Projeto>` | `rules-ai` |
| tipo | `mae`\|`filho` | S | LE | novo: `mae` para `rules-ai`; `filho` para `aulasenai`, `dashboard-ai` e os demais | `mae` |
| status | `ativo`\|`aguardando` | S | LE | novo (R4.1) | `ativo` |
| monitorado | boolean | S | LE | presença na lista de `gerenciador.config.json`/`projetos.json` | `true` |
| caminho | string | N | LE | `gerenciador.config.json` (pasta local; só para a carga e o gerenciador) | `C:/fontes/rules-ai` |
| repositorio | string | N | LE | `gerenciador.config.json` (remoto GitHub) | `Gelvazio/rules-ai` |
| motivo | string | N | LE | novo (`api/projetos.mjs --motivo`): por que o projeto está `aguardando` ou fora da lista; ausente em `rules-ai` | `aguarda a carga na API (.54)` |
| arquivoDados | string | N | L (derivado) | derivado: `api/dados/<id>.json` (não gravado em `_projetos.json`; o lançador calcula) | `api/dados/rules-ai.json` |
| objetivo | string | N | LE | cabeçalho do STATUS: `**Objetivo:**` | `regras de IA globais...` |
| partesInteressadas | string | N | LE | cabeçalho do STATUS: `**Partes interessadas:**` | `Gelvazio (decide...)` |
| escopo | string | N | LE | seção "Escopo do projeto" (aulasenai) | texto |
| cortadoEm | string ISO\|null | N | LE | novo: `null` até o corte do projeto; vira a data quando o corte acontece (marca que o projeto passou a só ter tarefas na API) | `null` |
| ordem | inteiro | S | L | ordem lógica da lista (obrigatória: o serializador ordena os registros por `id`, então a posição no arquivo não serve); no upsert, projeto novo recebe a maior `ordem` + 1 e projeto existente mantém a sua | `1` |

### 2.11 `meta` (1 registro, `id: 1`)

Chave: `id` = `1` (inteiro, único registro; é só a coleção que o json-server precisa com `id`).

| Campo | Tipo | Obrig. | L/E | Origem hoje | Exemplo |
|---|---|---|---|---|---|
| id | inteiro | S | L | fixo | `1` |
| versaoSchema | string | S | L | novo | `1` |
| geradoEm | string ISO | S | L (middleware) | `meta.geradoEm` (etapa 049) | `2026-10-23T20:05:00-03:00` |
| totalTarefas | inteiro | S | L (derivado) | `meta.totalTarefas` | `262` |
| totalConcluidas | inteiro | S | L (derivado) | `meta.totalConcluidas` | `210` |
| totalDisponiveis | inteiro | S | L (derivado) | `meta.totalDisponiveis` | `40` |
| totaisPorProjeto | objeto projeto→{tarefas, concluidas, disponiveis} | S | L (derivado) | novo (R7.1) | `{"rules-ai":{"tarefas":262}}` |
| sequencia | inteiro | S | L (middleware) | novo: +1 a cada escrita (ajuda leitores a detectar mudança) | `1280` |

Nota sobre `geradoEm`/`sequencia`: mudam a cada escrita e geram diff em toda gravação (aceito; ver
seção 5, regra de gravação).

### 2.12 `requisitos` (tabela da seção `### Requisitos` da etapa: ID | Requisito (EARS) | Cobre | Verificação)

Chave: `id` = `<projeto>:<etapa>:<id da linha>`, com `<etapa>` = `ETAPA-NNN` (mesmo `NNN` de
`etapas.id`). Repetição do código na mesma etapa recebe sufixo `#N` (como em `tarefas`) e o
`codigo` mantém o original. Só as etapas `PESADO` com spec (C34) têm linhas (18 etapas hoje, de
019 a 053); a tabela é igual em 12 delas (`ID | Requisito (EARS) | Cobre | Verificação`).

| Campo | Tipo | Obrig. | L/E | Origem hoje | Exemplo |
|---|---|---|---|---|---|
| id | string | S | L | derivado | `rules-ai:ETAPA-053:R1.1` |
| projeto | string | S | L | novo | `rules-ai` |
| etapa | string (fk etapas.id) | S | L | etapa que contém a tabela | `rules-ai:ETAPA-053` |
| codigo | string | S | L | coluna `ID` | `R1.1` |
| texto | string | S | LE | coluna `Requisito (EARS)` (texto inteiro, com `QUANDO`/`SE`/`ENQUANTO`/`ONDE`/`O SISTEMA DEVE`) | `QUANDO a carga inicial rodar, O SISTEMA DEVE gravar na API todas as linhas de ...` |
| cobre | string[] (fk tarefas.id) | S | LE | coluna `Cobre`, uma ou mais subtarefas separadas por vírgula; `<TAREFA>.<n>` vira `<projeto>:<TAREFA>.<n>` | `["rules-ai:MIGRAR-TAREFAS-API.7", "rules-ai:MIGRAR-TAREFAS-API.8", "rules-ai:MIGRAR-TAREFAS-API.11"]` |
| cobreTexto | string | S | L | coluna `Cobre` (texto cru; guarda o que não casou com tarefa) | `MIGRAR-TAREFAS-API.7, MIGRAR-TAREFAS-API.8, MIGRAR-TAREFAS-API.11` |
| verificacao | string | S | LE | coluna `Verificação` | `contagem e ids comparados por script` |
| extras | objeto rótulo→texto | S | LE | colunas fora do padrão em tabelas antigas | `{}` |
| linhaCrua | string | S | L | linha da tabela como estava no `.md` (conferência da .45) | `R1.1 \| QUANDO a carga ... \|` |
| ordem | inteiro | S | L | posição na tabela | `1` |

Exemplos reais da etapa 053: `R1.2` (`SE o id da tarefa já existir na API, ENTÃO ... atualizar`, cobre
`.7` e `.11`, verificação `rodar a carga duas vezes e comparar o db.json`), `R3.2` (cobre quatro
subtarefas: `.16`, `.17`, `.21`, `.23`) e `R7.1` (cobre `.54`, `.63`, `.65`, `.69`). Subtarefa citada
em `Cobre` que não existe (criada ou cancelada depois) fica só em `cobreTexto` e gera aviso da carga.

Relações: `etapa` → `etapas` (a etapa lista os ids em `etapas.requisitos`); `cobre[]` → `tarefas`
(N:N: um requisito é coberto por várias subtarefas e uma subtarefa cobre vários requisitos). `PATCH`
só em `texto`, `cobre`, `verificacao`, `extras` (mudança **material** de requisito já aprovado pede
registro em `decisoes`, regra C34 item 5, conferida pelo humano e não pelo middleware); `DELETE` e
`PUT` recusados.

### 2.13 `invariantes` (tabela da seção `### Invariantes`: ID | Regra que vale sempre | Domínio da entrada | Como conferir | Teste automatizado)

Chave: `id` = `<projeto>:<etapa>:<id da linha>`. A tabela tem variantes: 12 etapas com 5 colunas
(inclusive a 053), uma com 3 (`ID | Regra que vale sempre | Como conferir`) e uma com
`ID | Invariante | Domínio | Como conferir`; a carga aceita as três e deixa `null` o campo sem coluna.

| Campo | Tipo | Obrig. | L/E | Origem hoje | Exemplo |
|---|---|---|---|---|---|
| id | string | S | L | derivado | `rules-ai:ETAPA-053:INV-3` |
| projeto | string | S | L | novo | `rules-ai` |
| etapa | string (fk etapas.id) | S | L | etapa que contém a tabela | `rules-ai:ETAPA-053` |
| codigo | string | S | L | coluna `ID` | `INV-3` |
| regra | string | S | LE | coluna `Regra que vale sempre` (ou `Invariante`) | `Uma subtarefa nunca tem duas reservas ao mesmo tempo` |
| dominio | string\|null | N | LE | coluna `Domínio da entrada` | `N reservas simultâneas, N de 2 a 10` |
| comoConferir | string | S | LE | coluna `Como conferir` | `disparar reservas em paralelo contra a API e contar emUsoPor` |
| testeAutomatizado | string\|null | N | LE | coluna `Teste automatizado` (texto cru; `N/A` justificado fica aqui) | `sim: script da .13` |
| temTeste | boolean | S | L (derivado) | `testeAutomatizado` começa com `sim` | `true` |
| testeTarefas | string[] (fk tarefas.id) | N | LE | derivado das `.<n>` citadas em `testeAutomatizado` e `comoConferir` | `["rules-ai:MIGRAR-TAREFAS-API.13"]` |
| extras | objeto rótulo→texto | S | LE | colunas fora do padrão | `{}` |
| linhaCrua | string | S | L | linha da tabela como estava no `.md` | `INV-3 \| Uma subtarefa ... \|` |
| ordem | inteiro | S | L | posição na tabela | `3` |

Exemplos reais da etapa 053: `INV-1` (paridade campo a campo; teste `sim: script da .11`), `INV-4` (sem
segredo; `não: conferência por comando na .11`, logo `temTeste=false`) e `INV-7` (perda zero; `sim:
script da .45`). Relações: `etapa` → `etapas` (lista em `etapas.invariantes`); `testeTarefas` →
`tarefas` (subtarefa que cria o teste ou a conferência). Regra do `spec.md`: invariante sem "como
conferir" não entra (a carga e o `POST` recusam `comoConferir` vazio).

### 2.14 `perguntas` (seção `### Perguntas abertas`: tabela `# | Pergunta | Resposta | Fechada em | Quem respondeu`, ou lista de itens)

Chave: `id` = `<projeto>:<etapa>:<id da linha>`. A seção aparece em três formatos e a carga lê os três:
(1) tabela de 5 colunas (10 etapas, inclusive a 053); (2) tabela `# | Pergunta | Resposta | Situação`
(3 etapas); (3) lista `- ✅ **P0 — Projeto:** texto` / `- ⬜ **P2.** texto` (etapas 046 e 049, sem
resposta separada: o texto do item vai inteiro em `pergunta` e `resposta` fica `null`).

| Campo | Tipo | Obrig. | L/E | Origem hoje | Exemplo |
|---|---|---|---|---|---|
| id | string | S | L | derivado | `rules-ai:ETAPA-053:P4` |
| projeto | string | S | L | novo | `rules-ai` |
| etapa | string (fk etapas.id) | S | L | etapa que contém a seção | `rules-ai:ETAPA-053` |
| codigo | string | S | L | coluna `#` ou `**P<n>**` do item | `P4` |
| pergunta | string | S | LE | coluna `Pergunta` (ou texto do item) | `Como evitar duas reservas da mesma subtarefa, já que o json-server não tem compare-and-set? ...` |
| resposta | string\|null | N | LE | coluna `Resposta` (sem o `✅`/`⬜`) | `Middleware mínimo do json-server (--middlewares, 1 arquivo)` |
| situacao | `aberta`\|`fechada` | S | L (operação) | emoji `⬜`/`✅` da resposta ou do item; coluna `Situação` | `fechada` |
| fechadaEm | string\|null | N | LE | coluna `Fechada em` | `2026-10-23 19:58` |
| quemRespondeu | string\|null | N | LE | coluna `Quem respondeu` | `usuário (AskUserQuestion)` |
| extras | objeto rótulo→texto | S | LE | colunas fora do padrão | `{}` |
| linhaCrua | string | S | L | linha da tabela ou do item, como estava no `.md` | `P4 \| Como evitar ... \|` |
| ordem | inteiro | S | L | posição | `4` |

Regras: (a) **pergunta `aberta` bloqueia a execução** da etapa (C34): `GET /perguntas?situacao=aberta`
lista o que o usuário precisa responder, e `reservar` (seção 4) recusa com 409 `pergunta_aberta` a
subtarefa de etapa grande com pergunta aberta; (b) `situacao`, `resposta`, `fechadaEm` e
`quemRespondeu` só mudam pela operação `responderPergunta` (seção 4), nunca por `PATCH` direto, e só
com `autor=usuario` (C32); (c) `POST` (pergunta nova) nasce `aberta` com `resposta=null`; (d) `DELETE`
e `PUT` recusados. Exemplos reais: `P1` a `P8` da etapa 053 (tabela, todas `fechada`, `fechadaEm`
`2026-10-23 19:58`); `P0` a `P4` da etapa 049 (lista, fechadas); `P2` da etapa 046 (lista, `⬜`
aberta).

---

## 3. Estado da tarefa

`statusCodigo` (enum fechado) e o emoji do quadro que o originava:

| statusCodigo | Emoji | Quem pode entrar nele | Quem muda |
|---|---|---|---|
| `pendente` | ⬜ | carga; liberar reserva; destravar bloqueio; criar subtarefa | middleware (operação) |
| `em_execucao` | 🔄 | reservar | só a operação `reservar` (nunca PATCH direto) |
| `concluido` | ✅ | entregar | só a operação `entregar` (ou `reabrir` ao contrário, pelo usuário) |
| `bloqueado` | ⛔ | bloquear com motivo | a frente dona da reserva, ou o usuário |
| `aguardando_usuario` | 👀 | pedir ação ao usuário | qualquer IA pede; só o usuário sai |
| `cancelada` | ❌ | cancelar | só o usuário (ou IA com pedido explícito dele registrado em `decisoes`) |

Transições permitidas (qualquer outra devolve 409):

| De | Para | Operação | Pré-condição extra |
|---|---|---|---|
| pendente | em_execucao | `reservar` | livre, deps concluídas, modelo certo (seção 4) |
| em_execucao | concluido | `entregar` | reserva é da mesma frente; `entrega` e `verificacao` preenchidas |
| em_execucao | pendente | `liberar` | só a dona da reserva ou o usuário |
| em_execucao | bloqueado | `mudarStatus` | `motivo` obrigatório (grava `proximoPasso`) |
| pendente | bloqueado | `mudarStatus` | idem |
| bloqueado | pendente | `mudarStatus` | `oQueDestrava` resolvido |
| bloqueado | em_execucao | `mudarStatus` | só a frente que reservou |
| pendente / em_execucao | aguardando_usuario | `mudarStatus` | `acaoDoUsuario` obrigatório |
| aguardando_usuario | pendente / em_execucao / concluido | `mudarStatus` | só `autor = usuario` |
| pendente / em_execucao / bloqueado / aguardando_usuario | cancelada | `mudarStatus` | só `autor = usuario`; grava `decisoes` |
| concluido | pendente | `reabrir` | só `autor = usuario`; recalcula `disponivel` das dependentes |

Regras: (a) `em_execucao` exige `emUsoPor` preenchido; os demais estados têm `emUsoPor = null`,
exceto `bloqueado`, que **mantém** a reserva. (b) Mãe (`tipo=mae`) nunca é reservada
(`naoReservavel=true`): o status dela é recalculado pelo middleware quando uma subtarefa muda
(todas concluídas ou canceladas → `concluido`; qualquer `em_execucao` → `em_execucao`); quem
**move** a mãe para as arquivadas continua sendo o fechamento da etapa (campo `arquivada`).
(c) `disponivel` é derivado e **recalculado em toda escrita** de `tarefas`: `tipo=sub` e
`statusCodigo=pendente` e `emUsoPor=null` e `travaEspecial=false` e todas as `dependeDe`
concluídas ou canceladas. (d) `nivel`/`modelo`/`effort` só mudam pela classificação (Jev, C47) ou
pelo usuário, nunca pela IA que executa (regra maior C50).

Campos graváveis por cliente (PATCH em `tarefas`): `titulo`, `prioridade` (só usuário),
`proximoPasso`, `descricao`, `criteriosAceitacao`, `arquivos`, `anotacao`, `extras`, `estimativa`,
`entrega`, `verificacao`. Os campos de estado (`status`, `statusCodigo`, `emUsoPor`, `concluida`,
`arquivada`, `disponivel`, `dependeDe`, `modelo`, `nivel`, `effort`) o middleware **recusa** em PATCH
direto (400); mudam pelas operações abaixo (o gravador do Jev usa a operação `classificar`).

---

## 4. Operações de escrita

Expostas pelo middleware (`api/middleware.mjs`, 1 arquivo) como `POST /operacoes/<nome>`; todas
atômicas (lê o arquivo do projeto em memória, valida, grava em arquivo temporário e troca; erro
restaura). Rota por projeto (opção B): o middleware descobre o arquivo `api/dados/<projeto>.json`
pelo prefixo da rota (`/<projeto>/operacoes/<nome>`) ou, onde a operação traz `id` composto, pelo
prefixo do id. O servidor é **um processo, uma porta (3333), sem `--watch`** (`CONCORRENCIA.md` 2.4:
o `--watch` relê o disco e desfaz reserva que ainda está só em memória); uma trava `api/.servidor.lock`
com o PID impede o segundo processo. Mudança do arquivo por fora (`git pull`, `checkout`) é
detectada pelo `mtime` (abaixo) e resolvida pela operação `recarregar`.
Resposta padrão: `200` com o registro novo (`{ tarefa, derivados }`), `404` id inexistente,
`409` pré-condição não atendida (com `motivo` e o registro atual), `400` payload inválido.
Pré-condições valem **dentro** da região crítica (INV-3).

Matriz de modelos (de `regras/niveis-e-modelos.md` e `regras/regra-maior.md`): a IA informa
`ia` e `modeloIa`; a operação compara com a coluna `modelo` (`só <modelo>`) e com a matriz.
Haiku só `LEVE`; Sonnet `MEDIO` e `PESADO`; Opus 5.5+ e Fable só `PESADO`; nunca mais forte em
tarefa mais fraca. Ferramenta sem linha na matriz para o nível → recusa.

| Operação | Payload | Pré-condições | Efeito | Devolve |
|---|---|---|---|---|
| `reservar` | `{ id, frente, ia, modeloIa }` | `tipo=sub`; `statusCodigo=pendente`; `emUsoPor=null`; sem `travaEspecial`; todas as `dependeDe` concluídas; `nivel` presente; `modeloIa` atende a coluna `modelo` e a matriz; a `frente` não tem outra tarefa `em_execucao` (1 por frente); a etapa da subtarefa, se grande, não tem `perguntas` com `situacao=aberta` | `statusCodigo=em_execucao`, `status="🔄 Em execução"`, `emUsoPor="<frente> (desde <data hora>)"`, `reservadoEm`, `disponivel=false`, recalcula a mãe, atualiza a linha da frente | tarefa reservada; `409` com `motivo` (`ocupada`, `dependencia`, `modelo`, `frente_ocupada`, `trava`, `pergunta_aberta`) |
| `entregar` | `{ id, frente, entrega, verificacao }` | `emUsoPor` é da própria `frente`; `statusCodigo=em_execucao`; `entrega` e `verificacao` não vazias | `concluido`, `concluida=true`, `arquivada=true`, `emUsoPor=null`, `concluidaEm`, grava `entrega`/`verificacao`, `proximoPasso="concluída"`, recalcula `disponivel` das dependentes e o status da mãe | tarefa; lista `liberadas` (ids que ficaram disponíveis); `maePodeFechar` (todas as subs ✅) |
| `liberar` | `{ id, frente, motivo }` | reserva é da `frente` (ou `autor=usuario`) | volta a `pendente`, `emUsoPor=null`, anota motivo em `proximoPasso` | tarefa |
| `mudarStatus` | `{ id, frente, para, motivo?, acaoDoUsuario?, autor }` | transição da tabela da seção 3 | muda `statusCodigo`/`status`; `bloqueado` e `aguardando_usuario` exigem texto; `cancelada` exige `autor=usuario` | tarefa |
| `reabrir` | `{ id, autor, motivo }` | `autor=usuario`; `concluido` | volta a `pendente`, `arquivada=false`, `concluidaEm=null`, recalcula dependentes | tarefa |
| `criarSubtarefa` | `{ mae, titulo, nivel, modelo, effort, descricao, criteriosAceitacao, dependeDe?, prioridade?, frente }` | mãe existe e **é a mãe atual da frente** (a frente tem tarefa `em_execucao` da mesma mãe); nunca cria mãe (C26); `nivel` e `modelo` presentes e coerentes com a matriz | cria `<mae>.<próximo número>` livre (`pendente`, `emUsoPor=null`, `disponivel` calculado), `ordem` ao fim, linha de `etapas.subtarefas`, `jevAiSuggestion=NAO` | tarefa nova (`id`, `codigo`) |
| `classificar` | `{ id, nivel, modelo, effort, jevAiSuggestion, fonteNivel }` | subtarefa **livre** e sem `nivel` (ou `reclassificar=true` pedido do usuário, ainda livre); regra do Jev C47 | grava `nivel`/`modelo`/`effort`/`jevAiSuggestion`/`fonteNivel`, recalcula `disponivel` | tarefa |
| `anotarDecisao` | `{ projeto, data?, decisao, quem, porque, etapaId? }` | `decisao` e `quem` não vazios; só acrescenta | cria registro em `decisoes` (topo, `ordem` = 1 e desloca) | decisão criada |
| `anotarRecado` | `{ projeto, de, para, recado, etapaTarefa? }` | só acrescenta; sem segredo (INV-4) | cria registro em `recados` (`cumprido=false`) | recado criado |
| `cumprirRecado` | `{ id, cumpridoNota }` | recado existe e está aberto | `cumprido=true`, `cumpridoEm`, `cumpridoNota` | recado |
| `atualizarFrente` | `{ frente, tarefaTexto, tarefaIds, situacao }` | cada frente só altera a **própria** linha | cria/atualiza linha de `frentes`, `atualizadoEm` | frente |
| `anotarEtapa` | `{ etapaId, secao, texto }` | a etapa existe; só acrescenta ao final da seção ou cria seção | grava em `etapas.secoes` | etapa |
| `responderPergunta` | `{ id, resposta, quemRespondeu, autor }` | pergunta existe e está `aberta`; `autor=usuario` (C32); `resposta` não vazia | `situacao=fechada`, `resposta`, `fechadaEm`, `quemRespondeu`; recalcula o bloqueio das subtarefas da etapa | pergunta |
| `recarregar` | `{ projeto? }` (só `127.0.0.1`) | nenhuma escrita em andamento: espera a fila terminar (única operação fora da regra "sem `await`", por não competir por reserva) | relê o(s) arquivo(s) (`readFileSync`), valida o JSON, troca o estado em memória (`db.setState`) e guarda o novo `mtime`/hash; sem `projeto`, relê todos | `{ projetos, meta.sequencia }` |

**Checagem de `mtime` (409 `db_alterado_por_fora`).** Antes de cada gravação, o middleware compara o
`mtime` (hash, se der falso positivo) do arquivo do projeto com o do último que ele leu ou gravou; se
for diferente, responde `409 { motivo: "db_alterado_por_fora" }` e **não grava** até a operação
`recarregar` (ou reiniciar a API). Quem rodar `git pull` que toque `api/dados/` chama `recarregar`
depois.

Demais coleções (`requisitos`, `invariantes`, `perguntas`, `riscos`, `bloqueios`, `pendencias`,
`licoes`, `projetos`, `etapas`) aceitam `POST` (criar) e `PATCH` (campos `LE` da tabela) pelo
json-server padrão, exceto os campos de `perguntas` citados na seção 2.14; `DELETE` e `PUT` ficam
**recusados** pelo middleware em todas as coleções do quadro (histórico nunca é apagado; resolver
pendência = `PATCH resolvidaEm`). A mudança de `projetos.status`/`monitorado` é `PATCH` (só o
usuário, ou a subtarefa .34 a .42 que o pediu). `GET` é livre e segue o json-server padrão
(`?projeto=`, `?statusCodigo=`, `?disponivel=true`, `?_sort=`, `?_expand=`).

A reserva segue a regra do `frentes-e-reserva.md`: reservar é **gravar** (a trava é a gravação
atômica); push de reserva deixa de existir como trava (a API local é a trava). Para quem só tem os
JSON do Git (nuvem), todas as operações de escrita estão **indisponíveis**: o cliente avisa e
não reserva (R3.2).

---

## 5. Ordem das chaves e regra de gravação

**Ordem das chaves do arquivo** (cada `api/dados/<projeto>.json`; `_projetos.json` tem só
`projetos`): `tarefas`, `etapas`, `requisitos`, `invariantes`, `perguntas`, `frentes`, `decisoes`,
`riscos`, `bloqueios`, `pendencias`, `licoes`, `recados`, `meta`. Dentro de cada registro, as chaves seguem
**exatamente a ordem das tabelas da seção 2** (id primeiro). Chave ausente por falta de origem fica
`null` (não omitida), exceto `extras` (`{}`), listas (`[]`) e textos (`""`): o conjunto de chaves é
sempre o mesmo, o que mantém o diff por linha.

**Ordem dos registros no array:** por `id` em ordenação natural (projeto, depois partes numéricas
do código: `X.2` antes de `X.10`). Decisão e justificativa: se o array seguisse a ordem do quadro
(prioridade, reservas), mover uma linha de "abertas" para "concluídas" reordenaria dezenas de
registros e o `git diff` seria enorme; por `id`, a entrega de uma subtarefa muda **só as linhas
dela** (`statusCodigo`, `status`, `emUsoPor`, `concluida`, `arquivada`, `disponivel` e as
dependentes). A ordem de exibição do quadro é reconstruída por `ordem`. Exceção: `meta` e
`decisoes`/`recados` (ordenados por `data` decrescente, mais novo primeiro, como nas tabelas).

**Formato:** `JSON.stringify(banco, null, 2)` + `\n`, UTF-8 sem BOM, **LF**, sem espaço no fim de
linha, sem reordenar chaves ao reescrever (o middleware serializa por um **serializador próprio de
chaves fixas**, porque o json-server/lowdb 0.17 preserva a ordem de inserção, e a carga é quem
define a ordem). Datas em texto como no quadro (`AAAA-MM-DD HH:MM`) nos campos de origem e ISO com
fuso `-03:00` nos campos novos (`reservadoEm`, `concluidaEm`, `atualizadoEm`, `geradoEm`).

**Regra de gravação:** (a) só o middleware e o carregador gravam; (b) escrita em arquivo temporário
no mesmo diretório e `rename` no fim (nunca deixa o arquivo pela metade); (c) uma escrita por vez
(fila dentro do processo; é o que dá atomicidade ao `reservar`); (d) `meta.geradoEm` e
`meta.sequencia` mudam a cada escrita, então **todo** commit do arquivo do projeto tem pelo menos essas
linhas de diff; para isolá-las e manter o ruído mínimo, `meta` é a **última chave** do arquivo;
(e) a carga idempotente (INV-5) não atualiza `geradoEm` quando nada mudou (compara o conteúdo sem
`geradoEm`/`sequencia` e não regrava se for igual); (f) textos longos (`secoes[].texto`,
`descricao`, `entrega`, `verificacao`) ficam **em uma linha de JSON** com `\n` escapado: mudança
de uma palavra troca a linha inteira no diff (custo aceito, ver seção 7).

---

## 6. O que cada INV e cada R exige do schema

| ID | O que exige do schema |
|---|---|
| INV-1 (paridade) | `tarefas` guarda **todas** as colunas do STATUS.md e do task_complete.md (`Tarefa`, `Título`, `Prioridade`, `Modelo`, `Depende de`, `Status`, `Em uso por`, `Etapa`) com texto cru preservado (`modelo`, `dependeDeTexto`, `status`, `emUsoPor`) além dos derivados; `codigo` mantém o id original para comparar |
| INV-2 (ids únicos) | `id` composto `<projeto>:<codigo>`; sufixo `#N` para repetição dentro do projeto; `codigo` preserva o original; a carga aborta se sobrar id duplicado |
| INV-3 (uma reserva) | `emUsoPor` e `statusCodigo` só mudam em `reservar`, dentro da região crítica do middleware; PATCH direto desses campos é recusado (400) |
| INV-4 (sem segredo) | `extras`/textos passam pelo mascarador na carga e nas operações de escrita (`anotar*`); nenhum campo de credencial existe no schema |
| INV-5 (idempotência) | ids derivados do conteúdo (hash8) ou do código; ordem fixa por `id`; `ordem` vem da origem; `geradoEm` só muda se algo mudou; serialização única |
| INV-6 (outros projetos intocados) | `projeto` em cada registro e `projetos.monitorado`/`status`: a carga do `rules-ai` grava só `api/dados/rules-ai.json` (`--projeto`); carga de filho só depois do corte (`cortadoEm`) em arquivo próprio |
| INV-7 (perda zero) | `etapas.secoes[].texto`, `etapas.tituloLinha`, `tarefas.extras` e `verificacaoRotulo` guardam o texto cru de todo rótulo e seção; as tabelas de Requisitos, Invariantes e Perguntas abertas têm destino em `requisitos`, `invariantes` e `perguntas`, com `linhaCrua`, `extras`, `secoes[].colecao` e `secoes[].colunas` e a contagem linhas = registros; cada seção do `.md` tem 1 destino no schema (ver conferência abaixo); o script da .45 compara seção a seção |
| R1.1 (tarefas) | `tarefas` com as 8 colunas e `arquivada` distingue STATUS de task_complete |
| R1.2 | `id` estável permite `PUT`/`PATCH` em vez de duplicar |
| R2.1 | operação `reservar` com as pré-condições da seção 4; campos `emUsoPor`, `statusCodigo`, `nivel`, `modelo`, `dependeDe`, `disponivel` |
| R2.2 | operação `entregar`: `entrega`, `verificacao`, `concluida`, `emUsoPor=null`, `disponivel` das dependentes |
| R3.1 | todas as colunas e seções de `STATUS.md`, `task_complete.md`, `RECADOS.md` e `etapas/*.md` têm campo (seção 2); `projetos.objetivo`, `partesInteressadas`, `escopo` guardam o cabeçalho e o escopo do STATUS |
| R3.2 | o mesmo arquivo `api/dados/<projeto>.json` serve a API e o fallback do Git (a nuvem só lê); `meta.versaoSchema` e `meta.sequencia` deixam o leitor detectar versão e mudança; sem campo que só exista em memória |
| R4.1 | `projetos.status` e `projetos.monitorado` |
| R4.2 | leitores filtram por `projetos.monitorado=true` e `status=ativo` |
| R5.1 | `meta.versaoSchema`; todos os campos da origem preservados permitem reimportar para `.md` |
| R5.2 | seção 5 (ordem fixa, LF, serializador próprio; um arquivo versionado por projeto em `api/dados/`) |
| R6.1 | `etapas.secoes` e `tarefas` (seções de subtarefa) com texto cru; `requisitos`, `invariantes` e `perguntas` guardam as tabelas das etapas (decisões e riscos da etapa continuam em `secoes`, texto cru) |
| R7.1 | campo `projeto` e id composto em todas as coleções, inclusive `requisitos`, `invariantes` e `perguntas` (`<projeto>:<etapa>:<id>`); `projetos.tipo=filho`, `projetos.cortadoEm` e um arquivo `api/dados/<projeto>.json` por projeto-filho |

Conferência dos rótulos das etapas (destino de cada `- **X:**`/`**X:**`): `Nível` (nivel,
nivelMotivo), `Modelo` (modeloSecao), `Effort` (effort), `JEV-AI-SUGGESTION` (jevAiSuggestion),
`Descrição` (descricao), `Critérios de Aceitação` e `Critérios de aceitação` (criteriosAceitacao),
`Depende de` (dependeDe), `Entrega` e `Entregue` (entrega), `Verificação` e suas variantes
`Verificação (líder)`, `Verificação (feita)`, `Verificação feita`, `Verificação (conferida pelo
líder)` e `Verificação (...)` com sufixo (verificacao, verificacaoRotulo), `Arquivos` (arquivos),
`Fonte` (fonteNivel), `Estimativa` (estimativa), `Anotação` (anotacao), `Critério de pronto`
(criterioPronto), `Próximo passo` (proximoPasso), `Pedido` (etapas.pedido), `Objetivo`
(etapas.objetivo), `Tarefa` (etapas.tarefaMae), `Status` e `Situação` (etapas.situacao), e os
demais rótulos (`Origem`, `Conferido`, `Problema`, `Motivo`, `Correção`, `Versão`, `Versão
anterior`, `Versão nova`, `Número da decisão`, `Totais`, `Entra`, `Não entra`, `Fora do escopo`,
`Não-objetivos`, `Casos de borda`, `Resultado do inventário`, `Produtor das rotas`, `O que sobra
para o usuário`, `Tabela campo → nova origem`, `Sai (apagado com git rm...)`) vão para `extras`
(quando dentro de subtarefa) ou para `secoes` (quando no corpo da etapa). Os demais itens
`- **X:**` achados por grep nas etapas (ex.: `Concorrência`, `Exposição`, `Deploy`, `Aprovação`,
`Código`, `Servidor`) são bullets livres das seções gerais (Riscos, Escopo, Decisões, Perguntas) e
ficam dentro de `secoes[].texto`; não são rótulos de subtarefa.

---

## 7. Pontos em aberto e riscos

### 7.1 Decisões e pontos em aberto

**Decidido pelo usuário** (2026-10-23 20:57 e 21:00), já refletido neste contrato:

1. **Coleção `bloqueios`: mantida** (e `riscos` também, porque o quadro do `aulasenai` tem as
   duas seções).
2. **Tabelas dentro das etapas** (Requisitos, Invariantes, Perguntas abertas) **viram coleções**
   `requisitos`, `invariantes` e `perguntas` (seções 2.12 a 2.14), contra a recomendação de texto
   cru. O gate `spec/verificar-spec.mjs` (.51) passa a ler as coleções, não o `.md`.
3. **Decisões e riscos dentro das etapas** (`### Decisões`, `### Riscos`) ficam como texto de
   `secoes`; as decisões do **quadro** (`Registro de decisões`) são coleção. Unificar exigiria
   parsear bullets; adiado.
4. **`tasks/GERENCIADOR-HERDR/*.md`** (`CONTAS-CLAUDE-CODE.md`, `PROMPT_PARA_O_LIDER.md`,
   `STATUS_TAREFAS_ANDAMENTO.md`) **ficam como documentação**, fora do apagamento da .46; não têm
   coleção.
5. **Ids por hash do texto** nas linhas sem código natural (frentes, decisões, pendências, lições,
   recados, riscos, bloqueios): **aceito**. Editar o texto muda o id; as linhas só se acrescentam.
6. **Armazenamento: decidido, opção B** (`ARMAZENAMENTO.md`): **um arquivo por projeto**
   `api/dados/<projeto>.json`, lista de projetos em `api/dados/_projetos.json`, **um processo, uma
   porta** (3333, rota `/<projeto>/<colecao>`), um middleware com fila serial. **Lançador próprio**
   (`api/servidor.mjs`, um router do json-server por arquivo) só quando o `aulasenai` entrar (.54);
   até lá o `npm start` sobe o json-server comum com 1 arquivo. Os dados dos filhos (`aulasenai`,
   `dashboard-ai`) ficam **no Git do `rules-ai`**; o peso de ~4 MB do `aulasenai` regravado a cada
   entrega foi **aceito**. A **nuvem só lê** o JSON do Git
   (`https://raw.githubusercontent.com/Gelvazio/rules-ai/main/api/dados/<projeto>.json`) e não
   reserva. `api/db.json` e `api/gerar-db.mjs` são a **ponte antiga** (etapa 049), aposentados na
   .52. Volumes medidos: `rules-ai` ~1,2 MB; `aulasenai` ~3,3 a 4,5 MB; `dashboard-ai` ~1,2 MB.

**Ainda em aberto:**

7. **Etapas sem `**Tarefa:**` ou com título fora do padrão** (`## Etapa 002 — ...`): o carregador as
   aceita pelo nome do arquivo; se alguma não tiver mãe, `tarefaMae` fica `null` com aviso.
8. **Roteamento de vários routers do json-server 0.17 no mesmo Express** é conhecido mas não foi
   testado; conferir na primeira versão do lançador (.54).
9. **Operação `reservar` e `perguntas` abertas:** o 409 `pergunta_aberta` é proposta desta revisão
   (consequência de C34 + coleção); precisa do "sim" na .13.
10. **Carga de `perguntas` no formato lista** (etapas 046 e 049) perde a separação pergunta/resposta;
    `pergunta` guarda o item inteiro e `resposta` fica `null`. Aceitável pela INV-7 (texto íntegro),
    mas confirmar na .10.

### 7.2 Riscos

| Risco | Efeito | Mitigação |
|---|---|---|
| Tamanho do arquivo do projeto (`rules-ai` 220+ tarefas e 53 etapas; `aulasenai` ~4 MB) | json-server relê e regrava o arquivo inteiro a cada escrita; leitura lenta e diff grande | opção B decidida (um arquivo por projeto): a escrita só regrava o arquivo do projeto; textos longos só em `etapas`/`tarefas`, nunca duplicados |
| Texto longo em uma linha de JSON | `git diff` mostra a seção inteira trocada por uma palavra | aceito; alternativa (array de linhas por seção) piora a leitura e a consulta; revisar na .5 |
| Colisão de ids | duas tarefas com o mesmo `<projeto>:<codigo>` (repetição já vista em `STATUS` x `task_complete`) | sufixo `#N` + aviso; a carga falha se sobrar duplicado (INV-2) |
| Id com `:` e `#` na URL | `#` é fragmento de URL; `:` precisa de `%3A` | clientes usam `encodeURIComponent`; carregador evita `#` onde possível (preferir `~N`); decidir na .5 |
| Escritas concorrentes entre processos (2 sessões, 2 portas) ou `git pull` por baixo da API | perda de escrita | o middleware serializa dentro de **um** processo; trava `api/.servidor.lock` com PID; sem `--watch`; `mtime` + `recarregar` (seção 4) |
| Nuvem sem API | sessões de nuvem não reservam | R3.2: leem o `api/dados/<projeto>.json` do Git; reserva só local; avisar na regra (.25) |
| Campos derivados desatualizados | `disponivel` errado | recalculados em toda escrita; a conferência da .11 compara com recálculo completo |
| `Modelo` em texto cru difícil de comparar | reserva por modelo errada | `reservar` usa a matriz estrita e o `nivel`; coluna `modelo` só confirma o "só X"; testes na .13 |
| Carga lê tabelas com `|` no título, emoji ausente, colunas a mais/menos | linha perdida | casos de borda da etapa 053; carregador conta linhas lidas contra linhas da tabela e falha se diferir |
| Segredo ou dado pessoal em texto de etapa antigo | vazamento no Git | mascarador na carga e `grep` da INV-4 antes de versionar os arquivos de `api/dados/` |
| `meta`/`sequencia` mudam a cada escrita | todo commit toca o arquivo do projeto | `meta` por último no arquivo; carga idempotente não regrava sem mudança |
