/**
 * Progresso do jogador (fases concluídas e programa de cada fase), guardado no navegador.
 * O armazenamento é injetado; se falhar (modo privado, bloqueio), o jogo segue sem salvar.
 */
(function registrarProgresso(global) {
  const RoboLuz = (global.RoboLuz = global.RoboLuz || {});
  const { CHAVE_PROGRESSO } = RoboLuz.constantes;

  /**
   * Cria o progresso vazio.
   * @returns {{concluidas: number[], programas: Record<string, object>}} Progresso vazio.
   */
  function criarProgressoVazio() {
    return { concluidas: [], programas: {} };
  }

  class Progresso {
    /**
     * @param {Storage|null} armazenamento - localStorage (ou equivalente), ou null.
     */
    constructor(armazenamento) {
      this.armazenamento = armazenamento;
      this.dados = this.ler();
    }

    /**
     * Lê o progresso salvo.
     * @returns {{concluidas: number[], programas: object}} Progresso (vazio se não houver).
     */
    ler() {
      try {
        const texto = this.armazenamento && this.armazenamento.getItem(CHAVE_PROGRESSO);
        if (!texto) return criarProgressoVazio();

        const lido = JSON.parse(texto);
        return {
          concluidas: Array.isArray(lido.concluidas) ? lido.concluidas : [],
          programas: lido.programas && typeof lido.programas === 'object' ? lido.programas : {},
        };
      } catch (erro) {
        return criarProgressoVazio();
      }
    }

    /** Grava o progresso; ignora falha do armazenamento. */
    gravar() {
      try {
        if (!this.armazenamento) return;
        this.armazenamento.setItem(CHAVE_PROGRESSO, JSON.stringify(this.dados));
      } catch (erro) {
        // Sem armazenamento disponível o jogo continua; só não lembra o progresso.
      }
    }

    /**
     * Diz se a fase já foi concluída.
     * @param {number} indice - Fase.
     * @returns {boolean} true se concluída.
     */
    estaConcluida(indice) {
      return this.dados.concluidas.includes(indice);
    }

    /**
     * Diz se a fase pode ser jogada (a primeira, ou a anterior concluída).
     * @param {number} indice - Fase.
     * @returns {boolean} true se liberada.
     */
    estaLiberada(indice) {
      return indice === 0 || this.estaConcluida(indice) || this.estaConcluida(indice - 1);
    }

    /**
     * Marca a fase como concluída.
     * @param {number} indice - Fase.
     */
    marcarConcluida(indice) {
      if (this.estaConcluida(indice)) return;

      this.dados.concluidas.push(indice);
      this.gravar();
    }

    /**
     * Guarda o programa escrito numa fase.
     * @param {number} indice - Fase.
     * @param {object} programa - Programa (listas de comandos).
     */
    salvarPrograma(indice, programa) {
      this.dados.programas[indice] = programa;
      this.gravar();
    }

    /**
     * Devolve o programa salvo de uma fase.
     * @param {number} indice - Fase.
     * @returns {object|undefined} Programa, ou undefined.
     */
    obterPrograma(indice) {
      return this.dados.programas[indice];
    }
  }

  RoboLuz.Progresso = Progresso;
})(globalThis);
