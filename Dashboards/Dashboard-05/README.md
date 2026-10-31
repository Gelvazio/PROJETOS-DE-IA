# Dashboard 05 — Metas

Painel de metas por área: KPIs com barra colorida (verde acima de 80%, amarelo de 60 a 80%,
vermelho abaixo de 60%), barras realizado x meta por mês, projeção de fechamento do ano e tabela
detalhada. Abra o `index.html` direto no navegador (funciona por `file://`; os gráficos usam
Chart.js 4.4.1 via CDN).

## Como trocar o CSV

Os dados ficam embutidos em `dados.js` (para funcionar sem servidor). Dois arquivos de exemplo:

- `dados-exemplo.csv`: `area,mes,meta,realizado` (uma linha por área e mês, do janeiro até o mês atual).
- `metas-anuais-exemplo.csv`: `area,meta_anual` (uma linha por área).

Para usar seus dados: edite os CSVs e cole o conteúdo de cada um dentro das constantes
`CSV_METAS_MENSAIS` e `CSV_METAS_ANUAIS` em `dados.js`. Mantenha o cabeçalho, use vírgula como
separador, números sem formatação e os meses na ordem cronológica.

## Projeção

Regressão linear simples sobre o realizado mensal de cada área; os meses restantes seguem a reta
(nunca abaixo de zero) e somam ao realizado até agora (ver `projetarFechamento` em `app.js`).
