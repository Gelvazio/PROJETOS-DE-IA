// Auditoria das mensagens (JEV-GLOBAL-AI-FINAL.8, R2.2, INV-4): uma linha por mensagem em
// `scripts/jev/saidas/mensagens-AAAA-MM.jsonl` (fora do Git) com SÓ metadados: data, projeto,
// hash, pulado, decisão, nível, confiança, custo, latência, ação, situação e código do erro.
// Nunca o texto, nunca a chave. Falha ao gravar ou ler nunca derruba a mensagem.
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { PASTA_SAIDAS } from '../config.mjs';

/** Campos permitidos na linha (lista fechada: o resto do resultado nunca é gravado). */
const CAMPOS_AUDITORIA = Object.freeze([
  'projeto', 'hash', 'pulado', 'motivo', 'decisao', 'nivel', 'confianca', 'custo_usd',
  'latencia_ms', 'acao', 'situacao', 'erro_codigo',
]);
const DIGITOS_MES = 2;

/**
 * Preenche um número com zeros à esquerda.
 * @param {number} numero Valor.
 * @returns {string} Texto com 2 dígitos.
 */
function doisDigitos(numero) {
  return String(numero).padStart(DIGITOS_MES, '0');
}

/**
 * Formata o dia local `AAAA-MM-DD` (o limite de custo vale por dia local).
 * @param {Date} data Momento.
 * @returns {string} Dia local.
 */
export function formatarDia(data) {
  const mes = doisDigitos(data.getMonth() + 1);
  return `${data.getFullYear()}-${mes}-${doisDigitos(data.getDate())}`;
}

/**
 * Caminho do arquivo de auditoria do mês.
 * @param {Date} data Momento.
 * @param {string} [pasta] Pasta das saídas (padrão: `scripts/jev/saidas`).
 * @returns {string} Caminho `mensagens-AAAA-MM.jsonl`.
 */
export function caminhoAuditoriaDoMes(data, pasta = PASTA_SAIDAS) {
  return join(pasta, `mensagens-${formatarDia(data).slice(0, 7)}.jsonl`);
}

/**
 * Soma o custo (US$) gasto num dia, lendo a própria auditoria. Erro de leitura vale 0.
 * @param {string} arquivo Arquivo de auditoria.
 * @param {string} dia Dia local `AAAA-MM-DD`.
 * @returns {number} Custo do dia.
 */
export function somarCustoDoDia(arquivo, dia) {
  let texto = '';
  try {
    texto = readFileSync(arquivo, 'utf8');
  } catch {
    return 0;
  }
  let total = 0;
  for (const linha of texto.split('\n')) {
    try {
      const registro = JSON.parse(linha);
      if (registro.dia === dia && Number.isFinite(registro.custo_usd)) total += registro.custo_usd;
    } catch {
      // linha vazia ou truncada: ignora
    }
  }
  return total;
}

/**
 * Grava a linha de auditoria (só os campos permitidos). Nunca lança.
 * @param {string} arquivo Arquivo de auditoria.
 * @param {{data: Date, resultado: object, projeto: string}} registro Momento, resultado e projeto.
 * @returns {boolean} true se gravou.
 */
export function gravarAuditoria(arquivo, registro) {
  try {
    const dados = { ...registro.resultado, projeto: registro.projeto };
    const linha = {
      data: registro.data.toISOString(),
      dia: formatarDia(registro.data),
      ...Object.fromEntries(CAMPOS_AUDITORIA.map((campo) => [campo, dados[campo] ?? null])),
    };
    mkdirSync(dirname(arquivo), { recursive: true });
    appendFileSync(arquivo, `${JSON.stringify(linha)}\n`, 'utf8');
    return true;
  } catch {
    return false;
  }
}
