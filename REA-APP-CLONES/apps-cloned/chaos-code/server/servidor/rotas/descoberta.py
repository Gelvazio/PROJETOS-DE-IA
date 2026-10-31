"""Descoberta OAuth: metadados do servidor de autorização (RFC 8414)."""

from typing import Any

from fastapi import APIRouter, Request

from servidor.constantes import (
    CONCESSAO_CODIGO_AUTORIZACAO,
    CONCESSAO_RENOVACAO,
    ESCOPO_MCP_ESCRITA,
    ESCOPO_MCP_LEITURA,
    METODO_AUTENTICACAO_CLIENTE_PUBLICO,
    METODO_PKCE,
    ROTA_DESCOBERTA_OAUTH,
    ROTA_OAUTH_AUTORIZACAO,
    ROTA_OAUTH_REGISTRO,
    ROTA_OAUTH_REVOGACAO,
    ROTA_OAUTH_TOKEN,
    TIPO_RESPOSTA_CODIGO,
)

roteador = APIRouter()


def montar_metadados(url_base: str) -> dict[str, Any]:
    """Monta o documento de metadados do servidor de autorização.

    Args:
        url_base: Endereço do servidor, sem barra no fim (ex.: `http://127.0.0.1:3000`).

    Returns:
        Dicionário com os campos do RFC 8414 que este servidor oferece.
    """
    return {
        "issuer": url_base,
        "authorization_endpoint": url_base + ROTA_OAUTH_AUTORIZACAO,
        "token_endpoint": url_base + ROTA_OAUTH_TOKEN,
        "registration_endpoint": url_base + ROTA_OAUTH_REGISTRO,
        "revocation_endpoint": url_base + ROTA_OAUTH_REVOGACAO,
        "response_types_supported": [TIPO_RESPOSTA_CODIGO],
        "grant_types_supported": [CONCESSAO_CODIGO_AUTORIZACAO, CONCESSAO_RENOVACAO],
        "code_challenge_methods_supported": [METODO_PKCE],
        "token_endpoint_auth_methods_supported": [METODO_AUTENTICACAO_CLIENTE_PUBLICO],
        "revocation_endpoint_auth_methods_supported": [METODO_AUTENTICACAO_CLIENTE_PUBLICO],
        "scopes_supported": [ESCOPO_MCP_LEITURA, ESCOPO_MCP_ESCRITA],
    }


@roteador.get(ROTA_DESCOBERTA_OAUTH)
def descobrir_servidor_oauth(requisicao: Request) -> dict[str, Any]:
    """Responde os metadados OAuth usando o endereço pelo qual o cliente chegou.

    Args:
        requisicao: Requisição recebida (fornece o endereço base).

    Returns:
        Documento de metadados do servidor de autorização.
    """
    url_base = str(requisicao.base_url).rstrip("/")
    return montar_metadados(url_base)
