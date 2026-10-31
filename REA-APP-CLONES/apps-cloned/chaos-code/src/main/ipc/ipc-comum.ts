/**
 * Peças comuns dos canais IPC do processo principal: o `ipcMain` mínimo que os módulos usam
 * (para poderem ser montados com um falso) e o envelope que transforma exceção em `{ erro }`.
 */

import type { ErroIpc } from '../../compartilhado/tipos-ipc';

/** Parte do `ipcMain` do Electron usada pelos módulos de canais. */
export interface IpcMainMinimo {
  handle(canal: string, tratador: (evento: unknown, ...argumentos: unknown[]) => unknown): void;
}

/** Envia um dado do main para todas as janelas (`webContents.send`). */
export type DifundirParaJanelas = (canal: string, dado: unknown) => void;

/** Tratador fino de um canal: recebe os argumentos já sem o evento. */
export type TratadorCanal = (...argumentos: unknown[]) => Promise<unknown> | unknown;

const MSG_ERRO_DESCONHECIDO = 'Erro desconhecido';

/**
 * Converte qualquer erro em objeto serializável (só a mensagem; nunca a pilha).
 * @param {unknown} erro - Valor capturado.
 * @returns {ErroIpc} Objeto `{ erro }`.
 */
export function converterErroParaIpc(erro: unknown): ErroIpc {
  const mensagem = erro instanceof Error && erro.message ? erro.message : MSG_ERRO_DESCONHECIDO;
  return { erro: mensagem };
}

/**
 * Registra um canal com o envelope de erro: o tratador que lançar exceção devolve `{ erro }`.
 * @param {IpcMainMinimo} ipc - `ipcMain` (ou um falso).
 * @param {string} canal - Nome do canal.
 * @param {TratadorCanal} tratador - Função fina que valida a entrada e chama o serviço.
 * @returns {void}
 */
export function registrarCanalSeguro(
  ipc: IpcMainMinimo,
  canal: string,
  tratador: TratadorCanal,
): void {
  ipc.handle(canal, async (_evento, ...argumentos) => {
    try {
      return await tratador(...argumentos);
    } catch (erro) {
      return converterErroParaIpc(erro);
    }
  });
}

/**
 * Exige que o argumento seja um texto.
 * @param {unknown} valor - Argumento recebido do renderer.
 * @param {string} nomeCampo - Nome usado na mensagem de erro.
 * @returns {string} O texto.
 * @throws {Error} Se não for texto.
 */
export function exigirTexto(valor: unknown, nomeCampo: string): string {
  if (typeof valor !== 'string') throw new Error(`Campo "${nomeCampo}" deve ser um texto`);
  return valor;
}

/**
 * Exige que o argumento seja um objeto simples (não nulo, não lista).
 * @param {unknown} valor - Argumento recebido do renderer.
 * @param {string} nomeCampo - Nome usado na mensagem de erro.
 * @returns {Record<string, unknown>} O objeto.
 * @throws {Error} Se não for objeto.
 */
export function exigirObjeto(valor: unknown, nomeCampo: string): Record<string, unknown> {
  const ehObjeto = typeof valor === 'object' && valor !== null && !Array.isArray(valor);
  if (!ehObjeto) throw new Error(`Campo "${nomeCampo}" deve ser um objeto`);
  return valor as Record<string, unknown>;
}
