/**
 * API de projetos exposta pelo preload em `window.chaosCode` (canais `projetos:*`).
 */

import type { ProjetoLocal } from './tipos-armazenamento';
import type { RespostaIpc } from './tipos-ipc';

/** Dados para criar um projeto. */
export interface DadosNovoProjetoIpc {
  name: string;
  description?: string | null;
}

/** Operações de projetos que a interface pode chamar. */
export interface ApiProjetos {
  listarProjetos: () => Promise<RespostaIpc<ProjetoLocal[]>>;
  abrirProjeto: (id: string) => Promise<RespostaIpc<ProjetoLocal | null>>;
  criarProjeto: (dados: DadosNovoProjetoIpc) => Promise<RespostaIpc<ProjetoLocal>>;
  renomearProjeto: (id: string, nome: string) => Promise<RespostaIpc<ProjetoLocal>>;
  removerProjeto: (id: string) => Promise<RespostaIpc<boolean>>;
  obterProjetoAtivo: () => Promise<RespostaIpc<ProjetoLocal | null>>;
  /** `null` deixa a aplicação sem projeto ativo. */
  definirProjetoAtivo: (id: string | null) => Promise<RespostaIpc<ProjetoLocal | null>>;
  /** Avisa a cada mudança do projeto ativo; devolve a função que cancela o aviso. */
  aoMudarProjetoAtivo: (ouvinte: (projeto: ProjetoLocal | null) => void) => () => void;
}
