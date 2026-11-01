import { contextBridge, ipcRenderer } from 'electron';
import {
  CANAIS_IPC,
  METODOS_API_IPC,
  NOME_API_PRELOAD,
  nomeCanalApi,
} from '../compartilhado/constantes';
import type { ApiChaosCode } from '../compartilhado/tipos';
import type { ApiAtualizador } from '../compartilhado/tipos-ipc-atualizador';
import type { ApiImagem } from '../compartilhado/tipos-ipc-imagem';
import type { ApiProjetos } from '../compartilhado/tipos-ipc-projetos';
import type { ApiPlataformaIpc } from '../main/api/api.canais';
import type { ApiLogin } from '../main/login/login.canais';
import type { ApiVetores } from '../compartilhado/tipos-ipc-vetores';
import type { ApiGrafo } from '../compartilhado/tipos-ipc-grafo';

// Só funções específicas são expostas: a interface nunca recebe o ipcRenderer inteiro.
// Cada módulo novo acrescenta aqui o seu bloco e o tipo `Api<Modulo>` em `ApiExposta`.
type ApiExposta = ApiChaosCode & ApiProjetos & ApiImagem & ApiAtualizador & ApiLogin &
  ApiPlataformaIpc & ApiVetores & ApiGrafo;

/**
 * Monta as funções de um grupo da API da plataforma: cada método invoca o canal `api:*`.
 * @param grupo - Nome do grupo (chave de `METODOS_API_IPC`).
 * @returns Objeto com um método por canal do grupo.
 */
function montarGrupoApi(grupo: keyof typeof METODOS_API_IPC): Record<string, unknown> {
  const funcoes: Record<string, unknown> = {};
  for (const metodo of Object.keys(METODOS_API_IPC[grupo])) {
    funcoes[metodo] = (...argumentos: unknown[]) =>
      ipcRenderer.invoke(nomeCanalApi(grupo, metodo), ...argumentos);
  }
  return funcoes;
}

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

  // API da plataforma (CLONE.5.7): o token fica no main.
  api: {
    projetos: montarGrupoApi('projetos'),
    tarefas: montarGrupoApi('tarefas'),
    imagens: montarGrupoApi('imagens'),
    modelosAgente: montarGrupoApi('modelosAgente'),
  } as ApiPlataformaIpc['api'],

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

  // Vetores / indexação (CLONE.6.12)
  indexarProjeto: (idProjeto) => ipcRenderer.invoke(CANAIS_IPC.vetoresIndexar, idProjeto),
  cancelarIndexacao: (idProjeto) => ipcRenderer.invoke(CANAIS_IPC.vetoresCancelar, idProjeto),
  buscarVetores: (idProjeto, consulta, k) =>
    ipcRenderer.invoke(CANAIS_IPC.vetoresBuscar, idProjeto, consulta, k),
  obterStatusRag: (idProjeto) => ipcRenderer.invoke(CANAIS_IPC.vetoresObterStatusRag, idProjeto),
  alternarRag: (idProjeto, ligado) =>
    ipcRenderer.invoke(CANAIS_IPC.vetoresAlternarRag, idProjeto, ligado),
  aoProgredirIndexacao: (ouvinte) => {
    const tratador = (_evento: unknown, progresso: Parameters<typeof ouvinte>[0]): void =>
      ouvinte(progresso);
    ipcRenderer.on(CANAIS_IPC.vetoresProgresso, tratador);
    return () => {
      ipcRenderer.removeListener(CANAIS_IPC.vetoresProgresso, tratador);
    };
  },

  // Grafo / consulta (CLONE.7.11)
  consultarConhecimento: (idProjeto, consulta, opcoes) =>
    ipcRenderer.invoke(CANAIS_IPC.grafoConsultar, idProjeto, consulta, opcoes),
  buscarEntidades: (idProjeto, nome, tipo) =>
    ipcRenderer.invoke(CANAIS_IPC.grafoBuscarEntidades, idProjeto, nome, tipo),
  obterDadosGrafo: (idProjeto, nomeEntidade, profundidade) =>
    ipcRenderer.invoke(CANAIS_IPC.grafoObterDados, idProjeto, nomeEntidade, profundidade),
};

contextBridge.exposeInMainWorld(NOME_API_PRELOAD, api);
