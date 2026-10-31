/**
 * Cliente HTTP base da API da plataforma (docs/inventario/api.md, "Regras comuns"): põe o
 * `Authorization: Bearer`, troca JSON de ida e volta, aplica tempo limite, renova o token uma vez
 * no 401 e padroniza os erros. O token nunca entra em mensagem de erro nem em log.
 */
import type { ProvedorLogin } from '../login/contrato';

const TEMPO_LIMITE_PEDIDO_MS = 30_000;
const TIPO_CONTEUDO_JSON = 'application/json';
const BARRAS_FINAIS = /\/+$/;
const STATUS_NAO_AUTORIZADO = 401;
const STATUS_ERRO_SERVIDOR_MINIMO = 500;
const LIMITE_TEXTO_CORPO = 500;

const MSG_SEM_SESSAO = 'Sessão expirada. Faça login novamente.';
const MSG_TEMPO_ESGOTADO = 'Tempo esgotado ao falar com o servidor';
const MSG_REDE = 'Erro na comunicação com o servidor';
const MSG_RESPOSTA_INVALIDA = 'Resposta inválida do servidor';
const MSG_PADRAO_HTTP = 'Erro na comunicação com o servidor';

/** Mensagens por status HTTP (api.md, "Erros HTTP → mensagem"). */
const MENSAGENS_POR_STATUS: Readonly<Record<number, string>> = {
  400: 'Dados inválidos enviados ao servidor.',
  401: MSG_SEM_SESSAO,
  403: 'Acesso negado. Verifique suas permissões.',
  404: 'Recurso não encontrado.',
  409: 'Conflito: a operação não pode ser concluída.',
  422: 'Dados inválidos enviados ao servidor.',
  429: 'Muitas requisições. Aguarde alguns segundos.',
};
const MSG_ERRO_SERVIDOR = 'Erro no servidor. Tente novamente em instantes.';

/** Métodos HTTP usados pela API. */
export type MetodoHttp = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Motivo do erro, para quem chama decidir o que mostrar. */
export type TipoErroApi = 'http' | 'rede' | 'tempo_esgotado' | 'resposta_invalida' | 'sem_sessao';

/** Erro padronizado do cliente HTTP, sem o token no texto. */
export class ErroApi extends Error {
  /**
   * @param tipo - Motivo do erro.
   * @param mensagem - Texto para o usuário.
   * @param status - Status HTTP, quando houve resposta.
   * @param causa - Erro original, quando houver.
   */
  constructor(
    readonly tipo: TipoErroApi,
    mensagem: string,
    readonly status?: number,
    causa?: unknown,
  ) {
    super(mensagem, { cause: causa });
    this.name = 'ErroApi';
  }
}

/** Dependências injetadas no cliente. */
export interface DependenciasClienteHttp {
  /** `fetch` usado nos pedidos (o nativo do Node 22, ou um falso na conferência). */
  buscar: typeof fetch;
  /** Endereço base do servidor (ex.: `https://chaoscode.ai`). */
  urlServidor: string;
  /** Provedor de login: dá o token válido e renova no 401. */
  login: Pick<ProvedorLogin, 'obterTokenAcesso' | 'renovar'>;
  /** Tempo limite por pedido em ms (padrão: `TEMPO_LIMITE_PEDIDO_MS`). */
  tempoLimiteMs?: number;
}

/** Dados de um pedido. */
export interface PedidoHttp {
  metodo: MetodoHttp;
  /** Caminho com a barra inicial, já com a query (ex.: `/api/projects/1/tasks?limit=20`). */
  caminho: string;
  /** Corpo, enviado como JSON. */
  corpo?: unknown;
}

/** Cliente HTTP oferecido às APIs de projetos, tarefas, imagens e modelos. */
export interface ClienteHttp {
  /**
   * Faz o pedido autenticado e devolve o JSON da resposta.
   * @throws {ErroApi} Erro de rede, tempo esgotado, HTTP ou resposta inválida.
   */
  requisitar<T>(pedido: PedidoHttp): Promise<T>;
}

/**
 * Escolhe a mensagem do erro HTTP pelo status.
 * @param status - Status da resposta.
 * @returns Texto padronizado.
 */
function mensagemDoStatus(status: number): string {
  const mensagem = MENSAGENS_POR_STATUS[status];
  if (mensagem) return mensagem;
  if (status >= STATUS_ERRO_SERVIDOR_MINIMO) return MSG_ERRO_SERVIDOR;
  return `${MSG_PADRAO_HTTP} (${status})`;
}

/**
 * Lê o corpo da resposta como JSON; corpo vazio vira `undefined`.
 * @param resposta - Resposta do `fetch`.
 * @returns Objeto lido.
 * @throws {ErroApi} `resposta_invalida` se o corpo não for JSON.
 */
async function lerJson(resposta: Response): Promise<unknown> {
  const texto = await resposta.text();
  if (!texto) return undefined;
  try {
    return JSON.parse(texto) as unknown;
  } catch (erro) {
    const trecho = texto.slice(0, LIMITE_TEXTO_CORPO);
    throw new ErroApi('resposta_invalida', `${MSG_RESPOSTA_INVALIDA}: ${trecho}`, undefined, erro);
  }
}

/**
 * Executa um único pedido com tempo limite.
 * @param pedido - Método, caminho e corpo.
 * @param token - Access token do cabeçalho.
 * @param dependencias - `fetch`, servidor e tempo limite.
 * @returns Resposta crua do `fetch`.
 * @throws {ErroApi} `tempo_esgotado` ou `rede` (a mensagem não traz o token).
 */
async function enviarUmPedido(
  pedido: PedidoHttp,
  token: string,
  dependencias: DependenciasClienteHttp,
): Promise<Response> {
  const url = `${dependencias.urlServidor.replace(BARRAS_FINAIS, '')}${pedido.caminho}`;
  const limite = dependencias.tempoLimiteMs ?? TEMPO_LIMITE_PEDIDO_MS;
  const sinal = AbortSignal.timeout(limite);
  const temCorpo = pedido.corpo !== undefined;
  const cabecalhos: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: TIPO_CONTEUDO_JSON,
  };
  if (temCorpo) cabecalhos['Content-Type'] = TIPO_CONTEUDO_JSON;

  try {
    return await dependencias.buscar(url, {
      method: pedido.metodo,
      headers: cabecalhos,
      body: temCorpo ? JSON.stringify(pedido.corpo) : undefined,
      signal: sinal,
    });
  } catch (erro) {
    if (sinal.aborted) throw new ErroApi('tempo_esgotado', MSG_TEMPO_ESGOTADO, undefined, erro);
    throw new ErroApi('rede', MSG_REDE, undefined, erro);
  }
}

/**
 * Obtém o token de acesso ou falha com `sem_sessao`.
 * @param obterToken - Função que devolve o token (ou null se não houver sessão).
 * @returns Token de acesso.
 * @throws {ErroApi} `sem_sessao` quando não há token.
 */
async function exigirToken(obterToken: () => Promise<string | null>): Promise<string> {
  const token = await obterToken();
  if (!token) throw new ErroApi('sem_sessao', MSG_SEM_SESSAO, STATUS_NAO_AUTORIZADO);
  return token;
}

/**
 * Renova o token pelo provedor; falha na renovação vira `sem_sessao`.
 * @param login - Provedor de login.
 * @returns Access token novo.
 * @throws {ErroApi} `sem_sessao` se a renovação falhar.
 */
async function renovarToken(login: DependenciasClienteHttp['login']): Promise<string> {
  try {
    return (await login.renovar()).access_token;
  } catch (erro) {
    throw new ErroApi('sem_sessao', MSG_SEM_SESSAO, STATUS_NAO_AUTORIZADO, erro);
  }
}

/**
 * Cria o cliente HTTP. No 401, renova o token uma vez e repete o pedido.
 * @param dependencias - `fetch`, servidor, provedor de login e tempo limite.
 * @returns Cliente com `requisitar`.
 */
export function criarClienteHttp(dependencias: DependenciasClienteHttp): ClienteHttp {
  return {
    async requisitar<T>(pedido: PedidoHttp): Promise<T> {
      const token = await exigirToken(() => dependencias.login.obterTokenAcesso());
      let resposta = await enviarUmPedido(pedido, token, dependencias);

      if (resposta.status === STATUS_NAO_AUTORIZADO) {
        const tokenNovo = await renovarToken(dependencias.login);
        resposta = await enviarUmPedido(pedido, tokenNovo, dependencias);
      }
      if (!resposta.ok) {
        throw new ErroApi('http', mensagemDoStatus(resposta.status), resposta.status);
      }
      return (await lerJson(resposta)) as T;
    },
  };
}
