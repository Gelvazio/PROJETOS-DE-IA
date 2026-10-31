# ✅ Testes e validação

Vale para todas as IAs.

## Nunca abrir navegador

- ⛔ Não abrir navegador para validar ou mostrar nada (preview, Playwright, Puppeteer, computer-use,
  `start chrome`…) e não subir servidor de desenvolvimento para isso.
- Validar por leitura do código, checagem de sintaxe, os comandos de validação do projeto (ex.:
  `npm run typecheck`, `npm run build`, `npm test`, `npm run check:agentes`), consultas ao banco
  (ver `multiplas-ias.md`) e terminal.
- Se algo só pode ser confirmado no navegador: avisar o usuário para testar. Exceção só quando o
  usuário liberar explicitamente para uma subtarefa (registrar na seção da subtarefa).

## Nunca escrever testes (exceto para corrigir bug)

- ⛔ Não criar `*.test.*`, `*.spec.*`, `test_*.py` ou equivalentes, nem "testes de brinde" junto
  com uma feature, nem passo de "escrever testes" em plano.
- ✅ Única exceção: a subtarefa é **corrigir um bug** — um teste que reproduza a falha é bem-vindo.
- A suíte que o projeto já tiver **continua rodando** na validação; ela só não ganha testes novos
  fora da exceção.
