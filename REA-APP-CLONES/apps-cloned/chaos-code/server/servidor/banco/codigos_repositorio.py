"""Repositório de códigos de autorização: criar e consumir uma vez só, dentro da validade.

Regras (ETAPA-007, SERVIDOR.16; usadas pela autorização, SERVIDOR.35, e pela troca do código,
SERVIDOR.36):

* No banco vai só o **hash** SHA-256 do código (``servidor.seguranca.tokens``); o código em
  texto sai uma vez, no redirecionamento da autorização.
* Validade curta (``VALIDADE_CODIGO_SEGUNDOS``) e **uso único** (RFC 6749, seção 4.1.2): o
  consumo marca ``usado_em`` num único ``UPDATE ... RETURNING`` com ``usado_em IS NULL`` e
  ``expira_em`` no futuro, então dois pedidos ao mesmo tempo não usam o mesmo código.
* O código fica preso ao cliente, ao usuário, ao ``redirect_uri`` e ao desafio PKCE S256
  (RFC 7636). A SERVIDOR.36 consome **antes** de conferir cliente, ``redirect_uri`` e
  ``code_verifier``: se qualquer conferência falhar, o código já foi queimado.
* Código reapresentado devolve ``REUTILIZADO`` com os dados do código, para a rota revogar os
  tokens emitidos a partir dele (a RFC 6749 recomenda).
* Conexão por parâmetro, SQL parametrizado e sem ``commit`` (quem confirma é a dependência do
  pedido, ``servidor.banco.conexao``).
"""

import re
import sqlite3
import time
from collections.abc import Sequence
from dataclasses import dataclass
from enum import Enum

from servidor.constantes import (
    METODO_PKCE,
    TABELA_CODIGOS_AUTORIZACAO,
    VALIDADE_CODIGO_SEGUNDOS,
)
from servidor.seguranca.tokens import (
    Relogio,
    agora_unix,
    calcular_expiracao,
    calcular_hash_token,
    gerar_codigo_autorizacao,
    tem_formato_de_token,
)

# S256 = SHA-256 em base64url sem "=" (RFC 7636, seção 4.2): sempre 43 caracteres.
PADRAO_DESAFIO_S256 = re.compile(r"[A-Za-z0-9_-]{43}")
TAMANHO_MAXIMO_ID = 200
TAMANHO_MAXIMO_REDIRECT = 2048
TAMANHO_MAXIMO_ESCOPO = 500

MSG_ID_CLIENTE_INVALIDO = "id do cliente inválido para o código de autorização."
MSG_ID_USUARIO_INVALIDO = "id do usuário inválido para o código de autorização."
MSG_REDIRECT_INVALIDO = "redirect_uri inválida para o código de autorização."
MSG_METODO_DESAFIO = f"code_challenge_method deve ser {METODO_PKCE}."
MSG_DESAFIO_INVALIDO = "code_challenge deve ter 43 caracteres base64url (S256)."
MSG_ESCOPO_INVALIDO = f"scope deve ter no máximo {TAMANHO_MAXIMO_ESCOPO} caracteres."

COLUNAS_CODIGO = (
    "id_cliente",
    "id_usuario",
    "uri_redirecionamento",
    "desafio_codigo",
    "metodo_desafio",
    "escopo",
    "criado_em",
    "expira_em",
    "usado_em",
)
LISTA_COLUNAS = ", ".join(COLUNAS_CODIGO)
SQL_INSERIR = (
    f"INSERT INTO {TABELA_CODIGOS_AUTORIZACAO} (hash_codigo, id_cliente, id_usuario, "
    "uri_redirecionamento, desafio_codigo, metodo_desafio, escopo, criado_em, expira_em) "
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
)
# Marcar e devolver no mesmo comando: é o que garante o uso único sem corrida.
SQL_CONSUMIR = (
    f"UPDATE {TABELA_CODIGOS_AUTORIZACAO} SET usado_em = ? "
    "WHERE hash_codigo = ? AND usado_em IS NULL AND expira_em > ? "
    f"RETURNING {LISTA_COLUNAS}"
)
SQL_POR_HASH = f"SELECT {LISTA_COLUNAS} FROM {TABELA_CODIGOS_AUTORIZACAO} WHERE hash_codigo = ?"
SQL_APAGAR_VENCIDOS = f"DELETE FROM {TABELA_CODIGOS_AUTORIZACAO} WHERE expira_em <= ?"


class ErroCodigoInvalido(ValueError):
    """Dados recusados ao criar o código; a rota de autorização devolve ``invalid_request``."""


class SituacaoConsumo(Enum):
    """Resultado do consumo de um código (a rota responde ``invalid_grant`` se não for OK)."""

    CONSUMIDO = "consumido"
    INEXISTENTE = "inexistente"
    EXPIRADO = "expirado"
    REUTILIZADO = "reutilizado"


@dataclass(frozen=True)
class NovoCodigo:
    """Dados do pedido de autorização já conferido (cliente, usuário e PKCE)."""

    id_cliente: str
    id_usuario: str
    uri_redirecionamento: str
    desafio_codigo: str
    metodo_desafio: str = METODO_PKCE
    escopo: str | None = None


@dataclass(frozen=True)
class CodigoAutorizacao:
    """Código como sai do banco, sem o hash."""

    id_cliente: str
    id_usuario: str
    uri_redirecionamento: str
    desafio_codigo: str
    metodo_desafio: str
    escopo: str | None
    criado_em: int
    expira_em: int
    usado_em: int | None


@dataclass(frozen=True)
class ResultadoConsumo:
    """Situação do consumo e, quando o código existe, os dados dele."""

    situacao: SituacaoConsumo
    codigo: CodigoAutorizacao | None = None

    @property
    def foi_consumido(self) -> bool:
        """Diz se o código foi aceito agora (primeiro uso, dentro da validade).

        Returns:
            True só na situação ``CONSUMIDO``.
        """
        return self.situacao is SituacaoConsumo.CONSUMIDO


def texto_valido(valor: object, tamanho_maximo: int) -> bool:
    """Diz se o valor é texto não vazio (sem contar espaços) e cabe no tamanho máximo.

    Args:
        valor: Valor recebido.
        tamanho_maximo: Quantidade máxima de caracteres.

    Returns:
        True se for ``str`` com conteúdo e até ``tamanho_maximo`` caracteres.
    """
    return isinstance(valor, str) and bool(valor.strip()) and len(valor) <= tamanho_maximo


def validar_desafio(dados: NovoCodigo) -> None:
    """Confere o método e o formato do desafio PKCE (só S256, RFC 7636).

    Args:
        dados: Pedido de criação do código.

    Raises:
        ErroCodigoInvalido: Método diferente de S256 ou desafio fora do formato.
    """
    if dados.metodo_desafio != METODO_PKCE:
        raise ErroCodigoInvalido(MSG_METODO_DESAFIO)
    desafio_ok = isinstance(dados.desafio_codigo, str) and bool(
        PADRAO_DESAFIO_S256.fullmatch(dados.desafio_codigo)
    )
    if not desafio_ok:
        raise ErroCodigoInvalido(MSG_DESAFIO_INVALIDO)


def validar_novo_codigo(dados: NovoCodigo) -> None:
    """Confere os dados como ``esquema.sql`` exige, antes de gravar.

    O cliente e o ``redirect_uri`` já foram conferidos pela rota (``clientes_repositorio``);
    aqui só se barra dado vazio, longo demais ou de tipo errado.

    Args:
        dados: Pedido de criação do código.

    Raises:
        ErroCodigoInvalido: Algum campo inválido.
    """
    if not texto_valido(dados.id_cliente, TAMANHO_MAXIMO_ID):
        raise ErroCodigoInvalido(MSG_ID_CLIENTE_INVALIDO)
    if not texto_valido(dados.id_usuario, TAMANHO_MAXIMO_ID):
        raise ErroCodigoInvalido(MSG_ID_USUARIO_INVALIDO)
    if not texto_valido(dados.uri_redirecionamento, TAMANHO_MAXIMO_REDIRECT):
        raise ErroCodigoInvalido(MSG_REDIRECT_INVALIDO)
    validar_desafio(dados)
    escopo_ok = dados.escopo is None or (
        isinstance(dados.escopo, str) and len(dados.escopo) <= TAMANHO_MAXIMO_ESCOPO
    )
    if not escopo_ok:
        raise ErroCodigoInvalido(MSG_ESCOPO_INVALIDO)


def montar_codigo(linha: Sequence) -> CodigoAutorizacao:
    """Converte uma linha com ``COLUNAS_CODIGO`` em ``CodigoAutorizacao`` (tupla ou ``Row``).

    Args:
        linha: Linha com as colunas de ``COLUNAS_CODIGO``, nessa ordem.

    Returns:
        Código sem o hash.
    """
    return CodigoAutorizacao(**dict(zip(COLUNAS_CODIGO, tuple(linha))))


def criar_codigo(
    conexao: sqlite3.Connection, dados: NovoCodigo, relogio: Relogio = time.time
) -> str:
    """Cria um código de autorização e grava só o hash dele.

    Args:
        conexao: Conexão aberta (a transação é confirmada por quem a entregou).
        dados: Cliente, usuário, ``redirect_uri``, desafio PKCE e escopo já conferidos.
        relogio: Fonte do instante atual (padrão: ``time.time``).

    Returns:
        O código em texto, para ir no redirecionamento (``?code=``); não fica guardado.

    Raises:
        ErroCodigoInvalido: Dados recusados.
        sqlite3.IntegrityError: Cliente ou usuário inexistente (chave estrangeira).
    """
    validar_novo_codigo(dados)
    codigo = gerar_codigo_autorizacao()
    criado_em = agora_unix(relogio)
    conexao.execute(
        SQL_INSERIR,
        (
            calcular_hash_token(codigo),
            dados.id_cliente,
            dados.id_usuario,
            dados.uri_redirecionamento,
            dados.desafio_codigo,
            dados.metodo_desafio,
            dados.escopo,
            criado_em,
            calcular_expiracao(VALIDADE_CODIGO_SEGUNDOS, lambda: criado_em),
        ),
    )
    return codigo


def explicar_recusa(conexao: sqlite3.Connection, hash_codigo: str) -> ResultadoConsumo:
    """Diz por que um código não pôde ser consumido: não existe, já foi usado ou venceu.

    Args:
        conexao: Conexão aberta.
        hash_codigo: Hash do código recebido.

    Returns:
        Resultado ``INEXISTENTE``, ``REUTILIZADO`` (com os dados) ou ``EXPIRADO``.
    """
    linha = conexao.execute(SQL_POR_HASH, (hash_codigo,)).fetchone()
    if linha is None:
        return ResultadoConsumo(SituacaoConsumo.INEXISTENTE)

    codigo = montar_codigo(linha)
    if codigo.usado_em is not None:
        return ResultadoConsumo(SituacaoConsumo.REUTILIZADO, codigo)
    return ResultadoConsumo(SituacaoConsumo.EXPIRADO, codigo)


def consumir_codigo(
    conexao: sqlite3.Connection, codigo: str | None, relogio: Relogio = time.time
) -> ResultadoConsumo:
    """Consome o código uma vez só (``POST /api/oauth/token`` com ``authorization_code``).

    Depois de ``CONSUMIDO``, quem chama ainda confere ``id_cliente``, ``redirect_uri`` e o
    ``code_verifier`` contra ``desafio_codigo``; o código já fica inutilizado de qualquer jeito.

    Args:
        conexao: Conexão aberta (a transação é confirmada por quem a entregou).
        codigo: Código recebido no formulário (pode faltar).
        relogio: Fonte do instante atual (padrão: ``time.time``).

    Returns:
        ``CONSUMIDO`` com os dados no primeiro uso válido; senão ``INEXISTENTE`` (também para
        texto fora do formato), ``EXPIRADO`` ou ``REUTILIZADO``.
    """
    if not tem_formato_de_token(codigo):
        return ResultadoConsumo(SituacaoConsumo.INEXISTENTE)

    hash_codigo = calcular_hash_token(codigo)
    agora = agora_unix(relogio)
    # fetchall: o UPDATE só termina (e grava) quando o cursor chega ao fim.
    linhas = conexao.execute(SQL_CONSUMIR, (agora, hash_codigo, agora)).fetchall()
    if not linhas:
        return explicar_recusa(conexao, hash_codigo)
    return ResultadoConsumo(SituacaoConsumo.CONSUMIDO, montar_codigo(linhas[0]))


def apagar_codigos_vencidos(conexao: sqlite3.Connection, relogio: Relogio = time.time) -> int:
    """Apaga os códigos vencidos, usados ou não (limpeza; usa ``idx_codigos_expira_em``).

    Depois de apagado, um código reapresentado vira ``INEXISTENTE`` e continua recusado.

    Args:
        conexao: Conexão aberta (a transação é confirmada por quem a entregou).
        relogio: Fonte do instante atual (padrão: ``time.time``).

    Returns:
        Quantidade de códigos apagados.
    """
    return conexao.execute(SQL_APAGAR_VENCIDOS, (agora_unix(relogio),)).rowcount
