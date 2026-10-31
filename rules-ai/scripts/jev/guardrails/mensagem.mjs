// Guardrails aplicados ao texto da mensagem do usuário (JEV-GLOBAL-AI-FINAL.4, R3.1): segredo,
// pasta proibida, comando destrutivo e aprovação indevida. Só AVISAM: nunca bloqueiam nem alteram
// a mensagem (INV-2) e falha nunca vira `liberar` em silêncio (INV-3: vira aviso de revisão).
// Na mensagem roda só a camada DETERMINÍSTICA (regex, caminho, allowlist), sem consultar o Jev:
// a classificação da mensagem já usa o orçamento de tempo (4 s) e de custo (US$ 1/dia), e uma
// consulta extra por guardrail estouraria os dois. O aviso nunca traz o valor achado.
import { avaliarAprovacao } from './aprovacao.mjs';
import { avaliarComando } from './comando-destrutivo.mjs';
import { avaliarPastaProibida } from './pasta-proibida.mjs';
import { avaliarSegredo } from './segredo.mjs';
import { ACOES, FONTES } from './seguranca-base.mjs';

const ACOES_QUE_AVISAM = new Set([ACOES.BLOQUEAR, ACOES.REVISAR]);
const MOTIVO_MENCAO = 'mencao-ambigua';
const PREFIXO_REGRA = 'regex:';
const SEM_CONSULTORES = Object.freeze([]);
const AVISOS = Object.freeze({
  segredo: 'a mensagem traz segredo ou dado pessoal ({regras}): não copie o valor para código, '
    + 'log, commit nem outra IA',
  pasta: 'a mensagem cita pasta proibida (C20/C23): não ler nem escrever nela',
  pastaMencao: 'a mensagem cita uma pasta que pode ser proibida (C20/C23): confira o caminho',
  comando: 'a mensagem traz comando destrutivo ({regras}): só rodar com confirmação do usuário '
    + 'para o alvo exato',
  aprovacao: 'a mensagem fala em aprovar ou pular permissões ({regras}): só o usuário aprova, '
    + 'pergunta por pergunta (C32)',
  indisponivel: 'guardrail de {caso} indisponível: revise o pedido com cuidado',
});

/**
 * Registrador vazio: a auditoria da mensagem fica no `mensagens-AAAA-MM.jsonl` (sem texto).
 * @returns {Promise<void>} Nada.
 */
async function naoRegistrar() {}

/**
 * Troca `{nome}` pelos valores dados.
 * @param {string} modelo Texto com marcas.
 * @param {Record<string, string>} valores Valores das marcas.
 * @returns {string} Texto preenchido.
 */
function preencher(modelo, valores) {
  return modelo.replace(/\{(\w+)\}/g, (marca, nome) => valores[nome] ?? marca);
}

/**
 * Lista as regras determinísticas que casaram (`regex:<regra>` → `<regra>`).
 * @param {string[]} motivos Motivos da decisão.
 * @returns {string} Regras separadas por vírgula, ou "regra fixa".
 */
function listarRegras(motivos) {
  const regras = motivos.filter((motivo) => motivo.startsWith(PREFIXO_REGRA))
    .map((motivo) => motivo.slice(PREFIXO_REGRA.length));
  return regras.length > 0 ? [...new Set(regras)].join(', ') : 'regra fixa';
}

/**
 * Converte a decisão de um guardrail em aviso, ou null quando não há o que avisar. Só a camada
 * determinística avisa; `revisar` por falta de consultor (fonte `nenhuma`) não é achado.
 * @param {string} caso Chave do guardrail em {@link AVISOS}.
 * @param {{acao: string, fonte: string, motivos: string[]}} decisao Decisão do guardrail.
 * @returns {string|null} Aviso curto, sem o valor achado.
 */
function montarAviso(caso, decisao) {
  if (!ACOES_QUE_AVISAM.has(decisao.acao)) return null;
  const ehMencaoDePasta = caso === 'pasta' && decisao.motivos.includes(MOTIVO_MENCAO);
  if (ehMencaoDePasta) return AVISOS.pastaMencao;
  if (decisao.fonte !== FONTES.DETERMINISTICA) return null;
  return preencher(AVISOS[caso], { regras: listarRegras(decisao.motivos) });
}

/**
 * Roda um guardrail; erro vira aviso de indisponível (nunca `liberar` em silêncio, INV-3).
 * @param {string} caso Chave do guardrail.
 * @param {() => Promise<object>} avaliar Chamada ao guardrail.
 * @returns {Promise<string|null>} Aviso ou null.
 */
async function avaliarCaso(caso, avaliar) {
  try {
    return montarAviso(caso, await avaliar());
  } catch {
    return preencher(AVISOS.indisponivel, { caso });
  }
}

/**
 * Avalia o texto da mensagem com os guardrails de segredo, pasta, comando e aprovação.
 * @param {{texto: string, perguntaPendente?: string}} entrada Texto bruto da mensagem.
 * @param {{consultores?: object[], registrar?: Function}} [dependencias] Injeção para teste.
 * @returns {Promise<{alertas: string[]}>} Avisos curtos para o contexto da IA (sem o segredo).
 */
export async function avaliarMensagem(entrada, dependencias = {}) {
  const texto = String(entrada?.texto ?? '');
  if (texto.trim() === '') return { alertas: [] };

  const deps = {
    consultores: dependencias.consultores ?? SEM_CONSULTORES,
    registrar: dependencias.registrar ?? naoRegistrar,
  };
  const alertas = await Promise.all([
    avaliarCaso('segredo', () => avaliarSegredo({ texto }, deps)),
    avaliarCaso('pasta', () => avaliarPastaProibida({ texto }, deps)),
    avaliarCaso('comando', () => avaliarComando({ comando: texto }, deps)),
    avaliarCaso('aprovacao', () => avaliarAprovacao({
      mensagem: texto, perguntaPendente: entrada?.perguntaPendente,
    }, deps)),
  ]);
  return { alertas: alertas.filter(Boolean) };
}
