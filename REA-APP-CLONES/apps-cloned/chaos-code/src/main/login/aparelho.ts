/**
 * Identificação do aparelho: recria o `device::fingerprint` do original
 * (docs/inventario/login.md, seção "Aparelho", e arquivos-locais.md, `device_id.json`).
 *
 * O ID fica em `device_id.json` na pasta de dados (UUID v4 criado uma vez) e os 5 campos saem na
 * mesma ordem do serializador do original (VA `0x14016c83f`).
 */
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { ARQUIVO_IDENTIFICACAO_APARELHO } from '../../compartilhado/constantes';

const SUFIXO_TEMPORARIO = '.tmp';
const CODIFICACAO_ARQUIVO = 'utf-8';
const ESPACOS_IDENTACAO_JSON = 2;
const CODIGO_ARQUIVO_INEXISTENTE = 'ENOENT';
const PADRAO_UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PADRAO_MAC = /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i;
const MAC_ZERADO = '00:00:00:00:00:00';
const SEPARADOR_INFO_SISTEMA = ' ';

/**
 * Nomes que o Rust usa em `std::env::consts::OS` (o original grava `windows`, arq. `0x890e48`).
 * Plataforma fora do mapa vai com o nome do Node.
 */
const SISTEMAS_RUST: Readonly<Record<string, string>> = {
  win32: 'windows',
  darwin: 'macos',
  linux: 'linux',
  freebsd: 'freebsd',
};

/** Nomes de `std::env::consts::ARCH` (o original grava `x86_64`, arq. `0x890e60`). */
const ARQUITETURAS_RUST: Readonly<Record<string, string>> = {
  x64: 'x86_64',
  ia32: 'x86',
  arm64: 'aarch64',
  arm: 'arm',
};

/** Conteúdo do `device_id.json` (uma chave só, igual ao original). */
export interface ArquivoIdAparelho {
  device_uuid: string;
}

/** Os 5 campos do aparelho, com os nomes e a ordem do original. */
export interface IdentificacaoAparelho {
  device_uuid: string;
  device_hostname: string;
  /** null quando não há adaptador com MAC válido *(inferido: `Option` da crate `mac_address`)*. */
  device_mac_address: string | null;
  device_os_info: string;
  device_client_version: string;
}

/** Acesso a arquivos usado pelo módulo (trocável por um falso nos testes manuais). */
export interface ArquivosAparelho {
  lerTexto(caminho: string): Promise<string | null>;
  gravarTexto(caminho: string, conteudo: string): Promise<void>;
  renomear(origem: string, destino: string): Promise<void>;
  criarPasta(caminho: string): Promise<void>;
}

/** Dados do sistema operacional usados para identificar o aparelho. */
export interface SistemaAparelho {
  nomeComputador(): string;
  interfacesRede(): NodeJS.Dict<os.NetworkInterfaceInfo[]>;
  plataforma(): string;
  arquitetura(): string;
}

/** Dependências injetadas na identificação do aparelho. */
export interface DependenciasAparelho {
  pastaDados: string;
  versaoCliente: string;
  arquivos: ArquivosAparelho;
  sistema: SistemaAparelho;
  gerarUuid: () => string;
}

/**
 * Diz se o erro do Node é "arquivo não existe".
 * @param erro - Erro capturado.
 * @returns true se o código for ENOENT.
 */
function ehArquivoInexistente(erro: unknown): boolean {
  const codigo = (erro as NodeJS.ErrnoException | null)?.code;
  return codigo === CODIGO_ARQUIVO_INEXISTENTE;
}

/**
 * Cria o acesso a arquivos real, com `node:fs/promises`.
 * @returns Implementação de {@link ArquivosAparelho}.
 */
export function criarArquivosNode(): ArquivosAparelho {
  return {
    async lerTexto(caminho) {
      try {
        return await readFile(caminho, CODIFICACAO_ARQUIVO);
      } catch (erro) {
        if (ehArquivoInexistente(erro)) return null;
        throw erro;
      }
    },
    gravarTexto: (caminho, conteudo) => writeFile(caminho, conteudo, CODIFICACAO_ARQUIVO),
    renomear: (origem, destino) => rename(origem, destino),
    async criarPasta(caminho) {
      await mkdir(caminho, { recursive: true });
    },
  };
}

/**
 * Cria a fonte real de dados do sistema, com `node:os` e `process`.
 * @returns Implementação de {@link SistemaAparelho}.
 */
export function criarSistemaNode(): SistemaAparelho {
  return {
    nomeComputador: () => os.hostname(),
    interfacesRede: () => os.networkInterfaces(),
    plataforma: () => process.platform,
    arquitetura: () => process.arch,
  };
}

/**
 * Monta as dependências reais a partir da pasta de dados e da versão do app.
 * @param pastaDados - Pasta de dados do clone (equivalente a `%LOCALAPPDATA%\chaos-code-v3`).
 * @param versaoCliente - Versão do aplicativo enviada em `device_client_version`.
 * @returns Dependências prontas para {@link montarIdentificacaoAparelho}.
 */
export function criarDependenciasAparelho(
  pastaDados: string,
  versaoCliente: string,
): DependenciasAparelho {
  return {
    pastaDados,
    versaoCliente,
    arquivos: criarArquivosNode(),
    sistema: criarSistemaNode(),
    gerarUuid: () => randomUUID(),
  };
}

/**
 * Lê o UUID de um texto JSON do `device_id.json`.
 * @param texto - Conteúdo do arquivo, ou null se ele não existe.
 * @returns UUID v4 válido, ou null se o texto faltar ou for inválido.
 */
function extrairUuid(texto: string | null): string | null {
  if (!texto) return null;

  try {
    const conteudo = JSON.parse(texto) as Partial<ArquivoIdAparelho> | null;
    const uuid = conteudo?.device_uuid;
    const ehUuidValido = typeof uuid === 'string' && PADRAO_UUID_V4.test(uuid);
    return ehUuidValido ? uuid : null;
  } catch {
    return null;
  }
}

/**
 * Lê o ID salvo; se o arquivo principal faltar ou estiver quebrado, tenta o `.tmp`
 * (mesma recuperação do `storage::local`).
 * @param dependencias - Pasta de dados e acesso a arquivos.
 * @returns UUID salvo, ou null se não houver um válido.
 */
export async function lerIdAparelho(dependencias: DependenciasAparelho): Promise<string | null> {
  const caminho = path.join(dependencias.pastaDados, ARQUIVO_IDENTIFICACAO_APARELHO);
  const doPrincipal = extrairUuid(await dependencias.arquivos.lerTexto(caminho));
  if (doPrincipal) return doPrincipal;

  const caminhoTemporario = `${caminho}${SUFIXO_TEMPORARIO}`;
  return extrairUuid(await dependencias.arquivos.lerTexto(caminhoTemporario));
}

/**
 * Grava o `device_id.json` de forma atômica: escreve o `.tmp` e renomeia por cima,
 * em JSON com 2 espaços (como o original).
 * @param dependencias - Pasta de dados e acesso a arquivos.
 * @param uuid - UUID a gravar.
 * @returns Promessa resolvida quando o arquivo estiver no lugar.
 */
export async function gravarIdAparelho(
  dependencias: DependenciasAparelho,
  uuid: string,
): Promise<void> {
  const caminho = path.join(dependencias.pastaDados, ARQUIVO_IDENTIFICACAO_APARELHO);
  const caminhoTemporario = `${caminho}${SUFIXO_TEMPORARIO}`;
  const conteudo: ArquivoIdAparelho = { device_uuid: uuid };

  await dependencias.arquivos.criarPasta(dependencias.pastaDados);
  await dependencias.arquivos.gravarTexto(
    caminhoTemporario,
    JSON.stringify(conteudo, null, ESPACOS_IDENTACAO_JSON),
  );
  await dependencias.arquivos.renomear(caminhoTemporario, caminho);
}

/**
 * Devolve o ID do aparelho, criando um UUID v4 novo na primeira vez.
 * Arquivo ilegível também gera um ID novo *(inferido: o inventário não diz o que o original faz)*.
 * @param dependencias - Pasta de dados, arquivos e gerador de UUID.
 * @returns UUID do aparelho.
 */
export async function obterOuCriarIdAparelho(dependencias: DependenciasAparelho): Promise<string> {
  const salvo = await lerIdAparelho(dependencias);
  if (salvo) return salvo;

  const novo = dependencias.gerarUuid();
  await gravarIdAparelho(dependencias, novo);
  return novo;
}

/**
 * Diz se uma entrada de interface de rede tem um MAC físico utilizável.
 * @param entrada - Endereço de uma interface (`os.networkInterfaces()`).
 * @returns true se não for interna e o MAC for válido e diferente de zero.
 */
function temMacFisico(entrada: os.NetworkInterfaceInfo): boolean {
  const macValido = PADRAO_MAC.test(entrada.mac) && entrada.mac !== MAC_ZERADO;
  return !entrada.internal && macValido;
}

/**
 * Escolhe o MAC do aparelho: o do primeiro adaptador não interno com MAC válido.
 * *(inferido)* O original usa a crate `mac_address 1.1.8` sobre `GetAdaptersAddresses`
 * (login.md); a crate pega o primeiro adaptador com endereço físico e o escreve em
 * hexadecimal maiúsculo separado por `:` — a regra exata não foi confirmada no binário.
 * @param interfaces - Interfaces de rede por nome, na ordem do sistema.
 * @returns MAC no formato `AA:BB:CC:DD:EE:FF`, ou null se não houver.
 */
export function escolherEnderecoMac(
  interfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]>,
): string | null {
  for (const entradas of Object.values(interfaces)) {
    const fisica = entradas?.find(temMacFisico);
    if (fisica) return fisica.mac.toUpperCase();
  }

  return null;
}

/**
 * Monta o texto do sistema como o original, ex. `windows x86_64`.
 * *(inferido)* Logo após `windows` e `x86_64` há um molde de formatação com um espaço entre dois
 * valores (bytes `c0 01 20 c0 00`, arq. `0x890e78`), lido como `format!("{} {}", OS, ARCH)`.
 * @param sistema - Fonte de plataforma e arquitetura.
 * @returns Texto do sistema operacional.
 */
export function montarInfoSistema(sistema: SistemaAparelho): string {
  const plataforma = sistema.plataforma();
  const arquitetura = sistema.arquitetura();
  const nomeSistema = SISTEMAS_RUST[plataforma] ?? plataforma;
  const nomeArquitetura = ARQUITETURAS_RUST[arquitetura] ?? arquitetura;

  return `${nomeSistema}${SEPARADOR_INFO_SISTEMA}${nomeArquitetura}`;
}

/**
 * Monta os 5 campos do aparelho, na ordem do original.
 * @param dependencias - Pasta de dados, versão, arquivos, sistema e gerador de UUID.
 * @returns Identificação do aparelho pronta para enviar à plataforma.
 */
export async function montarIdentificacaoAparelho(
  dependencias: DependenciasAparelho,
): Promise<IdentificacaoAparelho> {
  const { sistema } = dependencias;

  return {
    device_uuid: await obterOuCriarIdAparelho(dependencias),
    device_hostname: sistema.nomeComputador(),
    device_mac_address: escolherEnderecoMac(sistema.interfacesRede()),
    device_os_info: montarInfoSistema(sistema),
    device_client_version: dependencias.versaoCliente,
  };
}
