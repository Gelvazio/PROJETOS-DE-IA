/**
 * Leitor e escritor do quadro de tarefas (`tasks/STATUS.md` e `tasks/task_complete.md`).
 *
 * As colunas são achadas pelo nome do cabeçalho (R2.2), então o mesmo código lê quadros com e
 * sem `Modelo` e `Verificado`. O escritor só troca o texto da célula pedida: a ordem das linhas
 * e a formatação do resto da tabela ficam byte a byte iguais (INV-2).
 *
 * Também lê e grava o índice simplificado do STATUS.md (C55): cada item vira um registro com os
 * mesmos campos da tabela, e a reserva e a entrega reescrevem só o item, no formato do arquivo.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

import {
  ARQUIVO_CONCLUIDAS,
  ARQUIVO_STATUS,
  CODIGOS_ERRO,
  COLUNAS_PADRAO,
  EMOJI_CONCLUIDO,
  EMOJI_PENDENTE,
  EMOJIS_STATUS,
  ErroQuadro,
  TAMANHO_MAXIMO_ARQUIVO,
  TEXTO_NAO_RESERVAVEL,
  TEXTO_TRAVA_ESPECIAL,
  VALOR_COLUNA_VAZIA,
  VALORES_LIVRES,
  VALORES_SEM_DEPENDENCIA,
} from './config.mjs';
import { resolverCaminhoDeTasks } from './projetos.mjs';
import {
  ErroFormatoQuadro,
  FORMATOS,
  MENSAGEM_FORMATO_DESCONHECIDO,
  detectarFormato,
  lerIndiceSimplificado,
  reescreverItem,
} from '../scripts/jev/quadro-formato.mjs';

/** Nome normalizado de cada coluna conhecida -> chave usada nos registros. */
const CHAVES_DAS_COLUNAS = {
  tarefa: 'codigo',
  titulo: 'titulo',
  prioridade: 'prioridade',
  modelo: 'modelo',
  'depende de': 'dependeDe',
  status: 'status',
  'em uso por': 'emUsoPor',
  etapa: 'etapa',
  verificado: 'verificado',
};

/** Colunas que o MCP pode alterar. Nível, modelo, prioridade e dependência ficam de fora. */
const COLUNAS_EDITAVEIS = ['status', 'emUsoPor', 'verificado', 'etapa'];

/** Campos que o MCP pode alterar no índice simplificado (não há Verificado nem Etapa editável). */
const CAMPOS_EDITAVEIS_SIMPLIFICADO = ['status', 'emUsoPor'];

/** Colunas sem as quais a tabela não é o quadro de tarefas. */
const COLUNAS_OBRIGATORIAS = ['codigo', 'status', 'emUsoPor'];

const PADRAO_NIVEL = /\b(LEVE|MEDIO|PESADO)\b/;
const PADRAO_LINK = /\]\(([^)\s]+)\)/;
const PADRAO_PIPE_LIVRE = /(?<!\\)\|/;
const PADRAO_CELULA_SEPARADOR = /^\s*:?-{3,}:?\s*$/;
const PADRAO_CAMPO_DA_ETAPA = /^(?:- )?\*\*([^*:]+):\*\*\s*(.*)$/;
const MARCA_BOM = '﻿';

/**
 * Normaliza texto para comparação: minúsculas, sem acento, sem espaços nas pontas.
 * @param {string} texto - Texto original.
 * @returns {string} Texto normalizado.
 */
export function normalizarTexto(texto) {
  return String(texto).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

/**
 * Divide uma linha de tabela nos trechos entre barras verticais (barra escapada não conta).
 * @param {string} linha - Linha começando com `|`.
 * @returns {string[]} Trechos brutos, com o primeiro (antes da 1ª barra) e o último incluídos.
 */
function dividirLinha(linha) {
  return linha.split(PADRAO_PIPE_LIVRE);
}

/**
 * Extrai as células de uma linha de tabela.
 * @param {string} linha - Linha da tabela.
 * @returns {string[]} Células sem espaços nas pontas.
 */
function extrairCelulas(linha) {
  const trechos = dividirLinha(linha);
  const terminaEmBarra = trechos[trechos.length - 1].trim() === '';
  const fim = terminaEmBarra ? -1 : undefined;
  return trechos.slice(1, fim).map((celula) => celula.trim());
}

/**
 * Diz se a linha é uma linha de tabela.
 * @param {string} linha - Linha do arquivo.
 * @returns {boolean} true se começa com `|`.
 */
function ehLinhaDeTabela(linha) {
  return linha.trimStart().startsWith('|');
}

/**
 * Diz se a linha é a linha separadora (`|---|---|`) de uma tabela.
 * @param {string} linha - Linha do arquivo.
 * @returns {boolean} true se todas as células forem traços.
 */
function ehSeparador(linha) {
  if (!ehLinhaDeTabela(linha)) return false;
  const celulas = extrairCelulas(linha);
  return celulas.length > 0 && celulas.every((celula) => PADRAO_CELULA_SEPARADOR.test(celula));
}

/**
 * Monta o mapa chave -> índice de coluna a partir dos nomes do cabeçalho.
 * @param {string[]} nomes - Nomes das colunas.
 * @returns {Record<string, number>} Mapa das colunas conhecidas.
 */
function mapearColunas(nomes) {
  const colunas = {};
  nomes.forEach((nome, indice) => {
    const chave = CHAVES_DAS_COLUNAS[normalizarTexto(nome)];
    if (chave && colunas[chave] === undefined) colunas[chave] = indice;
  });
  return colunas;
}

/**
 * Diz se o mapa de colunas tem as colunas do quadro de tarefas.
 * @param {Record<string, number>} colunas - Mapa chave -> índice.
 * @returns {boolean} true se tiver tarefa, status e "em uso por".
 */
function temColunasObrigatorias(colunas) {
  return COLUNAS_OBRIGATORIAS.every((chave) => colunas[chave] !== undefined);
}

/**
 * Acha o fim (exclusivo) do bloco de linhas de tabela que começa em `inicio`.
 * @param {string[]} linhas - Linhas do arquivo.
 * @param {number} inicio - Índice da primeira linha do bloco.
 * @returns {number} Índice da primeira linha depois do bloco.
 */
function acharFimDoBloco(linhas, inicio) {
  let fim = inicio;
  while (fim < linhas.length && ehLinhaDeTabela(linhas[fim])) fim += 1;
  return fim;
}

/**
 * Procura a tabela de tarefas pelo cabeçalho.
 * @param {string[]} linhas - Linhas do arquivo.
 * @returns {object|null} Descrição da tabela ou null se não houver cabeçalho do quadro.
 */
function localizarTabelaComCabecalho(linhas) {
  for (let i = 0; i + 1 < linhas.length; i += 1) {
    if (!ehLinhaDeTabela(linhas[i]) || !ehSeparador(linhas[i + 1])) continue;
    const nomes = extrairCelulas(linhas[i]);
    const colunas = mapearColunas(nomes);
    if (!temColunasObrigatorias(colunas)) continue;
    const primeiraLinha = i + 2;
    const ultimaLinha = acharFimDoBloco(linhas, primeiraLinha);
    return { cabecalhoIndice: i, nomes, colunas, primeiraLinha, ultimaLinha };
  }
  return null;
}

/**
 * Descreve a tabela de um arquivo sem cabeçalho (usa os nomes padrão).
 * @param {string[]} linhas - Linhas do arquivo.
 * @param {string[]} nomes - Nomes das colunas a assumir.
 * @returns {object} Descrição da tabela (pode ter zero linhas).
 */
function localizarTabelaSemCabecalho(linhas, nomes) {
  const primeira = linhas.findIndex(ehLinhaDeTabela);
  const fimDoArquivo = linhas[linhas.length - 1] === '' ? linhas.length - 1 : linhas.length;
  const primeiraLinha = primeira === -1 ? fimDoArquivo : primeira;
  const ultimaLinha = primeira === -1 ? fimDoArquivo : acharFimDoBloco(linhas, primeira);
  return { cabecalhoIndice: -1, nomes, colunas: mapearColunas(nomes), primeiraLinha, ultimaLinha };
}

/**
 * Tira a formatação do código da tarefa (negrito e crases).
 * @param {string} bruto - Conteúdo da célula "Tarefa".
 * @returns {string} Código limpo.
 */
function limparCodigo(bruto) {
  return bruto.replace(/[*`]/g, '').trim();
}

/**
 * Acha o nível (LEVE, MEDIO, PESADO ou USUARIO) escrito numa célula ou campo.
 * @param {string} texto - Texto como "MEDIO · só Sonnet".
 * @returns {string|null} Nível ou null se não houver.
 */
export function extrairNivel(texto) {
  const normalizado = normalizarTexto(texto ?? '').toUpperCase();
  const achado = PADRAO_NIVEL.exec(normalizado);
  if (achado) return achado[1];
  return normalizado.startsWith('USUARIO') ? 'USUARIO' : null;
}

/**
 * Lê a lista de dependências de uma célula "Depende de".
 * @param {string} texto - Ex.: "A.1, B.2" ou "Nenhuma".
 * @returns {string[]} Códigos das dependências.
 */
export function extrairDependencias(texto) {
  const limpo = limparCodigo(texto ?? '');
  if (VALORES_SEM_DEPENDENCIA.includes(normalizarTexto(limpo))) return [];
  return limpo
    .split(/[,;]|\se\s/)
    .map((parte) => /[\p{L}\p{N}#][\p{L}\p{N}#._-]*/u.exec(parte.trim())?.[0] ?? '')
    .map((codigo) => codigo.replace(/[._-]+$/, ''))
    .filter((codigo) => codigo && !VALORES_SEM_DEPENDENCIA.includes(normalizarTexto(codigo)));
}

/**
 * Acha o emoji de status no começo da célula "Status".
 * @param {string} status - Texto da célula.
 * @returns {string|null} Emoji da legenda ou null.
 */
function extrairEmoji(status) {
  const semVariacao = status.replace(/️/g, '');
  return EMOJIS_STATUS.find((emoji) => semVariacao.startsWith(emoji)) ?? null;
}

/**
 * Diz se a célula "Em uso por" indica linha sem reserva.
 * @param {string} emUsoPor - Texto da célula.
 * @returns {boolean} true se ninguém reservou e não é mãe nem trava especial.
 */
function estaSemReserva(emUsoPor) {
  const texto = normalizarTexto(emUsoPor);
  const ehTrava = texto.includes(TEXTO_TRAVA_ESPECIAL) || emUsoPor.includes('🔒');
  const ehMae = texto.includes(normalizarTexto(TEXTO_NAO_RESERVAVEL));
  return VALORES_LIVRES.includes(texto) && !ehTrava && !ehMae;
}

/**
 * Transforma uma linha da tabela em registro com campos por nome.
 * @param {string} linha - Linha bruta da tabela.
 * @param {number} indice - Índice da linha no arquivo.
 * @param {{nomes: string[], colunas: Record<string, number>}} tabela - Descrição da tabela.
 * @returns {object} Registro da tarefa.
 */
function interpretarRegistro(linha, indice, tabela) {
  const celulas = extrairCelulas(linha);
  const valor = (chave) => celulas[tabela.colunas[chave]] ?? '';
  const status = valor('status');
  const emUsoPor = valor('emUsoPor');
  const emoji = extrairEmoji(status);
  const marcadaComoMae = valor('codigo').startsWith('**');
  const ehMae = marcadaComoMae || normalizarTexto(emUsoPor).includes('nao reserv');
  return {
    indice,
    bruto: linha,
    celulas,
    codigo: limparCodigo(valor('codigo')),
    titulo: valor('titulo'),
    prioridade: valor('prioridade'),
    modelo: valor('modelo'),
    nivel: extrairNivel(valor('modelo')),
    dependencias: extrairDependencias(valor('dependeDe')),
    status,
    emoji,
    emUsoPor,
    etapa: valor('etapa'),
    etapaLink: PADRAO_LINK.exec(valor('etapa'))?.[1] ?? null,
    verificado: valor('verificado'),
    ehMae,
    estaLivre: !ehMae && emoji === EMOJI_PENDENTE && estaSemReserva(emUsoPor),
  };
}

/**
 * Transforma um item do índice simplificado num registro igual ao da tabela.
 * @param {object} item - Item de `lerIndiceSimplificado`.
 * @returns {object} Registro da tarefa (com `item` para a reescrita).
 */
function registroDoItem(item) {
  const etapa = item.etapaLink ? `[${item.etapaRotulo}](${item.etapaLink})` : VALOR_COLUNA_VAZIA;
  const dependeDe = item.dependeDe || VALOR_COLUNA_VAZIA;
  const emoji = extrairEmoji(item.status);
  const celulas = [item.id, item.titulo, item.prioridade, item.modelo, dependeDe, item.status,
    item.emUsoPor, etapa];
  const podeReservar = !item.ehMae && !item.agrupada && emoji === EMOJI_PENDENTE;
  return {
    indice: item.indice,
    bruto: item.bruto,
    celulas,
    codigo: item.id,
    codigoCurto: item.idCurto,
    titulo: item.titulo,
    prioridade: item.prioridade,
    modelo: item.modelo,
    nivel: extrairNivel(item.modelo),
    dependencias: extrairDependencias(item.dependeDe),
    status: item.status,
    emoji,
    emUsoPor: item.emUsoPor,
    etapa,
    etapaLink: item.etapaLink,
    verificado: '',
    ehMae: item.ehMae,
    agrupada: item.agrupada,
    idMae: item.idMae,
    item,
    estaLivre: podeReservar && estaSemReserva(item.emUsoPor),
  };
}

/**
 * Monta o quadro a partir do índice simplificado. A "tabela" usa as colunas padrão, para o
 * `task_complete.md` sem cabeçalho e a conversão de linha funcionarem igual.
 * @param {{linhas: string[], eol: string, bom: boolean}} base - Texto já dividido.
 * @param {object} opcoes - Opções de leitura.
 * @returns {object} Quadro analisado, com `formato: 'simplificado'`.
 */
function analisarSimplificado(base, opcoes) {
  const indice = lerIndiceSimplificado(base.linhas.join('\n'));
  const tabela = {
    cabecalhoIndice: -1,
    nomes: COLUNAS_PADRAO,
    colunas: mapearColunas(COLUNAS_PADRAO),
    primeiraLinha: indice.secao.inicio,
    ultimaLinha: indice.secao.fim,
  };
  const registros = indice.itens.map(registroDoItem);
  return { ...base, opcoes, formato: FORMATOS.SIMPLIFICADO, tabela, registros };
}

/**
 * Diz se o quadro analisado está no formato simplificado.
 * @param {object} quadro - Quadro analisado.
 * @returns {boolean} true para o índice simplificado.
 */
export function ehQuadroSimplificado(quadro) {
  return quadro?.formato === FORMATOS.SIMPLIFICADO;
}

/**
 * Monta o quadro (linhas + tabela + registros) a partir das linhas do arquivo.
 * @param {{linhas: string[], eol: string, bom: boolean}} base - Texto já dividido.
 * @param {{nomesPadrao?: string[], aceitarSemCabecalho?: boolean}} [opcoes] - Opções.
 * @returns {object} Quadro analisado.
 * @throws {ErroQuadro} Se não houver cabeçalho do quadro e `aceitarSemCabecalho` for falso.
 */
function analisarQuadro(base, opcoes = {}) {
  const { nomesPadrao = COLUNAS_PADRAO, aceitarSemCabecalho = false } = opcoes;
  let tabela = localizarTabelaComCabecalho(base.linhas);
  const ehSimplificado = !tabela
    && detectarFormato(base.linhas.join('\n')) === FORMATOS.SIMPLIFICADO;
  if (ehSimplificado) return analisarSimplificado(base, opcoes);
  if (!tabela && aceitarSemCabecalho) {
    tabela = localizarTabelaSemCabecalho(base.linhas, nomesPadrao);
  }
  if (!tabela) {
    throw new ErroQuadro(CODIGOS_ERRO.QUADRO_INVALIDO, MENSAGEM_FORMATO_DESCONHECIDO);
  }
  const registros = [];
  for (let i = tabela.primeiraLinha; i < tabela.ultimaLinha; i += 1) {
    registros.push(interpretarRegistro(base.linhas[i], i, tabela));
  }
  return { ...base, opcoes, tabela, registros };
}

/**
 * Lê o texto de um quadro.
 * @param {string} texto - Conteúdo do arquivo.
 * @param {{nomesPadrao?: string[], aceitarSemCabecalho?: boolean}} [opcoes] - Opções.
 *   Para `task_complete.md` sem cabeçalho, use `aceitarSemCabecalho: true`.
 * @returns {object} Quadro analisado.
 * @throws {ErroQuadro} Se o cabeçalho do quadro não existir.
 */
export function lerQuadro(texto, opcoes = {}) {
  const bom = texto.startsWith(MARCA_BOM);
  const semBom = bom ? texto.slice(1) : texto;
  const eol = semBom.includes('\r\n') ? '\r\n' : '\n';
  return analisarQuadro({ linhas: semBom.split(/\r?\n/), eol, bom }, opcoes);
}

/**
 * Devolve o texto do quadro, igual ao original onde nada foi alterado.
 * @param {{linhas: string[], eol: string, bom: boolean}} quadro - Quadro.
 * @returns {string} Texto para gravar.
 */
export function serializarQuadro(quadro) {
  return (quadro.bom ? MARCA_BOM : '') + quadro.linhas.join(quadro.eol);
}

/**
 * Confere o quadro (INV-2): cada linha com o número de colunas do cabeçalho, emoji de status
 * e código preenchido.
 * @param {object} quadro - Quadro analisado.
 * @returns {Array<{linha: number, motivo: string, texto: string}>} Problemas achados.
 */
export function validarQuadro(quadro) {
  const problemas = [];
  const esperado = quadro.tabela.nomes.length;
  for (const registro of quadro.registros) {
    const motivos = [];
    const contaColunas = !ehQuadroSimplificado(quadro);
    if (contaColunas && registro.celulas.length !== esperado) {
      motivos.push('número de colunas diferente');
    }
    if (!registro.emoji) motivos.push('status sem emoji');
    if (!registro.codigo) motivos.push('tarefa sem código');
    for (const motivo of motivos) {
      problemas.push({ linha: registro.indice + 1, motivo, texto: registro.bruto });
    }
  }
  return problemas;
}

/**
 * Procura uma tarefa pelo código.
 * @param {object} quadro - Quadro analisado.
 * @param {string} codigo - Código da tarefa ou subtarefa.
 * @returns {object} O registro.
 * @throws {ErroQuadro} Se não existir ou se o código aparecer mais de uma vez.
 */
export function buscarRegistro(quadro, codigo) {
  const achados = quadro.registros.filter((registro) => registro.codigo === codigo);
  if (achados.length === 0) {
    throw new ErroQuadro(CODIGOS_ERRO.TAREFA_NAO_ENCONTRADA, 'Tarefa não está no quadro.');
  }
  if (achados.length > 1) {
    throw new ErroQuadro(CODIGOS_ERRO.TAREFA_DUPLICADA, 'Código repetido no quadro.');
  }
  return achados[0];
}

/**
 * Prepara o valor de uma célula: uma linha só, com barras escapadas.
 * @param {unknown} valor - Texto a gravar.
 * @returns {string} Texto seguro para a tabela.
 * @throws {ErroQuadro} Se tiver quebra de linha.
 */
function prepararValorDaCelula(valor) {
  const texto = String(valor).trim();
  if (/[\r\n]/.test(texto)) {
    throw new ErroQuadro(CODIGOS_ERRO.QUADRO_INVALIDO, 'Valor de célula com quebra de linha.');
  }
  return texto.replace(/(?<!\\)\|/g, '\\|');
}

/**
 * Cria um novo quadro trocando linhas, sem alterar o original.
 * @param {object} quadro - Quadro analisado.
 * @param {string[]} linhas - Novas linhas do arquivo.
 * @returns {object} Novo quadro analisado.
 */
function refazerQuadro(quadro, linhas) {
  return analisarQuadro({ linhas, eol: quadro.eol, bom: quadro.bom }, quadro.opcoes);
}

/**
 * Troca o texto de células de uma tarefa (só `status`, `emUsoPor`, `verificado` e `etapa`).
 * As demais células e as demais linhas ficam iguais.
 * @param {object} quadro - Quadro analisado.
 * @param {string} codigo - Código da tarefa.
 * @param {Record<string, string>} alteracoes - Chave da coluna -> novo texto.
 * @returns {object} Novo quadro.
 * @throws {ErroQuadro} Se a coluna não puder ser alterada ou não existir no quadro.
 */
export function atualizarLinha(quadro, codigo, alteracoes) {
  if (ehQuadroSimplificado(quadro)) return atualizarItemSimplificado(quadro, codigo, alteracoes);
  const registro = buscarRegistro(quadro, codigo);
  const trechos = dividirLinha(registro.bruto);
  for (const [chave, valor] of Object.entries(alteracoes)) {
    const indice = quadro.tabela.colunas[chave];
    if (!COLUNAS_EDITAVEIS.includes(chave) || indice === undefined) {
      throw new ErroQuadro(CODIGOS_ERRO.COLUNA_AUSENTE, `Coluna não editável: ${chave}.`);
    }
    if (trechos[indice + 1] === undefined) {
      throw new ErroQuadro(CODIGOS_ERRO.QUADRO_INVALIDO, 'Linha com menos colunas.');
    }
    trechos[indice + 1] = ` ${prepararValorDaCelula(valor)} `;
  }
  const linhas = [...quadro.linhas];
  linhas[registro.indice] = trechos.join('|');
  return refazerQuadro(quadro, linhas);
}

/**
 * Troca status e/ou reserva de um item do índice simplificado; o resto do arquivo não muda.
 * @param {object} quadro - Quadro simplificado.
 * @param {string} codigo - Código da subtarefa.
 * @param {Record<string, string>} alteracoes - `status` e/ou `emUsoPor`.
 * @returns {object} Novo quadro.
 * @throws {ErroQuadro} Se o campo não for editável ou a linha nova não ler igual ao pedido.
 */
function atualizarItemSimplificado(quadro, codigo, alteracoes) {
  const registro = buscarRegistro(quadro, codigo);
  const pedido = {};
  for (const [chave, valor] of Object.entries(alteracoes)) {
    if (!CAMPOS_EDITAVEIS_SIMPLIFICADO.includes(chave)) {
      throw new ErroQuadro(CODIGOS_ERRO.COLUNA_AUSENTE, `Campo não editável no índice: ${chave}.`);
    }
    pedido[chave] = prepararValorDoItem(valor);
  }
  let novaLinha;
  try {
    novaLinha = reescreverItem(registro.item, pedido);
  } catch (erro) {
    if (!(erro instanceof ErroFormatoQuadro)) throw erro;
    throw new ErroQuadro(CODIGOS_ERRO.QUADRO_INVALIDO, erro.message);
  }
  const linhas = [...quadro.linhas];
  linhas[registro.indice] = novaLinha;
  return refazerQuadro(quadro, linhas);
}

/**
 * Prepara um valor para o índice simplificado: uma linha só (as barras ficam como estão).
 * @param {unknown} valor - Texto a gravar.
 * @returns {string} Texto sem espaços nas pontas.
 * @throws {ErroQuadro} Se tiver quebra de linha.
 */
function prepararValorDoItem(valor) {
  const texto = String(valor).trim();
  if (/[\r\n]/.test(texto)) {
    throw new ErroQuadro(CODIGOS_ERRO.QUADRO_INVALIDO, 'Valor com quebra de linha.');
  }
  return texto;
}

/**
 * Monta a linha da tabela de destino a partir de um item do índice simplificado.
 * @param {object} registro - Registro de origem (índice simplificado).
 * @param {object} destino - Quadro de destino (tabela).
 * @returns {string} Linha pronta para o destino.
 */
function linhaDeTabelaDoItem(registro, destino) {
  const nomesOrigem = COLUNAS_PADRAO.map(normalizarTexto);
  const celulas = destino.tabela.nomes.map(normalizarTexto).map((nome) => {
    const posicao = nomesOrigem.indexOf(nome);
    const valor = posicao === -1 ? VALOR_COLUNA_VAZIA : (registro.celulas[posicao] ?? '');
    return prepararValorDaCelula(valor || VALOR_COLUNA_VAZIA);
  });
  return `| ${celulas.join(' | ')} |`;
}

/**
 * Recusa mover o que o índice simplificado não deixa: item agrupado, mãe com subtarefas ainda no
 * índice e destino que não é tabela.
 * @param {object} registro - Registro de origem.
 * @param {object} origem - Quadro de origem.
 * @param {object} destino - Quadro de destino.
 * @returns {void}
 * @throws {ErroQuadro} Se o movimento deixaria o quadro inconsistente.
 */
function conferirMovimentoSimplificado(registro, origem, destino) {
  if (ehQuadroSimplificado(destino)) {
    throw new ErroQuadro(CODIGOS_ERRO.QUADRO_INVALIDO, 'O destino precisa ser uma tabela.');
  }
  if (!ehQuadroSimplificado(origem)) return;
  if (registro.agrupada) {
    throw new ErroQuadro(CODIGOS_ERRO.QUADRO_INVALIDO, 'Subtarefa agrupada: separe o item antes.');
  }
  const temFilhas = origem.registros.some((outro) => outro.idMae === registro.codigo);
  if (registro.ehMae && temFilhas) {
    throw new ErroQuadro(CODIGOS_ERRO.QUADRO_INVALIDO, 'A mãe ainda tem subtarefas no índice.');
  }
}

/**
 * Monta a linha de destino com as colunas do quadro de destino (por nome).
 * @param {object} registro - Registro de origem.
 * @param {object} origem - Quadro de origem.
 * @param {object} destino - Quadro de destino.
 * @returns {string} Linha pronta para o destino.
 */
function converterLinha(registro, origem, destino) {
  if (ehQuadroSimplificado(origem)) return linhaDeTabelaDoItem(registro, destino);
  const nomesOrigem = origem.tabela.nomes.map(normalizarTexto);
  const nomesDestino = destino.tabela.nomes.map(normalizarTexto);
  if (nomesOrigem.join('|') === nomesDestino.join('|')) return registro.bruto;
  const celulas = nomesDestino.map((nome) => {
    const posicao = nomesOrigem.indexOf(nome);
    return posicao === -1 ? VALOR_COLUNA_VAZIA : (registro.celulas[posicao] ?? '');
  });
  return `| ${celulas.join(' | ')} |`;
}

/**
 * Move uma linha de um quadro para o fim da tabela do outro (move, não copia: C4).
 * @param {object} origem - Quadro de onde a linha sai.
 * @param {object} destino - Quadro onde a linha entra, depois da última linha da tabela.
 * @param {string} codigo - Código da tarefa.
 * @returns {{origem: object, destino: object, linha: string}} Os dois quadros novos.
 * @throws {ErroQuadro} Se a tarefa não existir na origem ou já existir no destino.
 */
export function moverLinha(origem, destino, codigo) {
  const registro = buscarRegistro(origem, codigo);
  conferirMovimentoSimplificado(registro, origem, destino);
  if (destino.registros.some((outro) => outro.codigo === codigo)) {
    throw new ErroQuadro(CODIGOS_ERRO.TAREFA_DUPLICADA, 'Tarefa já está no destino.');
  }
  const linha = converterLinha(registro, origem, destino);
  const linhasOrigem = origem.linhas.filter((_, posicao) => posicao !== registro.indice);
  const linhasDestino = [...destino.linhas];
  linhasDestino.splice(destino.tabela.ultimaLinha, 0, linha);
  return {
    origem: refazerQuadro(origem, linhasOrigem),
    destino: refazerQuadro(destino, linhasDestino),
    linha,
  };
}

/**
 * Lista as dependências de uma tarefa que ainda não estão ✅.
 * Dependência que não aparece em nenhum dos dois quadros conta como pendente.
 * @param {string[]} dependencias - Códigos de que a tarefa depende.
 * @param {object} aberto - Quadro `STATUS.md`.
 * @param {object|null} concluidas - Quadro `task_complete.md` (ou null se não existir).
 * @returns {string[]} Códigos pendentes.
 */
export function dependenciasPendentes(dependencias, aberto, concluidas) {
  const todos = [...aberto.registros, ...(concluidas?.registros ?? [])];
  const concluidos = todos.filter((r) => r.emoji === EMOJI_CONCLUIDO);
  const feitos = new Set(concluidos.map((r) => r.codigo));
  // No índice simplificado a mãe é "400-8e2a4c60" e a dependência cita só "400".
  for (const registro of concluidos) if (registro.codigoCurto) feitos.add(registro.codigoCurto);
  return dependencias.filter((codigo) => !feitos.has(codigo));
}

/**
 * Escapa texto para uso dentro de uma expressão regular.
 * @param {string} texto - Texto literal.
 * @returns {string} Texto escapado.
 */
function escaparParaRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Localiza a seção `### <codigo> — ...` de uma subtarefa na etapa.
 * A seção vai até o próximo título de nível igual ou mais alto.
 * @param {string[]} linhas - Linhas da etapa.
 * @param {string} codigo - Código da subtarefa.
 * @returns {{inicio: number, fim: number}|null} Faixa de linhas (fim exclusivo) ou null.
 */
export function localizarSecao(linhas, codigo) {
  const fimDoCodigo = '(?![\\p{L}\\p{N}._#-])';
  const alvo = `${escaparParaRegex(codigo)}${fimDoCodigo}`;
  const titulo = new RegExp(`^(#{2,4})\\s+\\**#?${alvo}`, 'u');
  const inicio = linhas.findIndex((linha) => titulo.test(linha));
  if (inicio === -1) return null;
  const nivel = titulo.exec(linhas[inicio])[1].length;
  let fim = inicio + 1;
  while (fim < linhas.length) {
    const marcas = /^(#{1,6})\s/.exec(linhas[fim]);
    if (marcas && marcas[1].length <= nivel) break;
    fim += 1;
  }
  return { inicio, fim };
}

/**
 * Extrai os campos `- **Nome:** valor` e `**Nome:** valor` da seção (com linhas de continuação
 * indentadas).
 * @param {string[]} linhas - Linhas da etapa.
 * @param {{inicio: number, fim: number}} secao - Faixa da seção.
 * @returns {Array<{nome: string, chave: string, inicio: number, fim: number, valor: string}>}
 */
function extrairCampos(linhas, secao) {
  const campos = [];
  for (let i = secao.inicio + 1; i < secao.fim; i += 1) {
    const achado = PADRAO_CAMPO_DA_ETAPA.exec(linhas[i]);
    if (!achado) continue;
    let fim = i + 1;
    while (fim < secao.fim && /^\s+\S/.test(linhas[fim])) fim += 1;
    const chave = normalizarTexto(achado[1]).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const continuacao = linhas.slice(i + 1, fim).map((linha) => linha.trim());
    const valor = [achado[2], ...continuacao].join('\n');
    campos.push({ nome: achado[1], chave, inicio: i, fim, valor });
    i = fim - 1;
  }
  return campos;
}

/**
 * Lê da etapa os dados de uma subtarefa: nível, modelo, critérios, dependências etc.
 * @param {string} textoEtapa - Conteúdo do arquivo da etapa.
 * @param {string} codigo - Código da subtarefa.
 * @returns {object|null} Dados da subtarefa ou null se a etapa não tiver a seção.
 */
export function lerSubtarefaDaEtapa(textoEtapa, codigo) {
  const linhas = textoEtapa.split(/\r?\n/);
  const secao = localizarSecao(linhas, codigo);
  if (!secao) return null;
  const campos = {};
  for (const campo of extrairCampos(linhas, secao)) campos[campo.chave] ??= campo.valor;
  return {
    titulo: linhas[secao.inicio].replace(/^#+\s+/, ''),
    nivel: extrairNivel(campos.nivel),
    modelo: campos.modelo ?? '',
    effort: campos.effort ?? '',
    dependencias: extrairDependencias(campos.depende_de),
    descricao: campos.descricao ?? '',
    criterios: campos.criterios_de_aceitacao ?? campos.criterios ?? '',
    arquivos: campos.arquivos ?? '',
    proximoPasso: campos.proximo_passo ?? '',
    campos,
  };
}

/**
 * Formata um campo da etapa, com continuação indentada se o valor tiver várias linhas.
 * @param {string} prefixo - `- ` ou vazio, igual ao do campo original.
 * @param {{nome: string, valor: string}} campo - Nome e valor.
 * @returns {string[]} Linhas do campo.
 */
function formatarCampo(prefixo, campo) {
  const [primeira, ...resto] = String(campo.valor).split('\n');
  return [`${prefixo}**${campo.nome}:** ${primeira}`, ...resto.map((linha) => `  ${linha}`)];
}

/**
 * Troca (ou acrescenta) um campo na seção de UMA subtarefa da etapa. O resto do arquivo não muda.
 * @param {string} textoEtapa - Conteúdo da etapa.
 * @param {string} codigo - Código da subtarefa.
 * @param {{nome: string, valor: string}} campo - Nome do campo (ex.: `Entrega`) e novo valor.
 * @returns {string} Novo conteúdo da etapa.
 * @throws {ErroQuadro} Se a etapa não tiver a seção da subtarefa.
 */
export function atualizarCampoDaSubtarefa(textoEtapa, codigo, campo) {
  const eol = textoEtapa.includes('\r\n') ? '\r\n' : '\n';
  const linhas = textoEtapa.split(/\r?\n/);
  const secao = localizarSecao(linhas, codigo);
  if (!secao) throw new ErroQuadro(CODIGOS_ERRO.ETAPA_SEM_SECAO, 'Etapa sem seção da subtarefa.');
  const chave = normalizarTexto(campo.nome).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const existente = extrairCampos(linhas, secao).find((item) => item.chave === chave);
  if (existente) {
    const prefixo = linhas[existente.inicio].startsWith('- ') ? '- ' : '';
    const novas = formatarCampo(prefixo, { nome: existente.nome, valor: campo.valor });
    linhas.splice(existente.inicio, existente.fim - existente.inicio, ...novas);
    return linhas.join(eol);
  }
  let posicao = secao.fim;
  while (posicao > secao.inicio + 1 && linhas[posicao - 1].trim() === '') posicao -= 1;
  linhas.splice(posicao, 0, ...formatarCampo('- ', campo));
  return linhas.join(eol);
}

/**
 * Lê um arquivo de tasks/ do projeto (só os caminhos permitidos).
 * @param {{caminho: string}} projeto - Projeto.
 * @param {string} relativo - Caminho relativo ao projeto.
 * @returns {Promise<string|null>} Conteúdo, ou null se o arquivo não existir.
 * @throws {ErroQuadro} Se o caminho for recusado ou o arquivo for grande demais.
 */
export async function lerArquivoDeTasks(projeto, relativo) {
  const absoluto = await resolverCaminhoDeTasks(projeto, relativo);
  let dados;
  try {
    dados = await fs.stat(absoluto);
  } catch {
    return null;
  }
  if (dados.size > TAMANHO_MAXIMO_ARQUIVO) {
    throw new ErroQuadro(CODIGOS_ERRO.ARQUIVO_GRANDE, 'Arquivo grande demais.');
  }
  return fs.readFile(absoluto, 'utf8');
}

/**
 * Lê os dois quadros do projeto.
 * @param {{caminho: string}} projeto - Projeto.
 * @returns {Promise<{aberto: object, concluidas: object|null}>} Quadros analisados.
 * @throws {ErroQuadro} Se o STATUS.md não existir ou não tiver cabeçalho de quadro.
 */
export async function lerQuadrosDoProjeto(projeto) {
  const textoAberto = await lerArquivoDeTasks(projeto, ARQUIVO_STATUS);
  if (textoAberto === null) {
    throw new ErroQuadro(CODIGOS_ERRO.QUADRO_INVALIDO, 'tasks/STATUS.md não existe.');
  }
  const aberto = lerQuadro(textoAberto);
  const textoConcluidas = await lerArquivoDeTasks(projeto, ARQUIVO_CONCLUIDAS);
  if (textoConcluidas === null) return { aberto, concluidas: null };
  const opcoes = { nomesPadrao: aberto.tabela.nomes, aceitarSemCabecalho: true };
  return { aberto, concluidas: lerQuadro(textoConcluidas, opcoes) };
}

/**
 * Lê uma subtarefa: a linha do quadro, os dados da etapa e as dependências pendentes.
 * @param {{caminho: string}} projeto - Projeto.
 * @param {string} codigo - Código da subtarefa.
 * @returns {Promise<object>} `{ registro, etapa, arquivoEtapa, nivel, dependencias, pendentes }`.
 * @throws {ErroQuadro} Se a tarefa não existir no quadro.
 */
export async function lerSubtarefa(projeto, codigo) {
  const { aberto, concluidas } = await lerQuadrosDoProjeto(projeto);
  const registro = buscarRegistro(aberto, codigo);
  let etapa = null;
  let arquivoEtapa = null;
  if (registro.etapaLink) {
    arquivoEtapa = path.posix.join('tasks', registro.etapaLink.split('#')[0]);
    const texto = await lerArquivoDeTasks(projeto, arquivoEtapa).catch(() => null);
    etapa = texto === null ? null : lerSubtarefaDaEtapa(texto, codigo);
  }
  const daEtapa = etapa?.dependencias ?? [];
  const dependencias = registro.dependencias.length ? registro.dependencias : daEtapa;
  return {
    registro,
    etapa,
    arquivoEtapa,
    nivel: registro.nivel ?? etapa?.nivel ?? null,
    dependencias,
    pendentes: dependenciasPendentes(dependencias, aberto, concluidas),
  };
}

/**
 * Lista os problemas do quadro novo que o quadro antigo não tinha (INV-2).
 * @param {object|null} antes - Quadro lido do disco (ou null se o arquivo não existia).
 * @param {object} depois - Quadro que será gravado.
 * @returns {string[]} Descrição dos problemas novos.
 */
function problemasNovos(antes, depois) {
  const chave = (p) => `${p.motivo}|${p.texto}`;
  const conhecidos = new Set(antes ? validarQuadro(antes).map(chave) : []);
  return validarQuadro(depois).filter((p) => !conhecidos.has(chave(p))).map(chave);
}

/**
 * Confere o texto novo de um quadro contra o que está no disco: mesmo cabeçalho e nenhum
 * problema novo (INV-2).
 * @param {string|null} textoAtual - Conteúdo atual do arquivo (ou null).
 * @param {string} textoNovo - Conteúdo a gravar.
 * @param {object} opcoes - Opções de leitura do quadro.
 * @returns {void}
 * @throws {ErroQuadro} Se as colunas mudarem ou surgir linha inválida.
 */
function conferirQuadroAntesDeGravar(textoAtual, textoNovo, opcoes) {
  const depois = lerQuadro(textoNovo, opcoes);
  const antes = textoAtual === null ? null : lerQuadro(textoAtual, opcoes);
  if (antes && ehQuadroSimplificado(antes) !== ehQuadroSimplificado(depois)) {
    throw new ErroQuadro(CODIGOS_ERRO.QUADRO_INVALIDO, 'O formato do quadro mudou.');
  }
  if (antes && antes.tabela.nomes.join('|') !== depois.tabela.nomes.join('|')) {
    throw new ErroQuadro(CODIGOS_ERRO.QUADRO_INVALIDO, 'As colunas do quadro mudaram.');
  }
  const novos = problemasNovos(antes, depois);
  if (novos.length > 0) {
    throw new ErroQuadro(CODIGOS_ERRO.QUADRO_INVALIDO, 'A gravação criaria linha inválida.');
  }
}

/**
 * Define como ler o quadro que será gravado. O `task_complete.md` pode não ter cabeçalho; nesse
 * caso ele usa as colunas do `STATUS.md` do mesmo projeto.
 * @param {{caminho: string}} projeto - Projeto.
 * @param {string} relativo - Arquivo que será gravado.
 * @returns {Promise<object>} Opções para `lerQuadro`.
 */
async function opcoesDeLeituraDoQuadro(projeto, relativo) {
  if (!relativo.replaceAll('\\', '/').endsWith('task_complete.md')) return {};
  const textoStatus = await lerArquivoDeTasks(projeto, ARQUIVO_STATUS);
  const nomesPadrao = textoStatus === null ? COLUNAS_PADRAO : lerQuadro(textoStatus).tabela.nomes;
  return { nomesPadrao, aceitarSemCabecalho: true };
}

/**
 * Grava um arquivo de tasks/ de forma atômica: escreve num temporário na mesma pasta e só então
 * troca o original. Para `STATUS.md` e `task_complete.md`, confere o quadro antes (INV-2).
 * @param {{caminho: string}} projeto - Projeto.
 * @param {string} relativo - `tasks/STATUS.md`, `tasks/task_complete.md` ou `tasks/etapas/*.md`.
 * @param {string} texto - Conteúdo novo.
 * @returns {Promise<{caminho: string, bytes: number}>} Onde gravou e quantos bytes.
 * @throws {ErroQuadro} Se o caminho for recusado ou o quadro novo for inválido.
 */
export async function gravarArquivoDeTasks(projeto, relativo, texto) {
  const absoluto = await resolverCaminhoDeTasks(projeto, relativo);
  if (typeof texto !== 'string' || texto.includes('\0')) {
    throw new ErroQuadro(CODIGOS_ERRO.QUADRO_INVALIDO, 'Conteúdo inválido.');
  }
  const ehQuadro = [ARQUIVO_STATUS, ARQUIVO_CONCLUIDAS].includes(relativo.replaceAll('\\', '/'));
  if (ehQuadro) {
    const atual = await lerArquivoDeTasks(projeto, relativo);
    const opcoes = await opcoesDeLeituraDoQuadro(projeto, relativo);
    conferirQuadroAntesDeGravar(atual, texto, opcoes);
  }
  const nomeTemporario = `.${path.basename(absoluto)}.${process.pid}.tmp`;
  const temporario = path.join(path.dirname(absoluto), nomeTemporario);
  try {
    await fs.writeFile(temporario, texto, { encoding: 'utf8', flag: 'wx' });
    await fs.rename(temporario, absoluto);
  } catch (erro) {
    await fs.rm(temporario, { force: true });
    throw erro;
  }
  return { caminho: absoluto, bytes: Buffer.byteLength(texto, 'utf8') };
}
