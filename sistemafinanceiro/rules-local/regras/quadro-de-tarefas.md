# 🗂️ Quadro de tarefas — fonte única, para qualquer projeto

Serve para qualquer projeto (nada específico de um projeto). Ciclo da tarefa:
`ciclo-da-task.md` · várias sessões/IAs: `frentes-e-reserva.md` · níveis: `niveis-e-modelos.md`.
Sem pasta `tasks/` no projeto: `STATUS.md` na raiz, no mesmo formato.
Raiz `C:\fontes`: o `tasks/` da raiz é o índice dos quadros dos projetos e guarda as tarefas
globais (C57, `raiz-fontes.md`).

> **Fonte única no banco (C58, 2026-11-01):** no `rules-ai` (e no `aulasenai`, quando ele fizer o
> corte) o quadro vive **só** nas tabelas `quadro_*` do Supabase, e **nenhuma tarefa fica em
> markdown**. Os **outros projetos continuam em `.md`** (formato simplificado da C55, abaixo) até
> migrarem, cada um por TASK própria.

## Onde mora o quadro de cada projeto

| Projeto | Fonte única do quadro | Desde quando |
|---|---|---|
| `rules-ai` | Tabelas `quadro_*` do Supabase "Projetos de IA" (`ubrvdzwywyxydcblghwz`) | Do corte (`cortado_em` preenchido em `quadro_projetos`) |
| `aulasenai` | As mesmas tabelas, com `projeto = 'aulasenai'` | Do corte dele (`cortado_em` preenchido) |
| Demais projetos | `tasks/STATUS.md` simplificado + etapas em `.md` (C55) | Até migrarem, por TASK própria |

- **Antes do corte** de um projeto, vale o `.md` dele (C55): o banco é só uma carga recarregada
  pelo migrador (`scripts/quadro_seed.py --aplicar`, idempotente) e **ninguém reserva nem entrega
  pelo banco** naquele projeto (só tarefa de teste, apagada no fim).
- **Depois do corte**, o banco é a única fonte: os `.md` de tarefa do projeto (`tasks/STATUS.md`,
  `tasks/STATUS-COMPLETO.md`, `tasks/task_complete.md`, `tasks/RECADOS.md`, `tasks/etapas/*.md`)
  deixam de existir. O histórico deles fica no Git, na tag `tasks-md-antes-da-api`.
- Regras (`regras/*.md`), documentação e `AGENTS.md`/`CLAUDE.md` **não** são tarefa: seguem
  em `.md`.

## Tarefa e subtarefa

- **Toda tarefa-mãe tem no mínimo 1 subtarefa** (`<TAREFA>.1`, `<TAREFA>.2`…), cada uma com
  **registro próprio** (no banco, uma linha de `quadro_tarefas` com `tipo = 'sub'`; em `.md`, um
  item do índice simplificado ou uma linha em "📌 Tarefas", no legado) e **nível**
  (`niveis-e-modelos.md`). Não existe tarefa-mãe sem subtarefa.
- O trabalho e a reserva são sempre numa **subtarefa**; a mãe não se reserva e fecha quando todas
  as subtarefas estiverem ✅.
- **Cada subtarefa pode ser assumida por qualquer IA/frente** do nível certo, independente das
  outras subtarefas da mesma mãe (respeitando dependências e reservas).

## Cada informação em um lugar só

**Projeto no banco** (`rules-ai`; `aulasenai` depois do corte). Id dos registros:
`<projeto>:<código>` (ex.: `rules-ai:MIGRAR-TAREFAS-API.24`).

| Informação | Lugar único |
|------------|-------------|
| Status, prioridade, modelo, nível, `effort`, dependências e reserva de cada tarefa e subtarefa, **aberta ou concluída** | Linha da tarefa em `quadro_tarefas` (`status_codigo`, `prioridade`, `modelo`, `nivel`, `effort`, `depende_de`, `em_uso_por`) |
| Tarefa ou subtarefa **concluída (✅)** | A mesma linha, com `status_codigo = 'concluido'` (não há arquivo de concluídas) |
| Pedido, objetivo, plano (tarefa grande), escopo, riscos e decisões da etapa | Linha da etapa em `quadro_etapas` (`pedido`, `objetivo`, `secoes`) |
| Requisitos, invariantes e perguntas abertas da spec (C34) | `quadro_requisitos`, `quadro_invariantes` e `quadro_perguntas` |
| Descrição, critérios, próximo passo, entrega e verificação de cada subtarefa | Colunas da subtarefa em `quadro_tarefas` |
| Tarefa que cada sessão está fazendo | `quadro_frentes` (e `em_uso_por` da subtarefa) |
| Decisões, riscos, bloqueios, pendências e lições do projeto | `quadro_decisoes`, `quadro_riscos`, `quadro_bloqueios`, `quadro_pendencias`, `quadro_licoes` |
| Recados entre sessões | `quadro_recados` (só se acrescentam linhas) |
| Projetos do quadro e se são monitorados | `quadro_projetos` (`status`, `monitorado`, `cortado_em`) |

**Projeto em `.md`** (os demais, e qualquer projeto antes do corte):

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
  pendências do usuário montada à mão, sem resumo com contagens. Projeto no banco: **sem espelho**
  do quadro em `.md` ou JSON no Git (nada de `STATUS.md` gerado, `api/db.json` ou export).
  Projeto em `.md`: sem cópia da fila em tabela de banco.
- ⛔ **Projeto em `.md`: no `STATUS.md` só ficam tarefas abertas ou em andamento.** Linha (mãe ou
  subtarefa) que vira ✅ é **recortada** do índice (ou do "📌 Tarefas") e colada no fim da tabela do
  `tasks/task_complete.md`, no **mesmo commit** da entrega (move, não copia). Reabrir = mover a
  linha de volta. No banco, a C4 vira **mudança de status** (`entregar`); reabrir é do usuário.
- O que o usuário precisa fazer = registros **👀** (`status_codigo = 'aguardando_usuario'` no
  banco; itens 👀 no `.md`): filtrar, não copiar.
- O que não está no quadro não aconteceu. Histórico nunca é apagado: no banco, nenhuma linha se
  apaga (cancelar é `status_codigo = 'cancelada'`); em `.md`, só se acrescentam etapas.
- Linguagem simples, que quem não é técnico entende.

## Legenda

⬜ Pendente · 🔄 Em progresso · ✅ Concluído · ⛔ Bloqueado (motivo + o que destrava) ·
👀 Aguardando o usuário · ❌ Cancelada · Prioridade: 🔴 Máxima · 🟠 Alta · 🟡 Média · 🟢 Baixa

No banco, cada emoji tem um `status_codigo`: ⬜ `pendente` · 🔄 `em_execucao` · ✅ `concluido` ·
⛔ `bloqueado` · 👀 `aguardando_usuario` · ❌ `cancelada`.

## Modelo do quadro no banco (Supabase)

Contrato dos campos: `api/SCHEMA.md`. SQL das tabelas, da segurança e das funções:
`database/quadro/` (arquivos numerados, na ordem de aplicação).

**Ler** (qualquer IA, local ou nuvem): `GET` nas tabelas `quadro_*` com `SUPABASE_URL` e
`SUPABASE_ANON_KEY` (chave pública; a RLS só deixa ler). Leitores prontos:
`scripts/gerenciador.mjs`, `dashboard/quadro_tarefas.py` e o dashboard (`dashboard/assets/js/`,
com Realtime).

**Escrever** só pelas funções RPC, atômicas (`UPDATE ... WHERE ... RETURNING`), com a chave de
serviço (`SUPABASE_SERVICE_KEY`) lida da variável de ambiente. Cliente em Node:
`scripts/quadro_cliente.mjs`.

| Ação | Função RPC | Exige |
|---|---|---|
| Reservar subtarefa | `reservar(p_id, p_frente, p_ia, p_modelo_ia)` | Livre, com nível, dependências ✅, do modelo de quem chama (C22, C50), 1 por frente |
| Entregar subtarefa | `entregar(p_id, p_frente, p_entrega, p_verificacao)` | Reserva da própria frente; entrega e verificação preenchidas |
| Criar subtarefa | `criar_subtarefa(p_mae, p_titulo, p_nivel, …)` | Só na mãe atual da frente (C26); nunca cria mãe |
| Criar tarefa-mãe (com a etapa) | `criar_tarefa_mae(p_projeto, p_codigo, p_titulo, p_criada_por, p_pedido, p_objetivo, p_prioridade, p_eh_grande)` | Cria a mãe e a etapa dela numa transação só (cliente: `criarTarefaMae` em `scripts/quadro_cliente.mjs`); a mãe nasce `pendente`, não reservável e sem nível; precisa de ao menos 1 subtarefa |
| Criar só a tarefa-mãe | `criar_mae(p_projeto, p_codigo, p_titulo, p_prioridade, p_pedido)` | Só a linha da mãe, sem etapa; código sem ponto, em MAIÚSCULAS com hífens; projeto existente em `quadro_projetos` |
| Liberar reserva | `liberar(p_id, p_frente, p_motivo)` | Reserva da própria frente (ou o usuário) |
| Bloquear, pedir ação do usuário, cancelar | `mudar_status(p_id, p_frente, p_para, …)` | Transições da seção 3 do `api/SCHEMA.md`; cancelar e sair de 👀 só o usuário |

- O **dashboard** usa as funções `ui_*` (`ui_criar_tarefa`, `ui_editar_tarefa`, `ui_cancelar_tarefa`,
  `ui_mudar_modelo`, `ui_mudar_projeto`), com o usuário logado: cada uma confere se o e-mail dele
  está em `quadro_usuarios` antes de gravar. As funções das IAs (tabela acima) são só da chave de
  serviço.
- A **reserva é a própria gravação** no banco: não existe mais commit `lock:` nem push de reserva
  no projeto que está no banco. O commit fica só para os arquivos que a subtarefa mudou.
- Resposta de toda RPC: `{ok, motivo, tarefa}`. `ok = false` → **não forçar**: ler o `motivo`
  (`ocupada`, `dependencia`, `modelo`, `frente_ocupada`, `trava`…) e escolher outra subtarefa.
- ⛔ Nenhum `INSERT`, `UPDATE` ou `DELETE` direto nas tabelas `quadro_*`, nem com a chave de
  serviço. Exceções: o migrador (`scripts/quadro_seed.py`) antes do corte e o rollback
  (`api/ROLLBACK-QUADRO.md`), ambos só por ordem do usuário.
- Escrita que ainda **não tem RPC** (gravar nível pelo Jev, anotar decisão, recado, frente ou
  seção de etapa) ganha a sua função na subtarefa que migra aquele escritor; até lá, não se grava
  à mão.
- ⛔ A chave de serviço nunca entra em arquivo, log, commit ou mensagem; só em variável de ambiente.
  O quadro não guarda segredo nem dado pessoal (INV-4).

### Quem não alcança o banco

- **Nuvem** (sessão sem a chave de serviço): **só lê**, com `SUPABASE_URL` e `SUPABASE_ANON_KEY`
  nas variáveis do ambiente. Não reserva, não entrega, não cria subtarefa: quando precisar disso,
  para e avisa o usuário que a ação é local (no `aulasenai`:
  `.claude/rules/tasks/nuvem-le-supabase.md`).
- **Sem rede ou Supabase fora do ar:** o quadro fica **indisponível**. Não há arquivo de queda:
  ninguém reserva, entrega ou cria tarefa, e ⛔ ninguém monta quadro paralelo em `.md` ou JSON. A
  IA avisa o usuário em 1 linha e espera o banco voltar.
- **Queda longa** ou dado perdido no banco: só o usuário decide rodar o rollback
  (`api/ROLLBACK-QUADRO.md`), que devolve o quadro aos `.md` pela tag `tasks-md-antes-da-api`.

## Modelo do `tasks/STATUS.md` — formato simplificado (projetos em `.md`, C55)

Um item por tarefa-mãe, com link para a etapa, e as subtarefas em lista recuada logo abaixo
(exemplo real: `aulasenai/tasks/STATUS.md`, antes do corte).

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

Válido durante a migração para o simplificado; os scripts leem os dois formatos.

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
  `LEVE · só Haiku 5.5 ou DeepSeek V4.1 Flash`, `MEDIO · só Sonnet`,
  `PESADO · só Opus 5.5+ ou Fable`); `Usuário` quando só o usuário pode fazer (nunca aceite, C32);
  `—` na mãe. ⛔ Só o modelo da coluna executa (`niveis-e-modelos.md`). No banco, o mesmo texto
  vai na coluna `modelo` de `quadro_tarefas`.
- **Em uso por:** `<IA (modelo)> (<frente>) (desde <data hora>)`, `—` (livre) ou
  `— (não reservável)` na mãe. No banco, `em_uso_por` nulo = livre.
- Seção sem conteúdo fica com a tabela vazia (não apagar o cabeçalho).

## Modelo do `tasks/task_complete.md` (projetos em `.md`)

```markdown
# ✅ Concluídas — <Projeto>
| Tarefa | Título | Prioridade | Modelo | Depende de | Status | Em uso por | Etapa |
```

## Modelo da etapa (uma por tarefa-mãe)

Em `.md`, um arquivo por etapa. No banco, os mesmos campos vão para a linha de `quadro_etapas`
(cabeçalho e seções) e para as colunas de cada subtarefa em `quadro_tarefas`.

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
