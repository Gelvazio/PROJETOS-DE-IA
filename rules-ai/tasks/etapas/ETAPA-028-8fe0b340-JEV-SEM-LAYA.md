## Etapa 028 — JEV-SEM-LAYA: tirar o Laya da regra do Jev (fica só o Jev)

**Tarefa:** JEV-SEM-LAYA · **Pedido em:** 2026-10-19 13:10 · **Criada por:** Claude Code (Opus 5.5) (local · main · aulasenai s26)
**Pedido:** "CRIE 1 TAREFA PRA REMOVER O LAYA, E DEIXAR SO O JEV MESMO" · "MUDE A REGRA GLOBAL TB" ·
"A REGRA LOCAL DEVE SER 1 ESPELHO DA REGRA GLOBAL" (pedidos na sessão do `aulasenai`, tarefa #295,
etapa 424-56988cb2)
**Objetivo:** a regra global `regras/jev.md` (C39) deixa de usar o Laya como reserva; quando o Jev
não responde, a classificação usa só os sinais da skill e o guardrail devolve `revisar`. O
`rules-local/` de cada projeto recebe a mudança pela sincronização (é espelho, nunca editado à mão).

### Escopo

- **Entra:** `regras/jev.md` (tirar o Laya: modo `off`, fallback, limiares, estado, rollback);
  decisão **C42** no `CONFLITOS.md` (altera a C39 só no fallback); `node scripts/sincronizar.mjs
  --aplicar`; `STATUS_PROJETO.md`; o código `scripts/jev/` (`cliente.mjs`, `config.mjs`,
  `avaliar.mjs`, `cli/comando-classificar.mjs`) sem a chamada ao Laya.
- **Não entra:** benchmark novo do Jev; os números históricos do benchmark (ficam como estão, sem
  o Laya na frase "Laya fora do ar"); a skill de cada projeto (cada projeto ajusta a sua — no
  `aulasenai` é a #295); o servidor Laya em si.
- **Número da decisão:** C41 já está tomada pela HAIKU-COMMIT-GLOBAL (etapa 027, reservada por
  outra frente); por isso esta é a **C42**.

### Requisitos

| ID | Requisito (EARS) | Cobre | Verificação |
|----|------------------|-------|-------------|
| R1.1 | O SISTEMA DEVE ter a regra `regras/jev.md` sem nenhuma citação ao Laya | JEV-SEM-LAYA.1 | `grep -ni laya regras/jev.md` sem resultado |
| R1.2 | SE o Jev falhar (rede, 401, 429, 529, timeout) ou estiver sem chave, ENTÃO O SISTEMA DEVE classificar só pelos sinais da skill e o guardrail devolver `revisar` | JEV-SEM-LAYA.1, JEV-SEM-LAYA.3 | leitura de `regras/jev.md`; leitura do código |
| R1.3 | QUANDO `JEV_MODO=off`, O SISTEMA DEVE seguir só pelos sinais, sem chamada a servidor | JEV-SEM-LAYA.1, JEV-SEM-LAYA.3 | leitura; `node scripts/jev.mjs classificar --dry-run` com `JEV_MODO=off` |
| R2.1 | QUANDO a regra mudar, O SISTEMA DEVE gerar o `dist/` e gravar o arquivo global de cada IA | JEV-SEM-LAYA.2 | saída de `node scripts/sincronizar.mjs --aplicar`; `grep -ci laya dist/REGRAS-GLOBAIS.md` = 0 |
| R3.1 | O SISTEMA DEVE ter `scripts/jev/` sem chamada a `localhost:8000` nem `answer_confidence` | JEV-SEM-LAYA.3 | `grep -rni "laya\|8000\|answer_confidence" scripts/jev` sem resultado; `node --check` nos arquivos |

**Fora do escopo:** benchmark; skills dos projetos; o servidor Laya.

### Invariantes

| ID | Regra que vale sempre | Domínio da entrada | Como conferir | Teste automatizado |
|----|----------------------|--------------------|---------------|--------------------|
| INV-1 | Falha do Jev nunca vira `liberar` em silêncio | `regras/jev.md`, `scripts/jev/` | leitura; `grep -n liberar scripts/jev` | não: leitura basta |
| INV-2 | O Jev continua só conselheiro: não escreve no quadro, não reserva, não rebaixa nível | `regras/jev.md` | leitura | não: regra de texto |

**Casos de borda:** projeto sem `TYPESAFE_API_KEY` (só sinais); `JEV_MODO=off`.

### Perguntas abertas

| # | Pergunta | Resposta | Fechada em | Quem respondeu |
|---|----------|----------|------------|----------------|
| 1 | Sem o Laya, o que fazer quando o Jev não responde? | Classificação só pelos sinais da skill (na dúvida sobe o nível); guardrail devolve `revisar` | 2026-10-19 13:10 | proposta do Claude, confirmada pelo "sim" ao plano |
| 2 | O `rules-local/` dos projetos é editado à mão? | Não: é espelho da regra global e muda pela sincronização (C36) | 2026-10-19 13:08 | Gelvazio ("A REGRA LOCAL DEVE SER 1 ESPELHO DA REGRA GLOBAL") |

### Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-19 13:10 | Tarefa criada; aguarda o "sim" ao plano | Claude Code (Opus 5.5) | tarefa grande (regra de todas as IAs) |
| 2026-10-19 13:05 | Plano aprovado ("sim, aprovo o plano da JEV-SEM-LAYA"); só aprovação, sem executar agora — as subtarefas ficam livres para o modelo de cada uma | Gelvazio | resposta no chat (sessão do `aulasenai`) |
| 2026-10-19 23:53 | .1 e .2 pelo Opus; .3 delegada ao executor-medio (Sonnet) a pedido do usuário ("JA CHAME O SONNET PRA FINALIZAR A TAREFA"); mãe concluída | Claude Code (Opus 5.5) | pedido no chat |

### JEV-SEM-LAYA.1 — Regra `jev.md` sem o Laya e decisão C42

**Próximo passo:** nenhum — entregue em 2026-10-19 23:50.

- **Nível:** PESADO — regra de todas as IAs (arquitetura).
- **Modelo:** só Opus 5.5+/Fable ou DeepSeek — nunca outro (C22)
- **Effort:** high
- **Critérios de aceitação:** R1.1, R1.2, R1.3 (texto); INV-1 e INV-2 continuam no texto.
- **Entrega:** commit `feat(JEV-SEM-LAYA.1)` (2026-10-19 23:50) — `regras/jev.md` sem o Laya, C42 no
- **JEV-AI-SUGGESTION:** NAO
  `CONFLITOS.md`, `regras/INDEX.md` (C39, C42) e `STATUS_PROJETO.md`.
- **Verificação:** `grep -rni laya regras/` sem resultado (R1.1); leitura da seção "Modo, rollback e
  fallback": falha/sem chave/`off` → só sinais e guardrail `revisar` (R1.2, R1.3); "Nunca `liberar`
  em silêncio" (INV-1) e "Caráter consultivo" (INV-2) continuam no texto.

### JEV-SEM-LAYA.2 — Levar às IAs (`sincronizar.mjs --aplicar`)

**Próximo passo:** nenhum — entregue em 2026-10-19 23:50.

- **Nível:** PESADO — grava o arquivo global de todas as IAs (mudança em massa).
- **Modelo:** só Opus 5.5+/Fable ou DeepSeek — nunca outro (C22)
- **Effort:** high
- **Critérios de aceitação:** R2.1.
- **Entrega:** commit `feat(JEV-SEM-LAYA.2)` (2026-10-19 23:50) — `VERSAO.md` em `2026-10-19-825288c1`; `--aplicar` gravou
- **JEV-AI-SUGGESTION:** NAO
  Gemini CLI, Codex, Grok, Qoder, opencode, Devin, Kiro, Hermes Agent e Kilo Code (Claude Code e
  contas A/B/C ficam `igual`: importam o `dist/` por `@`).
- **Verificação:** saída do `node scripts/sincronizar.mjs --aplicar`; `grep -ci laya
  dist/REGRAS-GLOBAIS.md` = 0 (R2.1) e 0 em `GEMINI.md`, `.codex/AGENTS.md`, `SOUL.md` e Kiro.

### JEV-SEM-LAYA.3 — Código `scripts/jev/` sem o Laya

**Próximo passo:** nenhum — entregue em 2026-10-19 23:53.

- **Nível:** MEDIO — código com lógica, até 4 arquivos do mesmo módulo, sem banco nem chave nova.
- **Modelo:** só Sonnet — nunca outro (C22)
- **Effort:** medium
- **Critérios de aceitação:** R1.2, R1.3 e R3.1 no código; `node --check` em cada arquivo.
- **Executor:** Claude Code (Sonnet 5.5 · executor-medio; líder Opus 5.5) (local · main · rules-ai).
- **Entrega:** commit `feat(JEV-SEM-LAYA.3)` (2026-10-19 23:53) — `avaliar.mjs` só com o backend Jev (sem
- **JEV-AI-SUGGESTION:** NAO
  `--backend`), `relatorio-avaliacao.mjs` sem a comparação Jev × Laya, ajuda do `scripts/jev.mjs`,
  textos de `cliente.mjs`, `config.mjs` (`8_000`), `cli/comando-classificar.mjs`, `decidir.mjs` e
  `guardrails/seguranca-base.mjs` = "só pelos sinais da skill". `benchmarks/` não mudou (histórico).
- **Verificação (conferida pelo líder):** `grep -rniE "laya|8000|answer_confidence" scripts/jev
  scripts/jev.mjs --include=*.mjs` sem resultado fora de `benchmarks/` (R3.1); `node --check` nos 8
  arquivos; `JEV_MODO=off node scripts/jev.mjs classificar --dry-run` → mensagem "siga só pelos
  sinais" e código 2, sem servidor (R1.3); caminhos de falha do Jev → `revisar`, nenhum `liberar`
  (R1.2, INV-1). `testes/invariantes.mjs` falha **antes e depois** da mudança (acha `modelo Claude`
  nos quadros reais): problema antigo, fora desta subtarefa (em Pendências).
