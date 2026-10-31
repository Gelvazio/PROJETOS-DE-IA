## Etapa 016-57182721 — RETOMAR: ler o status das tarefas e o prompt do líder ao começar

**Tarefa:** RETOMAR · **Pedido em:** 2026-10-18 07:21 · **Criada por:** Claude Code (Opus 5.5) (local · main)
**Pedido:** "anote no CLAUDE.md raiz, que ao comecar, deve sempre ler primeiro o arquivo
*tasks/STATUS_TAREFAS_ANDAMENTO.md* e depois o *PROMPT_PARA_O_LIDER.md* e seguir o que tem nos 2
arquivos"
**Objetivo:** toda sessão nova retoma a equipe de onde parou, lendo esses 2 arquivos antes de tudo.

### Decisões

- 2026-10-18 07:21 — O pedido de "anotar no `CLAUDE.md`" vai para `.claude/rules/essentials.md` (checklist de
  início), porque pela regra do projeto o `CLAUDE.md` só aponta para o `AGENTS.md` e "salvar no
  `CLAUDE.md`" quer dizer salvar no arquivo do assunto em `.claude/rules/`. Quem: Claude Code
  (Opus 5.5), líder.
- O `tasks/PROMPT_PARA_O_LIDER.md` ainda não estava no Git: entra no commit desta tarefa.

### RETOMAR.1 — Passo de leitura no `essentials.md`

**Próximo passo:** nenhum — concluída.
`tasks/PROMPT_PARA_O_LIDER.md`.

- **Nível:** LEVE — só `.md` · **Modelo:** Claude Code Haiku 5.5 (só ele)
- **Descrição:** em `.claude/rules/essentials.md`, seção "2. Ler, nesta ordem", pôr no topo da
- **JEV-AI-SUGGESTION:** NAO
  tabela: 1º `tasks/STATUS_TAREFAS_ANDAMENTO.md`, 2º `tasks/PROMPT_PARA_O_LIDER.md`, e uma
  frase dizendo para seguir o que os dois mandam; item no checklist da seção 3.
- **Critérios de Aceitação:** arquivo com até 5 KB, linhas até 100 caracteres, sem repetir a regra
- **Entrega:** commit `feat(RETOMAR.1)` — `.claude/rules/essentials.md`: na seção "2. Ler, nesta ordem", frase "Antes de tudo" e as 2 primeiras linhas da tabela (`tasks/STATUS_TAREFAS_ANDAMENTO.md` e `tasks/PROMPT_PARA_O_LIDER.md`, seguir os dois); 1º item do checklist. `tasks/PROMPT_PARA_O_LIDER.md` versionado. Feita por Claude Code (Haiku 5.5 · executor-leve; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** Líder conferiu: nenhuma linha acima de 100 caracteres (contagem em caracteres pelo Python), 2,1 KB (limite 5 KB), nada repetido em outro arquivo.
  em outro arquivo.
