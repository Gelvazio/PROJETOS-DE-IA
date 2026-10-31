# Inventário — gerador de imagem e atualizador do original (CLONE.1.9)

Feito por Claude Code (Sonnet 5.5) (local · main). Alvo: `apps-to-be-clone/chaos-code-v3-client.exe`
(SHA-256 `46dab592…`, v1.11.2, Tauri 2). Fonte: busca de strings no executável, só leitura de
bytes (nada executado nem decompilado). "arq." = deslocamento no arquivo; VA = arq. + `0x140001000`.
O que está marcado *(inferido)* vem do contexto e precisa de confirmação no Ghidra.

## 1. Gerador de imagem

### Visão geral

O cliente tem **dois provedores**: `platform` (padrão, a plataforma `chaoscode.ai` gera e guarda a
imagem no projeto) e `gemini` (direto, com a chave de API do próprio usuário). Se a plataforma
responder "quota excedida" e houver chave Gemini, o cliente gera **localmente** e **não** grava na
plataforma.

| Item | Valor | Evidência (arq.) |
|---|---|---|
| Modelo Gemini | `gemini-2.0-flash-preview-image-generation` | `0x88ea3b` |
| Nome na tela | `Nano Banana (Gemini)` | `0x890458` |
| URL Gemini | `https://generativelanguage.googleapis.com/v1beta/models/<modelo>:generateContent` | `0x890370`, `0x89042c` |
| Cabeçalhos Gemini | `Content-Type`, `x-goog-api-key` | `0x890458` |
| Rota da plataforma (gerar) | `POST /api/projects/<id>/images/generate` | `0x888839`–`0x88891a` |
| Rota da plataforma (listar/apagar) | `/api/projects/<id>/images/…` | `0x888839` |
| Arquivo de configuração | `image_api_config.json` (`ImageApiConfig`) | `0x8232d5` |
| Provedor local no resultado | `gemini_local` | `0x88eb28` |

### Pedido ao Gemini (campos vistos, em `0x890370`)

`contents` → `parts` (`text`), `generationConfig` → `responseModalities` (texto e imagem),
`imageConfig` → `aspectRatio`, e `quality` *(inferido: dentro de `generationConfig`)*. A resposta
chega em `candidates[].content.parts[]`, onde a imagem vem em `inlineData` com `mimeType` e
`data` (base64) — o enum `GeminiPart` aceita `Text` ou `InlineData`. Mensagem de tentativas:
`Gemini: tentativa …` (há repetição com espera, *inferido*).

Exemplo (forma do pedido, *inferido* pelos nomes dos campos):

```json
{
  "contents": [{ "parts": [{ "text": "<prompt>" }] }],
  "generationConfig": {
    "responseModalities": ["TEXT", "IMAGE"],
    "imageConfig": { "aspectRatio": "1:1" }
  }
}
```

### Ferramenta MCP `generate_image` (descrições na íntegra, `0x88c6f0`–`0x88ca28`)

| Parâmetro | Descrição original | Padrão |
|---|---|---|
| (ferramenta) | "Generate an AI image from a text prompt. Supports negative prompts, custom dimensions (256-2048), guidance scale, inference steps, and seed for reproducibility. Uses platform API by default with automatic Gemini fallback on quota exceeded. Blocking call, up to 3 minutes." | — |
| `prompt` | "Descriptive text for the image to generate. Be detailed for better results." | obrigatório |
| `negative_prompt` | "What to exclude from the image (platform provider only)." | — |
| `width` | "Image width in pixels (256-2048, default: 1024)." | 1024 |
| `height` | "Image height in pixels (256-2048, default: 1024)." | 1024 |
| `guidance_scale` | "Guidance scale (1-20, default: 3.5, platform only)." | 3.5 |
| `num_inference_steps` | "Inference steps (1-100, default: 28, platform only)." | 28 |
| `seed` | "Seed for reproducibility." | — |
| `tags` | "Tags for categorization." | — |
| `provider` | "Provider: platform (default, auto-fallback to gemini on quota exceeded) or gemini (direct, uses client API key)." | `platform` |

Nomes exatos dos parâmetros *(inferidos)* a partir de `guidance_scale` e `num_inference_steps`
vistos nas structs (`0x887b70`). Também existem `generate_image_from_reference`,
`list_project_images`, `delete_project_image` (lista em `0x822398`). A busca de imagens
(`search_images`) aceita texto do prompt, `tags` e `status` ("Search project images with filters
by prompt text, tags, and generation status…", `0x88caf8`).

### Respostas e erros

| Situação | Texto | Evidência |
|---|---|---|
| Sem login | "Not authenticated. Please log in to the client before using platform tools." | `0x88e9e8` |
| Quota estourada e sem chave Gemini | "Platform quota exceeded and Gemini API key not configured in client. Configure it in Settings > Images > Gemini to enable local fallback." | `0x88ea38` |
| Gerada pelo Gemini local | "Image generated via local Gemini (platform quota fallback). Not saved to the platform." | `0x88eb48` |
| Falha no Gemini | "Failed to generate image via local Gemini: …" | `0x88ebc8` |
| Quota de imagens | "Quota excedida (N imagens usadas)", "…limite ilimitado)", "Quota de geração de imagens excedida" | `0x89634a`–`0x8963c9` |
| Armazenamento | "Armazenamento esgotado (N bytes usados)", "…limite ilimitado)" | `0x8963f0`–`0x896472` |

Resposta de quota (`QuotaExceededResponse`, 8 campos, `0x8a1418`): `quota_exceeded`,
`images_used`, `images_limit`, `quota_type`, `storage_used`, `storage_limit` e dois campos de
mensagem *(inferido)*. Resposta de geração da plataforma (`PlatformGenerateResponse`):
`error_message`, `guidance_scale`, `num_inference_steps` e os dados da imagem.

### Configuração local (`image_api_config.json`)

Structs vistas: `ImageApiConfig`, `ImagePlatformConfig`, `ImageGeminiConfig`,
`ImageOpenAIConfig` (`0x81f4da`–`0x81fab0`). Campos vistos: `platform`, `api_key`, `model`,
`endpoint`, `base_url`, `default_width`, `default_height`, `default_guidance_scale`,
`default_steps`. O valor `https://api.openai.com` aparece como URL padrão do provedor OpenAI de
imagens (`0x823241`..). Telas e canais: `get_image_api_config`, `set_image_api_config`,
`list_project_images`, `search_images`, `delete_project_image` (`0x80e6f8`, `0x87f700`).

### Pasta de saída

A imagem gerada pela plataforma fica **no servidor** do projeto; o cliente lista pelas rotas
`/api/projects/<id>/images/…` e baixa o conteúdo por elas. Não foi achado, nestas strings, um
nome de pasta local de imagens: o caminho do `local_path` é o da pasta do **projeto**
(`set_project_local_path`). Se existir uma subpasta local, ela só se confirma no Ghidra
*(pendência)*.

## 2. Atualizador

### Visão geral

Usa o plugin oficial `tauri-plugin-updater 2.10.0` com verificação **minisign (Ed25519)**
(`minisign-verify 0.2.4`, `0x91d567`–`0x91e610`). O cliente confere ao abrir e sob pedido do
usuário (`check_for_update`, `download_and_install_update`, `cancel_update_download`).

| Item | Valor | Evidência (arq.) |
|---|---|---|
| Endpoint | `https://chaoscode.ai/api/client/releases/latest.json` | `0x8aa2d0`, `0x82c2f6` |
| Chave pública (base64 no config) | `dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEZGRTM3RjI4OTI0MkQ5QTYK…` | `0x8aa2f6` |
| Chave pública (decodificada) | `untrusted comment: minisign public key: FFE37F289242D9A6` + `RWSm2UKSKH/j/7vciGeJiBgba3x+4mPjZqmwu9aVFBjOpgzGAVrT5dha` | decodificada do base64 |
| Identificador do app | `com.chaoscode.v3client` | `0x8aa230` |
| Pacote do Windows | NSIS (`installMode`/`installerArgs`); MSIX não atualiza sozinho | `0x898488`, `0x899a2d` |
| Janela de rede | `connect-src` inclui `https://chaoscode.ai` e `https://staging.chaoscode.ai` | `0x8aa230` |

### Formato do `latest.json` (manifesto)

Campos do plugin (`0x899d7f`): `version`, `notes`, `pub_date`, `platforms`; cada plataforma tem
`signature` (obrigatório: "the `signature` field was not set on the updater response") e `url`
(`ReleaseManifestPlatform`, `0x898760`). O app acrescenta, *(inferido)*, `force_update` e
`min_version` (`0x813510`): com `force_update` ou versão menor que `min_version` a atualização
vira **obrigatória** ("Atualização obrigatória detectada: v…", "Atualização obrigatória
pendente. Instale a atualização para continuar.").

Exemplo (forma do manifesto, valores de exemplo):

```json
{
  "version": "1.11.3",
  "notes": "Correções e melhorias.",
  "pub_date": "2026-10-16T12:00:00Z",
  "force_update": false,
  "min_version": "1.10.0",
  "platforms": {
    "windows-x86_64": {
      "signature": "<conteúdo do arquivo .sig do minisign>",
      "url": "https://chaoscode.ai/releases/chaos-code-v3-client_1.11.3_x64-setup.exe"
    }
  }
}
```

A chave `windows-x86_64` é a convenção do plugin Tauri para o Windows 64 bits *(inferido)*.

### Fluxo e mensagens

1. Abre o app → confere atualização com **tempo limite de 15 s** ("Timeout ao verificar
   atualização (15s). Verifique sua conexão.", `0x8135e2`).
2. Instalação via MSIX → o comando é "curto-circuitado": `MSIX_UPDATE_UNSUPPORTED`, "Atualização
   deve vir da Microsoft Store." (`0x899a2d`, `0x899ab0`, `0x813440`).
3. Baixar e instalar: "Iniciando download e instalação: v1.11.2 → v<nova> (canal: <canal>)"
   (`0x899ae0`), evento `update-progress` (`downloaded`, `total`), depois "Download e instalação
   concluídos — reiniciando app" (`0x899b38`).
4. Cancelar: "Cancelamento de download de atualização solicitado (será efetivado na próxima
   oportunidade)" (`0x813738`).
5. Sem novidade: "Nenhuma atualização disponível." (`0x899bc1`).
6. Antes de instalar o app grava o estado (`save_pre_update_state`, com `targetVersion`) em
   `update_history.json`; depois da instalação o histórico é registrado e o arquivo anterior é
   removido ("update_history.json removido (instalação…)", `0x87f1e8`).

### Arquivos locais do atualizador

| Arquivo | O que guarda | Campos vistos (`0x81fab0`) |
|---|---|---|
| `update_config.json` (`UpdateConfig`) | Preferências | `auto_check`, `auto_install`, `check_interval_minutes`, `channel` *(inferido)* |
| `update_history.json` (`UpdateHistory`) | Histórico das versões | `previous_version`, `current_version`, `channel`, `verified`, `boot_count`, `update_required` |

O canal vem de `get_update_channel` / `set_update_config` (canal `stable` visto em
`project::mod`, ver `modulos.md`).

### Pendências

- Nome e posição exatos de cada campo de `UpdateConfig` e `UpdateHistory` e o tipo deles: só
  no Ghidra (as strings vêm coladas sem separador).
- Pasta local de saída das imagens da plataforma e `quality`/`aspectRatio` aceitos pelo Gemini.
- Formato real do `force_update`/`min_version` (nome e tipo) no manifesto do servidor.
