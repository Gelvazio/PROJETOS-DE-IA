// Subcomando `guardrail <caso>`: roda um dos 6 guardrails (escopo, aceite, segredo, pasta,
// comando, aprovacao). Sem chave, a camada determinística continua valendo e o resultado ambíguo
// vira `revisar` (nunca `liberar` em silêncio, INV-6). Entrada: `--entrada '<json>'` ou
// `--entrada @arquivo.json`, mais atalhos por caso. Código de saída: 0 liberar/avisar, 3 revisar,
// 4 bloquear.
import { readFileSync } from 'node:fs';
import { criarClientePadrao } from '../cliente.mjs';
import { avaliarAceite } from '../guardrails/aceite.mjs';
import { avaliarAprovacao } from '../guardrails/aprovacao.mjs';
import { avaliarComando } from '../guardrails/comando-destrutivo.mjs';
import { avaliarEscopo, lerMudancasGit } from '../guardrails/escopo.mjs';
import { avaliarPastaProibida } from '../guardrails/pasta-proibida.mjs';
import { avaliarSegredo } from '../guardrails/segredo.mjs';
import { lerLista, lerTexto } from './argumentos.mjs';
import { CODIGOS_SAIDA, imprimir, montarTabela } from './saida.mjs';

const CODIGO_POR_ACAO = Object.freeze({ revisar: CODIGOS_SAIDA.REVISAR,
  bloquear: CODIGOS_SAIDA.BLOQUEAR });
const SEPARADOR_CRITERIOS = ';';

/**
 * Cria o cliente do Jev para os guardrails de escopo/aceite; sem chave, devolve undefined.
 * @returns {object|undefined} Cliente ou undefined.
 */
function criarClienteOpcional() {
  try {
    return criarClientePadrao();
  } catch {
    return undefined;
  }
}

/**
 * Lê o JSON de `--entrada` (texto direto ou `@arquivo`).
 * @param {Record<string, string|true>} opcoes Opções.
 * @returns {object} Entrada base (vazia se não houver `--entrada`).
 * @throws {Error} Se o JSON for inválido.
 */
function lerEntradaBase(opcoes) {
  const bruto = lerTexto(opcoes, 'entrada');
  if (!bruto) return {};

  const texto = bruto.startsWith('@') ? readFileSync(bruto.slice(1), 'utf8') : bruto;
  try {
    return JSON.parse(texto);
  } catch {
    throw new Error('--entrada precisa ser um JSON válido (ou @arquivo.json).');
  }
}

/**
 * Cada caso: monta a entrada (base + atalhos) e chama o guardrail.
 * Atalhos: `--texto`, `--comando`, `--mensagem`, `--pergunta-pendente`, `--caminhos a,b`,
 * `--descricao`, `--arquivos-previstos a,b`, `--criterios "a;b"`. Escopo sem `mudancas` lê o
 * `git diff --name-status` do diretório atual.
 */
const CASOS = Object.freeze({
  segredo: (e, o) => avaliarSegredo({ ...e, texto: lerTexto(o, 'texto', e.texto) }),
  pasta: (e, o) => avaliarPastaProibida({ ...e, caminhos: lerLista(o, 'caminhos') ?? e.caminhos,
    texto: lerTexto(o, 'texto', e.texto) }),
  comando: (e, o) => avaliarComando({ ...e, comando: lerTexto(o, 'comando', e.comando) }),
  aprovacao: (e, o) => avaliarAprovacao({ ...e, mensagem: lerTexto(o, 'mensagem', e.mensagem),
    perguntaPendente: lerTexto(o, 'pergunta-pendente', e.perguntaPendente) }),
  escopo: async (e, o) => {
    const mudancas = e.mudancas ?? await lerMudancasGit();
    return avaliarEscopo({ ...e, mudancas, descricao: lerTexto(o, 'descricao', e.descricao),
      arquivosPrevistos: lerLista(o, 'arquivos-previstos') ?? e.arquivosPrevistos },
    { cliente: criarClienteOpcional() });
  },
  aceite: (e, o) => avaliarAceite({ ...e,
    criterios: lerTexto(o, 'criterios')?.split(SEPARADOR_CRITERIOS).map((c) => c.trim())
      .filter(Boolean) ?? e.criterios }, { cliente: criarClienteOpcional() }),
});

/**
 * Monta o texto de saída do resultado de um guardrail.
 * @param {string} caso Nome do caso.
 * @param {object} resultado Resultado do guardrail.
 * @returns {string} Tabela Markdown com ação e motivos.
 */
function montarTexto(caso, resultado) {
  const motivos = (resultado.motivos ?? []).join('; ');
  return montarTabela(['Guardrail', 'Ação', 'Motivos'], [[caso, resultado.acao, motivos]]);
}

/**
 * Executa o subcomando.
 * @param {{posicionais: string[], opcoes: Record<string, string|true>}} argumentos Argumentos.
 * @returns {Promise<number>} Código de saída (0, 3 revisar ou 4 bloquear).
 * @throws {Error} Se o caso for desconhecido ou a entrada inválida.
 */
export async function executarGuardrail({ posicionais, opcoes }) {
  const caso = posicionais[0];
  if (!Object.hasOwn(CASOS, caso ?? '')) {
    const validos = Object.keys(CASOS).join(', ');
    throw new Error(`Guardrail "${caso ?? ''}" desconhecido. Use: ${validos}.`);
  }
  const resultado = await CASOS[caso](lerEntradaBase(opcoes), opcoes);
  imprimir({ json: Boolean(opcoes.json), objeto: resultado, texto: montarTexto(caso, resultado) });
  return CODIGO_POR_ACAO[resultado.acao] ?? CODIGOS_SAIDA.OK;
}
