## Etapa 003-14b8cb75 — TEMPLATE: Colocar o repositório no padrão do template de IA

**Tarefa:** TEMPLATE · **Pedido em:** 2026-10-14 09:15 · **Criada por:** Claude Code (Opus 5.5) (local · main)
**Pedido:** "LEIA A PASTA DE TEMPLATE QUE ADICIONEI ACIMA E VEJA SE ESTE REPO ESTA NO PADRAO DE TEMPLATE
DE IA, SE NAO ESTIVER, COLOQUE ELE NESTE PADRAO" (template em `C:\fontes\template-inicial-tasks-ia`)
**Objetivo:** ter aqui as mesmas regras, quadro, skills, agentes e hooks do template.

### Escopo

- **Entra:** todos os arquivos versionados do template (regras, skills, agentes, hooks do Claude e
  do Git, `scripts/`, `package.json`, `.gitattributes`, `index.html`, `guia/`), adaptados ao projeto;
  migração do `STATUS.md` antigo; instalação dos hooks neste clone.
- **Não entra:** `.git`, `docs/` (vazio), `.vscode/` e o histórico do próprio template (etapas 001 e
  002 e as concluídas dele).
- **Pronto quando:** `npm run check:agentes` passa, hooks instalados, quadro só em `tasks/` e o
  usuário aceita.

### Riscos

- O hook `exigir-reserva` bloqueia edição fora de `tasks/` sem subtarefa 🔄 reservada — esperado.

### Decisões

- 2026-10-14 09:23 — Plano aprovado por Gelvazio: "SIGA O TEMPLATE EM TUDO" (inclusive push
  automático na reserva e na entrega).
- 2026-10-14 09:23 — Histórico alinhado por rebase, não merge (o template proíbe `git merge`).
- 2026-10-14 09:23 — Ordem ajustada: a migração do quadro (TEMPLATE.4) vem antes da cópia, porque
  a reserva precisa do quadro em `tasks/`.

### TEMPLATE.1 — Alinhar o histórico local ao `origin/main` (rebase)

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — reescreve commits locais ainda não publicados
- **Descrição:** `git fetch --all --prune` + `git rebase origin/main` dos 3 commits locais.
- **Entrega:** histórico `7428e62` → `29f517e` → `cc70960` · **Verificação:** depois do rebase,
- **JEV-AI-SUGGESTION:** NAO
  `git diff b738a12 HEAD --stat` mostrou só `LICENSE` e `README.md` (vindos do GitHub). O commit
  das ferramentas foi desfeito depois (GHIDRA.3).

### TEMPLATE.2 — Copiar os arquivos versionados do template

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO
- **Critérios de Aceitação:** todos os arquivos do template presentes (menos os excluídos).
- **Entrega:** commit `feat(TEMPLATE.2)` · **Verificação:** 61 arquivos do `git ls-files` do template
- **JEV-AI-SUGGESTION:** NAO
  (sem `tasks/`, `README.md` e `LICENSE`, que são do projeto) conferidos no destino: 61 de 61.
- **Anotação:** o `.gitignore` e o `.gitattributes` vieram do template por cima dos daqui; a união
  com as regras do projeto (`/*.exe`, `/*.dll`, `tools/`) é a TEMPLATE.3.

### TEMPLATE.3 — Adaptar o template a este projeto

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO
- **Descrição:** `package.json` com nome `rea-app-clones`; `REPOSITORIO = "Gelvazio/rea-app-clones"`
- **JEV-AI-SUGGESTION:** NAO
  no `visualizador/fonte.js`; `.gitignore` do template + regras do projeto (`/*.exe`, `/*.dll`,
  `tools/`); `.gitattributes` do template mantido (o LFS saiu junto com o `tools/`); `README.md` do
  projeto apontando para o `README_pt-BR.md` do REA, o `AGENTS.md` e o quadro. O selo
  `template-inicial-tasks-ia` do `index.html` ficou, porque a página explica o template de origem.
- **Critérios de Aceitação:** `npm run check:agentes` passa; `git ls-files --eol .githooks` = `lf`.
- **Entrega:** commit `feat(TEMPLATE.3)` · **Verificação:** `npm run check:agentes` = 0
  desatualizados; hooks do Git e do Claude com `i/lf w/lf`; `git check-ignore tools` confirma o
  ignore.

### TEMPLATE.4 — Migrar o `STATUS.md` antigo da raiz para `tasks/`

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE
- **Descrição:** itens 1.x viram a ETAPA-001, itens 2.x a ETAPA-002; concluídos no
- **JEV-AI-SUGGESTION:** NAO
  `task_complete.md`; JDK pendente vira GHIDRA.4 (👀).
- **Critérios de Aceitação:** nenhum item do quadro antigo perdido.
- **Entrega:** commit `docs(TEMPLATE.4)` · **Verificação:** os 6 itens antigos (1.1, 2.1–2.6) conferidos
  um a um nas etapas 001 e 002 (2.3 + 2.6 = GHIDRA.3).

### TEMPLATE.5 — Instalar os hooks do Git neste clone

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE
- **Critérios de Aceitação:** `git config --get core.hooksPath` = `.githooks`.
- **Entrega:** commit `docs(TEMPLATE.5)` (só o quadro; hooks vivem na config local do clone) ·
- **JEV-AI-SUGGESTION:** NAO
  **Verificação:** `core.hooksPath=.githooks` e `pull.rebase=true`.

### TEMPLATE.6 — Aceite do usuário

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE
- **Critérios de Aceitação:** critérios de pronto da etapa conferidos e aceite do usuário.
- **Entrega:** commit `docs(TEMPLATE.6)` · **Verificação:** `npm run check:agentes` = 0
- **JEV-AI-SUGGESTION:** NAO
  desatualizados; `core.hooksPath=.githooks`; sem `STATUS.md` na raiz (quadro só em `tasks/`);
  os commits locais anteriores já estavam no `origin/main` (só faltava o da reserva).
- **Anotação:** aceite em 2026-10-14 09:36 por Gelvazio: "faca a 6 template".
