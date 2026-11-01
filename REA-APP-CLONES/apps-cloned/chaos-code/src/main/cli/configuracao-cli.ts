/**
 * Gravação da configuração MCP nos CLIs (`.mcp.json`, `.gemini/settings.json`,
 * `.codex/config.toml`): backup antes de alterar, gravação em arquivo temporário + rename e a
 * linha no `.git/info/exclude` para não versionar o token (inventário `mcp-cli-wsl.md`
 * §"Configuração nos CLIs"). Também monta os comandos `mcp add` mostrados ao usuário.
 */

import { mkdir, readFile, rename, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { CLIS_SUPORTADOS, type DefinicaoCli } from './clis-suportados';

/** Resultado da gravação da configuração de um CLI. */
export interface ResultadoConfiguracaoCli {
  cli: DefinicaoCli['id'];
  arquivo: string;
  backup: string | null;
}

/** Comandos `mcp add` de um CLI para mostrar ao usuário. */
export interface ComandosMcpCli {
  cli: DefinicaoCli['id'];
  /** Comando com o token real (só no main; nunca vai ao renderer). */
  comToken: string | null;
  /** Comando para exibir (token oculto como `[TOKEN]`). */
  exibicao: string | null;
  /** Comando sem token (fluxo OAuth). */
  semToken: string;
}

const LINHA_EXCLUDE = '# Chaos Code: config MCP local com credencial — não versionar';
const MSG_BACKUP_FALHOU = 'Não foi possível criar backup de';
const MSG_CONFIG_INVALIDA = 'Corrija manualmente antes de conectar';
const MARCADOR_NOME = '<nome>';
const MARCADOR_URL = '<url>';
const MARCADOR_TOKEN = '<token>';
const MARCADOR_PORTA = '<porta>';
const MARCADOR_PROJETO = '<project_id>';
const PREFIXO_EXCLUDE = '# Chaos Code:';

/**
 * Substitui os marcadores do molde do comando.
 * @param {string} molde - Texto do comando com `<nome>`, `<url>`, `<token>`...
 * @param {Record<string, string>} valores - Valores de cada marcador.
 * @returns {string} Comando pronto.
 */
function preencherMolde(molde: string, valores: Record<string, string>): string {
  return Object.entries(valores).reduce(
    (comando, [marcador, valor]) => comando.split(marcador).join(valor),
    molde,
  );
}

/**
 * Monta os comandos `mcp add` de um CLI para um projeto.
 * @param {DefinicaoCli} cli - CLI alvo.
 * @param {{ nome: string; url: string; token: string | null; porta: number; projectId: string }}
 *   dados - Nome do servidor, URL do MCP, token, porta e id do projeto.
 * @returns {ComandosMcpCli} Comandos prontos (com token só no main).
 */
export function montarComandosMcp(
  cli: DefinicaoCli,
  dados: { nome: string; url: string; token: string | null; porta: number; projectId: string },
): ComandosMcpCli {
  const valores = {
    [MARCADOR_NOME]: dados.nome,
    [MARCADOR_URL]: dados.url,
    [MARCADOR_TOKEN]: dados.token ?? '',
    [MARCADOR_PORTA]: String(dados.porta),
    [MARCADOR_PROJETO]: dados.projectId,
  };
  return {
    cli: cli.id,
    comToken:
      dados.token && cli.moldes.comToken ? preencherMolde(cli.moldes.comToken, valores) : null,
    exibicao: cli.moldes.exibicao ? preencherMolde(cli.moldes.exibicao, valores) : null,
    semToken: preencherMolde(cli.moldes.semToken, valores),
  };
}

/**
 * Marca o arquivo de configuração no `.git/info/exclude` do repositório (não versionar o token).
 * @param {string} pastaProjeto - Pasta local do projeto.
 * @param {string} arquivoConfig - Caminho do arquivo gravado.
 * @returns {Promise<void>}
 */
async function marcarNoExclude(pastaProjeto: string, arquivoConfig: string): Promise<void> {
  const pastaInfo = path.join(pastaProjeto, '.git', 'info');
  const exclude = path.join(pastaInfo, 'exclude');
  try {
    const atual = await readFile(exclude, 'utf8').catch(() => '');
    if (atual.includes(arquivoConfig) || atual.includes(PREFIXO_EXCLUDE)) return;
    await mkdir(pastaInfo, { recursive: true });
    const relativo = path.relative(pastaProjeto, arquivoConfig).split(path.sep).join('/');
    await writeFile(exclude, `${atual}${LINHA_EXCLUDE}\n${relativo}\n`, 'utf8');
  } catch {
    // Sem repositório Git no projeto: nada a excluir.
  }
}

/**
 * Monta o JSON da entrada do servidor MCP do CLI.
 * @param {DefinicaoCli} cli - CLI alvo.
 * @param {{ nome: string; url: string; token: string | null }} dados - Servidor a gravar.
 * @returns {string} Conteúdo do arquivo.
 * @throws {Error} Se a configuração existente estiver inválida ("Corrija manualmente...").
 */
async function montarConteudoConfig(
  cli: DefinicaoCli,
  dados: { nome: string; url: string; token: string | null },
): Promise<string> {
  const molde = cli.moldeEntradaServidor;
  return preencherMolde(molde, {
    [MARCADOR_NOME]: dados.nome,
    [MARCADOR_URL]: dados.url,
    [MARCADOR_TOKEN]: dados.token ?? '',
  });
}

/**
 * Grava a configuração MCP de um CLI na pasta do projeto, com backup e gravação atômica.
 * @param {DefinicaoCli} cli - CLI alvo.
 * @param {string} pastaProjeto - Pasta local do projeto (`local_path`).
 * @param {{ nome: string; url: string; token: string | null }} dados - Servidor MCP.
 * @returns {Promise<ResultadoConfiguracaoCli>} Arquivo gravado e backup feito.
 * @throws {Error} Se a configuração existente for inválida ou o backup falhar.
 */
export async function configurarCli(
  cli: DefinicaoCli,
  pastaProjeto: string,
  dados: { nome: string; url: string; token: string | null },
): Promise<ResultadoConfiguracaoCli> {
  const arquivo = path.join(pastaProjeto, cli.arquivoConfiguracao);
  const existente = await readFile(arquivo, 'utf8').catch(() => null);
  if (existente !== null && cli.formato === 'json') {
    try {
      JSON.parse(existente);
    } catch {
      throw new Error(`${MSG_CONFIG_INVALIDA}: ${arquivo}`);
    }
  }
  let backup: string | null = null;
  if (existente !== null) {
    backup = `${arquivo}.bak`;
    await copyFile(arquivo, backup).catch(() => {
      throw new Error(`${MSG_BACKUP_FALHOU} ${arquivo}`);
    });
  }
  const conteudo = await montarConteudoConfig(cli, dados);
  await mkdir(path.dirname(arquivo), { recursive: true });
  const temporario = `${arquivo}.tmp`;
  await writeFile(temporario, conteudo, 'utf8');
  await rename(temporario, arquivo);
  await marcarNoExclude(pastaProjeto, arquivo);
  return { cli: cli.id, arquivo, backup };
}

/**
 * Configura todos os CLIs suportados na pasta do projeto.
 * @param {string} pastaProjeto - Pasta local do projeto.
 * @param {{ nome: string; url: string; token: string | null }} dados - Servidor MCP.
 * @returns {Promise<ResultadoConfiguracaoCli[]>} Um resultado por CLI.
 */
export function configurarTodosClis(
  pastaProjeto: string,
  dados: { nome: string; url: string; token: string | null },
): Promise<ResultadoConfiguracaoCli[]> {
  return Promise.all(
    CLIS_SUPORTADOS.map((cli) => configurarCli(cli, pastaProjeto, dados)),
  );
}
