// Perguntas fixas da classificação de subtarefa para o Jev (/v1/systemone). As perguntas não
// citam rótulos do quadro: o Jev só vê o `state` cego (estado.mjs).
import { EFFORTS, NIVEIS } from './modelos.mjs';

/** Nomes das perguntas; as chaves de `answers` na resposta do Jev têm estes nomes. */
export const PERGUNTAS = Object.freeze({
  NIVEL: 'nivel',
  EFFORT: 'effort',
  RISCO: 'risco',
  BANCO: 'banco',
  SEGREDO: 'segredo',
  MASSA: 'massa',
  MAIS_DE_3_ARQUIVOS: 'mais_de_3_arquivos',
});

/** Perguntas `noul` cujo "sim" é sinal de PESADO (sinais determinísticos de risco). */
export const SINAIS_PESADO = Object.freeze([
  PERGUNTAS.BANCO, PERGUNTAS.SEGREDO, PERGUNTAS.MASSA, PERGUNTAS.MAIS_DE_3_ARQUIVOS,
]);

export const CRITERIOS_NIVEL = Object.freeze({
  [NIVEIS.LEVE]: 'Só documentação, textos, formatação ou configuração simples, sem lógica '
    + 'de código.',
  [NIVEIS.MEDIO]: 'Código com lógica em 1 a 3 arquivos, sem banco de dados, segurança, chaves '
    + 'nem migração.',
  [NIVEIS.PESADO]: 'Banco de dados, SQL, login/permissões, chaves ou segredos, segurança, '
    + 'arquitetura, mais de 3 arquivos ligados, mudança em massa ou apagar dados.',
});

const CRITERIOS_EFFORT = Object.freeze({
  low: 'tarefa simples e mecânica, pouco raciocínio',
  medium: 'tarefa com lógica moderada, raciocínio normal',
  high: 'tarefa difícil, exige raciocínio profundo e cuidado com riscos',
});

const CRITERIOS_RISCO = Object.freeze([
  'baixo, reversível e isolado',
  'médio, exige conferência antes de encerrar',
  'alto, pode causar perda de dados ou exposição de segredo',
]);

const INSTRUCAO_NIVEL = 'Qual é o nível de esforço e risco desta subtarefa? Considere `titulo`, '
  + '`etapa`, `descricao`, `arquivos` e `criterios`. Use a regra mais restritiva: basta um '
  + 'sinal de PESADO para ser PESADO.';
const INSTRUCAO_EFFORT = 'Qual esforço de raciocínio uma IA precisa para executar esta subtarefa '
  + 'com qualidade?';
const INSTRUCAO_RISCO = 'Qual o risco de a subtarefa quebrar algo se for executada sem revisão?';

/**
 * Monta uma pergunta `noul` (sim/não com probabilidade).
 * @param {string} instrucao Pergunta ao Jev.
 * @param {string} seSim Descrição do "sim".
 * @param {string} seNao Descrição do "não".
 * @returns {object} Pergunta no formato do Jev.
 */
function perguntaSimNao(instrucao, seSim, seNao) {
  return { type: 'noul', instructions: instrucao, criteria: { true: seSim, false: seNao } };
}

/**
 * Monta as 7 perguntas da classificação (nível, effort diagnóstico, risco e 4 sinais de PESADO).
 * @returns {Record<string, object>} Perguntas no formato `questions` do /v1/systemone.
 */
export function montarPerguntas() {
  return {
    [PERGUNTAS.NIVEL]: { type: 'choice', instructions: INSTRUCAO_NIVEL, criteria: CRITERIOS_NIVEL },
    [PERGUNTAS.EFFORT]: {
      type: 'choice',
      instructions: INSTRUCAO_EFFORT,
      criteria: Object.fromEntries(EFFORTS.map((effort) => [effort, CRITERIOS_EFFORT[effort]])),
    },
    [PERGUNTAS.RISCO]: { type: 'score', instructions: INSTRUCAO_RISCO, criteria: CRITERIOS_RISCO },
    [PERGUNTAS.BANCO]: perguntaSimNao(
      'A subtarefa mexe em banco de dados, SQL, RLS, migração ou seeds?',
      'mexe em banco de dados', 'não mexe em banco de dados',
    ),
    [PERGUNTAS.SEGREDO]: perguntaSimNao(
      'A subtarefa lida com chaves, tokens, senhas, login, papéis, permissões ou segurança?',
      'lida com segredo ou segurança', 'não lida com segredo nem segurança',
    ),
    [PERGUNTAS.MASSA]: perguntaSimNao(
      'A subtarefa faz mudança em massa, geração em lote ou apaga dados?',
      'muda ou apaga muita coisa de uma vez', 'não faz mudança em massa nem apaga dados',
    ),
    [PERGUNTAS.MAIS_DE_3_ARQUIVOS]: perguntaSimNao(
      'A subtarefa mexe em mais de 3 arquivos ligados entre si?',
      'mexe em mais de 3 arquivos ligados', 'mexe em até 3 arquivos',
    ),
  };
}
