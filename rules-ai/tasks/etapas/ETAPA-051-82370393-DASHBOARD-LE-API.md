## Etapa 051-82370393 — DASHBOARD-LE-API: Dashboard carrega as tarefas da API

**Tarefa:** DASHBOARD-LE-API · **Pedido em:** 2026-10-23 19:36 · **Criada por:** Claude Code (Sonnet 5.5) (local · main · rules-ai)
**Pedido:** "agora este dashboard, C:\fontes\rules-ai\dashboard, deve carregar as tarefas da api,adicione esta task com o maximo de subtask possivel"
**Objetivo:** A página do dashboard lê as tarefas da API json-server, com plano B para o `STATUS.md`.

### Escopo

- **Entra:** o dashboard (`dashboard/`) passa a carregar as tarefas da API (`api/`, json-server) quando roda em localhost, com queda automática para a leitura de hoje (`STATUS.md` local ou GitHub raw).
- **Não entra:** mudar a API, o quadro, o publicador/canal Supabase, nem as tarefas `AGENTES-REALTIME.*`.

### Riscos

- A API só escuta em 127.0.0.1 e o `db.json` fica fora do Git: online (GitHub/Vercel) a página não alcança a API; plano B = leitura de hoje (por isso a API é só a fonte primária **local**).
- `AGENTES-REALTIME.15/.18/.19` mexem em `agentes.js` e `canal.js`: dois escritores nunca tocam os mesmos arquivos ao mesmo tempo; conferir as reservas antes de reservar a .8 e a .9.
- `db.json` fica velho se ninguém rodar `npm run gerar`: a .11 avisa.

### Decisões

- 2026-10-23 19:36: pedido do usuário; tarefa **grande** (várias partes, 20 subtarefas `LEVE`/`MEDIO`, nenhuma `PESADO`) — plano nesta etapa e **sim do usuário** antes de executar. Proposto: API primeiro (só local), plano B automático, `?fonte=` para depurar.
- 2026-10-23 21:00: **decisão do usuário**: esta tarefa **espera a migração** (`MIGRAR-TAREFAS-API.48`): a fonte muda para `api/dados/rules-ai.json` e a leitura do dashboard se adapta a ela.
- Depende da entrega das subtarefas `API-QUADRO-JSON-SERVER.2` e `.3`.


### DASHBOARD-LE-API.1 — Constantes da API em `config.js` (url base, rotas, tempo limite)

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** LEVE — só texto e constantes, sem lógica
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Em `dashboard/assets/js/config.js`, constante congelada `API_QUADRO` com `urlBase` (`http://127.0.0.1:3333`), rotas (`/tarefas`, `/frentes`, `/meta`) e `tempoLimiteMs`.
- **Critérios de Aceitação:** constantes existem, sem lógica; `node --check` passa.
- **Depende de:** API-QUADRO-JSON-SERVER.2

### DASHBOARD-LE-API.2 — Tabela `statusCodigo` da API → status do kanban

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** LEVE — só texto e constantes, sem lógica
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Constante `STATUS_DA_API` em `config.js`: `pendente→pendente`, `em_execucao→progresso`, `concluido→concluido`, `bloqueado→bloqueado`, `aguardando_usuario→aguardando`, `cancelada→concluido`.
- **Critérios de Aceitação:** todos os `statusCodigo` do `db.json` têm correspondência.
- **Depende de:** DASHBOARD-LE-API.1

### DASHBOARD-LE-API.3 — Exportar `agenteDaColuna` de `quadro.js` sem mudar o comportamento

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Exportar o separador de agente, `desde` e percentual de "Em uso por" para o conversor da API reaproveitar.
- **Critérios de Aceitação:** `lerQuadro` devolve o mesmo resultado de antes (conferido por comando com o STATUS.md atual).
- **Depende de:** DASHBOARD-LE-API.1

### DASHBOARD-LE-API.4 — Conversor `converterTarefaDaApi` em `assets/js/agentes/api-quadro.js`

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Converte o item da API (`id`, `tipo`, `mae`, `titulo`, `nivel`, `statusCodigo`, `emUsoPor`, `etapa`) no objeto que o kanban usa (`tarefa`, `titulo`, `pai`, `mae`, `nivel`, `status`, `agente`, `desde`, `progresso`, `global`, `indice`).
- **Critérios de Aceitação:** mesmo objeto de `lerQuadro` para a mesma tarefa.
- **Depende de:** DASHBOARD-LE-API.2, DASHBOARD-LE-API.3

### DASHBOARD-LE-API.5 — Cliente `buscarTarefasDaApi` com tempo limite e erro claro

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** `fetch` de `/tarefas` com `AbortController`; erro de rede, tempo esgotado e status diferente de 200 viram mensagem legível.
- **Critérios de Aceitação:** API desligada gera erro com texto claro, sem travar.
- **Depende de:** DASHBOARD-LE-API.1

### DASHBOARD-LE-API.6 — Ler também `/frentes` e `/meta`

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Buscar as frentes e o `meta.geradoEm` junto, sem atrasar a leitura das tarefas.
- **Critérios de Aceitação:** frentes e data de geração chegam ao estado.
- **Depende de:** DASHBOARD-LE-API.5

### DASHBOARD-LE-API.7 — `lerEstadoDaApi` no mesmo formato de `lerEstadoInicial`

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Devolve `{ versao, projeto, sequencia, tarefas }` para o resto da página não mudar.
- **Critérios de Aceitação:** a página aceita o estado da API sem outra alteração.
- **Depende de:** DASHBOARD-LE-API.4, DASHBOARD-LE-API.5

### DASHBOARD-LE-API.8 — Escolha da fonte: API primeiro, queda automática para o STATUS.md

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Arquivo `fonte-quadro.js`: em host local tenta a API; falhando, usa a leitura de hoje (arquivo local ou GitHub raw). Fora de localhost nem tenta a API.
- **Critérios de Aceitação:** API no ar usa a API; API fora cai no modo de hoje sem erro na tela.
- **Depende de:** DASHBOARD-LE-API.7

### DASHBOARD-LE-API.9 — Releitura periódica pela fonte escolhida em `agentes.js`

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** `vigiarQuadro` passa a chamar a fonte de `fonte-quadro.js`; o atraso e o buffer continuam valendo.
- **Critérios de Aceitação:** com a API no ar, a página relê pela API no intervalo configurado.
- **Depende de:** DASHBOARD-LE-API.8

### DASHBOARD-LE-API.10 — Indicador da fonte e aviso de API fora do ar na barra

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Texto "Fonte: API local / STATUS.md / GitHub" em `index.html` e `transmissao.js`, e aviso quando a API caiu e a página usa o plano B.
- **Critérios de Aceitação:** a barra diz de onde vêm as tarefas.
- **Depende de:** DASHBOARD-LE-API.8

### DASHBOARD-LE-API.11 — Aviso de API desatualizada (`meta.geradoEm` antigo)

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Se o `db.json` foi gerado há mais de um limite (constante), avisar "API desatualizada: rode `npm run gerar`".
- **Critérios de Aceitação:** aviso aparece com `geradoEm` velho e some com a API recém-gerada.
- **Depende de:** DASHBOARD-LE-API.6, DASHBOARD-LE-API.10

### DASHBOARD-LE-API.12 — Parâmetro `?fonte=api|quadro` para forçar a fonte

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Depuração: força a API ou o STATUS.md pela URL.
- **Critérios de Aceitação:** cada valor força a fonte pedida; sem parâmetro vale a escolha automática.
- **Depende de:** DASHBOARD-LE-API.8

### DASHBOARD-LE-API.13 — API vazia ou com campos faltando: mensagem clara

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Coleção vazia ou item sem `id`/`statusCodigo` não quebra a página; mostra aviso e cai no plano B.
- **Critérios de Aceitação:** `db.json` vazio mostra mensagem e usa o STATUS.md.
- **Depende de:** DASHBOARD-LE-API.7

### DASHBOARD-LE-API.14 — Conferir CORS e rotas por `curl` com a API no ar

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Subir `npm start` em `api/`, conferir `Access-Control-Allow-Origin` para `http://localhost:8080` e as rotas `/tarefas`, `/frentes`, `/meta`; derrubar o servidor.
- **Critérios de Aceitação:** CORS liberado e rotas respondem; nada fora de 127.0.0.1.
- **Depende de:** API-QUADRO-JSON-SERVER.3, DASHBOARD-LE-API.5

### DASHBOARD-LE-API.15 — Conferir paridade: tarefas abertas da API × `lerQuadro(STATUS.md)`

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Script descartável (no scratchpad, fora do repositório) compara os ids e status abertos dos dois leitores.
- **Critérios de Aceitação:** mesmas tarefas abertas e mesmos status nas duas fontes.
- **Depende de:** DASHBOARD-LE-API.7, API-QUADRO-JSON-SERVER.3

### DASHBOARD-LE-API.16 — Revisar limites e nomes nos JS tocados

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Função até 45 linhas, JSDoc, linhas até 100 colunas, nomes em português, `node --check`.
- **Critérios de Aceitação:** nenhum desvio das regras de código.
- **Depende de:** DASHBOARD-LE-API.13

### DASHBOARD-LE-API.17 — README do dashboard: modo API e como subir API + servidor

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** LEVE — só texto e constantes, sem lógica
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Seção com `npm run gerar`, `npm start` em `api/`, `python -m http.server 8080` na raiz e o `?fonte=`.
- **Critérios de Aceitação:** passo a passo certo e testável.
- **Depende de:** DASHBOARD-LE-API.16

### DASHBOARD-LE-API.18 — `dashboard/CLAUDE.md` e `ROLLBACK-AGENTES.md`: nota da fonte API e volta

**Próximo passo:** aguardar as dependências e o sim do usuário.

- **Nível:** LEVE — só texto e constantes, sem lógica
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Registrar que a API é a fonte primária local e que `?fonte=quadro` volta ao modo anterior.
- **Critérios de Aceitação:** rollback descrito em 1 linha.
- **Depende de:** DASHBOARD-LE-API.17

### DASHBOARD-LE-API.19 — Conferir na tela com a API ligada e desligada

**Próximo passo:** aguardar as dependências.

- **Nível:** LEVE — ação do usuário no navegador (a IA não abre navegador)
- **Modelo:** Usuário
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** abrir `http://localhost:8080/dashboard/` com a API no ar e depois com ela desligada; conferir o indicador de fonte e o plano B.
- **Critérios de Aceitação:** a tela mostra as tarefas nos dois casos.
- **Depende de:** DASHBOARD-LE-API.16, DASHBOARD-LE-API.14

### DASHBOARD-LE-API.20 — Fechamento: `STATUS_PROJETO.md` e mover a tarefa para `task_complete.md`

**Próximo passo:** aguardar as dependências.

- **Nível:** LEVE — só texto e constantes, sem lógica
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Entrada no histórico e fechamento da mãe pelo ciclo da task.
- **Critérios de Aceitação:** mãe e subtarefas ✅ no `task_complete.md`.
- **Depende de:** DASHBOARD-LE-API.19
