import {
  NOME_APLICATIVO,
  URL_SERVIDOR_PADRAO,
  VARIAVEL_AMBIENTE_SERVIDOR,
  VERSAO_APLICATIVO,
} from '../compartilhado/constantes';
import type { InformacoesAplicativo } from '../compartilhado/tipos';

/**
 * Lê o endereço do servidor: a variável de ambiente vence o padrão.
 * @param ambiente - Variáveis de ambiente do processo (injetadas para facilitar a troca).
 * @returns URL do servidor, sem barra no fim.
 */
export function obterUrlServidor(ambiente: NodeJS.ProcessEnv): string {
  const urlInformada = ambiente[VARIAVEL_AMBIENTE_SERVIDOR]?.trim();
  if (!urlInformada) return URL_SERVIDOR_PADRAO;

  return urlInformada.replace(/\/+$/, '');
}

/**
 * Monta as informações do aplicativo enviadas para a interface.
 * @param ambiente - Variáveis de ambiente do processo.
 * @returns Nome, versão, servidor e plataforma.
 */
export function montarInformacoes(ambiente: NodeJS.ProcessEnv): InformacoesAplicativo {
  return {
    nome: NOME_APLICATIVO,
    versao: VERSAO_APLICATIVO,
    urlServidor: obterUrlServidor(ambiente),
    plataforma: process.platform,
  };
}
