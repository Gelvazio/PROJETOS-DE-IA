/**
 * Tela de configurações e atualização (`settings`/`updater` do original): versão do app,
 * verificação/download de atualização, chave da API de imagem (mascarada) e sair.
 */

import { ehErroIpc } from '../../compartilhado/tipos-ipc';
import { VERSAO_APLICATIVO } from '../../compartilhado/constantes';
import type { LimpezaTela } from '../navegacao';
import { botao, campoTexto, el, textoErro, titulo } from './comum.tela';

/** Monta a tela de configurações. */
export function montarTelaConfiguracoes(conteiner: HTMLElement): LimpezaTela {
  conteiner.append(titulo('Configurações'));
  conteiner.append(el('p', 'aviso-tela', `Versão instalada: ${VERSAO_APLICATIVO}`));

  const estado = el('p', 'aviso-tela');
  const secaoAtualizacao = el('div', 'form-tela');
  secaoAtualizacao.append(
    el('h3', 'subtitulo-tela', 'Atualização'),
    estado,
    botao('Verificar atualização', async () => {
      const r = await window.chaosCode.verificarAtualizacao();
      estado.textContent = ehErroIpc(r)
        ? `Erro: ${r.erro}`
        : r.haAtualizacao
          ? `Nova versão ${r.versaoDisponivel} disponível.`
          : `Você está na última versão (${r.versaoInstalada}).`;
    }),
    botao('Baixar e instalar', async () => {
      const r = await window.chaosCode.baixarEInstalarAtualizacao();
      estado.textContent = ehErroIpc(r)
        ? `Erro: ${r.erro}`
        : r ? 'Atualização instalada.' : 'Nada para instalar.';
    }),
    botao('Cancelar download', async () => {
      await window.chaosCode.cancelarDownloadAtualizacao();
    }),
  );
  conteiner.append(secaoAtualizacao);

  const secaoImagem = el('div', 'form-tela');
  const chave = campoTexto('Chave da API do Gemini (imagens)');
  const estadoImagem = el('p', 'aviso-tela');
  secaoImagem.append(
    el('h3', 'subtitulo-tela', 'Provedores de imagem'),
    chave,
    botao('Salvar configuração', async () => {
      const r = await window.chaosCode.definirConfiguracaoImagem({
        gemini: { api_key: chave.value, rpm_limit: 60 },
      });
      estadoImagem.textContent = ehErroIpc(r)
        ? textoErro(r)
        : 'Configuração gravada.';
    }),
    estadoImagem,
  );
  conteiner.append(secaoImagem);

  const secaoConta = el('div', 'form-tela');
  secaoConta.append(
    el('h3', 'subtitulo-tela', 'Conta'),
    botao('Sair', async () => {
      await window.chaosCode.fazerLogout();
    }),
  );
  conteiner.append(secaoConta);

  const cancelar = window.chaosCode.aoProgredirAtualizacao((evento) => {
    estado.textContent = `Download: ${evento.event} ${evento.downloaded}/${evento.total}`;
  });
  return cancelar;
}
