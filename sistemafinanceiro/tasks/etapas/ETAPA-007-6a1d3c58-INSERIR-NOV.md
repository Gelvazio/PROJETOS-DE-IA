## Etapa 007-6a1d3c58 — INSERIR-NOV: Contas a pagar de novembro/2026 copiadas de agosto

**Tarefa:** INSERIR-NOV · **Pedido em:** 2026-10-30 · **Criada por:** Claude Code (Sonnet 5.5) (local · main)
**Pedido:** "insira todas as contas a pagar do mês de novembro agora, vou editar cada uma manualmente pra
decidir qual será fixa ou não". Respostas do usuário: origem = agosto sem parcelado e sem ajuste;
estado = Abertas, mesmo dia do mês.
**Objetivo:** ter em novembro/2026 as contas a pagar recorrentes de agosto, em aberto, para o usuário
editar uma a uma e decidir quais viram fixa.

### Escopo
- **Entra:** inserir (INSERT) 13 lançamentos `pagar` em 11/2026, copiados de agosto/2026: ids 42, 41, 34,
  35, 36, 37, 30, 31, 32, 26, 27, 28 e 23, mantendo descrição, valor, loja e o dia do mês; status Aberto,
  sem data de pagamento, 1 parcela.
- **Não entra:** cartão Maico 5x (ids 13 e 14, parcelado que acaba em setembro) e AJUSTE DESPESAS (id 22);
  nenhuma alteração nem exclusão de lançamento existente; nenhuma fixa criada (o usuário decide ao editar).

### Riscos
- Duplicar novembro se rodar duas vezes. Plano B: conferir que novembro não tinha `pagar` antes (tinha 0)
  e que depois ficam exatamente 13; reverter com `DELETE` só dos ids novos desta inserção.

### INSERIR-NOV.1 — Inserir as 13 contas a pagar em novembro/2026 no Supabase
**Próximo passo:** executar o INSERT pelo MCP do Supabase e conferir a contagem.
- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **Fonte:** sinais
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** `insert ... select` a partir dos ids de agosto listados no escopo, com data
  `2026-11-<dia>` e status 0.
- **Critérios de Aceitação:** 13 linhas novas em 11/2026, tipo `pagar`, status 0; total de lançamentos
  antigos inalterado (nenhum UPDATE/DELETE).
- **Verificação:** consulta de contagem e soma por mês antes e depois.

### Entrega INSERIR-NOV.1 (2026-10-30)
- Executado pelo MCP do Supabase (`insert ... select` protegido contra repetição): 13 lançamentos `pagar`
  em 11/2026, status Aberto, total R$ 4.618,00. **Verificação:** contagem por mês depois da inserção —
  ago/set/out/dez idênticos aos de antes (nenhum UPDATE/DELETE); novembro com 13 abertas.
- Para desfazer: apagar só os lançamentos `pagar` com vencimento em 11/2026 criados por esta tarefa.
