# 🔁 Ciclo de uma tarefa (TASK)

Reutilizável em qualquer projeto. Onde fica cada informação: `quadro.md`.

## O que vira TASK

- ✅ Todo pedido que **muda** arquivo, banco ou configuração vira TASK **antes** de executar.
- ❌ Pergunta, explicação ou análise que não muda nada **não** vira TASK: só responder.
  Se a resposta levar a mudanças, a TASK nasce quando o usuário pedir.

## 1. Abrir: criar → publicar → assumir → trabalhar

1. Sincronizar com o remoto (regras de git do projeto) e ler o `tasks/STATUS.md`.
2. **Criar:** a etapa (`quadro.md`), a linha da mãe e **no mínimo 1 subtarefa com nível** em
   "📌 Tarefas", e a linha em "🗂️ Etapas".
3. **Publicar:** commit + push do quadro com a tarefa nova.
4. **Assumir:** reservar a subtarefa que vai executar (`frentes-e-reserva.md`), commit + push.
5. **Pedir confirmação só se for necessário:** se faltar detalhe crítico, perguntar numa mensagem
   só (objetivo e resultado esperado, escopo, arquivos ou partes envolvidas, critério de pronto,
   prazo).
   - Não perguntar o que já está no pedido, no quadro ou no código.
   - Pedido completo → confirmar o entendimento em 1 frase e seguir.
   - ❌ Não assumir detalhe crítico em silêncio.

## 2. Pequena ou grande

| Tipo | Definição | Exige |
|------|-----------|-------|
| **Pequena** | Ajuste pontual em até ~3 arquivos, sem nada da linha de baixo | Etapa com 1 ou mais subtarefas |
| **Grande** | Mexe em **banco**, **segurança** (login, papéis, permissões, chaves), tem **várias partes**, cria estrutura/gerador novo, faz **mudança em massa** ou **apaga dados** | Plano na **própria etapa** + **aprovação** |

Na dúvida, é grande. O projeto pode definir exceções (rotinas já autorizadas).

**Tarefa grande — o plano é a etapa (nunca em `docs/`):**
1. Escrever na etapa: objetivo, escopo (entra / não entra), critério de pronto, premissas, riscos
   com plano B e as subtarefas com a verificação de cada uma.
2. Mostrar ao usuário um resumo (subtarefas, arquivos, riscos, verificações) e perguntar se está certo.
3. Esperar um **"sim" claro**; registrar a aprovação nas Decisões da etapa (quem, quando).
4. Executar **só o escopo aprovado**. Mudança material de escopo → atualizar a etapa e pedir
   **nova** aprovação.

## 3. Executar

- **Uma subtarefa por vez por frente**; terminar (ou liberar) antes de reservar outra.
- Atualizar **na hora**: `🔄` na linha ao reservar, `✅` ao entregar — nunca acumular.
- **Próximo passo** da seção da subtarefa sempre atualizado: é a última coisa a escrever ao parar
  e a primeira a ler ao retomar.
- Bloqueio → `⛔` na linha e motivo + o que destrava na seção, **na hora**. Depende do usuário → `👀`.
- Cada subtarefa com **verificação** (como foi conferido), conforme as regras de validação do projeto.
- Decisão tomada no caminho → Decisões da etapa (o quê, quando, quem, por quê); se valer para o
  projeto todo, também no "Registro de decisões" do `STATUS.md`.

## 4. Encerrar

1. **Subtarefa:** seção com entrega (commit) e verificação; linha com `✅` e "Em uso por" = `—`,
   **movida** do `STATUS.md` para o `tasks/task_complete.md` (regra em `quadro.md`).
2. **Tarefa-mãe:** quando todas as subtarefas estiverem ✅ (a última de tarefa grande é o **aceite**
   de quem pediu, 👀 até ele confirmar), a linha da mãe vira `✅` e também vai para o
   `task_complete.md`.
3. Pendências que ficaram para depois → "Pendências" do `STATUS.md`, com motivo.
4. Lição aprendida que vira regra → "Lições aprendidas" do `STATUS.md` (e a regra no lugar certo).
5. **Um commit por subtarefa entregue**, com o quadro no mesmo commit
   (e push, conforme a regra do projeto).
6. Responder **apenas**: **TAREFA FINALIZADA E SINCRONIZADA!** — sem resumo nem tabela
   (perguntas e bloqueios são respondidos normalmente). O projeto pode pedir algo antes da frase
   (ex.: a lista de pendentes depois do push).

## Retomar (sessão nova ou que caiu)

1. Ler o `STATUS.md` e achar a subtarefa com o nome da sua frente em "Em uso por".
2. Ler o **Próximo passo** da seção da subtarefa; conferir o que já foi feito (arquivos e commits) e
   **continuar de onde parou**.
3. ❌ Não recomeçar do zero, não refazer o que está ✅, não pular etapas.
