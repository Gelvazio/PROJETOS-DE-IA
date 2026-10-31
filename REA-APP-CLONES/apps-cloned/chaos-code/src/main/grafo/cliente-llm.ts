/**
 * Cliente de chat do grafo (`graph::llm`): fala com o provedor do `embedder_config.json`
 * (`Api` = OpenAI, `Gemini`, `OpenRouter` ou `Custom`) e devolve só o texto da resposta
 * (inventário `modulos.md` e `api.md`). A chave vem do cofre (`preencherChavesEmbedder`) e o
 * `fetch` é injetado. O corpo das respostas de erro nunca entra na mensagem (pode ecoar a chave).
 * Parâmetros de geração (temperatura, tokens) não aparecem no inventário: o clone não envia.
 */

import type { ConfiguracaoEmbedder, ModoEmbedding } from '../../compartilhado/tipos-vetores';
import {
  MODELO_CHAT_GEMINI_PADRAO,
  MODELO_CHAT_OPENAI_PADRAO,
  MODELO_CHAT_OPENROUTER_PADRAO,
  URL_BASE_CUSTOM_PADRAO,
  URL_BASE_GEMINI_EMBEDDING,
  URL_BASE_OPENAI_EMBEDDING,
} from '../vetores/constantes';
import {
  preencherChavesEmbedder,
  type CofreChavesProvedores,
} from '../vetores/chaves-provedores';
import type { CompletarLlm } from './reordenacao';

const CAMINHO_CHAT_OPENAI = '/v1/chat/completions';
const URL_CHAT_OPENROUTER = 'https://openrouter.ai/api/v1/chat/completions';
const ENDPOINT_GEMINI_GERAR = 'generateContent';
const CABECALHO_REFERENCIA_OPENROUTER = 'https://chaoscode.ai';
const CABECALHO_TITULO_OPENROUTER = 'Chaos Code';
const TIPO_CONTEUDO_JSON = 'application/json';
const PAPEL_SISTEMA = 'system';
const PAPEL_USUARIO = 'user';
const SEPARADOR_PARTES = '';
const PADRAO_BARRAS_FINAIS = /\/+$/;

const MSG_SEM_CHAVE = 'Chave de API do provedor de chat não configurada';
const MSG_RESPOSTA_VAZIA = 'O provedor de chat não devolveu texto';
const MSG_RESPOSTA_INVALIDA = 'Resposta do provedor de chat em formato inesperado';
const MSG_FALHA_HTTP = 'O provedor de chat respondeu com erro HTTP';

/** Pedido ao LLM: mensagem de sistema e pedido do usuário. */
export interface PedidoLlm {
  sistema: string;
  usuario: string;
}

/** Resposta HTTP mínima que o cliente usa. */
export interface RespostaRede {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

/** Requisição enviada ao `fetch` injetado. */
export interface RequisicaoRede {
  method: 'POST';
  headers: Record<string, string>;
  body: string;
}

/** Função de rede injetada (padrão: `fetch` global). */
export type EnviarRede = (url: string, requisicao: RequisicaoRede) => Promise<RespostaRede>;

/** Dependências do cliente de LLM. */
export interface DependenciasClienteLlm {
  /** Cofre de onde saem as chaves de API. */
  cofre: CofreChavesProvedores;
  /** Função de rede (padrão: `fetch` global). */
  enviar?: EnviarRede;
}

/** Erro do cliente de LLM (sem chave nem corpo de resposta na mensagem). */
export class ErroClienteLlm extends Error {
  /** Código HTTP, quando o erro veio de uma resposta. */
  readonly status: number | null;

  /**
   * @param {string} mensagem - O que deu errado.
   * @param {number | null} [status] - Código HTTP, se houver.
   */
  constructor(mensagem: string, status: number | null = null) {
    super(mensagem);
    this.name = 'ErroClienteLlm';
    this.status = status;
  }
}

/** Requisição pronta: endereço e o que enviar. */
interface RequisicaoMontada {
  url: string;
  requisicao: RequisicaoRede;
}

/** Monta um endereço juntando base e caminho sem barras duplicadas. */
function juntarUrl(base: string, caminho: string): string {
  return `${base.replace(PADRAO_BARRAS_FINAIS, '')}${caminho}`;
}

/**
 * Escolhe o modelo de chat: o do próprio modo (OpenRouter e Custom), senão o `chat_model` da
 * configuração, senão o padrão do provedor.
 * @param {ConfiguracaoEmbedder} config - Configuração do embedder.
 * @returns {string} Nome do modelo de chat.
 */
export function escolherModeloChat(config: ConfiguracaoEmbedder): string {
  const modo = config.mode;
  const doModo = modo.type === 'OpenRouter' || modo.type === 'Custom' ? modo.chat_model : '';
  const doArquivo = config.chat_model ?? '';
  const padroes: Record<ModoEmbedding['type'], string> = {
    Api: MODELO_CHAT_OPENAI_PADRAO,
    Gemini: MODELO_CHAT_GEMINI_PADRAO,
    OpenRouter: MODELO_CHAT_OPENROUTER_PADRAO,
    Custom: MODELO_CHAT_OPENAI_PADRAO,
  };
  return doModo.trim() || doArquivo.trim() || padroes[modo.type];
}

/**
 * Monta o corpo do formato OpenAI (`/chat/completions`).
 * @param {string} modelo - Modelo de chat.
 * @param {PedidoLlm} pedido - Sistema e usuário.
 * @returns {string} Corpo JSON.
 */
function corpoOpenAi(modelo: string, pedido: PedidoLlm): string {
  return JSON.stringify({
    model: modelo,
    messages: [
      { role: PAPEL_SISTEMA, content: pedido.sistema },
      { role: PAPEL_USUARIO, content: pedido.usuario },
    ],
  });
}

/**
 * Monta o corpo do Gemini (`generateContent`).
 * @param {PedidoLlm} pedido - Sistema e usuário.
 * @returns {string} Corpo JSON.
 */
function corpoGemini(pedido: PedidoLlm): string {
  return JSON.stringify({
    systemInstruction: { parts: [{ text: pedido.sistema }] },
    contents: [{ role: PAPEL_USUARIO, parts: [{ text: pedido.usuario }] }],
  });
}

/**
 * Monta a requisição do provedor da configuração (chaves já preenchidas).
 * @param {ConfiguracaoEmbedder} config - Configuração com as chaves.
 * @param {PedidoLlm} pedido - Sistema e usuário.
 * @returns {RequisicaoMontada} Endereço, cabeçalhos e corpo.
 * @throws {ErroClienteLlm} Se não houver chave de API.
 */
export function montarRequisicao(
  config: ConfiguracaoEmbedder,
  pedido: PedidoLlm,
): RequisicaoMontada {
  const modo = config.mode;
  if (!modo.api_key) throw new ErroClienteLlm(MSG_SEM_CHAVE);

  const modelo = escolherModeloChat(config);
  const cabecalhos: Record<string, string> = { 'Content-Type': TIPO_CONTEUDO_JSON };

  if (modo.type === 'Gemini') {
    cabecalhos['x-goog-api-key'] = modo.api_key;
    const url = `${URL_BASE_GEMINI_EMBEDDING}/${modelo}:${ENDPOINT_GEMINI_GERAR}`;
    return { url, requisicao: { method: 'POST', headers: cabecalhos, body: corpoGemini(pedido) } };
  }

  cabecalhos.Authorization = `Bearer ${modo.api_key}`;
  let url = juntarUrl(URL_BASE_OPENAI_EMBEDDING, CAMINHO_CHAT_OPENAI);
  if (modo.type === 'Api') {
    url = juntarUrl(modo.endpoint || URL_BASE_OPENAI_EMBEDDING, CAMINHO_CHAT_OPENAI);
  }
  if (modo.type === 'OpenRouter') {
    url = URL_CHAT_OPENROUTER;
    cabecalhos['HTTP-Referer'] = CABECALHO_REFERENCIA_OPENROUTER;
    cabecalhos['X-Title'] = CABECALHO_TITULO_OPENROUTER;
  }
  if (modo.type === 'Custom') {
    url = juntarUrl(modo.base_url || URL_BASE_CUSTOM_PADRAO, CAMINHO_CHAT_OPENAI);
    for (const { key, value } of modo.headers) cabecalhos[key] = value;
  }
  const body = corpoOpenAi(modelo, pedido);
  return { url, requisicao: { method: 'POST', headers: cabecalhos, body } };
}

/**
 * Lê o texto da resposta do formato OpenAI (`choices[0].message.content`).
 * @param {unknown} dados - JSON da resposta.
 * @returns {string | null} Texto, ou null se o formato for outro.
 */
function lerTextoOpenAi(dados: unknown): string | null {
  const escolhas = (dados as { choices?: unknown })?.choices;
  if (!Array.isArray(escolhas)) return null;
  const primeira = escolhas[0] as { message?: { content?: unknown } } | undefined;
  const conteudo = primeira?.message?.content;
  return typeof conteudo === 'string' ? conteudo : null;
}

/**
 * Lê o texto da resposta do Gemini (`candidates[0].content.parts[].text`).
 * @param {unknown} dados - JSON da resposta.
 * @returns {string | null} Texto, ou null se o formato for outro.
 */
function lerTextoGemini(dados: unknown): string | null {
  const candidatos = (dados as { candidates?: unknown })?.candidates;
  if (!Array.isArray(candidatos)) return null;
  const partes = (candidatos[0] as { content?: { parts?: unknown } } | undefined)?.content?.parts;
  if (!Array.isArray(partes)) return null;
  const textos = partes.map((parte) => (parte as { text?: unknown })?.text);
  return textos.filter((texto) => typeof texto === 'string').join(SEPARADOR_PARTES);
}

/**
 * Extrai o texto da resposta conforme o provedor.
 * @param {ModoEmbedding} modo - Modo configurado.
 * @param {unknown} dados - JSON da resposta.
 * @returns {string} Texto não vazio.
 * @throws {ErroClienteLlm} Se o formato for inesperado ou o texto vier vazio.
 */
export function extrairTexto(modo: ModoEmbedding, dados: unknown): string {
  const texto = modo.type === 'Gemini' ? lerTextoGemini(dados) : lerTextoOpenAi(dados);
  if (texto === null) throw new ErroClienteLlm(MSG_RESPOSTA_INVALIDA);
  if (texto.trim().length === 0) throw new ErroClienteLlm(MSG_RESPOSTA_VAZIA);
  return texto;
}

/**
 * Cria a função que completa pedidos no LLM do `embedder_config.json`. A configuração e a chave
 * são lidas a cada chamada, então mudar de provedor na tela vale sem recriar o cliente.
 * @param {() => Promise<ConfiguracaoEmbedder>} lerConfiguracao - Lê `embedder_config.json`.
 * @param {DependenciasClienteLlm} dependencias - Cofre de chaves e função de rede.
 * @returns {CompletarLlm} Função que recebe o pedido e devolve o texto da resposta.
 * @throws {ErroClienteLlm} (na função devolvida) Sem chave, erro HTTP ou resposta inesperada.
 */
export function criarCompletarLlm(
  lerConfiguracao: () => Promise<ConfiguracaoEmbedder>,
  dependencias: DependenciasClienteLlm,
): CompletarLlm {
  const enviar = dependencias.enviar ?? (fetch as unknown as EnviarRede);

  return async (pedido) => {
    const configuracao = await lerConfiguracao();
    const completa = await preencherChavesEmbedder(configuracao, dependencias.cofre);
    const { url, requisicao } = montarRequisicao(completa, pedido);

    const resposta = await enviar(url, requisicao);
    if (!resposta.ok) {
      throw new ErroClienteLlm(`${MSG_FALHA_HTTP} ${resposta.status}`, resposta.status);
    }
    return extrairTexto(completa.mode, await resposta.json());
  };
}
