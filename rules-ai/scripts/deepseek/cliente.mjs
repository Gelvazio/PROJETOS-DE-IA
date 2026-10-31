// Cliente único da API da DeepSeek (INTEGRACAO-DEEPSEEK.2). A chave vem SÓ da variável de
// ambiente DEEPSEEK_API_KEY: nunca de arquivo, nunca em log, nunca em mensagem de erro. Sem
// chave (ou com DEEPSEEK_MODO=off) a API não é chamada. Todo erro (rede, timeout, 401, 429,
// 5xx) volta como objeto { ok: false, erro } — o cliente não lança exceção ao chamador, para o
// roteador seguir com o modelo da matriz (R3, INV-2). O texto passa pela redação de segredos
// antes do envio (INV-1). Não escolhe modelo nem mede custo: isso é do roteador e dos limites.
import { redigirTexto, resumirAchados } from '../jev/guardrails/redigir.mjs';
import { estaDesligada, lerLimites } from './limites.mjs';

// Modo off, tokens e tempo são lidos só em limites.mjs (reexportados por compatibilidade).
export { estaDesligada, lerLimites };

const URL_API = 'https://api.deepseek.com/chat/completions';
const VARIAVEL_CHAVE = 'DEEPSEEK_API_KEY';
const VARIAVEL_MODO = 'DEEPSEEK_MODO';
const MODO_DESLIGADO = 'off';
const STATUS_CHAVE_RECUSADA = new Set([401, 403]);
const STATUS_LIMITE_TAXA = 429;
const STATUS_SERVIDOR_MINIMO = 500;
const STATUS_SERVIDOR_MAXIMO = 599;
const NOME_ERRO_TEMPO = 'AbortError';
const PENSAMENTO_LIGADO = { type: 'enabled' };

export const TIPOS_ERRO = Object.freeze({
  DESLIGADO: 'desligado',
  SEM_CHAVE: 'sem-chave',
  PEDIDO_INVALIDO: 'pedido-invalido',
  CHAVE_RECUSADA: 'chave-recusada',
  LIMITE_TAXA: 'limite-de-taxa',
  SERVIDOR: 'servidor',
  REQUISICAO: 'requisicao',
  TEMPO: 'timeout',
  REDE: 'rede',
  RESPOSTA_INVALIDA: 'resposta-invalida',
});

const MENSAGENS_ERRO = Object.freeze({
  [TIPOS_ERRO.DESLIGADO]: `${VARIAVEL_MODO}=${MODO_DESLIGADO}: a DeepSeek está desligada.`,
  [TIPOS_ERRO.SEM_CHAVE]: `${VARIAVEL_CHAVE} não definida: defina a variável no ambiente `
    + '(nunca em arquivo versionado). A API da DeepSeek não foi chamada.',
  [TIPOS_ERRO.PEDIDO_INVALIDO]: 'Pedido inválido: informe modelo e ao menos uma mensagem.',
  [TIPOS_ERRO.CHAVE_RECUSADA]: `Chave recusada pela DeepSeek: confira a ${VARIAVEL_CHAVE}.`,
  [TIPOS_ERRO.LIMITE_TAXA]: 'Limite de taxa da DeepSeek (429).',
  [TIPOS_ERRO.SERVIDOR]: 'Falha no servidor da DeepSeek (5xx).',
  [TIPOS_ERRO.REQUISICAO]: 'A DeepSeek recusou a requisição (4xx).',
  [TIPOS_ERRO.TEMPO]: 'Tempo máximo da chamada à DeepSeek esgotado.',
  [TIPOS_ERRO.REDE]: 'Falha de rede ao chamar a DeepSeek.',
  [TIPOS_ERRO.RESPOSTA_INVALIDA]: 'Resposta da DeepSeek sem o formato esperado.',
});

/**
 * Monta o objeto de erro padrão, sem chave, sem texto do pedido e sem corpo da resposta.
 * @param {string} tipo Um valor de {@link TIPOS_ERRO}.
 * @param {number} [status] Status HTTP, quando houver.
 * @returns {{ok: false, erro: {tipo: string, mensagem: string, status?: number}}} Erro.
 */
function montarErro(tipo, status) {
  const erro = { tipo, mensagem: MENSAGENS_ERRO[tipo] };
  if (status !== undefined) erro.status = status;
  return { ok: false, erro };
}

/**
 * Mascara segredos do texto de cada mensagem antes do envio.
 * @param {{role: string, content: string}[]} mensagens Mensagens do pedido.
 * @returns {{mensagens: object[], achados: object[]}} Mensagens mascaradas e achados (sem valor).
 */
function redigirMensagens(mensagens) {
  const achados = [];
  const redigidas = mensagens.map((mensagem) => {
    const resultado = redigirTexto(mensagem.content);
    achados.push(...resultado.achados);
    return { role: mensagem.role, content: resultado.texto };
  });
  return { mensagens: redigidas, achados };
}

/**
 * Confere se o pedido tem modelo e mensagens com papel e texto.
 * @param {{modelo?: string, mensagens?: object[]}} pedido Pedido recebido.
 * @returns {boolean} true se o pedido é utilizável.
 */
function pedidoEhValido(pedido) {
  const temModelo = typeof pedido?.modelo === 'string' && pedido.modelo.length > 0;
  const lista = pedido?.mensagens;
  const temMensagens = Array.isArray(lista) && lista.length > 0;
  const mensagensCompletas = temMensagens
    && lista.every((m) => typeof m?.role === 'string' && typeof m?.content === 'string');
  return temModelo && mensagensCompletas;
}

/**
 * Monta o corpo JSON enviado à API (já com texto mascarado e teto de tokens).
 * @param {{modelo: string, raciocinio?: boolean}} pedido Pedido recebido.
 * @param {object[]} mensagens Mensagens já mascaradas.
 * @param {number} maxTokens Teto de tokens da resposta.
 * @returns {object} Corpo da requisição.
 */
function montarCorpo(pedido, mensagens, maxTokens) {
  const corpo = { model: pedido.modelo, messages: mensagens, max_tokens: maxTokens };
  if (pedido.raciocinio) corpo.thinking = PENSAMENTO_LIGADO;
  return corpo;
}

/**
 * Traduz um status HTTP de falha para o tipo de erro do cliente.
 * @param {number} status Status HTTP (não 2xx).
 * @returns {string} Um valor de {@link TIPOS_ERRO}.
 */
function tipoDoStatus(status) {
  if (STATUS_CHAVE_RECUSADA.has(status)) return TIPOS_ERRO.CHAVE_RECUSADA;
  if (status === STATUS_LIMITE_TAXA) return TIPOS_ERRO.LIMITE_TAXA;
  const ehServidor = status >= STATUS_SERVIDOR_MINIMO && status <= STATUS_SERVIDOR_MAXIMO;
  return ehServidor ? TIPOS_ERRO.SERVIDOR : TIPOS_ERRO.REQUISICAO;
}

/**
 * Extrai texto e uso do corpo JSON de uma resposta 2xx.
 * @param {object} dados JSON devolvido pela API.
 * @returns {{texto: string, uso: {tokensEntrada: number, tokensSaida: number}}|null} Resultado,
 *   ou null se o formato não for o esperado.
 */
function lerResposta(dados) {
  const texto = dados?.choices?.[0]?.message?.content;
  if (typeof texto !== 'string') return null;
  return {
    texto,
    uso: {
      tokensEntrada: Number(dados.usage?.prompt_tokens) || 0,
      tokensSaida: Number(dados.usage?.completion_tokens) || 0,
    },
  };
}

/**
 * Envia a requisição com tempo máximo. Nunca lança: falhas viram objeto de erro.
 * @param {{corpo: object, chave: string, tempoMaximoMs: number}} envio Dados do envio.
 * @param {Function} fetchImpl Implementação de `fetch` (injetável).
 * @returns {Promise<{ok: true, dados: object}|{ok: false, erro: object}>} Resultado.
 */
async function enviar(envio, fetchImpl) {
  const controle = new AbortController();
  const temporizador = setTimeout(() => controle.abort(), envio.tempoMaximoMs);
  try {
    const resposta = await fetchImpl(URL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${envio.chave}` },
      body: JSON.stringify(envio.corpo),
      signal: controle.signal,
    });
    if (!resposta.ok) return montarErro(tipoDoStatus(resposta.status), resposta.status);
    return { ok: true, dados: await resposta.json() };
  } catch (erro) {
    const estourouTempo = erro?.name === NOME_ERRO_TEMPO;
    return montarErro(estourouTempo ? TIPOS_ERRO.TEMPO : TIPOS_ERRO.REDE);
  } finally {
    clearTimeout(temporizador);
  }
}

/**
 * Chama a API da DeepSeek (chat). Nunca lança e nunca devolve a chave nem o corpo bruto.
 * Sem `DEEPSEEK_API_KEY` ou com `DEEPSEEK_MODO=off`, não chama a API.
 * @param {{modelo: string, mensagens: {role: string, content: string}[], raciocinio?: boolean}}
 *   pedido Modelo DeepSeek, mensagens e se o raciocínio fica ligado.
 * @param {{ambiente?: Record<string, string|undefined>, fetchImpl?: Function}} [opcoes]
 *   Ambiente e `fetch` injetáveis (padrão: `process.env` e o `fetch` global).
 * @returns {Promise<{ok: true, texto: string, modelo: string, uso: object, achados: object}
 *   |{ok: false, erro: {tipo: string, mensagem: string, status?: number}}>} Resposta ou erro.
 *   `achados` é a contagem de segredos mascarados por tipo (sem valores).
 */
export async function chamarDeepseek(pedido, opcoes = {}) {
  const ambiente = opcoes.ambiente ?? process.env;
  if (estaDesligada(ambiente)) return montarErro(TIPOS_ERRO.DESLIGADO);

  const chave = String(ambiente[VARIAVEL_CHAVE] ?? '').trim();
  if (!chave) return montarErro(TIPOS_ERRO.SEM_CHAVE);
  if (!pedidoEhValido(pedido)) return montarErro(TIPOS_ERRO.PEDIDO_INVALIDO);

  const { maxTokens, tempoMaximoMs } = lerLimites(ambiente);
  const redigido = redigirMensagens(pedido.mensagens);
  const corpo = montarCorpo(pedido, redigido.mensagens, maxTokens);
  const resultado = await enviar({ corpo, chave, tempoMaximoMs }, opcoes.fetchImpl ?? fetch);
  if (!resultado.ok) return resultado;

  const lida = lerResposta(resultado.dados);
  if (!lida) return montarErro(TIPOS_ERRO.RESPOSTA_INVALIDA);
  return { ok: true, ...lida, modelo: pedido.modelo, achados: resumirAchados(redigido.achados) };
}
