## Etapa 004-9e3a6f12 — BUG-MES-TDZ: Tela não carrega na Vercel (ReferenceError na inicialização)

**Tarefa:** BUG-MES-TDZ · **Pedido em:** 2026-10-30 · **Criada por:** Claude Code (Sonnet 5.5) (local · main)
**Pedido:** "na vercel não está carregando o mês atual, verifique também a msg no console"
(console: `Uncaught ReferenceError: Cannot access 'Ye' before initialization`).
**Objetivo:** a tela voltar a carregar o mês e os dados.

### Tarefa pequena
Correção pontual em 1 arquivo (`src/main.js`), sem banco nem segurança.

### Causa
A constante `DIA_VIRADA_DO_MES`, criada na MES-SALVO.1, ficou declarada depois da linha que chama
`getCurrentMonth()` na inicialização do módulo (zona morta temporal do `const`). Quebra o script
inteiro, por isso o mês aparece "—" e a lista fica em "Carregando...". A mensagem sobre
`beforeinstallprompt` é só um aviso do PWA, sem relação.

### BUG-MES-TDZ.1 — Declarar a constante antes de usá-la
**Próximo passo:** mover `DIA_VIRADA_DO_MES` para o bloco de constantes antes da linha 75 de `src/main.js`.
- **Nível:** MEDIO — classificado (sinais)
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Fonte:** sinais
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** corrigir a ordem de declaração em `src/main.js`.
- **Critérios de Aceitação:** a inicialização não lança ReferenceError; `node --check` e `npm run build` ok.
- **Verificação:** leitura do código, build e execução do módulo bundle em Node sem DOM não se aplica;
  teste na tela fica com o usuário.

### Entrega BUG-MES-TDZ.1 (2026-10-30)
- `src/main.js`: `DIA_VIRADA_DO_MES` movida para antes da linha que chama `getCurrentMonth()`.
  **Verificação:** `node --check` e `npm run build` ok; declaração agora precede o uso. Teste na tela
  (Vercel) fica com o usuário.
