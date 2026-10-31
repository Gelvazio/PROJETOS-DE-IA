# Medição da memória (ai-memory) — retomadas com e sem memória

**Subtarefa:** AI-MEMORY-INTEGRATION.25 · **Etapa:** 038 · **Criado em:** 2026-10-23 · **Status:** linha de base; 10 retomadas ainda **não** existem.

## 1. Método

**O que conta como retomada sem reexplicar contexto:** uma sessão nova que continua uma subtarefa
em andamento sem o usuário repetir o pedido ou o contexto. Conta quando a sessão:

- lê o `STATUS.md` e o **Próximo passo** da seção da subtarefa e age a partir dele;
- não faz perguntas que já estão no quadro, na etapa ou no histórico do Git;
- não refaz o que já está entregue (commit ou `✅` no quadro).

**Onde olhar (só números e metadados, nunca o texto das observações):**

- **Quadro:** o `STATUS.md` e a seção da subtarefa de cada projeto (Próximo passo, "Em uso por").
- **Git:** `git log` do projeto, comparando o commit da retomada com o que estava no quadro.
- **ai-memory:** `ai-memory status` e `ai-memory list-projects` (só contagens). Não abrir
  observações, sessões nem páginas do wiki para esta medição.
- **Dados de alunos:** fora do escopo. Nenhum arquivo de `aulasenai` com dado de aluno é lido.

**Como registrar uma retomada:** uma linha na tabela da seção 3, com data, projeto, subtarefa,
se a memória estava ligada, se a sessão reexplicou o contexto (sim/não) e a observação em uma
frase. Sem texto de conversa.

## 2. Linha de base (2026-10-23, 15:32)

Números de `ai-memory status` e `ai-memory doctor` (versão 3.2.2, servidor local).

| Medida | Valor |
|---|---|
| Sessões capturadas (total do servidor) | 5 |
| Observações (total) | 45 |
| Páginas do wiki | 0 |
| Eventos na fila local (ainda não enviados) | 2 (o mais antigo com 19 min) |
| Falhas de gravação | 0 |
| Projetos cadastrados | 5 (`aulasenai`, `dashboard-ai`, `rules-ai`, `scratch`, `x`) |

Por projeto (o `status` dá só o total; a separação vem do `doctor`, que lê as sessões locais de cada harness):

| Projeto | Sessões locais (recentes) | Capturadas | Observação |
|---|---|---|---|
| `aulasenai` | 25 (codex 24, open-code 1) | 0 nos harnesses listados | hook do codex e do open-code ausente |
| `rules-ai` | 46 (claude-code 15, codex 31) | 0 nos harnesses listados | hook do claude-code e do codex ausente |
| `dashboard-ai` (`C:\fontes\DASHBOARD-AI-PRINCIPAL`) | 1 (claude-code 1) | 1 (claude-code 1) | hook do claude-code ok |
| `scratch`, `x` | — | 0 páginas | sobras de testes das subtarefas .7 e .15; não são projetos de trabalho |

Leitura: a memória está **ligada, mas com captura incompleta**. Os 5 registros capturados não
podem ser atribuídos a um projeto só por esta medição. Antes de contar retomadas, o hook de cada
harness precisa ser conferido (`ai-memory install-hooks --agent <harness>`, em modo de conferência).

## 3. Retomadas (meta: 10)

| # | Data | Projeto | Subtarefa | Memória ligada? | Reexplicou contexto? | Observação (1 frase) |
|---|---|---|---|---|---|---|
| 1 | — | — | — | — | — | — |
| 2 | — | — | — | — | — | — |
| 3 | — | — | — | — | — | — |
| 4 | — | — | — | — | — | — |
| 5 | — | — | — | — | — | — |
| 6 | — | — | — | — | — | — |
| 7 | — | — | — | — | — | — |
| 8 | — | — | — | — | — | — |
| 9 | — | — | — | — | — | — |
| 10 | — | — | — | — | — | — |

Retomadas com memória ligada: **0 de 10**. Retomadas sem memória: **0 de 10** (a linha de base
ainda não tem retomada registrada).

## 4. Regra de decisão

Vale quando houver 10 retomadas registradas na seção 3, todas com a memória ligada e o hook
conferido na seção 2.

- **Adotar:** 7 ou mais retomadas sem reexplicar contexto e nenhum caso de bloqueio da sessão.
- **Ajustar:** de 4 a 6 retomadas sem reexplicar. Antes de decidir de novo, corrigir a captura
  (hooks e `ignore_paths`) e medir mais 10 retomadas.
- **Desligar:** 3 ou menos retomadas sem reexplicar, ou qualquer caso de bloqueio da sessão por
  causa da memória. Seguir `docs/AI-MEMORY-ROLLBACK.md`; o quadro não muda.

Os limites (7 e 4) são proposta desta medição, para o usuário confirmar. Enquanto não houver 10
retomadas, a conclusão é **sem dado**: não adotar, não ajustar e não desligar por estimativa.
