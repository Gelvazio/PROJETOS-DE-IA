/**
 * Canais IPC de imagem (`imagem:*`): tratadores finos que validam a entrada e chamam o
 * `ServicoImagem`. A configuração que volta para a interface tem as chaves mascaradas.
 */

import { CANAIS_IPC } from '../../compartilhado/constantes';
import type { ConfiguracaoApiImagem } from '../../compartilhado/tipos-imagem';
import type { PedidoGerarImagemIpc } from '../../compartilhado/tipos-ipc-imagem';
import {
  exigirObjeto,
  exigirTexto,
  registrarCanalSeguro,
  type IpcMainMinimo,
  type TratadorCanal,
} from '../ipc/ipc-comum';
import type { ServicoImagem } from './imagem.servico';

const BLOCOS_COM_CHAVE = ['openai', 'gemini'] as const;
const MSG_PROPORCAO_INVALIDA = 'Campo "proporcao" deve ser um texto';
const MSG_NOME_INVALIDO = 'Campo "nomeArquivo" deve ser um texto';

/**
 * Valida a configuração de imagem vinda da interface (blocos com chave precisam de `api_key`
 * em texto).
 * @param {unknown} bruto - Argumento recebido.
 * @returns {ConfiguracaoApiImagem} A configuração.
 * @throws {Error} Se o formato estiver errado.
 */
function lerConfiguracaoImagem(bruto: unknown): ConfiguracaoApiImagem {
  const config = exigirObjeto(bruto, 'configuracao');
  for (const bloco of BLOCOS_COM_CHAVE) {
    if (config[bloco] === undefined) continue;
    exigirTexto(exigirObjeto(config[bloco], bloco).api_key, `${bloco}.api_key`);
  }
  return config as ConfiguracaoApiImagem;
}

/**
 * Valida o pedido de geração de imagem.
 * @param {unknown} bruto - Argumento recebido.
 * @returns {PedidoGerarImagemIpc} Pedido validado.
 * @throws {Error} Se algum campo tiver o tipo errado.
 */
function lerPedidoGerarImagem(bruto: unknown): PedidoGerarImagemIpc {
  const dados = exigirObjeto(bruto, 'pedido');
  if (dados.proporcao !== undefined && typeof dados.proporcao !== 'string') {
    throw new Error(MSG_PROPORCAO_INVALIDA);
  }
  if (dados.nomeArquivo !== undefined && typeof dados.nomeArquivo !== 'string') {
    throw new Error(MSG_NOME_INVALIDO);
  }
  return {
    idProjeto: exigirTexto(dados.idProjeto, 'idProjeto'),
    prompt: exigirTexto(dados.prompt, 'prompt'),
    proporcao: dados.proporcao as PedidoGerarImagemIpc['proporcao'],
    nomeArquivo: dados.nomeArquivo as string | undefined,
  };
}

/**
 * Monta o mapa canal → tratador das operações de imagem.
 * @param {ServicoImagem} servico - Serviço de imagem.
 * @returns {Record<string, TratadorCanal>} Tratadores por nome de canal.
 */
function montarTratadores(servico: ServicoImagem): Record<string, TratadorCanal> {
  return {
    [CANAIS_IPC.imagemObterConfiguracao]: () => servico.obterConfiguracao(),
    [CANAIS_IPC.imagemDefinirConfiguracao]: (config) =>
      servico.definirConfiguracao(lerConfiguracaoImagem(config)),
    [CANAIS_IPC.imagemGerar]: (pedido) => servico.gerar(lerPedidoGerarImagem(pedido)),
  };
}

/**
 * Registra os canais de imagem.
 * @param {IpcMainMinimo} ipc - `ipcMain` (ou um falso).
 * @param {ServicoImagem} servico - Serviço de imagem.
 * @returns {void}
 */
export function registrarCanaisImagem(ipc: IpcMainMinimo, servico: ServicoImagem): void {
  for (const [canal, tratador] of Object.entries(montarTratadores(servico))) {
    registrarCanalSeguro(ipc, canal, tratador);
  }
}
