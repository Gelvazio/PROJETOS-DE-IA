import { BrowserWindow, shell } from 'electron';
import path from 'node:path';
import {
  ARQUIVO_TELA_PRINCIPAL,
  JANELA_ALTURA,
  JANELA_ALTURA_MINIMA,
  JANELA_LARGURA,
  JANELA_LARGURA_MINIMA,
  NOME_APLICATIVO,
} from '../compartilhado/constantes';

const PROTOCOLOS_EXTERNOS = ['https:', 'http:'];

/**
 * Abre links externos no navegador do sistema em vez de dentro do app.
 * @param url - Endereço pedido pela página.
 * @returns Sempre nega a abertura de nova janela no Electron.
 */
function tratarNovaJanela({ url }: { url: string }): { action: 'deny' } {
  const protocolo = new URL(url).protocol;
  if (PROTOCOLOS_EXTERNOS.includes(protocolo)) void shell.openExternal(url);

  return { action: 'deny' };
}

/**
 * Cria a janela principal com isolamento de contexto e sandbox.
 * @param pastaDist - Pasta `dist` com `preload/` e `renderer/` construídos.
 * @returns A janela criada.
 */
export function criarJanelaPrincipal(pastaDist: string): BrowserWindow {
  const janela = new BrowserWindow({
    title: NOME_APLICATIVO,
    width: JANELA_LARGURA,
    height: JANELA_ALTURA,
    minWidth: JANELA_LARGURA_MINIMA,
    minHeight: JANELA_ALTURA_MINIMA,
    show: false,
    webPreferences: {
      preload: path.join(pastaDist, 'preload', 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  janela.webContents.setWindowOpenHandler(tratarNovaJanela);
  janela.once('ready-to-show', () => janela.show());
  void janela.loadFile(path.join(pastaDist, 'renderer', ARQUIVO_TELA_PRINCIPAL));
  return janela;
}
