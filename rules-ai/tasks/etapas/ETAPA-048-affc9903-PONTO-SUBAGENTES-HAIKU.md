## Etapa 048-affc9903 — PONTO-SUBAGENTES-HAIKU: o comando "." dispara 4 subagentes Haiku 5.5 em paralelo

**Tarefa:** PONTO-SUBAGENTES-HAIKU · **Pedido em:** 2026-10-23 18:40 · **Criada por:** Claude Code (Sonnet 5.5) (local · main · rules-ai)
**Pedido:** "ADICIONE 1 REGRA GLOBAL, QUE SEMPRE CHAMA 4 SUBAGENTES *HAIKU 5.5* PRA FAZER ESTA PARTE INICIAL SER MAIS RAPIDA" e, em seguida, "SEMPRE QUE DIGITAR PONTO(.), DEVE FAZER ISSO, DISPARAR OS SUB-AGENTES JUNTO"
**Objetivo:** toda vez que o usuário mandar só `.`, a IA (no Claude Code) dispara 4 subagentes Haiku 5.5 ao mesmo tempo para a parte de leitura, e o resultado chega mais rápido; vale para todos os projetos.

### Decisões

- 2026-10-23 18:40: pedido do usuário; vira a decisão **C51**. A "parte inicial" é o comando `.` (`comando-ponto.md`); o `?` e o `;` não mudam.
- 2026-10-23 18:40: os 4 subagentes **só leem** (sincronização, quadro, próxima livre, saúde do quadro); `git pull --rebase` e qualquer escrita ficam com o líder. Como a leitura é `LEVE`, ela já nasce no modelo certo (Haiku) e o líder Opus/Fable não executa trabalho `LEVE` (regra maior, C50).
- 2026-10-23 18:40: tarefa pequena (só `.md` e a conferência do `dist/`): sem plano de aprovação; sem teste novo.

- 2026-10-23 19:25: o usuário pediu para **remover** a regra ("demora demais, mais que antes, remova isso"): na prática, 4 subagentes levaram mais tempo que o `.` feito em sequência (cada um cria contexto novo e o líder ainda junta as respostas). A C51 passa a **revogada**; nascem as subtarefas .4 (remover) e .5 (conferir); a .3 (`--aplicar`, do usuário) passa a levar a remoção.

### PONTO-SUBAGENTES-HAIKU.1 — Escrever a regra e registrar a C51

**Próximo passo:** nenhum — entregue.

- **Nível:** LEVE — só `.md`
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** criar `regras/ponto-subagentes-haiku.md`; incluí-la no `regras/INDEX.md` (item 25, e "Assuntos específicos" passa a 26); uma linha apontando para ela em `regras/comando-ponto.md` e na seção "Gatilho `.`" de `regras/frentes-e-reserva.md`; linha C51 no `CONFLITOS.md`; entrada com data e hora no `STATUS_PROJETO.md`.
- **Arquivos:** `regras/ponto-subagentes-haiku.md`, `regras/INDEX.md`, `regras/comando-ponto.md`, `regras/frentes-e-reserva.md`, `CONFLITOS.md`, `STATUS_PROJETO.md`
- **Critérios de Aceitação:** a regra existe, está no índice e cita a C51; os dois arquivos de comando apontam para ela; nada mais muda nesses arquivos.
- **Depende de:** Nenhuma
- **Entrega:** `regras/ponto-subagentes-haiku.md` (nova), `regras/INDEX.md` (item 25; atividades passa a 26), `regras/comando-ponto.md` e `regras/frentes-e-reserva.md` (ponteiro), `CONFLITOS.md` (C51) e `STATUS_PROJETO.md`; escrito por Claude Code (Haiku 5.5 · executor-leve; líder Sonnet 5.5) e commitado na conferência do Haiku (C41).
- **Verificação:** `git diff` conferido pelo líder: só as linhas combinadas mudaram nos 5 arquivos; `grep ponto-subagentes-haiku` acha a regra no índice, nos dois ponteiros, na C51 e no `STATUS_PROJETO.md`.

### PONTO-SUBAGENTES-HAIKU.2 — Conferir a nova versão das regras

**Próximo passo:** nenhum — entregue.

- **Nível:** MEDIO — roda o sincronizador (script) e confere a saída
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** `node scripts/sincronizar.mjs` (prévia, sem `--aplicar`); conferir que a regra nova entra no `dist/`/`VERSAO.md` na posição do índice e que nenhuma outra regra mudou.
- **Arquivos:** `VERSAO.md`, `dist/REGRAS-GLOBAIS.md`
- **Critérios de Aceitação:** a prévia lista a regra nova e as duas regras com ponteiro; mais nada.
- **Depende de:** PONTO-SUBAGENTES-HAIKU.1
- **Entrega:** `VERSAO.md` na versão 2026-10-23-9561a2a7 (item 25 = `ponto-subagentes-haiku.md`; `dist/` fica fora do Git), feito pelo líder Claude Code (Sonnet 5.5) logo após a entrega da .1, sem reserva separada.
- **Verificação:** `node scripts/sincronizar.mjs` (prévia, sem `--aplicar`): `VERSAO.md` mudou só no índice, em `frentes-e-reserva.md`, `comando-ponto.md` e na regra nova; `dist/REGRAS-GLOBAIS.md` traz a regra e os dois ponteiros.

### PONTO-SUBAGENTES-HAIKU.4 — Remover a regra e os ponteiros

**Próximo passo:** delegar ao `executor-leve` (Haiku 5.5).

- **Nível:** LEVE — só `.md`
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** apagar `regras/ponto-subagentes-haiku.md`; tirar o item 25 do `regras/INDEX.md` (atividades volta a 25); tirar a linha ⚡ de `regras/comando-ponto.md` e o item ⚡ de `regras/frentes-e-reserva.md`; marcar a C51 do `CONFLITOS.md` como revogada (histórico não se apaga); entrada com data e hora no `STATUS_PROJETO.md`.
- **Arquivos:** `regras/ponto-subagentes-haiku.md`, `regras/INDEX.md`, `regras/comando-ponto.md`, `regras/frentes-e-reserva.md`, `CONFLITOS.md`, `STATUS_PROJETO.md`
- **Critérios de Aceitação:** nenhum arquivo de `regras/` cita `ponto-subagentes-haiku`; a C51 aparece como revogada.
- **Depende de:** Nenhuma

### PONTO-SUBAGENTES-HAIKU.5 — Conferir a nova versão das regras

**Próximo passo:** aguardar a .4.

- **Nível:** MEDIO — roda o sincronizador (script) e confere a saída
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** `node scripts/sincronizar.mjs` (prévia, sem `--aplicar`); conferir que `VERSAO.md` e `dist/` voltam sem a regra e que o índice está de 1 a 25 sem buraco.
- **Arquivos:** `VERSAO.md`, `dist/REGRAS-GLOBAIS.md`
- **Depende de:** PONTO-SUBAGENTES-HAIKU.4

### PONTO-SUBAGENTES-HAIKU.3 — Levar a remoção às IAs (`--aplicar`, de novo)

**Próximo passo:** aguardar a .5. Se o `--aplicar` anterior já foi rodado, os arquivos globais de cada IA ainda trazem a regra; rodar de novo tira.

- **Nível:** LEVE — ação do usuário no computador
- **Modelo:** Usuário
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** o usuário roda `node scripts/sincronizar.mjs --aplicar` (grava o arquivo global de cada IA); os projetos recebem a regra pelo `rules-local` na próxima sessão.
- **Depende de:** PONTO-SUBAGENTES-HAIKU.2
