# STATUS — C:\fontes (índice de tarefas)

**Objetivo:** esta é a única pasta `tasks/` da raiz. Ela diz onde cada projeto guarda as suas
tarefas e guarda as tarefas globais (que valem para todos os projetos).

## Onde cada projeto busca suas tarefas

| Projeto | Quadro (fonte da verdade) | Etapas | Situação |
|---|---|---|---|
| aulasenai | `aulasenai/tasks/STATUS.md` | `aulasenai/tasks/etapas/` | Quadro próprio |
| rules-ai | `rules-ai/tasks/STATUS.md` | `rules-ai/tasks/etapas/` | Quadro próprio |
| REA-APP-CLONES | `REA-APP-CLONES/tasks/STATUS.md` | `REA-APP-CLONES/tasks/etapas/` | Quadro próprio |
| sistemafinanceiro | `sistemafinanceiro/tasks/STATUS.md` | `sistemafinanceiro/tasks/etapas/` | Quadro próprio |
| controlemercadoria | `controlemercadoria/tasks/` | `controlemercadoria/tasks/etapas/` | Pasta existe; ler antes de usar |
| dashboard-plataformas-de-ia | `dashboard-plataformas-de-ia/STATUS.md` | — | Quadro na raiz do projeto |
| consumo-ia | — | — | Sem quadro |
| ai-memory | — | — | Sem quadro |
| crm | — | — | Sem quadro |
| LOGIC-GAME-BLOCK | — | — | Sem quadro |
| MATERIAL-AULAS-PROF-MAIRA | — | — | Sem quadro |
| PROJETO-IMPRESSAO-3D | — | — | Sem quadro |
| dashboard | — | — | Sem quadro |
| COORDENACAO-DE-PROJETOS | `COORDENACAO-DE-PROJETOS/tasks/STATUS.md` | `COORDENACAO-DE-PROJETOS/tasks/etapas/` | Quadro próprio |
| Dashboards, HACKATON, PROJETO-CERCA, TABELAS-DE-PRECO | — | — | Sem quadro |
| **GLOBAL (raiz)** | `C:\fontes\tasks\STATUS.md` (este arquivo) | `C:\fontes\tasks\etapas\` | Tarefas que valem para todos |

> Regra: cada projeto guarda as suas tarefas dentro da própria pasta (`<projeto>/tasks/`). Só a
> raiz `C:\fontes\tasks\` guarda o índice e as tarefas globais. Não criar outra pasta `tasks` no
> nível da raiz.

## Tarefas globais

- #REMOVER-GIT — [deixar Git só em aulasenai, controlemercadoria e rules-ai](etapas/ETAPA-001-18aa4eac-REMOVER-GIT-EXTRAS.md) · ✅ Concluído · tarefa grande (apaga dados; backup em `_backup-git\`)
  - #REMOVER-GIT.1 — rules-ai mantém o Git · ✅ Concluído (decisão de 2026-10-31: rules-ai fica com Git próprio, público; nada a remover) · nível a classificar pelo Jev
  - #REMOVER-GIT.2 — remover o Git de ai-memory · ✅ Concluído (backup em `_backup-git\ai-memory\.git`) · nível a classificar pelo Jev
  - #REMOVER-GIT.3 — remover o Git de consumo-ia · ✅ Concluído (5 alterações preservadas) · nível a classificar pelo Jev
  - #REMOVER-GIT.4 — remover o Git de REA-APP-CLONES · ✅ Concluído (13 alterações preservadas; havia rebase pendente no backup, conferir) · nível a classificar pelo Jev
  - #REMOVER-GIT.5 — remover o Git de LOGIC-GAME-BLOCK · ✅ Concluído (apagado pelo usuário em 2026-10-31; backup em `_backup-git\LOGIC-GAME-BLOCK\.git`) · nível a classificar pelo Jev
  - #REMOVER-GIT.6 — remover o Git de MATERIAL-AULAS-PROF-MAIRA · ✅ Concluído (3 alterações preservadas) · nível a classificar pelo Jev
  - #REMOVER-GIT.7 — remover o Git de PROJETO-IMPRESSAO-3D · ✅ Concluído (5 alterações preservadas) · nível a classificar pelo Jev
  - #REMOVER-GIT.8 — remover o Git de crm · ✅ Concluído (4 alterações preservadas) · nível a classificar pelo Jev
  - #REMOVER-GIT.9 — remover o Git de sistemafinanceiro · ✅ Concluído (5 alterações preservadas) · nível a classificar pelo Jev

- #REDESENHO-QUADRO-GLOBAL — [quadro global único e fim do sincronizar.mjs](etapas/ETAPA-002-REDESENHO-QUADRO-GLOBAL.md) · 🔄 Em execução · tarefa grande (muda o fluxo de regras)
  - #REDESENHO-QUADRO-GLOBAL.1 — índice do quadro global com links por projeto · ✅ Concluído (este arquivo) · nível a classificar pelo Jev
  - #REDESENHO-QUADRO-GLOBAL.2 — migrar as linhas abertas do quadro do rules-ai · ⬜ Pendente (150 linhas) · nível a classificar pelo Jev
  - #REDESENHO-QUADRO-GLOBAL.3 — rules-local em todos os projetos, buscando as regras de `github.com/Gelvazio/rules-ai` · 🔄 Parcial (4 de 19 projetos) · nível a classificar pelo Jev
  - #REDESENHO-QUADRO-GLOBAL.4 — remover sincronizar.mjs e referências · ⬜ Pendente (depois de .3) · nível a classificar pelo Jev
  - #REDESENHO-QUADRO-GLOBAL.5 — plano B para IAs fora dos projetos · 👀 Aguardando o usuário · nível a classificar pelo Jev

- #UNIFICAR-PROJETOS — 🔀 Absorvida em INTEGRACAO-TAREFAS-FINAL (rules-ai, ETAPA-066); plano e decisões seguem na etapa 003 desta raiz

- #ANALISES-JSON — [script que lê a raiz e gera analises.json para análise por IA](etapas/ETAPA-004-ANALISES-JSON.md) · ✅ Concluído
  - #ANALISES-JSON.1 — criar analises.py, rodar e validar analises.json · ✅ Concluído · Devin (SWE-2 Max) · nível PESADO · effort xhigh
