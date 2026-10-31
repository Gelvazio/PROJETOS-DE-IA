# Marker `.ai-memory.toml` do projeto aulasenai (modelo)

Subtarefa AI-MEMORY-INTEGRATION.6 (nível LEVE). Este arquivo é só o **modelo**: nenhum
`.ai-memory.toml` foi criado em projeto nenhum. Quem cria é a subtarefa de instalação.

Fontes lidas (somente leitura):

- `C:\fontes\ai-memory\docs\marker-file.md` (schema, `[capture]`, padrões, limites).
- `C:\fontes\ai-memory\docs\ARCHITECTURE.md` (linhas 66-75: aliases e marker).
- `C:\fontes\ai-memory\docs\install.md` (linhas 941-960: allowlist e marker).
- `C:\fontes\aulasenai\.gitignore` e `C:\fontes\aulasenai\CLAUDE.md` (pastas sensíveis).

## 1. Modelo comentado

Caminho do arquivo futuro: `C:\fontes\aulasenai\.ai-memory.toml` (raiz do repositório,
versionado no Git, para que todo clone roteie igual; marker-file.md, "Create a marker").

```toml
# .ai-memory.toml do projeto aulasenai (MODELO)

# Obrigatório com project. Workspace padrão do ai-memory (marker-file.md, linha 9).
workspace = "default"

# Declarar workspace e project juntos: clientes MCP estáticos precisam do par
# em toda chamada (marker-file.md, linhas 26-29). Valor = repositório sem host,
# normalizado em minúsculas: github.com/gelvazio/aulasenai -> gelvazio-aulasenai
# (marker-file.md, linhas 122-123 e 1003-1005). Remoto: C:\fontes\CLAUDE.md.
# NÃO CONFIRMADO: o nome real no servidor; conferir antes de gravar.
project = "gelvazio-aulasenai"

# Sem [recall], [briefing], [profile], aliases nem server: são opt-in e não
# são necessários para a captura (marker-file.md, linhas 129-206).

[capture]
# Padrões: só * ? e **; relativos à pasta do marker; ~/ é a pasta pessoal.
# ** NÃO casa zero pastas: cada padrão precisa da forma "raiz" e da "**/" juntas.
ignore_paths = [
  ".env",
  "**/.env",
  ".env.*",
  "**/.env.*",
  "scripts/variaveis.js",
  "**/variaveis.js",
  "tasks/**",
  "rules-local/**",
  "graphify-out/**",
  "**/gabarito*/**",
  "**/*gabarito*",
  "**/*alunos*.csv",
  "**/*alunos*.xlsx",
  "**/*alunos*.json",
  "*.pdf",
  "**/*.pdf",
  "MATERIAIS/AGENDA_COLABORADOR/AUTOMATIZACAO-WHATSAPP/**",
  "node_modules/**",
  "**/node_modules/**",
  "DEMAIS-PROJETOS-*/**",
]
```

Regras que o modelo segue (marker-file.md):

- O marker mais próximo é o único válido: as seções não se misturam (linha 520-521).
- `[capture]` aceita **só** `ignore_paths`. Chave extra invalida a política inteira (linha 522).
- Limites: 128 padrões, 1.024 caracteres por padrão, marker de até 64 KiB (linhas 522, 536-538).
- Sintaxe inválida (`{a,b}`, `[ab]`, `!`) não é aceita: ai-memory marca o comando como
  metadados-apenas (linhas 588, 641-645), por isso o modelo não usa chaves nem colchetes.

## 2. Tabela de ignore_paths obrigatórios

"Sintaxe" diz se o padrão é aceito pela documentação do ai-memory. "Não confirmado" quer
dizer que o padrão é válido na forma, mas o local real no projeto não foi achado.

| # | Padrão | Motivo | Sintaxe |
|---|---|---|---|
| 1 | `.env` | Segredos locais (`.gitignore` linha 6) | Sim (exato, raiz) |
| 2 | `**/.env` | Mesmo arquivo em subpastas | Sim (linha 543) |
| 3 | `.env.*` | Variantes, ex.: `.env.local` | Sim, `*` (linha 531) |
| 4 | `**/.env.*` | Variantes em subpastas | Sim (linha 543) |
| 5 | `scripts/variaveis.js` | Tem a chave `service_role` (`.gitignore` linha 4) | Sim (linha 531) |
| 6 | `**/variaveis.js` | Mesmo arquivo em qualquer pasta (`.gitignore` linha 4) | Sim (linha 543) |
| 7 | `tasks/**` | Quadro e etapas; não é segredo, mas não é código do aluno | Sim (linha 544) |
| 8 | `rules-local/**` | Cópia das regras; não é segredo | Sim (linha 544) |
| 9 | `graphify-out/**` | Grafo gerado (`.gitignore` linha 3) | Sim (linha 544) |
| 10 | `**/gabarito*/**` | Gabaritos (pasta exata não achada) | Não confirmado (local) |
| 11 | `**/*gabarito*` | Arquivo de gabarito solto | Não confirmado (local) |
| 12 | `**/*alunos*.csv` | Listas de alunos em CSV | Não confirmado (local) |
| 13 | `**/*alunos*.xlsx` | Listas de alunos em planilha | Não confirmado (local) |
| 14 | `**/*alunos*.json` | Listas de alunos em JSON | Não confirmado (local) |
| 15 | `*.pdf` e `**/*.pdf` | PDFs pesados (`.gitignore` linhas 13-15) | Sim (linha 543) |
| 16 | `MATERIAIS/AGENDA_COLABORADOR/AUTOMATIZACAO-WHATSAPP/**` | Sessão do WhatsApp | Sim (caminho em `C:\fontes\CLAUDE.md`) |
| 17 | `node_modules/**` e `**/node_modules/**` | Dependências (sem valor) | Sim (linhas 544, 543) |
| 18 | `DEMAIS-PROJETOS-*/**` | Pasta fora do projeto (ver observação 3) | Inerte neste marker |

Observações sobre a tabela:

- **Listas de alunos e gabaritos:** o local real não foi achado com a busca (a palavra aparece
  em JS e em tarefas). Antes de gravar, conferir onde estão esses arquivos. Os padrões acima
  são só um palpite.
- **PDFs de currículo:** os currículos ficam em `PLATAFORMA-ENVIO-CURRICULOS` (C:\fontes\CLAUDE.md),
  não no aulasenai. O padrão de PDF aqui cobre apostilas e materiais; o currículo é protegido
  no marker do projeto dele, não neste.
- **MATERIAIS/ inteiro:** não foi marcado como sensível (só o WhatsApp é). Ignorar a pasta toda
  esconderia material didático útil; fica como decisão do usuário.
- **Maiúsculas:** no Windows o casamento ignora ASCII maiúsculo/minúsculo (linha 673). Por isso
  `*.pdf` cobre `*.PDF` e não é preciso listar as duas formas.
- **Extras não pedidos (opcionais):** `*.pptx` (`.gitignore` linha 12) e
  `.claude/settings.local.json` (`.gitignore` linha 18).
- **Limite conhecido:** `ignore_paths` é filtro de melhor esforço para comandos de shell
  (linhas 501-510; lacunas em 780-845). Para conteúdo que nunca pode ser capturado, o caminho
  forte é o modo allowlist (`install-hooks --capture-mode allowlist`, install.md linhas 941-960),
  que exige **não** ter o marker no repositório sensível. Para o aulasenai, o modelo acima
  serve (não é o caso de conteúdo que nunca pode entrar).

## 3. Observação para a subtarefa de instalação (.7)

- O instalador (subtarefa .7) **deve recusar** qualquer projeto cujo caminho esteja dentro de
  `C:\fontes\DEMAIS-PROJETOS-*\`, e também não gravar nada nesses projetos.
- Motivo: o `ignore_paths` de um marker só casa caminhos dentro da própria pasta (linhas 531-533 e
  717-722). Uma pasta `DEMAIS-PROJETOS-*` fora do projeto não é protegida pelo marker do aulasenai.
- Regra de origem: `C:\fontes\rules-ai\regras\pastas-ignoradas.md` (C20 e C23). Não ler essa pasta
  para decidir nada: a recusa é pelo caminho, sem abri-la.

## Verificação (linha pronta para o campo Verificação)

Verificação: modelo conferido por leitura contra `ai-memory/docs/marker-file.md` (schema,
`[capture] ignore_paths`, padrões `*`/`?`/`**`) e `.gitignore` do aulasenai; nenhum marker criado;
após a instalação, rodar `ai-memory hook --event post-tool-use --agent claude-code
--server-url http://127.0.0.1:49374 --check-capture` com payload de leitura de
`scripts/variaveis.js` e de `.env` (não executado nesta subtarefa; conferir na subtarefa .7).
