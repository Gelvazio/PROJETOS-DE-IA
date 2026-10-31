/**
 * Descoberta de projetos com quadro e resolução segura de caminhos (R2.1, R3.2).
 *
 * Só enxerga pastas de primeiro nível da raiz que tenham `tasks/STATUS.md`. Nunca lista
 * `DEMAIS-PROJETOS-*` nem pastas ocultas (C20, C23) e só devolve caminhos dentro de `tasks/`.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

import {
  ARQUIVO_CONCLUIDAS,
  ARQUIVO_STATUS,
  CODIGOS_ERRO,
  EXTENSAO_ETAPA,
  ErroQuadro,
  PASTA_ETAPAS,
  PASTA_TASKS,
  PREFIXOS_IGNORADOS,
  PREFIXO_PASTA_OCULTA,
  RAIZ_FONTES,
} from './config.mjs';

/** Nome de projeto aceito: sem separador, sem `..`, sem caractere de controle. */
const PADRAO_NOME_PROJETO = /^[\p{L}\p{N}][\p{L}\p{N}._ -]*$/u;

/** Arquivos fixos de tasks/ que o MCP pode ler e gravar. */
const ARQUIVOS_FIXOS = [ARQUIVO_STATUS, ARQUIVO_CONCLUIDAS];

/**
 * Diz se uma pasta da raiz deve ser ignorada (C20, C23).
 * @param {string} nome - Nome da pasta.
 * @returns {boolean} true para `DEMAIS-PROJETOS-*` e pastas ocultas.
 */
export function ehPastaIgnorada(nome) {
  const ehOculta = nome.startsWith(PREFIXO_PASTA_OCULTA);
  const nomeMaiusculo = nome.toUpperCase();
  const ehProibida = PREFIXOS_IGNORADOS.some((prefixo) => nomeMaiusculo.startsWith(prefixo));
  return ehOculta || ehProibida;
}

/**
 * Diz se `filho` está dentro de `pai` (comparação léxica, já normalizada).
 * @param {string} pai - Pasta de referência.
 * @param {string} filho - Caminho a conferir.
 * @returns {boolean} true se `filho` é igual a `pai` ou está abaixo dele.
 */
export function estaDentroDe(pai, filho) {
  const relativo = path.relative(path.resolve(pai), path.resolve(filho));
  if (relativo === '') return true;
  return !relativo.startsWith('..') && !path.isAbsolute(relativo);
}

/**
 * Diz se existe um arquivo comum (não link) no caminho.
 * @param {string} caminho - Caminho absoluto.
 * @returns {Promise<boolean>} true se for arquivo regular.
 */
async function existeArquivoComum(caminho) {
  try {
    const dados = await fs.lstat(caminho);
    return dados.isFile();
  } catch {
    return false;
  }
}

/**
 * Monta o registro de um projeto a partir da pasta.
 * @param {string} raiz - Raiz dos projetos.
 * @param {string} nome - Nome da pasta do projeto.
 * @returns {{nome: string, caminho: string, status: string, concluidas: string}} Projeto.
 */
function montarProjeto(raiz, nome) {
  const caminho = path.join(raiz, nome);
  return {
    nome,
    caminho,
    status: path.join(caminho, ...ARQUIVO_STATUS.split('/')),
    concluidas: path.join(caminho, ...ARQUIVO_CONCLUIDAS.split('/')),
  };
}

/**
 * Lista os projetos com `tasks/STATUS.md` na raiz, em ordem alfabética sem caixa.
 * Pastas `DEMAIS-PROJETOS-*`, ocultas, links e arquivos soltos nunca entram.
 * @param {string} [raiz] - Raiz dos projetos (padrão: `C:\fontes`).
 * @returns {Promise<Array<{nome: string, caminho: string, status: string, concluidas: string}>>}
 */
export async function listarProjetos(raiz = RAIZ_FONTES) {
  let entradas;
  try {
    entradas = await fs.readdir(raiz, { withFileTypes: true });
  } catch {
    return [];
  }
  const candidatos = entradas
    .filter((entrada) => entrada.isDirectory() && !ehPastaIgnorada(entrada.name))
    .map((entrada) => montarProjeto(raiz, entrada.name));
  const comQuadro = [];
  for (const projeto of candidatos) {
    if (await existeArquivoComum(projeto.status)) comQuadro.push(projeto);
  }
  return comQuadro.sort((a, b) => a.nome.toLowerCase().localeCompare(b.nome.toLowerCase()));
}

/**
 * Valida o nome de projeto recebido de um agente.
 * @param {unknown} nome - Valor recebido.
 * @returns {string} O nome, se for válido.
 * @throws {ErroQuadro} Se o nome tiver separador, `..`, prefixo proibido ou formato estranho.
 */
function validarNomeDeProjeto(nome) {
  const ehTexto = typeof nome === 'string' && nome.length > 0 && nome.length <= 200;
  const temFormatoValido = ehTexto && PADRAO_NOME_PROJETO.test(nome) && !nome.includes('..');
  if (!temFormatoValido || ehPastaIgnorada(nome)) {
    throw new ErroQuadro(CODIGOS_ERRO.PROJETO_INVALIDO, 'Nome de projeto inválido.');
  }
  return nome;
}

/**
 * Acha um projeto pelo nome, só entre os descobertos.
 * @param {string} nome - Nome da pasta do projeto.
 * @param {string} [raiz] - Raiz dos projetos.
 * @returns {Promise<{nome: string, caminho: string, status: string, concluidas: string}>}
 * @throws {ErroQuadro} Se o nome for inválido ou o projeto não tiver quadro.
 */
export async function obterProjeto(nome, raiz = RAIZ_FONTES) {
  const nomeValido = validarNomeDeProjeto(nome);
  const projetos = await listarProjetos(raiz);
  const achado = projetos.find((projeto) => projeto.nome === nomeValido);
  if (!achado) {
    throw new ErroQuadro(CODIGOS_ERRO.PROJETO_NAO_ENCONTRADO, 'Projeto sem tasks/STATUS.md.');
  }
  return achado;
}

/**
 * Normaliza e confere um caminho relativo contra a lista de arquivos permitidos.
 * @param {unknown} relativo - Caminho relativo ao projeto (ex.: `tasks/STATUS.md`).
 * @returns {string} Caminho com `/`, sem `.` e sem `..`.
 * @throws {ErroQuadro} Se o caminho não for um dos permitidos.
 */
function normalizarCaminhoPermitido(relativo) {
  const recusa = () => new ErroQuadro(CODIGOS_ERRO.CAMINHO_RECUSADO, 'Caminho fora de tasks/.');
  if (typeof relativo !== 'string' || relativo.includes('\0')) throw recusa();
  const comBarras = relativo.replaceAll('\\', '/');
  const normalizado = path.posix.normalize(comBarras);
  const ehFixo = ARQUIVOS_FIXOS.includes(normalizado);
  const partes = normalizado.split('/');
  const ehEtapa =
    normalizado.startsWith(`${PASTA_ETAPAS}/`) &&
    partes.length === PASTA_ETAPAS.split('/').length + 1 &&
    normalizado.endsWith(EXTENSAO_ETAPA) &&
    !partes.includes('..');
  if (!ehFixo && !ehEtapa) throw recusa();
  return normalizado;
}

/**
 * Recusa o caminho se algum trecho dentro de `tasks/` for link simbólico ou junção.
 * @param {string} pastaProjeto - Pasta do projeto.
 * @param {string} absoluto - Caminho absoluto do arquivo.
 * @returns {Promise<void>}
 * @throws {ErroQuadro} Se encontrar link no caminho.
 */
async function recusarLinks(pastaProjeto, absoluto) {
  const pastaTasks = path.join(pastaProjeto, PASTA_TASKS);
  const trechos = path.relative(pastaTasks, absoluto).split(path.sep);
  let atual = pastaTasks;
  for (const trecho of ['', ...trechos]) {
    atual = path.join(atual, trecho);
    let dados;
    try {
      dados = await fs.lstat(atual);
    } catch {
      return;
    }
    if (dados.isSymbolicLink()) {
      throw new ErroQuadro(CODIGOS_ERRO.CAMINHO_RECUSADO, 'Link simbólico recusado.');
    }
  }
}

/**
 * Resolve um caminho relativo do projeto para absoluto, só se for permitido.
 * Permitidos: `tasks/STATUS.md`, `tasks/task_complete.md` e `tasks/etapas/*.md`.
 * Qualquer outro (`.env`, `.git/config`, `src/`, `..`, absoluto, link) é recusado.
 * @param {{caminho: string}} projeto - Projeto devolvido por `obterProjeto`.
 * @param {string} relativo - Caminho relativo ao projeto.
 * @returns {Promise<string>} Caminho absoluto seguro.
 * @throws {ErroQuadro} Se o caminho for recusado.
 */
export async function resolverCaminhoDeTasks(projeto, relativo) {
  const normalizado = normalizarCaminhoPermitido(relativo);
  const absoluto = path.resolve(projeto.caminho, ...normalizado.split('/'));
  if (!estaDentroDe(path.join(projeto.caminho, PASTA_TASKS), absoluto)) {
    throw new ErroQuadro(CODIGOS_ERRO.CAMINHO_RECUSADO, 'Caminho fora de tasks/.');
  }
  await recusarLinks(projeto.caminho, absoluto);
  return absoluto;
}
