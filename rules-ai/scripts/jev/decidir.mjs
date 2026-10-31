// Decisão de nível/effort/modelo a partir das respostas do Jev. O Jev só SUGERE o nível: a
// agregação é determinística (INV-4) — sinal de PESADO eleva e nunca rebaixa (R2.1), o effort vem
// da C21 pelo nível final (R2.2) e os modelos vêm da matriz, sem reservar nada (R2.3).
// Somente leitura no quadro (INV-3). Falha do Jev nunca vira "liberar" silencioso (INV-6).
import { ErroJev } from './config.mjs';
import { carregarStateCego, ARQUIVO_QUADRO, lerQuadro, selecionarSubtarefas } from './estado.mjs';
import {
  EFFORTS, NIVEIS, derivarEffort, ehNivelValido, listarModelosElegiveis, maisRestritivo,
} from './modelos.mjs';
import { PERGUNTAS, SINAIS_PESADO, montarPerguntas } from './perguntas.mjs';

/** Limiares de confiança do Jev (fórmula `(p_max − 1/n)/(1 − 1/n)`). */
export const LIMIAR_AUTOMATICO = 0.8;
export const LIMIAR_REVISAR = 0.6;
/** Sinal `noul` a partir do qual a tarefa vira PESADO e vai para revisão. */
export const LIMIAR_SINAL_PESADO = 0.5;
export const ACOES = Object.freeze({
  AUTOMATICA: 'sugestao_automatica', REVISAR: 'revisar', HUMANO: 'humano',
});
const FONTES_CONFIANCA = Object.freeze({
  INFORMADA: 'confidence', CALCULADA: 'calculada', AUSENTE: 'ausente',
});
const CASAS_DECIMAIS = 4;
const CASAS_CUSTO = 9;
const LIMITE_PADRAO_DRY_RUN = 10;

/**
 * Devolve o número se for finito, senão null.
 * @param {unknown} valor Valor lido da resposta.
 * @returns {number|null} Número arredondado ou null.
 */
function numeroOuNulo(valor) {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return null;
  return Number(valor.toFixed(CASAS_DECIMAIS));
}

/**
 * Obtém a confiança do `choice` do nível: a informada (`confidence`) ou a calculada pelas
 * probabilidades, `(p_max − 1/n)/(1 − 1/n)`.
 * @param {object|undefined} respostaNivel Resposta da pergunta `nivel`.
 * @returns {{valor: number|null, fonte: string}} Confiança e de onde veio.
 */
export function extrairConfianca(respostaNivel) {
  const informada = numeroOuNulo(respostaNivel?.confidence);
  if (informada !== null) return { valor: informada, fonte: FONTES_CONFIANCA.INFORMADA };

  const probabilidades = Object.values(respostaNivel?.probabilities ?? {})
    .filter((p) => typeof p === 'number' && Number.isFinite(p));
  if (probabilidades.length < 2) return { valor: null, fonte: FONTES_CONFIANCA.AUSENTE };

  const piso = 1 / probabilidades.length;
  const calculada = (Math.max(...probabilidades) - piso) / (1 - piso);
  return { valor: numeroOuNulo(calculada), fonte: FONTES_CONFIANCA.CALCULADA };
}

/**
 * Lê as probabilidades dos sinais (`noul`) e o risco (`score`) das respostas.
 * @param {Record<string, object>} respostas Campo `answers` do Jev.
 * @returns {Record<string, number|null>} Sinais banco/segredo/massa/mais_de_3_arquivos e risco.
 */
export function lerSinais(respostas) {
  const sinais = Object.fromEntries(
    SINAIS_PESADO.map((nome) => [nome, numeroOuNulo(respostas?.[nome]?.noul)]),
  );
  return { ...sinais, risco: numeroOuNulo(respostas?.[PERGUNTAS.RISCO]?.score) };
}

/**
 * Lista os sinais de PESADO que passaram do limiar.
 * @param {Record<string, number|null>} sinais Sinais lidos.
 * @returns {string[]} Nomes dos sinais acesos.
 */
function listarSinaisAcesos(sinais) {
  return SINAIS_PESADO.filter((nome) => (sinais[nome] ?? 0) >= LIMIAR_SINAL_PESADO);
}

/**
 * Escolhe a ação pela confiança e pelas divergências.
 * @param {{confianca: number|null, precisaRevisar: boolean, nivelFinal: string|null}} dados
 * @returns {string} Um valor de {@link ACOES}.
 */
function escolherAcao({ confianca, precisaRevisar, nivelFinal }) {
  if (nivelFinal === null || confianca === null || confianca < LIMIAR_REVISAR) return ACOES.HUMANO;
  if (precisaRevisar || confianca < LIMIAR_AUTOMATICO) return ACOES.REVISAR;
  return ACOES.AUTOMATICA;
}

/**
 * Monta as frases curtas que explicam a decisão.
 * @param {object} fatos Fatos da decisão (níveis, sinais acesos, effort e confiança).
 * @returns {string[]} Motivos legíveis.
 */
function montarMotivos(fatos) {
  const motivos = [];
  if (fatos.nivelJev === null) motivos.push('Jev sem nível válido');
  if (fatos.acesos.length === 0) motivos.push(`sem sinal de ${NIVEIS.PESADO}`);
  if (fatos.acesos.length > 0) {
    motivos.push(`sinal de ${NIVEIS.PESADO}: ${fatos.acesos.join(', ')}`);
  }
  if (fatos.elevou) motivos.push(`nível elevado de ${fatos.nivelJev} para ${fatos.nivelFinal}`);
  if (fatos.divergeEffort) motivos.push(`effort do Jev (${fatos.effortJev}) difere da C21`);
  if (fatos.confianca === null) motivos.push('confiança ausente');
  else {
    motivos.push(`confiança ${fatos.confianca} (limiares ${LIMIAR_REVISAR}/${LIMIAR_AUTOMATICO})`);
  }
  return motivos;
}

/**
 * Agrega as respostas do Jev numa sugestão (pura e determinística: INV-4).
 * @param {{subtarefa: string, respostas: object, modelo?: string|null, uso?: object,
 *   custoUsd?: number}} entrada Respostas do Jev e metadados da chamada.
 * @returns {object} Sugestão no formato da seção Arquitetura da etapa.
 */
export function agregarRespostas(entrada) {
  const respostas = entrada.respostas ?? {};
  const escolhaNivel = respostas[PERGUNTAS.NIVEL]?.choice;
  const nivelJev = ehNivelValido(escolhaNivel) ? escolhaNivel : null;
  const sinais = lerSinais(respostas);
  const acesos = listarSinaisAcesos(sinais);
  const nivelFinal = maisRestritivo(nivelJev, acesos.length > 0 ? NIVEIS.PESADO : null);
  const effortFinal = derivarEffort(nivelFinal);
  const escolhaEffort = respostas[PERGUNTAS.EFFORT]?.choice;
  const effortJev = EFFORTS.includes(escolhaEffort) ? escolhaEffort : null;
  const confianca = extrairConfianca(respostas[PERGUNTAS.NIVEL]);
  const fatos = {
    nivelJev, nivelFinal, acesos, effortJev, confianca: confianca.valor,
    elevou: nivelJev !== null && nivelFinal !== nivelJev,
    divergeEffort: effortJev !== null && effortJev !== effortFinal,
  };
  const precisaRevisar = fatos.elevou || fatos.divergeEffort || acesos.length > 0;
  return {
    subtarefa: entrada.subtarefa,
    nivel_sugerido: nivelJev,
    nivel_final_proposto: nivelFinal,
    effort_final_proposto: effortFinal,
    modelos_elegiveis: listarModelosElegiveis(nivelFinal),
    confianca: confianca.valor,
    fonte_confianca: confianca.fonte,
    sinais,
    acao: escolherAcao({ confianca: confianca.valor, precisaRevisar, nivelFinal }),
    motivos: montarMotivos(fatos),
    effort_sugerido_jev: effortJev,
    modelo: entrada.modelo ?? null,
    uso: entrada.uso ?? null,
    custo_usd: Number((entrada.custoUsd ?? 0).toFixed(CASAS_CUSTO)),
  };
}

/**
 * Monta a sugestão de falha: sem nível, ação humana, nada liberado (INV-6).
 * @param {string} subtarefa ID da subtarefa.
 * @param {Error} erro Erro da chamada ao Jev.
 * @returns {object} Sugestão com `acao: revisar`, sem nível e com o código do erro.
 */
function montarSugestaoDeFalha(subtarefa, erro) {
  const codigo = erro instanceof ErroJev ? erro.codigo : 'ERRO_INESPERADO';
  return {
    ...agregarRespostas({ subtarefa, respostas: {} }),
    acao: ACOES.REVISAR,
    motivos: [`Jev indisponível (${codigo}); decidir só pelos sinais da skill ou por um humano`],
    erro_codigo: codigo,
  };
}

/**
 * Classifica uma subtarefa: state cego → Jev → agregação. Nunca escreve no quadro.
 * @param {object} item Item do quadro.
 * @param {{cliente: {perguntar: Function}, arquivoQuadro?: string}} contexto Cliente do Jev.
 * @returns {Promise<object>} Sugestão (ou sugestão de falha com `acao: revisar`).
 */
export async function classificarSubtarefa(item, contexto) {
  const state = carregarStateCego(item, contexto.arquivoQuadro);
  try {
    const resultado = await contexto.cliente.perguntar({
      state, perguntas: montarPerguntas(), acao: 'classificar',
    });
    return agregarRespostas({
      subtarefa: item.id,
      respostas: resultado.respostas,
      modelo: resultado.modeloResposta,
      uso: {
        input_tokens: resultado.uso?.tokensEntrada, output_tokens: resultado.uso?.tokensSaida,
      },
      custoUsd: resultado.custoUsd,
    });
  } catch (erro) {
    if (erro instanceof ErroJev && erro.codigo === 'LIMITE_TOKENS') throw erro;
    return montarSugestaoDeFalha(item.id, erro);
  }
}

/**
 * Dry-run: classifica as primeiras subtarefas do quadro e devolve o JSON. Não escreve no quadro,
 * não reserva e não altera nível. (A CLI `scripts/jev.mjs` é da JEV-RULES-AI.6.)
 * @param {{cliente: {perguntar: Function}, limite?: number, arquivoQuadro?: string}} opcoes
 * @returns {Promise<object[]>} Uma sugestão por subtarefa.
 */
export async function executarDryRun(opcoes) {
  const arquivoQuadro = opcoes.arquivoQuadro ?? ARQUIVO_QUADRO;
  const subtarefas = selecionarSubtarefas(lerQuadro(arquivoQuadro), {
    limite: opcoes.limite ?? LIMITE_PADRAO_DRY_RUN, arquivoQuadro,
  });
  const sugestoes = [];
  for (const item of subtarefas) {
    sugestoes.push(await classificarSubtarefa(item, { cliente: opcoes.cliente, arquivoQuadro }));
  }
  return sugestoes;
}
