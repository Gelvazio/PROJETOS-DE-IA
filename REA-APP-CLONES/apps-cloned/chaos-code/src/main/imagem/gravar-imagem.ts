/**
 * Grava no disco, na pasta do projeto, a imagem gerada localmente pelo Gemini
 * (`ImagemGeradaGemini`, CLONE.11.2). O original não revela o nome da subpasta local das imagens
 * (inventário `imagem-atualizador.md`, "Pasta de saída"); o clone usa `images` dentro da pasta
 * do projeto (`projects\<id>\images`). A gravação é atômica (temporário + renomear), o nome do
 * arquivo é validado para nunca sair da pasta do projeto e o acesso a arquivos é injetado.
 */

import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  obterCaminhoTemporario,
  obterPastaProjeto,
  validarId,
} from '../armazenamento/caminhos';
import type { ImagemGeradaGemini } from './gemini-imagem';

/** Nome da subpasta das imagens dentro da pasta do projeto (escolha do clone, não confirmada). */
export const NOME_PASTA_IMAGENS = 'images';

const PREFIXO_NOME_PADRAO = 'imagem';
const REGEX_NOME_ARQUIVO = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;
const REGEX_BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;
const TAMANHO_SUFIXO_ALEATORIO = 6;
const BASE_SUFIXO_ALEATORIO = 36;
const EXTENSOES_POR_MIME: Readonly<Record<string, string>> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};
const MSG_ID_PROJETO = 'ID de projeto inválido para gravar a imagem';
const MSG_NOME_INVALIDO = 'Nome de arquivo de imagem inválido';
const MSG_MIME_NAO_SUPORTADO = 'Tipo de imagem não suportado';
const MSG_BASE64_INVALIDO = 'Conteúdo da imagem (base64) vazio ou inválido';
const MSG_FORA_DA_PASTA = 'O arquivo ficaria fora da pasta de imagens do projeto';

/** Acesso ao disco usado na gravação. */
export interface ArquivosGravacaoImagem {
  /** Cria a pasta (e as de cima), sem erro se já existir. */
  criarPasta(caminho: string): Promise<void>;
  /** Grava os bytes no caminho. */
  gravar(caminho: string, conteudo: Uint8Array): Promise<void>;
  /** Renomeia o temporário para o nome final. */
  renomear(origem: string, destino: string): Promise<void>;
}

/** Dependências injetadas na gravação. */
export interface DependenciasGravacaoImagem {
  arquivos: ArquivosGravacaoImagem;
  /** Data atual (padrão: `new Date()`). */
  agora?: () => Date;
  /** Sufixo aleatório curto para nomes automáticos (padrão: `Math.random`). */
  gerarSufixo?: () => string;
}

/** Pedido de gravação. */
export interface PedidoGravarImagem {
  /** Pasta de dados (veja `obterPastaDados`). */
  pastaDados: string;
  /** ID do projeto dono da imagem. */
  idProjeto: string;
  /** Imagem devolvida por `gerarImagemGemini`. */
  imagem: ImagemGeradaGemini;
  /** Nome do arquivo com extensão; sem valor, o nome é gerado. */
  nomeArquivo?: string;
}

/** Imagem gravada. */
export interface ImagemGravada {
  caminho: string;
  nomeArquivo: string;
  mimeType: string;
  tamanhoBytes: number;
}

/**
 * Cria as dependências reais, com `node:fs/promises`.
 * @returns {DependenciasGravacaoImagem} Dependências padrão.
 */
export function criarDependenciasGravacaoNode(): DependenciasGravacaoImagem {
  return {
    arquivos: {
      async criarPasta(caminho) {
        await mkdir(caminho, { recursive: true });
      },
      gravar: (caminho, conteudo) => writeFile(caminho, conteudo),
      renomear: (origem, destino) => rename(origem, destino),
    },
  };
}

/**
 * Valida um nome de arquivo: só letras, números, `.`, `_` e `-`, sem começar por ponto.
 * @param {string} nome - Nome informado.
 * @returns {string} O próprio nome.
 * @throws {Error} Se o nome tiver separador de pasta, `..` ou caracteres não permitidos.
 */
export function validarNomeArquivoImagem(nome: string): string {
  const valido = REGEX_NOME_ARQUIVO.test(nome) && !nome.includes('..');
  if (!valido) throw new Error(`${MSG_NOME_INVALIDO}: "${nome}"`);
  return nome;
}

/**
 * Descobre a extensão pelo tipo da imagem.
 * @param {string} mimeType - Ex.: `image/png`.
 * @returns {string} Extensão com ponto.
 * @throws {Error} Se o tipo não for de uma imagem conhecida.
 */
function obterExtensao(mimeType: string): string {
  const extensao = EXTENSOES_POR_MIME[mimeType.toLowerCase().split(';')[0].trim()];
  if (!extensao) throw new Error(`${MSG_MIME_NAO_SUPORTADO}: ${mimeType}`);
  return extensao;
}

/**
 * Decodifica o base64 da imagem.
 * @param {string} base64 - Conteúdo em base64.
 * @returns {Buffer} Bytes da imagem.
 * @throws {Error} Se estiver vazio ou com caracteres fora do base64.
 */
function decodificarBase64(base64: string): Buffer {
  const limpo = base64.replace(/\s+/g, '');
  if (!REGEX_BASE64.test(limpo)) throw new Error(MSG_BASE64_INVALIDO);
  const bytes = Buffer.from(limpo, 'base64');
  if (bytes.length === 0) throw new Error(MSG_BASE64_INVALIDO);
  return bytes;
}

/**
 * Gera o nome automático: `imagem-AAAAMMDD-HHMMSS-<sufixo><extensão>`.
 * @param {string} extensao - Extensão com ponto.
 * @param {DependenciasGravacaoImagem} dependencias - Relógio e sufixo injetáveis.
 * @returns {string} Nome do arquivo.
 */
function gerarNomeAutomatico(extensao: string, dependencias: DependenciasGravacaoImagem): string {
  const agora = (dependencias.agora ?? (() => new Date()))();
  const carimbo = agora.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
  const sufixo =
    dependencias.gerarSufixo?.() ??
    Math.random().toString(BASE_SUFIXO_ALEATORIO).slice(2, 2 + TAMANHO_SUFIXO_ALEATORIO);
  return `${PREFIXO_NOME_PADRAO}-${carimbo}-${sufixo}${extensao}`;
}

/**
 * Garante que o destino está dentro da pasta de imagens do projeto.
 * @param {string} pastaImagens - Pasta de imagens do projeto.
 * @param {string} destino - Caminho final do arquivo.
 * @throws {Error} Se o destino sair da pasta.
 */
function garantirDentroDaPasta(pastaImagens: string, destino: string): void {
  const relativo = path.relative(pastaImagens, destino);
  const saiu = relativo === '' || relativo.startsWith('..') || path.isAbsolute(relativo);
  if (saiu) throw new Error(MSG_FORA_DA_PASTA);
}

/**
 * Grava a imagem em `projects\<idProjeto>\images\<nome>`.
 * @param {PedidoGravarImagem} pedido - Pasta de dados, projeto, imagem e nome opcional.
 * @param {DependenciasGravacaoImagem} dependencias - Disco, relógio e sufixo (padrão: reais).
 * @returns {Promise<ImagemGravada>} Caminho e tamanho do arquivo gravado.
 * @throws {Error} Se o ID, o nome, o tipo ou o base64 forem inválidos, ou a escrita falhar.
 */
export async function gravarImagemNoProjeto(
  pedido: PedidoGravarImagem,
  dependencias: DependenciasGravacaoImagem = criarDependenciasGravacaoNode(),
): Promise<ImagemGravada> {
  try {
    validarId(pedido.idProjeto);
  } catch {
    throw new Error(MSG_ID_PROJETO);
  }
  const extensao = obterExtensao(pedido.imagem.mimeType);
  const bytes = decodificarBase64(pedido.imagem.base64);
  const nomeArquivo = validarNomeArquivoImagem(
    pedido.nomeArquivo ?? gerarNomeAutomatico(extensao, dependencias),
  );

  const pastaProjeto = obterPastaProjeto(pedido.pastaDados, pedido.idProjeto);
  const pastaImagens = path.join(pastaProjeto, NOME_PASTA_IMAGENS);
  const caminho = path.join(pastaImagens, nomeArquivo);
  garantirDentroDaPasta(pastaImagens, caminho);

  const temporario = obterCaminhoTemporario(caminho);
  await dependencias.arquivos.criarPasta(pastaImagens);
  await dependencias.arquivos.gravar(temporario, bytes);
  await dependencias.arquivos.renomear(temporario, caminho);
  return { caminho, nomeArquivo, mimeType: pedido.imagem.mimeType, tamanhoBytes: bytes.length };
}
