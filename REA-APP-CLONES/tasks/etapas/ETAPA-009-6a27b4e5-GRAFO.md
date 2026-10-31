## Etapa 009-6a27b4e5 — GRAFO: regra para rodar e consultar o graphify

**Tarefa:** GRAFO · **Pedido em:** 2026-10-15 23:52 · **Criada por:** Claude Code (Haiku 5.5) (local · main)
**Pedido:** "adicione 1 regra no claude.md, que a cada mudança o graphify deve rodar, e a cada chat deve ser consultado o grafo de conhecimento"
**Objetivo:** que toda mudança no REA atualize o grafo (`graphify-out/`) e que cada chat consulte o grafo antes de responder sobre o projeto.

### GRAFO.1 — Regra `.claude/rules/graphify.md` (indexada e apontada no checklist)

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — 1 arquivo de regra novo + 2 linhas de apontamento · **Modelo:** Claude Code Haiku 5.5 (ou …)
- **Descrição:** regra em `.claude/rules/graphify.md` (o `CLAUDE.md` do projeto só aponta para `AGENTS.md`, por isso a regra vai no arquivo do assunto). Conteúdo: (1) após cada mudança, rodar `/graphify --update` (incremental) sobre a raiz do REA; (2) no início de cada chat, consultar o grafo com `/graphify query` antes de responder sobre o projeto; (3) se `graphify-out/` não existir, rodar `/graphify` completo antes. Vale só para o REA e prevalece sobre a regra global que proíbe rodar o graphify automaticamente.
- **Critérios de Aceitação:** arquivo `.claude/rules/graphify.md` com até 5 KB, linha no `INDEX.md`, item no checklist do `essentials.md`; a regra não repete texto em outro arquivo.
- **Entrega:** commit `feat(GRAFO.1)` (com a reserva em `lock: assumindo sub-task GRAFO.1` antes) · **Verificação:** regra com 1.328 bytes (até 5 KB); linha no `INDEX.md` e item no checklist do `essentials.md`; `/graphify --update` rodado depois da mudança (15 arquivos alterados, 4 de código por AST e 11 documentos por extração semântica), grafo com 436 nós, 650 arestas e 45 comunidades, com a poda dos nós antigos conferida; `git diff --cached` antes do commit mostrando só os arquivos da subtarefa.
- **Anotação:** `graphify-out/` já está no `.gitignore`, então a saída do grafo não entra no commit. As comunidades do grafo ganharam nomes automáticos (nó de maior grau); os nomes manuais das 15 primeiras foram substituídos.
- **Anotação:** `graphify-out/` já está no `.gitignore`, então a saída do grafo não entra no commit.
- **JEV-AI-SUGGESTION:** NAO

### Decisões

- 2026-10-15 23:52 — a regra vai para `.claude/rules/graphify.md`, não para o `CLAUDE.md` da raiz, porque o `CLAUDE.md` do REA só aponta para o `AGENTS.md` (regra do próprio projeto). Pedido do usuário.
