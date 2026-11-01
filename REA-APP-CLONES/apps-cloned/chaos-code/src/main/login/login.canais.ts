/**
 * Canais IPC do login (`login:*`): tratadores finos que chamam o serviço de login e devolvem só
 * o `EstadoLogin` (situação, erro e validade). O token nunca vai para a interface:
 * - o serviço chega como `ServicoLoginCanais`, sem `obterTokenAcesso`;
 * - a renovação devolve o estado, não os tokens novos;
 * - todo estado passa por `copiarEstadoSeguro`, que monta um objeto só com os 3 campos.
 * A mudança de estado vai às janelas pelo evento `login:estado-mudou`.
 */

import { CANAIS_IPC } from '../../compartilhado/constantes';
import type { RespostaIpc } from '../../compartilhado/tipos-ipc';
import type { EstadoLogin } from '../../compartilhado/tipos-login';
import {
  registrarCanalSeguro,
  type DifundirParaJanelas,
  type IpcMainMinimo,
  type TratadorCanal,
} from '../ipc/ipc-comum';
import type { ServicoLoginCompleto } from './login.servico';

/** Parte do serviço de login que os canais usam (sem acesso ao token). */
export type ServicoLoginCanais = Pick<
  ServicoLoginCompleto,
  'obterEstado' | 'entrar' | 'sair' | 'renovar' | 'aoMudarEstado'
>;

/**
 * Operações de login que a interface pode chamar (`window.chaosCode`). Nenhuma devolve token.
 * Fica aqui, junto dos canais, porque esta subtarefa não cria `tipos-ipc-login.ts`.
 */
export interface ApiLogin {
  obterEstadoLogin: () => Promise<RespostaIpc<EstadoLogin>>;
  /** Abre o navegador do sistema e espera o login terminar. */
  fazerLogin: () => Promise<RespostaIpc<EstadoLogin>>;
  /** Revoga no servidor e apaga os tokens guardados. */
  fazerLogout: () => Promise<RespostaIpc<EstadoLogin>>;
  /** Renova os tokens no main; a interface recebe só o estado novo. */
  renovarLogin: () => Promise<RespostaIpc<EstadoLogin>>;
  /** Avisa a cada mudança do estado; devolve a função que cancela o aviso. */
  aoMudarEstadoLogin: (ouvinte: (estado: EstadoLogin) => void) => () => void;
}

/**
 * Monta uma cópia do estado só com os campos públicos, para nenhum campo extra (como um token,
 * se um provedor futuro o pusesse no estado) atravessar o IPC.
 * @param {EstadoLogin} estado - Estado vindo do serviço.
 * @returns {EstadoLogin} Objeto novo com situação, erro e validade.
 */
export function copiarEstadoSeguro(estado: EstadoLogin): EstadoLogin {
  return { situacao: estado.situacao, erro: estado.erro, expira_em: estado.expira_em };
}

/**
 * Renova os tokens no main e devolve só o estado depois da renovação.
 * @param {ServicoLoginCanais} servico - Serviço de login.
 * @returns {Promise<EstadoLogin>} Estado seguro depois da renovação.
 * @throws {Error} Repassa o erro da renovação (vira `{ erro }` no envelope).
 */
async function renovarSemDevolverTokens(servico: ServicoLoginCanais): Promise<EstadoLogin> {
  await servico.renovar();
  return copiarEstadoSeguro(servico.obterEstado());
}

/**
 * Monta o mapa canal → tratador das operações de login. Os tratadores ignoram argumentos:
 * nenhuma operação de login recebe dado da interface.
 * @param {ServicoLoginCanais} servico - Serviço de login.
 * @returns {Record<string, TratadorCanal>} Tratadores por nome de canal.
 */
function montarTratadores(servico: ServicoLoginCanais): Record<string, TratadorCanal> {
  return {
    [CANAIS_IPC.loginObterEstado]: () => copiarEstadoSeguro(servico.obterEstado()),
    [CANAIS_IPC.loginEntrar]: async () => copiarEstadoSeguro(await servico.entrar()),
    [CANAIS_IPC.loginSair]: async () => copiarEstadoSeguro(await servico.sair()),
    [CANAIS_IPC.loginRenovar]: () => renovarSemDevolverTokens(servico),
  };
}

/**
 * Registra os canais de login e repassa cada mudança do estado às janelas.
 * @param {IpcMainMinimo} ipc - `ipcMain` (ou um falso).
 * @param {ServicoLoginCanais} servico - Serviço de login.
 * @param {DifundirParaJanelas} difundir - Envia um evento do main para as janelas.
 * @returns {() => void} Função que cancela o repasse do estado.
 */
export function registrarCanaisLogin(
  ipc: IpcMainMinimo,
  servico: ServicoLoginCanais,
  difundir: DifundirParaJanelas,
): () => void {
  const tratadores = montarTratadores(servico);
  for (const [canal, tratador] of Object.entries(tratadores)) {
    registrarCanalSeguro(ipc, canal, tratador);
  }
  return servico.aoMudarEstado((estado) =>
    difundir(CANAIS_IPC.loginEstadoMudou, copiarEstadoSeguro(estado)),
  );
}
