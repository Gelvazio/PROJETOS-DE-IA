/**
 * Montagem das dependências reais do login (`ServicoLogin`): `fetch` nativo, arquivos do Node,
 * cofre com o `safeStorage` e o navegador do sistema. O Electron não é importado aqui: o
 * `safeStorage` e o `shell.openExternal` chegam por parâmetro do processo principal.
 */
import { obterCaminhosGlobais } from '../armazenamento/caminhos';
import type { CredenciaisClienteOAuth } from '../../compartilhado/tipos-login';
import { criarDependenciasAparelho, montarIdentificacaoAparelho } from './aparelho';
import {
  autorizarNoNavegador,
  criarDependenciasAutorizacao,
  type DependenciasAutorizacao,
} from './autorizacao';
import { criarCifradorElectron, criarCofreTokens, type ApiSafeStorage } from './cofre-tokens';
import type { DependenciasServicoLogin } from './login.servico';
import {
  criarDependenciasRegistro,
  lerClienteSalvo,
  type DependenciasRegistroCliente,
} from './registro-cliente';
import { criarServicoRevogacao } from './revogacao';
import { criarServicoToken } from './token';

/** Tempo máximo do teste da plataforma *(escolha do clone; o valor do original não foi achado)*. */
export const TEMPO_LIMITE_VERIFICACAO_MS = 10_000;

const PREFIXO_LOG = '[login]';
const METODO_GET = 'GET';
const BARRAS_FINAIS = /\/+$/;
const LOG_PLATAFORMA_OK = 'Plataforma acessível em';
const MSG_PLATAFORMA_FORA = 'Plataforma inacessível em';
const MSG_VERIFIQUE_SERVIDOR = 'Verifique se o servidor está rodando.';

/** O que o processo principal entrega para montar o login real. */
export interface OpcoesLoginReal {
  /** Endereço base do servidor (`URL_SERVIDOR_PADRAO` ou o configurado). */
  urlServidor: string;
  /** Pasta de dados do app (`obterPastaDados`). */
  pastaDados: string;
  /** Versão enviada em `device_client_version`. */
  versaoCliente: string;
  /** `safeStorage` do Electron. */
  safeStorage: ApiSafeStorage;
  /** Abre a URL no navegador do sistema (no app: `shell.openExternal`). */
  abrirNavegador: (url: string) => Promise<void>;
  /** Recebe as mensagens de log (padrão: `console.info` com `[login]`). */
  registrarLog?: (mensagem: string) => void;
}

/** O que o teste da plataforma usa. */
interface DependenciasVerificacao {
  buscar: typeof fetch;
  urlServidor: string;
  registrarLog: (mensagem: string) => void;
}

/**
 * Tira espaços e barras finais do endereço do servidor.
 * @param url - Endereço informado.
 * @returns Endereço normalizado.
 */
function normalizarUrl(url: string): string {
  return url.trim().replace(BARRAS_FINAIS, '');
}

/**
 * Passo 1 do login: confere se a plataforma responde. Qualquer resposta HTTP serve; só falha
 * de rede ou tempo esgotado contam como fora do ar.
 * @param dependencias - `fetch`, servidor e log.
 * @returns Promessa resolvida se a plataforma respondeu.
 * @throws {Error} "Plataforma inacessível em …" com o erro de rede como causa.
 */
export async function verificarPlataforma(dependencias: DependenciasVerificacao): Promise<void> {
  const url = normalizarUrl(dependencias.urlServidor);
  try {
    const resposta = await dependencias.buscar(url, {
      method: METODO_GET,
      signal: AbortSignal.timeout(TEMPO_LIMITE_VERIFICACAO_MS),
    });
    await resposta.body?.cancel();
  } catch (erro) {
    throw new Error(`${MSG_PLATAFORMA_FORA} ${url}. ${MSG_VERIFIQUE_SERVIDOR}`, { cause: erro });
  }
  dependencias.registrarLog(`${LOG_PLATAFORMA_OK} ${url}`);
}

/**
 * Lê o `oauth_client.json` e só devolve o cliente se ele for do servidor em uso.
 * @param registro - Dependências do registro (pasta, arquivos, servidor e log).
 * @returns Cliente salvo do mesmo servidor, ou null.
 * @throws {Error} Se o arquivo existir mas não puder ser lido.
 */
async function lerClienteDoServidor(
  registro: DependenciasRegistroCliente,
): Promise<CredenciaisClienteOAuth | null> {
  const salvo = await lerClienteSalvo(registro);
  if (!salvo) return null;

  const mesmoServidor = normalizarUrl(salvo.platform_url) === normalizarUrl(registro.urlServidor);
  return mesmoServidor ? salvo : null;
}

/**
 * Monta registro e autorização com o mesmo log.
 * @param opcoes - Opções do login real.
 * @param registrarLog - Log em uso.
 * @returns Dependências do registro e da autorização.
 */
function montarAutorizacao(
  opcoes: OpcoesLoginReal,
  registrarLog: (mensagem: string) => void,
): DependenciasAutorizacao {
  const registro = {
    ...criarDependenciasRegistro(opcoes.urlServidor, opcoes.pastaDados),
    registrarLog,
  };
  return {
    ...criarDependenciasAutorizacao(opcoes.urlServidor, opcoes.pastaDados, opcoes.abrirNavegador),
    registro,
  };
}

/**
 * Monta as dependências reais do `ServicoLogin`.
 * @param opcoes - Servidor, pasta de dados, versão, `safeStorage`, navegador e log.
 * @returns Dependências prontas para `new ServicoLogin(...)` ou `criarServicoLogin`.
 */
export function criarDependenciasLoginReal(opcoes: OpcoesLoginReal): DependenciasServicoLogin {
  const registrarLog =
    opcoes.registrarLog ?? ((mensagem: string) => console.info(`${PREFIXO_LOG} ${mensagem}`));
  const autorizacao = montarAutorizacao(opcoes, registrarLog);
  const { buscar } = autorizacao.registro;
  const { urlServidor } = opcoes;
  const cofre = criarCofreTokens({
    caminhoArquivo: obterCaminhosGlobais(opcoes.pastaDados).tokensAutenticacao,
    cifrador: criarCifradorElectron(opcoes.safeStorage),
    registrarAviso: registrarLog,
  });
  const aparelho = criarDependenciasAparelho(opcoes.pastaDados, opcoes.versaoCliente);

  return {
    cofre,
    registrarLog,
    verificarPlataforma: () => verificarPlataforma({ buscar, urlServidor, registrarLog }),
    autorizar: () => autorizarNoNavegador(autorizacao),
    lerClienteSalvo: () => lerClienteDoServidor(autorizacao.registro),
    montarAparelho: () => montarIdentificacaoAparelho(aparelho),
    criarServicoToken: (idCliente, aoPerderSessao) =>
      criarServicoToken({ buscar, urlServidor, idCliente, cofre, registrarLog, aoPerderSessao }),
    criarServicoRevogacao: (idCliente) =>
      criarServicoRevogacao({ buscar, urlServidor, idCliente, cofre, registrarLog }),
  };
}
