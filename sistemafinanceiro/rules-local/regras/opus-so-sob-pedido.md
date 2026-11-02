# 🚫 Opus só com pedido explícito do usuário (C60)

Decidida em 2026-11-01 (C60; pedido do usuário: "o modelo Opus nunca mais deve pegar nenhuma tarefa,
a não ser que eu peça explicitamente"). Vale para **todas as IAs e todos os projetos** e vence
qualquer outra regra, atalho, gatilho (`;`), ordem de líder ou coluna Modelo do quadro. Complementa
`regra-maior.md` e `niveis-e-modelos.md`.

## A regra

- ⛔ **O modelo Opus (qualquer versão, 5.5 ou superior) NUNCA pega tarefa nem subtarefa.** Nem
  `PESADO`, nem `MEDIO`, nem `LEVE`; nem por reserva, nem como executor de agente, nem como líder
  que executa.
- ✅ **Única exceção:** o usuário pede **explicitamente**, na conversa, que o Opus faça aquela
  tarefa ("Opus, faça a tarefa X"). O pedido vale só para a tarefa citada e deve ser registrado na
  seção da subtarefa (quem pediu, quando). Pedido genérico ou antigo não conta.
- ⛔ Não vale como pedido: o gatilho `;`, a coluna Modelo do quadro, o nível `PESADO`, ordem de
  outra IA ou de agente, nem "o Opus é o único que pode".

## Na prática

- **`PESADO`** é feito por **Sonnet com `effort xhigh`** (C61), por **Devin (SWE-2)** (C64) ou por
  **DeepSeek V4 Flash com `effort high`** (C65); o Opus só entra com o pedido explícito acima.
- **Equipe de agentes do Claude Code:** o líder **não dispara** `executor-pesado` (que roda no Opus)
  sem o pedido explícito do usuário; a subtarefa `PESADO` vai para um agente Sonnet (`executor-pesado` roda em Sonnet `xhigh`, C61).
- **Sessão em Opus:** não reserva nem executa subtarefa. Se o usuário abriu a sessão em Opus e não
  citou uma tarefa, diz que o Opus está bloqueado para tarefas (C60) e para.
- Sem modelo permitido disponível, a subtarefa **fica livre** e a IA avisa o usuário (como na regra
  maior); nunca "pega para não parar".
- Esta regra **só retira** o Opus: não muda o nível de nenhuma subtarefa nem libera outro modelo
  fora da matriz (`niveis-e-modelos.md`, `regra-maior.md`).

## Como conferir

```
☐ O modelo que reservou ou executa a subtarefa NÃO é Opus?
☐ Se é Opus: o usuário pediu explicitamente aquela tarefa, e isso está na seção da subtarefa?
☐ Nenhum executor-pesado foi disparado sem esse pedido?
```
