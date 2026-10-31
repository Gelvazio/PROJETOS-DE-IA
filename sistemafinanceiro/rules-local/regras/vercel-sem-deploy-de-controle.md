# 🚫 Vercel — push de arquivo de controle não gera deploy (C46)

Decidido em 2026-10-22 (C46, tarefa VERCEL-SEM-DEPLOY-DE-CONTROLE). Vale para **todos os
projetos e todas as IAs** que publicam na Vercel. A regra do projeto só pode **acrescentar**, não
contradizer. Complementa a `visualizador-gerado.md` (C45).

## Por quê

- Todo push vira um deploy na Vercel e o plano gratuito tem limite de armazenamento de deploys
  (no `aulasenai` já passou de 12 GB contra 10 GB).
- Quadro (`tasks/`) e `rules-local/` mudam a cada tarefa e **não mudam nada do que o aluno vê**:
  deploy deles é só gasto de espaço.

## Arquivos de controle

| Pasta | O que é | Vai para o site? |
|---|---|---|
| `tasks/` | Quadro de tarefas, etapas e recados | Não muda o site; fica só no filtro do deploy |
| `rules-local/` | Cópia das regras globais e scripts de sessão (`rules-local.md`) | **Nunca**: sai do site pelo `.vercelignore` |

- ⛔ `.claude/` e as demais pastas **não** são arquivo de controle (o `.claude/rules/index.html` do
  `aulasenai`, por exemplo, é aberto pelo site).

## O que todo projeto com `vercel.json` deve ter

1. **`ignoreCommand`** no `vercel.json`, que sai com código 0 (cancela o deploy) quando o push só
   mudou arquivo de controle, e com código 1 (publica) quando mudou qualquer outra coisa:

```json
"ignoreCommand": "git diff --quiet ${VERCEL_GIT_PREVIOUS_SHA:-HEAD^} HEAD -- . ':(exclude)tasks/' ':(exclude)rules-local/'"
```

2. **`rules-local/`** em uma linha do `.vercelignore` (cria o arquivo se não existir), para a
   pasta nunca ir ao site, nem em deploy que mude outros arquivos.

- `VERCEL_GIT_PREVIOUS_SHA` vazio (1º deploy) → o comando cai em `HEAD^`; se ainda assim falhar, o
  deploy segue (falha para o lado seguro: publicar).
- Se o projeto já tem `ignoreCommand` (ex.: só com `tasks/`), **acrescentar** o
  `':(exclude)rules-local/'` ao comando existente em vez de criar outro.

## Quando aplicar

- ✅ **Todo projeto com `vercel.json`** que segue as regras do `rules-ai`, incluindo os existentes
  (hoje `aulasenai` e `dashboard-ai`).
- ✅ **Projeto novo que passar a publicar na Vercel** já nasce com os dois itens acima.
- ✅ Mexer só nessas duas configurações; o resto do `vercel.json` (`functions`, `rewrites`...)
  fica como está.

## O que não entra

- ⛔ Apagar deploys antigos, mudar o plano da Vercel ou mexer em projeto sem `vercel.json`.
- ⛔ Colocar `tasks/` no `.vercelignore`: ela só entra no filtro do deploy.
- ⛔ Incluir `.claude/` ou outras pastas no filtro sem pedido do usuário.

## Como conferir

- `json.load` (ou `node -e "JSON.parse(...)"`) do `vercel.json`: o `ignoreCommand` existe e tem os
  dois `':(exclude)...'`.
- `grep -n "rules-local/" .vercelignore` acha a linha.
- Comando padrão num commit só de `tasks/` ou `rules-local/` → código 0; num commit com outro
  arquivo → código 1.
- Na Vercel (MCP `list_deployments`): push só de `tasks/` ou `rules-local/` aparece como CANCELED
  (ou sem deploy); push com outro arquivo, como READY. O URL `/rules-local/VERSAO.md` do site deve
  dar 404.
