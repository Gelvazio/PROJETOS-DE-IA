// Leitura simples da linha de comando do `scripts/jev.mjs`: subcomando, posicionais e opções.
// Opções booleanas conhecidas não consomem valor; as demais leem o próximo argumento.

const OPCOES_BOOLEANAS = new Set(['json', 'dry-run', 'ajuda', 'todas', 'gravar', 'reclassificar']);

/**
 * Separa a linha de comando em subcomando, argumentos posicionais e opções.
 * @param {string[]} argv Argumentos sem `node` e sem o nome do script.
 * @returns {{subcomando: string|null, posicionais: string[], opcoes: Record<string, string|true>}}
 *   Subcomando (1º argumento), posicionais restantes e opções `--nome [valor]`.
 */
export function lerArgumentos(argv) {
  const opcoes = {};
  const posicionais = [];
  for (let i = 0; i < argv.length; i += 1) {
    const argumento = argv[i];
    if (!argumento.startsWith('--')) {
      posicionais.push(argumento);
      continue;
    }
    const nome = argumento.slice(2);
    const ehBooleana = OPCOES_BOOLEANAS.has(nome) || i + 1 >= argv.length;
    opcoes[nome] = ehBooleana ? true : argv[++i];
  }
  const [subcomando = null, ...restantes] = posicionais;
  return { subcomando, posicionais: restantes, opcoes };
}

/**
 * Lê uma opção de texto.
 * @param {Record<string, string|true>} opcoes Opções lidas.
 * @param {string} nome Nome da opção (sem `--`).
 * @param {string} [padrao] Valor quando a opção falta.
 * @returns {string|undefined} Texto da opção ou o padrão.
 */
export function lerTexto(opcoes, nome, padrao) {
  const valor = opcoes[nome];
  return typeof valor === 'string' ? valor : padrao;
}

/**
 * Lê uma opção com lista separada por vírgula.
 * @param {Record<string, string|true>} opcoes Opções lidas.
 * @param {string} nome Nome da opção.
 * @returns {string[]|undefined} Itens sem espaços, ou undefined se a opção faltar.
 */
export function lerLista(opcoes, nome) {
  const texto = lerTexto(opcoes, nome);
  if (texto === undefined) return undefined;
  return texto.split(',').map((item) => item.trim()).filter(Boolean);
}
