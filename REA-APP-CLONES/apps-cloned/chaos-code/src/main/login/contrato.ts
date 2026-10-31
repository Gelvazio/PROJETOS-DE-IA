/**
 * Contrato comum dos provedores de login (real, CLONE.4.11, e simulado, CLONE.4.10). Quem usa o
 * login depende só desta interface e recebe o provedor por injeção.
 */

import type { EstadoLogin, TokensGuardados } from '../../compartilhado/tipos-login';

/** Operações de login que todo provedor oferece. */
export interface ProvedorLogin {
  /**
   * Faz o login e guarda os tokens.
   * @returns {Promise<EstadoLogin>} Estado depois do login.
   * @throws {Error} Se o login falhar.
   */
  entrar(): Promise<EstadoLogin>;

  /**
   * Encerra a sessão e apaga os tokens.
   * @returns {Promise<EstadoLogin>} Estado depois do logout (não logado).
   */
  sair(): Promise<EstadoLogin>;

  /**
   * Renova os tokens pelo refresh token.
   * @returns {Promise<TokensGuardados>} Tokens novos.
   * @throws {Error} Se não houver sessão ou a renovação falhar (a sessão é limpa).
   */
  renovar(): Promise<TokensGuardados>;

  /**
   * Informa o estado atual do login.
   * @returns {EstadoLogin} Estado atual.
   */
  obterEstado(): EstadoLogin;

  /**
   * Devolve o access token válido, renovando se tiver vencido.
   * @returns {Promise<string | null>} Access token, ou null se não estiver logado.
   */
  obterTokenAcesso(): Promise<string | null>;
}
