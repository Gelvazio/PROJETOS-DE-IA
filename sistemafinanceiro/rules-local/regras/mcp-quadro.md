# 🔌 Fila por MCP — o quadro é a fonte; o MCP só lê e escreve nele (C40)

Decidido em 2026-10-18 (C40, etapa 026, tarefa MCP-QUADRO). Pedido do usuário em 2026-10-18 16:19
("sim" ao plano). Vale para **todas as IAs e todos os projetos**. Esta regra não muda o quadro,
a reserva, os níveis nem o ciclo da tarefa: quem manda neles são `quadro-de-tarefas.md`,
`frentes-e-reserva.md`, `niveis-e-modelos.md`, `ciclo-da-task.md` e `regra-maior.md`.

## O que é

- Um servidor MCP **local** (stdio, JSON-RPC 2.0), sem dependência npm, na pasta `mcp/` do
  `rules-ai`. Dá às IAs a experiência de fila: puxar a próxima subtarefa, reservar e entregar.
- Três ferramentas: `task_list` (só lê), `task_next` (reserva uma subtarefa) e `task_finish`
  (entrega uma subtarefa).
- **Fonte única:** `tasks/STATUS.md`, `tasks/task_complete.md` e a seção da subtarefa na etapa.
  Nada de banco, Supabase, tabela, cópia da fila, painel ou worker.
- Enquanto o servidor não estiver instalado, esta regra não muda nada: quem não usa o MCP segue o
  fluxo manual de `frentes-e-reserva.md`.

## Regras

- ✅ **Reserva = commit + push.** `task_next` grava "Em uso por" e 🔄 na linha, faz o commit
  `lock: assumindo sub-task <COD> por <frente>` e dá push. O push é a trava.
- ✅ Push recusado → `git pull --rebase`, conferir que a linha continua livre e tentar de novo,
  **no máximo 3 vezes**.
- ✅ Quadro com alteração não commitada → `task_next` recusa e não toca em nada.
- ✅ `task_next` devolve só subtarefa **livre**, com dependências ✅ e **do nível do modelo de quem
  chama** (`niveis-e-modelos.md`). Sem subtarefa desse nível → lista vazia com o motivo, sem alterar
  o quadro.
- ✅ `task_finish` só entrega reserva da **própria** frente. Move a linha para `task_complete.md`
  (movida, não copiada: C4), anota a entrega na seção da subtarefa e faz um commit
  `feat(<COD>): ... por <frente>` + push.
- ✅ Quando a última subtarefa fecha, o MCP só **sinaliza** que a mãe pode fechar. Quem move a mãe
  é o agente (C4).
- ✅ `--dry-run` lista sem reservar e não altera nenhum arquivo.
- ✅ Falha no meio nunca deixa o quadro pela metade: a escrita vai para um arquivo temporário e só
  troca o original no fim; em erro, restaura o arquivo.

## O que o MCP nunca faz

- ⛔ Criar tarefa-mãe ou subtarefa (C26: a subtarefa nasce pela IA, no quadro).
- ⛔ Mudar nível, modelo, prioridade ou dependência, nem escolher nível (C22, C35; a classificação
  é do Jev, C47).
- ⛔ Aprovar plano, responder permissão ou disparar sessão (C32; `gerenciador-centralizado.md`).
- ⛔ Usar `--force`, `merge`, `rebase -i` ou `reset --hard` no Git.
- ⛔ Escrever fora de `tasks/STATUS.md`, `tasks/task_complete.md` e da seção da própria subtarefa em
  `tasks/etapas/`. Nunca `.env`, `.git/config` nem código do projeto.
- ⛔ Listar ou ler `DEMAIS-PROJETOS-*` e pastas ocultas (C20, C23).

## Limites

- Transporte local e sem token na v1. Sem rede, `task_next` recusa e avisa; o agente não força nada.
- O log local (`mcp/saidas/`, fora do Git) guarda ferramenta, projeto, código, commit e resultado.
  Nunca guarda segredo nem o conteúdo da tarefa.
- O MCP obedece ao quadro, e não o contrário: se o formato ou a regra de reserva mudar, muda a
  regra escrita, e o MCP acompanha.
