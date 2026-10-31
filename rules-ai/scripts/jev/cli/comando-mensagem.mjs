// Subcomando `mensagem`: classifica a mensagem do usuário (nível, effort, modelos elegíveis e
// alertas). Lê `--texto "..."` ou a entrada padrão. `--dry-run` não chama o Jev: mostra o `state`
// mascarado e as perguntas. Sai sempre com 0, exceto argumento inválido (1). O Jev só aconselha
// (INV-5): nada aqui escreve no quadro, reserva tarefa ou bloqueia a mensagem.
import { basename } from 'node:path';
import { carregarConfiguracao, carregarConfiguracaoMensagem } from '../config.mjs';
import { classificarMensagem, montarContexto } from '../mensagem/classificar.mjs';
import { prepararPedido } from '../mensagem/estado.mjs';
import { ehMensagemTrivial } from '../mensagem/limite.mjs';
import { lerTexto } from './argumentos.mjs';
import { CODIGOS_SAIDA, imprimir } from './saida.mjs';

const MODELO_PADRAO_DRY_RUN = 'jev-1.13.0';
const TOKENS_PADRAO_DRY_RUN = 2000;
const OPCOES_COM_VALOR = ['texto', 'projeto'];

/**
 * Confere que as opções com valor receberam um valor.
 * @param {Record<string, string|true>} opcoes Opções lidas.
 * @returns {void}
 * @throws {Error} Se `--texto` ou `--projeto` vier sem valor.
 */
function validarOpcoes(opcoes) {
  for (const nome of OPCOES_COM_VALOR) {
    if (opcoes[nome] === true) throw new Error(`--${nome} precisa de um valor.`);
  }
}

/**
 * Lê a entrada padrão inteira (vazio se for terminal interativo).
 * @returns {Promise<string>} Texto recebido.
 */
async function lerEntradaPadrao() {
  if (process.stdin.isTTY) return '';
  const partes = [];
  for await (const parte of process.stdin) partes.push(parte);
  return Buffer.concat(partes).toString('utf8');
}

/**
 * Obtém o texto da mensagem: `--texto` ou a entrada padrão.
 * @param {Record<string, string|true>} opcoes Opções lidas.
 * @returns {Promise<string>} Texto bruto.
 */
async function obterTexto(opcoes) {
  const informado = lerTexto(opcoes, 'texto');
  return informado ?? lerEntradaPadrao();
}

/**
 * Orçamento do dry-run: lê o modelo e o teto da configuração; se estiver inválida, usa o padrão.
 * @returns {{modelo: string, maximoTokens: number}} Modelo e teto de tokens.
 */
function lerOrcamento() {
  try {
    return {
      modelo: carregarConfiguracao().modelo,
      maximoTokens: carregarConfiguracaoMensagem().maximoTokensMensagem,
    };
  } catch {
    return { modelo: MODELO_PADRAO_DRY_RUN, maximoTokens: TOKENS_PADRAO_DRY_RUN };
  }
}

/**
 * Dry-run: imprime o `state` mascarado e as perguntas, sem chamar o Jev e sem auditoria.
 * @param {{texto: string, projeto: string, json: boolean}} entrada Mensagem e formato.
 * @returns {void}
 */
function mostrarDryRun(entrada) {
  const trivial = ehMensagemTrivial(entrada.texto);
  const pedido = trivial ? null : prepararPedido(entrada, lerOrcamento());
  const objeto = {
    pulado: trivial,
    state: pedido?.state ?? null,
    perguntas: pedido?.perguntas ?? null,
    segredos_mascarados: pedido?.achados ?? {},
  };
  const texto = trivial
    ? 'Mensagem pulada (até 3 caracteres ou começa com "/"): nenhuma chamada ao Jev.'
    : `state (mascarado):\n${JSON.stringify(objeto.state, null, 2)}\n\nperguntas:\n`
      + `${JSON.stringify(objeto.perguntas, null, 2)}\n\n(dry-run: o Jev não foi chamado)`;
  imprimir({ json: entrada.json, objeto, texto });
}

/**
 * Monta a saída em texto do resultado: o contexto da IA, ou o motivo de ter pulado.
 * @param {object} resultado Resultado de classificarMensagem.
 * @returns {string} Texto para o terminal.
 */
function montarTexto(resultado) {
  if (resultado.pulado) return `Mensagem pulada (${resultado.motivo}): nenhuma chamada ao Jev.`;
  return `${montarContexto(resultado)}\n(decisão: ${resultado.decisao}; revisar: `
    + `${resultado.revisar}; custo US$ ${resultado.custo_usd.toFixed(6)}; `
    + `${resultado.latencia_ms} ms)`;
}

/**
 * Executa o subcomando.
 * @param {{opcoes: Record<string, string|true>}} argumentos Argumentos lidos.
 * @returns {Promise<number>} Código de saída (0; argumento inválido lança e a CLI devolve 1).
 * @throws {Error} Argumento inválido (`--texto` ou `--projeto` sem valor).
 */
export async function executarMensagem({ opcoes }) {
  validarOpcoes(opcoes);
  const texto = await obterTexto(opcoes);
  const projeto = lerTexto(opcoes, 'projeto', basename(process.cwd()));
  const json = Boolean(opcoes.json);
  if (opcoes['dry-run']) {
    mostrarDryRun({ texto, projeto, json });
    return CODIGOS_SAIDA.OK;
  }
  const resultado = await classificarMensagem({ texto, projeto });
  imprimir({ json, objeto: resultado, texto: montarTexto(resultado) });
  return CODIGOS_SAIDA.OK;
}
