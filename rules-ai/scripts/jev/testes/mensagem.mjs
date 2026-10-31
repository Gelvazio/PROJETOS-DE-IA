// Teste da classificação de MENSAGEM (JEV-GLOBAL-AI-FINAL.2, .3, .5-.8, .10, .14, .24) contra um
// servidor HTTP local (node:http): sem rede externa, sem custo e com chave falsa. A auditoria vai
// para arquivo temporário. Cobre R1.2, R1.3, R1.4, R2.1, R2.2, R2.3, R6.1, R6.2 e INV-2.
// Uso: node scripts/jev/testes/mensagem.mjs
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classificarMensagem, montarContexto } from '../mensagem/classificar.mjs';
import { prepararPedido } from '../mensagem/estado.mjs';

const PASTA_JEV = join(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = join(PASTA_JEV, '..', 'jev.mjs');
const GANCHO = join(PASTA_JEV, 'ganchos', 'claude-prompt.mjs');
const CHAVE_FALSA = 'tsk_teste_SEGREDO_0123456789';
const CHAVE_NO_TEXTO = 'tsk_abcdefghijklmnop1234567890';
const CPF_NO_TEXTO = '529.982.247-25';
const MARCADOR = 'MARCADOR-UNICO-DA-MENSAGEM-98765';
const TEMPO_MAXIMO_MS = 600;
const FOLGA_MS = 500;
const ATRASO_SERVIDOR_MS = 3000;
const LIMITE_PROCESSO_MS = 20000;
const LIMITE_OFF_MS = 100;
const TOKENS_ENTRADA = 500;
const PEDIDO_COMUM = 'adicione um botão de exportar no relatório e ajuste o teste';
const CAMPOS_AUDITORIA = [
  'data', 'dia', 'projeto', 'hash', 'pulado', 'motivo', 'decisao', 'nivel', 'confianca',
  'custo_usd', 'latencia_ms', 'acao', 'situacao', 'erro_codigo',
];

const pasta = mkdtempSync(join(tmpdir(), 'jev-mensagem-'));
const ARQUIVO_AUDITORIA = join(pasta, 'mensagens-teste.jsonl');
const ARQUIVO_ENV_INEXISTENTE = join(pasta, 'sem.env');
const mock = { proxima: null, recebidos: [] };
let contadorMarcas = 0;

/**
 * Monta as respostas do Jev para a mensagem.
 * @param {{nivel?: string, confianca?: number, sinais?: Record<string, number>}} [dados]
 * @returns {object} Corpo de uma resposta 200 do Jev.
 */
function respostaJev(dados = {}) {
  const base = { banco: 0.05, segredo: 0.05, massa: 0.05, mais_de_3_arquivos: 0.05 };
  const sinais = { ...base, ...dados.sinais };
  return {
    model: 'jev-1.13.0',
    answers: {
      nivel: { choice: dados.nivel ?? 'MEDIO', confidence: dados.confianca ?? 0.91 },
      muda_algo: { noul: 0.9 },
      ...Object.fromEntries(Object.entries(sinais).map(([nome, noul]) => [nome, { noul }])),
    },
    usage: { input_tokens: dados.tokens ?? TOKENS_ENTRADA, output_tokens: 0 },
  };
}

/**
 * Atende um pedido no mock: guarda o corpo e responde o próximo passo definido pelo caso.
 * @param {import('node:http').IncomingMessage} pedido Pedido HTTP.
 * @param {import('node:http').ServerResponse} resposta Resposta HTTP.
 * @returns {Promise<void>}
 */
async function atender(pedido, resposta) {
  const partes = [];
  for await (const parte of pedido) partes.push(parte);
  mock.recebidos.push(Buffer.concat(partes).toString('utf8'));
  const passo = mock.proxima ?? { status: 200, corpo: respostaJev() };
  if (passo.atrasoMs) await new Promise((resolver) => { setTimeout(resolver, passo.atrasoMs); });
  if (resposta.destroyed) return;
  resposta.writeHead(passo.status, { 'Content-Type': 'application/json' });
  resposta.end(passo.bruto ?? JSON.stringify(passo.corpo ?? {}));
}

/**
 * Sobe o servidor mock em 127.0.0.1, numa porta livre.
 * @returns {Promise<void>}
 */
async function iniciarMock() {
  mock.servidor = createServer((pedido, resposta) => { atender(pedido, resposta); });
  mock.servidor.listen(0, '127.0.0.1');
  await once(mock.servidor, 'listening');
  mock.url = `http://127.0.0.1:${mock.servidor.address().port}`;
}

/**
 * Ambiente do caso: aponta para o mock, com chave falsa e sem `.env` real.
 * @param {Record<string, string>} [extra] Variáveis a mais (ou `undefined` para tirar uma).
 * @returns {Record<string, string>} Ambiente.
 */
function ambienteDe(extra = {}) {
  return {
    JEV_URL: mock.url,
    TYPESAFE_API_KEY: CHAVE_FALSA,
    JEV_ARQUIVO_ENV: ARQUIVO_ENV_INEXISTENTE,
    JEV_LOG: join(pasta, 'chamadas.jsonl'),
    JEV_AUDITORIA_MENSAGENS: ARQUIVO_AUDITORIA,
    JEV_TEMPO_MAXIMO_MENSAGEM_MS: String(TEMPO_MAXIMO_MS),
    ...extra,
  };
}

/**
 * Classifica uma mensagem no mock com o ambiente do caso.
 * @param {string} texto Texto da mensagem.
 * @param {Record<string, string>} [extra] Variáveis de ambiente a mais.
 * @param {object} [passo] Resposta do mock (padrão: 200 com confiança alta).
 * @returns {Promise<object>} Resultado de classificarMensagem.
 */
async function classificar(texto, extra = {}, passo = null) {
  mock.recebidos = [];
  mock.proxima = passo;
  contadorMarcas += 1;
  return classificarMensagem({ texto, projeto: 'projeto-teste' }, {
    ambiente: ambienteDe(extra), decorridoMs: () => 0,
    pastaMarcas: join(pasta, `marcas-${contadorMarcas}`),
  });
}

/**
 * Roda um processo filho de forma assíncrona (o mock vive neste processo: nada de spawnSync).
 * @param {string[]} argumentos Argumentos do `node`.
 * @param {{entrada?: string, env?: Record<string, string>}} [opcoes] Entrada padrão e ambiente.
 * @returns {Promise<{codigo: number, saida: string, erro: string}>} Resultado do processo.
 */
function rodar(argumentos, opcoes = {}) {
  contadorMarcas += 1;
  const marcas = join(pasta, `marcas-${contadorMarcas}`);
  const env = {
    PATH: process.env.PATH, HOME: pasta, ...ambienteDe(), JEV_PASTA_MARCAS: marcas, ...opcoes.env,
  };
  const filho = spawn(process.execPath, argumentos, { env, stdio: ['pipe', 'pipe', 'pipe'] });
  const saida = [];
  const erro = [];
  filho.stdout.on('data', (parte) => saida.push(parte));
  filho.stderr.on('data', (parte) => erro.push(parte));
  filho.stdin.on('error', () => {});
  filho.stdin.end(opcoes.entrada ?? '');
  const limite = setTimeout(() => filho.kill(), LIMITE_PROCESSO_MS);
  return once(filho, 'close').then(([codigo]) => {
    clearTimeout(limite);
    return {
      codigo,
      saida: Buffer.concat(saida).toString('utf8'),
      erro: Buffer.concat(erro).toString('utf8'),
    };
  });
}

/**
 * Lê as linhas gravadas na auditoria de teste.
 * @returns {object[]} Linhas JSON.
 */
function lerAuditoria() {
  const linhas = readFileSync(ARQUIVO_AUDITORIA, 'utf8').split('\n').filter(Boolean);
  return linhas.map((linha) => JSON.parse(linha));
}

/** R1.2: sem chave e com JEV_MENSAGENS=off / JEV_MODO=off, código 0 e só sinais, sem chamada. */
async function casoR12() {
  const semChave = await classificar(PEDIDO_COMUM, { TYPESAFE_API_KEY: '' });
  assert.equal(semChave.decisao, 'sinais');
  assert.equal(semChave.erro_codigo, 'CHAVE_AUSENTE');
  assert.equal(semChave.pulado, false);
  assert.match(montarContexto(semChave), /Jev indisponível: classifique pelos sinais/);
  assert.equal(mock.recebidos.length, 0);

  for (const extra of [{ JEV_MENSAGENS: 'off' }, { JEV_MODO: 'off' }]) {
    const inicio = performance.now();
    const desligado = await classificar(PEDIDO_COMUM, extra);
    assert.ok(performance.now() - inicio < LIMITE_OFF_MS, 'off demorou mais de 100 ms');
    assert.equal(desligado.decisao, 'sinais');
    assert.equal(desligado.pulado, true);
    assert.equal(desligado.motivo, 'desligado');
    assert.equal(mock.recebidos.length, 0);
    assert.equal(montarContexto(desligado), '');
  }
  const processo = await rodar([CLI, 'mensagem', '--json', '--texto', PEDIDO_COMUM],
    { env: { TYPESAFE_API_KEY: '' } });
  assert.equal(processo.codigo, 0);
  assert.equal(JSON.parse(processo.saida).decisao, 'sinais');
  assert.equal(processo.erro, '');
  return 'sem chave, off e JEV_MODO=off: código 0, sinais, 0 requisições';
}

/** R1.3: servidor lento -> volta no tempo máximo + folga, em só sinais, sem repetir. */
async function casoR13() {
  const inicio = performance.now();
  const resultado = await classificar(PEDIDO_COMUM, {}, {
    status: 200, corpo: respostaJev(), atrasoMs: ATRASO_SERVIDOR_MS,
  });
  const gasto = performance.now() - inicio;
  assert.ok(gasto <= TEMPO_MAXIMO_MS + FOLGA_MS, `demorou ${Math.round(gasto)} ms`);
  assert.equal(resultado.decisao, 'sinais');
  assert.equal(resultado.erro_codigo, 'TEMPO_ESGOTADO');
  assert.equal(mock.recebidos.length, 1, 'repetiu a chamada');
  return `voltou em ${Math.round(gasto)} ms (máximo ${TEMPO_MAXIMO_MS} + ${FOLGA_MS})`;
}

/** Falhas do servidor (5xx, 4xx, JSON ruim, sem answers) viram só sinais, sem repetição. */
async function casoFalhas() {
  const falhas = [
    { status: 500, corpo: {} }, { status: 401, corpo: {} }, { status: 429, corpo: {} },
    { status: 200, bruto: 'não é json' }, { status: 200, corpo: { sem: 'answers' } },
    { status: 200, corpo: { answers: { nivel: { choice: 'ENORME', confidence: 0.99 } } } },
  ];
  for (const passo of falhas) {
    const resultado = await classificar(PEDIDO_COMUM, {}, passo);
    assert.equal(resultado.decisao, 'sinais', JSON.stringify(passo));
    assert.ok(resultado.erro_codigo, 'sem código de erro');
    assert.equal(mock.recebidos.length, 1, `repetiu em ${JSON.stringify(passo)}`);
  }
  const foraDoAr = await classificarMensagem({ texto: PEDIDO_COMUM, projeto: 'p' },
    { ambiente: ambienteDe({ JEV_URL: 'http://127.0.0.1:1' }), decorridoMs: () => 0 });
  assert.equal(foraDoAr.decisao, 'sinais');
  const invalida = await classificar(PEDIDO_COMUM, { JEV_MAX_CUSTO_DIA: 'abc' });
  assert.equal(invalida.erro_codigo, 'CONFIGURACAO_INVALIDA');
  return '500, 401, 429, JSON ruim, sem answers, nível inválido, rede fora, config inválida';
}

/** R1.4: `.`, `;`, `?`, `/model` (e vazios) são pulados sem nenhuma requisição. */
async function casoR14() {
  for (const texto of ['.', ';', '?', '/model', '  ab  ', '', '/clear tudo', '   ']) {
    const resultado = await classificar(texto);
    assert.equal(resultado.pulado, true, JSON.stringify(texto));
    assert.equal(resultado.custo_usd, 0);
    assert.equal(resultado.motivo, 'trivial');
  }
  assert.equal(mock.recebidos.length, 0, 'houve requisição para mensagem trivial');
  const comQuatro = await classificar('abcd');
  assert.equal(comQuatro.pulado, false, 'quatro caracteres devem ir ao Jev');
  return '8 mensagens puladas, 0 requisições; 4 caracteres vão ao Jev';
}

/** R2.1: o dry-run e o corpo enviado ao mock saem sem a chave, o CPF e rótulos. */
async function casoR21() {
  const texto = `use ${CHAVE_NO_TEXTO} e CPF ${CPF_NO_TEXTO} no Sonnet PESADO`;
  mock.recebidos = [];
  const dry = await rodar([CLI, 'mensagem', '--dry-run', '--json', '--texto', texto]);
  assert.equal(dry.codigo, 0);
  for (const proibido of [CHAVE_NO_TEXTO, CPF_NO_TEXTO]) {
    assert.ok(!dry.saida.includes(proibido), `dry-run mostra "${proibido.slice(0, 6)}…"`);
  }
  const mensagem = JSON.parse(dry.saida).state.mensagem;
  assert.equal(mensagem, 'use [CHAVE] e CPF [CPF] no', 'state do dry-run não está mascarado/cego');
  const texto2 = await rodar([CLI, 'mensagem', '--dry-run', '--texto', texto]);
  assert.match(texto2.saida, /\[CHAVE\]/);
  assert.match(texto2.saida, /\[CPF\]/);
  assert.equal(mock.recebidos.length, 0, 'dry-run chamou o Jev');

  await classificar(`${texto} ${PEDIDO_COMUM}`);
  assert.equal(mock.recebidos.length, 1);
  const enviado = JSON.parse(mock.recebidos[0]);
  assert.deepEqual(Object.keys(enviado.state).sort(), ['mensagem', 'projeto']);
  for (const proibido of [CHAVE_NO_TEXTO, CPF_NO_TEXTO, 'Sonnet', 'tsk_']) {
    assert.ok(!mock.recebidos[0].includes(proibido), `corpo enviado traz "${proibido}"`);
  }
  return 'dry-run e corpo enviado mascarados; state só com projeto e mensagem';
}

/** Mensagem longa é cortada em 4000 caracteres e cabe no teto de tokens da mensagem. */
async function casoCorte() {
  const longa = `${PEDIDO_COMUM} ${'x'.repeat(10000)}`;
  const orcamento = { modelo: 'jev-1.13.0', maximoTokens: 100000 };
  const pedido = prepararPedido({ texto: longa, projeto: 'p' }, orcamento);
  assert.ok(pedido.state.mensagem.length <= 4000);
  await classificar(longa);
  const enviado = JSON.parse(mock.recebidos[0]);
  assert.ok(Buffer.byteLength(mock.recebidos[0]) / 3 <= 2000, 'corpo passa do teto de 2000 tokens');
  assert.ok(enviado.state.mensagem.startsWith('adicione'));
  const semEspaco = await classificar(PEDIDO_COMUM, { JEV_MAX_TOKENS_MENSAGEM: '50' });
  assert.equal(semEspaco.erro_codigo, 'LIMITE_TOKENS');
  assert.equal(mock.recebidos.length, 0);
  return 'corte em 4000 e no teto de tokens; teto minúsculo -> só sinais sem chamada';
}

/** R2.2 e INV-4: a auditoria tem só os campos permitidos e nunca o texto nem a chave. */
async function casoR22() {
  rmSync(ARQUIVO_AUDITORIA, { force: true });
  await classificar(`${MARCADOR} ${CHAVE_NO_TEXTO} ${CPF_NO_TEXTO} ${PEDIDO_COMUM}`);
  await classificar('.');
  const bruto = readFileSync(ARQUIVO_AUDITORIA, 'utf8');
  for (const proibido of [MARCADOR, CHAVE_NO_TEXTO, CHAVE_FALSA, CPF_NO_TEXTO, 'adicione']) {
    assert.ok(!bruto.includes(proibido), `auditoria traz "${proibido.slice(0, 8)}…"`);
  }
  const linhas = lerAuditoria();
  assert.equal(linhas.length, 2);
  for (const linha of linhas) assert.deepEqual(Object.keys(linha), CAMPOS_AUDITORIA);
  assert.match(linhas[0].hash, /^[0-9a-f]{16}$/);
  assert.equal(linhas[0].decisao, 'jev');
  assert.ok(linhas[0].custo_usd > 0);
  assert.equal(linhas[1].pulado, true);
  assert.equal(linhas[1].hash, null);
  const quebrada = await classificarMensagem({ texto: PEDIDO_COMUM, projeto: 'p' },
    {
      ambiente: ambienteDe(), decorridoMs: () => 0,
      arquivoAuditoria: join(ARQUIVO_AUDITORIA, 'nao', 'cabe.jsonl'),
    });
  assert.equal(quebrada.decisao, 'jev', 'falha na auditoria derrubou a mensagem');
  return '2 linhas, só campos permitidos, sem texto nem chave; falha de gravação ignorada';
}

/** R2.2 (RULES-LOCAL-JEV.5): a mesma mensagem duas vezes seguidas chama o Jev uma vez só. */
async function casoUmaChamadaPorMensagem() {
  const pastaMarcas = join(pasta, 'marcas-repetida');
  const dependencias = { ambiente: ambienteDe(), decorridoMs: () => 0, pastaMarcas };
  mock.recebidos = [];
  mock.proxima = null;
  const primeira = await classificarMensagem({ texto: PEDIDO_COMUM, projeto: 'p' }, dependencias);
  const segunda = await classificarMensagem({ texto: PEDIDO_COMUM, projeto: 'p' }, dependencias);
  assert.equal(primeira.pulado, false);
  assert.equal(segunda.pulado, true);
  assert.equal(segunda.motivo, 'repetida');
  assert.equal(mock.recebidos.length, 1, 'mesma mensagem chamou o Jev duas vezes');
  const outra = await classificarMensagem({ texto: `${PEDIDO_COMUM} e mais um ajuste`,
    projeto: 'p' }, dependencias);
  assert.equal(outra.pulado, false);
  assert.equal(mock.recebidos.length, 2, 'texto diferente deveria chamar o Jev');
  const marcaQuebrada = join(pasta, 'marcas-repetida', 'nao', 'cabe');
  writeFileSync(join(pasta, 'arquivo-no-caminho'), 'x');
  const semMarca = await classificarMensagem({ texto: `${PEDIDO_COMUM} terceira`, projeto: 'p' },
    { ...dependencias, pastaMarcas: join(pasta, 'arquivo-no-caminho', marcaQuebrada) });
  assert.equal(semMarca.pulado, false, 'falha ao gravar a marca derrubou a mensagem');
  return '2 chamadas iguais -> 1 requisição; texto diferente chama; falha na marca ignorada';
}

/** R2.3: limite 0 não chama; e o gasto do dia (da própria auditoria) trava a chamada seguinte. */
async function casoR23() {
  const zero = await classificar(PEDIDO_COMUM, { JEV_MAX_CUSTO_DIA: '0' });
  assert.equal(zero.decisao, 'sinais');
  assert.equal(zero.erro_codigo, 'LIMITE_DIA');
  assert.equal(mock.recebidos.length, 0);
  assert.match(montarContexto(zero), /limite do dia/);

  rmSync(ARQUIVO_AUDITORIA, { force: true });
  const passo = { status: 200, corpo: respostaJev({ tokens: 1000000 }) };
  const limite = { JEV_MAX_CUSTO_DIA: '0.04', JEV_MAX_TOKENS_MENSAGEM: '2000' };
  const primeira = await classificar(PEDIDO_COMUM, limite, passo);
  assert.equal(primeira.decisao, 'jev');
  assert.ok(primeira.custo_usd > 0.04);
  const segunda = await classificar(PEDIDO_COMUM, limite, passo);
  assert.equal(segunda.erro_codigo, 'LIMITE_DIA');
  assert.equal(mock.recebidos.length, 0, 'chamou o Jev depois de estourar o dia');
  return 'limite 0 e limite acumulado do dia: 0 requisições depois de estourar';
}

/** R6.1: confiança alta e nenhum sinal de PESADO -> o Jev decide, sem revisão. */
async function casoR61() {
  const resultado = await classificar(PEDIDO_COMUM);
  assert.equal(resultado.decisao, 'jev');
  assert.equal(resultado.nivel, 'MEDIO');
  assert.equal(resultado.effort, 'medium');
  assert.equal(resultado.revisar, false);
  assert.ok(resultado.modelos_elegiveis.includes('Claude Code (Sonnet)'));
  assert.equal(resultado.pulado, false);
  const linhas = montarContexto(resultado).split('\n');
  assert.ok(linhas.length <= 3 && linhas[0].includes('Jev decidiu'));
  const passoLeve = { status: 200, corpo: respostaJev({ nivel: 'LEVE' }) };
  const leve = await classificar(PEDIDO_COMUM, {}, passoLeve);
  assert.deepEqual([leve.decisao, leve.nivel, leve.effort], ['jev', 'LEVE', 'low']);
  return 'MEDIO/medium e LEVE/low com decisao=jev, revisar=false';
}

/** R6.2 e INV-5: confiança baixa -> matriz + revisar; sinal de PESADO nunca é rebaixado. */
async function casoR62() {
  const baixa = await classificar(PEDIDO_COMUM, {}, {
    status: 200, corpo: respostaJev({ nivel: 'MEDIO', confianca: 0.55 }),
  });
  assert.deepEqual([baixa.decisao, baixa.nivel, baixa.revisar], ['matriz', 'MEDIO', true]);

  const comSinal = await classificar(PEDIDO_COMUM, {}, {
    status: 200, corpo: respostaJev({ nivel: 'LEVE', confianca: 0.95, sinais: { banco: 0.9 } }),
  });
  assert.deepEqual([comSinal.decisao, comSinal.nivel, comSinal.effort, comSinal.revisar],
    ['matriz', 'PESADO', 'high', true]);
  assert.ok(comSinal.modelos_elegiveis.every((m) => !/Haiku|Sonnet/.test(m)));
  assert.match(montarContexto(comSinal), /Revisão humana/);

  const limiteExato = await classificar(PEDIDO_COMUM, {}, {
    status: 200, corpo: respostaJev({ confianca: 0.8 }),
  });
  assert.equal(limiteExato.decisao, 'jev', 'confiança 0,80 deve decidir');
  return 'confiança 0,55 -> matriz; LEVE com sinal de banco -> PESADO/high; 0,80 -> jev';
}

/** O contexto tem no máximo 3 linhas e leva os alertas (já sem segredo). */
function casoContexto() {
  const resultado = {
    pulado: false, motivo: 'ok', decisao: 'jev', nivel: 'MEDIO', effort: 'medium',
    modelos_elegiveis: ['a', 'b', 'c', 'd', 'e'], confianca: 0.9, revisar: false,
    alertas: ['segredo na mensagem', 'pasta proibida'],
  };
  const linhas = montarContexto(resultado).split('\n');
  assert.equal(linhas.length, 3);
  assert.match(linhas[2], /^Alertas: segredo na mensagem; pasta proibida$/);
  assert.equal(montarContexto({ ...resultado, pulado: true }), '');
  assert.equal(montarContexto(null), '');
  const soSinais = montarContexto({ ...resultado, decisao: 'sinais', alertas: [] });
  assert.equal(soSinais.split('\n').length, 1);
  return 'até 3 linhas; pulado e nulo -> vazio';
}

/**
 * Roda o gancho com uma entrada e confere o contrato (INV-2).
 * @param {string} entrada Texto da entrada padrão.
 * @param {Record<string, string>} [env] Ambiente a mais.
 * @returns {Promise<{codigo: number, saida: string, erro: string}>} Resultado.
 */
async function rodarGancho(entrada, env = {}) {
  const processo = await rodar([GANCHO], { entrada, env });
  assert.equal(processo.codigo, 0, `código ${processo.codigo}`);
  assert.equal(processo.erro, '', 'o gancho escreveu em stderr');
  assert.ok(!/"decision"|"block"/.test(processo.saida), 'o gancho imprimiu decision/block');
  return processo;
}

/** INV-2: o gancho com JSON válido e inválido sai 0, nunca bloqueia e só acrescenta contexto. */
async function casoGancho() {
  mock.proxima = null;
  const evento = {
    prompt: PEDIDO_COMUM, cwd: '/home/x/meu-projeto', session_id: 's1',
    hook_event_name: 'UserPromptSubmit',
  };
  const valido = await rodarGancho(JSON.stringify(evento));
  const saida = JSON.parse(valido.saida);
  assert.deepEqual(Object.keys(saida), ['hookSpecificOutput']);
  assert.equal(saida.hookSpecificOutput.hookEventName, 'UserPromptSubmit');
  assert.match(saida.hookSpecificOutput.additionalContext, /^Jev decidiu/);
  assert.equal(JSON.parse(mock.recebidos.at(-1)).state.projeto, 'meu-projeto');

  const aviso = await rodarGancho(JSON.stringify(evento), { TYPESAFE_API_KEY: '' });
  assert.match(JSON.parse(aviso.saida).hookSpecificOutput.additionalContext, /Jev indisponível/);

  const pedidoAntes = mock.recebidos.length;
  const semSaida = ['', 'lixo', '{', '[]', 'null', '{"prompt":42}', '{"prompt":"/model"}',
    '{"prompt":"?"}', JSON.stringify({ ...evento, hook_event_name: 'Stop' }),
    JSON.stringify({ ...evento, prompt: PEDIDO_COMUM }).slice(0, 30)];
  for (const entrada of semSaida) {
    const processo = await rodarGancho(entrada);
    assert.equal(processo.saida, '', `saída para ${JSON.stringify(entrada)}`);
  }
  assert.equal(mock.recebidos.length, pedidoAntes, 'entrada inválida ou trivial chamou o Jev');
  const desligado = await rodarGancho(JSON.stringify(evento), { JEV_MENSAGENS: 'off' });
  assert.equal(desligado.saida, '');
  return 'válido, sem chave, 10 entradas inválidas/triviais e off: código 0, stderr vazio';
}

/** R3.1: com o guardrail real, comando destrutivo e chave geram alertas sem o valor achado. */
async function casoGuardrailReal() {
  rmSync(ARQUIVO_AUDITORIA, { force: true });
  const destrutivo = await classificar(`rode git reset --hard e depois ${PEDIDO_COMUM}`);
  assert.ok(destrutivo.alertas.length > 0, 'git reset --hard sem alerta');
  assert.match(montarContexto(destrutivo), /\nAlertas: /);

  const comChave = await classificar(`configure com ${CHAVE_NO_TEXTO} e ${PEDIDO_COMUM}`);
  assert.ok(comChave.alertas.length > 0, 'chave sem alerta');
  assert.ok(!montarContexto(comChave).includes(CHAVE_NO_TEXTO), 'chave no contexto');
  assert.ok(!JSON.stringify(comChave.alertas).includes('abcdefghijklmnop'));
  assert.ok(!readFileSync(ARQUIVO_AUDITORIA, 'utf8').includes(CHAVE_NO_TEXTO));

  const limpo = await classificar(PEDIDO_COMUM);
  assert.deepEqual(limpo.alertas, []);
  assert.ok(!montarContexto(limpo).includes('Alertas'));
  assert.equal(String(destrutivo.custo_usd).length < 14, true, 'custo sem arredondar');
  return 'git reset --hard e chave -> alertas sem o valor; texto limpo -> []';
}

/** R1.3 no processo: o gancho inteiro (com subida do node) volta dentro do tempo máximo. */
async function casoR13Processo() {
  const tempoMs = 1500;
  mock.recebidos = [];
  mock.proxima = { status: 200, corpo: respostaJev(), atrasoMs: 5000 };
  const evento = JSON.stringify({
    prompt: PEDIDO_COMUM, cwd: '/x/p', hook_event_name: 'UserPromptSubmit',
  });
  const inicio = performance.now();
  const processo = await rodar([GANCHO], {
    entrada: evento, env: { JEV_TEMPO_MAXIMO_MENSAGEM_MS: String(tempoMs) },
  });
  const gasto = performance.now() - inicio;
  assert.equal(processo.codigo, 0);
  assert.ok(gasto <= tempoMs, `processo levou ${Math.round(gasto)} ms (máximo ${tempoMs})`);
  assert.match(processo.saida, /Jev indisponível/);
  const semOrcamento = await classificarMensagem({ texto: PEDIDO_COMUM, projeto: 'p' },
    { ambiente: ambienteDe(), decorridoMs: () => TEMPO_MAXIMO_MS });
  assert.equal(semOrcamento.decisao, 'sinais');
  return `gancho em ${Math.round(gasto)} ms (máximo ${tempoMs}); sem orçamento -> sinais`;
}

const CASOS = [
  ['R1.2 sem chave, JEV_MENSAGENS=off e JEV_MODO=off', casoR12],
  ['R1.3 servidor lento volta no tempo máximo', casoR13],
  ['R1.3 processo do gancho dentro do tempo máximo', casoR13Processo],
  ['falhas do Jev (5xx, 4xx, JSON ruim, rede) viram só sinais', casoFalhas],
  ['R1.4 mensagens triviais não chamam o Jev', casoR14],
  ['R2.1 dry-run e envio mascarados', casoR21],
  ['corte em 4000 caracteres e teto de tokens', casoCorte],
  ['R2.2 auditoria sem texto e sem chave', casoR22],
  ['R2.2 uma chamada ao Jev por mensagem repetida', casoUmaChamadaPorMensagem],
  ['R2.3 limite de custo do dia', casoR23],
  ['R6.1 confiança alta sem sinal -> jev', casoR61],
  ['R6.2 confiança baixa ou sinal de PESADO -> matriz + revisar', casoR62],
  ['contexto de até 3 linhas', casoContexto],
  ['R3.1 guardrail real na mensagem', casoGuardrailReal],
  ['INV-2 gancho do Claude Code', casoGancho],
];

/**
 * Roda os casos em ordem e imprime OK/FALHA de cada um.
 * @returns {Promise<number>} Quantidade de falhas.
 */
async function executarCasos() {
  let falhas = 0;
  for (const [nome, executar] of CASOS) {
    try {
      console.log(`OK    ${nome} (${await executar()})`);
    } catch (erro) {
      falhas += 1;
      console.log(`FALHA ${nome}: ${erro.message}`);
    }
  }
  return falhas;
}

/**
 * Sobe o mock, roda os casos e limpa os arquivos temporários.
 * @returns {Promise<number>} Código de saída (0 = todos passaram).
 */
async function principal() {
  await iniciarMock();
  try {
    const falhas = await executarCasos();
    console.log(falhas === 0 ? 'Todos os casos passaram.' : `${falhas} caso(s) falharam.`);
    return falhas === 0 ? 0 : 1;
  } finally {
    mock.servidor.closeAllConnections();
    mock.servidor.close();
    rmSync(pasta, { recursive: true, force: true });
  }
}

process.exitCode = await principal();
