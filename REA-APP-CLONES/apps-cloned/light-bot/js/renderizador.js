/**
 * Renderizador isométrico do Robô de Luz: desenha o tabuleiro e o robô num <canvas>.
 * Recebe a paleta de cores (lida dos tokens CSS) por injeção; não conhece regras do jogo.
 */
(function registrarRenderizador(global) {
  const RoboLuz = (global.RoboLuz = global.RoboLuz || {});
  const { DESENHO } = RoboLuz.constantes;

  const MEIA_LARGURA = DESENHO.LARGURA_LADRILHO / 2;
  const QUARTO_LARGURA = DESENHO.LARGURA_LADRILHO / 4;
  const MARGEM_LATERAL = 24;
  const PROFUNDIDADE_ROBO = 0.5;
  const RAIO_CABECA = 9;
  const LARGURA_CORPO = 22;
  const ALTURA_CORPO = 20;

  class Renderizador {
    /**
     * @param {HTMLCanvasElement} canvas - Área de desenho.
     * @param {Record<string, string>} paleta - Cores (fundo, topo, lado, azul, aceso, robo...).
     */
    constructor(canvas, paleta) {
      this.canvas = canvas;
      this.contexto = canvas.getContext('2d');
      this.paleta = paleta;
      this.origem = { x: 0, y: 0 };
    }

    /**
     * Projeta um ponto do mundo (x, y, z em ladrilhos/blocos) na tela.
     * @param {number} x - Coluna.
     * @param {number} y - Linha.
     * @param {number} z - Altura em blocos.
     * @returns {{x: number, y: number}} Ponto em pixels.
     */
    projetar(x, y, z) {
      return {
        x: this.origem.x + (x - y) * MEIA_LARGURA,
        y: this.origem.y + (x + y) * QUARTO_LARGURA - z * DESENHO.ALTURA_BLOCO,
      };
    }

    /**
     * Ajusta o tamanho do canvas e a origem para caber o tabuleiro inteiro.
     * @param {Array<Array<{altura: number}|null>>} grade - Grade da fase.
     */
    configurar(grade) {
      const linhas = grade.length;
      const colunas = Math.max(...grade.map((linha) => linha.length));
      const alturas = grade.flat().map((ladrilho) => (ladrilho ? ladrilho.altura : 0));
      const alturaMaxima = Math.max(...alturas);
      const largura = (colunas + linhas) * MEIA_LARGURA + MARGEM_LATERAL * 2;
      const alturaTela = (colunas + linhas) * QUARTO_LARGURA
        + alturaMaxima * DESENHO.ALTURA_BLOCO + DESENHO.MARGEM_TOPO * 2;
      const escala = global.devicePixelRatio || 1;

      this.canvas.width = Math.round(largura * escala);
      this.canvas.height = Math.round(alturaTela * escala);
      this.canvas.style.aspectRatio = `${largura} / ${alturaTela}`;
      this.contexto.setTransform(escala, 0, 0, escala, 0, 0);
      this.origem = {
        x: MARGEM_LATERAL + linhas * MEIA_LARGURA,
        y: DESENHO.MARGEM_TOPO + alturaMaxima * DESENHO.ALTURA_BLOCO,
      };
      this.tamanho = { largura, altura: alturaTela };
    }

    /**
     * Desenha a cena inteira.
     * @param {RoboLuz.Mundo} mundo - Estado do tabuleiro e das luzes.
     * @param {{x: number, y: number, altura: number, angulo: number, brilho: number}} robo -
     *   Posição visual (contínua) do robô.
     */
    desenhar(mundo, robo) {
      const contexto = this.contexto;
      contexto.clearRect(0, 0, this.tamanho.largura, this.tamanho.altura);

      const profundidadeRobo = robo.x + robo.y + PROFUNDIDADE_ROBO;
      let roboDesenhado = false;
      for (const casa of this.listarCasasEmOrdem(mundo.grade)) {
        if (!roboDesenhado && casa.x + casa.y > profundidadeRobo) {
          this.desenharRobo(robo);
          roboDesenhado = true;
        }
        this.desenharColuna(casa, mundo.estaAceso(casa.x, casa.y));
      }
      if (!roboDesenhado) this.desenharRobo(robo);
    }

    /**
     * Lista as casas com ladrilho, de trás para a frente (ordem do pintor).
     * @param {Array<Array<object|null>>} grade - Grade da fase.
     * @returns {Array<{x: number, y: number, altura: number, azul: boolean}>} Casas ordenadas.
     */
    listarCasasEmOrdem(grade) {
      const casas = [];
      grade.forEach((linha, y) => {
        linha.forEach((ladrilho, x) => {
          if (ladrilho) casas.push({ x, y, altura: ladrilho.altura, azul: ladrilho.azul });
        });
      });
      return casas.sort((a, b) => a.x + a.y - (b.x + b.y) || a.x - b.x);
    }

    /**
     * Desenha um polígono preenchido com contorno.
     * @param {Array<{x: number, y: number}>} pontos - Vértices na tela.
     * @param {string} cor - Cor de preenchimento.
     */
    preencherPoligono(pontos, cor) {
      const contexto = this.contexto;
      contexto.beginPath();
      contexto.moveTo(pontos[0].x, pontos[0].y);
      pontos.slice(1).forEach((ponto) => contexto.lineTo(ponto.x, ponto.y));
      contexto.closePath();
      contexto.fillStyle = cor;
      contexto.fill();
      contexto.strokeStyle = this.paleta.contorno;
      contexto.lineWidth = 1;
      contexto.stroke();
    }

    /**
     * Desenha a coluna de um ladrilho: dois lados visíveis e o topo.
     * @param {{x: number, y: number, altura: number, azul: boolean}} casa - Casa a desenhar.
     * @param {boolean} aceso - Se a luz da casa está acesa.
     */
    desenharColuna(casa, aceso) {
      const { x, y, altura } = casa;
      const p = (dx, dy, z) => this.projetar(x + dx, y + dy, z);

      const ladoEsquerdo = [p(0, 1, altura), p(1, 1, altura), p(1, 1, 0), p(0, 1, 0)];
      const ladoDireito = [p(1, 0, altura), p(1, 1, altura), p(1, 1, 0), p(1, 0, 0)];
      const topo = [p(0, 0, altura), p(1, 0, altura), p(1, 1, altura), p(0, 1, altura)];

      this.preencherPoligono(ladoEsquerdo, this.paleta.ladoEsquerdo);
      this.preencherPoligono(ladoDireito, this.paleta.ladoDireito);
      this.desenharLinhasDeBloco(casa);
      this.preencherPoligono(topo, this.escolherCorDoTopo(casa.azul, aceso));
      if (aceso) this.desenharBrilho(this.projetar(x + 0.5, y + 0.5, altura));
    }

    /**
     * Escolhe a cor do topo do ladrilho.
     * @param {boolean} azul - Se o ladrilho tem luz.
     * @param {boolean} aceso - Se a luz está acesa.
     * @returns {string} Cor do topo.
     */
    escolherCorDoTopo(azul, aceso) {
      if (aceso) return this.paleta.aceso;
      if (azul) return this.paleta.azul;
      return this.paleta.topo;
    }

    /**
     * Risca a divisa entre os blocos empilhados nos lados da coluna.
     * @param {{x: number, y: number, altura: number}} casa - Casa da coluna.
     */
    desenharLinhasDeBloco(casa) {
      const contexto = this.contexto;
      contexto.strokeStyle = this.paleta.contorno;
      contexto.lineWidth = 0.6;
      for (let nivel = 1; nivel < casa.altura; nivel += 1) {
        const a = this.projetar(casa.x, casa.y + 1, nivel);
        const b = this.projetar(casa.x + 1, casa.y + 1, nivel);
        const c = this.projetar(casa.x + 1, casa.y, nivel);
        contexto.beginPath();
        contexto.moveTo(a.x, a.y);
        contexto.lineTo(b.x, b.y);
        contexto.lineTo(c.x, c.y);
        contexto.stroke();
      }
    }

    /**
     * Desenha o halo de luz sobre um ladrilho aceso.
     * @param {{x: number, y: number}} centro - Centro do topo na tela.
     */
    desenharBrilho(centro) {
      const contexto = this.contexto;
      const { x, y } = centro;
      const gradiente = contexto.createRadialGradient(x, y, 2, x, y, MEIA_LARGURA);
      gradiente.addColorStop(0, this.paleta.brilho);
      gradiente.addColorStop(1, 'transparent');
      contexto.fillStyle = gradiente;
      contexto.beginPath();
      contexto.ellipse(centro.x, centro.y, MEIA_LARGURA, QUARTO_LARGURA, 0, 0, Math.PI * 2);
      contexto.fill();
    }

    /**
     * Calcula o vetor de tela (unitário) para onde o robô olha.
     * @param {number} angulo - Direção contínua (0 = norte, 1 = leste, 2 = sul, 3 = oeste).
     * @returns {{x: number, y: number}} Vetor na tela.
     */
    vetorDoOlhar(angulo) {
      const radianos = (angulo * Math.PI) / 2;
      const mundoX = Math.sin(radianos);
      const mundoY = -Math.cos(radianos);
      const telaX = (mundoX - mundoY) * MEIA_LARGURA;
      const telaY = (mundoX + mundoY) * QUARTO_LARGURA;
      const comprimento = Math.hypot(telaX, telaY) || 1;
      return { x: telaX / comprimento, y: telaY / comprimento };
    }

    /**
     * Desenha o robô (sombra, corpo, cabeça, visor e antena).
     * @param {{x: number, y: number, altura: number, chao: number, angulo: number, brilho: number}}
     *   robo - Posição visual do robô.
     */
    desenharRobo(robo) {
      const contexto = this.contexto;
      const chao = this.projetar(robo.x + 0.5, robo.y + 0.5, robo.chao);
      const base = this.projetar(robo.x + 0.5, robo.y + 0.5, robo.altura);

      contexto.fillStyle = this.paleta.sombra;
      contexto.beginPath();
      contexto.ellipse(chao.x, chao.y, 14, 7, 0, 0, Math.PI * 2);
      contexto.fill();

      const topoCorpo = base.y - ALTURA_CORPO - 4;
      contexto.fillStyle = this.paleta.robo;
      contexto.strokeStyle = this.paleta.contorno;
      contexto.beginPath();
      contexto.roundRect(base.x - LARGURA_CORPO / 2, topoCorpo, LARGURA_CORPO, ALTURA_CORPO, 6);
      contexto.fill();
      contexto.stroke();

      const cabeca = { x: base.x, y: topoCorpo - RAIO_CABECA + 2 };
      this.desenharCabeca(cabeca, robo);
    }

    /**
     * Desenha a cabeça, o visor virado para a direção e a antena com luz.
     * @param {{x: number, y: number}} cabeca - Centro da cabeça.
     * @param {{angulo: number, brilho: number}} robo - Direção e brilho da antena (0 a 1).
     */
    desenharCabeca(cabeca, robo) {
      const contexto = this.contexto;
      contexto.fillStyle = this.paleta.robo;
      contexto.beginPath();
      contexto.arc(cabeca.x, cabeca.y, RAIO_CABECA, 0, Math.PI * 2);
      contexto.fill();
      contexto.stroke();

      const olhar = this.vetorDoOlhar(robo.angulo);
      const olhandoParaFrente = olhar.y > -0.2;
      if (olhandoParaFrente) {
        contexto.fillStyle = this.paleta.visor;
        contexto.beginPath();
        contexto.ellipse(cabeca.x + olhar.x * 4, cabeca.y + 1, 5, 3.2, 0, 0, Math.PI * 2);
        contexto.fill();
      }

      const ponta = { x: cabeca.x, y: cabeca.y - RAIO_CABECA - 8 };
      contexto.beginPath();
      contexto.moveTo(cabeca.x, cabeca.y - RAIO_CABECA);
      contexto.lineTo(ponta.x, ponta.y);
      contexto.stroke();
      contexto.fillStyle = robo.brilho > 0 ? this.paleta.aceso : this.paleta.visor;
      contexto.beginPath();
      contexto.arc(ponta.x, ponta.y, 3 + robo.brilho * 3, 0, Math.PI * 2);
      contexto.fill();
    }
  }

  RoboLuz.Renderizador = Renderizador;
})(globalThis);
