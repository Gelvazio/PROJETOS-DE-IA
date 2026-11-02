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

## Quem roda os testes: sempre um agente Haiku (C63)

Decidida em 2026-11-02 (C63; pedido do usuário: "testes sempre com agente modelo Haiku"). Vale para
**todas as IAs e todos os projetos**.

- ✅ Toda execução de teste ou validação (rodar suíte, `node --check`, script de teste, consulta de
  conferência ao banco, teste de SQL em transação com rollback) é feita por um **agente separado do
  modelo rápido**: no Claude Code, **Haiku 5.5**. Nas outras IAs, o modelo rápido da ferramenta (a
  mesma tabela de equivalentes da C62, `revisao-previa.md`).
- ✅ Vale para subtarefa de qualquer nível (LEVE, MEDIO, PESADO). Rodar teste **não é pegar a
  tarefa**: o Haiku testar entrega MEDIO/PESADO não viola a C2/C22, e quem executou a subtarefa
  continua sendo o modelo do nível.
- ⛔ O agente de teste só **roda e relata** (PASSOU/FALHOU, com a saída). Não corrige código, não
  muda nível, não faz commit da correção. Se falhar, o líder (ou quem executou) corrige, e o Haiku
  testa de novo.
- ⛔ Teste que grava em banco de produção só dentro de transação desfeita no fim (`begin ... rollback`,
  ou erro forçado), a não ser com ordem explícita do usuário.
- ✅ A C63 só diz **quem roda** os testes. Ela não libera escrever testes: continuam valendo "Nunca
  escrever testes (exceto para corrigir bug)" e a exceção C34.
- ✅ Na equipe de agentes do Claude Code, é o líder quem dispara o agente Haiku de teste depois da
  entrega do executor. Isso fica antes da conferência, do commit e do push da C41, ou junto com eles.

## Como conferir

```
☐ Os testes e validações desta subtarefa foram rodados por um agente Haiku (ou o modelo rápido da ferramenta)?
☐ O agente de teste só relatou (PASSOU/FALHOU, com a saída), sem corrigir nem commitar?
☐ Nenhum teste gravou em banco de produção fora de transação desfeita, sem ordem explícita do usuário?
```
