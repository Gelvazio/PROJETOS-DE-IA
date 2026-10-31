// Inicialização: troca de abas (lembrada na URL com #regras / #tasks), modal e leitura dos `.md`
// (regras e quadro) ao abrir a página.

const ABA_PADRAO = "regras";
const ABAS = ["regras", "tasks"];
const TEXTO_CARREGANDO = "Lendo as regras e o quadro…";
const TEXTO_ERRO = "Não foi possível ler os arquivos. Confira a internet (a página lê o GitHub) " +
  "ou abra por um servidor na pasta do repositório. Detalhe: ";
const FORMATO_HORA = { dateStyle: "short", timeStyle: "medium" };

/**
 * Mostra a aba pedida e marca o botão correspondente.
 * @param {string} aba - "regras" ou "tasks".
 */
function mostrarAba(aba) {
  document.querySelectorAll("[data-aba]").forEach((botao) => {
    const ativa = botao.dataset.aba === aba;
    botao.classList.toggle("abas__botao--ativa", ativa);
    botao.setAttribute("aria-selected", String(ativa));
  });
  document.getElementById("painel-regras").hidden = aba !== "regras";
  document.getElementById("painel-tasks").hidden = aba !== "tasks";
}

/**
 * Liga os botões das abas e abre a aba indicada no endereço (#tasks), se houver.
 */
function iniciarAbas() {
  document.querySelectorAll("[data-aba]").forEach((botao) => {
    botao.addEventListener("click", () => {
      history.replaceState(null, "", "#" + botao.dataset.aba);
      mostrarAba(botao.dataset.aba);
    });
  });
  const abaDoEndereco = location.hash.replace("#", "");
  mostrarAba(ABAS.includes(abaDoEndereco) ? abaDoEndereco : ABA_PADRAO);
}

/**
 * Liga o fechamento do modal: botão ✕, clique fora da caixa e tecla Esc (nativa do dialog).
 */
function iniciarModal() {
  const modal = document.getElementById("modal");
  document.getElementById("modal-fechar").addEventListener("click", () => modal.close());
  modal.addEventListener("click", (evento) => {
    if (evento.target === modal) modal.close();
  });
}

/**
 * Mostra (ou esconde, com texto vazio) o aviso de carregamento ou de erro.
 * @param {string} texto - Mensagem.
 * @param {boolean} [ehErro] - Se é mensagem de erro.
 */
function mostrarAviso(texto, ehErro = false) {
  const aviso = document.getElementById("aviso-carregamento");
  aviso.textContent = texto;
  aviso.hidden = !texto;
  aviso.classList.toggle("aviso--erro", ehErro);
}

/**
 * Lê regras e quadro e preenche DADOS (funções de `leitor-regras.js` e `leitor-tarefas.js`).
 * @returns {Promise<void>}
 * @throws {Error} Se algum arquivo obrigatório não puder ser lido.
 */
async function carregarDados() {
  const [regras, tarefas] = await Promise.all([lerRegras(), lerTarefas()]);
  DADOS.regras = regras;
  DADOS.tasks = tarefas;
  DADOS.fonte = ultimaFonteUsada();
  DADOS.carregadoEm = new Date().toLocaleString("pt-BR", FORMATO_HORA);
}

/**
 * Abre a página: abas e modal na hora; regras e tarefas depois da leitura dos arquivos.
 * @returns {Promise<void>}
 */
async function iniciarVisualizador() {
  iniciarAbas();
  iniciarModal();
  mostrarAviso(TEXTO_CARREGANDO);
  try {
    await carregarDados();
  } catch (erro) {
    mostrarAviso(TEXTO_ERRO + erro.message, true);
    return;
  }
  mostrarAviso("");
  document.getElementById("fonte-dados").textContent = DADOS.fonte;
  document.getElementById("data-carregamento").textContent = DADOS.carregadoEm;
  iniciarAbaRegras();
  iniciarAbaTasks();
}

iniciarVisualizador();
