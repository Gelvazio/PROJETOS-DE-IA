"""Extrai os posts da categoria produtividade do site andrelug.com.

Lê a listagem da categoria, segue o link de cada post e salva título, link,
texto do conteúdo e eventual erro num arquivo JSON ao lado deste script.
"""
import json
import urllib.request
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse

URL_CATEGORIA = "https://andrelug.com/categoria/produtividade"
DOMINIO_SITE = "andrelug.com"
CABECALHO_REQUISICAO = {"User-Agent": "Mozilla/5.0"}
TEMPO_LIMITE_SEGUNDOS = 30
ARQUIVO_SAIDA = Path(__file__).with_name("posts-produtividade.json")
TAGS_TITULO = {"h1", "h2", "h3", "h4"}
TAGS_CONTEUDO = {"article", "main"}
TAGS_IGNORADAS = {"script", "style", "noscript", "nav", "header", "footer"}
PREFIXOS_IGNORADOS = ("/categoria", "/tag", "/autor")


class ExtratorPosts(HTMLParser):
    """Coleta os links que estão dentro de títulos da página."""

    def __init__(self):
        """Inicia o estado do extrator."""
        super().__init__()
        self.dentro_titulo = False
        self.link_atual = None
        self.textos_link = []
        self.posts = []

    def handle_starttag(self, tag, attrs):
        """Marca entrada em títulos e em links dentro deles."""
        if tag in TAGS_TITULO:
            self.dentro_titulo = True
        if tag == "a" and self.dentro_titulo:
            self.link_atual = dict(attrs).get("href")
            self.textos_link = []

    def handle_endtag(self, tag):
        """Fecha o link atual e guarda o post com o texto do link."""
        if tag in TAGS_TITULO:
            self.dentro_titulo = False
        if tag != "a" or self.link_atual is None:
            return
        titulo = " ".join(self.textos_link).strip()
        self.posts.append({"titulo": titulo, "link": self.link_atual})
        self.link_atual = None

    def handle_data(self, data):
        """Acumula o texto visível de um link."""
        if self.link_atual is not None:
            self.textos_link.append(data.strip())


class ExtratorTexto(HTMLParser):
    """Coleta o texto visível do conteúdo principal da página."""

    def __init__(self):
        """Inicia o estado do extrator."""
        super().__init__()
        self.profundidade_conteudo = 0
        self.profundidade_ignorada = 0
        self.existe_bloco_conteudo = False
        self.partes = []

    def handle_starttag(self, tag, attrs):
        """Controla a entrada em blocos de conteúdo e em blocos ignorados."""
        if tag in TAGS_CONTEUDO:
            self.profundidade_conteudo += 1
            self.existe_bloco_conteudo = True
        if tag in TAGS_IGNORADAS:
            self.profundidade_ignorada += 1

    def handle_endtag(self, tag):
        """Controla a saída de blocos de conteúdo e de blocos ignorados."""
        if tag in TAGS_CONTEUDO and self.profundidade_conteudo:
            self.profundidade_conteudo -= 1
        if tag in TAGS_IGNORADAS and self.profundidade_ignorada:
            self.profundidade_ignorada -= 1

    def handle_data(self, data):
        """Guarda o texto quando ele está no conteúdo principal."""
        if self.profundidade_ignorada:
            return
        if self.existe_bloco_conteudo and not self.profundidade_conteudo:
            return
        texto = data.strip()
        if texto:
            self.partes.append(texto)


def baixar_html(url):
    """Baixa a página e devolve o HTML como texto.

    Parâmetros: url (str) endereço a baixar.
    Retorno: str com o HTML.
    Exceções: OSError quando a rede falha ou o servidor recusa.
    """
    requisicao = urllib.request.Request(url, headers=CABECALHO_REQUISICAO)
    with urllib.request.urlopen(requisicao, timeout=TEMPO_LIMITE_SEGUNDOS) as resposta:
        return resposta.read().decode("utf-8", errors="replace")


def e_post_do_site(link):
    """Diz se o link aponta para um post do próprio site.

    Parâmetros: link (str) endereço absoluto.
    Retorno: bool.
    """
    endereco = urlparse(link)
    if not endereco.netloc.endswith(DOMINIO_SITE):
        return False
    return not endereco.path.startswith(PREFIXOS_IGNORADOS)


def extrair_posts(html, url_base):
    """Lista os posts da página, sem repetição e com título.

    Parâmetros: html (str) página da listagem; url_base (str) endereço dela.
    Retorno: lista de dicionários com titulo e link.
    """
    extrator = ExtratorPosts()
    extrator.feed(html)
    vistos = set()
    posts = []
    for item in extrator.posts:
        link = urljoin(url_base, item["link"]).split("#")[0]
        if not item["titulo"] or link in vistos or not e_post_do_site(link):
            continue
        vistos.add(link)
        posts.append({"titulo": item["titulo"], "link": link})
    return posts


def extrair_texto(html):
    """Devolve o texto principal de uma página de post.

    Parâmetros: html (str) página do post.
    Retorno: str com os trechos de texto unidos por quebra de linha.
    """
    extrator = ExtratorTexto()
    extrator.feed(html)
    return "\n".join(extrator.partes)


def coletar_conteudo(post):
    """Baixa o post e junta o texto dele aos dados da listagem.

    Parâmetros: post (dict) com titulo e link.
    Retorno: dict com titulo, link, conteudo e erro (None quando deu certo).
    """
    try:
        html = baixar_html(post["link"])
    except OSError as erro:
        return {**post, "conteudo": None, "erro": str(erro)}
    return {**post, "conteudo": extrair_texto(html), "erro": None}


def salvar_json(registros, caminho):
    """Grava os registros em JSON com acentos preservados.

    Parâmetros: registros (list) dados a gravar; caminho (Path) arquivo de saída.
    Retorno: None.
    """
    with caminho.open("w", encoding="utf-8") as arquivo:
        json.dump(registros, arquivo, ensure_ascii=False, indent=2)


def executar():
    """Faz a extração completa e mostra o resumo no terminal.

    Retorno: None.
    """
    html = baixar_html(URL_CATEGORIA)
    posts = extrair_posts(html, URL_CATEGORIA)
    print(f"{len(posts)} posts encontrados na listagem.")
    registros = [coletar_conteudo(post) for post in posts]
    salvar_json(registros, ARQUIVO_SAIDA)
    falhas = sum(1 for registro in registros if registro["erro"])
    print(f"{len(registros) - falhas} posts extraídos, {falhas} com erro.")
    print(f"Arquivo salvo em {ARQUIVO_SAIDA}")


if __name__ == "__main__":
    executar()
