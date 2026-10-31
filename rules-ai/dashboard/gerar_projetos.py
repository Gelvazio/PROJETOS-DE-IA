"""Gera dashboard/projetos.json, a lista de projetos do menu sem /api/projetos (AGENTES-REALTIME.7).

Uso: python -B dashboard/gerar_projetos.py [--verificar]
- Sem argumento: grava projetos.json (id e nome de cada projeto liberado, mais o padrão).
- --verificar: não grava; sai com 1 se o arquivo gravado diferir do gerado.
Contrato: seção "Evento projetos" da ETAPA-040 (.4). Só `padrao` e `projetos[{id,nome}]`.
"""
import sys

sys.dont_write_bytecode = True

import json
from pathlib import Path

from quadro_tarefas import CAMINHO_QUADRO, PREFIXOS_IGNORADOS, nome_do_projeto

PASTA_DASHBOARD = Path(__file__).resolve().parent
ARQUIVO_SAIDA = PASTA_DASHBOARD / "projetos.json"
PASTA_FONTES = PASTA_DASHBOARD.parent.parent
PROJETOS_LIBERADOS = ("rules-ai",)  # pergunta 3-a da etapa 040: só o rules-ai
PROJETO_PADRAO = "rules-ai"


def id_permitido(identificador):
    """INV-2: nunca DEMAIS-PROJETOS-* nem nome começando por ponto."""
    return not identificador.startswith(PREFIXOS_IGNORADOS) and not identificador.startswith(".")


def projeto_com_quadro(identificador):
    return PASTA_FONTES.joinpath(identificador, *CAMINHO_QUADRO).is_file()


def montar_lista():
    """Projetos liberados e permitidos que têm quadro, em ordem alfabética."""
    ids = sorted(i for i in PROJETOS_LIBERADOS if id_permitido(i) and projeto_com_quadro(i))
    if PROJETO_PADRAO not in ids:
        raise ValueError(f"Projeto padrão fora da lista: {PROJETO_PADRAO}")
    return {"padrao": PROJETO_PADRAO,
            "projetos": [{"id": i, "nome": nome_do_projeto(i)} for i in ids]}


def serializar(dados):
    return json.dumps(dados, ensure_ascii=False, indent=2) + "\n"


def main(argv=None):
    argumentos = sys.argv[1:] if argv is None else argv
    texto = serializar(montar_lista())
    if "--verificar" in argumentos:
        atual = ARQUIVO_SAIDA.read_text(encoding="utf-8") if ARQUIVO_SAIDA.is_file() else ""
        print("projetos.json em dia" if atual == texto else "projetos.json desatualizado")
        return 0 if atual == texto else 1
    ARQUIVO_SAIDA.write_text(texto, encoding="utf-8", newline="\n")
    print(f"projetos.json gravado ({len(texto)} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
