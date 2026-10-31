-- Esquema do banco SQLite do servidor local do Chaos Code (SERVIDOR.7).
--
-- Convenções:
-- * Tabelas STRICT: o SQLite recusa valor de tipo errado em vez de converter calado.
-- * Datas em segundos Unix (INTEGER): comparar validade é uma conta simples, sem fuso.
--   As validades vêm de constantes.py (código 60 s, acesso 1 h, renovação 30 dias).
-- * Senhas, códigos e tokens: só o HASH vai para o banco; vazar o arquivo não entrega acesso.
-- * Listas (tags, URIs, itens) em TEXT com JSON validado por CHECK.
-- * Nomes de tabela iguais aos de constantes.py (TABELA_*).
-- * O script é idempotente (IF NOT EXISTS): a conexão (SERVIDOR.8) pode rodá-lo a cada início.

-- Vale só para a conexão atual; a SERVIDOR.8 também liga a cada conexão aberta.
PRAGMA foreign_keys = ON;

-- Usuários da tela de cadastro. Admin só pelo comando criar-admin (eh_admin = 1).
CREATE TABLE IF NOT EXISTS usuarios (
    id             TEXT    PRIMARY KEY,                      -- UUID; vira UsuarioApi.id
    email          TEXT    NOT NULL COLLATE NOCASE UNIQUE,   -- e-mail único sem diferenciar caixa
    nome           TEXT    NOT NULL,
    hash_senha     TEXT    NOT NULL,                         -- scrypt (SERVIDOR.9); nunca a senha
    eh_admin       INTEGER NOT NULL DEFAULT 0,
    criado_em      INTEGER NOT NULL DEFAULT (unixepoch()),
    atualizado_em  INTEGER NOT NULL DEFAULT (unixepoch()),
    ultimo_login_em INTEGER,
    CHECK (eh_admin IN (0, 1)),
    CHECK (length(trim(nome)) > 0),
    CHECK (instr(email, '@') > 1),
    CHECK (length(hash_senha) > 0)
) STRICT;

-- Clientes OAuth do registro dinâmico (RFC 7591). Só cliente público: sem segredo guardado.
CREATE TABLE IF NOT EXISTS clientes_oauth (
    id_cliente            TEXT    PRIMARY KEY,               -- client_id emitido pelo servidor
    nome_cliente          TEXT    NOT NULL,                  -- client_name
    uris_redirecionamento TEXT    NOT NULL,                  -- redirect_uris (JSON array)
    metodo_autenticacao   TEXT    NOT NULL DEFAULT 'none',   -- token_endpoint_auth_method
    concessoes            TEXT    NOT NULL                   -- grant_types (JSON array)
        DEFAULT '["authorization_code","refresh_token"]',
    tipos_resposta        TEXT    NOT NULL DEFAULT '["code"]', -- response_types (JSON array)
    criado_em             INTEGER NOT NULL DEFAULT (unixepoch()),
    CHECK (metodo_autenticacao = 'none'),
    CHECK (json_valid(uris_redirecionamento)
           AND json_type(uris_redirecionamento) = 'array'
           AND json_array_length(uris_redirecionamento) > 0),
    CHECK (json_valid(concessoes) AND json_type(concessoes) = 'array'),
    CHECK (json_valid(tipos_resposta) AND json_type(tipos_resposta) = 'array')
) STRICT;

-- Códigos de autorização: uso único, validade curta e PKCE S256 obrigatório (RFC 7636).
CREATE TABLE IF NOT EXISTS codigos_autorizacao (
    hash_codigo          TEXT    PRIMARY KEY,                -- SHA-256 do code (SERVIDOR.10)
    id_cliente           TEXT    NOT NULL
        REFERENCES clientes_oauth (id_cliente) ON DELETE CASCADE,
    id_usuario           TEXT    NOT NULL
        REFERENCES usuarios (id) ON DELETE CASCADE,
    uri_redirecionamento TEXT    NOT NULL,                   -- precisa bater na troca do código
    desafio_codigo       TEXT    NOT NULL,                   -- code_challenge
    metodo_desafio       TEXT    NOT NULL DEFAULT 'S256',    -- code_challenge_method
    escopo               TEXT,                               -- ex.: "mcp:read mcp:write"
    criado_em            INTEGER NOT NULL DEFAULT (unixepoch()),
    expira_em            INTEGER NOT NULL,
    usado_em             INTEGER,                            -- preenchido no 1º uso: barra o 2º
    CHECK (metodo_desafio = 'S256'),
    -- S256 = SHA-256 em base64url sem "=": sempre 43 caracteres.
    CHECK (length(desafio_codigo) = 43),
    CHECK (expira_em > criado_em),
    CHECK (usado_em IS NULL OR usado_em >= criado_em)
) STRICT;

-- Limpeza periódica dos vencidos.
CREATE INDEX IF NOT EXISTS idx_codigos_expira_em ON codigos_autorizacao (expira_em);
CREATE INDEX IF NOT EXISTS idx_codigos_usuario ON codigos_autorizacao (id_usuario);
CREATE INDEX IF NOT EXISTS idx_codigos_cliente ON codigos_autorizacao (id_cliente);

-- Tokens de acesso e de renovação, um por linha. "familia" agrupa tudo que nasceu do mesmo
-- código: se uma renovação já girada for reapresentada, a família inteira é revogada.
CREATE TABLE IF NOT EXISTS tokens (
    id             INTEGER PRIMARY KEY,
    hash_token     TEXT    NOT NULL UNIQUE,                  -- SHA-256; o token só sai na resposta
    tipo           TEXT    NOT NULL,                         -- 'acesso' ou 'renovacao'
    familia        TEXT    NOT NULL,
    id_cliente     TEXT    NOT NULL
        REFERENCES clientes_oauth (id_cliente) ON DELETE CASCADE,
    id_usuario     TEXT    NOT NULL
        REFERENCES usuarios (id) ON DELETE CASCADE,
    escopo         TEXT,
    criado_em      INTEGER NOT NULL DEFAULT (unixepoch()),
    expira_em      INTEGER NOT NULL,
    revogado_em    INTEGER,                                  -- revogação (RFC 7009) ou logout
    substituido_em INTEGER,                                  -- renovação girada (SERVIDOR.37)
    CHECK (tipo IN ('acesso', 'renovacao')),
    CHECK (expira_em > criado_em),
    -- Só a renovação é girada; token de acesso apenas vence ou é revogado.
    CHECK (substituido_em IS NULL OR tipo = 'renovacao')
) STRICT;

CREATE INDEX IF NOT EXISTS idx_tokens_familia ON tokens (familia);
CREATE INDEX IF NOT EXISTS idx_tokens_usuario ON tokens (id_usuario);
CREATE INDEX IF NOT EXISTS idx_tokens_cliente ON tokens (id_cliente);
CREATE INDEX IF NOT EXISTS idx_tokens_expira_em ON tokens (expira_em);

-- Projetos da plataforma. Cada projeto tem um dono; papel e permissões (ProjetoApi.role,
-- project_role_*, permissions) são montados pela rota a partir do dono (inferido no inventário).
CREATE TABLE IF NOT EXISTS projetos (
    id            TEXT    PRIMARY KEY,                       -- UUID; vira ProjetoApi.id
    id_dono       TEXT    NOT NULL
        REFERENCES usuarios (id) ON DELETE CASCADE,          -- sem dono, o projeto some
    nome          TEXT    NOT NULL,                          -- name
    descricao     TEXT    NOT NULL DEFAULT '',               -- description
    criado_em     INTEGER NOT NULL DEFAULT (unixepoch()),
    atualizado_em INTEGER NOT NULL DEFAULT (unixepoch()),
    CHECK (length(trim(nome)) > 0)
) STRICT;

-- Listagem "projetos do usuário" (/api/oauth/user/projects).
CREATE INDEX IF NOT EXISTS idx_projetos_dono ON projetos (id_dono, nome);

-- Tarefas do projeto (ApiTask). Exclusão vai para a lixeira: apagada_em permite restaurar
-- ("moved to trash. Can be restored" e rota /restore no inventário).
CREATE TABLE IF NOT EXISTS tarefas (
    id              TEXT    PRIMARY KEY,                     -- UUID
    id_projeto      TEXT    NOT NULL
        REFERENCES projetos (id) ON DELETE CASCADE,
    titulo          TEXT    NOT NULL,                        -- title
    descricao       TEXT    NOT NULL DEFAULT '',             -- description
    situacao        TEXT    NOT NULL DEFAULT 'todo',         -- status (valores inferidos)
    prioridade      TEXT    NOT NULL DEFAULT 'medium',       -- priority (valores inferidos)
    itens           TEXT    NOT NULL DEFAULT '[]',           -- items: [{text, completed}]
    horas_estimadas REAL    NOT NULL DEFAULT 0,              -- estimated_hours
    tags            TEXT    NOT NULL DEFAULT '[]',
    -- Responsável e sprint vivem fora deste servidor: sem chave estrangeira.
    id_responsavel  TEXT,                                    -- assignee_id
    id_sprint       TEXT,                                    -- sprint_id
    iniciada_em     INTEGER,                                 -- started_at
    concluida_em    INTEGER,                                 -- completed_at
    criado_em       INTEGER NOT NULL DEFAULT (unixepoch()),
    atualizado_em   INTEGER NOT NULL DEFAULT (unixepoch()),
    apagada_em      INTEGER,
    CHECK (length(trim(titulo)) > 0),
    CHECK (length(situacao) > 0 AND length(prioridade) > 0),
    CHECK (horas_estimadas >= 0),
    CHECK (json_valid(itens) AND json_type(itens) = 'array'),
    CHECK (json_valid(tags) AND json_type(tags) = 'array'),
    CHECK (concluida_em IS NULL OR iniciada_em IS NULL OR concluida_em >= iniciada_em)
) STRICT;

-- Listagem paginada com filtros (?status=&priority=) só das que não estão na lixeira.
CREATE INDEX IF NOT EXISTS idx_tarefas_projeto
    ON tarefas (id_projeto, situacao, prioridade, criado_em)
    WHERE apagada_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_tarefas_lixeira
    ON tarefas (id_projeto, apagada_em)
    WHERE apagada_em IS NOT NULL;

-- Imagens do projeto (ApiProjectImage / PlatformImageStatus). O arquivo fica em dados/imagens/;
-- no banco só os metadados e o caminho relativo; storage_url/thumbnail_url saem da rota.
CREATE TABLE IF NOT EXISTS imagens (
    id                 TEXT    PRIMARY KEY,                  -- UUID
    id_projeto         TEXT    NOT NULL
        REFERENCES projetos (id) ON DELETE CASCADE,
    id_usuario         TEXT
        REFERENCES usuarios (id) ON DELETE SET NULL,         -- quem enviou; a imagem fica
    situacao           TEXT    NOT NULL DEFAULT 'completed', -- status (valores inferidos)
    nome_arquivo       TEXT    NOT NULL,                     -- filename
    caminho_arquivo    TEXT    NOT NULL UNIQUE,              -- relativo a dados/imagens/
    caminho_miniatura  TEXT,
    tipo_mime          TEXT    NOT NULL,
    tamanho_bytes      INTEGER NOT NULL,
    prompt_original    TEXT    NOT NULL DEFAULT '',          -- original_prompt
    prompt_negativo    TEXT,                                 -- negative_prompt
    versao_modelo      TEXT    NOT NULL DEFAULT '',          -- model_version
    semente            INTEGER,                              -- seed
    tempo_geracao_ms   INTEGER NOT NULL DEFAULT 0,           -- generation_time_ms
    largura            INTEGER NOT NULL DEFAULT 0,           -- width
    altura             INTEGER NOT NULL DEFAULT 0,           -- height
    tags               TEXT    NOT NULL DEFAULT '[]',
    mensagem_erro      TEXT,                                 -- error_message
    criado_em          INTEGER NOT NULL DEFAULT (unixepoch()),
    -- Caminho relativo e sem ".." evita ler/gravar fora de dados/imagens/.
    CHECK (instr(caminho_arquivo, '..') = 0 AND substr(caminho_arquivo, 1, 1) NOT IN ('/', '\')),
    CHECK (caminho_miniatura IS NULL OR instr(caminho_miniatura, '..') = 0),
    CHECK (tipo_mime LIKE 'image/%'),
    CHECK (tamanho_bytes > 0),
    CHECK (tempo_geracao_ms >= 0 AND largura >= 0 AND altura >= 0),
    CHECK (json_valid(tags) AND json_type(tags) = 'array')
) STRICT;

-- Galeria: mais recentes primeiro, com filtro por situação.
CREATE INDEX IF NOT EXISTS idx_imagens_projeto ON imagens (id_projeto, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_imagens_projeto_situacao ON imagens (id_projeto, situacao);
CREATE INDEX IF NOT EXISTS idx_imagens_usuario ON imagens (id_usuario);

-- Modelos de agente (/api/client/agent-templates). Globais, mantidos pelo admin; a carga
-- inicial (SERVIDOR.23) usa os ids do JSON embutido, por isso id é TEXT livre.
CREATE TABLE IF NOT EXISTS modelos_agente (
    id            TEXT    PRIMARY KEY,
    categoria     TEXT    NOT NULL,                          -- category
    titulo        TEXT    NOT NULL,                          -- title
    descricao     TEXT    NOT NULL,                          -- description
    tags          TEXT    NOT NULL DEFAULT '[]',
    frontmatter   TEXT    NOT NULL,                          -- objeto JSON (name, model, color…)
    prompt_sistema TEXT   NOT NULL,                          -- systemPrompt
    ordem         INTEGER NOT NULL DEFAULT 0,                -- ordem de exibição
    ativo         INTEGER NOT NULL DEFAULT 1,                -- desativar sem apagar
    criado_em     INTEGER NOT NULL DEFAULT (unixepoch()),
    atualizado_em INTEGER NOT NULL DEFAULT (unixepoch()),
    -- Mesmas categorias de CategoriaModeloAgente (esquemas/api.py).
    CHECK (categoria IN ('review', 'testing', 'docs', 'refactor', 'debug',
                         'workflow', 'research', 'integration', 'security')),
    CHECK (length(trim(titulo)) > 0),
    CHECK (ativo IN (0, 1)),
    CHECK (json_valid(tags) AND json_type(tags) = 'array'),
    CHECK (json_valid(frontmatter) AND json_type(frontmatter) = 'object')
) STRICT;

-- Filtro ?category= da rota, só os ativos.
CREATE INDEX IF NOT EXISTS idx_modelos_agente_categoria
    ON modelos_agente (categoria, ordem)
    WHERE ativo = 1;
