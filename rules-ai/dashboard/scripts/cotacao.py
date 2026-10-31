"""Cotação do dólar em reais pela AwesomeAPI (gratuita, sem chave)."""
import requests

URL_COTACAO = "https://economia.awesomeapi.com.br/json/last/USD-BRL"


def buscar_cotacao():
    """Devolve {'valor': float, 'data': str} ou {'erro': str} se a API falhar."""
    try:
        resposta = requests.get(URL_COTACAO, timeout=30)
        resposta.raise_for_status()
        dados = resposta.json()["USDBRL"]
        return {"valor": float(dados["bid"]), "data": dados["create_date"], "fonte": URL_COTACAO}
    except Exception as erro:  # sem cotação a coleta continua
        return {"erro": str(erro)[:300], "fonte": URL_COTACAO}
