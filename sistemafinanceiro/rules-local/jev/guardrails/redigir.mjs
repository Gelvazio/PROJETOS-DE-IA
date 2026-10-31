// Máscara de segredo e dado pessoal ANTES de qualquer envio ao Jev ou gravação em log (INV-2).
// Chaves (sk-, tsk_, Bearer, ghp_/github_pat_, JWT, AKIA, `senha=`/`*_API_KEY=`), CPF, RG,
// telefone e e-mail viram marcas neutras ([CHAVE], [CPF]…). Os achados guardam só tipo e regra:
// o valor original nunca sai desta função. A máscara é idempotente (mascarar de novo não muda).

const MARCAS = Object.freeze({
  chave: '[CHAVE]',
  cpf: '[CPF]',
  rg: '[RG]',
  telefone: '[TELEFONE]',
  email: '[EMAIL]',
});
const TAMANHO_CPF = 11;
const PESO_INICIAL_PRIMEIRO_DIGITO = 10;
const PESO_INICIAL_SEGUNDO_DIGITO = 11;
const MODULO_CPF = 11;
/** E-mails técnicos que não são dado pessoal (atribuição de commit, exemplos). */
const PADRAO_EMAIL_PERMITIDO = new RegExp(
  '^(?:no-?reply|nao-responda)@'
    + '|@(?:users\\.noreply\\.github\\.com|example\\.(?:com|org|net)|exemplo\\.com(?:\\.br)?)$',
  'i',
);
/**
 * `senha=...`, `TYPESAFE_API_KEY: ...`: o valor precisa ter dígito ou símbolo (evita prosa) e não
 * pode ser só número (evita `JEV_MAX_TOKENS=1000000`, `tokens_entrada: 317`).
 */
const PADRAO_ATRIBUICAO = new RegExp(
  '\\b([A-Za-z0-9_-]*(?:api[_-]?key|secret|senha|password|passwd|token)[A-Za-z0-9_-]*)'
    + '(\\s*[:=]\\s*)([\'"]?)(?!\\[)(?![0-9.]+\\b)(?=[^\\s\'"]*[0-9_!@#$%^&*-])[^\\s\'"]{6,}\\3',
  'gi',
);

/**
 * Confere os dígitos verificadores de um CPF (só números).
 * @param {string} numeros 11 dígitos.
 * @returns {boolean} true se os dois dígitos verificadores conferem.
 */
export function cpfValido(numeros) {
  const digitos = String(numeros).replace(/\D/g, '');
  const tamanhoErrado = digitos.length !== TAMANHO_CPF;
  if (tamanhoErrado || /^(\d)\1+$/.test(digitos)) return false;
  return [PESO_INICIAL_PRIMEIRO_DIGITO, PESO_INICIAL_SEGUNDO_DIGITO].every((pesoInicial) => {
    const quantidade = pesoInicial - 1;
    let soma = 0;
    for (let i = 0; i < quantidade; i += 1) soma += Number(digitos[i]) * (pesoInicial - i);
    const resto = (soma * 10) % MODULO_CPF;
    return (resto === 10 ? 0 : resto) === Number(digitos[quantidade]);
  });
}

/**
 * Diz se o e-mail é técnico (não pessoal) e pode ficar sem máscara.
 * @param {string} email E-mail achado.
 * @returns {boolean} true para noreply, exemplos e afins.
 */
function emailPermitido(email) {
  return PADRAO_EMAIL_PERMITIDO.test(email);
}

/**
 * Regras na ordem de aplicação: chaves primeiro (mais específicas), depois documentos e contato.
 * `substituir` recebe os grupos do regex; `aceitar` filtra o achado; `manter` deixa sem máscara.
 */
const REGRAS = [
  {
    tipo: 'chave', regra: 'jwt',
    padrao: /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}/g,
  },
  {
    tipo: 'chave', regra: 'bearer',
    padrao: /\b(Bearer)\s+(?!\[)[A-Za-z0-9._~+/=-]{8,}/gi,
    substituir: (palavra) => `${palavra} ${MARCAS.chave}`,
  },
  { tipo: 'chave', regra: 'sk', padrao: /\bsk-[A-Za-z0-9_-]{16,}/g },
  { tipo: 'chave', regra: 'tsk', padrao: /\btsk_[A-Za-z0-9_-]{8,}/g },
  {
    tipo: 'chave', regra: 'github',
    padrao: /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/g,
  },
  { tipo: 'chave', regra: 'aws', padrao: /\bAKIA[0-9A-Z]{16}\b/g },
  {
    tipo: 'chave', regra: 'atribuicao',
    padrao: PADRAO_ATRIBUICAO,
    substituir: (nome, separador, aspas) => `${nome}${separador}${aspas}${MARCAS.chave}${aspas}`,
  },
  { tipo: 'cpf', regra: 'cpf-formatado', padrao: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g },
  { tipo: 'cpf', regra: 'cpf-numerico', padrao: /\b\d{11}\b/g, aceitar: cpfValido },
  { tipo: 'rg', regra: 'rg-formatado', padrao: /\b\d{1,2}\.\d{3}\.\d{3}-?[\dXx]\b/g },
  {
    tipo: 'rg', regra: 'rg-rotulado',
    padrao: /\b(RG)(\s*(?:n[º°o.]*)?\s*[:-]?\s*)(?!\[)([\dXx][\dXx.-]{4,}[\dXx])/g,
    substituir: (rotulo, separador) => `${rotulo}${separador}${MARCAS.rg}`,
  },
  {
    tipo: 'telefone', regra: 'telefone',
    padrao: /(?:\+55\s?)?(?:\(\d{2}\)|\b\d{2})[\s-]?9?\d{4}[-\s]\d{4}\b/g,
  },
  {
    tipo: 'email', regra: 'email',
    padrao: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, manter: emailPermitido,
  },
];

/**
 * Aplica uma regra ao texto, anotando cada achado (sem o valor).
 * @param {string} texto Texto atual.
 * @param {object} regra Regra de {@link REGRAS}.
 * @param {{tipo: string, regra: string}[]} achados Lista de achados (alterada).
 * @returns {string} Texto com a regra aplicada.
 */
function aplicarRegra(texto, regra, achados) {
  return texto.replace(regra.padrao, (trecho, ...resto) => {
    const ehFalsoPositivo = regra.aceitar && !regra.aceitar(trecho);
    if (ehFalsoPositivo || regra.manter?.(trecho)) return trecho;
    achados.push({ tipo: regra.tipo, regra: regra.regra });
    if (!regra.substituir) return MARCAS[regra.tipo];
    const grupos = resto.slice(0, -2).map((grupo) => grupo ?? '');
    return regra.substituir(...grupos);
  });
}

/**
 * Mascara chaves, CPF, RG, telefone e e-mail de um texto.
 * @param {string} texto Texto qualquer (descrição, diff, comando, mensagem).
 * @returns {{texto: string, achados: {tipo: string, regra: string}[]}} Texto mascarado e
 *   um achado por ocorrência (tipo: chave, cpf, rg, telefone ou email), sem o valor.
 */
export function redigirTexto(texto) {
  const achados = [];
  const mascarado = REGRAS.reduce(
    (atual, regra) => aplicarRegra(atual, regra, achados), String(texto ?? ''),
  );
  return { texto: mascarado, achados };
}

/**
 * Conta os achados por tipo (para log e decisão, sem valores).
 * @param {{tipo: string}[]} achados Achados de {@link redigirTexto}.
 * @returns {Record<string, number>} Ex.: `{ chave: 1, email: 2 }`.
 */
export function resumirAchados(achados) {
  const resumo = {};
  for (const achado of achados ?? []) resumo[achado.tipo] = (resumo[achado.tipo] ?? 0) + 1;
  return resumo;
}
