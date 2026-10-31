# AI-MEMORY — instalação no Windows

**Subtarefa:** AI-MEMORY-INTEGRATION.3 · **Data:** 2026-10-23
**Natureza:** guia do que foi feito de fato na instalação (subtarefa .4) e de como conferir.
Nenhuma chave aparece neste texto.

## 1. O que foi instalado

| Item | Valor |
|---|---|
| Versão | `ai-memory 3.2.2` |
| Comando | `ai-memory setup --yes --agent claude-code` |
| Servidor | `127.0.0.1:49374` (só loopback; `bind` no `config.toml`) |
| Pasta de dados | `%LOCALAPPDATA%\ai-memory` |
| Configuração | `%LOCALAPPDATA%\ai-memory\config.toml` |
| Hooks do Claude Code | gravados em `%USERPROFILE%\.claude\settings.json` (escopo global) |
| Banco | `%LOCALAPPDATA%\ai-memory\db\memory.sqlite` |

O `setup` faz tudo em um passo: `init` (cria a pasta de dados e o token), um serviço de usuário,
hooks, MCP e skills do agente informado, e uma autoconferência de leitura. Rodar de novo não
muda nada. Sem `--yes`, ele mostra o plano e pergunta.

## 2. Comandos

```powershell
# instalar (uma vez; ver o plano antes: tirar --yes)
ai-memory setup --yes --agent claude-code

# conferir o servidor e os contadores
ai-memory status

# conferir a cobertura de captura do projeto atual
ai-memory doctor
```

Outras IAs entram com `--agent <nome>` (`codex`, `cursor`, `gemini-cli`, `grok`…). Isso só vale
depois da decisão do piloto (etapa 038); nesta fase só o Claude Code está ligado.

## 3. Onde fica o token

- O token vem **do arquivo** `%LOCALAPPDATA%\ai-memory\auth-token` (pasta fora de qualquer Git).
  O `config.toml` aponta o arquivo-fonte do servidor em `bearer_token_file`
  (`auth-tokens\default`). Os hooks e a CLI leem dali; os arquivos de configuração das IAs
  não guardam o token.
- **Decisão do usuário (2026-10-23 11:53):** o token fica no arquivo, e **não** em variável de
  ambiente do Windows, como a descrição original da .4 pedia.
- ⛔ Nunca copiar o token para o repositório, para `.env`, para o quadro nem para um log.
  ⛔ Nunca imprimir o conteúdo do arquivo; para saber se existe, usar só
  `Test-Path "$env:LOCALAPPDATA\ai-memory\auth-token"`.
- Não alterar o `token_pepper` do `config.toml`: trocar invalida as chaves de API já emitidas.

## 4. Como conferir que o servidor está no ar

```powershell
# 1) rota de saúde, sem token: deve devolver 200
(Invoke-WebRequest http://127.0.0.1:49374/healthz -UseBasicParsing).StatusCode

# 2) resumo com contadores (versão, bind, sessões, observações, spool)
ai-memory status
```

- A **raiz** `http://127.0.0.1:49374/` responde **404**: é normal, não é falha. Use `/healthz`.
- Resultado esperado de `status`: `bind: 127.0.0.1:49374`, `auth: bearer token`,
  `spool pending: 0`. `providers: llm disabled` é o estado atual (sem consolidação por LLM).
- Conferência feita em 2026-10-23: `/healthz` → `200`; `status` listou 1 sessão e 30 observações
  capturadas.

## 5. Se o servidor não responde

1. Rodar `ai-memory status` e ver a mensagem.
2. Conferir se a porta está ocupada por outro programa: `netstat -ano | findstr 49374`.
3. Rodar `ai-memory setup --yes --agent claude-code` de novo (não muda o que já está certo).
4. Servidor fora do ar **não trava** a sessão: segue só com o quadro (requisito R1.2 da etapa).

## 6. Limites

- ⛔ Não mudar `bind` para endereço de rede (`0.0.0.0`): o servidor é só local.
- ⛔ Não instalar em pasta `DEMAIS-PROJETOS-*` (requisito R4.1).
- Hooks, marcador do projeto e convivência com `sessao.mjs` e Jev: ver `AI-MEMORY-HOOKS.md` e
  `AI-MEMORY-MARKER.md`.

## 7. Sem servidor (nuvem ou servidor fora do ar) — AI-MEMORY-INTEGRATION.19

**Requisito:** R1.2 (SE o servidor não responde, ENTÃO a sessão abre sem erro e segue só com o
quadro e o `rules-local`).

**Comportamento esperado:**
- A sessão inicia sem erro e sem travar. Os hooks saem com código 0 e devolvem `{}`.
- Captura não enviada vai para a fila local (`hook-spool`), sem perda; é reenviada quando o
  servidor voltar.
- A IA diz em 1 linha que está sem memória (texto em `regras/memoria-ai.md`, "Sem memória") e
  segue pelo quadro.
- Na nuvem não há servidor: o mesmo caminho vale (sem memória, quadro e `rules-local`).

**Como simular (sem parar o servidor real):** apontar o hook para uma porta sem servidor e
mandar a fila para uma pasta temporária. No Windows (`hooks\lib\ai-memory-hook.ps1`):

```powershell
$env:AI_MEMORY_HOOK_URL = 'http://127.0.0.1:1'   # porta sem servidor
$env:AI_MEMORY_DATA_DIR = '<pasta temporária>'   # fila e estado fora do real
'{"session_id":"sim","cwd":"<pasta do projeto>","hook_event_name":"SessionStart"}' |
  powershell -NoProfile -ExecutionPolicy Bypass -File C:\fontes\ai-memory\hooks\claude-code\session-start.ps1
```

**Medição (2026-10-23, subtarefa .19):**

| Caso | Saída | Código | Tempo |
|---|---|---|---|
| `session-start.ps1` com servidor fora (porta 1), 2 execuções | `{}` | 0 | 4,8 s e 4,75 s |
| `Invoke-WebRequest` direto para porta 1 (`/healthz` e `/handoff`) | erro de conexão | — | ~2,05 s cada |
| Linha de base: `powershell -NoProfile -Command 'exit 0'` | — | 0 | 0,18 s |

Resultado: a sessão **não quebra** (código 0, saída `{}`, 1 evento na fila). Mas o caminho
PowerShell gasta cerca de 2 s em cada chamada até a porta fechada (POST de captura e GET do
handoff), ~4,7 s no total. A medição de 80 ms da seção 5 de `AI-MEMORY-HOOKS.md` vale para o
caminho `.sh`, não para este `.ps1`. Por isso o requisito R4.2 (até 1 s a mais no `SessionStart`)
**não está comprovado no Windows**: fica como pendência (abaixo).

**Pendências:**
- Medir qual script os hooks do Windows rodam de fato (`.ps1` ou `.sh`) e, se for o `.ps1`,
  reduzir o atraso com servidor fora (ex.: pular o GET do handoff quando o POST já falhou).
- Não foi rodado o `rules-local/sessao.mjs` com rede desligada; a parte de Git/rede dele não entra
  nesta medição.
