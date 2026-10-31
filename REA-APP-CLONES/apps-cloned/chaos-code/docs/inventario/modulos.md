# Inventário — mapa dos módulos `chaos_code_v3_client_lib::*` (CLONE.1.1)

Feito por Claude Code (Opus 5.5) (local · main) em 2026-10-15. Primeira peça do inventário: diz
**quais módulos existem e o que cada um faz**. Os detalhes (comandos, rotas, formatos, prompts)
ficam para a CLONE.1.2 a CLONE.1.10, que partem deste mapa.

## Alvo

| Campo | Valor |
|---|---|
| Arquivo | `apps-to-be-clone/chaos-code-v3-client.exe` (11.217.920 bytes) |
| SHA-256 | `46dab59253852c4cadc8ce859375f1cdaf6993a065aa8ee780d1f97e41eb044a` |
| Formato | PE32+ x86-64, base `0x140000000`; app **Tauri 2** em Rust (crate `chaos_code_v3_client_lib`) |
| Versão | `1.11.2` (texto "Iniciando download e instalação: v1.11.2 → v…" e servidor MCP `chaos-code-1.11.2`) |
| Dependências vistas | `tauri`, `tauri-plugin-updater 2.10.0`, `tokio 1.49.0`, `glob 0.3.3`, `hashbrown 0.16.1`, keyring nativo |

## Como foi feito

- **Análise estática só por leitura de bytes** (nada foi executado): busca dos caminhos
  `chaos_code_v3_client_lib::<módulo>` (alvo dos logs do `tracing`) e dos arquivos-fonte
  `src\…\*.rs` gravados pelo compilador nas mensagens de pânico/log; leitura do texto em volta
  de cada um.
- **Endereços:** "arq." = deslocamento no arquivo; "VA" = endereço virtual. Tudo cai na seção
  `.rdata` (arquivo `0x7da000` → VA `0x1407db000`), logo **VA = arq. + `0x140001000`** — serve
  para achar a string no Ghidra (provedor `ghidra` disponível no REA) e seguir as referências.
- **Limite:** o Rust junta as strings sem separador, então os nomes foram separados à mão pelo
  contexto. Funções descritas = **observação** das mensagens; o que está marcado *(inferido)*
  ainda precisa de confirmação no código (Ghidra) nas próximas subtarefas.

## Módulos (40 arquivos-fonte do projeto)

`src\raw\mod.rs` também aparece, mas é da dependência `hashbrown` — fora da lista.

### Núcleo

| Módulo | Arquivo | O que faz (observado) | Evidência (arq. / VA) |
|---|---|---|---|
| raiz | `src\lib.rs` | Monta o app Tauri, registra os comandos (`invoke`), sobe o servidor MCP, salva `mcp_config.json` (com `session_token`) ao encerrar e confere atualização ao abrir | `0x80e5d0` / `0x14080f5d0` — "MCP HTTP server error", "mcp_config.json salvo com sucesso antes do encerramento", "Update verificado com sucesso" |
| `storage::local` | `src\storage\local.rs` | Lê e grava os `*.json` locais com gravação atômica (`.tmp` + renomear, recupera do `.tmp`), valida IDs contra path traversal | `0x892a38` / `0x140893a38` — "Rename atômico falhou", "ID inválido: tentativa de path traversal detectada", "Arquivo principal ausente, recuperando de" |
| `project` (`mod`) | `src\project\mod.rs` | Nomes de pasta/ID de projeto (`chaos-code-project-`) e canal `stable` *(inferido)* | `0x899476` / `0x14089a476` |
| `project::manager` | `src\project\manager.rs` | Gerencia projetos locais (`projects.json`) e lê a pasta do projeto: arquivos de manifesto (README, `package.json`, `Cargo.toml`…) e pastas ignoradas (`.git`, `node_modules`…) | `0x8801d9` / `0x1408811d9` — lista de manifestos logo após o nome do módulo |
| `scanner::detector` | `src\scanner\detector.rs` | Detecta a stack do projeto (Postgres, MySQL, Redis, Mongo, Nginx, Traefik, docker-compose…) | `0x8929cb` / `0x1408939cb` |
| `device::fingerprint` | `src\device\fingerprint.rs` | Identificação do aparelho (`device_id.json`, `windows`, `x86_64`, `device_uuid`) | `0x890e7d` / `0x140891e7d` |
| `updater::platform` | `src\updater\platform.rs` | Descobre como o app foi instalado (MSIX da Store, NSIS pelo registro do Windows, pastas em `PROGRAMFILES`/`LOCALAPPDATA`) e a URL `/api/client/releases/latest.json` | `0x82c340` / `0x14082d340` — "GetCurrentPackageFullName", "Shadow NSIS install detectado via registry" |
| `wsl::detect` | `src\wsl\detect.rs` | Detecta WSL (`wsl --version`, distros rodando), IP do host pelo `netsh`, modo *mirrored*; liga `localhostForwarding=true` no `.wslconfig` (com backup) e reinicia o WSL | `0x80ecb7` / `0x14080fcb7` — "WSL2 em mirrored mode detectado", "localhostForwarding=true aplicado em" |

### Login (`auth`)

| Módulo | Arquivo | O que faz (observado) | Evidência (arq. / VA) |
|---|---|---|---|
| `auth::oauth` | `src\auth\oauth.rs` | Cliente OAuth: registro dinâmico (`/api/oauth/register`, cliente público `token_endpoint_auth_method=none`), troca do código, renovação (`refresh_token`), revogação; registra de novo se o `redirect_uri` mudar | `0x80f275` / `0x140810275` — "Registrando client OAuth em", "redirect_uri mudou, registrando novo client OAuth" |
| `auth::callback` | `src\auth\callback.rs` | Servidor local de callback em `127.0.0.1:<porta>/callback`, com tempo limite | `0x80f739` / `0x140810739` — "Login timeout: no callback received within" |
| `auth::tokens` | `src\auth\tokens.rs` | Guarda os tokens no keyring nativo; se falhar, arquivo cifrado `auth_tokens.json` (HKDF) e migração de volta para o keyring | `0x88f6f4` / `0x1408906f4` — "Tokens armazenados no keyring nativo", "HKDF expand falhou" |
| `auth::mock` | `src\auth\mock.rs` | Login simulado (`mock_access_token_`, `mock_refresh_token`) | `0x80f22c` / `0x14081022c` |

### API e conhecimento (RAG)

| Módulo | Arquivo | O que faz (observado) | Evidência (arq. / VA) |
|---|---|---|---|
| `api::client` | `src\api\client.rs` | Cliente HTTP da plataforma: projetos (`/api/oauth/user/projects`), ferramentas MCP do projeto (`/api/projects/<id>/mcp/tools`), tarefas (`/tasks?limit=&offset=&status=&priority=&tags=`), wiki (`/wiki/sync/ack`), modelos de agente (`/api/client/agent-templates?category=`); traduz erros HTTP em mensagens | `0x80d959` / `0x14080e959` e `0x888008` — "Buscando projetos em", "Sessão expirada. Faça login novamente." |
| `vector::chunker` | `src\vector\chunker.rs` | `SmartChunker`: divide o texto em pedaços, com limite de tamanho de entrada e de quantidade | `0x82c0d0` / `0x14082d0d0` — "SmartChunker: atingiu limite máximo de chunks" |
| `vector::embedder` | `src\vector\embedder.rs` | Embeddings por Gemini (`embedContent`/`batchEmbedContents`), OpenAI (`/v1/embeddings`) e OpenRouter, com limite de taxa e novas tentativas no 429; teste de dimensões | `0x810513` / `0x140811513` — "Embedder rate limit: aguardando", "API de embeddings OK" |
| `vector::index` | `src\vector\index.rs` | Índice vetorial `vectors.json` com HNSW (só a partir de 1000 entradas; parâmetros M e efConstruction); remove entradas por `article_id` | `0x82bc59` / `0x14082cc59` — "Índice HNSW construído com" |
| `graph::llm` | `src\graph\llm.rs` | Cliente de chat para o grafo: Gemini (`generateContent`), OpenAI (`/v1/chat/completions`), OpenRouter | `0x80fe9f` / `0x140810e9f` |
| `graph::entity` | `src\graph\entity.rs` | Tipos do grafo: entidade (nome, tipo, descrição, embedding, aliases, confiança, perfil, `article_id`) | `0x81f4c6` / `0x1408204c6` — "struct Entity", campos logo depois |
| `graph::extraction` | `src\graph\extraction.rs` | Extrai entidades e relações: `LlmExtractor`, fallback por regex e `HybridExtractor` (junta os dois) | `0x8313f8` / `0x1408323f8` — "LlmExtractor falhou (…), fazendo fallback para regex" |
| `graph::store` | `src\graph\store.rs` | Grava o grafo (`graph.json`, `entities.json`); regex de nomes próprios e siglas | `0x822ddd` / `0x140823ddd` |
| `graph::community` | `src\graph\community.rs` | Detecta comunidades e resume cada grupo (`communities.json`, "Grupo temático contendo") | `0x8231c3` / `0x1408241c3` — "CommunityGraph: … comunidades detectadas" |
| `graph::query_transform` | `src\graph\query_transform.rs` | Gera variações da consulta e uma resposta hipotética (HyDE) com LLM, e os embeddings delas | `0x80fa45` / `0x140810a45` — prompts "Dada a consulta original" / "Dada a pergunta" |
| `graph::rerank` | `src\graph\rerank.rs` | `LlmReranker`: pede notas 0–10 ao LLM e reordena; mantém a ordem se der erro ou tempo limite; modos `local`/`global`/`hybrid` | `0x8101a8` / `0x1408111a8` — "LlmReranker: re-rankeados" |

### MCP e agentes

| Módulo | Arquivo | O que faz (observado) | Evidência (arq. / VA) |
|---|---|---|---|
| `mcp::server` | `src\mcp\server.rs` | Servidor MCP HTTP (protocolo `2024-11-05`) em `0.0.0.0:<porta>`: `/mcp/{project_id}`, `/oauth/register`, `/oauth/authorize`, `/oauth/authorize/status`, `/oauth/token`, `/.well-known/{*path}`, `/health`; token `X-MCP-Session-Token`; página de consentimento; ferramentas de busca, wiki, tarefas e imagens | `0x80e328` / `0x14080f328` — "MCP HTTP server escutando em http://"; descrição do servidor em `0x88a3c0` |
| `mcp::oauth` | `src\mcp\oauth.rs` | Servidor de autorização do próprio MCP: tokens `mcp_at_`/`mcp_rt_`, PKCE S256, código de uso único, confere `client_id` e `redirect_uri` | `0x822733` / `0x140823733` — "code_verifier inválido (PKCE)", "code já utilizado" |
| `mcp::cli_config` | `src\mcp\cli_config.rs` | Grava a configuração MCP nos CLIs: `.mcp.json` (Claude), `.gemini/settings.json`, `.codex/config.toml`; backup, arquivo temporário e `.git/info/exclude` para não versionar a credencial | `0x88909d` / `0x14088a09d` |
| `agents::cli_discovery` | `src\agents\cli_discovery.rs` | Roda `claude agents` (tempo limite 5 s) para listar os agentes reconhecidos pelo CLI | `0x81039d` / `0x14081139d` — "claude agents: timeout de 5s excedido" |
| `agents::parser` | `src\agents\parser.rs` | Lê e gera o frontmatter YAML dos agentes (`name`, `description`, `tools`, `disallowedTools`, `model`, `color`, `permissionMode`, `memory`, `maxTurns`, `background`, `effort`, `isolation`, `initialPrompt`); valida o nome | `0x8907a0` / `0x1408917a0` — "Nome deve começar com letra minúscula" |
| `agents::manager` | `src\agents\manager.rs` | Cria, lista, atualiza e apaga agentes em `.claude/agents/*.md` (limite 10 MB, bloqueia path traversal) | `0x890bad` / `0x140891bad` — "Operação bloqueada: path traversal detectado" |
| `image::generation` | `src\image\generation.rs` | Gera imagem pelo Gemini "Nano Banana" (`generateContent` com `responseModalities`, `aspectRatio`) e também OpenAI; trata 401/403/502 com mensagem | `0x89005d` / `0x14089105d` — "Nano Banana (Gemini)" |

### Comandos Tauri (`commands::*` — o que a interface chama)

| Módulo | Arquivo | Assunto (observado) | Evidência (arq. / VA) |
|---|---|---|---|
| `commands::auth` | `src\commands\auth.rs` | Login: sobe o callback, abre o navegador, confere `state` (CSRF), reinicia o MCP | `0x8109b8` / `0x1408119b8` |
| `commands::project` | `src\commands\project.rs` | Projetos e sincronização da wiki em pipeline (buscar → dividir → embeddings → extrair → salvar), progresso `sync-progress`, cancelar | `0x812758` / `0x140813758` |
| `commands::query` | `src\commands\query.rs` | Consulta na base de conhecimento (máx. 10.000 caracteres) | `0x811356` / `0x140812356` |
| `commands::chat` | `src\commands\chat.rs` | Chat com o projeto (Gemini, OpenAI, OpenRouter) e conversas salvas | `0x810f90` / `0x140811f90` |
| `commands::agents` | `src\commands\agents.rs` | Agentes: listar, criar, montar equipe com IA, modelos da comunidade, comando `claude mcp add` | `0x811400` / `0x140812400` |
| `commands::image` | `src\commands\image.rs` | Listar, buscar e apagar imagens do projeto | `0x811258` / `0x140812258` |
| `commands::settings` | `src\commands\settings.rs` | Configurações: testar chat/embeddings, listar modelos de um proxy (`/v1/models`), estratégia de extração | `0x8137c8` / `0x1408147c8` |
| `commands::status` | `src\commands\status.rs` | Situação geral (login, MCP, porta, projetos) *(inferido pelos campos `auth_status`, `mcp_status`, `mcp_port`)* | `0x812728` / `0x140813728` |
| `commands::updater` | `src\commands\updater.rs` | Conferir e instalar atualização, atualização obrigatória (`force_update`, `min_version`), `update_history.json`, `update_config.json`, bloqueio no MSIX | `0x813474` / `0x140814474` |
| `commands::wsl` | `src\commands\wsl.rs` | Comandos do WSL (detectar, liberar, dispensar aviso) | `0x81095a` / `0x14081195a` |

Os nomes dos comandos estão juntos em dois blocos de texto — a partir de `0x80ed78` e de
`0x80e5d0` (`list_projects`, `check_for_update`, `test_embedder`, `connect_mcp_cli`,
`assemble_team_auto`…) — ponto de partida da **CLONE.1.2**.

## Pistas para as próximas subtarefas

| Subtarefa | Onde começar |
|---|---|
| CLONE.1.2 (comandos) | blocos de nomes de comandos acima; `generate_handler` em `src\lib.rs` |
| CLONE.1.3 (API) | `api::client` (`0x80d959`, `0x888008`) e as structs `Api*Response` em `0x888008` |
| CLONE.1.4 (arquivos locais) | `storage::local`; nomes vistos: `projects.json`, `mcp_config.json`, `wsl_config.json`, `auth_tokens.json`, `oauth_client.json`, `device_id.json`, `vectors.json`, `graph.json`, `entities.json`, `communities.json`, `image_api_config.json`, `update_config.json`, `update_history.json`, `agent-templates.json` |
| CLONE.1.5 (login) | `auth::*` e `graph::store` (`0x822ddd`: `/oauth/consent`, `mcp:read mcp:write`, `device_mac_address`, `device_client_version`) |
| CLONE.1.6 (vetores e grafo) | `vector::*` e `graph::*` |
| CLONE.1.7 (MCP, CLIs, WSL) | `mcp::*`, `agents::cli_discovery`, `wsl::detect`; lista de ferramentas MCP perto de `0x822733` |
| CLONE.1.8 (prompts e agentes) | `commands::agents` (`0x812578`), modelos embutidos perto de `0x82bc88` |
| CLONE.1.9 (imagem e atualizador) | `image::generation`, `updater::platform`, `commands::updater` |
| CLONE.1.10 (interface) | a `.rsrc` tem só 0x3b00 bytes: os arquivos da interface estão embutidos (comprimidos) em `.rdata`/`.data` — procurar a tabela de assets do Tauri |

## Em aberto

- Funções marcadas *(inferido)* e as responsabilidades exatas de `project::mod` e
  `commands::status`: confirmar seguindo as referências no Ghidra.
- Nenhum código foi decompilado nesta subtarefa: o mapa vem das mensagens e dos caminhos de
  arquivo, o que mostra **o que existe**, não **como funciona**.
