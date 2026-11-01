/**
 * Tela de agentes (`agents` do original): modelos embutidos da plataforma e os agentes do
 * projeto/pasta do usuário lidos das pastas dos CLIs.
 */

import { ehErroIpc } from '../../compartilhado/tipos-ipc';
import {
  aviso,
  botao,
  campoTexto,
  el,
  exigirProjetoAtivo,
  listaSimples,
  textoErro,
  titulo,
} from './comum.tela';

/** Monta a tela de agentes. */
export async function montarTelaAgentes(conteiner: HTMLElement): Promise<void> {
  conteiner.append(titulo('Agentes'));

  const secaoModelos = el('div', 'form-tela');
  const saida = el('div', 'lista-resultados');
  secaoModelos.append(
    el('h3', 'subtitulo-tela', 'Modelos de agente'),
    botao('Listar modelos', async () => {
      const r = await window.chaosCode.api.modelosAgente.listar();
      saida.replaceChildren();
      if (ehErroIpc(r)) {
        saida.append(aviso(textoErro(r)));
        return;
      }
      const modelos = (r as { data?: unknown[] }).data ?? [];
      saida.append(
        listaSimples(modelos as { name?: string }[], (m) => m.name ?? '(sem nome)'),
      );
    }),
  );
  conteiner.append(secaoModelos);

  const projeto = await exigirProjetoAtivo(conteiner);
  if (!projeto) return;

  const nome = campoTexto('Nome do agente (minúsculas-com-hífen)');
  const prompt = el('textarea', 'campo campo-textarea');
  prompt.placeholder = 'System prompt do agente';
  const formulario = el('div', 'form-tela');
  formulario.append(
    el('h3', 'subtitulo-tela', 'Agentes do projeto'),
    botao('Listar agentes', async () => {
      const r = await window.chaosCode.listarAgentes(projeto.id);
      saida.replaceChildren();
      if (ehErroIpc(r)) {
        saida.append(aviso(textoErro(r)));
        return;
      }
      saida.append(
        listaSimples(r, (a) => `${a.nome} — ${a.cli}/${a.escopo} (${a.caminho})`),
      );
    }),
    nome,
    prompt,
    botao('Gravar agente (Claude)', async () => {
      const r = await window.chaosCode.gravarAgente({
        idProjeto: projeto.id,
        cli: 'claude',
        escopo: 'projeto',
        agente: {
          frontmatter: {
            name: nome.value,
            description: nome.value,
            tools: 'Read, Grep, Glob',
            model: 'inherit',
            color: 'blue',
          },
          systemPrompt: prompt.value,
        },
      });
      if (ehErroIpc(r)) {
        saida.replaceChildren(aviso(textoErro(r)));
        return;
      }
      saida.replaceChildren(aviso(`Gravado em ${r.caminho}`));
    }),
    saida,
  );
  conteiner.append(formulario);
}
