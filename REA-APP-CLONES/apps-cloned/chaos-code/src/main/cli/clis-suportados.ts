/**
 * CLIs de IA que recebem a configuração do servidor MCP local (`docs/inventario/mcp-cli-wsl.md`,
 * seções "Configuração nos CLIs" e "Comandos mostrados ao usuário"). Só dados.
 * Os marcadores `<nome>`, `<url>`, `<token>` e `<porta>` são trocados por quem usa o molde.
 */

/** Formato do arquivo de configuração do CLI. */
export type FormatoConfigCli = 'json' | 'toml';

/** Moldes do comando `mcp add` mostrados ao usuário, por CLI. */
export interface MoldesComandoCli {
  /** Comando com o token de sessão do MCP (`get_mcp_command`). */
  comToken?: string;
  /** Mesmo comando, para exibir na tela com o token oculto (`[TOKEN]`). */
  exibicao?: string;
  /** Comando sem token, usado quando o CLI faz OAuth *(inferido)*. */
  semToken: string;
}

/** Definição de um CLI suportado. */
export interface DefinicaoCli {
  /** Rótulo usado pela interface em `projects.mcp.clis`. */
  id: 'claude' | 'gemini' | 'codex';
  nomeExibicao: string;
  /** Nome do executável, tirado do comando mostrado ao usuário *(inferido)*. */
  executavel: string;
  /** Arquivo de configuração, na pasta local do projeto. */
  arquivoConfiguracao: string;
  formato: FormatoConfigCli;
  /** Chave onde fica o servidor MCP dentro do arquivo. */
  chaveServidor: string;
  /** Molde da entrada do servidor no arquivo; `<nome>`, `<url>` e `<token>` são marcadores. */
  moldeEntradaServidor: string;
  moldes: MoldesComandoCli;
}

/** Lista dos CLIs suportados, na ordem do inventário. */
export const CLIS_SUPORTADOS: readonly DefinicaoCli[] = [
  {
    id: 'claude',
    nomeExibicao: 'Claude Code',
    executavel: 'claude',
    arquivoConfiguracao: '.mcp.json',
    formato: 'json',
    chaveServidor: 'mcpServers',
    moldeEntradaServidor:
      '{ "mcpServers": { "<nome>": { "type": "http", "url": "<url>", ' +
      '"headers": { "Authorization": "Bearer <token>" } } } }',
    moldes: {
      comToken:
        'claude mcp add -t http -H "X-MCP-Session-Token: <token>" -s project <nome> ' +
        'http://localhost:<porta>/mcp/<project_id>',
      exibicao:
        'claude mcp add -t http -H "X-MCP-Session-Token: [TOKEN]" -s project <nome> <url>',
      semToken: 'claude mcp add -t http -s project <nome> <url>',
    },
  },
  {
    id: 'gemini',
    nomeExibicao: 'Gemini CLI',
    executavel: 'gemini',
    arquivoConfiguracao: '.gemini/settings.json',
    formato: 'json',
    chaveServidor: 'mcpServers',
    // A entrada é a mesma do Claude Code, mas a chave da URL não foi comprovada *(inferido)*.
    moldeEntradaServidor:
      '{ "mcpServers": { "<nome>": { "type": "http", "url": "<url>", ' +
      '"headers": { "Authorization": "Bearer <token>" } } } }',
    moldes: {
      semToken: 'gemini mcp add --transport http <nome> <url>',
    },
  },
  {
    id: 'codex',
    nomeExibicao: 'Codex',
    executavel: 'codex',
    arquivoConfiguracao: '.codex/config.toml',
    formato: 'toml',
    chaveServidor: 'mcp_servers',
    moldeEntradaServidor:
      '[mcp_servers.<nome>]\n' +
      'url = "<url>"\n' +
      'http_headers = { Authorization = "Bearer <token>" }',
    moldes: {
      semToken: 'codex mcp add <nome> --url <url>',
    },
  },
];
