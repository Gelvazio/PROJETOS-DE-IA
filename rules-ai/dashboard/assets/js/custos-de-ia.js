// Página CUSTOS DE IA: lê o custos-de-ia.json e mostra, por fornecedor, os modelos e os custos.
// Nenhum preço fica fixo aqui: tudo vem do JSON (páginas oficiais de preços).

/** Relativo à página (dashboard/). */
const ARQUIVO_CUSTOS = 'custos-de-ia.json';
const MENSAGEM_ERRO = 'Não foi possível ler o custos-de-ia.json. Abra a página por um servidor '
  + '(não funciona por file://) e confira se o arquivo existe em dashboard/.';
const TEXTO_SEM_VALOR = '—';
const PREFIXO_LINK_SEGURO = 'https://';
const COLUNAS = Object.freeze([
  { campo: 'nome', titulo: 'Modelo', numerica: false },
  { campo: 'entrada', titulo: 'Entrada', numerica: true },
  { campo: 'saida', titulo: 'Saída', numerica: true },
  { campo: 'cache', titulo: 'Cache', numerica: true },
  { campo: 'observacao', titulo: 'Observação', numerica: false },
]);

/**
 * Busca um elemento da página pelo id.
 * @param {string} id - Id do elemento.
 * @returns {HTMLElement|null} Elemento encontrado ou null.
 */
const elemento = (id) => document.getElementById(id);

/**
 * Cria um elemento com classe e texto (sempre textContent, nunca HTML).
 * @param {string} etiqueta - Nome da tag.
 * @param {string} classe - Classe CSS.
 * @param {string} texto - Texto exibido.
 * @returns {HTMLElement} Elemento criado.
 */
function criar(etiqueta, classe, texto = '') {
  const no = document.createElement(etiqueta);
  if (classe) no.className = classe;
  if (texto) no.textContent = texto;
  return no;
}

/**
 * Formata um preço em dólar; valor ausente vira traço.
 * @param {number|null|undefined} valor - Preço por unidade do JSON.
 * @returns {string} Texto como US$ 0.30 ou o traço.
 */
export function formatarPreco(valor) {
  if (!Number.isFinite(valor)) return TEXTO_SEM_VALOR;
  return `US$ ${valor}`;
}

/**
 * Devolve o texto de uma célula do modelo conforme a coluna.
 * @param {object} modelo - Modelo do JSON.
 * @param {{campo: string, numerica: boolean}} coluna - Coluna da tabela.
 * @returns {string} Texto da célula.
 */
function textoDaCelula(modelo, coluna) {
  const valor = modelo[coluna.campo];
  if (coluna.numerica) return formatarPreco(valor);
  return valor || TEXTO_SEM_VALOR;
}

/**
 * Monta a tabela de modelos de um fornecedor.
 * @param {object[]} modelos - Modelos do fornecedor.
 * @returns {HTMLElement} Div com rolagem horizontal e a tabela.
 */
function montarTabela(modelos) {
  const envoltorio = criar('div', 'tabela-rolagem');
  const tabela = criar('table', 'tabela');
  const cabecalho = tabela.createTHead().insertRow();
  for (const coluna of COLUNAS) {
    cabecalho.appendChild(criar('th', coluna.numerica ? 'tabela__numero' : '', coluna.titulo));
  }
  const corpo = tabela.createTBody();
  for (const modelo of modelos) {
    const linha = corpo.insertRow();
    for (const coluna of COLUNAS) {
      const classe = coluna.numerica ? 'tabela__numero' : '';
      linha.appendChild(criar('td', coluna.campo === 'observacao' ? 'tabela__observacao' : classe,
        textoDaCelula(modelo, coluna)));
    }
  }
  envoltorio.appendChild(tabela);
  return envoltorio;
}

/**
 * Monta a linha de meta do fornecedor (data da coleta e link da fonte oficial).
 * @param {{fonte: string, coletadoEm: string}} fornecedor - Fornecedor do JSON.
 * @returns {HTMLElement} Parágrafo com a meta.
 */
function montarMeta(fornecedor) {
  const coleta = fornecedor.coletadoEm || TEXTO_SEM_VALOR;
  const meta = criar('p', 'fornecedor__meta', `Coletado em ${coleta} · Fonte: `);
  const fonteSegura = typeof fornecedor.fonte === 'string'
    && fornecedor.fonte.startsWith(PREFIXO_LINK_SEGURO);
  if (!fonteSegura) {
    meta.append(TEXTO_SEM_VALOR);
    return meta;
  }
  const link = criar('a', 'fornecedor__fonte', fornecedor.fonte);
  link.href = fornecedor.fonte;
  link.target = '_blank';
  link.rel = 'noopener';
  meta.appendChild(link);
  return meta;
}

/**
 * Monta o cartão de um fornecedor com título, meta e tabela de modelos.
 * @param {object} fornecedor - Fornecedor do JSON.
 * @returns {HTMLElement} Seção do fornecedor.
 */
export function montarFornecedor(fornecedor) {
  const secao = criar('section', `fornecedor fornecedor--${fornecedor.id}`);
  secao.appendChild(criar('h2', 'fornecedor__titulo', fornecedor.nome || fornecedor.id));
  secao.appendChild(montarMeta(fornecedor));
  secao.appendChild(montarTabela(fornecedor.modelos || []));
  return secao;
}

/**
 * Preenche os cartões de resumo (geração, moeda, unidade e total de modelos).
 * @param {object} dados - JSON de custos.
 * @returns {void}
 */
function preencherResumo(dados) {
  const total = dados.fornecedores.reduce((soma, f) => soma + (f.modelos || []).length, 0);
  const itens = [
    ['Gerado em', dados.geradoEm || TEXTO_SEM_VALOR],
    ['Moeda', dados.moeda || TEXTO_SEM_VALOR],
    ['Unidade', dados.unidade || TEXTO_SEM_VALOR],
    ['Modelos', String(total)],
  ];
  const cartoes = itens.map(([rotulo, valor]) => {
    const cartao = criar('div', 'resumo__cartao');
    cartao.appendChild(criar('p', 'resumo__rotulo', rotulo));
    cartao.appendChild(criar('p', 'resumo__valor', valor));
    return cartao;
  });
  elemento('custos-resumo').replaceChildren(...cartoes);
}

/**
 * Mostra a mensagem de erro e esconde o resto.
 * @param {string} mensagem - Texto do erro.
 * @returns {void}
 */
function mostrarErro(mensagem) {
  const aviso = elemento('custos-erro');
  aviso.textContent = mensagem;
  aviso.hidden = false;
}

/**
 * Carrega o JSON e desenha a página.
 * @returns {Promise<void>}
 */
export async function iniciar() {
  try {
    const resposta = await fetch(ARQUIVO_CUSTOS);
    if (!resposta.ok) throw new Error(String(resposta.status));
    const dados = await resposta.json();
    if (!Array.isArray(dados.fornecedores)) throw new Error('sem fornecedores');
    preencherResumo(dados);
    elemento('custos-fornecedores').replaceChildren(...dados.fornecedores.map(montarFornecedor));
  } catch {
    mostrarErro(MENSAGEM_ERRO);
  }
}

if (typeof document !== 'undefined') iniciar();
