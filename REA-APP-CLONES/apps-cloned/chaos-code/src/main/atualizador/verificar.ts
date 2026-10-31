import {
  PLATAFORMA_ATUALIZACAO_WINDOWS,
  TEMPO_LIMITE_VERIFICACAO_ATUALIZACAO_MS,
  URL_ATUALIZACAO,
} from '../../compartilhado/constantes';
import type {
  LatestJson,
  ResultadoVerificacaoAtualizacao,
} from '../../compartilhado/tipos-atualizador';
import { existeVersaoMaisNova } from './versao';

/** Função de rede injetada (padrão: `fetch` global), para poder trocar a origem dos dados. */
export type BuscarRede = (url: string, opcoes: { signal: AbortSignal }) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

/** Opções da verificação; todas têm padrão. */
export interface OpcoesVerificacao {
  urlAtualizacao?: string;
  plataforma?: string;
  tempoLimiteMs?: number;
  buscar?: BuscarRede;
}

/**
 * Confere se o JSON recebido tem o formato mínimo do `latest.json`.
 * @param dados - Valor lido da resposta.
 * @returns true se tiver `version` e `platforms`.
 */
function ehLatestJson(dados: unknown): dados is LatestJson {
  if (typeof dados !== 'object' || dados === null) return false;

  const candidato = dados as Partial<LatestJson>;
  const temVersao = typeof candidato.version === 'string';
  const temPlataformas = typeof candidato.platforms === 'object' && candidato.platforms !== null;
  return temVersao && temPlataformas;
}

/**
 * Busca o `latest.json` com tempo limite.
 * @param url - Endereço do manifesto.
 * @param buscar - Função de rede.
 * @param tempoLimiteMs - Tempo máximo, em milissegundos.
 * @returns O manifesto lido.
 * @throws {Error} Em falha de rede, tempo esgotado, status diferente de 2xx ou formato inválido.
 */
async function buscarManifesto(
  url: string,
  buscar: BuscarRede,
  tempoLimiteMs: number,
): Promise<LatestJson> {
  const controle = new AbortController();
  const temporizador = setTimeout(() => controle.abort(), tempoLimiteMs);

  try {
    const resposta = await buscar(url, { signal: controle.signal });
    if (!resposta.ok) throw new Error(`Servidor de atualização respondeu ${resposta.status}.`);

    const dados = await resposta.json();
    if (!ehLatestJson(dados)) throw new Error('O latest.json recebido tem formato inválido.');
    return dados;
  } catch (erro) {
    if (controle.signal.aborted) {
      const segundos = Math.round(tempoLimiteMs / 1000);
      throw new Error(`Tempo esgotado ao verificar atualização (${segundos}s).`);
    }
    throw erro;
  } finally {
    clearTimeout(temporizador);
  }
}

/**
 * Consulta o `latest.json` e diz se existe versão mais nova que a instalada.
 * @param versaoInstalada - Versão em uso (semver).
 * @param opcoes - Endereço, plataforma, tempo limite e função de rede (todos opcionais).
 * @returns Resultado da verificação; sem instalador para a plataforma conta como sem atualização.
 * @throws {Error} Em falha de rede, tempo esgotado ou manifesto inválido.
 */
export async function verificarAtualizacao(
  versaoInstalada: string,
  opcoes: OpcoesVerificacao = {},
): Promise<ResultadoVerificacaoAtualizacao> {
  const url = opcoes.urlAtualizacao ?? URL_ATUALIZACAO;
  const plataforma = opcoes.plataforma ?? PLATAFORMA_ATUALIZACAO_WINDOWS;
  const tempoLimiteMs = opcoes.tempoLimiteMs ?? TEMPO_LIMITE_VERIFICACAO_ATUALIZACAO_MS;
  const buscar = opcoes.buscar ?? (fetch as unknown as BuscarRede);

  const manifesto = await buscarManifesto(url, buscar, tempoLimiteMs);
  const instalador = manifesto.platforms[plataforma];
  const haVersaoNova = existeVersaoMaisNova(versaoInstalada, manifesto.version);

  return {
    haAtualizacao: haVersaoNova && Boolean(instalador),
    versaoInstalada,
    versaoDisponivel: manifesto.version,
    notas: manifesto.notes ?? '',
    urlInstalador: haVersaoNova && instalador ? instalador.url : '',
    assinatura: haVersaoNova && instalador ? instalador.signature : '',
  };
}
