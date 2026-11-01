/**
 * Ferramentas MCP de projeto (CLONE.8.8): `get_project_info`, as 8 ferramentas da wiki e as
 * 5 de imagens, sobre `ProjetosApi`/`ApiImagens` da plataforma e o registro local.
 */

import type { ApiImagens } from '../../api/imagens.api';
import type { ProjetosApi } from '../../api/projetos.api';
import type { ProjetoLocal } from '../../../compartilhado/tipos-armazenamento';
import {
  campoNumeroOpcional,
  campoTextoOpcional,
  exigirCampoTexto,
  resultadoTextoJson,
  type MapaFerramentas,
} from './comum';

/** Recorte do registro local de projetos. */
export interface ProjetosLocais {
  buscarPorId(id: string): Promise<ProjetoLocal | null>;
}

/** Dependências das ferramentas de projeto. */
export interface DependenciasFerramentasProjetos {
  projetos: ProjetosApi;
  imagens: ApiImagens;
  projetosLocais: ProjetosLocais;
}

const MSG_PROJETO_NAO_ENCONTRADO = 'Projeto não encontrado';

/**
 * Monta as ferramentas de projeto, wiki e imagens.
 * @param {DependenciasFerramentasProjetos} deps - APIs da plataforma e registro local.
 * @returns {MapaFerramentas} Mapa com as ferramentas.
 */
export function montarFerramentasProjetos(deps: DependenciasFerramentasProjetos): MapaFerramentas {
  const { projetos, imagens, projetosLocais } = deps;
  return {
    get_project_info: async (_argumentos, contexto) => {
      const projeto = await projetosLocais.buscarPorId(contexto.idProjeto);
      if (!projeto) throw new Error(MSG_PROJETO_NAO_ENCONTRADO);
      return resultadoTextoJson(projeto);
    },
    list_wiki_articles: async (argumentos, contexto) => {
      return resultadoTextoJson(
        await projetos.listarArtigosWiki(contexto.idProjeto, {
          limit: campoNumeroOpcional(argumentos, 'limit'),
          offset: campoNumeroOpcional(argumentos, 'offset'),
          status: campoTextoOpcional(argumentos, 'status'),
        }),
      );
    },
    get_wiki_article: async (argumentos, contexto) => {
      return resultadoTextoJson(
        await projetos.obterArtigoWiki(
          contexto.idProjeto,
          exigirCampoTexto(argumentos, 'article_id'),
        ),
      );
    },
    sync_wiki_articles: async (_argumentos, contexto) => {
      return resultadoTextoJson(
        await projetos.listarSincronizacaoWiki(contexto.idProjeto, {}),
      );
    },
    create_wiki_article: async (argumentos, contexto) => {
      return resultadoTextoJson(
        await projetos.criarArtigoWiki(contexto.idProjeto, {
          title: exigirCampoTexto(argumentos, 'title'),
          content: exigirCampoTexto(argumentos, 'content'),
          article_type: campoTextoOpcional(argumentos, 'article_type'),
          status: campoTextoOpcional(argumentos, 'status'),
          tags: Array.isArray(argumentos.tags) ? argumentos.tags : undefined,
        } as never),
      );
    },
    update_wiki_article: async (argumentos, contexto) => {
      const { article_id: _omitido, ...alteracoes } = argumentos;
      return resultadoTextoJson(
        await projetos.atualizarArtigoWiki(
          contexto.idProjeto,
          exigirCampoTexto(argumentos, 'article_id'),
          alteracoes as never,
        ),
      );
    },
    delete_wiki_article: async (argumentos, contexto) => {
      await projetos.apagarArtigoWiki(
        contexto.idProjeto,
        exigirCampoTexto(argumentos, 'article_id'),
        argumentos.permanent === true,
      );
      return resultadoTextoJson({ deleted: true });
    },
    restore_wiki_article: async (argumentos, contexto) => {
      return resultadoTextoJson(
        await projetos.restaurarArtigoWiki(
          contexto.idProjeto,
          exigirCampoTexto(argumentos, 'article_id'),
        ),
      );
    },
    list_trashed_wiki_articles: async (argumentos, contexto) => {
      return resultadoTextoJson(
        await projetos.listarLixeiraWiki(contexto.idProjeto, {
          limit: campoNumeroOpcional(argumentos, 'limit'),
          offset: campoNumeroOpcional(argumentos, 'offset'),
        }),
      );
    },
    generate_image: async (argumentos, contexto) => {
      return resultadoTextoJson(
        await imagens.gerar(contexto.idProjeto, {
          prompt: exigirCampoTexto(argumentos, 'prompt'),
          provider: campoTextoOpcional(argumentos, 'provider'),
          aspect_ratio: campoTextoOpcional(argumentos, 'aspect_ratio'),
          style: campoTextoOpcional(argumentos, 'style'),
        } as never),
      );
    },
    search_images: async (argumentos, contexto) => {
      return resultadoTextoJson(
        await imagens.listar(contexto.idProjeto, {
          limit: campoNumeroOpcional(argumentos, 'limit'),
          offset: campoNumeroOpcional(argumentos, 'offset'),
          status: campoTextoOpcional(argumentos, 'status'),
        }),
      );
    },
    get_image_status: async (argumentos, contexto) => {
      return resultadoTextoJson(
        await imagens.obterStatus(
          contexto.idProjeto,
          exigirCampoTexto(argumentos, 'image_id'),
        ),
      );
    },
    list_project_images: async (argumentos, contexto) => {
      return resultadoTextoJson(
        await imagens.listar(contexto.idProjeto, {
          limit: campoNumeroOpcional(argumentos, 'limit'),
          offset: campoNumeroOpcional(argumentos, 'offset'),
        }),
      );
    },
    delete_project_image: async (argumentos, contexto) => {
      await imagens.apagar(contexto.idProjeto, exigirCampoTexto(argumentos, 'image_id'));
      return resultadoTextoJson({ deleted: true });
    },
  };
}
