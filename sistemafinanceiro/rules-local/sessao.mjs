// Script de sessão do rules-local (formato combinado F3/F4/F5 da ETAPA-019).
// Uso, na raiz do projeto: node rules-local/sessao.mjs.
// Versão igual à da nuvem e pasta íntegra -> não grava nada; diferente -> baixa as regras,
// grava regras/, o pacote (scripts do rules-local/ e jev/), RELATORIO.md e, por último, a
// VERSAO.md.
// Termina sempre com código 0, só grava dentro da própria pasta e nunca usa Git.
import {
  closeSync, mkdirSync, openSync, readFileSync, readdirSync, statSync, unlinkSync,
  writeFileSync, writeSync,
} from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { URL_RAW_BASE, baixarRegras, baixarVersao } from './baixar.mjs';
import { compararListas } from './comparar.mjs';
import {
  ARQUIVO_VERSAO, PASTA_REGRAS, calcularCodigo, conferirPasta, lerVersao, normalizarTexto,
} from './conferir.mjs';
import { baixarPacoteConferido, gravarPacote } from './pacote.mjs';
import { rodarComProxySePreciso } from './proxy.mjs';

const PASTA_RULES_LOCAL = dirname(fileURLToPath(import.meta.url));
const ARQUIVO_RELATORIO = 'RELATORIO.md';
const ARQUIVO_TRAVA = '.trava';
const TRAVA_VALIDADE_MS = 120000;
const PREFIXO_AVISO = 'rules-local:';
const FUSO_HORARIO = 'America/Sao_Paulo';
const SEM_VERSAO = 'nenhuma';
const SEM_CODIGO = '—';
const REGEX_ARQUIVO_MD = /\.md$/;
const ERRO_JA_EXISTE = 'EEXIST';
const ERRO_NAO_EXISTE = 'ENOENT';
const MOTIVO_AUSENTE = 'rules-local ausente';
const MOTIVO_CORROMPIDA = 'VERSAO.md local corrompida';
const MOTIVO_CONFERENCIA = 'conferência falhou';
const MOTIVO_DIFERENTE = 'versão diferente';
const SITUACOES_RELATORIO = ['mudado', 'adicionado', 'removido'];
const FORMATO_DATA_HORA = {
  timeZone: FUSO_HORARIO, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
};

/**
 * Imprime um aviso com o prefixo que a sessão lê (F5).
 * @param {string} texto Texto do aviso, sem o prefixo.
 */
function avisar(texto) {
  console.log(`${PREFIXO_AVISO} ${texto}`);
}

/**
 * Monta um caminho e garante que ele fica dentro da pasta base (INV-2).
 * @param {string} pastaBase Pasta que não pode ser deixada.
 * @param {string} nome Nome do arquivo dentro dela.
 * @returns {string} Caminho absoluto.
 * @throws {Error} Se o caminho sair da pasta base.
 */
function caminhoNaPasta(pastaBase, nome) {
  const base = resolve(pastaBase);
  const caminho = resolve(base, nome);
  if (!caminho.startsWith(base + sep)) throw new Error(`caminho fora do rules-local: ${nome}`);
  return caminho;
}

/**
 * Lê um arquivo de texto, devolvendo null se ele não existir ou não puder ser lido.
 * @param {string} caminho Caminho do arquivo.
 * @returns {string|null} Conteúdo ou null.
 */
function lerTextoOuNulo(caminho) {
  try {
    return readFileSync(caminho, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Lê o estado local: texto da VERSAO.md, leitura dela e conferência da pasta (R2.5/R2.6).
 * @param {string} pasta Pasta `rules-local`.
 * @returns {{texto: string|null, leitura: object, conferencia: object, versao: string}}
 */
function lerEstadoLocal(pasta) {
  const texto = lerTextoOuNulo(caminhoNaPasta(pasta, ARQUIVO_VERSAO));
  const leitura = lerVersao(texto);
  const conferencia = conferirPasta(pasta);
  const versao = leitura.ok ? leitura.versao : SEM_VERSAO;
  return { texto, leitura, conferencia, versao };
}

/**
 * Diz se o local está em dia: VERSAO.md igual à da nuvem e pasta íntegra (R2.5/R2.6).
 * @param {{texto: string|null, conferencia: object}} estado Estado local.
 * @param {string} textoNuvem VERSAO.md baixada da nuvem.
 * @returns {boolean} Verdadeiro quando não há nada a sincronizar.
 */
function estaEmDia(estado, textoNuvem) {
  if (estado.texto === null) return false;
  const textoIgual = normalizarTexto(estado.texto) === normalizarTexto(textoNuvem);
  return textoIgual && estado.conferencia.integro;
}

/**
 * Escolhe o motivo da sincronização para o relatório (F5).
 * @param {{texto: string|null, leitura: object}} estado Estado local.
 * @param {string} textoNuvem VERSAO.md baixada da nuvem.
 * @returns {string} Um dos motivos do F5.
 */
function escolherMotivo(estado, textoNuvem) {
  if (estado.texto === null) return MOTIVO_AUSENTE;
  if (!estado.leitura.ok) return MOTIVO_CORROMPIDA;
  const textoIgual = normalizarTexto(estado.texto) === normalizarTexto(textoNuvem);
  if (textoIgual) return MOTIVO_CONFERENCIA;
  return MOTIVO_DIFERENTE;
}

/**
 * Cria o arquivo da trava de forma atômica (`wx`: falha se já existir).
 * @param {string} caminho Caminho da `.trava`.
 * @param {string} conteudo Marca desta sessão (pid + hora).
 * @returns {boolean} Verdadeiro se a trava foi criada por esta sessão.
 * @throws {Error} Erro de disco que não seja "já existe".
 */
function criarTrava(caminho, conteudo) {
  try {
    const descritor = openSync(caminho, 'wx');
    writeSync(descritor, conteudo);
    closeSync(descritor);
    return true;
  } catch (erro) {
    if (erro.code === ERRO_JA_EXISTE) return false;
    throw erro;
  }
}

/**
 * Apaga a trava se ela estiver abandonada (mais velha que TRAVA_VALIDADE_MS) e ainda for a
 * mesma que foi vista (outra sessão pode tê-la trocado no meio).
 * @param {string} caminho Caminho da `.trava`.
 * @returns {boolean} Verdadeiro se a trava abandonada saiu (ou já tinha sumido).
 */
function removerTravaAbandonada(caminho) {
  const conteudoVisto = lerTextoOuNulo(caminho);
  if (conteudoVisto === null) return true;
  let modificadaEm;
  try {
    modificadaEm = statSync(caminho).mtimeMs;
  } catch (erro) {
    if (erro.code === ERRO_NAO_EXISTE) return true;
    throw erro;
  }
  if (Date.now() - modificadaEm <= TRAVA_VALIDADE_MS) return false;
  if (lerTextoOuNulo(caminho) !== conteudoVisto) return false;
  try {
    unlinkSync(caminho);
  } catch (erro) {
    if (erro.code !== ERRO_NAO_EXISTE) throw erro;
  }
  return true;
}

/**
 * Pega a trava de sincronização (duas sessões ao mesmo tempo no mesmo projeto).
 * @param {string} pasta Pasta `rules-local`.
 * @returns {string|null} Marca da trava desta sessão, ou null se outra sessão a tem.
 */
function pegarTrava(pasta) {
  const caminho = caminhoNaPasta(pasta, ARQUIVO_TRAVA);
  const marca = `${process.pid} ${new Date().toISOString()}\n`;
  if (criarTrava(caminho, marca)) return marca;
  if (!removerTravaAbandonada(caminho)) return null;
  return criarTrava(caminho, marca) ? marca : null;
}

/**
 * Solta a trava, só se ela ainda for desta sessão.
 * @param {string} pasta Pasta `rules-local`.
 * @param {string|null} marca Marca devolvida por `pegarTrava`.
 */
function soltarTrava(pasta, marca) {
  if (!marca) return;
  const caminho = caminhoNaPasta(pasta, ARQUIVO_TRAVA);
  if (lerTextoOuNulo(caminho) !== marca) return;
  try {
    unlinkSync(caminho);
  } catch {
    // Trava que não sai fica velha e é trocada pela próxima sessão (TRAVA_VALIDADE_MS).
  }
}

/**
 * Baixa as regras da tabela da nuvem e confere o código de cada uma (cache do `raw`).
 * @param {Map<string, string>} regrasNuvem arquivo -> código da VERSAO.md da nuvem.
 * @param {{urlBase: string}} opcoes Opções de download.
 * @returns {Promise<{ok: true, textos: Map<string, string>}
 *   | {ok: false, semAcesso: boolean, motivo: string}>} `semAcesso` falso = nuvem inconsistente.
 */
async function baixarRegrasConferidas(regrasNuvem, opcoes) {
  const download = await baixarRegras([...regrasNuvem.keys()], opcoes);
  if (!download.ok) {
    const motivo = `${download.motivo} em ${PASTA_REGRAS}/${download.arquivo}`;
    return { ok: false, semAcesso: true, motivo };
  }
  for (const [arquivo, codigo] of regrasNuvem) {
    if (calcularCodigo(download.textos.get(arquivo)) !== codigo) {
      const motivo = `código de ${PASTA_REGRAS}/${arquivo} não bate com a VERSAO.md`;
      return { ok: false, semAcesso: false, motivo };
    }
  }
  return { ok: true, textos: download.textos };
}

/**
 * Apaga de `regras/` os `.md` que não estão na tabela nova (F3: só estes podem sair).
 * @param {string} pastaRegras Pasta `rules-local/regras`.
 * @param {Map<string, string>} regrasNuvem Tabela nova.
 */
function apagarRegrasForaDaTabela(pastaRegras, regrasNuvem) {
  const sobrando = readdirSync(pastaRegras, { withFileTypes: true })
    .filter((entrada) => entrada.isFile() && REGEX_ARQUIVO_MD.test(entrada.name))
    .filter((entrada) => !regrasNuvem.has(entrada.name));
  for (const entrada of sobrando) unlinkSync(caminhoNaPasta(pastaRegras, entrada.name));
}

/**
 * Grava as regras baixadas, apaga as que saíram e confere o que ficou no disco (R2.7).
 * @param {string} pasta Pasta `rules-local`.
 * @param {Map<string, string>} textos arquivo -> texto exato do `raw`.
 * @param {Map<string, string>} regrasNuvem arquivo -> código esperado.
 * @throws {Error} Se algum arquivo gravado não bater com o código da tabela.
 */
function gravarRegras(pasta, textos, regrasNuvem) {
  const pastaRegras = caminhoNaPasta(pasta, PASTA_REGRAS);
  mkdirSync(pastaRegras, { recursive: true });
  for (const [arquivo, texto] of textos) {
    writeFileSync(caminhoNaPasta(pastaRegras, arquivo), texto, 'utf8');
  }
  apagarRegrasForaDaTabela(pastaRegras, regrasNuvem);
  for (const [arquivo, codigo] of regrasNuvem) {
    const gravado = lerTextoOuNulo(caminhoNaPasta(pastaRegras, arquivo));
    if (gravado === null || calcularCodigo(gravado) !== codigo) {
      throw new Error(`${PASTA_REGRAS}/${arquivo} não confere depois de gravado`);
    }
  }
}

/**
 * Data e hora de agora em Brasília, no formato `AAAA-MM-DD HH:MM`.
 * @returns {string} Data e hora formatadas.
 */
function formatarAgora() {
  const partes = new Intl.DateTimeFormat('en-CA', FORMATO_DATA_HORA).formatToParts(new Date());
  const valor = Object.fromEntries(partes.map(({ type, value }) => [type, value]));
  return `${valor.year}-${valor.month}-${valor.day} ${valor.hour}:${valor.minute}`;
}

/**
 * Monta as linhas da tabela "Itens": mudado, adicionado e removido, nessa ordem (F5).
 * @param {{mudado: string[], adicionado: string[], removido: string[]}} comparacao
 * @param {Map<string, string>} antiga arquivo -> código anterior.
 * @param {Map<string, string>} nova arquivo -> código novo.
 * @returns {string[]} Linhas da tabela.
 */
function montarLinhasItens(comparacao, antiga, nova) {
  return SITUACOES_RELATORIO.flatMap((situacao) => comparacao[situacao].map((arquivo) => {
    const anterior = antiga.get(arquivo) ?? SEM_CODIGO;
    const novo = nova.get(arquivo) ?? SEM_CODIGO;
    return `| ${situacao} | ${arquivo} | ${anterior} | ${novo} |`;
  }));
}

/**
 * Monta o texto do `RELATORIO.md` (F5).
 * @param {{anterior: string, nova: string, motivo: string, comparacao: object,
 *   antiga: Map<string, string>, regrasNova: Map<string, string>,
 *   restaurados: {arquivo: string, problema: string}[]}} dados
 * @returns {string} Texto do relatório, terminado em `\n`.
 */
function montarRelatorio(dados) {
  const { comparacao } = dados;
  const totais = `${comparacao.mudado.length} mudado · ${comparacao.adicionado.length} adicionado`
    + ` · ${comparacao.removido.length} removido · ${comparacao.igual.length} igual`;
  const linhas = [
    '# Relatório de mudanças — rules-local', '',
    '<!-- gerado por rules-local/sessao.mjs; não editar -->', '',
    `- **Versão anterior:** ${dados.anterior}`,
    `- **Versão nova:** ${dados.nova}`,
    `- **Gerado em:** ${formatarAgora()} (Brasília)`,
    `- **Motivo:** ${dados.motivo}`,
    `- **Totais:** ${totais}`, '',
    '## Itens', '',
    '| Situação | Arquivo | Código anterior | Código novo |', '|---|---|---|---|',
    ...montarLinhasItens(comparacao, dados.antiga, dados.regrasNova), '',
    '## Restaurados', '',
    '| Arquivo | Problema |', '|---|---|',
    ...dados.restaurados.map(({ arquivo, problema }) => `| ${arquivo} | ${problema} |`),
  ];
  return `${linhas.join('\n')}\n`;
}

/**
 * Versão da VERSAO.md local válida, sem conferir a pasta (só para o aviso "sem acesso").
 * @param {string} pasta Pasta `rules-local`.
 * @returns {string} Versão local, ou `nenhuma`.
 */
function lerVersaoLocal(pasta) {
  const leitura = lerVersao(lerTextoOuNulo(caminhoNaPasta(pasta, ARQUIVO_VERSAO)));
  return leitura.ok ? leitura.versao : SEM_VERSAO;
}

/**
 * Texto do aviso "sem acesso" (R2.4).
 * @param {string} motivo Motivo da falha de download.
 * @param {string} versaoLocal Versão local, ou `nenhuma`.
 * @returns {string} Aviso sem o prefixo.
 */
function avisoSemAcesso(motivo, versaoLocal) {
  return `sem acesso ao rules-ai (${motivo}); seguindo com a versão local ${versaoLocal}.`;
}

/**
 * Texto do aviso "nuvem inconsistente" (F5).
 * @param {string} motivo O que não bateu.
 * @returns {string} Aviso sem o prefixo.
 */
function avisoNuvemInconsistente(motivo) {
  return `nuvem inconsistente (${motivo}); nada gravado, tentar na próxima sessão.`;
}

/**
 * Grava a sincronização: regras, relatório e, por último, a VERSAO.md (R2.3/R2.7), e avisa.
 * @param {string} pasta Pasta `rules-local`.
 * @param {{texto: string, leitura: object, textos: Map<string, string>,
 *   textosPacote: Map<string, string>}} nuvem Dados da nuvem (regras e pacote baixados).
 * @param {object} estado Estado local lido com a trava na mão.
 */
function gravarSincronizacao(pasta, nuvem, estado) {
  const antiga = estado.leitura.ok ? estado.leitura.regras : new Map();
  const regrasNova = nuvem.leitura.regras;
  const comparacao = compararListas(antiga, regrasNova);
  const restaurados = estado.conferencia.integro ? [] : estado.conferencia.arquivos;
  const motivo = escolherMotivo(estado, nuvem.texto);
  const nova = nuvem.leitura.versao;

  gravarRegras(pasta, nuvem.textos, regrasNova);
  gravarPacote(pasta, nuvem.textosPacote, nuvem.leitura.pacote);
  const relatorio = montarRelatorio({
    anterior: estado.versao, nova, motivo, comparacao, antiga, regrasNova, restaurados,
  });
  writeFileSync(caminhoNaPasta(pasta, ARQUIVO_RELATORIO), relatorio, 'utf8');
  writeFileSync(caminhoNaPasta(pasta, ARQUIVO_VERSAO), nuvem.texto, 'utf8');

  const { mudado, adicionado, removido } = comparacao;
  const semMudancaNasRegras = mudado.length + adicionado.length + removido.length === 0
    && restaurados.length === 0 && estado.leitura.ok;
  if (semMudancaNasRegras) {
    avisar(`pacote atualizado (${nuvem.leitura.pacote.size} arquivos: scripts e Jev); `
      + `regras iguais (${nova}); nada a fazer.`);
    return;
  }
  avisar(`VERSÃO NOVA ${estado.versao} -> ${nova} (${mudado.length} mudado, `
    + `${adicionado.length} adicionado, ${removido.length} removido).`);
  avisar(`relatório em rules-local/${ARQUIVO_RELATORIO}.`);
  avisar('DISPARAR A SINCRONIZAÇÃO DE TASKS (rules-local/regras/rules-local.md) '
    + 'antes do primeiro pedido.');
}

/**
 * Sincroniza com a trava na mão: relê o local (outra sessão pode ter acabado de gravar),
 * baixa e confere as regras e o pacote (scripts e Jev) e grava tudo.
 * @param {string} pasta Pasta `rules-local`.
 * @param {{texto: string, leitura: object}} nuvem VERSAO.md da nuvem, já lida.
 * @param {{urlBase: string}} opcoes Opções de download.
 */
async function sincronizarComTrava(pasta, nuvem, opcoes) {
  const estado = lerEstadoLocal(pasta);
  if (estaEmDia(estado, nuvem.texto)) {
    avisar(`versão igual (${estado.versao}); nada a fazer.`);
    return;
  }
  const regras = await baixarRegrasConferidas(nuvem.leitura.regras, opcoes);
  if (!regras.ok) {
    const aviso = regras.semAcesso
      ? avisoSemAcesso(regras.motivo, estado.versao)
      : avisoNuvemInconsistente(regras.motivo);
    avisar(aviso);
    return;
  }
  const pacote = await baixarPacoteConferido(nuvem.leitura.pacote, opcoes);
  if (!pacote.ok) {
    const aviso = pacote.semAcesso
      ? avisoSemAcesso(pacote.motivo, estado.versao)
      : avisoNuvemInconsistente(pacote.motivo);
    avisar(aviso);
    return;
  }
  gravarSincronizacao(pasta, {
    ...nuvem, textos: regras.textos, textosPacote: pacote.textos,
  }, estado);
}

/**
 * Fluxo da sessão (F4, `.2`): compara a VERSAO.md local com a da nuvem e sincroniza se preciso.
 * @param {string} pasta Pasta `rules-local` (a deste script).
 * @returns {Promise<void>} Nunca rejeita: erro inesperado vira aviso.
 */
async function executarSessao(pasta) {
  let marca = null;
  try {
    const opcoes = { urlBase: process.env.RULES_LOCAL_URL_BASE ?? URL_RAW_BASE };
    const download = await baixarVersao(opcoes);
    if (!download.ok) return avisar(avisoSemAcesso(download.motivo, lerVersaoLocal(pasta)));
    const leitura = lerVersao(download.texto);
    if (!leitura.ok) return avisar(avisoNuvemInconsistente(leitura.motivo));

    const estado = lerEstadoLocal(pasta);
    if (estaEmDia(estado, download.texto)) {
      return avisar(`versão igual (${estado.versao}); nada a fazer.`);
    }
    marca = pegarTrava(pasta);
    if (!marca) return avisar('outra sessão está sincronizando; seguindo com a versão local.');
    await sincronizarComTrava(pasta, { texto: download.texto, leitura }, opcoes);
  } catch (erro) {
    avisar(`erro inesperado: ${erro?.message ?? String(erro)}`);
  } finally {
    try {
      soltarTrava(pasta, marca);
    } catch {
      // A trava velha é trocada pela próxima sessão; a saída continua com código 0.
    }
  }
}

if (!(await rodarComProxySePreciso())) {
  await executarSessao(PASTA_RULES_LOCAL);
  process.exitCode = 0;
}
