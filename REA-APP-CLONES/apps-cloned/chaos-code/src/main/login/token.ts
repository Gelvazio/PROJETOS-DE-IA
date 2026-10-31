/**
 * Troca do código e renovação do token em `/api/oauth/token`: recria o `auth::oauth` do original
 * (docs/inventario/login.md, passo 8 e "Renovação"; api.md, rota `/api/oauth/token`).
 *
 * - Corpo em **JSON**, como o original: o texto `application/json` (arq. `0x80d86e`) é usado
 *   pelas mesmas funções POST do `auth::oauth` listadas no api.md (VA `0x1400a020b`,
 *   `0x1400a0bbf`, `0x1400a2803`, `0x1400a3c41`, `0x1400a933a`).
 * - `expires_at` em **segundos Unix**: a interface original faz `1e3 * expiresAt - 3e5 - agora`
 *   (`docs/original/assets/index-Ct94erbr.js`), ou seja, segundos e renovação 5 min antes.
 * - `invalid_grant` na renovação = sessão perdida: apaga o cofre e avisa. Rede fora não apaga nada.
 * - Renovações simultâneas viram uma só (o refresh token gira: duas renovações com o mesmo
 *   token fariam a segunda falhar com `invalid_grant` e derrubar a sessão).
 * - Os 5 campos `device_*` vão junto da troca do código, quando informados *(inferido: o
 *   original monta `device_uuid` dentro do `start_login`, VA `0x1400a723f`, depois do callback)*.
 */
import { ROTA_OAUTH_TOKEN } from '../../compartilhado/constantes';
import type { PedidoToken } from '../../compartilhado/tipos-api';
import type { TokensGuardados } from '../../compartilhado/tipos-login';
import type { IdentificacaoAparelho } from './aparelho';
import type { CofreTokens } from './cofre-tokens';

/** Renova quando faltar isto ou menos para vencer (o original usa 3e5 ms = 5 min). */
export const MARGEM_RENOVACAO_SEGUNDOS = 5 * 60;

const MILISSEGUNDOS_POR_SEGUNDO = 1000;
const METODO_POST = 'POST';
const TIPO_CONTEUDO_JSON = 'application/json';
const CODIGO_CONCESSAO_INVALIDA = 'invalid_grant';
const LIMITE_TEXTO_ERRO = 500;
const BARRAS_FINAIS = /\/+$/;

const MSG_REDE = 'Não foi possível falar com o servidor de login';
const MSG_SERVIDOR = 'Erro do servidor de login';
const MSG_RESPOSTA_INVALIDA = 'Resposta de token inválida do servidor';
const MSG_SEM_SESSAO = 'Nenhum refresh token disponível';
const MSG_SESSAO_PERDIDA = 'Sessão expirada. Faça login novamente.';
const LOG_TROCANDO = 'Trocando código por tokens em';
const LOG_RENOVACAO_OK = 'Renovação automática de token bem-sucedida';
const LOG_RENOVACAO_FALHOU = 'Renovação automática falhou';

/** Motivo de um erro de token, para quem chama decidir o que mostrar. */
export type TipoErroToken =
  | 'rede'
  | 'servidor'
  | 'resposta_invalida'
  | 'sem_sessao'
  | 'sessao_perdida';

/** Erro da troca ou da renovação, sem os tokens no texto. */
export class ErroToken extends Error {
  /**
   * @param tipo - Motivo do erro.
   * @param mensagem - Texto do erro.
   * @param detalhes - Status HTTP, código OAuth (`error`) e erro original, quando houver.
   */
  constructor(
    readonly tipo: TipoErroToken,
    mensagem: string,
    readonly detalhes: { status?: number; codigoOAuth?: string; causa?: unknown } = {},
  ) {
    super(mensagem, { cause: detalhes.causa });
    this.name = 'ErroToken';
  }
}

/** Dependências injetadas no serviço de token. */
export interface DependenciasToken {
  /** `fetch` usado nos pedidos (o nativo do Node 22, ou um falso na conferência). */
  buscar: typeof fetch;
  /** Endereço base do servidor (ex.: `http://localhost:3000`). */
  urlServidor: string;
  /** `client_id` do cliente registrado (`oauth_client.json`). */
  idCliente: string;
  /** Cofre onde os tokens ficam cifrados. */
  cofre: Pick<CofreTokens, 'gravar' | 'ler' | 'apagar'>;
  /** Relógio em milissegundos (padrão: `Date.now`). */
  relogio?: () => number;
  /** Recebe as mensagens de log (sem tokens). */
  registrarLog: (mensagem: string) => void;
  /** Chamado quando a sessão é perdida (ex.: para disparar `auth:invalid` na interface). */
  aoPerderSessao?: () => void;
}

/** Dados da troca do código, vindos do callback e do PKCE. */
export interface DadosTrocaCodigo {
  code: string;
  redirectUri: string;
  codeVerifier: string;
  /** Os 5 campos `device_*`, enviados junto da troca (opcional). */
  aparelho?: IdentificacaoAparelho;
}

/** Operações de token oferecidas ao login. */
export interface ServicoToken {
  trocarCodigo(dados: DadosTrocaCodigo): Promise<TokensGuardados>;
  renovar(): Promise<TokensGuardados>;
  obterTokenAcessoValido(): Promise<string | null>;
}

/** Campos da resposta de token que o cliente usa (`TokenResponse`, 4 campos). */
interface CamposRespostaToken {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

/**
 * Converte o relógio (ms) em segundos Unix inteiros.
 * @param relogio - Relógio em milissegundos.
 * @returns Segundos desde 1970-01-01 UTC.
 */
function agoraEmSegundos(relogio: () => number): number {
  return Math.floor(relogio() / MILISSEGUNDOS_POR_SEGUNDO);
}

/**
 * Calcula o `expires_at` a partir do `expires_in` da resposta.
 * @param expiraEmSegundos - Validade informada pelo servidor.
 * @param relogio - Relógio em milissegundos.
 * @returns Instante de vencimento em segundos Unix.
 */
export function calcularExpiraEm(expiraEmSegundos: number, relogio: () => number): number {
  return agoraEmSegundos(relogio) + expiraEmSegundos;
}

/**
 * Diz se o token deve ser renovado agora (vencido ou dentro da margem).
 * @param tokens - Tokens guardados.
 * @param relogio - Relógio em milissegundos.
 * @returns true se faltar `MARGEM_RENOVACAO_SEGUNDOS` ou menos para vencer.
 */
export function precisaRenovar(tokens: TokensGuardados, relogio: () => number): boolean {
  return tokens.expires_at - agoraEmSegundos(relogio) <= MARGEM_RENOVACAO_SEGUNDOS;
}

/**
 * Lê o corpo da resposta como JSON, sem lançar erro.
 * @param resposta - Resposta do `fetch`.
 * @returns Objeto lido, ou null se o corpo não for JSON.
 */
async function lerCorpoJson(resposta: Response): Promise<unknown> {
  try {
    return (await resposta.json()) as unknown;
  } catch {
    return null;
  }
}

/**
 * Tira os campos da resposta de token. Aceita o formato do OAuth direto ou dentro de `data`
 * (envelope `{ success, data }` da API do original).
 * @param corpo - Corpo JSON da resposta.
 * @returns Campos usados, ou null se faltar `access_token` ou `expires_in`.
 */
function extrairCamposToken(corpo: unknown): CamposRespostaToken | null {
  if (typeof corpo !== 'object' || corpo === null) return null;

  const envelope = corpo as { data?: unknown };
  const campos = (typeof envelope.data === 'object' && envelope.data !== null
    ? envelope.data
    : corpo) as Partial<Record<keyof CamposRespostaToken, unknown>>;
  const temAcesso = typeof campos.access_token === 'string' && campos.access_token.length > 0;
  const temValidade = typeof campos.expires_in === 'number' && campos.expires_in > 0;
  if (!temAcesso || !temValidade) return null;

  const renovacao = typeof campos.refresh_token === 'string' ? campos.refresh_token : undefined;
  return {
    access_token: campos.access_token as string,
    expires_in: campos.expires_in as number,
    refresh_token: renovacao || undefined,
  };
}

/**
 * Monta o erro de uma resposta HTTP sem sucesso, lendo o `error` do OAuth (RFC 6749, 5.2).
 * @param resposta - Resposta com status de erro.
 * @returns Erro com o status e o código OAuth.
 */
async function montarErroResposta(resposta: Response): Promise<ErroToken> {
  const corpo = (await lerCorpoJson(resposta)) as {
    error?: unknown;
    error_description?: unknown;
  } | null;
  const codigoOAuth = typeof corpo?.error === 'string' ? corpo.error : undefined;
  const descricao =
    typeof corpo?.error_description === 'string' ? corpo.error_description : codigoOAuth;
  const detalhe = descricao ? `: ${descricao.slice(0, LIMITE_TEXTO_ERRO)}` : '';

  return new ErroToken('servidor', `${MSG_SERVIDOR} (${resposta.status})${detalhe}`, {
    status: resposta.status,
    codigoOAuth,
  });
}

/**
 * Faz o POST em `/api/oauth/token` com corpo JSON e devolve os campos da resposta.
 * @param pedido - Corpo do pedido (`grant_type` e os campos da concessão).
 * @param dependencias - `fetch` e servidor.
 * @returns Campos da resposta de token.
 * @throws {ErroToken} `rede`, `servidor` ou `resposta_invalida`.
 */
async function pedirToken(
  pedido: PedidoToken & Partial<IdentificacaoAparelho>,
  dependencias: DependenciasToken,
): Promise<CamposRespostaToken> {
  const url = `${dependencias.urlServidor.replace(BARRAS_FINAIS, '')}${ROTA_OAUTH_TOKEN}`;
  let resposta: Response;
  try {
    resposta = await dependencias.buscar(url, {
      method: METODO_POST,
      headers: { 'Content-Type': TIPO_CONTEUDO_JSON, Accept: TIPO_CONTEUDO_JSON },
      body: JSON.stringify(pedido),
    });
  } catch (erro) {
    throw new ErroToken('rede', `${MSG_REDE} (${url})`, { causa: erro });
  }

  if (!resposta.ok) throw await montarErroResposta(resposta);

  const campos = extrairCamposToken(await lerCorpoJson(resposta));
  if (!campos) throw new ErroToken('resposta_invalida', MSG_RESPOSTA_INVALIDA);
  return campos;
}

/**
 * Troca o código de autorização por tokens e grava no cofre.
 * @param dados - `code`, `redirect_uri` e `code_verifier` do login.
 * @param dependencias - `fetch`, servidor, cliente, cofre, relógio e log.
 * @returns Tokens gravados.
 * @throws {ErroToken} Se a troca falhar ou a resposta não trouxer o refresh token.
 */
async function trocarCodigo(
  dados: DadosTrocaCodigo,
  dependencias: DependenciasToken,
): Promise<TokensGuardados> {
  dependencias.registrarLog(`${LOG_TROCANDO} ${dependencias.urlServidor}${ROTA_OAUTH_TOKEN}`);
  const campos = await pedirToken(
    {
      grant_type: 'authorization_code',
      code: dados.code,
      redirect_uri: dados.redirectUri,
      code_verifier: dados.codeVerifier,
      client_id: dependencias.idCliente,
      ...dados.aparelho,
    },
    dependencias,
  );
  if (!campos.refresh_token) throw new ErroToken('resposta_invalida', MSG_RESPOSTA_INVALIDA);

  const tokens: TokensGuardados = {
    access_token: campos.access_token,
    refresh_token: campos.refresh_token,
    expires_at: calcularExpiraEm(campos.expires_in, dependencias.relogio ?? Date.now),
  };
  await dependencias.cofre.gravar(tokens);
  return tokens;
}

/**
 * Trata a falha da renovação: `invalid_grant` apaga o cofre e avisa; o resto só repassa.
 * @param erro - Erro da renovação.
 * @param dependencias - Cofre, log e aviso de sessão perdida.
 * @returns Erro a lançar para quem chamou.
 */
async function tratarFalhaRenovacao(
  erro: unknown,
  dependencias: DependenciasToken,
): Promise<unknown> {
  const sessaoInvalida =
    erro instanceof ErroToken && erro.detalhes.codigoOAuth === CODIGO_CONCESSAO_INVALIDA;
  if (!sessaoInvalida) {
    dependencias.registrarLog(`${LOG_RENOVACAO_FALHOU}: ${(erro as Error).message}`);
    return erro;
  }

  dependencias.registrarLog(`${LOG_RENOVACAO_FALHOU}: ${erro.message} — limpando sessão`);
  await dependencias.cofre.apagar();
  dependencias.aoPerderSessao?.();
  return new ErroToken('sessao_perdida', MSG_SESSAO_PERDIDA, {
    status: erro.detalhes.status,
    codigoOAuth: CODIGO_CONCESSAO_INVALIDA,
    causa: erro,
  });
}

/**
 * Renova os tokens pelo refresh token guardado. Se a resposta não trouxer refresh token novo,
 * mantém o antigo.
 * @param dependencias - `fetch`, servidor, cliente, cofre, relógio e log.
 * @returns Tokens novos, já gravados no cofre.
 * @throws {ErroToken} `sem_sessao`, `sessao_perdida` (cofre apagado), `rede`, `servidor` ou
 *   `resposta_invalida` (nos três últimos o cofre fica como estava).
 */
async function renovarTokens(dependencias: DependenciasToken): Promise<TokensGuardados> {
  const atuais = await dependencias.cofre.ler();
  if (!atuais?.refresh_token) throw new ErroToken('sem_sessao', MSG_SEM_SESSAO);

  try {
    const campos = await pedirToken(
      {
        grant_type: 'refresh_token',
        refresh_token: atuais.refresh_token,
        client_id: dependencias.idCliente,
      },
      dependencias,
    );
    const tokens: TokensGuardados = {
      access_token: campos.access_token,
      refresh_token: campos.refresh_token ?? atuais.refresh_token,
      expires_at: calcularExpiraEm(campos.expires_in, dependencias.relogio ?? Date.now),
    };
    await dependencias.cofre.gravar(tokens);
    dependencias.registrarLog(LOG_RENOVACAO_OK);
    return tokens;
  } catch (erro) {
    throw await tratarFalhaRenovacao(erro, dependencias);
  }
}

/**
 * Cria o serviço de token. Renovações pedidas ao mesmo tempo usam a mesma promessa.
 * @param dependencias - `fetch`, servidor, cliente, cofre, relógio, log e aviso de sessão perdida.
 * @returns Serviço com troca do código, renovação e token válido.
 */
export function criarServicoToken(dependencias: DependenciasToken): ServicoToken {
  const relogio = dependencias.relogio ?? Date.now;
  let renovacaoEmAndamento: Promise<TokensGuardados> | null = null;

  const renovar = (): Promise<TokensGuardados> => {
    if (!renovacaoEmAndamento) {
      renovacaoEmAndamento = renovarTokens(dependencias).finally(() => {
        renovacaoEmAndamento = null;
      });
    }
    return renovacaoEmAndamento;
  };

  return {
    trocarCodigo: (dados) => trocarCodigo(dados, dependencias),
    renovar,
    async obterTokenAcessoValido() {
      const tokens = await dependencias.cofre.ler();
      if (!tokens) return null;
      if (!precisaRenovar(tokens, relogio)) return tokens.access_token;

      return (await renovar()).access_token;
    },
  };
}
