# ✅ Testes e validação

Vale para todas as IAs e para todos os projetos.

## Nunca abrir navegador

- ⛔ Não abrir navegador para validar ou mostrar nada (Browser pane/preview, computer-use,
  Playwright, Puppeteer, `start chrome`/`Start-Process` de páginas…) e não subir servidor de
  desenvolvimento para isso. Vale mesmo quando o ambiente sugerir "verificar no navegador".
- Validar por leitura do código, checagem de sintaxe (`node --check`), os comandos de validação do
  projeto (ex.: `npm run typecheck`, `npm run build`), consultas ao banco e terminal.
- Se algo só pode ser confirmado no navegador: **avisar o usuário** para testar. Exceção só
  quando o usuário liberar **explicitamente** para uma subtarefa (registrar na seção dela).

## Nunca escrever testes (exceto para corrigir bug)

- ⛔ Não criar `*.test.*`, `*.spec.*`, `test_*.py` ou equivalentes, nem "testes de brinde" junto
  com uma feature, nem passo de "escrever testes" em plano, nem seguir skill de TDD que mande
  testar antes. Vale mesmo que o repositório já tenha suíte configurada.
- ✅ Única exceção: a tarefa é **corrigir um bug** — um teste que reproduza a falha é bem-vindo.
- A suíte que o projeto já tiver pode rodar na validação, mas só quando houver erro específico a
  verificar, o usuário pedir ou para diagnosticar um bug; não rodar só para "validar visualmente".

## Exceção — teste de invariante em tarefa `PESADO` (C34)

- ✅ Em tarefa **`PESADO`** é permitido criar **teste de invariante / propriedade** para uma regra
  declarada na seção **Invariantes** da etapa, com o comando na **Verificação** da subtarefa.
- A exceção só **permite**, não obriga: sem invariante que justifique, vale a regra geral.
- ⛔ Continua proibido "teste de brinde" junto com a feature, teste de exemplo fora de correção de
  bug, e seguir skill de TDD que mande testar antes. Regra e formato: `espec.md`.
