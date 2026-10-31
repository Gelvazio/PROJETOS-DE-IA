/**
 * Executor: pede os passos ao interpretador, aplica cada um no mundo e anima o robô.
 * Recebe renderizador e callback de destaque por injeção (não conhece o DOM do editor).
 */
(function registrarExecutor(global) {
  const RoboLuz = (global.RoboLuz = global.RoboLuz || {});
  const { TEMPO, DESENHO } = RoboLuz.constantes;
  const { gerarPassos, FIM } = RoboLuz.interpretador;
  const EFEITO = RoboLuz.EFEITO;

  /** Resultados possíveis de uma execução. */
  const RESULTADO = Object.freeze({
    VITORIA: 'vitoria',
    FALHOU: 'falhou',
    LIMITE: 'limite',
    CANCELADO: 'cancelado',
  });

  /** Resultado de cada motivo de fim do interpretador. */
  const RESULTADO_DO_FIM = Object.freeze({
    [FIM.TERMINOU]: RESULTADO.FALHOU,
    [FIM.LIMITE]: RESULTADO.LIMITE,
  });

  const ALTURA_PULO_EM_BLOCOS = DESENHO.ALTURA_PULO / DESENHO.ALTURA_BLOCO;

  /**
   * Interpola linearmente entre dois números.
   * @param {number} inicio - Valor em t = 0.
   * @param {number} fim - Valor em t = 1.
   * @param {number} t - Progresso de 0 a 1.
   * @returns {number} Valor interpolado.
   */
  function interpolar(inicio, fim, t) {
    return inicio + (fim - inicio) * t;
  }

  /**
   * Espera o próximo quadro de animação.
   * @returns {Promise<number>} Horário do quadro.
   */
  function proximoQuadro() {
    return new Promise((resolver) => global.requestAnimationFrame(resolver));
  }

  class Executor {
    /**
     * @param {{renderizador: RoboLuz.Renderizador, aoDestacar: Function}} dependencias -
     *   Renderizador e função chamada com (lista, indice) do passo atual (ou null ao fim).
     */
    constructor({ renderizador, aoDestacar }) {
      this.renderizador = renderizador;
      this.aoDestacar = aoDestacar;
      this.execucaoAtual = 0;
      this.angulo = 0;
    }

    /**
     * Desenha o mundo parado, com o robô na posição real.
     * @param {RoboLuz.Mundo} mundo - Mundo a desenhar.
     */
    mostrar(mundo) {
      this.angulo = mundo.robo.direcao;
      this.renderizador.desenhar(mundo, this.posicaoVisual(mundo, mundo.robo));
    }

    /**
     * Interrompe a execução em andamento (se houver).
     */
    parar() {
      this.execucaoAtual += 1;
      this.aoDestacar(null);
    }

    /**
     * Executa o programa no mundo, passo a passo, com animação.
     * @param {{mundo: RoboLuz.Mundo, programa: object, rapido: boolean}} pedido - O que executar.
     * @returns {Promise<string>} Um dos RESULTADO.
     */
    async executar({ mundo, programa, rapido }) {
      const execucao = ++this.execucaoAtual;
      const duracao = rapido ? TEMPO.PASSO_RAPIDO_MS : TEMPO.PASSO_MS;
      const passos = gerarPassos(programa);

      for (let item = passos.next(); ; item = passos.next()) {
        if (execucao !== this.execucaoAtual) return RESULTADO.CANCELADO;
        if (item.done) return this.concluir(RESULTADO_DO_FIM[item.value]);

        this.aoDestacar(item.value.lista, item.value.indice);
        const efeito = mundo.aplicar(item.value.comando);
        await this.animar({ mundo, efeito, duracao, execucao });
        if (mundo.estaConcluido()) return this.concluir(RESULTADO.VITORIA);
      }
    }

    /**
     * Limpa o destaque e devolve o resultado.
     * @param {string} resultado - Resultado final.
     * @returns {string} O mesmo resultado.
     */
    concluir(resultado) {
      this.aoDestacar(null);
      return resultado;
    }

    /**
     * Anima o efeito de um passo durante `duracao` milissegundos.
     * @param {{mundo: object, efeito: object, duracao: number, execucao: number}} animacao -
     *   Mundo, efeito do passo, duração e número da execução (para cancelar).
     * @returns {Promise<void>} Resolve ao fim da animação.
     */
    async animar({ mundo, efeito, duracao, execucao }) {
      const anguloInicial = this.angulo;
      const anguloFinal = anguloInicial + this.giroDoEfeito(efeito);
      const inicio = await proximoQuadro();

      for (let agora = inicio; ; agora = await proximoQuadro()) {
        if (execucao !== this.execucaoAtual) return;

        const t = Math.min(1, (agora - inicio) / duracao);
        this.angulo = interpolar(anguloInicial, anguloFinal, t);
        this.renderizador.desenhar(mundo, this.posicaoAnimada(mundo, efeito, t));
        if (t >= 1) return;
      }
    }

    /**
     * Quanto o robô gira num efeito (em quartos de volta), pelo caminho mais curto.
     * @param {{tipo: string, de: object, para: object}} efeito - Efeito do passo.
     * @returns {number} -1, 0 ou 1.
     */
    giroDoEfeito(efeito) {
      if (efeito.tipo !== EFEITO.VIROU) return 0;

      const diferenca = (efeito.para.direcao - efeito.de.direcao + 4) % 4;
      return diferenca === 1 ? 1 : -1;
    }

    /**
     * Posição visual do robô parado numa casa.
     * @param {RoboLuz.Mundo} mundo - Mundo (para ler a altura do ladrilho).
     * @param {{x: number, y: number}} posicao - Casa do robô.
     * @returns {object} Posição visual.
     */
    posicaoVisual(mundo, posicao) {
      const altura = mundo.obterLadrilho(posicao.x, posicao.y).altura;
      return { x: posicao.x, y: posicao.y, altura, chao: altura, angulo: this.angulo, brilho: 0 };
    }

    /**
     * Posição visual do robô no instante t de um efeito (anda, pula, vira ou acende).
     * @param {RoboLuz.Mundo} mundo - Mundo.
     * @param {{tipo: string, de: object, para: object}} efeito - Efeito do passo.
     * @param {number} t - Progresso de 0 a 1.
     * @returns {object} Posição visual.
     */
    posicaoAnimada(mundo, efeito, t) {
      const de = this.posicaoVisual(mundo, efeito.de);
      const para = this.posicaoVisual(mundo, efeito.para);
      const chao = interpolar(de.altura, para.altura, t);
      const arco = efeito.tipo === EFEITO.PULOU ? 4 * t * (1 - t) * ALTURA_PULO_EM_BLOCOS : 0;
      const brilho = efeito.tipo === EFEITO.ACENDEU ? 1 - t : 0;

      return {
        x: interpolar(de.x, para.x, t),
        y: interpolar(de.y, para.y, t),
        altura: chao + arco,
        chao,
        angulo: this.angulo,
        brilho,
      };
    }
  }

  RoboLuz.Executor = Executor;
  RoboLuz.RESULTADO = RESULTADO;
})(globalThis);
