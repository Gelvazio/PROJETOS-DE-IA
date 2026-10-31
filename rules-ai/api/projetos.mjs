// UPSERT idempotente na colecao `projetos` de api/dados/_projetos.json (SCHEMA.md, secao 2.10).
// Uso: node api/projetos.mjs --id <id> [--nome <t>] [--tipo mae|filho] [--status ativo|aguardando]
//        [--monitorado true|false] [--motivo <t>] [--caminho <t>] [--repositorio <t>]
//      node api/projetos.mjs --listar
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gravarSeMudou } from './serializador.mjs';

const PASTA_API = dirname(fileURLToPath(import.meta.url));
const ARQUIVO_PROJETOS = resolve(PASTA_API, 'dados', '_projetos.json');
const COLECAO = 'projetos';
const CODIFICACAO = 'utf8';
const TIPOS = ['mae', 'filho'];
const STATUS = ['ativo', 'aguardando'];
const STATUS_ATIVO = 'ativo';
const STATUS_AGUARDANDO = 'aguardando';
const TIPO_PADRAO = 'filho';
const ORDEM_CAMPOS = [
  'id', 'nome', 'tipo', 'status', 'monitorado', 'motivo', 'caminho', 'repositorio', 'objetivo',
  'partesInteressadas', 'escopo', 'cortadoEm', 'ordem',
];
const OPCOES_TEXTO = ['id', 'nome', 'tipo', 'status', 'motivo', 'caminho', 'repositorio'];
const COLUNAS_LISTA = ['ordem', 'id', 'tipo', 'status', 'monitorado', 'motivo'];
const MSG_USO = 'Uso: node api/projetos.mjs --id <id> [--nome ..] [--tipo mae|filho] '
  + '[--status ativo|aguardando] [--monitorado true|false] [--motivo ..] | --listar';

/**
 * Le as opcoes `--chave valor` da linha de comando (`--listar` e booleana).
 * @param {string[]} argumentos - Argumentos apos o nome do script.
 * @returns {Record<string, string|boolean>} Opcoes lidas.
 * @throws {Error} Se uma opcao nao tiver valor ou nao for conhecida.
 */
export function lerOpcoes(argumentos) {
  const conhecidas = new Set([...OPCOES_TEXTO, 'monitorado', 'listar']);
  const opcoes = {};
  for (let i = 0; i < argumentos.length; i += 1) {
    const nome = argumentos[i].replace(/^--/, '');
    if (!argumentos[i].startsWith('--') || !conhecidas.has(nome)) {
      throw new Error(`Opcao desconhecida: ${argumentos[i]}. ${MSG_USO}`);
    }
    if (nome === 'listar') {
      opcoes.listar = true;
      continue;
    }
    const valor = argumentos[i + 1];
    if (valor === undefined || valor.startsWith('--')) {
      throw new Error(`Falta o valor de --${nome}.`);
    }
    opcoes[nome] = valor;
    i += 1;
  }
  return opcoes;
}

/**
 * Converte `true`/`false` em booleano.
 * @param {string} texto - Valor digitado.
 * @returns {boolean} Valor convertido.
 * @throws {Error} Se nao for `true` nem `false`.
 */
function lerBooleano(texto) {
  if (texto === 'true') return true;
  if (texto === 'false') return false;
  throw new Error(`monitorado invalido: "${texto}" (use true ou false).`);
}

/**
 * Valida id, tipo e status das opcoes.
 * @param {Record<string, string>} opcoes - Opcoes lidas.
 * @returns {void}
 * @throws {Error} Com mensagem clara se algo for invalido.
 */
function validarOpcoes(opcoes) {
  const id = (opcoes.id || '').trim();
  if (!id) throw new Error(`id obrigatorio e nao pode ser vazio. ${MSG_USO}`);
  if (opcoes.tipo !== undefined && !TIPOS.includes(opcoes.tipo)) {
    throw new Error(`tipo invalido: "${opcoes.tipo}" (use ${TIPOS.join(' ou ')}).`);
  }
  if (opcoes.status !== undefined && !STATUS.includes(opcoes.status)) {
    throw new Error(`status invalido: "${opcoes.status}" (use ${STATUS.join(' ou ')}).`);
  }
}

/**
 * Reordena as chaves do registro na ordem do SCHEMA.
 * @param {object} registro - Registro de projeto.
 * @returns {object} Registro com chaves ordenadas.
 */
function ordenarProjeto(registro) {
  const conhecidas = ORDEM_CAMPOS.filter((campo) => campo in registro);
  const extras = Object.keys(registro).filter((campo) => !ORDEM_CAMPOS.includes(campo));
  const resultado = {};
  for (const campo of [...conhecidas, ...extras]) resultado[campo] = registro[campo];
  return resultado;
}

/**
 * Calcula a proxima ordem livre da lista.
 * @param {object[]} projetos - Lista atual.
 * @returns {number} Maior ordem mais um.
 */
function proximaOrdem(projetos) {
  return projetos.reduce((maior, projeto) => Math.max(maior, projeto.ordem || 0), 0) + 1;
}

/**
 * Decide o `monitorado` final: o informado, ou o atual (falso se nao estiver ativo).
 * @param {object|undefined} existente - Projeto ja gravado, se houver.
 * @param {Record<string, string>} opcoes - Opcoes lidas.
 * @param {string} status - Status final do projeto.
 * @returns {boolean} Valor de monitorado.
 * @throws {Error} Se ficar aguardando e monitorado ao mesmo tempo.
 */
function decidirMonitorado(existente, opcoes, status) {
  const padrao = existente ? existente.monitorado : true;
  const monitorado = opcoes.monitorado === undefined
    ? padrao && status === STATUS_ATIVO
    : lerBooleano(opcoes.monitorado);
  if (status === STATUS_AGUARDANDO && monitorado) {
    throw new Error('Projeto aguardando nao pode ficar monitorado=true.');
  }
  return monitorado;
}

/**
 * Cria ou atualiza o projeto na lista, sem mexer nos campos nao informados.
 * @param {object[]} projetos - Lista atual da colecao.
 * @param {Record<string, string>} opcoes - Opcoes lidas da linha de comando.
 * @returns {object[]} Nova lista com o projeto gravado.
 * @throws {Error} Se as opcoes forem invalidas ou incoerentes.
 */
export function aplicarUpsert(projetos, opcoes) {
  validarOpcoes(opcoes);
  const id = opcoes.id.trim();
  const existente = projetos.find((projeto) => projeto.id === id);
  const status = opcoes.status || (existente && existente.status) || STATUS_ATIVO;
  const monitorado = decidirMonitorado(existente, opcoes, status);
  const base = existente || { id, nome: id, tipo: TIPO_PADRAO, cortadoEm: null };
  const ordem = existente ? existente.ordem : proximaOrdem(projetos);
  const campos = {};
  for (const campo of OPCOES_TEXTO) {
    if (campo !== 'id' && opcoes[campo] !== undefined) campos[campo] = opcoes[campo];
  }
  const atualizado = ordenarProjeto({ ...base, ...campos, status, monitorado, ordem });
  return [...projetos.filter((projeto) => projeto.id !== id), atualizado];
}

/**
 * Le a lista de projetos do arquivo (vazia se o arquivo nao existir).
 * @param {string} caminho - Caminho do _projetos.json.
 * @returns {object[]} Lista de projetos.
 * @throws {Error} Se o arquivo existir mas estiver corrompido.
 */
export function lerProjetos(caminho = ARQUIVO_PROJETOS) {
  if (!existsSync(caminho)) return [];
  const banco = JSON.parse(readFileSync(caminho, CODIFICACAO));
  return Array.isArray(banco[COLECAO]) ? banco[COLECAO] : [];
}

/**
 * Faz o UPSERT e grava so se algo mudou.
 * @param {Record<string, string>} opcoes - Opcoes do projeto.
 * @param {string} caminho - Caminho do _projetos.json.
 * @returns {{gravou: boolean, projetos: object[]}} Resultado da gravacao.
 */
export function gravarProjeto(opcoes, caminho = ARQUIVO_PROJETOS) {
  const projetos = aplicarUpsert(lerProjetos(caminho), opcoes);
  mkdirSync(dirname(caminho), { recursive: true });
  const gravou = gravarSeMudou(caminho, { [COLECAO]: projetos });
  return { gravou, projetos };
}

/**
 * Monta a tabela de texto com os projetos.
 * @param {object[]} projetos - Lista de projetos.
 * @returns {string} Tabela alinhada.
 */
export function montarTabela(projetos) {
  const linhas = [...projetos]
    .sort((a, b) => a.ordem - b.ordem)
    .map((projeto) => COLUNAS_LISTA.map((coluna) => String(projeto[coluna] ?? '')));
  const todas = [COLUNAS_LISTA, ...linhas];
  const larguras = COLUNAS_LISTA.map((_, i) => Math.max(...todas.map((linha) => linha[i].length)));
  return todas
    .map((linha) => linha.map((celula, i) => celula.padEnd(larguras[i])).join('  ').trimEnd())
    .join('\n');
}

/**
 * Ponto de entrada da linha de comando.
 * @param {string[]} argumentos - Argumentos apos o nome do script.
 * @returns {number} Codigo de saida (0 ok, 1 erro).
 */
export function executar(argumentos) {
  try {
    const opcoes = lerOpcoes(argumentos);
    if (opcoes.listar) {
      console.log(montarTabela(lerProjetos()));
      return 0;
    }
    const { gravou } = gravarProjeto(opcoes);
    console.log(gravou ? `projeto ${opcoes.id}: gravado` : `projeto ${opcoes.id}: sem mudanca`);
    return 0;
  } catch (erro) {
    console.error(`Erro: ${erro.message}`);
    return 1;
  }
}

const ehExecucaoDireta = import.meta.url === pathToFileURL(process.argv[1] || '').href;
if (ehExecucaoDireta) process.exitCode = executar(process.argv.slice(2));
