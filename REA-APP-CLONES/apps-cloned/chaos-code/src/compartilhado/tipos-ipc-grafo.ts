/**
 * Tipos da API do grafo exposta ao renderer (`window.chaosCode`). Espelha os comandos
 * `commands::query`: `query_knowledge`, `search_entities` e `get_graph_data`.
 */

import type { RespostaIpc } from './tipos-ipc';
import type { ModoBusca, ResultadoBusca } from './tipos-vetores';
import type { Entidade, Relacao } from './tipos-grafo';

/** Resultado de `query_knowledge` (mesmo formato do serviço de consulta). */
export interface ResultadoConsultaIpc extends ResultadoBusca {
  id: string;
  texto: string;
  pontuacao: number;
}

/** Dados do grafo para visualização (`get_graph_data`: entidade central + vizinhança). */
export interface DadosGrafoIpc {
  entidades: Entidade[];
  relacoes: Relacao[];
}

/** API do grafo exposta ao renderer. */
export interface ApiGrafo {
  /** Consulta o conhecimento do projeto (`query_knowledge`: `query`, `topK`, `mode`). */
  consultarConhecimento: (
    idProjeto: string,
    consulta: string,
    opcoes?: { modo?: ModoBusca; topK?: number },
  ) => Promise<RespostaIpc<ResultadoConsultaIpc[]>>;
  /** Busca entidades por nome e/ou tipo (`search_entities`). */
  buscarEntidades: (
    idProjeto: string,
    nome?: string,
    tipo?: string,
  ) => Promise<RespostaIpc<Entidade[]>>;
  /** Vizinhança de uma entidade até `depth` níveis (`get_graph_data`). */
  obterDadosGrafo: (
    idProjeto: string,
    nomeEntidade?: string,
    profundidade?: number,
  ) => Promise<RespostaIpc<DadosGrafoIpc>>;
}
