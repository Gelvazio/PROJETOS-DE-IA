# ⚡ Essentials — Checklist de início de sessão

**Abra SEMPRE ao iniciar.** Índice completo das regras: `INDEX.md`.

## 1. Sincronizar

Trazer a `main` antes de ler qualquer coisa: `git fetch --all --prune` + `git pull --rebase origin
main` (comandos, hooks e proibições: `git-quick.md`).

## 2. Ler, nesta ordem

⛔ **Antes de tudo**, leia `tasks/STATUS_TAREFAS_ANDAMENTO.md` e depois
`tasks/PROMPT_PARA_O_LIDER.md`, e siga o que os dois mandam (status das tarefas em andamento
da equipe e as ordens do líder).

| Arquivo | Para quê |
|---------|----------|
| `tasks/STATUS_TAREFAS_ANDAMENTO.md` | 1º: tarefas em andamento da equipe — retomar daí |
| `tasks/PROMPT_PARA_O_LIDER.md` | 2º: ordens do líder da equipe — seguir |
| `AGENTS.md` | Porta de entrada: lista das regras (precedência máxima) |
| `tasks/STATUS.md` | Quadro: frentes, tarefas, subtarefas e reservas (`tasks/quadro.md`) |
| Etapa da sua subtarefa | Próximo passo — retomar de onde parou (`tasks/ciclo-da-task.md`) |
| `tasks/RECADOS.md` | Recados de outras frentes para você ou `todas` |
| `docs/` | Documentação do que vai editar (se existir para o arquivo ou módulo) |

## 3. Checklist

```
☐ Li o tasks/STATUS_TAREFAS_ANDAMENTO.md e o tasks/PROMPT_PARA_O_LIDER.md e vou seguir os dois?
☐ Hooks instalados neste clone (git config --get core.hooksPath = .githooks)?
☐ Trouxe a main (fetch + pull --rebase)?
☐ Li o STATUS.md, a etapa da minha subtarefa e os recados?
☐ A subtarefa está livre, com dependências ✅ e sem trava especial?
☐ Se for tarefa de banco, eu tenho como falar com o banco nesta sessão (multiplas-ias.md)?
☐ Sei se a tarefa é pequena ou grande (tasks/ciclo-da-task.md)?
☐ Vou consultar o grafo (graphify-out/) antes de responder sobre o projeto (graphify.md)?
```

---

**Data e hora:** sempre de Brasília. No Windows local, `date` ou `Get-Date` (o relógio já está em
Brasília) — `TZ=America/Sao_Paulo date` no Git Bash sai em UTC (3 h a mais). Na nuvem:
`TZ=America/Sao_Paulo date`.
