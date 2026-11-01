/**
 * API de modelos de agente (`GET /api/client/agent-templates`): lista os modelos prontos de
 * agentes, com filtro opcional por categoria (docs/inventario/api.md).
 */
import type { FiltrosModelosAgente, RespostaModelosAgente } from '../../compartilhado/tipos-api';
import type { ClienteHttp } from './cliente-http';

const CAMINHO_MODELOS_AGENTE = '/api/client/agent-templates';
const PARAMETRO_CATEGORIA = 'category';

/** Operações da API de modelos de agente. */
export interface ApiModelosAgente {
  /**
   * Lista os modelos de agente da plataforma.
   * @param filtros - Filtro opcional por categoria.
   * @returns Resposta com os modelos.
   * @throws {ErroApi} Erro de rede, tempo esgotado, HTTP ou resposta inválida.
   */
  listar(filtros?: FiltrosModelosAgente): Promise<RespostaModelosAgente>;
}

/**
 * Monta o caminho da listagem, com a query quando há categoria.
 * @param filtros - Filtros opcionais.
 * @returns Caminho com a barra inicial.
 */
function montarCaminhoListagem(filtros?: FiltrosModelosAgente): string {
  if (!filtros?.category) return CAMINHO_MODELOS_AGENTE;

  const parametros = new URLSearchParams({ [PARAMETRO_CATEGORIA]: filtros.category });
  return `${CAMINHO_MODELOS_AGENTE}?${parametros.toString()}`;
}

/**
 * Cria a API de modelos de agente.
 * @param cliente - Cliente HTTP autenticado.
 * @returns Objeto com `listar`.
 */
export function criarApiModelosAgente(cliente: ClienteHttp): ApiModelosAgente {
  return {
    listar(filtros) {
      return cliente.requisitar<RespostaModelosAgente>({
        metodo: 'GET',
        caminho: montarCaminhoListagem(filtros),
      });
    },
  };
}
