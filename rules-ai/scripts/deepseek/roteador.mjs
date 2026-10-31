// Roteador de modelo DeepSeek por nível (INTEGRACAO-DEEPSEEK.3, R1, R2, R3, R5, R6).
//   LEVE   -> deepseek-flash (sem raciocínio, effort low da C21)
//   MEDIO  -> deepseek-flash com raciocínio
//   PESADO -> NÃO usa a API sem liberação do usuário (R6): { usar: false, motivo }
// Em qualquer falha (erro do cliente, modo off, teto diário estourado, auditoria ilegível) devolve
// { usar: false, motivo } e a sessão segue com o modelo da matriz: nunca lança e nunca bloqueia
// (R3, INV-2). Limites (off, tokens, dia, tempo) vêm só de limites.mjs. Cada chamada tentada
// deixa uma linha na auditoria, sem o texto (R5). O nível vem do quadro e nunca é alterado aqui
// (INV-3).
import { chamarDeepseek } from './cliente.mjs';
import { estimarCusto, registrarChamada, somarCustoDoDia } from './auditoria.mjs';
import {
  limitarTempo,
  lerLimites,
  passouDoTetoDeTokens,
  passouDoTetoDiario,
} from './limites.mjs';

const MODELO_FLASH = 'deepseek-flash';
const NIVEL_LEVE = 'LEVE';
const NIVEL_MEDIO = 'MEDIO';
const NIVEL_PESADO = 'PESADO';
const ROTAS = Object.freeze({
  [NIVEL_LEVE]: Object.freeze({ modelo: MODELO_FLASH, raciocinio: false }),
  [NIVEL_MEDIO]: Object.freeze({ modelo: MODELO_FLASH, raciocinio: true }),
});

export const MOTIVOS = Object.freeze({
  PESADO_SEM_LIBERACAO: 'pesado-sem-liberacao',
  NIVEL_INVALIDO: 'nivel-invalido',
  DESLIGADO: 'desligado',
  LIMITE_DIARIO: 'limite-diario',
  LIMITE_TOKENS: 'limite-tokens',
  TEMPO: 'timeout',
  AUDITORIA_ILEGIVEL: 'auditoria-ilegivel',
  ERRO_INTERNO: 'erro-interno',
});

export const ACOES = Object.freeze({
  USADA: 'usada',
  FALLBACK: 'fallback',
  BLOQUEADA: 'bloqueada',
});

/**
 * Monta o resultado "não usar a DeepSeek": a sessão segue com o modelo da matriz.
 * @param {string} motivo Código curto do motivo.
 * @returns {{usar: false, motivo: string}} Resultado de fallback.
 */
function semDeepseek(motivo) {
  return { usar: false, motivo };
}

/**
 * Normaliza o nível recebido (caixa e espaços).
 * @param {unknown} nivel Nível informado.
 * @returns {string} Nível em maiúsculas, ou texto vazio.
 */
function normalizarNivel(nivel) {
  return typeof nivel === 'string' ? nivel.trim().toUpperCase() : '';
}

/**
 * Grava a auditoria de uma chamada que não foi feita ou falhou (sem texto).
 * @param {{nivel: string, rota?: object, acao: string, motivo: string}} dados Dados da tentativa.
 * @param {object} opcoesAuditoria Pasta e relógio da auditoria.
 * @returns {Promise<boolean>} true se a linha foi gravada.
 */
function auditarSemUso(dados, opcoesAuditoria) {
  const { nivel, rota, acao, motivo } = dados;
  const registro = { nivel, modelo: rota?.modelo, raciocinio: rota?.raciocinio, acao, motivo };
  return registrarChamada(registro, opcoesAuditoria);
}

/**
 * Confere as barreiras antes de chamar a API: nível, modo `off`, teto de tokens por chamada e
 * teto de custo do dia (limites lidos só em limites.mjs).
 * @param {{nivel: string, mensagens: object[]}} pedido Nível normalizado e mensagens.
 * @param {object} opcoes Ambiente e opções da auditoria.
 * @returns {Promise<{motivo: string, acao: string}|null>} Barreira encontrada, ou null se livre.
 */
async function acharBarreira(pedido, opcoes) {
  const { nivel, mensagens } = pedido;
  if (nivel === NIVEL_PESADO) {
    return { motivo: MOTIVOS.PESADO_SEM_LIBERACAO, acao: ACOES.BLOQUEADA };
  }
  if (!ROTAS[nivel]) return { motivo: MOTIVOS.NIVEL_INVALIDO, acao: ACOES.BLOQUEADA };

  const limites = lerLimites(opcoes.ambiente);
  if (limites.desligada) return { motivo: MOTIVOS.DESLIGADO, acao: ACOES.FALLBACK };
  if (passouDoTetoDeTokens(mensagens, limites.maxTokens)) {
    return { motivo: MOTIVOS.LIMITE_TOKENS, acao: ACOES.BLOQUEADA };
  }
  const gastoHoje = await somarCustoDoDia(opcoes.auditoria);
  if (gastoHoje === null) return { motivo: MOTIVOS.AUDITORIA_ILEGIVEL, acao: ACOES.BLOQUEADA };
  const estourou = passouDoTetoDiario(gastoHoje, limites.tetoDiarioUsd);
  return estourou ? { motivo: MOTIVOS.LIMITE_DIARIO, acao: ACOES.BLOQUEADA } : null;
}

/**
 * Registra o sucesso de uma chamada e monta o resultado para quem chamou.
 * @param {{nivel: string, rota: object, resposta: object}} dados Dados da chamada concluída.
 * @param {object} opcoesAuditoria Pasta e relógio da auditoria.
 * @returns {Promise<object>} Resultado `{ usar: true, ... }`.
 */
async function concluirComSucesso(dados, opcoesAuditoria) {
  const { nivel, rota, resposta } = dados;
  const { tokensEntrada, tokensSaida } = resposta.uso;
  await registrarChamada(
    { nivel, ...rota, tokensEntrada, tokensSaida, acao: ACOES.USADA },
    opcoesAuditoria,
  );
  return {
    usar: true,
    texto: resposta.texto,
    modelo: resposta.modelo,
    raciocinio: rota.raciocinio,
    uso: resposta.uso,
    custoUsd: estimarCusto(tokensEntrada, tokensSaida),
    achados: resposta.achados,
  };
}

/**
 * Executa a rota do nível: chama o cliente e audita o resultado.
 * @param {{nivel: string, mensagens: object[]}} pedido Nível já normalizado e mensagens.
 * @param {object} opcoes Ambiente, `fetch` e opções da auditoria.
 * @returns {Promise<object>} Resultado de {@link rotearChamada}.
 */
async function executarRota(pedido, opcoes) {
  const { nivel, mensagens } = pedido;
  const rota = ROTAS[nivel];
  const clienteOpcoes = { ambiente: opcoes.ambiente, fetchImpl: opcoes.fetchImpl };
  const resposta = await chamarDeepseek({ ...rota, mensagens }, clienteOpcoes);
  if (resposta.ok) return concluirComSucesso({ nivel, rota, resposta }, opcoes.auditoria);

  const motivo = resposta.erro.tipo;
  await auditarSemUso({ nivel, rota, acao: ACOES.FALLBACK, motivo }, opcoes.auditoria);
  return semDeepseek(motivo);
}

/**
 * Faz a rota inteira (barreiras, chamada e auditoria) sem nunca lançar exceção.
 * @param {{nivel: string, mensagens: object[]}} pedido Pedido recebido.
 * @param {object} opcoes Opções já completas (ambiente definido).
 * @returns {Promise<object>} Resultado de {@link rotearChamada}.
 */
async function rotearComSeguranca(pedido, opcoes) {
  try {
    const nivel = normalizarNivel(pedido?.nivel);
    const barreira = await acharBarreira({ nivel, mensagens: pedido?.mensagens }, opcoes);
    if (barreira) {
      await auditarSemUso({ nivel, rota: ROTAS[nivel], ...barreira }, opcoes.auditoria);
      return semDeepseek(barreira.motivo);
    }
    return await executarRota({ nivel, mensagens: pedido.mensagens }, opcoes);
  } catch {
    return semDeepseek(MOTIVOS.ERRO_INTERNO);
  }
}

/**
 * Escolhe o modelo DeepSeek pelo nível e faz a chamada. NUNCA lança e nunca bloqueia: em
 * qualquer falha devolve `{ usar: false, motivo }` e a sessão segue com o modelo da matriz.
 * @param {{nivel: string, mensagens: {role: string, content: string}[]}} pedido Nível da
 *   subtarefa (vem do quadro) e as mensagens a enviar.
 * @param {{ambiente?: Record<string, string|undefined>, fetchImpl?: Function,
 *   auditoria?: {diretorio?: string, agora?: Date}}} [opcoes] Ambiente, `fetch` e auditoria
 *   injetáveis (padrão: `process.env`, `fetch` global e `scripts/deepseek/saidas/`).
 * @returns {Promise<{usar: true, texto: string, modelo: string, raciocinio: boolean,
 *   uso: object, custoUsd: number, achados: object}|{usar: false, motivo: string}>} Resposta da
 *   DeepSeek, ou o motivo para seguir com a matriz.
 */
export async function rotearChamada(pedido, opcoes = {}) {
  const ambiente = opcoes?.ambiente ?? process.env;
  const opcoesCompletas = { ...opcoes, ambiente };
  const { tempoMaximoMs } = lerLimites(ambiente);
  const falhaPorTempo = semDeepseek(MOTIVOS.TEMPO);
  const operacao = rotearComSeguranca(pedido, opcoesCompletas);
  return limitarTempo(operacao, { tempoMaximoMs, aoFalhar: falhaPorTempo });
}
