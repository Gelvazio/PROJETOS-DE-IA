/**
 * Tipos comuns dos canais IPC. Todo canal devolve o dado ou, se der erro, um objeto `{ erro }`
 * serializável (a interface nunca recebe a exceção nem a pilha). Cada módulo define a própria
 * API em `tipos-ipc-<modulo>.ts`, que entra em `window.chaosCode` pelo `preload.ts`.
 */

/** Erro devolvido por um canal IPC. */
export interface ErroIpc {
  erro: string;
}

/** Resposta de um canal: o dado ou um `ErroIpc`. */
export type RespostaIpc<T> = T | ErroIpc;

/**
 * Diz se a resposta de um canal é um erro.
 * @param {unknown} resposta - Valor devolvido pelo canal.
 * @returns {boolean} true se for um objeto com o campo `erro` em texto.
 */
export function ehErroIpc(resposta: unknown): resposta is ErroIpc {
  if (typeof resposta !== 'object' || resposta === null) return false;
  return typeof (resposta as { erro?: unknown }).erro === 'string';
}
