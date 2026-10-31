/**
 * Editor do programa: paleta de comandos e as casas de Principal, F1 e F2.
 * Cuida só do DOM do editor e do programa em edição; avisa mudanças por callback.
 */
(function registrarEditor(global) {
  const RoboLuz = (global.RoboLuz = global.RoboLuz || {});
  const { DESCRICAO_COMANDOS, LISTAS_PROGRAMA } = RoboLuz.constantes;

  const LISTA_PADRAO = LISTAS_PROGRAMA[0].chave;
  const SIMBOLO_DO_COMANDO = Object.fromEntries(
    DESCRICAO_COMANDOS.map((descricao) => [descricao.comando, descricao]),
  );
  const CLASSE = Object.freeze({
    LISTA_ATIVA: 'lista-programa--ativa',
    CASA_ATUAL: 'casa--atual',
    CASA_CHEIA: 'casa--cheia',
  });

  /**
   * Cria um programa vazio (uma lista por entrada de LISTAS_PROGRAMA).
   * @returns {Record<string, string[]>} Programa vazio.
   */
  function criarProgramaVazio() {
    return Object.fromEntries(LISTAS_PROGRAMA.map((lista) => [lista.chave, []]));
  }

  /**
   * Cria um botão com classe, texto e título.
   * @param {{classe: string, texto: string, titulo: string}} opcoes - Dados do botão.
   * @returns {HTMLButtonElement} Botão criado.
   */
  function criarBotao({ classe, texto, titulo }) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = classe;
    botao.textContent = texto;
    botao.title = titulo;
    return botao;
  }

  class EditorPrograma {
    /**
     * @param {{paleta: HTMLElement, listas: HTMLElement, aoMudar: Function, aoAvisar: Function}}
     *   dependencias - Contêineres do DOM e callbacks (programa mudou / mensagem ao jogador).
     */
    constructor({ paleta, listas, aoMudar, aoAvisar }) {
      this.paleta = paleta;
      this.listas = listas;
      this.aoMudar = aoMudar;
      this.aoAvisar = aoAvisar;
      this.programa = criarProgramaVazio();
      this.listaSelecionada = LISTA_PADRAO;
      this.estaBloqueado = false;
      this.elementosDasListas = {};
    }

    /** Monta a paleta e as listas no DOM (uma vez). */
    montar() {
      DESCRICAO_COMANDOS.forEach((descricao) => {
        const botao = criarBotao({
          classe: `comando comando--${descricao.comando}`,
          texto: descricao.simbolo,
          titulo: descricao.titulo,
        });
        botao.addEventListener('click', () => this.adicionar(descricao.comando));
        this.paleta.appendChild(botao);
      });
      LISTAS_PROGRAMA.forEach((lista) => this.montarLista(lista));
      this.desenhar();
    }

    /**
     * Monta o bloco de uma lista (título + casas).
     * @param {{chave: string, titulo: string, casas: number}} lista - Lista do programa.
     */
    montarLista(lista) {
      const bloco = document.createElement('section');
      bloco.className = 'lista-programa';
      const titulo = criarBotao({ classe: 'lista-programa__titulo', texto: lista.titulo,
        titulo: `Clique para colocar os próximos comandos em ${lista.titulo}` });
      const casas = document.createElement('div');
      casas.className = 'lista-programa__casas';

      titulo.addEventListener('click', () => this.selecionarLista(lista.chave));
      bloco.addEventListener('click', () => this.selecionarLista(lista.chave));
      bloco.append(titulo, casas);
      this.listas.appendChild(bloco);
      this.elementosDasListas[lista.chave] = { bloco, casas, total: lista.casas };
    }

    /**
     * Escolhe em qual lista os próximos comandos entram.
     * @param {string} chave - Chave da lista.
     */
    selecionarLista(chave) {
      this.listaSelecionada = chave;
      this.desenhar();
    }

    /**
     * Acrescenta um comando no fim da lista selecionada.
     * @param {string} comando - Comando da paleta.
     */
    adicionar(comando) {
      if (this.estaBloqueado) return;

      const lista = this.programa[this.listaSelecionada];
      const limite = this.elementosDasListas[this.listaSelecionada].total;
      if (lista.length >= limite) {
        this.aoAvisar(RoboLuz.constantes.MENSAGENS.LISTA_CHEIA);
        return;
      }
      lista.push(comando);
      this.registrarMudanca();
    }

    /**
     * Remove o comando de uma casa.
     * @param {string} chave - Lista.
     * @param {number} indice - Casa.
     */
    remover(chave, indice) {
      if (this.estaBloqueado) return;

      this.programa[chave].splice(indice, 1);
      this.registrarMudanca();
    }

    /** Apaga todas as listas. */
    limpar() {
      if (this.estaBloqueado) return;

      this.programa = criarProgramaVazio();
      this.registrarMudanca();
    }

    /** Redesenha e avisa quem usa o editor que o programa mudou. */
    registrarMudanca() {
      this.desenhar();
      this.aoMudar(this.obterPrograma());
    }

    /**
     * Troca o programa em edição (ex.: ao abrir uma fase com programa salvo).
     * @param {Record<string, string[]>|undefined} programa - Programa salvo, ou nada.
     */
    definirPrograma(programa) {
      const vazio = criarProgramaVazio();
      Object.keys(vazio).forEach((chave) => {
        const salvo = programa && Array.isArray(programa[chave]) ? programa[chave] : [];
        vazio[chave] = salvo.filter((comando) => SIMBOLO_DO_COMANDO[comando]);
      });
      this.programa = vazio;
      this.listaSelecionada = LISTA_PADRAO;
      this.desenhar();
    }

    /**
     * Devolve uma cópia do programa.
     * @returns {Record<string, string[]>} Programa.
     */
    obterPrograma() {
      const copias = Object.entries(this.programa).map(([chave, lista]) => [chave, [...lista]]);
      return Object.fromEntries(copias);
    }

    /**
     * Liga ou desliga a edição (desligada durante a execução).
     * @param {boolean} estaBloqueado - true para bloquear.
     */
    bloquear(estaBloqueado) {
      this.estaBloqueado = estaBloqueado;
      this.listas.classList.toggle('listas--bloqueadas', estaBloqueado);
      this.paleta.classList.toggle('paleta--bloqueada', estaBloqueado);
    }

    /**
     * Destaca a casa do comando em execução.
     * @param {string|null} chave - Lista do passo, ou null para limpar.
     * @param {number} [indice] - Casa do passo.
     */
    destacar(chave, indice) {
      this.listas.querySelectorAll(`.${CLASSE.CASA_ATUAL}`)
        .forEach((casa) => casa.classList.remove(CLASSE.CASA_ATUAL));
      if (!chave) return;

      const casa = this.elementosDasListas[chave].casas.children[indice];
      if (casa) casa.classList.add(CLASSE.CASA_ATUAL);
    }

    /** Redesenha as casas de todas as listas. */
    desenhar() {
      Object.entries(this.elementosDasListas).forEach(([chave, elementos]) => {
        elementos.bloco.classList.toggle(CLASSE.LISTA_ATIVA, chave === this.listaSelecionada);
        elementos.casas.replaceChildren(...this.criarCasas(chave, elementos.total));
      });
    }

    /**
     * Cria os elementos das casas de uma lista.
     * @param {string} chave - Lista.
     * @param {number} total - Quantidade de casas.
     * @returns {HTMLElement[]} Casas.
     */
    criarCasas(chave, total) {
      const comandos = this.programa[chave];
      return Array.from({ length: total }, (_, indice) => {
        const comando = comandos[indice];
        if (!comando) return criarBotao({ classe: 'casa', texto: '', titulo: 'Casa vazia' });

        const descricao = SIMBOLO_DO_COMANDO[comando];
        const casa = criarBotao({ classe: `casa ${CLASSE.CASA_CHEIA} comando--${comando}`,
          texto: descricao.simbolo, titulo: `${descricao.titulo} (clique para tirar)` });
        casa.addEventListener('click', (evento) => {
          evento.stopPropagation();
          this.remover(chave, indice);
        });
        return casa;
      });
    }
  }

  RoboLuz.EditorPrograma = EditorPrograma;
})(globalThis);
