#!/usr/bin/env node
/**
 * Gerenciador centralizado de tarefas (GERENCIADOR-GLOBAL.3, regra `gerenciador-centralizado`).
 *
 * Modo `ver` (o único desta versão): lê o `tasks/STATUS.md` do `origin/main` de cada projeto da
 * configuração e mostra, por projeto e modelo, as subtarefas livres com dependências prontas.
 * NÃO reserva tarefa, NÃO abre sessão de IA e NÃO escreve em quadro algum. O único comando de
 * rede é `git fetch origin main` (atualiza só a referência remota; use --sem-fetch para evitar).
 * O disparo (GERENCIADOR-GLOBAL.4) e a vigilância com trava/PARAR (GERENCIADOR-GLOBAL.5) ficam
 * para as próximas subtarefas.
 *
 * Uso: node scripts/gerenciador.mjs [--projeto <trecho>] [--sem-fetch] [--json]
 *                                   [--limite <n> | --tudo] [--config <arquivo>]
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { calcularQuadro } from './gerenciador/quadro.mjs';
import {
  atualizarRemoto,
  descobrirPastas,
  ehRepositorioGit,
  lerArquivoDoRamo,
  lerCommit,
  lerOrigem,
} from './gerenciador/repositorio.mjs';
import { formatarProjeto, formatarResumo } from './gerenciador/saida.mjs';

const PASTA_SCRIPTS = dirname(fileURLToPath(import.meta.url));
const CAMINHO_CONFIG_PADRAO = join(PASTA_SCRIPTS, 'gerenciador.config.json');
const RAIZ_PADRAO = resolve(PASTA_SCRIPTS, '..', '..');
const MODO_VER = 'ver';
const TIMEOUT_GIT_PADRAO = 60;
const LIMITE_PADRAO = 10;
const SAIDA_OK = 0;
const SAIDA_NADA_LIDO = 1;
const SAIDA_USO_INVALIDO = 2;

const AJUDA = `Gerenciador centralizado (modo ver, somente leitura).
Uso: node scripts/gerenciador.mjs [opções]
  --projeto <trecho>  só projetos cujo nome contém o trecho
  --sem-fetch         não atualiza o origin/main antes de ler
  --json              saída em JSON (todas as subtarefas livres)
  --limite <n>        linhas por modelo na tabela (padrão: da configuração)
  --tudo              lista todas as subtarefas livres
  --config <arquivo>  outra configuração
  --modo <modo>       só existe "ver" nesta versão`;

/**
 * Lê os argumentos da linha de comando.
 * @param {string[]} argv - Argumentos sem `node` e sem o script.
 * @returns {Object} Opções lidas.
 * @throws {Error} Se houver opção desconhecida ou sem valor.
 */
function lerArgumentos(argv) {
  const opcoes = { semFetch: false, json: false, tudo: false, ajuda: false };
  const comValor = {
    '--projeto': 'projeto',
    '--limite': 'limite',
    '--config': 'config',
    '--modo': 'modo',
  };
  const simples = {
    '--sem-fetch': 'semFetch',
    '--json': 'json',
    '--tudo': 'tudo',
    '--ajuda': 'ajuda',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const argumento = argv[i];
    if (simples[argumento]) {
      opcoes[simples[argumento]] = true;
    } else if (comValor[argumento]) {
      i += 1;
      if (argv[i] === undefined) throw new Error(`${argumento} precisa de um valor`);
      opcoes[comValor[argumento]] = argv[i];
    } else {
      throw new Error(`opção desconhecida: ${argumento}`);
    }
  }
  return opcoes;
}

/**
 * Lê e valida a configuração. Recusa qualquer modo diferente de `ver`.
 * @param {Object} opcoes - Opções da linha de comando.
 * @returns {Object} Configuração validada.
 * @throws {Error} Se o arquivo não existir, for inválido ou pedir o modo `disparar`.
 */
function carregarConfiguracao(opcoes) {
  const caminho = resolve(opcoes.config ?? CAMINHO_CONFIG_PADRAO);
  if (!existsSync(caminho)) throw new Error(`configuração não encontrada: ${caminho}`);

  const config = JSON.parse(readFileSync(caminho, 'utf8'));
  const modo = opcoes.modo ?? config.modo ?? MODO_VER;
  if (modo !== MODO_VER) {
    const motivo = 'o disparo é a GERENCIADOR-GLOBAL.4';
    throw new Error(`modo "${modo}" não existe nesta versão (${motivo})`);
  }
  if (!Array.isArray(config.projetos) || !Array.isArray(config.modelos)) {
    throw new Error('configuração precisa de "projetos" e "modelos" (listas)');
  }
  return { ...config, raiz: config.raiz ? resolve(config.raiz) : RAIZ_PADRAO };
}

/**
 * Transforma a lista de projetos da configuração em pastas reais (expande `*`).
 * Pasta sem correspondência vira alvo "ausente" (aparece no relatório, não quebra a leitura).
 * @param {Object} config - Configuração validada.
 * @param {Object} opcoes - Opções da linha de comando.
 * @returns {{nome: string, caminho: string|null, ramo: string, avisos: string[]}[]} Alvos.
 */
function montarAlvos(config, opcoes) {
  const alvos = [];
  for (const projeto of config.projetos) {
    const encontradas = descobrirPastas(config.raiz, projeto.pasta);
    const ramo = projeto.ramo ?? config.ramo ?? 'origin/main';
    if (encontradas.length === 0) {
      const aviso = `pasta ausente em ${config.raiz}: ${projeto.pasta}`;
      alvos.push({ nome: projeto.pasta, caminho: null, ramo, avisos: [aviso] });
    }
    for (const nome of encontradas) {
      alvos.push({ nome, caminho: join(config.raiz, nome), ramo, avisos: [] });
    }
  }
  const filtro = (opcoes.projeto ?? '').toLowerCase();
  return alvos.filter((alvo) => alvo.nome.toLowerCase().includes(filtro));
}

/**
 * Lê os arquivos do quadro no ramo remoto e calcula as subtarefas livres.
 * @param {Object} alvo - Alvo (nome, caminho, ramo).
 * @param {{config: Object, opcoes: Object}} contexto - Configuração e opções.
 * @returns {Promise<Object>} Resultado do projeto (estado `lido` ou `erro`).
 */
async function lerQuadroDoRamo(alvo, contexto) {
  const { config, opcoes } = contexto;
  const timeoutSegundos = config.timeoutGitSegundos ?? TIMEOUT_GIT_PADRAO;
  const avisos = [...alvo.avisos];

  if (!opcoes.semFetch) {
    const fetch = await atualizarRemoto(alvo.caminho, alvo.ramo, timeoutSegundos);
    if (!fetch.ok) avisos.push(`fetch falhou, usando o ${alvo.ramo} local: ${fetch.erro}`);
  }
  const commit = await lerCommit(alvo.caminho, alvo.ramo, timeoutSegundos);
  if (!commit) return { pasta: alvo.nome, estado: 'erro', avisos: [...avisos, `sem ${alvo.ramo}`] };

  const arquivo = await lerArquivoDoRamo(alvo.caminho, alvo.ramo, {
    candidatos: config.arquivosQuadro ?? ['tasks/STATUS.md'],
    timeoutSegundos,
  });
  if (!arquivo) return { pasta: alvo.nome, estado: 'erro', avisos: [...avisos, 'sem STATUS.md'] };

  const concluidas = await lerArquivoDoRamo(alvo.caminho, alvo.ramo, {
    candidatos: config.arquivosConcluidas ?? ['tasks/task_complete.md'],
    timeoutSegundos,
  });
  const textos = { status: arquivo.texto, concluidas: concluidas?.texto ?? '' };
  let quadro;
  try {
    quadro = calcularQuadro(textos, config);
  } catch (erro) {
    // Formato do quadro não reconhecido (R2.3): o projeto sai como erro, com a mensagem.
    return { pasta: alvo.nome, estado: 'erro', avisos: [...avisos, erro.message] };
  }
  return {
    pasta: alvo.nome, estado: 'lido', ramo: alvo.ramo, commit, avisos,
    caminhoQuadro: arquivo.caminho, quadro,
  };
}

/**
 * Lê um projeto: valida a pasta, pula clones do mesmo repositório e lê o quadro.
 * @param {Object} alvo - Alvo (nome, caminho, ramo, avisos).
 * @param {{config: Object, opcoes: Object, origens: Map}} contexto - Dados compartilhados.
 * @returns {Promise<Object>} Resultado do projeto.
 */
async function lerProjeto(alvo, contexto) {
  if (!alvo.caminho) return { pasta: alvo.nome, estado: 'ausente', avisos: alvo.avisos };
  if (!ehRepositorioGit(alvo.caminho)) {
    return { pasta: alvo.nome, estado: 'erro', avisos: ['não é repositório Git'] };
  }
  const timeoutSegundos = contexto.config.timeoutGitSegundos ?? TIMEOUT_GIT_PADRAO;
  const origem = await lerOrigem(alvo.caminho, timeoutSegundos);
  const primeiro = origem ? contexto.origens.get(origem) : null;
  if (primeiro) {
    const aviso = `mesmo repositório de ${primeiro} (${origem}); lido uma vez só`;
    return { pasta: alvo.nome, estado: 'duplicado', avisos: [aviso] };
  }
  if (origem) contexto.origens.set(origem, alvo.nome);
  const resultado = await lerQuadroDoRamo(alvo, contexto);
  return { ...resultado, origem };
}

/**
 * Escreve o relatório de texto puro: um bloco por projeto e o resumo geral.
 * @param {Object[]} resultados - Resultados de todos os projetos.
 * @param {{config: Object, opcoes: Object}} contexto - Configuração e opções.
 * @returns {void}
 */
function imprimirRelatorio(resultados, contexto) {
  const { config, opcoes } = contexto;
  const limiteConfig = config.limiteLinhasPorModelo ?? LIMITE_PADRAO;
  const limite = opcoes.tudo ? 0 : Number(opcoes.limite ?? limiteConfig);
  const agora = new Date().toLocaleString('pt-BR');

  console.log(`Gerenciador centralizado - modo ver - ${agora}`);
  console.log('Somente leitura: nenhuma sessão aberta, nenhum quadro escrito.\n');
  for (const resultado of resultados) {
    console.log(formatarProjeto(resultado, { modelos: config.modelos, limite }));
    console.log('');
  }
  console.log('== Resumo (subtarefas livres com dependências prontas)');
  console.log(formatarResumo(resultados, config.modelos));
}

/**
 * Ponto de entrada: lê a configuração, percorre os projetos um a um e imprime.
 * @param {string[]} argv - Argumentos da linha de comando.
 * @returns {Promise<number>} Código de saída.
 */
export async function principal(argv) {
  let opcoes;
  let config;
  try {
    opcoes = lerArgumentos(argv);
    if (opcoes.ajuda) {
      console.log(AJUDA);
      return SAIDA_OK;
    }
    config = carregarConfiguracao(opcoes);
  } catch (erro) {
    console.error(`gerenciador: ${erro.message}\n\n${AJUDA}`);
    return SAIDA_USO_INVALIDO;
  }
  const contexto = { config, opcoes, origens: new Map() };
  const resultados = [];
  for (const alvo of montarAlvos(config, opcoes)) {
    resultados.push(await lerProjeto(alvo, contexto));
  }
  if (opcoes.json) console.log(JSON.stringify(resultados, null, 2));
  else imprimirRelatorio(resultados, contexto);

  return resultados.some((resultado) => resultado.estado === 'lido') ? SAIDA_OK : SAIDA_NADA_LIDO;
}

const executadoDiretamente = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (executadoDiretamente) {
  process.exitCode = await principal(process.argv.slice(2));
}
