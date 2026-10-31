/**
 * Grava um agente na pasta de agentes do CLI (`.claude/agents/<nome>.md`, inventário
 * `modulos.md` `agents::manager` e `arquivos-locais.md`): valida o nome do arquivo, bloqueia
 * path traversal, limita o tamanho a 10 MB e grava em `<nome>.md.tmp` antes de renomear.
 *
 * Só o Claude Code tem pasta de agentes no inventário; os outros CLIs recusam com erro claro.
 * O acesso a arquivos é injetado (`ArquivosAgentes`) e nada é gravado fora da pasta do CLI.
 */

import path from 'node:path';

import type { Agente } from '../../compartilhado/tipos-agentes';
import type { DefinicaoCli } from '../cli/clis-suportados';
import { gerarAgente } from './frontmatter';

const PASTAS_AGENTES_POR_CLI: Readonly<Partial<Record<DefinicaoCli['id'], readonly string[]>>> = {
  claude: ['.claude', 'agents'],
};
const EXTENSAO_AGENTE = '.md';
const EXTENSAO_TEMPORARIA = '.tmp';
const LIMITE_ARQUIVO_AGENTE_BYTES = 10 * 1024 * 1024;
const LIMITE_NOME_AGENTE = 64;
const REGEX_NOME_ARQUIVO = /^[a-z][a-z0-9-]*$/;
const MSG_SEM_PASTA_AGENTES = 'O CLI não tem pasta de agentes';
const MSG_NOME_INVALIDO = 'Nome de agente inválido para arquivo';
const MSG_PATH_TRAVERSAL = 'Operação bloqueada: path traversal detectado';
const MSG_ARQUIVO_GRANDE = 'Agente maior que o limite de 10 MB';
const MSG_SEM_PASTA_BASE = 'Pasta base não informada';

/** Acesso ao sistema de arquivos usado na gravação (injetado). */
export interface ArquivosAgentes {
  /** Cria a pasta (e as pais) se ainda não existir. */
  criarPasta(caminho: string): Promise<void>;
  /** Grava o texto no arquivo, criando ou substituindo. */
  gravarTexto(caminho: string, conteudo: string): Promise<void>;
  /** Renomeia o arquivo, substituindo o destino. */
  renomear(origem: string, destino: string): Promise<void>;
  /** Apaga o arquivo; sem erro se ele não existir. */
  remover(caminho: string): Promise<void>;
}

/** Dependências da gravação. */
export interface DependenciasGravarAgente {
  arquivos: ArquivosAgentes;
}

/** Pedido de gravação de um agente. */
export interface PedidoGravarAgente {
  agente: Agente;
  /** Id do CLI de destino (`claude`, `gemini` ou `codex`). */
  cli: DefinicaoCli['id'];
  /** Pasta base: raiz do projeto (agente do projeto) ou pasta do usuário (agente global). */
  pastaBase: string;
}

/** Erro de gravação de agente, com mensagem em português. */
export class ErroGravarAgente extends Error {
  /**
   * @param {string} mensagem - O que impediu a gravação.
   */
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroGravarAgente';
  }
}

/**
 * Confere que o nome do agente serve de nome de arquivo (minúsculas, números e hífen).
 * @param {string} nome - Campo `name` do frontmatter.
 * @returns {string} O próprio nome.
 * @throws {ErroGravarAgente} Se tiver barra, ponto, espaço, for vazio ou longo demais.
 */
export function validarNomeArquivoAgente(nome: string): string {
  const valido = REGEX_NOME_ARQUIVO.test(nome) && nome.length <= LIMITE_NOME_AGENTE;
  if (!valido) throw new ErroGravarAgente(`${MSG_NOME_INVALIDO}: "${nome}"`);
  return nome;
}

/**
 * Descobre a pasta de agentes do CLI dentro da pasta base.
 * @param {DefinicaoCli['id']} cli - Id do CLI.
 * @param {string} pastaBase - Raiz do projeto ou pasta do usuário.
 * @returns {string} Caminho da pasta de agentes.
 * @throws {ErroGravarAgente} Se o CLI não tiver pasta de agentes ou a base for vazia.
 */
export function obterPastaAgentes(cli: DefinicaoCli['id'], pastaBase: string): string {
  const partes = PASTAS_AGENTES_POR_CLI[cli];
  if (!partes) throw new ErroGravarAgente(`${MSG_SEM_PASTA_AGENTES}: ${cli}`);
  if (pastaBase.trim() === '') throw new ErroGravarAgente(MSG_SEM_PASTA_BASE);
  return path.join(pastaBase, ...partes);
}

/**
 * Monta o caminho final do arquivo e garante que ele fica dentro da pasta de agentes.
 * @param {string} pastaAgentes - Pasta de agentes do CLI.
 * @param {string} nome - Nome já validado.
 * @returns {string} Caminho do `<nome>.md`.
 * @throws {ErroGravarAgente} Se o caminho resolvido escapar da pasta.
 */
function montarCaminhoAgente(pastaAgentes: string, nome: string): string {
  const caminho = path.join(pastaAgentes, `${nome}${EXTENSAO_AGENTE}`);
  const relativo = path.relative(path.resolve(pastaAgentes), path.resolve(caminho));
  const dentro = relativo !== '' && !relativo.startsWith('..') && !path.isAbsolute(relativo);
  if (!dentro) throw new ErroGravarAgente(MSG_PATH_TRAVERSAL);
  return caminho;
}

/**
 * Grava via arquivo temporário e renomeia; apaga o temporário se algo falhar.
 * @param {string} caminho - Caminho final do `.md`.
 * @param {string} conteudo - Texto do agente.
 * @param {ArquivosAgentes} arquivos - Acesso a arquivos.
 * @returns {Promise<void>} Resolve ao terminar a gravação.
 */
async function gravarComTemporario(
  caminho: string,
  conteudo: string,
  arquivos: ArquivosAgentes,
): Promise<void> {
  const temporario = `${caminho}${EXTENSAO_TEMPORARIA}`;
  try {
    await arquivos.gravarTexto(temporario, conteudo);
    await arquivos.renomear(temporario, caminho);
  } catch (erro) {
    await arquivos.remover(temporario).catch(() => undefined);
    throw erro;
  }
}

/**
 * Grava o agente na pasta de agentes do CLI, sem sair dela.
 * @param {PedidoGravarAgente} pedido - Agente, CLI de destino e pasta base.
 * @param {DependenciasGravarAgente} dependencias - Acesso a arquivos injetado.
 * @returns {Promise<string>} Caminho do arquivo gravado.
 * @throws {ErroGravarAgente} Se o CLI não tiver pasta de agentes, o nome for inválido, o caminho
 *   escapar da pasta ou o conteúdo passar de 10 MB.
 */
export async function gravarAgente(
  pedido: PedidoGravarAgente,
  dependencias: DependenciasGravarAgente,
): Promise<string> {
  const nome = validarNomeArquivoAgente(pedido.agente.frontmatter.name);
  const pastaAgentes = obterPastaAgentes(pedido.cli, pedido.pastaBase);
  const caminho = montarCaminhoAgente(pastaAgentes, nome);

  const conteudo = gerarAgente(pedido.agente);
  if (Buffer.byteLength(conteudo, 'utf8') > LIMITE_ARQUIVO_AGENTE_BYTES) {
    throw new ErroGravarAgente(MSG_ARQUIVO_GRANDE);
  }

  await dependencias.arquivos.criarPasta(pastaAgentes);
  await gravarComTemporario(caminho, conteudo, dependencias.arquivos);
  return caminho;
}
