// Tira o gancho de prompt GLOBAL do Jev do Claude Code (conta padrão e contas A, B e C) e do Codex.
// Desde a C44 (RULES-LOCAL-JEV, resposta 1 do usuário em 2026-10-20: "só do projeto") o gancho
// vive no `.claude/settings.json` e no `.codex/hooks.json` de cada projeto, gravados pelo
// `scripts/instalar-rules-local.mjs`; o global da JEV-GLOBAL-AI-FINAL.11/.12 não é mais instalado.
// Chamado pelo `scripts/sincronizar.mjs`: sem --aplicar só mostra o que faria. Só REMOVE a entrada
// do Jev: os outros ganchos ficam como estão, o arquivo antigo vira `.bak` e o JSON novo é
// conferido antes de gravar. JSON inválido → pula sem gravar.
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

const EVENTO = 'UserPromptSubmit';
const INDENTACAO_JSON = 2;
const CONTAS_EXTRAS_CLAUDE = ['A', 'B', 'C'];
const PADRAO_FLAG_CODEX = /^\s*codex_hooks\s*=\s*true\b/m;
const AVISO_FLAG_CODEX = 'aviso    Codex: ganchos exigem `codex_hooks = true` em [features] do '
  + '~/.codex/config.toml (não editado aqui; ligue à mão)';

/**
 * Lista os destinos onde o gancho global pode ter ficado: Claude Code (4 contas) e Codex.
 * A marca é o trecho do caminho do script global no `rules-ai` (o do projeto é
 * `rules-local/jev/ganchos/…` e não casa com ela).
 * @param {string} [pastaUsuario] Pasta do usuário (injetável para teste).
 * @returns {{ia: string, arquivo: string, marca: string}[]}
 */
export function listarDestinosDeGancho(pastaUsuario = homedir()) {
  const pastasClaude = [
    ['Claude Code', '.claude'],
    ...CONTAS_EXTRAS_CLAUDE.map(
      (conta) => [`Claude Code (conta${conta})`, `.claude-conta${conta}`],
    ),
  ];
  const destinosClaude = pastasClaude.map(([ia, pasta]) => ({
    ia, arquivo: join(pastaUsuario, pasta, 'settings.json'),
    marca: 'scripts/jev/ganchos/claude-prompt.mjs',
  }));
  const codex = {
    ia: 'Codex', arquivo: join(pastaUsuario, '.codex', 'hooks.json'),
    marca: 'scripts/jev/ganchos/codex-prompt.mjs',
  };
  return [...destinosClaude, codex];
}

/**
 * Diz se um gancho chama o script global do Jev (pela marca no comando).
 * @param {{command?: string}} gancho Item de `hooks`.
 * @param {string} marca Trecho do caminho do script do Jev.
 * @returns {boolean} true quando é o gancho global do Jev.
 */
function ehGanchoDoJev(gancho, marca) {
  return String(gancho?.command ?? '').replaceAll('\\', '/').includes(marca);
}

/**
 * Tira de um grupo os ganchos do Jev.
 * @param {{hooks?: object[]}} grupo Grupo do evento.
 * @param {string} marca Trecho do caminho do script do Jev.
 * @returns {object} Grupo sem o Jev (os outros ganchos ficam).
 */
function tirarJevDoGrupo(grupo, marca) {
  const ganchos = Array.isArray(grupo?.hooks) ? grupo.hooks : [];
  return { ...grupo, hooks: ganchos.filter((gancho) => !ehGanchoDoJev(gancho, marca)) };
}

/**
 * Tira a entrada do Jev do evento, sem tocar nos outros ganchos (grupo que fica vazio sai; evento
 * que fica vazio sai).
 * @param {object} configuracao JSON atual (objeto).
 * @param {{marca: string}} destino Marca do Jev no comando.
 * @returns {object} JSON novo (cópia); igual ao atual quando não havia o Jev.
 * @throws {Error} Se `hooks.<evento>` existir sem ser uma lista.
 */
export function removerGancho(configuracao, destino) {
  const novo = structuredClone(configuracao);
  const grupos = novo.hooks?.[EVENTO];
  if (grupos === undefined) return novo;
  if (!Array.isArray(grupos)) throw new Error(`"hooks.${EVENTO}" não é uma lista`);

  const semJev = grupos
    .map((grupo) => tirarJevDoGrupo(grupo, destino.marca))
    .filter((grupo) => grupo.hooks.length > 0);
  if (semJev.length > 0) novo.hooks[EVENTO] = semJev;
  else delete novo.hooks[EVENTO];
  return novo;
}

/**
 * Lê o JSON atual do destino (vazio quando o arquivo não existe).
 * @param {string} arquivo Caminho do JSON.
 * @returns {{texto: string, objeto: object}} Texto e objeto.
 * @throws {SyntaxError} Se o arquivo existir com JSON inválido.
 */
function lerJson(arquivo) {
  if (!existsSync(arquivo)) return { texto: '', objeto: {} };
  const texto = readFileSync(arquivo, 'utf8');
  const semBom = texto.replace(/^﻿/, '');
  return { texto, objeto: semBom.trim() === '' ? {} : JSON.parse(semBom) };
}

/**
 * Monta o texto novo do destino, conferindo que é JSON válido antes de devolver.
 * @param {{arquivo: string, marca: string}} destino Destino.
 * @returns {{atual: string, novo: string}} Texto atual e texto novo.
 * @throws {Error} Se o JSON atual for inválido ou o formato de `hooks` não for o esperado.
 */
function montarTextoNovo(destino) {
  const { texto, objeto } = lerJson(destino.arquivo);
  const semJev = removerGancho(objeto, destino);
  const mudou = JSON.stringify(semJev) !== JSON.stringify(objeto);
  if (!mudou) return { atual: texto, novo: texto };
  const novo = `${JSON.stringify(semJev, null, INDENTACAO_JSON)}\n`;
  JSON.parse(novo);
  return { atual: texto, novo };
}

/**
 * Sincroniza o gancho de um destino (ou só informa, sem `aplicar`).
 * @param {object} destino Destino de {@link listarDestinosDeGancho}.
 * @param {boolean} aplicar true grava; false só mostra.
 * @returns {void}
 */
function sincronizarGancho(destino, aplicar) {
  const rotulo = `${destino.ia} (gancho)`;
  if (!existsSync(destino.arquivo)) return console.log(`pulado   ${rotulo}: arquivo não existe`);

  let textos;
  try {
    textos = montarTextoNovo(destino);
  } catch (erro) {
    return console.warn(`pulado   ${rotulo}: ${destino.arquivo} (${erro.message}; nada gravado)`);
  }
  if (textos.novo === textos.atual) return console.log(`igual    ${rotulo}: sem o Jev global`);
  if (!aplicar) {
    return console.log(`mudaria  ${rotulo}: tiraria o Jev global de ${destino.arquivo}`);
  }

  if (textos.atual) copyFileSync(destino.arquivo, `${destino.arquivo}.bak`);
  writeFileSync(destino.arquivo, textos.novo, 'utf8');
  console.log(`gravado  ${rotulo}: Jev global removido de ${destino.arquivo}`);
}

/**
 * Avisa quando o Codex existe mas os ganchos estão desligados no `config.toml`.
 * @param {string} pastaUsuario Pasta do usuário.
 * @returns {void}
 */
function avisarFlagDoCodex(pastaUsuario) {
  const pasta = join(pastaUsuario, '.codex');
  if (!existsSync(pasta)) return;
  const arquivo = join(pasta, 'config.toml');
  const ligado = existsSync(arquivo) && PADRAO_FLAG_CODEX.test(readFileSync(arquivo, 'utf8'));
  if (!ligado) console.warn(AVISO_FLAG_CODEX);
}

/**
 * Tira o gancho global do Jev de todos os destinos (o do projeto vem do `rules-local/`).
 * @param {{aplicar: boolean, pastaUsuario?: string}} opcoes Gravar ou só mostrar.
 * @returns {void}
 */
export function sincronizarGanchos({ aplicar, pastaUsuario = homedir() }) {
  const pasta = resolve(pastaUsuario);
  listarDestinosDeGancho(pasta).forEach((destino) => sincronizarGancho(destino, aplicar));
  avisarFlagDoCodex(pasta);
}
