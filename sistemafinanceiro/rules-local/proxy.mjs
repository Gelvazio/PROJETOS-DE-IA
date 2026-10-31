// Proxy da nuvem (RULES-LOCAL-JEV.1): na nuvem do Claude Code, o `fetch` do Node SEM proxy já
// recebeu por horas uma cópia velha da `main`; com `NODE_USE_ENV_PROXY=1` vem a atual. Quando há
// `HTTPS_PROXY` e a variável ainda não está ligada, o script se roda de novo como processo filho
// com ela ligada. No PC (sem `HTTPS_PROXY`) nada muda. Nunca lança.
import { spawn } from 'node:child_process';

const VARIAVEL_USAR_PROXY = 'NODE_USE_ENV_PROXY';
const VALOR_LIGADO = '1';
const CODIGO_FALHA_FILHO = 1;

/**
 * Diz se o ambiente tem proxy configurado e o uso dele ainda não foi ligado.
 * @param {Record<string, string|undefined>} ambiente Variáveis de ambiente.
 * @returns {boolean} true se vale rodar de novo com o proxy.
 */
function precisaDoProxy(ambiente) {
  const temProxy = Boolean(ambiente.HTTPS_PROXY || ambiente.https_proxy);
  return temProxy && ambiente[VARIAVEL_USAR_PROXY] !== VALOR_LIGADO;
}

/**
 * Roda o mesmo script como filho, com o proxy ligado, e espera o fim.
 * @returns {Promise<boolean>} true se o filho rodou até o fim; false se não conseguiu iniciar.
 */
function rodarFilho() {
  return new Promise((resolver) => {
    let filho;
    try {
      const ambiente = {
        ...process.env, [VARIAVEL_USAR_PROXY]: VALOR_LIGADO, NODE_NO_WARNINGS: '1',
      };
      filho = spawn(process.execPath, process.argv.slice(1), {
        env: ambiente, stdio: 'inherit',
      });
    } catch {
      resolver(false);
      return;
    }
    filho.once('error', () => resolver(false));
    filho.once('close', (codigo) => {
      process.exitCode = codigo ?? CODIGO_FALHA_FILHO;
      resolver(true);
    });
  });
}

/**
 * Se estiver na nuvem com proxy e sem `NODE_USE_ENV_PROXY=1`, roda este mesmo script de novo com
 * ele ligado (entrada e saída herdadas) e devolve true: quem chamou deve sair sem fazer mais nada.
 * @returns {Promise<boolean>} true se o filho já fez o trabalho; false para seguir normalmente.
 */
export async function rodarComProxySePreciso() {
  try {
    if (!precisaDoProxy(process.env)) return false;
    return await rodarFilho();
  } catch {
    return false;
  }
}
