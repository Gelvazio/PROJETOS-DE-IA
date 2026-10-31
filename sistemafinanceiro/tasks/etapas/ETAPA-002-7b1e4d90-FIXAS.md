## Etapa 002-7b1e4d90 — FIXAS: Despesas e receitas fixas (recorrentes)

**Tarefa:** FIXAS · **Pedido em:** 2026-10-30 · **Criada por:** Claude Code (Sonnet 5.5) (local · main)
**Pedido:** "deve ter um campo tipo despesa e tipo receita; se for fixa, ela repete em todos os meses,
mas sem precisar ter registro"; "só cria registro quando efetivada"; "ela deve ser 1 tarefa, com
muitas subtarefas, se necessário" (vinha como SC.5, separada da tarefa SC em 2026-10-30).
**Objetivo:** despesas e receitas fixas que aparecem todo mês sem gravar registro, e só viram
lançamento quando efetivadas (pagas/recebidas).
**Origem do detalhe:** seção "Despesa/Receita fixas" de
[docs/sistema-comercial.md](../../docs/sistema-comercial.md). Não duplicar aqui.

### Escopo
- **Entra:** tabela `recorrencia`, colunas `recorrencia_id` e `competencia` em `lancamento`, cálculo
  das ocorrências do mês, cadastro com "Fixa", exibição e totais, efetivação, encerramento.
- **Não entra:** produtos e pedidos (tarefa SC).

### Tarefa grande — exige aprovação
Mexe em banco e em várias partes. **Plano aguardando o "sim" do usuário** antes de reservar qualquer
subtarefa.

### Riscos
- Totais divergentes se algum relatório por período não usar a função de cálculo. Plano B: uma
  única função compartilhada (FIXAS.2).
- RLS errada expõe dados de outro usuário. Plano B: copiar o padrão da `lancamento`.
- Efetivar duas vezes o mesmo mês. Plano B: índice único `recorrencia_id + competencia`.

### Decisões
- 2026-10-30 — fixa só vira registro ao ser efetivada; mês não efetivado aparece "em aberto"
  calculado; parar de repetir = encerrar a recorrência (`data_fim`). (usuário)
- 2026-10-30 — virou tarefa própria (antes SC.5), com subtarefas. (usuário)

### Perguntas abertas
- ✅ Meses passados não efetivados continuam aparecendo em aberto? Sim (padrão adotado ao executar; o
  usuário pode trocar).
- ✅ Dia 31 em mês curto vence no último dia do mês? Sim (padrão adotado ao executar).

### Restrição do usuário (2026-10-30)
- "Não mexa em dados velhos": nenhum lançamento existente é alterado nem criado retroativamente.
  Consequência adotada: a fixa começa no mês em que foi cadastrada (`data_inicio` padrão = mês
  corrente) e nunca aparece em meses anteriores a ele; só meses desde o início sem efetivar ficam
  "em aberto". Dia 31 em mês curto segue no último dia do mês (padrão mantido).

### Aprovação
- 2026-10-30 — usuário mandou executar a tarefa FIXAS com agentes e o MCP do Supabase (aprovação do
  plano). Perguntas fechadas com os padrões acima.

### FIXAS.1 — SQL: tabela `recorrencia`, colunas em `lancamento`, índice único e RLS
**Próximo passo:** aguardar aprovação do plano.
- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **Fonte:** sinais
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** em `db/`, criar `recorrencia` (usuario_id, loja_id, descricao, tipo, valor,
  dia_vencimento, data_inicio, data_fim, ativo) e acrescentar `recorrencia_id` e `competencia`
  (AAAA-MM) em `lancamento`, com índice único `recorrencia_id + competencia`; RLS `auth.uid() = usuario_id`.
- **Critérios de Aceitação:** SQL roda no Supabase sem erro; RLS igual à de `lancamento`.
- **Verificação:** leitura do SQL e conferência pelo usuário no Supabase.

### FIXAS.2 — Função pura que calcula as ocorrências do mês
**Próximo passo:** depende da FIXAS.1.
- **Nível:** MEDIO — classificado (jev (confiança 0.97))
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Fonte:** jev (confiança 0.97)
- **JEV-AI-SUGGESTION:** SIM
- **Descrição:** dado o mês e as recorrências, devolve as ocorrências virtuais, respeitando início e
  fim e ajustando o dia 31 em meses curtos; descarta a do mês que já tem lançamento efetivado.
- **Critérios de Aceitação:** `node --check` sem erro; fevereiro com dia 31 cai no dia 28/29.

### FIXAS.3 — Funções CRUD de recorrência em `src/supabaseClient.js`
**Próximo passo:** depende da FIXAS.1.
- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **Fonte:** sinais
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** listar, criar, atualizar e encerrar recorrências do usuário.
- **Critérios de Aceitação:** `node --check` sem erro; só opera em registros do próprio usuário.

### FIXAS.4 — Cadastro: tipo Despesa/Receita e checkbox "Fixa"
**Próximo passo:** depende da FIXAS.3.
- **Nível:** MEDIO — classificado (sinais)
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Fonte:** sinais
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** no modal, marcar "Fixa (repete todo mês)" grava uma recorrência em vez de um
  lançamento; pede o dia de vencimento.
- **Critérios de Aceitação:** marcar Fixa não cria lançamento; leitura do código e sintaxe.

### FIXAS.5 — Exibir as ocorrências fixas na tabela do mês
**Próximo passo:** depende das FIXAS.2 e FIXAS.3.
- **Nível:** MEDIO — classificado (sinais)
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Fonte:** sinais
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** misturar as ocorrências virtuais ("em aberto") aos lançamentos reais, respeitando os
  filtros de tipo e status.
- **Critérios de Aceitação:** mês sem efetivação mostra a fixa sem gravar nada.

### FIXAS.6 — Somar as fixas nos cards de resumo
**Próximo passo:** depende da FIXAS.5.
- **Nível:** MEDIO — classificado (jev (confiança 0.82))
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Fonte:** jev (confiança 0.82)
- **JEV-AI-SUGGESTION:** SIM
- **Descrição:** incluir as ocorrências virtuais em Contas a Receber, a Pagar, Saldo e Pendente.
- **Critérios de Aceitação:** totais batem com a soma das linhas exibidas.

### FIXAS.7 — Efetivar a fixa (pagar/receber) e criar o lançamento do mês
**Próximo passo:** depende da FIXAS.5.
- **Nível:** MEDIO — classificado (sinais)
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Fonte:** sinais
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** a ação Pagar/Receber numa ocorrência virtual cria o lançamento Pago com
  `recorrencia_id` e `competencia`, permitindo ajustar valor e data.
- **Critérios de Aceitação:** efetivar grava um lançamento Pago e a ocorrência virtual some do mês.

### FIXAS.8 — Encerrar a recorrência
**Próximo passo:** depende da FIXAS.3.
- **Nível:** MEDIO — classificado (sinais)
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Fonte:** sinais
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** ação "Parar de repetir" define a `data_fim`; meses seguintes deixam de aparecer.
- **Critérios de Aceitação:** meses após `data_fim` não exibem a fixa; os já efetivados permanecem.

### Entrega FIXAS.1 (2026-10-30)
- Arquivo `db/fixas.sql`; migração `fixas_recorrencia` aplicada no Supabase `ubrvdzwywyxydcblghwz` pelo
  MCP. **Verificação:** `recorrencia` existe com RLS ligada e 4 políticas; `lancamento` ganhou
  `recorrencia_id` e `competencia`; contagem de `lancamento` intacta; `get_advisors` sem alerta novo.

### Entrega FIXAS.2 (2026-10-30)
- `src/recorrencia.js` (executor-medio). **Verificação:** `node --check` ok; fev/2028 dia 31 → 2028-02-29,
  fev/2027 → 28, abr → 30; recorrência fora do período e já efetivada não gera ocorrência.

### Entrega FIXAS.3 (2026-10-30)
- `src/supabaseClient.js` (executor-pesado): `getRecorrencias`, `createRecorrencia`, `updateRecorrencia`,
  `encerrarRecorrencia`, `efetivarRecorrencia`; `createLancamento` passa `recorrencia_id`/`competencia`.
  **Verificação:** `node --check` e `npm run build` ok; sem chamada real ao banco.

### Entrega FIXAS.4 (2026-10-30)
- `index.html` (rótulos Despesa/Receita, checkbox `#f-fixa`) e `src/main.js` (`aplicarModoFixa`,
  `gravarFixa`): marcar Fixa grava recorrência com `data_inicio` = mês corrente, sem lançamento.
  **Verificação:** `node --check` e `npm run build` ok (executor-medio).

### Entrega FIXAS.5 (2026-10-30)
- `src/main.js` (`obterLancamentosDoMes`, `carregarRecorrenciasSeguro`, linha virtual com selo Fixa) e
  `index.html` (`.selo-fixa`). Mistura só em memória, antes dos filtros. **Verificação:** `node --check`
  e `npm run build` ok (executor-medio); tela não testada (sem navegador).

### Entrega FIXAS.6 (2026-10-30)
- `src/main.js`: `getMonthData()` passa a usar `obterLancamentosDoMes`; os cards somam as fixas.
  **Verificação:** `node --check` e `npm run build` ok; único uso de `getMonthData` é `renderCards`.

### Entrega FIXAS.7 (2026-10-30)
- `src/main.js` (`handleEfetivar`, botão Pagar/Receber na linha fixa, modal de confirmação com valor e
  data) e `index.html` (CSS). **Verificação:** `node --check` e `npm run build` ok; clique e modal
  precisam de teste manual do usuário (sem navegador).

### Entrega FIXAS.8 (2026-10-30)
- `src/main.js` (`handleEncerrarFixa`, botão "Parar de repetir"): `data_fim` = último dia do mês anterior à
  competência clicada; no 1º mês, `ativo = 0`. Lançamentos reais nunca são tocados. **Verificação:**
  `node --check` e `npm run build` ok.

### Fechamento (2026-10-30)
Todas as subtarefas ✅. Pendente do usuário: testar no navegador (cadastro Fixa, exibição, totais,
efetivar, parar de repetir) — nada foi testado na tela por regra do projeto.
