#!/usr/bin/env node
/**
 * Testes do gerenciador centralizado (GERENCIADOR-GLOBAL.8, etapa 009).
 *
 * Cria repositórios e quadros SINTÉTICOS numa pasta temporária (os.tmpdir()), roda o
 * `scripts/gerenciador.mjs` com `--sem-fetch` e confere: livres por modelo, dependências,
 * exclusões, modelo pelo nível, recusa de `--modo disparar`, leitura sem escrita e exclusão
 * das pastas DEMAIS-PROJETOS-*. Não toca nos quadros reais e não abre sessão de IA.
 *
 * Uso: node scripts/gerenciador/testes/gerenciador.mjs
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';

import { principal } from '../../gerenciador.mjs';

const SAIDA_OK = 0;
const SAIDA_NADA_LIDO = 1;
const SAIDA_USO_INVALIDO = 2;
const PREFIXO_TEMPORARIO = 'gerenciador-teste-';
const MODELOS_TESTE = ['Haiku', 'Sonnet', 'Opus', 'Fable'];
const MATRIZ_TESTE = { LEVE: ['Haiku'], MEDIO: ['Sonnet'], PESADO: ['Sonnet', 'Opus', 'Fable'] };
const CABECALHO_QUADRO = [
  'Tarefa', 'Título', 'Prioridade', 'Modelo', 'Depende de', 'Status', 'Em uso por', 'Etapa',
];
const CABECALHO_SEM_MODELO = [
  'Tarefa', 'Título', 'Prioridade', 'Depende de', 'Status', 'Em uso por', 'Etapa',
];
const AMBIENTE_GIT = {
  GIT_AUTHOR_NAME: 'Teste sintetico',
  GIT_AUTHOR_EMAIL: 'teste@example.invalid',
  GIT_COMMITTER_NAME: 'Teste sintetico',
  GIT_COMMITTER_EMAIL: 'teste@example.invalid',
};
const PASTA_PERMITIDA_A = 'SINT-A';
const PASTA_PERMITIDA_B = 'SINT-B';
const PASTA_PROIBIDA = 'DEMAIS-PROJETOS-TESTE';
const ID_PROIBIDO = 'PROIBIDO-1';
const MOTIVOS_SINTETICO_A = {
  mae: 1,
  status: 4,
  reservada: 1,
  nuvem: 1,
  'sem-nivel': 1,
  usuario: 1,
  dependencia: 1,
  livre: 5,
};

/**
 * Junta as células de uma linha numa linha de tabela Markdown.
 * @param {string[]} celulas - Textos das colunas.
 * @returns {string} Linha no formato `| a | b |`.
 */
function linhaTabela(celulas) {
  return `| ${celulas.join(' | ')} |`;
}

/**
 * Monta um quadro sintético: título, seção de tarefas e a tabela.
 * @param {string} titulo - Título do arquivo.
 * @param {string[]} cabecalho - Nomes das colunas.
 * @param {string[][]} linhas - Células de cada linha.
 * @returns {string} Texto do arquivo.
 */
function montarQuadro(titulo, cabecalho, linhas) {
  const separador = cabecalho.map(() => '---');
  const tabela = [cabecalho, separador, ...linhas].map(linhaTabela);
  return [`# ${titulo}`, '', '## 📌 Tarefas', '', ...tabela, ''].join('\n');
}

/**
 * Monta as células de uma linha com a coluna Modelo (valores padrão para o que faltar).
 * @param {Object} campos - Valores da linha.
 * @returns {string[]} Células na ordem de CABECALHO_QUADRO.
 */
function linhaComModelo(campos) {
  const {
    id,
    titulo,
    prioridade = '🟡 Média',
    modelo = '—',
    dependencia = '—',
    status = '⬜ Pendente',
    emUso = '—',
    etapa = 'ETAPA-A',
  } = campos;
  return [id, titulo, prioridade, modelo, dependencia, status, emUso, etapa];
}

const LINHAS_A = [
  linhaComModelo({ id: '**SINT-A**', titulo: 'Mãe sintética', emUso: '— (não reservável)' }),
  linhaComModelo({
    id: 'SINT-A.1',
    titulo: 'Livre para Haiku, sem dependência',
    prioridade: '🔴 Máxima',
    modelo: 'LEVE · só Haiku',
  }),
  linhaComModelo({
    id: 'SINT-A.2',
    titulo: 'Espera a SINT-A.3, que está aberta',
    prioridade: '🟠 Alta',
    modelo: 'LEVE · só Haiku',
    dependencia: 'SINT-A.3',
  }),
  linhaComModelo({ id: 'SINT-A.3', titulo: 'Livre para Sonnet', modelo: 'MEDIO · só Sonnet' }),
  linhaComModelo({
    id: 'SINT-A.4',
    titulo: 'Espera a SINT-A.6, já concluída no STATUS',
    modelo: 'MEDIO · só Sonnet',
    dependencia: 'SINT-A.6',
  }),
  linhaComModelo({
    id: 'SINT-A.5',
    titulo: 'Reservada por Opus',
    prioridade: '🟠 Alta',
    modelo: 'PESADO · só Opus 5.5+ ou Fable',
    status: '🔄 Em execução',
    emUso: 'Claude Code (Opus 5.5) (local · main) (desde 2026-10-23 10:00)',
  }),
  linhaComModelo({
    id: 'SINT-A.6',
    titulo: 'Já concluída',
    modelo: 'LEVE · só Haiku',
    status: '✅ Concluído',
  }),
  linhaComModelo({
    id: 'SINT-A.7',
    titulo: 'Bloqueada por falta de acesso',
    modelo: 'LEVE · só Haiku',
    status: '⛔ Bloqueado (falta acesso)',
  }),
  linhaComModelo({
    id: 'SINT-A.8',
    titulo: 'Aguarda decisão do usuário',
    modelo: 'Usuário',
    status: '👀 Aguardando o usuário',
  }),
  linhaComModelo({
    id: 'SINT-A.9',
    titulo: 'Espera a SINT-A.10, concluída no task_complete',
    prioridade: '🟢 Baixa',
    modelo: 'PESADO · só Opus 5.5+ ou Fable',
    dependencia: 'SINT-A.10',
  }),
  linhaComModelo({ id: 'SINT-A.11', titulo: 'Sem nível definido', modelo: 'sem nível' }),
  linhaComModelo({
    id: 'SINT-A.12',
    titulo: 'Depende de algo fora do quadro',
    modelo: 'LEVE · só Haiku',
    dependencia: 'SINT-A.99',
  }),
  linhaComModelo({
    id: 'SINT-A.13',
    titulo: 'Ainda ⬜, mas já com reserva',
    modelo: 'LEVE · só Haiku',
    emUso: 'Claude Code (Haiku 5.5) (local · main)',
  }),
  linhaComModelo({
    id: 'SINT-A.14',
    titulo: 'Só para a nuvem',
    modelo: 'LEVE · só Haiku (nuvem)',
  }),
  linhaComModelo({ id: 'SINT-A.15', titulo: 'Tarefa do usuário', modelo: 'Usuário' }),
];

const LINHA_CONCLUIDA_A = linhaComModelo({
  id: 'SINT-A.10',
  titulo: 'Concluída antes, no task_complete',
  modelo: 'PESADO · só Opus 5.5+ ou Fable',
  status: '✅ Concluído',
});

const QUADRO_A_STATUS = montarQuadro('STATUS — Sintético A', CABECALHO_QUADRO, LINHAS_A);
const QUADRO_A_CONCLUIDAS = montarQuadro(
  'Concluídas — Sintético A',
  CABECALHO_QUADRO,
  [LINHA_CONCLUIDA_A],
);

const LINHAS_B = [
  ['SINT-B.1', 'Ajustar parser `LEVE`', '🟡 Média', '—', '⬜ Pendente', '—', 'ETAPA-B'],
  ['SINT-B.2', 'Ajustar tela `MEDIO`', '🟡 Média', '—', '⬜ Pendente', '—', 'ETAPA-B'],
  ['SINT-B.3', 'Mexer no banco `PESADO`', '🟡 Média', '—', '⬜ Pendente', '—', 'ETAPA-B'],
];
const QUADRO_B_STATUS = montarQuadro('STATUS — Sintético B', CABECALHO_SEM_MODELO, LINHAS_B);

const QUADRO_PROIBIDO = montarQuadro('STATUS — Proibido', CABECALHO_QUADRO, [
  [ID_PROIBIDO, 'Não pode ser lido', '🔴 Máxima', 'LEVE · só Haiku', '—', '⬜ Pendente', '—',
    'ETAPA-X'],
]);

/**
 * Roda um comando do Git numa pasta (só para criar o repositório sintético).
 * @param {string} pasta - Pasta do repositório.
 * @param {string[]} argumentos - Argumentos do Git.
 * @returns {string} Saída do comando, sem espaços nas pontas.
 */
function git(pasta, argumentos) {
  return execFileSync('git', ['-C', pasta, ...argumentos], {
    env: { ...process.env, ...AMBIENTE_GIT },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  }).trim();
}

/**
 * Cria o repositório sintético: um commit, um remoto falso e a referência origin/main.
 * @param {string} pasta - Pasta onde os arquivos já foram escritos.
 * @param {string} urlOrigem - URL falsa do remoto (não é acessada).
 * @returns {void}
 */
function criarRepositorio(pasta, urlOrigem) {
  git(pasta, ['init', '-q']);
  git(pasta, ['add', '-A']);
  git(pasta, ['-c', 'commit.gpgsign=false', 'commit', '--no-verify', '-q', '-m', 'sintetico']);
  git(pasta, ['remote', 'add', 'origin', urlOrigem]);
  git(pasta, ['update-ref', 'refs/remotes/origin/main', 'HEAD']);
}

/**
 * Escreve um arquivo, criando as pastas que faltarem.
 * @param {string} caminho - Caminho do arquivo.
 * @param {string} texto - Conteúdo.
 * @returns {void}
 */
function escreverArquivo(caminho, texto) {
  mkdirSync(dirname(caminho), { recursive: true });
  writeFileSync(caminho, texto, 'utf8');
}

/**
 * Cria um projeto sintético: quadro, arquivo de concluídas (opcional) e repositório Git.
 * @param {{raiz: string, pasta: string, status: string, concluidas: string|null,
 *   origem: string}} projeto - Dados do projeto.
 * @returns {void}
 */
function criarProjeto({ raiz, pasta, status, concluidas = null, origem }) {
  const caminho = join(raiz, pasta);
  escreverArquivo(join(caminho, 'tasks', 'STATUS.md'), status);
  if (concluidas) escreverArquivo(join(caminho, 'tasks', 'task_complete.md'), concluidas);
  criarRepositorio(caminho, origem);
}

/**
 * Escreve uma configuração sintética do gerenciador (com `raiz` e os projetos dados).
 * @param {{base: string, nome: string, raiz: string, quadros: Object[]}} dados - Dados.
 * @returns {string} Caminho do arquivo de configuração.
 */
function escreverConfiguracao({ base, nome, raiz, quadros }) {
  const caminho = join(base, nome);
  const configuracao = {
    modo: 'ver',
    raiz,
    ramo: 'origin/main',
    arquivosQuadro: ['tasks/STATUS.md', 'STATUS.md'],
    arquivosConcluidas: ['tasks/task_complete.md', 'task_complete.md'],
    timeoutGitSegundos: 60,
    limiteLinhasPorModelo: 10,
    dependenciaAusente: 'pronta',
    modelos: MODELOS_TESTE,
    matrizNivelModelos: MATRIZ_TESTE,
    projetos: quadros,
  };
  escreverArquivo(caminho, JSON.stringify(configuracao, null, 2));
  return caminho;
}

/**
 * Cria a pasta temporária do teste (fora dos projetos reais).
 * @returns {string} Caminho da pasta criada.
 */
function criarBase() {
  return mkdtempSync(join(tmpdir(), PREFIXO_TEMPORARIO));
}

/**
 * Prepara o cenário inteiro: três projetos sintéticos e duas configurações.
 * @param {string} base - Pasta temporária do teste.
 * @returns {{base: string, raiz: string, configPrincipal: string, configDemais: string}}
 *   Caminhos do cenário.
 */
function prepararCenario(base) {
  const raiz = join(base, 'projetos');
  const projetos = [
    { pasta: PASTA_PERMITIDA_A, status: QUADRO_A_STATUS, concluidas: QUADRO_A_CONCLUIDAS },
    { pasta: PASTA_PERMITIDA_B, status: QUADRO_B_STATUS, concluidas: null },
    { pasta: PASTA_PROIBIDA, status: QUADRO_PROIBIDO, concluidas: null },
  ];
  for (const projeto of projetos) {
    const origem = `https://example.invalid/sintetico/${projeto.pasta.toLowerCase()}.git`;
    criarProjeto({ raiz, origem, ...projeto });
  }
  return {
    base,
    raiz,
    configPrincipal: escreverConfiguracao({
      base,
      nome: 'config-principal.json',
      raiz,
      quadros: [{ pasta: PASTA_PERMITIDA_A }, { pasta: PASTA_PERMITIDA_B }],
    }),
    configDemais: escreverConfiguracao({
      base,
      nome: 'config-demais.json',
      raiz,
      quadros: [{ pasta: '*' }, { pasta: PASTA_PROIBIDA }],
    }),
  };
}

/**
 * Lista os arquivos de uma pasta, em todos os níveis.
 * @param {string} pasta - Pasta a percorrer.
 * @param {boolean} ignorarGit - Se true, pula a pasta `.git`.
 * @returns {string[]} Caminhos completos dos arquivos.
 */
function listarArquivos(pasta, ignorarGit) {
  const arquivos = [];
  for (const entrada of readdirSync(pasta, { withFileTypes: true })) {
    const caminho = join(pasta, entrada.name);
    if (ignorarGit && entrada.name === '.git') continue;
    if (entrada.isDirectory()) arquivos.push(...listarArquivos(caminho, ignorarGit));
    else arquivos.push(caminho);
  }
  return arquivos;
}

/**
 * Tira uma fotografia da pasta: hash do conteúdo de cada arquivo.
 * @param {string} pasta - Pasta a fotografar.
 * @param {boolean} ignorarGit - Se true, não inclui a pasta `.git`.
 * @returns {Object<string, string>} Caminho relativo -> sha256 do conteúdo.
 */
function fotografarPasta(pasta, ignorarGit = true) {
  const fotografia = {};
  for (const caminho of listarArquivos(pasta, ignorarGit)) {
    const hash = createHash('sha256').update(readFileSync(caminho)).digest('hex');
    fotografia[relative(pasta, caminho)] = hash;
  }
  return fotografia;
}

/**
 * Apaga a pasta temporária, tirando o atributo de somente leitura dos arquivos do Git.
 * @param {string} pasta - Pasta a apagar.
 * @returns {void}
 */
function apagarPasta(pasta) {
  if (!existsSync(pasta)) return;
  for (const arquivo of listarArquivos(pasta, false)) chmodSync(arquivo, 0o666);
  rmSync(pasta, { recursive: true, force: true, maxRetries: 3 });
}

/**
 * Roda o gerenciador em processo, capturando o que ele imprimiria.
 * @param {string[]} argumentos - Argumentos da linha de comando.
 * @returns {Promise<{codigo: number, stdout: string, stderr: string}>} Resultado capturado.
 */
async function executarGerenciador(argumentos) {
  const capturado = { stdout: [], stderr: [] };
  const logOriginal = console.log;
  const erroOriginal = console.error;
  console.log = (...itens) => capturado.stdout.push(itens.join(' '));
  console.error = (...itens) => capturado.stderr.push(itens.join(' '));
  try {
    const codigo = await principal(argumentos);
    return { codigo, stdout: capturado.stdout.join('\n'), stderr: capturado.stderr.join('\n') };
  } finally {
    console.log = logOriginal;
    console.error = erroOriginal;
  }
}

/**
 * Lê o resultado em JSON do gerenciador com a configuração dada (sem rede).
 * @param {string} caminhoConfig - Configuração a usar.
 * @param {string[]} extras - Opções extras (ex.: --projeto).
 * @returns {Promise<Object[]>} Resultado de cada projeto.
 */
async function lerJsonDe(caminhoConfig, extras) {
  const saida = await executarGerenciador([
    '--json', '--sem-fetch', '--config', caminhoConfig, ...extras,
  ]);
  assert.equal(saida.codigo, SAIDA_OK, saida.stderr);
  return JSON.parse(saida.stdout);
}

/**
 * Devolve o quadro calculado de um projeto do cenário principal.
 * @param {Object} cenario - Cenário preparado.
 * @param {string} pasta - Nome da pasta do projeto.
 * @returns {Promise<Object>} Quadro calculado.
 */
async function quadroDe(cenario, pasta) {
  const dados = await lerJsonDe(cenario.configPrincipal, []);
  const resultado = dados.find((item) => item.pasta === pasta);
  assert.ok(resultado, `o projeto ${pasta} não apareceu na saída`);
  return resultado.quadro;
}

/**
 * Lista os IDs das subtarefas livres que um modelo pode pegar, na ordem do resultado.
 * @param {Object} quadro - Quadro calculado.
 * @param {string} chave - Chave do modelo (ex.: "haiku").
 * @returns {string[]} IDs das subtarefas.
 */
function idsLivresDo(quadro, chave) {
  return quadro.livres.filter((livre) => livre.chaves.includes(chave)).map((livre) => livre.id);
}

/**
 * Procura uma subtarefa livre pelo ID.
 * @param {Object} quadro - Quadro calculado.
 * @param {string} id - ID da subtarefa.
 * @returns {Object|undefined} Subtarefa livre, ou undefined se não estiver livre.
 */
function livreDe(quadro, id) {
  return quadro.livres.find((livre) => livre.id === id);
}

/**
 * Resume o que importa sobre o nível e os modelos de uma subtarefa livre.
 * @param {Object|undefined} livre - Subtarefa livre (ou undefined).
 * @returns {{nivel: string, chaves: string[], derivado: boolean}} Resumo.
 */
function resumoLivre(livre) {
  return { nivel: livre?.nivel, chaves: livre?.chaves, derivado: livre?.derivado };
}

/**
 * Teste 1: cada modelo recebe só as livres que pode pegar, em ordem de prioridade.
 * @param {Object} cenario - Cenário preparado.
 * @returns {Promise<void>}
 */
async function testeLivresPorModelo(cenario) {
  const quadro = await quadroDe(cenario, PASTA_PERMITIDA_A);
  assert.deepEqual(idsLivresDo(quadro, 'haiku'), ['SINT-A.1', 'SINT-A.12']);
  assert.deepEqual(idsLivresDo(quadro, 'sonnet'), ['SINT-A.3', 'SINT-A.4']);
  assert.deepEqual(idsLivresDo(quadro, 'opus'), ['SINT-A.9']);
  assert.deepEqual(idsLivresDo(quadro, 'fable'), ['SINT-A.9']);
}

/**
 * Teste 2: dependência aberta bloqueia; dependência concluída ou fora do quadro libera.
 * @param {Object} cenario - Cenário preparado.
 * @returns {Promise<void>}
 */
async function testeDependencias(cenario) {
  const quadro = await quadroDe(cenario, PASTA_PERMITIDA_A);
  assert.equal(livreDe(quadro, 'SINT-A.2'), undefined, 'dependência aberta não pode sair livre');
  assert.ok(livreDe(quadro, 'SINT-A.4'), 'dependência concluída no STATUS deve liberar');
  assert.ok(livreDe(quadro, 'SINT-A.9'), 'dependência concluída no task_complete deve liberar');
  assert.deepEqual(livreDe(quadro, 'SINT-A.12').ausentes, ['SINT-A.99']);
  assert.equal(quadro.motivos.dependencia, 1);
}

/**
 * Teste 3: reservada, bloqueada, aguardando o usuário, mãe, sem nível e nuvem não saem livres.
 * @param {Object} cenario - Cenário preparado.
 * @returns {Promise<void>}
 */
async function testeExclusoes(cenario) {
  const quadro = await quadroDe(cenario, PASTA_PERMITIDA_A);
  assert.deepEqual(quadro.motivos, MOTIVOS_SINTETICO_A);
  const idsLivres = quadro.livres.map((livre) => livre.id);
  for (const id of ['SINT-A', 'SINT-A.5', 'SINT-A.7', 'SINT-A.8', 'SINT-A.13']) {
    assert.ok(!idsLivres.includes(id), `${id} não pode aparecer como livre`);
  }
  assert.deepEqual(quadro.ocupacao.opus, ['SINT-A.5'], 'Opus deve constar como ocupado');
  assert.deepEqual(quadro.ocupacao.haiku, [], 'Haiku não tem linha em execução');
  assert.equal(quadro.totalLinhas, 15);
  assert.equal(quadro.ignoradas, 0);
}

/**
 * Teste 4: sem coluna Modelo, o modelo sai do nível pela matriz da configuração.
 * @param {Object} cenario - Cenário preparado.
 * @returns {Promise<void>}
 */
async function testeModeloPeloNivel(cenario) {
  const quadro = await quadroDe(cenario, PASTA_PERMITIDA_B);
  const leve = { nivel: 'LEVE', chaves: ['haiku'], derivado: true };
  const medio = { nivel: 'MEDIO', chaves: ['sonnet'], derivado: true };
  const pesado = { nivel: 'PESADO', chaves: ['sonnet', 'opus', 'fable'], derivado: true };
  assert.deepEqual(resumoLivre(livreDe(quadro, 'SINT-B.1')), leve);
  assert.deepEqual(resumoLivre(livreDe(quadro, 'SINT-B.2')), medio);
  assert.deepEqual(resumoLivre(livreDe(quadro, 'SINT-B.3')), pesado);
}

/**
 * Teste 5: `--modo disparar` sai com 2, não imprime relatório e não cria nem altera nada.
 * @param {Object} cenario - Cenário preparado.
 * @returns {Promise<void>}
 */
async function testeDispararRecusado(cenario) {
  const antes = fotografarPasta(cenario.base, false);
  const saida = await executarGerenciador([
    '--modo', 'disparar', '--sem-fetch', '--config', cenario.configPrincipal,
  ]);
  assert.equal(saida.codigo, SAIDA_USO_INVALIDO);
  assert.equal(saida.stdout, '', 'nenhum relatório pode sair no modo disparar');
  assert.match(saida.stderr, /disparar/);
  assert.deepEqual(fotografarPasta(cenario.base, false), antes, 'nada pode ser criado');
}

/**
 * Teste 6: filtro de projeto que não existe sai com código 1.
 * @param {Object} cenario - Cenário preparado.
 * @returns {Promise<void>}
 */
async function testeProjetoInexistente(cenario) {
  const saida = await executarGerenciador([
    '--sem-fetch', '--projeto', 'nao-existe', '--config', cenario.configPrincipal,
  ]);
  assert.equal(saida.codigo, SAIDA_NADA_LIDO);
}

/**
 * Teste 7: o gerenciador nunca escreve no quadro (hash igual antes e depois, e mesmo ref).
 * @param {Object} cenario - Cenário preparado.
 * @returns {Promise<void>}
 */
async function testeNaoEscreveNoQuadro(cenario) {
  const pastas = [PASTA_PERMITIDA_A, PASTA_PERMITIDA_B].map((nome) => join(cenario.raiz, nome));
  const antes = pastas.map((pasta) => fotografarPasta(pasta));
  const refsAntes = pastas.map((pasta) => git(pasta, ['rev-parse', 'refs/remotes/origin/main']));
  await executarGerenciador(['--sem-fetch', '--config', cenario.configPrincipal]);
  await executarGerenciador(['--json', '--sem-fetch', '--config', cenario.configPrincipal]);
  const depois = pastas.map((pasta) => fotografarPasta(pasta));
  const refsDepois = pastas.map((pasta) => git(pasta, ['rev-parse', 'refs/remotes/origin/main']));
  assert.ok(antes[0][join('tasks', 'STATUS.md')], 'o quadro sintético deve existir');
  assert.deepEqual(depois, antes, 'nenhum arquivo de projeto pode mudar');
  assert.deepEqual(refsDepois, refsAntes, 'o ramo remoto não pode mudar');
}

/**
 * Teste 8: a pasta DEMAIS-PROJETOS-* nunca é lida, nem pelo padrão `*` nem pelo nome exato.
 * @param {Object} cenario - Cenário preparado.
 * @returns {Promise<void>}
 */
async function testeDemaisNuncaLidas(cenario) {
  const dados = await lerJsonDe(cenario.configDemais, []);
  const lidas = dados.filter((item) => item.estado === 'lido').map((item) => item.pasta);
  assert.ok(lidas.includes(PASTA_PERMITIDA_A), 'o padrão * deve ler as pastas permitidas');
  assert.ok(!lidas.some((pasta) => pasta.startsWith('DEMAIS')), 'DEMAIS não pode ser lida');
  const saidaTexto = await executarGerenciador(['--sem-fetch', '--config', cenario.configDemais]);
  assert.ok(!JSON.stringify(dados).includes(ID_PROIBIDO), 'conteúdo proibido apareceu em JSON');
  assert.ok(!saidaTexto.stdout.includes(ID_PROIBIDO), 'conteúdo proibido apareceu no texto');
}

/**
 * Teste 9: o relatório em texto mostra modelos ociosos, ocupados e as livres.
 * @param {Object} cenario - Cenário preparado.
 * @returns {Promise<void>}
 */
async function testeRelatorioEmTexto(cenario) {
  const saida = await executarGerenciador([
    '--sem-fetch', '--projeto', PASTA_PERMITIDA_A, '--config', cenario.configPrincipal,
  ]);
  assert.equal(saida.codigo, SAIDA_OK, saida.stderr);
  assert.match(saida.stdout, /AVISO: Haiku ocioso com 2 livre\(s\); próxima: SINT-A\.1/);
  assert.match(saida.stdout, /OCUPADO \(SINT-A\.5\)/);
  assert.match(saida.stdout, /Livres para Haiku:/);
}

const TESTES = [
  {
    nome: 'lista as livres de cada modelo, em ordem de prioridade',
    executar: testeLivresPorModelo,
  },
  {
    nome: 'dependência aberta bloqueia; concluída ou fora do quadro libera',
    executar: testeDependencias,
  },
  {
    nome: 'reservada, bloqueada, do usuário, mãe, sem nível e nuvem não saem livres',
    executar: testeExclusoes,
  },
  {
    nome: 'sem coluna Modelo, o modelo sai do nível pela matriz da configuração',
    executar: testeModeloPeloNivel,
  },
  {
    nome: '--modo disparar é recusado com saída 2 e não cria nada',
    executar: testeDispararRecusado,
  },
  { nome: 'projeto que não existe sai com código 1', executar: testeProjetoInexistente },
  {
    nome: 'nunca escreve no quadro (hash igual antes e depois)',
    executar: testeNaoEscreveNoQuadro,
  },
  { nome: 'a pasta DEMAIS-PROJETOS-* nunca é lida', executar: testeDemaisNuncaLidas },
  {
    nome: 'relatório em texto mostra modelos ociosos, ocupados e livres',
    executar: testeRelatorioEmTexto,
  },
];

/**
 * Roda todos os testes em sequência e imprime o resultado de cada um.
 * @param {Object} cenario - Cenário preparado.
 * @returns {Promise<{passaram: number, falharam: number}>} Contagem dos resultados.
 */
async function executarTestes(cenario) {
  const resumo = { passaram: 0, falharam: 0 };
  for (const teste of TESTES) {
    try {
      await teste.executar(cenario);
      resumo.passaram += 1;
      console.log(`ok - ${teste.nome}`);
    } catch (erro) {
      resumo.falharam += 1;
      console.log(`FALHOU - ${teste.nome}: ${erro.message}`);
    }
  }
  return resumo;
}

/**
 * Ponto de entrada: prepara o cenário, roda os testes e apaga a pasta temporária no fim.
 * @returns {Promise<number>} Código de saída (0 só se tudo passou e a pasta foi apagada).
 */
async function principalTestes() {
  const base = criarBase();
  let resumo = { passaram: 0, falharam: 1 };
  try {
    resumo = await executarTestes(prepararCenario(base));
  } finally {
    apagarPasta(base);
  }
  const apagada = !existsSync(base);
  const totais = `${resumo.passaram} passaram, ${resumo.falharam} falharam`;
  console.log(`\n${TESTES.length} testes: ${totais}`);
  console.log(`pasta temporária apagada: ${apagada ? 'sim' : 'NÃO'}`);
  return resumo.falharam === 0 && apagada ? SAIDA_OK : 1;
}

process.exitCode = await principalTestes();
