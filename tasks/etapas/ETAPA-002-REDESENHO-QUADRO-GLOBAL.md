## Etapa 002 — REDESENHO-QUADRO-GLOBAL: um quadro global e fim do sincronizar.mjs
**Tarefa:** REDESENHO-QUADRO-GLOBAL · **Pedido em:** 2026-10-31 · **Criada por:** Claude Code (Haiku 5.5)
**Pedido:** "sincronizar.mjs não vai mais existir, existirá apenas 1 quadro de tarefas global, que referencia as tarefas de cada projeto, em rules-local de cada projeto"
**Objetivo:** trocar o modelo atual (quadro dentro do `rules-ai` e distribuição por `sincronizar.mjs`) por um quadro global único e regras entregues pelo `rules-local` de cada projeto.

### Decisões do usuário (2026-10-31)
- Quadro global único em `C:\fontes\tasks\` (STATUS.md e etapas), referenciando as tarefas de cada projeto.
- As regras globais chegam às IAs pelo `rules-local` de cada projeto. Sem cópia automática para os caminhos globais de cada IA.

### Escopo
- Entra:
  - remover `scripts/sincronizar.mjs` do `rules-ai` e as menções nas 7 regras, nas 6 entradas de scripts e nos 4 pontos de `CONFLITOS.md`;
  - criar no `C:\fontes\tasks\STATUS.md` o índice único, com um link para o quadro de cada projeto;
  - garantir `rules-local` nos projetos que ainda não têm (hoje são 4 de 20 pastas com Git);
  - atualizar `regras/quadro-de-tarefas.md` e `regras/INDEX.md` para o modelo novo.
- Não entra: apagar o `.git` de nenhum projeto (fica para a etapa 001, REMOVER-GIT); mudar o formato das etapas; mexer no código dos projetos.

### Riscos
- **IAs fora dos projetos perdem as regras.** Gemini, Codex, Grok, Qoder, opencode, Devin, Kiro, Hermes e Kilo hoje recebem as regras pelos arquivos globais. Sem o `sincronizar.mjs`, só recebem se abrirem um projeto com `rules-local`. Plano B: manter uma cópia manual dos arquivos globais, atualizada por você ou por uma tarefa de conferência.
- **Perda de tarefas abertas.** Há cerca de 150 linhas abertas no `tasks/STATUS.md` do `rules-ai`. Elas precisam migrar para o quadro global antes de o quadro antigo sair.
- **Git do `rules-ai`.** O `sessao.mjs` dos projetos baixa as regras do GitHub, então o `rules-ai` precisa continuar publicado. Isso conflita com a etapa 001, se o `.git` dele for removido.
- **Ordem.** Não remover `sincronizar.mjs` antes de o `rules-local` estar presente em todos os projetos que hoje dependem dele.

### Subtarefas (ainda sem nível; quem classifica é o Jev)
- .1 — criar o índice do quadro global em `C:\fontes\tasks\STATUS.md` com links para cada projeto.
- .2 — migrar as linhas abertas do quadro do `rules-ai` para o quadro global (sem apagar histórico).
- .3 — instalar `rules-local` nos projetos que ainda não têm.
- .4 — remover `sincronizar.mjs` e as referências, e atualizar `quadro-de-tarefas.md` e `INDEX.md`.
- .5 — decidir o plano B para as IAs fora dos projetos (cópia manual ou tarefa de conferência).

### Decisões
- 2026-10-31: quadro global em `C:\fontes\tasks\`; regras pelo `rules-local` de cada projeto.

### Verificação
- `grep -r sincronizar regras scripts` no `rules-ai` não encontra nada, exceto notas de histórico.
- `C:\fontes\tasks\STATUS.md` lista cada projeto e o link para o quadro dele.
- Cada projeto com `rules-local` tem `VERSAO.md` atualizado.

### Próximo passo
Aguardar o "sim" do usuário ao plano (tarefa grande: muda o fluxo de regras de todas as IAs).
