// ============================================================================
// MODAL "REGRAS DE ANÁLISE INICIAIS" - edita as regras de cada ideia e salva no
// Supabase (tabela novos_negocios), junto com o prompt que a IA vai seguir.
// ============================================================================
import { PARAMETROS_ANALISE_INICIAIS, montarPromptAnalise } from './regrasAnaliseIniciais.js';
import { carregarParametros, salvarParametros } from './parametrosAnaliseRepositorio.js';
import { analisarNumeroOpcional } from './numeros.js';

/**
 * Busca os elementos do modal.
 * @param {HTMLDialogElement} modal - Elemento do modal.
 * @returns {object} Elementos usados pelo modal.
 */
function buscarElementos(modal) {
  const pegar = id => modal.querySelector(`#${id}`);
  return {
    formulario: pegar('parametros-formulario'),
    ideia: pegar('parametros-ideia'),
    horas: pegar('parametros-horas'),
    investimento: pegar('parametros-investimento'),
    retorno: pegar('parametros-retorno'),
    regras: pegar('parametros-regras'),
    prompt: pegar('parametros-prompt'),
    mensagem: pegar('parametros-mensagem'),
    restaurar: pegar('parametros-restaurar'),
  };
}

/**
 * Preenche o formulário com um conjunto de parâmetros.
 * @param {object} el - Elementos do modal.
 * @param {import('./regrasAnaliseIniciais.js').ParametrosAnalise} p - Parâmetros.
 * @returns {void}
 */
function preencherFormulario(el, p) {
  const texto = valor => (valor === null || valor === undefined ? '' : String(valor).replace('.', ','));
  el.horas.value = texto(p.horasSemanaMax);
  el.investimento.value = texto(p.investimentoMax);
  el.retorno.value = texto(p.retornoMaxMeses);
  el.regras.value = p.regras;
}

/**
 * Lê os parâmetros digitados no formulário.
 * @param {object} el - Elementos do modal.
 * @returns {import('./regrasAnaliseIniciais.js').ParametrosAnalise} Parâmetros digitados.
 */
function lerFormulario(el) {
  return {
    horasSemanaMax: analisarNumeroOpcional(el.horas.value),
    investimentoMax: analisarNumeroOpcional(el.investimento.value),
    retornoMaxMeses: analisarNumeroOpcional(el.retorno.value),
    regras: el.regras.value,
  };
}

/**
 * Mostra uma mensagem de estado no modal.
 * @param {object} el - Elementos do modal.
 * @param {string} texto - Mensagem.
 * @param {boolean} [erro] - Se true, destaca como erro.
 * @returns {void}
 */
function mostrarMensagem(el, texto, erro = false) {
  el.mensagem.textContent = texto;
  el.mensagem.dataset.erro = erro ? 'sim' : 'nao';
}

/**
 * Liga o modal: edição, prompt ao vivo, restaurar e salvar.
 * @param {HTMLDialogElement} modal - Elemento do modal.
 * @returns {(ideia: object) => Promise<void>} Função que abre o modal para uma ideia.
 */
export function prepararModalParametros(modal) {
  const el = buscarElementos(modal);
  let ideiaAtual = null;

  const atualizarPrompt = () => {
    el.prompt.value = montarPromptAnalise(ideiaAtual, lerFormulario(el));
  };

  el.formulario.addEventListener('input', atualizarPrompt);
  el.restaurar.addEventListener('click', () => {
    preencherFormulario(el, PARAMETROS_ANALISE_INICIAIS);
    atualizarPrompt();
    mostrarMensagem(el, 'Regras iniciais restauradas. Clique em Salvar para gravar no banco.');
  });
  el.formulario.addEventListener('submit', async evento => {
    evento.preventDefault();
    await salvar(el, ideiaAtual, lerFormulario(el));
  });

  return async ideia => {
    ideiaAtual = ideia;
    el.ideia.textContent = `${ideia.codigo} — ${ideia.nome}`;
    preencherFormulario(el, PARAMETROS_ANALISE_INICIAIS);
    atualizarPrompt();
    modal.showModal();
    await carregarDoBanco(el, ideia, atualizarPrompt);
  };
}

/**
 * Carrega do banco os parâmetros salvos da ideia (se houver) e mostra no formulário.
 * @param {object} el - Elementos do modal.
 * @param {{codigo: string}} ideia - Ideia aberta.
 * @param {() => void} atualizarPrompt - Recalcula o prompt exibido.
 * @returns {Promise<void>}
 */
async function carregarDoBanco(el, ideia, atualizarPrompt) {
  mostrarMensagem(el, 'Carregando do banco...');
  try {
    const salvos = await carregarParametros(ideia.codigo);
    if (salvos) preencherFormulario(el, salvos);
    atualizarPrompt();
    mostrarMensagem(el, salvos ? 'Regras carregadas do banco.' : 'Ainda não salvo: valores iniciais.');
  } catch (erro) {
    mostrarMensagem(el, `Não foi possível ler o banco (${erro.message}). Mostrando os valores iniciais.`, true);
  }
}

/**
 * Salva os parâmetros e o prompt da ideia no banco.
 * @param {object} el - Elementos do modal.
 * @param {{codigo: string, nome: string}} ideia - Ideia aberta.
 * @param {import('./regrasAnaliseIniciais.js').ParametrosAnalise} parametros - Parâmetros.
 * @returns {Promise<void>}
 */
async function salvar(el, ideia, parametros) {
  mostrarMensagem(el, 'Salvando...');
  try {
    await salvarParametros({
      projetoId: ideia.codigo,
      nome: ideia.nome,
      parametros,
      prompt: montarPromptAnalise(ideia, parametros),
    });
    mostrarMensagem(el, 'Salvo no banco (regras e prompt).');
  } catch (erro) {
    mostrarMensagem(el, `Não foi possível salvar: ${erro.message}`, true);
  }
}
