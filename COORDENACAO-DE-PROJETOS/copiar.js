/**
 * Realce de sintaxe dos prompts base e botão "Copiar".
 * Cada página de sistema carrega este arquivo com defer.
 */

const SELETOR_PROMPT = ".projeto__prompt";
const SELETOR_BOTAO = "[data-copiar]";
const TEMPO_FEEDBACK_MS = 2000;
const TEXTO_COPIAR = "Copiar";
const TEXTO_COPIADO = "Copiado ✓";
const TEXTO_ERRO = "Falhou";
const MENSAGEM_ERRO_CARREGAR =
  "Não foi possível carregar o PROMPT_BASE.md. " +
  "Abra a página por um servidor local (ex.: Live Server).";

const REGRAS_LINHA = [
  { teste: /^# /, classe: "pt-titulo" },
  { teste: /^\{/, classe: "pt-json" },
];

/**
 * Escapa caracteres especiais de HTML.
 * @param {string} texto - Texto bruto.
 * @returns {string} Texto seguro para innerHTML.
 */
function escaparHtml(texto) {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Aplica realces inline (variáveis, negrito, citações, alertas) em uma linha escapada.
 * @param {string} linha - Linha já escapada.
 * @returns {string} Linha com spans de realce.
 */
function realcarTrechos(linha) {
  // As citações vêm primeiro: os spans seguintes também usam aspas nos atributos.
  return linha
    .replace(/"([^"\n]{2,})"/g, '<span class="pt-citacao">"$1"</span>')
    .replace(/\[([^\]\n]+)\]/g, '<span class="pt-var">[$1]</span>')
    .replace(/\*\*([^*\n]+)\*\*/g, '<span class="pt-forte">$1</span>')
    .replace(/\b(NUNCA|NÃO|Nunca|Não|proibido|PROIBIDO)\b/g, '<span class="pt-alerta">$1</span>');
}

/**
 * Realça o início de itens de lista e o rótulo antes de dois-pontos.
 * @param {string} linha - Linha escapada.
 * @returns {string} Linha com marcador e rótulo coloridos.
 */
function realcarItem(linha) {
  const item = linha.match(/^(\s*)(-|•|\d+[.)]|>)\s+(.*)$/);
  if (!item) return realcarTrechos(linha);

  const [, recuo, marcador, resto] = item;
  const rotulo = resto.match(/^([^:\n]{2,45}):(\s.*|$)/);
  const corpo = rotulo
    ? `<span class="pt-rotulo">${rotulo[1]}:</span>${realcarTrechos(rotulo[2])}`
    : realcarTrechos(resto);
  return `${recuo}<span class="pt-marcador">${marcador}</span> ${corpo}`;
}

/**
 * Converte uma linha bruta em HTML realçado.
 * @param {string} bruta - Linha original do prompt.
 * @returns {string} HTML da linha.
 */
function realcarLinha(bruta) {
  const linha = escaparHtml(bruta);
  const regra = REGRAS_LINHA.find((r) => r.teste.test(bruta));
  if (regra) return `<span class="${regra.classe}">${linha}</span>`;
  return realcarItem(linha);
}

/**
 * Copia texto para a área de transferência, com alternativa para navegadores antigos.
 * @param {string} texto - Texto a copiar.
 * @returns {Promise<boolean>} true se copiou.
 */
async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (erro) {
    const area = document.createElement("textarea");
    area.value = texto;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const copiou = document.execCommand("copy");
    area.remove();
    return copiou;
  }
}

/**
 * Mostra o resultado da cópia no botão e volta ao texto original.
 * @param {HTMLButtonElement} botao - Botão clicado.
 * @param {boolean} deuCerto - Resultado da cópia.
 */
function mostrarFeedback(botao, deuCerto) {
  botao.textContent = deuCerto ? TEXTO_COPIADO : TEXTO_ERRO;
  botao.classList.toggle("botao-copiar--ok", deuCerto);
  setTimeout(() => {
    botao.textContent = TEXTO_COPIAR;
    botao.classList.remove("botao-copiar--ok");
  }, TEMPO_FEEDBACK_MS);
}

/**
 * Padroniza as quebras de linha do texto para "\n".
 * @param {string} texto - Texto com quebras "\r\n" ou "\n".
 * @returns {string} Texto somente com "\n".
 */
function normalizarQuebras(texto) {
  return texto.replace(/\r\n/g, "\n");
}

/**
 * Obtém o texto do prompt do arquivo indicado em data-fonte.
 * Sem data-fonte, devolve o texto já presente no elemento.
 * @param {HTMLElement} elemento - Bloco que exibe o prompt.
 * @returns {Promise<string>} Texto bruto do prompt.
 * @throws {Error} Se o arquivo não puder ser carregado.
 */
async function carregarPrompt(elemento) {
  const arquivo = elemento.dataset.fonte;
  if (!arquivo) return elemento.textContent;

  const resposta = await fetch(arquivo);
  if (!resposta.ok) {
    throw new Error(`Falha ao carregar ${arquivo}: HTTP ${resposta.status}`);
  }
  const texto = await resposta.text();
  return texto;
}

/**
 * Aplica o realce de sintaxe ao texto e grava o resultado no elemento.
 * @param {HTMLElement} elemento - Bloco que exibe o prompt.
 * @param {string} texto - Texto do prompt com quebras "\n".
 */
function exibirPromptRealcado(elemento, texto) {
  elemento.innerHTML = texto.split("\n").map(realcarLinha).join("\n");
}

/**
 * Liga o botão "Copiar" ao texto carregado, sem realce.
 * @param {string} textoBruto - Texto do prompt a copiar.
 */
function ligarBotaoCopiar(textoBruto) {
  const botao = document.querySelector(SELETOR_BOTAO);
  if (!botao) return;

  botao.addEventListener("click", async () => {
    mostrarFeedback(botao, await copiarTexto(textoBruto));
  });
}

/**
 * Inicializa o prompt: carrega PROMPT_BASE.md, aplica o realce e liga o botão de cópia.
 * Em falha de carregamento, mostra a mensagem de erro e não liga o botão.
 */
async function iniciar() {
  const prompt = document.querySelector(SELETOR_PROMPT);
  if (!prompt) return;

  let textoBruto;
  try {
    textoBruto = normalizarQuebras(await carregarPrompt(prompt));
  } catch (erro) {
    console.error(erro);
    prompt.textContent = MENSAGEM_ERRO_CARREGAR;
    return;
  }

  exibirPromptRealcado(prompt, textoBruto);
  ligarBotaoCopiar(textoBruto);
}

iniciar();
