---
name: proxima-task
description: Mostra o que fazer agora no quadro do projeto (tasks/STATUS.md) - frentes ativas (coluna "Em uso por") e o próximo passo de cada uma, as subtarefas livres para pegar por prioridade e o que está aguardando o usuário. Use quando perguntarem "qual a próxima tarefa?", "o que tem pendente?", "o que posso pegar?" ou "/proxima-task".
---

# Próxima tarefa (proxima-task)

Fonte das regras: `AGENTS.md` → `.claude/rules/tasks/` (quadro, reserva, ciclo). Esta skill só **lê**
o quadro; para pegar uma subtarefa, siga `.claude/rules/tasks/frentes-e-reserva.md`.

> Fonte única desta skill: `.agents/skills/proxima-task/SKILL.md`. As cópias em `.claude/`, `.grok/`
> e `.gemini/commands/` são geradas no commit — **não editar as cópias**.

## Processo

1. **Sincronizar:** `git fetch --all --prune` e `git pull --rebase origin main` (sem isso o quadro mente).
2. **Ler** `tasks/STATUS.md` e `tasks/RECADOS.md` (recados para você ou `todas`, principalmente
   avisos de quadro congelado).
3. **Frentes ativas** (não há tabela de frentes): cada nome que aparece na coluna "Em uso por"
   da tabela "📌 Tarefas", tirando o `(desde …)`, `—` e `🔒 Trava especial`. Para cada uma, abrir a
   etapa da subtarefa reservada e ler o `**Próximo passo:**` da seção dela. Marcar com ⭐ a frente
   atual (mesma IA/ambiente/branch desta sessão, se der para saber).
4. **Subtarefas livres agora** (tabela "📌 Tarefas"), na ordem 🔴 → 🟠 → 🟡 → 🟢 e, no empate, a
   ordem do quadro. Uma linha é livre quando:
   - não está em **negrito** (negrito = tarefa-mãe, não se reserva);
   - "Em uso por" = `—` (não reservada e sem `🔒 Trava especial`);
   - Status `⬜ Pendente`;
   - todas as dependências estão `✅` (procurar cada código na tabela; código que não aparece está
     concluído no histórico).
   🟢 Baixa só entra se o usuário tiver orientado. Marcar **(banco)** nas subtarefas de banco de
   dados — qualquer IA pode pegá-las; o acesso ao banco depende da sessão
   (`.claude/rules/multiplas-ias.md`).
   - **Nível:** ler o `- **Nível:**` da seção da subtarefa na etapa e mostrar `[LEVE]`, `[MEDIO]`
     ou `[PESADO]`. Sem o campo → `[sem nível]` (classificar com a skill `classificar-tarefa` antes
     de pegar).
   - **Filtro pela frente atual:** pela matriz da skill `classificar-tarefa`, mostrar as livres do
     **seu nível** (o máximo da sua linha); as de nível acima vão para "Livres para outra ferramenta"
     (não pegue); as mais leves só se não houver nenhuma do seu nível. Sem saber a frente atual, mostrar todas com o
     nível.
5. **Aguardando o usuário:** linhas `👀` e itens `👀` das etapas (aprovações, aceites).
6. **Mostrar** no formato abaixo. Não reservar nada sem o usuário pedir.

## Formato de saída

```
## 📌 Próximas tarefas

⭐ Frente atual: Claude Code (Opus 5.5) (local · main)
   Subtarefa: LOGIN.2 (ETAPA-003) · 🔄 Em execução
   ➡️ Próximo: validar o formulário de login...

🟢 Livres agora para você (por prioridade)
   🔴 LOGIN.3 [MEDIO] — Mensagens de erro do login (ETAPA-003)
   🟡 DOCS.1 [LEVE] — Instalação no README (ETAPA-004)
   🟡 CLIENTES.1 [PESADO] — Tabela de clientes (ETAPA-005) (banco)

🔒 Livres para outra ferramenta (nível acima do seu)
   🟡 CLIENTES.2 [PESADO] — Regras de acesso da tabela (ETAPA-005)

👀 Aguardando você
   CLIENTES.4 — aceite do usuário (ETAPA-005)
```

## Se algo faltar

- **Sem `tasks/STATUS.md`:** avisar que o quadro não foi encontrado.
- **Nenhuma frente ativa:** dizer isso e mostrar só as livres e as `👀`.
- **Nenhuma livre:** dizer o que está bloqueando (dependências, reservas ou trava especial).
