# Inventário — login OAuth, cofre e aparelho do Chaos Code v3 (CLONE.1.5)

Feito por Claude Code (Opus 5.5 · herdr op3; líder Opus 5.5) (local · main) em 2026-10-18.
Mapa dos módulos: [`modulos.md`](modulos.md) · comandos da interface: [`comandos.md`](comandos.md).

## Método (análise estática, nada executado)

- Alvo: `apps-to-be-clone/chaos-code-v3-client.exe`, SHA-256 `46dab592…` (o mesmo de `modulos.md`).
- Leitura das strings do Rust (logs, caminhos `src\…\*.rs`, nomes de campos `serde`) e
  desmontagem pontual com **capstone** (instalado na pasta temporária da subtarefa, fora do
  repositório). O Ghidra pelo REA estourou o tempo de análise (330 s) e não foi usado.
- **Endereços:** "arq." = deslocamento no arquivo; em `.rdata`, **VA = arq. + `0x140001000`**;
  em `.text`, VA = arq. + `0x140000c00`. Endereços de **código** abaixo já estão em VA.
  Limites de função tirados da tabela `.pdata` do PE.
- *(inferido)* = não comprovado no código; o resto tem string ou instrução que comprova.
- ⛔ **Nenhum segredo foi copiado.** Há bytes constantes perto do cofre (arq. `0x88fbb2` e
  `0x88fca5`, provável material do HKDF) — só o deslocamento está aqui.

## Endpoints e parâmetros

| Item | Valor | Evidência (arq.) |
|---|---|---|
| Plataforma | `https://chaoscode.ai` (a CSP também libera `https://staging.chaoscode.ai`) | `0x822da2`, `0x8aa324` |
| Registro dinâmico do cliente | `POST /api/oauth/register` | `0x80f307` |
| Tela de autorização | `/oauth/consent` | `0x822c7a` |
| Troca e renovação | `POST /api/oauth/token` | `0x822c8b` |
| Revogação | `POST /api/oauth/revoke` | `0x822c9e` |
| Escopo pedido | `mcp:read mcp:write` | `0x822ce0` |
| Callback local | `http://127.0.0.1:<porta>/callback` | `0x822cb1`, `0x822cc4`, `0x810a51` |
| Cache do cliente | `oauth_client.json` | `0x822dae` |

URL de autorização montada pelo app (arq. `0x822cf4`–`0x822d5a`):

```
<plataforma>/oauth/consent?response_type=code&client_id=<id>&redirect_uri=<uri>
  &code_challenge=<desafio>&code_challenge_method=S256&state=<state>&scope=mcp:read mcp:write
```

## Passo a passo do login (`start_login` → `commands::auth` + `auth::*`)

Função principal: VA `0x1400a466d`–`0x1400a8506` (async de `commands::auth`; refere
`127.0.0.1:0` em `0x1400a4aa2`, `/callback` em `0x1400a4e64`, "Callback server escutando na
porta" em `0x1400a4f52` e monta `device_uuid` em `0x1400a723f`).

1. **Plataforma no ar?** Testa a URL base ("Plataforma acessível em" / "Plataforma inacessível
   em … Verifique se o servidor está rodando", arq. `0x80f649`–`0x80f6c1`).
2. **Callback local:** sobe um servidor HTTP em **`127.0.0.1:0`** — a **porta é escolhida pelo
   sistema** (efêmera) a cada login (arq. `0x80f72e`; log "Callback server escutando na porta",
   `0x8109e8`). Rota `/callback` (`0x80f780`). Antes de seguir, confere se responde ("Callback
   server verificado na porta" / "não está respondendo", `0x810e58`, `0x810e98`).
3. **Cliente OAuth:** lê `oauth_client.json`. Se existir e o `redirect_uri` for o mesmo, reusa
   ("Reutilizando client OAuth em cache", `0x80f510`); como a porta muda, normalmente o
   `redirect_uri` muda e ele **registra de novo** ("redirect_uri mudou, registrando novo client
   OAuth…", `0x80f4bd`; "Iniciando registro dinâmico", `0x80f550`).
   - Pedido de registro: `client_name` = `Chaos Code v3 Client - <…>` (`0x80f323`), tipo
     `desktop` (`0x80f31b`), `redirect_uris`, `grant_types` com `authorization_code` e
     `refresh_token` (`0x80f358`, `0x80f470`), `token_endpoint_auth_method: none` (cliente
     público, `0x80f380`). Struct `RegisteredClient` (4 campos, `0x8a0870`; campos vistos
     `client_name`, `redirect_uris`).
   - Resposta: `RegisterResponse { data }` (`0x8a0b28`) → `RegisterResponseData { client_id,
     client_secret }` (`0x8a1333`). O app guarda `OAuthClientCredentials` (3 campos, `0x8a161c`;
     `platform_url` visto logo antes) *(inferido: `client_id`, `redirect_uri`, `platform_url`)*.
4. **PKCE + state:** gera `code_verifier`, deriva `code_challenge` com **S256** e um `state`
   aleatório (`0x822d24`). *(inferido: verifier de 32 bytes aleatórios em base64url, padrão RFC
   7636 — tamanho não confirmado no código.)*
5. **Navegador:** abre a URL de autorização ("Abrindo navegador para autorização", `0x810a6e`;
   falha → "Falha ao abrir navegador", `0x810ba1`).
6. **Callback:** recebe `code`, `state`, `error`, `error_description` (campos junto de
   `src\auth\callback.rs`, `0x8a1300`). `error` → "OAuth error: …" (`0x80f7f1`). Sem resposta
   no prazo → "Login timeout: no callback received within …" (`0x80f800`).
   *(Valor do tempo limite não identificado.)*
7. **CSRF:** sem `state` → "Parâmetro state ausente no callback"; diferente → "State inválido:
   possível ataque CSRF" (`0x810ab0`).
8. **Troca do código:** `POST /api/oauth/token` com `grant_type=authorization_code`, `code`,
   `redirect_uri`, `code_verifier`, `client_id` (nomes em `0x8a048a`; log "Trocando código por
   tokens em", `0x80f5b1`). Resposta `TokenResponse` (4 campos, `0x8a06c4`): `access_token`,
   `refresh_token`, `token_type`, `expires_in`.
9. **Aparelho:** o app serializa os 5 campos do aparelho (seção "Aparelho" abaixo) e os envia à
   plataforma *(inferido: junto da troca do código ou do registro — o pedido exato não foi
   isolado)*.
10. **Guarda os tokens** no cofre (seção "Cofre") com `expires_at` calculado a partir de
    `expires_in` *(inferido)*.
11. **Reinicia o servidor MCP** com a sessão nova: "Login realizado com sucesso, MCP server
    reiniciado" (`0x810ab0`); erro → "MCP HTTP server restart error" (`0x810b61`).

## Renovação

- Disparo automático quando o access token venceu: "Access token expirado — tentando renovação
  automática via refresh_token" (arq. `0x810c80`, referida em VA `0x140115a40`, função
  `0x14011572d`–`0x140116312`).
- Também pelo comando `refresh_auth_token` e pela interface: erro `API error 401` /
  `Sessão expirada` → `attemptReconnect()` e repete uma vez (`comandos.md`).
- Pedido: `POST /api/oauth/token` com `grant_type=refresh_token`, `refresh_token`, `client_id`.
- Sucesso → "Renovação automática de token bem-sucedida" (`0x810ce8`) e grava no cofre.
- Falha → "Renovação automática falhou: … — limpando sessão" (`0x810d30`, `0x810d53`): apaga os
  tokens e volta para "não logado". Sem refresh token → "Nenhum refresh token disponível"
  (`0x810da0`); sem cliente → "Nenhum client OAuth registrado" (`0x810df8`).

## Revogação (logout)

- `POST /api/oauth/revoke` com `token`, `token_type_hint`, `client_id` (`0x80f258`).
- Falha da revogação só gera log ("Revogação de token falhou (…)", `0x80f2a1`) *(inferido: o
  logout segue e limpa o cofre mesmo assim)*.
- Limpa a credencial do keyring ("Falha ao limpar credencial do keyring", `0x88f988`).

## Cofre (`auth::tokens`)

| Item | O que faz | Evidência |
|---|---|---|
| Principal | **keyring nativo** — crate `keyring 3.6.3` (no Windows: Gerenciador de Credenciais; campos `target_name`, `username`, senha em UTF-16) | arq. `0x91a38a`, `0x91a1b9`; log "Tokens armazenados no keyring nativo" (`0x88f6d0`, referido em VA `0x140277480`, função `0x140277383`) |
| Conteúdo | JSON `AuthTokens` (3 campos: `access_token` + *(inferido)* `refresh_token`, `expires_at`) | `0x8a0639`; JSON inválido é ignorado (`0x88f7a0`) |
| Reserva | keyring falhou/indisponível → arquivo **`auth_tokens.json` cifrado** | `0x88f747`, `0x88f939`, `0x88f7f0` |
| Cifra | Chave derivada com **HKDF** (crate `ring 0.17.14`); envelope com **versão** ("Versão do envelope de tokens não suportada") e tamanho mínimo ("Dados cifrados muito curtos") | `0x88fcc8`, `0x88fb48`, `0x88fb13`; leitura em VA `0x140278d1e`–`0x14027931f` |
| Algoritmo AEAD | `ring` traz ChaCha20-Poly1305 e AES-GCM; qual dos dois é usado **não foi confirmado** *(em aberto)* | `0x9ca142`, `0xa44a80` |
| Segurança | Se não conseguir cifrar, **não grava**: "tokens NÃO foram salvos por segurança" | `0x88fd20` |
| Migrações | (a) arquivo antigo em texto puro (`isAuthenticated`, `accessToken`, `refreshToken`, `expiresAt`) → cifrado; (b) reserva → keyring quando ele volta, apagando o arquivo | `0x88fbbf`, `0x88fc58`, `0x88f7f0`, `0x88f8a8` |

Para o clone (Electron): keyring → `safeStorage`/`keytar`; reserva cifrada com HKDF + AEAD e
envelope com versão.

## Aparelho (`device::fingerprint`)

- **ID do aparelho:** lê `device_id.json` (arq. `0x890e97`, referido em VA `0x14028126f`, função
  `0x140281251`–`0x1402817fe`). Se não existir, gera um **UUID v4**: 16 bytes de
  `bcryptprimitives!ProcessPrng` (chamada em VA `0x140281457`) com as máscaras de versão 4 e
  variante RFC 4122 (`0x14080e0a0`, `0x14080e0b0`), e grava `{"device_uuid": …}`.
- **Campos enviados** — serializador em VA `0x14016c83f`–`0x14016cb6a`, nesta ordem:

| Campo | Evidência |
|---|---|
| `device_uuid` | texto imediato em VA `0x14016c867` |
| `device_hostname` | VA `0x14016c8fc`, `0x14016c90a` |
| `device_mac_address` | VA `0x14016c995` → arq. `0x822d73` |
| `device_os_info` | VA `0x14016ca13`, `0x14016ca21` *(inferido: inclui `windows` / `x86_64`, arq. `0x890e48`, `0x890e60`)* |
| `device_client_version` | VA `0x14016caa0` → arq. `0x822d85` (versão do app, `1.11.2`) |

- **MAC:** o executável traz a crate `mac_address 1.1.8` (arq. `0x91c334`) e importa
  `IPHLPAPI!GetAdaptersAddresses` (tabela de imports, arq. `0xa5a5c2`). **Qual adaptador é
  escolhido e o formato do texto não foram levantados** *(em aberto)*.

## Modo `auth::mock`

- Arquivo `src\auth\mock.rs`; gera `mock_access_token_<…>` e `mock_refresh_token`
  (arq. `0x80f206`, `0x80f21a`) — tokens falsos para usar o app sem plataforma.
- Nenhuma variável de ambiente (`CHAOS_*`, `MOCK*`) aparece no binário e não foi achada
  referência direta de código às strings *(em aberto: como o modo é ligado — provável opção de
  compilação de desenvolvimento, inferido)*.
- No clone: um provedor de login "simulado" atrás de uma opção explícita, nunca em produção.

## Em aberto

- Tempo limite do callback, tamanho do `code_verifier` e algoritmo AEAD do cofre.
- Em qual pedido os 5 campos do aparelho vão (registro, troca do código ou cabeçalho).
- Como o MAC é escolhido e formatado.
- Como o `auth::mock` é ativado.
- Nomes exatos do serviço/usuário no keyring (montados em tempo de execução).
