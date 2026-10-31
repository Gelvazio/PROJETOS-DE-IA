# 🔄 Regras locais (`rules-local/`) — início da sessão e sincronização de tasks (C36)

Decidido em 2026-10-18 (C36; etapa 019 do `rules-ai`, RULES-LOCAL-GLOBAL). Vale para **todas as
IAs** e para todo projeto que tem a pasta `rules-local/` (repositórios com GitHub de `C:\fontes`,
fora `DEMAIS-PROJETOS-*`, `scripts` e o próprio `rules-ai`, que é a fonte).

## O que é o `rules-local/`

- Cópia das regras globais (`regras/` do GitHub `Gelvazio/rules-ai`), **versionada no Git** do
  projeto: funciona na nuvem e sem internet.
- `rules-local/VERSAO.md` é o **arquivo controlador** da pasta: versão (`AAAA-MM-DD-<código>`) e o
  código de cada regra. Só o script grava a pasta; a `VERSAO.md` sai **por último**.
- Arquivos: `VERSAO.md`, `regras/*.md` (inclui o `INDEX.md`), `RELATORIO.md` (última
  sincronização), os scripts `sessao.mjs`, `baixar.mjs`, `comparar.mjs`, `conferir.mjs`,
  `pacote.mjs`, `proxy.mjs`, a pasta `jev/` (código do Jev para o gancho, C44) e o `.gitignore`.
- ⛔ **Não editar o `rules-local/` à mão** (nem `regras/`, nem os scripts, nem `jev/`): o script
  restaura na sessão seguinte. Regra nova ou mudada se faz em `C:\fontes\rules-ai\regras\`, e
  código do Jev em `C:\fontes\rules-ai\scripts\jev\` (chegam aos projetos pela `VERSAO.md`).
- Na nuvem, sem `C:\fontes\rules-ai` nem `dist/`, as regras globais do projeto são as de
  `rules-local/regras/`, lidas na ordem do `rules-local/regras/INDEX.md`.

## O que vive no repositório (C44)

Decidido em 2026-10-20 (C44; etapa 030 do `rules-ai`, RULES-LOCAL-JEV). Cada projeto com
`rules-local/` tem no próprio Git tudo o que a sessão precisa, e isso se atualiza sozinho.

- A `VERSAO.md` traz duas tabelas: as **regras** e o **pacote** ("Pacote do rules-local").
- O **pacote** tem os scripts do próprio `rules-local/` e os arquivos do Jev que o gancho de
  prompt usa (só os que ele importa; sem testes nem benchmark).
- O `sessao.mjs` baixa e confere os dois pelo código da `VERSAO.md`. Assim o `rules-local/` se
  atualiza sozinho, inclusive os próprios scripts.
- Projeto com `sessao.mjs` antigo continua lendo só as regras. Ele passa a trazer o pacote depois
  de ser reinstalado **uma vez** pelo `scripts/instalar-rules-local.mjs` do `rules-ai`.
- Mudou só o pacote → aviso `pacote atualizado (…); regras iguais (…); nada a fazer.`. Esse aviso
  **não** dispara a sincronização de tasks.

### Gancho do Jev no projeto

- **Claude Code:** `UserPromptSubmit` no `.claude/settings.json` do projeto, com
  `node "$CLAUDE_PROJECT_DIR/rules-local/jev/ganchos/claude-prompt.mjs"`.
- **Codex:** `UserPromptSubmit` no `.codex/hooks.json` do projeto, com
  `node rules-local/jev/ganchos/codex-prompt.mjs`.
- Quem grava os dois é o `instalar-rules-local.mjs`, sem apagar os outros ganchos do projeto.
- `rules-local/jev/saidas/` (auditoria e marcas do Jev) fica fora do Git (`rules-local/.gitignore`).
- O gancho global da conta saiu: o gancho é só do projeto (`jev.md`, C43 e C44).

### O que fica fora do repositório

- A chave `TYPESAFE_API_KEY`: só em variável de ambiente. No PC, variável de ambiente do Windows.
  Na nuvem, nas configurações do ambiente. ⛔ Nunca num arquivo do projeto, nem num `.env` dele.
- O `codex_hooks = true` em `[features]` do `~/.codex/config.toml` (configuração do Codex na
  máquina, ligada à mão).

### Na nuvem

- Quando há `HTTPS_PROXY`, o `sessao.mjs` e o gancho se rodam de novo com `NODE_USE_ENV_PROXY=1`.
  Motivo: a saída direta da nuvem já entregou uma cópia velha da `main`.
- O `sessao.mjs` e o gancho nunca falham a sessão nem bloqueiam a mensagem (código 0).

## Início da sessão

1. **Rodar o script, uma vez, antes do primeiro pedido:**
   - **Claude Code:** o gancho `SessionStart` do `.claude/settings.json` roda sozinho
     `node "$CLAUDE_PROJECT_DIR/rules-local/sessao.mjs"`. Não rodar de novo.
   - **IAs sem gancho** (Gemini, Codex, Grok, DeepSeek, Copilot…): na raiz do projeto,
     `node rules-local/sessao.mjs` (o aviso do `AGENTS.md`/`CLAUDE.md` lembra).
2. **Ler as linhas que começam com `rules-local:`** e agir conforme a tabela:

| Aviso | O que a IA faz |
|---|---|
| `versão igual (…); nada a fazer.` | Nada. Segue para o pedido. |
| `sem acesso ao rules-ai (…)` | Segue com a versão local; diz isso ao usuário em 1 linha. |
| `nuvem inconsistente (…)` | Nada (o script não gravou nada); tenta na próxima sessão. |
| `outra sessão está sincronizando` | Nada; a outra sessão cuida da sincronização. |
| `erro inesperado: …` | Segue com a versão local; mostra a mensagem ao usuário em 1 linha. |
| `DISPARAR A SINCRONIZAÇÃO DE TASKS` | Faz a **sincronização de tasks** (abaixo) antes do pedido. |

- Só a frase **`DISPARAR A SINCRONIZAÇÃO DE TASKS`** dispara a sincronização. Os outros avisos
  não geram TASK nem commit.
- O script **nunca** faz commit nem usa Git: quem commita é a sessão (passo 5 abaixo).
- No Claude Code, o hook do ai-memory (quando ligado no projeto) roda **depois** do
  `rules-local/sessao.mjs`, para as regras sincronizarem antes do brief da memória; o aviso da
  memória não dispara nem substitui a sincronização de tasks (`memoria-ai.md`).

## Sincronização de tasks

É uma **rotina autorizada por esta regra**: não vira TASK. Só os ajustes que ela encontrar viram
TASK (pergunta 1-b da etapa 019).

1. **Sincronizar com o remoto** (`git pull --rebase`, `git-geral.md`). Se o Git recusar por causa
   das mudanças no `rules-local/`, descartar **só** elas (são geradas e o script refaz):
   `git restore --staged --worktree -- rules-local/` e `git clean -fd -- rules-local/`; depois
   sincronizar e rodar `node rules-local/sessao.mjs` de novo. Deu `versão igual` → outra sessão já
   sincronizou: fim.
2. **Mostrar o relatório** (`rules-local/RELATORIO.md`) ao usuário em quadro (C27), com uma
   coluna a mais, **Avaliação**: Situação · Arquivo · Código anterior · Código novo · Avaliação.
   Mostrar também a tabela **Restaurados**, quando tiver linhas.
3. **Avaliar cada item** (mudado, adicionado, removido) contra o projeto:
   - **Ver o que mudou:** mudado ou removido → `git diff -- rules-local/regras/<arquivo>`;
     adicionado → ler o arquivo inteiro em `rules-local/regras/`.
   - **Perguntar:** o projeto (`AGENTS.md`/`CLAUDE.md`, `.claude/rules/`, agentes, scripts,
     quadro, etapas abertas) precisa mudar para cumprir a regra nova ou deixar de seguir a
     removida?
   - **Avaliação** de cada item: `sem ajuste — <motivo em 1 frase>` ou
     `exige ajuste → <ID da TASK>`.
   - **Versão anterior `nenhuma`** (instalação ou pasta recriada): não há o que comparar; todos os
     itens ficam `sem ajuste — instalação` e nenhuma TASK é criada.
   - **Só Restaurados** (motivo `conferência falhou`): alguém editou a pasta à mão e o script
     restaurou; nenhuma TASK.
4. **Criar 1 TASK por regra que exige ajuste** no quadro **deste** projeto (`tasks/STATUS.md`, ou
   `STATUS.md` na raiz), pelo `ciclo-da-task.md` e pelo `quadro-de-tarefas.md`:
   - **Mãe nova** (exceção pontual à C26, autorizada pela C36): ID
     `RL-<código da versão nova>-<ARQUIVO>`, em maiúsculas e sem `.md` (ex.: versão
     `2026-10-18-ff11fc59` + `ciclo-da-task.md` → `RL-FF11FC59-CICLO-DA-TASK`).
   - **Título** cita a regra e a versão: `Ajustar o projeto à regra <arquivo> (rules-local
     <versão nova>)`.
   - **Etapa** com `**Pedido:**` = `sincronização de tasks do rules-local: <situação> <arquivo>,
     <versão anterior> -> <versão nova>`, o que mudou na regra e o que muda no projeto; **no mínimo
     1 subtarefa** com nível, modelo e `effort` (`niveis-e-modelos.md`, `esforco.md`); vários
     ajustes da mesma regra = várias subtarefas da mesma mãe.
   - **Sem repetir (R3.3):** antes de criar, procurar o ID no `STATUS.md` e no `task_complete.md`.
     Já existe (aberta ou concluída) → não criar; a Avaliação aponta para a que existe.
   - Prioridade 🟡 Média (o usuário muda se quiser). Tarefa grande segue o ciclo: plano na etapa e
     👀 até o "sim" do usuário.
   - ⛔ A sincronização **só cria** a TASK: não reserva nem executa. Quem pega segue o `;` e o
     modelo da coluna Modelo.
5. **Publicar num commit só:** `git add rules-local/` + os arquivos do quadro mudados (o
   `STATUS.md` e as etapas novas), pelo caminho; mensagem
   `chore(rules-local): versão <anterior> -> <nova> (<n> TASK nova) por <frente>`; depois
   `git push` (se o push for recusado, `git pull --rebase` e push de novo).
6. **Seguir para o pedido do usuário.** A resposta da sincronização é o quadro do passo 2, mais o
   quadro das TASKs criadas (Tarefa · Título · Modelo · Status), quando houver.

## Limites

- ⛔ Não editar regra dentro do `rules-local/`, nem a `VERSAO.md` (o script e a conferência
  desfazem).
- ⛔ Não criar TASK no quadro de outro projeto nem no `rules-ai`: cada projeto sincroniza o seu.
- ⛔ Não criar TASK por item `sem ajuste`, nem por aviso que não seja o da frase-gatilho.
- ⛔ Não rodar o script em pasta sem `rules-local/` (fora do escopo da C36): quem instala é o
  `scripts/instalar-rules-local.mjs` do `rules-ai`.
- Correção nos scripts do `rules-local/` chega pela `VERSAO.md` (pacote, C44). Só o projeto com
  `sessao.mjs` antigo precisa rodar o instalador de novo, uma vez.
