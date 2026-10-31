## Etapa 026-8d26a707 — MCP-QUADRO: servidor MCP para a fila do quadro (sem banco)

**Tarefa:** MCP-QUADRO · **Pedido em:** 2026-10-18 16:19 · **Criada por:** DeepSeek Harness (lead) (local · main)
**Pedido:** "sim" — depois de "não dá de fazer no rules-ai?" e da resposta que propôs a tarefa `MCP-QUADRO`
**Objetivo:** dar aos agentes de qualquer IA e de qualquer projeto a experiência de **fila** (puxar a próxima subtarefa, travar, entregar) por MCP, mantendo o `tasks/STATUS.md` como **fonte única** — sem Supabase, sem banco, sem worker e sem painel novo.
**Situação:** 👀 **plano e spec (C34) aguardando o "sim" do usuário.** Nenhuma subtarefa pode ser reservada antes da aprovação.

---

### Contexto e problema

- O quadro Markdown já tem o que o produto antigo (dashboard-ai) tentava resolver com banco: subtarefa com nível e modelo, reserva (C9/C22), trava especial, dependências, histórico (`task_complete.md`) e leitura multi-projeto (`dashboard/graphs/quadro_tarefas.py`).
- O que falta é a **chamada de ferramenta**: hoje o agente lê o `STATUS.md`, escolhe e edita a linha à mão. O dashboard-ai resolvia isso com MCP + Supabase (`task_next`/`task_finish`, RPC `pegar_proxima_task` com `SKIP LOCKED`), mas o projeto vai ser descontinuado e o banco duplicaria a fonte de verdade.
- A trava já existe no Git: reserva = commit `lock: assumindo sub-task <COD> por <frente>` + push. O `pre-push`/`pull --rebase` garantem que dois agentes não reservem a mesma linha.
- **Conclusão do desenho:** um MCP **fino** sobre o Markdown resolve a mesma dor sem serviço externo. O quadro continua sendo a fonte única (C4, C27, `quadro-de-tarefas.md`).

### Escopo

**Entra:**

- Servidor MCP local (**stdio**, JSON-RPC 2.0) sem dependência npm, em `mcp/`, com as ferramentas `task_next`, `task_finish` e `task_list`.
- Leitor/escritor do `tasks/STATUS.md` (colunas achadas pelo nome) e do `tasks/task_complete.md`; descoberta de projetos em `C:\fontes` (ignorando `DEMAIS-PROJETOS-*` e pastas ocultas — C20/C23).
- Trava por Git: `fetch` + `pull --rebase` + commit `lock:` + push, com revalidação e retry; nunca `--force`, nunca merge.
- Regra global `regras/mcp-quadro.md` + índice + `CONFLITOS.md` **C40** ("o quadro é a fonte; MCP só lê/escreve nele").
- Instalação/documentação (registro em Claude Code e Codex), testes de invariantes permitidos em `PESADO` (C34) e rollout medido em 2 projetos.

**Não entra:**

- Supabase, banco, fila em tabela, RLS, pgvector, `brain_store`/`brain_search` (tarefa própria, se um dia houver).
- Painel React, monitor com Realtime, worker LangGraph, classificador Laya/Opus dentro do MCP.
- Criar tarefa-mãe, mudar nível/modelo, mudar prioridade, aprovar plano, responder permissão ou disparar sessão.
- Mudar o formato do quadro, as regras de reserva ou o `gerenciador-centralizado.md`; mexer em `dashboard/` ou em `dashboard-ai-*`.
- Transporte HTTP com token na v1 (fica para o gerenciador centralizado, se precisar).

### Premissas

- Node.js ≥ 22 na máquina (verificado: 24.x); `node:test` e `fetch` nativos, sem `npm install`.
- Projetos elegíveis: pastas de `C:\fontes` com `tasks/STATUS.md` (a mesma descoberta de `quadro_tarefas.py`).
- O quadro é a única fila: reserva = commit + push; conclusão = mover a linha para `task_complete.md` no mesmo commit da entrega (C4).
- Prefixos `lock:`, `feat(<COD>)` e `docs(board):` são mantidos (é o que o espelho de eventos e o gerenciador leem).
- `mcp/` é **aditivo**: não muda o comportamento de quem não usa o MCP; `sincronizar.mjs` continua mandando as regras para `regras/`.

### Arquitetura

```
mcp/servidor.mjs        servidor MCP stdio (JSON-RPC 2.0), roteamento e validação de argumentos
mcp/ferramentas.mjs     task_next | task_finish | task_list (regras de decisão)
mcp/quadro.mjs          parser/escritor do STATUS.md e do task_complete.md (linha a linha, colunas por nome)
mcp/projetos.mjs        descoberta de projetos (C20/C23, caminhos normalizados, allowlist de raiz)
mcp/git.mjs             fetch/pull --rebase/commit/push com retry; recusa --force e merge
mcp/config.mjs          raízes, limites, caminho do log (fora do Git)
mcp/testes/*.mjs        invariantes INV-1..INV-6 (node:test; permitido em PESADO, C34)
```

Fluxo do `task_next`:

```
agente → task_next(projeto, modelo/frente)
  → lê STATUS.md e as etapas (dependências, nível, trava)
  → escolhe UMA subtarefa livre do nível do modelo
  → git pull --rebase (se árvore do quadro limpa; senão recusa)
  → grava "Em uso por" + 🔄 na linha
  → commit "lock: assumindo sub-task <COD> por <frente>" + push
  → push recusado → pull --rebase, revalida a linha (ainda livre?) e repete (máx. 3)
  → devolve a subtarefa com descrição, critérios e caminho da etapa
```

Fluxo do `task_finish`:

```
agente → task_finish(COD, resultado, commit_sha)
  → confere que a reserva é daquela frente
  → move a linha para task_complete.md (não copia, C4) e anota a entrega na seção da etapa
  → 1 commit "feat(<COD>): <descrição> por <frente>" + push
  → se a mãe fechar, devolve "mãe concluída" (quem move a mãe é o agente, pela C4)
```

### Segurança

- **Escrita só em** `tasks/STATUS.md`, `tasks/task_complete.md` e seções da própria subtarefa em `tasks/etapas/`; qualquer outro caminho é recusado.
- Raízes permitidas por allowlist (`C:\fontes` e subpastas com quadro); caminho com `..` ou symlink é recusado; `DEMAIS-PROJETOS-*` e pastas ocultas nunca são listadas (C20/C23).
- O servidor **não executa** código do projeto, não lê `.env`, não acessa a rede na v1 e não escreve em `.git/config`.
- `git` restrito à lista de comandos; `--force`, `merge`, `rebase -i` e `reset --hard` são bloqueados por teste (INV-4).
- Log local em `mcp/saidas/acoes.jsonl` (fora do Git), sem segredo nem conteúdo de tarefa.
- Falha do MCP nunca altera o quadro pela metade: escritor grava arquivo temporário e move só no fim; em erro, `git restore` do arquivo.

### Requisitos

| ID | Requisito (EARS) | Cobre | Verificação |
|----|------------------|-------|-------------|
| R1.1 | QUANDO o agente chamar `task_next` com projeto e modelo, O SISTEMA DEVE reservar no `STATUS.md` uma subtarefa livre do nível do modelo, com commit `lock:` e push antes de devolvê-la | MCP-QUADRO.3, .4 | teste com repositório temporário: linha muda, commit `lock:` existe, push feito |
| R1.2 | SE não houver subtarefa livre do nível do modelo, ENTÃO O SISTEMA DEVE devolver lista vazia com o motivo, sem alterar o quadro | MCP-QUADRO.4 | projeto de teste com todas as linhas reservadas; hash do `STATUS.md` inalterado |
| R1.3 | SE o push da reserva for recusado porque o remoto andou, ENTÃO O SISTEMA DEVE fazer `pull --rebase`, conferir que a linha continua livre e repetir no máximo 3 vezes, nunca com `--force` | MCP-QUADRO.3 | repo temporário com remoto à frente; conferir retry e ausência de `--force` |
| R1.4 | SE o quadro tiver alteração não commitada, ENTÃO O SISTEMA DEVE recusar `task_next` sem tocar em nenhum arquivo | MCP-QUADRO.3 | sujar o quadro e chamar; conferir erro e `git status` igual |
| R1.5 | QUANDO o agente concluir a subtarefa com `task_finish`, O SISTEMA DEVE mover a linha para o `task_complete.md` e anotar a entrega na seção da etapa no mesmo commit | MCP-QUADRO.5 | repo temporário; conferir linha movida (não copiada) e seção atualizada |
| R2.1 | O SISTEMA DEVE descobrir qualquer projeto com `tasks/STATUS.md` em `C:\fontes`, ignorando `DEMAIS-PROJETOS-*` e pastas ocultas | MCP-QUADRO.2 | teste com pasta sintética proibida; conferir que não aparece |
| R2.2 | O SISTEMA DEVE achar as colunas do quadro pelo nome do cabeçalho e funcionar com e sem as colunas `Modelo` e `Verificado` | MCP-QUADRO.2 | dois quadros sintéticos (com e sem as colunas); conferir leitura e escrita |
| R3.1 | O SISTEMA DEVE registrar cada chamada em log local com ferramenta, projeto, código, commit e resultado, sem segredo | MCP-QUADRO.4 | chamar as 3 ferramentas e ler o JSONL |
| R3.2 | O SISTEMA DEVE recusar caminho fora das raízes permitidas e nunca escrever em `.env`, `.git/config` ou código do projeto | MCP-QUADRO.2, .4 | tentar escrever em `..\\x`, `.env` e `src/`; conferir recusa |
| R4.1 | O SISTEMA DEVE expor as 3 ferramentas por MCP stdio (JSON-RPC 2.0) e documentar o registro em Claude Code e Codex | MCP-QUADRO.4, .6 | `task_list` via cliente MCP de teste; ler o README |
| R5.1 | QUANDO a regra global for publicada, O SISTEMA DEVE passar pela simulação do `scripts/sincronizar.mjs` antes do `--aplicar` | MCP-QUADRO.1 | rodar a simulação e conferir o diff |
| R5.2 | O SISTEMA DEVE continuar sem dependência npm (só Node nativo), para rodar em qualquer projeto | MCP-QUADRO.4 | `package.json` não existe em `mcp/`; rodar sem `node_modules` |

**Não-objetivos:** banco/Supabase, painel, worker, `brain_*`, criar mãe, mudar nível/modelo/prioridade, aprovar plano, responder permissão, disparar sessão.

### Invariantes

| ID | Regra que vale sempre | Domínio da entrada | Como conferir | Teste automatizado |
|----|----------------------|--------------------|---------------|--------------------|
| INV-1 | Nenhuma escrita fora de `tasks/STATUS.md`, `tasks/task_complete.md` e `tasks/etapas/` | qualquer chamada das 3 ferramentas | hash de todos os arquivos fora de `tasks/` antes/depois | sim: `mcp/testes/invariantes.mjs` |
| INV-2 | O quadro continua válido: toda linha de tarefa com o mesmo número de colunas do cabeçalho e emoji de status | qualquer escrita no quadro | parser relê o arquivo gravado e compara colunas | sim: `mcp/testes/quadro.mjs` |
| INV-3 | A mesma subtarefa nunca fica reservada por duas frentes | duas chamadas concorrentes de `task_next` | repo temporário com push concorrente; só um `lock:` passa | sim: `mcp/testes/concorrencia.mjs` |
| INV-4 | Nenhum comando proibido de Git (`--force`, `merge`, `rebase -i`, `reset --hard`) | qualquer chamada | conferir a lista de comandos em `mcp/git.mjs` e teste com espião | sim: `mcp/testes/git.mjs` |
| INV-5 | O `task_next` nunca devolve subtarefa de nível acima ou abaixo do modelo do chamador (C2/C22/C35) | qualquer combinação projeto × modelo | tabela de casos por modelo × nível | sim: `mcp/testes/niveis.mjs` |
| INV-6 | Nenhum segredo do ambiente aparece no log | qualquer chamada | token sintético no ambiente e leitura do JSONL | sim: `mcp/testes/log.mjs` |

Teste automatizado de invariante é a exceção permitida em `PESADO` (C34, `espec.md`); fora dele, a conferência é por leitura/comando.

### Perguntas abertas

> As respostas abaixo são a **proposta do plano**; o "sim" do usuário as fecha oficialmente e libera a execução.

| # | Pergunta | Resposta | Fechada em | Quem respondeu |
|---|----------|----------|------------|----------------|
| 1 | Onde mora o servidor? | ✅ `mcp/` no próprio `rules-ai`, sem dependência npm nova | 2026-10-18 | Plano (DeepSeek Harness) |
| 2 | Qual transporte na v1? | ✅ stdio (JSON-RPC 2.0); HTTP com token fica para o gerenciador centralizado | 2026-10-18 | Plano (DeepSeek Harness) |
| 3 | Qual é a fonte da fila? | ✅ `tasks/STATUS.md`; nada de banco, tabela ou cópia da fila | 2026-10-18 | Plano (DeepSeek Harness) |
| 4 | Como a reserva fica atômica? | ✅ commit `lock:` + push (o Git é a trava); retry com `pull --rebase`, nunca `--force` | 2026-10-18 | Plano (DeepSeek Harness) |
| 5 | `brain_store`/`brain_search` entram? | ✅ Não nesta tarefa; memória fica para uma tarefa própria, se o usuário quiser | 2026-10-18 | Plano (DeepSeek Harness) |
| 6 | O MCP pode criar tarefa-mãe ou subtarefa? | ✅ Não: subtarefa nasce pela IA no quadro (C26); o MCP só reserva e entrega o que existe | 2026-10-18 | Plano (DeepSeek Harness) |
| 7 | Quem pode chamar? | ✅ Qualquer IA local com Node ≥ 22; sem token na v1 porque o transporte é local | 2026-10-18 | Plano (DeepSeek Harness) |
| 8 | A linha concluída é movida ou copiada? | ✅ Movida para `task_complete.md`, no mesmo commit da entrega (C4) | 2026-10-18 | Plano (DeepSeek Harness) |
| 9 | Muda alguma regra existente? | ✅ Não; só acrescenta `regras/mcp-quadro.md` + C40, sem tocar em reserva, níveis ou quadro | 2026-10-18 | Plano (DeepSeek Harness) |
| 10 | Trocar o MCP do app antigo? | ✅ Não há o que trocar: o MCP antigo não está conectado (`DASHBOARD_AI_MCP_URL` ausente) | 2026-10-18 | Plano (DeepSeek Harness) |

### Riscos e plano B

| Risco | Plano B |
|---|---|
| Duas sessões reservarem a mesma linha | push é a barreira; `pull --rebase` + revalidação + retry; INV-3 com push concorrente |
| Escritor corromper o quadro | parser round-trip (INV-2), gravação atômica, conferência de colunas; em erro, `git restore` e abortar |
| Árvore suja misturar trabalho de outra tarefa | recusar `task_next` quando o quadro estiver alterado (R1.4) |
| Projeto com formato de quadro diferente | colunas por nome (R2.2) e teste com dois formatos; se não casar, recusa com mensagem |
| Dependência de Git/remoto | sem rede o `task_next` recusa e avisa; modo `--dry-run` para listar sem reservar |
| Regra nova conflitar com a C26/C4/C22 | C40 diz explicitamente que o MCP não cria, não decide nível e não copia linha; testes cobrem |
| Crescer e virar um segundo gerenciador | escopo fechado em 3 ferramentas; disparo de sessão continua no `gerenciamento-centralizado` |
| Windows/Linux com caminhos e CRLF | normalizar separadores e LF no escritor; teste em repositório temporário |

### Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-18 16:19 | MCP-QUADRO registrada como tarefa grande (`PESADO`, spec C34 na etapa 026); execução só depois do "sim" | DeepSeek Harness (lead) | pedido direto do usuário ("sim" para registrar); cria estrutura nova e mexe em Git/escrita no quadro |
| 2026-10-18 | Fila = quadro Markdown; nada de banco/Supabase/pgvector | DeepSeek Harness (lead) | evita duas fontes de verdade e mantém o repo sem serviços |
| 2026-10-18 | Reserva atômica = commit `lock:` + push | DeepSeek Harness (lead) | a trava já existe e é auditável; é o mesmo fluxo das regras atuais |
| 2026-10-18 | MCP não cria tarefa, não escolhe nível e não aprova nada | DeepSeek Harness (lead) | respeita C26, C22/C35 e C32 |
| 2026-10-18 | C40 registrada no `CONFLITOS.md`; `regras/mcp-quadro.md` só na subtarefa .1 | DeepSeek Harness (lead) | mudança global só depois do "sim" e com simulação do sincronizador |

- 2026-10-23: **a pedido do usuário**, a MCP-QUADRO.2 libera teste, mas **só pelo Haiku 5.5** (ou Gemini Flash ou DeepSeek Flash), em **subtarefa nova** criada na subtarefa que pede o teste (aqui, MCP-QUADRO.8, C26). O agente Sonnet não escreve teste; o arquivo que ele criou foi removido.

### MCP-QUADRO.1 — Regra global, índice e C40

**Próximo passo:** o Haiku-comitê confere e commita `regras/mcp-quadro.md` (novo), `regras/INDEX.md`, `dist/REGRAS-GLOBAIS.md` e `VERSAO.md` (regerados pela simulação). Depois, `MCP-QUADRO.2` (Sonnet). `--aplicar` do sincronizador fica para o usuário pedir.
- **Nível:** LEVE — só arquivos `.md` e o índice; sem código.
- **Modelo:** só Haiku — nunca outro.
- **Effort:** low
- **Depende de:** Nenhuma.
- **Descrição:** a regra diz em 1 página: o quadro é a fonte única; o MCP lê/escreve nele e nada mais; reserva = commit + push; ferramentas `task_next`/`task_finish`/`task_list`; nunca banco; nunca `--force`; nunca criar tarefa. C40 registra a decisão e o "não entra" (Supabase/React/worker).
- **Arquivos:** `regras/mcp-quadro.md`, `regras/INDEX.md`, `CONFLITOS.md`.
- **Critérios de Aceitação:** regra ≤ 5 KB, indexada, C40 com data e frase do pedido; simulação do sincronizador sem erro e sem gravar; `--aplicar` continua sendo ação do usuário.
- **Entrega:** sem commit (o Haiku-comitê commita). Criado `regras/mcp-quadro.md` (3,3 KB, com as regras de reserva, entrega, limites e o que o MCP nunca faz). Alterados `regras/INDEX.md` (item 22, sob "Agentes e ferramentas") e os arquivos gerados `dist/REGRAS-GLOBAIS.md` e `VERSAO.md` (versão `2026-10-23-df176636`; `mcp-quadro.md` entra na tabela de regras da `VERSAO.md` com o código `005e9e89838e472a`). `CONFLITOS.md` não mudou: a C40 já estava registrada em 2026-10-18 com a frase do pedido.
- **Verificação:** `node scripts/sincronizar.mjs` (sem `--aplicar`) saiu com código 0, sem erro. Os destinos das IAs aparecem como `mudaria` (nenhum foi gravado). Conferido: o texto "Fila por MCP" está no `dist/REGRAS-GLOBAIS.md`, o link `](mcp-quadro.md)` está no `INDEX.md` e a `VERSAO.md` lista o arquivo. Não foi usado Git nesta subtarefa (proibido pelo pedido); o `git status` fica para o Haiku-comitê.
- **Anotação:** a simulação grava `dist/REGRAS-GLOBAIS.md` e `VERSAO.md` no repositório mesmo sem `--aplicar` (é o comportamento do script); os arquivos globais das IAs não foram tocados. Pendência fora desta subtarefa: `STATUS_PROJETO.md` não foi atualizado (o pedido proibiu); a regra do `rules-ai` manda atualizá-lo no mesmo passo. Também existe um número de item repetido no `regras/INDEX.md` (dois itens "20."), anterior a esta mudança.
- **Estimativa:** 1 h.
- **JEV-AI-SUGGESTION:** NAO

### MCP-QUADRO.2 — Leitor/escritor do quadro e descoberta de projetos

**Próximo passo:** ✅ entregue em 2026-10-23; a .3 (Opus) segue parada.
- **Nível:** MEDIO — lógica em 3 arquivos, sem rede e sem escrita fora de `tasks/`.
- **Modelo:** só Sonnet — nunca outro.
- **Effort:** medium
- **Depende de:** MCP-QUADRO.1.
- **Descrição:** descoberta de projetos em `C:\fontes` (ignorando `DEMAIS-PROJETOS-*` e ocultas); parser do `STATUS.md` com colunas por nome (com e sem `Modelo`/`Verificado`); leitura da etapa para nível/critérios/dependências; escritor que preserva ordem e formatação da tabela; recusa de caminho fora da allowlist.
- **Arquivos:** `mcp/quadro.mjs`, `mcp/projetos.mjs`, `mcp/config.mjs`.
- **Critérios de Aceitação:** lê os 2 formatos; grava e relê sem mudar colunas (INV-2); pasta proibida nunca aparece; `node --check` passa.
- **Entrega:** sem commit (o líder commita; esta subtarefa não usa Git). Criados `mcp/config.mjs` (110 linhas: raiz `C:\fontes` ou `MCP_QUADRO_RAIZ`, prefixos ignorados, arquivos permitidos, emojis, códigos de erro e `ErroQuadro`), `mcp/projetos.mjs` (203 linhas: `listarProjetos`, `obterProjeto`, `resolverCaminhoDeTasks`, que só aceita `tasks/STATUS.md`, `tasks/task_complete.md` e `tasks/etapas/*.md` e recusa `..`, absoluto, `.env`, `.git`, `src/`, NUL e link simbólico), `mcp/quadro.mjs` (724 linhas: `lerQuadro`, `serializarQuadro`, `validarQuadro`, `atualizarLinha`, `moverLinha`, `dependenciasPendentes`, leitura da etapa com `lerSubtarefaDaEtapa`/`atualizarCampoDaSubtarefa`, `lerSubtarefa` e `gravarArquivoDeTasks` com gravação atômica e conferência da INV-2) e `mcp/testes/quadro.mjs` (teste da INV-2, declarado na seção Invariantes desta etapa, que é `PESADO`).
- **Verificação:** `node --check` nos 3 arquivos (`mcp/config.mjs`, `mcp/projetos.mjs`, `mcp/quadro.mjs`) sem erro; leitura SEM gravar dos 6 projetos reais com quadro, relida byte a byte igual (relato do agente Sonnet). O arquivo de teste que o agente Sonnet criou (`mcp/testes/quadro.mjs`) foi **removido** por ordem do usuário: teste só pelo Haiku 5.5, em subtarefa nova (MCP-QUADRO.8).
- **Anotação:** (1) o `tasks/task_complete.md` do `rules-ai` e do `aulasenai` **não tem cabeçalho** (só linhas); o leitor aceita isso com `aceitarSemCabecalho` e usa as colunas do `STATUS.md` do mesmo projeto, e a .5 deve acrescentar ao fim da tabela do jeito que está. (2) Status `❌ Cancelada` existe nos quadros reais e foi aceito como emoji de status (nunca conta como livre). (3) O escritor só deixa alterar `status`, `emUsoPor`, `verificado` e `etapa`; nível, modelo, prioridade e dependência ficam travados (C22, C26). (4) O fim de linha do arquivo (LF ou CRLF) e o BOM são preservados, em vez de normalizar tudo para LF, para não gerar diff gigante. (5) `dependenciasPendentes` trata dependência que não aparece em nenhum dos dois quadros como pendente. (6) Pendência para a .3/.4: a regra de "livre" do leitor é `⬜` + "Em uso por" vazio/`—` + não ser mãe nem trava especial; a checagem de nível do chamador e das dependências fica no `task_next`.
- **Estimativa:** 3 h.
- **JEV-AI-SUGGESTION:** NAO

### MCP-QUADRO.8 — Testes da MCP-QUADRO.2: escrever, rodar e confirmar

**Próximo passo:** ✅ entregue em 2026-10-23.

- **Nível:** LEVE — conferência por teste de um código já entregue
- **Modelo:** só Haiku — nunca outro (pedido do usuário; podem fazer teste o Haiku 5.5, o Gemini Flash ou o DeepSeek Flash)
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** manual
- **Descrição:** Testar `mcp/quadro.mjs`, `mcp/projetos.mjs` e `mcp/config.mjs`: lê os 2 formatos de quadro; ler e serializar devolve o mesmo texto (LF, CRLF e BOM); atualizar uma linha mexe só nela; pasta `DEMAIS-PROJETOS-*` e ocultas nunca aparecem; caminho fora de `tasks/` é recusado; gravação que tira coluna é recusada. Não alterar o código da .2: se o teste achar defeito, relatar.
- **Arquivos:** `mcp/testes/quadro.mjs`
- **Critérios de Aceitação:** testes rodam com `node mcp/testes/quadro.mjs` e passam; relatório com o que cada teste cobre.
- **Entrega:** Claude Code (Haiku 5.5 · agente), 2026-10-23: mcp/testes/quadro.mjs (12 testes)
- **Verificação:** `node mcp/testes/quadro.mjs`: 12 testes, 11 passaram, 1 falhou. Falhou o teste extra "DEMAIS-PROJETOS em minúsculas também fica fora da descoberta (C23)": `ehPastaIgnorada` em `mcp/projetos.mjs` compara o prefixo sem ignorar caixa, então `demais-projetos-*` em minúsculas entra na lista. Os 7 testes pedidos passaram. `node --check mcp/testes/quadro.mjs` sem erro; nenhuma pasta temporária sobrou. Confirmado pelo Haiku 5.5 em 2026-10-23 (node mcp/testes/quadro.mjs: 12 passaram, 0 falharam).

### MCP-QUADRO.9 — Corrigir `ehPastaIgnorada` (pasta `demais-projetos-*` em minúsculas)

**Próximo passo:** ✅ entregue em 2026-10-23; o Haiku roda de novo `node mcp/testes/quadro.mjs` para confirmar.

- **Nível:** MEDIO — correção de uma função em 1 arquivo (C26: defeito achado pelo teste da MCP-QUADRO.8)
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** manual
- **Descrição:** `ehPastaIgnorada` comparava o prefixo `DEMAIS-PROJETOS-` sem ignorar maiúsculas e minúsculas; no Windows a pasta `demais-projetos-x` é a mesma e entraria na descoberta (C23).
- **Arquivos:** `mcp/projetos.mjs` (linhas 37–38)
- **Critérios de Aceitação:** o teste "DEMAIS-PROJETOS em minúsculas também fica fora da descoberta" passa.
- **Depende de:** MCP-QUADRO.8
- **Entrega:** Claude Code (Sonnet 5.5) (local · main · rules-ai), 2026-10-23: o nome é passado para maiúsculas antes de comparar com `PREFIXOS_IGNORADOS`.
- **Verificação:** `node --check mcp/projetos.mjs` sem erro; a confirmação pelo teste fica com o Haiku (usuário: teste só pelo Haiku). Confirmado pelo Haiku 5.5 em 2026-10-23 (node mcp/testes/quadro.mjs: 12 passaram, 0 falharam).

### MCP-QUADRO.3 — Trava por Git: reserva atômica, recuperação e dry-run

**Próximo passo:** criar `mcp/git.mjs` e o fluxo de reserva com repositório temporário e remoto local.
- **Nível:** PESADO — mexe em Git, concorrência e escrita no quadro; risco de perder trabalho.
- **Modelo:** só Opus 5.5+ ou Fable, ou DeepSeek — nunca outro.
- **Effort:** high
- **Depende de:** MCP-QUADRO.2.
- **Descrição:** `fetch` + `pull --rebase` + commit `lock:` + push; revalidação da linha depois do rebase; retry até 3 em push recusado; recusa com quadro alterado (R1.4); `--dry-run` que lista sem reservar; rollback com `git restore` quando a escrita falhar; lista fechada de comandos permitidos (INV-4).
- **Arquivos:** `mcp/git.mjs`, `mcp/testes/concorrencia.mjs`, `mcp/testes/git.mjs`.
- **Critérios de Aceitação:** dois `task_next` concorrentes → só um reserva (INV-3); push recusado → retry e sucesso; quadro sujo → recusa sem tocar em nada; nenhum `--force`/merge/`reset --hard`.
- **Verificação:** `node mcp/testes/concorrencia.mjs`; `node mcp/testes/git.mjs`; conferir `git log` do repo temporário.
- **Estimativa:** 4 h.
- **JEV-AI-SUGGESTION:** NAO

### MCP-QUADRO.4 — Servidor MCP stdio: `task_list` e `task_next`

**Próximo passo:** criar `mcp/servidor.mjs` e `mcp/ferramentas.mjs`; validar com um cliente stdio de teste.
- **Nível:** PESADO — estrutura nova (protocolo MCP) e decisão de fila.
- **Modelo:** só Sonnet, ou DeepSeek — nunca outro. (trocado do Opus em 2026-10-23, RECLASSIFICAR-PESADO-OPUS.2)
- **Effort:** high
- **Depende de:** MCP-QUADRO.3.
- **Descrição:** servidor JSON-RPC 2.0 por stdio, sem dependências; `task_list` (somente leitura, com filtros por modelo/projeto); `task_next` aplicando a matriz de níveis (INV-5) e recusando tarefa de outro nível; validação de argumentos; log JSONL sem segredo (INV-6); mensagens de erro curtas e claras.
- **Arquivos:** `mcp/servidor.mjs`, `mcp/ferramentas.mjs`, `mcp/testes/niveis.mjs`, `mcp/testes/log.mjs`.
- **Critérios de Aceitação:** `task_list` devolve o quadro real sem alterar hash; `task_next` nunca devolve nível errado; log sem segredo; `node --check` nos dois arquivos.
- **Verificação:** `node mcp/testes/niveis.mjs`; `node mcp/testes/log.mjs`; chamada manual pelo cliente de teste.
- **Estimativa:** 3 h.
- **JEV-AI-SUGGESTION:** NAO

### MCP-QUADRO.5 — `task_finish`: mover para `task_complete.md` e anotar a entrega

**Próximo passo:** implementar `task_finish` em `mcp/ferramentas.mjs` com o escritor da subtarefa/etapa.
- **Nível:** PESADO — escreve no quadro e na etapa, faz commit de entrega; risco de perder histórico.
- **Modelo:** só Sonnet, ou DeepSeek — nunca outro. (trocado do Opus em 2026-10-23, RECLASSIFICAR-PESADO-OPUS.2)
- **Effort:** high
- **Depende de:** MCP-QUADRO.4.
- **Descrição:** confere que a reserva é da frente chamadora; move a linha (não copia, C4) para `task_complete.md`; anota `Entrega`/`Verificação`/`Anotação` na seção da subtarefa na etapa; commit `feat(<COD>): ... por <frente>` + push; devolve "mãe concluída" quando a última subtarefa fecha (sem mover a mãe).
- **Arquivos:** `mcp/ferramentas.mjs`, `mcp/quadro.mjs`, `mcp/testes/entrega.mjs`.
- **Critérios de Aceitação:** linha movida e não duplicada; etapa anotada; commit único; reserva de outra frente é recusada; fechamento da mãe sinalizado.
- **Verificação:** `node mcp/testes/entrega.mjs`; conferir `git log` e os dois quadros no repo temporário.
- **Estimativa:** 3 h.
- **JEV-AI-SUGGESTION:** NAO

### MCP-QUADRO.6 — Instalação, documentação e ensaio em 2 projetos

**Próximo passo:** escrever `mcp/README.md`, registrar o servidor no Claude Code e no Codex e rodar `task_list`/`task_next --dry-run` em 2 projetos reais.
- **Nível:** MEDIO — configuração e documentação; nada de lógica nova.
- **Modelo:** só Sonnet — nunca outro.
- **Effort:** medium
- **Depende de:** MCP-QUADRO.4.
- **Descrição:** README com instalação (`claude mcp add` e `codex mcp add`, sem token na v1), exemplos de uso e limites; registro local (fora do Git) para testar; ensaio em `rules-ai` e mais um projeto com quadro, usando `--dry-run` na reserva; registrar o resultado e as dificuldades na etapa.
- **Arquivos:** `mcp/README.md`, `tasks/STATUS.md`/etapa (registro do ensaio), configuração local do usuário (fora do Git).
- **Critérios de Aceitação:** MCP responde `task_list` nas 2 IAs registradas; `--dry-run` não altera quadro; README reproduzível do zero.
- **Verificação:** chamar `task_list` por cada IA; `git status` limpo depois do dry-run.
- **Estimativa:** 2 h.
- **JEV-AI-SUGGESTION:** NAO

### MCP-QUADRO.7 — Rollout medido e fechamento

**Próximo passo:** reservar 3 subtarefas reais com `task_next`, entregar com `task_finish` e medir tempo/erros; depois fechar a mãe.
- **Nível:** MEDIO — execução acompanhada e registro; sem código novo.
- **Modelo:** só Sonnet — nunca outro.
- **Effort:** medium
- **Depende de:** MCP-QUADRO.5, MCP-QUADRO.6.
- **Descrição:** usar o MCP em 3 subtarefas reais (com o líder validando); comparar o tempo com o fluxo manual; conferir que nenhum invariante falhou; registrar números na etapa; atualizar `STATUS_PROJETO.md`; mover a mãe para `task_complete.md` (C4) e pedir o `--aplicar` global ao usuário.
- **Arquivos:** `tasks/STATUS.md`, `tasks/task_complete.md`, `STATUS_PROJETO.md`, etapa.
- **Critérios de Aceitação:** 3 reservas e 3 entregas sem corrupção; nenhum invariante falhou; números registrados; mãe fechada; `--aplicar` pedido ao usuário.
- **Verificação:** `git log` das entregas; leitura dos quadros; `node mcp/testes/invariantes.mjs` (todos).
- **Estimativa:** 2 h.
- **JEV-AI-SUGGESTION:** NAO

### Critérios de pronto da tarefa-mãe

- [ ] Gate da spec passa e a regra `regras/mcp-quadro.md` + C40 estão indexadas e simuladas no sincronizador.
- [ ] `task_next` reserva e `task_finish` entrega em repositório temporário **e** em 2 projetos reais, sem corromper quadro (INV-2).
- [ ] Concorrência: 2 chamadas simultâneas → 1 reserva (INV-3); nenhum `--force` (INV-4).
- [ ] Nível errado nunca é devolvido (INV-5); log sem segredo (INV-6); nada escrito fora de `tasks/` (INV-1).
- [ ] Zero dependência npm; `node --check` em todos os `.mjs`; instalação reproduzível no README.
- [ ] Rollout em 3 subtarefas com números registrados; mãe movida para `task_complete.md`.

### Validação geral

```powershell
node spec/verificar-spec.mjs tasks/etapas/ETAPA-026-8d26a707-MCP-QUADRO.md
node --check mcp/servidor.mjs
node --check mcp/ferramentas.mjs
node mcp/testes/invariantes.mjs
node mcp/testes/quadro.mjs
node mcp/testes/concorrencia.mjs
node mcp/testes/git.mjs
node mcp/testes/niveis.mjs
node mcp/testes/log.mjs
node mcp/testes/entrega.mjs
node scripts/sincronizar.mjs
git diff --check
```

Sem navegador. Testes automatizados só os invariantes declarados (PESADO, C34); fora disso, conferência por leitura/comando.

### Cronograma (estimativa)

| Subtarefa | Horas |
|---|---|
| .1 Regra e C40 | 1 |
| .2 Leitor/escritor | 3 |
| .3 Trava por Git | 4 |
| .4 Servidor MCP | 3 |
| .5 `task_finish` | 3 |
| .6 Instalação e ensaio | 2 |
| .7 Rollout e fechamento | 2 |
| **Total** | **18 h** (3–4 dias úteis, em série) |

### Aprovação

👀 **Aguardando o "sim" do usuário ao plano e à spec (C34).** Depois do "sim", registrar a aprovação nas Decisões e liberar apenas `MCP-QUADRO.1`. O `--aplicar` global e o registro do MCP nas IAs continuam dependendo de confirmação própria.

### Referências

- Regras: `regras/ciclo-da-task.md`, `quadro-de-tarefas.md`, `niveis-e-modelos.md`, `esforco.md`, `espec.md`, `frentes-e-reserva.md`, `pastas-ignoradas.md` (C20/C23), `C4`, `C22`, `C26`, `C32`, `C35`.
- Fila antiga (referência de desenho, projeto que será descontinuado): `C:\fontes\dashboard-ai-claude-code-senai\README.md` (seções "Agentes de IA (fila via MCP)" e "Memória via MCP") e `api/mcp.ts`.
- Leitor multi-projeto já existente: `dashboard/graphs/quadro_tarefas.py`.
- MCP: <https://modelcontextprotocol.io> (stdio e JSON-RPC 2.0).
- Gate: `spec/verificar-spec.mjs`; templates em `spec/templates/`.
