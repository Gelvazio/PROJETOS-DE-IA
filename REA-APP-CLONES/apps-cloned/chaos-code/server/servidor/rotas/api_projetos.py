"""Rotas de projetos: ``/api/projects`` (listar, criar) e ``/api/projects/{p}``
(ver, alterar, apagar).

Regras (ETAPA-007, SERVIDOR.41; repositório em ``banco/projetos_repositorio``, SERVIDOR.18):

* Todas exigem ``Authorization: Bearer`` (``seguranca/autenticacao``, SERVIDOR.25) e só enxergam
  os projetos do dono do token; projeto de outro usuário responde **404**, como se não existisse.
* Respostas no envelope ``{success, data, meta}`` (``esquemas/api.py``); ``role``,
  ``project_role_*`` e ``permissions`` são montados por ``montagem_projeto`` (o dono é sempre
  ``owner``).
* Dados inválidos (nome, descrição, ``limit``/``offset``) → 400 com a mensagem do repositório.
* Apagar o projeto apaga também os arquivos das imagens em ``dados/imagens/`` (o banco apaga as
  linhas por ``ON DELETE CASCADE``). Só caminhos que ficam dentro da pasta de imagens são tocados.
"""

import logging
import sqlite3
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response

from servidor.banco.conexao import obter_conexao
from servidor.banco.projetos_repositorio import (
    LIMITE_PADRAO_LISTAGEM,
    AlteracaoProjeto,
    ChaveProjeto,
    ErroDadosProjeto,
    ErroPaginacaoInvalida,
    NovoProjeto,
    Paginacao,
    Projeto,
    apagar_projeto,
    atualizar_projeto,
    buscar_projeto,
    contar_projetos,
    criar_projeto,
    listar_projetos,
    normalizar_id_projeto,
)
from servidor.banco.usuarios_repositorio import Usuario
from servidor.configuracao import Configuracao
from servidor.constantes import ROTA_API_PROJETOS, TABELA_IMAGENS
from servidor.esquemas.api import (
    MetaPaginacao,
    PedidoAtualizarProjeto,
    PedidoCriarProjeto,
    RespostaListaProjetos,
    RespostaProjeto,
)
from servidor.mensagens import MSG_ERRO_NAO_ENCONTRADO
from servidor.rotas.erros import (
    CODIGO_NAO_ENCONTRADO,
    CODIGO_PEDIDO_INVALIDO,
    STATUS_NAO_ENCONTRADO,
    STATUS_PEDIDO_INVALIDO,
    ErroServidor,
)
from servidor.rotas.montagem_projeto import montar_projeto_api
from servidor.seguranca.autenticacao import obter_usuario_atual

STATUS_CRIADO = 201
STATUS_SEM_CONTEUDO = 204
ROTA_PROJETO = ROTA_API_PROJETOS + "/{id_projeto}"
SQL_ARQUIVOS_DAS_IMAGENS = (
    f"SELECT caminho_arquivo, caminho_miniatura FROM {TABELA_IMAGENS} WHERE id_projeto = ?"
)

roteador = APIRouter()
registro = logging.getLogger(__name__)

ConexaoPedido = Annotated[sqlite3.Connection, Depends(obter_conexao)]
UsuarioLogado = Annotated[Usuario, Depends(obter_usuario_atual)]


def erro_nao_encontrado() -> ErroServidor:
    """Cria o 404 padrão de projeto inexistente ou de outro dono.

    Returns:
        Erro pronto para ser lançado.
    """
    return ErroServidor(STATUS_NAO_ENCONTRADO, CODIGO_NAO_ENCONTRADO, MSG_ERRO_NAO_ENCONTRADO)


def erro_dados_invalidos(mensagem: str) -> ErroServidor:
    """Cria o 400 com a mensagem de validação do repositório.

    Args:
        mensagem: Texto do erro de dados.

    Returns:
        Erro pronto para ser lançado.
    """
    return ErroServidor(STATUS_PEDIDO_INVALIDO, CODIGO_PEDIDO_INVALIDO, mensagem)


def exigir_projeto(conexao: sqlite3.Connection, chave: ChaveProjeto) -> Projeto:
    """Busca o projeto do dono ou lança 404.

    Args:
        conexao: Conexão do pedido.
        chave: Id do projeto da URL e id do usuário autenticado.

    Returns:
        Projeto do dono.

    Raises:
        ErroServidor: 404 se não existir, for de outro dono ou o id não for UUID.
    """
    projeto = buscar_projeto(conexao, chave)
    if projeto is None:
        raise erro_nao_encontrado()
    return projeto


def listar_arquivos_das_imagens(conexao: sqlite3.Connection, id_projeto: str) -> list[str]:
    """Lista os caminhos (relativos a ``dados/imagens/``) das imagens e miniaturas do projeto.

    Args:
        conexao: Conexão do pedido.
        id_projeto: UUID canônico do projeto.

    Returns:
        Caminhos relativos, sem repetição de vazios.
    """
    linhas = conexao.execute(SQL_ARQUIVOS_DAS_IMAGENS, (id_projeto,)).fetchall()
    return [caminho for linha in linhas for caminho in tuple(linha) if caminho]


def apagar_arquivos_das_imagens(pasta_imagens: Path, caminhos: list[str]) -> None:
    """Apaga os arquivos das imagens; ignora os que faltam e os que saem da pasta de imagens.

    Falha ao apagar um arquivo só vai para o registro: o projeto já foi apagado do banco.

    Args:
        pasta_imagens: Pasta ``dados/imagens/`` configurada.
        caminhos: Caminhos relativos gravados no banco.
    """
    raiz = pasta_imagens.resolve()
    for caminho in caminhos:
        alvo = (raiz / caminho).resolve()
        if not alvo.is_relative_to(raiz):
            registro.warning("Caminho de imagem fora da pasta de imagens ignorado: %s", caminho)
            continue
        try:
            alvo.unlink(missing_ok=True)
        except OSError as erro:
            registro.error("Falha ao apagar a imagem %s: %s", alvo, erro)


@roteador.get(ROTA_API_PROJETOS)
def listar(
    conexao: ConexaoPedido,
    usuario: UsuarioLogado,
    limit: int = LIMITE_PADRAO_LISTAGEM,
    offset: int = 0,
) -> RespostaListaProjetos:
    """Lista os projetos do usuário autenticado, por nome.

    Args:
        conexao: Conexão do pedido.
        usuario: Usuário dono do token.
        limit: Tamanho da página.
        offset: Quantos projetos pular.

    Returns:
        Envelope com os projetos e a paginação (``total``, ``limit``, ``offset``).

    Raises:
        ErroServidor: 400 se ``limit``/``offset`` estiverem fora da faixa.
    """
    try:
        projetos = listar_projetos(conexao, usuario.id, Paginacao(limit, offset))
    except ErroPaginacaoInvalida as erro:
        raise erro_dados_invalidos(str(erro)) from erro

    meta = MetaPaginacao(total=contar_projetos(conexao, usuario.id), limit=limit, offset=offset)
    dados = [montar_projeto_api(projeto) for projeto in projetos]
    return RespostaListaProjetos(success=True, data=dados, meta=meta)


@roteador.post(ROTA_API_PROJETOS, status_code=STATUS_CRIADO)
def criar(
    pedido: PedidoCriarProjeto, conexao: ConexaoPedido, usuario: UsuarioLogado
) -> RespostaProjeto:
    """Cria um projeto do usuário autenticado.

    Args:
        pedido: ``name`` e ``description`` (opcional).
        conexao: Conexão do pedido.
        usuario: Usuário dono do token.

    Returns:
        Envelope com o projeto criado (201).

    Raises:
        ErroServidor: 400 se o nome ou a descrição forem inválidos.
    """
    dados = NovoProjeto(nome=pedido.name, descricao=pedido.description or "")
    try:
        projeto = criar_projeto(conexao, usuario.id, dados)
    except ErroDadosProjeto as erro:
        raise erro_dados_invalidos(str(erro)) from erro
    return RespostaProjeto(success=True, data=montar_projeto_api(projeto))


@roteador.get(ROTA_PROJETO)
def mostrar(id_projeto: str, conexao: ConexaoPedido, usuario: UsuarioLogado) -> RespostaProjeto:
    """Mostra um projeto do usuário autenticado.

    Args:
        id_projeto: UUID da URL.
        conexao: Conexão do pedido.
        usuario: Usuário dono do token.

    Returns:
        Envelope com o projeto.

    Raises:
        ErroServidor: 404 se não existir ou for de outro dono.
    """
    projeto = exigir_projeto(conexao, ChaveProjeto(id_projeto, usuario.id))
    return RespostaProjeto(success=True, data=montar_projeto_api(projeto))


@roteador.patch(ROTA_PROJETO)
def alterar(
    id_projeto: str,
    pedido: PedidoAtualizarProjeto,
    conexao: ConexaoPedido,
    usuario: UsuarioLogado,
) -> RespostaProjeto:
    """Altera nome e/ou descrição de um projeto do usuário autenticado.

    Args:
        id_projeto: UUID da URL.
        pedido: Campos a alterar (os ausentes ficam como estão).
        conexao: Conexão do pedido.
        usuario: Usuário dono do token.

    Returns:
        Envelope com o projeto atualizado.

    Raises:
        ErroServidor: 400 se os dados forem inválidos; 404 se não existir ou for de outro dono.
    """
    alteracao = AlteracaoProjeto(nome=pedido.name, descricao=pedido.description)
    try:
        projeto = atualizar_projeto(conexao, ChaveProjeto(id_projeto, usuario.id), alteracao)
    except ErroDadosProjeto as erro:
        raise erro_dados_invalidos(str(erro)) from erro

    if projeto is None:
        raise erro_nao_encontrado()
    return RespostaProjeto(success=True, data=montar_projeto_api(projeto))


@roteador.delete(ROTA_PROJETO, status_code=STATUS_SEM_CONTEUDO)
def apagar(
    id_projeto: str, requisicao: Request, conexao: ConexaoPedido, usuario: UsuarioLogado
) -> Response:
    """Apaga o projeto do usuário autenticado, com tarefas, imagens e os arquivos das imagens.

    Args:
        id_projeto: UUID da URL.
        requisicao: Requisição; a configuração fica em ``app.state.configuracao``.
        conexao: Conexão do pedido.
        usuario: Usuário dono do token.

    Returns:
        Resposta 204 sem corpo.

    Raises:
        ErroServidor: 404 se não existir ou for de outro dono.
    """
    chave = ChaveProjeto(id_projeto, usuario.id)
    exigir_projeto(conexao, chave)

    caminhos = listar_arquivos_das_imagens(conexao, normalizar_id_projeto(id_projeto) or "")
    if not apagar_projeto(conexao, chave):
        raise erro_nao_encontrado()

    configuracao: Configuracao = requisicao.app.state.configuracao
    apagar_arquivos_das_imagens(configuracao.pasta_imagens, caminhos)
    return Response(status_code=STATUS_SEM_CONTEUDO)
