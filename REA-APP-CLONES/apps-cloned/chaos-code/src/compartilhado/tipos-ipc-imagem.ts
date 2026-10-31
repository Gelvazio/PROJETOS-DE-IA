/**
 * API de imagem exposta pelo preload em `window.chaosCode` (canais `imagem:*`). A chave de API
 * nunca vai inteira para a interface: ela recebe a chave mascarada (`••••` + 4 últimos).
 */

import type { ConfiguracaoApiImagem, ProporcaoImagem } from './tipos-imagem';
import type { RespostaIpc } from './tipos-ipc';

/** Pedido de geração de imagem pelo Gemini local. */
export interface PedidoGerarImagemIpc {
  /** Projeto onde a imagem é gravada. */
  idProjeto: string;
  /** Texto descritivo da imagem. */
  prompt: string;
  proporcao?: ProporcaoImagem;
  /** Nome do arquivo com extensão; sem valor, o nome é gerado. */
  nomeArquivo?: string;
}

/** Imagem gerada e gravada (o conteúdo fica no disco, não vai para a interface). */
export interface ResultadoGerarImagemIpc {
  caminho: string;
  nomeArquivo: string;
  mimeType: string;
  tamanhoBytes: number;
  /** Texto que o Gemini mandou junto, se houver. */
  texto: string | null;
  /** Origem da imagem (`gemini_local`). */
  provedor: string;
}

/** Operações de imagem que a interface pode chamar. */
export interface ApiImagem {
  /** Lê `image_api_config.json` com as chaves mascaradas. */
  obterConfiguracaoImagem: () => Promise<RespostaIpc<ConfiguracaoApiImagem>>;
  /**
   * Grava a configuração. Chave vazia ou ainda mascarada mantém a que já está guardada.
   * Devolve a configuração salva, mascarada.
   */
  definirConfiguracaoImagem: (
    configuracao: ConfiguracaoApiImagem,
  ) => Promise<RespostaIpc<ConfiguracaoApiImagem>>;
  gerarImagem: (pedido: PedidoGerarImagemIpc) => Promise<RespostaIpc<ResultadoGerarImagemIpc>>;
}
