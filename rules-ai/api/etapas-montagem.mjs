// Montagem dos registros das etapas (SCHEMA.md 2.2 e 2.12 a 2.14, MIGRAR-TAREFAS-API.10):
// etapa, requisitos, invariantes, perguntas e os campos de secao das subtarefas. Funcoes puras;
// quem le o disco e grava o banco e o api/migrar-etapas.mjs.
import {
  dividirBlocos, juntarLinhas, lerCamposSubtarefa, lerCodigoMae, lerNomeArquivo,
  lerNumeroHashTitulo, lerRotulosCabecalho, lerTituloEtapa, lerTituloSubtarefa, tiparCampos,
  tipoDaSecao, acrescentar, ROTULO_TITULO_SECAO,
} from './etapas-leitor.mjs';
import { lerTabelaDaSecao, montarRegistrosTabela } from './etapas-tabelas.mjs';
import { extrairDependencias } from './migrar.mjs';

const ROTULO_ORIGEM_CARGA = 'Origem da carga';
const ROTULO_DEPENDE_SECAO = 'Depende de';
const ORIGEM_SEM_LINHA = 'seção da etapa sem linha no STATUS.md nem no task_complete.md; '
  + 'status desconhecido: pendente de revisão (MIGRAR-TAREFAS-API.10)';
const STATUS_SEM_LINHA = '👀 Pendente de revisão';
const PADRAO_SUFIXO_SUB = /\.\d+$/;
const COLECOES_TABELA = ['requisitos', 'invariantes', 'perguntas'];
const ROTULO_SECAO_CONJUNTA = 'Seção conjunta';
const MASCARA = '[mascarado]';
const PADRAO_SEGREDO = new RegExp(
  [
    '\\bsk-[A-Za-z0-9]{8,}', '\\btsk_\\w+', 'Bearer\\s+[\\w.-]{8,}', '\\bghp_\\w+',
    '\\b\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}\\b', '[\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)*\\.[A-Za-z]{2,}\\b',
  ].join('|'),
  'g',
);
const CAMPOS_DA_SECAO = [
  'nivelMotivo', 'modeloSecao', 'jevAiSuggestion', 'fonteNivel', 'proximoPasso', 'descricao',
  'criteriosAceitacao', 'criterioPronto', 'arquivos', 'estimativa', 'entrega', 'verificacao',
  'verificacaoRotulo', 'anotacao', 'extras',
];
const CAMPOS_PRIMEIRO_VENCE = [
  'nivelLido', 'nivelMotivo', 'effortLido', 'modeloSecao', 'jevAiSuggestion', 'fonteNivel',
  'dependeDeSecao', 'verificacaoRotulo',
];
const CAMPOS_TEXTO_UNIDOS = [
  'proximoPasso', 'descricao', 'criteriosAceitacao', 'criterioPronto', 'estimativa', 'entrega',
  'verificacao', 'anotacao',
];

/**
 * Texto de um valor com chaves em ordem, para comparar registros.
 * @param {*} valor - Qualquer valor JSON.
 * @returns {string} Texto estavel.
 */
function textoEstavel(valor) {
  const ordenar = (chave, item) => {
    const ehObjeto = item && typeof item === 'object' && !Array.isArray(item);
    if (!ehObjeto) return item;
    return Object.fromEntries(Object.keys(item).sort().map((nome) => [nome, item[nome]]));
  };
  return JSON.stringify(valor, ordenar);
}

/**
 * Mascara segredo e dado pessoal (INV-4) em todos os textos de um valor, contando as trocas.
 * @param {*} valor - Registro ou parte dele.
 * @param {{mascarados: number}} contagem - Contador (mutado).
 * @returns {*} Copia mascarada.
 */
export function mascarar(valor, contagem) {
  if (typeof valor === 'string') {
    return valor.replace(PADRAO_SEGREDO, () => {
      contagem.mascarados += 1;
      return MASCARA;
    });
  }
  if (Array.isArray(valor)) return valor.map((item) => mascarar(item, contagem));
  if (!valor || typeof valor !== 'object') return valor;
  return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, mascarar(v, contagem)]));
}

/**
 * Le as secoes de tabela de uma etapa e devolve os registros das tres colecoes.
 * @param {object[]} secoesTabela - Secoes `{tipo, linhas, secao}` das tres colecoes.
 * @param {object} contexto - Projeto, etapa, mae e ids de tarefas.
 * @returns {object} Registros por colecao.
 * @throws {Error} Se o numero de registros diferir do numero de linhas da tabela.
 */
function lerColecoesDaEtapa(secoesTabela, contexto) {
  const registros = { requisitos: [], invariantes: [], perguntas: [] };
  for (const { tipo, linhas, secao } of secoesTabela) {
    const lido = lerTabelaDaSecao(tipo, linhas);
    const montados = montarRegistrosTabela(tipo, lido.registros, {
      ...contexto, ordemInicial: registros[tipo].length + 1, vistos: contexto.vistos[tipo],
    });
    if (montados.length !== lido.linhasTabela) {
      const resumo = `${lido.linhasTabela} linhas, ${montados.length} registros`;
      throw new Error(`${contexto.etapaId} ${tipo}: ${resumo}`);
    }
    registros[tipo].push(...montados);
    secao.texto = lido.texto;
    secao.colecao = lido.registros.length > 0 ? tipo : null;
    secao.colunas = lido.colunas;
  }
  return registros;
}

/**
 * Monta o registro de secao geral (`etapas.secoes[]`).
 * @param {{titulo: string|null, linhas: string[], nivelTitulo: number|null}} bloco - Bloco lido.
 * @param {number} ordem - Posicao entre as secoes da etapa.
 * @returns {object} Secao no formato do SCHEMA.
 */
function montarSecao(bloco, ordem) {
  return {
    ordem,
    tipo: bloco.titulo === null ? 'corpo' : tipoDaSecao(bloco.titulo),
    titulo: bloco.titulo,
    texto: juntarLinhas(bloco.linhas),
    colecao: null,
    colunas: null,
    nivelTitulo: bloco.nivelTitulo,
  };
}

/**
 * Separa as secoes da etapa em gerais (com o corpo sem titulo) e de subtarefa.
 * @param {object} blocos - Resultado de `dividirBlocos`.
 * @returns {{gerais: object[], tabelas: object[], subs: object[]}} Secoes separadas.
 */
function separarSecoes(blocos) {
  const gerais = [];
  const tabelas = [];
  const subs = [];
  const semTitulo = [
    { titulo: null, linhas: blocos.preambulo, nivelTitulo: null },
    { titulo: null, linhas: blocos.cabecalho, nivelTitulo: null },
  ].filter((bloco) => juntarLinhas(bloco.linhas) !== '');
  for (const bloco of [...semTitulo, ...blocos.secoes]) {
    const sub = bloco.titulo === null ? null : lerTituloSubtarefa(bloco.titulo);
    if (sub) {
      subs.push({ ...sub, tituloCompleto: bloco.titulo, linhas: bloco.linhas });
      continue;
    }
    const secao = montarSecao(bloco, gerais.length + 1);
    gerais.push(secao);
    if (COLECOES_TABELA.includes(secao.tipo)) {
      tabelas.push({ tipo: secao.tipo, linhas: bloco.linhas, secao });
    }
  }
  return { gerais, tabelas, subs };
}

/**
 * Monta o cabecalho do registro da etapa (campos de 2.2 vindos do titulo e dos rotulos).
 * @param {{arquivo: string, blocos: object, projeto: string}} entrada - Arquivo lido.
 * @returns {object} Campos do cabecalho (id, numero, hash, tarefaMae...).
 */
function montarCabecalho(entrada) {
  const { arquivo, blocos, projeto, repetidos } = entrada;
  const nome = lerNomeArquivo(arquivo);
  // numero repetido entre arquivos: o nome do arquivo vira o codigo, para o id nao colidir
  if (repetidos?.has(nome.codigo)) nome.codigo = arquivo.replace(/\.md$/, '');
  const doTitulo = lerNumeroHashTitulo(blocos.tituloLinha);
  const rotulos = lerRotulosCabecalho(blocos.cabecalho);
  const codigoMae = lerCodigoMae(rotulos, nome.nome);
  return {
    id: `${projeto}:${nome.codigo}`, projeto, numero: doTitulo.numero ?? nome.numero,
    hash: doTitulo.hash || nome.hash, arquivo,
    tarefaMae: codigoMae ? `${projeto}:${codigoMae}` : null,
    titulo: lerTituloEtapa(blocos.tituloLinha), tituloLinha: blocos.tituloLinha,
    pedidoEm: rotulos['pedido em'] || null, criadaPor: rotulos['criada por'] || null,
    pedido: rotulos.pedido || null, objetivo: rotulos.objetivo || null,
    situacao: rotulos.situacao || rotulos.status || null,
    codigoMae, codigoEtapa: nome.codigo,
  };
}

/**
 * Le um arquivo de etapa: registro da etapa, registros das tabelas e secoes de subtarefa.
 * @param {{arquivo: string, texto: string}} fonte - Nome e conteudo do arquivo.
 * @param {{projeto: string, idsTarefas: Set<string>}} contexto - Projeto e ids existentes.
 * @returns {{etapa: object, colecoes: object, subs: object[]}} Leitura da etapa.
 */
export function lerEtapa(fonte, contexto) {
  const blocos = dividirBlocos(fonte.texto);
  const cabecalho = montarCabecalho({
    arquivo: fonte.arquivo, blocos, projeto: contexto.projeto, repetidos: contexto.repetidos,
  });
  const { codigoMae, codigoEtapa, ...campos } = cabecalho;
  const { gerais, tabelas, subs } = separarSecoes(blocos);
  const vistos = { requisitos: new Map(), invariantes: new Map(), perguntas: new Map() };
  const colecoes = lerColecoesDaEtapa(tabelas, {
    projeto: contexto.projeto, etapaCodigo: codigoEtapa, etapaId: campos.id, codigoMae,
    idsTarefas: contexto.idsTarefas, vistos,
  });
  const ehGrande = gerais.some((s) => s.tipo === 'requisitos' || s.tipo === 'invariantes');
  const etapa = {
    ...campos, ehGrande, secoes: gerais,
    requisitos: colecoes.requisitos.map((r) => r.id),
    invariantes: colecoes.invariantes.map((r) => r.id),
    perguntas: colecoes.perguntas.map((r) => r.id),
    subtarefas: [], arquivada: false, ordem: campos.numero, atualizadoEm: null,
  };
  return { etapa, colecoes, subs, codigoMae };
}

/**
 * Une os campos de duas secoes da mesma subtarefa (textos por quebra, extras somados).
 * @param {object|undefined} anterior - Campos ja acumulados.
 * @param {object} novos - Campos da secao nova.
 * @returns {object} Campos unidos.
 */
function unirCampos(anterior, novos) {
  if (!anterior) return novos;
  const unidos = { ...anterior };
  for (const campo of CAMPOS_TEXTO_UNIDOS) {
    unidos[campo] = acrescentar(anterior[campo], novos[campo]);
  }
  for (const [rotulo, texto] of Object.entries(novos.extras)) {
    unidos.extras = { ...unidos.extras, [rotulo]: acrescentar(unidos.extras[rotulo], texto) };
  }
  unidos.arquivos = [...anterior.arquivos, ...novos.arquivos];
  for (const campo of CAMPOS_PRIMEIRO_VENCE) {
    unidos[campo] = anterior[campo] ?? novos[campo];
  }
  return unidos;
}

/**
 * Le os campos de cada secao de subtarefa e os agrupa por id de tarefa.
 * @param {object[]} subs - Secoes de subtarefa de uma etapa.
 * @param {{projeto: string, etapaId: string, etapaArquivo: string}} contexto - Etapa de origem.
 * @param {Map<string, object>} acumulado - id -> campos (mutado).
 * @returns {string[]} Ids citados, na ordem das secoes.
 */
function acumularSubtarefas(subs, contexto, acumulado) {
  const ids = [];
  for (const sub of subs) {
    const campos = tiparCampos(lerCamposSubtarefa(sub.linhas));
    if (sub.codigos.length > 1) campos.extras[ROTULO_SECAO_CONJUNTA] = sub.tituloCompleto;
    for (const codigo of sub.codigos) {
      const id = `${contexto.projeto}:${codigo}`;
      const anterior = acumulado.get(id);
      const comTitulo = { ...campos, extras: { ...campos.extras }, tituloSecao: sub.tituloSecao,
        etapaId: contexto.etapaId, etapaArquivo: contexto.etapaArquivo };
      acumulado.set(id, anterior ? { ...unirCampos(anterior, comTitulo), etapaId: anterior.etapaId,
        etapaArquivo: anterior.etapaArquivo, tituloSecao: anterior.tituloSecao } : comTitulo);
      if (!ids.includes(id)) ids.push(id);
    }
  }
  return ids;
}

/**
 * Cria a tarefa de uma secao de subtarefa que nao tem linha no quadro (historico antigo): fica
 * pendente de revisao (nunca disponivel), e o motivo vai em `extras`.
 * @param {string} id - Id `<projeto>:<codigo>`.
 * @param {object} campos - Campos lidos da secao.
 * @param {{projeto: string, ordem: number}} contexto - Projeto e posicao de exibicao.
 * @returns {object} Tarefa com todas as chaves do SCHEMA 2.1 (texto da secao ainda nao aplicado).
 */
function criarTarefaSemLinha(id, campos, contexto) {
  const { projeto, ordem } = contexto;
  const codigo = id.slice(projeto.length + 1);
  const dependeDeTexto = campos.dependeDeSecao || '';
  const mae = `${projeto}:${codigo.replace(PADRAO_SUFIXO_SUB, '')}`;
  return {
    id, projeto, codigo, tipo: 'sub', mae,
    titulo: campos.tituloSecao || codigo, prioridade: '', modelo: '', nivel: null,
    nivelMotivo: null, effort: null, modeloSecao: null, jevAiSuggestion: null, fonteNivel: null,
    dependeDe: extrairDependencias(dependeDeTexto, projeto), dependeDeTexto,
    status: STATUS_SEM_LINHA, statusCodigo: 'aguardando_usuario', emUsoPor: null, reservadoEm: null,
    travaEspecial: false, naoReservavel: false, concluida: false, arquivada: false,
    disponivel: false, etapaId: campos.etapaId, etapaArquivo: campos.etapaArquivo,
    proximoPasso: '', descricao: '', criteriosAceitacao: '', criterioPronto: '', arquivos: [],
    estimativa: '', entrega: '', verificacao: '', verificacaoRotulo: null, anotacao: '',
    extras: { [ROTULO_ORIGEM_CARGA]: ORIGEM_SEM_LINHA }, ordem, criadaEm: null,
    concluidaEm: null, atualizadoEm: null,
  };
}

/**
 * Aplica os campos da secao a uma tarefa existente (campos da tabela ficam intactos).
 * @param {object} tarefa - Tarefa gravada.
 * @param {object} campos - Campos lidos da secao.
 * @param {{agora: string, avisos: string[]}} contexto - Data da carga e lista de avisos.
 * @returns {object} Tarefa atualizada.
 */
function aplicarNaTarefa(tarefa, campos, contexto) {
  const extras = { ...campos.extras };
  const origem = (tarefa.extras || {})[ROTULO_ORIGEM_CARGA];
  if (origem) extras[ROTULO_ORIGEM_CARGA] = origem;
  const tituloDifere = Boolean(campos.tituloSecao) && campos.tituloSecao !== tarefa.titulo;
  if (tituloDifere) extras[ROTULO_TITULO_SECAO] = campos.tituloSecao;
  const dependeSecao = (campos.dependeDeSecao || '').trim();
  const dependeTabela = (tarefa.dependeDeTexto || '').trim();
  const dependeDifere = dependeSecao !== '' && dependeSecao !== dependeTabela;
  if (dependeDifere) extras[ROTULO_DEPENDE_SECAO] = dependeSecao;
  const novos = Object.fromEntries(CAMPOS_DA_SECAO.map((campo) => [campo, campos[campo]]));
  const nova = { ...tarefa, ...novos, extras };
  if (!tarefa.nivel && campos.nivelLido) nova.nivel = campos.nivelLido;
  if (!tarefa.effort && campos.effortLido) nova.effort = campos.effortLido;
  if (!tarefa.etapaId) nova.etapaId = campos.etapaId;
  if (!tarefa.etapaArquivo) nova.etapaArquivo = campos.etapaArquivo;
  const etapaDifere = tarefa.etapaId && tarefa.etapaId !== campos.etapaId;
  if (etapaDifere) {
    contexto.avisos.push(`${tarefa.id}: secao em ${campos.etapaId}, tabela ${tarefa.etapaId}`);
  }
  const semMudanca = textoEstavel({ ...nova, atualizadoEm: null })
    === textoEstavel({ ...tarefa, atualizadoEm: null });
  return semMudanca ? tarefa : { ...nova, atualizadoEm: contexto.agora };
}

export { aplicarNaTarefa, acumularSubtarefas, criarTarefaSemLinha, textoEstavel };
