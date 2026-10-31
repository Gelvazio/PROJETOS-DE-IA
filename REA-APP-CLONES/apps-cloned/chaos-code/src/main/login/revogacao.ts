/**
 * Sair e revogar em `/api/oauth/revoke`: recria o logout do `auth::oauth` do original
 * (docs/inventario/login.md, "Revogação (logout)"; api.md, rota `/api/oauth/revoke`).
 *
 * - Corpo em **JSON** com `token`, `token_type_hint` e `client_id` (`0x80f258`), como os outros
 *   POSTs do `auth::oauth` (ver `token.ts`); o servidor do clone lê o mesmo JSON
 *   (`server/servidor/esquemas/oauth.py`, `PedidoRevogacao`).
 * - Revoga o **refresh token** *(inferido)*: pela RFC 7009 (seção 2.1) o servidor derruba junto
 *   os access tokens da mesma concessão. Sem refresh token, revoga o access token.
 * - Falha da revogação só gera log ("Revogação de token falhou (…)", `0x80f2a1`) e o cofre é
 *   apagado mesmo assim *(inferido)*: sair nunca deixa tokens no disco.
 * - Tempo limite no pedido *(escolha do clone)*: o logout não fica preso com o servidor fora.
 */
import { ROTA_OAUTH_REVOGACAO } from '../../compartilhado/constantes';
import type { PedidoRevogacaoToken } from '../../compartilhado/tipos-api';
import type { TokensGuardados } from '../../compartilhado/tipos-login';
import type { CofreTokens } from './cofre-tokens';

/** Tempo máximo do pedido de revogação antes de desistir e seguir com o logout. */
export const TEMPO_LIMITE_REVOGACAO_MS = 10_000;

const METODO_POST = 'POST';
const TIPO_CONTEUDO_JSON = 'application/json';
const DICA_REFRESH_TOKEN = 'refresh_token';
const DICA_ACCESS_TOKEN = 'access_token';
const BARRAS_FINAIS = /\/+$/;

const LOG_REVOGANDO = 'Revogando token em';
const LOG_REVOGACAO_OK = 'Token revogado no servidor';
const LOG_REVOGACAO_FALHOU = 'Revogação de token falhou';
const LOG_SEM_SESSAO = 'Logout sem sessão guardada: nada a revogar';
const LOG_COFRE_LIMPO = 'Tokens locais apagados';

/** Dependências injetadas na revogação. */
export interface DependenciasRevogacao {
  /** `fetch` usado no pedido (o nativo do Node 22, ou um falso na conferência). */
  buscar: typeof fetch;
  /** Endereço base do servidor (ex.: `http://localhost:3000`). */
  urlServidor: string;
  /** `client_id` do cliente registrado (`oauth_client.json`). */
  idCliente: string;
  /** Cofre onde os tokens ficam cifrados. */
  cofre: Pick<CofreTokens, 'ler' | 'apagar'>;
  /** Recebe as mensagens de log (sem tokens). */
  registrarLog: (mensagem: string) => void;
  /** Tempo limite do pedido em milissegundos (padrão: `TEMPO_LIMITE_REVOGACAO_MS`). */
  tempoLimiteMs?: number;
}

/** Resultado do logout. */
export interface ResultadoSaida {
  /** true se havia tokens no cofre ao sair. */
  tinhaSessao: boolean;
  /** true se o servidor confirmou a revogação (2xx). */
  revogadoNoServidor: boolean;
}

/** Operação de logout oferecida ao serviço de login. */
export interface ServicoRevogacao {
  sair(): Promise<ResultadoSaida>;
}

/**
 * Escolhe o token a revogar: o refresh token, ou o access token quando não houver refresh.
 * @param tokens - Tokens guardados.
 * @returns Token e a dica do tipo dele.
 */
function escolherTokenRevogacao(tokens: TokensGuardados): { token: string; dica: string } {
  if (tokens.refresh_token) return { token: tokens.refresh_token, dica: DICA_REFRESH_TOKEN };
  return { token: tokens.access_token, dica: DICA_ACCESS_TOKEN };
}

/**
 * Descreve uma falha do pedido sem mostrar tokens (status HTTP ou nome do erro de rede).
 * @param erro - Erro lançado pelo `fetch` (rede, tempo esgotado).
 * @returns Texto curto para o log.
 */
function descreverErroRede(erro: unknown): string {
  if (erro instanceof Error) return erro.name === 'TimeoutError' ? 'tempo esgotado' : erro.name;
  return 'erro desconhecido';
}

/**
 * Faz o POST em `/api/oauth/revoke`. Nunca lança: falhas só vão para o log.
 * @param pedido - Corpo do pedido (`token`, `token_type_hint`, `client_id`).
 * @param dependencias - `fetch`, servidor, log e tempo limite.
 * @returns true se o servidor respondeu 2xx.
 */
async function pedirRevogacao(
  pedido: PedidoRevogacaoToken,
  dependencias: DependenciasRevogacao,
): Promise<boolean> {
  const url = `${dependencias.urlServidor.replace(BARRAS_FINAIS, '')}${ROTA_OAUTH_REVOGACAO}`;
  dependencias.registrarLog(`${LOG_REVOGANDO} ${url}`);
  try {
    const resposta = await dependencias.buscar(url, {
      method: METODO_POST,
      headers: { 'Content-Type': TIPO_CONTEUDO_JSON, Accept: TIPO_CONTEUDO_JSON },
      body: JSON.stringify(pedido),
      signal: AbortSignal.timeout(dependencias.tempoLimiteMs ?? TEMPO_LIMITE_REVOGACAO_MS),
    });
    if (resposta.ok) {
      dependencias.registrarLog(LOG_REVOGACAO_OK);
      return true;
    }
    dependencias.registrarLog(`${LOG_REVOGACAO_FALHOU} (${resposta.status})`);
    return false;
  } catch (erro) {
    dependencias.registrarLog(`${LOG_REVOGACAO_FALHOU} (${descreverErroRede(erro)})`);
    return false;
  }
}

/**
 * Sai da sessão: revoga o token no servidor (se houver sessão) e apaga o cofre sempre.
 * @param dependencias - `fetch`, servidor, cliente, cofre, log e tempo limite.
 * @returns Se havia sessão e se o servidor confirmou a revogação.
 * @throws {Error} Só se o cofre não puder ser apagado (erro do disco).
 */
async function sair(dependencias: DependenciasRevogacao): Promise<ResultadoSaida> {
  const tokens = await dependencias.cofre.ler();
  if (!tokens) {
    dependencias.registrarLog(LOG_SEM_SESSAO);
    await dependencias.cofre.apagar();
    return { tinhaSessao: false, revogadoNoServidor: false };
  }

  let revogadoNoServidor = false;
  try {
    const { token, dica } = escolherTokenRevogacao(tokens);
    revogadoNoServidor = await pedirRevogacao(
      { token, token_type_hint: dica, client_id: dependencias.idCliente },
      dependencias,
    );
  } finally {
    await dependencias.cofre.apagar();
    dependencias.registrarLog(LOG_COFRE_LIMPO);
  }
  return { tinhaSessao: true, revogadoNoServidor };
}

/**
 * Cria o serviço de revogação. Logouts pedidos ao mesmo tempo usam a mesma promessa.
 * @param dependencias - `fetch`, servidor, cliente, cofre, log e tempo limite.
 * @returns Serviço com a operação `sair`.
 */
export function criarServicoRevogacao(dependencias: DependenciasRevogacao): ServicoRevogacao {
  let saidaEmAndamento: Promise<ResultadoSaida> | null = null;

  return {
    sair() {
      if (!saidaEmAndamento) {
        saidaEmAndamento = sair(dependencias).finally(() => {
          saidaEmAndamento = null;
        });
      }
      return saidaEmAndamento;
    },
  };
}
