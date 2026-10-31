// Coletor de estado CEGO: lê o quadro (tasks/STATUS.md) e a seção da subtarefa na etapa, remove
// todo rótulo de nível/modelo/effort (INV-1) e mascara segredos antes de montar o `state` do Jev.
// Somente leitura: nada aqui escreve no quadro nem nas etapas. Lê os dois formatos do quadro
// (C55): a tabela legada e o índice simplificado.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { RAIZ_RULES_AI } from './config.mjs';
import {
  ErroFormatoQuadro, FORMATOS, detectarFormato, lerIndiceSimplificado,
} from './quadro-formato.mjs';

export const ARQUIVO_QUADRO = join(RAIZ_RULES_AI, 'tasks', 'STATUS.md');
const TAMANHO_MAXIMO_DESCRICAO = 4000;
const MARCA_OCULTA = '[oculto]';
const SIMBOLO_LIVRE = '—';
const PADRAO_CABECALHO_TABELA = /^\|\s*Tarefa\s*\|/;
const PADRAO_SEPARADOR_TABELA = /^\|[\s:|-]+\|$/;
const PADRAO_LINK_ETAPA = /\[([^\]]+)\]\(([^)]+)\)/;
const PADRAO_ROTULO_LINHA = /^\s*(?:[-*]\s+)?\*\*([^*:]+):\*\*\s*(.*)$/;
const PADRAO_CAMINHO_CRASE = /`([^`]+)`/g;
const ROTULOS_REMOVIDOS = new Set([
  'nível', 'nivel', 'modelo', 'effort', 'depende de', 'estimativa', 'entrega', 'anotação',
  'anotacao', 'verificação (líder)', 'verificacao (lider)',
]);
const ROTULOS_SEPARADOS = new Set(['arquivos', 'critérios de aceitação', 'criterios de aceitacao']);

/** Textos que denunciam o nível, o modelo ou o effort já decididos (removidos do `state`). */
const PADROES_ROTULO = [
  /\bnivel_atual\b/gi,
  /\beffort\s*[:=]?\s*(?:low|medium|high)\b/gi,
  /\b(?:Haiku|Sonnet|Opus|Fable)\b(?:\s*\d+(?:\.\d+)?\+?)?(?:\s+ou\s+superior)?/gi,
  /\bGemini(?:\s+CLI)?\s+(?:Flash|Pro)\b/gi,
  /\bdeepseek-(?:flash|v4-pro)\b/gi,
  /\bDeepSeek\s+(?:V\d+(?:\.\d+)?\s+)?(?:Flash|Pro)\b/gi,
  /\bDeepSeek\s*\(raciocínio\)/gi,
  /\b(?:LEVE|MEDIO|MÉDIO|PESADO)\b/g,
];
/** Linhas `**Entrega (… · executor-leve …):**` e `**Verificação (líder):**` dos agentes. */
const PADRAO_LINHA_RESIDUO =
  /^\s*(?:[-*]\s+)?\*\*(?:Entrega|Verificação|Verificacao)\s*\([^*]*\*\*.*$/i;
/** Pistas de nível que sobram em texto livre: trocadas por um termo neutro (não removidas). */
const TROCAS_RESIDUO = [
  [/\bexecutor-(?:leve|medio|pesado)\b/gi, 'executor'],
  [/--(?:leve|medio|pesado)\b/gi, '--nivel'],
];
const PADROES_LIMPEZA = [
  [/`\s*`/g, ''],
  [/\*{2,}\s*\*{2,}/g, ''],
  [/\(\s*\)/g, ''],
  [/(?:\s*[·/,+]\s*){2,}/g, ' · '],
  [/\s+[·/+]\s*(?=[\n)]|$)/g, ''],
  [/[ \t]{2,}/g, ' '],
];

/** Segredos/PII comuns trocados por marca antes de ir para o Jev (a redação completa é da .5). */
const PADROES_SEGREDO = [
  /\b(?:sk|tsk|ghp|gho|xox[bp])[-_][A-Za-z0-9_-]{16,}/g,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{16,}/gi,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g,
  /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g,
  /[\w.+-]+@[\w-]+\.[\w.-]+/g,
];

/**
 * Remove rótulos de nível, modelo e effort de um texto livre.
 * @param {string} texto Texto de título ou descrição.
 * @returns {string} Texto sem rótulos, com os restos de pontuação limpos.
 */
export function removerRotulos(texto) {
  const semResiduos = TROCAS_RESIDUO.reduce(
    (atual, [padrao, troca]) => atual.replace(padrao, troca), texto);
  const semRotulos = PADROES_ROTULO.reduce((atual, padrao) => atual.replace(padrao, ''),
    semResiduos);
  const limpo = PADROES_LIMPEZA.reduce((atual, [padrao, troca]) => atual.replace(padrao, troca),
    semRotulos);
  return limpo.trim();
}

/**
 * Troca chaves, tokens, e-mails e CPFs por uma marca neutra.
 * @param {string} texto Texto a mascarar.
 * @returns {string} Texto sem segredos reconhecíveis.
 */
export function mascararSegredos(texto) {
  return PADROES_SEGREDO.reduce((atual, padrao) => atual.replace(padrao, MARCA_OCULTA), texto);
}

/**
 * Deixa um texto pronto para o Jev: sem rótulos e sem segredos.
 * @param {string} texto Texto bruto.
 * @returns {string} Texto cego e mascarado.
 */
export function sanitizarTexto(texto) {
  return mascararSegredos(removerRotulos(String(texto ?? '')));
}

/**
 * Divide uma linha de tabela Markdown em células.
 * @param {string} linha Linha começando e terminando em `|`.
 * @returns {string[]} Células sem espaços nas pontas.
 */
function dividirCelulas(linha) {
  return linha.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map((c) => c.trim());
}

/**
 * Tira negrito, crase e emojis de ênfase de uma célula.
 * @param {string} texto Célula.
 * @returns {string} Texto simples.
 */
function limparMarkdown(texto) {
  return String(texto ?? '').replace(/\*\*/g, '').replace(/`/g, '').trim();
}

/**
 * Converte uma linha da tabela em item do quadro (sem a coluna Modelo, que é rótulo).
 * @param {Record<string, string>} registro Células pelo nome da coluna.
 * @returns {{id: string, titulo: string, prioridade: string, status: string, emUsoPor: string,
 *   etapa: {rotulo: string, caminho: string}|null}} Item do quadro.
 */
function montarItem(registro) {
  const link = String(registro.Etapa ?? '').match(PADRAO_LINK_ETAPA);
  return {
    id: limparMarkdown(registro.Tarefa),
    titulo: limparMarkdown(registro['Título']),
    prioridade: limparMarkdown(registro.Prioridade),
    status: limparMarkdown(registro.Status),
    emUsoPor: limparMarkdown(registro['Em uso por']),
    etapa: link ? { rotulo: link[1], caminho: link[2] } : null,
  };
}

/**
 * Converte um item do índice simplificado no mesmo formato de item da tabela.
 * @param {object} item Item de `lerIndiceSimplificado`.
 * @returns {{id: string, titulo: string, prioridade: string, status: string, emUsoPor: string,
 *   etapa: {rotulo: string, caminho: string}|null}} Item do quadro.
 */
function itemDoIndice(item) {
  return {
    id: item.id,
    titulo: limparMarkdown(item.titulo),
    prioridade: item.prioridade,
    status: item.status,
    emUsoPor: item.emUsoPor,
    etapa: item.etapaLink ? { rotulo: item.etapaRotulo, caminho: item.etapaLink } : null,
  };
}

/**
 * Lê o quadro sem cabeçalho de tabela: índice simplificado, arquivo vazio, tabela sem cabeçalho
 * (vazio, como antes) ou erro de formato (R2.3).
 * @param {string} texto Conteúdo do arquivo.
 * @returns {object[]} Itens do quadro.
 * @throws {ErroFormatoQuadro} Se o texto não casar com nenhum dos dois formatos.
 */
function lerQuadroSemTabela(texto) {
  const formato = detectarFormato(texto);
  if (formato === FORMATOS.VAZIO || formato === FORMATOS.TABELA) return [];
  if (formato !== FORMATOS.SIMPLIFICADO) throw new ErroFormatoQuadro();
  return lerIndiceSimplificado(texto).itens.map(itemDoIndice);
}

/**
 * Lê as linhas de tarefa de um quadro (somente leitura), na tabela ou no índice simplificado.
 * @param {string} [arquivo] Caminho do `STATUS.md` ou do `task_complete.md`.
 * @returns {object[]} Itens do quadro (mães e subtarefas), vazio se o arquivo não existir.
 * @throws {ErroFormatoQuadro} Se o arquivo não casar com nenhum dos dois formatos (R2.3).
 */
export function lerQuadro(arquivo = ARQUIVO_QUADRO) {
  if (!existsSync(arquivo)) return [];

  const texto = readFileSync(arquivo, 'utf8');
  const linhas = texto.split(/\r?\n/);
  const inicio = linhas.findIndex((linha) => PADRAO_CABECALHO_TABELA.test(linha));
  if (inicio < 0) return lerQuadroSemTabela(texto);

  const cabecalho = dividirCelulas(linhas[inicio]);
  const itens = [];
  for (const linha of linhas.slice(inicio + 1)) {
    if (!linha.startsWith('|')) break;
    if (PADRAO_SEPARADOR_TABELA.test(linha)) continue;
    const celulas = dividirCelulas(linha);
    if (celulas.length !== cabecalho.length) continue;
    const item = montarItem(Object.fromEntries(cabecalho.map((nome, i) => [nome, celulas[i]])));
    if (item.id) itens.push(item);
  }
  return itens;
}

/**
 * Diz se o item é uma subtarefa (`<TAREFA>.<n>`) e não a linha da mãe.
 * @param {{id: string}} item Item do quadro.
 * @returns {boolean} true para subtarefa.
 */
export function ehSubtarefa(item) {
  return /\.\d+$/.test(item.id);
}

/**
 * Extrai do texto da etapa a seção `### <ID> — título` até o próximo título de mesmo nível.
 * @param {string} textoEtapa Conteúdo completo da etapa.
 * @param {string} id ID da subtarefa.
 * @returns {string} Texto da seção (com o título), vazio se não existir.
 */
export function extrairSecao(textoEtapa, id) {
  const escapado = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const alvo = new RegExp(`^(#{2,4})\\s+#?${escapado}(?![A-Za-z0-9.])`);
  const linhas = textoEtapa.split(/\r?\n/);
  const inicio = linhas.findIndex((linha) => alvo.test(linha));
  if (inicio < 0) return '';

  const nivel = linhas[inicio].match(alvo)[1].length;
  const fim = linhas.findIndex((linha, i) => {
    const titulo = i > inicio && linha.match(/^(#{2,4})\s/);
    return Boolean(titulo) && titulo[1].length <= nivel;
  });
  return linhas.slice(inicio, fim < 0 ? linhas.length : fim).join('\n');
}

/**
 * Lê o valor de uma linha rotulada (`- **Arquivos:** …`) da seção.
 * @param {string[]} linhas Linhas da seção.
 * @param {Set<string>} rotulos Rótulos (minúsculos) que identificam a linha.
 * @returns {string} Valor da primeira linha encontrada, ou vazio.
 */
function lerCampo(linhas, rotulos) {
  for (const linha of linhas) {
    const achado = linha.match(PADRAO_ROTULO_LINHA);
    if (achado && rotulos.has(achado[1].trim().toLowerCase())) return achado[2].trim();
  }
  return '';
}

/**
 * Extrai os caminhos citados entre crases numa linha de "Arquivos".
 * @param {string} texto Valor do campo Arquivos.
 * @returns {string[]} Caminhos citados (sem repetição).
 */
function extrairArquivos(texto) {
  const caminhos = [...texto.matchAll(PADRAO_CAMINHO_CRASE)].map((achado) => achado[1].trim());
  return [...new Set(caminhos)];
}

/**
 * Monta o texto da descrição: a seção sem título, sem linhas-rótulo e sem Arquivos/Critérios.
 * @param {string[]} linhas Linhas da seção sem o título.
 * @returns {string} Descrição limpa de rótulos e segredos, limitada em tamanho.
 */
function montarDescricao(linhas) {
  const mantidas = linhas.filter((linha) => {
    if (PADRAO_LINHA_RESIDUO.test(linha)) return false;
    const achado = linha.match(PADRAO_ROTULO_LINHA);
    const rotulo = achado?.[1].trim().toLowerCase();
    return !rotulo || !(ROTULOS_REMOVIDOS.has(rotulo) || ROTULOS_SEPARADOS.has(rotulo));
  });
  return sanitizarTexto(mantidas.join('\n')).slice(0, TAMANHO_MAXIMO_DESCRICAO).trim();
}

/**
 * Monta o `state` cego de uma subtarefa: id, título, etapa, prioridade, descrição, arquivos e
 * critérios; nenhum campo de nível, modelo ou effort.
 * @param {object} item Item do quadro (de {@link lerQuadro}).
 * @param {string} secao Seção da subtarefa na etapa (pode ser vazia).
 * @returns {object} State pronto para o Jev.
 */
export function montarStateCego(item, secao) {
  const linhas = secao ? secao.split(/\r?\n/).slice(1) : [];
  return {
    subtarefa: sanitizarTexto(item.id),
    titulo: sanitizarTexto(item.titulo),
    etapa: item.etapa?.rotulo ?? '',
    prioridade: item.prioridade,
    descricao: montarDescricao(linhas),
    arquivos: extrairArquivos(lerCampo(linhas, new Set(['arquivos']))).map(sanitizarTexto),
    criterios: sanitizarTexto(lerCampo(linhas, new Set(['critérios de aceitação',
      'criterios de aceitacao']))),
  };
}

/**
 * Lê a seção da subtarefa na etapa citada pelo quadro.
 * @param {object} item Item do quadro.
 * @param {string} pastaQuadro Pasta do quadro (base do link da etapa).
 * @returns {string} Seção da subtarefa, ou vazio se não há etapa/seção.
 */
export function lerSecaoDaSubtarefa(item, pastaQuadro) {
  if (!item.etapa) return '';

  const arquivo = resolve(pastaQuadro, item.etapa.caminho);
  if (!existsSync(arquivo)) return '';
  return extrairSecao(readFileSync(arquivo, 'utf8'), item.id);
}

/**
 * Monta o `state` cego de um item do quadro lendo a etapa dele.
 * @param {object} item Item do quadro.
 * @param {string} [arquivoQuadro] Quadro de onde o item veio (base dos links de etapa).
 * @returns {object} State cego.
 */
export function carregarStateCego(item, arquivoQuadro = ARQUIVO_QUADRO) {
  return montarStateCego(item, lerSecaoDaSubtarefa(item, dirname(arquivoQuadro)));
}

/**
 * Diz se a subtarefa está livre para pegar (sem reserva e ainda não concluída).
 * @param {{emUsoPor: string, status: string}} item Item do quadro.
 * @returns {boolean} true quando livre.
 */
export function estaLivre(item) {
  const semReserva = item.emUsoPor === SIMBOLO_LIVRE || item.emUsoPor === '';
  return semReserva && !item.status.includes('Concluído');
}

/**
 * Seleciona as primeiras subtarefas do quadro que têm seção na etapa (amostra do dry-run).
 * @param {object[]} itens Itens do quadro.
 * @param {{limite: number, arquivoQuadro?: string}} opcoes Quantidade e quadro de origem.
 * @returns {object[]} Até `limite` subtarefas com seção encontrada.
 */
export function selecionarSubtarefas(itens, opcoes) {
  const arquivoQuadro = opcoes.arquivoQuadro ?? ARQUIVO_QUADRO;
  const pasta = dirname(arquivoQuadro);
  return itens
    .filter((item) => ehSubtarefa(item) && lerSecaoDaSubtarefa(item, pasta) !== '')
    .slice(0, opcoes.limite);
}
