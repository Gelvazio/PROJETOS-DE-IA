## Etapa 008-0a81b4ea — INICIO: Inicializador que mostra as pendências do modelo da sessão

**Tarefa:** INICIO · **Pedido em:** 2026-10-15 23:42 · **Criada por:** Claude Code (Opus 5.5) (local · main)
**Pedido:** "tem como voce colocar tipo 1 inicializador, que ja le automaticamente o que e pendente
pro modelo da sessao" · depois: "lista a tarefa e ja pega ela,a proxima da lista"
**Objetivo:** ao abrir uma sessão do Claude Code, já aparecerem as subtarefas livres do nível do
modelo em uso (Haiku → LEVE, Sonnet → MEDIO, Opus/Fable → PESADO), sem o usuário pedir.

### INICIO.1 — Hook de início que lista as subtarefas livres do modelo da sessão

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — 1 hook com lógica + 1 linha de configuração · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Descrição:** `.claude/hooks/inicializar-sessao.mjs` lê o `STATUS.md` e o `task_complete.md`
- **JEV-AI-SUGGESTION:** NAO
  (colunas pelo título), acha as subtarefas `⬜` sem reserva, sem trava e com dependências ✅, e
  mostra as do nível do modelo (campo `model` do evento SessionStart); roda logo depois do
  `sincronizar-main.sh` (`.claude/settings.json`); regra em `multiplas-ias.md`.
- **Critérios de Aceitação:** rodando o hook com `model` Haiku, Sonnet, Opus e sem `model`, a
  lista sai certa; erro do hook não atrapalha a sessão.
- **Entrega:** commit `feat(INICIO.1)` · **Verificação:** `node --check` ok; rodado com `model`
  Haiku → SERVIDOR.1 (LEVE), Sonnet → CLONE.12.2 (MEDIO), Opus → CLONE.1.1 e CLONE.12.4
  (PESADO), sem `model` → lista de todos os níveis; entrada inválida sai com 0; comando completo
  do `settings.json` (sincronizar + inicializar) testado. Se o evento SessionStart não trouxer o
  `model`, cai na lista sem filtro e a IA escolhe pelo próprio nível. Feita por Claude Code
  (Opus 5.5) (local · main), 2026-10-15.
- **Anotação:** o hook só lê o quadro; quem reserva e começa é a IA no primeiro pedido (um hook
  não consegue agir sozinho). Outras IAs (Gemini, Codex…) não rodam hooks do Claude Code: para
  elas, a skill `proxima-task`.
