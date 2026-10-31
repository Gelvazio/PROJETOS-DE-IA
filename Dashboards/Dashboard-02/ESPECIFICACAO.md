# Dashboard 02 — Financeiro

**Para:** qualquer empresa que fecha o mês no Excel. Mostra receita, despesa, lucro, caixa e alertas de gasto.

## Prompt

```
Com os dados financeiros que vou enviar, crie um dashboard em HTML com:

- KPIs: receita total, despesas, lucro líquido e caixa disponível
  (com variação % vs. mês anterior)
- Gráfico de barras agrupadas: receita x despesas por mês
- Gráfico de linha: fluxo de caixa acumulado
- Alerta automático: se alguma categoria de despesa subiu mais de 15%
  vs. o mês anterior, destaca em laranja com o motivo
- Tabela: contas a pagar nos próximos 30 dias com status
  (verde = no prazo, amarelo = vence em 3 dias, vermelho = vencido)

Fundo escuro, números em branco, alertas em laranja (#ff8c00).
```

## Dados necessários

Mínimo: **data, categoria (receita/despesa), valor, descrição**. Se o cliente mandar extrato bancário em PDF, o Claude consegue extrair — mas Excel é mais limpo.

---

Fonte: Builders Club — "5 dashboards para criar em 5 minutos com o Claude Code" (Ricardo Dias, 30/10/2026).
