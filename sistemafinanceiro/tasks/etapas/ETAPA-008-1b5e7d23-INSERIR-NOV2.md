## Etapa 008-1b5e7d23 — INSERIR-NOV2: Mais 7 despesas em novembro/2026 (histórico dos últimos 12 meses)

**Tarefa:** INSERIR-NOV2 · **Pedido em:** 2026-10-30 · **Criada por:** Claude Code (Sonnet 5.5) (local · main)
**Pedido:** "pesquise mais despesas do ano todo que ainda não foram colocadas em novembro"; depois da
pesquisa o usuário respondeu "SIM" à inserção das 7 candidatas ativas (jul/2026 ou depois).
**Objetivo:** ter também em novembro/2026 as despesas recorrentes que apareceram nos últimos 12 meses e
ainda não estavam lá, para o usuário editar e decidir quais viram fixa.

### Escopo
- **Entra:** inserir 7 lançamentos `pagar` em 11/2026, Abertos, sem pagamento, 1 parcela, valor do último
  lançamento de cada uma e o dia típico: FINANCIAMENTO CARRO (dia 9), EMPRESTIMO BLUSOL (10), RAÇÃO CACHORRO
  (10), BOTIJAO DE GÁS (7), MOUNJARO BINA - 7 X (8), POS GRADUAÇÃO IA GELVAZIO (3), GOOGLE DRIVE
  INFOPRODUTOS (7).
- **Não entra:** as candidatas antigas (até mar/2026 e antes), o cartão Maico, o AJUSTE DESPESAS; nenhum
  UPDATE/DELETE em lançamento existente; nenhuma fixa criada.

### Riscos
- Duplicar se rodar duas vezes. Plano B: o INSERT só cria a conta se não houver o mesmo nome em novembro;
  desfazer apagando só os ids novos desta inserção.

### INSERIR-NOV2.1 — Inserir as 7 despesas em novembro/2026 no Supabase
**Próximo passo:** executar o INSERT pelo MCP do Supabase e conferir a contagem.
- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **Fonte:** sinais
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** `insert ... select` do último lançamento de cada nome (usuário, loja, descrição, valor),
  com data `2026-11-<dia típico>`, status 0.
- **Critérios de Aceitação:** 7 linhas novas em 11/2026, tipo `pagar`, status 0; nenhum UPDATE/DELETE.
- **Verificação:** contagem e lista de novembro antes e depois; outros meses inalterados.

### Entrega INSERIR-NOV2.1 (2026-10-30)
- Executado pelo MCP do Supabase: 7 lançamentos `pagar` em 11/2026 (Abertos), R$ 3.527,00. Novembro passou de
  11 para 18 contas (R$ 7.475,00). **Verificação:** contagem por mês — jul, ago, set, out e dez iguais aos
  de antes (nenhum UPDATE/DELETE). Ressalva: as descrições mantêm o marcador de parcela antigo
  (ex.: "(2/12)", "(4/7)"); o usuário ajusta ao editar.
- Para desfazer: apagar só os 7 lançamentos novos (descrições da lista acima, vencimento em 11/2026).
