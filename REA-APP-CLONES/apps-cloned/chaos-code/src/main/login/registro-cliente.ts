/**
 * Registro dinâmico do cliente OAuth: recria o `auth::oauth` do original
 * (docs/inventario/login.md, passo 3; api.md, `/api/oauth/register`; arquivos-locais.md,
 * `oauth_client.json`).
 *
 * Como o original: lê `oauth_client.json`; se o `redirect_uri` (que muda com a porta do callback)
 * e o servidor forem os mesmos, reaproveita o cliente; senão registra um cliente público novo e
 * grava o arquivo de forma atômica (`.tmp` + renomear).
 */
import os from 'node:os';
import path from 'node:path';

import {
  ARQUIVO_CLIENTE_OAUTH,
  CAMINHO_CALLBACK_OAUTH,
  CONCESSOES_OAUTH,
  HOST_CALLBACK_OAUTH,
  METODO_AUTENTICACAO_TOKEN_OAUTH,
  PREFIXO_NOME_CLIENTE_OAUTH,
  ROTA_OAUTH_REGISTRO,
  TIPO_APLICACAO_OAUTH,
  TIPO_RESPOSTA_OAUTH,
} from '../../compartilhado/constantes';
import type {
  CredenciaisClienteOAuth,
  PedidoRegistroCliente,
} from '../../compartilhado/tipos-login';
import { criarArquivosNode, type ArquivosAparelho } from './aparelho';

const SUFIXO_TEMPORARIO = '.tmp';
const ESPACOS_IDENTACAO_JSON = 2;
const METODO_POST = 'POST';
const TIPO_CONTEUDO_JSON = 'application/json';
const PROTOCOLO_CALLBACK = 'http://';
const PORTA_MINIMA = 1;
const PORTA_MAXIMA = 65_535;
const LIMITE_TEXTO_ERRO = 500;
const BARRAS_FINAIS = /\/+$/;

/** Acesso a arquivos (mesmo contrato do aparelho: ler, gravar, renomear, criar pasta). */
export type ArquivosClienteOAuth = ArquivosAparelho;

/** Dependências injetadas no registro do cliente. */
export interface DependenciasRegistroCliente {
  /** `fetch` usado nos pedidos (o nativo do Node 22, ou um falso na conferência). */
  buscar: typeof fetch;
  /** Endereço base do servidor (ex.: `http://localhost:3000`). */
  urlServidor: string;
  /** Pasta onde fica o `oauth_client.json`. */
  pastaDados: string;
  arquivos: ArquivosClienteOAuth;
  /** Complemento do `client_name` (o nome do computador). */
  nomeAparelho: string;
  /** Recebe as mensagens de log (as mesmas ideias dos logs do original). */
  registrarLog: (mensagem: string) => void;
}

/** Erro do registro, com o status e o corpo devolvidos pelo servidor quando houver. */
export class ErroRegistroCliente extends Error {
  /**
   * @param mensagem - Texto do erro, já com o detalhe do servidor.
   * @param status - Status HTTP, ou null se o servidor não respondeu.
   * @param corpoResposta - Corpo da resposta (cortado), ou null.
   * @param causa - Erro original, se houver.
   */
  constructor(
    mensagem: string,
    readonly status: number | null,
    readonly corpoResposta: string | null,
    causa?: unknown,
  ) {
    super(mensagem, { cause: causa });
    this.name = 'ErroRegistroCliente';
  }
}

/**
 * Tira as barras do fim do endereço, para comparar e montar URLs sem `//`.
 * @param url - Endereço do servidor.
 * @returns Endereço sem barra final.
 */
function normalizarUrlServidor(url: string): string {
  return url.trim().replace(BARRAS_FINAIS, '');
}

/**
 * Monta o `redirect_uri` do callback local: `http://127.0.0.1:<porta>/callback`.
 * @param porta - Porta que o servidor de callback recebeu do sistema.
 * @returns URI de redirecionamento.
 * @throws {RangeError} Se a porta não for um inteiro de 1 a 65535.
 */
export function montarUriRedirecionamento(porta: number): string {
  const portaValida = Number.isInteger(porta) && porta >= PORTA_MINIMA && porta <= PORTA_MAXIMA;
  if (!portaValida) throw new RangeError(`Porta de callback inválida: ${porta}`);

  return `${PROTOCOLO_CALLBACK}${HOST_CALLBACK_OAUTH}:${porta}${CAMINHO_CALLBACK_OAUTH}`;
}

/**
 * Monta o corpo do `POST /api/oauth/register` (cliente público, sem segredo).
 * @param uriRedirecionamento - Callback local deste login.
 * @param nomeAparelho - Complemento do nome do cliente.
 * @returns Pedido de registro.
 */
export function montarPedidoRegistro(
  uriRedirecionamento: string,
  nomeAparelho: string,
): PedidoRegistroCliente {
  return {
    client_name: `${PREFIXO_NOME_CLIENTE_OAUTH}${nomeAparelho}`,
    redirect_uris: [uriRedirecionamento],
    grant_types: [...CONCESSOES_OAUTH],
    response_types: [TIPO_RESPOSTA_OAUTH],
    token_endpoint_auth_method: METODO_AUTENTICACAO_TOKEN_OAUTH,
    application_type: TIPO_APLICACAO_OAUTH,
  };
}

/**
 * Caminho do `oauth_client.json` na pasta de dados.
 * @param pastaDados - Pasta de dados do app.
 * @returns Caminho do arquivo.
 */
function caminhoArquivoCliente(pastaDados: string): string {
  return path.join(pastaDados, ARQUIVO_CLIENTE_OAUTH);
}

/**
 * Confere se o valor lido tem os 3 campos de texto do `OAuthClientCredentials`.
 * @param valor - JSON lido do arquivo.
 * @returns true se for um cliente salvo válido.
 */
function ehCredenciaisValidas(valor: unknown): valor is CredenciaisClienteOAuth {
  if (typeof valor !== 'object' || valor === null) return false;

  const campos = valor as Record<string, unknown>;
  const temCampos = ['client_id', 'platform_url', 'redirect_uri'].every(
    (campo) => typeof campos[campo] === 'string' && (campos[campo] as string).length > 0,
  );
  return temCampos;
}

/**
 * Lê o cliente salvo em `oauth_client.json`.
 * @param dependencias - Pasta de dados, arquivos e log.
 * @returns Cliente salvo, ou null se o arquivo faltar ou for inválido (aí registra outro).
 * @throws {Error} Se o arquivo existir mas não puder ser lido.
 */
export async function lerClienteSalvo(
  dependencias: DependenciasRegistroCliente,
): Promise<CredenciaisClienteOAuth | null> {
  const caminho = caminhoArquivoCliente(dependencias.pastaDados);
  const texto = await dependencias.arquivos.lerTexto(caminho);
  if (texto === null) return null;

  try {
    const valor: unknown = JSON.parse(texto);
    if (ehCredenciaisValidas(valor)) return valor;
  } catch {
    // JSON quebrado cai no aviso abaixo: o cliente é registrado de novo.
  }
  dependencias.registrarLog(`${ARQUIVO_CLIENTE_OAUTH} inválido; um cliente novo será registrado`);
  return null;
}

/**
 * Grava o cliente em `oauth_client.json` de forma atômica (`.tmp` e depois renomear).
 * @param dependencias - Pasta de dados e arquivos.
 * @param credenciais - Cliente a gravar.
 * @returns Promessa resolvida depois de renomear.
 * @throws {Error} Se a pasta não puder ser criada ou o arquivo gravado.
 */
export async function gravarClienteSalvo(
  dependencias: DependenciasRegistroCliente,
  credenciais: CredenciaisClienteOAuth,
): Promise<void> {
  const destino = caminhoArquivoCliente(dependencias.pastaDados);
  const temporario = `${destino}${SUFIXO_TEMPORARIO}`;
  const conteudo = JSON.stringify(credenciais, null, ESPACOS_IDENTACAO_JSON);

  await dependencias.arquivos.criarPasta(dependencias.pastaDados);
  await dependencias.arquivos.gravarTexto(temporario, conteudo);
  await dependencias.arquivos.renomear(temporario, destino);
}

/**
 * Diz se o cliente salvo serve para este login (mesmo servidor e mesmo `redirect_uri`).
 * @param salvo - Cliente lido do arquivo, ou null.
 * @param uriRedirecionamento - Callback deste login.
 * @param urlServidor - Servidor em uso.
 * @returns true se dá para reaproveitar.
 */
export function podeReaproveitarCliente(
  salvo: CredenciaisClienteOAuth | null,
  uriRedirecionamento: string,
  urlServidor: string,
): salvo is CredenciaisClienteOAuth {
  if (salvo === null) return false;

  const mesmoServidor =
    normalizarUrlServidor(salvo.platform_url) === normalizarUrlServidor(urlServidor);
  return mesmoServidor && salvo.redirect_uri === uriRedirecionamento;
}

/**
 * Tira o `client_id` da resposta: o original lê `{ data: { client_id } }` e o servidor local
 * (RFC 7591) devolve `{ client_id }` direto; aceita os dois.
 * @param corpo - JSON da resposta.
 * @returns client_id, ou null se não houver.
 */
export function extrairIdCliente(corpo: unknown): string | null {
  if (typeof corpo !== 'object' || corpo === null) return null;

  const raiz = corpo as Record<string, unknown>;
  const dados = typeof raiz.data === 'object' && raiz.data !== null ? raiz.data : raiz;
  const idCliente = (dados as Record<string, unknown>).client_id;
  return typeof idCliente === 'string' && idCliente.length > 0 ? idCliente : null;
}

/**
 * Monta a mensagem de erro com o detalhe do servidor (`error_description`, `error`, `message`
 * ou o texto cru).
 * @param status - Status HTTP.
 * @param texto - Corpo da resposta.
 * @returns Mensagem legível.
 */
function montarMensagemErro(status: number, texto: string): string {
  let detalhe = texto.slice(0, LIMITE_TEXTO_ERRO);
  try {
    const corpo = JSON.parse(texto) as Record<string, unknown>;
    const campo = [corpo.error_description, corpo.error, corpo.message].find(
      (valor) => typeof valor === 'string' && valor.length > 0,
    );
    if (typeof campo === 'string') detalhe = campo;
  } catch {
    // Corpo não é JSON: fica o texto cru.
  }
  return `Registro OAuth falhou (${status}): ${detalhe || 'resposta vazia'}`;
}

/**
 * Envia o `POST` de registro e devolve a resposta HTTP.
 * @param dependencias - fetch e servidor.
 * @param pedido - Corpo do registro.
 * @returns Resposta do servidor.
 * @throws {ErroRegistroCliente} Se o servidor não puder ser alcançado.
 */
async function enviarPedidoRegistro(
  dependencias: DependenciasRegistroCliente,
  pedido: PedidoRegistroCliente,
): Promise<Response> {
  const url = `${normalizarUrlServidor(dependencias.urlServidor)}${ROTA_OAUTH_REGISTRO}`;
  const uriRedirecionamento = pedido.redirect_uris[0];
  dependencias.registrarLog(
    `Registrando client OAuth em ${url} com redirect_uri=${uriRedirecionamento}`,
  );
  try {
    return await dependencias.buscar(url, {
      method: METODO_POST,
      headers: { 'Content-Type': TIPO_CONTEUDO_JSON, Accept: TIPO_CONTEUDO_JSON },
      body: JSON.stringify(pedido),
    });
  } catch (erro) {
    const mensagem = `Plataforma inacessível em ${url}: ${(erro as Error)?.message ?? erro}`;
    throw new ErroRegistroCliente(mensagem, null, null, erro);
  }
}

/**
 * Registra um cliente público novo no servidor (`POST /api/oauth/register`).
 * @param dependencias - fetch, servidor, nome do aparelho e log.
 * @param uriRedirecionamento - Callback deste login.
 * @returns Credenciais do cliente novo (ainda não gravadas).
 * @throws {ErroRegistroCliente} Se o servidor recusar, responder sem `client_id` ou não responder.
 */
export async function registrarCliente(
  dependencias: DependenciasRegistroCliente,
  uriRedirecionamento: string,
): Promise<CredenciaisClienteOAuth> {
  const pedido = montarPedidoRegistro(uriRedirecionamento, dependencias.nomeAparelho);
  const resposta = await enviarPedidoRegistro(dependencias, pedido);
  const texto = await resposta.text();
  if (!resposta.ok) {
    const mensagem = montarMensagemErro(resposta.status, texto);
    throw new ErroRegistroCliente(mensagem, resposta.status, texto);
  }

  let corpo: unknown = null;
  try {
    corpo = JSON.parse(texto);
  } catch {
    // Corpo inválido cai no erro de client_id ausente.
  }
  const idCliente = extrairIdCliente(corpo);
  if (idCliente === null) {
    const trecho = texto.slice(0, LIMITE_TEXTO_ERRO);
    const mensagem = `Registro OAuth sem client_id na resposta: ${trecho}`;
    throw new ErroRegistroCliente(mensagem, resposta.status, texto);
  }

  dependencias.registrarLog(`Client OAuth registrado: ${idCliente}`);
  return {
    client_id: idCliente,
    platform_url: normalizarUrlServidor(dependencias.urlServidor),
    redirect_uri: uriRedirecionamento,
  };
}

/**
 * Devolve o cliente OAuth deste login: reaproveita o salvo se o `redirect_uri` e o servidor
 * baterem; senão registra outro e grava `oauth_client.json`.
 * @param dependencias - Dependências do registro.
 * @param uriRedirecionamento - Callback deste login (de {@link montarUriRedirecionamento}).
 * @returns Cliente a usar na autorização e na troca do código.
 * @throws {ErroRegistroCliente} Se o registro falhar.
 * @throws {Error} Se o arquivo não puder ser lido ou gravado.
 */
export async function obterClienteOAuth(
  dependencias: DependenciasRegistroCliente,
  uriRedirecionamento: string,
): Promise<CredenciaisClienteOAuth> {
  const salvo = await lerClienteSalvo(dependencias);
  if (podeReaproveitarCliente(salvo, uriRedirecionamento, dependencias.urlServidor)) {
    dependencias.registrarLog(`Reutilizando client OAuth em cache: ${salvo.client_id}`);
    return salvo;
  }

  if (salvo !== null) {
    dependencias.registrarLog('redirect_uri mudou, registrando novo client OAuth...');
  } else {
    dependencias.registrarLog('Iniciando registro dinâmico do client OAuth...');
  }
  const novo = await registrarCliente(dependencias, uriRedirecionamento);
  await gravarClienteSalvo(dependencias, novo);
  return novo;
}

/**
 * Monta as dependências reais: `fetch` nativo, arquivos do Node e nome do computador.
 * @param urlServidor - Endereço do servidor.
 * @param pastaDados - Pasta de dados do app.
 * @returns Dependências prontas para {@link obterClienteOAuth}.
 */
export function criarDependenciasRegistro(
  urlServidor: string,
  pastaDados: string,
): DependenciasRegistroCliente {
  return {
    buscar: (...argumentos) => fetch(...argumentos),
    urlServidor,
    pastaDados,
    arquivos: criarArquivosNode(),
    nomeAparelho: os.hostname(),
    registrarLog: (mensagem) => console.info(`[login] ${mensagem}`),
  };
}
