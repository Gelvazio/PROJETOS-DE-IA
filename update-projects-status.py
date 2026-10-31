#!/usr/bin/env python3
"""Analisa a pasta atual e cada subpasta (projeto) e grava o resultado em projetos.json.

Para cada projeto o script descobre do que se trata (README, package.json, index.html,
AGENTS.md, CLAUDE.md), a stack, o estado do Git, o tamanho e, se existir, o resumo do
relatorio do graphify (graphify-out/GRAPH_REPORT.md). O dashboard ``index.html`` le o
``projetos.json`` (e o ``projetos.js``, copia para quando a pagina abre por file://).

Uso:
    python update-projects-status.py [--raiz PASTA] [--saida projetos.json]

Somente leitura nos projetos: nenhum arquivo deles e alterado e arquivos ``.env`` nunca
sao abertos.
"""

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

PASTAS_IGNORADAS_PREFIXO = ("DEMAIS-PROJETOS-",)
# "dashboard" guarda o CSS/JS do proprio index.html, nao e um projeto
PASTAS_IGNORADAS_NOMES = {"node_modules", "__pycache__", ".git", "dashboard", "tasks", "_backup-git"}
PASTAS_FORA_DO_TAMANHO = {"node_modules", ".git"}
ARQUIVO_JSON = "projetos.json"
ARQUIVO_JS = "projetos.js"
VARIAVEL_JS = "DADOS_PROJETOS"
CODIFICACAO = "utf-8"
LIMITE_LEITURA_BYTES = 400_000
LIMITE_DESCRICAO = 320
LIMITE_SUBPASTAS = 14
LIMITE_GOD_NODES = 6
LIMITE_HUBS = 6
TEMPO_GIT_SEGUNDOS = 20
DIAS_PROJETO_ATIVO = 14
LIMITE_TAMANHO_ALERTA = 2 * 1024 ** 3

DOCUMENTOS_DESCRICAO = ("README.md", "AGENTS.md", "CLAUDE.md")
MARCADORES_STACK = {
    "package.json": "Node.js",
    "Cargo.toml": "Rust",
    "pyproject.toml": "Python",
    "requirements.txt": "Python",
    "vercel.json": "Vercel",
    "index.html": "HTML",
    "tsconfig.json": "TypeScript",
}
DEPENDENCIAS_CONHECIDAS = {
    "vite": "Vite",
    "react": "React",
    "vue": "Vue",
    "next": "Next.js",
    "express": "Express",
    "vitest": "Vitest",
    "jest": "Jest",
    "electron": "Electron",
    "@supabase/supabase-js": "Supabase",
}
LINGUAGENS_POR_EXTENSAO = {
    ".js": "JavaScript",
    ".mjs": "JavaScript",
    ".ts": "TypeScript",
    ".py": "Python",
    ".rs": "Rust",
    ".html": "HTML",
    ".css": "CSS",
    ".sql": "SQL",
    ".md": "Markdown",
    ".pptx": "PowerPoint",
}
LINGUAGENS_EXIBIDAS = 4

TAMANHO_MINIMO_DESCRICAO = 20
LIMITE_PARAGRAFOS = 8
REGEX_SEGREDO = re.compile(
    r"(senha|password|passwd|token|secret|api[ _-]?key|login)\s*[:=]"
    r"|api[ _-]?key|bearer\s+\S|sk-[a-z0-9]{8}|[a-z0-9_-]{28,}",
    re.I,
)
REGEX_RESUMO_GRAFO = re.compile(
    r"(\d[\d,.]*)\s+nodes\D+(\d[\d,.]*)\s+edges\D+(\d[\d,.]*)\s+communities"
)
REGEX_TITULO_HTML = re.compile(r"<title[^>]*>(.*?)</title>", re.I | re.S)
REGEX_META_DESCRICAO = re.compile(
    r"<meta[^>]+name=[\"']description[\"'][^>]+content=[\"']([^\"']+)[\"']", re.I
)
REGEX_ITEM_GOD_NODE = re.compile(r"^\d+\.\s+`(.+?)`\s+-\s+(\d+)\s+edges")
REGEX_HUB = re.compile(r"^-\s+\[\[_COMMUNITY_.*?\|(.+?)\]\]")


def ler_texto(caminho, limite=LIMITE_LEITURA_BYTES):
    """Le o inicio de um arquivo de texto.

    Args:
        caminho: Caminho do arquivo.
        limite: Maximo de bytes a ler.

    Returns:
        O texto lido, ou string vazia se o arquivo nao existir ou nao puder ser lido.
    """
    if not caminho.is_file():
        return ""
    try:
        with open(caminho, "rb") as arquivo:
            return arquivo.read(limite).decode(CODIFICACAO, errors="replace")
    except OSError:
        return ""


def deve_ignorar_pasta(nome):
    """Diz se uma subpasta da raiz fica fora da analise.

    Args:
        nome: Nome da subpasta.

    Returns:
        True para pastas ocultas, de dependencias e as de projetos parados.
    """
    if nome.startswith("."):
        return True
    if nome in PASTAS_IGNORADAS_NOMES:
        return True
    return nome.startswith(PASTAS_IGNORADAS_PREFIXO)


def listar_projetos(raiz):
    """Lista as subpastas diretas da raiz que devem ser analisadas.

    Args:
        raiz: Pasta onde procurar os projetos.

    Returns:
        Lista de Path, em ordem alfabetica sem diferenciar maiusculas.
    """
    pastas = [p for p in raiz.iterdir() if p.is_dir() and not deve_ignorar_pasta(p.name)]
    return sorted(pastas, key=lambda p: p.name.lower())


def paragrafos_do_markdown(markdown):
    """Divide um Markdown em paragrafos de texto corrido.

    Ignora titulos, tabelas, listas, citacoes, tags e blocos de codigo.

    Args:
        markdown: Conteudo do arquivo.

    Returns:
        Lista com os primeiros paragrafos encontrados.
    """
    paragrafos, atual, em_codigo = [], [], False
    for linha in markdown.splitlines():
        texto = linha.strip()
        if texto.startswith("```"):
            em_codigo = not em_codigo
            continue
        eh_texto = bool(texto) and not em_codigo and texto[0] not in "#|>-*![<`"
        if eh_texto and not texto.startswith("---"):
            atual.append(texto)
        elif atual:
            paragrafos.append(" ".join(atual))
            atual = []
        if len(paragrafos) >= LIMITE_PARAGRAFOS:
            break
    return paragrafos + ([" ".join(atual)] if atual else [])


def descricao_do_html(html):
    """Monta uma descricao a partir do <title> e da meta description de um HTML.

    Args:
        html: Conteudo do index.html.

    Returns:
        Texto descritivo ou string vazia.
    """
    titulo = REGEX_TITULO_HTML.search(html)
    meta = REGEX_META_DESCRICAO.search(html)
    partes = [m.group(1).strip() for m in (titulo, meta) if m and m.group(1).strip()]
    return " - ".join(partes)


def ler_package_json(pasta):
    """Le o package.json de um projeto.

    Args:
        pasta: Pasta do projeto.

    Returns:
        Dicionario do package.json, ou vazio se ausente ou invalido.
    """
    try:
        dados = json.loads(ler_texto(pasta / "package.json"))
    except ValueError:
        return {}
    return dados if isinstance(dados, dict) else {}


def descobrir_descricao(pasta):
    """Descobre do que se trata o projeto, na ordem das fontes mais confiaveis.

    Args:
        pasta: Pasta do projeto.

    Returns:
        Tupla (descricao, nome do arquivo de origem); ("", "") se nada foi encontrado.
    """
    candidatos = []
    for documento in DOCUMENTOS_DESCRICAO[:1]:
        candidatos += [(documento, t) for t in paragrafos_do_markdown(ler_texto(pasta / documento))]
    candidatos.append(("package.json", str(ler_package_json(pasta).get("description", ""))))
    candidatos.append(("index.html", descricao_do_html(ler_texto(pasta / "index.html"))))
    for documento in DOCUMENTOS_DESCRICAO[1:]:
        candidatos += [(documento, t) for t in paragrafos_do_markdown(ler_texto(pasta / documento))]
    for origem, texto in candidatos:
        texto = re.sub(r"\s+", " ", texto).strip()
        if descricao_aproveitavel(texto, pasta.name):
            return texto[:LIMITE_DESCRICAO], origem
    return "", ""


def descricao_aproveitavel(texto, nome_projeto):
    """Decide se um texto serve como descricao do projeto.

    Rejeita textos curtos demais, iguais ao nome da pasta, que parecem trecho cortado
    (comecam em minuscula) ou que mencionam senha, token ou chave: credenciais esquecidas
    em README nunca podem ser copiadas para o projetos.json.

    Args:
        texto: Descricao candidata, ja sem quebras de linha.
        nome_projeto: Nome da pasta do projeto.

    Returns:
        True se o texto pode ser usado.
    """
    if len(texto) < TAMANHO_MINIMO_DESCRICAO:
        return False
    if texto.lower() == nome_projeto.lower():
        return False
    if texto[0].islower() or "http" in texto.lower():
        return False
    return not REGEX_SEGREDO.search(texto)


def detectar_stack(pasta):
    """Detecta tecnologias pelos arquivos de marcacao e pelas dependencias do package.json.

    Args:
        pasta: Pasta do projeto.

    Returns:
        Lista de nomes de tecnologias, sem repeticao e na ordem de descoberta.
    """
    stack = [nome for arquivo, nome in MARCADORES_STACK.items() if (pasta / arquivo).exists()]
    pacote = ler_package_json(pasta)
    dependencias = {**pacote.get("dependencies", {}), **pacote.get("devDependencies", {})}
    stack += [nome for chave, nome in DEPENDENCIAS_CONHECIDAS.items() if chave in dependencias]
    return list(dict.fromkeys(stack))


def medir_pasta(pasta):
    """Percorre a pasta somando tamanho, arquivos e extensoes (sem node_modules e .git).

    Args:
        pasta: Pasta do projeto.

    Returns:
        Dicionario com ``bytes``, ``arquivos`` e ``linguagens`` (as mais frequentes).
    """
    total_bytes, total_arquivos, extensoes = 0, 0, {}
    for diretorio, subpastas, arquivos in os.walk(pasta):
        subpastas[:] = [s for s in subpastas if s not in PASTAS_FORA_DO_TAMANHO]
        for nome in arquivos:
            try:
                total_bytes += os.path.getsize(os.path.join(diretorio, nome))
            except OSError:
                continue
            total_arquivos += 1
            linguagem = LINGUAGENS_POR_EXTENSAO.get(os.path.splitext(nome)[1].lower())
            if linguagem:
                extensoes[linguagem] = extensoes.get(linguagem, 0) + 1
    ordenadas = sorted(extensoes, key=extensoes.get, reverse=True)
    return {
        "bytes": total_bytes,
        "arquivos": total_arquivos,
        "linguagens": ordenadas[:LINGUAGENS_EXIBIDAS],
    }


def executar_git(pasta, *argumentos):
    """Executa um comando git de leitura dentro da pasta do projeto.

    Args:
        pasta: Pasta do projeto (precisa ter .git proprio).
        *argumentos: Argumentos do git.

    Returns:
        Saida padrao sem espacos nas pontas, ou string vazia em caso de falha.
    """
    try:
        resultado = subprocess.run(
            ["git", "-C", str(pasta), *argumentos],
            capture_output=True, text=True, encoding=CODIFICACAO, errors="replace",
            timeout=TEMPO_GIT_SEGUNDOS, check=False,
        )
    except (OSError, subprocess.SubprocessError):
        return ""
    return resultado.stdout.strip() if resultado.returncode == 0 else ""


def ler_git(pasta):
    """Coleta o estado do repositorio Git proprio do projeto.

    Args:
        pasta: Pasta do projeto.

    Returns:
        Dicionario com o estado do Git, ou None se a pasta nao tiver .git proprio.
    """
    if not (pasta / ".git").exists():
        return None
    ultimo = executar_git(pasta, "log", "-1", "--format=%h|%cs|%s")
    hash_curto, data, assunto = (ultimo.split("|", 2) + ["", "", ""])[:3]
    alteracoes = executar_git(pasta, "status", "--short")
    return {
        "remoto": executar_git(pasta, "remote", "get-url", "origin"),
        "branch": executar_git(pasta, "rev-parse", "--abbrev-ref", "HEAD"),
        "alteracoes": len(alteracoes.splitlines()) if alteracoes else 0,
        "ultimo_commit": {"hash": hash_curto, "data": data, "assunto": assunto[:120]},
    }


def numero(texto):
    """Converte um numero formatado ('1,234') do relatorio em inteiro.

    Args:
        texto: Numero como aparece no relatorio.

    Returns:
        O valor inteiro.
    """
    return int(re.sub(r"[^\d]", "", texto) or 0)


def interpretar_relatorio(linhas):
    """Extrai resumo, nos centrais e comunidades de um GRAPH_REPORT.md do graphify.

    Args:
        linhas: Linhas do relatorio.

    Returns:
        Dicionario com titulo, contagens, ``nos_centrais`` e ``comunidades``.
    """
    dados = {"titulo": "", "nos": 0, "arestas": 0, "comunidades": 0,
             "nos_centrais": [], "hubs": []}
    secao = ""
    for linha in linhas:
        if linha.startswith("# "):
            dados["titulo"] = linha[2:].strip()
        elif linha.startswith("## "):
            secao = linha[3:].strip().lower()
        elif secao == "summary" and REGEX_RESUMO_GRAFO.search(linha):
            nos, arestas, comunidades = REGEX_RESUMO_GRAFO.search(linha).groups()
            dados.update(nos=numero(nos), arestas=numero(arestas),
                         comunidades=numero(comunidades))
        elif secao.startswith("community hubs") and REGEX_HUB.match(linha):
            if len(dados["hubs"]) < LIMITE_HUBS:
                dados["hubs"].append(REGEX_HUB.match(linha).group(1))
        elif secao.startswith("god nodes") and REGEX_ITEM_GOD_NODE.match(linha):
            if len(dados["nos_centrais"]) < LIMITE_GOD_NODES:
                nome, arestas = REGEX_ITEM_GOD_NODE.match(linha).groups()
                dados["nos_centrais"].append({"nome": nome, "arestas": int(arestas)})
        elif secao.startswith("surprising"):
            break
    return dados


def ler_graphify(pasta):
    """Le o relatorio do graphify do projeto, se existir.

    Args:
        pasta: Pasta do projeto.

    Returns:
        Dicionario com o resumo do grafo, ou None se nao houver graphify-out.
    """
    relatorio = pasta / "graphify-out" / "GRAPH_REPORT.md"
    if not relatorio.is_file():
        return None
    dados = interpretar_relatorio(ler_texto(relatorio, limite=3_000_000).splitlines())
    dados["tem_html"] = (pasta / "graphify-out" / "graph.html").is_file()
    return dados


def dias_desde(data_iso):
    """Conta os dias entre uma data AAAA-MM-DD e hoje.

    Args:
        data_iso: Data no formato ISO, ou vazio.

    Returns:
        Numero de dias, ou None se a data for invalida.
    """
    try:
        data = datetime.strptime(data_iso, "%Y-%m-%d")
    except ValueError:
        return None
    return (datetime.now() - data).days


def classificar_situacao(git):
    """Classifica o projeto como ativo, parado ou sem controle de versao.

    Args:
        git: Dicionario retornado por ``ler_git`` (ou None).

    Returns:
        Uma entre "sem-git", "ativo" e "parado".
    """
    if git is None:
        return "sem-git"
    dias = dias_desde(git["ultimo_commit"]["data"])
    if dias is not None and dias <= DIAS_PROJETO_ATIVO:
        return "ativo"
    return "parado"


def gerar_alertas(pasta, git, medida):
    """Monta a lista de pontos de atencao do projeto.

    Args:
        pasta: Pasta do projeto.
        git: Estado do Git (ou None).
        medida: Resultado de ``medir_pasta``.

    Returns:
        Lista de textos de alerta.
    """
    alertas = []
    if git is None:
        alertas.append("Sem repositorio Git proprio: o codigo so existe neste disco.")
    elif git["alteracoes"]:
        alertas.append(f"{git['alteracoes']} alteracao(oes) sem commit.")
    if medida["bytes"] > LIMITE_TAMANHO_ALERTA:
        alertas.append("Pasta muito grande (mais de 2 GB): conferir o .gitignore antes do push.")
    if (pasta / ".env").exists():
        alertas.append("Arquivo .env presente no disco (conteudo nao lido): nunca versionar.")
    return alertas


def montar_projeto(pasta):
    """Reune todas as informacoes de um projeto.

    Args:
        pasta: Pasta do projeto.

    Returns:
        Dicionario serializavel com a analise completa do projeto.
    """
    descricao, origem = descobrir_descricao(pasta)
    git, medida = ler_git(pasta), medir_pasta(pasta)
    return {
        "nome": pasta.name,
        "caminho": str(pasta),
        "descricao": descricao or "Sem README, package.json, index.html ou AGENTS.md.",
        "fonte_descricao": origem,
        "stack": detectar_stack(pasta),
        "linguagens": medida["linguagens"],
        "tamanho_bytes": medida["bytes"],
        "arquivos": medida["arquivos"],
        "subpastas": sorted(p.name for p in pasta.iterdir()
                            if p.is_dir() and not p.name.startswith("."))[:LIMITE_SUBPASTAS],
        "situacao": classificar_situacao(git),
        "git": git,
        "graphify": ler_graphify(pasta),
        "alertas": gerar_alertas(pasta, git, medida),
    }


def montar_resumo(projetos):
    """Calcula os totais exibidos nos indicadores do dashboard.

    Args:
        projetos: Lista de projetos montados.

    Returns:
        Dicionario com os totais.
    """
    return {
        "total": len(projetos),
        "com_git": sum(1 for p in projetos if p["git"]),
        "sem_git": sum(1 for p in projetos if not p["git"]),
        "ativos": sum(1 for p in projetos if p["situacao"] == "ativo"),
        "com_graphify": sum(1 for p in projetos if p["graphify"]),
        "alteracoes_pendentes": sum(p["git"]["alteracoes"] for p in projetos if p["git"]),
        "tamanho_bytes": sum(p["tamanho_bytes"] for p in projetos),
        "alertas": sum(len(p["alertas"]) for p in projetos),
    }


def gravar_saidas(dados, caminho_json):
    """Grava o projetos.json e a copia projetos.js (para abrir o dashboard por file://).

    Args:
        dados: Estrutura completa da analise.
        caminho_json: Caminho do projetos.json; o .js fica ao lado.
    """
    texto = json.dumps(dados, ensure_ascii=False, indent=2)
    caminho_json.write_text(texto + "\n", encoding=CODIFICACAO)
    caminho_js = caminho_json.with_name(ARQUIVO_JS)
    caminho_js.write_text(f"window.{VARIAVEL_JS} = {texto};\n", encoding=CODIFICACAO)


def ler_argumentos():
    """Le os argumentos de linha de comando.

    Returns:
        Namespace com ``raiz`` e ``saida``.
    """
    analisador = argparse.ArgumentParser(description="Gera o projetos.json do dashboard.")
    analisador.add_argument("--raiz", default=str(Path.cwd()), help="Pasta com os projetos.")
    analisador.add_argument("--saida", default=None, help=f"Padrao: <raiz>/{ARQUIVO_JSON}.")
    return analisador.parse_args()


def main():
    """Analisa todos os projetos da raiz e grava o projetos.json.

    Returns:
        Codigo de saida do processo (0 em sucesso, 1 se a raiz nao existir).
    """
    argumentos = ler_argumentos()
    raiz = Path(argumentos.raiz).resolve()
    if not raiz.is_dir():
        print(f"Pasta nao encontrada: {raiz}", file=sys.stderr)
        return 1
    saida = Path(argumentos.saida) if argumentos.saida else raiz / ARQUIVO_JSON
    projetos = []
    for pasta in listar_projetos(raiz):
        print(f"Analisando {pasta.name}...")
        projetos.append(montar_projeto(pasta))
    dados = {
        "gerado_em": datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds"),
        "raiz": str(raiz),
        "resumo": montar_resumo(projetos),
        "projetos": projetos,
    }
    gravar_saidas(dados, saida)
    print(f"{len(projetos)} projetos gravados em {saida}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
