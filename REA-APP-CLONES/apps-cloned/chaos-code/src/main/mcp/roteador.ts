/**
 * Roteador JSON-RPC do MCP (`initialize`, `tools/list`, `tools/call` — protocolo
 * `2024-11-05`, inventário `mcp-cli-wsl.md`). Liga as ferramentas ao `ServidorMcp`.
 */

import { FERRAMENTAS_MCP } from './ferramentas-definicoes';
import type { MapaFerramentas } from './ferramentas/comum';
import type { ContextoPedidoMcp, RoteadorMcp } from './servidor';

/** Mensagem JSON-RPC 2.0 recebida. */
interface MensagemJsonRpc {
  jsonrpc?: string;
  id?: unknown;
  method?: string;
  params?: Record<string, unknown>;
}

const PROTOCOLO_MCP = '2024-11-05';
const NOME_SERVIDOR = 'chaos-code';
const VERSAO_SERVIDOR = '1.11.2';
const CODIGO_PARSE_ERROR = -32700;
const CODIGO_METODO_NAO_ENCONTRADO = -32601;
const CODIGO_PARAMETROS_INVALIDOS = -32602;
const CODIGO_ERRO_INTERNO = -32603;
const METODOS_NOTIFICACAO = ['notifications/initialized', 'notifications/cancelled'];

/**
 * Monta resposta JSON-RPC de sucesso.
 * @param {unknown} id - `id` do pedido.
 * @param {unknown} resultado - Resultado do método.
 * @returns {object} Resposta JSON-RPC.
 */
function respostaOk(id: unknown, resultado: unknown): object {
  return { jsonrpc: '2.0', id: id ?? null, result: resultado };
}

/**
 * Monta resposta JSON-RPC de erro.
 * @param {unknown} id - `id` do pedido.
 * @param {number} codigo - Código do erro JSON-RPC.
 * @param {string} mensagem - Mensagem legível.
 * @returns {object} Resposta JSON-RPC.
 */
function respostaErro(id: unknown, codigo: number, mensagem: string): object {
  return { jsonrpc: '2.0', id: id ?? null, error: { code: codigo, message: mensagem } };
}

/**
 * Trata o `initialize`: apresenta protocolo, capacidades e identidade do servidor.
 * @param {unknown} id - `id` do pedido.
 * @returns {object} Resposta JSON-RPC.
 */
function tratarInitialize(id: unknown): object {
  return respostaOk(id, {
    protocolVersion: PROTOCOLO_MCP,
    capabilities: { tools: {} },
    serverInfo: { name: NOME_SERVIDOR, version: VERSAO_SERVIDOR },
  });
}

/**
 * Executa um `tools/call`: acha a ferramenta pelo nome e repassa `arguments` e o contexto.
 * @param {unknown} id - `id` do pedido.
 * @param {Record<string, unknown>} params - `name` e `arguments`.
 * @param {MapaFerramentas} ferramentas - Executores por nome.
 * @param {ContextoPedidoMcp} contexto - `project_id` e credencial.
 * @returns {Promise<object>} Resposta JSON-RPC.
 */
async function tratarChamada(
  id: unknown,
  params: Record<string, unknown>,
  ferramentas: MapaFerramentas,
  contexto: ContextoPedidoMcp,
): Promise<object> {
  const nome = params.name;
  if (typeof nome !== 'string') {
    return respostaErro(id, CODIGO_PARAMETROS_INVALIDOS, 'Parâmetro "name" é obrigatório');
  }
  const executor = ferramentas[nome];
  if (!executor) {
    return respostaErro(id, CODIGO_METODO_NAO_ENCONTRADO, `Ferramenta desconhecida: ${nome}`);
  }
  const argumentos =
    typeof params.arguments === 'object' && params.arguments !== null
      ? (params.arguments as Record<string, unknown>)
      : {};
  try {
    const resultado = await executor(argumentos, contexto);
    return respostaOk(id, resultado);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : 'Erro desconhecido';
    return respostaErro(id, CODIGO_ERRO_INTERNO, mensagem);
  }
}

/**
 * Cria o roteador JSON-RPC do servidor MCP.
 * @param {MapaFerramentas} ferramentas - Executores por nome de ferramenta.
 * @returns {RoteadorMcp} Função `rotear` para o `ServidorMcp`.
 */
export function criarRoteadorMcp(ferramentas: MapaFerramentas): RoteadorMcp {
  return async (mensagemBruta, contexto) => {
    const mensagem = mensagemBruta as MensagemJsonRpc | null;
    if (!mensagem || typeof mensagem !== 'object') {
      return respostaErro(null, CODIGO_PARSE_ERROR, 'Mensagem deve ser um objeto JSON-RPC');
    }
    const metodo = mensagem.method;
    if (typeof metodo !== 'string') {
      return respostaErro(mensagem.id ?? null, CODIGO_PARSE_ERROR, 'Campo "method" ausente');
    }
    if (METODOS_NOTIFICACAO.includes(metodo) || metodo.startsWith('notifications/')) {
      return null;
    }
    if (metodo === 'initialize') return tratarInitialize(mensagem.id);
    if (metodo === 'ping') return respostaOk(mensagem.id, {});
    if (metodo === 'tools/list') {
      return respostaOk(mensagem.id, {
        tools: FERRAMENTAS_MCP.filter((ferramenta) => ferramentas[ferramenta.name] !== undefined),
      });
    }
    if (metodo === 'tools/call') {
      const params = mensagem.params ?? {};
      return tratarChamada(mensagem.id, params, ferramentas, contexto);
    }
    return respostaErro(mensagem.id, CODIGO_METODO_NAO_ENCONTRADO, 'Method not found');
  };
}
