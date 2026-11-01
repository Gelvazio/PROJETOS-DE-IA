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

- #UNIFICAR-PROJETOS — [juntar dashboard-plataformas-de-ia e COORDENACAO-DE-PROJETOS em rules-ai/dashboard](etapas/ETAPA-003-b7d3f9a2-UNIFICAR-PROJETOS.md) · 👀 Aguardando o usuário (plano grande: falta o "sim") · — (não reservável)
  - #UNIFICAR-PROJETOS.1 — Inventariar arquivos, tamanhos e dependências dos 3 projetos · ⬜ Pendente · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.2 — Mapear URLs, caminhos absolutos e referências cruzadas entre os 3 · ⬜ Pendente (depende da UNIFICAR-PROJETOS.1) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.3 — Conferir trava de sessão e regras do rules-ai/dashboard (CLAUDE.md, AGENTS.md) · ⬜ Pendente · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.4 — Definir o mapa de destino das pastas dentro de rules-ai/dashboard · ⬜ Pendente (depende da UNIFICAR-PROJETOS.2, UNIFICAR-PROJETOS.3) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.5 — Fazer backup (cópia fora de qualquer repositório) dos 3 projetos · ⬜ Pendente (depende da UNIFICAR-PROJETOS.1) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.6 — Registrar as decisões das perguntas abertas na etapa · ⬜ Pendente (depende da UNIFICAR-PROJETOS.4) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.7 — Migrar o conteúdo de plataformas (AGENTS.md da origem) para docs/plataformas.md · ⬜ Pendente (depende da UNIFICAR-PROJETOS.6) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.8 — Migrar SKILLS.md · ⬜ Pendente (depende da UNIFICAR-PROJETOS.6) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.9 — Migrar README.md e LICENSE (licença preservada) · ⬜ Pendente (depende da UNIFICAR-PROJETOS.6) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.10 — Migrar docs/criar-secao-ferramentas-recursos.md · ⬜ Pendente (depende da UNIFICAR-PROJETOS.6) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.11 — Migrar docs/pagina-models-openrouter-ai.md · ⬜ Pendente (depende da UNIFICAR-PROJETOS.6) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.12 — Migrar open-routers-models.json · ⬜ Pendente (depende da UNIFICAR-PROJETOS.6) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.13 — Migrar os 4 JS models-openrouter-* para assets/js · ⬜ Pendente (depende da UNIFICAR-PROJETOS.6) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.14 — Migrar os CSS da origem para assets/css (com prefixo) · ⬜ Pendente (depende da UNIFICAR-PROJETOS.6) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.15 — Migrar models-openrouter-ai.html como página do dashboard (menu e tema futurista) · ⬜ Pendente (depende da UNIFICAR-PROJETOS.12, UNIFICAR-PROJETOS.13, UNIFICAR-PROJETOS.14) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.16 — Migrar o index.html (abas) para plataformas.html · ⬜ Pendente (depende da UNIFICAR-PROJETOS.7, UNIFICAR-PROJETOS.14) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.17 — Migrar o histórico do STATUS.md (etapas 1 a 11) para uma etapa histórica · ⬜ Pendente (depende da UNIFICAR-PROJETOS.6) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.18 — Recriar as pendências (item 10.2 aba Ferramentas; 11.10 aceite) como subtarefas · ⬜ Pendente (depende da UNIFICAR-PROJETOS.17) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.19 — Migrar o index.html dos 7 cards como página projetos-de-ia.html · ⬜ Pendente (depende da UNIFICAR-PROJETOS.6) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.20 — Migrar 01-AGENTE-WHATSAPP · ⬜ Pendente (depende da UNIFICAR-PROJETOS.19) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.21 — Migrar 02-SITE-DO-MAPS · ⬜ Pendente (depende da UNIFICAR-PROJETOS.19) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.22 — Migrar 03-MAQUINA-DE-ANUNCIOS · ⬜ Pendente (depende da UNIFICAR-PROJETOS.19) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.23 — Migrar 04-AGENTE-DE-VOZ · ⬜ Pendente (depende da UNIFICAR-PROJETOS.19) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.24 — Migrar 05-MAQUINA-DE-CARROSSEIS · ⬜ Pendente (depende da UNIFICAR-PROJETOS.19) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.25 — Migrar 06-VIDEO-DE-IMOVEL · ⬜ Pendente (depende da UNIFICAR-PROJETOS.19) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.26 — Migrar 07-ASSISTENTE-PESSOAL · ⬜ Pendente (depende da UNIFICAR-PROJETOS.19) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.27 — Unificar estilo.css e markdown.css com o tema-futurista · ⬜ Pendente (depende da UNIFICAR-PROJETOS.19) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.28 — Migrar copiar.js · ⬜ Pendente (depende da UNIFICAR-PROJETOS.19) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.29 — Migrar VISUAL-FUTURISTA.md · ⬜ Pendente (depende da UNIFICAR-PROJETOS.6) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.30 — Preservar no destino a regra 'melhoria de prompt só no PROMPT_BASE.md' · ⬜ Pendente (depende da UNIFICAR-PROJETOS.20, UNIFICAR-PROJETOS.21, UNIFICAR-PROJETOS.22, UNIFICAR-PROJETOS.23, UNIFICAR-PROJETOS.24, UNIFICAR-PROJETOS.25, UNIFICAR-PROJETOS.26) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.31 — Migrar AUTO-SWARM-AGENT-COORDINATOR.md · ⬜ Pendente (depende da UNIFICAR-PROJETOS.6) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.32 — Migrar definir-autoswarm-home.cmd e ajustar o caminho de AUTOSWARM_HOME · ⬜ Pendente (depende da UNIFICAR-PROJETOS.31) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.33 — Decidir o lugar do clone AutoSwarm/ (fica fora do Git do dashboard) · ⬜ Pendente (depende da UNIFICAR-PROJETOS.6) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.34 — Migrar o quadro tasks/ e as regras .claude/rules/tasks do COORDENACAO · ⬜ Pendente (depende da UNIFICAR-PROJETOS.6) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.35 — Menu unificado: abas novas em assets/js/menu.js · ⬜ Pendente (depende da UNIFICAR-PROJETOS.15, UNIFICAR-PROJETOS.16, UNIFICAR-PROJETOS.19) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.36 — Atualizar projetos.json para listar os novos conteúdos · ⬜ Pendente (depende da UNIFICAR-PROJETOS.35) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.37 — Resolver conflitos de nomes de arquivos e de classes CSS (prefixos) · ⬜ Pendente (depende da UNIFICAR-PROJETOS.14, UNIFICAR-PROJETOS.27) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.38 — Ajustar caminhos relativos e links das páginas migradas · ⬜ Pendente (depende da UNIFICAR-PROJETOS.35, UNIFICAR-PROJETOS.37) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.39 — Script que roda `autoswarm calls` e grava autoswarm-calls.json · ⬜ Pendente (depende da UNIFICAR-PROJETOS.32) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.40 — Página AUTOSWARM-CALLS.html no molde de JEV-AI-CALLS.html · ⬜ Pendente (depende da UNIFICAR-PROJETOS.39, UNIFICAR-PROJETOS.35) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.41 — Cruzar chamadas do AutoSwarm com as tarefas do quadro (ID no prompt) · ⬜ Pendente (depende da UNIFICAR-PROJETOS.40) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.42 — Aplicar SOLID, limite de 45 linhas por função e 1000 por arquivo nos JS/Python migrados · ⬜ Pendente (depende da UNIFICAR-PROJETOS.38) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.43 — Documentar as funções migradas (JSDoc e docstring) · ⬜ Pendente (depende da UNIFICAR-PROJETOS.42) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.44 — Rodar `node --check` em todos os JS do dashboard · ⬜ Pendente (depende da UNIFICAR-PROJETOS.43) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.45 — Conferir links e caminhos por leitura e `grep` · ⬜ Pendente (depende da UNIFICAR-PROJETOS.38) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.46 — Conferir que o kanban e o globo atuais seguem intactos (diff dos arquivos antigos) · ⬜ Pendente (depende da UNIFICAR-PROJETOS.38) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.47 — Conferir privacidade: sem segredo, token ou caminho pessoal antes de publicar · ⬜ Pendente (depende da UNIFICAR-PROJETOS.38) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.48 — Atualizar o README e o CLAUDE.md do dashboard · ⬜ Pendente (depende da UNIFICAR-PROJETOS.44, UNIFICAR-PROJETOS.45, UNIFICAR-PROJETOS.46, UNIFICAR-PROJETOS.47) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.49 — Atualizar o mapa C:\fontes\CLAUDE.md e AGENTS.md · ⬜ Pendente (depende da UNIFICAR-PROJETOS.48) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.50 — Atualizar o portal index.html da raiz e seus dados · ⬜ Pendente (depende da UNIFICAR-PROJETOS.48) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.51 — Atualizar o índice C:\fontes\tasks\STATUS.md · ⬜ Pendente (depende da UNIFICAR-PROJETOS.48) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.52 — Conferir vercel.json e .vercelignore do rules-ai (regra C46) · ⬜ Pendente (depende da UNIFICAR-PROJETOS.48) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.53 — Commit e push no rules-ai (e na raiz para o que ficar nela) · ⬜ Pendente (depende da UNIFICAR-PROJETOS.47, UNIFICAR-PROJETOS.48) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.54 — Arquivar as pastas antigas em _backup (só com o 'sim' do usuário) · ⬜ Pendente (depende da UNIFICAR-PROJETOS.53) · nível a classificar pelo Jev
  - #UNIFICAR-PROJETOS.55 — Tirar os projetos antigos do índice e do mapa · ⬜ Pendente (depende da UNIFICAR-PROJETOS.54) · nível a classificar pelo Jev
