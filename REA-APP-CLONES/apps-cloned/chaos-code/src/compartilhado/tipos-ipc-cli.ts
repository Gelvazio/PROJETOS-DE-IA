/**
 * Tipos da API de CLIs/WSL exposta ao renderer: `check_wsl_status`,
 * `apply_wsl_localhost_forwarding`, `dismiss_wsl_warning`, `get_mcp_command`,
 * listagem/configuração dos CLIs e agentes do Claude Code.
 */

import type { RespostaIpc } from './tipos-ipc';

/** `check_wsl_status` do original. */
export interface StatusWslIpc {
  is_windows: boolean;
  wsl_installed: boolean;
  localhost_forwarding: boolean;
  wslconfig_exists: boolean;
  running_distros: string[];
  dismissed: boolean;
}

/** Resultado de `apply_wsl_localhost_forwarding`. */
export interface ResultadoEncaminhamentoIpc {
  configurado: boolean;
  reiniciado: boolean;
  mensagem: string;
}

/** CLI descoberto na máquina. */
export interface CliDescobertoIpc {
  id: string;
  nomeExibicao: string;
  instalado: boolean;
  caminho: string | null;
  versao?: string;
  agentes?: string[];
}

/** Comandos `mcp add` de um CLI (com token só no main; à interface vai a `exibicao`). */
export interface ComandosMcpIpc {
  cli: string;
  exibicao: string | null;
  semToken: string;
}

/** Resultado da configuração de um CLI. */
export interface ResultadoConfiguracaoCliIpc {
  cli: string;
  arquivo: string;
  backup: string | null;
}

/** API de CLIs/WSL exposta ao renderer. */
export interface ApiCliWsl {
  obterStatusWsl: () => Promise<RespostaIpc<StatusWslIpc>>;
  aplicarEncaminhamentoWsl: () => Promise<RespostaIpc<ResultadoEncaminhamentoIpc>>;
  dispensarAvisoWsl: () => Promise<RespostaIpc<{ dismissed: boolean }>>;
  listarClis: () => Promise<RespostaIpc<CliDescobertoIpc[]>>;
  /** Comandos `mcp add` por CLI (token sempre oculto na resposta). */
  obterComandosMcp: (
    idProjeto: string,
  ) => Promise<RespostaIpc<ComandosMcpIpc[]>>;
  /** Grava a configuração MCP nos CLIs na pasta do projeto. */
  configurarClis: (idProjeto: string) => Promise<RespostaIpc<ResultadoConfiguracaoCliIpc[]>>;
}
