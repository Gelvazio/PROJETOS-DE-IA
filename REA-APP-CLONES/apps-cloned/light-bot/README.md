# Robô de Luz — clone do Light-Bot

Jogo de lógica em que você **programa um robô** para acender todos os ladrilhos azuis de um
tabuleiro isométrico. Recria a mecânica do Light-Bot (Armor Games); as fases, a arte e os textos são
próprios deste clone.

## Como jogar

Abra o `index.html` com duplo clique (não precisa de servidor nem de build).

| Comando | Efeito |
|---|---|
| ⬆ Andar | Vai uma casa para a frente, só se ela tiver a **mesma altura** |
| ↶ / ↷ Virar | Gira 90° para a esquerda ou para a direita |
| ⤴ Pular | Sobe **1 nível** ou desce qualquer altura |
| 💡 Acender | Acende (ou apaga) a luz do ladrilho azul onde o robô está |
| F1 / F2 | Executa a função F1 ou F2 (podem chamar uma à outra ou a si mesmas) |

- O programa **Principal** tem 12 casas; **F1** e **F2** têm 8 casas cada.
- Clique no nome de uma lista para escolher onde os comandos entram; clique numa casa cheia para
  tirar o comando.
- A fase termina quando todas as luzes azuis estiverem acesas. O progresso e o programa de cada fase
  ficam salvos no navegador (`localStorage`).
- A execução para sozinha depois de 1000 passos (ou 200 chamadas na pilha), para recursão sem fim.

## Estrutura

| Arquivo | Responsabilidade |
|---|---|
| `js/constantes.js` | Comandos, direções, limites, tempos, medidas e mensagens |
| `js/fases.js` | As 10 fases e o leitor do formato de mapa |
| `js/mundo.js` | Regras do tabuleiro: andar, pular, virar, acender, vitória |
| `js/interpretador.js` | Percorre Principal/F1/F2 com pilha de chamadas |
| `js/renderizador.js` | Desenho isométrico no `<canvas>` |
| `js/executor.js` | Executa passo a passo com animação |
| `js/editor.js` | Paleta de comandos e casas do programa |
| `js/progresso.js` | Fases concluídas e programas salvos |
| `js/jogo.js` | Controlador: liga as peças e os botões |

## Formato das fases

Cada linha do mapa é uma string; casas separadas por espaço: `.` = vazio, número = altura,
sufixo `b` = ladrilho azul. Exemplo: `['1 1 2 2b']` com início `{ x: 0, y: 0, direcao: 'L' }`
(direções `N`, `L`, `S`, `O`).
