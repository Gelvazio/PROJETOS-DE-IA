"""Leitura dos quadros de tarefas (<projeto>/tasks/STATUS.md) para a página "Agentes ao vivo"."""
import re
from datetime import datetime

TITULO_SECAO = "## 📌 Tarefas"
CAMINHO_QUADRO = ("tasks", "STATUS.md")
# Regras C20 e C23: estas pastas nunca são listadas nem lidas.
PREFIXOS_IGNORADOS = ("DEMAIS-PROJETOS-",)
# Cada projeto tem o seu cabeçalho (com ou sem "Modelo", com ou sem "Verificado"): as colunas são
# achadas pelo nome.
COLUNAS = {"tarefa": "Tarefa", "titulo": "Título", "modelo": "Modelo", "status": "Status",
           "em_uso_por": "Em uso por"}
STATUS_POR_EMOJI = (("🔄", "progresso"), ("✅", "concluido"), ("⏹", "concluido"),
                    ("⛔", "bloqueado"), ("👀", "aguardando"), ("⬜", "pendente"))
NIVEIS = ("LEVE", "MEDIO", "PESADO")
PADRAO_DESDE = re.compile(r"\(?desde (\d{4}-\d{2}-\d{2} \d{2}:\d{2})\)?")
PADRAO_MARCAS = re.compile(r"[*`]")
PADRAO_PERCENTUAL = re.compile(r"\s*·\s*(\d{1,3})\s*%\s*$")  # regra C31: "... · 40%" no fim
# Índice simplificado (C55): "- #<ID> — [<título>](etapa) · <status> · <Em uso por>" e subtarefas recuadas.
PADRAO_ITEM_INDICE = re.compile(r"^(\s*)- #(.+?) — (.*)$")
PADRAO_ITEM_SOLTO = re.compile(r"^- #([^\s:]+): (.*?)(?: — \[.*)?$")
PADRAO_LINK = re.compile(r"^\[(.*?)\]\([^)]*\)")
PADRAO_NIVEL_CRASES = re.compile(r"^`([^`]*)`$")
PADRAO_CAUDA_NIVEL = re.compile(r"\s*·\s*`[^`]*`\s*$")
QUEBRA_DE_LINHA = re.compile(r"\r\n|[\n\r\v\f\x1c-\x1e\x85\u2028\u2029]")
FORMATO_TABELA = "tabela"
FORMATO_INDICE = "indice"
MSG_FORMATO_DESCONHECIDO = ("O quadro não está em nenhum formato conhecido: nem a tabela "
                            "'## 📌 Tarefas' nem o índice simplificado '- #<ID> — ...'.")


def limpar(texto):
    """Tira negrito e crases do Markdown."""
    return PADRAO_MARCAS.sub("", texto).strip()


def nome_do_projeto(pasta):
    """'rules-ai' → 'Rules Ai'."""
    return pasta.replace("-", " ").replace("_", " ").title()


def listar_projetos(pasta_fontes):
    """Projetos de C:\\fontes que têm tasks/STATUS.md (sem as pastas ignoradas), em ordem alfabética."""
    projetos = []
    for pasta in sorted(pasta_fontes.iterdir(), key=lambda p: p.name.lower()):
        if pasta.name.startswith(PREFIXOS_IGNORADOS) or pasta.name.startswith("."):
            continue
        if pasta.is_dir() and pasta.joinpath(*CAMINHO_QUADRO).is_file():
            projetos.append({"id": pasta.name, "nome": nome_do_projeto(pasta.name)})
    return projetos


def caminho_do_quadro(pasta_fontes, projeto):
    """Quadro do projeto pedido; ValueError se o id não estiver na lista descoberta."""
    if projeto not in {p["id"] for p in listar_projetos(pasta_fontes)}:
        raise ValueError(f"Projeto sem quadro de tarefas: {projeto}")
    return pasta_fontes.joinpath(projeto, *CAMINHO_QUADRO)


def linhas_da_tabela(texto):
    """Cabeçalho e linhas de dados da primeira tabela depois do título da seção."""
    inicio = texto.find(TITULO_SECAO)
    if inicio < 0:
        return [], []
    linhas = []
    for linha in texto[inicio:].splitlines()[1:]:
        if linha.startswith("|"):
            linhas.append(linha)
        elif linhas:
            break
    if len(linhas) < 2:
        return [], []
    return celulas(linhas[0]), linhas[2:]


def celulas(linha):
    return [c.strip() for c in linha.strip().strip("|").split("|")]


def mapa_de_colunas(cabecalho):
    """chave → índice da coluna, só para as colunas que existem neste quadro."""
    posicoes = {limpar(nome): indice for indice, nome in enumerate(cabecalho)}
    return {chave: posicoes[nome] for chave, nome in COLUNAS.items() if nome in posicoes}


def nivel_da_coluna(modelo):
    """LEVE, MEDIO, PESADO, USUARIO ou '' a partir da coluna Modelo."""
    texto = modelo.upper()
    if texto.startswith("USU"):
        return "USUARIO"
    return next((n for n in NIVEIS if n in texto), "")


def status_da_coluna(status):
    return next((chave for emoji, chave in STATUS_POR_EMOJI if emoji in status), "pendente")


def agente_da_coluna(em_uso_por):
    """Nome do agente (sem 'desde ...' e sem o percentual), a hora da reserva e o percentual (ou None)."""
    if em_uso_por.startswith("—") or not em_uso_por:
        return "", "", None
    percentual = PADRAO_PERCENTUAL.search(em_uso_por)
    texto = PADRAO_PERCENTUAL.sub("", em_uso_por)
    desde = PADRAO_DESDE.search(texto)
    nome = PADRAO_DESDE.sub("", texto).strip()
    progresso = min(int(percentual.group(1)), 100) if percentual else None
    return nome, desde.group(1) if desde else "", progresso


def tarefa_da_linha(colunas, mapa, indice):
    """Dict de uma linha do quadro (coluna ausente neste quadro vira '')."""
    def valor(chave):
        posicao = mapa.get(chave)
        return colunas[posicao] if posicao is not None and posicao < len(colunas) else ""

    tarefa = limpar(valor("tarefa"))
    agente, desde, progresso = agente_da_coluna(valor("em_uso_por"))
    return {
        "tarefa": tarefa,
        "titulo": limpar(valor("titulo")),
        "pai": tarefa.split(".", 1)[0],
        "mae": "." not in tarefa,
        "nivel": nivel_da_coluna(valor("modelo")),
        "status": status_da_coluna(valor("status")),
        "agente": agente,
        "desde": desde,
        "progresso": progresso,
        "global": "🌐" in valor("titulo"),
        "indice": indice,
    }


def formato_do_quadro(texto):
    """'tabela' (legado), 'indice' (simplificado) ou None quando o texto não casa com nenhum."""
    if TITULO_SECAO in texto:
        return FORMATO_TABELA
    linhas = QUEBRA_DE_LINHA.split(texto)
    if any(PADRAO_ITEM_INDICE.match(linha) or PADRAO_ITEM_SOLTO.match(linha) for linha in linhas):
        return FORMATO_INDICE
    return None


def reserva_da_subtarefa(resto):
    """Texto de 'Em uso por' guardado na observação entre parênteses da subtarefa (ou '')."""
    abre = resto.find("(")
    if abre < 0 or "desde" not in resto:
        return ""
    return resto[abre + 1:].strip().rstrip(")").strip()


def partes_do_item(texto):
    """(título, partes depois do título) de '[título](link) · a · b' ou 'título · a · b'."""
    link = PADRAO_LINK.match(texto)
    if link:
        titulo = PADRAO_CAUDA_NIVEL.sub("", link.group(1))
        return titulo, [p.strip() for p in texto[link.end():].split(" · ")[1:]]
    partes = [p.strip() for p in texto.split(" · ")]
    return partes[0], partes[1:]


def tarefa_do_item_indice(identificador, texto, mae_atual, indice):
    """Dict de um item do índice simplificado (mãe sem recuo ou subtarefa recuada)."""
    titulo, partes = partes_do_item(texto)
    eh_mae = "." not in identificador and not mae_atual[1]
    status = partes[0] if partes else ""
    if eh_mae:
        agente, desde, progresso = agente_da_coluna(" · ".join(partes[1:]))
        nivel = nivel_da_coluna(titulo) if not status else ""
    else:
        crases = PADRAO_NIVEL_CRASES.match(partes[1]) if len(partes) > 1 else None
        nivel = nivel_da_coluna(crases.group(1)) if crases else ""
        agente, desde, progresso = agente_da_coluna(reserva_da_subtarefa(" · ".join(partes[2:])))
    return {
        "tarefa": limpar(identificador), "titulo": limpar(titulo),
        "pai": limpar(identificador) if eh_mae else mae_atual[0], "mae": eh_mae,
        "nivel": nivel, "status": status_da_coluna(status), "agente": agente, "desde": desde,
        "progresso": progresso, "global": "🌐" in titulo, "indice": indice,
    }


def tarefas_do_indice(texto):
    """Tarefas do índice simplificado: mães sem recuo e subtarefas recuadas logo abaixo."""
    tarefas, mae_atual = [], ("", False)
    for linha in QUEBRA_DE_LINHA.split(texto):
        item = PADRAO_ITEM_INDICE.match(linha)
        solto = None if item else PADRAO_ITEM_SOLTO.match(linha)
        if not item and not solto:
            continue
        recuada = bool(item and item.group(1))
        identificador, resto = (item.group(2), item.group(3)) if item else solto.groups()
        identificador = identificador.replace("#", "")
        tarefa = tarefa_do_item_indice(identificador, resto, (mae_atual[0], recuada), len(tarefas))
        if not recuada:
            mae_atual = (tarefa["tarefa"], False)
        tarefas.append(tarefa)
    return tarefas


def tarefas_da_tabela(texto):
    """Tarefas da tabela '## 📌 Tarefas' (formato legado)."""
    cabecalho, linhas = linhas_da_tabela(texto)
    mapa = mapa_de_colunas(cabecalho)
    if "tarefa" not in mapa or "status" not in mapa:
        raise ValueError("O quadro não tem as colunas Tarefa e Status na tabela de tarefas.")
    tarefas = []
    for linha in linhas:
        colunas = celulas(linha)
        if mapa["tarefa"] < len(colunas) and colunas[mapa["tarefa"]]:
            tarefas.append(tarefa_da_linha(colunas, mapa, len(tarefas)))
    return tarefas


def ler_quadro(caminho):
    """Tarefas do quadro (tabela legado ou índice simplificado) e a hora da última gravação."""
    if not caminho.exists():
        raise ValueError(f"Quadro não encontrado: {caminho}")
    texto = caminho.read_text(encoding="utf-8")
    formato = formato_do_quadro(texto)
    if formato is None:
        raise ValueError(MSG_FORMATO_DESCONHECIDO)
    tarefas = tarefas_do_indice(texto) if formato == FORMATO_INDICE else tarefas_da_tabela(texto)
    gravado = datetime.fromtimestamp(caminho.stat().st_mtime).isoformat(timespec="seconds")
    return {"atualizado_em": gravado, "tarefas": tarefas}
