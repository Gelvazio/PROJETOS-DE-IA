// Quadro kanban das subtarefas: uma coluna por status, cartões com os dados de cada tarefa.
// Sem Three.js: só DOM. Os textos são escritos com textContent (nada vem como HTML).

const COLUNAS = Object.freeze([
  { status: 'pendente', titulo: 'Pendente' },
  { status: 'progresso', titulo: 'Em progresso' },
  { status: 'aguardando', titulo: 'Aguardando você' },
  { status: 'bloqueado', titulo: 'Bloqueado' },
  { status: 'concluido', titulo: 'Concluído' },
]);
const NIVEL_SEM_VALOR = '';

function criarTexto(etiqueta, classe, texto) {
  const elemento = document.createElement(etiqueta);
  elemento.className = classe;
  elemento.textContent = texto;
  return elemento;
}

/**
 * Monta a barra de progresso de um cartão, ou null se a tarefa não informa progresso.
 * @param {number|null} progresso - Porcentagem de 0 a 100.
 * @returns {HTMLElement|null} Barra pronta ou null.
 */
function montarProgresso(progresso) {
  if (progresso === null || progresso === undefined) return null;
  const barra = document.createElement('div');
  barra.className = 'kanban__progresso';
  const preenchimento = document.createElement('div');
  preenchimento.style.width = `${Math.min(progresso, 100)}%`;
  barra.append(preenchimento);
  return barra;
}

/**
 * Monta o cartão de uma subtarefa.
 * @param {object} tarefa - Tarefa do quadro (campos de lerQuadro()).
 * @returns {HTMLElement} Cartão pronto.
 */
export function montarCartao(tarefa) {
  const cartao = document.createElement('article');
  cartao.className = 'kanban__cartao';
  cartao.dataset.tarefa = tarefa.tarefa;
  cartao.append(criarTexto('h3', 'kanban__id', tarefa.tarefa));
  cartao.append(criarTexto('p', 'kanban__titulo', tarefa.titulo || '(sem título)'));

  const nivel = tarefa.nivel || NIVEL_SEM_VALOR;
  const agente = tarefa.agente || 'livre';
  cartao.append(criarTexto('p', 'kanban__detalhe', `${nivel} · ${agente}`.trim()));
  if (tarefa.desde) cartao.append(criarTexto('p', 'kanban__detalhe', `desde ${tarefa.desde}`));

  const progresso = montarProgresso(tarefa.progresso);
  if (progresso) cartao.append(progresso);
  return cartao;
}

/**
 * Monta uma coluna com o título e a lista de cartões do status.
 * @param {{status: string, titulo: string}} coluna - Configuração da coluna.
 * @param {object[]} tarefasDaColuna - Subtarefas com esse status.
 * @returns {HTMLElement} Coluna pronta.
 */
function montarColuna(coluna, tarefasDaColuna) {
  const secao = document.createElement('section');
  secao.className = `kanban__coluna kanban__coluna--${coluna.status}`;
  const cabecalho = document.createElement('h2');
  cabecalho.className = 'kanban__cabecalho';
  cabecalho.textContent = `${coluna.titulo} (${tarefasDaColuna.length})`;
  const lista = document.createElement('div');
  lista.className = 'kanban__cartoes';
  lista.replaceChildren(...tarefasDaColuna.map(montarCartao));
  secao.append(cabecalho, lista);
  return secao;
}

/**
 * Agrupa as subtarefas (sem as tarefas-mãe) por status.
 * @param {object[]} tarefas - Tarefas do quadro.
 * @returns {Map<string, object[]>} status → tarefas.
 */
export function agruparPorStatus(tarefas) {
  const grupos = new Map(COLUNAS.map((coluna) => [coluna.status, []]));
  for (const tarefa of tarefas) {
    if (tarefa.mae) continue;
    grupos.get(tarefa.status)?.push(tarefa);
  }
  return grupos;
}

/**
 * Cria o quadro kanban dentro do conteiner e devolve a função que o redesenha.
 * @param {HTMLElement} conteiner - Elemento que recebe as colunas.
 * @returns {{atualizar: function(object[]): void}} Controle do quadro.
 */
export function criarKanban(conteiner) {
  return {
    atualizar(tarefas) {
      const grupos = agruparPorStatus(tarefas);
      conteiner.replaceChildren(
        ...COLUNAS.map((coluna) => montarColuna(coluna, grupos.get(coluna.status) ?? [])),
      );
    },
  };
}
