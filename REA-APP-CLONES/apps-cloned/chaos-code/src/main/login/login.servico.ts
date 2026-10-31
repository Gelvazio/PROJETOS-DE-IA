/**
 * Serviço de login: junta as peças do login OAuth (autorização, aparelho, token, revogação e
 * cofre) no contrato `ProvedorLogin` e escolhe entre o login real e o simulado. Recria o fluxo
 * do `start_login` do original (docs/inventario/login.md, passos 1 a 11, "Renovação" e
 * "Revogação (logout)").
 *
 * - Tudo chega injetado (`DependenciasServicoLogin`); as dependências reais são montadas em
 *   `login.dependencias.ts`, sem importar o Electron aqui.
 * - O estado fica em memória e cada mudança avisa os ouvintes (a interface recebe o evento pelos
 *   canais IPC da CLONE.4.12; o reinício do servidor MCP, passo 11, também pode ouvir).
 * - O token nunca sai deste serviço pelo estado: `EstadoLogin` só traz situação, erro e validade.
 */
import type {
  CredenciaisClienteOAuth,
  EstadoLogin,
  TokensGuardados,
} from '../../compartilhado/tipos-login';
import type { IdentificacaoAparelho } from './aparelho';
import type { ResultadoAutorizacao } from './autorizacao';
import type { CofreTokens } from './cofre-tokens';
import type { ProvedorLogin } from './contrato';
import { LoginSimulado } from './login-simulado';
import type { ServicoRevogacao } from './revogacao';
import { ErroToken, precisaRenovar, type ServicoToken } from './token';

/** Variável de ambiente que liga o login simulado *(escolha do clone; o original não tem)*. */
export const VARIAVEL_LOGIN_SIMULADO = 'CHAOS_CLONE_LOGIN_SIMULADO';
const VALOR_LIGADO = '1';

const MSG_SEM_CLIENTE = 'Nenhum client OAuth registrado';
const MSG_SESSAO_EXPIRADA = 'Sessão expirada. Faça login novamente.';
const LOG_LOGIN_OK = 'Login realizado com sucesso';
const LOG_LOGIN_FALHOU = 'Login falhou';
const LOG_APARELHO_FALHOU = 'Não foi possível montar a identificação do aparelho';
const LOG_SESSAO_SEM_CLIENTE = `${MSG_SEM_CLIENTE} — limpando sessão`;
const LOG_OUVINTE_FALHOU = 'Ouvinte do login falhou';
const LOG_SIMULADO = 'ATENÇÃO: login SIMULADO ligado (tokens falsos, sem servidor)';
const TIPOS_ERRO_SEM_SESSAO: ReadonlySet<string> = new Set(['sem_sessao', 'sessao_perdida']);

const ESTADO_NAO_LOGADO: EstadoLogin = { situacao: 'nao_logado', erro: null, expira_em: null };

/** Função chamada a cada mudança do estado do login. */
export type OuvinteEstadoLogin = (estado: EstadoLogin) => void;

/** Login completo: o contrato mais a leitura da sessão guardada e o aviso de mudança. */
export interface ServicoLoginCompleto extends ProvedorLogin {
  /** Lê a sessão guardada ao abrir o app. @returns Estado depois da leitura. */
  inicializar(): Promise<EstadoLogin>;
  /** Registra um ouvinte do estado. @returns Função que remove o ouvinte. */
  aoMudarEstado(ouvinte: OuvinteEstadoLogin): () => void;
}

/** Dependências injetadas no login real. */
export interface DependenciasServicoLogin {
  cofre: Pick<CofreTokens, 'ler' | 'apagar'>;
  /** Passo 1: confere se a plataforma responde. Lança erro legível se não. */
  verificarPlataforma: () => Promise<void>;
  /** Passos 2 a 7: callback, cliente, PKCE, navegador e `state`. */
  autorizar: () => Promise<ResultadoAutorizacao>;
  /** Cliente salvo em `oauth_client.json` para o servidor em uso, ou null. */
  lerClienteSalvo: () => Promise<CredenciaisClienteOAuth | null>;
  /** Passo 9: os 5 campos `device_*`. */
  montarAparelho: () => Promise<IdentificacaoAparelho>;
  criarServicoToken: (idCliente: string, aoPerderSessao: () => void) => ServicoToken;
  criarServicoRevogacao: (idCliente: string) => ServicoRevogacao;
  /** Relógio em milissegundos (padrão: `Date.now`). */
  relogio?: () => number;
  /** Recebe as mensagens de log (sem tokens). */
  registrarLog: (mensagem: string) => void;
}

/** Serviços de token e revogação ligados a um `client_id`. */
interface ServicosDoCliente {
  idCliente: string;
  token: ServicoToken;
  revogacao: ServicoRevogacao;
}

/**
 * Tira a mensagem de um erro qualquer.
 * @param erro - Erro capturado.
 * @returns Texto do erro.
 */
function mensagemDoErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : String(erro);
}

/**
 * Diz se o erro de token significa "não há sessão" (nada guardado ou sessão perdida).
 * @param erro - Erro capturado.
 * @returns true se for `sem_sessao` ou `sessao_perdida`.
 */
function ehErroSemSessao(erro: unknown): boolean {
  return erro instanceof ErroToken && TIPOS_ERRO_SEM_SESSAO.has(erro.tipo);
}

/** Login real (OAuth com PKCE no navegador do sistema), com o estado em memória. */
export class ServicoLogin implements ServicoLoginCompleto {
  private estado: EstadoLogin = ESTADO_NAO_LOGADO;
  private servicos: ServicosDoCliente | null = null;
  private entradaEmAndamento: Promise<EstadoLogin> | null = null;
  private readonly ouvintes = new Set<OuvinteEstadoLogin>();
  private readonly relogio: () => number;

  /** @param dependencias - Peças do login, todas injetadas. */
  constructor(private readonly dependencias: DependenciasServicoLogin) {
    this.relogio = dependencias.relogio ?? Date.now;
  }

  /**
   * Lê o cliente e os tokens guardados. Tokens sem cliente não podem ser renovados nem
   * revogados: são apagados, como a renovação do original faz ("Nenhum client OAuth registrado").
   * @returns Logado (sessão guardada) ou não logado.
   */
  async inicializar(): Promise<EstadoLogin> {
    const [cliente, tokens] = await Promise.all([
      this.dependencias.lerClienteSalvo(),
      this.dependencias.cofre.ler(),
    ]);
    if (!tokens) return this.obterEstado();
    if (!cliente) {
      this.dependencias.registrarLog(LOG_SESSAO_SEM_CLIENTE);
      await this.dependencias.cofre.apagar();
      return this.obterEstado();
    }

    this.usarCliente(cliente.client_id);
    return this.mudarParaLogado(tokens);
  }

  /**
   * Faz o login no navegador do sistema. Pedidos ao mesmo tempo usam o mesmo login.
   * @returns Estado logado.
   * @throws {Error} Plataforma fora, autorização, registro ou troca do código.
   */
  entrar(): Promise<EstadoLogin> {
    if (!this.entradaEmAndamento) {
      this.entradaEmAndamento = this.executarEntrada().finally(() => {
        this.entradaEmAndamento = null;
      });
    }
    return this.entradaEmAndamento;
  }

  /**
   * Revoga o token no servidor (falha só vai para o log) e apaga o cofre sempre.
   * @returns Estado não logado.
   * @throws {Error} Só se o cofre não puder ser apagado.
   */
  async sair(): Promise<EstadoLogin> {
    if (this.servicos) {
      await this.servicos.revogacao.sair();
    } else {
      this.dependencias.registrarLog(`${MSG_SEM_CLIENTE}: nada a revogar`);
      await this.dependencias.cofre.apagar();
    }
    return this.mudarEstado(ESTADO_NAO_LOGADO);
  }

  /**
   * Renova os tokens. `invalid_grant` derruba a sessão (estado `sessao_expirada`).
   * @returns Tokens novos.
   * @throws {Error} Sem cliente, sem sessão, sessão perdida, rede ou servidor.
   */
  async renovar(): Promise<TokensGuardados> {
    if (!this.servicos) throw new Error(MSG_SEM_CLIENTE);

    try {
      const tokens = await this.servicos.token.renovar();
      this.mudarParaLogado(tokens);
      return tokens;
    } catch (erro) {
      const perdeuSessao = this.estado.situacao === 'sessao_expirada';
      if (!perdeuSessao) this.mudarEstado({ ...this.estado, erro: mensagemDoErro(erro) });
      throw erro;
    }
  }

  /** @returns Cópia do estado atual. */
  obterEstado(): EstadoLogin {
    return { ...this.estado };
  }

  /**
   * Devolve o access token, renovando antes de vencer (margem de `token.ts`).
   * @returns Access token, ou null sem sessão (ou se a sessão foi perdida agora).
   * @throws {Error} Rede ou servidor fora na renovação (a sessão continua guardada).
   */
  async obterTokenAcesso(): Promise<string | null> {
    if (!this.servicos) return null;

    const tokens = await this.dependencias.cofre.ler();
    if (!tokens) return null;
    if (!precisaRenovar(tokens, this.relogio)) return tokens.access_token;

    try {
      return (await this.renovar()).access_token;
    } catch (erro) {
      if (ehErroSemSessao(erro)) return null;
      throw erro;
    }
  }

  /**
   * @param ouvinte - Função chamada com o estado novo.
   * @returns Função que remove o ouvinte.
   */
  aoMudarEstado(ouvinte: OuvinteEstadoLogin): () => void {
    this.ouvintes.add(ouvinte);
    return () => {
      this.ouvintes.delete(ouvinte);
    };
  }

  /**
   * Passos 1 a 10 do login. Se falhar, volta ao estado anterior com a mensagem do erro.
   * @returns Estado logado.
   * @throws {Error} Repassa o erro da etapa que falhou.
   */
  private async executarEntrada(): Promise<EstadoLogin> {
    const anterior = this.obterEstado();
    this.mudarEstado({ situacao: 'entrando', erro: null, expira_em: null });
    try {
      await this.dependencias.verificarPlataforma();
      const autorizacao = await this.dependencias.autorizar();
      const aparelho = await this.montarAparelhoSemFalhar();
      const servicos = this.usarCliente(autorizacao.cliente.client_id);
      const tokens = await servicos.token.trocarCodigo({
        code: autorizacao.codigo,
        redirectUri: autorizacao.redirect_uri,
        codeVerifier: autorizacao.code_verifier,
        aparelho,
      });
      this.dependencias.registrarLog(LOG_LOGIN_OK);
      return this.mudarParaLogado(tokens);
    } catch (erro) {
      const mensagem = mensagemDoErro(erro);
      this.dependencias.registrarLog(`${LOG_LOGIN_FALHOU}: ${mensagem}`);
      const continuaLogado = anterior.situacao === 'logado';
      const base = continuaLogado ? anterior : ESTADO_NAO_LOGADO;
      this.mudarEstado({ ...base, erro: mensagem });
      throw erro;
    }
  }

  /**
   * Monta os campos do aparelho; se falhar (ex.: sem adaptador de rede), segue sem eles.
   * @returns Campos do aparelho, ou undefined.
   */
  private async montarAparelhoSemFalhar(): Promise<IdentificacaoAparelho | undefined> {
    try {
      return await this.dependencias.montarAparelho();
    } catch (erro) {
      this.dependencias.registrarLog(`${LOG_APARELHO_FALHOU}: ${mensagemDoErro(erro)}`);
      return undefined;
    }
  }

  /**
   * Liga os serviços de token e revogação ao `client_id` (reaproveita se for o mesmo).
   * @param idCliente - Cliente OAuth em uso.
   * @returns Serviços do cliente.
   */
  private usarCliente(idCliente: string): ServicosDoCliente {
    if (this.servicos?.idCliente === idCliente) return this.servicos;

    this.servicos = {
      idCliente,
      token: this.dependencias.criarServicoToken(idCliente, () => this.marcarSessaoExpirada()),
      revogacao: this.dependencias.criarServicoRevogacao(idCliente),
    };
    return this.servicos;
  }

  /** Chamado pelo serviço de token quando a renovação recebe `invalid_grant`. */
  private marcarSessaoExpirada(): void {
    this.mudarEstado({ situacao: 'sessao_expirada', erro: MSG_SESSAO_EXPIRADA, expira_em: null });
  }

  /**
   * @param tokens - Tokens guardados.
   * @returns Estado logado com a validade dos tokens.
   */
  private mudarParaLogado(tokens: TokensGuardados): EstadoLogin {
    return this.mudarEstado({ situacao: 'logado', erro: null, expira_em: tokens.expires_at });
  }

  /**
   * Troca o estado e avisa os ouvintes (erro de um ouvinte não derruba o login).
   * @param estado - Estado novo.
   * @returns Cópia do estado novo.
   */
  private mudarEstado(estado: EstadoLogin): EstadoLogin {
    this.estado = { ...estado };
    this.ouvintes.forEach((ouvinte) => {
      try {
        ouvinte(this.obterEstado());
      } catch (erro) {
        this.dependencias.registrarLog(`${LOG_OUVINTE_FALHOU}: ${mensagemDoErro(erro)}`);
      }
    });
    return this.obterEstado();
  }
}

/**
 * Dá ao login simulado a mesma interface do serviço completo: o estado é avisado depois de
 * cada operação.
 * @param provedor - Login simulado (ou outro `ProvedorLogin` sem eventos).
 * @returns Serviço completo.
 */
export function adaptarComEventos(provedor: ProvedorLogin): ServicoLoginCompleto {
  const ouvintes = new Set<OuvinteEstadoLogin>();
  const avisar = <T>(resultado: T): T => {
    ouvintes.forEach((ouvinte) => ouvinte(provedor.obterEstado()));
    return resultado;
  };

  return {
    inicializar: async () => provedor.obterEstado(),
    entrar: async () => avisar(await provedor.entrar()),
    sair: async () => avisar(await provedor.sair()),
    renovar: async () => avisar(await provedor.renovar()),
    obterEstado: () => provedor.obterEstado(),
    obterTokenAcesso: () => provedor.obterTokenAcesso(),
    aoMudarEstado(ouvinte) {
      ouvintes.add(ouvinte);
      return () => {
        ouvintes.delete(ouvinte);
      };
    },
  };
}

/**
 * Diz se o login simulado foi pedido (variável `CHAOS_CLONE_LOGIN_SIMULADO=1`).
 * @param ambiente - Variáveis de ambiente (no app, `process.env`).
 * @returns true se o modo simulado deve ser usado.
 */
export function deveUsarLoginSimulado(ambiente: Record<string, string | undefined>): boolean {
  return ambiente[VARIAVEL_LOGIN_SIMULADO] === VALOR_LIGADO;
}

/** Opções da escolha entre login real e simulado. */
export interface OpcoesServicoLogin {
  modoSimulado: boolean;
  /** Monta as dependências reais (só é chamada no modo real). */
  criarDependenciasReais: () => DependenciasServicoLogin;
  registrarLog: (mensagem: string) => void;
}

/**
 * Escolhe o login: simulado só por opção explícita (avisa no log); senão, o real.
 * @param opcoes - Modo, montagem das dependências reais e log.
 * @returns Serviço de login completo.
 */
export function criarServicoLogin(opcoes: OpcoesServicoLogin): ServicoLoginCompleto {
  if (!opcoes.modoSimulado) return new ServicoLogin(opcoes.criarDependenciasReais());

  opcoes.registrarLog(LOG_SIMULADO);
  return adaptarComEventos(new LoginSimulado());
}
