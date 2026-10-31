---
name: liderar-equipe
description: Fluxo do líder da equipe de agentes do Claude Code - sincroniza, classifica o nível das subtarefas livres, reserva UMA por vez, delega ao executor do nível (executor-leve, executor-medio ou executor-pesado), confere e valida a entrega, commita e segue para a próxima. Use quando o usuário pedir "rode a equipe", "lidere a equipe", "faça as tarefas com os agentes" ou "/liderar-equipe". Só para o Claude Code com Opus 5.5 ou superior, ou Fable, como líder. Também cobre o modo sargento (líder só gerencia, agentes em paralelo, VIGIA e FINANCEIRO).
---

# Liderar a equipe (liderar-equipe)

Regras: `AGENTS.md` → `.claude/rules/` (quadro, reserva, ciclo, git) e a seção "Nível das
subtarefas" de `.claude/rules/multiplas-ias.md`. Esta skill só descreve **o trabalho do líder**.

> Fonte única: `.agents/skills/liderar-equipe/SKILL.md`. As cópias em `.claude/`, `.grok/` e
> `.gemini/commands/` são geradas no commit — **não editar as cópias**.

## Quem é quem

| Papel | Quem | Pode |
|---|---|---|
| **Líder** | esta sessão (Claude Code com Opus 5.5+ ou Fable) | Git, quadro, validar, decidir |
| `classificador-tarefas` | subagente (Haiku) | só acrescentar `- **Nível:**` nas etapas |
| `executor-leve` / `executor-medio` / `executor-pesado` | subagentes (Haiku / Sonnet / Opus) | só editar os arquivos da subtarefa |
| `VIGIA` (modo sargento) | subagente (Haiku) | só avisar o líder se um agente está parado ou travado |
| `FINANCEIRO` (modo sargento) | subagente (Haiku) | só acompanhar o uso restante e avisar o líder |

## Modo: **uma subtarefa por vez, na mesma pasta**

Padrão do template: **nada em paralelo**. Uma subtarefa só começa depois que a anterior
foi entregue (commit + push) ou liberada. Assim não há dois agentes nos mesmos arquivos nem no Git.

## Ciclo do líder

1. **Sincronizar:** `git fetch --all --prune` + `git pull --rebase origin main`; ler
   `tasks/STATUS.md` e `tasks/RECADOS.md`.
2. **Classificar:** subtarefas livres sem `- **Nível:**` → subagente `classificador-tarefas` com a
   lista de códigos. Conferir o relatório (nível plausível pelos sinais da skill
   `classificar-tarefa`; na dúvida, subir) e commitar:
   `docs(board): classificar <códigos> por <líder>`.
3. **Escolher UMA** subtarefa livre pela skill `proxima-task` (prioridade, dependências ✅, sem
   reserva nem 🔒). Tarefa **grande** (`ciclo-da-task.md`) sem plano aprovado → parar e pedir ao
   usuário.
4. **Reservar** em nome do executor, como frente própria — ex.:
   `Claude Code (Sonnet · executor-medio) (local · main) (desde <data hora>)` — e fazer
   `lock: assumindo sub-task <COD> por <frente do executor>` + push **antes** de delegar.
5. **Delegar** pelo nível: `LEVE` → `executor-leve`, `MEDIO` → `executor-medio`,
   `PESADO` → `executor-pesado`. Mandar: código, nome da reserva, descrição e critérios (seção da
   etapa) e a **lista exata de arquivos** que pode alterar.
6. **Conferir** o relatório e o diff: `git diff --name-only` só com os arquivos da lista (arquivo a
   mais → desfazer esse arquivo ou devolver ao executor); critérios atendidos.
7. **Validar** conforme `.claude/rules/testes-validacao.md` (comandos de validação do projeto
   quando mexer em código). Falhou → devolver ao executor com o erro (até 2 vezes) ou assumir a correção.
8. **Entregar:** seção da subtarefa com entrega e verificação; linha ✅ movida para o
   `tasks/task_complete.md`; **1 commit** `feat(<COD>): … por <frente do executor>` com os
   arquivos + quadro; push; mostrar a tela de pendentes (`git-quick.md`).
9. **Próxima:** voltar ao passo 1. Parar quando não houver subtarefa livre, quando o usuário pedir,
   ou quando a próxima precisar de decisão/autorização do usuário.

## Casos especiais

- **Banco de dados** (SQL, RLS, migração): o próprio líder faz, se a sessão tiver
  acesso ao banco; senão, liberar e anotar (`multiplas-ias.md`). Produção exige autorização do
  usuário.
- **Executor travou ou a subtarefa é maior que o nível:** liberar a reserva (`—` + `⬜ Pendente`),
  dividir ou reclassificar, anotar na seção e voltar ao passo 1.
- **Tipo de subagente indisponível** (ex.: sessão na nuvem sem o repositório registrado como raiz):
  usar um agente geral com o **modelo do nível** e o texto do `executor-*.md` correspondente no
  pedido.
- **Executor aponta problema fora da lista de arquivos:** o líder decide; se corrigir, registra no
  campo de entrega como "ajuste do líder".
- **Push recusado:** `fetch` + `pull --rebase`, reler o quadro e repetir o push. Nunca `--force`.

## Proibido

- ⛔ Mais de uma subtarefa em andamento ao mesmo tempo
  (fora do modo sargento: ver "Líder sargento" abaixo).
- ⛔ Executor ou classificador usando Git ou editando o quadro (fora a linha `Nível`).
- ⛔ Pular a reserva, o commit por subtarefa ou a validação.
- ⛔ Mudar prioridade, ou pegar subtarefa reservada por outra frente ou sob 🔒 trava especial.

## Líder sargento: equipe em paralelo, VIGIA e FINANCEIRO

Use este modo quando o usuário pedir que o líder aja como "sargento" ou "chief of staff", ou
quando apontar o `PROMPT_PARA_O_LIDER.md`. Ele muda só o que está escrito aqui. O resto da
skill (classificar, reservar, conferir, commitar) continua igual.

### 1. O líder só gerencia

- O líder levanta as subtarefas, define o objetivo e o critério de pronto de cada uma.
- O líder confere cada entrega, cuida do quadro e do Git, e commita.
- ⛔ O líder **não executa** subtarefa, nem a `PESADO`. Cada uma vai ao agente do nível (C22).

### 2. Paralelo

- Pode haver vários agentes ao mesmo tempo, mas **só** em subtarefas que:
  - não mexem nos mesmos arquivos;
  - não dependem uma da outra.
- Cada agente tem a sua reserva, com nome próprio.
- O líder commita **uma subtarefa por vez**, mesmo quando os agentes trabalharam juntos.
- Esta é uma exceção explícita ao "Modo: uma subtarefa por vez, na mesma pasta" acima.
  Só vale quando o modo sargento for pedido.

### 3. Onde rodam os agentes

- **No PC:** terminais do herdr
  (`rules-local/regras/herdr.md`). Um agente Claude Code por painel, com a
  conta e o modelo do nível (`LEVE` = Haiku, `MEDIO` = Sonnet, `PESADO` = Opus 5.5+ ou Fable).
- **Na nuvem (sem herdr):** subagentes do Claude Code do nível (`executor-leve`,
  `executor-medio`, `executor-pesado`).
- Painel novo só dentro do herdr e com pedido do usuário.

### 4. VIGIA (Haiku)

- Único papel: avisar o líder se um agente está **parado** ou **travado**.
- Critério sugerido: sem saída nem mudança de arquivo há **10 min**.
  - No herdr: o painel não muda há 10 min.
  - Na nuvem: o agente não manda notificação há 10 min.
- ⛔ O VIGIA não executa nada: não edita arquivo, não reserva e não commita.
- Ao receber o aviso, o líder cobra o agente. Se ele não responder, o líder o substitui:
  libera a reserva (`—` + `⬜ Pendente`) e manda outro agente do mesmo nível.

### 5. FINANCEIRO (Haiku)

- Único papel: acompanhar o uso restante da sessão de 5 horas e da semana de cada conta
  ou terminal.
  - No PC: lê o uso que cada terminal mostra.
  - Na nuvem: soma os tokens que cada subagente informa e compara com o orçamento
    que o usuário deu.
- ⛔ O FINANCEIRO não executa nada.
- Avisa o líder quando o uso chegar a **85%** do limite (critério sugerido).
- Ao receber o aviso, o líder:
  1. manda **cada agente** gravar a sua seção em `tasks/STATUS_TAREFAS_ANDAMENTO.md`;
  2. para de disparar agentes novos.
- Formato da seção de cada agente:
  - título: `## <agente> (<modelo> · <painel ou nuvem>) — <código>: <título>`;
  - `- **Situação:**` (em andamento, pronta, parada);
  - `- **Feito:**` (arquivos alterados);
  - `- **Verificação feita:**` (o que foi conferido);
  - `- **Falta:**`;
  - `- **Próximo passo:**` (ação exata para retomar).
- O líder commita esse arquivo. Só o líder mexe no Git.

### 6. Retomar

1. Quando os créditos voltarem, o líder lê `tasks/STATUS_TAREFAS_ANDAMENTO.md` primeiro.
2. Reabre os agentes, cada um no terminal ou conta que tem crédito.
3. Manda cada agente retomar pela própria seção, do ponto anotado em "Próximo passo".
4. Quem retoma não refaz o que já está em "Feito".
5. Depois segue o ciclo normal: conferir, validar e commitar uma subtarefa por vez.
