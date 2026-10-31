// Auditoria do wiki do ai-memory (AI-MEMORY-INTEGRATION.13).
// Uso: node scripts/ai-memory-auditar.mjs [pasta-do-wiki]
// Varre as páginas `.md` do wiki e acusa caminho ou segredo proibido. Só leitura.
// Sai com código 1 se achar algo, 0 se estiver limpo. Nunca imprime o valor do segredo.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PASTA_PADRAO = join(process.env.LOCALAPPDATA ?? '', 'ai-memory', 'wiki');
const PASTA_GIT = '.git';
const EXTENSAO_PAGINA = '.md';
const CODIGO_ACHADO = 1;
const CODIGO_ERRO = 2;
const LIMITE_TRECHO = 60;

/** Regras de detecção: nome do achado e expressão que o encontra. */
const REGRAS = [
  { nome: 'arquivo .env', padrao: /(^|[\s"'`/\\(])\.env(\.[\w-]+)?(?![\w-])/i },
  { nome: 'variaveis.js', padrao: /variaveis\.js/i },
  { nome: 'pasta tasks/', padrao: /(^|[\s"'`(])tasks[/\\]/i },
  { nome: 'pasta DEMAIS-PROJETOS-*', padrao: /DEMAIS-PROJETOS-/i },
  { nome: 'chave sk-', padrao: /\bsk-[A-Za-z0-9_-]{16,}/ },
  { nome: 'chave tsk_', padrao: /\btsk_[A-Za-z0-9]{8,}/ },
  { nome: 'chave ghp_', padrao: /\bghp_[A-Za-z0-9]{20,}/ },
  { nome: 'Bearer token', padrao: /\bBearer\s+[A-Za-z0-9._~+/=-]{16,}/ },
  { nome: 'JWT', padrao: /\beyJ[\w-]{8,}\.[\w-]{8,}\.[\w-]{8,}/ },
  { nome: 'service_role', padrao: /service_role/i },
  { nome: 'CPF', padrao: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/ },
];

/**
 * Lista as páginas `.md` do wiki, sem entrar em `.git`.
 * @param {string} pasta Pasta a varrer.
 * @returns {string[]} Caminhos completos das páginas.
 */
function listarPaginas(pasta) {
  const paginas = [];
  for (const nome of readdirSync(pasta)) {
    if (nome === PASTA_GIT) continue;
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) paginas.push(...listarPaginas(caminho));
    else if (nome.endsWith(EXTENSAO_PAGINA)) paginas.push(caminho);
  }
  return paginas;
}

/**
 * Procura achados numa página, informando só regra e linha (nunca o valor).
 * @param {string} caminho Caminho da página.
 * @returns {{arquivo: string, linha: number, regra: string}[]} Achados da página.
 */
function auditarPagina(caminho) {
  const achados = [];
  const linhas = readFileSync(caminho, 'utf8').split(/\r?\n/);
  linhas.forEach((texto, indice) => {
    for (const regra of REGRAS) {
      if (regra.padrao.test(texto)) {
        achados.push({ arquivo: caminho, linha: indice + 1, regra: regra.nome });
      }
    }
  });
  return achados;
}

/**
 * Audita o wiki inteiro e imprime o resultado.
 * @param {string} pasta Pasta do wiki.
 * @returns {number} Código de saída (0 limpo, 1 com achados).
 */
function auditarWiki(pasta) {
  const paginas = listarPaginas(pasta);
  const achados = paginas.flatMap(auditarPagina);
  for (const achado of achados) {
    const local = `${achado.arquivo}:${achado.linha}`.slice(-LIMITE_TRECHO * 2);
    console.log(`ACHADO ${achado.regra} em ${local}`);
  }
  console.log(`ai-memory-auditar: ${paginas.length} página(s), ${achados.length} achado(s).`);
  return achados.length > 0 ? CODIGO_ACHADO : 0;
}

/** Ponto de entrada. */
function principal() {
  const pasta = process.argv[2] ?? PASTA_PADRAO;
  if (!existsSync(pasta)) {
    console.error(`ai-memory-auditar: pasta do wiki não existe: ${pasta}`);
    process.exit(CODIGO_ERRO);
  }
  process.exit(auditarWiki(pasta));
}

principal();
