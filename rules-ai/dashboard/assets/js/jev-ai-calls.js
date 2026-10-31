// Página CHAMADAS JEV AI: lê o chamadas.jsonl do Jev e mostra resumo, filtros e tabela.
// O arquivo só guarda hash do texto, então nenhum texto de mensagem aparece aqui.

const ARQUIVO_CHAMADAS = '../scripts/jev/saidas/chamadas.jsonl';
const SITUACAO_OK = 'ok';
const VALOR_TODOS = '';
const TEXTO_TODOS = 'Todas';
const TEXTO_VAZIO = '—';
const MENSAGEM_FALHA =
  'Não foi possível ler chamadas.jsonl. Sirva a raiz do rules-ai em localhost ' +
  '(python -m http.server 8080) e abra http://localhost:8080/dashboard/JEV-AI-CALLS.html. ' +
  'Não funciona por file:// nem sem o arquivo.';
const COLUNAS = Object.freeze([
  { campo: 'data', titulo: 'Data' },
  { campo: 'acao', titulo: 'Ação' },
  { campo: 'modelo_resposta', titulo: 'Modelo' },
  { campo: 'perguntas', titulo: 'Perguntas' },
  { campo: 'tokens_entrada', titulo: 'Tokens entrada' },
  { campo: 'tokens_saida', titulo: 'Tokens saída' },
  { campo: 'custo_usd', titulo: 'Custo US$' },
  { campo: 'latencia_ms', titulo: 'Latência ms' },
  { campo: 'situacao', titulo: 'Situação' },
  { campo: 'tentativas', titulo: 'Tentativas' },
  { campo: 'erro_codigo', titulo: 'Erro' },
]);

/**
 * Busca um elemento da página pelo id.
 * @param {string} id - Id do elemento.
 * @returns {HTMLElement|null} Elemento encontrado ou null.
 */
const elemento = (id) => document.getElementById(id);

/**
 * Garante um número utilizável na soma.
 * @param {*} valor - Valor lido do registro.
 * @returns {number} O próprio valor se for número finito; senão 0.
 */
const numeroOuZero = (valor) => (Number.isFinite(valor) ? valor : 0);

/**
 * Converte o texto do jsonl em registros, pulando e contando as linhas inválidas.
 * @param {string} texto - Conteúdo do arquivo.
 * @returns {{registros: object[], puladas: number}} Registros válidos e total de puladas.
 */
export function lerRegistros(texto) {
  const registros = [];
  let puladas = 0;
  for (const linha of texto.split('\n')) {
    if (!linha.trim()) continue;
    try {
      const registro = JSON.parse(linha);
      const ehObjeto = registro !== null && typeof registro === 'object';
      if (ehObjeto) registros.push(registro);
      else puladas += 1;
    } catch {
      puladas += 1;
    }
  }
  return { registros, puladas };
}

/**
 * Calcula os totais do resumo.
 * @param {object[]} registros - Chamadas a resumir.
 * @returns {{total: number, custo: number, tokensEntrada: number, tokensSaida: number,
 *   latenciaMedia: number, percentualErro: number}} Resumo.
 */
export function calcularResumo(registros) {
  const total = registros.length;
  const somar = (campo) => registros.reduce((soma, r) => soma + numeroOuZero(r[campo]), 0);
  const comErro = registros.filter((r) => r.situacao !== SITUACAO_OK).length;
  return {
    total,
    custo: somar('custo_usd'),
    tokensEntrada: somar('tokens_entrada'),
    tokensSaida: somar('tokens_saida'),
    latenciaMedia: total ? somar('latencia_ms') / total : 0,
    percentualErro: total ? (comErro / total) * 100 : 0,
  };
}

/**
 * Ordena do mais novo para o mais antigo, sem alterar a lista recebida.
 * @param {object[]} registros - Chamadas.
 * @returns {object[]} Cópia ordenada.
 */
export function ordenarMaisNovas(registros) {
  return [...registros].sort((a, b) => String(b.data).localeCompare(String(a.data)));
}

/**
 * Aplica os filtros de ação e situação ('' = todos).
 * @param {object[]} registros - Chamadas.
 * @param {{acao: string, situacao: string}} filtros - Valores escolhidos.
 * @returns {object[]} Chamadas que passam nos filtros.
 */
export function filtrarRegistros(registros, { acao, situacao }) {
  return registros.filter((r) => {
    const passaAcao = acao === VALOR_TODOS || r.acao === acao;
    const passaSituacao = situacao === VALOR_TODOS || r.situacao === situacao;
    return passaAcao && passaSituacao;
  });
}

/**
 * Formata o valor de uma célula da tabela.
 * @param {string} campo - Nome do campo do registro.
 * @param {*} valor - Valor do campo.
 * @returns {string} Texto a exibir.
 */
function formatarCelula(campo, valor) {
  if (valor === null || valor === undefined || valor === '') return TEXTO_VAZIO;
  if (Array.isArray(valor)) return valor.join(', ');
  if (campo === 'custo_usd') return Number(valor).toFixed(6);
  return String(valor);
}

/**
 * Cria um cartão do resumo.
 * @param {string} titulo - Rótulo do cartão.
 * @param {string} valor - Valor já formatado.
 * @returns {HTMLElement} Cartão.
 */
function criarCartao(titulo, valor) {
  const cartao = document.createElement('article');
  cartao.className = 'resumo__cartao';
  const rotulo = document.createElement('h2');
  rotulo.className = 'resumo__rotulo';
  rotulo.textContent = titulo;
  const numero = document.createElement('p');
  numero.className = 'resumo__valor';
  numero.textContent = valor;
  cartao.append(rotulo, numero);
  return cartao;
}

/**
 * Mostra os cartões do resumo.
 * @param {object[]} registros - Todas as chamadas válidas.
 */
function mostrarResumo(registros) {
  const r = calcularResumo(registros);
  const cartoes = [
    ['Chamadas', String(r.total)],
    ['Custo (US$)', r.custo.toFixed(4)],
    ['Tokens de entrada', String(r.tokensEntrada)],
    ['Tokens de saída', String(r.tokensSaida)],
    ['Latência média (ms)', r.latenciaMedia.toFixed(0)],
    ['Situação ≠ ok', `${r.percentualErro.toFixed(1)}%`],
  ];
  elemento('chamadas-resumo').replaceChildren(...cartoes.map((c) => criarCartao(...c)));
}

/**
 * Cria a linha da tabela de um registro.
 * @param {object} registro - Chamada.
 * @returns {HTMLTableRowElement} Linha.
 */
function criarLinha(registro) {
  const linha = document.createElement('tr');
  for (const { campo } of COLUNAS) {
    const celula = document.createElement('td');
    celula.textContent = formatarCelula(campo, registro[campo]);
    const temFalha = campo === 'situacao' && registro[campo] !== SITUACAO_OK;
    if (temFalha) celula.classList.add('tabela__celula--erro');
    linha.append(celula);
  }
  return linha;
}

/** Mostra o cabeçalho da tabela. */
function mostrarCabecalho() {
  const linha = document.createElement('tr');
  for (const { titulo } of COLUNAS) {
    const celula = document.createElement('th');
    celula.textContent = titulo;
    linha.append(celula);
  }
  elemento('chamadas-cabecalho').replaceChildren(linha);
}

/**
 * Mostra as linhas da tabela, mais novas primeiro, já filtradas.
 * @param {object[]} registros - Todas as chamadas válidas.
 * @param {{acao: string, situacao: string}} filtros - Filtros ativos.
 */
function mostrarTabela(registros, filtros) {
  const filtrados = filtrarRegistros(ordenarMaisNovas(registros), filtros);
  elemento('chamadas-corpo').replaceChildren(...filtrados.map(criarLinha));
}

/**
 * Preenche um select de filtro com os valores distintos de um campo.
 * @param {HTMLSelectElement} select - Select a preencher.
 * @param {object[]} registros - Chamadas.
 * @param {string} campo - Campo de onde vêm as opções.
 */
function preencherFiltro(select, registros, campo) {
  const valores = [...new Set(registros.map((r) => r[campo]).filter(Boolean))].sort();
  const opcoes = [[VALOR_TODOS, TEXTO_TODOS], ...valores.map((v) => [v, v])];
  select.replaceChildren(
    ...opcoes.map(([valor, texto]) => {
      const opcao = document.createElement('option');
      opcao.value = valor;
      opcao.textContent = texto;
      return opcao;
    }),
  );
}

/**
 * Mostra ou esconde um aviso.
 * @param {string} id - Id do parágrafo.
 * @param {string} texto - Texto; vazio esconde.
 */
function mostrarAviso(id, texto) {
  const aviso = elemento(id);
  aviso.textContent = texto;
  aviso.hidden = !texto;
}

/**
 * Monta resumo, filtros, aviso de linhas puladas e tabela.
 * @param {{registros: object[], puladas: number}} dados - Resultado da leitura.
 */
function montarPagina({ registros, puladas }) {
  const filtroAcao = elemento('filtro-acao');
  const filtroSituacao = elemento('filtro-situacao');
  const atualizar = () => mostrarTabela(registros, {
    acao: filtroAcao.value,
    situacao: filtroSituacao.value,
  });
  preencherFiltro(filtroAcao, registros, 'acao');
  preencherFiltro(filtroSituacao, registros, 'situacao');
  filtroAcao.addEventListener('change', atualizar);
  filtroSituacao.addEventListener('change', atualizar);
  const avisoPuladas = `${puladas} linha(s) inválida(s) do chamadas.jsonl foram puladas.`;
  mostrarAviso('chamadas-puladas', puladas ? avisoPuladas : '');
  mostrarResumo(registros);
  mostrarCabecalho();
  atualizar();
}

/** Lê o arquivo e monta a página; em falha, mostra a mensagem de como servir a pasta. */
async function iniciar() {
  try {
    const resposta = await fetch(ARQUIVO_CHAMADAS);
    if (!resposta.ok) throw new Error(String(resposta.status));
    montarPagina(lerRegistros(await resposta.text()));
  } catch {
    mostrarAviso('chamadas-erro', MENSAGEM_FALHA);
  }
}

if (typeof document !== 'undefined') iniciar();
