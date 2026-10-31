// Leitor das etapas (tasks/etapas/*.md) para a carga da colecao `etapas` (SCHEMA.md 2.2,
// MIGRAR-TAREFAS-API.10): divide o arquivo em cabecalho, secoes gerais e secoes de subtarefa.
// So funcoes puras: quem le o disco e grava o banco e o api/migrar-etapas.mjs.

const PADRAO_TITULO_ETAPA = /^## Etapa\b/;
const MARCA_BOM = /^﻿/;
const PADRAO_TITULO_SECAO = /^(#{2,3}) +(.*)$/;
const PADRAO_CERCA = /^\s*(```|~~~)/;
const PADRAO_INICIO_SUB = /^(?:[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*|#\d+)\.\d+\b/;
const PADRAO_TOKEN_SUB = /([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*|#\d+)?\.(\d+)/g;
const PADRAO_SEPARADOR_TITULO = /\s+[—–]\s+|:\s+/;
const PADRAO_ROTULO = /^(- )?\*\*([^*]+?):\*\*\s?(.*)$/;
const PADRAO_ROTULO_EMBUTIDO = /\s+·\s+\*\*([^*]+?):\*\*\s?/g;
const PADRAO_NUMERO = /Etapa\s+(\d+)/;
const PADRAO_HASH = /Etapa\s+\d+-([0-9a-f]{8})\b/;
const PADRAO_ARQUIVO = /^(ETAPA-(\d+))(?:-([0-9a-f]{8}))?-(.+)\.md$/;
const PADRAO_CODIGO_MAE = /[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+|[A-Z]{3,}/;
const PADRAO_PREFIXO_CODIGO = /^[A-Z][A-Z0-9-]*(?:\s+e\s+[A-Z][A-Z0-9-]*)*:\s+/;
const PADRAO_NIVEL = /\b(LEVE|MEDIO|PESADO)\b/;
const PADRAO_MOTIVO = /\s+[—–-]\s+(.*)$/s;
const PADRAO_EFFORT = /\b(low|medium|high|xhigh)\b/i;
const PADRAO_JEV = /\b(SIM|NAO)\b/;
const ROTULO_TEXTO_LIVRE = 'Texto livre';
const ROTULO_TITULO_SECAO = 'Título da seção';
const SEPARADOR_REPETIDO = '\n';

const TIPOS_SECAO = [
  ['escopo', 'escopo'], ['riscos', 'riscos'], ['decisoes', 'decisoes'],
  ['requisitos', 'requisitos'], ['invariantes', 'invariantes'], ['perguntas', 'perguntas'],
  ['entregas', 'entregas'], ['criterio de pronto', 'criterio_pronto'],
  ['criterios de pronto', 'criterio_pronto'], ['validacao', 'validacao'],
  ['casos de borda', 'casos_borda'],
];

const CAMPOS_ROTULO = [
  ['nivel', 'nivel'], ['modelo', 'modeloSecao'], ['effort', 'effort'],
  ['jev-ai-suggestion', 'jevAiSuggestion'], ['fonte', 'fonteNivel'], ['descricao', 'descricao'],
  ['criterios de aceitacao', 'criteriosAceitacao'], ['criterio de pronto', 'criterioPronto'],
  ['criterios de pronto', 'criterioPronto'], ['arquivos', 'arquivos'],
  ['estimativa', 'estimativa'], ['entrega', 'entrega'], ['entregue', 'entrega'],
  ['anotacao', 'anotacao'], ['proximo passo', 'proximoPasso'], ['depende de', 'dependeDe'],
];
const PREFIXO_VERIFICACAO = 'verificacao';
const PADRAO_SUFIXO_ROTULO = /\s*\(.*$|\s+[—–-]\s+.*$/;

/**
 * Normaliza um texto para comparar rotulos e titulos (minusculas, sem acento).
 * @param {string} texto - Texto original.
 * @returns {string} Texto normalizado.
 */
export function normalizar(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Junta linhas tirando as linhas em branco das pontas.
 * @param {string[]} linhas - Linhas do bloco.
 * @returns {string} Texto do bloco.
 */
export function juntarLinhas(linhas) {
  let inicio = 0;
  let fim = linhas.length;
  while (inicio < fim && linhas[inicio].trim() === '') inicio += 1;
  while (fim > inicio && linhas[fim - 1].trim() === '') fim -= 1;
  return linhas.slice(inicio, fim).join('\n');
}

/**
 * Marca, para cada linha, se ela esta dentro de um bloco de codigo cercado.
 * @param {string[]} linhas - Linhas do arquivo.
 * @returns {boolean[]} true onde a linha e cerca ou esta dentro de uma.
 */
export function marcarCercas(linhas) {
  let marcaAberta = null;
  return linhas.map((linha) => {
    const achado = linha.match(PADRAO_CERCA);
    if (!achado) return marcaAberta !== null;
    if (marcaAberta === null) marcaAberta = achado[1];
    else if (achado[1] === marcaAberta) marcaAberta = null;
    return true;
  });
}

/**
 * Divide o arquivo em titulo, cabecalho e secoes de nivel 2 ou 3 (fora de cercas).
 * @param {string} texto - Conteudo da etapa (LF).
 * @returns {{tituloLinha: string, cabecalho: string[], preambulo: string[], secoes: object[]}}
 *   Blocos na ordem do arquivo; cada secao tem `nivelTitulo`, `titulo` e `linhas`.
 */
export function dividirBlocos(texto) {
  const linhas = texto.replace(MARCA_BOM, '').split('\n');
  const emCerca = marcarCercas(linhas);
  const blocos = { tituloLinha: '', cabecalho: [], preambulo: [], secoes: [] };
  let atual = blocos.preambulo;
  linhas.forEach((linha, i) => {
    const ehTituloEtapa = !emCerca[i] && !blocos.tituloLinha && PADRAO_TITULO_ETAPA.test(linha);
    if (ehTituloEtapa) {
      blocos.tituloLinha = linha;
      atual = blocos.cabecalho;
      return;
    }
    const achado = emCerca[i] ? null : linha.match(PADRAO_TITULO_SECAO);
    if (!achado) {
      atual.push(linha);
      return;
    }
    const secao = { nivelTitulo: achado[1].length, titulo: achado[2].trim(), linhas: [] };
    blocos.secoes.push(secao);
    atual = secao.linhas;
  });
  return blocos;
}

/**
 * Tipo da secao geral pelo titulo (enum aberto do SCHEMA; o resto vira `corpo`).
 * @param {string} titulo - Titulo da secao.
 * @returns {string} Tipo.
 */
export function tipoDaSecao(titulo) {
  const normalizado = normalizar(titulo);
  const achado = TIPOS_SECAO.find(([prefixo]) => normalizado.startsWith(prefixo));
  return achado ? achado[1] : 'corpo';
}

/**
 * Le os codigos de subtarefa de um titulo de secao (aceita "X.1 a X.3" e "X.3, .4 e .5").
 * @param {string} titulo - Titulo da secao.
 * @returns {{codigos: string[], tituloSecao: string}|null} Codigos e titulo, ou null.
 */
export function lerTituloSubtarefa(titulo) {
  if (!PADRAO_INICIO_SUB.test(titulo)) return null;

  const separador = titulo.match(PADRAO_SEPARADOR_TITULO);
  const prefixo = separador ? titulo.slice(0, separador.index) : titulo;
  const tituloSecao = separador ? titulo.slice(separador.index + separador[0].length) : '';
  const tokens = [...prefixo.matchAll(PADRAO_TOKEN_SUB)];
  const base = tokens[0][1];
  const numeros = tokens.map((token) => Number(token[2]));
  const ehFaixa = numeros.length === 2 && /\s+a\s+/.test(prefixo);
  if (!ehFaixa) return { codigos: numeros.map((n) => `${base}.${n}`), tituloSecao };

  const codigos = [];
  for (let n = numeros[0]; n <= numeros[1]; n += 1) codigos.push(`${base}.${n}`);
  return { codigos, tituloSecao };
}

/**
 * Divide o texto de um rotulo em pares quando ha outros rotulos embutidos (" · **X:** ").
 * @param {string} rotulo - Rotulo inicial.
 * @param {string} texto - Texto depois do rotulo.
 * @param {(rotulo: string) => boolean} ehConhecido - Diz se o rotulo embutido deve separar.
 * @returns {{rotulo: string, texto: string}[]} Pares rotulo/texto.
 */
export function dividirRotulosEmbutidos(rotulo, texto, ehConhecido) {
  const pares = [];
  let rotuloAtual = rotulo;
  let inicio = 0;
  for (const achado of texto.matchAll(PADRAO_ROTULO_EMBUTIDO)) {
    if (!ehConhecido(achado[1])) continue;
    pares.push({ rotulo: rotuloAtual, texto: texto.slice(inicio, achado.index).trim() });
    rotuloAtual = achado[1];
    inicio = achado.index + achado[0].length;
  }
  pares.push({ rotulo: rotuloAtual, texto: texto.slice(inicio).trim() });
  return pares;
}

/**
 * Agrupa as linhas de um bloco em entradas rotuladas (`- **X:** ...`, `**X:** ...`) e texto
 * livre. Continuacao = linha recuada ou dentro de cerca aberta na entrada.
 * @param {string[]} linhas - Linhas do bloco (sem o titulo).
 * @returns {{entradas: {rotulo: string, linhas: string[]}[], livres: string[]}} Agrupamento.
 */
export function agruparRotulos(linhas) {
  const emCerca = marcarCercas(linhas);
  const entradas = [];
  const livres = [];
  let atual = null;
  linhas.forEach((linha, i) => {
    const achado = emCerca[i] ? null : linha.match(PADRAO_ROTULO);
    if (achado) {
      atual = { rotulo: achado[2].trim(), linhas: [achado[3]] };
      entradas.push(atual);
      return;
    }
    const ehRecuada = /^\s+\S/.test(linha);
    const continua = atual && (ehRecuada || (emCerca[i] && atual.temCerca));
    if (continua) {
      if (PADRAO_CERCA.test(linha)) atual.temCerca = !atual.temCerca;
      atual.linhas.push(linha.trim());
      return;
    }
    atual = null;
    livres.push(linha);
  });
  return { entradas, livres };
}

/**
 * Campo do SCHEMA (tarefas) para um rotulo de subtarefa, ou null (vai para `extras`).
 * @param {string} rotulo - Rotulo cru.
 * @returns {string|null} Nome do campo.
 */
export function campoDoRotulo(rotulo) {
  const normalizado = normalizar(rotulo);
  if (normalizado.startsWith(PREFIXO_VERIFICACAO)) return 'verificacao';
  const base = normalizado.replace(PADRAO_SUFIXO_ROTULO, '').trim();
  const achado = CAMPOS_ROTULO.find(([nome]) => nome === base);
  return achado ? achado[1] : null;
}

/**
 * Diz se o rotulo tem sufixo (ex.: "Entrega (2026-10-17, Haiku)") alem do nome do campo.
 * @param {string} rotulo - Rotulo cru.
 * @returns {boolean} true se houver sufixo.
 */
function temSufixoRotulo(rotulo) {
  const normalizado = normalizar(rotulo);
  return normalizado.replace(PADRAO_SUFIXO_ROTULO, '').trim() !== normalizado;
}

/**
 * Acrescenta um texto a um valor de texto (rotulo repetido vira texto unido por quebra).
 * @param {string|null|undefined} anterior - Valor ja gravado.
 * @param {string} texto - Texto novo.
 * @returns {string} Valor unido.
 */
export function acrescentar(anterior, texto) {
  if (!anterior) return texto;
  if (!texto) return anterior;
  return `${anterior}${SEPARADOR_REPETIDO}${texto}`;
}

/**
 * Aplica um par rotulo/texto aos campos lidos de uma subtarefa.
 * @param {object} campos - Campos acumulados (mutado).
 * @param {{rotulo: string, texto: string}} par - Rotulo e texto.
 * @returns {void}
 */
function aplicarPar(campos, par) {
  const campo = campoDoRotulo(par.rotulo);
  if (!campo) {
    campos.extras[par.rotulo] = acrescentar(campos.extras[par.rotulo], par.texto);
    return;
  }
  if (campo === 'verificacao') {
    campos.verificacao = acrescentar(campos.verificacao, par.texto);
    const temSufixo = normalizar(par.rotulo) !== PREFIXO_VERIFICACAO;
    if (temSufixo) campos.verificacaoRotulo = par.rotulo;
    return;
  }
  // O sufixo do rotulo (data, autor) nao tem campo proprio: vai na frente do texto (INV-7).
  const texto = temSufixoRotulo(par.rotulo) ? `${par.rotulo}: ${par.texto}` : par.texto;
  campos[campo] = acrescentar(campos[campo], texto);
}

/**
 * Le os campos de uma secao de subtarefa (rotulos, extras e texto livre).
 * @param {string[]} linhas - Linhas da secao (sem o titulo).
 * @returns {object} Campos crus por nome do SCHEMA, com `extras`.
 */
export function lerCamposSubtarefa(linhas) {
  const { entradas, livres } = agruparRotulos(linhas);
  const campos = { extras: {}, verificacaoRotulo: null };
  const ehConhecido = (rotulo) => campoDoRotulo(rotulo) !== null;
  for (const entrada of entradas) {
    const texto = entrada.linhas.join('\n').trim();
    for (const par of dividirRotulosEmbutidos(entrada.rotulo, texto, ehConhecido)) {
      aplicarPar(campos, par);
    }
  }
  const textoLivre = juntarLinhas(livres);
  if (textoLivre) campos.extras[ROTULO_TEXTO_LIVRE] = textoLivre;
  return campos;
}

/**
 * Guarda o texto cru em `extras` quando o campo tipado nao o reproduz (perda zero, INV-7).
 * @param {object} extras - Extras da subtarefa (mutado).
 * @param {string} rotulo - Rotulo do texto.
 * @param {string} texto - Texto cru.
 * @param {boolean} cabeNoCampo - true se o campo tipado reproduz o texto.
 * @returns {void}
 */
function guardarSeNaoCabe(extras, rotulo, texto, cabeNoCampo) {
  if (!texto || cabeNoCampo) return;
  extras[rotulo] = acrescentar(extras[rotulo], texto);
}

/**
 * Converte os campos crus em campos tipados do SCHEMA (nivel, effort, arquivos...).
 * @param {object} crus - Resultado de `lerCamposSubtarefa`.
 * @returns {object} Campos prontos para a tarefa.
 */
export function tiparCampos(crus) {
  const textoNivel = crus.nivel || '';
  const nivel = textoNivel.match(PADRAO_NIVEL);
  const motivo = textoNivel.match(PADRAO_MOTIVO);
  const effort = (crus.effort || '').match(PADRAO_EFFORT);
  const jev = (crus.jevAiSuggestion || '').match(PADRAO_JEV);
  const arquivos = crus.arquivos ? crus.arquivos.split(/,\s*/).map((item) => item.trim()) : [];
  const extras = { ...crus.extras };
  const antesDoMotivo = textoNivel.trim().replace(PADRAO_MOTIVO, '').trim();
  guardarSeNaoCabe(extras, 'Nível', textoNivel, nivel !== null && antesDoMotivo === nivel[1]);
  const textoEffort = (crus.effort || '').trim();
  guardarSeNaoCabe(extras, 'Effort', textoEffort, effort !== null
    && textoEffort.toLowerCase() === effort[1].toLowerCase());
  const textoJev = (crus.jevAiSuggestion || '').trim();
  guardarSeNaoCabe(extras, 'JEV-AI-SUGGESTION', textoJev, jev !== null && textoJev === jev[1]);
  const textoArquivos = (crus.arquivos || '').trim();
  guardarSeNaoCabe(extras, 'Arquivos', textoArquivos, arquivos.join(', ') === textoArquivos);
  return {
    nivelLido: nivel ? nivel[1] : null,
    nivelMotivo: nivel && motivo ? motivo[1].trim() : null,
    effortLido: effort ? effort[1].toLowerCase() : null,
    modeloSecao: crus.modeloSecao || null,
    jevAiSuggestion: jev ? jev[1] : null,
    fonteNivel: crus.fonteNivel || null,
    dependeDeSecao: crus.dependeDe || null,
    proximoPasso: crus.proximoPasso || '',
    descricao: crus.descricao || '',
    criteriosAceitacao: crus.criteriosAceitacao || '',
    criterioPronto: crus.criterioPronto || '',
    arquivos: arquivos.filter((item) => item),
    estimativa: crus.estimativa || '',
    entrega: crus.entrega || '',
    verificacao: crus.verificacao || '',
    verificacaoRotulo: crus.verificacaoRotulo,
    anotacao: crus.anotacao || '',
    extras,
  };
}

/**
 * Le o cabecalho da etapa (rotulos `**X:**` entre o titulo e a primeira secao).
 * @param {string[]} linhas - Linhas do cabecalho.
 * @returns {object} Mapa rotulo normalizado -> texto.
 */
export function lerRotulosCabecalho(linhas) {
  const { entradas } = agruparRotulos(linhas);
  const rotulos = {};
  for (const entrada of entradas) {
    const texto = entrada.linhas.join('\n').trim();
    for (const par of dividirRotulosEmbutidos(entrada.rotulo, texto, () => true)) {
      const chave = normalizar(par.rotulo).replace(/\s*\(.*\)$/, '');
      rotulos[chave] = acrescentar(rotulos[chave], par.texto);
    }
  }
  return rotulos;
}

/**
 * Le numero, hash e nome do arquivo da etapa.
 * @param {string} arquivo - Nome do arquivo (ETAPA-NNN[-hash8]-NOME.md).
 * @returns {{codigo: string, numero: number, hash: string|null, nome: string}|null} Partes.
 */
export function lerNomeArquivo(arquivo) {
  const achado = arquivo.match(PADRAO_ARQUIVO);
  if (!achado) return null;
  return { codigo: achado[1], numero: Number(achado[2]), hash: achado[3] || null, nome: achado[4] };
}

/**
 * Le o titulo da etapa a partir da linha `## Etapa ...`.
 * @param {string} tituloLinha - Linha inteira do titulo.
 * @returns {string} Titulo sem numero e sem o codigo da tarefa.
 */
export function lerTituloEtapa(tituloLinha) {
  const separador = tituloLinha.match(/\s+[—–]\s+/);
  if (!separador) return tituloLinha.replace(/^## /, '').trim();
  const resto = tituloLinha.slice(separador.index + separador[0].length).trim();
  return resto.replace(PADRAO_PREFIXO_CODIGO, '').trim();
}

/**
 * Codigo da tarefa-mae da etapa: rotulo `Tarefa`/`Tarefas`, senao o nome do arquivo.
 * @param {object} rotulos - Rotulos do cabecalho.
 * @param {string} nomeArquivo - Parte do nome depois do numero/hash.
 * @returns {string|null} Codigo da mae.
 */
export function lerCodigoMae(rotulos, nomeArquivo) {
  const texto = (rotulos.tarefa || rotulos.tarefas || '').replace(/[`*]/g, '');
  const achado = texto.match(PADRAO_CODIGO_MAE);
  if (achado) return achado[0];
  return nomeArquivo || null;
}

/**
 * Le os numeros de etapa e hash da linha de titulo (o nome do arquivo e o reserva).
 * @param {string} tituloLinha - Linha `## Etapa ...`.
 * @returns {{numero: number|null, hash: string|null}} Numero e hash do titulo.
 */
export function lerNumeroHashTitulo(tituloLinha) {
  const numero = tituloLinha.match(PADRAO_NUMERO);
  const hash = tituloLinha.match(PADRAO_HASH);
  return { numero: numero ? Number(numero[1]) : null, hash: hash ? hash[1] : null };
}

export { ROTULO_TITULO_SECAO };
