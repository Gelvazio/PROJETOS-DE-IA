/** Versão separada em partes numéricas e etiqueta de pré-lançamento (semver 2.0). */
export interface VersaoAnalisada {
  principal: number;
  secundaria: number;
  correcao: number;
  preLancamento: string[];
}

const PADRAO_VERSAO = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;
const PADRAO_NUMERICO = /^\d+$/;

/**
 * Lê um texto de versão no formato `1.2.3`, `v1.2.3` ou `1.2.3-beta.1`.
 * Metadados de build (`+abc`) são ignorados na comparação, como manda o semver.
 * @param texto - Versão em texto.
 * @returns Versão analisada, ou null se o formato for inválido.
 */
export function analisarVersao(texto: string): VersaoAnalisada | null {
  const partes = PADRAO_VERSAO.exec(texto.trim());
  if (!partes) return null;

  return {
    principal: Number(partes[1]),
    secundaria: Number(partes[2]),
    correcao: Number(partes[3]),
    preLancamento: partes[4] ? partes[4].split('.') : [],
  };
}

/**
 * Compara dois identificadores de pré-lançamento: número < texto; números pelo valor.
 * @param a - Identificador da esquerda.
 * @param b - Identificador da direita.
 * @returns Negativo, zero ou positivo.
 */
function compararIdentificador(a: string, b: string): number {
  const aEhNumero = PADRAO_NUMERICO.test(a);
  const bEhNumero = PADRAO_NUMERICO.test(b);
  if (aEhNumero && bEhNumero) return Number(a) - Number(b);
  if (aEhNumero) return -1;
  if (bEhNumero) return 1;

  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Compara as etiquetas de pré-lançamento; versão sem etiqueta é maior que com etiqueta.
 * @param a - Etiqueta da esquerda.
 * @param b - Etiqueta da direita.
 * @returns Negativo, zero ou positivo.
 */
function compararPreLancamento(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  if (a.length === 0) return 1;
  if (b.length === 0) return -1;

  const tamanho = Math.min(a.length, b.length);
  for (let i = 0; i < tamanho; i += 1) {
    const diferenca = compararIdentificador(a[i], b[i]);
    if (diferenca !== 0) return diferenca;
  }
  return a.length - b.length;
}

/**
 * Compara duas versões semver.
 * @param a - Versão da esquerda (texto).
 * @param b - Versão da direita (texto).
 * @returns Número negativo se a < b, zero se iguais, positivo se a > b.
 * @throws {Error} Se alguma das versões tiver formato inválido.
 */
export function compararVersoes(a: string, b: string): number {
  const esquerda = analisarVersao(a);
  const direita = analisarVersao(b);
  if (!esquerda || !direita) {
    throw new Error(`Versão inválida: "${esquerda ? b : a}"`);
  }

  return (
    esquerda.principal - direita.principal ||
    esquerda.secundaria - direita.secundaria ||
    esquerda.correcao - direita.correcao ||
    compararPreLancamento(esquerda.preLancamento, direita.preLancamento)
  );
}

/**
 * Diz se a versão remota é mais nova que a instalada.
 * @param instalada - Versão instalada.
 * @param remota - Versão publicada no `latest.json`.
 * @returns true se `remota` > `instalada`.
 * @throws {Error} Se alguma das versões tiver formato inválido.
 */
export function existeVersaoMaisNova(instalada: string, remota: string): boolean {
  return compararVersoes(remota, instalada) > 0;
}
