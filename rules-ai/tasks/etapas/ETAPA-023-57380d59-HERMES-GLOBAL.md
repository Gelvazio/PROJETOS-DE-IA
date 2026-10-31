## Etapa 023-57380d59 — HERMES-GLOBAL: Hermes Agent recebe as regras globais (SOUL.md) e a configuração local

**Tarefa:** HERMES-GLOBAL · **Pedido em:** 2026-10-18 13:55 · **Criada por:** DeepSeek Harness (deepseek-flash) (local · main)
**Pedido:** "sim,faça isso, configure pra que o rules-ai, use o hermes agent" (retomada da conversa que documentou o Hermes em `C:\fontes\hermes-agent\AGENTS.md`).
**Objetivo:** fazer o `rules-ai` entregar as regras globais ao **Hermes Agent** (destino novo no
`sincronizar.mjs`, `SOUL.md` no `HERMES_HOME`, modo `embutir`) e deixar a instância local pronta para
trabalhar nos repositórios de `C:\fontes`.

> 🌐 **GLOBAL:** muda o `scripts/sincronizar.mjs` (vale para a máquina inteira) e o `README.md` do
> `rules-ai`; a configuração local fica fora do repositório (`%LOCALAPPDATA%\hermes`).

### Escopo

- **Entra:** destino `Hermes Agent` no `sincronizar.mjs` + linha no `README.md`; `SOUL.md` e
  `config.yaml` em `%LOCALAPPDATA%\hermes`; rodar `--aplicar` e conferir; documentação em
  `C:\fontes\hermes-agent\AGENTS.md`; fechar o quadro e o `STATUS_PROJETO.md`.
- **Não entra:** a linha do Hermes em `regras/niveis-e-modelos.md` (decisão do usuário; até lá ele não
  pega `PESADO`); instalar o CLI do Hermes (o `hermes` ainda não está no PATH); mudar as regras
  (`regras/*.md`), logo a `VERSAO.md` não muda.

### Decisões

| Data | Decisão | Quem | Palavras |
|---|---|---|---|
| 2026-10-18 13:55 | Criar a tarefa e executar (LEVE) pelo DeepSeek Harness, com autorização direta | Gelvazio | "sim,faça isso, configure pra que o rules-ai, use o hermes agent" |
| 2026-10-18 13:55 | Não mexer na matriz `niveis-e-modelos.md`: a linha do Hermes fica pendente de decisão do usuário | DeepSeek Harness | — |

### HERMES-GLOBAL.1 — Destino do Hermes no `sincronizar.mjs` e README

- **Nível:** LEVE — configuração simples (constante + item na lista), sem lógica nova.
- **Modelo:** DeepSeek (Flash).
- **Descrição:** constante `PASTA_HERMES` (`%LOCALAPPDATA%\hermes` no Windows, `~/.hermes` no POSIX) e
- **JEV-AI-SUGGESTION:** NAO
  destino `{ ia: 'Hermes Agent', arquivo: join(PASTA_HERMES, 'SOUL.md'), modo: 'embutir' }`; linha do
  Hermes na tabela de IAs do `README.md`.
- **Critérios de Aceitação:** `node scripts/sincronizar.mjs` lista o destino do Hermes; `README.md`
  cita a IA e o arquivo global. ✅

### HERMES-GLOBAL.2 — `SOUL.md` e `config.yaml` do Hermes nesta máquina

- **Nível:** LEVE — configuração simples.
- **Modelo:** DeepSeek (Flash).
- **Descrição:** escrever o preâmbulo do workspace em `%LOCALAPPDATA%\hermes\SOUL.md` e deixar o
- **JEV-AI-SUGGESTION:** NAO
  `sincronizar.mjs` inserir o bloco das regras globais; completar `config.yaml` com
  `context_file_max_chars`, `terminal`, `approvals`, `skills.external_dirs`
  (`C:\Users\gelva\.agents\skills`), `memory`, mantendo `mcp_servers.rea`.
- **Critérios de Aceitação:** `SOUL.md` com o bloco `<!-- rules-ai:inicio ... -->` e o preâmbulo;
  `config.yaml` com as chaves novas e o REA preservado. ✅

### HERMES-GLOBAL.3 — `--aplicar` e conferência

- **Nível:** LEVE.
- **Modelo:** DeepSeek (Flash).
- **Descrição:** rodar `node scripts/sincronizar.mjs --aplicar` e conferir: Hermes gravado; demais
- **JEV-AI-SUGGESTION:** NAO
  destinos iguais; `VERSAO.md` sem mudança.
- **Critérios de Aceitação:** saída do script mostra o Hermes `gravado` e os demais `igual`; `SOUL.md`
  com o bloco completo. ✅

### HERMES-GLOBAL.4 — Documentação, quadro e `STATUS_PROJETO`

- **Nível:** LEVE — `.md`.
- **Modelo:** DeepSeek (Flash).
- **Descrição:** atualizar `C:\fontes\hermes-agent\AGENTS.md` (estado "aplicado"), fechar as
- **JEV-AI-SUGGESTION:** NAO
  subtarefas no `STATUS.md`, mover para `task_complete.md` e registrar no `STATUS_PROJETO.md`.
- **Critérios de Aceitação:** quadro sem linhas abertas da HERMES-GLOBAL; `STATUS_PROJETO.md` com o
  registro; commits + push. ✅

---

### Entregas desta etapa

| Subtarefa | Commit | Verificação |
|---|---|---|
| HERMES-GLOBAL.1 | `feat(HERMES-GLOBAL.1)` (`ac236bf`) | destino no `sincronizar.mjs`; README com a linha |
| HERMES-GLOBAL.2 | fora do Git (`%LOCALAPPDATA%\hermes`) | `SOUL.md` com bloco; `config.yaml` completo |
| HERMES-GLOBAL.3 | — (saída do script) | Hermes `gravado`; demais `igual` |
| HERMES-GLOBAL.4 | `docs(HERMES-GLOBAL.4)` | quadro fechado; `STATUS_PROJETO.md` atualizado |
