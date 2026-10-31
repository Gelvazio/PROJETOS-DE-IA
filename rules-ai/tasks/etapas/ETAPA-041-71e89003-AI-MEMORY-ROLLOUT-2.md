## Etapa 041-71e89003 — AI-MEMORY-ROLLOUT-2: continuação do ai-memory

**Tarefa:** AI-MEMORY-ROLLOUT-2 · **Pedido em:** 2026-10-23 12:37 · **Criada por:** Claude Code (Opus 5.5 · sargento herdr w2:p1) (local · main · rules-ai)
**Pedido:** "1, pode criar a tarefa nova" (separar da AI-MEMORY-INTEGRATION o que depende do usuário)
**Objetivo:** guardar, sem executar, o que ficou da AI-MEMORY-INTEGRATION: rollout nos outros projetos, captura nas outras IAs e repositório privado do wiki.

### Escopo

- **Entra:** as 7 subtarefas abaixo, vindas da AI-MEMORY-INTEGRATION (etapa 038), com o mesmo nível, modelo e critérios.
- **Não entra:** nada novo; o que já foi feito está na etapa 038 (`ETAPA-038-bc7a00ec-AI-MEMORY-INTEGRATION.md`).
- **Nível:** tarefa grande (herda o plano aprovado da etapa 038); a .1 e a .3 a .6 só começam com novo pedido do usuário.

### Decisões

- 2026-10-23 12:37: tarefa criada pelo líder com o "sim" do usuário; nenhuma subtarefa reservada. A .1 (outros projetos) está adiada pelo usuário; a .2 e a .7 são do usuário.
- 2026-10-23 12:48: **decisão do usuário na .2: opção A — só o Claude Code grava na memória.** Canceladas a .3, a .4, a .5 e a .6 (hooks e auditoria das outras IAs). Reabrir exige novo pedido; a matriz das IAs está em `docs/AI-MEMORY-HOOKS-POR-IA.md`.

### AI-MEMORY-ROLLOUT-2.1 — Rollout nos demais projetos de `C:\fontes` (`REA-APP-CLONES`, `projeto-frontend-com-testes`, `testes-de-frontend`)

**Próximo passo:** ⛔ adiada pelo usuário em 2026-10-23 12:26 ("o resto farei depois"); destrava só com novo pedido dele.

- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** sinais
- **Descrição:** Aplicar projeto a projeto, só nos que têm `rules-local` e remoto Git: `REA-APP-CLONES`, `projeto-frontend-com-testes`, `testes-de-frontend`.
- **Arquivos:** `.ai-memory.toml` de cada projeto
- **Critérios de Aceitação:** Quadro com projeto, resultado e auditoria de cada um; nenhum projeto proibido tocado.
- **Depende de:** Nenhuma
- **Verificação:** a preencher na entrega.
- **Origem:** era a AI-MEMORY-INTEGRATION.24 (movida em 2026-10-23 12:37).

### AI-MEMORY-ROLLOUT-2.2 — Escolher o modo de captura das outras IAs (allowlist recomendado) e liberar o uso de hooks em todas

**Próximo passo:** nenhum — decidido pelo usuário.

- **Nível:** Usuário — só o usuário decide
- **Modelo:** Usuário
- **Effort:** — (decisão do usuário)
- **Descrição:** O usuário quer hooks em todas as IAs. A .30 mostrou que só o Claude Code tem escopo por projeto; nas outras o hook é global. Escolher: (B) `install-hooks --capture-mode allowlist`, que só captura repositórios com `.ai-memory.toml` (recomendado); ou (C) global sem filtro (não recomendado). Registrar a escolha em Decisões.
- **Critérios de Aceitação:** Modo escolhido e registrado em Decisões da etapa.
- **Entrega:** decisão do usuário em 2026-10-23 12:48: **opção A, deixar como está — só o Claude Code grava na memória**; Codex, Gemini CLI, Devin, Antigravity, Kimi Code, OpenCode e DeepSeek continuam sem captura.
- **Verificação:** resposta do usuário na conversa ("1-a"); confirma a decisão A da AI-MEMORY-INTEGRATION.36.
- **Origem:** era a AI-MEMORY-INTEGRATION.37 (movida em 2026-10-23 12:37).

### AI-MEMORY-ROLLOUT-2.3 — Hooks de captura no Codex e no Gemini CLI

**Próximo passo:** ❌ cancelada pela decisão A da AI-MEMORY-ROLLOUT-2.2 (2026-10-23 12:48).

- **Nível:** MEDIO — classificado (jev (confiança 0.80))
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** SIM
- **Fonte:** jev (confiança 0.80)
- **Descrição:** Aplicar o instalador nos dois harnesses, respeitando o gancho do Jev, o `codex_hooks` do Codex e o modo escolhido na .37.
- **Arquivos:** `scripts/instalar-ai-memory.mjs`, `.codex/hooks.json`, configuração do Gemini CLI
- **Critérios de Aceitação:** Os dois capturam no piloto; reexecução não duplica; nenhum hook bloqueia a mensagem; só repositórios com `.ai-memory.toml` são capturados (se a .37 escolher allowlist).
- **Depende de:** AI-MEMORY-ROLLOUT-2.2
- **Verificação:** a preencher na entrega.
- **Origem:** era a AI-MEMORY-INTEGRATION.38 (movida em 2026-10-23 12:37).

### AI-MEMORY-ROLLOUT-2.4 — Hooks de captura no Devin e no Antigravity (com `finalize-session`)

**Próximo passo:** ❌ cancelada pela decisão A da AI-MEMORY-ROLLOUT-2.2 (2026-10-23 12:48).

- **Nível:** MEDIO — classificado (jev (confiança 0.85))
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** SIM
- **Fonte:** jev (confiança 0.85)
- **Descrição:** Aplicar nos dois e documentar o fechamento explícito do Antigravity (`ai-memory finalize-session --agent antigravity-cli`).
- **Arquivos:** `scripts/instalar-ai-memory.mjs`, `docs/AI-MEMORY-HOOKS-POR-IA.md`
- **Critérios de Aceitação:** Os dois capturam; a sessão do Antigravity é fechada pelo comando; resultado registrado.
- **Depende de:** AI-MEMORY-ROLLOUT-2.2
- **Verificação:** a preencher na entrega.
- **Origem:** era a AI-MEMORY-INTEGRATION.39 (movida em 2026-10-23 12:37).

### AI-MEMORY-ROLLOUT-2.5 — Hooks de captura no Kimi Code, no OpenCode e no DeepSeek (DSH)

**Próximo passo:** ❌ cancelada pela decisão A da AI-MEMORY-ROLLOUT-2.2 (2026-10-23 12:48).

- **Nível:** MEDIO — classificado (jev (confiança 0.85))
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** SIM
- **Fonte:** jev (confiança 0.85)
- **Descrição:** Aplicar nos três e conferir como o DeepSeek entra (harness DSH, `install-hooks --agent dsh`).
- **Arquivos:** `scripts/instalar-ai-memory.mjs`, `docs/AI-MEMORY-HOOKS-POR-IA.md`
- **Critérios de Aceitação:** Kimi, OpenCode e DSH capturam; o fechamento manual do DSH está documentado.
- **Depende de:** AI-MEMORY-ROLLOUT-2.2
- **Verificação:** a preencher na entrega.
- **Origem:** era a AI-MEMORY-INTEGRATION.40 (movida em 2026-10-23 12:37).

### AI-MEMORY-ROLLOUT-2.6 — Auditoria de captura das outras IAs: respeitam `ignore_paths` e não vazam segredo

**Próximo passo:** ❌ cancelada pela decisão A da AI-MEMORY-ROLLOUT-2.2 (2026-10-23 12:48).

- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** sinais
- **Descrição:** Rodar a auditoria e o teste de invariante com eventos de Codex, Gemini, Devin, Antigravity, Kimi, OpenCode e DSH. Confirmar o `ignore_paths` em Gemini, Devin e DSH, que a .30 deixou como não confirmado.
- **Arquivos:** `scripts/ai-memory-auditar.mjs`, `scripts/testes/ai-memory-invariantes.mjs`
- **Critérios de Aceitação:** Nenhuma IA grava caminho proibido nem segredo; os 3 pontos 'não confirmado' da .30 resolvidos.
- **Depende de:** AI-MEMORY-ROLLOUT-2.3, AI-MEMORY-ROLLOUT-2.4, AI-MEMORY-ROLLOUT-2.5
- **Verificação:** a preencher na entrega.
- **Origem:** era a AI-MEMORY-INTEGRATION.41 (movida em 2026-10-23 12:37).

### AI-MEMORY-ROLLOUT-2.7 — Criar o repositório GitHub privado do wiki da memória e ligar o remoto

**Próximo passo:** o usuário cria o repositório privado vazio no GitHub e roda `git remote add origin <url>` dentro de `%LOCALAPPDATA%i-memory\wiki`; depois um `git push` confere.

- **Nível:** Usuário — ação externa no GitHub e no computador do usuário (aberta pela .21, C26)
- **Modelo:** Usuário
- **Effort:** — (ação do usuário)
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** fechar o critério "remoto privado" da .21: o wiki é um repositório Git local; falta o remoto privado (passo a passo em `docs/AI-MEMORY-BACKUP.md`).
- **Critérios de Aceitação:** `git -C %LOCALAPPDATA%i-memory\wiki remote -v` mostra o repositório privado e o `git push` funciona; nenhum segredo no repositório (o `config.toml` não fica no wiki).
- **Depende de:** Nenhuma
- **Verificação:** a preencher na entrega.
- **Origem:** era a AI-MEMORY-INTEGRATION.42 (movida em 2026-10-23 12:37).
