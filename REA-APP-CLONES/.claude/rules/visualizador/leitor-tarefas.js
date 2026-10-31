// Leitura do quadro (porta do leitor_tarefas.py do aulasenai, no modelo de .claude/rules/tasks/):
// tarefas abertas em "📌 Tarefas" do tasks/STATUS.md e concluídas em "✅ Concluídas" do
// tasks/task_complete.md; descrição e próximo passo vêm da seção da subtarefa na etapa;
// frentes
// ativas = nomes na coluna "Em uso por"; "Aguardando o usuário" = linhas e itens 👀.

const PASTA_TASKS = "tasks/";
const ARQUIVO_STATUS = "STATUS.md";
const ARQUIVO_CONCLUIDAS = "task_complete.md";
const MARCA_TAREFAS = "📌 Tarefas";
const MARCA_CONCLUIDAS = "✅ Concluídas";
const MARCA_ETAPAS = "🗂️ Etapas";
const COLUNA_ETAPA = "Etapa";
const COLUNA_ARQUIVO_ETAPA = "Arquivo";
const COLUNA_EM_USO = "Em uso por";
const MARCA_DESDE = " (desde ";
const MARCA_LIVRE = "—";
const MARCA_TRAVA = "🔒";
const EMOJI_AGUARDANDO = "👀";
const MARCA_SUBSECAO = "### ";
const MARCA_SECAO_MARKDOWN = "## ";

const SITUACOES = [
  { situacao: "Concluída", emoji: "✅" },
  { situacao: "Em andamento", emoji: "🔄" },
  { situacao: "Aguardando", emoji: "👀" },
  { situacao: "Cancelada/Bloqueada", emoji: "⛔" },
  { situacao: "Pendente", emoji: "⬜" },
];
const SITUACAO_PADRAO = "Pendente";
const SITUACAO_AGUARDANDO = "Aguardando";

const PADRAO_LINK_ETAPA = /\]\(etapas\/([^)]+\.md)\)/g;
const PADRAO_PROXIMO = /^\*\*Próximo passo:\*\*\s*(.+)$/m;
const PADRAO_NUMERO_ETAPA = /^ETAPA-0*(\d+(?:-[0-9a-f]{8})?)-/;
const PADRAO_CODIGO_ITEM = /^\d{1,3}\.\d+[a-z]?$/;

/**
 * Devolve o conteúdo da seção `##` cujo título contém a marca.
 * @param {string} texto - Conteúdo do Markdown.
 * @param {string} marca - Trecho do título procurado (ex.: "📌 Tarefas").
 * @returns {string} Texto da seção (sem o título) ou "" se ela não existir.
 */
function lerSecao(texto, marca) {
  const partes = texto.split(/^## /m);
  const achada = partes.find((parte) => parte.split("\n", 1)[0].includes(marca));
  if (!achada || !achada.includes("\n")) return "";
  return achada.slice(achada.indexOf("\n") + 1);
}

/**
 * Separa as células de uma linha de tabela Markdown, respeitando `\|` e crases.
 * @param {string} linha - Linha começando e terminando com `|`.
 * @returns {string[]} Texto de cada célula.
 */
function dividirCelulas(linha) {
  const celulas = [];
  let atual = "";
  let dentroDeCrase = false;
  for (const caractere of linha.trim().replace(/^\||\|$/g, "")) {
    if (caractere === "`") dentroDeCrase = !dentroDeCrase;
    const ehSeparador = caractere === "|" && !dentroDeCrase && !atual.endsWith("\\");
    if (ehSeparador) {
      celulas.push(atual.trim());
      atual = "";
      continue;
    }
    atual += caractere;
  }
  celulas.push(atual.trim());
  return celulas;
}

/**
 * Converte a primeira tabela Markdown da seção em registros.
 * @param {string} secao - Texto que contém a tabela.
 * @returns {Object[]} Uma linha por registro, com as chaves do cabeçalho.
 */
function lerTabela(secao) {
  const linhas = secao.split(/\r?\n/).filter((linha) => linha.startsWith("|"));
  if (linhas.length < 2) return [];
  const cabecalho = dividirCelulas(linhas[0]);
  return linhas.slice(2).map((linha) => {
    const celulas = dividirCelulas(linha);
    return Object.fromEntries(cabecalho.map((coluna, i) => [coluna, celulas[i] || ""]));
  });
}

/**
 * Traduz o texto do status no grupo usado pelo filtro da página.
 * @param {string} status - Texto da coluna Status.
 * @returns {string} Nome do grupo (ex.: "Em andamento").
 */
function classificarSituacao(status) {
  const achada = SITUACOES.find((item) => status.includes(item.emoji));
  return achada ? achada.situacao : SITUACAO_PADRAO;
}

/**
 * Lista os arquivos de etapa apontados pelos links `[...](etapas/ARQUIVO.md)` de uma célula.
 * @param {string} celula - Texto da coluna Etapa.
 * @returns {string[]} Nomes dos arquivos.
 */
function listarLinksDeEtapa(celula) {
  return [...String(celula || "").matchAll(PADRAO_LINK_ETAPA)].map((achado) => achado[1]);
}

/**
 * Recorta da etapa a seção `### <código> — ...` de uma subtarefa.
 * @param {string} textoEtapa - Conteúdo da etapa.
 * @param {string} codigo - Código da tarefa (ex.: "TAREFA-1.2").
 * @returns {string} Texto da seção ou "" se a etapa não tiver seção para o código.
 */
function recortarSecaoDaTarefa(textoEtapa, codigo) {
  const linhas = textoEtapa.split(/\r?\n/);
  const titulo = `${MARCA_SUBSECAO}${codigo} `;
  const inicio = linhas.findIndex((linha) => linha.startsWith(titulo));
  if (inicio < 0) return "";
  const resto = linhas.slice(inicio + 1);
  const fimRelativo = resto.findIndex((linha) =>
    linha.startsWith(MARCA_SUBSECAO) || linha.startsWith(MARCA_SECAO_MARKDOWN));
  const fim = fimRelativo < 0 ? linhas.length : inicio + 1 + fimRelativo;
  return linhas.slice(inicio, fim).join("\n").trim();
}

/**
 * Lê cada etapa uma vez só, mesmo que várias tarefas apontem para ela.
 * @param {string[]} arquivos - Nomes dos arquivos de etapa.
 * @returns {Promise<Map<string, string>>} Texto de cada etapa ("" se não existir).
 */
async function lerEtapas(arquivos) {
  const distintos = [...new Set(arquivos)];
  const textos = await Promise.all(
    distintos.map((arquivo) => lerArquivoOpcional(`${PASTA_TASKS}etapas/${arquivo}`)));
  return new Map(distintos.map((arquivo, i) => [arquivo, textos[i].trim()]));
}

/**
 * Junta a linha do quadro com a seção dela na etapa e o próximo passo.
 * @param {Object} linha - Linha da tabela de tarefas.
 * @param {Map<string, string>} etapas - Texto de cada etapa.
 * @returns {Object} Tarefa com situacao, etapas ({arquivo, texto}) e proximo.
 */
function montarTarefa(linha, etapas) {
  const codigo = linha["Tarefa"] || "";
  const daTarefa = listarLinksDeEtapa(linha[COLUNA_ETAPA])
    .filter((arquivo) => etapas.get(arquivo))
    .map((arquivo) => {
      const textoEtapa = etapas.get(arquivo);
      const texto = recortarSecaoDaTarefa(textoEtapa, codigo) || textoEtapa;
      return { arquivo, texto };
    });
  const achouProximo = daTarefa.length ? daTarefa[0].texto.match(PADRAO_PROXIMO) : null;
  return {
    ...linha,
    situacao: classificarSituacao(linha["Status"] || ""),
    etapas: daTarefa,
    proximo: achouProximo ? achouProximo[1].trim() : "",
  };
}

/**
 * Monta as frentes ativas: quem aparece em "Em uso por" com `(desde ...)`.
 * @param {Object[]} tarefas - Tarefas abertas.
 * @returns {{Frente: string, Tarefa: string, "Em uso desde": string, proximo: string}[]} Frentes.
 */
function montarFrentes(tarefas) {
  return tarefas
    .filter((tarefa) => {
      const emUso = tarefa[COLUNA_EM_USO] || "";
      const estaLivreOuTravada = emUso.startsWith(MARCA_LIVRE) || emUso.startsWith(MARCA_TRAVA);
      return emUso.includes(MARCA_DESDE) && !estaLivreOuTravada;
    })
    .map((tarefa) => {
      const emUso = tarefa[COLUNA_EM_USO];
      const posicao = emUso.lastIndexOf(MARCA_DESDE);
      return {
        Frente: emUso.slice(0, posicao).trim(),
        Tarefa: tarefa["Tarefa"],
        "Em uso desde": emUso.slice(posicao + MARCA_DESDE.length).replace(/\)\s*$/, ""),
        proximo: tarefa.proximo,
      };
    });
}

/**
 * Lista os itens 👀 das tabelas de itens de uma etapa (modelo antigo, ex.: `| 001.7 | ... |`).
 * @param {string} arquivo - Nome do arquivo da etapa.
 * @param {string} texto - Conteúdo da etapa.
 * @returns {{Etapa: string, Item: string, "O que falta": string}[]} Itens aguardando.
 */
function lerItensAguardandoDaEtapa(arquivo, texto) {
  const numero = arquivo.match(PADRAO_NUMERO_ETAPA);
  const rotulo = numero ? numero[1] : arquivo.replace(/\.md$/, "");
  return texto.split(/\r?\n/)
    .filter((linha) => linha.startsWith("| "))
    .map(dividirCelulas)
    .filter((celulas) => {
      const ehItemAguardando = celulas.length >= 3 && PADRAO_CODIGO_ITEM.test(celulas[0]);
      return ehItemAguardando && celulas[2].includes(EMOJI_AGUARDANDO);
    })
    .map((celulas) => ({ Etapa: rotulo, Item: celulas[0], "O que falta": celulas[1] }));
}

/**
 * Junta o que espera o usuário: linhas 👀 do quadro e itens 👀 das etapas, da mais recente
 * para a mais antiga.
 * @param {Object[]} tarefas - Tarefas abertas.
 * @param {Map<string, string>} etapas - Texto de cada etapa.
 * @returns {{Etapa: string, Item: string, "O que falta": string}[]} Itens aguardando.
 */
function montarAguardando(tarefas, etapas) {
  const doQuadro = tarefas
    .filter((tarefa) => tarefa.situacao === SITUACAO_AGUARDANDO)
    .map((tarefa) => ({
      Etapa: tarefa.etapas.map((etapa) => etapa.arquivo.replace(/\.md$/, "")).join(", "),
      Item: tarefa["Tarefa"],
      "O que falta": tarefa["Título"] + (tarefa.proximo ? " — " + tarefa.proximo : ""),
    }));
  const dasEtapas = [...etapas]
    .sort(([primeiro], [segundo]) => segundo.localeCompare(primeiro))
    .flatMap(([arquivo, texto]) => lerItensAguardandoDaEtapa(arquivo, texto));
  return [...doQuadro, ...dasEtapas];
}

/**
 * Lê o quadro: tarefas abertas e concluídas, frentes ativas e o que aguarda o usuário.
 * @returns {Promise<{tarefas: Object[], frentes: Object[], aguardando: Object[]}>} Quadro.
 * @throws {Error} Se o tasks/STATUS.md não puder ser lido.
 */
async function lerTarefas() {
  const [textoStatus, textoConcluidas] = await Promise.all([
    lerArquivo(PASTA_TASKS + ARQUIVO_STATUS),
    lerArquivoOpcional(PASTA_TASKS + ARQUIVO_CONCLUIDAS),
  ]);
  const abertas = lerTabela(lerSecao(textoStatus, MARCA_TAREFAS));
  const concluidas = lerTabela(lerSecao(textoConcluidas, MARCA_CONCLUIDAS));
  const listadas = lerTabela(lerSecao(textoStatus, MARCA_ETAPAS))
    .flatMap((linha) => listarLinksDeEtapa(linha[COLUNA_ARQUIVO_ETAPA]));
  const ligadas = [...abertas, ...concluidas]
    .flatMap((linha) => listarLinksDeEtapa(linha[COLUNA_ETAPA]));
  const etapas = await lerEtapas([...listadas, ...ligadas]);
  const tarefasAbertas = abertas.map((linha) => montarTarefa(linha, etapas));
  const tarefasConcluidas = concluidas.map((linha) => montarTarefa(linha, etapas));
  return {
    tarefas: [...tarefasAbertas, ...tarefasConcluidas],
    frentes: montarFrentes(tarefasAbertas),
    aguardando: montarAguardando(tarefasAbertas, etapas),
  };
}
