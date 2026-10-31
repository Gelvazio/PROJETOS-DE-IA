// Gate da C34 (regras/espec.md): confere se a etapa de uma tarefa PESADO esta executavel.
// Uso: node spec/verificar-spec.mjs tasks/etapas/ETAPA-016-3d8e2a71-ESPEC-GLOBAL.md
//      node spec/verificar-spec.mjs --todas
// Nao roda nem cria teste. Sai com codigo 1 quando algo falta.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PASTA_ETAPAS = join(RAIZ, 'tasks', 'etapas');
const EARS = /(QUANDO|SE\s|ENQUANTO|ONDE|O SISTEMA DEVE)/i;

/**
 * Devolve o texto da secao `### <titulo>` ou null.
 * @param {string} texto - Conteudo da etapa.
 * @param {string} titulo - Titulo da secao (ex.: "Requisitos").
 * @returns {string|null} Corpo da secao.
 */
function lerSecao(texto, titulo) {
  const linhas = texto.split(/\r?\n/);
  const alvo = new RegExp(`^###\\s+${titulo}\\s*$`, 'i');
  const inicio = linhas.findIndex((l) => alvo.test(l.trim()));
  if (inicio === -1) return null;
  const fim = linhas.findIndex((l, i) => i > inicio && /^#{2,3}\s/.test(l));
  return linhas.slice(inicio + 1, fim === -1 ? linhas.length : fim).join('\n');
}

/**
 * Linhas de tabela com conteudo (ignora cabecalho e separador).
 * @param {string} secao - Corpo da secao.
 * @returns {string[]} Linhas de dados.
 */
function linhasTabela(secao) {
  return secao
    .split(/\r?\n/)
    .filter((l) => l.trim().startsWith('|'))
    .filter((l) => !/^\|[\s:|-]+\|?$/.test(l.trim()))
    .filter((l) => !/^\|\s*(ID|#)\s*\|/i.test(l.trim()));
}

/**
 * Confere uma etapa e devolve o resultado de cada criterio.
 * @param {string} arquivo - Caminho da etapa.
 * @returns {{arquivo: string, itens: Array<{criterio: string, ok: boolean, detalhe: string}>}}
 */
function conferir(arquivo) {
  const texto = readFileSync(arquivo, 'utf8');
  const itens = [];
  const push = (criterio, ok, detalhe) => itens.push({ criterio, ok, detalhe });

  const req = lerSecao(texto, 'Requisitos');
  if (req === null) push('Requisitos', false, 'secao ausente');
  else {
    const linhas = linhasTabela(req);
    const comEars = linhas.filter((l) => EARS.test(l));
    push('Requisitos', comEars.length > 0, `${comEars.length} requisito(s) com EARS`);
  }

  const inv = lerSecao(texto, 'Invariantes');
  if (inv === null) push('Invariantes', false, 'secao ausente');
  else if (/\bN\/A\b/.test(inv)) push('Invariantes', true, 'N/A justificado');
  else {
    const linhas = linhasTabela(inv).filter((l) => /\bINV-\d+/.test(l));
    push('Invariantes', linhas.length > 0, `${linhas.length} invariante(s)`);
  }

  const per = lerSecao(texto, 'Perguntas abertas');
  if (per === null) push('Perguntas abertas', false, 'secao ausente');
  else {
    const abertas = linhasTabela(per).filter((l) => l.includes('\u2b1c'));
    push('Perguntas abertas', abertas.length === 0, abertas.length === 0 ? 'nenhuma aberta' : `${abertas.length} aberta(s)`);
  }

  const subtarefas = texto.split(/\r?\n/).filter((l) => /^###\s+\S+\.\d+\s/.test(l));
  let faltando = 0;
  for (const linha of subtarefas) {
    const inicio = texto.indexOf(linha);
    const resto = texto.slice(inicio + linha.length);
    const proxima = resto.search(/\r?\n###\s/);
    const corpo = proxima === -1 ? resto : resto.slice(0, proxima);
    for (const campo of ['N[ií]vel', 'Modelo', 'Effort']) {
      if (!new RegExp(`-\\s*\\*\\*${campo}:\\*\\*`, 'i').test(corpo)) faltando += 1;
    }
  }
  push(
    'Subtarefas (Nível/Modelo/Effort)',
    faltando === 0,
    faltando === 0 ? `${subtarefas.length} subtarefa(s) completas` : `${faltando} campo(s) faltando`,
  );

  return { arquivo, itens };
}

/** Imprime o resultado em quadro (C27). */
function imprimir(resultado) {
  const nome = resultado.arquivo.split(/[\\/]/).pop();
  console.log(`\n${nome}`);
  console.log('| Conferência | Resultado | Detalhe |');
  console.log('|---|---|---|');
  for (const item of resultado.itens) {
    console.log(`| ${item.criterio} | ${item.ok ? '✅' : '❌'} | ${item.detalhe} |`);
  }
  return resultado.itens.every((i) => i.ok);
}

const args = process.argv.slice(2);
const todas = args.includes('--todas');
const alvos = todas
  ? readdirSync(PASTA_ETAPAS).filter((n) => n.endsWith('.md')).map((n) => join(PASTA_ETAPAS, n))
  : args.filter((a) => !a.startsWith('--')).map((a) => resolve(process.cwd(), a));

if (alvos.length === 0) {
  console.error('uso: node spec/verificar-spec.mjs <etapa.md> | --todas');
  process.exit(2);
}

let falhas = 0;
let aderiram = 0;
let ignoradas = 0;
for (const alvo of alvos) {
  if (!existsSync(alvo)) {
    console.error(`nao encontrado: ${alvo}`);
    falhas += 1;
    continue;
  }
  const texto = readFileSync(alvo, 'utf8');
  const temSpec = /^###\s+Requisitos\s*$/im.test(texto);
  if (todas && !temSpec) {
    ignoradas += 1;
    continue;
  }
  aderiram += 1;
  if (!imprimir(conferir(alvo))) falhas += 1;
}

if (todas) console.log(`\n${aderiram} etapa(s) com spec · ${ignoradas} anterior(es) a C34 · ${falhas} com falha`);
else if (falhas > 0) console.log(`\n${falhas} etapa(s) com falha`);

process.exit(falhas > 0 ? 1 : 0);
