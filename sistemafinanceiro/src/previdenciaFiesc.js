// ============================================================================
// PREVIDÊNCIA PRIVADA FIESC - dados do plano FIESCPrev (Previsc)
// Fontes: CARTILHA-FIESCPREV-2025.pdf (Cartilha do Participante) e o Regulamento do
// plano (REGRAS-PROJETOS/FIESC-PREV/Regulamento-FIESCPREV.md; vale o Regulamento).
// Nenhum dos dois traz o percentual exato da contrapartida nem as taxas, que ficam no
// Plano de Custeio Anual: esses dados aparecem como [CONFIRMAR] em "Dados a informar".
// ============================================================================

export const CHAVE_ANALISE_PREVIDENCIA = 'PREVIDENCIA-FIESC';

export const PREVIDENCIA_FIESC = {
  nome: 'PREVIDÊNCIA PRIVADA FIESC',
  resumoCard: [
    ['Plano', 'FIESCPrev, administrado pela Previsc'],
    ['Contribuição', 'Mensal, 13 por ano (inclui o 13º), em folha; pode reduzir até 90% (Art. 57)'],
    ['Contrapartida da empresa', 'Só quando você contribui e no máximo igual à sua contribuição básica (Art. 49); % exato: [CONFIRMAR]'],
    ['Para se aposentar', 'Normal: 55 anos e 5 de contribuição. Antecipada: 50 anos e 3. Em ambas, desligar-se da empresa'],
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
        'Básica: mensal, pela alíquota do Plano de Custeio Anual (Art. 53); pode ser reduzida em até 90% (Art. 57) e incide também sobre o 13º salário (Art. 44).',
        'Adicional: percentual extra sobre o salário de participação, por pedido formal. Sem contrapartida da empresa (Art. 54).',
        'Eventual: valor livre, em qualquer época do ano, pago direto à Previsc. Sem contrapartida da empresa (Art. 55).',
        'São 13 contribuições por ano, descontadas em folha (Arts. 51 e 52).',
        'Suspensão: por até 2 anos seguidos; os meses suspensos não são repostos pela empresa e, nesse período, você não tem os benefícios de risco (Art. 56).',
      ],
    },
    {
      titulo: 'Contribuição da empresa',
      itens: [
        'Contrapartida: a empresa só contribui quando o participante contribui (Art. 48).',
        'Limite: a contribuição da empresa é definida no Plano de Custeio Anual e não pode exceder a sua Contribuição Básica (Art. 49). Ou seja, no máximo 1 para 1.',
        'Da contribuição da empresa sai a parte das despesas administrativas e dos benefícios de risco (Art. 49, parágrafo único); só o restante vai para a sua conta de aposentadoria.',
        'A contrapartida acaba no fim do vínculo, ao começar a aposentadoria, na morte, no autopatrocínio e no benefício proporcional diferido (Art. 48, §3º).',
        'Taxa de carregamento e de administração seguem o Plano de Custeio (valores: [CONFIRMAR]).',
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
        'Normal: 55 anos, 5 anos de contribuição e desligamento da empresa (Art. 11).',
        'Antecipada: 50 anos, 3 anos de contribuição e desligamento da empresa (Art. 12); calculada como a normal.',
        'Formas de receber (Art. 17): prazo determinado (mínimo 6 anos), percentual de 0,1% a 2% do saldo ao mês, ou prazo indeterminado (saldo dividido pelo fator atuarial).',
        'Saque de até 25% do saldo, em até 3 vezes, e o resto em renda (Art. 17, §1º).',
        '13 pagamentos por ano; revisão anual em maio, exceto prazo determinado, que é reajustado todo mês pela cota (Arts. 26 e 34).',
        'Renda abaixo de 1 Unidade de Referência vira pagamento único (Art. 27).',
        'Pensão por morte, auxílio-doença e invalidez: 12 contribuições de carência, com dispensa em acidente de trabalho e doenças graves (Arts. 13, 14 e 15).',
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
        'Você tem 60 dias, após receber o extrato, para escolher (Art. 36). Se não escolher, vale o benefício proporcional diferido.',
        'Resgate: devolve 100% da Conta Individual de Participante (só o que você contribuiu, com rendimento), em cota única ou até 12 parcelas. A parte da empresa não é devolvida (Art. 37).',
        'Portabilidade: leva a Conta Individual de Participante para outro plano; exige 3 anos de vínculo com o plano (Art. 38).',
        'Benefício proporcional diferido: você para de contribuir, o patrimônio continua rendendo (só com a taxa administrativa) e o benefício sai quando cumprir os 50 anos (Art. 39).',
        'Autopatrocínio: continua contribuindo por conta própria, sem a contrapartida da empresa e pagando também as despesas administrativas e de risco (Art. 40).',
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
    'Percentual da contrapartida da empresa (Plano de Custeio Anual; o teto é 100% da sua contribuição básica).',
    'Saldo atual (se já participa), perfil de investimento e rentabilidade dos últimos 12 meses.',
    'Taxa de administração e demais taxas cobradas.',
    'Idade atual e quando pretende se desligar (aposentadoria antecipada aos 50 anos, normal aos 55).',
  ],
  perguntasDaAnalise: [
    'A contrapartida da empresa (até 1 para 1) compensa o dinheiro preso até os 50 ou 55 anos?',
    'A dedução de até 12% no IR vale a pena para o seu salário e modelo de declaração?',
    'A rentabilidade do perfil escolhido, descontadas as taxas, supera uma alternativa ' +
      'simples e líquida?',
    'Qual o impacto de perder a contrapartida se você sair antes (resgate ou portabilidade)?',
    'Qual tabela de IR (progressiva ou regressiva) fica melhor no seu horizonte?',
  ],
};
