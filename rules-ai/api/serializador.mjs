// Serializador estavel do api/db.json: mesma entrada gera sempre o mesmo texto (SCHEMA.md, secao 5).
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';

const ORDEM_COLECOES = [
  'projetos',
  'tarefas',
  'etapas',
  'requisitos',
  'invariantes',
  'perguntas',
  'frentes',
  'decisoes',
  'riscos',
  'bloqueios',
  'pendencias',
  'licoes',
  'recados',
  'meta',
];
const ORDEM_CAMPOS_TAREFA = [
  'id', 'projeto', 'codigo', 'tipo', 'mae', 'titulo', 'prioridade', 'modelo', 'nivel',
  'nivelMotivo', 'effort', 'modeloSecao', 'jevAiSuggestion', 'fonteNivel', 'dependeDe',
  'dependeDeTexto', 'status', 'statusCodigo', 'emUsoPor', 'reservadoEm', 'travaEspecial',
  'naoReservavel', 'concluida', 'arquivada', 'disponivel', 'etapaId', 'etapaArquivo', 'etapa',
  'proximoPasso', 'descricao', 'criteriosAceitacao', 'criterioPronto', 'arquivos', 'estimativa',
  'entrega', 'verificacao', 'verificacaoRotulo', 'anotacao', 'extras', 'ordem', 'criadaEm',
  'concluidaEm', 'atualizadoEm',
];
const COLECOES_POR_DATA_DECRESCENTE = new Set(['decisoes', 'recados']);
const CAMPOS_DATA = ['data', 'dataHora'];
const CAMPOS_VOLATEIS_META = ['geradoEm', 'sequencia'];
const COLECAO_META = 'meta';
const INDENTACAO = 2;
const FIM_DE_LINHA = '\n';
const CODIFICACAO = 'utf8';
const PADRAO_PARTES = /(\d+|\D+)/g;

/**
 * Compara dois ids em ordenacao natural (X.2 antes de X.10).
 * @param {string|number} a - Primeiro id.
 * @param {string|number} b - Segundo id.
 * @returns {number} Negativo, zero ou positivo.
 */
function compararIdsNaturais(a, b) {
  const partesA = String(a).match(PADRAO_PARTES) || [];
  const partesB = String(b).match(PADRAO_PARTES) || [];
  const total = Math.min(partesA.length, partesB.length);
  for (let i = 0; i < total; i += 1) {
    const ambosNumeros = /^\d/.test(partesA[i]) && /^\d/.test(partesB[i]);
    const diferenca = ambosNumeros
      ? Number(partesA[i]) - Number(partesB[i])
      : partesA[i].localeCompare(partesB[i], 'en');
    if (diferenca !== 0) return diferenca;
  }
  return partesA.length - partesB.length;
}

/**
 * Devolve o primeiro campo de data que o registro tiver.
 * @param {object} registro - Registro da colecao.
 * @returns {string} Texto da data ou vazio.
 */
function obterData(registro) {
  const campo = CAMPOS_DATA.find((nome) => typeof registro[nome] === 'string');
  return campo ? registro[campo] : '';
}

/**
 * Ordena os registros de uma colecao: por id natural, ou por data mais nova primeiro.
 * @param {string} nome - Nome da colecao.
 * @param {object[]} registros - Registros da colecao.
 * @returns {object[]} Copia ordenada.
 */
function ordenarRegistros(nome, registros) {
  const copia = [...registros];
  if (COLECOES_POR_DATA_DECRESCENTE.has(nome)) {
    return copia.sort((a, b) => obterData(b).localeCompare(obterData(a)));
  }
  return copia.sort((a, b) => compararIdsNaturais(a.id, b.id));
}

/**
 * Reordena as chaves de um registro: as da lista primeiro, as demais na ordem original.
 * @param {object} registro - Registro da colecao.
 * @param {string[]} ordem - Chaves conhecidas, na ordem fixa.
 * @returns {object} Novo objeto com as chaves ordenadas.
 */
function ordenarChaves(registro, ordem) {
  const resultado = {};
  const conhecidas = ordem.filter((chave) => chave in registro);
  const restantes = Object.keys(registro).filter((chave) => !ordem.includes(chave));
  for (const chave of [...conhecidas, ...restantes]) resultado[chave] = registro[chave];
  return resultado;
}

/**
 * Prepara uma colecao para gravar (registros e chaves em ordem estavel).
 * @param {string} nome - Nome da colecao.
 * @param {*} colecao - Lista de registros ou objeto unico (meta).
 * @returns {*} Colecao ordenada.
 */
function prepararColecao(nome, colecao) {
  const ordemCampos = nome === 'tarefas' ? ORDEM_CAMPOS_TAREFA : ['id'];
  if (!Array.isArray(colecao)) {
    return colecao && typeof colecao === 'object' ? ordenarChaves(colecao, ordemCampos) : colecao;
  }
  const registros = nome === COLECAO_META ? colecao : ordenarRegistros(nome, colecao);
  return registros.map((registro) => ordenarChaves(registro, ordemCampos));
}

/**
 * Monta o banco com as colecoes na ordem fixa do SCHEMA (meta por ultimo).
 * @param {object} banco - Objeto do banco.
 * @returns {object} Banco com colecoes e registros ordenados.
 */
function prepararBanco(banco) {
  const conhecidas = ORDEM_COLECOES.filter((nome) => nome in banco && nome !== COLECAO_META);
  const outras = Object.keys(banco).filter(
    (nome) => !ORDEM_COLECOES.includes(nome),
  );
  const nomes = [...conhecidas, ...outras, ...(COLECAO_META in banco ? [COLECAO_META] : [])];
  const resultado = {};
  for (const nome of nomes) resultado[nome] = prepararColecao(nome, banco[nome]);
  return resultado;
}

/**
 * Serializa o banco em texto JSON estavel (2 espacos, LF, quebra final).
 * @param {object} banco - Objeto do banco.
 * @returns {string} Texto pronto para gravar.
 */
export function serializarBanco(banco) {
  return JSON.stringify(prepararBanco(banco), null, INDENTACAO) + FIM_DE_LINHA;
}

/**
 * Serializa ignorando os campos que mudam a cada escrita (`geradoEm`, `sequencia`).
 * @param {object} banco - Objeto do banco.
 * @returns {string} Texto usado so para comparar conteudo.
 */
function serializarSemVolateis(banco) {
  const meta = banco[COLECAO_META];
  if (!meta) return serializarBanco(banco);

  const limpar = (item) => {
    const copia = { ...item };
    for (const campo of CAMPOS_VOLATEIS_META) delete copia[campo];
    return copia;
  };
  const metaLimpo = Array.isArray(meta) ? meta.map(limpar) : limpar(meta);
  return serializarBanco({ ...banco, [COLECAO_META]: metaLimpo });
}

/**
 * Le o banco ja gravado, ou null se nao existir ou estiver invalido.
 * @param {string} caminho - Caminho do db.json.
 * @returns {object|null} Banco gravado.
 */
function lerBancoGravado(caminho) {
  if (!existsSync(caminho)) return null;
  try {
    return JSON.parse(readFileSync(caminho, CODIFICACAO));
  } catch {
    return null;
  }
}

/**
 * Grava o banco so se o conteudo mudou (compara sem `geradoEm` e `sequencia`).
 * A troca e atomica: escreve num arquivo temporario e renomeia.
 * @param {string} caminho - Caminho do db.json.
 * @param {object} banco - Objeto do banco.
 * @returns {boolean} true se gravou, false se nada mudou.
 */
export function gravarSeMudou(caminho, banco) {
  const gravado = lerBancoGravado(caminho);
  const textoAtual = existsSync(caminho) ? readFileSync(caminho, CODIFICACAO) : null;
  const conteudoIgual = gravado && serializarSemVolateis(gravado) === serializarSemVolateis(banco);
  const formatoIgual = textoAtual === serializarBanco(gravado || {});
  if (conteudoIgual && formatoIgual) return false;

  const temporario = `${caminho}.tmp`;
  writeFileSync(temporario, serializarBanco(banco), CODIFICACAO);
  renameSync(temporario, caminho);
  return true;
}
