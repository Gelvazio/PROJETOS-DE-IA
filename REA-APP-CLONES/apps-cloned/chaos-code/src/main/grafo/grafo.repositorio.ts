/**
 * Armazenamento do grafo de conhecimento de um projeto: lê e grava `entities.json`, `graph.json`
 * e `communities.json` (docs/inventario/arquivos-locais.md; `graph::store` em modulos.md).
 *
 * O original grava `entities.json` e `graph.json` juntos (VA `0x14016e06d`). A junção de
 * duplicados e a remoção por artigo não aparecem na desmontagem; as regras abaixo são
 * *(inferidas)*:
 * - duas entidades são a mesma se o nome normalizado de uma bate com o nome ou um alias da outra;
 * - duas relações são a mesma se origem, destino e tipo normalizados forem iguais;
 * - o artigo de um `source_id` é o trecho antes do `#` (ex.: `a1#0` → `a1`).
 */

import type {
  ArquivoEntidades,
  ArquivoGrafo,
  Entidade,
  GrafoComunidades,
  Relacao,
} from '../../compartilhado/tipos-grafo';
import { gravarJson, lerJson, type SistemaArquivos } from '../armazenamento/arquivo-json';
import { obterCaminhosProjeto } from '../armazenamento/caminhos';

/** Separador entre o artigo e o trecho em um `source_id` *(inferido: `a1#0`)*. */
const SEPARADOR_ORIGEM = '#';

/** Entidades e relações de um projeto (conteúdo de `entities.json` e `graph.json`). */
export interface DadosGrafo {
  entidades: ArquivoEntidades;
  relacoes: ArquivoGrafo;
}

/** Operações de armazenamento do grafo de um projeto. */
export interface RepositorioGrafo {
  /** Lê entidades e relações; arquivo ausente vira lista vazia. */
  carregar(idProjeto: string): Promise<DadosGrafo>;
  /** Grava entidades e relações, substituindo o que existia. */
  gravar(idProjeto: string, dados: DadosGrafo): Promise<void>;
  /** Lê as comunidades; arquivo ausente vira grafo de comunidades vazio. */
  carregarComunidades(idProjeto: string): Promise<GrafoComunidades>;
  /** Grava as comunidades. */
  gravarComunidades(idProjeto: string, comunidades: GrafoComunidades): Promise<void>;
  /** Junta dados novos aos existentes sem duplicar, grava e devolve o resultado. */
  adicionar(idProjeto: string, novos: DadosGrafo): Promise<DadosGrafo>;
  /** Remove entidades e relações de um artigo, grava e devolve o resultado. */
  removerArtigo(idProjeto: string, idArtigo: string): Promise<DadosGrafo>;
}

/** Dependências do repositório. */
export interface DependenciasRepositorioGrafo {
  /** Pasta de dados (veja `obterPastaDados`). */
  pastaDados: string;
  /** Acesso a arquivos; sem ele, usa `node:fs`. */
  arquivos?: SistemaArquivos;
}

/** Dados vazios de entidades e relações. */
function criarDadosVazios(): DadosGrafo {
  return { entidades: [], relacoes: [] };
}

/** Comunidades vazias (arquivo ausente). */
function criarComunidadesVazias(): GrafoComunidades {
  return { communities: [], entity_to_community: {} };
}

/**
 * Normaliza um nome para comparação: minúsculas, sem acentos e com espaços simples.
 * @param {string} nome - Nome ou alias.
 * @returns {string} Nome normalizado.
 */
export function normalizarNome(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Une listas de texto sem repetir (compara pelo valor exato) e mantém a ordem.
 * @param {string[]} primeira - Lista que vem primeiro.
 * @param {string[]} segunda - Lista acrescentada depois.
 * @returns {string[]} Lista sem repetidos.
 */
function unirListas(primeira: string[], segunda: string[]): string[] {
  return [...new Set([...primeira, ...segunda])];
}

/**
 * Extrai o artigo de um `source_id`.
 * @param {string} idOrigem - Ex.: `a1#0`.
 * @returns {string} Artigo (`a1`); sem separador, o próprio texto.
 */
function obterArtigoDaOrigem(idOrigem: string): string {
  return idOrigem.split(SEPARADOR_ORIGEM)[0];
}

/**
 * Nomes que identificam uma entidade: o nome e os aliases, normalizados.
 * @param {Entidade} entidade - Entidade.
 * @returns {string[]} Nomes normalizados, sem vazios.
 */
function listarNomesNormalizados(entidade: Entidade): string[] {
  return [entidade.name, ...(entidade.aliases ?? [])].map(normalizarNome).filter(Boolean);
}

/**
 * Cria o índice nome normalizado → posição na lista.
 * @param {Entidade[]} entidades - Entidades já conhecidas.
 * @returns {Map<string, number>} Índice por nome e alias.
 */
function indexarEntidades(entidades: Entidade[]): Map<string, number> {
  const indice = new Map<string, number>();
  entidades.forEach((entidade, posicao) => registrarNomes(indice, entidade, posicao));
  return indice;
}

/**
 * Registra no índice o nome e os aliases de uma entidade (o primeiro dono de um nome fica).
 * @param {Map<string, number>} indice - Índice a atualizar.
 * @param {Entidade} entidade - Entidade a registrar.
 * @param {number} posicao - Posição dela na lista.
 * @returns {void}
 */
function registrarNomes(indice: Map<string, number>, entidade: Entidade, posicao: number): void {
  for (const nome of listarNomesNormalizados(entidade)) {
    if (!indice.has(nome)) indice.set(nome, posicao);
  }
}

/**
 * Procura a posição de uma entidade equivalente no índice.
 * @param {Map<string, number>} indice - Índice por nome e alias.
 * @param {Entidade} entidade - Entidade procurada.
 * @returns {number | undefined} Posição da equivalente, ou undefined se for nova.
 */
function localizarEntidade(indice: Map<string, number>, entidade: Entidade): number | undefined {
  for (const nome of listarNomesNormalizados(entidade)) {
    const posicao = indice.get(nome);
    if (posicao !== undefined) return posicao;
  }
  return undefined;
}

/**
 * Funde duas entidades iguais: a existente manda; aliases, origens e metadados são somados.
 * @param {Entidade} existente - Entidade já gravada.
 * @param {Entidade} nova - Entidade que chegou.
 * @returns {Entidade} Entidade unida.
 */
function unirEntidades(existente: Entidade, nova: Entidade): Entidade {
  const nomeNovoDiferente = normalizarNome(nova.name) !== normalizarNome(existente.name);
  const aliasesNovos = nomeNovoDiferente ? [nova.name, ...nova.aliases] : nova.aliases;
  const aliases = unirListas(existente.aliases ?? [], aliasesNovos ?? []).filter(
    (alias) => normalizarNome(alias) !== normalizarNome(existente.name),
  );
  return {
    ...existente,
    description: existente.description || nova.description,
    embedding: existente.embedding ?? nova.embedding,
    source_ids: unirListas(existente.source_ids, nova.source_ids),
    metadata: { ...nova.metadata, ...existente.metadata },
    aliases,
    confidence: Math.max(existente.confidence, nova.confidence),
    profile: existente.profile ?? nova.profile,
  };
}

/**
 * Junta entidades novas às existentes sem duplicar (por nome e alias normalizados).
 * @param {Entidade[]} existentes - Entidades já gravadas.
 * @param {Entidade[]} novas - Entidades que chegaram.
 * @returns {Entidade[]} Nova lista; as originais não são alteradas.
 */
export function mesclarEntidades(existentes: Entidade[], novas: Entidade[]): Entidade[] {
  const resultado = [...existentes];
  const indice = indexarEntidades(resultado);
  for (const nova of novas) {
    const posicao = localizarEntidade(indice, nova);
    if (posicao === undefined) {
      resultado.push(nova);
      registrarNomes(indice, nova, resultado.length - 1);
      continue;
    }
    resultado[posicao] = unirEntidades(resultado[posicao], nova);
    registrarNomes(indice, resultado[posicao], posicao);
  }
  return resultado;
}

/**
 * Chave de igualdade de uma relação: origem, destino e tipo normalizados.
 * @param {Relacao} relacao - Relação.
 * @returns {string} Chave única.
 */
function criarChaveRelacao(relacao: Relacao): string {
  const partes = [relacao.source_entity, relacao.target_entity, relacao.relation_type];
  return partes.map(normalizarNome).join(SEPARADOR_ORIGEM);
}

/**
 * Funde duas relações iguais: soma evidências e une origens e palavras-chave.
 * @param {Relacao} existente - Relação já gravada.
 * @param {Relacao} nova - Relação que chegou.
 * @returns {Relacao} Relação unida (peso = maior dos dois, *inferido*).
 */
function unirRelacoes(existente: Relacao, nova: Relacao): Relacao {
  return {
    ...existente,
    weight: Math.max(existente.weight, nova.weight),
    evidence_count: existente.evidence_count + nova.evidence_count,
    keywords: unirListas(existente.keywords ?? [], nova.keywords ?? []),
    description: existente.description || nova.description,
    source_ids: unirListas(existente.source_ids, nova.source_ids),
  };
}

/**
 * Troca os nomes das pontas da relação pelo nome da entidade final equivalente.
 * @param {Relacao} relacao - Relação com nomes como vieram da extração.
 * @param {Entidade[]} entidades - Entidades finais.
 * @param {Map<string, number>} indice - Índice das entidades finais.
 * @returns {Relacao} Relação apontando para os nomes finais.
 */
function apontarParaEntidades(
  relacao: Relacao,
  entidades: Entidade[],
  indice: Map<string, number>,
): Relacao {
  const nomeFinal = (nome: string): string => {
    const posicao = indice.get(normalizarNome(nome));
    return posicao === undefined ? nome : entidades[posicao].name;
  };
  return {
    ...relacao,
    source_entity: nomeFinal(relacao.source_entity),
    target_entity: nomeFinal(relacao.target_entity),
  };
}

/**
 * Junta relações novas às existentes sem duplicar.
 * @param {Relacao[]} existentes - Relações já gravadas.
 * @param {Relacao[]} novas - Relações que chegaram (já apontando para os nomes finais).
 * @returns {Relacao[]} Nova lista; as originais não são alteradas.
 */
export function mesclarRelacoes(existentes: Relacao[], novas: Relacao[]): Relacao[] {
  const resultado = [...existentes];
  const posicoes = new Map(resultado.map((relacao, i) => [criarChaveRelacao(relacao), i]));
  for (const nova of novas) {
    const posicao = posicoes.get(criarChaveRelacao(nova));
    if (posicao === undefined) {
      posicoes.set(criarChaveRelacao(nova), resultado.length);
      resultado.push(nova);
      continue;
    }
    resultado[posicao] = unirRelacoes(resultado[posicao], nova);
  }
  return resultado;
}

/**
 * Junta um grafo novo ao existente: entidades por nome/alias, relações por origem+destino+tipo.
 * @param {DadosGrafo} atual - O que já está gravado.
 * @param {DadosGrafo} novos - O que chegou da extração.
 * @returns {DadosGrafo} Grafo unido, sem duplicados.
 */
export function mesclarGrafo(atual: DadosGrafo, novos: DadosGrafo): DadosGrafo {
  const entidades = mesclarEntidades(atual.entidades, novos.entidades);
  const indice = indexarEntidades(entidades);
  const relacoesNovas = novos.relacoes.map((r) => apontarParaEntidades(r, entidades, indice));
  return { entidades, relacoes: mesclarRelacoes(atual.relacoes, relacoesNovas) };
}

/**
 * Tira de um item as origens do artigo. O item some se não sobrar nenhuma origem.
 * @param {T} item - Entidade ou relação.
 * @param {string} idArtigo - Artigo a remover.
 * @returns {T | null} Item reduzido, o próprio item se não tinha o artigo, ou null.
 */
function reduzirOrigens<T extends { source_ids: string[]; article_id: string }>(
  item: T,
  idArtigo: string,
): T | null {
  const restantes = item.source_ids.filter((id) => obterArtigoDaOrigem(id) !== idArtigo);
  const eDoArtigo = item.article_id === idArtigo;
  if (!eDoArtigo && restantes.length === item.source_ids.length) return item;
  if (restantes.length === 0) return null;

  const artigoRestante = eDoArtigo ? obterArtigoDaOrigem(restantes[0]) : item.article_id;
  return { ...item, source_ids: restantes, article_id: artigoRestante };
}

/**
 * Remove de entidades e relações tudo o que veio só de um artigo (ressincronização). Relações
 * que apontavam para uma entidade removida também saem.
 * @param {DadosGrafo} dados - Grafo atual.
 * @param {string} idArtigo - Artigo a remover.
 * @returns {DadosGrafo} Grafo sem o artigo; o original não é alterado.
 */
export function removerArtigoDoGrafo(dados: DadosGrafo, idArtigo: string): DadosGrafo {
  const entidades = dados.entidades
    .map((entidade) => reduzirOrigens(entidade, idArtigo))
    .filter((entidade): entidade is Entidade => entidade !== null);
  const nomesRemovidos = new Set(
    dados.entidades.filter((e) => !entidades.some((r) => r.name === e.name)).map((e) => e.name),
  );
  const relacoes = dados.relacoes
    .map((relacao) => reduzirOrigens(relacao, idArtigo))
    .filter((relacao): relacao is Relacao => relacao !== null)
    .filter((r) => !nomesRemovidos.has(r.source_entity) && !nomesRemovidos.has(r.target_entity));
  return { entidades, relacoes };
}

/**
 * Cria o repositório do grafo.
 * @param {DependenciasRepositorioGrafo} dependencias - Pasta de dados e acesso a arquivos.
 * @returns {RepositorioGrafo} Repositório pronto para uso.
 */
export function criarRepositorioGrafo(
  dependencias: DependenciasRepositorioGrafo,
): RepositorioGrafo {
  const { pastaDados, arquivos } = dependencias;
  const caminhos = (idProjeto: string) => obterCaminhosProjeto(pastaDados, idProjeto);

  const repositorio: RepositorioGrafo = {
    async carregar(idProjeto) {
      const { entidades, grafo } = caminhos(idProjeto);
      const vazio = criarDadosVazios();
      return {
        entidades: await lerJson<ArquivoEntidades>(entidades, vazio.entidades, arquivos),
        relacoes: await lerJson<ArquivoGrafo>(grafo, vazio.relacoes, arquivos),
      };
    },
    async gravar(idProjeto, dados) {
      const { entidades, grafo } = caminhos(idProjeto);
      await gravarJson(entidades, dados.entidades, arquivos);
      await gravarJson(grafo, dados.relacoes, arquivos);
    },
    carregarComunidades(idProjeto) {
      return lerJson(caminhos(idProjeto).comunidades, criarComunidadesVazias(), arquivos);
    },
    gravarComunidades(idProjeto, comunidades) {
      return gravarJson(caminhos(idProjeto).comunidades, comunidades, arquivos);
    },
    async adicionar(idProjeto, novos) {
      const unido = mesclarGrafo(await repositorio.carregar(idProjeto), novos);
      await repositorio.gravar(idProjeto, unido);
      return unido;
    },
    async removerArtigo(idProjeto, idArtigo) {
      const reduzido = removerArtigoDoGrafo(await repositorio.carregar(idProjeto), idArtigo);
      await repositorio.gravar(idProjeto, reduzido);
      return reduzido;
    },
  };
  return repositorio;
}
