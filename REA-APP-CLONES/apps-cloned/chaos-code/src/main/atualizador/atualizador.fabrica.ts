/**
 * Monta o `ServicoAtualizador` com as dependências reais (disco, instalador e pasta de dados).
 * Fica separado do serviço para o serviço continuar testável com dependências falsas.
 */

import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { obterCaminhosGlobais } from '../armazenamento/caminhos';
import { ServicoAtualizador } from './atualizador.servico';

const EVENTO_INSTALADOR_FECHADO = 'close';
const EVENTO_INSTALADOR_ERRO = 'error';
const CODIGO_SUCESSO = 0;
const MSG_INSTALADOR_FALHOU = 'O instalador da atualização terminou com erro (código';

/** Opções para montar o serviço real. */
export interface OpcoesFabricaAtualizador {
  /** Pasta de dados do app (`obterPastaDados`). */
  pastaDados: string;
  /** Versão do app em execução. */
  versaoAtual: string;
  /** Pasta onde o instalador baixado é gravado. */
  pastaDownload: string;
  /** Pacote MSIX (`process.windowsStore`): não atualiza sozinho. */
  ehMsix: boolean;
}

/**
 * Roda o instalador e espera ele terminar.
 * @param {string} caminho - Arquivo do instalador.
 * @param {string[]} argumentos - Argumentos (ex.: `/S`).
 * @returns {Promise<void>} Resolve com código 0.
 * @throws {Error} Se o processo não abrir ou terminar com código diferente de 0.
 */
function executarInstalador(caminho: string, argumentos: string[]): Promise<void> {
  return new Promise((resolver, rejeitar) => {
    const processo = spawn(caminho, argumentos, { stdio: 'ignore', windowsHide: true });
    processo.on(EVENTO_INSTALADOR_ERRO, rejeitar);
    processo.on(EVENTO_INSTALADOR_FECHADO, (codigo) => {
      if (codigo === CODIGO_SUCESSO) resolver();
      else rejeitar(new Error(`${MSG_INSTALADOR_FALHOU} ${codigo})`));
    });
  });
}

/**
 * Grava o instalador, criando a pasta de download se faltar.
 * @param {string} caminho - Arquivo de destino.
 * @param {Uint8Array} conteudo - Bytes do instalador.
 * @returns {Promise<void>} Resolve quando o arquivo estiver gravado.
 */
async function gravarInstalador(caminho: string, conteudo: Uint8Array): Promise<void> {
  await mkdir(path.dirname(caminho), { recursive: true });
  await writeFile(caminho, conteudo);
}

/**
 * Cria o serviço do atualizador com disco, instalador e histórico reais.
 * @param {OpcoesFabricaAtualizador} opcoes - Pasta de dados, versão, pasta de download e MSIX.
 * @returns {ServicoAtualizador} Serviço pronto para os canais.
 */
export function criarServicoAtualizador(opcoes: OpcoesFabricaAtualizador): ServicoAtualizador {
  const caminhos = obterCaminhosGlobais(opcoes.pastaDados);
  return new ServicoAtualizador({
    versaoAtual: opcoes.versaoAtual,
    historico: { caminhoArquivo: caminhos.historicoAtualizacao },
    instalacao: {
      pastaDownload: opcoes.pastaDownload,
      gravarArquivo: gravarInstalador,
      removerArquivo: (caminho) => rm(caminho, { force: true }),
      executarInstalador,
      ehMsix: opcoes.ehMsix,
    },
  });
}
