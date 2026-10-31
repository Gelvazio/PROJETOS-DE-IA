"""Monta o ``ProjetoApi`` a partir do projeto do banco (compartilhado pelas rotas de projeto).

Papel e permissões não ficam no banco (``esquema.sql``): o dono do projeto é sempre ``owner``.
Os valores seguem o formato *inferido* do inventário (``docs/inventario/api.md``).
"""

from servidor.banco.projetos_repositorio import Projeto
from servidor.esquemas.api import ProjetoApi

PAPEL_DONO = "owner"
SLUG_PAPEL_DONO = "owner"
NOME_PAPEL_DONO = "Owner"
PERMISSOES_DONO = ["read", "write", "delete", "admin"]


def montar_projeto_api(projeto: Projeto) -> ProjetoApi:
    """Converte o projeto do banco no formato da API, com o papel de dono.

    Args:
        projeto: Projeto do dono, como sai do repositório.

    Returns:
        ``ProjetoApi`` com ``role``, ``project_role_*`` e ``permissions`` do dono.
    """
    return ProjetoApi(
        id=projeto.id,
        name=projeto.nome,
        description=projeto.descricao,
        role=PAPEL_DONO,
        project_role_slug=SLUG_PAPEL_DONO,
        project_role_name=NOME_PAPEL_DONO,
        permissions=list(PERMISSOES_DONO),
    )
