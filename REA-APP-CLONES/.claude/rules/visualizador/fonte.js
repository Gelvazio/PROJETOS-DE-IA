// Leitura de um arquivo do repositório pelo caminho a partir da raiz (ex.: "tasks/STATUS.md").
// Ordem: arquivo local (só quando a página é servida por HTTP; com duplo clique o navegador
// bloqueia) → GitHub raw da `main` → jsDelivr da `main`. O repositório é público: não usa token.

// Troque pelo <dono>/<repositório> do projeto criado a partir deste template.
const REPOSITORIO = "Gelvazio/rea-app-clones";
const BRANCH = "main";
const PREFIXO_RAIZ_LOCAL = "../../";
const PROTOCOLO_HTTP = "http";
const FONTES = [
  {
    nome: "arquivos locais",
    montarUrl: (caminho) => PREFIXO_RAIZ_LOCAL + caminho,
    estaDisponivel: paginaServidaPorHttp,
  },
  {
    nome: `GitHub (${BRANCH})`,
    montarUrl: (caminho) => `https://raw.githubusercontent.com/${REPOSITORIO}/${BRANCH}/${caminho}`,
    estaDisponivel: () => true,
  },
  {
    nome: `jsDelivr (${BRANCH})`,
    montarUrl: (caminho) => `https://cdn.jsdelivr.net/gh/${REPOSITORIO}@${BRANCH}/${caminho}`,
    estaDisponivel: () => true,
  },
];

let fonteUsada = "";

/**
 * Diz se a página foi aberta por um servidor (http/https), e não por duplo clique (file://).
 * @returns {boolean} true quando dá para ler os arquivos locais.
 */
function paginaServidaPorHttp() {
  return typeof location !== "undefined" && location.protocol.startsWith(PROTOCOLO_HTTP);
}

/**
 * Busca o texto de uma URL sem usar cache.
 * @param {string} url - Endereço do arquivo.
 * @returns {Promise<string>} Conteúdo do arquivo.
 * @throws {Error} Se a resposta não for de sucesso.
 */
async function buscarTexto(url) {
  const separador = url.includes("?") ? "&" : "?";
  const resposta = await fetch(url + separador + "t=" + Date.now(), { cache: "no-store" });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status} em ${url}`);
  return resposta.text();
}

/**
 * Lê um arquivo do repositório, tentando as fontes em ordem.
 * @param {string} caminho - Caminho a partir da raiz do repositório (ex.: "tasks/STATUS.md").
 * @returns {Promise<string>} Conteúdo do arquivo.
 * @throws {Error} Se nenhuma fonte conseguir ler o arquivo.
 */
async function lerArquivo(caminho) {
  const erros = [];
  for (const fonte of FONTES.filter((item) => item.estaDisponivel())) {
    try {
      const texto = await buscarTexto(fonte.montarUrl(caminho));
      fonteUsada = fonte.nome;
      return texto;
    } catch (erro) {
      erros.push(`${fonte.nome}: ${erro.message}`);
    }
  }
  throw new Error(`não foi possível ler ${caminho} (${erros.join("; ")})`);
}

/**
 * Lê um arquivo opcional: devolve texto vazio se ele não existir em nenhuma fonte.
 * @param {string} caminho - Caminho a partir da raiz do repositório.
 * @returns {Promise<string>} Conteúdo do arquivo ou "".
 */
async function lerArquivoOpcional(caminho) {
  try {
    return await lerArquivo(caminho);
  } catch {
    return "";
  }
}

/**
 * Diz de onde veio o último arquivo lido com sucesso.
 * @returns {string} Nome da fonte (ex.: "GitHub (main)").
 */
function ultimaFonteUsada() {
  return fonteUsada;
}
