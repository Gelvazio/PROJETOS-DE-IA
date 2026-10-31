/**
 * Detecção do WSL e do IP do host Windows (`wsl::detect` e `commands::wsl` do original,
 * inventário `mcp-cli-wsl.md`, seção "WSL", passos 1 a 4, e `arquivos-locais.md`).
 *
 * Passos: `wsl --version` (instalado?), `wsl --list --running --quiet` (distros rodando),
 * `netsh interface ip show addresses` (IP do adaptador do WSL), modo *mirrored* (usa `127.0.0.1`)
 * e a situação `check_wsl_status`. Processo e arquivos são injetados; os comandos têm argumentos
 * fixos e rodam sem shell. Corrigir o `.wslconfig` (passo 5) é outra subtarefa.
 */

import type { ConfiguracaoWslArquivo } from '../../compartilhado/tipos-armazenamento';
import type { ExecutorProcesso } from '../cli/descoberta-cli';

const PLATAFORMA_WINDOWS = 'win32';
const EXECUTAVEL_WSL = 'wsl.exe';
const EXECUTAVEL_NETSH = 'netsh.exe';
const ARGUMENTOS_WSL_VERSAO = ['--version'];
const ARGUMENTOS_WSL_RODANDO = ['--list', '--running', '--quiet'];
const ARGUMENTOS_NETSH_ENDERECOS = ['interface', 'ip', 'show', 'addresses'];
const ARQUIVO_WSLCONFIG = '.wslconfig';
const IP_MODO_MIRRORED = '127.0.0.1';
const TEMPO_LIMITE_WSL_MS = 5000;
const REGEX_CARACTERE_NULO = /\0/g;
const REGEX_ADAPTADOR_WSL = /wsl/i;
const REGEX_IPV4 = /\b(\d{1,3}(?:\.\d{1,3}){3})\b/;
const REGEX_CABECALHO_INTERFACE = /"[^"]+"/;
const REGEX_MIRRORED = /^\s*networkingMode\s*=\s*mirrored\s*$/im;
const REGEX_FORWARDING_DESLIGADO = /^\s*localhostForwarding\s*=\s*false\s*$/im;
const MSG_SEM_ADAPTADOR = 'Adaptador WSL não encontrado no output do netsh';
const MSG_SEM_IP =
  'A pasta do projeto está no WSL, mas não foi possível detectar o IP do host Windows para o WSL2';

/** Acesso ao ambiente usado na detecção (tudo injetado). */
export interface DependenciasDeteccaoWsl {
  /** Valor de `process.platform`. */
  plataforma: string;
  /** Executa `wsl.exe` e `netsh.exe` com argumentos fixos. */
  executor: ExecutorProcesso;
  /** Lê um arquivo de texto; devolve null se ele não existir. */
  lerArquivo(caminho: string): Promise<string | null>;
  /** Pasta do usuário (`%USERPROFILE%`), onde fica o `.wslconfig`. */
  pastaUsuario: string;
  /** Caminho do `wsl_config.json` (aviso dispensado). */
  caminhoConfigWsl: string;
}

/** Leitura do `.wslconfig`. */
export interface ConfigWslConfig {
  /** true se o arquivo existe. */
  existe: boolean;
  /** true se o `networkingMode=mirrored` está ligado. */
  mirrored: boolean;
  /** false só se o arquivo trouxer `localhostForwarding=false` *(regra inferida)*. */
  localhostForwarding: boolean;
}

/** Retorno de `check_wsl_status` (nomes do original). */
export interface StatusWsl {
  is_windows: boolean;
  wsl_installed: boolean;
  localhost_forwarding: boolean;
  wslconfig_exists: boolean;
  running_distros: string[];
  dismissed: boolean;
}

/** Erro de detecção do WSL, com mensagem em português. */
export class ErroDeteccaoWsl extends Error {
  /**
   * @param {string} mensagem - O que impediu a detecção.
   */
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroDeteccaoWsl';
  }
}

/**
 * Tira os caracteres nulos da saída do `wsl.exe`, que escreve em UTF-16.
 * @param {string} saida - Saída lida como texto.
 * @returns {string} Texto sem `\0`.
 */
export function limparSaidaWsl(saida: string): string {
  return saida.replace(REGEX_CARACTERE_NULO, '');
}

/**
 * Lê a lista de distros da saída de `wsl --list --running --quiet`.
 * @param {string} saida - Saída do comando.
 * @returns {string[]} Nomes das distros, uma por linha não vazia.
 */
export function analisarDistrosRodando(saida: string): string[] {
  return limparSaidaWsl(saida)
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter((linha) => linha !== '');
}

/**
 * Lê o `.wslconfig` (modo mirrored e redirecionamento do localhost).
 * @param {string | null} texto - Conteúdo do arquivo, ou null se não existir.
 * @returns {ConfigWslConfig} Situação do arquivo.
 */
export function analisarWslConfig(texto: string | null): ConfigWslConfig {
  if (texto === null) return { existe: false, mirrored: false, localhostForwarding: true };
  return {
    existe: true,
    mirrored: REGEX_MIRRORED.test(texto),
    localhostForwarding: !REGEX_FORWARDING_DESLIGADO.test(texto),
  };
}

/**
 * Acha o IP do adaptador do WSL na saída de `netsh interface ip show addresses`.
 * O bloco do adaptador começa numa linha com o nome entre aspas (ex.: "vEthernet (WSL)") e
 * vale o primeiro IPv4 dele; funciona também com a saída em português.
 * @param {string} saida - Saída do `netsh`.
 * @returns {string | null} IP do adaptador, ou null se não houver.
 */
export function extrairIpAdaptadorWsl(saida: string): string | null {
  let dentroDoAdaptador = false;
  for (const linha of limparSaidaWsl(saida).split(/\r?\n/)) {
    const nome = REGEX_CABECALHO_INTERFACE.exec(linha);
    if (nome) {
      dentroDoAdaptador = REGEX_ADAPTADOR_WSL.test(nome[0]);
      continue;
    }
    const ip = dentroDoAdaptador ? REGEX_IPV4.exec(linha) : null;
    if (ip) return ip[1];
  }
  return null;
}

/**
 * Executa um comando do WSL e devolve a saída, ou null se o comando falhar.
 * @param {string} executavel - `wsl.exe` ou `netsh.exe`.
 * @param {string[]} argumentos - Argumentos fixos.
 * @param {ExecutorProcesso} executor - Executor de processos.
 * @returns {Promise<string | null>} Saída limpa, ou null em caso de erro ou tempo esgotado.
 */
async function executarOuNulo(
  executavel: string,
  argumentos: string[],
  executor: ExecutorProcesso,
): Promise<string | null> {
  try {
    return limparSaidaWsl(await executor.executar(executavel, argumentos, TEMPO_LIMITE_WSL_MS));
  } catch {
    return null;
  }
}

/**
 * Passo 1: confere se o WSL está instalado (`wsl --version` termina sem erro).
 * @param {DependenciasDeteccaoWsl} deps - Dependências injetadas.
 * @returns {Promise<boolean>} true se o WSL respondeu; sempre false fora do Windows.
 */
export async function detectarWslInstalado(deps: DependenciasDeteccaoWsl): Promise<boolean> {
  if (deps.plataforma !== PLATAFORMA_WINDOWS) return false;
  const saida = await executarOuNulo(EXECUTAVEL_WSL, ARGUMENTOS_WSL_VERSAO, deps.executor);
  return saida !== null;
}

/**
 * Passo 1: lista as distros em execução (`wsl --list --running --quiet`).
 * @param {DependenciasDeteccaoWsl} deps - Dependências injetadas.
 * @returns {Promise<string[]>} Nomes das distros; vazio se o comando falhar.
 */
export async function listarDistrosRodando(deps: DependenciasDeteccaoWsl): Promise<string[]> {
  if (deps.plataforma !== PLATAFORMA_WINDOWS) return [];
  const saida = await executarOuNulo(EXECUTAVEL_WSL, ARGUMENTOS_WSL_RODANDO, deps.executor);
  return saida === null ? [] : analisarDistrosRodando(saida);
}

/**
 * Lê o `.wslconfig` da pasta do usuário.
 * @param {DependenciasDeteccaoWsl} deps - Dependências injetadas.
 * @returns {Promise<ConfigWslConfig>} Situação do arquivo.
 */
export async function lerWslConfig(deps: DependenciasDeteccaoWsl): Promise<ConfigWslConfig> {
  const separador = deps.pastaUsuario.includes('\\') ? '\\' : '/';
  const caminho = `${deps.pastaUsuario}${separador}${ARQUIVO_WSLCONFIG}`;
  return analisarWslConfig(await deps.lerArquivo(caminho));
}

/**
 * Passos 2 e 3: descobre o IP do host Windows que o WSL enxerga. No modo mirrored devolve
 * `127.0.0.1`; senão lê o IP do adaptador do WSL no `netsh`.
 * @param {DependenciasDeteccaoWsl} deps - Dependências injetadas.
 * @returns {Promise<string>} IP do host Windows.
 * @throws {ErroDeteccaoWsl} Se o `netsh` falhar ou não houver adaptador do WSL.
 */
export async function detectarIpHostWindows(deps: DependenciasDeteccaoWsl): Promise<string> {
  const config = await lerWslConfig(deps);
  if (config.mirrored) return IP_MODO_MIRRORED;

  const saida = await executarOuNulo(EXECUTAVEL_NETSH, ARGUMENTOS_NETSH_ENDERECOS, deps.executor);
  if (saida === null) throw new ErroDeteccaoWsl(MSG_SEM_IP);

  const ip = extrairIpAdaptadorWsl(saida);
  if (ip === null) throw new ErroDeteccaoWsl(`${MSG_SEM_IP}: ${MSG_SEM_ADAPTADOR}`);
  return ip;
}

/**
 * Lê se o aviso do WSL foi dispensado (`wsl_config.json`); arquivo ausente ou inválido = não.
 * @param {DependenciasDeteccaoWsl} deps - Dependências injetadas.
 * @returns {Promise<boolean>} Valor de `dismissed`.
 */
async function lerAvisoDispensado(deps: DependenciasDeteccaoWsl): Promise<boolean> {
  try {
    const texto = await deps.lerArquivo(deps.caminhoConfigWsl);
    if (texto === null) return false;
    const dados = JSON.parse(texto) as Partial<ConfiguracaoWslArquivo>;
    return dados.dismissed === true;
  } catch {
    return false;
  }
}

/**
 * Passo 4: monta a situação do WSL (`check_wsl_status`).
 * @param {DependenciasDeteccaoWsl} deps - Dependências injetadas.
 * @returns {Promise<StatusWsl>} Situação para o painel; fora do Windows tudo vem desligado.
 */
export async function verificarStatusWsl(deps: DependenciasDeteccaoWsl): Promise<StatusWsl> {
  const ehWindows = deps.plataforma === PLATAFORMA_WINDOWS;
  const instalado = await detectarWslInstalado(deps);
  const config = await lerWslConfig(deps);

  return {
    is_windows: ehWindows,
    wsl_installed: instalado,
    localhost_forwarding: config.localhostForwarding || config.mirrored,
    wslconfig_exists: config.existe,
    running_distros: instalado ? await listarDistrosRodando(deps) : [],
    dismissed: await lerAvisoDispensado(deps),
  };
}
