// Subcomando `classificar`: sugere nível, effort e modelos elegíveis das subtarefas do quadro.
// Somente leitura: não escreve no quadro, não reserva e não altera nível (INV-3). Exige a chave
// do Jev (sem chave → código 1, R1.2) e respeita JEV_MODO=off
// (código 2: sem o Jev ninguém escolhe o modelo, C52).
import { resolve } from 'node:path';
import { criarClientePadrao } from '../cliente.mjs';
import { ErroJev, MODOS, carregarConfiguracao } from '../config.mjs';
import { classificarSubtarefa } from '../decidir.mjs';
import { gravarClassificacao } from '../gravador.mjs';
import {
  ARQUIVO_QUADRO, ehSubtarefa, estaLivre, lerQuadro, selecionarSubtarefas,
} from '../estado.mjs';
import { lerTexto } from './argumentos.mjs';
import { CODIGOS_SAIDA, formatarConfianca, imprimir, montarTabela } from './saida.mjs';

const LIMITE_PADRAO = 10;
const MENSAGEM_DESLIGADO = 'JEV_MODO=off: o Jev está desligado (C52: ninguém escolhe o modelo sem ele).';
const COLUNAS = ['Tarefa', 'Nível sugerido', 'Nível final', 'Effort', 'Confiança', 'Ação',
  'Modelos elegíveis', 'Motivos'];

/**
 * Escolhe as subtarefas a classificar: a do `--id`, ou as primeiras livres com seção na etapa.
 * @param {Record<string, string|true>} opcoes Opções da linha de comando.
 * @param {string} arquivoQuadro Quadro lido.
 * @returns {object[]} Itens do quadro.
 * @throws {Error} Se o `--id` não existir no quadro.
 */
function escolherItens(opcoes, arquivoQuadro) {
  const itens = lerQuadro(arquivoQuadro);
  const id = lerTexto(opcoes, 'id');
  if (id) {
    const achado = itens.find((item) => item.id === id && ehSubtarefa(item));
    if (!achado) throw new Error(`Subtarefa "${id}" não encontrada em ${arquivoQuadro}.`);
    return [achado];
  }
  const limite = Number(lerTexto(opcoes, 'limite', String(LIMITE_PADRAO)));
  const candidatas = opcoes.todas ? itens : itens.filter(estaLivre);
  return selecionarSubtarefas(candidatas, { limite, arquivoQuadro });
}

/**
 * Monta o texto da tabela de sugestões.
 * @param {object[]} sugestoes Sugestões de {@link classificarSubtarefa}.
 * @returns {string} Tabela Markdown.
 */
function montarTexto(sugestoes) {
  const linhas = sugestoes.map((s) => [
    s.subtarefa, s.nivel_sugerido, s.nivel_final_proposto, s.effort_final_proposto,
    formatarConfianca(s.confianca), s.acao, s.modelos_elegiveis.join('; '), s.motivos.join('; '),
  ]);
  const aviso = '_Somente leitura: sugestão, nada foi escrito no quadro nem reservado._';
  return `${montarTabela(COLUNAS, linhas)}\n\n${aviso}`;
}

/**
 * Executa o subcomando.
 * @param {{opcoes: Record<string, string|true>}} argumentos Argumentos lidos.
 * @returns {Promise<number>} Código de saída.
 * @throws {ErroJev} `CHAVE_AUSENTE` ou `CONFIGURACAO_INVALIDA` (a CLI converte em código 1).
 */
export async function executarClassificar({ opcoes }) {
  if (opcoes.gravar) return executarGravar({ opcoes });
  if (carregarConfiguracao().modo === MODOS.DESLIGADO) {
    console.error(MENSAGEM_DESLIGADO);
    return CODIGOS_SAIDA.DESLIGADO;
  }
  const cliente = criarClientePadrao();
  const arquivoQuadro = resolve(lerTexto(opcoes, 'quadro', ARQUIVO_QUADRO));
  const sugestoes = [];
  for (const item of escolherItens(opcoes, arquivoQuadro)) {
    sugestoes.push(await classificarSubtarefa(item, { cliente, arquivoQuadro }));
  }
  imprimir({ json: Boolean(opcoes.json), objeto: sugestoes, texto: montarTexto(sugestoes) });
  const jevFalhou = sugestoes.some((sugestao) => sugestao.erro_codigo);
  return jevFalhou ? CODIGOS_SAIDA.JEV_INDISPONIVEL : CODIGOS_SAIDA.OK;
}

const COLUNAS_GRAVACAO = ['Tarefa', 'Gravado', 'Nível', 'Effort', 'JEV-AI-SUGGESTION', 'Fonte',
  'Recusa'];
const MENSAGEM_RECUSA_JEV = 'C52: o Jev não respondeu; nada foi gravado. A subtarefa continua '
  + 'SEM nível e ninguém deve pegá-la até o Jev responder.';
const MOTIVO_RECUSA_JEV = 'Jev indisponível (C52): nada gravado, sem nível';

/**
 * Cria o cliente do Jev para a gravação, ou null quando falta a chave (C52).
 * @returns {object|null} Cliente, ou null se `TYPESAFE_API_KEY` não existir.
 * @throws {Error} Qualquer erro que não seja a chave ausente.
 */
function criarClienteParaGravar() {
  try {
    return criarClientePadrao();
  } catch (erro) {
    if (erro instanceof ErroJev && erro.codigo === 'CHAVE_AUSENTE') return null;
    throw erro;
  }
}

/**
 * Classifica e GRAVA o nível das subtarefas livres e sem nível (C47). Com `--dry-run` só mostra.
 * Sem resposta do Jev (modo off, sem chave, rede, 401, 429, 529, timeout) recusa gravar (C52).
 * @param {{opcoes: Record<string, string|true>}} argumentos Argumentos lidos.
 * @returns {Promise<number>} Código de saída (`REVISAR` se algo precisa de revisão humana,
 *   `DESLIGADO` no modo off, `JEV_INDISPONIVEL` se o Jev não respondeu).
 */
export async function executarGravar({ opcoes }) {
  if (carregarConfiguracao().modo === MODOS.DESLIGADO) {
    console.error(`${MENSAGEM_DESLIGADO} ${MENSAGEM_RECUSA_JEV}`);
    return CODIGOS_SAIDA.DESLIGADO;
  }
  const cliente = criarClienteParaGravar();
  if (!cliente) {
    console.error(`TYPESAFE_API_KEY não definida. ${MENSAGEM_RECUSA_JEV}`);
    return CODIGOS_SAIDA.JEV_INDISPONIVEL;
  }
  const arquivoQuadro = resolve(lerTexto(opcoes, 'quadro', ARQUIVO_QUADRO));
  const linhas = [];
  let revisar = false;
  let jevFalhou = false;
  for (const item of escolherItens(opcoes, arquivoQuadro)) {
    const sugestao = await classificarSubtarefa(item, { cliente, arquivoQuadro });
    if (sugestao.erro_codigo || !sugestao.nivel_sugerido) {
      jevFalhou = true;
      linhas.push([item.id, 'não', '—', '—', '—', '—', MOTIVO_RECUSA_JEV]);
      continue;
    }
    const resultado = gravarClassificacao({ item, sugestao, arquivoQuadro },
      { reclassificar: Boolean(opcoes.reclassificar), simular: Boolean(opcoes['dry-run']) });
    const decisao = resultado.decisao;
    revisar = revisar || Boolean(decisao?.revisar);
    linhas.push([item.id, resultado.gravado ? 'sim' : 'não', decisao?.nivel ?? '—',
      decisao?.effort ?? '—', decisao ? (decisao.jevDecidiu ? 'SIM' : 'NAO') : '—',
      decisao?.fonte ?? '—', resultado.recusa ?? '—']);
  }
  const texto = linhas.length ? montarTabela(COLUNAS_GRAVACAO, linhas) : 'Nada a gravar.';
  imprimir({ json: Boolean(opcoes.json), objeto: linhas, texto });
  if (jevFalhou) console.error(MENSAGEM_RECUSA_JEV);
  if (jevFalhou) return CODIGOS_SAIDA.JEV_INDISPONIVEL;
  return revisar ? CODIGOS_SAIDA.REVISAR : CODIGOS_SAIDA.OK;
}
