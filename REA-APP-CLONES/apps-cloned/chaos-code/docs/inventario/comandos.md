# Inventário — comandos Tauri (`invoke`) do Chaos Code v3 (CLONE.1.2)

Feito por Claude Code (Opus 5.5) (local · main) em 2026-10-16. Mapa dos módulos:
[`modulos.md`](modulos.md). Cada comando é uma função Rust que a interface chama por
`window.__TAURI_INTERNALS__.invoke(nome, argumentos)`; no clone vira um canal IPC do Electron.

## Fontes e método (análise estática, nada executado)

| Fonte | O que deu | Onde |
|---|---|---|
| Interface embutida (28 arquivos) | **Nome + argumentos** de cada chamada, e parte do retorno | Tabela de assets do Tauri em arq. `0x87e900`–`0x87ec80` (entradas de 32 bytes: ptr caminho, tam., ptr dados, tam.); dados em **brotli**, descomprimidos com `zlib.brotliDecompressSync` do Node. Arquivos: `assets/index-Ct94erbr.js` (camada de serviço e stores), `*View-*.js` (telas) |
| Bloco de nomes no Rust | Lista dos comandos registrados (`generate_handler!`) e nomes de argumentos (sem repetição) | arq. `0x80e5d0`–`0x80ed10` e `0x87f580`–`0x87f8c0` (VA = arq. + `0x140001000`) |
| Roteador de comandos | Nomes comparados em pedaços de 16 bytes (`check_platform_o`+`nline`…) | arq. `0x8308c0`–`0x830c40` |

- **Argumentos:** chaves do objeto passado no `invoke` (observado no JS). Os Tauri convertem
  `camelCase` do JS para `snake_case` no Rust.
- **Retorno:** só onde a interface lê campos do resultado de forma direta (observado);
  "—" = não identificado nesta subtarefa (fica para a CLONE.13, lendo a tela, ou o Ghidra).
- **Comandos marcados ⚙️:** registrados no Rust mas **não chamados pela interface**; argumentos
  *(inferidos)* pela ordem no bloco de nomes.
- **Módulo:** `commands::<arquivo>` atribuído pelo assunto *(inferido)*; os 10 arquivos estão em
  `modulos.md`.

## Como a interface chama (camada de serviço do `index.js`)

- `U(nome, args)` → `invoke` direto. `H(nome, args)` → igual, mas se o erro tiver
  `"API error 401"`, `"Não autenticado"` ou `"Sessão expirada"`, tenta reconectar
  (`useAuthStore().attemptReconnect()`) e repete **uma vez**; falhou, dispara o evento DOM
  `auth:invalid`. Reconectou → `auth:reconnected`.
- **Erros** chegam como texto (`String(erro)`) e viram aviso na tela.
- Plugins do Tauri usados: `plugin:app|version`, `plugin:dialog|open`, `plugin:shell|open`,
  `plugin:event|listen` / `unlisten`.

## Eventos do Rust para a interface

| Evento | Quem escuta | Conteúdo (`payload`) observado |
|---|---|---|
| `sync-progress` | store de projetos | `project_id`, `phase` (termina em `done` ou `cancelled`; outras: `fetching`, `chunking`, `extracting`, `embedding_entities`, `saving`), `current_article`, `total_articles`, `article_title`, `detail` |
| `update-progress` | tela de atualização | `event`: `Started` · `Progress` (`downloaded`, `total`) · `Finished` |
| `mcp:consent-request` | `McpConsentDialog` | `request_id` (+ dados do pedido); resposta por `respond_mcp_consent` |

## Comandos (79)

### Login e sessão — `commands::auth`

| Comando | Argumentos | Retorno observado |
|---|---|---|
| `start_login` | — | — (abre o navegador; sobe o callback) |
| `logout` | — | — |
| `get_auth_status` | — | `{ isAuthenticated, expiresAt }` |
| `refresh_auth_token` | — | — |
| `check_platform_online` | — | booleano (a interface guarda por 30 s) |

### Projetos e sincronização — `commands::project`

| Comando | Argumentos | Retorno observado |
|---|---|---|
| `list_projects` | — | `{ projects[], removed_projects[] }`; cada projeto tem `id`, `name`, `stats.{article_count, entity_count, relation_count}` |
| `sync_project` | `projectId` | — (progresso pelo evento `sync-progress`) |
| `cancel_sync` | `projectId` | — |
| `check_article_updates` | `projectId` | — |
| `delete_project_data` | `projectId` | — |
| `set_project_local_path` | `projectId`, `path` | — |
| `clear_project_local_path` ⚙️ | `projectId` *(inferido)* | — |
| `open_project_folder` | `projectId` | — |
| `get_project_rag_status` | `projectId` | — |
| `toggle_project_rag` | `projectId`, `enabled` | `{ rag_enabled }` |
| `get_project_status` ⚙️ | `projectId` *(inferido)* | — |
| `check_chaos_code_readiness` | `projectId` | — |

### Consulta e grafo — `commands::query`

| Comando | Argumentos | Retorno observado |
|---|---|---|
| `query_knowledge` ⚙️ | `query`, `topK`, `mode` *(inferido; `mode` = `local`/`global`/`hybrid`)* | — |
| `search_entities` ⚙️ | `name`, `entityType` *(inferido)* | — |
| `get_graph_data` ⚙️ | `entityName`, `depth` *(inferido)* | — |

### Chat — `commands::chat`

| Comando | Argumentos | Retorno observado |
|---|---|---|
| `send_chat_message` | `request` | — |
| `list_conversations` | `projectId` | — |
| `get_conversation` | `projectId`, `conversationId` | — |
| `save_conversation` | `conversation` | — |
| `delete_conversation` | `projectId`, `conversationId` | — |

### Configurações de IA — `commands::settings`

| Comando | Argumentos | Retorno observado |
|---|---|---|
| `get_embedder_config` / `set_embedder_config` | — / `config` | — |
| `detect_embedding_dimensions` | `mode` | — |
| `test_embedder` | — | — |
| `get_extraction_config` / `set_extraction_config` | — / `config` | — |
| `test_extraction` | `sampleText` | — |
| `get_pipeline_config` / `set_pipeline_config` | — / `config` | — |
| `test_chat_model` | `chatModel`, `mode` | — |
| `list_proxy_models` | `baseUrl`, `apiKey`, `headers` | — |
| `get_image_api_config` / `set_image_api_config` | — / `config` | — |

### Imagens — `commands::image`

| Comando | Argumentos | Retorno observado |
|---|---|---|
| `list_project_images` | `projectId`, `limit`, `offset` | — |
| `search_images` | `projectId`, `query`, `tags`, `status`, `limit`, `offset` | — |
| `delete_project_image` | `projectId`, `imageId` | — |

### Agentes — `commands::agents`

| Comando | Argumentos | Retorno observado |
|---|---|---|
| `list_agents` | `projectId`, `scope` | — |
| `list_resolved_agents` | `projectId` | — |
| `list_agent_templates` | `projectId` | — |
| `list_community_agents` | `projectId`, `category` | — |
| `check_agent_exists` | `reference` | — |
| `read_agent` ⚙️ | `reference` *(inferido)* | — |
| `save_agent` | `reference`, `frontmatter`, `systemPrompt`, `overwrite` | — |
| `delete_agent` | `reference` | — |
| `preview_agent_file` | `frontmatter`, `systemPrompt` | — |
| `reveal_agent_in_explorer` ⚙️ | `reference` *(inferido)* | — |
| `suggest_agents_ai` | `projectId`, `hint` | — |
| `assemble_team_auto` | `projectId` | — |
| `generate_chaos_code_flow_block` | `projectId`, `agentRole` | — |
| `check_claude_cli_available` ⚙️ | — *(inferido)* | — |

### MCP e CLIs — `commands::agents` / `mcp::*`

| Comando | Argumentos | Retorno observado |
|---|---|---|
| `connect_mcp_cli` | `projectId`, `cli` | `{ config_path }` |
| `disconnect_mcp_cli` | `projectId`, `cli` | — |
| `get_mcp_cli_status` | `projectId` | — |
| `get_mcp_command` | `projectId` | — (texto `claude mcp add -t http -H "X-MCP-Session-Token: …" -s project …`) |
| `copy_mcp_command` ⚙️ | `projectId` *(inferido)* | — |
| `get_project_mcp_tools` | `projectId` | — |
| `list_chaos_code_mcp_tools` | — | — |
| `get_mcp_tools_config` ⚙️ | `projectId` *(inferido)* | — |
| `update_mcp_tools_config` ⚙️ | `projectId`, `config` *(inferido)* | — |
| `respond_mcp_consent` | `requestId`, `approve` | — |

### WSL — `commands::wsl`

| Comando | Argumentos | Retorno observado |
|---|---|---|
| `check_wsl_status` | — | — (campos vistos no Rust: `is_windows`, `wsl_installed`, `localhost_forwarding`, `wslconfig_exists`, `running_distros`) |
| `apply_wsl_localhost_forwarding` | — | — |
| `dismiss_wsl_warning` | — | — |

### Atualizador — `commands::updater`

| Comando | Argumentos | Retorno observado |
|---|---|---|
| `check_for_update` | — | `{ available, version, date, body, force_update, min_version }` |
| `download_and_install_update` | — | — (progresso pelo evento `update-progress`; bloqueado no MSIX) |
| `cancel_update_download` ⚙️ | — | — |
| `save_pre_update_state` | `targetVersion` | — |
| `get_update_history` | — | — |
| `get_update_config` / `set_update_config` | — / `config` | `{ auto_check, auto_install, check_interval_minutes }` |
| `get_update_channel` | — | texto (ex.: `stable`; `unknown` se falhar) |
| `get_install_kind` | — | texto: `msix` ou `standalone` (padrão se falhar) |
| `get_shadow_nsis_path` | — | caminho de uma instalação NSIS paralela, ou `null` (só chamado no MSIX) |

### Situação geral — `commands::status`

| Comando | Argumentos | Retorno observado |
|---|---|---|
| `get_system_status` ⚙️ | — | — (provável, *inferido*: campos vistos juntos no Rust `auth_status`, `mcp_status`, `mcp_port`, `loaded_projects`, `total_projects`, `platform_url`) |

## Em aberto

- **Retornos** da maioria dos comandos (marcados "—"): ler a tela que usa cada um (CLONE.13)
  ou seguir no Ghidra a função de cada comando.
- **Argumentos dos 13 comandos ⚙️:** inferidos pela ordem do bloco de nomes; conferir no Ghidra.
- **Módulo de cada comando:** atribuído pelo assunto; o arquivo exato (`commands\*.rs`) só no
  código.
- `get_shadow_nsis_path`, `check_platform_online` e `list_chaos_code_mcp_tools` não existem
  inteiros como string no Rust (são comparados em pedaços); o nome vem da interface.

## Para a CLONE.1.10 (interface)

A tabela de assets (arq. `0x87e900`, 28 entradas) e a descompressão brotli acima já funcionam:
saem `index.html`, 15 arquivos `.js`, 8 `.css` e 4 sons `.mp3`. Basta gravar em `docs/original/`.
