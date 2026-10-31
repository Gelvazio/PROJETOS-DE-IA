// Guardrail de critérios de aceite: um `noul` por critério (até 8) sobre a evidência da entrega.
// Todos com p ≥ 0,80 → liberar; algum com p < 0,50 → revisar; senão avisar. Teste que falhou
// nunca é ignorado (no mínimo `revisar`). Só avisa: nunca declara aceite nem bloqueia.
// A nota composta (média e mínimo) é calculada aqui no código, não pelo Jev.
import {
  ACOES, auditar, conferirDependencias, consultarJev, lerProbabilidade, mascarar, maisGrave,
  obterRedator,
} from './avisos.mjs';

export const CASO_ACEITE = 'aceite';
export const MAXIMO_CRITERIOS = 8;
export const LIMIAR_LIBERAR = 0.8;
export const LIMIAR_REVISAR = 0.5;

/**
 * Monta a pergunta `noul` de um critério já mascarado.
 * @param {string} criterio Texto do critério (mascarado).
 * @returns {object} Pergunta no formato do Jev.
 */
function criarPergunta(criterio) {
  return {
    type: 'noul',
    instructions: 'Pela evidência da entrega (resumo, arquivos e testes), este critério de '
      + `aceite foi atendido? Critério: ${criterio}`,
    criteria: { true: 'critério atendido', false: 'critério não atendido ou sem evidência' },
  };
}

/**
 * Calcula a nota composta dos critérios.
 * @param {Array<number|null>} probabilidades Probabilidade de cada critério (null = sem resposta).
 * @returns {{media: number, minimo: number}} Média e mínimo (sem resposta conta como 0).
 */
export function calcularNota(probabilidades) {
  if (probabilidades.length === 0) return { media: 0, minimo: 0 };
  const valores = probabilidades.map((valor) => valor ?? 0);
  const soma = valores.reduce((total, valor) => total + valor, 0);
  return { media: soma / valores.length, minimo: Math.min(...valores) };
}

/**
 * Aplica a regra de agregação às probabilidades por critério.
 * @param {Array<number|null>} probabilidades Probabilidade de cada critério (null = sem resposta).
 * @returns {string} `liberar`, `avisar` ou `revisar`.
 */
export function agregarCriterios(probabilidades) {
  if (probabilidades.length === 0) return ACOES.AVISAR;
  if (probabilidades.some((valor) => valor === null)) return ACOES.REVISAR;
  if (probabilidades.some((valor) => valor < LIMIAR_REVISAR)) return ACOES.REVISAR;
  const todosAtendidos = probabilidades.every((valor) => valor >= LIMIAR_LIBERAR);
  return todosAtendidos ? ACOES.LIBERAR : ACOES.AVISAR;
}

/**
 * Valida a entrada mínima do guardrail.
 * @param {object} entrada Entrada recebida.
 * @returns {string|null} Motivo do problema, ou null se estiver válida.
 */
function validarEntrada(entrada) {
  if (!Array.isArray(entrada?.criterios)) return 'critérios de aceite ausentes';
  const temTextoVazio = entrada.criterios.some((c) => typeof c !== 'string' || !c.trim());
  if (temTextoVazio) return 'há critério vazio ou inválido';
  return null;
}

/**
 * Confere a evidência de testes: teste que falhou nunca é ignorado.
 * @param {{testes?: {falharam?: number}}|undefined} evidencia Evidência da entrega.
 * @returns {{falhou: boolean, motivo: string|null}} Se há teste falho e o motivo.
 */
function conferirTestes(evidencia) {
  const falharam = Number(evidencia?.testes?.falharam ?? 0);
  if (!(falharam > 0)) return { falhou: false, motivo: null };
  return { falhou: true, motivo: `${falharam} teste(s) falharam: nunca liberar` };
}

/**
 * Monta state mascarado e perguntas (uma por critério, chaves c1…c8).
 * @param {object} entrada `{criterios, evidencia}` com no máximo 8 critérios.
 * @param {Function} redator Redator `redigirTexto`.
 * @param {{achados: number}} contagem Contador de achados (alterado).
 * @returns {{state: object, perguntas: object}} State e perguntas prontos para o Jev.
 */
function montarPedido(entrada, redator, contagem) {
  const mascararTexto = (texto) => mascarar(texto, redator, contagem);
  const evidencia = entrada.evidencia ?? {};
  const perguntas = {};
  entrada.criterios.forEach((criterio, indice) => {
    perguntas[`c${indice + 1}`] = criarPergunta(mascararTexto(criterio));
  });
  const state = {
    resumo: mascararTexto(evidencia.resumo),
    arquivos: (evidencia.arquivos ?? []).map(mascararTexto),
    testes: mascararTexto(JSON.stringify(evidencia.testes ?? {})),
  };
  return { state, perguntas };
}

/**
 * Decide a ação final juntando as respostas do Jev, o limite de 8 critérios e os testes.
 * @param {{consulta: object, perguntas: object, excedentes: number, testes: object}} dados
 * @returns {object} `{acao, probabilidades, nota, limiar, motivos}`.
 */
function decidir({ consulta, perguntas, excedentes, testes }) {
  const chaves = Object.keys(perguntas);
  const respostas = consulta.resultado?.respostas;
  const probabilidades = chaves.map((chave) => lerProbabilidade(respostas, chave));
  const motivos = [];
  let acao = agregarCriterios(probabilidades);
  if (consulta.erroCodigo) motivos.push(`Jev indisponível (${consulta.erroCodigo})`);
  if (probabilidades.includes(null)) motivos.push('critério sem resposta válida do Jev');
  if (excedentes > 0) {
    acao = maisGrave(acao, ACOES.AVISAR);
    motivos.push(`${excedentes} critério(s) além do limite de ${MAXIMO_CRITERIOS} não avaliados`);
  }
  if (testes.falhou) {
    acao = maisGrave(acao, ACOES.REVISAR);
    motivos.push(testes.motivo);
  }
  return {
    acao,
    probabilidades: Object.fromEntries(chaves.map((chave, i) => [chave, probabilidades[i]])),
    nota: calcularNota(probabilidades),
    limiar: { liberar: LIMIAR_LIBERAR, revisar: LIMIAR_REVISAR },
    motivos,
  };
}

/**
 * Avalia se a entrega tem evidência para cada critério de aceite. Nunca declara aceite.
 * @param {{criterios: string[], evidencia?: {resumo?: string, arquivos?: string[],
 *   testes?: {passaram?: number, falharam?: number}}, alvo?: string}} entrada Critérios da
 *   etapa e evidência da entrega.
 * @param {{cliente?: object, redigirTexto?: Function, registrar?: Function}} [dependencias]
 *   Cliente do Jev, redator e gravador da auditoria (injetáveis nos testes).
 * @returns {Promise<object>} `{caso, acao, probabilidades, nota, motivos, ...}`.
 */
export async function avaliarAceite(entrada, dependencias = {}) {
  const problema = validarEntrada(entrada);
  if (problema) return { caso: CASO_ACEITE, acao: ACOES.REVISAR, motivos: [problema] };

  const testes = conferirTestes(entrada.evidencia);
  if (entrada.criterios.length === 0) {
    const acao = testes.falhou ? ACOES.REVISAR : ACOES.AVISAR;
    return { caso: CASO_ACEITE, acao, motivos: ['sem critérios de aceite para conferir'] };
  }

  const redator = await obterRedator(dependencias.redigirTexto);
  const faltando = conferirDependencias(CASO_ACEITE, { redator, cliente: dependencias.cliente });
  if (faltando) return faltando;

  const avaliados = entrada.criterios.slice(0, MAXIMO_CRITERIOS);
  const excedentes = entrada.criterios.length - avaliados.length;
  const contagem = { achados: 0 };
  const recorte = { ...entrada, criterios: avaliados };
  const { state, perguntas } = montarPedido(recorte, redator, contagem);
  const consulta = await consultarJev(dependencias.cliente, {
    state, perguntas, acao: 'guardrail-aceite',
  });
  const resultado = { caso: CASO_ACEITE, ...decidir({ consulta, perguntas, excedentes, testes }) };
  resultado.hashInput = await auditar({
    caso: CASO_ACEITE, alvo: mascarar(entrada.alvo, redator, contagem), state, resultado, consulta,
    achados: contagem.achados, registrar: dependencias.registrar,
  });
  return resultado;
}
