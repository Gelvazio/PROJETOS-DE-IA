/**
 * Peças comuns das ferramentas MCP: o executor recebe os argumentos do `tools/call` e o
 * contexto do pedido (`project_id` do caminho).
 */

import type { ContextoPedidoMcp } from '../servidor';

/** Executor de uma ferramenta MCP: argumentos + contexto → resultado serializável. */
export type ExecutorFerramenta = (
  argumentos: Record<string, unknown>,
  contexto: ContextoPedidoMcp,
) => Promise<unknown>;

/** Mapa nome da ferramenta → executor. */
export type MapaFerramentas = Readonly<Record<string, ExecutorFerramenta>>;

const MSG_CAMPO_OBRIGATORIO = 'Campo obrigatório ausente ou inválido';

/**
 * Exige um campo de texto nos argumentos da ferramenta.
 * @param {Record<string, unknown>} args - Argumentos do `tools/call`.
 * @param {string} campo - Nome do campo.
 * @returns {string} Texto validado.
 * @throws {Error} Se ausente ou não-texto.
 */
export function exigirCampoTexto(args: Record<string, unknown>, campo: string): string {
  const valor = args[campo];
  if (typeof valor !== 'string' || !valor) {
    throw new Error(`${MSG_CAMPO_OBRIGATORIO}: "${campo}"`);
  }
  return valor;
}

/**
 * Campo de texto opcional.
 * @param {Record<string, unknown>} args - Argumentos.
 * @param {string} campo - Nome do campo.
 * @returns {string | undefined} Texto ou undefined.
 */
export function campoTextoOpcional(
  args: Record<string, unknown>,
  campo: string,
): string | undefined {
  const valor = args[campo];
  return typeof valor === 'string' ? valor : undefined;
}

/**
 * Campo numérico opcional.
 * @param {Record<string, unknown>} args - Argumentos.
 * @param {string} campo - Nome do campo.
 * @returns {number | undefined} Número ou undefined.
 */
export function campoNumeroOpcional(
  args: Record<string, unknown>,
  campo: string,
): number | undefined {
  const valor = args[campo];
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : undefined;
}

/**
 * Resposta de ferramenta em texto JSON (formato MCP `content`).
 * @param {unknown} dados - Resultado da ferramenta.
 * @returns {{content: {type: 'text', text: string}[]}} Envelope MCP.
 */
export function resultadoTextoJson(dados: unknown): {
  content: { type: 'text'; text: string }[];
} {
  return { content: [{ type: 'text', text: JSON.stringify(dados) }] };
}
