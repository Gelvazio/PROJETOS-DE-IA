// Leitura do quadro de tarefas (tasks/STATUS.md) para a página "Agentes ao vivo".
// Porta de dashboard/quadro_tarefas.py: mesmos campos e valores (INV-4). Sem dependências.

const TITULO_SECAO = "## 📌 Tarefas";
const COLUNAS = { tarefa: "Tarefa", titulo: "Título", modelo: "Modelo", status: "Status",
                  em_uso_por: "Em uso por" };
const STATUS_POR_EMOJI = [["🔄", "progresso"], ["✅", "concluido"], ["⏹", "concluido"],
                          ["⛔", "bloqueado"], ["👀", "aguardando"], ["⬜", "pendente"]];
const NIVEIS = ["LEVE", "MEDIO", "PESADO"];
const PADRAO_DESDE = /\(?desde (\d{4}-\d{2}-\d{2} \d{2}:\d{2})\)?/;
const PADRAO_DESDE_TODOS = new RegExp(PADRAO_DESDE.source, "g");
const PADRAO_MARCAS = /[*`]/g;
const PADRAO_PERCENTUAL = /\s*·\s*(\d{1,3})\s*%\s*$/; // regra C31: "... · 40%" no fim
const QUEBRA_DE_LINHA = /\r\n|[\n\r\v\f\x1c-\x1e\x85\u2028\u2029]/;
// Índice simplificado (C55): "- #<ID> — [<título>](etapa) · <status> · <Em uso por>".
const PADRAO_ITEM_INDICE = /^(\s*)- #(.+?) — (.*)$/;
const PADRAO_ITEM_SOLTO = /^- #([^\s:]+): (.*?)(?: — \[.*)?$/;
const PADRAO_LINK = /^\[(.*?)\]\([^)]*\)/;
const PADRAO_NIVEL_CRASES = /^`([^`]*)`$/;
const PADRAO_CAUDA_NIVEL = /\s*·\s*`[^`]*`\s*$/;
const MSG_FORMATO_DESCONHECIDO = "O quadro não está em nenhum formato conhecido: nem a tabela "
  + "'## 📌 Tarefas' nem o índice simplificado '- #<ID> — ...'.";

function limpar(texto) {
  return texto.replace(PADRAO_MARCAS, "").trim();
}

function celulas(linha) {
  return linha.trim().replace(/^\|+|\|+$/g, "").split("|").map((c) => c.trim());
}

function linhasDaTabela(texto) {
  const inicio = texto.indexOf(TITULO_SECAO);
  if (inicio < 0) return [[], []];
  const linhas = [];
  for (const linha of texto.slice(inicio).split(QUEBRA_DE_LINHA).slice(1)) {
    if (linha.startsWith("|")) linhas.push(linha);
    else if (linhas.length) break;
  }
  if (linhas.length < 2) return [[], []];
  return [celulas(linhas[0]), linhas.slice(2)];
}

function mapaDeColunas(cabecalho) {
  const posicoes = new Map(cabecalho.map((nome, indice) => [limpar(nome), indice]));
  const mapa = {};
  for (const [chave, nome] of Object.entries(COLUNAS)) {
    if (posicoes.has(nome)) mapa[chave] = posicoes.get(nome);
  }
  return mapa;
}

function nivelDaColuna(modelo) {
  const texto = modelo.toUpperCase();
  if (texto.startsWith("USU")) return "USUARIO";
  return NIVEIS.find((n) => texto.includes(n)) || "";
}

function statusDaColuna(status) {
  const achado = STATUS_POR_EMOJI.find(([emoji]) => status.includes(emoji));
  return achado ? achado[1] : "pendente";
}

function agenteDaColuna(emUsoPor) {
  if (!emUsoPor || emUsoPor.startsWith("—")) return ["", "", null];
  const percentual = PADRAO_PERCENTUAL.exec(emUsoPor);
  const texto = emUsoPor.replace(PADRAO_PERCENTUAL, "");
  const desde = PADRAO_DESDE.exec(texto);
  const nome = texto.replace(PADRAO_DESDE_TODOS, "").trim();
  const progresso = percentual ? Math.min(parseInt(percentual[1], 10), 100) : null;
  return [nome, desde ? desde[1] : "", progresso];
}

function tarefaDaLinha(colunas, mapa, indice) {
  const valor = (chave) => {
    const posicao = mapa[chave];
    return posicao !== undefined && posicao < colunas.length ? colunas[posicao] : "";
  };
  const tarefa = limpar(valor("tarefa"));
  const [agente, desde, progresso] = agenteDaColuna(valor("em_uso_por"));
  const ponto = tarefa.indexOf(".");
  return {
    tarefa,
    titulo: limpar(valor("titulo")),
    pai: ponto < 0 ? tarefa : tarefa.slice(0, ponto),
    mae: ponto < 0,
    nivel: nivelDaColuna(valor("modelo")),
    status: statusDaColuna(valor("status")),
    agente,
    desde,
    progresso,
    global: valor("titulo").includes("🌐"),
    indice,
  };
}

/** Formato do texto: "tabela" (legado), "indice" (simplificado) ou null se não casar. */
function formatoDoQuadro(texto) {
  if (texto.includes(TITULO_SECAO)) return "tabela";
  const linhas = texto.split(QUEBRA_DE_LINHA);
  const temItem = linhas.some((l) => PADRAO_ITEM_INDICE.test(l) || PADRAO_ITEM_SOLTO.test(l));
  return temItem ? "indice" : null;
}

/** Texto de "Em uso por" guardado na observação entre parênteses da subtarefa (ou ""). */
function reservaDaSubtarefa(resto) {
  const abre = resto.indexOf("(");
  if (abre < 0 || !resto.includes("desde")) return "";
  return resto.slice(abre + 1).trim().replace(/\)+$/, "").trim();
}

/** [título, partes depois do título] de "[título](link) · a · b" ou "título · a · b". */
function partesDoItem(texto) {
  const link = PADRAO_LINK.exec(texto);
  if (link) {
    const partes = texto.slice(link[0].length).split(" · ").slice(1);
    return [link[1].replace(PADRAO_CAUDA_NIVEL, ""), partes.map((p) => p.trim())];
  }
  const partes = texto.split(" · ").map((p) => p.trim());
  return [partes[0], partes.slice(1)];
}

function tarefaDoItemIndice(identificador, texto, maeAtual, recuada, indice) {
  const [titulo, partes] = partesDoItem(texto);
  const ehMae = !identificador.includes(".") && !recuada;
  const status = partes[0] || "";
  let nivel = "";
  let reserva = "";
  if (ehMae) {
    reserva = partes.slice(1).join(" · ");
    nivel = status ? "" : nivelDaColuna(titulo);
  } else {
    const crases = partes.length > 1 ? PADRAO_NIVEL_CRASES.exec(partes[1]) : null;
    nivel = crases ? nivelDaColuna(crases[1]) : "";
    reserva = reservaDaSubtarefa(partes.slice(2).join(" · "));
  }
  const [agente, desde, progresso] = agenteDaColuna(reserva);
  const tarefa = limpar(identificador);
  return {
    tarefa, titulo: limpar(titulo), pai: ehMae ? tarefa : maeAtual, mae: ehMae,
    nivel, status: statusDaColuna(status), agente, desde, progresso,
    global: titulo.includes("🌐"), indice,
  };
}

function tarefasDoIndice(texto) {
  const tarefas = [];
  let maeAtual = "";
  for (const linha of texto.split(QUEBRA_DE_LINHA)) {
    const item = PADRAO_ITEM_INDICE.exec(linha);
    const solto = item ? null : PADRAO_ITEM_SOLTO.exec(linha);
    if (!item && !solto) continue;
    const recuada = Boolean(item && item[1]);
    const [identificador, resto] = item ? [item[2], item[3]] : [solto[1], solto[2]];
    const tarefa = tarefaDoItemIndice(identificador.replace(/#/g, ""), resto, maeAtual,
                                      recuada, tarefas.length);
    if (!recuada) maeAtual = tarefa.tarefa;
    tarefas.push(tarefa);
  }
  return tarefas;
}

function tarefasDaTabela(texto) {
  const [cabecalho, linhas] = linhasDaTabela(texto);
  const mapa = mapaDeColunas(cabecalho);
  if (mapa.tarefa === undefined || mapa.status === undefined) {
    throw new Error("O quadro não tem as colunas Tarefa e Status na tabela de tarefas.");
  }
  const tarefas = [];
  for (const linha of linhas) {
    const colunas = celulas(linha);
    if (colunas[mapa.tarefa]) tarefas.push(tarefaDaLinha(colunas, mapa, tarefas.length));
  }
  return tarefas;
}

// Tarefas do quadro a partir do texto do STATUS.md (tabela legado ou índice simplificado;
// mesmo formato de ler_quadro()["tarefas"]).
export function lerQuadro(texto) {
  const formato = formatoDoQuadro(texto);
  if (!formato) throw new Error(MSG_FORMATO_DESCONHECIDO);
  return { tarefas: formato === "indice" ? tarefasDoIndice(texto) : tarefasDaTabela(texto) };
}
