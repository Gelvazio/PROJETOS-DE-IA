/**
 * Tela de projetos (`projects` do original): lista, cria, abre (define ativo), renomeia e
 * remove projetos locais.
 */

import { ehErroIpc } from '../../compartilhado/tipos-ipc';
import type { ProjetoLocal } from '../../compartilhado/tipos-armazenamento';
import { aviso, botao, campoTexto, el, textoErro, titulo } from './comum.tela';

/** Monta a linha de um projeto com ações. */
function montarLinha(
  projeto: ProjetoLocal,
  ativoId: string | null,
  aoRecarregar: () => void,
): HTMLLIElement {
  const li = el('li', 'item-lista item-projeto');
  const nome = el('span', 'nome-item', `${projeto.name}${projeto.id === ativoId ? ' (ativo)' : ''}`);
  li.append(nome);
  if (projeto.description) li.append(el('small', 'descricao-item', projeto.description));
  li.append(
    botao('Abrir', async () => {
      await window.chaosCode.definirProjetoAtivo(projeto.id);
      aoRecarregar();
    }),
    botao('Remover', async () => {
      await window.chaosCode.removerProjeto(projeto.id);
      aoRecarregar();
    }),
  );
  return li;
}

/** Recarrega a lista de projetos. */
async function carregarLista(lista: HTMLUListElement, aoRecarregar: () => void): Promise<void> {
  lista.replaceChildren();
  const [projetos, ativo] = await Promise.all([
    window.chaosCode.listarProjetos(),
    window.chaosCode.obterProjetoAtivo(),
  ]);
  if (ehErroIpc(projetos)) {
    lista.replaceChildren(aviso(`Erro: ${projetos.erro}`));
    return;
  }
  const ativoId = ehErroIpc(ativo) || !ativo ? null : ativo.id;
  projetos.forEach((p) => lista.append(montarLinha(p, ativoId, aoRecarregar)));
  if (!projetos.length) lista.append(aviso('Nenhum projeto ainda.'));
}

/** Monta a tela de projetos. */
export function montarTelaProjetos(conteiner: HTMLElement): void {
  conteiner.append(titulo('Projetos'));
  const lista = el('ul', 'lista-tela');
  const recarregar = () => void carregarLista(lista, recarregar);
  conteiner.append(lista);

  const formulario = el('div', 'form-tela');
  const nome = campoTexto('Nome do projeto');
  const caminho = campoTexto('Pasta local (opcional)');
  const erro = el('p', 'aviso-tela');
  formulario.append(
    nome,
    caminho,
    botao('Criar projeto', async () => {
      const resposta = await window.chaosCode.criarProjeto({
        name: nome.value,
        description: caminho.value || null,
      });
      if (ehErroIpc(resposta)) {
        erro.textContent = textoErro(resposta);
        return;
      }
      nome.value = '';
      caminho.value = '';
      recarregar();
    }),
    erro,
  );
  conteiner.append(formulario);
  recarregar();
}
