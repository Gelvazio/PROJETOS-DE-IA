"""Lê as páginas de reels do Instagram salvas à mão em dashboard/MODELOS-DE-IA."""
import re
from pathlib import Path

from bs4 import BeautifulSoup

PASTA_MODELOS = Path(__file__).resolve().parent.parent / "MODELOS-DE-IA"
PADRAO_REEL = re.compile(r"instagram\.com/(?:([\w.]+)/)?(?:reel|p)/([\w-]+)")
PADRAO_ENGAJAMENTO = re.compile(r"([\d.,]+[KM]?) likes, ([\d.,]+[KM]?) comments - ([\w.]+) no ([^:]+):")
TAMANHO_PREFIXO = 40


def ler_meta(sopa, chave):
    """Conteúdo de uma meta tag por property ou name; '' se não existir."""
    meta = sopa.find("meta", attrs={"property": chave}) or sopa.find("meta", attrs={"name": chave})
    return (meta.get("content") or "").strip() if meta else ""


def codigo_do_reel(html, sopa):
    """Código do reel (ex.: DeFwS5LA2fw) pela og:url ou pelo comentário 'saved from url'."""
    for origem in (ler_meta(sopa, "og:url"), html[:2000]):
        achado = PADRAO_REEL.search(origem)
        if achado:
            return achado.group(2), achado.group(1)
    return None, None


def legenda_completa(sopa, inicio):
    """Procura no corpo o elemento mais longo que começa com o início da legenda."""
    prefixo = inicio[:TAMANHO_PREFIXO]
    melhor = ""
    for no in sopa.find_all(string=lambda t: t and prefixo in t):
        texto = no.parent.get_text("\n", strip=True)
        if len(texto) > len(melhor):
            melhor = texto
    return melhor or inicio


def legenda_e_engajamento(sopa):
    """Separa curtidas, comentários, perfil, data e legenda da meta description."""
    descricao = ler_meta(sopa, "description") or ler_meta(sopa, "og:description")
    achado = PADRAO_ENGAJAMENTO.search(descricao)
    if not achado:
        h1 = sopa.find("h1")
        return {"legenda": h1.get_text("\n", strip=True) if h1 else ""}
    inicio = descricao[achado.end():].strip().strip('"').rstrip('". ')
    return {
        "curtidas": achado.group(1),
        "comentarios": achado.group(2),
        "data_publicacao": achado.group(4).strip(),
        "legenda": legenda_completa(sopa, inicio),
    }


def ler_pagina(caminho):
    """Dados públicos de uma página de reel salva."""
    html = caminho.read_text(encoding="utf-8", errors="ignore")
    sopa = BeautifulSoup(html, "html.parser")
    codigo, perfil = codigo_do_reel(html, sopa)
    tempo = sopa.find("time", attrs={"datetime": True})
    dados = {
        "pasta": caminho.parent.name,
        "codigo": codigo,
        "perfil": perfil,
        "autor": ler_meta(sopa, "og:title").split(" no Instagram")[0] or None,
        "data_iso": tempo["datetime"] if tempo else None,
    }
    dados.update(legenda_e_engajamento(sopa))
    return dados


def ler_reels_salvos():
    """Lista os reels salvos em MODELOS-DE-IA (um HTML por subpasta)."""
    if not PASTA_MODELOS.exists():
        return []
    return [ler_pagina(c) for c in sorted(PASTA_MODELOS.glob("*/*Instagram.html"))]
