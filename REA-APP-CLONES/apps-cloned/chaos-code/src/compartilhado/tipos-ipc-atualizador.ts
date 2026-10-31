/**
 * API do atualizador exposta pelo preload em `window.chaosCode` (canais `atualizador:*`).
 * Comandos do original (`commands::updater`): `check_for_update`, `download_and_install_update`,
 * `cancel_update_download`, `save_pre_update_state` e `get_update_history`; o evento
 * `update-progress` vira `atualizador:progresso`.
 */

import type { ResultadoVerificacaoAtualizacao } from './tipos-atualizador';
import type { HistoricoAtualizacaoArquivo } from './tipos-armazenamento';
import type { RespostaIpc } from './tipos-ipc';

/** Fases do evento de progresso (`Started`, `Progress`, `Finished` do original). */
export type FaseProgressoAtualizacao = 'Started' | 'Progress' | 'Finished';

/** Evento enviado do main para a tela de atualização durante o download. */
export interface EventoProgressoAtualizacao {
  event: FaseProgressoAtualizacao;
  downloaded: number;
  /** 0 quando o servidor não informou o tamanho. */
  total: number;
}

/** Operações do atualizador que a interface pode chamar. */
export interface ApiAtualizador {
  verificarAtualizacao: () => Promise<RespostaIpc<ResultadoVerificacaoAtualizacao>>;
  /** Baixa, confere a assinatura e instala a atualização da última verificação. */
  baixarEInstalarAtualizacao: () => Promise<RespostaIpc<boolean>>;
  cancelarDownloadAtualizacao: () => Promise<RespostaIpc<boolean>>;
  salvarEstadoPreAtualizacao: (versaoAlvo: string) => Promise<RespostaIpc<boolean>>;
  obterHistoricoAtualizacao: () => Promise<RespostaIpc<HistoricoAtualizacaoArquivo | null>>;
  /** Avisa a cada passo do download; devolve a função que cancela o aviso. */
  aoProgredirAtualizacao: (ouvinte: (evento: EventoProgressoAtualizacao) => void) => () => void;
}
