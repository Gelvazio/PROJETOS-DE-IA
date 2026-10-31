// Importador idempotente do quadro para api/dados/<projeto>.json (SCHEMA.md, MIGRAR-TAREFAS-API.7).
// Carrega as tarefas abertas ("📌 Tarefas" de tasks/STATUS.md, .7) e as concluidas
// (tasks/task_complete.md, .8), que entram com `arquivada: true`.
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gravarSeMudou } from './serializador.mjs';

const PASTA_API = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(PASTA_API, '..');
const PASTA_DADOS = join(PASTA_API, 'dados');
const PROJETO_PADRAO = 'rules-ai';
const FONTE_PADRAO = join(RAIZ, 'tasks', 'STATUS.md');
const ARQUIVO_CONCLUIDAS = 'task_complete.md';
const COLUNAS_CONCLUIDAS = [
  'Tarefa', 'Título', 'Prioridade', 'Modelo', 'Depende de', 'Status', 'Em uso por', 'Etapa',
];
const PADRAO_SEPARADOR = /^\|[\s|:-]+\|?$/;
const TITULO_TAREFAS = '## 📌 Tarefas';
const COLUNAS_OBRIGATORIAS = ['Tarefa', 'Status'];
const CODIGOS_STATUS = [
  ['✅', 'concluido'],
  ['🔄', 'em_execucao'],
  ['⛔', 'bloqueado'],
  ['👀', 'aguardando_usuario'],
  ['❌', 'cancelada'],
  ['⬜', 'pendente'],
];
const SEM_VALOR = new Set(['', '—', '-']);
const MARCA_PIPE = '\u0000';
const MARCA_TRAVA = '🔒';
const PADRAO_SUB = /\.\d+$/;
const PADRAO_ID_DEPENDENCIA = /^[A-Z][A-Z0-9-]*(\.\d+)?$/;
const PADRAO_NIVEL = /\b(LEVE|MEDIO|PESADO)\b/;
const PADRAO_EFFORT = /effort\s+(\w+)/;
const PADRAO_ARQUIVO_ETAPA = /\(etapas\/([^)]+\.md)\)/;
const PADRAO_NUMERO_ETAPA = /^(ETAPA-\d+)/;
const PADRAO_SUFIXO_TITULO = /\s*·\s*`([^`]*)`\s*$/;
const PADRAO_DESDE = /\(desde (\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2})\)/;
const FUSO = '-03:00';
const VERSAO_SCHEMA = '1';
const CAMPOS_PRESERVADOS = [
  'nivelMotivo', 'modeloSecao', 'jevAiSuggestion', 'fonteNivel', 'proximoPasso', 'descricao',
  'criteriosAceitacao', 'criterioPronto', 'arquivos', 'estimativa', 'entrega', 'verificacao',
  'verificacaoRotulo', 'anotacao', 'extras', 'criadaEm',
];

/**
 * Le um arquivo de texto em UTF-8 com fim de linha LF.
 * @param {string} caminho - Caminho do arquivo.
 * @returns {string} Conteudo do arquivo.
 */
export function lerArquivo(caminho) {
  return readFileSync(caminho, 'utf8').replace(/\r\n/g, '\n');
}

/**
 * Divide uma linha de tabela Markdown em celulas (ignora pipes escapados).
 * @param {string} linha - Linha iniciada por "|".
 * @returns {string[]} Celulas sem espacos nas pontas.
 */
export function dividirCelulas(linha) {
  const partes = linha.replaceAll('\\|', MARCA_PIPE).split('|');
  return partes.slice(1, -1).map((parte) => parte.replaceAll(MARCA_PIPE, '|').trim());
}

/**
 * Pega as linhas da primeira tabela depois de um titulo.
 * @param {string} texto - Conteudo do arquivo.
 * @param {string} titulo - Titulo da secao.
 * @returns {string[]} Linhas da tabela (cabecalho, separador e dados).
 */
export function recortarTabela(texto, titulo) {
  const inicio = texto.indexOf(titulo);
  if (inicio < 0) throw new Error(`Secao nao encontrada: ${titulo}`);

  const tabela = [];
  for (const linha of texto.slice(inicio + titulo.length).split('\n')) {
    const estaNaTabela = linha.startsWith('|');
    if (!estaNaTabela && tabela.length > 0) break;
    if (estaNaTabela) tabela.push(linha);
  }
  return tabela;
}

/**
 * Le a tabela de tarefas como lista de objetos coluna -> texto.
 * @param {string} texto - Conteudo do STATUS.md.
 * @returns {object[]} Linhas de dados na ordem do quadro.
 * @throws {Error} Se faltar a tabela, as colunas Tarefa/Status ou uma linha estiver curta.
 */
export function lerTabelaTarefas(texto) {
  const linhas = recortarTabela(texto, TITULO_TAREFAS);
  if (linhas.length === 0) throw new Error('Tabela de tarefas vazia ou ausente');

  const cabecalho = dividirCelulas(linhas[0]);
  const faltando = COLUNAS_OBRIGATORIAS.filter((coluna) => !cabecalho.includes(coluna));
  if (faltando.length > 0) throw new Error(`Faltam colunas: ${faltando.join(', ')}`);

  return linhas.slice(2).map((linha, indice) => {
    const celulas = dividirCelulas(linha);
    if (celulas.length < cabecalho.length) {
      throw new Error(`Linha ${indice + 1} da tabela com menos colunas que o cabecalho`);
    }
    return Object.fromEntries(cabecalho.map((nome, posicao) => [nome, celulas[posicao]]));
  });
}

/**
 * Obtem o codigo de status a partir do emoji da coluna.
 * @param {string} status - Texto da coluna Status.
 * @returns {string} Codigo (pendente se nenhum emoji for reconhecido).
 */
export function obterStatusCodigo(status) {
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
 * Converte "(desde AAAA-MM-DD HH:MM)" em data ISO com fuso.
 * @param {string|null} emUsoPor - Texto da coluna Em uso por.
 * @returns {string|null} Data ISO ou null.
 */
export function extrairReservadoEm(emUsoPor) {
  const achado = emUsoPor ? emUsoPor.match(PADRAO_DESDE) : null;
  return achado ? `${achado[1]}T${achado[2]}:${achado[3]}:00${FUSO}` : null;
}

/**
 * Converte o texto "Depende de" em ids compostos (projeto:codigo).
 * @param {string} texto - Celula "Depende de".
 * @param {string} projeto - Id do projeto.
 * @returns {string[]} Ids encontrados.
 */
export function extrairDependencias(texto, projeto) {
  const limpo = texto.replace(/\*\*|`|\([^)]*\)/g, ' ');
  const codigos = limpo.split(/[\s,;/]+/).filter((item) => PADRAO_ID_DEPENDENCIA.test(item));
  return codigos.map((codigo) => `${projeto}:${codigo}`);
}

/**
 * Extrai id e arquivo da etapa a partir da celula "Etapa".
 * @param {string} celula - Texto da coluna Etapa.
 * @param {string} projeto - Id do projeto.
 * @returns {{etapaId: string|null, etapaArquivo: string|null}} Referencia da etapa.
 */
export function extrairEtapa(celula, projeto) {
  const arquivo = capturar(celula, PADRAO_ARQUIVO_ETAPA);
  const numero = arquivo ? capturar(arquivo, PADRAO_NUMERO_ETAPA) : null;
  return { etapaId: numero ? `${projeto}:${numero}` : null, etapaArquivo: arquivo };
}

/**
 * Campos fixos de uma tarefa recem-lida (sem os que vem da tabela).
 * @returns {object} Valores vazios do SCHEMA, secao 2.1.
 */
function camposVazios() {
  return {
    nivelMotivo: null, modeloSecao: null, jevAiSuggestion: null, fonteNivel: null,
    proximoPasso: '', descricao: '', criteriosAceitacao: '', criterioPronto: '',
    arquivos: [], estimativa: '', entrega: '', verificacao: '', verificacaoRotulo: null,
    anotacao: '', extras: {}, criadaEm: null, concluidaEm: null, arquivada: false,
  };
}

/**
 * Converte uma linha da tabela em tarefa (sem `disponivel` e sem `atualizadoEm`).
 * @param {object} linha - Linha coluna -> texto.
 * @param {{projeto: string, ordem: number}} contexto - Projeto e posicao no quadro.
 * @returns {object|null} Tarefa ou null se a linha nao tiver codigo.
 */
export function converterLinha(linha, contexto) {
  const { projeto, ordem } = contexto;
  const codigo = (linha.Tarefa || '').replaceAll('**', '').replace(/\s+/g, '');
  if (!codigo) return null;

  const ehSub = PADRAO_SUB.test(codigo) && !linha.Tarefa.includes('**');
  const titulo = (linha.Título || '').replaceAll('**', '');
  const sufixo = capturar(titulo, PADRAO_SUFIXO_TITULO) || '';
  const modelo = linha.Modelo || '';
  const status = linha.Status;
  const uso = linha['Em uso por'] || '';
  const estaSemReserva = SEM_VALOR.has(uso) || uso.startsWith('— (');
  const statusCodigo = obterStatusCodigo(status);
  const textoNivel = `${modelo} ${sufixo}`;
  return {
    id: `${projeto}:${codigo}`,
    projeto,
    codigo,
    tipo: ehSub ? 'sub' : 'mae',
    mae: `${projeto}:${ehSub ? codigo.replace(PADRAO_SUB, '') : codigo}`,
    titulo: titulo.replace(PADRAO_SUFIXO_TITULO, '').trim(),
    prioridade: linha.Prioridade || '',
    modelo,
    nivel: capturar(textoNivel, PADRAO_NIVEL),
    effort: capturar(textoNivel, PADRAO_EFFORT),
    dependeDe: extrairDependencias(linha['Depende de'] || '', projeto),
    dependeDeTexto: linha['Depende de'] || '',
    status,
    statusCodigo,
    emUsoPor: estaSemReserva ? null : uso,
    reservadoEm: estaSemReserva ? null : extrairReservadoEm(uso),
    travaEspecial: status.includes(MARCA_TRAVA) || uso.includes(MARCA_TRAVA),
    naoReservavel: uso.startsWith('— ('),
    concluida: statusCodigo === 'concluido',
    ...extrairEtapa(linha.Etapa || '', projeto),
    ...camposVazios(),
    ordem,
  };
}

/**
 * Le as linhas de task_complete.md (colunas fixas, com ou sem cabecalho) como objetos.
 * @param {string} texto - Conteudo do task_complete.md.
 * @returns {object[]} Linhas de dados na ordem do arquivo.
 * @throws {Error} Se uma linha tiver menos colunas que o esperado.
 */
export function lerTabelaConcluidas(texto) {
  const linhas = texto.split('\n').filter((linha) => linha.startsWith('|'));
  const dados = linhas.filter((linha) => !PADRAO_SEPARADOR.test(linha));
  const semCabecalho = dados.filter((linha) => dividirCelulas(linha)[0] !== 'Tarefa');
  return semCabecalho.map((linha, indice) => {
    const celulas = dividirCelulas(linha);
    if (celulas.length < COLUNAS_CONCLUIDAS.length) {
      throw new Error(`Linha ${indice + 1} de task_complete.md com menos colunas que o esperado`);
    }
    return Object.fromEntries(COLUNAS_CONCLUIDAS.map((nome, posicao) => [nome, celulas[posicao]]));
  });
}

/**
 * Garante id unico: repetidos recebem sufixo "#N" e um aviso no stderr.
 * @param {object[]} tarefas - Tarefas na ordem de leitura.
 * @returns {object[]} As mesmas tarefas, com ids unicos.
 */
export function garantirIdsUnicos(tarefas) {
  const vistos = new Map();
  for (const tarefa of tarefas) {
    const vezes = (vistos.get(tarefa.id) || 0) + 1;
    vistos.set(tarefa.id, vezes);
    if (vezes === 1) continue;
    process.stderr.write(`Aviso: id repetido ${tarefa.id}\n`);
    tarefa.id = `${tarefa.id}#${vezes}`;
  }
  return tarefas;
}

/**
 * Calcula `disponivel` e conta dependencias ausentes. Dependencia que nao esta na lista e
 * tratada como concluida: concluidas saem do STATUS.md (a subtarefa .8 as carrega).
 * @param {object[]} tarefas - Tarefas do projeto (abertas e ja carregadas).
 * @returns {{tarefas: object[], dependenciasAusentes: number}} Tarefas e contagem.
 */
export function calcularDisponibilidade(tarefas) {
  const porId = new Map(tarefas.map((tarefa) => [tarefa.id, tarefa]));
  let dependenciasAusentes = 0;
  const calculadas = tarefas.map((tarefa) => {
    const estaFechada = (dep) => {
      const alvo = porId.get(dep);
      if (!alvo) dependenciasAusentes += 1;
      return !alvo || alvo.concluida || alvo.statusCodigo === 'cancelada';
    };
    const estaLivre = tarefa.tipo === 'sub' && tarefa.statusCodigo === 'pendente';
    const semReserva = tarefa.emUsoPor === null && !tarefa.travaEspecial;
    const disponivel = estaLivre && semReserva && tarefa.dependeDe.every(estaFechada);
    return { ...tarefa, disponivel };
  });
  return { tarefas: calculadas, dependenciasAusentes };
}

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
 * Mescla uma tarefa lida do quadro com a ja gravada: a tabela manda nos campos dela, e o que
 * outras cargas enriqueceram (descricao, entrega...) e preservado. Sem mudanca, mantem
 * `atualizadoEm`.
 * @param {object} nova - Tarefa lida do quadro.
 * @param {object|undefined} existente - Tarefa gravada com o mesmo id.
 * @param {string} agora - Data ISO da carga.
 * @returns {object} Tarefa mesclada.
 */
export function mesclarTarefa(nova, existente, agora) {
  if (!existente) return { ...nova, atualizadoEm: agora };

  const preservados = Object.fromEntries(
    CAMPOS_PRESERVADOS.filter((campo) => campo in existente).map((c) => [c, existente[c]]),
  );
  const mesclada = { ...existente, ...nova, ...preservados };
  const atualizadoAntes = existente.atualizadoEm || agora;
  const semMudanca = textoEstavel({ ...mesclada, atualizadoEm: atualizadoAntes })
    === textoEstavel(existente);
  return { ...mesclada, atualizadoEm: semMudanca ? atualizadoAntes : agora };
}

/**
 * Mescla as tarefas lidas na colecao `tarefas`, so do projeto informado.
 * @param {object[]} existentes - Colecao tarefas ja gravada (todos os projetos).
 * @param {object[]} lidas - Tarefas lidas do quadro (com ids unicos).
 * @param {{projeto: string, agora: string}} contexto - Projeto e data da carga.
 * @returns {{tarefas: object[], ausentes: string[], dependenciasAusentes: number}} Resultado.
 */
export function mesclarTarefas(existentes, lidas, contexto) {
  const { projeto, agora } = contexto;
  const doProjeto = new Map(
    existentes.filter((item) => item.projeto === projeto).map((item) => [item.id, item]),
  );
  const outros = existentes.filter((item) => item.projeto !== projeto);
  const idsLidos = new Set(lidas.map((item) => item.id));
  const ausentes = [...doProjeto.values()]
    .filter((item) => !idsLidos.has(item.id) && !item.concluida && !item.arquivada)
    .map((item) => item.id);
  const lidasMescladas = lidas.map((item) => mesclarTarefa(item, doProjeto.get(item.id), agora));
  const mantidas = [...doProjeto.values()].filter((item) => !idsLidos.has(item.id));
  const antes = [...lidasMescladas, ...mantidas];
  const calculo = calcularDisponibilidade(antes);
  const recalculadas = calculo.tarefas.map((item, i) => atualizarDisponivel(item, antes[i], agora));
  return {
    tarefas: [...outros, ...recalculadas],
    ausentes,
    dependenciasAusentes: calculo.dependenciasAusentes,
  };
}

/**
 * Aplica o novo `disponivel`, atualizando `atualizadoEm` so se o valor mudou.
 * @param {object} calculada - Tarefa com `disponivel` recalculado.
 * @param {object} antes - Tarefa antes do recalculo.
 * @param {string} agora - Data ISO da carga.
 * @returns {object} Tarefa final.
 */
function atualizarDisponivel(calculada, antes, agora) {
  if (calculada.disponivel === antes.disponivel) return calculada;
  const jaTinhaAtualizacaoNova = antes.atualizadoEm === agora;
  return jaTinhaAtualizacaoNova ? calculada : { ...calculada, atualizadoEm: agora };
}

/**
 * Atualiza o registro `meta` (id 1) com os totais calculados das tarefas.
 * @param {object} banco - Banco ja com `tarefas` mescladas.
 * @param {string} agora - Data ISO da carga.
 * @returns {object} Registro meta novo.
 */
export function montarMeta(banco, agora) {
  const anterior = banco.meta && !Array.isArray(banco.meta) ? banco.meta : {};
  const totaisPorProjeto = {};
  for (const tarefa of banco.tarefas) {
    const vazio = { tarefas: 0, concluidas: 0, disponiveis: 0 };
    const total = totaisPorProjeto[tarefa.projeto] || vazio;
    total.tarefas += 1;
    if (tarefa.concluida) total.concluidas += 1;
    if (tarefa.disponivel) total.disponiveis += 1;
    totaisPorProjeto[tarefa.projeto] = total;
  }
  return {
    id: 1,
    versaoSchema: VERSAO_SCHEMA,
    geradoEm: agora,
    totalTarefas: banco.tarefas.length,
    totalConcluidas: banco.tarefas.filter((item) => item.concluida).length,
    totalDisponiveis: banco.tarefas.filter((item) => item.disponivel).length,
    totaisPorProjeto,
    sequencia: (anterior.sequencia || 0) + 1,
  };
}

/**
 * Le o banco do projeto, ou um banco vazio se o arquivo nao existir.
 * @param {string} caminho - Caminho de api/dados/<projeto>.json.
 * @returns {object} Banco com ao menos `tarefas`.
 */
export function lerBancoOuVazio(caminho) {
  if (!existsSync(caminho)) return { tarefas: [] };
  const banco = JSON.parse(readFileSync(caminho, 'utf8'));
  return { ...banco, tarefas: banco.tarefas || [] };
}

/**
 * Le o quadro e devolve as tarefas convertidas, com ids unicos.
 * @param {string} caminhoFonte - Caminho do STATUS.md.
 * @param {string} projeto - Id do projeto.
 * @returns {object[]} Tarefas na ordem do quadro.
 */
export function lerTarefasDoQuadro(caminhoFonte, projeto) {
  const linhas = lerTabelaTarefas(lerArquivo(caminhoFonte));
  const convertidas = linhas.map((linha, i) => converterLinha(linha, { projeto, ordem: i + 1 }));
  const tarefas = convertidas.filter((tarefa) => tarefa !== null);
  if (tarefas.length !== linhas.length) throw new Error('Linha de tarefa sem codigo no quadro');
  return garantirIdsUnicos(tarefas);
}

/**
 * Le task_complete.md e devolve as tarefas concluidas, ja marcadas como arquivadas.
 * @param {string} caminho - Caminho do task_complete.md (arquivo ausente = nenhuma).
 * @param {{projeto: string, primeiraOrdem: number}} contexto - Projeto e ordem inicial.
 * @returns {object[]} Tarefas arquivadas na ordem do arquivo.
 * @throws {Error} Se uma linha nao tiver codigo.
 */
export function lerTarefasConcluidas(caminho, contexto) {
  if (!existsSync(caminho)) return [];
  const linhas = lerTabelaConcluidas(lerArquivo(caminho));
  const convertidas = linhas.map((linha, i) => converterLinha(linha, {
    projeto: contexto.projeto, ordem: contexto.primeiraOrdem + i,
  }));
  const temLinhaSemCodigo = convertidas.some((tarefa) => tarefa === null);
  if (temLinhaSemCodigo) throw new Error('Linha sem codigo no task_complete.md');
  return convertidas.map((tarefa) => ({ ...tarefa, arquivada: true }));
}

/**
 * Importa as tarefas abertas e concluidas do quadro para o banco do projeto.
 * @param {{projeto: string, fonte: string, simular: boolean}} opcoes - Opcoes da execucao.
 * @returns {object} Resumo da carga.
 */
export function migrarTarefas(opcoes) {
  const { projeto, fonte, simular } = opcoes;
  const caminho = join(PASTA_DADOS, `${projeto}.json`);
  const agora = new Date().toISOString();
  const abertas = lerTarefasDoQuadro(fonte, projeto);
  const concluidas = lerTarefasConcluidas(join(dirname(fonte), ARQUIVO_CONCLUIDAS), {
    projeto, primeiraOrdem: abertas.length + 1,
  });
  const lidas = garantirIdsUnicos([...abertas, ...concluidas]);
  const banco = lerBancoOuVazio(caminho);
  const quantidadeAntes = banco.tarefas.filter((item) => item.projeto === projeto).length;
  const resultado = mesclarTarefas(banco.tarefas, lidas, { projeto, agora });
  const novoBanco = { ...banco, tarefas: resultado.tarefas };
  novoBanco.meta = montarMeta(novoBanco, agora);
  let gravou = false;
  if (!simular) {
    mkdirSync(PASTA_DADOS, { recursive: true });
    gravou = gravarSeMudou(caminho, novoBanco);
  }
  return {
    projeto, caminho, lidas: lidas.length, lidasConcluidas: concluidas.length,
    quantidadeAntes, gravou, simular,
    totalProjeto: resultado.tarefas.filter((item) => item.projeto === projeto).length,
    ausentes: resultado.ausentes,
    dependenciasAusentes: resultado.dependenciasAusentes,
  };
}

/**
 * Le as opcoes da linha de comando.
 * @param {string[]} argumentos - Argumentos depois do script.
 * @returns {{projeto: string, fonte: string, simular: boolean}} Opcoes.
 * @throws {Error} Se uma opcao com valor vier sem valor.
 */
export function lerOpcoes(argumentos) {
  const opcoes = { projeto: PROJETO_PADRAO, fonte: FONTE_PADRAO, simular: false };
  for (let i = 0; i < argumentos.length; i += 1) {
    const argumento = argumentos[i];
    if (argumento === '--dry-run') opcoes.simular = true;
    if (argumento !== '--projeto' && argumento !== '--fonte') continue;
    const valor = argumentos[i + 1];
    if (!valor || valor.startsWith('--')) throw new Error(`${argumento} exige um valor`);
    if (argumento === '--projeto') opcoes.projeto = valor;
    if (argumento === '--fonte') opcoes.fonte = resolve(valor);
    i += 1;
  }
  return opcoes;
}

/**
 * Escreve o resumo da carga na saida padrao.
 * @param {object} resumo - Resultado de `migrarTarefas`.
 * @returns {void}
 */
function imprimirResumo(resumo) {
  let situacao = resumo.gravou ? 'gravado' : 'sem mudanca';
  if (resumo.simular) situacao = 'simulado (nada gravado)';
  console.log(`projeto: ${resumo.projeto}`);
  console.log(`arquivo: ${resumo.caminho}`);
  console.log(`tarefas lidas do quadro (abertas + concluidas): ${resumo.lidas}`);
  console.log(`  das quais concluidas (task_complete.md): ${resumo.lidasConcluidas}`);
  console.log(`tarefas do projeto antes: ${resumo.quantidadeAntes}`);
  console.log(`tarefas do projeto depois: ${resumo.totalProjeto}`);
  console.log(`dependencias fora da colecao (tratadas concluidas): ${resumo.dependenciasAusentes}`);
  console.log(`ausentes do quadro (mantidas, nao apagadas): ${resumo.ausentes.length}`);
  for (const id of resumo.ausentes) console.log(`  - ${id}`);
  console.log(`resultado: ${situacao}`);
}

/**
 * Ponto de entrada: le as opcoes, importa e imprime o resumo.
 * @returns {void}
 */
function principal() {
  try {
    imprimirResumo(migrarTarefas(lerOpcoes(process.argv.slice(2))));
  } catch (erro) {
    process.stderr.write(`Erro: ${erro.message}\n`);
    process.exitCode = 1;
  }
}

const arquivoAtual = fileURLToPath(import.meta.url);
const foiChamadoDireto = process.argv[1] && resolve(process.argv[1]) === arquivoAtual;
if (foiChamadoDireto) principal();
