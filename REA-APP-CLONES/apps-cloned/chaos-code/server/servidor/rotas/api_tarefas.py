"""Rotas de tarefas: ``/api/projects/{p}/tasks`` (listar, criar), ``.../{id}`` (ver, alterar,
mover para a lixeira) e ``.../{id}/restore`` (restaurar).

Regras (ETAPA-007, SERVIDOR.42; repositório em ``banco/tarefas_repositorio``, SERVIDOR.19):

* Todas exigem ``Authorization: Bearer`` (``seguranca/autenticacao``, SERVIDOR.25). Projeto ou
  tarefa de outro dono (ou inexistente, ou id inválido) responde **404**.
* Respostas no envelope ``{success, data, meta}`` (``esquemas/api.py``); as datas (segundos Unix
  no banco) saem em texto ISO 8601 UTC.
* Dados inválidos (campos, filtros, ``limit``/``offset``) → 400 com a mensagem do repositório.
* ``DELETE`` manda para a lixeira (204); ``restore`` só funciona dentro da retenção de 7 dias.
* ``tags`` da query aceita repetição (``?tags=a&tags=b``) ou vírgulas (``?tags=a,b``).
"""

import sqlite3
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response

from servidor.banco.conexao import obter_conexao
from servidor.banco.projetos_repositorio import (
    ChaveProjeto,
    ErroPaginacaoInvalida,
)
from servidor.banco.tarefas_repositorio import (
    LIMITE_PADRAO_LISTAGEM,
    AlteracaoTarefa,
    ChaveTarefa,
    ErroDadosTarefa,
    FiltrosTarefas,
    ItemChecklist,
    NovaTarefa,
    Tarefa,
    atualizar_tarefa,
    buscar_tarefa,
    contar_tarefas,
    criar_tarefa,
    listar_tarefas,
    mover_tarefa_para_lixeira,
    restaurar_tarefa,
)
from servidor.banco.usuarios_repositorio import Usuario
from servidor.constantes import ROTA_API_PROJETOS
from servidor.esquemas.api import (
    ItemTarefa,
    MetaPaginacao,
    PedidoAtualizarTarefa,
    PedidoCriarTarefa,
    RespostaListaTarefas,
    RespostaTarefa,
    TarefaApi,
)
from servidor.mensagens import MSG_ERRO_NAO_ENCONTRADO
from servidor.rotas.erros import (
    CODIGO_NAO_ENCONTRADO,
    CODIGO_PEDIDO_INVALIDO,
    STATUS_NAO_ENCONTRADO,
    STATUS_PEDIDO_INVALIDO,
    ErroServidor,
)
from servidor.seguranca.autenticacao import obter_usuario_atual

STATUS_CRIADO = 201
STATUS_SEM_CONTEUDO = 204
ROTA_TAREFAS = ROTA_API_PROJETOS + "/{id_projeto}/tasks"
ROTA_TAREFA = ROTA_TAREFAS + "/{id_tarefa}"
ROTA_RESTAURAR_TAREFA = ROTA_TAREFA + "/restore"
SEPARADOR_TAGS = ","

roteador = APIRouter()

ConexaoPedido = Annotated[sqlite3.Connection, Depends(obter_conexao)]
UsuarioLogado = Annotated[Usuario, Depends(obter_usuario_atual)]


def erro_nao_encontrado() -> ErroServidor:
    """Cria o 404 padrão de projeto/tarefa inexistente ou de outro dono.

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


def data_para_texto(segundos: int | None) -> str | None:
    """Converte segundos Unix em texto ISO 8601 UTC.

    Args:
        segundos: Data do banco, ou None.

    Returns:
        Texto ISO (``2026-10-18T12:00:00Z``), ou None se não houver data.
    """
    if segundos is None:
        return None
    momento = datetime.fromtimestamp(segundos, tz=timezone.utc)
    return momento.strftime("%Y-%m-%dT%H:%M:%SZ")


def montar_tarefa_api(tarefa: Tarefa) -> TarefaApi:
    """Converte a tarefa do banco no formato ``ApiTask`` da API.

    Args:
        tarefa: Tarefa do repositório.

    Returns:
        Tarefa com os nomes de campo do original.
    """
    itens = [ItemTarefa(text=i.texto, completed=i.concluido) for i in tarefa.itens]
    return TarefaApi(
        id=tarefa.id,
        title=tarefa.titulo,
        description=tarefa.descricao,
        status=tarefa.situacao,
        priority=tarefa.prioridade,
        items=itens,
        estimated_hours=tarefa.horas_estimadas,
        tags=list(tarefa.tags),
        assignee_id=tarefa.id_responsavel,
        sprint_id=tarefa.id_sprint,
        started_at=data_para_texto(tarefa.iniciada_em),
        completed_at=data_para_texto(tarefa.concluida_em),
        created_at=data_para_texto(tarefa.criado_em) or "",
        updated_at=data_para_texto(tarefa.atualizado_em) or "",
    )


def itens_do_pedido(itens: list[ItemTarefa] | None) -> list[ItemChecklist] | None:
    """Converte os itens do pedido para o checklist do repositório.

    Args:
        itens: Itens do pedido, ou None se não vieram.

    Returns:
        Itens do repositório, ou None.
    """
    if itens is None:
        return None
    return [ItemChecklist(texto=i.text, concluido=i.completed) for i in itens]


def separar_tags(valores: list[str] | None) -> list[str]:
    """Junta as tags da query, aceitando repetição e vírgulas.

    Args:
        valores: Valores de ``tags`` da query string.

    Returns:
        Tags separadas, sem pedaços vazios.
    """
    pedacos = [pedaco.strip() for valor in valores or [] for pedaco in valor.split(SEPARADOR_TAGS)]
    return [pedaco for pedaco in pedacos if pedaco]


def montar_nova_tarefa(pedido: PedidoCriarTarefa) -> NovaTarefa:
    """Monta os dados de criação; campo ausente fica com o padrão do repositório.

    Args:
        pedido: Corpo do ``POST``.

    Returns:
        Dados da tarefa nova.
    """
    padrao = NovaTarefa(titulo=pedido.title)
    return NovaTarefa(
        titulo=pedido.title,
        descricao=pedido.description if pedido.description is not None else padrao.descricao,
        situacao=pedido.status or padrao.situacao,
        prioridade=pedido.priority or padrao.prioridade,
        itens=itens_do_pedido(pedido.items) or padrao.itens,
        horas_estimadas=(
            pedido.estimated_hours if pedido.estimated_hours is not None else padrao.horas_estimadas
        ),
        tags=pedido.tags if pedido.tags is not None else padrao.tags,
    )


def montar_alteracao(pedido: PedidoAtualizarTarefa) -> AlteracaoTarefa:
    """Monta a alteração só com os campos enviados.

    Args:
        pedido: Corpo do ``PATCH``.

    Returns:
        Alteração (campo ausente = None = mantém o valor atual).
    """
    return AlteracaoTarefa(
        titulo=pedido.title,
        descricao=pedido.description,
        situacao=pedido.status,
        prioridade=pedido.priority,
        itens=itens_do_pedido(pedido.items),
        horas_estimadas=pedido.estimated_hours,
        tags=pedido.tags,
    )


def exigir_tarefa(conexao: sqlite3.Connection, chave: ChaveTarefa) -> Tarefa:
    """Busca a tarefa do dono ou lança 404.

    Args:
        conexao: Conexão do pedido.
        chave: Projeto do dono e id da tarefa.

    Returns:
        Tarefa fora da lixeira.

    Raises:
        ErroServidor: 404 se não existir, estiver na lixeira ou for de outro dono.
    """
    tarefa = buscar_tarefa(conexao, chave)
    if tarefa is None:
        raise erro_nao_encontrado()
    return tarefa


@roteador.get(ROTA_TAREFAS)
def listar(
    id_projeto: str,
    conexao: ConexaoPedido,
    usuario: UsuarioLogado,
    limit: int = LIMITE_PADRAO_LISTAGEM,
    offset: int = 0,
    status: str | None = None,
    priority: str | None = None,
    tags: Annotated[list[str] | None, Query()] = None,
) -> RespostaListaTarefas:
    """Lista as tarefas do projeto do usuário, mais novas primeiro.

    Args:
        id_projeto: UUID do projeto da URL.
        conexao: Conexão do pedido.
        usuario: Usuário dono do token.
        limit: Tamanho da página.
        offset: Quantas tarefas pular.
        status: Filtro de situação (opcional).
        priority: Filtro de prioridade (opcional).
        tags: Filtro de tags: a tarefa precisa ter todas (opcional).

    Returns:
        Envelope com as tarefas e a paginação (``total``, ``limit``, ``offset``).

    Raises:
        ErroServidor: 400 se filtro/página forem inválidos; 404 se o projeto não for do dono.
    """
    chave = ChaveProjeto(id_projeto, usuario.id)
    filtros = FiltrosTarefas(status, priority, separar_tags(tags), limit, offset)
    try:
        tarefas = listar_tarefas(conexao, chave, filtros)
        total = contar_tarefas(conexao, chave, filtros)
    except (ErroDadosTarefa, ErroPaginacaoInvalida) as erro:
        raise erro_dados_invalidos(str(erro)) from erro

    if tarefas is None:
        raise erro_nao_encontrado()
    meta = MetaPaginacao(total=total, limit=limit, offset=offset)
    dados = [montar_tarefa_api(tarefa) for tarefa in tarefas]
    return RespostaListaTarefas(success=True, data=dados, meta=meta)


@roteador.post(ROTA_TAREFAS, status_code=STATUS_CRIADO)
def criar(
    id_projeto: str,
    pedido: PedidoCriarTarefa,
    conexao: ConexaoPedido,
    usuario: UsuarioLogado,
) -> RespostaTarefa:
    """Cria uma tarefa no projeto do usuário.

    Args:
        id_projeto: UUID do projeto da URL.
        pedido: Campos da tarefa (só ``title`` é obrigatório).
        conexao: Conexão do pedido.
        usuario: Usuário dono do token.

    Returns:
        Envelope com a tarefa criada (201).

    Raises:
        ErroServidor: 400 se algum campo for inválido; 404 se o projeto não for do dono.
    """
    try:
        tarefa = criar_tarefa(
            conexao, ChaveProjeto(id_projeto, usuario.id), montar_nova_tarefa(pedido)
        )
    except ErroDadosTarefa as erro:
        raise erro_dados_invalidos(str(erro)) from erro

    if tarefa is None:
        raise erro_nao_encontrado()
    return RespostaTarefa(success=True, data=montar_tarefa_api(tarefa))


@roteador.get(ROTA_TAREFA)
def mostrar(
    id_projeto: str, id_tarefa: str, conexao: ConexaoPedido, usuario: UsuarioLogado
) -> RespostaTarefa:
    """Mostra uma tarefa do projeto do usuário.

    Args:
        id_projeto: UUID do projeto da URL.
        id_tarefa: UUID da tarefa da URL.
        conexao: Conexão do pedido.
        usuario: Usuário dono do token.

    Returns:
        Envelope com a tarefa.

    Raises:
        ErroServidor: 404 se não existir, estiver na lixeira ou for de outro dono.
    """
    chave = ChaveTarefa(ChaveProjeto(id_projeto, usuario.id), id_tarefa)
    return RespostaTarefa(success=True, data=montar_tarefa_api(exigir_tarefa(conexao, chave)))


@roteador.patch(ROTA_TAREFA)
def alterar(
    id_projeto: str,
    id_tarefa: str,
    pedido: PedidoAtualizarTarefa,
    conexao: ConexaoPedido,
    usuario: UsuarioLogado,
) -> RespostaTarefa:
    """Altera só os campos enviados de uma tarefa do projeto do usuário.

    Args:
        id_projeto: UUID do projeto da URL.
        id_tarefa: UUID da tarefa da URL.
        pedido: Campos a alterar (os ausentes ficam como estão).
        conexao: Conexão do pedido.
        usuario: Usuário dono do token.

    Returns:
        Envelope com a tarefa atualizada.

    Raises:
        ErroServidor: 400 se algum campo for inválido; 404 se não existir ou for de outro dono.
    """
    chave = ChaveTarefa(ChaveProjeto(id_projeto, usuario.id), id_tarefa)
    try:
        tarefa = atualizar_tarefa(conexao, chave, montar_alteracao(pedido))
    except ErroDadosTarefa as erro:
        raise erro_dados_invalidos(str(erro)) from erro

    if tarefa is None:
        raise erro_nao_encontrado()
    return RespostaTarefa(success=True, data=montar_tarefa_api(tarefa))


@roteador.delete(ROTA_TAREFA, status_code=STATUS_SEM_CONTEUDO)
def apagar(
    id_projeto: str, id_tarefa: str, conexao: ConexaoPedido, usuario: UsuarioLogado
) -> Response:
    """Manda a tarefa para a lixeira (pode ser restaurada em até 7 dias).

    Args:
        id_projeto: UUID do projeto da URL.
        id_tarefa: UUID da tarefa da URL.
        conexao: Conexão do pedido.
        usuario: Usuário dono do token.

    Returns:
        Resposta 204 sem corpo.

    Raises:
        ErroServidor: 404 se não existir, já estiver na lixeira ou for de outro dono.
    """
    chave = ChaveTarefa(ChaveProjeto(id_projeto, usuario.id), id_tarefa)
    if not mover_tarefa_para_lixeira(conexao, chave):
        raise erro_nao_encontrado()
    return Response(status_code=STATUS_SEM_CONTEUDO)


@roteador.post(ROTA_RESTAURAR_TAREFA)
def restaurar(
    id_projeto: str, id_tarefa: str, conexao: ConexaoPedido, usuario: UsuarioLogado
) -> RespostaTarefa:
    """Restaura uma tarefa da lixeira, se ainda estiver dentro da retenção.

    Args:
        id_projeto: UUID do projeto da URL.
        id_tarefa: UUID da tarefa da URL.
        conexao: Conexão do pedido.
        usuario: Usuário dono do token.

    Returns:
        Envelope com a tarefa restaurada.

    Raises:
        ErroServidor: 404 se não estiver na lixeira, a retenção venceu ou for de outro dono.
    """
    chave = ChaveTarefa(ChaveProjeto(id_projeto, usuario.id), id_tarefa)
    tarefa = restaurar_tarefa(conexao, chave)
    if tarefa is None:
        raise erro_nao_encontrado()
    return RespostaTarefa(success=True, data=montar_tarefa_api(tarefa))
