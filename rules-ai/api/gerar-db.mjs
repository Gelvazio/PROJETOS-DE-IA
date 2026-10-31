// Gera api/db.json (copia so de leitura) a partir do quadro. Nunca altera o quadro.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gravarSeMudou } from './serializador.mjs';

const PASTA_API = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(PASTA_API, '..');
const CAMINHO_STATUS = join(RAIZ, 'tasks', 'STATUS.md');
const CAMINHO_CONCLUIDAS = join(RAIZ, 'tasks', 'task_complete.md');
const CAMINHO_SAIDA = join(PASTA_API, 'db.json');
const TITULO_TAREFAS = '## 📌 Tarefas';
const TITULO_FRENTES = '## 🧭 Frentes de trabalho';
const COLUNAS_TAREFA = 8;
const COLUNAS_FRENTE = 4;
const CODIGOS_STATUS = [
  ['✅', 'concluido'],
  ['🔄', 'em_execucao'],
  ['⛔', 'bloqueado'],
  ['👀', 'aguardando_usuario'],
  ['❌', 'cancelada'],
  ['⬜', 'pendente'],
];
const CABECALHOS = ['Tarefa', 'Frente'];
const SEM_VALOR = new Set(['', '—', '-']);
const MARCA_PIPE = '\u0000';
const PADRAO_SUB = /\.\d+$/;
const PADRAO_ID_DEPENDENCIA = /^[A-Z][A-Z0-9-]*(\.\d+)?$/;
const PADRAO_NIVEL = /\b(LEVE|MEDIO|PESADO)\b/;
const PADRAO_EFFORT = /effort\s+(\w+)/;
const PADRAO_ETAPA = /\(etapas\/([^)]+\.md)\)/;
const PADRAO_SUFIXO_TITULO = /\s*·\s*`[^`]*`\s*$/;

/**
 * Le um arquivo de texto em UTF-8.
 * @param {string} caminho - Caminho do arquivo.
 * @returns {string} Conteudo do arquivo.
 */
function lerArquivo(caminho) {
  return readFileSync(caminho, 'utf8').replace(/\r\n/g, '\n');
}

/**
 * Divide uma linha de tabela Markdown em celulas (ignora pipes escapados).
 * @param {string} linha - Linha iniciada por "|".
 * @returns {string[]} Celulas sem espacos nas pontas.
 */
function dividirCelulas(linha) {
  const partes = linha.replaceAll('\\|', MARCA_PIPE).split('|');
  return partes.slice(1, -1).map((parte) => parte.replaceAll(MARCA_PIPE, '|').trim());
}

/**
 * Indica se a linha e o cabecalho ("Tarefa", "Frente") ou o separador "---".
 * @param {string[]} celulas - Celulas da linha.
 * @returns {boolean} true se nao for linha de dados.
 */
function ehCabecalhoOuSeparador(celulas) {
  const primeira = celulas[0] || '';
  return /^:?-{3,}:?$/.test(primeira) || CABECALHOS.includes(primeira);
}

/**
 * Extrai as linhas de dados da primeira tabela depois de um titulo.
 * @param {string} texto - Conteudo do arquivo.
 * @param {string|null} titulo - Titulo da secao (null = arquivo todo).
 * @returns {string[][]} Linhas de dados, ja divididas em celulas.
 */
function fatiarTabela(texto, titulo) {
  const inicio = titulo === null ? 0 : texto.indexOf(titulo);
  if (inicio < 0) return [];

  const recorte = texto.slice(inicio + (titulo ? titulo.length : 0));
  const tabela = [];
  for (const linha of recorte.split('\n')) {
    const estaNaTabela = linha.startsWith('|');
    if (!estaNaTabela && tabela.length > 0) break;
    if (estaNaTabela) tabela.push(linha);
  }
  return tabela.map(dividirCelulas).filter((celulas) => !ehCabecalhoOuSeparador(celulas));
}

/**
 * Converte o texto de dependencias em lista de ids.
 * @param {string} texto - Celula "Depende de".
 * @returns {string[]} Ids encontrados.
 */
function extrairDependencias(texto) {
  const limpo = texto.replace(/\*\*|`|\([^)]*\)/g, ' ');
  return limpo.split(/[\s,;/]+/).filter((item) => PADRAO_ID_DEPENDENCIA.test(item));
}

/**
 * Obtem o codigo de status a partir do emoji da coluna.
 * @param {string} status - Texto da coluna Status.
 * @returns {string} Codigo (pendente se nenhum emoji for reconhecido).
 */
function obterStatusCodigo(status) {
  const achado = CODIGOS_STATUS.find(([emoji]) => status.includes(emoji));
  return achado ? achado[1] : 'pendente';
}

/**
 * Primeiro grupo de captura de um padrao, ou null.
 * @param {string} texto - Texto de busca.
 * @param {RegExp} padrao - Padrao com um grupo.
 * @returns {string|null} Valor capturado.
 */
function capturar(texto, padrao) {
  const achado = texto.match(padrao);
  return achado ? achado[1] : null;
}

/**
 * Converte uma linha de tabela em item da colecao tarefas (sem `disponivel`).
 * @param {string[]} celulas - Celulas da linha.
 * @returns {object|null} Item ou null se a linha nao for de tarefa.
 */
function converterLinha(celulas) {
  if (celulas.length < COLUNAS_TAREFA) return null;

  const [tarefa, titulo, prioridade, modelo, depende, status, uso, etapa] = celulas;
  const id = tarefa.replaceAll('**', '').replace(/\s+/g, '');
  if (!id) return null;

  const ehSub = PADRAO_SUB.test(id) && !tarefa.includes('**');
  const textoNivel = `${modelo} ${titulo}`;
  const statusCodigo = obterStatusCodigo(status);
  const estaSemReserva = SEM_VALOR.has(uso) || uso.startsWith('— (');
  return {
    id,
    tipo: ehSub ? 'sub' : 'mae',
    mae: ehSub ? id.replace(PADRAO_SUB, '') : id,
    titulo: titulo.replaceAll('**', '').replace(PADRAO_SUFIXO_TITULO, '').trim(),
    prioridade,
    modelo,
    nivel: capturar(textoNivel, PADRAO_NIVEL),
    effort: capturar(textoNivel, PADRAO_EFFORT),
    dependeDe: extrairDependencias(depende),
    status,
    statusCodigo,
    emUsoPor: estaSemReserva ? null : uso,
    concluida: statusCodigo === 'concluido',
    etapa: capturar(etapa, PADRAO_ETAPA),
  };
}

/**
 * Garante id unico: repetidos recebem sufixo "#N" e um aviso no stderr.
 * @param {object[]} itens - Tarefas na ordem de leitura.
 * @returns {object[]} Os mesmos itens, com ids unicos.
 */
function garantirIdsUnicos(itens) {
  const vistos = new Map();
  for (const item of itens) {
    const vezes = (vistos.get(item.id) || 0) + 1;
    vistos.set(item.id, vezes);
    if (vezes === 1) continue;
    process.stderr.write(`Aviso: id repetido ${item.id}\n`);
    item.id = `${item.id}#${vezes}`;
  }
  return itens;
}

/**
 * Calcula o campo `disponivel` de cada tarefa.
 * @param {object[]} itens - Tarefas convertidas.
 * @returns {object[]} Tarefas com `disponivel`.
 */
function calcularDisponibilidade(itens) {
  const fechadas = itens.filter((item) => item.concluida || item.statusCodigo === 'cancelada');
  const concluidas = new Set(fechadas.map((item) => item.id));
  return itens.map((item) => {
    const estaLivre = item.tipo === 'sub' && item.statusCodigo === 'pendente';
    const semReserva = item.emUsoPor === null && !item.status.includes('🔒');
    const dependenciasProntas = item.dependeDe.every((dep) => concluidas.has(dep));
    return { ...item, disponivel: estaLivre && semReserva && dependenciasProntas };
  });
}

/**
 * Le as frentes de trabalho do STATUS.md.
 * @param {string} texto - Conteudo do STATUS.md.
 * @returns {object[]} Itens da colecao frentes.
 */
function lerFrentes(texto) {
  return fatiarTabela(texto, TITULO_FRENTES)
    .filter((celulas) => celulas.length >= COLUNAS_FRENTE)
    .map(([frente, tarefa, situacao, atualizadoEm], indice) => ({
      id: indice + 1,
      frente,
      tarefa,
      situacao,
      atualizadoEm,
    }));
}

/**
 * Monta o conteudo completo do db.json.
 * @returns {object} Colecoes tarefas, frentes e meta.
 */
function montarBanco() {
  const textoStatus = lerArquivo(CAMINHO_STATUS);
  const linhas = [
    ...fatiarTabela(textoStatus, TITULO_TAREFAS),
    ...fatiarTabela(lerArquivo(CAMINHO_CONCLUIDAS), null),
  ];
  const convertidas = linhas.map(converterLinha).filter(Boolean);
  const tarefas = calcularDisponibilidade(garantirIdsUnicos(convertidas));
  const meta = [
    {
      id: 1,
      geradoEm: new Date().toISOString(),
      totalTarefas: tarefas.length,
      totalConcluidas: tarefas.filter((item) => item.concluida).length,
      totalDisponiveis: tarefas.filter((item) => item.disponivel).length,
    },
  ];
  return { tarefas, frentes: lerFrentes(textoStatus), meta };
}

/**
 * Gera e grava api/db.json (unico arquivo escrito).
 * @returns {void}
 */
function principal() {
  const banco = montarBanco();
  const gravou = gravarSeMudou(CAMINHO_SAIDA, banco);
  const situacao = gravou ? 'gerado' : 'sem mudanca (nao regravado)';
  process.stdout.write(`db.json ${situacao}: ${JSON.stringify(banco.meta[0])}\n`);
}

principal();
