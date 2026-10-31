/**
 * Navegação da interface: rotas, roteador por hash e guarda das rotas.
 *
 * Recria o Vue Router do original (docs/inventario/telas.md, "Estrutura do app"):
 * `/` → login; rota desconhecida → dashboard; guarda `beforeEach` que manda quem não entrou para
 * o login, tira do login quem já entrou e, em cada navegação logada, consulta
 * `check_platform_online` com o resultado guardado por 30 s (`docs/original/assets/index-*.js`).
 *
 * Open/Closed: cada tela nova só chama `registrarTela(nome, montador)`; o roteador e a moldura
 * não mudam. Rota sem tela registrada mostra o marcador "em construção".
 */

/** Nomes das rotas do clone (as telas 13.4 a 13.12 da ETAPA-005 e o dashboard do original). */
export type NomeRota =
  | 'login'
  | 'dashboard'
  | 'projetos'
  | 'tarefas'
  | 'indexacao'
  | 'grafo'
  | 'mcp'
  | 'agentes'
  | 'imagens'
  | 'configuracoes';

/** Função de limpeza devolvida por uma tela ao ser trocada (tira ouvintes, timers...). */
export type LimpezaTela = () => void;

/**
 * Monta uma tela dentro do contêiner principal.
 * Pode devolver uma função de limpeza, chamada antes da próxima tela entrar.
 */
export type MontadorTela = (
  conteiner: HTMLElement,
) => void | LimpezaTela | Promise<void | LimpezaTela>;

/** Dados fixos de uma rota. */
export interface DefinicaoRota {
  nome: NomeRota;
  /** Caminho depois do `#` (ex.: `/projetos`). */
  caminho: string;
  /** Texto do menu e do marcador "em construção". */
  rotulo: string;
  /** Sigla mostrada como ícone no menu recolhido. */
  sigla: string;
  /** Rota pública: não exige login (no original, só o login). */
  publica: boolean;
  /** Aparece no menu lateral. */
  noMenu: boolean;
  /** Subtarefa da ETAPA-005 dona da tela, mostrada no marcador "em construção". */
  subtarefaDona: string;
}

/** Resultado da guarda: seguir para a rota pedida ou desviar para outra. */
export type DecisaoGuarda = { tipo: 'seguir' } | { tipo: 'desviar'; destino: NomeRota };

/** Guarda chamada antes de cada troca de rota (como o `beforeEach` do original). */
export type GuardaNavegacao = (rota: DefinicaoRota) => Promise<DecisaoGuarda>;

/** O que a guarda padrão precisa saber do aplicativo. */
export interface DependenciasGuarda {
  estaAutenticado: () => Promise<boolean>;
  /** `check_platform_online` (já com o cache de 30 s). */
  verificarPlataforma: () => Promise<boolean>;
}

/** Parte da janela que o roteador usa (injetada para poder trocar). */
export interface JanelaRoteador {
  location: { hash: string };
  addEventListener(tipo: 'hashchange', ouvinte: () => void): void;
  removeEventListener(tipo: 'hashchange', ouvinte: () => void): void;
}

/** Dependências do roteador. */
export interface DependenciasRoteador {
  rotas: readonly DefinicaoRota[];
  guarda: GuardaNavegacao;
  janela: JanelaRoteador;
  /** Chamado quando uma rota passa pela guarda e deve ser mostrada. */
  aoNavegar: (rota: DefinicaoRota) => void | Promise<void>;
}

/** Validade do resultado de `check_platform_online` no original (`3e4` ms). */
export const VALIDADE_VERIFICACAO_PLATAFORMA_MS = 30_000;

/** Rota de entrada (`/` do original redireciona para o login). */
export const ROTA_INICIAL: NomeRota = 'login';

/** Rota para quem já entrou e para caminho desconhecido (`/:pathMatch(.*)*` → `/dashboard`). */
export const ROTA_PADRAO_LOGADO: NomeRota = 'dashboard';

const PREFIXO_HASH = '#';
const CAMINHO_RAIZ = '/';

// TODO(CLONE.13.2): rótulos virão de src/renderer/textos.ts quando ele existir.
/**
 * Rotas do clone, na ordem do menu. Os rótulos seguem o original quando há tela equivalente
 * (Dashboard, Projetos, Agentes, Galeria, Configurações); as outras são telas novas do clone.
 */
export const ROTAS: readonly DefinicaoRota[] = [
  { nome: 'login', caminho: '/login', rotulo: 'Login', sigla: 'LG', publica: true,
    noMenu: false, subtarefaDona: 'CLONE.13.4' },
  { nome: 'dashboard', caminho: '/dashboard', rotulo: 'Dashboard', sigla: 'DB', publica: false,
    noMenu: true, subtarefaDona: '— (sem subtarefa própria)' },
  { nome: 'projetos', caminho: '/projetos', rotulo: 'Projetos', sigla: 'PJ', publica: false,
    noMenu: true, subtarefaDona: 'CLONE.13.5' },
  { nome: 'tarefas', caminho: '/tarefas', rotulo: 'Tarefas', sigla: 'TF', publica: false,
    noMenu: true, subtarefaDona: 'CLONE.13.6' },
  { nome: 'indexacao', caminho: '/indexacao', rotulo: 'Busca', sigla: 'BS', publica: false,
    noMenu: true, subtarefaDona: 'CLONE.13.7' },
  { nome: 'grafo', caminho: '/grafo', rotulo: 'Grafo', sigla: 'GR', publica: false,
    noMenu: true, subtarefaDona: 'CLONE.13.8' },
  { nome: 'mcp', caminho: '/mcp', rotulo: 'MCP e CLIs', sigla: 'MC', publica: false,
    noMenu: true, subtarefaDona: 'CLONE.13.9' },
  { nome: 'agentes', caminho: '/agentes', rotulo: 'Agentes', sigla: 'AG', publica: false,
    noMenu: true, subtarefaDona: 'CLONE.13.10' },
  { nome: 'imagens', caminho: '/imagens', rotulo: 'Galeria', sigla: 'GL', publica: false,
    noMenu: true, subtarefaDona: 'CLONE.13.11' },
  { nome: 'configuracoes', caminho: '/configuracoes', rotulo: 'Configurações', sigla: 'CF',
    publica: false, noMenu: true, subtarefaDona: 'CLONE.13.12' },
];

const telasRegistradas = new Map<NomeRota, MontadorTela>();

/**
 * Registra a função que monta uma tela. Cada tela nova (CLONE.13.4 a 13.12) só faz isto.
 * @param nome - Rota da tela.
 * @param montador - Função que monta a tela no contêiner principal.
 */
export function registrarTela(nome: NomeRota, montador: MontadorTela): void {
  telasRegistradas.set(nome, montador);
}

/**
 * Devolve a função que monta a tela da rota, se alguma tela se registrou.
 * @param nome - Rota procurada.
 * @returns Montador registrado, ou undefined (a moldura mostra "em construção").
 */
export function obterMontadorTela(nome: NomeRota): MontadorTela | undefined {
  return telasRegistradas.get(nome);
}

/**
 * Procura uma rota pelo nome.
 * @param rotas - Rotas conhecidas.
 * @param nome - Nome procurado.
 * @returns Definição da rota.
 * @throws {Error} Se o nome não estiver na lista (erro de programação).
 */
export function buscarRota(rotas: readonly DefinicaoRota[], nome: NomeRota): DefinicaoRota {
  const rota = rotas.find((candidata) => candidata.nome === nome);
  if (!rota) throw new Error(`Rota não cadastrada: ${nome}`);

  return rota;
}

/**
 * Lê o caminho do hash: `#/projetos` → `/projetos`; vazio vira `/`.
 * @param hash - Valor de `location.hash`.
 * @returns Caminho sem o `#`, sem barra no fim e sem parâmetros.
 */
export function lerCaminhoDoHash(hash: string): string {
  const semPrefixo = hash.startsWith(PREFIXO_HASH) ? hash.slice(PREFIXO_HASH.length) : hash;
  const semParametros = semPrefixo.split('?')[0] ?? '';
  const semBarraFinal = semParametros.replace(/\/+$/, '');

  return semBarraFinal || CAMINHO_RAIZ;
}

/**
 * Resolve o caminho para uma rota, como o original: `/` → login; desconhecido → dashboard.
 * @param rotas - Rotas conhecidas.
 * @param caminho - Caminho lido do hash.
 * @returns Rota correspondente.
 */
export function resolverRota(rotas: readonly DefinicaoRota[], caminho: string): DefinicaoRota {
  if (caminho === CAMINHO_RAIZ) return buscarRota(rotas, ROTA_INICIAL);

  const encontrada = rotas.find((rota) => rota.caminho === caminho);
  return encontrada ?? buscarRota(rotas, ROTA_PADRAO_LOGADO);
}

/**
 * Monta o hash de uma rota (`#/projetos`).
 * @param rota - Rota de destino.
 * @returns Texto para `location.hash`.
 */
export function montarHash(rota: DefinicaoRota): string {
  return `${PREFIXO_HASH}${rota.caminho}`;
}

/**
 * Envolve `check_platform_online` com o cache do original: repete o último resultado por 30 s.
 * @param consultar - Consulta real à plataforma.
 * @param agora - Relógio em ms (injetado; padrão `Date.now`).
 * @returns Função que consulta só quando o resultado guardado venceu.
 */
export function criarVerificadorPlataforma(
  consultar: () => Promise<boolean>,
  agora: () => number = Date.now,
): () => Promise<boolean> {
  let ultimo: { valor: boolean; verificadoEm: number } | null = null;

  return async () => {
    const instante = agora();
    const aindaValido =
      ultimo !== null && instante - ultimo.verificadoEm < VALIDADE_VERIFICACAO_PLATAFORMA_MS;
    if (ultimo && aindaValido) return ultimo.valor;

    const valor = await consultar();
    ultimo = { valor, verificadoEm: instante };
    return valor;
  };
}

/**
 * Cria a guarda com as mesmas regras do `beforeEach` do original:
 * pública que não é o login → segue; logado indo ao login → dashboard; não logado em rota
 * fechada → login; logado em rota fechada → consulta a plataforma (erro ignorado) e segue.
 * @param dependencias - Situação do login e verificação da plataforma.
 * @returns Guarda pronta para o roteador.
 */
export function criarGuardaPadrao(dependencias: DependenciasGuarda): GuardaNavegacao {
  return async (rota) => {
    const ehLogin = rota.nome === ROTA_INICIAL;
    if (rota.publica && !ehLogin) return { tipo: 'seguir' };

    const autenticado = await dependencias.estaAutenticado();
    if (autenticado && ehLogin) return { tipo: 'desviar', destino: ROTA_PADRAO_LOGADO };
    if (!autenticado && !rota.publica) return { tipo: 'desviar', destino: ROTA_INICIAL };

    if (autenticado) await verificarSemFalhar(dependencias.verificarPlataforma);
    return { tipo: 'seguir' };
  };
}

/**
 * Chama a verificação da plataforma sem deixar o erro parar a navegação (`try{await qs()}catch{}`).
 * @param verificar - Verificação da plataforma.
 * @returns Promessa resolvida mesmo se a verificação falhar.
 */
async function verificarSemFalhar(verificar: () => Promise<boolean>): Promise<void> {
  try {
    await verificar();
  } catch {
    // O original também ignora a falha: a plataforma fora do ar não bloqueia as telas locais.
  }
}

/** Roteador por hash (`#/caminho`), com guarda e descarte de navegações atropeladas. */
export class Roteador {
  private readonly dependencias: DependenciasRoteador;

  private numeroNavegacao = 0;

  /** Hash trocado pelo próprio roteador só para corrigir o endereço (não é navegação nova). */
  private hashCorrigido: string | null = null;

  private readonly ouvirHash = (): void => {
    const ehCorrecaoPropria = this.dependencias.janela.location.hash === this.hashCorrigido;
    this.hashCorrigido = null;
    if (ehCorrecaoPropria) return;

    void this.resolverHashAtual();
  };

  /**
   * @param dependencias - Rotas, guarda, janela e o que fazer ao mostrar uma rota.
   */
  constructor(dependencias: DependenciasRoteador) {
    this.dependencias = dependencias;
  }

  /**
   * Começa a ouvir o hash e mostra a rota atual.
   * @returns Promessa resolvida quando a primeira rota for tratada.
   */
  async iniciar(): Promise<void> {
    this.dependencias.janela.addEventListener('hashchange', this.ouvirHash);
    await this.resolverHashAtual();
  }

  /** Para de ouvir o hash. */
  parar(): void {
    this.dependencias.janela.removeEventListener('hashchange', this.ouvirHash);
  }

  /**
   * Navega para uma rota trocando o hash (o `hashchange` faz o resto).
   * @param nome - Rota de destino.
   */
  navegar(nome: NomeRota): void {
    const destino = montarHash(buscarRota(this.dependencias.rotas, nome));
    if (this.dependencias.janela.location.hash === destino) return;

    this.dependencias.janela.location.hash = destino;
  }

  /**
   * Força uma nova passagem pela guarda na rota atual (ex.: depois do login ou do logout).
   * @returns Promessa resolvida quando a rota for tratada.
   */
  async recarregar(): Promise<void> {
    await this.resolverHashAtual();
  }

  /**
   * Resolve o hash atual: passa pela guarda e mostra a rota ou desvia.
   * Se outra navegação começar no meio, esta é descartada.
   * @returns Promessa resolvida quando a rota for tratada.
   */
  private async resolverHashAtual(): Promise<void> {
    this.numeroNavegacao += 1;
    const numeroDestaNavegacao = this.numeroNavegacao;
    const { rotas, guarda, janela, aoNavegar } = this.dependencias;

    const rota = resolverRota(rotas, lerCaminhoDoHash(janela.location.hash));
    const decisao = await guarda(rota);
    const foiAtropelada = numeroDestaNavegacao !== this.numeroNavegacao;
    if (foiAtropelada) return;

    if (decisao.tipo === 'desviar') {
      this.desviar(decisao.destino);
      return;
    }

    this.corrigirHash(rota);
    await aoNavegar(rota);
  }

  /**
   * Troca o hash para o destino da guarda; se o hash já for esse, resolve de novo na hora.
   * @param destino - Rota indicada pela guarda.
   */
  private desviar(destino: NomeRota): void {
    const hashDestino = montarHash(buscarRota(this.dependencias.rotas, destino));
    if (this.dependencias.janela.location.hash !== hashDestino) {
      this.dependencias.janela.location.hash = hashDestino;
      return;
    }

    void this.resolverHashAtual();
  }

  /**
   * Deixa o hash igual ao caminho da rota mostrada (ex.: `#/xyz` → `#/dashboard`) sem nova
   * navegação: o `hashchange` causado por esta troca é ignorado.
   * @param rota - Rota que está sendo mostrada.
   */
  private corrigirHash(rota: DefinicaoRota): void {
    const hashCorreto = montarHash(rota);
    if (this.dependencias.janela.location.hash === hashCorreto) return;

    this.hashCorrigido = hashCorreto;
    this.dependencias.janela.location.hash = hashCorreto;
  }
}
