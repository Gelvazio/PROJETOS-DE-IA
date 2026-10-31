// Importador idempotente das etapas (tasks/etapas/*.md) para api/dados/<projeto>.json
// (SCHEMA.md 2.2 e 2.12 a 2.14, MIGRAR-TAREFAS-API.10): colecoes `etapas`, `requisitos`,
// `invariantes` e `perguntas`, e o texto de cada secao de subtarefa nos campos da `tarefas`.
// Nas tarefas so mexe nos campos que vem da secao; os da tabela (status, reserva...) ficam, e
// as demais colecoes (frentes, decisoes, pendencias...) nao sao tocadas.
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gravarSeMudou } from './serializador.mjs';
import { lerArquivo } from './migrar.mjs';
import { lerNomeArquivo } from './etapas-leitor.mjs';
import { extrairReferencias } from './etapas-tabelas.mjs';
import {
  acumularSubtarefas, aplicarNaTarefa, criarTarefaSemLinha, lerEtapa, mascarar, textoEstavel,
} from './etapas-montagem.mjs';

const PASTA_API = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(PASTA_API, '..');
const PASTA_DADOS = join(PASTA_API, 'dados');
const PROJETO_PADRAO = 'rules-ai';
const PASTA_ETAPAS_PADRAO = join(RAIZ, 'tasks', 'etapas');
const PADRAO_ARQUIVO_ETAPA = /^ETAPA-\d+.*\.md$/;
const COLECOES_TABELA = ['requisitos', 'invariantes', 'perguntas'];
const ORDEM_BASE_SEM_LINHA = 10000;

/**
 * Le os arquivos de etapa da pasta, em ordem de nome.
 * @param {string} pasta - Pasta tasks/etapas.
 * @returns {{arquivo: string, texto: string}[]} Arquivos lidos.
 * @throws {Error} Se a pasta nao existir.
 */
export function lerFontes(pasta) {
  if (!existsSync(pasta)) throw new Error(`Pasta de etapas nao encontrada: ${pasta}`);
  return readdirSync(pasta)
    .filter((arquivo) => PADRAO_ARQUIVO_ETAPA.test(arquivo))
    .sort()
    .map((arquivo) => ({ arquivo, texto: lerArquivo(join(pasta, arquivo)) }));
}

/**
 * Acha os codigos ETAPA-NNN usados por mais de um arquivo (etapas antigas sem hash).
 * @param {{arquivo: string}[]} fontes - Arquivos de etapa.
 * @returns {Set<string>} Codigos repetidos.
 */
function descobrirNumerosRepetidos(fontes) {
  const contagem = new Map();
  for (const { arquivo } of fontes) {
    const codigo = lerNomeArquivo(arquivo).codigo;
    contagem.set(codigo, (contagem.get(codigo) || 0) + 1);
  }
  return new Set([...contagem].filter(([, quantidade]) => quantidade > 1).map(([c]) => c));
}

/**
 * Le todas as etapas: registros das colecoes e campos de secao acumulados por subtarefa.
 * @param {object[]} fontes - Arquivos lidos.
 * @param {{projeto: string, idsTarefas: Set<string>}} contexto - Projeto e ids existentes.
 * @returns {{etapas: object[], colecoes: object, acumulado: Map, subsPorEtapa: Map}} Leitura.
 */
export function lerTodasEtapas(fontes, contexto) {
  const etapas = [];
  const colecoes = { requisitos: [], invariantes: [], perguntas: [] };
  const acumulado = new Map();
  const subsPorEtapa = new Map();
  const repetidos = descobrirNumerosRepetidos(fontes);
  for (const fonte of fontes) {
    const lida = lerEtapa(fonte, { ...contexto, repetidos });
    const repetida = etapas.some((etapa) => etapa.id === lida.etapa.id);
    if (repetida) throw new Error(`Etapa repetida: ${lida.etapa.id} (${fonte.arquivo})`);
    etapas.push(lida.etapa);
    for (const nome of COLECOES_TABELA) colecoes[nome].push(...lida.colecoes[nome]);
    const ids = acumularSubtarefas(lida.subs, {
      projeto: contexto.projeto, etapaId: lida.etapa.id, etapaArquivo: fonte.arquivo,
    }, acumulado);
    subsPorEtapa.set(lida.etapa.id, ids);
  }
  return { etapas, colecoes, acumulado, subsPorEtapa };
}

/**
 * Aplica os campos de secao nas tarefas do projeto (so as que ja existem na colecao).
 * @param {object[]} tarefas - Colecao tarefas inteira.
 * @param {Map<string, object>} acumulado - id -> campos de secao.
 * @param {{projeto: string, agora: string, avisos: string[]}} contexto - Carga.
 * @returns {{tarefas: object[], enriquecidas: number, semRegistro: string[]}} Resultado.
 */
export function aplicarSubtarefas(tarefas, acumulado, contexto) {
  let enriquecidas = 0;
  const usados = new Set();
  const atualizadas = tarefas.map((tarefa) => {
    const campos = tarefa.projeto === contexto.projeto ? acumulado.get(tarefa.id) : null;
    if (!campos) return tarefa;
    usados.add(tarefa.id);
    enriquecidas += 1;
    return aplicarNaTarefa(tarefa, campos, contexto);
  });
  const semRegistro = [...acumulado.keys()].filter((id) => !usados.has(id));
  return { tarefas: atualizadas, enriquecidas, semRegistro };
}

/**
 * Completa as etapas com a lista de subtarefas existentes, `arquivada` e `atualizadoEm`.
 * @param {object[]} etapas - Etapas lidas.
 * @param {{tarefas: object[], subsPorEtapa: Map, existentes: object[], agora: string}} contexto
 *   Tarefas ja enriquecidas, ids de subtarefa por etapa, etapas gravadas e data da carga.
 * @returns {object[]} Etapas finais.
 */
export function completarEtapas(etapas, contexto) {
  const porId = new Map(contexto.tarefas.map((tarefa) => [tarefa.id, tarefa]));
  const gravadas = new Map(contexto.existentes.map((etapa) => [etapa.id, etapa]));
  return etapas.map((etapa) => {
    const ids = contexto.subsPorEtapa.get(etapa.id) || [];
    const mae = etapa.tarefaMae ? porId.get(etapa.tarefaMae) : null;
    const completa = {
      ...etapa,
      subtarefas: ids.filter((id) => porId.has(id)),
      arquivada: Boolean(mae && mae.arquivada),
    };
    const anterior = gravadas.get(etapa.id);
    const igual = anterior && textoEstavel({ ...completa, atualizadoEm: null })
      === textoEstavel({ ...anterior, atualizadoEm: null });
    return { ...completa, atualizadoEm: igual ? anterior.atualizadoEm : contexto.agora };
  });
}

/**
 * Troca os registros do projeto numa colecao, mantendo os dos outros projetos.
 * @param {object[]|undefined} existentes - Colecao gravada.
 * @param {object[]} novos - Registros lidos do projeto.
 * @param {string} projeto - Id do projeto.
 * @returns {object[]} Colecao nova.
 */
function trocarDoProjeto(existentes, novos, projeto) {
  const outros = (existentes || []).filter((item) => item.projeto !== projeto);
  return [...outros, ...novos];
}

/**
 * Avisos de referencias a tarefas que nao existem (Cobre dos requisitos, mae das etapas).
 * @param {{etapas: object[], requisitos: object[]}} lidos - Registros lidos.
 * @param {{projeto: string, idsTarefas: Set<string>}} contexto - Projeto e ids existentes.
 * @returns {string[]} Avisos.
 */
function avisarReferencias(lidos, contexto) {
  const avisos = [];
  const maes = new Map(lidos.etapas.map((etapa) => [etapa.id, etapa.tarefaMae]));
  for (const etapa of lidos.etapas) {
    const semMae = !etapa.tarefaMae || !contexto.idsTarefas.has(etapa.tarefaMae);
    if (semMae) avisos.push(`${etapa.id}: mae ${etapa.tarefaMae} fora da colecao tarefas`);
  }
  for (const requisito of lidos.requisitos) {
    const codigoMae = (maes.get(requisito.etapa) || '').replace(`${contexto.projeto}:`, '');
    const citados = extrairReferencias(requisito.cobreTexto, { ...contexto, codigoMae });
    const faltam = citados.filter((id) => !requisito.cobre.includes(id));
    if (faltam.length > 0) avisos.push(`${requisito.id}: Cobre sem tarefa ${faltam.join(', ')}`);
  }
  return avisos;
}


/**
 * Cria as tarefas das secoes de subtarefa que nao tem linha no quadro (ordem a partir de
 * ORDEM_BASE_SEM_LINHA, na ordem das etapas, para nao colidir com a ordem do quadro).
 * @param {{acumulado: Map}} leitura - Leitura das etapas (campos por id).
 * @param {{projeto: string, idsTarefas: Set<string>}} contexto - Projeto e ids existentes.
 * @returns {object[]} Tarefas novas.
 */
function criarSemLinha(leitura, contexto) {
  const faltam = [...leitura.acumulado].filter(([id]) => !contexto.idsTarefas.has(id));
  return faltam.map(([id, campos], indice) => criarTarefaSemLinha(id, campos, {
    projeto: contexto.projeto, ordem: ORDEM_BASE_SEM_LINHA + indice + 1,
  }));
}

/**
 * Le e mascara (INV-4) as etapas, as colecoes de tabela e os campos de secao.
 * @param {object[]} fontes - Arquivos de etapa.
 * @param {{projeto: string, idsTarefas: Set<string>}} contexto - Projeto e ids existentes.
 * @returns {{lidas: object, mascarados: number}} Leitura mascarada e total de trocas.
 */
function lerMascarado(fontes, contexto) {
  const contagem = { mascarados: 0 };
  const lidas = lerTodasEtapas(fontes, contexto);
  const colecoes = {};
  for (const nome of COLECOES_TABELA) colecoes[nome] = mascarar(lidas.colecoes[nome], contagem);
  const acumulado = new Map(
    [...lidas.acumulado].map(([id, campos]) => [id, mascarar(campos, contagem)]),
  );
  return {
    lidas: { ...lidas, etapas: mascarar(lidas.etapas, contagem), colecoes, acumulado },
    mascarados: contagem.mascarados,
  };
}

/**
 * Monta o banco novo: tarefas enriquecidas e as quatro colecoes das etapas trocadas.
 * @param {object} banco - Banco gravado.
 * @param {{lidas: object, projeto: string, agora: string, avisos: string[]}} contexto - Carga.
 * @returns {{banco: object, aplicado: object, etapas: object[]}} Banco novo e partes.
 */
function montarBanco(banco, contexto) {
  const { lidas, projeto, agora, avisos } = contexto;
  const aplicado = aplicarSubtarefas(banco.tarefas || [], lidas.acumulado, contexto);
  const etapas = completarEtapas(lidas.etapas, {
    tarefas: aplicado.tarefas, subsPorEtapa: lidas.subsPorEtapa, agora,
    existentes: (banco.etapas || []).filter((etapa) => etapa.projeto === projeto),
  });
  const novo = { ...banco, tarefas: aplicado.tarefas };
  novo.etapas = trocarDoProjeto(banco.etapas, etapas, projeto);
  for (const nome of COLECOES_TABELA) {
    novo[nome] = trocarDoProjeto(banco[nome], lidas.colecoes[nome], projeto);
  }
  const sequencia = ((banco.meta && banco.meta.sequencia) || 0) + 1;
  novo.meta = { ...(banco.meta || {}), geradoEm: agora, sequencia };
  avisos.push(...avisarReferencias({ etapas, requisitos: lidas.colecoes.requisitos }, contexto));
  return { banco: novo, aplicado, etapas };
}

/**
 * Importa as etapas para o banco do projeto.
 * @param {{projeto: string, pasta: string, simular: boolean}} opcoes - Opcoes da execucao.
 * @returns {object} Resumo da carga (contagens, avisos e se gravou).
 * @throws {Error} Se o banco do projeto nao existir (a .7 cria).
 */
export function migrarEtapas(opcoes) {
  const { projeto, simular } = opcoes;
  const caminho = join(PASTA_DADOS, `${projeto}.json`);
  if (!existsSync(caminho)) throw new Error(`Banco nao encontrado: ${caminho} (rode a .7 antes)`);
  const banco = JSON.parse(readFileSync(caminho, 'utf8'));
  const tarefasDoProjeto = (banco.tarefas || []).filter((tarefa) => tarefa.projeto === projeto);
  const idsTarefas = new Set(tarefasDoProjeto.map((tarefa) => tarefa.id));
  const fontes = lerFontes(opcoes.pasta);
  const semLinha = criarSemLinha(lerTodasEtapas(fontes, { projeto, idsTarefas }), {
    projeto, idsTarefas,
  });
  for (const tarefa of semLinha) idsTarefas.add(tarefa.id);
  const { lidas, mascarados } = lerMascarado(fontes, { projeto, idsTarefas });
  const avisos = [];
  const agora = new Date().toISOString();
  const comSemLinha = { ...banco, tarefas: [...(banco.tarefas || []), ...semLinha] };
  const montado = montarBanco(comSemLinha, { lidas, projeto, agora, avisos, idsTarefas });
  let gravou = false;
  if (!simular) {
    mkdirSync(PASTA_DADOS, { recursive: true });
    gravou = gravarSeMudou(caminho, montado.banco);
  }
  return {
    projeto, caminho, simular, gravou, arquivos: fontes.length, etapas: montado.etapas,
    criadasSemLinha: semLinha.length,
    colecoes: lidas.colecoes, aplicado: montado.aplicado, avisos, mascarados,
  };
}

/**
 * Le as opcoes da linha de comando.
 * @param {string[]} argumentos - Argumentos depois do script.
 * @returns {{projeto: string, pasta: string, simular: boolean}} Opcoes.
 * @throws {Error} Se uma opcao com valor vier sem valor.
 */
export function lerOpcoes(argumentos) {
  const opcoes = { projeto: PROJETO_PADRAO, pasta: PASTA_ETAPAS_PADRAO, simular: false };
  for (let i = 0; i < argumentos.length; i += 1) {
    const argumento = argumentos[i];
    if (argumento === '--dry-run') opcoes.simular = true;
    if (argumento !== '--projeto' && argumento !== '--pasta') continue;
    const valor = argumentos[i + 1];
    if (!valor || valor.startsWith('--')) throw new Error(`${argumento} exige um valor`);
    if (argumento === '--projeto') opcoes.projeto = valor;
    if (argumento === '--pasta') opcoes.pasta = resolve(valor);
    i += 1;
  }
  return opcoes;
}

/**
 * Escreve o resumo da carga na saida padrao.
 * @param {object} resumo - Resultado de `migrarEtapas`.
 * @returns {void}
 */
function imprimirResumo(resumo) {
  let situacao = resumo.gravou ? 'gravado' : 'sem mudanca';
  if (resumo.simular) situacao = 'simulado (nada gravado)';
  const subtarefas = resumo.etapas.reduce((total, etapa) => total + etapa.subtarefas.length, 0);
  const secoes = resumo.etapas.reduce((total, etapa) => total + etapa.secoes.length, 0);
  console.log(`projeto: ${resumo.projeto}`);
  console.log(`arquivo: ${resumo.caminho}`);
  console.log(`arquivos de etapa lidos: ${resumo.arquivos}`);
  console.log(`etapas: ${resumo.etapas.length} (secoes gerais: ${secoes})`);
  for (const nome of COLECOES_TABELA) console.log(`${nome}: ${resumo.colecoes[nome].length}`);
  console.log(`subtarefas ligadas as etapas: ${subtarefas}`);
  console.log(`tarefas com texto de secao aplicado: ${resumo.aplicado.enriquecidas}`);
  console.log(`tarefas criadas sem linha no quadro (pendentes de revisao): ${resumo.criadasSemLinha}`);
  console.log(`secoes de subtarefa sem tarefa na colecao: ${resumo.aplicado.semRegistro.length}`);
  for (const id of resumo.aplicado.semRegistro) console.log(`  - ${id}`);
  console.log(`textos mascarados (INV-4): ${resumo.mascarados}`);
  console.log(`avisos: ${resumo.avisos.length}`);
  for (const aviso of resumo.avisos) console.log(`  - ${aviso}`);
  console.log(`resultado: ${situacao}`);
}

/**
 * Ponto de entrada: le as opcoes, importa e imprime o resumo.
 * @returns {void}
 */
function principal() {
  try {
    imprimirResumo(migrarEtapas(lerOpcoes(process.argv.slice(2))));
  } catch (erro) {
    process.stderr.write(`Erro: ${erro.message}\n`);
    process.exitCode = 1;
  }
}

const arquivoAtual = fileURLToPath(import.meta.url);
const foiChamadoDireto = process.argv[1] && resolve(process.argv[1]) === arquivoAtual;
if (foiChamadoDireto) principal();
