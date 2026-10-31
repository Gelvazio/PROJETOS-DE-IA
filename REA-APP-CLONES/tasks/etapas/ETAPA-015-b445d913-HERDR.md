## Etapa 015-b445d913 — HERDR: integrar o herdr (agentes em painéis) à equipe de agentes

**Tarefa:** HERDR · **Pedido em:** 2026-10-17 23:20 · **Criada por:** Claude Code (Opus 5.5) (nuvem · main)
**Pedido:** "Leia a skill de https://github.com/Gelvazio/herdr.git, e veja como f7nciona e como
integrar aqui" e, depois da análise em 4 itens, "Libere a reserva e comece direto pelo herdr e
também adicione o herdr no repositório rules-ai".
**Objetivo:** o líder da equipe poder abrir outras IAs (Codex, Grok, Gemini, Claude…) em painéis do
herdr, mandar a subtarefa, esperar e conferir — com as mesmas regras de quadro, reserva e nível.

> Tarefa **grande** (várias partes, muda o fluxo de várias IAs). Plano aprovado no pedido
> ("comece direto pelo herdr"); ver "Decisões".

### Escopo

- **Entra:** modo herdr na skill `liderar-equipe` (fonte `.agents/`, cópias pelo `sync:agentes`);
  ponteiro em `.claude/rules/multiplas-ias.md` para a regra global do herdr (`rules-ai`,
  HERDR-GLOBAL.1, C33).
- **Não entra:** cópia da skill do herdr dentro do REA (ela é instalada global, pela regra C33);
  instalar o herdr e as integrações no Windows (ação do usuário: HERDR-GLOBAL.2 no `rules-ai`);
  disparo automático de sessões (GERENCIADOR-GLOBAL.4, em pausa).
- **Critério de pronto:** `npm run check:agentes` sem diferença; a skill `liderar-equipe` explica
  quando e como usar o herdr; a regra do REA aponta para a global sem repeti-la.

### Riscos

| Risco | Plano B |
|---|---|
| Sem herdr na nuvem, nada é testado de verdade aqui | Validar por leitura e pelos comandos do projeto; o primeiro uso real fica com o usuário no Windows |
| Agente no painel edita quadro ou faz commit | A skill manda no pedido: só os arquivos da lista, sem Git e sem quadro; o líder confere o `git diff --name-only` |
| Agente para numa aprovação (`blocked`) | O líder lê o painel e pergunta ao usuário; nunca responde sozinho |

### Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-17 23:20 | Plano aprovado: modo herdr no `liderar-equipe`, regra no `multiplas-ias.md` e regra global no `rules-ai` | Gelvazio | "Libere a reserva e comece direto pelo herdr e também adicione o herdr no repositório rules-ai" |
| 2026-10-17 23:28 | A skill do herdr **não** é copiada para `.agents/skills/`: fica global (`npx skills add Gelvazio/herdr --skill herdr -g` ou `herdr --skill`), pela regra C33 do `rules-ai` | Claude Code (Opus 5.5) (nuvem · main) | Uma cópia só para todos os projetos e sempre da mesma versão do herdr instalado (o arquivo muda a cada versão) |

### HERDR.1 — Modo herdr na skill `liderar-equipe`

**Próximo passo:** reservar (depois da HERDR-GLOBAL.1 entregue no `rules-ai`).

- **Nível:** PESADO — muda o fluxo de coordenação de várias IAs (arquitetura da equipe) · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles) · **Effort:** high
- **Depende de:** HERDR-GLOBAL.1 (`rules-ai`)
- **Descrição:** seção nova em `.agents/skills/liderar-equipe/SKILL.md`: quando usar o herdr
- **JEV-AI-SUGGESTION:** NAO
  (só com `HERDR_ENV=1` e pedido do usuário), como escolher o `--kind` e o modelo pelo nível,
  nome da frente com o painel, abrir painel, iniciar o agente, mandar o pedido, esperar, conferir
  e fechar só o que abriu. Cópias geradas pelo `npm run sync:agentes`.
- **Critérios de Aceitação:** passos 4 a 8 do ciclo do líder valem iguais (reserva, conferência,
  validação e commit só pelo líder); `npm run check:agentes` sem diferença.

### HERDR.2 — Ponteiro para a regra global do herdr em `multiplas-ias.md`

**Próximo passo:** reservar (depois da HERDR.1).

- **Nível:** LEVE — só texto curto em `.md` · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin) · **Effort:** low
- **Depende de:** HERDR.1
- **Descrição:** seção curta "Agentes em painéis (herdr)" em `.claude/rules/multiplas-ias.md` que
- **JEV-AI-SUGGESTION:** NAO
  aponta para a regra global C33 e para a seção da skill `liderar-equipe`, sem repetir as regras;
  linha no "Registro de decisões" do `STATUS.md` (regra do `INDEX.md`).
- **Critérios de Aceitação:** arquivo ≤ 5 KB; nenhuma regra do herdr repetida.
