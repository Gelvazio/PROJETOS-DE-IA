// Medidor de latência do Broadcast (AGENTES-REALTIME.24). Instrumento de medição, não é teste.
//
// O que faz: assina o canal "quadro:<projeto>" do Supabase Realtime (WebSocket do Node, sem
// navegador, sem pacote) e, ao receber o evento "estado", calcula
//   latência = hora de recebimento - payload.publicado_em
// e imprime também commit e sequencia. Meta da etapa: menos de 10 s (R1.1).
//
// Como medir ponta a ponta (precisa da chave publicável da subtarefa .12 e do secret no GitHub):
//   Janela 1:  $env:SUPABASE_PUBLISHABLE_KEY = "<chave sb_publishable_…>"
//              node dashboard/testes/medir_latencia.mjs --projeto rules-ai --tempo-limite 180
//   Janela 2:  alterar tasks/STATUS.md e dar push na main (dispara o workflow "Publicar quadro").
// A janela 1 imprime a latência da primeira mensagem "estado" e sai.
//
// Opções: --projeto <id> (padrão: o de config.js), --tempo-limite <s> (padrão 120), --json.
// Variáveis: SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY (a chave nunca é gravada nem impressa);
//   a URL e o projeto, se faltarem, vêm de dashboard/assets/js/config.js.
// Código de saída: 0 mediu; 1 estourou o tempo limite ou o canal falhou; 2 faltou configuração.
// Limites da medida: `publicado_em` tem resolução de 1 s e o relógio desta máquina pode diferir
//   do runner do GitHub; o valor é estimativa (erro de ±1 s mais a diferença de relógio).
// A latência do push ao início do workflow (fila do Actions) vem antes do `publicado_em`; para
//   incluí-la, compare a hora do push com `publicado_em` no log da execução.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CAMINHO_CONFIG = fileURLToPath(new URL('../assets/js/config.js', import.meta.url));
const TEMPO_LIMITE_PADRAO_S = 120;
const INTERVALO_BATIDA_MS = 25000;
const MS_POR_SEGUNDO = 1000;
const META_S = 10;
const SAIDA_MEDIU = 0;
const SAIDA_FALHA = 1;
const SAIDA_CONFIG = 2;
const EVENTO_PADRAO = 'estado';

/** Lê um valor de texto de config.js pelo nome da chave ('' se não achar). */
function lerDoConfig(chave) {
  try {
    const texto = readFileSync(CAMINHO_CONFIG, 'utf8');
    const achado = texto.match(new RegExp(`${chave}:\\s*'([^']*)'`));
    return achado ? achado[1] : '';
  } catch {
    return '';
  }
}

/** Interpreta os argumentos da linha de comando. */
function lerArgumentos(argv) {
  const opcoes = { projeto: '', tempoLimite: TEMPO_LIMITE_PADRAO_S, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--json') opcoes.json = true;
    else if (argv[i] === '--projeto') opcoes.projeto = argv[++i] ?? '';
    else if (argv[i] === '--tempo-limite') opcoes.tempoLimite = Number(argv[++i]);
  }
  return opcoes;
}

/** Monta a configuração (url, chave, projeto, tempo); `erro` preenchido se faltar algo. */
function montarConfiguracao(opcoes, ambiente) {
  const url = (ambiente.SUPABASE_URL || lerDoConfig('url')).replace(/\/+$/, '');
  const chave = ambiente.SUPABASE_PUBLISHABLE_KEY || lerDoConfig('chavePublicavel');
  const projeto = opcoes.projeto || lerDoConfig('projeto');
  let erro = '';
  if (!chave) {
    erro = 'Falta a chave publicável (SUPABASE_PUBLISHABLE_KEY). Ela vem da subtarefa '
      + 'AGENTES-REALTIME.12 (ação do usuário); sem ela a medição real não é possível.';
  } else if (!url || !projeto) erro = 'Faltam SUPABASE_URL ou o projeto (--projeto).';
  else if (!Number.isFinite(opcoes.tempoLimite) || opcoes.tempoLimite <= 0) {
    erro = '--tempo-limite precisa ser um número de segundos maior que zero.';
  }
  return { url, chave, projeto, tempoLimite: opcoes.tempoLimite, json: opcoes.json, erro };
}

/** Endereço WebSocket do Realtime; a chave só viaja na conexão, nunca é impressa. */
function enderecoSocket(config) {
  const base = config.url.replace(/^http/, 'ws');
  return `${base}/realtime/v1/websocket?apikey=${encodeURIComponent(config.chave)}&vsn=1.0.0`;
}

/** Quadro do protocolo Phoenix. */
function quadro(topico, evento, payload) {
  return JSON.stringify({ topic: topico, event: evento, payload, ref: '1', join_ref: '1' });
}

/** Resultado da medição a partir do payload e da hora de recebimento (ms). */
function calcularResultado(payload, recebidoEm) {
  const publicadoEm = Date.parse(payload.publicado_em);
  const latenciaS = Number.isNaN(publicadoEm) ? null : (recebidoEm - publicadoEm) / MS_POR_SEGUNDO;
  return {
    projeto: payload.projeto,
    commit: payload.commit ?? null,
    sequencia: payload.sequencia ?? null,
    publicado_em: payload.publicado_em ?? null,
    recebido_em: new Date(recebidoEm).toISOString(),
    latencia_s: latenciaS,
    dentro_da_meta: latenciaS !== null && latenciaS < META_S,
  };
}

/** Imprime o resultado em texto ou JSON. */
function imprimir(resultado, comoJson) {
  if (comoJson) {
    console.log(JSON.stringify(resultado));
    return;
  }
  const segundos = resultado.latencia_s;
  const latencia = segundos === null ? 'indisponível' : `${segundos.toFixed(1)} s`;
  console.log(`Mensagem recebida de quadro:${resultado.projeto}`);
  console.log(`  commit: ${resultado.commit}  sequencia: ${resultado.sequencia}`);
  console.log(`  publicado_em: ${resultado.publicado_em}  recebido_em: ${resultado.recebido_em}`);
  const meta = resultado.dentro_da_meta ? 'ok' : 'NÃO';
  console.log(`  latência: ${latencia} (meta < ${META_S} s: ${meta})`);
}

/** Abre o canal e resolve com a saída do processo (0 mediu, 1 tempo/erro). */
function medir(config) {
  const topico = `realtime:quadro:${config.projeto}`;
  return new Promise((resolver) => {
    const socket = new WebSocket(enderecoSocket(config));
    const batida = setInterval(() => socket.send(quadro('phoenix', 'heartbeat', {})),
      INTERVALO_BATIDA_MS);
    const limite = setTimeout(() => encerrar(SAIDA_FALHA, `Tempo limite de ${config.tempoLimite} s `
      + 'sem mensagem "estado".'), config.tempoLimite * MS_POR_SEGUNDO);
    function encerrar(codigo, aviso) {
      clearInterval(batida);
      clearTimeout(limite);
      if (aviso) console.error(aviso);
      socket.close();
      resolver(codigo);
    }
    socket.onopen = () => {
      socket.send(quadro(topico, 'phx_join', { config: { broadcast: { self: false },
        presence: { key: '' }, private: false } }));
      console.error(`Assinado em quadro:${config.projeto}; aguardando o push `
        + `(até ${config.tempoLimite} s)…`);
    };
    socket.onerror = () => encerrar(SAIDA_FALHA, 'Falha na conexão com o Realtime.');
    socket.onmessage = (evento) => tratar(evento.data, config, encerrar);
  });
}

/** Trata uma mensagem do socket: erro de join ou o broadcast "estado". */
function tratar(dados, config, encerrar) {
  const mensagem = JSON.parse(String(dados));
  const recebidoEm = Date.now();
  if (mensagem.event === 'phx_reply' && mensagem.payload?.status === 'error') {
    encerrar(SAIDA_FALHA, 'Canal recusou a assinatura (chave inválida ou canal privado).');
  } else if (mensagem.event === 'broadcast' && mensagem.payload?.event === EVENTO_PADRAO) {
    imprimir(calcularResultado(mensagem.payload.payload ?? {}, recebidoEm), config.json);
    encerrar(SAIDA_MEDIU);
  }
}

/** Ponto de entrada. */
async function principal() {
  const config = montarConfiguracao(lerArgumentos(process.argv.slice(2)), process.env);
  if (config.erro) {
    console.error(`ERRO: ${config.erro}`);
    return SAIDA_CONFIG;
  }
  return medir(config);
}

process.exitCode = await principal();
process.exit();
