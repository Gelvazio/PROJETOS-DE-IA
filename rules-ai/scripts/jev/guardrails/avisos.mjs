// Peças comuns dos guardrails que só avisam (escopo e critérios de aceite): ações permitidas,
// máscara obrigatória antes do envio, consulta ao Jev sem lançar erro e log de auditoria JSONL.
// O log guarda só metadados (caso, alvo, probabilidades, ação, tokens, custo, hash): nunca texto.
import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { calcularHashState } from '../cliente.mjs';
import { PASTA_SAIDAS } from '../config.mjs';

/** Estes guardrails nunca bloqueiam: o máximo é `revisar` (humano olha). */
export const ACOES = Object.freeze({ LIBERAR: 'liberar', AVISAR: 'avisar', REVISAR: 'revisar' });
export const ARQUIVO_AUDITORIA_PADRAO = join(PASTA_SAIDAS, 'guardrails.jsonl');

const GRAVIDADE = [ACOES.LIBERAR, ACOES.AVISAR, ACOES.REVISAR];
const MODULO_REDATOR = './redigir.mjs';
const MOTIVO_SEM_REDATOR = 'redator de segredo/PII indisponível: nada foi enviado ao Jev';
const MOTIVO_SEM_CLIENTE = 'cliente do Jev indisponível: nada foi enviado';

/**
 * Devolve a ação mais grave entre duas (liberar < avisar < revisar).
 * @param {string} atual Ação atual.
 * @param {string} candidata Ação candidata.
 * @returns {string} A mais grave das duas.
 */
export function maisGrave(atual, candidata) {
  return GRAVIDADE.indexOf(candidata) > GRAVIDADE.indexOf(atual) ? candidata : atual;
}

/**
 * Obtém o redator `redigirTexto(texto) -> { texto, achados }`: o injetado ou o de `redigir.mjs`.
 * @param {Function} [injetado] Redator injetado (testes).
 * @returns {Promise<Function|null>} Redator, ou null se o módulo ainda não existir.
 */
export async function obterRedator(injetado) {
  if (typeof injetado === 'function') return injetado;
  try {
    const modulo = await import(MODULO_REDATOR);
    return typeof modulo.redigirTexto === 'function' ? modulo.redigirTexto : null;
  } catch {
    return null;
  }
}

/**
 * Mascara um texto e conta os achados (sem guardar o valor achado).
 * @param {string} texto Texto original.
 * @param {Function} redator Redator `redigirTexto`.
 * @param {{achados: number}} contagem Contador acumulado (alterado).
 * @returns {string} Texto mascarado.
 */
export function mascarar(texto, redator, contagem) {
  const resultado = redator(String(texto ?? ''));
  const achados = Array.isArray(resultado?.achados) ? resultado.achados.length : 0;
  contagem.achados += achados;
  return String(resultado?.texto ?? '');
}

/**
 * Resultado padrão quando não dá para consultar o Jev com segurança: revisar, nunca liberar.
 * @param {string} caso Nome do guardrail.
 * @param {string} motivo Por que não foi possível.
 * @returns {object} Resultado com ação `revisar`.
 */
export function resultadoIndisponivel(caso, motivo) {
  return { caso, acao: ACOES.REVISAR, motivos: [motivo], indisponivel: true };
}

/**
 * Confere os requisitos de envio: redator e cliente presentes.
 * @param {string} caso Nome do guardrail.
 * @param {{redator: Function|null, cliente: object|undefined}} dependencias Dependências.
 * @returns {object|null} Resultado `revisar` se faltar algo, ou null se estiver tudo certo.
 */
export function conferirDependencias(caso, dependencias) {
  if (!dependencias.redator) return resultadoIndisponivel(caso, MOTIVO_SEM_REDATOR);
  if (!dependencias.cliente) return resultadoIndisponivel(caso, MOTIVO_SEM_CLIENTE);
  return null;
}

/**
 * Consulta o Jev sem lançar: devolve as respostas ou o código do erro.
 * @param {object} cliente Cliente do Jev (`perguntar`).
 * @param {{state: object, perguntas: object, acao: string}} pedido Pedido já mascarado.
 * @returns {Promise<{resultado?: object, erroCodigo?: string}>} Desfecho da consulta.
 */
export async function consultarJev(cliente, pedido) {
  try {
    return { resultado: await cliente.perguntar(pedido) };
  } catch (erro) {
    return { erroCodigo: erro?.codigo ?? 'ERRO_DESCONHECIDO' };
  }
}

/**
 * Lê a probabilidade `noul` de uma resposta.
 * @param {object} respostas Campo `answers` do Jev.
 * @param {string} chave Identificador da pergunta.
 * @returns {number|null} Probabilidade de 0 a 1, ou null se faltar ou for inválida.
 */
export function lerProbabilidade(respostas, chave) {
  const valor = respostas?.[chave]?.noul;
  const ehValido = Number.isFinite(valor) && valor >= 0 && valor <= 1;
  return ehValido ? valor : null;
}

/**
 * Cria o gravador padrão da auditoria (anexa uma linha JSONL).
 * @param {string} [arquivo] Caminho do arquivo.
 * @returns {(linha: object) => Promise<void>} Função que grava a linha.
 */
export function criarAuditoriaJsonl(arquivo = ARQUIVO_AUDITORIA_PADRAO) {
  return async (linha) => {
    await mkdir(dirname(arquivo), { recursive: true });
    await appendFile(arquivo, `${JSON.stringify(linha)}\n`, 'utf8');
  };
}

/**
 * Grava a decisão na auditoria, sem nenhum texto de entrada (só hash e números).
 * @param {object} dados `{caso, alvo, state, resultado, consulta, achados, registrar}`.
 * @returns {Promise<string>} Hash do state mascarado (16 caracteres).
 */
export async function auditar(dados) {
  const hashInput = calcularHashState(dados.state);
  const { resultado, consulta } = dados;
  const registrar = dados.registrar ?? criarAuditoriaJsonl();
  await registrar({
    data: new Date().toISOString(),
    caso: dados.caso,
    alvo: dados.alvo ?? null,
    hash_input: hashInput,
    probabilidades: resultado.probabilidades ?? null,
    limiar: resultado.limiar ?? null,
    acao: resultado.acao,
    modelo: consulta?.resultado?.modeloResposta ?? null,
    tokens_entrada: consulta?.resultado?.uso?.tokensEntrada ?? 0,
    tokens_saida: consulta?.resultado?.uso?.tokensSaida ?? 0,
    custo_usd: consulta?.resultado?.custoUsd ?? 0,
    achados_mascarados: dados.achados,
    erro_codigo: consulta?.erroCodigo ?? null,
  });
  return hashInput;
}
