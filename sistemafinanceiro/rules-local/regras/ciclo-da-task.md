# 🔁 Ciclo de uma tarefa (TASK)

Vale para qualquer projeto e para todas as IAs. Onde fica cada informação: `quadro-de-tarefas.md`.
"Linha" do quadro = item do índice simplificado do `STATUS.md` (C55) ou linha da tabela
(legado).

## O que vira TASK

- ✅ Todo pedido que **muda** arquivo, banco ou configuração vira TASK **antes** de executar.
- ❌ Pergunta, explicação ou análise que não muda nada **não** vira TASK: só responder.

## Ordem de todo pedido: criar → publicar → assumir → trabalhar

1. Sincronizar com o remoto e ler o `tasks/STATUS.md`.
2. **Criar:** a etapa, a linha da mãe e **no mínimo 1 subtarefa**, e a linha em "🗂️ Etapas". ⛔ **Sem
   escrever nível, modelo nem `effort`: quem classifica é sempre o Jev** (seção abaixo, C52).
3. **Publicar:** commit + push do quadro com a tarefa nova.
4. **Assumir:** reservar a subtarefa que vai executar (`frentes-e-reserva.md`), commit + push.
5. **Pedir confirmação só se for necessário:** se faltar detalhe crítico, perguntar numa mensagem
   só (objetivo e resultado esperado, escopo, arquivos, critério de pronto). Não perguntar o que
   já está no pedido, no quadro ou no código; pedido completo → confirmar o entendimento em 1 frase
   e seguir. ❌ Não assumir detalhe crítico em silêncio.

## 🧠 O Jev AI escolhe o modelo: sempre, sem exceção (C52)

Decidido em 2026-10-24 (C52, tarefa JEV-SEMPRE; pedido do usuário). Vale para **todas as IAs e
todos os projetos** e vence qualquer atalho. Detalhe do Jev: `jev.md`.

- ⛔ **NUNCA, JAMAIS nenhuma IA escolhe nível, modelo ou `effort` de tarefa ou subtarefa por conta
  própria.** Nem "pelos sinais", nem "porque é óbvio", nem "só ampliando para Haiku ou DeepSeek".
- ✅ **Quem cria ou divide uma tarefa** escreve a seção da subtarefa **sem** `Nível`, `Modelo` e
  `Effort` (na linha do quadro, Modelo = `— (a classificar pelo Jev)`) e **roda o Jev**:
  `node scripts/jev.mjs classificar --id <ID> --gravar`. O que o Jev gravar é o que vale.
- ✅ **Mudar quem pode pegar** uma subtarefa (ampliar ou restringir a coluna Modelo) também passa
  pelo Jev (`--reclassificar`) ou por **ordem escrita do usuário**, citada nas Decisões da etapa.
- ⛔ **Jev indisponível** (sem `TYPESAFE_API_KEY`, `JEV_MODO=off`, rede, 401, 429, 529, timeout): a
  subtarefa **fica sem nível**, **ninguém a pega**, e a IA avisa o usuário e tenta de novo depois.
  A IA **nunca escolhe no lugar do Jev**.
- ⛔ Nível escrito por IA sem o Jev é **infração**, igual à da regra maior: reclassificar pelo Jev.
- A skill `classificar-tarefa` e a tabela de sinais **não** substituem o Jev: servem para entender a
  resposta dele, não para decidir.

## Pequena ou grande

| Tipo | Definição | Exige |
|------|-----------|-------|
| **Pequena** | Ajuste pontual em até ~3 arquivos, sem nada da linha de baixo | Etapa com 1 ou mais subtarefas |
| **Grande** | Mexe em **banco**, **segurança** (login, papéis, permissões, chaves), tem **várias partes**, cria estrutura/gerador novo, faz **mudança em massa** ou **apaga dados** | Plano na **própria etapa** + **aprovação** |

Na dúvida, é grande. O projeto pode definir exceções (rotinas já autorizadas).

**Tarefa grande — o plano é a etapa (nunca em `docs/`):**
1. Escrever na etapa: objetivo, escopo (entra / não entra), critério de pronto, premissas, riscos
   com plano B e as subtarefas (com nível) e a verificação de cada uma.
2. Mostrar ao usuário um resumo (subtarefas, arquivos, riscos, verificações) e perguntar se está certo.
3. Esperar um **"sim" claro**; registrar a aprovação nas Decisões da etapa (quem, quando).
4. Executar **só o escopo aprovado**. Mudança material de escopo → atualizar a etapa e pedir
   **nova** aprovação.

## Executar

- **Uma subtarefa por vez por frente**; terminar (ou liberar) antes de reservar outra.
- ⛔ **Nunca executar subtarefa que não é do seu modelo** (coluna Modelo; `niveis-e-modelos.md`),
  nem a pedido; o pedido fora do seu modelo vira subtarefa livre para o modelo certo.
- ✅ **Trabalho novo descoberto no caminho vira subtarefa da mãe atual** (C26, 2026-10-17): a IA
  que está numa subtarefa pode criar **subtarefas novas só dentro da mãe atual**
  (`<TAREFA>.<próximo número>`), com nível, modelo e `effort`, seção na etapa (descrição, critérios
  e próximo passo) e linha (ou item do índice simplificado) `⬜` livre no `STATUS.md`, e **publica direto** (commit + push do quadro,
  sem esperar aprovação do usuário). Não reserva a nova (segue na sua) e ⛔ **nunca cria
  tarefa-mãe nova**: trabalho fora da mãe atual → avisar o usuário. Na equipe de agentes do Claude
  Code, o executor avisa o líder, e o líder cria e publica.
- Atualizar **na hora**: `🔄` na linha ao reservar, `✅` ao entregar — nunca acumular.
- **Próximo passo** da seção da subtarefa sempre atualizado: é a última coisa a escrever ao parar
  e a primeira a ler ao retomar.
- Bloqueio → `⛔` na linha e motivo + o que destrava na seção, **na hora**. Depende do usuário → `👀`.
- Cada subtarefa com **verificação** (como foi conferido), conforme as regras de validação.
- Decisão tomada no caminho → Decisões da etapa (o quê, quando, quem, por quê); se valer para o
  projeto todo, também no "Registro de decisões" do `STATUS.md`.

## Encerrar

1. **Subtarefa:** seção com entrega (commit) e verificação; linha com `✅` e "Em uso por" = `—`,
   **movida** do `STATUS.md` para o `tasks/task_complete.md`; linha da frente atualizada.
2. **Tarefa-mãe:** quando todas as subtarefas estiverem ✅, a linha da mãe vira `✅` e também vai
   para o `task_complete.md`.
   - ⛔ **Sem aceite do usuário** (C32, 2026-10-17): a IA **sempre aceita** e **nunca pergunta**.
     Não se cria subtarefa "Aceite do usuário" nem se deixa entrega 👀 esperando confirmação:
     quem entrega confere (campo Verificação) e fecha. Aceite que já existe no quadro é fechado
     pela própria IA ao aplicar esta regra.
   - O 👀 fica só para o que **só o usuário pode fazer** (ação no computador dele, autorização de
     produção, aprovação do plano de tarefa grande, resposta a uma dúvida). Isso não é aceite.
3. Pendências que ficaram para depois → "Pendências" do `STATUS.md`, com motivo.
4. Lição aprendida que vira regra → "Lições aprendidas" do `STATUS.md` (e a regra no lugar certo).
5. **Um commit por subtarefa entregue**, com o quadro no mesmo commit (e push, conforme a regra
   do projeto). Na **equipe de agentes** do Claude Code (C41), quem confere, commita e dá o push da
   entrega é o **Haiku**; problema na conferência não vira commit, vira a subtarefa
   `Verificação: <problema>` da mesma mãe (`MEDIO · só Sonnet`). Detalhe em
   `niveis-e-modelos.md` (Equipe de agentes).
6. Responder **apenas**: **TAREFA FINALIZADA E SINCRONIZADA!** — sem resumo nem tabela
   (perguntas e bloqueios são respondidos normalmente). O projeto pode pedir algo antes ou depois
   da frase (ex.: a lista de pendentes depois do push).

## Retomar (sessão nova ou que caiu)

1. Ler o `STATUS.md`: linha da sua frente e a subtarefa com o seu nome em "Em uso por".
2. Ler o **Próximo passo** da seção da subtarefa; conferir o que já foi feito (arquivos e commits)
   e **continuar de onde parou**.
3. ❌ Não recomeçar do zero, não refazer o que está ✅, não pular etapas.
4. Se o projeto tiver o ai-memory ligado, usar o brief/handoff dele **só depois** dos passos
   acima e só como complemento; se divergir do quadro, vale o quadro (`memoria-ai.md`).
