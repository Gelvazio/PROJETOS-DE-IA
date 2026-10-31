"""Esquemas Pydantic da API da plataforma: usuário, projeto, tarefa, imagem e modelo de agente.

Espelham `src/compartilhado/tipos-api.ts`, `tipos-agentes.ts` e `tipos-imagem.ts`, com os nomes de
campo do original (`docs/inventario/api.md`). Campos *(inferido)* no inventário seguem marcados.
"""

from typing import Generic, Literal, TypeVar

from pydantic import BaseModel, ConfigDict, Field

DadosResposta = TypeVar('DadosResposta')
MetadadosResposta = TypeVar('MetadadosResposta')

ModeloClaude = Literal['sonnet', 'haiku']
CorAgente = Literal[
    'purple', 'green', 'blue', 'cyan', 'orange', 'pink', 'yellow', 'red'
]
CategoriaModeloAgente = Literal[
    'review', 'testing', 'docs', 'refactor', 'debug',
    'workflow', 'research', 'integration', 'security',
]
MemoriaAgente = Literal['project']


class MetaPaginacao(BaseModel):
    """Paginação das listas (`TasksMeta` **[FIELDS]**; as demais seguem o formato *(inferido)*)."""

    total: int
    limit: int
    offset: int


class RespostaApi(BaseModel, Generic[DadosResposta, MetadadosResposta]):
    """Envelope padrão da API: `{ success, data, meta }` (*inferido*)."""

    success: bool
    data: DadosResposta
    meta: MetadadosResposta | None = None


class UsuarioApi(BaseModel):
    """Usuário autenticado. O inventário não descreve os campos; só o `id` foi identificado."""

    id: str


class ProjetoApi(BaseModel):
    """Projeto devolvido por `/api/oauth/user/projects` (campos *inferidos*)."""

    id: str
    name: str
    description: str
    role: str
    project_role_slug: str
    project_role_name: str
    permissions: list[str]


class RespostaProjetos(BaseModel):
    """Lista de projetos do usuário (um 2º campo não identificado *(inferido)*)."""

    projects: list[ProjetoApi]


class PedidoCriarProjeto(BaseModel):
    """Pedido de criação de projeto (*inferido*)."""

    name: str
    description: str | None = None


class PedidoAtualizarProjeto(BaseModel):
    """Pedido de alteração de projeto: campos opcionais (*inferido*)."""

    name: str | None = None
    description: str | None = None


class RespostaListaProjetos(RespostaApi[list[ProjetoApi], MetaPaginacao]):
    """Listagem de projetos do dono (``GET /api/projects``)."""


class RespostaProjeto(RespostaApi[ProjetoApi, None]):
    """Um projeto (``GET/POST/PATCH /api/projects/{p}``)."""


class ItemTarefa(BaseModel):
    """Item de checklist de uma tarefa (`TaskItem`, 2 campos **[FIELDS]**)."""

    text: str
    completed: bool


class TarefaApi(BaseModel):
    """Tarefa da plataforma (`ApiTask`, 14 campos; tipos *inferidos*)."""

    id: str
    title: str
    description: str
    status: str
    priority: str
    items: list[ItemTarefa]
    estimated_hours: float
    tags: list[str]
    assignee_id: str | None
    sprint_id: str | None
    started_at: str | None
    completed_at: str | None
    created_at: str
    updated_at: str


class FiltrosListaTarefas(BaseModel):
    """Filtros da query string de `GET /api/projects/{p}/tasks` (*inferido*)."""

    limit: int | None = None
    offset: int | None = None
    status: str | None = None
    priority: str | None = None
    tags: list[str] | None = None


class PedidoCriarTarefa(BaseModel):
    """Pedido de criação de tarefa (*inferido*)."""

    title: str
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    tags: list[str] | None = None
    items: list[ItemTarefa] | None = None
    estimated_hours: float | None = None


class PedidoAtualizarTarefa(BaseModel):
    """Pedido de alteração de tarefa: os mesmos campos, todos opcionais (*inferido*)."""

    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    tags: list[str] | None = None
    items: list[ItemTarefa] | None = None
    estimated_hours: float | None = None


class RespostaListaTarefas(RespostaApi[list[TarefaApi], MetaPaginacao]):
    """Listagem de tarefas (`ApiTasksResponse`)."""


class RespostaTarefa(RespostaApi[TarefaApi, None]):
    """Uma tarefa (`ApiTaskShowResponse`)."""


class ImagemProjetoApi(BaseModel):
    """Imagem da listagem do projeto (`ApiProjectImage`; 14 dos 15 campos listados)."""

    id: str
    status: str
    filename: str
    original_prompt: str
    negative_prompt: str | None
    model_version: str
    storage_url: str
    thumbnail_url: str
    seed: int | None
    generation_time_ms: int
    width: int
    height: int
    tags: list[str]
    created_at: str


class RespostaListaImagens(RespostaApi[list[ImagemProjetoApi], MetaPaginacao]):
    """Listagem de imagens do projeto (`ApiProjectImageListResponse`)."""


class StatusImagemPlataforma(BaseModel):
    """Estado de uma imagem (`PlatformImageStatus` **[FIELDS]**, 12 campos)."""

    id: str
    status: str
    original_prompt: str
    storage_url: str
    thumbnail_url: str
    error_message: str | None
    generation_time_ms: int
    model_version: str
    width: int
    height: int
    tags: list[str]
    created_at: str


class PedidoGerarImagemPlataforma(BaseModel):
    """Parâmetros de `POST /api/projects/{p}/images/generate` (*inferido*)."""

    prompt: str
    negative_prompt: str | None = None
    width: int | None = None
    height: int | None = None
    guidance_scale: float | None = None
    num_inference_steps: int | None = None
    seed: int | None = None
    tags: list[str] | None = None


class RespostaGeracaoPlataforma(BaseModel):
    """Resposta de geração bem-sucedida (`PlatformGenerateResponse`; campos parciais)."""

    error_message: str | None = None
    guidance_scale: float
    num_inference_steps: int


class RespostaCotaExcedida(BaseModel):
    """Resposta de cota estourada (`QuotaExceededResponse`; 6 dos 8 campos listados)."""

    quota_exceeded: bool
    images_used: int
    images_limit: int
    quota_type: str
    storage_used: int
    storage_limit: int


class FrontmatterModeloAgente(BaseModel):
    """Frontmatter de um modelo de agente, com os campos que o modelo embutido sempre traz."""

    name: str
    description: str
    tools: str
    model: ModeloClaude
    color: CorAgente
    memory: MemoriaAgente


class ModeloAgente(BaseModel):
    """Modelo de agente (template). O campo do nome é `title`, como no inventário embutido."""

    id: str
    category: CategoriaModeloAgente
    title: str
    description: str
    tags: list[str]
    frontmatter: FrontmatterModeloAgente
    systemPrompt: str


class RespostaModelosAgente(BaseModel):
    """Resposta de `GET /api/client/agent-templates` (`AgentTemplatesResponse`)."""

    templates: list[ModeloAgente]
