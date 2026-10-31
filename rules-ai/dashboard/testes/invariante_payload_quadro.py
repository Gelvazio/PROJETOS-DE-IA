"""Teste de invariante do payload do canal (AGENTES-REALTIME.9, ETAPA-040, C34).

INV-1: o payload só tem os campos permitidos em R2.1 (envelope do `estado`, 11 campos de tarefa,
       e `projetos` só com id/nome).
INV-2: nenhum projeto de DEMAIS-PROJETOS-* (nem pasta oculta) no payload nem em projetos.json.
Gera o payload de todos os quadros de C:\\fontes que `listar_projetos` libera (a pasta ignorada
não é aberta) e passa cada um pelo guardrail da .8. Só leitura: sem rede, sem gravar, sem
imprimir títulos nem valores redigidos.
Uso: python -B dashboard/testes/invariante_payload_quadro.py
"""
import sys

sys.dont_write_bytecode = True

import json
import os
import subprocess
from pathlib import Path

PASTA_DASHBOARD = Path(__file__).resolve().parent.parent
RAIZ = PASTA_DASHBOARD.parent
PASTA_FONTES = RAIZ.parent
sys.path.insert(0, str(PASTA_DASHBOARD))

import gerar_projetos  # noqa: E402
import privacidade_quadro as privacidade  # noqa: E402
import publicar_quadro as publicador  # noqa: E402
import quadro_tarefas as quadro  # noqa: E402

# R2.1 escrito à mão (não importado) para o teste não herdar um erro do código que confere.
ENVELOPE = {"versao", "projeto", "atualizado_em", "commit", "publicado_em", "sequencia",
            "atraso_padrao", "intervalo", "tarefas"}
CAMPOS_TAREFA = {"tarefa", "titulo", "pai", "mae", "nivel", "status", "agente", "desde",
                 "progresso", "global", "indice"}
INDICE = {"versao", "padrao", "publicado_em", "sequencia", "projetos"}
INDICE_ARQUIVO = {"padrao", "projetos"}
CAMPOS_PROJETO = {"id", "nome"}
PROIBIDO = "DEMAIS-PROJETOS-NAO-MEXER-AGORA"
falhas = []


def conferir(condicao, mensagem):
    print(("ok    " if condicao else "FALHA ") + mensagem)
    if not condicao:
        falhas.append(mensagem)


def proibido(identificador):
    return not isinstance(identificador, str) or identificador.startswith(
        ("DEMAIS-PROJETOS-", "."))


def campos_estado_ok(payload):
    """True se envelope e tarefas só têm campos de R2.1."""
    if not set(payload) <= ENVELOPE:
        return False
    return all(set(t) <= CAMPOS_TAREFA for t in payload.get("tarefas", []))


def payload_do_projeto(identificador):
    """Payload real do `estado` de um projeto, montado pelo publicador e protegido pela .8."""
    raiz_original = publicador.RAIZ
    publicador.RAIZ = PASTA_FONTES / identificador
    try:
        bruto = publicador.montar_payload(identificador, simular=True)
    finally:
        publicador.RAIZ = raiz_original
    return privacidade.proteger_estado(bruto)[0]


def inv_todos_os_quadros():
    """INV-1 e INV-2 no payload de cada quadro liberado de C:\\fontes."""
    projetos = quadro.listar_projetos(PASTA_FONTES)
    conferir(bool(projetos), f"quadros liberados encontrados: {len(projetos)}")
    conferir(not any(proibido(p["id"]) for p in projetos),
             "INV-2 listar_projetos não devolve DEMAIS-PROJETOS-* nem pasta oculta")
    for item in projetos:
        try:
            payload = payload_do_projeto(item["id"])
        except ValueError as erro:
            print(f"aviso {item['id']}: quadro fora do formato, pulado ({type(erro).__name__})")
            continue
        conferir(campos_estado_ok(payload) and not proibido(payload["projeto"]),
                 f"INV-1/INV-2 {item['id']}: {len(payload['tarefas'])} tarefas, só campos R2.1")


def inv1_campo_extra_descartado():
    """INV-1: campo fora da lista, no envelope ou na tarefa, não chega ao payload."""
    bruto = {"versao": 1, "projeto": "rules-ai", "sequencia": 0, "segredo": "x", "modelo": "y",
             "tarefas": [{"tarefa": "T.1", "titulo": "ok", "em_uso_por": "z", "linha": 3}]}
    limpo = privacidade.proteger_estado(bruto)[0]
    conferir(campos_estado_ok(limpo) and "segredo" not in limpo
             and "em_uso_por" not in limpo["tarefas"][0],
             "INV-1 guardrail descarta campo extra no envelope e na tarefa")
    indice = {"versao": 1, "padrao": "rules-ai", "extra": 1,
              "projetos": [{"id": "rules-ai", "nome": "Rules Ai", "caminho": "C:/x"}]}
    limpo = privacidade.proteger_indice(indice)[0]
    conferir(set(limpo) <= INDICE and all(set(p) <= CAMPOS_PROJETO for p in limpo["projetos"]),
             "INV-1 guardrail descarta campo extra no evento projetos")


def recusa(funcao, payload):
    try:
        funcao(payload)
    except ValueError:
        return True
    return False


def inv2_projeto_proibido_recusado():
    """INV-2: guardrail e publicador recusam projeto proibido ou oculto."""
    for projeto in (PROIBIDO, ".claude", "", None):
        conferir(recusa(privacidade.proteger_estado, {"projeto": projeto, "tarefas": []}),
                 f"INV-2 proteger_estado recusa projeto {projeto!r}")
    indice = {"versao": 1, "padrao": "rules-ai",
              "projetos": [{"id": "rules-ai", "nome": "R"}, {"id": PROIBIDO, "nome": "D"}]}
    conferir(recusa(privacidade.proteger_indice, indice),
             "INV-2 proteger_indice recusa lista com DEMAIS-PROJETOS-*")
    conferir(recusa(publicador.validar_projeto, PROIBIDO),
             "INV-2 publicador.validar_projeto recusa DEMAIS-PROJETOS-*")


def inv_projetos_json():
    """INV-1 e INV-2 em projetos.json gravado e na lista que o gerador monta agora."""
    gravado = json.loads((PASTA_DASHBOARD / "projetos.json").read_text(encoding="utf-8"))
    gerado = gerar_projetos.montar_lista()
    for nome, dados in (("projetos.json", gravado), ("gerar_projetos", gerado)):
        itens = dados.get("projetos", [])
        conferir(set(dados) <= INDICE_ARQUIVO and all(set(p) <= CAMPOS_PROJETO for p in itens),
                 f"INV-1 {nome} só com padrao e projetos[id, nome]")
        conferir(not any(proibido(p.get("id")) for p in itens) and not proibido(dados["padrao"]),
                 f"INV-2 {nome} sem DEMAIS-PROJETOS-* nem pasta oculta")
    indice = {"versao": 1, "publicado_em": "", "sequencia": 0, **gravado}
    conferir(not recusa(privacidade.proteger_indice, indice),
             "INV-2 projetos.json passa no guardrail do evento projetos")


def inv_saida_do_publicador():
    """INV-1 no que o publicador imprime de fato com --simular (processo separado, sem chave)."""
    env = {k: v for k, v in os.environ.items() if k != publicador.VARIAVEL_CHAVE}
    env["PYTHONIOENCODING"] = "utf-8"
    saida = subprocess.run([sys.executable, "-B", str(PASTA_DASHBOARD / "publicar_quadro.py"),
                            "--simular"], env=env, capture_output=True, text=True,
                           encoding="utf-8", timeout=60)
    try:
        payload = json.loads(saida.stdout)
    except json.JSONDecodeError:
        payload = None
    conferir(saida.returncode == 0 and payload is not None and campos_estado_ok(payload)
             and not proibido(payload.get("projeto")),
             "INV-1/INV-2 saída do publicador --simular só com campos R2.1")


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    inv_todos_os_quadros()
    inv1_campo_extra_descartado()
    inv2_projeto_proibido_recusado()
    inv_projetos_json()
    inv_saida_do_publicador()
    print(f"\n{len(falhas)} falha(s).")
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
