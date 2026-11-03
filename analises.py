"""Gera ANALISES/ com o mapa completo de C:\\fontes para analise por IA.

Le todos os arquivos de texto da raiz e das subpastas, exceto as pastas
excluidas (rules-ai, aulasenai, ai-memory; DEMAIS-PROJETOS-NAO-MEXER-AGORA
entra por pedido explicito do usuario em 2026-11-03, excecao da regra C23;
DEMAIS-PROJETOS-DE-SISTEMAS-MANTER-OFFLINE segue fora pela regra C20).
Pastas geradas/pesadas (.git, node_modules, dist...) so contam e pesam.
Segredos e binarios entram so com metadados, sem conteudo.

Saida:  ANALISES/_indice.json        (arvore, resumo, exclusoes, manifesto)
        ANALISES/<grupo>/parte-NN.json (arquivos de cada pasta-raiz, ~20 MB/parte)
A pasta ANALISES fica fora do Git: ela carrega conteudo de pastas que o
.gitignore da raiz exclui de proposito (DEMAIS-*).

Uso:    python analises.py
"""

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
SAIDA_DIR = RAIZ / "ANALISES"
INDICE = SAIDA_DIR / "_indice.json"

# Pastas de primeiro nivel que o script nao entra nem lista o conteudo.
PASTAS_EXCLUIDAS = {
    "rules-ai", "aulasenai", "ai-memory",
    "DEMAIS-PROJETOS-DE-SISTEMAS-MANTER-OFFLINE",  # regra C20 (se voltar)
}
MOTIVOS_EXCLUSAO = {
    "rules-ai": "pedido do usuario (tem quadro e regras proprios)",
    "aulasenai": "pedido do usuario (tem quadro e regras proprios)",
    "ai-memory": "pedido do usuario (repositorio proprio, ja documentado)",
    "DEMAIS-PROJETOS-DE-SISTEMAS-MANTER-OFFLINE": "regra C20: pasta offline, nunca ler",
    "ANALISES": "saida deste script",
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

MAX_CARACTERES = 150_000          # teto do conteudo de cada arquivo
MAX_PARTE_CARACTERES = 20_000_000  # ~20 MB de conteudo por parte JSON

# Tokens/chaves dentro do texto sao mascarados: a analise precisa saber que o
# segredo existe, nunca o valor (projetos parados guardam JWTs e chaves reais).
PADROES_TOKEN = [
    (re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----.*?-----END [A-Z ]*PRIVATE KEY-----",
                re.DOTALL), "<CHAVE-PRIVADA-REMOVIDA>"),
    (re.compile(r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}"),
     "<JWT-REMOVIDO>"),
    (re.compile(r"(?:sk|ghp|gho|xox[baprs]|github_pat|npm|pgp)[-_][A-Za-z0-9_-]{16,}"),
     "<TOKEN-REMOVIDO>"),
    (re.compile(r"AKIA[0-9A-Z]{16}"), "<AWS-KEY-REMOVIDA>"),
]


def mascarar_segredos(texto):
    """Troca tokens/chaves por marcadores; devolve (texto, n_mascaras)."""
    total = 0
    for padrao, marcador in PADROES_TOKEN:
        texto, n = padrao.subn(marcador, texto)
        total += n
    return texto, total


def pasta_excluida(nome):
    """True se a pasta de primeiro nivel nao deve ser lida de jeito nenhum."""
    return nome in PASTAS_EXCLUIDAS or nome == SAIDA_DIR.name


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


def registrar_arquivo(caminho, base_rel):
    """Monta o registro JSON de um arquivo (texto, binario ou segredo)."""
    nome = caminho.name
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
            texto, mascaras = mascarar_segredos(texto)
            registro.update({"tipo": "texto", "conteudo": texto,
                             "linhas": texto.count("\n") + 1,
                             "truncado": truncado})
            if mascaras:
                registro["segredos_mascarados"] = mascaras
    return registro


def varrer():
    """Percorre a raiz e devolve arquivos, pastas ignoradas, arvore e excluidas."""
    arquivos, ignoradas, excluidas = [], [], []
    arvore = {}

    for entrada in sorted(RAIZ.iterdir(), key=lambda p: p.name.lower()):
        if entrada.is_dir() and pasta_excluida(entrada.name):
            excluidas.append({"pasta": entrada.name,
                              "motivo": MOTIVOS_EXCLUSAO.get(entrada.name, "excluida")})

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
            if not partes and pasta_excluida(nome):
                continue
            motivo = pasta_ignorada(rel, nome)
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
    por_pasta, totais = {}, {"arquivos": 0, "bytes": 0, "linhas_texto": 0,
                             "segredos_mascarados": 0}
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
        totais["segredos_mascarados"] += reg.get("segredos_mascarados", 0)
    return {"totais": totais, "por_pasta_raiz": dict(sorted(por_pasta.items()))}


def slug_grupo(nome):
    """Nome de pasta seguro para o grupo ('(raiz)' -> 'raiz', '.x' -> 'x')."""
    if nome == "(raiz)":
        return "raiz"
    return nome.lstrip(".").strip() or "raiz"


def limpar_saida():
    """Apaga as partes geradas na execucao anterior (manifesto do indice)."""
    if not INDICE.exists():
        return
    try:
        antigo = json.loads(INDICE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        antigo = {}
    for parte in antigo.get("arquivos_partes", []):
        alvo = SAIDA_DIR / parte.get("arquivo", "")
        if alvo.is_file():
            alvo.unlink()
    INDICE.unlink(missing_ok=True)
    for filho in SAIDA_DIR.iterdir():
        if filho.is_dir() and not any(filho.iterdir()):
            filho.rmdir()


def escrever_partes(arquivos):
    """Grava ANALISES/<grupo>/parte-NN.json e devolve o manifesto das partes."""
    grupos = {}
    for reg in arquivos:
        grupos.setdefault(reg["pasta_raiz"], []).append(reg)
    manifesto = []
    for grupo in sorted(grupos, key=str.lower):
        registros = grupos[grupo]
        partes, atual, tamanho = [], [], 0
        for reg in registros:
            estimado = len(reg.get("conteudo") or "") + 2000
            if atual and tamanho + estimado > MAX_PARTE_CARACTERES:
                partes.append(atual)
                atual, tamanho = [], 0
            atual.append(reg)
            tamanho += estimado
        if atual:
            partes.append(atual)
        pasta = SAIDA_DIR / slug_grupo(grupo)
        pasta.mkdir(parents=True, exist_ok=True)
        for i, parte in enumerate(partes, 1):
            nome = f"parte-{i:02d}.json"
            payload = {"pasta_raiz": grupo, "parte": i,
                       "total_partes": len(partes), "arquivos": parte}
            texto = json.dumps(payload, ensure_ascii=False, indent=2)
            (pasta / nome).write_text(texto, encoding="utf-8")
            manifesto.append({"arquivo": f"{slug_grupo(grupo)}/{nome}",
                              "pasta_raiz": grupo, "parte": i,
                              "registros": len(parte),
                              "bytes_json": len(texto.encode("utf-8"))})
    return manifesto


def main():
    arquivos, ignoradas, arvore, excluidas = varrer()
    limpar_saida()
    SAIDA_DIR.mkdir(exist_ok=True)
    manifesto = escrever_partes(arquivos)
    indice = {
        "objetivo": ("mapa completo de C:\\fontes para uma IA analisar tudo e "
                     "propor uma organizacao melhor; conteudo integral dos "
                     "arquivos de texto, metadados de binarios e segredos"),
        "como_ler": ("cada item de 'arquivos_partes' e um JSON com a lista "
                     "'arquivos'; 'arvore' mostra a estrutura com contagens; "
                     "'resumo' agrega por pasta-raiz"),
        "gerado_em": datetime.now(timezone.utc).astimezone().isoformat(),
        "raiz": str(RAIZ),
        "pastas_excluidas": excluidas,
        "pastas_ignoradas": ignoradas,
        "resumo": resumir(arquivos),
        "arvore": montar_arvore(arvore),
        "arquivos_partes": manifesto,
    }
    INDICE.write_text(json.dumps(indice, ensure_ascii=False, indent=2),
                      encoding="utf-8")
    r = indice["resumo"]["totais"]
    print(f"OK {SAIDA_DIR.name}/: {len(manifesto)} partes, {r['arquivos']} "
          f"arquivos, {r['bytes'] / 1e6:.1f} MB, {len(ignoradas)} ignoradas, "
          f"{len(excluidas)} excluidas")


if __name__ == "__main__":
    main()
