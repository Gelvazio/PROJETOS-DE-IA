# 🕸️ graphify — grafo de conhecimento do REA

Segue a regra global `C:/fontes/rules-ai/regras/graphify.md` (C25, 2026-10-17, que substituiu a
C11). Aqui só fica o que é do REA.

## Quando atualizar e quando ler

- No início de cada conversa e ao fim de cada tarefa concluída e retirada do quadro (depois do
  commit + push), atualizar o grafo na raiz do REA: `/graphify --update` (ou
  `C:\Python314\python.exe -m graphify update .`). Mudança só em código: o update não usa LLM; em
  documento, a extração semântica roda só nos documentos alterados.
- **Ler e analisar** `graphify-out/GRAPH_REPORT.md` antes de criar e antes de executar cada
  tarefa, e antes de responder: comunidades, nós principais e relações do projeto.
- Se `graphify-out/graph.json` não existir, rodar `/graphify` completo na raiz.
- ⛔ Fora desses momentos, não rodar (nem a cada commit ou pedido).

## Ao responder

- Para arquitetura, arquivos, regras ou relações do projeto, consultar o grafo:
  `/graphify query "<pergunta>"`, `/graphify path` ou `/graphify explain`. Perguntas triviais
  (sintaxe, uma linha já aberta na conversa) dispensam a consulta.
- Resposta baseada no grafo cita o arquivo de origem. O que o grafo não cobre, dizer que não
  cobre: não inventar relações.

## Falhas

- `graphify-out/` fica fora do Git (já no `.gitignore`): não versionar.
- Se o update falhar, avisar o usuário, registrar em "Pendências" do `tasks/STATUS.md` e seguir
  sem o relatório.
