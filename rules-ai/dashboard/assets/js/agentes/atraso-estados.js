// Fila de estados do quadro com atraso: cada leitura espera o atraso escolhido antes de aparecer.
// Sem DOM e sem Three.js: dá para conferir com `node`.

/**
 * Cria a fila. Entre dois estados prontos, só o mais novo é mostrado (os anteriores são descartados).
 * @param {number} atrasoSegundos - Atraso inicial em segundos.
 * @returns {{enfileirar: function(object): void, retirarPronto: function(number=): (object|null),
 *   definirAtraso: function(number): void, pendentes: function(): number}}
 */
export function criarBufferAtraso(atrasoSegundos) {
  let atrasoMs = atrasoSegundos * 1000;
  let fila = [];

  return {
    enfileirar(estado, agora = Date.now()) {
      fila.push({ quando: agora, estado });
    },
    retirarPronto(agora = Date.now()) {
      const prontos = fila.filter((item) => item.quando + atrasoMs <= agora);
      if (prontos.length === 0) return null;
      fila = fila.slice(prontos.length);
      return prontos[prontos.length - 1].estado;
    },
    definirAtraso(segundos) {
      atrasoMs = segundos * 1000;
    },
    pendentes() {
      return fila.length;
    },
  };
}
