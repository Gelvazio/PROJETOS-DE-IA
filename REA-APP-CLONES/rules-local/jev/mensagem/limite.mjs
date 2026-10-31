// Limites da mensagem: filtro de mensagens triviais (R1.4), limite de custo do dia (R2.3) e tempo
// máximo total (R1.3). Funções pequenas e puras, sem estado.
import { ErroJev } from '../config.mjs';

/** Mensagens de até este tamanho (depois de `trim`) não vão ao Jev. */
const TAMANHO_MAXIMO_TRIVIAL = 3;
const PREFIXO_COMANDO = '/';

/**
 * Diz se a mensagem deve pular o Jev: vazia, até 3 caracteres ou começando com `/` (comando).
 * @param {string} texto Texto bruto da mensagem.
 * @returns {boolean} true para pular.
 */
export function ehMensagemTrivial(texto) {
  const limpo = String(texto ?? '').trim();
  return [...limpo].length <= TAMANHO_MAXIMO_TRIVIAL || limpo.startsWith(PREFIXO_COMANDO);
}

/**
 * Diz se o gasto do dia já atingiu o limite (limite 0 bloqueia sempre).
 * @param {number} gastoUsd Custo já gasto hoje, em US$.
 * @param {number} maximoUsd `JEV_MAX_CUSTO_DIA`.
 * @returns {boolean} true quando não se deve chamar o Jev.
 */
export function estourouLimiteDia(gastoUsd, maximoUsd) {
  return gastoUsd >= maximoUsd;
}

/**
 * Executa o trabalho com um tempo máximo total; passou, rejeita com `TEMPO_ESGOTADO`.
 * @param {() => Promise<unknown>} trabalho Função que devolve a promessa.
 * @param {number} tempoMs Tempo máximo em milissegundos.
 * @returns {Promise<unknown>} Resultado do trabalho.
 * @throws {ErroJev} `TEMPO_ESGOTADO` se passar do tempo.
 */
export function comTempoMaximo(trabalho, tempoMs) {
  let relogio;
  const prazo = new Promise((_, rejeitar) => {
    relogio = setTimeout(() => {
      rejeitar(new ErroJev('TEMPO_ESGOTADO', `Passou de ${tempoMs} ms.`));
    }, tempoMs);
  });
  const andamento = Promise.resolve().then(trabalho);
  andamento.catch(() => {});
  return Promise.race([andamento, prazo]).finally(() => clearTimeout(relogio));
}
