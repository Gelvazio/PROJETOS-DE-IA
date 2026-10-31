// Teste do cliente Jev contra um servidor HTTP local (node:http): sem rede externa e sem custo.
// Cobre 200, 429→200, 529/5xx até o limite, 401/400/422 sem repetição, timeout, resposta sem
// answers, custo, JEV_MAX_TOKENS somado na rodada (INV-5), JEV_MODO=off, leitura da chave,
// log sem chave nem conteúdo (INV-2, R4.1) e saída 1 sem chave (R1.2).
// Uso: node scripts/jev/testes/cliente-mock.mjs
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ErroJev, calcularCusto, criarCliente, criarRegistroJsonl } from '../cliente.mjs';
import { PASTA_SAIDAS, carregarConfiguracao, lerChave } from '../config.mjs';

const ARQUIVO_CLIENTE = join(dirname(fileURLToPath(import.meta.url)), '..', 'cliente.mjs');
const ARQUIVO_LOG_TESTE = join(PASTA_SAIDAS, 'teste-cliente-mock.jsonl');
const CHAVE_FALSA = 'tsk_teste_SEGREDO_0123456789';
const MARCADOR_CONTEUDO = 'CONTEUDO-SIGILOSO-DO-STATE';
const TIMEOUT_TESTE_MS = '300';
const LIMITE_PROCESSO_FILHO_MS = 15000;
const TOKENS_ENTRADA = 1234;
const PRECO_POR_MILHAO = 0.042;
const CUSTO_ESPERADO_USD = 0.000051828;
const TOLERANCIA = 1e-12;
const ESPERAS_EXPONENCIAIS = [500, 1000, 2000];
const CAMPOS_DO_LOG = [
  'data', 'id', 'acao', 'modelo_pedido', 'modelo_resposta', 'hash_state', 'tokens_entrada',
  'tokens_saida', 'custo_usd', 'latencia_ms', 'tentativas', 'situacao', 'erro_codigo',
];
const PEDIDO = {
  state: { subtarefa: 'TESTE.1', descricao: MARCADOR_CONTEUDO },
  perguntas: {
    nivel: {
      type: 'choice',
      instructions: 'Qual o nível da subtarefa?',
      criteria: { LEVE: 'só texto', MEDIO: 'código', PESADO: 'banco ou segredo' },
    },
  },
  acao: 'teste',
};
const RESPOSTA_OK = {
  model: 'jev-1.13.0',
  answers: {
    nivel: { choice: 'MEDIO', confidence: 0.87, probabilities: { LEVE: 0.05, MEDIO: 0.9 } },
  },
  usage: { input_tokens: TOKENS_ENTRADA, output_tokens: 0 },
};
const PASSO_OK = { status: 200, corpo: RESPOSTA_OK };

/**
 * Atende um pedido no mock: guarda o que recebeu e responde o próximo passo do roteiro.
 * @param {object} mock Estado do mock (roteiro e recebidos).
 * @param {import('node:http').IncomingMessage} pedido Pedido HTTP.
 * @param {import('node:http').ServerResponse} resposta Resposta HTTP.
 * @returns {Promise<void>}
 */
async function atender(mock, pedido, resposta) {
  const partes = [];
  for await (const parte of pedido) partes.push(parte);
  mock.recebidos.push({
    caminho: pedido.url,
    autorizacao: pedido.headers.authorization,
    corpo: Buffer.concat(partes).toString('utf8'),
  });
  const passo = mock.roteiro.shift() ?? { status: 500, corpo: {} };
  if (passo.semResposta) return;
  resposta.writeHead(passo.status, { 'Content-Type': 'application/json', ...passo.cabecalhos });
  resposta.end(JSON.stringify(passo.corpo ?? {}));
}

/**
 * Sobe o servidor mock em 127.0.0.1, numa porta livre.
 * @returns {Promise<object>} Mock com `url`, `servidor`, `roteiro` e `recebidos`.
 */
async function iniciarMock() {
  const mock = { roteiro: [], recebidos: [] };
  mock.servidor = createServer((pedido, resposta) => { atender(mock, pedido, resposta); });
  mock.servidor.listen(0, '127.0.0.1');
  await once(mock.servidor, 'listening');
  mock.url = `http://127.0.0.1:${mock.servidor.address().port}`;
  return mock;
}

/**
 * Prepara um caso: novo roteiro, configuração apontando para o mock e cliente com chave falsa.
 * @param {object} mock Mock em execução.
 * @param {object[]} roteiro Respostas, em ordem.
 * @param {Record<string, string>} [ambienteExtra] Variáveis a mais (ex.: JEV_MAX_TOKENS).
 * @returns {{cliente: object, esperas: number[]}} Cliente e esperas pedidas entre tentativas.
 */
function prepararCaso(mock, roteiro, ambienteExtra = {}) {
  mock.roteiro = [...roteiro];
  mock.recebidos = [];
  const config = carregarConfiguracao({
    JEV_URL: mock.url, JEV_TIMEOUT_MS: TIMEOUT_TESTE_MS, JEV_LOG: ARQUIVO_LOG_TESTE,
    ...ambienteExtra,
  });
  const esperas = [];
  const dependencias = {
    dormir: async (ms) => { esperas.push(ms); },
    registrar: criarRegistroJsonl(ARQUIVO_LOG_TESTE),
  };
  return { cliente: criarCliente({ config, chave: CHAVE_FALSA, dependencias }), esperas };
}

/**
 * Espera uma promessa falhar com ErroJev do código indicado.
 * @param {Promise<unknown>} promessa Chamada que deve falhar.
 * @param {string} codigo Código esperado.
 * @returns {Promise<ErroJev>} O erro capturado.
 */
async function esperarErro(promessa, codigo) {
  try {
    await promessa;
  } catch (erro) {
    assert.ok(erro instanceof ErroJev, `esperava ErroJev, veio ${erro?.name}`);
    assert.equal(erro.codigo, codigo);
    return erro;
  }
  throw new Error(`esperava erro ${codigo}, mas a chamada deu certo`);
}

/**
 * 200: interpreta answers/usage, calcula o custo e manda o Bearer e o contrato certos.
 * @param {object} mock Mock em execução.
 * @returns {Promise<string>} Detalhe para a saída.
 */
async function caso200(mock) {
  const { cliente } = prepararCaso(mock, [PASSO_OK]);
  const resultado = await cliente.perguntar(PEDIDO);
  assert.equal(resultado.respostas.nivel.choice, 'MEDIO');
  assert.equal(resultado.uso.tokensEntrada, TOKENS_ENTRADA);
  assert.ok(Math.abs(resultado.custoUsd - CUSTO_ESPERADO_USD) < TOLERANCIA, 'custo errado');
  assert.equal(resultado.tentativas, 1);
  const recebido = mock.recebidos[0];
  assert.equal(recebido.caminho, '/v1/systemone');
  assert.ok(recebido.autorizacao === `Bearer ${CHAVE_FALSA}`, 'Authorization errado');
  const corpo = JSON.parse(recebido.corpo);
  assert.equal(corpo.model, 'jev-1.13.0');
  assert.deepEqual(Object.keys(corpo).sort(), ['model', 'questions', 'state']);
  return `hits=${mock.recebidos.length}, custo=${resultado.custoUsd}`;
}

/**
 * 429 seguido de 200: repete uma vez e sucede.
 * @param {object} mock Mock em execução.
 * @returns {Promise<string>} Detalhe para a saída.
 */
async function caso429(mock) {
  const passo429 = { status: 429, cabecalhos: { 'Retry-After': '0' }, corpo: {} };
  const { cliente, esperas } = prepararCaso(mock, [passo429, PASSO_OK]);
  const resultado = await cliente.perguntar(PEDIDO);
  assert.equal(mock.recebidos.length, 2);
  assert.equal(resultado.tentativas, 2);
  assert.deepEqual(esperas, [ESPERAS_EXPONENCIAIS[0]]);
  return `hits=2, esperas=${esperas.join('/')} ms`;
}

/**
 * 529/503/500/529: repete 3 vezes com espera exponencial e desiste.
 * @param {object} mock Mock em execução.
 * @returns {Promise<string>} Detalhe para a saída.
 */
async function casoSobrecarga(mock) {
  const roteiro = [529, 503, 500, 529].map((status) => ({ status, corpo: {} }));
  const { cliente, esperas } = prepararCaso(mock, roteiro);
  const erro = await esperarErro(cliente.perguntar(PEDIDO), 'HTTP_529');
  assert.equal(mock.recebidos.length, 4);
  assert.equal(erro.tentativas, 4);
  assert.deepEqual(esperas, ESPERAS_EXPONENCIAIS);
  return `hits=4, esperas=${esperas.join('/')} ms`;
}

/**
 * 401 (com a chave ecoada no corpo): não repete e a mensagem não mostra a chave.
 * @param {object} mock Mock em execução.
 * @returns {Promise<string>} Detalhe para a saída.
 */
async function caso401(mock) {
  const passo401 = { status: 401, corpo: { error: `chave invalida ${CHAVE_FALSA}` } };
  const { cliente, esperas } = prepararCaso(mock, [passo401]);
  const erro = await esperarErro(cliente.perguntar(PEDIDO), 'HTTP_401');
  assert.equal(mock.recebidos.length, 1);
  assert.equal(esperas.length, 0);
  assert.ok(!erro.message.includes(CHAVE_FALSA), 'mensagem de erro mostra a chave');
  return 'hits=1, chave oculta na mensagem';
}

/**
 * 400 e 422: não repetem.
 * @param {object} mock Mock em execução.
 * @returns {Promise<string>} Detalhe para a saída.
 */
async function caso400e422(mock) {
  for (const status of [400, 422]) {
    const { cliente } = prepararCaso(mock, [{ status, corpo: {} }]);
    await esperarErro(cliente.perguntar(PEDIDO), `HTTP_${status}`);
    assert.equal(mock.recebidos.length, 1);
  }
  return 'hits=1 em cada';
}

/**
 * Timeout: o mock não responde; o cliente desiste em JEV_TIMEOUT_MS e não repete.
 * @param {object} mock Mock em execução.
 * @returns {Promise<string>} Detalhe para a saída.
 */
async function casoTimeout(mock) {
  const { cliente } = prepararCaso(mock, [{ semResposta: true }]);
  await esperarErro(cliente.perguntar(PEDIDO), 'TEMPO_ESGOTADO');
  assert.equal(mock.recebidos.length, 1);
  return `hits=1, timeout=${TIMEOUT_TESTE_MS} ms`;
}

/**
 * 200 sem `answers`: erro claro, sem repetir.
 * @param {object} mock Mock em execução.
 * @returns {Promise<string>} Detalhe para a saída.
 */
async function casoSemAnswers(mock) {
  const { cliente } = prepararCaso(mock, [{ status: 200, corpo: { usage: {} } }]);
  await esperarErro(cliente.perguntar(PEDIDO), 'RESPOSTA_INVALIDA');
  assert.equal(mock.recebidos.length, 1);
  return 'hits=1';
}

/**
 * Custo: tabela US$ 0,042/M e soma do uso na rodada.
 * @param {object} mock Mock em execução.
 * @returns {Promise<string>} Detalhe para a saída.
 */
async function casoCusto(mock) {
  assert.ok(Math.abs(calcularCusto(1000000, PRECO_POR_MILHAO) - PRECO_POR_MILHAO) < TOLERANCIA);
  assert.equal(calcularCusto(0, PRECO_POR_MILHAO), 0);
  const { cliente } = prepararCaso(mock, [PASSO_OK, PASSO_OK]);
  await cliente.perguntar(PEDIDO);
  await cliente.perguntar(PEDIDO);
  const uso = cliente.obterUso();
  assert.equal(uso.tokensEntrada, 2 * TOKENS_ENTRADA);
  assert.equal(uso.chamadas, 2);
  assert.ok(Math.abs(uso.custoUsd - 2 * CUSTO_ESPERADO_USD) < TOLERANCIA, 'custo somado errado');
  return `2 chamadas = US$ ${uso.custoUsd}`;
}

/**
 * INV-5: o teto vale por pedido e somado na rodada; aborta antes de qualquer envio.
 * @param {object} mock Mock em execução.
 * @returns {Promise<string>} Detalhe para a saída.
 */
async function casoLimiteTokens(mock) {
  const pequeno = prepararCaso(mock, [PASSO_OK], { JEV_MAX_TOKENS: '10' });
  await esperarErro(pequeno.cliente.perguntar(PEDIDO), 'LIMITE_TOKENS');
  assert.equal(mock.recebidos.length, 0);

  const rodada = prepararCaso(mock, [PASSO_OK, PASSO_OK], {
    JEV_MAX_TOKENS: String(TOKENS_ENTRADA + 1),
  });
  await rodada.cliente.perguntar(PEDIDO);
  await esperarErro(rodada.cliente.perguntar(PEDIDO), 'LIMITE_TOKENS');
  assert.equal(mock.recebidos.length, 1);
  return 'pedido grande: hits=0; 2ª da rodada: abortada antes do envio';
}

/**
 * JEV_MODO=off: não chama o Jev; modo e padrões da configuração conferem.
 * @param {object} mock Mock em execução.
 * @returns {Promise<string>} Detalhe para a saída.
 */
async function casoModoOff(mock) {
  const { cliente } = prepararCaso(mock, [PASSO_OK], { JEV_MODO: 'off' });
  await esperarErro(cliente.perguntar(PEDIDO), 'JEV_DESLIGADO');
  assert.equal(mock.recebidos.length, 0);
  const padrao = carregarConfiguracao({});
  assert.equal(padrao.modo, 'ativo');
  assert.equal(padrao.modelo, 'jev-1.13.0');
  assert.equal(padrao.timeoutMs, 60000);
  assert.throws(() => carregarConfiguracao({ JEV_MODO: 'talvez' }), /JEV_MODO/);
  return 'hits=0; padrão ativo';
}

/**
 * Chave: ambiente vence o .env; o alias TYPE_SAFE_API_KEY é aceito; sem chave, erro claro.
 * @returns {Promise<string>} Detalhe para a saída.
 */
async function casoChave() {
  const pasta = mkdtempSync(join(tmpdir(), 'jev-chave-'));
  try {
    const arquivoEnv = join(pasta, '.env');
    writeFileSync(arquivoEnv, 'OUTRA=1\nTYPE_SAFE_API_KEY="chave-do-arquivo"\n');
    assert.equal(lerChave({ ambiente: {}, arquivoEnv }), 'chave-do-arquivo');
    assert.equal(lerChave({ ambiente: { TYPESAFE_API_KEY: 'do-ambiente' }, arquivoEnv }),
      'do-ambiente');
    assert.equal(lerChave({ ambiente: {}, arquivoEnv: join(pasta, 'nao-existe.env') }), null);
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
  const config = carregarConfiguracao({});
  assert.throws(() => criarCliente({ config, chave: null }), /TYPESAFE_API_KEY/);
  return 'ambiente > .env; alias ok; sem chave = CHAVE_AUSENTE';
}

/**
 * R1.2: sem chave, `cliente.mjs --chamada-minima` sai com código 1 e mensagem clara.
 * @param {object} mock Mock em execução.
 * @returns {Promise<string>} Detalhe para a saída.
 */
async function casoSaidaSemChave(mock) {
  mock.recebidos = [];
  const ambiente = {
    ...process.env, TYPESAFE_API_KEY: '', TYPE_SAFE_API_KEY: '', JEV_URL: mock.url,
    JEV_ARQUIVO_ENV: join(tmpdir(), 'jev-nao-existe.env'), JEV_LOG: ARQUIVO_LOG_TESTE,
    JEV_TIMEOUT_MS: TIMEOUT_TESTE_MS,
  };
  const processo = spawnSync(process.execPath, [ARQUIVO_CLIENTE, '--chamada-minima'], {
    env: ambiente, encoding: 'utf8', timeout: LIMITE_PROCESSO_FILHO_MS,
  });
  assert.equal(processo.status, 1);
  assert.match(processo.stderr, /TYPESAFE_API_KEY não definida/);
  assert.equal(mock.recebidos.length, 0);
  return `código ${processo.status}: ${processo.stderr.trim().slice(0, 60)}…`;
}

/**
 * INV-2/R4.1: o log tem uma linha por chamada, com os campos de auditoria e sem chave/conteúdo.
 * @returns {Promise<string>} Detalhe para a saída.
 */
async function casoLog() {
  const texto = readFileSync(ARQUIVO_LOG_TESTE, 'utf8');
  assert.ok(!texto.includes(CHAVE_FALSA), 'o log contém a chave');
  assert.ok(!texto.includes(MARCADOR_CONTEUDO), 'o log contém conteúdo do state');
  const linhas = texto.split('\n').filter(Boolean).map((linha) => JSON.parse(linha));
  for (const linha of linhas) {
    const faltando = CAMPOS_DO_LOG.filter((campo) => !(campo in linha));
    assert.equal(faltando.length, 0, `campos faltando: ${faltando.join(', ')}`);
  }
  assert.ok(linhas.some((linha) => linha.erro_codigo === 'LIMITE_TOKENS'));
  assert.ok(linhas.some((linha) => linha.situacao === 'ok' && linha.custo_usd > 0));
  return `${linhas.length} linhas, sem chave e sem conteúdo`;
}

const CASOS = [
  { nome: '200 responde, custo e contrato conferem', executar: caso200 },
  { nome: '429 repete e sucede', executar: caso429 },
  { nome: '529/5xx repete até 3 vezes e desiste', executar: casoSobrecarga },
  { nome: '401 não repete', executar: caso401 },
  { nome: '400 e 422 não repetem', executar: caso400e422 },
  { nome: 'timeout não repete', executar: casoTimeout },
  { nome: 'resposta sem answers', executar: casoSemAnswers },
  { nome: 'custo US$ 0,042/M e soma da rodada', executar: casoCusto },
  { nome: 'JEV_MAX_TOKENS aborta antes do envio (INV-5)', executar: casoLimiteTokens },
  { nome: 'JEV_MODO=off não chama o Jev', executar: casoModoOff },
  { nome: 'leitura da chave', executar: casoChave },
  { nome: 'sem chave: código 1 e mensagem clara (R1.2)', executar: casoSaidaSemChave },
  { nome: 'log JSONL sem chave e sem conteúdo (INV-2)', executar: casoLog },
];

/**
 * Roda os casos em ordem e imprime OK/FALHA de cada um.
 * @param {object} mock Mock em execução.
 * @returns {Promise<number>} Quantidade de falhas.
 */
async function executarCasos(mock) {
  let falhas = 0;
  for (const caso of CASOS) {
    try {
      const detalhe = await caso.executar(mock);
      console.log(`OK    ${caso.nome} (${detalhe})`);
    } catch (erro) {
      falhas += 1;
      console.log(`FALHA ${caso.nome}: ${erro.message}`);
    }
  }
  return falhas;
}

/**
 * Prepara o log de teste, sobe o mock, roda os casos e encerra o servidor.
 * @returns {Promise<number>} Código de saída (0 = todos passaram).
 */
async function principal() {
  rmSync(ARQUIVO_LOG_TESTE, { force: true });
  const mock = await iniciarMock();
  try {
    const falhas = await executarCasos(mock);
    console.log(falhas === 0 ? 'Todos os casos passaram.' : `${falhas} caso(s) falharam.`);
    console.log(`Log de teste: ${ARQUIVO_LOG_TESTE}`);
    return falhas === 0 ? 0 : 1;
  } finally {
    mock.servidor.closeAllConnections();
    mock.servidor.close();
  }
}

process.exitCode = await principal();
