"""Gera analises.json com o mapa completo de C:\\fontes para analise por IA.

Le todos os arquivos de texto da raiz e das subpastas, exceto as pastas
excluidas (rules-ai, aulasenai, ai-memory e DEMAIS-PROJETOS-*, regra C23).
Pastas geradas/pesadas (.git, node_modules, dist...) so contam e pesam.
Segredos e binarios entram so com metadados, sem conteudo.

Uso:    python analises.py
Saida:  analises.json (na mesma pasta deste script)
"""

import json
import os
from datetime import datetime, timezone
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
SAIDA = RAIZ / "analises.json"

# Pastas de primeiro nivel que o script nao entra nem lista o conteudo.
PASTAS_EXCLUIDAS = {"rules-ai", "aulasenai", "ai-memory"}
PREFIXOS_EXCLUIDOS = ("DEMAIS-PROJETOS-",)
MOTIVOS_EXCLUSAO = {
    "rules-ai": "pedido do usuario (tem quadro e regras proprios)",
    "aulasenai": "pedido do usuario (tem quadro e regras proprios)",
    "ai-memory": "pedido do usuario (repositorio proprio, ja documentado)",
    "DEMAIS-PROJETOS-*": "regra C23: projetos parados, nenhuma IA le",
}

# Pastas em qualquer nivel: contam arquivos e bytes, mas nao leem conteudo.
PASTAS_IGNORADAS = {
    ".git", ".idea", ".vscode", ".vercel", "__pycache__", ".mypy_cache",
    ".pytest_cache", "node_modules", "dist", "build", "target", "out",
    "graphify-out", "_backup-git", "venv", ".venv", "coverage",
}

# Caminhos especificos (relativos a raiz) ignorados por serem saida ou pacote.
CAMINHOS_IGNORADOS = {
    "COORDENACAO-DE-PROJETOS/AutoSwarm/output": "saida gerada (gitignore da raiz)",
    "COORDENACAO-DE-PROJETOS/AutoSwarm/autoswarm-v1.0.0": "pacote vendored de terceiros",
}

# Arquivos cujo conteudo nunca entra no JSON (so metadados).
NOMES_SEGREDO = {
    "config-de-tarefa-agendada.txt", "variaveis.js", "id_rsa", "id_dsa",
    "id_ecdsa", "id_ed25519", ".htpasswd", "credentials", "secrets.json",
}
PREFIXOS_SEGREDO = (".env",)
SUFIXOS_SEGREDO = (".key", ".pem", ".pfx", ".p12", ".keystore", ".jks")

EXTENSOES_BINARIAS = {
    ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".webp", ".tif",
    ".tiff", ".psd", ".ai", ".mp4", ".mov", ".avi", ".mkv", ".webm",
    ".mp3", ".wav", ".ogg", ".flac", ".m4a", ".pdf", ".doc", ".docx",
    ".xls", ".xlsx", ".ppt", ".pptx", ".odt", ".ods", ".odp", ".zip",
    ".rar", ".7z", ".tar", ".gz", ".bz2", ".xz", ".iso", ".exe", ".dll",
    ".msi", ".com", ".so", ".dylib", ".bin", ".dat", ".pak", ".wasm",
    ".class", ".jar", ".pyc", ".pyo", ".o", ".obj", ".lib", ".a", ".ttf",
    ".otf", ".woff", ".woff2", ".eot", ".db", ".sqlite", ".sqlite3",
    ".mdb", ".parquet", ".h5", ".pt", ".pth", ".onnx",
}

MAX_CARACTERES = 150_000


def pasta_excluida(nome):
    """True se a pasta de primeiro nivel nao deve ser lida de jeito nenhum."""
    return nome in PASTAS_EXCLUIDAS or nome.startswith(PREFIXOS_EXCLUIDOS)


def motivo_exclusao(nome):
    if nome in MOTIVOS_EXCLUSAO:
        return MOTIVOS_EXCLUSAO[nome]
    return MOTIVOS_EXCLUSAO["DEMAIS-PROJETOS-*"]


def pasta_ignorada(caminho_rel, nome):
    """True se a pasta entra so no resumo (contagem e bytes), sem leitura."""
    if nome in PASTAS_IGNORADAS:
        return "pasta gerada ou de dependencias"
    return CAMINHOS_IGNORADOS.get(caminho_rel)


def arquivo_segredo(nome):
    """True se o conteudo do arquivo nao pode sair no JSON."""
    nome_lower = nome.lower()
    if nome_lower in NOMES_SEGREDO or nome_lower.startswith(PREFIXOS_SEGREDO):
        return True
    return any(nome_lower.endswith(s) for s in SUFIXOS_SEGREDO)


def contar_pasta(caminho):
    """Conta arquivos e bytes de uma pasta ignorada, sem ler conteudo."""
    total_arquivos, total_bytes = 0, 0
    for base, _, arquivos in os.walk(caminho):
        for nome in arquivos:
            total_arquivos += 1
            try:
                total_bytes += os.path.getsize(os.path.join(base, nome))
            except OSError:
                pass
    return total_arquivos, total_bytes


def ler_texto(caminho):
    """Le o arquivo como texto; devolve (texto, truncado) ou (None, False)."""
    try:
        with open(caminho, "rb") as arq:
            inicio = arq.read(8192)
        if b"\x00" in inicio:
            return None, False
        for codificacao in ("utf-8-sig", "utf-8", "latin-1"):
            try:
                with open(caminho, encoding=codificacao) as arq:
                    texto = arq.read(MAX_CARACTERES + 1)
                return texto[:MAX_CARACTERES], len(texto) > MAX_CARACTERES
            except UnicodeDecodeError:
                continue
    except OSError:
        pass
    return None, False


def varrer():
    """Percorre a raiz e devolve arquivos, pastas ignoradas e a arvore."""
    arquivos, ignoradas = [], []
    arvore = {}
    excluidas = []

    for entrada in sorted(RAIZ.iterdir(), key=lambda p: p.name.lower()):
        if entrada.is_dir() and pasta_excluida(entrada.name):
            excluidas.append({"pasta": entrada.name, "motivo": motivo_exclusao(entrada.name)})

    for base, pastas, nomes in os.walk(RAIZ):
        base_rel = Path(base).relative_to(RAIZ).as_posix()
        if base_rel == ".":
            base_rel = ""
        partes = base_rel.split("/") if base_rel else []
        if partes and pasta_excluida(partes[0]):
            pastas[:] = []
            continue
        mantidas = []
        for nome in sorted(pastas, key=str.lower):
            rel = f"{base_rel}/{nome}".lstrip("/")
            motivo = pasta_ignorada(rel, nome)
            if partes == [] and pasta_excluida(nome):
                continue
            if motivo:
                qtd, bytes_ = contar_pasta(os.path.join(base, nome))
                ignoradas.append({"caminho": rel, "arquivos": qtd,
                                  "bytes": bytes_, "motivo": motivo})
            else:
                mantidas.append(nome)
        pastas[:] = mantidas
        no = arvore.setdefault(base_rel, {"pastas": set(), "arquivos": 0})
        no["pastas"].update(mantidas)
        no["arquivos"] += len(nomes)
        for nome in nomes:
            registro = registrar_arquivo(Path(base) / nome, base_rel)
            if registro:
                arquivos.append(registro)
    return arquivos, ignoradas, arvore, excluidas


def registrar_arquivo(caminho, base_rel):
    """Monta o registro JSON de um arquivo (texto, binario ou segredo)."""
    nome = caminho.name
    if caminho.resolve() == SAIDA.resolve():
        return None
    try:
        tamanho = caminho.stat().st_size
    except OSError:
        return None
    rel = f"{base_rel}/{nome}".lstrip("/")
    registro = {
        "caminho": rel,
        "pasta_raiz": rel.split("/")[0] if "/" in rel else "(raiz)",
        "tamanho_bytes": tamanho,
        "extensao": caminho.suffix.lower() or "(sem extensao)",
    }
    if arquivo_segredo(nome):
        registro["tipo"] = "segredo"
    elif caminho.suffix.lower() in EXTENSOES_BINARIAS:
        registro["tipo"] = "binario"
    else:
        texto, truncado = ler_texto(caminho)
        if texto is None:
            registro["tipo"] = "binario"
        else:
            registro.update({"tipo": "texto", "conteudo": texto,
                             "linhas": texto.count("\n") + 1,
                             "truncado": truncado})
    return registro


def montar_arvore(arvore):
    """Renderiza a arvore de diretorios em texto (pastas com contagem)."""
    linhas = ["fontes/"]

    def ramo(base_rel, prefixo):
        no = arvore.get(base_rel, {"pastas": set(), "arquivos": 0})
        itens = sorted(no["pastas"], key=str.lower)
        for i, nome in enumerate(itens):
            ultimo = i == len(itens) - 1
            filho = f"{base_rel}/{nome}".lstrip("/")
            sub = arvore.get(filho, {"arquivos": 0})
            linhas.append(f"{prefixo}{'└── ' if ultimo else '├── '}{nome}/ "
                          f"({sub['arquivos']} arquivos)")
            ramo(filho, prefixo + ("    " if ultimo else "│   "))

    ramo("", "")
    return "\n".join(linhas)


def resumir(arquivos):
    """Agrega contagens por pasta de primeiro nivel e totais gerais."""
    por_pasta, totais = {}, {"arquivos": 0, "bytes": 0, "linhas_texto": 0}
    for reg in arquivos:
        raiz = reg["pasta_raiz"]
        acc = por_pasta.setdefault(raiz, {"arquivos": 0, "bytes": 0,
                                          "texto": 0, "binario": 0, "segredo": 0})
        acc["arquivos"] += 1
        acc["bytes"] += reg["tamanho_bytes"]
        acc[reg["tipo"]] += 1
        totais["arquivos"] += 1
        totais["bytes"] += reg["tamanho_bytes"]
        totais["linhas_texto"] += reg.get("linhas", 0)
    return {"totais": totais, "por_pasta_raiz": dict(sorted(por_pasta.items()))}


def main():
    arquivos, ignoradas, arvore, excluidas = varrer()
    saida = {
        "objetivo": ("mapa completo de C:\\fontes para uma IA analisar tudo e "
                     "propor uma organizacao melhor; conteudo integral dos "
                     "arquivos de texto, metadados de binarios e segredos"),
        "gerado_em": datetime.now(timezone.utc).astimezone().isoformat(),
        "raiz": str(RAIZ),
        "pastas_excluidas": excluidas,
        "pastas_ignoradas": ignoradas,
        "resumo": resumir(arquivos),
        "arvore": montar_arvore(arvore),
        "arquivos": arquivos,
    }
    SAIDA.write_text(json.dumps(saida, ensure_ascii=False, indent=2),
                     encoding="utf-8")
    r = saida["resumo"]["totais"]
    print(f"OK {SAIDA.name}: {r['arquivos']} arquivos, "
          f"{r['bytes'] / 1e6:.1f} MB, {len(ignoradas)} pastas ignoradas, "
          f"{len(excluidas)} excluidas")


if __name__ == "__main__":
    main()
