"""Repositório de tarefas: CRUD, lixeira e restauração, sempre dentro do projeto do dono.

Regras (ETAPA-007, SERVIDOR.19; usadas pelas rotas de tarefas, SERVIDOR.42):

* A tarefa pertence a um projeto, e o dono é conferido **pelo projeto**: todo SQL leva
  ``FILTRO_DONO`` (o projeto precisa existir e ser do dono). Tarefa de projeto alheio é tratada
  como inexistente (a rota devolve 404).
* Valores do inventário (``docs/inventario/mcp-cli-wsl.md``, ferramentas 13 a 18): situação
  ``backlog``, ``todo``, ``in_progress``, ``review``, ``done``, ``closed`` (padrão ``backlog``);
  prioridade ``low``, ``medium``, ``high``, ``urgent`` (padrão ``medium``); título de até 200
  caracteres; ``limit`` padrão 20; lixeira com retenção de 7 dias.
* Apagar manda para a lixeira (``apagada_em``); restaurar só dentro da retenção; a limpeza da
  lixeira vencida é ``apagar_tarefas_vencidas_da_lixeira`` (chamar na subida do app).
* ``iniciada_em`` é gravada na 1ª ida para ``in_progress``; ``concluida_em`` ao ir para ``done``
  ou ``closed`` e limpa se a tarefa sair delas.
* Listas (itens e tags) guardadas como JSON; itens com as chaves da API (``text``,
  ``completed``). Datas em segundos Unix: a rota converte para texto.
* Conexão por parâmetro, SQL parametrizado e sem ``commit`` (quem confirma é a dependência do
  pedido, ``servidor.banco.conexao``).
"""

import json
import math
import sqlite3
import uuid
from collections.abc import Callable, Sequence
from dataclasses import dataclass

from servidor.banco.projetos_repositorio import (
    ChaveProjeto,
    ErroPaginacaoInvalida,
    parametros_da_chave,
    projeto_pertence_ao_dono,
)
from servidor.banco.projetos_repositorio import normalizar_id_projeto as normalizar_uuid
from servidor.constantes import TABELA_PROJETOS, TABELA_TAREFAS

SITUACOES_TAREFA = ("backlog", "todo", "in_progress", "review", "done", "closed")
SITUACAO_PADRAO = "backlog"
SITUACAO_EM_ANDAMENTO = "in_progress"
SITUACOES_CONCLUIDAS = ("done", "closed")
PRIORIDADES_TAREFA = ("low", "medium", "high", "urgent")
PRIORIDADE_PADRAO = "medium"

TAMANHO_MAXIMO_TITULO = 200
TAMANHO_MAXIMO_DESCRICAO = 20000
QUANTIDADE_MAXIMA_ITENS = 100
TAMANHO_MAXIMO_TEXTO_ITEM = 500
QUANTIDADE_MAXIMA_TAGS = 20
TAMANHO_MAXIMO_TAG = 50
HORAS_ESTIMADAS_MAXIMAS = 10000
LIMITE_PADRAO_LISTAGEM = 20
LIMITE_MAXIMO_LISTAGEM = 100
RETENCAO_LIXEIRA_SEGUNDOS = 7 * 24 * 60 * 60
CHAVE_TEXTO_ITEM = "text"
CHAVE_CONCLUIDO_ITEM = "completed"

MSG_TITULO_INVALIDO = f"O título deve ter de 1 a {TAMANHO_MAXIMO_TITULO} caracteres."
MSG_DESCRICAO_INVALIDA = (
    f"A descrição deve ser texto de até {TAMANHO_MAXIMO_DESCRICAO} caracteres."
)
MSG_SITUACAO_INVALIDA = f"status deve ser um de: {', '.join(SITUACOES_TAREFA)}."
MSG_PRIORIDADE_INVALIDA = f"priority deve ser um de: {', '.join(PRIORIDADES_TAREFA)}."
MSG_ITENS_INVALIDOS = (
    f"items aceita até {QUANTIDADE_MAXIMA_ITENS} itens com texto de 1 a "
    f"{TAMANHO_MAXIMO_TEXTO_ITEM} caracteres e completed verdadeiro ou falso."
)
MSG_TAGS_INVALIDAS = (
    f"tags aceita até {QUANTIDADE_MAXIMA_TAGS} textos de 1 a {TAMANHO_MAXIMO_TAG} caracteres."
)
MSG_HORAS_INVALIDAS = f"estimated_hours deve ser um número de 0 a {HORAS_ESTIMADAS_MAXIMAS}."
MSG_PAGINACAO_INVALIDA = (
    f"limit deve ser de 1 a {LIMITE_MAXIMO_LISTAGEM} e offset deve ser 0 ou mais."
)

COLUNAS_TAREFA = (
    "id",
    "id_projeto",
    "titulo",
    "descricao",
    "situacao",
    "prioridade",
    "itens",
    "horas_estimadas",
    "tags",
    "id_responsavel",
    "id_sprint",
    "iniciada_em",
    "concluida_em",
    "criado_em",
    "atualizado_em",
    "apagada_em",
)
LISTA_SQL_CONCLUIDAS = ", ".join(f"'{situacao}'" for situacao in SITUACOES_CONCLUIDAS)
SELECIONAR_TAREFA = f"SELECT {', '.join(COLUNAS_TAREFA)} FROM {TABELA_TAREFAS}"
# O projeto da tarefa precisa existir e ser do dono; senão a subconsulta dá NULL e nada bate.
FILTRO_DONO = (
    f"id_projeto = (SELECT id FROM {TABELA_PROJETOS} "
    "WHERE id = :id_projeto AND id_dono = :id_dono)"
)
FILTRO_TAREFA_ATIVA = f"id = :id_tarefa AND {FILTRO_DONO} AND apagada_em IS NULL"
SQL_POR_ID = f"{SELECIONAR_TAREFA} WHERE {FILTRO_TAREFA_ATIVA}"
SQL_INSERIR = (
    f"INSERT INTO {TABELA_TAREFAS} (id, id_projeto, titulo, descricao, situacao, prioridade, "
    "itens, horas_estimadas, tags, iniciada_em, concluida_em) "
    "SELECT :id_tarefa, id, :titulo, :descricao, :situacao, :prioridade, :itens, :horas, :tags, "
    f"CASE WHEN :situacao = '{SITUACAO_EM_ANDAMENTO}' THEN unixepoch() END, "
    f"CASE WHEN :situacao IN ({LISTA_SQL_CONCLUIDAS}) THEN unixepoch() END "
    f"FROM {TABELA_PROJETOS} WHERE id = :id_projeto AND id_dono = :id_dono"
)
# coalesce mantém o valor atual quando o campo não veio (None). No lado direito do SET, as
# colunas ainda têm o valor antigo.
SQL_ATUALIZAR = (
    f"UPDATE {TABELA_TAREFAS} SET titulo = coalesce(:titulo, titulo), "
    "descricao = coalesce(:descricao, descricao), situacao = coalesce(:situacao, situacao), "
    "prioridade = coalesce(:prioridade, prioridade), itens = coalesce(:itens, itens), "
    "horas_estimadas = coalesce(:horas, horas_estimadas), tags = coalesce(:tags, tags), "
    f"iniciada_em = CASE WHEN :situacao = '{SITUACAO_EM_ANDAMENTO}' "
    "THEN coalesce(iniciada_em, unixepoch()) ELSE iniciada_em END, "
    "concluida_em = CASE WHEN :situacao IS NULL THEN concluida_em "
    f"WHEN :situacao IN ({LISTA_SQL_CONCLUIDAS}) THEN coalesce(concluida_em, unixepoch()) "
    "ELSE NULL END, atualizado_em = unixepoch() "
    f"WHERE {FILTRO_TAREFA_ATIVA}"
)
SQL_MOVER_PARA_LIXEIRA = (
    f"UPDATE {TABELA_TAREFAS} SET apagada_em = unixepoch(), atualizado_em = unixepoch() "
    f"WHERE {FILTRO_TAREFA_ATIVA}"
)
SQL_RESTAURAR = (
    f"UPDATE {TABELA_TAREFAS} SET apagada_em = NULL, atualizado_em = unixepoch() "
    f"WHERE id = :id_tarefa AND {FILTRO_DONO} AND apagada_em IS NOT NULL "
    "AND apagada_em > unixepoch() - :retencao"
)
SQL_LIMPAR_LIXEIRA = (
    f"DELETE FROM {TABELA_TAREFAS} "
    "WHERE apagada_em IS NOT NULL AND apagada_em <= unixepoch() - :retencao"
)
# Partes da listagem: os valores sempre vão por parâmetro nomeado.
WHERE_LISTAGEM = f"WHERE {FILTRO_DONO} AND apagada_em IS NULL"
FILTRO_SITUACAO = " AND situacao = :situacao"
FILTRO_PRIORIDADE = " AND prioridade = :prioridade"
FILTRO_TAG = " AND EXISTS (SELECT 1 FROM json_each({tabela}.tags) WHERE value = :{parametro})"
ORDEM_LISTAGEM = " ORDER BY criado_em DESC, id LIMIT :limite OFFSET :deslocamento"
PREFIXO_PARAMETRO_TAG = "tag_"


class ErroDadosTarefa(ValueError):
    """Campo ou filtro de tarefa recusado; a rota devolve 400 com a mensagem."""


@dataclass(frozen=True)
class ItemChecklist:
    """Item do checklist (``TaskItem { text, completed }`` da API)."""

    texto: str
    concluido: bool = False


@dataclass(frozen=True)
class Tarefa:
    """Tarefa como sai do banco. Datas em segundos Unix; listas já convertidas do JSON."""

    id: str
    id_projeto: str
    titulo: str
    descricao: str
    situacao: str
    prioridade: str
    itens: tuple[ItemChecklist, ...]
    horas_estimadas: float
    tags: tuple[str, ...]
    id_responsavel: str | None
    id_sprint: str | None
    iniciada_em: int | None
    concluida_em: int | None
    criado_em: int
    atualizado_em: int
    apagada_em: int | None


@dataclass(frozen=True)
class ChaveTarefa:
    """Identifica uma tarefa dentro do projeto do dono."""

    projeto: ChaveProjeto
    id_tarefa: str


@dataclass(frozen=True)
class NovaTarefa:
    """Dados para criar uma tarefa (``POST /api/projects/{p}/tasks``)."""

    titulo: str
    descricao: str = ""
    situacao: str = SITUACAO_PADRAO
    prioridade: str = PRIORIDADE_PADRAO
    itens: Sequence[ItemChecklist] = ()
    horas_estimadas: float = 0.0
    tags: Sequence[str] = ()


@dataclass(frozen=True)
class AlteracaoTarefa:
    """Campos a alterar (``PATCH``); ``None`` mantém o valor atual."""

    titulo: str | None = None
    descricao: str | None = None
    situacao: str | None = None
    prioridade: str | None = None
    itens: Sequence[ItemChecklist] | None = None
    horas_estimadas: float | None = None
    tags: Sequence[str] | None = None


@dataclass(frozen=True)
class FiltrosTarefas:
    """Filtros e página da listagem (``?status=&priority=&tags=&limit=&offset=``)."""

    situacao: str | None = None
    prioridade: str | None = None
    tags: Sequence[str] = ()
    limite: int = LIMITE_PADRAO_LISTAGEM
    deslocamento: int = 0


def normalizar_titulo(titulo: str) -> str:
    """Tira os espaços das pontas e confere o tamanho do título.

    Args:
        titulo: Título informado.

    Returns:
        Título sem espaços nas pontas.

    Raises:
        ErroDadosTarefa: Se não for texto, ficar vazio ou passar do limite.
    """
    texto = titulo.strip() if isinstance(titulo, str) else ""
    if not 0 < len(texto) <= TAMANHO_MAXIMO_TITULO:
        raise ErroDadosTarefa(MSG_TITULO_INVALIDO)
    return texto


def normalizar_descricao(descricao: str) -> str:
    """Tira os espaços das pontas e confere o tamanho da descrição (vazia é permitida).

    Args:
        descricao: Descrição informada.

    Returns:
        Descrição sem espaços nas pontas.

    Raises:
        ErroDadosTarefa: Se não for texto ou passar do limite.
    """
    if not isinstance(descricao, str) or len(descricao.strip()) > TAMANHO_MAXIMO_DESCRICAO:
        raise ErroDadosTarefa(MSG_DESCRICAO_INVALIDA)
    return descricao.strip()


def validar_situacao(situacao: str) -> str:
    """Confere se a situação é uma das do inventário.

    Args:
        situacao: Valor de ``status``.

    Returns:
        A mesma situação.

    Raises:
        ErroDadosTarefa: Se não for uma das ``SITUACOES_TAREFA``.
    """
    if situacao not in SITUACOES_TAREFA:
        raise ErroDadosTarefa(MSG_SITUACAO_INVALIDA)
    return situacao


def validar_prioridade(prioridade: str) -> str:
    """Confere se a prioridade é uma das do inventário.

    Args:
        prioridade: Valor de ``priority``.

    Returns:
        A mesma prioridade.

    Raises:
        ErroDadosTarefa: Se não for uma das ``PRIORIDADES_TAREFA``.
    """
    if prioridade not in PRIORIDADES_TAREFA:
        raise ErroDadosTarefa(MSG_PRIORIDADE_INVALIDA)
    return prioridade


def eh_lista(valor: object) -> bool:
    """Diz se o valor é lista ou tupla (texto não conta, embora seja ``Sequence``).

    Args:
        valor: Valor recebido.

    Returns:
        True para ``list`` ou ``tuple``.
    """
    return isinstance(valor, (list, tuple))


def normalizar_item(item: ItemChecklist) -> ItemChecklist:
    """Confere um item do checklist.

    Args:
        item: Item informado.

    Returns:
        Item com o texto sem espaços nas pontas.

    Raises:
        ErroDadosTarefa: Se não for ``ItemChecklist``, o texto for inválido ou ``concluido``
            não for ``bool``.
    """
    if not isinstance(item, ItemChecklist) or not isinstance(item.concluido, bool):
        raise ErroDadosTarefa(MSG_ITENS_INVALIDOS)

    texto = item.texto.strip() if isinstance(item.texto, str) else ""
    if not 0 < len(texto) <= TAMANHO_MAXIMO_TEXTO_ITEM:
        raise ErroDadosTarefa(MSG_ITENS_INVALIDOS)
    return ItemChecklist(texto=texto, concluido=item.concluido)


def normalizar_itens(itens: Sequence[ItemChecklist]) -> tuple[ItemChecklist, ...]:
    """Confere o checklist inteiro.

    Args:
        itens: Itens informados.

    Returns:
        Itens normalizados, na ordem recebida.

    Raises:
        ErroDadosTarefa: Se não for lista, tiver itens demais ou algum item inválido.
    """
    if not eh_lista(itens) or len(itens) > QUANTIDADE_MAXIMA_ITENS:
        raise ErroDadosTarefa(MSG_ITENS_INVALIDOS)
    return tuple(normalizar_item(item) for item in itens)


def normalizar_tags(tags: Sequence[str]) -> tuple[str, ...]:
    """Confere as tags: textos curtos, sem espaços nas pontas e sem repetidos.

    Args:
        tags: Tags informadas.

    Returns:
        Tags normalizadas, sem repetidos e na ordem recebida.

    Raises:
        ErroDadosTarefa: Se não for lista, tiver tags demais ou alguma tag inválida.
    """
    if not eh_lista(tags) or len(tags) > QUANTIDADE_MAXIMA_TAGS:
        raise ErroDadosTarefa(MSG_TAGS_INVALIDAS)

    normalizadas = tuple(tag.strip() if isinstance(tag, str) else "" for tag in tags)
    if any(not 0 < len(tag) <= TAMANHO_MAXIMO_TAG for tag in normalizadas):
        raise ErroDadosTarefa(MSG_TAGS_INVALIDAS)
    return tuple(dict.fromkeys(normalizadas))


def normalizar_horas(horas: float) -> float:
    """Confere as horas estimadas (número finito, ``bool`` não conta).

    Args:
        horas: Valor de ``estimated_hours``.

    Returns:
        Horas como ``float``.

    Raises:
        ErroDadosTarefa: Se não for número ou estiver fora da faixa.
    """
    eh_numero = isinstance(horas, (int, float)) and not isinstance(horas, bool)
    if not eh_numero or not math.isfinite(horas):
        raise ErroDadosTarefa(MSG_HORAS_INVALIDAS)
    if not 0 <= horas <= HORAS_ESTIMADAS_MAXIMAS:
        raise ErroDadosTarefa(MSG_HORAS_INVALIDAS)
    return float(horas)


def itens_para_json(itens: tuple[ItemChecklist, ...]) -> str:
    """Converte o checklist para o JSON gravado (chaves da API).

    Args:
        itens: Itens já normalizados.

    Returns:
        JSON ``[{"text": ..., "completed": ...}]``.
    """
    return json.dumps(
        [{CHAVE_TEXTO_ITEM: item.texto, CHAVE_CONCLUIDO_ITEM: item.concluido} for item in itens],
        ensure_ascii=False,
    )


def checklist_para_json(itens: Sequence[ItemChecklist]) -> str:
    """Confere o checklist e converte para o JSON gravado.

    Args:
        itens: Itens informados.

    Returns:
        JSON do checklist.

    Raises:
        ErroDadosTarefa: Se o checklist for inválido.
    """
    return itens_para_json(normalizar_itens(itens))


def tags_para_json(tags: Sequence[str]) -> str:
    """Confere as tags e converte para o JSON gravado.

    Args:
        tags: Tags informadas.

    Returns:
        JSON da lista de tags.

    Raises:
        ErroDadosTarefa: Se as tags forem inválidas.
    """
    return json.dumps(list(normalizar_tags(tags)), ensure_ascii=False)


def converter_se_veio(valor: object, converter: Callable[[object], object]) -> object:
    """Aplica a conferência só ao campo que veio no pedido (``None`` = não veio).

    Args:
        valor: Valor do campo.
        converter: Função que confere e converte o valor.

    Returns:
        None se o campo não veio; senão, o valor convertido.

    Raises:
        ErroDadosTarefa: Repassa o erro da conferência.
    """
    return None if valor is None else converter(valor)


def itens_do_json(texto_json: str) -> tuple[ItemChecklist, ...]:
    """Converte o JSON gravado de volta para o checklist.

    Args:
        texto_json: Conteúdo da coluna ``itens``.

    Returns:
        Itens do checklist.
    """
    return tuple(
        ItemChecklist(
            texto=item[CHAVE_TEXTO_ITEM], concluido=bool(item.get(CHAVE_CONCLUIDO_ITEM, False))
        )
        for item in json.loads(texto_json)
    )


def montar_tarefa(linha: Sequence) -> Tarefa:
    """Converte uma linha do ``SELECIONAR_TAREFA`` em ``Tarefa`` (vale para tupla e ``Row``).

    Args:
        linha: Linha com as colunas de ``COLUNAS_TAREFA``, nessa ordem.

    Returns:
        Tarefa com itens e tags convertidos do JSON.
    """
    valores = dict(zip(COLUNAS_TAREFA, tuple(linha)))
    valores["itens"] = itens_do_json(valores["itens"])
    valores["tags"] = tuple(json.loads(valores["tags"]))
    valores["horas_estimadas"] = float(valores["horas_estimadas"])
    return Tarefa(**valores)


def parametros_do_projeto(chave: ChaveProjeto) -> dict[str, str] | None:
    """Parâmetros nomeados do ``FILTRO_DONO``, com o id do projeto normalizado.

    Args:
        chave: Projeto e dono.

    Returns:
        ``{"id_projeto", "id_dono"}``, ou None se algum id não servir.
    """
    parametros = parametros_da_chave(chave)
    if parametros is None:
        return None
    id_projeto, id_dono = parametros
    return {"id_projeto": id_projeto, "id_dono": id_dono}


def parametros_da_tarefa(chave: ChaveTarefa) -> dict[str, str] | None:
    """Parâmetros nomeados de uma tarefa do dono (projeto, dono e tarefa normalizados).

    Args:
        chave: Projeto do dono e id da tarefa.

    Returns:
        ``{"id_projeto", "id_dono", "id_tarefa"}``, ou None se algum id não servir.
    """
    parametros = parametros_do_projeto(chave.projeto)
    id_tarefa = normalizar_uuid(chave.id_tarefa)
    if parametros is None or id_tarefa is None:
        return None
    return {**parametros, "id_tarefa": id_tarefa}


def buscar_tarefa(conexao: sqlite3.Connection, chave: ChaveTarefa) -> Tarefa | None:
    """Busca uma tarefa fora da lixeira, no projeto do dono.

    Args:
        conexao: Conexão aberta.
        chave: Projeto do dono e id da tarefa.

    Returns:
        Tarefa, ou None se não existir, estiver na lixeira, for de projeto alheio ou o id for
        inválido.
    """
    parametros = parametros_da_tarefa(chave)
    if parametros is None:
        return None

    linha = conexao.execute(SQL_POR_ID, parametros).fetchone()
    return montar_tarefa(linha) if linha is not None else None


def parametros_da_nova_tarefa(dados: NovaTarefa) -> dict[str, object]:
    """Confere os dados de criação e monta os parâmetros do ``SQL_INSERIR``.

    Args:
        dados: Dados da tarefa nova.

    Returns:
        Parâmetros nomeados dos campos (sem projeto, dono e id).

    Raises:
        ErroDadosTarefa: Se algum campo for inválido.
    """
    return {
        "titulo": normalizar_titulo(dados.titulo),
        "descricao": normalizar_descricao(dados.descricao),
        "situacao": validar_situacao(dados.situacao),
        "prioridade": validar_prioridade(dados.prioridade),
        "itens": checklist_para_json(dados.itens),
        "horas": normalizar_horas(dados.horas_estimadas),
        "tags": tags_para_json(dados.tags),
    }


def criar_tarefa(
    conexao: sqlite3.Connection, projeto: ChaveProjeto, dados: NovaTarefa
) -> Tarefa | None:
    """Cria uma tarefa no projeto do dono.

    O ``INSERT ... SELECT`` só grava se o projeto for do dono, na mesma instrução.

    Args:
        conexao: Conexão aberta (a transação é confirmada por quem a entregou).
        projeto: Projeto e dono.
        dados: Campos da tarefa.

    Returns:
        Tarefa criada, ou None se o projeto não existir ou for de outro dono.

    Raises:
        ErroDadosTarefa: Se algum campo for inválido.
    """
    campos = parametros_da_nova_tarefa(dados)
    parametros = parametros_do_projeto(projeto)
    if parametros is None:
        return None

    id_tarefa = str(uuid.uuid4())
    cursor = conexao.execute(SQL_INSERIR, {**parametros, **campos, "id_tarefa": id_tarefa})
    if cursor.rowcount == 0:
        return None

    tarefa = buscar_tarefa(conexao, ChaveTarefa(projeto, id_tarefa))
    if tarefa is None:
        raise sqlite3.IntegrityError(f"Tarefa {id_tarefa} não foi gravada")
    return tarefa


def parametros_da_alteracao(dados: AlteracaoTarefa) -> dict[str, object]:
    """Confere só os campos que vieram e monta os parâmetros do ``SQL_ATUALIZAR``.

    Args:
        dados: Campos a alterar.

    Returns:
        Parâmetros nomeados; campo ausente vai como None (o ``coalesce`` mantém o atual).

    Raises:
        ErroDadosTarefa: Se algum campo informado for inválido.
    """
    return {
        "titulo": converter_se_veio(dados.titulo, normalizar_titulo),
        "descricao": converter_se_veio(dados.descricao, normalizar_descricao),
        "situacao": converter_se_veio(dados.situacao, validar_situacao),
        "prioridade": converter_se_veio(dados.prioridade, validar_prioridade),
        "itens": converter_se_veio(dados.itens, checklist_para_json),
        "horas": converter_se_veio(dados.horas_estimadas, normalizar_horas),
        "tags": converter_se_veio(dados.tags, tags_para_json),
    }


def atualizar_tarefa(
    conexao: sqlite3.Connection, chave: ChaveTarefa, dados: AlteracaoTarefa
) -> Tarefa | None:
    """Altera os campos informados de uma tarefa fora da lixeira, no projeto do dono.

    Pedido sem nenhum campo não grava nada (nem muda ``atualizado_em``). As transições de
    situação não são restringidas (o inventário não mostra quais são permitidas).

    Args:
        conexao: Conexão aberta (a transação é confirmada por quem a entregou).
        chave: Projeto do dono e id da tarefa.
        dados: Campos a alterar.

    Returns:
        Tarefa atualizada, ou None se não existir, estiver na lixeira ou for de projeto alheio.

    Raises:
        ErroDadosTarefa: Se algum campo informado for inválido.
    """
    campos = parametros_da_alteracao(dados)
    parametros = parametros_da_tarefa(chave)
    if parametros is None:
        return None

    nada_a_alterar = all(valor is None for valor in campos.values())
    if nada_a_alterar:
        return buscar_tarefa(conexao, chave)

    cursor = conexao.execute(SQL_ATUALIZAR, {**parametros, **campos})
    if cursor.rowcount == 0:
        return None
    return buscar_tarefa(conexao, chave)


def mover_tarefa_para_lixeira(conexao: sqlite3.Connection, chave: ChaveTarefa) -> bool:
    """Manda a tarefa para a lixeira (``DELETE`` da API: "moved to trash. Can be restored").

    Args:
        conexao: Conexão aberta (a transação é confirmada por quem a entregou).
        chave: Projeto do dono e id da tarefa.

    Returns:
        True se a tarefa estava fora da lixeira, no projeto do dono, e foi para a lixeira.
    """
    parametros = parametros_da_tarefa(chave)
    if parametros is None:
        return False
    return conexao.execute(SQL_MOVER_PARA_LIXEIRA, parametros).rowcount > 0


def restaurar_tarefa(conexao: sqlite3.Connection, chave: ChaveTarefa) -> Tarefa | None:
    """Tira a tarefa da lixeira, se ainda estiver dentro da retenção de 7 dias.

    Args:
        conexao: Conexão aberta (a transação é confirmada por quem a entregou).
        chave: Projeto do dono e id da tarefa.

    Returns:
        Tarefa restaurada, ou None se não estiver na lixeira, a retenção tiver vencido ou for
        de projeto alheio.
    """
    parametros = parametros_da_tarefa(chave)
    if parametros is None:
        return None

    cursor = conexao.execute(
        SQL_RESTAURAR, {**parametros, "retencao": RETENCAO_LIXEIRA_SEGUNDOS}
    )
    if cursor.rowcount == 0:
        return None
    return buscar_tarefa(conexao, chave)


def apagar_tarefas_vencidas_da_lixeira(conexao: sqlite3.Connection) -> int:
    """Apaga de vez as tarefas que estão na lixeira há mais de 7 dias (todos os projetos).

    Args:
        conexao: Conexão aberta (a transação é confirmada por quem a entregou).

    Returns:
        Quantidade de tarefas apagadas.
    """
    cursor = conexao.execute(SQL_LIMPAR_LIXEIRA, {"retencao": RETENCAO_LIXEIRA_SEGUNDOS})
    return cursor.rowcount


def validar_filtros(filtros: FiltrosTarefas) -> FiltrosTarefas:
    """Confere situação, prioridade, tags e página da listagem.

    Args:
        filtros: Filtros pedidos.

    Returns:
        Filtros conferidos, com as tags normalizadas.

    Raises:
        ErroDadosTarefa: Situação, prioridade ou tags inválidas.
        ErroPaginacaoInvalida: ``limit``/``offset`` fora da faixa.
    """
    valores_pagina = (filtros.limite, filtros.deslocamento)
    sao_inteiros = all(isinstance(v, int) and not isinstance(v, bool) for v in valores_pagina)
    pagina_valida = sao_inteiros and 0 < filtros.limite <= LIMITE_MAXIMO_LISTAGEM
    if not pagina_valida or filtros.deslocamento < 0:
        raise ErroPaginacaoInvalida(MSG_PAGINACAO_INVALIDA)

    if filtros.situacao is not None:
        validar_situacao(filtros.situacao)
    if filtros.prioridade is not None:
        validar_prioridade(filtros.prioridade)
    return FiltrosTarefas(
        situacao=filtros.situacao,
        prioridade=filtros.prioridade,
        tags=normalizar_tags(filtros.tags),
        limite=filtros.limite,
        deslocamento=filtros.deslocamento,
    )


def montar_filtro_listagem(filtros: FiltrosTarefas) -> tuple[str, dict[str, object]]:
    """Monta o ``WHERE`` da listagem e os parâmetros dos filtros (sem projeto, dono e página).

    Cada tag vira um ``EXISTS`` próprio: a tarefa precisa ter **todas** as tags pedidas.

    Args:
        filtros: Filtros já conferidos.

    Returns:
        Texto do ``WHERE`` e os parâmetros nomeados dos filtros.
    """
    where = WHERE_LISTAGEM
    parametros: dict[str, object] = {}
    if filtros.situacao is not None:
        where += FILTRO_SITUACAO
        parametros["situacao"] = filtros.situacao
    if filtros.prioridade is not None:
        where += FILTRO_PRIORIDADE
        parametros["prioridade"] = filtros.prioridade
    for posicao, tag in enumerate(filtros.tags):
        nome_parametro = f"{PREFIXO_PARAMETRO_TAG}{posicao}"
        where += FILTRO_TAG.format(tabela=TABELA_TAREFAS, parametro=nome_parametro)
        parametros[nome_parametro] = tag
    return where, parametros


def listar_tarefas(
    conexao: sqlite3.Connection,
    projeto: ChaveProjeto,
    filtros: FiltrosTarefas = FiltrosTarefas(),
) -> list[Tarefa] | None:
    """Lista as tarefas fora da lixeira do projeto do dono, mais novas primeiro.

    Args:
        conexao: Conexão aberta.
        projeto: Projeto e dono.
        filtros: Situação, prioridade, tags e página (padrão: as primeiras 20).

    Returns:
        Tarefas da página, ou None se o projeto não existir ou for de outro dono.

    Raises:
        ErroDadosTarefa: Filtro inválido.
        ErroPaginacaoInvalida: ``limit``/``offset`` fora da faixa.
    """
    conferidos = validar_filtros(filtros)
    parametros = parametros_do_projeto(projeto)
    if parametros is None or not projeto_pertence_ao_dono(conexao, projeto):
        return None

    where, parametros_filtro = montar_filtro_listagem(conferidos)
    pagina = {"limite": conferidos.limite, "deslocamento": conferidos.deslocamento}
    linhas = conexao.execute(
        f"{SELECIONAR_TAREFA} {where}{ORDEM_LISTAGEM}",
        {**parametros, **parametros_filtro, **pagina},
    ).fetchall()
    return [montar_tarefa(linha) for linha in linhas]


def contar_tarefas(
    conexao: sqlite3.Connection,
    projeto: ChaveProjeto,
    filtros: FiltrosTarefas = FiltrosTarefas(),
) -> int:
    """Conta as tarefas fora da lixeira que batem com os filtros (``total`` do ``TasksMeta``).

    Args:
        conexao: Conexão aberta.
        projeto: Projeto e dono.
        filtros: Os mesmos da listagem (a página é ignorada).

    Returns:
        Quantidade de tarefas (0 se o projeto não existir ou for de outro dono).

    Raises:
        ErroDadosTarefa: Filtro inválido.
        ErroPaginacaoInvalida: ``limit``/``offset`` fora da faixa.
    """
    conferidos = validar_filtros(filtros)
    parametros = parametros_do_projeto(projeto)
    if parametros is None:
        return 0

    where, parametros_filtro = montar_filtro_listagem(conferidos)
    linha = conexao.execute(
        f"SELECT count(*) FROM {TABELA_TAREFAS} {where}", {**parametros, **parametros_filtro}
    ).fetchone()
    return int(linha[0])
