// Monta benchmarks/golden.jsonl a partir das subtarefas reais dos quadros de C:/fontes/*/tasks
// (rótulo = nível que já está na coluna Modelo) mais casos sintéticos de borda. Somente leitura
// nos quadros. Nunca lê DEMAIS-PROJETOS-*. O state é cego (estado.mjs): sem rótulo.
// Uso: node scripts/jev/benchmarks/construir-golden.mjs [--por-nivel 52] [--saida arquivo.jsonl]
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RAIZ_RULES_AI } from '../config.mjs';
import {
  carregarStateCego, ehSubtarefa, lerQuadro,
} from '../estado.mjs';
import { ORDEM_NIVEIS } from '../modelos.mjs';
import { AUDITADOS, DUVIDOSOS } from './auditoria.mjs';
import { CASOS_SINTETICOS } from './casos-sinteticos.mjs';

const PASTA_FONTES = join(RAIZ_RULES_AI, '..');
const POR_NIVEL_PADRAO = 52;
const TAMANHO_MINIMO_DESCRICAO = 60;
const PADRAO_NIVEL_NA_CELULA = /^(LEVE|MEDIO|MÉDIO|PESADO)\b/;
const IGNORADAS = /^(DEMAIS-PROJETOS|\.|node_modules)/;
/** Resíduos que o estado.mjs (.2) ainda deixa passar: nomes de executor e flags de nível. */
const PADRAO_LINHA_ENTREGA = /^\s*(?:[-*]\s+)?\*\*(?:Entrega|Verificação \(líder\))[^*]*\*\*.*$/i;
const PADRAO_EXECUTOR_NIVEL = /executor-(?:leve|medio|pesado)\b/gi;
const PADRAO_FLAG_NIVEL = /--(?:leve|medio|pesado)\b/gi;
const ARQUIVOS_QUADRO = ['STATUS.md', 'task_complete.md'];
const PASTA_SAIDA_PADRAO = dirname(fileURLToPath(import.meta.url));

/**
 * Lê o argumento `--nome valor` da linha de comando.
 * @param {string} nome Nome sem os traços.
 * @param {string} padrao Valor quando ausente.
 * @returns {string} Valor lido.
 */
function lerArgumento(nome, padrao) {
  const indice = process.argv.indexOf(`--${nome}`);
  return indice >= 0 && process.argv[indice + 1] ? process.argv[indice + 1] : padrao;
}

/**
 * Lê o nível da coluna Modelo de cada linha do quadro, por ID.
 * @param {string} arquivo Caminho do quadro.
 * @returns {Map<string, string>} Mapa ID → nível (LEVE|MEDIO|PESADO).
 */
function lerNiveisDoQuadro(arquivo) {
  const niveis = new Map();
  let colunaModelo = -1;
  for (const linha of readFileSync(arquivo, 'utf8').split(/\r?\n/)) {
    if (!linha.startsWith('|')) continue;
    const celulas = linha.split(/(?<!\\)\|/).slice(1, -1)
      .map((c) => c.replace(/\*\*|`/g, '').trim());
    if (celulas[0] === 'Tarefa') { colunaModelo = celulas.indexOf('Modelo'); continue; }
    const achado = colunaModelo >= 0 ? celulas[colunaModelo]?.match(PADRAO_NIVEL_NA_CELULA) : null;
    const novo = achado && !niveis.has(celulas[0]);
    if (novo) niveis.set(celulas[0], achado[1].replace('MÉDIO', 'MEDIO'));
  }
  return niveis;
}

/**
 * Ordenação estável e pseudoaleatória (hash) para amostrar sem viés de posição.
 * @param {string} texto Chave do item.
 * @returns {string} Hash hexadecimal.
 */
function chaveDeSorteio(texto) {
  return createHash('sha1').update(texto).digest('hex');
}

/**
 * Remove do state os resíduos de nível que sobraram (linha de Entrega, executor-<nível>, flags).
 * @param {object} state State cego de {@link carregarStateCego}.
 * @returns {object} State sem os resíduos.
 */
function limparResiduos(state) {
  const linhas = state.descricao.split('\n').filter((l) => !PADRAO_LINHA_ENTREGA.test(l));
  const descricao = linhas.join('\n').replace(PADRAO_EXECUTOR_NIVEL, 'executor')
    .replace(PADRAO_FLAG_NIVEL, '--nivel');
  const titulo = state.titulo.replace(PADRAO_EXECUTOR_NIVEL, 'executor');
  return { ...state, titulo, descricao };
}

/**
 * Coleta os candidatos reais de um quadro (subtarefa com nível, etapa e descrição suficiente).
 * @param {string} projeto Nome da pasta do projeto.
 * @param {string} arquivo Caminho do quadro.
 * @returns {object[]} Candidatos com `esperado` e `state_sem_rotulo`.
 */
function coletarDoQuadro(projeto, arquivo) {
  const niveis = lerNiveisDoQuadro(arquivo);
  const candidatos = [];
  for (const item of lerQuadro(arquivo).filter(ehSubtarefa)) {
    const esperado = niveis.get(item.id);
    if (!esperado) continue;
    const state = limparResiduos(carregarStateCego(item, arquivo));
    if (state.descricao.length < TAMANHO_MINIMO_DESCRICAO) continue;
    candidatos.push({
      id: `${projeto}:${item.id}`, esperado, state_sem_rotulo: state,
      tags: ['real', projeto], fonte: `${projeto}/${arquivo.split(/[\\/]/).pop()}`,
    });
  }
  return candidatos;
}

/**
 * Lista os projetos de C:/fontes com quadro, sem as pastas proibidas.
 * @returns {string[]} Nomes de pastas.
 */
function listarProjetos() {
  return readdirSync(PASTA_FONTES, { withFileTypes: true })
    .filter((entrada) => entrada.isDirectory() && !IGNORADAS.test(entrada.name))
    .map((entrada) => entrada.name)
    .filter((nome) => ARQUIVOS_QUADRO.some((q) => (
      existsSync(join(PASTA_FONTES, nome, 'tasks', q)))));
}

/**
 * Escolhe `quantidade` itens do nível alternando entre projetos (diversidade).
 * @param {object[]} candidatos Candidatos do nível.
 * @param {number} quantidade Quantos escolher.
 * @returns {object[]} Itens escolhidos, determinísticos.
 */
function amostrarAlternando(candidatos, quantidade) {
  const porProjeto = new Map();
  const ordenados = [...candidatos].sort((a, b) => (
    chaveDeSorteio(a.id).localeCompare(chaveDeSorteio(b.id))));
  for (const c of ordenados) {
    const lista = porProjeto.get(c.tags[1]) ?? [];
    lista.push(c);
    porProjeto.set(c.tags[1], lista);
  }
  const filas = [...porProjeto.values()];
  const escolhidos = [];
  while (escolhidos.length < quantidade && filas.some((fila) => fila.length > 0)) {
    for (const fila of filas) {
      if (fila.length > 0 && escolhidos.length < quantidade) escolhidos.push(fila.shift());
    }
  }
  return escolhidos;
}

/**
 * Marca o item como auditado à mão e/ou com rótulo duvidoso (auditoria.mjs).
 * @param {object} item Item do golden.
 * @returns {object} Item com `auditado` e a tag `rotulo_duvidoso` quando for o caso.
 */
function marcarAuditoria(item) {
  const duvidoso = DUVIDOSOS.includes(item.id);
  const tags = duvidoso ? [...item.tags, 'rotulo_duvidoso'] : item.tags;
  return { ...item, tags, auditado: AUDITADOS.includes(item.id) };
}

/**
 * Monta e grava o golden: reais (equilibrados por nível) + sintéticos de borda.
 * @returns {void}
 */
function construir() {
  const porNivel = Number(lerArgumento('por-nivel', String(POR_NIVEL_PADRAO)));
  const saida = lerArgumento('saida', join(PASTA_SAIDA_PADRAO, 'golden.jsonl'));
  const candidatos = listarProjetos().flatMap((projeto) => ARQUIVOS_QUADRO
    .map((q) => join(PASTA_FONTES, projeto, 'tasks', q))
    .filter(existsSync)
    .flatMap((arquivo) => coletarDoQuadro(projeto, arquivo)));
  const reais = ORDEM_NIVEIS.flatMap((nivel) => amostrarAlternando(
    candidatos.filter((c) => c.esperado === nivel), porNivel));
  const itens = [...reais, ...CASOS_SINTETICOS].map(marcarAuditoria);
  writeFileSync(saida, `${itens.map((item) => JSON.stringify(item)).join('\n')}\n`, 'utf8');
  console.log(`golden: ${itens.length} itens (${reais.length} reais + ${CASOS_SINTETICOS.length} `
    + `sintéticos) -> ${saida}`);
}

construir();
