# Inventário — ferramentas MCP, configuração nos CLIs e WSL (CLONE.1.7)

Feito por Claude Code (Opus 5.5 · executor; líder Opus 5.5) (local · main) em 2026-10-18.
Parte de [`api.md`](api.md) (rotas da plataforma e "Ferramentas MCP × rotas", que não se repete
aqui) e de [`login.md`](login.md) (login do app na plataforma).

## Método (análise estática, nada executado)

- "arq." = deslocamento no arquivo; `.rdata`: VA = arq. + `0x140001000`. Endereços `0x14…` = VA
  no código (`.text`), funções delimitadas pela tabela `.pdata`.
- **Schemas das ferramentas:** montados com `serde_json::json!` na função VA `0x140259135`–
  `0x14026d7ef` (`tools/list`). As chaves curtas (`inputSchema`, `properties`, `required`,
  `type`, `enum`, `default`, `annotations`…) estão como **imediatos** no código
  (ex.: `mov rcx, 'inputSch'` em `0x14025949c`); textos longos (descrições, `enum`, nomes de
  ferramenta) como pares (ponteiro, tamanho) em `.rdata` (arq. `0x88a760`–`0x88cf78`). A ordem das
  instruções dá a estrutura de cada schema.
- **Booleanos das anotações:** o código preenche uma vez duas posições da pilha
  (`mov word [rsp+0x1f8], 0x101` = `true` em `0x140259bf2`; `mov word [rsp+0x248], 1` = `false`
  em `0x140259c6b`) e cada anotação aponta para uma delas (`lea r9, [rsp+…]`).
- **Interface:** `assets/index-Ct94erbr.js`, `DashboardView-*.js` e `SettingsView-*.js`, extraídos
  da tabela de assets (arq. `0x87e900`, brotli; ver `comandos.md`).
- *(inferido)* = não comprovado no código; o resto cita a string ou o endereço que comprova.

## Servidor MCP local (`mcp::server`)

| Item | Valor | Evidência |
|---|---|---|
| Endereço | `0.0.0.0:<porta>`, porta padrão **19850** (texto da interface "localhost:19850"); log "MCP HTTP server escutando em http://…" | arq. `0x80e511`, `0x80e538`; JS `wsl.notConfigured` |
| Rotas (axum 0.8) | `POST /mcp/{project_id}` (JSON-RPC), `/oauth/register`, `/oauth/authorize`, `/oauth/authorize/status`, `/oauth/token`, `/.well-known/{*path}`, `/health` | arq. `0x80e3d5`–`0x80e4d8` |
| `/health` | `{ "status": "ok", "service": "chaos-code-mcp", "version": "1.11.2" }` | função `0x1402b7e73`: `"stat"`, `"ok"`, `"serv"+"vice"`, `chaos-code-mcp` (arq. `0x88d838`), `1.11.2` |
| Proteção | Recusa `Host` e `Origin` fora da lista: "Host header not allowed", "Origin not allowed" (lista exata *inferida*: localhost/127.0.0.1) | arq. `0x88e538`–`0x88e608` |
| Desligamento | No logout: "MCP HTTP server desligado (logout)"; no login: reinicia (`login.md`) | arq. `0x80e578` |
| Permissões da plataforma | Lê as ferramentas liberadas (`GET /api/projects/{p}/mcp/tools`, `api.md`); falha → libera todas ("Liberando todas as ferramentas"); ferramenta bloqueada → "Tool '…' is not enabled for this project/user. Check project permissions on the platform." | arq. `0x88a348`, `0x88a691`, `0x8131d8` |
| Base desligada | Projeto sem RAG → erro "Knowledge Base is disabled for this project. Enable it in the client to use MCP tools." (a interface só lista ferramentas se `rag_enabled`) | arq. `0x8895a0`; ref. `0x1402bfc31` |

### Autenticação de cada pedido `/mcp/{project_id}`

1. **Token de sessão (legado):** cabeçalho `X-MCP-Session-Token` (lido como `x-mcp-session-token`).
   O token é gerado ao subir o servidor ("MCP HTTP session token gerado (primeiros 8 chars)") e
   gravado em `mcp_config.json` (`session_token`) ao encerrar. Evidência: arq. `0x88d428`,
   `0x80e358`, `0x88f478`.
2. **OAuth:** `Authorization: Bearer <token>` — o prefixo é comparado sem diferenciar maiúsculas
   (`"Bear"` + `"er "` com `bswap`, VA `0x1402be546`). Aceita os tokens `mcp_at_…` do servidor de
   autorização abaixo.
3. Sem credencial válida → HTTP 401 com
   `WWW-Authenticate: Bearer realm="chaos-code-mcp", resource_metadata="http://<host>/.well-known/oauth-protected-resource/mcp/<project_id>"`
   e corpo JSON-RPC `{"jsonrpc":"2.0","error":{"code":-32000,"message":"Unauthorized: invalid or missing credentials"}}`
   (código `0xffff…8300` em `0x1402be7b1`; textos arq. `0x88d4c0`, `0x88d480`).
4. App sem login na plataforma → `-32000` "Not authenticated: please log in to the client before
   using MCP" (arq. `0x88d568`). JSON inválido → `-32700` "Parse error: …" (`0x1402bf576`,
   arq. `0x88d5d1`). Rota desconhecida → `error_description` "Endpoint not supported. See
   /.well-known/oauth-authorization-server for MCP OAuth discovery, or use the legacy
   X-MCP-Session-Token header." (arq. `0x889c50`).

### Protocolo JSON-RPC (função `0x1402bdd2d`)

| Método | Resposta | Evidência |
|---|---|---|
| `initialize` | `{ protocolVersion: "2024-11-05", capabilities: { tools: { listChanged: false } }, serverInfo: { name: "chaos-code-<…>", version: "1.11.2" }, instructions: "<texto abaixo>" }` (argumento do nome *inferido*: slug/id do projeto) | imediatos em `0x1402c03f8`–`0x1402c0897`; arq. `0x88a418`, `0x88a439`, `0x88a446` |
| `tools/list` | `{ tools: [ { name, description, inputSchema, annotations } ] }` — as 23 ferramentas abaixo | comparação `"tools/li"` em `0x1402bf9e1`; `"tool"` em `0x1402c01b3` |
| `tools/call` | `params: { name, arguments }`; resposta em texto (Markdown) com o resultado; falta de argumento → "Missing parameters" | `"tools/ca"` em `0x1402bf9ff`; arq. `0x88a659` |
| outro | "Unknown method: …" | arq. `0x8895f7` |

`instructions` (arq. `0x88a460`): "Chaos Code project management server. Provides semantic search
over project knowledge base (RAG), wiki article management, Kanban task tracking, and AI image
generation. Always use search_knowledge first to understand project context before taking
actions. Read-only tools (search, list, get) can be called in parallel."

## As 23 ferramentas MCP

Nomes e descrições curtas (comando `list_chaos_code_mcp_tools`, arq. `0x8896d8`) na mesma ordem
de `tools/list`. Anotações na ordem `readOnlyHint · destructiveHint · idempotentHint ·
openWorldHint` (V = true, F = false). As 4 ferramentas de conhecimento local (1–4) respondem com
o índice/grafo local; as demais chamam a plataforma (rotas em `api.md`).

| # | Ferramenta | Descrição curta | Anotações | Nome em |
|---|---|---|---|---|
| 1 | `search_knowledge` | Semantic search across project documentation, wiki articles, and knowledge base | V · F · V · V | `0x140259336` |
| 2 | `list_entities` | List extracted entities (…) from knowledge graph | V · F · V · F | `0x140259e2a` |
| 3 | `get_relations` | Traverse knowledge graph to find relationships between entities | V · F · V · F | `0x14025aae0` |
| 4 | `get_project_info` | Get project overview and knowledge graph statistics | V · F · V · F | `0x14025b563` |
| 5 | `list_wiki_articles` | List wiki articles from project documentation with status filter | V · F · V · V | `0x14025bacc` |
| 6 | `get_wiki_article` | Fetch full content of a wiki article by ID | V · F · V · V | `0x14025c87a` |
| 7 | `sync_wiki_articles` | Fetch wiki articles updated since a given date | V · F · V · V | `0x14025d0b4` |
| 8 | `create_wiki_article` | Create a new wiki article with Markdown content and tags | F · F · F · V | `0x14025d81a` |
| 9 | `update_wiki_article` | Update an existing wiki article content, title, or tags | F · F · V · V | `0x14025eb33` |
| 10 | `delete_wiki_article` | Soft-delete a wiki article to trash (or force-delete …) | F · V · F · V | `0x14025ffbb` |
| 11 | `restore_wiki_article` | Restore a deleted wiki article from trash | F · F · V · V | `0x140260a29` |
| 12 | `list_trashed_wiki_articles` | List wiki articles currently in trash with retention countdown (7 days) | V · F · V · V | `0x140261263` |
| 13 | `list_tasks` | List Kanban tasks filtered by status, priority, or tags | V · F · V · V | `0x140261df3` |
| 14 | `get_task` | Fetch full details of a Kanban task by ID | V · F · V · V | `0x1402631a8` |
| 15 | `create_task` | Create a new Kanban task with checklist and estimated hours | F · F · F · V | `0x1402639dc` |
| 16 | `update_task` | Update a Kanban task status, priority, or details | F · F · V · V | `0x1402658e0` |
| 17 | `delete_task` | Soft-delete a Kanban task to trash (7-day retention) | F · V · V · V | `0x14026782f` |
| 18 | `restore_task` | Restore a deleted Kanban task from trash | F · F · V · V | `0x140268063` |
| 19 | `generate_image` | Generate an AI image from text prompt (blocking, up to 3min) | F · F · F · V | `0x140268897` |
| 20 | `search_images` | Search project images by prompt text, tags, and status | V · F · V · V | `0x14026a230` |
| 21 | `get_image_status` | Get detailed status and metadata of a generated image | V · F · V · V | `0x14026b454` |
| 22 | `list_project_images` | List all generated images in the project | V · F · V · V | `0x14026bc92` |
| 23 | `delete_project_image` | Permanently delete a generated image from the project | F · V · V · V | `0x14026c6cb` |

A tabela de 27 nomes de `api.md` (arq. `0x888b40`) é a lista de permissões da plataforma; ela tem
`add_knowledge`, `list_knowledge_documents`, `delete_knowledge`, `generate_image_from_reference`,
`approve_wiki_article` e `reject_wiki_article`, que **não** são servidas por este cliente.

### Schemas de entrada (`inputSchema`)

Todos com `"type": "object"`. A descrição longa de cada ferramenta está nas linhas
`description`. Chaves marcadas † foram montadas a partir de pedaços (`movups` de `.rdata` +
imediato) e conferidas pelo tamanho; chaves marcadas ‡ não aparecem na montagem do schema e vêm
dos argumentos lidos em `tools/call` (`api.md`, função `0x14023f369`) — *(inferido)* o lugar
exato no schema.

```jsonc
// 1 search_knowledge — "Semantic search across project '<nome>' documentation, wiki articles,
// and knowledge base. Returns ranked results with relevance scores. Use for finding information
// about architecture, APIs, business rules, code patterns, or any project topic. Supports natural
// language queries." (arq. 0x88a760; o nome do projeto entra no texto)
{ "properties": {
    "query": { "type": "string", "description": "Search query text. Be specific and descriptive for better results. Supports natural language questions." },
    "top_k": { "type": "integer", "description": "Maximum number of results to return (1-100, default: 5). …", "default": 5 } },
  "required": ["query"] }
// "Query too long: maximum 10,000 characters." (handler 0x140253ee2)

// 2 list_entities (arq. 0x88aa08)
{ "properties": {
    "entity_type": { "type": "string", "description": "Filter by entity type.",
      "enum": ["person","organization","concept","technology","location","event","process","metric","other"] },
    "name": { "type": "string", "description": "Filter by name (partial match, case-insensitive)." } } }

// 3 get_relations (arq. 0x88ac70)
{ "properties": {
    "entity_name": { "type": "string", "description": "Name of the entity to find relations for." },
    "depth": { "type": "integer", "description": "Traversal depth (1-5, default: 2). …", "default": 2 } },
  "required": ["entity_name"] }

// 4 get_project_info (arq. 0x88ae50) — sem propriedades
{ }

// 5 list_wiki_articles (arq. 0x88af40)
{ "properties": {
    "status": { "type": "string", "description": "Filter by review status.",
      "enum": ["draft","pending_review","approved","rejected"] },
    "limit": { "type": "integer", "description": "Maximum number of articles (default: 20).", "default": 20 },
    "offset": { "type": "integer", "description": "Skip N articles for pagination.", "default": 0 } } }

// 6 get_wiki_article (arq. 0x88b120)
{ "properties": { "article_id": { "type": "string", "description": "UUID of the wiki article to fetch." } },
  "required": ["article_id"] }

// 7 sync_wiki_articles (arq. 0x88b248)
{ "properties": { "since": { "type": "string",
    "description": "ISO 8601 datetime to fetch updates from (e.g., '2025-01-01T00:00:00Z'). If omitted, returns all articles." } } }

// 8 create_wiki_article (arq. 0x88b3b0)
{ "properties": {
    "title": { "type": "string", "description": "Article title." },
    "content": { "type": "string", "description": "Article content in Markdown format." },
    "node_type": { "type": "string", "description": "Article type (default: document).",
      "enum": ["document","concept","task","code","note"] },
    "tags": { "type": "array", "items": { "type": "string" },
      "description": "Tags for categorization (e.g., ['architecture', 'api'])." },
    "submit_for_review‡": { "type": "boolean",
      "description": "If true, submits for review. If false, saves as draft (default: true)." } },
  "required": ["title","content"] }

// 9 update_wiki_article (arq. 0x88b660)
{ "properties": {
    "article_id": { "type": "string", "description": "UUID of the article to update." },
    "title": { "type": "string", "description": "New title (optional)." },
    "content": { "type": "string", "description": "New content in Markdown (optional)." },
    "node_type‡": { "type": "string", "description": "New article type (optional).",
      "enum": ["document","concept","task","code","note"] },
    "tags": { "type": "array", "items": { "type": "string" }, "description": "New tags (optional)." },
    "submit_for_review‡": { "type": "boolean", "description": "If true, submits for review after update (optional)." } },
  "required": ["article_id"] }

// 10 delete_wiki_article (arq. 0x88b860)
{ "properties": {
    "article_id": { "type": "string", "description": "UUID of the article to delete." },
    "force": { "type": "boolean", "description": "If true, permanently deletes the article (only valid on already-trashed articles). Default: false (soft-delete to trash).", "default": false } },
  "required": ["article_id"] }

// 11 restore_wiki_article (arq. 0x88b9d8)
{ "properties": { "article_id": { "type": "string", "description": "UUID of the trashed article to restore." } },
  "required": ["article_id"] }

// 12 list_trashed_wiki_articles (arq. 0x88bac8)
{ "properties": {
    "limit": { "type": "integer", "description": "Maximum articles to return (1-100, default: 50).",
      "default": 50, "minimum": 1, "maximum": 100 },
    "offset": { "type": "integer", "description": "Skip N articles for pagination (default: 0).",
      "default": 0, "minimum": 0 } } }

// 13 list_tasks (arq. 0x88bc50)
{ "properties": {
    "status": { "type": "string", "description": "Filter by task status.",
      "enum": ["backlog","todo","in_progress","review","done","closed"] },
    "priority": { "type": "string", "description": "Filter by priority level.",
      "enum": ["low","medium","high","urgent"] },
    "tags": { "type": "string", "description": "Filter by tag name (e.g., 'backend', 'bug')." },
    "limit": { "type": "integer", "description": "Maximum number of tasks (default: 20).", "default": 20 },
    "offset": { "type": "integer", "description": "Skip N tasks for pagination.", "default": 0 } } }

// 14 get_task (arq. 0x88bf18)
{ "properties": { "task_id": { "type": "string", "description": "UUID of the task to fetch." } },
  "required": ["task_id"] }

// 15 create_task (arq. 0x88c020)
{ "properties": {
    "title": { "type": "string", "description": "Task title (max 200 characters)." },
    "description‡": { "type": "string", "description": "Detailed task description." },
    "items": { "type": "array", "description": "Checklist items for the task.",
      "items": { "type": "object", "properties": {
          "text": { "type": "string", "description": "Checklist item text." },
          "completed": { "type": "boolean", "description": "Whether the item is completed (default: false).", "default": false } },
        "required": ["text"] } },
    "estimated_hours†": { "type": "number", "description": "Estimated hours to complete the task." },
    "status": { "type": "string", "description": "Initial status (default: backlog).",
      "enum": ["backlog","todo","in_progress","review","done","closed"] },
    "priority": { "type": "string", "description": "Priority level (default: medium).",
      "enum": ["low","medium","high","urgent"] },
    "tags": { "type": "array", "items": { "type": "string" },
      "description": "Tags for categorization (e.g., ['backend', 'bug'])." } },
  "required": ["title","description","items","estimated_hours"] }

// 16 update_task (arq. 0x88c328) — fluxo: backlog → todo → in_progress → review → done → closed
{ "properties": {
    "task_id": { "type": "string", "description": "UUID of the task to update." },
    "title": { "type": "string", "description": "New title (optional)." },
    "description‡": { "type": "string", "description": "New description (optional)." },
    "status": { "type": "string", "description": "New status (optional). Must follow allowed transitions.",
      "enum": ["backlog","todo","in_progress","review","done","closed"] },
    "priority": { "type": "string", "description": "New priority (optional).",
      "enum": ["low","medium","high","urgent"] },
    "items": { "type": "array", "description": "Updated checklist (optional).",
      "items": { "type": "object", "properties": { "text": { "type": "string" }, "completed": { "type": "boolean" } },
        "required": ["text"] } },
    "estimated_hours†": { "type": "number", "description": "New estimated hours (optional)." },
    "tags": { "type": "array", "items": { "type": "string" }, "description": "New tags (optional)." } },
  "required": ["task_id"] }

// 17 delete_task (arq. 0x88c540) e 18 restore_task (arq. 0x88c628)
{ "properties": { "task_id": { "type": "string", "description": "UUID of the task to delete." } },
  "required": ["task_id"] }
{ "properties": { "task_id": { "type": "string", "description": "UUID of the task to restore from trash." } },
  "required": ["task_id"] }

// 19 generate_image (arq. 0x88c6f0)
{ "properties": {
    "prompt": { "type": "string", "description": "Descriptive text for the image to generate. Be detailed for better results." },
    "negative_prompt†": { "type": "string", "description": "What to exclude from the image (platform provider only)." },
    "width": { "type": "integer", "description": "Image width in pixels (256-2048, default: 1024)." },
    "height": { "type": "integer", "description": "Image height in pixels (256-2048, default: 1024)." },
    "guidance_scale†": { "type": "number", "description": "Guidance scale (1-20, default: 3.5, platform only)." },
    "num_inference_steps†": { "type": "integer", "description": "Inference steps (1-100, default: 28, platform only)." },
    "seed": { "type": "integer", "description": "Seed for reproducibility." },
    "tags": { "type": "array", "items": { "type": "string" }, "description": "Tags for categorization." },
    "model†": { "type": "string", "enum": ["platform","gemini"], "default": "platform",
      "description": "Provider: platform (default, auto-fallback to gemini on quota exceeded) or gemini (direct, uses client API key)." } },
  "required": ["prompt"] }
// Prompt com menos de 3 caracteres é recusado (arq. 0x88deb7). Lê também use_knowledge_context,
// knowledge_mode (padrão "hybrid") e knowledge_top_k, fora do schema (arq. 0x88dee1).

// 20 search_images (arq. 0x88caf8)
{ "properties": {
    "query": { "type": "string", "description": "Search by text in the original prompt." },
    "tags": { "type": "array", "items": { "type": "string" }, "description": "Filter by tags." },
    "status": { "type": "string", "description": "Filter by generation status.", "enum": ["completed","pending","failed"] },
    "limit": { "type": "integer", "description": "Maximum results (default: 20).", "default": 20 },
    "offset": { "type": "integer", "description": "Skip N results for pagination.", "default": 0 } } }

// 21 get_image_status (arq. 0x88ccd0)
{ "properties": { "image_id": { "type": "string", "description": "UUID of the image to check." } },
  "required": ["image_id"] }

// 22 list_project_images (arq. 0x88cde8)
{ "properties": {
    "limit": { "type": "integer", "description": "Maximum images (default: 50).", "default": 50 },
    "offset": { "type": "integer", "description": "Skip N images for pagination.", "default": 0 } } }

// 23 delete_project_image (arq. 0x88cef0)
{ "properties": { "image_id‡": { "type": "string", "description": "UUID of the image to delete." } },
  "required": ["image_id"] }
```

Os valores de `default` numéricos 20, 50 e 100 (máximo) estão no código (`mov qword …, 0x14`
em `0x14025c247`, etc.); 5, 2, 0 e `false` são *(inferidos)* do texto das descrições — a chave
`default` está lá (imediato `"defa"`+`"ault"`), mas o valor não foi lido.

### Geração de imagem pelo MCP (`generate_image`)

Envia à plataforma ("Imagem submetida via MCP: … (projeto …). Iniciando polling...") e consulta o
status até 3 minutos; esgotado → "Generation still in progress after 3 minutes. Use
get_image_status to check later.". Plataforma responde 402 (`images_exhausted`, `storage_full`,
`no_subscription`) → tenta o Gemini local ("Tentando fallback para Gemini local..."). Erros
seguidos no polling → "Image status polling failed after … consecutive errors". Evidência:
arq. `0x88df81`–`0x88e458`.

## Servidor de autorização do MCP (`mcp::oauth`)

Para CLIs que fazem OAuth em vez do token de sessão (fluxo MCP 2024-11-05 com descoberta).

| Passo | Detalhe | Evidência |
|---|---|---|
| Descoberta do recurso | `GET /.well-known/oauth-protected-resource/mcp/{project_id}` → `{ resource: "http://<host>/mcp/<id>", authorization_servers: ["http://<host>"], bearer_methods_supported: ["header"], scopes_supported: ["mcp"] }` (valores dos dois últimos *inferidos*) | arq. `0x88cfb9`–`0x88d040`, `0x88d509` |
| Metadados do servidor | `GET /.well-known/oauth-authorization-server` → `authorization_endpoint` …`/oauth/authorize`, `token_endpoint` …`/oauth/token`, `registration_endpoint` …`/oauth/register`, `response_types_supported` `["code"]`, `grant_types_supported` `["authorization_code","refresh_token"]`, `code_challenge_methods_supported` `["S256"]`, `token_endpoint_auth_methods_supported` `["none"]`; caminho desconhecido → "Unknown .well-known metadata path." | arq. `0x88f278`–`0x88f338`, `0x88e4c8`, `0x88de58`; montado em `0x14027562d` |
| Registro dinâmico | `POST /oauth/register` com `client_name`, `redirect_uris`; só aceita `redirect_uri` `http` em loopback (`localhost`, `127.0.0.1`, `[::1]`); resposta com `client_id` (`RegisteredClient`: `client_id`, `client_name`, `redirect_uris`, + 1 *inferido*) | arq. `0x822aa0`–`0x822b99`, `0x8a0858` |
| Autorizar | `GET /oauth/authorize?response_type=code&client_id&redirect_uri&code_challenge&code_challenge_method=S256&state` — exige todos ("client_id é obrigatório", "code_challenge é obrigatório (PKCE)", "code_challenge_method deve ser S256", "response_type deve ser 'code'") | arq. `0x88e608`, `0x8229cd`, `0x8229f0` |
| Sem login no app | página HTML "Faça login primeiro" | arq. `0x88d9c3`–`0x88db47` |
| Consentimento | O app emite o evento **`mcp:consent-request`** com `{ request_id, client_name, redirect_uri }`; o navegador recebe a página "Confirme a autorização" que consulta `GET /oauth/authorize/status?request_id=…` a cada 1 s. A interface mostra o diálogo (fila se vierem vários) e chama `respond_mcp_consent({ requestId, approve })`. Status `approved` → `redirect_url` com `code` e `state`; `denied` → `redirect_url` com `error=access_denied`. Decisão é guardada ("Falha ao persistir decisão de consentimento MCP"). `request_id` errado → "request_id desconhecido ou expirado" | arq. `0x88e6e0`, `0x889f62`–`0x88a321`, `0x88d870`–`0x88d930`, `0x813130`; JS `McpConsentDialog` |
| Token | `POST /oauth/token`: `grant_type=authorization_code` (exige `code`, `client_id`, `redirect_uri`, `code_verifier`; código de uso único, confere PKCE S256 e `redirect_uri`) ou `grant_type=refresh_token` (exige `refresh_token` e `client_id`). Resposta `{ access_token: "mcp_at_…", token_type, expires_in, refresh_token: "mcp_rt_…" }` | arq. `0x822790`, `0x822906`–`0x822aa0`, `0x88d5f8`–`0x88d650` |
| Armazenamento | `McpOAuthStore` com `RegisteredClient` e `IssuedToken` (`token_hash`, `refresh_hash`, `client_id`, `scope`, `expires_at`, `refresh_expires_at`: só o hash é guardado *(inferido pelos nomes)*) | arq. `0x81f44f`, `0x8a03e8` |
| Erros OAuth | `invalid_request`, `invalid_client`, `invalid_grant`, `invalid_redirect_uri`, `access_denied`, `not_found`, `server_error`, `unsupported_grant_type`, `unsupported_response_type` | arq. `0x889480`, `0x88d650`, `0x88e608` |

Prazos de validade de `mcp_at_`/`mcp_rt_`: não identificados.

## Configuração nos CLIs (`mcp::cli_config` e `commands::agents`)

CLIs suportados (rótulos da interface `projects.mcp.clis`): **`claude`** = Claude Code,
**`gemini`** = Gemini CLI, **`codex`** = Codex. Comandos: `connect_mcp_cli({projectId, cli})` →
`{ config_path }`, `disconnect_mcp_cli`, `get_mcp_cli_status({projectId})`. Sem pasta local do
projeto → erro `local_path_required` e a interface pede a pasta (`pickAndAssociate`).

| CLI | Arquivo (na pasta local do projeto) | Conteúdo gravado | Evidência |
|---|---|---|---|
| Claude Code | `.mcp.json` | `{ "mcpServers": { "<nome>": { "type": "http", "url": "<url>", "headers": { "Authorization": "Bearer <token>" } } } }` | arq. `0x8890b3`–`0x8890d2`, `0x889204`; função `0x140239d59` (imediatos `type`, `http`, `Authoriz…`, `head…`) |
| Gemini CLI | `.gemini/settings.json` | mesma entrada dentro de `mcpServers` *(inferido: mesma função de entrada JSON; chave da URL não comprovada)* | arq. `0x889235`; funções `0x14023af18`, `0x14023b2bd` |
| Codex | `.codex/config.toml` | tabela `[mcp_servers.<nome>]` com `url = "<url>"` e `http_headers = { Authorization = "Bearer <token>" }`; `mcp_servers` que não seja tabela → erro | arq. `0x8891f3`, `0x8890f0`–`0x889110`; função `0x1402394c8` (`url`, `Authorization`, `http_headers`) |

- `<url>` = `http://localhost:<porta>/mcp/<project_id>`; se a pasta do projeto estiver no WSL,
  `http://<IP do host Windows>:<porta>/mcp/<project_id>` (sem IP → erro "A pasta do projeto está
  no WSL, mas não foi possível detectar o IP do host Windows para o WSL2…"). Arq. `0x811541`,
  `0x813281`–`0x813294`.
- `<nome>` = `chaos-code-<…>` *(inferido: prefixos `chaos-code-` e `chaos-code-project-` em
  `project::mod`, arq. `0x899469`)*. `<token>` = token de sessão do MCP *(inferido: mesmo valor
  do comando abaixo)*.
- **Segurança da gravação:** recusa pastas do sistema (`c:/windows`, `c:/program files`,
  `c:/program files (x86)`, `c:/users/public`); pasta que não existe mais → erro; arquivo existente
  inválido → "Corrija manualmente antes de conectar"; **backup** antes de alterar ("Não foi
  possível criar backup de …"); grava num **arquivo temporário** e renomeia; acrescenta ao
  `.git/info/exclude` a linha `# Chaos Code: config MCP local com credencial — não versionar` e o
  arquivo, para não versionar o token. Arq. `0x889148`–`0x8893ec`; função `0x14023c202`.

### Comandos mostrados ao usuário

| Uso | Texto | Evidência |
|---|---|---|
| `get_mcp_command` (com token) | `claude mcp add -t http -H "X-MCP-Session-Token: <token>" -s project <nome> http://localhost:<porta>/mcp/<project_id>` | arq. `0x81155b`, `0x811541` |
| Versão para exibir (token oculto) | `claude mcp add -t http -H "X-MCP-Session-Token: [TOKEN]" -s project <nome> <url>` | arq. `0x8126a8` |
| Sem token (OAuth) por CLI *(inferido: usado no status/instruções)* | `claude mcp add -t http -s project <nome> <url>` · `gemini mcp add --transport http <nome> <url>` · `codex mcp add <nome> --url <url>` | arq. `0x812fb8`–`0x813017` |

### Descoberta de agentes do Claude Code

`claude agents` com tempo limite de 5 s lista os agentes que o CLI reconhece
(`agents::cli_discovery`; "claude CLI não disponível", "claude agents: timeout de 5s excedido").
Não há descoberta de executável para Gemini/Codex: o app só grava os arquivos de configuração.
Arq. `0x810380`–`0x810490`.

## WSL (`wsl::detect` e `commands::wsl`)

| Passo | Detalhe | Evidência |
|---|---|---|
| 1. Detectar | `wsl --version` (instalado?) e `wsl --list --running --quiet` (distros rodando) | arq. `0x80ee40`, `0x80ee68` |
| 2. IP do host | `netsh interface ip show addresses`, procura o adaptador do WSL e lê o IP ("IP do host Windows para WSL2 detectado: …"; sem adaptador → "Adaptador WSL não encontrado no output do netsh") | arq. `0x80ed78`–`0x80ede0`, `0x88f57f`–`0x88f5e0` |
| 3. Modo *mirrored* | Detectado → usa `127.0.0.1` ("WSL2 em mirrored mode detectado — usando 127.0.0.1 como host IP") | arq. `0x80ed18` |
| 4. Situação | `check_wsl_status` → `{ is_windows, wsl_installed, localhost_forwarding, wslconfig_exists, running_distros, dismissed }`; o painel avisa se `is_windows && wsl_installed && !localhost_forwarding && !dismissed` | arq. `0x822be8`; JS `DashboardView` |
| 5. Corrigir | `apply_wsl_localhost_forwarding`: lê `%USERPROFILE%\.wslconfig`, faz backup `.wslconfig.bak`, grava `localhostForwarding=true` (seção `[wsl2]` *inferida*) e roda `wsl --shutdown` para reiniciar; a interface avisa antes que as distros em execução serão encerradas. Mensagens de sucesso e de falha parcial ("configurado no .wslconfig, mas wsl --shutdown falhou… Reinicie o WSL manualmente") | arq. `0x80ee98`–`0x80f1b4`, `0x88f538` |
| 6. Dispensar aviso | `dismiss_wsl_warning` grava `wsl_config.json` (`WslDismissState { dismissed, dismissed_at }`) | arq. `0x88f54d`, `0x8a0a90` |

## Em aberto

- Valores de `default` não numéricos e 5/2/0 (só a chave foi vista); chave da URL no
  `.gemini/settings.json`; nome exato do servidor (`<nome>`) gravado nos CLIs.
- Lista exata de `Host`/`Origin` permitidos; validade dos tokens `mcp_at_`/`mcp_rt_`; valores de
  `scopes_supported` e `bearer_methods_supported`.
- Em que tela aparecem os comandos sem token (`gemini mcp add`, `codex mcp add`).
