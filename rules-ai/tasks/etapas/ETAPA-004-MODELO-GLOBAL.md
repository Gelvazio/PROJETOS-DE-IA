## Etapa 004 — MODELO-GLOBAL: nunca executar tarefa que não é do seu modelo

**Tarefa:** MODELO-GLOBAL · **Pedido em:** 2026-10-16 22:48 · **Criada por:** Claude Code (Opus 5.5) (nuvem · ccr-3274812b-0nj48o)
**Pedido:** "Ajuste todas as tasks e o gerador de task global, pra que NUNCA EXECUTE TAREFA QUE NAO
E SEU MODELO, coloque isso em todas as tasks" (feito no aulasenai, tarefa #247, etapa 374-afb852cd)
**Objetivo:** cada IA só executa subtarefa do seu nível, nem acima nem abaixo, sem exceção; o
modelo fica gravado em toda tarefa (coluna Modelo + linha na etapa).

> 🌐 **GLOBAL:** vale para todos os projetos e IAs (decisão C22, que troca a C2 = A pela B).

### Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-16 22:53 | Q1 só o nível exato · Q2 acabam as exceções · Q3 coluna Modelo · Q4 a sessão Opus da #247 do aulasenai faz só esta regra | Gelvazio | Pedido do usuário (aulasenai #247) |

### MODELO-GLOBAL.1 — Regra global

**Próximo passo:** — (entregue).

- **Nível:** LEVE — só `.md` (feita pela sessão Opus autorizada só para esta regra, Q4).
- **Modelo:** só Haiku — nunca outro (exceção única do Q4, registrada acima).
- **Entrega:** `regras/niveis-e-modelos.md`, `frentes-e-reserva.md`, `ciclo-da-task.md`,
- **JEV-AI-SUGGESTION:** NAO
  `quadro-de-tarefas.md` (coluna Modelo obrigatória e linha `- **Modelo:**` no modelo da etapa);
  C2 → B e C22 no `CONFLITOS.md`. · **Verificação:** leitura dos 5 arquivos.

### MODELO-GLOBAL.2 — Levar aos outros projetos e às IAs

**Próximo passo:** 👀 o usuário roda `node scripts/sincronizar.mjs --aplicar` na máquina dele; os
quadros dos outros projetos recebem a coluna Modelo quando cada projeto alinhar (como a C12).

- **Nível:** Usuário.
- **Modelo:** Usuário.
- **JEV-AI-SUGGESTION:** NAO
