/**
 * API de imagens da plataforma (docs/inventario/api.md, "Imagens"): lista, consulta, apaga e
 * pede a geração de imagens de um projeto, sempre pelo cliente HTTP autenticado.
 */
import type {
  PedidoGerarImagemPlataforma,
  RespostaGerarImagemPlataforma,
  RespostaListaImagens,
  StatusImagemPlataforma,
} from '../../compartilhado/tipos-api';
import type { ClienteHttp } from './cliente-http';

const LIMITE_PADRAO_LISTAGEM = 20;
const DESLOCAMENTO_PADRAO_LISTAGEM = 0;
const CHAVE_TAGS = 'tags[]';

/** Filtros da listagem de imagens de um projeto. */
export interface FiltrosListaImagens {
  /** Quantidade por página (padrão: 20). */
  limit?: number;
  /** Posição inicial (padrão: 0). */
  offset?: number;
  /** Filtra pelo estado da imagem. */
  status?: string;
  /** Busca por texto no prompt. */
  query?: string;
  /** Filtra por etiquetas. */
  tags?: string[];
}

/** Operações de imagens de um projeto. */
export interface ApiImagens {
  /** Lista as imagens do projeto, com filtros e paginação. */
  listar(idProjeto: string, filtros?: FiltrosListaImagens): Promise<RespostaListaImagens>;
  /** Consulta o estado de uma imagem. */
  obterStatus(idProjeto: string, idImagem: string): Promise<StatusImagemPlataforma>;
  /** Apaga uma imagem. */
  apagar(idProjeto: string, idImagem: string): Promise<void>;
  /** Pede a geração de uma imagem (sucesso ou cota excedida). */
  gerar(
    idProjeto: string,
    pedido: PedidoGerarImagemPlataforma,
  ): Promise<RespostaGerarImagemPlataforma>;
}

/**
 * Monta a query da listagem (limit, offset e filtros opcionais).
 * @param filtros - Filtros informados.
 * @returns Texto da query, sem o `?`.
 */
function montarQuery(filtros: FiltrosListaImagens): string {
  const parametros = new URLSearchParams();
  parametros.set('limit', String(filtros.limit ?? LIMITE_PADRAO_LISTAGEM));
  parametros.set('offset', String(filtros.offset ?? DESLOCAMENTO_PADRAO_LISTAGEM));
  if (filtros.status) parametros.set('status', filtros.status);
  if (filtros.query) parametros.set('query', filtros.query);
  for (const etiqueta of filtros.tags ?? []) parametros.append(CHAVE_TAGS, etiqueta);
  return parametros.toString();
}

/**
 * Monta o caminho base das imagens de um projeto.
 * @param idProjeto - Identificador do projeto.
 * @returns Caminho `/api/projects/{p}/images`.
 */
function caminhoImagens(idProjeto: string): string {
  return `/api/projects/${encodeURIComponent(idProjeto)}/images`;
}

/**
 * Cria a API de imagens.
 * @param cliente - Cliente HTTP autenticado.
 * @returns Operações de imagens.
 */
export function criarApiImagens(cliente: ClienteHttp): ApiImagens {
  return {
    listar(idProjeto, filtros = {}) {
      const caminho = `${caminhoImagens(idProjeto)}?${montarQuery(filtros)}`;
      return cliente.requisitar<RespostaListaImagens>({ metodo: 'GET', caminho });
    },
    obterStatus(idProjeto, idImagem) {
      const caminho = `${caminhoImagens(idProjeto)}/${encodeURIComponent(idImagem)}`;
      return cliente.requisitar<StatusImagemPlataforma>({ metodo: 'GET', caminho });
    },
    async apagar(idProjeto, idImagem) {
      const caminho = `${caminhoImagens(idProjeto)}/${encodeURIComponent(idImagem)}`;
      await cliente.requisitar<unknown>({ metodo: 'DELETE', caminho });
    },
    gerar(idProjeto, pedido) {
      const caminho = `${caminhoImagens(idProjeto)}/generate`;
      return cliente.requisitar<RespostaGerarImagemPlataforma>({
        metodo: 'POST',
        caminho,
        corpo: pedido,
      });
    },
  };
}
