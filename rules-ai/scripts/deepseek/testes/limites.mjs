// Testes dos limites e do roteador da DeepSeek (INTEGRACAO-DEEPSEEK.6). Não chamam a API: o
// `fetch` é injetado e a auditoria vai para uma pasta temporária, apagada ao fim de cada teste.
// Rodar: node scripts/deepseek/testes/limites.mjs
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { chamarDeepseek, TIPOS_ERRO } from '../cliente.mjs';
import {
  estaDesligada,
  estimarTokensEntrada,
  lerLimites,
  limitarTempo,
  passouDoTetoDeTokens,
  passouDoTetoDiario,
} from '../limites.mjs';
import { MOTIVOS, rotearChamada } from '../roteador.mjs';

const CHAVE_FALSA = 'chave-falsa-do-teste-123';
const ARQUIVO_AUDITORIA = 'auditoria-2026-10.jsonl';
const DIA_TESTE = new Date(2026, 9, 23, 12, 0, 0);
const DIA_TESTE_TEXTO = '2026-10-23';
const DIA_ANTERIOR_TEXTO = '2026-10-22';
const PADRAO_MAX_TOKENS = 2000;
const PADRAO_TETO_DIA_USD = 2;
const PADRAO_TEMPO_MS = 30000;
const TEMPO_CURTO_MS = 50;
const LIMITE_TEMPO_ESPERADO_MS = 1500;
const LIMITE_GERAL_ESPERADO_MS = 4000;
const CAMPOS_AUDITORIA = [
  'data', 'dia', 'nivel', 'modelo', 'raciocinio', 'tokensEntrada',
  'tokensSaida', 'custoUsd', 'acao', 'motivo',
];
const TEXTO_PEDIDO = 'TEXTO-SIGILOSO-DO-PEDIDO-987';
const TEXTO_RESPOSTA = 'TEXTO-SIGILOSO-DA-RESPOSTA-654';
const RESPOSTA_OK = respostaComTexto('resposta de teste');

/**
 * Monta uma resposta de sucesso da API com o texto dado e o uso de tokens.
 * @param {string} texto Texto devolvido pelo modelo.
 * @returns {object} Corpo JSON no formato de chat da DeepSeek.
 */
function respostaComTexto(texto) {
  return {
    choices: [{ message: { content: texto } }],
    usage: { prompt_tokens: 1000, completion_tokens: 500 },
  };
}

/**
 * Monta um ambiente de teste com a chave falsa e variáveis extras (nunca usa process.env).
 * @param {Record<string, string>} [extras] Variáveis adicionais.
 * @returns {Record<string, string>} Ambiente isolado.
 */
function ambienteCom(extras = {}) {
  return { DEEPSEEK_API_KEY: CHAVE_FALSA, ...extras };
}

/**
 * Cria uma pasta temporária para a auditoria, apagada ao fim do teste.
 * @param {import('node:test').TestContext} contexto Contexto do teste (para `after`).
 * @returns {Promise<{diretorio: string, auditoria: {diretorio: string, agora: Date}}>} Pasta e
 *   opções de auditoria.
 */
async function criarAuditoriaTemporaria(contexto) {
  const diretorio = await mkdtemp(join(tmpdir(), 'deepseek-testes-'));
  contexto.after(() => rm(diretorio, { recursive: true, force: true }));
  return { diretorio, auditoria: { diretorio, agora: DIA_TESTE } };
}

/**
 * Monta uma resposta HTTP falsa com `ok`, `status` e `json()`.
 * @param {{status?: number, corpo?: object}} [resposta] Status e corpo devolvidos.
 * @returns {{ok: boolean, status: number, json: Function}} Resposta falsa.
 */
function respostaFalsa({ status = 200, corpo = RESPOSTA_OK } = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => corpo };
}

/**
 * Cria um `fetch` falso que responde sempre igual e guarda cada chamada.
 * @param {{status?: number, corpo?: object}} [resposta] Status e corpo devolvidos.
 * @returns {{fetchImpl: Function, chamadas: object[]}} `fetch` falso e chamadas recebidas.
 */
function criarFetchFalso(resposta = {}) {
  const chamadas = [];
  const fetchImpl = async (url, init) => {
    chamadas.push({ url, corpo: JSON.parse(init.body), cabecalhos: init.headers });
    return respostaFalsa(resposta);
  };
  return { fetchImpl, chamadas };
}

/**
 * Cria um pedido de teste com uma única mensagem de texto.
 * @param {unknown} nivel Nível informado no pedido.
 * @param {string} [texto] Texto da mensagem.
 * @returns {{nivel: unknown, mensagens: {role: string, content: string}[]}} Pedido.
 */
function pedidoDe(nivel, texto = 'Organize o almoxarifado do aluno consultor.') {
  return { nivel, mensagens: [{ role: 'user', content: texto }] };
}

/**
 * Lê e converte as linhas do arquivo de auditoria da pasta temporária.
 * @param {string} diretorio Pasta temporária da auditoria.
 * @returns {Promise<object[]>} Linhas convertidas em objetos.
 */
async function lerLinhasAuditoria(diretorio) {
  const conteudo = await readFile(join(diretorio, ARQUIVO_AUDITORIA), 'utf8');
  return conteudo.split('\n').filter(Boolean).map((linha) => JSON.parse(linha));
}

/**
 * Grava linhas de auditoria prontas, para simular gasto de dias anteriores ou de hoje.
 * @param {string} diretorio Pasta temporária da auditoria.
 * @param {object[]} linhas Linhas a gravar.
 * @returns {Promise<void>} Conclui quando a escrita termina.
 */
async function escreverLinhasAuditoria(diretorio, linhas) {
  const texto = linhas.map((linha) => `${JSON.stringify(linha)}\n`).join('');
  await writeFile(join(diretorio, ARQUIVO_AUDITORIA), texto, 'utf8');
}

/**
 * Cria um erro igual ao que o `fetch` lança quando é abortado pelo tempo.
 * @returns {Error} Erro com nome `AbortError`.
 */
function erroDeTempo() {
  const erro = new Error('abortado');
  erro.name = 'AbortError';
  return erro;
}

test('valores inválidos de limite voltam ao padrão, sem lançar', () => {
  const invalidos = ['', 'abc', '-5', '0', '0.0', '1e3', '2abc', 'NaN', 'Infinity', undefined];
  for (const valor of invalidos) {
    const limites = lerLimites({
      DEEPSEEK_MAX_TOKENS: valor,
      DEEPSEEK_MAX_CUSTO_DIA: valor,
      DEEPSEEK_TIMEOUT_MS: valor,
    });
    assert.equal(limites.maxTokens, PADRAO_MAX_TOKENS, `maxTokens com "${valor}"`);
    assert.equal(limites.tetoDiarioUsd, PADRAO_TETO_DIA_USD, `teto com "${valor}"`);
    assert.equal(limites.tempoMaximoMs, PADRAO_TEMPO_MS, `tempo com "${valor}"`);
  }
});

test('valores válidos dos limites são lidos do ambiente', () => {
  const limites = lerLimites({
    DEEPSEEK_MAX_TOKENS: ' 500 ',
    DEEPSEEK_MAX_CUSTO_DIA: '0.5',
    DEEPSEEK_TIMEOUT_MS: '100',
  });
  assert.deepEqual(limites, {
    desligada: false,
    maxTokens: 500,
    tetoDiarioUsd: 0.5,
    tempoMaximoMs: 100,
  });
});

test('DEEPSEEK_MODO=off não chama a API e devolve "desligado"', async (t) => {
  const { diretorio, auditoria } = await criarAuditoriaTemporaria(t);
  const { fetchImpl, chamadas } = criarFetchFalso();
  assert.equal(estaDesligada({ DEEPSEEK_MODO: 'ativo' }), false);
  for (const modo of ['off', 'OFF', ' off ']) {
    const ambiente = ambienteCom({ DEEPSEEK_MODO: modo });
    assert.equal(estaDesligada(ambiente), true, `estaDesligada com "${modo}"`);
    const resultado = await rotearChamada(pedidoDe('LEVE'), { ambiente, fetchImpl, auditoria });
    assert.deepEqual(resultado, { usar: false, motivo: MOTIVOS.DESLIGADO });
  }
  const direto = await chamarDeepseek(
    { modelo: 'deepseek-flash', mensagens: [{ role: 'user', content: 'oi' }] },
    { ambiente: ambienteCom({ DEEPSEEK_MODO: 'off' }), fetchImpl },
  );
  assert.equal(direto.erro.tipo, TIPOS_ERRO.DESLIGADO);
  assert.equal(chamadas.length, 0);
  const linhas = await lerLinhasAuditoria(diretorio);
  assert.ok(linhas.every((linha) => linha.motivo === MOTIVOS.DESLIGADO));
});

test('entrada acima do teto de tokens é bloqueada (limite-tokens) sem chamar a API', async (t) => {
  const { diretorio, auditoria } = await criarAuditoriaTemporaria(t);
  const { fetchImpl, chamadas } = criarFetchFalso();
  const ambiente = ambienteCom({ DEEPSEEK_MAX_TOKENS: '100' });
  const resultado = await rotearChamada(pedidoDe('LEVE', 'a'.repeat(301)), {
    ambiente,
    fetchImpl,
    auditoria,
  });
  assert.deepEqual(resultado, { usar: false, motivo: MOTIVOS.LIMITE_TOKENS });
  assert.equal(chamadas.length, 0);
  const [linha] = await lerLinhasAuditoria(diretorio);
  assert.equal(linha.acao, 'bloqueada');
  assert.equal(linha.motivo, MOTIVOS.LIMITE_TOKENS);
});

test('o teto de tokens compara a estimativa (1 token a cada 3 caracteres)', () => {
  const mensagens = (tamanho) => [{ role: 'user', content: 'a'.repeat(tamanho) }];
  assert.equal(estimarTokensEntrada(mensagens(301)), 101);
  assert.equal(passouDoTetoDeTokens(mensagens(300), 100), false);
  assert.equal(passouDoTetoDeTokens(mensagens(301), 100), true);
});

test('gasto do dia igual ou acima do teto bloqueia; teto maior libera', async (t) => {
  const { diretorio, auditoria } = await criarAuditoriaTemporaria(t);
  await escreverLinhasAuditoria(diretorio, [
    { dia: DIA_TESTE_TEXTO, custoUsd: 2 },
    { dia: DIA_ANTERIOR_TEXTO, custoUsd: 5 },
  ]);
  const { fetchImpl, chamadas } = criarFetchFalso();
  assert.equal(passouDoTetoDiario(1.99, 2), false);
  assert.equal(passouDoTetoDiario(2, 2), true);
  const bloqueada = await rotearChamada(pedidoDe('LEVE'), {
    ambiente: ambienteCom(),
    fetchImpl,
    auditoria,
  });
  assert.deepEqual(bloqueada, { usar: false, motivo: MOTIVOS.LIMITE_DIARIO });
  assert.equal(chamadas.length, 0);
  const liberada = await rotearChamada(pedidoDe('LEVE'), {
    ambiente: ambienteCom({ DEEPSEEK_MAX_CUSTO_DIA: '3' }),
    fetchImpl,
    auditoria,
  });
  assert.equal(liberada.usar, true);
  assert.equal(chamadas.length, 1);
});

test('timeout com fetch que respeita o abort devolve "timeout" rápido', async (t) => {
  const { diretorio, auditoria } = await criarAuditoriaTemporaria(t);
  const fetchRespeitaAbort = (_url, init) => new Promise((_resolver, rejeitar) => {
    init.signal.addEventListener('abort', () => rejeitar(erroDeTempo()));
  });
  const ambiente = ambienteCom({ DEEPSEEK_TIMEOUT_MS: String(TEMPO_CURTO_MS) });
  const inicio = Date.now();
  const resultado = await rotearChamada(pedidoDe('LEVE'), {
    ambiente,
    fetchImpl: fetchRespeitaAbort,
    auditoria,
  });
  const decorrido = Date.now() - inicio;
  assert.deepEqual(resultado, { usar: false, motivo: MOTIVOS.TEMPO });
  assert.ok(decorrido < LIMITE_TEMPO_ESPERADO_MS, `demorou ${decorrido} ms`);
  const [linha] = await lerLinhasAuditoria(diretorio);
  assert.equal(linha.motivo, MOTIVOS.TEMPO);
});

test('timeout com fetch que ignora o abort é cortado pelo limitador geral', async (t) => {
  const { auditoria } = await criarAuditoriaTemporaria(t);
  const fetchQueNuncaResponde = () => new Promise(() => {});
  const ambiente = ambienteCom({ DEEPSEEK_TIMEOUT_MS: String(TEMPO_CURTO_MS) });
  const inicio = Date.now();
  const resultado = await rotearChamada(pedidoDe('LEVE'), {
    ambiente,
    fetchImpl: fetchQueNuncaResponde,
    auditoria,
  });
  const decorrido = Date.now() - inicio;
  assert.deepEqual(resultado, { usar: false, motivo: MOTIVOS.TEMPO });
  assert.ok(decorrido < LIMITE_GERAL_ESPERADO_MS, `demorou ${decorrido} ms`);
});

test('LEVE usa deepseek-flash sem raciocínio; MEDIO usa com raciocínio', async (t) => {
  const { diretorio, auditoria } = await criarAuditoriaTemporaria(t);
  const { fetchImpl, chamadas } = criarFetchFalso();
  const ambiente = ambienteCom();
  const leve = await rotearChamada(pedidoDe('LEVE'), { ambiente, fetchImpl, auditoria });
  const medio = await rotearChamada(pedidoDe('medio'), { ambiente, fetchImpl, auditoria });
  assert.equal(leve.usar, true);
  assert.equal(leve.modelo, 'deepseek-flash');
  assert.equal(leve.raciocinio, false);
  assert.equal(medio.usar, true);
  assert.equal(medio.modelo, 'deepseek-flash');
  assert.equal(medio.raciocinio, true);
  assert.ok(leve.custoUsd > 0);
  const [corpoLeve, corpoMedio] = chamadas.map((chamada) => chamada.corpo);
  assert.equal(corpoLeve.model, 'deepseek-flash');
  assert.equal('thinking' in corpoLeve, false);
  assert.deepEqual(corpoMedio.thinking, { type: 'enabled' });
  assert.equal(corpoLeve.max_tokens, PADRAO_MAX_TOKENS);
  assert.equal(chamadas[0].cabecalhos.Authorization, `Bearer ${CHAVE_FALSA}`);
  const [primeiraLinha] = await lerLinhasAuditoria(diretorio);
  assert.equal(primeiraLinha.acao, 'usada');
  assert.equal(primeiraLinha.tokensEntrada, 1000);
});

test('PESADO nunca chama a API (pesado-sem-liberacao)', async (t) => {
  const { diretorio, auditoria } = await criarAuditoriaTemporaria(t);
  const { fetchImpl, chamadas } = criarFetchFalso();
  const resultado = await rotearChamada(pedidoDe('PESADO'), {
    ambiente: ambienteCom(),
    fetchImpl,
    auditoria,
  });
  assert.deepEqual(resultado, { usar: false, motivo: MOTIVOS.PESADO_SEM_LIBERACAO });
  assert.equal(chamadas.length, 0);
  const [linha] = await lerLinhasAuditoria(diretorio);
  assert.equal(linha.acao, 'bloqueada');
});

test('entradas estranhas (undefined, null, nível inválido) nunca lançam', async (t) => {
  const { auditoria } = await criarAuditoriaTemporaria(t);
  const { fetchImpl } = criarFetchFalso();
  const opcoes = { ambiente: ambienteCom(), fetchImpl, auditoria };
  const casos = [
    undefined, null, 42, 'LEVE', {}, { nivel: 'XYZ', mensagens: [] }, { nivel: 42 },
    { nivel: 'LEVE' }, { nivel: 'LEVE', mensagens: [null] }, { nivel: 'LEVE', mensagens: 'x' },
  ];
  for (const pedido of casos) {
    const resultado = await rotearChamada(pedido, opcoes);
    assert.equal(resultado.usar, false, `caso ${JSON.stringify(pedido)}`);
  }
});

test('falhas do fetch, resposta sem formato e pedido nulo viram erro, sem lançar', async (t) => {
  const { auditoria } = await criarAuditoriaTemporaria(t);
  const fetchQueLanca = () => {
    throw new Error('queda de rede');
  };
  const emRede = await rotearChamada(pedidoDe('LEVE'), {
    ambiente: ambienteCom(),
    fetchImpl: fetchQueLanca,
    auditoria,
  });
  assert.deepEqual(emRede, { usar: false, motivo: TIPOS_ERRO.REDE });
  const semFormato = await chamarDeepseek(
    { modelo: 'deepseek-flash', mensagens: [{ role: 'user', content: 'oi' }] },
    { ambiente: ambienteCom(), fetchImpl: criarFetchFalso({ corpo: {} }).fetchImpl },
  );
  assert.equal(semFormato.erro.tipo, TIPOS_ERRO.RESPOSTA_INVALIDA);
  const nulo = await chamarDeepseek(undefined, { ambiente: ambienteCom() });
  assert.equal(nulo.ok, false);
  const aoFalhar = await limitarTempo(Promise.reject(new Error('falha')), {
    tempoMaximoMs: TEMPO_CURTO_MS,
    aoFalhar: 'valor-de-falha',
  });
  assert.equal(aoFalhar, 'valor-de-falha');
});

test('a auditoria não grava o texto do pedido, da resposta nem a chave', async (t) => {
  const { diretorio, auditoria } = await criarAuditoriaTemporaria(t);
  const comSucesso = criarFetchFalso({ corpo: respostaComTexto(TEXTO_RESPOSTA) });
  await rotearChamada(pedidoDe('LEVE', TEXTO_PEDIDO), {
    ambiente: ambienteCom(),
    fetchImpl: comSucesso.fetchImpl,
    auditoria,
  });
  const comErro = criarFetchFalso({ status: 401 });
  await rotearChamada(pedidoDe('MEDIO', TEXTO_PEDIDO), {
    ambiente: ambienteCom(),
    fetchImpl: comErro.fetchImpl,
    auditoria,
  });
  const conteudo = await readFile(join(diretorio, ARQUIVO_AUDITORIA), 'utf8');
  assert.equal(conteudo.includes(TEXTO_PEDIDO), false);
  assert.equal(conteudo.includes(TEXTO_RESPOSTA), false);
  assert.equal(conteudo.includes(CHAVE_FALSA), false);
  const linhas = await lerLinhasAuditoria(diretorio);
  assert.equal(linhas.length, 2);
  const camposEsperados = [...CAMPOS_AUDITORIA].sort();
  for (const linha of linhas) {
    assert.deepEqual(Object.keys(linha).sort(), camposEsperados);
  }
});
