"""Gera assets/js/dados/ferramentas.js para a aba "Ferramentas de IA 3D" do dashboard.

Fontes: scripts/saida/coleta.json (rodar antes o coletar.py), scripts/saida/hf_3d.json
(rodar antes o coletar_hf.py) e as páginas de reels salvas em MODELOS-DE-IA/.
Uso: python dashboard/scripts/gerar_dados_painel.py
"""
import json
from pathlib import Path

from config_coleta import ARQUIVO_SAIDA, LINKS_MANUAIS
from leitor_instagram import ler_reels_salvos
from precos import precos_do_link

ARQUIVO_JS = Path(__file__).resolve().parent.parent / "assets" / "js" / "dados" / "ferramentas.js"
ARQUIVO_HF = Path(__file__).resolve().parent / "saida" / "hf_3d.json"
FONTE_HF = "https://huggingface.co/models?pipeline_tag=text-to-3d"
MAX_TITULOS_ARTIGO = 15
TAMANHO_MAX_TITULO = 80

# Tipo provável de cada link (WEB-SCRAP.md, seção 2). Confirmado como fato quando a página
# mostra formatos de exportação 3D.
TIPOS = {
    "L01": "reel", "L02": "reel", "L03": "reel",
    "L04": "gerador_modelo_3d", "L05": "gerador_modelo_3d", "L06": "gerador_modelo_3d",
    "L07": "gerador_modelo_3d", "L08": "artigo_comparativo", "L09": "artigo_comparativo",
    "L10": "gerador_modelo_3d",
}


def natureza_do_tipo(link):
    """'fato' se a página mostra formatos 3D exportáveis; senão 'provavel'."""
    if TIPOS[link["id"]] == "gerador_modelo_3d" and link.get("formatos_exportacao"):
        return "fato"
    return "provavel"


def titulos_do_artigo(link):
    """Nos artigos comparativos, os h2/h3 costumam ser as ferramentas citadas."""
    if TIPOS[link["id"]] != "artigo_comparativo":
        return []
    curtos = [t for t in link.get("titulos", [])[1:] if len(t) <= TAMANHO_MAX_TITULO]
    return list(dict.fromkeys(curtos))[:MAX_TITULOS_ARTIGO]


def resumo_extras(link):
    """URL, acesso e título de cada página extra (preço, termos, API)."""
    return [
        {"url": e["url"], "acessou": e.get("acessou", False), "titulo": e.get("titulo", "")}
        for e in link.get("paginas_extras", [])
    ]


def montar_site(link, cotacao):
    """Registro de um site (L04 a L10), sem o texto bruto da página."""
    return {
        "id": link["id"],
        "url": link["url"],
        "tipo": TIPOS[link["id"]],
        "tipo_natureza": natureza_do_tipo(link),
        "acessou": link.get("acessou", False),
        "erro": link.get("erro"),
        "titulo": link.get("titulo", ""),
        "descricao": link.get("descricao", ""),
        "formatos": link.get("formatos_exportacao", []),
        "precos": precos_do_link(link, cotacao) if link.get("acessou") else [],
        "ferramentas_citadas": titulos_do_artigo(link),
        "paginas_extras": resumo_extras(link),
    }


def montar_reel(id_link, url, reels_por_codigo):
    """Registro de um reel (L01 a L03), com a legenda da página salva se existir."""
    codigo = url.rstrip("/").split("/")[-1]
    salvo = reels_por_codigo.get(codigo)
    registro = {"id": id_link, "url": url, "tipo": "reel", "tipo_natureza": "fato",
                "perfil": url.split("instagram.com/")[1].split("/")[0], "salvo": bool(salvo)}
    if salvo:
        registro.update({k: v for k, v in salvo.items() if v and k != "perfil"})
    return registro


def modelos_3d_abertos():
    """Modelos 3D abertos do Hugging Face (coletar_hf.py); vazio se a coleta não rodou."""
    if not ARQUIVO_HF.exists():
        print("aviso: scripts/saida/hf_3d.json não existe; rode python dashboard/scripts/coletar_hf.py")
        return {"data_consulta": None, "fonte": FONTE_HF, "modelos": []}
    return json.loads(ARQUIVO_HF.read_text(encoding="utf-8"))


def montar_dados(coleta):
    """Junta reels, sites e modelos abertos no formato lido pela aba."""
    cotacao = coleta.get("cotacao_usd_brl", {})
    reels_por_codigo = {r["codigo"]: r for r in ler_reels_salvos() if r.get("codigo")}
    sites = [l for l in coleta["links"] if l["id"] not in LINKS_MANUAIS]
    return {
        "data_consulta": coleta["data_consulta"],
        "cotacao_usd_brl": cotacao,
        "reels": [montar_reel(i, u, reels_por_codigo) for i, u in LINKS_MANUAIS.items()],
        "sites": [montar_site(l, cotacao.get("valor")) for l in sites],
        "modelos_3d_abertos": modelos_3d_abertos(),
    }


def main():
    coleta = json.loads(ARQUIVO_SAIDA.read_text(encoding="utf-8"))
    dados = montar_dados(coleta)
    ARQUIVO_JS.parent.mkdir(parents=True, exist_ok=True)
    corpo = json.dumps(dados, ensure_ascii=False, indent=2)
    ARQUIVO_JS.write_text(
        "// Gerado por dashboard/scripts/gerar_dados_painel.py. Não editar à mão.\n"
        f"export const DADOS_FERRAMENTAS = {corpo};\n",
        encoding="utf-8",
    )
    print(f"Gravado em {ARQUIVO_JS}")


if __name__ == "__main__":
    main()
