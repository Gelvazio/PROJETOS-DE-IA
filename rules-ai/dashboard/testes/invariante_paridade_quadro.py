"""Invariante INV-4 da etapa 040 (AGENTES-REALTIME.6, C34): leitor JS igual ao Python.

Uso: python -B dashboard/testes/invariante_paridade_quadro.py   (precisa do node; sem rede)
Compara assets/js/agentes/quadro.js com quadro_tarefas.py nos quadros liberados e em casos de borda.
"""
import sys

sys.dont_write_bytecode = True

import json
import subprocess
import tempfile
from pathlib import Path

PASTA_DASHBOARD = Path(__file__).resolve().parent.parent
RAIZ = PASTA_DASHBOARD.parent
sys.path.insert(0, str(PASTA_DASHBOARD))

import publicar_quadro as publicador  # noqa: E402
import quadro_tarefas as quadro  # noqa: E402

LEITOR_JS = PASTA_DASHBOARD / "assets" / "js" / "agentes" / "quadro.js"
EXECUTOR_JS = """
const fs = require("fs");
const fonte = fs.readFileSync(process.argv[1], "utf8");
import("data:text/javascript;base64," + Buffer.from(fonte).toString("base64")).then((m) => {
  const saida = {};
  for (const caminho of JSON.parse(fs.readFileSync(0, "utf8"))) {
    try { saida[caminho] = m.lerQuadro(fs.readFileSync(caminho, "utf8")).tarefas; }
    catch (e) { saida[caminho] = { erro: e.message }; }
  }
  process.stdout.write(JSON.stringify(saida));
});
"""
CABECALHO = "| Tarefa | Título | Modelo | Status | Em uso por |\n|---|---|---|---|---|\n"
CASOS = {
    "basico": CABECALHO + "| **1** | Mãe 🌐 | PESADO | ⬜ | — |\n| `1.1` | Filha | LEVE | 🔄 | "
              "Claude (desde 2026-10-23 10:00) · 40% |\n",
    "percentual-acima-de-100": CABECALHO + "| 2.1 | X | MEDIO | 👀 | Ana · 250 % |\n",
    "desde-repetido": CABECALHO + "| 3.1 | X | USUARIO | ⛔ | A desde 2026-01-01 00:00 "
                      "desde 2026-02-02 00:00 |\n",
    "colunas-curtas": CABECALHO + "| 4.1 | só titulo |\n| 4.2 |\n",
    "linha-vazia-e-extra": CABECALHO + "| | sem tarefa | | | |\n| 5 | A | | ✅ | x | extra |\n",
    "sem-emoji-e-concluido": CABECALHO + "| 6 | A | | texto | |\n| 7 | B | | ⏹ ✅ | |\n",
    "crlf": (CABECALHO + "| 8 | A | leve | ⬜ | — |\n| 9 | B | MEDIO | 🔄 | Zé |\n")
            .replace("\n", "\r\n"),
    "tabela-depois-do-titulo-com-texto": "x\n## 📌 Tarefas\n\ntexto\n" + CABECALHO
                                         + "| 10 | A | | ⬜ | |\n",
    "colunas-em-outra-ordem": "## 📌 Tarefas\n| Status | Em uso por | Tarefa | Título |\n|-|-|-|-|\n"
                              "| 🔄 | Bia · 5% | 11.2 | Z |\n",
    "linha-mais-curta-que-a-coluna-tarefa": "## 📌 Tarefas\n| Status | Em uso por | Tarefa |\n"
                                            "|-|-|-|\n| 🔄 | Bia |\n| ⬜ | — | 14 |\n",
    "cabecalho-com-negrito": "## 📌 Tarefas\n| **Tarefa** | `Status` |\n|-|-|\n| 12 | ⬜ |\n",
    "sem-secao": "| Tarefa | Status |\n|-|-|\n| 1 | ⬜ |\n",
    "sem-colunas-obrigatorias": "## 📌 Tarefas\n| Título | Modelo |\n|-|-|\n| a | b |\n",
    "so-cabecalho": "## 📌 Tarefas\n| Tarefa | Status |\n",
    "separador-unicode": "## 📌 Tarefas | Tarefa | Status |\n|-|-|\n| 13 | ⬜ |\n",
}


def quadros_liberados():
    return [RAIZ.parent / p / "tasks" / "STATUS.md" for p in publicador.PROJETOS_PERMITIDOS]


def resultado_python(caminho):
    try:
        return quadro.ler_quadro(caminho)["tarefas"]
    except ValueError as erro:
        return {"erro": str(erro)}


def resultado_js(caminhos):
    execucao = subprocess.run(["node", "-e", EXECUTOR_JS, str(LEITOR_JS)], input=json.dumps(
        [str(c) for c in caminhos]), capture_output=True, text=True, encoding="utf-8", timeout=60)
    if execucao.returncode != 0:
        raise SystemExit("node falhou: " + execucao.stderr.strip())
    return json.loads(execucao.stdout)


def main():
    with tempfile.TemporaryDirectory() as temporaria:
        arquivos = {}
        for nome, texto in CASOS.items():
            arquivos[nome] = Path(temporaria, nome + ".md")
            arquivos[nome].write_bytes(texto.encode("utf-8"))
        for caminho in quadros_liberados():
            arquivos["liberado:" + caminho.parts[-3]] = caminho
        js = resultado_js(arquivos.values())
        falhas = 0
        for nome, caminho in arquivos.items():
            igual = resultado_python(caminho) == js[str(caminho)]
            falhas += not igual
            print(("ok    " if igual else "FALHA ") + nome)
    print("INV-4:", "sem diferença" if not falhas else f"{falhas} diferença(s)")
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
