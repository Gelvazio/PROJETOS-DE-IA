/**
 * Ferramentas MCP do grafo (CLONE.8.6): `list_entities` e `get_relations` sobre o
 * `RepositorioGrafo`, e `search_knowledge` no modo grafo pelo `ServicoConsulta`.
 */

import { normalizarNome, type RepositorioGrafo } from '../../grafo/grafo.repositorio';
import {
  campoTextoOpcional,
  resultadoTextoJson,
  type MapaFerramentas,
} from './comum';

/**
 * Monta as ferramentas do grafo (`list_entities` e `get_relations`).
 * @param {RepositorioGrafo} repositorio - Armazenamento do grafo.
 * @returns {MapaFerramentas} Mapa com as ferramentas.
 */
export function montarFerramentasGrafo(repositorio: RepositorioGrafo): MapaFerramentas {
  return {
    list_entities: async (argumentos, contexto) => {
      const dados = await repositorio.carregar(contexto.idProjeto);
      const nome = campoTextoOpcional(argumentos, 'name');
      const tipo = campoTextoOpcional(argumentos, 'entity_type');
      const nomeNormal = nome ? normalizarNome(nome) : null;
      const filtradas = dados.entidades.filter((entidade) => {
        if (tipo && entidade.entity_type !== tipo) return false;
        if (!nomeNormal) return true;
        const campos = [entidade.name, ...entidade.aliases].join(' ');
        return normalizarNome(campos).includes(nomeNormal);
      });
      return resultadoTextoJson({ entities: filtradas });
    },

    get_relations: async (argumentos, contexto) => {
      const dados = await repositorio.carregar(contexto.idProjeto);
      const nome = campoTextoOpcional(argumentos, 'entity_name');
      const nomeNormal = nome ? normalizarNome(nome) : null;
      const filtradas = dados.relacoes.filter((relacao) => {
        if (!nomeNormal) return true;
        return (
          normalizarNome(relacao.source_entity).includes(nomeNormal) ||
          normalizarNome(relacao.target_entity).includes(nomeNormal)
        );
      });
      return resultadoTextoJson({ relations: filtradas });
    },
  };
}
