# 🤖 AGENTS.md — Porta de entrada para todas as IAs

<!-- rules-ai:global -->
> 🌐 **Regras globais:** além das regras deste arquivo, valem as regras globais de
> `C:\fontes\rules-ai` (`regras/*.md`, entregues a cada IA pelo arquivo global dela). Em divergência,
> a regra deste projeto prevalece, e o usuário decide o que fazer com cada divergência
> (`rules-ai/CONFLITOS.md`). Ao finalizar uma tarefa: commit + push.


Vale para **todas as IAs** (Claude, Gemini, Grok, Copilot, Codex, Cursor, Devin, DeepSeek,
Antigravity etc.). Este arquivo **não repete regras**: ele diz onde cada uma está. Cada regra existe
em **um arquivo só**, dentro de [`.claude/rules/`](.claude/rules/INDEX.md).

- **Regra nova pedida pelo usuário** → vai para o arquivo do assunto em `.claude/rules/` (veja o
  [`INDEX.md`](.claude/rules/INDEX.md)). Pedido para "salvar no `CLAUDE.md`" (ou `GEMINI.md`,
  `.cursorrules`, `copilot-instructions.md`…) significa salvar lá. Arquivos de uma IA só apenas
  apontam para este `AGENTS.md`.
- **Tarefas** ficam no quadro [`tasks/STATUS.md`](tasks/STATUS.md) (etapas em
  [`tasks/etapas/`](tasks/etapas/)). Nunca neste arquivo e nunca em `docs/`.
- Antes de informar o status, a conclusão ou as dependências de uma tarefa, consulte tanto o
  [`tasks/STATUS.md`](tasks/STATUS.md) quanto o [`tasks/task_complete.md`](tasks/task_complete.md).
  Se a tarefa não estiver no quadro ativo, confira as concluídas antes de dizer que está pendente.

## ⛔ Antes de qualquer tarefa, leia (nesta ordem)

| # | Arquivo | O que define |
|---|---------|--------------|
| 1 | [`.claude/rules/essentials.md`](.claude/rules/essentials.md) | Sincronizar, o que ler, checklist de início |
| 2 | [`.claude/rules/git-quick.md`](.claude/rules/git-quick.md) | Tudo na `main`, hooks, commits, proibições |
| 3 | [`.claude/rules/tasks/quadro.md`](.claude/rules/tasks/quadro.md) | Onde fica cada informação; tarefa × subtarefa |
| 4 | [`.claude/rules/tasks/frentes-e-reserva.md`](.claude/rules/tasks/frentes-e-reserva.md) | Pegar e reservar subtarefa, prioridade, limites |
| 5 | [`.claude/rules/tasks/ciclo-da-task.md`](.claude/rules/tasks/ciclo-da-task.md) | Abrir, plano na etapa, executar, encerrar, retomar |
| 6 | [`.claude/rules/multiplas-ias.md`](.claude/rules/multiplas-ias.md) | **Nível** de cada subtarefa e quem pode pegar (matriz na skill [`classificar-tarefa`](.agents/skills/classificar-tarefa/SKILL.md)), tarefa de banco (produção exige autorização do usuário), trava especial, tamanho das subtarefas |
| 7 | [`.claude/rules/testes-validacao.md`](.claude/rules/testes-validacao.md) | Nunca abrir navegador; nunca escrever testes (exceto bug) |
| 8 | [`.claude/rules/codigo-solid.md`](.claude/rules/codigo-solid.md) e [`codigo-limites-nomes.md`](.claude/rules/codigo-limites-nomes.md) | Como escrever código |

Skills do fluxo: [`proxima-task`](.agents/skills/proxima-task/SKILL.md),
[`classificar-tarefa`](.agents/skills/classificar-tarefa/SKILL.md) e
[`liderar-equipe`](.agents/skills/liderar-equipe/SKILL.md). Fonte única em `.agents/skills/` e
`.agents/agents/` (Codex, Antigravity, Cursor e Copilot leem direto); cópias geradas por
`npm run sync:agentes` em `.claude/`, `.grok/` e `.gemini/commands/` — não editar as cópias
(tabela por IA no [`README.md`](README.md#comandos-skills-em-cada-ia)).

**Se uma regra daqui parecer contradizer outra, vale a do arquivo do assunto; avise o usuário.**

<!-- rules-local:inicio -->
## Regras globais (rules-local)

No início da sessão, antes do primeiro pedido, rode na raiz do projeto:

```
node rules-local/sessao.mjs
```

Leia as linhas que começam com `rules-local:`:

- `versão igual`, `sem acesso`, `nuvem inconsistente` ou `outra sessão`: siga o pedido.
- `DISPARAR A SINCRONIZAÇÃO DE TASKS`: faça a sincronização de tasks antes do pedido, como manda
  `rules-local/regras/rules-local.md`.

Não edite a pasta `rules-local/` à mão. Ela é gerada pelo script.
<!-- rules-local:fim -->
