"""Atualiza com a branch main do origin todo repositório Git de C:/fontes.

Ignora DEMAIS-PROJETOS-NAO-MEXER-AGORA, rules-ai, .vscode, .agents e .claude
(PASTAS_IGNORADAS).

Uso:
    python scripts/UPDATE.py                  # todas as pastas
    python scripts/UPDATE.py --pasta NOME     # uma pasta só

Só usa a biblioteca padrão. Nunca faz merge, push, --force ou reset --hard.
Quando o rebase para em conflito, deixa-o parado para a sessão resolver:
o script não escolhe lado sozinho.
"""

import argparse
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

PASTA_RAIZ = Path(__file__).resolve().parents[2]
# Fora do escopo: pasta de projetos parados (C23), o próprio rules-ai e pastas de configuração.
PASTAS_IGNORADAS = (
    "DEMAIS-PROJETOS-NAO-MEXER-AGORA",
    "rules-ai",
    ".vscode",
    ".agents",
    ".claude",
)
BRANCH_PRINCIPAL = "main"
REMOTO = "origin"

SITUACAO_ATUALIZADA = "ATUALIZADA"
SITUACAO_EM_DIA = "JÁ EM DIA"
SITUACAO_PULADA = "PULADA"
SITUACAO_CONFLITO = "CONFLITO"
SITUACAO_CONFLITO_AUTOSTASH = "CONFLITO NO AUTOSTASH"
SITUACAO_ERRO = "ERRO"
SITUACOES_COM_PROBLEMA = (SITUACAO_CONFLITO, SITUACAO_CONFLITO_AUTOSTASH, SITUACAO_ERRO)


@dataclass
class ResultadoPasta:
    """Resultado da atualização de uma pasta."""

    pasta: str
    situacao: str
    detalhe: str


def executar_git(pasta: Path, argumentos: list[str]) -> subprocess.CompletedProcess:
    """Roda um comando git dentro da pasta sem lançar exceção.

    Args:
        pasta: Pasta do repositório.
        argumentos: Argumentos passados ao git.

    Returns:
        Resultado do processo, com stdout e stderr em texto.
    """
    return subprocess.run(
        ["git", "-C", str(pasta), *argumentos],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )


def primeira_linha(texto: str) -> str:
    """Devolve a primeira linha não vazia de um texto.

    Args:
        texto: Texto de saída do git.

    Returns:
        A primeira linha com conteúdo, ou string vazia.
    """
    linhas = [linha.strip() for linha in texto.splitlines() if linha.strip()]
    return linhas[0] if linhas else ""


def listar_pastas(pasta_raiz: Path) -> list[Path]:
    """Lista as pastas da raiz que são repositórios Git, menos as ignoradas.

    Args:
        pasta_raiz: Pasta que contém os projetos.

    Returns:
        Lista de pastas em ordem alfabética.
    """
    pastas = [
        item
        for item in pasta_raiz.iterdir()
        if item.is_dir()
        and item.name not in PASTAS_IGNORADAS
        and (item / ".git").exists()
    ]
    return sorted(pastas, key=lambda item: item.name)


def rebase_em_andamento(pasta: Path) -> bool:
    """Diz se já existe um rebase parado na pasta.

    Args:
        pasta: Pasta do repositório.

    Returns:
        True se há rebase não terminado.
    """
    diretorio_git = pasta / ".git"
    return (diretorio_git / "rebase-merge").exists() or (
        diretorio_git / "rebase-apply"
    ).exists()


def tem_stash(pasta: Path) -> bool:
    """Diz se existe alguma entrada no stash da pasta.

    Args:
        pasta: Pasta do repositório.

    Returns:
        True se o stash tem pelo menos uma entrada.
    """
    return executar_git(pasta, ["stash", "list"]).stdout.strip() != ""


def arquivos_em_conflito(pasta: Path) -> list[str]:
    """Lista os arquivos com conflito não resolvido.

    Args:
        pasta: Pasta do repositório.

    Returns:
        Caminhos dos arquivos em conflito.
    """
    resultado = executar_git(pasta, ["diff", "--name-only", "--diff-filter=U"])
    return [linha for linha in resultado.stdout.splitlines() if linha.strip()]


def hash_atual(pasta: Path) -> str:
    """Devolve o hash curto do HEAD.

    Args:
        pasta: Pasta do repositório.

    Returns:
        Hash curto do commit atual.
    """
    return executar_git(pasta, ["rev-parse", "--short", "HEAD"]).stdout.strip()


def branch_atual(pasta: Path) -> str:
    """Devolve o nome da branch atual.

    Args:
        pasta: Pasta do repositório.

    Returns:
        Nome da branch ou string vazia.
    """
    return executar_git(pasta, ["rev-parse", "--abbrev-ref", "HEAD"]).stdout.strip()


def ja_esta_em_dia(pasta: Path) -> bool:
    """Diz se a main do origin já está contida no HEAD.

    Args:
        pasta: Pasta do repositório (já com fetch feito).

    Returns:
        True se não há nada para trazer da main.
    """
    resultado = executar_git(pasta, ["merge-base", "--is-ancestor", "FETCH_HEAD", "HEAD"])
    return resultado.returncode == 0


def classificar_falha(pasta: Path, pull: subprocess.CompletedProcess) -> ResultadoPasta:
    """Transforma uma falha do pull em situação de conflito ou erro.

    Args:
        pasta: Pasta do repositório.
        pull: Resultado do comando pull que falhou.

    Returns:
        Resultado com a situação e o detalhe da falha.
    """
    conflitos = arquivos_em_conflito(pasta)
    if rebase_em_andamento(pasta):
        detalhe = ", ".join(conflitos) if conflitos else primeira_linha(pull.stderr)
        return ResultadoPasta(pasta.name, SITUACAO_CONFLITO, detalhe)
    if tem_stash(pasta):
        detalhe = "mudanças locais ficaram no stash (ver git stash list)"
        return ResultadoPasta(pasta.name, SITUACAO_CONFLITO_AUTOSTASH, detalhe)
    return ResultadoPasta(pasta.name, SITUACAO_ERRO, primeira_linha(pull.stderr))


def atualizar_pasta(pasta: Path) -> ResultadoPasta:
    """Atualiza uma pasta com a main do origin, sem resolver conflitos.

    Args:
        pasta: Pasta do repositório.

    Returns:
        Resultado da atualização.
    """
    if rebase_em_andamento(pasta):
        detalhe = "rebase anterior não terminado; resolver antes de atualizar"
        return ResultadoPasta(pasta.name, SITUACAO_CONFLITO, detalhe)
    branch = branch_atual(pasta)
    if branch != BRANCH_PRINCIPAL:
        detalhe = f"branch atual é '{branch}', não '{BRANCH_PRINCIPAL}'"
        return ResultadoPasta(pasta.name, SITUACAO_PULADA, detalhe)
    fetch = executar_git(pasta, ["fetch", REMOTO, BRANCH_PRINCIPAL])
    if fetch.returncode != 0:
        return ResultadoPasta(pasta.name, SITUACAO_ERRO, primeira_linha(fetch.stderr))
    if ja_esta_em_dia(pasta):
        return ResultadoPasta(pasta.name, SITUACAO_EM_DIA, hash_atual(pasta))
    pull = executar_git(
        pasta, ["pull", "--rebase", "--autostash", REMOTO, BRANCH_PRINCIPAL]
    )
    if pull.returncode == 0:
        return ResultadoPasta(pasta.name, SITUACAO_ATUALIZADA, hash_atual(pasta))
    return classificar_falha(pasta, pull)


def formatar_quadro(resultados: list[ResultadoPasta]) -> str:
    """Monta o quadro em texto puro com Pasta, Situação e Detalhe.

    Args:
        resultados: Resultados das pastas processadas.

    Returns:
        Texto do quadro, com colunas alinhadas.
    """
    linhas = [("Pasta", "Situação", "Detalhe")]
    linhas += [(item.pasta, item.situacao, item.detalhe) for item in resultados]
    larguras = [max(len(linha[indice]) for linha in linhas) for indice in range(3)]
    corpo = [
        " | ".join(celula.ljust(largura) for celula, largura in zip(linha, larguras))
        for linha in linhas
    ]
    separador = "-+-".join("-" * largura for largura in larguras)
    return "\n".join([corpo[0], separador, *corpo[1:]])


def selecionar_pastas(nome_pasta: str | None) -> list[Path]:
    """Escolhe as pastas a processar, todas ou uma só.

    Args:
        nome_pasta: Nome de uma pasta, ou None para todas.

    Returns:
        Pastas selecionadas.
    """
    pastas = listar_pastas(PASTA_RAIZ)
    if nome_pasta is None:
        return pastas
    return [pasta for pasta in pastas if pasta.name == nome_pasta]


def montar_parser() -> argparse.ArgumentParser:
    """Monta a leitura dos argumentos da linha de comando.

    Returns:
        Parser configurado.
    """
    parser = argparse.ArgumentParser(
        description="Atualiza os repositórios de C:\\fontes com a main do origin."
    )
    parser.add_argument("--pasta", help="nome de uma pasta só, ex.: aulasenai")
    return parser


def principal() -> int:
    """Executa a atualização e imprime o quadro.

    Returns:
        0 se nenhuma pasta teve problema, 1 se alguma teve, 2 se nenhuma pasta foi achada.
    """
    argumentos = montar_parser().parse_args()
    pastas = selecionar_pastas(argumentos.pasta)
    if not pastas:
        print("Nenhuma pasta encontrada para atualizar.")
        return 2
    resultados = [atualizar_pasta(pasta) for pasta in pastas]
    print(formatar_quadro(resultados))
    houve_problema = any(item.situacao in SITUACOES_COM_PROBLEMA for item in resultados)
    return 1 if houve_problema else 0


if __name__ == "__main__":
    sys.exit(principal())
