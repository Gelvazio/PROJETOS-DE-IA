/**
 * Tela do grafo de conhecimento (`knowledge graph` do original): consulta
 * (`query_knowledge`), busca de entidades (`search_entities`) e vizinhança
 * (`get_graph_data`).
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

/** Monta a tela do grafo. */
export async function montarTelaGrafo(conteiner: HTMLElement): Promise<void> {
  conteiner.append(titulo('Grafo de conhecimento'));
  const projeto = await exigirProjetoAtivo(conteiner);
  if (!projeto) return;

  const consulta = campoTexto('Pergunte ao conhecimento do projeto');
  const saida = el('div', 'lista-resultados');
  const formulario = el('div', 'form-tela');
  formulario.append(
    consulta,
    botao('Consultar', async () => {
      const resposta = await window.chaosCode.consultarConhecimento(
        projeto.id,
        consulta.value,
      );
      saida.replaceChildren();
      if (ehErroIpc(resposta)) {
        saida.append(aviso(textoErro(resposta)));
        return;
      }
      saida.append(
        listaSimples(resposta, (r) => `[${r.pontuacao.toFixed(2)}] ${r.texto.slice(0, 160)}`),
      );
    }),
    botao('Entidades e relações', async () => {
      const resposta = await window.chaosCode.obterDadosGrafo(projeto.id);
      saida.replaceChildren();
      if (ehErroIpc(resposta)) {
        saida.append(aviso(textoErro(resposta)));
        return;
      }
      saida.append(
        el('p', 'aviso-tela',
          `${resposta.entidades.length} entidades, ${resposta.relacoes.length} relações.`),
        listaSimples(resposta.entidades, (e) => `${e.name} (${e.entity_type})`),
        listaSimples(resposta.relacoes, (r) =>
          `${r.source_entity} —[${r.relation_type}]→ ${r.target_entity}`),
      );
    }),
    saida,
  );
  conteiner.append(formulario);
}
