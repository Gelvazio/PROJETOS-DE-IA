/**
 * Repositório dos projetos locais: lista, busca, salva (insere ou atualiza) e remove projetos no
 * `projects.json` (`ProjectRegistry`, `docs/inventario/arquivos-locais.md`). Remover tira o
 * projeto só do registro; apagar a pasta dele é do serviço de projetos (CLONE.3.6).
 */

import type { ProjetoLocal, RegistroProjetos } from '../../compartilhado/tipos-armazenamento';
import {
  criarSistemaArquivosNode,
  gravarJson,
  lerJson,
  type SistemaArquivos,
} from '../armazenamento/arquivo-json';
import { ehIdValido, obterCaminhosGlobais } from '../armazenamento/caminhos';

const MSG_ID_PROJETO_INVALIDO = 'ID de projeto inválido';

/** Dependências injetadas no repositório. */
export interface DependenciasRepositorioProjetos {
  /** Pasta de dados (veja `obterPastaDados`). */
  pastaDados: string;
  /** Acesso a arquivos (padrão: `node:fs`). */
  arquivos?: SistemaArquivos;
}

/** Repositório dos projetos do `projects.json`. */
export class RepositorioProjetos {
  private readonly caminhoRegistro: string;
  private readonly arquivos: SistemaArquivos;
  private filaDeGravacao: Promise<unknown> = Promise.resolve();

  /**
   * @param {DependenciasRepositorioProjetos} dependencias - Pasta de dados e acesso a arquivos.
   */
  constructor(dependencias: DependenciasRepositorioProjetos) {
    this.caminhoRegistro = obterCaminhosGlobais(dependencias.pastaDados).projetos;
    this.arquivos = dependencias.arquivos ?? criarSistemaArquivosNode();
  }

  /**
   * Lista os projetos do registro, na ordem gravada.
   * @returns {Promise<ProjetoLocal[]>} Projetos (lista vazia se o arquivo não existir).
   * @throws {ErroArquivoJson} Se o arquivo estiver quebrado e sem cópia boa.
   */
  async listar(): Promise<ProjetoLocal[]> {
    const registro = await this.lerRegistro();
    return registro.projects;
  }

  /**
   * Busca um projeto pelo ID.
   * @param {string} id - ID do projeto.
   * @returns {Promise<ProjetoLocal | null>} O projeto, ou null se não existir (ou ID inválido).
   */
  async buscarPorId(id: string): Promise<ProjetoLocal | null> {
    if (!ehIdValido(id)) return null;

    const projetos = await this.listar();
    return projetos.find((projeto) => projeto.id === id) ?? null;
  }

  /**
   * Insere o projeto ou, se o ID já existir, substitui o registro dele (na mesma posição).
   * @param {ProjetoLocal} projeto - Projeto a salvar.
   * @returns {Promise<ProjetoLocal>} O projeto salvo.
   * @throws {Error} Se o ID do projeto for inválido.
   */
  async salvar(projeto: ProjetoLocal): Promise<ProjetoLocal> {
    if (!ehIdValido(projeto.id)) throw new Error(`${MSG_ID_PROJETO_INVALIDO}: ${projeto.id}`);

    await this.alterarRegistro((projetos) => {
      const posicao = projetos.findIndex((existente) => existente.id === projeto.id);
      if (posicao < 0) return [...projetos, projeto];
      return projetos.map((existente, indice) => (indice === posicao ? projeto : existente));
    });
    return projeto;
  }

  /**
   * Tira o projeto do registro. Não apaga a pasta do projeto.
   * @param {string} id - ID do projeto.
   * @returns {Promise<boolean>} true se o projeto existia e foi removido.
   */
  async remover(id: string): Promise<boolean> {
    let removeu = false;
    await this.alterarRegistro((projetos) => {
      const restantes = projetos.filter((projeto) => projeto.id !== id);
      removeu = restantes.length !== projetos.length;
      return restantes;
    });
    return removeu;
  }

  /**
   * Lê o registro e garante a lista `projects`.
   * @returns {Promise<RegistroProjetos>} Registro com lista (vazia se faltar).
   */
  private async lerRegistro(): Promise<RegistroProjetos> {
    const registro = await lerJson<Partial<RegistroProjetos>>(
      this.caminhoRegistro,
      {},
      this.arquivos,
    );
    return { projects: Array.isArray(registro.projects) ? registro.projects : [] };
  }

  /**
   * Lê, transforma e grava a lista, uma alteração por vez (não perde gravações simultâneas).
   * @param {(projetos: ProjetoLocal[]) => ProjetoLocal[]} transformar - Nova lista a partir da
   *   atual.
   * @returns {Promise<void>} Resolve quando a gravação terminar.
   */
  private alterarRegistro(
    transformar: (projetos: ProjetoLocal[]) => ProjetoLocal[],
  ): Promise<void> {
    const etapa = this.filaDeGravacao.then(async () => {
      const registro = await this.lerRegistro();
      const novoRegistro: RegistroProjetos = { projects: transformar(registro.projects) };
      await gravarJson(this.caminhoRegistro, novoRegistro, this.arquivos);
    });
    this.filaDeGravacao = etapa.catch(() => undefined);
    return etapa;
  }
}
