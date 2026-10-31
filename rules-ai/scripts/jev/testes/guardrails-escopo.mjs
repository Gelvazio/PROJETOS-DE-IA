// Teste dos guardrails de escopo e de critérios de aceite (JEV-RULES-AI.4), sem rede e sem custo:
// o cliente do Jev e o redator são falsos. Cobre 20 casos de escopo (5 fora, 5 ambíguos, 10
// dentro) e 20 de aceite, a falha do Jev (nunca `liberar` silencioso), a máscara antes do envio
// e o log de auditoria sem texto sensível. Estes guardrails nunca devolvem `bloquear`.
// Uso: node scripts/jev/testes/guardrails-escopo.mjs
import assert from 'node:assert/strict';
import { ErroJev } from '../config.mjs';
import { avaliarAceite } from '../guardrails/aceite.mjs';
import { avaliarEscopo, interpretarMudancas } from '../guardrails/escopo.mjs';

const PADRAO_SEGREDO = /sk-[A-Za-z0-9]+/g;
const SEGREDO_FALSO = 'sk-ABCDEF1234567890';
const DESCRICAO = 'Criar o guardrail de escopo em scripts/jev/guardrails.';
const PREVISTOS = ['scripts/jev/guardrails/escopo.mjs', 'scripts/jev/testes/', 'docs/*.md'];
const ACOES_VALIDAS = new Set(['liberar', 'avisar', 'revisar']);
const MODELO_FALSO = 'jev-falso';

/**
 * Redator falso: troca `sk-…` por uma marca e informa o achado (contrato do redigir.mjs).
 * @param {string} texto Texto original.
 * @returns {{texto: string, achados: string[]}} Texto mascarado e achados.
 */
function redatorFalso(texto) {
  const achados = texto.match(PADRAO_SEGREDO) ?? [];
  return { texto: texto.replace(PADRAO_SEGREDO, '[SEGREDO]'), achados: achados.map(() => 'chave') };
}

/**
 * Cria um cliente falso que guarda os pedidos e responde pelo roteiro.
 * @param {(pedido: object) => object} roteiro Devolve `answers` (ou lança ErroJev).
 * @returns {{perguntar: Function, pedidos: object[]}} Cliente falso.
 */
function criarClienteFalso(roteiro) {
  const pedidos = [];
  return {
    pedidos,
    async perguntar(pedido) {
      pedidos.push(pedido);
      return {
        respostas: roteiro(pedido), modeloResposta: MODELO_FALSO,
        uso: { tokensEntrada: 100, tokensSaida: 0 }, custoUsd: 0.000004,
      };
    },
  };
}

/**
 * Monta `answers` de escopo com as duas probabilidades.
 * @param {number} pFora Probabilidade de `fora_do_escopo`.
 * @param {number} pArquivo Probabilidade de `arquivo_nao_previsto`.
 * @returns {object} Campo `answers`.
 */
function respostasEscopo(pFora, pArquivo) {
  return { fora_do_escopo: { noul: pFora }, arquivo_nao_previsto: { noul: pArquivo } };
}

/**
 * Monta `answers` de aceite c1…cN a partir das probabilidades.
 * @param {number[]} probabilidades Uma por critério.
 * @returns {object} Campo `answers`.
 */
function respostasAceite(probabilidades) {
  return Object.fromEntries(probabilidades.map((p, i) => [`c${i + 1}`, { noul: p }]));
}

/**
 * Cria a auditoria em memória.
 * @returns {{linhas: object[], registrar: Function}} Gravador falso.
 */
function criarAuditoriaMemoria() {
  const linhas = [];
  return { linhas, registrar: async (linha) => { linhas.push(linha); } };
}

const NAME_STATUS = (...caminhos) => caminhos.map((c) => `M\t${c}`).join('\n');
const DENTRO = 'scripts/jev/guardrails/escopo.mjs';
const CASOS_ESCOPO = [
  // 10 dentro
  { nome: 'dentro 1: arquivo exato', mud: NAME_STATUS(DENTRO), p: [0.05, 0.05], classe: 'dentro' },
  { nome: 'dentro 2: pasta prevista', mud: NAME_STATUS('scripts/jev/testes/a.mjs'), p: [0.1, 0.1], classe: 'dentro' },
  { nome: 'dentro 3: glob docs', mud: NAME_STATUS('docs/jev.md'), p: [0.02, 0.0], classe: 'dentro' },
  { nome: 'dentro 4: dois previstos', mud: NAME_STATUS(DENTRO, 'scripts/jev/testes/b.mjs'), p: [0.2, 0.1], classe: 'dentro' },
  { nome: 'dentro 5: renomeado dentro', mud: `R100\tdocs/x.md\t${DENTRO}`, p: [0.1, 0.1], classe: 'dentro' },
  { nome: 'dentro 6: barras invertidas', mud: NAME_STATUS('scripts\\jev\\guardrails\\escopo.mjs'), p: [0.3, 0.2], classe: 'dentro' },
  { nome: 'dentro 7: ./ no início', mud: NAME_STATUS(`./${DENTRO}`), p: [0.15, 0.15], classe: 'dentro' },
  { nome: 'dentro 8: p logo abaixo de 0,6', mud: NAME_STATUS(DENTRO), p: [0.59, 0.1], classe: 'dentro' },
  { nome: 'dentro 9: adicionado', mud: `A\t${DENTRO}`, p: [0.0, 0.0], classe: 'dentro' },
  { nome: 'dentro 10: apagado previsto', mud: `D\tdocs/velho.md`, p: [0.25, 0.05], classe: 'dentro' },
  // 5 ambíguos
  { nome: 'ambigua 1: Jev 0,7', mud: NAME_STATUS(DENTRO), p: [0.7, 0.2], classe: 'ambigua', acao: 'avisar' },
  { nome: 'ambigua 2: Jev 0,6 exato', mud: NAME_STATUS(DENTRO), p: [0.6, 0.0], classe: 'ambigua', acao: 'avisar' },
  { nome: 'ambigua 3: Jev 0,89', mud: NAME_STATUS(DENTRO), p: [0.1, 0.89], classe: 'ambigua', acao: 'avisar' },
  { nome: 'ambigua 4: arquivo não previsto, Jev baixo', mud: NAME_STATUS(DENTRO, 'README.md'), p: [0.05, 0.05], classe: 'ambigua', acao: 'avisar', naoPrevistos: ['README.md'] },
  { nome: 'ambigua 5: renomeado para fora', mud: `R090\t${DENTRO}\tscripts/outro/novo.mjs`, p: [0.1, 0.1], classe: 'ambigua', acao: 'avisar', naoPrevistos: ['scripts/outro/novo.mjs'] },
  // 5 fora
  { nome: 'fora 1: Jev 0,95', mud: NAME_STATUS(DENTRO), p: [0.95, 0.2], classe: 'fora', acao: 'revisar' },
  { nome: 'fora 2: Jev 0,9 exato', mud: NAME_STATUS(DENTRO), p: [0.1, 0.9], classe: 'fora', acao: 'revisar' },
  { nome: 'fora 3: não previsto + Jev 0,97', mud: NAME_STATUS('tasks/STATUS.md'), p: [0.97, 0.97], classe: 'fora', acao: 'revisar', naoPrevistos: ['tasks/STATUS.md'] },
  { nome: 'fora 4: caminho com ..', mud: NAME_STATUS('scripts/jev/testes/../../../x.mjs'), p: [0.92, 0.5], classe: 'fora', acao: 'revisar', naoPrevistos: ['scripts/jev/testes/../../../x.mjs'] },
  { nome: 'fora 5: vários não previstos', mud: NAME_STATUS('a.js', 'b.js', DENTRO), p: [0.99, 0.99], classe: 'fora', acao: 'revisar', naoPrevistos: ['a.js', 'b.js'] },
];

/**
 * Roda um caso de escopo e confere classe, ação e arquivos não previstos.
 * @param {object} caso Caso da tabela.
 * @returns {Promise<void>}
 */
async function rodarCasoEscopo(caso) {
  const cliente = criarClienteFalso(() => respostasEscopo(...caso.p));
  const auditoria = criarAuditoriaMemoria();
  const resultado = await avaliarEscopo(
    { descricao: DESCRICAO, arquivosPrevistos: PREVISTOS, mudancas: caso.mud, resumo: 'resumo' },
    { cliente, redigirTexto: redatorFalso, registrar: auditoria.registrar },
  );
  assert.equal(resultado.classe, caso.classe, `${caso.nome}: classe`);
  assert.equal(resultado.acao, caso.acao ?? 'liberar', `${caso.nome}: ação`);
  assert.ok(ACOES_VALIDAS.has(resultado.acao), `${caso.nome}: nunca bloqueia`);
  assert.deepEqual(resultado.naoPrevistos, caso.naoPrevistos ?? [], `${caso.nome}: não previstos`);
  assert.equal(auditoria.linhas.length, 1, `${caso.nome}: 1 linha de auditoria`);
}

/** Casos de aceite: probabilidades por critério e ação esperada. */
const CASOS_ACEITE = [
  { nome: 'aceite 1: todos altos', p: [0.9, 0.95], acao: 'liberar' },
  { nome: 'aceite 2: 0,8 exato', p: [0.8, 0.8], acao: 'liberar' },
  { nome: 'aceite 3: um critério alto', p: [0.95], acao: 'liberar' },
  { nome: 'aceite 4: um abaixo de 0,8', p: [0.9, 0.79], acao: 'avisar' },
  { nome: 'aceite 5: 0,6', p: [0.6, 0.9], acao: 'avisar' },
  { nome: 'aceite 6: 0,5 exato não revisa', p: [0.5, 0.9], acao: 'avisar' },
  { nome: 'aceite 7: 0,49 revisa', p: [0.49, 0.9], acao: 'revisar' },
  { nome: 'aceite 8: 0,1 revisa', p: [0.1], acao: 'revisar' },
  { nome: 'aceite 9: oito critérios altos', p: Array(8).fill(0.9), acao: 'liberar' },
  { nome: 'aceite 10: onze critérios (3 sobram)', p: Array(11).fill(0.9), acao: 'avisar' },
  { nome: 'aceite 11: teste falhou', p: [0.95, 0.95], acao: 'revisar', testes: { passaram: 3, falharam: 2 } },
  { nome: 'aceite 12: sem critérios', criterios: [], acao: 'avisar' },
  { nome: 'aceite 13: sem critérios e teste falho', criterios: [], acao: 'revisar', testes: { falharam: 1 } },
  { nome: 'aceite 14: Jev fora do ar', p: [0.9], acao: 'revisar', falha: true },
  { nome: 'aceite 15: resposta de c2 faltando', p: [0.9, 0.9], acao: 'revisar', omitir: 'c2' },
  { nome: 'aceite 16: critério vazio', criterios: ['ok', '  '], acao: 'revisar' },
  { nome: 'aceite 17: critérios ausentes', criterios: null, acao: 'revisar' },
  { nome: 'aceite 18: três altos', p: [0.85, 0.8, 0.99], acao: 'liberar' },
  { nome: 'aceite 19: 0,79', p: [0.79], acao: 'avisar' },
  { nome: 'aceite 20: dois baixos', p: [0.3, 0.2], acao: 'revisar' },
];

/**
 * Roda um caso de aceite e confere a ação (e que nunca bloqueia).
 * @param {object} caso Caso da tabela.
 * @returns {Promise<void>}
 */
async function rodarCasoAceite(caso) {
  const probabilidades = caso.p ?? [];
  const criterios = caso.criterios !== undefined
    ? caso.criterios : probabilidades.map((_, i) => `Critério ${i + 1}`);
  const cliente = criarClienteFalso(() => {
    if (caso.falha) throw new ErroJev('HTTP_529', 'sobrecarregado');
    const respostas = respostasAceite(probabilidades);
    if (caso.omitir) delete respostas[caso.omitir];
    return respostas;
  });
  const resultado = await avaliarAceite(
    { criterios, evidencia: { resumo: 'entregue', arquivos: ['a.mjs'], testes: caso.testes } },
    { cliente, redigirTexto: redatorFalso, registrar: async () => {} },
  );
  assert.equal(resultado.acao, caso.acao, `${caso.nome}: ação (${resultado.motivos?.join('; ')})`);
  assert.ok(ACOES_VALIDAS.has(resultado.acao), `${caso.nome}: nunca bloqueia`);
}

/**
 * Confere a falha do Jev no escopo, a resposta incompleta e o diff vazio.
 * @returns {Promise<void>}
 */
async function testarFalhasDoEscopo() {
  const entrada = { descricao: DESCRICAO, arquivosPrevistos: PREVISTOS, mudancas: NAME_STATUS(DENTRO) };
  const semRede = { perguntar: async () => { throw new ErroJev('FALHA_REDE', 'sem rede'); } };
  const falha = await avaliarEscopo(entrada, { cliente: semRede, redigirTexto: redatorFalso, registrar: async () => {} });
  assert.equal(falha.acao, 'revisar', 'Jev fora do ar → revisar, nunca liberar');

  const incompleto = criarClienteFalso(() => ({ fora_do_escopo: { noul: 0.1 } }));
  const parcial = await avaliarEscopo(entrada, { cliente: incompleto, redigirTexto: redatorFalso, registrar: async () => {} });
  assert.equal(parcial.acao, 'revisar', 'pergunta sem resposta → revisar');

  const vazio = criarClienteFalso(() => respostasEscopo(0, 0));
  const semMudanca = await avaliarEscopo({ ...entrada, mudancas: '' }, { cliente: vazio, redigirTexto: redatorFalso });
  assert.equal(semMudanca.acao, 'liberar');
  assert.equal(vazio.pedidos.length, 0, 'diff vazio não chama o Jev');
  const semDescricao = await avaliarEscopo({ ...entrada, descricao: '' }, { cliente: vazio });
  assert.equal(semDescricao.acao, 'revisar', 'sem descrição → revisar');
}

/**
 * Confere que segredo é mascarado antes do envio e não aparece no log (INV-2).
 * @returns {Promise<void>}
 */
async function testarMascaraELog() {
  const cliente = criarClienteFalso(() => ({ ...respostasEscopo(0.1, 0.1), ...respostasAceite([0.9]) }));
  const auditoria = criarAuditoriaMemoria();
  const dependencias = { cliente, redigirTexto: redatorFalso, registrar: auditoria.registrar };
  await avaliarEscopo({
    descricao: `Usar a chave ${SEGREDO_FALSO} no teste`, arquivosPrevistos: PREVISTOS,
    mudancas: NAME_STATUS(DENTRO), resumo: `chave ${SEGREDO_FALSO}`, alvo: `T-${SEGREDO_FALSO}`,
  }, dependencias);
  await avaliarAceite({
    criterios: [`Não vazar ${SEGREDO_FALSO}`], evidencia: { resumo: SEGREDO_FALSO, arquivos: [] },
    alvo: 'T.1',
  }, dependencias);

  const enviado = JSON.stringify(cliente.pedidos);
  const registrado = JSON.stringify(auditoria.linhas);
  assert.ok(!enviado.includes(SEGREDO_FALSO), 'segredo bruto enviado ao Jev');
  assert.ok(!registrado.includes(SEGREDO_FALSO), 'segredo bruto no log');
  assert.ok(enviado.includes('[SEGREDO]'), 'a máscara deveria estar no pedido');
  assert.equal(auditoria.linhas.length, 2);
  assert.ok(auditoria.linhas.every((linha) => linha.achados_mascarados >= 1));
  assert.ok(auditoria.linhas.every((linha) => !('state' in linha) && !('descricao' in linha)));
}

/**
 * Confere o parser de `git diff --name-status`.
 * @returns {void}
 */
function testarParserDoDiff() {
  const lista = interpretarMudancas('M\ta.js\nR100\tb.js\tc.js\n\nA\td.js\n');
  assert.deepEqual(lista.map((m) => m.caminho), ['a.js', 'c.js', 'd.js']);
  assert.deepEqual(interpretarMudancas(''), []);
}

/**
 * Executa todos os grupos de teste e imprime o resumo.
 * @returns {Promise<void>}
 */
async function principal() {
  for (const caso of CASOS_ESCOPO) await rodarCasoEscopo(caso);
  for (const caso of CASOS_ACEITE) await rodarCasoAceite(caso);
  await testarFalhasDoEscopo();
  await testarMascaraELog();
  testarParserDoDiff();
  console.log(`ok: ${CASOS_ESCOPO.length} casos de escopo, ${CASOS_ACEITE.length} de aceite, `
    + 'falhas do Jev, máscara/log e parser do diff.');
}

principal().catch((erro) => {
  console.error(erro.stack ?? erro.message);
  process.exitCode = 1;
});
