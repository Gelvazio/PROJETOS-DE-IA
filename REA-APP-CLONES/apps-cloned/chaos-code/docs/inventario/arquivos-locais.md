# Inventário — arquivos `*.json` locais do Chaos Code v3 (CLONE.1.4)

Feito por Claude Code (Opus 5.5 · herdr op2; líder Opus 5.5) (local · main) em 2026-10-18.
Mapa dos módulos: [`modulos.md`](modulos.md) · comandos: [`comandos.md`](comandos.md) ·
atualizador: [`imagem-atualizador.md`](imagem-atualizador.md).

Diz **onde** cada arquivo fica, **qual struct Rust** vai dentro dele, **os campos** (com os
obrigatórios) e um **exemplo**. É a base da CLONE.3.1 (`tipos-armazenamento.ts`) e da CLONE.3.2
(constantes de pasta e nomes de arquivo).

## Alvo

| Campo | Valor |
|---|---|
| Arquivo | `apps-to-be-clone/chaos-code-v3-client.exe` (11.217.920 bytes, v1.11.2) |
| SHA-256 | `46dab59253852c4cadc8ce859375f1cdaf6993a065aa8ee780d1f97e41eb044a` |
| Endereços | "arq." = deslocamento no arquivo; "VA" = endereço virtual. `.rdata`: **VA = arq. + `0x140001000`**. Funções citadas por VA (início tirado da tabela `.pdata`) |

## Como foi feito (análise estática, nada executado)

1. **Nomes de struct e quantidade de campos:** o `serde` grava o texto
   `struct <Nome> with <N> elements` para cada struct que lê; a lista completa saiu de uma busca
   por esse padrão (arq. `0x89f151`–`0x8a3229`).
2. **Nomes dos campos e ordem real:** varredura das instruções `lea reg, [rip+x]` da `.text`
   seguidas de `mov [reg+8], <tamanho>` (o par ponteiro + tamanho de um `&str`). Em cada função
   ficam os nomes que ela usa:
   - a função de **gravação** (`Serialize`, pequena) cita os campos **na ordem da struct**;
   - a função de **leitura** (`Deserialize`) cita cada campo em `duplicate_field` e, de novo, os
     **obrigatórios** em `missing_field` — é assim que a coluna "Obrig." foi preenchida.
3. **Qual struct vai em qual arquivo:** `storage::local` tem uma função genérica de gravação e
   outra de leitura, repetidas para cada tipo (15 cópias de cada). Seguindo as chamadas de cada
   cópia até o `Serialize`/`Deserialize` do tipo, e subindo até quem chama com o nome do arquivo
   (`Path::join`, VA `0x140670a50`), sai o par arquivo → struct.
4. **Pastas:** todas as chamadas a `Path::join` foram listadas com o texto passado (ponteiro em
   `r9` + tamanho em `[rsp+0x20]`).
5. **Valores padrão:** lidos na interface embutida (tabela de assets em arq. `0x87e900`, brotli —
   ver `comandos.md`), arquivo `assets/SettingsView-C1pgL1fG.js` e `assets/index-Ct94erbr.js`.
- O Ghidra (provedor do REA) foi aberto, mas a análise automática passou do limite de 330 s duas
  vezes; **nada foi decompilado**. Os **tipos** dos campos são *(inferidos)* pelo nome e pelo uso
  na interface; nomes, ordem, obrigatoriedade, pastas e o par arquivo → struct são **observados**.

## Regras de gravação (`storage::local`, `src\storage\local.rs`)

| Regra | Detalhe | Evidência |
|---|---|---|
| Pasta base | `%LOCALAPPDATA%\chaos-code-v3` (Windows: `SHGetKnownFolderPath` com `FOLDERID_LocalAppData`). Sem essa pasta, usa `.\chaos-code-v3` | GUID `{F1B32785-6FBA-4FCF-9D55-7B8E7F157091}` em arq. `0x8c5df0`; `chaos-code-v3` (13 bytes) arq. `0x892ac0`, junção em VA `0x14028bf92`; reserva `.` arq. `0x890c7f` |
| Formato | JSON **identado com 2 espaços** (`serde_json` *pretty*), UTF-8 | as 15 funções de gravação usam o texto `"  "` de arq. `0x9dcdf0` |
| Gravação atômica | grava `<arquivo>.json.tmp` e renomeia por cima; se o rename falhar, grava direto | `json.tmp` arq. `0x892a30`; "Rename atômico falhou (…), usando write direto" arq. `0x892a4e` |
| Recuperação | arquivo principal ausente → restaura do `.tmp`; JSON inválido → tenta o `.tmp` (*fallback*) | "Arquivo principal ausente, recuperando de" arq. `0x892ba9`; "JSON inválido no fallback" arq. `0x892c31` |
| IDs em caminho | ID de projeto/conversa validado: caracteres permitidos, sem `..`, comprimento limitado | "ID inválido: caracteres não permitidos", "…tentativa de path traversal…", "…comprimento fora do limite" a partir de arq. `0x892ace` |

Funções genéricas (VA): gravação `0x140288de4`, `0x14028912c`, `0x140289474`, `0x1402897bc`,
`0x140289b04`, `0x140289e4c`, `0x14028a194`, `0x14028a4dc`, `0x14028a824`, `0x14028ab6c`,
`0x14028aeb4`, `0x14028b1fc`, `0x14028b544`, `0x14028b88c`, `0x14028bbd4`; leitura de
`0x14028c1c6` a `0x1402912f4` (15).

## Mapa das pastas

```text
%LOCALAPPDATA%\chaos-code-v3\
├─ projects.json              lista de projetos (ProjectRegistry)
├─ mcp_config.json            porta e token do servidor MCP local
├─ mcp_oauth.json             clientes e tokens emitidos pelo OAuth do MCP local
├─ oauth_client.json          cliente OAuth registrado na plataforma
├─ auth_tokens.json           tokens de login cifrados (só se o keyring falhar)
├─ device_id.json             UUID do aparelho
├─ embedder_config.json       provedor de embeddings + modelo de chat + extração
├─ rag_pipeline_config.json   parâmetros do pipeline RAG
├─ image_api_config.json      provedores de imagem
├─ update_config.json         preferências do atualizador
├─ update_history.json        estado antes/depois de atualizar
├─ wsl_config.json            aviso do WSL dispensado
└─ projects\
   └─ <project_id>\           (ID inválido → projects\invalid)
      ├─ vectors.json         índice vetorial (só as entradas)
      ├─ entities.json        entidades do grafo
      ├─ graph.json           relações do grafo
      ├─ communities.json     comunidades
      └─ conversations\
         └─ <conversation_id>.json
```

- `projects` (arq. `0x81fe7e`) + `<id>` + `conversations` (arq. `0x82c9aa`): função VA
  `0x140180fa9`, chamada pelos comandos `list/get/save/delete_conversation`; `.json` do nome da
  conversa em arq. `0x811170` (perto de "Conversa não encontrada", arq. `0x811190`).
- Pasta do projeto: função VA `0x1401cc80e` (`projects` arq. `0x880232`, `invalid` arq.
  `0x88023a`); quem a usa grava e lê `graph.json`/`entities.json` (VA `0x14016e06d`/`0x14016d8b9`),
  `vectors.json` e `communities.json` (VA `0x1401cc992` e `0x1401cc573`).
- Os arquivos da raiz são juntados ao caminho guardado no `storage::local` *(inferido para
  `auth_tokens.json`, `device_id.json` e `wsl_config.json`, que têm função própria — VA
  `0x1402779f7`, `0x140281251`, `0x14027625e` — e são montados no mesmo `setup` de `src\lib.rs`)*.

## Resumo

| Arquivo | Pasta | Struct (raiz) | Gravado por | Nome do arquivo (arq.) |
|---|---|---|---|---|
| `projects.json` | base | `ProjectRegistry` | `storage::local` | `0x82c2e8` |
| `mcp_config.json` | base | objeto `{port, session_token}` | `storage::local` (lib.rs, ao abrir e ao fechar) | `0x832107` |
| `mcp_oauth.json` | base | `McpOAuthStore` | `storage::local` | `0x822a61` |
| `oauth_client.json` | base | `OAuthClientCredentials` | `storage::local` | `0x822dae` |
| `auth_tokens.json` | base *(inferido)* | `EncryptedEnvelope` → `AuthTokens` | `auth::tokens` | `0x88f7f0` |
| `device_id.json` | base *(inferido)* | objeto `{device_uuid}` | `device::fingerprint` | `0x890e97` |
| `embedder_config.json` | base | `EmbedderConfig` | `storage::local` | `0x82bf68` |
| `rag_pipeline_config.json` | base | `RagPipelineConfig` | `storage::local` | `0x82bf7c` |
| `image_api_config.json` | base | `ImageApiConfig` | `storage::local` | `0x8232d5` |
| `update_config.json` | base | `UpdateConfig` | `storage::local` | `0x813670` |
| `update_history.json` | base | `UpdateHistory` | `storage::local` | `0x87f27a` |
| `wsl_config.json` | base *(inferido)* | `WslDismissState` | `storage::local` | `0x88f54d` |
| `vectors.json` | `projects\<id>` | `VectorIndex` | `storage::local` | `0x82bd60` |
| `entities.json` | `projects\<id>` | lista de `Entity` *(lista inferida)* | `storage::local` | `0x822e2a` |
| `graph.json` | `projects\<id>` | lista de `Relation` *(lista inferida)* | `storage::local` | `0x822e20` |
| `communities.json` | `projects\<id>` | `CommunityGraph` | `storage::local` | `0x82325a` |
| `<id>.json` | `projects\<id>\conversations` | `Conversation` | `storage::local` | `.json` `0x811170` |

## Arquivos, um por um

Legenda da coluna **Obrig.**: ✅ = o `Deserialize` chama `missing_field` (sem ele a leitura
falha); — = opcional ou com padrão. Tipos *(inferidos)*.

### `projects.json` — `ProjectRegistry`

- `ProjectRegistry` (1 campo, arq. `0x8a1bb8`): `projects` — lista de `ProjectEntry`.
  Gravação VA `0x14017ef00`; arquivo gravado por `0x140289474`, lido por `0x140290d2c`.

`ProjectEntry` (12 campos, arq. `0x8a192f`; ordem do `Serialize` VA `0x14017ea28`):

| Campo | Tipo | Obrig. | Observação |
|---|---|---|---|
| `id` | string | ✅ | ID do projeto na plataforma |
| `name` | string | ✅ | |
| `description` | string ou null | ✅ | |
| `status` | string | ✅ | |
| `created_at` | string (data ISO) | ✅ | |
| `sync_state` | `SyncState` | — | a interface lê `sync_state.last_sync_at` (pode ser `null`) |
| `stats` | `ProjectStats` | — | |
| `rag_enabled` | booleano | — | `toggle_project_rag` |
| `permissions` | lista de string | — | a interface usa `permissions.includes(…)` |
| `project_role_slug` | string ou null | — | |
| `project_role_name` | string ou null | — | |
| `local_path` | string ou null | — | `set_project_local_path` |

`SyncState` (3, arq. `0x8a153f`, VA `0x14017e4f4`): `last_sync_at` (data ou null),
`synced_article_ids` (lista de IDs), `article_versions` (mapa ID do artigo → versão
*(inferido)*); nenhum obrigatório.
`ProjectStats` (4, arq. `0x8a199a`, VA `0x14017ede5`): `article_count`, `entity_count`,
`relation_count`, `chunk_count` — todos ✅, inteiros.

```json
{
  "projects": [
    {
      "id": "9b1c…",
      "name": "Loja Virtual",
      "description": "Wiki do projeto",
      "status": "active",
      "created_at": "2026-10-01T12:00:00Z",
      "sync_state": {
        "last_sync_at": "2026-10-17T22:10:00Z",
        "synced_article_ids": ["a1", "a2"],
        "article_versions": { "a1": 3, "a2": 1 }
      },
      "stats": { "article_count": 2, "entity_count": 41, "relation_count": 57, "chunk_count": 12 },
      "rag_enabled": true,
      "permissions": ["wiki.read", "tasks.read"],
      "project_role_slug": "owner",
      "project_role_name": "Dono",
      "local_path": "C:\\fontes\\loja"
    }
  ]
}
```

### `mcp_config.json`

Objeto montado em `src\lib.rs` (VA `0x1401c56c2`), sem struct com nome: chaves `port` e
`session_token` (arq. `0x832116`, logo após o nome do arquivo). Lido ao abrir ("Token MCP
reutilizado de mcp_config.json", arq. `0x87f59a`; se não houver, gera e grava: "Token MCP gerado
e persistido", arq. `0x87f6d9`) e regravado ao fechar (VA `0x140275dd1`, "mcp_config.json salvo
com sucesso antes do encerramento", arq. `0x88f4e8`). Gravação VA `0x14028b1fc`.

```json
{
  "port": 39217,
  "session_token": "<token aleatório usado no cabeçalho X-MCP-Session-Token>"
}
```

Tipos *(inferidos)*: `port` inteiro; `session_token` texto.

### `mcp_oauth.json` — `McpOAuthStore`

Servidor OAuth do próprio MCP (`mcp::oauth`). `McpOAuthStore` (texto arq. `0x81f46e`; gravação
VA `0x14016b1ea`; arquivo VA `0x14028ab6c`): `clients`, `tokens` (mapas *(inferido: chave =
`client_id` e `token_hash`)*).

`RegisteredClient` (4, arq. `0x8a0870`, VA `0x14016b31f`): `client_id` ✅, `client_name` —,
`redirect_uris` ✅ (lista), `created_at` ✅.
`IssuedToken` (6, arq. `0x8a0438`, VA `0x14016b094`): `token_hash` ✅, `refresh_hash` —,
`client_id` ✅, `scope` ✅, `expires_at` ✅, `refresh_expires_at` ✅. Guarda só o **hash** dos
tokens `mcp_at_`/`mcp_rt_` (o token em si não vai para o disco).

```json
{
  "clients": {
    "cli_7f3a…": {
      "client_id": "cli_7f3a…",
      "client_name": "Claude Code",
      "redirect_uris": ["http://127.0.0.1:53682/callback"],
      "created_at": "2026-10-17T21:00:00Z"
    }
  },
  "tokens": {
    "<sha256 do access token>": {
      "token_hash": "<sha256 do access token>",
      "refresh_hash": "<sha256 do refresh token>",
      "client_id": "cli_7f3a…",
      "scope": "mcp:read mcp:write",
      "expires_at": "2026-10-17T22:00:00Z",
      "refresh_expires_at": "2026-11-16T21:00:00Z"
    }
  }
}
```

### `oauth_client.json` — `OAuthClientCredentials`

Cliente OAuth público registrado na plataforma (`/api/oauth/register`). 3 campos (arq.
`0x8a161c`; gravação VA `0x14016c6db`; arquivo `0x140288de4`/`0x14028c79f`), todos ✅:
`client_id`, `platform_url`, `redirect_uri`. Se o `redirect_uri` mudar (porta do callback), o app
registra outro cliente (ver `modulos.md`, `auth::oauth`).

```json
{
  "client_id": "c_4d2e…",
  "platform_url": "https://chaoscode.ai",
  "redirect_uri": "http://127.0.0.1:53682/callback"
}
```

### `auth_tokens.json` — `EncryptedEnvelope` (só quando o keyring falha)

Normal: os tokens ficam no **keyring do Windows** ("Tokens armazenados no keyring nativo").
Se o keyring falhar, vai para este arquivo cifrado; quando o keyring volta, migra e apaga o
arquivo ("Migração para keyring concluída, fallback removido"). Textos a partir de arq.
`0x88f6d0`; função VA `0x1402779f7`.

- Arquivo: `EncryptedEnvelope` (2, arq. `0x8a11d1`, VA `0x140278c0a`): `v` ✅ (versão do
  formato), `data` ✅ (texto cifrado em base64 *(inferido: tabela base64 logo após os textos,
  arq. `0x88f9d3`)*).
- Conteúdo decifrado: `AuthTokens` (3, arq. `0x8a0639`, VA `0x140278b21`): `access_token`,
  `refresh_token`, `expires_at`.
- Cifra *(inferido)*: chave por HKDF-SHA256 (crate `ring`; "HKDF expand falhou", arq. `0x88fccf`)
  a partir do `device_uuid` (a função de tokens chama a do `device_id.json`, VA `0x14027931f` →
  `0x140281251`); 32 bytes constantes antes do texto do HKDF (arq. `0x88fc9c`, provável *salt*).
  Detalhe do cofre fica para a **CLONE.1.5**.

```json
{ "v": 1, "data": "<base64 de nonce + texto cifrado de {access_token, refresh_token, expires_at}>" }
```

### `device_id.json`

Função VA `0x140281251` (`src\device\fingerprint.rs`), grava identado; uma chave só,
`device_uuid` (arq. `0x887eeb`). Também é chamada no `setup` (VA `0x140280f97`).

```json
{ "device_uuid": "3f0c9a52-6d1e-4b8a-9f27-0c4e5b7d1a90" }
```

### `embedder_config.json` — `EmbedderConfig`

3 campos (arq. `0x8a1388`; lista de campos arq. `0x82bfc8`; gravação VA `0x14017a86f`; arquivo
`0x14028a194`/`0x14028d8f3`): `mode` ✅, `chat_model` —, `extraction` —.

`mode` é o enum `EmbedderMode` com **etiqueta interna `type`** ("internally tagged enum
EmbedderMode", arq. `0x82bf94`; variantes arq. `0x81fa51`; gravação VA `0x140179704`):

| `type` | Campos (ordem do `Serialize`) |
|---|---|
| `Api` | `endpoint`, `api_key`, `model`, `dimensions` |
| `OpenRouter` | `api_key`, `chat_model`, `embedding_endpoint`, `embedding_api_key`, `embedding_model`, `dimensions` |
| `Custom` | `base_url`, `api_key`, `chat_model`, `embedding_base_url` (ou null), `embedding_api_key` (ou null), `embedding_model`, `dimensions`, `headers` (lista de `HttpHeader {key, value}`, arq. `0x8a0c33`) |
| `Gemini` | `api_key`, `model`, `dimensions` |

`chat_model`: texto ou null. `extraction` = `ExtractionConfig` (3, arq. `0x8a1c65`, lista arq.
`0x87ff18`, VA `0x1401ca1e6`): `strategy` (`regex` · `llm` · `hybrid`, lista arq. `0x8320c8`),
`max_entities_per_chunk`, `max_relations_per_chunk`. Padrões da interface: modo `Api` com
`https://api.openai.com`, `text-embedding-3-small`, 1536 dimensões; extração `regex`, 50, 100.

```json
{
  "mode": {
    "type": "Api",
    "endpoint": "https://api.openai.com",
    "api_key": "sk-…",
    "model": "text-embedding-3-small",
    "dimensions": 1536
  },
  "chat_model": null,
  "extraction": {
    "strategy": "regex",
    "max_entities_per_chunk": 50,
    "max_relations_per_chunk": 100
  }
}
```

### `rag_pipeline_config.json` — `RagPipelineConfig`

12 campos (lista arq. `0x82c010`; gravação VA `0x14017ad58`; arquivo `0x14028a824`). Não tem
`struct … with N elements`: tudo com valor padrão.

| Campo | Padrão (interface) | Sub-struct (gravação VA) |
|---|---|---|
| `max_async` | 12 | |
| `max_parallel_insert` | 5 | |
| `embedding_func_max_async` | 24 | |
| `embedding_batch_num` | 150 | |
| `embedding_rpm` | 80 | |
| `embedding_rpm_usage_percent` | 80 | |
| `embedding_cache_size` | 1000 | |
| `rerank` | `{enabled:false, max_candidates:20, top_k_final:10, timeout_ms:5000}` | `RerankConfig` `0x14016f089` |
| `query_transform` | `{enabled:false, strategy:"multi_query", max_sub_queries:3}` | `0x14016ceeb`; `strategy` = `multi_query` ou `hy_d_e` (HyDE; arq. `0x822367`) |
| `adaptive` | `{enabled:false}` | `AdaptiveConfig` `0x140173746` |
| `mmr` | `{enabled:false, lambda:0.7}` | `MmrConfig` `0x140170c08` |
| `reflexive` | `{enabled:false, max_iterations:2, min_quality_score:0.3}` | `ReflexiveConfig` `0x140175ac6` |

```json
{
  "max_async": 12,
  "max_parallel_insert": 5,
  "embedding_func_max_async": 24,
  "embedding_batch_num": 150,
  "embedding_rpm": 80,
  "embedding_rpm_usage_percent": 80,
  "embedding_cache_size": 1000,
  "rerank": { "enabled": false, "max_candidates": 20, "top_k_final": 10, "timeout_ms": 5000 },
  "query_transform": { "enabled": false, "strategy": "multi_query", "max_sub_queries": 3 },
  "adaptive": { "enabled": false },
  "mmr": { "enabled": false, "lambda": 0.7 },
  "reflexive": { "enabled": false, "max_iterations": 2, "min_quality_score": 0.3 }
}
```

### `image_api_config.json` — `ImageApiConfig`

3 campos (lista arq. `0x8232f8`; gravação VA `0x140175f25`; arquivo `0x14028a4dc`), todos com
padrão: `openai` (`ImageOpenAIConfig`, VA `0x14017627f`: `endpoint`, `api_key`, `rpm_limit`),
`gemini` (`ImageGeminiConfig`, VA `0x140176089`: `api_key`, `rpm_limit`), `platform`
(`ImagePlatformConfig`, VA `0x1401764cf`: `enabled`, `default_width`, `default_height`,
`default_guidance_scale`, `default_steps`). O par struct ↔ chave vem da ordem dos nomes (arq.
`0x81f8c1`) e da interface *(inferido)*. Corrige o `imagem-atualizador.md`: **não** há `model`
nem `base_url` neste arquivo.

```json
{
  "openai": { "endpoint": "https://api.openai.com", "api_key": "", "rpm_limit": 5 },
  "gemini": { "api_key": "", "rpm_limit": 10 },
  "platform": {
    "enabled": false,
    "default_width": 1024,
    "default_height": 1024,
    "default_guidance_scale": 3.5,
    "default_steps": 28
  }
}
```

### `update_config.json` — `UpdateConfig`

3 campos (arq. `0x8a1884`, lista arq. `0x82d588`, gravação VA `0x1401842d8`, arquivo
`0x1402897bc`/`0x14028decc`): `auto_check`, `auto_install`, `check_interval_minutes`, todos com
padrão. **Não tem `channel`** (corrige o *(inferido)* do `imagem-atualizador.md`). Valores
padrão: não aparecem na interface (ela só lê e devolve) — ficam *(em aberto)*.

```json
{ "auto_check": true, "auto_install": false, "check_interval_minutes": 60 }
```

### `update_history.json` — `UpdateHistory`

7 campos (arq. `0x8a1a36`, gravação VA `0x14017f483`, arquivo `0x14028912c`/`0x140290753`):

| Campo | Tipo | Obrig. |
|---|---|---|
| `previous_version` | texto ou null | — |
| `current_version` | texto | ✅ |
| `updated_at` | data ISO ou null | — |
| `channel` | texto (ex.: `stable`) | ✅ |
| `verified` | booleano | ✅ |
| `boot_count` | inteiro | ✅ |
| `update_required` | booleano | — |

Gravado por `save_pre_update_state` antes de instalar e apagado depois de confirmar a versão
nova ("update_history.json removido", arq. `0x87f1e8`).

```json
{
  "previous_version": "1.11.2",
  "current_version": "1.11.3",
  "updated_at": "2026-10-18T09:00:00Z",
  "channel": "stable",
  "verified": false,
  "boot_count": 0,
  "update_required": false
}
```

### `wsl_config.json` — `WslDismissState`

2 campos (arq. `0x8a0aa5`, gravação VA `0x14016bdd1`, arquivo `0x140289b04`/`0x14028f61e`):
`dismissed` ✅ (booleano), `dismissed_at` — (data). Gravado por `dismiss_wsl_warning`; a tela
lê `dismissed` pelo `check_wsl_status`.

```json
{ "dismissed": true, "dismissed_at": "2026-10-17T20:30:00Z" }
```

### `projects\<id>\vectors.json` — `VectorIndex`

`VectorIndex` (3, arq. `0x8a0a5d`): `entries`, `hnsw`, `hnsw_stale` — mas a **gravação** (VA
`0x1401787ae`) escreve **só `entries`**; o HNSW é refeito na memória ao carregar (só com 1000
entradas ou mais, ver `modulos.md`). A leitura aceita `hnsw` (`HnswIndex`, 7 campos, arq.
`0x8a0752`: `layers`, `entry_point`, `entry_point_level`, `max_connections`, `ef_construction`,
`max_level`, `node_levels`; `HnswLayer` = `neighbors`).

`VectorEntry` (5, arq. `0x8a0a13`, VA `0x140178531`): `id` ✅, `text` ✅, `embedding` ✅ (lista
de números), `source_type` ✅ *(valores inferidos: pedaço de artigo ou entidade)*, `metadata` —
(`ChunkMetadata`).
`ChunkMetadata` (6, arq. `0x8a0d2f`, VA `0x140178658`): `chunk_index` ✅, `section_title` —,
`article_id` —, `article_title` —, `overlap_with_prev` ✅, `overlap_with_next` ✅.

```json
{
  "entries": [
    {
      "id": "a1#0",
      "text": "## Pagamento\nO checkout aceita Pix e cartão…",
      "embedding": [0.0123, -0.0456, 0.0789],
      "source_type": "chunk",
      "metadata": {
        "chunk_index": 0,
        "section_title": "Pagamento",
        "article_id": "a1",
        "article_title": "Checkout",
        "overlap_with_prev": false,
        "overlap_with_next": true
      }
    }
  ]
}
```

### `projects\<id>\entities.json` — `Entity`

Gravado junto com o `graph.json` pela função VA `0x14016e06d`: o caminho de `entities.json` vai
com o campo de entidades e o de `graph.json` com o de relações (ordem das instruções nessa
função). Gravação da entidade VA `0x14016e2a6`; arquivo `0x140289e4c`; leitura `0x1402912f4`.

`Entity` (11, arq. `0x8a0550`):

| Campo | Tipo | Obrig. |
|---|---|---|
| `id` | texto | ✅ |
| `name` | texto | ✅ |
| `entity_type` | `person` · `organization` · `concept` · `technology` · `location` · `process` · `metric` · `other` (arq. `0x81f7ce`) | ✅ |
| `description` | texto | ✅ |
| `embedding` | lista de números ou null | — |
| `source_ids` | lista de IDs de origem | ✅ |
| `metadata` | objeto | — |
| `aliases` | lista de texto | — |
| `confidence` | número 0–1 | — |
| `profile` | texto (resumo da entidade) | — |
| `article_id` | texto | — |

```json
[
  {
    "id": "e_pix",
    "name": "Pix",
    "entity_type": "technology",
    "description": "Meio de pagamento instantâneo aceito no checkout.",
    "embedding": [0.01, 0.02],
    "source_ids": ["a1#0"],
    "metadata": {},
    "aliases": ["PIX"],
    "confidence": 0.9,
    "profile": "Pagamento instantâneo do Banco Central.",
    "article_id": "a1"
  }
]
```

### `projects\<id>\graph.json` — `Relation`

`Relation` (11, arq. `0x8a0bd3`, gravação VA `0x140279b49`, arquivo `0x14028b88c`):
`id` ✅, `source_entity` ✅, `target_entity` ✅, `relation_type` ✅, `description` ✅,
`weight` ✅, `embedding` —, `source_ids` ✅, `confidence` —, `evidence_count` —, `keywords` —.

```json
[
  {
    "id": "r_1",
    "source_entity": "e_checkout",
    "target_entity": "e_pix",
    "relation_type": "usa",
    "description": "O checkout aceita pagamento por Pix.",
    "weight": 1.0,
    "embedding": null,
    "source_ids": ["a1#0"],
    "confidence": 0.85,
    "evidence_count": 2,
    "keywords": ["pagamento", "checkout"]
  }
]
```

### `projects\<id>\communities.json` — `CommunityGraph`

`CommunityGraph` (2, arq. `0x8a18d6`, VA `0x1401755c6`, arquivo `0x14028aeb4`/`0x14028c1c6`):
`communities` ✅ (lista de `Community`), `entity_to_community` ✅ (mapa ID da entidade → ID da
comunidade *(inferido)*).
`Community` (6, arq. `0x8a1230`, VA `0x140175470`): `id` ✅, `entity_ids` ✅, `level` ✅,
`summary` — ("Grupo temático contendo: …" quando não há LLM), `summary_embedding` —,
`keywords` —.

```json
{
  "communities": [
    {
      "id": "c_0",
      "entity_ids": ["e_checkout", "e_pix"],
      "level": 0,
      "summary": "Grupo temático contendo: Checkout, Pix",
      "summary_embedding": null,
      "keywords": ["pagamento"]
    }
  ],
  "entity_to_community": { "e_checkout": "c_0", "e_pix": "c_0" }
}
```

### `projects\<id>\conversations\<conversation_id>.json` — `Conversation`

`Conversation` (7, arq. `0x8a0dc6`, lista arq. `0x82ca10`, gravação VA `0x140181900`, arquivo
`0x14028b544`/`0x14028ea6e`): `id` ✅, `project_id` ✅, `title` ✅, `messages` ✅, `created_at` ✅,
`updated_at` ✅, `cli_session_id` —. Cada mensagem = `ChatMessage` (2, arq. `0x8a0c68`):
`role`, `content` *(inferido: o mesmo tipo do `ChatRequest {messages, project_id}`, arq.
`0x82c9e0`; a interface envia `{role:"user", content}` e guarda a resposta)*. Conversa nova
nasce com `title` = `"__new__"` e `id` = `crypto.randomUUID()` (interface).

```json
{
  "id": "5b7e2f0a-1c3d-4e5f-8a9b-0c1d2e3f4a5b",
  "project_id": "9b1c…",
  "title": "Como funciona o checkout?",
  "messages": [
    { "role": "user", "content": "Como funciona o checkout?" },
    { "role": "assistant", "content": "O checkout aceita Pix e cartão…" }
  ],
  "created_at": "2026-10-17T22:00:00.000Z",
  "updated_at": "2026-10-17T22:00:05.000Z",
  "cli_session_id": null
}
```

## Arquivos gravados fora da pasta de dados

Detalhe completo na **CLONE.1.7** (MCP e CLIs); aqui só o que o binário mostra.

| Arquivo | Onde | Conteúdo observado | Evidência (arq.) |
|---|---|---|---|
| `.mcp.json` | pasta local do projeto | `mcpServers.<nome>` com `type: "http"`, `url` e cabeçalho `Authorization: Bearer <token>` *(estrutura inferida)* | `typehttpAuthorization`, `Bearer ` `0x8890b3`; `mcpServers` `0x889204` |
| `.gemini/settings.json` | pasta local do projeto | igual ao `.mcp.json` (`mcpServers`) *(inferido)* | `0x8890e3`, `0x88923c` |
| `.codex/config.toml` | pasta local do projeto | tabela `[mcp_servers.<nome>]` com `url` e `http_headers` (`Authorization`) | `mcp_servers`, `http_headers` `0x8890f0`; função VA `0x1402394c8` |
| `.git/info/exclude` | pasta local do projeto | acrescenta `# Chaos Code: config MCP local com credencial — não versionar` + o arquivo | `0x8893ec` |
| `.wslconfig` (+ `.wslconfig.bak`) | `%USERPROFILE%` | `[wsl2]` `localhostForwarding=true`, com backup antes | `0x80ee99`, `0x88f544` |
| `.claude/agents/<nome>.md` | projeto ou usuário | agente em Markdown com frontmatter YAML (gravado via `<nome>.md.tmp`) — ver `prompts-agentes.md` | `md.tmp` `0x890e24` |

Cada gravação nos CLIs faz backup e usa arquivo temporário ("Não foi possível criar backup de",
"Falha ao escrever arquivo temporário") e recusa pastas do sistema (`c:/windows`,
`c:/program files`, `c:/users/public`).

## Nomes `*.json` que **não** são arquivos locais gravados

| Nome | O que é | Evidência (arq.) |
|---|---|---|
| `agent-templates.json` | JSON **embutido** no executável, só lido ("Falha ao parsear agent-templates.json"); conteúdo em `modelos-agente-embutidos.json` | `0x82bbe9` |
| `latest.json` | manifesto remoto do atualizador (`/api/client/releases/latest.json`) | `0x82c30c` |
| `package.json`, `composer.json`, `turbo.json`, `nx.json`, `lerna.json`, `tsconfig.json`… | só **lidos** na pasta do projeto pelo `project::manager`/`scanner::detector` | a partir de `0x88025a` |
| `conf.json`, `vercel.json`, `biome.json`, `response.json` | textos de dependências (Tauri e bibliotecas) | `0x87f4cf`, `0x8915f5` |
| `McpToolConfig` (`name`, `description`, `category`, `enabled`, `min_role`) | vem da **plataforma** (`/api/projects/<id>/mcp/tools`), não de arquivo | arq. `0x8a0678` |

## Em aberto

- **Tipos exatos** (inteiro × número, data em texto × número em `expires_at`) e se `projects`,
  `clients`, `tokens`, `entities.json` e `graph.json` são lista ou mapa: confirmar no Ghidra
  (precisa de uma análise mais longa que os 330 s do REA) ou abrindo um arquivo real gerado pelo
  app.
- Valores padrão do `UpdateConfig` e valores possíveis de `source_type` e `status` do projeto.
- Nome do servidor dentro de `mcpServers`/`mcp_servers` e formato exato do `.gemini/settings.json`
  (CLONE.1.7).
- Algoritmo de cifra do `auth_tokens.json` e o papel exato do `device_uuid` (CLONE.1.5).
