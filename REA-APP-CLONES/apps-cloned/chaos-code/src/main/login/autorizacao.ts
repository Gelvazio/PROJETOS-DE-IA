/**
 * Autorização no navegador do sistema + callback local: recria o `commands::auth` (start_login) e
 * o `auth::callback` do original (docs/inventario/login.md, passos 2 a 7).
 *
 * Ordem: gera PKCE e `state` → sobe o callback em `127.0.0.1:0` (o sistema escolhe a porta) →
 * registra ou reaproveita o cliente (registro-cliente.ts) → abre a tela de consentimento no
 * navegador do sistema (função injetada; no app, `shell.openExternal`) → recebe code e state,
 * confere o `state` em tempo constante, responde uma página curta e fecha o servidor.
 */
import http from 'node:http';
import type { AddressInfo } from 'node:net';

import {
  CAMINHO_CALLBACK_OAUTH,
  ESCOPO_OAUTH,
  HOST_CALLBACK_OAUTH,
  PORTA_CALLBACK_OAUTH,
  ROTA_OAUTH_CONSENTIMENTO,
  TIPO_RESPOSTA_OAUTH,
} from '../../compartilhado/constantes';
import type {
  CredenciaisClienteOAuth,
  ParametrosCallbackOAuth,
  ParametrosPkce,
} from '../../compartilhado/tipos-login';
import { compararStateSeguro, gerarParametrosPkce } from './pkce';
import {
  criarDependenciasRegistro,
  montarUriRedirecionamento,
  obterClienteOAuth,
  type DependenciasRegistroCliente,
} from './registro-cliente';

/**
 * Tempo máximo esperando o callback. *(inferido)* O valor do original não foi achado
 * ("Login timeout: no callback received within …"); 5 minutos dão tempo de entrar e consentir.
 */
const TEMPO_LIMITE_CALLBACK_MS = 5 * 60 * 1000;
const MILISSEGUNDOS_POR_SEGUNDO = 1000;

const STATUS_OK = 200;
const STATUS_ERRO_PEDIDO = 400;
const STATUS_NAO_ENCONTRADO = 404;
const METODO_GET = 'GET';
const BASE_URL_PEDIDO = `http://${HOST_CALLBACK_OAUTH}`;
const CABECALHOS_PAGINA = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store',
  Connection: 'close',
} as const;

/** Páginas fixas: o texto vindo do servidor nunca entra no HTML (evita injeção). */
const PAGINA_SUCESSO =
  '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Chaos Code</title>' +
  '</head><body><h1>Login concluído</h1><p>Pode fechar esta aba e voltar ao Chaos Code.</p>' +
  '</body></html>';
const PAGINA_ERRO =
  '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Chaos Code</title>' +
  '</head><body><h1>Falha no login</h1><p>Volte ao Chaos Code e tente entrar de novo.</p>' +
  '</body></html>';
const TEXTO_NAO_ENCONTRADO = 'Não encontrado';

/** Por que a autorização falhou. */
export type MotivoErroAutorizacao =
  | 'state_ausente'
  | 'state_invalido'
  | 'erro_oauth'
  | 'codigo_ausente'
  | 'tempo_esgotado'
  | 'navegador'
  | 'servidor_callback';

/** Erro da autorização, com o motivo para a interface decidir a mensagem. */
export class ErroAutorizacao extends Error {
  /**
   * @param motivo - Tipo da falha.
   * @param mensagem - Texto do erro (mesmas ideias dos logs do original).
   * @param causa - Erro original, se houver.
   */
  constructor(
    readonly motivo: MotivoErroAutorizacao,
    mensagem: string,
    causa?: unknown,
  ) {
    super(mensagem, { cause: causa });
    this.name = 'ErroAutorizacao';
  }
}

/** Resultado de um callback: o código recebido ou o erro. */
export type ResultadoCallback = { codigo: string } | { erro: ErroAutorizacao };

/** O que a autorização devolve para a troca do código (CLONE.4.8). */
export interface ResultadoAutorizacao {
  codigo: string;
  code_verifier: string;
  redirect_uri: string;
  cliente: CredenciaisClienteOAuth;
}

/** Dependências injetadas na autorização. */
export interface DependenciasAutorizacao {
  /** Registro do cliente (traz também o servidor e o log). */
  registro: DependenciasRegistroCliente;
  /** Abre a URL no navegador do sistema (no app: `shell.openExternal`). */
  abrirNavegador: (url: string) => Promise<void>;
  /** Gera PKCE e `state` (padrão: pkce.ts). */
  gerarPkce: () => ParametrosPkce;
  tempoLimiteMs: number;
}

/** Dados para montar a URL de autorização. */
export interface DadosUrlAutorizacao {
  urlServidor: string;
  idCliente: string;
  uriRedirecionamento: string;
  pkce: ParametrosPkce;
}

/**
 * Monta a URL da tela de consentimento, com os parâmetros na ordem do original (arq. `0x822cf4`).
 * @param dados - Servidor, cliente, callback e PKCE.
 * @returns URL completa.
 */
export function montarUrlAutorizacao(dados: DadosUrlAutorizacao): string {
  const url = new URL(ROTA_OAUTH_CONSENTIMENTO, `${dados.urlServidor.replace(/\/+$/, '')}/`);
  url.searchParams.set('response_type', TIPO_RESPOSTA_OAUTH);
  url.searchParams.set('client_id', dados.idCliente);
  url.searchParams.set('redirect_uri', dados.uriRedirecionamento);
  url.searchParams.set('code_challenge', dados.pkce.code_challenge);
  url.searchParams.set('code_challenge_method', dados.pkce.code_challenge_method);
  url.searchParams.set('state', dados.pkce.state);
  url.searchParams.set('scope', ESCOPO_OAUTH);
  return url.toString();
}

/**
 * Cria um resultado de erro.
 * @param motivo - Tipo da falha.
 * @param mensagem - Texto do erro.
 * @returns Resultado com o erro.
 */
function falha(motivo: MotivoErroAutorizacao, mensagem: string): ResultadoCallback {
  return { erro: new ErroAutorizacao(motivo, mensagem) };
}

/**
 * Decide o resultado do callback. O `state` é conferido primeiro (antes até do `error`), para que
 * um pedido forjado não consiga nem encerrar o login.
 * @param parametros - `code`, `state`, `error` e `error_description` recebidos.
 * @param stateEsperado - `state` gerado neste login.
 * @returns Código recebido ou erro com motivo.
 */
export function interpretarCallback(
  parametros: ParametrosCallbackOAuth,
  stateEsperado: string,
): ResultadoCallback {
  if (!parametros.state) return falha('state_ausente', 'Parâmetro state ausente no callback');
  if (!compararStateSeguro(stateEsperado, parametros.state)) {
    return falha('state_invalido', 'State inválido: possível ataque CSRF');
  }
  if (parametros.error) {
    const descricao = parametros.error_description ? ` — ${parametros.error_description}` : '';
    return falha('erro_oauth', `OAuth error: ${parametros.error}${descricao}`);
  }
  if (!parametros.code) return falha('codigo_ausente', 'Callback sem o parâmetro code');
  return { codigo: parametros.code };
}

/**
 * Lê `code`, `state`, `error` e `error_description` da URL do pedido (primeiro valor de cada).
 * @param url - Endereço do pedido já interpretado.
 * @returns Parâmetros do callback.
 */
export function lerParametrosCallback(url: URL): ParametrosCallbackOAuth {
  const valor = (nome: string): string | undefined => url.searchParams.get(nome) ?? undefined;
  return {
    code: valor('code'),
    state: valor('state'),
    error: valor('error'),
    error_description: valor('error_description'),
  };
}

/** Servidor HTTP local que espera um único callback (`auth::callback`). */
export class ServidorCallback {
  private readonly servidor: http.Server;
  private temporizador: NodeJS.Timeout | null = null;
  private concluido = false;
  private aoConcluir: (resultado: ResultadoCallback) => void = () => undefined;
  /** Promessa do código; rejeita com {@link ErroAutorizacao}. */
  readonly resultado: Promise<string>;

  /**
   * @param stateEsperado - `state` deste login.
   * @param tempoLimiteMs - Tempo máximo esperando o callback.
   */
  constructor(
    private readonly stateEsperado: string,
    private readonly tempoLimiteMs: number,
  ) {
    this.servidor = http.createServer((pedido, resposta) => this.tratarPedido(pedido, resposta));
    this.resultado = new Promise<string>((resolver, rejeitar) => {
      this.aoConcluir = (resultado) =>
        'codigo' in resultado ? resolver(resultado.codigo) : rejeitar(resultado.erro);
    });
    // Evita aviso de rejeição sem tratamento antes de quem chamou aguardar o resultado.
    this.resultado.catch(() => undefined);
  }

  /**
   * Começa a escutar em `127.0.0.1:0` e liga o tempo limite.
   * @returns Porta escolhida pelo sistema.
   * @throws {ErroAutorizacao} Se o servidor não puder escutar (`servidor_callback`).
   */
  async iniciar(): Promise<number> {
    await new Promise<void>((resolver, rejeitar) => {
      this.servidor.once('error', (erro) => {
        const mensagem = `Falha ao iniciar callback server: ${erro.message}`;
        rejeitar(new ErroAutorizacao('servidor_callback', mensagem, erro));
      });
      this.servidor.listen(PORTA_CALLBACK_OAUTH, HOST_CALLBACK_OAUTH, () => resolver());
    });
    const segundos = Math.ceil(this.tempoLimiteMs / MILISSEGUNDOS_POR_SEGUNDO);
    this.temporizador = setTimeout(() => {
      const mensagem = `Login timeout: no callback received within ${segundos}s`;
      this.concluir({ erro: new ErroAutorizacao('tempo_esgotado', mensagem) });
    }, this.tempoLimiteMs);
    return (this.servidor.address() as AddressInfo).port;
  }

  /**
   * Responde um pedido: só `GET /callback` conta; o resto recebe 404.
   * @param pedido - Pedido HTTP.
   * @param resposta - Resposta HTTP.
   */
  private tratarPedido(pedido: http.IncomingMessage, resposta: http.ServerResponse): void {
    const url = new URL(pedido.url ?? '/', BASE_URL_PEDIDO);
    const ehCallback = pedido.method === METODO_GET && url.pathname === CAMINHO_CALLBACK_OAUTH;
    if (!ehCallback || this.concluido) {
      resposta.writeHead(STATUS_NAO_ENCONTRADO, CABECALHOS_PAGINA).end(TEXTO_NAO_ENCONTRADO);
      return;
    }

    const resultado = interpretarCallback(lerParametrosCallback(url), this.stateEsperado);
    const deuCerto = 'codigo' in resultado;
    resposta
      .writeHead(deuCerto ? STATUS_OK : STATUS_ERRO_PEDIDO, CABECALHOS_PAGINA)
      .end(deuCerto ? PAGINA_SUCESSO : PAGINA_ERRO);
    this.concluir(resultado);
  }

  /**
   * Entrega o resultado uma única vez e desliga o tempo limite.
   * @param resultado - Código ou erro.
   */
  private concluir(resultado: ResultadoCallback): void {
    if (this.concluido) return;

    this.concluido = true;
    if (this.temporizador) clearTimeout(this.temporizador);
    this.aoConcluir(resultado);
  }

  /**
   * Encerra o servidor (as conexões fecham sozinhas pelo `Connection: close`).
   * @returns Promessa resolvida quando o servidor parar.
   */
  async fechar(): Promise<void> {
    this.concluir({ erro: new ErroAutorizacao('servidor_callback', 'Callback server stopped') });
    if (!this.servidor.listening) return;

    await new Promise<void>((resolver) => {
      this.servidor.close(() => resolver());
      this.servidor.closeIdleConnections();
    });
  }
}

/**
 * Abre a URL no navegador; falha vira {@link ErroAutorizacao} com motivo `navegador`.
 * @param dependencias - Função de abrir navegador e log.
 * @param url - URL de autorização.
 * @returns Promessa resolvida quando o navegador foi chamado.
 * @throws {ErroAutorizacao} Se não for possível abrir.
 */
async function abrirTelaConsentimento(
  dependencias: DependenciasAutorizacao,
  url: string,
): Promise<void> {
  dependencias.registro.registrarLog(`Abrindo navegador para autorização: ${url}`);
  try {
    await dependencias.abrirNavegador(url);
  } catch (erro) {
    const mensagem = `Falha ao abrir navegador: ${(erro as Error)?.message ?? erro}`;
    throw new ErroAutorizacao('navegador', mensagem, erro);
  }
}

/**
 * Faz a parte do navegador do login: callback, cliente, consentimento e conferência do `state`.
 * @param dependencias - Registro, navegador, PKCE e tempo limite.
 * @returns Código, `code_verifier`, `redirect_uri` e cliente, prontos para a troca do código.
 * @throws {ErroAutorizacao} State ausente ou diferente, erro OAuth, tempo esgotado, navegador.
 * @throws {Error} Erro do registro do cliente (`ErroRegistroCliente`).
 */
export async function autorizarNoNavegador(
  dependencias: DependenciasAutorizacao,
): Promise<ResultadoAutorizacao> {
  const pkce = dependencias.gerarPkce();
  const callback = new ServidorCallback(pkce.state, dependencias.tempoLimiteMs);
  try {
    const porta = await callback.iniciar();
    dependencias.registro.registrarLog(`Callback server escutando na porta ${porta}`);
    const uriRedirecionamento = montarUriRedirecionamento(porta);
    const cliente = await obterClienteOAuth(dependencias.registro, uriRedirecionamento);
    const url = montarUrlAutorizacao({
      urlServidor: dependencias.registro.urlServidor,
      idCliente: cliente.client_id,
      uriRedirecionamento,
      pkce,
    });
    await abrirTelaConsentimento(dependencias, url);
    const codigo = await callback.resultado;
    return {
      codigo,
      code_verifier: pkce.code_verifier,
      redirect_uri: uriRedirecionamento,
      cliente,
    };
  } finally {
    await callback.fechar();
  }
}

/**
 * Monta as dependências reais da autorização.
 * @param urlServidor - Endereço do servidor.
 * @param pastaDados - Pasta de dados do app (onde fica `oauth_client.json`).
 * @param abrirNavegador - Abre a URL no navegador do sistema (no app: `shell.openExternal`).
 * @returns Dependências prontas para {@link autorizarNoNavegador}.
 */
export function criarDependenciasAutorizacao(
  urlServidor: string,
  pastaDados: string,
  abrirNavegador: (url: string) => Promise<void>,
): DependenciasAutorizacao {
  return {
    registro: criarDependenciasRegistro(urlServidor, pastaDados),
    abrirNavegador,
    gerarPkce: () => gerarParametrosPkce(),
    tempoLimiteMs: TEMPO_LIMITE_CALLBACK_MS,
  };
}
