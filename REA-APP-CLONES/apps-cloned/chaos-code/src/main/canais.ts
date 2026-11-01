import { BrowserWindow, ipcMain } from 'electron';
import { CANAIS_IPC } from '../compartilhado/constantes';
import { montarInformacoes } from './configuracao';
import { registrarCanaisApi, type ApisPlataforma } from './api/api.canais';
import { registrarCanaisAtualizador } from './atualizador/atualizador.canais';
import type { ServicoAtualizador } from './atualizador/atualizador.servico';
import { registrarCanaisImagem } from './imagem/imagem.canais';
import type { ServicoImagem } from './imagem/imagem.servico';
import { registrarCanaisLogin } from './login/login.canais';
import type { ServicoLoginCompleto } from './login/login.servico';
import { registrarCanaisProjetos } from './projeto/projeto.canais';
import type { ServicoProjetos } from './projeto/projeto.servico';

/** Serviços do main que os canais usam; cada módulo novo acrescenta o seu campo aqui. */
export interface ContextoCanais {
  servicoProjetos: ServicoProjetos;
  servicoImagem: ServicoImagem;
  servicoAtualizador: ServicoAtualizador;
  /** O `principal.ts` chama `inicializar`; os canais usam só o recorte `ServicoLoginCanais`. */
  servicoLogin: ServicoLoginCompleto;
  /** Opcional até o `principal.ts` montar o cliente HTTP; sem ele, `api:*` não existe. */
  apisPlataforma?: ApisPlataforma;
}

/**
 * Envia um evento do main para todas as janelas abertas.
 * @param {string} canal - Nome do canal do evento.
 * @param {unknown} dado - Dado serializável.
 * @returns {void}
 */
function difundirParaJanelas(canal: string, dado: unknown): void {
  BrowserWindow.getAllWindows().forEach((janela) => janela.webContents.send(canal, dado));
}

/**
 * Registra os canais IPC que a interface pode chamar pelo preload.
 * Cada módulo novo (login, MCP...) acrescenta aqui uma chamada `registrarCanais<Modulo>`.
 * @param {ContextoCanais} contexto - Serviços do main.
 * @returns {void}
 */
export function registrarCanais(contexto: ContextoCanais): void {
  ipcMain.handle(CANAIS_IPC.obterInformacoes, () => montarInformacoes(process.env));
  registrarCanaisProjetos(ipcMain, contexto.servicoProjetos, difundirParaJanelas);
  registrarCanaisImagem(ipcMain, contexto.servicoImagem);
  registrarCanaisAtualizador(ipcMain, contexto.servicoAtualizador, difundirParaJanelas);
  registrarCanaisLogin(ipcMain, contexto.servicoLogin, difundirParaJanelas);
  if (contexto.apisPlataforma) {
    registrarCanaisApi(ipcMain, contexto.apisPlataforma);
  }
}
