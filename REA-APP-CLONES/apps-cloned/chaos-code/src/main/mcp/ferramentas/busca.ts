/**
 * Ferramenta MCP `search_knowledge` (CLONE.8.5): consulta o conhecimento do projeto pelo
 * `ServicoConsulta` (vetores + grafo; `top_k` 1–100, padrão 5 — inventário `vetores-grafo.md` §5).
 */

import type { ServicoConsulta } from '../../grafo/consulta.servico';
import type { ModoBusca } from '../../../compartilhado/tipos-vetores';
import {
  campoNumeroOpcional,
  campoTextoOpcional,
  exigirCampoTexto,
  resultadoTextoJson,
  type MapaFerramentas,
} from './comum';

const MODOS: readonly string[] = ['local', 'global', 'hybrid'];
const MSG_MODO_INVALIDO = 'mode deve ser local, global ou hybrid';

/**
 * Monta a ferramenta `search_knowledge`.
 * @param {ServicoConsulta} consulta - Serviço de consulta.
 * @returns {MapaFerramentas} Mapa com a ferramenta.
 */
export function montarFerramentasBusca(consulta: ServicoConsulta): MapaFerramentas {
  return {
    search_knowledge: async (argumentos, contexto) => {
      const texto = exigirCampoTexto(argumentos, 'query');
      const modoBruto = campoTextoOpcional(argumentos, 'mode');
      if (modoBruto !== undefined && !MODOS.includes(modoBruto)) {
        throw new Error(MSG_MODO_INVALIDO);
      }
      const resultados = await consulta.consultar(contexto.idProjeto, texto, {
        modo: modoBruto as ModoBusca | undefined,
        topK: campoNumeroOpcional(argumentos, 'top_k'),
      });
      return resultadoTextoJson({ results: resultados });
    },
  };
}
