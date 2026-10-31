/**
 * Lista das 23 ferramentas MCP do original, com nome, descrição, schema de entrada e anotações
 * (`docs/inventario/mcp-cli-wsl.md`, seções "As 23 ferramentas MCP" e "Schemas de entrada").
 * Só dados: a execução de cada ferramenta fica em outro módulo.
 */

/** Propriedade de um JSON Schema de entrada de ferramenta. */
export interface PropriedadeSchemaFerramenta {
  type: string;
  description?: string;
  enum?: readonly string[];
  items?: PropriedadeSchemaFerramenta;
  properties?: Readonly<Record<string, PropriedadeSchemaFerramenta>>;
  required?: readonly string[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
}

/** Schema de entrada de uma ferramenta: sempre um objeto. */
export interface EsquemaEntradaFerramenta {
  type: 'object';
  properties: Readonly<Record<string, PropriedadeSchemaFerramenta>>;
  required?: readonly string[];
}

/** Anotações MCP de uma ferramenta, na ordem do original. */
export interface AnotacoesFerramenta {
  readOnlyHint: boolean;
  destructiveHint: boolean;
  idempotentHint: boolean;
  openWorldHint: boolean;
}

/** Definição de uma ferramenta MCP: nome, descrição, schema e anotações. */
export interface DefinicaoFerramentaMcp {
  name: string;
  description: string;
  inputSchema: EsquemaEntradaFerramenta;
  annotations: AnotacoesFerramenta;
}

const ENUM_STATUS_WIKI = ['draft', 'pending_review', 'approved', 'rejected'] as const;
const ENUM_TIPO_ARTIGO = ['document', 'concept', 'task', 'code', 'note'] as const;
const ENUM_TIPO_ENTIDADE = [
  'person', 'organization', 'concept', 'technology', 'location', 'event', 'process', 'metric',
  'other',
] as const;
const ENUM_STATUS_TAREFA = ['backlog', 'todo', 'in_progress', 'review', 'done', 'closed'] as const;
const ENUM_PRIORIDADE = ['low', 'medium', 'high', 'urgent'] as const;
const ENUM_STATUS_IMAGEM = ['completed', 'pending', 'failed'] as const;
const ENUM_PROVEDOR_IMAGEM = ['platform', 'gemini'] as const;

/** Propriedade `items` de uma lista de checklist (`create_task` e `update_task`). */
const ITEM_CHECKLIST: PropriedadeSchemaFerramenta = {
  type: 'object',
  properties: {
    text: { type: 'string', description: 'Checklist item text.' },
    completed: {
      type: 'boolean',
      description: 'Whether the item is completed (default: false).',
      default: false,
    },
  },
  required: ['text'],
};

const ANOTACOES_LEITURA_PLATAFORMA: AnotacoesFerramenta = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};

const ANOTACOES_LEITURA_LOCAL: AnotacoesFerramenta = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const ANOTACOES_CRIACAO: AnotacoesFerramenta = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
};

const ANOTACOES_ATUALIZACAO: AnotacoesFerramenta = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};

const ANOTACOES_EXCLUSAO_LIXEIRA: AnotacoesFerramenta = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: true,
};

const ANOTACOES_EXCLUSAO_IDEMPOTENTE: AnotacoesFerramenta = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: true,
  openWorldHint: true,
};

/** Lista de ferramentas MCP servidas pelo clone, na mesma ordem de `tools/list`. */
export const FERRAMENTAS_MCP: readonly DefinicaoFerramentaMcp[] = [
  {
    name: 'search_knowledge',
    description: 'Semantic search across project documentation, wiki articles, and knowledge base',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query text. Be specific and descriptive for better results. ' +
            'Supports natural language questions.',
        },
        top_k: {
          type: 'integer',
          description: 'Maximum number of results to return (1-100, default: 5). …',
          default: 5,
        },
      },
      required: ['query'],
    },
    annotations: ANOTACOES_LEITURA_PLATAFORMA,
  },
  {
    name: 'list_entities',
    description: 'List extracted entities (…) from knowledge graph',
    inputSchema: {
      type: 'object',
      properties: {
        entity_type: {
          type: 'string',
          description: 'Filter by entity type.',
          enum: ENUM_TIPO_ENTIDADE,
        },
        name: {
          type: 'string',
          description: 'Filter by name (partial match, case-insensitive).',
        },
      },
    },
    annotations: ANOTACOES_LEITURA_LOCAL,
  },
  {
    name: 'get_relations',
    description: 'Traverse knowledge graph to find relationships between entities',
    inputSchema: {
      type: 'object',
      properties: {
        entity_name: {
          type: 'string',
          description: 'Name of the entity to find relations for.',
        },
        depth: {
          type: 'integer',
          description: 'Traversal depth (1-5, default: 2). …',
          default: 2,
        },
      },
      required: ['entity_name'],
    },
    annotations: ANOTACOES_LEITURA_LOCAL,
  },
  {
    name: 'get_project_info',
    description: 'Get project overview and knowledge graph statistics',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    annotations: ANOTACOES_LEITURA_LOCAL,
  },
  {
    name: 'list_wiki_articles',
    description: 'List wiki articles from project documentation with status filter',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by review status.',
          enum: ENUM_STATUS_WIKI,
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of articles (default: 20).',
          default: 20,
        },
        offset: {
          type: 'integer',
          description: 'Skip N articles for pagination.',
          default: 0,
        },
      },
    },
    annotations: ANOTACOES_LEITURA_PLATAFORMA,
  },
  {
    name: 'get_wiki_article',
    description: 'Fetch full content of a wiki article by ID',
    inputSchema: {
      type: 'object',
      properties: {
        article_id: {
          type: 'string',
          description: 'UUID of the wiki article to fetch.',
        },
      },
      required: ['article_id'],
    },
    annotations: ANOTACOES_LEITURA_PLATAFORMA,
  },
  {
    name: 'sync_wiki_articles',
    description: 'Fetch wiki articles updated since a given date',
    inputSchema: {
      type: 'object',
      properties: {
        since: {
          type: 'string',
          description: 'ISO 8601 datetime to fetch updates from ' +
            '(e.g., \'2025-01-01T00:00:00Z\'). If omitted, returns all articles.',
        },
      },
    },
    annotations: ANOTACOES_LEITURA_PLATAFORMA,
  },
  {
    name: 'create_wiki_article',
    description: 'Create a new wiki article with Markdown content and tags',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Article title.' },
        content: { type: 'string', description: 'Article content in Markdown format.' },
        node_type: {
          type: 'string',
          description: 'Article type (default: document).',
          enum: ENUM_TIPO_ARTIGO,
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorization (e.g., [\'architecture\', \'api\']).',
        },
        submit_for_review: {
          type: 'boolean',
          description: 'If true, submits for review. If false, saves as draft (default: true).',
        },
      },
      required: ['title', 'content'],
    },
    annotations: ANOTACOES_CRIACAO,
  },
  {
    name: 'update_wiki_article',
    description: 'Update an existing wiki article content, title, or tags',
    inputSchema: {
      type: 'object',
      properties: {
        article_id: { type: 'string', description: 'UUID of the article to update.' },
        title: { type: 'string', description: 'New title (optional).' },
        content: { type: 'string', description: 'New content in Markdown (optional).' },
        node_type: {
          type: 'string',
          description: 'New article type (optional).',
          enum: ENUM_TIPO_ARTIGO,
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'New tags (optional).',
        },
        submit_for_review: {
          type: 'boolean',
          description: 'If true, submits for review after update (optional).',
        },
      },
      required: ['article_id'],
    },
    annotations: ANOTACOES_ATUALIZACAO,
  },
  {
    name: 'delete_wiki_article',
    description: 'Soft-delete a wiki article to trash (or force-delete …)',
    inputSchema: {
      type: 'object',
      properties: {
        article_id: { type: 'string', description: 'UUID of the article to delete.' },
        force: {
          type: 'boolean',
          description: 'If true, permanently deletes the article (only valid on already-trashed ' +
            'articles). Default: false (soft-delete to trash).',
          default: false,
        },
      },
      required: ['article_id'],
    },
    annotations: ANOTACOES_EXCLUSAO_LIXEIRA,
  },
  {
    name: 'restore_wiki_article',
    description: 'Restore a deleted wiki article from trash',
    inputSchema: {
      type: 'object',
      properties: {
        article_id: { type: 'string', description: 'UUID of the trashed article to restore.' },
      },
      required: ['article_id'],
    },
    annotations: ANOTACOES_ATUALIZACAO,
  },
  {
    name: 'list_trashed_wiki_articles',
    description: 'List wiki articles currently in trash with retention countdown (7 days)',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
          description: 'Maximum articles to return (1-100, default: 50).',
          default: 50,
          minimum: 1,
          maximum: 100,
        },
        offset: {
          type: 'integer',
          description: 'Skip N articles for pagination (default: 0).',
          default: 0,
          minimum: 0,
        },
      },
    },
    annotations: ANOTACOES_LEITURA_PLATAFORMA,
  },
  {
    name: 'list_tasks',
    description: 'List Kanban tasks filtered by status, priority, or tags',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by task status.',
          enum: ENUM_STATUS_TAREFA,
        },
        priority: {
          type: 'string',
          description: 'Filter by priority level.',
          enum: ENUM_PRIORIDADE,
        },
        tags: {
          type: 'string',
          description: 'Filter by tag name (e.g., \'backend\', \'bug\').',
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of tasks (default: 20).',
          default: 20,
        },
        offset: {
          type: 'integer',
          description: 'Skip N tasks for pagination.',
          default: 0,
        },
      },
    },
    annotations: ANOTACOES_LEITURA_PLATAFORMA,
  },
  {
    name: 'get_task',
    description: 'Fetch full details of a Kanban task by ID',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'UUID of the task to fetch.' },
      },
      required: ['task_id'],
    },
    annotations: ANOTACOES_LEITURA_PLATAFORMA,
  },
  {
    name: 'create_task',
    description: 'Create a new Kanban task with checklist and estimated hours',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title (max 200 characters).' },
        description: { type: 'string', description: 'Detailed task description.' },
        items: {
          type: 'array',
          description: 'Checklist items for the task.',
          items: ITEM_CHECKLIST,
        },
        estimated_hours: {
          type: 'number',
          description: 'Estimated hours to complete the task.',
        },
        status: {
          type: 'string',
          description: 'Initial status (default: backlog).',
          enum: ENUM_STATUS_TAREFA,
        },
        priority: {
          type: 'string',
          description: 'Priority level (default: medium).',
          enum: ENUM_PRIORIDADE,
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorization (e.g., [\'backend\', \'bug\']).',
        },
      },
      required: ['title', 'description', 'items', 'estimated_hours'],
    },
    annotations: ANOTACOES_CRIACAO,
  },
  {
    name: 'update_task',
    description: 'Update a Kanban task status, priority, or details',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'UUID of the task to update.' },
        title: { type: 'string', description: 'New title (optional).' },
        description: { type: 'string', description: 'New description (optional).' },
        status: {
          type: 'string',
          description: 'New status (optional). Must follow allowed transitions.',
          enum: ENUM_STATUS_TAREFA,
        },
        priority: {
          type: 'string',
          description: 'New priority (optional).',
          enum: ENUM_PRIORIDADE,
        },
        items: {
          type: 'array',
          description: 'Updated checklist (optional).',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              completed: { type: 'boolean' },
            },
            required: ['text'],
          },
        },
        estimated_hours: {
          type: 'number',
          description: 'New estimated hours (optional).',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'New tags (optional).',
        },
      },
      required: ['task_id'],
    },
    annotations: ANOTACOES_ATUALIZACAO,
  },
  {
    name: 'delete_task',
    description: 'Soft-delete a Kanban task to trash (7-day retention)',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'UUID of the task to delete.' },
      },
      required: ['task_id'],
    },
    annotations: ANOTACOES_EXCLUSAO_IDEMPOTENTE,
  },
  {
    name: 'restore_task',
    description: 'Restore a deleted Kanban task from trash',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'UUID of the task to restore from trash.' },
      },
      required: ['task_id'],
    },
    annotations: ANOTACOES_ATUALIZACAO,
  },
  {
    name: 'generate_image',
    description: 'Generate an AI image from text prompt (blocking, up to 3min)',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Descriptive text for the image to generate. ' +
            'Be detailed for better results.',
        },
        negative_prompt: {
          type: 'string',
          description: 'What to exclude from the image (platform provider only).',
        },
        width: {
          type: 'integer',
          description: 'Image width in pixels (256-2048, default: 1024).',
        },
        height: {
          type: 'integer',
          description: 'Image height in pixels (256-2048, default: 1024).',
        },
        guidance_scale: {
          type: 'number',
          description: 'Guidance scale (1-20, default: 3.5, platform only).',
        },
        num_inference_steps: {
          type: 'integer',
          description: 'Inference steps (1-100, default: 28, platform only).',
        },
        seed: { type: 'integer', description: 'Seed for reproducibility.' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorization.',
        },
        model: {
          type: 'string',
          enum: ENUM_PROVEDOR_IMAGEM,
          default: 'platform',
          description: 'Provider: platform (default, auto-fallback to gemini on quota exceeded) ' +
            'or gemini (direct, uses client API key).',
        },
      },
      required: ['prompt'],
    },
    annotations: ANOTACOES_CRIACAO,
  },
  {
    name: 'search_images',
    description: 'Search project images by prompt text, tags, and status',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search by text in the original prompt.' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by tags.',
        },
        status: {
          type: 'string',
          description: 'Filter by generation status.',
          enum: ENUM_STATUS_IMAGEM,
        },
        limit: {
          type: 'integer',
          description: 'Maximum results (default: 20).',
          default: 20,
        },
        offset: {
          type: 'integer',
          description: 'Skip N results for pagination.',
          default: 0,
        },
      },
    },
    annotations: ANOTACOES_LEITURA_PLATAFORMA,
  },
  {
    name: 'get_image_status',
    description: 'Get detailed status and metadata of a generated image',
    inputSchema: {
      type: 'object',
      properties: {
        image_id: { type: 'string', description: 'UUID of the image to check.' },
      },
      required: ['image_id'],
    },
    annotations: ANOTACOES_LEITURA_PLATAFORMA,
  },
  {
    name: 'list_project_images',
    description: 'List all generated images in the project',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
          description: 'Maximum images (default: 50).',
          default: 50,
        },
        offset: {
          type: 'integer',
          description: 'Skip N images for pagination.',
          default: 0,
        },
      },
    },
    annotations: ANOTACOES_LEITURA_PLATAFORMA,
  },
  {
    name: 'delete_project_image',
    description: 'Permanently delete a generated image from the project',
    inputSchema: {
      type: 'object',
      properties: {
        image_id: { type: 'string', description: 'UUID of the image to delete.' },
      },
      required: ['image_id'],
    },
    annotations: ANOTACOES_EXCLUSAO_IDEMPOTENTE,
  },
];
