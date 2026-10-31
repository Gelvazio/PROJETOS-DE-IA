/**
 * Tipos do login OAuth, dos tokens guardados e do aparelho (inventário CLONE.1.5,
 * `docs/inventario/login.md`). Os tipos de pedido e resposta do servidor (registro, token e
 * revogação) ficam em `tipos-api.ts` e são reexportados aqui. As constantes do OAuth ficam em
 * `constantes.ts`. Campos *inferidos* ainda não foram confirmados no Ghidra.
 */

export type {
  DadosRegistroCliente,
  PedidoRegistroCliente,
  PedidoRevogacaoToken,
  PedidoToken,
  RespostaRegistroCliente,
  RespostaToken,
  TipoConcessaoOAuth,
} from './tipos-api';

/** Credenciais do cliente público, gravadas em `oauth_client.json` (`OAuthClientCredentials`). */
export interface CredenciaisClienteOAuth {
  client_id: string;
  platform_url: string;
  /** Muda a cada login (porta efêmera); se mudar, o cliente é registrado de novo. */
  redirect_uri: string;
}

/** Tokens guardados no cofre (`AuthTokens`; 2º e 3º campos *inferidos*). */
export interface TokensGuardados {
  access_token: string;
  refresh_token: string;
  /** Instante de vencimento do access token (*inferido*: calculado de `expires_in`). */
  expires_at: number;
}

/** Envelope cifrado de `auth_tokens.json` (`EncryptedEnvelope`). */
export interface EnvelopeTokensCifrado {
  /** Versão do formato do envelope. */
  v: number;
  /** Nonce + texto cifrado de `TokensGuardados`, em base64 (*inferido*). */
  data: string;
}

/** Parâmetros que o callback local recebe do navegador (`src/auth/callback.rs`). */
export interface ParametrosCallbackOAuth {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

/** Os 5 campos do aparelho enviados à plataforma (`device::fingerprint`). */
export interface DadosAparelho {
  device_uuid: string;
  device_hostname: string;
  device_mac_address: string;
  device_os_info: string;
  device_client_version: string;
}

/** Conteúdo de `device_id.json`. */
export interface ArquivoIdentificacaoAparelho {
  device_uuid: string;
}

/** Situações do login mostradas na interface. */
export type SituacaoLogin = 'nao_logado' | 'entrando' | 'logado' | 'sessao_expirada';

/** Estado do login (estrutura do clone; não existe como struct no original). */
export interface EstadoLogin {
  situacao: SituacaoLogin;
  /** Mensagem de erro do último login ou renovação, se houve. */
  erro: string | null;
  /** Quando o access token vence, se logado. */
  expira_em: number | null;
}

/** Método do desafio PKCE aceito pelo clone (igual ao original: só `S256`). */
export type MetodoPkce = 'S256';

/** Dados PKCE e `state` de um login (gerados em `src/main/login/pkce.ts`). */
export interface ParametrosPkce {
  /** Segredo guardado só no app e enviado na troca do código. */
  code_verifier: string;
  /** SHA-256 do `code_verifier` em base64url sem `=`, enviado na URL de autorização. */
  code_challenge: string;
  code_challenge_method: MetodoPkce;
  /** Valor aleatório conferido no callback contra CSRF. */
  state: string;
}
