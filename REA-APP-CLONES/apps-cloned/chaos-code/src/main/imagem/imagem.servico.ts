/**
 * Serviço de imagem: junta a configuração `image_api_config.json` (chaves no cofre cifrado), a
 * geração pelo Gemini local e a gravação da imagem no projeto. A configuração que sai daqui para
 * a interface tem as chaves mascaradas. Cofre, disco e rede são injetados.
 */

import type {
  ConfiguracaoApiImagem,
  ConfiguracaoImagemGemini,
  ConfiguracaoImagemOpenAI,
} from '../../compartilhado/tipos-imagem';
import type {
  PedidoGerarImagemIpc,
  ResultadoGerarImagemIpc,
} from '../../compartilhado/tipos-ipc-imagem';
import {
  criarSistemaArquivosNode,
  gravarJson,
  lerJson,
  type SistemaArquivos,
} from '../armazenamento/arquivo-json';
import { obterCaminhosGlobais } from '../armazenamento/caminhos';
import {
  mascararChave,
  preencherChavesImagem,
  separarChavesImagem,
  type CofreChavesProvedores,
} from '../vetores/chaves-provedores';
import { gerarImagemGemini, type BuscadorHttpImagem } from './gemini-imagem';
import {
  criarDependenciasGravacaoNode,
  gravarImagemNoProjeto,
  type DependenciasGravacaoImagem,
} from './gravar-imagem';

/** Prefixo da máscara de `mascararChave`: chave que volta da tela com ele não foi alterada. */
const PREFIXO_MASCARA = '••••';
const CHAVE_VAZIA = '';

/** Dependências do serviço de imagem. */
export interface DependenciasServicoImagem {
  /** Pasta de dados (`obterPastaDados`). */
  pastaDados: string;
  cofre: CofreChavesProvedores;
  /** `fetch` injetado para o Gemini. */
  buscar: BuscadorHttpImagem;
  /** Acesso a arquivos do JSON de configuração (padrão: `node:fs`). */
  arquivos?: SistemaArquivos;
  /** Gravação da imagem (padrão: `node:fs/promises`). */
  gravacao?: DependenciasGravacaoImagem;
}

/**
 * Troca a chave de um bloco pela versão mascarada.
 * @param {T} bloco - Bloco `openai` ou `gemini` da configuração.
 * @returns {T} Cópia com `api_key` mascarada (vazia continua vazia).
 */
function mascararBloco<T extends ConfiguracaoImagemOpenAI | ConfiguracaoImagemGemini>(
  bloco: T,
): T {
  return { ...bloco, api_key: bloco.api_key ? mascararChave(bloco.api_key) : CHAVE_VAZIA };
}

/**
 * Mascara as chaves da configuração, para ela poder ir à interface.
 * @param {ConfiguracaoApiImagem} config - Configuração completa (só no processo principal).
 * @returns {ConfiguracaoApiImagem} Cópia com as chaves mascaradas.
 */
export function mascararConfiguracaoImagem(config: ConfiguracaoApiImagem): ConfiguracaoApiImagem {
  const mascarada: ConfiguracaoApiImagem = { ...config };
  if (config.openai) mascarada.openai = mascararBloco(config.openai);
  if (config.gemini) mascarada.gemini = mascararBloco(config.gemini);
  return mascarada;
}

/**
 * Esvazia as chaves que ainda estão mascaradas (a interface devolveu o que recebeu), para elas
 * não substituírem a chave guardada no cofre.
 * @param {ConfiguracaoApiImagem} config - Configuração recebida da interface.
 * @returns {ConfiguracaoApiImagem} Cópia sem as chaves mascaradas.
 */
export function descartarChavesMascaradas(config: ConfiguracaoApiImagem): ConfiguracaoApiImagem {
  const limpa: ConfiguracaoApiImagem = { ...config };
  const eMascara = (chave: string): boolean => chave.startsWith(PREFIXO_MASCARA);
  if (config.openai) {
    const chave = eMascara(config.openai.api_key) ? CHAVE_VAZIA : config.openai.api_key;
    limpa.openai = { ...config.openai, api_key: chave };
  }
  if (config.gemini) {
    const chave = eMascara(config.gemini.api_key) ? CHAVE_VAZIA : config.gemini.api_key;
    limpa.gemini = { ...config.gemini, api_key: chave };
  }
  return limpa;
}

/** Operações de imagem usadas pelos canais IPC. */
export class ServicoImagem {
  private readonly arquivos: SistemaArquivos;
  private readonly caminhoConfiguracao: string;

  /**
   * @param {DependenciasServicoImagem} dependencias - Pasta de dados, cofre, rede e disco.
   */
  constructor(private readonly dependencias: DependenciasServicoImagem) {
    this.arquivos = dependencias.arquivos ?? criarSistemaArquivosNode();
    this.caminhoConfiguracao = obterCaminhosGlobais(dependencias.pastaDados).configImagem;
  }

  /**
   * Lê a configuração do disco e devolve com as chaves do cofre (só para uso interno).
   * @returns {Promise<ConfiguracaoApiImagem>} Configuração completa.
   * @throws {ErroArquivoJson} Se o arquivo estiver quebrado e sem cópia boa.
   */
  private async lerConfiguracaoCompleta(): Promise<ConfiguracaoApiImagem> {
    const caminho = this.caminhoConfiguracao;
    const doDisco = await lerJson<ConfiguracaoApiImagem>(caminho, {}, this.arquivos);
    return preencherChavesImagem(doDisco, this.dependencias.cofre);
  }

  /**
   * Configuração de imagem para a tela, com as chaves mascaradas.
   * @returns {Promise<ConfiguracaoApiImagem>} Configuração mascarada.
   */
  async obterConfiguracao(): Promise<ConfiguracaoApiImagem> {
    return mascararConfiguracaoImagem(await this.lerConfiguracaoCompleta());
  }

  /**
   * Guarda a configuração: chaves novas vão para o cofre, o resto para o JSON sem chaves.
   * @param {ConfiguracaoApiImagem} config - Configuração vinda da tela.
   * @returns {Promise<ConfiguracaoApiImagem>} Configuração salva, mascarada.
   * @throws {ErroCofreChaves} Se houver chave nova e a cifragem estiver indisponível.
   */
  async definirConfiguracao(config: ConfiguracaoApiImagem): Promise<ConfiguracaoApiImagem> {
    const nova = descartarChavesMascaradas(config);
    const semChaves = await separarChavesImagem(nova, this.dependencias.cofre);
    await gravarJson(this.caminhoConfiguracao, semChaves, this.arquivos);
    return this.obterConfiguracao();
  }

  /**
   * Gera a imagem pelo Gemini local e grava na pasta do projeto.
   * @param {PedidoGerarImagemIpc} pedido - Projeto, prompt, proporção e nome opcionais.
   * @returns {Promise<ResultadoGerarImagemIpc>} Onde a imagem ficou (sem o base64).
   * @throws {Error} Se a chave faltar, a API falhar ou a gravação for recusada.
   */
  async gerar(pedido: PedidoGerarImagemIpc): Promise<ResultadoGerarImagemIpc> {
    const config = await this.lerConfiguracaoCompleta();
    const imagem = await gerarImagemGemini(
      config.gemini,
      { prompt: pedido.prompt, proporcao: pedido.proporcao },
      { buscar: this.dependencias.buscar },
    );
    const gravada = await gravarImagemNoProjeto(
      {
        pastaDados: this.dependencias.pastaDados,
        idProjeto: pedido.idProjeto,
        imagem,
        nomeArquivo: pedido.nomeArquivo,
      },
      this.dependencias.gravacao ?? criarDependenciasGravacaoNode(),
    );
    return { ...gravada, texto: imagem.texto, provedor: imagem.provedor };
  }
}
