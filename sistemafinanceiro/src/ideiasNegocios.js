// ============================================================================
// IDEIAS DE NOVOS NEGÓCIOS - dados dos cards da página Gestão de Novos Negócios
// Para incluir uma ideia nova, basta acrescentar um objeto na lista abaixo.
// Todos os números são estimativas [Chute] até o Gelvazio trazer dados reais.
// ============================================================================

export const AVISO_ESTIMATIVAS =
  'Números abaixo são estimativas [Chute], feitas sem dados reais. Substituir pelos seus dados.';

/**
 * @typedef {object} Cenario
 * @property {string} nome - Pessimista, Base ou Otimista.
 * @property {string} receitaMensal - Receita mensal estimada.
 * @property {string} custoMensal - Custo mensal estimado.
 * @property {string} lucroMensal - Lucro mensal estimado.
 * @property {string} tempoRetorno - Meses até recuperar o investimento.
 */

/**
 * @typedef {object} IdeiaNegocio
 * @property {string} codigo - Código curto exibido no card (ex.: IDEIA 01).
 * @property {string} nome - Nome da ideia.
 * @property {string} tempoAGastar - Tempo a dedicar à ideia.
 * @property {string} valorAGastar - Investimento inicial e custo mensal.
 * @property {string} analiseRetorno - Resumo da análise de retorno (cenário base).
 * @property {string} tempoRetorno - Tempo para recuperar o investimento (cenário base).
 * @property {string[]} explicacao - Parágrafos que explicam a ideia toda.
 * @property {Cenario[]} cenarios - Três cenários do CFO.
 * @property {string[]} premissas - Premissas, cada uma com a confiança.
 * @property {string[]} riscos - Riscos principais.
 * @property {string[]} proximosPassos - Próximos passos baratos.
 */

/** @type {IdeiaNegocio[]} */
export const IDEIAS_NEGOCIOS = [
  {
    codigo: 'IDEIA 01',
    nome: 'IMPRESSÃO 3D',
    tempoAGastar: '10 h por semana (4 semanas de preparação)',
    valorAGastar: 'R$ 2.800 de início + R$ 700 por mês',
    analiseRetorno: 'Cenário base: R$ 1.800 de receita e R$ 1.100 de lucro por mês.',
    tempoRetorno: 'Cerca de 3 meses (base)',
    explicacao: [
      'Produzir e vender peças impressas em 3D (organizadores, vasos, miniaturas, utilidades ' +
        'domésticas e peças sob encomenda), usando uma impressora FDM de entrada e a biblioteca ' +
        'de arquivos STL que já está sendo baixada no projeto PROJETO-IMPRESSAO-3D.',
      'Venda por marketplace (Mercado Livre, Shopee) e por encomenda direta (WhatsApp e ' +
        'Instagram). O produto é barato de produzir, mas o trabalho manual de acabamento, ' +
        'embalagem e atendimento é o que limita o volume.',
      'O ganho de escala vem de poucos modelos que vendem bem: começar com 5 a 10 peças, medir ' +
        'quais saem e imprimir só essas, sem estoque parado.',
    ],
    cenarios: [
      { nome: 'Pessimista', receitaMensal: 'R$ 675 (15 peças)', custoMensal: 'R$ 450',
        lucroMensal: 'R$ 225', tempoRetorno: 'Cerca de 13 meses' },
      { nome: 'Base', receitaMensal: 'R$ 1.800 (40 peças)', custoMensal: 'R$ 700',
        lucroMensal: 'R$ 1.100', tempoRetorno: 'Cerca de 3 meses' },
      { nome: 'Otimista', receitaMensal: 'R$ 4.000 (80 peças)', custoMensal: 'R$ 1.500',
        lucroMensal: 'R$ 2.500', tempoRetorno: 'Cerca de 2 meses' },
    ],
    premissas: [
      'Impressora de entrada, filamento e acessórios custam R$ 2.800 no total. [Chute]',
      'Preço médio de R$ 45 por peça; custo mensal inclui filamento, energia, embalagem e ' +
        'taxas do marketplace. [Chute]',
      'Dedicação de 10 h por semana, sem contratar ajuda. [Provável]',
    ],
    riscos: [
      'Licença dos arquivos STL: vender peças impressas a partir de uma biblioteca baixada ' +
        'pode ser proibido. Confirmar o uso comercial antes de vender. [CONFIRMAR]',
      'Concorrência de preço nos marketplaces e peças com baixa margem.',
      'Falhas de impressão e retrabalho consomem filamento e tempo.',
    ],
    proximosPassos: [
      'Ler a licença de uso comercial da biblioteca de STL.',
      'Escolher 5 modelos e pesquisar o preço dos concorrentes.',
      'Imprimir um lote pequeno em uma impressora emprestada ou por serviço, antes de comprar.',
    ],
  },
  {
    codigo: 'IDEIA 02',
    nome: 'VÍDEO CANAL DARK YOUTUBE',
    tempoAGastar: '12 h por semana (primeiros 6 meses)',
    valorAGastar: 'R$ 600 de início + R$ 150 por mês',
    analiseRetorno: 'Cenário base: monetiza no 6º mês, com R$ 650 de lucro por mês depois.',
    tempoRetorno: 'Cerca de 9 meses (base)',
    explicacao: [
      'Criar um canal no YouTube sem aparecer no vídeo (canal "dark"): roteiro, narração por ' +
        'voz própria ou sintetizada, imagens e vídeos de apoio e edição. O tema fica em um ' +
        'nicho com busca constante, como curiosidades, finanças, história ou tecnologia.',
      'O dinheiro vem da monetização do YouTube (exige 1.000 inscritos e 4.000 horas ' +
        'assistidas), de afiliados e de patrocínios. Nos primeiros meses o canal só gasta ' +
        'tempo e um pouco de dinheiro.',
      'O fator decisivo é a regularidade: 2 a 3 vídeos por semana, com título e miniatura ' +
        'testados, e a escolha de um nicho em que dê para manter a qualidade sem aparecer.',
    ],
    cenarios: [
      { nome: 'Pessimista', receitaMensal: 'R$ 300 (a partir do 10º mês)', custoMensal: 'R$ 150',
        lucroMensal: 'R$ 150', tempoRetorno: 'Mais de 24 meses' },
      { nome: 'Base', receitaMensal: 'R$ 800 (a partir do 6º mês)', custoMensal: 'R$ 150',
        lucroMensal: 'R$ 650', tempoRetorno: 'Cerca de 9 meses' },
      { nome: 'Otimista', receitaMensal: 'R$ 2.000 (a partir do 4º mês)', custoMensal: 'R$ 150',
        lucroMensal: 'R$ 1.850', tempoRetorno: 'Cerca de 5 meses' },
    ],
    premissas: [
      'Microfone, editor de vídeo e assinaturas de apoio custam R$ 600 no início e R$ 150 ' +
        'por mês. [Chute]',
      'A monetização começa entre o 4º e o 10º mês, conforme a regularidade. [Chute]',
      'Dedicação de 12 h por semana para 2 a 3 vídeos semanais. [Provável]',
    ],
    riscos: [
      'O YouTube pode desmonetizar canal com conteúdo repetitivo ou feito em massa sem ' +
        'valor próprio. Conferir a política de monetização. [CONFIRMAR]',
      'Direitos autorais de imagens, músicas e trechos usados nos vídeos.',
      'Resultado lento e incerto: muitos canais não passam dos primeiros mil inscritos.',
    ],
    proximosPassos: [
      'Escolher 3 nichos e analisar 10 canais concorrentes de cada um.',
      'Gravar 3 vídeos de teste antes de gastar com equipamento.',
      'Definir a meta: 1.000 inscritos e 4.000 horas assistidas em até 6 meses.',
    ],
  },
];
