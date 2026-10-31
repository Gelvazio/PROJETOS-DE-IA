// Configuração do cliente Jev (TypeSafe): modo, endpoint, modelo, limites, preço e caminhos.
// A chave (TYPESAFE_API_KEY) vem do ambiente ou do .env da raiz do rules-ai e nunca é impressa;
// na cópia de um projeto (`rules-local/jev/`), só do ambiente.
// Variáveis: JEV_MODO (ativo|off), JEV_URL, JEV_MODELO, JEV_TIMEOUT_MS, JEV_MAX_TOKENS, JEV_LOG,
// JEV_ARQUIVO_ENV. Das mensagens (gancho de prompt): JEV_MENSAGENS (ativo|off),
// JEV_MAX_CUSTO_DIA (US$), JEV_MAX_TOKENS_MENSAGEM, JEV_TEMPO_MAXIMO_MENSAGEM_MS (e, para testes,
// JEV_AUDITORIA_MENSAGENS: outro arquivo de auditoria; lida em mensagem/classificar.mjs).
// Sem nenhuma delas, valem os padrões abaixo.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PASTA_JEV = dirname(fileURLToPath(import.meta.url));
export const RAIZ_RULES_AI = resolve(PASTA_JEV, '..', '..');
export const PASTA_SAIDAS = join(PASTA_JEV, 'saidas');
/**
 * Cópia do Jev dentro de um projeto (`<projeto>/rules-local/jev/`, RULES-LOCAL-JEV.6): lá a chave
 * vem SÓ da variável de ambiente (decisão do usuário, 2026-10-20), nunca de um `.env` do projeto.
 */
const ESTA_EM_PROJETO = PASTA_JEV.endsWith(join('rules-local', 'jev'));
const ARQUIVO_ENV_PADRAO = ESTA_EM_PROJETO ? null : join(RAIZ_RULES_AI, '.env');
const ARQUIVO_LOG_PADRAO = join(PASTA_SAIDAS, 'chamadas.jsonl');

/** `ativo` usa o Jev; `off` é o rollback (quem chama segue só pelos sinais da skill). */
export const MODOS = Object.freeze({ ATIVO: 'ativo', DESLIGADO: 'off' });
const MODO_PADRAO = MODOS.ATIVO;
const URL_PADRAO = 'https://api.typesafe.ai';
export const CAMINHO_ENDPOINT = '/v1/systemone';
/** Versão fixa; o alias `jev-latest` só depois de revalidar o benchmark. */
const MODELO_PADRAO = 'jev-1.13.0';
const TIMEOUT_PADRAO_MS = 60000;
const TIMEOUT_MINIMO_MS = 100;
/** Teto de tokens (entrada + saída) somados na rodada do cliente; 1 milhão ≈ US$ 0,042. */
const MAXIMO_TOKENS_PADRAO = 1000000;
const MAXIMO_TOKENS_MINIMO = 1;
/** Repetições depois da 1ª tentativa, só para 429, 529, 5xx e falha de rede. */
const MAXIMO_REPETICOES = 3;
/** Espera exponencial: 500 ms, 1 s, 2 s… limitada a 8 s (Retry-After pode aumentar). */
const ESPERA_BASE_MS = 500;
const ESPERA_MAXIMA_MS = 8_000;
/** Preço do Jev: US$ 0,042 por milhão de tokens de entrada (a saída não é cobrada). */
const PRECO_USD_POR_MILHAO_ENTRADA = 0.042;
/** Mensagens do usuário (gancho de prompt): limites padrão (JEV-GLOBAL-AI-FINAL.5, .6, .14). */
const MAXIMO_CUSTO_DIA_PADRAO_USD = 1;
const MAXIMO_CUSTO_DIA_MINIMO_USD = 0;
const MAXIMO_TOKENS_MENSAGEM_PADRAO = 2000;
const MAXIMO_TOKENS_MENSAGEM_MINIMO = 1;
const TEMPO_MAXIMO_MENSAGEM_PADRAO_MS = 4000;
const TEMPO_MAXIMO_MENSAGEM_MINIMO_MS = 100;
/** Nomes aceitos para a chave; o segundo é o alias usado no .env do PROJETO-JEV-AI. */
const NOMES_CHAVE = ['TYPESAFE_API_KEY', 'TYPE_SAFE_API_KEY'];
const PADRAO_LINHA_ENV = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/;
const ASPAS = ['"', "'"];

/** Erro do cliente Jev, com código estável para quem chama decidir o que fazer. */
export class ErroJev extends Error {
  /**
   * Cria o erro.
   * @param {string} codigo Código estável (ex.: `CHAVE_AUSENTE`, `HTTP_401`, `LIMITE_TOKENS`).
   * @param {string} mensagem Mensagem clara, sem chave e sem conteúdo enviado.
   * @param {{status?: number, repetivel?: boolean, esperaSugeridaMs?: number|null}} [detalhes]
   */
  constructor(codigo, mensagem, detalhes = {}) {
    super(mensagem);
    this.name = 'ErroJev';
    this.codigo = codigo;
    this.status = detalhes.status ?? null;
    this.repetivel = detalhes.repetivel ?? false;
    this.esperaSugeridaMs = detalhes.esperaSugeridaMs ?? null;
    this.tentativas = 0;
  }
}

/**
 * Cria o erro de configuração inválida.
 * @param {string} nome Variável de ambiente com problema.
 * @param {string} motivo O que era esperado.
 * @returns {ErroJev} Erro com código `CONFIGURACAO_INVALIDA`.
 */
function erroConfiguracao(nome, motivo) {
  return new ErroJev('CONFIGURACAO_INVALIDA', `${nome} inválida: ${motivo}`);
}

/**
 * Lê um texto do ambiente; vazio ou ausente vira o padrão.
 * @param {Record<string, string|undefined>} ambiente Variáveis de ambiente.
 * @param {string} nome Nome da variável.
 * @param {string} padrao Valor quando a variável falta.
 * @returns {string} Valor sem espaços nas pontas.
 */
function lerTexto(ambiente, nome, padrao) {
  const valor = String(ambiente[nome] ?? '').trim();
  return valor || padrao;
}

/**
 * Lê um inteiro do ambiente, com padrão e mínimo.
 * @param {Record<string, string|undefined>} ambiente Variáveis de ambiente.
 * @param {string} nome Nome da variável.
 * @param {{padrao: number, minimo: number}} limites Padrão e menor valor aceito.
 * @returns {number} Inteiro lido ou o padrão.
 * @throws {ErroJev} Se o valor não for inteiro ou ficar abaixo do mínimo.
 */
function lerInteiro(ambiente, nome, limites) {
  const texto = lerTexto(ambiente, nome, '');
  if (!texto) return limites.padrao;

  const valor = Number(texto);
  const ehValido = Number.isInteger(valor) && valor >= limites.minimo;
  if (!ehValido) throw erroConfiguracao(nome, `inteiro ≥ ${limites.minimo}`);
  return valor;
}

/**
 * Lê um número decimal do ambiente (ex.: dólares), com padrão e mínimo; aceita 0 se o mínimo for 0.
 * @param {Record<string, string|undefined>} ambiente Variáveis de ambiente.
 * @param {string} nome Nome da variável.
 * @param {{padrao: number, minimo: number}} limites Padrão e menor valor aceito.
 * @returns {number} Decimal lido ou o padrão.
 * @throws {ErroJev} Se o valor não for número finito ou ficar abaixo do mínimo.
 */
function lerDecimal(ambiente, nome, limites) {
  const texto = lerTexto(ambiente, nome, '').replace(',', '.');
  if (!texto) return limites.padrao;

  const valor = Number(texto);
  const ehValido = Number.isFinite(valor) && valor >= limites.minimo;
  if (!ehValido) throw erroConfiguracao(nome, `número ≥ ${limites.minimo}`);
  return valor;
}

/**
 * Lê uma variável de modo (`ativo` por padrão; `off` desliga).
 * @param {Record<string, string|undefined>} ambiente Variáveis de ambiente.
 * @param {string} nome Nome da variável (`JEV_MODO` ou `JEV_MENSAGENS`).
 * @returns {string} Um dos valores de {@link MODOS}.
 * @throws {ErroJev} Se o valor não for `ativo` nem `off`.
 */
function lerModoDe(ambiente, nome) {
  const modo = lerTexto(ambiente, nome, MODO_PADRAO).toLowerCase();
  const modosAceitos = Object.values(MODOS);
  if (!modosAceitos.includes(modo)) throw erroConfiguracao(nome, modosAceitos.join(' ou '));
  return modo;
}

/**
 * Lê o modo do Jev (`ativo` por padrão; `off` desliga).
 * @param {Record<string, string|undefined>} ambiente Variáveis de ambiente.
 * @returns {string} Um dos valores de {@link MODOS}.
 * @throws {ErroJev} Se o valor não for `ativo` nem `off`.
 */
function lerModo(ambiente) {
  return lerModoDe(ambiente, 'JEV_MODO');
}

/**
 * Lê a URL base do Jev (injetável para o mock local).
 * @param {Record<string, string|undefined>} ambiente Variáveis de ambiente.
 * @returns {string} URL base, sem o caminho do endpoint.
 * @throws {ErroJev} Se a URL não for válida.
 */
function lerUrl(ambiente) {
  const url = lerTexto(ambiente, 'JEV_URL', URL_PADRAO);
  if (!URL.canParse(url)) throw erroConfiguracao('JEV_URL', 'URL absoluta (ex.: https://…)');
  return url;
}

/**
 * Lê o `.env` a usar: o de `JEV_ARQUIVO_ENV`, o da raiz do rules-ai, ou nenhum dentro de projeto.
 * @param {Record<string, string|undefined>} ambiente Variáveis de ambiente.
 * @returns {string|null} Caminho absoluto, ou null (chave só do ambiente).
 */
function lerArquivoEnv(ambiente) {
  const escolhido = lerTexto(ambiente, 'JEV_ARQUIVO_ENV', '');
  if (escolhido) return resolve(escolhido);
  return ARQUIVO_ENV_PADRAO;
}

/**
 * Monta a configuração do cliente a partir do ambiente (sem a chave).
 * @param {Record<string, string|undefined>} [ambiente] Variáveis de ambiente (padrão: o processo).
 * @returns {Readonly<object>} Modo, URL, modelo, limites, preço e caminhos de log e `.env`.
 * @throws {ErroJev} Se alguma variável estiver inválida.
 */
export function carregarConfiguracao(ambiente = process.env) {
  return Object.freeze({
    modo: lerModo(ambiente),
    url: lerUrl(ambiente),
    modelo: lerTexto(ambiente, 'JEV_MODELO', MODELO_PADRAO),
    timeoutMs: lerInteiro(ambiente, 'JEV_TIMEOUT_MS', {
      padrao: TIMEOUT_PADRAO_MS, minimo: TIMEOUT_MINIMO_MS,
    }),
    maximoTokens: lerInteiro(ambiente, 'JEV_MAX_TOKENS', {
      padrao: MAXIMO_TOKENS_PADRAO, minimo: MAXIMO_TOKENS_MINIMO,
    }),
    maximoRepeticoes: MAXIMO_REPETICOES,
    esperaBaseMs: ESPERA_BASE_MS,
    esperaMaximaMs: ESPERA_MAXIMA_MS,
    precoUsdPorMilhaoEntrada: PRECO_USD_POR_MILHAO_ENTRADA,
    arquivoLog: resolve(lerTexto(ambiente, 'JEV_LOG', ARQUIVO_LOG_PADRAO)),
    arquivoEnv: lerArquivoEnv(ambiente),
  });
}

/**
 * Monta a configuração das mensagens do usuário (gancho de prompt), separada da geral para que
 * um valor inválido aqui nunca derrube os outros subcomandos.
 * @param {Record<string, string|undefined>} [ambiente] Variáveis de ambiente (padrão: o processo).
 * @returns {Readonly<{modo: string, mensagens: string, maximoCustoDiaUsd: number,
 *   maximoTokensMensagem: number, tempoMaximoMs: number}>} Modos e limites das mensagens.
 * @throws {ErroJev} Se alguma variável estiver inválida.
 */
export function carregarConfiguracaoMensagem(ambiente = process.env) {
  return Object.freeze({
    modo: lerModo(ambiente),
    mensagens: lerModoDe(ambiente, 'JEV_MENSAGENS'),
    maximoCustoDiaUsd: lerDecimal(ambiente, 'JEV_MAX_CUSTO_DIA', {
      padrao: MAXIMO_CUSTO_DIA_PADRAO_USD, minimo: MAXIMO_CUSTO_DIA_MINIMO_USD,
    }),
    maximoTokensMensagem: lerInteiro(ambiente, 'JEV_MAX_TOKENS_MENSAGEM', {
      padrao: MAXIMO_TOKENS_MENSAGEM_PADRAO, minimo: MAXIMO_TOKENS_MENSAGEM_MINIMO,
    }),
    tempoMaximoMs: lerInteiro(ambiente, 'JEV_TEMPO_MAXIMO_MENSAGEM_MS', {
      padrao: TEMPO_MAXIMO_MENSAGEM_PADRAO_MS, minimo: TEMPO_MAXIMO_MENSAGEM_MINIMO_MS,
    }),
  });
}

/**
 * Tira as aspas que envolvem um valor do `.env`.
 * @param {string} valor Valor bruto.
 * @returns {string} Valor sem aspas nas pontas.
 */
function removerAspas(valor) {
  const temAspas = valor.length >= 2 && ASPAS.some(
    (aspa) => valor.startsWith(aspa) && valor.endsWith(aspa),
  );
  return temAspas ? valor.slice(1, -1) : valor;
}

/**
 * Procura a chave no arquivo `.env`, sem imprimir nada.
 * @param {string|null} arquivo Caminho do `.env` (null = não ler arquivo nenhum).
 * @returns {string|null} Valor da chave ou null se não houver arquivo ou chave.
 */
function lerChaveDoArquivoEnv(arquivo) {
  if (!arquivo || !existsSync(arquivo)) return null;

  const valores = new Map();
  for (const linha of readFileSync(arquivo, 'utf8').split(/\r?\n/)) {
    const achado = linha.match(PADRAO_LINHA_ENV);
    if (achado && NOMES_CHAVE.includes(achado[1])) valores.set(achado[1], achado[2].trim());
  }
  const valor = NOMES_CHAVE.map((nome) => removerAspas(valores.get(nome) ?? '')).find(Boolean);
  return valor || null;
}

/**
 * Lê a chave do Jev: primeiro o ambiente, depois o `.env` da raiz. Nunca imprime o valor e não
 * grava em `process.env` (processos filhos não herdam a chave).
 * @param {{ambiente?: Record<string, string|undefined>, arquivoEnv?: string}} [origem]
 * @returns {string|null} Chave ou null quando não existe em nenhum dos dois.
 */
export function lerChave(origem = {}) {
  const ambiente = origem.ambiente ?? process.env;
  const doAmbiente = NOMES_CHAVE.map((nome) => String(ambiente[nome] ?? '').trim()).find(Boolean);
  if (doAmbiente) return doAmbiente;
  return lerChaveDoArquivoEnv(origem.arquivoEnv ?? ARQUIVO_ENV_PADRAO);
}
