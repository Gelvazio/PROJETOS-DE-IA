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
