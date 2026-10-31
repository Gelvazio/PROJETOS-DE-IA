---
name: classificar-tarefa
description: Classifica uma subtarefa do quadro (tasks/STATUS.md + etapa) no nível LEVE (fácil), MEDIO (média) ou PESADO (difícil) pelo Jev ou pelos sinais desta skill, e diz qual ferramenta e modelo de IA pode pegá-la (matriz ferramenta × modelo × nível). Use ao criar ou dividir subtarefa, quando perguntarem "qual o nível desta tarefa?", "quem pode pegar?", "esta tarefa é para mim?" ou "/classificar-tarefa".
---

# Classificar tarefa (classificar-tarefa)

Fonte das regras do quadro: `AGENTS.md` → `.claude/rules/tasks/`. Esta skill só **define o nível** e
**quem pode pegar**; reservar continua sendo pela `frentes-e-reserva.md`.

> Fonte única desta skill: `.agents/skills/classificar-tarefa/SKILL.md`. As cópias em `.claude/`,
> `.grok/` e `.gemini/commands/` são geradas no commit — **não editar as cópias**.

## Níveis

| Nível | Em palavras simples | Sinais concretos |
|---|---|---|
| `PESADO` | tarefa difícil | banco de dados, SQL, RLS, login/papéis/permissões, **chaves ou segredos**, migração, segurança, arquitetura, mais de 3 arquivos ligados, mudança em massa, apagar dados |
| `MEDIO` | tarefa média | código com lógica (telas, serviços, API, scripts, workflows), de 1 a 3 arquivos |
| `LEVE` | tarefa fácil | só `.md`, mover linhas do quadro, textos, formatação, configuração simples sem lógica |

## Ordem de decisão

1. **A regra mais restritiva vence:** basta um sinal de `PESADO`
   ("1 arquivo, mas é SQL" = `PESADO`).
2. **Na dúvida, sobe o nível** (`LEVE` → `MEDIO` → `PESADO`).
3. Se dois critérios discordarem (ex.: quantidade de arquivos × assunto), **vale o nível mais
   alto**.
4. **Pergunte ao Jev** (abaixo). Confiança abaixo de 0,60 ou Jev fora → decida pelos sinais da tabela.
5. Se o Jev e os sinais discordarem, **vale o nível mais alto dos dois**.

### Pergunta ao Jev

Antes de decidir só pelos sinais, tente o **Jev** (C39, C42, C43; regra em
`C:/fontes/rules-ai/regras/jev.md`). Somente leitura: não grava no quadro e não reserva.

```bash
node C:/fontes/rules-ai/scripts/jev.mjs classificar --id <ID> --quadro tasks/STATUS.md --json
```

- A chave `TYPESAFE_API_KEY` fica **só** no `rules-ai` (ambiente ou `.env` da raiz dele). ⛔ Nunca
  copiar a chave para este projeto.
- Leia `nivel_final_proposto`, `confianca` e `acao` da saída.
- `confianca` **abaixo de 0,60** (ou `acao: humano`) → decida pelos sinais e peça a conferência
  do usuário.
- Se o Jev e os sinais discordarem, **vale o nível mais alto** dos dois. O Jev nunca rebaixa nível.
- Falhou (código 1 sem chave, 2 com `JEV_MODO=off`, 5 Jev indisponível) → **só os sinais** desta
  skill; na dúvida, sobe o nível. Nunca há outro servidor de reserva.
- Mensagem do usuário: o gancho do Jev (C43) já põe a sugestão de nível e modelo no contexto da
  IA; para **subtarefa do quadro**, a sugestão continua sendo só conselho.

## Matriz ferramenta × modelo × nível

Ponto de partida — **ajuste ao projeto** (o usuário decide; registre a mudança no "Registro de
decisões" do `tasks/STATUS.md`). `⛔` = não pega.

| Ferramenta | `LEVE` | `MEDIO` | `PESADO` |
|---|---|---|---|
| **Claude Code** (local ou nuvem) | Haiku | Sonnet | **Opus 5.5 ou superior, ou Fable** |
| **Gemini CLI** | modelo Flash | modelo Pro | ⛔ |
| **Antigravity** | Gemini Flash | ⛔ | ⛔ |
| **Grok** | modelo rápido | modelo principal | ⛔ |
| **DeepSeek** | DeepSeek V4.1 Flash | modelo de raciocínio | ✅ |
| **OpenCode** | DeepSeek V4.1 Flash (`deepseek-flash`) | DeepSeek V4.1 Flash com thinking (`deepseek-flash`) | **DeepSeek V4 Pro (`deepseek-v4-pro`)** |
| **Codex** | ✅ | ✅ | ⛔ |
| **Cursor** | ✅ | ✅ | ⛔ |
| **Qoder** | ✅ | ✅ | ⛔ |
| **Devin** | ✅ | ⛔ | ⛔ |

- **`PESADO` é só do Claude Code com Opus 5.5 ou superior, Fable, ou DeepSeek** (C35) — no OpenCode,
  com `deepseek-v4-pro` (C37). Nenhuma outra ferramenta pega.
- Cada agente se identifica como **ferramenta + modelo** (o nome da frente) e pega subtarefa
  **até o máximo do seu nível**: o máximo da sua linha (ex.: Codex → `MEDIO`, Devin → `LEVE`).
- Modelo forte só pega nível mais leve **se não houver nenhuma livre do seu nível** (regra global
  C2). O `.githooks/pre-commit` recusa a reserva acima do nível e só avisa quando é mais leve,
  lendo o modelo no nome da frente.
- Tarefa de banco: depende de a sessão ter acesso ao banco (`.claude/rules/multiplas-ias.md`).

## Exemplos

| Subtarefa | Nível | Por quê |
|---|---|---|
| Criar o script `database/02_tabela_clientes.sql` | `PESADO` | SQL |
| Guardar a chave da API num segredo do workflow | `PESADO` | segurança e segredo |
| Tela de cadastro com validação (1 componente) | `MEDIO` | 1 arquivo com lógica, sem banco direto |
| Função que formata datas num módulo de utilidades | `MEDIO` | lógica em 1 arquivo |
| Documentar a instalação no `README.md` | `LEVE` | só `.md` |
| Acrescentar uma linha no `.gitignore` | `LEVE` | configuração simples sem lógica |

## Formato de saída

Na **seção da subtarefa** dentro da etapa (`tasks/etapas/…`), como primeiro item da lista (a
prioridade fica na linha do `STATUS.md`):

```markdown
- **Nível:** MEDIO — código com lógica em 1 arquivo de `src/`, sem chave (Jev 0,91)
```

A justificativa é curta: o sinal que decidiu e, se usou o Jev, a confiança. Gravar o nível segue o ciclo normal (commit com o
quadro; `docs(board): …` se for só classificar).

## Proibido

- ⛔ Mudar a **prioridade** (é do usuário).
- ⛔ Reclassificar subtarefa **reservada por outra frente** ou sob **🔒 trava especial**.
- ⛔ Baixar o nível para caber na sua ferramenta: se não cabe, deixe para quem pode.
