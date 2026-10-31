/**
 * Formato dos arquivos `*.json` locais da pasta de dados (`docs/inventario/arquivos-locais.md`).
 * Os nomes de campo são os do original. Tipos que já existem em outros arquivos são reexportados
 * daqui, para que quem leia os arquivos locais encontre tudo num lugar só.
 */

import type { ArquivoEntidades, ArquivoGrafo, GrafoComunidades } from './tipos-grafo';
import type { ConfiguracaoApiImagem } from './tipos-imagem';
import type {
  ArquivoIdentificacaoAparelho,
  CredenciaisClienteOAuth,
  EnvelopeTokensCifrado,
} from './tipos-login';
import type {
  ConfiguracaoEmbedder,
  ConfiguracaoPipelineRag,
  EstadoSincronizacao,
  IndiceVetorial,
} from './tipos-vetores';

export type {
  ArquivoEntidades,
  ArquivoGrafo,
  ArquivoIdentificacaoAparelho,
  ConfiguracaoApiImagem,
  ConfiguracaoEmbedder,
  ConfiguracaoPipelineRag,
  CredenciaisClienteOAuth,
  EnvelopeTokensCifrado,
  EstadoSincronizacao,
  GrafoComunidades,
  IndiceVetorial,
};

/** Estatísticas do projeto; todos os campos são obrigatórios (*inteiros*). */
export interface EstatisticasProjeto {
  article_count: number;
  entity_count: number;
  relation_count: number;
  chunk_count: number;
}

/** Projeto guardado em `projects.json` (`ProjectEntry`, 12 campos). */
export interface ProjetoLocal {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  sync_state?: EstadoSincronizacao;
  stats?: EstatisticasProjeto;
  rag_enabled?: boolean;
  permissions?: string[];
  project_role_slug?: string | null;
  project_role_name?: string | null;
  local_path?: string | null;
}

/** Conteúdo de `projects.json` (`ProjectRegistry`, 1 campo). */
export interface RegistroProjetos {
  projects: ProjetoLocal[];
}

/** Conteúdo de `mcp_config.json`: porta e token do servidor MCP local (*tipos inferidos*). */
export interface ConfiguracaoMcp {
  port: number;
  session_token: string;
}

/** Cliente registrado no OAuth do MCP local (`RegisteredClient`, 4 campos). */
export interface ClienteMcpRegistrado {
  client_id: string;
  client_name?: string;
  redirect_uris: string[];
  created_at: string;
}

/** Token emitido pelo OAuth do MCP local; guarda só o hash (`IssuedToken`, 6 campos). */
export interface TokenMcpEmitido {
  token_hash: string;
  refresh_hash?: string;
  client_id: string;
  scope: string;
  expires_at: string;
  refresh_expires_at: string;
}

/** Conteúdo de `mcp_oauth.json` (`McpOAuthStore`); mapas *inferidos* pela chave. */
export interface ArmazenamentoOAuthMcp {
  clients: Record<string, ClienteMcpRegistrado>;
  tokens: Record<string, TokenMcpEmitido>;
}

/** Conteúdo de `update_config.json` (`UpdateConfig`, 3 campos com padrão). */
export interface ConfiguracaoAtualizacaoArquivo {
  auto_check?: boolean;
  auto_install?: boolean;
  check_interval_minutes?: number;
}

/** Conteúdo de `update_history.json` (`UpdateHistory`, 7 campos). */
export interface HistoricoAtualizacaoArquivo {
  previous_version?: string | null;
  current_version: string;
  updated_at?: string | null;
  channel: string;
  verified: boolean;
  boot_count: number;
  update_required?: boolean;
}

/** Conteúdo de `wsl_config.json` (`WslDismissState`, 2 campos). */
export interface ConfiguracaoWslArquivo {
  dismissed: boolean;
  dismissed_at?: string;
}

/** Mensagem de uma conversa; `role` e `content` são *inferidos*. */
export interface MensagemConversa {
  role: string;
  content: string;
}

/** Conteúdo de `conversations/<id>.json` (`Conversation`, 7 campos). */
export interface ConversaArquivo {
  id: string;
  project_id: string;
  title: string;
  messages: MensagemConversa[];
  created_at: string;
  updated_at: string;
  cli_session_id?: string | null;
}
