/**
 * Serviço de agentes (`commands::agents` do original): lista os agentes de um projeto (pastas
 * `.claude/agents`, `.agents`, `.codex/agents` etc. por CLI), lê e grava arquivos `.md` com
 * frontmatter (`lerAgente`/`gravarAgente`) e descobre os agentes embutidos dos modelos.
 */

import { readdir, readFile, mkdir, writeFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import type { Agente } from '../../compartilhado/tipos-agentes';
import { lerAgente } from './frontmatter';
import {
  gravarAgente,
  obterPastaAgentes,
  type ArquivosAgentes,
} from './gravar-agente';
import { CLIS_SUPORTADOS, type DefinicaoCli } from '../cli/clis-suportados';
import type { RepositorioProjetos } from '../projeto/projeto.repositorio';

/** Agente achado numa pasta. */
export interface AgenteListado {
  nome: string;
  cli: DefinicaoCli['id'];
  escopo: 'projeto' | 'global';
  caminho: string;
  agente: Agente;
}

/** Erro do serviço de agentes. */
export class ErroServicoAgentes extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroServicoAgentes';
  }
}

const MSG_PROJETO_NAO_ENCONTRADO = 'Projeto não encontrado';
const MSG_AGENTE_NAO_ENCONTRADO = 'Agente não encontrado';
const EXTENSAO_AGENTE = '.md';
const ESCOPOS_VALIDOS = ['projeto', 'global'] as const;

/** Arquivos do Node usados pela gravação. */
const ARQUIVOS_NODE: ArquivosAgentes = {
  criarPasta: (c) => mkdir(c, { recursive: true }).then(() => undefined),
  gravarTexto: (c, conteudo) => writeFile(c, conteudo, 'utf8'),
  renomear: (origem, destino) => rename(origem, destino),
  remover: (c) => rm(c, { force: true }).then(() => undefined),
};

/** Dependências do serviço de agentes. */
export interface DependenciasServicoAgentes {
  repositorioProjetos: RepositorioProjetos;
  /** Pasta do usuário (agentes globais; padrão `%USERPROFILE%`/`$HOME`). */
  pastaUsuario?: string;
}

/** Serviço de agentes. */
export class ServicoAgentes {
  private readonly pastaUsuario: string;

  constructor(private readonly deps: DependenciasServicoAgentes) {
    this.pastaUsuario =
      deps.pastaUsuario ?? process.env.USERPROFILE ?? process.env.HOME ?? '';
  }

  /**
   * Lista os agentes do projeto (e globais) que os CLIs reconhecem.
   * @param {string} idProjeto - ID do projeto.
   * @param {string} [escopo] - `projeto`, `global` ou ausente (os dois).
   * @returns {Promise<AgenteListado[]>} Agentes achados.
   * @throws {ErroServicoAgentes} Se o projeto não existir.
   */
  async listar(idProjeto: string, escopo?: string): Promise<AgenteListado[]> {
    const projeto = await this.deps.repositorioProjetos.buscarPorId(idProjeto);
    if (!projeto) throw new ErroServicoAgentes(MSG_PROJETO_NAO_ENCONTRADO);
    const bases: { escopo: 'projeto' | 'global'; pasta: string | null }[] = [
      { escopo: 'projeto', pasta: projeto.local_path ?? null },
      { escopo: 'global', pasta: this.pastaUsuario || null },
    ];
    const escolher = escopo && (ESCOPOS_VALIDOS as readonly string[]).includes(escopo)
      ? bases.filter((base) => base.escopo === escopo)
      : bases;
    const listados: AgenteListado[] = [];
    for (const base of escolher) {
      if (!base.pasta) continue;
      for (const cli of CLIS_SUPORTADOS) {
        let pasta: string;
        try {
          pasta = obterPastaAgentes(cli.id, base.pasta);
        } catch {
          continue;
        }
        for (const item of await this.lerPastaAgentes(pasta)) {
          listados.push({ ...item, cli: cli.id, escopo: base.escopo });
        }
      }
    }
    return listados;
  }

  /**
   * Lê um agente pelo nome (procura nas pastas dos CLIs do projeto e do usuário).
   * @param {string} idProjeto - ID do projeto.
   * @param {string} nome - Nome do agente.
   * @returns {Promise<AgenteListado>} Agente achado.
   * @throws {ErroServicoAgentes} Se não existir.
   */
  async obter(idProjeto: string, nome: string): Promise<AgenteListado> {
    const achado = (await this.listar(idProjeto)).find((item) => item.nome === nome);
    if (!achado) throw new ErroServicoAgentes(MSG_AGENTE_NAO_ENCONTRADO);
    return achado;
  }

  /**
   * Grava um agente na pasta do CLI pedido (valida o nome e o caminho).
   * @param {string} idProjeto - ID do projeto.
   * @param {Agente} agente - Agente a gravar.
   * @param {{ cli: string; escopo: string }} destino - CLI e escopo.
   * @returns {Promise<{ caminho: string }>} Caminho gravado.
   * @throws {ErroServicoAgentes} Se o projeto, o CLI ou o escopo não servirem.
   */
  async gravar(
    idProjeto: string,
    agente: Agente,
    destino: { cli: string; escopo: string },
  ): Promise<{ caminho: string }> {
    const projeto = await this.deps.repositorioProjetos.buscarPorId(idProjeto);
    if (!projeto) throw new ErroServicoAgentes(MSG_PROJETO_NAO_ENCONTRADO);
    const cliValido = CLIS_SUPORTADOS.find((cli) => cli.id === destino.cli);
    if (!cliValido) throw new ErroServicoAgentes(`CLI desconhecido: ${destino.cli}`);
    const pastaBase = destino.escopo === 'global' ? this.pastaUsuario : projeto.local_path ?? '';
    const caminho = await gravarAgente(
      { agente, cli: cliValido.id, pastaBase },
      { arquivos: ARQUIVOS_NODE },
    );
    return { caminho };
  }

  /**
   * Lista os `.md` de uma pasta de agentes, lendo cada um.
   * @param {string} pasta - Pasta de agentes.
   * @returns {Promise<{ nome: string; caminho: string; agente: Agente }[]>} Agentes lidos.
   */
  private async lerPastaAgentes(
    pasta: string,
  ): Promise<{ nome: string; caminho: string; agente: Agente }[]> {
    let arquivos: string[];
    try {
      arquivos = (await readdir(pasta)).filter((nome) => nome.endsWith(EXTENSAO_AGENTE));
    } catch {
      return [];
    }
    const lidos: { nome: string; caminho: string; agente: Agente }[] = [];
    for (const arquivo of arquivos) {
      const caminho = path.join(pasta, arquivo);
      try {
        lidos.push({
          nome: path.basename(arquivo, EXTENSAO_AGENTE),
          caminho,
          agente: lerAgente(await readFile(caminho, 'utf8')),
        });
      } catch {
        // Arquivo inválido não derruba a listagem.
      }
    }
    return lidos;
  }
}
