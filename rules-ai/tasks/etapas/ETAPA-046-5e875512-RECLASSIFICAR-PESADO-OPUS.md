## Etapa 046-5e875512 — RECLASSIFICAR-PESADO-OPUS: tirar do Opus o que não precisa dele

**Tarefa:** RECLASSIFICAR-PESADO-OPUS · **Pedido em:** 2026-10-23 · **Criada por:** Claude Code (Haiku 5.5) (local · main · consumo-ia)
**Pedido:** "CRIE 1 TASK QUE RECLASSIFIQUE AS TASKS DA SEGUINTE FORMA: TODAS AS TAREFAS DE NIVEL PESADO DO OPUS, DEVEM IR PRA SONNET E ESSA TAREFA DEVE SER FEITA PELO SONNET AGORA, DIZENDO O QUE *REALMENTE DEVE IR AO OPUS 5,5*"
**Objetivo:** mandar toda subtarefa `PESADO` que hoje está só com Opus 5.5+/Fable para o Sonnet, e deixar com o Opus apenas o que realmente precisa dele, com a lista e a justificativa para o usuário decidir.

### Escopo

- **Entra:** inventário de todas as subtarefas `PESADO` com Modelo só Opus 5.5+/Fable (quadro `tasks/STATUS.md` e etapas em `tasks/etapas/`); proposta de Sonnet ou Opus para cada uma; depois da aprovação, a troca da coluna Modelo e da linha `**Modelo:**` das etapas.
- **Não entra:** mudar o nível (`PESADO`, `MEDIO`, `LEVE`) de nenhuma subtarefa; mudar `regras/niveis-e-modelos.md` (a matriz é do usuário); reservar ou executar subtarefa de outro modelo; mexer em subtarefa reservada (`🔄`).
- **Quem executa:** **Sonnet, agora** (pedido do usuário). O Haiku criou a etapa e não executa parte alguma.

### Requisitos

- **R1.** QUANDO a `.1` for executada, O SISTEMA DEVE listar cada subtarefa `PESADO` com Modelo só Opus 5.5+/Fable, com ID, título, status e um dos dois destinos (`Sonnet` ou `Opus`), com a justificativa em 1 frase. **Verificação:** tabela na seção da `.1`, com contagem total conferida por `grep`.
- **R2.** SE a justificativa for `Opus`, ENTÃO O SISTEMA DEVE citar o sinal do Opus: escolha de arquitetura, decisão de segurança sem precedente no projeto, ou mudança em massa com risco alto. **Verificação:** cada `Opus` tem o sinal citado.
- **R3.** QUANDO a `.2` for executada (só após o "sim" do usuário à lista da `.1`), O SISTEMA DEVE trocar `só Opus 5.5+/Fable` por `só Sonnet` nas linhas aprovadas para Sonnet, no quadro e nas etapas, sem tocar nas que ficaram com Opus. **Verificação:** `grep` mostra só as linhas aprovadas como Opus.
- **R4.** O SISTEMA DEVE deixar a mudança da matriz (`regras/niveis-e-modelos.md`) como proposta para o usuário, sem editar o arquivo. **Verificação:** o arquivo não muda nesta etapa.

### Invariantes

- **INV-1.** Nenhum nível muda: só a coluna Modelo. **Como conferir:** `git diff` mostra só a coluna Modelo e a linha `**Modelo:**`.
- **INV-2.** Nenhuma subtarefa reservada (`🔄`) é alterada. **Como conferir:** `git diff` não toca linhas com `🔄`.
- **INV-3.** Nada vai para Haiku. **Como conferir:** nenhuma linha de `PESADO` aponta para Haiku.

### Perguntas abertas

- ✅ **P1.** O Sonnet executa agora? Sim, pedido do usuário em 2026-10-23.
- ⬜ **P2.** Aprovar a lista da `.1` (quais ficam com Opus)? Bloqueia a `.2`.
- ⬜ **P3.** A matriz `regras/niveis-e-modelos.md` muda para refletir isso? Decisão do usuário; bloqueia a `.3`.

### Riscos

- **Subtarefa com Sonnet que precisava do Opus:** a `.1` marca o sinal de cada uma; o usuário aprova antes da `.2`. Plano B: devolver a linha ao Opus com `--reclassificar`, sem mudar o nível.
- **Divergência entre quadro e etapa:** a `.2` troca nos dois lugares no mesmo commit. Plano B: `grep` de conferência na `.4`.

### Decisões

- 2026-10-23: tarefa criada pelo Haiku a pedido do usuário; execução da `.1` pelo Sonnet, agora.
- 2026-10-23: a matriz não muda nesta etapa (R4); a decisão de quem pega `PESADO` continua do usuário.
- 2026-10-23 16:50: por pedido do usuário, HAIKU-COMMIT-GLOBAL.1 (antes reservada, linha 1 da tabela da .1) e .2 já foram para Sonnet ou DeepSeek, com a reserva parada liberada; sobram 11 linhas na lista da .1 (9 para Sonnet menos a .2, mais 3 com Opus).

### RECLASSIFICAR-PESADO-OPUS.1 — Inventariar as subtarefas `PESADO` com Opus e propor o destino de cada uma

**Próximo passo:** ✅ entregue em 2026-10-23. Falta o usuário aprovar a lista abaixo (P2); só então a `.2` troca o Modelo.

- **Nível:** PESADO — mais de 3 arquivos e decisão de modelo
- **Modelo:** só Sonnet — nunca outro (pedido do usuário: executar agora)
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** manual
- **Descrição:** Ler o quadro e as etapas, contar cada linha e proposta, sem editar nada.
- **Arquivos:** nenhum (só leitura); a tabela vai na seção desta subtarefa.
- **Critérios de Aceitação:** R1 e R2 atendidos; contagem total igual ao `grep`.
- **Depende de:** Nenhuma
- **Entrega:** Claude Code (Sonnet 5.5) (local · main · rules-ai), 2026-10-23: tabela abaixo; nenhum arquivo de quadro além desta etapa foi alterado.
- **Verificação:** `awk -F'|' '/^\| /{m=$5; if (m ~ /Opus|Fable/ && m !~ /Sonnet/) c++} END{print c}' tasks/STATUS.md` → **13** linhas abertas só com Opus/Fable, igual às 13 da tabela. Outras 4 já incluem Sonnet e não mudam: AI-MEMORY-ROLLOUT-2.1, AGENTES-REALTIME.23, INTEGRACAO-DEEPSEEK.2 e .4.

**Resultado do inventário (R1 e R2):** de 13 linhas, 1 não entra (reservada, INV-2), **9 vão para Sonnet** e **3 ficam com o Opus 5.5+**.

| # | Subtarefa | Status | Modelo hoje | Destino | Justificativa (1 frase) |
|---|---|---|---|---|---|
| 1 | HAIKU-COMMIT-GLOBAL.1 | 🔄 reservada | só Opus 5.5+/Fable ou DeepSeek | **Fica como está** (INV-2) | Reservada desde 2026-10-18 20:17 (aulasenai s17, 0%); reserva parada é liberada só pelo usuário. |
| 2 | HAIKU-COMMIT-GLOBAL.2 | ⬜ | só Opus 5.5+/Fable ou DeepSeek | **Sonnet** | Roda o `sincronizar.mjs --aplicar` que já existe, com prévia e `.bak`; sem decisão nova. |
| 3 | GERENCIADOR-GLOBAL.3 | ⬜ | só Opus 5.5+ ou Fable | **Sonnet** | Só lê os quadros e calcula tarefas livres; nenhum quadro é escrito. |
| 4 | GERENCIADOR-GLOBAL.4 | ⛔ | só Opus 5.5+ ou Fable | **Opus** | Dispara sessões que alteram projetos sem supervisão (limite, trava, `PARAR`): sinal de segurança e autonomia. |
| 5 | GERENCIADOR-GLOBAL.7 | ⬜ | só Opus 5.5+ ou Fable | **Opus** | Mescla dois gerenciadores e revisa o desenho da `.1`: decisão de arquitetura e mudança de escopo. |
| 6 | DASHBOARD-AGENTES.1 | ⬜ | só Opus 5.5+/Fable ou DeepSeek | **Sonnet** | `git rm` de lista fechada, com inventário de imports antes (INV-1) e reversível pelo Git; cuidado só com o que vai para `fora-do-git/`, que o Git não devolve. |
| 7 | DASHBOARD-AGENTES.2 | ⬜ | só Opus 5.5+/Fable ou DeepSeek | **Sonnet** | `git mv` e ajuste de caminhos relativos, reversível. |
| 8 | MCP-QUADRO.3 | ⬜ | só Opus 5.5+/Fable ou DeepSeek | **Opus** | Reserva atômica por Git sob concorrência, com rollback e push recusado: erro sutil perde trabalho de outras frentes. |
| 9 | MCP-QUADRO.4 | ⬜ | só Opus 5.5+/Fable ou DeepSeek | **Sonnet** | Servidor stdio especificado em detalhe, com critérios e testes claros. |
| 10 | MCP-QUADRO.5 | ⬜ | só Opus 5.5+/Fable ou DeepSeek | **Sonnet** | Escreve quadro e etapa, mas apoiado na trava da `.3` e com teste em repositório temporário. |
| 11 | JEV-GLOBAL-AI-FINAL.22 | 👀 | só Opus 5.5+/Fable ou DeepSeek | **Sonnet** | `--aplicar` mecânico; espera o usuário rodar no PC. |
| 12 | RULES-LOCAL-JEV.9 | 👀 | só Opus 5.5+/Fable ou DeepSeek | **Sonnet** | Igual à 11; a parte da nuvem já foi feita, falta o PC. |
| 13 | VERCEL-SEM-DEPLOY-DE-CONTROLE.1 | ⬜ | só Opus 5.5+/Fable ou DeepSeek | **Sonnet** | Texto da regra com o comando já definido; conferir a prévia antes do `--aplicar`. |

**O que realmente deve ficar com o Opus 5.5+:** GERENCIADOR-GLOBAL.4, GERENCIADOR-GLOBAL.7 e MCP-QUADRO.3. Os três têm sinal do R2 (autonomia sem supervisão, arquitetura, concorrência em Git).

**Como a `.2` deve trocar o texto (R3):** `só Opus 5.5+/Fable ou DeepSeek` → `só Sonnet ou DeepSeek`; `só Opus 5.5+ ou Fable` → `só Sonnet`. Só no quadro e nas seções de subtarefas **abertas**; subtarefas concluídas ficam como estão (o histórico não se apaga).

### RECLASSIFICAR-PESADO-OPUS.2 — Trocar o Modelo das linhas aprovadas para Sonnet

**Próximo passo:** ✅ entregue em 2026-10-23; falta a .4 (conferência, Haiku).

- **Nível:** PESADO — muda o quadro e várias etapas
- **Modelo:** só Sonnet — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** manual
- **Descrição:** Aplicar R3 no quadro e nas etapas, no mesmo commit.
- **Arquivos:** `tasks/STATUS.md`, `tasks/etapas/*.md` (só as linhas aprovadas)
- **Critérios de Aceitação:** R3, INV-1, INV-2 e INV-3 atendidos.
- **Depende de:** RECLASSIFICAR-PESADO-OPUS.1, P2
- **Entrega:** Claude Code (Sonnet 5.5 · agente), 2026-10-23: Modelo trocado em 8 subtarefas (GERENCIADOR-GLOBAL.3, DASHBOARD-AGENTES.1, DASHBOARD-AGENTES.2, MCP-QUADRO.4, MCP-QUADRO.5, JEV-GLOBAL-AI-FINAL.22, RULES-LOCAL-JEV.9, VERCEL-SEM-DEPLOY-DE-CONTROLE.1)
- **Verificação:** o `awk` do quadro (Modelo com Opus/Fable sem Sonnet) devolve só GERENCIADOR-GLOBAL.4, GERENCIADOR-GLOBAL.7 e MCP-QUADRO.3. `git diff` mostra só a coluna Modelo (8 linhas no `tasks/STATUS.md`) e a linha `**Modelo:**` (8 linhas em 6 etapas: 009, 020, 026, 029, 030, 034); nenhuma linha 🔄 mudou e nada aponta para Haiku em PESADO. Arquivos tocados: `tasks/STATUS.md`, ETAPA-009, ETAPA-020, ETAPA-026, ETAPA-029, ETAPA-030, ETAPA-034 e esta ETAPA-046.

### RECLASSIFICAR-PESADO-OPUS.3 — Matriz `niveis-e-modelos.md`

**Próximo passo:** decisão do usuário (P3).

- **Nível:** Usuário — só o usuário decide
- **Modelo:** Usuário
- **Effort:** — (decisão do usuário)
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** manual
- **Descrição:** Decidir se a matriz passa a dizer que PESADO é do Sonnet, com Opus só para os casos aprovados em P2 (R4).
- **Critérios de Aceitação:** resposta do usuário registrada em Decisões.
- **Depende de:** RECLASSIFICAR-PESADO-OPUS.2
- **Verificação:** resposta do usuário na conversa.

### RECLASSIFICAR-PESADO-OPUS.4 — Conferência final

**Próximo passo:** ✅ entregue em 2026-10-23.

- **Nível:** LEVE — só contagem e leitura
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** manual
- **Descrição:** Rodar `grep` para confirmar que as linhas `só Opus` restantes são as aprovadas em P2, e que nenhuma `PESADO` aponta para Haiku.
- **Critérios de Aceitação:** INV-3 atendido; contagem igual à da `.1` menos as trocadas.
- **Depende de:** RECLASSIFICAR-PESADO-OPUS.2
- **Entrega:** Claude Code (Haiku 5.5 · agente; conferência C41), 2026-10-23 (reclassificação da .2: commit `d39a271`)
- **Verificação:** `awk` do quadro (Modelo com Opus/Fable sem Sonnet) devolve GERENCIADOR-GLOBAL.4, GERENCIADOR-GLOBAL.7 e MCP-QUADRO.3; `awk` de PESADO com Haiku vazio; `grep -rn "só Opus" tasks/STATUS.md` = 7 linhas: as 3 aprovadas e 4 que já eram `só Opus 5.5+/Fable, Sonnet ou DeepSeek` (não mudaram nesta reclassificação).
