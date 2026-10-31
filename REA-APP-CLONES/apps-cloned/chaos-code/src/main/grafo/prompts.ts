/**
 * Textos dos prompts do grafo, copiados na íntegra do inventário
 * (`docs/inventario/prompts-agentes.md`, seção 1). Os furos `{...}` viram funções de montagem.
 */

/** Mensagem de sistema do pedido de variações da consulta. */
export const PROMPT_VARIACOES_CONSULTA_SISTEMA =
  'Você é um assistente que gera variações de consultas de busca. ' +
  'Responda APENAS com JSON válido.';

/** Mensagem de sistema da resposta hipotética (HyDE). */
export const PROMPT_RESPOSTA_HIPOTETICA_SISTEMA =
  'Você é um assistente que gera respostas hipotéticas ' + 'para consultas de busca.';

/** Mensagem de sistema da reordenação de documentos. */
export const PROMPT_REORDENACAO_SISTEMA =
  'Você é um avaliador de relevância de documentos. Responda APENAS com JSON válido.';

/** Texto de comunidade sem entidades, usado no resumo sem LLM. */
export const TEXTO_COMUNIDADE_SEM_ENTIDADES = 'Comunidade sem entidades.';

/**
 * Monta o pedido de variações de uma consulta de busca.
 * @param {{consulta: string, quantidade: number}} dados - Consulta original e quantas variações.
 * @returns {string} Texto do pedido ao LLM.
 */
export function montarPromptVariacoesConsulta({
  consulta,
  quantidade,
}: {
  consulta: string;
  quantidade: number;
}): string {
  return [
    `Dada a consulta original: "${consulta}"`,
    `Gere ${quantidade} variações alternativas que capturem diferentes ângulos da mesma busca.`,
    'Cada variação deve usar sinônimos ou reformulações diferentes.',
    'Responda APENAS JSON: {"queries": ["variação 1", "variação 2", ...]}',
  ].join('\n');
}

/**
 * Monta o pedido de resposta hipotética (HyDE) para uma pergunta.
 * @param {string} pergunta - Pergunta do usuário.
 * @returns {string} Texto do pedido ao LLM.
 */
export function montarPromptRespostaHipotetica(pergunta: string): string {
  return [
    `Dada a pergunta: "${pergunta}"`,
    'Escreva um parágrafo (3-5 frases) que seria a resposta ideal para essa pergunta.',
    'O parágrafo deve conter termos técnicos relevantes e ser informativo.',
    'Responda APENAS com o parágrafo, sem formatação adicional.',
  ].join('\n');
}

/**
 * Monta o pedido de reordenação por relevância.
 * @param {{consulta: string, documentos: string}} dados - Consulta e lista de documentos.
 * @returns {string} Texto do pedido ao LLM.
 */
export function montarPromptReordenacao({
  consulta,
  documentos,
}: {
  consulta: string;
  documentos: string;
}): string {
  return [
    `Dada a consulta: "${consulta}"`,
    'Avalie a relevância de cada documento (0-10):',
    documentos,
    'Responda APENAS JSON: {"scores": [7, 3, 9, ...]}',
  ].join('\n');
}

/**
 * Monta o pedido de extração de entidades e relações. O texto do trecho vai no fim, depois de
 * "TEXTO A ANALISAR:". O inventário não mostra o fechamento do bloco de código, então ele não
 * é acrescentado aqui.
 * @param {string} texto - Trecho do documento a analisar.
 * @returns {string} Texto do pedido ao LLM.
 */
export function montarPromptExtracaoEntidades(texto: string): string {
  return [
    'Analise o texto abaixo e extraia TODAS as entidades e relações mencionadas. ' +
      'Retorne APENAS um JSON válido no formato:',
    '',
    '{',
    '  "entities": [',
    '    {"name": "...", ' +
      '"type": "person|organization|concept|technology|location|event|process|metric|other", ' +
      '"description": "...", "aliases": []}',
    '  ],',
    '  "relations": [',
    '    {"source": "nome_entidade_A", "target": "nome_entidade_B", ' +
      '"type": "uses|causes|part_of|created_by|depends_on|implements|extends|contains|produces|' +
      'related_to|other", "description": "..."}',
    '  ]',
    '}',
    '',
    'REGRAS OBRIGATÓRIAS:',
    '- Extraia TODAS as entidades mencionadas (pessoas, organizações, conceitos, ' +
      'tecnologias, localizações, eventos, processos, métricas)',
    '- Classifique cada entidade no tipo mais específico possível',
    '- Para relações, use o tipo semântico mais preciso (uses, causes, part_of, etc.)',
    '- Não invente informações — baseie-se APENAS no texto fornecido',
    '- Se não houver entidades ou relações, retorne arrays vazios',
    '- Retorne APENAS o JSON, sem texto adicional antes ou depois',
    '',
    'TEXTO A ANALISAR:',
    '```',
    texto,
  ].join('\n');
}

/**
 * Monta a frase de comunidade com entidades, sem LLM.
 * @param {string} entidades - Nomes das entidades do grupo, separados por vírgula.
 * @returns {string} Frase de descrição do grupo.
 */
export function montarTextoComunidadeComEntidades(entidades: string): string {
  return `Grupo temático contendo: ${entidades}.`;
}

/**
 * Monta o resumo de uma comunidade, sem LLM.
 * @param {{nivel: number, resumo: string, membros: string}} dados - Nível, resumo e membros.
 * @returns {string} Linha de resumo do grupo.
 */
export function montarResumoComunidade({
  nivel,
  resumo,
  membros,
}: {
  nivel: number;
  resumo: string;
  membros: string;
}): string {
  return `Grupo temático [${nivel}]: ${resumo} (Membros: ${membros})`;
}
