## Etapa 043-f33c0509 — LIDER-SEM-MONITORES: tirar o VIGIA e o FINANCEIRO do prompt do líder

**Tarefa:** LIDER-SEM-MONITORES · **Pedido em:** 2026-10-23 13:24 · **Criada por:** Claude Code (Opus 5.5 · sargento herdr w2:p1) (local · main · rules-ai)
**Pedido:** "remova financeiro e vigia das regras do lider" · "com as memorias, isso nao precisa mais" · "ja faca esta tarefa ... agora!"
**Objetivo:** o prompt do líder (`tasks/GERENCIADOR-HERDR/PROMPT_PARA_O_LIDER.md`) deixa de mandar criar o VIGIA e de ler o `PROMPT_FINANCEIRO.md`.

### Decisões

- 2026-10-23 13:24: pedido do usuário; tarefa pequena (2 arquivos `.md`). O `PROMPT_FINANCEIRO.md` é apagado porque só o prompt do líder o usava (conferido com `git grep`); volta com `git revert` se precisar. O histórico das etapas antigas que citam o VIGIA não muda.

### LIDER-SEM-MONITORES.1 — Tirar o VIGIA e o FINANCEIRO de `PROMPT_PARA_O_LIDER.md` e apagar o `PROMPT_FINANCEIRO.md`

**Próximo passo:** nenhum — entregue.

- **Nível:** LEVE — só `.md`
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** em `PROMPT_PARA_O_LIDER.md`, tirar o parágrafo que cria o VIGIA e a linha que manda ler o `PROMPT_FINANCEIRO.md`, sem mudar o resto; apagar `tasks/GERENCIADOR-HERDR/PROMPT_FINANCEIRO.md`.
- **Arquivos:** `tasks/GERENCIADOR-HERDR/PROMPT_PARA_O_LIDER.md`, `tasks/GERENCIADOR-HERDR/PROMPT_FINANCEIRO.md`
- **Critérios de Aceitação:** `git grep -i "vigia\|financeiro" -- tasks/GERENCIADOR-HERDR` vazio; o resto do prompt igual.
- **Depende de:** Nenhuma
- **Entrega:** `PROMPT_PARA_O_LIDER.md` sem o parágrafo do VIGIA e sem a linha do `PROMPT_FINANCEIRO.md`; `PROMPT_FINANCEIRO.md` apagado (commit desta entrega), feito por h1 (Haiku 5.5, herdr w2:pY, conta D), 2026-10-23 13:25.
- **Verificação:** `git grep -n -i "vigia\|financeiro" -- tasks/GERENCIADOR-HERDR` vazio; o resto do prompt igual (conferido pelo líder com cat -n).
