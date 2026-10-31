"""Marca `JEV-AI-SUGGESTION: NAO` em toda seção de subtarefa das etapas (C47).

Uso:
    python scripts/marcar_jev_ai_suggestion.py [PASTA_DO_PROJETO] [--aplicar]

Sem `--aplicar` só mostra a contagem (dry-run). A segunda execução não altera nada.
"""
import re
import sys
from pathlib import Path

CAMPO = "JEV-AI-SUGGESTION"
LINHA_PADRAO = f"- **{CAMPO}:** NAO"
PADRAO_TITULO = re.compile(r"^### [A-Z0-9][A-Z0-9-]*\.\d+ — ")
PADRAO_CAMPO = re.compile(rf"^- \*\*{CAMPO}:\*\*")
PADRAO_ITEM = re.compile(r"^- \*\*")
PASTA_ETAPAS = Path("tasks") / "etapas"
CODIGO_ERRO = 1


def achar_posicao_insercao(linhas: list[str], inicio: int, fim: int) -> int:
    """Devolve o índice onde a linha do campo entra na seção [inicio, fim).

    Entra logo depois do primeiro bloco seguido de itens `- **...**` da seção; sem itens,
    entra logo depois do título.

    Args:
        linhas: Linhas do arquivo.
        inicio: Índice do título da seção.
        fim: Índice do próximo título (exclusivo).

    Returns:
        Índice de inserção.
    """
    primeiro_item = next((i for i in range(inicio + 1, fim) if PADRAO_ITEM.match(linhas[i])), None)
    if primeiro_item is None:
        return inicio + 1
    posicao = primeiro_item
    while posicao < fim and PADRAO_ITEM.match(linhas[posicao]):
        posicao += 1
    return posicao


def limites_das_secoes(linhas: list[str]) -> list[tuple[int, int]]:
    """Lista os intervalos [inicio, fim) das seções de subtarefa.

    Args:
        linhas: Linhas do arquivo.

    Returns:
        Intervalos de cada seção cujo título é de subtarefa.
    """
    titulos = [i for i, linha in enumerate(linhas) if linha.startswith("### ")]
    intervalos = []
    for ordem, inicio in enumerate(titulos):
        fim = titulos[ordem + 1] if ordem + 1 < len(titulos) else len(linhas)
        if PADRAO_TITULO.match(linhas[inicio]):
            intervalos.append((inicio, fim))
    return intervalos


def marcar_texto(texto: str) -> tuple[str, int]:
    """Acrescenta o campo `NAO` nas seções que ainda não o têm.

    Args:
        texto: Conteúdo de uma etapa.

    Returns:
        Texto novo e quantidade de seções alteradas.
    """
    linhas = texto.split("\n")
    alteradas = 0
    for inicio, fim in reversed(limites_das_secoes(linhas)):
        if any(PADRAO_CAMPO.match(linha) for linha in linhas[inicio:fim]):
            continue
        linhas.insert(achar_posicao_insercao(linhas, inicio, fim), LINHA_PADRAO)
        alteradas += 1
    return "\n".join(linhas), alteradas


def processar_pasta(raiz: Path, aplicar: bool) -> tuple[int, int]:
    """Percorre as etapas do projeto e marca (ou só conta, no dry-run).

    Args:
        raiz: Pasta do projeto.
        aplicar: Se verdadeiro, grava os arquivos.

    Returns:
        Quantidade de arquivos e de seções alteradas.
    """
    arquivos = secoes = 0
    for caminho in sorted((raiz / PASTA_ETAPAS).glob("*.md")):
        texto = caminho.read_text(encoding="utf-8", newline="")
        fim_de_linha = "\r\n" if "\r\n" in texto else "\n"
        novo, alteradas = marcar_texto(texto.replace("\r\n", "\n"))
        if not alteradas:
            continue
        arquivos += 1
        secoes += alteradas
        if aplicar:
            caminho.write_text(novo.replace("\n", fim_de_linha), encoding="utf-8", newline="")
    return arquivos, secoes


def main(argumentos: list[str]) -> int:
    """Ponto de entrada.

    Args:
        argumentos: Argumentos da linha de comando (sem o nome do script).

    Returns:
        Código de saída (0 = ok).
    """
    aplicar = "--aplicar" in argumentos
    pastas = [a for a in argumentos if not a.startswith("--")]
    raiz = Path(pastas[0]) if pastas else Path(__file__).resolve().parent.parent
    if not (raiz / PASTA_ETAPAS).is_dir():
        print(f"Sem {PASTA_ETAPAS} em {raiz}", file=sys.stderr)
        return CODIGO_ERRO
    arquivos, secoes = processar_pasta(raiz, aplicar)
    modo = "aplicado" if aplicar else "dry-run"
    print(f"{modo}: {secoes} seção(ões) em {arquivos} arquivo(s) alterada(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
