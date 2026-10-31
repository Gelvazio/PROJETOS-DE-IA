## Etapa 001 — GLOBAL: Regras globais para todas as IAs e projetos

**Tarefa:** GLOBAL · **Pedido em:** 2026-10-16 · **Criada por:** Claude Code (Sonnet 5.5) (local · main)
**Pedido:** "LEIA AS REGRAS DE AULASENAI, LEVE AS REGRAS DAQUI PRA USAR LÁ TAMBÉM … FAZER AS REGRAS
SEREM GLOBAIS PRA TODAS AS IAS … ESCOPO: TODOS OS PROJETOS DA PASTA FONTES … USE ESTE REPO: rules-ai"
**Objetivo:** uma pasta única de regras (`regras/`) ligada ao arquivo global de cada IA.

### GLOBAL.1 a GLOBAL.3 — Entrega

- **Entrega:** commit `feat(GLOBAL.1-3)` · **Verificação:** `node --check` e execução do script em
  modo simulado e com `--aplicar` (a segunda execução diz "igual"); `.bak` do `~/.claude/CLAUDE.md`
  criado. Comparados `aulasenai` × REA × `~/.codex/AGENTS.md`: 10 conflitos em `CONFLITOS.md`.
- **Anotação:** alterados `~/.claude/CLAUDE.md` (bloco `@import` no fim) e `~/.gemini/GEMINI.md`
  (criado). O Claude Code pode pedir aprovação do import externo na primeira vez.
- **Não feito de propósito:** Codex (o arquivo atual contradiz as regras) e as demais IAs
  (caminho do arquivo global não confirmado); o `AGENTS.md` de cada projeto não foi alterado.

### GLOBAL.4 — Confirmar os conflitos (concluída)

- **Entrega:** commit `feat(GLOBAL.4)` · **Verificação:** respostas do usuário (C1=A, C2=A, C3=A,
- **JEV-AI-SUGGESTION:** NAO
  C4=B, C5=B, C6=A, C7=A, C8=A, C9=juntar, C10=juntar A e B) aplicadas em `regras/`; script
  rodado com `--aplicar` e depois "igual" nos 3 destinos (Claude Code, Gemini CLI, Codex).
- **Anotação:** do `~/.codex/AGENTS.md` foram removidas as seções de testes, worktree/merge,
  commit+push automático e frase final (cópia em `.bak`); restou o graphify (C11).

### GLOBAL.5 — Demais IAs (concluída)

- **Nível:** MEDIO — achar o caminho de cada IA na documentação e estender o script ·
- **JEV-AI-SUGGESTION:** NAO
  **Modelo:** Claude Code Sonnet 5.5 (ou superior)
- **Descrição:** caminhos tirados da documentação oficial de cada IA: Grok lê `~/.grok/`
  (docs.x.ai, "Project rules"); Qoder `~/.qoder/AGENTS.md` (docs.qoder.com, "Memory"); opencode
  `~/.config/opencode/AGENTS.md`, sem `@import` (opencode.ai, "Rules"); Devin
  `%APPDATA%\devin\AGENTS.md` (docs.devin.ai, "Rules"); Kiro `~/.kiro/steering/` (kiro.dev,
  "Steering"; arquivo próprio `rules-ai.md`, sempre incluído). Todos no modo `embutir`; o Kiro
  usa `criarPasta` porque `steering/` não existia.
- **Ficaram de fora:** Cursor (as regras do usuário ficam só em Configurações → Rules, sem
  arquivo) e DeepSeek (`%APPDATA%\@deepseek-ai` não tem arquivo de regras).
- **Entrega:** commit `feat(GLOBAL.5)` · **Verificação:** `node --check` ok; `--aplicar` gravou
  os 5 arquivos novos (25.610 bytes cada, com `graphify.md` e as regras do quadro) e a segunda
  rodada deu "igual" em todos; Gemini e Codex continuaram "igual". Rodado no Linux do app de
  desktop com as pastas do usuário ligadas; no Windows o script usa os mesmos caminhos.

### GLOBAL.6 — Decidir C11 e C12 (concluída)

- **Entrega:** commit `feat(GLOBAL.6)` · **Verificação:** `regras/graphify.md` criado; script com
- **JEV-AI-SUGGESTION:** NAO
  `--aplicar` e depois "igual" nos 3 destinos; `~/.claude/CLAUDE.md` sem a regra antiga "só quando o
  usuário pedir"; `~/.codex/AGENTS.md` sem o caminho fixo de `professor-senai`. Tarefas abertas nos
  quadros do REA (`ALINHAR`) e do aulasenai (`#202`).
- **Anotação:** C11 foi aplicado só nas regras globais; o relatório do graphify não foi rodado nesta
  conversa (a regra manda esperar a próxima).

### GLOBAL.7 — Acompanhar o alinhamento dos projetos
- **JEV-AI-SUGGESTION:** NAO

**Próximo passo:** o usuário confere quando as subtarefas `ALINHAR.*` (REA) e `#202.*` (aulasenai)
estiverem ✅; cada uma é de um nível/modelo (Haiku, Sonnet ou Opus).

### GLOBAL.8 — Gemini CLI lendo as regras de verdade (concluída)

- **Nível:** MEDIO — ajuste pequeno no script, mas exige entender o carregador do Gemini ·
- **JEV-AI-SUGGESTION:** NAO
  **Modelo:** Claude Code Sonnet 5.5 (ou superior)
- **Descrição:** no `@google/gemini-cli-core` 0.64.0 (`utils/memoryImportProcessor.js`), o GEMINI.md
  global é lido sem `projectRoot`, então `validateImportPath` recusa qualquer `@import` e grava
  `<!-- Import failed: ... - Path traversal attempt -->`: o Gemini não via nenhuma regra global.
  O destino do Gemini no `sincronizar.mjs` passou de `importar` para `embutir` (como o Codex).
- **Entrega:** commit `fix(GLOBAL.8)` · **Verificação:** `--aplicar` gravou o
  `~/.gemini/GEMINI.md` (cópia em `.bak`) e a segunda rodada deu "igual" no Gemini e no Codex; o
  bloco do Gemini tem `graphify.md` e as regras do quadro. `~/.claude/CLAUDE.md` não foi aberto
  nesta sessão (pasta protegida); o Claude Code aceita `@` com caminho absoluto, então segue no
  modo `importar`.
- **Anotação:** feito por Claude Code (Opus 5.5) (nuvem · main), pelo app de desktop, a pedido do
  usuário ("Ligar as outras IAs às regras globais").
