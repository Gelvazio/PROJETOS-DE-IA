// Gancho `UserPromptSubmit` do Claude Code (JEV-GLOBAL-AI-FINAL.10): lê o JSON do evento pela
// entrada padrão (`prompt`, `cwd`, `session_id`, `hook_event_name`), classifica a mensagem em
// processo e devolve só `additionalContext` com a decisão do Jev e os alertas.
// INV-2: sai SEMPRE com 0, nunca imprime `decision`/`block`, nunca escreve em stderr e nunca
// altera a mensagem; entrada malformada, mensagem pulada ou qualquer falha = nenhuma saída.
// A chave vem de config.mjs (ambiente ou .env da raiz do rules-ai): este arquivo não a lê nem a
// imprime. Roda a partir de qualquer pasta de projeto.
import { basename } from 'node:path';
import { rodarComProxySePreciso } from '../proxy.mjs';

const EVENTO = 'UserPromptSubmit';
const TEMPO_LEITURA_MS = 3000;

/**
 * Lê a entrada padrão inteira, com limite de tempo (se o gancho não fechar a entrada, segue).
 * @returns {Promise<string>} Texto recebido (vazio em terminal interativo ou no limite).
 */
function lerEntrada() {
  if (process.stdin.isTTY) return Promise.resolve('');
  const leitura = (async () => {
    const partes = [];
    for await (const parte of process.stdin) partes.push(parte);
    return Buffer.concat(partes).toString('utf8');
  })();
  const limite = new Promise((resolver) => {
    setTimeout(() => resolver(''), TEMPO_LEITURA_MS).unref();
  });
  return Promise.race([leitura, limite]);
}

/**
 * Converte o JSON do evento; inválido ou de outro evento vira null.
 * @param {string} texto Entrada bruta.
 * @returns {{prompt: string, cwd: string}|null} Campos usados, ou null para não fazer nada.
 */
function lerEvento(texto) {
  try {
    const evento = JSON.parse(texto);
    const ehOutroEvento = evento.hook_event_name && evento.hook_event_name !== EVENTO;
    if (ehOutroEvento || typeof evento.prompt !== 'string') return null;
    return { prompt: evento.prompt, cwd: typeof evento.cwd === 'string' ? evento.cwd : '' };
  } catch {
    return null;
  }
}

/**
 * Classifica a mensagem e monta a saída do gancho.
 * @param {{prompt: string, cwd: string}} evento Evento lido.
 * @returns {Promise<string>} JSON da saída, ou vazio quando não há contexto a acrescentar.
 */
async function montarSaida(evento) {
  const { classificarMensagem, montarContexto } = await import('../mensagem/classificar.mjs');
  const projeto = basename(evento.cwd) || basename(process.cwd());
  const resultado = await classificarMensagem({ texto: evento.prompt, projeto });
  const contexto = montarContexto(resultado);
  if (!contexto) return '';
  return JSON.stringify({
    hookSpecificOutput: { hookEventName: EVENTO, additionalContext: contexto },
  });
}

/**
 * Programa principal: nunca lança e nunca muda o código de saída.
 * @returns {Promise<void>}
 */
async function principal() {
  try {
    if (await rodarComProxySePreciso()) {
      process.exitCode = 0;
      return;
    }
    const evento = lerEvento(await lerEntrada());
    const saida = evento ? await montarSaida(evento) : '';
    if (saida) process.stdout.write(`${saida}\n`);
  } catch {
    // INV-2: falha do gancho nunca aparece na tela nem bloqueia a mensagem.
  }
  process.exitCode = 0;
}

await principal();
