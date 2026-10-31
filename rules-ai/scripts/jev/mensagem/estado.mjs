// Estado CEGO da mensagem (INV-1, R2.1): o texto passa por `redigirTexto` (segredo e dado pessoal)
// e por `removerRotulos` (nome de modelo, nível, effort), é cortado em 4000 caracteres e ainda é
// ajustado ao teto de tokens da mensagem antes de ir ao Jev. O texto original nunca sai daqui.
import { createHash } from 'node:crypto';
import { estimarTokens } from '../cliente.mjs';
import { redigirTexto, resumirAchados } from '../guardrails/redigir.mjs';
import { sanitizarTexto } from '../estado.mjs';
import { montarPerguntasMensagem } from './perguntas.mjs';

export const TAMANHO_MAXIMO_MENSAGEM = 4000;
/** Limite de entrada para o regex não gastar tempo com texto gigante (ex.: log colado). */
const TAMANHO_MAXIMO_ENTRADA = 200000;
const TAMANHO_HASH = 16;
const TAMANHO_MAXIMO_PROJETO = 80;
const PROJETO_PADRAO = 'projeto';

/**
 * Hash curto do texto já redigido (rastreia a mensagem sem guardá-la).
 * @param {string} textoRedigido Texto sem segredos.
 * @returns {string} 16 primeiros caracteres do SHA-256 em hexadecimal.
 */
export function calcularHashTexto(textoRedigido) {
  return createHash('sha256').update(textoRedigido).digest('hex').slice(0, TAMANHO_HASH);
}

/**
 * Estima os tokens do corpo que o cliente enviaria (mesma conta do cliente.mjs).
 * @param {object} state State da mensagem.
 * @param {{modelo: string, perguntas: object}} contexto Modelo e perguntas do pedido.
 * @returns {number} Tokens estimados.
 */
function estimarPedido(state, contexto) {
  const corpo = JSON.stringify({
    state, model: contexto.modelo, questions: contexto.perguntas,
  });
  return estimarTokens(corpo);
}

/**
 * Corta a mensagem até o pedido caber no teto de tokens da mensagem.
 * @param {object} state State com a mensagem inteira (já limitada a 4000 caracteres).
 * @param {{modelo: string, perguntas: object, maximoTokens: number}} contexto Teto e pedido.
 * @returns {object|null} State ajustado, ou null se nem a mensagem vazia cabe no teto.
 */
function ajustarAoTeto(state, contexto) {
  if (estimarPedido({ ...state, mensagem: '' }, contexto) > contexto.maximoTokens) return null;

  let atual = state;
  let excesso = estimarPedido(atual, contexto) - contexto.maximoTokens;
  while (excesso > 0) {
    const sobra = Math.max(0, atual.mensagem.length - Math.max(1, excesso * 3));
    atual = { ...atual, mensagem: atual.mensagem.slice(0, sobra) };
    excesso = estimarPedido(atual, contexto) - contexto.maximoTokens;
  }
  return atual;
}

/**
 * Prepara o pedido ao Jev: texto redigido, state cego, perguntas e hash.
 * @param {{texto: string, projeto?: string}} mensagem Texto bruto e nome do projeto.
 * @param {{modelo: string, maximoTokens: number}} orcamento Modelo do Jev e teto de tokens.
 * @returns {{state: object|null, perguntas: object, hash: string,
 *   achados: Record<string, number>}} `state` é null se o teto de tokens for pequeno demais.
 */
export function prepararPedido(mensagem, orcamento) {
  const bruto = String(mensagem.texto ?? '').slice(0, TAMANHO_MAXIMO_ENTRADA);
  const redigido = redigirTexto(bruto);
  const projeto = sanitizarTexto(redigirTexto(mensagem.projeto ?? '').texto)
    .slice(0, TAMANHO_MAXIMO_PROJETO) || PROJETO_PADRAO;
  const state = {
    projeto,
    mensagem: sanitizarTexto(redigido.texto).slice(0, TAMANHO_MAXIMO_MENSAGEM),
  };
  const perguntas = montarPerguntasMensagem();
  return {
    state: ajustarAoTeto(state, { ...orcamento, perguntas }),
    perguntas,
    hash: calcularHashTexto(redigido.texto),
    achados: resumirAchados(redigido.achados),
  };
}
