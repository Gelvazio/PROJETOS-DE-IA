## Etapa 012 — PONTO-GLOBAL: mensagem `.` = liste as tarefas pendentes

**Tarefa:** PONTO-GLOBAL · **Pedido em:** 2026-10-17 13:51 · **Criada por:** Claude Code (Opus 5.5) (local · main)
**Pedido:** "sim, registre o . como regra global", depois de "Quer que eu registre o `.` como regra global?" (o `gerenciador-de-ia` já tinha essa regra no `CLAUDE.md`, seção 8).
**Objetivo:** em todos os projetos e IAs, a mensagem só com `.` lista as tarefas pendentes do quadro, sem começar nenhuma.

> 🌐 **GLOBAL:** conflito C30, decidido pelo usuário no pedido.

### Texto da regra (no fim de `regras/frentes-e-reserva.md`, sem mudar)

```markdown
## Gatilho `.` — liste as tarefas pendentes

- Mensagem do usuário **só com `.`** = "Liste as tarefas pendentes do quadro" (C30, 2026-10-17).
  Vale para todos os projetos e todas as IAs.
- A IA faz, nesta ordem: **1)** sincronizar com o remoto; **2)** ler o `STATUS.md`; **3)** mostrar
  em quadro (`exibicao-de-status.md`) as tarefas abertas: cada mãe primeiro, em negrito, e as
  subtarefas ⬜ 🔄 ⛔ 👀, com Tarefa, Título, Modelo, Depende de, Status e Em uso por; **4)** dizer
  qual é a próxima subtarefa livre do **seu** modelo, se houver.
- ⛔ O `.` **não** reserva, não executa e não muda nada (nem o quadro). Para pegar a próxima, o
  usuário manda `;`.
```

### PONTO-GLOBAL.1 — Regra global, conflito C30, status e sincronizador

**Próximo passo:** — (entregue).

- **Nível:** LEVE — só `.md` e rodar um script já existente.
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **Descrição:** (1) no fim de `regras/frentes-e-reserva.md`, uma linha em branco e o bloco acima;
- **JEV-AI-SUGGESTION:** NAO
  (2) em `CONFLITOS.md`, no fim da tabela "Decididos depois", a linha
  `| C30 | Gatilho `.` | ✅ Mensagem só com `.` = listar em quadro as tarefas pendentes e apontar a próxima livre do **seu** modelo, sem reservar nem mudar nada; regra em `regras/frentes-e-reserva.md`. Pedido do usuário em 2026-10-17 |`;
  (3) nova linha no topo de "O que mudou desde a última gravação" do `STATUS_PROJETO.md`;
  (4) `node scripts/sincronizar.mjs --aplicar` (regra global: o pedido autoriza levar às IAs) e
  conferir que `dist/REGRAS-GLOBAIS.md` contém "Gatilho `.`".
- **Critério de pronto:** os 3 arquivos com o texto exato; sincronizador sem erro.
- **Entrega (2026-10-17 13:52, Haiku · executor-leve; líder Opus 5.5):** `regras/frentes-e-reserva.md`, `CONFLITOS.md`, `STATUS_PROJETO.md`; `sincronizar.mjs --aplicar` sem erro (7 IAs gravadas; Claude Code igual).
- **Verificação (líder):** fim do `frentes-e-reserva.md` igual ao bloco desta etapa (comparação por script); `dist/REGRAS-GLOBAIS.md` contém o gatilho `.`.

## Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-17 13:51 | Mensagem só com `.` = listar as tarefas pendentes, sem começar nenhuma, em todos os projetos e IAs (C30) | Gelvazio | "sim, registre o . como regra global" |
| 2026-10-17 13:51 | Executada pelo líder Opus 5.5 com o agente Haiku (subtarefa LEVE) | Claude Code (Opus 5.5) | Fluxo de equipe de `niveis-e-modelos.md` (C22) |