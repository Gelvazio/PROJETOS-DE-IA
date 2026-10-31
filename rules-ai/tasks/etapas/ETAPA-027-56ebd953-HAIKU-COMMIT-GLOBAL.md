## Etapa 027-56ebd953 — HAIKU-COMMIT-GLOBAL: o Haiku confere, commita e envia as entregas da equipe

**Tarefa:** HAIKU-COMMIT-GLOBAL · **Pedido em:** 2026-10-18 20:08 · **Criada por:** Claude Code (Opus 5.5) (local · main · aulasenai s17)
**Pedido:** "MUDE AS REGRAS,PRA QUE ESTA PARTE SEJA FEITA SEMPRE PELO HAIKU->CONFERIR,FAZER COMMIT E
PUSH,SE HOUVER PROBLEMAS,DAI ELE PEGA E ABRE UMA VERIFICACAO COM 1 SUBTASK AO SONNET" · "E MUDE ELA LA
NO *rules-ai* e aqui" (pedido feito na sessão do `aulasenai`, tarefa espelho #287 de lá, etapa
416-510f8b12)
**Objetivo:** na equipe de agentes, a conferência, o commit e o push de cada entrega passam do líder
para o Haiku; problema na conferência vira subtarefa de verificação para o Sonnet.

### Escopo

- **Entra:** decisão C41 no `CONFLITOS.md` (substitui, só na equipe de agentes, o "só o líder usa
  Git"); `regras/niveis-e-modelos.md` (Equipe de agentes); `regras/ciclo-da-task.md` (Encerrar) e
  os demais trechos que a varredura achar; `node scripts/sincronizar.mjs --aplicar`;
  `STATUS_PROJETO.md`.
- **Não entra:** sessão sozinha (sem equipe); regras de banco; tarefas concluídas; a matriz de níveis.

### Requisitos

| ID | Requisito (EARS) | Cobre | Verificação |
|----|------------------|-------|-------------|
| R1.1 | QUANDO um executor da equipe de agentes entrega uma subtarefa, O SISTEMA DEVE ter a conferência, o commit e o push feitos pelo Haiku (`executor-leve`) | HAIKU-COMMIT-GLOBAL.1 | leitura de `regras/niveis-e-modelos.md` e `regras/ciclo-da-task.md` |
| R1.2 | SE a conferência do Haiku achar problema, ENTÃO O SISTEMA DEVE não commitar e criar na mesma mãe a subtarefa `Verificação: <problema>` (`MEDIO · só Sonnet`, C26) | HAIKU-COMMIT-GLOBAL.1 | leitura |
| R1.3 | ONDE a entrega é `PESADO`, O SISTEMA DEVE limitar a conferência do Haiku a arquivos, sintaxe e registro da Verificação, sem banco | HAIKU-COMMIT-GLOBAL.1 | leitura |
| R1.4 | ENQUANTO a sessão trabalhar sozinha, O SISTEMA DEVE manter o fluxo atual (quem executa commita) | HAIKU-COMMIT-GLOBAL.1 | leitura |
| R2.1 | QUANDO a regra mudar, O SISTEMA DEVE gerar o `dist/` e gravar o arquivo global de cada IA | HAIKU-COMMIT-GLOBAL.2 | saída de `node scripts/sincronizar.mjs --aplicar`; `grep C41 dist/REGRAS-GLOBAIS.md` |

**Fora do escopo:** sessões sozinhas; banco; matriz de níveis.

### Invariantes

| ID | Regra que vale sempre | Domínio da entrada | Como conferir | Teste automatizado |
|----|----------------------|--------------------|---------------|--------------------|
| INV-1 | Nenhuma regra global diz que só o líder usa Git na equipe | `regras/*.md`, `CONFLITOS.md` | `grep -n "só o líder" regras CONFLITOS.md` | não: `grep` basta |
| INV-2 | O Haiku continua sem executar subtarefa `MEDIO`/`PESADO` (C22): só confere, commita e abre a verificação | `regras/*.md` | leitura | não: regra de texto |

**Casos de borda:** entrega sem nada a commitar; problema só visível na tela (sem navegador).

### Perguntas abertas

| # | Pergunta | Resposta | Fechada em | Quem respondeu |
|---|----------|----------|------------|----------------|
| 1 | Vale só na equipe de agentes ou também em sessão sozinha? | Só na equipe de agentes | 2026-10-18 20:10 | Gelvazio ("sim" ao padrão) |
| 2 | Em entrega `PESADO`, o Haiku confere sem consultar o banco? | Sim | 2026-10-18 20:10 | Gelvazio ("sim" ao padrão) |
| 3 | A reserva continua com o líder e o Haiku só move a linha para concluídas no commit? | Sim | 2026-10-18 20:10 | Gelvazio ("sim" ao padrão) |

### Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-18 20:10 | Plano aprovado ("sim") na sessão do `aulasenai` (#287.1) | Gelvazio | resposta no chat |

- 2026-10-23 16:50: **a pedido do usuário** ("HAIKU-COMMIT-GLOBAL deve ir pra Sonnet"), a .1 e a .2 passam de Opus 5.5+/Fable para **Sonnet (ou DeepSeek)**; a reserva parada da .1 (Opus, aulasenai s17, desde 2026-10-18 20:17, 0%) foi liberada pelo usuário. Nível continua PESADO.
### HAIKU-COMMIT-GLOBAL.1 — Regra global e decisão C41

**Próximo passo:** ✅ entregue em 2026-10-23; segue a .2 (`sincronizar.mjs --aplicar`).

- **Nível:** PESADO — regra de todas as IAs (arquitetura).
- **Modelo:** só Sonnet ou DeepSeek — nunca outro (C22; trocado do Opus a pedido do usuário em 2026-10-23)
- **Effort:** high
- **Entrega:** Claude Code (Sonnet 5.5) (local · main · rules-ai), 2026-10-23: C41 no `CONFLITOS.md`; texto novo em `regras/niveis-e-modelos.md` (Equipe de agentes), `regras/ciclo-da-task.md` (Encerrar, item 5), `regras/herdr.md` (item 3) e `regras/regra-maior.md`.
- **Verificação:** `grep -rni "só o líder" regras CONFLITOS.md` só acha a linha histórica da C33 e a própria C41 (INV-1 ok); `grep -rln C41 regras CONFLITOS.md` acha os 4 arquivos de regra e o `CONFLITOS.md`; leitura de R1.1 a R1.4 e INV-2 no texto novo. `dist/` e arquivos globais das IAs ficam para a .2.
- **JEV-AI-SUGGESTION:** NAO

### HAIKU-COMMIT-GLOBAL.2 — Levar às IAs (`sincronizar.mjs --aplicar`)

**Próximo passo:** ✅ entregue em 2026-10-23; tarefa-mãe concluída.

- **Nível:** PESADO — mexe nos arquivos globais de todas as IAs.
- **Modelo:** só Sonnet ou DeepSeek — nunca outro (C22; trocado do Opus a pedido do usuário em 2026-10-23)
- **Effort:** high
- **Entrega:** Claude Code (Sonnet 5.5) (local · main · rules-ai), 2026-10-23 17:30: `node scripts/sincronizar.mjs --aplicar` gravou o bloco gerenciado (com `.bak`) em Gemini CLI, Codex, Grok, Qoder, opencode, Devin, Kiro, Hermes Agent e Kilo Code; as 4 contas do Claude Code já estavam iguais (importam o `dist/`). Versão `2026-10-23-d9c8a839`.
- **Verificação:** prévia sem `--aplicar` listou 9 `mudaria`; depois do `--aplicar`, `grep -c C41` deu 4 em `dist/REGRAS-GLOBAIS.md` e em `~/.codex/AGENTS.md`, `~/.gemini/GEMINI.md` e `~/.config/kilo/AGENTS.md`. Pendência que não é desta tarefa: Codex pede `codex_hooks = true` em `~/.codex/config.toml`, à mão.
- **JEV-AI-SUGGESTION:** NAO
