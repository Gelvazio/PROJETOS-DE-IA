const DIAS_POR_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MES_FEVEREIRO = 2;
const STATUS_ABERTO = 0;
const RECORRENCIA_ATIVA = 1;
const TAMANHO_COMPETENCIA = 7;

/**
 * Indica se o ano e bissexto.
 * @param {number} ano - Ano com quatro digitos.
 * @returns {boolean} true se for bissexto.
 */
function ehAnoBissexto(ano) {
  return (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0;
}

/**
 * Devolve o ultimo dia do mes informado.
 * @param {number} ano - Ano com quatro digitos.
 * @param {number} mes - Mes de 1 a 12.
 * @returns {number} Quantidade de dias do mes.
 */
function obterUltimoDiaDoMes(ano, mes) {
  if (mes === MES_FEVEREIRO && ehAnoBissexto(ano)) return 29;
  return DIAS_POR_MES[mes - 1];
}

/**
 * Calcula a data de vencimento de uma competencia, limitando o dia ao fim do mes.
 * @param {string} competencia - Competencia no formato 'AAAA-MM'.
 * @param {number} diaVencimento - Dia de vencimento de 1 a 31.
 * @returns {string} Data no formato 'AAAA-MM-DD'.
 */
export function calcularDataVencimento(competencia, diaVencimento) {
  const [textoAno, textoMes] = competencia.split('-');
  const ultimoDia = obterUltimoDiaDoMes(Number(textoAno), Number(textoMes));
  const dia = Math.min(Number(diaVencimento), ultimoDia);
  return `${textoAno}-${textoMes}-${String(dia).padStart(2, '0')}`;
}

/**
 * Verifica se a recorrencia vale na competencia informada.
 * @param {string} competencia - Competencia 'AAAA-MM'.
 * @param {object} recorrencia - Registro da tabela recorrencia.
 * @returns {boolean} true se ativa e dentro do periodo de vigencia.
 */
function estaVigente(competencia, recorrencia) {
  if (Number(recorrencia.ativo) !== RECORRENCIA_ATIVA) return false;

  const mesInicio = String(recorrencia.data_inicio).slice(0, TAMANHO_COMPETENCIA);
  if (competencia < mesInicio) return false;

  if (!recorrencia.data_fim) return true;
  const mesFim = String(recorrencia.data_fim).slice(0, TAMANHO_COMPETENCIA);
  return competencia <= mesFim;
}

/**
 * Monta a ocorrencia virtual de uma recorrencia em uma competencia.
 * @param {string} competencia - Competencia 'AAAA-MM'.
 * @param {object} recorrencia - Registro da tabela recorrencia.
 * @returns {object} Ocorrencia virtual.
 */
function montarOcorrencia(competencia, recorrencia) {
  return {
    virtual: true,
    recorrencia_id: recorrencia.id,
    competencia,
    descricao: recorrencia.descricao,
    tipo: recorrencia.tipo,
    valor: recorrencia.valor,
    data_vencimento: calcularDataVencimento(competencia, recorrencia.dia_vencimento),
    data_pagamento: null,
    status: STATUS_ABERTO,
    qtd_parcelas: 1,
    parcela_atual: 1,
    loja_id: recorrencia.loja_id,
    usuario_id: recorrencia.usuario_id,
  };
}

/**
 * Calcula as ocorrencias virtuais das recorrencias em um mes.
 * @param {string} competencia - Competencia 'AAAA-MM'.
 * @param {object[]} recorrencias - Recorrencias cadastradas.
 * @param {object[]} lancamentos - Lancamentos ja existentes (efetivados).
 * @returns {object[]} Ocorrencias virtuais ainda nao efetivadas.
 */
export function calcularOcorrenciasDoMes(competencia, recorrencias, lancamentos) {
  if (!competencia || !Array.isArray(recorrencias) || !recorrencias.length) return [];

  const efetivados = new Set(
    (Array.isArray(lancamentos) ? lancamentos : [])
      .filter((lancamento) => lancamento.recorrencia_id != null)
      .map((lancamento) => `${lancamento.recorrencia_id}|${lancamento.competencia}`),
  );

  return recorrencias
    .filter((recorrencia) => estaVigente(competencia, recorrencia))
    .filter((recorrencia) => !efetivados.has(`${recorrencia.id}|${competencia}`))
    .map((recorrencia) => montarOcorrencia(competencia, recorrencia));
}
