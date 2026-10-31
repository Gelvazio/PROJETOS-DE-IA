## Etapa 005-4d7b9a36 — FIXA-SWITCH: Checkbox "Fixa" como interruptor ON/OFF

**Tarefa:** FIXA-SWITCH · **Pedido em:** 2026-10-30 · **Criada por:** Claude Code (Sonnet 5.5) (local · main)
**Pedido:** "este check deve ser do tipo ON/OFF" (checkbox "Fixa (repete todo mês)" do modal).
**Objetivo:** o campo Fixa aparecer como interruptor (toggle) ON/OFF, sem mudar o comportamento.

### Tarefa pequena
Ajuste visual em 1 arquivo (`index.html`, só CSS e a marcação do rótulo), sem mudar `main.js`.

### FIXA-SWITCH.1 — Estilizar `#f-fixa` como interruptor ON/OFF
**Próximo passo:** reservar após a classificação do Jev e executar.
- **Nível:** LEVE — classificado (sinais)
- **Modelo:** só Haiku 5.5 ou DeepSeek V4.1 Flash — nunca outro
- **Effort:** low
- **Fonte:** sinais
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** manter o `<input type="checkbox" id="f-fixa">` (o `main.js` continua lendo `.checked` e o
  evento `change`) e apresentá-lo como interruptor com CSS (`appearance: none`), com os estados OFF e ON
  nas cores do tema e o texto "Fixa (repete todo mês)" ao lado.
- **Critérios de Aceitação:** o interruptor muda de estado ao clicar no rótulo e no controle; sem
  estilo inline; `npm run build` sem erro.
- **Verificação:** leitura do código e `npm run build`; aparência na tela fica com o usuário.

### Entrega FIXA-SWITCH.1 (2026-10-30)
- `index.html` (CSS): `#f-fixa` apresentado como interruptor ON/OFF (trilho 40x22, botão deslizante,
  ON na cor `--h2`), sem mudar o id nem o `main.js`. Executado pelo executor-leve (Haiku).
  **Verificação:** `npm run build` ok; variáveis de cor conferidas; aparência fica com o usuário.
