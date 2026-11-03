# 🧭 Frentes e reserva de subtarefas

Para projetos em que várias sessões ou IAs (Claude, Gemini, Grok, Copilot, Codex…) trabalham no
mesmo repositório e só se falam pelos arquivos. Quadro: `quadro-de-tarefas.md`. "Linha" e
"coluna" valem também para o item do índice simplificado do `STATUS.md` (C55).

> **Projeto no banco (C58):** no `rules-ai` (e no `aulasenai`, depois do corte) o quadro está nas
> tabelas `quadro_*` do Supabase e **reservar, entregar e liberar são chamadas RPC**
> (`quadro-de-tarefas.md`, "Modelo do quadro no banco"), não commit. O Git fica só para os
> arquivos que a subtarefa muda. A regra maior (C50) e a trava de sessão (`tasks/.sessao-ativa`,
> C29) continuam valendo igual. Projetos em `.md` seguem como abaixo.

## Frentes

- Cada sessão é uma **frente**: `<IA (modelo)> (<ambiente> · <branch>)` (ex.:
  `Claude Code (Opus 5.5) (local · main)`, `Gemini CLI (Flash) (nuvem · main)`).
- Cada frente atualiza **só a própria linha** em "🧭 Frentes", ao começar e ao parar. Sem
  pendência → `⏹️ Encerrada`. No banco, a frente é a linha dela em `quadro_frentes`.
- O nome da frente aparece na reserva ("Em uso por"), na linha da frente, na seção da subtarefa e na
  mensagem de commit (ex.: `feat(x): … por Claude Code (Sonnet 5.5) (local · main)`).

## Pegar uma subtarefa

1. Sincronizar com o remoto; **só então** ler o `STATUS.md` (sem sincronizar, o quadro mente).
   No banco: ler as tabelas `quadro_*` (já estão sempre atualizadas; o `git pull` segue valendo
   para o código e as regras).
2. Escolher uma **subtarefa** (nunca a linha da mãe) com **"Em uso por" = `—`**, **todas as
   dependências ✅** e **do seu modelo** (coluna Modelo; `niveis-e-modelos.md`). ⛔ **Nunca**
   subtarefa de outro modelo, nem acima nem abaixo, sem exceção. Sem nível → **o Jev classifica**
   antes (`node scripts/jev.mjs classificar --id <ID> --gravar`, C52); a IA nunca escolhe o nível.
3. Entre as livres, a de **maior prioridade** (🔴 → 🟠 → 🟡 → 🟢); empate = ordem do quadro.
   🟢 Baixa só com orientação explícita do usuário (registrar na seção da subtarefa). Prioridade
   não fura dependência, reserva nem trava especial. Sem subtarefa livre do seu modelo → não pega
   nenhuma e avisa o usuário.
4. **Reservar:**
   - **No banco:** chamar `reservar(p_id, p_frente, p_ia, p_modelo_ia)`. A própria gravação é a
     reserva (grava `em_uso_por` e `🔄`); **sem** commit `lock:` nem push. Só começar o trabalho
     com `ok = true`.
   - **Em `.md`:** gravar `<frente> (desde <data hora>)` em "Em uso por" e `🔄 Em execução` no
     Status, fazer **commit + push imediatos** e só então começar o trabalho.
5. **Reserva recusada:**
   - **No banco:** `ok = false` → ler o `motivo` (`ocupada`, `dependencia`, `modelo`,
     `frente_ocupada`, `trava`…), **não forçar** e escolher outra subtarefa.
   - **Em `.md`:** push recusado → sincronizar, **reler** o quadro; se outra frente pegou a mesma
     subtarefa, desfazer a sua reserva e escolher outra.
   - Nunca sobrescrever a reserva de outra frente.
6. 🔒 **Antes de entregar: commit + push da subtarefa (C59, `commit-por-subtarefa.md`, nunca quebrar).** **Entregar** (no banco): `entregar(p_id, p_frente, p_entrega, p_verificacao)`, com entrega e
   verificação preenchidas, depois do commit + push dos arquivos da subtarefa. **Liberar** sem
   entregar: `liberar(p_id, p_frente, p_motivo)`. Em `.md`: `ciclo-da-task.md` ("Encerrar").
7. **Sem banco** (rede ou Supabase fora do ar) ou **na nuvem** sem a chave de serviço: não reserva
   nem entrega; avisa o usuário (`quadro-de-tarefas.md`, "Quem não alcança o banco").

## Limites

- **1 subtarefa reservada por frente.** Só pega a próxima depois de entregar ou liberar a atual.
- ⛔ Nunca mexer na reserva, na linha de frente ou na seção de subtarefa de outra frente. Reserva
  "parada" não é abandonada: quem libera é **o usuário** (ou quem ele autorizar). No banco, a
  reserva só se libera por `liberar` (da própria frente ou do usuário), nunca com `UPDATE` direto.
- **Trava especial** (`🔒 Trava especial` em "Em uso por"): ninguém pega, nem as subtarefas; só o
  usuário cria ou remove.
- Subtarefa grande demais (ou acima do seu nível) → dividir em subtarefas menores **antes** de
  começar, cada uma com linha própria, nível, prioridade (herda a da mãe, ou 🟡) e dependências.
- A prioridade é **do usuário**; a IA não muda a de tarefas existentes sem pedido.
- Scripts e rascunhos temporários na **pasta da própria sessão**, nunca em pasta compartilhada
  nem no repositório.

## Conflitos

- No banco não há conflito de quadro: a RPC é atômica e quem chega depois recebe `ok = false`.
- Projeto em `.md` — conflito no `STATUS.md` ou numa etapa ao sincronizar: manter as mudanças das duas frentes (cada
  uma só mexe nas próprias linhas/seções) e reler antes de seguir.
- Arquivo **gerado** em conflito: não resolver à mão — rodar o gerador de novo depois de sincronizar.
- Recado para outra frente (ou para todas) → `tasks/RECADOS.md` (no banco, `quadro_recados`);
  ler os recados ao começar.

## Gatilho `;` — pegue a próxima tarefa do seu modelo

- Mensagem do usuário **só com `;`** = "Pegue a próxima tarefa disponível para o seu modelo".
  Vale para todas as IAs, sem confirmar nada antes.
- **Passo 0 (só PC local):** antes de tudo, rodar `python C:\fontes\rules-ai\scripts\UPDATE.py`
  (atualiza os repositórios de `C:\fontes`, ignorando `rules-ai` e `DEMAIS-PROJETOS-*`) e mostrar o
  resultado em quadro. Conflito de rebase é relatado, sem escolher lado. Na nuvem (sem
  `C:\fontes`), o passo é pulado sem erro. Decisão C56.
- A IA faz, nesta ordem: **1)** sincronizar com o remoto; **2)** ler o `STATUS.md` (no banco, as
  tabelas `quadro_*`; sem banco, avisar e parar, sem arquivo de queda); **3)** escolher a
  subtarefa por "Pegar uma subtarefa" (livre, dependências ✅, **do seu modelo**, maior
  prioridade); **4)** reservar (commit + push; no banco, a RPC `reservar`); **5)** executar até entregar; **6)** encerrar pelo
  ciclo da task e responder só **TAREFA FINALIZADA E SINCRONIZADA!**
- **Sem subtarefa livre do seu modelo** → não pega nenhuma e diz ao usuário qual modelo tem
  subtarefa livre (o `;` nunca autoriza pegar tarefa de outro modelo: `niveis-e-modelos.md`).
- Tarefa grande sem o "sim" do usuário ao plano **não** é pega pelo `;` (fica 👀 até o "sim").
- É **uma** subtarefa por mensagem `;`; para a seguinte, o usuário manda `;` de novo.

## Gatilho `.` — liste as tarefas-mãe pendentes

- Mensagem do usuário **só com `.`** = "Liste as tarefas-mãe pendentes do quadro" (C30,
  2026-10-17; só as mães pendentes desde a C68, 2026-11-02). Vale para todos os projetos e todas
  as IAs.
- A IA faz, nesta ordem: **1)** sincronizar com o remoto; **2)** ler o `STATUS.md` (no banco, as
  tabelas `quadro_*`, como em `comando-ponto.md`); **3)** mostrar
  em quadro (`exibicao-de-status.md`) **só as tarefas-mãe com status ⬜ Pendente**, com Tarefa,
  Título, Status e Subtarefas abertas. ⛔ Sem subtarefas, sem mãe 🔄 👀 ⛔ ✅ ❌ e sem a "próxima
  subtarefa livre" (para pegar uma, o usuário manda `;`).
- ⛔ O `.` **não** reserva, não executa e não muda nada (nem o quadro). Para pegar a próxima, o
  usuário manda `;`.