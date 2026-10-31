## Etapa 022-7c4e2b19 — NIVEL-QODER: Qoder na matriz de níveis (igualar regras globais e skill)

**Tarefa:** NIVEL-QODER · **Pedido em:** 2026-10-18 12:59 · **Criada por:** DeepSeek Harness (deepseek-flash) (local · main)
**Pedido:** "resolva o C38" (origem: "adicione na lista de IA que pode assumir tasks, no classificador, o opencode com os modelos da deepseek" — a skill já listava Qoder, as regras globais não).
**Objetivo:** a matriz ferramenta × modelo × nível de `regras/niveis-e-modelos.md` ganha a linha **Qoder**
(`✅` em `LEVE` e `MEDIO`, `⛔` em `PESADO`), igualando a matriz da skill global `classificar-tarefa`.

> 🌐 **GLOBAL:** mudança na tabela do usuário; registro em `CONFLITOS.md` como **C38**.

### Escopo

- **Entra:** linha **Qoder** em `regras/niveis-e-modelos.md`; **C38** no `CONFLITOS.md`; linha no Registro
  de decisões do `STATUS.md`; `VERSAO.md` e `dist/` regerados por `sincronizar.mjs --aplicar`.
- **Não entra:** outras linhas da matriz (OpenCode e DeepSeek já entregues na etapa 017).

### Decisões

| Data | Decisão | Quem | Palavras |
|---|---|---|---|
| 2026-10-18 12:59 | Qoder entra na matriz das regras globais (C38) | Gelvazio | "sim,faca isso" |

### NIVEL-QODER.1 — Linha Qoder na matriz das regras globais

- **Nível:** LEVE — só `.md`.
- **Modelo:** até Haiku/Flash.
- **Descrição:** inserir `| **Qoder** | ✅ | ✅ | ⛔ |` depois da linha `Codex / Cursor`.
- **Critérios de Aceitação:** a linha Qoder existe na matriz; a C38 está no `CONFLITOS.md`;
- **JEV-AI-SUGGESTION:** NAO
  `node scripts/sincronizar.mjs --aplicar` leva o texto aos arquivos globais de todas as IAs. ✅

---

### Entregas desta etapa

| Subtarefa | Commit | Verificação |
|---|---|---|
| NIVEL-QODER.1 | `docs(NIVEL-QODER.1)` | linha Qoder na matriz; C38 no `CONFLITOS.md`; `VERSAO.md` regerada e sincronizada |
