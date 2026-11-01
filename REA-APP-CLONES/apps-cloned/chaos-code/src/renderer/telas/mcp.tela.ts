/**
 * Tela do MCP, CLIs e WSL (`settings MCP` do original): estado do servidor, ligar/desligar,
 * comandos `mcp add` por CLI (token oculto), configuração dos CLIs e o aviso/painel do WSL.
 */

import { ehErroIpc } from '../../compartilhado/tipos-ipc';
import {
  aviso,
  botao,
  el,
  exigirProjetoAtivo,
  listaSimples,
  textoErro,
  titulo,
} from './comum.tela';

/** Monta a seção do servidor MCP. */
function montarSecaoMcp(): HTMLElement {
  const secao = el('div', 'form-tela');
  const estado = el('p', 'aviso-tela');
  secao.append(
    el('h3', 'subtitulo-tela', 'Servidor MCP local'),
    estado,
    botao('Ligar', async () => {
      const r = await window.chaosCode.ligarMcp();
      estado.textContent = ehErroIpc(r)
        ? `Erro: ${r.erro}`
        : `Rodando na porta ${r.porta} (${r.enderecos.join(', ')})`;
    }),
    botao('Desligar', async () => {
      const r = await window.chaosCode.desligarMcp();
      estado.textContent = ehErroIpc(r) ? `Erro: ${r.erro}` : 'Parado.';
    }),
  );
  void window.chaosCode.obterEstadoMcp().then((r) => {
    estado.textContent = ehErroIpc(r)
      ? `Erro: ${r.erro}`
      : r.rodando ? `Rodando na porta ${r.porta}` : 'Parado.';
  });
  return secao;
}

/** Monta a seção do WSL (só aparece no Windows com WSL sem forwarding). */
function montarSecaoWsl(): HTMLElement {
  const secao = el('div', 'form-tela');
  const estado = el('p', 'aviso-tela');
  secao.append(el('h3', 'subtitulo-tela', 'WSL'), estado);
  void window.chaosCode.obterStatusWsl().then((r) => {
    if (ehErroIpc(r)) {
      estado.textContent = `Erro: ${r.erro}`;
      return;
    }
    if (!(r.is_windows && r.wsl_installed)) {
      estado.textContent = 'WSL não se aplica a esta máquina.';
      return;
    }
    estado.textContent = r.localhost_forwarding
      ? `WSL ok (${r.running_distros.length} distros rodando).`
      : 'WSL sem localhostForwarding: o MCP pode não ser alcançado das distros.';
    if (!r.localhost_forwarding && !r.dismissed) {
      secao.append(
        botao('Corrigir (reinicia o WSL)', async () => {
          const resultado = await window.chaosCode.aplicarEncaminhamentoWsl();
          estado.textContent = ehErroIpc(resultado)
            ? `Erro: ${resultado.erro}`
            : resultado.mensagem;
        }),
        botao('Dispensar aviso', async () => {
          await window.chaosCode.dispensarAvisoWsl();
          estado.textContent = 'Aviso dispensado.';
        }),
      );
    }
  });
  return secao;
}

/** Monta a tela do MCP, CLIs e WSL. */
export async function montarTelaMcp(conteiner: HTMLElement): Promise<void> {
  conteiner.append(titulo('MCP, CLIs e WSL'));
  conteiner.append(montarSecaoMcp(), montarSecaoWsl());

  const projeto = await exigirProjetoAtivo(conteiner);
  if (!projeto) return;

  const secao = el('div', 'form-tela');
  const saida = el('div', 'lista-resultados');
  secao.append(
    el('h3', 'subtitulo-tela', 'CLIs'),
    botao('Comandos de conexão', async () => {
      const r = await window.chaosCode.obterComandosMcp(projeto.id);
      saida.replaceChildren();
      if (ehErroIpc(r)) {
        saida.append(aviso(textoErro(r)));
        return;
      }
      saida.append(
        listaSimples(r, (c) => `${c.cli}: ${c.exibicao ?? c.semToken}`),
      );
    }),
    botao('Gravar config nos CLIs', async () => {
      const r = await window.chaosCode.configurarClis(projeto.id);
      saida.replaceChildren();
      if (ehErroIpc(r)) {
        saida.append(aviso(textoErro(r)));
        return;
      }
      saida.append(listaSimples(r, (c) => `${c.cli}: ${c.arquivo}`));
    }),
    botao('Listar CLIs instalados', async () => {
      const r = await window.chaosCode.listarClis();
      saida.replaceChildren();
      if (ehErroIpc(r)) {
        saida.append(aviso(textoErro(r)));
        return;
      }
      saida.append(
        listaSimples(r, (c) =>
          `${c.nomeExibicao}: ${c.instalado ? `instalado (${c.versao ?? '?'})` : 'ausente'}`),
      );
    }),
    saida,
  );
  conteiner.append(secao);
}
