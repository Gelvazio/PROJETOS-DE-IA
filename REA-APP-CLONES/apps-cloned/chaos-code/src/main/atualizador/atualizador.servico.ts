/**
 * Serviço do atualizador: junta verificar, instalar e histórico (CLONE.12.3, 12.5 e 12.6) para
 * os canais IPC. Guarda em memória o último resultado da verificação (o renderer não manda a
 * URL nem a assinatura: só o main sabe o que foi verificado) e o download em andamento.
 * Rede, disco, instalador e histórico entram por dependências.
 */

import type { HistoricoAtualizacaoArquivo } from '../../compartilhado/tipos-armazenamento';
import type { ResultadoVerificacaoAtualizacao } from '../../compartilhado/tipos-atualizador';
import type { EventoProgressoAtualizacao } from '../../compartilhado/tipos-ipc-atualizador';
import {
  confirmarVersaoAtualizada,
  lerHistoricoAtualizacao,
  salvarEstadoPreAtualizacao,
  type DependenciasHistorico,
  type ResultadoConfirmacao,
} from './historico';
import {
  baixarEInstalarAtualizacao,
  type DependenciasInstalacao,
  type ProgressoDownload,
} from './instalar';
import { verificarAtualizacao, type OpcoesVerificacao } from './verificar';

const MSG_SEM_VERIFICACAO = 'Verifique se há atualização antes de instalar.';
const MSG_JA_INSTALANDO = 'Já existe uma atualização sendo baixada.';

/** Ouvinte dos eventos de progresso. */
export type OuvinteProgresso = (evento: EventoProgressoAtualizacao) => void;

/** Dependências do serviço. */
export interface DependenciasServicoAtualizador {
  /** Versão do app em execução. */
  versaoAtual: string;
  historico: DependenciasHistorico;
  /** Tudo o que o instalador precisa, menos progresso e cancelamento (o serviço cuida). */
  instalacao: Omit<DependenciasInstalacao, 'historico' | 'aoProgredir' | 'sinalCancelamento'>;
  /** Opções da verificação (rede, endereço, plataforma). */
  verificacao?: OpcoesVerificacao;
}

/** Operações do atualizador usadas pelos canais. */
export class ServicoAtualizador {
  private ultimaVerificacao: ResultadoVerificacaoAtualizacao | null = null;
  private controleDownload: AbortController | null = null;
  private readonly ouvintes = new Set<OuvinteProgresso>();

  /** @param {DependenciasServicoAtualizador} dependencias - Versão, histórico e instalação. */
  constructor(private readonly dependencias: DependenciasServicoAtualizador) {}

  /**
   * Consulta o `latest.json` e guarda o resultado para a instalação.
   * @returns {Promise<ResultadoVerificacaoAtualizacao>} Resultado da verificação.
   * @throws {Error} Em falha de rede, tempo esgotado ou manifesto inválido.
   */
  async verificar(): Promise<ResultadoVerificacaoAtualizacao> {
    const { versaoAtual, verificacao } = this.dependencias;
    this.ultimaVerificacao = await verificarAtualizacao(versaoAtual, verificacao);
    return this.ultimaVerificacao;
  }

  /**
   * Baixa, confere a assinatura e instala a atualização da última verificação, avisando o
   * progresso (`Started`, `Progress`, `Finished`). `Finished` sai mesmo se a instalação falhar.
   * @returns {Promise<boolean>} true quando o instalador terminou.
   * @throws {Error} Sem verificação prévia, download em andamento ou falha do fluxo.
   */
  async baixarEInstalar(): Promise<boolean> {
    if (!this.ultimaVerificacao) throw new Error(MSG_SEM_VERIFICACAO);
    if (this.controleDownload) throw new Error(MSG_JA_INSTALANDO);

    const controle = new AbortController();
    this.controleDownload = controle;
    this.avisar({ event: 'Started', downloaded: 0, total: 0 });
    try {
      await baixarEInstalarAtualizacao(this.ultimaVerificacao, {
        ...this.dependencias.instalacao,
        historico: this.dependencias.historico,
        aoProgredir: (progresso) => this.avisarProgresso(progresso),
        sinalCancelamento: controle.signal,
      });
      return true;
    } finally {
      this.controleDownload = null;
      this.avisar({ event: 'Finished', downloaded: 0, total: 0 });
    }
  }

  /**
   * Cancela o download em andamento.
   * @returns {boolean} true se havia um download para cancelar.
   */
  cancelarDownload(): boolean {
    if (!this.controleDownload) return false;
    this.controleDownload.abort();
    return true;
  }

  /**
   * Grava o estado antes de instalar (`save_pre_update_state`).
   * @param {string} versaoAlvo - Versão que será instalada.
   * @returns {Promise<boolean>} true quando o arquivo foi gravado.
   */
  async salvarEstadoPre(versaoAlvo: string): Promise<boolean> {
    const estado = { versaoAtual: this.dependencias.versaoAtual, versaoAlvo };
    await salvarEstadoPreAtualizacao(estado, this.dependencias.historico);
    return true;
  }

  /**
   * Lê o histórico gravado (`get_update_history`).
   * @returns {Promise<HistoricoAtualizacaoArquivo | null>} Histórico, ou null se não houver.
   */
  obterHistorico(): Promise<HistoricoAtualizacaoArquivo | null> {
    return lerHistoricoAtualizacao(this.dependencias.historico);
  }

  /**
   * Confere, ao abrir o app, se a versão nova entrou (apaga o histórico se sim).
   * @returns {Promise<ResultadoConfirmacao>} Se confirmou e o histórico lido.
   */
  confirmarNaAbertura(): Promise<ResultadoConfirmacao> {
    return confirmarVersaoAtualizada(this.dependencias.versaoAtual, this.dependencias.historico);
  }

  /**
   * Registra um ouvinte do progresso do download.
   * @param {OuvinteProgresso} ouvinte - Função chamada a cada evento.
   * @returns {() => void} Função que remove o ouvinte.
   */
  aoProgredir(ouvinte: OuvinteProgresso): () => void {
    this.ouvintes.add(ouvinte);
    return () => {
      this.ouvintes.delete(ouvinte);
    };
  }

  private avisarProgresso(progresso: ProgressoDownload): void {
    this.avisar({ event: 'Progress', ...progresso });
  }

  private avisar(evento: EventoProgressoAtualizacao): void {
    this.ouvintes.forEach((ouvinte) => ouvinte(evento));
  }
}
