// Gancho `UserPromptSubmit` do Codex (JEV-GLOBAL-AI-FINAL.12), registrado em `~/.codex/hooks.json`
// pelo `scripts/sincronizar.mjs`. O Codex manda o mesmo evento do Claude Code (`prompt`, `cwd`,
// `hook_event_name`) e aceita a mesma saída (`hookSpecificOutput.additionalContext`), então este
// arquivo só reaproveita o gancho do Claude Code: as mesmas garantias valem (INV-2: sai sempre
// com 0, nunca bloqueia, nunca escreve em stderr). Exige `codex_hooks = true` em `[features]` do
// `~/.codex/config.toml`. Arquivo separado para o Codex poder mudar de formato sem mexer no outro.
import './claude-prompt.mjs';
