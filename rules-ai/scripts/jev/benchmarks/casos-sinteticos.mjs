// Casos sintéticos de borda do golden (24: 8 por nível). O rótulo `esperado` segue a regra de
// regras/niveis-e-modelos.md (sinal mais restritivo vence). Os states já são cegos (sem rótulo).

/**
 * Cria um caso sintético.
 * @param {{n: number, esperado: string, titulo: string, descricao: string, tags: string[]}} caso
 * @param {{arquivos?: string[], criterios?: string}} [extras] Arquivos e critérios.
 * @returns {object} Item do golden.
 */
function caso(dados, extras = {}) {
  return {
    id: `sintetico:${dados.esperado}-${dados.n}`,
    esperado: dados.esperado,
    state_sem_rotulo: {
      subtarefa: `SINT.${dados.esperado}${dados.n}`,
      titulo: dados.titulo,
      etapa: 'ETAPA-SINT',
      prioridade: '🟡 Média',
      descricao: dados.descricao,
      arquivos: extras.arquivos ?? [],
      criterios: extras.criterios ?? '',
    },
    tags: ['sintetico', 'borda', ...dados.tags],
    fonte: 'sintetico',
  };
}

export const CASOS_SINTETICOS = Object.freeze([
  caso({ n: 1, esperado: 'LEVE', titulo: 'Corrigir typo no README',
    descricao: 'Trocar "recomendacao" por "recomendação" em um parágrafo do README. Nada '
      + 'mais muda.',
    tags: ['texto'] }, { arquivos: ['README.md'] }),
  caso({ n: 2, esperado: 'LEVE', titulo: 'Atualizar a data na linha do quadro',
    descricao: 'Ajustar a coluna "Atualizado em" da linha da frente no STATUS.md para a data '
      + 'de hoje.',
    tags: ['quadro'] }, { arquivos: ['tasks/STATUS.md'] }),
  caso({ n: 3, esperado: 'LEVE', titulo: 'Explicar como proteger a chave da API (texto)',
    descricao: 'Escrever um parágrafo no guia explicando por que a chave da API não deve ir para o '
      + 'Git. Só texto; nenhum código, banco ou chave real é tocado.', tags: ['palavra-enganosa'] },
  { arquivos: ['docs/guia.md'] }),
  caso({ n: 4, esperado: 'LEVE', titulo: 'Renomear título de seção',
    descricao: 'Mudar o título "Passos" para "Passo a passo" em um arquivo de documentação.',
    tags: ['texto'] }, { arquivos: ['docs/passos.md'] }),
  caso({ n: 5, esperado: 'LEVE', titulo: 'Update README badge', tags: ['ingles'],
    descricao: 'Fix the badge URL in the README header. Documentation only, no code.' },
  { arquivos: ['README.md'] }),
  caso({ n: 6, esperado: 'LEVE', titulo: 'Ajustar cor do botão na documentação',
    descricao: 'Trocar o código hexadecimal de cor citado no manual de estilo. Só texto.',
    tags: ['texto'] }, { arquivos: ['docs/estilo.md'] }),
  caso({ n: 7, esperado: 'LEVE', titulo: 'Formatar tabela do guia',
    descricao: 'Alinhar as colunas de uma tabela Markdown. Sem mudar conteúdo.',
    tags: ['formato'] },
  { arquivos: ['docs/guia.md'] }),
  caso({ n: 8, esperado: 'LEVE', titulo: 'Item', descricao: 'Corrigir vírgula.',
    tags: ['descricao-curta'] }),

  caso({ n: 1, esperado: 'MEDIO', titulo: 'Função que calcula a média das notas',
    descricao: 'Criar calcularMedia(notas) em js/notas.js com validação no início e JSDoc. Sem '
      + 'banco: recebe um array.', tags: ['codigo'] }, { arquivos: ['js/notas.js'],
    criterios: 'média correta; array vazio devolve 0' }),
  caso({ n: 2, esperado: 'MEDIO', titulo: 'Gerador de lista em Markdown',
    descricao: 'Script Python que lê um CSV e escreve um .md com a lista. Dois arquivos.',
    tags: ['codigo'] }, { arquivos: ['scripts/lista.py', 'scripts/lista_teste.csv'] }),
  caso({ n: 3, esperado: 'MEDIO', titulo: 'Tela de filtro de turmas',
    descricao: 'Adicionar filtro por turma na tela de alunos (HTML + JS), sem mexer em consultas '
      + 'ao banco: o filtro age sobre a lista já carregada.', tags: ['tela', 'palavra-enganosa'] },
  { arquivos: ['alunos.html', 'js/alunos.js', 'css/alunos.css'] }),
  caso({ n: 4, esperado: 'MEDIO', titulo: 'Refatorar função longa',
    descricao: 'Dividir uma função de 80 linhas em três funções menores, mesmo comportamento.',
    tags: ['refatoracao'] }, { arquivos: ['js/relatorio.js'] }),
  caso({ n: 5, esperado: 'MEDIO', titulo: 'Add input validation helper', tags: ['ingles', 'codigo'],
    descricao: 'Create a small helper that validates form fields before submit. One JS file.' },
  { arquivos: ['js/validar.js'] }),
  caso({ n: 6, esperado: 'MEDIO', titulo: 'Script de checagem de links',
    descricao: 'Script Node que percorre os .md e lista links quebrados. Um arquivo, sem rede.',
    tags: ['codigo'] }, { arquivos: ['scripts/links.mjs'] }),
  caso({ n: 7, esperado: 'MEDIO', titulo: 'Ajuste de CSS responsivo',
    descricao: 'Corrigir quebra de layout em telas pequenas na página de cursos (1 CSS, 1 HTML).',
    tags: ['css'] }, { arquivos: ['css/cursos.css', 'cursos.html'] }),
  caso({ n: 8, esperado: 'MEDIO', titulo: 'Parser de linhas do quadro',
    descricao: 'Função que lê a tabela do STATUS.md e devolve objetos. Código com lógica em '
      + '2 arquivos.',
    tags: ['codigo'] }, { arquivos: ['scripts/quadro.mjs', 'scripts/quadro-utils.mjs'] }),

  caso({ n: 1, esperado: 'PESADO', titulo: 'Corrigir typo em política de acesso',
    descricao: 'Trocar uma palavra em um arquivo SQL de política RLS da tabela de alunos '
      + '(CREATE POLICY ...). Uma linha, mas é política de segurança do banco.',
    tags: ['banco', 'um-arquivo'] }, { arquivos: ['database/politicas.sql'] }),
  caso({ n: 2, esperado: 'PESADO', titulo: 'Rotacionar a chave de serviço',
    descricao: 'Trocar a chave service_role usada nos scripts e atualizar o .env local. Lida com '
      + 'segredo.', tags: ['segredo'] }, { arquivos: ['.env'] }),
  caso({ n: 3, esperado: 'PESADO', titulo: 'Apagar registros antigos',
    descricao: 'Remover do banco todas as aulas anteriores a 2024 com um DELETE em massa.',
    tags: ['apagar', 'banco'] }, { arquivos: ['database/limpeza.sql'] }),
  caso({ n: 4, esperado: 'PESADO', titulo: 'Gerar 500 atividades em lote',
    descricao: 'Gerar e gravar 500 atividades de uma vez a partir dos materiais, em massa.',
    tags: ['massa'] }, { arquivos: ['gerador/lote.py'] }),
  caso({ n: 5, esperado: 'PESADO', titulo: 'Nova tela de login com papéis',
    descricao: 'Criar login e controle de papéis (professor/aluno) com permissões por rota.',
    tags: ['login'] }, { arquivos: ['login.html', 'js/login.js'] }),
  caso({ n: 6, esperado: 'PESADO', titulo: 'Rename column in production table',
    tags: ['ingles', 'banco'],
    descricao: 'Migration that renames a column in the production database and updates all RPCs.' },
  { arquivos: ['database/migracao.sql'] }),
  caso({ n: 7, esperado: 'PESADO', titulo: 'Reestruturar quadro em 6 módulos',
    descricao: 'Mover a lógica do quadro para seis módulos ligados entre si (arquitetura nova), '
      + 'tocando mais de 3 arquivos que dependem uns dos outros.', tags: ['arquitetura'] },
  { arquivos: ['a.mjs', 'b.mjs', 'c.mjs', 'd.mjs', 'e.mjs', 'f.mjs'] }),
  caso({ n: 8, esperado: 'PESADO', titulo: 'Seed de usuários de teste',
    descricao: 'Inserir usuários no auth.users com senhas de teste e vincular papéis.',
    tags: ['banco', 'segredo'] }, { arquivos: ['database/seed.sql'] }),
]);
