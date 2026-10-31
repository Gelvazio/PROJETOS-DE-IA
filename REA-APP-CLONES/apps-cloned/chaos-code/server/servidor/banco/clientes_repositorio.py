"""Repositório de clientes OAuth: registrar cliente público, buscar e conferir o ``redirect_uri``.

Regras (ETAPA-007, SERVIDOR.15; usadas pelo registro, SERVIDOR.34, e pela autorização,
SERVIDOR.35):

* Só cliente **público** (RFC 7591 com ``token_endpoint_auth_method = none``): não há segredo
  guardado, a prova de posse é o PKCE.
* ``redirect_uri`` só de loopback, como o cliente original usa
  (``http://127.0.0.1:<porta>/callback``, docs/inventario/login.md): esquema ``http``, host
  ``127.0.0.1``, ``localhost`` ou ``[::1]``, sem usuário/senha e sem fragmento.
* Conferência por igualdade exata, tolerando só a **porta** (RFC 8252, seção 7.3): o app nativo
  sobe o callback numa porta efêmera a cada login.
* Conexão por parâmetro, SQL parametrizado e sem ``commit`` (quem confirma é a dependência do
  pedido, ``servidor.banco.conexao``).
"""

import json
import sqlite3
from collections.abc import Sequence
from dataclasses import dataclass
from urllib.parse import SplitResult, urlsplit

from servidor.constantes import (
    CONCESSAO_CODIGO_AUTORIZACAO,
    CONCESSAO_RENOVACAO,
    METODO_AUTENTICACAO_CLIENTE_PUBLICO,
    TABELA_CLIENTES_OAUTH,
    TIPO_RESPOSTA_CODIGO,
)
from servidor.seguranca.tokens import gerar_token

BYTES_ID_CLIENTE = 16
TAMANHO_MAXIMO_NOME_CLIENTE = 200
QUANTIDADE_MAXIMA_REDIRECTS = 10
TAMANHO_MAXIMO_REDIRECT = 2048
ESQUEMA_LOOPBACK = "http"
HOSTS_LOOPBACK = frozenset({"127.0.0.1", "localhost", "::1"})
CONCESSOES_PERMITIDAS = frozenset({CONCESSAO_CODIGO_AUTORIZACAO, CONCESSAO_RENOVACAO})
TIPOS_RESPOSTA_PERMITIDOS = frozenset({TIPO_RESPOSTA_CODIGO})
CONCESSOES_PADRAO = (CONCESSAO_CODIGO_AUTORIZACAO, CONCESSAO_RENOVACAO)
TIPOS_RESPOSTA_PADRAO = (TIPO_RESPOSTA_CODIGO,)

MSG_NOME_CLIENTE_INVALIDO = (
    f"client_name deve ter de 1 a {TAMANHO_MAXIMO_NOME_CLIENTE} caracteres."
)
MSG_SEM_REDIRECT = (
    f"redirect_uris deve ter de 1 a {QUANTIDADE_MAXIMA_REDIRECTS} endereços."
)
MSG_REDIRECT_MAL_FORMADO = "redirect_uri inválida."
MSG_REDIRECT_ESQUEMA = "redirect_uri deve usar o esquema http (loopback)."
MSG_REDIRECT_HOST = "redirect_uri deve apontar para localhost, 127.0.0.1 ou [::1]."
MSG_REDIRECT_PARTES = "redirect_uri não pode ter usuário, senha ou fragmento."
MSG_METODO_AUTENTICACAO = "Só clientes públicos são aceitos (token_endpoint_auth_method = none)."
MSG_CONCESSOES = (
    "grant_types aceita só authorization_code e refresh_token, com authorization_code."
)
MSG_TIPOS_RESPOSTA = "response_types aceita só code."

COLUNAS_CLIENTE = (
    "id_cliente",
    "nome_cliente",
    "uris_redirecionamento",
    "metodo_autenticacao",
    "concessoes",
    "tipos_resposta",
    "criado_em",
)
SQL_POR_ID = (
    f"SELECT {', '.join(COLUNAS_CLIENTE)} FROM {TABELA_CLIENTES_OAUTH} WHERE id_cliente = ?"
)
SQL_INSERIR = (
    f"INSERT INTO {TABELA_CLIENTES_OAUTH} (id_cliente, nome_cliente, uris_redirecionamento, "
    "metodo_autenticacao, concessoes, tipos_resposta) VALUES (?, ?, ?, ?, ?, ?)"
)


class ErroRegistroCliente(ValueError):
    """Metadados de cliente recusados; a rota devolve ``invalid_client_metadata`` (RFC 7591)."""


class ErroRedirectInvalido(ErroRegistroCliente):
    """``redirect_uri`` fora das regras; a rota devolve ``invalid_redirect_uri`` (RFC 7591)."""


@dataclass(frozen=True)
class ClienteOAuth:
    """Cliente OAuth como sai do banco (listas já convertidas do JSON)."""

    id_cliente: str
    nome_cliente: str
    uris_redirecionamento: tuple[str, ...]
    metodo_autenticacao: str
    concessoes: tuple[str, ...]
    tipos_resposta: tuple[str, ...]
    criado_em: int


@dataclass(frozen=True)
class NovoCliente:
    """Dados do pedido de registro (``PedidoRegistroCliente`` de ``esquemas/oauth.py``)."""

    nome_cliente: str
    uris_redirecionamento: Sequence[str]
    metodo_autenticacao: str = METODO_AUTENTICACAO_CLIENTE_PUBLICO
    concessoes: Sequence[str] = CONCESSOES_PADRAO
    tipos_resposta: Sequence[str] = TIPOS_RESPOSTA_PADRAO


def separar_redirect(uri: str) -> SplitResult:
    """Interpreta e confere um ``redirect_uri`` de loopback.

    Args:
        uri: Endereço informado.

    Returns:
        Partes do endereço (``urlsplit``), já validadas.

    Raises:
        ErroRedirectInvalido: Se não for texto, for longo, não for http, não for loopback, tiver
            usuário/senha ou fragmento, ou a porta for inválida.
    """
    if not isinstance(uri, str) or not uri or len(uri) > TAMANHO_MAXIMO_REDIRECT:
        raise ErroRedirectInvalido(MSG_REDIRECT_MAL_FORMADO)

    try:
        partes = urlsplit(uri)
        _ = partes.port  # porta inválida levanta ValueError aqui
    except ValueError as erro:
        raise ErroRedirectInvalido(MSG_REDIRECT_MAL_FORMADO) from erro

    if partes.scheme != ESQUEMA_LOOPBACK:
        raise ErroRedirectInvalido(MSG_REDIRECT_ESQUEMA)
    if (partes.hostname or "") not in HOSTS_LOOPBACK:
        raise ErroRedirectInvalido(MSG_REDIRECT_HOST)
    tem_partes_proibidas = bool(partes.username or partes.password or partes.fragment)
    if tem_partes_proibidas or "#" in uri:
        raise ErroRedirectInvalido(MSG_REDIRECT_PARTES)
    return partes


def validar_lista_redirects(uris: Sequence[str]) -> tuple[str, ...]:
    """Confere a lista de ``redirect_uris`` do registro.

    Args:
        uris: Lista informada.

    Returns:
        A lista, sem repetidos e na ordem recebida.

    Raises:
        ErroRedirectInvalido: Lista vazia, grande demais ou com algum endereço inválido.
    """
    eh_lista = isinstance(uris, (list, tuple))
    if not eh_lista or not 0 < len(uris) <= QUANTIDADE_MAXIMA_REDIRECTS:
        raise ErroRedirectInvalido(MSG_SEM_REDIRECT)

    for uri in uris:
        separar_redirect(uri)
    return tuple(dict.fromkeys(uris))


def validar_novo_cliente(dados: NovoCliente) -> NovoCliente:
    """Confere os metadados do registro como ``esquemas/oauth.py`` e ``esquema.sql`` exigem.

    Args:
        dados: Pedido de registro.

    Returns:
        Dados normalizados (nome sem espaços nas pontas, listas sem repetidos).

    Raises:
        ErroRegistroCliente: Nome, método, concessões ou tipos de resposta inválidos.
        ErroRedirectInvalido: Algum ``redirect_uri`` inválido.
    """
    nome = dados.nome_cliente.strip() if isinstance(dados.nome_cliente, str) else ""
    if not 0 < len(nome) <= TAMANHO_MAXIMO_NOME_CLIENTE:
        raise ErroRegistroCliente(MSG_NOME_CLIENTE_INVALIDO)
    if dados.metodo_autenticacao != METODO_AUTENTICACAO_CLIENTE_PUBLICO:
        raise ErroRegistroCliente(MSG_METODO_AUTENTICACAO)

    concessoes = tuple(dict.fromkeys(dados.concessoes))
    concessoes_validas = (
        CONCESSAO_CODIGO_AUTORIZACAO in concessoes and set(concessoes) <= CONCESSOES_PERMITIDAS
    )
    if not concessoes_validas:
        raise ErroRegistroCliente(MSG_CONCESSOES)

    tipos_resposta = tuple(dict.fromkeys(dados.tipos_resposta))
    if not tipos_resposta or not set(tipos_resposta) <= TIPOS_RESPOSTA_PERMITIDOS:
        raise ErroRegistroCliente(MSG_TIPOS_RESPOSTA)

    return NovoCliente(
        nome_cliente=nome,
        uris_redirecionamento=validar_lista_redirects(dados.uris_redirecionamento),
        metodo_autenticacao=dados.metodo_autenticacao,
        concessoes=concessoes,
        tipos_resposta=tipos_resposta,
    )


def montar_cliente(linha: Sequence) -> ClienteOAuth:
    """Converte uma linha de ``SQL_POR_ID`` em ``ClienteOAuth`` (vale para tupla e ``Row``).

    Args:
        linha: Linha com as colunas de ``COLUNAS_CLIENTE``, nessa ordem.

    Returns:
        Cliente com as listas convertidas do JSON.
    """
    valores = dict(zip(COLUNAS_CLIENTE, tuple(linha)))
    for coluna in ("uris_redirecionamento", "concessoes", "tipos_resposta"):
        valores[coluna] = tuple(json.loads(valores[coluna]))
    return ClienteOAuth(**valores)


def buscar_cliente(conexao: sqlite3.Connection, id_cliente: str) -> ClienteOAuth | None:
    """Busca um cliente pelo ``client_id``.

    Args:
        conexao: Conexão aberta.
        id_cliente: ``client_id`` recebido.

    Returns:
        Cliente, ou None se não existir (ou se o id não for texto).
    """
    if not isinstance(id_cliente, str) or not id_cliente:
        return None

    linha = conexao.execute(SQL_POR_ID, (id_cliente,)).fetchone()
    return montar_cliente(linha) if linha is not None else None


def registrar_cliente(conexao: sqlite3.Connection, dados: NovoCliente) -> ClienteOAuth:
    """Registra um cliente público novo (``POST /api/oauth/register``).

    Args:
        conexao: Conexão aberta (a transação é confirmada por quem a entregou).
        dados: Pedido de registro.

    Returns:
        Cliente registrado, com o ``client_id`` gerado (16 bytes aleatórios em base64url).

    Raises:
        ErroRegistroCliente: Metadados recusados.
        ErroRedirectInvalido: ``redirect_uri`` recusado.
    """
    validos = validar_novo_cliente(dados)
    id_cliente = gerar_token(BYTES_ID_CLIENTE)
    conexao.execute(
        SQL_INSERIR,
        (
            id_cliente,
            validos.nome_cliente,
            json.dumps(list(validos.uris_redirecionamento)),
            validos.metodo_autenticacao,
            json.dumps(list(validos.concessoes)),
            json.dumps(list(validos.tipos_resposta)),
        ),
    )
    cliente = buscar_cliente(conexao, id_cliente)
    if cliente is None:
        raise sqlite3.IntegrityError(f"Cliente {id_cliente} não foi gravado")
    return cliente


def redirects_equivalentes(registrado: str, recebido: str) -> bool:
    """Compara dois ``redirect_uri`` de loopback: tudo igual, menos a porta (RFC 8252, 7.3).

    Args:
        registrado: Endereço do registro.
        recebido: Endereço do pedido de autorização ou de troca do código.

    Returns:
        True se esquema, host, caminho e query forem iguais (a porta pode mudar).
    """
    try:
        a = separar_redirect(registrado)
        b = separar_redirect(recebido)
    except ErroRedirectInvalido:
        return False
    return (a.scheme, a.hostname, a.path, a.query) == (b.scheme, b.hostname, b.path, b.query)


def conferir_redirect(cliente: ClienteOAuth, redirect_uri: str) -> bool:
    """Diz se o ``redirect_uri`` recebido é um dos registrados pelo cliente.

    Args:
        cliente: Cliente buscado.
        redirect_uri: Endereço recebido no pedido.

    Returns:
        True se bater com algum registrado (porta livre no loopback).
    """
    return any(redirects_equivalentes(uri, redirect_uri) for uri in cliente.uris_redirecionamento)
