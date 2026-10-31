// Auditoria das chamadas à DeepSeek (INTEGRACAO-DEEPSEEK.3, R5). Grava UMA linha JSONL por
// chamada em scripts/deepseek/saidas/auditoria-AAAA-MM.jsonl (pasta fora do Git) com data,
// nível, modelo, tokens, custo estimado e ação — NUNCA o texto do pedido nem da resposta, nem
// chave. Também soma o custo do dia para o teto diário (DEEPSEEK_MAX_CUSTO_DIA). Nenhuma função
// daqui lança exceção ao chamador: a auditoria nunca pode bloquear a sessão (INV-2).
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { lerLimites } from './limites.mjs';

const DIRETORIO_PADRAO = fileURLToPath(new URL('./saidas/', import.meta.url));
const PREFIXO_ARQUIVO = 'auditoria-';
const EXTENSAO_ARQUIVO = '.jsonl';
const CODIGO_ARQUIVO_AUSENTE = 'ENOENT';
const CASAS_CUSTO = 8;
const TAMANHO_MAXIMO_MOTIVO = 60;
const TOKENS_POR_MILHAO = 1_000_000;
// Preço ESTIMADO em US$ por milhão de tokens (tabela pública da DeepSeek; confirmar na fatura).
const PRECO_ENTRADA_USD = 0.28;
const PRECO_SAIDA_USD = 0.42;

/**
 * Formata a data local como AAAA-MM-DD (o "dia" do teto diário).
 * @param {Date} agora Instante a formatar.
 * @returns {string} Data no formato AAAA-MM-DD.
 */
export function formatarDia(agora) {
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

/**
 * Monta o caminho do arquivo mensal de auditoria.
 * @param {string} diretorio Pasta das saídas.
 * @param {string} dia Data AAAA-MM-DD.
 * @returns {string} Caminho de `auditoria-AAAA-MM.jsonl`.
 */
function caminhoDoMes(diretorio, dia) {
  const mes = dia.slice(0, 7);
  return `${diretorio.replace(/[\\/]+$/, '')}/${PREFIXO_ARQUIVO}${mes}${EXTENSAO_ARQUIVO}`;
}

/**
 * Estima o custo em dólares a partir dos tokens (estimativa; não substitui a fatura).
 * @param {number} tokensEntrada Tokens de entrada.
 * @param {number} tokensSaida Tokens de saída.
 * @returns {number} Custo estimado em US$.
 */
export function estimarCusto(tokensEntrada, tokensSaida) {
  const entrada = (Number(tokensEntrada) || 0) * PRECO_ENTRADA_USD;
  const saida = (Number(tokensSaida) || 0) * PRECO_SAIDA_USD;
  return Number(((entrada + saida) / TOKENS_POR_MILHAO).toFixed(CASAS_CUSTO));
}

/**
 * Lê o teto de custo do dia (US$); a leitura e a validação ficam em limites.mjs.
 * @param {Record<string, string|undefined>} ambiente Variáveis de ambiente.
 * @returns {number} Teto diário em US$.
 */
export function lerTetoDiario(ambiente = process.env) {
  return lerLimites(ambiente).tetoDiarioUsd;
}

/**
 * Monta a linha de auditoria só com campos permitidos (lista fechada: sem texto, sem chave).
 * @param {object} registro Dados da chamada.
 * @param {Date} agora Instante do registro.
 * @returns {object} Linha pronta para serializar.
 */
function montarLinha(registro, agora) {
  const tokensEntrada = Number(registro.tokensEntrada) || 0;
  const tokensSaida = Number(registro.tokensSaida) || 0;
  return {
    data: agora.toISOString(),
    dia: formatarDia(agora),
    nivel: String(registro.nivel ?? ''),
    modelo: String(registro.modelo ?? ''),
    raciocinio: Boolean(registro.raciocinio),
    tokensEntrada,
    tokensSaida,
    custoUsd: estimarCusto(tokensEntrada, tokensSaida),
    acao: String(registro.acao ?? ''),
    motivo: String(registro.motivo ?? '').slice(0, TAMANHO_MAXIMO_MOTIVO),
  };
}

/**
 * Grava uma linha de auditoria. Nunca lança: falha de disco devolve false.
 * @param {{nivel: string, modelo?: string, raciocinio?: boolean, tokensEntrada?: number,
 *   tokensSaida?: number, acao: string, motivo?: string}} registro Dados da chamada (sem texto).
 * @param {{diretorio?: string, agora?: Date}} [opcoes] Pasta e relógio injetáveis.
 * @returns {Promise<boolean>} true se a linha foi gravada.
 */
export async function registrarChamada(registro, opcoes = {}) {
  try {
    const diretorio = opcoes.diretorio ?? DIRETORIO_PADRAO;
    const linha = montarLinha(registro, opcoes.agora ?? new Date());
    await mkdir(diretorio, { recursive: true });
    await appendFile(caminhoDoMes(diretorio, linha.dia), `${JSON.stringify(linha)}\n`, 'utf8');
    return true;
  } catch {
    return false;
  }
}

/**
 * Soma o custo (US$) das linhas de um dia no texto do arquivo, ignorando linhas inválidas.
 * @param {string} conteudo Conteúdo do JSONL.
 * @param {string} dia Data AAAA-MM-DD.
 * @returns {number} Custo total do dia.
 */
function somarLinhasDoDia(conteudo, dia) {
  let total = 0;
  for (const texto of conteudo.split('\n')) {
    try {
      const linha = JSON.parse(texto);
      if (linha.dia === dia) total += Number(linha.custoUsd) || 0;
    } catch {
      // Linha vazia ou corrompida não entra na soma.
    }
  }
  return total;
}

/**
 * Soma o custo estimado do dia na auditoria. Arquivo ainda inexistente = 0.
 * Falha de leitura (não "ausente") devolve null: o roteador trata como "não sei" e não chama.
 * @param {{diretorio?: string, agora?: Date}} [opcoes] Pasta e relógio injetáveis.
 * @returns {Promise<number|null>} Custo do dia em US$, ou null se a auditoria não pôde ser lida.
 */
export async function somarCustoDoDia(opcoes = {}) {
  const diretorio = opcoes.diretorio ?? DIRETORIO_PADRAO;
  const dia = formatarDia(opcoes.agora ?? new Date());
  try {
    const conteudo = await readFile(caminhoDoMes(diretorio, dia), 'utf8');
    return somarLinhasDoDia(conteudo, dia);
  } catch (erro) {
    return erro?.code === CODIGO_ARQUIVO_AUSENTE ? 0 : null;
  }
}
