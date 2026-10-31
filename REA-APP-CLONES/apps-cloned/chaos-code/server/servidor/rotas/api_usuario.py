"""Rota do usuário: ``GET /api/oauth/user/projects`` (projetos do dono do token).

Regras (ETAPA-007, SERVIDOR.40):

* Exige ``Authorization: Bearer`` (``seguranca/autenticacao``, SERVIDOR.25).
* Devolve só os projetos do usuário autenticado, por nome, no formato ``{"projects": [...]}``
  do inventário (sem envelope ``success``); cada projeto é montado por ``montagem_projeto``.
* Devolve até ``LIMITE_MAXIMO_LISTAGEM`` projetos (a rota do inventário não tem paginação).
"""

import sqlite3
from typing import Annotated

from fastapi import APIRouter, Depends

from servidor.banco.conexao import obter_conexao
from servidor.banco.projetos_repositorio import (
    LIMITE_MAXIMO_LISTAGEM,
    Paginacao,
    listar_projetos,
)
from servidor.banco.usuarios_repositorio import Usuario
from servidor.constantes import ROTA_OAUTH_PROJETOS_USUARIO
from servidor.esquemas.api import RespostaProjetos
from servidor.rotas.montagem_projeto import montar_projeto_api
from servidor.seguranca.autenticacao import obter_usuario_atual

roteador = APIRouter()

ConexaoPedido = Annotated[sqlite3.Connection, Depends(obter_conexao)]
UsuarioLogado = Annotated[Usuario, Depends(obter_usuario_atual)]


@roteador.get(ROTA_OAUTH_PROJETOS_USUARIO)
def listar_projetos_do_usuario(
    conexao: ConexaoPedido, usuario: UsuarioLogado
) -> RespostaProjetos:
    """Lista os projetos do usuário autenticado, por nome.

    Args:
        conexao: Conexão do pedido.
        usuario: Usuário dono do token.

    Returns:
        ``{"projects": [...]}`` com ``id``, ``name``, ``description``, ``role``,
        ``project_role_slug``, ``project_role_name`` e ``permissions``.
    """
    paginacao = Paginacao(LIMITE_MAXIMO_LISTAGEM, 0)
    projetos = listar_projetos(conexao, usuario.id, paginacao)
    return RespostaProjetos(projects=[montar_projeto_api(projeto) for projeto in projetos])
