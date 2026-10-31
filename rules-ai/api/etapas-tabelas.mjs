// Tabelas das etapas que viram colecoes (SCHEMA.md 2.12 a 2.14, MIGRAR-TAREFAS-API.10):
// `requisitos`, `invariantes` e `perguntas`. Funcoes puras; o texto fora da tabela volta para
// `etapas.secoes[].texto` e cada linha da tabela vira um registro com `linhaCrua`.
import { dividirCelulas } from './migrar.mjs';
import { juntarLinhas, marcarCercas, normalizar } from './etapas-leitor.mjs';

const PADRAO_SEPARADOR = /^\|[\s|:-]+\|?\s*$/;
const PADRAO_ITEM_PERGUNTA = /^- (✅|⬜)\s*\*\*(P\d+[a-z]?)[\s.:—–-]*([^*]*)\*\*\s?(.*)$/;
const PADRAO_REFERENCIA = /(?:^|[^\w.])([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*)?\.(\d+)\b/g;
const MARCA_ABERTA = '⬜';
const MARCA_FECHADA = '✅';
const PREFIXO_LINHA_SEM_CODIGO = 'L';

const MAPAS_COLUNAS = {
  requisitos: [
    ['id', 'codigo'], ['requisito', 'texto'], ['cobre', 'cobreTexto'],
    ['verificacao', 'verificacao'],
  ],
  invariantes: [
    ['id', 'codigo'], ['regra', 'regra'], ['invariante', 'regra'], ['dominio', 'dominio'],
    ['como conferir', 'comoConferir'], ['teste', 'testeAutomatizado'],
  ],
  perguntas: [
    ['#', 'codigo'], ['id', 'codigo'], ['pergunta', 'pergunta'], ['resposta', 'resposta'],
    ['fechada', 'fechadaEm'], ['quem', 'quemRespondeu'], ['situacao', 'situacaoTexto'],
  ],
};

/**
 * Separa a primeira tabela Markdown (fora de cercas) do resto das linhas.
 * @param {string[]} linhas - Linhas da secao.
 * @returns {{tabela: string[], resto: string[]}} Linhas da tabela e as demais.
 */
export function separarTabela(linhas) {
  const emCerca = marcarCercas(linhas);
  const inicio = linhas.findIndex((linha, i) => {
    const temSeparador = PADRAO_SEPARADOR.test(linhas[i + 1] || '');
    return !emCerca[i] && linha.startsWith('|') && temSeparador;
  });
  if (inicio < 0) return { tabela: [], resto: linhas };
  let fim = inicio;
  while (fim < linhas.length && linhas[fim].startsWith('|')) fim += 1;
  return {
    tabela: linhas.slice(inicio, fim),
    resto: [...linhas.slice(0, inicio), ...linhas.slice(fim)],
  };
}

/**
 * Campo do registro para o nome de uma coluna, ou null (vai para `extras`).
 * @param {string} colecao - Nome da colecao.
 * @param {string} coluna - Cabecalho da coluna.
 * @returns {string|null} Campo.
 */
function campoDaColuna(colecao, coluna) {
  const normalizado = normalizar(coluna);
  const achado = MAPAS_COLUNAS[colecao].find(([prefixo]) => normalizado.startsWith(prefixo));
  return achado ? achado[1] : null;
}

/**
 * Converte uma linha de dados em campos crus pelo cabecalho (colunas sem campo vao a extras).
 * @param {string} colecao - Nome da colecao.
 * @param {string[]} cabecalho - Colunas da tabela.
 * @param {string} linha - Linha crua.
 * @returns {object} Campos crus com `extras` e `linhaCrua`.
 */
function lerLinhaTabela(colecao, cabecalho, linha) {
  const celulas = dividirCelulas(linha.trimEnd().endsWith('|') ? linha : `${linha} |`);
  const campos = { extras: {}, linhaCrua: linha };
  cabecalho.forEach((coluna, posicao) => {
    const valor = celulas[posicao] ?? '';
    const campo = campoDaColuna(colecao, coluna);
    const jaTem = campo && campos[campo] !== undefined;
    if (!campo || jaTem) campos.extras[coluna] = valor;
    else campos[campo] = valor;
  });
  const sobras = celulas.slice(cabecalho.length).filter((valor) => valor !== '');
  if (sobras.length > 0) campos.extras['Colunas a mais'] = sobras.join(' | ');
  return campos;
}

/**
 * Ids de tarefa citados num texto (`X.7` ou `.7`, este relativo a mae da etapa).
 * @param {string} texto - Texto com as referencias.
 * @param {{projeto: string, codigoMae: string|null}} contexto - Projeto e mae.
 * @returns {string[]} Ids `<projeto>:<codigo>` sem repeticao, na ordem.
 */
export function extrairReferencias(texto, contexto) {
  const ids = [];
  for (const achado of (texto || '').matchAll(PADRAO_REFERENCIA)) {
    const base = achado[1] || contexto.codigoMae;
    if (!base) continue;
    const id = `${contexto.projeto}:${base}.${achado[2]}`;
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

/**
 * Completa um requisito com relacoes e campos fixos do SCHEMA 2.12.
 * @param {object} crus - Campos crus da linha.
 * @param {object} contexto - Projeto, mae e conjunto de ids de tarefas existentes.
 * @returns {object} Campos do requisito (sem id, projeto, etapa e ordem).
 */
function montarRequisito(crus, contexto) {
  const citados = extrairReferencias(crus.cobreTexto, contexto);
  return {
    codigo: crus.codigo || '', texto: crus.texto || '',
    cobre: citados.filter((id) => contexto.idsTarefas.has(id)),
    cobreTexto: crus.cobreTexto || '', verificacao: crus.verificacao || '',
    extras: crus.extras, linhaCrua: crus.linhaCrua,
  };
}

/**
 * Completa uma invariante com relacoes e campos fixos do SCHEMA 2.13.
 * @param {object} crus - Campos crus da linha.
 * @param {object} contexto - Projeto, mae e conjunto de ids de tarefas existentes.
 * @returns {object} Campos da invariante.
 */
function montarInvariante(crus, contexto) {
  const teste = crus.testeAutomatizado ?? null;
  const textoReferencias = `${teste || ''} ${crus.comoConferir || ''}`;
  const citados = extrairReferencias(textoReferencias, contexto);
  return {
    codigo: crus.codigo || '', regra: crus.regra || '', dominio: crus.dominio ?? null,
    comoConferir: crus.comoConferir || '', testeAutomatizado: teste,
    temTeste: normalizar(teste || '').startsWith('sim'),
    testeTarefas: citados.filter((id) => contexto.idsTarefas.has(id)),
    extras: crus.extras, linhaCrua: crus.linhaCrua,
  };
}

/**
 * Situacao da pergunta pelos emojis da resposta/situacao (sem emoji: fechada se respondida).
 * @param {object} crus - Campos crus da linha.
 * @returns {string} `aberta` ou `fechada`.
 */
function situacaoDaPergunta(crus) {
  const texto = `${crus.resposta || ''} ${crus.situacaoTexto || ''}`;
  if (texto.includes(MARCA_ABERTA)) return 'aberta';
  if (texto.includes(MARCA_FECHADA)) return 'fechada';
  return (crus.resposta || '').trim() ? 'fechada' : 'aberta';
}

/**
 * Completa uma pergunta com os campos fixos do SCHEMA 2.14.
 * @param {object} crus - Campos crus da linha ou do item de lista.
 * @returns {object} Campos da pergunta.
 */
function montarPergunta(crus) {
  const extras = { ...crus.extras };
  if (crus.situacaoTexto !== undefined) extras['Situação'] = crus.situacaoTexto;
  const resposta = crus.resposta === undefined || crus.resposta === null
    ? null
    : crus.resposta.replace(/^\s*(✅|⬜)\s*/, '');
  return {
    codigo: crus.codigo || '', pergunta: crus.pergunta || '', resposta,
    situacao: crus.situacao || situacaoDaPergunta(crus),
    fechadaEm: crus.fechadaEm || null, quemRespondeu: crus.quemRespondeu || null,
    extras, linhaCrua: crus.linhaCrua,
  };
}

const MONTADORES = {
  requisitos: montarRequisito,
  invariantes: montarInvariante,
  perguntas: montarPergunta,
};

/**
 * Le os itens de pergunta em lista (`- ✅ **P0 — Projeto:** texto`), com continuacao recuada.
 * @param {string[]} linhas - Linhas da secao.
 * @returns {{itens: object[], resto: string[]}} Itens crus e linhas que sobram.
 */
export function lerPerguntasEmLista(linhas) {
  const itens = [];
  const resto = [];
  let atual = null;
  for (const linha of linhas) {
    const achado = linha.match(PADRAO_ITEM_PERGUNTA);
    if (achado) {
      const pergunta = [achado[3].trim(), achado[4].trim()].filter((p) => p).join(' ');
      atual = { codigo: achado[2].replace(/[.:]+$/, ''), pergunta, extras: {},
        situacao: achado[1] === MARCA_ABERTA ? 'aberta' : 'fechada', resposta: null,
        linhaCrua: linha };
      itens.push(atual);
      continue;
    }
    const continua = atual && /^\s+\S/.test(linha);
    if (!continua) {
      atual = null;
      resto.push(linha);
      continue;
    }
    atual.pergunta = `${atual.pergunta}\n${linha.trim()}`;
    atual.linhaCrua = `${atual.linhaCrua}\n${linha}`;
  }
  return { itens, resto };
}

/**
 * Le a tabela (ou a lista de perguntas) de uma secao em registros crus da colecao.
 * @param {string} colecao - `requisitos`, `invariantes` ou `perguntas`.
 * @param {string[]} linhas - Linhas da secao.
 * @returns {{registros: object[], texto: string, colunas: string[]|null, linhasTabela: number}}
 *   Registros crus, texto fora da tabela, cabecalho original e quantas linhas de dados havia.
 */
export function lerTabelaDaSecao(colecao, linhas) {
  const { tabela, resto } = separarTabela(linhas);
  if (tabela.length > 0) {
    const colunas = dividirCelulas(tabela[0]);
    const dados = tabela.slice(2);
    const registros = dados.map((linha) => lerLinhaTabela(colecao, colunas, linha));
    return { registros, texto: juntarLinhas(resto), colunas, linhasTabela: dados.length };
  }
  if (colecao !== 'perguntas') {
    return { registros: [], texto: juntarLinhas(linhas), colunas: null, linhasTabela: 0 };
  }
  const lista = lerPerguntasEmLista(linhas);
  return {
    registros: lista.itens, texto: juntarLinhas(lista.resto), colunas: null,
    linhasTabela: lista.itens.length,
  };
}

/**
 * Monta os registros finais da colecao: id `<projeto>:<etapa>:<codigo>` (repeticao com #N).
 * @param {string} colecao - Nome da colecao.
 * @param {object[]} crus - Registros crus na ordem da tabela.
 * @param {{projeto: string, etapaCodigo: string, etapaId: string, ordemInicial: number}} contexto
 *   Projeto, etapa, mae (`codigoMae`), ids de tarefas e ordem do primeiro registro.
 * @returns {object[]} Registros prontos.
 */
export function montarRegistrosTabela(colecao, crus, contexto) {
  const vistos = contexto.vistos;
  return crus.map((cru, indice) => {
    const campos = MONTADORES[colecao](cru, contexto);
    const ordem = contexto.ordemInicial + indice;
    const codigo = campos.codigo || `${PREFIXO_LINHA_SEM_CODIGO}${ordem}`;
    const base = `${contexto.projeto}:${contexto.etapaCodigo}:${codigo}`;
    const vezes = (vistos.get(base) || 0) + 1;
    vistos.set(base, vezes);
    const id = vezes === 1 ? base : `${base}#${vezes}`;
    return { id, projeto: contexto.projeto, etapa: contexto.etapaId, ...campos, codigo, ordem };
  });
}
