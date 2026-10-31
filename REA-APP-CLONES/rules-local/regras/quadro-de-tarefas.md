# 🗂️ Quadro de tarefas — fonte única, para qualquer projeto

Serve para qualquer projeto (nada específico de um projeto). Ciclo da tarefa:
`ciclo-da-task.md` · várias sessões/IAs: `frentes-e-reserva.md` · níveis: `niveis-e-modelos.md`.
Sem pasta `tasks/` no projeto: `STATUS.md` na raiz, no mesmo formato.

> **Formato oficial (C55, 2026-10-26):** o `tasks/STATUS.md` é um **índice simplificado** (modelo
> "formato simplificado" abaixo). O formato em tabela é **legado**: segue válido durante a migração
> (os scripts leem os dois) e cada projeto migra o seu por TASK própria.

## Tarefa e subtarefa

- **Toda tarefa-mãe tem no mínimo 1 subtarefa** (`<TAREFA>.1`, `<TAREFA>.2`…), cada uma com
  **item próprio** no índice simplificado (ou linha própria em "📌 Tarefas", no legado) e **nível** (`niveis-e-modelos.md`). Não existe tarefa-mãe sem
  subtarefa.
- O trabalho e a reserva são sempre numa **subtarefa**; a mãe não se reserva e fecha quando todas
  as subtarefas estiverem ✅.
- **Cada subtarefa pode ser assumida por qualquer IA/frente** do nível certo, independente das
  outras subtarefas da mesma mãe (respeitando dependências e reservas).

## Cada informação em um lugar só

| Informação | Lugar único |
|------------|-------------|
| Status, prioridade, modelo, dependências e reserva de cada subtarefa (e da mãe) **aberta ou em andamento** | Item próprio do índice simplificado do `tasks/STATUS.md` (**fonte única**; legado: linha em "📌 Tarefas") |
| Histórico detalhado do quadro (quando o projeto tiver) | `tasks/STATUS-COMPLETO.md`: só leitura, sem reserva nem status editado à mão |
| Linha de tarefa ou subtarefa **concluída (✅)** | Tabela "✅ Concluídas" do `tasks/task_complete.md` |
| Pedido, objetivo, plano (tarefa grande), escopo, riscos, decisões | **Etapa** da mãe: `tasks/etapas/ETAPA-NNN-<uuid8>-ASSUNTO.md` |
| Nível, descrição, critérios, próximo passo, entrega e verificação de cada subtarefa | Seção da subtarefa dentro da etapa da mãe |
| Tarefa que cada sessão está fazendo | Linha da frente em "🧭 Frentes" do `tasks/STATUS.md` (e "Em uso por") |
| Decisões, riscos, pendências e lições do projeto | Seções do `tasks/STATUS.md` |
| Recados entre sessões | `tasks/RECADOS.md` (só se acrescentam linhas) |

- ⛔ Não copiar para outro lugar: sem `TASKS.md`, sem plano separado em `docs/`, sem lista de
  pendências do usuário montada à mão, sem resumo com contagens, sem cópia da fila em tabela de banco.
- ⛔ **No `STATUS.md` só ficam tarefas abertas ou em andamento.** Linha (mãe ou subtarefa) que vira
  ✅ é **recortada** do índice (ou do "📌 Tarefas") e colada no fim da tabela do `tasks/task_complete.md`, no
  **mesmo commit** da entrega (move, não copia). Reabrir = mover a linha de volta.
- O que o usuário precisa fazer = linhas e itens **👀** (filtrar; não copiar).
- O que não está no quadro não aconteceu. Histórico nunca é apagado: só se acrescentam etapas.
- Linguagem simples, que quem não é técnico entende.

## Legenda

⬜ Pendente · 🔄 Em progresso · ✅ Concluído · ⛔ Bloqueado (motivo + o que destrava) ·
👀 Aguardando o usuário · Prioridade: 🔴 Máxima · 🟠 Alta · 🟡 Média · 🟢 Baixa

## Modelo do `tasks/STATUS.md` — formato simplificado (oficial, C55)

Um item por tarefa-mãe, com link para a etapa, e as subtarefas em lista recuada logo abaixo
(exemplo real: `aulasenai/tasks/STATUS.md`).

```markdown
# STATUS — <Projeto> (Simplificado)

**Objetivo:** índice simplificado com links para cada tarefa.
**Status completo:** [STATUS-COMPLETO.md](STATUS-COMPLETO.md)

## Tarefas

- #<ID> — [<título>](etapas/ETAPA-NNN-<uuid8>-ASSUNTO.md) · <status> · <Em uso por>
  - #<ID>.<n> — <título> · <status> · `<NIVEL>` · só <modelo> (<observação>)
```

- O `tasks/STATUS.md` é a **fonte única** de status e reserva: reservar, entregar e bloquear é
  sempre editar o item dele.
- **Mãe:** `<Em uso por>` = `— (não reservável)`. **Subtarefa:** a reserva vai na observação
  (`<IA (modelo)> (<frente>) (desde <data hora>)`); sem ela, a subtarefa está livre.
- **Status:** emoji + 1–3 palavras; dependência, prioridade ou motivo curto entre parênteses
  (`⬜ Pendente (depende da #399)`). Subtarefa sem nível: `nível a classificar pelo Jev` (C52).
- O `tasks/STATUS-COMPLETO.md` (quando existir) é **só histórico detalhado**: sem reserva e sem
  status editado à mão; em divergência, vale o `STATUS.md`.
- Concluídas continuam saindo do índice para o `tasks/task_complete.md` (C4).
- Frentes, decisões, riscos, pendências e lições seguem em seções do próprio `STATUS.md`, abaixo
  de "Tarefas".

## Modelo do `tasks/STATUS.md` — formato em tabela (legado)

Válido durante a migração; os scripts leem os dois formatos.

```markdown
# STATUS — <Projeto>
**Objetivo:** <1 frase> · **Partes interessadas:** <quem decide / aprova / usa>
**Links:** [Regras](../AGENTS.md) · [Etapas](etapas/) · [Concluídas](task_complete.md) · [Recados](RECADOS.md)

## 🧭 Frentes de trabalho
| Frente | Tarefa (etapa) | Situação | Atualizado em |

## 📌 Tarefas            (só abertas/em andamento; mãe em negrito + uma linha por subtarefa)
| Tarefa | Título | Prioridade | Modelo | Depende de | Status | Em uso por | Etapa |

## Escopo do projeto · 🗂️ Etapas · Riscos · Bloqueios gerais · Registro de decisões
## Pendências (ficou para depois) · Lições aprendidas
```

- **Status** na linha: só o emoji e 1–3 palavras (`🔄 Em execução`); o detalhe fica na etapa.
- **Modelo** (obrigatória em toda linha de subtarefa): `<nível> · só <modelo>` (ex.:
  `LEVE · só Haiku 5.5 ou DeepSeek V4.1 Flash`, `MEDIO · só Sonnet`, `PESADO · só Opus 5.5+ ou Fable`); `Usuário` quando só o
  usuário pode fazer (nunca aceite, C32); `—` na mãe. ⛔ Só o modelo da coluna executa (`niveis-e-modelos.md`).
- **Em uso por:** `<IA (modelo)> (<frente>) (desde <data hora>)`, `—` (livre) ou
  `— (não reservável)` na mãe.
- Seção sem conteúdo fica com a tabela vazia (não apagar o cabeçalho).

## Modelo do `tasks/task_complete.md`

```markdown
# ✅ Concluídas — <Projeto>
| Tarefa | Título | Prioridade | Modelo | Depende de | Status | Em uso por | Etapa |
```

## Modelo da etapa (uma por tarefa-mãe)

```markdown
## Etapa NNN-<uuid8> — <TAREFA>: <título>
**Tarefa:** <TAREFA> · **Pedido em:** AAAA-MM-DD HH:MM · **Criada por:** <IA (frente)>
**Pedido:** <palavras de quem pediu>
**Objetivo:** <1 frase: o que e por quê>
### Escopo · ### Riscos · ### Decisões     ← só em tarefa grande (o plano é a etapa)

### <TAREFA>.1 — <título da subtarefa>
**Próximo passo:** <ação exata>
- **Nível:** <nível> — <motivo curto>
- **Modelo:** só <modelo> — nunca outro
- **Descrição:** … · **Critérios de Aceitação:** …
- **Entrega:** <commit(s)> · **Verificação:** <como foi conferido> · **Anotação:** …
```

- Número da etapa sequencial + 8 caracteres de um UUID (evita número repetido entre sessões).
- Subtarefas pequenas (minutos ou horas), na ordem de execução; sem subtarefa de aceite do
  usuário (C32: a IA sempre aceita).
