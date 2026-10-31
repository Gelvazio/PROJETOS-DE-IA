# Chaos Code — clone (Node/TypeScript + Electron)

Recriação do Chaos Code v3 (original em Rust + Tauri). Plano e andamento:
[`tasks/etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md`](../../tasks/etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md).

## Comandos

```bash
npm install
npm run typecheck   # confere os tipos
npm run build       # gera dist/ (main, preload e renderer)
npm run dev         # build + abre o app
```

## Estrutura

| Pasta | Responsabilidade |
|---|---|
| `src/compartilhado/` | Constantes e tipos usados por todos os processos |
| `src/main/` | Processo principal: janela, canais IPC, configuração |
| `src/preload/` | Ponte segura (`window.chaosCode`) entre a interface e o main |
| `src/renderer/` | Interface (HTML, CSS e TypeScript) |
| `scripts/construir.mjs` | Build com esbuild para `dist/` |

## Servidor

O clone usa **outro servidor** (não o `chaoscode.ai`). O padrão fica em
`src/compartilhado/constantes.ts` e pode ser trocado pela variável `CHAOS_CODE_SERVIDOR`.
