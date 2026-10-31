<!-- Bloco-modelo: copiar para dentro da etapa (tasks/etapas/ETAPA-*.md) da tarefa PESADA.
     Fonte da regra: regras/espec.md (C34). -->

### Invariantes

> Regra que precisa valer para **toda** entrada, não para os exemplos que alguém lembrou de testar.
> Sem invariante relevante: escrever `N/A` **e justificar** — não deixar vazio.
>
> Teste automatizado é permitido **só em `PESADO`**, declarado nesta seção, com o comando na
> Verificação da subtarefa (exceção de `regras/testes-validacao.md`). Fora disso, a conferência é
> por leitura, comando ou consulta.

| ID | Regra que vale sempre | Domínio da entrada | Como conferir | Teste automatizado |
|----|----------------------|--------------------|---------------|--------------------|
| INV-1 | <ex.: todo registro gerado tem ID único, mesmo em concorrência> | <ex.: N operações, N de 0 a 1000> | <leitura / comando / consulta> | <sim: comando> ou <não: por quê> |
| INV-2 | <ex.: nenhuma resposta inclui dado de outro tenant> | <ex.: qualquer par (token, recurso)> | <leitura / comando / consulta> | <sim/não> |

**Casos de borda que o código precisa sobreviver:**

- <vazio / nulo / limite / duplicado / concorrência / erro de rede>
