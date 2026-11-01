# AGENTS.md — instruções para assistentes

## Atalho `.` — despesas pendentes

Quando o Gelvazio digitar **apenas** `.` (um ponto sozinho na mensagem):

1. Listar as **despesas pendentes** (`tipo = 'pagar'`, `status = 0`).
2. Escopo: **mês atual** e **mês seguinte**, no fuso `America/Sao_Paulo`.
3. Por lançamento: descrição, valor, data de vencimento.
4. **Totalizador por mês (obrigatório):** ao final de cada bloco de mês, `Total do mês: R$ X.XXX,XX`.
5. Ao final, `Total geral: R$ X.XXX,XX` (soma dos dois meses).
6. Formato:

```
**Mês/Ano**
- Item — R$ … (dia)
- …
**Total do mês: R$ …**

**Próximo mês/Ano**
- …
**Total do mês: R$ …**

**Total geral: R$ …**
```

7. Responder em português, direto (sem pedir confirmação).

## Atalho `,` — receitas pendentes

Quando o Gelvazio digitar **apenas** `,` (uma vírgula sozinha na mensagem):

1. Listar as **receitas pendentes** (`tipo = 'receber'`, `status = 0`).
2. Mesmo escopo, totalizadores e formato do atalho `.` (mês atual + próximo).
3. Responder em português, direto (sem pedir confirmação).

## Atalho `1` — balanço do mês atual e do próximo

Quando o Gelvazio digitar **apenas** `1` (o número um sozinho na mensagem):

1. Calcular o **balanço** do **mês atual** e do **mês seguinte** (`America/Sao_Paulo`).
2. Por mês:
   - **Receitas:** soma de `tipo = 'receber'` (todos os lançamentos do mês).
   - **Despesas:** soma de `tipo = 'pagar'` (todos os lançamentos do mês).
   - **Saldo:** receitas − despesas.
3. Formato:

```
**Mês/Ano**
Receitas: R$ …
Despesas: R$ …
**Saldo: R$ …** (+ ou −)

**Próximo mês/Ano**
Receitas: R$ …
Despesas: R$ …
**Saldo: R$ …**

**Saldo dos dois meses: R$ …**
```

4. Responder em português, direto (sem pedir confirmação).

Fonte dos dados: tabela `public.lancamento` no Supabase do projeto.

## Especialista financeiro — consultar o CFO (via Analista Sênior Líder)

O Analista Sênior Líder (`C:\fontes\ANALISTA-SENIOR-LIDER.md`) indica quem é o especialista
financeiro: o **CFO — Finanças e Viabilidade** do conselho (`C:\fontes\conglomerado-agentes-ia.md`,
seção 3.3; cargo também listado em `C:\fontes\lider-coordenador.json`). Quem aciona o conselho é o
Sênior; a decisão final é sempre do Gelvazio.

Consultar o CFO quando o pedido for **decisão de negócio** com dinheiro:

- preço, custo (MVP e mensal), modelo de receita, ponto de equilíbrio ou viabilidade;
- as páginas de negócio do sistema: **Finanças Pessoais**, **Gestão Financeira** e **Gestão de
  Novos Negócios**, quando o Gelvazio trouxer os dados e pedir análise ou decisão;
- risco, jurídico ou compliance ligado a esse dinheiro: acrescentar o **CRO** (semáforo
  verde, amarelo ou vermelho; não substitui advogado).

Como consultar:

1. Ler `C:\fontes\ANALISTA-SENIOR-LIDER.md` (seção "Conselho dos 7 sistemas") e a seção 3.3 do
   `conglomerado-agentes-ia.md` antes de responder.
2. Responder no papel do CFO: tabela com 3 cenários (pessimista, base, otimista) com
   investimento inicial, custo mensal, receita mensal e meses até o ponto de equilíbrio, valores em R$.
3. Listar cada premissa com a confiança: `[Certeza]` (veio de dado lido agora), `[Provável]`,
   `[Chute]` ou `[CONFIRMAR]` (dado ausente). Nunca inventar número nem apresentar projeção sem o
   cenário pessimista.
4. Fechar com recomendação (seguir, pivotar ou matar), nota de 0 a 10 e 3 próximos passos baratos.
5. **Gravar a análise em Markdown**, uma por ideia da página Gestão de Novos Negócios, em
   `docs/analises/ANALISE-FINANCEIRA-IDEIA NN.md` (o `NN` é o código da ideia em
   `src/ideiasNegocios.js`: `IDEIA 01`, `IDEIA 02`…; o nome tem espaço, exatamente assim).

O status do card (`ANALISAR` ou `ANALISADO`) é calculado pelo código: vira `ANALISADO` **somente**
quando esse arquivo existe e não está vazio. Nunca criar o arquivo sem a análise do CFO feita, e nunca
mexer no status à mão.

Não usar o CFO para pergunta operacional do dia a dia (saldo do mês, pendências, atalhos `.`, `,`
e `1`, código ou tela): isso segue as regras acima, sem simular conselho.

<!-- rules-local:inicio -->
## Regras globais (rules-local)

No início da sessão, antes do primeiro pedido, rode na raiz do projeto:

```
node rules-local/sessao.mjs
```

Leia as linhas que começam com `rules-local:`:

- `versão igual`, `sem acesso`, `nuvem inconsistente` ou `outra sessão`: siga o pedido.
- `DISPARAR A SINCRONIZAÇÃO DE TASKS`: faça a sincronização de tasks antes do pedido, como manda
  `rules-local/regras/rules-local.md`.

Não edite a pasta `rules-local/` à mão. Ela é gerada pelo script.
<!-- rules-local:fim -->
