# 🥇 Regra maior — modelo mais forte NUNCA pega tarefa de modelo mais fraco (C50)

> 🚫 **Também (C60):** o Opus NUNCA pega tarefa, só com pedido explícito do usuário — `opus-so-sob-pedido.md`.
> 🔒 **Também inviolável (C59):** 1 commit + 1 push na `main` por subtarefa entregue — `commit-por-subtarefa.md`.

> **Projeto no banco (C58):** no `rules-ai` (e no `aulasenai`, depois do corte) não existe `tasks/STATUS.md`, `task_complete.md`, `RECADOS.md` nem etapa em `.md`: onde esta regra os cita, vale a tabela `quadro_*` equivalente do Supabase (`quadro-de-tarefas.md`, "Cada informação em um lugar só"), lida com a chave `anon` e gravada só pelas RPC. A coluna Modelo conferida antes de reservar é a `modelo` de `quadro_tarefas`, e a RPC `reservar` também confere (C50). Nos projetos em `.md`, o texto abaixo vale como está.

Decidido em 2026-10-23 (C50, tarefa REGRA-MAIS-FORTE-NUNCA). **É a regra mais importante de todas:**
vale para **todas as IAs e todos os projetos** e vence qualquer outra regra, pedido, atalho ou
autorização. Detalhe dos níveis e da matriz: `niveis-e-modelos.md`.

## A regra

- ⛔ **NUNCA um modelo mais forte pega tarefa de um modelo mais fraco. NUNCA.**
- A ordem, do mais fraco para o mais forte, é a da matriz de `niveis-e-modelos.md`
  (no Claude Code: **Haiku → Sonnet → Opus 5.5+/Fable**; nas outras ferramentas, a coluna
  equivalente: rápido/Flash → principal/Pro → raciocínio/PESADO).
- Na prática:
  - **Opus 5.5+ / Fable** nunca pega subtarefa `LEVE` nem `MEDIO`.
  - **Sonnet** nunca pega subtarefa `LEVE`.
  - Vale também para o **líder** de uma equipe: o líder reserva, delega e valida (a conferência, o
    commit e o push da entrega são do Haiku, C41), mas
    **nunca executa** uma subtarefa `LEVE` ou `MEDIO` (nem a de fechamento, nem "porque é rápido").
    Editar o quadro para reservar ou entregar não é executar subtarefa.

## Sem exceção

- ❌ Nem "porque é mais rápido", nem "porque o modelo certo está sem crédito", nem com pedido ou
  autorização do usuário na conversa, nem pelo gatilho `;`.
- Sem o modelo certo disponível → a subtarefa **fica livre** e a IA avisa o usuário qual modelo
  pode pegá-la. Nunca rebaixar o nível nem "pegar para não parar".
- ⛔ Mudar o nível de uma subtarefa só para ela caber no modelo mais forte é a mesma infração.

## Como conferir

- Antes de reservar: a coluna **Modelo** da subtarefa no `tasks/STATUS.md` tem que ser o **seu**
  modelo. Se for de um modelo mais fraco que o seu → não reserva.
- Na revisão: toda linha em "Em uso por" tem que ter o modelo da coluna Modelo daquela linha.
