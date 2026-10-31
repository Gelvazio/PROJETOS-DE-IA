# 🧭 Frentes e reserva de subtarefas

Reutilizável em qualquer projeto em que várias sessões ou IAs (Claude, Gemini, Grok, Copilot…)
trabalham no mesmo repositório e só se falam pelos arquivos. Quadro: `quadro.md`.

## Frentes

- Cada sessão é uma **frente**: `<IA (modelo)> (<ambiente> · <branch>)` (ex.:
  `Claude Code (Opus 5.5) (local · main)`, `Grok (Grok 4.7) (nuvem · main)`).
- O nome da frente aparece na reserva ("Em uso por"), na linha da frente em "🧭 Frentes de
  trabalho", na seção da subtarefa e na mensagem de commit.
- **Tabela "🧭 Frentes de trabalho"** no `STATUS.md` (`Frente | Tarefa (etapa) | Situação |
  Atualizado em`): cada frente atualiza **só a própria linha**, ao começar e ao parar. Sem
  pendência → `⏹️ Encerrada`. Decisão C3 do `rules-ai`.

## Pegar uma subtarefa

1. Sincronizar com o remoto; **só então** ler o `STATUS.md` (sem sincronizar, o quadro mente).
2. Escolher uma **subtarefa** (nunca a linha da mãe) com **"Em uso por" = `—`** e **todas as
   dependências ✅**. Qualquer frente pode pegar qualquer subtarefa livre, mesmo que outra frente
   esteja em outra subtarefa da mesma mãe.
3. Entre as livres, a de **maior prioridade** (🔴 → 🟠 → 🟡 → 🟢); empate = ordem do quadro.
   🟢 Baixa só com orientação explícita do usuário (registrar a orientação na seção da subtarefa).
   Prioridade não fura dependência, reserva nem trava especial.
4. Gravar `<frente> (desde <data hora>)` em "Em uso por" e `🔄 Em execução` no Status, fazer
   **commit + push imediatos** e só então começar o trabalho.
5. Push da reserva recusado → sincronizar, **reler** o quadro; se outra frente pegou a mesma
   subtarefa, desfazer a sua reserva e escolher outra. Nunca sobrescrever a reserva de outra frente.

## Limites

- **1 subtarefa reservada por frente.** Só pega a próxima depois de entregar ou liberar a atual.
- ⛔ Nunca mexer na reserva, na linha de frente ou na seção de subtarefa de outra frente. Reserva
  "parada" não é abandonada: quem libera é **o usuário** (ou quem ele autorizar).
- **Trava especial** (`🔒 Trava especial` em "Em uso por"): ninguém pega, nem as subtarefas; só o
  usuário cria ou remove.
- Subtarefa grande demais → dividir em subtarefas menores **antes** de começar, cada uma com linha
  própria, prioridade (herda a da mãe, ou 🟡) e dependências declaradas.
- A prioridade é **do usuário**; a IA não muda a de tarefas existentes sem pedido.
- Scripts e rascunhos temporários na **pasta da própria sessão**, nunca em pasta compartilhada
  nem no repositório.

## Conflitos

- Conflito no `STATUS.md` ou numa etapa ao sincronizar: manter as mudanças das duas frentes (cada
  uma só mexe nas próprias linhas/seções) e reler antes de seguir.
- Arquivo **gerado** em conflito: não resolver à mão — rodar o gerador de novo depois de sincronizar.
- Recado para outra frente (ou para todas) → `tasks/RECADOS.md`; ler os recados ao começar.
