# 🕸️ graphify — grafo de conhecimento do projeto

Decidido em 2026-10-16 (C11) e mudado em 2026-10-17 (C25). Vale para todos os projetos e todas
as IAs; a regra do projeto só pode **acrescentar** (ex.: onde fica o comando), não contradizer.

**Comando:** o do `AGENTS.md`/`CLAUDE.md` do projeto; sem ele,
`C:\Python314\python.exe -m graphify update .` na raiz do projeto (na nuvem, `python3 -m graphify
update .`). Sem perguntar.

## Quando ler o `graphify-out/GRAPH_REPORT.md`

- ✅ **Antes de criar uma tarefa** e **antes de executar uma tarefa** (cada subtarefa reservada):
  ler e analisar o relatório do projeto ativo e usar o que for relevante (comunidades, nós
  principais, arquivos e relações) para achar os arquivos e entender o que a tarefa afeta.
- ✅ Também antes de responder sobre arquitetura, arquivos e relações; citar o arquivo de origem
  e dizer o que o grafo não cobre.
- Perguntas triviais (sintaxe, uma linha já aberta na conversa) dispensam a leitura.

## Quando atualizar o grafo

- ✅ **No início de cada conversa nova**, uma vez, antes do primeiro pedido (relatório em dia).
- ✅ **Ao fim de cada tarefa**: quando a tarefa fica **completa e é retirada do quadro** (linha da
  mãe ✅ movida para o `task_complete.md`), depois do commit + push da entrega, rodar o comando
  acima. Subtarefa entregue com a mãe ainda aberta não roda.
- ⛔ Fora desses momentos, não rodar (nem a cada commit ou pedido).

## Falhas

- `graphify-out/` fica fora do Git.
- Relatório ausente ou update com erro: avisar o usuário e seguir sem o relatório.
