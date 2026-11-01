// ============================================================================
// PARÂMETROS DE ANÁLISE - leitura e gravação na tabela novos_negocios (Supabase)
// ============================================================================
import { supabase, getCurrentUser } from './supabaseClient.js';

const TABELA = 'novos_negocios';
const CONFLITO = 'usuario_id,projeto_id';

/**
 * Converte a linha do banco no formato usado pela tela.
 * @param {object} linha - Linha da tabela novos_negocios.
 * @returns {object} Parâmetros e prompt salvos.
 */
function converterLinha(linha) {
  return {
    horasSemanaMax: linha.horas_semana_max === null ? null : Number(linha.horas_semana_max),
    investimentoMax: linha.investimento_max === null ? null : Number(linha.investimento_max),
    retornoMaxMeses: linha.retorno_max_meses,
    regras: linha.regras_analise,
    prompt: linha.prompt_analise,
  };
}

/**
 * Carrega os parâmetros salvos de um projeto (ideia).
 * @param {string} projetoId - Código da ideia (ex.: "IDEIA 01").
 * @returns {Promise<object|null>} Parâmetros salvos, ou null se ainda não existem.
 * @throws {Error} Se a consulta falhar.
 */
export async function carregarParametros(projetoId) {
  const { data, error } = await supabase
    .from(TABELA)
    .select('*')
    .eq('projeto_id', projetoId)
    .maybeSingle();
  if (error) throw error;
  return data ? converterLinha(data) : null;
}

/**
 * Salva (cria ou atualiza) os parâmetros e o prompt de um projeto.
 * @param {{projetoId: string, nome: string, parametros: object, prompt: string}} dados - Dados.
 * @returns {Promise<void>}
 * @throws {Error} Se não houver usuário logado ou a gravação falhar.
 */
export async function salvarParametros({ projetoId, nome, parametros, prompt }) {
  const usuario = await getCurrentUser().catch(() => null);
  if (!usuario) throw new Error('Faça login para salvar os parâmetros.');

  const { error } = await supabase.from(TABELA).upsert({
    usuario_id: usuario.id,
    projeto_id: projetoId,
    nome,
    horas_semana_max: parametros.horasSemanaMax,
    investimento_max: parametros.investimentoMax,
    retorno_max_meses: parametros.retornoMaxMeses,
    regras_analise: parametros.regras,
    prompt_analise: prompt,
    prompt_atualizado_em: new Date().toISOString(),
  }, { onConflict: CONFLITO });
  if (error) throw error;
}
