"""Erros padronizados: formato OAuth nas rotas `/api/oauth/*` e JSON simples no resto da API.

Nenhuma resposta de erro carrega detalhe interno (pilha, SQL, caminho): o detalhe vai só para o
registro do servidor.
"""

import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as ExcecaoHttp

from servidor.constantes import PREFIXO_ROTAS_OAUTH
from servidor.mensagens import (
    MSG_ERRO_ACESSO_NEGADO,
    MSG_ERRO_CAMPO_OBRIGATORIO,
    MSG_ERRO_INTERNO,
    MSG_ERRO_NAO_AUTORIZADO,
    MSG_ERRO_NAO_ENCONTRADO,
)

registro = logging.getLogger(__name__)

STATUS_PEDIDO_INVALIDO = 400
STATUS_NAO_AUTORIZADO = 401
STATUS_ACESSO_NEGADO = 403
STATUS_NAO_ENCONTRADO = 404
STATUS_ERRO_INTERNO = 500

CODIGO_PEDIDO_INVALIDO = "invalid_request"
CODIGO_NAO_AUTORIZADO = "unauthorized"
CODIGO_ACESSO_NEGADO = "access_denied"
CODIGO_NAO_ENCONTRADO = "not_found"
CODIGO_ERRO_INTERNO = "server_error"

CODIGO_POR_STATUS = {
    STATUS_PEDIDO_INVALIDO: CODIGO_PEDIDO_INVALIDO,
    STATUS_NAO_AUTORIZADO: CODIGO_NAO_AUTORIZADO,
    STATUS_ACESSO_NEGADO: CODIGO_ACESSO_NEGADO,
    STATUS_NAO_ENCONTRADO: CODIGO_NAO_ENCONTRADO,
}
MENSAGEM_POR_STATUS = {
    STATUS_PEDIDO_INVALIDO: MSG_ERRO_CAMPO_OBRIGATORIO,
    STATUS_NAO_AUTORIZADO: MSG_ERRO_NAO_AUTORIZADO,
    STATUS_ACESSO_NEGADO: MSG_ERRO_ACESSO_NEGADO,
    STATUS_NAO_ENCONTRADO: MSG_ERRO_NAO_ENCONTRADO,
}


class ErroServidor(Exception):
    """Erro previsto, que as rotas lançam para virar uma resposta padronizada."""

    # Cabeçalhos extras da resposta (ex.: `WWW-Authenticate` no 401); subclasses preenchem.
    cabecalhos: tuple[tuple[str, str], ...] = ()

    def __init__(self, status: int, codigo: str, descricao: str) -> None:
        """Guarda os três dados da resposta.

        Args:
            status: Código HTTP (ex.: 400).
            codigo: Código curto do erro (ex.: `invalid_grant`).
            descricao: Texto para a pessoa, sem detalhe interno.
        """
        super().__init__(descricao)
        self.status = status
        self.codigo = codigo
        self.descricao = descricao


def montar_corpo_erro(caminho: str, codigo: str, descricao: str) -> dict[str, Any]:
    """Escolhe o formato do corpo conforme a rota que falhou.

    Args:
        caminho: Caminho da requisição (ex.: `/api/oauth/token`).
        codigo: Código curto do erro.
        descricao: Texto do erro.

    Returns:
        `{"error", "error_description"}` nas rotas OAuth; `{"error", "message"}` nas demais.
    """
    if caminho.startswith(PREFIXO_ROTAS_OAUTH):
        return {"error": codigo, "error_description": descricao}

    return {"error": codigo, "message": descricao}


def responder_erro(requisicao: Request, status: int, codigo: str, descricao: str) -> JSONResponse:
    """Cria a resposta JSON de erro no formato da rota.

    Args:
        requisicao: Requisição que falhou.
        status: Código HTTP.
        codigo: Código curto do erro.
        descricao: Texto do erro.

    Returns:
        Resposta JSON pronta.
    """
    corpo = montar_corpo_erro(requisicao.url.path, codigo, descricao)
    return JSONResponse(status_code=status, content=corpo)


async def tratar_erro_servidor(requisicao: Request, erro: ErroServidor) -> JSONResponse:
    """Transforma um `ErroServidor` em resposta, com os cabeçalhos extras do erro."""
    resposta = responder_erro(requisicao, erro.status, erro.codigo, erro.descricao)
    resposta.headers.update(dict(erro.cabecalhos))
    return resposta


async def tratar_erro_http(requisicao: Request, erro: ExcecaoHttp) -> JSONResponse:
    """Transforma erros HTTP do framework (404, 405…) em resposta, sem repassar `detail`."""
    codigo = CODIGO_POR_STATUS.get(erro.status_code, CODIGO_PEDIDO_INVALIDO)
    descricao = MENSAGEM_POR_STATUS.get(erro.status_code, MSG_ERRO_CAMPO_OBRIGATORIO)
    return responder_erro(requisicao, erro.status_code, codigo, descricao)


async def tratar_erro_validacao(requisicao: Request, erro: RequestValidationError) -> JSONResponse:
    """Transforma erro de validação em 400 com mensagem fixa (os campos ficam só no registro)."""
    registro.info("Pedido inválido em %s: %s", requisicao.url.path, erro.errors())
    return responder_erro(
        requisicao, STATUS_PEDIDO_INVALIDO, CODIGO_PEDIDO_INVALIDO, MSG_ERRO_CAMPO_OBRIGATORIO
    )


async def tratar_erro_inesperado(requisicao: Request, erro: Exception) -> JSONResponse:
    """Transforma qualquer falha não prevista em 500 genérico; o detalhe vai para o registro."""
    registro.exception("Erro inesperado em %s", requisicao.url.path, exc_info=erro)
    return responder_erro(
        requisicao, STATUS_ERRO_INTERNO, CODIGO_ERRO_INTERNO, MSG_ERRO_INTERNO
    )


def registrar_tratadores_de_erro(aplicativo: FastAPI) -> None:
    """Liga os tratadores acima ao aplicativo FastAPI.

    Args:
        aplicativo: Aplicativo que receberá os tratadores.
    """
    aplicativo.add_exception_handler(ErroServidor, tratar_erro_servidor)
    aplicativo.add_exception_handler(ExcecaoHttp, tratar_erro_http)
    aplicativo.add_exception_handler(RequestValidationError, tratar_erro_validacao)
    aplicativo.add_exception_handler(Exception, tratar_erro_inesperado)
