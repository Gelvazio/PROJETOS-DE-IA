/**
 * Token de sessão do MCP (`X-MCP-Session-Token`): gerado ao subir o servidor e gravado em
 * `mcp_config.json` ao encerrar (inventário `mcp-cli-wsl.md` §"Credenciais aceitas", 1).
 */

import { randomBytes } from 'node:crypto';
import type { PedidoHttpMcp, ResultadoAutenticacaoMcp } from './servidor';
import { gravarJson } from '../armazenamento/arquivo-json';
import type { ConfiguracaoMcp } from '../../compartilhado/tipos-armazenamento';

const NOME_CABECALHO_TOKEN = 'x-mcp-session-token';
const TAMANHO_TOKEN_BYTES = 32;
const PREFIXO_LOG = '[mcp]';
const TIPO_CREDENCIAL_SESSAO = 'session_token';

/** Interface de token de sessão: gerar, conferir e gravar em `mcp_config.json`. */
export interface TokenSessaoMcp {
  /** Token atual em texto hexadecimal. */
  obter(): string;
  /** Gera um token novo (rotação). */
  renovar(): string;
  /** Autenticador do servidor: aceita o cabeçalho `X-MCP-Session-Token` ou Bearer `mcp_at_`. */
  autenticar(pedido: PedidoHttpMcp, idProjeto: string): Promise<ResultadoAutenticacaoMcp>;
  /** Grava o token e a porta em `mcp_config.json`. */
  persistir(porta: number): Promise<void>;
}

/**
 * Gera um token de sessão aleatório de 32 bytes em hex (64 caracteres).
 * @returns {string} Token novo.
 */
export function gerarTokenSessao(): string {
  return randomBytes(TAMANHO_TOKEN_BYTES).toString('hex');
}

/**
 * Cria o token de sessão. `conferirBearer` (opcional) decide se um `Authorization: Bearer` vale
 * — quem implementa é a CLONE.8.4 (tokens `mcp_at_` do OAuth).
 * @param {string} caminhoConfig - Caminho de `mcp_config.json`.
 * @param {(token: string) => Promise<boolean>} [conferirBearer] - Valida tokens OAuth.
 * @param {(msg: string) => void} [registrarLog] - Log (padrão `console.info` com `[mcp]`).
 * @returns {TokenSessaoMcp} Operações do token.
 */
export function criarTokenSessao(
  caminhoConfig: string,
  conferirBearer?: (token: string) => Promise<boolean>,
  registrarLog: (m: string) => void = (m) => console.info(`${PREFIXO_LOG} ${m}`),
): TokenSessaoMcp {
  let token = gerarTokenSessao();
  registrarLog(`MCP HTTP session token gerado (primeiros 8 chars): ${token.slice(0, 8)}`);

  const conferirCabecalhoSessao = (pedido: PedidoHttpMcp): boolean => {
    const recebido = pedido.cabecalhos[NOME_CABECALHO_TOKEN];
    return typeof recebido === 'string' && recebido === token;
  };

  const lerBearer = async (pedido: PedidoHttpMcp): Promise<string | null> => {
    const autorizacao = pedido.cabecalhos.authorization;
    if (typeof autorizacao !== 'string') return null;
    const minusculo = autorizacao.toLowerCase();
    if (!minusculo.startsWith('bearer ')) return null;
    const valor = autorizacao.slice('bearer '.length).trim();
    return valor || null;
  };

  return {
    obter: () => token,
    renovar() {
      token = gerarTokenSessao();
      registrarLog(`MCP HTTP session token renovado (primeiros 8 chars): ${token.slice(0, 8)}`);
      return token;
    },
    async autenticar(pedido, _idProjeto) {
      if (conferirCabecalhoSessao(pedido)) {
        return { autorizado: true, tipoCredencial: TIPO_CREDENCIAL_SESSAO };
      }
      const bearer = await lerBearer(pedido);
      if (bearer !== null && conferirBearer !== undefined) {
        const valido = await conferirBearer(bearer);
        if (valido) return { autorizado: true, tipoCredencial: 'oauth' };
      }
      return { autorizado: false };
    },
    async persistir(porta) {
      const config: ConfiguracaoMcp = { port: porta, session_token: token };
      await gravarJson(caminhoConfig, config);
    },
  };
}
