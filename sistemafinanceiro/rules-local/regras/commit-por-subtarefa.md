# 🔒 Regra inviolável — 1 commit + 1 push na `main` por subtarefa entregue (C59)

Decidida em 2026-11-01 (C59; pedido do usuário: "essa regra nunca pode ser quebrada"). Vale para
**todas as IAs e todos os projetos**, com o quadro em `.md` **ou no banco**, e vence qualquer
atalho, pressa, gatilho (`;`) ou ordem de equipe/agente. Detalhe do Git: `git-geral.md`; entrega
da subtarefa: `ciclo-da-task.md` e `frentes-e-reserva.md`.

## A regra

- ⛔ **Nenhuma subtarefa é entregue sem o seu commit e o seu push na `main`.** Uma subtarefa
  entregue = **1 commit + 1 push**, feitos **na hora**, antes de qualquer outra coisa.
- ⛔ Não juntar duas subtarefas num commit, não deixar entrega para "commitar depois", não
  entregar em lote. Perguntar ao usuário se pode commitar também é infração: commit e push saem
  sem perguntar.
- ✅ Vale também para o agente de equipe: o executor não commita, mas o **líder só considera a
  subtarefa entregue** depois do commit e do push dela (na equipe do Claude Code, quem confere,
  commita e dá o push é o Haiku, C41).

## Com o quadro no banco (C58)

A ordem é **sempre** esta:

1. **Conferir** a entrega (verificação).
2. **Commit** dos arquivos da subtarefa, com o código da subtarefa na mensagem.
3. **Push** na `main`.
4. **Só então** a RPC `entregar` (com o hash do commit na entrega).

- A RPC `entregar` **não substitui** o commit: o banco guarda a reserva e a entrega, o Git guarda
  o histórico.
- **Subtarefa sem arquivo mudado** (ensaio, tag, conferência, chamada de API): faz-se um
  `git commit --allow-empty` com o código da subtarefa e o que foi feito, e o push, antes do
  `entregar`.
- A mensagem leva o código da subtarefa e a frente: `feat(<TAREFA>.<n>): <o que mudou> por <frente>`.

## Como conferir

```
☐ O commit da subtarefa existe e tem o código dela na mensagem?
☐ O push foi feito (git log origin/main mostra o commit)?
☐ Só depois disso a subtarefa foi marcada entregue (✅ no .md, ou RPC `entregar` no banco)?
☐ Uma subtarefa por commit (nada de duas entregas juntas)?
```

Push recusado por conflito: `git pull --rebase` e push de novo; nunca `--force`.
