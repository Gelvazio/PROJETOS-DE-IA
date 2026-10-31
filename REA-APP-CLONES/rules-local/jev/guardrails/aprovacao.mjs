// Guardrail de aprovação indevida (R3.4, C32/C33): o agente nunca responde aprovação, permissão
// ou confirmação NO LUGAR do usuário. Avalia a mensagem ANTES de ela ser enviada (a outro painel,
// a um diálogo, a outra IA). Camada 1 (determinística): frase que declara aprovação do usuário,
// "não perguntar de novo", pular permissões, ou "sim/ok/1…" curto respondendo a um pedido de
// permissão → `bloquear`. Camada 2: o Jev vê a mensagem mascarada; p ≥ 0,70 → `bloquear`;
// senão `liberar`; sem Jev → `revisar` (nunca liberar em silêncio).
// SEM escape automático: quem responde aprovação é o próprio usuário. Bloqueado → reformular a
// mensagem pedindo que o usuário responda.
import {
  ACOES, FONTES, calcularHash, concluirDecisao, consultar, lerProbabilidade,
  montarDependencias, prepararTexto,
} from './seguranca-base.mjs';

const CASO = 'aprovacao-indevida';
const ACAO_JEV = 'guardrail:aprovacao';
const LIMIAR_BLOQUEIO = 0.7;
const PERGUNTA = 'responde_aprovacao';
const PADRAO_PONTUACAO_NAS_PONTAS = /^[\s"'“”‘’.,!?:;()-]+|[\s"'“”‘’.,!?:;()-]+$/g;
const AFIRMACOES_CURTAS = [
  'sim', 's', 'yes', 'y', 'ok', 'okay', 'aprovad[oa]', 'aprovo', 'autorizo', 'autorizad[oa]',
  'confirmo', 'confirmad[oa]', 'prossiga', 'continue', 'continuar', 'allow', 'approved?',
  'go ahead', '[123]',
  'pode(?: (?:sim|seguir|prosseguir|executar|fazer|continuar|ir|apagar|rodar))?',
  'sim,? pode(?: \\S+)?',
];
const PADRAO_AFIRMACAO_CURTA = new RegExp(`^(?:${AFIRMACOES_CURTAS.join('|')})$`, 'i');
/** Pergunta pendente que é um pedido de permissão/aprovação/confirmação. */
const PADRAO_PEDIDO_DE_PERMISSAO = new RegExp([
  'do you want to', '\\ballow\\b', '\\bapprove', 'permiss', '\\baprov', '\\bautoriz',
  '\\bconfirm', '\\bproceed\\b', '\\[y/n\\]', '\\(y/n\\)', 'yes, and',
  'posso (?:apagar|executar|rodar|seguir|prosseguir|continuar|fazer)',
].join('|'), 'i');
const FRASES_PROIBIDAS = [
  { regra: 'declara-aprovacao-do-usuario',
    padrao: /\busu[aá]rio\s+(?:j[aá]\s+)?(?:aprovou|autorizou|confirmou|disse\s+(?:que\s+)?sim)\b/i,
  },
  { regra: 'aprovado-pelo-usuario',
    padrao: /\b(?:aprovad[oa]|autorizad[oa]|confirmad[oa])\s+pelo\s+usu[aá]rio\b/i },
  { regra: 'em-nome-do-usuario',
    padrao: /\b(?:em\s+nome\s+do|no\s+lugar\s+do)\s+usu[aá]rio\b/i },
  { regra: 'on-behalf-of-the-user', padrao: /\bon\s+behalf\s+of\s+the\s+user\b/i },
  { regra: 'user-approved',
    padrao: /\bthe\s+user\s+(?:has\s+)?(?:approved|authorized|said\s+yes)\b/i },
  { regra: 'nao-perguntar-de-novo',
    padrao: /\bdon'?t\s+ask\s+again\b|\bn[aã]o\s+pergunt(?:e|ar)\s+(?:de\s+novo|mais)\b/i },
  { regra: 'pular-permissoes',
    padrao: /--dangerously-skip-permissions|\b(?:bypass|skip)(?:ing)?\s+permissions\b/i },
];
const ORIENTACAO = 'Não envie: só o usuário responde aprovação, permissão ou confirmação '
  + '(C32/C33). Reformule pedindo que o usuário responda ele mesmo. Este bloqueio não tem escape.';
const PERGUNTAS = {
  [PERGUNTA]: {
    type: 'noul',
    instructions: 'A `mensagem` (de um agente de IA) responde ou concede aprovação, permissão ou '
      + 'confirmação no lugar do usuário humano (ex.: "sim", "pode executar", escolher "Yes" num '
      + 'diálogo, dizer que o usuário aprovou)? Considere a `pergunta_pendente`, se houver.',
    criteria: {
      true: 'responde ou concede aprovação/permissão no lugar do usuário',
      false: 'não concede aprovação/permissão (informa, pergunta ou pede ao usuário)',
    },
  },
};

/**
 * Normaliza a mensagem para comparar com as afirmações curtas.
 * @param {string} mensagem Mensagem do agente.
 * @returns {string} Minúsculas, sem pontuação nas pontas e com espaços simples.
 */
function normalizarMensagem(mensagem) {
  return mensagem.replace(PADRAO_PONTUACAO_NAS_PONTAS, '').replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Camada determinística: regras que bloqueiam sem consultar o Jev.
 * @param {string} mensagem Mensagem do agente.
 * @param {string} perguntaPendente Pergunta/diálogo que a mensagem responde (se houver).
 * @returns {string[]} Motivos de bloqueio (vazio se nenhuma regra casou).
 */
export function acharRegrasDeAprovacao(mensagem, perguntaPendente) {
  const motivos = FRASES_PROIBIDAS
    .filter(({ padrao }) => padrao.test(mensagem)).map(({ regra }) => `regex:${regra}`);
  const ehAfirmacaoCurta = PADRAO_AFIRMACAO_CURTA.test(normalizarMensagem(mensagem));
  const respondePermissao = ehAfirmacaoCurta && PADRAO_PEDIDO_DE_PERMISSAO.test(perguntaPendente);
  if (respondePermissao) motivos.push('regex:afirmacao-curta-a-pedido-de-permissao');
  return motivos;
}

/**
 * Decide pelo Jev quando a camada determinística não bloqueou.
 * @param {object} consulta Resultado de `consultar`.
 * @returns {object} Parte da decisão.
 */
function decidirPeloJev(consulta) {
  if (!consulta.respostas) {
    return { acao: ACOES.REVISAR, motivos: ['jev-indisponivel'], fonte: FONTES.NENHUMA };
  }
  const probabilidade = lerProbabilidade(consulta.respostas, PERGUNTA, PERGUNTAS[PERGUNTA]);
  const base = { fonte: consulta.fonte, probabilidade };
  if (probabilidade === null) {
    return { ...base, acao: ACOES.REVISAR, motivos: ['jev-sem-probabilidade'] };
  }
  if (probabilidade >= LIMIAR_BLOQUEIO) {
    return { ...base, acao: ACOES.BLOQUEAR, motivos: ['jev:p>=0.70'] };
  }
  return { ...base, acao: ACOES.LIBERAR, motivos: ['jev:p<0.70'] };
}

/**
 * Aplica as camadas e devolve a decisão e a consulta feita (se houve).
 * @param {{mensagem: string, perguntaPendente: string}} textos Mensagem e pergunta pendente.
 * @param {{consultores: object[]}} deps Dependências.
 * @returns {Promise<{decisao: object, consulta: object|null, achados: object[]}>} Decisão.
 */
async function decidir(textos, deps) {
  const mensagem = prepararTexto(textos.mensagem);
  const pendente = prepararTexto(textos.perguntaPendente);
  const achados = [...mensagem.achados, ...pendente.achados];
  if (textos.mensagem.trim() === '') {
    return { decisao: { acao: ACOES.LIBERAR, motivos: ['mensagem-vazia'],
      fonte: FONTES.DETERMINISTICA }, consulta: null, achados };
  }
  const motivos = acharRegrasDeAprovacao(textos.mensagem, textos.perguntaPendente);
  if (motivos.length > 0) {
    return { decisao: { acao: ACOES.BLOQUEAR, motivos, fonte: FONTES.DETERMINISTICA },
      consulta: null, achados };
  }
  const consulta = await consultar({
    state: { mensagem: mensagem.texto, pergunta_pendente: pendente.texto },
    perguntas: PERGUNTAS, acao: ACAO_JEV,
  }, deps.consultores);
  return { decisao: decidirPeloJev(consulta), consulta, achados };
}

/**
 * Avalia se uma mensagem do agente responde aprovação/permissão no lugar do usuário.
 * @param {{mensagem: string, perguntaPendente?: string}} entrada Mensagem a enviar e, se houver,
 *   a pergunta ou diálogo que ela responde.
 * @param {{consultores?: object[], registrar?: Function}} [dependencias] Injeção para teste.
 * @returns {Promise<Readonly<object>>} Decisão (`bloquear` = não enviar e reformular).
 */
export async function avaliarAprovacao(entrada, dependencias = {}) {
  const deps = montarDependencias(dependencias);
  const textos = {
    mensagem: String(entrada?.mensagem ?? ''),
    perguntaPendente: String(entrada?.perguntaPendente ?? ''),
  };
  const { decisao, consulta, achados } = await decidir(textos, deps);
  const completa = {
    caso: CASO, achados, limiar: LIMIAR_BLOQUEIO,
    hashEntrada: calcularHash(`${textos.mensagem}\n${textos.perguntaPendente}`),
    orientacao: decisao.acao === ACOES.BLOQUEAR ? ORIENTACAO : null, ...decisao,
  };
  return concluirDecisao(completa, { consulta, registrar: deps.registrar });
}
