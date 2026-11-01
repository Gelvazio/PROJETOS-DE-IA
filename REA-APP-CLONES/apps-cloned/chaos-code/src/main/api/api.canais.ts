/**
 * Canais IPC da API da plataforma (`api:<grupo>:<metodo>`): expõem ao renderer as APIs de
 * projetos, tarefas, imagens e modelos de agente. O token de acesso fica no cliente HTTP do main;
 * o renderer só recebe os dados ou `{ erro }`.
 */

import { METODOS_API_IPC, nomeCanalApi } from '../../compartilhado/constantes';
import type { RespostaIpc } from '../../compartilhado/tipos-ipc';
import {
  exigirTexto,
  registrarCanalSeguro,
  type IpcMainMinimo,
  type TratadorCanal,
} from '../ipc/ipc-comum';
import type { ApiImagens } from './imagens.api';
import type { ApiModelosAgente } from './modelos-agente.api';
import type { ApiTarefas } from './tarefas.api';
import type { ProjetosApi } from './projetos.api';

/** As APIs da plataforma que os canais usam. */
export interface ApisPlataforma {
  projetos: ProjetosApi;
  tarefas: ApiTarefas;
  imagens: ApiImagens;
  modelosAgente: ApiModelosAgente;
}

/** Transforma cada método de uma API em versão IPC: mesmos argumentos, resposta ou `{ erro }`. */
export type ViaIpc<T> = {
  [K in keyof T]: T[K] extends (...argumentos: infer A) => Promise<infer R>
    ? (...argumentos: A) => Promise<RespostaIpc<R>>
    : never;
};

/** Operações da API da plataforma que a interface pode chamar (`window.chaosCode.api`). */
export interface ApiPlataformaIpc {
  api: {
    projetos: ViaIpc<ProjetosApi>;
    tarefas: ViaIpc<ApiTarefas>;
    imagens: ViaIpc<ApiImagens>;
    modelosAgente: ViaIpc<ApiModelosAgente>;
  };
}

type FuncaoApi = (...argumentos: unknown[]) => Promise<unknown>;

/**
 * Cria o tratador de um método: confere os ids de texto e chama a API.
 * @param {FuncaoApi} funcao - Método da API, já ligado ao seu objeto.
 * @param {string} metodo - Nome do método (para a mensagem de erro).
 * @param {number} quantidadeTextos - Quantos primeiros argumentos devem ser texto.
 * @returns {TratadorCanal} Tratador do canal.
 */
function criarTratador(
  funcao: FuncaoApi,
  metodo: string,
  quantidadeTextos: number,
): TratadorCanal {
  return (...argumentos) => {
    for (let i = 0; i < quantidadeTextos; i += 1) {
      exigirTexto(argumentos[i], `${metodo}[${i}]`);
    }
    return funcao(...argumentos);
  };
}

/**
 * Registra os canais de um grupo da API.
 * @param {IpcMainMinimo} ipc - `ipcMain` (ou um falso).
 * @param {string} grupo - Nome do grupo (chave de `METODOS_API_IPC`).
 * @param {Record<string, unknown>} api - Objeto da API do grupo.
 * @returns {void}
 */
function registrarGrupo(ipc: IpcMainMinimo, grupo: string, api: Record<string, unknown>): void {
  const metodos = METODOS_API_IPC[grupo as keyof typeof METODOS_API_IPC] as Record<string, number>;
  for (const [metodo, quantidadeTextos] of Object.entries(metodos)) {
    const funcao = (api[metodo] as FuncaoApi).bind(api);
    const tratador = criarTratador(funcao, metodo, quantidadeTextos);
    registrarCanalSeguro(ipc, nomeCanalApi(grupo, metodo), tratador);
  }
}

/**
 * Registra todos os canais `api:*`.
 * @param {IpcMainMinimo} ipc - `ipcMain` (ou um falso).
 * @param {ApisPlataforma} apis - APIs da plataforma.
 * @returns {void}
 */
export function registrarCanaisApi(ipc: IpcMainMinimo, apis: ApisPlataforma): void {
  for (const [grupo, api] of Object.entries(apis)) {
    registrarGrupo(ipc, grupo, api as Record<string, unknown>);
  }
}
