"""Repositório de tokens: criar o par acesso/renovação, buscar pelo hash, girar e revogar.

Regras (ETAPA-007, SERVIDOR.17; usadas pela autenticação Bearer, SERVIDOR.25, pela troca e
renovação do token, SERVIDOR.36 e 37, e pela revogação, SERVIDOR.38):

* No banco vai só o **hash** SHA-256 de cada token (``servidor.seguranca.tokens``); o texto sai
  uma vez, na resposta do ``/api/oauth/token``.
* **Família:** tudo que nasce do mesmo código de autorização. Ela é derivada do próprio
  código (``familia_do_codigo``), então a SERVIDOR.36, ao receber um código **reutilizado**,
  recalcula a família e chama ``revogar_familia`` (RFC 6749, seção 4.1.2), sem coluna nova
  no esquema.
* **Giro da renovação** (OAuth 2.1 / RFC 9700, seção 4.14): a renovação usada é marcada como
  substituída num único ``UPDATE ... RETURNING`` (dois pedidos ao mesmo tempo não giram a mesma
  renovação), os acessos antigos da família são revogados e nasce um par novo na mesma família.
  Renovação já girada que volta a aparecer = possível roubo: a família inteira é revogada.
* **Revogação** (RFC 7009): só o cliente dono do token revoga; revogar a renovação derruba a
  família toda (seção 2.1).
* Conexão por parâmetro, SQL parametrizado e sem ``commit``: quem confirma é a dependência do
  pedido (``servidor.banco.conexao``), que **desfaz tudo se a rota levantar exceção**. Por isso
  as rotas devem *devolver* a resposta de erro (não levantar) quando quiserem manter uma
  revogação feita aqui.
"""

import sqlite3
import time
from collections.abc import Sequence
from dataclasses import dataclass
from enum import Enum

from servidor.constantes import (
    TABELA_TOKENS,
    VALIDADE_TOKEN_ACESSO_SEGUNDOS,
    VALIDADE_TOKEN_RENOVACAO_SEGUNDOS,
)
from servidor.seguranca.tokens import (
    Relogio,
    agora_unix,
    calcular_expiracao,
    calcular_hash_token,
    gerar_token_acesso,
    gerar_token_renovacao,
    tem_formato_de_token,
)

# Valores da coluna "tipo" (CHECK do esquema.sql).
TIPO_ACESSO = "acesso"
TIPO_RENOVACAO = "renovacao"
TAMANHO_MAXIMO_ID = 200
TAMANHO_MAXIMO_FAMILIA = 128
TAMANHO_MAXIMO_ESCOPO = 500

MSG_ID_CLIENTE_INVALIDO = "id do cliente inválido para o token."
MSG_ID_USUARIO_INVALIDO = "id do usuário inválido para o token."
MSG_FAMILIA_INVALIDA = "família de tokens inválida."
MSG_ESCOPO_INVALIDO = f"scope deve ter no máximo {TAMANHO_MAXIMO_ESCOPO} caracteres."

COLUNAS_TOKEN = (
    "id",
    "tipo",
    "familia",
    "id_cliente",
    "id_usuario",
    "escopo",
    "criado_em",
    "expira_em",
    "revogado_em",
    "substituido_em",
)
LISTA_COLUNAS = ", ".join(COLUNAS_TOKEN)
SQL_INSERIR = (
    f"INSERT INTO {TABELA_TOKENS} (hash_token, tipo, familia, id_cliente, id_usuario, escopo, "
    "criado_em, expira_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
)
SQL_POR_HASH = f"SELECT {LISTA_COLUNAS} FROM {TABELA_TOKENS} WHERE hash_token = ?"
SQL_ACESSO_VALIDO = (
    f"SELECT {LISTA_COLUNAS} FROM {TABELA_TOKENS} WHERE hash_token = ? AND tipo = ? "
    "AND revogado_em IS NULL AND expira_em > ?"
)
# Marcar e devolver no mesmo comando: é o que garante que a renovação gira uma vez só.
SQL_GIRAR = (
    f"UPDATE {TABELA_TOKENS} SET substituido_em = ? "
    "WHERE hash_token = ? AND tipo = ? AND id_cliente = ? "
    "AND revogado_em IS NULL AND substituido_em IS NULL AND expira_em > ? "
    f"RETURNING {LISTA_COLUNAS}"
)
SQL_REVOGAR_ACESSOS_DA_FAMILIA = (
    f"UPDATE {TABELA_TOKENS} SET revogado_em = ? "
    "WHERE familia = ? AND tipo = ? AND revogado_em IS NULL"
)
SQL_REVOGAR_FAMILIA = (
    f"UPDATE {TABELA_TOKENS} SET revogado_em = ? WHERE familia = ? AND revogado_em IS NULL"
)
SQL_REVOGAR_POR_ID = (
    f"UPDATE {TABELA_TOKENS} SET revogado_em = ? WHERE id = ? AND revogado_em IS NULL"
)
SQL_APAGAR_VENCIDOS = f"DELETE FROM {TABELA_TOKENS} WHERE expira_em <= ?"


class ErroTokenInvalido(ValueError):
    """Dados recusados ao criar o par de tokens (erro de programação da rota)."""


class SituacaoGiro(Enum):
    """Resultado do giro da renovação (a rota responde ``invalid_grant`` se não for GIRADO)."""

    GIRADO = "girado"
    INEXISTENTE = "inexistente"
    CLIENTE_DIFERENTE = "cliente_diferente"
    EXPIRADO = "expirado"
    REVOGADO = "revogado"
    REUTILIZADO = "reutilizado"


@dataclass(frozen=True)
class NovoPar:
    """Dono e escopo do par de tokens a emitir."""

    id_cliente: str
    id_usuario: str
    familia: str
    escopo: str | None = None


@dataclass(frozen=True)
class ParDeTokens:
    """Par emitido, com os textos que vão na resposta (não ficam guardados)."""

    token_acesso: str
    token_renovacao: str
    familia: str
    escopo: str | None
    criado_em: int
    acesso_expira_em: int
    renovacao_expira_em: int

    @property
    def validade_acesso_segundos(self) -> int:
        """Validade do token de acesso, para o ``expires_in`` da resposta.

        Returns:
            Segundos entre a emissão e o vencimento do acesso.
        """
        return self.acesso_expira_em - self.criado_em


@dataclass(frozen=True)
class TokenGuardado:
    """Token como sai do banco, sem o hash."""

    id: int
    tipo: str
    familia: str
    id_cliente: str
    id_usuario: str
    escopo: str | None
    criado_em: int
    expira_em: int
    revogado_em: int | None
    substituido_em: int | None


@dataclass(frozen=True)
class PedidoComCliente:
    """Token recebido e o ``client_id`` de quem o apresentou (giro e revogação)."""

    token: str | None
    id_cliente: str | None


@dataclass(frozen=True)
class ResultadoGiro:
    """Situação do giro, o token apresentado (se existir) e o par novo (se GIRADO)."""

    situacao: SituacaoGiro
    antigo: TokenGuardado | None = None
    par: ParDeTokens | None = None

    @property
    def foi_girado(self) -> bool:
        """Diz se a renovação foi aceita e um par novo foi emitido.

        Returns:
            True só na situação ``GIRADO``.
        """
        return self.situacao is SituacaoGiro.GIRADO


def familia_do_codigo(codigo: str) -> str:
    """Deriva a família de tokens do código de autorização que a originou.

    É o SHA-256 do hash do código: diferente do ``hash_codigo`` guardado, mas recalculável pela
    SERVIDOR.36 a partir do ``code`` recebido, inclusive quando ele é reapresentado.

    Args:
        codigo: Código de autorização em texto.

    Returns:
        Identificador da família (64 caracteres hexadecimais).

    Raises:
        ValueError: Se o código for vazio.
    """
    return calcular_hash_token(calcular_hash_token(codigo))


def texto_valido(valor: object, tamanho_maximo: int) -> bool:
    """Diz se o valor é texto não vazio (sem contar espaços) e cabe no tamanho máximo.

    Args:
        valor: Valor recebido.
        tamanho_maximo: Quantidade máxima de caracteres.

    Returns:
        True se for ``str`` com conteúdo e até ``tamanho_maximo`` caracteres.
    """
    return isinstance(valor, str) and bool(valor.strip()) and len(valor) <= tamanho_maximo


def validar_novo_par(dados: NovoPar) -> None:
    """Confere os dados do par antes de gravar.

    Args:
        dados: Dono, família e escopo.

    Raises:
        ErroTokenInvalido: Algum campo vazio, longo demais ou de tipo errado.
    """
    if not texto_valido(dados.id_cliente, TAMANHO_MAXIMO_ID):
        raise ErroTokenInvalido(MSG_ID_CLIENTE_INVALIDO)
    if not texto_valido(dados.id_usuario, TAMANHO_MAXIMO_ID):
        raise ErroTokenInvalido(MSG_ID_USUARIO_INVALIDO)
    if not texto_valido(dados.familia, TAMANHO_MAXIMO_FAMILIA):
        raise ErroTokenInvalido(MSG_FAMILIA_INVALIDA)
    escopo_ok = dados.escopo is None or (
        isinstance(dados.escopo, str) and len(dados.escopo) <= TAMANHO_MAXIMO_ESCOPO
    )
    if not escopo_ok:
        raise ErroTokenInvalido(MSG_ESCOPO_INVALIDO)


def montar_token(linha: Sequence) -> TokenGuardado:
    """Converte uma linha com ``COLUNAS_TOKEN`` em ``TokenGuardado`` (tupla ou ``Row``).

    Args:
        linha: Linha com as colunas de ``COLUNAS_TOKEN``, nessa ordem.

    Returns:
        Token sem o hash.
    """
    return TokenGuardado(**dict(zip(COLUNAS_TOKEN, tuple(linha))))


def criar_par(
    conexao: sqlite3.Connection, dados: NovoPar, relogio: Relogio = time.time
) -> ParDeTokens:
    """Emite um par acesso/renovação e grava só os hashes.

    Args:
        conexao: Conexão aberta (a transação é confirmada por quem a entregou).
        dados: Cliente, usuário, família e escopo.
        relogio: Fonte do instante atual (padrão: ``time.time``).

    Returns:
        Par com os textos dos tokens e os vencimentos.

    Raises:
        ErroTokenInvalido: Dados recusados.
        sqlite3.IntegrityError: Cliente ou usuário inexistente (chave estrangeira).
    """
    validar_novo_par(dados)
    criado_em = agora_unix(relogio)
    par = ParDeTokens(
        token_acesso=gerar_token_acesso(),
        token_renovacao=gerar_token_renovacao(),
        familia=dados.familia,
        escopo=dados.escopo,
        criado_em=criado_em,
        acesso_expira_em=calcular_expiracao(VALIDADE_TOKEN_ACESSO_SEGUNDOS, lambda: criado_em),
        renovacao_expira_em=calcular_expiracao(
            VALIDADE_TOKEN_RENOVACAO_SEGUNDOS, lambda: criado_em
        ),
    )
    emissoes = (
        (TIPO_ACESSO, par.token_acesso, par.acesso_expira_em),
        (TIPO_RENOVACAO, par.token_renovacao, par.renovacao_expira_em),
    )
    conexao.executemany(
        SQL_INSERIR,
        [
            (calcular_hash_token(token), tipo, dados.familia, dados.id_cliente,
             dados.id_usuario, dados.escopo, criado_em, expira_em)
            for tipo, token, expira_em in emissoes
        ],
    )
    return par


def buscar_token(conexao: sqlite3.Connection, token: str | None) -> TokenGuardado | None:
    """Busca um token pelo hash, válido ou não (revogação e diagnóstico).

    Args:
        conexao: Conexão aberta.
        token: Token recebido (pode faltar).

    Returns:
        Token guardado, ou None se não existir ou o texto não tiver formato de token.
    """
    if not tem_formato_de_token(token):
        return None

    linha = conexao.execute(SQL_POR_HASH, (calcular_hash_token(token),)).fetchone()
    return montar_token(linha) if linha is not None else None


def buscar_token_acesso_valido(
    conexao: sqlite3.Connection, token: str | None, relogio: Relogio = time.time
) -> TokenGuardado | None:
    """Busca um token de **acesso** em vigor (autenticação Bearer, SERVIDOR.25).

    Args:
        conexao: Conexão aberta.
        token: Valor do ``Authorization: Bearer`` (pode faltar).
        relogio: Fonte do instante atual (padrão: ``time.time``).

    Returns:
        Token de acesso não revogado e não vencido, ou None (a rota responde 401).
    """
    if not tem_formato_de_token(token):
        return None

    parametros = (calcular_hash_token(token), TIPO_ACESSO, agora_unix(relogio))
    linha = conexao.execute(SQL_ACESSO_VALIDO, parametros).fetchone()
    return montar_token(linha) if linha is not None else None


def revogar_familia(
    conexao: sqlite3.Connection, familia: str, relogio: Relogio = time.time
) -> int:
    """Revoga todos os tokens ainda ativos de uma família.

    Args:
        conexao: Conexão aberta (a transação é confirmada por quem a entregou).
        familia: Família (ex.: ``familia_do_codigo(code)`` no código reutilizado).
        relogio: Fonte do instante atual (padrão: ``time.time``).

    Returns:
        Quantidade de tokens revogados agora.
    """
    parametros = (agora_unix(relogio), familia)
    return conexao.execute(SQL_REVOGAR_FAMILIA, parametros).rowcount


def classificar_recusa_giro(token: TokenGuardado | None, id_cliente: str | None) -> SituacaoGiro:
    """Diz por que uma renovação não girou.

    Args:
        token: Token encontrado pelo hash (None se não existir).
        id_cliente: ``client_id`` de quem apresentou a renovação.

    Returns:
        ``INEXISTENTE`` (também se for token de acesso), ``CLIENTE_DIFERENTE``, ``REVOGADO``,
        ``REUTILIZADO`` (já girada) ou ``EXPIRADO``.
    """
    if token is None or token.tipo != TIPO_RENOVACAO:
        return SituacaoGiro.INEXISTENTE
    if token.id_cliente != id_cliente:
        return SituacaoGiro.CLIENTE_DIFERENTE
    if token.revogado_em is not None:
        return SituacaoGiro.REVOGADO
    if token.substituido_em is not None:
        return SituacaoGiro.REUTILIZADO
    return SituacaoGiro.EXPIRADO


def recusar_giro(
    conexao: sqlite3.Connection, pedido: PedidoComCliente, agora: int
) -> ResultadoGiro:
    """Monta a recusa do giro; renovação reutilizada revoga a família inteira.

    Args:
        conexao: Conexão aberta.
        pedido: Renovação e ``client_id`` recebidos.
        agora: Instante do pedido, em segundos Unix.

    Returns:
        Resultado com a situação da recusa e o token apresentado (se existir).
    """
    token = buscar_token(conexao, pedido.token)
    situacao = classificar_recusa_giro(token, pedido.id_cliente)
    if situacao is SituacaoGiro.REUTILIZADO:
        revogar_familia(conexao, token.familia, lambda: agora)
    if situacao in (SituacaoGiro.INEXISTENTE, SituacaoGiro.CLIENTE_DIFERENTE):
        return ResultadoGiro(situacao)
    return ResultadoGiro(situacao, token)


def girar_renovacao(
    conexao: sqlite3.Connection, pedido: PedidoComCliente, relogio: Relogio = time.time
) -> ResultadoGiro:
    """Gira a renovação (``grant_type=refresh_token``): invalida a antiga e emite um par novo.

    Args:
        conexao: Conexão aberta (a transação é confirmada por quem a entregou).
        pedido: ``refresh_token`` e ``client_id`` recebidos.
        relogio: Fonte do instante atual (padrão: ``time.time``).

    Returns:
        ``GIRADO`` com o par novo (mesma família, escopo e dono); senão a situação da recusa.
        Em ``REUTILIZADO`` a família já foi revogada (a rota deve devolver o erro, não levantar).
    """
    if not tem_formato_de_token(pedido.token):
        return ResultadoGiro(SituacaoGiro.INEXISTENTE)

    agora = agora_unix(relogio)
    parametros = (agora, calcular_hash_token(pedido.token), TIPO_RENOVACAO, pedido.id_cliente,
                  agora)
    # fetchall: o UPDATE só termina (e grava) quando o cursor chega ao fim.
    linhas = conexao.execute(SQL_GIRAR, parametros).fetchall()
    if not linhas:
        return recusar_giro(conexao, pedido, agora)

    antigo = montar_token(linhas[0])
    conexao.execute(SQL_REVOGAR_ACESSOS_DA_FAMILIA, (agora, antigo.familia, TIPO_ACESSO))
    novo = NovoPar(antigo.id_cliente, antigo.id_usuario, antigo.familia, antigo.escopo)
    return ResultadoGiro(SituacaoGiro.GIRADO, antigo, criar_par(conexao, novo, lambda: agora))


def revogar_token(
    conexao: sqlite3.Connection, pedido: PedidoComCliente, relogio: Relogio = time.time
) -> bool:
    """Revoga um token (``POST /api/oauth/revoke``, RFC 7009).

    Renovação revoga a família inteira; acesso revoga só ele. A ``token_type_hint`` não é
    necessária: o tipo vem do banco. A rota responde 200 em qualquer caso (seção 2.2).

    Args:
        conexao: Conexão aberta (a transação é confirmada por quem a entregou).
        pedido: Token e ``client_id`` recebidos.
        relogio: Fonte do instante atual (padrão: ``time.time``).

    Returns:
        True se o token existe e é do cliente (revogado agora ou antes); False se não existe
        ou é de outro cliente (nada muda).
    """
    token = buscar_token(conexao, pedido.token)
    if token is None or token.id_cliente != pedido.id_cliente:
        return False

    if token.tipo == TIPO_RENOVACAO:
        revogar_familia(conexao, token.familia, relogio)
        return True
    conexao.execute(SQL_REVOGAR_POR_ID, (agora_unix(relogio), token.id))
    return True


def apagar_tokens_vencidos(conexao: sqlite3.Connection, relogio: Relogio = time.time) -> int:
    """Apaga os tokens vencidos (limpeza; usa ``idx_tokens_expira_em``).

    Depois de apagada, uma renovação reapresentada vira ``INEXISTENTE`` e continua recusada.

    Args:
        conexao: Conexão aberta (a transação é confirmada por quem a entregou).
        relogio: Fonte do instante atual (padrão: ``time.time``).

    Returns:
        Quantidade de tokens apagados.
    """
    return conexao.execute(SQL_APAGAR_VENCIDOS, (agora_unix(relogio),)).rowcount
