# MODELO-3D-REDE-NEURAL-04 — Infográfico animado: a rede do agente tomando os assentos

**Imagem de referência:** `MODELO-3D-REDE-NEURAL-04.png`

## O que a imagem mostra

Página longa em tema escuro, com título amarelo, sobre três agentes de IA que ocupam um organograma
de 25 assentos. O destaque deste quadro é o **movimento**: o organograma marca **15 de 25**
assentos assumidos, e um hexágono "AGENT" está **ligado aos assentos por linhas verdes com nós
vermelhos**, como uma rede que se espalha. Um retângulo azul brilhante percorre a linha dos
assentos (o "cursor" da animação). Os contadores de custo da equipe e do agente estão no meio da
subida. Abaixo, em cartões com borda fina: um kanban semanal (A fazer, Fazendo, Revisão, Feito)
com o contador de tarefas reiniciado em zero; um gráfico de rosca das 1.000 horas da equipe com as
fatias parcialmente desenhadas; um fluxo da receita mensal com só as primeiras faixas acesas; e uma
grade de 25 pessoas tracejadas.

## Prompt (copiar)

```
Crie uma página HTML única (HTML + CSS + JavaScript puro, sem build) que recrie o infográfico
animado da imagem MODELO-3D-REDE-NEURAL-04.png: a "rede" de um agente de IA tomando, um a um, os
assentos de um organograma de 25 pessoas.

Use nomes genéricos (AGENTE PLANEJADOR, AGENTE TESTADOR, AGENTE REVISOR) e números fictícios num
objeto de configuração no topo do script: total de assentos (25), meta de assentos assumidos (15),
custo mensal por pessoa, custo mensal do agente, receita mensal e horas da semana. Não use marcas
de empresas de IA.

Visual (tema escuro #0d0d0d, título amarelo, destaques laranja, azul, rosa e verde, fonte
monoespaçada nos números, cartões com borda fina e rótulo pequeno no canto superior):
1. Cabeçalho: título grande e um parágrafo-resumo com os números em destaque coloridos.
2. Cartão "O organograma" (o centro da animação):
   - três personagens em SVG no alto (cubo laranja pixelado, esfera azul brilhante, esfera rosa
     brilhante) ligados por arcos tracejados com rótulos;
   - linha com 25 assentos (ícone de pessoa) e, à direita, um hexágono "AGENTE" com o número de
     assentos assumidos;
   - a cada assento assumido, uma linha verde (SVG) sai do hexágono até o assento, com um nó
     vermelho pulsante na ponta; as linhas formam uma rede que se espalha;
   - um cursor (retângulo azul com brilho) percorre a linha e para no assento da vez;
   - contadores "X de 25 assentos", "custo mensal da equipe" e "custo mensal do agente" com
     transição numérica suave.
3. Cartão "O quadro": kanban com 4 colunas; cartões de tarefa avançam de coluna em sincronia com a
   linha do tempo e ficam verdes em "Feito"; quando a animação recomeça, o contador da semana volta
   a zero.
4. Cartão "Onde vão as 1.000 horas": gráfico de rosca em SVG (escrever código, reuniões, revisão)
   cujas fatias se desenham aos poucos (stroke-dashoffset) junto com o progresso.
5. Cartão "Para onde vai a receita": diagrama Sankey em SVG (receita → taxas, hospedagem, custo do
   agente, sobra antes de impostos) cujas faixas acendem uma a uma.
6. Cartão "Os assentos, contados com honestidade": grade de 25 pessoas com borda tracejada e o
   número de pessoas que a receita pagaria em salário.
7. Rodapé com o aviso: "Infográfico ilustrativo — números fictícios".

Animação:
- Um único relógio (requestAnimationFrame) emite o progresso de 0 a 1; cada cartão só lê esse
  progresso e se desenha (nenhum cartão controla o tempo).
- Ao chegar em 1, espera 2 s e recomeça (laço infinito).
- Controles discretos no topo: Pausar/Continuar, Reiniciar e velocidade (1x, 2x, 4x).
- Com prefers-reduced-motion ativo, mostre direto o estado final, sem animação.

Regras de código: a linha do tempo fica num módulo próprio; tokens de cor no :root, classes BEM,
funções de até 45 linhas, nomes em português sem acentos. Responsivo: em telas estreitas os
cartões ficam em uma coluna e a linha de assentos quebra em duas fileiras.
```
