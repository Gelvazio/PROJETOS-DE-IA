# 🗂️ Quadro de tarefas — fonte única

Esta pasta (`.claude/rules/tasks/`) serve para **qualquer projeto**: não tem nada específico de um
projeto. Para usar em outro, copie a pasta e crie `tasks/STATUS.md`, `tasks/task_complete.md`
e `tasks/etapas/` pelos modelos abaixo. Ciclo da tarefa: `ciclo-da-task.md` · várias sessões/IAs: `frentes-e-reserva.md`.

## Tarefa e subtarefa

- **Toda tarefa-mãe tem no mínimo 1 subtarefa** (`<TAREFA>.1`, `<TAREFA>.2`…). Não existe tarefa-mãe
  sem subtarefa.
- O trabalho e a reserva são sempre numa **subtarefa**; a tarefa-mãe não se reserva e fecha quando
  todas as subtarefas estiverem ✅.
- **Cada subtarefa pode ser assumida por qualquer IA/frente**, independente das outras subtarefas da
  mesma mãe (respeitando dependências e reservas).

## Cada informação em um lugar só

| Informação | Lugar único |
|------------|-------------|
| Status, prioridade, dependências e reserva de cada subtarefa (e da mãe) **aberta ou em andamento** | Linha própria em "📌 Tarefas" do `tasks/STATUS.md` |
| Linha de tarefa ou subtarefa **concluída (✅)** | Tabela "✅ Concluídas" do `tasks/task_complete.md` |
| Pedido, objetivo, plano (tarefa grande), escopo, riscos, decisões | **Etapa** da tarefa-mãe: `tasks/etapas/ETAPA-NNN-<uuid8>-ASSUNTO.md` |
| Descrição, critérios, próximo passo, entrega e verificação de cada subtarefa | Seção da subtarefa dentro da etapa da mãe |
| Tarefa que cada sessão (frente) está fazendo | Linha da frente em "🧭 Frentes de trabalho" do `tasks/STATUS.md` (e coluna "Em uso por" do "📌 Tarefas") |
| Decisões, riscos, pendências e lições do projeto | Seções do `tasks/STATUS.md` |
| Recados entre sessões | `tasks/RECADOS.md` (só se acrescentam linhas) |

- ⛔ Não copiar para outro lugar: sem `TASKS.md`, sem plano separado em `docs/`, sem lista de
  pendências do usuário montada à mão, sem resumo com contagens, sem cópia da fila em tabela de banco.
- ⛔ **No `STATUS.md` só ficam tarefas abertas ou em andamento.** Linha (mãe ou subtarefa) que vira
  ✅ é **recortada** do "📌 Tarefas" e colada no fim da tabela do `tasks/task_complete.md`, no
  **mesmo commit** da entrega (move, não copia). Reabrir = mover a linha de volta.
- O que o usuário precisa fazer = linhas e itens **👀** (filtrar; não copiar).
- O que não está no quadro não aconteceu. Histórico nunca é apagado: só se acrescentam etapas.
- Quadro em formato antigo → migrar para este modelo levando o conteúdo, sem perder histórico.
- Linguagem simples, que quem não é técnico entende.

## Legenda

⬜ Pendente · 🔄 Em progresso · ✅ Concluído · ⛔ Bloqueado (motivo + o que destrava) ·
👀 Aguardando o usuário · Prioridade: 🔴 Máxima · 🟠 Alta · 🟡 Média · 🟢 Baixa

## Modelo do `tasks/STATUS.md`

```markdown
# STATUS — <Projeto>

**Objetivo:** <1 frase> · **Partes interessadas:** <quem decide / aprova / usa>
**Links:** [Regras](../AGENTS.md) · [Etapas](etapas/) · [Recados](RECADOS.md)

## 🧭 Frentes de trabalho   (uma linha por sessão; cada frente atualiza só a sua)
| Frente | Tarefa (etapa) | Situação | Atualizado em |

## 📌 Tarefas            (só abertas/em andamento; mãe em negrito + uma linha por subtarefa)
| Tarefa | Título | Prioridade | Modelo | Depende de | Status | Em uso por | Etapa |

## Escopo do projeto
## 🗂️ Etapas            (uma linha por etapa, criada junto com ela; nunca apagar)
| Etapa | Assunto | Arquivo |
## Riscos · ## Bloqueios gerais (sem tarefa) · ## Registro de decisões
## Pendências (ficou para depois) · ## Lições aprendidas
```

- **Status** na linha: só o emoji e 1–3 palavras (`🔄 Em execução`); o detalhe fica na etapa.
- **Modelo:** nível + modelo indicado para executar (ex.: `LEVE · Haiku 5.5`), pela matriz
  do projeto; `Usuário` quando quem faz é o usuário; `—` na mãe.
- **Em uso por:** `<frente> (desde <data hora>)`, `—` (livre) ou `— (não reservável)` na mãe.
- Seção sem conteúdo fica com a tabela vazia (não apagar o cabeçalho).

## Modelo do `tasks/task_complete.md`

```markdown
# ✅ Concluídas — <Projeto>
## ✅ Concluídas            (linhas recortadas do STATUS.md, sempre no fim da tabela)
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

- **Nível:** <nível> — <motivo> · **Modelo:** <ferramenta + modelo indicado>
- **Descrição:** …
- **Critérios de Aceitação:** …
- **Entrega:** <commit(s)> · **Verificação:** <como foi conferido>
- **Anotação:** …
```

- Número da etapa sequencial + 8 caracteres de um UUID (evita número repetido entre sessões).
- Subtarefas pequenas (minutos ou horas), na ordem de execução; em tarefa grande, a última é o
  **aceite do usuário**.
