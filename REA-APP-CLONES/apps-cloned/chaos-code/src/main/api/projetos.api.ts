/**
 * API de projetos (docs/inventario/api.md): lista de projetos do usuário, ferramentas MCP e wiki
 * do projeto. Usa o cliente HTTP base, que põe o token e renova no 401.
 */
import type {
  AtualizacaoConfigFerramentaMcp,
  FiltrosArtigosWiki,
  FiltrosSincronizacaoWiki,
  PedidoAtualizarArtigoWiki,
  PedidoCriarArtigoWiki,
  RespostaArtigosLixeiraWiki,
  RespostaArtigosWiki,
  RespostaArtigoWiki,
  RespostaAtualizacaoConfigFerramentaMcp,
  RespostaConfigFerramentasMcp,
  RespostaListaFerramentasMcp,
  RespostaProjetos,
  FiltrosPaginacao,
} from '../../compartilhado/tipos-api';
import type { ClienteHttp } from './cliente-http';

const CAMINHO_PROJETOS_USUARIO = '/api/oauth/user/projects';
const CAMINHO_BASE_PROJETOS = '/api/projects';

/** Valores aceitos na query string. */
type ValorQuery = string | number | undefined;

/** Contrato da API de projetos oferecido ao restante do processo principal. */
export interface ProjetosApi {
  listarProjetos(): Promise<RespostaProjetos>;
  listarFerramentasMcp(idProjeto: string): Promise<RespostaListaFerramentasMcp>;
  listarConfigFerramentasMcp(idProjeto: string): Promise<RespostaConfigFerramentasMcp>;
  atualizarConfigFerramentaMcp(
    idProjeto: string,
    config: AtualizacaoConfigFerramentaMcp,
  ): Promise<RespostaAtualizacaoConfigFerramentaMcp>;
  listarArtigosWiki(
    idProjeto: string,
    filtros?: FiltrosArtigosWiki,
  ): Promise<RespostaArtigosWiki>;
  obterArtigoWiki(idProjeto: string, idArtigo: string): Promise<RespostaArtigoWiki>;
  criarArtigoWiki(idProjeto: string, artigo: PedidoCriarArtigoWiki): Promise<RespostaArtigoWiki>;
  atualizarArtigoWiki(
    idProjeto: string,
    idArtigo: string,
    alteracoes: PedidoAtualizarArtigoWiki,
  ): Promise<RespostaArtigoWiki>;
  apagarArtigoWiki(idProjeto: string, idArtigo: string, definitivo?: boolean): Promise<unknown>;
  restaurarArtigoWiki(idProjeto: string, idArtigo: string): Promise<RespostaArtigoWiki>;
  listarLixeiraWiki(
    idProjeto: string,
    filtros?: FiltrosPaginacao,
  ): Promise<RespostaArtigosLixeiraWiki>;
  listarSincronizacaoWiki(
    idProjeto: string,
    filtros?: FiltrosSincronizacaoWiki,
  ): Promise<unknown>;
}

/**
 * Monta a query string ignorando valores indefinidos.
 * @param parametros - Pares nome/valor.
 * @returns Texto começando em `?`, ou vazio quando não há parâmetros.
 */
function montarQuery(parametros: Record<string, ValorQuery>): string {
  const consulta = new URLSearchParams();
  for (const [nome, valor] of Object.entries(parametros)) {
    if (valor !== undefined) consulta.set(nome, String(valor));
  }
  const texto = consulta.toString();
  return texto ? `?${texto}` : '';
}

/**
 * Monta o caminho base de um projeto, com o id codificado.
 * @param idProjeto - Id do projeto.
 * @returns Ex.: `/api/projects/abc`.
 */
function caminhoProjeto(idProjeto: string): string {
  return `${CAMINHO_BASE_PROJETOS}/${encodeURIComponent(idProjeto)}`;
}

/**
 * Monta o caminho de um artigo da wiki.
 * @param idProjeto - Id do projeto.
 * @param idArtigo - Id do artigo.
 * @returns Ex.: `/api/projects/abc/wiki/articles/xyz`.
 */
function caminhoArtigo(idProjeto: string, idArtigo: string): string {
  return `${caminhoProjeto(idProjeto)}/wiki/articles/${encodeURIComponent(idArtigo)}`;
}

/**
 * Cria a API de projetos sobre o cliente HTTP.
 * @param cliente - Cliente HTTP autenticado.
 * @returns Operações de projetos, ferramentas MCP e wiki.
 */
export function criarProjetosApi(cliente: ClienteHttp): ProjetosApi {
  return {
    listarProjetos: () =>
      cliente.requisitar({ metodo: 'GET', caminho: CAMINHO_PROJETOS_USUARIO }),

    listarFerramentasMcp: (idProjeto) =>
      cliente.requisitar({ metodo: 'GET', caminho: `${caminhoProjeto(idProjeto)}/mcp/tools` }),

    listarConfigFerramentasMcp: (idProjeto) =>
      cliente.requisitar({
        metodo: 'GET',
        caminho: `${caminhoProjeto(idProjeto)}/mcp/tools/all`,
      }),

    atualizarConfigFerramentaMcp: (idProjeto, config) =>
      cliente.requisitar({
        metodo: 'PUT',
        caminho: `${caminhoProjeto(idProjeto)}/mcp/tools`,
        corpo: config,
      }),

    listarArtigosWiki: (idProjeto, filtros = {}) =>
      cliente.requisitar({
        metodo: 'GET',
        caminho: `${caminhoProjeto(idProjeto)}/wiki/articles${montarQuery({ ...filtros })}`,
      }),

    obterArtigoWiki: (idProjeto, idArtigo) =>
      cliente.requisitar({ metodo: 'GET', caminho: caminhoArtigo(idProjeto, idArtigo) }),

    criarArtigoWiki: (idProjeto, artigo) =>
      cliente.requisitar({
        metodo: 'POST',
        caminho: `${caminhoProjeto(idProjeto)}/wiki/articles`,
        corpo: artigo,
      }),

    atualizarArtigoWiki: (idProjeto, idArtigo, alteracoes) =>
      cliente.requisitar({
        metodo: 'PATCH',
        caminho: caminhoArtigo(idProjeto, idArtigo),
        corpo: alteracoes,
      }),

    apagarArtigoWiki: (idProjeto, idArtigo, definitivo = false) =>
      cliente.requisitar({
        metodo: 'DELETE',
        caminho: `${caminhoArtigo(idProjeto, idArtigo)}${montarQuery({
          force: definitivo ? 'true' : undefined,
        })}`,
      }),

    restaurarArtigoWiki: (idProjeto, idArtigo) =>
      cliente.requisitar({
        metodo: 'POST',
        caminho: `${caminhoArtigo(idProjeto, idArtigo)}/restore`,
      }),

    listarLixeiraWiki: (idProjeto, filtros = {}) =>
      cliente.requisitar({
        metodo: 'GET',
        caminho: `${caminhoProjeto(idProjeto)}/wiki/articles-trash${montarQuery({ ...filtros })}`,
      }),

    listarSincronizacaoWiki: (idProjeto, filtros = {}) =>
      cliente.requisitar({
        metodo: 'GET',
        caminho: `${caminhoProjeto(idProjeto)}/wiki/sync/articles${montarQuery({ ...filtros })}`,
      }),
  };
}
