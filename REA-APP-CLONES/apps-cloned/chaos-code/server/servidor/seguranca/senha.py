"""Hash e conferência de senhas com scrypt.

Regras (ETAPA-007, SERVIDOR.9):

* ``hashlib.scrypt`` com sal aleatório (``secrets``) de 16 bytes e custo de memória de 32 MiB,
  que exige ``maxmem`` explícito (o limite padrão do OpenSSL é 32 MiB, justo abaixo do que o
  scrypt precisa com esses parâmetros).
* Formato autodescritivo ``scrypt$n$r$p$sal_b64$hash_b64``: guardar os parâmetros junto do hash
  permite aumentar o custo no futuro sem invalidar as senhas antigas.
* Conferência em tempo constante (``hmac.compare_digest``); hash mal formado devolve ``False``
  sem exceção, para quem chama tratar como "senha errada".
* Senha normalizada em NFKC antes do hash: o mesmo texto digitado de formas Unicode diferentes
  vira a mesma senha.

Usado pelo repositório de usuários (SERVIDOR.14), pelo cadastro (SERVIDOR.32) e pelo comando
``criar-admin`` (SERVIDOR.49). As constantes ficam aqui enquanto a SERVIDOR.10 mexe em
``constantes.py``; o líder pode movê-las depois.
"""

import base64
import binascii
import hashlib
import hmac
import secrets
import unicodedata

# Parâmetros do scrypt: N = 2^15, r = 8, p = 1 → 128·N·r = 32 MiB de memória por hash.
ALGORITMO_SENHA = "scrypt"
CUSTO_SCRYPT_N = 2**15
TAMANHO_BLOCO_SCRYPT_R = 8
PARALELISMO_SCRYPT_P = 1
BYTES_SAL_SENHA = 16
BYTES_HASH_SENHA = 64
BYTES_POR_UNIDADE_SCRYPT = 128
# Folga sobre o mínimo (128·N·r·p + 128·r·p): o OpenSSL recusa se o teto for justo.
MEMORIA_MAXIMA_SCRYPT = 64 * 1024 * 1024

# Limites aceitos ao conferir um hash guardado (evitam custo absurdo vindo de um hash adulterado).
CUSTO_SCRYPT_N_MAXIMO = 2**20
TAMANHO_BLOCO_SCRYPT_R_MAXIMO = 32
PARALELISMO_SCRYPT_P_MAXIMO = 16
BYTES_SAL_MINIMO = 16
BYTES_HASH_MINIMO = 32

TAMANHO_MAXIMO_SENHA_BYTES = 1024
SEPARADOR_HASH = "$"
QUANTIDADE_PARTES_HASH = 6
FORMA_NORMALIZACAO = "NFKC"
CODIFICACAO_SENHA = "utf-8"

MSG_SENHA_VAZIA = "A senha não pode ser vazia."
MSG_SENHA_LONGA = f"A senha passa do limite de {TAMANHO_MAXIMO_SENHA_BYTES} bytes."
MSG_SENHA_NAO_TEXTO = "A senha deve ser um texto."


def preparar_senha(senha: str) -> bytes:
    """Normaliza a senha (NFKC) e a converte em bytes UTF-8, conferindo vazio e tamanho.

    Args:
        senha: Senha digitada.

    Returns:
        Bytes da senha normalizada.

    Raises:
        ValueError: Se não for texto, estiver vazia ou passar do limite de bytes.
    """
    if not isinstance(senha, str):
        raise ValueError(MSG_SENHA_NAO_TEXTO)
    if not senha:
        raise ValueError(MSG_SENHA_VAZIA)

    bytes_senha = unicodedata.normalize(FORMA_NORMALIZACAO, senha).encode(CODIFICACAO_SENHA)
    if len(bytes_senha) > TAMANHO_MAXIMO_SENHA_BYTES:
        raise ValueError(MSG_SENHA_LONGA)
    return bytes_senha


def calcular_scrypt(bytes_senha: bytes, sal: bytes, parametros: tuple[int, int, int, int]) -> bytes:
    """Calcula o scrypt com teto de memória explícito.

    Args:
        bytes_senha: Senha já preparada.
        sal: Sal aleatório.
        parametros: ``(n, r, p, dklen)``.

    Returns:
        Hash derivado com ``dklen`` bytes.

    Raises:
        ValueError: Se o OpenSSL recusar os parâmetros.
    """
    custo, bloco, paralelismo, tamanho_hash = parametros
    return hashlib.scrypt(
        bytes_senha,
        salt=sal,
        n=custo,
        r=bloco,
        p=paralelismo,
        maxmem=MEMORIA_MAXIMA_SCRYPT,
        dklen=tamanho_hash,
    )


def codificar_base64(dados: bytes) -> str:
    """Codifica bytes em base64 padrão (o alfabeto não tem ``$``).

    Args:
        dados: Bytes a codificar.

    Returns:
        Texto em base64.
    """
    return base64.b64encode(dados).decode("ascii")


def gerar_hash_senha(senha: str) -> str:
    """Gera o hash da senha para guardar no banco (coluna ``usuarios.hash_senha``).

    Args:
        senha: Senha digitada.

    Returns:
        Texto ``scrypt$n$r$p$sal_b64$hash_b64``.

    Raises:
        ValueError: Se a senha for vazia, longa demais ou não for texto.
    """
    bytes_senha = preparar_senha(senha)
    sal = secrets.token_bytes(BYTES_SAL_SENHA)
    parametros = (CUSTO_SCRYPT_N, TAMANHO_BLOCO_SCRYPT_R, PARALELISMO_SCRYPT_P, BYTES_HASH_SENHA)
    hash_senha = calcular_scrypt(bytes_senha, sal, parametros)
    partes = (
        ALGORITMO_SENHA,
        str(CUSTO_SCRYPT_N),
        str(TAMANHO_BLOCO_SCRYPT_R),
        str(PARALELISMO_SCRYPT_P),
        codificar_base64(sal),
        codificar_base64(hash_senha),
    )
    return SEPARADOR_HASH.join(partes)


def parametros_aceitaveis(custo: int, bloco: int, paralelismo: int) -> bool:
    """Diz se os parâmetros lidos de um hash estão nos limites aceitos e cabem na memória.

    Args:
        custo: N (potência de 2).
        bloco: r.
        paralelismo: p.

    Returns:
        True se puderem ser usados para conferir.
    """
    custo_valido = 1 < custo <= CUSTO_SCRYPT_N_MAXIMO and custo & (custo - 1) == 0
    bloco_valido = 0 < bloco <= TAMANHO_BLOCO_SCRYPT_R_MAXIMO
    paralelismo_valido = 0 < paralelismo <= PARALELISMO_SCRYPT_P_MAXIMO
    # Mesma conta do OpenSSL: B = 128·r·p e V = 128·r·(N + 2).
    memoria = BYTES_POR_UNIDADE_SCRYPT * bloco * (custo + 2 + paralelismo)
    return custo_valido and bloco_valido and paralelismo_valido and memoria < MEMORIA_MAXIMA_SCRYPT


def ler_hash_guardado(hash_guardado: str) -> tuple[tuple[int, int, int, int], bytes, bytes] | None:
    """Separa e confere as partes do hash guardado.

    Args:
        hash_guardado: Texto ``scrypt$n$r$p$sal_b64$hash_b64``.

    Returns:
        ``((n, r, p, dklen), sal, hash)``, ou None se o texto estiver mal formado.
    """
    partes = hash_guardado.split(SEPARADOR_HASH) if isinstance(hash_guardado, str) else []
    if len(partes) != QUANTIDADE_PARTES_HASH or partes[0] != ALGORITMO_SENHA:
        return None

    try:
        custo, bloco, paralelismo = (int(parte) for parte in partes[1:4])
        sal = base64.b64decode(partes[4], validate=True)
        hash_senha = base64.b64decode(partes[5], validate=True)
    except (ValueError, binascii.Error):
        return None

    tamanhos_validos = len(sal) >= BYTES_SAL_MINIMO and len(hash_senha) >= BYTES_HASH_MINIMO
    if not tamanhos_validos or not parametros_aceitaveis(custo, bloco, paralelismo):
        return None
    return (custo, bloco, paralelismo, len(hash_senha)), sal, hash_senha


def conferir_senha(senha: str, hash_guardado: str) -> bool:
    """Confere a senha digitada contra o hash guardado, em tempo constante.

    Args:
        senha: Senha digitada.
        hash_guardado: Valor da coluna ``usuarios.hash_senha``.

    Returns:
        True só se a senha bater; False para senha errada, vazia ou longa demais e para hash mal
        formado (nunca levanta exceção por isso).
    """
    lido = ler_hash_guardado(hash_guardado)
    if lido is None:
        return False

    try:
        bytes_senha = preparar_senha(senha)
    except ValueError:
        return False

    parametros, sal, hash_esperado = lido
    try:
        hash_calculado = calcular_scrypt(bytes_senha, sal, parametros)
    except ValueError:
        return False
    return hmac.compare_digest(hash_calculado, hash_esperado)


def precisa_refazer_hash(hash_guardado: str) -> bool:
    """Diz se o hash foi feito com parâmetros diferentes dos atuais (refazer no próximo login).

    Args:
        hash_guardado: Valor da coluna ``usuarios.hash_senha``.

    Returns:
        True se o hash estiver mal formado ou com parâmetros antigos.
    """
    lido = ler_hash_guardado(hash_guardado)
    if lido is None:
        return True

    atuais = (CUSTO_SCRYPT_N, TAMANHO_BLOCO_SCRYPT_R, PARALELISMO_SCRYPT_P, BYTES_HASH_SENHA)
    return lido[0] != atuais
