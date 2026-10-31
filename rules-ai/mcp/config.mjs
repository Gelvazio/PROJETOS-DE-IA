/**
 * Configuração do servidor MCP do quadro (MCP-QUADRO).
 *
 * Só constantes e o tipo de erro do módulo. Nada aqui lê disco, rede ou segredo.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Raiz padrão onde ficam os projetos com quadro (allowlist de raiz). */
const RAIZ_PADRAO_WINDOWS = 'C:\\fontes';

/** Variável de ambiente opcional para apontar outra raiz (Linux, nuvem). */
export const VARIAVEL_RAIZ = 'MCP_QUADRO_RAIZ';

/** Raiz efetiva dos projetos. */
export const RAIZ_FONTES = process.env[VARIAVEL_RAIZ] ?? RAIZ_PADRAO_WINDOWS;

/** Prefixos de pasta que nunca são listadas nem lidas (C20, C23). */
export const PREFIXOS_IGNORADOS = ['DEMAIS-PROJETOS-'];

/** Pastas ocultas (começam com este caractere) também são ignoradas. */
export const PREFIXO_PASTA_OCULTA = '.';

/** Pasta do quadro dentro de cada projeto. */
export const PASTA_TASKS = 'tasks';

/** Arquivo do quadro aberto, relativo ao projeto. */
export const ARQUIVO_STATUS = 'tasks/STATUS.md';

/** Arquivo das tarefas concluídas, relativo ao projeto. */
export const ARQUIVO_CONCLUIDAS = 'tasks/task_complete.md';

/** Pasta das etapas, relativa ao projeto. */
export const PASTA_ETAPAS = 'tasks/etapas';

/** Extensão aceita para as etapas. */
export const EXTENSAO_ETAPA = '.md';

/** Limite de tamanho de arquivo lido (o STATUS.md do aulasenai passa de 500 KB). */
export const TAMANHO_MAXIMO_ARQUIVO = 20 * 1024 * 1024;

/** Tentativas máximas de reserva quando o push é recusado (R1.3). */
export const LIMITE_TENTATIVAS_PUSH = 3;

/** Pasta e arquivo do log local, fora do Git (R3.1). */
export const CAMINHO_LOG = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'saidas',
  'acoes.jsonl',
);

/** Emojis de status do quadro: a legenda e o ❌ (Cancelada), que já existe nos quadros reais. */
export const EMOJIS_STATUS = ['⬜', '🔄', '✅', '⛔', '👀', '❌'];

/** Emoji de subtarefa livre e de subtarefa em execução. */
export const EMOJI_PENDENTE = '⬜';
export const EMOJI_EM_EXECUCAO = '🔄';
export const EMOJI_CONCLUIDO = '✅';

/** Valores que significam "ninguém reservou". */
export const VALORES_LIVRES = ['', '—', '-', 'livre'];

/** Texto que marca tarefa-mãe (não reservável) e trava especial. */
export const TEXTO_NAO_RESERVAVEL = 'não reservável';
export const TEXTO_TRAVA_ESPECIAL = 'trava especial';

/** Valores de "Depende de" que significam nenhuma dependência. */
export const VALORES_SEM_DEPENDENCIA = ['', 'nenhuma', 'nenhum', '—', '-'];

/** Colunas assumidas quando o arquivo de concluídas não tem cabeçalho. */
export const COLUNAS_PADRAO = [
  'Tarefa',
  'Título',
  'Prioridade',
  'Modelo',
  'Depende de',
  'Status',
  'Em uso por',
  'Etapa',
];

/** Valor colocado numa coluna que o quadro de origem não tem. */
export const VALOR_COLUNA_VAZIA = '—';

/** Códigos de erro estáveis, para o servidor devolver mensagens curtas. */
export const CODIGOS_ERRO = {
  PROJETO_INVALIDO: 'projeto_invalido',
  PROJETO_NAO_ENCONTRADO: 'projeto_nao_encontrado',
  CAMINHO_RECUSADO: 'caminho_recusado',
  QUADRO_INVALIDO: 'quadro_invalido',
  TAREFA_NAO_ENCONTRADA: 'tarefa_nao_encontrada',
  TAREFA_DUPLICADA: 'tarefa_duplicada',
  COLUNA_AUSENTE: 'coluna_ausente',
  ETAPA_SEM_SECAO: 'etapa_sem_secao',
  ARQUIVO_GRANDE: 'arquivo_grande',
};

/** Erro do módulo do quadro, com código estável e mensagem curta. */
export class ErroQuadro extends Error {
  /**
   * @param {string} codigo - Um valor de CODIGOS_ERRO.
   * @param {string} mensagem - Mensagem curta, sem segredo e sem conteúdo de tarefa.
   */
  constructor(codigo, mensagem) {
    super(mensagem);
    this.name = 'ErroQuadro';
    this.codigo = codigo;
  }
}
