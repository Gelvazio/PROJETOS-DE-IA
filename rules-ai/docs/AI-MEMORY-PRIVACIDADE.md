# AI-MEMORY — privacidade dos dados de alunos e purga

**Subtarefa:** AI-MEMORY-INTEGRATION.20 · **Data:** 2026-10-23
**Natureza:** padrões de caminho e procedimento. Nenhum arquivo com dado real foi aberto e
nenhuma chave aparece aqui.

## 1. O que já está ignorado

`scripts/instalar-ai-memory.mjs` grava em `.ai-memory.toml` (`[capture] ignore_paths`):
`.env*`, `variaveis.js`, `tasks/**`, `rules-local/**`, `graphify-out/**`, `*gabarito*`,
`*alunos*.csv|xlsx|json`, `*.pdf`, `node_modules/**` e `DEMAIS-PROJETOS-*/**`.

## 2. Padrões extras de dados pessoais (proposta)

Faltam, para listas de alunos e currículos, estes padrões. Entram em `IGNORE_PATHS` do
instalador por uma subtarefa própria (este guia não altera o script):

| Padrão | Cobre |
|---|---|
| `**/*curriculo*`, `**/*currículo*`, `**/*curriculum*`, `**/*cv*.docx` | currículos |
| `PLATAFORMA-ENVIO-CURRICULOS/**` | projeto de currículos e perfis de LinkedIn |
| `**/*alunos*.xls`, `**/*alunos*.md`, `**/*alunos*.txt` | outras listas de alunos |
| `**/*chamada*`, `**/*matricula*`, `**/*notas*.csv`, `**/*notas*.xlsx` | chamada, matrícula, notas |
| `**/projetos-alunos/**` | repositórios de alunos (`testes-de-frontend`) |
| `**/*.docx`, `**/*.xlsx` | planilhas e documentos soltos com nomes e CPF |
| `**/*cpf*`, `**/*rg*.*` | arquivos com documento pessoal no nome |

Limite honesto: `ignore_paths` age só pelo **caminho**. Dado de aluno digitado no prompt
ou colado em arquivo de nome comum não é barrado por ele. Nesses casos vale a purga (seção 4).
O ai-memory também mascara chaves e tokens conhecidos (`[sanitize]`), mas **não** CPF, RG,
e-mail nem telefone.

## 3. Como conferir se algo entrou

```powershell
ai-memory list-projects                      # projetos e páginas do wiki
ai-memory search "<termo>" --project <nome>  # busca textual (FTS) no wiki do projeto
ai-memory search "<termo>" --global
node scripts/ai-memory-auditar.mjs           # auditoria do rules-ai
```

Buscar por padrões (`cpf`, `curriculo`, `matricula`), nunca por nome de aluno real nos
comandos que ficam no histórico do terminal.

## 4. Apagar uma memória capturada por engano

**Passo 0 — Pare de capturar.** Inclua o padrão em `ignore_paths` (seção 2) para não voltar.

**Opção A — uma página do wiki** (o dado virou página):

```powershell
ai-memory delete-page --project <nome> --path <caminho-da-página>
```

**Opção B — o projeto inteiro** (dado nas observações brutas ou espalhado):

```powershell
# 1) PRÉVIA (dry-run): sem --confirm o comando só mostra o que apagaria e sai com erro
ai-memory purge-project --workspace default --project <nome>

# 2) só depois do "sim" do usuário: apagar de fato
ai-memory purge-project --workspace default --project <nome> --confirm

# 3) opcional: devolver o espaço em disco (reescreve o banco; leva minutos)
ai-memory purge-project --workspace default --project <nome> --confirm --compact
```

Teste da prévia em 2026-10-23, sem `--confirm`, no projeto `gelvazio-aulasenai`:
`Would purge default/gelvazio-aulasenai: 0 pages, 1 sessions, 26 observations … Plus 4
observations in other projects via their sessions.` Nada foi apagado. O aviso de erro
"destructive and irreversible" que aparece junto é o esperado do dry-run.

**Cuidados:**
- ⛔ `--confirm` é irreversível: só com o usuário dizendo **sim** ao projeto e à contagem da
  prévia. Reparar nas "observações em outros projetos": a purga leva essas junto.
- A purga **não** é apagamento forense: o histórico git do wiki e qualquer **backup** feito
  antes ainda guardam o conteúdo (`AI-MEMORY-BACKUP.md`). Se o dado é sensível, apagar
  também os backups anteriores que o contenham, depois de olhar o alvo.
- Dado capturado só nas observações (sem página) some com a purga do projeto; não há
  comando para apagar uma observação isolada.
- Projeto apagado é recriado na próxima sessão com o marcador; a captura recomeça limpa.

## 5. Estado do piloto

Em 2026-10-23 o wiki tem **0 páginas** em todos os projetos (`list-projects`), então não há
dado de aluno em páginas. As observações brutas (26 no `gelvazio-aulasenai`) não foram
inspecionadas por conteúdo, por respeito à privacidade: a conferência fina fica com a
auditoria (`ai-memory-auditar.mjs`) e com o usuário.

## 6. Proteção do piloto `aulasenai` (AI-MEMORY-INTEGRATION.35)

Conferência de 2026-10-23, antes de ligar o piloto (nada gravado no `aulasenai`; o conteúdo
de `scripts/variaveis.js` não foi lido).

| Item | Resultado |
|---|---|
| `node scripts/instalar-ai-memory.mjs C:\fontes\aulasenai --dry-run` | gera o marker com `project = "gelvazio-aulasenai"` e os `ignore_paths` da seção 2 |
| `scripts/variaveis.js` (service_role) | coberto por `scripts/variaveis.js`, `**/variaveis.js` e `variaveis.js` |
| Listas de alunos, currículos, chamada, matrícula, notas, `*.pdf`, `*.docx`, `*.xlsx` | cobertos por padrão de nome |
| `git check-ignore` em `scripts/variaveis.js` no `aulasenai` | ignorado pelo `.gitignore` (linha 4) |
| `node scripts/ai-memory-auditar.mjs` (wiki atual) | 4 páginas, 0 achados, código 0 |
| `.ai-memory.toml` no `aulasenai` | ainda não existe (é gravado na .16) |

**`MATERIAIS/` coberta:** `scripts/instalar-ai-memory.mjs` tem `MATERIAIS/**` e
`**/MATERIAIS/**` em `IGNORE_PATHS` (conferido no `--dry-run`, linhas 42 e 43 do marker).
Isso cobre também `AUTOMATIZACAO-WHATSAPP`, que tem sessões do Baileys.

**Limites da conferência:**
- O `ignore_paths` age só no caminho. Se a service_role for colada num prompt, ela chega
  à memória; o ai-memory mascara só padrões conhecidos de chave. Rotacionar a chave
  (pendência D1 do mapa) continua necessário.
- A auditoria olha o wiki, que hoje não tem páginas do `aulasenai`. Rodar de novo depois da
  .16 e antes de liberar outros projetos.

## 7. Limites

- ⛔ Não abrir arquivos de alunos ou currículos para "conferir": trabalhar por nome e padrão.
- ⛔ Não rodar `purge-project --confirm`, `reset` nem `restore` sem pedido do usuário.
