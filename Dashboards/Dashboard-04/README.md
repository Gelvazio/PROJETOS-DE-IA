# Dashboard 04 — Executivo

Painel com faturamento, lucro, margem e clientes ativos do ano (com variação vs. ano anterior),
gráfico de área, top 7 clientes e margem líquida por mês. Abra o `index.html` direto no navegador.

## Como trocar o CSV

1. Prepare seu arquivo com as colunas `data,cliente,receita,custo` (data `AAAA-MM-DD`, valores sem
   símbolo de moeda, ponto como decimal). Inclua o ano atual e o anterior.
2. Abra o `dados.js` e substitua o texto entre as crases da constante `DADOS_CSV` pelo conteúdo do
   seu CSV (o arquivo é embutido para funcionar por `file://`).
3. Atualize a página. O `dados-exemplo.csv` é só o exemplo fictício.
