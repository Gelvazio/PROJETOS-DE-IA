"""Autenticação Bearer da API: lê o token de acesso e entrega o usuário dono dele.

Regras (ETAPA-007, SERVIDOR.25; usada pelas rotas da API, SERVIDOR.40 a 45, e pela exigência de
administrador, SERVIDOR.26):

* O cliente manda ``Authorization: Bearer <access_token>`` (docs/inventario/api.md). O token é
  conferido pelo hash em ``banco/tokens_repositorio`` (só acesso, não revogado, não vencido).
* Falha → **401** com ``WWW-Authenticate: Bearer`` (RFC 6750, seção 3). Sem credencial, o
  cabeçalho não leva código de erro; token recusado leva ``error="invalid_token"``. O cliente
  original trata o 401 como "Sessão expirada" e tenta a renovação automática.
* A descrição do erro fica só no corpo: a RFC 6750 só permite ASCII no cabeçalho.
* Nada é gravado aqui: o 401 desfaz a transação do pedido sem perder nada.
"""

import sqlite3
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Request

from servidor.banco.conexao import obter_conexao
from servidor.banco.tokens_repositorio import TokenGuardado, buscar_token_acesso_valido
from servidor.banco.usuarios_repositorio import Usuario, buscar_usuario_por_id
from servidor.constantes import TIPO_TOKEN_BEARER
from servidor.mensagens import MSG_ERRO_NAO_AUTORIZADO, MSG_ERRO_TOKEN_INVALIDO
from servidor.rotas.erros import CODIGO_NAO_AUTORIZADO, STATUS_NAO_AUTORIZADO, ErroServidor

CABECALHO_AUTORIZACAO = "Authorization"
CABECALHO_DESAFIO = "WWW-Authenticate"
REINO_AUTENTICACAO = "chaos-code"
CODIGO_TOKEN_INVALIDO = "invalid_token"
DESAFIO_SEM_CREDENCIAL = f'{TIPO_TOKEN_BEARER} realm="{REINO_AUTENTICACAO}"'
DESAFIO_TOKEN_INVALIDO = (
    f'{DESAFIO_SEM_CREDENCIAL}, error="{CODIGO_TOKEN_INVALIDO}"'
)


class ErroNaoAutenticado(ErroServidor):
    """401 da API, com o desafio ``WWW-Authenticate: Bearer`` (RFC 6750)."""

    def __init__(self, token_recusado: bool) -> None:
        """Monta o 401 conforme o motivo.

        Args:
            token_recusado: True se veio um token Bearer e ele foi recusado (inválido, vencido
                ou revogado); False se não veio credencial Bearer.
        """
        if token_recusado:
            super().__init__(STATUS_NAO_AUTORIZADO, CODIGO_TOKEN_INVALIDO, MSG_ERRO_TOKEN_INVALIDO)
            self.cabecalhos = ((CABECALHO_DESAFIO, DESAFIO_TOKEN_INVALIDO),)
            return
        super().__init__(STATUS_NAO_AUTORIZADO, CODIGO_NAO_AUTORIZADO, MSG_ERRO_NAO_AUTORIZADO)
        self.cabecalhos = ((CABECALHO_DESAFIO, DESAFIO_SEM_CREDENCIAL),)


@dataclass(frozen=True)
class Autenticacao:
    """Quem fez o pedido: o usuário e o token de acesso usado (cliente, escopo, família)."""

    usuario: Usuario
    token: TokenGuardado


def extrair_token_bearer(cabecalho: str | None) -> str | None:
    """Tira o token do cabeçalho ``Authorization: Bearer <token>``.

    O esquema não diferencia maiúsculas (RFC 7235); espaços nas pontas são ignorados.

    Args:
        cabecalho: Valor do cabeçalho ``Authorization`` (pode faltar).

    Returns:
        O token (pode ser texto vazio se veio só ``Bearer``), ou None se não houver cabeçalho
        ou o esquema não for Bearer.
    """
    if not cabecalho:
        return None

    esquema, _, token = cabecalho.strip().partition(" ")
    if esquema.lower() != TIPO_TOKEN_BEARER.lower():
        return None
    return token.strip()


def autenticar_token(conexao: sqlite3.Connection, token: str | None) -> Autenticacao:
    """Confere o token Bearer e busca o usuário dono dele.

    Args:
        conexao: Conexão aberta.
        token: Token tirado do cabeçalho (None se não veio credencial Bearer).

    Returns:
        Usuário e token de acesso em vigor.

    Raises:
        ErroNaoAutenticado: Sem credencial, token fora do formato, inexistente, vencido,
            revogado, de renovação, ou de usuário que não existe mais.
    """
    if token is None:
        raise ErroNaoAutenticado(token_recusado=False)

    token_guardado = buscar_token_acesso_valido(conexao, token)
    if token_guardado is None:
        raise ErroNaoAutenticado(token_recusado=True)

    usuario = buscar_usuario_por_id(conexao, token_guardado.id_usuario)
    if usuario is None:
        raise ErroNaoAutenticado(token_recusado=True)
    return Autenticacao(usuario=usuario, token=token_guardado)


def obter_autenticacao(
    requisicao: Request,
    conexao: Annotated[sqlite3.Connection, Depends(obter_conexao)],
) -> Autenticacao:
    """Dependência FastAPI: exige ``Authorization: Bearer`` válido (``Depends(...)``).

    Args:
        requisicao: Requisição recebida.
        conexao: Conexão do pedido (a mesma que a rota recebe).

    Returns:
        Usuário e token de acesso do pedido.

    Raises:
        ErroNaoAutenticado: 401 com ``WWW-Authenticate``.
    """
    token = extrair_token_bearer(requisicao.headers.get(CABECALHO_AUTORIZACAO))
    return autenticar_token(conexao, token)


def obter_usuario_atual(
    autenticacao: Annotated[Autenticacao, Depends(obter_autenticacao)],
) -> Usuario:
    """Dependência FastAPI: o usuário dono do token Bearer (``Depends(obter_usuario_atual)``).

    Args:
        autenticacao: Resultado de ``obter_autenticacao``.

    Returns:
        Usuário autenticado (sem hash de senha).
    """
    return autenticacao.usuario
