// Importador idempotente das demais secoes do quadro (SCHEMA.md, MIGRAR-TAREFAS-API.9):
// frentes, decisoes, riscos, bloqueios, pendencias, licoes (tasks/STATUS.md) e recados
// (tasks/RECADOS.md) para api/dados/<projeto>.json. Tarefas e etapas ficam com outros importadores.
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gravarSeMudou } from './serializador.mjs';
import { dividirCelulas, lerArquivo } from './migrar.mjs';

const PASTA_API = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(PASTA_API, '..');
const PASTA_DADOS = join(PASTA_API, 'dados');
const PROJETO_PADRAO = 'rules-ai';
const FONTE_STATUS = join(RAIZ, 'tasks', 'STATUS.md');
const FONTE_RECADOS = join(RAIZ, 'tasks', 'RECADOS.md');
const MARCA_TITULO = '## ';
const SEM_VALOR = new Set(['', '—', '-']);
const TAMANHO_HASH = 8;
const PADRAO_LINK_ETAPA = /\(?\[[^\]]*\]\([^)]*\)\)?/g;
const PADRAO_CODIGO = /[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*(?:\.\d+)?|\.\d+/g;
const PADRAO_DATA = /\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2})?/;
const PADRAO_SEGREDO = new RegExp(
  [
    '\\bsk-[A-Za-z0-9]{8,}', '\\btsk_\\w+', 'Bearer\\s+[\\w.-]{8,}', '\\bghp_\\w+',
    '\\b\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}\\b', '[\\w.+-]+@[\\w-]+\\.[\\w.-]+',
  ].join('|'),
);

/**
 * Valor de uma celula ou string vazia.
 * @param {object} linha - Linha coluna -> texto.
 * @param {string[]} nomes - Nomes aceitos da coluna (o primeiro que existir vence).
 * @returns {string} Texto da celula.
 */
function pegar(linha, nomes) {
  const nome = nomes.find((item) => item in linha);
  return nome ? linha[nome] : '';
}

/**
 * Texto ou null quando a celula esta vazia ou so tem travessao.
 * @param {string} texto - Texto da celula.
 * @returns {string|null} Texto ou null.
 */
function ouNulo(texto) {
  return SEM_VALOR.has(texto) ? null : texto;
}

/**
 * Hash curto e estavel de um texto.
 * @param {string} texto - Texto principal da linha.
 * @returns {string} Primeiros 8 caracteres do SHA-1.
 */
function hashCurto(texto) {
  return createHash('sha1').update(texto).digest('hex').slice(0, TAMANHO_HASH);
}

/**
 * Codigos de tarefa citados num texto (`.N` herda a base do codigo anterior).
 * @param {string} texto - Texto livre (celula Tarefa ou Origem).
 * @returns {string[]} Codigos na ordem em que aparecem, sem repeticao.
 */
export function extrairCodigos(texto) {
  const tokens = texto.replace(PADRAO_LINK_ETAPA, ' ').match(PADRAO_CODIGO) || [];
  const codigos = [];
  let base = null;
  for (const token of tokens) {
    const ehSufixo = token.startsWith('.');
    if (ehSufixo && base) codigos.push(`${base}${token}`);
    if (ehSufixo) continue;
    const ehCodigo = token.includes('-') || token.includes('.');
    if (!ehCodigo) continue;
    base = token.replace(/\.\d+$/, '');
    codigos.push(token);
  }
  return [...new Set(codigos)];
}

/**
 * Agrupa as linhas de uma secao em tabelas (cabecalho + linhas de dados).
 * @param {string[]} linhas - Linhas da secao.
 * @returns {{cabecalho: string[], linhas: string[][]}[]} Tabelas encontradas.
 */
export function lerTabelas(linhas) {
  const tabelas = [];
  let atual = null;
  for (const linha of linhas) {
    if (!linha.startsWith('|')) {
      atual = null;
      continue;
    }
    if (!atual) {
      atual = { cabecalho: dividirCelulas(linha), linhas: [], separador: false };
      tabelas.push(atual);
      continue;
    }
    if (!atual.separador) atual.separador = true;
    else atual.linhas.push(dividirCelulas(linha));
  }
  return tabelas.map(({ cabecalho, linhas: dados }) => ({ cabecalho, linhas: dados }));
}

/**
 * Pega as linhas de uma secao `## ` cujo titulo contem a palavra-chave.
 * @param {string} texto - Conteudo do arquivo.
 * @param {string} palavra - Trecho do titulo.
 * @returns {string[]|null} Linhas da secao ou null se nao existir.
 */
export function recortarSecao(texto, palavra) {
  const todas = texto.split('\n');
  const inicio = todas.findIndex((l) => l.startsWith(MARCA_TITULO) && l.includes(palavra));
  if (inicio < 0) return null;
  const resto = todas.slice(inicio + 1);
  const fim = resto.findIndex((linha) => linha.startsWith(MARCA_TITULO));
  return fim < 0 ? resto : resto.slice(0, fim);
}

/**
 * Converte as tabelas de uma secao em linhas objeto (coluna -> texto).
 * Linhas com numero de celulas diferente do cabecalho (ex.: tarefas) e linhas vazias saem
 * em `ignoradas`.
 * @param {{cabecalho: string[], linhas: string[][]}[]} tabelas - Tabelas da secao.
 * @returns {{linhas: object[], ignoradas: string[]}} Linhas validas e ignoradas.
 */
export function montarLinhas(tabelas) {
  const linhas = [];
  const ignoradas = [];
  for (const { cabecalho, linhas: dados } of tabelas) {
    for (const celulas of dados) {
      const estaVazia = celulas.every((celula) => SEM_VALOR.has(celula));
      const temColunasCertas = celulas.length === cabecalho.length;
      if (estaVazia) continue;
      if (!temColunasCertas) {
        ignoradas.push(celulas[0]);
        continue;
      }
      linhas.push(Object.fromEntries(cabecalho.map((nome, i) => [nome, celulas[i]])));
    }
  }
  return { linhas, ignoradas };
}

/**
 * Converte uma linha de frente.
 * @param {object} linha - Linha coluna -> texto.
 * @returns {object} Campos da frente (sem id, projeto e ordem).
 */
function converterFrente(linha) {
  const tarefaTexto = pegar(linha, ['Tarefa (etapa)', 'Tarefa']);
  return {
    chave: `${pegar(linha, ['Frente'])}|${tarefaTexto}`,
    frente: pegar(linha, ['Frente']),
    tarefaTexto,
    tarefaIds: [],
    situacao: pegar(linha, ['Situação']),
    atualizadoEm: pegar(linha, ['Atualizado em']),
  };
}

/**
 * Converte uma linha de decisao.
 * @param {object} linha - Linha coluna -> texto.
 * @returns {object} Campos da decisao.
 */
function converterDecisao(linha) {
  const decisao = pegar(linha, ['Decisão']);
  return {
    chave: decisao, prefixo: pegar(linha, ['Data']), data: pegar(linha, ['Data']), decisao,
    quem: pegar(linha, ['Quem']), porque: pegar(linha, ['Por quê']), etapaId: null,
  };
}

/**
 * Converte uma linha de risco.
 * @param {object} linha - Linha coluna -> texto.
 * @returns {object} Campos do risco.
 */
function converterRisco(linha) {
  const risco = pegar(linha, ['Risco']);
  return {
    chave: risco, risco, chance: ouNulo(pegar(linha, ['Chance'])),
    impacto: ouNulo(pegar(linha, ['Impacto'])), planoB: ouNulo(pegar(linha, ['Plano B'])),
    situacao: ouNulo(pegar(linha, ['Situação'])),
  };
}

/**
 * Converte uma linha de bloqueio.
 * @param {object} linha - Linha coluna -> texto.
 * @returns {object} Campos do bloqueio.
 */
function converterBloqueio(linha) {
  const item = pegar(linha, ['Item']);
  return {
    chave: item, prefixo: pegar(linha, ['Data']), data: pegar(linha, ['Data']), item,
    motivo: pegar(linha, ['Motivo']), oQueDestrava: ouNulo(pegar(linha, ['O que destrava'])),
    resolvidoEm: ouNulo(pegar(linha, ['Resolvido em'])),
  };
}

/**
 * Converte uma linha de pendencia.
 * @param {object} linha - Linha coluna -> texto.
 * @returns {object} Campos da pendencia.
 */
function converterPendencia(linha) {
  const pendencia = pegar(linha, ['Pendência']);
  const origem = pegar(linha, ['Origem']);
  return {
    chave: pendencia, prefixo: pegar(linha, ['Data']), data: pegar(linha, ['Data']), pendencia,
    motivo: pegar(linha, ['Motivo']), origem, tarefaOrigem: extrairCodigos(origem)[0] || null,
    resolvidaEm: null,
  };
}

/**
 * Converte uma linha de licao.
 * @param {object} linha - Linha coluna -> texto.
 * @returns {object} Campos da licao.
 */
function converterLicao(linha) {
  const oQueAconteceu = pegar(linha, ['O que aconteceu']);
  return {
    chave: oQueAconteceu, prefixo: pegar(linha, ['Data']), data: pegar(linha, ['Data']),
    oQueAconteceu, licao: pegar(linha, ['Lição / nova regra', 'Lição']),
  };
}

/**
 * Converte uma linha de recado (tabela "Abertos" ou "Cumpridos").
 * @param {object} linha - Linha coluna -> texto.
 * @returns {object} Campos do recado.
 */
function converterRecado(linha) {
  const nomeCumprido = Object.keys(linha).find((nome) => nome.startsWith('Cumprido'));
  const cumprido = nomeCumprido ? ouNulo(linha[nomeCumprido]) : null;
  const dataCumprido = cumprido ? cumprido.match(PADRAO_DATA) : null;
  const recado = pegar(linha, ['Recado']);
  return {
    chave: recado, prefixo: pegar(linha, ['Data e hora']), dataHora: pegar(linha, ['Data e hora']),
    de: pegar(linha, ['De']), para: pegar(linha, ['Para']), recado,
    etapaTarefa: ouNulo(pegar(linha, ['Etapa/tarefa'])), tarefaId: null,
    cumprido: Boolean(nomeCumprido), cumpridoEm: dataCumprido ? dataCumprido[0] : null,
    cumpridoNota: cumprido,
  };
}

const SECOES = [
  { colecao: 'frentes', arquivo: 'status', palavra: 'Frentes', converter: converterFrente },
  { colecao: 'decisoes', arquivo: 'status', palavra: 'Registro de decisões',
    converter: converterDecisao },
  { colecao: 'riscos', arquivo: 'status', palavra: 'Riscos', converter: converterRisco },
  { colecao: 'bloqueios', arquivo: 'status', palavra: 'Bloqueios', converter: converterBloqueio },
  { colecao: 'pendencias', arquivo: 'status', palavra: 'Pendências',
    converter: converterPendencia },
  { colecao: 'licoes', arquivo: 'status', palavra: 'Lições', converter: converterLicao },
  { colecao: 'recados', arquivo: 'recados', palavra: null, converter: converterRecado },
];

/**
 * Recusa texto com segredo ou dado pessoal (INV-4).
 * @param {object} registro - Registro convertido.
 * @param {string} colecao - Nome da colecao (para a mensagem).
 * @returns {void}
 * @throws {Error} Se algum valor casar com padrao de segredo, CPF ou e-mail.
 */
function recusarSegredo(registro, colecao) {
  const achado = Object.values(registro).find(
    (valor) => typeof valor === 'string' && PADRAO_SEGREDO.test(valor),
  );
  if (achado) throw new Error(`Segredo ou dado pessoal em ${colecao}: ${achado.slice(0, 60)}`);
}

/**
 * Monta os registros finais de uma secao: id composto, projeto, ordem e ids unicos.
 * @param {object[]} linhas - Linhas coluna -> texto.
 * @param {object} secao - Definicao da secao.
 * @param {string} projeto - Id do projeto.
 * @returns {object[]} Registros na ordem da tabela.
 */
export function montarRegistros(linhas, secao, projeto) {
  const vistos = new Map();
  return linhas.map((linha, indice) => {
    const { chave, prefixo, ...campos } = secao.converter(linha);
    if (secao.colecao === 'frentes') campos.tarefaIds = tarefaIdsDe(campos, projeto);
    if (campos.tarefaOrigem) campos.tarefaOrigem = `${projeto}:${campos.tarefaOrigem}`;
    const partes = [projeto, prefixo, hashCurto(chave)].filter((parte) => parte);
    const base = partes.join(':');
    const vezes = (vistos.get(base) || 0) + 1;
    vistos.set(base, vezes);
    const id = vezes === 1 ? base : `${base}#${vezes}`;
    const registro = { id, projeto, ...campos, ordem: indice + 1 };
    recusarSegredo(registro, secao.colecao);
    return registro;
  });
}

/**
 * Ids de tarefa citados no texto de uma frente.
 * @param {{tarefaTexto: string}} campos - Campos da frente.
 * @param {string} projeto - Id do projeto.
 * @returns {string[]} Ids compostos.
 */
function tarefaIdsDe(campos, projeto) {
  return extrairCodigos(campos.tarefaTexto).map((codigo) => `${projeto}:${codigo}`);
}

/**
 * Le as linhas de uma secao a partir do texto da fonte.
 * @param {object} secao - Definicao da secao.
 * @param {{status: string|null, recados: string|null}} textos - Texto de cada arquivo.
 * @returns {{linhas: object[], ignoradas: string[]}} Linhas lidas (vazias se faltar a fonte).
 */
export function lerSecao(secao, textos) {
  const texto = textos[secao.arquivo];
  if (texto === null) return { linhas: [], ignoradas: [] };
  const linhasSecao = secao.palavra ? recortarSecao(texto, secao.palavra) : texto.split('\n');
  if (!linhasSecao) return { linhas: [], ignoradas: [] };
  return montarLinhas(lerTabelas(linhasSecao));
}

/**
 * Mescla os registros lidos na colecao: os lidos substituem os de mesmo id; os do projeto que
 * sumiram do quadro sao mantidos (linhas so se acrescentam); outros projetos nao mudam.
 * @param {object[]} existentes - Colecao gravada (todos os projetos).
 * @param {object[]} lidos - Registros lidos do quadro.
 * @param {string} projeto - Id do projeto.
 * @returns {{registros: object[], ausentes: string[]}} Colecao nova e ids mantidos sem fonte.
 */
export function mesclarColecao(existentes, lidos, projeto) {
  const idsLidos = new Set(lidos.map((item) => item.id));
  const outros = existentes.filter((item) => item.projeto !== projeto);
  const mantidos = existentes.filter((i) => i.projeto === projeto && !idsLidos.has(i.id));
  return {
    registros: [...outros, ...lidos, ...mantidos],
    ausentes: mantidos.map((item) => item.id),
  };
}

/**
 * Le um arquivo de quadro, ou null se nao existir.
 * @param {string} caminho - Caminho do arquivo.
 * @returns {string|null} Conteudo.
 */
function lerOuNulo(caminho) {
  return existsSync(caminho) ? lerArquivo(caminho) : null;
}

/**
 * Importa as demais secoes do quadro para o banco do projeto.
 * @param {{projeto: string, status: string, recados: string, simular: boolean}} opcoes - Opcoes.
 * @returns {{projeto: string, caminho: string, gravou: boolean, secoes: object[]}} Resumo.
 */
export function migrarSecoes(opcoes) {
  const { projeto, simular } = opcoes;
  const caminho = join(PASTA_DADOS, `${projeto}.json`);
  const textos = { status: lerOuNulo(opcoes.status), recados: lerOuNulo(opcoes.recados) };
  const banco = existsSync(caminho) ? JSON.parse(readFileSync(caminho, 'utf8')) : {};
  const secoes = [];
  for (const secao of SECOES) {
    const { linhas, ignoradas } = lerSecao(secao, textos);
    const lidos = montarRegistros(linhas, secao, projeto);
    const antes = (banco[secao.colecao] || []).filter((i) => i.projeto === projeto).length;
    const mescla = mesclarColecao(banco[secao.colecao] || [], lidos, projeto);
    banco[secao.colecao] = mescla.registros;
    const depois = mescla.registros.filter((item) => item.projeto === projeto).length;
    secoes.push({ colecao: secao.colecao, lidas: lidos.length, antes, depois, ignoradas,
      ausentes: mescla.ausentes });
  }
  banco.tarefas = banco.tarefas || [];
  let gravou = false;
  if (!simular) {
    mkdirSync(PASTA_DADOS, { recursive: true });
    gravou = gravarSeMudou(caminho, banco);
  }
  return { projeto, caminho, gravou, simular, secoes };
}

/**
 * Le as opcoes da linha de comando.
 * @param {string[]} argumentos - Argumentos depois do script.
 * @returns {{projeto: string, status: string, recados: string, simular: boolean}} Opcoes.
 * @throws {Error} Se uma opcao com valor vier sem valor.
 */
export function lerOpcoes(argumentos) {
  const opcoes = {
    projeto: PROJETO_PADRAO, status: FONTE_STATUS, recados: FONTE_RECADOS, simular: false,
  };
  const comValor = { '--projeto': 'projeto', '--status': 'status', '--recados': 'recados' };
  for (let i = 0; i < argumentos.length; i += 1) {
    const argumento = argumentos[i];
    if (argumento === '--dry-run') opcoes.simular = true;
    if (!(argumento in comValor)) continue;
    const valor = argumentos[i + 1];
    if (!valor || valor.startsWith('--')) throw new Error(`${argumento} exige um valor`);
    opcoes[comValor[argumento]] = argumento === '--projeto' ? valor : resolve(valor);
    i += 1;
  }
  return opcoes;
}

/**
 * Escreve o resumo da carga na saida padrao.
 * @param {object} resumo - Resultado de `migrarSecoes`.
 * @returns {void}
 */
function imprimirResumo(resumo) {
  let situacao = resumo.gravou ? 'gravado' : 'sem mudanca';
  if (resumo.simular) situacao = 'simulado (nada gravado)';
  console.log(`projeto: ${resumo.projeto}\narquivo: ${resumo.caminho}`);
  for (const s of resumo.secoes) {
    console.log(`${s.colecao}: lidas ${s.lidas} | antes ${s.antes} | depois ${s.depois}`
      + ` | ignoradas ${s.ignoradas.length} | ausentes do quadro ${s.ausentes.length}`);
    for (const ignorada of s.ignoradas) console.log(`  ignorada (outra tabela): ${ignorada}`);
  }
  console.log(`resultado: ${situacao}`);
}

/**
 * Ponto de entrada: le as opcoes, importa e imprime o resumo.
 * @returns {void}
 */
function principal() {
  try {
    imprimirResumo(migrarSecoes(lerOpcoes(process.argv.slice(2))));
  } catch (erro) {
    process.stderr.write(`Erro: ${erro.message}\n`);
    process.exitCode = 1;
  }
}

const arquivoAtual = fileURLToPath(import.meta.url);
const foiChamadoDireto = process.argv[1] && resolve(process.argv[1]) === arquivoAtual;
if (foiChamadoDireto) principal();
