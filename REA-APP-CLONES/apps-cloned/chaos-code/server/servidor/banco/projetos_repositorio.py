"""Repositório de projetos: criar, buscar, listar, alterar e apagar, sempre filtrado pelo dono.

Regras (ETAPA-007, SERVIDOR.18; usadas pelas rotas do usuário e de projetos, SERVIDOR.40 e 41, e
pelos repositórios de tarefas e imagens, SERVIDOR.19 e 20):

* Toda consulta leva ``id_dono`` no ``WHERE``: projeto de outro usuário é tratado como
  inexistente (a rota devolve 404 e não revela que o id existe).
* Ids de projeto são UUID; o id recebido é normalizado para a forma canônica (minúsculas, com
  hífens). Id que não é UUID vira "não encontrado", sem ir ao banco.
* Papel e permissões do ``ProjetoApi`` (``role``, ``project_role_*``, ``permissions``) não ficam
  no banco: a rota monta a partir do dono (``esquema.sql``).
* Apagar o projeto apaga, por ``ON DELETE CASCADE``, as linhas de tarefas e imagens. Os arquivos
  das imagens em ``dados/imagens/`` não são do banco: quem apaga o projeto apaga os arquivos.
* Conexão por parâmetro, SQL parametrizado e sem ``commit`` (quem confirma é a dependência do
  pedido, ``servidor.banco.conexao``).
"""

import sqlite3
import uuid
from collections.abc import Sequence
from dataclasses import dataclass

from servidor.constantes import TABELA_PROJETOS

TAMANHO_MAXIMO_NOME_PROJETO = 200
TAMANHO_MAXIMO_DESCRICAO_PROJETO = 5000
LIMITE_PADRAO_LISTAGEM = 50
LIMITE_MAXIMO_LISTAGEM = 200

MSG_NOME_PROJETO_INVALIDO = (
    f"O nome do projeto deve ter de 1 a {TAMANHO_MAXIMO_NOME_PROJETO} caracteres."
)
MSG_DESCRICAO_PROJETO_INVALIDA = (
    "A descrição do projeto deve ser texto de até "
    f"{TAMANHO_MAXIMO_DESCRICAO_PROJETO} caracteres."
)
MSG_DONO_INVALIDO = "Dono do projeto inválido."
MSG_PAGINACAO_INVALIDA = (
    f"limit deve ser de 1 a {LIMITE_MAXIMO_LISTAGEM} e offset deve ser 0 ou mais."
)

COLUNAS_PROJETO = ("id", "id_dono", "nome", "descricao", "criado_em", "atualizado_em")
SELECIONAR_PROJETO = f"SELECT {', '.join(COLUNAS_PROJETO)} FROM {TABELA_PROJETOS}"
SQL_POR_ID_E_DONO = f"{SELECIONAR_PROJETO} WHERE id = ? AND id_dono = ?"
# Mesma ordem do índice idx_projetos_dono; o id desempata nomes iguais e deixa a página estável.
SQL_LISTAR_DO_DONO = (
    f"{SELECIONAR_PROJETO} WHERE id_dono = ? ORDER BY nome, id LIMIT ? OFFSET ?"
)
SQL_CONTAR_DO_DONO = f"SELECT count(*) FROM {TABELA_PROJETOS} WHERE id_dono = ?"
SQL_INSERIR = (
    f"INSERT INTO {TABELA_PROJETOS} (id, id_dono, nome, descricao) VALUES (?, ?, ?, ?)"
)
# coalesce mantém o valor atual quando o campo não veio no pedido (None).
SQL_ATUALIZAR = (
    f"UPDATE {TABELA_PROJETOS} SET nome = coalesce(?, nome), "
    "descricao = coalesce(?, descricao), atualizado_em = unixepoch() "
    "WHERE id = ? AND id_dono = ?"
)
SQL_APAGAR = f"DELETE FROM {TABELA_PROJETOS} WHERE id = ? AND id_dono = ?"
SQL_EXISTE_DO_DONO = f"SELECT 1 FROM {TABELA_PROJETOS} WHERE id = ? AND id_dono = ?"


class ErroDadosProjeto(ValueError):
    """Nome, descrição ou dono recusados; a rota devolve 400 com a mensagem."""


class ErroPaginacaoInvalida(ValueError):
    """``limit``/``offset`` fora da faixa; a rota devolve 400 com a mensagem."""


@dataclass(frozen=True)
class Projeto:
    """Projeto como sai do banco. Datas em segundos Unix."""

    id: str
    id_dono: str
    nome: str
    descricao: str
    criado_em: int
    atualizado_em: int


@dataclass(frozen=True)
class ChaveProjeto:
    """Identifica um projeto **do dono**: as operações só acham o projeto com os dois ids."""

    id_projeto: str
    id_dono: str


@dataclass(frozen=True)
class NovoProjeto:
    """Dados para criar um projeto (``name`` e ``description`` da API)."""

    nome: str
    descricao: str = ""


@dataclass(frozen=True)
class AlteracaoProjeto:
    """Campos a alterar; ``None`` mantém o valor atual."""

    nome: str | None = None
    descricao: str | None = None


@dataclass(frozen=True)
class Paginacao:
    """Página da listagem (``limit`` e ``offset`` da API)."""

    limite: int = LIMITE_PADRAO_LISTAGEM
    deslocamento: int = 0


def normalizar_id_projeto(id_projeto: str) -> str | None:
    """Converte o id recebido para a forma canônica do UUID gravado (``str(uuid.uuid4())``).

    Args:
        id_projeto: Id vindo da URL ou do corpo do pedido.

    Returns:
        UUID em minúsculas com hífens, ou None se não for um UUID em texto.
    """
    if not isinstance(id_projeto, str) or not id_projeto:
        return None
    try:
        return str(uuid.UUID(id_projeto))
    except ValueError:
        return None


def normalizar_nome_projeto(nome: str) -> str:
    """Tira os espaços das pontas e confere o tamanho do nome.

    Args:
        nome: Nome informado.

    Returns:
        Nome sem espaços nas pontas.

    Raises:
        ErroDadosProjeto: Se não for texto, ficar vazio ou passar do limite.
    """
    texto = nome.strip() if isinstance(nome, str) else ""
    if not 0 < len(texto) <= TAMANHO_MAXIMO_NOME_PROJETO:
        raise ErroDadosProjeto(MSG_NOME_PROJETO_INVALIDO)
    return texto


def normalizar_descricao_projeto(descricao: str) -> str:
    """Tira os espaços das pontas e confere o tamanho da descrição (vazia é permitida).

    Args:
        descricao: Descrição informada.

    Returns:
        Descrição sem espaços nas pontas.

    Raises:
        ErroDadosProjeto: Se não for texto ou passar do limite.
    """
    if not isinstance(descricao, str):
        raise ErroDadosProjeto(MSG_DESCRICAO_PROJETO_INVALIDA)

    texto = descricao.strip()
    if len(texto) > TAMANHO_MAXIMO_DESCRICAO_PROJETO:
        raise ErroDadosProjeto(MSG_DESCRICAO_PROJETO_INVALIDA)
    return texto


def validar_paginacao(paginacao: Paginacao) -> Paginacao:
    """Confere ``limit`` e ``offset`` (inteiros de verdade, ``bool`` não conta).

    Args:
        paginacao: Página pedida.

    Returns:
        A mesma página, já conferida.

    Raises:
        ErroPaginacaoInvalida: Se algum valor não for inteiro ou estiver fora da faixa.
    """
    valores = (paginacao.limite, paginacao.deslocamento)
    sao_inteiros = all(isinstance(v, int) and not isinstance(v, bool) for v in valores)
    if not sao_inteiros:
        raise ErroPaginacaoInvalida(MSG_PAGINACAO_INVALIDA)

    faixa_valida = 0 < paginacao.limite <= LIMITE_MAXIMO_LISTAGEM and paginacao.deslocamento >= 0
    if not faixa_valida:
        raise ErroPaginacaoInvalida(MSG_PAGINACAO_INVALIDA)
    return paginacao


def montar_projeto(linha: Sequence) -> Projeto:
    """Converte uma linha do ``SELECIONAR_PROJETO`` em ``Projeto`` (vale para tupla e ``Row``).

    Args:
        linha: Linha com as colunas de ``COLUNAS_PROJETO``, nessa ordem.

    Returns:
        Projeto.
    """
    return Projeto(**dict(zip(COLUNAS_PROJETO, tuple(linha))))


def parametros_da_chave(chave: ChaveProjeto) -> tuple[str, str] | None:
    """Monta os parâmetros ``(id, id_dono)`` do ``WHERE``, com o id do projeto normalizado.

    Args:
        chave: Projeto e dono.

    Returns:
        Tupla para o SQL, ou None se o id do projeto ou do dono não servir.
    """
    id_projeto = normalizar_id_projeto(chave.id_projeto)
    dono_valido = isinstance(chave.id_dono, str) and bool(chave.id_dono)
    if id_projeto is None or not dono_valido:
        return None
    return id_projeto, chave.id_dono


def buscar_projeto(conexao: sqlite3.Connection, chave: ChaveProjeto) -> Projeto | None:
    """Busca um projeto do dono.

    Args:
        conexao: Conexão aberta.
        chave: Id do projeto e id do dono.

    Returns:
        Projeto, ou None se não existir, for de outro dono ou o id for inválido.
    """
    parametros = parametros_da_chave(chave)
    if parametros is None:
        return None

    linha = conexao.execute(SQL_POR_ID_E_DONO, parametros).fetchone()
    return montar_projeto(linha) if linha is not None else None


def projeto_pertence_ao_dono(conexao: sqlite3.Connection, chave: ChaveProjeto) -> bool:
    """Diz se o projeto existe e é do dono (guarda das tarefas e imagens, SERVIDOR.19 e 20).

    Args:
        conexao: Conexão aberta.
        chave: Id do projeto e id do dono.

    Returns:
        True só se o projeto existir e for do dono.
    """
    parametros = parametros_da_chave(chave)
    if parametros is None:
        return False
    return conexao.execute(SQL_EXISTE_DO_DONO, parametros).fetchone() is not None


def listar_projetos(
    conexao: sqlite3.Connection, id_dono: str, paginacao: Paginacao = Paginacao()
) -> list[Projeto]:
    """Lista os projetos do dono por nome (``/api/oauth/user/projects``).

    Args:
        conexao: Conexão aberta.
        id_dono: UUID do usuário.
        paginacao: Página pedida (padrão: os primeiros ``LIMITE_PADRAO_LISTAGEM``).

    Returns:
        Projetos da página, ordenados por nome (lista vazia se o dono não tiver nenhum).

    Raises:
        ErroPaginacaoInvalida: Se ``limit``/``offset`` estiverem fora da faixa.
    """
    pagina = validar_paginacao(paginacao)
    if not isinstance(id_dono, str) or not id_dono:
        return []

    linhas = conexao.execute(
        SQL_LISTAR_DO_DONO, (id_dono, pagina.limite, pagina.deslocamento)
    ).fetchall()
    return [montar_projeto(linha) for linha in linhas]


def contar_projetos(conexao: sqlite3.Connection, id_dono: str) -> int:
    """Conta os projetos do dono (``total`` da paginação).

    Args:
        conexao: Conexão aberta.
        id_dono: UUID do usuário.

    Returns:
        Quantidade de projetos do dono.
    """
    if not isinstance(id_dono, str) or not id_dono:
        return 0
    return int(conexao.execute(SQL_CONTAR_DO_DONO, (id_dono,)).fetchone()[0])


def criar_projeto(conexao: sqlite3.Connection, id_dono: str, dados: NovoProjeto) -> Projeto:
    """Cria um projeto para o dono.

    Args:
        conexao: Conexão aberta (a transação é confirmada por quem a entregou).
        id_dono: UUID do usuário autenticado.
        dados: Nome e descrição.

    Returns:
        Projeto criado, com id UUID novo.

    Raises:
        ErroDadosProjeto: Se o dono, o nome ou a descrição forem inválidos.
        sqlite3.IntegrityError: Se o dono não existir na tabela de usuários.
    """
    if not isinstance(id_dono, str) or not id_dono:
        raise ErroDadosProjeto(MSG_DONO_INVALIDO)

    nome = normalizar_nome_projeto(dados.nome)
    descricao = normalizar_descricao_projeto(dados.descricao)
    id_projeto = str(uuid.uuid4())
    conexao.execute(SQL_INSERIR, (id_projeto, id_dono, nome, descricao))

    projeto = buscar_projeto(conexao, ChaveProjeto(id_projeto, id_dono))
    if projeto is None:
        raise sqlite3.IntegrityError(f"Projeto {id_projeto} não foi gravado")
    return projeto


def normalizar_alteracao(dados: AlteracaoProjeto) -> AlteracaoProjeto:
    """Confere só os campos que vieram no pedido.

    Args:
        dados: Campos a alterar.

    Returns:
        Campos normalizados (os ausentes continuam None).

    Raises:
        ErroDadosProjeto: Se o nome ou a descrição informados forem inválidos.
    """
    nome = None if dados.nome is None else normalizar_nome_projeto(dados.nome)
    descricao = None
    if dados.descricao is not None:
        descricao = normalizar_descricao_projeto(dados.descricao)
    return AlteracaoProjeto(nome=nome, descricao=descricao)


def atualizar_projeto(
    conexao: sqlite3.Connection, chave: ChaveProjeto, dados: AlteracaoProjeto
) -> Projeto | None:
    """Altera nome e/ou descrição de um projeto do dono.

    Pedido sem nenhum campo não grava nada (nem muda ``atualizado_em``).

    Args:
        conexao: Conexão aberta (a transação é confirmada por quem a entregou).
        chave: Id do projeto e id do dono.
        dados: Campos a alterar.

    Returns:
        Projeto atualizado, ou None se não existir ou for de outro dono.

    Raises:
        ErroDadosProjeto: Se o nome ou a descrição informados forem inválidos.
    """
    alteracao = normalizar_alteracao(dados)
    parametros = parametros_da_chave(chave)
    if parametros is None:
        return None

    nada_a_alterar = alteracao.nome is None and alteracao.descricao is None
    if nada_a_alterar:
        return buscar_projeto(conexao, chave)

    cursor = conexao.execute(SQL_ATUALIZAR, (alteracao.nome, alteracao.descricao, *parametros))
    if cursor.rowcount == 0:
        return None
    return buscar_projeto(conexao, chave)


def apagar_projeto(conexao: sqlite3.Connection, chave: ChaveProjeto) -> bool:
    """Apaga um projeto do dono; tarefas e imagens dele saem junto (``ON DELETE CASCADE``).

    Os arquivos das imagens em ``dados/imagens/`` ficam: quem chama apaga antes (SERVIDOR.20).

    Args:
        conexao: Conexão aberta (a transação é confirmada por quem a entregou).
        chave: Id do projeto e id do dono.

    Returns:
        True se o projeto existia, era do dono e foi apagado.
    """
    parametros = parametros_da_chave(chave)
    if parametros is None:
        return False
    return conexao.execute(SQL_APAGAR, parametros).rowcount > 0
