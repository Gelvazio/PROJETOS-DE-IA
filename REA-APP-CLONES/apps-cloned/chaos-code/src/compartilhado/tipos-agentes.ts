/**
 * Tipos dos agentes do Claude Code (`.claude/agents/*.md`) e dos modelos de agente, copiados dos
 * nomes do original (inventário CLONE.1.8 e módulos `agents::parser` e `agents::manager`).
 */

/** Categorias dos modelos de agente embutidos e da comunidade. */
export type CategoriaModeloAgente =
  | 'review'
  | 'testing'
  | 'docs'
  | 'refactor'
  | 'debug'
  | 'workflow'
  | 'research'
  | 'integration'
  | 'security';

/** Cores aceitas no campo `color` do frontmatter. */
export type CorAgente =
  | 'purple'
  | 'green'
  | 'blue'
  | 'cyan'
  | 'orange'
  | 'pink'
  | 'yellow'
  | 'red';

/**
 * Modelos do `model` do frontmatter: `sonnet` e `haiku` vistos nos embutidos; `opus` e
 * `inherit` são aceitos pelo Claude Code em agentes criados pelo usuário.
 */
export type ModeloAgente = 'sonnet' | 'haiku' | 'opus' | 'inherit';

/** Valor do campo `memory` observado nos modelos embutidos. */
export type MemoriaAgente = 'project';

/**
 * Frontmatter YAML de um agente. `name`, `description`, `tools`, `model`, `color` e `memory`
 * vêm dos modelos embutidos; os demais campos são os que o parser do original lê e grava.
 */
export interface FrontmatterAgente {
  name: string;
  description: string;
  /** Lista separada por vírgula, como no original (ex.: `Read, Grep, Glob`). */
  tools: string;
  disallowedTools?: string;
  model: ModeloAgente;
  color: CorAgente;
  permissionMode?: string;
  memory?: MemoriaAgente;
  maxTurns?: number;
  background?: boolean;
  effort?: string;
  isolation?: string;
  initialPrompt?: string;
}

/** Agente salvo em `.claude/agents/<nome>.md`: frontmatter mais o prompt de sistema. */
export interface Agente {
  frontmatter: FrontmatterAgente;
  systemPrompt: string;
}

/** Frontmatter de um modelo de agente, com os campos que o modelo embutido sempre traz. */
export interface FrontmatterModeloAgente {
  name: string;
  description: string;
  tools: string;
  model: ModeloAgente;
  color: CorAgente;
  memory: MemoriaAgente;
}

/**
 * Modelo de agente (template) embutido ou da comunidade. O `systemPrompt` pode trazer os
 * marcadores `{SLUG}` e `{project_name}`, trocados pelo app ao gravar o agente.
 */
export interface ModeloAgenteTemplate {
  id: string;
  category: CategoriaModeloAgente;
  title: string;
  description: string;
  tags: string[];
  frontmatter: FrontmatterModeloAgente;
  systemPrompt: string;
}
