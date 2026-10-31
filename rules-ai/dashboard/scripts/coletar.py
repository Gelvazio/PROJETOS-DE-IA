"""Coleta o texto público dos links L04 a L10 do dashboard/CLAUDE.md.

Uso: python dashboard/scripts/coletar.py
Saída: dashboard/scripts/saida/coleta.json
"""
import json
import time
from datetime import datetime

from playwright.sync_api import sync_playwright

from config_coleta import (
    ARQUIVO_SAIDA,
    LINKS,
    LINKS_MANUAIS,
    MAX_LINKS_UTEIS,
    PASTA_SAIDA,
    PAUSA_SEGUNDOS,
    USER_AGENT,
)
from cotacao import buscar_cotacao
from extrator_pagina import extrair_seguro


def registros_manuais():
    """Reels do Instagram: não coletados, marcados para coleta manual."""
    motivo = "nao_verificado: Instagram exige login e proíbe coleta automática; cole a legenda"
    return [
        {"id": id_link, "url": url, "acessou": False, "erro": motivo}
        for id_link, url in LINKS_MANUAIS.items()
    ]


def coletar_paginas_extras(pagina, principal):
    """Coleta até MAX_LINKS_UTEIS páginas de preço, API ou termos achadas na principal."""
    extras = []
    for indice, url in enumerate(principal.get("links_uteis", [])[:MAX_LINKS_UTEIS], 1):
        time.sleep(PAUSA_SEGUNDOS)
        print(f"  extra {indice}: {url}")
        extras.append(extrair_seguro(pagina, f"{principal['id']}-extra{indice}", url))
    return extras


def coletar_links(pagina):
    """Percorre os links principais e as páginas extras de cada um."""
    resultados = []
    for id_link, url in LINKS.items():
        print(f"{id_link}: {url}")
        principal = extrair_seguro(pagina, id_link, url)
        if principal["acessou"]:
            principal["paginas_extras"] = coletar_paginas_extras(pagina, principal)
        resultados.append(principal)
        time.sleep(PAUSA_SEGUNDOS)
    return resultados


def gravar(resultados, cotacao):
    """Grava o JSON final em PASTA_SAIDA."""
    PASTA_SAIDA.mkdir(parents=True, exist_ok=True)
    saida = {
        "data_consulta": datetime.now().isoformat(timespec="minutes"),
        "cotacao_usd_brl": cotacao,
        "links": registros_manuais() + resultados,
    }
    ARQUIVO_SAIDA.write_text(json.dumps(saida, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Gravado em {ARQUIVO_SAIDA}")


def main():
    cotacao = buscar_cotacao()
    with sync_playwright() as p:
        navegador = p.chromium.launch()
        contexto = navegador.new_context(locale="pt-BR", user_agent=USER_AGENT)
        resultados = coletar_links(contexto.new_page())
        navegador.close()
    gravar(resultados, cotacao)


if __name__ == "__main__":
    main()
