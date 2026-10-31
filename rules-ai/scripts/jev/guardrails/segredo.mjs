// Guardrail de segredo/PII (R3.2, INV-2). Camada 1 (determinística): qualquer achado do
// `redigir.mjs` (chave/token/senha, CPF, RG, telefone, e-mail pessoal) → `bloquear` sem chamar o
// Jev (e-mails técnicos, como noreply@, não contam). Camada 2, para o que a regex não pega
// (endereço, data de nascimento, senha sem dígito): o Jev vê SÓ o texto mascarado e responde um
// `noul` por tipo; p ≥ 0,80 → `bloquear`; 0,50–0,80 → `revisar`; senão `liberar`; sem Jev →
// `revisar`. O log nunca guarda o texto nem o valor achado (só tipos, probabilidade e hash).
// Escape humano: `confirmacaoHumana.alvo` = `hashEntrada` devolvido no bloqueio.
import {
  ACOES, FONTES, aplicarEscape, calcularHash, concluirDecisao, confirmacaoValida, consultar,
  maiorProbabilidade, montarDependencias, prepararTexto,
} from './seguranca-base.mjs';
import { resumirAchados } from './redigir.mjs';

const CASO = 'segredo';
const ACAO_JEV = 'guardrail:segredo';
const LIMIAR_BLOQUEIO = 0.8;
const LIMIAR_REVISAO = 0.5;
const ORIENTACAO_BLOQUEIO = 'Remova o segredo/dado pessoal do texto (ou use a versão mascarada). '
  + 'Só o usuário libera: confirmacaoHumana { confirmado: true, quem, alvo: hashEntrada }.';
const MARCAS_EXPLICADAS = 'As marcas [CHAVE], [CPF], [RG], [EMAIL] e [TELEFONE] substituem '
  + 'valores já mascarados: julgue o que sobrou e o contexto das marcas.';
const PERGUNTAS = {
  chave_token: {
    type: 'noul',
    instructions: 'O texto ainda expõe chave, token, senha ou credencial real? '
      + MARCAS_EXPLICADAS,
    criteria: { true: 'há credencial real exposta', false: 'não há credencial exposta' },
  },
  documento_pessoal: {
    type: 'noul',
    instructions: 'O texto expõe documento ou dado pessoal de alguém (CPF, RG, endereço '
      + 'residencial, data de nascimento), inclusive por marca junto de um nome? '
      + MARCAS_EXPLICADAS,
    criteria: { true: 'expõe dado pessoal', false: 'não expõe dado pessoal' },
  },
  contato_pessoal: {
    type: 'noul',
    instructions: 'O texto expõe contato particular de uma pessoa (e-mail ou telefone), '
      + `inclusive por marca junto de um nome? ${MARCAS_EXPLICADAS}`,
    criteria: { true: 'expõe contato pessoal', false: 'não expõe contato pessoal' },
  },
};

/**
 * Decide pelo Jev quando a camada determinística não achou nada.
 * @param {object} consulta Resultado de `consultar`.
 * @returns {object} Parte da decisão (ação, motivos, fonte, probabilidade).
 */
function decidirPeloJev(consulta) {
  if (!consulta.respostas) {
    return { acao: ACOES.REVISAR, motivos: ['jev-indisponivel'], fonte: FONTES.NENHUMA,
      exigeConfirmacao: true };
  }
  const probabilidade = maiorProbabilidade(consulta.respostas, PERGUNTAS);
  const base = { fonte: consulta.fonte, probabilidade };
  if (probabilidade === null) {
    return { ...base, acao: ACOES.REVISAR, motivos: ['jev-sem-probabilidade'],
      exigeConfirmacao: true };
  }
  if (probabilidade >= LIMIAR_BLOQUEIO) {
    return { ...base, acao: ACOES.BLOQUEAR, motivos: ['jev:p>=0.80'], exigeConfirmacao: true };
  }
  if (probabilidade >= LIMIAR_REVISAO) {
    return { ...base, acao: ACOES.REVISAR, motivos: ['jev:p>=0.50'], exigeConfirmacao: true };
  }
  return { ...base, acao: ACOES.LIBERAR, motivos: ['jev:p<0.50'] };
}

/**
 * Aplica as duas camadas e devolve a decisão e a consulta feita (se houve).
 * @param {string} textoOriginal Texto avaliado.
 * @param {{texto: string, achados: object[]}} preparado Texto mascarado e achados.
 * @param {{consultores: object[]}} deps Dependências.
 * @returns {Promise<{decisao: object, consulta: object|null}>} Decisão parcial e consulta.
 */
async function decidir(textoOriginal, preparado, deps) {
  if (textoOriginal.trim() === '') {
    return { decisao: { acao: ACOES.LIBERAR, motivos: ['texto-vazio'],
      fonte: FONTES.DETERMINISTICA }, consulta: null };
  }
  if (preparado.achados.length > 0) {
    const motivos = [...new Set(preparado.achados.map((achado) => `regex:${achado.regra}`))];
    return { decisao: { acao: ACOES.BLOQUEAR, motivos, fonte: FONTES.DETERMINISTICA,
      exigeConfirmacao: true }, consulta: null };
  }
  const consulta = await consultar({
    state: { texto: preparado.texto, marcas: resumirAchados(preparado.achados) },
    perguntas: PERGUNTAS, acao: ACAO_JEV,
  }, deps.consultores);
  return { decisao: decidirPeloJev(consulta), consulta };
}

/**
 * Avalia se um texto pode sair (para a API, um log, um commit ou outra IA).
 * @param {{texto: string, confirmacaoHumana?: object}} entrada Texto e confirmação opcional.
 * @param {{consultores?: object[], registrar?: Function}} [dependencias] Injeção para teste.
 * @returns {Promise<Readonly<object>>} `{caso, acao, motivos, achados (contagem por tipo),
 *   probabilidade, limiar, fonte, exigeConfirmacao, escapeHumano, hashEntrada, orientacao}`.
 */
export async function avaliarSegredo(entrada, dependencias = {}) {
  const deps = montarDependencias(dependencias);
  const textoOriginal = String(entrada?.texto ?? '');
  const hashEntrada = calcularHash(textoOriginal);
  const preparado = prepararTexto(textoOriginal);
  const { decisao, consulta } = await decidir(textoOriginal, preparado, deps);
  const completa = {
    caso: CASO, achados: preparado.achados, hashEntrada, limiar: LIMIAR_BLOQUEIO,
    orientacao: decisao.acao === ACOES.LIBERAR ? null : ORIENTACAO_BLOQUEIO, ...decisao,
  };
  const confirmado = confirmacaoValida(entrada?.confirmacaoHumana, (alvo) => alvo === hashEntrada);
  return concluirDecisao(aplicarEscape(completa, confirmado), {
    consulta, registrar: deps.registrar,
  });
}
