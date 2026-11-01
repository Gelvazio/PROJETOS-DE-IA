/**
 * Tipos da API do MCP exposta ao renderer (`window.chaosCode`): ligar/desligar o servidor,
 * porta/token e consentimento OAuth (`respond_mcp_consent` / evento `mcp:consent-request`).
 */

import type { RespostaIpc } from './tipos-ipc';

/** Estado do servidor MCP mostrado à interface. */
export interface EstadoMcpIpc {
  rodando: boolean;
  porta: number | null;
  enderecos: string[];
}

/** Pedido de consentimento OAuth vindo do main (`mcp:consent-request`). */
export interface PedidoConsentimentoMcp {
  request_id: string;
  client_name: string;
  redirect_uri: string;
}

/** API do MCP exposta ao renderer. */
export interface ApiMcp {
  /** Estado do servidor (rodando, porta, endereços). */
  obterEstadoMcp: () => Promise<RespostaIpc<EstadoMcpIpc>>;
  /** Sobe o servidor na porta pedida. */
  ligarMcp: (porta?: number) => Promise<RespostaIpc<EstadoMcpIpc>>;
  /** Para o servidor. */
  desligarMcp: () => Promise<RespostaIpc<EstadoMcpIpc>>;
  /** Token de sessão para montar o `claude mcp add` (só quando logado). */
  obterTokenSessaoMcp: () => Promise<RespostaIpc<{ token: string }>>;
  /** Gira o token de sessão. */
  renovarTokenSessaoMcp: () => Promise<RespostaIpc<{ token: string }>>;
  /** Resolve o consentimento OAuth (`respond_mcp_consent`). */
  responderConsentimentoMcp: (
    requestId: string,
    aprovado: boolean,
  ) => Promise<RespostaIpc<{ recebido: boolean }>>;
  /** Avisa a cada pedido de consentimento; devolve a função de cancelamento. */
  aoPedirConsentimentoMcp: (
    ouvinte: (pedido: PedidoConsentimentoMcp) => void,
  ) => () => void;
}
