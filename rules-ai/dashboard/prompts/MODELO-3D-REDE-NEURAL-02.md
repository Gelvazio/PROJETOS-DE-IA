# MODELO-3D-REDE-NEURAL-02 — Infográfico "1 agente no lugar de 25 assentos"

**Imagem de referência:** `MODELO-3D-REDE-NEURAL-02.png`

## O que a imagem mostra

Página longa em tema escuro, com título amarelo e tom de "reportagem com números". No topo, a tese:
três agentes (um que planeja e escreve o código, um que testa, um que revisa e publica) ocupam um
organograma de 25 assentos. Seções em cartões com borda fina e rótulo no canto:

1. **O organograma:** três personagens grandes (cubo laranja pixelado, esfera azul, esfera rosa)
   ligados por arcos tracejados ("o patch", "os testes"); abaixo, 25 assentos em linha com ícones de
   pessoa que acendem um a um quando o agente assume; contadores "10 de 25", custo mensal da equipe
   e custo mensal do agente; um hexágono "AGENT" com a contagem de assentos.
2. **O quadro:** kanban semanal (A fazer, Fazendo, Revisão, Feito) com cartões de tarefa que andam
   sozinhos; total de tarefas fechadas na semana.
3. **Onde vão as 1.000 horas:** gráfico de rosca (escrever código, reuniões, revisão) com legenda e
   a frase de que a maior parte do tempo não é código.
4. **Para onde vai a receita:** diagrama de fluxo (Sankey) da receita mensal até taxas, hospedagem
   e o custo do agente, com o que sobra antes de impostos.
5. **Os 25 assentos contados com honestidade:** grade de 25 pessoas tracejadas e o número de
   pessoas que a receita realmente pagaria.

## Prompt (copiar)

```
Crie uma página HTML única (HTML + CSS + JavaScript puro, sem build) que recrie o infográfico da
imagem MODELO-3D-REDE-NEURAL-02.png: "1 agente de IA ocupa um organograma de 25 assentos".

Use nomes genéricos (AGENTE PLANEJADOR, AGENTE TESTADOR, AGENTE REVISOR) e números fictícios
editáveis num objeto de configuração no topo do script (assentos, custo por pessoa, custo do
agente, receita mensal, horas da semana). Não use marcas de empresas de IA.

Estrutura (tema escuro #0d0d0d, título em amarelo, destaques em laranja, azul e rosa, fonte
monoespaçada para números, cartões com borda fina e rótulo pequeno no canto superior):
1. Cabeçalho: título grande e um parágrafo-resumo com os números em destaque coloridos.
2. Cartão "O organograma": três personagens em SVG (cubo laranja pixelado, esfera azul brilhante,
   esfera rosa brilhante) ligados por arcos tracejados com rótulos ("o código", "os testes");
   linha com 25 assentos (ícone de pessoa) que acendem um a um quando o agente os assume;
   contadores "X de 25 assentos", "custo mensal da equipe", "custo mensal do agente"; hexágono
   "AGENTE" à direita com o total de assentos assumidos.
3. Cartão "O quadro": kanban com 4 colunas (A fazer, Fazendo, Revisão, Feito); cartões de tarefa
   que avançam de coluna sozinhos a cada 2 s e ficam verdes em "Feito"; contador de tarefas fechadas.
4. Cartão "Onde vão as 1.000 horas": gráfico de rosca em SVG (escrever código, reuniões, revisão)
   com legenda e valores; texto curto explicando que a maior parte do tempo não é código.
5. Cartão "Para onde vai a receita": diagrama Sankey em SVG da receita mensal até taxas de
   pagamento, hospedagem, custo do agente e o que sobra antes de impostos.
6. Cartão "Os 25 assentos, contados com honestidade": grade de 25 pessoas com borda tracejada e o
   número de pessoas que a receita pagaria em salário (cálculo a partir da configuração).
7. Rodapé com o aviso: "Infográfico ilustrativo — números fictícios".

Animação: ao carregar, os assentos acendem em sequência e os contadores sobem até o valor final
(requestAnimationFrame). Responsivo: em telas estreitas os cartões ficam em uma coluna.

Regras de código: tokens de cor no :root, classes BEM, funções de até 45 linhas, nomes em
português sem acentos.
```
