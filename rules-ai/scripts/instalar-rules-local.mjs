// Instala as regras globais em `rules-local/` de um projeto (RULES-LOCAL-GLOBAL.12, F6).
// Uso: node scripts/instalar-rules-local.mjs <pasta-do-projeto>
// Copia os `*.mjs` de scripts/rules-local/, grava `.gitattributes` e `.gitignore`, o gancho
// SessionStart e o de prompt do Jev (UserPromptSubmit) no `.claude/settings.json`, o de prompt
// no `.codex/hooks.json` (RULES-LOCAL-JEV.3/.4) e o aviso no AGENTS.md (ou CLAUDE.md), e roda o
// `rules-local/sessao.mjs` do projeto para baixar as regras. Não faz commit. Idempotente:
// confere tudo antes de gravar e só grava o que mudou.
import { spawnSync } from 'node:child_process';
import {
  existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PASTA_FONTE = join(RAIZ, 'scripts', 'rules-local');
const ARQUIVO_MODELO_AVISO = join(PASTA_FONTE, 'aviso-agents.md');
const PASTA_DESTINO = 'rules-local';
const SCRIPT_SESSAO = 'sessao.mjs';
const SCRIPT_CONFERIR = 'conferir.mjs';
const EXTENSAO_SCRIPT = '.mjs';
/** Arquivos fixos do `rules-local/` (F3). */
const ARQUIVOS_FIXOS = {
  '.gitattributes': '* text eol=lf\n', '.gitignore': '.trava\njev/saidas/\n',
};
const ARQUIVO_CONFIGURACAO = join('.claude', 'settings.json');
/**
 * Ganchos do projeto: o de início de sessão (F6) e o de prompt do Jev (RULES-LOCAL-JEV.3, C44).
 * `trecho` identifica o gancho já instalado (com `/` ou `\`); o item só é acrescentado se faltar.
 */
const GANCHOS_CLAUDE = [
  {
    evento: 'SessionStart',
    trecho: 'rules-local/sessao.mjs',
    item: {
      matcher: 'startup',
      hooks: [{ type: 'command', command: 'node "$CLAUDE_PROJECT_DIR/rules-local/sessao.mjs"',
        timeout: 30 }],
    },
  },
  {
    evento: 'UserPromptSubmit',
    trecho: 'rules-local/jev/ganchos/claude-prompt.mjs',
    item: {
      hooks: [{ type: 'command',
        command: 'node "$CLAUDE_PROJECT_DIR/rules-local/jev/ganchos/claude-prompt.mjs"',
        timeout: 10 }],
    },
  },
];
/** Gancho de prompt do Codex no projeto (RULES-LOCAL-JEV.4): o Codex roda na raiz do projeto. */
const ARQUIVO_GANCHOS_CODEX = join('.codex', 'hooks.json');
const GANCHOS_CODEX = [
  {
    evento: 'UserPromptSubmit',
    trecho: 'rules-local/jev/ganchos/codex-prompt.mjs',
    item: {
      hooks: [{ type: 'command', command: 'node rules-local/jev/ganchos/codex-prompt.mjs' }],
    },
  },
];
/** Onde vai o aviso: o primeiro que existir na raiz do projeto. */
const ARQUIVOS_AVISO = ['AGENTS.md', 'CLAUDE.md'];
const MARCA_INICIO = '<!-- rules-local:inicio -->';
const MARCA_FIM = '<!-- rules-local:fim -->';
/** Pastas fora do escopo (C20, C23): nunca instalar dentro delas. */
const PREFIXO_PASTA_PROIBIDA = 'DEMAIS-PROJETOS-';
const PREFIXO = 'instalar-rules-local:';
const TEMPO_LIMITE_SESSAO_MS = 60000;
const RECUO_PADRAO = '  ';
/** Estilo do `settings.json` criado do zero. */
const ESTILO_ARQUIVO_NOVO = {
  bom: false, fimDeLinha: '\n', recuo: RECUO_PADRAO, terminaComLinha: true,
};
const SITUACAO_CRIADO = 'criado';
const SITUACAO_ATUALIZADO = 'atualizado';
const SITUACAO_IGUAL = 'igual';

/**
 * Tira o BOM do início e troca `\r\n` por `\n` (mesma normalização de F1).
 * @param {string} texto
 * @returns {string}
 */
function normalizarTexto(texto) {
  return texto.replace(/^﻿/, '').replace(/\r\n/g, '\n');
}

/**
 * Lê um arquivo de texto.
 * @param {string} caminho
 * @returns {string|null} Conteúdo, ou null quando o arquivo não existe.
 */
function lerTextoOuNulo(caminho) {
  return existsSync(caminho) ? readFileSync(caminho, 'utf8') : null;
}

/**
 * Confere se um valor é um objeto comum (não nulo e não vetor).
 * @param {unknown} valor
 * @returns {boolean}
 */
function ehObjeto(valor) {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

/**
 * Confere a pasta do projeto recebida na linha de comando.
 * @param {string|undefined} argumento Caminho da pasta (absoluto ou relativo à pasta atual).
 * @returns {string} Caminho absoluto do projeto.
 * @throws {Error} Sem argumento, pasta inexistente, fora do escopo ou sem Git.
 */
function validarProjeto(argumento) {
  if (!argumento) throw new Error('uso: node scripts/instalar-rules-local.mjs <pasta-do-projeto>');

  const projeto = resolve(argumento);
  if (!existsSync(projeto) || !statSync(projeto).isDirectory()) {
    throw new Error(`pasta não existe: ${projeto}`);
  }
  if (projeto.toLowerCase() === RAIZ.toLowerCase()) {
    throw new Error('o próprio rules-ai não recebe rules-local/ (ele é a fonte)');
  }
  const estaEmPastaProibida = projeto.split(/[\\/]/)
    .some((parte) => parte.startsWith(PREFIXO_PASTA_PROIBIDA));
  if (estaEmPastaProibida) throw new Error(`pasta fora do escopo (C20/C23): ${projeto}`);
  if (!existsSync(join(projeto, '.git'))) throw new Error(`não é repositório Git: ${projeto}`);
  return projeto;
}

/**
 * Planeja a cópia dos `*.mjs` de scripts/rules-local/ e os arquivos fixos (F3).
 * Os scripts vão com fim de linha LF, igual ao checkout com `* text eol=lf`.
 * @param {string} pastaRulesLocal Pasta `rules-local/` do projeto.
 * @returns {{caminho: string, texto: string}[]}
 * @throws {Error} Sem scripts na fonte ou sem o `sessao.mjs`.
 */
function planejarScripts(pastaRulesLocal) {
  const scripts = existsSync(PASTA_FONTE)
    ? readdirSync(PASTA_FONTE).filter((nome) => nome.endsWith(EXTENSAO_SCRIPT)).sort()
    : [];
  if (!scripts.includes(SCRIPT_SESSAO)) {
    throw new Error(`falta ${SCRIPT_SESSAO} em ${PASTA_FONTE}`);
  }

  const operacoesScripts = scripts.map((nome) => ({
    caminho: join(pastaRulesLocal, nome),
    texto: normalizarTexto(readFileSync(join(PASTA_FONTE, nome), 'utf8')),
  }));
  const operacoesFixas = Object.entries(ARQUIVOS_FIXOS)
    .map(([nome, texto]) => ({ caminho: join(pastaRulesLocal, nome), texto }));
  return [...operacoesScripts, ...operacoesFixas];
}

/**
 * Descobre o estilo de um JSON existente para regravá-lo do mesmo jeito.
 * @param {string|null} texto Conteúdo atual, ou null quando o arquivo não existe.
 * @returns {{bom: boolean, fimDeLinha: string, recuo: string, terminaComLinha: boolean}}
 */
function detectarEstilo(texto) {
  if (texto === null) return { ...ESTILO_ARQUIVO_NOVO };

  return {
    bom: texto.startsWith('﻿'),
    fimDeLinha: texto.includes('\r\n') ? '\r\n' : '\n',
    recuo: texto.match(/^([ \t]+)\S/m)?.[1] ?? RECUO_PADRAO,
    terminaComLinha: /\n$/.test(texto),
  };
}

/**
 * Lê um JSON de ganchos (`.claude/settings.json` ou `.codex/hooks.json`) e confere a parte de
 * ganchos.
 * @param {string|null} texto Conteúdo atual, ou null quando o arquivo não existe.
 * @param {{caminho: string, eventos: string[]}} alvo Caminho (só nas mensagens) e eventos usados.
 * @returns {object} Configuração lida (vazia sem arquivo).
 * @throws {Error} JSON inválido ou `hooks`/`hooks.<evento>` com tipo errado.
 */
function lerConfiguracao(texto, alvo) {
  const { caminho } = alvo;
  if (texto === null) return {};

  let dados;
  try {
    dados = JSON.parse(texto.replace(/^﻿/, ''));
  } catch (erro) {
    throw new Error(`JSON inválido em ${caminho}: ${erro.message}`);
  }
  if (!ehObjeto(dados)) throw new Error(`${caminho} não é um objeto JSON`);
  if (dados.hooks !== undefined && !ehObjeto(dados.hooks)) {
    throw new Error(`"hooks" não é objeto em ${caminho}`);
  }
  const eventoInvalido = alvo.eventos.find(
    (evento) => dados.hooks?.[evento] !== undefined && !Array.isArray(dados.hooks[evento]),
  );
  if (eventoInvalido) throw new Error(`"hooks.${eventoInvalido}" não é vetor em ${caminho}`);
  return dados;
}

/**
 * Diz se algum item do evento já chama o script do gancho (F6).
 * @param {object} dados Configuração lida.
 * @param {{evento: string, trecho: string}} gancho Evento e trecho do comando.
 * @returns {boolean}
 */
function temGancho(dados, gancho) {
  const comandos = (dados.hooks?.[gancho.evento] ?? [])
    .flatMap((item) => (Array.isArray(item?.hooks) ? item.hooks : []))
    .map((item) => (typeof item?.command === 'string' ? item.command : ''));
  return comandos.some((comando) => comando.replace(/\\/g, '/').includes(gancho.trecho));
}

/**
 * Planeja os ganchos de um arquivo: acrescenta os que faltam ao vetor do evento, sem apagar
 * nada; todos já existem → nada a fazer; sem arquivo → cria só com os ganchos.
 * @param {string} projeto Pasta do projeto.
 * @param {{arquivo: string, ganchos: object[]}} alvo Arquivo relativo e ganchos desejados.
 * @returns {{caminho: string, texto: string}|null} Operação, ou null se nada falta.
 * @throws {Error} Configuração inválida (ver `lerConfiguracao`).
 */
function planejarGanchos(projeto, alvo) {
  const caminho = join(projeto, alvo.arquivo);
  const atual = lerTextoOuNulo(caminho);
  const eventos = alvo.ganchos.map((gancho) => gancho.evento);
  const dados = lerConfiguracao(atual, { caminho, eventos });
  const faltando = alvo.ganchos.filter((gancho) => !temGancho(dados, gancho));
  if (faltando.length === 0) return null;

  const novo = structuredClone(dados);
  novo.hooks ??= {};
  for (const gancho of faltando) {
    novo.hooks[gancho.evento] ??= [];
    novo.hooks[gancho.evento].push(structuredClone(gancho.item));
  }

  const estilo = detectarEstilo(atual);
  const corpo = JSON.stringify(novo, null, estilo.recuo).replace(/\n/g, estilo.fimDeLinha);
  const final = estilo.terminaComLinha ? estilo.fimDeLinha : '';
  return { caminho, texto: `${estilo.bom ? '﻿' : ''}${corpo}${final}` };
}

/**
 * Lê o modelo do aviso (`scripts/rules-local/aviso-agents.md`, da `.13`), sem as marcas.
 * @returns {string} Texto do aviso com fim de linha LF, sem linhas em branco nas pontas.
 * @throws {Error} Modelo ausente ou vazio.
 */
function lerModeloAviso() {
  const texto = normalizarTexto(lerTextoOuNulo(ARQUIVO_MODELO_AVISO) ?? '')
    .replace(MARCA_INICIO, '')
    .replace(MARCA_FIM, '')
    .trim();
  if (!texto) throw new Error(`modelo do aviso ausente ou vazio: ${ARQUIVO_MODELO_AVISO}`);
  return texto;
}

/**
 * Põe o bloco do aviso no texto: troca o bloco que já existe ou acrescenta no fim.
 * @param {string} atual Conteúdo atual do AGENTS.md/CLAUDE.md.
 * @param {string} aviso Texto do aviso (LF).
 * @param {string} caminho Usado só nas mensagens de erro.
 * @returns {string} Conteúdo novo, no mesmo fim de linha do arquivo.
 * @throws {Error} Marca de início sem a de fim (ou o contrário).
 */
function montarTextoComAviso(atual, aviso, caminho) {
  const fimDeLinha = atual.includes('\r\n') ? '\r\n' : '\n';
  const bloco = [MARCA_INICIO, aviso, MARCA_FIM].join('\n').replace(/\n/g, fimDeLinha);
  const inicio = atual.indexOf(MARCA_INICIO);
  const fim = inicio < 0 ? atual.indexOf(MARCA_FIM) : atual.indexOf(MARCA_FIM, inicio);
  const marcasIncompletas = (inicio < 0) !== (fim < 0);
  if (marcasIncompletas) throw new Error(`marcas do rules-local incompletas em ${caminho}`);

  if (inicio >= 0) return atual.slice(0, inicio) + bloco + atual.slice(fim + MARCA_FIM.length);
  const semFinal = atual.replace(/(\r?\n)+$/, '');
  if (!semFinal) return `${bloco}${fimDeLinha}`;
  return `${semFinal}${fimDeLinha}${fimDeLinha}${bloco}${fimDeLinha}`;
}

/**
 * Planeja o aviso no AGENTS.md (sem ele, no CLAUDE.md); sem nenhum dos dois, avisa e pula.
 * @param {string} projeto Pasta do projeto.
 * @returns {{caminho: string, texto: string}|null} Operação, ou null quando não há arquivo.
 * @throws {Error} Modelo do aviso ausente ou marcas incompletas.
 */
function planejarAviso(projeto) {
  const aviso = lerModeloAviso();
  const nome = ARQUIVOS_AVISO.find((arquivo) => existsSync(join(projeto, arquivo)));
  if (!nome) {
    console.warn(`${PREFIXO} aviso pulado: o projeto não tem ${ARQUIVOS_AVISO.join(' nem ')}`);
    return null;
  }

  const caminho = join(projeto, nome);
  return { caminho, texto: montarTextoComAviso(readFileSync(caminho, 'utf8'), aviso, caminho) };
}

/**
 * Grava a operação só quando o conteúdo muda (idempotência).
 * @param {{caminho: string, texto: string}} operacao
 * @returns {string} Situação: criado, atualizado ou igual.
 */
function aplicarOperacao(operacao) {
  const atual = lerTextoOuNulo(operacao.caminho);
  if (atual === operacao.texto) return SITUACAO_IGUAL;

  mkdirSync(dirname(operacao.caminho), { recursive: true });
  writeFileSync(operacao.caminho, operacao.texto, 'utf8');
  return atual === null ? SITUACAO_CRIADO : SITUACAO_ATUALIZADO;
}

/**
 * Roda o `rules-local/sessao.mjs` do projeto (baixa as regras da nuvem), com a saída dele
 * na tela. O ambiente passa adiante (`RULES_LOCAL_URL_BASE` serve para simular, F7).
 * @param {string} projeto Pasta do projeto.
 * @param {string} pastaRulesLocal Pasta `rules-local/` do projeto.
 */
function rodarSessao(projeto, pastaRulesLocal) {
  console.log(`${PREFIXO} rodando ${PASTA_DESTINO}/${SCRIPT_SESSAO}…`);
  const resultado = spawnSync(process.execPath, [join(pastaRulesLocal, SCRIPT_SESSAO)], {
    cwd: projeto,
    stdio: 'inherit',
    timeout: TEMPO_LIMITE_SESSAO_MS,
  });
  if (resultado.error) {
    console.warn(`${PREFIXO} falha ao rodar a sessão: ${resultado.error.message}`);
  }
}

/**
 * Confere a pasta instalada com o `conferirPasta` do próprio `rules-local/` (F4, `.9`).
 * @param {string} pastaRulesLocal Pasta `rules-local/` do projeto.
 * @returns {Promise<boolean>} true quando a pasta está íntegra.
 */
async function conferirInstalacao(pastaRulesLocal) {
  const caminho = join(pastaRulesLocal, SCRIPT_CONFERIR);
  if (!existsSync(caminho)) {
    console.warn(`${PREFIXO} sem ${SCRIPT_CONFERIR}: conferência final não feita`);
    return false;
  }

  const { conferirPasta } = await import(pathToFileURL(caminho).href);
  const resultado = conferirPasta(pastaRulesLocal);
  if (resultado.integro) {
    console.log(`${PREFIXO} rules-local íntegro (versão ${resultado.versao}).`);
    return true;
  }
  const problemas = (resultado.arquivos ?? []).map((item) => `${item.arquivo} ${item.problema}`);
  console.warn(`${PREFIXO} rules-local NÃO íntegro: ${resultado.motivo} ${problemas.join(', ')}`);
  return false;
}

/**
 * Planeja tudo (falha antes de gravar qualquer coisa), grava o que mudou, roda a sessão e
 * confere a instalação.
 * @returns {Promise<number>} Código de saída: 0 instalado e íntegro; 1 erro ou incompleto.
 */
async function principal() {
  const projeto = validarProjeto(process.argv[2]);
  const pastaRulesLocal = join(projeto, PASTA_DESTINO);
  const scripts = planejarScripts(pastaRulesLocal);
  const ganchoClaude = planejarGanchos(projeto, {
    arquivo: ARQUIVO_CONFIGURACAO, ganchos: GANCHOS_CLAUDE,
  });
  const ganchoCodex = planejarGanchos(projeto, {
    arquivo: ARQUIVO_GANCHOS_CODEX, ganchos: GANCHOS_CODEX,
  });
  const aviso = planejarAviso(projeto);
  if (!ganchoClaude) console.log(`${PREFIXO} ganchos já existem em ${ARQUIVO_CONFIGURACAO}`);
  if (!ganchoCodex) console.log(`${PREFIXO} gancho já existe em ${ARQUIVO_GANCHOS_CODEX}`);
  const operacoes = [...scripts, ganchoClaude, ganchoCodex, aviso].filter(Boolean);

  const contagem = { [SITUACAO_CRIADO]: 0, [SITUACAO_ATUALIZADO]: 0, [SITUACAO_IGUAL]: 0 };
  operacoes.forEach((operacao) => {
    const situacao = aplicarOperacao(operacao);
    contagem[situacao] += 1;
    console.log(`${PREFIXO} ${situacao} ${relative(projeto, operacao.caminho)}`);
  });
  console.log(`${PREFIXO} ${contagem[SITUACAO_CRIADO]} criado, `
    + `${contagem[SITUACAO_ATUALIZADO]} atualizado, ${contagem[SITUACAO_IGUAL]} igual.`);

  rodarSessao(projeto, pastaRulesLocal);
  return (await conferirInstalacao(pastaRulesLocal)) ? 0 : 1;
}

try {
  process.exitCode = await principal();
} catch (erro) {
  console.error(`${PREFIXO} erro: ${erro.message}`);
  process.exitCode = 1;
}
