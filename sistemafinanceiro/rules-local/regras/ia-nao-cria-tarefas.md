# 🚫 IA não cria tarefas — tarefa nova só no dashboard, e passa pela ANÁLISE

Decidido em 2026-11-02 (pedido do usuário: "nenhuma IA pode criar tarefas, apenas pegar do banco
de dados"; "ela pode mudar status sim, mas criar nova jamais, dessa forma vou centralizar novas
tarefas no dashboard"). Vale para **todas as IAs e todos os projetos**.

⚠️ **Vence** as regras que mandam a IA criar tarefa: a C26 (trabalho descoberto vira subtarefa), a
C36 (sincronização do `rules-local` cria TASK `RL-…`), a C41 (o Haiku cria a subtarefa
"Verificação"), a C62 (quem criou corrige a reprovada) e os passos "Criar" e "Publicar" do
`ciclo-da-task.md`. Onde essas regras dizem "criar tarefa ou subtarefa", vale esta.

## A regra

- ⛔ **Nenhuma IA cria tarefa-mãe nem subtarefa**, em nenhum projeto e por nenhum caminho: RPC
  (`criar_mae`, `criar_tarefa_mae`, `criar_subtarefa`), SQL, arquivo `.md`, MCP, script, agente
  ou equipe. Nem a pedido de outra IA, nem por gatilho (`;`, `.`).
- ✅ **Tarefa nova só nasce no dashboard**, criada pelo usuário. É o lugar central das tarefas.
- ✅ **A IA só pega tarefas do banco:** lê, reserva, executa, entrega e **muda o status**.
- ✅ Quando a IA achar trabalho que pede tarefa nova (algo descoberto no caminho, ajuste da
  sincronização do `rules-local`, problema na conferência da entrega), ela **avisa o usuário** na
  conversa: o que criar, em qual tarefa-mãe e por quê. Quem cria é o usuário, no dashboard.

## Status ANÁLISE

- ✅ Toda tarefa nova nasce com o status **🔍 ANÁLISE**. Ninguém reserva tarefa em análise.
- ✅ A IA **revisa o que foi pedido** na tarefa e decide se faz sentido: objetivo claro, escopo
  possível, critério de pronto, arquivos que existem, risco escondido (banco, segurança, apagar
  dados). Quem revisa é o revisor da C62 (`revisao-previa.md`).
  - **Faz sentido** → a IA muda o status para **⬜ PENDENTE**.
  - **Não faz sentido** → a IA muda o status para **🧑 ANÁLISE HUMANA** e grava a explicação:
    **o que o usuário deve mudar e por quê**.
- ✅ Em **ANÁLISE HUMANA**, o usuário abre a tarefa no dashboard, lê a explicação e edita o que foi
  sugerido. Ao salvar, a tarefa volta para **ANÁLISE** e a IA revisa de novo.
- ✅ A IA também explica ao usuário, **na conversa**, o que mudar em cada tarefa que ficou em
  ANÁLISE HUMANA e por quê.
- ✅ **Quando:** antes de pegar qualquer tarefa (no `;`, no `.` e no início da sessão), a IA
  analisa primeiro as tarefas em ANÁLISE.
- ⛔ A análise **não executa** a tarefa, não muda o nível (Jev, C52) nem o texto do pedido: só
  muda o status e escreve a explicação.

## Estado da implementação

- ⏳ Os status `analise` e `analise_humana`, a coluna da explicação e a função com que a IA muda o
  status ainda **não existem no banco** nem no dashboard. Isso é uma tarefa à parte (banco,
  dashboard e regras do quadro), que depende da aprovação do usuário.
- Até lá: as tarefas novas nascem `pendente`, a IA **continua sem criar nenhuma** e, se uma tarefa
  não fizer sentido, **não a pega** e explica ao usuário na conversa o que mudar e por quê.
- Projetos ainda em `.md` (sem o quadro no banco): vale o mesmo. A IA não cria item no
  `tasks/STATUS.md` nem etapa nova; quem cria é o usuário.

## Como conferir

```
☐ Nesta sessão, nenhuma tarefa-mãe ou subtarefa foi criada pela IA?
☐ O trabalho novo que apareceu foi avisado ao usuário (o que criar e por quê), sem criar?
☐ As tarefas em ANÁLISE foram revisadas antes de pegar outra?
☐ Cada tarefa em ANÁLISE HUMANA tem a explicação do que mudar e por quê?
```
