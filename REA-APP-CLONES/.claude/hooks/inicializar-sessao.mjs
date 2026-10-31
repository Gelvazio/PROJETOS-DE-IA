// .claude/hooks/inicializar-sessao.mjs — hook SessionStart do Claude Code.
// Lê o quadro (tasks/STATUS.md + tasks/task_complete.md), acha as subtarefas livres do nível do
// modelo da sessão (matriz da skill classificar-tarefa) e põe no contexto a lista e a ordem de
// reservar e começar a primeira (ETAPA-008). Roda depois do sincronizar-main.sh, para ler o
// quadro já atualizado. Nunca bloqueia: termina sempre com código 0. Node, sem dependências.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const CODIGO_SAIDA = 0;
const CAMINHO_QUADRO = join('tasks', 'STATUS.md');
const CAMINHO_CONCLUIDAS = join('tasks', 'task_complete.md');
const PREFIXO = '[hook inicializar-sessao]';
const LIMITE_LISTA = 8;
const COLUNA = {
  tarefa: 'Tarefa', titulo: 'Título', prioridade: 'Prioridade', modelo: 'Modelo',
  dependencias: 'Depende de', status: 'Status', emUsoPor: 'Em uso por',
};
const MARCA_PENDENTE = '⬜';
const MARCA_CONCLUIDA = '✅';
const MARCA_EM_EXECUCAO = '🔄';
const MARCA_TRAVA = '🔒';
const MARCA_LIVRE = '—';
const MARCA_PRIORIDADE_BAIXA = '🟢';
const SEM_DEPENDENCIA = 'Nenhuma';
const SEPARADOR_INTERVALO = ' a ';
const ORDEM_PRIORIDADE = ['🔴', '🟠', '🟡'];
const ORDEM_NIVEIS = ['LEVE', 'MEDIO', 'PESADO'];
const NIVEL_POR_FAMILIA = { haiku: 'LEVE', sonnet: 'MEDIO', opus: 'PESADO', fable: 'PESADO' };
const EXPRESSAO_MODELO = /(haiku|sonnet|opus|fable)[-_ ]?(\d+)?(?:[-_.](\d+))?/i;

/**
 * Lê todo o stdin (o Claude Code manda o evento do hook em JSON).
 * @returns {Promise<string>} Texto recebido.
 */
async function lerEntrada() {
  const pedacos = [];
  for await (const pedaco of process.stdin) pedacos.push(pedaco);
  return Buffer.concat(pedacos).toString('utf8');
}

/**
 * Separa uma linha de tabela Markdown em colunas sem espaços nas pontas.
 * @param {string} linha - Linha que começa com "| ".
 * @returns {string[]} Colunas.
 */
function separarColunas(linha) {
  return linha.split('|').slice(1, -1).map((coluna) => coluna.trim());
}

/**
 * Lê as linhas das tabelas de tarefas de um arquivo, achando as colunas pelo título.
 * @param {string} texto - Conteúdo do arquivo.
 * @returns {Array<Record<string, string>>} Uma entrada por linha (título da coluna → valor).
 */
function lerLinhasDeTarefas(texto) {
  const linhas = [];
  let cabecalho = null;
  for (const linha of texto.split(/\r?\n/)) {
    if (linha.startsWith('|---')) continue;
    if (!linha.startsWith('| ')) {
      cabecalho = null;
      continue;
    }
    const colunas = separarColunas(linha);
    const ehCabecalho = colunas.includes(COLUNA.tarefa) && colunas.includes(COLUNA.status);
    if (ehCabecalho) cabecalho = colunas;
    else if (cabecalho) linhas.push(Object.fromEntries(cabecalho.map((t, i) => [t, colunas[i]])));
  }
  return linhas;
}

/**
 * Expande "X.2 a X.10" em X.2, X.3 … X.10 (mesmo prefixo, último número variando).
 * @param {string} inicio - Primeiro código.
 * @param {string} fim - Último código.
 * @returns {string[]} Códigos do intervalo (só os dois, se o formato não bater).
 */
function expandirIntervalo(inicio, fim) {
  const prefixoInicio = inicio.slice(0, inicio.lastIndexOf('.') + 1);
  const prefixoFim = fim.slice(0, fim.lastIndexOf('.') + 1);
  const primeiro = Number(inicio.slice(prefixoInicio.length));
  const ultimo = Number(fim.slice(prefixoFim.length));
  const formatoValido = prefixoInicio === prefixoFim && primeiro <= ultimo;
  if (!formatoValido) return [inicio, fim];

  const quantidade = ultimo - primeiro + 1;
  return Array.from({ length: quantidade }, (_, i) => `${prefixoInicio}${primeiro + i}`);
}

/**
 * Lista os códigos de que uma subtarefa depende.
 * @param {string} texto - Valor da coluna "Depende de".
 * @returns {string[]} Códigos (vazio quando não há dependência).
 */
function listarDependencias(texto) {
  if (!texto || texto === SEM_DEPENDENCIA) return [];
  return texto.split(',').map((parte) => parte.trim()).flatMap((parte) => {
    if (!parte.includes(SEPARADOR_INTERVALO)) return [parte];
    const [inicio, fim] = parte.split(SEPARADOR_INTERVALO).map((codigo) => codigo.trim());
    return expandirIntervalo(inicio, fim);
  });
}

/**
 * Diz se a subtarefa pode ser pega agora (frentes-e-reserva.md).
 * @param {Record<string, string>} linha - Linha do quadro.
 * @param {Set<string>} concluidas - Códigos já concluídos.
 * @returns {boolean} true quando está livre.
 */
function estaLivre(linha, concluidas) {
  const ehSubtarefa = (linha[COLUNA.tarefa] ?? '').includes('.');
  const estaPendente = (linha[COLUNA.status] ?? '').startsWith(MARCA_PENDENTE);
  const semReserva = linha[COLUNA.emUsoPor] === MARCA_LIVRE;
  const semTrava = !(linha[COLUNA.emUsoPor] ?? '').includes(MARCA_TRAVA);
  const prioridadePermitida = !(linha[COLUNA.prioridade] ?? '').startsWith(MARCA_PRIORIDADE_BAIXA);
  if (!(ehSubtarefa && estaPendente && semReserva && semTrava && prioridadePermitida)) return false;

  return listarDependencias(linha[COLUNA.dependencias]).every((codigo) => concluidas.has(codigo));
}

/**
 * Posição da prioridade para ordenar (🔴 primeiro).
 * @param {Record<string, string>} linha - Linha do quadro.
 * @returns {number} Índice da prioridade.
 */
function ordemDaPrioridade(linha) {
  const prioridade = linha[COLUNA.prioridade] ?? '';
  const indice = ORDEM_PRIORIDADE.findIndex((marca) => prioridade.startsWith(marca));
  return indice === -1 ? ORDEM_PRIORIDADE.length : indice;
}

/**
 * Nível da subtarefa, tirado da coluna "Modelo" (`LEVE · Haiku 5.5`).
 * @param {Record<string, string>} linha - Linha do quadro.
 * @returns {string|null} LEVE, MEDIO, PESADO ou null (sem nível, ou feita pelo usuário).
 */
function nivelDaLinha(linha) {
  const nivel = (linha[COLUNA.modelo] ?? '').split('·')[0].trim();
  return ORDEM_NIVEIS.includes(nivel) ? nivel : null;
}

/**
 * Descobre família, nome e nível do modelo da sessão.
 * @param {unknown} modelo - Campo `model` do evento (texto ou objeto com `id`).
 * @returns {{nome: string, nivel: string}|null} Modelo reconhecido, ou null.
 */
function identificarModelo(modelo) {
  const texto = typeof modelo === 'string' ? modelo : (modelo?.id ?? modelo?.display_name ?? '');
  const achado = EXPRESSAO_MODELO.exec(String(texto));
  if (!achado) return null;

  const familia = achado[1].toLowerCase();
  const versao = [achado[2], achado[3]].filter(Boolean).join('.');
  const nome = `${familia[0].toUpperCase()}${familia.slice(1)} ${versao}`.trim();
  return { nome, nivel: NIVEL_POR_FAMILIA[familia] };
}

/**
 * Escolhe as subtarefas do nível do modelo; só se não houver nenhuma livre desse nível, devolve
 * as mais leves (regra global C2: até o máximo do modelo), da mais próxima para a mais leve.
 * @param {Array<Record<string, string>>} livres - Subtarefas livres, já ordenadas.
 * @param {string} nivel - Nível do modelo da sessão.
 * @returns {{lista: Array<Record<string, string>>, ehMaisLeve: boolean}} Subtarefas escolhidas.
 */
function escolherDoNivel(livres, nivel) {
  const posicao = (linha) => ORDEM_NIVEIS.indexOf(nivelDaLinha(linha));
  const doNivel = livres.filter((linha) => nivelDaLinha(linha) === nivel);
  if (doNivel.length) return { lista: doNivel, ehMaisLeve: false };

  const posicaoNivel = ORDEM_NIVEIS.indexOf(nivel);
  const maisLeves = livres
    .filter((linha) => posicao(linha) !== -1 && posicao(linha) < posicaoNivel)
    .sort((a, b) => posicao(b) - posicao(a));
  return { lista: maisLeves, ehMaisLeve: true };
}

/**
 * Formata uma subtarefa numa linha curta.
 * @param {Record<string, string>} linha - Linha do quadro.
 * @returns {string} Texto da linha.
 */
function formatarSubtarefa(linha) {
  return `- ${linha[COLUNA.tarefa]} — ${linha[COLUNA.titulo]} (${linha[COLUNA.modelo]})`;
}

/**
 * Lista as reservas de Claude Code em andamento (podem ser desta sessão, para retomar).
 * @param {Array<Record<string, string>>} abertas - Linhas do STATUS.md.
 * @returns {string[]} Linhas formatadas.
 */
function listarReservasDoClaude(abertas) {
  return abertas
    .filter((linha) => (linha[COLUNA.status] ?? '').startsWith(MARCA_EM_EXECUCAO))
    .filter((linha) => (linha[COLUNA.emUsoPor] ?? '').includes('Claude Code'))
    .map((linha) => `- ${linha[COLUNA.tarefa]} — ${linha[COLUNA.emUsoPor]}`);
}

/**
 * Monta o texto que vai para o contexto da sessão.
 * @param {{modelo: {nome: string, nivel: string}|null, livres: Array<Record<string, string>>,
 *   reservas: string[]}} dados - Modelo da sessão, subtarefas livres e reservas do Claude.
 * @returns {string} Mensagem.
 */
function montarMensagem({ modelo, livres, reservas }) {
  const partes = [];
  if (reservas.length) {
    partes.push(`${PREFIXO} Reservas de Claude Code em andamento (se uma for desta frente, ` +
      'RETOME ela em vez de pegar outra):', ...reservas);
  }
  if (!modelo) {
    partes.push(`${PREFIXO} Modelo da sessão não informado. Subtarefas livres (filtre pelo seu ` +
      'nível na matriz da skill classificar-tarefa):', ...livres.slice(0, LIMITE_LISTA)
      .map(formatarSubtarefa),
    'ORDEM DO USUÁRIO (ETAPA-008): no primeiro pedido desta sessão, mostre a lista e, sem ' +
      'perguntar, reserve a primeira do SEU nível (ou mais leve, só se não houver do seu nível; nunca acima) — ' +
      '(commit lock: + push) e comece.');
    return partes.join('\n');
  }

  const nivel = modelo.nivel;
  const { lista, ehMaisLeve } = escolherDoNivel(livres, nivel);
  if (!lista.length) {
    partes.push(`${PREFIXO} Nenhuma subtarefa livre até o nível ${nivel} para ${modelo.nome}. ` +
      'Avise o usuário no primeiro pedido.');
    return partes.join('\n');
  }
  if (ehMaisLeve) {
    partes.push(`${PREFIXO} Nenhuma livre de nível ${nivel}: ${modelo.nome} pode pegar uma mais ` +
      'leve (regra global C2, até o máximo do modelo).');
  }
  const frente = `Claude Code (${modelo.nome}) (local · main)`;
  partes.push(`${PREFIXO} Modelo da sessão: ${modelo.nome} → nível ${modelo.nivel}. ` +
    `Subtarefas livres ${ehMaisLeve ? 'mais leves' : `de nível ${nivel}`}, na ordem de prioridade:`,
  ...lista.slice(0, LIMITE_LISTA).map(formatarSubtarefa),
  `ORDEM DO USUÁRIO (ETAPA-008): no primeiro pedido desta sessão, mostre esta lista e, sem ` +
    `perguntar, reserve a PRIMEIRA (${lista[0][COLUNA.tarefa]}) como "${frente}" ` +
    '(commit lock: + push, frentes-e-reserva.md), leia a seção dela na etapa e comece. ' +
    'Exceções: retomar reserva desta frente (acima) ou o usuário pedir outra coisa.');
  return partes.join('\n');
}

/**
 * Lê o quadro e devolve a mensagem para o contexto.
 * @param {{model?: unknown, cwd?: string}} evento - Evento SessionStart.
 * @returns {string|null} Mensagem, ou null se não houver quadro.
 */
function analisarQuadro(evento) {
  const pastaProjeto = process.env.CLAUDE_PROJECT_DIR ?? evento.cwd ?? process.cwd();
  const caminhoQuadro = join(pastaProjeto, CAMINHO_QUADRO);
  const caminhoConcluidas = join(pastaProjeto, CAMINHO_CONCLUIDAS);
  if (!existsSync(caminhoQuadro)) return null;

  const abertas = lerLinhasDeTarefas(readFileSync(caminhoQuadro, 'utf8'));
  const temConcluidas = existsSync(caminhoConcluidas);
  const textoConcluidas = temConcluidas ? readFileSync(caminhoConcluidas, 'utf8') : '';
  const concluidas = new Set(lerLinhasDeTarefas(textoConcluidas)
    .filter((linha) => (linha[COLUNA.status] ?? '').startsWith(MARCA_CONCLUIDA))
    .map((linha) => linha[COLUNA.tarefa]));
  const livres = abertas.filter((linha) => estaLivre(linha, concluidas))
    .map((linha, posicao) => ({ linha, posicao }))
    .sort((a, b) => ordemDaPrioridade(a.linha) - ordemDaPrioridade(b.linha)
      || a.posicao - b.posicao)
    .map(({ linha }) => linha);
  const modelo = identificarModelo(evento.model ?? process.env.ANTHROPIC_MODEL);
  return montarMensagem({ modelo, livres, reservas: listarReservasDoClaude(abertas) });
}

/**
 * Ponto de entrada: lê o evento, analisa o quadro e imprime a mensagem.
 * @returns {Promise<number>} Código de saída.
 */
async function principal() {
  const texto = await lerEntrada();
  const evento = texto.trim() ? JSON.parse(texto) : {};
  const mensagem = analisarQuadro(evento);
  if (mensagem) process.stdout.write(mensagem + '\n');
  return CODIGO_SAIDA;
}

try {
  process.exitCode = await principal();
} catch {
  process.exitCode = CODIGO_SAIDA;
}
