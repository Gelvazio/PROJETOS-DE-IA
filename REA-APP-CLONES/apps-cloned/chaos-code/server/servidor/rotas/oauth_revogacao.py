"""Revogação de token: ``POST /api/oauth/revoke`` (RFC 7009).

Regras (ETAPA-007, SERVIDOR.38; cliente em ``src/main/login/revogacao.ts``, CLONE.4.9):

* Corpo com ``token``, ``token_type_hint`` e ``client_id`` (docs/inventario/login.md,
  "Revogação (logout)"). O cliente do clone manda **JSON**; o formulário
  ``application/x-www-form-urlencoded`` da RFC 7009 também é aceito.
* Cliente público: não há segredo, então o ``client_id`` é obrigatório e só o cliente dono do
  token consegue revogá-lo (``tokens_repositorio.revogar_token``). Revogar a renovação derruba a
  família inteira (RFC 7009, seção 2.1).
* Responde **200** sem corpo quando o pedido está bem formado, mesmo com token desconhecido, já
  revogado ou de outro cliente (seção 2.2): a resposta não revela se o token existia.
* A ``token_type_hint`` é ignorada: o tipo vem do banco (a RFC permite).
* Pedido mal formado (sem ``token`` ou sem ``client_id``, corpo ilegível) → 400
  ``invalid_request`` no formato OAuth (``rotas/erros.py``), antes de qualquer gravação.
"""

import sqlite3
from collections.abc import Awaitable, Callable
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request, Response
from pydantic import ValidationError

from servidor.banco.conexao import obter_conexao
from servidor.banco.tokens_repositorio import PedidoComCliente, revogar_token
from servidor.constantes import ROTA_OAUTH_REVOGACAO
from servidor.esquemas.oauth import PedidoRevogacao
from servidor.mensagens import MSG_ERRO_CAMPO_OBRIGATORIO
from servidor.rotas.erros import CODIGO_PEDIDO_INVALIDO, STATUS_PEDIDO_INVALIDO, ErroServidor

TIPO_CONTEUDO_JSON = "application/json"
TIPO_CONTEUDO_FORMULARIO = "application/x-www-form-urlencoded"
CABECALHO_TIPO_CONTEUDO = "content-type"
SEPARADOR_PARAMETROS_TIPO = ";"
STATUS_REVOGACAO_ACEITA = 200
# Resposta de endpoint OAuth não vai para cache (RFC 6749, seção 5.1).
CABECALHOS_SEM_CACHE = {"Cache-Control": "no-store", "Pragma": "no-cache"}

roteador = APIRouter()

LeitorCorpo = Callable[[Request], Awaitable[Any]]


async def ler_corpo_json(requisicao: Request) -> Any:
    """Lê o corpo em JSON.

    Args:
        requisicao: Requisição recebida.

    Returns:
        Valor do JSON (o esquema confere se é um objeto).

    Raises:
        ValueError: Se o corpo não for JSON válido.
    """
    return await requisicao.json()


async def ler_corpo_formulario(requisicao: Request) -> dict[str, Any]:
    """Lê o corpo como formulário ``application/x-www-form-urlencoded`` (RFC 7009).

    Args:
        requisicao: Requisição recebida.

    Returns:
        Campos do formulário.
    """
    return dict(await requisicao.form())


LEITORES_POR_TIPO: dict[str, LeitorCorpo] = {
    TIPO_CONTEUDO_JSON: ler_corpo_json,
    TIPO_CONTEUDO_FORMULARIO: ler_corpo_formulario,
}


def criar_erro_pedido_invalido() -> ErroServidor:
    """Cria o 400 ``invalid_request`` da revogação.

    Returns:
        Erro pronto para ser lançado (vira ``{"error", "error_description"}``).
    """
    return ErroServidor(STATUS_PEDIDO_INVALIDO, CODIGO_PEDIDO_INVALIDO, MSG_ERRO_CAMPO_OBRIGATORIO)


def obter_tipo_conteudo(requisicao: Request) -> str:
    """Tira o tipo do corpo do cabeçalho ``Content-Type``, sem parâmetros (ex.: ``charset``).

    Args:
        requisicao: Requisição recebida.

    Returns:
        Tipo em minúsculas (texto vazio se faltar o cabeçalho).
    """
    valor = requisicao.headers.get(CABECALHO_TIPO_CONTEUDO, "")
    return valor.split(SEPARADOR_PARAMETROS_TIPO, 1)[0].strip().lower()


async def ler_pedido_revogacao(requisicao: Request) -> PedidoRevogacao:
    """Lê e confere o pedido de revogação (JSON ou formulário).

    Args:
        requisicao: Requisição recebida.

    Returns:
        Pedido com ``token`` e ``client_id`` preenchidos.

    Raises:
        ErroServidor: 400 ``invalid_request`` se o tipo do corpo não for aceito, o corpo for
            ilegível ou faltar ``token`` ou ``client_id``.
    """
    leitor = LEITORES_POR_TIPO.get(obter_tipo_conteudo(requisicao))
    if leitor is None:
        raise criar_erro_pedido_invalido()

    try:
        pedido = PedidoRevogacao.model_validate(await leitor(requisicao))
    except (ValueError, ValidationError) as erro:
        raise criar_erro_pedido_invalido() from erro

    if not pedido.token or not pedido.id_cliente:
        raise criar_erro_pedido_invalido()
    return pedido


@roteador.post(ROTA_OAUTH_REVOGACAO)
async def revogar(
    requisicao: Request,
    conexao: Annotated[sqlite3.Connection, Depends(obter_conexao)],
) -> Response:
    """Revoga o token do pedido e responde 200 em qualquer caso de pedido bem formado.

    Args:
        requisicao: Requisição com ``token``, ``token_type_hint`` e ``client_id``.
        conexao: Conexão do pedido (confirmada pela dependência quando a rota termina bem).

    Returns:
        Resposta 200 sem corpo, com ``Cache-Control: no-store``.

    Raises:
        ErroServidor: 400 ``invalid_request`` para pedido mal formado.
    """
    pedido = await ler_pedido_revogacao(requisicao)
    revogar_token(conexao, PedidoComCliente(token=pedido.token, id_cliente=pedido.id_cliente))
    return Response(status_code=STATUS_REVOGACAO_ACEITA, headers=CABECALHOS_SEM_CACHE)
