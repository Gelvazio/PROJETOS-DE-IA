# MODELO-3D-REDE-NEURAL-01 — Orquestrador de agentes em anel

**Imagem de referência:** `MODELO-3D-REDE-NEURAL-01.png`

## O que a imagem mostra

Painel escuro em estilo "HUD" com um orquestrador central (caixa "JEV" com borda vermelha e cantos
em colchete) dentro de um anel segmentado (barras cinza que acendem em verde conforme o progresso).
Em volta do anel ficam 8 cartões de robôs ("GROK BOT 01" a "08"), cada um com cor própria (rosa,
laranja, amarelo, verde, ciano, azul, roxo, vermelho), ícone de robô, status (`done`, `prompt in`,
`idle`, `waits on jev`, `plans`, `held by jev`) e uma linha tracejada com o rótulo `prompt` ligando
ao anel. Dentro do anel há 8 círculos de critério (`BFUEL`, `SIZE`, `RISK`, `EDGE`, `SLIP`, `TIME`,
`LIQ`, `OB`) e o texto `checking 004 plan #042`. Embaixo, 4 painéis: **Execution log** (ordens
preenchidas com valores em verde), **Decisions** (YES/NO com motivo), **Status dos 8 bots** (barras
coloridas) e **Session P&L** (valor grande em verde e curva crescente).

## Prompt (copiar)

```
Crie uma página HTML única (HTML + CSS + JavaScript puro, sem build) que recrie o painel
"orquestrador de agentes em anel" da imagem MODELO-3D-REDE-NEURAL-01.png.

Layout (fundo #0b0f17, fonte monoespaçada, textos pequenos em caixa alta):
1. Centro: caixa do orquestrador com o nome "ORQUESTRADOR" em letras grandes, borda vermelha e
   cantos em colchete; abaixo, a linha "verificando plano #042 do agente 04".
2. Em volta, um anel de 64 segmentos (SVG) que acendem em verde em sequência, como uma barra de
   progresso circular; marcas de grau discretas no lado de fora.
3. Dentro do anel, 8 círculos pequenos com os critérios: COMBUSTÍVEL, TAMANHO, RISCO, VANTAGEM,
   DESLIZE, TEMPO, LIQUIDEZ, LIVRO.
4. Em volta do anel, 8 cartões de agentes ("AGENTE 01" a "AGENTE 08"), cada um com cor própria,
   um robô desenhado em CSS/SVG (cabeça quadrada, antena, olhos), o status e uma barra de
   progresso. Status possíveis: pronto, recebendo prompt, ocioso, aguardando orquestrador,
   planejando, retido pelo orquestrador. Cada cartão liga ao anel por uma linha tracejada com o
   rótulo "prompt" e um ponto que viaja pela linha quando o agente envia um prompt.
5. Rodapé com 4 painéis lado a lado:
   - Log de execução: lista rolando (ID, agente, "preenchido", valor em verde).
   - Decisões do orquestrador: SIM (verde) / NÃO (vermelho) com o motivo
     ("vantagem < custo", "risco ok", "tamanho ok", "liquidez baixa").
   - Status dos 8 agentes: nome + barra na cor do agente.
   - P&L da sessão: número grande em verde, taxa de acerto e um gráfico de linha (SVG) que cresce.

Comportamento:
- Simulação a cada 1,5 s: um agente muda de status, o anel avança, entra uma linha nova no log e
  uma decisão nova; o P&L soma ou subtrai valores aleatórios pequenos.
- Todos os dados são fictícios. Mostre no rodapé o aviso: "Simulação — dados fictícios, não é
  operação real".

Regras de código: cores em tokens CSS no :root, classes BEM, funções de até 45 linhas, nomes em
português sem acentos, responsivo (em telas estreitas os cartões viram uma grade abaixo do anel).
```
