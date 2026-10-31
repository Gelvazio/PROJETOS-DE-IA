/**
 * Interpretador do programa: percorre Principal, F1 e F2 com uma pilha de chamadas e entrega
 * um comando básico por vez. Não mexe no mundo: só diz o que executar e de onde veio.
 */
(function registrarInterpretador(global) {
  const RoboLuz = (global.RoboLuz = global.RoboLuz || {});
  const { LISTA_DA_FUNCAO, LIMITES } = RoboLuz.constantes;

  const LISTA_INICIAL = 'principal';

  /** Motivos de fim da execução. */
  const FIM = Object.freeze({ TERMINOU: 'terminou', LIMITE: 'limite' });

  /**
   * Gera os passos do programa, um comando básico por vez.
   * Cada passo é { comando, lista, indice }; o último valor (return) é o motivo do fim.
   * @param {{principal: string[], f1: string[], f2: string[]}} programa - Listas de comandos.
   * @returns {Generator<{comando: string, lista: string, indice: number}, string>} Passos.
   */
  function* gerarPassos(programa) {
    const pilha = [{ lista: LISTA_INICIAL, indice: 0 }];
    let passos = 0;

    while (pilha.length > 0) {
      const quadro = pilha[pilha.length - 1];
      const comandos = programa[quadro.lista] || [];
      if (quadro.indice >= comandos.length) {
        pilha.pop();
        continue;
      }

      const indice = quadro.indice;
      const comando = comandos[indice];
      quadro.indice += 1;
      passos += 1;
      if (passos > LIMITES.PASSOS || pilha.length > LIMITES.PILHA) return FIM.LIMITE;

      const listaChamada = LISTA_DA_FUNCAO[comando];
      if (listaChamada) pilha.push({ lista: listaChamada, indice: 0 });
      else yield { comando, lista: quadro.lista, indice };
    }
    return FIM.TERMINOU;
  }

  RoboLuz.interpretador = Object.freeze({ gerarPassos, FIM });
})(globalThis);
