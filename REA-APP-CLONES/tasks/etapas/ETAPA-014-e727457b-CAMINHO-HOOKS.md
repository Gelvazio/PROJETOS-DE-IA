## Etapa 014-e727457b — CAMINHO: corrigir o caminho quebrado e versionar os hooks do Codex

**Tarefa:** CAMINHO · **Pedido em:** 2026-10-16 16:33 · **Criada por:** Claude Code (Opus 5.5) (local · main)
**Pedido:** "1-sim;2-adicione ao git" (resposta ao status do projeto: 1 = corrigir o caminho
`C:\fontes\rules-ai` quebrado; 2 = pôr `.codex/hooks.json` e `.codex/hooks/` no Git).
**Objetivo:** o aviso de regras globais mostrar o caminho certo e os hooks do Codex irem para o Git.

### CAMINHO.1 — Corrigir o caminho com caracteres de controle

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — troca de texto em 3 arquivos · **Modelo:** Claude Code Haiku 5.5. Pega por
- **JEV-AI-SUGGESTION:** NAO
  Opus 5.5 a pedido direto do usuário (o `pre-commit` só avisou, por ser mais leve).
- **Critérios de Aceitação:** nenhum caractere de controle (`\x0c`, `\x0d`, `\x09`) no lugar das
  barras; o texto mostra `C:\fontes\rules-ai` e `C:\fontes\REA-APP-CLONES\tools\ghidra`.
- **Descrição:** ao gravar o caminho, `\f` virou quebra de página, `\r` virou retorno de carro e
  `\t` virou tabulação. Afeta `AGENTS.md`, `CLAUDE.md` (commit `f1dd332`) e a etapa 002 (GHIDRA).
- **Entrega:** `AGENTS.md` e `CLAUDE.md` já tinham sido corrigidos pelo usuário no commit
  `f68893b` (16:33), chegado durante a abertura da tarefa; aqui ficou só a etapa 002 (linha 54).
  Commit `fix(CAMINHO.1)`.
- **Verificação:** `grep -P '\x0c'` em `AGENTS.md`, `CLAUDE.md` e `tasks/etapas/*.md` não acha
  nada; a linha 54 da etapa 002 mostra `C:\fontes\REA-APP-CLONES\tools\ghidra`.

### CAMINHO.2 — Versionar os hooks do Codex

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — só adicionar arquivos ao Git · **Modelo:** Claude Code Haiku 5.5. Pega por
- **JEV-AI-SUGGESTION:** NAO
  Opus 5.5 a pedido direto do usuário (o `pre-commit` só avisou, por ser mais leve).
- **Critérios de Aceitação:** `git ls-files .codex` lista `hooks.json` e os 3 arquivos de `hooks/`.
- **Descrição:** `hooks.json` liga `exigir-reserva.mjs`, `lembrar-task.mjs` e
  `sincronizar-main.sh` aos eventos do Codex. Conferidos antes: não há chaves nem tokens.
- **Entrega:** commit `feat(CAMINHO.2)` com os 4 arquivos, sem alterar o conteúdo deles.
- **Verificação:** `git ls-files .codex` lista `hooks.json`, `hooks/exigir-reserva.mjs`,
  `hooks/lembrar-task.mjs` e `hooks/sincronizar-main.sh`; `node --check` passa nos dois `.mjs`
  e `bash -n` no `.sh`.
- **Anotação:** os hooks foram copiados dos do Claude Code e ainda citam "Claude Code" nos
  comentários e na marca da frente (`exigir-reserva.mjs`); `hooks.json` usa caminho absoluto
  de `C:\fontes\REA-APP-CLONES`. Não mexido: fora do pedido.

### CAMINHO.3 — Fim de linha LF nos hooks do Codex

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — 1 linha num arquivo de configuração · **Modelo:** Claude Code Haiku 5.5. Pega
- **JEV-AI-SUGGESTION:** NAO
  por Opus 5.5 a pedido direto do usuário (o `pre-commit` só avisou, por ser mais leve).
- **Pedido:** "aceito" (2026-10-16 19:53), resposta à sugestão feita na entrega da CAMINHO.2.
- **Critérios de Aceitação:** `git check-attr eol .codex/hooks/sincronizar-main.sh` responde `lf`.
- **Descrição:** sem a regra, um clone com `core.autocrlf=true` grava o `.sh` em CRLF e o bash
  quebra. Mesmo motivo da regra que já existe para `.claude/hooks/*`.
- **Entrega:** commit `feat(CAMINHO.3)`; os 3 hooks já estavam em LF no índice, então nada foi
  renormalizado.
- **Verificação:** `git check-attr eol` responde `lf` para os 3 arquivos de `.codex/hooks/`, e
  `git ls-files --eol` mostra `i/lf w/lf attr/text eol=lf`.

### Decisões

- 2026-10-16 16:33 · Claude Code (Opus 5.5) · A mesma quebra existe no `rules-ai/AGENTS.md` e nos
  `AGENTS.md`/`CLAUDE.md` dos `dashboard-ai-*`. Ficam fora desta tarefa: são outros projetos, e o
  usuário decide se corrige.
