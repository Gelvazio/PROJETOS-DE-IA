# Backup e restauração da memória (ai-memory)

Subtarefa AI-MEMORY-INTEGRATION.21 (nível PESADO). Pasta de dados:
`%LOCALAPPDATA%\ai-memory\` (servidor em `127.0.0.1:49374`).

## O que existe lá

| Item | Guarda | Vai para o backup? |
|---|---|---|
| `wiki/` | Páginas da memória (Markdown). **Já é um repositório Git** (commit `upgrade baseline`), sem remoto | Sim, por Git e por tarball |
| `db/memory.sqlite` | Índice de busca e eventos | Só no tarball |
| `config.toml` | Configuração, inclusive `[auth].token_pepper` (**segredo**) | No tarball (cuidado) |
| `auth-token`, `auth-header`, `auth-tokens/` | Credenciais do servidor e dos hooks | ⛔ Nunca. O tarball já os exclui |
| `raw/`, `logs/`, `models/`, `hook-spool/` | Registro bruto, logs, modelos, fila | Não |

## Duas camadas

### 1. Wiki em Git privado (diário, sem segredo)

O wiki só tem texto de memória; o `config.toml` e o banco ficam fora, então o remoto não leva segredo.

1. Criar um repositório **privado** vazio no GitHub (ex.: `Gelvazio/ai-memory-wiki`). Só o usuário
   faz esta etapa (ação externa).
2. Uma vez: `git -C "%LOCALAPPDATA%\ai-memory\wiki" remote add origin <url-do-repo-privado>`.
3. Cada backup:
   ```
   git -C "%LOCALAPPDATA%\ai-memory\wiki" add -A
   git -C "%LOCALAPPDATA%\ai-memory\wiki" commit -m "backup AAAA-MM-DD"
   git -C "%LOCALAPPDATA%\ai-memory\wiki" push -u origin HEAD
   ```
   Se o servidor estiver gravando, repetir o `add`/`commit` (ele mesmo faz checkpoints no Git).
4. ⛔ Não versionar `config.toml`, `auth-*`, `db/` nem `raw/` nesse repositório.

### 2. Tarball completo (antes de mudança arriscada, ou semanal)

```
ai-memory backup --to D:\backups\ai-memory-AAAA-MM-DD.tar.gz
```

- Pode rodar com o servidor no ar. Contém wiki, banco e `config.toml` verbatim.
- ⚠️ Tratar como **segredo** (tem o `token_pepper`): guardar em disco/nuvem protegidos, nunca em
  repositório, nem mesmo privado.

## Restauração

### Só o wiki (máquina limpa ou perda de banco)

1. Instalar o ai-memory e iniciar o servidor uma vez (cria `config.toml` e as credenciais novas).
2. `git clone <url-do-repo-privado> "%LOCALAPPDATA%\ai-memory\wiki"` (com o servidor parado e a
   pasta `wiki` vazia).
3. Subir o servidor. Se a busca vier vazia, reconstruir o índice a partir do wiki
   (ver `lifecycle-ops.md` do ai-memory, "rebuild").
4. Rodar `ai-memory install-hooks --apply` e `install-mcp --apply` para religar as credenciais.

### Tudo (do tarball)

1. **Parar o servidor** (o restore recusa se houver outro processo `ai-memory`).
2. `ai-memory restore --from <tarball> --data-dir <destino> [--force]`.
3. Por padrão mantém o `config.toml` existente e grava o do backup como
   `config.toml.from-backup`; só `--with-config` o adota (ele pode conter comandos e URLs: ler antes).
4. Credenciais (`auth-token*`) não vêm no tarball: rodar `ai-memory auth enable` e
   `install-hooks --apply` na máquina nova.

## Conferência feita em 2026-10-23

Com o servidor no ar:

| Passo | Comando | Resultado |
|---|---|---|
| Backup | `ai-memory backup --to <scratchpad>/bk.tar.gz` | OK, 72,41 KiB |
| Restauração em pasta vazia | `ai-memory restore --from bk.tar.gz --data-dir <scratchpad>/rest` | OK; vieram `config.toml`, `db/`, `logs/`, `wiki/` |
| Memória igual | `diff -r -q wiki/ rest/wiki/` (inclui `.git`) | Sem diferenças |
| Segredo no backup | tarball sem `auth-token`, `auth-header`, `auth-tokens/`; só o `config.toml` carrega o pepper | Conforme a documentação |

Não conferido: o `git push` para remoto privado (o repositório ainda não existe; criá-lo é ação do
usuário) e a reconstrução do índice a partir de um `git clone`.
