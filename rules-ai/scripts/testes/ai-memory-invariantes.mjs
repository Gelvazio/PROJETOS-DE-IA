// Teste de invariante do ai-memory (AI-MEMORY-INTEGRATION.14, exceção C34 em tarefa PESADO).
// Uso: node scripts/testes/ai-memory-invariantes.mjs
// INV-1: todo caminho proibido casa com algum `ignore_paths` do marker gerado, e o auditor
//        (.13) acusa página de wiki que cita esse caminho. INV-2: instalador e auditor não
//        escrevem em quadro/etapa. INV-3: o instalador é idempotente (1 a 10 execuções).
// Sai com código 1 se qualquer invariante falhar.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const INSTALADOR = join(RAIZ, 'scripts', 'instalar-ai-memory.mjs');
const AUDITOR = join(RAIZ, 'scripts', 'ai-memory-auditar.mjs');
const NOME_MARKER = '.ai-memory.toml';
const MAXIMO_EXECUCOES = 10;
const PREFIXOS_PROFUNDIDADE = ['', 'a/', 'a/b/'];
const ARQUIVOS_QUADRO = ['tasks/STATUS.md', 'tasks/task_complete.md', 'tasks/etapas/ETAPA-1-x.md'];
const PADRAO_ESCRITA_QUADRO = /(STATUS\.md|task_complete|etapas)/;

/** Caminhos proibidos: `raiz` vale só na raiz do projeto; `qualquer` vale em qualquer nível. */
const PROIBIDOS = {
  raiz: [
    '.env', '.env.local', 'scripts/variaveis.js', 'tasks/STATUS.md', 'tasks/etapas/x.md',
    'rules-local/VERSAO.md', 'graphify-out/GRAPH_REPORT.md', 'DEMAIS-PROJETOS-X/a.md',
    'DEMAIS-PROJETOS-NAO-MEXER-AGORA/p/b.js', 'node_modules/x/i.js', 'prova.pdf',
  ],
  qualquer: [
    '.env', '.env.producao', 'variaveis.js', 'gabarito/q1.md', 'prova-gabarito.md',
    'alunos-turma.csv', 'lista-alunos.xlsx', 'alunos.json', 'doc.pdf',
    'node_modules/pkg/i.js',
  ],
};

/**
 * Converte um padrão do marker (`*`, `?`, `**`) em expressão regular. `**` + `/` exige pelo
 * menos uma pasta (marker-file.md), por isso cada padrão precisa da forma raiz e da `**` juntas.
 * @param {string} padrao Padrão do `ignore_paths`.
 * @returns {RegExp} Expressão que casa o caminho relativo inteiro.
 */
function padraoParaRegex(padrao) {
  let texto = '';
  for (let i = 0; i < padrao.length; i += 1) {
    const resto = padrao.slice(i);
    if (resto.startsWith('**/')) { texto += '(?:[^/]+/)+'; i += 2; }
    else if (resto.startsWith('/**')) { texto += '/.*'; i += 2; }
    else if (padrao[i] === '*') texto += '[^/]*';
    else if (padrao[i] === '?') texto += '[^/]';
    else texto += padrao[i].replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${texto}$`, 'i');
}

/**
 * Lê os padrões `ignore_paths` do marker.
 * @param {string} marker Texto do `.ai-memory.toml`.
 * @returns {string[]} Padrões.
 */
function lerIgnorePaths(marker) {
  const bloco = marker.split('ignore_paths = [')[1]?.split(']')[0] ?? '';
  return [...bloco.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

/**
 * Roda o instalador numa pasta temporária.
 * @param {string} pasta Pasta do projeto de mentira.
 * @returns {number} Código de saída.
 */
function instalar(pasta) {
  return spawnSync('node', [INSTALADOR, pasta, '--nome', 'teste-invariante']).status;
}

/**
 * INV-1 (marker): todo caminho proibido deve casar com algum padrão.
 * @param {string[]} padroes Padrões do marker.
 * @returns {string[]} Caminhos que vazariam.
 */
function caminhosQueVazam(padroes) {
  const regexes = padroes.map(padraoParaRegex);
  const casos = [...PROIBIDOS.raiz];
  for (const prefixo of PREFIXOS_PROFUNDIDADE) {
    casos.push(...PROIBIDOS.qualquer.map((c) => prefixo + c));
  }
  return casos.filter((c) => !regexes.some((r) => r.test(c)));
}

/**
 * INV-1 (wiki): o auditor deve acusar página que cita item proibido e aceitar a limpa.
 * @param {string} base Pasta temporária.
 * @returns {string[]} Falhas encontradas.
 */
function conferirAuditor(base) {
  const falhas = [];
  const wiki = join(base, 'wiki');
  mkdirSync(wiki);
  const rodar = () => spawnSync('node', [AUDITOR, wiki]).status;
  writeFileSync(join(wiki, 'limpa.md'), 'Sessão sobre o gerador de aulas.\n');
  if (rodar() !== 0) falhas.push('auditor acusou página limpa');
  const sujas = ['abra o .env', 'veja scripts/variaveis.js', 'leia tasks/STATUS.md',
    'ver DEMAIS-PROJETOS-X/a', 'chave sk-abcdefghijklmnopqrstuv', 'CPF 123.456.789-09'];
  sujas.forEach((texto, i) => {
    writeFileSync(join(wiki, `suja.md`), `${texto}\n`);
    if (rodar() !== 1) falhas.push(`auditor não acusou caso ${i + 1}`);
  });
  return falhas;
}

/**
 * INV-2: instalador e auditor não citam nem gravam quadro ou etapa.
 * @returns {string[]} Falhas encontradas.
 */
function conferirSemEscritaNoQuadro() {
  const falhas = [];
  for (const arquivo of [INSTALADOR, AUDITOR]) {
    const codigo = readFileSync(arquivo, 'utf8');
    const gravacoes = codigo.match(/(writeFileSync|appendFileSync|renameSync|rmSync)\([^)]*/g);
    for (const chamada of gravacoes ?? []) {
      if (PADRAO_ESCRITA_QUADRO.test(chamada)) falhas.push(`${arquivo}: ${chamada}`);
    }
  }
  const base = mkdtempSync(join(tmpdir(), 'invariante-quadro-'));
  mkdirSync(join(base, 'tasks', 'etapas'), { recursive: true });
  const antes = ARQUIVOS_QUADRO.map((a) => {
    writeFileSync(join(base, a), 'original\n');
    return hash(join(base, a));
  });
  instalar(base);
  ARQUIVOS_QUADRO.forEach((a, i) => {
    if (hash(join(base, a)) !== antes[i]) falhas.push(`instalador alterou ${a}`);
  });
  rmSync(base, { recursive: true, force: true });
  return falhas;
}

/**
 * Hash SHA-256 de um arquivo.
 * @param {string} arquivo Caminho.
 * @returns {string} Hash hexadecimal.
 */
function hash(arquivo) {
  return createHash('sha256').update(readFileSync(arquivo)).digest('hex');
}

/**
 * INV-3: N execuções do instalador deixam o marker idêntico ao da primeira.
 * @returns {string[]} Falhas encontradas.
 */
function conferirIdempotencia() {
  const falhas = [];
  for (let n = 1; n <= MAXIMO_EXECUCOES; n += 1) {
    const base = mkdtempSync(join(tmpdir(), 'invariante pasta '));
    instalar(base);
    const primeiro = hash(join(base, NOME_MARKER));
    for (let i = 1; i < n; i += 1) instalar(base);
    if (hash(join(base, NOME_MARKER)) !== primeiro) falhas.push(`marker mudou com N=${n}`);
    rmSync(base, { recursive: true, force: true });
  }
  return falhas;
}

/** Roda os três invariantes e define o código de saída. */
function principal() {
  const base = mkdtempSync(join(tmpdir(), 'invariante-ai-memory-'));
  const projeto = join(base, 'projeto');
  mkdirSync(projeto);
  instalar(projeto);
  const padroes = lerIgnorePaths(readFileSync(join(projeto, NOME_MARKER), 'utf8'));
  const resultados = {
    'INV-1 marker': caminhosQueVazam(padroes).map((c) => `vaza: ${c}`),
    'INV-1 auditor': conferirAuditor(base),
    'INV-2 quadro': conferirSemEscritaNoQuadro(),
    'INV-3 idempotência': conferirIdempotencia(),
  };
  rmSync(base, { recursive: true, force: true });
  let total = 0;
  for (const [nome, falhas] of Object.entries(resultados)) {
    console.log(`${falhas.length ? 'FALHOU' : 'ok    '} ${nome}`);
    falhas.forEach((f) => console.log(`   - ${f}`));
    total += falhas.length;
  }
  process.exitCode = total > 0 ? 1 : 0;
}

principal();
