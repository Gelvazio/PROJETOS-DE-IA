/**
 * Utilidades compartilhadas das telas: elementos, erros IPC e o projeto ativo.
 */

import { ehErroIpc } from '../../compartilhado/tipos-ipc';
import type { ProjetoLocal } from '../../compartilhado/tipos-armazenamento';

/** Cria um elemento com classes e texto. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  classes = '',
  texto = '',
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classes) e.className = classes;
  if (texto) e.textContent = texto;
  return e;
}

/** Cria um botão com rótulo e ação. */
export function botao(
  rotulo: string,
  aoClicar: () => void | Promise<void>,
  classes = 'btn',
): HTMLButtonElement {
  const b = el('button', `btn ${classes}`, rotulo);
  b.addEventListener('click', () => void aoClicar());
  return b;
}

/** Campo de texto com placeholder. */
export function campoTexto(placeholder: string, classes = 'campo'): HTMLInputElement {
  const c = el('input', `campo ${classes}`);
  c.placeholder = placeholder;
  return c;
}

/** Título da tela. */
export function titulo(texto: string): HTMLHeadingElement {
  return el('h2', 'titulo-tela', texto);
}

/** Parágrafo de aviso/erro. */
export function aviso(texto: string): HTMLParagraphElement {
  return el('p', 'aviso-tela', texto);
}

/** Mostra o erro de uma resposta IPC ou de uma exceção. */
export function textoErro(respostaOuErro: unknown): string {
  if (ehErroIpc(respostaOuErro)) return respostaOuErro.erro;
  if (respostaOuErro instanceof Error) return respostaOuErro.message;
  return String(respostaOuErro);
}

/** Lê o projeto ativo; devolve `null` (com aviso no contêiner) se não houver. */
export async function exigirProjetoAtivo(
  conteiner: HTMLElement,
): Promise<ProjetoLocal | null> {
  const resposta = await window.chaosCode.obterProjetoAtivo();
  if (ehErroIpc(resposta)) {
    conteiner.append(aviso(`Erro ao ler o projeto ativo: ${resposta.erro}`));
    return null;
  }
  if (!resposta) {
    conteiner.append(aviso('Escolha um projeto na tela Projetos primeiro.'));
    return null;
  }
  return resposta;
}

/** Lista simples: um item por linha, com o texto formatado. */
export function listaSimples<T>(
  itens: T[],
  formatar: (item: T) => string,
): HTMLUListElement {
  const ul = el('ul', 'lista-tela');
  for (const item of itens) ul.append(el('li', 'item-lista', formatar(item)));
  return ul;
}
