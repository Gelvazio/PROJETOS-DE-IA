// Teste de invariante INV-2 (exceção C34, só PESADO): nenhum segredo/PII bruto sai para a API
// ou para o log. Gera textos aleatórios (semente fixa, reproduzível) com chaves, CPF, RG, e-mail
// e telefone sintéticos misturados a texto comum, e confere para TODO texto gerado:
//   1. `redigirTexto` não deixa nenhum valor bruto e é idempotente;
//   2. o que os guardrails (segredo, aprovação, comando) mandam ao Jev falso não tem valor bruto;
//   3. o log JSONL não contém nenhum valor bruto.
// Uso: node scripts/jev/testes/segredo.mjs [quantidade]   (padrão: 300 textos)
import assert from 'node:assert/strict';
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { criarRegistroJsonl } from '../cliente.mjs';
import { PASTA_SAIDAS } from '../config.mjs';
import { avaliarAprovacao } from '../guardrails/aprovacao.mjs';
import { avaliarComando } from '../guardrails/comando-destrutivo.mjs';
import { redigirTexto } from '../guardrails/redigir.mjs';
import { avaliarSegredo } from '../guardrails/segredo.mjs';

const ARQUIVO_LOG_TESTE = join(PASTA_SAIDAS, 'teste-segredo-inv2.jsonl');
const QUANTIDADE_PADRAO = 300;
const SEMENTE = 20261018;
const ALFANUMERICOS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const MAIUSCULAS_E_DIGITOS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const DIGITOS = '0123456789';
const PALAVRAS = [
  'subtarefa', 'etapa', 'quadro', 'commit', 'arquivo', 'aluno', 'turma', 'relatório', 'git',
  'node', 'configuração', 'diff', '+', '-', 'linha', 'resultado', 'ok', 'ver', 'campo:', '=',
];
const DOMINIOS = ['gmail.com', 'hotmail.com', 'senai.br', 'empresa.com.br'];
const MAXIMO_SEGREDOS_POR_TEXTO = 3;
const MAXIMO_PALAVRAS = 12;

/**
 * Gerador pseudoaleatório com semente (mulberry32), para o teste ser reproduzível.
 * @param {number} semente Semente inteira.
 * @returns {() => number} Função que devolve número em [0, 1).
 */
function criarAleatorio(semente) {
  let estado = semente >>> 0;
  return () => {
    estado = (estado + 0x6D2B79F5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Cria as funções de sorteio a partir do gerador.
 * @param {() => number} aleatorio Gerador.
 * @returns {{inteiro: Function, texto: Function, escolher: Function}} Sorteadores.
 */
function criarSorteio(aleatorio) {
  const inteiro = (minimo, maximo) => minimo + Math.floor(aleatorio() * (maximo - minimo + 1));
  const escolher = (lista) => lista[inteiro(0, lista.length - 1)];
  const texto = (alfabeto, tamanho) => Array.from({ length: tamanho }, () => escolher(alfabeto))
    .join('');
  return { inteiro, escolher, texto };
}

/**
 * Gera um CPF válido (dígitos verificadores corretos), formatado ou não.
 * @param {object} sorteio Sorteadores.
 * @returns {string} CPF.
 */
function gerarCpf(sorteio) {
  const digitos = Array.from({ length: 9 }, () => sorteio.inteiro(0, 9));
  for (const pesoInicial of [10, 11]) {
    const soma = digitos.reduce((total, digito, i) => total + digito * (pesoInicial - i), 0);
    const resto = (soma * 10) % 11;
    digitos.push(resto === 10 ? 0 : resto);
  }
  const numeros = digitos.join('');
  if (sorteio.inteiro(0, 1) === 0) return numeros;
  return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9)}`;
}

/**
 * Geradores de segredo: cada um devolve o texto a inserir e o valor que não pode vazar.
 * @type {Record<string, (sorteio: object) => {trecho: string, valor: string}>}
 */
const GERADORES = {
  sk: (s) => {
    const valor = `sk-${s.texto(ALFANUMERICOS, s.inteiro(20, 40))}`;
    return { trecho: valor, valor };
  },
  tsk: (s) => {
    const valor = `tsk_${s.texto(ALFANUMERICOS, s.inteiro(16, 32))}`;
    return { trecho: `TYPESAFE_API_KEY=${valor}`, valor };
  },
  bearer: (s) => {
    const valor = s.texto(ALFANUMERICOS, s.inteiro(20, 40));
    return { trecho: `Authorization: Bearer ${valor}`, valor };
  },
  github: (s) => {
    const valor = `ghp_${s.texto(ALFANUMERICOS, 36)}`;
    return { trecho: valor, valor };
  },
  jwt: (s) => {
    const valor = `eyJ${s.texto(ALFANUMERICOS, 20)}.eyJ${s.texto(ALFANUMERICOS, 30)}.`
      + s.texto(ALFANUMERICOS, 30);
    return { trecho: valor, valor };
  },
  aws: (s) => {
    const valor = `AKIA${s.texto(MAIUSCULAS_E_DIGITOS, 16)}`;
    return { trecho: valor, valor };
  },
  senha: (s) => {
    const valor = `${s.texto(ALFANUMERICOS, s.inteiro(6, 12))}${s.texto(DIGITOS, 2)}!`;
    return { trecho: `senha=${valor}`, valor };
  },
  cpf: (s) => {
    const valor = gerarCpf(s);
    return { trecho: `CPF ${valor}`, valor };
  },
  rg: (s) => {
    const valor = `${s.texto(DIGITOS, 2)}.${s.texto(DIGITOS, 3)}.${s.texto(DIGITOS, 3)}-`
      + s.texto(DIGITOS, 1);
    return { trecho: `RG ${valor}`, valor };
  },
  email: (s) => {
    const valor = `${s.texto(ALFANUMERICOS, s.inteiro(4, 10)).toLowerCase()}.`
      + `${s.texto(ALFANUMERICOS, 5).toLowerCase()}@${s.escolher(DOMINIOS)}`;
    return { trecho: valor, valor };
  },
  telefone: (s) => {
    const valor = `(${s.texto(DIGITOS, 2)}) 9${s.texto(DIGITOS, 4)}-${s.texto(DIGITOS, 4)}`;
    return { trecho: valor, valor };
  },
};

/**
 * Gera um texto com 1 a 3 segredos misturados a palavras comuns.
 * @param {object} sorteio Sorteadores.
 * @returns {{texto: string, valores: string[]}} Texto e valores que não podem vazar.
 */
function gerarCaso(sorteio) {
  const partes = [];
  const valores = [];
  const quantidade = sorteio.inteiro(1, MAXIMO_SEGREDOS_POR_TEXTO);
  for (let i = 0; i < quantidade; i += 1) {
    const palavras = Array.from({ length: sorteio.inteiro(0, MAXIMO_PALAVRAS) },
      () => sorteio.escolher(PALAVRAS));
    const segredo = GERADORES[sorteio.escolher(Object.keys(GERADORES))](sorteio);
    partes.push(...palavras, segredo.trecho);
    valores.push(segredo.valor);
  }
  return { texto: partes.join(sorteio.escolher([' ', '\n', ' | '])), valores };
}

/**
 * Jev falso que só guarda o que recebeu (probabilidade baixa: força o envio quando possível).
 * @param {string[]} recebidos Lista onde guardar (alterada).
 * @returns {{nome: string, perguntar: Function}} Consultor.
 */
function criarJevQueGuarda(recebidos) {
  return {
    nome: 'jev-falso',
    perguntar: async (pedido) => {
      recebidos.push(JSON.stringify(pedido));
      const respostas = Object.fromEntries(
        Object.keys(pedido.perguntas).map((nome) => [nome, { noul: 0.1 }]));
      return { respostas, modeloResposta: 'jev-falso', uso: { tokensEntrada: 1 }, custoUsd: 0 };
    },
  };
}

/**
 * Confere um texto gerado contra as três garantias da INV-2.
 * @param {{texto: string, valores: string[]}} caso Texto e valores sensíveis.
 * @param {object} deps Dependências do guardrail (Jev falso e log).
 * @param {string[]} recebidos O que o Jev falso recebeu (alterada).
 * @returns {Promise<void>}
 * @throws {assert.AssertionError} Se algum valor vazar ou a máscara não for idempotente.
 */
async function conferirCaso(caso, deps, recebidos) {
  const redigido = redigirTexto(caso.texto);
  const sobrou = caso.valores.filter((valor) => redigido.texto.includes(valor));
  assert.equal(sobrou.length, 0, `máscara deixou ${sobrou.length} valor(es)`);
  assert.equal(redigirTexto(redigido.texto).texto, redigido.texto, 'máscara não idempotente');

  const antes = recebidos.length;
  await avaliarSegredo({ texto: caso.texto }, deps);
  // segredo bloqueia antes do Jev; aprovação e comando mandam o texto (mascarado) ao Jev
  await avaliarAprovacao({ mensagem: caso.texto, perguntaPendente: caso.texto }, deps);
  await avaliarComando({ comando: caso.texto, contexto: caso.texto }, deps);
  const enviado = recebidos.slice(antes).join('\n');
  assert.ok(!caso.valores.some((valor) => enviado.includes(valor)), 'valor enviado ao Jev');
}

/**
 * Gera os textos, confere cada um e por fim confere o log inteiro.
 * @param {number} quantidade Quantidade de textos.
 * @returns {Promise<{falhas: string[], enviados: number}>} Falhas e pedidos ao Jev falso.
 */
async function executar(quantidade) {
  const sorteio = criarSorteio(criarAleatorio(SEMENTE));
  const recebidos = [];
  const deps = {
    consultores: [criarJevQueGuarda(recebidos)], registrar: criarRegistroJsonl(ARQUIVO_LOG_TESTE),
  };
  const falhas = [];
  const todosValores = [];
  for (let i = 0; i < quantidade; i += 1) {
    const caso = gerarCaso(sorteio);
    todosValores.push(...caso.valores);
    try {
      await conferirCaso(caso, deps, recebidos);
    } catch (erro) {
      falhas.push(`#${i}: ${erro.message}`);
    }
  }
  const log = readFileSync(ARQUIVO_LOG_TESTE, 'utf8');
  const noLog = todosValores.filter((valor) => log.includes(valor));
  if (noLog.length > 0) falhas.push(`log contém ${noLog.length} valor(es) bruto(s)`);
  return { falhas, enviados: recebidos.length, valores: todosValores.length };
}

/**
 * Ponto de entrada: imprime o resumo e devolve o código de saída.
 * @returns {Promise<number>} 0 se a INV-2 vale para todos os textos.
 */
async function principal() {
  const quantidade = Number.parseInt(process.argv[2] ?? '', 10) || QUANTIDADE_PADRAO;
  rmSync(ARQUIVO_LOG_TESTE, { force: true });
  const { falhas, enviados, valores } = await executar(quantidade);
  falhas.slice(0, 10).forEach((falha) => console.log(`FALHA ${falha}`));
  const conclusao = falhas.length === 0 ? 'nenhum valor bruto saiu.' : `${falhas.length} falha(s).`;
  console.log(`INV-2: ${quantidade} textos, ${valores} valores sensíveis, ${enviados} pedidos ao `
    + `Jev falso; ${conclusao}`);
  return falhas.length === 0 ? 0 : 1;
}

process.exitCode = await principal();
