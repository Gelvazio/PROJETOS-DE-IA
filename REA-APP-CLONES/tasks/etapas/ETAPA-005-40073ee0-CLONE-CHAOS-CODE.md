## Etapa 005-40073ee0 — CLONE: Clonar o Chaos Code v3 em Node/TypeScript + Electron

**Tarefa:** CLONE · **Pedido em:** 2026-10-15 23:12 · **Criada por:** Claude Code (Opus 5.5) (local · main)
**Pedido:** "clone o app da pasta apps-to-be-clone e coloque na pasta apps-cloned" · respostas:
"1-dono;2-inteiro;3node/typescript + electron;4-sim"
**Objetivo:** recriar o app inteiro `apps-to-be-clone/chaos-code-v3-client.exe` (Chaos Code v3,
Rust + Tauri) em Node/TypeScript + Electron, na pasta `apps-cloned/chaos-code/`.

> Tarefa **grande** (várias partes, estrutura nova, login/tokens): este é o plano. Só executar
> depois da aprovação do usuário (registrada em "Decisões").

### Escopo

- **Entra:** todas as funções vistas no executável (análise estática de 2026-10-15):
  - login OAuth no `https://chaoscode.ai` (`/api/oauth/register|token|revoke`), tokens cifrados
    no cofre do sistema, checagem do aparelho (`device_mac_address`) e modo simulado (`auth::mock`);
  - cliente da API (`/api/oauth/user/projects`, `/api/projects/…`, tarefas, imagens,
    `/api/client/agent-templates`);
  - projetos e armazenamento local (`storage::local`, `project::manager`, arquivos `*.json`);
  - vetores: divisor de texto, embeddings (OpenAI, Gemini, OpenRouter) e índice
    (`vector::chunker|embedder|index`);
  - grafo de conhecimento: extração, comunidades, transformação de consulta e reordenação
    (`graph::extraction|community|query_transform|rerank`);
  - servidor MCP local HTTP (`/mcp/{project_id}`, `X-MCP-Session-Token`, descoberta OAuth) e
    configuração nos CLIs (`claude mcp add …`, `mcp::cli_config`, `agents::cli_discovery`);
  - WSL: detectar e liberar acesso ao localhost (`wsl::detect`);
  - agentes: modelos, leitura do frontmatter, gravação para o CLI (`agents::*`);
  - geração de imagem (Gemini "Nano Banana") e atualizador (`releases/latest.json` + assinatura
    minisign);
  - interface (telas do frontend embutido no executável).
- **Não entra:** mudar o servidor `chaoscode.ai`; publicar o clone; testes automatizados novos
  (regra do projeto).
- **Critério de pronto:** `npm run typecheck` e `npm run build` sem erro em
  `apps-cloned/chaos-code/`; cada função do inventário (CLONE.1) com equivalente no clone ou
  justificativa; aceite do usuário rodando o app.

### Premissas

- O usuário é **dono** do Chaos Code (resposta 1): pode extrair a interface, os textos dos prompts
  e os formatos de arquivo do executável para reaproveitar no clone.
- O clone conversa com **outro servidor** (não o `chaoscode.ai`): o endereço fica numa constante
  configurável; qual servidor será definido antes da CLONE.4/CLONE.5.
- Ghidra disponível no REA depois do reinício do app Claude (GHIDRA.5).

### Riscos

| Risco | Plano B |
|---|---|
| Ghidra continua indisponível | Inventário por strings, recursos e assets extraídos; Ghidra só para pontos obscuros |
| Interface embutida comprimida (brotli) difícil de extrair | Recriar as telas a partir do inventário de comandos e textos |
| Comportamento do servidor só visto em tempo de execução | Usuário roda o original e confirma; ou usar o modo simulado |
| Subtarefas grandes demais | Dividir cada uma em subtarefas menores **ao reservar**, antes de codificar |
| Subtarefas de "Canais IPC" mexem nos mesmos 4 arquivos (`constantes.ts`, `canais.ts`, `preload.ts`, `global.d.ts`) | Cada uma só acrescenta o seu bloco; ao sincronizar, manter os blocos das duas frentes e rodar `npm run typecheck` |

### Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-15 23:12 | Usuário é dono; clone do app inteiro; Node/TypeScript + Electron; reiniciar o Claude para ter o Ghidra | Gelvazio | Respostas às perguntas da abertura |
| 2026-10-15 23:35 | CLONE.1 e CLONE.3 a CLONE.14 divididas em 108 subtarefas de ~1 arquivo, cada uma com nível e modelo (MODELO.2, ETAPA-006); escopo igual ao aprovado | Gelvazio (pedido) | "divida no maximo de subtasks possivel" para pegar com outros modelos |
| 2026-10-15 23:38 | Servidor do clone = servidor Python local em `apps-cloned/chaos-code/server/`, `http://localhost:3000`; sem `client_id` fixo (registro dinâmico) — CLONE.4.1 | Gelvazio | "criar este servidor aqui local em python numa pasta de nome server"; "2-sim" (porta 3000) |
| 2026-10-15 23:16 | **Plano aprovado**; o clone usa **outro servidor** (não o `chaoscode.ai`); começar pela CLONE.2 | Gelvazio | "aprovado, outro servidor, pode começar;2-" |

### CLONE.1 — Inventário completo do original
- **JEV-AI-SUGGESTION:** NAO

**Próximo passo:** — (dividida em CLONE.1.1, CLONE.1.2, CLONE.1.3, CLONE.1.4, CLONE.1.5, CLONE.1.6, CLONE.1.7, CLONE.1.8, CLONE.1.9, CLONE.1.10, CLONE.1.11; cada uma tem seção própria abaixo)

### CLONE.1.1 — Mapa dos módulos `chaos_code_v3_client_lib::*`

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — engenharia reversa do binário com REA/Ghidra · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** Nenhuma
- **Descrição:** listar cada módulo Rust do executável e o que faz, em `apps-cloned/chaos-code/docs/inventario/modulos.md`.
- **Critérios de Aceitação:** cada módulo com 1 linha de função e os endereços/strings que comprovam.
- **Entrega:** commit `feat(CLONE.1.1)` — `apps-cloned/chaos-code/docs/inventario/modulos.md`
  (40 arquivos-fonte em 6 grupos: núcleo, login, API/RAG, MCP/agentes, comandos Tauri; pistas
  para a CLONE.1.2 a 1.10). · **Verificação:** leitura estática dos bytes do executável
  (SHA-256 `46dab592…`), sem executar nada; script confere que os 40 caminhos `src\…\*.rs`
  citados estão no deslocamento indicado e que VA = arq. + `0x140001000` (tirado da tabela de
  seções do PE): 40 certos, 0 errados. Feita por Claude Code (Opus 5.5) (local · main), 2026-10-15.
- **Anotação:** nada foi decompilado; funções vêm das mensagens de log e caminhos de arquivo.
  Itens *(inferido)* ficam para confirmar no Ghidra nas próximas subtarefas.

### CLONE.1.2 — Comandos Tauri (`invoke`) do original

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — engenharia reversa do binário · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.1.1
- **Descrição:** nome, parâmetros e retorno de cada comando chamado pela interface, em `apps-cloned/chaos-code/docs/inventario/comandos.md`.
- **Critérios de Aceitação:** todos os comandos usados pelo frontend embutido listados.
- **Entrega:** commit `feat(CLONE.1.2)` — `apps-cloned/chaos-code/docs/inventario/comandos.md`:
  79 comandos (66 chamados pela interface + 13 só registrados no Rust), argumentos, retornos
  observados, 3 eventos (`sync-progress`, `update-progress`, `mcp:consent-request`) e o
  tratamento de erro 401 da interface. · **Verificação:** interface recuperada da tabela de
  assets do Tauri (28 arquivos, brotli, todos descomprimidos); script confere que os 79 nomes do
  documento = os da interface + os do Rust, que os 13 marcados ⚙️ estão no binário e que os
  campos citados existem no JS. Nada executado. Feita por Claude Code (Opus 5.5) (local · main),
  2026-10-16.
- **Anotação:** retornos de boa parte dos comandos e argumentos dos 13 ⚙️ ficam em aberto
  (ver o fim do documento). Método de extração da interface anotado para a CLONE.1.10.

### CLONE.1.3 — Endpoints da API e formatos de pedido/resposta

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — engenharia reversa do binário · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.1.1
- **Descrição:** rotas `/api/...`, método, corpo e resposta (structs serde), em `apps-cloned/chaos-code/docs/inventario/api.md`.
- **Critérios de Aceitação:** todas as rotas vistas nas strings com formato descrito.
- **Entrega:** commit `feat(CLONE.1.3)` — `apps-cloned/chaos-code/docs/inventario/api.md`: 27 rotas da plataforma (OAuth, projetos, ferramentas MCP, wiki, tarefas, imagens, agent-templates, latest.json) com método, parâmetros e structs serde; APIs de terceiros, rotas locais do MCP e ferramentas MCP × rotas. A interface não chama a API direto (só `invoke`). Feita por Claude Code (Opus 5.5 · herdr op1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** script do executor (só leitura de bytes, Python `-I` + capstone): 33/33 strings no deslocamento citado e 29/29 pares URL → `Client::request` → método conferidos; interface extraída (brotli) sem `fetch` para `/api/`. Líder conferiu seções e o único arquivo alterado. Em aberto: campos *(inferido)*, corpos de POST/PATCH, método do `/wiki/sync/ack`.

### CLONE.1.4 — Formatos dos arquivos `*.json` locais

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — engenharia reversa do binário · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.1.1
- **Descrição:** nome, pasta e campos de cada arquivo gravado (`storage::local`, índice, grafo, histórico), em `apps-cloned/chaos-code/docs/inventario/arquivos-locais.md`.
- **Critérios de Aceitação:** cada arquivo com exemplo de conteúdo.
- **Entrega:** commit `feat(CLONE.1.4)` — `apps-cloned/chaos-code/docs/inventario/arquivos-locais.md`: pasta base `%LOCALAPPDATA%\chaos-code-v3`, regras do `storage::local` (JSON com 2 espaços, gravação atômica `.json.tmp`, validação de ID), mapa de pastas e 17 arquivos com struct, campos na ordem do Serialize, obrigatórios, padrões e exemplo; arquivos fora da pasta de dados; correções ao `imagem-atualizador.md` (UpdateConfig com 3 campos, UpdateHistory com 7). Feita por Claude Code (Opus 5.5 · herdr op2; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** script do executor (Python `-I`, só bytes): 18/18 structs conferidas, 17/18 nomes de arquivo no deslocamento (o 18º aponta de propósito para a mensagem de erro), 60 deslocamentos existentes; 17/17 exemplos passam no `json.loads`. Ghidra estourou 330 s duas vezes. Em aberto: tipos exatos dos campos.

### CLONE.1.5 — Login OAuth, cofre e aparelho do original

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — segurança + engenharia reversa · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.1.1
- **Descrição:** fluxo OAuth (PKCE, callback), onde guarda os tokens, como lê o MAC e o modo `auth::mock`, em `apps-cloned/chaos-code/docs/inventario/login.md`.
- **Critérios de Aceitação:** passo a passo do login e da renovação descrito.
- **Entrega:** commit `feat(CLONE.1.5)` — `apps-cloned/chaos-code/docs/inventario/login.md`: endpoints e escopo `mcp:read mcp:write`, login em 11 passos (PKCE S256, callback em `127.0.0.1:0`, `state`), renovação, revogação, cofre (keyring 3.6.3 + reserva `auth_tokens.json` cifrada com HKDF), aparelho (`device_id.json`, UUID v4, 5 campos, MAC por `GetAdaptersAddresses`) e `auth::mock`. Feita por Claude Code (Opus 5.5 · herdr op3; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** leitura de bytes e desmontagem com capstone (limites pela `.pdata`, imports resolvidos), Python `-I`, nada executado; script conferiu os 17 deslocamentos citados (1 corrigido); líder conferiu seções e ausência de segredos. Ghidra estourou 330 s e não foi usado. Em aberto (no documento): tempo limite do callback, tamanho do `code_verifier`, AEAD, ativação do mock.

### CLONE.1.6 — Vetores e grafo do original

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — engenharia reversa de algoritmos · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.1.1
- **Descrição:** tamanho dos pedaços, provedores/modelos de embedding, formato do índice, algoritmo de comunidades, transformação de consulta e reordenação, em `apps-cloned/chaos-code/docs/inventario/vetores-grafo.md`.
- **Critérios de Aceitação:** parâmetros numéricos e modelos anotados.
- **Entrega:** commit `feat(CLONE.1.6)` — `apps-cloned/chaos-code/docs/inventario/vetores-grafo.md`: SmartChunker (1500, sobreposição 0,1, 10 MiB, 10.000 pedaços), embeddings (4 modos, lote 150, concorrência 24, 80 RPM × 80%, 429 → 3 tentativas), `vectors.json` + HNSW (1000, M=16, efConstruction=200), grafo (entidades, relações, comunidades), `RagPipelineConfig` (multi_query/HyDE, rerank 20→10 em 5000 ms, MMR 0,7) e fases do sync. Feita por Claude Code (Opus 5.5 · herdr op3; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** strings e structs por Python `-I`, interface extraída (brotli), capstone + `.pdata` nas funções do chunker, HNSW, embedder e espera; 22 deslocamentos conferidos. Nada executado. Em aberto: campos de `VectorEntry`/`Entity`/`Relation`/`Community`, algoritmo de comunidades, `efSearch`.

### CLONE.1.7 — Ferramentas MCP e configuração nos CLIs/WSL

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — engenharia reversa do binário · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.1.1
- **Descrição:** ferramentas MCP (nome, descrição, schema), rota, token de sessão, descoberta OAuth, comandos `claude mcp add`, CLIs suportados e passos do WSL, em `apps-cloned/chaos-code/docs/inventario/mcp-cli-wsl.md`.
- **Critérios de Aceitação:** cada ferramenta com schema de entrada.
- **Entrega:** commit `feat(CLONE.1.7)` — `apps-cloned/chaos-code/docs/inventario/mcp-cli-wsl.md`: servidor MCP (porta 19850, `/health`, Host/Origin, `X-MCP-Session-Token` e Bearer, JSON-RPC `2024-11-05`), 23 ferramentas com `inputSchema` completo e anotações, servidor de autorização (`.well-known`, registro só loopback, PKCE S256, consentimento `mcp:consent-request`, `mcp_at_`/`mcp_rt_`), configuração no Claude/Gemini/Codex e comandos `mcp add`, descoberta por `claude agents` e 6 passos do WSL. Feita por Claude Code (Opus 5.5 · herdr op1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** script do executor (Python `-I` + capstone): 108/108 deslocamentos com o texto certo; schemas lidos pela sequência de imediatos da função de `tools/list`; 92 anotações resolvidas; eventos e CLIs conferidos no JS da interface. Nada executado. Em aberto: alguns `default`, chave da URL no Gemini, validade dos tokens MCP.

### CLONE.1.8 — Textos de prompts e modelos de agente

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — busca de strings com REA, sem decompilar · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.1.1
- **Descrição:** copiar os prompts (extração, resumo, consulta), os modelos de agente e o frontmatter, em `apps-cloned/chaos-code/docs/inventario/prompts-agentes.md`.
- **Critérios de Aceitação:** textos copiados na íntegra.
- **Entrega:** commit `feat(CLONE.1.8)` — `apps-cloned/chaos-code/docs/inventario/prompts-agentes.md` e `modelos-agente-embutidos.json` (12 modelos, JSON válido).
- **Verificação:** textos tirados por leitura de bytes do `.rdata` (UTF-8, sem executar nada); `json.load` do arquivo de modelos ok. Os nomes dos valores nos furos `{...}` são inferidos. O catálogo de ferramentas MCP injetado nos prompts 3.1/3.2 é montado em execução e fica para a CLONE.1.7.

### CLONE.1.9 — Gerador de imagem e atualizador do original

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — strings e structs simples · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.1.1
- **Descrição:** modelo Gemini, pedido/resposta, pasta de saída; URL e formato do `latest.json`, assinatura minisign e histórico, em `apps-cloned/chaos-code/docs/inventario/imagem-atualizador.md`.
- **Critérios de Aceitação:** formatos descritos com exemplo.
- **Entrega:** commit `feat(CLONE.1.9)` — `apps-cloned/chaos-code/docs/inventario/imagem-atualizador.md`.
- **Verificação:** strings lidas do executável por leitura de bytes; a chave minisign foi decodificada do base64 do config (`RWSm2UKS…`). Campos marcados *(inferido)* e a pasta local das imagens ficam na seção Pendências do documento.

### CLONE.1.10 — Extrair a interface embutida (assets)

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — recursos comprimidos (brotli) no binário · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.1.1
- **Descrição:** extrair HTML/JS/CSS/ícones do frontend para `apps-cloned/chaos-code/docs/original/` e listar as telas em `apps-cloned/chaos-code/docs/inventario/telas.md`.
- **Critérios de Aceitação:** cada tela com nome, campos, botões e comando chamado.
- **Entrega:** commit `feat(CLONE.1.10)` — `apps-cloned/chaos-code/docs/original/` (cópia fiel dos 28 assets: 1 html, 15 js, 8 css, 4 mp3, e o ícone montado dos recursos) e `apps-cloned/chaos-code/docs/inventario/telas.md` (Vue 3 + Router + Pinia + i18n; cada tela com campos, botões, textos e `invoke`; 30 tokens visuais, fonte Figtree). Feita por Claude Code (Opus 5.5 · herdr op3; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** extrator do executor: 28 entradas da tabela `0x87e900` descomprimidas (brotli), gravadas e relidas com SHA-256 igual; 6 ícones `RT_ICON` → `.ico` de 13.716 bytes; comandos por store conferidos no `index.js`. Líder conferiu a contagem de arquivos e o `telas.md`. Em aberto: `/vite.svg` não embutido; layout fino fica para a CLONE.13.

### CLONE.1.11 — Índice do inventário (`INVENTARIO.md`)

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — só `.md`, junta links · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** CLONE.1.2 a CLONE.1.10
- **Descrição:** criar `apps-cloned/chaos-code/docs/INVENTARIO.md` com uma linha por arquivo de `docs/inventario/` e o que falta, se algo faltar.
- **Critérios de Aceitação:** todos os arquivos do inventário linkados.
- **Entrega:** commit `feat(CLONE.1.11)` — `apps-cloned/chaos-code/docs/INVENTARIO.md`: resumo, tabela com os 11 arquivos de `docs/inventario/` (subtarefa e o que cobre), a pasta `docs/original/` e "O que ainda falta" juntando os itens em aberto de cada arquivo. Feita por Claude Code (Haiku 5.5 · herdr hk1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** executor conferiu que os 11 arquivos de `docs/inventario/` têm link na tabela (nenhum faltando); líder leu o índice.

### CLONE.2 — Esqueleto Electron + TypeScript

**Próximo passo:** — (concluída)
- **Nível:** MEDIO — estrutura nova, sem regra de negócio
- **Descrição:** `package.json`, `tsconfig`, processos main/preload/renderer, scripts
- **JEV-AI-SUGGESTION:** NAO
  `typecheck`, `build`, `dev`; constantes em um arquivo só.
- **Critérios de Aceitação:** `npm run typecheck` e `npm run build` passam.
- **Entrega:** commit `feat(CLONE.2)` — `apps-cloned/chaos-code/` com Electron 44, TypeScript 7 e
  esbuild; `src/compartilhado/constantes.ts` (constantes, servidor configurável por
  `CHAOS_CODE_SERVIDOR`), main (janela com `contextIsolation` + `sandbox`, canais IPC), preload
  (`window.chaosCode`) e tela inicial. · **Verificação:** `npm run typecheck` e `npm run build`
  sem erro; `node --check` nos 3 arquivos de `dist/`; preload sem `require` local (exigência do
  sandbox). Abrir a janela (`npm run dev`) fica para o usuário (regra de não abrir app/navegador).
- **Anotação:** feita por Claude Code (Opus 5.5) (local · main), 2026-10-15.


### CLONE.2.1 — Tirar a pasta `dist/` do Git (gerada pelo build)

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — 1 linha de `.gitignore` · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin) · **Effort:** low
- **Depende de:** CLONE.2
- **Descrição:** criar `apps-cloned/chaos-code/.gitignore` com `dist/` e `node_modules/`; o líder tira `dist/` do índice (`git rm -r --cached`) no commit da entrega.
- **Critérios de Aceitação:** `npm run build` não deixa mais arquivo alterado no `git status`.
- **Anotação:** criada em 2026-10-18 00:37 por Claude Code (Opus 5.5) (local · main) — líder; trabalho achado no caminho (C26): cada build dos executores alterava os 8 arquivos versionados de `dist/`.
- **Entrega:** commit `feat(CLONE.2.1)` — `apps-cloned/chaos-code/.gitignore` (`dist/` e `node_modules/`) e `dist/` tirada do índice (`git rm -r --cached`, os arquivos continuam no disco). Feita por Claude Code (Haiku 5.5 · herdr hk1; líder Opus 5.5) (local · main), 2026-10-18; parte de Git pelo líder.
- **Verificação:** líder rodou `npm run build` depois do `git rm --cached`: nenhum arquivo de `dist/` aparece no `git status`.

### CLONE.3 — Armazenamento local e projetos
- **JEV-AI-SUGGESTION:** NAO

**Próximo passo:** — (dividida em CLONE.3.1, CLONE.3.2, CLONE.3.3, CLONE.3.4, CLONE.3.5, CLONE.3.6, CLONE.3.7; cada uma tem seção própria abaixo)

### CLONE.3.1 — Tipos dos arquivos locais

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — só tipos TypeScript copiados do inventário · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** CLONE.1.4
- **Descrição:** interfaces de cada `*.json` em `apps-cloned/chaos-code/src/compartilhado/tipos-armazenamento.ts`.
- **Critérios de Aceitação:** `npm run typecheck` ok.
- **Entrega:** commit `feat(CLONE.3.1)` — `apps-cloned/chaos-code/src/compartilhado/tipos-armazenamento.ts` (uma interface por `*.json` local de `arquivos-locais.md`, reexportando os tipos que já batiam). Feita por Claude Code (Haiku 5.5 · herdr hk1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` sem erro (executor e líder); 0 linhas acima de 100. O executor achou 6 divergências entre `tipos-vetores.ts`/`tipos-imagem.ts`/`tipos-grafo.ts` (escritos antes da CLONE.1.4) e o inventário; viraram a CLONE.3.8.

### CLONE.3.2 — Constantes da pasta de dados e nomes de arquivo

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — constantes sem lógica · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** CLONE.1.4
- **Descrição:** nomes de pasta e de arquivo no `src/compartilhado/constantes.ts`.
- **Critérios de Aceitação:** `npm run typecheck` ok.
- **Entrega:** commit `feat(CLONE.3.2)` — bloco "Pasta de dados e arquivos" no fim de `apps-cloned/chaos-code/src/compartilhado/constantes.ts` (pasta `chaos-code-v3`, subpastas `projects`/`conversations`/`invalid`, sufixo `.tmp`, indentação 2 e os 13 nomes de arquivo locais, sem repetir os do login). Feita por Claude Code (Haiku 5.5 · herdr hk1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` sem erro (executor e líder); 0 linhas acima de 100; nomes conferidos contra `arquivos-locais.md`, nenhuma constante repetida.

### CLONE.3.8 — Alinhar os tipos de vetores, imagem e grafo ao inventário dos arquivos locais

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — 4 arquivos de tipos, com decisões de forma · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor) · **Effort:** medium
- **Depende de:** CLONE.3.1
- **Descrição:** os tipos de `tipos-vetores.ts` (CLONE.6.1), `tipos-imagem.ts` (CLONE.11.1) e `tipos-grafo.ts` (CLONE.7.1) foram escritos antes do `arquivos-locais.md` (CLONE.1.4). Corrigir as 6 divergências que a CLONE.3.1 achou (config do embedder, campos de topo do `RagPipelineConfig`, `SyncState` opcional, `image_api_config.json`, arquivos do grafo como listas, `hy_de` × `hy_d_e`) e fazer o `tipos-armazenamento.ts` reexportar em vez de duplicar. Quem usa os tipos (constantes, similaridade, provedor, divisor) continua compilando.
- **Critérios de Aceitação:** `npm run typecheck` e `npm run build` ok; nenhum tipo de arquivo local definido duas vezes.
- **Anotação:** criada em 2026-10-18 04:55 por Claude Code (Opus 5.5) (local · main) — líder (C26), a partir do relatório da CLONE.3.1.
- **Entrega:** commit `feat(CLONE.3.8)` — `tipos-vetores.ts`, `tipos-imagem.ts`, `tipos-grafo.ts` e `tipos-armazenamento.ts` alinhados ao `arquivos-locais.md`: config do embedder com os campos do arquivo, 7 campos de topo no `RagPipelineConfig` (todos opcionais), `SyncState` opcional, `image_api_config.json` = {openai, gemini, platform}, arquivos do grafo como listas, `hy_d_e` confirmado no binário (arq. `0x822372`; `hy_de` não existe); `tipos-armazenamento.ts` só reexporta o que tem dono. Feita por Claude Code (Sonnet 5.5 · herdr sn1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro (executor; typecheck também pelo líder); quem usa os tipos continua compilando sem mudança; nenhum tipo de arquivo local definido duas vezes.

### CLONE.3.3 — Caminhos da pasta de dados

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — função com lógica (`app.getPath`, por sistema) · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.3.2
- **Descrição:** `apps-cloned/chaos-code/src/main/armazenamento/caminhos.ts` monta os caminhos de cada arquivo.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.3.3)` — `apps-cloned/chaos-code/src/main/armazenamento/caminhos.ts`: pasta base `<LOCALAPPDATA>\chaos-code-v3` (vazio → `.`), caminhos dos 12 arquivos globais, pasta e arquivos de cada projeto, conversa, `.json.tmp`; ID validado por `^[A-Za-z0-9_-]{1,128}$` *(escolha do clone)*, projeto inválido → `projects\invalid`, conversa inválida → erro. Feita por Claude Code (Sonnet 5.5 · herdr sn1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro; conferência por `node`: caminhos globais, de projeto e de conversa, IDs `..`, `../x`, `a/b`, vazio, `.`, com espaço e com 129 caracteres recusados. Líder rodou o typecheck. Em aberto: regra exata de ID do original.

### CLONE.3.4 — Leitor e gravador de JSON com gravação segura

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — lógica de arquivo (temporário + renomear) · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.3.3
- **Descrição:** `apps-cloned/chaos-code/src/main/armazenamento/arquivo-json.ts`: ler com valor padrão e gravar sem corromper.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.3.4)` — `apps-cloned/chaos-code/src/main/armazenamento/arquivo-json.ts`: `SistemaArquivos` injetável (padrão `node:fs/promises`), `lerJson<T>` com padrão e recuperação pelo `.json.tmp` (restaura o principal), `gravarJson<T>` atômico com fsync e plano B quando o rename falha, `ErroArquivoJson`. A unificação com `aparelho.ts`/`registro-cliente.ts` ficou anotada no cabeçalho. Feita por Claude Code (Sonnet 5.5 · herdr sn1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro; conferência por `node` numa pasta temporária real: 7 casos (ausente → padrão, gravar e reler sem `.tmp`, recuperação com principal corrompido ou ausente, erro sem `.tmp` bom, rename falhando, valor não serializável). Líder rodou o typecheck.

### CLONE.3.5 — Repositório de projetos

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — 1 arquivo de acesso a dados · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.3.1, CLONE.3.4
- **Descrição:** `apps-cloned/chaos-code/src/main/projeto/projeto.repositorio.ts`: listar, buscar, salvar e remover projetos locais.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.3.5)` — `apps-cloned/chaos-code/src/main/projeto/projeto.repositorio.ts`: `RepositorioProjetos` (listar, buscar, salvar inserindo ou substituindo na mesma posição, remover só do registro) sobre `projects.json` com `lerJson`/`gravarJson`, ID validado e fila interna para gravações simultâneas. Feita por Claude Code (Sonnet 5.5 · herdr sn1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro; conferência por `node` numa pasta temporária real: vazio, salvar 2, atualizar, buscar, IDs inválidos, remover, reler do disco, 3 gravações simultâneas preservadas.

### CLONE.3.6 — Serviço de projetos (`project::manager`)

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — regra de negócio em 1 arquivo · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.3.5
- **Descrição:** `apps-cloned/chaos-code/src/main/projeto/projeto.servico.ts`: criar, abrir, renomear e projeto ativo, recebendo o repositório por parâmetro.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.3.6)` — `apps-cloned/chaos-code/src/main/projeto/projeto.servico.ts`: `ServicoProjetos` (criar com pasta e registro, listar, abrir, renomear, remover apagando a pasta só dentro de `<dados>\projects`, projeto ativo com ouvintes), repositório e pastas injetados. ID novo é UUID: o prefixo `chaos-code-project-` é só *inferido* no inventário. Feita por Claude Code (Sonnet 5.5 · herdr sn1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro; conferência por `node` numa pasta temporária real: criar 2, renomear, eventos do ativo, remover (só a pasta certa some), inexistente → false, IDs `../x`/`..`/vazio recusados, erros claros. Líder rodou o typecheck.

### CLONE.3.7 — Canais IPC de projetos

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — liga 3–4 arquivos já existentes · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.3.6
- **Descrição:** canais em `src/compartilhado/constantes.ts` (`CANAIS_IPC`), tratadores em `src/main/canais.ts`, exposição em `src/preload/preload.ts` e tipos em `src/renderer/global.d.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.3.7)` — canais IPC de projetos e o **molde dos próximos canais**: `CANAIS_IPC` (`projetos:*` + evento `projetos:ativo-mudou`), `src/main/ipc/ipc-comum.ts` (`registrarCanalSeguro`, erros como `{ erro }` sem pilha, `exigirTexto`/`exigirObjeto`), `tipos-ipc.ts` e `tipos-ipc-projetos.ts`, `projeto.canais.ts`, `canais.ts` com `ContextoCanais`, `principal.ts` montando repositório + serviço com a pasta de dados real, `preload.ts` e `global.d.ts` somando `ApiProjetos`. Receita: 1) nomes em `CANAIS_IPC`; 2) `tipos-ipc-<modulo>.ts`; 3) `<modulo>.canais.ts` com `registrarCanalSeguro`; 4) campo em `ContextoCanais` + 1 linha em `canais.ts` e serviço em `montarContextoCanais()`; 5) bloco no `preload.ts` e `& Api<Modulo>` em `ApiExposta` e no `global.d.ts`. Feita por Claude Code (Sonnet 5.5 · herdr sn1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` ok e `node --check` nos 3 arquivos de `dist/` (executor e líder); preload empacotado só com `require("electron")`; conferência por `node` com ipc falso: 7 canais, operações, entradas erradas → `{ erro }`, evento a cada mudança do ativo. O Electron não foi aberto.

### CLONE.4 — Login OAuth e tokens cifrados
- **JEV-AI-SUGGESTION:** NAO

**Próximo passo:** — (dividida em CLONE.4.1, CLONE.4.2, CLONE.4.3, CLONE.4.4, CLONE.4.5, CLONE.4.6, CLONE.4.7, CLONE.4.8, CLONE.4.9, CLONE.4.10, CLONE.4.11, CLONE.4.12; cada uma tem seção própria abaixo)

### CLONE.4.1 — Definir o servidor do clone

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — decisão do usuário · **Modelo:** Usuário (não é tarefa de IA)
- **Depende de:** Nenhuma
- **Descrição:** o usuário diz o endereço do servidor e o `client_id`; a IA grava em `src/compartilhado/constantes.ts` e nas Decisões desta etapa.
- **Critérios de Aceitação:** endereço definitivo registrado.
- **Entrega:** commit `feat(CLONE.4.1)` · **Verificação:** decisão do usuário registrada nas
  Decisões; `URL_SERVIDOR_PADRAO` já era `http://localhost:3000` (só o comentário mudou);
  `npm run typecheck` ok. O servidor em si é a tarefa SERVIDOR (ETAPA-007).

### CLONE.4.2 — Tipos e constantes do OAuth

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — sem lógica, mas é de login (sobe 1 nível) · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.1.5, CLONE.4.1
- **Descrição:** rotas, escopos e tipos de token em `apps-cloned/chaos-code/src/compartilhado/tipos-login.ts` e nas constantes.
- **Critérios de Aceitação:** typecheck ok.
- **Entrega:** commit `feat(CLONE.4.2)` — `apps-cloned/chaos-code/src/compartilhado/tipos-login.ts` (credenciais do cliente, tokens guardados, envelope cifrado, callback, 5 campos `device_*`, estado do login; reexporta os tipos de registro/token/revogação de `tipos-api.ts`) e bloco "Login OAuth" em `src/compartilhado/constantes.ts` (rotas, escopo, S256, `127.0.0.1:0/callback`, cliente público, nomes dos arquivos). Feita por Claude Code (Sonnet 5.5 · herdr sn1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` sem erro (executor e líder); 0 linhas acima de 100; líder conferiu que o bloco só acrescenta e reaproveita `URL_SERVIDOR_PADRAO`.

### CLONE.4.3 — Gerador PKCE

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — segurança (criptografia) · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.4.2
- **Descrição:** `apps-cloned/chaos-code/src/main/login/pkce.ts`: `code_verifier`, `code_challenge` S256 e `state`.
- **Critérios de Aceitação:** typecheck e build ok; conferir com o exemplo da RFC 7636 por `node`.
- **Entrega:** commit `feat(CLONE.4.3)` — `apps-cloned/chaos-code/src/main/login/pkce.ts` (verificador de 32 bytes em base64url = 43 caracteres *(inferido)*, validação RFC 7636 §4.1, desafio S256, `state` aleatório, comparação em tempo constante, fonte aleatória injetável) e tipos `MetodoPkce`/`ParametrosPkce` acrescentados em `tipos-login.ts`. Feita por Claude Code (Opus 5.5 · herdr op2; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` ok; módulo empacotado e conferido por `node` com o exemplo do Apêndice B da RFC 7636 (verifier `dBjftJeZ…` → challenge `E9Melhoa…`; a ordem do líder tinha um erro de digitação, `E9Melhoe`, apontado pelo executor). Líder rodou o typecheck.

### CLONE.4.4 — Cofre de tokens (`safeStorage`)

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — segredos · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.3.4, CLONE.4.2
- **Descrição:** `apps-cloned/chaos-code/src/main/login/cofre-tokens.ts`: gravar, ler e apagar tokens cifrados.
- **Critérios de Aceitação:** typecheck e build ok; nada em texto puro no disco.
- **Entrega:** commit `feat(CLONE.4.4)` — `apps-cloned/chaos-code/src/main/login/cofre-tokens.ts`: `CifradorSeguro` injetado e `criarCifradorElectron(safeStorage)` (sem importar o Electron; `basic_text` no Linux conta como indisponível), cofre com `gravar` (confere tokens e cifragem antes de tocar no disco; sem cifragem → erro e nenhum arquivo), `ler` (nunca lança; envelope inválido ou texto puro → null + aviso sem tokens) e `apagar` (arquivo e `.tmp`); envelope `{ v: 1, data }` com gravação atômica. Feita por Claude Code (Opus 5.5 · herdr op2; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` ok; módulo empacotado à parte; conferência por `node` com `safeStorage` falso (AES-256-GCM, chave só no script): o arquivo no disco não contém os tokens, ler devolve igual, apagar remove arquivo e `.tmp`, cifragem indisponível → erro sem arquivo, arquivo corrompido → sem tokens. Líder rodou o typecheck.

### CLONE.4.5 — Identificação do aparelho

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — dado sensível do aparelho · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.1.5
- **Descrição:** `apps-cloned/chaos-code/src/main/login/aparelho.ts`: MAC (`device_mac_address`) como o original manda.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.4.5)` — `apps-cloned/chaos-code/src/main/login/aparelho.ts`: `device_id.json` (lê, recupera do `.tmp`, grava atômico com 2 espaços, UUID v4), MAC do primeiro adaptador não interno em hexadecimal maiúsculo com `:` *(inferido)*, `device_os_info` = `windows x86_64` e os 5 campos `device_*`; dependências injetadas (arquivos, sistema, UUID). Feita por Claude Code (Opus 5.5 · herdr op2; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` ok; esbuild do módulo isolado ok; conferência no terminal numa pasta temporária (cria, relê o mesmo UUID, sem sobra de `.tmp`, formatação do MAC). Líder rodou o typecheck. Em aberto: regra exata do MAC no original; em qual pedido os campos vão (CLONE.4.6/4.8/4.11); nome do arquivo repetido em `constantes.ts` e no módulo (unificar na CLONE.4.11).

### CLONE.4.6 — Registro do cliente (`/api/oauth/register`)

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — login · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.4.2
- **Descrição:** `apps-cloned/chaos-code/src/main/login/registro-cliente.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.4.6)` — `apps-cloned/chaos-code/src/main/login/registro-cliente.ts` (registro dinâmico do cliente público em `/api/oauth/register`, leitura e gravação atômica do `oauth_client.json`, reaproveita o cliente quando o `redirect_uri` bate e registra de novo quando não bate; erros claros com a resposta do servidor; dependências injetadas) e `response_types?` acrescentado em `PedidoRegistroCliente` (`tipos-api.ts`). Feita por Claude Code (Opus 5.5 · herdr op3; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` ok (executor; typecheck também pelo líder); módulo empacotado e conferido por `node` com `fetch` falso e pasta temporária: registra e grava, reaproveita, registra de novo com outro redirect, sem sobra de `.tmp`, erro 400 e servidor fora do ar tratados. Em aberto: complemento real do `client_name` (usado o nome do computador, *inferido*).

### CLONE.4.7 — Autorização no navegador do sistema + callback local

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — login · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.4.3, CLONE.4.6
- **Descrição:** `apps-cloned/chaos-code/src/main/login/autorizacao.ts`: abrir `shell.openExternal`, servidor de callback em loopback, conferir `state`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.4.7)` — `apps-cloned/chaos-code/src/main/login/autorizacao.ts`: servidor de callback em `127.0.0.1:0/callback` com tempo limite, URL de autorização com os 7 parâmetros (PKCE S256 e `state`), abertura do navegador injetada (`shell.openExternal` na CLONE.4.11), conferência do `state` em tempo constante, página curta de sucesso/erro e erros `state_invalido`/`erro_oauth`/`tempo_esgotado`. Feita por Claude Code (Opus 5.5 · herdr op3; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` ok (executor; typecheck também pelo líder); conferência por `node` com `fetch` falso e navegador falso (`http.get` local, nenhum navegador aberto): caso certo, `state` errado, erro OAuth e tempo esgotado, sem servidor aberto depois. Em aberto: tempo limite e página exata do original.

### CLONE.4.8 — Troca do código e renovação do token (`/api/oauth/token`)

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — login · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.4.4, CLONE.4.7
- **Descrição:** `apps-cloned/chaos-code/src/main/login/token.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.4.8)` — `apps-cloned/chaos-code/src/main/login/token.ts`: troca do código (JSON com 5 campos em `/api/oauth/token`), renovação (guarda o refresh novo ou mantém o antigo), `expires_at` com relógio injetável, gravação no cofre, `obterTokenAcessoValido` que renova antes da margem e junta chamadas simultâneas num pedido só; `invalid_grant` na renovação → sessão perdida (apaga o cofre e avisa), rede/500 não apagam. Feita por Claude Code (Opus 5.5 · herdr op2; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` ok; módulo empacotado à parte; conferência por `node` com `fetch` falso, cofre em memória e relógio fixo: 9 grupos de casos (troca, renovação com e sem refresh novo, longe de vencer, perto de vencer com 2 chamadas → 1 pedido, `invalid_grant`, rede fora, 500, resposta inválida, sem sessão). Líder rodou o typecheck.

### CLONE.4.9 — Sair e revogar (`/api/oauth/revoke`)

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — login · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.4.8
- **Descrição:** `apps-cloned/chaos-code/src/main/login/revogacao.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.4.9)` — `apps-cloned/chaos-code/src/main/login/revogacao.ts`: `sair()` revoga em `/api/oauth/revoke` (refresh token; sem ele, o access token), tempo limite de 10 s *(escolha do clone)*, chamadas simultâneas viram um pedido só, cofre apagado sempre (mesmo com 500, rede fora ou erro inesperado), nenhum token no log. *(Inferido)*: qual token revogar, seguir no logout quando a revogação falha e corpo em JSON. Feita por Claude Code (Opus 5.5 · herdr op2; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro (executor e líder); conferência por Node com fetch falso e cofre em memória (8 casos: sucesso, 500, rede fora, tempo esgotado, sem sessão, sem refresh token, simultâneas, erro inesperado). Ligar no `ProvedorLogin.sair()` fica para a CLONE.4.11.

### CLONE.4.10 — Modo simulado (`auth::mock`)

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — login falso para desenvolvimento · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.4.2
- **Descrição:** `apps-cloned/chaos-code/src/main/login/login-simulado.ts` com o mesmo contrato do login real.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.4.10)` — `apps-cloned/chaos-code/src/main/login/contrato.ts` (interface `ProvedorLogin`: entrar, sair, renovar, obterEstado, obterTokenAcesso) e `login-simulado.ts` (`LoginSimulado`: tokens `mock_access_token_<id>` e `mock_refresh_token`, validade 1 h, estado em memória, relógio e id injetáveis). Feita por Claude Code (Sonnet 5.5 · herdr sn1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro (executor); typecheck pelo líder. Em aberto: validade de 1 h é escolha do clone; ligar o modo simulado fica para a CLONE.4.11.

### CLONE.4.11 — Serviço de login (junta as peças)

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — login, várias peças · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.4.5, CLONE.4.8, CLONE.4.9, CLONE.4.10
- **Descrição:** `apps-cloned/chaos-code/src/main/login/login.servico.ts`: entrar, sair, usuário atual, escolher real ou simulado.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.4.11)` — `apps-cloned/chaos-code/src/main/login/login.servico.ts` (`ServicoLogin` implementa `ProvedorLogin`: entrar em 10 passos, logins simultâneos viram um só, falha volta ao estado anterior, `invalid_grant` → `sessao_expirada`, tokens sem cliente salvo apagados na abertura; `criarServicoLogin` escolhe real ou simulado por `CHAOS_CLONE_LOGIN_SIMULADO=1`) e `login.dependencias.ts` (`criarDependenciasLoginReal`, sem importar o Electron; plataforma conferida com 10 s); `token.ts` manda os 5 `device_*` na troca *(inferido)*; `aparelho.ts` usa `ARQUIVO_IDENTIFICACAO_APARELHO`. Feita por Claude Code (Opus 5.5 · herdr op2; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro com todas as entregas juntas (líder, 07:0x); conferências do executor: 16 grupos com dependências falsas e ponta a ponta (callback real em 127.0.0.1, `safeStorage` AES-GCM falso, nada em texto puro, sair revoga e apaga). Ligar ao `principal.ts`/IPC fica para a CLONE.4.12.

### CLONE.4.12 — Canais IPC de login

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — login exposto à interface · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.4.11
- **Descrição:** canais em `src/compartilhado/constantes.ts` (`CANAIS_IPC`), tratadores em `src/main/canais.ts`, exposição em `src/preload/preload.ts` e tipos em `src/renderer/global.d.ts`; o token nunca vai para o renderer.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.4.12)` (2026-11-01) · **Verificação:** typecheck e build ok; teste node com ipc/serviço falsos: token não vaza (ServicoLoginCanais sem obterTokenAcesso, copiarEstadoSeguro). Pendência: montar o serviço no principal.ts (servicoLogin opcional em ContextoCanais)

### CLONE.4.13 — Montar o serviço de login no `principal.ts`

**Próximo passo:** classificar pelo Jev e reservar.

- **JEV-AI-SUGGESTION:** NAO
- **Depende de:** CLONE.4.12, CLONE.5.7 (5.7 mexe nos mesmos arquivos de ligação)
- **Descrição:** criada pelo líder em 2026-11-01 a partir da pendência da CLONE.4.12. Em `src/main/principal.ts`, montar `criarServicoLogin({ modoSimulado: deveUsarLoginSimulado(process.env), criarDependenciasReais: () => criarDependenciasLoginReal(...), registrarLog })`, passar `servicoLogin` no `montarContextoCanais()`, chamar `servicoLogin.inicializar()` ao abrir o app e tornar `servicoLogin` obrigatório em `ContextoCanais` (`src/main/canais.ts`). Opcional: mover `ApiLogin` para `src/compartilhado/tipos-ipc-login.ts` (receita da CLONE.3.7).
- **Critérios de Aceitação:** typecheck e build ok; token continua fora do renderer.
### CLONE.5 — Cliente da API (servidor próprio)
- **JEV-AI-SUGGESTION:** NAO

**Próximo passo:** — (dividida em CLONE.5.1, CLONE.5.2, CLONE.5.3, CLONE.5.4, CLONE.5.5, CLONE.5.6, CLONE.5.7; cada uma tem seção própria abaixo)

### CLONE.5.1 — Tipos das respostas da API

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — só tipos copiados do inventário · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** CLONE.1.3
- **Descrição:** `apps-cloned/chaos-code/src/compartilhado/tipos-api.ts`.
- **Critérios de Aceitação:** typecheck ok.
- **Entrega:** commit `feat(CLONE.5.1)` — `apps-cloned/chaos-code/src/compartilhado/tipos-api.ts` (335 linhas: pedidos e respostas de OAuth, projetos, ferramentas MCP, wiki, tarefas e imagens; reaproveita `tipos-agentes.ts`, `tipos-imagem.ts` e `LatestJson`). Feita por Claude Code (Haiku 5.5 · herdr hk1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` sem erro (executor e líder); 0 linhas acima de 100. Em aberto: campos *(inferido)*, 15º campo de `ApiProjectImage`, 2º campo de `ApiProjectsResponse`, unificar `ImagemProjeto` × `ImagemProjetoApi` quando o Ghidra confirmar.

### CLONE.5.2 — Cliente HTTP base com token

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — lógica de rede · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.4.11, CLONE.5.1
- **Descrição:** `apps-cloned/chaos-code/src/main/api/cliente-http.ts`: põe o token, renova uma vez no 401, erros padronizados.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.5.2)` — `apps-cloned/chaos-code/src/main/api/cliente-http.ts`: `criarClienteHttp` com `requisitar<T>({ metodo, caminho, corpo? })` (devolve o envelope `{ success, data, meta }` para as APIs 5.3–5.6 tiparem com `RespostaApi`), `Authorization: Bearer` e JSON, tempo limite `TEMPO_LIMITE_PEDIDO_MS` = 30 s *(escolha do clone)*, 401 → `login.renovar()` uma vez e repete; `ErroApi` com `tipo` (`http`, `rede`, `tempo_esgotado`, `resposta_invalida`, `sem_sessao`), `status` e mensagens por status do `api.md`; token nunca em mensagem ou log; fetch, URL e login (`Pick<ProvedorLogin, 'obterTokenAcesso' | 'renovar'>`) injetados. Feita por Claude Code (Sonnet 5.5 · executor-medio; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro (executor e líder); nenhuma linha acima de 100 (líder); conferência por Node do executor com fetch falso (sucesso, 401 → renova e repete com o token novo, 500, tempo esgotado, erro de rede sem vazar o token).

### CLONE.5.3 — API de projetos

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — 1 arquivo · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.5.2
- **Descrição:** `apps-cloned/chaos-code/src/main/api/projetos.api.ts` (`/api/oauth/user/projects`, `/api/projects/...`).
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.5.3)` (2026-11-01) · **Verificação:** tsc --noEmit sem erros em projetos.api.ts; diff só com o arquivo (conferido pelo líder Opus 5.5); wiki/sync/ack ficou de fora (método HTTP não comprovado)

### CLONE.5.4 — API de tarefas

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — 1 arquivo · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.5.2
- **Descrição:** `apps-cloned/chaos-code/src/main/api/tarefas.api.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.5.4)` (2026-11-01) · **Verificação:** tsc --noEmit sem erros em src/main/api/; diff só com tarefas.api.ts (conferido pelo líder Opus 5.5)

### CLONE.5.5 — API de imagens

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — 1 arquivo · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.5.2
- **Descrição:** `apps-cloned/chaos-code/src/main/api/imagens.api.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.5.5)` (2026-11-01) · **Verificação:** tsc --noEmit sem erros em src/main/api/; diff só com imagens.api.ts (conferido pelo líder Opus 5.5)

### CLONE.5.6 — API de modelos de agente

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — 1 arquivo · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.5.2
- **Descrição:** `apps-cloned/chaos-code/src/main/api/modelos-agente.api.ts` (`/api/client/agent-templates`).
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.5.6)` (2026-11-01) · **Verificação:** tsc --noEmit sem erros em src/main/api/; diff só com modelos-agente.api.ts (conferido pelo líder Opus 5.5)

### CLONE.5.7 — Canais IPC da API

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — liga arquivos existentes · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.5.3, CLONE.5.4, CLONE.5.5, CLONE.5.6
- **Descrição:** canais em `src/compartilhado/constantes.ts` (`CANAIS_IPC`), tratadores em `src/main/canais.ts`, exposição em `src/preload/preload.ts` e tipos em `src/renderer/global.d.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.5.7)` (2026-11-01) · **Verificação:** typecheck e build ok; canais api:<grupo>:<metodo> via registrarCanalSeguro, token fica no main. Pendência: principal.ts montar as 4 APIs como apisPlataforma (CLONE.4.13)

### CLONE.6 — Vetores (divisor, embeddings, índice)
- **JEV-AI-SUGGESTION:** NAO

**Próximo passo:** — (dividida em CLONE.6.1, CLONE.6.2, CLONE.6.3, CLONE.6.4, CLONE.6.5, CLONE.6.6, CLONE.6.7, CLONE.6.8, CLONE.6.9, CLONE.6.10, CLONE.6.11, CLONE.6.12; cada uma tem seção própria abaixo)

### CLONE.6.1 — Tipos de pedaço, vetor e resultado

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — só tipos · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** CLONE.1.6
- **Descrição:** `apps-cloned/chaos-code/src/compartilhado/tipos-vetores.ts`.
- **Critérios de Aceitação:** typecheck ok.
- **Entrega:** commit `feat(CLONE.6.1)` — `apps-cloned/chaos-code/src/compartilhado/tipos-vetores.ts` (pedaço e `ChunkMetadata`, `VectorEntry`, `VectorIndex`/`HnswIndex`, modos de embedding, resultado de busca, `RagPipelineConfig` e fases do sync). Feita por Claude Code (Haiku 5.5 · herdr hk1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` sem erro (executor e líder); só tipos, sem constantes numéricas. Em aberto: nomes provisórios (`Pedaco`, `ResultadoBusca`, `max_async`) e campos *(inferido)* listados no relatório.

### CLONE.6.2 — Constantes de vetores

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — números do inventário · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** CLONE.1.6
- **Descrição:** tamanho e sobreposição dos pedaços, modelos e dimensões nas constantes.
- **Critérios de Aceitação:** typecheck ok.
- **Entrega:** commit `feat(CLONE.6.2)` — `apps-cloned/chaos-code/src/main/vetores/constantes.ts` (pedaços 1500/0,1/10 MiB/10.000; modelos, dimensões e endpoints por provedor; lote 150, concorrência 24, RPM 80 × 80%, cache 1000, 429 → 3 tentativas com 5×2^n s; HNSW 1000/16/200; extração; padrões do `RagPipelineConfig`; 5 artigos no sync), cada uma com a origem no JSDoc. Feita por Claude Code (Haiku 5.5 · herdr hk1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` sem erro (executor e líder); números conferidos contra o inventário pelo executor e por amostra pelo líder. Em aberto: unidade do tamanho do pedaço (bytes ou caracteres).

### CLONE.6.3 — Divisor de texto (chunker)

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — função pura com lógica · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.6.1, CLONE.6.2
- **Descrição:** `apps-cloned/chaos-code/src/main/vetores/divisor.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.6.3)` — `apps-cloned/chaos-code/src/main/vetores/divisor.ts`: divide por cabeçalhos `#` (ignora blocos de código) e parágrafos, até 1500 caracteres com 150 de sobreposição, trunca em 10 MiB sem partir caractere, para em 10.000 pedaços, preenche `ChunkMetadata`. Tamanho em caracteres *(inferido, comentado)*. Feita por Claude Code (Sonnet 5.5 · herdr sn1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro; conferência por `node`: 14 pedaços no exemplo, maior 1500, sobreposição igual entre vizinhos, entrada de 11 MiB truncada para 10.485.760 bytes, 12.000 parágrafos → 10.000 pedaços, texto vazio → 0. Líder rodou o typecheck.

### CLONE.6.4 — Similaridade de cosseno

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — função pura · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.6.1
- **Descrição:** `apps-cloned/chaos-code/src/main/vetores/similaridade.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.6.4)` — `apps-cloned/chaos-code/src/main/vetores/similaridade.ts` (norma, produto escalar, cosseno com erro em dimensões diferentes e 0 na norma zero, top-k e seleção MMR com `LAMBDA_MMR`). Feita por Claude Code (Sonnet 5.5 · herdr sn1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro (executor); typecheck e leitura das funções pelo líder.

### CLONE.6.5 — Contrato do provedor de embedding + fábrica

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — interface e mapa · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.6.1
- **Descrição:** `apps-cloned/chaos-code/src/main/vetores/provedor-embedding.ts` (mapa nome → provedor).
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.6.5)` — `apps-cloned/chaos-code/src/main/vetores/provedor-embedding.ts` (interface `ProvedorEmbedding`, fábrica por mapa tipo → construtor com erro claro para modo desconhecido, `ErroLimiteTaxa`, espera por `Retry-After` ou 5×2^n s, novas tentativas com espera injetável, divisão em lotes de 150). Feita por Claude Code (Sonnet 5.5 · herdr sn1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro (executor); typecheck pelo líder. Em aberto: concorrência (24) e RPM (80) ficam para quem orquestrar os provedores (CLONE.6.11).

### CLONE.6.6 — Chaves de API dos provedores (cofre)

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — segredos · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.4.4
- **Descrição:** `apps-cloned/chaos-code/src/main/vetores/chaves-provedores.ts` usando o cofre.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.6.6)` — `apps-cloned/chaos-code/src/main/vetores/chaves-provedores.ts`: cofre das chaves de API em `provider_keys.json` *(escolha do clone; o original guarda em texto puro nos JSON)*, envelope `{ v: 1, data }` cifrado pelo `CifradorSeguro` do cofre de tokens, 8 ids (modos de embedding, chave própria de embedding de OpenRouter/Custom, imagem OpenAI/Gemini), fila para gravações simultâneas, sem cifragem → não grava; `separarChaves*`/`preencherChaves*` para `embedder_config.json` e `image_api_config.json` (disco com chave vazia; cofre vazio usa a do arquivo) e `mascararChave`. `ARQUIVO_CHAVES_PROVEDORES` em `constantes.ts` e `chavesProvedores` em `caminhos.ts`. Feita por Claude Code (Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro; conferência por Node (esbuild na pasta de rascunho, cifrador XOR falso, arquivo real): 2 gravações simultâneas guardadas, nada em texto puro no disco, separar/preencher do embedder Custom e da imagem Gemini, remover, máscara, sem cifragem → `ErroCofreChaves` e leitura null com aviso, id desconhecido → erro, arquivo ilegível → null, `apagarTudo`.

### CLONE.6.7 — Provedor OpenAI

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — 1 arquivo · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.6.5, CLONE.6.6
- **Descrição:** `apps-cloned/chaos-code/src/main/vetores/provedores/openai.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.6.7)` — `apps-cloned/chaos-code/src/main/vetores/provedores/openai.ts`: provedor `Api` (OpenAI-compatível) em `/v1/embeddings`, `dimensions` só nos `text-embedding-3*`, ordem por `index`, 429 → `ErroLimiteTaxa` com `Retry-After`, validações (chave, 1–4096 dimensões, texto vazio), `registrarProvedorOpenAi(fabrica, buscar)`; fetch injetado. Feita por Claude Code (Sonnet 5.5 · herdr sn1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro (executor e líder); conferência por Node com fetch falso (429 → espera e repete, URL normalizada, cabeçalho e corpo, erros).

### CLONE.6.8 — Provedor Gemini

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — 1 arquivo · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.6.5, CLONE.6.6
- **Descrição:** `apps-cloned/chaos-code/src/main/vetores/provedores/gemini.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.6.8)` — `apps-cloned/chaos-code/src/main/vetores/provedores/gemini.ts`: provedor `Gemini` (`embedContent`/lote, cabeçalho `x-goog-api-key`), aceita `embedding` ou `embeddings` na resposta *(formato não confirmado no inventário)*, 429 → `ErroLimiteTaxa`; fetch injetado. Feita por Claude Code (Sonnet 5.5 · herdr sn2; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro (executor e líder); conferência por Node com fetch falso (texto único, lote, 429 com Retry-After, entrada vazia, 500, chave vazia). Registro na fábrica fica para a CLONE.6.11.

### CLONE.6.9 — Provedor OpenRouter

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — 1 arquivo · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.6.5, CLONE.6.6
- **Descrição:** `apps-cloned/chaos-code/src/main/vetores/provedores/openrouter.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.6.9)` — `apps-cloned/chaos-code/src/main/vetores/provedores/openrouter.ts`: provedor `OpenRouter` em `<embedding_endpoint>/v1/embeddings` (vazio → padrão), `embedding_api_key` com reserva na `api_key`, corpo no formato OpenAI *(inferido)*, ordem por `index`, 429 → `ErroLimiteTaxa`; fetch injetado. Feita por Claude Code (Sonnet 5.5 · herdr sn3; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro (executor e líder); conferência por Node com fetch falso (ordem, URL, Bearer, 429). Registro na fábrica fica para a CLONE.6.11.

### CLONE.6.10 — Índice vetorial (gravar, carregar, buscar)

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — formato do original + busca · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.3.4, CLONE.6.4
- **Descrição:** `apps-cloned/chaos-code/src/main/vetores/indice.ts` no formato do inventário.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.6.10)` — `apps-cloned/chaos-code/src/main/vetores/indice.ts` e `apps-cloned/chaos-code/src/main/vetores/hnsw.ts`: índice com `vectors.json` (só `entries`, campos `id`, `text`, `embedding`, `source_type`, `metadata`), busca linear e HNSW (1000/16/200; efSearch 50, camada 0 com 2×M e vizinhos sem regra de diversidade *(inferidos)*), HNSW refeito ao carregar; `EntradaIndice` alinhada ao inventário em `tipos-vetores.ts` e 2 constantes novas em `vetores/constantes.ts`. Feita por Claude Code (Opus 5.5 · herdr op5; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run build` ok; typecheck sem erro nos arquivos da subtarefa (o único erro na hora, em `principal.ts`, vem dos canais IPC em andamento da 11.4/12.7); conferência por Node do executor (24/24: busca linear, HNSW com 3000 vetores, recall 99,3% contra a linear, gravação e recarga). Em aberto: inventários discordam no tipo de `overlap_with_prev/next` e no campo `lambda` do HNSW; filtro por `source_type` fica para a CLONE.6.11.

### CLONE.6.11 — Serviço de indexação do projeto

**Próximo passo:** nenhum — concluída (Devin (SWE-2 High Lightning), 2026-11-01, retomada do executor Claude Code).

- **Nível:** PESADO — liga várias peças · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.3.6, CLONE.6.3, CLONE.6.7, CLONE.6.8, CLONE.6.9, CLONE.6.10
- **Descrição:** `apps-cloned/chaos-code/src/main/vetores/indexacao.servico.ts`: ler arquivos, dividir, embutir, gravar, buscar.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** `apps-cloned/chaos-code/src/main/vetores/indexacao.servico.ts`: pipeline de indexação (fetching→chunking→embedding→saving) com lotes, RPM e reintentativas; incremental por versão de documento; índice HNSW por projeto; `buscar` com k 1–100.
- **Verificação:** `npm run typecheck` e `npm run build` ok (Devin).

### CLONE.6.12 — Canais IPC de vetores

**Próximo passo:** nenhum — concluída (Devin (SWE-2 High Lightning), 2026-11-01).

- **Nível:** MEDIO — liga arquivos existentes · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.6.11
- **Descrição:** canais em `src/compartilhado/constantes.ts` (`CANAIS_IPC`), tratadores em `src/main/canais.ts`, exposição em `src/preload/preload.ts` e tipos em `src/renderer/global.d.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** `vetores.canais.ts` + canais em `constantes.ts`, tipos em `tipos-ipc-vetores.ts`, preload e `global.d.ts`: `vetores:indexar` (progresso por `vetores:progresso`), `cancelar` (AbortController por projeto), `buscar` (k 1-100), `obter-status-rag` e `alternar-rag` gravando em `projects.json`; `ServicoIndexacao` montado no `principal.ts`.
- **Verificação:** `npm run typecheck` e `npm run build` ok (Devin).
### CLONE.7 — Grafo de conhecimento
- **JEV-AI-SUGGESTION:** NAO

**Próximo passo:** — (dividida em CLONE.7.1, CLONE.7.2, CLONE.7.3, CLONE.7.4, CLONE.7.5, CLONE.7.6, CLONE.7.7, CLONE.7.8, CLONE.7.9, CLONE.7.10, CLONE.7.11; cada uma tem seção própria abaixo)

### CLONE.7.1 — Tipos do grafo

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — só tipos · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** CLONE.1.6
- **Descrição:** entidade, relação, comunidade em `apps-cloned/chaos-code/src/compartilhado/tipos-grafo.ts`.
- **Critérios de Aceitação:** typecheck ok.
- **Entrega:** commit `feat(CLONE.7.1)` — `apps-cloned/chaos-code/src/compartilhado/tipos-grafo.ts` (entidade, relação, comunidade, `LlmEntity`/`LlmRelation`, estratégia de extração e arquivos `graph.json`/`entities.json`/`communities.json`). Feita por Claude Code (Haiku 5.5 · herdr hk1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` sem erro (executor e líder). Em aberto: 11º campo de `Entity`, formato exato dos arquivos do grafo e campos de `LlmEntity`/`LlmRelation` (tirados do prompt).

### CLONE.7.2 — Prompts do grafo em constantes

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — copiar textos · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** CLONE.1.8
- **Descrição:** `apps-cloned/chaos-code/src/main/grafo/prompts.ts` com os textos do inventário.
- **Critérios de Aceitação:** typecheck ok.
- **Anotação:** reservada por Claude Code (Opus 5.5) (nuvem · main) às 2026-10-17 23:17 e
  liberada às 23:30 a pedido do usuário ("Libere a reserva"), sem nenhum arquivo alterado.
- **Entrega:** commit `feat(CLONE.7.2)` — `apps-cloned/chaos-code/src/main/grafo/prompts.ts` (seção 1 do inventário: 3 mensagens de sistema, 4 montagens de pedido e textos do resumo de comunidade). Feita por Claude Code (Haiku 5.5 · herdr hk1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` sem erro (executor e líder); 0 linhas acima de 100 caracteres; executor compilou o módulo e comparou as strings com o inventário (todas iguais). Em aberto: fechamento do bloco de código no prompt 1.7 e ordem dos furos (inferida no inventário).

### CLONE.7.3 — Cliente de LLM para o grafo

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — 1 arquivo de rede · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.6.6
- **Descrição:** `apps-cloned/chaos-code/src/main/grafo/cliente-llm.ts` (provedor configurável).
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.7.3)` — `apps-cloned/chaos-code/src/main/grafo/cliente-llm.ts`: chat pelos 4 modos do `embedder_config.json` (Api, Gemini com `systemInstruction` *(inferido)*, OpenRouter, Custom com cabeçalhos extras), chaves por `preencherChavesEmbedder`, oferece `completarLlm` para a reordenação; erros viram `ErroClienteLlm` sem ecoar o corpo (pode conter a chave); fetch injetado. Feita por Claude Code (Sonnet 5.5 · herdr sn4; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro (executor e líder); conferência por Node com fetch e cofre falsos (4 provedores e 3 erros). Sem temperatura e limite de tokens (não estão no inventário).

### CLONE.7.4 — Armazenamento do grafo

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — 1 arquivo de dados · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.3.4, CLONE.7.1
- **Descrição:** `apps-cloned/chaos-code/src/main/grafo/grafo.repositorio.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.7.4)` — `apps-cloned/chaos-code/src/main/grafo/grafo.repositorio.ts`: carregar/gravar entidades, relações e comunidades do projeto (ausente → vazio), juntar sem duplicar (nome/alias sem acento e minúsculo; relação por origem+destino+tipo, peso maior e evidências somadas) e remover o que vem de um artigo; funções puras exportadas. Regras *(inferidas)* no cabeçalho. Feita por Claude Code (Sonnet 5.5 · herdr sn2; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro; conferência por `node` numa pasta temporária real: ausente → vazio, `Pix/PIX/pix` sem duplicar, recarregar do disco, remover artigo, comunidades gravam e leem. Líder rodou o typecheck.

### CLONE.7.5 — Extração de entidades e relações

**Próximo passo:** nenhum — concluída (Devin (SWE-2 High Lightning), 2026-11-01, retomada do executor Claude Code).

- **Nível:** PESADO — LLM + junção de duplicados · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.7.2, CLONE.7.3, CLONE.7.4
- **Descrição:** `apps-cloned/chaos-code/src/main/grafo/extracao.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** `apps-cloned/chaos-code/src/main/grafo/extracao.ts`: estratégias regex/llm/hybrid, fallback regex com aviso, 50 entidades e 100 relações por pedaço, 12 pedaços em paralelo, junção de duplicados pelo repositório.
- **Verificação:** `npm run typecheck` e `npm run build` ok (Devin).

### CLONE.7.6 — Detecção de comunidades

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — algoritmo (Louvain/Leiden) · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.7.1
- **Descrição:** `apps-cloned/chaos-code/src/main/grafo/comunidades.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.7.6)` — `apps-cloned/chaos-code/src/main/grafo/comunidades.ts`: grafo ponderado não dirigido (peso mínimo 0,1, laços ignorados), Louvain fase 1 com ordem estável (no original a ordem vem de `HashMap`; aqui determinística de propósito), `GrafoComunidades` com comunidades ordenadas, `entity_to_community`, resumo sem LLM ("Grupo temático contendo: …") e texto para a busca global. Feita por Claude Code (Opus 5.5 · herdr op3; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` ok (executor; typecheck também pelo líder); conferência por `node`: 3 grupos + 1 isolado + pontes de peso 0 e 1 + laço → 4 comunidades certas, resultado idêntico com a entrada em ordem invertida, grafo sem arestas → cada entidade sozinha. Divergência do tipo `Community` (`title` × `keywords`, id numérico) virou a CLONE.7.12.

### CLONE.7.7 — Resumo das comunidades

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — 1 arquivo · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.7.3, CLONE.7.6
- **Descrição:** `apps-cloned/chaos-code/src/main/grafo/resumo-comunidades.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.7.7)` — `apps-cloned/chaos-code/src/main/grafo/resumo-comunidades.ts`: `resumirComunidades` completa a saída de `detectarComunidades` com resumo pelo LLM (4 pedidos simultâneos; falha mantém "Grupo temático contendo: …") e `summary_embedding` em lotes de 150; entrada não é alterada; LLM e embeddings injetados. Feita por Claude Code (Sonnet 5.5 · herdr sn1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro com todas as entregas juntas (líder, 07:0x); conferência por Node do executor com LLM e embeddings falsos.

### CLONE.7.8 — Transformação de consulta

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — 1 arquivo · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.7.2, CLONE.7.3
- **Descrição:** `apps-cloned/chaos-code/src/main/grafo/transformar-consulta.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.7.8)` — `apps-cloned/chaos-code/src/main/grafo/transformar-consulta.ts`: `multi_query` (original primeiro + até 3 variações sem repetidas) e HyDE (busca só com o texto hipotético) *(escolhas do clone)*, LLM injetado; desligado, JSON inválido, erro ou resposta vazia → consulta original. Feita por Claude Code (Sonnet 5.5 · herdr sn4; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro (executor e líder); conferência por Node com LLM falso (5 casos). A CLONE.7.10 confirma as escolhas ao ligar a busca.

### CLONE.7.9 — Reordenação (rerank)

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — 1 arquivo · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.6.4
- **Descrição:** `apps-cloned/chaos-code/src/main/grafo/reordenacao.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.7.9)` — `apps-cloned/chaos-code/src/main/grafo/reordenacao.ts`: rerank pelo LLM (20 candidatos → 10, limite de 5000 ms), cliente do LLM injetado (`completarLlm`); mantém a ordem original se o LLM falhar, demorar, devolver JSON inválido ou um número de notas diferente. Formato da lista `[i] texto` *(inferido)*. Feita por Claude Code (Sonnet 5.5 · herdr sn2; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro (executor e líder); nenhuma linha acima de 100. Sem conferência de execução.

### CLONE.7.10 — Serviço de consulta (grafo + vetores)

**Próximo passo:** —

- **Nível:** PESADO — liga várias peças · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.6.11, CLONE.7.5, CLONE.7.7, CLONE.7.8, CLONE.7.9
- **Descrição:** `apps-cloned/chaos-code/src/main/grafo/consulta.servico.ts`.
- **Critérios de Aceitação:** typecheck e build ok.

### CLONE.7.11 — Canais IPC do grafo

**Próximo passo:** —

- **Nível:** MEDIO — liga arquivos existentes · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.7.10
- **Descrição:** canais em `src/compartilhado/constantes.ts` (`CANAIS_IPC`), tratadores em `src/main/canais.ts`, exposição em `src/preload/preload.ts` e tipos em `src/renderer/global.d.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
### CLONE.8 — Servidor MCP local
- **JEV-AI-SUGGESTION:** NAO

**Próximo passo:** — (dividida em CLONE.8.1, CLONE.8.2, CLONE.8.3, CLONE.8.4, CLONE.8.5, CLONE.8.6, CLONE.8.7, CLONE.8.8, CLONE.8.9, CLONE.8.10; cada uma tem seção própria abaixo)

### CLONE.7.12 — Tipo `Community` igual ao original (`keywords`, id numérico)

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — ajuste de tipo e do campo preenchido · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin) · **Effort:** low
- **Depende de:** CLONE.7.6
- **Descrição:** em `src/compartilhado/tipos-grafo.ts`, `Community` passa a ter os campos do `arquivos-locais.md` (`id`, `entity_ids`, `level`, `summary`, `summary_embedding`, `keywords`), sem `title`; `id` e os valores de `entity_to_community` como número se o inventário confirmar. Ajustar `src/main/grafo/comunidades.ts` só no campo trocado.
- **Critérios de Aceitação:** `npm run typecheck` e `npm run build` ok.
- **Anotação:** criada em 2026-10-18 05:05 por Claude Code (Opus 5.5) (local · main) — líder (C26), a partir do relatório da CLONE.7.6.
- **Entrega:** commit `feat(CLONE.7.12)` — `Comunidade` em `tipos-grafo.ts` com os campos do `arquivos-locais.md` (`id`, `entity_ids`, `level`, `summary`, `summary_embedding`, `keywords`; sem `title`; `id` continua texto porque o inventário mostra `"c_0"`) e `comunidades.ts` preenchendo `keywords` com os 3 primeiros membros *(inferido)*. Feita por Claude Code (Haiku 5.5 · herdr hk1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` sem erro (executor e líder).

### CLONE.8.1 — Lista e schemas das ferramentas MCP

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — copiar do inventário · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** CLONE.1.7
- **Descrição:** `apps-cloned/chaos-code/src/main/mcp/ferramentas-definicoes.ts` (nome, descrição, schema).
- **Critérios de Aceitação:** typecheck ok.
- **Entrega:** commit `feat(CLONE.8.1)` — `apps-cloned/chaos-code/src/main/mcp/ferramentas-definicoes.ts`: tipo `DefinicaoFerramentaMcp` e `FERRAMENTAS_MCP` com as 23 ferramentas do original (nome, descrição curta, `inputSchema` completo e as 4 anotações). Feita por Claude Code (Haiku 5.5 · herdr hk1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` sem erro (executor e líder); executor contou 23 ferramentas com nomes únicos e conferiu as 4 anotações de cada uma contra a tabela do inventário (0 erros). Em aberto: descrições longas, chaves marcadas ‡/† no inventário e `model` × `provider` em `generate_image`.

### CLONE.8.2 — Servidor HTTP em `/mcp/{project_id}`

**Próximo passo:** nenhum — concluída (Devin (SWE-2 High Lightning), 2026-11-01, retomada do executor Claude Code).

- **Nível:** PESADO — servidor de rede · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.3.6
- **Descrição:** `apps-cloned/chaos-code/src/main/mcp/servidor.ts` só em 127.0.0.1 (e WSL quando liberado).
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** `apps-cloned/chaos-code/src/main/mcp/servidor.ts`: HTTP só em 127.0.0.1 (e IP do host p/ WSL quando liberado), POST `/mcp/{id}` JSON-RPC, `/health`, lista de Host/Origin permitidos, limite de corpo 4 MiB.
- **Verificação:** `npm run typecheck` e `npm run build` ok (Devin).

### CLONE.8.3 — Token de sessão `X-MCP-Session-Token`

**Próximo passo:** —

- **Nível:** PESADO — segurança · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.8.2
- **Descrição:** `apps-cloned/chaos-code/src/main/mcp/token-sessao.ts`: gerar, conferir, renovar.
- **Critérios de Aceitação:** typecheck e build ok.

### CLONE.8.4 — Descoberta OAuth (`.well-known`)

**Próximo passo:** —

- **Nível:** PESADO — segurança · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.8.2, CLONE.4.2
- **Descrição:** `apps-cloned/chaos-code/src/main/mcp/descoberta-oauth.ts`.
- **Critérios de Aceitação:** typecheck e build ok.

### CLONE.8.5 — Ferramenta de busca nos vetores

**Próximo passo:** —

- **Nível:** MEDIO — 1 arquivo · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.6.11, CLONE.8.1
- **Descrição:** `apps-cloned/chaos-code/src/main/mcp/ferramentas/busca.ts`.
- **Critérios de Aceitação:** typecheck e build ok.

### CLONE.8.6 — Ferramenta de consulta ao grafo

**Próximo passo:** —

- **Nível:** MEDIO — 1 arquivo · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.7.10, CLONE.8.1
- **Descrição:** `apps-cloned/chaos-code/src/main/mcp/ferramentas/grafo.ts`.
- **Critérios de Aceitação:** typecheck e build ok.

### CLONE.8.7 — Ferramentas de tarefas

**Próximo passo:** —

- **Nível:** MEDIO — 1 arquivo · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.5.4, CLONE.8.1
- **Descrição:** `apps-cloned/chaos-code/src/main/mcp/ferramentas/tarefas.ts`.
- **Critérios de Aceitação:** typecheck e build ok.

### CLONE.8.8 — Ferramentas de projeto

**Próximo passo:** —

- **Nível:** MEDIO — 1 arquivo · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.5.3, CLONE.8.1
- **Descrição:** `apps-cloned/chaos-code/src/main/mcp/ferramentas/projetos.ts`.
- **Critérios de Aceitação:** typecheck e build ok.

### CLONE.8.9 — Roteador MCP (liga ferramentas ao servidor)

**Próximo passo:** —

- **Nível:** PESADO — protocolo MCP · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.8.3, CLONE.8.4, CLONE.8.5, CLONE.8.6, CLONE.8.7, CLONE.8.8
- **Descrição:** `apps-cloned/chaos-code/src/main/mcp/roteador.ts` (`initialize`, `tools/list`, `tools/call`).
- **Critérios de Aceitação:** typecheck e build ok.

### CLONE.8.10 — Canais IPC do MCP (ligar/desligar, porta)

**Próximo passo:** —

- **Nível:** MEDIO — liga arquivos existentes · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.8.9
- **Descrição:** canais em `src/compartilhado/constantes.ts` (`CANAIS_IPC`), tratadores em `src/main/canais.ts`, exposição em `src/preload/preload.ts` e tipos em `src/renderer/global.d.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
### CLONE.9 — Configuração MCP nos CLIs e WSL
- **JEV-AI-SUGGESTION:** NAO

**Próximo passo:** — (dividida em CLONE.9.1, CLONE.9.2, CLONE.9.3, CLONE.9.4, CLONE.9.5, CLONE.9.6, CLONE.9.7; cada uma tem seção própria abaixo)

### CLONE.9.1 — Lista dos CLIs suportados

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — constantes do inventário · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** CLONE.1.7
- **Descrição:** nome, executável e arquivo de configuração de cada CLI nas constantes.
- **Critérios de Aceitação:** typecheck ok.
- **Entrega:** commit `feat(CLONE.9.1)` — `apps-cloned/chaos-code/src/main/cli/clis-suportados.ts` (`DefinicaoCli` e `CLIS_SUPORTADOS`: Claude Code, Gemini CLI e Codex com executável, arquivo de configuração, formato, chave do servidor MCP e moldes do `mcp add`). Feita por Claude Code (Haiku 5.5 · herdr hk1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` sem erro (executor e líder); 0 linhas acima de 100; moldes conferidos por busca de substring no `mcp-cli-wsl.md` (todos presentes).

### CLONE.9.2 — Descobrir CLIs instalados

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — 1 arquivo · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.9.1
- **Descrição:** `apps-cloned/chaos-code/src/main/cli/descoberta-cli.ts` (procura no PATH).
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.9.2)` — `apps-cloned/chaos-code/src/main/cli/descoberta-cli.ts`: procura no PATH cada CLI de `CLIS_SUPORTADOS` (no Windows com PATHEXT + `.ps1`), lê a versão (`--version`) e lista os agentes (`claude agents`) com tempo limite de 5 s; `execFile` com argumentos fixos, sem shell; processo, ambiente e arquivos injetados. Feita por Claude Code (Sonnet 5.5 · herdr sn1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro (executor e líder); nenhuma linha acima de 100.

### CLONE.9.3 — Configurar o Claude Code (`claude mcp add`)

**Próximo passo:** —

- **Nível:** MEDIO — 1 arquivo · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.9.2, CLONE.8.3
- **Descrição:** `apps-cloned/chaos-code/src/main/cli/config-claude.ts`.
- **Critérios de Aceitação:** typecheck e build ok.

### CLONE.9.4 — Configurar os outros CLIs

**Próximo passo:** —

- **Nível:** MEDIO — 1 arquivo · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.9.2, CLONE.8.3
- **Descrição:** `apps-cloned/chaos-code/src/main/cli/config-outros-cli.ts` (arquivos de configuração).
- **Critérios de Aceitação:** typecheck e build ok.

### CLONE.9.5 — Detectar o WSL e o IP

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — 1 arquivo · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.1.7
- **Descrição:** `apps-cloned/chaos-code/src/main/wsl/deteccao.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.9.5)` — `apps-cloned/chaos-code/src/main/wsl/deteccao.ts`: `detectarWslInstalado`, `listarDistrosRodando`, `detectarIpHostWindows` (modo mirrored = 127.0.0.1; senão o IP do adaptador WSL no `netsh`, saída em inglês ou português), `verificarStatusWsl` (campos de `check_wsl_status`) e `ErroDeteccaoWsl`; processo e arquivos injetados, sem shell. Feita por Claude Code (Sonnet 5.5 · herdr sn2; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro com todas as entregas juntas (líder, 07:0x); conferência por Node do executor com processo falso.

### CLONE.9.6 — Liberar o localhost para o WSL (`netsh`)

**Próximo passo:** —

- **Nível:** PESADO — permissão de administrador e firewall · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.9.5, CLONE.8.2
- **Descrição:** `apps-cloned/chaos-code/src/main/wsl/liberar-acesso.ts` (pede confirmação ao usuário).
- **Critérios de Aceitação:** typecheck e build ok.

### CLONE.9.7 — Canais IPC de CLIs e WSL

**Próximo passo:** —

- **Nível:** MEDIO — liga arquivos existentes · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.9.3, CLONE.9.4, CLONE.9.6
- **Descrição:** canais em `src/compartilhado/constantes.ts` (`CANAIS_IPC`), tratadores em `src/main/canais.ts`, exposição em `src/preload/preload.ts` e tipos em `src/renderer/global.d.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
### CLONE.10 — Agentes
- **JEV-AI-SUGGESTION:** NAO

**Próximo passo:** — (dividida em CLONE.10.1, CLONE.10.2, CLONE.10.3, CLONE.10.4, CLONE.10.5; cada uma tem seção própria abaixo)

### CLONE.10.1 — Tipos de agente e modelo de agente

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — só tipos · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** CLONE.1.8
- **Descrição:** `apps-cloned/chaos-code/src/compartilhado/tipos-agentes.ts`.
- **Critérios de Aceitação:** typecheck ok.
- **Entrega:** commit `feat(CLONE.10.1)` — `apps-cloned/chaos-code/src/compartilhado/tipos-agentes.ts` (categorias, cores, modelo, frontmatter do agente, agente e modelo de agente no formato de `modelos-agente-embutidos.json`). Feita por Claude Code (Haiku 5.5 · herdr hk1; líder Opus 5.5) (local · main), 2026-10-18; líder ampliou `ModeloAgente` com `opus` e `inherit`.
- **Verificação:** `npm run typecheck` sem erro (executor e líder); 0 linhas acima de 100; executor tipou os 12 modelos embutidos como `ModeloAgenteTemplate[]` com `tsc --noEmit` ok. Em aberto: valores possíveis de `permissionMode`, `effort` e `isolation` (ficaram `string`).

### CLONE.10.2 — Leitor de frontmatter

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — função pura · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.10.1
- **Descrição:** `apps-cloned/chaos-code/src/main/agentes/frontmatter.ts` (ler e gerar o bloco `---`).
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.10.2)` — `apps-cloned/chaos-code/src/main/agentes/frontmatter.ts`: `lerAgente`/`gerarAgente` (ida e volta), parser mínimo sem biblioteca (aspas, números, booleanos, listas, comentários, CRLF, BOM), ordem dos 13 campos do original e validações *(inferidas)* com `ErroFrontmatter`. Feita por Claude Code (Sonnet 5.5 · herdr sn2; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro; conferência por `node`: os 12 modelos embutidos viram `.md` e voltam iguais, aspas e dois-pontos na descrição, arquivo sem bloco → erro. Líder rodou o typecheck.

### CLONE.10.3 — Gravar agente na pasta do CLI

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — 1 arquivo · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.10.2, CLONE.9.2
- **Descrição:** `apps-cloned/chaos-code/src/main/agentes/gravar-agente.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.10.3)` — `apps-cloned/chaos-code/src/main/agentes/gravar-agente.ts`: grava o agente (frontmatter + corpo) na pasta de agentes de cada CLI pelo mapa `PASTAS_AGENTES_POR_CLI`, nome de arquivo validado (sem sair da pasta), gravação atômica; arquivos injetados (`ArquivosAgentes`). Feita por Claude Code (Sonnet 5.5 · herdr sn2; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro (executor e líder); conferência por Node com arquivos falsos (executor). A implementação de `ArquivosAgentes` sobre `fs` fica para a CLONE.10.4.

### CLONE.10.4 — Serviço de agentes

**Próximo passo:** —

- **Nível:** MEDIO — 1 arquivo · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.5.6, CLONE.10.3
- **Descrição:** `apps-cloned/chaos-code/src/main/agentes/agentes.servico.ts`: listar modelos e instalar no CLI.
- **Critérios de Aceitação:** typecheck e build ok.

### CLONE.10.5 — Canais IPC de agentes

**Próximo passo:** —

- **Nível:** MEDIO — liga arquivos existentes · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.10.4
- **Descrição:** canais em `src/compartilhado/constantes.ts` (`CANAIS_IPC`), tratadores em `src/main/canais.ts`, exposição em `src/preload/preload.ts` e tipos em `src/renderer/global.d.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
### CLONE.11 — Geração de imagem
- **JEV-AI-SUGGESTION:** NAO

**Próximo passo:** — (dividida em CLONE.11.1, CLONE.11.2, CLONE.11.3, CLONE.11.4; cada uma tem seção própria abaixo)

### CLONE.11.1 — Constantes e tipos da geração de imagem

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — sem lógica · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** CLONE.1.9
- **Descrição:** modelo Gemini, endpoint e tipos do pedido/resposta.
- **Critérios de Aceitação:** typecheck ok.
- **Entrega:** commit `feat(CLONE.11.1)` — `apps-cloned/chaos-code/src/compartilhado/tipos-imagem.ts` (constantes do Gemini "Nano Banana" e tipos do pedido, da resposta, da configuração e da imagem do projeto). Feita por Claude Code (Haiku 5.5 · herdr hk1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` sem erro (executor e líder); 0 linhas acima de 100; valores conferidos contra o inventário. Em aberto: lista de `aspectRatio` (só `1:1` observado), 2 campos de `QuotaExceededResponse`, forma do registro de imagem e pasta local.

### CLONE.11.2 — Chamada à API Gemini

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — rede + chave do cofre · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.11.1, CLONE.6.6
- **Descrição:** `apps-cloned/chaos-code/src/main/imagem/gemini-imagem.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.11.2)` — `apps-cloned/chaos-code/src/main/imagem/gemini-imagem.ts`: geração de imagem direto no Gemini (chave por `preencherChavesImagem`, cabeçalho `x-goog-api-key`), devolve imagem, texto e origem `gemini_local`; só proporção 1:1 (a única confirmada), sem `quality` e sem novas tentativas *(inferidos no inventário)*; fetch injetado. Feita por Claude Code (Sonnet 5.5 · herdr sn1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro (executor e líder); conferência por Node com fetch falso (caminho feliz e 6 erros).

### CLONE.11.3 — Gravar a imagem no projeto

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — 1 arquivo · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.11.1, CLONE.3.3
- **Descrição:** `apps-cloned/chaos-code/src/main/imagem/gravar-imagem.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.11.3)` — `apps-cloned/chaos-code/src/main/imagem/gravar-imagem.ts`: grava a imagem em base64 na subpasta `images` da pasta de dados do projeto *(escolha do clone: pasta local não confirmada no inventário)*, gravação atômica, ID, nome, tipo e base64 validados; disco injetado. Feita por Claude Code (Sonnet 5.5 · herdr sn1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro (executor e líder); conferência por Node com disco falso (ordem criar/.tmp/renomear e 6 recusas). Em aberto: pasta de dados × `local_path` do projeto.

### CLONE.11.4 — Canais IPC de imagem

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — liga arquivos existentes · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.11.2, CLONE.11.3
- **Descrição:** canais em `src/compartilhado/constantes.ts` (`CANAIS_IPC`), tratadores em `src/main/canais.ts`, exposição em `src/preload/preload.ts` e tipos em `src/renderer/global.d.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.11.4)` — `apps-cloned/chaos-code/src/compartilhado/tipos-ipc-imagem.ts`, `apps-cloned/chaos-code/src/main/imagem/imagem.servico.ts` (`ServicoImagem`: configuração com chaves mascaradas pelo cofre, geração Gemini e gravação no projeto) e `imagem.canais.ts` (canais com validação); edições nos arquivos compartilhados de IPC (`constantes.ts`, `canais.ts`, `principal.ts`, `preload.ts`, `global.d.ts`). Feita por Claude Code (Sonnet 5.5 · herdr sn3; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro com todas as entregas juntas (líder, 07:0x); **atenção:** os arquivos compartilhados de IPC foram editados ao mesmo tempo pela 11.4 e pela 12.7 e entram inteiros neste commit (com a parte da 12.7); o commit da CLONE.12.7, logo em seguida, traz os arquivos próprios dela e fecha o typecheck.
### CLONE.12 — Atualizador
- **JEV-AI-SUGGESTION:** NAO

**Próximo passo:** — (dividida em CLONE.12.1, CLONE.12.2, CLONE.12.3, CLONE.12.4, CLONE.12.5, CLONE.12.6, CLONE.12.7; cada uma tem seção própria abaixo)

### CLONE.12.1 — Tipos do `latest.json` e constantes do atualizador

**Próximo passo:** —

- **Nível:** LEVE — sem lógica (formato padrão do Tauri) · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** Nenhuma
- **Descrição:** `apps-cloned/chaos-code/src/compartilhado/tipos-atualizador.ts` e URL/chave pública nas constantes (valor provisório até o servidor ser definido).
- **Critérios de Aceitação:** typecheck ok.
- **Entrega:** `tipos-atualizador.ts` novo (`LatestJson`, `PlataformaAtualizacao`) e `URL_ATUALIZACAO` + `CHAVE_PUBLICA_ATUALIZACAO` em `constantes.ts`.
- **Verificação:** `npm run typecheck` em `apps-cloned/chaos-code` sem erros.
- **Anotação:** o inventário da CLONE.1.9 (`docs/inventario/imagem-atualizador.md`) ainda não existe, então o formato veio do padrão do Tauri. A URL deriva de `URL_SERVIDOR_PADRAO/releases/latest.json`. A chave é um marcador (`CHAVE_PUBLICA_ATUALIZACAO_PROVISORIA`), não uma chave real: trocar antes da CLONE.12.4 valer.

### CLONE.12.2 — Comparar versões (semver)

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — função pura · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.12.1
- **Descrição:** `apps-cloned/chaos-code/src/main/atualizador/versao.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.12.2)` — `apps-cloned/chaos-code/src/main/atualizador/versao.ts` (`analisarVersao`, `compararVersoes`, `existeVersaoMaisNova`; semver com pré-lançamento).
- **Verificação:** `npm run typecheck` e `npm run build` em `apps-cloned/chaos-code` sem erros.

### CLONE.12.3 — Buscar o `latest.json` e ver se há atualização

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — 1 arquivo de rede · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.12.2
- **Descrição:** `apps-cloned/chaos-code/src/main/atualizador/verificar.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.12.3)` — `src/main/atualizador/verificar.ts` (`verificarAtualizacao`, rede injetável, tempo limite de 15 s), tipo `ResultadoVerificacaoAtualizacao` e 2 constantes.
- **Verificação:** `npm run typecheck` e `npm run build` em `apps-cloned/chaos-code` sem erros; rede não foi chamada (só leitura do código).

### CLONE.12.4 — Conferir a assinatura minisign (Ed25519)

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — criptografia · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.12.1
- **Descrição:** `apps-cloned/chaos-code/src/main/atualizador/assinatura.ts` com `node:crypto`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.12.4)` — `apps-cloned/chaos-code/src/main/atualizador/assinatura.ts` (`node:crypto`): lê a chave pública minisign (Ed + key id + 32 bytes, também no base64 do Tauri) e o `.sig` (`Ed` legado e `ED` com BLAKE2b-512), confere key id, assinatura Ed25519 do arquivo e assinatura global do trusted comment, com erros tipados (`assinatura_nao_confere`, `chave_diferente`, `comentario_nao_confere`, `assinatura_mal_formada`, `chave_invalida`). Feita por Claude Code (Opus 5.5 · herdr op3; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` ok; conferência por `node` com par Ed25519 gerado: 5 casos válidos passam e 5 inválidos falham com o motivo certo; a chave real do original decodificou com key id `FFE37F289242D9A6`, igual ao comentário dela. Em aberto: `CHAVE_PUBLICA_ATUALIZACAO` ainda é marcador (falha fechada até o servidor do clone ter um par minisign).

### CLONE.12.5 — Baixar e instalar a atualização

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — 1 arquivo · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.12.3, CLONE.12.4
- **Descrição:** `apps-cloned/chaos-code/src/main/atualizador/instalar.ts` (só instala se a assinatura bater).
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.12.5)` — `apps-cloned/chaos-code/src/main/atualizador/instalar.ts`: baixa o instalador com progresso (`aoProgredir`), confere a assinatura minisign antes de gravar ou executar (falha fechada), grava o histórico pré-atualização e roda o NSIS com `/S` *(inferido)*; MSIX → `MSIX_UPDATE_UNSUPPORTED`; fetch e instalador injetados. `CHAVE_PUBLICA_ATUALIZACAO` ainda é marcador. Feita por Claude Code (Sonnet 5.5 · herdr sn3; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro (executor e líder); conferência por Node com fetch e instalador falsos (executor). Reiniciar, `confirmarVersaoAtualizada` e o evento `update-progress` ficam para a CLONE.12.7.

### CLONE.12.6 — Histórico de atualizações

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — 1 arquivo · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.12.1, CLONE.3.4
- **Descrição:** `apps-cloned/chaos-code/src/main/atualizador/historico.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.12.6)` — `apps-cloned/chaos-code/src/main/atualizador/historico.ts`: `update_history.json` (7 campos) com leitura, gravação atômica, `boot_count` ao abrir na versão antiga *(escolha do clone)* e confirmação na versão nova (apaga o arquivo); `verified`/`update_required` sem regra no inventário (false ao gravar, true ao confirmar). Feita por Claude Code (Sonnet 5.5 · herdr sn3; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro (executor e líder); conferência por Node com arquivos falsos (sem arquivo, 7 campos, versão antiga e nova). Ligar `get_update_history`/`save_pre_update_state` fica para a CLONE.12.7.

### CLONE.12.7 — Canais IPC do atualizador

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — liga arquivos existentes · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.12.5, CLONE.12.6
- **Descrição:** canais em `src/compartilhado/constantes.ts` (`CANAIS_IPC`), tratadores em `src/main/canais.ts`, exposição em `src/preload/preload.ts` e tipos em `src/renderer/global.d.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.12.7)` — `apps-cloned/chaos-code/src/compartilhado/tipos-ipc-atualizador.ts`, `apps-cloned/chaos-code/src/main/atualizador/atualizador.servico.ts` (verificar, baixar e instalar, cancelar, salvar estado pré-atualização, histórico, `confirmarNaAbertura`, progresso), `atualizador.canais.ts` (5 canais + evento) e `atualizador.fabrica.ts` (dependências reais); as edições dela nos arquivos compartilhados de IPC entraram no commit da CLONE.11.4. Feita por Claude Code (Sonnet 5.5 · herdr sn4; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` sem erro com todas as entregas juntas (líder, 07:0x); conferência do executor.
### CLONE.13 — Interface (telas)
- **JEV-AI-SUGGESTION:** NAO

**Próximo passo:** — (dividida em CLONE.13.1, CLONE.13.2, CLONE.13.3, CLONE.13.4, CLONE.13.5, CLONE.13.6, CLONE.13.7, CLONE.13.8, CLONE.13.9, CLONE.13.10, CLONE.13.11, CLONE.13.12; cada uma tem seção própria abaixo)

### CLONE.13.1 — Tokens de tema (cores, fontes, medidas)

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — só CSS `:root` · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** CLONE.1.10
- **Descrição:** `apps-cloned/chaos-code/src/renderer/estilos.css` com as variáveis do original.
- **Critérios de Aceitação:** build ok.
- **Entrega:** commit `feat(CLONE.13.1)` — `apps-cloned/chaos-code/src/renderer/estilos.css` com as 30 variáveis `:root` do original (cores, Figtree com pilha local, raios, sombras, transições); as 6 variáveis antigas continuam definidas. Feita por Claude Code (Haiku 5.5 · herdr hk1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run build` sem erro; executor comparou as 30 declarações com o `:root` de `index-VYKA43iw.css` (todas iguais). Em aberto: media queries e cores avulsas das telas ficam para a CLONE.13.3 em diante; empacotar a Figtree é decisão futura.

### CLONE.13.2 — Textos da interface em constantes

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — copiar textos · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** CLONE.1.10
- **Descrição:** `apps-cloned/chaos-code/src/renderer/textos.ts`.
- **Critérios de Aceitação:** typecheck ok.
- **Entrega:** commit `feat(CLONE.13.2)` — `apps-cloned/chaos-code/src/renderer/textos.ts`: `TEXTOS` readonly por tela com os 545 textos pt-BR do `messages["pt-BR"]` do original (funções puras para textos com valor e plural). Feita por Claude Code (Haiku 5.5 · herdr hk1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` sem erro (executor e líder); 0 linhas acima de 100; executor compilou o módulo e comparou as 545 folhas com o original (0 falhas), sem chave repetida.

### CLONE.13.3 — Estrutura das telas e navegação

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — arquitetura do renderer · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** CLONE.13.1
- **Descrição:** `apps-cloned/chaos-code/src/renderer/navegacao.ts` + layout no `index.html`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** commit `feat(CLONE.13.3)` — `apps-cloned/chaos-code/src/renderer/navegacao.ts` (rotas na ordem do menu, registro de telas por mapa, roteador por hash com as regras do `beforeEach` original e `check_platform_online` guardado por 30 s), moldura do original em `index.html` (barra lateral, situação Auth/MCP/Proj, Sair, versão, Recolher; camadas `<dialog>` de consentimento MCP e atualização), `tela.ts` reescrito e `estilos.css` com as regras da moldura. Telas sem montador mostram "em construção" com a subtarefa dona; TODOs apontam os canais das CLONE.4.12, 8.10, 3.7, 12.7 e 13.2. Feita por Claude Code (Opus 5.5 · herdr op2; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `npm run typecheck` e `npm run build` ok (executor e líder); roteador simulado no Node com janela falsa: 9 cenários (rota vazia, navegação, rota desconhecida com uma montagem só, cache de 30 s, deslogado, erro da plataforma, registro de tela). HTML sem `style`/`onclick`, CSS sem `!important`. Não abrir o app: o usuário confere com `npm run dev`. A tela Dashboard do original virou a CLONE.13.13.

### CLONE.13.4 — Tela de login

**Próximo passo:** nenhum — concluída (Devin (SWE-2 High Lightning), 2026-11-01, retomada do executor Claude Code).

- **Nível:** MEDIO — 1 tela · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.13.3, CLONE.4.12
- **Descrição:** `apps-cloned/chaos-code/src/renderer/telas/login.tela.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
- **Entrega:** `src/renderer/telas/login.tela.ts` + `tela.ts`/`estilos.css`: tela de login com botão OAuth; estado via canal de login; token fora do renderer.
- **Verificação:** `npm run typecheck` e `npm run build` ok (Devin).

### CLONE.13.5 — Tela de projetos

**Próximo passo:** —

- **Nível:** MEDIO — 1 tela · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.13.3, CLONE.3.7, CLONE.5.7
- **Descrição:** `apps-cloned/chaos-code/src/renderer/telas/projetos.tela.ts`.
- **Critérios de Aceitação:** typecheck e build ok.

### CLONE.13.6 — Tela de tarefas

**Próximo passo:** —

- **Nível:** MEDIO — 1 tela · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.13.3, CLONE.5.7
- **Descrição:** `apps-cloned/chaos-code/src/renderer/telas/tarefas.tela.ts`.
- **Critérios de Aceitação:** typecheck e build ok.

### CLONE.13.7 — Tela de indexação e busca

**Próximo passo:** —

- **Nível:** MEDIO — 1 tela · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.13.3, CLONE.6.12
- **Descrição:** `apps-cloned/chaos-code/src/renderer/telas/indexacao.tela.ts`.
- **Critérios de Aceitação:** typecheck e build ok.

### CLONE.13.8 — Tela do grafo

**Próximo passo:** —

- **Nível:** MEDIO — 1 tela · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.13.3, CLONE.7.11
- **Descrição:** `apps-cloned/chaos-code/src/renderer/telas/grafo.tela.ts`.
- **Critérios de Aceitação:** typecheck e build ok.

### CLONE.13.9 — Tela do MCP, CLIs e WSL

**Próximo passo:** —

- **Nível:** MEDIO — 1 tela · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.13.3, CLONE.8.10, CLONE.9.7
- **Descrição:** `apps-cloned/chaos-code/src/renderer/telas/mcp.tela.ts`.
- **Critérios de Aceitação:** typecheck e build ok.

### CLONE.13.10 — Tela de agentes

**Próximo passo:** —

- **Nível:** MEDIO — 1 tela · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.13.3, CLONE.10.5
- **Descrição:** `apps-cloned/chaos-code/src/renderer/telas/agentes.tela.ts`.
- **Critérios de Aceitação:** typecheck e build ok.

### CLONE.13.11 — Tela de imagens

**Próximo passo:** —

- **Nível:** MEDIO — 1 tela · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.13.3, CLONE.11.4
- **Descrição:** `apps-cloned/chaos-code/src/renderer/telas/imagens.tela.ts`.
- **Critérios de Aceitação:** typecheck e build ok.

### CLONE.13.12 — Tela de configurações e atualização

**Próximo passo:** —

- **Nível:** MEDIO — 1 tela · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.13.3, CLONE.12.7
- **Descrição:** `apps-cloned/chaos-code/src/renderer/telas/configuracoes.tela.ts`.
- **Critérios de Aceitação:** typecheck e build ok.
### CLONE.14 — Aceite do usuário
- **JEV-AI-SUGGESTION:** NAO

**Próximo passo:** — (dividida em CLONE.14.1, CLONE.14.2, CLONE.14.3; cada uma tem seção própria abaixo)

### CLONE.13.13 — Tela do Dashboard (início)

**Próximo passo:** reservar.

- **Nível:** MEDIO — 1 tela com lógica · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor) · **Effort:** medium
- **Depende de:** CLONE.13.3, CLONE.3.7, CLONE.5.7
- **Descrição:** `apps-cloned/chaos-code/src/renderer/telas/dashboard.ts`, registrada em `navegacao.ts` na rota `#/dashboard`, reproduzindo o `DashboardView` do original (`docs/inventario/telas.md` e `docs/original/assets/DashboardView-*.js`).
- **Critérios de Aceitação:** typecheck e build ok.
- **Anotação:** criada em 2026-10-18 05:01 por Claude Code (Opus 5.5) (local · main) — líder (C26): a CLONE.13.3 achou a rota `#/dashboard` do original sem subtarefa dona. A CLONE.14.1 passa a depender também desta.

### CLONE.14.1 — Conferir o inventário contra o clone

**Próximo passo:** —

- **Nível:** MEDIO — revisão de várias partes · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** CLONE.13.4 a CLONE.13.13
- **Descrição:** marcar no `docs/INVENTARIO.md` o arquivo do clone que cobre cada função (ou o motivo de faltar).
- **Critérios de Aceitação:** nenhuma função sem equivalente ou justificativa.

### CLONE.14.2 — README de como rodar e o que testar

**Próximo passo:** —

- **Nível:** LEVE — só `.md` · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** CLONE.14.1
- **Descrição:** `apps-cloned/chaos-code/README.md`: instalar, `npm run dev`, roteiro de teste por tela.
- **Critérios de Aceitação:** roteiro cobre todas as telas.

### CLONE.14.3 — Aceite do usuário

**Próximo passo:** —

- **Nível:** LEVE — o usuário roda e confirma · **Modelo:** Usuário (não é tarefa de IA)
- **Depende de:** CLONE.14.2
- **Descrição:** o usuário roda o clone pelo roteiro e diz se aceita.
- **Critérios de Aceitação:** "sim" do usuário registrado.
