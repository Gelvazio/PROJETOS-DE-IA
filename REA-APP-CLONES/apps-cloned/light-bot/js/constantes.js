/**
 * Constantes do Robô de Luz: comandos, direções, limites e medidas do desenho.
 * Scripts clássicos (sem módulos ES) para a página abrir com duplo clique (file://).
 */
(function registrarConstantes(global) {
  const RoboLuz = (global.RoboLuz = global.RoboLuz || {});

  const COMANDOS = Object.freeze({
    ANDAR: 'andar',
    VIRAR_ESQUERDA: 'virarEsquerda',
    VIRAR_DIREITA: 'virarDireita',
    PULAR: 'pular',
    ACENDER: 'acender',
    F1: 'f1',
    F2: 'f2',
  });

  /** Símbolo e descrição de cada comando, na ordem da paleta. */
  const DESCRICAO_COMANDOS = Object.freeze([
    { comando: COMANDOS.ANDAR, simbolo: '⬆', titulo: 'Andar para a frente' },
    { comando: COMANDOS.VIRAR_ESQUERDA, simbolo: '↶', titulo: 'Virar à esquerda' },
    { comando: COMANDOS.VIRAR_DIREITA, simbolo: '↷', titulo: 'Virar à direita' },
    { comando: COMANDOS.PULAR, simbolo: '⤴', titulo: 'Pular (sobe 1 ou desce)' },
    { comando: COMANDOS.ACENDER, simbolo: '💡', titulo: 'Acender / apagar a luz' },
    { comando: COMANDOS.F1, simbolo: 'F1', titulo: 'Chamar a função F1' },
    { comando: COMANDOS.F2, simbolo: 'F2', titulo: 'Chamar a função F2' },
  ]);

  /** Listas do programa e quantas casas cada uma tem. */
  const LISTAS_PROGRAMA = Object.freeze([
    { chave: 'principal', titulo: 'Principal', casas: 12 },
    { chave: 'f1', titulo: 'F1', casas: 8 },
    { chave: 'f2', titulo: 'F2', casas: 8 },
  ]);

  /** Lista chamada por cada comando de função. */
  const LISTA_DA_FUNCAO = Object.freeze({ f1: 'f1', f2: 'f2' });

  /** Direções no sentido horário: 0 = norte (y-1), 1 = leste, 2 = sul, 3 = oeste. */
  const DESLOCAMENTO_DIRECAO = Object.freeze([
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
  ]);

  const LETRA_DIRECAO = Object.freeze({ N: 0, L: 1, S: 2, O: 3 });

  const LIMITES = Object.freeze({ PASSOS: 1000, PILHA: 200 });

  const TEMPO = Object.freeze({ PASSO_MS: 380, PASSO_RAPIDO_MS: 120, AVISO_MS: 2600 });

  const DESENHO = Object.freeze({
    LARGURA_LADRILHO: 64,
    ALTURA_BLOCO: 16,
    ALTURA_PULO: 26,
    MARGEM_TOPO: 70,
  });

  const CHAVE_PROGRESSO = 'robo-de-luz:progresso';

  const MENSAGENS = Object.freeze({
    VITORIA: 'Todas as luzes acesas! Fase concluída.',
    FALHOU: 'O programa terminou e ainda há luzes apagadas. Tente de novo.',
    LIMITE: 'O robô passou do limite de passos. Confira as chamadas de função.',
    LISTA_CHEIA: 'Essa lista está cheia.',
    PROGRAMA_VAZIO: 'Coloque comandos no programa Principal antes de executar.',
  });

  RoboLuz.constantes = Object.freeze({
    COMANDOS,
    DESCRICAO_COMANDOS,
    LISTAS_PROGRAMA,
    LISTA_DA_FUNCAO,
    DESLOCAMENTO_DIRECAO,
    LETRA_DIRECAO,
    LIMITES,
    TEMPO,
    DESENHO,
    CHAVE_PROGRESSO,
    MENSAGENS,
  });
})(globalThis);
