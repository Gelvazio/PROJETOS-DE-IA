// scripts/sincronizar-agentes.mjs — copia as skills e os agentes de `.agents/` (fonte única,
// lida direto por Codex, Antigravity, Cursor e Copilot) para as pastas das IAs que só leem a
// própria pasta: `.claude/` (Claude Code) e `.grok/` (Grok Build); gera, para o Gemini CLI,
// um comando `.gemini/commands/<skill>.toml` por skill e, para o Codex, um
// `.codex/agents/<agente>.toml` por agente. Node, sem dependências.
// Com `--checar` não grava nada: lista o que está desatualizado e sai com código 1 (usado no
// `.githooks/pre-push` e no `npm run check:agentes`).
// Só copia: nunca apaga arquivo no destino, porque a cópia pode ter arquivos próprios
// (ex.: `evals/` da skill `proxima-task`).

import {
  copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PASTA_ORIGEM = '.agents';

/** Destinos de cópia: para acrescentar uma IA, acrescente uma entrada. */
const DESTINOS_DE_COPIA = [
  { nome: 'Claude Code', pasta: '.claude', subpastas: ['skills', 'agents'] },
  { nome: 'Grok Build', pasta: '.grok', subpastas: ['skills'] },
];

const PASTA_SKILLS = 'skills';
const ARQUIVO_SKILL = 'SKILL.md';
const PASTA_COMANDOS_GEMINI = join('.gemini', 'commands');
const PASTA_AGENTES = 'agents';
const PASTA_AGENTES_CODEX = join('.codex', 'agents');
const EXTENSAO_MARKDOWN = '.md';
const SEPARADOR_FRONTMATTER = '---';
const OPCAO_CHECAR = '--checar';
const CODIGO_DESATUALIZADO = 1;
const COMANDO_CONSERTA = 'npm run sync:agentes';

/**
 * Lista, de forma recursiva, os arquivos dentro de `pasta`.
 * @param {string} pasta - Caminho absoluto da pasta.
 * @returns {string[]} Caminhos absolutos dos arquivos (vazio se a pasta não existir).
 */
function listarArquivos(pasta) {
  if (!existsSync(pasta)) return [];

  return readdirSync(pasta, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(pasta, entrada.name);
    if (entrada.isDirectory()) return listarArquivos(caminho);
    return [caminho];
  });
}

/**
 * Diz se o arquivo de destino já tem exatamente o conteúdo da origem.
 * @param {string} origem - Arquivo de origem.
 * @param {string} destino - Arquivo de destino.
 * @returns {boolean} true se o destino existe e é igual à origem.
 */
function estaIgual(origem, destino) {
  if (!existsSync(destino)) return false;
  return readFileSync(origem).equals(readFileSync(destino));
}

/**
 * Copia os arquivos de uma subpasta de `.agents/` para a mesma subpasta de um destino.
 * @param {{raiz: string, pastaDestino: string, subpasta: string, checar?: boolean}} opcoes -
 *   Raiz do repositório, pasta do destino (ex.: `.claude`), subpasta (ex.: `skills`) e, com
 *   `checar`, só confere sem gravar.
 * @returns {{copiados: string[], iguais: number}} Arquivos copiados (ou, com `checar`,
 *   desatualizados), relativos à raiz, e quantidade de arquivos que já estavam iguais.
 */
export function sincronizarSubpasta({ raiz, pastaDestino, subpasta, checar = false }) {
  const origemSubpasta = join(raiz, PASTA_ORIGEM, subpasta);
  const destinoSubpasta = join(raiz, pastaDestino, subpasta);
  const copiados = [];
  let iguais = 0;

  for (const origem of listarArquivos(origemSubpasta)) {
    const destino = join(destinoSubpasta, relative(origemSubpasta, origem));
    if (estaIgual(origem, destino)) {
      iguais += 1;
      continue;
    }
    copiados.push(relative(raiz, destino));
    if (checar) continue;
    mkdirSync(dirname(destino), { recursive: true });
    copyFileSync(origem, destino);
  }
  return { copiados, iguais };
}

/**
 * Lê um campo de uma linha só (`campo: valor`) do frontmatter de um `SKILL.md`.
 * @param {string} texto - Conteúdo do `SKILL.md`.
 * @param {string} campo - Nome do campo (ex.: `description`).
 * @returns {string} Valor do campo, ou texto vazio se não existir.
 */
function lerCampoFrontmatter(texto, campo) {
  const linhas = texto.split(/\r?\n/);
  if (linhas[0] !== SEPARADOR_FRONTMATTER) return '';

  const fim = linhas.indexOf(SEPARADOR_FRONTMATTER, 1);
  const linha = linhas.slice(1, fim).find((atual) => atual.startsWith(`${campo}:`));
  return linha ? linha.slice(campo.length + 1).trim() : '';
}

/**
 * Escapa um texto para string TOML básica (entre aspas duplas).
 * @param {string} texto - Texto livre.
 * @returns {string} Texto com `\\` e `"` escapados.
 */
function escaparToml(texto) {
  return texto.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

/**
 * Monta o comando do Gemini CLI que embute o `SKILL.md` (`@{...}`) e o pedido (`{{args}}`).
 * @param {{nome: string, descricao: string}} skill - Nome e descrição da skill.
 * @returns {string} Conteúdo do arquivo `.toml`.
 */
export function montarComandoGemini({ nome, descricao }) {
  const caminhoSkill = `${PASTA_ORIGEM}/${PASTA_SKILLS}/${nome}/${ARQUIVO_SKILL}`;
  return [
    `# Gerado por scripts/sincronizar-agentes.mjs. Fonte: ${caminhoSkill}.`,
    `description = "${escaparToml(descricao)}"`,
    'prompt = """',
    `Siga a skill \`${nome}\` do projeto (fonte única: ${caminhoSkill}), cujo texto vem abaixo.`,
    '',
    `@{${caminhoSkill}}`,
    '',
    'Pedido do usuário: {{args}}',
    '"""',
    '',
  ].join('\n');
}

/**
 * Lista as skills de `.agents/skills/` (pastas que têm `SKILL.md`).
 * @param {string} raiz - Raiz do repositório.
 * @returns {{nome: string, descricao: string}[]} Skills encontradas.
 */
function listarSkills(raiz) {
  const pastaSkills = join(raiz, PASTA_ORIGEM, PASTA_SKILLS);
  if (!existsSync(pastaSkills)) return [];

  return readdirSync(pastaSkills, { withFileTypes: true })
    .filter((entrada) => existsSync(join(pastaSkills, entrada.name, ARQUIVO_SKILL)))
    .map((entrada) => {
      const texto = readFileSync(join(pastaSkills, entrada.name, ARQUIVO_SKILL), 'utf8');
      const nome = lerCampoFrontmatter(texto, 'name') || entrada.name;
      return { nome, descricao: lerCampoFrontmatter(texto, 'description') };
    });
}

/**
 * Gera `.gemini/commands/<skill>.toml` para cada skill; só grava o que mudou.
 * @param {string} raiz - Raiz do repositório.
 * @param {boolean} [checar=false] - Só confere, sem gravar.
 * @returns {{copiados: string[], iguais: number}} Arquivos gravados (ou desatualizados) e
 *   quantos já estavam iguais.
 */
export function gerarComandosGemini(raiz, checar = false) {
  const gerados = listarSkills(raiz).map((skill) => ({
    destino: join(raiz, PASTA_COMANDOS_GEMINI, `${skill.nome}.toml`),
    conteudo: montarComandoGemini(skill),
  }));
  return gravarGerados({ raiz, gerados, checar });
}

/**
 * Grava cada arquivo gerado só quando o conteúdo mudou (com `checar`, só confere).
 * @param {{raiz: string, gerados: {destino: string, conteudo: string}[], checar?: boolean}}
 *   opcoes - Raiz do repositório, arquivos a gravar e se é só conferência.
 * @returns {{copiados: string[], iguais: number}} Arquivos gravados (ou desatualizados) e
 *   quantos já estavam iguais.
 */
function gravarGerados({ raiz, gerados, checar = false }) {
  const copiados = [];
  let iguais = 0;

  for (const { destino, conteudo } of gerados) {
    if (existsSync(destino) && readFileSync(destino, 'utf8') === conteudo) {
      iguais += 1;
      continue;
    }
    copiados.push(relative(raiz, destino));
    if (checar) continue;
    mkdirSync(dirname(destino), { recursive: true });
    writeFileSync(destino, conteudo);
  }
  return { copiados, iguais };
}

/**
 * Separa o frontmatter (`---`) do corpo de um arquivo Markdown de agente.
 * @param {string} texto - Conteúdo do `.md` do agente.
 * @returns {{nome: string, descricao: string, corpo: string}} Campos usados pelo Codex.
 */
function lerAgente(texto) {
  const linhas = texto.split(/\r?\n/);
  const fim = linhas[0] === SEPARADOR_FRONTMATTER ? linhas.indexOf(SEPARADOR_FRONTMATTER, 1) : -1;
  return {
    nome: lerCampoFrontmatter(texto, 'name'),
    descricao: lerCampoFrontmatter(texto, 'description'),
    corpo: linhas.slice(fim + 1).join('\n').trim(),
  };
}

/**
 * Monta o agente do Codex (`.codex/agents/<nome>.toml`) a partir do agente de `.agents/agents/`.
 * @param {{nome: string, descricao: string, corpo: string}} agente - Agente lido do `.md`.
 * @returns {string} Conteúdo do arquivo `.toml`.
 */
export function montarAgenteCodex({ nome, descricao, corpo }) {
  const caminhoAgente = `${PASTA_ORIGEM}/${PASTA_AGENTES}/${nome}${EXTENSAO_MARKDOWN}`;
  return [
    `# Gerado por scripts/sincronizar-agentes.mjs. Fonte: ${caminhoAgente}.`,
    `name = "${escaparToml(nome)}"`,
    `description = "${escaparToml(descricao)}"`,
    `developer_instructions = '''`,
    corpo,
    `'''`,
    '',
  ].join('\n');
}

/**
 * Gera `.codex/agents/<agente>.toml` para cada agente de `.agents/agents/`.
 * @param {string} raiz - Raiz do repositório.
 * @param {boolean} [checar=false] - Só confere, sem gravar.
 * @returns {{copiados: string[], iguais: number}} Arquivos gravados (ou desatualizados) e
 *   quantos já estavam iguais.
 */
export function gerarAgentesCodex(raiz, checar = false) {
  const pastaAgentes = join(raiz, PASTA_ORIGEM, PASTA_AGENTES);
  const gerados = listarArquivos(pastaAgentes)
    .filter((arquivo) => arquivo.endsWith(EXTENSAO_MARKDOWN))
    .map((arquivo) => lerAgente(readFileSync(arquivo, 'utf8')))
    .filter((agente) => agente.nome)
    .map((agente) => ({
      destino: join(raiz, PASTA_AGENTES_CODEX, `${agente.nome}.toml`),
      conteudo: montarAgenteCodex(agente),
    }));
  return gravarGerados({ raiz, gerados, checar });
}

/**
 * Sincroniza (ou, com `checar`, só confere) todos os destinos e mostra o resumo no terminal.
 * @param {string} raiz - Raiz do repositório.
 * @param {boolean} [checar=false] - Só confere, sem gravar.
 * @returns {string[]} Arquivos copiados/gerados (ou desatualizados), relativos à raiz.
 */
export function sincronizarAgentes(raiz, checar = false) {
  const verbo = checar ? 'desatualizado' : 'copiado';
  const todos = [];
  for (const { nome, pasta, subpastas } of DESTINOS_DE_COPIA) {
    for (const subpasta of subpastas) {
      const resultado = sincronizarSubpasta({ raiz, pastaDestino: pasta, subpasta, checar });
      mostrarResumo(`${nome} ${subpasta}`, verbo, resultado);
      todos.push(...resultado.copiados);
    }
  }
  const gemini = gerarComandosGemini(raiz, checar);
  mostrarResumo('Gemini CLI comandos', verbo, gemini);
  const codex = gerarAgentesCodex(raiz, checar);
  mostrarResumo('Codex agentes', verbo, codex);
  return [...todos, ...gemini.copiados, ...codex.copiados];
}

/**
 * Mostra os arquivos tratados e o resumo de um destino.
 * @param {string} rotulo - Nome do destino (ex.: `Grok Build skills`).
 * @param {string} verbo - `copiado` ou `desatualizado`.
 * @param {{copiados: string[], iguais: number}} resultado - Resultado do destino.
 */
function mostrarResumo(rotulo, verbo, { copiados, iguais }) {
  for (const arquivo of copiados) console.log(`${verbo}: ${arquivo}`);
  console.log(`${rotulo}: ${copiados.length} ${verbo}(s), ${iguais} já igual(is)`);
}

/**
 * Executa pela linha de comando; com `--checar`, sai 1 se houver cópia desatualizada.
 */
function executar() {
  const checar = process.argv.includes(OPCAO_CHECAR);
  const tratados = sincronizarAgentes(RAIZ, checar);
  if (!checar || tratados.length === 0) return;

  console.error(`Cópias das skills desatualizadas: rode \`${COMANDO_CONSERTA}\` e commite.`);
  process.exitCode = CODIGO_DESATUALIZADO;
}

const caminhoChamado = process.argv[1] ? resolve(process.argv[1]) : '';
const executadoDireto = caminhoChamado === fileURLToPath(import.meta.url);
if (executadoDireto) executar();
