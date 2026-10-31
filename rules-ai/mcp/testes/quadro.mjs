/**
 * Testes do leitor e do escritor do quadro e da descoberta de projetos (MCP-QUADRO.8).
 *
 * Cobrem a INV-2 e os requisitos R2.1, R2.2 e R3.2 da etapa 026. Usam só repositórios sintéticos
 * numa pasta temporária do sistema, apagada no fim: nunca leem nem gravam quadros reais.
 * Rodar com: node mcp/testes/quadro.mjs
 */

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { CODIGOS_ERRO } from '../config.mjs';
import { listarProjetos, obterProjeto, resolverCaminhoDeTasks } from '../projetos.mjs';
import {
  atualizarLinha,
  dependenciasPendentes,
  gravarArquivoDeTasks,
  lerArquivoDeTasks,
  lerQuadro,
  lerQuadrosDoProjeto,
  serializarQuadro,
  validarQuadro,
} from '../quadro.mjs';

/** Prefixo da pasta temporária criada pelos testes. */
const PREFIXO_TEMPORARIO = 'mcp-quadro-teste-';

/** Fins de linha testados e a marca BOM do UTF-8. */
const EOL_LF = '\n';
const EOL_CRLF = '\r\n';
const MARCA_BOM = '\uFEFF';

/** Nomes e caminhos usados nos repositórios sintéticos. */
const PROJETO_OK = 'projeto-ok';
const ARQUIVO_STATUS = 'tasks/STATUS.md';
const ARQUIVO_CONCLUIDAS = 'tasks/task_complete.md';
const ETAPA_LINK = '[ETAPA-001](etapas/ETAPA-001-teste.md)';
const RESERVA_CLAUDE = 'Claude Code (Sonnet) (local · main) (desde 2026-10-23 10:00)';

/** Cancelada com e sem o caractere de variação (U+FE0F) depois do emoji. */
const CANCELADA_SIMPLES = '\u274C Cancelada';
const CANCELADA_COM_SELETOR = '\u274C\uFE0F Cancelada';

/** Colunas do quadro completo e do quadro sem Modelo e Verificado. */
const COLUNAS_COMPLETAS = [
  'Tarefa',
  'Título',
  'Prioridade',
  'Modelo',
  'Depende de',
  'Status',
  'Em uso por',
  'Etapa',
  'Verificado',
];
const COLUNAS_SIMPLES = ['Tarefa', 'Título', 'Status', 'Em uso por', 'Etapa'];

/** Linhas do quadro completo: mãe, livre, reservada, dependente e cancelada. */
const LINHAS_COMPLETAS = [
  [
    '**TST-1**',
    'Mãe de teste',
    'Alta',
    '—',
    '—',
    '⬜ Pendente',
    '— (não reservável)',
    '—',
    '—',
  ],
  [
    'TST-1.1',
    'Tarefa livre',
    'Média',
    'MEDIO · só Sonnet',
    'Nenhuma',
    '⬜ Pendente',
    '—',
    ETAPA_LINK,
    '—',
  ],
  [
    'TST-1.2',
    'Já reservada',
    'Média',
    'MEDIO · só Sonnet',
    'Nenhuma',
    '🔄 Em execução',
    RESERVA_CLAUDE,
    ETAPA_LINK,
    '—',
  ],
  [
    'TST-1.3',
    'Cancelada',
    'Baixa',
    'LEVE · só Haiku',
    'Nenhuma',
    CANCELADA_SIMPLES,
    '—',
    ETAPA_LINK,
    '—',
  ],
  [
    'TST-1.4',
    'Depende de TST-1.1',
    'Alta',
    'PESADO · só Opus 5.5+ ou Fable',
    'TST-1.1',
    '⬜ Pendente',
    '—',
    ETAPA_LINK,
    '—',
  ],
];

/** Linha do quadro sem Modelo e Verificado. */
const LINHAS_SIMPLES = [['TST-2.1', 'Tarefa simples', '⬜ Pendente', '—', ETAPA_LINK]];

/**
 * Monta uma linha de tabela Markdown a partir das células.
 * @param {string[]} celulas - Textos das células.
 * @returns {string} Linha no formato `| a | b |`.
 */
function linhaTabela(celulas) {
  return `| ${celulas.join(' | ')} |`;
}

/**
 * Monta o texto de um quadro em LF: título, cabeçalho, separador e linhas.
 * @param {string[]} colunas - Nomes das colunas do cabeçalho.
 * @param {string[][]} linhas - Células de cada linha da tabela.
 * @returns {string} Texto do quadro.
 */
function montarQuadro(colunas, linhas) {
  const separador = colunas.map(() => '---');
  const cabecalho = [linhaTabela(colunas), linhaTabela(separador)];
  return ['# STATUS — Teste', '', ...cabecalho, ...linhas.map(linhaTabela), ''].join(EOL_LF);
}

/**
 * Aplica o fim de linha e a marca BOM pedidos a um texto em LF.
 * @param {string} texto - Texto com LF.
 * @param {{eol: string, bom: boolean}} formato - Formato desejado.
 * @returns {string} Texto no formato pedido.
 */
function aplicarFormato(texto, formato) {
  const corpo = texto.split(EOL_LF).join(formato.eol);
  return (formato.bom ? MARCA_BOM : '') + corpo;
}

/**
 * Devolve as colunas do quadro completo com "Status" trocado por "Situação".
 * @returns {string[]} Novo cabeçalho.
 */
function colunasComStatusTrocado() {
  return COLUNAS_COMPLETAS.map((coluna) => (coluna === 'Status' ? 'Situação' : coluna));
}

/** Quadro completo e quadro simples, em LF e sem BOM. */
const TEXTO_QUADRO = montarQuadro(COLUNAS_COMPLETAS, LINHAS_COMPLETAS);
const TEXTO_QUADRO_SIMPLES = montarQuadro(COLUNAS_SIMPLES, LINHAS_SIMPLES);

/**
 * Cria uma pasta temporária, roda o teste dentro dela e apaga tudo no fim.
 * @param {(raiz: string) => Promise<void>} executar - Corpo do teste.
 * @returns {Promise<void>}
 */
async function comRaizTemporaria(executar) {
  const raiz = await fs.mkdtemp(path.join(os.tmpdir(), PREFIXO_TEMPORARIO));
  try {
    await executar(raiz);
  } finally {
    await fs.rm(raiz, { recursive: true, force: true });
  }
}

/**
 * Cria pastas de projeto sintéticas com os arquivos informados.
 * @param {string} raiz - Pasta raiz dos projetos de teste.
 * @param {string} nome - Nome da pasta do projeto.
 * @param {Record<string, string>} arquivos - Caminho relativo -> conteúdo.
 * @returns {Promise<void>}
 */
async function criarProjeto(raiz, nome, arquivos) {
  for (const [relativo, texto] of Object.entries(arquivos)) {
    const absoluto = path.join(raiz, nome, ...relativo.split('/'));
    await fs.mkdir(path.dirname(absoluto), { recursive: true });
    await fs.writeFile(absoluto, texto, 'utf8');
  }
}

/**
 * Cria o projeto `projeto-ok` e devolve o registro dele.
 * @param {string} raiz - Pasta raiz dos projetos de teste.
 * @param {Record<string, string>} arquivos - Arquivos do projeto.
 * @returns {Promise<{nome: string, caminho: string}>} Projeto descoberto.
 */
async function criarProjetoOk(raiz, arquivos) {
  await criarProjeto(raiz, PROJETO_OK, arquivos);
  return obterProjeto(PROJETO_OK, raiz);
}

test('lê o quadro com colunas Modelo e Verificado', () => {
  const quadro = lerQuadro(TEXTO_QUADRO);
  assert.ok(quadro.tabela.nomes.includes('Modelo'));
  assert.ok(quadro.tabela.nomes.includes('Verificado'));
  assert.deepEqual(validarQuadro(quadro), []);
  const livres = quadro.registros.filter((registro) => registro.estaLivre);
  assert.deepEqual(livres.map((registro) => registro.codigo), ['TST-1.1', 'TST-1.4']);
  const porCodigo = (codigo) => quadro.registros.find((registro) => registro.codigo === codigo);
  assert.equal(porCodigo('TST-1').ehMae, true);
  assert.equal(porCodigo('TST-1.1').nivel, 'MEDIO');
  assert.equal(porCodigo('TST-1.3').nivel, 'LEVE');
  assert.deepEqual(porCodigo('TST-1.4').dependencias, ['TST-1.1']);
  assert.deepEqual(dependenciasPendentes(['TST-1.1'], quadro, null), ['TST-1.1']);
});

test('lê o quadro sem colunas Modelo e Verificado', () => {
  const quadro = lerQuadro(TEXTO_QUADRO_SIMPLES);
  assert.equal(quadro.tabela.nomes.includes('Modelo'), false);
  assert.deepEqual(validarQuadro(quadro), []);
  const [registro] = quadro.registros;
  assert.equal(registro.codigo, 'TST-2.1');
  assert.equal(registro.status, '⬜ Pendente');
  assert.equal(registro.estaLivre, true);
  assert.equal(registro.nivel, null);
});

test('task_complete sem cabeçalho usa as colunas do STATUS.md', () =>
  comRaizTemporaria(async (raiz) => {
    const linhaConcluida = linhaTabela([
      'TST-9.1',
      'Feita',
      'Média',
      'MEDIO · só Sonnet',
      'Nenhuma',
      '✅ Concluída',
      '—',
      ETAPA_LINK,
      '—',
    ]);
    const projeto = await criarProjetoOk(raiz, {
      [ARQUIVO_STATUS]: TEXTO_QUADRO,
      [ARQUIVO_CONCLUIDAS]: `${linhaConcluida}${EOL_LF}`,
    });
    const { aberto, concluidas } = await lerQuadrosDoProjeto(projeto);
    assert.equal(concluidas.registros.length, 1);
    assert.equal(concluidas.registros[0].emoji, '✅');
    assert.deepEqual(dependenciasPendentes(['TST-9.1'], aberto, concluidas), []);
  }));

test('ler e serializar devolve o mesmo texto com LF, CRLF e BOM', () => {
  const formatos = [
    { eol: EOL_LF, bom: false },
    { eol: EOL_CRLF, bom: false },
    { eol: EOL_LF, bom: true },
    { eol: EOL_CRLF, bom: true },
  ];
  for (const formato of formatos) {
    const texto = aplicarFormato(TEXTO_QUADRO, formato);
    const semFimDeLinha = texto.replace(/\r?\n$/, '');
    for (const original of [texto, semFimDeLinha]) {
      const reescrito = serializarQuadro(lerQuadro(original));
      assert.equal(reescrito, original, `diferente em ${JSON.stringify(formato)}`);
    }
  }
});

test('atualizar uma linha muda só ela e mantém as colunas (INV-2)', () => {
  const quadro = lerQuadro(aplicarFormato(TEXTO_QUADRO, { eol: EOL_CRLF, bom: true }));
  const alvo = quadro.registros.find((registro) => registro.codigo === 'TST-1.1');
  const novo = atualizarLinha(quadro, 'TST-1.1', {
    status: '🔄 Em execução',
    emUsoPor: 'Teste (frente)',
  });
  const alteradas = [];
  quadro.linhas.forEach((linha, indice) => {
    if (linha !== novo.linhas[indice]) alteradas.push(indice);
  });
  assert.equal(novo.linhas.length, quadro.linhas.length);
  assert.deepEqual(alteradas, [alvo.indice]);
  const relido = lerQuadro(serializarQuadro(novo));
  const registro = relido.registros.find((item) => item.codigo === 'TST-1.1');
  assert.equal(registro.status, '🔄 Em execução');
  assert.equal(registro.emUsoPor, 'Teste (frente)');
  assert.equal(registro.modelo, 'MEDIO · só Sonnet');
  assert.equal(registro.titulo, 'Tarefa livre');
  assert.equal(registro.etapa, ETAPA_LINK);
  assert.deepEqual(validarQuadro(relido), []);
  assert.equal(relido.tabela.nomes.join('|'), quadro.tabela.nomes.join('|'));
  assert.equal(serializarQuadro(novo).startsWith(MARCA_BOM), true);
  assert.equal(serializarQuadro(novo).includes(EOL_CRLF), true);
});

test('colunas de nível, modelo e prioridade não podem ser alteradas', () => {
  const quadro = lerQuadro(TEXTO_QUADRO);
  const recusa = (erro) => erro.codigo === CODIGOS_ERRO.COLUNA_AUSENTE;
  assert.throws(
    () => atualizarLinha(quadro, 'TST-1.1', { modelo: 'LEVE · só Haiku' }),
    recusa,
  );
  assert.throws(() => atualizarLinha(quadro, 'TST-1.1', { prioridade: 'Alta' }), recusa);
});

test('a atualização gravada no disco continua válida (INV-2)', () =>
  comRaizTemporaria(async (raiz) => {
    const projeto = await criarProjetoOk(raiz, { [ARQUIVO_STATUS]: TEXTO_QUADRO });
    const novo = atualizarLinha(lerQuadro(TEXTO_QUADRO), 'TST-1.1', {
      status: '🔄 Em execução',
    });
    await gravarArquivoDeTasks(projeto, ARQUIVO_STATUS, serializarQuadro(novo));
    const emDisco = await lerArquivoDeTasks(projeto, ARQUIVO_STATUS);
    assert.equal(emDisco, serializarQuadro(novo));
    assert.deepEqual(validarQuadro(lerQuadro(emDisco)), []);
    const pastaTasks = await fs.readdir(path.join(projeto.caminho, 'tasks'));
    assert.deepEqual(pastaTasks.sort(), ['STATUS.md']);
  }));

test('pasta DEMAIS-PROJETOS-* e pastas ocultas nunca aparecem (C20, C23)', () =>
  comRaizTemporaria(async (raiz) => {
    await criarProjeto(raiz, PROJETO_OK, { [ARQUIVO_STATUS]: TEXTO_QUADRO });
    await criarProjeto(raiz, 'DEMAIS-PROJETOS-SEGREDO', { [ARQUIVO_STATUS]: TEXTO_QUADRO });
    await criarProjeto(raiz, '.oculta', { [ARQUIVO_STATUS]: TEXTO_QUADRO });
    await criarProjeto(raiz, 'sem-quadro', { 'README.md': 'sem quadro' });
    const nomes = (await listarProjetos(raiz)).map((projeto) => projeto.nome);
    assert.deepEqual(nomes, [PROJETO_OK]);
    const recusa = (erro) => erro.codigo === CODIGOS_ERRO.PROJETO_INVALIDO;
    await assert.rejects(obterProjeto('DEMAIS-PROJETOS-SEGREDO', raiz), recusa);
    await assert.rejects(obterProjeto('.oculta', raiz), recusa);
    await assert.rejects(obterProjeto('../x', raiz), recusa);
    await assert.rejects(
      obterProjeto('sem-quadro', raiz),
      (erro) => erro.codigo === CODIGOS_ERRO.PROJETO_NAO_ENCONTRADO,
    );
  }));

test('DEMAIS-PROJETOS em minúsculas também fica fora da descoberta (C23)', () =>
  comRaizTemporaria(async (raiz) => {
    await criarProjeto(raiz, PROJETO_OK, { [ARQUIVO_STATUS]: TEXTO_QUADRO });
    await criarProjeto(raiz, 'demais-projetos-minusculo', { [ARQUIVO_STATUS]: TEXTO_QUADRO });
    const nomes = (await listarProjetos(raiz)).map((projeto) => projeto.nome);
    assert.equal(nomes.includes('demais-projetos-minusculo'), false);
  }));

/** Caminhos que nunca podem ser lidos nem gravados pelo MCP. */
const CAMINHOS_RECUSADOS = [
  '../x.md',
  '..\\x.md',
  'tasks/../.env',
  '.env',
  '.git/config',
  'src/app.js',
  'tasks/../../outro/STATUS.md',
  'tasks/etapas/../../.env',
  'C:\\Windows\\win.ini',
  '/etc/passwd',
];

/** Caminhos que o MCP pode usar dentro de tasks/. */
const CAMINHOS_PERMITIDOS = [
  'tasks/STATUS.md',
  'tasks/task_complete.md',
  'tasks/etapas/ETAPA-001-teste.md',
];

test('caminhos fora de tasks/ são recusados e nada é gravado (R3.2)', () =>
  comRaizTemporaria(async (raiz) => {
    const projeto = await criarProjetoOk(raiz, {
      [ARQUIVO_STATUS]: TEXTO_QUADRO,
      '.env': 'SEGREDO=1\n',
      'src/app.js': 'console.log(1);\n',
    });
    const recusados = [...CAMINHOS_RECUSADOS, path.join(projeto.caminho, 'tasks', 'STATUS.md')];
    for (const relativo of recusados) {
      await assert.rejects(
        resolverCaminhoDeTasks(projeto, relativo),
        (erro) => erro.codigo === CODIGOS_ERRO.CAMINHO_RECUSADO,
        `caminho aceito indevidamente: ${relativo}`,
      );
    }
    for (const relativo of CAMINHOS_PERMITIDOS) {
      const absoluto = await resolverCaminhoDeTasks(projeto, relativo);
      assert.equal(path.isAbsolute(absoluto), true);
    }
    await assert.rejects(
      gravarArquivoDeTasks(projeto, '.env', 'X=2\n'),
      (erro) => erro.codigo === CODIGOS_ERRO.CAMINHO_RECUSADO,
    );
    const segredo = await fs.readFile(path.join(projeto.caminho, '.env'), 'utf8');
    assert.equal(segredo, 'SEGREDO=1\n');
  }));

test('gravação que tira coluna ou troca o cabeçalho é recusada (INV-2)', () =>
  comRaizTemporaria(async (raiz) => {
    const projeto = await criarProjetoOk(raiz, { [ARQUIVO_STATUS]: TEXTO_QUADRO });
    const linhaSemUltimaCelula = LINHAS_COMPLETAS.map((linha, indice) =>
      indice === 1 ? linha.slice(0, -1) : linha,
    );
    const tentativas = [
      montarQuadro(COLUNAS_COMPLETAS, linhaSemUltimaCelula),
      montarQuadro(COLUNAS_COMPLETAS.slice(0, -1), LINHAS_COMPLETAS),
      montarQuadro(colunasComStatusTrocado(), LINHAS_COMPLETAS),
    ];
    for (const texto of tentativas) {
      await assert.rejects(
        gravarArquivoDeTasks(projeto, ARQUIVO_STATUS, texto),
        (erro) => erro.codigo === CODIGOS_ERRO.QUADRO_INVALIDO,
      );
    }
    assert.equal(await lerArquivoDeTasks(projeto, ARQUIVO_STATUS), TEXTO_QUADRO);
    const pastaTasks = await fs.readdir(path.join(projeto.caminho, 'tasks'));
    assert.deepEqual(pastaTasks.sort(), ['STATUS.md']);
  }));

test('❌ Cancelada nunca conta como livre', () => {
  const linhas = [
    [
      'TST-3.1', 'Cancelada', 'Média', 'MEDIO · só Sonnet', 'Nenhuma',
      CANCELADA_SIMPLES, '—', ETAPA_LINK, '—',
    ],
    [
      'TST-3.2', 'Cancelada com seletor', 'Média', 'MEDIO · só Sonnet', 'Nenhuma',
      CANCELADA_COM_SELETOR, '—', ETAPA_LINK, '—',
    ],
    [
      'TST-3.3', 'Livre de verdade', 'Média', 'MEDIO · só Sonnet', 'Nenhuma',
      '⬜ Pendente', '—', ETAPA_LINK, '—',
    ],
  ];
  const quadro = lerQuadro(montarQuadro(COLUNAS_COMPLETAS, linhas));
  const livres = quadro.registros.filter((registro) => registro.estaLivre);
  assert.deepEqual(livres.map((registro) => registro.codigo), ['TST-3.3']);
  assert.equal(quadro.registros[0].emoji, '❌');
  assert.equal(quadro.registros[1].emoji, '❌');
});
