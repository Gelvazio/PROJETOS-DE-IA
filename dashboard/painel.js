/**
 * Dashboard de projetos de C:\fontes.
 * Le o projetos.json (gerado por update-projects-status.py) e desenha indicadores,
 * filtros e um cartao por projeto. Todo texto vindo dos dados entra por textContent.
 */
(function () {
  "use strict";

  const ARQUIVO_DADOS = "projetos.json";
  const VARIAVEL_DADOS = "DADOS_PROJETOS";
  const UNIDADES_BYTES = ["B", "KB", "MB", "GB", "TB"];
  const BASE_BYTES = 1024;
  const FILTROS = [
    { id: "todos", rotulo: "Todos" },
    { id: "ativo", rotulo: "Ativos" },
    { id: "parado", rotulo: "Parados" },
    { id: "sem-git", rotulo: "Sem Git" },
    { id: "graphify", rotulo: "Com graphify" },
    { id: "alertas", rotulo: "Com alertas" },
  ];
  const ROTULO_SITUACAO = { ativo: "ativo", parado: "parado", "sem-git": "sem git" };
  const ORDENACOES = {
    nome: (a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }),
    tamanho: (a, b) => b.tamanho_bytes - a.tamanho_bytes,
    commit: (a, b) => dataDoCommit(b).localeCompare(dataDoCommit(a)),
  };
  const estado = { dados: null, filtro: "todos", busca: "", ordem: "nome" };

  /**
   * Cria um elemento com classe e texto opcionais.
   * @param {string} tag - Nome da tag.
   * @param {string} [classe] - Classe CSS.
   * @param {string} [texto] - Texto (inserido como textContent).
   * @returns {HTMLElement} Elemento criado.
   */
  function criarElemento(tag, classe, texto) {
    const elemento = document.createElement(tag);
    if (classe) elemento.className = classe;
    if (texto !== undefined && texto !== null) elemento.textContent = texto;
    return elemento;
  }

  /**
   * Formata uma quantidade de bytes de forma legivel.
   * @param {number} bytes - Tamanho em bytes.
   * @returns {string} Texto como "1,5 GB".
   */
  function formatarBytes(bytes) {
    let valor = bytes;
    let indice = 0;
    while (valor >= BASE_BYTES && indice < UNIDADES_BYTES.length - 1) {
      valor /= BASE_BYTES;
      indice += 1;
    }
    const casas = indice === 0 ? 0 : 1;
    return `${valor.toFixed(casas).replace(".", ",")} ${UNIDADES_BYTES[indice]}`;
  }

  /**
   * Converte uma data ISO (AAAA-MM-DD) para DD/MM/AAAA.
   * @param {string} dataIso - Data no formato ISO.
   * @returns {string} Data formatada, ou travessao se vazia.
   */
  function formatarData(dataIso) {
    if (!dataIso) return "—";
    const [ano, mes, dia] = dataIso.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  /**
   * Devolve a data do ultimo commit de um projeto (vazia se nao houver Git).
   * @param {object} projeto - Projeto do JSON.
   * @returns {string} Data ISO ou string vazia.
   */
  function dataDoCommit(projeto) {
    return projeto.git ? projeto.git.ultimo_commit.data : "";
  }

  /**
   * Carrega os dados do JSON; se a pagina abriu por file://, usa projetos.js.
   * @returns {Promise<object|null>} Dados da analise ou null se indisponiveis.
   */
  async function carregarDados() {
    try {
      const resposta = await fetch(ARQUIVO_DADOS, { cache: "no-store" });
      if (resposta.ok) return await resposta.json();
    } catch (erro) {
      /* file:// bloqueia fetch: segue para a copia em projetos.js */
    }
    return window[VARIAVEL_DADOS] || null;
  }

  /**
   * Diz se um projeto passa pelo filtro e pela busca atuais.
   * @param {object} projeto - Projeto do JSON.
   * @returns {boolean} True se deve aparecer.
   */
  function passaNoFiltro(projeto) {
    const tabelaFiltros = {
      todos: true,
      ativo: projeto.situacao === "ativo",
      parado: projeto.situacao === "parado",
      "sem-git": projeto.situacao === "sem-git",
      graphify: Boolean(projeto.graphify),
      alertas: projeto.alertas.length > 0,
    };
    if (!tabelaFiltros[estado.filtro]) return false;
    const alvo = `${projeto.nome} ${projeto.descricao} ${projeto.stack.join(" ")}`.toLowerCase();
    return alvo.includes(estado.busca);
  }

  /**
   * Monta um indicador (valor grande + rotulo).
   * @param {string} valor - Valor exibido.
   * @param {string} rotulo - Descricao do indicador.
   * @param {boolean} [alerta] - Destaca em vermelho.
   * @returns {HTMLElement} Elemento do indicador.
   */
  function criarIndicador(valor, rotulo, alerta) {
    const caixa = criarElemento("div", alerta ? "indicador indicador--alerta" : "indicador");
    caixa.append(criarElemento("span", "indicador__valor", valor));
    caixa.append(criarElemento("span", "indicador__rotulo", rotulo));
    return caixa;
  }

  /**
   * Desenha os indicadores do resumo geral.
   * @param {object} resumo - Totais calculados pelo script Python.
   */
  function renderizarIndicadores(resumo) {
    const alvo = document.getElementById("indicadores");
    alvo.replaceChildren(
      criarIndicador(String(resumo.total), "projetos"),
      criarIndicador(String(resumo.ativos), "ativos (14 dias)"),
      criarIndicador(String(resumo.com_git), "com Git"),
      criarIndicador(String(resumo.sem_git), "sem Git", resumo.sem_git > 0),
      criarIndicador(String(resumo.com_graphify), "com graphify"),
      criarIndicador(String(resumo.alteracoes_pendentes), "alteracoes sem commit"),
      criarIndicador(formatarBytes(resumo.tamanho_bytes), "tamanho total"),
      criarIndicador(String(resumo.alertas), "alertas", resumo.alertas > 0)
    );
  }

  /**
   * Monta uma lista de etiquetas.
   * @param {string[]} itens - Textos das etiquetas.
   * @param {string} [modificador] - Classe extra (ex.: etiqueta--violeta).
   * @returns {HTMLElement} Container das etiquetas.
   */
  function criarEtiquetas(itens, modificador) {
    const caixa = criarElemento("div", "etiquetas");
    itens.forEach((item) => {
      const classe = modificador ? `etiqueta ${modificador}` : "etiqueta";
      caixa.append(criarElemento("span", classe, item));
    });
    return caixa;
  }

  /**
   * Monta a lista de dados (Git, arquivos) de um projeto.
   * @param {object} projeto - Projeto do JSON.
   * @returns {HTMLElement} Elemento <dl>.
   */
  function criarDados(projeto) {
    const lista = criarElemento("dl", "dados");
    const git = projeto.git;
    const linhas = [["Arquivos", String(projeto.arquivos)]];
    if (git) {
      linhas.push(["Branch", git.branch || "—"]);
      const commit = git.ultimo_commit;
      linhas.push(["Ultimo commit", `${formatarData(commit.data)} ${commit.hash}`]);
      linhas.push(["Assunto", git.ultimo_commit.assunto || "—"]);
      linhas.push(["Sem commit", `${git.alteracoes} arquivo(s)`]);
      linhas.push(["Remoto", git.remoto || "sem origin"]);
    }
    linhas.forEach(([nome, valor]) => {
      lista.append(criarElemento("dt", "", nome), criarElemento("dd", "", valor));
    });
    return lista;
  }

  /**
   * Monta a barra de tamanho, proporcional ao maior projeto.
   * @param {object} projeto - Projeto do JSON.
   * @param {number} tamanhoMaximo - Maior tamanho entre os projetos.
   * @returns {HTMLElement} Medidor com barra e texto.
   */
  function criarMedidor(projeto, tamanhoMaximo) {
    const caixa = criarElemento("div", "medidor");
    const barra = criarElemento("progress");
    barra.max = Math.max(tamanhoMaximo, 1);
    barra.value = projeto.tamanho_bytes;
    barra.setAttribute("aria-label", `Tamanho de ${projeto.nome}`);
    caixa.append(barra, criarElemento("span", "", formatarBytes(projeto.tamanho_bytes)));
    return caixa;
  }

  /**
   * Monta uma secao de lista dentro dos detalhes.
   * @param {string} titulo - Titulo da secao.
   * @param {string[]} itens - Itens da lista.
   * @param {HTMLElement} destino - Container onde a secao e anexada.
   */
  function anexarSecao(titulo, itens, destino) {
    if (!itens.length) return;
    const lista = criarElemento("ul");
    itens.forEach((item) => lista.append(criarElemento("li", "", item)));
    destino.append(criarElemento("h4", "", titulo), lista);
  }

  /**
   * Monta o bloco expansivel com graphify e estrutura de pastas.
   * @param {object} projeto - Projeto do JSON.
   * @returns {HTMLElement|null} Elemento <details> ou null se nao houver o que mostrar.
   */
  function criarDetalhes(projeto) {
    const grafo = projeto.graphify;
    if (!grafo && !projeto.subpastas.length) return null;
    const detalhes = criarElemento("details", "detalhes");
    const corpo = criarElemento("div", "detalhes__corpo");
    detalhes.append(criarElemento("summary", "", "Detalhes e graphify"), corpo);
    if (grafo) {
      const resumo = `${grafo.nos} nos · ${grafo.arestas} arestas · `
        + `${grafo.comunidades} comunidades`;
      anexarSecao(`Grafo (${grafo.titulo || "graphify"})`, [resumo], corpo);
      anexarSecao("Nos centrais", grafo.nos_centrais.map((n) => `${n.nome} (${n.arestas})`), corpo);
      anexarSecao("Comunidades principais", grafo.hubs, corpo);
    }
    anexarSecao("Pastas", projeto.subpastas, corpo);
    return detalhes;
  }

  /**
   * Monta o cartao completo de um projeto.
   * @param {object} projeto - Projeto do JSON.
   * @param {number} tamanhoMaximo - Maior tamanho entre os projetos.
   * @returns {HTMLElement} Elemento <article> do cartao.
   */
  function criarCartao(projeto, tamanhoMaximo) {
    const cartao = criarElemento("article", `cartao cartao--${projeto.situacao}`);
    const topo = criarElemento("div", "cartao__topo");
    topo.append(
      criarElemento("h3", "cartao__nome", projeto.nome),
      criarElemento("span", `selo selo--${projeto.situacao}`, ROTULO_SITUACAO[projeto.situacao])
    );
    cartao.append(topo, criarElemento("p", "cartao__descricao", projeto.descricao));
    cartao.append(criarEtiquetas(projeto.stack));
    cartao.append(criarEtiquetas(projeto.linguagens, "etiqueta--violeta"));
    cartao.append(criarMedidor(projeto, tamanhoMaximo), criarDados(projeto));
    if (projeto.alertas.length) {
      const alertas = criarElemento("ul", "alertas");
      projeto.alertas.forEach((texto) => alertas.append(criarElemento("li", "", texto)));
      cartao.append(alertas);
    }
    const detalhes = criarDetalhes(projeto);
    if (detalhes) cartao.append(detalhes);
    return cartao;
  }

  /** Redesenha os cartoes conforme filtro, busca e ordenacao atuais. */
  function renderizarCartoes() {
    const alvo = document.getElementById("cartoes");
    const todos = estado.dados.projetos;
    const tamanhoMaximo = Math.max(...todos.map((p) => p.tamanho_bytes), 1);
    const visiveis = todos.filter(passaNoFiltro).sort(ORDENACOES[estado.ordem]);
    if (!visiveis.length) {
      alvo.replaceChildren(criarElemento("p", "vazio", "Nenhum projeto encontrado."));
      return;
    }
    alvo.replaceChildren(...visiveis.map((p) => criarCartao(p, tamanhoMaximo)));
  }

  /** Desenha os botoes de filtro e liga o clique de cada um. */
  function renderizarFiltros() {
    const alvo = document.getElementById("filtros");
    const botoes = FILTROS.map((filtro) => {
      const botao = criarElemento("button", "filtro", filtro.rotulo);
      botao.type = "button";
      botao.setAttribute("aria-pressed", String(filtro.id === estado.filtro));
      botao.addEventListener("click", () => {
        estado.filtro = filtro.id;
        renderizarFiltros();
        renderizarCartoes();
      });
      return botao;
    });
    alvo.replaceChildren(...botoes);
  }

  /** Liga a caixa de busca e o seletor de ordenacao. */
  function ligarControles() {
    document.getElementById("busca").addEventListener("input", (evento) => {
      estado.busca = evento.target.value.trim().toLowerCase();
      renderizarCartoes();
    });
    document.getElementById("ordem").addEventListener("change", (evento) => {
      estado.ordem = evento.target.value;
      renderizarCartoes();
    });
  }

  /**
   * Mostra a data de geracao dos dados no topo e no rodape.
   * @param {string} geradoEm - Data/hora ISO gravada pelo script.
   */
  function mostrarGeracao(geradoEm) {
    const data = new Date(geradoEm);
    const texto = Number.isNaN(data.getTime()) ? geradoEm : data.toLocaleString("pt-BR");
    document.querySelectorAll("[data-gerado-em]").forEach((el) => {
      el.textContent = texto;
    });
  }

  /** Mostra o aviso de que os dados nao foram encontrados. */
  function mostrarErro() {
    const aviso = document.getElementById("aviso");
    aviso.hidden = false;
    aviso.textContent = "projetos.json nao encontrado. Rode: python update-projects-status.py";
  }

  /** Inicializa a pagina. */
  async function iniciar() {
    estado.dados = await carregarDados();
    if (!estado.dados) {
      mostrarErro();
      return;
    }
    mostrarGeracao(estado.dados.gerado_em);
    renderizarIndicadores(estado.dados.resumo);
    renderizarFiltros();
    ligarControles();
    renderizarCartoes();
  }

  iniciar();
})();
