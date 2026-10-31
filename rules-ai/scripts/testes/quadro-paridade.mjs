#!/usr/bin/env node
/**
 * Teste de invariante do QUADRO-SIMPLIFICADO-GLOBAL.4.
 * INV-1: os três parsers (gerenciador, MCP e Jev) devolvem o mesmo conjunto de
 *        (ID curto, status, nível, reserva) para o mesmo quadro, e o formato simplificado
 *        equivale ao formato em tabela.
 * INV-2: entrada inválida dá erro claro ou lista vazia, e nenhum arquivo é gravado.
 * Saída: uma linha por verificação; código 0 se tudo passa, 1 se algo falha.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
const carregar = (relativo) => import(pathToFileURL(join(RAIZ, relativo)).href);
const gerenciador = await carregar('scripts/gerenciador/quadro.mjs');
const mcp = await carregar('mcp/quadro.mjs');
const jev = await carregar('scripts/jev/estado.mjs');
const formato = await carregar('scripts/jev/quadro-formato.mjs');

const QUADROS_REAIS = [
  { nome: 'aulasenai (simplificado)', arquivo: 'C:/fontes/aulasenai/tasks/STATUS.md' },
  { nome: 'rules-ai (tabela)', arquivo: join(RAIZ, 'tasks', 'STATUS.md') },
  { nome: 'REA-APP-CLONES (tabela)', arquivo: 'C:/fontes/REA-APP-CLONES/tasks/STATUS.md' },
];
const LIMITE_ITENS_CONVERSAO = 60;
const PADRAO_NIVEL = /\b(LEVE|MEDIO|PESADO)\b/u;
const CABECALHO_TABELA = [
  '| Tarefa | Título | Prioridade | Modelo | Depende de | Status | Em uso por | Etapa |',
  '|---|---|---|---|---|---|---|---|',
];

/**
 * Exceções explícitas da paridade. Cada uma é dita no resultado, nunca escondida.
 * `ids`: IDs curtos ignorados na comparação; `motivo`: por que a diferença é esperada.
 */
const EXCECOES = {
  nivelNoJev:
    'o Jev não carrega nível no item (ele vem da seção da etapa): nível comparado só ' +
    'entre gerenciador e MCP',
  crase:
    'o Jev tira crases e negrito das células (`limparMarkdown`); o gerenciador só o negrito: ' +
    'a tupla ignora crases dos dois lados',
  agrupadas:
    'subtarefas agrupadas (#N.a a #N.b) viram um item por ID nos três parsers, sem reserva',
};

/**
 * Linhas reais com `|` sem escape dentro da célula (dado malformado do quadro, não do parser):
 * o gerenciador e o MCP leem as colunas deslocadas e o Jev descarta a linha. Ficam fora da
 * comparação com o Jev e são avisadas (AVISO) a cada execução, para o quadro ser corrigido.
 */
const LINHAS_MALFORMADAS = ['DASHBOARD-LE-API.12'];

const resultados = [];

/**
 * Registra uma verificação e imprime a linha.
 * @param {string} nome - Descrição da verificação.
 * @param {boolean} passou - Se passou.
 * @param {string} [detalhe] - Complemento.
 * @returns {void}
 */
function registrar(nome, passou, detalhe = '') {
  resultados.push(passou);
  const sufixo = detalhe ? ` — ${detalhe}` : '';
  console.log(`${passou ? 'OK  ' : 'FALHA'} ${nome}${sufixo}`);
}

/**
 * Calcula o hash SHA-256 de um texto.
 * @param {string} texto - Conteúdo.
 * @returns {string} Hash em hexadecimal.
 */
function hashDe(texto) {
  return createHash('sha256').update(texto).digest('hex');
}

/**
 * Extrai o nível (LEVE, MEDIO, PESADO) do texto da coluna Modelo.
 * @param {string} modelo - Texto da coluna.
 * @returns {string} Nível ou `-` quando não houver.
 */
function nivelDoModelo(modelo) {
  const texto = String(modelo ?? '').normalize('NFD').replace(/\p{M}/gu, '').toUpperCase();
  const achado = PADRAO_NIVEL.exec(texto)?.[1];
  if (achado) return achado;
  return texto.startsWith('USUARIO') ? 'USUARIO' : '-';
}

/**
 * Monta a tupla comparável `idCurto|status|nível|reserva` de um item.
 * @param {{id: string, status: string, nivel: string, reserva: string}} item - Dados.
 * @returns {string} Tupla textual.
 */
function tupla(item) {
  const reserva = String(item.reserva ?? '').trim();
  const status = item.status.replaceAll('`', '').replaceAll('**', '').trim();
  return [formato.idCurto(item.id), status, item.nivel, reserva.replaceAll('`', '')].join('|');
}

/**
 * Lista ordenada de tuplas das subtarefas, vista pelo parser do gerenciador.
 * @param {string} texto - Conteúdo do quadro.
 * @returns {string[]} Tuplas.
 */
function viaGerenciador(texto) {
  return gerenciador.lerLinhasQuadro(texto).linhas.map((linha) =>
    tupla({ id: linha.id, status: linha.status, nivel: nivelDoModelo(linha.modelo),
      reserva: linha.emUsoPor }));
}

/**
 * Lista de tuplas vista pelo parser do MCP.
 * @param {string} texto - Conteúdo do quadro.
 * @returns {string[]} Tuplas.
 */
function viaMcp(texto) {
  return mcp.lerQuadro(texto).registros.map((registro) =>
    tupla({ id: registro.codigo, status: registro.status, nivel: registro.nivel ?? '-',
      reserva: registro.emUsoPor }));
}

/**
 * Lista de tuplas vista pelo parser do Jev (que lê de arquivo); nível fica fora (EXCECOES).
 * @param {string} arquivo - Caminho do quadro.
 * @returns {string[]} Tuplas com nível `*`.
 */
function viaJev(arquivo) {
  return jev.lerQuadro(arquivo).map((item) =>
    tupla({ id: item.id, status: item.status, nivel: '*', reserva: item.emUsoPor }));
}

/**
 * Remove o nível da tupla, para comparar com o Jev.
 * @param {string} tuplaCompleta - Tupla `id|status|nível|reserva`.
 * @returns {string} Tupla com nível `*`.
 */
function semNivel(tuplaCompleta) {
  const partes = tuplaCompleta.split('|');
  partes[2] = '*';
  return partes.join('|');
}

/**
 * Compara dois multiconjuntos de tuplas e descreve as diferenças.
 * @param {string[]} a - Primeiro conjunto.
 * @param {string[]} b - Segundo conjunto.
 * @returns {string[]} Diferenças (vazio = iguais).
 */
function diferencas(a, b) {
  const contagem = new Map();
  a.forEach((x) => contagem.set(x, (contagem.get(x) ?? 0) + 1));
  b.forEach((x) => contagem.set(x, (contagem.get(x) ?? 0) - 1));
  const saida = [];
  for (const [chave, delta] of contagem) {
    if (delta !== 0) saida.push(`${delta > 0 ? '+A' : '+B'} ${chave}`);
  }
  return saida;
}

/**
 * Confere os três parsers sobre um texto/arquivo e registra o resultado.
 * @param {string} nome - Nome do quadro.
 * @param {string} arquivo - Caminho do arquivo no disco.
 * @returns {void}
 */
function conferirParidade(nome, arquivo) {
  const texto = readFileSync(arquivo, 'utf8');
  const doGerenciador = viaGerenciador(texto);
  const doMcp = viaMcp(texto);
  const doJev = viaJev(arquivo);
  const contagens = `${doGerenciador.length}/${doMcp.length}/${doJev.length}`;

  const gerVsMcp = diferencas(doGerenciador, doMcp);
  registrar(`INV-1 ${nome}: gerenciador = MCP (id, status, nível, reserva)`,
    gerVsMcp.length === 0, `${contagens}${gerVsMcp.length ? ` ${gerVsMcp.slice(0, 3)}` : ''}`);
  const malformada = (t) => LINHAS_MALFORMADAS.some((id) => t.startsWith(`${id}|`));
  const avisadas = doGerenciador.filter(malformada).length;
  if (avisadas > 0) console.log(`AVISO ${nome}: linha com "|" sem escape fora da conferência Jev`);
  const gerVsJev = diferencas(doGerenciador.filter((t) => !malformada(t)).map(semNivel),
    doJev.filter((t) => !malformada(t)));
  registrar(`INV-1 ${nome}: gerenciador = Jev (id, status, reserva; ${EXCECOES.nivelNoJev})`,
    gerVsJev.length === 0, `${contagens}${gerVsJev.length ? ` ${gerVsJev.slice(0, 3)}` : ''}`);
}

/**
 * Converte itens do índice simplificado em linhas do formato em tabela.
 * Itens agrupados saem da conversão (EXCECOES.agrupadas): uma linha de tabela não os expressa.
 * @param {object[]} itens - Itens de `lerIndiceSimplificado`.
 * @returns {string[]} Linhas da tabela (cabeçalho incluído).
 */
function converterParaTabela(itens) {
  const celula = (valor) => String(valor ?? '').replaceAll('|', '\\|');
  const linhas = itens.filter((item) => !item.agrupada && item.status).map((item) => {
    const modelo = item.nivel ? `${item.nivel} · ${item.modelo}` : item.modelo;
    const celulas = [item.id, item.titulo, item.prioridade, modelo, item.dependeDe || 'Nenhuma',
      item.status, item.emUsoPor || '—', item.etapaLink ? `[e](${item.etapaLink})` : '—'];
    return `| ${celulas.map(celula).join(' | ')} |`;
  });
  return [...CABECALHO_TABELA, ...linhas];
}

/**
 * Confere que o trecho do índice simplificado e a versão em tabela dão o mesmo conjunto.
 * @param {string} arquivoSimplificado - Caminho do quadro simplificado real.
 * @param {string} pasta - Pasta temporária para gravar a versão em tabela.
 * @returns {void}
 */
function conferirEquivalencia(arquivoSimplificado, pasta) {
  const texto = readFileSync(arquivoSimplificado, 'utf8');
  const itens = formato.lerIndiceSimplificado(texto).itens.slice(0, LIMITE_ITENS_CONVERSAO);
  const tabela = converterParaTabela(itens);
  const textoTabela = `## 📌 Tarefas\n\n${tabela.join('\n')}\n`;
  const textoSimplificado = reconstruirSimplificado(itens);
  const arquivoTabela = join(pasta, 'tabela.md');
  const arquivoIndice = join(pasta, 'indice.md');
  writeFileSync(arquivoTabela, textoTabela);
  writeFileSync(arquivoIndice, textoSimplificado);

  const pares = [
    ['gerenciador', viaGerenciador(textoSimplificado), viaGerenciador(textoTabela)],
    ['MCP', viaMcp(textoSimplificado), viaMcp(textoTabela)],
    ['Jev', viaJev(arquivoIndice), viaJev(arquivoTabela)],
  ];
  for (const [nome, doIndice, daTabela] of pares) {
    const dif = diferencas(doIndice, daTabela);
    registrar(`INV-1 simplificado = tabela (${nome}; ${EXCECOES.agrupadas})`, dif.length === 0,
      `${doIndice.length}/${daTabela.length}${dif.length ? ` ${dif.slice(0, 3)}` : ''}`);
  }
}

/**
 * Reconstrói um índice simplificado só com as linhas originais dos itens não agrupados.
 * @param {object[]} itens - Itens lidos.
 * @returns {string} Texto com a seção "Tarefas" e as linhas originais.
 */
function reconstruirSimplificado(itens) {
  const vistas = new Set();
  const linhas = [];
  for (const item of itens) {
    if (item.agrupada || !item.status || vistas.has(item.indice)) continue;
    vistas.add(item.indice);
    linhas.push(item.bruto);
  }
  return `## 📌 Tarefas\n\n${linhas.join('\n')}\n`;
}

/**
 * Executa um parser e classifica o resultado: lista vazia, lista com itens ou erro.
 * @param {() => unknown[]} leitor - Função que lê.
 * @returns {{tipo: string, detalhe: string}} Resultado classificado.
 */
function executar(leitor) {
  try {
    const lista = leitor();
    const tipo = lista.length === 0 ? 'vazio' : 'lista';
    return { tipo, detalhe: `${lista.length} itens` };
  } catch (erro) {
    return { tipo: 'erro', detalhe: `${erro.name}: ${erro.message}` };
  }
}

/** Entradas inválidas e o resultado esperado por parser (contrato do relatório da .2/.3). */
const CASOS_INVALIDOS = [
  { nome: 'arquivo vazio', texto: '',
    esperado: { gerenciador: 'vazio', mcp: 'erro', jev: 'vazio' } },
  { nome: 'texto sem formato conhecido', texto: 'texto livre\nsem tabela nem índice\n',
    esperado: { gerenciador: 'vazio', mcp: 'erro', jev: 'erro' } },
  { nome: 'tabela sem cabeçalho', texto: '| a | b |\n|---|---|\n| 1 | 2 |\n',
    esperado: { gerenciador: 'vazio', mcp: 'erro', jev: 'vazio' } },
];

/**
 * Confere um caso inválido nos três parsers e que nada foi gravado na pasta.
 * @param {{nome: string, texto: string, esperado: object}} caso - Caso inválido.
 * @param {string} pasta - Pasta temporária onde o arquivo do caso é criado.
 * @returns {void}
 */
function conferirCasoInvalido(caso, pasta) {
  const arquivo = join(pasta, 'entrada.md');
  writeFileSync(arquivo, caso.texto);
  const antes = { hash: hashDe(readFileSync(arquivo, 'utf8')), arquivos: readdirSync(pasta) };

  const obtidos = {
    gerenciador: executar(() => gerenciador.lerLinhasQuadro(caso.texto).linhas),
    mcp: executar(() => mcp.lerQuadro(caso.texto).registros),
    jev: executar(() => jev.lerQuadro(arquivo)),
  };
  for (const [parser, esperado] of Object.entries(caso.esperado)) {
    const { tipo, detalhe } = obtidos[parser];
    registrar(`INV-2 ${caso.nome}: ${parser} dá ${esperado}`, tipo === esperado,
      `obtido ${tipo} (${detalhe})`);
  }
  const depois = { hash: hashDe(readFileSync(arquivo, 'utf8')), arquivos: readdirSync(pasta) };
  const intacto = antes.hash === depois.hash
    && JSON.stringify(antes.arquivos) === JSON.stringify(depois.arquivos);
  registrar(`INV-2 ${caso.nome}: nenhum arquivo gravado (hash e pasta iguais)`, intacto);
}

/**
 * Confere que os quadros reais não mudaram de hash durante a leitura pelos parsers.
 * @param {Map<string, string>} antes - Hashes antes.
 * @returns {void}
 */
function conferirQuadrosReaisIntactos(antes) {
  for (const [arquivo, hash] of antes) {
    const igual = hashDe(readFileSync(arquivo, 'utf8')) === hash;
    registrar(`INV-2 quadro real intacto após a leitura: ${arquivo}`, igual);
  }
}

/**
 * Ponto de entrada: roda INV-1 e INV-2 e define o código de saída.
 * @returns {void}
 */
function principal() {
  const pasta = mkdtempSync(join(tmpdir(), 'quadro-paridade-'));
  const existentes = QUADROS_REAIS.filter((quadro) => existsSync(quadro.arquivo));
  const hashDoArquivo = (q) => [q.arquivo, hashDe(readFileSync(q.arquivo, 'utf8'))];
  const antes = new Map(existentes.map(hashDoArquivo));
  try {
    for (const quadro of QUADROS_REAIS) {
      if (existsSync(quadro.arquivo)) conferirParidade(quadro.nome, quadro.arquivo);
      else registrar(`INV-1 ${quadro.nome}: arquivo existe`, false, quadro.arquivo);
    }
    conferirEquivalencia(QUADROS_REAIS[0].arquivo, pasta);
    for (const caso of CASOS_INVALIDOS) {
      const subpasta = mkdtempSync(join(pasta, 'caso-'));
      conferirCasoInvalido(caso, subpasta);
    }
    conferirQuadrosReaisIntactos(antes);
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
  const falhas = resultados.filter((passou) => !passou).length;
  console.log(`\n${resultados.length - falhas}/${resultados.length} verificações passaram.`);
  process.exit(falhas === 0 ? 0 : 1);
}

principal();
