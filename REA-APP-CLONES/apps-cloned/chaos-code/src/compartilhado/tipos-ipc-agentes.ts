/**
 * Tipos da API de agentes exposta ao renderer (`agents:list`, `agents:get`, `agents:write`).
 */

import type { RespostaIpc } from './tipos-ipc';
import type { Agente } from './tipos-agentes';

/** Agente achado numa pasta. */
export interface AgenteListadoIpc {
  nome: string;
  cli: string;
  escopo: 'projeto' | 'global';
  caminho: string;
  agente: Agente;
}

/** Pedido de gravação de agente. */
export interface PedidoGravarAgenteIpc {
  idProjeto: string;
  agente: Agente;
  cli: string;
  escopo: string;
}

/** API de agentes exposta ao renderer. */
export interface ApiAgentes {
  listarAgentes: (
    idProjeto: string,
    escopo?: string,
  ) => Promise<RespostaIpc<AgenteListadoIpc[]>>;
  obterAgente: (
    idProjeto: string,
    nome: string,
  ) => Promise<RespostaIpc<AgenteListadoIpc>>;
  gravarAgente: (pedido: PedidoGravarAgenteIpc) => Promise<RespostaIpc<{ caminho: string }>>;
}
