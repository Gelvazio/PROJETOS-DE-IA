/**
 * Leitura e gravação segura de arquivos JSON, como o `storage::local` do original
 * (`docs/inventario/arquivos-locais.md`, "Regras de gravação"): grava em `<arquivo>.json.tmp` e
 * renomeia por cima (se o rename falhar, grava direto); lê com valor padrão quando o arquivo
 * falta e recupera pelo `.tmp` quando o principal falta ou está quebrado.
 *
 * O sistema de arquivos é injetável (`SistemaArquivos`). O `aparelho.ts` e o
 * `registro-cliente.ts` ainda têm cópias próprias de leitura e gravação; unificar com este
 * módulo fica para depois.
 */

import { mkdir, open, readFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';

import { INDENTACAO_JSON } from '../../compartilhado/constantes';
import { obterCaminhoTemporario } from './caminhos';

const CODIFICACAO_ARQUIVO = 'utf-8';
const CODIGO_ARQUIVO_INEXISTENTE = 'ENOENT';
const FLAG_GRAVAR_NOVO = 'w';

/** Operações de arquivo usadas pelo armazenamento (trocável por um falso). */
export interface SistemaArquivos {
  /** Lê o arquivo como texto; devolve null se ele não existir. */
  lerTexto(caminho: string): Promise<string | null>;
  /** Grava o texto e força a escrita em disco (fsync) antes de fechar. */
  gravarTexto(caminho: string, conteudo: string): Promise<void>;
  /** Renomeia por cima do destino. */
  renomear(origem: string, destino: string): Promise<void>;
  /** Cria a pasta e as pais, se faltarem. */
  criarPasta(caminho: string): Promise<void>;
  /** Apaga o arquivo; não dá erro se ele não existir. */
  remover(caminho: string): Promise<void>;
}

/** Erro de leitura ou gravação de JSON, com o caminho do arquivo. */
export class ErroArquivoJson extends Error {
  readonly caminho: string;

  /**
   * @param {string} mensagem - O que deu errado.
   * @param {string} caminho - Arquivo envolvido.
   */
  constructor(mensagem: string, caminho: string) {
    super(`${mensagem}: ${caminho}`);
    this.name = 'ErroArquivoJson';
    this.caminho = caminho;
  }
}

/**
 * Diz se o erro do Node é "arquivo não existe".
 * @param {unknown} erro - Erro capturado.
 * @returns {boolean} true para ENOENT.
 */
function ehArquivoInexistente(erro: unknown): boolean {
  return (erro as NodeJS.ErrnoException | undefined)?.code === CODIGO_ARQUIVO_INEXISTENTE;
}

/**
 * Cria o acesso a arquivos usando `node:fs/promises`.
 * @returns {SistemaArquivos} Implementação padrão, com fsync na gravação.
 */
export function criarSistemaArquivosNode(): SistemaArquivos {
  return {
    async lerTexto(caminho) {
      try {
        return await readFile(caminho, CODIFICACAO_ARQUIVO);
      } catch (erro) {
        if (ehArquivoInexistente(erro)) return null;
        throw erro;
      }
    },
    async gravarTexto(caminho, conteudo) {
      const arquivo = await open(caminho, FLAG_GRAVAR_NOVO);
      try {
        await arquivo.writeFile(conteudo, CODIFICACAO_ARQUIVO);
        await arquivo.sync();
      } finally {
        await arquivo.close();
      }
    },
    async renomear(origem, destino) {
      await rename(origem, destino);
    },
    async criarPasta(caminho) {
      await mkdir(caminho, { recursive: true });
    },
    async remover(caminho) {
      await rm(caminho, { force: true });
    },
  };
}

/**
 * Lê e interpreta um arquivo JSON.
 * @param {string} caminho - Arquivo a ler.
 * @param {SistemaArquivos} arquivos - Acesso a arquivos.
 * @returns {Promise<{ valor: T } | 'ausente' | 'invalido'>} O valor lido, ou o motivo de não
 *   haver valor.
 */
async function tentarLerJson<T>(
  caminho: string,
  arquivos: SistemaArquivos,
): Promise<{ valor: T } | 'ausente' | 'invalido'> {
  const texto = await arquivos.lerTexto(caminho);
  if (texto === null) return 'ausente';

  try {
    return { valor: JSON.parse(texto) as T };
  } catch {
    return 'invalido';
  }
}

/**
 * Restaura o principal a partir do `.tmp` bom; falhar ao restaurar não impede o uso do valor.
 * @param {string} caminho - Arquivo principal.
 * @param {SistemaArquivos} arquivos - Acesso a arquivos.
 * @returns {Promise<void>} Resolve ao terminar a tentativa.
 */
async function restaurarDoTemporario(
  caminho: string,
  arquivos: SistemaArquivos,
): Promise<void> {
  try {
    await arquivos.renomear(obterCaminhoTemporario(caminho), caminho);
  } catch {
    // O valor já foi lido do .tmp; o principal será refeito na próxima gravação.
  }
}

/**
 * Lê um arquivo JSON local com valor padrão e recuperação pelo `.tmp`.
 * - Principal bom: devolve o valor.
 * - Principal ausente ou quebrado e `.tmp` bom: devolve o do `.tmp` e restaura o principal.
 * - Os dois ausentes: devolve `valorPadrao`.
 * @param {string} caminho - Arquivo principal.
 * @param {T} valorPadrao - Valor devolvido quando não há arquivo nenhum.
 * @param {SistemaArquivos} arquivos - Acesso a arquivos (padrão: `node:fs`).
 * @returns {Promise<T>} Conteúdo do arquivo, ou o padrão.
 * @throws {ErroArquivoJson} Se o principal estiver quebrado e não houver `.tmp` bom, ou se só o
 *   `.tmp` existir e estiver quebrado (o arquivo não é apagado nem sobrescrito).
 */
export async function lerJson<T>(
  caminho: string,
  valorPadrao: T,
  arquivos: SistemaArquivos = criarSistemaArquivosNode(),
): Promise<T> {
  const principal = await tentarLerJson<T>(caminho, arquivos);
  if (typeof principal === 'object') return principal.valor;

  const temporario = await tentarLerJson<T>(obterCaminhoTemporario(caminho), arquivos);
  if (typeof temporario === 'object') {
    await restaurarDoTemporario(caminho, arquivos);
    return temporario.valor;
  }

  const algumArquivoQuebrado = principal === 'invalido' || temporario === 'invalido';
  if (algumArquivoQuebrado) throw new ErroArquivoJson('JSON inválido e sem cópia boa', caminho);
  return valorPadrao;
}

/**
 * Grava um arquivo JSON de forma atômica: cria a pasta, grava `<arquivo>.json.tmp` (identado, com
 * fsync) e renomeia por cima. Se o rename falhar, grava direto no principal e apaga o `.tmp`.
 * @param {string} caminho - Arquivo principal.
 * @param {T} dados - Valor a gravar (precisa ser serializável em JSON).
 * @param {SistemaArquivos} arquivos - Acesso a arquivos (padrão: `node:fs`).
 * @returns {Promise<void>} Resolve quando o arquivo estiver gravado.
 * @throws {ErroArquivoJson} Se o valor não puder virar JSON ou a gravação falhar.
 */
export async function gravarJson<T>(
  caminho: string,
  dados: T,
  arquivos: SistemaArquivos = criarSistemaArquivosNode(),
): Promise<void> {
  const texto = JSON.stringify(dados, null, INDENTACAO_JSON);
  if (texto === undefined) throw new ErroArquivoJson('Valor não serializável em JSON', caminho);

  const temporario = obterCaminhoTemporario(caminho);
  try {
    await arquivos.criarPasta(path.dirname(caminho));
    await arquivos.gravarTexto(temporario, texto);
  } catch (erro) {
    throw new ErroArquivoJson(`Falha ao gravar (${(erro as Error).message})`, caminho);
  }

  try {
    await arquivos.renomear(temporario, caminho);
  } catch {
    // Rename atômico falhou (ex.: antivírus segurando o arquivo): grava direto, como o original.
    await arquivos.gravarTexto(caminho, texto);
    await arquivos.remover(temporario);
  }
}
