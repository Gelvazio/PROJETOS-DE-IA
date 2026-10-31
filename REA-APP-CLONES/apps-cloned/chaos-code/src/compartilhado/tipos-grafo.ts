/**
 * Tipos do grafo de conhecimento: entidades, relações, comunidades e os arquivos `graph.json`,
 * `entities.json` e `communities.json` (inventário CLONE.1.6, seção 4, e `modulos.md`,
 * `graph::*`).
 * Campos *(inferido)* ainda não foram confirmados no Ghidra.
 */

import type { EstrategiaExtracao } from './tipos-vetores';

export type { EstrategiaExtracao };

/** Tipos de entidade pedidos ao LLM na extração (prompt 1.7; uso no armazenamento *inferido*). */
export type TipoEntidade =
  | 'person'
  | 'organization'
  | 'concept'
  | 'technology'
  | 'location'
  | 'event'
  | 'process'
  | 'metric'
  | 'other';

/** Tipos de relação pedidos ao LLM (prompt 1.7; uso no armazenamento *inferido*). */
export type TipoRelacao =
  | 'uses'
  | 'causes'
  | 'part_of'
  | 'created_by'
  | 'depends_on'
  | 'implements'
  | 'extends'
  | 'contains'
  | 'produces'
  | 'related_to'
  | 'other';

/**
 * Entidade do grafo (`Entity`, 11 campos; 10 listados, o 11º não foi identificado).
 * `profile` e `metadata` têm formato *inferido*.
 */
export interface Entidade {
  name: string;
  entity_type: string;
  description: string;
  /** Embedding da entidade, ausente quando ainda não foi calculado. */
  embedding: number[] | null;
  source_ids: string[];
  metadata: Record<string, unknown>;
  aliases: string[];
  /** Confiança da extração, em fração (*inferido*). */
  confidence: number;
  /** Perfil consolidado da entidade (*inferido*). */
  profile: string | null;
  article_id: string;
}

/**
 * Relação entre duas entidades (`Relation`, 11 campos: 6 listados, os demais *inferidos*).
 */
export interface Relacao {
  source_entity: string;
  target_entity: string;
  relation_type: string;
  weight: number;
  evidence_count: number;
  keywords: string[];
  /** Descrição da relação (*inferido*). */
  description: string;
  /** Identificadores das fontes da relação (*inferido*). */
  source_ids: string[];
  /** Identificador do artigo de origem (*inferido*). */
  article_id: string;
}

/**
 * Comunidade de entidades (`Community`, 6 campos do original: `id`, `entity_ids`, `level`,
 * `summary`, `summary_embedding` e `keywords`). O `level` indica a hierarquia; `entity_ids`
 * são os membros.
 */
export interface Comunidade {
  /** Identificador da comunidade. Texto *(inferido: o inventário mostra `"c_0"`)*. */
  id: string;
  /** Membros da comunidade (nomes das entidades). */
  entity_ids: string[];
  /** Nível da comunidade; o original grava 0 (nível único). */
  level: number;
  /** Resumo do grupo (vem do prompt de resumo de comunidade). */
  summary: string;
  /** Embedding do resumo, ausente quando ainda não foi calculado. */
  summary_embedding: number[] | null;
  /** Palavras-chave da comunidade *(inferido: opcional no original)*. */
  keywords?: string[];
}

/** Conteúdo de `communities.json` (`CommunityGraph`, 2 campos). */
export interface GrafoComunidades {
  communities: Comunidade[];
  /**
   * Mapa do nome da entidade para o `id` da comunidade (*inferido: o `id` é texto, como
   * `"c_0"` no inventário*).
   */
  entity_to_community: Record<string, string>;
}

/** Conteúdo de `graph.json`: lista de relações (*lista inferida*). */
export type ArquivoGrafo = Relacao[];

/** Conteúdo de `entities.json`: lista de entidades (*lista inferida*). */
export type ArquivoEntidades = Entidade[];

/**
 * Entidade na saída do LLM (prompt 1.7): `name`, `type`, `description` e `aliases`.
 * Os 4 campos seguem o formato pedido no prompt (*inferido*: o struct do original tem 4 campos).
 */
export interface EntidadeLlm {
  name: string;
  type: TipoEntidade;
  description: string;
  aliases: string[];
}

/**
 * Relação na saída do LLM (prompt 1.7): `source`, `target`, `type` e `description`.
 * Os 4 campos seguem o formato pedido no prompt (*inferido*: o struct tem 4 campos).
 */
export interface RelacaoLlm {
  source: string;
  target: string;
  type: TipoRelacao;
  description: string;
}

/** Resposta de extração do LLM (`LlmExtractionResponse`, *inferido*). */
export interface RespostaExtracaoLlm {
  entities: EntidadeLlm[];
  relations: RelacaoLlm[];
}
