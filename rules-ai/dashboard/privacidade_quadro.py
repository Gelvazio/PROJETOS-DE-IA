"""Guardrail de privacidade do publicador do quadro (AGENTES-REALTIME.8).

Antes de qualquer envio ao Broadcast:
- só passam os campos permitidos (R2.1, INV-1); campo fora da lista é descartado;
- projeto de pasta ignorada (C20/C23) ou oculta gera ValueError (R2.2, INV-2);
- `titulo` e `agente` passam pela redação de segredo/PII, porta em Python de
  `scripts/jev/guardrails/redigir.mjs` (chaves, JWT, CPF, RG, telefone, e-mail pessoal).
O valor achado nunca é impresso nem guardado: os achados levam só o tipo.
Contrato: ETAPA-031 (seção da .1) e ETAPA-040 (seção da AGENTES-REALTIME.4).
"""
import re

PREFIXOS_PROIBIDOS = ("DEMAIS-PROJETOS-", ".")
CAMPOS_ESTADO = ("versao", "projeto", "atualizado_em", "atraso_padrao", "intervalo", "commit",
                 "publicado_em", "sequencia", "tarefas")
CAMPOS_TAREFA = ("tarefa", "titulo", "pai", "mae", "nivel", "status", "agente", "desde",
                 "progresso", "global", "indice")
CAMPOS_INDICE = ("versao", "padrao", "publicado_em", "sequencia", "projetos")
CAMPOS_PROJETO = ("id", "nome")
CAMPOS_REDIGIDOS = ("titulo", "agente")

MARCAS = {"chave": "[CHAVE]", "cpf": "[CPF]", "rg": "[RG]", "telefone": "[TELEFONE]",
          "email": "[EMAIL]"}
EMAIL_PERMITIDO = re.compile(
    r"^(?:no-?reply|nao-responda)@"
    r"|@(?:users\.noreply\.github\.com|example\.(?:com|org|net)|exemplo\.com(?:\.br)?)$", re.I)
ATRIBUICAO = re.compile(
    r"\b([A-Za-z0-9_-]*(?:api[_-]?key|secret|senha|password|passwd|token)[A-Za-z0-9_-]*)"
    r"(\s*[:=]\s*)(['\"]?)(?!\[)(?![0-9.]+\b)(?=[^\s'\"]*[0-9_!@#$%^&*-])[^\s'\"]{6,}\3",
    re.I | re.A)


def cpf_valido(trecho):
    """True se os dois dígitos verificadores do CPF (11 dígitos) conferem."""
    digitos = re.sub(r"\D", "", trecho)
    if len(digitos) != 11 or len(set(digitos)) == 1:
        return False
    for peso_inicial in (10, 11):
        quantidade = peso_inicial - 1
        soma = sum(int(digitos[i]) * (peso_inicial - i) for i in range(quantidade))
        resto = soma * 10 % 11
        if (0 if resto == 10 else resto) != int(digitos[quantidade]):
            return False
    return True


def _marca(tipo):
    return lambda _achado: MARCAS[tipo]


# (tipo, padrão, substituição do achado, filtro que diz se o achado conta)
REGRAS = (
    ("chave", re.compile(r"\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}"),
     _marca("chave"), None),
    ("chave", re.compile(r"\b(Bearer)\s+(?!\[)[A-Za-z0-9._~+/=-]{8,}", re.I),
     lambda achado: f"{achado.group(1)} {MARCAS['chave']}", None),
    ("chave", re.compile(r"\b(?:sk-[A-Za-z0-9_-]{16,}|tsk_[A-Za-z0-9_-]{8,}"
                         r"|sb_secret_[A-Za-z0-9_-]{8,}|sb_publishable_[A-Za-z0-9_-]{8,}"
                         r"|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}"
                         r"|AKIA[0-9A-Z]{16}\b)"), _marca("chave"), None),
    ("chave", ATRIBUICAO,
     lambda a: f"{a.group(1)}{a.group(2)}{a.group(3)}{MARCAS['chave']}{a.group(3)}", None),
    ("cpf", re.compile(r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b", re.A), _marca("cpf"), None),
    ("cpf", re.compile(r"\b\d{11}\b", re.A), _marca("cpf"), cpf_valido),
    ("rg", re.compile(r"\b\d{1,2}\.\d{3}\.\d{3}-?[\dXx]\b", re.A), _marca("rg"), None),
    ("rg", re.compile(r"\b(RG)(\s*(?:n[º°o.]*)?\s*[:-]?\s*)(?!\[)([\dXx][\dXx.-]{4,}[\dXx])"),
     lambda a: f"{a.group(1)}{a.group(2)}{MARCAS['rg']}", None),
    ("telefone", re.compile(r"(?:\+55\s?)?(?:\(\d{2}\)|\b\d{2})[\s-]?9?\d{4}[-\s]\d{4}\b", re.A),
     _marca("telefone"), None),
    ("email", re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", re.A),
     _marca("email"), lambda trecho: not EMAIL_PERMITIDO.search(trecho)),
)


def redigir_texto(texto):
    """(texto mascarado, lista de tipos achados). Idempotente; o valor original não sai daqui."""
    achados = []

    def aplicar(regra, atual):
        tipo, padrao, substituir, conta = regra

        def trocar(achado):
            if conta and not conta(achado.group(0)):
                return achado.group(0)
            achados.append(tipo)
            return substituir(achado)
        return padrao.sub(trocar, atual)

    resultado = "" if texto is None else str(texto)
    for regra in REGRAS:
        resultado = aplicar(regra, resultado)
    return resultado, achados


def validar_id_projeto(projeto):
    """ValueError se o id for vazio, oculto ou de pasta ignorada (C20/C23, INV-2)."""
    if not isinstance(projeto, str) or not projeto or projeto.startswith(PREFIXOS_PROIBIDOS):
        raise ValueError("Projeto proibido no payload (C20/C23).")
    return projeto


def so_campos(dados, permitidos):
    """Cópia só com as chaves permitidas, na ordem da lista (INV-1)."""
    return {campo: dados[campo] for campo in permitidos if campo in dados}


def limpar_tarefa(tarefa, achados):
    """Tarefa com os 11 campos permitidos e `titulo`/`agente` redigidos."""
    limpa = so_campos(tarefa, CAMPOS_TAREFA)
    for campo in CAMPOS_REDIGIDOS:
        if isinstance(limpa.get(campo), str):
            limpa[campo], tipos = redigir_texto(limpa[campo])
            achados.extend(tipos)
    return limpa


def proteger_estado(payload):
    """(payload do evento `estado` filtrado e redigido, contagem de achados por tipo)."""
    validar_id_projeto(payload.get("projeto"))
    achados = []
    limpo = so_campos(payload, CAMPOS_ESTADO)
    limpo["tarefas"] = [limpar_tarefa(t, achados) for t in payload.get("tarefas", [])]
    return limpo, resumir(achados)


def proteger_indice(payload):
    """(payload do evento `projetos` só com id/nome e sem projeto proibido, achados)."""
    achados = []
    projetos = []
    for item in payload.get("projetos", []):
        projeto = so_campos(item, CAMPOS_PROJETO)
        validar_id_projeto(projeto.get("id"))
        projeto["nome"], tipos = redigir_texto(projeto.get("nome", ""))
        achados.extend(tipos)
        projetos.append(projeto)
    limpo = so_campos(payload, CAMPOS_INDICE)
    limpo["projetos"] = projetos
    if limpo.get("padrao") not in {p["id"] for p in projetos}:
        raise ValueError("`padrao` precisa existir em projetos[].id.")
    return limpo, resumir(achados)


def resumir(achados):
    """Contagem por tipo, sem valores (para o log do publicador)."""
    resumo = {}
    for tipo in achados:
        resumo[tipo] = resumo.get(tipo, 0) + 1
    return resumo
