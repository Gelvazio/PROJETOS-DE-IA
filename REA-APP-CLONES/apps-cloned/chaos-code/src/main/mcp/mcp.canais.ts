/**
 * Canais IPC do MCP (`mcp:*`): estado, ligar/desligar, token de sessão e consentimento
 * OAuth. O token sai do main só para a interface montar o `claude mcp add`.
 */

import { CANAIS_IPC } from '../../compartilhado/constantes';
import {
  registrarCanalSeguro,
  type DifundirParaJanelas,
  type IpcMainMinimo,
} from '../ipc/ipc-comum';
import type { ServicoMcp } from './mcp.servico';

const PORTA_MINIMA = 0;
const PORTA_MAXIMA = 65_535;
const MSG_PORTA_INVALIDA = 'Campo "porta" deve ser inteiro entre 0 e 65535';

/**
 * Valida a porta opcional.
 * @param {unknown} porta - Argumento recebido.
 * @returns {number | undefined} Porta validada.
 * @throws {Error} Se inválida.
 */
function lerPorta(porta: unknown): number | undefined {
  if (porta === undefined) return undefined;
  const valida =
    typeof porta === 'number' &&
    Number.isInteger(porta) &&
    porta >= PORTA_MINIMA &&
    porta <= PORTA_MAXIMA;
  if (!valida) throw new Error(MSG_PORTA_INVALIDA);
  return porta;
}

/**
 * Registra os canais do MCP.
 * @param {IpcMainMinimo} ipc - `ipcMain` (ou um falso).
 * @param {ServicoMcp} servico - Serviço do MCP.
 * @returns {void}
 */
export function registrarCanaisMcp(ipc: IpcMainMinimo, servico: ServicoMcp): void {
  registrarCanalSeguro(ipc, CANAIS_IPC.mcpObterEstado, () => servico.obterEstado());
  registrarCanalSeguro(ipc, CANAIS_IPC.mcpLigar, (porta) => {
    return servico.ligar({ porta: lerPorta(porta) });
  });
  registrarCanalSeguro(ipc, CANAIS_IPC.mcpDesligar, () => servico.desligar());
  registrarCanalSeguro(ipc, CANAIS_IPC.mcpObterTokenSessao, () => {
    return { token: servico.obterTokenSessao() };
  });
  registrarCanalSeguro(ipc, CANAIS_IPC.mcpRenovarTokenSessao, async () => {
    return { token: await servico.renovarTokenSessao() };
  });
  registrarCanalSeguro(ipc, CANAIS_IPC.mcpResponderConsentimento, async (requestId, aprovado) => {
    if (typeof requestId !== 'string') throw new Error('Campo "requestId" deve ser um texto');
    const recebido = await servico.responderConsentimento(requestId, aprovado === true);
    return { recebido };
  });
}

/**
 * Monta o emissor de `mcp:consent-request` que o `ServicoMcp` usa.
 * @param {DifundirParaJanelas} difundir - Envia evento às janelas.
 * @returns {(pedido: object) => void} Emissor do evento.
 */
export function criarEmissorConsentimento(
  difundir: DifundirParaJanelas,
): (pedido: { request_id: string; client_name: string; redirect_uri: string }) => void {
  return (pedido) => difundir(CANAIS_IPC.mcpPedidoConsentimento, pedido);
}
