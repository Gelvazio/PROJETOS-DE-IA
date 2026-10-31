"""Esquemas do OAuth 2.0 (RFC 6749, RFC 7591 e RFC 7009).

Os nomes dos campos seguem o português do projeto; o `alias` mantém o nome que o protocolo exige
no JSON (ex.: `client_id`), para que o clone e o servidor falem o mesmo formato.
"""

from pydantic import BaseModel, ConfigDict, Field

# Valores padrão do registro de cliente (RFC 7591)
METODO_AUTENTICACAO_PUBLICO = 'none'
CONCESSOES_PADRAO = ['authorization_code', 'refresh_token']
TIPOS_RESPOSTA_PADRAO = ['code']

# Tipo do token devolvido pelo servidor (RFC 6749)
TIPO_TOKEN_PADRAO = 'Bearer'


class PedidoRegistroCliente(BaseModel):
    """Pedido de registro de cliente (`POST /api/oauth/register`, RFC 7591)."""

    model_config = ConfigDict(populate_by_name=True)

    nome_cliente: str = Field(alias='client_name')
    uris_redirecionamento: list[str] = Field(alias='redirect_uris')
    metodo_autenticacao: str = Field(
        default=METODO_AUTENTICACAO_PUBLICO, alias='token_endpoint_auth_method'
    )
    concessoes: list[str] = Field(
        default_factory=lambda: list(CONCESSOES_PADRAO), alias='grant_types'
    )
    tipos_resposta: list[str] = Field(
        default_factory=lambda: list(TIPOS_RESPOSTA_PADRAO), alias='response_types'
    )


class RespostaRegistroCliente(BaseModel):
    """Resposta do registro de cliente, com o `client_id` emitido pelo servidor."""

    model_config = ConfigDict(populate_by_name=True)

    id_cliente: str = Field(alias='client_id')
    nome_cliente: str = Field(alias='client_name')
    uris_redirecionamento: list[str] = Field(alias='redirect_uris')
    metodo_autenticacao: str = Field(alias='token_endpoint_auth_method')
    concessoes: list[str] = Field(alias='grant_types')
    tipos_resposta: list[str] = Field(alias='response_types')


class RespostaToken(BaseModel):
    """Resposta do endpoint de token (RFC 6749, seção 5.1)."""

    model_config = ConfigDict(populate_by_name=True)

    token_acesso: str = Field(alias='access_token')
    tipo_token: str = Field(default=TIPO_TOKEN_PADRAO, alias='token_type')
    expira_em: int = Field(alias='expires_in')
    token_renovacao: str | None = Field(default=None, alias='refresh_token')
    escopo: str | None = Field(default=None, alias='scope')


class PedidoRevogacao(BaseModel):
    """Pedido de revogação de token (`POST /api/oauth/revoke`, RFC 7009)."""

    model_config = ConfigDict(populate_by_name=True)

    token: str = Field(alias='token')
    dica_tipo_token: str | None = Field(default=None, alias='token_type_hint')
    id_cliente: str | None = Field(default=None, alias='client_id')


class ErroOAuth(BaseModel):
    """Erro devolvido pelo servidor no formato do OAuth (RFC 6749, seção 5.2)."""

    model_config = ConfigDict(populate_by_name=True)

    codigo_erro: str = Field(alias='error')
    descricao_erro: str | None = Field(default=None, alias='error_description')
