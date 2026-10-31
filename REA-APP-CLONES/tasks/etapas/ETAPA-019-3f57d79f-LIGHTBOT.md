## Etapa 019-3f57d79f — LIGHTBOT: clone do jogo Light-Bot

**Tarefa:** LIGHTBOT · **Pedido em:** 2026-10-22 16:48 · **Criada por:** Claude Code (Opus 5.5) (local · main)
**Pedido:** "CRIE 1 CLONE DESTE JOGO - https://armorgames.com/play/2205/light-bot"
**Objetivo:** recriar a mecânica do Light-Bot (programar um robô com comandos para acender todos os
ladrilhos azuis de um tabuleiro isométrico) como página web própria, com arte e fases próprias.

### Escopo

- **Entra:** pasta `apps-cloned/light-bot/` com `index.html`, CSS e JS puro (scripts clássicos, abre
  com duplo clique, sem servidor nem build); comandos Andar, Virar à esquerda, Virar à direita,
  Pular, Acender, F1 e F2; programa principal (12 casas), F1 e F2 (8 casas cada); 10 fases
  próprias; animação isométrica em `<canvas>`; progresso salvo no `localStorage`; README.
- **Não entra:** arte, sons, textos ou fases do jogo original (só a mecânica, que não é protegida);
  Flash/SWF; editor de fases; placar online.

### Requisitos

| # | Requisito (EARS) | Verificação |
|---|---|---|
| R1 | QUANDO o jogador clicar em Executar, O SISTEMA DEVE executar o programa principal comando a comando, chamando F1/F2 quando aparecerem. | Script de conferência no scratchpad roda as soluções das 10 fases |
| R2 | QUANDO todos os ladrilhos azuis estiverem acesos, O SISTEMA DEVE parar a execução e marcar a fase como concluída. | Idem R1 (todas as fases terminam em vitória) |
| R3 | SE o programa terminar (ou passar de 1000 passos) sem acender tudo, ENTÃO O SISTEMA DEVE avisar e permitir reiniciar a fase. | Leitura do `jogo.js` e conferência com programa vazio |
| R4 | O SISTEMA DEVE recusar Andar para ladrilho de altura diferente e Pular para ladrilho que não seja 1 nível acima ou mais baixo (o robô fica parado). | Conferência por script |
| R5 | ONDE a casa do programa estiver ocupada, clicar nela DEVE remover o comando. | Leitura do `editor.js` |

### Invariantes

| # | Invariante | Domínio | Como conferir |
|---|---|---|---|
| I1 | O robô nunca fica fora do tabuleiro nem em casa vazia. | Toda sequência de comandos em toda fase | Script percorre comandos aleatórios e confere a posição |
| I2 | A execução sempre termina (limite de 1000 passos e de 200 chamadas na pilha). | Todo programa, inclusive recursivo | Script roda `F1 = [F1]` e confere o fim |

### Perguntas abertas

| # | Pergunta | Situação |
|---|---|---|
| P1 | Usar o nome/arte do jogo original? | ✅ Fechada: não — título "Robô de Luz", arte desenhada no canvas |

### Riscos

| Risco | Plano B |
|---|---|
| Fase sem solução dentro do limite de casas | Script confere uma solução de cada fase antes da entrega |
| Animação só pode ser conferida no navegador | Avisar o usuário para abrir o `index.html` e testar |

### Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-22 16:50 | Executar direto, sem esperar "sim" do plano | Claude Code (Opus 5.5) | Pasta nova e isolada: sem banco, sem segurança, sem apagar nada; o pedido do usuário já define o resultado |

### LIGHTBOT.1 — Jogo completo em `apps-cloned/light-bot/`

**Próximo passo:** nada — entregue. Falta só o jogador testar a animação no navegador.

- **Nível:** PESADO — estrutura nova com mais de 3 arquivos ligados · **Modelo:** só Opus 5.5+ ou Fable · **Effort:** high
- **Descrição:** constantes, fases, mundo (regras de movimento), interpretador (pilha de chamadas),
- **JEV-AI-SUGGESTION:** NAO
  renderizador isométrico, executor (animação), editor do programa, progresso e controlador.
- **Critérios de Aceitação:** R1–R5 e I1–I2 conferidos; `node --check` sem erro em todos os `.js`.
- **Entrega:** commit `feat(LIGHTBOT.1)` · **Verificação:** `node --check` sem erro nos 9 `.js`; nenhuma linha > 100; script de conferência (scratchpad, via `vm`) venceu as 10 fases com uma solução cada dentro do limite de casas (R1, R2), 3000 programas aleatórios sem sair do tabuleiro (I1), `F1 = [F1]` e `F1 = [Virar, F1]` param por limite (I2, R3), Andar contra degrau não move (R4). Animação e cliques (R5) só no navegador: usuário testa.
