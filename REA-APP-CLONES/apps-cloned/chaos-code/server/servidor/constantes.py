"""Constantes do servidor local do clone do Chaos Code.

Valores fixos usados pelas demais partes do servidor: rede, validades,
tabelas do banco, pastas de dados e rotas. Nenhum outro arquivo deve
repetir esses valores.
"""

from pathlib import Path

# Rede: o servidor só escuta no próprio computador.
HOST_PADRAO = "127.0.0.1"
PORTA_PADRAO = 3000

# Validades, em segundos.
VALIDADE_CODIGO_SEGUNDOS = 60
VALIDADE_TOKEN_ACESSO_SEGUNDOS = 60 * 60
VALIDADE_TOKEN_RENOVACAO_SEGUNDOS = 30 * 24 * 60 * 60

# Pastas e arquivos de dados (relativos à pasta `server/`).
PASTA_SERVIDOR = Path(__file__).resolve().parent.parent
PASTA_DADOS_PADRAO = PASTA_SERVIDOR / "dados"
NOME_ARQUIVO_BANCO = "servidor.sqlite3"
NOME_PASTA_IMAGENS = "imagens"
NOME_ARQUIVO_CHAVE_SESSAO = "chave_sessao.txt"

# Variáveis de ambiente lidas pela configuração.
PREFIXO_VARIAVEL_AMBIENTE = "CHAOS_SERVIDOR_"

# Banco SQLite: esquema idempotente, diário WAL e espera por trava (ms).
NOME_ARQUIVO_ESQUEMA = "esquema.sql"
MODO_DIARIO_BANCO = "WAL"
TEMPO_ESPERA_TRAVA_BANCO_MS = 5000

# Tabelas do banco SQLite.
TABELA_USUARIOS = "usuarios"
TABELA_CLIENTES_OAUTH = "clientes_oauth"
TABELA_CODIGOS_AUTORIZACAO = "codigos_autorizacao"
TABELA_TOKENS = "tokens"
TABELA_PROJETOS = "projetos"
TABELA_TAREFAS = "tarefas"
TABELA_IMAGENS = "imagens"
TABELA_MODELOS_AGENTE = "modelos_agente"

# Rotas de descoberta e OAuth.
ROTA_DESCOBERTA_OAUTH = "/.well-known/oauth-authorization-server"
ROTA_OAUTH_REGISTRO = "/api/oauth/register"
ROTA_OAUTH_AUTORIZACAO = "/authorize"
ROTA_OAUTH_TOKEN = "/api/oauth/token"
ROTA_OAUTH_REVOGACAO = "/api/oauth/revoke"
ROTA_OAUTH_PROJETOS_USUARIO = "/api/oauth/user/projects"

# Rotas da API.
ROTA_API_PROJETOS = "/api/projects"
ROTA_API_MODELOS_AGENTE = "/api/client/agent-templates"
ROTA_ATUALIZADOR = "/releases/latest.json"

# Rotas das telas.
ROTA_TELA_LOGIN = "/login"
ROTA_TELA_CADASTRO = "/cadastro"

# Cookie da sessão do navegador.
NOME_COOKIE_SESSAO = "chaos_sessao"

# Método de desafio aceito no PKCE.
METODO_PKCE = "S256"

# Escopos OAuth vistos no original (consentimento do login).
ESCOPO_MCP_LEITURA = "mcp:read"
ESCOPO_MCP_ESCRITA = "mcp:write"
TIPO_RESPOSTA_CODIGO = "code"
CONCESSAO_CODIGO_AUTORIZACAO = "authorization_code"
CONCESSAO_RENOVACAO = "refresh_token"
METODO_AUTENTICACAO_CLIENTE_PUBLICO = "none"

# Rotas OAuth em JSON: erros nelas usam o formato do RFC 6749.
PREFIXO_ROTAS_OAUTH = "/api/oauth/"

# Manifesto do atualizador: o arquivo da pasta de dados vence o exemplo de `dados_iniciais/`.
NOME_ARQUIVO_LATEST = "latest.json"
PASTA_DADOS_INICIAIS = PASTA_SERVIDOR / "dados_iniciais"

# Tokens e códigos (SERVIDOR.10): bytes aleatórios antes do base64url de `secrets.token_urlsafe`.
# O inventário não mostra prefixo nos tokens da plataforma (os `mcp_at_`/`mcp_rt_` são do servidor
# MCP do próprio cliente), então os tokens não levam prefixo.
BYTES_TOKEN_ACESSO = 32
BYTES_TOKEN_RENOVACAO = 48
BYTES_CODIGO_AUTORIZACAO = 32
BYTES_TOKEN_CSRF = 32
BYTES_FAMILIA_TOKENS = 16
TAMANHO_MAXIMO_TOKEN_RECEBIDO = 512
ALGORITMO_HASH_TOKEN = "sha256"
CODIFICACAO_TOKEN = "utf-8"
TIPO_TOKEN_BEARER = "Bearer"
