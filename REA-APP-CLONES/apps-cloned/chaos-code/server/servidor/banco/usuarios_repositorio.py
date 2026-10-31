"""Repositório de usuários: criar, buscar, autenticar e registrar o último login.

Regras (ETAPA-007, SERVIDOR.14):

* A conexão ``sqlite3`` vem de fora (``servidor.banco.conexao``); quem confirma a transação é a
  dependência do pedido, não o repositório.
* SQL sempre parametrizado (``?``), nunca texto montado com os dados.
* E-mail guardado em minúsculas e sem espaços nas pontas; a coluna é ``COLLATE NOCASE`` e única,
  então ``A@x.com`` e ``a@X.com`` são o mesmo e-mail.
* Senha só como hash (``servidor.seguranca.senha``). O hash não sai do repositório: os dados
  devolvidos são um ``Usuario`` sem ele.
* E-mail inexistente na autenticação confere a senha contra um hash falso fixo, para o tempo de
  resposta ser o mesmo de uma senha errada (não dá para descobrir e-mails pelo tempo).
"""

import functools
import secrets
import sqlite3
import uuid
from collections.abc import Sequence
from dataclasses import dataclass

from servidor.constantes import TABELA_USUARIOS
from servidor.mensagens import MSG_ERRO_EMAIL_JA_CADASTRADO
from servidor.seguranca.senha import conferir_senha, gerar_hash_senha, precisa_refazer_hash

TAMANHO_MAXIMO_EMAIL = 254
TAMANHO_MAXIMO_NOME = 200
BYTES_SENHA_FALSA = 32
ARROBA = "@"
COLUNA_EMAIL_NO_ERRO = f"{TABELA_USUARIOS}.email"

MSG_EMAIL_INVALIDO = "E-mail inválido."
MSG_NOME_INVALIDO = f"O nome deve ter de 1 a {TAMANHO_MAXIMO_NOME} caracteres."

COLUNAS_USUARIO = (
    "id",
    "email",
    "nome",
    "eh_admin",
    "criado_em",
    "atualizado_em",
    "ultimo_login_em",
)
SELECIONAR_USUARIO = f"SELECT {', '.join(COLUNAS_USUARIO)} FROM {TABELA_USUARIOS}"
SQL_POR_ID = f"{SELECIONAR_USUARIO} WHERE id = ?"
SQL_POR_EMAIL = f"{SELECIONAR_USUARIO} WHERE email = ?"
SQL_HASH_POR_EMAIL = f"SELECT id, hash_senha FROM {TABELA_USUARIOS} WHERE email = ?"
SQL_INSERIR = (
    f"INSERT INTO {TABELA_USUARIOS} (id, email, nome, hash_senha, eh_admin) VALUES (?, ?, ?, ?, ?)"
)
SQL_ULTIMO_LOGIN = (
    f"UPDATE {TABELA_USUARIOS} SET ultimo_login_em = unixepoch() WHERE id = ?"
)
SQL_TROCAR_HASH = (
    f"UPDATE {TABELA_USUARIOS} SET hash_senha = ?, atualizado_em = unixepoch() WHERE id = ?"
)
SQL_DEFINIR_ADMIN = (
    f"UPDATE {TABELA_USUARIOS} SET eh_admin = ?, atualizado_em = unixepoch() WHERE id = ?"
)


class ErroEmailJaCadastrado(ValueError):
    """Já existe um usuário com este e-mail (sem diferenciar maiúsculas)."""


@dataclass(frozen=True)
class Usuario:
    """Usuário como sai do banco, sem o hash da senha. Datas em segundos Unix."""

    id: str
    email: str
    nome: str
    eh_admin: bool
    criado_em: int
    atualizado_em: int
    ultimo_login_em: int | None


@dataclass(frozen=True)
class NovoUsuario:
    """Dados para criar um usuário. ``eh_admin`` só vem do comando ``criar-admin``."""

    email: str
    nome: str
    senha: str
    eh_admin: bool = False


def normalizar_email(email: str) -> str:
    """Tira os espaços das pontas, passa para minúsculas e confere o formato básico.

    Args:
        email: E-mail digitado.

    Returns:
        E-mail normalizado.

    Raises:
        ValueError: Se não for texto, estiver vazio, longo, com espaço ou sem ``@`` no meio.
    """
    if not isinstance(email, str):
        raise ValueError(MSG_EMAIL_INVALIDO)

    normalizado = email.strip().lower()
    posicao_arroba = normalizado.find(ARROBA)
    formato_valido = (
        0 < posicao_arroba < len(normalizado) - 1
        and len(normalizado) <= TAMANHO_MAXIMO_EMAIL
        and not any(caractere.isspace() for caractere in normalizado)
    )
    if not formato_valido:
        raise ValueError(MSG_EMAIL_INVALIDO)
    return normalizado


def normalizar_nome(nome: str) -> str:
    """Tira os espaços das pontas e confere o tamanho do nome.

    Args:
        nome: Nome digitado.

    Returns:
        Nome sem espaços nas pontas.

    Raises:
        ValueError: Se não for texto, ficar vazio ou passar do limite.
    """
    texto = nome.strip() if isinstance(nome, str) else ""
    if not 0 < len(texto) <= TAMANHO_MAXIMO_NOME:
        raise ValueError(MSG_NOME_INVALIDO)
    return texto


def montar_usuario(linha: Sequence) -> Usuario:
    """Converte uma linha do ``SELECIONAR_USUARIO`` em ``Usuario`` (vale para tupla e ``Row``).

    Args:
        linha: Linha com as colunas de ``COLUNAS_USUARIO``, nessa ordem.

    Returns:
        Usuário sem o hash.
    """
    valores = dict(zip(COLUNAS_USUARIO, tuple(linha)))
    valores["eh_admin"] = bool(valores["eh_admin"])
    return Usuario(**valores)


@functools.cache
def obter_hash_falso() -> str:
    """Hash de uma senha aleatória, gerado uma vez por processo.

    Chamar na subida do app evita que o 1º login de e-mail inexistente custe dois hashes.

    Returns:
        Hash no mesmo formato e custo dos hashes reais.
    """
    return gerar_hash_senha(secrets.token_urlsafe(BYTES_SENHA_FALSA))


def buscar_usuario_por_id(conexao: sqlite3.Connection, id_usuario: str) -> Usuario | None:
    """Busca um usuário pelo id.

    Args:
        conexao: Conexão aberta.
        id_usuario: UUID do usuário.

    Returns:
        Usuário, ou None se não existir.
    """
    linha = conexao.execute(SQL_POR_ID, (id_usuario,)).fetchone()
    return montar_usuario(linha) if linha is not None else None


def buscar_usuario_por_email(conexao: sqlite3.Connection, email: str) -> Usuario | None:
    """Busca um usuário pelo e-mail, sem diferenciar maiúsculas.

    Args:
        conexao: Conexão aberta.
        email: E-mail digitado.

    Returns:
        Usuário, ou None se não existir ou se o e-mail for inválido.
    """
    try:
        email_normalizado = normalizar_email(email)
    except ValueError:
        return None

    linha = conexao.execute(SQL_POR_EMAIL, (email_normalizado,)).fetchone()
    return montar_usuario(linha) if linha is not None else None


def criar_usuario(conexao: sqlite3.Connection, dados: NovoUsuario) -> Usuario:
    """Cria um usuário com a senha em hash.

    Args:
        conexao: Conexão aberta (a transação é confirmada por quem a entregou).
        dados: E-mail, nome, senha e se é administrador.

    Returns:
        Usuário criado, sem o hash.

    Raises:
        ErroEmailJaCadastrado: Se o e-mail já existir (sem diferenciar maiúsculas).
        ValueError: Se e-mail, nome ou senha forem inválidos.
        sqlite3.IntegrityError: Outra violação do esquema (não esperada).
    """
    email = normalizar_email(dados.email)
    nome = normalizar_nome(dados.nome)
    hash_senha = gerar_hash_senha(dados.senha)
    id_usuario = str(uuid.uuid4())
    try:
        conexao.execute(
            SQL_INSERIR, (id_usuario, email, nome, hash_senha, int(bool(dados.eh_admin)))
        )
    except sqlite3.IntegrityError as erro:
        if COLUNA_EMAIL_NO_ERRO in str(erro):
            raise ErroEmailJaCadastrado(MSG_ERRO_EMAIL_JA_CADASTRADO) from erro
        raise

    usuario = buscar_usuario_por_id(conexao, id_usuario)
    if usuario is None:
        raise sqlite3.IntegrityError(f"Usuário {id_usuario} não foi gravado")
    return usuario


def registrar_ultimo_login(conexao: sqlite3.Connection, id_usuario: str) -> None:
    """Grava o instante atual em ``ultimo_login_em``.

    Args:
        conexao: Conexão aberta.
        id_usuario: UUID do usuário.
    """
    conexao.execute(SQL_ULTIMO_LOGIN, (id_usuario,))


def definir_admin(conexao: sqlite3.Connection, id_usuario: str, eh_admin: bool) -> bool:
    """Promove ou rebaixa um usuário (uso do comando ``criar-admin``, SERVIDOR.49).

    Args:
        conexao: Conexão aberta.
        id_usuario: UUID do usuário.
        eh_admin: True para administrador.

    Returns:
        True se o usuário existia e foi alterado.
    """
    cursor = conexao.execute(SQL_DEFINIR_ADMIN, (int(bool(eh_admin)), id_usuario))
    return cursor.rowcount > 0


def autenticar_usuario(conexao: sqlite3.Connection, email: str, senha: str) -> Usuario | None:
    """Confere e-mail e senha; se baterem, registra o login e devolve o usuário.

    Com e-mail inexistente ou inválido, confere a senha contra o hash falso, para o tempo ser o
    mesmo de uma senha errada. Se o hash guardado usar parâmetros antigos, ele é refeito.

    Args:
        conexao: Conexão aberta.
        email: E-mail digitado.
        senha: Senha digitada.

    Returns:
        Usuário autenticado, ou None se e-mail ou senha não baterem (sem dizer qual).
    """
    try:
        linha = conexao.execute(SQL_HASH_POR_EMAIL, (normalizar_email(email),)).fetchone()
    except ValueError:
        linha = None

    if linha is None:
        conferir_senha(senha, obter_hash_falso())
        return None

    id_usuario, hash_guardado = tuple(linha)
    if not conferir_senha(senha, hash_guardado):
        return None

    if precisa_refazer_hash(hash_guardado):
        conexao.execute(SQL_TROCAR_HASH, (gerar_hash_senha(senha), id_usuario))
    registrar_ultimo_login(conexao, id_usuario)
    return buscar_usuario_por_id(conexao, id_usuario)
