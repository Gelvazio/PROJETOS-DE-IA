// Perguntas do Jev para a MENSAGEM do usuário (JEV-GLOBAL-AI-FINAL.3): é pedido que muda algo ou
// só pergunta/conversa? qual o nível? e os quatro sinais de PESADO (os mesmos nomes de
// `SINAIS_PESADO`, para a agregação de decidir.mjs valer igual). O Jev só vê o `state` cego.
import { CRITERIOS_NIVEL, PERGUNTAS, SINAIS_PESADO } from '../perguntas.mjs';

/** Nome da pergunta extra da mensagem; as demais reaproveitam os nomes de `PERGUNTAS`. */
export const PERGUNTA_MUDA_ALGO = 'muda_algo';

const INSTRUCAO_MUDA_ALGO = 'A `mensagem` pede para criar, alterar, apagar, corrigir ou executar '
  + 'algo (código, arquivo, configuração, comando)? Pergunta, dúvida ou conversa NÃO muda nada.';
const INSTRUCAO_NIVEL = 'Qual é o nível de esforço e risco do que a `mensagem` pede? Se só '
  + 'pergunta ou conversa, use o nível de quem responderia. Use a regra mais restritiva: basta um '
  + 'sinal de PESADO para ser PESADO.';
const INSTRUCOES_SINAIS = Object.freeze({
  [PERGUNTAS.BANCO]: [
    'A `mensagem` envolve banco de dados, SQL, RLS, migração ou seeds?',
    'envolve banco de dados', 'não envolve banco de dados',
  ],
  [PERGUNTAS.SEGREDO]: [
    'A `mensagem` envolve chaves, tokens, senhas, login, papéis, permissões ou segurança?',
    'envolve segredo ou segurança', 'não envolve segredo nem segurança',
  ],
  [PERGUNTAS.MASSA]: [
    'A `mensagem` pede mudança em massa, geração em lote ou apagar dados?',
    'muda ou apaga muita coisa de uma vez', 'não pede mudança em massa nem apagar dados',
  ],
  [PERGUNTAS.MAIS_DE_3_ARQUIVOS]: [
    'A `mensagem` pede mexer em mais de 3 arquivos ligados entre si?',
    'mexe em mais de 3 arquivos ligados', 'mexe em até 3 arquivos',
  ],
});

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
 * Monta as 6 perguntas da mensagem (muda algo, nível e os 4 sinais de PESADO). O effort não é
 * perguntado: vem do nível final pela C21 (derivarEffort).
 * @returns {Record<string, object>} Perguntas no formato `questions` do /v1/systemone.
 */
export function montarPerguntasMensagem() {
  const sinais = Object.fromEntries(SINAIS_PESADO.map((nome) => [
    nome, perguntaSimNao(...INSTRUCOES_SINAIS[nome]),
  ]));
  return {
    [PERGUNTA_MUDA_ALGO]: perguntaSimNao(
      INSTRUCAO_MUDA_ALGO, 'pede uma mudança ou execução', 'só pergunta ou conversa',
    ),
    [PERGUNTAS.NIVEL]: { type: 'choice', instructions: INSTRUCAO_NIVEL, criteria: CRITERIOS_NIVEL },
    ...sinais,
  };
}
