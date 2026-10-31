// Guardrail de escopo: compara o que mudou (git diff --name-status) com o que a subtarefa previa.
// Primeiro a regra determinística (arquivo fora da lista prevista); depois duas perguntas `noul`
// ao Jev sobre o texto já mascarado. Só avisa: o máximo é `revisar`, nunca bloqueia (R3.1).
// Classe: dentro (p < 0,60) · ambigua (0,60–0,90) · fora (p ≥ 0,90).
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  ACOES, auditar, conferirDependencias, consultarJev, lerProbabilidade, mascarar, maisGrave,
  obterRedator,
} from './avisos.mjs';

const executarArquivo = promisify(execFile);
export const CASO_ESCOPO = 'escopo';
export const LIMIAR_REVISAR = 0.9;
export const LIMIAR_AVISAR = 0.6;
/** Arquivo fora da lista prevista pesa como dúvida (ambígua) mesmo que o Jev diga que não. */
export const PISO_ARQUIVO_NAO_PREVISTO = LIMIAR_AVISAR;
const MAXIMO_MUDANCAS_ENVIADAS = 200;
const TAMANHO_BUFFER_GIT = 4 * 1024 * 1024;
const PADRAO_STATUS_RENOMEADO = /^[RC]\d*$/;
const PERGUNTAS = {
  fora_do_escopo: {
    type: 'noul',
    instructions: 'As mudanças feitas (arquivos e resumo) extrapolam o que a descrição da '
      + 'subtarefa pede, ou seja, fazem algo que não foi pedido?',
    criteria: { true: 'extrapola o escopo', false: 'está dentro do escopo' },
  },
  arquivo_nao_previsto: {
    type: 'noul',
    instructions: 'Algum arquivo alterado não tem relação com a descrição da subtarefa nem com '
      + 'os arquivos previstos?',
    criteria: { true: 'há arquivo sem relação', false: 'todos os arquivos têm relação' },
  },
};

/**
 * Normaliza um caminho: barras normais, sem `./` inicial e sem barra no fim.
 * @param {string} caminho Caminho original.
 * @returns {string} Caminho normalizado.
 */
export function normalizarCaminho(caminho) {
  const comBarras = String(caminho ?? '').trim().replaceAll('\\', '/');
  return comBarras.replace(/^\.\//, '').replace(/\/+$/, '');
}

/**
 * Converte a saída de `git diff --name-status` em lista de mudanças (nunca lê conteúdo).
 * Renomeado/copiado (`R100\tantigo\tnovo`) conta o caminho novo.
 * @param {string|Array<{status: string, caminho: string}>} bruto Texto do git ou lista pronta.
 * @returns {Array<{status: string, caminho: string}>} Mudanças.
 */
export function interpretarMudancas(bruto) {
  if (Array.isArray(bruto)) {
    return bruto.map((m) => ({ status: String(m.status), caminho: normalizarCaminho(m.caminho) }));
  }
  const mudancas = [];
  for (const linha of String(bruto ?? '').split(/\r?\n/)) {
    const [status, ...caminhos] = linha.split('\t');
    if (!status.trim() || caminhos.length === 0) continue;
    const ehRenomeado = PADRAO_STATUS_RENOMEADO.test(status);
    const caminho = ehRenomeado ? caminhos[caminhos.length - 1] : caminhos[0];
    mudancas.push({ status: status.trim(), caminho: normalizarCaminho(caminho) });
  }
  return mudancas;
}

/**
 * Lê as mudanças do repositório com `git diff --name-status` (só nomes, sem conteúdo).
 * @param {{cwd?: string, base?: string}} [opcoes] Pasta do repositório e referência de base.
 * @returns {Promise<Array<{status: string, caminho: string}>>} Mudanças.
 */
export async function lerMudancasGit(opcoes = {}) {
  const argumentos = ['diff', '--name-status', ...(opcoes.base ? [opcoes.base] : [])];
  const { stdout } = await executarArquivo('git', argumentos, {
    cwd: opcoes.cwd, maxBuffer: TAMANHO_BUFFER_GIT,
  });
  return interpretarMudancas(stdout);
}

/**
 * Converte um item previsto (arquivo, pasta ou glob com `*`/`**`) numa expressão regular.
 * @param {string} previsto Item da lista de arquivos previstos.
 * @returns {RegExp} Expressão que casa o caminho inteiro (ou tudo dentro da pasta).
 */
function criarCasador(previsto) {
  const limpo = normalizarCaminho(previsto).replace(/[.+?^${}()|[\]]/g, '\\$&');
  const marcado = limpo.replaceAll('**', '\u0000').replaceAll('*', '[^/]*');
  const corpo = marcado.replaceAll('\u0000', '.*');
  return new RegExp(`^${corpo}(/.*)?$`);
}

/**
 * Lista as mudanças que não estão na lista de arquivos previstos.
 * Caminho com `..` nunca é considerado previsto.
 * @param {Array<{status: string, caminho: string}>} mudancas Mudanças do diff.
 * @param {string[]} previstos Arquivos, pastas ou globs previstos pela subtarefa.
 * @returns {string[]} Caminhos fora da previsão.
 */
export function listarNaoPrevistos(mudancas, previstos) {
  const casadores = previstos.filter(Boolean).map(criarCasador);
  return mudancas
    .map((mudanca) => mudanca.caminho)
    .filter((caminho) => {
      const temSaidaDaPasta = caminho.split('/').includes('..');
      return temSaidaDaPasta || !casadores.some((casador) => casador.test(caminho));
    });
}

/**
 * Classifica a mudança pela probabilidade combinada.
 * @param {number} probabilidade De 0 a 1.
 * @returns {{classe: string, acao: string}} Classe (dentro/ambigua/fora) e ação sugerida.
 */
export function classificarProbabilidade(probabilidade) {
  if (probabilidade >= LIMIAR_REVISAR) return { classe: 'fora', acao: ACOES.REVISAR };
  if (probabilidade >= LIMIAR_AVISAR) return { classe: 'ambigua', acao: ACOES.AVISAR };
  return { classe: 'dentro', acao: ACOES.LIBERAR };
}

/**
 * Monta o state mascarado que vai ao Jev.
 * @param {object} entrada `{descricao, arquivosPrevistos, resumo}` + mudanças e não previstos.
 * @param {Function} redator Redator `redigirTexto`.
 * @param {{achados: number}} contagem Contador de achados (alterado).
 * @returns {object} State sem segredo/PII.
 */
function montarState(entrada, redator, contagem) {
  const mascararTexto = (texto) => mascarar(texto, redator, contagem);
  const enviadas = entrada.mudancas.slice(0, MAXIMO_MUDANCAS_ENVIADAS);
  return {
    descricao: mascararTexto(entrada.descricao),
    arquivos_previstos: entrada.previstos.map(mascararTexto),
    mudancas: enviadas.map((mudanca) => `${mudanca.status} ${mascararTexto(mudanca.caminho)}`),
    arquivos_nao_previstos: entrada.naoPrevistos.map(mascararTexto),
    resumo: mascararTexto(entrada.resumo),
  };
}

/**
 * Junta o piso determinístico com a probabilidade do Jev (a mais alta vale).
 * @param {number[]} probabilidades Probabilidades `noul` válidas do Jev.
 * @param {number} quantidadeNaoPrevistos Arquivos fora da previsão.
 * @returns {number} Probabilidade combinada.
 */
function combinarProbabilidade(probabilidades, quantidadeNaoPrevistos) {
  const piso = quantidadeNaoPrevistos > 0 ? PISO_ARQUIVO_NAO_PREVISTO : 0;
  return Math.max(piso, ...probabilidades);
}

/**
 * Decide a ação a partir das respostas do Jev e da regra determinística.
 * Falha do Jev ou resposta incompleta: no mínimo `revisar` (nunca `liberar` silencioso).
 * @param {{consulta: object, naoPrevistos: string[]}} dados Consulta ao Jev e não previstos.
 * @returns {object} `{acao, classe, probabilidade, probabilidades, limiar, motivos}`.
 */
function decidir({ consulta, naoPrevistos }) {
  const respostas = consulta.resultado?.respostas;
  const lidas = Object.keys(PERGUNTAS).map((chave) => lerProbabilidade(respostas, chave));
  const validas = lidas.filter((valor) => valor !== null);
  const probabilidade = combinarProbabilidade(validas, naoPrevistos.length);
  const { classe, acao } = classificarProbabilidade(probabilidade);
  const motivos = [`classe ${classe} (p=${probabilidade.toFixed(2)})`];
  if (naoPrevistos.length > 0) motivos.push(`${naoPrevistos.length} arquivo(s) fora da previsão`);

  const jevIncompleto = validas.length < lidas.length;
  const causa = consulta.erroCodigo ?? 'incompleta';
  if (jevIncompleto) motivos.push(`Jev sem resposta válida (${causa})`);
  return {
    acao: jevIncompleto ? maisGrave(acao, ACOES.REVISAR) : acao,
    classe,
    probabilidade,
    probabilidades: Object.fromEntries(Object.keys(PERGUNTAS).map((c, i) => [c, lidas[i]])),
    limiar: { avisar: LIMIAR_AVISAR, revisar: LIMIAR_REVISAR },
    motivos,
  };
}

/**
 * Valida a entrada mínima do guardrail.
 * @param {object} entrada Entrada recebida.
 * @returns {string|null} Motivo do problema, ou null se estiver válida.
 */
function validarEntrada(entrada) {
  if (!entrada || typeof entrada.descricao !== 'string' || !entrada.descricao.trim()) {
    return 'sem descrição da subtarefa: não há como medir o escopo';
  }
  if (!Array.isArray(entrada.arquivosPrevistos)) return 'arquivos previstos ausentes';
  return null;
}

/**
 * Avalia se as mudanças ficaram dentro do escopo da subtarefa. Nunca bloqueia.
 * @param {{descricao: string, arquivosPrevistos: string[], mudancas?: string|Array,
 *   resumo?: string, alvo?: string}} entrada O que foi pedido e o que mudou.
 * @param {{cliente?: object, redigirTexto?: Function, registrar?: Function}} [dependencias]
 *   Cliente do Jev, redator e gravador da auditoria (injetáveis nos testes).
 * @returns {Promise<object>} `{caso, acao, classe, probabilidade, naoPrevistos, motivos, ...}`.
 */
export async function avaliarEscopo(entrada, dependencias = {}) {
  const problema = validarEntrada(entrada);
  if (problema) return { caso: CASO_ESCOPO, acao: ACOES.REVISAR, motivos: [problema] };

  const mudancas = interpretarMudancas(entrada.mudancas);
  if (mudancas.length === 0) {
    return { caso: CASO_ESCOPO, acao: ACOES.LIBERAR, motivos: ['nenhuma mudança no diff'] };
  }

  const redator = await obterRedator(dependencias.redigirTexto);
  const faltando = conferirDependencias(CASO_ESCOPO, { redator, cliente: dependencias.cliente });
  if (faltando) return faltando;

  const previstos = entrada.arquivosPrevistos.map(normalizarCaminho);
  const naoPrevistos = listarNaoPrevistos(mudancas, previstos);
  const contagem = { achados: 0 };
  const state = montarState({ ...entrada, mudancas, previstos, naoPrevistos }, redator, contagem);

  const consulta = await consultarJev(dependencias.cliente, {
    state, perguntas: PERGUNTAS, acao: 'guardrail-escopo',
  });
  const resultado = { caso: CASO_ESCOPO, naoPrevistos, ...decidir({ consulta, naoPrevistos }) };
  resultado.hashInput = await auditar({
    caso: CASO_ESCOPO, alvo: mascarar(entrada.alvo, redator, contagem), state, resultado, consulta,
    achados: contagem.achados, registrar: dependencias.registrar,
  });
  return resultado;
}
