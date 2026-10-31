/**
 * Controlador do Robô de Luz: monta as peças (mundo, renderizador, executor, editor, progresso),
 * liga os botões e troca de fase. É o único arquivo que conhece todas as partes.
 */
(function registrarJogo(global) {
  const RoboLuz = (global.RoboLuz = global.RoboLuz || {});
  const { MENSAGENS, TEMPO } = RoboLuz.constantes;
  const { RESULTADO } = RoboLuz;

  /** Token CSS de cada cor usada no canvas. */
  const TOKENS_DA_PALETA = Object.freeze({
    topo: '--cor-ladrilho-topo',
    ladoEsquerdo: '--cor-ladrilho-lado-esquerdo',
    ladoDireito: '--cor-ladrilho-lado-direito',
    azul: '--cor-ladrilho-azul',
    aceso: '--cor-ladrilho-aceso',
    brilho: '--cor-brilho',
    contorno: '--cor-contorno',
    robo: '--cor-robo',
    visor: '--cor-visor',
    sombra: '--cor-sombra',
  });

  /** Mensagem e tipo de aviso para cada resultado de execução. */
  const AVISO_DO_RESULTADO = Object.freeze({
    [RESULTADO.VITORIA]: { texto: MENSAGENS.VITORIA, tipo: 'sucesso' },
    [RESULTADO.FALHOU]: { texto: MENSAGENS.FALHOU, tipo: 'erro' },
    [RESULTADO.LIMITE]: { texto: MENSAGENS.LIMITE, tipo: 'erro' },
  });

  /**
   * Lê as cores do canvas a partir dos tokens CSS do :root.
   * @returns {Record<string, string>} Paleta.
   */
  function lerPaleta() {
    const estilo = global.getComputedStyle(document.documentElement);
    return Object.fromEntries(Object.entries(TOKENS_DA_PALETA)
      .map(([nome, token]) => [nome, estilo.getPropertyValue(token).trim()]));
  }

  /**
   * Devolve o localStorage, ou null se o navegador bloquear o acesso.
   * @returns {Storage|null} Armazenamento.
   */
  function obterArmazenamento() {
    try {
      return global.localStorage;
    } catch (erro) {
      return null;
    }
  }

  class Jogo {
    /**
     * @param {Record<string, HTMLElement>} elementos - Elementos da página (ver iniciar()).
     */
    constructor(elementos) {
      this.elementos = elementos;
      this.progresso = new RoboLuz.Progresso(obterArmazenamento());
      this.renderizador = new RoboLuz.Renderizador(elementos.canvas, lerPaleta());
      this.editor = new RoboLuz.EditorPrograma({
        paleta: elementos.paleta,
        listas: elementos.listas,
        aoMudar: (programa) => this.progresso.salvarPrograma(this.indiceFase, programa),
        aoAvisar: (texto) => this.avisar(texto, 'erro'),
      });
      this.executor = new RoboLuz.Executor({
        renderizador: this.renderizador,
        aoDestacar: (lista, indice) => this.editor.destacar(lista, indice),
      });
      this.indiceFase = 0;
      this.estaExecutando = false;
    }

    /** Monta a tela, liga os botões e abre a primeira fase ainda não concluída. */
    iniciar() {
      this.editor.montar();
      this.ligarBotoes();
      this.abrirFase(this.escolherFaseInicial());
    }

    /**
     * Primeira fase liberada e não concluída (ou a última, se todas concluídas).
     * @returns {number} Índice da fase.
     */
    escolherFaseInicial() {
      for (let indice = 0; indice < RoboLuz.fases.total; indice += 1) {
        if (!this.progresso.estaConcluida(indice)) return indice;
      }
      return RoboLuz.fases.total - 1;
    }

    /** Liga os botões de controle. */
    ligarBotoes() {
      const { executar, reiniciar, limpar, rapido } = this.elementos;
      executar.addEventListener('click', () => this.executar());
      reiniciar.addEventListener('click', () => this.reiniciar());
      limpar.addEventListener('click', () => this.editor.limpar());
      rapido.addEventListener('change', () => rapido.blur());
    }

    /**
     * Abre uma fase: cria o mundo, ajusta o canvas e carrega o programa salvo.
     * @param {number} indice - Fase.
     */
    abrirFase(indice) {
      if (!this.progresso.estaLiberada(indice)) return;

      this.executor.parar();
      this.indiceFase = indice;
      this.fase = RoboLuz.fases.obterFase(indice);
      this.elementos.nomeFase.textContent = `Fase ${indice + 1} — ${this.fase.nome}`;
      this.elementos.dica.textContent = this.fase.dica;
      this.renderizador.configurar(this.fase.grade);
      this.editor.definirPrograma(this.progresso.obterPrograma(indice));
      this.reiniciar();
      this.desenharListaDeFases();
    }

    /** Volta o robô ao início da fase e apaga as luzes. */
    reiniciar() {
      this.executor.parar();
      this.definirExecutando(false);
      this.mundo = new RoboLuz.Mundo(RoboLuz.fases.obterFase(this.indiceFase));
      this.executor.mostrar(this.mundo);
      this.avisar('', '');
    }

    /** Executa o programa atual do começo da fase. */
    async executar() {
      if (this.estaExecutando) return;

      const programa = this.editor.obterPrograma();
      if (programa.principal.length === 0) {
        this.avisar(MENSAGENS.PROGRAMA_VAZIO, 'erro');
        return;
      }
      this.reiniciar();
      this.definirExecutando(true);
      const rapido = this.elementos.rapido.checked;
      const resultado = await this.executor.executar({ mundo: this.mundo, programa, rapido });
      if (resultado === RESULTADO.CANCELADO) return;

      this.definirExecutando(false);
      this.mostrarResultado(resultado);
    }

    /**
     * Mostra o aviso do resultado e, na vitória, libera a próxima fase.
     * @param {string} resultado - Um dos RESULTADO.
     */
    mostrarResultado(resultado) {
      const aviso = AVISO_DO_RESULTADO[resultado];
      this.avisar(aviso.texto, aviso.tipo);
      if (resultado !== RESULTADO.VITORIA) return;

      this.progresso.marcarConcluida(this.indiceFase);
      this.desenharListaDeFases();
      const proxima = this.indiceFase + 1;
      const temProxima = proxima < RoboLuz.fases.total;
      if (temProxima) global.setTimeout(() => this.abrirFaseSeParado(proxima), TEMPO.AVISO_MS);
    }

    /**
     * Abre a fase só se o jogador não começou outra execução nesse meio-tempo.
     * @param {number} indice - Fase.
     */
    abrirFaseSeParado(indice) {
      if (!this.estaExecutando) this.abrirFase(indice);
    }

    /**
     * Liga o modo "executando" (bloqueia a edição e troca o rótulo do botão).
     * @param {boolean} estaExecutando - true durante a execução.
     */
    definirExecutando(estaExecutando) {
      this.estaExecutando = estaExecutando;
      this.editor.bloquear(estaExecutando);
      this.elementos.executar.disabled = estaExecutando;
    }

    /**
     * Mostra uma mensagem sobre o palco.
     * @param {string} texto - Mensagem (vazia para esconder).
     * @param {string} tipo - "sucesso", "erro" ou "".
     */
    avisar(texto, tipo) {
      const { aviso } = this.elementos;
      aviso.textContent = texto;
      aviso.className = tipo ? `aviso aviso--${tipo}` : 'aviso';
      aviso.hidden = !texto;
    }

    /** Redesenha os botões das fases (liberada, concluída, atual). */
    desenharListaDeFases() {
      const botoes = Array.from({ length: RoboLuz.fases.total }, (_, indice) => {
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'fase';
        botao.textContent = String(indice + 1);
        botao.disabled = !this.progresso.estaLiberada(indice);
        botao.classList.toggle('fase--concluida', this.progresso.estaConcluida(indice));
        botao.classList.toggle('fase--atual', indice === this.indiceFase);
        botao.addEventListener('click', () => this.abrirFase(indice));
        return botao;
      });
      this.elementos.listaFases.replaceChildren(...botoes);
    }
  }

  /** Lê os elementos da página e começa o jogo. */
  function iniciar() {
    const buscar = (id) => document.getElementById(id);
    const jogo = new Jogo({
      canvas: buscar('palco'),
      aviso: buscar('aviso'),
      paleta: buscar('paleta'),
      listas: buscar('listas'),
      executar: buscar('botao-executar'),
      reiniciar: buscar('botao-reiniciar'),
      limpar: buscar('botao-limpar'),
      rapido: buscar('opcao-rapido'),
      nomeFase: buscar('nome-fase'),
      dica: buscar('dica'),
      listaFases: buscar('lista-fases'),
    });
    jogo.iniciar();
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})(globalThis);
