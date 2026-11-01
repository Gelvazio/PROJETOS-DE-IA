/**
 * Canais IPC de vetores/indexação (`vetores:*`): `sync_project` → `indexarProjeto` (progresso
 * pelo evento `vetores:progresso`), `cancel_sync`, `get_project_rag_status`, `toggle_project_rag`
 * e a busca no índice. O cancelamento usa um `AbortController` por projeto.
 */

import { CANAIS_IPC } from '../../compartilhado/constantes';
import type {
  ProgressoIndexacaoIpc,
  ResultadoBuscaVetores,
  StatusRagProjeto,
} from '../../compartilhado/tipos-ipc-vetores';
import type { ApiVetores } from '../../compartilhado/tipos-ipc-vetores';
import type { ProjetoLocal } from '../../compartilhado/tipos-armazenamento';
import {
  exigirTexto,
  registrarCanalSeguro,
  type DifundirParaJanelas,
  type IpcMainMinimo,
} from '../ipc/ipc-comum';
import type { ServicoIndexacao } from './indexacao.servico';

/** Recorte dos projetos que os canais de vetores usam. */
export interface ProjetosVetores {
  buscarPorId(id: string): Promise<ProjetoLocal | null>;
  salvar(projeto: ProjetoLocal): Promise<ProjetoLocal>;
}

/** Dependências dos canais de vetores. */
export interface DependenciasCanaisVetores {
  servicoIndexacao: ServicoIndexacao;
  projetos: ProjetosVetores;
  difundir: DifundirParaJanelas;
}

const MSG_PROJETO_NAO_ENCONTRADO = 'Projeto não encontrado';
const MSG_K_INVALIDO = 'Campo "k" deve ser um número inteiro entre 1 e 100';
const K_MINIMO = 1;
const K_MAXIMO = 100;

/** Operações de vetores que a interface pode chamar (`window.chaosCode`). */
export type ApiVetoresCanais = ApiVetores;

/**
 * Valida o k da busca.
 * @param {unknown} k - Argumento recebido do renderer.
 * @returns {number | undefined} k validado.
 * @throws {Error} Se não for inteiro entre 1 e 100.
 */
function lerK(k: unknown): number | undefined {
  if (k === undefined) return undefined;
  if (typeof k !== 'number' || !Number.isInteger(k) || k < K_MINIMO || k > K_MAXIMO) {
    throw new Error(MSG_K_INVALIDO);
  }
  return k;
}

/**
 * Devolve o status RAG/indexação do projeto.
 * @param {ProjetosVetores} projetos - Acesso aos projetos.
 * @param {unknown} id - ID do projeto.
 * @returns {Promise<StatusRagProjeto>} `rag_enabled` e `sync_state`.
 * @throws {Error} Se o projeto não existir.
 */
async function obterStatusRag(projetos: ProjetosVetores, id: unknown): Promise<StatusRagProjeto> {
  const projeto = await projetos.buscarPorId(exigirTexto(id, 'id'));
  if (!projeto) throw new Error(MSG_PROJETO_NAO_ENCONTRADO);
  return { rag_enabled: projeto.rag_enabled ?? false, sync_state: projeto.sync_state ?? null };
}

/**
 * Registra os canais de vetores.
 * @param {IpcMainMinimo} ipc - `ipcMain` (ou um falso).
 * @param {DependenciasCanaisVetores} deps - Serviço, projetos e difusão.
 * @returns {void}
 */
export function registrarCanaisVetores(ipc: IpcMainMinimo, deps: DependenciasCanaisVetores): void {
  const { servicoIndexacao, projetos, difundir } = deps;
  const cancelamentos = new Map<string, AbortController>();

  registrarCanalSeguro(ipc, CANAIS_IPC.vetoresIndexar, async (id) => {
    const idProjeto = exigirTexto(id, 'id');
    const controlador = new AbortController();
    cancelamentos.set(idProjeto, controlador);
    try {
      return await servicoIndexacao.indexarProjeto(idProjeto, {
        sinal: controlador.signal,
        aoProgredir: (progresso) => {
          const evento: ProgressoIndexacaoIpc = { ...progresso, project_id: idProjeto };
          difundir(CANAIS_IPC.vetoresProgresso, evento);
        },
      });
    } finally {
      cancelamentos.delete(idProjeto);
    }
  });

  registrarCanalSeguro(ipc, CANAIS_IPC.vetoresCancelar, (id) => {
    const idProjeto = exigirTexto(id, 'id');
    const controlador = cancelamentos.get(idProjeto);
    if (!controlador) return { cancelada: false };
    controlador.abort();
    cancelamentos.delete(idProjeto);
    return { cancelada: true };
  });

  registrarCanalSeguro(ipc, CANAIS_IPC.vetoresBuscar, async (id, consulta, k) => {
    const resultados = await servicoIndexacao.buscar(
      exigirTexto(id, 'id'),
      exigirTexto(consulta, 'consulta'),
      { k: lerK(k) },
    );
    const saida: ResultadoBuscaVetores[] = resultados.map((resultado) => ({
      id: resultado.id,
      score: resultado.pontuacao,
      source_type: resultado.tipoFonte,
      text: resultado.texto,
      metadata: (resultado.metadata as unknown as Record<string, unknown> | null) ?? null,
    }));
    return saida;
  });

  registrarCanalSeguro(ipc, CANAIS_IPC.vetoresObterStatusRag, (id) => {
    return obterStatusRag(projetos, id);
  });

  registrarCanalSeguro(ipc, CANAIS_IPC.vetoresAlternarRag, async (id, ligado) => {
    const idProjeto = exigirTexto(id, 'id');
    const projeto = await projetos.buscarPorId(idProjeto);
    if (!projeto) throw new Error(MSG_PROJETO_NAO_ENCONTRADO);
    await projetos.salvar({ ...projeto, rag_enabled: ligado === true });
    return obterStatusRag(projetos, idProjeto);
  });
}
