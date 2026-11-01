/**
 * Servidor HTTP do MCP local: recria o `mcp::server` do original (docs/inventario/mcp-cli-wsl.md,
 * seção "Servidor MCP local").
 *
 * Diferença deliberada do original: ele escuta em `0.0.0.0`; o clone escuta só em `127.0.0.1` e,
 * quando a configuração libera, também no IP do host Windows visto pelo WSL (um servidor HTTP por
 * endereço, na mesma porta). Todo pedido passa pela lista de `Host` e `Origin` permitidos (contra
 * DNS rebinding e páginas web abertas no navegador) e o corpo tem limite de tamanho.
 *
 * Rotas: `POST /mcp/{project_id}` (JSON-RPC), `GET /health` e as rotas extras injetadas (OAuth e
 * `.well-known`, CLONE.8.4). A conferência da credencial (CLONE.8.3) e o roteador das ferramentas
 * (CLONE.8.9) são injetados; sem autenticador o servidor não é criado (falha fechada).
 */
import http from 'node:http';
import { isIPv4 } from 'node:net';
import type { AddressInfo } from 'node:net';

/** Porta padrão do original ("localhost:19850" no texto da interface). */
export const PORTA_PADRAO_MCP = 19850;

const HOST_LOOPBACK = '127.0.0.1';
const NOME_LOCALHOST = 'localhost';
const IP_NAO_ESPECIFICADO = '0.0.0.0';
const IP_DIFUSAO = '255.255.255.255';
/** 0 deixa o sistema escolher uma porta livre. */
const PORTA_MINIMA = 0;
const PORTA_MAXIMA = 65_535;

const PREFIXO_ROTA_MCP = '/mcp/';
const ROTA_SAUDE = '/health';
const CAMINHO_RAIZ = '/';
/** Id do projeto: UUID ou slug; sem `%`, `/` ou `.` (o caminho não é decodificado). */
const REGEX_ID_PROJETO = /^[A-Za-z0-9_-]{1,128}$/;
const PROTOCOLO_HTTP = 'http://';

const NOME_SERVICO = 'chaos-code-mcp';
const VERSAO_SERVICO_PADRAO = '1.11.2';
const STATUS_SAUDE_OK = 'ok';
const REALM_AUTENTICACAO = 'chaos-code-mcp';
const CAMINHO_METADADOS_RECURSO = '/.well-known/oauth-protected-resource/mcp/';
const ERRO_ROTA_DESCONHECIDA = 'not_found';

/** *(inferido)* 4 MiB cabem artigos longos do wiki sem abrir espaço para abuso de memória. */
const LIMITE_CORPO_BYTES = 4 * 1024 * 1024;
const TEMPO_LIMITE_CABECALHOS_MS = 10_000;
const TEMPO_LIMITE_PEDIDO_MS = 30_000;
const TEMPO_LIMITE_CONEXAO_OCIOSA_MS = 5_000;
const CODIGO_ENDERECO_EM_USO = 'EADDRINUSE';

const METODO_GET = 'GET';
const METODO_POST = 'POST';
const TIPO_JSON = 'application/json';
const SEPARADOR_PARAMETROS_TIPO = ';';
const CODIFICACAO_CORPO = 'utf8';
const VERSAO_JSON_RPC = '2.0';

const STATUS_OK = 200;
const STATUS_ACEITO = 202;
const STATUS_ERRO_PEDIDO = 400;
const STATUS_NAO_AUTORIZADO = 401;
const STATUS_PROIBIDO = 403;
const STATUS_NAO_ENCONTRADO = 404;
const STATUS_METODO_NAO_PERMITIDO = 405;
const STATUS_CORPO_GRANDE = 413;
const STATUS_TIPO_NAO_SUPORTADO = 415;
const STATUS_ERRO_INTERNO = 500;

const CODIGO_JSON_RPC_PARSE = -32700;
const CODIGO_JSON_RPC_PEDIDO_INVALIDO = -32600;
const CODIGO_JSON_RPC_METODO_INEXISTENTE = -32601;
const CODIGO_JSON_RPC_INTERNO = -32603;
const CODIGO_JSON_RPC_SERVIDOR = -32000;

const CABECALHOS_BASE: Readonly<Record<string, string>> = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};
const CABECALHO_TIPO_JSON = 'application/json; charset=utf-8';
const CABECALHO_TIPO_TEXTO = 'text/plain; charset=utf-8';

const MSG_HOST_PROIBIDO = 'Host header not allowed';
const MSG_ORIGEM_PROIBIDA = 'Origin not allowed';
const MSG_NAO_AUTORIZADO = 'Unauthorized: invalid or missing credentials';
const MSG_ERRO_PARSE = 'Parse error';
const MSG_PEDIDO_INVALIDO = 'Invalid Request';
const MSG_METODO_INEXISTENTE = 'Method not found';
const MSG_ERRO_INTERNO = 'Internal error';
const MSG_TIPO_NAO_SUPORTADO = 'Content-Type must be application/json';
const MSG_CORPO_GRANDE = 'Request body too large';
const MSG_METODO_NAO_PERMITIDO = 'Method not allowed';
const MSG_ROTA_DESCONHECIDA =
  'Endpoint not supported. See /.well-known/oauth-authorization-server for MCP OAuth ' +
  'discovery, or use the legacy X-MCP-Session-Token header.';
const MSG_ESCUTANDO = 'MCP HTTP server escutando em';
const MSG_DESLIGADO = 'MCP HTTP server desligado';
const MSG_PORTA_INVALIDA = 'Porta do servidor MCP inválida (use de 0 a 65535)';
const MSG_IP_WSL_INVALIDO = 'IP do WSL inválido para o servidor MCP (use um IPv4 do host)';
const MSG_PORTA_EM_USO = 'A porta do servidor MCP já está em uso';
const MSG_FALHA_ESCUTAR = 'Falha ao iniciar o servidor MCP em';
const MSG_ERRO_SERVIDOR = 'Erro no servidor MCP';
const MSG_ERRO_PEDIDO = 'Erro ao tratar pedido MCP';

/* ------------------------------------ Tipos ------------------------------------ */

/** Configuração de rede do servidor (vem do `mcp_config.json` e da detecção do WSL). */
export interface ConfiguracaoServidorMcp {
  /** Porta TCP (1 a 65535; 0 deixa o sistema escolher). Padrão: {@link PORTA_PADRAO_MCP}. */
  porta?: number;
  /** IPv4 do host Windows visto pelo WSL, só quando liberado; null ou ausente = só loopback. */
  ipWsl?: string | null;
}

/** Pedido HTTP já conferido (Host e Origin), entregue ao autenticador e às rotas extras. */
export interface PedidoHttpMcp {
  /** Método HTTP em maiúsculas. */
  metodo: string;
  /** URL do pedido; o host é sempre o `Host` já conferido, nunca o da linha do pedido. */
  url: URL;
  /** Cabeçalhos recebidos (nomes em minúsculas). */
  cabecalhos: http.IncomingHttpHeaders;
  /** Valor do `Host` conferido, em minúsculas (ex.: `localhost:19850`). */
  host: string;
  /**
   * Lê o corpo inteiro como texto UTF-8, com limite de tamanho; chamadas repetidas devolvem o mesmo.
   * @throws {ErroCorpoGrande} Se o corpo passar do limite (o servidor responde 413).
   */
  lerCorpo(): Promise<string>;
}

/** Resposta montada por uma rota; o servidor só a escreve. */
export interface RespostaHttpMcp {
  status: number;
  cabecalhos?: Readonly<Record<string, string>>;
  corpo?: string;
}

/** Resultado da conferência da credencial de um pedido `/mcp/{project_id}`. */
export type ResultadoAutenticacaoMcp =
  | { autorizado: true; tipoCredencial: string }
  | { autorizado: false };

/**
 * Confere a credencial do pedido (token de sessão ou OAuth, CLONE.8.3). Erro lançado vira 500:
 * nunca libera o pedido.
 */
export type AutenticadorPedidoMcp = (
  pedido: PedidoHttpMcp,
  idProjeto: string,
) => Promise<ResultadoAutenticacaoMcp>;

/** Dados do pedido entregues ao roteador junto com a mensagem JSON-RPC. */
export interface ContextoPedidoMcp {
  idProjeto: string;
  tipoCredencial: string;
  host: string;
}

/**
 * Trata a mensagem JSON-RPC já interpretada (CLONE.8.9) e devolve a resposta JSON-RPC; null =
 * notificação, respondida com 202 sem corpo.
 */
export type RoteadorMcp = (mensagem: unknown, contexto: ContextoPedidoMcp) => Promise<unknown>;

/** Rota fora do `/mcp/{project_id}` (OAuth e `.well-known`, CLONE.8.4). */
export interface RotaExtraMcp {
  /** Método HTTP aceito, em maiúsculas. */
  metodo: string;
  /** Caminho exato, ou prefixo quando `ehPrefixo` for true (ex.: `/.well-known/`). */
  caminho: string;
  ehPrefixo?: boolean;
  /**
   * Monta a resposta da rota.
   * @param pedido - Pedido já conferido.
   * @returns Resposta a escrever.
   */
  tratar(pedido: PedidoHttpMcp): Promise<RespostaHttpMcp>;
}

/** Dependências do servidor (tudo injetado). */
export interface DependenciasServidorMcp {
  /** Obrigatório: confere a credencial de cada pedido `/mcp/{project_id}`. */
  autenticar: AutenticadorPedidoMcp;
  /** Roteador JSON-RPC; sem ele, todo método responde "Method not found". */
  rotear?: RoteadorMcp;
  /** Rotas extras (OAuth, `.well-known`). */
  rotasExtras?: readonly RotaExtraMcp[];
  /** Versão mostrada no `/health`. Padrão: a do original. */
  versao?: string;
  /** Registro de log; padrão: nenhum. */
  registrar?: (mensagem: string) => void;
}

/** Onde o servidor está escutando. */
export interface EnderecoServidorMcp {
  porta: number;
  /** Endereços em escuta: sempre `127.0.0.1` e, se liberado, o IP do WSL. */
  hosts: readonly string[];
}

/** Configuração já conferida. */
interface ConfiguracaoNormalizada {
  porta: number;
  ipWsl: string | null;
}

/** Resultado da leitura do JSON do corpo. */
type JsonInterpretado = { ok: true; valor: unknown } | { ok: false; mensagem: string };

/** Motivo de falha do servidor. */
export type CodigoErroServidorMcp = 'configuracao_invalida' | 'porta_em_uso' | 'falha_ao_escutar';

/** Erro ao configurar ou subir o servidor MCP, com mensagem em português. */
export class ErroServidorMcp extends Error {
  /**
   * @param codigo - Motivo da falha.
   * @param mensagem - Texto para o usuário.
   * @param causa - Erro original, quando houver.
   */
  constructor(
    readonly codigo: CodigoErroServidorMcp,
    mensagem: string,
    causa?: unknown,
  ) {
    super(mensagem, { cause: causa });
    this.name = 'ErroServidorMcp';
  }
}

/** Corpo do pedido maior que o limite (vira HTTP 413). */
export class ErroCorpoGrande extends Error {
  /** Cria o erro com a mensagem fixa. */
  constructor() {
    super(MSG_CORPO_GRANDE);
    this.name = 'ErroCorpoGrande';
  }
}

/* --------------------------------- Auxiliares ---------------------------------- */

/**
 * Confere a porta e o IP do WSL. IP do WSL igual a `127.0.0.1` (modo mirrored) não abre um
 * segundo servidor.
 * @param config - Configuração recebida.
 * @returns Configuração conferida.
 * @throws {ErroServidorMcp} `configuracao_invalida` se a porta ou o IP não servirem.
 */
export function normalizarConfiguracao(config: ConfiguracaoServidorMcp = {}): ConfiguracaoNormalizada {
  const porta = config.porta ?? PORTA_PADRAO_MCP;
  const portaValida = Number.isInteger(porta) && porta >= PORTA_MINIMA && porta <= PORTA_MAXIMA;
  if (!portaValida) {
    throw new ErroServidorMcp('configuracao_invalida', `${MSG_PORTA_INVALIDA}: ${porta}`);
  }

  const ipWsl = config.ipWsl ?? null;
  if (ipWsl === null || ipWsl === HOST_LOOPBACK) return { porta, ipWsl: null };

  const ipValido = isIPv4(ipWsl) && ipWsl !== IP_NAO_ESPECIFICADO && ipWsl !== IP_DIFUSAO;
  if (!ipValido) {
    throw new ErroServidorMcp('configuracao_invalida', `${MSG_IP_WSL_INVALIDO}: ${ipWsl}`);
  }
  return { porta, ipWsl };
}

/**
 * Monta os valores de `Host` aceitos (`localhost`, `127.0.0.1` e o IP do WSL, sempre com a porta).
 * @param porta - Porta em escuta.
 * @param ipWsl - IP do WSL liberado, ou null.
 * @returns Conjunto de `host:porta` em minúsculas.
 */
export function montarHostsPermitidos(porta: number, ipWsl: string | null): Set<string> {
  const nomes = [NOME_LOCALHOST, HOST_LOOPBACK];
  if (ipWsl !== null) nomes.push(ipWsl);
  return new Set(nomes.map((nome) => `${nome}:${porta}`));
}

/**
 * Lê o primeiro valor de um cabeçalho, em minúsculas.
 * @param valor - Valor recebido (texto, lista ou ausente).
 * @returns Valor em minúsculas, ou null se ausente.
 */
function lerCabecalho(valor: string | string[] | undefined): string | null {
  const primeiro = Array.isArray(valor) ? valor[0] : valor;
  return primeiro === undefined ? null : primeiro.trim().toLowerCase();
}

/**
 * Monta uma resposta de texto simples.
 * @param status - Código HTTP.
 * @param texto - Corpo.
 * @returns Resposta.
 */
function respostaTexto(status: number, texto: string): RespostaHttpMcp {
  return { status, cabecalhos: { 'Content-Type': CABECALHO_TIPO_TEXTO }, corpo: texto };
}

/**
 * Monta uma resposta JSON.
 * @param status - Código HTTP.
 * @param dados - Valor serializado no corpo.
 * @param cabecalhos - Cabeçalhos a mais.
 * @returns Resposta.
 */
function respostaJson(
  status: number,
  dados: unknown,
  cabecalhos: Readonly<Record<string, string>> = {},
): RespostaHttpMcp {
  return {
    status,
    cabecalhos: { 'Content-Type': CABECALHO_TIPO_JSON, ...cabecalhos },
    corpo: JSON.stringify(dados),
  };
}

/**
 * Monta o objeto de erro JSON-RPC. Sem `id` (undefined) o campo fica de fora, como no 401 do
 * original.
 * @param codigo - Código JSON-RPC.
 * @param mensagem - Mensagem do erro.
 * @param id - Id do pedido, null ou ausente.
 * @returns Objeto de erro JSON-RPC.
 */
export function erroJsonRpc(codigo: number, mensagem: string, id?: unknown): object {
  const erro = { jsonrpc: VERSAO_JSON_RPC, error: { code: codigo, message: mensagem } };
  return id === undefined ? erro : { ...erro, id };
}

/**
 * Confere `Host` e `Origin` (contra DNS rebinding e páginas web). Sem `Origin` (CLIs) passa.
 * @param cabecalhos - Cabeçalhos do pedido.
 * @param hostsPermitidos - `host:porta` aceitos.
 * @returns Resposta 403 se recusado, ou null se o pedido pode seguir.
 */
export function conferirHostEOrigem(
  cabecalhos: http.IncomingHttpHeaders,
  hostsPermitidos: ReadonlySet<string>,
): RespostaHttpMcp | null {
  const host = lerCabecalho(cabecalhos.host);
  if (host === null || !hostsPermitidos.has(host)) {
    return respostaTexto(STATUS_PROIBIDO, MSG_HOST_PROIBIDO);
  }

  const origem = lerCabecalho(cabecalhos.origin);
  if (origem === null) return null;
  const origemPermitida = [...hostsPermitidos].some((item) => origem === PROTOCOLO_HTTP + item);
  return origemPermitida ? null : respostaTexto(STATUS_PROIBIDO, MSG_ORIGEM_PROIBIDA);
}

/**
 * Tira o id do projeto do caminho `/mcp/{project_id}` (só um segmento, sem decodificar).
 * @param caminho - `pathname` do pedido.
 * @returns Id do projeto, ou null se o caminho não for de MCP ou o id não servir.
 */
export function extrairIdProjeto(caminho: string): string | null {
  if (!caminho.startsWith(PREFIXO_ROTA_MCP)) return null;
  const segmento = caminho.slice(PREFIXO_ROTA_MCP.length);
  return REGEX_ID_PROJETO.test(segmento) ? segmento : null;
}

/**
 * Monta a resposta 401 do original, com o desafio `WWW-Authenticate` apontando para a descoberta
 * OAuth do recurso.
 * @param host - `Host` já conferido.
 * @param idProjeto - Id do projeto do caminho.
 * @returns Resposta 401.
 */
export function montarRespostaNaoAutorizado(host: string, idProjeto: string): RespostaHttpMcp {
  const metadados = `${PROTOCOLO_HTTP}${host}${CAMINHO_METADADOS_RECURSO}${idProjeto}`;
  const desafio = `Bearer realm="${REALM_AUTENTICACAO}", resource_metadata="${metadados}"`;
  const corpo = erroJsonRpc(CODIGO_JSON_RPC_SERVIDOR, MSG_NAO_AUTORIZADO);
  return respostaJson(STATUS_NAO_AUTORIZADO, corpo, { 'WWW-Authenticate': desafio });
}

/**
 * Monta a URL do pedido com o host conferido; descarta host vindo da linha do pedido
 * (forma absoluta ou `//outro-host/`).
 * @param alvo - Alvo da linha do pedido (`pedido.url`).
 * @param host - `Host` já conferido.
 * @returns URL com caminho e consulta do pedido.
 */
function montarUrlPedido(alvo: string | undefined, host: string): URL {
  const url = new URL(PROTOCOLO_HTTP + host + CAMINHO_RAIZ);
  try {
    const analisada = new URL(alvo ?? CAMINHO_RAIZ, url);
    url.pathname = analisada.pathname;
    url.search = analisada.search;
  } catch {
    // Alvo malformado: fica a raiz, que cai em "rota desconhecida".
  }
  return url;
}

/**
 * Lê o corpo do pedido com limite de bytes (confere o `Content-Length` antes e o total lido).
 * @param pedido - Pedido HTTP.
 * @param limite - Máximo de bytes.
 * @returns Corpo em UTF-8.
 * @throws {ErroCorpoGrande} Se passar do limite.
 */
async function lerCorpoLimitado(pedido: http.IncomingMessage, limite: number): Promise<string> {
  const declarado = Number(pedido.headers['content-length'] ?? 0);
  if (declarado > limite) throw new ErroCorpoGrande();

  const partes: Buffer[] = [];
  let total = 0;
  for await (const parte of pedido) {
    const pedaco = parte as Buffer;
    total += pedaco.length;
    if (total > limite) throw new ErroCorpoGrande();
    partes.push(pedaco);
  }
  return Buffer.concat(partes).toString(CODIFICACAO_CORPO);
}

/**
 * Embrulha o pedido do Node no {@link PedidoHttpMcp} (o corpo só é lido quando pedido).
 * @param pedido - Pedido HTTP.
 * @param host - `Host` já conferido.
 * @returns Pedido para as rotas.
 */
function criarPedidoHttp(pedido: http.IncomingMessage, host: string): PedidoHttpMcp {
  let corpo: Promise<string> | null = null;
  return {
    metodo: (pedido.method ?? '').toUpperCase(),
    url: montarUrlPedido(pedido.url, host),
    cabecalhos: pedido.headers,
    host,
    lerCorpo: () => (corpo ??= lerCorpoLimitado(pedido, LIMITE_CORPO_BYTES)),
  };
}

/**
 * Confere se o `Content-Type` é JSON (ignora `charset` e outros parâmetros).
 * @param valor - Cabeçalho `Content-Type`.
 * @returns true se for `application/json`.
 */
function ehTipoJson(valor: string | undefined): boolean {
  const tipo = (valor ?? '').split(SEPARADOR_PARAMETROS_TIPO)[0];
  return tipo.trim().toLowerCase() === TIPO_JSON;
}

/**
 * Interpreta o JSON do corpo sem lançar erro.
 * @param texto - Corpo do pedido.
 * @returns Valor ou a mensagem do erro de sintaxe.
 */
function interpretarJson(texto: string): JsonInterpretado {
  try {
    return { ok: true, valor: JSON.parse(texto) as unknown };
  } catch (erro) {
    const detalhe = erro instanceof Error ? erro.message : String(erro);
    return { ok: false, mensagem: `${MSG_ERRO_PARSE}: ${detalhe}` };
  }
}

/**
 * Roteador usado enquanto o de verdade (CLONE.8.9) não é injetado: notificação não tem resposta;
 * pedido com `id` recebe "Method not found".
 * @param mensagem - Mensagem JSON-RPC.
 * @returns Erro JSON-RPC, ou null para notificação.
 */
async function roteadorPadrao(mensagem: unknown): Promise<unknown> {
  const ehObjeto = typeof mensagem === 'object' && mensagem !== null && !Array.isArray(mensagem);
  if (!ehObjeto) return erroJsonRpc(CODIGO_JSON_RPC_PEDIDO_INVALIDO, MSG_PEDIDO_INVALIDO, null);

  const id = (mensagem as { id?: unknown }).id;
  if (id === undefined) return null;
  return erroJsonRpc(CODIGO_JSON_RPC_METODO_INEXISTENTE, MSG_METODO_INEXISTENTE, id);
}

/**
 * Resposta 405 com o cabeçalho `Allow`.
 * @param metodoAceito - Único método aceito na rota.
 * @returns Resposta 405.
 */
function respostaMetodoNaoPermitido(metodoAceito: string): RespostaHttpMcp {
  const resposta = respostaTexto(STATUS_METODO_NAO_PERMITIDO, MSG_METODO_NAO_PERMITIDO);
  return { ...resposta, cabecalhos: { ...resposta.cabecalhos, Allow: metodoAceito } };
}

/**
 * Escreve a resposta (com os cabeçalhos de segurança), se ainda não foi escrita.
 * @param resposta - Resposta HTTP do Node.
 * @param conteudo - Resposta montada pela rota.
 */
function escreverResposta(resposta: http.ServerResponse, conteudo: RespostaHttpMcp): void {
  if (resposta.headersSent) return;
  resposta.writeHead(conteudo.status, { ...CABECALHOS_BASE, ...conteudo.cabecalhos });
  resposta.end(conteudo.corpo);
}

/**
 * Traduz o erro do `listen` para mensagem em português.
 * @param erro - Erro do Node.
 * @param host - Endereço tentado.
 * @param porta - Porta tentada.
 * @returns Erro do servidor MCP.
 */
function traduzirErroEscuta(
  erro: NodeJS.ErrnoException,
  host: string,
  porta: number,
): ErroServidorMcp {
  const endereco = `${host}:${porta}`;
  if (erro.code === CODIGO_ENDERECO_EM_USO) {
    return new ErroServidorMcp('porta_em_uso', `${MSG_PORTA_EM_USO}: ${endereco}`, erro);
  }
  const mensagem = `${MSG_FALHA_ESCUTAR} ${endereco}: ${erro.message}`;
  return new ErroServidorMcp('falha_ao_escutar', mensagem, erro);
}

/**
 * Fecha um servidor HTTP e derruba as conexões abertas (keep-alive incluído).
 * @param servidor - Servidor a fechar; se já parado, só resolve.
 * @returns Promessa resolvida quando o servidor fechar.
 */
function fecharServidor(servidor: http.Server): Promise<void> {
  return new Promise<void>((resolver) => {
    servidor.close(() => resolver());
    servidor.closeAllConnections();
  });
}

/* ---------------------------------- Servidor ----------------------------------- */

/** Servidor MCP local: inicia, para e despacha os pedidos para as rotas. */
export class ServidorMcp {
  private servidores: http.Server[] = [];
  private hostsPermitidos: ReadonlySet<string> = new Set();
  private enderecoAtual: EnderecoServidorMcp | null = null;
  private iniciando: Promise<EnderecoServidorMcp> | null = null;
  private readonly rotear: RoteadorMcp;
  private readonly rotasExtras: readonly RotaExtraMcp[];
  private readonly versao: string;
  private readonly registrar: (mensagem: string) => void;

  /**
   * @param dependencias - Autenticador (obrigatório), roteador, rotas extras, versão e log.
   */
  constructor(private readonly dependencias: DependenciasServidorMcp) {
    this.rotear = dependencias.rotear ?? roteadorPadrao;
    this.rotasExtras = dependencias.rotasExtras ?? [];
    this.versao = dependencias.versao ?? VERSAO_SERVICO_PADRAO;
    this.registrar = dependencias.registrar ?? (() => undefined);
  }

  /** true enquanto o servidor estiver escutando. */
  get estaRodando(): boolean {
    return this.enderecoAtual !== null;
  }

  /** Porta e endereços em escuta, ou null se parado. */
  get endereco(): EnderecoServidorMcp | null {
    return this.enderecoAtual;
  }

  /**
   * Sobe o servidor. Já rodando, devolve o endereço atual (para trocar porta ou IP: parar e
   * iniciar de novo). Falha em qualquer endereço desfaz tudo.
   * @param config - Porta e IP do WSL liberado.
   * @returns Porta e endereços em escuta.
   * @throws {ErroServidorMcp} Configuração inválida, porta em uso ou falha ao escutar.
   */
  iniciar(config?: ConfiguracaoServidorMcp): Promise<EnderecoServidorMcp> {
    if (this.enderecoAtual !== null) return Promise.resolve(this.enderecoAtual);
    this.iniciando ??= this.subir(config).finally(() => {
      this.iniciando = null;
    });
    return this.iniciando;
  }

  /**
   * Para o servidor e fecha as conexões abertas. Parado, não faz nada.
   * @returns Promessa resolvida quando tudo fechar.
   */
  async parar(): Promise<void> {
    if (this.iniciando !== null) await this.iniciando.catch(() => undefined);
    const estavaRodando = this.enderecoAtual !== null;
    await this.fecharServidores();
    if (estavaRodando) this.registrar(MSG_DESLIGADO);
  }

  /**
   * Escuta em `127.0.0.1` e, se liberado, no IP do WSL, na mesma porta.
   * @param config - Configuração recebida.
   * @returns Porta e endereços em escuta.
   * @throws {ErroServidorMcp} Se a configuração ou o `listen` falharem.
   */
  private async subir(config?: ConfiguracaoServidorMcp): Promise<EnderecoServidorMcp> {
    const { porta: portaPedida, ipWsl } = normalizarConfiguracao(config);
    try {
      const porta = await this.escutar(HOST_LOOPBACK, portaPedida);
      this.hostsPermitidos = montarHostsPermitidos(porta, ipWsl);
      if (ipWsl !== null) await this.escutar(ipWsl, porta);
      return this.marcarIniciado(porta, ipWsl);
    } catch (erro) {
      await this.fecharServidores();
      throw erro;
    }
  }

  /**
   * Guarda o endereço em escuta e registra no log, como o original.
   * @param porta - Porta em escuta.
   * @param ipWsl - IP do WSL, ou null.
   * @returns Endereço guardado.
   */
  private marcarIniciado(porta: number, ipWsl: string | null): EnderecoServidorMcp {
    const hosts = ipWsl === null ? [HOST_LOOPBACK] : [HOST_LOOPBACK, ipWsl];
    this.enderecoAtual = { porta, hosts };
    for (const host of hosts) this.registrar(`${MSG_ESCUTANDO} ${PROTOCOLO_HTTP}${host}:${porta}`);
    return this.enderecoAtual;
  }

  /**
   * Cria um servidor HTTP e o põe a escutar num endereço.
   * @param host - Endereço (IPv4) de escuta.
   * @param porta - Porta (0 = o sistema escolhe).
   * @returns Porta efetiva.
   * @throws {ErroServidorMcp} Se o `listen` falhar.
   */
  private async escutar(host: string, porta: number): Promise<number> {
    const servidor = this.criarServidorHttp();
    this.servidores.push(servidor);
    await new Promise<void>((resolver, rejeitar) => {
      const aoFalhar = (erro: NodeJS.ErrnoException): void => {
        rejeitar(traduzirErroEscuta(erro, host, porta));
      };
      servidor.once('error', aoFalhar);
      servidor.listen(porta, host, () => {
        servidor.off('error', aoFalhar);
        servidor.on('error', (erro) => this.registrar(`${MSG_ERRO_SERVIDOR}: ${erro.message}`));
        resolver();
      });
    });
    return (servidor.address() as AddressInfo).port;
  }

  /**
   * Cria o servidor HTTP com os tempos limite de cabeçalho, pedido e conexão ociosa.
   * @returns Servidor ainda sem escutar.
   */
  private criarServidorHttp(): http.Server {
    const servidor = http.createServer((pedido, resposta) => {
      void this.tratarPedido(pedido, resposta);
    });
    servidor.headersTimeout = TEMPO_LIMITE_CABECALHOS_MS;
    servidor.requestTimeout = TEMPO_LIMITE_PEDIDO_MS;
    servidor.keepAliveTimeout = TEMPO_LIMITE_CONEXAO_OCIOSA_MS;
    return servidor;
  }

  /**
   * Fecha todos os servidores e limpa o estado (endereço e hosts aceitos).
   * @returns Promessa resolvida quando todos fecharem.
   */
  private async fecharServidores(): Promise<void> {
    const servidores = this.servidores;
    this.servidores = [];
    this.enderecoAtual = null;
    this.hostsPermitidos = new Set();
    await Promise.all(servidores.map(fecharServidor));
  }

  /**
   * Responde um pedido; qualquer erro vira 413 (corpo grande) ou 500, sem expor detalhes.
   * @param pedido - Pedido HTTP.
   * @param resposta - Resposta HTTP.
   */
  private async tratarPedido(
    pedido: http.IncomingMessage,
    resposta: http.ServerResponse,
  ): Promise<void> {
    try {
      escreverResposta(resposta, await this.despachar(pedido));
    } catch (erro) {
      escreverResposta(resposta, this.respostaDeErro(erro));
    }
  }

  /**
   * Converte um erro inesperado em resposta.
   * @param erro - Erro capturado.
   * @returns 413 para corpo grande (fechando a conexão); 500 JSON-RPC nos outros casos.
   */
  private respostaDeErro(erro: unknown): RespostaHttpMcp {
    if (erro instanceof ErroCorpoGrande) {
      const resposta = respostaTexto(STATUS_CORPO_GRANDE, MSG_CORPO_GRANDE);
      return { ...resposta, cabecalhos: { ...resposta.cabecalhos, Connection: 'close' } };
    }
    const detalhe = erro instanceof Error ? erro.message : String(erro);
    this.registrar(`${MSG_ERRO_PEDIDO}: ${detalhe}`);
    const corpo = erroJsonRpc(CODIGO_JSON_RPC_INTERNO, MSG_ERRO_INTERNO, null);
    return respostaJson(STATUS_ERRO_INTERNO, corpo);
  }

  /**
   * Confere `Host`/`Origin` e escolhe a rota: `/health`, `/mcp/{project_id}`, extras ou 404.
   * @param pedido - Pedido HTTP.
   * @returns Resposta da rota.
   */
  private async despachar(pedido: http.IncomingMessage): Promise<RespostaHttpMcp> {
    const bloqueio = conferirHostEOrigem(pedido.headers, this.hostsPermitidos);
    if (bloqueio !== null) return bloqueio;

    const pedidoMcp = criarPedidoHttp(pedido, lerCabecalho(pedido.headers.host) ?? '');
    const caminho = pedidoMcp.url.pathname;
    if (caminho === ROTA_SAUDE) return this.tratarSaude(pedidoMcp);

    const idProjeto = extrairIdProjeto(caminho);
    if (idProjeto !== null) return this.tratarMcp(pedidoMcp, idProjeto);

    const rota = this.acharRotaExtra(pedidoMcp);
    if (rota !== undefined) return rota.tratar(pedidoMcp);

    const corpo = { error: ERRO_ROTA_DESCONHECIDA, error_description: MSG_ROTA_DESCONHECIDA };
    return respostaJson(STATUS_NAO_ENCONTRADO, corpo);
  }

  /**
   * Procura a rota extra do método e caminho do pedido.
   * @param pedido - Pedido conferido.
   * @returns Rota encontrada, ou undefined.
   */
  private acharRotaExtra(pedido: PedidoHttpMcp): RotaExtraMcp | undefined {
    const caminho = pedido.url.pathname;
    return this.rotasExtras.find((rota) => {
      const caminhoConfere = rota.ehPrefixo
        ? caminho.startsWith(rota.caminho)
        : caminho === rota.caminho;
      return caminhoConfere && rota.metodo === pedido.metodo;
    });
  }

  /**
   * `GET /health`: situação do serviço, sem autenticação.
   * @param pedido - Pedido conferido.
   * @returns JSON `{ status, service, version }` ou 405.
   */
  private tratarSaude(pedido: PedidoHttpMcp): RespostaHttpMcp {
    if (pedido.metodo !== METODO_GET) return respostaMetodoNaoPermitido(METODO_GET);
    const corpo = { status: STATUS_SAUDE_OK, service: NOME_SERVICO, version: this.versao };
    return respostaJson(STATUS_OK, corpo);
  }

  /**
   * `POST /mcp/{project_id}`: confere a credencial antes de ler o corpo, interpreta o JSON-RPC e
   * entrega ao roteador.
   * @param pedido - Pedido conferido.
   * @param idProjeto - Id do projeto do caminho.
   * @returns Resposta JSON-RPC, 202 para notificação, ou erro HTTP.
   */
  private async tratarMcp(pedido: PedidoHttpMcp, idProjeto: string): Promise<RespostaHttpMcp> {
    if (pedido.metodo !== METODO_POST) return respostaMetodoNaoPermitido(METODO_POST);

    const autenticacao = await this.dependencias.autenticar(pedido, idProjeto);
    if (!autenticacao.autorizado) return montarRespostaNaoAutorizado(pedido.host, idProjeto);

    if (!ehTipoJson(pedido.cabecalhos['content-type'])) {
      const corpo = erroJsonRpc(CODIGO_JSON_RPC_PEDIDO_INVALIDO, MSG_TIPO_NAO_SUPORTADO, null);
      return respostaJson(STATUS_TIPO_NAO_SUPORTADO, corpo);
    }

    const json = interpretarJson(await pedido.lerCorpo());
    if (!json.ok) {
      const corpo = erroJsonRpc(CODIGO_JSON_RPC_PARSE, json.mensagem, null);
      return respostaJson(STATUS_ERRO_PEDIDO, corpo);
    }

    const contexto = { idProjeto, tipoCredencial: autenticacao.tipoCredencial, host: pedido.host };
    const resultado = await this.rotear(json.valor, contexto);
    if (resultado === null) return { status: STATUS_ACEITO };
    return respostaJson(STATUS_OK, resultado);
  }
}
