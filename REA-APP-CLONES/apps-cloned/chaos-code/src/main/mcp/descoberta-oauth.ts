/**
 * Descoberta OAuth do MCP local (`.well-known` + rotas `/oauth/*`), do inventário
 * `mcp-cli-wsl.md` §"Servidor de autorização do MCP". Tokens `mcp_at_`/`mcp_rt_` só ficam
 * guardados como hash (SHA-256) no `McpOAuthStore`.
 */

import { createHash, randomBytes } from 'node:crypto';
import { lerJson, gravarJson } from '../armazenamento/arquivo-json';
import type { PedidoHttpMcp, RespostaHttpMcp, RotaExtraMcp } from './servidor';

/** Cliente OAuth registrado (`RegisteredClient`). */
export interface ClienteRegistrado {
  client_id: string;
  client_name: string;
  redirect_uris: string[];
  registered_at: string;
}

/** Token emitido, com só os hashes guardados (`IssuedToken`). */
export interface TokenEmitido {
  token_hash: string;
  refresh_hash: string | null;
  client_id: string;
  scope: string;
  expires_at: number;
  refresh_expires_at: number | null;
}

/** Pedido de autorização pendente de consentimento. */
interface PedidoAutorizacao {
  request_id: string;
  client_id: string;
  client_name: string;
  redirect_uri: string;
  code_challenge: string;
  state: string;
  status: 'pending' | 'approved' | 'denied';
  code?: string;
}

/** Arquivo `oauth_mcp.json`: clientes registrados e tokens emitidos. */
interface ArmazenamentoOauth {
  clients: ClienteRegistrado[];
  tokens: TokenEmitido[];
}

const PREFIXO_TOKEN_ACESSO = 'mcp_at_';
const PREFIXO_TOKEN_RENOVACAO = 'mcp_rt_';
const VALIDADE_ACESSO_MS = 60 * 60 * 1000;
const VALIDADE_RENOVACAO_MS = 30 * 24 * 60 * 60 * 1000;
const TAMANHO_TOKEN_BYTES = 24;
const ESCOPO_PADRAO = 'mcp';
const HOSTS_LOOPBACK = ['localhost', '127.0.0.1', '[::1]', '::1'];
const TEMPO_LIMITE_PEDIDO_MS = 5 * 60 * 1000;

const MSG_CAMINHO_DESCONHECIDO = 'Unknown .well-known metadata path.';
const MSG_REQUEST_DESCONHECIDO = 'request_id desconhecido ou expirado';

/**
 * Faz o hash SHA-256 de um token em hex — só o hash vai para o disco.
 * @param {string} valor - Token em texto.
 * @returns {string} Hash hexadecimal.
 */
function hashToken(valor: string): string {
  return createHash('sha256').update(valor, 'utf8').digest('hex');
}

/**
 * Responde JSON com status e corpo.
 * @param {number} status - Código HTTP.
 * @param {unknown} corpo - Objeto a serializar.
 * @returns {RespostaHttpMcp} Resposta pronta.
 */
function respostaJson(status: number, corpo: unknown): RespostaHttpMcp {
  return { status, cabecalhos: { 'content-type': 'application/json' }, corpo: JSON.stringify(corpo) };
}

/**
 * Responde erro OAuth (`invalid_request`, `invalid_client`...).
 * @param {number} status - Código HTTP.
 * @param {string} erro - Código do erro OAuth.
 * @param {string} descricao - Mensagem legível.
 * @returns {RespostaHttpMcp} Resposta de erro.
 */
function erroOauth(status: number, erro: string, descricao: string): RespostaHttpMcp {
  return respostaJson(status, { error: erro, error_description: descricao });
}

/**
 * Diz se o `redirect_uri` aponta para loopback http — o único aceito no registro.
 * @param {string} uri - URI recebida.
 * @returns {boolean} true para `http://localhost|127.0.0.1|[::1]...`.
 */
function ehRedirectLoopback(uri: string): boolean {
  try {
    const url = new URL(uri);
    return url.protocol === 'http:' && HOSTS_LOOPBACK.includes(url.hostname);
  } catch {
    return false;
  }
}

/** Serviço de autorização OAuth do MCP local. */
export class ServicoOauthMcp {
  private readonly caminhoArquivo: string;
  private readonly emitirConsentimento?: (pedido: {
    request_id: string;
    client_name: string;
    redirect_uri: string;
  }) => void;
  private pedidos = new Map<string, PedidoAutorizacao & { criadoEm: number }>();
  private codigos = new Map<string, PedidoAutorizacao>();

  /**
   * @param {string} caminhoArquivo - Caminho de `oauth_mcp.json`.
   * @param emitirConsentimento - Emite `mcp:consent-request` para a interface.
   */
  constructor(
    caminhoArquivo: string,
    emitirConsentimento?: (pedido: {
      request_id: string;
      client_name: string;
      redirect_uri: string;
    }) => void,
  ) {
    this.caminhoArquivo = caminhoArquivo;
    this.emitirConsentimento = emitirConsentimento;
  }

  /**
   * Confere um token `mcp_at_…` recebido no `Authorization: Bearer`.
   * @param {string} token - Token em texto.
   * @returns {Promise<boolean>} true quando existe e não expirou.
   */
  async conferirTokenAcesso(token: string): Promise<boolean> {
    const dados = await this.lerArmazenamento();
    const hash = hashToken(token);
    const achado = dados.tokens.find((item) => item.token_hash === hash);
    return achado !== undefined && achado.expires_at > Date.now();
  }

  /**
   * Resolve o consentimento da interface (`respond_mcp_consent`).
   * @param {string} requestId - ID do pedido.
   * @param {boolean} aprovado - Decisão do usuário.
   * @returns {Promise<boolean>} true quando o pedido existia.
   */
  async responderConsentimento(requestId: string, aprovado: boolean): Promise<boolean> {
    const pedido = this.pedidos.get(requestId);
    if (!pedido) return false;
    pedido.status = aprovado ? 'approved' : 'denied';
    if (aprovado) pedido.code = `${PREFIXO_TOKEN_ACESSO}code_${randomBytes(16).toString('hex')}`;
    if (pedido.code) this.codigos.set(pedido.code, pedido);
    return true;
  }

  /**
   * Lê o arquivo de armazenamento (ausente → vazio).
   * @returns {Promise<ArmazenamentoOauth>} Clientes e tokens.
   */
  private async lerArmazenamento(): Promise<ArmazenamentoOauth> {
    return lerJson<ArmazenamentoOauth>(this.caminhoArquivo, { clients: [], tokens: [] });
  }

  /**
   * Grava o armazenamento.
   * @param {ArmazenamentoOauth} dados - Conteúdo novo.
   */
  private async gravarArmazenamento(dados: ArmazenamentoOauth): Promise<void> {
    const limite = Date.now();
    dados.tokens = dados.tokens.filter(
      (t) => t.expires_at > limite || (t.refresh_expires_at ?? 0) > limite,
    );
    await gravarJson(this.caminhoArquivo, dados);
  }

  /**
   * Monta as rotas extras do servidor (`/.well-known/*` e `/oauth/*`).
   * @returns {RotaExtraMcp[]} Rotas prontas para `ServidorMcp`.
   */
  montarRotas(): RotaExtraMcp[] {
    return [
      {
        metodo: 'GET',
        caminho: '/.well-known/',
        ehPrefixo: true,
        tratar: (pedido) => this.tratarWellKnown(pedido),
      },
      { metodo: 'POST', caminho: '/oauth/register', tratar: (p) => this.tratarRegistro(p) },
      { metodo: 'GET', caminho: '/oauth/authorize', tratar: (p) => this.tratarAutorizar(p) },
      {
        metodo: 'GET',
        caminho: '/oauth/authorize/status',
        tratar: (p) => this.tratarStatus(p),
      },
      { metodo: 'POST', caminho: '/oauth/token', tratar: (p) => this.tratarToken(p) },
    ];
  }

  /**
   * Responde os metadados `.well-known` (recurso protegido e servidor de autorização).
   * @param {PedidoHttpMcp} pedido - Pedido HTTP.
   * @returns {Promise<RespostaHttpMcp>} Metadados ou 404.
   */
  private async tratarWellKnown(pedido: PedidoHttpMcp): Promise<RespostaHttpMcp> {
    const caminho = pedido.url.pathname;
    const base = `http://${pedido.host}`;
    const recurso = '/.well-known/oauth-protected-resource/mcp/';
    if (caminho.startsWith(recurso)) {
      const idProjeto = caminho.slice(recurso.length);
      return respostaJson(200, {
        resource: `${base}/mcp/${idProjeto}`,
        authorization_servers: [base],
        bearer_methods_supported: ['header'],
        scopes_supported: [ESCOPO_PADRAO],
      });
    }
    if (caminho === '/.well-known/oauth-authorization-server') {
      return respostaJson(200, {
        issuer: base,
        authorization_endpoint: `${base}/oauth/authorize`,
        token_endpoint: `${base}/oauth/token`,
        registration_endpoint: `${base}/oauth/register`,
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        code_challenge_methods_supported: ['S256'],
        token_endpoint_auth_methods_supported: ['none'],
      });
    }
    return respostaJson(404, { error: 'not_found', error_description: MSG_CAMINHO_DESCONHECIDO });
  }

  /**
   * Registra um cliente OAuth (`POST /oauth/register`); só redirect_uri em loopback.
   * @param {PedidoHttpMcp} pedido - Pedido HTTP.
   * @returns {Promise<RespostaHttpMcp>} Cliente criado ou erro.
   */
  private async tratarRegistro(pedido: PedidoHttpMcp): Promise<RespostaHttpMcp> {
    let corpo: { client_name?: string; redirect_uris?: string[] };
    try {
      corpo = JSON.parse(await pedido.lerCorpo());
    } catch {
      return erroOauth(400, 'invalid_request', 'Corpo deve ser JSON');
    }
    const uris = corpo.redirect_uris ?? [];
    if (!corpo.client_name || uris.length === 0) {
      return erroOauth(400, 'invalid_request', 'client_name e redirect_uris são obrigatórios');
    }
    if (!uris.every(ehRedirectLoopback)) {
      return erroOauth(400, 'invalid_redirect_uri', 'redirect_uri deve ser http em loopback');
    }
    const cliente: ClienteRegistrado = {
      client_id: `mcp_client_${randomBytes(12).toString('hex')}`,
      client_name: corpo.client_name,
      redirect_uris: uris,
      registered_at: new Date().toISOString(),
    };
    const dados = await this.lerArmazenamento();
    dados.clients.push(cliente);
    await this.gravarArmazenamento(dados);
    return respostaJson(201, cliente);
  }

  /**
   * Inicia a autorização (`GET /oauth/authorize`): valida e cria o pedido de consentimento.
   * @param {PedidoHttpMcp} pedido - Pedido HTTP.
   * @returns {Promise<RespostaHttpMcp>} Página de confirmação ou erro.
   */
  private async tratarAutorizar(pedido: PedidoHttpMcp): Promise<RespostaHttpMcp> {
    const q = pedido.url.searchParams;
    const clientId = q.get('client_id');
    const redirectUri = q.get('redirect_uri');
    const challenge = q.get('code_challenge');
    const metodo = q.get('code_challenge_method');
    const tipo = q.get('response_type');
    const estado = q.get('state') ?? '';
    if (!clientId) return erroOauth(400, 'invalid_request', 'client_id é obrigatório');
    if (!challenge) return erroOauth(400, 'invalid_request', 'code_challenge é obrigatório (PKCE)');
    if (metodo !== 'S256') {
      return erroOauth(400, 'invalid_request', 'code_challenge_method deve ser S256');
    }
    if (tipo !== 'code') {
      return erroOauth(400, 'unsupported_response_type', "response_type deve ser 'code'");
    }
    if (!redirectUri || !ehRedirectLoopback(redirectUri)) {
      return erroOauth(400, 'invalid_redirect_uri', 'redirect_uri deve ser http em loopback');
    }
    const dados = await this.lerArmazenamento();
    const cliente = dados.clients.find((c) => c.client_id === clientId);
    if (!cliente) return erroOauth(400, 'invalid_client', 'client_id desconhecido');
    if (!cliente.redirect_uris.includes(redirectUri)) {
      return erroOauth(400, 'invalid_redirect_uri', 'redirect_uri não registrado');
    }
    const pedidoAuth: PedidoAutorizacao & { criadoEm: number } = {
      request_id: `req_${randomBytes(12).toString('hex')}`,
      client_id: clientId,
      client_name: cliente.client_name,
      redirect_uri: redirectUri,
      code_challenge: challenge,
      state: estado,
      status: 'pending',
      criadoEm: Date.now(),
    };
    this.pedidos.set(pedidoAuth.request_id, pedidoAuth);
    this.emitirConsentimento?.({
      request_id: pedidoAuth.request_id,
      client_name: cliente.client_name,
      redirect_uri: redirectUri,
    });
    const html = [
      '<!doctype html><meta charset="utf-8"><title>Confirme a autorização</title>',
      '<h1>Confirme a autorização</h1>',
      `<p>O aplicativo ${cliente.client_name} pede acesso ao MCP local.</p>`,
      '<p>Confirme ou negue na janela do Chaos Code.</p>',
      `<script>setInterval(async()=>{const r=await fetch('/oauth/authorize/status?request_id=${pedidoAuth.request_id}');`,
      'const d=await r.json();if(d.redirect_url)location.href=d.redirect_url},1000)</script>',
    ].join('');
    return { status: 200, cabecalhos: { 'content-type': 'text/html; charset=utf-8' }, corpo: html };
  }

  /**
   * Status do pedido de consentimento (`GET /oauth/authorize/status`).
   * @param {PedidoHttpMcp} pedido - Pedido HTTP.
   * @returns {Promise<RespostaHttpMcp>} Status, com `redirect_url` quando decidido.
   */
  private async tratarStatus(pedido: PedidoHttpMcp): Promise<RespostaHttpMcp> {
    const requestId = pedido.url.searchParams.get('request_id') ?? '';
    const item = this.pedidos.get(requestId);
    const expirado = !item || Date.now() - item.criadoEm > TEMPO_LIMITE_PEDIDO_MS;
    if (expirado) {
      return erroOauth(404, 'not_found', MSG_REQUEST_DESCONHECIDO);
    }
    if (item.status === 'pending') return respostaJson(200, { status: 'pending' });
    const destino = new URL(item.redirect_uri);
    if (item.status === 'approved' && item.code) {
      destino.searchParams.set('code', item.code);
      if (item.state) destino.searchParams.set('state', item.state);
    } else {
      destino.searchParams.set('error', 'access_denied');
      if (item.state) destino.searchParams.set('state', item.state);
    }
    return respostaJson(200, { status: item.status, redirect_url: destino.toString() });
  }

  /**
   * Troca código por token ou renova (`POST /oauth/token`).
   * @param {PedidoHttpMcp} pedido - Pedido HTTP.
   * @returns {Promise<RespostaHttpMcp>} Tokens ou erro OAuth.
   */
  private async tratarToken(pedido: PedidoHttpMcp): Promise<RespostaHttpMcp> {
    let formulario: Record<string, string>;
    try {
      const corpo = await pedido.lerCorpo();
      const tipo = pedido.cabecalhos['content-type'] ?? '';
      formulario = tipo.includes('json')
        ? (JSON.parse(corpo) as Record<string, string>)
        : Object.fromEntries(new URLSearchParams(corpo));
    } catch {
      return erroOauth(400, 'invalid_request', 'Corpo inválido');
    }
    const grant = formulario.grant_type;
    if (grant === 'authorization_code') return this.trocarCodigo(formulario);
    if (grant === 'refresh_token') return this.renovarToken(formulario);
    return erroOauth(400, 'unsupported_grant_type', 'grant_type não suportado');
  }

  /**
   * Troca o código de autorização por tokens (uso único, PKCE S256 conferido).
   * @param {Record<string, string>} formulario - Campos do pedido.
   * @returns {Promise<RespostaHttpMcp>} Tokens ou `invalid_grant`.
   */
  private async trocarCodigo(formulario: Record<string, string>): Promise<RespostaHttpMcp> {
    const code = formulario.code;
    const pedidoAuth = code ? this.codigos.get(code) : undefined;
    if (!code || !pedidoAuth) {
      return erroOauth(400, 'invalid_grant', 'code inválido ou já usado');
    }
    this.codigos.delete(code);
    const verificador = formulario.code_verifier ?? '';
    const conferido = createHash('sha256').update(verificador, 'utf8').digest('base64url');
    if (conferido !== pedidoAuth.code_challenge) {
      return erroOauth(400, 'invalid_grant', 'code_verifier não confere');
    }
    if (formulario.redirect_uri !== pedidoAuth.redirect_uri) {
      return erroOauth(400, 'invalid_grant', 'redirect_uri não confere');
    }
    return this.emitirTokens(pedidoAuth.client_id);
  }

  /**
   * Renova pelo `refresh_token` (gira o par de tokens).
   * @param {Record<string, string>} formulario - Campos do pedido.
   * @returns {Promise<RespostaHttpMcp>} Tokens novos ou `invalid_grant`.
   */
  private async renovarToken(formulario: Record<string, string>): Promise<RespostaHttpMcp> {
    const refresh = formulario.refresh_token ?? '';
    const dados = await this.lerArmazenamento();
    const hash = hashToken(refresh);
    const emitido = dados.tokens.find(
      (t) => t.refresh_hash === hash && (t.refresh_expires_at ?? 0) > Date.now(),
    );
    if (!emitido) return erroOauth(400, 'invalid_grant', 'refresh_token inválido');
    dados.tokens = dados.tokens.filter((t) => t !== emitido);
    await this.gravarArmazenamento(dados);
    return this.emitirTokens(emitido.client_id);
  }

  /**
   * Emite e grava um par `mcp_at_`/`mcp_rt_` (só os hashes vão ao disco).
   * @param {string} clientId - Cliente dono.
   * @returns {Promise<RespostaHttpMcp>} Resposta com os tokens em texto.
   */
  private async emitirTokens(clientId: string): Promise<RespostaHttpMcp> {
    const agora = Date.now();
    const acesso = PREFIXO_TOKEN_ACESSO + randomBytes(TAMANHO_TOKEN_BYTES).toString('hex');
    const renovacao = PREFIXO_TOKEN_RENOVACAO + randomBytes(TAMANHO_TOKEN_BYTES).toString('hex');
    const dados = await this.lerArmazenamento();
    dados.tokens.push({
      token_hash: hashToken(acesso),
      refresh_hash: hashToken(renovacao),
      client_id: clientId,
      scope: ESCOPO_PADRAO,
      expires_at: agora + VALIDADE_ACESSO_MS,
      refresh_expires_at: agora + VALIDADE_RENOVACAO_MS,
    });
    await this.gravarArmazenamento(dados);
    return respostaJson(200, {
      access_token: acesso,
      token_type: 'Bearer',
      expires_in: VALIDADE_ACESSO_MS / 1000,
      refresh_token: renovacao,
    });
  }
}
