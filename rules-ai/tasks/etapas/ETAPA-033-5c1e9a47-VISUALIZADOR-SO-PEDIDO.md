## Etapa 033-5c1e9a47 — VISUALIZADOR-SO-PEDIDO: visualizador gerado só com pedido explícito, só no local (C45)

**Tarefa:** VISUALIZADOR-SO-PEDIDO · **Pedido em:** 2026-10-22 07:10 · **Criada por:** Claude Code (Opus 5.5) (local · main · aulasenai s35)
**Pedido:** "adicione 1 regra que proiba de ser gerado este arquivo *.claude/rules/index.html*,
apenas com pedido explicito e no claude local, nunca em nuvem" → "coloque isso na regra global
pra todos os projetos" → "e aplique tambem ja no dashboard-ai" → "e neste projeto aqui
*REA-APP-CLONES*, tambem aplique"
**Objetivo:** parar a regeneração do visualizador a cada commit (cada uma vira um deploy de
~51 MB na Vercel do `aulasenai` e estourou o Deployment Storage), com regra global e aplicada em
`aulasenai`, `dashboard-ai` e `REA-APP-CLONES`.

### Escopo

- **Entra:** `regras/visualizador-gerado.md` (nova), `regras/INDEX.md`, `CONFLITOS.md` (C45),
  `dist/` e `VERSAO.md` pelo `scripts/sincronizar.mjs`, `STATUS_PROJETO.md`; nos 3 projetos, a
  atualização do `rules-local/`; no `aulasenai`, as regras e comandos que mandavam regenerar.
- **Não entra:** mudar o gerador, apagar o `index.html`, gancho que bloqueie o gerador.

### Requisitos

| ID | Requisito (EARS) | Cobre | Verificação |
|----|------------------|-------|-------------|
| R1 | O SISTEMA DEVE ter a regra global `regras/visualizador-gerado.md` listada no `regras/INDEX.md` e entregue no `dist/REGRAS-GLOBAIS.md` | VISUALIZADOR-SO-PEDIDO.1 | `grep "C45" dist/REGRAS-GLOBAIS.md` |
| R2 | QUANDO uma regra do `aulasenai` falar do visualizador, O SISTEMA DEVE mandar gerar só com pedido explícito e só no local | VISUALIZADOR-SO-PEDIDO.1 | `grep -rn gerar_visualizador` nas regras e comandos do `aulasenai` sem ordem de regenerar por conta própria |
| R3 | ONDE o projeto tem `rules-local/` (`aulasenai`, `dashboard-ai`, `REA-APP-CLONES`), O SISTEMA DEVE trazer a versão nova com a regra | VISUALIZADOR-SO-PEDIDO.1 | `rules-local/regras/visualizador-gerado.md` existe nos 3 |

### Invariantes

N/A — mudança só de texto de regra, sem código nem dado; a conferência é por `grep` (R1–R3).

### Perguntas abertas

| # | Pergunta | Resposta | Situação |
|---|----------|----------|----------|
| 1 | Projetos onde aplicar | `aulasenai`, `dashboard-ai`, `REA-APP-CLONES` (pedido do usuário) | ✅ Fechada |

### Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-22 07:10 | Pedido explícito e de escopo fechado vale como aprovação do plano | Usuário (registrado por Claude Code (Opus 5.5)) | as 4 mensagens do pedido |

### VISUALIZADOR-SO-PEDIDO.1 — Regra global C45 e aplicação nos 3 projetos

**Próximo passo:** — (concluída)

- **Nível:** PESADO — regra global em mais de 3 arquivos ligados, em 4 repositórios
- **Modelo:** só Opus 5.5+/Fable ou DeepSeek — nunca outro
- **Effort:** high
- **Descrição:** escrever a regra, C45, índice, sincronizar; ajustar as regras do `aulasenai`;
- **JEV-AI-SUGGESTION:** NAO
  atualizar o `rules-local/` dos 3 projetos e commitar + push em cada um.
- **Critérios de aceitação:** R1–R3 com a verificação feita.
- **Entrega:** `rules-ai` `edeebc6` (regra, índice, C45, versão `2026-10-22-00769678`, `dist/`
  e arquivos globais das IAs pelo `sincronizar.mjs --aplicar`); `aulasenai` `f73057e8` (#341:
  regras, comandos, skills e hook alinhados + `rules-local/`); `dashboard-ai` `4417f49` e
  `REA-APP-CLONES` `8f2e82a` (`rules-local/`; C45 sem ajuste: o visualizador lê os `.md` ao abrir)
  — 2026-10-22 07:40
- **Verificação:** R1 `grep -c C45 dist/REGRAS-GLOBAIS.md` = 2; R2 `grep -rn gerar_visualizador`
  no `aulasenai` só no bloco "Quando pedido" de `visualizador-regras.md`; R3
  `rules-local/regras/visualizador-gerado.md` presente nos 3 repositórios (commits acima).
