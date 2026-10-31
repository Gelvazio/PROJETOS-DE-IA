// Aba TASKS: tarefas abertas (tasks/STATUS.md) e concluídas (tasks/task_complete.md), com a etapa
// de cada uma; frentes ativas (coluna "Em uso por") e itens 👀 das etapas.

const TEXTO_SEM_VALOR = "—";

/**
 * Monta o Markdown completo de uma tarefa para o modal.
 * @param {Object} tarefa - Linha da tabela de tarefas com as etapas e o próximo passo.
 * @returns {string} Markdown do detalhamento.
 */
function montarMarkdownTarefa(tarefa) {
  const resumo = [
    "| Campo | Valor |", "|---|---|",
    `| Status | ${tarefa["Status"] || TEXTO_SEM_VALOR} |`,
    `| Prioridade | ${tarefa["Prioridade"] || TEXTO_SEM_VALOR} |`,
    `| Depende de | ${tarefa["Depende de"] || TEXTO_SEM_VALOR} |`,
    `| Próximo passo (da etapa) | ${tarefa.proximo || TEXTO_SEM_VALOR} |`,
    `| Em uso por | ${tarefa["Em uso por"] || TEXTO_SEM_VALOR} |`,
  ].join("\n");
  const partes = ["## Situação no quadro", resumo];
  tarefa.etapas.forEach((etapa) => partes.push("---", etapa.texto));
  if (!tarefa.etapas.length) partes.push("*Sem etapa ligada a esta tarefa.*");
  return partes.join("\n\n");
}

/**
 * Abre o modal da tarefa.
 * @param {Object} tarefa - Tarefa do quadro.
 */
function abrirTarefa(tarefa) {
  const classe = "situacao--" + paraClasse(tarefa.situacao);
  const etiquetasEtapas = tarefa.etapas
    .map((etapa) => criarEtiqueta(etapa.arquivo.replace(/\.md$/, "")));
  abrirModal({
    titulo: `${tarefa["Tarefa"]} — ${tarefa["Título"]}`,
    etiquetas: [criarEtiqueta(tarefa.situacao, classe), ...etiquetasEtapas],
    markdown: montarMarkdownTarefa(tarefa),
  });
}

/**
 * Cria o cartão de uma tarefa.
 * @param {Object} tarefa - Tarefa do quadro.
 * @returns {HTMLButtonElement} Cartão.
 */
function criarCartaoTarefa(tarefa) {
  const classe = "situacao--" + paraClasse(tarefa.situacao);
  const etiquetas = [criarEtiqueta(tarefa["Tarefa"]), criarEtiqueta(tarefa.situacao, classe)];
  const emUso = tarefa["Em uso por"] || "";
  const estaReservada = emUso && !emUso.startsWith(TEXTO_SEM_VALOR);
  if (estaReservada) etiquetas.push(criarEtiqueta("🔒 " + emUso.split(" (desde")[0]));
  return criarCartao({
    titulo: tarefa["Título"].replace(/\*\*/g, ""),
    texto: resumirTexto(tarefa["Status"] + " · Próximo: " + (tarefa.proximo || TEXTO_SEM_VALOR)),
    classe,
    etiquetas,
  }, () => abrirTarefa(tarefa));
}

/**
 * Desenha os contadores por situação.
 */
function desenharResumoTarefas() {
  const itens = ORDEM_SITUACOES.map((situacao) => {
    const total = DADOS.tasks.tarefas.filter((tarefa) => tarefa.situacao === situacao).length;
    const item = criarElemento("div", "resumo__item situacao--" + paraClasse(situacao));
    item.append(criarElemento("span", "resumo__numero", String(total)),
      criarElemento("span", "resumo__rotulo", situacao));
    return item;
  });
  document.getElementById("resumo-tasks").replaceChildren(...itens);
}

/**
 * Redesenha a lista de tarefas conforme a situação e a busca.
 */
function desenharTarefas() {
  const visiveis = DADOS.tasks.tarefas.filter((tarefa) => {
    const situacaoCombina = estadoFiltros.situacao === TODOS ||
      tarefa.situacao === estadoFiltros.situacao;
    return situacaoCombina && combinaBusca(tarefa, estadoFiltros.buscaTasks);
  });
  const ordenadas = [...visiveis].sort((a, b) =>
    ORDEM_SITUACOES.indexOf(a.situacao) - ORDEM_SITUACOES.indexOf(b.situacao));
  document.getElementById("contagem-tasks").textContent =
    `${visiveis.length} de ${DADOS.tasks.tarefas.length} tarefas`;
  const destino = document.getElementById("lista-tasks");
  if (!ordenadas.length) {
    destino.replaceChildren(criarElemento("p", "vazio", "Nenhuma tarefa encontrada."));
    return;
  }
  destino.replaceChildren(...ordenadas.map(criarCartaoTarefa));
}

/**
 * Cria o cartão de uma frente ativa (nome em "Em uso por"), que abre o detalhe da frente.
 * @param {{Frente: string, Tarefa: string, "Em uso desde": string, proximo: string}} frente -
 *   Frente e a subtarefa reservada por ela.
 * @returns {HTMLButtonElement} Cartão.
 */
function criarCartaoFrente(frente) {
  const { proximo, ...colunas } = frente;
  const campos = [...Object.entries(colunas), ["Próximo passo (da etapa)", proximo]];
  const markdown = campos
    .map(([campo, valor]) => `### ${campo}\n\n${valor || TEXTO_SEM_VALOR}`).join("\n\n");
  const etiquetas = [criarEtiqueta(frente.Tarefa), criarEtiqueta(frente["Em uso desde"])];
  return criarCartao({
    titulo: frente.Frente,
    texto: resumirTexto(proximo || ""),
    classe: "situacao--em-andamento",
    etiquetas,
  }, () => abrirModal({ titulo: frente.Frente, etiquetas: [], markdown }));
}

/**
 * Desenha as frentes ativas como cartões.
 */
function desenharFrentes() {
  const cartoes = DADOS.tasks.frentes.map(criarCartaoFrente);
  const vazio = [criarElemento("p", "vazio", "Nenhuma frente com subtarefa reservada.")];
  document.getElementById("lista-frentes").replaceChildren(...(cartoes.length ? cartoes : vazio));
}

/**
 * Desenha a tabela "Aguardando o usuário" (itens 👀 das etapas).
 */
function desenharAguardando() {
  const linhas = DADOS.tasks.aguardando;
  const destino = document.getElementById("lista-aguardando");
  if (!linhas.length) {
    destino.replaceChildren(criarElemento("p", "vazio", "Nada aguardando o usuário."));
    return;
  }
  const colunas = Object.keys(linhas[0]);
  const cabecalho = ["| " + colunas.join(" | ") + " |",
    "|" + colunas.map(() => "---").join("|") + "|"];
  const corpo = linhas
    .map((linha) => "| " + colunas.map((coluna) => linha[coluna] || "").join(" | ") + " |");
  destino.innerHTML = markdownParaHtml([...cabecalho, ...corpo].join("\n"));
}

/**
 * Prepara a aba TASKS.
 */
function iniciarAbaTasks() {
  criarChips({ idDestino: "filtro-situacoes", opcoes: ORDEM_SITUACOES, chave: "situacao" },
    desenharTarefas);
  document.getElementById("busca-tasks").addEventListener("input", (evento) => {
    estadoFiltros.buscaTasks = evento.target.value.trim();
    desenharTarefas();
  });
  desenharResumoTarefas();
  desenharTarefas();
  desenharFrentes();
  desenharAguardando();
}
