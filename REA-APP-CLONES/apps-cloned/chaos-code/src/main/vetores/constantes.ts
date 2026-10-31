/**
 * Constantes do módulo de vetores e grafo, num lugar só. Valores tirados de
 * `docs/inventario/vetores-grafo.md` (CLONE.1.6); os tipos vêm de `tipos-vetores.ts`.
 */

import type { ConfiguracaoPipelineRag } from '../../compartilhado/tipos-vetores';

/* ----------------------------- Pedaços ----------------------------- */

/** Tamanho do pedaço (inventário §1: imediato `0x5dc` = 1500). */
export const TAMANHO_PEDACO = 1500;

/** Sobreposição entre pedaços, em fração (inventário §1: float `0x3dcccccd` = 0,1, ou 10%). */
export const SOBREPOSICAO_PEDACO = 0.1;

/** Tamanho máximo da entrada do chunker, em bytes (inventário §1: `cmp r9, 0xa00000` = 10 MiB). */
export const LIMITE_ENTRADA_CHUNKER_BYTES = 10 * 1024 * 1024;

/** Número máximo de pedaços por documento (inventário §1: 10.000, `0x2710` no log). */
export const MAXIMO_PEDACOS = 10000;

/* ----------------------------- Provedores de embedding ----------------------------- */

/** Endereço base da OpenAI (inventário §2, modo `Api`). */
export const URL_BASE_OPENAI_EMBEDDING = 'https://api.openai.com';

/** Caminho do endpoint de embeddings da OpenAI (inventário §2). */
export const CAMINHO_EMBEDDING_OPENAI = '/v1/embeddings';

/** Modelo padrão do modo `Api` (inventário §2). */
export const MODELO_EMBEDDING_OPENAI_PADRAO = 'text-embedding-3-small';

/** Modelo alternativo listado para o modo `Api` (inventário §2). */
export const MODELO_EMBEDDING_OPENAI_GRANDE = 'text-embedding-3-large';

/** Dimensões do modelo `text-embedding-3-small` (inventário §2). */
export const DIMENSOES_EMBEDDING_OPENAI_PADRAO = 1536;

/** Dimensões do modelo `text-embedding-3-large` (inventário §2). */
export const DIMENSOES_EMBEDDING_OPENAI_GRANDE = 3072;

/** Limite mínimo de dimensões do modo `Api` (inventário §2: 1–4096). */
export const DIMENSOES_EMBEDDING_OPENAI_MINIMA = 1;

/** Limite máximo de dimensões do modo `Api` (inventário §2: 1–4096). */
export const DIMENSOES_EMBEDDING_OPENAI_MAXIMA = 4096;

/** Modelo de chat padrão do modo `Api` (inventário §2). */
export const MODELO_CHAT_OPENAI_PADRAO = 'gpt-4.1-mini';

/** Base da API Gemini de embeddings (inventário §2, modo `Gemini`). */
export const URL_BASE_GEMINI_EMBEDDING = 'https://generativelanguage.googleapis.com/v1beta/models';

/** Endpoint de embedding único do Gemini (inventário §2). */
export const ENDPOINT_GEMINI_EMBED_CONTEUDO = 'embedContent';

/** Endpoint de embedding em lote do Gemini (inventário §2). */
export const ENDPOINT_GEMINI_EMBED_LOTE = 'batchEmbedContents';

/** Modelo padrão do modo `Gemini` (inventário §2). */
export const MODELO_EMBEDDING_GEMINI_PADRAO = 'gemini-embedding-001';

/** Dimensões padrão do `gemini-embedding-001` (inventário §2). */
export const DIMENSOES_EMBEDDING_GEMINI_PADRAO = 3072;

/** Limite mínimo de dimensões do modo `Gemini` (inventário §2: 128–3072). */
export const DIMENSOES_EMBEDDING_GEMINI_MINIMA = 128;

/** Limite máximo de dimensões do modo `Gemini` (inventário §2: 128–3072). */
export const DIMENSOES_EMBEDDING_GEMINI_MAXIMA = 3072;

/** Modelo de chat padrão do modo `Gemini` (inventário §2). */
export const MODELO_CHAT_GEMINI_PADRAO = 'gemini-2.5-flash';

/** Modelo de chat padrão do modo `OpenRouter` (inventário §2). */
export const MODELO_CHAT_OPENROUTER_PADRAO = 'anthropic/claude-sonnet-4';

/** Dimensões padrão do modo `OpenRouter` (inventário §2). */
export const DIMENSOES_EMBEDDING_OPENROUTER_PADRAO = 1536;

/** Endereço padrão do embedding do modo `OpenRouter` (inventário §2). */
export const ENDPOINT_EMBEDDING_OPENROUTER_PADRAO = 'https://api.openai.com';

/** Endereço padrão do proxy do modo `Custom`, como LiteLLM (inventário §2). */
export const URL_BASE_CUSTOM_PADRAO = 'http://localhost:4000';

/** Dimensões padrão do modo `Custom` (inventário §2). */
export const DIMENSOES_EMBEDDING_CUSTOM_PADRAO = 1536;

/** Limite mínimo de dimensões do modo `Custom` (inventário §2: 1–8192). */
export const DIMENSOES_EMBEDDING_CUSTOM_MINIMA = 1;

/** Limite máximo de dimensões do modo `Custom` (inventário §2: 1–8192). */
export const DIMENSOES_EMBEDDING_CUSTOM_MAXIMA = 8192;

/* ----------------------------- Lote, taxa e cache ----------------------------- */

/** Textos por chamada de embedding (inventário §2: `embedding_batch_num` = 150). */
export const LOTE_EMBEDDING = 150;

/** Limite mínimo do tamanho do lote (inventário §2: 1–1000). */
export const LOTE_EMBEDDING_MINIMO = 1;

/** Limite máximo do tamanho do lote (inventário §2: 1–1000). */
export const LOTE_EMBEDDING_MAXIMO = 1000;

/** Chamadas de embedding simultâneas (inventário §2: `embedding_func_max_async` = 24). */
export const CONCORRENCIA_EMBEDDING = 24;

/** Requisições por minuto configuradas (inventário §2: `embedding_rpm` = 80). */
export const RPM_EMBEDDING = 80;

/** Fator de uso do RPM, em fração (inventário §2: `embedding_rpm_usage_percent` = 80%). */
export const FATOR_USO_RPM_EMBEDDING = 0.8;

/** Entradas do cache de embeddings; 0 desliga (inventário §2: `embedding_cache_size` = 1000). */
export const CACHE_EMBEDDING = 1000;

/** Tentativas extras após HTTP 429 (inventário §2: até 3). */
export const TENTATIVAS_429_EMBEDDING = 3;

/** Base da espera após 429, em segundos: espera = 5 × 2^tentativa (inventário §2). */
export const ESPERA_BASE_429_SEGUNDOS = 5;

/* ----------------------------- Índice HNSW ----------------------------- */

/** Mínimo de entradas para montar o HNSW; abaixo disso, busca linear (inventário §3). */
export const LIMITE_ENTRADAS_HNSW = 1000;

/** Parâmetro M do HNSW (inventário §3: `mov eax, 0x10` = 16). */
export const HNSW_M = 16;

/** Parâmetro efConstruction do HNSW (inventário §3: `mov ecx, 0xc8` = 200). */
export const HNSW_EF_CONSTRUCTION = 200;

/** efSearch da consulta HNSW *(inferido: em aberto no inventário §3; padrão do hnswlib)*. */
export const HNSW_EF_BUSCA = 50;

/** Multiplicador de M na camada 0 (*inferido*: `2 × M`, padrão do HNSW). */
export const HNSW_FATOR_CONEXOES_CAMADA_ZERO = 2;

/* ----------------------------- Extração ----------------------------- */

/** Máximo de entidades extraídas por pedaço (inventário §4: 50). */
export const MAXIMO_ENTIDADES_POR_PEDACO = 50;

/** Máximo de relações extraídas por pedaço (inventário §4: 100). */
export const MAXIMO_RELACOES_POR_PEDACO = 100;

/** Pedaços processados ao mesmo tempo na extração (inventário §4: 12). */
export const EXTRACAO_PEDACOS_PARALELOS = 12;

/* ----------------------------- Busca RAG ----------------------------- */

/** Sub-consultas máximas na transformação `multi_query` (inventário §5: 3). */
export const SUB_CONSULTAS_MAXIMAS = 3;

/** Candidatos enviados à reordenação (inventário §5: `max_candidates` = 20). */
export const CANDIDATOS_REORDENACAO = 20;

/** Resultados mantidos após a reordenação (inventário §5: `top_k_final` = 10). */
export const TOP_K_FINAL_REORDENACAO = 10;

/** Tempo limite da reordenação em milissegundos (inventário §5: 5000). */
export const TEMPO_LIMITE_REORDENACAO_MS = 5000;

/** Nota máxima da reordenação; a escala vai de 0 a 10 (inventário §5). */
export const NOTA_MAXIMA_REORDENACAO = 10;

/** Peso de relevância no MMR, em fração (inventário §5: 0,7; 0 = diversidade). */
export const LAMBDA_MMR = 0.7;

/** Iterações máximas do modo reflexivo (inventário §5: 2). */
export const ITERACOES_REFLEXIVO = 2;

/** Qualidade mínima para aceitar a busca no modo reflexivo (inventário §5: 0,3). */
export const QUALIDADE_MINIMA_REFLEXIVO = 0.3;

/** Padrões do pipeline RAG, todos desligados, como na interface (inventário §5). */
export const PADROES_PIPELINE_RAG: ConfiguracaoPipelineRag = {
  query_transform: {
    enabled: false,
    strategy: 'multi_query',
    max_sub_queries: SUB_CONSULTAS_MAXIMAS,
  },
  rerank: {
    enabled: false,
    max_candidates: CANDIDATOS_REORDENACAO,
    top_k_final: TOP_K_FINAL_REORDENACAO,
    timeout_ms: TEMPO_LIMITE_REORDENACAO_MS,
  },
  adaptive: {
    enabled: false,
  },
  mmr: {
    enabled: false,
    lambda: LAMBDA_MMR,
  },
  reflexive: {
    enabled: false,
    max_iterations: ITERACOES_REFLEXIVO,
    min_quality_score: QUALIDADE_MINIMA_REFLEXIVO,
  },
};

/* ----------------------------- Sincronização ----------------------------- */

/** Artigos processados em paralelo na sincronização (inventário §6: `max_parallel_insert` = 5). */
export const ARTIGOS_PARALELOS_SINCRONIZACAO = 5;
