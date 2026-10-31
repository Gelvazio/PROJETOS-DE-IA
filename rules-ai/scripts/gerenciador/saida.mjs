/**
 * Formatação da saída do gerenciador em tabelas de texto puro (sem Markdown), para o terminal.
 * Só funções puras: recebem os resultados já calculados e devolvem texto.
 */

import { prepararModelos } from './quadro.mjs';

const PADRAO_EMOJI = /[\p{Extended_Pictographic}️‍]/gu;
const PADRAO_SUFIXO_NIVEL = /\s*·\s*`[^`]*`\s*$/;
const ESPACOS_ENTRE_COLUNAS = '  ';
const RETICENCIAS = '...';
const MAXIMO_TITULO = 58;
const MAXIMO_SITUACAO = 60;
const MAXIMO_OBSERVACAO = 40;
const NOMES_PRIORIDADE = { '🔴': 'Máxima', '🟠': 'Alta', '🟡': 'Média', '🟢': 'Baixa' };
const ESTADO_LIDO = 'lido';

/**
 * Conta os caracteres de um texto (cada símbolo vale 1, mesmo os fora do plano básico).
 * @param {string} texto - Texto qualquer.
 * @returns {number} Quantidade de símbolos.
 */
function medir(texto) {
  return [...texto].length;
}

/**
 * Corta o texto no máximo de símbolos, com reticências no fim.
 * @param {string} texto - Texto original.
 * @param {number} maximo - Tamanho máximo.
 * @returns {string} Texto possivelmente encurtado.
 */
function cortar(texto, maximo) {
  if (medir(texto) <= maximo) return texto;
  return `${[...texto].slice(0, maximo - RETICENCIAS.length).join('')}${RETICENCIAS}`;
}

/**
 * Completa o texto com espaços à direita até a largura pedida.
 * @param {string} texto - Texto original.
 * @param {number} largura - Largura final.
 * @returns {string} Texto alinhado à esquerda.
 */
function completar(texto, largura) {
  return texto + ' '.repeat(Math.max(0, largura - medir(texto)));
}

/**
 * Monta uma tabela de texto puro com colunas alinhadas.
 * @param {{titulo: string, chave: string, maximo?: number}[]} colunas - Colunas da tabela.
 * @param {Object[]} linhas - Linhas (objetos com as chaves das colunas).
 * @returns {string} Tabela pronta; `(nenhuma)` se não houver linhas.
 */
export function formatarTabela(colunas, linhas) {
  if (linhas.length === 0) return '(nenhuma)';

  const celulas = linhas.map((linha) =>
    colunas.map((coluna) => cortar(String(linha[coluna.chave] ?? ''), coluna.maximo ?? 80)),
  );
  const larguras = colunas.map((coluna, i) =>
    Math.max(medir(coluna.titulo), ...celulas.map((linha) => medir(linha[i]))),
  );
  const desenhar = (valores) =>
    valores.map((valor, i) => completar(valor, larguras[i])).join(ESPACOS_ENTRE_COLUNAS).trimEnd();

  const cabecalho = desenhar(colunas.map((coluna) => coluna.titulo));
  const traco = larguras.map((largura) => '-'.repeat(largura)).join(ESPACOS_ENTRE_COLUNAS);
  return [cabecalho, traco, ...celulas.map(desenhar)].join('\n');
}

/**
 * Deixa o título curto e sem emoji: tira o sufixo de nível entre crases, negrito e crases.
 * @param {string} titulo - Título cru da coluna.
 * @returns {string} Título limpo.
 */
function limparTitulo(titulo) {
  return titulo
    .replace(PADRAO_SUFIXO_NIVEL, '')
    .replace(PADRAO_EMOJI, '')
    .replace(/[`*]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Traduz o emoji de prioridade para palavra.
 * @param {string} celula - Texto da coluna Prioridade.
 * @returns {string} Palavra (ou vazio).
 */
function nomearPrioridade(celula) {
  const emoji = Object.keys(NOMES_PRIORIDADE).find((item) => celula.includes(item));
  return emoji ? NOMES_PRIORIDADE[emoji] : '';
}

/**
 * Monta o texto de observação de uma subtarefa livre (nível derivado, dependência ausente).
 * @param {Object} livre - Subtarefa livre calculada.
 * @returns {string} Observação, ou vazio.
 */
function descreverObservacao(livre) {
  const notas = [];
  if (livre.derivado) notas.push('modelo pelo nível');
  if (livre.ausentes?.length) notas.push(`dep. fora do quadro: ${livre.ausentes.join(' ')}`);
  return notas.join('; ');
}

/**
 * Tabela de situação por modelo: ocioso/ocupado e quantas livres.
 * @param {Object} resultado - Resultado do projeto lido.
 * @param {{nome: string, chave: string}[]} modelos - Modelos configurados.
 * @returns {string} Tabela em texto.
 */
function tabelaSituacao(resultado, modelos) {
  const linhas = modelos.map((modelo) => {
    const ocupadas = resultado.quadro.ocupacao[modelo.chave] ?? [];
    const livres = resultado.quadro.livres.filter((l) => l.chaves.includes(modelo.chave));
    return {
      modelo: modelo.nome,
      situacao: ocupadas.length ? `OCUPADO (${ocupadas.join(', ')})` : 'OCIOSO',
      livres: String(livres.length),
    };
  });
  const colunas = [
    { titulo: 'Modelo', chave: 'modelo' },
    { titulo: 'Situação', chave: 'situacao', maximo: MAXIMO_SITUACAO },
    { titulo: 'Livres', chave: 'livres' },
  ];
  return formatarTabela(colunas, linhas);
}

/**
 * Tabela das subtarefas livres de um modelo (já em ordem de prioridade).
 * @param {Object[]} livres - Subtarefas livres do modelo.
 * @param {number} limite - Quantas mostrar (0 = todas).
 * @returns {string} Tabela em texto, com a nota "e mais N" quando cortada.
 */
function tabelaLivres(livres, limite) {
  const mostradas = limite > 0 ? livres.slice(0, limite) : livres;
  const linhas = mostradas.map((livre) => ({
    id: livre.id,
    nivel: livre.nivel ?? '',
    prioridade: nomearPrioridade(livre.prioridade),
    titulo: limparTitulo(livre.titulo),
    obs: descreverObservacao(livre),
  }));
  const colunas = [
    { titulo: 'Tarefa', chave: 'id', maximo: 48 },
    { titulo: 'Nível', chave: 'nivel' },
    { titulo: 'Prioridade', chave: 'prioridade' },
    { titulo: 'Título', chave: 'titulo', maximo: MAXIMO_TITULO },
    { titulo: 'Obs', chave: 'obs', maximo: MAXIMO_OBSERVACAO },
  ];
  const resto = livres.length - mostradas.length;
  const nota = resto > 0 ? `\n... e mais ${resto} (use --tudo para listar todas)` : '';
  return formatarTabela(colunas, linhas) + nota;
}

/**
 * Avisos de modelo ocioso que tem subtarefa livre (quem pode pegar com o `;`).
 * @param {Object} resultado - Resultado do projeto lido.
 * @param {{nome: string, chave: string}[]} modelos - Modelos configurados.
 * @returns {string[]} Linhas de aviso.
 */
function listarAvisosOciosos(resultado, modelos) {
  const avisos = [];
  for (const modelo of modelos) {
    const ocupado = (resultado.quadro.ocupacao[modelo.chave] ?? []).length > 0;
    const livres = resultado.quadro.livres.filter((l) => l.chaves.includes(modelo.chave));
    if (!ocupado && livres.length > 0) {
      avisos.push(
        `AVISO: ${modelo.nome} ocioso com ${livres.length} livre(s); próxima: ${livres[0].id}`,
      );
    }
  }
  return avisos;
}

/**
 * Cabeçalho de um projeto lido: nome, commit do ramo, arquivo e total de linhas.
 * @param {Object} resultado - Resultado do projeto lido.
 * @returns {string} Linha de cabeçalho.
 */
function cabecalhoProjeto(resultado) {
  const { quadro } = resultado;
  const detalhes = `${resultado.ramo} @ ${resultado.commit}; ${resultado.caminhoQuadro}`;
  return `== ${resultado.pasta}  [${detalhes}; ${quadro.totalLinhas} linhas lidas]`;
}

/**
 * Texto completo de um projeto: situação por modelo, avisos e subtarefas livres.
 * @param {Object} resultado - Resultado do projeto.
 * @param {{modelos: string[], limite: number}} opcoes - Modelos da config e limite de linhas.
 * @returns {string} Bloco de texto do projeto.
 */
export function formatarProjeto(resultado, opcoes) {
  if (resultado.estado !== ESTADO_LIDO) {
    return [`== ${resultado.pasta}  [${resultado.estado}]`, ...resultado.avisos].join('\n');
  }
  const modelos = prepararModelos(opcoes.modelos);
  const partes = [cabecalhoProjeto(resultado), tabelaSituacao(resultado, modelos)];
  partes.push(...resultado.avisos.map((aviso) => `AVISO: ${aviso}`));
  partes.push(...listarAvisosOciosos(resultado, modelos));

  for (const modelo of modelos) {
    const livres = resultado.quadro.livres.filter((l) => l.chaves.includes(modelo.chave));
    if (livres.length === 0) continue;
    partes.push('', `Livres para ${modelo.nome}:`, tabelaLivres(livres, opcoes.limite));
  }
  return partes.join('\n');
}

/**
 * Resumo geral: uma linha por projeto, com a contagem de livres por modelo.
 * @param {Object[]} resultados - Resultados de todos os projetos.
 * @param {string[]} nomesModelos - Modelos da configuração.
 * @returns {string} Tabela de resumo.
 */
export function formatarResumo(resultados, nomesModelos) {
  const modelos = prepararModelos(nomesModelos);
  const linhas = resultados.map((resultado) => {
    const linha = { projeto: resultado.pasta, estado: resultado.estado };
    for (const modelo of modelos) {
      const livres = resultado.quadro?.livres ?? [];
      linha[modelo.chave] = resultado.quadro
        ? String(livres.filter((l) => l.chaves.includes(modelo.chave)).length)
        : '-';
    }
    return linha;
  });
  const colunas = [
    { titulo: 'Projeto', chave: 'projeto', maximo: 40 },
    { titulo: 'Estado', chave: 'estado' },
    ...modelos.map((modelo) => ({ titulo: `Livres ${modelo.nome}`, chave: modelo.chave })),
  ];
  return formatarTabela(colunas, linhas);
}
