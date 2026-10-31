/**
 * Leitura do quadro de tarefas (`tasks/STATUS.md`) e cálculo das subtarefas livres.
 *
 * Só funções puras: este módulo não lê disco, não usa Git e não escreve nada.
 * A regra de "subtarefa livre" vem do desenho da etapa 009 (GERENCIADOR-GLOBAL.1).
 * Lê os dois formatos do STATUS.md (C55): a tabela legada e o índice simplificado.
 */

import {
  ErroFormatoQuadro, FORMATOS, detectarFormato, lerIndiceSimplificado,
} from '../jev/quadro-formato.mjs';

const EMOJI_PENDENTE = '⬜';
const EMOJI_EM_EXECUCAO = '🔄';
const EMOJI_CONCLUIDO = '✅';
const EMOJIS_PRIORIDADE = ['🔴', '🟠', '🟡', '🟢'];
const POSICAO_PRIORIDADE_DESCONHECIDA = EMOJIS_PRIORIDADE.length;

const BARRA_PROTEGIDA = '\u0000';
const PADRAO_SEPARADOR_TABELA = /^:?-{3,}:?$/;
const PADRAO_SECAO_TAREFAS = /^##\s+.*\bTarefas\b/i;
const PADRAO_NOVA_SECAO = /^##\s/;
const PADRAO_NIVEL = /\b(LEVE|MEDIO|PESADO)\b/;
const PADRAO_NIVEL_NO_TITULO = /`(?:[^`]*\s)?(LEVE|MEDIO|PESADO)\b[^`]*`/;
const PADRAO_SO_MODELOS = /\bso\s+(.+?)(?:\s+·|$)/i;
const PADRAO_SEPARA_MODELOS = /\s*(?:,|\bou\b|\/)\s*/i;
const PADRAO_ID_VALIDO = /^[#\w]/;
const PADRAO_NUVEM = /\(nuvem\)/i;
const TRAVESSOES = new Set(['', '—', '-', '–']);

const NOMES_COLUNAS = {
  id: 'tarefa',
  titulo: 'titulo',
  prioridade: 'prioridade',
  modelo: 'modelo',
  dependencias: 'depende de',
  status: 'status',
  emUsoPor: 'em uso por',
};
const COLUNAS_OBRIGATORIAS = ['id', 'status', 'emUsoPor'];

export const POLITICA_DEPENDENCIA_PRONTA = 'pronta';
export const POLITICA_DEPENDENCIA_BLOQUEIA = 'bloqueia';

/**
 * Remove acentos e cedilha de um texto (para comparar sem depender da grafia).
 * @param {string} texto - Texto de entrada.
 * @returns {string} Texto sem acentos.
 */
export function semAcento(texto) {
  return String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Limpa uma célula da tabela: tira negrito e espaços nas pontas.
 * @param {string} celula - Texto cru da célula.
 * @returns {string} Texto limpo.
 */
function limparCelula(celula) {
  return String(celula ?? '').replace(/\*\*/g, '').trim();
}

/**
 * Divide uma linha de tabela Markdown em células, respeitando `\|` dentro do texto.
 * @param {string} linha - Linha que começa com `|`.
 * @returns {string[]} Células, sem as barras das pontas.
 */
function dividirCelulas(linha) {
  const interno = linha.trim().replace(/^\|/, '').replace(/\|$/, '');
  const protegido = interno.replaceAll('\\|', BARRA_PROTEGIDA);
  return protegido.split('|').map((celula) => celula.replaceAll(BARRA_PROTEGIDA, '|').trim());
}

/**
 * Diz se as células formam a linha separadora (`|---|---|`) da tabela.
 * @param {string[]} celulas - Células da linha.
 * @returns {boolean} true se for separador.
 */
function ehSeparador(celulas) {
  return celulas.length > 0 && celulas.every((celula) => PADRAO_SEPARADOR_TABELA.test(celula));
}

/**
 * Se as células forem o cabeçalho da tabela de tarefas, devolve o índice de cada coluna.
 * O cabeçalho é achado pelos NOMES das colunas, nunca pela posição.
 * @param {string[]} celulas - Células da linha.
 * @returns {Object<string, number>|null} Índices por chave, ou null se não for cabeçalho.
 */
function detectarCabecalho(celulas) {
  const nomes = celulas.map((celula) => semAcento(limparCelula(celula)).toLowerCase());
  if (nomes[0] !== NOMES_COLUNAS.id) return null;

  const indices = {};
  for (const [chave, nome] of Object.entries(NOMES_COLUNAS)) {
    indices[chave] = nomes.indexOf(nome);
  }
  const temObrigatorias = COLUNAS_OBRIGATORIAS.every((chave) => indices[chave] >= 0);
  return temObrigatorias ? indices : null;
}

/**
 * Monta o objeto de uma linha de tarefa a partir das células e dos índices de coluna.
 * @param {string[]} celulas - Células da linha.
 * @param {Object<string, number>} indices - Índices por chave de coluna.
 * @returns {Object|null} Linha lida, ou null se faltarem células.
 */
function montarLinha(celulas, indices) {
  const maiorIndice = Math.max(...COLUNAS_OBRIGATORIAS.map((chave) => indices[chave]));
  if (celulas.length <= maiorIndice) return null;

  const linha = {};
  for (const chave of Object.keys(NOMES_COLUNAS)) {
    const posicao = indices[chave];
    linha[chave] = posicao >= 0 ? limparCelula(celulas[posicao]) : '';
  }
  linha.id = linha.id.replace(/[`*]/g, '').trim();
  return linha.id ? linha : null;
}

/**
 * Recorta as linhas da seção "Tarefas" (até o próximo `## `); sem a seção, devolve tudo.
 * @param {string} texto - Conteúdo do arquivo.
 * @returns {string[]} Linhas do trecho.
 */
function recortarSecaoTarefas(texto) {
  const linhas = String(texto ?? '').split(/\r?\n/);
  const inicio = linhas.findIndex((linha) => PADRAO_SECAO_TAREFAS.test(linha));
  if (inicio < 0) return linhas;

  const resto = linhas.slice(inicio + 1);
  const fim = resto.findIndex((linha) => PADRAO_NOVA_SECAO.test(linha));
  return fim < 0 ? resto : resto.slice(0, fim);
}

/**
 * Lê as linhas da tabela de tarefas (formato legado).
 * @param {string} texto - Conteúdo do arquivo.
 * @returns {{linhas: Object[], ignoradas: number, temCabecalho: boolean}} Linhas lidas.
 */
function lerLinhasDaTabela(texto) {
  const linhas = [];
  let indices = null;
  let ignoradas = 0;

  for (const bruta of recortarSecaoTarefas(texto)) {
    if (!bruta.trimStart().startsWith('|')) continue;

    const celulas = dividirCelulas(bruta);
    const cabecalho = detectarCabecalho(celulas);
    if (cabecalho) {
      indices = cabecalho;
      continue;
    }
    if (!indices || ehSeparador(celulas)) continue;

    const linha = montarLinha(celulas, indices);
    if (linha) linhas.push(linha);
    else ignoradas += 1;
  }
  return { linhas, ignoradas, temCabecalho: indices !== null };
}

/**
 * Converte um item do índice simplificado na mesma forma de linha da tabela.
 * @param {Object} item - Item de `lerIndiceSimplificado`.
 * @returns {Object} Linha com id, título, prioridade, modelo, dependências, status e reserva.
 */
function linhaDoItemSimplificado(item) {
  return {
    id: item.id,
    titulo: item.titulo,
    prioridade: item.prioridade,
    modelo: item.modelo,
    dependencias: item.dependeDe,
    status: item.status,
    emUsoPor: item.emUsoPor,
    ehMae: item.ehMae,
    agrupada: item.agrupada,
    idCurto: item.idCurto,
  };
}

/**
 * Tira o campo interno `temCabecalho` do resultado da tabela.
 * @param {{linhas: Object[], ignoradas: number}} resultado - Resultado da tabela.
 * @returns {{linhas: Object[], ignoradas: number}} Só linhas e ignoradas.
 */
function semCampoInterno(resultado) {
  return { linhas: resultado.linhas, ignoradas: resultado.ignoradas };
}

/**
 * Lê as linhas de tarefa de um quadro (`STATUS.md` ou `task_complete.md`), nos dois formatos.
 * A tabela legada vence: com cabeçalho de tabela, o resultado é o mesmo de antes (R2.2).
 * @param {string} texto - Conteúdo do arquivo.
 * @returns {{linhas: Object[], ignoradas: number, formato: string|null}} Linhas lidas, quantas
 *   foram descartadas e o formato detectado (null = nenhum).
 */
export function lerLinhasQuadro(texto) {
  const tabela = lerLinhasDaTabela(texto);
  if (tabela.temCabecalho) return { ...semCampoInterno(tabela), formato: FORMATOS.TABELA };

  const formato = detectarFormato(texto);
  if (formato !== FORMATOS.SIMPLIFICADO) return { ...semCampoInterno(tabela), formato };

  const indice = lerIndiceSimplificado(texto);
  return {
    linhas: indice.itens.map(linhaDoItemSimplificado),
    ignoradas: indice.ignoradas,
    formato,
  };
}

/**
 * Prepara a lista de modelos da configuração: nome de exibição e chave de comparação.
 * @param {string[]} nomes - Nomes como "Haiku", "Sonnet".
 * @returns {{nome: string, chave: string}[]} Modelos prontos.
 */
export function prepararModelos(nomes) {
  return nomes.map((nome) => ({ nome, chave: semAcento(nome).toLowerCase() }));
}

/**
 * Monta o mapa "ID -> concluído?" com as linhas do STATUS e do task_complete.
 * A linha do STATUS vale mais que a do task_complete se o mesmo ID aparecer nos dois.
 * @param {Object[]} linhasStatus - Linhas do STATUS.
 * @param {Object[]} linhasConcluidas - Linhas do task_complete.
 * @returns {Map<string, boolean>} true quando o ID está ✅.
 */
function construirMapaConcluidas(linhasStatus, linhasConcluidas) {
  const mapa = new Map();
  for (const linha of linhasConcluidas) {
    mapa.set(linha.id, linha.status.startsWith(EMOJI_CONCLUIDO));
  }
  for (const linha of linhasStatus) {
    mapa.set(linha.id, linha.status.startsWith(EMOJI_CONCLUIDO));
  }
  // No índice simplificado a mãe é "#400-8e2a4c60" e a dependência cita só "#400".
  for (const linha of [...linhasConcluidas, ...linhasStatus]) {
    const temApelido = linha.idCurto && linha.idCurto !== linha.id && !mapa.has(linha.idCurto);
    if (temApelido) mapa.set(linha.idCurto, mapa.get(linha.id));
  }
  return mapa;
}

/**
 * Extrai os IDs da coluna "Depende de".
 * @param {string} celula - Texto da coluna.
 * @returns {string[]} IDs das dependências (vazio se não houver).
 */
export function lerDependencias(celula) {
  const texto = semAcento(celula).toLowerCase().trim();
  if (TRAVESSOES.has(texto) || texto.startsWith('nenhuma')) return [];

  return celula
    .split(/[,;]/)
    .map((parte) => parte.replace(/[`*]/g, '').trim().split(/\s+/)[0])
    .filter((id) => id && PADRAO_ID_VALIDO.test(id));
}

/**
 * Separa as dependências que ainda não estão prontas das que não existem no quadro.
 * @param {string[]} ids - IDs das dependências.
 * @param {Map<string, boolean>} mapa - Mapa "ID -> concluído?".
 * @param {string} politica - O que fazer com ID ausente: `pronta` ou `bloqueia`.
 * @returns {{pendentes: string[], ausentes: string[]}} Pendentes e ausentes.
 */
function resolverDependencias(ids, mapa, politica) {
  const pendentes = [];
  const ausentes = [];
  for (const id of ids) {
    if (!mapa.has(id)) {
      ausentes.push(id);
      if (politica === POLITICA_DEPENDENCIA_BLOQUEIA) pendentes.push(id);
    } else if (!mapa.get(id)) {
      pendentes.push(id);
    }
  }
  return { pendentes, ausentes };
}

/**
 * Descobre o nível (LEVE, MEDIO, PESADO) pela coluna Modelo ou, sem ela, pelo título.
 * @param {Object} linha - Linha do quadro.
 * @returns {string|null} Nível, ou null se não houver.
 */
function extrairNivel(linha) {
  const doModelo = semAcento(linha.modelo).toUpperCase().match(PADRAO_NIVEL);
  if (doModelo) return doModelo[1];

  const doTitulo = semAcento(linha.titulo).toUpperCase().match(PADRAO_NIVEL_NO_TITULO);
  return doTitulo ? doTitulo[1] : null;
}

/**
 * Lista as chaves dos modelos citados em "só X ou Y" na coluna Modelo.
 * @param {string} celula - Texto da coluna Modelo.
 * @returns {string[]} Chaves em minúsculas ("haiku", "opus", "fable"...).
 */
function extrairModelosExplicitos(celula) {
  const achado = semAcento(celula).match(PADRAO_SO_MODELOS);
  if (!achado) return [];

  return achado[1]
    .split(PADRAO_SEPARA_MODELOS)
    .map((item) => item.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter(Boolean);
}

/**
 * Define quais modelos podem pegar a linha: os da coluna Modelo ou, sem eles, os do nível.
 * @param {Object} linha - Linha do quadro.
 * @param {Object<string, string[]>} matriz - Nível -> nomes de modelo (config).
 * @returns {{nivel: string|null, chaves: string[], derivado: boolean}} Resultado.
 */
function definirElegiveis(linha, matriz) {
  const nivel = extrairNivel(linha);
  const explicitos = extrairModelosExplicitos(linha.modelo);
  if (explicitos.length > 0) return { nivel, chaves: explicitos, derivado: false };

  const nomesDoNivel = nivel ? (matriz[nivel] ?? []) : [];
  const chaves = nomesDoNivel.map((nome) => semAcento(nome).toLowerCase());
  return { nivel, chaves, derivado: true };
}

/**
 * Diz se a linha é tarefa-mãe (não se reserva).
 * @param {Object} linha - Linha do quadro.
 * @returns {boolean} true se for mãe.
 */
function ehMae(linha) {
  const emUso = semAcento(linha.emUsoPor).toLowerCase();
  const status = semAcento(linha.status).toLowerCase();
  const marcadaComoMae = linha.ehMae === true;
  return marcadaComoMae || emUso.includes('nao reservavel') || /\bmae\b/.test(status);
}

/**
 * Primeiras razões (sem olhar dependência nem modelo) para uma linha NÃO ser livre.
 * @param {Object} linha - Linha do quadro.
 * @returns {string|null} Motivo da exclusão, ou null se passou.
 */
function motivoDeExclusao(linha) {
  const modelo = semAcento(linha.modelo).toLowerCase();
  if (!linha.status.startsWith(EMOJI_PENDENTE)) return 'status';
  if (ehMae(linha)) return 'mae';
  if (linha.agrupada) return 'agrupada';
  if (!TRAVESSOES.has(linha.emUsoPor.trim())) return 'reservada';
  if (PADRAO_NUVEM.test(`${linha.modelo} ${linha.status}`)) return 'nuvem';
  if (modelo.startsWith('usuario')) return 'usuario';
  if (modelo.includes('sem nivel')) return 'sem-nivel';
  return null;
}

/**
 * Avalia uma linha: ela está livre para algum dos modelos configurados?
 * @param {Object} linha - Linha do quadro.
 * @param {{mapa: Map, config: Object, modelos: Object[]}} contexto - Dados de apoio.
 * @returns {Object} `{livre, motivo, nivel, chaves, derivado, ausentes}`.
 */
function avaliarLinha(linha, contexto) {
  const motivo = motivoDeExclusao(linha);
  if (motivo) return { livre: false, motivo };

  const elegiveis = definirElegiveis(linha, contexto.config.matrizNivelModelos ?? {});
  const semNivelNemModelo = !elegiveis.nivel && elegiveis.chaves.length === 0;
  if (semNivelNemModelo) return { livre: false, motivo: 'sem-nivel' };

  const chavesConfig = new Set(contexto.modelos.map((modelo) => modelo.chave));
  const chaves = elegiveis.chaves.filter((chave) => chavesConfig.has(chave));
  if (chaves.length === 0) return { livre: false, motivo: 'fora-dos-modelos' };

  const politica = contexto.config.dependenciaAusente ?? POLITICA_DEPENDENCIA_PRONTA;
  const deps = resolverDependencias(lerDependencias(linha.dependencias), contexto.mapa, politica);
  if (deps.pendentes.length > 0) return { livre: false, motivo: 'dependencia' };

  const { nivel, derivado } = elegiveis;
  return { livre: true, motivo: 'livre', nivel, chaves, derivado, ausentes: deps.ausentes };
}

/**
 * Posição de prioridade (0 = máxima) pelo emoji da coluna Prioridade.
 * @param {string} celula - Texto da coluna Prioridade.
 * @returns {number} Posição para ordenar.
 */
function posicaoPrioridade(celula) {
  const posicao = EMOJIS_PRIORIDADE.findIndex((emoji) => celula.includes(emoji));
  return posicao < 0 ? POSICAO_PRIORIDADE_DESCONHECIDA : posicao;
}

/**
 * Descobre qual modelo configurado aparece primeiro no texto da coluna "Em uso por".
 * Assim "Claude Code (Haiku 5.5 · agente; líder Sonnet 5.5)" conta como Haiku.
 * @param {string} texto - Texto da reserva.
 * @param {{nome: string, chave: string}[]} modelos - Modelos da configuração.
 * @returns {string|null} Chave do modelo, ou null se nenhum aparecer.
 */
function modeloDaReserva(texto, modelos) {
  const limpo = semAcento(texto).toLowerCase();
  let melhor = null;
  for (const modelo of modelos) {
    const posicao = limpo.search(new RegExp(`\\b${modelo.chave}\\b`));
    if (posicao >= 0 && (melhor === null || posicao < melhor.posicao)) {
      melhor = { chave: modelo.chave, posicao };
    }
  }
  return melhor ? melhor.chave : null;
}

/**
 * Lista, por modelo, as linhas `🔄` reservadas (modelo ocupado = tem linha em execução).
 * @param {Object[]} linhas - Linhas do STATUS.
 * @param {{nome: string, chave: string}[]} modelos - Modelos da configuração.
 * @returns {Object<string, string[]>} Chave do modelo -> IDs em execução.
 */
function calcularOcupacao(linhas, modelos) {
  const ocupacao = Object.fromEntries(modelos.map((modelo) => [modelo.chave, []]));
  for (const linha of linhas) {
    const emExecucao = linha.status.startsWith(EMOJI_EM_EXECUCAO);
    if (!emExecucao || TRAVESSOES.has(linha.emUsoPor.trim())) continue;

    const chave = modeloDaReserva(linha.emUsoPor, modelos);
    if (chave) ocupacao[chave].push(linha.id);
  }
  return ocupacao;
}

/**
 * Calcula, para um projeto, as subtarefas livres, a ocupação por modelo e as contagens.
 * @param {{status: string, concluidas: string}} textos - Conteúdo dos dois arquivos.
 * @param {Object} config - Configuração (modelos, matrizNivelModelos, dependenciaAusente).
 * @returns {Object} `{totalLinhas, ignoradas, motivos, livres, ocupacao, formato}`.
 * @throws {ErroFormatoQuadro} Se o STATUS não casar com nenhum dos dois formatos (R2.3).
 */
export function calcularQuadro(textos, config) {
  const lidas = lerLinhasQuadro(textos.status);
  if (lidas.formato === null) throw new ErroFormatoQuadro();
  const concluidas = lerLinhasQuadro(textos.concluidas ?? '').linhas;
  const modelos = prepararModelos(config.modelos ?? []);
  const mapa = construirMapaConcluidas(lidas.linhas, concluidas);

  const motivos = {};
  const livres = [];
  for (const linha of lidas.linhas) {
    const avaliacao = avaliarLinha(linha, { mapa, config, modelos });
    motivos[avaliacao.motivo] = (motivos[avaliacao.motivo] ?? 0) + 1;
    if (avaliacao.livre) livres.push({ ...linha, ...avaliacao });
  }
  livres.sort((a, b) => posicaoPrioridade(a.prioridade) - posicaoPrioridade(b.prioridade));

  return {
    totalLinhas: lidas.linhas.length,
    ignoradas: lidas.ignoradas,
    motivos,
    livres,
    ocupacao: calcularOcupacao(lidas.linhas, modelos),
    formato: lidas.formato,
  };
}
