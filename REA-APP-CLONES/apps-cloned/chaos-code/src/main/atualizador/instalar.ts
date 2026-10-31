/**
 * Baixar e instalar a atualização (docs/inventario/imagem-atualizador.md, "Fluxo e mensagens"):
 * baixa o instalador com progresso (`update-progress`: `downloaded`, `total`), confere a
 * assinatura minisign **antes de gravar em disco**, grava o estado em `update_history.json`
 * (`save_pre_update_state`), roda o instalador e apaga o arquivo baixado. Pacote MSIX não se
 * atualiza sozinho (`MSIX_UPDATE_UNSUPPORTED`). Rede, disco, instalador e relógio são injetados.
 */

import path from 'node:path';

import { CHAVE_PUBLICA_ATUALIZACAO } from '../../compartilhado/constantes';
import type { ResultadoVerificacaoAtualizacao } from '../../compartilhado/tipos-atualizador';
import { conferirAssinatura } from './assinatura';
import { salvarEstadoPreAtualizacao, type DependenciasHistorico } from './historico';

const ARGUMENTOS_INSTALADOR_NSIS = ['/S'];
const NOME_INSTALADOR_PADRAO = 'instalador-atualizacao.exe';
const CARACTERES_NOME_INVALIDOS = /[^A-Za-z0-9._-]/g;
const PONTOS_INICIAIS = /^\.+/;
const TOTAL_DESCONHECIDO = 0;
const CABECALHO_TAMANHO = 'content-length';

const MSG_MSIX = 'Atualização deve vir da Microsoft Store.';
const MSG_SEM_ATUALIZACAO = 'Nenhuma atualização disponível.';
const MSG_FALHA_DOWNLOAD = 'Falha ao baixar a atualização (HTTP';
const MSG_CANCELADO = 'Download da atualização cancelado.';

/** Códigos dos erros de instalação, para a interface escolher a mensagem. */
export type CodigoErroInstalacao =
  | 'MSIX_UPDATE_UNSUPPORTED'
  | 'SEM_ATUALIZACAO'
  | 'FALHA_DOWNLOAD'
  | 'CANCELADO';

/** Erro do fluxo de instalação, com código estável. */
export class ErroInstalacao extends Error {
  /**
   * @param {CodigoErroInstalacao} codigo - Tipo da falha.
   * @param {string} mensagem - Texto do erro.
   */
  constructor(
    readonly codigo: CodigoErroInstalacao,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = 'ErroInstalacao';
  }
}

/** Resposta mínima do download (compatível com a `Response` do `fetch`). */
export interface RespostaDownload {
  ok: boolean;
  status: number;
  headers: { get(nome: string): string | null };
  body: ReadableStream<Uint8Array> | null;
  arrayBuffer(): Promise<ArrayBuffer>;
}

/** Função de rede injetada (padrão: `fetch` global). */
export type BaixarRede = (
  url: string,
  opcoes: { signal: AbortSignal },
) => Promise<RespostaDownload>;

/** Progresso do download, enviado ao evento `update-progress`. */
export interface ProgressoDownload {
  downloaded: number;
  /** 0 quando o servidor não informou o tamanho. */
  total: number;
}

/** Tudo o que o fluxo precisa de fora; nada é criado dentro da lógica. */
export interface DependenciasInstalacao {
  /** Pasta onde o instalador é gravado antes de rodar. */
  pastaDownload: string;
  /** Grava o instalador baixado. */
  gravarArquivo: (caminho: string, conteudo: Uint8Array) => Promise<void>;
  /** Apaga o instalador depois de rodar (não pode falhar se ele não existir). */
  removerArquivo: (caminho: string) => Promise<void>;
  /** Executa o instalador e espera ele terminar. */
  executarInstalador: (caminho: string, argumentos: string[]) => Promise<void>;
  /** Onde fica o `update_history.json`. */
  historico: DependenciasHistorico;
  /** Pacote MSIX: não atualiza sozinho. */
  ehMsix?: boolean;
  buscar?: BaixarRede;
  /** Chave pública minisign (padrão: `CHAVE_PUBLICA_ATUALIZACAO`). */
  chavePublica?: string;
  canal?: string;
  aoProgredir?: (progresso: ProgressoDownload) => void;
  /** Sinal para cancelar o download. */
  sinalCancelamento?: AbortSignal;
}

/**
 * Junta os pedaços numa única lista de bytes.
 * @param {Uint8Array[]} pedacos - Pedaços na ordem do download.
 * @returns {Uint8Array} Conteúdo completo.
 */
function juntarPedacos(pedacos: Uint8Array[]): Uint8Array {
  return new Uint8Array(Buffer.concat(pedacos));
}

/**
 * Lê o corpo da resposta, avisando o progresso a cada pedaço.
 * @param {RespostaDownload} resposta - Resposta já conferida (status 2xx).
 * @param {DependenciasInstalacao} dependencias - Para o aviso de progresso.
 * @returns {Promise<Uint8Array>} Bytes do instalador.
 */
async function lerCorpo(
  resposta: RespostaDownload,
  dependencias: DependenciasInstalacao,
): Promise<Uint8Array> {
  const total = Number(resposta.headers.get(CABECALHO_TAMANHO)) || TOTAL_DESCONHECIDO;
  if (resposta.body === null) return new Uint8Array(await resposta.arrayBuffer());

  const leitor = resposta.body.getReader();
  const pedacos: Uint8Array[] = [];
  let baixados = 0;
  for (let lido = await leitor.read(); !lido.done; lido = await leitor.read()) {
    pedacos.push(lido.value);
    baixados += lido.value.length;
    dependencias.aoProgredir?.({ downloaded: baixados, total });
  }
  return juntarPedacos(pedacos);
}

/**
 * Baixa o instalador.
 * @param {string} url - Endereço do instalador.
 * @param {DependenciasInstalacao} dependencias - Rede, progresso e cancelamento.
 * @returns {Promise<Uint8Array>} Bytes do instalador.
 * @throws {ErroInstalacao} `FALHA_DOWNLOAD` ou `CANCELADO`.
 */
async function baixarInstalador(
  url: string,
  dependencias: DependenciasInstalacao,
): Promise<Uint8Array> {
  const buscar = dependencias.buscar ?? (fetch as unknown as BaixarRede);
  const controle = new AbortController();
  dependencias.sinalCancelamento?.addEventListener('abort', () => controle.abort());

  try {
    const resposta = await buscar(url, { signal: controle.signal });
    if (!resposta.ok) {
      throw new ErroInstalacao('FALHA_DOWNLOAD', `${MSG_FALHA_DOWNLOAD} ${resposta.status})`);
    }
    return await lerCorpo(resposta, dependencias);
  } catch (erro) {
    if (controle.signal.aborted) throw new ErroInstalacao('CANCELADO', MSG_CANCELADO);
    throw erro;
  }
}

/**
 * Escolhe um nome de arquivo seguro para o instalador, a partir da URL.
 * @param {string} url - Endereço do instalador.
 * @returns {string} Nome só com letras, números, ponto, hífen e sublinhado.
 */
function nomeDoInstalador(url: string): string {
  const ultimoTrecho = new URL(url).pathname.split('/').pop() ?? '';
  const nome = ultimoTrecho.replace(CARACTERES_NOME_INVALIDOS, '_');
  return nome.replace(PONTOS_INICIAIS, '') || NOME_INSTALADOR_PADRAO;
}

/**
 * Baixa a atualização, confere a assinatura e instala. Só grava e roda o instalador se a
 * assinatura bater com a chave pública do app.
 * @param {ResultadoVerificacaoAtualizacao} atualizacao - Resultado de `verificarAtualizacao`.
 * @param {DependenciasInstalacao} dependencias - Rede, disco, instalador e histórico.
 * @returns {Promise<void>} Resolve quando o instalador terminar.
 * @throws {ErroInstalacao} MSIX, sem atualização, falha de download ou cancelamento.
 * @throws {ErroAssinatura} Se a assinatura não conferir (nada é gravado nem executado).
 */
export async function baixarEInstalarAtualizacao(
  atualizacao: ResultadoVerificacaoAtualizacao,
  dependencias: DependenciasInstalacao,
): Promise<void> {
  if (dependencias.ehMsix) throw new ErroInstalacao('MSIX_UPDATE_UNSUPPORTED', MSG_MSIX);
  if (!atualizacao.haAtualizacao) throw new ErroInstalacao('SEM_ATUALIZACAO', MSG_SEM_ATUALIZACAO);

  const conteudo = await baixarInstalador(atualizacao.urlInstalador, dependencias);
  const chavePublica = dependencias.chavePublica ?? CHAVE_PUBLICA_ATUALIZACAO;
  conferirAssinatura(conteudo, atualizacao.assinatura, chavePublica);

  await salvarEstadoPreAtualizacao(
    {
      versaoAtual: atualizacao.versaoInstalada,
      versaoAlvo: atualizacao.versaoDisponivel,
      canal: dependencias.canal,
    },
    dependencias.historico,
  );

  const nomeArquivo = nomeDoInstalador(atualizacao.urlInstalador);
  const caminho = path.join(dependencias.pastaDownload, nomeArquivo);
  await dependencias.gravarArquivo(caminho, conteudo);
  try {
    await dependencias.executarInstalador(caminho, ARGUMENTOS_INSTALADOR_NSIS);
  } finally {
    await dependencias.removerArquivo(caminho);
  }
}
