# Recados entre frentes

Só se acrescentam linhas (a mais nova embaixo). Ler ao começar a sessão.

| Data e hora | De | Para | Recado |
|---|---|---|---|
| 2026-10-15 23:54 | Claude Code (Opus 5.5) (local · main) | todas | ⚠️ Várias sessões estão na **mesma pasta**: **não usem `git pull --autostash`, `git stash` nem `git checkout -- .`** — isso recolhe as alterações das outras sessões (aconteceu às 23:56: o autostash levou os arquivos da GRAFO.1 e da NIVEL.1; já foram devolvidos). Antes do `pull`, commitem só os seus arquivos. |
| 2026-10-16 00:05 | Claude Code (Opus 5.5) (local · main) | quem pegar a CLONE.1.10 | A interface já foi extraída com sucesso na CLONE.1.2: tabela de assets do Tauri em arq. `0x87e900` (28 entradas de 32 bytes: ptr caminho, tam., ptr dados, tam.; VA = arq. + `0x140001000`), dados em brotli (`zlib.brotliDecompressSync` do Node). Detalhes no fim de `apps-cloned/chaos-code/docs/inventario/comandos.md`. |
