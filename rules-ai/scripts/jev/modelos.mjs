// Matriz nível → ferramentas/modelos elegíveis e effort por nível (C21), espelho de
// regras/niveis-e-modelos.md. O Jev sugere só o nível: modelo e effort são sempre determinísticos
// e nada aqui reserva tarefa. Conferido contra o Markdown por testes/agregacao.mjs.

/** Níveis de tarefa, do mais leve ao mais restritivo. */
export const NIVEIS = Object.freeze({ LEVE: 'LEVE', MEDIO: 'MEDIO', PESADO: 'PESADO' });
export const ORDEM_NIVEIS = Object.freeze([NIVEIS.LEVE, NIVEIS.MEDIO, NIVEIS.PESADO]);

/** Efforts válidos, do menor ao maior. */
export const EFFORTS = Object.freeze(['low', 'medium', 'high']);

/** C21: o effort vem do nível final e nunca é reduzido por sugestão do modelo. */
export const EFFORT_POR_NIVEL = Object.freeze({
  [NIVEIS.LEVE]: 'low',
  [NIVEIS.MEDIO]: 'medium',
  [NIVEIS.PESADO]: 'high',
});

/** `linha` é a 1ª célula da tabela "Quem pega cada nível" (usada na conferência com o .md). */
const MODELOS_POR_NIVEL = Object.freeze({
  [NIVEIS.LEVE]: [
    { linha: 'Claude Code', rotulo: 'Claude Code (Haiku 5.5)' },
    { linha: 'Gemini CLI', rotulo: 'Gemini CLI (Flash)' },
    { linha: 'Antigravity', rotulo: 'Antigravity (Gemini Flash)' },
    { linha: 'Grok', rotulo: 'Grok (rápido)' },
    { linha: 'DeepSeek', rotulo: 'DeepSeek (V4.1 Flash)' },
    { linha: 'OpenCode', rotulo: 'OpenCode (deepseek-flash)' },
    { linha: 'Codex / Cursor', rotulo: 'Codex' },
    { linha: 'Codex / Cursor', rotulo: 'Cursor' },
    { linha: 'Qoder', rotulo: 'Qoder' },
    { linha: 'Devin / Copilot', rotulo: 'Devin' },
    { linha: 'Devin / Copilot', rotulo: 'Copilot' },
  ],
  [NIVEIS.MEDIO]: [
    { linha: 'Claude Code', rotulo: 'Claude Code (Sonnet)' },
    { linha: 'Gemini CLI', rotulo: 'Gemini CLI (Pro)' },
    { linha: 'Grok', rotulo: 'Grok (principal)' },
    { linha: 'DeepSeek', rotulo: 'DeepSeek (raciocínio)' },
    { linha: 'OpenCode', rotulo: 'OpenCode (deepseek-flash com thinking)' },
    { linha: 'Codex / Cursor', rotulo: 'Codex' },
    { linha: 'Codex / Cursor', rotulo: 'Cursor' },
    { linha: 'Qoder', rotulo: 'Qoder' },
    { linha: 'Devin / Copilot', rotulo: 'Devin' },
    { linha: 'Devin / Copilot', rotulo: 'Copilot' },
  ],
  [NIVEIS.PESADO]: [
    { linha: 'Claude Code', rotulo: 'Claude Code (Opus 5.5+ ou Fable)' },
    { linha: 'DeepSeek', rotulo: 'DeepSeek' },
    { linha: 'OpenCode', rotulo: 'OpenCode (deepseek-v4-pro)' },
  ],
});

/**
 * Diz se o valor é um dos três níveis.
 * @param {unknown} valor Valor a conferir.
 * @returns {boolean} true para LEVE, MEDIO ou PESADO.
 */
export function ehNivelValido(valor) {
  return ORDEM_NIVEIS.includes(valor);
}

/**
 * Devolve o mais restritivo entre dois níveis (PESADO > MEDIO > LEVE); valor inválido é ignorado.
 * @param {string|null} nivelA Primeiro nível (ou null).
 * @param {string|null} nivelB Segundo nível (ou null).
 * @returns {string|null} O nível mais restritivo, ou null se nenhum for válido.
 */
export function maisRestritivo(nivelA, nivelB) {
  const validos = [nivelA, nivelB].filter(ehNivelValido);
  if (validos.length === 0) return null;
  return validos.reduce((maior, atual) => (
    ORDEM_NIVEIS.indexOf(atual) > ORDEM_NIVEIS.indexOf(maior) ? atual : maior
  ));
}

/**
 * Deriva o effort da C21 pelo nível final.
 * @param {string|null} nivel Nível final.
 * @returns {string|null} `low`, `medium` ou `high`; null para nível inválido.
 */
export function derivarEffort(nivel) {
  return EFFORT_POR_NIVEL[nivel] ?? null;
}

/**
 * Lista os modelos elegíveis do nível, pela matriz de niveis-e-modelos.md (não reserva nenhum).
 * @param {string|null} nivel Nível final.
 * @returns {string[]} Rótulos das ferramentas/modelos; vazio para nível inválido.
 */
export function listarModelosElegiveis(nivel) {
  return (MODELOS_POR_NIVEL[nivel] ?? []).map((entrada) => entrada.rotulo);
}

/**
 * Lista as linhas da tabela (1ª célula) com ao menos um modelo elegível no nível.
 * @param {string} nivel Nível.
 * @returns {string[]} Linhas únicas da matriz.
 */
export function listarLinhasElegiveis(nivel) {
  return [...new Set((MODELOS_POR_NIVEL[nivel] ?? []).map((entrada) => entrada.linha))];
}
