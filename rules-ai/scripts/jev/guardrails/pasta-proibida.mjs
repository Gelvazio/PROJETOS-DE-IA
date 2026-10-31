// Guardrail de pasta proibida (C20/C23): nada de `C:\fontes\DEMAIS-PROJETOS-*` (offline ou
// "não mexer agora") é lido, listado, buscado ou indexado. Este módulo NUNCA abre a pasta para
// conferir: só normaliza o texto do caminho (barras, `..`, maiúsculas, `/c/…`, `\\?\`).
// Camada 1: caminho que cai no prefixo proibido → `bloquear` (determinístico). Exclusão explícita
// (`--glob '!DEMAIS-PROJETOS-*/**'`, `--exclude…`, `-not -path`) é permitida. Camada 2: menção
// ambígua (nome solto, caminho fora de C:\fontes) → Jev: pede acesso? p ≥ 0,70 → `bloquear`;
// senão `avisar`; sem Jev → `revisar`.
// Escape humano (o usuário pediu o projeto pelo nome/caminho): `confirmacaoHumana.alvo` = pasta
// autorizada dentro de `C:\fontes\DEMAIS-PROJETOS-*`, que cubra todos os caminhos bloqueados.
import { win32 } from 'node:path';
import { RAIZ_RULES_AI } from '../config.mjs';
import {
  ACOES, FONTES, aplicarEscape, calcularHash, concluirDecisao, confirmacaoValida, consultar,
  lerProbabilidade, montarDependencias, prepararTexto,
} from './seguranca-base.mjs';

const CASO = 'pasta-proibida';
const ACAO_JEV = 'guardrail:pasta-proibida';
const LIMIAR_BLOQUEIO = 0.7;
const PREFIXO_PROIBIDO = 'c:/fontes/demais-projetos-';
const PERGUNTA = 'pede_acesso';
/** Token que cita a pasta: sem espaço, aspas nem separador de comando. */
const PADRAO_TOKEN = /[^\s'"`|;&<>()]*demais-projetos-[^\s'"`|;&<>()]*/gi;
const PADRAO_SEPARADOR = /[\\/]/;
const PADRAO_ABSOLUTO = /^(?:[a-z]:|[\\/]{2}|\/[a-z](?:\/|$)|\/mnt\/[a-z](?:\/|$))/i;
const PADRAO_NOME = /demais-projetos-/i;
const PADRAO_CONTEXTO_EXCLUSAO = /(?:-not\s+-i?path|!\s+-i?path|--exclude(?:-dir)?)[=\s]*['"]?$/i;
const PADRAO_TOKEN_EXCLUSAO = /^(?:!|--exclude(?:-dir)?=|--glob=!)/i;
const TAMANHO_CONTEXTO_ANTERIOR = 40;
const ORIENTACAO = 'C20/C23: não leia, liste, busque nem indexe DEMAIS-PROJETOS-*. Só o usuário '
  + 'libera, pedindo o projeto pelo nome ou caminho: confirmacaoHumana { confirmado: true, quem, '
  + 'alvo: <pasta autorizada> }.';
const PERGUNTAS = {
  [PERGUNTA]: {
    type: 'noul',
    instructions: 'A mensagem pede ou planeja ler, listar, buscar, abrir, copiar ou indexar o '
      + 'conteúdo de uma pasta DEMAIS-PROJETOS-* (e não apenas citá-la, proibi-la ou excluí-la)?',
    criteria: { true: 'pede acesso ao conteúdo', false: 'só cita, proíbe ou exclui a pasta' },
  },
};

/**
 * Normaliza um caminho para comparar com o prefixo proibido, sem tocar no disco.
 * @param {string} caminho Caminho em qualquer forma (Windows, `/c/…`, `\\?\`, relativo).
 * @param {string} [base] Pasta para resolver caminhos relativos (padrão: raiz do rules-ai).
 * @returns {string} Caminho absoluto, com `/` e em minúsculas (ex.: `c:/fontes/x`).
 */
export function normalizarCaminho(caminho, base = RAIZ_RULES_AI) {
  const limpo = String(caminho ?? '').trim()
    .replace(/^['"]+|['"]+$/g, '')
    .replace(/^[\\/]{2}[?.][\\/]/, '')
    .replace(/^\/(?:mnt\/)?([a-z])(?=\/|$)/i, '$1:');
  return win32.resolve(base, limpo).replace(/\\/g, '/').toLowerCase();
}

/**
 * Diz se um caminho normalizado cai na pasta proibida.
 * @param {string} normalizado Saída de {@link normalizarCaminho}.
 * @returns {boolean} true dentro de `c:/fontes/demais-projetos-*`.
 */
function ehProibido(normalizado) {
  return normalizado.startsWith(PREFIXO_PROIBIDO);
}

/**
 * Diz se a citação é uma exclusão explícita (ex.: `--glob '!DEMAIS-PROJETOS-*'`).
 * @param {string} token Token achado.
 * @param {string} antes Texto que vem antes do token.
 * @returns {boolean} true para exclusão.
 */
function ehExclusao(token, antes) {
  return PADRAO_TOKEN_EXCLUSAO.test(token) || PADRAO_CONTEXTO_EXCLUSAO.test(antes);
}

/**
 * Classifica um caminho: proibido (bloqueia), mencao (ambíguo) ou livre.
 * @param {string} caminho Caminho ou token.
 * @param {{base: string, ehCaminhoExplicito: boolean}} opcoes Base e se veio de `caminhos`.
 * @returns {{tipo: string, normalizado?: string}} Classificação.
 */
function classificar(caminho, opcoes) {
  const pareceCaminho = opcoes.ehCaminhoExplicito || PADRAO_SEPARADOR.test(caminho)
    || PADRAO_ABSOLUTO.test(caminho);
  const normalizado = normalizarCaminho(caminho, opcoes.base);
  if (pareceCaminho && ehProibido(normalizado)) return { tipo: 'proibido', normalizado };
  if (PADRAO_NOME.test(caminho)) return { tipo: 'mencao' };
  return { tipo: 'livre' };
}

/**
 * Acha os caminhos e menções no texto livre (comando, mensagem, plano).
 * @param {string} texto Texto avaliado.
 * @param {string} base Pasta para resolver relativos.
 * @returns {{tipo: string, normalizado?: string}[]} Classificações (sem as exclusões).
 */
function classificarTexto(texto, base) {
  const resultados = [];
  for (const achado of texto.matchAll(PADRAO_TOKEN)) {
    const antes = texto.slice(Math.max(0, achado.index - TAMANHO_CONTEXTO_ANTERIOR), achado.index);
    if (ehExclusao(achado[0], antes)) continue;
    resultados.push(classificar(achado[0], { base, ehCaminhoExplicito: false }));
  }
  return resultados;
}

/**
 * Decide a menção ambígua pelo Jev.
 * @param {object} consulta Resultado de `consultar`.
 * @returns {object} Parte da decisão.
 */
function decidirMencao(consulta) {
  if (!consulta.respostas) {
    return { acao: ACOES.REVISAR, motivos: ['mencao-ambigua', 'jev-indisponivel'],
      fonte: FONTES.NENHUMA, exigeConfirmacao: true };
  }
  const probabilidade = lerProbabilidade(consulta.respostas, PERGUNTA, PERGUNTAS[PERGUNTA]);
  const base = { fonte: consulta.fonte, probabilidade };
  if (probabilidade === null) {
    return { ...base, acao: ACOES.REVISAR, motivos: ['jev-sem-probabilidade'],
      exigeConfirmacao: true };
  }
  if (probabilidade >= LIMIAR_BLOQUEIO) {
    return { ...base, acao: ACOES.BLOQUEAR, motivos: ['mencao-ambigua', 'jev:p>=0.70'],
      exigeConfirmacao: true };
  }
  return { ...base, acao: ACOES.AVISAR, motivos: ['mencao-ambigua', 'jev:p<0.70'] };
}

/**
 * Aplica as camadas sobre as classificações.
 * @param {{proibidos: string[], mencoes: number, texto: string}} achados Caminhos e menções.
 * @param {{consultores: object[]}} deps Dependências.
 * @returns {Promise<{decisao: object, consulta: object|null, preparado: object}>} Decisão.
 */
async function decidir(achados, deps) {
  const preparado = prepararTexto(achados.texto);
  if (achados.proibidos.length > 0) {
    return { decisao: { acao: ACOES.BLOQUEAR, motivos: ['caminho-proibido:C20/C23'],
      fonte: FONTES.DETERMINISTICA, exigeConfirmacao: true }, consulta: null, preparado };
  }
  if (achados.mencoes === 0) {
    return { decisao: { acao: ACOES.LIBERAR, motivos: ['sem-pasta-proibida'],
      fonte: FONTES.DETERMINISTICA }, consulta: null, preparado };
  }
  const consulta = await consultar({
    state: { texto: preparado.texto }, perguntas: PERGUNTAS, acao: ACAO_JEV,
  }, deps.consultores);
  return { decisao: decidirMencao(consulta), consulta, preparado };
}

/**
 * Monta a verificação do escape: o alvo autorizado está dentro da área proibida e cobre todos
 * os caminhos bloqueados.
 * @param {string[]} proibidos Caminhos proibidos normalizados.
 * @param {string} base Pasta para resolver o alvo.
 * @returns {(alvo: string) => boolean} Verificador.
 */
function criarVerificadorDeAlvo(proibidos, base) {
  return (alvo) => {
    const autorizado = normalizarCaminho(alvo, base).replace(/\/+$/, '');
    const estaNaArea = ehProibido(autorizado);
    return estaNaArea && proibidos.every(
      (caminho) => caminho === autorizado || caminho.startsWith(`${autorizado}/`),
    );
  };
}

/**
 * Avalia se uma ação toca pasta proibida (C20/C23).
 * @param {{caminhos?: string[], texto?: string, base?: string, confirmacaoHumana?: object}}
 *   entrada Caminhos que serão lidos/escritos, texto livre (comando, plano), base dos relativos.
 * @param {{consultores?: object[], registrar?: Function}} [dependencias] Injeção para teste.
 * @returns {Promise<Readonly<object>>} Decisão (sem caminhos nem texto no log).
 */
export async function avaliarPastaProibida(entrada, dependencias = {}) {
  const deps = montarDependencias(dependencias);
  const base = entrada?.base ?? RAIZ_RULES_AI;
  const texto = String(entrada?.texto ?? '');
  const classificacoes = [
    ...(entrada?.caminhos ?? []).map((caminho) => classificar(caminho, {
      base, ehCaminhoExplicito: true,
    })),
    ...classificarTexto(texto, base),
  ];
  const proibidos = classificacoes.filter((c) => c.tipo === 'proibido').map((c) => c.normalizado);
  const mencoes = classificacoes.filter((c) => c.tipo === 'mencao').length;
  const { decisao, consulta, preparado } = await decidir({ proibidos, mencoes, texto }, deps);
  const completa = {
    caso: CASO, achados: preparado.achados, limiar: LIMIAR_BLOQUEIO,
    hashEntrada: calcularHash(`${(entrada?.caminhos ?? []).join('\n')}\n${texto}`),
    orientacao: decisao.acao === ACOES.LIBERAR ? null : ORIENTACAO, ...decisao,
  };
  const confirmado = confirmacaoValida(entrada?.confirmacaoHumana,
    criarVerificadorDeAlvo(proibidos, base));
  return concluirDecisao(aplicarEscape(completa, confirmado), {
    consulta, registrar: deps.registrar,
  });
}
