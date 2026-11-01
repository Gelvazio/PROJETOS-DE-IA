/**
 * Ferramentas MCP de tarefas (CLONE.8.7): `list_tasks`, `get_task`, `create_task`,
 * `update_task`, `delete_task` e `restore_task` sobre a `ApiTarefas` da plataforma.
 */

import type { ApiTarefas } from '../../api/tarefas.api';
import type { FiltrosListaTarefas } from '../../../compartilhado/tipos-api';
import {
  campoNumeroOpcional,
  campoTextoOpcional,
  exigirCampoTexto,
  resultadoTextoJson,
  type MapaFerramentas,
} from './comum';

/**
 * Monta as ferramentas de tarefas.
 * @param {ApiTarefas} api - API de tarefas da plataforma.
 * @returns {MapaFerramentas} Mapa com as ferramentas.
 */
export function montarFerramentasTarefas(api: ApiTarefas): MapaFerramentas {
  return {
    list_tasks: async (argumentos, contexto) => {
      const filtros: FiltrosListaTarefas = {};
      const status = campoTextoOpcional(argumentos, 'status');
      const prioridade = campoTextoOpcional(argumentos, 'priority');
      if (status) filtros.status = status;
      if (prioridade) filtros.priority = prioridade;
      filtros.limit = campoNumeroOpcional(argumentos, 'limit');
      filtros.offset = campoNumeroOpcional(argumentos, 'offset');
      const tags = argumentos.tags;
      if (Array.isArray(tags)) filtros.tags = tags.filter((t): t is string => typeof t === 'string');
      return resultadoTextoJson(await api.listar(contexto.idProjeto, filtros));
    },
    get_task: async (argumentos, contexto) => {
      return resultadoTextoJson(
        await api.obter(contexto.idProjeto, exigirCampoTexto(argumentos, 'task_id')),
      );
    },
    create_task: async (argumentos, contexto) => {
      const pedido = {
        title: exigirCampoTexto(argumentos, 'title'),
        description: campoTextoOpcional(argumentos, 'description'),
        status: campoTextoOpcional(argumentos, 'status'),
        priority: campoTextoOpcional(argumentos, 'priority'),
        due_date: campoTextoOpcional(argumentos, 'due_date'),
        tags: Array.isArray(argumentos.tags) ? argumentos.tags : undefined,
        checklist: Array.isArray(argumentos.checklist) ? argumentos.checklist : undefined,
      };
      return resultadoTextoJson(await api.criar(contexto.idProjeto, pedido));
    },
    update_task: async (argumentos, contexto) => {
      const { task_id: _omitido, ...alteracoes } = argumentos;
      return resultadoTextoJson(
        await api.atualizar(
          contexto.idProjeto,
          exigirCampoTexto(argumentos, 'task_id'),
          alteracoes,
        ),
      );
    },
    delete_task: async (argumentos, contexto) => {
      await api.apagar(contexto.idProjeto, exigirCampoTexto(argumentos, 'task_id'));
      return resultadoTextoJson({ deleted: true });
    },
    restore_task: async (argumentos, contexto) => {
      return resultadoTextoJson(
        await api.restaurar(contexto.idProjeto, exigirCampoTexto(argumentos, 'task_id')),
      );
    },
  };
}
