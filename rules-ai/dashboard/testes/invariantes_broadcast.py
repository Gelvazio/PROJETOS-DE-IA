"""Testes de invariante INV-1 a INV-4 da etapa 031 (MIGRAR-AGENTES-BROADCAST, C34).

Uso: python -B dashboard/testes/invariantes_broadcast.py   (sem rede: só --simular e 127.0.0.1)
"""
import sys

sys.dont_write_bytecode = True

import hashlib
import json
import os
import re
import subprocess
from pathlib import Path

PASTA_DASHBOARD = Path(__file__).resolve().parent.parent
RAIZ = PASTA_DASHBOARD.parent
sys.path.insert(0, str(PASTA_DASHBOARD))

import publicar_quadro as publicador  # noqa: E402
import quadro_tarefas as quadro  # noqa: E402

PUBLICADOR = PASTA_DASHBOARD / "publicar_quadro.py"
WORKFLOW = RAIZ / ".github" / "workflows" / "publicar-quadro.yml"
# Padrões montados por partes para este arquivo não casar com a própria busca (INV-1).
PADROES_CHAVE = re.compile("|".join([
    "sb_" + r"secret_[A-Za-z0-9_\-]{8,}",
    "service" + "_role",
    r"eyJ[A-Za-z0-9_\-]{10,}\.eyJ[A-Za-z0-9_\-]{10,}",
]))
CHAVE_FALSA = "sb_" + "secret_" + "TESTEinvariante0123456789"
CAMPOS_EXTRAS = {"commit", "publicado_em", "sequencia", "versao"}
CAMPOS_DO_QUADRO = {"projeto", "atraso_padrao", "intervalo"}  # além dos de ler_quadro
CAMPOS_TAREFA = {"tarefa", "titulo", "pai", "mae", "nivel", "status", "agente", "desde",
                 "progresso", "global", "indice"}
PASTAS_FORA = {".git", "node_modules", "__pycache__"}
falhas = []


def conferir(condicao, mensagem):
    print(("ok    " if condicao else "FALHA ") + mensagem)
    if not condicao:
        falhas.append(mensagem)


def rodar(*argumentos, ambiente=None):
    """Roda o publicador em outro processo (-B, sem bytecode) e devolve o resultado."""
    env = {k: v for k, v in os.environ.items() if k != "SUPABASE_SECRET_KEY"}
    env.update({"PYTHONIOENCODING": "utf-8", **(ambiente or {})})
    return subprocess.run([sys.executable, "-B", str(PUBLICADOR), *argumentos], env=env,
                          capture_output=True, text=True, encoding="utf-8", timeout=60)


def arquivos_texto(pasta):
    for caminho in pasta.rglob("*"):
        if caminho.is_file() and not PASTAS_FORA.intersection(caminho.parts):
            yield caminho


def inv1_sem_chave():
    """INV-1: nenhuma chave em dashboard/ nem no workflow; a chave nunca sai no log."""
    alvos = [*arquivos_texto(PASTA_DASHBOARD), WORKFLOW]
    achados = [str(c.relative_to(RAIZ)) for c in alvos
               if PADROES_CHAVE.search(c.read_text(encoding="utf-8", errors="ignore"))]
    conferir(not achados, f"INV-1 sem padrão de chave secreta em dashboard/ e workflow {achados}")
    linhas = [l.strip() for l in WORKFLOW.read_text(encoding="utf-8").splitlines()
              if "SUPABASE_SECRET_KEY" in l]
    conferir(linhas.count("SUPABASE_SECRET_KEY: ${{ secrets.SUPABASE_SECRET_KEY }}") == 1
             and not any(re.search(r"echo|printf|cat |set -x", l) for l in linhas),
             "INV-1 workflow só lê a chave do secret do GitHub, sem imprimir")
    ambiente = {"SUPABASE_SECRET_KEY": CHAVE_FALSA, "SUPABASE_URL": "http://127.0.0.1:9"}
    for argumentos in (["--simular"], []):
        saida = rodar(*argumentos, ambiente=ambiente)
        log = saida.stdout + saida.stderr
        conferir(CHAVE_FALSA not in log, f"INV-1 chave fora do log {argumentos or '(envio)'}")
    return saida


def inv2_campos():
    """INV-2: payload = campos de ler_quadro + projeto/atraso/intervalo + 4 extras;
    tarefas iguais às de ler_quadro."""
    caminho = RAIZ.joinpath(*quadro.CAMINHO_QUADRO)
    campos_quadro = set(quadro.ler_quadro(caminho)) | CAMPOS_DO_QUADRO
    saida = rodar("--simular")
    conferir(saida.returncode == 0, "INV-2 --simular sai com 0")
    payload = json.loads(saida.stdout)
    conferir(set(payload) == campos_quadro | CAMPOS_EXTRAS,
             f"INV-2 campos do payload = quadro + {sorted(CAMPOS_EXTRAS)}")
    conferir(payload["tarefas"] == quadro.ler_quadro(caminho)["tarefas"],
             "INV-2 tarefas idênticas à saída de ler_quadro")
    conferir(all(set(t) == CAMPOS_TAREFA for t in payload["tarefas"]),
             "INV-2 cada tarefa tem exatamente os 11 campos")
    conferir(payload["projeto"] == "rules-ai" and payload["sequencia"] == 0
             and payload["versao"] == 1, "INV-2 projeto, sequencia 0 e versao 1 no --simular")


def fotografia():
    """Hash de todos os arquivos do repositório (fora .git e caches)."""
    return {str(c): hashlib.sha256(c.read_bytes()).hexdigest() for c in arquivos_texto(RAIZ)}


def inv3_sem_gravar():
    """INV-3: nenhum arquivo do repositório muda, com sucesso e com falha."""
    antes = fotografia()
    rodar("--simular")
    rodar("--projeto", "DEMAIS-PROJETOS-X")
    rodar()  # sem chave: falha antes da rede
    rodar(ambiente={"SUPABASE_SECRET_KEY": CHAVE_FALSA, "SUPABASE_URL": "http://127.0.0.1:9"})
    depois = fotografia()
    mudou = sorted(set(antes) ^ set(depois) | {k for k in antes if antes[k] != depois.get(k)})
    conferir(not mudou, f"INV-3 repositório igual antes e depois {mudou[:5]}")


def inv4_projetos():
    """INV-4: nenhum DEMAIS-PROJETOS-* é lido nem publicado; só a lista permitida passa."""
    nomes = ["DEMAIS-PROJETOS-NAO-MEXER-AGORA", "DEMAIS-PROJETOS-DE-SISTEMAS-MANTER-OFFLINE",
             "DEMAIS-PROJETOS-", "DEMAIS-PROJETOS-rules-ai", "aulasenai", "", "../rules-ai"]
    for nome in nomes:
        try:
            publicador.validar_projeto(nome)
            conferir(False, f"INV-4 recusa {nome!r}")
        except ValueError:
            conferir(True, f"INV-4 recusa {nome!r}")
    conferir(not any(p.startswith("DEMAIS-PROJETOS-") for p in publicador.PROJETOS_PERMITIDOS),
             "INV-4 lista permitida sem DEMAIS-PROJETOS-*")
    saida = rodar("--simular", "--projeto", "DEMAIS-PROJETOS-NAO-MEXER-AGORA")
    conferir(saida.returncode != 0 and not saida.stdout,
             "INV-4 publicador sai com erro e não imprime payload de projeto proibido")


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    envio = inv1_sem_chave()
    conferir(envio.returncode != 0, "R1.2 envio com falha sai com código diferente de 0")
    inv2_campos()
    inv3_sem_gravar()
    inv4_projetos()
    print(f"\n{len(falhas)} falha(s).")
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
