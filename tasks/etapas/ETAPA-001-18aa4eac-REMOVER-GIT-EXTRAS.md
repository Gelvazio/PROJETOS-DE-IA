## Etapa 001-18aa4eac — REMOVER-GIT: deixar Git só em aulasenai, controlemercadoria e rules-ai
**Tarefa:** REMOVER-GIT · **Pedido em:** 2026-10-31 · **Criada por:** Claude Code (Haiku 5.5)
**Pedido:** "dentro de fontes, apenas aulasenai e controlemercadoria devem ser git, crie 1 tarefa pra remover o git de todos os demais, com 1 subtask por projeto"
**Objetivo:** deixar só `aulasenai`, `controlemercadoria` e `rules-ai` como repositórios Git dentro de `C:\fontes`. Os outros oito perdem a pasta `.git` local. O código, os arquivos e o remoto no GitHub continuam como estão.

### Escopo
- Entra: apagar a pasta `.git` local de cada um dos 8 projetos abaixo (todos menos o `rules-ai`); registrar o estado de cada um antes; atualizar o `CLAUDE.md` da raiz (mapa de projetos).
- Não entra: apagar o remoto no GitHub; mexer em `aulasenai`, `controlemercadoria` e `rules-ai` (os três mantêm o Git); mexer no código dos 8 projetos; fazer commit em nenhum deles.

### Projetos (1 subtarefa cada)
| Subtarefa | Projeto | Remoto (fica no GitHub) | Estado local ao planejar |
|---|---|---|---|
| .1 | rules-ai | Gelvazio/rules-ai | **MANTÉM o Git** (decisão de 2026-10-31); nada a remover |
| .2 | ai-memory | Gelvazio/ai-memory | limpo, sincronizado |
| .3 | consumo-ia | Gelvazio/consumo-ia | 5 alterações não commitadas |
| .4 | REA-APP-CLONES | Gelvazio/rea-app-clones | 13 alterações não commitadas |
| .5 | LOGIC-GAME-BLOCK | Gelvazio/LOGIC-GAME-BLOCK | limpo, sincronizado |
| .6 | MATERIAL-AULAS-PROF-MAIRA | Gelvazio/MATERIAL-AULAS-PROF-MAIRA | 3 alterações não commitadas |
| .7 | PROJETO-IMPRESSAO-3D | Gelvazio/PROJETO-IMPRESSAO-3D | 5 alterações não commitadas |
| .8 | crm | Gelvazio/crm | 4 alterações não commitadas |
| .9 | sistemafinanceiro | Gelvazio/sistemafinanceiro | 5 alterações não commitadas |

### Riscos
- **Perda de histórico local e de alterações não commitadas.** Apagar o `.git` leva junto o histórico local e as alterações que ainda não foram commitadas. Antes de apagar, cada projeto precisa de commit e push (ou de uma cópia do `.git` em lugar seguro). Plano B: copiar a pasta `.git` para `C:\fontes\_backup-git\<projeto>` antes de apagar.
- **`rules-ai` quebra o fluxo de regras.** O `sincronizar.mjs` exige Git e compara com `origin/main`. O `sessao.mjs` de cada projeto baixa as regras do GitHub. Plano B: não remover o `.git` de `rules-ai` sem antes trocar esse fluxo; este item fica com 👀 até a sua decisão.
- **`ai-memory` é um fork.** Confirmar que o remoto `Gelvazio/ai-memory` está completo antes de apagar o `.git`.
- **Projetos sem `.git` deixam de ser atualizados por `UPDATE.py`.** O script passa a ignorar esses nove; confirmar se isso é o que você quer.

### Premissas
- O remoto no GitHub de cada projeto continua disponível e completo.
- "Remover o git" significa apagar a pasta `.git` local. Não significa apagar o repositório remoto.

### Decisões
- 2026-10-31: tarefa criada a partir do pedido do usuário. Aguarda aprovação do plano antes de qualquer `.git` ser apagado (tarefa grande: apaga dados).
- 2026-10-31: por ordem do usuário, o `rules-ai` **deve manter o Git**. A tarefa passa a deixar Git em `aulasenai`, `controlemercadoria` e `rules-ai`; a subtarefa .1 fica sem ação (Git mantido, público em `Gelvazio/rules-ai`).

### Verificação (cada subtarefa)
- Antes: `git -C <projeto> status -sb` (sem alterações pendentes) e remoto conferido com `git remote -v`.
- Depois: a pasta `<projeto>/.git` não existe; os arquivos do projeto estão intactos; `git -C <projeto> rev-parse` falha como esperado.
- Raiz: `git -C C:\fontes status` não lista mais os oito projetos como repositórios aninhados.
- `rules-ai`: a pasta `rules-ai/.git` continua existindo.

- 2026-10-31: o usuário apagou o `.git` do LOGIC-GAME-BLOCK (a exclusão fora negada pelo classificador). Conferido: só aulasenai, controlemercadoria e rules-ai têm `.git`. Tarefa concluída.

### Próximo passo
Nenhum: tarefa concluída. Resta atualizar o mapa de projetos do `CLAUDE.md`/`AGENTS.md` da raiz, se ainda citar Git nesses oito projetos.
