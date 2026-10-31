## Etapa 058-3c9e7a14 — GATILHO-PONTOVIRGULA-UPDATE: o `;` atualiza os projetos locais antes de pegar tarefa

**Tarefa:** GATILHO-PONTOVIRGULA-UPDATE · **Pedido em:** 2026-10-26 · **Criada por:** Claude Code (Sonnet 5.5) (local · main · rules-ai)
**Pedido:** "adicione 1 comando ;, ponto e virgula, ao receber ele, execute a atualizacao local de projetos sempre, referente a pasta raiz fontes" → "apenas em pc local"
**Objetivo:** ao receber só `;`, a IA primeiro roda `scripts/UPDATE.py` (pull nos repositórios de `C:\fontes`) e depois segue o gatilho de pegar a próxima tarefa (C24); na nuvem não roda.

### Decisões

- 2026-10-26: o `;` já era "pegue a próxima tarefa" (C24). A pergunta de como conciliar ficou sem resposta direta; a IA adotou a opção que não tira nada do usuário: **atualizar e depois pegar tarefa**. Se o usuário quiser o `;` só atualizando, é uma nova decisão.
- Só em **PC local** (`C:\fontes` existe); na nuvem o passo é pulado, sem erro.

### GATILHO-PONTOVIRGULA-UPDATE.1 — Acrescentar a atualização local ao gatilho `;`

**Próximo passo:** nenhum. Entregue.

- **Nível:** LEVE — classificado (sinais)
- **Modelo:** só Haiku 5.5 ou DeepSeek V4.1 Flash — nunca outro
- **Effort:** low
- **Fonte:** sinais
- **Descrição:** em `regras/frentes-e-reserva.md`, o passo 0 do gatilho `;`: no PC local, rodar `python C:\fontes\rules-ai\scripts\UPDATE.py` (ignora `rules-ai` e `DEMAIS-PROJETOS-*`); mostrar o resultado em quadro; conflito de rebase é relatado, sem escolher lado. Regerar `dist/` e `VERSAO.md`.
- **Critérios de Aceitação:** regra escrita com "só PC local"; `dist/` regerado; decisão C56 no `STATUS.md`.
- **JEV-AI-SUGGESTION:** NAO
- **Entrega:** `2508a76` (reserva), commit da regra em `regras/frentes-e-reserva.md` (passo 0 do `;`) e commit de fechamento · **Verificação:** `grep` do passo 0 em `regras/frentes-e-reserva.md`; `scripts/sincronizar.mjs` (sem `--aplicar`) regerou `dist/REGRAS-GLOBAIS.md` com `UPDATE.py` (contagem 1) e `VERSAO.md` 2026-10-26-15740d51.
