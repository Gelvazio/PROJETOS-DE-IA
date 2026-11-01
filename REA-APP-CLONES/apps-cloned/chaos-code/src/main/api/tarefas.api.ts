/**
 * API de tarefas da plataforma (docs/inventario/api.md): listar, ler, criar, alterar, apagar
 * (vai para a lixeira) e restaurar tarefas de um projeto. Usa o cliente HTTP base.
 */
import type {
  FiltrosListaTarefas,
  PedidoAtualizarTarefa,
  PedidoCriarTarefa,
  RespostaListaTarefas,
  RespostaTarefa,
} from '../../compartilhado/tipos-api';
import type { ClienteHttp } from './cliente-http';

const LIMITE_PADRAO_TAREFAS = 20;
const DESLOCAMENTO_PADRAO_TAREFAS = 0;
const SEPARADOR_TAGS = ',';

/** Operações de tarefas de um projeto. */
export interface ApiTarefas {
  /** Lista as tarefas do projeto, com paginação e filtros opcionais. */
  listar(idProjeto: string, filtros?: FiltrosListaTarefas): Promise<RespostaListaTarefas>;
  /** Lê uma tarefa. */
  obter(idProjeto: string, idTarefa: string): Promise<RespostaTarefa>;
  /** Cria uma tarefa. */
  criar(idProjeto: string, pedido: PedidoCriarTarefa): Promise<RespostaTarefa>;
  /** Altera campos de uma tarefa. */
  atualizar(
    idProjeto: string,
    idTarefa: string,
    pedido: PedidoAtualizarTarefa,
  ): Promise<RespostaTarefa>;
  /** Move a tarefa para a lixeira. */
  apagar(idProjeto: string, idTarefa: string): Promise<unknown>;
  /** Restaura uma tarefa da lixeira. */
  restaurar(idProjeto: string, idTarefa: string): Promise<RespostaTarefa>;
}

/**
 * Monta o caminho base das tarefas de um projeto.
 * @param idProjeto - Identificador do projeto.
 * @returns Caminho `/api/projects/{p}/tasks`.
 */
function caminhoTarefas(idProjeto: string): string {
  return `/api/projects/${encodeURIComponent(idProjeto)}/tasks`;
}

/**
 * Monta o caminho de uma tarefa.
 * @param idProjeto - Identificador do projeto.
 * @param idTarefa - Identificador da tarefa.
 * @returns Caminho `/api/projects/{p}/tasks/{id}`.
 */
function caminhoTarefa(idProjeto: string, idTarefa: string): string {
  return `${caminhoTarefas(idProjeto)}/${encodeURIComponent(idTarefa)}`;
}

/**
 * Monta a query string da listagem (limit e offset sempre presentes).
 * @param filtros - Paginação e filtros opcionais.
 * @returns Query sem o `?` inicial.
 */
function montarQueryListagem(filtros: FiltrosListaTarefas): string {
  const parametros = new URLSearchParams();
  parametros.set('limit', String(filtros.limit ?? LIMITE_PADRAO_TAREFAS));
  parametros.set('offset', String(filtros.offset ?? DESLOCAMENTO_PADRAO_TAREFAS));
  if (filtros.status) parametros.set('status', filtros.status);
  if (filtros.priority) parametros.set('priority', filtros.priority);
  if (filtros.tags?.length) parametros.set('tags', filtros.tags.join(SEPARADOR_TAGS));
  return parametros.toString();
}

/**
 * Cria a API de tarefas.
 * @param cliente - Cliente HTTP autenticado.
 * @returns Operações de tarefas.
 */
export function criarApiTarefas(cliente: ClienteHttp): ApiTarefas {
  return {
    listar: (idProjeto, filtros = {}) =>
      cliente.requisitar<RespostaListaTarefas>({
        metodo: 'GET',
        caminho: `${caminhoTarefas(idProjeto)}?${montarQueryListagem(filtros)}`,
      }),
    obter: (idProjeto, idTarefa) =>
      cliente.requisitar<RespostaTarefa>({
        metodo: 'GET',
        caminho: caminhoTarefa(idProjeto, idTarefa),
      }),
    criar: (idProjeto, pedido) =>
      cliente.requisitar<RespostaTarefa>({
        metodo: 'POST',
        caminho: caminhoTarefas(idProjeto),
        corpo: pedido,
      }),
    atualizar: (idProjeto, idTarefa, pedido) =>
      cliente.requisitar<RespostaTarefa>({
        metodo: 'PATCH',
        caminho: caminhoTarefa(idProjeto, idTarefa),
        corpo: pedido,
      }),
    apagar: (idProjeto, idTarefa) =>
      cliente.requisitar<unknown>({
        metodo: 'DELETE',
        caminho: caminhoTarefa(idProjeto, idTarefa),
      }),
    restaurar: (idProjeto, idTarefa) =>
      cliente.requisitar<RespostaTarefa>({
        metodo: 'POST',
        caminho: `${caminhoTarefa(idProjeto, idTarefa)}/restore`,
      }),
  };
}
