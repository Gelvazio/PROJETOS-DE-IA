// Benchmark do Jev (JEV-RULES-AI.3): roda o golden na variante `cego` (state sem rótulo)
// ou `revisor` (state + `nivel_atual`, o vazamento do teste antigo), calcula as métricas e grava
// JSON, Markdown e auditoria JSONL em scripts/jev/benchmarks/saidas/ (fora do Git).
// Uso: node scripts/jev/avaliar.mjs --variante cego|revisor
//        [--golden arquivo] [--repeticoes 1] [--concorrencia 3] [--limite N]
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ErroJev, carregarConfiguracao, lerChave } from './config.mjs';
import { criarCliente } from './cliente.mjs';
import { agregarRespostas } from './decidir.mjs';
import { montarPerguntas } from './perguntas.mjs';
import { montarRelatorio, renderizarMarkdown } from './relatorio-avaliacao.mjs';

const PASTA_JEV = dirname(fileURLToPath(import.meta.url));
const GOLDEN_PADRAO = join(PASTA_JEV, 'benchmarks', 'golden.jsonl');
const PASTA_SAIDAS = join(PASTA_JEV, 'benchmarks', 'saidas');
const CONCORRENCIA_PADRAO = 3;
const VARIANTES = Object.freeze({ CEGO: 'cego', REVISOR: 'revisor' });

/**
 * Lê um argumento `--nome valor` da linha de comando.
 * @param {string} nome Nome sem os traços.
 * @param {string} padrao Valor quando ausente.
 * @returns {string} Valor lido.
 */
function lerArgumento(nome, padrao) {
  const indice = process.argv.indexOf(`--${nome}`);
  return indice >= 0 && process.argv[indice + 1] ? process.argv[indice + 1] : padrao;
}

/**
 * Lê o golden (um item JSON por linha).
 * @param {string} arquivo Caminho do `.jsonl`.
 * @returns {object[]} Itens com `id`, `esperado`, `state_sem_rotulo` e `tags`.
 */
export function lerGolden(arquivo) {
  return readFileSync(arquivo, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
}

/**
 * Monta o state da variante: `cego` não leva rótulo; `revisor` leva `nivel_atual` (vazamento).
 * @param {object} item Item do golden.
 * @param {string} variante `cego` ou `revisor`.
 * @returns {object} State para o backend.
 */
export function montarStateDaVariante(item, variante) {
  const state = item.state_sem_rotulo;
  if (variante === VARIANTES.REVISOR) return { ...state, nivel_atual: item.esperado };
  return state;
}

/**
 * Cria o backend Jev (cliente real, com teto de tokens e log).
 * @returns {{nome: string, rodada: object, perguntar: Function}} Backend.
 */
function criarBackendJev() {
  const config = carregarConfiguracao();
  const cliente = criarCliente({ config, chave: lerChave({ arquivoEnv: config.arquivoEnv }) });
  return {
    nome: 'jev',
    modelo: config.modelo,
    obterUso: () => cliente.obterUso(),
    perguntar: async (state) => {
      const r = await cliente.perguntar({ state, perguntas: montarPerguntas(), acao: 'benchmark' });
      return { respostas: r.respostas, tokens: r.uso.tokensEntrada, custoUsd: r.custoUsd,
        latenciaMs: r.latenciaMs };
    },
  };
}

/**
 * Executa um item no backend e resume a previsão (nunca lança: erro vira registro).
 * @param {object} backend Backend.
 * @param {object} item Item do golden.
 * @param {{variante: string, repeticao: number}} opcoes Variante e número da repetição.
 * @returns {Promise<object>} Registro de auditoria do item.
 */
async function avaliarItem(backend, item, opcoes) {
  const base = { id: item.id, repeticao: opcoes.repeticao, esperado: item.esperado,
    tags: item.tags, auditado: item.auditado ?? false };
  try {
    const r = await backend.perguntar(montarStateDaVariante(item, opcoes.variante));
    const s = agregarRespostas({ subtarefa: item.id, respostas: r.respostas });
    return { ...base, nivel_sugerido: s.nivel_sugerido, nivel_final: s.nivel_final_proposto,
      confianca: s.confianca, acao: s.acao, sinais: s.sinais,
      probabilidades: r.respostas?.nivel?.probabilities ?? null,
      tokens: r.tokens, custo_usd: r.custoUsd, latencia_ms: r.latenciaMs, erro: null };
  } catch (erro) {
    return { ...base, nivel_sugerido: null, nivel_final: null, confianca: null, acao: 'erro',
      sinais: null, probabilidades: null, tokens: 0, custo_usd: 0, latencia_ms: null,
      erro: erro instanceof ErroJev ? erro.codigo : (erro.name ?? 'ERRO') };
  }
}

/**
 * Roda uma lista de tarefas com no máximo `concorrencia` em paralelo, mantendo a ordem.
 * @param {Array<() => Promise<object>>} tarefas Funções que devolvem promessas.
 * @param {number} concorrencia Limite de paralelismo.
 * @returns {Promise<object[]>} Resultados na ordem das tarefas.
 */
async function executarEmLotes(tarefas, concorrencia) {
  const resultados = new Array(tarefas.length);
  let proxima = 0;
  const trabalhador = async () => {
    while (proxima < tarefas.length) {
      const indice = proxima;
      proxima += 1;
      resultados[indice] = await tarefas[indice]();
    }
  };
  await Promise.all(Array.from({ length: Math.min(concorrencia, tarefas.length) }, trabalhador));
  return resultados;
}

/**
 * Avalia o golden inteiro num backend (todas as repetições).
 * @param {object} backend Backend.
 * @param {object[]} golden Itens.
 * @param {{variante: string, repeticoes: number, concorrencia: number}} opcoes Opções.
 * @returns {Promise<object[]>} Registros de auditoria.
 */
async function avaliarBackend(backend, golden, opcoes) {
  const tarefas = [];
  for (let repeticao = 1; repeticao <= opcoes.repeticoes; repeticao += 1) {
    for (const item of golden) {
      tarefas.push(() => avaliarItem(backend, item, { variante: opcoes.variante, repeticao }));
    }
  }
  return executarEmLotes(tarefas, opcoes.concorrencia);
}

/**
 * Grava o relatório JSON, o Markdown e a auditoria JSONL.
 * @param {object} relatorio Relatório de {@link montarRelatorio}.
 * @param {Record<string, object[]>} registros Registros por backend.
 * @returns {Promise<string>} Prefixo dos arquivos gravados.
 */
async function gravarSaidas(relatorio, registros) {
  await mkdir(PASTA_SAIDAS, { recursive: true });
  const prefixo = join(PASTA_SAIDAS, `avaliacao-${relatorio.variante}-${Date.now()}`);
  await writeFile(`${prefixo}.json`, JSON.stringify(relatorio, null, 2), 'utf8');
  await writeFile(`${prefixo}.md`, renderizarMarkdown(relatorio), 'utf8');
  const linhas = Object.entries(registros).flatMap(([backend, lista]) => lista
    .map((registro) => JSON.stringify({ backend, ...registro })));
  await writeFile(`${prefixo}.auditoria.jsonl`, `${linhas.join('\n')}\n`, 'utf8');
  return prefixo;
}

/**
 * Programa principal: lê argumentos, roda os backends pedidos e grava as saídas.
 * @returns {Promise<number>} Código de saída.
 */
async function principal() {
  const variante = lerArgumento('variante', VARIANTES.CEGO);
  const limite = Number(lerArgumento('limite', '0')) || Infinity;
  const golden = lerGolden(resolve(lerArgumento('golden', GOLDEN_PADRAO))).slice(0, limite);
  const opcoes = { variante, repeticoes: Number(lerArgumento('repeticoes', '1')),
    concorrencia: Number(lerArgumento('concorrencia', String(CONCORRENCIA_PADRAO))) };
  const backends = [criarBackendJev()];
  const registros = {};
  for (const backend of backends) {
    registros[backend.nome] = await avaliarBackend(backend, golden, opcoes);
  }
  const uso = Object.fromEntries(backends.map((b) => [b.nome,
    { modelo: b.modelo, ...b.obterUso() }]));
  const relatorio = montarRelatorio({ variante, golden, registros, uso, avisos: [],
    repeticoes: opcoes.repeticoes });
  const prefixo = await gravarSaidas(relatorio, registros);
  console.log(renderizarMarkdown(relatorio));
  console.log(`\nSaídas: ${prefixo}.{json,md,auditoria.jsonl}`);
  return 0;
}

const executadoDireto = process.argv[1]
  && resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
if (executadoDireto) {
  principal().then((codigo) => { process.exitCode = codigo; }).catch((erro) => {
    console.error(`Erro: ${erro.message}`);
    process.exitCode = 1;
  });
}
