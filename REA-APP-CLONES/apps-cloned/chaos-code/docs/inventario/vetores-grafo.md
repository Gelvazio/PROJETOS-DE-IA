# Inventário — vetores e grafo do Chaos Code v3 (CLONE.1.6)

Feito por Claude Code (Opus 5.5 · herdr op3; líder Opus 5.5) (local · main) em 2026-10-18.
Mapa dos módulos: [`modulos.md`](modulos.md) · prompts do grafo (variações, HyDE, reordenação,
extração, resumo de comunidade): [`prompts-agentes.md`](prompts-agentes.md) §1 — não repetidos aqui.

## Método (análise estática, nada executado)

- Alvo: `apps-to-be-clone/chaos-code-v3-client.exe`, SHA-256 `46dab592…`.
- Fontes: (a) strings do Rust (logs, nomes de campo `serde`); (b) desmontagem pontual com
  **capstone** e limites de função pela `.pdata`; (c) **interface embutida** (tabela de assets
  brotli de `comandos.md`), principalmente `assets/SettingsView-C1pgL1fG.js` (valores padrão)
  e `assets/index-Ct94erbr.js` (textos de ajuda em pt-BR).
- **Endereços:** "arq." = deslocamento no arquivo (`.rdata`: VA = arq. + `0x140001000`);
  endereços de **código** já estão em VA.
- Os nomes de campo do `serde` vêm **sem repetição** no binário (um nome usado por duas structs
  aparece uma vez só), então as listas de campos abaixo podem estar **incompletas** — o que
  falta está marcado *(inferido)* ou em "Em aberto".

## 1. Pedaços (`vector::chunker` — `SmartChunker`)

| Parâmetro | Valor | Evidência |
|---|---|---|
| Tamanho do pedaço | **1500** | imediato `0x5dc` gravado no argumento logo antes da chamada ao chunker (VA `0x1402301a3`; chamada em `0x1402301c3`) *(unidade: bytes com ajuste à fronteira de caractere UTF-8, inferido pelas comparações com `0xbf` na função)* |
| Sobreposição | **0,1 (10%)** | float `0x3dcccccd` no mesmo argumento (VA `0x1402301af`) |
| Limite de entrada | **10 MiB** — acima disso **trunca** ("SmartChunker: entrada com … bytes (>… MB), truncando") | `cmp r9, 0xa00000` em VA `0x14017afe7`; texto arq. `0x82c27a` |
| Máximo de pedaços | **10.000** — para ao chegar ("atingiu limite máximo de chunks") | `cmp r12, 0x270e` em VA `0x14017ca58`/`0x14017d945`; `0x2710` na tabela do log, arq. `0x82c201` |
| Divisão | Por seções de Markdown (`#`, `0x23`) e parágrafos; junta trechos com `\n\n` | comparações com `0x23` (VA `0x14017b1a2`) e `mov word …, 0xa0a` (VA `0x14017d5c8`) *(regra exata inferida)* |
| Metadados do pedaço | `ChunkMetadata` (6 campos): `chunk_index`, `section_title`, `article_title`, `overlap_with_prev`, `overlap_with_next` + 1 *(inferido: `article_id`)* | arq. `0x8a0ce8`–`0x8a0d2f` |

Função do chunker: VA `0x14017afc8`–`0x14017e15a` (registro do pedaço com `0x70` bytes);
chamada só pelo pipeline de sincronização (VA `0x14022f53e`–`0x140230fcc`).

## 2. Embeddings (`vector::embedder`)

### Provedores e modelos (padrões da interface)

| Modo (`EmbedderMode`, enum com `type`) | Endereço | Modelo padrão | Dimensões | Chat padrão |
|---|---|---|---|---|
| `Api` (OpenAI) — **padrão** | `https://api.openai.com` + `/v1/embeddings` | `text-embedding-3-small` | 1536 (1–4096) | `gpt-4.1-mini` |
| `Api` — alternativa listada | idem | `text-embedding-3-large` | 3072 | — |
| `Gemini` | `https://generativelanguage.googleapis.com/v1beta/models/<modelo>:embedContent` / `:batchEmbedContents` | `gemini-embedding-001` | 3072 (128–3072) | `gemini-2.5-flash` |
| `OpenRouter` | `embedding_endpoint` próprio (padrão `https://api.openai.com`) | `text-embedding-3-small` | 1536 | `anthropic/claude-sonnet-4` |
| `Custom` (proxy, ex.: LiteLLM) | `base_url` (padrão `http://localhost:4000`), `embedding_base_url` opcional, `headers` | livre | 1536 (1–8192) | livre |

Evidências: interface `SettingsView-C1pgL1fG.js` (objetos `mode:{type:"Gemini"|"Api"|
"OpenRouter"|"Custom",…}`); Rust: URLs Gemini arq. `0x891027`–`0x89109d`, `/v1/embeddings`
`0x89124c`; nome do campo de dimensão por provedor `dimensions` (OpenAI) e
`output_dimensionality` (Gemini) arq. `0x890ed7`; arquivo `embedder_config.json` e enum
"internally tagged enum EmbedderMode" arq. `0x82bf68`. `EmbedderConfig` = 3 campos
(`mode`, `chat_model` + 1, arq. `0x8a1388`). Teste de dimensões: comando
`detect_embedding_dimensions` (`comandos.md`).

### Lotes, taxa e novas tentativas

| Item | Valor | Evidência |
|---|---|---|
| Textos por chamada | `embedding_batch_num` = **150** (1–1000) | padrão na interface; texto "Textos enviados por chamada de embedding" |
| Chamadas simultâneas | `embedding_func_max_async` = **24** | interface |
| Limite por minuto | `embedding_rpm` = **80** (1–10.000) × `embedding_rpm_usage_percent` = **80%** → RPM efetivo | interface; log "Embedder rate limiter: … RPM, …% uso = … RPM efetivo" arq. `0x891341`; espera "Embedder rate limit: aguardando …" `0x890f60` |
| Cache | `embedding_cache_size` = **1000** entradas (0 = desligado; "~6MB para 1000 entries") | interface |
| HTTP 429 | até **3 tentativas**; espera = cabeçalho `Retry-After` (segundos) se válido, senão **5 × 2^tentativa s** (5, 10, 20) | `cmp ecx, 0x1ad` e `cmp edx, 3` em VA `0x140282cb3`/`0x140282cc6`; cálculo em VA `0x14028431c` (`retry-after`, base `5`, potência de 2); logs arq. `0x8910d4`–`0x8912cd` |
| Erros | "Input vazio para embedding", "No embedding produced", "Gemini/OpenAI API error …" | arq. `0x891230`, `0x891008`, `0x891171`, `0x891311` |

Respostas lidas: `GeminiSingleEmbedResponse`/`GeminiBatchEmbedResponse` (`embeddings`),
`GeminiEmbeddingValue { values }`, `ApiEmbeddingResponse { data: [ApiEmbeddingData
{ embedding }] }` (arq. `0x8a1ab0`, `0x8a1ce0`, `0x8a1d26`, `0x8a2be8`).

## 3. Índice vetorial (`vector::index` → `vectors.json`)

| Item | Valor | Evidência |
|---|---|---|
| Arquivo | `vectors.json` (por projeto) | arq. `0x82bd60` |
| `VectorIndex` | `entries`, `hnsw`, `hnsw_stale` | arq. `0x8a0a48` |
| `VectorEntry` (5 campos) | `source_type` + *(inferido: `id`, `text`, `embedding`, `article_id`)* | arq. `0x8a0a08` |
| Limiar do HNSW | só monta com **≥ 1000** entradas ("Índice HNSW não construído: … entries (mínimo: 1000)"); abaixo, busca linear *(inferido)* | `cmp rsi, 0x3e8` em VA `0x140177184`; texto arq. `0x82bc1f` |
| **M** | **16** | `mov eax, 0x10` em VA `0x1401771ba` |
| **efConstruction** | **200** | `mov ecx, 0xc8` em VA `0x1401771c7` |
| `HnswIndex` | `lambda`, `layers`, `entry_point`, `entry_point_level`, `max_connections`, `ef_construction`, `max_level`, `node_levels` | arq. `0x8a06f8` |
| `HnswLayer` | `neighbors` | arq. `0x8a0788` |
| Nível aleatório | sorteio por nó com gerador `rand` *(inferido: `lambda` = 1/ln M, padrão HNSW)* | função de montagem VA `0x14017710f`–`0x140177fff` |
| Remoção | por `article_id` ("VectorIndex: … entries removidos para article_id=…"), marca `hnsw_stale` *(inferido)* | arq. `0x82bd11`; VA `0x140177fff` |
| Logs | "Índice HNSW construído com … entries (M=…, efConstruction=…)" e "…: … nós, … camadas" | arq. `0x82bcb0`, `0x82be31` |

## 4. Grafo (`graph::*`)

| Arquivo | Struct | Campos comprovados | Evidência |
|---|---|---|---|
| `entities.json` | `Entity` (11) | `name`, `entity_type`, `description`, `embedding`, `source_ids`, `metadata`, `aliases`, `confidence`, `profile`, `article_id` (+1) | arq. `0x8a0508`; `modulos.md` |
| `graph.json` | `Relation` (11) | `source_entity`, `target_entity`, `relation_type`, `weight`, `evidence_count`, `keywords` (+ *inferido*: `description`, `source_ids`, `article_id`…) | arq. `0x8a0b90` |
| `communities.json` | `CommunityGraph` (2) | `communities`, `entity_to_community` | arq. `0x8a18b8` |
| — | `Community` (6) | `entity_ids`, `level`, `summary_embedding` (+ *inferido*: `id`, `summary`, `title`) | arq. `0x8a1210` |

Nomes de arquivo: `graph.json`, `entities.json` (arq. `0x822e20`), `communities.json`
(`0x823223`).

### Extração de entidades (`graph::extraction`)

- Estratégias (`ExtractionConfig.strategy`): `regex` (**padrão**), `llm`, `hybrid`; limites
  `max_entities_per_chunk` = **50**, `max_relations_per_chunk` = **100** (interface; FIELDS
  serde arq. `0x87ff18`).
- `regex`: nomes próprios `\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b` e siglas `\b([A-Z]{2,})\b`
  (arq. `0x822e20`, `0x822e80`).
- `llm`: resposta `LlmExtractionResponse { entities, relations }` com `LlmEntity` (4) e
  `LlmRelation` (4: `source`, `target` + 2) (arq. `0x8a1d60`, `0x8a14d8`, `0x8a16a8`);
  falha → volta para regex ("LlmExtractor falhou (…), fazendo fallback para regex", `0x8313f8`).
- `hybrid`: junta os dois (`HybridExtractor`). Prompt: `prompts-agentes.md` §1.7.
- Extração paralela: `max_async` = **12** pedaços ao mesmo tempo (interface).

### Comunidades (`graph::community`)

- Log "CommunityGraph: … comunidades detectadas" (arq. `0x823199`); resumo curto sem LLM
  "Grupo temático contendo: …" e "Comunidade sem entidades." (`0x823223`); `summary_embedding`
  guarda o embedding do resumo.
- **Algoritmo:** nenhuma string de Louvain, Leiden, *label propagation* ou *modularity* no
  binário *(em aberto — inferido: agrupamento por componentes/propagação de rótulos sobre o grafo
  de relações, com `level` para hierarquia)*.

## 5. Busca: transformação, modos e reordenação

Configuração `rag_pipeline_config.json` (`RagPipelineConfig`, arq. `0x82bf68`, `0x82bff8`),
padrões da interface:

| Bloco | Padrão | Faixa / opções |
|---|---|---|
| `query_transform` | `enabled:false`, `strategy:"multi_query"`, `max_sub_queries:3` | estratégias `multi_query` e `hy_de` (HyDE) |
| `rerank` | `enabled:false`, `max_candidates:20`, `top_k_final:10`, `timeout_ms:5000` | "+1-3s por query" |
| `adaptive` | `enabled:false` | escolhe `local`/`global`/`hybrid` pela pergunta |
| `mmr` | `enabled:false`, `lambda:0.7` | 0 = diversidade, 1 = relevância |
| `reflexive` | `enabled:false`, `max_iterations:2`, `min_quality_score:0.3` | refaz a busca se a qualidade for baixa |

- **Transformação** (`graph::query_transform`): variações → `MultiQueryResponse { queries }`
  (arq. `0x8a2c68`); HyDE gera resposta hipotética e usa o embedding dela. Prompts:
  `prompts-agentes.md` §1.1–1.4.
- **Reordenação** (`graph::rerank`, `LlmReranker`): notas **0–10** por documento →
  `RerankResponse { scores }` (arq. `0x8a0e46`); mantém a ordem original se o número de notas
  ≠ candidatos, se o JSON falhar ou no tempo limite (arq. `0x88fea1`–`0x88ffe1`). Prompt:
  `prompts-agentes.md` §1.5.
- **Modos:** `local` (entidades e pedaços), `global` (comunidades), `hybrid`. Prefixos dos
  resultados: `chunk:`, `entity:`, `entity_profile:`, `relation:`, `community:`,
  `community_summary`, `entity_hub:` ("[Hub com … conexões]"), `hybrid:` (arq.
  `0x822ee7`–`0x822fe0`). Palavras que indicam pergunta "global" (modo adaptativo *inferido*):
  `quais`, `todos`, `todas`, `liste`, `listar`, `resuma`, `resumir`, `resumo`, `visão geral`,
  `overview`, `explique`, `descreva`, `principais`, `como funciona`, `what are`, `list all`,
  `summarize`, `describe` (arq. `0x822fe9`).
- Ferramenta MCP de busca: `top_k` 1–100, padrão **5** (arq. `0x88a928`); chat: `knowledge_mode`
  padrão `hybrid`, `knowledge_top_k` (arq. `0x88df14`). Comando `query_knowledge`: máx. 10.000
  caracteres (`modulos.md`).

## 6. Pipeline de sincronização (`commands::project` → evento `sync-progress`)

| Fase (`phase`) | O que faz | Evidência |
|---|---|---|
| `fetching` | Busca artigos da wiki em páginas (`WikiArticleList { articles, has_more }`), compara com `SyncState` (`synced_article_ids`, `article_versions`, `last_sync_at`) → novos, atualizados, apagados | arq. `0x8a09c0`, `0x8a1508`; "Sync … : página … concluída (… artigos, … chunks, … entidades, … relações) — has_more=" `0x8129d0` |
| `chunking` | "Dividindo em chunks..." — `SmartChunker` (seção 1) | arq. `0x892cfd` |
| `embedding` | "Gerando embeddings (… chunks)..." — lotes de 150 (seção 2) | arq. `0x892d1e` |
| `extracting` | "Extraindo com … (… chunks)..." — regex/llm/hybrid, 12 em paralelo | arq. `0x892d96` |
| `embedding_entities` | "Embeddings de … entidades (batch)..." | arq. `0x892d96` |
| `saving` | Grava `vectors.json`, `entities.json`, `graph.json`, `communities.json`; refaz o HNSW se ≥ 1000 | `modulos.md`; seção 3 |
| `done` / `cancelled` | Fim; "Sincronização cancelada pelo usuário" | arq. `0x892d1e`; `comandos.md` |

- Artigos em paralelo: `max_parallel_insert` = **5** (1–20) (interface).
- Resumo final: "Sincronização incremental completa: … artigos processados (… novos, …
  atualizados, … deletados), … chunks, … entidades, … relações" (arq. `0x812c69`); confirma à
  plataforma por `/wiki/sync/ack` (`modulos.md`).

## Em aberto

- Lista completa de campos de `VectorEntry`, `Entity`, `Relation`, `Community`, `LlmEntity` e
  `LlmRelation` (nomes repetidos não aparecem duas vezes no binário).
- Algoritmo exato de comunidades e como `level` é calculado.
- `efSearch` da consulta HNSW e o cálculo de `lambda`.
- Tamanho máximo de lote imposto pelo próprio provedor (além do `embedding_batch_num`).
- Unidade do tamanho do pedaço (bytes ou caracteres) e regra exata de corte.
