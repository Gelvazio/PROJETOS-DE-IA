/**
 * Canais IPC de agentes (`agentes:*`): `agents:list`, `agents:get` e `agents:write` do original.
 */

import { CANAIS_IPC } from '../../compartilhado/constantes';
import type { Agente } from '../../compartilhado/tipos-agentes';
import {
  exigirTexto,
  registrarCanalSeguro,
  type IpcMainMinimo,
} from '../ipc/ipc-comum';
import type { ServicoAgentes } from './agentes.servico';

/** Pedido de gravação de agente vindo do renderer. */
export interface PedidoGravarAgenteIpc {
  idProjeto: string;
  agente: Agente;
  cli: string;
  escopo: string;
}

/**
 * Registra os canais de agentes.
 * @param {IpcMainMinimo} ipc - `ipcMain` (ou um falso).
 * @param {ServicoAgentes} servico - Serviço de agentes.
 * @returns {void}
 */
export function registrarCanaisAgentes(ipc: IpcMainMinimo, servico: ServicoAgentes): void {
  registrarCanalSeguro(
    ipc,
    CANAIS_IPC.agentesListar,
    (idProjeto: unknown, escopo: unknown) => {
      const id = exigirTexto(idProjeto, 'idProjeto');
      return servico.listar(id, typeof escopo === 'string' ? escopo : undefined);
    },
  );
  registrarCanalSeguro(ipc, CANAIS_IPC.agentesObter, (idProjeto: unknown, nome: unknown) => {
    return servico.obter(exigirTexto(idProjeto, 'idProjeto'), exigirTexto(nome, 'nome'));
  });
  registrarCanalSeguro(ipc, CANAIS_IPC.agentesGravar, (pedido: unknown) => {
    const dados = pedido as PedidoGravarAgenteIpc;
    return servico.gravar(exigirTexto(dados.idProjeto, 'idProjeto'), dados.agente, {
      cli: exigirTexto(dados.cli, 'cli'),
      escopo: exigirTexto(dados.escopo, 'escopo'),
    });
  });
}
