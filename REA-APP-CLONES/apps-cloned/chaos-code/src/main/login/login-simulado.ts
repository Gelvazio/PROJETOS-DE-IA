/**
 * Provedor de login simulado, como o `auth::mock` do original: gera tokens falsos
 * (`mock_access_token_<id>` e `mock_refresh_token`), sem rede, com o estado só em memória.
 * Serve para usar o app sem plataforma; só deve ser ligado por opção explícita de desenvolvimento.
 */

import type { EstadoLogin, TokensGuardados } from '../../compartilhado/tipos-login';
import type { ProvedorLogin } from './contrato';

const PREFIXO_TOKEN_ACESSO_SIMULADO = 'mock_access_token_';
const TOKEN_RENOVACAO_SIMULADO = 'mock_refresh_token';
const VALIDADE_TOKEN_SIMULADO_MS = 60 * 60 * 1000;
const MSG_SEM_SESSAO = 'Nenhum refresh token disponível';

/** Dependências injetáveis do login simulado. */
export interface DependenciasLoginSimulado {
  /** Relógio em milissegundos (padrão: `Date.now`). */
  obterAgora?: () => number;
  /** Gerador do sufixo do token de acesso (padrão: UUID aleatório). */
  gerarId?: () => string;
}

/** Login simulado que implementa o contrato `ProvedorLogin`. */
export class LoginSimulado implements ProvedorLogin {
  private readonly obterAgora: () => number;
  private readonly gerarId: () => string;
  private tokens: TokensGuardados | null = null;

  /**
   * @param {DependenciasLoginSimulado} dependencias - Relógio e gerador de id (opcionais).
   */
  constructor(dependencias: DependenciasLoginSimulado = {}) {
    this.obterAgora = dependencias.obterAgora ?? Date.now;
    this.gerarId = dependencias.gerarId ?? (() => crypto.randomUUID());
  }

  /** Gera tokens falsos e passa para logado. @returns {Promise<EstadoLogin>} Estado logado. */
  async entrar(): Promise<EstadoLogin> {
    this.tokens = this.criarTokens();
    return this.obterEstado();
  }

  /** Apaga os tokens. @returns {Promise<EstadoLogin>} Estado não logado. */
  async sair(): Promise<EstadoLogin> {
    this.tokens = null;
    return this.obterEstado();
  }

  /**
   * Gera tokens novos, como a renovação do original.
   * @returns {Promise<TokensGuardados>} Tokens novos.
   * @throws {Error} Se não houver sessão.
   */
  async renovar(): Promise<TokensGuardados> {
    if (!this.tokens) throw new Error(MSG_SEM_SESSAO);

    this.tokens = this.criarTokens();
    return this.tokens;
  }

  /** @returns {EstadoLogin} Logado, com o vencimento, ou não logado. */
  obterEstado(): EstadoLogin {
    if (!this.tokens) return { situacao: 'nao_logado', erro: null, expira_em: null };

    return { situacao: 'logado', erro: null, expira_em: this.tokens.expires_at };
  }

  /**
   * @returns {Promise<string | null>} Access token válido (renova se venceu), ou null sem sessão.
   */
  async obterTokenAcesso(): Promise<string | null> {
    if (!this.tokens) return null;

    const estaVencido = this.tokens.expires_at <= this.obterAgora();
    if (estaVencido) await this.renovar();
    return this.tokens?.access_token ?? null;
  }

  /** @returns {TokensGuardados} Tokens falsos com validade de uma hora. */
  private criarTokens(): TokensGuardados {
    return {
      access_token: `${PREFIXO_TOKEN_ACESSO_SIMULADO}${this.gerarId()}`,
      refresh_token: TOKEN_RENOVACAO_SIMULADO,
      expires_at: this.obterAgora() + VALIDADE_TOKEN_SIMULADO_MS,
    };
  }
}
