/**
 * Canais IPC do atualizador (`atualizador:*`): tratadores finos que validam a entrada e chamam
 * o `ServicoAtualizador`. O progresso do download vai às janelas pelo evento
 * `atualizador:progresso` (o `update-progress` do original).
 */

import { CANAIS_IPC } from '../../compartilhado/constantes';
import {
  exigirTexto,
  registrarCanalSeguro,
  type DifundirParaJanelas,
  type IpcMainMinimo,
  type TratadorCanal,
} from '../ipc/ipc-comum';
import type { ServicoAtualizador } from './atualizador.servico';

/**
 * Monta o mapa canal → tratador das operações do atualizador.
 * @param {ServicoAtualizador} servico - Serviço do atualizador.
 * @returns {Record<string, TratadorCanal>} Tratadores por nome de canal.
 */
function montarTratadores(servico: ServicoAtualizador): Record<string, TratadorCanal> {
  return {
    [CANAIS_IPC.atualizadorVerificar]: () => servico.verificar(),
    [CANAIS_IPC.atualizadorInstalar]: () => servico.baixarEInstalar(),
    [CANAIS_IPC.atualizadorCancelar]: () => servico.cancelarDownload(),
    [CANAIS_IPC.atualizadorSalvarEstado]: (versaoAlvo) =>
      servico.salvarEstadoPre(exigirTexto(versaoAlvo, 'versaoAlvo')),
    [CANAIS_IPC.atualizadorObterHistorico]: () => servico.obterHistorico(),
  };
}

/**
 * Registra os canais do atualizador e repassa o progresso do download às janelas.
 * @param {IpcMainMinimo} ipc - `ipcMain` (ou um falso).
 * @param {ServicoAtualizador} servico - Serviço do atualizador.
 * @param {DifundirParaJanelas} difundir - Envia um evento do main para as janelas.
 * @returns {() => void} Função que cancela o repasse do progresso.
 */
export function registrarCanaisAtualizador(
  ipc: IpcMainMinimo,
  servico: ServicoAtualizador,
  difundir: DifundirParaJanelas,
): () => void {
  const tratadores = montarTratadores(servico);
  for (const [canal, tratador] of Object.entries(tratadores)) {
    registrarCanalSeguro(ipc, canal, tratador);
  }
  return servico.aoProgredir((evento) => difundir(CANAIS_IPC.atualizadorProgresso, evento));
}
