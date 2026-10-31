/**
 * Moldura da interface (barra lateral, situação, camadas) e partida do roteador.
 * Estrutura e textos do original: docs/inventario/telas.md ("Moldura") e
 * docs/original/assets/index-Ct94erbr.js. As telas entram por `registrarTela` (navegacao.ts).
 */
import {
  ROTAS,
  Roteador,
  criarGuardaPadrao,
  criarVerificadorPlataforma,
  obterMontadorTela,
  type DefinicaoRota,
  type LimpezaTela,
  type NomeRota,
} from './navegacao';

const SELETORES = {
  aplicativo: '#aplicativo',
  barraLateral: '#barra-lateral',
  menu: '#menu-principal',
  conteudo: '#conteudo-tela',
  botaoMarca: '#botao-marca',
  botaoSair: '#botao-sair',
  botaoRecolher: '#botao-recolher',
  rotuloVersao: '#rotulo-versao',
  situacaoAuth: '#situacao-auth',
  situacaoMcp: '#situacao-mcp',
  situacaoProjetos: '#situacao-projetos',
  textoSituacao: '.situacao__texto',
  consentimento: '#camada-consentimento-mcp',
  consentimentoMensagem: '#consentimento-mcp-mensagem',
  consentimentoRedirecionamento: '#consentimento-mcp-redirecionamento',
  atualizacao: '#camada-atualizacao',
  atualizacaoVersao: '#atualizacao-versao',
  atualizacaoObrigatoria: '#atualizacao-obrigatoria',
  atualizacaoDepois: '#atualizacao-depois',
} as const;

const CLASSES = {
  telaCheia: 'layout-aplicativo--tela-cheia',
  recolhida: 'barra-lateral--recolhida',
  itemMenu: 'menu__item',
  itemMenuAtivo: 'menu__item--ativo',
  siglaMenu: 'menu__sigla',
  rotuloMenu: 'menu__rotulo',
  situacaoAtiva: 'situacao__item--ativo',
  emConstrucao: 'em-construcao',
  emConstrucaoTitulo: 'em-construcao__titulo',
  emConstrucaoTexto: 'em-construcao__texto',
  emConstrucaoDona: 'em-construcao__dona',
} as const;

// TODO(CLONE.13.2): mover estes textos para src/renderer/textos.ts quando ele existir.
const TEXTOS = {
  auth: 'Auth',
  autenticado: 'Autenticado',
  desconectado: 'Desconectado',
  mcp: 'MCP',
  ativo: 'Ativo',
  parado: 'Parado',
  prefixoProjetos: 'Proj',
  umProjeto: '1 projeto',
  sufixoProjetos: 'projetos',
  semProjetos: '—',
  versao: 'Chaos Code v',
  recolher: 'Recolher',
  recolherMenu: 'Recolher menu',
  expandirMenu: 'Expandir menu',
  emConstrucao: 'Tela em construção.',
  subtarefaDona: 'Subtarefa:',
  erroTela: 'Não foi possível abrir esta tela.',
  clienteDesconhecido: 'CLI desconhecido',
  mensagemConsentimento: ' quer se conectar ao servidor MCP local.',
  redirecionamento: 'Redirecionamento: ',
  versaoAtualizacao: 'Versão ',
} as const;

const EVENTO_SESSAO_INVALIDA = 'auth:invalid';
const VALOR_AUTORIZAR = 'autorizar';
const VALOR_INSTALAR = 'instalar';

/** Situação do aplicativo que a moldura mostra e a guarda consulta. */
interface FonteEstadoAplicativo {
  estaAutenticado(): Promise<boolean>;
  consultarPlataforma(): Promise<boolean>;
  sair(): Promise<void>;
  /** true = servidor MCP ativo; null = ainda sem canal para saber. */
  mcpAtivo(): Promise<boolean | null>;
  /** Quantidade de projetos; null = ainda sem canal para saber. */
  quantidadeProjetos(): Promise<number | null>;
}

/** Mostra uma rota que passou pela guarda. */
type ExibidorDeRota = (rota: DefinicaoRota) => Promise<void>;

/** Pedido de consentimento MCP (payload do evento `mcp:consent-request`). */
export interface PedidoConsentimentoMcp {
  nomeCliente: string | null;
  redirectUri: string;
}

/** Dados da janela de atualização (resultado de `check_for_update`). */
export interface DadosAtualizacao {
  versao: string;
  obrigatoria: boolean;
}

/**
 * Busca um elemento obrigatório da moldura.
 * @param seletor - Seletor CSS.
 * @param raiz - Onde procurar (padrão: documento).
 * @returns Elemento encontrado.
 * @throws {Error} Se o `index.html` não tiver o elemento.
 */
function obterElemento<T extends HTMLElement>(seletor: string, raiz: ParentNode = document): T {
  const elemento = raiz.querySelector<T>(seletor);
  if (!elemento) throw new Error(`Elemento da moldura não encontrado: ${seletor}`);

  return elemento;
}

/**
 * Fonte provisória: deixa ver a moldura antes dos canais IPC existirem.
 * Começa "logada" de propósito, só em memória; sair a desliga até recarregar a janela.
 * @returns Fonte com valores provisórios.
 */
function criarFonteProvisoria(): FonteEstadoAplicativo {
  let autenticado = true;

  return {
    // TODO(CLONE.4.12): get_auth_status pelo canal de login.
    estaAutenticado: async () => autenticado,
    // TODO(CLONE.4.12): check_platform_online (commands::auth do original).
    consultarPlataforma: async () => true,
    // TODO(CLONE.4.12): logout (revoga o token e limpa o cofre).
    sair: async () => {
      autenticado = false;
    },
    // TODO(CLONE.8.10): situação do servidor MCP.
    mcpAtivo: async () => null,
    // TODO(CLONE.3.7): list_projects para contar os projetos.
    quantidadeProjetos: async () => null,
  };
}

/**
 * Escreve o texto de um item da área de situação e liga o ponto verde quando ativo.
 * @param seletorItem - Seletor do item (`#situacao-auth`...).
 * @param texto - Texto do item.
 * @param ativo - Se o ponto fica verde.
 */
function escreverSituacao(seletorItem: string, texto: string, ativo: boolean): void {
  const item = obterElemento<HTMLElement>(seletorItem);
  obterElemento<HTMLElement>(SELETORES.textoSituacao, item).textContent = texto;
  item.classList.toggle(CLASSES.situacaoAtiva, ativo);
}

/**
 * Monta o texto da quantidade de projetos ("Proj 1 projeto", "Proj 3 projetos").
 * @param quantidade - Quantidade de projetos, ou null se desconhecida.
 * @returns Texto da situação.
 */
function textoProjetos(quantidade: number | null): string {
  if (quantidade === null) return `${TEXTOS.prefixoProjetos} ${TEXTOS.semProjetos}`;
  if (quantidade === 1) return `${TEXTOS.prefixoProjetos} ${TEXTOS.umProjeto}`;

  return `${TEXTOS.prefixoProjetos} ${quantidade} ${TEXTOS.sufixoProjetos}`;
}

/**
 * Atualiza a área de situação (Auth, MCP, Proj) como a barra do original.
 * @param fonte - Situação do aplicativo.
 * @returns Promessa resolvida quando os três itens forem escritos.
 */
async function atualizarSituacao(fonte: FonteEstadoAplicativo): Promise<void> {
  const [autenticado, mcpAtivo, quantidade] = await Promise.all([
    fonte.estaAutenticado(),
    fonte.mcpAtivo(),
    fonte.quantidadeProjetos(),
  ]);

  const textoAuth = autenticado ? TEXTOS.autenticado : TEXTOS.desconectado;
  const textoMcp = mcpAtivo ? TEXTOS.ativo : TEXTOS.parado;
  escreverSituacao(SELETORES.situacaoAuth, `${TEXTOS.auth}: ${textoAuth}`, autenticado);
  escreverSituacao(SELETORES.situacaoMcp, `${TEXTOS.mcp}: ${textoMcp}`, mcpAtivo === true);
  escreverSituacao(SELETORES.situacaoProjetos, textoProjetos(quantidade), quantidade !== null);
}

/**
 * Mostra "Chaos Code v{versão}" no rodapé da barra lateral.
 * @returns Promessa resolvida quando a versão for escrita (ou ignorada em caso de erro).
 */
async function mostrarVersao(): Promise<void> {
  try {
    const informacoes = await window.chaosCode.obterInformacoes();
    obterElemento<HTMLElement>(SELETORES.rotuloVersao).textContent =
      `${TEXTOS.versao}${informacoes.versao}`;
  } catch {
    // Sem a versão o rótulo continua "Chaos Code"; nada mais depende dela.
  }
}

/**
 * Cria o botão de um item do menu lateral.
 * @param rota - Rota do item.
 * @param aoEscolher - O que fazer ao clicar.
 * @returns Botão pronto.
 */
function criarItemMenu(rota: DefinicaoRota, aoEscolher: (nome: NomeRota) => void): HTMLElement {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = CLASSES.itemMenu;
  botao.dataset.rota = rota.nome;
  botao.title = rota.rotulo;

  const sigla = document.createElement('span');
  sigla.className = CLASSES.siglaMenu;
  sigla.setAttribute('aria-hidden', 'true');
  sigla.textContent = rota.sigla;

  const rotulo = document.createElement('span');
  rotulo.className = CLASSES.rotuloMenu;
  rotulo.textContent = rota.rotulo;

  botao.append(sigla, rotulo);
  botao.addEventListener('click', () => aoEscolher(rota.nome));
  return botao;
}

/**
 * Preenche o menu lateral com as rotas marcadas para o menu.
 * @param rotas - Rotas do aplicativo.
 * @param aoEscolher - O que fazer ao escolher um item.
 */
function montarMenu(rotas: readonly DefinicaoRota[], aoEscolher: (nome: NomeRota) => void): void {
  const menu = obterElemento<HTMLElement>(SELETORES.menu);
  const rotasDoMenu = rotas.filter((rota) => rota.noMenu);
  const itens = rotasDoMenu.map((rota) => criarItemMenu(rota, aoEscolher));
  menu.replaceChildren(...itens);
}

/**
 * Destaca no menu o item da rota atual.
 * @param nome - Rota mostrada.
 */
function marcarItemAtivo(nome: NomeRota): void {
  const itens = document.querySelectorAll<HTMLElement>(`.${CLASSES.itemMenu}`);
  itens.forEach((item) => {
    const ehAtual = item.dataset.rota === nome;
    item.classList.toggle(CLASSES.itemMenuAtivo, ehAtual);
    if (ehAtual) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
}

/**
 * Liga o botão de recolher/expandir a barra lateral (256 px ↔ 80 px no original).
 */
function ligarBotaoRecolher(): void {
  const barra = obterElemento<HTMLElement>(SELETORES.barraLateral);
  const botao = obterElemento<HTMLButtonElement>(SELETORES.botaoRecolher);
  const rotulo = obterElemento<HTMLElement>('.botao-lateral__rotulo', botao);

  botao.addEventListener('click', () => {
    const recolhida = barra.classList.toggle(CLASSES.recolhida);
    const titulo = recolhida ? TEXTOS.expandirMenu : TEXTOS.recolherMenu;
    botao.title = titulo;
    botao.setAttribute('aria-label', titulo);
    botao.setAttribute('aria-expanded', String(!recolhida));
    rotulo.textContent = recolhida ? '' : TEXTOS.recolher;
  });
}

/**
 * Monta o marcador das telas que ainda não foram feitas.
 * @param rota - Rota sem tela registrada.
 * @param conteiner - Área principal.
 */
function montarMarcadorEmConstrucao(rota: DefinicaoRota, conteiner: HTMLElement): void {
  const secao = document.createElement('section');
  secao.className = CLASSES.emConstrucao;

  const titulo = document.createElement('h1');
  titulo.className = CLASSES.emConstrucaoTitulo;
  titulo.textContent = rota.rotulo;

  const texto = document.createElement('p');
  texto.className = CLASSES.emConstrucaoTexto;
  texto.textContent = TEXTOS.emConstrucao;

  const dona = document.createElement('p');
  dona.className = CLASSES.emConstrucaoDona;
  dona.textContent = `${TEXTOS.subtarefaDona} ${rota.subtarefaDona}`;

  secao.append(titulo, texto, dona);
  conteiner.replaceChildren(secao);
}

/**
 * Cria a função que mostra uma rota: troca o layout, o item ativo e o conteúdo.
 * @param fonte - Situação do aplicativo (para atualizar a barra a cada troca).
 * @returns Função para o `aoNavegar` do roteador.
 */
function criarExibidorDeRotas(fonte: FonteEstadoAplicativo): ExibidorDeRota {
  const aplicativo = obterElemento<HTMLElement>(SELETORES.aplicativo);
  const conteiner = obterElemento<HTMLElement>(SELETORES.conteudo);
  let limpezaAtual: LimpezaTela | null = null;

  return async (rota) => {
    limpezaAtual?.();
    limpezaAtual = null;
    aplicativo.classList.toggle(CLASSES.telaCheia, rota.publica);
    marcarItemAtivo(rota.nome);
    conteiner.replaceChildren();

    const montador = obterMontadorTela(rota.nome);
    try {
      if (!montador) montarMarcadorEmConstrucao(rota, conteiner);
      else limpezaAtual = (await montador(conteiner)) ?? null;
    } catch {
      conteiner.textContent = TEXTOS.erroTela;
    }

    conteiner.focus();
    if (!rota.publica) void atualizarSituacao(fonte);
  };
}

// TODO(CLONE.8.10): ouvir `mcp:consent-request` e responder respond_mcp_consent
// ({ requestId, approve }) com o resultado de pedirConsentimentoMcp.
/**
 * Abre a camada de consentimento MCP e espera a resposta.
 * Fecha por Esc conta como "Negar" (o diálogo é modal).
 * @param pedido - Cliente e endereço de retorno do pedido.
 * @returns true se o usuário autorizou.
 */
export function pedirConsentimentoMcp(pedido: PedidoConsentimentoMcp): Promise<boolean> {
  const camada = obterElemento<HTMLDialogElement>(SELETORES.consentimento);
  const nomeCliente = pedido.nomeCliente ?? TEXTOS.clienteDesconhecido;
  obterElemento<HTMLElement>(SELETORES.consentimentoMensagem).textContent =
    `${nomeCliente}${TEXTOS.mensagemConsentimento}`;
  obterElemento<HTMLElement>(SELETORES.consentimentoRedirecionamento).textContent =
    `${TEXTOS.redirecionamento}${pedido.redirectUri}`;

  camada.returnValue = '';
  camada.showModal();
  return new Promise((resolver) => {
    camada.addEventListener('close', () => resolver(camada.returnValue === VALOR_AUTORIZAR), {
      once: true,
    });
  });
}

// TODO(CLONE.12.7): ao achar atualização (check_for_update), chamar mostrarJanelaAtualizacao e,
// se aceita, save_pre_update_state + download_and_install_update; o botão #botao-atualizar do
// rodapé também abre esta janela.
/**
 * Abre a janela de atualização e espera a escolha. Atualização obrigatória não tem "Depois".
 * @param dados - Versão nova e se é obrigatória.
 * @returns true se o usuário escolheu "Instalar e reiniciar".
 */
export function mostrarJanelaAtualizacao(dados: DadosAtualizacao): Promise<boolean> {
  const camada = obterElemento<HTMLDialogElement>(SELETORES.atualizacao);
  obterElemento<HTMLElement>(SELETORES.atualizacaoVersao).textContent =
    `${TEXTOS.versaoAtualizacao}${dados.versao}`;
  obterElemento<HTMLElement>(SELETORES.atualizacaoObrigatoria).hidden = !dados.obrigatoria;
  obterElemento<HTMLElement>(SELETORES.atualizacaoDepois).hidden = dados.obrigatoria;

  camada.returnValue = '';
  camada.showModal();
  return new Promise((resolver) => {
    camada.addEventListener('close', () => resolver(camada.returnValue === VALOR_INSTALAR), {
      once: true,
    });
  });
}

/**
 * Liga os botões da barra lateral (marca, sair) e o evento de sessão inválida.
 * @param roteador - Roteador da interface.
 * @param fonte - Situação do aplicativo.
 */
function ligarAcoesDaMoldura(roteador: Roteador, fonte: FonteEstadoAplicativo): void {
  const sairEIrAoLogin = async (): Promise<void> => {
    await fonte.sair();
    await atualizarSituacao(fonte);
    roteador.navegar('login');
  };

  obterElemento<HTMLElement>(SELETORES.botaoMarca).addEventListener('click', () => {
    roteador.navegar('dashboard');
  });
  obterElemento<HTMLElement>(SELETORES.botaoSair).addEventListener('click', () => {
    void sairEIrAoLogin();
  });
  // Mesmo tratamento do App original: sessão inválida → sai e volta ao login.
  window.addEventListener(EVENTO_SESSAO_INVALIDA, () => {
    void sairEIrAoLogin();
  });
}

/**
 * Monta a moldura e liga o roteador.
 * @returns Promessa resolvida quando a primeira tela for mostrada.
 */
async function iniciarTela(): Promise<void> {
  const fonte = criarFonteProvisoria();
  const roteador = new Roteador({
    rotas: ROTAS,
    guarda: criarGuardaPadrao({
      estaAutenticado: () => fonte.estaAutenticado(),
      verificarPlataforma: criarVerificadorPlataforma(() => fonte.consultarPlataforma()),
    }),
    janela: window,
    aoNavegar: criarExibidorDeRotas(fonte),
  });

  montarMenu(ROTAS, (nome) => roteador.navegar(nome));
  ligarBotaoRecolher();
  ligarAcoesDaMoldura(roteador, fonte);
  void mostrarVersao();
  await roteador.iniciar();
}

void iniciarTela();
