"""Normaliza os trechos de preço coletados e converte dólar em real."""
import re

PADRAO_NUMERO = re.compile(r"\d[\d.,]*")


def limpar(trecho):
    """Junta quebras de linha e espaços repetidos ('R$\\n24,95' -> 'R$ 24,95')."""
    return re.sub(r"\s+", " ", trecho).strip()


def moeda_do_trecho(trecho):
    """'BRL', 'USD', 'EUR' ou 'creditos'."""
    if trecho.startswith("R$"):
        return "BRL"
    if trecho.startswith(("US$", "$")):
        return "USD"
    if trecho.startswith("€"):
        return "EUR"
    return "creditos"


def numero(texto, moeda):
    """Converte o número do trecho: BRL usa vírgula decimal, as demais usam ponto."""
    bruto = PADRAO_NUMERO.search(texto).group(0).rstrip(".,")
    if moeda == "BRL":
        return float(bruto.replace(".", "").replace(",", "."))
    if moeda == "creditos":
        return float(bruto.replace(".", "").replace(",", ""))
    if re.fullmatch(r"\d+,\d{1,2}", bruto):  # "US$1,5" em página pt: vírgula decimal
        return float(bruto.replace(",", "."))
    return float(bruto.replace(",", ""))


def converter(trecho, cotacao, fonte):
    """Dicionário do preço com o valor original e, se for dólar, o valor em reais."""
    texto = limpar(trecho)
    moeda = moeda_do_trecho(texto)
    valor = numero(texto, moeda)
    preco = {"texto": texto, "moeda": moeda, "valor": valor, "fonte": fonte}
    if moeda == "USD" and cotacao:
        preco["valor_brl"] = round(valor * cotacao, 2)
    if moeda == "BRL":
        preco["valor_brl"] = valor
    return preco


def precos_do_link(link, cotacao):
    """Preços da página principal e das extras, sem repetição, do menor ao maior."""
    paginas = [link] + [e for e in link.get("paginas_extras", []) if e.get("acessou")]
    vistos = {}
    for pagina in paginas:
        for trecho in pagina.get("trechos_preco", []):
            preco = converter(trecho, cotacao, pagina["url"])
            vistos.setdefault(preco["texto"], preco)
    ordem = {"BRL": 0, "USD": 1, "EUR": 2, "creditos": 3}
    return sorted(vistos.values(), key=lambda p: (ordem[p["moeda"]], p["valor"]))
