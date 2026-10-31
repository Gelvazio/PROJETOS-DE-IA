# MODELO-3D-REDE-NEURAL-03 — Painel de robô com toro 3D de partículas

**Imagem de referência:** `MODELO-3D-REDE-NEURAL-03.png`

## O que a imagem mostra

Painel de terminal financeiro em tela cheia, fundo azul-escuro, letras pequenas em caixa alta e
faixa vermelha "LIVE FEED" no topo com uma barra de informações rolando. Linha de cima com 4
painéis: **carteira** (P&L total grande em verde, taxa de acerto, número de operações), **preço do
BTC** (candles e livro de ofertas com preços em verde e vermelho), **latência e base** (gráfico de
linhas spot × perp × oráculo) e **inspetor de rede** (lista de transações). No centro, o destaque:
**"NEURAL SHELL"**, um **toro 3D feito de milhares de partículas** (azul, branco e amarelo), com
linhas que saem dos sinais de entrada à esquerda (BTC spot, gap, perp, modelo, risco) e chegam a
uma coluna de ordens à direita (cartões "UP" com valores). Embaixo, a **fita de execução** (tabela
de ordens) e o **funil de resolução** (curvas convergindo para o vencimento) com indicadores no
rodapé (P&L da última operação, média, taxa de acerto).

## Prompt (copiar)

```
Crie uma página HTML (HTML + CSS + JavaScript em módulos ES, Three.js 0.170.0 por import map do
jsDelivr) que recrie o painel da imagem MODELO-3D-REDE-NEURAL-03.png: um "terminal" de robô de
previsão com um toro 3D de partículas no centro.

Layout em grade de tela cheia (fundo #050b1a, bordas finas #1c2a4a, fonte monoespaçada pequena,
verde #22c55e para alta e vermelho #ef4444 para baixa):
1. Faixa superior: selo vermelho "AO VIVO" e uma linha de informações rolando (marquee em CSS).
2. Linha de cima com 4 painéis:
   - Carteira: P&L total grande em verde, taxa de acerto, operações, risco atual.
   - Preço: gráfico de candles (canvas 2D) e livro de ofertas com 6 níveis de compra e venda.
   - Latência e base: gráfico de linhas com 3 séries (spot, perp, oráculo).
   - Inspetor: lista de transações com hash curto, horário e status.
3. Centro, ocupando a largura: o "NÚCLEO NEURAL" em Three.js:
   - um toro com 12.000 partículas (THREE.Points), cores misturando azul, branco e amarelo,
     girando devagar, com leve pulsação;
   - à esquerda, 6 sinais de entrada (rótulos HTML: preço spot, gap, perp, modelo, risco,
     volume), cada um ligado ao toro por uma curva (THREE.CatmullRomCurve3) com um pulso de luz
     que viaja por ela;
   - à direita, coluna de 10 cartões de ordem ("ALTA"/"BAIXA" e valor), ligados ao toro por
     curvas que acendem quando a ordem é criada;
   - OrbitControls com zoom limitado e rotação automática.
4. Linha de baixo com 2 painéis:
   - Fita de execução: tabela que recebe uma linha nova a cada 2 s (hora, lado, preço, tamanho,
     resultado colorido).
   - Funil de resolução: várias curvas (canvas 2D) que convergem para um ponto de vencimento.
5. Rodapé com 5 indicadores grandes (último resultado, média, mediana, taxa de acerto, liquidação).

Comportamento: todos os números são fictícios e gerados por um passeio aleatório com semente fixa.
Mostre no rodapé o aviso "Simulação — dados fictícios, não é operação nem recomendação financeira".
Use requestAnimationFrame num único laço; pause a animação quando a aba estiver oculta.

Regras de código: módulos separados (cena do toro, gráficos, dados simulados, painéis), tokens de
cor no :root, classes BEM, funções de até 45 linhas, nomes em português sem acentos. Responsivo:
em telas estreitas os painéis empilham e o toro fica com 60vh de altura.
```
