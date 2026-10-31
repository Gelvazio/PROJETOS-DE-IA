# 🤝 Várias IAs no mesmo projeto

Regras que completam `tasks/frentes-e-reserva.md` (genérico). Ajuste ao projeto quando precisar.

## Tamanho das subtarefas

- Cada subtarefa cabe em poucos minutos de trabalho de uma IA: 1 função, 1 método, 1 componente,
  1 classe, 1 arquivo ou 1 seção de documentação.
- Percebeu que é maior → **dividir** antes de codificar (novas linhas no `STATUS.md`), em vez de
  entregar pela metade.

## Nível das subtarefas

- Toda subtarefa tem um **nível** — `LEVE` (fácil), `MEDIO` (média) ou `PESADO` (difícil) — como 1º
  item da sua seção na etapa: `- **Nível:** MEDIO — motivo curto`. Quem cria ou divide a subtarefa
  classifica pela skill [`classificar-tarefa`](../../.agents/skills/classificar-tarefa/SKILL.md)
  (na dúvida, sobe o nível). Subtarefa sem nível: classificar antes de pegar.
- Junto do nível vai o **modelo indicado** (`· **Modelo:** Claude Code Haiku 5.5 (ou …)`), tirado
  da matriz da skill; no `STATUS.md` ele aparece na coluna `Modelo` (`LEVE · Haiku 5.5`), para o
  usuário abrir outra sessão com o modelo certo.
- Cada frente se identifica como **ferramenta + modelo** (o nome da frente) e pega subtarefa
  **até o máximo do seu nível**: o máximo da sua linha na matriz da skill (fonte única da matriz).
  Modelo forte só pega nível mais leve **se não houver nenhuma livre do seu nível** (regra global
  C2, 2026-10-16; substitui o "só o seu nível" da ETAPA-010). O `.githooks/pre-commit` **recusa** a
  reserva acima do nível e só **avisa** quando é mais leve (`git-quick.md`).
- **`PESADO` é só do modelo mais forte da matriz** (hoje: Claude Code com Opus 5.5 ou superior, ou
  Fable).

## Equipe de agentes do Claude Code

- Skill [`liderar-equipe`](../../.agents/skills/liderar-equipe/SKILL.md): o líder reserva, delega
  ao executor do nível (`executor-leve`, `executor-medio`, `executor-pesado`), confere, valida e
  commita.
- **Uma subtarefa por vez, na mesma pasta**; cada executor conta como frente com nome próprio; só o
  líder mexe no Git e no quadro — exceto o agente `classificador-tarefas`, que só acrescenta a
  linha `- **Nível:**` nas seções das etapas (o líder commita).

## Tarefas de banco de dados

- É "de banco": criar ou alterar SQL, schema, trigger, função, RLS ou migração; consultas; suítes
  do banco; aplicar scripts; validar telas contra um banco real.
- Qualquer frente pode pegar. **O que muda é o acesso, não a permissão:** a sessão que não
  conseguir falar com o banco entrega o que der, registra na seção da subtarefa o que não conseguiu
  conferir e deixa o resto para quem tiver — ou pede ajuda ao usuário.
- ⚠️ **Produção é protegida:** aplicar SQL, criar usuário ou gravar dados no banco de **produção**
  exige **autorização explícita do usuário**, qualquer que seja a IA.
- Dá para dividir: a parte sem banco (frontend, documentação) vira subtarefa separada.

## Trava especial

- Linha com `🔒 Trava especial (só o usuário libera)` em "Em uso por": nenhuma IA pega a tarefa nem
  as subtarefas, qualquer que seja a prioridade. Só o usuário cria ou remove.

## Hooks do Claude Code que exigem a tarefa

- `exigir-reserva.mjs` (antes de `Edit`/`Write`): barra a edição de arquivo do projeto fora de
  `tasks/` quando não há no `STATUS.md` subtarefa `🔄 Em execução` de **Claude Code**. Abrir e
  reservar a tarefa (`tasks/ciclo-da-task.md`) libera; `tasks/` fica sempre livre para isso.
- `lembrar-task.mjs` (a cada pedido): lembrete curto da regra no contexto.
- `sincronizar-main.sh` (ao abrir a sessão): `fetch` + `pull --rebase` da `main` quando é seguro.
- `inicializar-sessao.mjs` (ao abrir, logo depois do anterior): lista as subtarefas livres do
  nível do modelo da sessão. **No primeiro pedido, a sessão mostra a lista e reserva e começa a
  primeira sem perguntar** (pedido do usuário, ETAPA-008), salvo retomar reserva própria ou o
  usuário pedir outra coisa.
- **Não pegam:** outras IAs (os hooks são só do Claude Code), edição por comando no terminal
  (`sed -i`, `>`) e qual sessão Claude Code reservou. A regra continua valendo para todos.
- Erro do hook libera a edição. `IA_SEM_TRAVA=1` desliga a trava, só com pedido do usuário
  (registrar na seção da subtarefa).
