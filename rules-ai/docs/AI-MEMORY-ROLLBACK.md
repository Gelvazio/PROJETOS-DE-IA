# AI-MEMORY — rollback (desligar a memória sem perder o quadro)

Subtarefa AI-MEMORY-INTEGRATION.26 (etapa 038). Objetivo: desligar a memória de um projeto
sem tocar no quadro (`tasks/`), no `rules-local/` nem nas regras. Piloto: `aulasenai`.

**Regra:** o rollback não apaga o wiki. Antes de qualquer remoção, guardar o wiki (passo 4).

## Passo 1 — tirar os hooks do ai-memory do projeto

No `.claude/settings.json` do projeto, remover **só** as entradas cujo `command` é o
`ai-memory.exe` (ou que têm `ai-memory` nos `args`). No `aulasenai`, são 2 entradas:

| Evento | Matcher | Comando removido |
|---|---|---|
| `SessionStart` | `""` | `ai-memory.exe … hook --event session-start` |
| `PostToolUse` | `""` | `ai-memory.exe … hook --event post-tool-use` |

Manter **todas as outras** entradas (no `aulasenai`: `inicio-da-sessao.js`, `rules-local/sessao.mjs`,
`antes-da-ferramenta.js`, `depois-de-gravar.js` e `rules-local/jev/ganchos/claude-prompt.mjs`) e a
seção `permissions` como estão. Se um evento ficar sem nenhuma entrada, pode apagar a chave dele.

Não usar `git checkout` nem restaurar o arquivo inteiro: o `settings.json` pode ter mudado desde
a instalação.

## Passo 2 — apagar o marker

Apagar `.ai-memory.toml` na raiz do projeto. Sem o marker, o ai-memory deixa de capturar o projeto.

## Passo 3 — parar o servidor

Servidor: `127.0.0.1:49374` (só loopback). Antes de parar, conferir o processo e a porta:

```
netstat -ano | findstr 49374
Get-Process ai-memory
```

Parar o processo `ai-memory` (pelo PID conferido). **Não há comando de parada documentado no
`rules-ai`** (ver pendências). Parar o servidor só com ordem do usuário, porque ele atende todos
os projetos que têm hooks ligados.

## Passo 4 — guardar o wiki antes de qualquer remoção

O wiki (`%LOCALAPPDATA%\ai-memory\wiki`) é o histórico da memória. Duas formas, sem repositório
com segredo:

1. **Tarball completo** (ver `AI-MEMORY-BACKUP.md`, seção 2): `ai-memory backup --to <caminho fora
   de qualquer repositório>`. Pode rodar com o servidor no ar. Contém `config.toml` (tem o
   `token_pepper`): tratar como segredo.
2. **Só o wiki:** copiar a pasta `wiki` para fora do `%LOCALAPPDATA%` (é um repositório Git local,
   sem remoto). Não enviar a um remoto sem decisão do usuário.

Guardar antes do passo 3; nunca apagar `db/` ou `wiki/` como parte do rollback.

## O que não muda no rollback

- `tasks/` (quadro e etapas), `rules-local/` e `AGENTS.md`/`CLAUDE.md` do projeto.
- Os outros hooks do `.claude/settings.json`.
- Regras globais em `rules-ai`.

## Verificação do ensaio (2026-10-23)

Ensaio feito numa **cópia** do `.claude/settings.json` e do `.ai-memory.toml` do `aulasenai`, em
pasta temporária. O servidor real não foi parado e os arquivos reais não foram alterados.

| Passo | Resultado |
|---|---|
| Remover entradas `ai-memory` (script em Node sobre a cópia) | Removidas 2: `SessionStart/""` e `PostToolUse/""` |
| Apagar `.ai-memory.toml` da cópia | OK |
| Tempo do passo 1 e 2 (início/fim) | 12:27:15 → 12:27:15 (menos de 1 s) |
| Outros hooks iguais ao original | `true` (7 hooks antes, 5 depois; as 5 restantes são as outras) |
| `ai-memory` restante no JSON da cópia | 0 |
| Seção `permissions` igual | `true` |
| Arquivos reais do `aulasenai` | Intactos (`.ai-memory.toml` existe; 4 ocorrências de `ai-memory` no `settings.json` real) |

**Não medido:** passos 3 e 4 (parar o servidor e guardar o wiki). Por isso, a meta de menos de
10 minutos vale para a parte de arquivos; o tempo total depende da parada do servidor e do tamanho
do backup.

## Pendências

- Não há comando documentado para parar o `ai-memory` (nem serviço, nem tarefa agendada): definir
  e testar com o servidor real, com ordem do usuário.
- Não há comando de desinstalação dos hooks no `rules-ai`; o passo 1 é manual. O `--apply` do
  instalador só troca as entradas ao reinstalar. Conferir se o `ai-memory` oferece remoção.
- O backup em tarball não foi executado (contém segredo; fora do escopo do ensaio).
