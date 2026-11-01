/**
 * Canais IPC do grafo (`grafo:*`): `query_knowledge` → `ServicoConsulta.consultar`,
 * `search_entities` e `get_graph_data` sobre o `RepositorioGrafo`.
 */

import { CANAIS_IPC } from '../../compartilhado/constantes';
import type { Entidade, Relacao } from '../../compartilhado/tipos-grafo';
import type { DadosGrafoIpc } from '../../compartilhado/tipos-ipc-grafo';
import type { ModoBusca } from '../../compartilhado/tipos-vetores';
import {
  exigirObjeto,
  exigirTexto,
  registrarCanalSeguro,
  type IpcMainMinimo,
} from '../ipc/ipc-comum';
import { normalizarNome, type RepositorioGrafo } from './grafo.repositorio';
import type { ServicoConsulta } from './consulta.servico';

/** Dependências dos canais do grafo. */
export interface DependenciasCanaisGrafo {
  servicoConsulta: ServicoConsulta;
  repositorioGrafo: RepositorioGrafo;
}

const PROFUNDIDADE_PADRAO = 1;
const PROFUNDIDADE_MAXIMA = 5;
const MODOS: readonly string[] = ['local', 'global', 'hybrid'];
const MSG_MODO_INVALIDO = 'Campo "modo" deve ser local, global ou hybrid';

/**
 * Lê as opções da consulta vindas do renderer.
 * @param {unknown} bruto - Objeto `{ modo?, topK? }`.
 * @returns {{ modo?: ModoBusca; topK?: number }} Opções validadas.
 * @throws {Error} Se o formato estiver errado.
 */
function lerOpcoesConsulta(bruto: unknown): { modo?: ModoBusca; topK?: number } {
  if (bruto === undefined) return {};
  const opcoes = exigirObjeto(bruto, 'opcoes');
  const modo = opcoes.modo;
  if (modo !== undefined && (typeof modo !== 'string' || !MODOS.includes(modo))) {
    throw new Error(MSG_MODO_INVALIDO);
  }
  return { modo: modo as ModoBusca | undefined, topK: opcoes.topK as number | undefined };
}

/**
 * Texto opcional: aceita `undefined`/`null`, exige texto quando presente.
 * @param {unknown} valor - Argumento recebido.
 * @param {string} campo - Nome do campo.
 * @returns {string | undefined} Texto validado.
 */
function textoOpcional(valor: unknown, campo: string): string | undefined {
  if (valor === undefined || valor === null) return undefined;
  return exigirTexto(valor, campo);
}

/**
 * Filtra entidades por nome (substring normalizada) e/ou tipo.
 * @param {Entidade[]} entidades - Entidades do projeto.
 * @param {string | undefined} nome - Filtro de nome.
 * @param {string | undefined} tipo - Filtro de tipo.
 * @returns {Entidade[]} Entidades que passam nos filtros.
 */
function filtrarEntidades(
  entidades: Entidade[],
  nome: string | undefined,
  tipo: string | undefined,
): Entidade[] {
  const nomeNormal = nome ? normalizarNome(nome) : null;
  return entidades.filter((entidade) => {
    if (tipo && entidade.entity_type !== tipo) return false;
    if (!nomeNormal) return true;
    const campos = [entidade.name, ...entidade.aliases].join(' ');
    return normalizarNome(campos).includes(nomeNormal);
  });
}

/**
 * Junta a vizinhança de uma entidade até `profundidade` níveis (ou o grafo todo sem nome).
 * @param {RepositorioGrafo} repositorio - Armazenamento do grafo.
 * @param {string} idProjeto - ID do projeto.
 * @param {string | undefined} nomeEntidade - Entidade central.
 * @param {number} profundidade - Níveis de vizinhança.
 * @returns {Promise<DadosGrafoIpc>} Entidades e relações do recorte.
 */
async function obterDadosGrafo(
  repositorio: RepositorioGrafo,
  idProjeto: string,
  nomeEntidade: string | undefined,
  profundidade: number,
): Promise<DadosGrafoIpc> {
  const dados = await repositorio.carregar(idProjeto);
  if (!nomeEntidade) return { entidades: dados.entidades, relacoes: dados.relacoes };
  const centro = normalizarNome(nomeEntidade);
  const nomes = new Set(
    dados.entidades.filter((e) => normalizarNome(e.name) === centro).map((e) => e.name),
  );
  if (nomes.size === 0) return { entidades: [], relacoes: [] };
  const relacoes: Relacao[] = [];
  let fronteira = nomes;
  for (let nivel = 0; nivel < profundidade; nivel += 1) {
    const proxima = new Set<string>();
    for (const relacao of dados.relacoes) {
      const liga = fronteira.has(relacao.source_entity) || fronteira.has(relacao.target_entity);
      if (!liga || relacoes.includes(relacao)) continue;
      relacoes.push(relacao);
      proxima.add(relacao.source_entity).add(relacao.target_entity);
    }
    fronteira = new Set([...proxima].filter((nome) => !nomes.has(nome)));
    proxima.forEach((nome) => nomes.add(nome));
    if (fronteira.size === 0) break;
  }
  const entidades = dados.entidades.filter((entidade) => nomes.has(entidade.name));
  return { entidades, relacoes };
}

/**
 * Registra os canais do grafo.
 * @param {IpcMainMinimo} ipc - `ipcMain` (ou um falso).
 * @param {DependenciasCanaisGrafo} deps - Serviço de consulta e repositório do grafo.
 * @returns {void}
 */
export function registrarCanaisGrafo(ipc: IpcMainMinimo, deps: DependenciasCanaisGrafo): void {
  const { servicoConsulta, repositorioGrafo } = deps;

  registrarCanalSeguro(ipc, CANAIS_IPC.grafoConsultar, (id, consulta, opcoes) => {
    return servicoConsulta.consultar(
      exigirTexto(id, 'id'),
      exigirTexto(consulta, 'consulta'),
      lerOpcoesConsulta(opcoes),
    );
  });

  registrarCanalSeguro(ipc, CANAIS_IPC.grafoBuscarEntidades, async (id, nome, tipo) => {
    const dados = await repositorioGrafo.carregar(exigirTexto(id, 'id'));
    return filtrarEntidades(
      dados.entidades,
      textoOpcional(nome, 'nome'),
      textoOpcional(tipo, 'tipo'),
    );
  });

  registrarCanalSeguro(ipc, CANAIS_IPC.grafoObterDados, (id, nomeEntidade, profundidade) => {
    const prof = profundidade === undefined ? PROFUNDIDADE_PADRAO : Number(profundidade);
    const valida = Number.isInteger(prof) && prof >= 0 && prof <= PROFUNDIDADE_MAXIMA;
    return obterDadosGrafo(
      repositorioGrafo,
      exigirTexto(id, 'id'),
      textoOpcional(nomeEntidade, 'nomeEntidade'),
      valida ? prof : PROFUNDIDADE_PADRAO,
    );
  });
}
