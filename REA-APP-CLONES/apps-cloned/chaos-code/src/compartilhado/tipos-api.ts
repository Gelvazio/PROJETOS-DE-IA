/**
 * Pedidos e respostas da API da plataforma (`https://chaoscode.ai`), com os nomes de campo do
 * original (inventário CLONE.1.3, `docs/inventario/api.md`). Campos marcados *(inferido)* ainda
 * não foram confirmados no Ghidra. Os tipos de agente e de imagem vêm de seus próprios arquivos.
 */

import type { ModeloAgenteTemplate, CategoriaModeloAgente } from './tipos-agentes';
import type {
  ParametrosGerarImagem,
  RespostaCotaExcedida,
  RespostaGeracaoPlataforma,
} from './tipos-imagem';

/** Envelope padrão das respostas da API: `{ success, data, meta }` (*inferido*). */
export interface RespostaApi<T, M = unknown> {
  success: boolean;
  data: T;
  meta?: M;
}

/**
 * Paginação das listas (`TasksMeta` **[FIELDS]**; as outras listas seguem
 * o mesmo formato *(inferido)*).
 */
export interface MetaPaginacao {
  total: number;
  limit: number;
  offset: number;
}

/** Parâmetros de paginação da query string. */
export interface FiltrosPaginacao {
  limit?: number;
  offset?: number;
}

/* ----------------------------- OAuth ----------------------------- */

/** Pedido de registro do cliente em `/api/oauth/register` *(campos inferidos)*. */
export interface PedidoRegistroCliente {
  client_name: string;
  redirect_uris: string[];
  grant_types: string[];
  token_endpoint_auth_method: string;
  application_type: string;
  /** RFC 7591; o servidor local (`server/`) aceita e o original não comprova. */
  response_types?: string[];
}

/** Dados devolvidos no registro do cliente *(1 ou 2 campos, inferido)*. */
export interface DadosRegistroCliente {
  client_id: string;
  client_secret?: string;
}

/** Resposta do registro: o cliente vem dentro de `data`. */
export interface RespostaRegistroCliente {
  data: DadosRegistroCliente;
}

/** Tipos de concessão aceitos em `/api/oauth/token`. */
export type TipoConcessaoOAuth = 'authorization_code' | 'refresh_token';

/** Pedido de token em `/api/oauth/token` *(campos inferidos)*. */
export interface PedidoToken {
  grant_type: TipoConcessaoOAuth;
  code?: string;
  redirect_uri?: string;
  code_verifier?: string;
  refresh_token?: string;
  client_id?: string;
}

/** Resposta de token; os nomes dos campos são *inferidos*. */
export interface RespostaToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

/** Pedido de revogação em `/api/oauth/revoke` *(inferido)*. */
export interface PedidoRevogacaoToken {
  token: string;
  token_type_hint?: string;
  client_id?: string;
}

/* ----------------------------- Projetos ----------------------------- */

/** Projeto devolvido por `/api/oauth/user/projects` (`ApiProject`, campos *inferidos*). */
export interface ProjetoApi {
  id: string;
  name: string;
  description: string;
  role: string;
  project_role_slug: string;
  project_role_name: string;
  permissions: string[];
}

/** Lista de projetos (`ApiProjectsResponse`; há um 2º campo não identificado *(inferido)*). */
export interface RespostaProjetos {
  projects: ProjetoApi[];
}

/* ----------------------------- Ferramentas MCP ----------------------------- */

/** Ferramenta MCP do projeto (`McpToolInfo`, *inferido*). */
export interface FerramentaMcpInfo {
  name: string;
  description: string;
  category: string;
}

/** Metadados da lista de ferramentas; os campos não foram listados. */
export type MetaListaFerramentasMcp = Record<string, unknown>;

/** Resposta de `GET /api/projects/{p}/mcp/tools`. */
export type RespostaListaFerramentasMcp = RespostaApi<
  FerramentaMcpInfo[],
  MetaListaFerramentasMcp
>;

/** Pedido de `PUT /api/projects/{p}/mcp/tools` (`McpToolConfigUpdate`, *inferido*). */
export interface AtualizacaoConfigFerramentaMcp {
  tool_name: string;
  enabled: boolean;
  min_role: string;
}

/** Resposta do PUT de configuração (campos não confirmados). */
export interface RespostaAtualizacaoConfigFerramentaMcp {
  success: boolean;
  data?: unknown;
}

/** Configuração de uma ferramenta MCP (`McpToolConfig`, *inferido*). */
export interface ConfigFerramentaMcp {
  tool_name: string;
  name: string;
  description: string;
  enabled: boolean;
  min_role: string;
}

/** Resposta de `GET /api/projects/{p}/mcp/tools/all` *(inferido)*. */
export interface RespostaConfigFerramentasMcp {
  success: boolean;
  data: ConfigFerramentaMcp[];
}

/* ----------------------------- Wiki ----------------------------- */

/** Artigo da wiki (`WikiArticle`, 7 campos *inferidos*). */
export interface ArtigoWiki {
  id: string;
  title: string;
  content: string;
  node_type: string;
  category: string;
  status: string;
  version: number;
}

/** Artigo na lixeira (`TrashedWikiArticle`: os campos do artigo mais dois *inferidos*). */
export interface ArtigoWikiLixeira extends ArtigoWiki {
  deleted_at: string;
  author: string;
}

/** Lista de artigos (`WikiArticleList`, *inferido*). */
export interface ListaArtigosWiki {
  articles: ArtigoWiki[];
  total: number;
  has_more: boolean;
}

/** Resposta de `GET /api/projects/{p}/wiki/articles` (metadados *inferidos*). */
export type RespostaArtigosWiki = RespostaApi<ListaArtigosWiki, MetaPaginacao>;

/** Resposta de `GET /api/projects/{p}/wiki/articles/{id}`. */
export type RespostaArtigoWiki = RespostaApi<ArtigoWiki>;

/** Resposta da lixeira de artigos (`TrashedWikiArticlesResponse`, *inferido*). */
export type RespostaArtigosLixeiraWiki = RespostaApi<ArtigoWikiLixeira[], MetaPaginacao>;

/** Pedido de criação de artigo (*inferido*: argumentos lidos no servidor MCP). */
export interface PedidoCriarArtigoWiki {
  title: string;
  content: string;
  node_type?: string;
  status?: string;
  tags?: string[];
  submit_for_review?: boolean;
}

/** Pedido de alteração de artigo: os mesmos campos, todos opcionais (*inferido*). */
export type PedidoAtualizarArtigoWiki = Partial<PedidoCriarArtigoWiki>;

/** Filtros de `GET /api/projects/{p}/wiki/articles`. */
export interface FiltrosArtigosWiki extends FiltrosPaginacao {
  status?: string;
}

/** Filtros de `GET /api/projects/{p}/wiki/sync/articles` (*inferido*). */
export interface FiltrosSincronizacaoWiki extends FiltrosPaginacao {
  since?: string;
}

/** Resposta da sincronização de artigos (*inferido*: `deleted_article_ids`). */
export interface RespostaSincronizacaoWiki {
  articles: ArtigoWiki[];
  deleted_article_ids: string[];
}

/** Confirmação enviada em `POST .../wiki/sync/ack` (corpo *inferido*). */
export interface PedidoConfirmacaoSincronizacaoWiki {
  itens: { id: string; version: number }[];
}

/* ----------------------------- Tarefas ----------------------------- */

/** Item de checklist de uma tarefa (`TaskItem`, 2 campos **[FIELDS]**). */
export interface ItemTarefa {
  text: string;
  completed: boolean;
}

/** Tarefa da plataforma (`ApiTask`, 14 campos; tipos *inferidos*). */
export interface TarefaApi {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  items: ItemTarefa[];
  estimated_hours: number;
  tags: string[];
  assignee_id: string | null;
  sprint_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Paginação de tarefas (`TasksMeta` **[FIELDS]**). */
export type MetaTarefas = MetaPaginacao;

/** Filtros de `GET /api/projects/{p}/tasks` (query string). */
export interface FiltrosListaTarefas extends FiltrosPaginacao {
  status?: string;
  priority?: string;
  tags?: string[];
}

/** Resposta de listagem de tarefas (`ApiTasksResponse`). */
export type RespostaListaTarefas = RespostaApi<TarefaApi[], MetaTarefas>;

/** Resposta de uma tarefa (`ApiTaskShowResponse`). */
export type RespostaTarefa = RespostaApi<TarefaApi>;

/** Pedido de criação de tarefa (*inferido*). */
export interface PedidoCriarTarefa {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  tags?: string[];
  items?: ItemTarefa[];
  estimated_hours?: number;
}

/** Pedido de alteração de tarefa: os mesmos campos, todos opcionais (*inferido*). */
export type PedidoAtualizarTarefa = Partial<PedidoCriarTarefa>;

/* ----------------------------- Imagens ----------------------------- */

/** Imagem da listagem do projeto (`ApiProjectImage`; 14 dos 15 campos listados *inferido*). */
export interface ImagemProjetoApi {
  id: string;
  status: string;
  filename: string;
  original_prompt: string;
  negative_prompt: string | null;
  model_version: string;
  storage_url: string;
  thumbnail_url: string;
  seed: number | null;
  generation_time_ms: number;
  width: number;
  height: number;
  tags: string[];
  created_at: string;
}

/** Resposta de listagem de imagens (`ApiProjectImageListResponse`, metadados *inferidos*). */
export type RespostaListaImagens = RespostaApi<ImagemProjetoApi[], MetaPaginacao>;

/** Estado de uma imagem (`PlatformImageStatus` **[FIELDS]**, 12 campos). */
export interface StatusImagemPlataforma {
  id: string;
  status: string;
  original_prompt: string;
  storage_url: string;
  thumbnail_url: string;
  error_message: string | null;
  generation_time_ms: number;
  model_version: string;
  width: number;
  height: number;
  tags: string[];
  created_at: string;
}

/** Pedido de geração na plataforma: os parâmetros, sem `provider` (que é do cliente). */
export type PedidoGerarImagemPlataforma = Omit<ParametrosGerarImagem, 'provider'>;

/** Resposta de geração: sucesso (`PlatformGenerateResponse`) ou cota estourada. */
export type RespostaGerarImagemPlataforma = RespostaGeracaoPlataforma | RespostaCotaExcedida;

/* ----------------------------- Modelos de agente ----------------------------- */

/** Filtros de `GET /api/client/agent-templates`. */
export interface FiltrosModelosAgente {
  category?: CategoriaModeloAgente;
}

/**
 * Resposta de `GET /api/client/agent-templates` (`AgentTemplatesResponse`). Os modelos usam o
 * tipo de `tipos-agentes.ts`; o original chama o nome de `name`, mas o inventário embutido usa
 * `title` (divergência em aberto).
 */
export interface RespostaModelosAgente {
  templates: ModeloAgenteTemplate[];
}
