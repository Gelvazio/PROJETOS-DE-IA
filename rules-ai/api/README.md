# API do quadro (`api/`)

## O que é

Uma API REST local, feita com json-server, que expõe as tarefas do quadro do `rules-ai` para outros
programas lerem sem abrir os `.md`.

- É uma **cópia derivada e só de leitura** do quadro: vem de `tasks/STATUS.md` e
  `tasks/task_complete.md`.
- O quadro continua sendo a **fonte única**. Nunca editar o `db.json` à mão: ele é gerado.
- Não grava nada no quadro e não altera reserva, nível ou status.

## Como instalar

```
cd api
npm install
```

Dependência única: `json-server` 0.17.4 (versão fixa).

## Como gerar

```
npm run gerar
```

O script `gerar-db.mjs` lê o quadro e grava `api/db.json`, que fica versionado no Git. O arquivo é
gerado: não editar à mão, só regerar com `npm run gerar`.

## Como migrar o quadro para `dados/<projeto>.json`

```
npm run migrar                  # grava dados/rules-ai.json
node migrar.mjs --dry-run       # so mostra o resumo
node migrar.mjs --projeto <id> --fonte <caminho do STATUS.md>
```

`migrar.mjs` lê a tabela "📌 Tarefas" do `tasks/STATUS.md` e grava a coleção `tarefas` de
`api/dados/<projeto>.json` (ids `<projeto>:<codigo>`, SCHEMA.md). É idempotente: rodar de novo sem
mudança no quadro não altera o arquivo; linha que já existe é atualizada, nunca duplicada;
tarefa que sumiu do quadro não é apagada (aparece como "ausente" no resumo); as outras coleções
do arquivo são preservadas. Por enquanto só as tarefas abertas; as concluídas e o resto vêm nas
subtarefas seguintes. O `npm start` já aponta para `dados/rules-ai.json`.

## Como subir

```
npm start
```

Sobe em `http://127.0.0.1:3333`, **só no localhost**. Não expor a porta em outra interface.

## Consultas

| Consulta | O que devolve |
|---|---|
| `/tarefas` | todas as tarefas (mães e subtarefas) |
| `/tarefas?concluida=true` | só as concluídas |
| `/tarefas?disponivel=true` | só as livres, com dependências concluídas e sem trava |
| `/tarefas?statusCodigo=em_execucao` | só as que estão em execução |
| `/frentes` | as frentes de trabalho do quadro |

## Arquivos

- `package.json`: scripts `start`, `gerar` e `migrar`, e a dependência json-server.
- `gerar-db.mjs`: gerador do `db.json` (Node puro, sem dependência npm).
- `migrar.mjs`: importador idempotente do quadro (Node puro) para `dados/<projeto>.json`.
- `serializador.mjs`: grava o `db.json` em formato estável (chaves em ordem fixa, LF) e só se
  o conteúdo mudou.
- `db.json`: cópia gerada do quadro, **versionada no Git**. Regerar com `npm run gerar`; nunca
  editar à mão. Regerar sem mudança no quadro não altera o arquivo.
- `.gitattributes`: força fim de linha LF no `db.json`.
- `.gitignore`: ignora `node_modules/` e arquivos `*.tmp`.
