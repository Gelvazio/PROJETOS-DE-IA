// Limites da integração com a DeepSeek (INTEGRACAO-DEEPSEEK.4, R3, INV-2). É o ÚNICO lugar que
// lê as variáveis de limite do ambiente:
//   DEEPSEEK_MODO=off       desliga a chamada sem apagar código (rollback)
//   DEEPSEEK_MAX_CUSTO_DIA  teto de custo por dia, em US$ (padrão 2, decisão P2)
//   DEEPSEEK_MAX_TOKENS     teto de tokens por chamada (padrão 2000, decisão P2)
//   DEEPSEEK_TIMEOUT_MS     tempo máximo por chamada, em ms (padrão 30000)
// Valor ausente, vazio, não numérico, zero ou negativo volta ao padrão: nunca lança e nunca
// zera um limite sem querer. A chave (DEEPSEEK_API_KEY) NÃO é lida aqui.

const VARIAVEL_MODO = 'DEEPSEEK_MODO';
const VARIAVEL_MAX_TOKENS = 'DEEPSEEK_MAX_TOKENS';
const VARIAVEL_TETO_DIA = 'DEEPSEEK_MAX_CUSTO_DIA';
const VARIAVEL_TEMPO = 'DEEPSEEK_TIMEOUT_MS';
const MODO_DESLIGADO = 'off';
const PADRAO_MAX_TOKENS = 2000;
const PADRAO_TETO_DIA_USD = 2;
const PADRAO_TEMPO_MS = 30000;
const FORMATO_INTEIRO = /^\d+$/;
const FORMATO_DECIMAL = /^\d+(\.\d+)?$/;
// Estimativa conservadora (texto em português): 1 token a cada 3 caracteres.
const CARACTERES_POR_TOKEN = 3;
// Folga do limitador geral sobre o tempo do cliente, que aborta o `fetch` primeiro.
const MARGEM_TEMPO_TOTAL_MS = 2000;

/**
 * Converte o texto de uma variável em número positivo, ou devolve o padrão.
 * @param {string|undefined} valor Texto da variável de ambiente.
 * @param {{padrao: number, formato: RegExp}} regra Valor padrão e formato aceito.
 * @returns {number} Número finito maior que zero.
 */
function numeroPositivo(valor, regra) {
  const texto = String(valor ?? '').trim();
  if (!regra.formato.test(texto)) return regra.padrao;
  const numero = Number(texto);
  const ehValido = Number.isFinite(numero) && numero > 0;
  return ehValido ? numero : regra.padrao;
}

/**
 * Diz se a DeepSeek está desligada pelo modo `off`.
 * @param {Record<string, string|undefined>} ambiente Variáveis de ambiente.
 * @returns {boolean} true se `DEEPSEEK_MODO=off` (sem diferenciar maiúsculas).
 */
export function estaDesligada(ambiente = process.env) {
  return String(ambiente[VARIAVEL_MODO] ?? '').trim().toLowerCase() === MODO_DESLIGADO;
}

/**
 * Lê todos os limites do ambiente, com validação e padrão.
 * @param {Record<string, string|undefined>} ambiente Variáveis de ambiente.
 * @returns {{desligada: boolean, maxTokens: number, tetoDiarioUsd: number,
 *   tempoMaximoMs: number}} Limites em vigor.
 */
export function lerLimites(ambiente = process.env) {
  return {
    desligada: estaDesligada(ambiente),
    maxTokens: numeroPositivo(ambiente[VARIAVEL_MAX_TOKENS], {
      padrao: PADRAO_MAX_TOKENS,
      formato: FORMATO_INTEIRO,
    }),
    tetoDiarioUsd: numeroPositivo(ambiente[VARIAVEL_TETO_DIA], {
      padrao: PADRAO_TETO_DIA_USD,
      formato: FORMATO_DECIMAL,
    }),
    tempoMaximoMs: numeroPositivo(ambiente[VARIAVEL_TEMPO], {
      padrao: PADRAO_TEMPO_MS,
      formato: FORMATO_INTEIRO,
    }),
  };
}

/**
 * Estima os tokens de entrada de um conjunto de mensagens (sem chamar a API).
 * @param {{content?: unknown}[]} mensagens Mensagens do pedido.
 * @returns {number} Estimativa de tokens, arredondada para cima.
 */
export function estimarTokensEntrada(mensagens) {
  const lista = Array.isArray(mensagens) ? mensagens : [];
  const caracteres = lista.reduce((soma, m) => soma + String(m?.content ?? '').length, 0);
  return Math.ceil(caracteres / CARACTERES_POR_TOKEN);
}

/**
 * Diz se a entrada estimada passa do teto de tokens por chamada.
 * @param {{content?: unknown}[]} mensagens Mensagens do pedido.
 * @param {number} maxTokens Teto de tokens por chamada.
 * @returns {boolean} true se a entrada estimada excede o teto.
 */
export function passouDoTetoDeTokens(mensagens, maxTokens) {
  return estimarTokensEntrada(mensagens) > maxTokens;
}

/**
 * Diz se o gasto do dia já atingiu o teto diário.
 * @param {number} gastoHojeUsd Custo estimado do dia em US$.
 * @param {number} tetoDiarioUsd Teto diário em US$.
 * @returns {boolean} true se o gasto é maior ou igual ao teto.
 */
export function passouDoTetoDiario(gastoHojeUsd, tetoDiarioUsd) {
  return gastoHojeUsd >= tetoDiarioUsd;
}

/**
 * Limita o tempo total de uma operação assíncrona. Nunca lança: se o tempo estourar, ou se a
 * operação rejeitar, devolve o valor de `aoFalhar`. O tempo vale `tempoMaximoMs` + uma margem,
 * pois o cliente já aborta o `fetch` no tempo dele; este limite cobre o restante da rota.
 * @param {Promise<T>} operacao Operação a limitar.
 * @param {{tempoMaximoMs: number, aoFalhar: T}} regra Tempo máximo e valor de retorno em falha.
 * @returns {Promise<T>} Resultado da operação, ou `aoFalhar`.
 * @template T
 */
export async function limitarTempo(operacao, regra) {
  let temporizador;
  const prazoMs = regra.tempoMaximoMs + MARGEM_TEMPO_TOTAL_MS;
  const estouro = new Promise((resolver) => {
    temporizador = setTimeout(() => resolver(regra.aoFalhar), prazoMs);
  });
  try {
    return await Promise.race([operacao, estouro]);
  } catch {
    return regra.aoFalhar;
  } finally {
    clearTimeout(temporizador);
  }
}
