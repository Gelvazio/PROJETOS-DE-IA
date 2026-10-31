"""Coleta os modelos 3D abertos do Hugging Face Hub pela API pública (sem token).

Uso: python dashboard/scripts/coletar_hf.py
Saída: dashboard/scripts/saida/hf_3d.json (fora do Git)

A API do Hub é pública para modelos públicos e não exige chave. Os campos usados são os
metadados que a página do modelo mostra: downloads, likes, tarefa, licença, biblioteca e datas.
"""
import json
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

PASTA_SAIDA = Path(__file__).resolve().parent / "saida"
ARQUIVO_SAIDA = PASTA_SAIDA / "hf_3d.json"
URL_API = "https://huggingface.co/api/models"
URL_MODELOS = "https://huggingface.co/models?pipeline_tag=text-to-3d"
USER_AGENT = "rules-ai-dashboard/1.0 (https://github.com/Gelvazio/rules-ai)"
TAREFAS = ("text-to-3d", "image-to-3d")
LIMITE_POR_TAREFA = 30
MAX_MODELOS = 20
TEMPO_LIMITE = 30


def consultar(tarefa):
    """Modelos de uma tarefa, do mais baixado para o menos baixado."""
    parametros = urllib.parse.urlencode({
        "filter": tarefa,
        "sort": "downloads",
        "direction": -1,
        "limit": LIMITE_POR_TAREFA,
        # sem full=true a lista omite author/lastModified/gated
        "full": "true",
    })
    pedido = urllib.request.Request(
        f"{URL_API}?{parametros}",
        headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
    )
    with urllib.request.urlopen(pedido, timeout=TEMPO_LIMITE) as resposta:
        return json.loads(resposta.read().decode("utf-8"))


def licenca(tags):
    """Licença declarada nas tags (ex.: 'license:apache-2.0' -> 'apache-2.0')."""
    for tag in tags:
        if tag.startswith("license:"):
            return tag.split(":", 1)[1]
    return "nao_declarada"


def registro(modelo):
    """Metadados públicos de um modelo no formato do ferramentas.js."""
    tags = modelo.get("tags", [])
    identificador = modelo.get("id") or modelo.get("modelId")
    return {
        "id": identificador,
        "url": f"https://huggingface.co/{identificador}",
        "autor": modelo.get("author"),
        "tarefas": [tag for tag in TAREFAS if tag in tags],
        "pipeline_tag": modelo.get("pipeline_tag"),
        "downloads": modelo.get("downloads"),
        "likes": modelo.get("likes"),
        "licenca": licenca(tags),
        "biblioteca": modelo.get("library_name"),
        "criado_em": modelo.get("createdAt"),
        "atualizado_em": modelo.get("lastModified"),
        "gated": bool(modelo.get("gated")),
    }


def coletar():
    """Consulta as tarefas de 3D e devolve os modelos sem repetição, do mais baixado ao menos."""
    vistos = {}
    erros = []
    for tarefa in TAREFAS:
        try:
            modelos = consultar(tarefa)
        except (urllib.error.URLError, TimeoutError, ValueError) as erro:
            erros.append(f"{tarefa}: {erro}")
            continue
        for modelo in modelos:
            identificador = modelo.get("id") or modelo.get("modelId")
            if identificador and identificador not in vistos:
                vistos[identificador] = registro(modelo)
    if not vistos:
        raise SystemExit("Nenhum modelo coletado: " + "; ".join(erros))
    ordenados = sorted(vistos.values(), key=lambda m: m.get("downloads") or 0, reverse=True)
    return ordenados[:MAX_MODELOS], erros


def main():
    modelos, erros = coletar()
    PASTA_SAIDA.mkdir(parents=True, exist_ok=True)
    saida = {
        "data_consulta": datetime.now().isoformat(timespec="minutes"),
        "fonte": URL_MODELOS,
        "api": URL_API,
        "tarefas": list(TAREFAS),
        "modelos": modelos,
        "erros": erros,
    }
    ARQUIVO_SAIDA.write_text(json.dumps(saida, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Coletados {len(modelos)} modelos 3D abertos em {ARQUIVO_SAIDA}")
    for erro in erros:
        print("aviso:", erro)


if __name__ == "__main__":
    main()
