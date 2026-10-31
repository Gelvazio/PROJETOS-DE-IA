# Sistema Comercial — Plano (rascunho para revisão)

**Status**: 👀 Aguardando revisão do usuário — nada foi implementado.
**Data**: 2026-10-30

## Objetivo
Adicionar ao `sistemafinanceiro` um módulo comercial (produtos, pedidos/vendas) integrado aos
lançamentos a receber já existentes.

## Escopo proposto (a confirmar)
| Entra | Não entra (por enquanto) |
|-------|--------------------------|
| Cadastro de produtos | Nota fiscal / fiscal |
| Pedidos de venda com itens | Compras e fornecedores |
| Geração de lançamentos `receber` parcelados | Controle de estoque (decidir) |

## Modelo de dados proposto
- `produto`: id, nome, codigo, preco, ativo, created_at, updated_at.
- `pedido`: id, usuario_id (RLS), loja_id, cliente_id, data, total, status (0 aberto, 1 faturado, 3 cancelado).
- `pedido_item`: id, pedido_id, produto_id, quantidade, preco_unitario.
- Ao faturar: cria N `lancamento` tipo `receber` (mesmo `id_parcelamento`) a partir do pedido.
- RLS igual à de `lancamento`: `auth.uid() = usuario_id`.

## Despesa/Receita fixas (recorrentes, sem registro por mês)
> Virou a tarefa própria **FIXAS** (`tasks/etapas/ETAPA-002-7b1e4d90-FIXAS.md`), fora do passo 5
> da tabela abaixo.
Já existe `lancamento.tipo` (`pagar` = despesa, `receber` = receita). Para o "fixo":
- Nova tabela `recorrencia`: id, usuario_id (RLS), loja_id, descricao, tipo (`pagar`/`receber`),
  valor, dia_vencimento (1–31), data_inicio, data_fim (NULL = sem fim), ativo.
- **Sem gerar linhas por mês:** ao abrir um mês, o sistema calcula as ocorrências virtuais a partir
  de `recorrencia` (respeitando início/fim; dia 31 vira o último dia do mês curto) e mistura com os
  `lancamento` reais na tela e nos totais.
- **Só vira registro quando efetivada:** ao pagar/receber aquele mês, cria-se um `lancamento`
  (status Pago) com `recorrencia_id` + `competencia` (AAAA-MM). Esse registro substitui a ocorrência
  virtual daquele mês (índice único `recorrencia_id + competencia`). Na efetivação o valor e a
  data podem ser ajustados, sem criar nada antes disso.
- Mês não efetivado continua aparecendo como virtual "em aberto"; não existe registro de cancelado.
  Para parar de repetir, encerra-se a recorrência (`data_fim`).
- Alterar o valor "daqui para frente" = encerrar a recorrência (`data_fim`) e criar outra.
- Campo no cadastro: seletor Tipo (Despesa/Receita) + checkbox "Fixa (repete todo mês)".
- Cuidado: o mês filtrado calcula na hora; relatórios por período precisam usar a mesma função.

## Passos de implementação (futuros, após aprovação)
| Item | Descrição | Status |
|------|-----------|--------|
| 1 | SQL das tabelas e RLS em `db/` | ⬜ |
| 2 | Funções CRUD em `src/supabaseClient.js` | ⬜ |
| 3 | Tela de produtos | ⬜ |
| 4 | Tela de pedidos | ⬜ |
| 5 | Faturar pedido → gerar lançamentos | ⬜ |

## Perguntas abertas
1. Controle de estoque entra na v1?
2. Cliente é obrigatório no pedido (usa a tabela `cliente` existente)?
3. Módulo na mesma app (nova página) ou separado?
