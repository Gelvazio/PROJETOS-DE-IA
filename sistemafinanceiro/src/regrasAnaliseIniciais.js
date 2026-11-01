// ============================================================================
// REGRAS DE ANÁLISE INICIAIS - valores de partida e montagem do prompt do CFO
// O dono edita tudo isso no modal "Regras de Análise Iniciais"; o que ele salva
// vai para a tabela novos_negocios e passa a valer em toda análise e reanálise.
// ============================================================================

export const PARAMETROS_ANALISE_INICIAIS = {
  horasSemanaMax: 10,
  investimentoMax: 3000,
  retornoMaxMeses: 12,
  regras: [
    'Calcular 3 cenários (pessimista, base e otimista) com investimento inicial, custo ' +
      'mensal, receita mensal e meses até o ponto de equilíbrio. Valores em R$.',
    'Considerar que o dono tem poucas horas por semana e capital limitado (usar os ' +
      'parâmetros acima).',
    'Recomendar pivotar ou matar se, no cenário base, o investimento passar do máximo ou o ' +
      'retorno passar do prazo aceitável.',
    'Listar cada premissa com a confiança [Certeza], [Provável], [Chute] ou [CONFIRMAR]. ' +
      'Nunca inventar número.',
    'Nunca apresentar projeção sem o cenário pessimista.',
    'Apontar riscos jurídicos e de compliance e o que confirmar antes de gastar.',
    'Fechar com recomendação (seguir, pivotar ou matar), nota de 0 a 10 e 3 próximos ' +
      'passos baratos.',
  ].join('\n'),
};

/**
 * @typedef {object} ParametrosAnalise
 * @property {number|null} horasSemanaMax - Horas por semana disponíveis.
 * @property {number|null} investimentoMax - Investimento inicial máximo, em R$.
 * @property {number|null} retornoMaxMeses - Retorno aceitável, em meses.
 * @property {string} regras - Regras de análise (uma por linha).
 */

/**
 * Formata um número do parâmetro, ou "não informado".
 * @param {number|null} valor - Valor numérico.
 * @param {string} unidade - Unidade exibida após o número.
 * @returns {string} Texto pronto para o prompt.
 */
function formatarParametro(valor, unidade) {
  const informado = valor !== null && valor !== undefined && !Number.isNaN(valor);
  return informado ? `${valor.toLocaleString('pt-BR')} ${unidade}` : 'não informado';
}

/**
 * Monta o prompt que a IA (CFO) deve seguir ao analisar ou reanalisar a ideia.
 * @param {{codigo: string, nome: string, tempoAGastar: string, valorAGastar: string,
 *   analiseRetorno: string, tempoRetorno: string}} ideia - Ideia analisada.
 * @param {ParametrosAnalise} parametros - Parâmetros e regras editados pelo dono.
 * @returns {string} Prompt completo.
 */
export function montarPromptAnalise(ideia, parametros) {
  return [
    `Você é o CFO (Finanças e Viabilidade). Analise a ${ideia.codigo} — ${ideia.nome}.`,
    '',
    'Dados da ideia:',
    `- Tempo a gastar: ${ideia.tempoAGastar}`,
    `- Valor a gastar: ${ideia.valorAGastar}`,
    `- Análise de retorno: ${ideia.analiseRetorno}`,
    `- Tempo de retorno: ${ideia.tempoRetorno}`,
    '',
    'Parâmetros do dono:',
    `- Horas por semana disponíveis: ${formatarParametro(parametros.horasSemanaMax, 'h')}`,
    `- Investimento inicial máximo: ${formatarParametro(parametros.investimentoMax, 'R$')}`,
    `- Retorno máximo aceitável: ${formatarParametro(parametros.retornoMaxMeses, 'meses')}`,
    '',
    'Regras de análise (obrigatórias):',
    parametros.regras.trim() || '(nenhuma regra informada)',
    '',
    `Grave a análise em Markdown em docs/analises/ANALISE-FINANCEIRA-${ideia.codigo}.md.`,
  ].join('\n');
}
