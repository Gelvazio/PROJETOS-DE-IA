# 🧩 Mods do Claude Code (marketplace `benai-mods`)

Decidido em 2026-10-24 (pedido do usuário). Vale para o **Claude Code** em **todos os projetos**.
Fonte dos mods: `C:\fontes\rules-ai\MODS-CLAUDE-CODE\benai-mods` (marketplace local, só com o
README e os plugins; descrição de cada um no README).

## Os 9 mods, instalados e ativos em todos os projetos

Instalados no escopo do usuário (`claude plugin install <mod>@benai-mods --scope user`) e ligados
em `~/.claude/settings.json` (`enabledPlugins`), valendo em qualquer pasta:

| Mod | Para que serve |
|-----|----------------|
| `helper-desk@benai-mods` | Barra de progresso acima do prompt e painel de subagentes (obrigatório em todo chat) |
| `handoff@benai-mods` | Perto de 250 mil tokens, escreve o handoff do chat e abre um chat novo com ele |
| `reflect@benai-mods` | Quando o usuário corrige a IA, oferece salvar a correção como regra |
| `chat-inventory@benai-mods` | Painel "In this chat": tarefas, conectores, arquivos e skills usados |
| `mods@benai-mods` | `/mods`: liga e desliga cada mod |
| `brain-dump@benai-mods` | Molda um prompt longo e solto num prompt de 4 partes, com até 3 perguntas |
| `cache-clock@benai-mods` | Contagem regressiva do cache do chat e botão "Keep warm" |
| `screen-share@benai-mods` | `/screen-share`: esconde nomes, e-mails, telefones e valores na gravação |
| `replay-theater@benai-mods` | `/replay`: percorre os diffs feitos pela IA no último turno |

## Regras

- ✅ **helper-desk:** todo chat com 2 ou mais passos usa `mcp__helper-desk__plan` (regra já existente
  no `CLAUDE.md` global); continua valendo.
- ✅ **reflect:** só **oferece** salvar regra; a IA nunca grava regra global sem o usuário aceitar.
  Regra nova do usuário continua indo para `C:\fontes\rules-ai\regras\` (fonte única), não para
  um `CLAUDE.md` solto.
- ✅ **handoff:** o handoff do mod **complementa** o quadro (`tasks/STATUS.md`) e a memória
  (`memoria-ai.md`); se divergir do quadro, vale o quadro.
- ✅ Projeto ou conta nova do Claude Code: instalar os 9 com o comando acima e conferir em
  `~/.claude/plugins/installed_plugins.json`; depois `/reload-plugins` nos chats abertos.
- Para ligar/desligar um mod: `/mods`, ou `enabledPlugins` no `~/.claude/settings.json`.
- A pasta do marketplace é lida pelo caminho local; se for movida, atualizar
  `extraKnownMarketplaces.benai-mods.source.path` no `settings.json`.
