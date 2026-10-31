// Texto de contexto para a IA (até 3 linhas curtas em PT-BR): a decisão do Jev (ou o aviso de
// que ele não respondeu) e os alertas dos guardrails. Só acrescenta contexto (INV-2): nunca
// bloqueia nem altera a mensagem do usuário.
import { DECISOES } from './decisao.mjs';

const TAMANHO_MAXIMO_LINHA = 300;
const MAXIMO_MODELOS_NA_LINHA = 4;
const CASAS_CONFIANCA = 2;
const AVISO_SINAIS = 'classifique pelos sinais da skill classificar-tarefa (na dúvida, suba o '
  + 'nível)';
const MOTIVOS_SEM_JEV = Object.freeze({
  limite_dia: 'Jev pausado: limite do dia de custo atingido',
});
const MOTIVO_SEM_JEV_PADRAO = 'Jev indisponível';

/**
 * Formata a confiança com vírgula decimal.
 * @param {number|null} valor Confiança de 0 a 1.
 * @returns {string} Texto (ex.: `0,91`) ou `?`.
 */
function formatarConfianca(valor) {
  if (typeof valor !== 'number') return '?';
  return valor.toFixed(CASAS_CONFIANCA).replace('.', ',');
}

/**
 * Corta uma linha longa demais.
 * @param {string} linha Linha de contexto.
 * @returns {string} Linha com no máximo 300 caracteres.
 */
function limitarLinha(linha) {
  if (linha.length <= TAMANHO_MAXIMO_LINHA) return linha;
  return `${linha.slice(0, TAMANHO_MAXIMO_LINHA - 1)}…`;
}

/**
 * Primeira linha: quem decidiu e o que decidiu.
 * @param {object} resultado Resultado de classificarMensagem.
 * @returns {string} Linha de decisão.
 */
function linhaDecisao(resultado) {
  const confianca = formatarConfianca(resultado.confianca);
  const base = `nível ${resultado.nivel} · effort ${resultado.effort}`;
  if (resultado.decisao === DECISOES.JEV) {
    return `Jev decidiu (confiança ${confianca}): ${base}.`;
  }
  const sinais = (resultado.sinais_pesado ?? []).join(', ');
  const motivoSinais = sinais ? `; sinal de PESADO: ${sinais}` : '';
  return `Jev sugeriu ${resultado.nivel_jev} (confiança ${confianca}${motivoSinais}); `
    + `valendo a matriz: ${base}. Revisão humana recomendada.`;
}

/**
 * Linha dos modelos elegíveis do nível.
 * @param {string[]} modelos Rótulos dos modelos elegíveis.
 * @returns {string} Linha com os primeiros modelos.
 */
function linhaModelos(modelos) {
  const mostrados = modelos.slice(0, MAXIMO_MODELOS_NA_LINHA).join('; ');
  const temMais = modelos.length > MAXIMO_MODELOS_NA_LINHA;
  return `Modelos elegíveis: ${mostrados}${temMais ? ' e outros' : ''}`;
}

/**
 * Monta as linhas de contexto (no máximo 3).
 * @param {object|null} resultado Resultado de classificarMensagem.
 * @returns {string[]} Linhas; vazio se a mensagem foi pulada ou não há o que dizer.
 */
export function montarLinhasContexto(resultado) {
  if (!resultado || resultado.pulado) return [];

  const linhas = [];
  if (resultado.decisao === DECISOES.SINAIS) {
    const motivo = MOTIVOS_SEM_JEV[resultado.motivo] ?? MOTIVO_SEM_JEV_PADRAO;
    linhas.push(`${motivo}: ${AVISO_SINAIS}.`);
  } else {
    linhas.push(linhaDecisao(resultado), linhaModelos(resultado.modelos_elegiveis ?? []));
  }
  if ((resultado.alertas ?? []).length > 0) linhas.push(`Alertas: ${resultado.alertas.join('; ')}`);
  return linhas.map(limitarLinha);
}

/**
 * Monta o contexto da IA: as linhas de {@link montarLinhasContexto} juntas por quebra de linha.
 * @param {object|null} resultado Resultado de classificarMensagem.
 * @returns {string} Texto de até 3 linhas; vazio quando não há contexto a acrescentar.
 */
export function montarContexto(resultado) {
  return montarLinhasContexto(resultado).join('\n');
}
