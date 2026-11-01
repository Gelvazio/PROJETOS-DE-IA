# 🗂️ Quadro de tarefas — fonte única

Esta pasta serve para **qualquer projeto**: copie-a e crie `tasks/STATUS.md` e `tasks/etapas/`
pelos modelos abaixo. Ciclo da tarefa: `ciclo-da-task.md` · várias sessões: `frentes-e-reserva.md`.

## Tarefa e subtarefa

- Toda tarefa-mãe tem **no mínimo 1 subtarefa** (`#N.1`, `#N.2`…), cada uma com **linha própria**
  em "📌 Tarefas", logo abaixo da mãe, e **nível** (`LEVE`/`MEDIO`/`PESADO`, regra de níveis do
  projeto).
- O trabalho e a reserva são sempre numa **subtarefa**; a mãe é `— (não reservável)` e fecha
  quando todas as subtarefas estiverem ✅. Cada subtarefa pode ser pega por **qualquer IA** do
  **seu modelo** (coluna Modelo), independente das outras (respeitando dependências e reservas).
- **Tarefas criadas antes deste modelo** (linha única + tabela de itens na etapa) continuam como
  estão; podem ser divididas em subtarefas quando alguém for pegá-las.

## Cada informação em um lugar só

| Informação | Lugar único |
|------------|-------------|
| Pedido, objetivo, escopo, riscos, decisões | **Etapa** da mãe: `tasks/etapas/ETAPA-NNN-<uuid8>-ASSUNTO.md` |
| Status, prioridade, dependências e reserva de cada subtarefa (e da mãe) **aberta ou em andamento** | Linha própria em "📌 Tarefas" do `tasks/STATUS.md` |
| Linha de tarefa ou subtarefa **concluída (✅)** | Tabela de `tasks/task_complete.md` |
| Nível, descrição, critérios, próximo passo, entrega e verificação de cada subtarefa | Seção da subtarefa na etapa da mãe |
| Tarefa que cada sessão está fazendo | Linha da frente em "🧭 Frentes" do `tasks/STATUS.md` |
| Decisões, riscos, pendências e lições do projeto | Seções do `tasks/STATUS.md` |
| Recados entre sessões | `tasks/RECADOS.md` (só se acrescentam linhas) |

- ⛔ Não copiar para outro lugar: sem `TASKS.md`, sem plano separado em `docs/`, sem lista de
  pendências do usuário montada à mão, sem cópia da fila em tabela de banco.
- ⛔ **No `STATUS.md` só ficam tarefas abertas ou em andamento.** Linha (mãe ou subtarefa) que vira
  ✅ é **recortada** do "📌 Tarefas" e colada no fim da tabela do `tasks/task_complete.md`, no
  **mesmo commit** da entrega (move, não copia). Reabrir = mover a linha de volta (C4).
- O que o usuário precisa fazer = linhas e itens **👀** (filtrar; não copiar).
- O que não está no quadro não aconteceu. Histórico nunca é apagado: só se acrescentam etapas.
- Linguagem simples, que quem não é técnico entende.

## Legenda

⬜ Pendente · 🔄 Em progresso · ✅ Concluído · ⛔ Bloqueado (motivo + o que destrava) ·
👀 Aguardando o usuário

## Modelo do `tasks/STATUS.md`

```markdown
# STATUS — <Projeto>

**Objetivo:** <1 frase> · **Partes interessadas:** <quem decide / aprova / usa>
**Links:** [Regras](../AGENTS.md) · [Etapas](etapas/) · [Recados](RECADOS.md)

## 🧭 Frentes de trabalho
| Frente | Tarefa (etapa) | Situação | Atualizado em |

## 📌 Tarefas            (mãe + uma linha por subtarefa logo abaixo)
| Tarefa | Título | Prioridade | Modelo | Depende de | Status | Em uso por | Etapa | Verificado |

## Escopo do projeto
## 🗂️ Etapas            (uma linha por etapa, criada junto com ela; nunca apagar)
| Etapa | Assunto | Arquivo |
## Riscos · ## Bloqueios gerais (sem tarefa) · ## Registro de decisões
## Pendências (ficou para depois) · ## Lições aprendidas
```

- **Status** na linha: só o emoji e 1–3 palavras (`🔄 Em execução`); o detalhe fica na etapa.
  **Prioridade:** 🔴 Máxima · 🟠 Alta · 🟡 Média · 🟢 Baixa (do usuário; a subtarefa herda a da mãe).
- **Modelo:** `<nível> · só <modelo>` (`LEVE · só Haiku`…); `—` na mãe.
  ⛔ Só esse modelo executa (regra de níveis).
- **Em uso por:** `<IA (modelo)> (<frente>) (desde <data hora>)`, `—` ou `— (não reservável)`.
- **Verificado:** `true` só depois do `verify` com prova (`verificacao.md`); senão `—`.
- Seção sem conteúdo: tabela vazia (não apagar o cabeçalho).

## Modelo da etapa (uma por tarefa-mãe)

```markdown
## Etapa NNN-<uuid8> — <título>

**Tarefa:** #NN-<uuid> · **Pedido em:** AAAA-MM-DD HH:MM · **Criada por:** <IA (frente)>
**Pedido:** <palavras de quem pediu>
**Objetivo:** <1 frase: o que e por quê>

### Escopo · ### Riscos · ### Decisões     ← só em tarefa grande (o plano é a etapa)

### #NN.1 — <título da subtarefa>

**Próximo passo:** <ação exata>

- **Nível:** MEDIO — <sinal que decidiu>
- **Modelo:** só Sonnet — nunca outro
- **Descrição:** … · **Critérios de aceitação:** …
- **Entrega:** <commit(s)> · **Verificação:** <como foi conferido>
```

- Arquivo da etapa: número sequencial da etapa + 8 caracteres de um UUID (evita número repetido).
- Subtarefas numeradas pelo **número da tarefa** (`N.x`, ex.: `166.1`), pequenas (minutos ou
  horas) e na ordem de execução. Sem subtarefa de aceite do usuário: a IA finaliza sempre.
- Tarefa com mais de uma etapa (ou duas tarefas com o mesmo número): a numeração segue entre
  as etapas (ex.: as duas #131: `131.1`, `131.2` na 1ª; `131.3`, `131.4` na 2ª).
