"""Configuração do servidor: variáveis de ambiente `CHAOS_SERVIDOR_*` com padrão das constantes."""

import os
import secrets
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path

from servidor.constantes import (
    HOST_PADRAO,
    NOME_ARQUIVO_BANCO,
    NOME_ARQUIVO_CHAVE_SESSAO,
    NOME_PASTA_IMAGENS,
    PASTA_DADOS_PADRAO,
    PORTA_PADRAO,
    PREFIXO_VARIAVEL_AMBIENTE,
)

VARIAVEL_PORTA = PREFIXO_VARIAVEL_AMBIENTE + "PORTA"
VARIAVEL_PASTA_DADOS = PREFIXO_VARIAVEL_AMBIENTE + "PASTA_DADOS"
VARIAVEL_CHAVE_SESSAO = PREFIXO_VARIAVEL_AMBIENTE + "CHAVE_SESSAO"

PORTA_MINIMA = 1
PORTA_MAXIMA = 65535
BYTES_CHAVE_SESSAO = 32


@dataclass(frozen=True)
class Configuracao:
    """Valores de execução do servidor, já resolvidos."""

    host: str
    porta: int
    pasta_dados: Path
    caminho_banco: Path
    pasta_imagens: Path
    chave_sessao: str


def ler_porta(ambiente: Mapping[str, str]) -> int:
    """Lê a porta da variável de ambiente, ou devolve o padrão.

    Args:
        ambiente: Variáveis de ambiente (injetadas para facilitar a troca).

    Returns:
        Número da porta.

    Raises:
        ValueError: Se o valor não for um número entre 1 e 65535.
    """
    texto = ambiente.get(VARIAVEL_PORTA, "").strip()
    if not texto:
        return PORTA_PADRAO

    if not texto.isdigit():
        raise ValueError(f"{VARIAVEL_PORTA} deve ser um número, recebido: {texto!r}")

    porta = int(texto)
    if not PORTA_MINIMA <= porta <= PORTA_MAXIMA:
        raise ValueError(f"{VARIAVEL_PORTA} fora do intervalo {PORTA_MINIMA}-{PORTA_MAXIMA}")
    return porta


def ler_pasta_dados(ambiente: Mapping[str, str]) -> Path:
    """Lê a pasta de dados da variável de ambiente, ou devolve o padrão.

    Args:
        ambiente: Variáveis de ambiente.

    Returns:
        Caminho absoluto da pasta de dados.
    """
    texto = ambiente.get(VARIAVEL_PASTA_DADOS, "").strip()
    if not texto:
        return PASTA_DADOS_PADRAO

    return Path(texto).expanduser().resolve()


def obter_chave_sessao(ambiente: Mapping[str, str], pasta_dados: Path) -> str:
    """Obtém a chave que assina o cookie de sessão.

    Ordem: variável de ambiente, arquivo na pasta de dados e, se nenhum existir,
    gera uma chave aleatória e a guarda no arquivo (só o dono lê).

    Args:
        ambiente: Variáveis de ambiente.
        pasta_dados: Pasta onde a chave gerada fica guardada.

    Returns:
        Chave de sessão em texto.
    """
    chave_informada = ambiente.get(VARIAVEL_CHAVE_SESSAO, "").strip()
    if chave_informada:
        return chave_informada

    caminho = pasta_dados / NOME_ARQUIVO_CHAVE_SESSAO
    if caminho.is_file():
        chave_guardada = caminho.read_text(encoding="utf-8").strip()
        if chave_guardada:
            return chave_guardada

    pasta_dados.mkdir(parents=True, exist_ok=True)
    chave_nova = secrets.token_hex(BYTES_CHAVE_SESSAO)
    caminho.write_text(chave_nova, encoding="utf-8")
    caminho.chmod(0o600)
    return chave_nova


def carregar_configuracao(ambiente: Mapping[str, str] | None = None) -> Configuracao:
    """Monta a configuração do servidor.

    Args:
        ambiente: Variáveis de ambiente; se omitido, usa `os.environ`.

    Returns:
        Configuração resolvida (a pasta de dados e a de imagens são criadas se faltarem).

    Raises:
        ValueError: Se a porta informada for inválida.
    """
    variaveis = os.environ if ambiente is None else ambiente
    porta = ler_porta(variaveis)
    pasta_dados = ler_pasta_dados(variaveis)
    pasta_imagens = pasta_dados / NOME_PASTA_IMAGENS
    pasta_imagens.mkdir(parents=True, exist_ok=True)

    return Configuracao(
        host=HOST_PADRAO,
        porta=porta,
        pasta_dados=pasta_dados,
        caminho_banco=pasta_dados / NOME_ARQUIVO_BANCO,
        pasta_imagens=pasta_imagens,
        chave_sessao=obter_chave_sessao(variaveis, pasta_dados),
    )
