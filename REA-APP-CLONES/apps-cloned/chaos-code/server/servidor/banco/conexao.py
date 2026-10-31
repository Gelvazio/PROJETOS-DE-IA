"""Conexão com o banco SQLite: abrir, criar as tabelas e entregar uma conexão por pedido."""

import logging
import sqlite3
from collections.abc import Iterator
from pathlib import Path

from fastapi import Request

from servidor.configuracao import Configuracao
from servidor.constantes import (
    MODO_DIARIO_BANCO,
    NOME_ARQUIVO_ESQUEMA,
    TEMPO_ESPERA_TRAVA_BANCO_MS,
)

CAMINHO_ESQUEMA = Path(__file__).resolve().parent / NOME_ARQUIVO_ESQUEMA

registro = logging.getLogger(__name__)


def configurar_conexao(conexao: sqlite3.Connection) -> None:
    """Liga as opções que valem por conexão no SQLite.

    `foreign_keys` e `busy_timeout` não ficam gravados no arquivo: precisam ser ligados a cada
    conexão aberta. O WAL fica no arquivo, mas repetir é inofensivo e garante o modo.

    Args:
        conexao: Conexão recém-aberta.

    Raises:
        sqlite3.Error: Se o SQLite recusar alguma opção.
    """
    conexao.row_factory = sqlite3.Row
    conexao.execute("PRAGMA foreign_keys = ON")
    conexao.execute(f"PRAGMA busy_timeout = {int(TEMPO_ESPERA_TRAVA_BANCO_MS)}")
    conexao.execute(f"PRAGMA journal_mode = {MODO_DIARIO_BANCO}")


def abrir_conexao(caminho_banco: Path) -> sqlite3.Connection:
    """Abre uma conexão com o arquivo do banco, já configurada.

    `check_same_thread=False` porque o FastAPI pode abrir e fechar a dependência em threads
    diferentes; cada pedido usa a sua própria conexão, então não há uso simultâneo.

    Args:
        caminho_banco: Arquivo SQLite (a pasta é criada se faltar).

    Returns:
        Conexão com `foreign_keys` ligado, linhas como `sqlite3.Row`, WAL e espera por trava.

    Raises:
        sqlite3.Error: Se o arquivo não puder ser aberto ou configurado.
    """
    caminho_banco.parent.mkdir(parents=True, exist_ok=True)
    conexao = sqlite3.connect(
        caminho_banco,
        timeout=TEMPO_ESPERA_TRAVA_BANCO_MS / 1000,
        check_same_thread=False,
    )
    try:
        configurar_conexao(conexao)
    except sqlite3.Error:
        conexao.close()
        raise
    return conexao


def ler_esquema(caminho_esquema: Path = CAMINHO_ESQUEMA) -> str:
    """Lê o script SQL que cria as tabelas.

    Args:
        caminho_esquema: Arquivo `esquema.sql` (padrão: o que fica ao lado deste módulo).

    Returns:
        Texto do script.

    Raises:
        OSError: Se o arquivo não puder ser lido.
    """
    return caminho_esquema.read_text(encoding="utf-8")


def criar_tabelas(conexao: sqlite3.Connection, script_esquema: str) -> None:
    """Executa o esquema na conexão.

    O script usa `IF NOT EXISTS` em tudo, então rodar de novo num banco já criado não muda nada.

    Args:
        conexao: Conexão aberta.
        script_esquema: Texto do `esquema.sql`.

    Raises:
        sqlite3.Error: Se o script falhar.
    """
    conexao.executescript(script_esquema)
    conexao.commit()


def preparar_banco(caminho_banco: Path) -> None:
    """Cria o arquivo do banco e as tabelas, se ainda não existirem. Chamar na subida do app.

    Args:
        caminho_banco: Arquivo SQLite da configuração.

    Raises:
        sqlite3.Error: Se o banco não puder ser criado.
        OSError: Se o esquema não puder ser lido.
    """
    script_esquema = ler_esquema()
    conexao = abrir_conexao(caminho_banco)
    try:
        criar_tabelas(conexao, script_esquema)
    finally:
        conexao.close()
    registro.info("Banco pronto em %s", caminho_banco)


def entregar_conexao(caminho_banco: Path) -> Iterator[sqlite3.Connection]:
    """Entrega uma conexão e a encerra no fim: confirma se deu certo, desfaz se deu erro.

    Args:
        caminho_banco: Arquivo SQLite.

    Yields:
        Conexão configurada, exclusiva de quem a recebeu.

    Raises:
        Exception: Repassa o erro de quem usou a conexão, depois de desfazer a transação.
    """
    conexao = abrir_conexao(caminho_banco)
    try:
        yield conexao
        conexao.commit()
    except BaseException:
        conexao.rollback()
        raise
    finally:
        conexao.close()


def obter_conexao(requisicao: Request) -> Iterator[sqlite3.Connection]:
    """Dependência FastAPI: uma conexão por pedido (`Depends(obter_conexao)`).

    Args:
        requisicao: Requisição recebida; a configuração fica em `app.state.configuracao`.

    Yields:
        Conexão do pedido, fechada quando a resposta termina.
    """
    configuracao: Configuracao = requisicao.app.state.configuracao
    yield from entregar_conexao(configuracao.caminho_banco)
