// Conferência do rules-local/ contra a VERSAO.md (formato combinado F1/F2/F3/F4).
// Só leitura: este módulo nunca grava, apaga nem usa a rede. Também confere o pacote (scripts do
// `rules-local/` e Jev, RULES-LOCAL-JEV.2) quando a VERSAO.md tem a seção dele.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const ARQUIVO_VERSAO = 'VERSAO.md';
export const PASTA_REGRAS = 'regras';

const TAMANHO_CODIGO_ARQUIVO = 16;
const TAMANHO_CODIGO_VERSAO = 8;
const MOTIVO_AUSENTE = 'VERSAO.md ausente';
const MOTIVO_CORROMPIDA = 'VERSAO.md corrompida';
const MOTIVO_NAO_INTEGRO = 'arquivos do rules-local não batem com a VERSAO.md';
const PROBLEMA_FALTANDO = 'faltando';
const PROBLEMA_DIFERENTE = 'diferente';
const PROBLEMA_SOBRANDO = 'sobrando';
const REGEX_VERSAO = /^- \*\*Versão:\*\* (\d{4}-\d{2}-\d{2}-[0-9a-f]{8})$/m;
const REGEX_LINHA_REGRA = /^\| (\d+) \| ([A-Za-z0-9._-]+\.md) \| ([0-9a-f]{16}) \|$/;
const REGEX_ARQUIVO_MD = /\.md$/;
/** Seção do pacote (RULES-LOCAL-JEV.2): código e linhas `| n | <caminho>.mjs | código |`. */
const REGEX_CODIGO_PACOTE = /^- \*\*Código do pacote:\*\* ([0-9a-f]{8})$/m;
const REGEX_LINHA_PACOTE = /^\| (\d+) \| ((?:jev\/)?[A-Za-z0-9._/-]+\.mjs) \| ([0-9a-f]{16}) \|$/;
const REGEX_CAMINHO_INSEGURO = /(?:^|\/)\.\.(?:\/|$)|^\//;

/**
 * Tira o BOM do início e troca CRLF por LF (F1).
 * @param {string} texto Texto original.
 * @returns {string} Texto normalizado.
 */
export function normalizarTexto(texto) {
  return texto.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
}

/**
 * Calcula o código SHA-256 do texto normalizado, em hexadecimal minúsculo (F1).
 * @param {string} texto Texto a codificar.
 * @param {number} [tamanho=16] Caracteres do código (16 = arquivo; 8 = versão).
 * @returns {string} Código com `tamanho` caracteres.
 */
export function calcularCodigo(texto, tamanho = TAMANHO_CODIGO_ARQUIVO) {
  return createHash('sha256')
    .update(normalizarTexto(texto), 'utf8')
    .digest('hex')
    .slice(0, tamanho);
}

/**
 * Extrai as linhas de regra da tabela da VERSAO.md.
 * @param {string} texto VERSAO.md já normalizada.
 * @returns {Map<string, string>|null} arquivo → código, ou null se houver arquivo repetido.
 */
function extrairRegras(texto) {
  const regras = new Map();
  for (const linha of texto.split('\n')) {
    const achado = REGEX_LINHA_REGRA.exec(linha);
    if (!achado) continue;
    if (regras.has(achado[2])) return null;
    regras.set(achado[2], achado[3]);
  }
  return regras;
}

/**
 * Extrai a tabela do pacote (scripts do `rules-local/` e arquivos do Jev).
 * @param {string} texto VERSAO.md já normalizada.
 * @returns {Map<string, string>|null} caminho → código (vazio sem a seção), ou null se houver
 *   caminho repetido ou inseguro (`..` ou absoluto).
 */
function extrairPacote(texto) {
  const pacote = new Map();
  for (const linha of texto.split('\n')) {
    const achado = REGEX_LINHA_PACOTE.exec(linha);
    if (!achado) continue;
    const ehInvalido = pacote.has(achado[2]) || REGEX_CAMINHO_INSEGURO.test(achado[2]);
    if (ehInvalido) return null;
    pacote.set(achado[2], achado[3]);
  }
  return pacote;
}

/**
 * Confere o código do pacote declarado na VERSAO.md (seção ausente = pacote vazio, válido).
 * @param {string} texto VERSAO.md já normalizada.
 * @param {Map<string, string>|null} pacote Tabela do pacote.
 * @returns {boolean} true quando o pacote é válido.
 */
function pacoteValido(texto, pacote) {
  if (pacote === null) return false;
  const codigoDeclarado = REGEX_CODIGO_PACOTE.exec(texto)?.[1];
  if (pacote.size === 0) return codigoDeclarado === undefined;
  return codigoDeclarado === calcularCodigoConteudo(pacote);
}

/**
 * Recalcula o código do conteúdo (da versão) a partir das regras, na ordem da tabela (F1).
 * @param {Map<string, string>} regras arquivo → código.
 * @returns {string} Código de 8 caracteres.
 */
function calcularCodigoConteudo(regras) {
  let linhas = '';
  for (const [arquivo, codigo] of regras) linhas += `${arquivo} ${codigo}\n`;
  return calcularCodigo(linhas, TAMANHO_CODIGO_VERSAO);
}

/**
 * Lê o texto da VERSAO.md (F2).
 * @param {string|null|undefined} texto Conteúdo da VERSAO.md.
 * @returns {{ok: true, versao: string, regras: Map<string, string>,
 *   pacote: Map<string, string>}|{ok: false, motivo: string}} Resultado da leitura.
 */
export function lerVersao(texto) {
  if (typeof texto !== 'string' || texto.trim() === '') {
    return { ok: false, motivo: MOTIVO_AUSENTE };
  }
  const normalizado = normalizarTexto(texto);
  const versao = REGEX_VERSAO.exec(normalizado)?.[1];
  const regras = extrairRegras(normalizado);
  if (!versao || !regras || regras.size === 0) {
    return { ok: false, motivo: MOTIVO_CORROMPIDA };
  }
  if (!versao.endsWith(`-${calcularCodigoConteudo(regras)}`)) {
    return { ok: false, motivo: MOTIVO_CORROMPIDA };
  }
  const pacote = extrairPacote(normalizado);
  if (!pacoteValido(normalizado, pacote)) return { ok: false, motivo: MOTIVO_CORROMPIDA };
  return { ok: true, versao, regras, pacote };
}

/**
 * Lê um arquivo de texto, devolvendo null se não existir ou não puder ser lido.
 * @param {string} caminho Caminho do arquivo.
 * @returns {string|null} Conteúdo ou null.
 */
function lerArquivoOuNulo(caminho) {
  if (!existsSync(caminho)) return null;
  try {
    return readFileSync(caminho, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Compara cada arquivo da tabela com o gravado na pasta (regras em `regras/`; pacote na raiz
 * de `rules-local/`, com `jev/…`).
 * @param {string} pastaRegras Pasta base dos caminhos da tabela.
 * @param {Map<string, string>} regras arquivo → código esperado.
 * @returns {{arquivo: string, problema: string}[]} Problemas encontrados.
 */
function conferirRegras(pastaRegras, regras) {
  const problemas = [];
  for (const [arquivo, codigo] of regras) {
    const texto = lerArquivoOuNulo(join(pastaRegras, arquivo));
    if (texto === null) {
      problemas.push({ arquivo, problema: PROBLEMA_FALTANDO });
    } else if (calcularCodigo(texto) !== codigo) {
      problemas.push({ arquivo, problema: PROBLEMA_DIFERENTE });
    }
  }
  return problemas;
}

/**
 * Lista os `.md` de `regras/` que não estão na tabela da VERSAO.md.
 * @param {string} pastaRegras Caminho de `rules-local/regras`.
 * @param {Map<string, string>} regras arquivo → código esperado.
 * @returns {{arquivo: string, problema: string}[]} Arquivos sobrando.
 */
function listarSobrando(pastaRegras, regras) {
  if (!existsSync(pastaRegras)) return [];
  return readdirSync(pastaRegras)
    .filter((nome) => REGEX_ARQUIVO_MD.test(nome) && !regras.has(nome))
    .sort()
    .map((arquivo) => ({ arquivo, problema: PROBLEMA_SOBRANDO }));
}

/**
 * Confere a pasta `rules-local/` contra a própria VERSAO.md (R2.6). Só leitura.
 * @param {string} pastaRulesLocal Caminho da pasta `rules-local`.
 * @returns {{integro: true, versao: string}
 *   |{integro: false, motivo: string, arquivos: {arquivo: string, problema: string}[]}}
 *   Íntegro, ou o motivo e os arquivos que não batem.
 */
export function conferirPasta(pastaRulesLocal) {
  const leitura = lerVersao(lerArquivoOuNulo(join(pastaRulesLocal, ARQUIVO_VERSAO)));
  if (!leitura.ok) return { integro: false, motivo: leitura.motivo, arquivos: [] };

  const pastaRegras = join(pastaRulesLocal, PASTA_REGRAS);
  const arquivos = [
    ...conferirRegras(pastaRegras, leitura.regras),
    ...listarSobrando(pastaRegras, leitura.regras),
    ...conferirRegras(pastaRulesLocal, leitura.pacote),
  ];
  if (arquivos.length > 0) return { integro: false, motivo: MOTIVO_NAO_INTEGRO, arquivos };
  return { integro: true, versao: leitura.versao };
}
