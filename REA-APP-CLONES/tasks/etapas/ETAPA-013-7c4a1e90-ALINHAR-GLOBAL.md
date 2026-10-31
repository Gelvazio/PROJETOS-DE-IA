## Etapa 013-7c4a1e90 — ALINHAR: Alinhar as regras do REA às regras globais (`rules-ai`)

**Tarefa:** ALINHAR · **Pedido em:** 2026-10-16 · **Criada por:** Claude Code (Sonnet 5.5) (local · main)
**Pedido:** "C11 - rodar o graphify no início de toda conversa E ANALISAR O RELATÓRIO; C12 - SIM"
(alinhar as regras de cada projeto às decisões C1 a C11 de `C:\fontes\rules-ai\CONFLITOS.md`)
**Objetivo:** as regras do REA deixam de contradizer o global onde o usuário já decidiu.

### Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-16 | Valem as decisões C1 a C11 do `rules-ai`; o que diverge no REA muda: frase final (C1=A), nível "até o máximo" (C2=A), tabela "Frentes" (C3=A), ordem criar-publicar-assumir (C9), graphify só no início da conversa (C11) | Gelvazio | "C12 - SIM" |
| 2026-10-16 | Já iguais ao global e **não** mudam: ✅ movidas para `task_complete.md` (C4=B), exceção do navegador com liberação do usuário (C5=B) | Claude Code (Sonnet 5.5) | Conferido em `quadro.md` e `testes-validacao.md` |
| 2026-10-16 | Abertas só no quadro; a execução fica para a sessão do nível certo (ver Níveis) | Claude Code (Sonnet 5.5) | A trava do `pre-commit` e o `exigir-reserva` barram o nível errado |
| 2026-10-16 15:15 | Plano da ALINHAR.5 aprovado e execução liberada nesta sessão Sonnet, com `IA_SEM_TRAVA=1` nas reservas | Gelvazio | Resposta "SIM" ao resumo do plano (trava vira "até o máximo"; aviso se mais leve; fallback no inicializador) |

Referência do que o global manda: `C:\fontes\rules-ai\regras\` (`graphify.md`, `ciclo-da-task.md`,
`frentes-e-reserva.md`, `niveis-e-modelos.md`, `quadro-de-tarefas.md`).

### ALINHAR.1 — `graphify.md` segue o global (C11)

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — só 1 `.md` · **Modelo:** só Claude Code Haiku 5.5
- **Critérios de Aceitação:** texto igual em substância a `rules-ai/regras/graphify.md`; `INDEX.md` coerente.
- **Entrega:** commit `feat(ALINHAR.1)` · **Verificação:** conferido por leitura: `graphify.md` e a linha do `INDEX.md` seguem a regra global C11 (início da conversa, analisar o relatório). Feita por Claude Code (Sonnet 5.5) (local · main), com IA_SEM_TRAVA=1 a pedido do usuário ("SIM"), 2026-10-16.
- **JEV-AI-SUGGESTION:** NAO

### ALINHAR.2 — Frase final do REA (C1=A)

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — textos em até 3 `.md` · **Modelo:** só Claude Code Haiku 5.5
- **Critérios de Aceitação:** nenhuma ocorrência da frase antiga; a tela de pendentes continua
- **JEV-AI-SUGGESTION:** NAO
  antes da frase (exceção do REA em `git-quick.md`).
- **Entrega:** commit `feat(ALINHAR.2)` · **Verificação:** busca em `.claude/`, `.agents/` e `AGENTS.md`: nenhuma ocorrência da frase antiga; a tela de pendentes continua antes da frase. Feita por Claude Code (Sonnet 5.5) (local · main), com IA_SEM_TRAVA=1 a pedido do usuário ("SIM"), 2026-10-16.

### ALINHAR.3 — Ordem criar → publicar → assumir (C9) e tabela de frentes no texto (C3)

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — textos em 3 `.md`, sem lógica · **Modelo:** só Claude Code Haiku 5.5
- **Critérios de Aceitação:** os 3 arquivos trazem a ordem e a tabela de frentes; nada contradiz o global.
- **Entrega:** commit `feat(ALINHAR.3)` · **Verificação:** leitura dos 3 arquivos: ordem criar → publicar → assumir → pedir confirmação só se necessário em `ciclo-da-task.md`; tabela "🧭 Frentes de trabalho" em `quadro.md` e `frentes-e-reserva.md`, iguais ao global. Feita por Claude Code (Sonnet 5.5) (local · main), com IA_SEM_TRAVA=1 a pedido do usuário ("SIM"), 2026-10-16.
- **JEV-AI-SUGGESTION:** NAO

### ALINHAR.4 — Tabela "🧭 Frentes de trabalho" no `tasks/STATUS.md`

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — mexe no quadro lido por hooks, de 1 a 3 arquivos · **Modelo:** só Claude Code Sonnet 5.5
- **Depende de:** ALINHAR.3
- **Critérios de Aceitação:** `node --check` nos hooks; leitura simulada do `STATUS.md` ainda acha as linhas.
- **Entrega:** commit `feat(ALINHAR.4)` · **Verificação:** `node --check` nos 3 hooks; `inicializar-sessao.mjs` lê o novo `STATUS.md` (listou a reserva ALINHAR.4) e `conferir-nivel-reserva.mjs` saiu 0: a tabela de frentes não tem coluna "Status", então os hooks a ignoram. Feita por Claude Code (Sonnet 5.5) (local · main), com IA_SEM_TRAVA=1 a pedido do usuário ("SIM"), 2026-10-16.
- **JEV-AI-SUGGESTION:** NAO

### ALINHAR.5 — Nível "até o máximo do modelo" no REA (C2=A)

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — hooks e skills de reserva, mais de 3 arquivos ligados · **Modelo:** só Claude Code Opus 5.5 ou superior, ou Fable
- **Critérios de Aceitação:** Opus pode reservar MEDIO/LEVE só quando não houver do seu nível livre;
- **JEV-AI-SUGGESTION:** NAO
  a trava continua recusando Haiku em PESADO; textos sem "só o seu nível".
- **Entrega:** commit `feat(ALINHAR.5)` · **Verificação:** simulação com quadros de teste: Sonnet e Haiku em PESADO recusados (saída 1); Opus em LEVE/MEDIO e Sonnet em LEVE passam com aviso; Opus em PESADO passa; `inicializar-sessao.mjs` com só MEDIO livre oferece a mais leve ao Opus; `node --check` ok; `check:agentes` sem diferença. Feita por Claude Code (Sonnet 5.5) (local · main), com IA_SEM_TRAVA=1 a pedido do usuário ("SIM"), 2026-10-16.

### ALINHAR.6 — Aceite do usuário

**Próximo passo:** nenhum — concluída.

- **Nível:** — (usuário) · **Aceite:** Gelvazio, 2026-10-16: "Aceito o alinhamento (ALINHAR.6 e #202.5)."
- **Entrega:** commit `docs(board)` do aceite · **Verificação:** ALINHAR.1 a ALINHAR.5 ✅ no `task_complete.md`.
- **JEV-AI-SUGGESTION:** NAO
