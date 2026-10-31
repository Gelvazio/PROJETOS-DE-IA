// Canal de Broadcast + estado inicial pelo GitHub raw (MIGRAR-AGENTES-BROADCAST.3).
// Uso: iniciarCanal({ aoEstado, aoAviso }); aoEstado recebe o evento 'estado' do canal.
import { CANAL, HOSTS_LOCAIS } from '../config.js';
import { lerQuadro } from './quadro.js';

const CAMPOS_ENVELOPE = Object.freeze(['versao', 'projeto', 'atualizado_em', 'atraso_padrao',
  'intervalo', 'commit', 'publicado_em', 'sequencia', 'tarefas']);
const CAMPOS_TAREFA = Object.freeze(['tarefa', 'titulo', 'pai', 'mae', 'nivel', 'status',
  'agente', 'desde', 'progresso', 'global', 'indice']);
const CAMPOS_TEXTO_TAREFA = Object.freeze(['tarefa', 'titulo', 'pai', 'nivel', 'status',
  'agente', 'desde']);
const CAMPOS_TEXTO_ENVELOPE = Object.freeze(['atualizado_em', 'publicado_em']);
const CAMPOS_INTEIROS = Object.freeze(['atraso_padrao', 'intervalo']);
const LIMITE_TEXTO = 500;
const PADRAO_COMMIT = /^[0-9a-f]{40}$/i;

/** Só chaves permitidas: uma chave extra reprova o objeto inteiro. */
function soChavesPermitidas(objeto, permitidas) {
  return Object.keys(objeto).every((chave) => permitidas.includes(chave));
}

/** Texto curto, ou ausente (null/undefined). */
function textoValido(valor) {
  return valor === undefined || valor === null
    || (typeof valor === 'string' && valor.length <= LIMITE_TEXTO);
}

/** Inteiro, ou ausente (null/undefined). */
function inteiroOpcional(valor) {
  return valor === undefined || valor === null || Number.isInteger(valor);
}

/** Tarefa com só os 11 campos do contrato, nos tipos certos. */
function tarefaValida(tarefa) {
  if (!tarefa || typeof tarefa !== 'object' || Array.isArray(tarefa)) return false;
  return soChavesPermitidas(tarefa, CAMPOS_TAREFA)
    && CAMPOS_TEXTO_TAREFA.every((campo) => textoValido(tarefa[campo]))
    && typeof tarefa.mae === 'boolean' && typeof tarefa.global === 'boolean'
    && inteiroOpcional(tarefa.progresso) && inteiroOpcional(tarefa.indice);
}

/** Envelope: versão, projeto, chaves permitidas, tipos e commit de 40 hexadecimais. */
function envelopeValido(carga) {
  return carga.versao === CANAL.versaoContrato
    && carga.projeto === CANAL.projeto
    && soChavesPermitidas(carga, CAMPOS_ENVELOPE)
    && Number.isInteger(carga.sequencia)
    && CAMPOS_INTEIROS.every((campo) => inteiroOpcional(carga[campo]))
    && CAMPOS_TEXTO_ENVELOPE.every((campo) => textoValido(carga[campo]))
    && typeof carga.commit === 'string' && PADRAO_COMMIT.test(carga.commit);
}

/** Mensagem do canal aceita? Qualquer falha descarta em silêncio (sem expor o conteúdo). */
function mensagemValida(carga, ultimaSequencia) {
  if (!carga || typeof carga !== 'object' || Array.isArray(carga)) return false;
  if (!envelopeValido(carga) || carga.sequencia <= ultimaSequencia) return false;
  return Array.isArray(carga.tarefas) && carga.tarefas.every(tarefaValida);
}

/** Endereços do quadro, em ordem: o arquivo local (só em host local) e depois o GitHub raw. */
function urlsDoQuadro() {
  const estaEmHostLocal = HOSTS_LOCAIS.includes(globalThis.location?.hostname);
  return estaEmHostLocal ? [CANAL.urlQuadroLocal, CANAL.urlQuadro] : [CANAL.urlQuadro];
}

/** Baixa um endereço; devolve o texto ou null se a resposta não for válida. */
async function baixarTexto(url) {
  try {
    const resposta = await fetch(url, { cache: 'no-store' });
    return resposta.ok ? await resposta.text() : null;
  } catch {
    return null;
  }
}

/** Texto do STATUS.md vindo da primeira origem que responder. */
async function lerTextoDoQuadro() {
  for (const url of urlsDoQuadro()) {
    const texto = await baixarTexto(url);
    if (texto !== null) return texto;
  }
  throw new Error('Quadro indisponível (arquivo local e GitHub raw)');
}

/** Estado inicial lido do STATUS.md (local ou GitHub), no formato da mensagem (sequência 0). */
export async function lerEstadoInicial() {
  const { tarefas } = lerQuadro(await lerTextoDoQuadro());
  return { versao: CANAL.versaoContrato, projeto: CANAL.projeto, sequencia: 0, tarefas };
}

async function assinar(aoMensagem, aoAviso, aoConexao) {
  const { createClient } = await import(CANAL.urlCliente);
  const cliente = createClient(CANAL.url, CANAL.chavePublicavel);
  cliente
    .channel(`quadro:${CANAL.projeto}`)
    .on('broadcast', { event: CANAL.evento }, (m) => aoMensagem(m.payload))
    .subscribe((situacao) => {
      aoConexao(situacao === 'SUBSCRIBED');
      if (situacao !== 'SUBSCRIBED') aoAviso(`Canal: ${situacao}`);
    });
  return cliente;
}

/**
 * Relê o estado completo depois de uma reconexão. Não toca na sequência e descarta a leitura se
 * chegou mensagem do canal enquanto ela estava a caminho (o estado do canal é mais novo).
 */
async function reler(estado, aoEstado, aoAviso) {
  const geracao = estado.geracao;
  try {
    const completo = await lerEstadoInicial();
    if (geracao === estado.geracao) aoEstado(completo);
  } catch (erro) {
    aoAviso(`Releitura do estado indisponível: ${erro.message}`);
  }
}

/**
 * Entrega o estado inicial (ou usa `inicial`, já lido) e, havendo chave publicável, aplica cada
 * mensagem do canal com `sequencia` maior que a última. Ao voltar de uma queda, relê o estado.
 * Falha em qualquer etapa vira aviso; nunca lança.
 * @returns {Promise<object|null>} Cliente do Supabase, ou null sem chave/sem canal.
 */
export async function iniciarCanal({
  aoEstado, aoAviso = () => {}, aoConexao = () => {}, inicial = null,
}) {
  const estado = { ultima: 0, geracao: 0, caiu: false };
  if (!inicial) {
    try {
      aoEstado(await lerEstadoInicial());
    } catch (erro) {
      aoAviso(`Estado inicial indisponível: ${erro.message}`);
    }
  }
  if (!CANAL.chavePublicavel) return null;
  const aplicar = (carga) => {
    if (!mensagemValida(carga, estado.ultima)) return;
    estado.ultima = carga.sequencia;
    estado.geracao += 1;
    aoEstado(carga);
  };
  const conexao = (conectado) => {
    if (conectado && estado.caiu) reler(estado, aoEstado, aoAviso);
    estado.caiu = !conectado;
    aoConexao(conectado);
  };
  try {
    return await assinar(aplicar, aoAviso, conexao);
  } catch (erro) {
    aoAviso(`Canal indisponível: ${erro.message}`);
    return null;
  }
}
