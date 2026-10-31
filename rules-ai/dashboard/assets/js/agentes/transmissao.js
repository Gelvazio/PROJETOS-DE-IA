// Caixa de transmissão da página "Agentes ao vivo": atraso, conexão e hora da última leitura.
// Sem Three.js: só DOM.

const $ = (id) => document.getElementById(id);
const CHAVE_ATRASO = 'agentes-ao-vivo:atraso';
const OPCOES_ATRASO = [0, 10, 30, 60, 120];

/** Estados da conexão com o canal ao vivo; o valor é também o sufixo da classe CSS. */
export const CONEXAO = Object.freeze({
  AO_VIVO: 'aovivo',
  RECONECTANDO: 'reconectando',
  OFFLINE: 'offline',
});
const TEXTOS_CONEXAO = Object.freeze({
  [CONEXAO.AO_VIVO]: 'Ao vivo: canal conectado',
  [CONEXAO.RECONECTANDO]: 'Reconectando ao canal…',
  [CONEXAO.OFFLINE]: 'Offline: lendo do GitHub',
});

function lerAtrasoSalvo(padrao) {
  try {
    const texto = window.localStorage.getItem(CHAVE_ATRASO);
    return texto !== null && OPCOES_ATRASO.includes(Number(texto)) ? Number(texto) : padrao;
  } catch {
    return padrao;
  }
}

function salvarAtraso(valor) {
  try {
    window.localStorage.setItem(CHAVE_ATRASO, String(valor));
  } catch {
    // Sem armazenamento (janela privada): o atraso vale só nesta visita.
  }
}

function mostrarSelo(atraso) {
  $('selo-ao-vivo').textContent = atraso ? `● ao vivo −${atraso} s` : '● ao vivo';
}

/**
 * Prepara o seletor de atraso e devolve o valor inicial (o salvo neste navegador ou o padrão).
 * @param {number} padrao - Atraso do servidor.
 * @param {function(number): void} aoMudar - Recebe o novo atraso em segundos.
 * @returns {number} Atraso inicial.
 */
export function ligarAtraso(padrao, aoMudar) {
  const seletor = $('atraso');
  const opcoes = [...new Set([...OPCOES_ATRASO, padrao])].sort((a, b) => a - b);
  seletor.replaceChildren(...opcoes.map((valor) => new Option(valor ? `${valor} s` : 'sem atraso', valor)));
  const inicial = lerAtrasoSalvo(padrao);
  seletor.value = String(inicial);
  mostrarSelo(inicial);
  seletor.addEventListener('change', () => {
    const valor = Number(seletor.value);
    salvarAtraso(valor);
    mostrarSelo(valor);
    aoMudar(valor);
  });
  return inicial;
}

/**
 * Mostra a hora da última leitura do quadro e quantas mudanças esperam o atraso.
 * @param {number} pendentes - Mudanças na fila.
 * @param {string} [erro] - Mensagem quando a leitura falhou.
 */
export function marcarLeitura(pendentes, erro = '') {
  const alvo = $('estado-leitura');
  alvo.classList.toggle('transmissao__estado--erro', Boolean(erro));
  alvo.textContent = erro
    ? `Falha ao ler o quadro: ${erro}`
    : `Lido às ${new Date().toLocaleTimeString('pt-BR')} · ${pendentes} na fila`;
}

/**
 * Mostra se a página recebe dado ao vivo, está reconectando ou lê só do GitHub.
 * @param {string} estado - Um valor de CONEXAO.
 */
export function marcarConexao(estado) {
  const texto = TEXTOS_CONEXAO[estado];
  if (!texto) return;
  const alvo = $('estado-conexao');
  alvo.className = `transmissao__conexao transmissao__conexao--${estado}`;
  alvo.textContent = texto;
}
