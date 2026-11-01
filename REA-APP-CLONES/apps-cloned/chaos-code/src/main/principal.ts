import { app, BrowserWindow, safeStorage, shell } from 'electron';
import path from 'node:path';
import { VERSAO_APLICATIVO } from '../compartilhado/constantes';
import { criarServicoAtualizador } from './atualizador/atualizador.fabrica';
import type { ServicoAtualizador } from './atualizador/atualizador.servico';
import {
  obterCaminhosGlobais,
  obterCaminhosProjeto,
  obterPastaDados,
} from './armazenamento/caminhos';
import { registrarCanais, type ContextoCanais } from './canais';
import { obterUrlServidor } from './configuracao';
import type { BuscadorHttpImagem } from './imagem/gemini-imagem';
import { ServicoImagem } from './imagem/imagem.servico';
import { criarJanelaPrincipal } from './janela';
import { criarCifradorElectron } from './login/cofre-tokens';
import { criarDependenciasLoginReal } from './login/login.dependencias';
import {
  criarServicoLogin,
  deveUsarLoginSimulado,
  type ServicoLoginCompleto,
} from './login/login.servico';
import { criarCofreChavesProvedores } from './vetores/chaves-provedores';
import { RepositorioProjetos } from './projeto/projeto.repositorio';
import { ServicoProjetos } from './projeto/projeto.servico';
import { lerJson } from './armazenamento/arquivo-json';
import type { ConfiguracaoEmbedder, ConfiguracaoPipelineRag } from '../compartilhado/tipos-vetores';
import { preencherChavesEmbedder } from './vetores/chaves-provedores';
import { criarRepositorioIndiceVetorial } from './vetores/indice';
import {
  criarFabricaProvedoresPadrao,
  criarFonteDocumentosPasta,
  criarObtentorProvedor,
  ServicoIndexacao,
} from './vetores/indexacao.servico';

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
 * @returns {Promise<ContextoCanais>} Serviços usados pelos canais IPC.
 */
async function montarContextoCanais(): Promise<ContextoCanais> {
  const pastaDados = obterPastaDados(process.env.LOCALAPPDATA || app.getPath('appData'));
  const repositorio = new RepositorioProjetos({ pastaDados });
  const servicoProjetos = new ServicoProjetos({ repositorio, pastaDados });
  return {
    servicoProjetos,
    repositorioProjetos: repositorio,
    servicoImagem: montarServicoImagem(pastaDados),
    servicoAtualizador: montarServicoAtualizador(pastaDados),
    servicoLogin: montarServicoLogin(pastaDados),
    servicoIndexacao: await montarServicoIndexacao(pastaDados, repositorio),
  };
}

/**
 * Monta o serviço de indexação: fonte de documentos na pasta do projeto (`local_path` ou a
 * pasta padrão), índice em `vectors.json` e provedor do `embedder_config.json` com as chaves do
 * cofre.
 * @param {string} pastaDados - Pasta de dados do app.
 * @param {RepositorioProjetos} repositorio - Repositório de projetos.
 * @returns {Promise<ServicoIndexacao>} Serviço usado pelos canais `vetores:*`.
 */
async function montarServicoIndexacao(
  pastaDados: string,
  repositorio: RepositorioProjetos,
): Promise<ServicoIndexacao> {
  const caminhos = obterCaminhosGlobais(pastaDados);
  const cofre = criarCofreChavesProvedores({
    caminhoArquivo: caminhos.chavesProvedores,
    cifrador: criarCifradorElectron(safeStorage),
    registrarAviso: (mensagem) => console.warn(mensagem),
  });
  const fabrica = criarFabricaProvedoresPadrao(fetch);
  return new ServicoIndexacao({
    repositorioProjetos: repositorio,
    repositorioIndice: criarRepositorioIndiceVetorial({ pastaDados }),
    fonteDocumentos: criarFonteDocumentosPasta({
      obterPasta: async (idProjeto) => {
        const projeto = await repositorio.buscarPorId(idProjeto);
        return projeto?.local_path ?? obterCaminhosProjeto(pastaDados, idProjeto).pasta;
      },
    }),
    obterProvedor: criarObtentorProvedor({
      fabrica,
      obterModo: async () => {
        const config = await lerJson<ConfiguracaoEmbedder>(caminhos.configEmbedder, {
          mode: { type: 'Api', endpoint: '', api_key: '', model: '', dimensions: 0 },
        });
        return (await preencherChavesEmbedder(config, cofre)).mode;
      },
    }),
    configuracaoRag: await lerJson<ConfiguracaoPipelineRag>(caminhos.configRag, {}),
    registrarLog: (mensagem) => console.info('[vetores]', mensagem),
  });
}

/**
 * Monta o serviço de login: real por padrão; simulado só por opção explícita de desenvolvimento.
 * @param {string} pastaDados - Pasta de dados do app.
 * @returns {ServicoLoginCompleto} Serviço usado pelos canais `login:*`.
 */
function montarServicoLogin(pastaDados: string): ServicoLoginCompleto {
  return criarServicoLogin({
    modoSimulado: deveUsarLoginSimulado(process.env),
    criarDependenciasReais: () =>
      criarDependenciasLoginReal({
        urlServidor: obterUrlServidor(process.env),
        pastaDados,
        versaoCliente: VERSAO_APLICATIVO,
        safeStorage,
        abrirNavegador: (url) => shell.openExternal(url),
      }),
    registrarLog: (mensagem) => console.info(mensagem),
  });
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
  const contexto = await montarContextoCanais();
  registrarCanais(contexto);
  contexto.servicoAtualizador
    .confirmarNaAbertura()
    .catch((erro: unknown) => console.warn('Histórico de atualização:', erro));
  contexto.servicoLogin
    .inicializar()
    .catch((erro: unknown) => console.warn('Estado inicial do login:', erro));
  criarJanelaPrincipal(PASTA_DIST);
  app.on('activate', tratarAtivacao);
  app.on('window-all-closed', tratarJanelasFechadas);
}

void iniciar();
