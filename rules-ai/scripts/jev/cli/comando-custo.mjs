// Subcomando `custo`: soma tokens e custo do Jev pelo log de chamadas (saidas/chamadas.jsonl,
// uma linha por chamada à API) e conta as decisões dos guardrails (saidas/guardrails.jsonl, sem
// somar custo de novo: ele já está no log de chamadas). Só lê; os logs não têm chave nem conteúdo.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PASTA_SAIDAS } from '../config.mjs';
import { lerTexto } from './argumentos.mjs';
import { CODIGOS_SAIDA, imprimir, montarTabela } from './saida.mjs';

const LOG_CHAMADAS = 'chamadas.jsonl';
const LOG_GUARDRAILS = 'guardrails.jsonl';
const REAIS_POR_DOLAR = 6;
const CASAS_USD = 6;
const CASAS_BRL = 4;

/**
 * Lê as linhas válidas de um log JSONL (linha corrompida é ignorada).
 * @param {string} arquivo Caminho do log.
 * @param {string|undefined} desde Data ISO mínima (inclusive), ou undefined.
 * @returns {object[]} Registros.
 */
function lerLog(arquivo, desde) {
  if (!existsSync(arquivo)) return [];

  const registros = [];
  for (const linha of readFileSync(arquivo, 'utf8').split(/\r?\n/).filter(Boolean)) {
    try {
      const registro = JSON.parse(linha);
      if (!desde || String(registro.data ?? '') >= desde) registros.push(registro);
    } catch {
      continue;
    }
  }
  return registros;
}

/**
 * Soma chamadas, tokens e custo por ação.
 * @param {object[]} chamadas Registros de `chamadas.jsonl`.
 * @returns {Record<string, {chamadas: number, tokens: number, custo_usd: number}>} Resumo.
 */
export function resumirCustos(chamadas) {
  const resumo = {};
  for (const r of chamadas) {
    const grupo = r.acao ?? 'desconhecido';
    const atual = resumo[grupo] ?? { chamadas: 0, tokens: 0, custo_usd: 0 };
    atual.chamadas += 1;
    atual.tokens += (r.tokens_entrada ?? 0) + (r.tokens_saida ?? 0);
    atual.custo_usd += r.custo_usd ?? 0;
    resumo[grupo] = atual;
  }
  return resumo;
}

/**
 * Conta as decisões dos guardrails por caso e ação.
 * @param {object[]} decisoes Registros de `guardrails.jsonl`.
 * @returns {Record<string, number>} Contagem por `caso/ação`.
 */
export function contarDecisoes(decisoes) {
  const contagem = {};
  for (const r of decisoes) {
    const chave = `${r.caso ?? 'desconhecido'}/${r.acao ?? '?'}`;
    contagem[chave] = (contagem[chave] ?? 0) + 1;
  }
  return contagem;
}

/**
 * Executa o subcomando.
 * @param {{opcoes: Record<string, string|true>}} argumentos Argumentos lidos (`--desde ISO`).
 * @returns {Promise<number>} Código de saída (sempre 0).
 */
export async function executarCusto({ opcoes }) {
  const desde = lerTexto(opcoes, 'desde');
  const resumo = resumirCustos(lerLog(join(PASTA_SAIDAS, LOG_CHAMADAS), desde));
  const decisoes = contarDecisoes(lerLog(join(PASTA_SAIDAS, LOG_GUARDRAILS), desde));
  const grupos = Object.values(resumo);
  const total = grupos.reduce((soma, g) => soma + g.custo_usd, 0);
  const linhas = Object.entries(resumo).map(([grupo, g]) => [grupo, g.chamadas, g.tokens,
    g.custo_usd.toFixed(CASAS_USD), (g.custo_usd * REAIS_POR_DOLAR).toFixed(CASAS_BRL)]);
  linhas.push(['**TOTAL**', grupos.reduce((s, g) => s + g.chamadas, 0),
    grupos.reduce((s, g) => s + g.tokens, 0), total.toFixed(CASAS_USD),
    (total * REAIS_POR_DOLAR).toFixed(CASAS_BRL)]);
  const tabela = montarTabela(['Ação', 'Chamadas', 'Tokens', 'US$',
    `R$ (a ${REAIS_POR_DOLAR})`], linhas);
  const tabelaDecisoes = montarTabela(['Guardrail/ação', 'Decisões'],
    Object.entries(decisoes));
  imprimir({ json: Boolean(opcoes.json), objeto: { resumo, decisoes, total_usd: total },
    texto: `${tabela}\n\n${tabelaDecisoes}` });
  return CODIGOS_SAIDA.OK;
}
