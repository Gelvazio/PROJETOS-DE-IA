// Gravador do nível pelo Jev (C47, JEV-GRAVA-NIVEL.2): escreve Nível, Modelo, Effort,
// JEV-AI-SUGGESTION e Fonte na seção da etapa e a coluna Modelo do `STATUS.md` (ou o nível e o
// modelo do item no índice simplificado, C55, com o fim de linha do arquivo). Só mexe nesses
// campos (INV-3). Recusa subtarefa reservada, concluída ou já classificada (salvo
// `reclassificar`) e etapa de pasta proibida (C20/C23). Auditoria sem texto em
// `saidas/gravacoes-AAAA-MM.jsonl`.
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { PASTA_SAIDAS } from './config.mjs';
import { estaLivre } from './estado.mjs';
import {
  aplicarNaSecao, aplicarNoQuadro, decidirGravacao, montarModeloDoQuadro, secaoExiste,
  secaoTemNivel,
} from './gravacao.mjs';

export const RECUSAS = Object.freeze({
  OCUPADA: 'subtarefa reservada ou concluída',
  JA_CLASSIFICADA: 'a seção já tem Nível (use --reclassificar, a pedido do usuário)',
  PASTA_PROIBIDA: 'etapa em pasta proibida (C20/C23)',
  SEM_SECAO: 'seção da subtarefa não encontrada na etapa',
  SEM_LINHA: 'linha da subtarefa ou coluna Modelo não encontrada no quadro',
});
const PADRAO_PASTA_PROIBIDA = /DEMAIS-PROJETOS-/i;
const DIGITOS_MES = 2;
const TAMANHO_HASH = 16;

/**
 * Lê um arquivo de texto e guarda o fim de linha para devolver igual.
 * @param {string} arquivo Caminho do arquivo.
 * @returns {{texto: string, fimDeLinha: string}} Texto com `\n` e o fim de linha original.
 */
function lerComFimDeLinha(arquivo) {
  const bruto = readFileSync(arquivo, 'utf8');
  const fimDeLinha = bruto.includes('\r\n') ? '\r\n' : '\n';
  return { texto: bruto.replace(/\r\n/g, '\n'), fimDeLinha };
}

/**
 * Grava uma linha de auditoria do mês (só metadados, nunca o texto).
 * @param {object} dados Subtarefa, níveis, fonte, confiança e se foi dry-run.
 * @param {Date} [agora] Momento.
 * @param {string} [pasta] Pasta das saídas.
 * @returns {void}
 */
export function auditarGravacao(dados, agora = new Date(), pasta = PASTA_SAIDAS) {
  try {
    const mes = String(agora.getMonth() + 1).padStart(DIGITOS_MES, '0');
    const arquivo = join(pasta, `gravacoes-${agora.getFullYear()}-${mes}.jsonl`);
    mkdirSync(dirname(arquivo), { recursive: true });
    const hash = createHash('sha256').update(dados.subtarefa).digest('hex').slice(0, TAMANHO_HASH);
    const linha = { data: agora.toISOString(), hash, ...dados };
    appendFileSync(arquivo, `${JSON.stringify(linha)}\n`, 'utf8');
  } catch {
    // a auditoria nunca derruba a gravação
  }
}

/**
 * Confere as recusas antes de gravar.
 * @param {object} item Item do quadro.
 * @param {{texto: string}} etapa Conteúdo da etapa.
 * @param {boolean} reclassificar Se o usuário pediu para reclassificar.
 * @returns {string|null} Motivo da recusa, ou null se pode gravar.
 */
function conferirRecusas(item, etapa, reclassificar) {
  if (PADRAO_PASTA_PROIBIDA.test(item.etapa?.caminho ?? '')) return RECUSAS.PASTA_PROIBIDA;
  if (!estaLivre(item)) return RECUSAS.OCUPADA;
  if (!secaoExiste(etapa.texto, item.id)) return RECUSAS.SEM_SECAO;
  if (secaoTemNivel(etapa.texto, item.id) && !reclassificar) return RECUSAS.JA_CLASSIFICADA;
  return null;
}

/**
 * Grava (ou só simula) a classificação de uma subtarefa.
 * @param {{item: object, sugestao: object, arquivoQuadro: string}} entrada Dados da subtarefa.
 * @param {{reclassificar?: boolean, simular?: boolean}} [opcoes] `simular` não escreve nada.
 * @returns {{gravado: boolean, recusa: string|null, decisao: object|null}} Resultado.
 */
export function gravarClassificacao(entrada, opcoes = {}) {
  const { item, sugestao, arquivoQuadro } = entrada;
  const arquivoEtapa = item.etapa ? resolve(dirname(arquivoQuadro), item.etapa.caminho) : null;
  if (!arquivoEtapa || !existsSync(arquivoEtapa)) {
    return { gravado: false, recusa: RECUSAS.SEM_SECAO, decisao: null };
  }
  const etapa = lerComFimDeLinha(arquivoEtapa);
  const recusa = conferirRecusas(item, etapa, Boolean(opcoes.reclassificar));
  if (recusa) return { gravado: false, recusa, decisao: null };
  const decisao = decidirGravacao(sugestao);
  const quadro = lerComFimDeLinha(arquivoQuadro);
  const modelo = montarModeloDoQuadro(decisao.nivel, decisao.effort);
  const textoQuadro = aplicarNoQuadro(quadro.texto, item.id, modelo);
  const textoEtapa = aplicarNaSecao(etapa.texto, item.id, decisao);
  if (textoQuadro === null) return { gravado: false, recusa: RECUSAS.SEM_LINHA, decisao };
  if (!opcoes.simular) {
    writeFileSync(arquivoEtapa, textoEtapa.replace(/\n/g, etapa.fimDeLinha), 'utf8');
    writeFileSync(arquivoQuadro, textoQuadro.replace(/\n/g, quadro.fimDeLinha), 'utf8');
  }
  auditarGravacao({
    subtarefa: item.id, nivel: decisao.nivel, fonte: decisao.fonte, jev: decisao.jevDecidiu,
    confianca: decisao.confianca, simulado: Boolean(opcoes.simular),
  });
  return { gravado: !opcoes.simular, recusa: null, decisao };
}
