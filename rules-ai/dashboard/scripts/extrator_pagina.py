"""Abre uma página com o Playwright e extrai os dados públicos dela."""
from playwright.sync_api import TimeoutError as ErroTempo

from config_coleta import (
    ESPERA_EXTRA_MS,
    PADRAO_ANTIBOT,
    PADRAO_FORMATO,
    PADRAO_LINK_IGNORADO,
    PADRAO_PRECO,
    PADROES_LINK_UTIL,
    TEMPO_LIMITE_MS,
)


def abrir(pagina, url):
    """Abre a URL esperando a rede ficar ociosa; se não chegar, aceita o load."""
    try:
        resposta = pagina.goto(url, wait_until="networkidle", timeout=TEMPO_LIMITE_MS)
    except ErroTempo:
        resposta = pagina.goto(url, wait_until="load", timeout=TEMPO_LIMITE_MS)
        pagina.wait_for_timeout(ESPERA_EXTRA_MS)
    return resposta.status if resposta else None


def ler_descricao(pagina):
    """Devolve a meta description ou a og:description, se existir."""
    for seletor in ("meta[name='description']", "meta[property='og:description']"):
        meta = pagina.locator(seletor)
        if meta.count():
            return meta.first.get_attribute("content") or ""
    return ""


def prioridade_link(href):
    """Posição do link em PADROES_LINK_UTIL, ou None se não for útil."""
    if PADRAO_LINK_IGNORADO.search(href):
        return None
    for posicao, padrao in enumerate(PADROES_LINK_UTIL):
        if padrao.search(href):
            return posicao
    return None


def ler_links_uteis(pagina):
    """Links de preços, licença/termos e API, nessa ordem de prioridade."""
    hrefs = pagina.eval_on_selector_all("a[href]", "els => els.map(e => e.href)")
    uteis = {}
    for href in hrefs:
        limpo = href.split("#")[0]
        posicao = prioridade_link(limpo)
        if posicao is not None:
            uteis[limpo] = posicao
    return sorted(uteis, key=lambda h: (uteis[h], h))


def ler_titulos(pagina):
    """Títulos h1 a h3; nos artigos comparativos costumam ser as ferramentas citadas."""
    textos = pagina.eval_on_selector_all("h1, h2, h3", "els => els.map(e => e.innerText)")
    return [t.strip() for t in textos if t and t.strip()]


def extrair(pagina, id_link, url):
    """Abre a URL e devolve o dicionário com os dados coletados."""
    status = abrir(pagina, url)
    texto = pagina.inner_text("body")
    if PADRAO_ANTIBOT.search(texto[:2000]):
        erro = "nao_verificado: página de verificação anti-bot (não burlada); coletar à mão"
        return {"id": id_link, "url": url, "status_http": status, "acessou": False, "erro": erro}
    return {
        "id": id_link,
        "url": url,
        "url_final": pagina.url,
        "status_http": status,
        "acessou": status is not None and status < 400,
        "titulo": pagina.title(),
        "descricao": ler_descricao(pagina),
        "titulos": ler_titulos(pagina),
        "trechos_preco": sorted({m.group(0) for m in PADRAO_PRECO.finditer(texto)}),
        "formatos_exportacao": sorted(set(PADRAO_FORMATO.findall(texto))),
        "links_uteis": ler_links_uteis(pagina),
        "texto": texto,
    }


def extrair_seguro(pagina, id_link, url):
    """Igual a extrair, mas registra a falha em vez de interromper a coleta."""
    try:
        return extrair(pagina, id_link, url)
    except Exception as erro:  # timeout, 403, rede: registra e segue
        return {"id": id_link, "url": url, "acessou": False, "erro": str(erro)[:500]}
