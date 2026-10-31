## Etapa 022-0fb7545b — JEV-NAO: Marcar JEV-AI-SUGGESTION: NAO nas etapas do projeto (C47)

**Tarefa:** JEV-NAO · **Pedido em:** 2026-10-23 11:30 · **Criada por:** Claude Code (Sonnet 5.5) (local · main · rules-ai)
**Pedido:** pendência da JEV-GRAVA-NIVEL (etapa 035 do `rules-ai`): "Marcar JEV-AI-SUGGESTION: NAO nos outros projetos, uma TASK por projeto". Pedido do usuário: "crie agora".
**Objetivo:** todo cabeçalho de subtarefa das etapas deste projeto passa a ter `- **JEV-AI-SUGGESTION:** NAO` (C47), para o Jev saber quais níveis ele não escolheu.

### JEV-NAO.1 — Rodar o script que marca JEV-AI-SUGGESTION: NAO nas subtarefas

**Próximo passo:** na raiz do projeto, `python C:/fontes/rules-ai/scripts/marcar_jev_ai_suggestion.py .` (dry-run: só mostra a contagem); conferir; repetir com `--aplicar`; commit e push.

- **Nível:** LEVE — só roda um script existente que acrescenta uma linha de metadado; sem lógica nova
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **Descrição:** o script do `rules-ai` (`scripts/marcar_jev_ai_suggestion.py`) acrescenta a linha `JEV-AI-SUGGESTION: NAO` em toda seção de subtarefa das etapas em `tasks/etapas/` que ainda não a tem. Segunda execução não altera nada. Não existe cópia do script neste projeto: usar o caminho do `rules-ai` (só no computador local).
- **Critérios de Aceitação:** o dry-run seguinte mostra 0 seções a marcar; só arquivos em `tasks/etapas/` mudaram (`git diff --name-only`); nenhum outro texto das etapas mudou (`git diff` só com linhas `+` do campo); commit com o quadro no mesmo commit.
- **Entrega:** commit `feat(JEV-NAO.1)` deste lote (hash no `git log`; reserva em `lock: assumindo sub-task JEV-NAO.1`, commit `6f5af08`) · **Verificação:** dry-run com `--aplicar` marcou 110 seções em 19 etapas; o dry-run seguinte deu 0 pendentes; `git diff` das etapas só tem linhas `+` do campo `JEV-AI-SUGGESTION: NAO`. Arquivos `.gitignore` e `graphify-out/` já estavam modificados antes da sessão e ficaram fora do commit.
- **JEV-AI-SUGGESTION:** NAO
