/**
 * Descoberta dos CLIs de IA instalados (`agents::cli_discovery` do original, inventário
 * `mcp-cli-wsl.md` e `modulos.md`): procura o executável de cada CLI de `CLIS_SUPORTADOS` no
 * PATH, sem executar nada por padrão. Opcionalmente lê a versão (`<exe> --version`) e lista os
 * agentes reconhecidos pelo Claude Code (`claude agents`), ambos com tempo limite de 5 s.
 *
 * Processo, ambiente e arquivos são injetados (`DependenciasDescoberta`). A execução usa
 * `execFile` com argumentos fixos, nunca um shell com texto montado.
 */

import { execFile } from 'node:child_process';
import { stat } from 'node:fs/promises';
import path from 'node:path';

import { CLIS_SUPORTADOS, type DefinicaoCli } from './clis-suportados';

/** Tempo limite de cada comando executado (o original usa 5 s em `claude agents`). */
export const TEMPO_LIMITE_COMANDO_CLI_MS = 5000;

const PLATAFORMA_WINDOWS = 'win32';
const SEPARADOR_PATH_WINDOWS = ';';
const SEPARADOR_PATH_POSIX = ':';
const EXTENSOES_EXECUTAVEIS_WINDOWS = ['.exe', '.cmd', '.bat', '.ps1'] as const;
const EXTENSOES_SCRIPT_CMD = ['.cmd', '.bat'];
const EXTENSAO_SCRIPT_POWERSHELL = '.ps1';
const ARGUMENTO_VERSAO = '--version';
const ARGUMENTOS_AGENTES_CLAUDE = ['agents'];
const ID_CLI_CLAUDE = 'claude';
const LIMITE_SAIDA_BYTES = 1024 * 1024;
const LIMITE_TEXTO_VERSAO = 200;
const CARACTERES_PERIGOSOS_CMD = /[&|<>^%!"\r\n]/;
const MSG_CLI_NAO_DISPONIVEL = 'CLI não disponível';
const MSG_TEMPO_ESGOTADO = 'tempo de 5s excedido';
const MSG_CAMINHO_INSEGURO = 'caminho do executável não é seguro para executar';

/** Variáveis de ambiente e plataforma usadas na busca. */
export interface AmbienteDescoberta {
  /** Valor de `process.platform` (`win32`, `linux`, `darwin`...). */
  plataforma: string;
  /** Variáveis de ambiente (`PATH`, `PATHEXT`). */
  variaveis: Readonly<Record<string, string | undefined>>;
}

/** Acesso ao sistema de arquivos usado na busca. */
export interface ArquivosDescoberta {
  /** true se o caminho existe e é um arquivo. */
  ehArquivo(caminho: string): Promise<boolean>;
}

/** Erro de um comando que passou do tempo limite. */
export class ErroTempoLimiteComando extends Error {
  constructor() {
    super(MSG_TEMPO_ESGOTADO);
    this.name = 'ErroTempoLimiteComando';
  }
}

/** Execução de um processo com tempo limite. */
export interface ExecutorProcesso {
  /**
   * Executa o arquivo com argumentos fixos e devolve a saída padrão.
   * @throws {ErroTempoLimiteComando} Se passar do tempo limite.
   * @throws {Error} Se o processo falhar ou sair com código diferente de 0.
   */
  executar(caminho: string, argumentos: string[], tempoLimiteMs: number): Promise<string>;
}

/** Dependências injetadas na descoberta. */
export interface DependenciasDescoberta {
  ambiente: AmbienteDescoberta;
  arquivos: ArquivosDescoberta;
  executor: ExecutorProcesso;
}

/** Opções da descoberta. */
export interface OpcoesDescoberta {
  /** Roda `<exe> --version` de cada CLI instalado (padrão: false, não executa nada). */
  obterVersao?: boolean;
  /** Roda `claude agents` quando o Claude Code estiver instalado (padrão: false). */
  listarAgentesClaude?: boolean;
}

/** Resultado da descoberta de um CLI. */
export interface ResultadoCli {
  id: DefinicaoCli['id'];
  nomeExibicao: string;
  instalado: boolean;
  /** Caminho completo do executável encontrado. */
  caminho: string | null;
  /** Primeira linha de `--version`, se pedida e obtida. */
  versao?: string;
  /** Motivo de não ter obtido a versão ou os agentes. */
  erro?: string;
  /** Linhas de `claude agents` (formato da saída *inferido*: uma linha por item). */
  agentes?: string[];
}

/**
 * Escolhe a biblioteca de caminhos da plataforma pedida (funciona nas duas, em qualquer sistema).
 * @param {string} plataforma - Valor de `process.platform`.
 * @returns {typeof path.posix} `path.win32` ou `path.posix`.
 */
function obterCaminhosDaPlataforma(plataforma: string): typeof path.posix {
  return plataforma === PLATAFORMA_WINDOWS ? path.win32 : path.posix;
}

/**
 * Lê uma variável de ambiente; no Windows o nome não diferencia maiúsculas (`Path` x `PATH`).
 * @param {AmbienteDescoberta} ambiente - Ambiente da busca.
 * @param {string} nome - Nome da variável.
 * @returns {string} O valor, ou texto vazio.
 */
function lerVariavel(ambiente: AmbienteDescoberta, nome: string): string {
  const ehWindows = ambiente.plataforma === PLATAFORMA_WINDOWS;
  const chave = Object.keys(ambiente.variaveis).find((candidata) =>
    ehWindows ? candidata.toLowerCase() === nome.toLowerCase() : candidata === nome,
  );
  return (chave ? ambiente.variaveis[chave] : undefined) ?? '';
}

/**
 * Lista as pastas do PATH, sem aspas e sem entradas vazias.
 * @param {AmbienteDescoberta} ambiente - Ambiente da busca.
 * @returns {string[]} Pastas na ordem do PATH.
 */
export function listarPastasDoPath(ambiente: AmbienteDescoberta): string[] {
  const ehWindows = ambiente.plataforma === PLATAFORMA_WINDOWS;
  const separador = ehWindows ? SEPARADOR_PATH_WINDOWS : SEPARADOR_PATH_POSIX;
  return lerVariavel(ambiente, 'PATH')
    .split(separador)
    .map((pasta) => pasta.trim().replace(/^"(.*)"$/, '$1'))
    .filter((pasta) => pasta.length > 0);
}

/**
 * Lista as extensões a testar. No Windows: as do `PATHEXT` que são executáveis conhecidos, na
 * ordem dele, mais `.exe`, `.cmd`, `.bat` e `.ps1` que faltarem (`PATHEXT` não traz `.ps1`).
 * Nos outros sistemas: só o nome puro.
 * @param {AmbienteDescoberta} ambiente - Ambiente da busca.
 * @returns {string[]} Extensões em minúsculas ('' = nome puro).
 */
export function listarExtensoesExecutaveis(ambiente: AmbienteDescoberta): string[] {
  if (ambiente.plataforma !== PLATAFORMA_WINDOWS) return [''];

  const conhecidas: readonly string[] = EXTENSOES_EXECUTAVEIS_WINDOWS;
  const doPathext = lerVariavel(ambiente, 'PATHEXT')
    .split(SEPARADOR_PATH_WINDOWS)
    .map((extensao) => extensao.trim().toLowerCase())
    .filter((extensao) => conhecidas.includes(extensao));
  return [...new Set([...doPathext, ...conhecidas])];
}

/**
 * Procura o executável no PATH sem executar nada.
 * @param {string} nome - Nome do executável (ex.: `claude`).
 * @param {DependenciasDescoberta} dependencias - Ambiente e arquivos (o executor não é usado).
 * @returns {Promise<string | null>} Caminho do primeiro arquivo encontrado, ou null.
 */
export async function localizarExecutavel(
  nome: string,
  dependencias: DependenciasDescoberta,
): Promise<string | null> {
  const caminhos = obterCaminhosDaPlataforma(dependencias.ambiente.plataforma);
  const extensoes = listarExtensoesExecutaveis(dependencias.ambiente);

  for (const pasta of listarPastasDoPath(dependencias.ambiente)) {
    for (const extensao of extensoes) {
      const candidato = caminhos.join(pasta, `${nome}${extensao}`);
      if (await dependencias.arquivos.ehArquivo(candidato)) return candidato;
    }
  }
  return null;
}

/**
 * Monta o arquivo e os argumentos de `execFile` para o caminho achado. No Windows, `.cmd` e
 * `.bat` rodam por `cmd.exe /d /s /c` e `.ps1` por `powershell.exe -File`; os argumentos são
 * sempre fixos. Caminho com caracteres de shell em `.cmd`/`.bat` é recusado.
 * @param {string} caminho - Executável encontrado.
 * @param {string[]} argumentos - Argumentos fixos do comando.
 * @returns {{ arquivo: string, argumentos: string[] }} Chamada para o `execFile`.
 * @throws {Error} Se o caminho de um `.cmd`/`.bat` tiver caracteres perigosos para o `cmd.exe`.
 */
export function montarInvocacao(
  caminho: string,
  argumentos: string[],
): { arquivo: string; argumentos: string[] } {
  const extensao = path.win32.extname(caminho).toLowerCase();
  if (EXTENSOES_SCRIPT_CMD.includes(extensao)) {
    if (CARACTERES_PERIGOSOS_CMD.test(caminho)) throw new Error(MSG_CAMINHO_INSEGURO);
    return { arquivo: 'cmd.exe', argumentos: ['/d', '/s', '/c', caminho, ...argumentos] };
  }
  if (extensao === EXTENSAO_SCRIPT_POWERSHELL) {
    const base = ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File'];
    return { arquivo: 'powershell.exe', argumentos: [...base, caminho, ...argumentos] };
  }
  return { arquivo: caminho, argumentos };
}

/**
 * Cria o executor padrão, com `node:child_process`.
 * @param {string} plataforma - Valor de `process.platform` (decide se usa `montarInvocacao`).
 * @returns {ExecutorProcesso} Executor com `execFile`, sem shell e sem janela.
 */
export function criarExecutorNode(plataforma: string = process.platform): ExecutorProcesso {
  return {
    executar(caminho, argumentos, tempoLimiteMs) {
      return new Promise((resolver, rejeitar) => {
        const chamada =
          plataforma === PLATAFORMA_WINDOWS
            ? montarInvocacao(caminho, argumentos)
            : { arquivo: caminho, argumentos };
        execFile(
          chamada.arquivo,
          chamada.argumentos,
          { timeout: tempoLimiteMs, windowsHide: true, maxBuffer: LIMITE_SAIDA_BYTES },
          (erro, saida) => {
            if (!erro) return resolver(saida);
            const estourou = (erro as { killed?: boolean }).killed === true;
            rejeitar(estourou ? new ErroTempoLimiteComando() : erro);
          },
        );
      });
    },
  };
}

/**
 * Cria as dependências padrão: ambiente do processo, `node:fs` e `execFile`.
 * @returns {DependenciasDescoberta} Dependências reais.
 */
export function criarDependenciasNode(): DependenciasDescoberta {
  return {
    ambiente: { plataforma: process.platform, variaveis: process.env },
    arquivos: {
      async ehArquivo(caminho) {
        try {
          return (await stat(caminho)).isFile();
        } catch {
          return false;
        }
      },
    },
    executor: criarExecutorNode(),
  };
}

/**
 * Executa um comando fixo e transforma a falha em texto curto.
 * @param {string} caminho - Executável.
 * @param {string[]} argumentos - Argumentos fixos.
 * @param {ExecutorProcesso} executor - Executor de processos.
 * @returns {Promise<{ saida: string } | { erro: string }>} Saída ou motivo da falha.
 */
async function executarComTempoLimite(
  caminho: string,
  argumentos: string[],
  executor: ExecutorProcesso,
): Promise<{ saida: string } | { erro: string }> {
  try {
    return { saida: await executor.executar(caminho, argumentos, TEMPO_LIMITE_COMANDO_CLI_MS) };
  } catch (erro) {
    return { erro: erro instanceof Error ? erro.message : String(erro) };
  }
}

/**
 * Junta mensagens de erro, para que a segunda falha não apague a primeira.
 * @param {string | undefined} anterior - Erro já registrado, se houver.
 * @param {string} novo - Erro a acrescentar.
 * @returns {string} Os erros separados por "; ".
 */
function juntarErros(anterior: string | undefined, novo: string): string {
  return anterior ? `${anterior}; ${novo}` : novo;
}

/**
 * Preenche a versão (ou o erro) de um CLI instalado, rodando `<exe> --version`.
 * @param {ResultadoCli} resultado - Resultado parcial, com `caminho`.
 * @param {ExecutorProcesso} executor - Executor de processos.
 * @returns {Promise<void>} Resolve ao preencher `versao` ou `erro`.
 */
async function preencherVersao(
  resultado: ResultadoCli,
  executor: ExecutorProcesso,
): Promise<void> {
  const resposta = await executarComTempoLimite(
    resultado.caminho as string,
    [ARGUMENTO_VERSAO],
    executor,
  );
  if ('erro' in resposta) {
    resultado.erro = juntarErros(resultado.erro, `versão: ${resposta.erro}`);
    return;
  }
  const primeiraLinha = resposta.saida.split(/\r?\n/).find((linha) => linha.trim()) ?? '';
  resultado.versao = primeiraLinha.trim().slice(0, LIMITE_TEXTO_VERSAO);
}

/**
 * Preenche a lista de agentes (ou o erro) rodando `claude agents`.
 * @param {ResultadoCli} resultado - Resultado do Claude Code, com `caminho`.
 * @param {ExecutorProcesso} executor - Executor de processos.
 * @returns {Promise<void>} Resolve ao preencher `agentes` ou `erro`.
 */
async function preencherAgentes(
  resultado: ResultadoCli,
  executor: ExecutorProcesso,
): Promise<void> {
  const resposta = await executarComTempoLimite(
    resultado.caminho as string,
    ARGUMENTOS_AGENTES_CLAUDE,
    executor,
  );
  if ('erro' in resposta) {
    resultado.erro = juntarErros(resultado.erro, `agents: ${resposta.erro}`);
    return;
  }
  resultado.agentes = resposta.saida
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter((linha) => linha.length > 0);
}

/**
 * Descobre um CLI: procura no PATH e, se pedido, lê versão e agentes.
 * @param {DefinicaoCli} definicao - CLI de `CLIS_SUPORTADOS`.
 * @param {DependenciasDescoberta} dependencias - Ambiente, arquivos e executor.
 * @param {OpcoesDescoberta} opcoes - O que executar além da busca (padrão: nada).
 * @returns {Promise<ResultadoCli>} Resultado tipado do CLI.
 */
export async function descobrirCli(
  definicao: DefinicaoCli,
  dependencias: DependenciasDescoberta,
  opcoes: OpcoesDescoberta = {},
): Promise<ResultadoCli> {
  const caminho = await localizarExecutavel(definicao.executavel, dependencias);
  const resultado: ResultadoCli = {
    id: definicao.id,
    nomeExibicao: definicao.nomeExibicao,
    instalado: caminho !== null,
    caminho,
  };
  if (caminho === null) {
    resultado.erro = `${definicao.executavel}: ${MSG_CLI_NAO_DISPONIVEL}`;
    return resultado;
  }

  if (opcoes.obterVersao) await preencherVersao(resultado, dependencias.executor);
  const querAgentes = opcoes.listarAgentesClaude && definicao.id === ID_CLI_CLAUDE;
  if (querAgentes) await preencherAgentes(resultado, dependencias.executor);
  return resultado;
}

/**
 * Descobre todos os CLIs suportados, em paralelo.
 * @param {DependenciasDescoberta} dependencias - Ambiente, arquivos e executor (padrão: reais).
 * @param {OpcoesDescoberta} opcoes - O que executar além da busca (padrão: nada).
 * @returns {Promise<ResultadoCli[]>} Um resultado por CLI, na ordem de `CLIS_SUPORTADOS`.
 */
export function descobrirClis(
  dependencias: DependenciasDescoberta = criarDependenciasNode(),
  opcoes: OpcoesDescoberta = {},
): Promise<ResultadoCli[]> {
  return Promise.all(CLIS_SUPORTADOS.map((cli) => descobrirCli(cli, dependencias, opcoes)));
}
