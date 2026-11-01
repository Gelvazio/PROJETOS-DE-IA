/**
 * Tela de indexação e busca (`search`/`sync` do original): liga o RAG do projeto, indexa,
 * acompanha o progresso e busca nos vetores.
 */

import { ehErroIpc } from '../../compartilhado/tipos-ipc';
import type { LimpezaTela } from '../navegacao';
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

/** Monta a tela de indexação e busca. */
export async function montarTelaIndexacao(
  conteiner: HTMLElement,
): Promise<LimpezaTela | void> {
  conteiner.append(titulo('Indexação e busca'));
  const projeto = await exigirProjetoAtivo(conteiner);
  if (!projeto) return;

  const status = el('p', 'aviso-tela');
  const progresso = el('p', 'aviso-tela');
  const bloco = el('div', 'form-tela');
  bloco.append(
    status,
    botao('Indexar projeto', async () => {
      const resposta = await window.chaosCode.indexarProjeto(projeto.id);
      if (ehErroIpc(resposta)) {
        status.textContent = textoErro(resposta);
        return;
      }
      status.textContent = `Indexação: ${resposta.documentos} documentos, ${resposta.pedacos} pedaços.`;
    }),
    botao('Cancelar indexação', async () => {
      await window.chaosCode.cancelarIndexacao(projeto.id);
    }),
    progresso,
  );
  conteiner.append(bloco);

  const statusResposta = await window.chaosCode.obterStatusRag(projeto.id);
  status.textContent = ehErroIpc(statusResposta)
    ? `Erro: ${statusResposta.erro}`
    : `RAG ${statusResposta.rag_enabled ? 'ligado' : 'desligado'}` +
      ` — estado: ${statusResposta.sync_state ?? '—'}`;

  const busca = el('div', 'form-tela');
  const consulta = campoTexto('O que procurar no projeto?');
  const resultados = el('div', 'lista-resultados');
  busca.append(
    consulta,
    botao('Buscar', async () => {
      const resposta = await window.chaosCode.buscarVetores(projeto.id, consulta.value);
      resultados.replaceChildren();
      if (ehErroIpc(resposta)) {
        resultados.append(aviso(textoErro(resposta)));
        return;
      }
      resultados.append(
        listaSimples(resposta, (r) => `[${r.score.toFixed(2)}] ${r.text.slice(0, 160)}`),
      );
    }),
    resultados,
  );
  conteiner.append(busca);

  const cancelar = window.chaosCode.aoProgredirIndexacao((p) => {
    progresso.textContent = `Fase: ${p.phase}`;
  });
  return cancelar;
}
