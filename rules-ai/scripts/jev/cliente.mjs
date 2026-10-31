// Cliente HTTP do Jev (TypeSafe /v1/systemone): timeout, repetição exponencial, uso, custo e
// teto de tokens por rodada (INV-5), com log JSONL de auditoria. O log guarda só metadados (id,
// ação, modelo/versão, tokens, custo, latência, hash do state): nunca a chave nem o conteúdo.
// Não decide nível: devolve as respostas para o chamador aplicar as regras.
// Uso direto: node scripts/jev/cliente.mjs --chamada-minima  -> 1 chamada real mínima ao Jev
import { createHash, randomUUID } from 'node:crypto';
import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import {
  CAMINHO_ENDPOINT, ErroJev, MODOS, carregarConfiguracao, lerChave,
} from './config.mjs';

export { ErroJev, MODOS };

/** Estimativa conservadora (bytes ÷ 3) para barrar a chamada antes do envio. */
const BYTES_POR_TOKEN_ESTIMADO = 3;
const TOKENS_POR_MILHAO = 1000000;
const TAMANHO_HASH_STATE = 16;
const TAMANHO_TRECHO_ERRO = 200;
const STATUS_SOBRECARGA = new Set([429, 529]);
const STATUS_SERVIDOR_MINIMO = 500;
const STATUS_SERVIDOR_MAXIMO = 599;
const MILISSEGUNDOS_POR_SEGUNDO = 1000;
const MARCA_CHAVE_OCULTA = '[chave-oculta]';
const ACAO_PADRAO = 'chamada';
const ACAO_CHAMADA_MINIMA = 'chamada-minima';
const ARGUMENTO_CHAMADA_MINIMA = '--chamada-minima';
const CODIGO_SAIDA_ERRO = 1;
const CASAS_CUSTO = 9;
const DICAS_HTTP = {
  401: ' (chave recusada: confira a TYPESAFE_API_KEY)',
  403: ' (acesso negado para esta chave)',
  429: ' (limite de taxa)',
  529: ' (Jev sobrecarregado)',
};
const MENSAGEM_CHAVE_AUSENTE = 'TYPESAFE_API_KEY não definida: defina a variável no ambiente '
  + 'ou no .env da raiz do rules-ai. Sem a chave o Jev não é chamado (a classificação '
  + 'segue só pelos sinais da skill; JEV_MODO=off desliga o Jev).';
const MENSAGEM_DESLIGADO = 'JEV_MODO=off: o Jev está desligado; siga só pelos sinais da skill.';
const STATE_MINIMO = { teste: 'Conexão mínima do rules-ai com o Jev.' };
const PERGUNTAS_MINIMAS = {
  conexao: {
    type: 'noul',
    instructions: 'O texto em `teste` fala de conexão?',
    criteria: { true: 'fala de conexão', false: 'não fala de conexão' },
  },
};
const AJUDA = `cliente.mjs — cliente do Jev (TypeSafe /v1/systemone)
  node scripts/jev/cliente.mjs --chamada-minima   1 chamada real mínima (status, tokens, custo)
Variáveis: TYPESAFE_API_KEY, JEV_MODO (ativo|off), JEV_URL, JEV_MODELO, JEV_TIMEOUT_MS,
JEV_MAX_TOKENS, JEV_LOG, JEV_ARQUIVO_ENV.`;

/**
 * Calcula o custo em dólares pelos tokens de entrada (a saída não é cobrada).
 * @param {number} tokensEntrada Tokens de entrada da chamada.
 * @param {number} precoPorMilhao Preço em US$ por milhão de tokens de entrada.
 * @returns {number} Custo em US$ (0 para entrada inválida ou não positiva).
 */
export function calcularCusto(tokensEntrada, precoPorMilhao) {
  const ehValido = Number.isFinite(tokensEntrada) && tokensEntrada > 0;
  if (!ehValido) return 0;
  return (tokensEntrada * precoPorMilhao) / TOKENS_POR_MILHAO;
}

/**
 * Gera o hash do state para rastrear a entrada sem guardar o conteúdo.
 * @param {object} state State enviado ao Jev.
 * @returns {string} 16 primeiros caracteres do SHA-256 em hexadecimal.
 */
export function calcularHashState(state) {
  const texto = JSON.stringify(state ?? null);
  return createHash('sha256').update(texto).digest('hex').slice(0, TAMANHO_HASH_STATE);
}

/**
 * Estima os tokens de um corpo antes do envio (para o teto de JEV_MAX_TOKENS).
 * @param {string} corpo Corpo JSON serializado.
 * @returns {number} Estimativa de tokens, arredondada para cima.
 */
export function estimarTokens(corpo) {
  return Math.ceil(Buffer.byteLength(corpo, 'utf8') / BYTES_POR_TOKEN_ESTIMADO);
}

/**
 * Diz se um status HTTP merece nova tentativa (429, 529 e 5xx).
 * @param {number} status Status HTTP recebido.
 * @returns {boolean} true quando a falha é transitória.
 */
function ehStatusRepetivel(status) {
  const ehErroServidor = status >= STATUS_SERVIDOR_MINIMO && status <= STATUS_SERVIDOR_MAXIMO;
  return STATUS_SOBRECARGA.has(status) || ehErroServidor;
}

/**
 * Calcula a espera antes da próxima tentativa: exponencial, ou o Retry-After se for maior.
 * @param {number} tentativa Número da tentativa que acabou de falhar (1, 2, 3…).
 * @param {number|null} esperaSugeridaMs Espera pedida pelo servidor (Retry-After), se houver.
 * @param {{esperaBaseMs: number, esperaMaximaMs: number}} limites Base e teto da espera.
 * @returns {number} Espera em milissegundos.
 */
export function calcularEspera(tentativa, esperaSugeridaMs, limites) {
  const exponencial = limites.esperaBaseMs * 2 ** (tentativa - 1);
  const desejada = Math.max(exponencial, esperaSugeridaMs ?? 0);
  return Math.min(desejada, limites.esperaMaximaMs);
}

/**
 * Lê o cabeçalho Retry-After (em segundos) da resposta.
 * @param {Response} resposta Resposta HTTP.
 * @returns {number|null} Espera em milissegundos ou null se não houver valor válido.
 */
function lerRetryAfter(resposta) {
  const segundos = Number.parseFloat(resposta.headers.get('retry-after') ?? '');
  const ehValido = Number.isFinite(segundos) && segundos >= 0;
  return ehValido ? segundos * MILISSEGUNDOS_POR_SEGUNDO : null;
}

/**
 * Troca a chave, se aparecer num texto, por uma marca neutra.
 * @param {string} texto Texto a limpar.
 * @param {string|null} chave Chave do Jev.
 * @returns {string} Texto sem a chave.
 */
function ocultarChave(texto, chave) {
  const valor = String(texto ?? '');
  if (!chave) return valor;
  return valor.split(chave).join(MARCA_CHAVE_OCULTA);
}

/**
 * Converte uma falha do fetch (timeout ou rede) em ErroJev.
 * @param {Error} erro Erro lançado pelo fetch ou pela leitura do corpo.
 * @param {number} timeoutMs Tempo máximo configurado.
 * @returns {ErroJev} `TEMPO_ESGOTADO` (não repete) ou `FALHA_REDE` (repete).
 */
function converterFalhaDeEnvio(erro, timeoutMs) {
  if (erro instanceof ErroJev) return erro;
  const esgotouTempo = erro?.name === 'TimeoutError' || erro?.name === 'AbortError';
  if (esgotouTempo) {
    return new ErroJev('TEMPO_ESGOTADO', `Jev não respondeu em ${timeoutMs} ms.`);
  }
  const motivo = erro?.cause?.code ?? erro?.message ?? 'desconhecido';
  return new ErroJev('FALHA_REDE', `Falha de rede ao chamar o Jev (${motivo}).`, {
    repetivel: true,
  });
}

/**
 * Cria o erro de uma resposta HTTP sem sucesso, com a chave ocultada.
 * @param {{resposta: Response, texto: string}} recebido Resposta e corpo em texto.
 * @param {string} chave Chave do Jev (para ocultar se o servidor a ecoar).
 * @returns {ErroJev} Erro `HTTP_<status>`, repetível só para 429/529/5xx.
 */
function criarErroHttp(recebido, chave) {
  const { status } = recebido.resposta;
  const trecho = ocultarChave(recebido.texto, chave).slice(0, TAMANHO_TRECHO_ERRO).trim();
  const complemento = trecho ? `: ${trecho}` : '';
  const mensagem = `Jev respondeu HTTP ${status}${DICAS_HTTP[status] ?? ''}${complemento}`;
  return new ErroJev(`HTTP_${status}`, mensagem, {
    status,
    repetivel: ehStatusRepetivel(status),
    esperaSugeridaMs: lerRetryAfter(recebido.resposta),
  });
}

/**
 * Faz o POST e lê o corpo em texto, sob o mesmo timeout.
 * @param {object} chamada Chamada preparada (endereço e corpo).
 * @param {object} contexto Configuração, chave e dependências do cliente.
 * @returns {Promise<{resposta: Response, texto: string}>} Resposta e corpo.
 * @throws {ErroJev} `TEMPO_ESGOTADO` ou `FALHA_REDE`.
 */
async function buscar(chamada, contexto) {
  const { config, chave, deps } = contexto;
  try {
    const resposta = await deps.fetch(chamada.endereco, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${chave}` },
      body: chamada.corpo,
      signal: AbortSignal.timeout(config.timeoutMs),
    });
    return { resposta, texto: await resposta.text() };
  } catch (erro) {
    throw converterFalhaDeEnvio(erro, config.timeoutMs);
  }
}

/**
 * Converte o corpo da resposta de texto para objeto.
 * @param {string} texto Corpo recebido.
 * @returns {object} JSON da resposta.
 * @throws {ErroJev} `RESPOSTA_INVALIDA` se não for JSON.
 */
function converterJson(texto) {
  try {
    return JSON.parse(texto);
  } catch {
    throw new ErroJev('RESPOSTA_INVALIDA', 'Resposta do Jev não é JSON válido.');
  }
}

/**
 * Faz uma tentativa de chamada.
 * @param {object} chamada Chamada preparada.
 * @param {object} contexto Configuração, chave e dependências do cliente.
 * @returns {Promise<object>} JSON da resposta com sucesso.
 * @throws {ErroJev} Erro HTTP, de rede, de timeout ou de JSON.
 */
async function enviarUmaVez(chamada, contexto) {
  const recebido = await buscar(chamada, contexto);
  if (!recebido.resposta.ok) throw criarErroHttp(recebido, contexto.chave);
  return converterJson(recebido.texto);
}

/**
 * Anota no erro quantas tentativas foram feitas.
 * @param {Error} erro Erro final.
 * @param {number} tentativas Tentativas feitas.
 * @returns {Error} O mesmo erro.
 */
function marcarTentativas(erro, tentativas) {
  if (erro instanceof ErroJev) erro.tentativas = tentativas;
  return erro;
}

/**
 * Envia a chamada repetindo só as falhas transitórias, com espera exponencial.
 * @param {object} chamada Chamada preparada.
 * @param {object} contexto Configuração, chave e dependências do cliente.
 * @returns {Promise<{dados: object, tentativas: number}>} JSON e número de tentativas.
 * @throws {ErroJev} Último erro, quando não é repetível ou acabaram as repetições.
 */
async function executarComRepeticao(chamada, contexto) {
  const { config, deps } = contexto;
  const totalTentativas = config.maximoRepeticoes + 1;
  for (let tentativa = 1; tentativa <= totalTentativas; tentativa += 1) {
    try {
      return { dados: await enviarUmaVez(chamada, contexto), tentativas: tentativa };
    } catch (erro) {
      const podeRepetir = erro instanceof ErroJev && erro.repetivel && tentativa < totalTentativas;
      if (!podeRepetir) throw marcarTentativas(erro, tentativa);
      await deps.dormir(calcularEspera(tentativa, erro.esperaSugeridaMs, config));
    }
  }
  throw new ErroJev('SEM_TENTATIVAS', 'Nenhuma tentativa de chamada ao Jev foi feita.');
}

/**
 * Lê `answers`, `usage`, `model` e `id` da resposta do Jev.
 * @param {object} dados JSON da resposta.
 * @param {number} [tokensEstimados] Usado como entrada se o `usage` não vier.
 * @returns {{respostas: object, uso: object, modeloResposta: string|null,
 *   idResposta: string|null}} Resposta interpretada.
 * @throws {ErroJev} `RESPOSTA_INVALIDA` se faltar `answers`.
 */
export function interpretarResposta(dados, tokensEstimados = 0) {
  const temRespostas = typeof dados?.answers === 'object' && dados.answers !== null;
  if (!temRespostas) {
    throw new ErroJev('RESPOSTA_INVALIDA', 'Resposta do Jev sem o campo "answers".');
  }
  const entradaInformada = Number.isFinite(dados.usage?.input_tokens);
  const saidaInformada = Number.isFinite(dados.usage?.output_tokens);
  return {
    respostas: dados.answers,
    uso: {
      tokensEntrada: entradaInformada ? dados.usage.input_tokens : tokensEstimados,
      tokensSaida: saidaInformada ? dados.usage.output_tokens : 0,
      estimado: !entradaInformada,
    },
    modeloResposta: typeof dados.model === 'string' ? dados.model : null,
    idResposta: typeof dados.id === 'string' ? dados.id : null,
  };
}

/**
 * Confere se o pedido tem state e ao menos uma pergunta.
 * @param {{state: object, perguntas: object}} pedido Pedido recebido.
 * @returns {void}
 * @throws {ErroJev} `PEDIDO_INVALIDO`.
 */
function validarPedido(pedido) {
  const temState = typeof pedido?.state === 'object' && pedido.state !== null;
  const temPerguntas = typeof pedido?.perguntas === 'object' && pedido.perguntas !== null
    && Object.keys(pedido.perguntas).length > 0;
  if (temState && temPerguntas) return;
  throw new ErroJev('PEDIDO_INVALIDO',
    'Pedido ao Jev precisa de `state` (objeto) e `perguntas` (ao menos 1 pergunta).');
}

/**
 * Monta a chamada: corpo no contrato `{state, model, questions}`, id, hash e estimativa.
 * @param {{state: object, perguntas: object, acao?: string}} pedido Pedido validado.
 * @param {object} contexto Configuração do cliente.
 * @returns {object} Chamada pronta para enviar e registrar.
 */
function prepararChamada(pedido, contexto) {
  const { config } = contexto;
  const corpo = JSON.stringify({
    state: pedido.state, model: config.modelo, questions: pedido.perguntas,
  });
  return {
    id: randomUUID(),
    acao: pedido.acao || ACAO_PADRAO,
    endereco: new URL(CAMINHO_ENDPOINT, config.url).toString(),
    corpo,
    hashState: calcularHashState(pedido.state),
    perguntas: Object.keys(pedido.perguntas),
    tokensEstimados: estimarTokens(corpo),
  };
}

/**
 * Monta a linha do log JSONL: só metadados, sem chave e sem conteúdo do state.
 * @param {{chamada: object, resultado?: object, erro?: ErroJev, latenciaMs: number}} registro
 * @param {object} contexto Configuração e uso acumulado do cliente.
 * @returns {object} Linha de auditoria.
 */
function montarLinhaLog(registro, contexto) {
  const { chamada, resultado, erro, latenciaMs } = registro;
  return {
    data: new Date().toISOString(),
    id: chamada.id,
    acao: chamada.acao,
    modo: contexto.config.modo,
    modelo_pedido: contexto.config.modelo,
    modelo_resposta: resultado?.modeloResposta ?? null,
    id_resposta: resultado?.idResposta ?? null,
    hash_state: chamada.hashState,
    perguntas: chamada.perguntas,
    tokens_previstos: chamada.tokensEstimados,
    tokens_entrada: resultado?.uso.tokensEntrada ?? 0,
    tokens_saida: resultado?.uso.tokensSaida ?? 0,
    uso_estimado: resultado?.uso.estimado ?? false,
    custo_usd: resultado?.custoUsd ?? 0,
    tokens_acumulados: contexto.uso.tokensTotais,
    maximo_tokens: contexto.config.maximoTokens,
    latencia_ms: latenciaMs,
    tentativas: resultado?.tentativas ?? erro?.tentativas ?? 0,
    situacao: erro ? 'erro' : 'ok',
    erro_codigo: erro?.codigo ?? null,
    http_status: erro?.status ?? null,
  };
}

/**
 * Grava a linha no log, com a chave ocultada por garantia.
 * @param {object} linha Linha de auditoria.
 * @param {object} contexto Chave e dependências do cliente.
 * @returns {Promise<void>}
 */
async function registrarLinha(linha, contexto) {
  await contexto.deps.registrar(ocultarChave(JSON.stringify(linha), contexto.chave));
}

/**
 * Reserva os tokens previstos da chamada, ou aborta antes do envio se passar do teto (INV-5).
 * O teto soma o que já foi usado e o que está reservado por chamadas em andamento.
 * @param {object} chamada Chamada preparada.
 * @param {object} contexto Configuração e uso acumulado do cliente.
 * @returns {Promise<void>}
 * @throws {ErroJev} `LIMITE_TOKENS` (registrado no log, sem chamada de rede).
 */
async function reservarOrcamento(chamada, contexto) {
  const { uso, config } = contexto;
  const comprometidos = uso.tokensTotais + uso.tokensReservados;
  const cabeNoTeto = comprometidos + chamada.tokensEstimados <= config.maximoTokens;
  if (cabeNoTeto) {
    uso.tokensReservados += chamada.tokensEstimados;
    return;
  }
  const erro = new ErroJev('LIMITE_TOKENS', `Chamada abortada antes do envio: ${comprometidos} `
    + `tokens usados/reservados + ~${chamada.tokensEstimados} previstos passam de `
    + `JEV_MAX_TOKENS=${config.maximoTokens}.`);
  await registrarLinha(montarLinhaLog({ chamada, erro, latenciaMs: 0 }, contexto), contexto);
  throw erro;
}

/**
 * Interpreta a resposta e calcula o custo, anotando as tentativas se a resposta for inválida.
 * @param {{dados: object, tentativas: number}} execucao Resultado do envio.
 * @param {object} chamada Chamada preparada.
 * @param {object} contexto Configuração do cliente.
 * @returns {object} Resultado com respostas, uso, custo, modelo e tentativas.
 * @throws {ErroJev} `RESPOSTA_INVALIDA`.
 */
function montarResultado(execucao, chamada, contexto) {
  try {
    const interpretado = interpretarResposta(execucao.dados, chamada.tokensEstimados);
    const preco = contexto.config.precoUsdPorMilhaoEntrada;
    const custoUsd = calcularCusto(interpretado.uso.tokensEntrada, preco);
    return { ...interpretado, custoUsd, tentativas: execucao.tentativas };
  } catch (erro) {
    throw marcarTentativas(erro, execucao.tentativas);
  }
}

/**
 * Executa a chamada e devolve o resultado ou o ErroJev (sem lançar ErroJev).
 * @param {object} chamada Chamada preparada.
 * @param {object} contexto Configuração, chave e dependências do cliente.
 * @returns {Promise<{resultado?: object, erro?: ErroJev}>} Desfecho da chamada.
 */
async function obterDesfecho(chamada, contexto) {
  try {
    const execucao = await executarComRepeticao(chamada, contexto);
    return { resultado: montarResultado(execucao, chamada, contexto) };
  } catch (erro) {
    if (!(erro instanceof ErroJev)) throw erro;
    return { erro };
  }
}

/**
 * Soma o uso de uma chamada bem-sucedida ao total da rodada.
 * @param {object} uso Uso acumulado do cliente (alterado).
 * @param {object} resultado Resultado da chamada.
 * @returns {void}
 */
function acumularUso(uso, resultado) {
  uso.tokensEntrada += resultado.uso.tokensEntrada;
  uso.tokensSaida += resultado.uso.tokensSaida;
  uso.tokensTotais += resultado.uso.tokensEntrada + resultado.uso.tokensSaida;
  uso.custoUsd += resultado.custoUsd;
  uso.chamadas += 1;
}

/**
 * Faz uma pergunta ao Jev: valida, confere o teto, envia, registra e devolve as respostas.
 * @param {{state: object, perguntas: object, acao?: string}} pedido State (já sem rótulos e
 *   mascarado por quem chama), perguntas no formato do Jev e rótulo da ação para o log.
 * @param {object} contexto Configuração, chave, dependências e uso do cliente.
 * @returns {Promise<object>} `{id, respostas, uso, custoUsd, modeloResposta, idResposta,
 *   tentativas, latenciaMs}`.
 * @throws {ErroJev} `JEV_DESLIGADO`, `PEDIDO_INVALIDO`, `LIMITE_TOKENS`, `HTTP_<status>`,
 *   `TEMPO_ESGOTADO`, `FALHA_REDE` ou `RESPOSTA_INVALIDA`; quem chama decide o fallback.
 */
async function perguntar(pedido, contexto) {
  if (contexto.config.modo !== MODOS.ATIVO) throw new ErroJev('JEV_DESLIGADO', MENSAGEM_DESLIGADO);
  validarPedido(pedido);
  const chamada = prepararChamada(pedido, contexto);
  await reservarOrcamento(chamada, contexto);

  const inicio = contexto.deps.agora();
  const desfecho = await obterDesfecho(chamada, contexto)
    .finally(() => { contexto.uso.tokensReservados -= chamada.tokensEstimados; });
  const latenciaMs = Math.round(contexto.deps.agora() - inicio);
  if (desfecho.erro) {
    const linha = montarLinhaLog({ chamada, erro: desfecho.erro, latenciaMs }, contexto);
    await registrarLinha(linha, contexto);
    throw desfecho.erro;
  }

  acumularUso(contexto.uso, desfecho.resultado);
  const resultado = { id: chamada.id, ...desfecho.resultado, latenciaMs };
  await registrarLinha(montarLinhaLog({ chamada, resultado, latenciaMs }, contexto), contexto);
  return resultado;
}

/**
 * Cria o gravador do log JSONL (uma linha por chamada, anexada ao arquivo).
 * @param {string} arquivo Caminho do arquivo `.jsonl`.
 * @returns {(texto: string) => Promise<void>} Função que anexa uma linha.
 */
export function criarRegistroJsonl(arquivo) {
  return async (texto) => {
    await mkdir(dirname(arquivo), { recursive: true });
    await appendFile(arquivo, `${texto}\n`, 'utf8');
  };
}

/**
 * Espera um tempo.
 * @param {number} ms Milissegundos.
 * @returns {Promise<void>}
 */
function dormir(ms) {
  return new Promise((resolver) => { setTimeout(resolver, ms); });
}

/**
 * Completa as dependências injetáveis com as reais.
 * @param {object} config Configuração do cliente.
 * @param {{fetch?: Function, dormir?: Function, agora?: Function, registrar?: Function}} injetadas
 * @returns {{fetch: Function, dormir: Function, agora: Function, registrar: Function}}
 */
function montarDependencias(config, injetadas) {
  return {
    fetch: injetadas.fetch ?? globalThis.fetch,
    dormir: injetadas.dormir ?? dormir,
    agora: injetadas.agora ?? (() => performance.now()),
    registrar: injetadas.registrar ?? criarRegistroJsonl(config.arquivoLog),
  };
}

/**
 * Cria o cliente do Jev. O uso (tokens e custo) é somado por cliente: um cliente = uma rodada.
 * @param {{config: object, chave: string|null, dependencias?: object}} opcoes Configuração de
 *   {@link carregarConfiguracao}, chave de {@link lerChave} e dependências para teste.
 * @returns {{perguntar: Function, obterUso: Function}} Cliente.
 * @throws {ErroJev} `CHAVE_AUSENTE` quando não há chave (R1.2).
 */
export function criarCliente({ config, chave, dependencias = {} }) {
  if (!chave) throw new ErroJev('CHAVE_AUSENTE', MENSAGEM_CHAVE_AUSENTE);
  const contexto = {
    config,
    chave,
    deps: montarDependencias(config, dependencias),
    uso: {
      tokensEntrada: 0, tokensSaida: 0, tokensTotais: 0, tokensReservados: 0,
      custoUsd: 0, chamadas: 0,
    },
  };
  return Object.freeze({
    perguntar: (pedido) => perguntar(pedido, contexto),
    obterUso: () => ({ ...contexto.uso, maximoTokens: config.maximoTokens }),
  });
}

/**
 * Cria o cliente com a configuração e a chave do ambiente (ou do `.env` da raiz).
 * @param {Record<string, string|undefined>} [ambiente] Variáveis de ambiente.
 * @returns {{perguntar: Function, obterUso: Function}} Cliente.
 * @throws {ErroJev} `CONFIGURACAO_INVALIDA` ou `CHAVE_AUSENTE`.
 */
export function criarClientePadrao(ambiente = process.env) {
  const config = carregarConfiguracao(ambiente);
  return criarCliente({ config, chave: lerChave({ ambiente, arquivoEnv: config.arquivoEnv }) });
}

/**
 * Faz 1 chamada real mínima e imprime só status, modelo, tokens, custo e latência.
 * @returns {Promise<number>} Código de saída.
 */
async function executarChamadaMinima() {
  const config = carregarConfiguracao();
  if (config.modo === MODOS.DESLIGADO) {
    console.log('JEV_MODO=off: Jev desligado; nenhuma chamada feita.');
    return 0;
  }
  const cliente = criarCliente({ config, chave: lerChave({ arquivoEnv: config.arquivoEnv }) });
  const resultado = await cliente.perguntar({
    state: STATE_MINIMO, perguntas: PERGUNTAS_MINIMAS, acao: ACAO_CHAMADA_MINIMA,
  });
  console.log(`status=ok · modelo=${resultado.modeloResposta} · tentativas=${resultado.tentativas}`
    + ` · tokens entrada=${resultado.uso.tokensEntrada} saída=${resultado.uso.tokensSaida}`
    + ` · custo US$ ${resultado.custoUsd.toFixed(CASAS_CUSTO)} · ${resultado.latenciaMs} ms`);
  console.log(`Log: ${config.arquivoLog}`);
  return 0;
}

/**
 * Diz se este arquivo foi executado direto pelo `node` (e não importado).
 * @returns {boolean} true na execução direta.
 */
function ehExecucaoDireta() {
  const executado = process.argv[1];
  if (!executado) return false;
  return resolve(executado).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
}

if (ehExecucaoDireta()) {
  try {
    const pediuChamada = process.argv.slice(2).includes(ARGUMENTO_CHAMADA_MINIMA);
    if (!pediuChamada) console.log(AJUDA);
    process.exitCode = pediuChamada ? await executarChamadaMinima() : 0;
  } catch (erro) {
    console.error(`Erro: ${erro.message}`);
    process.exitCode = CODIGO_SAIDA_ERRO;
  }
}
