# Web scraping dos links do `CLAUDE.md`

Como coletar, de forma automática, os dados das páginas L01 a L10 listadas em
`dashboard/CLAUDE.md`. O resultado serve de matéria-prima para o JSON pedido lá (visão geral,
preços, planos, API, licença comercial etc.).

## 1. Antes de começar

- **Termos de uso e `robots.txt`:** abra `https://<site>/robots.txt` e os termos de cada site.
  Se o site proibir coleta automática, copie os dados à mão.
- **Ritmo:** no máximo 1 requisição a cada 3 a 5 segundos por site. Sem paralelismo agressivo.
- **Identificação:** use um `User-Agent` de navegador comum. Não tente burlar captcha, login ou
  bloqueio anti-bot.
- **Só dados públicos:** nada de dados pessoais de terceiros.
- **Registre a data da coleta:** preços mudam, e o `CLAUDE.md` exige `data_consulta`.

## 2. Tipo de cada link e a técnica indicada

| Link | Site | Tipo provável | Técnica |
|---|---|---|---|
| L01–L03 | Instagram (reels) | `reel` | Coleta manual (ver seção 5) |
| L04 | hyper3d.ai | `gerador_modelo_3d` | Playwright (site em JavaScript) |
| L06 | hi3d.ai | `gerador_modelo_3d` | Playwright |
| L07 | v2fun.ai | `gerador_modelo_3d` | Playwright |
| L08 | kimi.ai (artigo) | `artigo_comparativo` | `requests` + BeautifulSoup |
| L09 | kling.ai (artigo) | `artigo_comparativo` | Playwright |
| L10 | canva.com | `gerador_modelo_3d` ou `gerador_imagem_estilo_3d` | Playwright |

A coluna "tipo provável" é só um palpite e precisa ser confirmada com o conteúdo coletado.

Regra prática: rode primeiro `requests`. Se o HTML voltar quase vazio (só `<div id="root">`),
a página é montada por JavaScript, e aí é preciso usar o Playwright.

Além da página do link, colete também as páginas de **preços** (`/pricing`, `/precos`,
`/plans`), de **API** (`/api`, `/docs`) e de **termos/licença** (`/terms`, `/license`) de cada
ferramenta. É nelas que estão os campos `precos` e `encaixe_criar_produtos_de_ia`.

## 3. Preparar o ambiente

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows (em Linux/macOS: source .venv/bin/activate)
pip install requests beautifulsoup4 playwright
playwright install chromium
```

## 4. Script de coleta (L04 a L10)

> **Pronto em `dashboard/scripts/`:** o app já está implementado e dividido em
> `config_coleta.py` (links e padrões), `extrator_pagina.py` (Playwright), `cotacao.py`
> (AwesomeAPI) e `coletar.py` (ponto de entrada). Ele também coleta até 3 páginas de preço,
> licença ou API achadas em cada site e marca páginas de verificação anti-bot como
> `nao_verificado`. Instale com `pip install -r dashboard/scripts/requirements.txt` e
> `python -m playwright install chromium`. O código abaixo é o modelo original.

Salve como `dashboard/scripts/coletar.py`. Ele abre cada página, espera o JavaScript carregar,
extrai o título, a descrição, os textos visíveis e os trechos com preço, e grava tudo em
`dashboard/scripts/saida/coleta.json`.

```python
"""Coleta o texto público das páginas L04 a L10 do dashboard/CLAUDE.md."""
import json
import re
import time
from datetime import datetime
from pathlib import Path

from playwright.sync_api import sync_playwright

LINKS = {
    "L04": "https://hyper3d.ai/pt",
    "L06": "https://www.hi3d.ai/pt",
    "L07": "https://v2fun.ai/pt-BR/features/ai-3d-model-generator",
    "L08": "https://www.kimi.ai/pt-br/resources/best-ai-3d-image-generators",
    "L09": "https://kling.ai/pt/explore/best_free_ai_3d_model_generator",
    "L10": "https://www.canva.com/pt_br/gerador-modelos-3d-ia/",
}
PASTA_SAIDA = Path(__file__).parent / "saida"
PAUSA_SEGUNDOS = 4
TEMPO_LIMITE_MS = 45_000
PADRAO_PRECO = re.compile(r"(US\$|R\$|\$|€)\s?\d+[.,]?\d*|\d+[.,]?\d*\s?(créditos|credits)", re.I)
PADRAO_FORMATO = re.compile(r"\b(GLB|GLTF|OBJ|STL|FBX|USDZ|PLY|3MF)\b")


def extrair(pagina, id_link, url):
    """Abre a URL e devolve os dados públicos da página."""
    pagina.goto(url, wait_until="networkidle", timeout=TEMPO_LIMITE_MS)
    texto = pagina.inner_text("body")
    descricao = pagina.locator("meta[name='description']").get_attribute("content") or ""
    links_uteis = [
        a for a in pagina.eval_on_selector_all("a[href]", "els => els.map(e => e.href)")
        if re.search(r"pric|preco|plan|api|docs|terms|termos|licen", a, re.I)
    ]
    return {
        "id": id_link,
        "url": url,
        "acessou": True,
        "titulo": pagina.title(),
        "descricao": descricao,
        "trechos_preco": sorted({m.group(0) for m in PADRAO_PRECO.finditer(texto)}),
        "formatos_exportacao": sorted(set(PADRAO_FORMATO.findall(texto))),
        "links_uteis": sorted(set(links_uteis)),
        "texto": texto,
    }


def main():
    PASTA_SAIDA.mkdir(parents=True, exist_ok=True)
    resultados = []
    with sync_playwright() as p:
        navegador = p.chromium.launch()
        pagina = navegador.new_page(locale="pt-BR")
        for id_link, url in LINKS.items():
            try:
                resultados.append(extrair(pagina, id_link, url))
            except Exception as erro:  # registra a falha e segue para o próximo link
                resultados.append({"id": id_link, "url": url, "acessou": False, "erro": str(erro)})
            time.sleep(PAUSA_SEGUNDOS)
        navegador.close()

    saida = {"data_consulta": datetime.now().isoformat(timespec="minutes"), "links": resultados}
    arquivo = PASTA_SAIDA / "coleta.json"
    arquivo.write_text(json.dumps(saida, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Gravado em {arquivo}")


if __name__ == "__main__":
    main()
```

Rodar:

```bash
python dashboard/scripts/coletar.py
```

Depois, rode o script de novo com as URLs de `links_uteis` (preços, API, termos) no dicionário
`LINKS` para coletar também essas páginas.

### Página estática (alternativa leve, ex.: L08)

```python
import requests
from bs4 import BeautifulSoup

resposta = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=30)
resposta.raise_for_status()
sopa = BeautifulSoup(resposta.text, "html.parser")
titulos = [h.get_text(strip=True) for h in sopa.select("h2, h3")]  # ferramentas citadas no artigo
texto = sopa.get_text(" ", strip=True)
```

Nos artigos comparativos (L08 e L09), os `h2`/`h3` costumam ser os nomes das ferramentas
recomendadas. Anote também se quem publica (Kimi, Kling) aparece no próprio ranking: é o
"interesse comercial" que o `CLAUDE.md` pede para avaliar.

## 5. Reels do Instagram (L01 a L03)

O Instagram exige login e proíbe coleta automática nos termos de uso. Não use scraper com sua
conta, porque ela pode ser bloqueada. Faça assim:

1. Abra o reel no celular ou no navegador, já logado.
2. Copie a legenda (e, se quiser, ative as legendas automáticas do vídeo e transcreva).
3. Cole no `CLAUDE.md`, nos campos `L01: [cole aqui]` etc.

Com a legenda em mãos, identifique a ferramenta apresentada e colete o site dela pelo script
da seção 4.

## 6. Cotação do dólar (PASSO 4 do `CLAUDE.md`)

A AwesomeAPI é gratuita e não pede chave:

```python
import requests

dados = requests.get("https://economia.awesomeapi.com.br/json/last/USD-BRL", timeout=30).json()
cotacao = float(dados["USDBRL"]["bid"])
data = dados["USDBRL"]["create_date"]
valor_brl = round(valor_usd * cotacao, 2)
```

Guarde a cotação e a data no JSON final (`cotacao_usd_brl`, `data_consulta`) e mantenha
o valor original em dólar ao lado do valor em reais.

## 7. Do texto coletado ao JSON final

> **No dashboard:** `python dashboard/scripts/gerar_dados_painel.py` transforma o `coleta.json`
> e as páginas de reels salvas em `dashboard/MODELOS-DE-IA/` (Salvar como… no navegador) em
> `assets/js/dados/ferramentas.js`, exibido na aba "Ferramentas de IA 3D" do `index.html`.

O scraping traz **fatos** (texto da página). A análise (notas de 1 a 5, ranking,
recomendação) é **opinião** e vem depois:

1. Rode a coleta (seções 4 a 6).
2. Entregue `coleta.json` à IA junto com o prompt do `CLAUDE.md`, pedindo para usar só esse
   material como fonte.
3. Cada dado tirado do `coleta.json` vira `"natureza": "fato"`, com a URL em `fonte`.
   O que não aparecer no material fica como `"nao_verificado"`.

## 8. Problemas comuns

| Sintoma | Causa | O que fazer |
|---|---|---|
| HTML vazio no `requests` | Página montada por JavaScript | Usar o Playwright |
| `TimeoutError` | Site lento ou `networkidle` nunca chega | Trocar para `wait_until="load"` e esperar um seletor |
| Erro 403 ou captcha | Proteção anti-bot | Parar e copiar os dados à mão; não tentar burlar |
| Preços não aparecem | Ficam em outra página ou só depois do login | Coletar `/pricing`; se exigir login, marcar `nao_verificado` |
| Página em inglês | O site ignora o `/pt` | Coletar assim mesmo e traduzir na análise |

Não versione `dashboard/scripts/saida/` se ela tiver muito texto de terceiros: adicione ao
`.gitignore` (já feito: `dashboard/scripts/saida/`).
