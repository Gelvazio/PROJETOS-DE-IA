/**
 * Caminhos da pasta de dados (`%LOCALAPPDATA%\chaos-code-v3`) e de cada arquivo local, como o
 * `storage::local` do original (`docs/inventario/arquivos-locais.md`). Funções puras: quem
 * chama informa a pasta base (no Electron, `app.getPath` ou `process.env.LOCALAPPDATA`).
 */

import path from 'node:path';

import {
  ARQUIVO_COMUNIDADES,
  ARQUIVO_CONFIG_ATUALIZACAO,
  ARQUIVO_CONFIG_EMBEDDER,
  ARQUIVO_CONFIG_IMAGEM,
  ARQUIVO_CONFIG_MCP,
  ARQUIVO_CONFIG_RAG,
  ARQUIVO_CONFIG_WSL,
  ARQUIVO_CLIENTE_OAUTH,
  ARQUIVO_ENTIDADES,
  ARQUIVO_GRAFO,
  ARQUIVO_HISTORICO_ATUALIZACAO,
  ARQUIVO_IDENTIFICACAO_APARELHO,
  ARQUIVO_CHAVES_PROVEDORES,
  ARQUIVO_OAUTH_MCP,
  ARQUIVO_PROJETOS,
  ARQUIVO_TOKENS_AUTENTICACAO,
  ARQUIVO_VETORES,
  NOME_PASTA_CONVERSAS,
  NOME_PASTA_DADOS,
  NOME_PASTA_PROJETO_INVALIDO,
  NOME_PASTA_PROJETOS,
  SUFIXO_ARQUIVO_TEMPORARIO,
} from '../../compartilhado/constantes';

/** Pasta usada quando o sistema não informa `LOCALAPPDATA` (reserva do original: `.`). */
const PASTA_BASE_RESERVA = '.';

/** Extensão do arquivo de cada conversa (`<conversation_id>.json`). */
const EXTENSAO_CONVERSA = '.json';

/**
 * Regra do ID de projeto e de conversa. O original recusa caracteres não permitidos, `..` e
 * comprimento fora do limite, mas não revela a lista nem o limite; o clone aceita letras,
 * números, `_` e `-` (cobre UUID e IDs numéricos), de 1 a 128 caracteres.
 */
const REGEX_ID_VALIDO = /^[A-Za-z0-9_-]{1,128}$/;

const MSG_ID_INVALIDO = 'ID inválido: caracteres não permitidos ou comprimento fora do limite';

/** Caminho de cada arquivo que fica direto na pasta de dados. */
export interface CaminhosGlobais {
  projetos: string;
  configMcp: string;
  oauthMcp: string;
  configEmbedder: string;
  configRag: string;
  configImagem: string;
  configAtualizacao: string;
  historicoAtualizacao: string;
  configWsl: string;
  clienteOauth: string;
  tokensAutenticacao: string;
  identificacaoAparelho: string;
  chavesProvedores: string;
}

/** Caminho de cada arquivo que fica na pasta de um projeto. */
export interface CaminhosProjeto {
  pasta: string;
  vetores: string;
  entidades: string;
  grafo: string;
  comunidades: string;
  pastaConversas: string;
}

/**
 * Monta a pasta de dados: `<LOCALAPPDATA>\chaos-code-v3`.
 * @param {string | undefined} pastaLocalAppData - Valor de `LOCALAPPDATA`; vazio usa `.`.
 * @returns {string} Pasta de dados.
 */
export function obterPastaDados(pastaLocalAppData?: string): string {
  const base = pastaLocalAppData ? pastaLocalAppData : PASTA_BASE_RESERVA;
  return path.join(base, NOME_PASTA_DADOS);
}

/**
 * Diz se o ID de projeto ou de conversa pode virar parte de um caminho.
 * @param {string} id - ID a conferir.
 * @returns {boolean} true se tiver só letras, números, `_` ou `-` (1 a 128), sem `..` nem `/`.
 */
export function ehIdValido(id: string): boolean {
  return typeof id === 'string' && REGEX_ID_VALIDO.test(id);
}

/**
 * Garante que o ID é válido.
 * @param {string} id - ID de projeto ou de conversa.
 * @returns {string} O próprio ID.
 * @throws {Error} Se o ID for inválido (tentativa de path traversal, vazio, longo demais...).
 */
export function validarId(id: string): string {
  if (!ehIdValido(id)) throw new Error(MSG_ID_INVALIDO);
  return id;
}

/**
 * Monta o caminho de todos os arquivos da raiz da pasta de dados.
 * @param {string} pastaDados - Pasta de dados (veja `obterPastaDados`).
 * @returns {CaminhosGlobais} Caminhos dos arquivos globais.
 */
export function obterCaminhosGlobais(pastaDados: string): CaminhosGlobais {
  const juntar = (arquivo: string): string => path.join(pastaDados, arquivo);
  return {
    projetos: juntar(ARQUIVO_PROJETOS),
    configMcp: juntar(ARQUIVO_CONFIG_MCP),
    oauthMcp: juntar(ARQUIVO_OAUTH_MCP),
    configEmbedder: juntar(ARQUIVO_CONFIG_EMBEDDER),
    configRag: juntar(ARQUIVO_CONFIG_RAG),
    configImagem: juntar(ARQUIVO_CONFIG_IMAGEM),
    configAtualizacao: juntar(ARQUIVO_CONFIG_ATUALIZACAO),
    historicoAtualizacao: juntar(ARQUIVO_HISTORICO_ATUALIZACAO),
    configWsl: juntar(ARQUIVO_CONFIG_WSL),
    clienteOauth: juntar(ARQUIVO_CLIENTE_OAUTH),
    tokensAutenticacao: juntar(ARQUIVO_TOKENS_AUTENTICACAO),
    identificacaoAparelho: juntar(ARQUIVO_IDENTIFICACAO_APARELHO),
    chavesProvedores: juntar(ARQUIVO_CHAVES_PROVEDORES),
  };
}

/**
 * Monta a pasta de um projeto. Como no original, ID inválido não dá erro: vai para
 * `projects\invalid`.
 * @param {string} pastaDados - Pasta de dados.
 * @param {string} idProjeto - ID do projeto.
 * @returns {string} Pasta do projeto, ou a pasta `invalid` se o ID for inválido.
 */
export function obterPastaProjeto(pastaDados: string, idProjeto: string): string {
  const nomePasta = ehIdValido(idProjeto) ? idProjeto : NOME_PASTA_PROJETO_INVALIDO;
  return path.join(pastaDados, NOME_PASTA_PROJETOS, nomePasta);
}

/**
 * Monta os caminhos dos arquivos de um projeto.
 * @param {string} pastaDados - Pasta de dados.
 * @param {string} idProjeto - ID do projeto (inválido usa a pasta `invalid`).
 * @returns {CaminhosProjeto} Pasta e arquivos do projeto.
 */
export function obterCaminhosProjeto(pastaDados: string, idProjeto: string): CaminhosProjeto {
  const pasta = obterPastaProjeto(pastaDados, idProjeto);
  return {
    pasta,
    vetores: path.join(pasta, ARQUIVO_VETORES),
    entidades: path.join(pasta, ARQUIVO_ENTIDADES),
    grafo: path.join(pasta, ARQUIVO_GRAFO),
    comunidades: path.join(pasta, ARQUIVO_COMUNIDADES),
    pastaConversas: path.join(pasta, NOME_PASTA_CONVERSAS),
  };
}

/**
 * Monta o caminho do arquivo de uma conversa: `projects\<projeto>\conversations\<id>.json`.
 * @param {string} pastaDados - Pasta de dados.
 * @param {string} idProjeto - ID do projeto (inválido usa a pasta `invalid`).
 * @param {string} idConversa - ID da conversa.
 * @returns {string} Caminho do arquivo da conversa.
 * @throws {Error} Se o ID da conversa for inválido.
 */
export function obterCaminhoConversa(
  pastaDados: string,
  idProjeto: string,
  idConversa: string,
): string {
  const { pastaConversas } = obterCaminhosProjeto(pastaDados, idProjeto);
  return path.join(pastaConversas, `${validarId(idConversa)}${EXTENSAO_CONVERSA}`);
}

/**
 * Monta o caminho do arquivo temporário da gravação atômica (`<arquivo>.json.tmp`).
 * @param {string} caminhoArquivo - Caminho do arquivo final.
 * @returns {string} Caminho do temporário.
 */
export function obterCaminhoTemporario(caminhoArquivo: string): string {
  return `${caminhoArquivo}${SUFIXO_ARQUIVO_TEMPORARIO}`;
}
