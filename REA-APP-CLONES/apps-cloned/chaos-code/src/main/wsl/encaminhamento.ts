/**
 * Encaminhamento do localhost para o WSL (`apply_wsl_localhost_forwarding` e
 * `dismiss_wsl_warning` do original): backup do `.wslconfig`, `localhostForwarding=true` e
 * `wsl --shutdown`; e o estado "dispensado" em `wsl_config.json` (inventário `mcp-cli-wsl.md`
 * §WSL, passos 5–6).
 */

import { copyFile, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { lerJson, gravarJson } from '../armazenamento/arquivo-json';
import type { DependenciasDeteccaoWsl } from './deteccao';
import { verificarStatusWsl, type StatusWsl } from './deteccao';

/** Estado "dispensado" (`WslDismissState` de `wsl_config.json`). */
export interface EstadoDispensadoWsl {
  dismissed: boolean;
  dismissed_at: string | null;
}

/** Resultado de `apply_wsl_localhost_forwarding`. */
export interface ResultadoEncaminhamento {
  configurado: boolean;
  reiniciado: boolean;
  mensagem: string;
}

const NOME_WSLCONFIG = '.wslconfig';
const SUFIXO_BACKUP = '.bak';
const SECAO_WSL2 = '[wsl2]';
const MSG_SUCESSO = 'localhostForwarding=true configurado; WSL reiniciado.';
const MSG_FALHA_PARCIAL =
  'configurado no .wslconfig, mas wsl --shutdown falhou. Reinicie o WSL manualmente.';
const MSG_CONFIG_LIGADO = 'localhostForwarding=true';
const PADRAO_LOCALHOST_FORWARDING = /localhostForwarding\s*=\s*\w+/i;
const PADRAO_SECAO_WSL2 = /\[wsl2\]/i;

/** Dependências do encaminhamento (as da detecção + pasta de dados). */
export interface DependenciasEncaminhamento {
  deteccao: DependenciasDeteccaoWsl;
  /** Pasta de dados do app (para `wsl_config.json`). */
  caminhoWslConfigJson: string;
  /** Pasta do usuário (para `.wslconfig`; padrão `process.env.USERPROFILE`). */
  pastaUsuario?: string;
}

/**
 * Lê o `.wslconfig` do usuário (ausente → texto vazio).
 * @param {string} pastaUsuario - Pasta do usuário.
 * @returns {Promise<{ caminho: string; conteudo: string }>} Caminho e conteúdo.
 */
async function lerWslconfig(pastaUsuario: string): Promise<{ caminho: string; conteudo: string }> {
  const caminho = path.join(pastaUsuario, NOME_WSLCONFIG);
  const conteudo = await readFile(caminho, 'utf8').catch(() => '');
  return { caminho, conteudo };
}

/**
 * Devolve o `.wslconfig` com `localhostForwarding=true` na seção `[wsl2]`.
 * @param {string} conteudo - Conteúdo atual.
 * @returns {string} Conteúdo novo.
 */
function ligarForwardingNoConfig(conteudo: string): string {
  if (PADRAO_LOCALHOST_FORWARDING.test(conteudo)) {
    return conteudo.replace(PADRAO_LOCALHOST_FORWARDING, MSG_CONFIG_LIGADO);
  }
  if (PADRAO_SECAO_WSL2.test(conteudo)) {
    return conteudo.replace(PADRAO_SECAO_WSL2, `${SECAO_WSL2}\n${MSG_CONFIG_LIGADO}`);
  }
  const separador = conteudo.trim() ? `${conteudo.trimEnd()}\n\n` : '';
  return `${separador}${SECAO_WSL2}\n${MSG_CONFIG_LIGADO}\n`;
}

/**
 * Aplica o encaminhamento do localhost para o WSL: backup, gravação e `wsl --shutdown`.
 * @param {DependenciasEncaminhamento} deps - Detecção, pasta de dados e pasta do usuário.
 * @returns {Promise<ResultadoEncaminhamento>} Configurado, reiniciado e mensagem.
 */
export async function aplicarEncaminhamentoLocalhost(
  deps: DependenciasEncaminhamento,
): Promise<ResultadoEncaminhamento> {
  const pastaUsuario = deps.pastaUsuario ?? process.env.USERPROFILE ?? '';
  const { caminho, conteudo } = await lerWslconfig(pastaUsuario);
  if (conteudo) {
    await copyFile(caminho, `${caminho}${SUFIXO_BACKUP}`);
  }
  await writeFile(caminho, ligarForwardingNoConfig(conteudo), 'utf8');
  try {
    await deps.deteccao.executor.executar('wsl', ['--shutdown'], 15000);
    return { configurado: true, reiniciado: true, mensagem: MSG_SUCESSO };
  } catch {
    return { configurado: true, reiniciado: false, mensagem: MSG_FALHA_PARCIAL };
  }
}

/**
 * Grava o estado "dispensado" (`dismiss_wsl_warning`).
 * @param {string} caminhoWslConfigJson - Caminho de `wsl_config.json`.
 * @returns {Promise<EstadoDispensadoWsl>} Estado gravado.
 */
export async function dispensarAvisoWsl(
  caminhoWslConfigJson: string,
): Promise<EstadoDispensadoWsl> {
  const estado: EstadoDispensadoWsl = { dismissed: true, dismissed_at: new Date().toISOString() };
  await gravarJson(caminhoWslConfigJson, estado);
  return estado;
}

/**
 * Lê o estado "dispensado" de `wsl_config.json`.
 * @param {string} caminhoWslConfigJson - Caminho de `wsl_config.json`.
 * @returns {Promise<EstadoDispensadoWsl>} Estado (ausente → não dispensado).
 */
export function lerEstadoDispensado(caminhoWslConfigJson: string): Promise<EstadoDispensadoWsl> {
  return lerJson<EstadoDispensadoWsl>(caminhoWslConfigJson, {
    dismissed: false,
    dismissed_at: null,
  });
}

/** Reexporta o `check_wsl_status` da detecção para os canais. */
export { verificarStatusWsl, type StatusWsl };
