## Etapa 017-9b41c0de — NIVEL-DEEPSEEK: DeepSeek também pega tarefa `PESADO` (altera a C22)

**Tarefa:** NIVEL-DEEPSEEK · **Pedido em:** 2026-10-18 08:52 · **Criada por:** DeepSeek (Flash) (local · main)
**Pedido:** "mude a regra C22, e libere deepseek PESADO tambem".
**Objetivo:** a célula `PESADO` da linha **DeepSeek** deixa de ser `⛔` e passa a `✅`, e a frase
"`PESADO` é **só** do Claude Code com Opus 5.5+ ou Fable" deixa de ser exclusiva.

> 🌐 **GLOBAL:** altera a **C22** (que hoje diz "sem exceção"). Confirmação do usuário em
> 2026-10-18 08:52; registro em `CONFLITOS.md` como **C35**.

### Escopo

- **Entra:** linha do **DeepSeek** em `regras/niveis-e-modelos.md`; a frase do `PESADO`; **C35** no
  `CONFLITOS.md`; linha no Registro de decisões do `STATUS.md`.
- **Não entra:** a matriz ferramenta × modelo × nível da skill global `classificar-tarefa` nem a
  linha do **OpenCode** — ficam nas subtarefas .2 e .3 (entregues em 2026-10-18).

### Riscos

| Risco | Plano B |
|---|---|
| Modelo mais barato pegar `PESADO` e entregar fraco | O `PESADO` continua exigindo `effort high` e a **Verificação** na subtarefa; o DeepSeek declara o raciocínio equivalente (`esforco.md`) |
| Sobrar a regra antiga em outro arquivo | `grep DeepSeek regras/` conferido: só `niveis-e-modelos.md` (nível) e `esforco.md` (que trata de `effort`, não de nível) |

### Decisões

| Data | Decisão | Quem | Palavras |
|---|---|---|---|
| 2026-10-18 08:52 | DeepSeek passa a pegar `PESADO` (C35, altera a C22) | Gelvazio | "mude a regra C22, e libere deepseek PESADO tambem" |

### NIVEL-DEEPSEEK.1 — Regra: `PESADO` liberado para o DeepSeek

**Próximo passo:** editar `regras/niveis-e-modelos.md` (linha DeepSeek e frase do `PESADO`) e registrar a C35 no `CONFLITOS.md`.

- **Nível:** PESADO — muda regra global de todas as IAs (mesmo precedente da HERDR-GLOBAL.1).
- **Modelo:** DeepSeek (raciocínio) ou Claude Code Opus 5.5+ / Fable.
- **Effort:** high.
- **Descrição:** trocar `| **DeepSeek** | Flash | raciocínio | ⛔ |` por `✅`; ajustar a frase do
- **JEV-AI-SUGGESTION:** NAO
  `PESADO` para "`PESADO` exige Claude Code Opus 5.5+/Fable **ou** DeepSeek (raciocínio)"; manter
  intacta a C22 na parte que proíbe pegar nível **acima do seu** para os outros modelos.
- **Critérios de Aceitação:** a linha DeepSeek tem `✅` na coluna `PESADO`; nenhum arquivo de
  `regras/` afirma que `PESADO` é exclusivo de Opus/Fable; C35 no `CONFLITOS.md`;
  `node scripts/sincronizar.mjs` (simulação) aplica sem erro.

### NIVEL-DEEPSEEK.2 — Matriz da skill `classificar-tarefa` (✅ 2026-10-18)

**Entregue:** a skill global `~/.agents/skills/classificar-tarefa/SKILL.md` foi alinhada à C35
(DeepSeek `✅` em `PESADO`) e propagada para as 4 cópias globais do Claude Code (`.claude`,
`-contaA`, `-contaB`, `-contaC`).

- **Nível:** LEVE — só `.md`.
- **Modelo:** até Haiku/Flash.
- **Critérios de Aceitação:** a matriz da skill mostra DeepSeek em `PESADO`. ✅
- **JEV-AI-SUGGESTION:** NAO

### NIVEL-DEEPSEEK.3 — OpenCode na matriz, com os modelos DeepSeek (✅ 2026-10-18)

**Pedido:** "adicione na lista de IA que pode assumir tasks, no classificador, o opencode com os
modelos da deepseek" (Gelvazio, 2026-10-18 12:14). Registro em `CONFLITOS.md` como **C37**.

- **Nível:** LEVE — só `.md`.
- **Descrição:** linha **OpenCode** na matriz das regras globais (`regras/niveis-e-modelos.md`) e na
- **JEV-AI-SUGGESTION:** NAO
  matriz da skill `classificar-tarefa`:
  `LEVE` = `deepseek-flash` · `MEDIO` = `deepseek-flash` com thinking ·
  `PESADO` = `deepseek-v4-pro`.
- **Critérios de Aceitação:** a linha OpenCode aparece nas duas matrizes; `node
  scripts/sincronizar.mjs --aplicar` leva o texto aos arquivos globais de todas as IAs. ✅

---

### Entregas desta etapa

| Subtarefa | Commit | Verificação |
|---|---|---|
| NIVEL-DEEPSEEK.1 | `feat(NIVEL-DEEPSEEK.1)` | linha DeepSeek com `✅` em `PESADO`; frase do `PESADO` atualizada; C35 no `CONFLITOS.md` |
| NIVEL-DEEPSEEK.2 | `docs(NIVEL-DEEPSEEK.2)` | matriz da skill com DeepSeek `✅` em `PESADO`; 4 cópias globais atualizadas |
| NIVEL-DEEPSEEK.3 | `docs(NIVEL-DEEPSEEK.3)` | linha **OpenCode** nas duas matrizes (C37); `sincronizar.mjs --aplicar` aplicado |
