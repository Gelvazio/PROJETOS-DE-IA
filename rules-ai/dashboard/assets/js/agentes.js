// Página "Agentes ao vivo": lê o tasks/STATUS.md do GitHub raw (canal ao vivo ou fallback),
// guarda cada leitura numa fila e só mostra no quadro kanban depois do atraso escolhido.
import { ATRASO_PADRAO_SEGUNDOS, CANAL, INTERVALO_FALLBACK_SEGUNDOS } from './config.js';
import { iniciarCanal, lerEstadoInicial } from './agentes/canal.js';
import { criarBufferAtraso } from './agentes/atraso-estados.js';
import { criarKanban } from './agentes/kanban.js';
import {
  CONEXAO, ligarAtraso, marcarConexao, marcarLeitura,
} from './agentes/transmissao.js';

const $ = (id) => document.getElementById(id);
/** Projeto escolhido no menu de projetos (?projeto=<pasta>); vazio = o publicado no canal. */
const PROJETO = new URLSearchParams(window.location.search).get('projeto') ?? '';

/** Valor que o GitHub raw não traz (atraso padrão da animação). */
const PADROES_RAW = Object.freeze({ atraso_padrao: ATRASO_PADRAO_SEGUNDOS });
/** Tempo com o canal caído antes de voltar ao polling (R2.3). */
const ATRASO_QUEDA_MS = 30000;
/** Intervalo em que a página confere se há leitura pronta para mostrar. */
const INTERVALO_MOSTRAR_MS = 1000;

function avisar(texto) {
  $('aviso').textContent = texto;
  $('aviso').hidden = !texto;
}

/** Lê o quadro pela fonte da abertura, a cada intervalo; liga e desliga sob demanda. */
function vigiarQuadro(aplicar, fonte) {
  const ler = async () => {
    try {
      aplicar(await fonte());
    } catch (erro) {
      marcarLeitura(0, erro.message);
    }
  };
  let timer = null;
  return {
    iniciar() {
      if (timer === null) timer = window.setInterval(ler, INTERVALO_FALLBACK_SEGUNDOS * 1000);
    },
    parar() {
      window.clearInterval(timer);
      timer = null;
    },
  };
}

/**
 * Reage ao estado do canal (R2.3): conectado = sem polling; caído por mais de ATRASO_QUEDA_MS =
 * polling a cada intervalo até reconectar.
 */
function criarFallback(vigia) {
  let espera = null;
  const cancelar = () => {
    window.clearTimeout(espera);
    espera = null;
  };
  return (conectado) => {
    if (conectado) {
      cancelar();
      vigia.parar();
      avisar('');
      marcarConexao(CONEXAO.AO_VIVO);
    } else if (espera === null) {
      marcarConexao(CONEXAO.RECONECTANDO);
      espera = window.setTimeout(() => {
        vigia.iniciar();
        marcarConexao(CONEXAO.OFFLINE);
      }, ATRASO_QUEDA_MS);
    }
  };
}

/** Sem chave publicável o polling fica ligado; com canal, só no fallback. */
async function ligarCanal(aplicar, primeiro, vigia) {
  if (!CANAL.chavePublicavel) return vigia.iniciar();
  const aoConexao = criarFallback(vigia);
  aoConexao(false);
  const cliente = await iniciarCanal({
    aoEstado: aplicar, aoAviso: avisar, aoConexao, inicial: primeiro,
  });
  if (!cliente) vigia.iniciar();
}

/** Estado inicial pelo GitHub raw, a única fonte; só o projeto do canal é publicado. */
async function lerPrimeiro() {
  if (PROJETO && PROJETO !== CANAL.projeto) {
    avisar(`Só o projeto "${CANAL.projeto}" é publicado hoje; `
      + `mostrando-o no lugar de "${PROJETO}".`);
  }
  const fonte = async () => ({ ...PADROES_RAW, ...(await lerEstadoInicial()) });
  return { primeiro: await fonte(), fonte };
}

/** Repete a cada segundo: se a leitura mais nova já passou do atraso, mostra no quadro. */
function iniciarMostragem(buffer, kanban) {
  window.setInterval(() => {
    const pronto = buffer.retirarPronto();
    if (pronto) kanban.atualizar(pronto.tarefas);
  }, INTERVALO_MOSTRAR_MS);
}

async function iniciar() {
  let leitura;
  try {
    leitura = await lerPrimeiro();
  } catch (erro) {
    throw new Error(`o quadro não pôde ser lido do GitHub (${erro.message}); confira a rede.`);
  }
  const { primeiro, fonte } = leitura;
  const kanban = criarKanban($('quadro'));
  const buffer = criarBufferAtraso(primeiro.atraso_padrao);
  const atrasoInicial = ligarAtraso(
    primeiro.atraso_padrao,
    (segundos) => buffer.definirAtraso(segundos),
  );
  buffer.definirAtraso(atrasoInicial);
  kanban.atualizar(primeiro.tarefas);
  marcarLeitura(0);

  const aplicar = (estado) => {
    buffer.enfileirar(estado);
    marcarLeitura(buffer.pendentes());
  };
  iniciarMostragem(buffer, kanban);
  ligarCanal(aplicar, primeiro, vigiarQuadro(aplicar, fonte));
}

iniciar().catch((erro) => avisar(`Não foi possível montar a página: ${erro.message}`));
