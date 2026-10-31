"""Constantes da coleta dos links do dashboard/CLAUDE.md."""
import re
from pathlib import Path

LINKS = {
    "L04": "https://hyper3d.ai/pt",
    "L06": "https://www.hi3d.ai/pt",
    "L07": "https://v2fun.ai/pt-BR/features/ai-3d-model-generator",
    "L08": "https://www.kimi.ai/pt-br/resources/best-ai-3d-image-generators",
    "L09": "https://kling.ai/pt/explore/best_free_ai_3d_model_generator",
    "L10": "https://www.canva.com/pt_br/gerador-modelos-3d-ia/",
}

# Reels exigem login e os termos do Instagram proíbem coleta automática.
LINKS_MANUAIS = {
    "L01": "https://www.instagram.com/atsmatrix/reel/Dd8LNZYANbq/",
    "L02": "https://www.instagram.com/atsmatrix/reel/DeFwS5LA2fw/",
    "L03": "https://www.instagram.com/techwith.ram/reel/DeIyAuUJ_eb/",
}

PASTA_SAIDA = Path(__file__).parent / "saida"
ARQUIVO_SAIDA = PASTA_SAIDA / "coleta.json"
PAUSA_SEGUNDOS = 4
TEMPO_LIMITE_MS = 45_000
ESPERA_EXTRA_MS = 3_000
MAX_LINKS_UTEIS = 3
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
)

PADRAO_PRECO = re.compile(
    r"(US\$|R\$|\$|€)\s?\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?\s?(?:créditos|credits)", re.I
)
PADRAO_FORMATO = re.compile(r"\b(GLB|GLTF|OBJ|STL|FBX|USDZ|PLY|3MF)\b")
# Ordem de prioridade das páginas extras: preços, depois licença/termos, depois API.
PADROES_LINK_UTIL = [
    re.compile(r"pric|preco|/plans?\b|membership", re.I),
    re.compile(r"licen|terms|termos", re.I),
    re.compile(r"/api\b|/docs|developer|/dev/", re.I),
]
PADRAO_LINK_IGNORADO = re.compile(r"download|\.exe|privacy|privacidade|cookie", re.I)
PADRAO_ANTIBOT = re.compile(
    r"slide to (complete|verify)|access verification|captcha|verify you are human", re.I
)
