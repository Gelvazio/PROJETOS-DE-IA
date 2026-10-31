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
