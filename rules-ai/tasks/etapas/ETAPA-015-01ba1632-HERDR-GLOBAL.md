## Etapa 015-01ba1632 — HERDR-GLOBAL: herdr (agentes em painéis) nas regras globais

**Tarefa:** HERDR-GLOBAL · **Pedido em:** 2026-10-17 23:20 · **Criada por:** Claude Code (Opus 5.5) (nuvem · main), aberto em `REA-APP-CLONES`
**Pedido:** "Leia a skill de https://github.com/Gelvazio/herdr.git, e veja como f7nciona e como
integrar aqui" e, depois da análise, "Libere a reserva e comece direto pelo herdr e também
adicione o herdr no repositório rules-ai".
**Objetivo:** todas as IAs de todos os projetos saberem quando e como usar o herdr (terminal que
roda agentes em painéis) sem furar as regras de quadro, reserva, nível e Git.

> 🌐 **GLOBAL:** regra C33, decidida pelo usuário no pedido. No REA, a tarefa HERDR (etapa 015)
> põe o modo herdr na skill `liderar-equipe` e aponta para esta regra.

### Escopo

- **Entra:** `regras/herdr.md` (C33); C33 no `CONFLITOS.md`; Registro de decisões; instalação da
  skill do herdr **global** (uma cópia só, da versão do herdr instalado).
- **Não entra:** copiar a skill do herdr para este repositório (ela muda a cada versão do herdr);
  disparo automático de sessões (GERENCIADOR-GLOBAL.4 continua em pausa); `--aplicar` e instalação
  no Windows feitos daqui (sessão na nuvem, sem acesso ao computador do usuário).

### Riscos

| Risco | Plano B |
|---|---|
| herdr usado para abrir sessões sozinho, contornando a pausa do gerenciador | A regra só deixa abrir agente com pedido do usuário na conversa, e o agente do painel trabalha como agente de equipe do líder |
| Agente do painel com modelo fora do nível da subtarefa | A regra manda escolher `--kind` e modelo pela matriz de `niveis-e-modelos.md` e reservar no nome do agente |
| Sessão na nuvem não testa nada de verdade | Conferência por leitura e `node scripts/sincronizar.mjs` (simulação); primeiro uso real com o usuário |

### Decisões

| Data | Decisão | Quem | Palavras |
|---|---|---|---|
| 2026-10-17 23:20 | Herdr nas regras globais | Gelvazio | "também adicione o herdr no repositório rules-ai" |
| 2026-10-17 23:28 | Skill do herdr instalada global pelo próprio herdr (`npx skills add Gelvazio/herdr --skill herdr -g` ou `herdr --skill`), sem cópia nos repositórios | Claude Code (Opus 5.5) (nuvem · main) | Uma cópia só, sempre da versão do herdr instalado |

### HERDR-GLOBAL.1 — Regra C33 (`regras/herdr.md`)

**Próximo passo:** escrever `regras/herdr.md`.

- **Nível:** PESADO — muda regra global de todas as IAs.
- **Modelo:** Opus 5.5+ / Fable — ou DeepSeek, desde a C35 (2026-10-18).
- **Effort:** high.
- **Descrição:** o que é o herdr, como instalar a skill e as integrações, quando usar (só dentro do
- **JEV-AI-SUGGESTION:** NAO
  herdr, com `HERDR_ENV=1`, e com pedido do usuário), como abrir outra IA num painel como agente de
  equipe (frente com o painel, nível pela matriz, só o líder no Git e no quadro), e o que nunca
  fazer (responder aprovação sozinho, fechar o que não abriu, parar o servidor, disparo automático).
- **Critérios de Aceitação:** arquivo ≤ 5 KB sem repetir regra de outro arquivo (aponta para
  eles); C33 no `CONFLITOS.md`; linha no Registro de decisões; `node scripts/sincronizar.mjs`
  (simulação) gera o unificado com a C33.
- **Entrega:** `regras/herdr.md` (commit `feat(HERDR-GLOBAL.1)`), C33 no `CONFLITOS.md`.
- **Verificação:** `regras/herdr.md` abaixo de 5 KB e sem repetir regra (aponta para `ciclo-da-task.md`,
  `frentes-e-reserva.md`, `niveis-e-modelos.md`, `git-geral.md`, `gerenciador-centralizado.md`);
  `node scripts/sincronizar.mjs` (simulação) mostra a C33 no unificado.

### HERDR-GLOBAL.2 — Levar ao computador do usuário

**Próximo passo:** usuário roda os comandos da seção (ou pede a uma sessão local).

- **Nível:** — (ação no computador do usuário)
- **Modelo:** Usuário
- **Descrição:** no Windows, em `C:\fontes\rules-ai`: `git pull --rebase origin main` e
- **JEV-AI-SUGGESTION:** NAO
  `node scripts/sincronizar.mjs --aplicar`; instalar o herdr
  (`powershell -ExecutionPolicy Bypass -c "irm https://herdr.dev/install.ps1 | iex"`), a skill
  (`npx skills add Gelvazio/herdr --skill herdr -g`) e as integrações dos agentes usados
  (`herdr integration install claude`, `codex`, `grok`, `cursor`, `devin`, `antigravity-cli`…).
- **Critérios de Aceitação:** `herdr --version` responde; `dist/REGRAS-GLOBAIS.md` tem a C33.
