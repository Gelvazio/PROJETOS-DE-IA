# Inventário — telas da interface do Chaos Code v3 (CLONE.1.10)

Feito por Claude Code (Opus 5.5 · herdr op3; líder Opus 5.5) (local · main) em 2026-10-18.
Comandos citados: [`comandos.md`](comandos.md) · login: [`login.md`](login.md) · padrões de IA e
pipeline: [`vetores-grafo.md`](vetores-grafo.md).

## Cópia fiel da interface (`docs/original/`)

- Origem: tabela de assets do Tauri no executável (arq. `0x87e900`–`0x87ec80`, 28 entradas de 32
  bytes: ponteiro do nome, tamanho, ponteiro dos dados, tamanho), dados em **brotli**
  (descomprimidos com `zlib.brotliDecompressSync` do Node). Os arquivos **não foram formatados nem
  alterados**.
- 28 arquivos: `index.html`, 15 `.js`, 8 `.css`, 4 `.mp3` (sons dos avisos), nos caminhos
  originais (`docs/original/index.html` e `docs/original/assets/…`).
- Ícone do app: `docs/original/icons/icon.ico` (13.716 bytes), montado do `RT_GROUP_ICON` da seção
  de recursos com as 6 imagens PNG (16, 24, 32, 48, 64 e 256 px; arq. `0xaa0010`–`0xaa18b0`).
  O `index.html` aponta para `/vite.svg`, que **não está embutido**.
- A tabela não guarda hash nem tamanho descomprimido; a conferência foi: descomprimir sem erro,
  gravar, reler e comparar o SHA-256.

| Arquivo | Entrada | Brotli (bytes) | Tamanho | SHA-256 |
|---|---|---|---|---|
| `assets/GalleryView-DmGYWoDU.js` | `0x87e900` | 4.457 | 15.099 | `f7c02e05…cf7dd70f` |
| `assets/IconEntity.vue_vue_type_script_setup_true_lang-CtMojXRa.js` | `0x87e920` | 459 | 1.024 | `a41c9b8e…e459d0ab9` |
| `assets/vendor-vue-Dg8GUqy_.js` | `0x87e940` | 52.390 | 151.259 | `c02b46c5…8f20f52b` |
| `assets/SettingsView-C1pgL1fG.js` | `0x87e960` | 14.666 | 81.697 | `8d1823d9…65fdded04` |
| `assets/AgentsView-r3s4ULC1.js` | `0x87e980` | 10.967 | 37.231 | `8d5865c5…13ed37a` |
| `assets/SettingsView-B_dmVl9o.css` | `0x87e9a0` | 5.143 | 39.903 | `7759a157…0fca6f899` |
| `assets/vendor-ui-U2P9ZF8N.js` | `0x87e9c0` | 27.044 | 88.099 | `f2d96645…8a4da9` |
| `assets/IconInbox.vue_vue_type_script_setup_true_lang-Dc9RHFGS.js` | `0x87e9e0` | 462 | 1.028 | `af527d44…98224539` |
| `assets/es-CgHGcoY5.js` | `0x87ea00` | 9.671 | 41.688 | `824444ae…4cb1dc` |
| `assets/IconAlertCircle.vue_vue_type_script_setup_true_lang-Di5x6_rh.js` | `0x87ea20` | 392 | 1.031 | `54cd497d…a17fa8e7` |
| `assets/AgentsView-CIyeVTLv.css` | `0x87ea40` | 3.835 | 22.593 | `5d8ac59d…4233d1` |
| `assets/index-Ct94erbr.js` | `0x87ea60` | 24.667 | 96.624 | `bf8d548f…a9d5f` |
| `assets/warning-CTCFE7je.mp3` | `0x87ea80` | 29.219 | 29.997 | `20b0b766…f6edf21` |
| `assets/ProjectsView-E4eosdlN.css` | `0x87eaa0` | 4.422 | 28.159 | `21ab214a…259e8` |
| `assets/DashboardView-B9_kVIU1.css` | `0x87eac0` | 1.110 | 4.953 | `054596f3…10c3a7` |
| `assets/en-ktafWOTP.js` | `0x87eae0` | 8.753 | 38.916 | `8185923a…ffa4` |
| `assets/ConfirmDialog-CC0abcsQ.js` | `0x87eb00` | 565 | 1.211 | `1248003c…5f340` |
| `index.html` | `0x87eb20` | 266 | 625 | `8433c7ce…623a9f` |
| `assets/error-3n4t_XsE.mp3` | `0x87eb40` | 29.326 | 29.997 | `2f30ab03…e193a` |
| `assets/ChatView-DQS38dPx.css` | `0x87eb60` | 1.868 | 8.894 | `cb870cde…33e3` |
| `assets/ProjectsView-DRgMaFMf.js` | `0x87eb80` | 7.351 | 28.150 | `803a852b…a95fb` |
| `assets/DashboardView-DAQQm_1-.js` | `0x87eba0` | 1.726 | 5.140 | `ac71a783…a6713` |
| `assets/index-VYKA43iw.css` | `0x87ebc0` | 7.583 | 42.398 | `f8883987…727e` |
| `assets/ConfirmDialog-JOOvCSg3.css` | `0x87ebe0` | 641 | 2.182 | `03d3c847…be77d` |
| `assets/success-X1I6FjZQ.mp3` | `0x87ec00` | 29.141 | 29.997 | `91a96341…351ef` |
| `assets/ChatView-DjDuOtaC.js` | `0x87ec20` | 2.518 | 6.783 | `b3f16b67…a267` |
| `assets/GalleryView-CY_7xSKh.css` | `0x87ec40` | 4.706 | 29.533 | `cce19ee7…7e18` |
| `assets/info-uXnhUHze.mp3` | `0x87ec60` | 28.989 | 29.997 | `bd3701bf…77cb` |

Hashes completos: relatório da subtarefa (`manifesto.txt`, gerado pelo extrator).

## Estrutura do app

- **Vue 3 + Vue Router + Pinia + vue-i18n** (`vendor-vue`, `vendor-ui`); idiomas `pt-BR`
  (padrão, dentro do `index.js`), `en` e `es` (arquivos próprios); idioma salvo no `localStorage`.
- **Rotas** (`index-Ct94erbr.js`): `/` → `/login`; `/login` (`LoginView`, dentro do `index.js`);
  `/dashboard`, `/projects`, `/chat`, `/gallery`, `/agents`, `/settings` (carregadas sob demanda);
  rota desconhecida → `/dashboard`.
- **Stores (Pinia):** `auth`, `update`, `projects`, `chat` — concentram a maior parte dos `invoke`.
- **Camada de serviço:** `U(cmd,args)` = `invoke` direto; `H(cmd,args)` = `invoke` com nova
  tentativa após reconectar no erro 401 (`comandos.md`).

### Eventos ouvidos

| Evento | Origem | Quem ouve | Efeito |
|---|---|---|---|
| `sync-progress` | Rust (`plugin:event\|listen`) | store `projects` e `ProjectsView` | barra de progresso por fase e tempo restante (`~{duration} restantes`) |
| `update-progress` | Rust | store `update` / janela de atualização | `Started` / `Progress` / `Finished` |
| `mcp:consent-request` | Rust | `App` (diálogo de consentimento) | abre "Autorizar acesso MCP" |
| `auth:invalid` | DOM (`window`) | `App` | volta para `/login` |
| `auth:success`, `auth:reconnected` | DOM | `App` | entra / mostra "Reconectando… Tentativa {attempt} de {max}" |

## Telas

### Moldura (barra lateral e barra de status — `index.js`)

- **Menu:** Dashboard, Projetos, Chat, Galeria, Agentes, Configurações; botão **Recolher /
  Expandir menu** (largura 256 px ↔ 80 px); **Sair** (`logout`).
- **Barra de status:** "Auth: Autenticado/Desconectado" (`get_auth_status`), "MCP: Ativo/Parado",
  "Proj {count} projetos", versão "Chaos Code v{version}" (`plugin:app|version`), botão
  **Atualizar para v{version}** (store `update`).
- No Chat, a lateral vira lista de conversas: **Voltar ao menu**, seletor de projeto,
  **Nova conversa**, lista ("Nenhuma conversa"), **Excluir conversa** (`list_conversations`,
  `get_conversation`, `delete_conversation`).
- **Diálogo de consentimento MCP:** "Autorizar acesso MCP" — "{client} quer se conectar ao
  servidor MCP local", "Redirecionamento: {uri}"; botões **Negar** / **Autorizar** →
  `respond_mcp_consent { requestId, approve }`.
- **Janela de atualização:** "Atualização disponível" / "Esta atualização é obrigatória"; botões
  **Instalar e reiniciar** (`save_pre_update_state`, `download_and_install_update`), **Depois**,
  **Minimizar**, **Tentar novamente**; variantes MSIX (**Abrir Microsoft Store** →
  `ms-windows-store://pdp/?ProductId=9PJBW4WTG89Z`) e Linux `.deb` (**Copiar comando**
  `sudo apt update && sudo apt upgrade chaos-code-v3-client`, **Abrir site**
  `https://chaoscode.ai/download`). Avisos: "Conexão lenta ou perdida…", "O aplicativo será
  reiniciado automaticamente."
- Avisos (toasts) com sons `success`, `info`, `warning`, `error` (`.mp3`).

### Login (`/login` — `LoginView`)

- Textos: "Chaos Code v3", "Knowledge Graph Client", "Conecte, explore e descubra conhecimento".
- Botão **Entrar com OAuth** ("Conectando…") → `start_login`; depois `get_auth_status`.
- Erros: "Não foi possível autenticar. Verifique se o servidor está acessível." / "Servidor
  indisponível…".
- Guarda do roteador (`beforeEach`), em toda navegação: `check_platform_online`, resultado
  guardado por 30 s.

### Dashboard (`/dashboard` — `DashboardView`)

- Título "Dashboard" · "Visão geral do seu ambiente".
- Cartões: **Projetos**, **Sincronizados**, **Artigos**, **Entidades**, **Relações** (dados de
  `list_projects`, store `projects`).
- Botões: **Gerenciar Projetos** (→ `/projects`), **Consultar Knowledge Base** (→ `/chat`).
- Lista "Projetos Sincronizados" ("{articles} artigos · {entities} entidades").
- Vazio: "Nenhum projeto encontrado" + **Ver Projetos**; "Nenhum projeto sincronizado" +
  **Gerenciar Projetos**.
- Aviso WSL: `check_wsl_status` → toast "O localhostForwarding do WSL2 não está configurado…".

### Projetos (`/projects` — `ProjectsView`)

- Título "Projetos" · "Projetos da plataforma com knowledge base local".
- **Campos:** busca "Buscar projetos..." (botão limpar); filtros **Base de Conhecimento**
  (Todas/Ativa/Inativa) e **Papel** (Todos/…); contador "{filtered} de {total} projetos";
  paginação "de {total}".
- **Cartão do projeto:** nome, descrição, artigos / entidades / relações / chunks, indicador
  ("Base de Conhecimento desativada / sincronizada / ativa, não sincronizada"), data da última
  sincronização ("Nunca sincronizado").

| Botão / ação | Comando |
|---|---|
| Carregar lista, **Recarregar** | `list_projects` |
| Interruptor **Ativar/Desativar Base de Conhecimento** | `toggle_project_rag { projectId, enabled }` (bloqueado durante o sync) |
| **Verificar atualizações** ("{count} novos / atualizados / deletados", "Base de conhecimento em dia") | `check_article_updates { projectId }` |
| **Sincronizar agora** | `sync_project { projectId }` + evento `sync-progress` ("Sincronização em andamento: {phase}") |
| **Cancelar** (sync) | `cancel_sync { projectId }` |
| **Excluir dados locais** (lixeira → diálogo **Excluir**/**Cancelar**) | `delete_project_data { projectId }` |
| Seção **Ferramentas MCP** ("{count} ativas") | `get_project_mcp_tools { projectId }` |
| **Comando MCP** · **Copiar comando** | `get_mcp_command { projectId }` + área de transferência |
| **Conectar / Desconectar** por CLI (`claude`, `gemini`, `codex`) | `connect_mcp_cli` / `disconnect_mcp_cli { projectId, cli }`; situação: `get_mcp_cli_status { projectId }` |
| Associar / abrir pasta local (exigida para conectar CLI) | `plugin:dialog\|open` + `set_project_local_path { projectId, path }`; `open_project_folder { projectId }` |

- Faixa "Projetos indisponíveis — dados locais foram limpos automaticamente" (`removed_projects`).
- Toasts: "Sincronização iniciada / concluída / Erro na sincronização", "{cli} conectado —
  config escrita em {path}".

### Chat (`/chat` — `ChatView`)

- Selo da base: "Verificando… / Base de Conhecimento ativa / Não sincronizado / inativa /
  Selecione um projeto" (`get_project_rag_status { projectId }`).
- **Campo** de mensagem ("Digite sua mensagem..." / "Aguardando resposta...") e botão
  **Enviar mensagem** → `send_chat_message { request }` (request com `project_id` e `messages`);
  conversa gravada por `save_conversation { conversation }`.
- Faixas: base inativa ou não sincronizada (texto pede para ir a Projetos).
- Vazio: "Pergunte à Base de Conhecimento", "Converse com o assistente", "Selecione um projeto
  para iniciar".
- Links da resposta abrem no navegador por `plugin:shell|open`.

### Galeria (`/gallery` — `GalleryView`)

- Título "Galeria de Imagens" · "Imagens geradas por IA nos seus projetos" · "{count} imagens";
  seletor de projeto.
- **Campos:** "Buscar imagens por prompt...", "Filtrar por tags..."; botão **Buscar** →
  `search_images { projectId, query, tags, status, limit, offset }`; lista normal →
  `list_project_images { projectId, limit, offset }`; paginação.
- Cartão: **Ver** (abre modal) e **Excluir** → diálogo "Tem certeza que deseja excluir esta
  imagem?" **Confirmar**/**Cancelar** → `delete_project_image { projectId, imageId }`.
- Modal: Prompt, Prompt negativo, Metadados (Modelo, Dimensões, Seed, Tempo, Status, Criado em),
  Tags, **Fechar**; "Imagem indisponível".

### Agentes (`/agents` — `AgentsView`)

- Título "Agentes Claude Code"; busca; escopo **Projeto / Usuário**; abas **Meus Agentes /
  Sugestões**; **Abrir pasta**, **Trocar pasta**, **Associar pasta local**.
- **Meus Agentes:** lista → `list_agents { projectId, scope }` / `list_resolved_agents
  { projectId }`; **Excluir** ("Remover o agente "{name}"?…") → `delete_agent { reference }`.
- **Formulário (Novo agente / editar):** Nome (minúsculas, números e hífens), Descrição (≥ 10
  caracteres), Modelo (`inherit`, `sonnet`, `opus`, `haiku`), Cor, Modo de permissão, Memória
  persistente, System prompt (≥ 20 caracteres), **Opções avançadas**; interruptor **Otimizar
  para Chaos Code** (exige `search_knowledge` no prompt; botão **Inserir bloco Chaos Code
  recomendado** → `generate_chaos_code_flow_block { projectId, agentRole }`); prontidão →
  `check_chaos_code_readiness { projectId }` e `list_chaos_code_mcp_tools`; pré-visualização →
  `preview_agent_file { frontmatter, systemPrompt }`; **Salvar** → `check_agent_exists
  { reference }` + `save_agent { reference, frontmatter, systemPrompt, overwrite }`;
  **Cancelar**. Aviso: "Agente salvo. Se o Claude Code está aberto neste projeto, rode /agents
  para recarregar."
- **Sugestões:** **Biblioteca curada** → `list_agent_templates { projectId }`; **Equipe
  automática** / **Montar equipe automaticamente** → `assemble_team_auto { projectId }`;
  **Sugeridos pela IA** / **Gerar sugestões para este projeto** → `suggest_agents_ai
  { projectId, hint }`; **Comunidade** → `list_community_agents { projectId, category }`.
  Pré-visualização da equipe: **Gerar outra proposta**, **Criar equipe ({count} selecionados)**.

### Configurações (`/settings` — `SettingsView`)

Abas: **Client**, **Inteligência Artificial**, **Imagens**, **Base de Conhecimento**.

| Aba / bloco | Campos e botões | Comandos |
|---|---|---|
| Client · Informações | Versão, Canal | `plugin:app\|version`, `get_update_channel`, `get_install_kind` |
| Client · Idioma | Idioma da interface (pt-BR, en, es) | — (`localStorage`) |
| Client · Sons | Habilitar sons | — |
| Client · Atualizações | Verificar automaticamente, Instalar automaticamente, Intervalo (15 min, 30 min, 1 h, 4 h), **Verificar agora**, **Atualizar para v{version}**; aviso MSIX; aviso NSIS paralela + **Abrir Apps e recursos** (`ms-settings:appsfeatures`) | `get_update_config` / `set_update_config`, `check_for_update`, `get_shadow_nsis_path`, `get_update_history`, `plugin:shell\|open` |
| Client · WSL2 / Modo MCP | situação; **Configurar automaticamente** (confirmação lista as distros), **Não mostrar novamente** | `check_wsl_status`, `apply_wsl_localhost_forwarding`, `dismiss_wsl_warning` |
| IA · Modo de Operação | OpenAI-compatível (Endpoint, API Key, Modelo de Embedding, Dimensões, Modelo de Chat), Gemini (API Key, modelo, dimensões, chat), OpenRouter (API Key, Modelo de Chat, Provedor/Endpoint/API Key/Modelo de embedding, Dimensões), Personalizado (URL base do proxy, API Key, **Cabeçalhos extras** + **Adicionar/Remover cabeçalho**, Modelo de Chat, **Listar modelos**, **Testar chat**, "Usar a mesma URL e chave para embeddings", modelo de embedding, **Detectar** dimensões) | `get_embedder_config` / `set_embedder_config`, `list_proxy_models { baseUrl, apiKey, headers }`, `test_chat_model { mode, chatModel }`, `detect_embedding_dimensions { mode }` |
| Imagens · API de Imagens | OpenAI (Endpoint, Chave, Limite RPM), Gemini (Chave, Limite RPM), mostrar/ocultar chave | `get_image_api_config` / `set_image_api_config` |
| Base · Extração | Estratégia Regex / LLM / Híbrido, Máx. entidades e relações por chunk, **Testar Extração** (texto de exemplo) | `get_extraction_config` / `set_extraction_config`, `test_extraction { sampleText }` |
| Base · Pipeline RAG | Extração Paralela, Artigos em Paralelo, Concorrência de Embeddings, Tamanho do Batch, RPM máximo, Margem (%), Cache; Avançado: Adaptive Retrieval, Re-ranking (Candidatos, Top K Final), Query Expansion (Estratégia Multi-Query/HyDE, Sub-queries), MMR (lambda), Loop Reflexivo (Iterações, Score mín.); **Restaurar Padrões** | `get_pipeline_config` / `set_pipeline_config` |
| Ações | **Salvar Configurações**, **Testar Conexão** | `set_*_config`, `test_embedder` |

Valores padrão de cada campo: [`vetores-grafo.md`](vetores-grafo.md).

### Componentes comuns

- `ConfirmDialog` (Cancelar / Confirmar), ícones `IconEntity`, `IconInbox`, `IconAlertCircle`.

## Tokens visuais (para CLONE.13.1 / 13.2)

Tema único escuro, definido em `:root` de `assets/index-VYKA43iw.css` (as telas usam `var(--…)`;
uso por arquivo: Settings 267, Index 213, Agents 209, Projects 165, Gallery 150).

| Grupo | Token | Valor |
|---|---|---|
| Fundo | `--bg-primary` / `--bg-secondary` / `--bg-tertiary` / `--bg-card` | `#111827` / `#030712` / `#1f2937` / `#1f2937` |
| Texto | `--text-primary` / `--text-secondary` / `--text-tertiary` / `--text-muted` | `#f3f4f6` / `#9ca3af` / `#6b7280` / `rgba(255,255,255,.4)` |
| Destaque | `--accent` / `--accent-hover` / `--accent-glow` | `#a78bfa` / `#8b5cf6` / `rgba(167,139,250,.15)` |
| Destaque | `--accent-gradient` | `linear-gradient(135deg, #8b5cf6, #d946ef)` |
| Destaque | `--accent-solid` / `--accent-solid-hover` / `--violet-500` | `#7c3aed` / `#6d28d9` / `#8b5cf6` |
| Estado | `--success` / `--warning` / `--error` | `#34d399` / `#fbbf24` / `#f87171` |
| Borda | `--border` / `--border-primary` | `#374151` |
| Sombra | `--shadow-sm` / `--shadow-md` / `--shadow-lg` | `0 2px 8px rgba(0,0,0,.3)` / `0 4px 16px rgba(0,0,0,.4)` / `0 8px 32px rgba(0,0,0,.5)` |
| Raio | `--radius-sm` / `--radius-md` / `--radius-lg` | `6px` / `8px` / `12px` (também usados direto: 4, 10 e 14 px) |
| Layout | `--sidebar-width` / `--sidebar-collapsed` | `256px` / `80px` |
| Movimento | `--transition-fast` / `--transition-normal` | `.15s ease` / `.3s ease-in-out` |

- **Fonte:** Figtree 400/500/600 (Google Fonts, `@import` no CSS principal), com reserva
  `ui-sans-serif, system-ui, -apple-system, sans-serif`; código em `monospace`. Base do Tailwind
  (pré-flight) incluída.
- **Cores extras usadas direto nas telas:** `#d946ef` (fúcsia do gradiente), `#c4b5fd`,
  `#60a5fa` (azul), `#f59e0b` / `#fb923c` (laranja), `#ef4444` (vermelho), `#f472b6` (rosa),
  `#fde68a` (amarelo claro).
- **Responsivo:** `@media (max-width:600px)`, `@media (hover:none) and (pointer:coarse)` e
  `@media (prefers-reduced-motion)`.

## Em aberto

- O conteúdo exato de cada cartão do Dashboard e da lista do Chat foi descrito pelos textos e
  comandos, não pela marcação; detalhes de layout ficam para a CLONE.13 (os arquivos originais
  estão em `docs/original/`).
- `/vite.svg` (favicon do `index.html`) não existe no executável.
