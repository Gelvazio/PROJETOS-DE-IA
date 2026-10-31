/**
 * Fases do Robô de Luz (criadas para este clone) e leitor do formato de texto.
 *
 * Formato do mapa: uma string por linha (y), casas separadas por espaço (x).
 * "." = vazio; número = altura do ladrilho; sufixo "b" = ladrilho azul (luz a acender).
 * Início: { x, y, direcao } com direcao em N, L, S ou O.
 */
(function registrarFases(global) {
  const RoboLuz = (global.RoboLuz = global.RoboLuz || {});
  const { LETRA_DIRECAO } = RoboLuz.constantes;

  const CASA_VAZIA = '.';
  const SUFIXO_AZUL = 'b';

  const FASES = [
    {
      nome: 'Primeiros passos',
      dica: 'Ande até o ladrilho azul e acenda a luz.',
      mapa: ['1 1 1 1b'],
      inicio: { x: 0, y: 0, direcao: 'L' },
    },
    {
      nome: 'Virando a esquina',
      dica: 'Use Virar à direita para mudar de direção.',
      mapa: ['1 1 1', '. . 1', '. . 1b'],
      inicio: { x: 0, y: 0, direcao: 'L' },
    },
    {
      nome: 'Primeiro pulo',
      dica: 'Andar não sobe degrau: use Pular.',
      mapa: ['1 1 2 2b'],
      inicio: { x: 0, y: 0, direcao: 'L' },
    },
    {
      nome: 'Sobe e desce',
      dica: 'Pular também serve para descer.',
      mapa: ['1b 2 3b 2 1b'],
      inicio: { x: 0, y: 0, direcao: 'L' },
    },
    {
      nome: 'Quatro cantos',
      dica: 'O que se repete cabe numa função: coloque em F1 e chame F1 no Principal.',
      mapa: ['1b 1 1 1 1b', '1 . . . 1', '1 . . . 1', '1 . . . 1', '1b 1 1 1 1b'],
      inicio: { x: 0, y: 0, direcao: 'L' },
    },
    {
      nome: 'Escadaria',
      dica: 'Cada degrau é igual: pule e acenda.',
      mapa: ['1 2b 3b 4b 5b 6b 7b 8b'],
      inicio: { x: 0, y: 0, direcao: 'L' },
    },
    {
      nome: 'Zigue-zague',
      dica: 'Ache o trecho que se repete na subida.',
      mapa: ['1 2 . . .', '. 3b 4 . .', '. . 5b 6 .', '. . . 7b 8b'],
      inicio: { x: 0, y: 0, direcao: 'L' },
    },
    {
      nome: 'Corredor longo',
      dica: 'Uma função pode chamar outra — ou ela mesma.',
      mapa: [Array(20).fill('1b').join(' ')],
      inicio: { x: 0, y: 0, direcao: 'L' },
    },
    {
      nome: 'Torres',
      dica: 'F1 visita uma torre e volta; F2 pode usar F1.',
      mapa: ['1 1 1 1 1 1 1', '2b . 2b . 2b . 2b'],
      inicio: { x: 0, y: 0, direcao: 'L' },
    },
    {
      nome: 'Espiral',
      dica: 'Suba a espiral girando sempre para o mesmo lado.',
      mapa: ['1 2b 3', '8b . 4b', '7 6b 5'],
      inicio: { x: 0, y: 0, direcao: 'L' },
    },
  ];

  /**
   * Converte uma casa do mapa em ladrilho.
   * @param {string} texto - Casa no formato do mapa ("." , "2" ou "2b").
   * @returns {{altura: number, azul: boolean}|null} Ladrilho, ou null se vazio.
   * @throws {Error} Se a altura não for um número inteiro positivo.
   */
  function lerCasa(texto) {
    if (texto === CASA_VAZIA) return null;

    const azul = texto.endsWith(SUFIXO_AZUL);
    const altura = Number.parseInt(azul ? texto.slice(0, -1) : texto, 10);
    if (!Number.isInteger(altura) || altura < 1) throw new Error(`Casa inválida: ${texto}`);

    return { altura, azul };
  }

  /**
   * Monta a grade de ladrilhos a partir das linhas de texto do mapa.
   * @param {string[]} mapa - Linhas do mapa.
   * @returns {Array<Array<{altura: number, azul: boolean}|null>>} Grade [y][x].
   */
  function lerMapa(mapa) {
    return mapa.map((linha) => linha.trim().split(/\s+/).map(lerCasa));
  }

  /**
   * Lê a fase de número `indice` e devolve os dados prontos para o mundo.
   * @param {number} indice - Posição da fase (0 a FASES.length - 1).
   * @returns {{nome: string, dica: string, grade: Array, inicio: object}} Fase lida.
   * @throws {Error} Se o índice não existir.
   */
  function obterFase(indice) {
    const fase = FASES[indice];
    if (!fase) throw new Error(`Fase inexistente: ${indice}`);

    const direcao = LETRA_DIRECAO[fase.inicio.direcao];
    const inicio = { x: fase.inicio.x, y: fase.inicio.y, direcao };
    return { nome: fase.nome, dica: fase.dica, grade: lerMapa(fase.mapa), inicio };
  }

  RoboLuz.fases = Object.freeze({ total: FASES.length, obterFase });
})(globalThis);
