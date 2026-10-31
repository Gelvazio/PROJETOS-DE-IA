/**
 * Divisor de texto (`SmartChunker` do original, inventário `vetores-grafo.md` §1): quebra um
 * artigo em Markdown por cabeçalhos `#` e parágrafos, respeita o tamanho do pedaço com
 * sobreposição, trunca entradas gigantes e para no máximo de pedaços.
 *
 * Decisões onde o inventário marca *(inferido)*: o tamanho é medido em **caracteres** (o
 * original mede bytes ajustados à fronteira UTF-8); a sobreposição fica **dentro** do pedaço (o
 * texto começa com o final do pedaço anterior) e o pedaço inteiro cabe no tamanho.
 * Só o limite de entrada (10 MiB) é medido em bytes, como no original.
 */

import type { MetadadosPedaco, Pedaco } from '../../compartilhado/tipos-vetores';
import {
  LIMITE_ENTRADA_CHUNKER_BYTES,
  MAXIMO_PEDACOS,
  SOBREPOSICAO_PEDACO,
  TAMANHO_PEDACO,
} from './constantes';

const SEPARADOR_PARAGRAFOS = '\n\n';
const REGEX_CABECALHO = /^#{1,6}\s+(.*?)\s*#*\s*$/;
const REGEX_QUEBRA_PARAGRAFO = /\n\s*\n/;
const MARCADOR_BLOCO_CODIGO = '```';
const CODIGO_CARACTERE_SUBSTITUICAO = 0xfffd;
const CARACTERE_SUBSTITUICAO = String.fromCharCode(CODIGO_CARACTERE_SUBSTITUICAO);
const TAMANHO_SOBREPOSICAO = Math.round(TAMANHO_PEDACO * SOBREPOSICAO_PEDACO);
const SEPARADOR_SOBREPOSICAO = '\n';
const LIMITE_CONTEUDO =
  TAMANHO_PEDACO - TAMANHO_SOBREPOSICAO - SEPARADOR_SOBREPOSICAO.length;
const CODIGO_INICIO_SUBSTITUTO_ALTO = 0xd800;
const CODIGO_FIM_SUBSTITUTO_ALTO = 0xdc00;

/** Dados do artigo a dividir. */
export interface EntradaDivisor {
  /** Texto Markdown do artigo. */
  texto: string;
  /** Título do artigo (vai em `article_title`). */
  tituloArtigo: string;
  /** Identificador do artigo (vai em `article_id`). */
  idArtigo: string;
}

/** Seção do Markdown: o texto sob um cabeçalho (ou antes do primeiro). */
interface Secao {
  titulo: string | null;
  texto: string;
}

/** Trecho de conteúdo já dimensionado, antes de receber a sobreposição. */
interface TrechoBruto {
  titulo: string | null;
  conteudo: string;
}

/**
 * Trunca o texto para no máximo `LIMITE_ENTRADA_CHUNKER_BYTES` bytes em UTF-8.
 * @param {string} texto - Texto de entrada.
 * @returns {string} O próprio texto, ou o início dele sem caractere cortado ao meio.
 */
export function truncarEntrada(texto: string): string {
  const bytes = Buffer.from(texto, 'utf8');
  if (bytes.length <= LIMITE_ENTRADA_CHUNKER_BYTES) return texto;

  const cortado = bytes.subarray(0, LIMITE_ENTRADA_CHUNKER_BYTES).toString('utf8');
  return cortado.endsWith(CARACTERE_SUBSTITUICAO) ? cortado.slice(0, -1) : cortado;
}

/**
 * Divide o Markdown em seções por linhas de cabeçalho `#`, ignorando blocos de código.
 * @param {string} texto - Texto Markdown.
 * @returns {Secao[]} Seções na ordem; o texto antes do 1º cabeçalho tem título null.
 */
export function dividirEmSecoes(texto: string): Secao[] {
  const secoes: Secao[] = [];
  let atual: { titulo: string | null; linhas: string[] } = { titulo: null, linhas: [] };
  let dentroDeCodigo = false;

  const fecharAtual = (): void => {
    secoes.push({ titulo: atual.titulo, texto: atual.linhas.join('\n') });
  };

  for (const linha of texto.split('\n')) {
    if (linha.trimStart().startsWith(MARCADOR_BLOCO_CODIGO)) dentroDeCodigo = !dentroDeCodigo;

    const cabecalho = dentroDeCodigo ? null : REGEX_CABECALHO.exec(linha);
    if (cabecalho) {
      fecharAtual();
      atual = { titulo: cabecalho[1], linhas: [linha] };
    } else {
      atual.linhas.push(linha);
    }
  }
  fecharAtual();
  return secoes;
}

/**
 * Corta um bloco maior que o limite em fatias, sem partir um par substituto (emoji).
 * @param {string} bloco - Bloco longo, sem quebra de parágrafo.
 * @param {number} limite - Tamanho máximo de cada fatia, em caracteres.
 * @returns {string[]} Fatias na ordem.
 */
export function cortarBlocoLongo(bloco: string, limite: number): string[] {
  const fatias: string[] = [];
  let inicio = 0;

  while (inicio < bloco.length) {
    let fim = Math.min(inicio + limite, bloco.length);
    const codigoFinal = bloco.charCodeAt(fim - 1);
    const terminaEmSubstitutoAlto =
      codigoFinal >= CODIGO_INICIO_SUBSTITUTO_ALTO && codigoFinal < CODIGO_FIM_SUBSTITUTO_ALTO;
    const partiriaParSubstituto = fim < bloco.length && terminaEmSubstitutoAlto;
    if (partiriaParSubstituto) fim -= 1;

    fatias.push(bloco.slice(inicio, fim));
    inicio = fim;
  }
  return fatias;
}

/**
 * Agrupa parágrafos em trechos de até `limite` caracteres, unidos por linha em branco.
 * @param {string} textoSecao - Texto de uma seção.
 * @param {number} limite - Tamanho máximo do trecho.
 * @returns {string[]} Trechos não vazios, na ordem.
 */
export function agruparParagrafos(textoSecao: string, limite: number): string[] {
  const paragrafos = textoSecao
    .split(REGEX_QUEBRA_PARAGRAFO)
    .map((paragrafo) => paragrafo.trim())
    .filter((paragrafo) => paragrafo.length > 0)
    .flatMap((paragrafo) => cortarBlocoLongo(paragrafo, limite));

  const trechos: string[] = [];
  let atual = '';
  for (const paragrafo of paragrafos) {
    const junto = atual ? `${atual}${SEPARADOR_PARAGRAFOS}${paragrafo}` : paragrafo;
    if (junto.length <= limite) {
      atual = junto;
    } else {
      trechos.push(atual);
      atual = paragrafo;
    }
  }
  if (atual) trechos.push(atual);
  return trechos;
}

/**
 * Monta os trechos brutos de todas as seções, parando no máximo de pedaços.
 * @param {Secao[]} secoes - Seções do artigo.
 * @returns {TrechoBruto[]} Trechos com o título da seção, no máximo `MAXIMO_PEDACOS`.
 */
function montarTrechosBrutos(secoes: Secao[]): TrechoBruto[] {
  const trechos: TrechoBruto[] = [];
  for (const secao of secoes) {
    for (const conteudo of agruparParagrafos(secao.texto, LIMITE_CONTEUDO)) {
      if (trechos.length >= MAXIMO_PEDACOS) return trechos;
      trechos.push({ titulo: secao.titulo, conteudo });
    }
  }
  return trechos;
}

/**
 * Cria o pedaço de um trecho, com a sobreposição do vizinho anterior e os metadados.
 * @param {TrechoBruto[]} trechos - Todos os trechos do artigo.
 * @param {number} indice - Posição do trecho a transformar.
 * @param {EntradaDivisor} entrada - Dados do artigo (título e id).
 * @returns {Pedaco} Pedaço com texto (sobreposição + conteúdo) e `ChunkMetadata`.
 */
function criarPedaco(trechos: TrechoBruto[], indice: number, entrada: EntradaDivisor): Pedaco {
  const { titulo, conteudo } = trechos[indice];
  const anterior = indice > 0 ? trechos[indice - 1].conteudo : '';
  const sobreposicaoAnterior = anterior ? anterior.slice(-TAMANHO_SOBREPOSICAO) : null;
  const temProximo = indice < trechos.length - 1;

  const metadata: MetadadosPedaco = {
    chunk_index: indice,
    section_title: titulo,
    article_title: entrada.tituloArtigo,
    overlap_with_prev: sobreposicaoAnterior,
    overlap_with_next: temProximo ? conteudo.slice(-TAMANHO_SOBREPOSICAO) : null,
    article_id: entrada.idArtigo,
  };
  const prefixo = sobreposicaoAnterior ? sobreposicaoAnterior + SEPARADOR_SOBREPOSICAO : '';
  const texto = prefixo + conteudo;
  return { texto, metadata };
}

/**
 * Divide um artigo Markdown em pedaços prontos para embedding.
 * @param {EntradaDivisor} entrada - Texto, título e id do artigo.
 * @returns {Pedaco[]} Pedaços de até `TAMANHO_PEDACO` caracteres (sobreposição incluída), no
 *   máximo `MAXIMO_PEDACOS`; lista vazia se o texto for vazio.
 */
export function dividirEmPedacos(entrada: EntradaDivisor): Pedaco[] {
  const secoes = dividirEmSecoes(truncarEntrada(entrada.texto));
  const trechos = montarTrechosBrutos(secoes);
  return trechos.map((_, indice) => criarPedaco(trechos, indice, entrada));
}
