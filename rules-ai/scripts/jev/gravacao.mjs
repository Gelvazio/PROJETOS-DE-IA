// Regra pura da gravação do nível pelo Jev (C47, JEV-GRAVA-NIVEL.2). Sem I/O: decide o nível a
// gravar e edita textos de etapa e de quadro. Só o Jev com confiança >= 0,80 e sem sinal de
// PESADO decide sozinho (INV-1); qualquer outro caminho grava o nível mais restritivo, e sem
// nenhuma informação sobe para PESADO (INV-2: falha nunca grava nível menor que o dos sinais).
import {
  LIMIAR_AUTOMATICO, LIMIAR_SINAL_PESADO,
} from './decidir.mjs';
import { NIVEIS, derivarEffort } from './modelos.mjs';
import { SINAIS_PESADO } from './perguntas.mjs';
import {
  ehFormatoSimplificado, lerIndiceSimplificado, reescreverNivel,
} from './quadro-formato.mjs';

/** Texto da coluna Modelo do quadro e da linha Modelo da etapa, por nível (C22 e C48). */
const MODELO_POR_NIVEL = Object.freeze({
  [NIVEIS.LEVE]: 'só Haiku 5.5 ou DeepSeek V4.1 Flash',
  [NIVEIS.MEDIO]: 'só Sonnet',
  [NIVEIS.PESADO]: 'só Opus 5.5+/Fable, Sonnet ou DeepSeek',
});
export const CAMPO_JEV = 'JEV-AI-SUGGESTION';
const ROTULOS = Object.freeze({
  nivel: 'N[ií]vel', modelo: 'Modelo', effort: 'Effort', jev: CAMPO_JEV, fonte: 'Fonte',
});
const PADRAO_ITEM = /^- \*\*/;
const CASAS_CONFIANCA = 2;
const QUEBRA = String.fromCharCode(10);

/**
 * Decide o que gravar a partir da sugestão do Jev (pura e determinística).
 * @param {object} sugestao Sugestão de `agregarRespostas` / `classificarSubtarefa`.
 * @returns {{nivel: string, effort: string, jevDecidiu: boolean, fonte: string,
 *   revisar: boolean, confianca: number|null}} Decisão de gravação.
 */
export function decidirGravacao(sugestao) {
  const acesos = SINAIS_PESADO.filter(
    (nome) => (sugestao.sinais?.[nome] ?? 0) >= LIMIAR_SINAL_PESADO);
  const jevValido = Boolean(sugestao.nivel_sugerido) && !sugestao.erro_codigo;
  const confianca = sugestao.confianca ?? null;
  const confiante = confianca !== null && confianca >= LIMIAR_AUTOMATICO;
  const jevDecidiu = jevValido && confiante && acesos.length === 0;
  const nivel = jevDecidiu
    ? sugestao.nivel_sugerido
    : (sugestao.nivel_final_proposto ?? NIVEIS.PESADO);
  const fonteSinais = jevValido ? 'sinais' : 'sinais (jev indisponivel)';
  const fonte = jevDecidiu
    ? `jev (confiança ${confianca.toFixed(CASAS_CONFIANCA)})`
    : fonteSinais;
  return {
    nivel, effort: derivarEffort(nivel), jevDecidiu, fonte, confianca,
    revisar: !jevDecidiu && (acesos.length > 0 || !jevValido),
  };
}

/**
 * Texto da coluna Modelo do quadro para um nível.
 * @param {string} nivel LEVE, MEDIO ou PESADO.
 * @param {string} effort Effort do nível (C21).
 * @returns {string} Ex.: `MEDIO · só Sonnet · effort medium`.
 */
export function montarModeloDoQuadro(nivel, effort) {
  return `${nivel} · ${MODELO_POR_NIVEL[nivel]} · effort ${effort}`;
}

/**
 * Linhas rotuladas que a gravação escreve na seção da subtarefa.
 * @param {object} decisao Resultado de {@link decidirGravacao}.
 * @returns {Array<[string, string]>} Pares [chave do rótulo, linha completa].
 */
function montarLinhas(decisao) {
  const sim = decisao.jevDecidiu ? 'SIM' : 'NAO';
  return [
    ['nivel', `- **Nível:** ${decisao.nivel} — classificado (${decisao.fonte})`],
    ['modelo', `- **Modelo:** ${MODELO_POR_NIVEL[decisao.nivel]} — nunca outro`],
    ['effort', `- **Effort:** ${decisao.effort}`],
    ['jev', `- **${CAMPO_JEV}:** ${sim}`],
    ['fonte', `- **Fonte:** ${decisao.fonte}`],
  ];
}

/**
 * Acha o intervalo [inicio, fim) da seção `### <ID> — …` numa lista de linhas.
 * @param {string[]} linhas Linhas da etapa.
 * @param {string} id ID da subtarefa.
 * @returns {{inicio: number, fim: number}|null} Intervalo, ou null se não existir.
 */
function acharSecao(linhas, id) {
  const escapado = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const alvo = new RegExp(`^#{3}\\s+#?${escapado}(?![A-Za-z0-9.])`);
  const inicio = linhas.findIndex((linha) => alvo.test(linha));
  if (inicio < 0) return null;
  const proximo = linhas.findIndex((linha, i) => i > inicio && /^#{2,3}\s/.test(linha));
  return { inicio, fim: proximo < 0 ? linhas.length : proximo };
}

/**
 * Diz se a seção `### <ID>` existe na etapa.
 * @param {string} textoEtapa Conteúdo da etapa.
 * @param {string} id ID da subtarefa.
 * @returns {boolean} true quando a seção existe.
 */
export function secaoExiste(textoEtapa, id) {
  return acharSecao(textoEtapa.split(QUEBRA), id) !== null;
}

/**
 * Diz se a seção da subtarefa já tem a linha `Nível`.
 * @param {string} textoEtapa Conteúdo da etapa.
 * @param {string} id ID da subtarefa.
 * @returns {boolean} true quando já tem nível escrito.
 */
export function secaoTemNivel(textoEtapa, id) {
  const linhas = textoEtapa.split('\n');
  const secao = acharSecao(linhas, id);
  if (!secao) return false;
  const padrao = new RegExp(`^- \\*\\*${ROTULOS.nivel}:\\*\\*`);
  return linhas.slice(secao.inicio, secao.fim).some((linha) => padrao.test(linha));
}

/**
 * Grava Nível, Modelo, Effort, JEV-AI-SUGGESTION e Fonte na seção da subtarefa. Troca a linha
 * que já existe e insere as que faltam antes do primeiro item `- **` (ou ao fim da seção).
 * @param {string} textoEtapa Conteúdo da etapa (fim de linha `\n`).
 * @param {string} id ID da subtarefa.
 * @param {object} decisao Resultado de {@link decidirGravacao}.
 * @returns {string|null} Texto novo, ou null se a seção não existir.
 */
export function aplicarNaSecao(textoEtapa, id, decisao) {
  const linhas = textoEtapa.split('\n');
  const secao = acharSecao(linhas, id);
  if (!secao) return null;
  const faltantes = [];
  for (const [chave, linhaNova] of montarLinhas(decisao)) {
    const padrao = new RegExp(`^- \\*\\*${ROTULOS[chave]}:\\*\\*`);
    const indice = linhas.findIndex((l, i) => i >= secao.inicio && i < secao.fim && padrao.test(l));
    if (indice >= 0) linhas[indice] = linhaNova;
    else faltantes.push(linhaNova);
  }
  if (faltantes.length === 0) return linhas.join('\n');
  const primeiroItem = linhas.findIndex(
    (l, i) => i > secao.inicio && i < secao.fim && PADRAO_ITEM.test(l));
  let destino = primeiroItem;
  if (destino < 0) {
    destino = secao.fim;
    while (destino > secao.inicio + 1 && linhas[destino - 1].trim() === '') destino -= 1;
  }
  linhas.splice(destino, 0, ...faltantes);
  return linhas.join('\n');
}

/**
 * Troca a coluna Modelo da linha da subtarefa no quadro (nada mais muda: INV-3).
 * @param {string} textoQuadro Conteúdo do `STATUS.md` (fim de linha `\n`).
 * @param {string} id ID da subtarefa.
 * @param {string} modeloNovo Texto da coluna Modelo.
 * @returns {string|null} Texto novo, ou null se a linha ou a coluna não existir.
 */
export function aplicarNoQuadro(textoQuadro, id, modeloNovo) {
  if (ehFormatoSimplificado(textoQuadro)) return aplicarNoIndice(textoQuadro, id, modeloNovo);
  const linhas = textoQuadro.split('\n');
  const cabecalho = linhas.find((l) => l.startsWith('| Tarefa |'));
  const posicao = cabecalho
    ? cabecalho.split('|').slice(1, -1).findIndex((c) => c.trim() === 'Modelo')
    : -1;
  const indice = linhas.findIndex((l) => l.startsWith(`| ${id} |`));
  if (posicao < 0 || indice < 0) return null;
  const partes = linhas[indice].split(/(?<!\\)\|/);
  partes[posicao + 1] = ` ${modeloNovo} `;
  linhas[indice] = partes.join('|');
  return linhas.join('\n');
}

/**
 * Troca nível e modelo do item da subtarefa no índice simplificado (C55); o resto não muda.
 * @param {string} textoQuadro Conteúdo do `STATUS.md` (fim de linha `\n`).
 * @param {string} id ID da subtarefa.
 * @param {string} modeloNovo Texto de {@link montarModeloDoQuadro} (`NIVEL · só … · effort …`).
 * @returns {string|null} Texto novo, ou null se o item não existir ou não puder ser reescrito.
 */
function aplicarNoIndice(textoQuadro, id, modeloNovo) {
  const itens = lerIndiceSimplificado(textoQuadro).itens.filter((item) => item.id === id);
  const unico = itens.length === 1 ? itens[0] : null;
  const podeReescrever = unico && unico.ehSubtarefa && !unico.agrupada && unico.indiceStatus >= 0;
  if (!podeReescrever) return null;
  const [nivel, modelo, effort] = modeloNovo.split(' · ');
  const effortLimpo = String(effort ?? '').replace(/^effort\s+/, '');
  const linhas = textoQuadro.split('\n');
  linhas[unico.indice] = reescreverNivel(unico, { nivel, modelo, effort: effortLimpo });
  return linhas.join('\n');
}
