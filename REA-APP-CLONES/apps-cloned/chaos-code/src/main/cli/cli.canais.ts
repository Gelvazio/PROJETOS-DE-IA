/**
 * Canais IPC de CLIs e WSL (`cli:*`, `wsl:*`): descoberta, comandos `mcp add`, gravação da
 * configuração e os três comandos do WSL. O token de sessão nunca sai do main.
 */

import { CANAIS_IPC } from '../../compartilhado/constantes';
import type { ComandosMcpIpc } from '../../compartilhado/tipos-ipc-cli';
import {
  exigirTexto,
  registrarCanalSeguro,
  type IpcMainMinimo,
} from '../ipc/ipc-comum';
import { CLIS_SUPORTADOS } from './clis-suportados';
import {
  configurarTodosClis,
  montarComandosMcp,
} from './configuracao-cli';
import { descobrirClis, criarDependenciasNode } from './descoberta-cli';
import {
  aplicarEncaminhamentoLocalhost,
  dispensarAvisoWsl,
  lerEstadoDispensado,
  verificarStatusWsl,
} from '../wsl/encaminhamento';
import type { DependenciasDeteccaoWsl } from '../wsl/deteccao';
import { criarExecutorNode } from './descoberta-cli';
import type { RepositorioProjetos } from '../projeto/projeto.repositorio';
import type { ServicoMcp } from '../mcp/mcp.servico';

const MSG_PROJETO_SEM_PASTA = 'Projeto sem pasta local configurada';
const NOME_SERVIDOR_MCP = 'chaos-code';
const PROTOCOLO_HTTP = 'http://';
const HOST_LOCAL = 'localhost';
const CAMINHO_MCP = '/mcp/';

/** Dependências dos canais de CLIs/WSL. */
export interface DependenciasCanaisCli {
  repositorioProjetos: RepositorioProjetos;
  servicoMcp: ServicoMcp;
  caminhoConfigWsl: string;
}

/**
 * Monta as dependências da detecção do WSL para o processo principal.
 * @param {string} caminhoConfigWsl - Caminho de `wsl_config.json`.
 * @returns {DependenciasDeteccaoWsl} Dependências prontas.
 */
export function montarDependenciasWsl(caminhoConfigWsl: string): DependenciasDeteccaoWsl {
  return {
    plataforma: process.platform,
    executor: criarExecutorNode(),
    lerArquivo: (caminho) =>
      import('node:fs/promises').then((fs) => fs.readFile(caminho, 'utf8').catch(() => null)),
    pastaUsuario: process.env.USERPROFILE ?? '',
    caminhoConfigWsl,
  };
}

/**
 * Pasta local do projeto (`local_path`), obrigatória para gravar as configurações.
 * @param {RepositorioProjetos} repositorio - Registro de projetos.
 * @param {string} idProjeto - ID do projeto.
 * @returns {Promise<string>} Pasta local.
 * @throws {Error} Se o projeto não existir ou não tiver `local_path`.
 */
async function exigirPastaLocal(
  repositorio: RepositorioProjetos,
  idProjeto: string,
): Promise<string> {
  const projeto = await repositorio.buscarPorId(idProjeto);
  if (!projeto?.local_path) throw new Error(MSG_PROJETO_SEM_PASTA);
  return projeto.local_path;
}

/**
 * Registra os canais de CLIs e WSL.
 * @param {IpcMainMinimo} ipc - `ipcMain` (ou um falso).
 * @param {DependenciasCanaisCli} deps - Repositório, serviço MCP e caminho do wsl_config.
 * @returns {void}
 */
export function registrarCanaisCli(ipc: IpcMainMinimo, deps: DependenciasCanaisCli): void {
  const deteccao = montarDependenciasWsl(deps.caminhoConfigWsl);

  registrarCanalSeguro(ipc, CANAIS_IPC.wslObterStatus, async () => {
    const status = await verificarStatusWsl(deteccao);
    const dispensado = await lerEstadoDispensado(deps.caminhoConfigWsl);
    return { ...status, dismissed: dispensado.dismissed };
  });
  registrarCanalSeguro(ipc, CANAIS_IPC.wslAplicarEncaminhamento, () => {
    return aplicarEncaminhamentoLocalhost({
      deteccao,
      caminhoWslConfigJson: deps.caminhoConfigWsl,
    });
  });
  registrarCanalSeguro(ipc, CANAIS_IPC.wslDispensarAviso, async () => {
    return dispensarAvisoWsl(deps.caminhoConfigWsl);
  });
  registrarCanalSeguro(ipc, CANAIS_IPC.cliListar, () => {
    return descobrirClis(criarDependenciasNode(), {
      obterVersao: true,
      listarAgentesClaude: true,
    });
  });
  registrarCanalSeguro(ipc, CANAIS_IPC.cliObterComandosMcp, async (id) => {
    const idProjeto = exigirTexto(id, 'id');
    const endereco = deps.servicoMcp.endereco;
    const porta = endereco?.porta ?? 0;
    const url = `${PROTOCOLO_HTTP}${HOST_LOCAL}:${porta}${CAMINHO_MCP}${idProjeto}`;
    const comandos: ComandosMcpIpc[] = CLIS_SUPORTADOS.map((cli) => {
      const montados = montarComandosMcp(cli, {
        nome: NOME_SERVIDOR_MCP,
        url,
        token: deps.servicoMcp.obterTokenSessao(),
        porta,
        projectId: idProjeto,
      });
      return { cli: montados.cli, exibicao: montados.exibicao, semToken: montados.semToken };
    });
    return comandos;
  });
  registrarCanalSeguro(ipc, CANAIS_IPC.cliConfigurar, async (id) => {
    const idProjeto = exigirTexto(id, 'id');
    const pasta = await exigirPastaLocal(deps.repositorioProjetos, idProjeto);
    const endereco = deps.servicoMcp.endereco;
    const porta = endereco?.porta ?? 0;
    const url = `${PROTOCOLO_HTTP}${HOST_LOCAL}:${porta}${CAMINHO_MCP}${idProjeto}`;
    return configurarTodosClis(pasta, {
      nome: NOME_SERVIDOR_MCP,
      url,
      token: deps.servicoMcp.obterTokenSessao(),
    });
  });
}
