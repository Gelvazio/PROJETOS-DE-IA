# Dashboard 03 — Estoque

**Para:** lojas, restaurantes, cafés, e-commerce. Mostra o que repor hoje e o que está parado.

## Prompt

```
Crie um dashboard de estoque em HTML com os dados que vou enviar:

- KPIs: total de itens, valor parado em estoque, produtos em falta,
  giro médio em dias
- Tabela "Repor agora": produtos abaixo do estoque mínimo,
  ordenados por urgência, com botão visual de alerta
- Tabela "Parados há mais de 60 dias": produto, dias sem vender,
  valor imobilizado
- Gráfico de linha: entradas x saídas por mês
- Gráfico de rosca: estoque por categoria com valor em R$

Fundo escuro, urgência em vermelho, estoque ok em verde.
```

## Dados necessários

Peça: **produto, quantidade atual, quantidade mínima, última venda, custo unitário**. Se a empresa usa sistema (Bling, Tiny, Omie), geralmente exporta isso em CSV direto.

---

Fonte: Builders Club — "5 dashboards para criar em 5 minutos com o Claude Code" (Ricardo Dias, 30/10/2026).
