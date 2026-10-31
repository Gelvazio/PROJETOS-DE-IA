/**
 * Tipos dos pedaços (chunks), do índice vetorial, dos embeddings, da busca RAG e da
 * sincronização
 * (inventário CLONE.1.6, `docs/inventario/vetores-grafo.md`). Só tipos: as constantes numéricas
 * ficam na CLONE.6.2. Campos *(inferido)* ainda não foram confirmados no Ghidra.
 */

/** Metadados de um pedaço (`ChunkMetadata`, 6 campos; o 6º é *inferido*). */
export interface MetadadosPedaco {
  chunk_index: number;
  section_title: string | null;
  article_title: string;
  /** Trecho do pedaço anterior repetido no início (*tipo inferido*). */
  overlap_with_prev: string | null;
  /** Trecho do próximo pedaço repetido no fim (*tipo inferido*). */
  overlap_with_next: string | null;
  /** Identificador do artigo de origem (*inferido*). */
  article_id: string;
}

/** Pedaço de texto de um artigo (nome da struct não identificado; campos *inferidos*). */
export interface Pedaco {
  texto: string;
  metadata: MetadadosPedaco;
}

/**
 * Entrada do índice vetorial (`VectorEntry`, 5 campos, `docs/inventario/arquivos-locais.md`):
 * `id`, `text`, `embedding` e `source_type` obrigatórios; `metadata` opcional. O artigo da
 * entrada fica em `metadata.article_id`.
 */
export interface EntradaIndice {
  id: string;
  text: string;
  embedding: number[];
  source_type: string;
  metadata?: MetadadosPedaco | null;
}

/** Camada do grafo HNSW (`HnswLayer`, *inferido*: vizinhos por nó). */
export interface CamadaHnsw {
  neighbors: number[][];
}

/** Índice HNSW (`HnswIndex`, 8 campos *inferidos* pelos nomes). */
export interface IndiceHnsw {
  lambda: number;
  layers: CamadaHnsw[];
  entry_point: number | null;
  entry_point_level: number;
  max_connections: number;
  ef_construction: number;
  max_level: number;
  node_levels: number[];
}

/** Índice vetorial do projeto, gravado em `vectors.json` (`VectorIndex`). */
export interface IndiceVetorial {
  entries: EntradaIndice[];
  hnsw: IndiceHnsw | null;
  hnsw_stale: boolean;
}

/** Tipos de provedor de embedding (campo `type` do enum `EmbedderMode`). */
export type TipoProvedorEmbedding = 'Api' | 'Gemini' | 'OpenRouter' | 'Custom';

/** Cabeçalho HTTP de um provedor Custom (`HttpHeader`, 2 campos). */
export interface CabecalhoHttp {
  key: string;
  value: string;
}

/** Modo `Api` em `embedder_config.json` (ordem do `Serialize`). */
export interface ModoEmbeddingApi {
  type: 'Api';
  endpoint: string;
  api_key: string;
  model: string;
  dimensions: number;
}

/** Modo `Gemini` em `embedder_config.json`. */
export interface ModoEmbeddingGemini {
  type: 'Gemini';
  api_key: string;
  model: string;
  dimensions: number;
}

/** Modo `OpenRouter` em `embedder_config.json`. */
export interface ModoEmbeddingOpenRouter {
  type: 'OpenRouter';
  api_key: string;
  chat_model: string;
  embedding_endpoint: string;
  embedding_api_key: string;
  embedding_model: string;
  dimensions: number;
}

/** Modo `Custom` (proxy como LiteLLM); os campos de embedding podem ser null. */
export interface ModoEmbeddingCustom {
  type: 'Custom';
  base_url: string;
  api_key: string;
  chat_model: string;
  embedding_base_url: string | null;
  embedding_api_key: string | null;
  embedding_model: string;
  dimensions: number;
  headers: CabecalhoHttp[];
}

/** Modo de embedding, discriminado pela etiqueta `type`. */
export type ModoEmbedding =
  | ModoEmbeddingApi
  | ModoEmbeddingGemini
  | ModoEmbeddingOpenRouter
  | ModoEmbeddingCustom;

/** Estratégias de extração de entidades (`ExtractionConfig.strategy`). */
export type EstrategiaExtracao = 'regex' | 'llm' | 'hybrid';

/** Extração dentro de `embedder_config.json` (`ExtractionConfig`, 3 campos). */
export interface ConfiguracaoExtracao {
  strategy: EstrategiaExtracao;
  max_entities_per_chunk: number;
  max_relations_per_chunk: number;
}

/** Conteúdo de `embedder_config.json` (`EmbedderConfig`, 3 campos; `mode` é obrigatório). */
export interface ConfiguracaoEmbedder {
  mode: ModoEmbedding;
  chat_model?: string | null;
  extraction?: ConfiguracaoExtracao;
}

/** Modos de busca no grafo e nos pedaços. */
export type ModoBusca = 'local' | 'global' | 'hybrid';

/** Tipo do resultado, pelo prefixo usado no texto do original. */
export type TipoResultadoBusca =
  | 'chunk'
  | 'entity'
  | 'entity_profile'
  | 'relation'
  | 'community'
  | 'community_summary'
  | 'entity_hub'
  | 'hybrid';

/** Um resultado de busca (estrutura *inferida*; os prefixos vêm do original). */
export interface ResultadoBusca {
  id: string;
  tipo: TipoResultadoBusca;
  texto: string;
  pontuacao: number;
}

/**
 * Estratégias de transformação da consulta. O `hy_d_e` é o nome do original: a string existe no
 * binário (arq. `0x822372`, logo após `multi_query`); `hy_de` não existe.
 */
export type EstrategiaTransformacaoConsulta = 'multi_query' | 'hy_d_e';

/** Bloco `query_transform` de `rag_pipeline_config.json`. */
export interface ConfiguracaoTransformacaoConsulta {
  enabled: boolean;
  strategy: EstrategiaTransformacaoConsulta;
  max_sub_queries: number;
}

/** Bloco `rerank` de `rag_pipeline_config.json` (`RerankConfig`). */
export interface ConfiguracaoReordenacao {
  enabled: boolean;
  max_candidates: number;
  top_k_final: number;
  timeout_ms: number;
}

/** Bloco `adaptive` de `rag_pipeline_config.json` (`AdaptiveConfig`). */
export interface ConfiguracaoAdaptativa {
  enabled: boolean;
}

/** Bloco `mmr` de `rag_pipeline_config.json` (`MmrConfig`). */
export interface ConfiguracaoMmr {
  enabled: boolean;
  /** 0 = diversidade, 1 = relevância. */
  lambda: number;
}

/** Bloco `reflexive` de `rag_pipeline_config.json` (`ReflexiveConfig`). */
export interface ConfiguracaoReflexiva {
  enabled: boolean;
  max_iterations: number;
  min_quality_score: number;
}

/**
 * Conteúdo de `rag_pipeline_config.json` (`RagPipelineConfig`, 12 campos). Cada campo tem valor
 * padrão no original, então nenhum é obrigatório no arquivo. Os 7 primeiros são os ajustes de
 * lote, taxa e cache dos embeddings, que ficam no topo do arquivo.
 */
export interface ConfiguracaoPipelineRag {
  max_async?: number;
  max_parallel_insert?: number;
  embedding_func_max_async?: number;
  embedding_batch_num?: number;
  embedding_rpm?: number;
  embedding_rpm_usage_percent?: number;
  embedding_cache_size?: number;
  rerank?: ConfiguracaoReordenacao;
  query_transform?: ConfiguracaoTransformacaoConsulta;
  adaptive?: ConfiguracaoAdaptativa;
  mmr?: ConfiguracaoMmr;
  reflexive?: ConfiguracaoReflexiva;
}

/** Estado da sincronização de um projeto (`SyncState`); nenhum campo é obrigatório. */
export interface EstadoSincronizacao {
  /** Data da última sincronização, ou null se nunca sincronizou. */
  last_sync_at?: string | null;
  synced_article_ids?: string[];
  /** Mapa do ID do artigo para a versão (*tipo inferido*). */
  article_versions?: Record<string, number>;
}

/** Fases do pipeline de sincronização (campo `phase` do evento `sync-progress`). */
export type FaseSincronizacao =
  | 'fetching'
  | 'chunking'
  | 'embedding'
  | 'extracting'
  | 'embedding_entities'
  | 'saving'
  | 'done'
  | 'cancelled';

/** Progresso enviado pelo evento `sync-progress`; os outros campos não foram identificados. */
export interface ProgressoSincronizacao {
  phase: FaseSincronizacao;
}
