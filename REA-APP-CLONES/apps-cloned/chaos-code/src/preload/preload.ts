import { contextBridge, ipcRenderer } from 'electron';
import { CANAIS_IPC, NOME_API_PRELOAD } from '../compartilhado/constantes';
import type { ApiChaosCode } from '../compartilhado/tipos';
import type { ApiAtualizador } from '../compartilhado/tipos-ipc-atualizador';
import type { ApiImagem } from '../compartilhado/tipos-ipc-imagem';
import type { ApiProjetos } from '../compartilhado/tipos-ipc-projetos';
import type { ApiLogin } from '../main/login/login.canais';

// Só funções específicas são expostas: a interface nunca recebe o ipcRenderer inteiro.
// Cada módulo novo acrescenta aqui o seu bloco e o tipo `Api<Modulo>` em `ApiExposta`.
type ApiExposta = ApiChaosCode & ApiProjetos & ApiImagem & ApiAtualizador & ApiLogin;

const api: ApiExposta = {
  obterInformacoes: () => ipcRenderer.invoke(CANAIS_IPC.obterInformacoes),

  // Projetos (CLONE.3.7)
  listarProjetos: () => ipcRenderer.invoke(CANAIS_IPC.projetosListar),
  abrirProjeto: (id) => ipcRenderer.invoke(CANAIS_IPC.projetosAbrir, id),
  criarProjeto: (dados) => ipcRenderer.invoke(CANAIS_IPC.projetosCriar, dados),
  renomearProjeto: (id, nome) => ipcRenderer.invoke(CANAIS_IPC.projetosRenomear, id, nome),
  removerProjeto: (id) => ipcRenderer.invoke(CANAIS_IPC.projetosRemover, id),
  obterProjetoAtivo: () => ipcRenderer.invoke(CANAIS_IPC.projetosObterAtivo),
  definirProjetoAtivo: (id) => ipcRenderer.invoke(CANAIS_IPC.projetosDefinirAtivo, id),
  aoMudarProjetoAtivo: (ouvinte) => {
    const tratador = (_evento: unknown, projeto: Parameters<typeof ouvinte>[0]): void =>
      ouvinte(projeto);
    ipcRenderer.on(CANAIS_IPC.projetosAtivoMudou, tratador);
    return () => {
      ipcRenderer.removeListener(CANAIS_IPC.projetosAtivoMudou, tratador);
    };
  },

  // Atualizador (CLONE.12.7)
  verificarAtualizacao: () => ipcRenderer.invoke(CANAIS_IPC.atualizadorVerificar),
  baixarEInstalarAtualizacao: () => ipcRenderer.invoke(CANAIS_IPC.atualizadorInstalar),
  cancelarDownloadAtualizacao: () => ipcRenderer.invoke(CANAIS_IPC.atualizadorCancelar),
  salvarEstadoPreAtualizacao: (versaoAlvo) =>
    ipcRenderer.invoke(CANAIS_IPC.atualizadorSalvarEstado, versaoAlvo),
  obterHistoricoAtualizacao: () => ipcRenderer.invoke(CANAIS_IPC.atualizadorObterHistorico),
  aoProgredirAtualizacao: (ouvinte) => {
    const tratador = (_evento: unknown, evento: Parameters<typeof ouvinte>[0]): void =>
      ouvinte(evento);
    ipcRenderer.on(CANAIS_IPC.atualizadorProgresso, tratador);
    return () => {
      ipcRenderer.removeListener(CANAIS_IPC.atualizadorProgresso, tratador);
    };
  },

  // Imagem (CLONE.11.4)
  obterConfiguracaoImagem: () => ipcRenderer.invoke(CANAIS_IPC.imagemObterConfiguracao),
  definirConfiguracaoImagem: (configuracao) =>
    ipcRenderer.invoke(CANAIS_IPC.imagemDefinirConfiguracao, configuracao),
  gerarImagem: (pedido) => ipcRenderer.invoke(CANAIS_IPC.imagemGerar, pedido),

  // Login (CLONE.4.12): só o estado chega aqui; o token fica no main.
  obterEstadoLogin: () => ipcRenderer.invoke(CANAIS_IPC.loginObterEstado),
  fazerLogin: () => ipcRenderer.invoke(CANAIS_IPC.loginEntrar),
  fazerLogout: () => ipcRenderer.invoke(CANAIS_IPC.loginSair),
  renovarLogin: () => ipcRenderer.invoke(CANAIS_IPC.loginRenovar),
  aoMudarEstadoLogin: (ouvinte) => {
    const tratador = (_evento: unknown, estado: Parameters<typeof ouvinte>[0]): void =>
      ouvinte(estado);
    ipcRenderer.on(CANAIS_IPC.loginEstadoMudou, tratador);
    return () => {
      ipcRenderer.removeListener(CANAIS_IPC.loginEstadoMudou, tratador);
    };
  },
};

contextBridge.exposeInMainWorld(NOME_API_PRELOAD, api);
