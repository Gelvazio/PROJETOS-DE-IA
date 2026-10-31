/**
 * Histórico de atualizações (`update_history.json`, `UpdateHistory`): o app grava o estado antes
 * de instalar (`save_pre_update_state`) e apaga o arquivo depois de confirmar a versão nova
 * (docs/inventario/arquivos-locais.md e imagem-atualizador.md). *(Escolha do clone)*: a cada
 * abertura sem a versão nova em execução, `boot_count` sobe, para a tela saber que a instalação
 * não pegou.
 */

import type { HistoricoAtualizacaoArquivo } from '../../compartilhado/tipos-armazenamento';
import {
  criarSistemaArquivosNode,
  gravarJson,
  lerJson,
  type SistemaArquivos,
} from '../armazenamento/arquivo-json';

const CANAL_PADRAO = 'stable';
const CONTAGEM_INICIAL_ABERTURAS = 0;
const INCREMENTO_ABERTURAS = 1;

/** Onde e como o histórico é lido e gravado; tudo injetável. */
export interface DependenciasHistorico {
  /** Caminho do `update_history.json` (`obterCaminhosGlobais(...).historicoAtualizacao`). */
  caminhoArquivo: string;
  /** Acesso a arquivos (padrão: `node:fs`). */
  arquivos?: SistemaArquivos;
  /** Relógio (padrão: `new Date()`). */
  agora?: () => Date;
}

/** Dados do estado gravado antes de instalar. */
export interface EstadoPreAtualizacao {
  /** Versão instalada agora. */
  versaoAtual: string;
  /** Versão que será instalada (`targetVersion`). */
  versaoAlvo: string;
  /** Canal de atualização (padrão: `stable`). */
  canal?: string;
}

/** Resultado da conferência da versão ao abrir o app. */
export interface ResultadoConfirmacao {
  /** true se a versão em execução é a esperada e o arquivo foi apagado. */
  confirmada: boolean;
  /** Histórico lido antes de apagar ou atualizar; null se não havia arquivo. */
  historico: HistoricoAtualizacaoArquivo | null;
}

/**
 * Lê o histórico gravado.
 * @param {DependenciasHistorico} dependencias - Caminho, arquivos e relógio.
 * @returns {Promise<HistoricoAtualizacaoArquivo | null>} O histórico, ou null se não houver.
 * @throws {ErroArquivoJson} Se o arquivo estiver quebrado e sem cópia boa.
 */
export async function lerHistoricoAtualizacao(
  dependencias: DependenciasHistorico,
): Promise<HistoricoAtualizacaoArquivo | null> {
  const arquivos = dependencias.arquivos ?? criarSistemaArquivosNode();
  return lerJson<HistoricoAtualizacaoArquivo | null>(dependencias.caminhoArquivo, null, arquivos);
}

/**
 * Grava o estado antes de instalar a atualização (`save_pre_update_state`).
 * @param {EstadoPreAtualizacao} estado - Versão atual, versão alvo e canal.
 * @param {DependenciasHistorico} dependencias - Caminho, arquivos e relógio.
 * @returns {Promise<HistoricoAtualizacaoArquivo>} O histórico gravado.
 * @throws {ErroArquivoJson} Se a gravação falhar.
 */
export async function salvarEstadoPreAtualizacao(
  estado: EstadoPreAtualizacao,
  dependencias: DependenciasHistorico,
): Promise<HistoricoAtualizacaoArquivo> {
  const arquivos = dependencias.arquivos ?? criarSistemaArquivosNode();
  const agora = dependencias.agora ?? (() => new Date());
  const historico: HistoricoAtualizacaoArquivo = {
    previous_version: estado.versaoAtual,
    current_version: estado.versaoAlvo,
    updated_at: agora().toISOString(),
    channel: estado.canal ?? CANAL_PADRAO,
    verified: false,
    boot_count: CONTAGEM_INICIAL_ABERTURAS,
    update_required: false,
  };
  await gravarJson(dependencias.caminhoArquivo, historico, arquivos);
  return historico;
}

/**
 * Confere, ao abrir o app, se a versão em execução é a gravada como alvo. Se for, apaga o
 * arquivo ("update_history.json removido"); se não, conta mais uma abertura.
 * @param {string} versaoEmExecucao - Versão do app que está rodando.
 * @param {DependenciasHistorico} dependencias - Caminho, arquivos e relógio.
 * @returns {Promise<ResultadoConfirmacao>} Se confirmou e o histórico lido.
 * @throws {ErroArquivoJson} Se o arquivo estiver quebrado ou a gravação falhar.
 */
export async function confirmarVersaoAtualizada(
  versaoEmExecucao: string,
  dependencias: DependenciasHistorico,
): Promise<ResultadoConfirmacao> {
  const arquivos = dependencias.arquivos ?? criarSistemaArquivosNode();
  const historico = await lerHistoricoAtualizacao({ ...dependencias, arquivos });
  if (historico === null) return { confirmada: false, historico: null };

  if (historico.current_version === versaoEmExecucao) {
    await arquivos.remover(dependencias.caminhoArquivo);
    return { confirmada: true, historico: { ...historico, verified: true } };
  }

  const contado = { ...historico, boot_count: historico.boot_count + INCREMENTO_ABERTURAS };
  await gravarJson(dependencias.caminhoArquivo, contado, arquivos);
  return { confirmada: false, historico: contado };
}
