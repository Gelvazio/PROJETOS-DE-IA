// ============================================================================
// PREVIDÊNCIA PRIVADA FIESC - dados do plano FIESCPrev (Previsc)
// Fonte: CARTILHA-FIESCPREV-2025.pdf (Cartilha do Participante).
// A cartilha não traz valores em R$ nem o percentual da contrapartida da empresa:
// esses dados aparecem como [CONFIRMAR] e ficam em "Dados a informar".
// ============================================================================

export const CHAVE_ANALISE_PREVIDENCIA = 'PREVIDENCIA-FIESC';

export const PREVIDENCIA_FIESC = {
  nome: 'PREVIDÊNCIA PRIVADA FIESC',
  resumoCard: [
    ['Plano', 'FIESCPrev, administrado pela Previsc'],
    ['Contribuição', 'Mensal, 13 por ano, em folha; pode reduzir até 90% do valor sugerido'],
    ['Contrapartida da empresa', 'Sim, só quando você contribui (percentual: [CONFIRMAR])'],
    ['Para se aposentar', '50 anos, 36 meses de contribuição e desligar-se da empresa'],
  ],
  secoes: [
    {
      titulo: 'Sobre o plano',
      itens: [
        'Plano de previdência complementar fechada que dá uma renda adicional à aposentadoria.',
        'Podem participar colaboradores com vínculo na FIESC, CIESC, SESI, SENAI e IEL de ' +
          'Santa Catarina, a qualquer momento, enquanto estiverem ativos. A inscrição é feita ' +
          'em web.previsc.com.br e confirmada após a primeira contribuição.',
        'A Previsc foi criada em 1987 pela FIESC e hoje administra planos de várias empresas.',
      ],
    },
    {
      titulo: 'Contribuições',
      itens: [
        'Normal/básica: definida na adesão, a partir de um valor sugerido pelo salário; pode ' +
          'ser reduzida em até 90% e alterada a qualquer momento.',
        'Adicional: valor acima do sugerido, sem contrapartida da empresa.',
        'Voluntária: aporte quando quiser, para aumentar a reserva.',
        'Pagamento por desconto em folha: 13 contribuições por ano.',
        'Suspensão: por até 2 anos seguidos, com intervalo para suspender de novo.',
      ],
    },
    {
      titulo: 'Contribuição da empresa',
      itens: [
        'Contrapartida: a empresa só contribui quando o participante contribui.',
        'Dá direito a auxílio-doença, pensão por morte e aposentadoria por invalidez.',
        'As taxas de carregamento e de risco saem da contribuição da empresa; a taxa de ' +
          'administração também existe (valores: [CONFIRMAR]).',
      ],
    },
    {
      titulo: 'Imposto de Renda',
      itens: [
        'As contribuições abatem a base do IR até 12% da renda bruta anual, para quem ' +
          'declara no modelo completo.',
        'Na retirada, vale escolher uma das tabelas (a escolha é feita só no primeiro ' +
          'resgate ou no início do benefício, pela Lei 14.803):',
        'Progressiva: alíquotas de 0% a 27,5%; no resgate, 15% na fonte como antecipação.',
        'Regressiva (definitiva): até 2 anos 35%, 2 a 4 anos 30%, 4 a 6 anos 25%, ' +
          '6 a 8 anos 20%, 8 a 10 anos 15% e acima de 10 anos 10%.',
      ],
    },
    {
      titulo: 'Aposentadoria e benefícios',
      itens: [
        'Requisitos: 50 anos, 36 meses de contribuição e desligamento da empresa (não precisa ' +
          'estar aposentado pelo INSS).',
        'Formas de receber: prazo determinado (mínimo 6 anos), prazo indeterminado ou ' +
          'percentual variável de 0,1% a 2% do saldo ao mês.',
        'Saque adicional de até 25% do saldo, em até 3 retiradas.',
        '13 benefícios por ano, reajustados em maio.',
        'Pensão por morte, auxílio-doença e invalidez exigem 12 contribuições, com exceções ' +
          'para acidente de trabalho e doenças graves.',
      ],
    },
    {
      titulo: 'Empréstimo',
      itens: [
        'Exige 6 contribuições e margem consignável; até 60 parcelas.',
        'Participante ativo pode pegar até 90% do saldo resgatável.',
        'Encargos: juros, taxa de administração, IOF, FCE e taxa do contrato digital ' +
          '(valores: [CONFIRMAR]).',
      ],
    },
    {
      titulo: 'Se sair da empresa',
      itens: [
        'Autopatrocínio: continua contribuindo, assume também a parte da empresa e mantém ' +
          'o saldo da empresa.',
        'Benefício proporcional diferido (BPD): para de contribuir, o saldo continua ' +
          'rendendo e o saldo da empresa é mantido.',
        'Portabilidade: leva o saldo para outro plano, mas abre mão da contrapartida da ' +
          'empresa (exige 3 anos de vínculo).',
        'Resgate: saca só o que você contribuiu e abre mão da contrapartida da empresa.',
      ],
    },
    {
      titulo: 'Investimentos',
      itens: [
        'Quatro perfis à escolha: conservador, semi-moderado, moderado e arrojado.',
        'A troca de perfil é feita em abril e em outubro.',
        'Os rendimentos são incorporados ao saldo (rentabilidade: [CONFIRMAR]).',
      ],
    },
  ],
  dadosAInformar: [
    'Salário bruto atual e se declara o IR no modelo completo.',
    'Valor da contribuição mensal e o valor sugerido pelo plano.',
    'Percentual da contrapartida da empresa.',
    'Saldo atual (se já participa), perfil de investimento e rentabilidade dos últimos 12 meses.',
    'Taxa de administração e demais taxas cobradas.',
    'Quanto tempo falta para os 50 anos e para o desligamento previsto.',
  ],
  perguntasDaAnalise: [
    'A contrapartida da empresa compensa o dinheiro preso até os 50 anos?',
    'A dedução de até 12% no IR vale a pena para o seu salário e modelo de declaração?',
    'A rentabilidade do perfil escolhido, descontadas as taxas, supera uma alternativa ' +
      'simples e líquida?',
    'Qual o impacto de perder a contrapartida se você sair antes (resgate ou portabilidade)?',
    'Qual tabela de IR (progressiva ou regressiva) fica melhor no seu horizonte?',
  ],
};
