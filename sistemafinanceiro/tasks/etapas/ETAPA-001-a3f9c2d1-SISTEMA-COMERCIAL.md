## Etapa 001-a3f9c2d1 — SC: Sistema Comercial

**Tarefa:** SC · **Pedido em:** 2026-10-30 · **Criada por:** Claude Code (Sonnet 5.5) (local · main)
**Pedido:** "SISTEMA COPMERCIAL"; depois "só planejar/documentar"; despesa/receita fixas que repetem
todo mês sem registro, só gerando registro quando efetivadas.
**Objetivo:** adicionar ao sistema financeiro um módulo comercial (produtos e pedidos) ligado aos
lançamentos a receber.
**Origem do detalhe:** [docs/sistema-comercial.md](../../docs/sistema-comercial.md) (modelo de dados,
recorrência e perguntas abertas). Não duplicar aqui; mudou o modelo, muda lá.

### Escopo
- **Entra:** produtos, pedidos com itens, faturar pedido gerando lançamentos `receber` parcelados.
  Despesas/receitas fixas são a tarefa própria FIXAS.
- **Não entra (por ora):** nota fiscal, compras/fornecedores. Estoque: pergunta aberta.

### Tarefa grande — exige aprovação
Mexe em banco (tabelas e RLS), tem várias partes. **Plano aguardando o "sim" do usuário** antes de
reservar ou executar qualquer subtarefa.

### Riscos
- Mudança de RLS errada expõe dados de outro usuário. Plano B: copiar o padrão da `lancamento`.

### Decisões
- 2026-10-30 — SC.5 (fixas) saiu desta tarefa e virou a tarefa FIXAS (etapa 002). (usuário)

### Perguntas abertas
- ⬜ Controle de estoque entra na v1?
- ⬜ Cliente é obrigatório no pedido?
- ⬜ Módulo na mesma app (nova página) ou separado?

### SC.1 — SQL: tabelas `produto`, `pedido`, `pedido_item` e RLS
**Próximo passo:** aguardar aprovação do plano.
- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **Fonte:** sinais
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** criar em `db/` as tabelas e a RLS `auth.uid() = usuario_id`.
- **Critérios de Aceitação:** SQL roda no Supabase sem erro; RLS igual à de `lancamento`.
- **Verificação:** leitura do SQL e conferência no Supabase pelo usuário.

### SC.2 — Funções CRUD em `src/supabaseClient.js` (produtos e pedidos)
**Próximo passo:** depende da SC.1.
- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **Fonte:** sinais
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** CRUD de produto e pedido.
- **Critérios de Aceitação:** `node --check` sem erro; só opera em registros do próprio usuário.

### SC.3 — Tela de produtos
**Próximo passo:** depende da SC.2.
- **Nível:** MEDIO — classificado (sinais)
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Fonte:** sinais
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** listar, criar, editar e inativar produtos.
- **Critérios de Aceitação:** leitura do código e sintaxe; teste visual fica com o usuário.

### SC.4 — Tela de pedidos e faturamento
**Próximo passo:** depende da SC.2.
- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **Fonte:** sinais
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** pedido com itens e total; faturar gera lançamentos `receber` parcelados.
- **Critérios de Aceitação:** faturar cria N lançamentos com o mesmo `id_parcelamento`.

