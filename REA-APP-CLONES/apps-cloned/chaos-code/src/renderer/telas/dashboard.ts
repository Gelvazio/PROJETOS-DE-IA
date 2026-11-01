/**
 * Tela do Dashboard (`DashboardView` do original, `docs/original/assets/DashboardView-*.js`):
 * resumo do projeto ativo — status do RAG/indexação, servidor MCP e aviso do WSL.
 */

import { ehErroIpc } from '../../compartilhado/tipos-ipc';
import { el, exigirProjetoAtivo, titulo } from './comum.tela';

/** Card de resumo do dashboard. */
function card(rotulo: string, texto: string): HTMLElement {
  const c = el('div', 'card-dashboard');
  c.append(el('h3', 'subtitulo-tela', rotulo), el('p', 'aviso-tela', texto));
  return c;
}

/** Monta a tela do dashboard. */
export async function montarTelaDashboard(conteiner: HTMLElement): Promise<void> {
  conteiner.append(titulo('Dashboard'));
  const grade = el('div', 'grade-dashboard');
  conteiner.append(grade);

  const projeto = await exigirProjetoAtivo(conteiner);
  if (!projeto) return;
  grade.append(card('Projeto ativo', `${projeto.name} — ${projeto.status}`));

  const [rag, mcp, wsl] = await Promise.all([
    window.chaosCode.obterStatusRag(projeto.id),
    window.chaosCode.obterEstadoMcp(),
    window.chaosCode.obterStatusWsl(),
  ]);
  grade.append(
    card('Indexação (RAG)', ehErroIpc(rag)
      ? `Erro: ${rag.erro}`
      : `${rag.rag_enabled ? 'ligado' : 'desligado'} — ${rag.sync_state ?? '—'}`),
    card('Servidor MCP', ehErroIpc(mcp)
      ? `Erro: ${mcp.erro}`
      : mcp.rodando ? `Rodando na porta ${mcp.porta}` : 'Parado'),
    card('WSL', ehErroIpc(wsl)
      ? `Erro: ${wsl.erro}`
      : !wsl.is_windows ? 'Não se aplica'
      : wsl.wsl_installed
        ? `${wsl.running_distros.length} distros rodando` +
          (wsl.localhost_forwarding ? '' : ' — sem localhostForwarding')
        : 'Não instalado'),
  );
}
