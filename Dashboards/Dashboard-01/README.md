# Dashboard 01 — Vendas

Abra `index.html` no navegador (funciona por `file://`, sem servidor). Os gráficos usam Chart.js 4.4.1 via CDN, então é preciso internet.

## Como trocar o CSV

1. Prepare sua planilha com as colunas `data,valor,canal,vendedor,status` (veja `dados-exemplo.csv`): data em `AAAA-MM-DD`, valor com ponto decimal, status `Concluído`, `Pendente` ou `Cancelado`.
2. Copie o conteúdo do CSV para dentro da crase da constante `CSV_EMBUTIDO` em `dados.js`.
3. Ajuste a meta do mês em `META_MENSAL` no topo de `app.js` (a meta por vendedor é dividida igualmente).

Faturamento, ticket médio, gráficos e ranking consideram apenas pedidos concluídos.
