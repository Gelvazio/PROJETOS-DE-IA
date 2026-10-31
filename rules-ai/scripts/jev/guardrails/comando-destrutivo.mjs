// Guardrail de comando destrutivo (R3.3). Camada 1 (determinística, sobre o comando INTEIRO,
// inclusive dentro de aspas/`bash -c`): regra destrutiva conhecida → `bloquear`. Se TODOS os
// trechos (`&&`, `||`, `;`, `|`, nova linha) estão na allowlist de leitura → `liberar`.
// Camada 2 (fora da allowlist): o Jev vê o comando mascarado; risco/apagar p ≥ 0,70 →
// `bloquear`; senão `revisar`. Fora da allowlist NUNCA libera sem confirmação humana explícita.
// O Jev só agrava (revisar → bloquear); nunca libera e nunca executa nada.
// Escape humano: `confirmacaoHumana.alvo` = o comando exato (um "sim" genérico não vale).
import {
  ACOES, FONTES, aplicarEscape, calcularHash, concluirDecisao, confirmacaoValida, consultar,
  maiorProbabilidade, montarDependencias, prepararTexto,
} from './seguranca-base.mjs';

const CASO = 'comando-destrutivo';
const ACAO_JEV = 'guardrail:comando-destrutivo';
const LIMIAR_BLOQUEIO = 0.7;
const PADRAO_SEPARADORES = /&&|\|\||[;|\n]/;
/** Redirecionamentos que não gravam arquivo do projeto. */
const PADRAO_REDIRECIONAMENTO_INOFENSIVO = /\d?>\s*(?:\/dev\/null|\$null|nul)\b|\d?>&\d/gi;
const PADRAO_GRAVACAO_OU_SUBSTITUICAO = /[>`]|\$\(/;
const PADRAO_GIT_RESTORE = /^\s*git\s+restore\b/i;
const PADRAO_SO_STAGED = /\s--staged\b/;
const PADRAO_WORKTREE = /\s(?:--worktree|-W)\b/;
const ORIENTACAO = 'Comando fora da allowlist ou destrutivo: não execute. Só o usuário libera, '
  + 'confirmando o comando exato: confirmacaoHumana { confirmado: true, quem, alvo: <comando> }.';
const COMANDOS_LEITURA = [
  'ls', 'dir', 'pwd', 'cd', 'cat', 'head', 'tail', 'wc', 'grep', 'egrep', 'rg', 'echo',
  'printf', 'which', 'where', 'type', 'file', 'stat', 'du', 'df', 'date', 'whoami', 'sort',
  'uniq', 'cut', 'diff', 'cmp', 'sha256sum', 'md5sum', 'tree', 'less', 'more', 'true',
];
const CMDLETS_LEITURA = [
  'Get-ChildItem', 'Get-Content', 'Get-Item', 'Select-String', 'Test-Path', 'Get-Location',
  'Write-Output', 'Measure-Object', 'Get-Date', 'Resolve-Path',
];
const SUBCOMANDOS_GIT_LEITURA = [
  'status', 'log', 'diff', 'show', 'fetch', 'rev-parse', 'ls-files', 'blame', 'describe',
  'shortlog', 'remote\\s+-v',
];
/** Trechos só de leitura (o trecho inteiro precisa casar desde o início). */
const ALLOWLIST = [
  new RegExp(`^(?:${COMANDOS_LEITURA.join('|')})(?:\\s|$)`, 'i'),
  new RegExp(`^git\\s+(?:${SUBCOMANDOS_GIT_LEITURA.join('|')})\\b`, 'i'),
  /^git\s+branch(?:\s+(?:--list|-a|-v|-vv|-r|--show-current))*\s*$/i,
  /^node\s+(?:--check|-v|--version)\b/i,
  /^(?:npm|pnpm|yarn)\s+(?:ls|list|view|-v|--version|outdated)\b/i,
  new RegExp(`^(?:${CMDLETS_LEITURA.join('|')})\\b`, 'i'),
  /^herdr\s+(?:agent\s+(?:list|read)|pane\s+read)\b/i,
];

/**
 * `git restore` sem `--staged` (ou com `--worktree`) descarta mudanças do disco.
 * @param {string} comando Comando inteiro.
 * @returns {boolean} true se algum trecho é um `git restore` que descarta.
 */
function restauraDescartando(comando) {
  return comando.split(PADRAO_SEPARADORES).some((trecho) => {
    const ehRestore = PADRAO_GIT_RESTORE.test(trecho);
    return ehRestore && (!PADRAO_SO_STAGED.test(trecho) || PADRAO_WORKTREE.test(trecho));
  });
}

/** Regras destrutivas: `padrao` (regex) ou `testar` (função) sobre o comando inteiro. */
const REGRAS_DESTRUTIVAS = [
  { regra: 'rm-recursivo-ou-forcado',
    padrao: /\brm\s+(?:-{1,2}[\w-]+\s+)*-(?:[a-z]*[rf][a-z]*|-recursive|-force)\b/i },
  { regra: 'rimraf', padrao: /\brimraf\b/i },
  { regra: 'remove-item-recursivo', padrao: /\bRemove-Item\b[^\n;|&]*-Recurse/i },
  { regra: 'rmdir-s', padrao: /\b(?:rd|rmdir)\s+[^\n;|&]*\/s\b/i },
  { regra: 'del-s-q', padrao: /\b(?:del|erase)\s+[^\n;|&]*\/[sq]\b/i },
  { regra: 'find-delete', padrao: /\bfind\b[^\n;|&]*(?:-delete\b|-exec\s+rm\b)/i },
  { regra: 'xargs-rm', padrao: /\bxargs\s+(?:-\S+\s+)*rm\b/i },
  { regra: 'git-reset-hard', padrao: /\bgit\s+reset\b[^\n;|&]*--hard\b/i },
  { regra: 'git-push-force',
    padrao: /\bgit\s+push\b[^\n;|&]*(?:--force(?:-with-lease)?\b|\s-f\b|\s\+[\w/-]+)/i },
  { regra: 'git-clean', padrao: /\bgit\s+clean\s+[^\n;|&]*-[a-z]*f/i },
  { regra: 'git-checkout-descarta',
    padrao: /\bgit\s+checkout\s+(?:[^\n;|&\s]+\s+)?--\s+\S|\bgit\s+checkout\s+\.(?:\s|$)/i },
  { regra: 'git-restore-descarta', testar: restauraDescartando },
  { regra: 'git-branch-D', padrao: /\bgit\s+branch\s+[^\n;|&]*-D\b/ },
  { regra: 'git-stash-descarta', padrao: /\bgit\s+stash\s+(?:drop|clear)\b/i },
  { regra: 'git-reescreve-historico',
    padrao: /\bgit\s+(?:filter-branch|filter-repo|update-ref\s+-d|reflog\s+expire)\b/i },
  { regra: 'git-gc-prune', padrao: /\bgit\s+gc\b[^\n;|&]*--prune/i },
  { regra: 'sql-drop',
    padrao: /\bdrop\s+(?:table|database|schema|view|function|index|policy|role|trigger|type)\b/i },
  { regra: 'sql-truncate', padrao: /\btruncate\s+(?:table\s+)?["\w.]+/i },
  { regra: 'sql-delete-sem-where', padrao: /\bdelete\s+from\s+["\w.]+\s*(?:;|$|["'])/im },
  { regra: 'sql-update-sem-where',
    padrao: /\bupdate\s+["\w.]+\s+set\b(?:(?!\bwhere\b)[^;"'])*(?:;|$|["'])/im },
  { regra: 'sql-alter-drop', padrao: /\balter\s+table\b[^;]*\bdrop\b/i },
  { regra: 'disco', padrao: /\b(?:format\s+[a-z]:|mkfs(?:\.\w+)?\b|shred\b|diskpart\b)/i },
  { regra: 'dd-grava', padrao: /\bdd\s+[^\n;|&]*\bof=/i },
  { regra: 'banco-reset',
    padrao: /\b(?:supabase\s+db\s+reset|prisma\s+migrate\s+reset|dropdb)\b/i },
  { regra: 'docker-apaga',
    padrao: /\bdocker\s+(?:system\s+prune|volume\s+(?:rm|prune)|rm\s+-f)/i },
  { regra: 'clear-content', padrao: /\bClear-Content\b/i },
];
const PERGUNTAS = {
  risco: {
    type: 'score',
    instructions: 'Qual o risco de este comando apagar, sobrescrever ou perder dados/histórico?',
    criteria: [
      'baixo: só lê ou cria algo novo, reversível',
      'médio: altera arquivos ou estado, mas recuperável',
      'alto: apaga, sobrescreve ou perde dados/histórico de forma difícil de reverter',
    ],
  },
  pode_apagar: {
    type: 'noul',
    instructions: 'Este comando pode apagar ou sobrescrever arquivos, dados de banco ou histórico?',
    criteria: { true: 'pode apagar ou sobrescrever', false: 'não apaga nem sobrescreve' },
  },
};

/**
 * Diz se um trecho do comando é só leitura (allowlist), sem gravação nem substituição.
 * @param {string} trecho Trecho entre separadores.
 * @returns {boolean} true quando está na allowlist (trecho vazio também).
 */
function trechoPermitido(trecho) {
  const limpo = trecho.replace(PADRAO_REDIRECIONAMENTO_INOFENSIVO, '').trim();
  if (limpo === '') return true;
  if (PADRAO_GRAVACAO_OU_SUBSTITUICAO.test(limpo)) return false;
  return ALLOWLIST.some((padrao) => padrao.test(limpo));
}

/**
 * Lista as regras destrutivas que casam com o comando inteiro.
 * @param {string} comando Comando avaliado.
 * @returns {string[]} Nomes das regras.
 */
export function acharRegrasDestrutivas(comando) {
  return REGRAS_DESTRUTIVAS
    .filter((regra) => (regra.testar ? regra.testar(comando) : regra.padrao.test(comando)))
    .map((regra) => regra.regra);
}

/**
 * Diz se todos os trechos do comando estão na allowlist.
 * @param {string} comando Comando avaliado.
 * @returns {boolean} true quando todo trecho é só leitura.
 */
export function estaNaAllowlist(comando) {
  return comando.split(PADRAO_SEPARADORES).every(trechoPermitido);
}

/**
 * Decide pelo Jev um comando fora da allowlist (nunca libera).
 * @param {object} consulta Resultado de `consultar`.
 * @returns {object} Parte da decisão.
 */
function decidirPeloJev(consulta) {
  const base = { exigeConfirmacao: true };
  if (!consulta.respostas) {
    return { ...base, acao: ACOES.REVISAR, motivos: ['fora-da-allowlist', 'jev-indisponivel'],
      fonte: FONTES.NENHUMA };
  }
  const probabilidade = maiorProbabilidade(consulta.respostas, PERGUNTAS);
  const comJev = { ...base, fonte: consulta.fonte, probabilidade };
  if (probabilidade !== null && probabilidade >= LIMIAR_BLOQUEIO) {
    return { ...comJev, acao: ACOES.BLOQUEAR, motivos: ['fora-da-allowlist', 'jev:p>=0.70'] };
  }
  return { ...comJev, acao: ACOES.REVISAR, motivos: ['fora-da-allowlist', 'jev:p<0.70'] };
}

/**
 * Aplica as camadas e devolve a decisão e a consulta feita (se houve).
 * @param {string} comando Comando (sem espaços nas pontas).
 * @param {{texto: string}} preparado Comando mascarado.
 * @param {{contexto: string, consultores: object[]}} apoio Contexto e consultores.
 * @returns {Promise<{decisao: object, consulta: object|null}>} Decisão parcial e consulta.
 */
async function decidir(comando, preparado, apoio) {
  const deterministica = { fonte: FONTES.DETERMINISTICA };
  if (comando === '') {
    return { decisao: { ...deterministica, acao: ACOES.LIBERAR, motivos: ['comando-vazio'] },
      consulta: null };
  }
  const regras = acharRegrasDestrutivas(comando);
  if (regras.length > 0) {
    return { decisao: { ...deterministica, acao: ACOES.BLOQUEAR, exigeConfirmacao: true,
      motivos: regras.map((regra) => `regex:${regra}`) }, consulta: null };
  }
  if (estaNaAllowlist(comando)) {
    return { decisao: { ...deterministica, acao: ACOES.LIBERAR, motivos: ['allowlist'] },
      consulta: null };
  }
  const consulta = await consultar({
    state: { comando: preparado.texto, contexto: prepararTexto(apoio.contexto).texto },
    perguntas: PERGUNTAS, acao: ACAO_JEV,
  }, apoio.consultores);
  return { decisao: decidirPeloJev(consulta), consulta };
}

/**
 * Avalia um comando ANTES de executar.
 * @param {{comando: string, contexto?: string, confirmacaoHumana?: object}} entrada Comando,
 *   contexto opcional (para o Jev) e confirmação humana opcional.
 * @param {{consultores?: object[], registrar?: Function}} [dependencias] Injeção para teste.
 * @returns {Promise<Readonly<object>>} Decisão (o log guarda só o hash do comando).
 */
export async function avaliarComando(entrada, dependencias = {}) {
  const deps = montarDependencias(dependencias);
  const comando = String(entrada?.comando ?? '').trim();
  const preparado = prepararTexto(comando);
  const { decisao, consulta } = await decidir(comando, preparado, {
    contexto: String(entrada?.contexto ?? ''), consultores: deps.consultores,
  });
  const completa = {
    caso: CASO, achados: preparado.achados, hashEntrada: calcularHash(comando),
    limiar: LIMIAR_BLOQUEIO, orientacao: decisao.acao === ACOES.LIBERAR ? null : ORIENTACAO,
    ...decisao,
  };
  const confirmado = confirmacaoValida(entrada?.confirmacaoHumana,
    (alvo) => alvo.trim() === comando);
  return concluirDecisao(aplicarEscape(completa, confirmado), {
    consulta, registrar: deps.registrar,
  });
}
