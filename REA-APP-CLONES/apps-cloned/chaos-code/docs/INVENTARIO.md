# Inventário do Chaos Code v3

O inventário descreve o que o app original Chaos Code v3 (cliente Tauri 2, v1.11.2) faz: módulos,
comandos, rotas da API, arquivos locais, prompts, telas e tokens visuais. Foi feito por análise
estática do executável `chaos-code-v3-client.exe`, só com leitura de bytes, strings, desmontagem
pontual e a interface embutida; nada foi executado. O que está marcado *(inferido)* precisa de
confirmação no Ghidra.

## Arquivos

| Arquivo | Subtarefa | O que cobre |
|---|---|---|
| [`modulos.md`](inventario/modulos.md) | CLONE.1.1 | Mapa dos módulos `chaos_code_v3_client_lib::*` (40 arquivos-fonte). |
| [`comandos.md`](inventario/comandos.md) | CLONE.1.2 | Os 79 comandos Tauri (`invoke`), eventos e como a interface os chama. |
| [`api.md`](inventario/api.md) | CLONE.1.3 | Rotas da plataforma `chaoscode.ai`, métodos, corpos e formatos de resposta. |
| [`arquivos-locais.md`](inventario/arquivos-locais.md) | CLONE.1.4 | Arquivos `*.json` gravados no disco, com campos e exemplos. |
| [`login.md`](inventario/login.md) | CLONE.1.5 | Login OAuth, renovação, revogação, cofre e identificação do aparelho. |
| [`vetores-grafo.md`](inventario/vetores-grafo.md) | CLONE.1.6 | Pedaços, embeddings, índice HNSW, grafo, busca RAG e sincronização. |
| [`mcp-cli-wsl.md`](inventario/mcp-cli-wsl.md) | CLONE.1.7 | Servidor MCP local, 23 ferramentas, configuração nos CLIs e WSL. |
| [`prompts-agentes.md`](inventario/prompts-agentes.md) | CLONE.1.8 | Textos dos prompts enviados aos LLMs e formato dos agentes. |
| [`modelos-agente-embutidos.json`](inventario/modelos-agente-embutidos.json) | CLONE.1.8 | Os 12 modelos de agente embutidos, em JSON. |
| [`imagem-atualizador.md`](inventario/imagem-atualizador.md) | CLONE.1.9 | Gerador de imagem (Gemini e plataforma) e atualizador. |
| [`telas.md`](inventario/telas.md) | CLONE.1.10 | Telas da interface, estrutura do app e tokens visuais. |
| [`original/`](original/) | CLONE.1.10 | Cópia da interface: `index.html`, JS, CSS e ícones extraídos. |

## O que ainda falta

Itens em aberto de cada arquivo, em ordem de inventário. Cada um precisa de confirmação no Ghidra
ou de um arquivo real gerado pelo app.

- [`api.md`](inventario/api.md): confirmar os campos *(inferido)* de cada struct.
- [`api.md`](inventario/api.md): confirmar o corpo exato de POST e PATCH.
- [`api.md`](inventario/api.md): identificar o método de `/wiki/sync/ack` e a função de cada POST
  OAuth.
- [`api.md`](inventario/api.md): identificar os dois GETs sem URL (candidato
  `check_platform_online`).
- [`api.md`](inventario/api.md): listar os códigos HTTP de cada mensagem de erro.
- [`arquivos-locais.md`](inventario/arquivos-locais.md): confirmar tipos exatos e se as coleções são
  lista ou mapa.
- [`arquivos-locais.md`](inventario/arquivos-locais.md): descobrir valores padrão do `UpdateConfig`
  e os valores de `source_type` e `status`.
- [`arquivos-locais.md`](inventario/arquivos-locais.md): confirmar o nome do servidor em
  `mcpServers` e o formato do `.gemini/settings.json`.
- [`arquivos-locais.md`](inventario/arquivos-locais.md): confirmar o algoritmo de cifra do
  `auth_tokens.json` e o papel do `device_uuid`.
- [`comandos.md`](inventario/comandos.md): levantar os retornos da maioria dos comandos (marcados
  "—").
- [`comandos.md`](inventario/comandos.md): confirmar os argumentos dos 13 comandos ⚙️.
- [`comandos.md`](inventario/comandos.md): confirmar o módulo de cada comando no código.
- [`comandos.md`](inventario/comandos.md): confirmar `get_shadow_nsis_path`, `check_platform_online`
  e `list_chaos_code_mcp_tools`.
- [`login.md`](inventario/login.md): definir o tempo limite do callback e o tamanho do
  `code_verifier`.
- [`login.md`](inventario/login.md): definir o algoritmo AEAD do cofre.
- [`login.md`](inventario/login.md): definir em qual pedido vão os 5 campos do aparelho.
- [`login.md`](inventario/login.md): definir como o MAC é escolhido e formatado.
- [`login.md`](inventario/login.md): descobrir como o `auth::mock` é ativado.
- [`login.md`](inventario/login.md): levantar os nomes do serviço e do usuário no keyring.
- [`vetores-grafo.md`](inventario/vetores-grafo.md): listar todos os campos de `VectorEntry`,
  `Entity`, `Relation`, `Community`, `LlmEntity` e `LlmRelation`.
- [`vetores-grafo.md`](inventario/vetores-grafo.md): descobrir o algoritmo de comunidades e como
  `level` é calculado.
- [`vetores-grafo.md`](inventario/vetores-grafo.md): confirmar o `efSearch` e o cálculo de `lambda`.
- [`vetores-grafo.md`](inventario/vetores-grafo.md): confirmar o tamanho máximo de lote do provedor.
- [`vetores-grafo.md`](inventario/vetores-grafo.md): confirmar a unidade do pedaço (bytes ou
  caracteres) e a regra de corte.
- [`mcp-cli-wsl.md`](inventario/mcp-cli-wsl.md): confirmar valores de `default` não numéricos e
  5/2/0.
- [`mcp-cli-wsl.md`](inventario/mcp-cli-wsl.md): confirmar a chave da URL no `.gemini/settings.json`
  e o nome do servidor gravado nos CLIs.
- [`mcp-cli-wsl.md`](inventario/mcp-cli-wsl.md): listar `Host`/`Origin` permitidos e validade dos
  tokens `mcp_at_`/`mcp_rt_`.
- [`mcp-cli-wsl.md`](inventario/mcp-cli-wsl.md): confirmar em qual tela aparecem os comandos sem
  token.
- [`modulos.md`](inventario/modulos.md): confirmar as responsabilidades de `project::mod` e
  `commands::status`.
- [`modulos.md`](inventario/modulos.md): decompilar o código; o mapa mostra o que existe, não como
  funciona.
- [`prompts-agentes.md`](inventario/prompts-agentes.md): descobrir o catálogo de ferramentas MCP
  injetado nos prompts 3.1 e 3.2.
- [`prompts-agentes.md`](inventario/prompts-agentes.md): confirmar a ordem dos furos `{...}` no
  Ghidra.
- [`imagem-atualizador.md`](inventario/imagem-atualizador.md): confirmar nome, posição e tipo dos
  campos de `UpdateConfig` e `UpdateHistory`.
- [`imagem-atualizador.md`](inventario/imagem-atualizador.md): descobrir a pasta local de saída das
  imagens.
- [`imagem-atualizador.md`](inventario/imagem-atualizador.md): confirmar `quality` e `aspectRatio`
  aceitos pelo Gemini.
- [`imagem-atualizador.md`](inventario/imagem-atualizador.md): confirmar o formato de `force_update`
  e `min_version` no manifesto.
- [`telas.md`](inventario/telas.md): detalhar o layout dos cartões do Dashboard e da lista do Chat.
- [`telas.md`](inventario/telas.md): confirmar que `/vite.svg` não existe no executável.
