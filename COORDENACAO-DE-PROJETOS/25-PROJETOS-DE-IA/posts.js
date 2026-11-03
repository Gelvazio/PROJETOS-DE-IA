/**
 * Lê o JSON gerado pelo extrair_site.py e mostra um cartão por post.
 */

/** JSON gerado pelo extrair_site.py, lido direto do repositório no GitHub. */
const URL_POSTS =
  'https://raw.githubusercontent.com/Gelvazio/PROJETOS-DE-IA/main/COORDENACAO-DE-PROJETOS/25-PROJETOS-DE-IA/posts-produtividade.json';
/** Quantidade de caracteres do resumo exibido em cada cartão. */
const TAMANHO_RESUMO = 220;
const TEXTO_SEM_CONTEUDO = 'Conteúdo indisponível.';

/**
 * Busca a lista de posts no arquivo JSON.
 * @returns {Promise<Array<{titulo: string, link: string, conteudo: string|null, erro: string|null}>>}
 * @throws {Error} Quando o arquivo não pode ser lido.
 */
async function buscarPosts() {
  const resposta = await fetch(URL_POSTS);
  if (!resposta.ok) {
    throw new Error(`GitHub respondeu ${resposta.status} para o JSON dos posts`);
  }
  return resposta.json();
}

/**
 * Corta o conteúdo do post para um resumo curto.
 * @param {string|null} conteudo - Texto extraído do post.
 * @returns {string} Resumo pronto para exibir.
 */
function montarResumo(conteudo) {
  if (!conteudo) return TEXTO_SEM_CONTEUDO;
  if (conteudo.length <= TAMANHO_RESUMO) return conteudo;
  return `${conteudo.slice(0, TAMANHO_RESUMO).trimEnd()}…`;
}

/**
 * Cria o cartão de um post. O texto entra com textContent, nunca como HTML.
 * @param {{titulo: string, link: string, conteudo: string|null}} post - Post a exibir.
 * @returns {HTMLElement} Cartão montado.
 */
function criarCartao(post) {
  const cartao = document.createElement('article');
  cartao.className = 'cartao cartao--ciano';

  const titulo = document.createElement('h2');
  titulo.className = 'cartao__titulo';
  titulo.textContent = post.titulo;

  const resumo = document.createElement('p');
  resumo.className = 'cartao__texto';
  resumo.textContent = montarResumo(post.conteudo);

  const acao = document.createElement('a');
  acao.className = 'cartao__acao';
  acao.href = post.link;
  acao.target = '_blank';
  acao.rel = 'noopener';
  acao.textContent = 'Ler post →';

  cartao.append(titulo, resumo, acao);
  return cartao;
}

/**
 * Preenche a grade com um cartão por post e atualiza o total.
 * @param {Array<object>} posts - Posts lidos do JSON.
 * @returns {void}
 */
function renderizarPosts(posts) {
  const grade = document.getElementById('cartoes');
  grade.replaceChildren(...posts.map(criarCartao));
  document.getElementById('total').textContent = `${posts.length} posts`;
}

/**
 * Mostra no topo da página a mensagem de erro.
 * @param {string} mensagem - Texto do aviso.
 * @returns {void}
 */
function mostrarAviso(mensagem) {
  const aviso = document.getElementById('aviso');
  aviso.textContent = mensagem;
  aviso.hidden = false;
}

/**
 * Carrega os posts e mostra o resultado, ou um aviso quando a leitura falha.
 * @returns {Promise<void>}
 */
async function iniciar() {
  try {
    const posts = await buscarPosts();
    renderizarPosts(posts);
  } catch (erro) {
    mostrarAviso(`Não foi possível carregar os posts: ${erro.message}.`);
  }
}

iniciar();
