// Leitura das regras de .claude/rules/ divididas em seções (porta do leitor_regras.py do
// aulasenai). A lista de arquivos e as categorias vêm do INDEX.md: no navegador não dá para
// listar a pasta, e o índice já lista todas as regras (regra do próprio INDEX.md).

const PASTA_REGRAS = ".claude/rules/";
const ARQUIVO_INDICE = "INDEX.md";
const CATEGORIA_SEM_INDICE = "Outros";
const CATEGORIA_DO_INDICE = "📖 Índice das regras";
const ASSUNTO_DO_INDICE = "Onde está cada regra";
const ORDEM_DO_INDICE = -1;
const TITULO_INTRODUCAO = "Visão geral";
const TAMANHO_MINIMO_INTRODUCAO = 40;
const MINIMO_PROIBICOES_NO_TEXTO = 3;
const MARCA_BLOCO_CODIGO = "```";
const MARCA_SECAO = "## ";

const TIPOS_DE_REGRA = [
  { tipo: "Proibição", padrao: /⛔|❌|\bnunca\b|proibid/giu },
  { tipo: "Fluxo", padrao: /\bfluxo\b|\bciclo\b|\bpasso\b|checklist/giu },
  { tipo: "Referência", padrao: /\bmodelo\b|\bexemplo|\bonde\b|índice|tabela/giu },
];
const TIPO_PADRAO = "Obrigatória";

const PADRAO_GRUPO = /^##\s+(.+)$/;
const PADRAO_ARQUIVO_TABELA = /^\|\s*`([\w./-]+\.md)`\s*\|\s*(.+?)\s*\|/;
const PADRAO_TITULO_ARQUIVO = /^#\s+(.+)$/m;

/**
 * Mapeia cada arquivo de regra listado no INDEX.md para categoria, assunto e ordem.
 * @param {string} textoIndice - Conteúdo do INDEX.md.
 * @returns {Map<string, {categoria: string, assunto: string, ordem: number}>} Arquivos na
 *   ordem do índice.
 */
function lerCategorias(textoIndice) {
  const categorias = new Map();
  let grupoAtual = CATEGORIA_SEM_INDICE;
  for (const linha of textoIndice.split(/\r?\n/)) {
    const achouGrupo = linha.match(PADRAO_GRUPO);
    if (achouGrupo) {
      grupoAtual = achouGrupo[1].trim();
      continue;
    }
    const achouArquivo = linha.match(PADRAO_ARQUIVO_TABELA);
    if (!achouArquivo || categorias.has(achouArquivo[1])) continue;
    categorias.set(achouArquivo[1], {
      categoria: grupoAtual,
      assunto: achouArquivo[2],
      ordem: categorias.size,
    });
  }
  return categorias;
}

/**
 * Tira o título `#` do arquivo e as linhas `---` soltas das pontas do texto.
 * @param {string} corpo - Texto bruto da seção.
 * @returns {string} Texto limpo.
 */
function limparCorpo(corpo) {
  return corpo
    .replace(PADRAO_TITULO_ARQUIVO, "")
    .trim()
    .replace(/^(---\s*)+/, "")
    .trim()
    .replace(/(\s*---)+$/, "")
    .trim();
}

/**
 * Separa as linhas de um Markdown pelos títulos `##` que não estão dentro de bloco de código.
 * @param {string} texto - Conteúdo do arquivo.
 * @returns {{titulo: string, linhas: string[]}[]} Seções brutas (a primeira é a introdução).
 */
function separarLinhasPorSecao(texto) {
  const secoes = [{ titulo: TITULO_INTRODUCAO, linhas: [] }];
  let dentroDeCodigo = false;
  for (const linha of texto.split(/\r?\n/)) {
    if (linha.trim().startsWith(MARCA_BLOCO_CODIGO)) dentroDeCodigo = !dentroDeCodigo;
    const ehTituloDeSecao = !dentroDeCodigo && linha.startsWith(MARCA_SECAO);
    if (ehTituloDeSecao) {
      secoes.push({ titulo: linha.slice(MARCA_SECAO.length).trim(), linhas: [] });
      continue;
    }
    secoes[secoes.length - 1].linhas.push(linha);
  }
  return secoes;
}

/**
 * Divide um Markdown em seções; o trecho antes do primeiro `##` vira "Visão geral" quando
 * tem conteúdo útil.
 * @param {string} texto - Conteúdo do arquivo.
 * @returns {{titulo: string, texto: string}[]} Seções.
 */
function dividirEmSecoes(texto) {
  return separarLinhasPorSecao(texto)
    .map((secao) => ({ titulo: secao.titulo, texto: limparCorpo(secao.linhas.join("\n")) }))
    .filter((secao) => {
      const ehIntroducaoCurta = secao.titulo === TITULO_INTRODUCAO &&
        secao.texto.length < TAMANHO_MINIMO_INTRODUCAO;
      return !ehIntroducaoCurta;
    });
}

/**
 * Escolhe o tipo da regra pelo título; se nada combinar, vira Proibição quando o texto tem
 * várias proibições.
 * @param {string} titulo - Título da seção.
 * @param {string} texto - Corpo da seção.
 * @returns {string} "Proibição", "Fluxo", "Referência" ou "Obrigatória".
 */
function classificarTipo(titulo, texto) {
  const tipoPeloTitulo = TIPOS_DE_REGRA.find((item) => titulo.match(item.padrao));
  if (tipoPeloTitulo) return tipoPeloTitulo.tipo;
  const proibicao = TIPOS_DE_REGRA[0];
  const quantidadeProibicoes = (texto.match(proibicao.padrao) || []).length;
  if (quantidadeProibicoes >= MINIMO_PROIBICOES_NO_TEXTO) return proibicao.tipo;
  return TIPO_PADRAO;
}

/**
 * Lista os arquivos a ler: o próprio índice primeiro e depois os do índice, na ordem dele.
 * @param {Map<string, Object>} categorias - Mapa lido do INDEX.md.
 * @returns {{arquivo: string, categoria: string, assunto: string, ordem: number}[]} Arquivos.
 */
function listarArquivosDeRegras(categorias) {
  const indice = {
    arquivo: ARQUIVO_INDICE,
    categoria: CATEGORIA_DO_INDICE,
    assunto: ASSUNTO_DO_INDICE,
    ordem: ORDEM_DO_INDICE,
  };
  const doIndice = [...categorias].map(([arquivo, info]) => ({ arquivo, ...info }));
  return [indice, ...doIndice.filter((item) => item.arquivo !== ARQUIVO_INDICE)];
}

/**
 * Transforma um arquivo de regra nas seções que o visualizador mostra.
 * @param {{arquivo: string, categoria: string, assunto: string, ordem: number}} info - Arquivo.
 * @param {string} texto - Conteúdo do arquivo.
 * @returns {Object[]} Seções com arquivo, título do arquivo, categoria, assunto, tipo e texto.
 */
function montarSecoesDoArquivo(info, texto) {
  const achouTitulo = texto.match(PADRAO_TITULO_ARQUIVO);
  const tituloArquivo = achouTitulo ? achouTitulo[1].trim() : info.arquivo;
  return dividirEmSecoes(texto).map((secao) => ({
    arquivo: info.arquivo,
    tituloArquivo,
    categoria: info.categoria,
    assunto: info.assunto,
    ordem: info.ordem,
    titulo: secao.titulo,
    tipo: classificarTipo(secao.titulo, secao.texto),
    texto: secao.texto,
  }));
}

/**
 * Lê o INDEX.md e todos os arquivos que ele lista; arquivo que faltar é ignorado.
 * @returns {Promise<Object[]>} Seções de todas as regras, na ordem do índice.
 * @throws {Error} Se o INDEX.md não puder ser lido.
 */
async function lerRegras() {
  const textoIndice = await lerArquivo(PASTA_REGRAS + ARQUIVO_INDICE);
  const arquivos = listarArquivosDeRegras(lerCategorias(textoIndice));
  const textos = await Promise.all(arquivos.map((info) => {
    if (info.arquivo === ARQUIVO_INDICE) return textoIndice;
    return lerArquivoOpcional(PASTA_REGRAS + info.arquivo);
  }));
  const secoes = arquivos.flatMap((info, i) => montarSecoesDoArquivo(info, textos[i]));
  return secoes.sort((primeira, segunda) => primeira.ordem - segunda.ordem);
}
