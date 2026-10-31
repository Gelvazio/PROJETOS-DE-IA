// Teste de invariante INV-4 (e R2.1–R2.3): as mesmas respostas do Jev geram sempre o mesmo
// nível/effort/modelo; sinal de PESADO nunca rebaixa; effort vem da C21; modelos batem com a
// matriz de regras/niveis-e-modelos.md. Sem rede e sem chave.
// Uso: node scripts/jev/testes/agregacao.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ_RULES_AI } from '../config.mjs';
import { ACOES, agregarRespostas } from '../decidir.mjs';
import {
  EFFORT_POR_NIVEL, EFFORTS, ORDEM_NIVEIS, listarLinhasElegiveis, listarModelosElegiveis,
} from '../modelos.mjs';

const ARQUIVO_MATRIZ = join(RAIZ_RULES_AI, 'regras', 'niveis-e-modelos.md');
const CONFIANCA_ALTA = 0.95;
const SINAL_ALTO = 0.9;
const SINAL_BAIXO = 0.05;
const COLUNA_PRIMEIRA_NIVEL = 1;
let totalConferido = 0;

/**
 * Registra e imprime um caso aprovado.
 * @param {string} nome Descrição do caso.
 * @returns {void}
 */
function aprovado(nome) {
  totalConferido += 1;
  console.log(`ok  ${nome}`);
}

/**
 * Monta respostas do Jev para um caso.
 * @param {{nivel: string|null, effort?: string, confianca?: number, sinais?: object}} caso
 * @returns {object} Campo `answers`.
 */
function montarRespostas(caso) {
  const sinais = { banco: SINAL_BAIXO, segredo: SINAL_BAIXO, massa: SINAL_BAIXO,
    mais_de_3_arquivos: SINAL_BAIXO, ...caso.sinais };
  return {
    nivel: { choice: caso.nivel, confidence: caso.confianca ?? CONFIANCA_ALTA },
    effort: { choice: caso.effort ?? 'medium' },
    risco: { score: 0.4 },
    ...Object.fromEntries(Object.entries(sinais).map(([nome, noul]) => [nome, { noul }])),
  };
}

/**
 * Agrega um caso sintético.
 * @param {object} caso Caso de {@link montarRespostas}.
 * @returns {object} Sugestão.
 */
function agregar(caso) {
  return agregarRespostas({ subtarefa: 'SINTETICA.1', respostas: montarRespostas(caso) });
}

/** R2.1: sinal de PESADO eleva, nunca rebaixa. */
function conferirRegraMaisRestritiva() {
  const leveBanco = agregar({ nivel: 'LEVE', effort: 'low', sinais: { banco: SINAL_ALTO } });
  assert.equal(leveBanco.nivel_final_proposto, 'PESADO');
  assert.equal(leveBanco.nivel_sugerido, 'LEVE');
  assert.equal(leveBanco.acao, ACOES.REVISAR);
  aprovado('R2.1 LEVE + banco 0,9 -> PESADO, revisar');

  const medioSegredo = agregar({ nivel: 'MEDIO', sinais: { segredo: SINAL_ALTO } });
  assert.equal(medioSegredo.nivel_final_proposto, 'PESADO');
  assert.equal(medioSegredo.acao, ACOES.REVISAR);
  aprovado('R2.1 MEDIO + segredo 0,9 -> PESADO, revisar');

  const pesadoLimpo = agregar({ nivel: 'PESADO', effort: 'high' });
  assert.equal(pesadoLimpo.nivel_final_proposto, 'PESADO');
  assert.equal(pesadoLimpo.acao, ACOES.AUTOMATICA);
  aprovado('R2.1 PESADO sem sinal continua PESADO (nunca rebaixa)');

  const sinalNoLimite = agregar({ nivel: 'MEDIO', sinais: { massa: 0.5 } });
  assert.equal(sinalNoLimite.nivel_final_proposto, 'PESADO');
  const sinalAbaixo = agregar({ nivel: 'MEDIO', sinais: { massa: 0.49 } });
  assert.equal(sinalAbaixo.nivel_final_proposto, 'MEDIO');
  aprovado('R2.1 limiar do sinal: 0,50 eleva, 0,49 não');
}

/** R2.2: 3 níveis × 3 sugestões de effort do Jev; o effort final é sempre o da C21. */
function conferirEffortDaC21() {
  for (const nivel of ORDEM_NIVEIS) {
    for (const effortJev of EFFORTS) {
      const sugestao = agregar({ nivel, effort: effortJev });
      assert.equal(sugestao.effort_final_proposto, EFFORT_POR_NIVEL[nivel]);
      const diverge = effortJev !== EFFORT_POR_NIVEL[nivel];
      assert.equal(sugestao.acao === ACOES.REVISAR, diverge, `${nivel}/${effortJev}`);
      assert.equal(sugestao.effort_sugerido_jev, effortJev);
    }
  }
  aprovado('R2.2 3 níveis x 3 efforts: effort final = C21; divergência vira revisar');
}

/**
 * Lê as linhas da tabela "Quem pega cada nível" do niveis-e-modelos.md.
 * @returns {{linha: string, celulas: string[]}[]} Linhas com as 3 células de nível.
 */
function lerMatrizDoMarkdown() {
  const linhas = readFileSync(ARQUIVO_MATRIZ, 'utf8').split(/\r?\n/);
  const inicio = linhas.findIndex((l) => /^\|\s*Ferramenta\s*\|/.test(l));
  assert.ok(inicio >= 0, 'tabela "Quem pega cada nível" não encontrada');
  const corpo = [];
  for (const linha of linhas.slice(inicio + 2)) {
    if (!linha.startsWith('|')) break;
    const celulas = linha.split('|').slice(1, -1).map((c) => c.replace(/\*\*/g, '').trim());
    corpo.push({ linha: celulas[0], celulas: celulas.slice(COLUNA_PRIMEIRA_NIVEL) });
  }
  return corpo;
}

/** R2.3: a lista de modelos por nível confere com a matriz do Markdown. */
function conferirModelosComAMatriz() {
  const matriz = lerMatrizDoMarkdown();
  ORDEM_NIVEIS.forEach((nivel, posicao) => {
    const esperadas = matriz.filter((m) => !m.celulas[posicao].includes('⛔')).map((m) => m.linha);
    assert.deepEqual(listarLinhasElegiveis(nivel).sort(), esperadas.sort(), `matriz ${nivel}`);
    assert.ok(listarModelosElegiveis(nivel).length >= esperadas.length);
  });
  assert.deepEqual(listarModelosElegiveis('INVALIDO'), []);
  aprovado('R2.3 modelos elegíveis de LEVE/MEDIO/PESADO conferem com niveis-e-modelos.md');
}

/** INV-4: mesmas respostas (mesmo em outra ordem de chaves) dão o mesmo resultado. */
function conferirDeterminismo() {
  const respostas = montarRespostas({ nivel: 'MEDIO', sinais: { banco: 0.7 } });
  const invertidas = Object.fromEntries(Object.entries(respostas).reverse());
  const primeira = agregarRespostas({ subtarefa: 'X.1', respostas });
  const segunda = agregarRespostas({ subtarefa: 'X.1', respostas: invertidas });
  const terceira = agregarRespostas({ subtarefa: 'X.1', respostas: structuredClone(respostas) });
  assert.deepEqual(primeira, segunda);
  assert.deepEqual(primeira, terceira);
  assert.equal(JSON.stringify(primeira), JSON.stringify(terceira));
  aprovado('INV-4 mesmas respostas -> mesmo nível/effort/modelo (10 repetições)');
  for (let i = 0; i < 10; i += 1) {
    assert.deepEqual(agregarRespostas({ subtarefa: 'X.1', respostas }), primeira);
  }
}

/** Confiança: limiares 0,80 / 0,60 e cálculo pelas probabilidades. */
function conferirConfianca() {
  assert.equal(agregar({ nivel: 'MEDIO', confianca: 0.8 }).acao, ACOES.AUTOMATICA);
  assert.equal(agregar({ nivel: 'MEDIO', confianca: 0.79 }).acao, ACOES.REVISAR);
  assert.equal(agregar({ nivel: 'MEDIO', confianca: 0.6 }).acao, ACOES.REVISAR);
  assert.equal(agregar({ nivel: 'MEDIO', confianca: 0.59 }).acao, ACOES.HUMANO);
  aprovado('confiança: >=0,80 automática; 0,60–0,80 revisar; <0,60 humano');

  const probabilities = { LEVE: 0.05, MEDIO: 0.8, PESADO: 0.15 };
  const respostas = { nivel: { choice: 'MEDIO', probabilities } };
  const calculada = agregarRespostas({ subtarefa: 'C.1', respostas });
  assert.equal(calculada.fonte_confianca, 'calculada');
  assert.equal(calculada.confianca, 0.7);
  aprovado('confiança calculada por (p_max − 1/n)/(1 − 1/n) quando não vem `confidence`');
}

/** Bordas: sem `answers`, nível fora das opções, valores inválidos (INV-6: nunca automática). */
function conferirBordas() {
  const vazio = agregarRespostas({ subtarefa: 'B.1', respostas: undefined });
  assert.equal(vazio.nivel_final_proposto, null);
  assert.equal(vazio.effort_final_proposto, null);
  assert.deepEqual(vazio.modelos_elegiveis, []);
  assert.equal(vazio.acao, ACOES.HUMANO);

  const foraDasOpcoes = agregar({ nivel: 'GIGANTE' });
  assert.equal(foraDasOpcoes.nivel_final_proposto, null);
  assert.equal(foraDasOpcoes.acao, ACOES.HUMANO);

  const semNivelComSinal = agregar({ nivel: null, sinais: { segredo: SINAL_ALTO } });
  assert.equal(semNivelComSinal.nivel_final_proposto, 'PESADO');

  const lixo = agregarRespostas({ subtarefa: 'B.2', respostas: { nivel: { choice: 'MEDIO',
    confidence: 'alta' }, banco: { noul: 'sim' } } });
  assert.equal(lixo.acao, ACOES.HUMANO);
  assert.equal(lixo.sinais.banco, null);
  aprovado('bordas: estado vazio, nível inválido, valores não numéricos -> nunca automática');
}

conferirRegraMaisRestritiva();
conferirEffortDaC21();
conferirModelosComAMatriz();
conferirDeterminismo();
conferirConfianca();
conferirBordas();
console.log(`\nagregacao: ${totalConferido} grupos de casos aprovados.`);
