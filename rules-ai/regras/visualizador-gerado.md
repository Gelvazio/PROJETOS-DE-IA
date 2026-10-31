# 👁️ Visualizador gerado — só com pedido explícito, só no local (C45)

Decidido em 2026-10-22 (C45, tarefa VISUALIZADOR-SO-PEDIDO). Vale para **todos os projetos e
todas as IAs**. A regra do projeto só pode **acrescentar** (ex.: o comando do gerador), não
contradizer.

## O que é

- **Visualizador gerado:** página montada por um script a partir das regras e do quadro e
  **commitada** no repositório (ex.: `.claude/rules/index.html` do `aulasenai`, gerado por
  `scripts/regras/gerar_visualizador_regras.py`).
- **Por quê:** cada regeneração muda um arquivo grande do site; o push vira um deploy novo na
  Vercel (o filtro de deploy só ignora o que é só `tasks/`) e enche o armazenamento de deploys,
  além de gerar conflito entre frentes.

## Regra

- ⛔ **Nunca regenerar por conta própria:** nem no fim da tarefa, nem na reserva, na criação de
  tarefa ou subtarefa, no `verify`, ao mudar uma regra ou para resolver conflito.
- ✅ **Só com pedido explícito do usuário** na conversa ("gere o visualizador", "atualize o
  `index.html` das regras"), e **só no Claude Code local** (máquina do usuário).
- ⛔ **Nunca na nuvem** (Claude Code na nuvem e qualquer IA de nuvem), nem com pedido: avisar o
  usuário que a geração é feita só no local.
- ✅ O visualizador pode ficar **desatualizado** entre um pedido e outro: a fonte é sempre o
  `.md` (regras e `tasks/STATUS.md`).
- **Conflito** no arquivo gerado ao sincronizar: ficar com a versão do remoto
  (`git checkout --ours -- <arquivo>` durante o `pull --rebase`) e seguir; não regenerar.
- Visualizador que **lê os `.md` ao abrir** (sem gerador nem arquivo gerado, como o do
  `dashboard-ai` e o do `REA-APP-CLONES`): não há o que regenerar; esta regra não muda nada nele.
