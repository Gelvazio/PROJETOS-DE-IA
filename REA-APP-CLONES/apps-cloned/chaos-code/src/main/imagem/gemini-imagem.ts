/**
 * Geração local de imagem pelo Gemini "Nano Banana" (`image::generation`, inventário
 * `imagem-atualizador.md`): `POST .../<modelo>:generateContent` com a chave no cabeçalho
 * `x-goog-api-key`. É o plano B quando a cota da plataforma acaba. A chave vem da configuração
 * já preenchida por `preencherChavesImagem`; o `fetch` é injetado e nada é gravado aqui.
 */

import {
  CABECALHO_CHAVE_GEMINI,
  MODALIDADES_RESPOSTA_GEMINI,
  PROPORCOES_IMAGEM,
  PROVEDOR_LOCAL_GEMINI,
  TEMPO_LIMITE_GERACAO_IMAGEM_MS,
  URL_GEMINI_GERAR_CONTEUDO,
  type ConfiguracaoImagemGemini,
  type ParteGemini,
  type PedidoGeminiImagem,
  type ProporcaoImagem,
  type RespostaGeminiImagem,
} from '../../compartilhado/tipos-imagem';

const STATUS_NAO_AUTORIZADO = 401;
const STATUS_PROIBIDO = 403;
const STATUS_PORTA_DE_ENTRADA_INVALIDA = 502;
const LIMITE_TEXTO_ERRO = 300;
const MSG_SEM_CHAVE = 'Chave da API Gemini não configurada (Configurações > Imagens > Gemini)';
const MSG_PROMPT_VAZIO = 'O prompt da imagem está vazio';
const MSG_CHAVE_RECUSADA = 'Gemini recusou a chave de API (HTTP';
const MSG_SERVIDOR_INDISPONIVEL = 'Gemini indisponível no momento (HTTP 502)';
const MSG_ERRO_API = 'Gemini API error';
const MSG_SEM_IMAGEM = 'O Gemini não devolveu nenhuma imagem';
const MSG_FALHA_LOCAL = 'Failed to generate image via local Gemini';

/** Resposta mínima de `fetch` usada na geração (compatível com `Response`). */
export interface RespostaHttpImagem {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

/** `fetch` injetado: só o que a geração usa. */
export type BuscadorHttpImagem = (
  url: string,
  opcoes: {
    method: 'POST';
    headers: Record<string, string>;
    body: string;
    signal?: AbortSignal;
  },
) => Promise<RespostaHttpImagem>;

/** Pedido de geração local. */
export interface PedidoGeracaoGemini {
  /** Texto descritivo da imagem. */
  prompt: string;
  /** Proporção (`aspectRatio`); sem valor, o Gemini escolhe. */
  proporcao?: ProporcaoImagem;
}

/** Imagem gerada pelo Gemini, ainda em base64 (a gravação é de outro módulo). */
export interface ImagemGeradaGemini {
  /** Tipo do arquivo (ex.: `image/png`). */
  mimeType: string;
  /** Conteúdo em base64. */
  base64: string;
  /** Texto que o Gemini mandou junto, se houver. */
  texto: string | null;
  /** Sempre `gemini_local`: gerada no cliente, não gravada na plataforma. */
  provedor: typeof PROVEDOR_LOCAL_GEMINI;
}

/** Dependências injetadas na geração. */
export interface DependenciasGeracaoGemini {
  buscar: BuscadorHttpImagem;
  /** Sinal de cancelamento (padrão: tempo limite de `TEMPO_LIMITE_GERACAO_IMAGEM_MS`). */
  criarSinal?: () => AbortSignal;
}

/**
 * Monta o corpo do pedido ao Gemini.
 * @param {PedidoGeracaoGemini} pedido - Prompt e proporção.
 * @returns {PedidoGeminiImagem} Corpo no formato do `generateContent`.
 */
export function montarPedidoGemini(pedido: PedidoGeracaoGemini): PedidoGeminiImagem {
  const { proporcao } = pedido;
  const imageConfig =
    proporcao && PROPORCOES_IMAGEM.includes(proporcao) ? { aspectRatio: proporcao } : undefined;
  return {
    contents: [{ parts: [{ text: pedido.prompt.trim() }] }],
    generationConfig: {
      responseModalities: [...MODALIDADES_RESPOSTA_GEMINI],
      ...(imageConfig ? { imageConfig } : {}),
    },
  };
}

/**
 * Traduz um status HTTP de falha em mensagem clara (401/403/502 têm texto próprio).
 * @param {RespostaHttpImagem} resposta - Resposta que não deu certo.
 * @returns {Promise<string>} Mensagem para o usuário.
 */
async function descreverFalhaHttp(resposta: RespostaHttpImagem): Promise<string> {
  const { status } = resposta;
  if (status === STATUS_NAO_AUTORIZADO || status === STATUS_PROIBIDO) {
    return `${MSG_CHAVE_RECUSADA} ${status})`;
  }
  if (status === STATUS_PORTA_DE_ENTRADA_INVALIDA) return MSG_SERVIDOR_INDISPONIVEL;

  const detalhe = (await resposta.text().catch(() => '')).slice(0, LIMITE_TEXTO_ERRO);
  return `${MSG_ERRO_API} ${status}: ${detalhe}`;
}

/**
 * Procura a primeira imagem e o texto nas partes da resposta.
 * @param {unknown} json - Corpo decodificado da resposta.
 * @returns {ImagemGeradaGemini} A imagem encontrada.
 * @throws {Error} Se não houver parte com `inlineData`.
 */
export function extrairImagemGemini(json: unknown): ImagemGeradaGemini {
  const candidatos = (json as Partial<RespostaGeminiImagem> | null)?.candidates ?? [];
  const partes: ParteGemini[] = candidatos.flatMap((candidato) => candidato.content?.parts ?? []);

  const imagem = partes.find((parte) => 'inlineData' in parte && parte.inlineData?.data);
  if (!imagem || !('inlineData' in imagem)) throw new Error(MSG_SEM_IMAGEM);

  const textos = partes.flatMap((parte) => ('text' in parte && parte.text ? [parte.text] : []));
  return {
    mimeType: imagem.inlineData.mimeType,
    base64: imagem.inlineData.data,
    texto: textos.length > 0 ? textos.join('\n') : null,
    provedor: PROVEDOR_LOCAL_GEMINI,
  };
}

/**
 * Faz a chamada HTTP ao Gemini e devolve o JSON da resposta.
 * @param {string} chave - Chave de API.
 * @param {PedidoGeracaoGemini} pedido - Prompt e proporção.
 * @param {DependenciasGeracaoGemini} dependencias - `fetch` e sinal de cancelamento.
 * @returns {Promise<unknown>} Corpo decodificado.
 * @throws {Error} Se o status não for de sucesso.
 */
async function chamarGemini(
  chave: string,
  pedido: PedidoGeracaoGemini,
  dependencias: DependenciasGeracaoGemini,
): Promise<unknown> {
  const criarSinal =
    dependencias.criarSinal ?? (() => AbortSignal.timeout(TEMPO_LIMITE_GERACAO_IMAGEM_MS));
  const resposta = await dependencias.buscar(URL_GEMINI_GERAR_CONTEUDO, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', [CABECALHO_CHAVE_GEMINI]: chave },
    body: JSON.stringify(montarPedidoGemini(pedido)),
    signal: criarSinal(),
  });
  if (!resposta.ok) throw new Error(await descreverFalhaHttp(resposta));
  return resposta.json();
}

/**
 * Gera uma imagem pelo Gemini local.
 * @param {ConfiguracaoImagemGemini | undefined} config - Bloco `gemini` já com a chave do cofre.
 * @param {PedidoGeracaoGemini} pedido - Prompt e proporção.
 * @param {DependenciasGeracaoGemini} dependencias - `fetch` injetado.
 * @returns {Promise<ImagemGeradaGemini>} Imagem em base64.
 * @throws {Error} "Failed to generate image via local Gemini: ..." em qualquer falha.
 */
export async function gerarImagemGemini(
  config: ConfiguracaoImagemGemini | undefined,
  pedido: PedidoGeracaoGemini,
  dependencias: DependenciasGeracaoGemini,
): Promise<ImagemGeradaGemini> {
  try {
    if (!config?.api_key.trim()) throw new Error(MSG_SEM_CHAVE);
    if (!pedido.prompt.trim()) throw new Error(MSG_PROMPT_VAZIO);
    const json = await chamarGemini(config.api_key, pedido, dependencias);
    return extrairImagemGemini(json);
  } catch (erro) {
    const motivo = erro instanceof Error ? erro.message : String(erro);
    throw new Error(`${MSG_FALHA_LOCAL}: ${motivo}`, { cause: erro });
  }
}
