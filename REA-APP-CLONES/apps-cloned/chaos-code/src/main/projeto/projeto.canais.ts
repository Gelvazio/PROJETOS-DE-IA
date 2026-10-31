/**
 * Canais IPC de projetos (`projetos:*`): tratadores finos que validam a entrada e chamam o
 * `ServicoProjetos`. Este é o modelo dos outros módulos: um arquivo `<modulo>.canais.ts` com
 * `registrarCanais<Modulo>(ipc, servico, difundir)`, chamado em `src/main/canais.ts`.
 */

import { CANAIS_IPC } from '../../compartilhado/constantes';
import {
  exigirObjeto,
  exigirTexto,
  registrarCanalSeguro,
  type DifundirParaJanelas,
  type IpcMainMinimo,
  type TratadorCanal,
} from '../ipc/ipc-comum';
import type { ServicoProjetos } from './projeto.servico';

const MSG_ID_ATIVO_INVALIDO = 'Campo "id" deve ser um texto ou null';
const MSG_DESCRICAO_INVALIDA = 'Campo "description" deve ser um texto ou null';

/**
 * Valida os dados de um projeto novo vindos do renderer.
 * @param {unknown} bruto - Argumento recebido.
 * @returns {{ name: string, description: string | null }} Dados validados.
 * @throws {Error} Se o formato estiver errado.
 */
function lerDadosNovoProjeto(bruto: unknown): { name: string; description: string | null } {
  const dados = exigirObjeto(bruto, 'dados');
  const descricao = dados.description ?? null;
  if (descricao !== null && typeof descricao !== 'string') {
    throw new Error(MSG_DESCRICAO_INVALIDA);
  }
  return { name: exigirTexto(dados.name, 'name'), description: descricao };
}

/**
 * Define o projeto ativo (ou limpa, com `null`).
 * @param {ServicoProjetos} servico - Serviço de projetos.
 * @param {unknown} id - ID do projeto ou null.
 * @returns {Promise<unknown>} O projeto ativo, ou null.
 * @throws {Error} Se o argumento não for texto nem null, ou o projeto não existir.
 */
async function definirAtivo(servico: ServicoProjetos, id: unknown): Promise<unknown> {
  if (id === null) {
    servico.limparAtivo();
    return null;
  }
  if (typeof id !== 'string') throw new Error(MSG_ID_ATIVO_INVALIDO);
  return servico.definirAtivo(id);
}

/**
 * Monta o mapa canal → tratador das operações de projetos.
 * @param {ServicoProjetos} servico - Serviço de projetos.
 * @returns {Record<string, TratadorCanal>} Tratadores por nome de canal.
 */
function montarTratadores(servico: ServicoProjetos): Record<string, TratadorCanal> {
  return {
    [CANAIS_IPC.projetosListar]: () => servico.listar(),
    [CANAIS_IPC.projetosAbrir]: (id) => servico.abrir(exigirTexto(id, 'id')),
    [CANAIS_IPC.projetosCriar]: (dados) => servico.criar(lerDadosNovoProjeto(dados)),
    [CANAIS_IPC.projetosRenomear]: (id, nome) =>
      servico.renomear(exigirTexto(id, 'id'), exigirTexto(nome, 'nome')),
    [CANAIS_IPC.projetosRemover]: (id) => servico.remover(exigirTexto(id, 'id')),
    [CANAIS_IPC.projetosObterAtivo]: () => servico.obterAtivo(),
    [CANAIS_IPC.projetosDefinirAtivo]: (id) => definirAtivo(servico, id),
  };
}

/**
 * Registra os canais de projetos e repassa as mudanças do projeto ativo às janelas.
 * @param {IpcMainMinimo} ipc - `ipcMain` (ou um falso).
 * @param {ServicoProjetos} servico - Serviço de projetos.
 * @param {DifundirParaJanelas} difundir - Envia um evento do main para as janelas.
 * @returns {() => void} Função que cancela o repasse do projeto ativo.
 */
export function registrarCanaisProjetos(
  ipc: IpcMainMinimo,
  servico: ServicoProjetos,
  difundir: DifundirParaJanelas,
): () => void {
  const tratadores = montarTratadores(servico);
  for (const [canal, tratador] of Object.entries(tratadores)) {
    registrarCanalSeguro(ipc, canal, tratador);
  }
  return servico.aoMudarAtivo((projeto) => difundir(CANAIS_IPC.projetosAtivoMudou, projeto));
}
