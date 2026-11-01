/**
 * Tela de imagens (`images` do original): gera imagem pelo Gemini local, lista as imagens do
 * projeto na plataforma e apaga.
 */

import { ehErroIpc } from '../../compartilhado/tipos-ipc';
import {
  aviso,
  botao,
  campoTexto,
  el,
  exigirProjetoAtivo,
  textoErro,
  titulo,
} from './comum.tela';

/** Monta a tela de imagens. */
export async function montarTelaImagens(conteiner: HTMLElement): Promise<void> {
  conteiner.append(titulo('Galeria de imagens'));
  const projeto = await exigirProjetoAtivo(conteiner);
  if (!projeto) return;

  const saida = el('div', 'lista-resultados');
  const prompt = campoTexto('Descreva a imagem');
  const formulario = el('div', 'form-tela');
  formulario.append(
    prompt,
    botao('Gerar imagem', async () => {
      const r = await window.chaosCode.gerarImagem({
        idProjeto: projeto.id,
        prompt: prompt.value,
      });
      saida.replaceChildren();
      if (ehErroIpc(r)) {
        saida.append(aviso(textoErro(r)));
        return;
      }
      saida.append(aviso(`Gerada: ${r.nomeArquivo} (${r.tamanhoBytes} bytes) — ${r.caminho}`));
      if (r.texto) saida.append(aviso(r.texto));
    }),
    botao('Listar imagens do projeto', async () => {
      const r = await window.chaosCode.api.imagens.listar(projeto.id);
      saida.replaceChildren();
      if (ehErroIpc(r)) {
        saida.append(aviso(textoErro(r)));
        return;
      }
      const imagens = r.data ?? [];
      const ul = el('ul', 'lista-tela');
      imagens.forEach((img) => {
        const li = el('li', 'item-lista');
        li.append(el('span', 'nome-item', `${img.filename ?? img.id} — ${img.status}`));
        if (img.thumbnail_url) {
          const miniatura = el('img', 'miniatura');
          miniatura.src = img.thumbnail_url;
          li.append(miniatura);
        }
        ul.append(li);
      });
      saida.append(ul);
      if (!imagens.length) saida.append(aviso('Nenhuma imagem.'));
    }),
    saida,
  );
  conteiner.append(formulario);
}
