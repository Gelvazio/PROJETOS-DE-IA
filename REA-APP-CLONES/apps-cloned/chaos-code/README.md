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

## Como rodar e o que testar (CLONE.14.2)

### Rodar

```bash
npm install
npm run typecheck
npm run build
npm run dev          # abre a janela do app (Electron)
```

O app guarda os dados em `%LOCALAPPDATA%\chaos-code-v3` (Windows). O servidor da plataforma
padrão é `http://localhost:3000` e muda pela variável `CHAOS_CODE_SERVIDOR`. Para entrar sem a
plataforma, ligue o login simulado: `CHAOS_CLONE_LOGIN_SIMULADO=sim`.

### O que testar na interface

| Tela | O que fazer |
|---|---|
| `#/login` | Entrar (real ou simulado); estado muda e leva ao `#/dashboard` |
| `#/dashboard` | Resumo do projeto ativo: RAG, MCP e WSL |
| `#/projetos` | Criar projeto, abrir (vira ativo), remover |
| `#/tarefas` | Listar/criar/concluir tarefas do projeto na plataforma |
| `#/indexacao` | Indexar o projeto, acompanhar as fases e buscar nos vetores |
| `#/grafo` | Consultar o conhecimento e ver entidades/relações |
| `#/mcp` | Ligar o MCP local, copiar os comandos `mcp add` (token oculto), gravar a config nos CLIs e corrigir o WSL |
| `#/agentes` | Listar modelos embutidos e os agentes das pastas dos CLIs; gravar um agente |
| `#/imagens` | Gerar imagem pelo Gemini local e ver a galeria da plataforma |
| `#/configuracoes` | Versão, verificar/baixar atualização, chave do Gemini, sair |

### O que testar no MCP local

Com o servidor ligado em `#/mcp`:

```bash
curl http://127.0.0.1:19850/health
curl -s http://127.0.0.1:19850/.well-known/oauth-protected-resource
curl -s -X POST http://127.0.0.1:19850/mcp/<project_id>   -H "Content-Type: application/json"   -H "X-MCP-Session-Token: <token>"   -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

O token de sessão sai em `#/mcp` (renovável); sem token válido o `/mcp/*` responde 401 e o
`initialize`/`tools/list`/`tools/call` seguem o JSON-RPC 2.0.

### Validação sem navegador (regra do projeto)

`npm run typecheck` e `npm run build` passam; a conferência contra o inventário está na seção
"Cobertura pelo clone" do `docs/INVENTARIO.md`.

