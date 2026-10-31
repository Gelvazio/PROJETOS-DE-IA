/**
 * Textos pt-BR da interface do Chaos Code, por tela. Copiados do original
 * (`docs/original/assets/index-Ct94erbr.js`, mensagens `pt-BR`). As chaves seguem
 * os nomes do original, com `_` no lugar do aninhamento.
 */
export const TEXTOS = {
  comum: {
    loading: 'Carregando...',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    save: 'Salvar',
    close: 'Fechar',
    delete: 'Excluir',
    retry: 'Tentar novamente',
    error: 'Erro',
    success: 'Sucesso',
    back: 'Voltar',
    next: 'Próximo',
    saving: 'Salvando...',
    noDescription: 'Sem descrição',
    copySuccess: 'Copiado!',
    recommended: 'Recomendado',
    show: 'Mostrar',
    hide: 'Ocultar',
    articles: 'artigos',
    entities: 'entidades',
    relations: 'relações',
    active: 'Ativa',
    inactive: 'Inativa',
    all: 'Todas',
    allMasc: 'Todos',
    never: 'Nunca sincronizado',
    restoreDefaults: 'Restaurar Padrões',
    search: 'Buscar...',
  },
  moldura: {
    dashboard: 'Dashboard',
    projects: 'Projetos',
    chat: 'Chat',
    gallery: 'Galeria',
    agents: 'Agentes',
    settings: 'Configurações',
    logout: 'Sair',
    goToDashboard: 'Ir ao Dashboard',
    backToMenu: 'Voltar ao menu',
    mainMenu: 'Menu Principal',
    selectProject: 'Selecione um projeto',
    newConversation: 'Nova conversa',
    noConversations: 'Nenhuma conversa',
    deleteConversation: 'Excluir conversa',
    updateAvailable: 'Atualização disponível',
    updating: 'Atualizando...',
    updateTo: (valores: {
      version: string | number;
    }): string =>
      'Atualizar para v' +
      valores.version,
    appVersion: (valores: {
      version: string | number;
    }): string =>
      'Chaos Code v' +
      valores.version,
    auth_label: 'Auth',
    auth_authenticated: 'Autenticado',
    auth_disconnected: 'Desconectado',
    mcp_label: 'MCP',
    mcp_active: 'Ativo',
    mcp_stopped: 'Parado',
    projectsPrefix: 'Proj',
    projectsCount: (valores: { count: number }): string =>
      valores.count === 1
        ? '1 projeto'
        : valores.count +
          ' projetos',
    logoutTitle: 'Sair',
    logoutAria: 'Sair da conta',
    collapse: 'Recolher',
    expand: 'Expandir menu',
    collapseMenu: 'Recolher menu',
    mainMenuAria: 'Menu principal',
    relativeTime_now: 'agora',
  },
  login: {
    subtitle: 'Knowledge Graph Client',
    tagline: 'Conecte, explore e descubra conhecimento',
    connecting: 'Conectando...',
    loginWithOAuth: 'Entrar com OAuth',
    errors_authFailed: 'Não foi possível autenticar. Verifique se o servidor está acessível.',
    errors_serverUnavailable: 'Servidor indisponível. Verifique sua conexão e tente novamente.',
  },
  aplicativo: {
    reconnecting: 'Reconectando...',
    reconnectAttempt: (valores: {
      attempt: string | number;
      max: string | number;
    }): string =>
      'Tentativa ' +
      valores.attempt +
      ' de ' +
      valores.max,
  },
  consentimentoMcp: {
    title: 'Autorizar acesso MCP',
    message: (valores: {
      client: string | number;
    }): string =>
      valores.client +
      ' quer se conectar ao servidor MCP local.',
    unknownClient: 'CLI desconhecido',
    redirect: (valores: {
      uri: string | number;
    }): string =>
      'Redirecionamento: ' +
      valores.uri,
    authorize: 'Autorizar',
    deny: 'Negar',
    error: 'Erro ao responder solicitação',
  },
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Visão geral do seu ambiente',
    stats_projects: 'Projetos',
    stats_synced: 'Sincronizados',
    stats_articles: 'Artigos',
    stats_entities: 'Entidades',
    stats_relations: 'Relações',
    actions_manageProjects: 'Gerenciar Projetos',
    actions_queryKnowledge: 'Consultar Knowledge Base',
    syncedProjects: 'Projetos Sincronizados',
    projectStats: (valores: {
      articles: string | number;
      entities: string | number;
    }): string =>
      valores.articles +
      ' artigos · ' +
      valores.entities +
      ' entidades',
    empty_noProjects: 'Nenhum projeto encontrado',
    empty_noProjectsDesc: 'Seus projetos da plataforma aparecerão aqui após autenticação.',
    empty_viewProjects: 'Ver Projetos',
    empty_noSynced: 'Nenhum projeto sincronizado',
    empty_noSyncedDesc: (valores: {
      count: string | number;
    }): string =>
      'Você possui ' +
      valores.count +
      ' projeto(s), mas nenhum foi sincronizado. Sincronize a Wiki para começar a consultar.',
    empty_manageProjects: 'Gerenciar Projetos',
  },
  projetos: {
    title: 'Projetos',
    subtitle: 'Projetos da plataforma com knowledge base local',
    search_placeholder: 'Buscar projetos...',
    search_ariaLabel: 'Buscar projetos por nome ou descrição',
    search_clearTitle: 'Limpar busca',
    search_clearAria: 'Limpar campo de busca',
    filters_knowledgeBase: 'Base de Conhecimento',
    filters_status: 'Status',
    filters_role: 'Papel',
    filters_count: (valores: {
      filtered: string | number;
      total: string | number;
    }): string =>
      valores.filtered +
      ' de ' +
      valores.total +
      ' projetos',
    banner_unavailable: 'Projetos indisponíveis',
    banner_dataCleared: '— dados locais foram limpos automaticamente.',
    card_deleteTitle: (valores: {
      name: string | number;
    }): string =>
      'Excluir dados locais de ' +
      valores.name,
    card_knowledgeBase: 'Base de Conhecimento',
    card_chunks: 'chunks',
    card_status_active: 'Ativo',
    card_status_archived: 'Arquivado',
    card_status_provisioning: 'Provisionando',
    card_status_suspended: 'Suspenso',
    card_status_error: 'Erro',
    card_status_owner: 'Proprietário',
    card_status_admin: 'Administrador',
    card_status_member: 'Membro',
    card_status_viewer: 'Visualizador',
    card_status_programador: 'Programador',
    card_status_marketing: 'Marketing',
    card_status_comercial: 'Comercial',
    card_status_consulta: 'Consulta',
    card_disableAria: (valores: {
      name: string | number;
    }): string =>
      'Desativar Base de Conhecimento do projeto ' +
      valores.name,
    card_enableAria: (valores: {
      name: string | number;
    }): string =>
      'Ativar Base de Conhecimento do projeto ' +
      valores.name,
    card_disableTitle: 'Desativar Base de Conhecimento',
    card_enableTitle: 'Ativar Base de Conhecimento',
    sync_timeRemaining: (valores: {
      duration: string | number;
    }): string =>
      '~' +
      valores.duration +
      ' restantes',
    sync_phases_fetching_articles: 'Buscando artigos...',
    sync_phases_articles_found: 'Artigos encontrados',
    sync_phases_removing_old: 'Removendo dados antigos',
    sync_phases_starting: 'Iniciando processamento',
    sync_phases_chunking: 'Dividindo em chunks',
    sync_phases_embedding: 'Gerando embeddings',
    sync_phases_extracting: 'Extraindo entidades',
    sync_phases_entity_embedding: 'Embeddings de entidades',
    sync_phases_article_done: 'Artigo processado',
    sync_phases_indexing: 'Indexando knowledge base',
    sync_phases_saving: 'Salvando em disco',
    sync_phases_confirming: 'Enviando confirmação',
    sync_phases_done: 'Sincronização concluída',
    sync_phases_cancelled: 'Sincronização cancelada',
    sync_indicator_disabled: 'Base de Conhecimento desativada',
    sync_indicator_synced: 'Base de Conhecimento sincronizada',
    sync_indicator_activeNotSynced: 'Base de Conhecimento ativa, não sincronizada',
    sync_checkUpdates: 'Verificar atualizações',
    sync_checking: 'Verificando...',
    sync_upToDate: 'Base de conhecimento em dia',
    sync_newCount: (valores: { count: number }): string =>
      valores.count === 1
        ? valores.count +
          ' novo'
        : valores.count +
          ' novos',
    sync_updatedCount: (valores: { count: number }): string =>
      valores.count === 1
        ? valores.count +
          ' atualizado'
        : valores.count +
          ' atualizados',
    sync_upToDateCount: (valores: {
      count: string | number;
    }): string =>
      '· ' +
      valores.count +
      ' em dia',
    sync_newBadge: 'Novo',
    sync_deletedBadge: 'Deletado',
    sync_deletedCount: (valores: { count: number }): string =>
      valores.count === 1
        ? valores.count +
          ' deletado'
        : valores.count +
          ' deletados',
    sync_syncNow: 'Sincronizar agora',
    sync_noData: 'Nenhum dado sincronizado',
    sync_inProgress: (valores: {
      phase: string | number;
    }): string =>
      'Sincronização em andamento: ' +
      valores.phase,
    sync_cancelSync: 'Cancelar',
    mcp_title: 'Ferramentas MCP',
    mcp_activeCount: (valores: {
      count: string | number;
    }): string =>
      valores.count +
      ' ativas',
    mcp_noTools: 'Nenhuma ferramenta disponível',
    mcp_command: 'Comando MCP',
    mcp_categories_kanban: 'Kanban',
    mcp_categories_knowledge: 'Knowledge',
    mcp_categories_wiki: 'Wiki',
    mcp_categories_images: 'Imagens',
    mcp_categories_planning: 'Planejamento',
    mcp_clis_claude: 'Claude Code',
    mcp_clis_gemini: 'Gemini CLI',
    mcp_clis_codex: 'Codex',
    mcp_connect: 'Conectar',
    mcp_disconnect: 'Desconectar',
    mcp_connected: 'Conectado',
    mcp_disconnected: 'Desconectado',
    mcp_connecting: 'Conectando…',
    mcp_copyCommand: 'Copiar comando',
    mcp_connectSuccess: (valores: {
      cli: string | number;
      path: string | number;
    }): string =>
      valores.cli +
      ' conectado — config escrita em ' +
      valores.path,
    mcp_connectError: (valores: {
      cli: string | number;
    }): string =>
      'Falha ao conectar ' +
      valores.cli,
    mcp_disconnectSuccess: (valores: {
      cli: string | number;
    }): string =>
      valores.cli +
      ' desconectado do servidor MCP local',
    mcp_folderRequired: 'Associe a pasta local do projeto para conectar este CLI',
    pagination_of: (valores: {
      total: string | number;
    }): string =>
      'de ' +
      valores.total,
    pagination_info: (valores: {
      start: string | number;
      end: string | number;
      total: string | number;
    }): string =>
      valores.start +
      '–' +
      valores.end +
      ' de ' +
      valores.total,
    empty_noResults: 'Nenhum projeto encontrado com os filtros atuais',
    empty_noResultsDesc: 'Tente ajustar os termos de busca ou remover os filtros aplicados.',
    empty_clearFilters: 'Limpar filtros',
    empty_noProjects: 'Nenhum projeto encontrado',
    empty_noProjectsDesc: 'Seus projetos da plataforma aparecerão aqui após autenticação.',
    empty_reload: 'Recarregar',
    deleteDialog_title: 'Excluir dados locais',
    deleteDialog_message:
      'Isso vai limpar toda a Base de Conhecimento local deste projeto (entidades, relações e ' +
      'chunks). Será necessário sincronizar novamente com a Wiki para reconstruir os dados.',
    deleteDialog_confirm: 'Excluir',
    deleteDialog_cancel: 'Cancelar',
    toast_syncStarted: 'Sincronização iniciada',
    toast_syncStartedDesc: (valores: {
      name: string | number;
    }): string =>
      'Projeto "' +
      valores.name +
      '" está sendo sincronizado. Não feche o client durante o processo.',
    toast_syncDone: 'Sincronização concluída',
    toast_syncDoneDesc: (valores: {
      name: string | number;
    }): string =>
      'Projeto "' +
      valores.name +
      '" sincronizado com sucesso.',
    toast_syncError: 'Erro na sincronização',
    toast_syncErrorDesc: (valores: {
      name: string | number;
      error: string | number;
    }): string =>
      'Falha ao sincronizar "' +
      valores.name +
      '": ' +
      valores.error,
    toast_cannotDeleteWhileSync:
      'Não é possível excluir dados enquanto o projeto está sincronizando.',
    toast_cannotToggleWhileSync:
      'Não é possível alterar a Base de Conhecimento durante a sincronização.',
  },
  chat: {
    title: 'Chat',
    ragBadge_selectProject: 'Selecione um projeto',
    ragBadge_checking: 'Verificando...',
    ragBadge_knowledgeBase: 'Base de Conhecimento',
    ragBadge_active: 'Base de Conhecimento ativa',
    ragBadge_notSynced: 'Não sincronizado',
    ragBadge_inactive: 'Base de Conhecimento inativa',
    placeholder_waiting: 'Aguardando resposta...',
    placeholder_default: 'Digite sua mensagem...',
    newConversation: 'Nova conversa',
    noConversations: 'Nenhuma conversa',
    deleteConversation: 'Excluir conversa',
    sendMessage: 'Enviar mensagem',
    banner_ragInactive:
      'A Base de Conhecimento não está ativada para este projeto. Ative-a na página de Projetos ' +
      'para obter respostas baseadas nos documentos do projeto. O chat continuará funcionando, ' +
      'mas sem contexto da base.',
    banner_ragNotSynced:
      'A Base de Conhecimento está ativada, mas o projeto ainda não foi sincronizado. Sincronize ' +
      'na página de Projetos para que os documentos fiquem disponíveis no chat.',
    empty_selectProject: 'Selecione um projeto para iniciar',
    empty_selectProjectDesc: 'Escolha um projeto no menu lateral para conversar com o assistente.',
    empty_askKnowledge: 'Pergunte à Base de Conhecimento',
    empty_askKnowledgeDesc:
      'Faça perguntas sobre os documentos do projeto. O chat responde exclusivamente com base na ' +
      'Base de Conhecimento sincronizada.',
    empty_notSynced: 'Projeto não sincronizado',
    empty_notSyncedDesc:
      'Sincronize o projeto na aba Projetos para que a Base de Conhecimento fique disponível. ' +
      'Enquanto isso, o chat responde com conhecimento geral.',
    empty_ragInactive: 'Base de Conhecimento inativa',
    empty_ragInactiveDesc:
      'A Base de Conhecimento não está ativada para este projeto. O chat funcionará com ' +
      'conhecimento geral do assistente.',
    empty_startChat: 'Converse com o assistente',
    empty_startChatDesc: 'Digite sua mensagem abaixo para começar.',
    store_newConversation: 'Nova conversa',
  },
  galeria: {
    title: 'Galeria de Imagens',
    imageCount: (valores: { count: number }): string =>
      valores.count === 1
        ? valores.count +
          ' imagem'
        : valores.count +
          ' imagens',
    selectProject: 'Selecione um projeto',
    subtitle: 'Imagens geradas por IA nos seus projetos',
    empty_selectProject: 'Selecione um projeto',
    empty_selectProjectDesc:
      'Escolha um projeto sincronizado no seletor acima para ver as imagens geradas.',
    empty_noImages: 'Nenhuma imagem gerada',
    empty_noImagesDesc: 'As imagens geradas por IA aparecerão aqui.',
    overlay_view: 'Ver',
    overlay_delete: 'Excluir',
    modal_imageUnavailable: 'Imagem indisponível',
    modal_prompt: 'Prompt',
    modal_negativePrompt: 'Prompt negativo',
    modal_metadata: 'Metadados',
    modal_labelModel: 'Modelo',
    modal_labelDimensions: 'Dimensões',
    modal_labelSeed: 'Seed',
    modal_labelTime: 'Tempo',
    modal_labelStatus: 'Status',
    modal_labelCreatedAt: 'Criado em',
    modal_tags: 'Tags',
    deleteConfirm_message: 'Tem certeza que deseja excluir esta imagem?',
    deleteConfirm_confirm: 'Confirmar',
    deleteConfirm_cancel: 'Cancelar',
    deleteConfirm_deleteImage: 'Excluir imagem',
    library_title: 'Biblioteca de Imagens',
    library_searchPlaceholder: 'Buscar imagens por prompt...',
    library_tagsPlaceholder: 'Filtrar por tags...',
    library_search: 'Buscar',
    library_searching: 'Buscando...',
    library_noResults: 'Nenhuma imagem encontrada. Tente buscar com outros termos.',
  },
  agentes: {
    title: 'Agentes Claude Code',
    newAgent: 'Novo agente',
    scopeProject: 'Projeto',
    scopeUser: 'Usuário',
    empty: 'Nenhum agente encontrado neste escopo.',
    tabs_mine: 'Meus Agentes',
    tabs_suggestions: 'Sugestões',
    suggestions_library: 'Biblioteca curada',
    suggestions_ai: 'Sugeridos pela IA',
    suggestions_community: 'Comunidade',
    suggestions_autoTeam: 'Equipe automática',
    suggestions_autoTeamDesc:
      'Escaneia a pasta do projeto e monta uma equipe de agentes alinhada à stack detectada ' +
      '(backend, frontend, QA, docs…).',
    suggestions_autoTeamNoPath: 'Configure a pasta local do projeto para habilitar.',
    suggestions_assembleTeam: 'Montar equipe automaticamente',
    suggestions_previewTitle: (valores: {
      projectName: string | number;
    }): string =>
      'Equipe sugerida para ' +
      valores.projectName,
    suggestions_reviewHint: (valores: { count: number }): string =>
      valores.count === 1
        ? valores.count +
          ' agente sugerido — revise e confirme'
        : valores.count +
          ' agentes sugeridos — revise e confirme',
    suggestions_regenerate: 'Gerar outra proposta',
    suggestions_createTeam: (valores: { count: number }): string =>
      valores.count === 1
        ? 'Criar equipe (' +
          valores.count +
          ' selecionado)'
        : 'Criar equipe (' +
          valores.count +
          ' selecionados)',
    suggestions_teamCreated: (valores: { count: number }): string =>
      valores.count === 1
        ? 'Equipe criada: ' +
          valores.count +
          ' agente'
        : 'Equipe criada: ' +
          valores.count +
          ' agentes',
    suggestions_teamSkipped: (valores: { names: number }): string =>
      valores.names === 1
        ? 'Já existia: ' +
          valores.names
        : 'Já existiam: ' +
          valores.names,
    loadTemplates: 'Carregar templates',
    generateSuggestions: 'Gerar sugestões para este projeto',
    selectProjectForSuggestions:
      'Selecione um projeto com pasta local associada para ver sugestões.',
    communityUnavailable: 'Catálogo da comunidade indisponível no momento.',
    form_name: 'Nome',
    form_description: 'Descrição',
    form_model: 'Modelo',
    form_color: 'Cor',
    form_tools: 'Ferramentas',
    form_permissionMode: 'Modo de permissão',
    form_memory: 'Memória persistente',
    form_systemPrompt: 'System prompt',
    form_advanced: 'Opções avançadas',
    validation_nameInvalid: 'Use apenas letras minúsculas, números e hífens (começando com letra).',
    validation_nameDuplicate: 'Já existe um agente com esse nome neste escopo.',
    validation_descriptionShort: 'Descrição precisa ter pelo menos 10 caracteres.',
    validation_promptShort: 'System prompt precisa ter pelo menos 20 caracteres.',
    validation_promptMissingSearchKnowledge:
      'System prompt precisa mencionar `search_knowledge` quando otimizado para Chaos Code.',
    validation_insertChaosCodeBlock: 'Inserir bloco Chaos Code recomendado',
    confirmDelete: (valores: {
      name: string | number;
    }): string =>
      'Remover o agente "' +
      valores.name +
      '"? O arquivo será excluído permanentemente do disco.',
    associateFolder: 'Este projeto ainda não tem pasta local associada.',
    associateFolderCta: 'Associar pasta local',
    changeFolder: 'Trocar pasta',
    openFolder: 'Abrir pasta',
    toast_created: 'Agente criado com sucesso.',
    toast_updated: 'Agente atualizado.',
    toast_deleted: 'Agente removido.',
    toast_aiFailed: 'Não foi possível gerar sugestões. Verifique sua configuração de IA.',
    toast_reloadNotice:
      'Agente salvo. Se o Claude Code está aberto neste projeto, rode /agents para recarregar.',
    readiness_noLocalPath:
      'Este projeto não tem pasta local associada. Associe uma pasta antes de criar agentes.',
    readiness_ragDisabled:
      'O RAG deste projeto está desativado. As ferramentas MCP do Chaos Code não funcionarão até ' +
      'que você ative o RAG.',
    readiness_mcpNotRegistered:
      'Para que os agentes funcionem, registre o MCP do Chaos Code no Claude Code:',
    readiness_ready: 'Pronto — este agente usa as ferramentas MCP do Chaos Code.',
    chaosCodeToggle_label: 'Otimizar para Chaos Code',
    chaosCodeToggle_description:
      'Injeta tools MCP essenciais + bloco \'Fluxo Chaos Code\' no system prompt + memory: ' +
      'project.',
  },
  configuracoes: {
    title: 'Configurações',
    subtitle: 'Configure o client, inteligência artificial e base de conhecimento.',
    tabsAria: 'Seções de configuração',
    tabs_client: 'Client',
    tabs_ai: 'Inteligência Artificial',
    tabs_images: 'Imagens',
    tabs_knowledgeBase: 'Base de Conhecimento',
    client_info: 'Informações',
    client_version: 'Versão',
    client_channel: 'Canal',
    language_title: 'Idioma',
    language_description: 'Idioma da interface do client.',
    language_label: 'Idioma da interface',
    sounds_title: 'Sons',
    sounds_description: 'Controla os sons emitidos pelo client (toasts e notificações).',
    sounds_enable: 'Habilitar sons',
    sounds_enableDesc: 'Toca um som curto a cada notificação (sucesso, erro, alerta, info).',
    update_title: 'Atualizações',
    update_autoCheck: 'Verificar atualizações automaticamente',
    update_autoCheckDesc: 'Verifica periodicamente se há novas versões.',
    update_autoInstall: 'Instalar automaticamente',
    update_autoInstallDesc: 'Baixa e instala atualizações sem confirmação.',
    update_interval: 'Intervalo de verificação',
    update_intervalDesc: 'Frequência de verificação automática.',
    update_intervals_15min: '15 minutos',
    update_intervals_30min: '30 minutos',
    update_intervals_1h: '1 hora',
    update_intervals_4h: '4 horas',
    update_checkNow: 'Verificar agora',
    update_checking: 'Verificando...',
    update_updateTo: (valores: {
      version: string | number;
    }): string =>
      'Atualizar para v' +
      valores.version,
    update_msixNotice:
      'Esta instalação foi feita pela Microsoft Store. As atualizações são gerenciadas pela ' +
      'Store — o updater interno está desativado para evitar que a versão volte ao reabrir o app.',
    update_shadowNsisWarning:
      'Detectamos uma instalação NSIS paralela do Chaos Code no seu sistema. Ela pode ter sido ' +
      'criada por uma tentativa anterior do updater interno (antes desta versão) e pode ' +
      'confundir você ao mostrar uma versão diferente da Microsoft Store. Recomendamos ' +
      'desinstalar pelo painel "Apps e recursos" do Windows.',
    update_shadowNsisOpenSettings: 'Abrir Apps e recursos',
    saveButton: 'Salvar Configurações',
    toast_title: 'Configurações',
    toast_aiSaved: 'Configuração de IA salva com sucesso.',
    toast_imagesSaved: 'Configurações de imagens salvas com sucesso.',
    toast_knowledgeSaved: 'Configurações da base de conhecimento salvas com sucesso.',
    embedder_title: 'Inteligência Artificial',
    embedder_subtitle: 'Configure embeddings e modelo de chat para o sistema RAG.',
    embedder_operationMode: 'Modo de Operação',
    embedder_modes_openai_compatible:
      'Conecta com APIs compatíveis OpenAI (OpenAI, Ollama, LM Studio, Azure). Requer endpoint e ' +
      'chave.',
    embedder_modes_gemini:
      'Usa a API Google AI (Gemini) para embeddings e chat. Requer API Key do AI Studio.',
    embedder_modes_openrouter:
      'Agregador com 200+ modelos (Claude, GPT, Llama, etc.). Chat via OpenRouter, embeddings ' +
      'via provedor separado.',
    embedder_modes_custom:
      'Aponte para o seu próprio proxy compatível com OpenAI (LiteLLM, Portkey, vLLM, gateway ' +
      'corporativo). Modelos em texto livre.',
    embedder_custom_baseUrl: 'URL base do proxy',
    embedder_custom_baseUrlHint:
      'Sem /v1 no final — o client acrescenta /v1/chat/completions e /v1/embeddings.',
    embedder_custom_apiKey: 'API Key do proxy',
    embedder_custom_apiKeyPlaceholder: 'sk-... (vazio se o proxy não exigir)',
    embedder_custom_apiKeyHint:
      'Enviada como Authorization: Bearer. Deixe vazio para proxies sem autenticação.',
    embedder_custom_headers: 'Cabeçalhos extras',
    embedder_custom_headersHint:
      'Opcional. Úteis para tags, times ou chaves virtuais exigidas pelo gateway.',
    embedder_custom_headerNamePlaceholder: 'Nome (ex.: x-litellm-tags)',
    embedder_custom_headerValuePlaceholder: 'Valor',
    embedder_custom_addHeader: 'Adicionar cabeçalho',
    embedder_custom_removeHeader: 'Remover cabeçalho',
    embedder_custom_chatModel: 'Modelo de Chat (LLM)',
    embedder_custom_chatModelPlaceholder: 'Nome do modelo no proxy',
    embedder_custom_chatModelHint:
      'Digite o nome exato como está registrado no proxy ou use "Listar modelos".',
    embedder_custom_listModels: 'Listar modelos',
    embedder_custom_listingModels: 'Listando...',
    embedder_custom_modelsLoaded: (valores: {
      count: string | number;
    }): string =>
      valores.count +
      ' modelo(s) disponíveis nas sugestões dos campos.',
    embedder_custom_testChat: 'Testar chat',
    embedder_custom_testingChat: 'Testando...',
    embedder_custom_sameTargetForEmbeddings: 'Usar a mesma URL e chave para embeddings',
    embedder_custom_embeddingModelPlaceholder: 'Nome do modelo de embedding',
    embedder_custom_embeddingModelHint: 'Também aceita sugestões de "Listar modelos".',
    embedder_custom_detectDimensions: 'Detectar',
    embedder_custom_detecting: 'Detectando...',
    embedder_custom_detectDimensionsHint: 'Gera um embedding de teste e preenche o valor real.',
    embedder_custom_detectDimensionsOk: (valores: {
      dims: string | number;
    }): string =>
      'Dimensões detectadas: ' +
      valores.dims,
    embedder_endpoint: 'Endpoint',
    embedder_endpointHint: 'Compatível com OpenAI, Ollama, LM Studio, Azure OpenAI, etc.',
    embedder_apiKey: 'API Key',
    embedder_apiKeyPlaceholder: 'sk-... (vazio para APIs locais)',
    embedder_apiKeyHintLocal: 'Deixe vazio para endpoints locais. Para OpenAI: ',
    embedder_embeddingModel: 'Modelo de Embedding',
    embedder_dimensions: 'Dimensões',
    embedder_embeddingDimensionsHint: 'Preenchido automaticamente ao trocar o modelo.',
    embedder_chatModel: 'Modelo de Chat (LLM)',
    embedder_chatModelHintSameApi: 'Usa a mesma API Key e endpoint configurados acima.',
    embedder_chatModelHintSameKey: 'Usa a mesma API Key configurada acima.',
    embedder_openrouterApiKey: 'API Key do OpenRouter',
    embedder_openrouterKeyHint: 'Obtenha sua chave em ',
    embedder_openrouterChatModel: 'Modelo de Chat (LLM)',
    embedder_openrouterChatHint:
      '200+ modelos disponíveis via OpenRouter. Os mais populares estão listados acima.',
    embedder_embeddingProvider: 'Provedor de Embeddings',
    embedder_embeddingProviderHint:
      'O OpenRouter não oferece API de embeddings. Configure um provedor separado abaixo (ex: ' +
      'OpenAI).',
    embedder_embeddingEndpoint: 'Endpoint de Embedding',
    embedder_embeddingEndpointHint: 'Endpoint compatível com OpenAI para embeddings.',
    embedder_embeddingApiKey: 'API Key de Embedding',
    embedder_embeddingApiKeyPlaceholder: 'sk-... (chave do provedor de embeddings)',
    embedder_embeddingApiKeyHint:
      'Chave do provedor de embeddings (pode ser diferente da chave do OpenRouter).',
    embedder_geminiKeyHint: 'Obtenha sua chave em ',
    embedder_geminiEmbeddingHint: '128-3072 via Matryoshka. Recomendado: 768, 1536, 3072.',
    embedder_validation_endpointRequired: 'Endpoint obrigatório',
    embedder_validation_geminiKeyRequired: 'API key obrigatória para Gemini',
    embedder_validation_openrouterKeyRequired: 'API key do OpenRouter obrigatória',
    embedder_validation_baseUrlRequired: 'URL base do proxy obrigatória',
    embedder_models_textEmbedding3Small: '1536d - Rápido e econômico',
    embedder_models_textEmbedding3Large: '3072d - Alta precisão',
    embedder_models_multilingual: '3072d - Matryoshka, 100+ idiomas',
    embedder_models_geminiFlash: 'Mais rápido e barato',
    embedder_models_gemini15Flash: 'Rápido, 1M ctx',
    embedder_models_gemini15FlashCoding: 'Coding, 1M ctx',
    embedder_models_gemini15Pro: '128K ctx',
    embedder_models_gemini20FlashThinking: 'Raciocínio, 200K ctx',
    embedder_models_gemini20ProThinking: 'Raciocínio, 200K ctx',
    embedder_models_openrouterGPT4oMini: 'Rápido, econômico',
    embedder_models_openrouterGPT4o: 'Equilibrado, 1M ctx',
    embedder_models_openrouterGPT45: 'Avançado, 1M ctx',
    embedder_models_openrouterClaude4Sonnet: 'Equilibrado, 200K ctx',
    embedder_models_openrouterClaude4Haiku: 'Rápido, 200K ctx',
    embedder_models_openrouterGeminiFlash: 'Rápido, 1M ctx',
    embedder_models_openrouterGeminiPro: 'Equilibrado, 1M ctx',
    embedder_models_openrouterLlama4Scout: 'Open source, 1M ctx',
    embedder_models_openrouterQwen3: 'Open source, 128K ctx',
    extraction_title: 'Extração de Conhecimento',
    extraction_subtitle: 'Configure como entidades e relações são extraídas dos documentos.',
    extraction_strategy: 'Estratégia de Extração',
    extraction_strategies_regex_label: 'Regex',
    extraction_strategies_regex_desc:
      'Extração rápida baseada em padrões de texto. Sem custo adicional.',
    extraction_strategies_llm_label: 'LLM',
    extraction_strategies_llm_desc:
      'Extração inteligente via IA. Mais precisa, consome créditos da API.',
    extraction_strategies_hybrid_label: 'Híbrido',
    extraction_strategies_hybrid_desc:
      'Combina regex + IA para máxima cobertura. Consome créditos da API.',
    extraction_llmWarning:
      'Configure um modelo de chat nas configurações de IA acima para usar esta estratégia.',
    extraction_advanced: 'Configurações Avançadas',
    extraction_maxEntities: 'Máximo de Entidades por Chunk',
    extraction_maxEntitiesHint:
      'Limita a quantidade de entidades extraídas de cada trecho de texto. Padrão: 50.',
    extraction_maxRelations: 'Máximo de Relações por Chunk',
    extraction_maxRelationsHint:
      'Limita a quantidade de relações extraídas de cada trecho de texto. Padrão: 100.',
    extraction_test_title: 'Testar Extração',
    extraction_test_hint:
      'Cole um texto de exemplo e clique em "Testar" para ver quantas entidades e relações são ' +
      'extraídas com a estratégia atual.',
    extraction_test_placeholder:
      'Cole aqui um trecho de texto para testar a extração.\n\nExemplo: "O Laravel é um ' +
      'framework PHP criado por Taylor Otwell..."',
    extraction_test_button: 'Testar Extração',
    imageApi_title: 'API de Imagens',
    imageApi_subtitle:
      'Configure as chaves de API para geração de imagens. Independente da configuração de ' +
      'embeddings.',
    imageApi_openai_hint: 'Modelos DALL-E 3 e DALL-E 2',
    imageApi_openai_endpoint: 'Endpoint',
    imageApi_openai_endpointHint: 'URL base da API. Compatível com proxies no formato OpenAI.',
    imageApi_openai_apiKey: 'Chave de API',
    imageApi_openai_showKey: 'Mostrar chave',
    imageApi_openai_hideKey: 'Ocultar chave',
    imageApi_openai_rpmLimit: 'Limite RPM',
    imageApi_openai_rpmHint: (valores: {
      effective: string | number;
      total: string | number;
    }): string =>
      'Requisições por minuto do provedor. O sistema usará ' +
      valores.effective +
      ' RPM (30% de ' +
      valores.total +
      ').',
    imageApi_gemini_hint: 'Modelos Nano Banana Flash e Pro',
    imageApi_gemini_apiKey: 'Chave de API',
    imageApi_gemini_showKey: 'Mostrar chave',
    imageApi_gemini_hideKey: 'Ocultar chave',
    imageApi_gemini_keyHint: 'Obtenha sua chave em ',
    imageApi_gemini_rpmLimit: 'Limite RPM',
    imageApi_gemini_rpmHint: (valores: {
      effective: string | number;
      total: string | number;
    }): string =>
      'Requisições por minuto do provedor. O sistema usará ' +
      valores.effective +
      ' RPM (30% de ' +
      valores.total +
      ').',
    pipeline_title: 'Pipeline RAG',
    pipeline_subtitle: 'Controle de concorrência e batching durante a sincronização de artigos.',
    pipeline_parallelExtraction: 'Extração Paralela',
    pipeline_parallelExtractionHint:
      'Quantidade de chunks extraídos simultaneamente (entidades e relações). Padrão: 12.',
    pipeline_parallelArticles: 'Artigos em Paralelo',
    pipeline_parallelArticlesHint:
      'Quantidade de artigos processados ao mesmo tempo durante o sync. Padrão: 5.',
    pipeline_embeddingConcurrency: 'Concorrência de Embeddings',
    pipeline_embeddingConcurrencyHint: 'Chamadas simultâneas de embedding permitidas. Padrão: 24.',
    pipeline_batchSize: 'Tamanho do Batch',
    pipeline_batchSizeHint:
      'Textos enviados por chamada de embedding. Valores maiores = menos chamadas. Padrão: 150.',
    pipeline_embeddingRpm: 'RPM máximo (embeddings)',
    pipeline_embeddingRpmHint:
      'Limite de requisições por minuto para a API de embeddings. Gemini free: ~60, Gemini paid: ' +
      '~1500, OpenAI: ~3000.',
    pipeline_embeddingRpmUsage: 'Margem de segurança (%)',
    pipeline_embeddingRpmUsageHint:
      'Porcentagem do RPM a usar efetivamente. 80% = margem de 20% para evitar erro 429.',
    pipeline_embeddingCacheSize: 'Cache de Embeddings',
    pipeline_embeddingCacheSizeHint:
      'Embeddings em cache (0 = desabilitado). ~6MB para 1000 entries.',
    pipeline_advanced: 'Avançado',
    pipeline_adaptive: 'Adaptive Retrieval',
    pipeline_adaptiveHint: 'Seleciona automaticamente local/global/hybrid baseado na query.',
    pipeline_rerank: 'Re-ranking via LLM',
    pipeline_rerankHint: 'Avalia relevância semântica dos resultados via LLM (+1-3s por query).',
    pipeline_rerankCandidates: 'Candidatos',
    pipeline_rerankTopK: 'Top K Final',
    pipeline_queryTransform: 'Query Expansion',
    pipeline_queryTransformHint: 'Gera sub-queries alternativas via LLM para melhorar recall.',
    pipeline_queryStrategy: 'Estratégia',
    pipeline_maxSubQueries: 'Sub-queries',
    pipeline_mmr: 'MMR (Diversificação)',
    pipeline_mmrHint: 'Reduz redundância nos resultados (0=diversidade, 1=relevância).',
    pipeline_reflexive: 'Loop Reflexivo',
    pipeline_reflexiveHint:
      'Refina busca automaticamente quando resultados são de baixa qualidade.',
    pipeline_maxIterations: 'Iterações',
    pipeline_minQuality: 'Score mín.',
    testPanel_title: 'Ações',
    testPanel_subtitle: 'Salve todas as configurações ou teste a conexão com o embedder.',
    testPanel_testConnection: 'Testar Conexão',
    testPanel_testing: 'Testando...',
  },
  atualizacao: {
    modal_checking: 'Verificando atualização...',
    modal_connectingServer: 'Conectando ao servidor',
    modal_error: 'Erro na atualização',
    modal_installing: 'Instalando...',
    modal_downloading: 'Baixando atualização...',
    modal_stallWarning: 'Conexão lenta ou perdida. O download pode estar parado.',
    modal_autoRestart: 'O aplicativo será reiniciado automaticamente.',
    modal_minimize: 'Minimizar',
    modal_available: 'Atualização disponível',
    modal_forceRequired: 'Esta atualização é obrigatória',
    modal_installAndRestart: 'Instalar e reiniciar',
    modal_later: 'Depois',
    modal_linuxDebTitle: 'Atualização via .deb',
    modal_linuxDebMessage:
      'Você instalou o Chaos Code pelo pacote .deb. Atualize pelo terminal ou baixe o novo .deb ' +
      'em chaoscode.ai.',
    modal_linuxDebCommand: 'sudo apt update && sudo apt upgrade chaos-code-v3-client',
    modal_linuxDebOpenSite: 'Abrir site',
    modal_linuxDebCopyCommand: 'Copiar comando',
    modal_msixTitle: 'Atualização via Microsoft Store',
    modal_msixOpenStore: 'Abrir Microsoft Store',
    modal_msixMessage:
      'Você instalou o Chaos Code pela Microsoft Store. Atualizações são gerenciadas pela ' +
      'própria Store — abra a página do app e clique em "Atualizar". O updater interno está ' +
      'desativado nesta instalação para evitar que a versão volte ao reabrir o app.',
    errors_installFailed: (valores: {
      error: string | number;
    }): string =>
      'Erro ao instalar atualização: ' +
      valores.error,
    errors_checkFailed: (valores: {
      error: string | number;
    }): string =>
      'Erro ao verificar: ' +
      valores.error,
    toast_title: 'Atualização',
    toast_incomplete: 'A última atualização pode não ter sido concluída corretamente.',
    toast_checkingTitle: 'Verificando atualizações',
    toast_checkingDesc: 'Consultando o servidor...',
    toast_noUpdate: 'Nenhuma atualização',
    toast_noUpdateDesc: (valores: {
      version: string | number;
    }): string =>
      'Você já está na versão mais recente (v' +
      valores.version +
      ').',
    toast_available: 'Atualização disponível',
    toast_availableDesc: (valores: {
      version: string | number;
    }): string =>
      'Versão ' +
      valores.version +
      ' disponível para instalação.',
    toast_checkError: 'Erro ao verificar',
  },
  wsl: {
    sectionTitle: 'WSL2 / Modo MCP',
    notApplicable: 'Esta configuração só se aplica ao Windows com WSL2.',
    notInstalled: 'WSL2 não detectado neste sistema.',
    configured: 'Configurado',
    notConfigured:
      'O localhostForwarding do WSL2 não está configurado. O servidor MCP (localhost:19850) pode ' +
      'não ser acessível pelo WSL2.',
    configureAction: 'Configurar automaticamente',
    confirmTitle: 'Configurar WSL2 localhostForwarding',
    confirmMessage: 'O WSL2 será reiniciado. As seguintes distros em execução serão encerradas:',
    confirmNoDistros:
      'O arquivo .wslconfig será criado/atualizado com localhostForwarding=true. Nenhuma distro ' +
      'em execução será afetada.',
    applying: 'Configurando...',
    success:
      'WSL2 configurado com sucesso com localhostForwarding. O servidor MCP agora está acessível ' +
      'pelo WSL2.',
    error: 'Erro ao configurar o WSL2',
    warningToast:
      'O localhostForwarding do WSL2 não está configurado. O servidor MCP pode não ser acessível ' +
      'pelo WSL2. Acesse Configurações para corrigir.',
    dismiss: 'Não mostrar novamente',
  },
} as const;
