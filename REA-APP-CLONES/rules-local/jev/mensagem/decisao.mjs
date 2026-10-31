// Decisão da mensagem (JEV-GLOBAL-AI-FINAL.24, R6.1, R6.2, INV-5): confiança ≥ 0,80 e nenhum sinal
// de PESADO aceso -> o Jev decide; senão vale a matriz (nível mais restritivo entre o Jev e os
// sinais) com revisão humana. Sinal de PESADO nunca é rebaixado. Função pura, sem rede.
import {
  LIMIAR_AUTOMATICO, LIMIAR_SINAL_PESADO, extrairConfianca, lerSinais,
} from '../decidir.mjs';
import {
  NIVEIS, derivarEffort, ehNivelValido, listarModelosElegiveis, maisRestritivo,
} from '../modelos.mjs';
import { PERGUNTAS, SINAIS_PESADO } from '../perguntas.mjs';
import { PERGUNTA_MUDA_ALGO } from './perguntas.mjs';

export const DECISOES = Object.freeze({ JEV: 'jev', MATRIZ: 'matriz', SINAIS: 'sinais' });

/**
 * Lista os sinais de PESADO acesos (probabilidade `noul` ≥ limiar).
 * @param {Record<string, number|null>} sinais Sinais lidos das respostas.
 * @returns {string[]} Nomes dos sinais acesos.
 */
function listarSinaisAcesos(sinais) {
  return SINAIS_PESADO.filter((nome) => (sinais[nome] ?? 0) >= LIMIAR_SINAL_PESADO);
}

/**
 * Diz se a mensagem pede uma mudança (resposta `noul` da pergunta `muda_algo`).
 * @param {object} respostas Campo `answers` do Jev.
 * @returns {boolean|null} true/false, ou null se o Jev não respondeu.
 */
function lerMudaAlgo(respostas) {
  const probabilidade = respostas?.[PERGUNTA_MUDA_ALGO]?.noul;
  if (typeof probabilidade !== 'number') return null;
  return probabilidade >= LIMIAR_SINAL_PESADO;
}

/**
 * Escolhe a decisão: sem nível válido do Jev -> sinais; Jev decide -> jev; senão matriz.
 * @param {string|null} nivelJev Nível válido do Jev, ou null.
 * @param {boolean} jevDecide true se a confiança é alta e não há sinal de PESADO.
 * @returns {string} Um valor de {@link DECISOES}.
 */
function escolherDecisao(nivelJev, jevDecide) {
  if (nivelJev === null) return DECISOES.SINAIS;
  if (jevDecide) return DECISOES.JEV;
  return DECISOES.MATRIZ;
}

/**
 * Decide o nível, o effort e os modelos da mensagem a partir das respostas do Jev.
 * @param {object} respostas Campo `answers` da resposta do Jev.
 * @returns {{decisao: string, nivel: string|null, effort: string|null,
 *   modelos_elegiveis: string[], confianca: number|null, revisar: boolean,
 *   nivel_jev: string|null, sinais_pesado: string[], muda_algo: boolean|null}} Decisão; sem nível
 *   válido do Jev, `decisao` é `sinais` e quem chama trata como falha do Jev.
 */
export function decidirMensagem(respostas) {
  const escolha = respostas?.[PERGUNTAS.NIVEL]?.choice;
  const nivelJev = ehNivelValido(escolha) ? escolha : null;
  const acesos = listarSinaisAcesos(lerSinais(respostas));
  const confianca = extrairConfianca(respostas?.[PERGUNTAS.NIVEL]).valor;
  const jevDecide = nivelJev !== null && confianca !== null
    && confianca >= LIMIAR_AUTOMATICO && acesos.length === 0;
  const nivel = maisRestritivo(nivelJev, acesos.length > 0 ? NIVEIS.PESADO : null);
  const decisao = escolherDecisao(nivelJev, jevDecide);
  return {
    decisao,
    nivel: decisao === DECISOES.SINAIS ? null : nivel,
    effort: decisao === DECISOES.SINAIS ? null : derivarEffort(nivel),
    modelos_elegiveis: decisao === DECISOES.SINAIS ? [] : listarModelosElegiveis(nivel),
    confianca,
    revisar: decisao === DECISOES.MATRIZ,
    nivel_jev: nivelJev,
    sinais_pesado: acesos,
    muda_algo: lerMudaAlgo(respostas),
  };
}
