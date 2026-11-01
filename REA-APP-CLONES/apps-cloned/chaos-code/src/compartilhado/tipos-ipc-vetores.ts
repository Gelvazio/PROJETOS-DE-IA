/**
 * Tipos da API de vetores exposta ao renderer pelo preload (`window.chaosCode`).
 * Espelha os comandos `commands::project` ligados à indexação: `sync_project`, `cancel_sync`,
 * `get_project_rag_status`, `toggle_project_rag` e a busca dos pedaços.
 */

import type { RespostaIpc } from './tipos-ipc';
import type { ProjetoLocal } from './tipos-armazenamento';
import type { ProgressoSincronizacao } from './tipos-vetores';

/** Status RAG/indexação de um projeto (`get_project_rag_status`). */
export interface StatusRagProjeto {
  rag_enabled: boolean;
  sync_state: ProjetoLocal['sync_state'] | null;
}

/** Resumo devolvido ao fim da indexação (`sync_project`). */
export interface ResumoIndexacaoIpc {
  documentos: number;
  pedacos: number;
  totalEntradas: number;
  cancelada: boolean;
}

/** Resultado de busca nos vetores, sem o embedding. */
export interface ResultadoBuscaVetores {
  id: string;
  score: number;
  source_type: string;
  text: string;
  metadata: Record<string, unknown> | null;
}

/** API de vetores exposta ao renderer. */
export interface ApiVetores {
  /** Indexa (ou reindexa) o projeto; progresso chega por `aoProgredirIndexacao`. */
  indexarProjeto: (idProjeto: string) => Promise<RespostaIpc<ResumoIndexacaoIpc>>;
  /** Cancela a indexação em andamento do projeto (`cancel_sync`). */
  cancelarIndexacao: (idProjeto: string) => Promise<RespostaIpc<{ cancelada: boolean }>>;
  /** Busca os pedaços mais parecidos com a consulta no índice do projeto. */
  buscarVetores: (
    idProjeto: string,
    consulta: string,
    k?: number,
  ) => Promise<RespostaIpc<ResultadoBuscaVetores[]>>;
  /** Status RAG/indexação do projeto (`get_project_rag_status`). */
  obterStatusRag: (idProjeto: string) => Promise<RespostaIpc<StatusRagProjeto>>;
  /** Liga/desliga o RAG do projeto (`toggle_project_rag`). */
  alternarRag: (idProjeto: string, ligado: boolean) => Promise<RespostaIpc<StatusRagProjeto>>;
  /** Avisa a cada passo da indexação (`sync-progress`); devolve a função de cancelamento. */
  aoProgredirIndexacao: (ouvinte: (progresso: ProgressoIndexacaoIpc) => void) => () => void;
}

/** Progresso da indexação mandado às janelas (`sync-progress` do original). */
export interface ProgressoIndexacaoIpc extends ProgressoSincronizacao {
  project_id: string;
}
