## Etapa 049-1c48e4b2 — API-QUADRO-JSON-SERVER: API em `api/` com as tarefas (completas, disponíveis e status), só com json-server

**Tarefa:** API-QUADRO-JSON-SERVER · **Pedido em:** 2026-10-23 19:30 · **Criada por:** Claude Code (Sonnet 5.5) (local · main · rules-ai)
**Pedido:** "CRIE 1 TAREFA PRA CRIAR UMA API,NUMA PASTA DE NOME *api*, ONDE DEVE GUARDAR TODAS AS CONFIGURACOES DE TAREFAS,COMPLETAS,DISPONIVEIS,STATUS, usando apenas json-server"
**Objetivo:** uma pasta `api/` no `rules-ai` que sobe uma API REST local (json-server) com todas as tarefas do quadro — concluídas, disponíveis e com status — para outros programas lerem sem abrir os `.md`.

### Escopo

- **Entra:** pasta `api/` (nome exato) na raiz do `rules-ai`; `api/package.json` com **json-server** como única dependência; `api/db.json` com as tarefas; subida só em `127.0.0.1`; README curto de uso.
- **Entra, por necessidade:** um script em Node puro (`api/gerar-db.mjs`, sem dependência npm) que preenche o `db.json` a partir de `tasks/STATUS.md` e `tasks/task_complete.md` (sem ele o `db.json` não tem como existir) — ver pergunta P4.
- **Não entra:** banco, Supabase, autenticação, tela, worker, publicação na internet, e qualquer mudança no quadro, na reserva ou nas regras de nível.

### Riscos

- **Fonte única (`quadro-de-tarefas.md`, C40):** o quadro proíbe "cópia da fila em tabela de banco". Plano B/escolha: o `db.json` é **derivado e só de leitura** (gerado do quadro, nunca editado à mão); se o usuário quiser que a API vire a fonte, isso muda a regra e exige decisão nova (pergunta P1).
- **Exposição:** o json-server escuta em todas as interfaces por padrão; mitigação: subir sempre com `--host 127.0.0.1` e deixar isso no `npm start`. O `db.json` não leva segredo (só texto do quadro).
- **Deploy:** `api/` e `db.json` mudam a cada tarefa; se o repositório publicar na Vercel, o `db.json` entra no filtro de arquivos de controle (C46) ou fica fora do Git (pergunta P3).
- **Versão:** json-server 0.17.x é a estável; a 1.x ainda é beta e muda as rotas; fica a 0.17.4 fixa, salvo decisão em contrário.

### Perguntas abertas

- ✅ **P0 — Projeto:** no `rules-ai` (onde está o quadro). O `consumo-ia` é outro projeto e não é tocado.
- ✅ **P1 — Fonte:** o `db.json` é uma **cópia gerada e só de leitura** do quadro; o quadro continua sendo a fonte única.
- ✅ **P2 — Quais projetos:** só o quadro do `rules-ai`.
- ✅ **P3 — Git:** `api/db.json` fora do Git (`api/.gitignore`), gerado quando precisar.
- ✅ **P4 — Gerador:** pode haver o script Node `api/gerar-db.mjs` (sem dependência npm); a API em si usa só json-server.

### Decisões

- 2026-10-23 19:30: pedido do usuário; tarefa **grande** (estrutura nova, várias partes) — plano nesta etapa e aprovação antes de executar. Subtarefas `LEVE` e `MEDIO` (nenhuma `PESADO`), portanto sem o fluxo de spec da C34.
- 2026-10-23 19:32: **aprovação do usuário** ("faca a tarefa API-QUADRO-JSON-SERVER, ja disparando 1 agente por sub-task"). As perguntas P0 a P4 foram fechadas com as opções recomendadas (rules-ai; cópia só de leitura; só este quadro; `db.json` fora do Git; gerador Node permitido). O usuário pode mudar qualquer uma; mudança material pede nova aprovação.
- Formato aprovado do `db.json`: coleção `tarefas` com `id`, `tipo` (`mae`/`sub`), `mae`, `titulo`, `prioridade`, `modelo`, `nivel`, `effort`, `dependeDe`, `status` (texto do quadro), `statusCodigo` (`pendente`/`em_execucao`/`concluido`/`bloqueado`/`aguardando_usuario`), `emUsoPor`, `concluida` (booleano), `disponivel` (booleano: livre e com dependências concluídas), `etapa`; coleção `frentes`; coleção `meta` com a data da geração. Consultas: `/tarefas?concluida=true`, `/tarefas?disponivel=true`, `/tarefas?statusCodigo=em_execucao`.

### API-QUADRO-JSON-SERVER.1 — Criar `api/` com json-server

**Próximo passo:** concluída; segue a .2 (gerador do db.json).

- **Nível:** LEVE — arquivos de configuração e texto, sem lógica
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** criar `api/package.json` (json-server 0.17.4 fixo; `npm start` = `json-server --watch db.json --host 127.0.0.1 --port <porta>`), `api/.gitignore` e `api/README.md`; rodar `npm install` dentro de `api/`.
- **Arquivos:** `api/package.json`, `api/.gitignore`, `api/README.md`
- **Critérios de Aceitação:** `api/` existe com json-server como única dependência; o `npm start` sobe só em 127.0.0.1.
- **Depende de:** Nenhuma
- **Entrega:** commit desta mensagem "feat(API-QUADRO-JSON-SERVER.1)"
- **Verificação:** arquivos conferidos; json-server 0.17.4 única dependência; package.json válido; package-lock.json versionado (decisão do líder: lock de dependência fixa vai no Git); db.json e node_modules ficam fora do Git

### API-QUADRO-JSON-SERVER.2 — Gerar o `db.json` a partir do quadro

**Próximo passo:** concluída; segue a .3 (subir a API e conferir).

- **Nível:** MEDIO — script com lógica de leitura de tabela Markdown
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** `api/gerar-db.mjs` (Node puro) lê as tabelas de `tasks/STATUS.md` e `tasks/task_complete.md` e grava `api/db.json` no formato da etapa; calcula `disponivel` (livre, dependências concluídas, sem trava) e `concluida`; nunca altera o quadro.
- **Arquivos:** `api/gerar-db.mjs`, `api/db.json`
- **Critérios de Aceitação:** o número de tarefas do `db.json` bate com as linhas dos dois arquivos do quadro; o script não escreve fora de `api/`.
- **Depende de:** API-QUADRO-JSON-SERVER.1
- **Entrega:** commit "feat(API-QUADRO-JSON-SERVER.2)"
- **Verificação:** node --check ok; npm run gerar ok; contagem do db.json conferida contra STATUS.md + task_complete.md (218 tarefas nesta geração = 86 do STATUS + 132 do task_complete; a conta de 194 da geração anterior foi antes de outros agentes acrescentarem linhas; status extra `cancelada` para ❌ Cancelada); script só escreve em api/db.json

### API-QUADRO-JSON-SERVER.3 — Conferir a API no ar

**Próximo passo:** concluída; segue a .4 (documentação).

- **Nível:** MEDIO — sobe o servidor e confere a saída por comando
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** subir `npm start` em `api/`, consultar `/tarefas`, `/tarefas?concluida=true`, `/tarefas?disponivel=true` e `/tarefas?statusCodigo=em_execucao` por `curl` e comparar as contagens com o quadro; confirmar que a porta responde só em `127.0.0.1`; derrubar o servidor.
- **Critérios de Aceitação:** contagens iguais às do quadro; sem resposta fora do localhost.
- **Depende de:** API-QUADRO-JSON-SERVER.2
- **Entrega:** nenhuma mudança de código (só conferência)
- **Verificação:** API no ar em 127.0.0.1:3333; /tarefas 218 = 85 STATUS.md + 133 task_complete.md; ?concluida=true 116; ?disponivel=true 7; em_execucao 18; bloqueado 9; aguardando_usuario 14; cancelada 9; /frentes 39; CORS com Origin http://localhost:8080 ok; escuta só em 127.0.0.1; servidor derrubado e porta livre (contagens do quadro conferidas de forma independente pelo Sonnet)

### API-QUADRO-JSON-SERVER.4 — Documentar e fechar

**Próximo passo:** aguardar a .3.

- **Nível:** LEVE — só `.md`
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** completar o `api/README.md` (como gerar e subir); uma linha em `quadro-de-tarefas.md` dizendo que a API é cópia derivada e só de leitura (conforme a P1); entrada no `STATUS_PROJETO.md`; regerar `VERSAO.md` com `sincronizar.mjs` sem `--aplicar`.
- **Critérios de Aceitação:** README correto; regra coerente com a escolha da P1.
- **Depende de:** API-QUADRO-JSON-SERVER.3
