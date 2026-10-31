"""Geração, hash e conferência de tokens e códigos do OAuth.

Regras (ETAPA-007, SERVIDOR.10):

* Tokens e códigos saem de ``secrets.token_urlsafe`` (base64url, sem ``=``).
* No banco vai só o hash SHA-256 em hexadecimal (colunas ``hash_token`` e ``hash_codigo`` de
  ``banco/esquema.sql``): vazar o arquivo do banco não entrega acesso.
* A conferência usa ``hmac.compare_digest`` (tempo constante).
* Validades em segundos Unix inteiros, como o ``unixepoch()`` do esquema.

Usado pelos repositórios de códigos e tokens (SERVIDOR.16 e 17), pela proteção CSRF
(SERVIDOR.12), pela autenticação Bearer (SERVIDOR.25) e pelas rotas OAuth (SERVIDOR.34 a 38).
"""

import hashlib
import hmac
import re
import secrets
import time
from collections.abc import Callable

from servidor.constantes import (
    ALGORITMO_HASH_TOKEN,
    BYTES_CODIGO_AUTORIZACAO,
    BYTES_FAMILIA_TOKENS,
    BYTES_TOKEN_ACESSO,
    BYTES_TOKEN_CSRF,
    BYTES_TOKEN_RENOVACAO,
    CODIFICACAO_TOKEN,
    TAMANHO_MAXIMO_TOKEN_RECEBIDO,
)

# Alfabeto do base64url sem preenchimento (RFC 4648, seção 5).
PADRAO_BASE64URL = re.compile(r"[A-Za-z0-9_-]+")

MSG_TAMANHO_INVALIDO = "A quantidade de bytes do token deve ser um inteiro positivo."
MSG_TOKEN_VAZIO = "O token não pode ser vazio."
MSG_VALIDADE_INVALIDA = "A validade deve ser um inteiro positivo, em segundos."

Relogio = Callable[[], float]
"""Fonte do instante atual em segundos Unix (injetável; o padrão é ``time.time``)."""


def gerar_token(quantidade_bytes: int) -> str:
    """Gera um texto aleatório seguro em base64url.

    Args:
        quantidade_bytes: Bytes aleatórios antes da codificação (32 bytes → 43 caracteres).

    Returns:
        Token em base64url, sem ``=``.

    Raises:
        ValueError: Se ``quantidade_bytes`` não for um inteiro positivo.
    """
    tamanho_valido = type(quantidade_bytes) is int and quantidade_bytes > 0
    if not tamanho_valido:
        raise ValueError(MSG_TAMANHO_INVALIDO)

    return secrets.token_urlsafe(quantidade_bytes)


def tamanho_em_caracteres(quantidade_bytes: int) -> int:
    """Calcula quantos caracteres ``token_urlsafe`` gera para essa quantidade de bytes.

    Args:
        quantidade_bytes: Bytes aleatórios.

    Returns:
        Tamanho do texto em base64url sem ``=`` (``ceil(4 * bytes / 3)``).
    """
    return -(-4 * quantidade_bytes // 3)


def gerar_token_acesso() -> str:
    """Gera um token de acesso (``access_token``).

    Returns:
        Token de acesso novo.
    """
    return gerar_token(BYTES_TOKEN_ACESSO)


def gerar_token_renovacao() -> str:
    """Gera um token de renovação (``refresh_token``).

    Returns:
        Token de renovação novo.
    """
    return gerar_token(BYTES_TOKEN_RENOVACAO)


def gerar_codigo_autorizacao() -> str:
    """Gera o código de autorização (``code``) devolvido no redirecionamento.

    Returns:
        Código novo, de uso único.
    """
    return gerar_token(BYTES_CODIGO_AUTORIZACAO)


def gerar_token_csrf() -> str:
    """Gera o token escondido dos formulários (proteção CSRF, SERVIDOR.12).

    Returns:
        Token CSRF novo.
    """
    return gerar_token(BYTES_TOKEN_CSRF)


def gerar_familia_tokens() -> str:
    """Gera o identificador da família de tokens (coluna ``familia`` da tabela ``tokens``).

    Returns:
        Identificador aleatório da família.
    """
    return gerar_token(BYTES_FAMILIA_TOKENS)


def calcular_hash_token(token: str) -> str:
    """Calcula o hash que vai para o banco: SHA-256 do token em UTF-8, em hexadecimal.

    Args:
        token: Token ou código em texto.

    Returns:
        Hash com 64 caracteres hexadecimais minúsculos.

    Raises:
        ValueError: Se o token for vazio.
    """
    if not token:
        raise ValueError(MSG_TOKEN_VAZIO)

    return hashlib.new(ALGORITMO_HASH_TOKEN, token.encode(CODIFICACAO_TOKEN)).hexdigest()


def textos_iguais(primeiro: str, segundo: str) -> bool:
    """Compara dois textos em tempo constante (``hmac.compare_digest``).

    Args:
        primeiro: Texto esperado.
        segundo: Texto recebido.

    Returns:
        True só se os dois forem iguais.
    """
    return hmac.compare_digest(
        primeiro.encode(CODIFICACAO_TOKEN), segundo.encode(CODIFICACAO_TOKEN)
    )


def tem_formato_de_token(texto: str | None) -> bool:
    """Diz se um texto recebido pode ser um token deste servidor (antes de calcular o hash).

    Barra vazio, caracteres fora do base64url e textos longos demais, para não gastar hash nem
    consulta ao banco com lixo.

    Args:
        texto: Texto recebido (cabeçalho, formulário ou corpo).

    Returns:
        True se tiver só caracteres base64url e no máximo o tamanho permitido.
    """
    if not texto or len(texto) > TAMANHO_MAXIMO_TOKEN_RECEBIDO:
        return False

    return PADRAO_BASE64URL.fullmatch(texto) is not None


def conferir_token(token_recebido: str | None, hash_guardado: str) -> bool:
    """Confere um token recebido contra o hash guardado no banco, em tempo constante.

    Args:
        token_recebido: Token que chegou na requisição (pode faltar).
        hash_guardado: Valor da coluna ``hash_token`` ou ``hash_codigo``.

    Returns:
        True só se o token tiver formato válido e o hash dele for igual ao guardado.
    """
    if not tem_formato_de_token(token_recebido) or not hash_guardado:
        return False

    return textos_iguais(hash_guardado, calcular_hash_token(token_recebido))


def agora_unix(relogio: Relogio = time.time) -> int:
    """Devolve o instante atual em segundos Unix inteiros (igual ao ``unixepoch()`` do SQLite).

    Args:
        relogio: Fonte do instante atual (padrão: ``time.time``).

    Returns:
        Segundos desde 1970-01-01 UTC, sem fração.
    """
    return int(relogio())


def calcular_expiracao(validade_segundos: int, relogio: Relogio = time.time) -> int:
    """Calcula o instante de vencimento para a coluna ``expira_em``.

    Args:
        validade_segundos: Validade, ex.: ``VALIDADE_TOKEN_ACESSO_SEGUNDOS``.
        relogio: Fonte do instante atual (padrão: ``time.time``).

    Returns:
        Agora + validade, em segundos Unix.

    Raises:
        ValueError: Se a validade não for um inteiro positivo.
    """
    validade_aceita = type(validade_segundos) is int and validade_segundos > 0
    if not validade_aceita:
        raise ValueError(MSG_VALIDADE_INVALIDA)

    return agora_unix(relogio) + validade_segundos


def esta_expirado(expira_em: int, relogio: Relogio = time.time) -> bool:
    """Diz se um token ou código já venceu.

    Vence no próprio segundo de ``expira_em`` (o instante não é mais válido).

    Args:
        expira_em: Valor da coluna ``expira_em``, em segundos Unix.
        relogio: Fonte do instante atual (padrão: ``time.time``).

    Returns:
        True se o agora for igual ou depois de ``expira_em``.
    """
    return agora_unix(relogio) >= expira_em


def segundos_restantes(expira_em: int, relogio: Relogio = time.time) -> int:
    """Calcula quantos segundos faltam para vencer (o ``expires_in`` da resposta do token).

    Args:
        expira_em: Instante de vencimento, em segundos Unix.
        relogio: Fonte do instante atual (padrão: ``time.time``).

    Returns:
        Segundos restantes, nunca negativo.
    """
    return max(0, expira_em - agora_unix(relogio))
