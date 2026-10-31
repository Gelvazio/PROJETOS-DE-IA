## Etapa 003-5c8d2e71 — MES-SALVO: Mês selecionado salvo com validade de 1 hora

**Tarefa:** MES-SALVO · **Pedido em:** 2026-10-30 · **Criada por:** Claude Code (Sonnet 5.5) (local · main)
**Pedido:** "ao abrir a tela deve carregar a data do mês atual, se não houver localstorage com mês
selecionado salvo; localstorage deve durar máximo 1 hora".
**Objetivo:** ao abrir o dashboard, mostrar o mês atual, a menos que exista um mês escolhido salvo
há menos de 1 hora; tudo o que o dashboard guarda no localStorage (mês e filtros) expira em 1 hora.

### Tarefa pequena
Ajuste pontual em 2 arquivos (`src/filtrosSalvos.js`, `src/main.js`), sem banco nem segurança.

### Decisões
- 2026-10-30 — a validade vale para o mês e para os filtros de tipo/status (mesmo registro
  `fin_filtros`); cada gravação renova o prazo de 1 hora (máximo de 1 hora desde a última escolha).
  Registro expirado ou inválido é ignorado e removido. (interpretação do pedido)

### MES-SALVO.1 — Salvar o mês escolhido e expirar o localStorage em 1 hora
**Próximo passo:** implementar em `filtrosSalvos.js` e ligar no `main.js`.
- **Nível:** MEDIO — classificado (jev (confiança 0.98))
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Fonte:** jev (confiança 0.98)
- **JEV-AI-SUGGESTION:** SIM
- **Descrição:** `salvarFiltros` passa a guardar `mes` e `salvoEm`; `carregarFiltros` devolve `mes`
  (ou `null`) e ignora/remove registro com mais de 1 hora; o `main.js` abre no mês salvo válido ou
  no mês atual e grava o mês ao navegar (setas e seletor).
- **Critérios de Aceitação:** sem registro ou com registro expirado abre no mês atual; com registro
  de até 1 hora abre no mês salvo; `node --check` e `npm run build` sem erro.
- **Verificação:** leitura do código, `node --check`, `npm run build`; teste na tela fica com o usuário.

### Decisão adicional (2026-10-30, usuário)
- Sem mês salvo válido, o mês padrão é o mês atual (America/Sao_Paulo); **depois do dia 25** (dia ≥ 26)
  o mês padrão é o mês seguinte (dezembro → janeiro do ano seguinte).

### Entrega MES-SALVO.1 (2026-10-30)
- `src/filtrosSalvos.js` (`mes`, `salvoEm`, validade de 1 hora, registro expirado é removido) e
  `src/main.js` (`salvarPreferencias`, `getCurrentMonth` com virada no dia 25).
  **Verificação:** `node --check`, `npm run build` ok; cálculo conferido: 25/10→2026-10, 26/10→2026-11,
  30/12→2027-01. Teste na tela fica com o usuário.
