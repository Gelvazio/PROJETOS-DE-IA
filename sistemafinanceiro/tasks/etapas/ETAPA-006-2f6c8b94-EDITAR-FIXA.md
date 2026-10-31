## Etapa 006-2f6c8b94 — EDITAR-FIXA: Botão Editar na fixa e ajuste do CSS das ações

**Tarefa:** EDITAR-FIXA · **Pedido em:** 2026-10-30 · **Criada por:** Claude Code (Sonnet 5.5) (local · main)
**Pedido:** "ajuste CSS e cadê o botão de editar?" (print da linha de fixa com os botões Receber e
"Parar de repetir" apertados e sem Editar).
**Objetivo:** botões de ação da fixa bem alinhados, como os dos lançamentos normais, e um botão
Editar que altera a recorrência.

### Tarefa pequena
Ajustes em `index.html` (CSS) e `src/main.js`, sem banco novo (a tabela e o `updateRecorrencia` já existem).

### Decisões
- 2026-10-30 — Editar uma fixa altera a **recorrência** (descrição, tipo, valor e dia de vencimento) e
  vale para os meses ainda não efetivados; lançamentos já efetivados (reais) nunca são alterados.
  Para mudar só um mês, efetiva-se aquele mês (o valor é editável na confirmação). (interpretação do pedido)

### EDITAR-FIXA.1 — Ajustar o CSS dos botões de ação da linha de fixa
**Próximo passo:** reservar após a classificação do Jev.
- **Nível:** MEDIO — classificado (sinais)
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Fonte:** sinais
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** os botões da linha virtual (Pagar/Receber, Editar, Parar de repetir) devem ter o mesmo
  tamanho de fonte, altura, espaçamento e alinhamento dos botões dos lançamentos normais, sem texto
  apertado nem quebra de linha, na tabela e na lista mobile. Só CSS (`index.html`, `css/mobile.css`).
- **Critérios de Aceitação:** botões com altura e espaçamento iguais aos normais; `npm run build` ok.
- **Verificação:** leitura do CSS e `npm run build`; aparência na tela fica com o usuário.

### EDITAR-FIXA.2 — Botão Editar na linha de fixa (edita a recorrência)
**Próximo passo:** depende da EDITAR-FIXA.1 só para não sobrepor `index.html`; usa apenas `src/main.js`.
- **Nível:** MEDIO — classificado (jev (confiança 0.92))
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Fonte:** jev (confiança 0.92)
- **JEV-AI-SUGGESTION:** SIM
- **Descrição:** botão "Editar" (`data-action="editar-fixa"`) na linha virtual que abre o modal do
  lançamento preenchido com a recorrência (descrição, tipo, valor, dia de vencimento no mês da linha),
  em modo fixa (sem status, pagamento e parcelas; interruptor Fixa oculto) e título "Editar fixa";
  ao gravar chama `updateRecorrencia` (nunca altera lançamentos reais), recarrega e dá o aviso.
- **Critérios de Aceitação:** editar valor/descrição/dia reflete nas ocorrências ainda não efetivadas;
  `node --check` e `npm run build` ok.
- **Verificação:** leitura do código, `node --check`, `npm run build`; teste na tela fica com o usuário.

### Entrega EDITAR-FIXA.1 (2026-10-30)
- `index.html` (`.action-cell` com `flex-wrap`; botão "Parar de repetir" com largura automática) e
  `css/mobile.css` (idem nos cards). **Verificação:** `npm run build` ok; aparência fica com o usuário.

### Entrega EDITAR-FIXA.2 (2026-10-30)
- `src/main.js`: botão Editar na linha de fixa (`abrirModalEditarFixa`, `salvarEdicaoFixa`,
  `recorrenciaEmEdicao`); grava só `updateRecorrencia`, sem tocar lançamentos reais.
  **Verificação:** `node --check` e `npm run build` ok; teste na tela fica com o usuário.
