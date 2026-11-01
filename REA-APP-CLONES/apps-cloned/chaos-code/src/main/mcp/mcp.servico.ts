/**
 * Serviço do MCP local: junta `ServidorMcp`, token de sessão, OAuth e as ferramentas, e dá à
 * interface ligar/desligar, porta, token e consentimento (canais `mcp:*`, CLONE.8.10).
 */

import type { ApisPlataforma } from '../api/api.canais';
import type { RepositorioProjetos } from '../projeto/projeto.repositorio';
import type { ServicoConsulta } from '../grafo/consulta.servico';
import type { RepositorioGrafo } from '../grafo/grafo.repositorio';
import { ServicoOauthMcp } from './descoberta-oauth';
import { montarFerramentasBusca } from './ferramentas/busca';
import type { MapaFerramentas } from './ferramentas/comum';
import { montarFerramentasGrafo } from './ferramentas/grafo';
import { montarFerramentasProjetos } from './ferramentas/projetos';
import { montarFerramentasTarefas } from './ferramentas/tarefas';
import { criarRoteadorMcp } from './roteador';
import {
  ServidorMcp,
  type ConfiguracaoServidorMcp,
  type EnderecoServidorMcp,
} from './servidor';
import { criarTokenSessao, type TokenSessaoMcp } from './token-sessao';

/** Dependências do serviço MCP. */
export interface DependenciasServicoMcp {
  caminhoConfigMcp: string;
  caminhoOauthMcp: string;
  apisPlataforma: ApisPlataforma;
  servicoConsulta: ServicoConsulta;
  repositorioGrafo: RepositorioGrafo;
  repositorioProjetos: RepositorioProjetos;
  /** Emite `mcp:consent-request` às janelas. */
  emitirConsentimento?: (pedido: {
    request_id: string;
    client_name: string;
    redirect_uri: string;
  }) => void;
  registrarLog?: (mensagem: string) => void;
}

/** Estado do servidor mostrado à interface. */
export interface EstadoServicoMcp {
  rodando: boolean;
  porta: number | null;
  enderecos: string[];
}

/** Serviço do MCP local. */
export class ServicoMcp {
  private readonly servidor: ServidorMcp;
  private readonly tokenSessao: TokenSessaoMcp;
  private readonly oauth: ServicoOauthMcp;
  private readonly registrar: (mensagem: string) => void;

  constructor(dependencias: DependenciasServicoMcp) {
    this.registrar = dependencias.registrarLog ?? (() => undefined);
    this.oauth = new ServicoOauthMcp(
      dependencias.caminhoOauthMcp,
      dependencias.emitirConsentimento,
    );
    this.tokenSessao = criarTokenSessao(
      dependencias.caminhoConfigMcp,
      (token) => this.oauth.conferirTokenAcesso(token),
      this.registrar,
    );
    const ferramentas: MapaFerramentas = {
      ...montarFerramentasBusca(dependencias.servicoConsulta),
      ...montarFerramentasGrafo(dependencias.repositorioGrafo),
      ...montarFerramentasTarefas(dependencias.apisPlataforma.tarefas),
      ...montarFerramentasProjetos({
        projetos: dependencias.apisPlataforma.projetos,
        imagens: dependencias.apisPlataforma.imagens,
        projetosLocais: dependencias.repositorioProjetos,
      }),
    };
    this.servidor = new ServidorMcp({
      autenticar: (pedido, idProjeto) => this.tokenSessao.autenticar(pedido, idProjeto),
      rotear: criarRoteadorMcp(ferramentas),
      rotasExtras: this.oauth.montarRotas(),
      registrar: this.registrar,
    });
  }

  /** Estado atual. @returns {EstadoServicoMcp} Rodando, porta e endereços. */
  obterEstado(): EstadoServicoMcp {
    const endereco = this.servidor.endereco;
    return {
      rodando: this.servidor.estaRodando,
      porta: endereco?.porta ?? null,
      enderecos: endereco ? [...endereco.hosts] : [],
    };
  }

  /**
   * Sobe o servidor na porta pedida (ou a padrão).
   * @param {ConfiguracaoServidorMcp} [config] - Porta e IP do WSL.
   * @returns {Promise<EstadoServicoMcp>} Estado depois de subir.
   */
  async ligar(config?: ConfiguracaoServidorMcp): Promise<EstadoServicoMcp> {
    const endereco = await this.servidor.iniciar(config);
    await this.tokenSessao.persistir(endereco.porta);
    return this.obterEstado();
  }

  /**
   * Para o servidor.
   * @returns {Promise<EstadoServicoMcp>} Estado depois de parar.
   */
  async desligar(): Promise<EstadoServicoMcp> {
    await this.servidor.parar();
    return this.obterEstado();
  }

  /** Token de sessão atual (para montar o `claude mcp add`). @returns {string} Token. */
  obterTokenSessao(): string {
    return this.tokenSessao.obter();
  }

  /**
   * Gira o token de sessão e o grava.
   * @returns {Promise<string>} Token novo.
   */
  async renovarTokenSessao(): Promise<string> {
    const novo = this.tokenSessao.renovar();
    const porta = this.servidor.endereco?.porta;
    if (porta !== undefined) await this.tokenSessao.persistir(porta);
    return novo;
  }

  /**
   * Resolve o consentimento do usuário (evento `respond_mcp_consent`).
   * @param {string} requestId - ID do pedido.
   * @param {boolean} aprovado - Decisão.
   * @returns {Promise<boolean>} true quando o pedido existia.
   */
  responderConsentimento(requestId: string, aprovado: boolean): Promise<boolean> {
    return this.oauth.responderConsentimento(requestId, aprovado);
  }

  /** Endereço atual do servidor. @returns {EnderecoServicoMcp | null} Porta e endereços. */
  get endereco(): EnderecoServidorMcp | null {
    return this.servidor.endereco;
  }
}
