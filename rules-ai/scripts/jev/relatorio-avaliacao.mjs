// Monta e formata o relatório do benchmark (JSON e Markdown) a partir dos registros de
// avaliar.mjs. Só cálculo e texto: sem rede e sem chave.
import {
  acuracia, brierMulticlasse, calcularEce, curvaCoberturaPrecisao,
  intervaloWilson, macroF1, matrizConfusao, metricasDoNivel, percentil,
} from './metricas.mjs';
import { NIVEIS, ORDEM_NIVEIS } from './modelos.mjs';

/** Câmbio assumido só para exibir o custo em reais (a cobrança do Jev é em dólar). */
export const REAIS_POR_DOLAR = 6;
const ALVOS = Object.freeze({ SUGERIDO: 'nivel_sugerido', FINAL: 'nivel_final' });
const CASAS = 3;

/**
 * Formata um número ou "—".
 * @param {number|null|undefined} valor Valor.
 * @param {number} [casas] Casas decimais.
 * @returns {string} Texto.
 */
function formatar(valor, casas = CASAS) {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor.toFixed(casas) : '—';
}

/**
 * Formata um intervalo `[inferior; superior]`.
 * @param {{inferior: number, superior: number}|null} ic Intervalo.
 * @returns {string} Texto.
 */
function formatarIc(ic) {
  return ic ? `[${formatar(ic.inferior)}; ${formatar(ic.superior)}]` : '—';
}

/**
 * Calcula as métricas de classificação de um conjunto de registros para um alvo.
 * @param {object[]} registros Registros de auditoria.
 * @param {string} alvo Campo previsto (`nivel_sugerido` ou `nivel_final`).
 * @returns {object} Acurácia, IC, matriz, por nível, macro-F1, Brier, ECE e curva.
 */
export function calcularMetricas(registros, alvo) {
  const validos = registros.filter((r) => r.erro === null);
  const pares = validos.map((r) => ({ esperado: r.esperado, previsto: r[alvo] }));
  const matriz = matrizConfusao(pares);
  const acertos = pares.filter((p) => p.esperado === p.previsto).length;
  const comConfianca = validos.filter((r) => typeof r.confianca === 'number')
    .map((r) => ({ confianca: r.confianca, acertou: r.esperado === r[alvo] }));
  return {
    itens: validos.length,
    acuracia: acuracia(pares),
    ic_acuracia: intervaloWilson(acertos, pares.length),
    matriz,
    por_nivel: Object.fromEntries(ORDEM_NIVEIS.map((n) => [n, metricasDoNivel(matriz, n)])),
    macro_f1: macroF1(matriz),
    brier: brierMulticlasse(validos.map((r) => ({ esperado: r.esperado,
      probabilidades: r.probabilidades }))),
    ece: calcularEce(comConfianca),
    curva: curvaCoberturaPrecisao(comConfianca),
  };
}

/**
 * Acurácia do alvo por subgrupo (reais, sintéticos, auditados, borda, rótulo duvidoso).
 * @param {object[]} registros Registros de auditoria.
 * @param {string} alvo Campo previsto.
 * @returns {Record<string, {itens: number, acuracia: number|null}>} Acurácia por subgrupo.
 */
function calcularSubgrupos(registros, alvo) {
  const grupos = {
    reais: (r) => r.tags.includes('real'),
    sinteticos: (r) => r.tags.includes('sintetico'),
    auditados: (r) => r.auditado,
    borda: (r) => r.tags.includes('borda'),
    rotulo_duvidoso: (r) => r.tags.includes('rotulo_duvidoso'),
  };
  return Object.fromEntries(Object.entries(grupos).map(([nome, filtro]) => {
    const dentro = registros.filter((r) => filtro(r) && r.erro === null);
    const pares = dentro.map((r) => ({ esperado: r.esperado, previsto: r[alvo] }));
    return [nome, { itens: dentro.length, acuracia: acuracia(pares) }];
  }));
}

/**
 * Latência, tokens, custo e erros de um backend.
 * @param {object[]} registros Registros.
 * @param {object} uso Uso informado pelo cliente.
 * @returns {object} Resumo operacional.
 */
function calcularOperacao(registros, uso) {
  const latencias = registros.map((r) => r.latencia_ms).filter((v) => typeof v === 'number');
  const erros = registros.filter((r) => r.erro !== null);
  const custoUsd = registros.reduce((soma, r) => soma + r.custo_usd, 0);
  return {
    chamadas: registros.length,
    erros: erros.length,
    codigos_erro: [...new Set(erros.map((r) => r.erro))],
    p50_ms: percentil(latencias, 0.5),
    p95_ms: percentil(latencias, 0.95),
    tokens_entrada: registros.reduce((soma, r) => soma + r.tokens, 0),
    custo_usd: custoUsd,
    custo_brl: custoUsd * REAIS_POR_DOLAR,
    modelo: uso?.modelo ?? null,
  };
}

/**
 * Estabilidade entre repetições: fração de itens com a mesma previsão em todas.
 * @param {object[]} registros Registros (várias repetições).
 * @returns {number|null} Fração estável, ou null com uma só repetição.
 */
function calcularEstabilidade(registros) {
  const porItem = Map.groupBy(registros.filter((r) => r.erro === null), (r) => r.id);
  const grupos = [...porItem.values()].filter((g) => g.length > 1);
  if (grupos.length === 0) return null;
  return grupos.filter((g) => new Set(g.map((r) => r.nivel_final)).size === 1).length
    / grupos.length;
}

/**
 * Monta o relatório completo.
 * @param {{variante: string, golden: object[], registros: Record<string, object[]>,
 *   uso: object, avisos: string[], repeticoes: number}} entrada
 * @returns {object} Relatório serializável.
 */
export function montarRelatorio(entrada) {
  const backends = {};
  for (const [nome, registros] of Object.entries(entrada.registros)) {
    backends[nome] = {
      operacao: calcularOperacao(registros, entrada.uso[nome]),
      estabilidade: calcularEstabilidade(registros),
      sugerido: calcularMetricas(registros, ALVOS.SUGERIDO),
      final: calcularMetricas(registros, ALVOS.FINAL),
      subgrupos_final: calcularSubgrupos(registros, ALVOS.FINAL),
    };
  }
  const contagem = Object.fromEntries(ORDEM_NIVEIS.map((n) => [n,
    entrada.golden.filter((i) => i.esperado === n).length]));
  return {
    gerado_em: new Date().toISOString(),
    variante: entrada.variante,
    repeticoes: entrada.repeticoes,
    golden: { itens: entrada.golden.length, por_nivel: contagem,
      auditados: entrada.golden.filter((i) => i.auditado).length,
      borda: entrada.golden.filter((i) => i.tags.includes('borda')).length },
    avisos: entrada.avisos,
    backends,
  };
}

/**
 * Renderiza a matriz de confusão como tabela Markdown.
 * @param {Record<string, Record<string, number>>} matriz Matriz.
 * @returns {string} Tabela.
 */
function tabelaMatriz(matriz) {
  const cabecalho = `| esperado \\ previsto | ${ORDEM_NIVEIS.join(' | ')} |\n|---|---|---|---|`;
  const linhas = ORDEM_NIVEIS.map((e) => {
    const celulas = ORDEM_NIVEIS.map((p) => matriz[e][p]).join(' | ');
    return `| ${e} | ${celulas} |`;
  });
  return [cabecalho, ...linhas].join('\n');
}

/**
 * Renderiza as métricas de um alvo (sugerido ou final) de um backend.
 * @param {string} titulo Título da seção.
 * @param {object} m Métricas de {@link calcularMetricas}.
 * @returns {string} Markdown.
 */
function secaoMetricas(titulo, m) {
  const pesado = m.por_nivel[NIVEIS.PESADO];
  const porNivel = ORDEM_NIVEIS.map((n) => `| ${n} | ${m.por_nivel[n].suporte} | `
    + `${formatar(m.por_nivel[n].recall)} ${formatarIc(m.por_nivel[n].ic_recall)} | `
    + `${formatar(m.por_nivel[n].precisao)} | ${formatar(m.por_nivel[n].f1)} |`);
  const curva = m.curva.map((c) => (
    `| ${c.limiar} | ${formatar(c.cobertura)} | ${formatar(c.precisao)} |`));
  return [`#### ${titulo}`, '',
    `Acurácia **${formatar(m.acuracia)}** ${formatarIc(m.ic_acuracia)} em ${m.itens} itens · `
    + `macro-F1 ${formatar(m.macro_f1)} · Brier ${formatar(m.brier)} · ECE ${formatar(m.ece)}`, '',
    `**Recall de PESADO: ${formatar(pesado.recall)} ${formatarIc(pesado.ic_recall)}** `
    + `(${pesado.suporte} itens)`, '',
    tabelaMatriz(m.matriz), '',
    '| nível | itens | recall (IC 95%) | precisão | F1 |', '|---|---|---|---|---|', ...porNivel, '',
    '| limiar de confiança | cobertura | precisão |', '|---|---|---|', ...curva, ''].join('\n');
}

/**
 * Renderiza o relatório em Markdown.
 * @param {object} r Relatório de {@link montarRelatorio}.
 * @returns {string} Markdown.
 */
export function renderizarMarkdown(r) {
  const partes = [`# Benchmark Jev — variante ${r.variante}`, '',
    `Golden: ${r.golden.itens} itens (${ORDEM_NIVEIS.map((n) => `${n} ${r.golden.por_nivel[n]}`)
      .join(', ')}) · auditados ${r.golden.auditados} · borda ${r.golden.borda} · repetições `
    + `${r.repeticoes}`, '', ...r.avisos.map((a) => `> ⚠️ ${a}`), ''];
  for (const [nome, b] of Object.entries(r.backends)) {
    const o = b.operacao;
    partes.push(`### Backend ${nome}${o.modelo ? ` (${o.modelo})` : ''}`, '',
      `Chamadas ${o.chamadas} · erros ${o.erros} ${o.codigos_erro.join(',')} · `
      + `p50 ${formatar(o.p50_ms, 0)} ms`
      + ` · p95 ${formatar(o.p95_ms, 0)} ms · tokens ${o.tokens_entrada} · custo US$ `
      + `${formatar(o.custo_usd, 6)} (R$ ${formatar(o.custo_brl, 4)} a ${REAIS_POR_DOLAR},00/US$)`
      + (b.estabilidade === null ? '' : ` · estabilidade ${formatar(b.estabilidade)}`), '',
      secaoMetricas('Nível final (Jev + sinais de PESADO) — o que o rules-ai usaria', b.final),
      secaoMetricas('Nível sugerido (só a pergunta `nivel`)', b.sugerido),
      '| subgrupo (nível final) | itens | acurácia |', '|---|---|---|',
      ...Object.entries(b.subgrupos_final).map(([g, v]) => (
        `| ${g} | ${v.itens} | ${formatar(v.acuracia)} |`)), '');
  }
  return partes.join('\n');
}
