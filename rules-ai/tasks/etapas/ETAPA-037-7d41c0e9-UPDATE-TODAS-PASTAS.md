## Etapa 037-7d41c0e9 — UPDATE-TODAS-PASTAS: `scripts/UPDATE.py` atualiza todas as pastas de `C:\fontes`

**Tarefa:** UPDATE-TODAS-PASTAS · **Pedido em:** 2026-10-23 09:30 · **Criada por:** Claude Code (Sonnet 5.5) (local · main · aulasenai)
**Pedido:** "altere update.py pra ler todas as pastas em C:\fontes, exceto DEMAIS-PROJETOS-NAO-MEXER-AGORA e a propria rules-ai" → "e ignorar tambem .vscode, .agents, .claude"
**Objetivo:** o `UPDATE.py` não depende mais de prefixos de nome: atualiza toda pasta de `C:\fontes` que seja repositório Git, menos as excluídas.

### UPDATE-TODAS-PASTAS.1 — Trocar os prefixos por lista de exclusões em `scripts/UPDATE.py`

**Próximo passo:** nenhum — entregue.

- **Nível:** MEDIO — 1 arquivo Python com lógica, sem banco nem segurança (o Jev sugeriu LEVE, mas código com lógica é MEDIO pelos sinais; o mais restritivo vale).
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Descrição:** `PREFIXOS_PASTAS` sai; entra `PASTAS_IGNORADAS = ("DEMAIS-PROJETOS-NAO-MEXER-AGORA", "rules-ai", ".vscode", ".agents", ".claude")`. `listar_pastas` pega toda subpasta de `C:\fontes` com `.git` que não esteja na lista. Docstring, `--help` e exemplo atualizados.
- **Critérios de aceitação:** `py_compile` ok; o script lista só repositórios Git de `C:\fontes`; `DEMAIS-PROJETOS-NAO-MEXER-AGORA` e `rules-ai` nunca aparecem; nada é lido dentro da pasta ignorada (C23).
- **Entrega:** `scripts/UPDATE.py` (`PASTAS_IGNORADAS` no lugar de `PREFIXOS_PASTAS`; commit desta entrega) · **Verificação:** `py_compile -W error` ok; `listar_pastas` devolve DASHBOARD-AI-PRINCIPAL, REA-APP-CLONES, ai-memory, aulasenai, projeto-frontend-com-testes e testes-de-frontend (sem `rules-ai`, `.claude` e `DEMAIS-PROJETOS-NAO-MEXER-AGORA`). O script não foi rodado de novo (faz pull nas pastas).
- **JEV-AI-SUGGESTION:** NAO
