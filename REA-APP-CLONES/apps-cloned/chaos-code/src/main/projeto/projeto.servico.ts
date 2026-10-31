/**
 * Serviço de projetos (`project::manager` do original): cria, lista, abre, renomeia e remove
 * projetos locais e guarda o projeto ativo em memória. O registro fica no `RepositorioProjetos`;
 * a pasta de cada projeto fica em `<pasta de dados>\projects\<id>`.
 *
 * O ID novo é um UUID: o inventário só *infere* o prefixo `chaos-code-project-` (nome de pasta
 * e de servidor MCP), então ele não é usado para gerar ID. Os projetos reais vêm da plataforma
 * com ID próprio, e este serviço aceita qualquer ID válido (`ehIdValido`).
 */

import { randomUUID } from 'node:crypto';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

import type { ProjetoLocal } from '../../compartilhado/tipos-armazenamento';
import { NOME_PASTA_PROJETOS } from '../../compartilhado/constantes';
import { ehIdValido, obterPastaProjeto } from '../armazenamento/caminhos';
import type { RepositorioProjetos } from './projeto.repositorio';

const STATUS_PROJETO_NOVO = 'active';
const PREFIXO_FORA_DA_PASTA = '..';
const MSG_ID_INVALIDO = 'ID de projeto inválido';
const MSG_NOME_VAZIO = 'O nome do projeto não pode ser vazio';
const MSG_NAO_ENCONTRADO = 'Projeto não encontrado';
const MSG_PASTA_FORA_DOS_PROJETOS = 'A pasta do projeto está fora da pasta de projetos';

/** Operações de pasta usadas pelo serviço (trocável por um falso). */
export interface SistemaPastasProjeto {
  /** Cria a pasta e as pais, se faltarem. */
  criarPasta(caminho: string): Promise<void>;
  /** Apaga a pasta e tudo dentro dela; não dá erro se ela não existir. */
  removerPasta(caminho: string): Promise<void>;
}

/** Dependências injetadas no serviço. */
export interface DependenciasServicoProjetos {
  repositorio: RepositorioProjetos;
  /** Pasta de dados (veja `obterPastaDados`). */
  pastaDados: string;
  /** Operações de pasta (padrão: `node:fs`). */
  pastas?: SistemaPastasProjeto;
  /** Gerador de ID de projeto novo (padrão: UUID v4). */
  gerarId?: () => string;
  /** Relógio (padrão: agora). */
  obterAgora?: () => Date;
}

/** Dados para criar um projeto. */
export interface DadosNovoProjeto {
  name: string;
  description?: string | null;
}

/** Função chamada quando o projeto ativo muda (`null` = nenhum). */
export type OuvinteProjetoAtivo = (projeto: ProjetoLocal | null) => void;

/**
 * Cria o acesso a pastas usando `node:fs/promises`.
 * @returns {SistemaPastasProjeto} Implementação padrão.
 */
export function criarSistemaPastasNode(): SistemaPastasProjeto {
  return {
    async criarPasta(caminho) {
      await mkdir(caminho, { recursive: true });
    },
    async removerPasta(caminho) {
      await rm(caminho, { recursive: true, force: true });
    },
  };
}

/** Serviço dos projetos locais e do projeto ativo. */
export class ServicoProjetos {
  private readonly repositorio: RepositorioProjetos;
  private readonly pastaDados: string;
  private readonly pastas: SistemaPastasProjeto;
  private readonly gerarId: () => string;
  private readonly obterAgora: () => Date;
  private readonly ouvintes = new Set<OuvinteProjetoAtivo>();
  private projetoAtivo: ProjetoLocal | null = null;

  /**
   * @param {DependenciasServicoProjetos} dependencias - Repositório, pasta de dados e extras.
   */
  constructor(dependencias: DependenciasServicoProjetos) {
    this.repositorio = dependencias.repositorio;
    this.pastaDados = dependencias.pastaDados;
    this.pastas = dependencias.pastas ?? criarSistemaPastasNode();
    this.gerarId = dependencias.gerarId ?? randomUUID;
    this.obterAgora = dependencias.obterAgora ?? (() => new Date());
  }

  /**
   * Cria o projeto: registra no `projects.json` e cria a pasta dele.
   * @param {DadosNovoProjeto} dados - Nome e descrição.
   * @returns {Promise<ProjetoLocal>} Projeto criado (status `active`).
   * @throws {Error} Se o nome for vazio ou o ID gerado for inválido.
   */
  async criar(dados: DadosNovoProjeto): Promise<ProjetoLocal> {
    const nome = dados.name.trim();
    if (!nome) throw new Error(MSG_NOME_VAZIO);

    const id = this.gerarId();
    if (!ehIdValido(id)) throw new Error(`${MSG_ID_INVALIDO}: ${id}`);

    await this.pastas.criarPasta(obterPastaProjeto(this.pastaDados, id));
    return this.repositorio.salvar({
      id,
      name: nome,
      description: dados.description ?? null,
      status: STATUS_PROJETO_NOVO,
      created_at: this.obterAgora().toISOString(),
    });
  }

  /**
   * Lista os projetos do registro.
   * @returns {Promise<ProjetoLocal[]>} Projetos na ordem gravada.
   */
  listar(): Promise<ProjetoLocal[]> {
    return this.repositorio.listar();
  }

  /**
   * Abre (busca) um projeto pelo ID.
   * @param {string} id - ID do projeto.
   * @returns {Promise<ProjetoLocal | null>} O projeto, ou null se não existir.
   */
  abrir(id: string): Promise<ProjetoLocal | null> {
    return this.repositorio.buscarPorId(id);
  }

  /**
   * Troca o nome do projeto; se ele for o ativo, o ativo é atualizado e os ouvintes avisados.
   * @param {string} id - ID do projeto.
   * @param {string} novoNome - Nome novo (sem espaços nas pontas, não vazio).
   * @returns {Promise<ProjetoLocal>} Projeto atualizado.
   * @throws {Error} Se o nome for vazio ou o projeto não existir.
   */
  async renomear(id: string, novoNome: string): Promise<ProjetoLocal> {
    const nome = novoNome.trim();
    if (!nome) throw new Error(MSG_NOME_VAZIO);

    const projeto = await this.exigirProjeto(id);
    const atualizado = await this.repositorio.salvar({ ...projeto, name: nome });
    if (this.projetoAtivo?.id === id) this.mudarAtivo(atualizado);
    return atualizado;
  }

  /**
   * Remove o projeto: apaga a pasta dele (só dentro de `projects`) e tira do registro. Se era o
   * ativo, o ativo vira nenhum.
   * @param {string} id - ID do projeto.
   * @returns {Promise<boolean>} true se o projeto existia e foi removido; false se não existe.
   * @throws {Error} Se o ID for inválido ou a pasta cair fora da pasta de projetos.
   */
  async remover(id: string): Promise<boolean> {
    if (!ehIdValido(id)) throw new Error(`${MSG_ID_INVALIDO}: ${id}`);

    const projeto = await this.repositorio.buscarPorId(id);
    if (!projeto) return false;

    await this.pastas.removerPasta(this.obterPastaSegura(id));
    await this.repositorio.remover(id);
    if (this.projetoAtivo?.id === id) this.mudarAtivo(null);
    return true;
  }

  /**
   * Define o projeto ativo.
   * @param {string} id - ID do projeto.
   * @returns {Promise<ProjetoLocal>} O projeto ativo.
   * @throws {Error} Se o projeto não existir.
   */
  async definirAtivo(id: string): Promise<ProjetoLocal> {
    const projeto = await this.exigirProjeto(id);
    this.mudarAtivo(projeto);
    return projeto;
  }

  /** Deixa o projeto ativo em nenhum. @returns {void} */
  limparAtivo(): void {
    this.mudarAtivo(null);
  }

  /** @returns {ProjetoLocal | null} Projeto ativo, ou null. */
  obterAtivo(): ProjetoLocal | null {
    return this.projetoAtivo;
  }

  /**
   * Registra uma função chamada a cada mudança do projeto ativo.
   * @param {OuvinteProjetoAtivo} ouvinte - Função a chamar.
   * @returns {() => void} Função que cancela o registro.
   */
  aoMudarAtivo(ouvinte: OuvinteProjetoAtivo): () => void {
    this.ouvintes.add(ouvinte);
    return () => {
      this.ouvintes.delete(ouvinte);
    };
  }

  /**
   * Busca o projeto ou dá erro.
   * @param {string} id - ID do projeto.
   * @returns {Promise<ProjetoLocal>} O projeto.
   * @throws {Error} Se não existir.
   */
  private async exigirProjeto(id: string): Promise<ProjetoLocal> {
    const projeto = await this.repositorio.buscarPorId(id);
    if (!projeto) throw new Error(`${MSG_NAO_ENCONTRADO}: ${id}`);
    return projeto;
  }

  /**
   * Calcula a pasta do projeto e confere que ela está dentro de `projects`, abaixo dela.
   * @param {string} id - ID do projeto (já validado).
   * @returns {string} Pasta do projeto.
   * @throws {Error} Se a pasta for a própria `projects` ou estiver fora dela.
   */
  private obterPastaSegura(id: string): string {
    const pastaProjetos = path.join(this.pastaDados, NOME_PASTA_PROJETOS);
    const pastaProjeto = obterPastaProjeto(this.pastaDados, id);
    const relativo = path.relative(pastaProjetos, pastaProjeto);

    const estaDentro =
      relativo !== '' && !relativo.startsWith(PREFIXO_FORA_DA_PASTA) && !path.isAbsolute(relativo);
    if (!estaDentro) throw new Error(`${MSG_PASTA_FORA_DOS_PROJETOS}: ${id}`);
    return pastaProjeto;
  }

  /**
   * Troca o projeto ativo e avisa os ouvintes.
   * @param {ProjetoLocal | null} projeto - Novo ativo.
   * @returns {void}
   */
  private mudarAtivo(projeto: ProjetoLocal | null): void {
    this.projetoAtivo = projeto;
    this.ouvintes.forEach((ouvinte) => ouvinte(projeto));
  }
}
