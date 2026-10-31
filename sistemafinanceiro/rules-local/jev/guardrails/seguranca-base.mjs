// Peças comuns dos guardrails de SEGURANÇA (segredo/PII, pasta proibida, comando destrutivo e
// aprovação indevida): ações, consulta ao Jev com fallback, escape humano e log de auditoria.
// Ordem de toda decisão: 1) camada determinística (regex, caminho, allowlist); 2) Jev, só com
// texto mascarado por `redigir.mjs`; 3) sem Jev (falha, sem chave ou JEV_MODO=off) → `revisar`,
// nunca `liberar` em silêncio (INV-6).
//
// ESCAPE HUMANO (bloqueio de segredo, pasta e comando): quem chama passa
// `confirmacaoHumana = { confirmado: true, quem: '<nome do humano>', alvo: <alvo exato> }`,
// montada a partir das palavras do USUÁRIO (nunca do agente). O `alvo` precisa casar com o item
// avaliado (o comando exato, a pasta autorizada ou o hash do texto); um "sim" genérico não vale.
// Aprovação indevida não tem escape: o próprio usuário responde.
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { criarClientePadrao, criarRegistroJsonl } from '../cliente.mjs';
import { PASTA_SAIDAS } from '../config.mjs';
import { redigirTexto, resumirAchados } from './redigir.mjs';

export const ACOES = Object.freeze({
  LIBERAR: 'liberar', AVISAR: 'avisar', REVISAR: 'revisar', BLOQUEAR: 'bloquear',
});
/** Mesmo arquivo de auditoria dos guardrails de escopo/aceite (fora do Git). */
export const ARQUIVO_LOG_GUARDRAILS = join(PASTA_SAIDAS, 'guardrails.jsonl');
export const FONTES = Object.freeze({
  DETERMINISTICA: 'deterministica', NENHUMA: 'nenhuma', ESCAPE: 'escape-humano',
});
/** Limite do texto mascarado enviado ao Jev (custo); a camada determinística vê o texto todo. */
const LIMITE_CARACTERES_ESTADO = 4000;
const TAMANHO_HASH = 16;
const CAMPO_SCORE = 'score';
const CAMPOS_PROBABILIDADE = ['noul', CAMPO_SCORE, 'probability'];
const ACOES_COM_ESCAPE = new Set([ACOES.BLOQUEAR, ACOES.REVISAR]);
const MOTIVO_ESCAPE = 'escape-humano:confirmacao-valida';

let consultoresPadrao = null;

/**
 * Hash curto de um texto, para rastrear a entrada no log sem guardar o conteúdo.
 * @param {string} texto Texto qualquer.
 * @returns {string} 16 primeiros caracteres do SHA-256.
 */
export function calcularHash(texto) {
  return createHash('sha256').update(String(texto ?? '')).digest('hex').slice(0, TAMANHO_HASH);
}

/**
 * Mascara e corta um texto antes de ir para o Jev.
 * @param {string} texto Texto original.
 * @returns {{texto: string, achados: object[]}} Texto mascarado (cortado) e achados.
 */
export function prepararTexto(texto) {
  const redigido = redigirTexto(texto);
  return { texto: redigido.texto.slice(0, LIMITE_CARACTERES_ESTADO), achados: redigido.achados };
}

/**
 * Limita um número ao intervalo [0, 1].
 * @param {number} valor Valor qualquer.
 * @returns {number} Valor entre 0 e 1.
 */
function limitarEntreZeroEUm(valor) {
  return Math.min(Math.max(valor, 0), 1);
}

/**
 * Lê a probabilidade de uma resposta do Jev. `noul`/`probability` já vêm de 0 a 1; o `score`
 * vem na escala dos critérios (0 a n−1; ex.: 1,98 com 3 critérios) e é dividido por n−1.
 * @param {object|null} respostas Campo `respostas` do cliente.
 * @param {string} nome Nome da pergunta.
 * @param {{criteria?: unknown}} [pergunta] Definição da pergunta (para a escala do `score`).
 * @returns {number|null} Probabilidade de 0 a 1, ou null se não veio.
 */
export function lerProbabilidade(respostas, nome, pergunta) {
  const resposta = respostas?.[nome];
  const campo = CAMPOS_PROBABILIDADE.find((nomeCampo) => typeof resposta?.[nomeCampo] === 'number');
  if (!campo) return null;
  if (campo !== CAMPO_SCORE) return limitarEntreZeroEUm(resposta[campo]);
  const niveis = Array.isArray(pergunta?.criteria) ? pergunta.criteria.length : 0;
  const divisor = niveis >= 2 ? niveis - 1 : 1;
  return limitarEntreZeroEUm(resposta[campo] / divisor);
}

/**
 * Maior probabilidade entre as perguntas feitas.
 * @param {object|null} respostas Campo `respostas` do cliente.
 * @param {Record<string, object>} perguntas Perguntas enviadas (nome → definição).
 * @returns {number|null} Maior valor, ou null se nenhuma veio.
 */
export function maiorProbabilidade(respostas, perguntas) {
  const valores = Object.entries(perguntas)
    .map(([nome, pergunta]) => lerProbabilidade(respostas, nome, pergunta))
    .filter((valor) => valor !== null);
  return valores.length > 0 ? Math.max(...valores) : null;
}

/**
 * Pergunta aos consultores em ordem (hoje só o Jev); o primeiro que responder vale.
 * @param {{state: object, perguntas: object, acao: string}} pedido State JÁ mascarado.
 * @param {{nome?: string, perguntar: Function}[]} consultores Clientes no contrato do cliente Jev.
 * @returns {Promise<{respostas: object|null, fonte: string, modelo: string|null,
 *   tokensEntrada: number, custoUsd: number, erros: string[]}>} Consulta (respostas null = falhou).
 */
export async function consultar(pedido, consultores) {
  const erros = [];
  for (const consultor of consultores ?? []) {
    try {
      const resposta = await consultor.perguntar(pedido);
      return {
        respostas: resposta.respostas, fonte: consultor.nome ?? 'jev',
        modelo: resposta.modeloResposta ?? null, tokensEntrada: resposta.uso?.tokensEntrada ?? 0,
        custoUsd: resposta.custoUsd ?? 0, erros,
      };
    } catch (erro) {
      erros.push(`${consultor.nome ?? 'jev'}:${erro?.codigo ?? erro?.name ?? 'erro'}`);
    }
  }
  return {
    respostas: null, fonte: FONTES.NENHUMA, modelo: null, tokensEntrada: 0, custoUsd: 0, erros,
  };
}

/**
 * Consultores padrão: o cliente Jev do ambiente; sem chave ou com configuração inválida, nenhum
 * (a decisão ambígua vira `revisar`). Criado uma vez por processo.
 * @returns {{nome: string, perguntar: Function}[]} Consultores.
 */
export function obterConsultoresPadrao() {
  if (consultoresPadrao) return consultoresPadrao;
  try {
    const cliente = criarClientePadrao();
    consultoresPadrao = [{ nome: 'jev', perguntar: cliente.perguntar }];
  } catch {
    consultoresPadrao = [];
  }
  return consultoresPadrao;
}

/**
 * Completa as dependências injetáveis (consultores e gravador do log).
 * @param {{consultores?: object[], registrar?: Function}} [injetadas] Dependências de teste.
 * @returns {{consultores: object[], registrar: Function}} Dependências completas.
 */
export function montarDependencias(injetadas = {}) {
  return {
    consultores: injetadas.consultores ?? obterConsultoresPadrao(),
    registrar: injetadas.registrar ?? criarRegistroJsonl(ARQUIVO_LOG_GUARDRAILS),
  };
}

/**
 * Confere uma confirmação humana explícita para o alvo avaliado.
 * @param {{confirmado?: boolean, quem?: string, alvo?: string}|undefined} confirmacao Confirmação.
 * @param {(alvo: string) => boolean} casaComAlvo Diz se o `alvo` da confirmação cobre o item.
 * @returns {boolean} true só com `confirmado === true`, `quem` e `alvo` que casa.
 */
export function confirmacaoValida(confirmacao, casaComAlvo) {
  const temCampos = confirmacao?.confirmado === true
    && typeof confirmacao.quem === 'string' && confirmacao.quem.trim() !== ''
    && typeof confirmacao.alvo === 'string' && confirmacao.alvo.trim() !== '';
  return temCampos && casaComAlvo(confirmacao.alvo);
}

/**
 * Aplica o escape humano: bloquear/revisar viram liberar quando a confirmação é válida.
 * @param {object} decisao Decisão do guardrail.
 * @param {boolean} confirmado Resultado de {@link confirmacaoValida}.
 * @returns {object} Decisão (nova, se o escape foi aplicado).
 */
export function aplicarEscape(decisao, confirmado) {
  if (!confirmado || !ACOES_COM_ESCAPE.has(decisao.acao)) return decisao;
  return {
    ...decisao, acao: ACOES.LIBERAR, acaoSemEscape: decisao.acao, escapeHumano: true,
    motivos: [...decisao.motivos, MOTIVO_ESCAPE],
  };
}

/**
 * Monta a linha de auditoria: só metadados (nunca texto, comando, caminho ou valor achado).
 * @param {object} decisao Decisão final.
 * @param {object} consulta Resultado de {@link consultar} (ou null sem consulta).
 * @returns {object} Linha do JSONL.
 */
function montarLinha(decisao, consulta) {
  return {
    data: new Date().toISOString(), caso: decisao.caso, acao: decisao.acao,
    acao_sem_escape: decisao.acaoSemEscape ?? null, motivos: decisao.motivos,
    achados: decisao.achados, probabilidade: decisao.probabilidade, limiar: decisao.limiar,
    fonte: decisao.fonte, modelo: consulta?.modelo ?? null,
    tokens_entrada: consulta?.tokensEntrada ?? 0, custo_usd: consulta?.custoUsd ?? 0,
    hash_entrada: decisao.hashEntrada, exige_confirmacao: decisao.exigeConfirmacao,
    escape_humano: decisao.escapeHumano, erros_consulta: consulta?.erros ?? [],
  };
}

/**
 * Fecha a decisão: grava a linha de auditoria (mascarada por garantia) e devolve o resultado.
 * @param {object} decisao Decisão montada pelo guardrail.
 * @param {{consulta?: object|null, registrar: Function}} fechamento Consulta e gravador.
 * @returns {Promise<Readonly<object>>} Decisão pública (sem texto original).
 */
export async function concluirDecisao(decisao, fechamento) {
  const completa = {
    escapeHumano: false, exigeConfirmacao: false, probabilidade: null, limiar: null,
    ...decisao, achados: resumirAchados(decisao.achados),
  };
  const linha = JSON.stringify(montarLinha(completa, fechamento.consulta));
  await fechamento.registrar(redigirTexto(linha).texto);
  return Object.freeze(completa);
}
