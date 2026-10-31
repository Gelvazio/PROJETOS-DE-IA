/**
 * Leitor e gerador do frontmatter dos agentes (`.claude/agents/<nome>.md`), recriando o
 * `agents::parser` do original (docs/inventario/modulos.md e prompts-agentes.md, seção 5).
 *
 * O arquivo tem um bloco `---` com YAML simples (`chave: valor`) e, depois dele, o prompt de
 * sistema. Não há biblioteca YAML: o parser entende texto puro, aspas duplas (JSON) e simples,
 * números, booleanos e listas simples (`[a, b]` ou linhas `- a`). Chaves desconhecidas são
 * ignoradas. Ler e gerar são inversos: `lerAgente(gerarAgente(x))` devolve `x`.
 * Regras de validação *(inferidas)*: campos obrigatórios `name`, `description`, `tools`,
 * `model` e `color` (os do tipo `FrontmatterAgente`); nome começa com letra minúscula (mensagem
 * do original); `model`, `color` e `memory` só aceitam os valores do tipo.
 */

import type {
  Agente,
  CorAgente,
  FrontmatterAgente,
  MemoriaAgente,
  ModeloAgente,
} from '../../compartilhado/tipos-agentes';

const DELIMITADOR = '---';
const QUEBRA = '\n';
const SEPARADOR_LISTA = ', ';

const MODELOS_VALIDOS: readonly ModeloAgente[] = ['sonnet', 'haiku', 'opus', 'inherit'];
const CORES_VALIDAS: readonly CorAgente[] = [
  'purple',
  'green',
  'blue',
  'cyan',
  'orange',
  'pink',
  'yellow',
  'red',
];
const MEMORIAS_VALIDAS: readonly MemoriaAgente[] = ['project'];

const REGEX_LINHA_CHAVE = /^([A-Za-z][A-Za-z0-9_]*):(?:[ \t]+(.*))?$/;
const REGEX_ITEM_LISTA = /^[ \t]+-[ \t]+(.*)$/;
const REGEX_NUMERO = /^-?\d+(\.\d+)?$/;
const REGEX_TEXTO_SEGURO = /^[A-Za-z0-9_][A-Za-z0-9_ ,.\-/{}]*$/;
const REGEX_NOME_VALIDO = /^[a-z]/;
const PALAVRAS_RESERVADAS = ['true', 'false', 'null', '~', 'yes', 'no'];

/** Valor lido de uma linha do frontmatter. */
type ValorBruto = string | number | boolean | string[];

/** Erro de leitura do arquivo de agente, com mensagem clara em português. */
export class ErroFrontmatter extends Error {
  /**
   * @param {string} mensagem - O que está errado no arquivo.
   */
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroFrontmatter';
  }
}

/**
 * Separa o bloco `---` do corpo do arquivo.
 * @param {string} texto - Conteúdo do `.md`.
 * @returns {{ linhas: string[]; corpo: string }} Linhas do bloco e prompt de sistema.
 * @throws {ErroFrontmatter} Se o arquivo não abrir ou não fechar o bloco.
 */
function separarBloco(texto: string): { linhas: string[]; corpo: string } {
  const todas = texto.replace(/^﻿/, '').replace(/\r\n/g, QUEBRA).split(QUEBRA);
  if (todas[0]?.trimEnd() !== DELIMITADOR) {
    throw new ErroFrontmatter('Arquivo sem bloco de frontmatter (esperava "---" na 1ª linha)');
  }
  const fim = todas.findIndex((linha, i) => i > 0 && linha.trimEnd() === DELIMITADOR);
  if (fim < 0) throw new ErroFrontmatter('Bloco de frontmatter sem o "---" de fechamento');

  const corpo = todas.slice(fim + 1);
  if (corpo[0] === '') corpo.shift();
  return { linhas: todas.slice(1, fim), corpo: corpo.join(QUEBRA) };
}

/**
 * Interpreta um texto entre aspas simples (`''` vira `'`).
 * @param {string} texto - Valor com as aspas.
 * @returns {string} Conteúdo sem as aspas.
 */
function lerAspasSimples(texto: string): string {
  return texto.slice(1, -1).replace(/''/g, "'");
}

/**
 * Interpreta um valor simples: aspas, booleano, número ou texto puro.
 * @param {string} texto - Valor depois dos dois-pontos.
 * @returns {string | number | boolean} Valor tipado.
 * @throws {ErroFrontmatter} Se as aspas duplas estiverem mal formadas.
 */
function interpretarEscalar(texto: string): string | number | boolean {
  const limpo = texto.trim();
  if (limpo.startsWith('"')) {
    try {
      return JSON.parse(limpo) as string;
    } catch {
      throw new ErroFrontmatter(`Texto entre aspas inválido: ${limpo}`);
    }
  }
  if (limpo.length > 1 && limpo.startsWith("'") && limpo.endsWith("'")) {
    return lerAspasSimples(limpo);
  }
  if (limpo === 'true' || limpo === 'false') return limpo === 'true';
  return REGEX_NUMERO.test(limpo) ? Number(limpo) : limpo;
}

/**
 * Divide o miolo de `[a, "b, c", d]` nas vírgulas que estão fora de aspas.
 * @param {string} miolo - Texto entre os colchetes.
 * @returns {string[]} Itens ainda com as aspas.
 */
function dividirItens(miolo: string): string[] {
  const itens: string[] = [];
  let atual = '';
  let aspas = '';
  for (const caractere of miolo) {
    const abreOuFecha = caractere === '"' || caractere === "'";
    if (abreOuFecha && (aspas === '' || aspas === caractere)) aspas = aspas ? '' : caractere;
    if (caractere === ',' && aspas === '') {
      itens.push(atual);
      atual = '';
      continue;
    }
    atual += caractere;
  }
  if (atual.trim() !== '') itens.push(atual);
  return itens;
}

/**
 * Interpreta uma lista em linha: `[a, b]`.
 * @param {string} texto - Valor começando em `[` e terminando em `]`.
 * @returns {string[]} Itens como texto.
 */
function interpretarListaEmLinha(texto: string): string[] {
  const miolo = texto.trim().slice(1, -1);
  return dividirItens(miolo).map((item) => String(interpretarEscalar(item)));
}

/**
 * Lê as linhas do bloco e devolve chave → valor.
 * @param {string[]} linhas - Linhas entre os `---`.
 * @returns {Map<string, ValorBruto>} Valores lidos, na ordem do arquivo.
 * @throws {ErroFrontmatter} Se uma linha não for `chave: valor`, comentário, vazia ou item.
 */
function lerEntradas(linhas: string[]): Map<string, ValorBruto> {
  const entradas = new Map<string, ValorBruto>();
  let chaveAtual = '';
  for (const linha of linhas) {
    if (linha.trim() === '' || linha.trimStart().startsWith('#')) continue;
    const item = REGEX_ITEM_LISTA.exec(linha);
    if (item && chaveAtual) {
      const lista = entradas.get(chaveAtual);
      const itens = Array.isArray(lista) ? lista : [];
      entradas.set(chaveAtual, [...itens, String(interpretarEscalar(item[1]))]);
      continue;
    }
    const partes = REGEX_LINHA_CHAVE.exec(linha);
    if (!partes) throw new ErroFrontmatter(`Linha inválida no frontmatter: "${linha}"`);
    chaveAtual = partes[1];
    entradas.set(chaveAtual, interpretarValor(partes[2] ?? ''));
  }
  return entradas;
}

/**
 * Interpreta o que vem depois de `chave:` (lista em linha ou valor simples).
 * @param {string} texto - Texto do valor; vazio quando a lista vem nas linhas seguintes.
 * @returns {ValorBruto} Valor tipado (vazio vira texto vazio).
 */
function interpretarValor(texto: string): ValorBruto {
  const limpo = texto.trim();
  if (limpo.startsWith('[') && limpo.endsWith(']')) return interpretarListaEmLinha(limpo);
  return limpo === '' ? '' : interpretarEscalar(limpo);
}

/**
 * Lê um campo de texto (número e booleano viram texto; lista vira "a, b").
 * @param {Map<string, ValorBruto>} entradas - Valores lidos.
 * @param {string} chave - Nome do campo.
 * @returns {string | undefined} Texto, ou undefined se o campo não existe.
 */
function obterTexto(entradas: Map<string, ValorBruto>, chave: string): string | undefined {
  const valor = entradas.get(chave);
  if (valor === undefined) return undefined;
  return Array.isArray(valor) ? valor.join(SEPARADOR_LISTA) : String(valor);
}

/**
 * Lê um campo de texto obrigatório.
 * @param {Map<string, ValorBruto>} entradas - Valores lidos.
 * @param {string} chave - Nome do campo.
 * @returns {string} Texto não vazio.
 * @throws {ErroFrontmatter} Se o campo faltar ou estiver vazio.
 */
function exigirTexto(entradas: Map<string, ValorBruto>, chave: string): string {
  const texto = obterTexto(entradas, chave);
  if (!texto) throw new ErroFrontmatter(`Campo obrigatório ausente no frontmatter: ${chave}`);
  return texto;
}

/**
 * Confere se o valor está entre os aceitos.
 * @param {string} chave - Nome do campo (para a mensagem).
 * @param {string} valor - Valor lido.
 * @param {readonly T[]} aceitos - Valores válidos.
 * @returns {T} O próprio valor, tipado.
 * @throws {ErroFrontmatter} Se o valor não estiver na lista.
 */
function exigirUmDe<T extends string>(chave: string, valor: string, aceitos: readonly T[]): T {
  if (aceitos.includes(valor as T)) return valor as T;
  const lista = aceitos.join(SEPARADOR_LISTA);
  throw new ErroFrontmatter(`Valor inválido em ${chave}: "${valor}" (aceitos: ${lista})`);
}

/**
 * Monta os campos opcionais do frontmatter, só com os que existem no arquivo.
 * @param {Map<string, ValorBruto>} entradas - Valores lidos.
 * @returns {Partial<FrontmatterAgente>} Campos opcionais presentes.
 * @throws {ErroFrontmatter} Se `maxTurns` ou `background` tiverem tipo errado.
 */
function lerCamposOpcionais(entradas: Map<string, ValorBruto>): Partial<FrontmatterAgente> {
  const opcionais: Partial<FrontmatterAgente> = {};
  const chavesTexto = [
    'disallowedTools',
    'permissionMode',
    'effort',
    'isolation',
    'initialPrompt',
  ];
  for (const chave of chavesTexto as Array<keyof FrontmatterAgente & string>) {
    const texto = obterTexto(entradas, chave);
    if (texto !== undefined) Object.assign(opcionais, { [chave]: texto });
  }

  const memoria = obterTexto(entradas, 'memory');
  if (memoria !== undefined) opcionais.memory = exigirUmDe('memory', memoria, MEMORIAS_VALIDAS);

  const turnos = entradas.get('maxTurns');
  if (turnos !== undefined) opcionais.maxTurns = exigirNumeroInteiro(turnos);
  const fundo = entradas.get('background');
  if (fundo !== undefined) opcionais.background = exigirBooleano(fundo);
  return opcionais;
}

/**
 * Confere que `maxTurns` é um inteiro positivo.
 * @param {ValorBruto} valor - Valor lido.
 * @returns {number} O número.
 * @throws {ErroFrontmatter} Se não for inteiro maior que zero.
 */
function exigirNumeroInteiro(valor: ValorBruto): number {
  if (typeof valor === 'number' && Number.isInteger(valor) && valor > 0) return valor;
  throw new ErroFrontmatter(`maxTurns precisa ser um número inteiro maior que zero: ${valor}`);
}

/**
 * Confere que `background` é `true` ou `false`.
 * @param {ValorBruto} valor - Valor lido.
 * @returns {boolean} O booleano.
 * @throws {ErroFrontmatter} Se não for booleano.
 */
function exigirBooleano(valor: ValorBruto): boolean {
  if (typeof valor === 'boolean') return valor;
  throw new ErroFrontmatter(`background precisa ser true ou false: ${valor}`);
}

/**
 * Monta o `FrontmatterAgente` validando os campos obrigatórios.
 * @param {Map<string, ValorBruto>} entradas - Valores lidos.
 * @returns {FrontmatterAgente} Frontmatter completo.
 * @throws {ErroFrontmatter} Se faltar campo obrigatório ou houver valor inválido.
 */
function montarFrontmatter(entradas: Map<string, ValorBruto>): FrontmatterAgente {
  const name = exigirTexto(entradas, 'name');
  if (!REGEX_NOME_VALIDO.test(name)) {
    throw new ErroFrontmatter('Nome deve começar com letra minúscula');
  }
  return {
    name,
    description: exigirTexto(entradas, 'description'),
    tools: exigirTexto(entradas, 'tools'),
    model: exigirUmDe('model', exigirTexto(entradas, 'model'), MODELOS_VALIDOS),
    color: exigirUmDe('color', exigirTexto(entradas, 'color'), CORES_VALIDAS),
    ...lerCamposOpcionais(entradas),
  };
}

/**
 * Lê o conteúdo de um arquivo de agente.
 * @param {string} texto - Conteúdo do `.md` (bloco `---` seguido do prompt de sistema).
 * @returns {Agente} Frontmatter e prompt de sistema.
 * @throws {ErroFrontmatter} Se não houver bloco, ele estiver quebrado ou faltar campo obrigatório.
 */
export function lerAgente(texto: string): Agente {
  const { linhas, corpo } = separarBloco(texto);
  return { frontmatter: montarFrontmatter(lerEntradas(linhas)), systemPrompt: corpo };
}

/**
 * Escreve um texto como valor: puro quando é seguro, senão entre aspas duplas (JSON).
 * @param {string} texto - Valor do campo.
 * @returns {string} Valor pronto para a linha `chave: valor`.
 */
function formatarTexto(texto: string): string {
  const pareceOutroTipo = REGEX_NUMERO.test(texto) || PALAVRAS_RESERVADAS.includes(texto);
  const ehSeguro = REGEX_TEXTO_SEGURO.test(texto) && texto === texto.trim() && !pareceOutroTipo;
  return ehSeguro ? texto : JSON.stringify(texto);
}

/**
 * Escreve um campo de texto opcional; ausente continua ausente.
 * @param {string | undefined} texto - Valor do campo.
 * @returns {string | undefined} Valor formatado, ou undefined.
 */
function formatarOpcional(texto: string | undefined): string | undefined {
  return texto === undefined ? undefined : formatarTexto(texto);
}

/**
 * Gera as linhas `chave: valor` na ordem do original, só com os campos preenchidos.
 * @param {FrontmatterAgente} frontmatter - Frontmatter do agente.
 * @returns {string[]} Linhas do bloco.
 */
function gerarLinhas(frontmatter: FrontmatterAgente): string[] {
  const f = frontmatter;
  const campos: Array<[string, string | number | boolean | undefined]> = [
    ['name', formatarTexto(f.name)],
    ['description', formatarTexto(f.description)],
    ['tools', formatarTexto(f.tools)],
    ['disallowedTools', formatarOpcional(f.disallowedTools)],
    ['model', f.model],
    ['color', f.color],
    ['permissionMode', formatarOpcional(f.permissionMode)],
    ['memory', f.memory],
    ['maxTurns', f.maxTurns],
    ['background', f.background],
    ['effort', formatarOpcional(f.effort)],
    ['isolation', formatarOpcional(f.isolation)],
    ['initialPrompt', formatarOpcional(f.initialPrompt)],
  ];
  return campos
    .filter((campo): campo is [string, string | number | boolean] => campo[1] !== undefined)
    .map(([chave, valor]) => `${chave}: ${valor}`);
}

/**
 * Gera o conteúdo do arquivo de agente: bloco `---`, uma linha em branco e o prompt de sistema.
 * @param {Agente} agente - Agente a gravar.
 * @returns {string} Texto do `.md`; `lerAgente` devolve o mesmo agente.
 */
export function gerarAgente(agente: Agente): string {
  const bloco = [DELIMITADOR, ...gerarLinhas(agente.frontmatter), DELIMITADOR];
  return `${bloco.join(QUEBRA)}${QUEBRA}${QUEBRA}${agente.systemPrompt}`;
}
