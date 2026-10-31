# 📏 Código — Limites, nomes e legibilidade

Complementa `codigo-solid.md`. Vale para todas as linguagens.

## Limites obrigatórios

| Regra | Exigência |
|-------|-----------|
| Arquivo | Máx. **1000 linhas** — passou, dividir por responsabilidade |
| Função | Máx. **45 linhas** — passou, extrair funções menores |
| Parâmetros | Máx. **3** — acima disso, receber um objeto (`criarAula({ titulo, data, turma })`) |
| Aninhamento | Máx. **2 níveis** de `if`/`for`/`while` — usar return early ou extrair função |
| Linha | Máx. **100 caracteres** |
| Documentação | **Toda função** com JSDoc/docstring: objetivo, parâmetros, retorno, exceções |
| Constantes | Valores fixos (URLs, tabelas, mensagens, limites, chaves, cores) viram **constantes nomeadas**: no bloco do topo do arquivo, ou no arquivo de constantes/configuração do módulo quando ele existir; cores e medidas em `:root` no CSS. Proibido número/string mágica no meio do código |
| Formatação | Prettier + ESLint (JS/HTML/CSS) e Black + Ruff (Python) **onde houver configuração**; sem configuração (caso atual do projeto), seguir o estilo do próprio arquivo e o limite de 100 caracteres |

## Legibilidade

- **Return early:** validações e erros no início da função.
- **Condições nomeadas:** `const podeInscrever = idade >= 16 && matriculado;`
- **Sem abreviações:** `quantidade`, não `qtd` (exceto `i`, `j` de laço).
- **Sem ternário aninhado** (`a ? b : c ? d : e`) — usar `if` com return ou mapa.
- **Comentários** explicam o porquê; sem código comentado ou morto (o Git guarda o histórico).
- `const` por padrão, `let` só se reatribuir, **nunca `var`**; funções puras quando possível.
- `async/await` em vez de `.then()`; erros com `try/catch` consistente.
- Ordem no arquivo: imports → constantes → auxiliares → principais → inicialização/export.

## Nomes em português (sem acentos)

| Elemento | JavaScript | Python | CSS |
|----------|-----------|--------|-----|
| Variável | `totalAlunos` | `total_alunos` | — |
| Função | `buscarAulas()` | `buscar_aulas()` | — |
| Classe | `AulaRepositorio` | `AulaRepositorio` | `.lista-aulas` |
| Constante | `LIMITE_ALUNOS` | `LIMITE_ALUNOS` | `--cor-destaque` |
| Booleano | `estaAtivo`, `temNota`, `podeEditar` | `esta_ativo` | — |

Em inglês só: palavras reservadas, APIs/bibliotecas (`fetch`, `querySelector`), colunas e tabelas
já existentes no banco e padrões consolidados do projeto. ❌ Não misturar (`getAlunos`, `userNome`).

## Exemplo

```js
/**
 * Retorna a situação do aluno conforme a nota final.
 * @param {{matriculado: boolean, bloqueado: boolean, nota: number}} aluno
 * @returns {string|null} Situação, ou null se não puder ser avaliado.
 */
function obterSituacao(aluno) {
  if (!aluno) return null;

  const podeSerAvaliado = aluno.matriculado && !aluno.bloqueado;
  if (!podeSerAvaliado) return null;

  if (aluno.nota >= NOTA_MINIMA_APROVACAO) return SITUACAO_APROVADO;
  if (aluno.nota >= NOTA_MINIMA_RECUPERACAO) return SITUACAO_RECUPERACAO;
  return SITUACAO_REPROVADO;
}
```

## Checklist

```
☐ Arquivo ≤ 1000 linhas, função ≤ 45, linha ≤ 100?
☐ Toda função documentada?
☐ Return early, ≤ 3 parâmetros, ≤ 2 níveis de aninhamento?
☐ Sem número/string mágica (tudo em constante nomeada)?
☐ Nomes em português, sem abreviação e sem ternário aninhado?
☐ const/let, async/await, no estilo do arquivo (ou formatador, onde houver configuração)?
```
