# Inventário — endpoints da API e formatos de pedido/resposta (CLONE.1.3)

Feito por Claude Code (Opus 5.5 · herdr op1; líder Opus 5.5) (local · main) em 2026-10-18.
Mapa dos módulos: [`modulos.md`](modulos.md) · comandos da interface: [`comandos.md`](comandos.md).

## Alvo e método

| Campo | Valor |
|---|---|
| Arquivo | `apps-to-be-clone/chaos-code-v3-client.exe` (SHA-256 `46dab592…`, ver `modulos.md`) |
| Servidor da plataforma | `https://chaoscode.ai` (arq. `0x822d9a`, usado em `0x14016c6a8`; também `https://chaoscode.ai/api/client/releases/latest.json` na configuração do atualizador, arq. `0x8aa452`) |
| Endereços | "arq." = deslocamento no arquivo. `.rdata`: VA = arq. + `0x140001000`; `.text`: VA = arq. + `0x140000c00` (tabela de seções do PE) |

**Como foi feito (só leitura de bytes, nada executado):**

1. **Rotas:** busca das strings `/api/` no executável (29 ocorrências) e de quem as usa no código
   (referências *rip-relativas* em `.text`, função delimitada pela tabela `.pdata`). O Rust desta
   versão grava as strings de formatação num formato compacto: byte de tamanho + texto, `0xc0` no
   lugar de cada argumento `{}` e `0x00` no fim — por isso as rotas aparecem como
   `/api/projects/` `{}` `/tasks?limit=` `{}`…
2. **Método HTTP (comprovado):** todas as chamadas da API passam por `reqwest::Client::request`
   (VA `0x140371db8`). O 3º argumento (`r8`) aponta para uma constante `http::Method` em `.rdata`,
   cujo 1º byte é a variante: `0x1408a5fe8` = 1 **GET**, `0x1408a6018` = 2 **POST**,
   `0x1408a6000` = 3 **PUT**, `0x1408a6048` = 4 **DELETE**, `0x1408a6030` = 8 **PATCH**
   (ordem do `enum Inner` do crate `http`). Cada rota abaixo cita a referência à URL e a chamada
   `Client::request` logo depois dela.
3. **Respostas:** nomes das structs serde e quantidade de campos vêm das mensagens
   `struct X with N elements` (região arq. `0x8a0100`–`0x8a1d40`). Os nomes de campo vêm das
   tabelas `FIELDS` do serde quando elas sobreviveram no binário (marcadas **[FIELDS]**); fora
   isso, das strings novas que o compilador gravou logo antes do nome da struct — associação por
   vizinhança, marcada *(inferido)*.
4. **Parâmetros e corpo:** nomes lidos pelo servidor MCP nos argumentos das ferramentas
   (`args.get("…")`, função VA `0x14023f369`) e nas strings de consulta. A composição exata do
   corpo JSON não foi decompilada: corpo marcado *(inferido)*.

### Interface (JS)

A interface embutida (28 arquivos, tabela de assets em arq. `0x87e900`, brotli) **não chama a API
diretamente**: nenhum `fetch`/`XMLHttpRequest` para `/api/` em `assets/*.js`. O único `fetch` do
`index-Ct94erbr.js` é o *modulepreload* do Vite. Tudo passa por `invoke` (ver `comandos.md`), e
quem fala com a plataforma é o Rust (`api::client`, `auth::oauth`, `mcp::server`). Os textos
`chaoscode.ai/download` e `ms-windows-store://…` da interface são links abertos no navegador.

## Regras comuns

| Item | Valor | Evidência |
|---|---|---|
| Autenticação | `Authorization: Bearer <access_token>` *(inferido: a string `Bearer ` está em `mcp::cli_config`; no cliente, a chamada `0x1402f1e7f` logo após `Client::request` recebe o token)* | arq. `0x8890c9`; VA `0x140106801` |
| Tipo do corpo | `application/json` | arq. `0x888dd8` |
| Erros HTTP → mensagem | "Sessão expirada. Faça login novamente." (401), "Acesso negado. Verifique suas permissões." (403), "Recurso não encontrado." (404), "Conflito: a operação não pode ser concluída." (409), "Dados inválidos enviados ao servidor." (400/422), "Muitas requisições. Aguarde alguns segundos." (429), "Erro no servidor. Tente novamente em instantes." (5xx), "Erro na comunicação com o servidor ({status})" (outros). Códigos *(inferidos)* pela ordem e pelo texto | arq. `0x888008`–`0x888175` |
| Erro de leitura | "Erro ao parsear <coisa>: {erro}. Resposta: {corpo}" — o cliente guarda o corpo cru para o log | ex.: arq. `0x8881f9` |
| Envelope da resposta | `{ success, data, meta }` *(inferido: `ApiTasksResponse` tem 3 campos e as strings `success`, `data`, `meta` vêm logo antes dela)* | arq. `0x8a0ae0` |
| Paginação | `meta = { total, limit, offset }` **[FIELDS]** (`TasksMeta`) | tabela arq. `0x888e48` |

## Endpoints da plataforma (`https://chaoscode.ai`)

`{p}` = id do projeto. Coluna "Onde": VA da referência à URL → VA da chamada `Client::request`.

### Login OAuth — `auth::oauth` (detalhes do fluxo na CLONE.1.5)

| Método | Rota | Corpo | Resposta | Onde |
|---|---|---|---|---|
| POST | `/api/oauth/register` | `RegisterClientRequest`: `client_name` = "Chaos Code v3 Client - …", `redirect_uris` (`http://127.0.0.1:<porta>/callback`), `grant_types` (`authorization_code`, `refresh_token`), `token_endpoint_auth_method` = `none`, `application_type` = `desktop` *(campos inferidos pelas strings em volta)* | `RegisterResponse { data }` → `RegisterResponseData { client_id, client_secret }` *(inferido; 1 e 2 campos)* | URL arq. `0x80f307`, ref. `0x1400a6e45` → POST `0x1400a5a87` / `0x1400a7464` (função `0x1400a466d`) |
| GET (navegador) | `/oauth/consent?response_type=code&client_id=…&redirect_uri=…&code_challenge=…&code_challenge_method=S256&state=…&scope=mcp:read mcp:write` | — | redireciona para `/callback?code=…&state=…` | arq. `0x822c7a`, montada em `0x14016bf03` |
| POST | `/api/oauth/token` | `grant_type` (`authorization_code` ou `refresh_token`), `code`, `redirect_uri`, `code_verifier`, `refresh_token`, `client_id` *(inferido: strings `grant_type…code_verifier refresh_token` antes de `ApiProject`, arq. `0x8a0470`; tabela `none authorization_code refresh_token` em `0x88e4e8`)* | `TokenResponse { access_token, token_type, expires_in, refresh_token }` (4 campos; nomes *inferidos*, arq. `0x8a06b0`) | arq. `0x822c8b`, montada em `0x14016bf03` e `0x14016bfe5`; POSTs da família `auth::oauth` em `0x14009f777`, `0x1400a020b`, `0x1400a0bbf`, `0x1400a2803`, `0x1400a3c41`, `0x1400a8870`, `0x1400a933a` *(qual é qual: inferido)* |
| POST | `/api/oauth/revoke` | `token` (+ `token_type_hint`, `client_id`) *(inferido: `_hint` e `client_id` antes de `src\auth\oauth.rs`, arq. `0x80f2f0`)* | — ("Revogação de token falhou ({status})") | arq. `0x822c9e`, montada em `0x14016bf03`/`0x14016bfe5` |

### Projetos — `api::client`

| Método | Rota | Corpo | Resposta | Onde |
|---|---|---|---|---|
| GET | `/api/oauth/user/projects` | — | `ApiProjectsResponse` (2 campos: `projects` + 1 *inferido*) com `ApiProject` (7 campos: `id`, `name`, `description`, `role`, `project_role_slug`, `project_role_name`, `permissions` — *inferido*) | URL arq. `0x80d9e7`, ref. `0x140106737` → **GET** `0x1401067e7` (função `0x1401063af`); log "Buscando projetos em", "Erro ao parsear projetos" |

### Ferramentas MCP do projeto — `api::client`

| Método | Rota | Corpo | Resposta | Onde |
|---|---|---|---|---|
| GET | `/api/projects/{p}/mcp/tools` | — | `McpToolListResponse` (3: `success`, `data`, `meta` *inferido*) com `McpToolInfo` (3: `name`, `description`, `category` — *inferido*, arq. `0x8a0580`) e `McpToolListMeta` | arq. `0x80dad5`, ref. `0x1400c8dea` → **GET** `0x1400c8e9b`; também `0x14023e9e6` → **GET** `0x14023ea97` (servidor MCP) |
| PUT | `/api/projects/{p}/mcp/tools` | `McpToolConfigUpdate` (3: `tool_name`, `enabled`, `min_role` — *inferido*, arq. `0x8a1100`) | `McpToolConfigUpdateResponse` | arq. `0x80dad5`, ref. `0x14011af2d` → **PUT** `0x14011af73`; "Erro ao parsear resposta update MCP tools" |
| GET | `/api/projects/{p}/mcp/tools/all` | — | `McpToolConfigResponse` (2: `success`, `data` *inferido*) com `McpToolConfig` (5: `tool_name`, `name`, `description`, `enabled`, `min_role` — *inferido*, arq. `0x8a0670`) | arq. `0x80dc1e`, ref. `0x1401027ff` → **GET** `0x140102845`; "Erro ao parsear MCP tools config" |

### Wiki (artigos) — `api::client` / servidor MCP

| Método | Rota | Corpo | Resposta | Onde |
|---|---|---|---|---|
| GET | `/api/projects/{p}/wiki/articles?limit={n}&offset={n}` (+ `&status=` opcional) | — | `WikiArticlesResponse` (3) com `WikiArticleList` (4: `articles`, `total`, `has_more` … *inferido*) e `WikiArticlesMeta` | arq. `0x888518`, ref. `0x14024c663` → **GET** `0x14024c751` |
| GET | `/api/projects/{p}/wiki/articles/{id}` | — | `WikiArticleShowResponse` (2: `success`, `data`) com `WikiArticle` (7: `id`, `title`, `content`, `node_type`, `category`, `status`, `version` — *inferido*, arq. `0x8a05c0`) | arq. `0x888496`, ref. `0x140243016` → **GET** `0x140243062` |
| POST | `/api/projects/{p}/wiki/articles` | `title`, `content`, `node_type`, `status`, `tags`, `submit_for_review` *(inferido: argumentos lidos em `0x1402571c0`–`0x140257262` e obrigatórios "Required parameter 'title'/'content'")* | artigo criado ("Article created successfully! ID: …") | arq. `0x88869e`, ref. `0x14024313e` → **POST** `0x14024318a` |
| PATCH | `/api/projects/{p}/wiki/articles/{id}` | campos alterados (`title`, `content`, `node_type`, `status`, `tags`, `submit_for_review`) *(inferido)*; aprovar/rejeitar = mesma rota mudando `status` *(inferido: não há rota própria para `approve_wiki_article`/`reject_wiki_article`)* | artigo ("Article updated successfully!") | arq. `0x888496`, ref. `0x140252412` → **PATCH** `0x14025245e` |
| DELETE | `/api/projects/{p}/wiki/articles/{id}` (com `force` → apaga de vez; sem → lixeira) *(como `force` vai no pedido: inferido)* | — | "Wiki article … moved to trash" / "… permanently deleted" | arq. `0x888496`, ref. `0x14024289f` → **DELETE** `0x14024293f`; argumento `force` em `0x140241fda` |
| POST | `/api/projects/{p}/wiki/articles/{id}/restore` | — | artigo restaurado | arq. `0x888872`, ref. `0x1402432a4` → **POST** `0x1402432f0` |
| GET | `/api/projects/{p}/wiki/articles-trash?limit={n}&offset={n}` | — | `TrashedWikiArticlesResponse` (3) com `TrashedWikiArticle` (9: os do artigo + `deleted_at`, `author` — *inferido*, arq. `0x8a0d68`) | arq. `0x888cf2`, ref. `0x14024cded` → **GET** `0x14024ce39` |
| GET | `/api/projects/{p}/wiki/sync/articles?limit={n}&offset={n}&since={data}` | — | lista para sincronizar; `deleted_article_ids` *(inferido, arq. `0x8a0608`)* | arq. `0x80dca5`, ref. `0x14009e001` → **GET** `0x14009e0db`; arq. `0x8885b2`, ref. `0x140257fcf` → **GET** `0x1402580b8` |
| POST *(inferido)* | `/api/projects/{p}/wiki/sync/ack` | ids/versões sincronizados *(inferido)* | — ("Wiki sync ack falhou") | arq. `0x80d93a`, ref. `0x1400aef24` (função `0x1400ab097`, sem chamada direta a `Client::request`: método não comprovado) |

### Tarefas — `api::client` / servidor MCP

| Método | Rota | Corpo | Resposta | Onde |
|---|---|---|---|---|
| GET | `/api/projects/{p}/tasks?limit={n}&offset={n}` + opcionais `&status=`, `&priority=`, `&tags=` | — | `ApiTasksResponse { success, data: ApiTask[], meta: TasksMeta }` | arq. `0x888177`, ref. `0x14024d6f2` → **GET** `0x14024d95b`; argumentos `priority`, `tags`, `limit`, `offset` em `0x14024d4c2`–`0x14024d5a5` |
| GET | `/api/projects/{p}/tasks/{id}` | — | `ApiTaskShowResponse { success, data: ApiTask }` (2) | arq. `0x8882a9`, ref. `0x140242ae7` → **GET** `0x140242b33` |
| POST | `/api/projects/{p}/tasks` | `title`, `description`, `status`, `priority`, `tags`, `items` (checklist `TaskItem { text, completed }`), `estimated_hours` *(inferido: argumentos lidos em `0x140250bb8`–`0x1402513a5`)* | tarefa criada | arq. `0x888222`, ref. `0x1402435f3` → **POST** `0x14024363f` |
| PATCH | `/api/projects/{p}/tasks/{id}` | campos alterados (mesmos do POST) *(inferido)* | tarefa ("Task updated successfully") | arq. `0x8882a9`, ref. `0x1402433f9` → **PATCH** `0x140243445` |
| DELETE | `/api/projects/{p}/tasks/{id}` | — | "Task … moved to trash. Can be restored" | arq. `0x8882a9`, ref. `0x14024380d` → **DELETE** `0x140243859` |
| POST | `/api/projects/{p}/tasks/{id}/restore` | — | tarefa restaurada | arq. `0x888349`, ref. `0x140242c2f` → **POST** `0x140242c7b` |

`ApiTask` (14 campos): `id`, `title`, `description`, `status`, `priority`, `items`, `estimated_hours`,
`tags`, `assignee_id`, `sprint_id`, `started_at`, `completed_at`, `created_at`, `updated_at`
*(inferido: 12 nomes aparecem logo antes de `struct ApiTask with 14 elements`, arq. `0x8a0158`;
`items`/`estimated_hours` também em `0x88c2e8`)*. `TaskItem` = 2 campos `text`, `completed`
(mensagem de erro em `0x14025744b`: "array of checklist items with {text, completed} objects").

### Imagens — `api::client` / servidor MCP

| Método | Rota | Corpo | Resposta | Onde |
|---|---|---|---|---|
| GET | `/api/projects/{p}/images?limit={n}&offset={n}` (+ `&status=`, `&query=`, `&tags[]=`… na busca) | — | `ApiProjectImageListResponse` (3: `success`, `data`, `meta: ApiImageListMeta`) com `ApiProjectImage` (15 campos; vistos: `id`, `status`, `filename`, `original_prompt`, `negative_prompt`, `model_version`, `storage_url`, `thumbnail_url`, `seed`, `generation_time_ms`, `width`, `height`, `tags`, `created_at` — *inferido*, arq. `0x8a0928`) | arq. `0x80dd8e`, ref. `0x14010ab0f` → **GET** `0x14010ade2`; `0x140117ef0` → **GET** `0x140117f36`; arq. `0x888742`: `0x1402445b2` → **GET** `0x1402445fe`, `0x14024e15e` → **GET** `0x14024e468` (`&query=`, `&tags[]=` em arq. `0x888da9`) |
| GET | `/api/projects/{p}/images/{id}` | — | `PlatformImageStatus` **[FIELDS]**: `id`, `status`, `original_prompt`, `storage_url`, `thumbnail_url`, `error_message`, `generation_time_ms`, `model_version`, `width`, `height`, `tags`, `created_at` | arq. `0x888839`, ref. `0x1402368e5` → **GET** `0x140236923`; tabela FIELDS arq. `0x888ee0` |
| DELETE | `/api/projects/{p}/images/{id}` | — | "Image … deleted successfully" | arq. `0x80de14`, ref. `0x14012fa51` → **DELETE** `0x14012fa97`; arq. `0x888839`, ref. `0x140242d77` → **DELETE** `0x140242dc3` |
| POST | `/api/projects/{p}/images/generate` | `prompt`, `negative_prompt`, `width`, `height`, `guidance_scale`, `num_inference_steps`, `seed`, `tags`… (`PlatformGenerateData`, 9 campos — *inferido*, arq. `0x8a1260`) | `PlatformGenerateResponse` (3) com `data: PlatformGenerateData`; cota estourada → `QuotaExceededResponse` (8: `quota_exceeded`, `images_used`, `images_limit`, `quota_type`, `storage_used`, `storage_limit` + 2 *inferidos*, arq. `0x8a1418`) — "Quota excedida: …" | arq. `0x88890a`, ref. `0x14026fc8e` → **POST** `0x14026fcd8` (função `0x14026e733`) |

### Cliente (sem projeto)

| Método | Rota | Corpo | Resposta | Onde |
|---|---|---|---|---|
| GET | `/api/client/agent-templates?category={c}` | — | `AgentTemplatesResponse { templates }` (1) com `AgentTemplate` (7: `id`, `name`, `description`, `category`, `frontmatter`, `systemPrompt`, … — *inferido*, arq. `0x8a1028`); `frontmatter` com os 14 campos **[FIELDS]** `name description tools disallowedTools model color permissionMode memory maxTurns background effort isolation initialPrompt extra` (arq. `0x890670`) | arq. `0x80e1c2`, ref. `0x14012bbec` → **GET** `0x14012bd42`; "Buscando agent templates em" |
| GET | `/api/client/releases/latest.json` | — | manifesto do `tauri-plugin-updater` **[FIELDS]** `name version notes pub_date platforms url signature` (arq. `0x89ca78`); `platforms.<alvo> = { url, signature }` (`ReleaseManifestPlatform`, 2) | arq. `0x82c2f7` (ref. `0x14017f010`) e `0x8aa452`; requisição feita pelo plugin (método GET *inferido*) — detalhes na CLONE.1.9 |

## APIs de terceiros (`/api/` e afins que não são da plataforma)

| Destino | Método | Rota | Onde |
|---|---|---|---|
| OpenRouter | POST | `https://openrouter.ai/api/v1/chat/completions`, cabeçalhos `HTTP-Referer: https://chaoscode.ai` e `X-Title: Chaos Code` | arq. `0x811075`, `0x8994ee`; cabeçalhos arq. `0x8998a4` (ref. `0x1402d35c6`) |
| Gemini | POST | `https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent` (também `embedContent`/`batchEmbedContents`) | arq. `0x811075`; respostas `GeminiResponse`, `GeminiCandidate`, `GeminiInlineData { mimeType, data }`, `GeminiBatchEmbedResponse`… |
| OpenAI e proxies | POST / GET | `/v1/chat/completions`, `/v1/embeddings`, `/v1/models` | `modulos.md` (`vector::embedder`, `graph::llm`, `commands::settings`); respostas `OpenAIChatResponse { choices }`, `ApiEmbeddingResponse { data: ApiEmbeddingData { embedding } }` |

POST comprovado nas funções de LLM/embeddings: `0x1401ca564`, `0x1401caf18`, `0x140273753`,
`0x1402820bf`, `0x1402cb4ea`, `0x1402cdd91` (todas com a constante POST `0x1408a6018`).

## Rotas locais (servidor MCP do próprio app — não são da plataforma)

`/mcp/{project_id}`, `/oauth/register`, `/oauth/authorize`, `/oauth/authorize/status`,
`/oauth/token`, `/.well-known/{*path}`, `/health` (arq. `0x80e400`–`0x80e480`, montadas em
`0x14009e7a7`; metadados em `0x14027562d`). Detalhes na CLONE.1.7.

## Ferramentas MCP × rotas

Lista das 27 ferramentas (tabela arq. `0x888b40`): `create_task`, `list_tasks`, `get_task`,
`update_task`, `delete_task`, `restore_task`, `create_wiki_article`, `list_wiki_articles`,
`get_wiki_article`, `update_wiki_article`, `approve_wiki_article`, `reject_wiki_article`,
`delete_wiki_article`, `restore_wiki_article`, `list_trashed_wiki_articles`, `search_knowledge`,
`add_knowledge`, `list_knowledge_documents`, `delete_knowledge`, `list_entities`, `get_relations`,
`get_project_info`, `generate_image`, `generate_image_from_reference`, `list_project_images`,
`delete_project_image`, `sync_wiki_articles`. As de tarefas, wiki e imagens usam as rotas acima;
`search_knowledge`, `list_entities`, `get_relations` e `get_project_info` respondem com o índice
local (sem rota da plataforma: nenhuma URL no trecho delas). `add_knowledge`,
`list_knowledge_documents`, `delete_knowledge`, `generate_image_from_reference` e
`get_image_status`: rota não identificada.

## Em aberto

- **Campos marcados *(inferido)*:** confirmar no Ghidra cada `visit_map` das structs (as
  funções que usam `struct X with N elements` foram localizadas; ex.: `ApiTask` → `0x1403a4da3`,
  `ApiProject` → `0x14038d783`, `TokenResponse` → `0x14038fe22`).
- **Corpo exato** de POST/PATCH (tarefas, wiki, imagens, OAuth): nomes vêm dos argumentos lidos;
  falta ver a montagem do JSON.
- **Método do `/wiki/sync/ack`** (função `0x1400ab097`) e qual dos 7 POSTs de `auth::oauth` é
  token, renovação ou revogação.
- **Dois GETs sem URL identificada:** `0x14009fce7` (função `0x14009fc2c`) e `0x1400e0c6f` (função
  `0x1400e0842`) — candidato: `check_platform_online` *(inferido)*.
- Códigos HTTP de cada mensagem de erro.
