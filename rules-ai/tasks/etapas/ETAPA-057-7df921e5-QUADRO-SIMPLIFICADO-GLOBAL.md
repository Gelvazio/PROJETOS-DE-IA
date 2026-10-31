## Etapa 057-7df921e5 — QUADRO-SIMPLIFICADO-GLOBAL: STATUS.md simplificado vira o formato global do quadro

**Tarefa:** QUADRO-SIMPLIFICADO-GLOBAL · **Pedido em:** 2026-10-26 20:30 · **Criada por:** Claude Code (Sonnet 5.5) (local · main · rules-ai)
**Pedido:** "aulasenai mudou de formato: o quadro agora tem um STATUS.md simplificado, essa é a nova regra global que deve ser seguida, ajuste isso aqui agora". Respostas do usuário no mesmo dia: fonte de status e reserva = **STATUS.md simplificado**; escopo = **regras + scripts**.
**Objetivo:** o `tasks/STATUS.md` passa a ser, em todo projeto, um índice simplificado (um item por tarefa-mãe, com link para a etapa, e as subtarefas em lista recuada), e é a **fonte única** de status e reserva; o `STATUS-COMPLETO.md` vira só histórico detalhado. As regras e os scripts que leem o quadro passam a entender esse formato.

### Escopo

- **Entra:** `regras/quadro-de-tarefas.md` (modelo do `STATUS.md`), referências em `ciclo-da-task.md`, `frentes-e-reserva.md` e `exibicao-de-status.md`; `CONFLITOS.md` (C55); `dist/` e `VERSAO.md` regerados; parsers do quadro em `scripts/gerenciador/quadro.mjs`, `mcp/quadro.mjs`, `scripts/jev/estado.mjs` e `scripts/jev/gravador.mjs`; `dashboard/quadro_tarefas.py` e `dashboard/assets/js/agentes/quadro.js`.
- **Não entra:** converter o quadro dos outros projetos (cada um migra o seu por TASK própria); apagar o formato em tabela (os parsers leem os dois); o `--aplicar` do sincronizador; os arquivos `status/TASK-ID-*-STATUS.md` do `aulasenai` (legado, só leitura).

### Formato novo (derivado do `aulasenai/tasks/STATUS.md`, 2026-10-24)

```markdown
- #<ID> — [<título>](etapas/ETAPA-NNN-<uuid8>-ASSUNTO.md) · <status> · <Em uso por>
  - #<ID>.<n> — <título> · <status> · `<NIVEL>` · só <modelo> (<observação>)
```

Subtarefa sem nível: `nível a classificar pelo Jev`. O cabeçalho do arquivo aponta para o `STATUS-COMPLETO.md`.

### Requisitos

| ID | Requisito (EARS) | Cobre | Verificação |
|----|------------------|-------|-------------|
| R1.1 | O SISTEMA DEVE descrever em `regras/quadro-de-tarefas.md` o formato simplificado do `STATUS.md` e dizer que ele é a fonte única de status e reserva | QUADRO-SIMPLIFICADO-GLOBAL.1 | `grep -n "fonte única" regras/quadro-de-tarefas.md` acha a linha nova |
| R1.2 | O SISTEMA DEVE descrever o `STATUS-COMPLETO.md` como histórico, sem reserva nem status editado à mão | QUADRO-SIMPLIFICADO-GLOBAL.1 | leitura da seção na regra |
| R2.1 | QUANDO o `STATUS.md` estiver no formato simplificado, ENTÃO os parsers do gerenciador, do MCP e do Jev DEVEM devolver as mesmas tarefas, subtarefas, status, nível e reserva que devolveriam para o formato em tabela equivalente | QUADRO-SIMPLIFICADO-GLOBAL.2 | comando de paridade da subtarefa .4 sobre o `STATUS.md` do `aulasenai` |
| R2.2 | QUANDO o `STATUS.md` estiver no formato em tabela, ENTÃO os parsers DEVEM continuar devolvendo o mesmo resultado de antes | QUADRO-SIMPLIFICADO-GLOBAL.2 | `node scripts/gerenciador/testes/gerenciador.mjs` e `node mcp/testes/quadro.mjs` sem falha |
| R2.3 | SE o `STATUS.md` não casar com nenhum dos dois formatos, ENTÃO os parsers DEVEM sair com erro claro e não gravar nada | QUADRO-SIMPLIFICADO-GLOBAL.2 | execução com arquivo inválido sai com código diferente de 0 e `git diff` vazio |
| R3.1 | O SISTEMA DEVE mostrar no dashboard as mesmas tarefas para os dois formatos | QUADRO-SIMPLIFICADO-GLOBAL.3 | `python dashboard/testes/invariante_paridade_quadro.py` |
| R4.1 | O SISTEMA DEVE manter `dist/REGRAS-GLOBAIS.md` igual ao que o sincronizador gera a partir de `regras/` | QUADRO-SIMPLIFICADO-GLOBAL.1 | `node scripts/sincronizar.mjs` (sem `--aplicar`) não deixa diferença |

**Fora do escopo (não-objetivos):** reservar tarefa em outro projeto; mudar nível, modelo ou prioridade de tarefa existente; criar banco ou cópia da fila.

### Invariantes

| ID | Regra que vale sempre | Domínio da entrada | Como conferir | Teste automatizado |
|----|----------------------|--------------------|---------------|--------------------|
| INV-1 | Para um mesmo quadro, o parser do formato simplificado e o do formato em tabela devolvem o mesmo conjunto de (ID, status, nível, reserva) | qualquer `STATUS.md` válido de `aulasenai`, `rules-ai` e `REA-APP-CLONES` | comando de paridade da subtarefa .4 | sim: `node scripts/testes/quadro-paridade.mjs` (criado na .4) |
| INV-2 | Nenhum parser grava no quadro quando falha | qualquer entrada inválida | execução com entrada inválida e `git diff --stat` | sim: no mesmo script da INV-1 |
| INV-3 | Cada informação de status e reserva existe em um único arquivo (o `STATUS.md`) | todo projeto que migrar | leitura do `STATUS-COMPLETO.md` sem coluna de reserva editável | não: conferência por leitura |

**Casos de borda que o código precisa sobreviver:** `STATUS.md` vazio; tarefa-mãe sem subtarefa recuada; ID com UUID longo (`#329-8ee48efd-…`); linha de pendência solta (`- #29: …`) sem link de etapa; subtarefa agrupada (`#400.1 a #400.4`); CRLF.

### Perguntas abertas

| # | Pergunta | Resposta | Fechada em | Quem respondeu |
|---|----------|----------|------------|----------------|
| 1 | Qual arquivo é a fonte de status e reserva? | `STATUS.md` simplificado | 2026-10-26 | Usuário |
| 2 | Escopo do ajuste: só regras ou regras + scripts? | Regras + scripts | 2026-10-26 | Usuário |

### Riscos

- Os dois formatos convivem durante a migração; por isso os parsers leem os dois (plano B: se algum parser não cobrir um caso, ele sai com erro claro e o quadro continua em tabela).
- Mudança em vários scripts ao mesmo tempo: uma subtarefa por script e commit por entrega (`git revert` desfaz cada uma).

### Decisões

- 2026-10-26 20:30 — Fonte única = `STATUS.md` simplificado; escopo = regras + scripts (resposta do usuário). Registrado por Claude Code (Sonnet 5.5).
- 2026-10-26 20:30 — Tarefa concluída continua saindo do `STATUS.md` para o `task_complete.md` (regra atual C4 não muda). No `aulasenai`, onde as concluídas ficaram no índice, cada projeto decide na própria migração.
- 2026-10-26 20:30 — Plano apresentado ao usuário (tarefa grande, `ciclo-da-task.md`).
- 2026-10-26 21:00 — **Plano aprovado pelo usuário** ("sim, aprovo o plano da etapa 057; pode executar") e pedido de usar vários agentes. Executar só o escopo aprovado.
- 2026-10-26 21:00 — Para rodar em paralelo, a dependência de .2 e .3 em relação à .1/.2 foi **relaxada**: o formato está fixado nesta etapa. A .4 continua depois das três. Os agentes só editam arquivos; a conferência, o commit e o push de cada entrega são do Haiku (C41).

### QUADRO-SIMPLIFICADO-GLOBAL.1 — Regra: formato simplificado do STATUS.md e C55

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **Fonte:** sinais
- **Descrição:** escrever o formato novo, a fonte única e o papel do `STATUS-COMPLETO.md` nas regras; regerar `dist/` e `VERSAO.md`.
- **Critérios de Aceitação:** R1.1, R1.2, R4.1.
- **Depende de:** Nenhuma
- **Entrega:** a preencher · **Verificação:** a preencher
- **JEV-AI-SUGGESTION:** NAO

### QUADRO-SIMPLIFICADO-GLOBAL.2 — Parsers do gerenciador, do MCP e do Jev leem o formato simplificado

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **Fonte:** sinais
- **Descrição:** cada parser detecta o formato e devolve o mesmo modelo de dados; reserva e entrega do MCP e a gravação do Jev escrevem no formato em que o arquivo está.
- **Critérios de Aceitação:** R2.1, R2.2, R2.3, INV-1, INV-2.
- **Depende de:** QUADRO-SIMPLIFICADO-GLOBAL.1
- **Entrega:** commits `8c48586` (parsers: `scripts/jev/quadro-formato.mjs` novo, `scripts/gerenciador/quadro.mjs`, `scripts/gerenciador.mjs`, `mcp/quadro.mjs`, `scripts/jev/estado.mjs`, `gravacao.mjs`, `gravador.mjs`) e `ec35b4b` (`VERSAO.md`, pacote do rules-local); executado por agente Opus (executor-pesado), conferido e commitado por Haiku (C41) · **Verificação:** `gerenciador.mjs` 9/9, `mcp/testes/quadro.mjs` 12/12 e os 8 testes de `scripts/jev/testes/` com saída 0, antes e depois; `node --check` nos 7 arquivos; conferência ponta a ponta numa cópia do `STATUS.md` do `aulasenai` em CRLF (25/25): reserva muda uma linha, liberar devolve o arquivo igual byte a byte, arquivo inválido não grava (R2.1 a R2.3). Itens agrupados nunca saem livres.
- **JEV-AI-SUGGESTION:** NAO

### QUADRO-SIMPLIFICADO-GLOBAL.3 — Dashboard lê o formato simplificado

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — classificado (jev (confiança 0.97))
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Fonte:** jev (confiança 0.97)
- **Descrição:** o dashboard mostra as mesmas tarefas e reservas nos dois formatos.
- **Critérios de Aceitação:** R3.1.
- **Depende de:** QUADRO-SIMPLIFICADO-GLOBAL.2
- **Entrega:** commit `741be57` (`dashboard/quadro_tarefas.py` e `dashboard/assets/js/agentes/quadro.js`); executado por agente Sonnet (executor-medio), conferido e commitado por Haiku (C41) · **Verificação:** `invariante_paridade_quadro.py` com 16 casos ok e "INV-4: sem diferença"; `node --check` do JS ok; Python e JS leram o `STATUS.md` do `aulasenai` com saída idêntica (237 tarefas) (R3.1). Decisão: linhas soltas `- #N:` entram como tarefas pendentes.
- **JEV-AI-SUGGESTION:** SIM

### QUADRO-SIMPLIFICADO-GLOBAL.4 — Conferência de paridade entre os dois formatos

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — classificado (jev (confiança 0.95))
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Fonte:** jev (confiança 0.95)
- **Descrição:** teste de invariante (INV-1 e INV-2, permitido em `PESADO`) que compara os parsers sobre quadros reais.
- **Critérios de Aceitação:** INV-1 e INV-2 sem falha nos quadros do `aulasenai`, `rules-ai` e `REA-APP-CLONES`.
- **Depende de:** QUADRO-SIMPLIFICADO-GLOBAL.2, QUADRO-SIMPLIFICADO-GLOBAL.3
- **Entrega:** commit `33f1865` (`scripts/testes/quadro-paridade.mjs`); escrito por agente Sonnet (executor-medio), conferido e commitado por Haiku (C41) · **Verificação:** `node scripts/testes/quadro-paridade.mjs` sai com 0 e `24/24 verificações passaram` (INV-1: aulasenai 293/293/293, REA-APP-CLONES 79/79/79, rules-ai 133/133/132, simplificado = tabela 22/22; INV-2: entradas inválidas sem gravar nada, quadros reais intactos). Defeito de dado achado: `DASHBOARD-LE-API.12` tem `|` sem escape no título (etapa 051); o teste avisa até corrigirem.
- **JEV-AI-SUGGESTION:** SIM
