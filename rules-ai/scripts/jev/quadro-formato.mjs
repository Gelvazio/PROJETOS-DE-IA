// Formato simplificado do quadro (`tasks/STATUS.md`, C55): detecção pelo conteúdo, leitura dos
// itens e reescrita de UM item (status, reserva ou nível), sem mexer no resto da linha.
// Só funções puras: nada aqui lê disco, usa Git ou escreve arquivo. Compartilhado pelo
// gerenciador, pelo MCP e pelo Jev; fica em `scripts/jev/` para ir junto no pacote do
// `rules-local` (o pacote só leva arquivos de `scripts/jev/`).
//
// Item da mãe:       `- #<ID> — [<título>](etapas/ETAPA-….md) · <status> · <Em uso por>`
// Item da subtarefa: `  - #<ID>.<n> — <título> · <status> · `<NIVEL>` · só <modelo> (<obs>)`
// A reserva da subtarefa vai numa observação entre parênteses; sem ela, a subtarefa está livre.

export const FORMATOS = Object.freeze({
  TABELA: 'tabela',
  SIMPLIFICADO: 'simplificado',
  VAZIO: 'vazio',
});
export const CODIGO_FORMATO_DESCONHECIDO = 'formato_desconhecido';
export const MENSAGEM_FORMATO_DESCONHECIDO =
  'Formato do quadro não reconhecido: nem tabela (cabeçalho "| Tarefa | … | Status | Em uso por |")'
  + ' nem índice simplificado ("- #<ID> — <título> · <status> · …"). Nada foi gravado.';
export const SEPARADOR = ' · ';
export const LIVRE = '—';

const MARCA_BOM = '﻿';
const SELETOR_VARIACAO = /️/g;
const EMOJIS_STATUS = ['⬜', '🔄', '✅', '⛔', '👀', '❌'];
const EMOJIS_PRIORIDADE = ['🔴', '🟠', '🟡', '🟢'];
const PADRAO_ITEM = /^(\s*)- (#[^\s:—]+(?:\s+(?:a|e|até)\s+#[^\s:—]+)*)\s+—\s+(.*)$/u;
const PADRAO_SECAO_TAREFAS = /^##\s+.*\bTarefas\b/iu;
const PADRAO_NOVA_SECAO = /^##\s/;
const PADRAO_CABECALHO_TAREFA = /^\|\s*\**\s*Tarefa\s*\**\s*\|/iu;
const PADRAO_LINK = /^\[(.*)\]\(([^)\s]+)\)$/u;
const PADRAO_NIVEL = /\b(LEVE|MEDIO|MÉDIO|PESADO)\b/u;
const PADRAO_NIVEL_CRASE = /^`[^`]*\b(?:LEVE|MEDIO|MÉDIO|PESADO)\b[^`]*`$/u;
const PADRAO_SEM_NIVEL = /^n[ií]vel a classificar/iu;
const PADRAO_SO_MODELO = /^s[oó]\s/iu;
const PADRAO_RESERVA = /\(desde\s+\d|\bdesde\s+\d{4}-\d{2}-\d{2}|🔒|trava especial/iu;
const PADRAO_LIVRE = /^livre$/iu;
const PADRAO_DEPENDENCIA =
  /depende\s+d[aeo]s?\s+((?:#?[\w.-]+)(?:\s*(?:,|\be\b)\s*#?[\w.-]+)*)/iu;
const PADRAO_SUFIXO_UUID = /-[0-9a-f]{8}(?:-[0-9a-f]{4,})*(?:-[0-9a-f]+)?$/iu;
const PADRAO_ETAPA_ARQUIVO = /ETAPA-(\d+-[0-9a-f]{8})/iu;
const PADRAO_FAIXA = /^(.*\.)(\d+)$/u;
const LIMITE_FAIXA = 500;
const ABRE = new Set(['(', '[']);
const FECHA = new Set([')', ']']);

/** Erro de quadro que não casa com nenhum formato (R2.3). */
export class ErroFormatoQuadro extends Error {
  /**
   * @param {string} [mensagem] Mensagem curta, sem conteúdo de tarefa.
   */
  constructor(mensagem = MENSAGEM_FORMATO_DESCONHECIDO) {
    super(mensagem);
    this.name = 'ErroFormatoQuadro';
    this.codigo = CODIGO_FORMATO_DESCONHECIDO;
  }
}

/**
 * Divide o texto em linhas (aceita LF e CRLF) e tira a marca BOM.
 * @param {string} texto Conteúdo do arquivo.
 * @returns {string[]} Linhas sem o fim de linha.
 */
function dividirLinhas(texto) {
  const semBom = String(texto ?? '').replace(new RegExp(`^${MARCA_BOM}`), '');
  return semBom.split(/\r?\n/);
}

/**
 * Faixa [inicio, fim) da seção "Tarefas" (até o próximo `## `); sem a seção, o arquivo todo.
 * @param {string[]} linhas Linhas do arquivo.
 * @returns {{inicio: number, fim: number, temSecao: boolean}} Faixa da seção.
 */
export function localizarSecaoTarefas(linhas) {
  const titulo = linhas.findIndex((linha) => PADRAO_SECAO_TAREFAS.test(linha));
  if (titulo < 0) return { inicio: 0, fim: linhas.length, temSecao: false };
  const proxima = linhas.findIndex((linha, i) => i > titulo && PADRAO_NOVA_SECAO.test(linha));
  return { inicio: titulo + 1, fim: proxima < 0 ? linhas.length : proxima, temSecao: true };
}

/**
 * Diz se o texto tem a linha de cabeçalho da tabela de tarefas (formato legado).
 * @param {string[]} linhas Linhas do arquivo.
 * @returns {boolean} true se houver `| Tarefa | …` com Status e Em uso por.
 */
function temCabecalhoDeTabela(linhas) {
  return linhas.some((linha) => {
    if (!PADRAO_CABECALHO_TAREFA.test(linha.trim())) return false;
    const normalizada = linha.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
    return normalizada.includes('status') && normalizada.includes('em uso por');
  });
}

/**
 * Descobre o formato do quadro pelo conteúdo.
 * @param {string} texto Conteúdo do `STATUS.md`.
 * @returns {string|null} Um valor de FORMATOS, ou null se não casar com nenhum.
 */
export function detectarFormato(texto) {
  const linhas = dividirLinhas(texto);
  if (temCabecalhoDeTabela(linhas)) return FORMATOS.TABELA;
  const secao = localizarSecaoTarefas(linhas);
  const trecho = linhas.slice(secao.inicio, secao.fim);
  if (trecho.some((linha) => PADRAO_ITEM.test(linha))) return FORMATOS.SIMPLIFICADO;
  if (linhas.every((linha) => linha.trim() === '')) return FORMATOS.VAZIO;
  const secaoSemTabela = secao.temSecao && !trecho.some((l) => l.trimStart().startsWith('|'));
  if (secaoSemTabela) return FORMATOS.SIMPLIFICADO;
  // Tabela sem cabeçalho (ex.: `task_complete.md` antigo): continua legada, como antes.
  const temLinhaDeTabela = linhas.some((linha) => linha.trimStart().startsWith('|'));
  return temLinhaDeTabela ? FORMATOS.TABELA : null;
}

/**
 * Diz se o texto está no formato simplificado.
 * @param {string} texto Conteúdo do `STATUS.md`.
 * @returns {boolean} true para o índice simplificado.
 */
export function ehFormatoSimplificado(texto) {
  return detectarFormato(texto) === FORMATOS.SIMPLIFICADO;
}

/**
 * Divide o resto do item em trechos separados por ` · `, sem cortar dentro de parênteses,
 * colchetes ou crases (ex.: `(local · main)` e `` `MEDIO · effort medium` `` ficam inteiros).
 * @param {string} texto Texto depois de `#<ID> — `.
 * @returns {string[]} Trechos; `join(' · ')` devolve o texto original.
 */
export function dividirSegmentos(texto) {
  const segmentos = [];
  let profundidade = 0;
  let emCrase = false;
  let inicio = 0;
  for (let i = 0; i < texto.length; i += 1) {
    const caractere = texto[i];
    if (caractere === '`') emCrase = !emCrase;
    if (emCrase) continue;
    if (ABRE.has(caractere)) profundidade += 1;
    if (FECHA.has(caractere)) profundidade = Math.max(0, profundidade - 1);
    const ehSeparador = profundidade === 0 && texto.startsWith(SEPARADOR, i);
    if (!ehSeparador) continue;
    segmentos.push(texto.slice(inicio, i));
    inicio = i + SEPARADOR.length;
    i = inicio - 1;
  }
  segmentos.push(texto.slice(inicio));
  return segmentos;
}

/**
 * Acha os grupos `( … )` de nível 0 de um trecho.
 * @param {string} trecho Trecho do item.
 * @returns {Array<{inicio: number, fim: number, conteudo: string}>} Grupos (fim exclusivo).
 */
export function acharGrupos(trecho) {
  const grupos = [];
  let profundidade = 0;
  let abertura = -1;
  for (let i = 0; i < trecho.length; i += 1) {
    if (trecho[i] === '(') {
      if (profundidade === 0) abertura = i;
      profundidade += 1;
      continue;
    }
    if (trecho[i] !== ')' || profundidade === 0) continue;
    profundidade -= 1;
    if (profundidade > 0) continue;
    grupos.push({ inicio: abertura, fim: i + 1, conteudo: trecho.slice(abertura + 1, i) });
  }
  return grupos;
}

/**
 * Tira os grupos `( … )` de nível 0 de um trecho.
 * @param {string} trecho Trecho do item.
 * @returns {string} Trecho sem os grupos e sem espaços nas pontas.
 */
function semGrupos(trecho) {
  let resultado = trecho;
  for (const grupo of acharGrupos(trecho).reverse()) {
    resultado = resultado.slice(0, grupo.inicio) + resultado.slice(grupo.fim);
  }
  return resultado.replace(/\s{2,}/g, ' ').trim();
}

/**
 * Diz se o trecho começa com um emoji de status da legenda.
 * @param {string} trecho Trecho do item.
 * @returns {string|null} Emoji, ou null.
 */
function emojiDoStatus(trecho) {
  const limpo = trecho.trim().replace(SELETOR_VARIACAO, '');
  return EMOJIS_STATUS.find((emoji) => limpo.startsWith(emoji)) ?? null;
}

/**
 * Expande os IDs do item: `#400.1 a #400.4` vira 400.1…400.4; `#387.1 e #387.2` vira os dois.
 * @param {string} bruto Trecho dos IDs, como escrito.
 * @returns {string[]} IDs sem o `#`.
 */
export function expandirIds(bruto) {
  const partes = bruto.split(/\s+(a|e|até)\s+/u);
  const ids = [partes[0].replace(/^#/, '')];
  for (let i = 1; i < partes.length; i += 2) {
    const destino = partes[i + 1].replace(/^#/, '');
    const anterior = PADRAO_FAIXA.exec(ids[ids.length - 1]);
    const final = PADRAO_FAIXA.exec(destino);
    const ehFaixa = partes[i] !== 'e' && anterior && final && anterior[1] === final[1];
    const tamanho = ehFaixa ? Number(final[2]) - Number(anterior[2]) : 0;
    if (!ehFaixa || tamanho < 1 || tamanho > LIMITE_FAIXA) {
      ids.push(destino);
      continue;
    }
    for (let n = Number(anterior[2]) + 1; n <= Number(final[2]); n += 1) ids.push(anterior[1] + n);
  }
  return [...new Set(ids)];
}

/**
 * Lê o status, a prioridade e as dependências do trecho de status.
 * @param {string} trecho Trecho com o emoji (pode ser vazio).
 * @returns {{status: string, emoji: string|null, prioridade: string, dependeDe: string}} Dados.
 */
function lerStatus(trecho) {
  if (!trecho) return { status: '', emoji: null, prioridade: '', dependeDe: '' };
  const observacao = acharGrupos(trecho).map((grupo) => grupo.conteudo).join('; ');
  const prioridade = EMOJIS_PRIORIDADE.find((emoji) => trecho.includes(emoji)) ?? '';
  const palavra = prioridade
    ? (new RegExp(`${prioridade}\\s*([\\p{L}]+)`, 'u').exec(trecho)?.[1] ?? '') : '';
  const dependencias = PADRAO_DEPENDENCIA.exec(observacao)?.[1] ?? '';
  return {
    status: semGrupos(trecho),
    emoji: emojiDoStatus(trecho),
    prioridade: [prioridade, palavra].filter(Boolean).join(' '),
    dependeDe: dependencias.split(/\s*(?:,|\be\b)\s*/u).map((id) => id.replace(/^#/, ''))
      .filter(Boolean).join(', '),
  };
}

/**
 * Classifica um trecho depois do status: nível, modelo, reserva, livre ou outro.
 * @param {string} trecho Trecho do item.
 * @returns {string} 'nivel' | 'modelo' | 'reserva' | 'livre' | 'outro'.
 */
function tipoDoTrecho(trecho) {
  const limpo = trecho.trim();
  if (PADRAO_NIVEL_CRASE.test(limpo) || PADRAO_SEM_NIVEL.test(limpo)) return 'nivel';
  if (PADRAO_SO_MODELO.test(limpo)) return 'modelo';
  if (PADRAO_LIVRE.test(limpo)) return 'livre';
  const ehReserva = PADRAO_RESERVA.test(limpo) && !limpo.startsWith('(');
  return ehReserva ? 'reserva' : 'outro';
}

/**
 * Lê nível, modelo e reserva dos trechos que vêm depois do status de uma subtarefa.
 * @param {string[]} trechos Trechos depois do status.
 * @returns {{nivel: string|null, modelo: string, emUsoPor: string, observacao: string}} Dados.
 */
function lerCaudaDaSubtarefa(trechos) {
  const modelo = [];
  const observacoes = [];
  let emUsoPor = LIVRE;
  for (const trecho of trechos) {
    const tipo = tipoDoTrecho(trecho);
    if (tipo === 'reserva') emUsoPor = trecho.trim();
    if (tipo === 'reserva' || tipo === 'livre') continue;
    for (const grupo of acharGrupos(trecho)) {
      if (PADRAO_RESERVA.test(grupo.conteudo)) emUsoPor = grupo.conteudo.trim();
      else observacoes.push(grupo.conteudo);
    }
    const texto = semGrupos(trecho).replace(/`/g, '');
    if (texto) modelo.push(texto);
  }
  const textoModelo = modelo.join(SEPARADOR);
  const nivel = PADRAO_NIVEL.exec(textoModelo.toUpperCase())?.[1]?.replace('É', 'E') ?? null;
  return { nivel, modelo: textoModelo, emUsoPor, observacao: observacoes.join('; ') };
}

/**
 * Separa título/link, status e cauda de um item.
 * @param {string[]} segmentos Trechos do item.
 * @returns {{titulo: string, link: string|null, indiceStatus: number, cauda: string[]}} Partes.
 */
function separarPartes(segmentos) {
  const indiceStatus = segmentos.findIndex((trecho, i) => i > 0 && emojiDoStatus(trecho));
  const fimTitulo = indiceStatus < 0 ? segmentos.length : indiceStatus;
  const tituloBruto = segmentos.slice(0, Math.max(1, fimTitulo)).join(SEPARADOR).trim();
  const link = PADRAO_LINK.exec(tituloBruto);
  return {
    titulo: (link ? link[1] : tituloBruto).replace(/\*\*/g, '').trim(),
    link: link ? link[2] : null,
    indiceStatus,
    cauda: indiceStatus < 0 ? [] : segmentos.slice(indiceStatus + 1),
  };
}

/**
 * Rótulo curto da etapa a partir do caminho (`ETAPA-545-8e2a4c60-…` vira `545-8e2a4c60`).
 * @param {string|null} caminho Caminho do link.
 * @returns {string} Rótulo (vazio sem link).
 */
function rotuloDaEtapa(caminho) {
  if (!caminho) return '';
  const achado = PADRAO_ETAPA_ARQUIVO.exec(caminho);
  if (achado) return achado[1];
  return caminho.split('/').pop().replace(/\.md$/iu, '');
}

/**
 * ID curto (sem o sufixo de UUID): `400-8e2a4c60` vira `400`. Usado só para dependências.
 * @param {string} id ID completo.
 * @returns {string} ID sem o sufixo.
 */
export function idCurto(id) {
  return id.replace(PADRAO_SUFIXO_UUID, '');
}

/**
 * Lê uma linha de item (mãe ou subtarefa).
 * @param {string} linha Linha do arquivo.
 * @param {number} indice Índice da linha no arquivo.
 * @param {object|null} mae Último item de mãe lido (para a subtarefa herdar a etapa).
 * @returns {object[]|null} Um item por ID da linha, ou null se não for item.
 */
function lerLinhaDeItem(linha, indice, mae) {
  const achado = PADRAO_ITEM.exec(linha);
  if (!achado) return null;
  const [, recuo, idsBrutos, resto] = achado;
  const ehSubtarefa = recuo.length > 0;
  const segmentos = dividirSegmentos(resto);
  const partes = separarPartes(segmentos);
  const status = lerStatus(partes.indiceStatus < 0 ? '' : segmentos[partes.indiceStatus]);
  const cauda = ehSubtarefa ? lerCaudaDaSubtarefa(partes.cauda) : null;
  const etapaLink = partes.link ?? (ehSubtarefa ? (mae?.etapaLink ?? null) : null);
  const ids = expandirIds(idsBrutos);
  const base = {
    indice, bruto: linha, cabeca: linha.slice(0, linha.length - resto.length), segmentos,
    indiceStatus: partes.indiceStatus, ehSubtarefa, ehMae: !ehSubtarefa,
    idMae: ehSubtarefa ? (mae?.id ?? null) : null, agrupada: ids.length > 1,
    titulo: partes.titulo, etapaLink, etapaRotulo: rotuloDaEtapa(etapaLink), ...status,
    nivel: cauda?.nivel ?? null, modelo: cauda?.modelo ?? LIVRE,
    emUsoPor: cauda ? cauda.emUsoPor : partes.cauda.join(SEPARADOR).trim(),
    observacao: cauda?.observacao ?? '',
  };
  return ids.map((id) => ({ ...base, id, idCurto: idCurto(id) }));
}

/**
 * Lê os itens do índice simplificado (só a seção "Tarefas", quando ela existir).
 * Linhas soltas (`- #29: …`), tabelas quebradas e texto livre contam como ignoradas.
 * @param {string} texto Conteúdo do `STATUS.md`.
 * @returns {{itens: object[], ignoradas: number, secao: {inicio: number, fim: number}}} Itens.
 */
export function lerIndiceSimplificado(texto) {
  const linhas = dividirLinhas(texto);
  const secao = localizarSecaoTarefas(linhas);
  const itens = [];
  let ignoradas = 0;
  let mae = null;
  for (let i = secao.inicio; i < secao.fim; i += 1) {
    const lidos = lerLinhaDeItem(linhas[i], i, mae);
    if (lidos && !lidos[0].ehSubtarefa) mae = lidos[0];
    if (lidos) itens.push(...lidos);
    else if (/^\s*(?:[-*|])/.test(linhas[i])) ignoradas += 1;
  }
  return { itens, ignoradas, secao };
}

/**
 * Monta a linha a partir da cabeça e dos trechos.
 * @param {{cabeca: string}} item Item lido.
 * @param {string[]} segmentos Trechos novos.
 * @returns {string} Linha.
 */
function montarLinha(item, segmentos) {
  return item.cabeca + segmentos.join(SEPARADOR);
}

/**
 * Troca o status do item (o emoji e as palavras); a observação entre parênteses fica.
 * @param {object} item Item lido.
 * @param {string[]} segmentos Trechos atuais.
 * @param {string} status Novo status (ex.: `🔄 Em execução`).
 * @returns {{segmentos: string[], indiceStatus: number}} Trechos novos.
 */
function trocarStatus(item, segmentos, status) {
  const novos = [...segmentos];
  if (item.indiceStatus < 0) {
    novos.splice(1, 0, status);
    return { segmentos: novos, indiceStatus: 1 };
  }
  const atual = novos[item.indiceStatus];
  const grupos = acharGrupos(atual).map((grupo) => atual.slice(grupo.inicio, grupo.fim));
  novos[item.indiceStatus] = [status, ...grupos].join(' ');
  return { segmentos: novos, indiceStatus: item.indiceStatus };
}

/**
 * Tira a reserva (trecho ou grupo entre parênteses) e o trecho `livre` da cauda da subtarefa.
 * @param {string[]} cauda Trechos depois do status.
 * @returns {string[]} Cauda sem reserva.
 */
function tirarReserva(cauda) {
  const resultado = [];
  for (const trecho of cauda) {
    const tipo = tipoDoTrecho(trecho);
    if (tipo === 'reserva' || tipo === 'livre') continue;
    let limpo = trecho;
    for (const grupo of acharGrupos(trecho).reverse()) {
      if (!PADRAO_RESERVA.test(grupo.conteudo)) continue;
      limpo = limpo.slice(0, grupo.inicio).trimEnd() + limpo.slice(grupo.fim);
    }
    if (limpo.trim() !== '') resultado.push(limpo);
  }
  return resultado;
}

/**
 * Diz se o texto de "Em uso por" significa livre.
 * @param {string} valor Texto.
 * @returns {boolean} true para `—`, `-`, vazio ou `livre`.
 */
function ehValorLivre(valor) {
  return ['', '—', '-', 'livre'].includes(String(valor).trim().toLowerCase());
}

/**
 * Grava a reserva: na subtarefa, numa observação `( … )` no fim; na mãe, no último trecho.
 * @param {object} item Item lido.
 * @param {{segmentos: string[], indiceStatus: number}} atual Trechos e posição do status.
 * @param {string} valor Texto de "Em uso por".
 * @returns {string[]} Trechos novos.
 */
function trocarReserva(item, atual, valor) {
  if (atual.indiceStatus < 0) throw new ErroFormatoQuadro('Item sem status: reserva recusada.');
  const cabecaStatus = atual.segmentos.slice(0, atual.indiceStatus + 1);
  if (!item.ehSubtarefa) return [...cabecaStatus, String(valor).trim() || LIVRE];
  const cauda = tirarReserva(atual.segmentos.slice(atual.indiceStatus + 1));
  if (!ehValorLivre(valor) && cauda.length === 0) cauda.push(`(${String(valor).trim()})`);
  else if (!ehValorLivre(valor)) cauda[cauda.length - 1] += ` (${String(valor).trim()})`;
  return [...cabecaStatus, ...cauda];
}

/**
 * Reescreve a linha de um item trocando status e/ou reserva. O resto da linha não muda.
 * @param {object} item Item lido por {@link lerIndiceSimplificado}.
 * @param {{status?: string, emUsoPor?: string}} alteracoes O que trocar.
 * @returns {string} Linha nova.
 * @throws {ErroFormatoQuadro} Se o item for agrupado ou a linha nova não ler igual ao pedido.
 */
export function reescreverItem(item, alteracoes) {
  if (item.agrupada) throw new ErroFormatoQuadro('Subtarefa agrupada: separe o item antes.');
  let atual = { segmentos: item.segmentos, indiceStatus: item.indiceStatus };
  if (alteracoes.status !== undefined) {
    atual = trocarStatus(item, atual.segmentos, alteracoes.status);
  }
  if (alteracoes.emUsoPor !== undefined) {
    atual = { ...atual, segmentos: trocarReserva(item, atual, alteracoes.emUsoPor) };
  }
  const linha = montarLinha(item, atual.segmentos);
  conferirReescrita(item, linha, alteracoes);
  return linha;
}

/**
 * Confere que a linha nova lê o mesmo ID, o status e a reserva pedidos (nada gravado se não).
 * @param {object} item Item original.
 * @param {string} linha Linha nova.
 * @param {{status?: string, emUsoPor?: string}} alteracoes O que foi pedido.
 * @returns {void}
 * @throws {ErroFormatoQuadro} Se a releitura não bater.
 */
function conferirReescrita(item, linha, alteracoes) {
  const relido = lerLinhaDeItem(linha, item.indice, { id: item.idMae, etapaLink: item.etapaLink });
  const novo = relido?.find((outro) => outro.id === item.id);
  const statusOk = alteracoes.status === undefined || novo?.status === alteracoes.status.trim();
  const esperado = ehValorLivre(alteracoes.emUsoPor ?? '') && item.ehSubtarefa
    ? LIVRE : String(alteracoes.emUsoPor ?? '').trim() || LIVRE;
  const reservaOk = alteracoes.emUsoPor === undefined || novo?.emUsoPor === esperado;
  if (!novo || !statusOk || !reservaOk) {
    throw new ErroFormatoQuadro('A gravação deixaria o item ilegível; nada foi gravado.');
  }
}

/**
 * Reescreve nível e modelo de uma subtarefa (gravação do Jev): troca os trechos de nível
 * (`` `MEDIO` `` ou `nível a classificar pelo Jev`) e de modelo (`só …`); observações e reserva
 * ficam.
 * @param {object} item Subtarefa lida por {@link lerIndiceSimplificado}.
 * @param {{nivel: string, modelo: string, effort: string}} classificacao Nível, `só …` e effort.
 * @returns {string} Linha nova.
 * @throws {ErroFormatoQuadro} Se não for subtarefa, for agrupada ou não tiver status.
 */
export function reescreverNivel(item, classificacao) {
  const recusa = !item.ehSubtarefa || item.agrupada || item.indiceStatus < 0;
  if (recusa) throw new ErroFormatoQuadro('Item sem linha própria de subtarefa com status.');
  const cabecaStatus = item.segmentos.slice(0, item.indiceStatus + 1);
  const cauda = item.segmentos.slice(item.indiceStatus + 1);
  const mantidos = [];
  const grupos = [];
  for (const trecho of cauda) {
    const tipo = tipoDoTrecho(trecho);
    if (tipo !== 'nivel' && tipo !== 'modelo') mantidos.push(trecho);
    else grupos.push(...acharGrupos(trecho).map((g) => trecho.slice(g.inicio, g.fim)));
  }
  const nivel = `\`${classificacao.nivel} · effort ${classificacao.effort}\``;
  const modelo = [classificacao.modelo, ...grupos].join(' ');
  return montarLinha(item, [...cabecaStatus, nivel, modelo, ...mantidos]);
}
