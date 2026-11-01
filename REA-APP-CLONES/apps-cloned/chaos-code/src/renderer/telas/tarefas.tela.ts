/**
 * Tela de tarefas (`tasks` do original): lista as tarefas do projeto ativo na plataforma,
 * cria e marca como concluídas.
 */

import { ehErroIpc } from '../../compartilhado/tipos-ipc';
import type { TarefaApi } from '../../compartilhado/tipos-api';
import { aviso, botao, campoTexto, el, exigirProjetoAtivo, textoErro, titulo } from './comum.tela';

/** Monta a linha de uma tarefa. */
function montarLinha(
  tarefa: TarefaApi,
  idProjeto: string,
  aoRecarregar: () => void,
): HTMLLIElement {
  const li = el('li', 'item-lista');
  li.append(el('span', 'nome-item', `${tarefa.title} — ${tarefa.status}`));
  if (tarefa.priority) li.append(el('small', 'descricao-item', tarefa.priority));
  if (tarefa.status !== 'done') {
    li.append(
      botao('Concluir', async () => {
        await window.chaosCode.api.tarefas.atualizar(idProjeto, tarefa.id, { status: 'done' });
        aoRecarregar();
      }),
    );
  }
  return li;
}

/** Recarrega a lista. */
async function carregar(
  lista: HTMLUListElement,
  idProjeto: string,
  aoRecarregar: () => void,
): Promise<void> {
  lista.replaceChildren();
  const resposta = await window.chaosCode.api.tarefas.listar(idProjeto);
  if (ehErroIpc(resposta)) {
    lista.append(aviso(`Erro: ${resposta.erro}`));
    return;
  }
  const tarefas = resposta.data ?? [];
  tarefas.forEach((t) => lista.append(montarLinha(t, idProjeto, aoRecarregar)));
  if (!tarefas.length) lista.append(aviso('Nenhuma tarefa.'));
}

/** Monta a tela de tarefas. */
export async function montarTelaTarefas(conteiner: HTMLElement): Promise<void> {
  conteiner.append(titulo('Tarefas'));
  const projeto = await exigirProjetoAtivo(conteiner);
  if (!projeto) return;

  const lista = el('ul', 'lista-tela');
  const recarregar = () => void carregar(lista, projeto.id, recarregar);
  conteiner.append(lista);

  const formulario = el('div', 'form-tela');
  const tituloTarefa = campoTexto('Título da tarefa');
  const erro = el('p', 'aviso-tela');
  formulario.append(
    tituloTarefa,
    botao('Criar tarefa', async () => {
      const resposta = await window.chaosCode.api.tarefas.criar(projeto.id, {
        title: tituloTarefa.value,
      });
      if (ehErroIpc(resposta)) {
        erro.textContent = textoErro(resposta);
        return;
      }
      tituloTarefa.value = '';
      recarregar();
    }),
    erro,
  );
  conteiner.append(formulario);
  recarregar();
}
