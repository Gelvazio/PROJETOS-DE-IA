/**
 * Constantes do clone do Chaos Code, num lugar só (main, preload e renderer importam daqui).
 */

export const NOME_APLICATIVO = 'Chaos Code';

export const VERSAO_APLICATIVO = '0.1.0';

/**
 * Endereço do servidor do clone: o servidor Python local de `server/` (tarefa SERVIDOR), no lugar
 * do chaoscode.ai. Não há client_id fixo: o clone se registra em /api/oauth/register. Pode ser
 * trocado pela variável de ambiente abaixo sem recompilar.
 */
export const URL_SERVIDOR_PADRAO = 'http://localhost:3000';

export const VARIAVEL_AMBIENTE_SERVIDOR = 'CHAOS_CODE_SERVIDOR';

/**
 * Endereço do `latest.json` do atualizador, derivado do servidor do clone.
 * Valor provisório: muda junto com o servidor definido na CLONE.4.1.
 */
export const URL_ATUALIZACAO = `${URL_SERVIDOR_PADRAO}/releases/latest.json`;

/**
 * Chave pública minisign usada para conferir a assinatura da atualização.
 * Valor provisório: é um marcador, não uma chave real; deve ser trocado pela chave do
 * servidor antes da CLONE.12.4 funcionar de verdade.
 */
export const CHAVE_PUBLICA_ATUALIZACAO = 'CHAVE_PUBLICA_ATUALIZACAO_PROVISORIA';

export const JANELA_LARGURA = 1280;

export const JANELA_ALTURA = 800;

export const JANELA_LARGURA_MINIMA = 900;

export const JANELA_ALTURA_MINIMA = 600;

export const ARQUIVO_TELA_PRINCIPAL = 'index.html';

export const CANAIS_IPC = {
  obterInformacoes: 'aplicativo:obter-informacoes',
  // Projetos (CLONE.3.7)
  projetosListar: 'projetos:listar',
  projetosAbrir: 'projetos:abrir',
  projetosCriar: 'projetos:criar',
  projetosRenomear: 'projetos:renomear',
  projetosRemover: 'projetos:remover',
  projetosObterAtivo: 'projetos:obter-ativo',
  projetosDefinirAtivo: 'projetos:definir-ativo',
  /** Evento do main para a interface (não é `handle`). */
  projetosAtivoMudou: 'projetos:ativo-mudou',
  // Atualizador (CLONE.12.7)
  atualizadorVerificar: 'atualizador:verificar',
  atualizadorInstalar: 'atualizador:instalar',
  atualizadorCancelar: 'atualizador:cancelar',
  atualizadorSalvarEstado: 'atualizador:salvar-estado',
  atualizadorObterHistorico: 'atualizador:obter-historico',
  /** Evento do main para a interface (`update-progress` do original). */
  atualizadorProgresso: 'atualizador:progresso',
  // Imagem (CLONE.11.4)
  imagemObterConfiguracao: 'imagem:obter-configuracao',
  imagemDefinirConfiguracao: 'imagem:definir-configuracao',
  imagemGerar: 'imagem:gerar',
  // Login (CLONE.4.12): nenhum canal devolve token à interface.
  loginObterEstado: 'login:obter-estado',
  loginEntrar: 'login:entrar',
  loginSair: 'login:sair',
  loginRenovar: 'login:renovar',
  /** Evento do main para a interface (não é `handle`). */
  loginEstadoMudou: 'login:estado-mudou',
  // Vetores / indexação (CLONE.6.12)
  vetoresIndexar: 'vetores:indexar',
  vetoresCancelar: 'vetores:cancelar',
  vetoresBuscar: 'vetores:buscar',
  vetoresObterStatusRag: 'vetores:obter-status-rag',
  vetoresAlternarRag: 'vetores:alternar-rag',
  /** Evento do main para a interface (`sync-progress` do original). */
  vetoresProgresso: 'vetores:progresso',
  // Grafo / consulta (CLONE.7.11)
  grafoConsultar: 'grafo:consultar',
  grafoBuscarEntidades: 'grafo:buscar-entidades',
  grafoObterDados: 'grafo:obter-dados',
  // MCP (CLONE.8.10)
  mcpObterEstado: 'mcp:obter-estado',
  mcpLigar: 'mcp:ligar',
  mcpDesligar: 'mcp:desligar',
  mcpObterTokenSessao: 'mcp:obter-token-sessao',
  mcpRenovarTokenSessao: 'mcp:renovar-token-sessao',
  mcpResponderConsentimento: 'mcp:responder-consentimento',
  /** Evento do main para a interface (`mcp:consent-request` do original). */
  mcpPedidoConsentimento: 'mcp:consent-request',
} as const;

/** Prefixo dos canais da API da plataforma (`api:<grupo>:<metodo>`, CLONE.5.7). */
export const PREFIXO_CANAL_API = 'api';

/**
 * Métodos de cada API da plataforma expostos ao renderer. O número é a quantidade de primeiros
 * argumentos que devem ser texto (ids); os demais são repassados como vieram.
 */
export const METODOS_API_IPC = {
  projetos: {
    listarProjetos: 0,
    listarFerramentasMcp: 1,
    listarConfigFerramentasMcp: 1,
    atualizarConfigFerramentaMcp: 1,
    listarArtigosWiki: 1,
    obterArtigoWiki: 2,
    criarArtigoWiki: 1,
    atualizarArtigoWiki: 2,
    apagarArtigoWiki: 2,
    restaurarArtigoWiki: 2,
    listarLixeiraWiki: 1,
    listarSincronizacaoWiki: 1,
  },
  tarefas: { listar: 1, obter: 2, criar: 1, atualizar: 2, apagar: 2, restaurar: 2 },
  imagens: { listar: 1, obterStatus: 2, apagar: 2 },
  modelosAgente: { listar: 0 },
} as const;

/**
 * Monta o nome do canal IPC de um método da API da plataforma.
 * @param {string} grupo - Grupo da API (ex.: `projetos`).
 * @param {string} metodo - Nome do método (ex.: `listarProjetos`).
 * @returns {string} Ex.: `api:projetos:listarProjetos`.
 */
export function nomeCanalApi(grupo: string, metodo: string): string {
  return `${PREFIXO_CANAL_API}:${grupo}:${metodo}`;
}

export const NOME_API_PRELOAD = 'chaosCode';

/** Tempo máximo para consultar o `latest.json` (o original usa 15 s). */
export const TEMPO_LIMITE_VERIFICACAO_ATUALIZACAO_MS = 15_000;

/** Nome da plataforma no `latest.json` quando o app roda no Windows 64 bits. */
export const PLATAFORMA_ATUALIZACAO_WINDOWS = 'windows-x86_64';

/* ----------------------------- Login OAuth (CLONE.4.2) ----------------------------- */

/** Rota do registro dinâmico do cliente (`docs/inventario/login.md`). */
export const ROTA_OAUTH_REGISTRO = '/api/oauth/register';

/** Rota da tela de autorização aberta no navegador. */
export const ROTA_OAUTH_CONSENTIMENTO = '/oauth/consent';

/** Rota da troca do código e da renovação do token. */
export const ROTA_OAUTH_TOKEN = '/api/oauth/token';

/** Rota da revogação do token (logout). */
export const ROTA_OAUTH_REVOGACAO = '/api/oauth/revoke';

/** Escopo pedido na autorização. */
export const ESCOPO_OAUTH = 'mcp:read mcp:write';

/** Método do desafio PKCE. */
export const METODO_PKCE = 'S256';

/** Tipo de resposta pedido na autorização. */
export const TIPO_RESPOSTA_OAUTH = 'code';

/** Host do servidor de callback local. */
export const HOST_CALLBACK_OAUTH = '127.0.0.1';

/** Porta do callback: 0 deixa o sistema escolher uma porta livre a cada login. */
export const PORTA_CALLBACK_OAUTH = 0;

/** Caminho do callback local. */
export const CAMINHO_CALLBACK_OAUTH = '/callback';

/** Método de autenticação do cliente no token: cliente público, sem segredo. */
export const METODO_AUTENTICACAO_TOKEN_OAUTH = 'none';

/** Tipo de aplicação enviado no registro do cliente. */
export const TIPO_APLICACAO_OAUTH = 'desktop';

/** Prefixo do `client_name` enviado no registro. */
export const PREFIXO_NOME_CLIENTE_OAUTH = 'Chaos Code v3 Client - ';

/** Concessões pedidas no registro do cliente. */
export const CONCESSOES_OAUTH = ['authorization_code', 'refresh_token'] as const;

/** Arquivo do cliente OAuth registrado (`OAuthClientCredentials`). */
export const ARQUIVO_CLIENTE_OAUTH = 'oauth_client.json';

/** Arquivo de reserva dos tokens, cifrado, usado quando o cofre nativo falha. */
export const ARQUIVO_TOKENS_AUTENTICACAO = 'auth_tokens.json';

/** Arquivo com o UUID do aparelho. */
export const ARQUIVO_IDENTIFICACAO_APARELHO = 'device_id.json';

/** Arquivo cifrado das chaves de API dos provedores *(escolha do clone; o original guarda em
 * texto puro nos JSON de configuração)*. */
export const ARQUIVO_CHAVES_PROVEDORES = 'provider_keys.json';

/* ----------------------- Pasta de dados e arquivos locais (CLONE.3.2) ----------------------- */

/** Nome da pasta de dados em `%LOCALAPPDATA%` (`docs/inventario/arquivos-locais.md`). */
export const NOME_PASTA_DADOS = 'chaos-code-v3';

/** Subpasta dos projetos, dentro da pasta de dados. */
export const NOME_PASTA_PROJETOS = 'projects';

/** Subpasta das conversas, dentro da pasta de cada projeto. */
export const NOME_PASTA_CONVERSAS = 'conversations';

/** Subpasta usada quando o ID do projeto é inválido. */
export const NOME_PASTA_PROJETO_INVALIDO = 'invalid';

/** Sufixo do arquivo temporário usado na gravação atômica. */
export const SUFIXO_ARQUIVO_TEMPORARIO = '.tmp';

/** Indentação, em espaços, dos JSON gravados (`serde_json` pretty). */
export const INDENTACAO_JSON = 2;

/** Lista de projetos (`ProjectRegistry`). */
export const ARQUIVO_PROJETOS = 'projects.json';

/** Porta e token do servidor MCP local. */
export const ARQUIVO_CONFIG_MCP = 'mcp_config.json';

/** Clientes e tokens emitidos pelo OAuth do MCP local. */
export const ARQUIVO_OAUTH_MCP = 'mcp_oauth.json';

/** Provedor de embeddings, modelo de chat e extração. */
export const ARQUIVO_CONFIG_EMBEDDER = 'embedder_config.json';

/** Parâmetros do pipeline RAG. */
export const ARQUIVO_CONFIG_RAG = 'rag_pipeline_config.json';

/** Provedores de imagem. */
export const ARQUIVO_CONFIG_IMAGEM = 'image_api_config.json';

/** Preferências do atualizador. */
export const ARQUIVO_CONFIG_ATUALIZACAO = 'update_config.json';

/** Estado antes e depois de atualizar. */
export const ARQUIVO_HISTORICO_ATUALIZACAO = 'update_history.json';

/** Aviso do WSL dispensado pelo usuário. */
export const ARQUIVO_CONFIG_WSL = 'wsl_config.json';

/** Índice vetorial de cada projeto (só as entradas). */
export const ARQUIVO_VETORES = 'vectors.json';

/** Entidades do grafo de cada projeto. */
export const ARQUIVO_ENTIDADES = 'entities.json';

/** Relações do grafo de cada projeto. */
export const ARQUIVO_GRAFO = 'graph.json';

/** Comunidades do grafo de cada projeto. */
export const ARQUIVO_COMUNIDADES = 'communities.json';
