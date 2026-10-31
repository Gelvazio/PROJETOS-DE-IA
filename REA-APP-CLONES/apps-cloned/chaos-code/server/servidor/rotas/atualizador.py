"""Rota do atualizador: entrega o `latest.json` que o app consulta para ver se há versão nova."""

import json
import logging
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Request

from servidor.configuracao import Configuracao
from servidor.constantes import NOME_ARQUIVO_LATEST, PASTA_DADOS_INICIAIS, ROTA_ATUALIZADOR
from servidor.mensagens import MSG_ERRO_INTERNO, MSG_ERRO_NAO_ENCONTRADO
from servidor.rotas.erros import (
    CODIGO_ERRO_INTERNO,
    CODIGO_NAO_ENCONTRADO,
    STATUS_ERRO_INTERNO,
    STATUS_NAO_ENCONTRADO,
    ErroServidor,
)

roteador = APIRouter()
registro = logging.getLogger(__name__)


def localizar_manifesto(pasta_dados: Path) -> Path | None:
    """Acha o `latest.json` a entregar: o da pasta de dados ou, na falta dele, o de exemplo.

    Args:
        pasta_dados: Pasta de dados configurada do servidor.

    Returns:
        Caminho do arquivo, ou None se nenhum existir.
    """
    candidatos = (pasta_dados / NOME_ARQUIVO_LATEST, PASTA_DADOS_INICIAIS / NOME_ARQUIVO_LATEST)
    return next((caminho for caminho in candidatos if caminho.is_file()), None)


def ler_manifesto(caminho: Path) -> dict[str, Any]:
    """Lê e confere o JSON do manifesto.

    Args:
        caminho: Arquivo `latest.json`.

    Returns:
        Conteúdo do manifesto.

    Raises:
        ErroServidor: Se o arquivo não for um JSON de objeto válido (500, sem detalhe interno).
    """
    try:
        conteudo = json.loads(caminho.read_text(encoding="utf-8"))
    except (OSError, ValueError) as erro:
        registro.error("Falha ao ler %s: %s", caminho, erro)
        raise ErroServidor(STATUS_ERRO_INTERNO, CODIGO_ERRO_INTERNO, MSG_ERRO_INTERNO) from erro

    if not isinstance(conteudo, dict):
        registro.error("%s não contém um objeto JSON", caminho)
        raise ErroServidor(STATUS_ERRO_INTERNO, CODIGO_ERRO_INTERNO, MSG_ERRO_INTERNO)
    return conteudo


@roteador.get(ROTA_ATUALIZADOR)
def entregar_manifesto(requisicao: Request) -> dict[str, Any]:
    """Responde o `latest.json` da pasta de dados.

    Args:
        requisicao: Requisição recebida; a configuração fica em `app.state.configuracao`.

    Returns:
        Conteúdo do manifesto do atualizador.

    Raises:
        ErroServidor: 404 se não houver manifesto; 500 se ele estiver ilegível.
    """
    configuracao: Configuracao = requisicao.app.state.configuracao
    caminho = localizar_manifesto(configuracao.pasta_dados)
    if caminho is None:
        raise ErroServidor(STATUS_NAO_ENCONTRADO, CODIGO_NAO_ENCONTRADO, MSG_ERRO_NAO_ENCONTRADO)

    return ler_manifesto(caminho)
