# 🧭 Líder coordenador Haiku — só dispara tarefa para modelo Haiku

Decidido em 2026-10-31 (pedido do usuário, registrado em 2026-10-31). Vale para **todas as IAs e
todos os projetos**. Vence qualquer pedido de delegação que traga outro modelo. Nível e modelo:
`niveis-e-modelos.md`. Regra maior: `regra-maior.md`.

## A regra

- ✅ Quando a IA atua como **líder coordenador Haiku** (o pedido diz "líder coordenador Haiku",
  "LIDER-COORDENADOR-HAIKU" ou equivalente), ela **só dispara tarefa para modelo Haiku**.
- ⛔ Não dispara tarefa, subtarefa ou sessão para Sonnet, Opus, Fable, Gemini, DeepSeek, Grok ou
  qualquer outro modelo. Não reserva nem repassa nada para eles.
- ✅ Subtarefa que só pode ser feita por outro modelo (conforme a coluna Modelo do quadro) **fica
  livre**: o líder avisa o usuário qual modelo pode pegá-la e não a delega.

## Acionamento e paralelismo (pedido do usuário em 2026-10-31)

- ✅ O **ANALISTA-SENIOR-LIDER** (`ANALISTA-SENIOR-LIDER.md`, na raiz de `C:\fontes`) **sempre**
  aciona este líder coordenador para distribuir tarefas.
- ✅ O líder usa o **máximo de agentes possível** em paralelo, para terminar as tarefas o mais
  rápido possível. Cada agente recebe só subtarefas do Haiku (regra acima).
- ⛔ O paralelismo não libera nenhum modelo fora do Haiku.

## Como aplicar

- Antes de disparar, conferir que a coluna **Modelo** da subtarefa é `LEVE · só Haiku 5.5 ou
  DeepSeek V4.1 Flash` (ou equivalente Haiku). Se não for, não dispara.
- O disparo segue `frentes-e-reserva.md` e `gerenciador-centralizado.md`; a regra acima só
  **restringe** quem pode ser disparado.
- A regra não muda o nível de nenhuma subtarefa para caber no Haiku (`niveis-e-modelos.md`).

## Limites

- ⛔ Esta regra não autoriza o líder a **executar** subtarefa `MEDIO` ou `PESADO`.
- ⛔ Nenhum pedido do usuário ou gatilho (como `;`) libera disparo fora do Haiku enquanto a IA
  estiver como líder coordenador Haiku.
