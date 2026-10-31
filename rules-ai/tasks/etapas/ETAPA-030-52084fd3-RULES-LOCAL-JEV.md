## Etapa 030-52084fd3 — RULES-LOCAL-JEV: regras e Jev vivem dentro de cada repositório

**Tarefa:** RULES-LOCAL-JEV · **Pedido em:** 2026-10-20 07:10 · **Criada por:** Claude Code (Opus 5.5) (nuvem · main)
**Pedido:** "eu quero que estas regras globais, *vivam* dentro de cada repositorio comom um *clone*
que se auto atualiza a cada inicio de sessão, tem como fazer isso?" → "por que o texto das regras
nao vem junto?" → "sim, crie a tarefa e apague os ramos"
**Objetivo:** cada projeto com `rules-local/` passa a ter, versionado no próprio Git, tudo o que hoje
depende do computador do usuário (texto das regras, código do Jev e gancho de prompt), atualizado
sozinho no início de cada sessão, no PC e na nuvem. Só a chave (`TYPESAFE_API_KEY`) fica fora do Git.

### Situação hoje (conferido em 2026-10-20 07:10)

- O `rules-local/` (C36) já copia `regras/*.md` da `main` do GitHub a cada sessão (gancho
  `SessionStart` no Claude Code; à mão nas outras IAs).
- **Defeito na nuvem:** sem o proxy, o `fetch` do Node recebe uma cópia velha da `main`
  (`825288c1` no lugar de `39b490d0`, mesmo depois do cache de 5 min e com `?t=` na URL). Pelo
  proxy (`NODE_USE_ENV_PROXY=1`) ou pedindo o arquivo pelo commit, vem a versão atual.
- O código do Jev (`scripts/jev/`) e o gancho de prompt só existem no `rules-ai` e no
  `settings.json` da conta do usuário (`sincronizar.mjs --aplicar`, JEV-GLOBAL-AI-FINAL .11/.12).

### Escopo

- **Entra:** correção do download na nuvem; o `rules-local/` passa a trazer também o código do Jev
  (`rules-local/jev/`) conferido pela `VERSAO.md`; gancho `UserPromptSubmit` no
  `.claude/settings.json` **do projeto** e no `.codex/hooks.json` **do projeto**, apontando para
  `rules-local/jev/`; leitura da chave só do ambiente (e do `.env` do `rules-ai` no PC); regra
  `regras/rules-local.md` e decisão **C44**; reinstalação nos projetos com `rules-local/`; ensaio
  no PC e na nuvem; decidir o destino do gancho global da conta (para não chamar o Jev duas vezes).
- **Não entra:** a chave dentro de qualquer repositório; mudar o modelo `jev-1.13.0`; projetos em
  `DEMAIS-PROJETOS-*` (C20, C23); o `codex_hooks = true` do `~/.codex/config.toml` (é configuração
  do Codex na máquina, não do projeto).

### Riscos

| Risco | Plano B |
|---|---|
| Gancho do projeto e gancho global da conta rodam juntos (Jev chamado 2 vezes, custo dobrado) | o gancho grava uma marca por `hash` da mensagem e sai na 2ª chamada; ou o `sincronizar.mjs` deixa de instalar o global (pergunta 1) |
| Chave vazar para o repositório do projeto | o código só lê do ambiente/`.env` do `rules-ai`; `.gitignore` com `.env`; guardrail de segredo no `conferir.mjs`; `git grep` da chave na verificação |
| Cópia do Jev (≈ 4.500 linhas) pesa em cada repositório | só os arquivos que o gancho usa (sem `benchmarks/` e `testes/`); pergunta 3 |
| Mudança em massa quebra a sessão de algum projeto | o `sessao.mjs` nunca falha a sessão (código 0); `rules-local/` refeito pelo script; reinstalação em 1 projeto antes dos outros |
| Proxy da nuvem muda de comportamento | download pelo commit da `main` (não depende do proxy) |

### Requisitos

| ID | Requisito (EARS) | Cobre | Verificação |
|----|------------------|-------|-------------|
| R1.1 | QUANDO uma sessão começa na nuvem, O SISTEMA DEVE baixar a versão atual da `main` do `rules-ai` | .1 | sessão nova na nuvem: `VERSAO.md` local = a do GitHub |
| R1.2 | O SISTEMA DEVE trazer o código do Jev para `rules-local/jev/` e conferir cada arquivo pelo código da `VERSAO.md` | .2 | `conferir.mjs` ok; arquivo editado à mão é restaurado |
| R2.1 | QUANDO o usuário envia uma mensagem no Claude Code ou no Codex, num projeto com `rules-local/`, O SISTEMA DEVE rodar o gancho do Jev do próprio projeto, sem `--aplicar` | .3, .4 | mensagem numa sessão nova do projeto traz o contexto do Jev |
| R2.2 | O SISTEMA DEVE chamar o Jev no máximo 1 vez por mensagem | .5 | auditoria: 1 linha por `hash` com os dois ganchos ligados |
| R3.1 | O SISTEMA DEVE ler a `TYPESAFE_API_KEY` só do ambiente ou do `.env` da raiz do `rules-ai`, nunca de arquivo do projeto | .6 | `git grep` da chave = 0 em cada projeto |
| R4.1 | QUANDO a regra mudar, O SISTEMA DEVE gravar o arquivo global de cada IA e a `VERSAO.md` | .7, .9 | `sincronizar.mjs --aplicar` |

### Invariantes

| ID | Regra que vale sempre | Como conferir |
|----|----------------------|---------------|
| INV-1 | A chave nunca vai para o Git de nenhum projeto | `git grep` da chave em cada projeto = 0 |
| INV-2 | O `sessao.mjs` e o gancho nunca falham a sessão nem bloqueiam a mensagem (código 0) | rodar sem rede, sem chave e com JSON ruim |
| INV-3 | O `rules-local/` só é gravado pelo script (C36) | `conferir.mjs` restaura edição à mão |

### Perguntas abertas

| # | Pergunta | Resposta | Fechada em | Quem respondeu |
|---|----------|----------|------------|----------------|
| 1 | O gancho **global** da conta (JEV-GLOBAL-AI-FINAL .11) continua para os projetos sem `rules-local/`, ou sai e fica só o do projeto? | **Só o do projeto**: o gancho global da conta sai; o `sincronizar.mjs` deixa de instalá-lo e tira a entrada do Jev se já existir | 2026-10-20 07:18 | Gelvazio (chat) |
| 2 | Vale para todos os projetos que já têm `rules-local/` (os 20 da RULES-LOCAL-GLOBAL) ou só para os 5 de hoje? | **Todos** os projetos com `rules-local/`: 8 repositórios no GitHub (template-inicial-tasks-ia, aulasenai, dashboard-ai, PLATAFORMA-ENVIO-CURRICULOS, rea-app-clones, gerenciador-de-ia, testes-de-frontend, testes-effort-padaria); os clones de `C:\fontes` recebem pelo `git pull` | 2026-10-20 07:18 | Gelvazio (chat) |
| 3 | A cópia do Jev em cada projeto pode ter ≈ 30 arquivos (só o que o gancho usa)? | **Sim** (só os arquivos que o gancho importa) | 2026-10-20 07:18 | Gelvazio (chat) |
| 4 | No PC, a chave fica numa variável de ambiente do Windows (vale para todos os projetos) ou só no `.env` do `rules-ai`? | **Variável de ambiente** do Windows: a cópia do Jev nos projetos lê a chave só do ambiente (nenhum `.env`) | 2026-10-20 07:18 | Gelvazio (chat) |

### Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-20 07:10 | Tarefa criada com o plano; nível das 9 subtarefas pelo Jev real (`jev.mjs classificar --id`, `jev-1.13.0`, custo US$ 0,0004); o líder só eleva: .3, .4 e .9 para PESADO (configuração e mudança em massa). Ficam 2 MEDIO (.1, .5) e 7 PESADO. Aguarda o "sim" e as 4 respostas | Claude Code (Opus 5.5) | pedido do usuário ("sim, crie a tarefa"); tarefa grande (mudança em massa e chave) |
| 2026-10-20 07:18 | Plano aprovado ("sim, aprovo; 1 só do projeto, 2 todos, 3 sim, 4 variável"). Desenho: a `VERSAO.md` ganha a tabela dos arquivos do Jev (a lista sai das importações do `ganchos/claude-prompt.mjs`, sem testes nem benchmark) e o código da versão passa a cobri-los; o `sessao.mjs` baixa `scripts/jev/<arquivo>` para `rules-local/jev/<arquivo>`; dentro de `rules-local/jev/` a chave vem só do ambiente e `saidas/` fica fora do Git; na nuvem, o `sessao.mjs` e o gancho se rodam de novo com `NODE_USE_ENV_PROXY=1` quando há `HTTPS_PROXY` (a saída direta da nuvem entregou cópia velha da `main`) | Gelvazio · Claude Code (Opus 5.5) | respostas do usuário no chat; ensaio de 2026-10-20 07:30 (pelo proxy, versão atual na hora) |

### RULES-LOCAL-JEV.1 — Download atual na nuvem (`baixar.mjs` e `sessao.mjs`)

**Próximo passo:** em `scripts/rules-local/baixar.mjs`, descobrir o commit atual da `main` e baixar
os arquivos por ele; se houver `HTTPS_PROXY` sem `NODE_USE_ENV_PROXY`, usar o proxy.

- **Nível:** MEDIO — Jev `MEDIO`, final proposto `MEDIO`, confiança 0.85, ação `sugestao_automatica`
- **Modelo:** só Sonnet — nunca outro (C22)
- **Effort:** medium
- **Arquivos:** `scripts/rules-local/baixar.mjs`, `scripts/rules-local/sessao.mjs`
- **Critérios de aceitação:** R1.1; INV-2 (sem rede → `sem acesso`, código 0).
- **Entrega:** Claude Code (Sonnet 5.5 · executor-medio; líder Opus 5.5) — `scripts/rules-local/proxy.mjs` (e cópia `scripts/jev/proxy.mjs`): com `HTTPS_PROXY` e sem `NODE_USE_ENV_PROXY`, o `sessao.mjs` e o gancho se rodam de novo com o proxy ligado; no PC nada muda · **Verificação (líder):** cópia do `rules-local/` do `dashboard-ai` na nuvem: `VERSÃO NOVA 2026-10-18-988f933e -> 2026-10-19-39b490d0` (antes vinha a cópia velha `825288c1`); gancho com o Jev real: código 0, stderr vazio (R1.1, INV-2)
- **JEV-AI-SUGGESTION:** NAO

### RULES-LOCAL-JEV.2 — `rules-local/jev/`: o código do Jev conferido pela `VERSAO.md`

**Próximo passo:** acrescentar à `VERSAO.md` (gerada pelo `sincronizar.mjs`) a lista dos arquivos do
Jev usados pelo gancho, com código, e fazer o `sessao.mjs` baixar e conferir essa pasta.

- **Nível:** PESADO — Jev `MEDIO`, final proposto `PESADO`, confiança 0.74, ação `revisar`, sinais de PESADO: mais_de_3_arquivos
- **Modelo:** só Opus 5.5+/Fable ou DeepSeek — nunca outro (C22)
- **Effort:** high
- **Arquivos:** `scripts/sincronizar.mjs`, `scripts/rules-local/sessao.mjs`, `scripts/rules-local/conferir.mjs`
- **Critérios de aceitação:** R1.2; INV-3.
- **Entrega:** Claude Code (Opus 5.5 · líder) — `scripts/pacote-rules-local.mjs` (lista os scripts do `rules-local/` e os arquivos do Jev pelas importações dos ganchos: 30 arquivos), tabela "Pacote do rules-local" na `VERSAO.md` pelo `sincronizar.mjs` (fora do código da versão, para os scripts antigos continuarem lendo), `conferir.mjs` lê e confere o pacote, `scripts/rules-local/pacote.mjs` baixa/confere/grava e põe `jev/saidas/` no `.gitignore`; o `sessao.mjs` integra tudo · **Verificação (líder):** projeto falso servido do `rules-ai` local: regras + 30 arquivos gravados, 2ª sessão `versão igual`, `conferirPasta` íntegro; arquivo do Jev editado à mão é restaurado; `sessao.mjs` ANTIGO do `dashboard-ai` com a `VERSAO.md` nova: lê as regras e ignora o pacote (R1.2, INV-3)
- **JEV-AI-SUGGESTION:** NAO

### RULES-LOCAL-JEV.3 — Gancho do Claude Code no `.claude/settings.json` do projeto

**Próximo passo:** o `instalar-rules-local.mjs` acrescenta o `UserPromptSubmit` com
`node "$CLAUDE_PROJECT_DIR/rules-local/jev/ganchos/claude-prompt.mjs"`, sem apagar ganchos do projeto.

- **Nível:** PESADO — Jev `MEDIO`, final proposto `MEDIO`, confiança 0.52, ação `humano`; elevado pelo líder: grava gancho no `settings.json` dos projetos (configuração, como a JEV-GLOBAL-AI-FINAL.11)
- **Modelo:** só Opus 5.5+/Fable ou DeepSeek — nunca outro (C22)
- **Effort:** high
- **Arquivos:** `scripts/instalar-rules-local.mjs`, `.claude/settings.json` dos projetos
- **Critérios de aceitação:** R2.1; JSON válido; ganchos existentes preservados.
- **Entrega:** Claude Code (Opus 5.5 · líder) — `scripts/instalar-rules-local.mjs`: `GANCHOS_CLAUDE` (SessionStart + `UserPromptSubmit` com `node "$CLAUDE_PROJECT_DIR/rules-local/jev/ganchos/claude-prompt.mjs"`, timeout 10) acrescentados sem apagar ganchos; resposta 1: `scripts/jev/ganchos/instalar.mjs` agora só REMOVE o gancho global da conta · **Verificação (líder):** instalação num projeto falso (cópia do `testes-de-frontend`): `settings.json` com SessionStart 2, UserPromptSubmit 2, PreToolUse 1 (antigos preservados); gancho do projeto respondeu com o Jev real (MEDIO, 0,80); pasta de usuário falsa: só o Jev global saiu, `.bak` gravado, 2ª rodada `igual` (R2.1)
- **JEV-AI-SUGGESTION:** NAO

### RULES-LOCAL-JEV.4 — Gancho do Codex no `.codex/hooks.json` do projeto

**Próximo passo:** mesmo do .3 para o `.codex/hooks.json` do projeto (o Codex junta o global e o do
projeto); conferir o formato na versão instalada do Codex.

- **Nível:** PESADO — Jev `MEDIO`, final proposto `MEDIO`, confiança 0.49, ação `humano`; elevado pelo líder: grava gancho no `.codex/hooks.json` dos projetos (como a .3)
- **Modelo:** só Opus 5.5+/Fable ou DeepSeek — nunca outro (C22)
- **Effort:** high
- **Arquivos:** `scripts/instalar-rules-local.mjs`, `.codex/hooks.json` dos projetos
- **Critérios de aceitação:** R2.1; JSON válido.
- **Entrega:** Claude Code (Opus 5.5 · líder) — `GANCHOS_CODEX` no instalador: `.codex/hooks.json` do projeto com `node rules-local/jev/ganchos/codex-prompt.mjs` (o Codex roda na raiz do projeto); o global do Codex sai pelo `sincronizar.mjs` · **Verificação (líder):** `.codex/hooks.json` criado e JSON válido no projeto falso; formato do Codex conferido só pelo resumo da busca (PR #14626): conferir no Codex instalado (R2.1)
- **JEV-AI-SUGGESTION:** NAO

### RULES-LOCAL-JEV.5 — Uma chamada ao Jev por mensagem

**Próximo passo:** no `classificar.mjs`, marca por `hash` da mensagem (em `saidas/`, fora do Git)
para a 2ª chamada da mesma mensagem em poucos segundos sair sem chamar o Jev.

- **Nível:** MEDIO — Jev `MEDIO`, final proposto `MEDIO`, confiança 0.98, ação `sugestao_automatica`
- **Modelo:** só Sonnet — nunca outro (C22)
- **Effort:** medium
- **Arquivos:** `scripts/jev/mensagem/classificar.mjs`, `scripts/jev/testes/mensagem.mjs`
- **Critérios de aceitação:** R2.2; INV-2.
- **Entrega:** Claude Code (Sonnet 5.5 · executor-medio; líder Opus 5.5) — `scripts/jev/mensagem/repetida.mjs` (`JANELA_REPETIDA_MS = 10000`, marca por `hash` em `saidas/`) usado no `classificar.mjs`: a mesma mensagem não chama o Jev 2 vezes · **Verificação (líder):** caso novo no `testes/mensagem.mjs`: 2 chamadas iguais → 1 requisição; texto diferente chama; falha da marca não derruba; com o Jev real, a 2ª execução igual não imprimiu nada (R2.2)
- **JEV-AI-SUGGESTION:** NAO

### RULES-LOCAL-JEV.6 — Chave só do ambiente ou do `.env` do `rules-ai`

**Próximo passo:** no `config.mjs` copiado para os projetos, procurar o `.env` em
`C:\fontes\rules-ai` (ou `JEV_ARQUIVO_ENV`) e nunca na pasta do projeto; `.env` no `.gitignore`.

- **Nível:** PESADO — Jev `PESADO`, final proposto `PESADO`, confiança 0.86, ação `revisar`, sinais de PESADO: segredo
- **Modelo:** só Opus 5.5+/Fable ou DeepSeek — nunca outro (C22)
- **Effort:** high
- **Arquivos:** `scripts/jev/config.mjs`, `.gitignore` dos projetos
- **Critérios de aceitação:** R3.1; INV-1.
- **Entrega:** Claude Code (Opus 5.5 · líder) — `scripts/jev/config.mjs`: na cópia do projeto (`…/rules-local/jev/`) a chave vem SÓ do ambiente (`ESTA_EM_PROJETO`; nenhum `.env`), resposta 4 do usuário; `jev/saidas/` fora do Git · **Verificação (líder):** gancho do projeto sem a variável → "Jev indisponível", código 0; com a variável → Jev real; chave em 0 arquivos do projeto falso; `git status --ignored` mostra `rules-local/jev/saidas/` ignorada (R3.1, INV-1)
- **JEV-AI-SUGGESTION:** NAO

### RULES-LOCAL-JEV.7 — Regra `rules-local.md` e decisão C44

**Próximo passo:** escrever em `regras/rules-local.md` o que vive no repositório (regras, Jev,
gancho) e o que fica fora (chave, `codex_hooks`), a C44 no `CONFLITOS.md` e a linha no `INDEX.md`.

- **Nível:** PESADO — Jev `LEVE`, final proposto `PESADO`, confiança 0.55, ação `humano`, sinais de PESADO: mais_de_3_arquivos
- **Modelo:** só Opus 5.5+/Fable ou DeepSeek — nunca outro (C22)
- **Effort:** high
- **Arquivos:** `regras/rules-local.md`, `regras/jev.md`, `CONFLITOS.md`, `regras/INDEX.md`
- **Critérios de aceitação:** o texto cobre R1.1–R3.1 e INV-1–INV-3.
- **Entrega:** Claude Code (Opus 5.5 · executor-pesado; líder Opus 5.5) — `regras/rules-local.md` (seção `## O que vive no repositório (C44)`: pacote, gancho do projeto, o que fica fora, nuvem; lista de arquivos e limites atualizados), `regras/jev.md` (gancho do projeto, `--aplicar` tira o global, chave só do ambiente na cópia, marca de 10 s, rollback), C44 no `CONFLITOS.md` e `regras/INDEX.md`; o líder corrigiu a hora da aprovação (07:18, apontada pelo próprio executor) · **Verificação (líder):** diff lido pelo líder; `sincronizar.mjs` gerou a versão nova com a C44 no `dist/`; INV-1 ok
- **JEV-AI-SUGGESTION:** NAO

### RULES-LOCAL-JEV.8 — Reinstalar o `rules-local/` nos projetos

**Próximo passo:** rodar o `instalar-rules-local.mjs` primeiro num projeto (`testes-de-frontend`),
conferir, e depois nos outros da resposta da pergunta 2; um commit por projeto, na `main`.

- **Nível:** PESADO — Jev `PESADO`, final proposto `PESADO`, confiança 0.13, ação `humano`
- **Modelo:** só Opus 5.5+/Fable ou DeepSeek — nunca outro (C22)
- **Effort:** high
- **Arquivos:** `rules-local/`, `.claude/settings.json`, `.codex/hooks.json` dos projetos
- **Critérios de aceitação:** R1.2, R2.1; `conferir.mjs` ok em cada um.
- **Entrega:** Claude Code (Opus 5.5 · líder) — `instalar-rules-local.mjs` nos 8 repositórios, na `main`: testes-de-frontend `5ef21e3` (piloto), template-inicial-tasks-ia `32f420a`, dashboard-ai `05c6a24`, PLATAFORMA-ENVIO-CURRICULOS `72193ea`, gerenciador-de-ia `0be7036`, testes-effort-padaria `594a472`, rea-app-clones `51a78c7`, aulasenai `87b058c`; todos em `2026-10-20-58881388`. Sincronização de tasks: 1 TASK nova (`RL-58881388-NIVEIS-E-MODELOS` no REA: matriz da skill desatualizada); no aulasenai o `jev.md` aponta para a #295 que já existe (tirar o Laya); o resto sem ajuste · **Verificação (líder):** 8/8 `rules-local íntegro (versão 2026-10-20-58881388)`; ganchos antigos preservados (diff lido no piloto); 0 `.env`/`saidas` nos commits; clone NOVO do piloto tirado do GitHub: `versão igual` e o gancho do projeto respondeu com o Jev real (R1.2, R2.1)
- **JEV-AI-SUGGESTION:** NAO

### RULES-LOCAL-JEV.9 — Levar às IAs e ensaio no PC e na nuvem

**Próximo passo:** conferência de 2026-10-23 feita (ver Verificação): `--aplicar` já rodado, gancho
global antigo fora das 4 contas, `TYPESAFE_API_KEY` já está no Windows (escopo Usuário) e o gancho
do projeto já responde no PC com o Jev real. A subtarefa pode ser dada como ✅. Único item que só o
usuário faz, fora dos critérios R1.1/R2.1/R2.2/R4.1 e do Claude Code: ligar `codex_hooks = true`
em `[features]` do `~/.codex/config.toml` (hoje só existe `[features]`), para o gancho do Codex
valer; vai para as Pendências do `STATUS.md` (a decidir pelo líder).

- **Nível:** PESADO — Jev `MEDIO`, final proposto `MEDIO`, confiança 0.20, ação `humano`; elevado pelo líder: `--aplicar` grava o arquivo global de todas as IAs (mudança em massa, como a JEV-GLOBAL-AI-FINAL.22)
- **Modelo:** só Sonnet ou DeepSeek — nunca outro (C22) (trocado do Opus em 2026-10-23, RECLASSIFICAR-PESADO-OPUS.2)
- **Effort:** high
- **Arquivos:** `dist/`, `VERSAO.md`, esta etapa
- **Critérios de aceitação:** R1.1, R2.1, R2.2, R4.1 com números.
- **Entrega:** Claude Code (Opus 5.5 · líder) — parte da nuvem: `sincronizar.mjs` gerou `2026-10-20-58881388` (C44 no `dist/`); sessão nova num clone novo do piloto atualizou sozinha pelo proxy e o 1º prompt trouxe o contexto do Jev real. Falta no PC: `node scripts/sincronizar.mjs --aplicar` (grava as regras nas IAs e TIRA o gancho global antigo) e a variável `TYPESAFE_API_KEY` no Windows · **Verificação (líder):** nuvem: R1.1 (versão da `main` na hora), R2.1 e R2.2 (marca de 10 s) conferidos; PC: aguardando o usuário
- **Verificação (conferência de 2026-10-23, Claude Code Sonnet 5.5, só leitura):**
  - R4.1: `node scripts/sincronizar.mjs` (sem `--aplicar`) → `versão sem mudança: 2026-10-23-df176636`
    e `igual` nas 13 entradas (4 contas do Claude Code, Gemini, Codex, Grok, Qoder, opencode,
    Devin, Kiro, Hermes, Kilo). Gemini, Codex, Grok, Qoder, opencode, Devin, Kiro, Hermes e Kilo:
    10 ocorrências de `C44` e 2 de `C46` em cada arquivo. As 4 contas do Claude Code importam
    `@C:/fontes/rules-ai/dist/REGRAS-GLOBAIS.md`, que tem 10 `C44` e 2 `C46`. `VERSAO.md` local =
    `origin/main` (`git show origin/main:VERSAO.md`), HEAD = `origin/main` (`92d29ef`).
  - Gancho global antigo: a prévia diz `sem o Jev global` nas 4 contas; `grep jev|claude-prompt`
    nos 4 `settings.json` = 0; `~/.codex/hooks.json` não existe (`pulado`).
  - R2.1 no PC: `aulasenai`, `DASHBOARD-AI-PRINCIPAL` e `testes-de-frontend` têm
    `rules-local/VERSAO.md`, `rules-local/jev/ganchos/claude-prompt.mjs` e `UserPromptSubmit` no
    `.claude/settings.json` apontando para `rules-local/jev/ganchos/claude-prompt.mjs` (mais
    `.codex/hooks.json`; `aulasenai` com `codex-prompt.mjs`). Auditoria do `aulasenai`
    (`mensagens-2026-10.jsonl`): 211 linhas desde 2026-10-20, última 2026-10-23 16:42Z com
    `decisao: matriz/jev`, `confianca` e custo reais (ex.: `latencia_ms` ~300, `custo_usd` ~3e-5).
  - R2.2: no mesmo arquivo, 211 linhas e 183 `hash`; a única repetição em até 10 s é uma linha
    `pulado/repetida` (custo 0) — 0 chamadas duplicadas ao Jev.
  - Chave: `TYPESAFE_API_KEY` existe no processo (`true`) e no escopo Usuário do Windows (`true`;
    Máquina `false`); `.env` da raiz do `rules-ai` existe. `git grep -c -F` da chave nos 3 projetos
    = 0 (INV-1). O valor nunca foi impresso.
  - Observação: o `rules-local/VERSAO.md` desses 3 projetos está em versões de 23/10 mais velhas
    (`4f19d945`, `a7fe983a`, `265a119a`) que a `df176636` de hoje 17:48; atualizam sozinhas na
    próxima sessão (R1.1/R1.2, `sessao.mjs`), sem ação do usuário.
  - Não conferível por leitura: `codex_hooks = true` ausente no `~/.codex/config.toml` (só
    `[features]`) → R2.1 no Codex depende dessa linha, ligada à mão pelo usuário.
- **JEV-AI-SUGGESTION:** NAO
