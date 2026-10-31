// Orquestração da classificação da MENSAGEM do usuário (JEV-GLOBAL-AI-FINAL.2, .5, .6, .7, .14,
// .24). `classificarMensagem` NUNCA lança e nunca devolve `liberar` (INV-3): qualquer falha vira
// `decisao: 'sinais'` (a IA classifica pelos sinais da skill). O Jev só aconselha: nada aqui toca
// o quadro, reserva tarefa ou bloqueia a mensagem (INV-2, INV-5).
import { dirname } from 'node:path';
import { performance } from 'node:perf_hooks';
import { criarCliente } from '../cliente.mjs';
import {
  ErroJev, MODOS, carregarConfiguracao, carregarConfiguracaoMensagem, lerChave,
} from '../config.mjs';
import { avaliarMensagem } from '../guardrails/mensagem.mjs';
import { redigirTexto } from '../guardrails/redigir.mjs';
import {
  caminhoAuditoriaDoMes, formatarDia, gravarAuditoria, somarCustoDoDia,
} from './auditoria.mjs';
import { montarContexto } from './contexto.mjs';
import { DECISOES, decidirMensagem } from './decisao.mjs';
import { prepararPedido } from './estado.mjs';
import { comTempoMaximo, ehMensagemTrivial, estourouLimiteDia } from './limite.mjs';
import { ehMensagemRepetida, marcarMensagem } from './repetida.mjs';

export { montarContexto };

const ACAO_CLIENTE = 'mensagem';
const MAXIMO_ALERTAS = 5;
const TAMANHO_PROJETO = 80;
const CASAS_CUSTO = 9;
/** Folga para gravar a auditoria, imprimir e encerrar o processo depois da chamada (R1.3). */
const MARGEM_SAIDA_MS = 150;
/** Menos que isso de orçamento não adianta chamar o Jev: vira só sinais, sem chamada. */
const PISO_ORCAMENTO_MS = 100;
const TAMANHO_MAXIMO_ALERTA = 200;
const CODIGO_ERRO_INESPERADO = 'ERRO_INESPERADO';
const MOTIVOS = Object.freeze({
  OK: 'ok', TRIVIAL: 'trivial', DESLIGADO: 'desligado', LIMITE_DIA: 'limite_dia',
  JEV_INDISPONIVEL: 'jev_indisponivel', REPETIDA: 'repetida',
});
const ACOES = Object.freeze({
  DECISAO_JEV: 'decisao_jev', REVISAR: 'revisar', SO_SINAIS: 'so_sinais', PULADO: 'pulado',
});
const SITUACOES = Object.freeze({ OK: 'ok', ERRO: 'erro', PULADO: 'pulado', LIMITE: 'limite' });

/**
 * Calcula o orçamento de tempo da chamada: o tempo máximo da mensagem menos o que o processo já
 * gastou (subida do node e imports, `performance.now()` = ms desde o início do processo) e menos
 * a margem de saída. Assim o processo inteiro do gancho respeita o tempo máximo (R1.3).
 * @param {number} tempoMaximoMs `JEV_TEMPO_MAXIMO_MENSAGEM_MS`.
 * @param {() => number} decorridoMs Milissegundos desde o início do processo.
 * @returns {number} Orçamento em ms (pode ser menor que o piso: aí não se chama o Jev).
 */
function calcularOrcamentoMs(tempoMaximoMs, decorridoMs) {
  return Math.floor(tempoMaximoMs - decorridoMs() - MARGEM_SAIDA_MS);
}

/**
 * Cria o resultado no formato do contrato, com os padrões de "só sinais".
 * @param {object} [parcial] Campos que mudam em relação ao padrão.
 * @returns {object} Resultado completo.
 */
function criarResultado(parcial = {}) {
  return {
    pulado: false,
    motivo: MOTIVOS.OK,
    decisao: DECISOES.SINAIS,
    nivel: null,
    effort: null,
    modelos_elegiveis: [],
    confianca: null,
    revisar: false,
    alertas: [],
    custo_usd: 0,
    latencia_ms: 0,
    hash: null,
    erro_codigo: null,
    acao: ACOES.SO_SINAIS,
    situacao: SITUACOES.ERRO,
    ...parcial,
  };
}

/**
 * Completa as dependências injetáveis com as reais.
 * @param {{cliente?: object, agora?: Function, decorridoMs?: Function, arquivoAuditoria?: string,
 *   pastaMarcas?: string, ambiente?: Record<string, string|undefined>}} injetadas Dependências
 *   de teste.
 * @returns {{cliente: object|null, agora: Function, arquivoAuditoria: string|null,
 *   ambiente: Record<string, string|undefined>}} Dependências completas.
 */
function completarDependencias(injetadas) {
  return {
    cliente: injetadas.cliente ?? null,
    agora: injetadas.agora ?? (() => new Date()),
    decorridoMs: injetadas.decorridoMs ?? (() => performance.now()),
    arquivoAuditoria: injetadas.arquivoAuditoria ?? null,
    pastaMarcas: injetadas.pastaMarcas ?? null,
    ambiente: injetadas.ambiente ?? process.env,
  };
}

/**
 * Escolhe o arquivo de auditoria: o injetado, `JEV_AUDITORIA_MENSAGENS` (testes e ensaios) ou o
 * `mensagens-AAAA-MM.jsonl` do mês em `scripts/jev/saidas/`.
 * @param {object} deps Dependências completas.
 * @param {Date} data Momento da mensagem.
 * @returns {string} Caminho do arquivo.
 */
function resolverArquivoAuditoria(deps, data) {
  const doAmbiente = String(deps.ambiente.JEV_AUDITORIA_MENSAGENS ?? '').trim();
  return deps.arquivoAuditoria ?? (doAmbiente || caminhoAuditoriaDoMes(data));
}

/**
 * Lê o código estável de um erro (nunca a mensagem, que pode ter detalhes).
 * @param {unknown} erro Erro capturado.
 * @returns {string} Código do ErroJev, ou `ERRO_INESPERADO`.
 */
function codigoDoErro(erro) {
  return erro instanceof ErroJev ? erro.codigo : CODIGO_ERRO_INESPERADO;
}

/**
 * Cria o cliente do Jev da mensagem: sem repetições nem esperas e com o tempo máximo da mensagem.
 * @param {object} config Configuração das mensagens.
 * @param {Record<string, string|undefined>} ambiente Variáveis de ambiente.
 * @returns {{perguntar: Function}} Cliente.
 * @throws {ErroJev} `CHAVE_AUSENTE` ou `CONFIGURACAO_INVALIDA`.
 */
function criarClienteDaMensagem(config, ambiente) {
  const geral = carregarConfiguracao(ambiente);
  return criarCliente({
    config: {
      ...geral,
      maximoRepeticoes: 0,
      timeoutMs: config.tempoMaximoMs,
      maximoTokens: config.maximoTokensMensagem,
    },
    chave: lerChave({ ambiente, arquivoEnv: geral.arquivoEnv }),
  });
}

/**
 * Normaliza os alertas: só textos curtos, sem segredo (passam por `redigirTexto`).
 * @param {unknown} alertas Alertas devolvidos pelo guardrail.
 * @returns {string[]} Até 5 alertas de até 200 caracteres.
 */
function normalizarAlertas(alertas) {
  if (!Array.isArray(alertas)) return [];
  return alertas
    .filter((alerta) => typeof alerta === 'string' && alerta.trim() !== '')
    .slice(0, MAXIMO_ALERTAS)
    .map((alerta) => redigirTexto(alerta).texto.slice(0, TAMANHO_MAXIMO_ALERTA));
}

/**
 * Coleta os alertas dos guardrails; erro ou demora viram lista vazia.
 * @param {string} texto Texto bruto da mensagem.
 * @param {number} tempoMs Tempo máximo.
 * @returns {Promise<string[]>} Alertas (nunca rejeita).
 */
async function coletarAlertas(texto, tempoMs) {
  try {
    const avaliacao = await comTempoMaximo(() => avaliarMensagem({ texto }), tempoMs);
    return normalizarAlertas(avaliacao?.alertas);
  } catch {
    return [];
  }
}

/**
 * Converte a decisão em resultado final (com custo e ação).
 * @param {object} decisao Saída de {@link decidirMensagem}.
 * @param {number} custoBruto Custo da chamada (arredondado a 9 casas).
 * @returns {object} Resultado; sem nível válido do Jev vira falha (`RESPOSTA_INVALIDA`).
 */
function resultadoDaDecisao(decisao, custoBruto) {
  const custoUsd = Number(custoBruto.toFixed(CASAS_CUSTO));
  if (decisao.decisao === DECISOES.SINAIS) {
    return criarResultado({
      motivo: MOTIVOS.JEV_INDISPONIVEL, erro_codigo: 'RESPOSTA_INVALIDA', custo_usd: custoUsd,
    });
  }
  const ehJev = decisao.decisao === DECISOES.JEV;
  return criarResultado({
    ...decisao,
    custo_usd: custoUsd,
    acao: ehJev ? ACOES.DECISAO_JEV : ACOES.REVISAR,
    situacao: SITUACOES.OK,
  });
}

/**
 * Pergunta ao Jev, dentro do tempo máximo; qualquer falha vira "só sinais".
 * @param {object} pedido Pedido de {@link prepararPedido} (com `state` não nulo).
 * @param {{config: object, deps: object}} contexto Configuração e dependências.
 * @returns {Promise<object>} Resultado parcial (sem alertas, hash e latência).
 */
async function perguntarAoJev(pedido, contexto) {
  const { config, deps } = contexto;
  try {
    const cliente = deps.cliente ?? criarClienteDaMensagem(config, deps.ambiente);
    const resposta = await comTempoMaximo(() => cliente.perguntar({
      state: pedido.state, perguntas: pedido.perguntas, acao: ACAO_CLIENTE,
    }), config.tempoMaximoMs);
    return resultadoDaDecisao(decidirMensagem(resposta.respostas), resposta.custoUsd ?? 0);
  } catch (erro) {
    return criarResultado({ motivo: MOTIVOS.JEV_INDISPONIVEL, erro_codigo: codigoDoErro(erro) });
  }
}

/**
 * Decide se chama o Jev (limite do dia, teto de tokens) e chama.
 * @param {object} pedido Pedido de {@link prepararPedido}.
 * @param {{config: object, deps: object, arquivo: string}} contexto Configuração e dependências.
 * @returns {Promise<object>} Resultado parcial.
 */
async function consultarJev(pedido, contexto) {
  const { config, deps, arquivo } = contexto;
  const gasto = somarCustoDoDia(arquivo, formatarDia(new Date(deps.agora())));
  if (estourouLimiteDia(gasto, config.maximoCustoDiaUsd)) {
    return criarResultado({
      motivo: MOTIVOS.LIMITE_DIA, erro_codigo: 'LIMITE_DIA', situacao: SITUACOES.LIMITE,
    });
  }
  if (pedido.state === null) {
    return criarResultado({ motivo: MOTIVOS.JEV_INDISPONIVEL, erro_codigo: 'LIMITE_TOKENS' });
  }
  return perguntarAoJev(pedido, { config, deps });
}

/**
 * Resultado de mensagem pulada (trivial ou Jev desligado): sem chamada e sem custo.
 * @param {string} motivo Um valor de {@link MOTIVOS}.
 * @returns {object} Resultado com `pulado: true`.
 */
function resultadoPulado(motivo) {
  return criarResultado({
    pulado: true, motivo, acao: ACOES.PULADO, situacao: SITUACOES.PULADO,
  });
}

/**
 * Confere a marca da mensagem: repetida dentro da janela vira "pulado"; senão grava a marca.
 * @param {{hash: string}} pedido Pedido com o hash da mensagem.
 * @param {string} arquivo Arquivo de auditoria (a marca fica na mesma pasta, salvo injeção).
 * @param {object} deps Dependências completas.
 * @returns {boolean} true se a mensagem é repetida e não deve chamar o Jev.
 */
function conferirMarca(pedido, arquivo, deps) {
  const doAmbiente = String(deps.ambiente.JEV_PASTA_MARCAS ?? '').trim();
  const pasta = deps.pastaMarcas ?? (doAmbiente || dirname(arquivo));
  const agoraMs = new Date(deps.agora()).getTime();
  if (ehMensagemRepetida(pasta, pedido.hash, agoraMs)) return true;
  marcarMensagem(pasta, pedido.hash, agoraMs);
  return false;
}

/**
 * Executa a classificação (pode lançar; quem chama captura).
 * @param {{texto?: string, projeto?: string}} entrada Mensagem e projeto.
 * @param {object} deps Dependências completas.
 * @returns {Promise<object>} Resultado, sem a latência.
 */
async function executar(entrada, deps) {
  const config = carregarConfiguracaoMensagem(deps.ambiente);
  const desligado = config.modo === MODOS.DESLIGADO || config.mensagens === MODOS.DESLIGADO;
  if (desligado) return resultadoPulado(MOTIVOS.DESLIGADO);

  const texto = String(entrada.texto ?? '');
  if (ehMensagemTrivial(texto)) return resultadoPulado(MOTIVOS.TRIVIAL);

  const orcamento = { modelo: carregarConfiguracao(deps.ambiente).modelo,
    maximoTokens: config.maximoTokensMensagem };
  const pedido = prepararPedido({ texto, projeto: entrada.projeto }, orcamento);
  const tempoMs = calcularOrcamentoMs(config.tempoMaximoMs, deps.decorridoMs);
  if (tempoMs < PISO_ORCAMENTO_MS) {
    return criarResultado({
      motivo: MOTIVOS.JEV_INDISPONIVEL, erro_codigo: 'TEMPO_ESGOTADO', hash: pedido.hash,
    });
  }
  const arquivo = resolverArquivoAuditoria(deps, new Date(deps.agora()));
  if (conferirMarca(pedido, arquivo, deps)) {
    return { ...resultadoPulado(MOTIVOS.REPETIDA), hash: pedido.hash };
  }
  const limitada = { ...config, tempoMaximoMs: tempoMs };
  const alertas = coletarAlertas(texto, tempoMs);
  const parcial = await consultarJev(pedido, { config: limitada, deps, arquivo });
  return { ...parcial, alertas: await alertas, hash: pedido.hash };
}

/**
 * Classifica a mensagem do usuário: nível, effort, modelos elegíveis e alertas. NUNCA lança.
 * @param {{texto?: string, projeto?: string}} entrada Texto bruto e nome do projeto.
 * @param {{cliente?: {perguntar: Function}, agora?: () => Date, arquivoAuditoria?: string,
 *   ambiente?: Record<string, string|undefined>}} [dependencias] Dependências injetáveis.
 * @returns {Promise<{pulado: boolean, motivo: string, decisao: string, nivel: string|null,
 *   effort: string|null, modelos_elegiveis: string[], confianca: number|null,
 *   revisar: boolean, alertas: string[], custo_usd: number, latencia_ms: number,
 *   hash: string|null}>} Resultado (com campos extras de auditoria e explicação).
 */
export async function classificarMensagem(entrada, dependencias = {}) {
  const deps = completarDependencias(dependencias ?? {});
  const inicio = new Date(deps.agora());
  let resultado;
  try {
    resultado = await executar(entrada ?? {}, deps);
  } catch (erro) {
    resultado = criarResultado({
      motivo: MOTIVOS.JEV_INDISPONIVEL, erro_codigo: codigoDoErro(erro),
    });
  }
  resultado.latencia_ms = Math.max(0, new Date(deps.agora()).getTime() - inicio.getTime());
  if (resultado.motivo !== MOTIVOS.DESLIGADO) {
    const arquivo = resolverArquivoAuditoria(deps, inicio);
    const projeto = redigirTexto(String(entrada?.projeto ?? '')).texto.slice(0, TAMANHO_PROJETO);
    gravarAuditoria(arquivo, { data: inicio, resultado, projeto });
  }
  return resultado;
}
