/**
 * Tela de login (rota `login`): botão "Entrar com OAuth" que abre o navegador do sistema pelo
 * canal de login. A interface recebe só o estado (situação, erro e validade); o token fica no
 * processo principal. Textos do original em `TEXTOS.login` (textos.ts).
 */
import { ehErroIpc } from '../../compartilhado/tipos-ipc';
import type { EstadoLogin } from '../../compartilhado/tipos-login';
import { TEXTOS } from '../textos';
import type { LimpezaTela } from '../navegacao';

const CAMINHO_DESTINO_LOGADO = '#/dashboard';

const CLASSES = {
  tela: 'login-tela',
  cartao: 'login-tela__cartao',
  titulo: 'login-tela__titulo',
  subtitulo: 'login-tela__subtitulo',
  chamada: 'login-tela__chamada',
  erro: 'login-tela__erro',
  botao: 'botao botao--primario login-tela__botao',
} as const;

const NOME_APLICATIVO = 'Chaos Code';

/** Elementos da tela que mudam conforme o estado. */
interface ElementosLogin {
  botao: HTMLButtonElement;
  erro: HTMLElement;
}

/**
 * Cria um elemento com classe e texto.
 * @param etiqueta - Nome da tag.
 * @param classe - Classe CSS.
 * @param texto - Texto interno.
 * @returns Elemento criado.
 */
function criarElemento<T extends HTMLElement>(etiqueta: string, classe: string, texto = ''): T {
  const elemento = document.createElement(etiqueta) as T;
  elemento.className = classe;
  elemento.textContent = texto;
  return elemento;
}

/**
 * Monta o cartão do login dentro do contêiner.
 * @param conteiner - Contêiner principal da moldura.
 * @returns Botão e área de erro, para a tela atualizar.
 */
function montarCartao(conteiner: HTMLElement): ElementosLogin {
  const tela = criarElemento('section', CLASSES.tela);
  const cartao = criarElemento('div', CLASSES.cartao);
  const botao = criarElemento<HTMLButtonElement>('button', CLASSES.botao);
  const erro = criarElemento('p', CLASSES.erro);

  botao.type = 'button';
  botao.textContent = TEXTOS.login.loginWithOAuth;
  erro.setAttribute('role', 'alert');
  erro.hidden = true;
  cartao.append(
    criarElemento('h1', CLASSES.titulo, NOME_APLICATIVO),
    criarElemento('p', CLASSES.subtitulo, TEXTOS.login.subtitle),
    criarElemento('p', CLASSES.chamada, TEXTOS.login.tagline),
    botao,
    erro,
  );
  tela.append(cartao);
  conteiner.replaceChildren(tela);
  return { botao, erro };
}

/**
 * Mostra ou esconde a mensagem de erro.
 * @param elementos - Elementos da tela.
 * @param mensagem - Texto do erro, ou null para limpar.
 */
function mostrarErro(elementos: ElementosLogin, mensagem: string | null): void {
  elementos.erro.textContent = mensagem ?? '';
  elementos.erro.hidden = mensagem === null;
}

/**
 * Reflete o estado do login na tela: botão ocupado enquanto entra, erro quando houver e, ao
 * logar, segue para o dashboard.
 * @param elementos - Elementos da tela.
 * @param estado - Estado recebido do canal de login.
 */
function aplicarEstado(elementos: ElementosLogin, estado: EstadoLogin): void {
  const estaEntrando = estado.situacao === 'entrando';
  elementos.botao.disabled = estaEntrando;
  elementos.botao.textContent = estaEntrando
    ? TEXTOS.login.connecting
    : TEXTOS.login.loginWithOAuth;
  mostrarErro(elementos, estado.erro);
  if (estado.situacao === 'logado') window.location.hash = CAMINHO_DESTINO_LOGADO;
}

/**
 * Pede o login ao processo principal e mostra o resultado.
 * @param elementos - Elementos da tela.
 */
async function iniciarLogin(elementos: ElementosLogin): Promise<void> {
  mostrarErro(elementos, null);
  try {
    const resposta = await window.chaosCode.fazerLogin();
    if (ehErroIpc(resposta)) {
      mostrarErro(elementos, TEXTOS.login.errors_authFailed);
      return;
    }
    aplicarEstado(elementos, resposta);
  } catch {
    mostrarErro(elementos, TEXTOS.login.errors_serverUnavailable);
  }
}

/**
 * Lê o estado atual (por exemplo, login já feito antes de abrir a tela).
 * @param elementos - Elementos da tela.
 */
async function carregarEstadoInicial(elementos: ElementosLogin): Promise<void> {
  const resposta = await window.chaosCode.obterEstadoLogin();
  if (ehErroIpc(resposta)) return;

  aplicarEstado(elementos, resposta);
}

/**
 * Monta a tela de login e passa a ouvir as mudanças de estado.
 * @param conteiner - Contêiner principal da moldura.
 * @returns Função que cancela o ouvinte ao trocar de tela.
 */
export function montarTelaLogin(conteiner: HTMLElement): LimpezaTela {
  const elementos = montarCartao(conteiner);

  elementos.botao.addEventListener('click', () => {
    void iniciarLogin(elementos);
  });
  const cancelarOuvinte = window.chaosCode.aoMudarEstadoLogin((estado) => {
    aplicarEstado(elementos, estado);
  });
  void carregarEstadoInicial(elementos);
  return cancelarOuvinte;
}
