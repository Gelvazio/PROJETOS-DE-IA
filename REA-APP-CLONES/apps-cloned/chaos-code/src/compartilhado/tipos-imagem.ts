/**
 * Constantes e tipos da geração de imagem, com os nomes do original (inventário CLONE.1.9,
 * módulo `image::generation` e comandos `commands::image`). Não há lógica aqui.
 */

/** Modelo Gemini usado pelo "Nano Banana (Gemini)". */
export const MODELO_GEMINI_IMAGEM = 'gemini-2.0-flash-preview-image-generation';

/** Nome que aparece na tela para o provedor Gemini de imagem. */
export const NOME_PROVEDOR_GEMINI_IMAGEM = 'Nano Banana (Gemini)';

/** Base da API Gemini (sem o modelo). */
export const URL_BASE_GEMINI = 'https://generativelanguage.googleapis.com/v1beta/models';

/** Endereço de geração de conteúdo do Gemini; o modelo já vem embutido. */
export const URL_GEMINI_GERAR_CONTEUDO =
  `${URL_BASE_GEMINI}/${MODELO_GEMINI_IMAGEM}:generateContent`;

/** Cabeçalho que leva a chave de API do Gemini. */
export const CABECALHO_CHAVE_GEMINI = 'x-goog-api-key';

/** Modalidades pedidas na resposta do Gemini (`responseModalities`). */
export const MODALIDADES_RESPOSTA_GEMINI = ['TEXT', 'IMAGE'] as const;

/**
 * Proporções (`aspectRatio`) aceitas. O inventário só traz o exemplo `1:1`; a lista completa
 * fica pendente de confirmação no Ghidra.
 */
export const PROPORCOES_IMAGEM = ['1:1'] as const;

/** Endereço base do provedor OpenAI de imagens. */
export const URL_BASE_OPENAI_IMAGEM = 'https://api.openai.com';

/** Nome do arquivo de configuração de imagem no disco. */
export const NOME_ARQUIVO_CONFIG_IMAGEM = 'image_api_config.json';

/** Identificador do provedor local (Gemini direto) no resultado da geração. */
export const PROVEDOR_LOCAL_GEMINI = 'gemini_local';

/** Provedor padrão: a plataforma do chaoscode.ai. */
export const PROVEDOR_PADRAO_IMAGEM = 'platform';

/** Rota de geração na plataforma; `<id>` é trocado pelo id do projeto. */
export const ROTA_GERAR_IMAGEM_PLATAFORMA = '/api/projects/<id>/images/generate';

/** Tempo máximo da chamada bloqueante de geração ("up to 3 minutes"). */
export const TEMPO_LIMITE_GERACAO_IMAGEM_MS = 180_000;

/** Limites de largura e altura em pixels. */
export const DIMENSAO_IMAGEM_MINIMA = 256;
export const DIMENSAO_IMAGEM_MAXIMA = 2048;
export const LARGURA_IMAGEM_PADRAO = 1024;
export const ALTURA_IMAGEM_PADRAO = 1024;

/** Escala de orientação (guidance) do provedor da plataforma. */
export const ESCALA_GUIA_MINIMA = 1;
export const ESCALA_GUIA_MAXIMA = 20;
export const ESCALA_GUIA_PADRAO = 3.5;

/** Passos de inferência do provedor da plataforma. */
export const PASSOS_INFERENCIA_MINIMOS = 1;
export const PASSOS_INFERENCIA_MAXIMOS = 100;
export const PASSOS_INFERENCIA_PADRAO = 28;

/** Modalidade de resposta do Gemini (`TEXT` ou `IMAGE`). */
export type ModalidadeRespostaGemini = (typeof MODALIDADES_RESPOSTA_GEMINI)[number];

/** Proporção de imagem aceita pelo Gemini. */
export type ProporcaoImagem = (typeof PROPORCOES_IMAGEM)[number];

/** Provedor de geração escolhido no pedido. */
export type ProvedorImagem = 'platform' | 'gemini';

/** Parte de texto do pedido ou da resposta do Gemini. */
export interface ParteTextoGemini {
  text: string;
}

/** Imagem em base64 dentro da resposta do Gemini. */
export interface DadosInlineGemini {
  mimeType: string;
  /** Conteúdo da imagem em base64. */
  data: string;
}

/** Parte de imagem da resposta do Gemini. */
export interface ParteImagemGemini {
  inlineData: DadosInlineGemini;
}

/** Parte aceita pelo Gemini: texto ou imagem (enum `GeminiPart`). */
export type ParteGemini = ParteTextoGemini | ParteImagemGemini;

/** Configuração de geração do pedido ao Gemini. `quality` é inferido, não confirmado. */
export interface ConfiguracaoGeracaoGemini {
  responseModalities: ModalidadeRespostaGemini[];
  imageConfig?: {
    aspectRatio: ProporcaoImagem;
  };
  quality?: string;
}

/** Pedido enviado ao endpoint `generateContent` do Gemini. */
export interface PedidoGeminiImagem {
  contents: {
    parts: ParteTextoGemini[];
  }[];
  generationConfig: ConfiguracaoGeracaoGemini;
}

/** Resposta do Gemini: a imagem vem em `candidates[].content.parts[]`. */
export interface RespostaGeminiImagem {
  candidates: {
    content: {
      parts: ParteGemini[];
    };
  }[];
}

/** Parâmetros da ferramenta MCP `generate_image`. Os nomes vêm das descrições do original. */
export interface ParametrosGerarImagem {
  /** Texto descritivo da imagem (obrigatório). */
  prompt: string;
  /** O que excluir da imagem (só provedor da plataforma). */
  negative_prompt?: string;
  /** Largura em pixels, de 256 a 2048 (padrão 1024). */
  width?: number;
  /** Altura em pixels, de 256 a 2048 (padrão 1024). */
  height?: number;
  /** Escala de orientação, de 1 a 20 (padrão 3.5; só plataforma). */
  guidance_scale?: number;
  /** Passos de inferência, de 1 a 100 (padrão 28; só plataforma). */
  num_inference_steps?: number;
  seed?: number;
  tags?: string[];
  /** Provedor: `platform` (padrão) ou `gemini`. */
  provider?: ProvedorImagem;
}

/**
 * Resposta de cota excedida (`QuotaExceededResponse`). Os dois campos de mensagem
 * não foram confirmados.
 */
export interface RespostaCotaExcedida {
  quota_exceeded: boolean;
  images_used: number;
  images_limit: number;
  quota_type: string;
  storage_used: number;
  storage_limit: number;
}

/**
 * Resposta de geração da plataforma (`PlatformGenerateResponse`). Os dados
 * da imagem não foram listados.
 */
export interface RespostaGeracaoPlataforma {
  error_message?: string;
  guidance_scale: number;
  num_inference_steps: number;
}

/** Bloco OpenAI de `image_api_config.json` (`ImageOpenAIConfig`, 3 campos). */
export interface ConfiguracaoImagemOpenAI {
  endpoint: string;
  api_key: string;
  rpm_limit: number;
}

/** Bloco Gemini de `image_api_config.json` (`ImageGeminiConfig`, 2 campos). */
export interface ConfiguracaoImagemGemini {
  api_key: string;
  rpm_limit: number;
}

/** Bloco da plataforma em `image_api_config.json` (`ImagePlatformConfig`, 5 campos). */
export interface ConfiguracaoImagemPlataforma {
  enabled: boolean;
  default_width: number;
  default_height: number;
  default_guidance_scale: number;
  default_steps: number;
}

/** Conteúdo de `image_api_config.json` (`ImageApiConfig`); cada bloco tem valor padrão. */
export interface ConfiguracaoApiImagem {
  openai?: ConfiguracaoImagemOpenAI;
  gemini?: ConfiguracaoImagemGemini;
  platform?: ConfiguracaoImagemPlataforma;
}

/**
 * Imagem salva no projeto. Os campos são inferidos dos filtros de busca (`search_images`:
 * texto do prompt, tags e status); o formato real fica pendente.
 */
export interface ImagemProjeto {
  id: string;
  prompt?: string;
  tags?: string[];
  status?: string;
}
