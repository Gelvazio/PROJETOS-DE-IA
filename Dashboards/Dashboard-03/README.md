# Dashboard 03 — Estoque

Abra `index.html` direto no navegador (funciona por `file://`; os gráficos usam Chart.js via CDN, então precisa de internet).

## Como trocar os dados

Os dados ficam embutidos em `dados.js` (`CSV_ESTOQUE` e `CSV_MOVIMENTACAO`).

1. Exporte do seu sistema (Bling, Tiny, Omie...) um CSV com as colunas `produto,categoria,quantidade_atual,quantidade_minima,ultima_venda,custo_unitario` (data `AAAA-MM-DD`, custo com ponto decimal, sem vírgulas nos nomes).
2. Para a movimentação, use `mes,entradas,saidas` (mês `AAAA-MM`).
3. Cole o conteúdo de cada CSV entre as crases do respectivo `const` em `dados.js`.
4. Ajuste `DATA_REFERENCIA` para a data da exportação (senão o cálculo de "dias sem vender" fica defasado).

`dados-exemplo.csv` e `movimentacao-exemplo.csv` são os mesmos dados fictícios do exemplo, como modelo.
