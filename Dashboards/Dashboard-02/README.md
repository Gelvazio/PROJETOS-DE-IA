# Dashboard 02 — Financeiro

Abra `index.html` direto no navegador (funciona por `file://`; os gráficos usam Chart.js via CDN).

## Como trocar o CSV

1. Monte seu arquivo com o cabeçalho `data,categoria,valor,descricao`:
   - `data`: `AAAA-MM-DD`; `categoria`: `receita` ou `despesa`; `valor`: número com ponto decimal;
   - `descricao`: `Subcategoria - detalhe` (a subcategoria alimenta o alerta de +15%). Sem vírgulas no texto.
   - Conta ainda não paga: termine a descrição com `[a pagar]` e use a data de vencimento.
2. Cole o conteúdo do CSV dentro da crase em `dados.js` (`const CSV_EMBUTIDO = \`...\``).
3. Ajuste `SALDO_INICIAL` e `LIMIAR_ALERTA_PERCENTUAL` no topo de `app.js`, se precisar.

A data de referência (para status das contas) é o último lançamento realizado do CSV.
