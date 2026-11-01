# 🔎 Verificação do quadro (`verify`)

Reutilizável em qualquer projeto com este quadro (`quadro.md`). Pedida em 2026-10-16 (#248).

## Gatilho

- Mensagem do usuário **só com `verify`** (ou o comando `/verify`) = rodar a verificação completa
  do quadro abaixo. Vale para todas as IAs.
- É uma tarefa que muda o quadro: segue o ciclo (`ciclo-da-task.md`), sem pedir aprovação de novo
  (a regra já é a autorização). Respeita a trava de modelo: a parte de banco só a IA com acesso.

## 1. Conflitos no quadro

Sincronizar com o remoto e conferir:

| O que | Conflito quando |
|---|---|
| Linhas de "📌 Tarefas" | ✅ que ficou no `STATUS.md`; linha quebrada ou com número de colunas errado; tarefa repetida |
| Reservas ("Em uso por") | reserva em linha ✅ ou ⛔; frente reservando mais de 1 subtarefa; reserva parada (> 24 h sem commit da frente) |
| Dependências | subtarefa 🔄/✅ com dependência que não está ✅ |
| Etapas | linha sem etapa (ou link quebrado); etapa sem linha em "🗂️ Etapas"; subtarefa sem `Nível`/`Modelo` |
| Frentes | frente 🔄 Ativa sem reserva; reserva sem linha de frente |
| Git | `stash` ou `rebase` esquecido; arquivo do quadro com marca de conflito (`<<<<<<<`) |

Conflito achado → anotar no relatório; correção que só mexe no quadro e é óbvia (ex.: mover ✅
para o `task_complete.md`) pode ser feita; o resto vira tarefa nova. ⛔ Nunca mexer na reserva de
outra frente (só relatar).

## 2. O que foi feito foi aplicado mesmo?

Para cada linha **✅ ou 👀 de aceite** com a coluna **Verificado** vazia (`—`):

1. Ler o **Pedido** e a **Entrega** da etapa.
2. Conferir com prova: o commit existe (`git log`/`git show`); os arquivos têm a mudança
   (leitura, `grep`); `node --check`/`py_compile` passam; banco **só por consulta** de leitura e
   só pela frente com acesso ao banco. Sem navegador: o que só a tela mostra → "conferir na tela".
3. Resultado na etapa, seção `### Verificação (verify, <data hora>)`:
   **✅ Feito** (prova), **⚠️ Parcial** (o que falta) ou **❌ Não feito**.
4. Só **✅ Feito** recebe `true` na coluna **Verificado**; parcial ou não feito continua `—`
   e o que falta vira tarefa nova.

Linhas já com `true` não são conferidas de novo (só quando o usuário pedir `verify tudo`).

## 3. Entrega

- Um commit com o quadro e as etapas anotadas (regras de git do projeto; visualizador só com
  pedido explícito).
- Resposta ao usuário: conflitos achados, quantas linhas viraram `true`, parciais e não feitas
  (com o número da tarefa) e o que precisa dele (👀).
