# ai-memory: suporte de hooks por IA

**Subtarefa:** AI-MEMORY-INTEGRATION.30 (nível LEVE)
**Fontes lidas (somente leitura):** `C:\fontes\ai-memory\hooks\`, `docs\install.md`,
`docs\ARCHITECTURE.md`, `docs\marker-file.md`, e as tabelas de eventos em
`crates\ai-memory-cli\src\commands\render_shared.rs` e `install_hooks.rs`.
**Data:** 2026-10-23

## Quadro

Legenda: "sim" e "não" são o que a fonte afirma; "n/c" = não confirmado (não achei na fonte).
"manual" = `ai-memory finalize-session`, porque a IA não tem SessionEnd nativo.
Os números entre parênteses (E1, O1, C1…) apontam para as notas abaixo.

| IA | Eventos | Fecha | Escopo projeto | ignore_paths | Instalação | Obs |
|----|---------|--------------|----------------|--------------|------------|-----|
| Codex | 7 (E1) | SessionEnd nativo | não | sim | `install-hooks --agent codex` | O1 |
| Gemini CLI | 5 (E2) | SessionEnd nativo | não | n/c | `install-hooks --agent gemini-cli` | O2 |
| Devin | 7 (E3) | SessionEnd nativo | não | n/c | `install-hooks --agent devin` | O3 |
| Antigravity | 5 (E4) | manual | não | sim | `install-hooks --agent antigravity-cli` | O4 |
| Kimi Code | 10 (E5) | SessionEnd nativo | não | sim | `install-hooks --agent kimi-code` | O5 |
| OpenCode | 7 (E6) | SessionEnd do plugin | não | sim | `install-hooks --agent opencode` | O6 |
| DeepSeek (DSH) | 7 (E7) | manual | não | n/c | `install-hooks --agent dsh` | O7 |

## Eventos por IA

- **E1 Codex:** SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, PreCompact, Stop,
  SessionEnd (`render_shared.rs`, `CODEX_EVENTS`).
- **E2 Gemini CLI:** SessionStart, SessionEnd, BeforeTool, AfterTool, PreCompress
  (`render_shared.rs`, `GEMINI_EVENTS`). Não há UserPromptSubmit nem Stop: o prompt do usuário
  não é capturado nessa instalação, mesmo existindo o script `hooks/gemini-cli/`
  `user-prompt-submit.sh`.
- **E3 Devin:** SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, PostCompaction, Stop,
  SessionEnd (`render_shared.rs`, `DEVIN_EVENTS`). Sem eventos de subagente
  (`docs\install.md`, seção Devin CLI).
- **E4 Antigravity:** SessionStart, PreInvocation, Stop (eventos de ciclo) e PreToolUse,
  PostToolUse (ferramentas) (`render_shared.rs`, `ANTIGRAVITY_LIFECYCLE_EVENTS` e
  `ANTIGRAVITY_TOOL_EVENTS`). Não há fim de conversa (`docs\install.md`, "Antigravity lifecycle
  hooks").
- **E5 Kimi Code:** SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, PostToolUseFailure,
  PreCompact, Stop, SessionEnd, SubagentStart, SubagentStop (`render_shared.rs`,
  `KIMI_CODE_EVENTS`; `docs\install.md`, "Kimi Code", diz "10 events").
- **E6 OpenCode:** plugin TypeScript gerado (não há script `.sh` que o instale). Eventos postados
  pelo plugin: session-start, user-prompt, pre-tool-use, post-tool-use, pre-compact, stop e
  session-end (`crates\ai-memory-cli\src\commands\install_hooks.rs`, `build_opencode_plugin`).
- **E7 DeepSeek (DSH):** SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, Stop,
  SubagentStart, SubagentStop (`render_shared.rs`, `DSH_EVENTS`). Sem SessionEnd
  (`crates\ai-memory-cli\src\cli.rs`, doc da variante `Dsh`).

## Observações por IA

- **O1 Codex:** SessionEnd nativo desde a CLI 0.145.0; `Stop` só marca fim de turno. Para
  versões antigas: `ai-memory finalize-session` (`docs\install.md`, "OpenAI Codex").
  Em `apply_patch` os caminhos não chegam à política de captura: só metadados
  (`docs\install.md`, mesma seção).
- **O2 Gemini CLI:** instalado no arquivo global de configuração do Gemini
  (`install_hooks.rs`, `gemini_settings_path`). Não há seção própria em `docs\install.md`
  (só aparece na lista de agentes e no exemplo `install-hooks --agent gemini-cli`, linha 2379).
- **O3 Devin:** o arquivo global é `~/.devin/hooks.v1.json` (ou `--config-file`). Pode faltar
  `session_id` e `cwd`; o cwd vem de `DEVIN_PROJECT_DIR` (`docs\install.md`, seção Devin CLI).
- **O4 Antigravity:** fecho manual com `ai-memory finalize-session --agent antigravity-cli`;
  depois de 10 min sem atividade o handoff passa a valer numa nova sessão do mesmo projeto
  (`docs\install.md`, "Antigravity lifecycle hooks"). O comando nativo é o padrão em instalação
  local (`docs\install.md`, linhas 1304-1305); por isso `ignore_paths` é "sim", com essa ressalva.
- **O5 Kimi Code:** configuração em `~/.kimi-code/config.toml` (ou `$KIMI_CODE_HOME`). Comando
  nativo é o padrão em instalação local; o fallback por script não aplica `ignore_paths`
  (`docs\install.md`, "Kimi Code"; `docs\marker-file.md`, "Capture exclusions").
- **O6 OpenCode:** `ignore_paths` é aplicado pelo plugin gerado (`docs\install.md`, linhas
  901-905; `docs\marker-file.md`, linhas 353-356). Ferramentas do OpenCode 1/2 ficam só com
  família e metadados (`docs\marker-file.md`, linha 901).
- **O7 DeepSeek (DSH):** suporte próprio e de primeira parte (`CHANGELOG.md`, linhas 726-731).
  Os hooks passam pela ponte oficial `@deepseek-ai/dsh-hooks-claude-code` (arquivo
  `hooks.json` gerado). O `ignore_paths` nessa ponte não está confirmado nas fontes.
  Modelos DeepSeek usados por outro harness (ex.: OpenCode) não têm suporte próprio no ai-memory:
  sem suporte próprio encontrado para esse caminho.

## Comandos de instalação

Todos com `--apply`; `--server-url` e `--auth-token` conforme `docs\install.md`.

- `ai-memory install-hooks --agent codex --apply`
- `ai-memory install-hooks --agent gemini-cli --apply`
- `ai-memory install-hooks --agent devin --apply`
- `ai-memory install-hooks --agent antigravity-cli --apply`
- `ai-memory install-hooks --agent kimi-code --apply`
- `ai-memory install-hooks --agent opencode --apply`
- `ai-memory install-hooks --agent dsh --apply` (aliases: `deepseek-harness`, `deepseek_harness`)

## Escopo por projeto

- Só o Claude Code aceita `install-hooks --scope project`. Para as demais IAs o próprio comando
  recusa a opção: "`--scope project` is only supported for `--agent claude-code`"
  (`crates\ai-memory-cli\src\commands\install_hooks.rs`, função `run`, linha 645).
- A opção de escopo por projeto que existe para essas IAs é o marcador `.ai-memory.toml`
  (`docs\marker-file.md`), que define workspace, projeto e `ignore_paths`. Ele não instala nada
  por projeto.

## Risco

Nas IAs sem escopo por projeto (todas as listadas acima), o hook fica no arquivo de configuração
global do usuário, e vale para todas as pastas que ele abre.

- **Evidência 1:** sem `.ai-memory.toml`, o repositório continua sendo capturado. O marcador só
  *restringe*; quem não tem marcador é capturado por padrão (`docs\marker-file.md`, "Allowlist
  mode", linhas 335-338; `docs\install.md`, "Capture only repositories that opt in").
- **Evidência 2:** fora de um checkout, com `$HOME` como âncora, a captura cobre o cwd da sessão
  (`docs\marker-file.md`, linhas 39-41). Sessões abertas em `$HOME` não viram projeto único
  (regra "Broad anchors never stick", `docs\marker-file.md`, perto da linha 1165).
- **Mitigação:** `install-hooks --apply --capture-mode allowlist` (instalação inteira, não por IA);
  sem marcador, o repositório não emite nenhum evento (`docs\marker-file.md`, linhas 344-352;
  o modo é guardado por instalação, linhas 355-357). Ainda assim, pastas sem marcador ficam fora
  da captura só por causa da regra, não por desenho por projeto.
- **Não confirmado:** se o Gemini CLI, o Devin e o DSH aplicam `ignore_paths` no modo nativo
  padrão. Isso decide se a exclusão por pasta vale nessas três IAs.

## Linha pronta para o campo Verificação

Verificação: conferido por leitura dos hooks e das tabelas de eventos (7 IAs), de
docs/install.md, docs/ARCHITECTURE.md, docs/marker-file.md e de install_hooks.rs (linha 645).
Gemini CLI, Devin e DSH: ignore_paths não confirmado. Sem comandos, sem navegador, sem testes.
