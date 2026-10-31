/**
 * Mundo do Robô de Luz: o tabuleiro, as luzes acesas e o robô, com as regras de cada comando.
 * Não desenha nada e não conhece o DOM (quem desenha é o renderizador).
 */
(function registrarMundo(global) {
  const RoboLuz = (global.RoboLuz = global.RoboLuz || {});
  const { COMANDOS, DESLOCAMENTO_DIRECAO } = RoboLuz.constantes;

  const TOTAL_DIRECOES = DESLOCAMENTO_DIRECAO.length;

  /** Tipos de efeito devolvidos por `aplicar`, usados na animação. */
  const EFEITO = Object.freeze({
    ANDOU: 'andou',
    PULOU: 'pulou',
    VIROU: 'virou',
    ACENDEU: 'acendeu',
    PARADO: 'parado',
  });

  /**
   * Monta a chave de uma casa para o conjunto de luzes.
   * @param {number} x - Coluna.
   * @param {number} y - Linha.
   * @returns {string} Chave "x,y".
   */
  function chaveCasa(x, y) {
    return `${x},${y}`;
  }

  class Mundo {
    /**
     * Cria o mundo de uma fase, com todas as luzes apagadas e o robô no início.
     * @param {{grade: Array, inicio: {x: number, y: number, direcao: number}}} fase - Fase lida.
     */
    constructor(fase) {
      this.grade = fase.grade;
      this.robo = { ...fase.inicio };
      this.luzes = new Set();
      this.totalAzuis = fase.grade.flat().filter((ladrilho) => ladrilho && ladrilho.azul).length;
      this.acoes = {
        [COMANDOS.ANDAR]: () => this.mover(false),
        [COMANDOS.PULAR]: () => this.mover(true),
        [COMANDOS.VIRAR_ESQUERDA]: () => this.virar(-1),
        [COMANDOS.VIRAR_DIREITA]: () => this.virar(1),
        [COMANDOS.ACENDER]: () => this.acender(),
      };
    }

    /**
     * Devolve o ladrilho de uma casa.
     * @param {number} x - Coluna.
     * @param {number} y - Linha.
     * @returns {{altura: number, azul: boolean}|null} Ladrilho, ou null se vazio ou fora.
     */
    obterLadrilho(x, y) {
      const linha = this.grade[y];
      if (!linha) return null;
      return linha[x] || null;
    }

    /**
     * Diz se a luz de uma casa está acesa.
     * @param {number} x - Coluna.
     * @param {number} y - Linha.
     * @returns {boolean} true se acesa.
     */
    estaAceso(x, y) {
      return this.luzes.has(chaveCasa(x, y));
    }

    /**
     * Diz se todas as luzes azuis da fase estão acesas.
     * @returns {boolean} true quando a fase foi vencida.
     */
    estaConcluido() {
      return this.luzes.size === this.totalAzuis;
    }

    /**
     * Executa um comando básico (não função) e devolve o efeito para a animação.
     * @param {string} comando - Um dos COMANDOS básicos.
     * @returns {{tipo: string, de: object, para: object}} Efeito do comando.
     * @throws {Error} Se o comando não for básico.
     */
    aplicar(comando) {
      const acao = this.acoes[comando];
      if (!acao) throw new Error(`Comando sem ação no mundo: ${comando}`);

      const de = { ...this.robo };
      const tipo = acao();
      return { tipo, de, para: { ...this.robo } };
    }

    /**
     * Gira o robô 90 graus.
     * @param {number} sentido - -1 para a esquerda, 1 para a direita.
     * @returns {string} Efeito VIROU.
     */
    virar(sentido) {
      this.robo.direcao = (this.robo.direcao + sentido + TOTAL_DIRECOES) % TOTAL_DIRECOES;
      return EFEITO.VIROU;
    }

    /**
     * Anda ou pula para a casa da frente, se a regra de altura permitir.
     * Andar: mesma altura. Pular: exatamente 1 acima, ou qualquer altura abaixo.
     * @param {boolean} pulando - true para Pular, false para Andar.
     * @returns {string} Efeito ANDOU, PULOU ou PARADO.
     */
    mover(pulando) {
      const { dx, dy } = DESLOCAMENTO_DIRECAO[this.robo.direcao];
      const destinoX = this.robo.x + dx;
      const destinoY = this.robo.y + dy;
      const atual = this.obterLadrilho(this.robo.x, this.robo.y);
      const destino = this.obterLadrilho(destinoX, destinoY);
      if (!destino) return EFEITO.PARADO;

      const diferenca = destino.altura - atual.altura;
      const podePular = diferenca === 1 || diferenca < 0;
      const podeMover = pulando ? podePular : diferenca === 0;
      if (!podeMover) return EFEITO.PARADO;

      this.robo.x = destinoX;
      this.robo.y = destinoY;
      return pulando ? EFEITO.PULOU : EFEITO.ANDOU;
    }

    /**
     * Acende (ou apaga, se já acesa) a luz do ladrilho azul onde o robô está.
     * @returns {string} Efeito ACENDEU, ou PARADO se o ladrilho não for azul.
     */
    acender() {
      const ladrilho = this.obterLadrilho(this.robo.x, this.robo.y);
      if (!ladrilho.azul) return EFEITO.PARADO;

      const chave = chaveCasa(this.robo.x, this.robo.y);
      if (this.luzes.has(chave)) this.luzes.delete(chave);
      else this.luzes.add(chave);
      return EFEITO.ACENDEU;
    }
  }

  RoboLuz.Mundo = Mundo;
  RoboLuz.EFEITO = EFEITO;
})(globalThis);
