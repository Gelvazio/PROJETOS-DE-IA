import { app, BrowserWindow, safeStorage } from 'electron';
import path from 'node:path';
import { VERSAO_APLICATIVO } from '../compartilhado/constantes';
import { criarServicoAtualizador } from './atualizador/atualizador.fabrica';
import type { ServicoAtualizador } from './atualizador/atualizador.servico';
import { obterCaminhosGlobais, obterPastaDados } from './armazenamento/caminhos';
import { registrarCanais, type ContextoCanais } from './canais';
import type { BuscadorHttpImagem } from './imagem/gemini-imagem';
import { ServicoImagem } from './imagem/imagem.servico';
import { criarJanelaPrincipal } from './janela';
import { criarCifradorElectron } from './login/cofre-tokens';
import { criarCofreChavesProvedores } from './vetores/chaves-provedores';
import { RepositorioProjetos } from './projeto/projeto.repositorio';
import { ServicoProjetos } from './projeto/projeto.servico';

const PLATAFORMA_MAC = 'darwin';

// O main é construído em dist/main; a pasta dist fica um nível acima.
const PASTA_DIST = path.join(__dirname, '..');

/**
 * Recria a janela no macOS quando o ícone do dock é clicado sem janela aberta.
 */
function tratarAtivacao(): void {
  const semJanelas = BrowserWindow.getAllWindows().length === 0;
  if (semJanelas) criarJanelaPrincipal(PASTA_DIST);
}

/**
 * Encerra o app quando todas as janelas fecham (menos no macOS, por convenção).
 */
function tratarJanelasFechadas(): void {
  if (process.platform !== PLATAFORMA_MAC) app.quit();
}

/**
 * Monta o serviço de imagem, com as chaves de API no cofre cifrado pelo `safeStorage`.
 * @param {string} pastaDados - Pasta de dados do app.
 * @returns {ServicoImagem} Serviço usado pelos canais `imagem:*`.
 */
function montarServicoImagem(pastaDados: string): ServicoImagem {
  const cofre = criarCofreChavesProvedores({
    caminhoArquivo: obterCaminhosGlobais(pastaDados).chavesProvedores,
    cifrador: criarCifradorElectron(safeStorage),
    registrarAviso: (mensagem) => console.warn(mensagem),
  });
  return new ServicoImagem({ pastaDados, cofre, buscar: fetch as unknown as BuscadorHttpImagem });
}

/**
 * Monta o serviço do atualizador; o instalador baixado fica na pasta temporária do sistema.
 * @param {string} pastaDados - Pasta de dados do app.
 * @returns {ServicoAtualizador} Serviço usado pelos canais `atualizador:*`.
 */
function montarServicoAtualizador(pastaDados: string): ServicoAtualizador {
  return criarServicoAtualizador({
    pastaDados,
    versaoAtual: VERSAO_APLICATIVO,
    pastaDownload: app.getPath('temp'),
    ehMsix: Boolean(process.windowsStore),
  });
}

/**
 * Monta os serviços do main com a pasta de dados real:`%LOCALAPPDATA%` no Windows e a pasta
 * `appData` do Electron nos outros sistemas.
 * @returns {ContextoCanais} Serviços usados pelos canais IPC.
 */
function montarContextoCanais(): ContextoCanais {
  const pastaDados = obterPastaDados(process.env.LOCALAPPDATA || app.getPath('appData'));
  const repositorio = new RepositorioProjetos({ pastaDados });
  const servicoProjetos = new ServicoProjetos({ repositorio, pastaDados });
  return {
    servicoProjetos,
    servicoImagem: montarServicoImagem(pastaDados),
    servicoAtualizador: montarServicoAtualizador(pastaDados),
  };
}

/**
 * Ponto de entrada: garante instância única, registra os canais e abre a janela.
 */
async function iniciar(): Promise<void> {
  const ehInstanciaUnica = app.requestSingleInstanceLock();
  if (!ehInstanciaUnica) {
    app.quit();
    return;
  }

  await app.whenReady();
  const contexto = montarContextoCanais();
  registrarCanais(contexto);
  contexto.servicoAtualizador
    .confirmarNaAbertura()
    .catch((erro: unknown) => console.warn('Histórico de atualização:', erro));
  criarJanelaPrincipal(PASTA_DIST);
  app.on('activate', tratarAtivacao);
  app.on('window-all-closed', tratarJanelasFechadas);
}

void iniciar();
