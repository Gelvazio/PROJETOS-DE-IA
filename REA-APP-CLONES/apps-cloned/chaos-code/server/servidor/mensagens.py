"""Textos das telas (login, cadastro, consentimento) e das mensagens de erro do servidor.

Ficam aqui, num lugar só, para que as rotas e os modelos não tenham texto fixo espalhado.
"""

# Tela de login
MSG_LOGIN_TITULO = 'Entrar'
MSG_LOGIN_EMAIL = 'E-mail'
MSG_LOGIN_SENHA = 'Senha'
MSG_LOGIN_BOTAO = 'Entrar'
MSG_LOGIN_LINK_CADASTRO = 'Não tem conta? Cadastre-se'

# Tela de cadastro
MSG_CADASTRO_TITULO = 'Criar conta'
MSG_CADASTRO_NOME = 'Nome'
MSG_CADASTRO_BOTAO = 'Criar conta'
MSG_CADASTRO_LINK_LOGIN = 'Já tem conta? Entrar'

# Tela de consentimento (autorização do aplicativo)
MSG_CONSENTIMENTO_TITULO = 'Autorizar aplicativo'
MSG_CONSENTIMENTO_PERGUNTA = 'Deseja permitir que este aplicativo acesse a sua conta?'
MSG_CONSENTIMENTO_PERMITIR = 'Permitir'
MSG_CONSENTIMENTO_NEGAR = 'Negar'

# Tela de erro genérica
MSG_ERRO_TITULO = 'Algo deu errado'
MSG_ERRO_VOLTAR = 'Voltar ao início'

# Mensagens de erro devolvidas pela API e pelas telas
MSG_ERRO_CREDENCIAIS_INVALIDAS = 'E-mail ou senha incorretos.'
MSG_ERRO_EMAIL_JA_CADASTRADO = 'Já existe uma conta com este e-mail.'
MSG_ERRO_CAMPO_OBRIGATORIO = 'Preencha todos os campos obrigatórios.'
MSG_ERRO_TOKEN_INVALIDO = 'Token inválido ou expirado.'
MSG_ERRO_NAO_AUTORIZADO = 'Você precisa entrar para acessar este recurso.'
MSG_ERRO_ACESSO_NEGADO = 'Você não tem permissão para esta ação.'
MSG_ERRO_NAO_ENCONTRADO = 'Recurso não encontrado.'
MSG_ERRO_MUITAS_TENTATIVAS = 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'
MSG_ERRO_CODIGO_PKCE_INVALIDO = 'Verificação PKCE inválida.'
MSG_ERRO_INTERNO = 'Erro interno do servidor.'
