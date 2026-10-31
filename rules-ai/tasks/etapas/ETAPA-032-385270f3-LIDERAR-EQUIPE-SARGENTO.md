## Etapa 032-385270f3 — LIDERAR-EQUIPE-SARGENTO: skill `liderar-equipe` com o líder "sargento", o VIGIA e o FINANCEIRO

**Tarefa:** LIDERAR-EQUIPE-SARGENTO · **Pedido em:** 2026-10-20 08:35 · **Criada por:** Claude Code (Opus 5.5) (nuvem · main)
**Pedido:** "e ja melhore a skill liderar-equipe, com o que esta escrito no PROMPT_PARA_O_LIDER" →
pergunta "Onde melhoro a skill?" → "Todos os 5 projetos"
**Objetivo:** a skill `liderar-equipe` passa a ensinar o que está em
`tasks/GERENCIADOR-HERDR/PROMPT_PARA_O_LIDER.md` e `PROMPT_FINANCEIRO.md`: o líder só gerencia
(não executa subtarefa), dispara agentes do nível em paralelo (herdr no PC; subagentes na nuvem),
cria o **VIGIA** (Haiku: avisa agente parado ou travado) e o **FINANCEIRO** (Haiku: acompanha os
créditos e, perto do fim, o líder manda cada agente salvar o status em
`STATUS_TAREFAS_ANDAMENTO.md`).

### Escopo

- **Entra:** a fonte `.agents/skills/liderar-equipe/SKILL.md` de `template-inicial-tasks-ia`,
  `rea-app-clones`, `testes-de-frontend` e `dashboard-ai` (com as cópias do
  `npm run sync:agentes`), e `.claude/skills/liderar-equipe/SKILL.md` do `aulasenai`; commit na
  `main` de cada um.
- **Não entra:** mudar as regras de nível (C22), o quadro ou os agentes `executor-*`; o herdr em si;
  ler o uso das contas A/B/C (o FINANCEIRO usa o que cada terminal ou subagente informa).

### Riscos

| Risco | Plano B |
|---|---|
| A skill de cada projeto tem trechos próprios (dashboard: Jev; aulasenai: outro texto) | acrescentar uma seção igual nos 5 sem apagar o que é do projeto |
| "Só gerencia" contradiz a regra atual "o líder confere, valida e commita" | o líder continua com Git, quadro e conferência; só não **executa** subtarefa |

### Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-20 08:35 | Tarefa criada e aprovada pelas respostas do chat ("Todos os 5 projetos"; "Sim, adapte com subagentes"); nível pelo Jev | Gelvazio · Claude Code (Opus 5.5) | pedido do usuário; mudança em 5 repositórios |

### LIDERAR-EQUIPE-SARGENTO.1 — Texto da seção "Líder sargento" (VIGIA, FINANCEIRO, paralelo)

**Próximo passo:** escrever a seção nova na skill do `template-inicial-tasks-ia` (fonte) a partir dos
dois prompts, com a versão PC (herdr) e a versão nuvem (subagentes), e rodar `npm run sync:agentes`.

- **Nível:** LEVE — Jev `LEVE`, final proposto `LEVE`, confiança 0.30, ação `humano` (só `.md`)
- **Modelo:** só Haiku — nunca outro (C22)
- **Effort:** low
- **Arquivos:** `template-inicial-tasks-ia/.agents/skills/liderar-equipe/SKILL.md` (e as cópias)
- **Critérios de aceitação:** a seção cobre: só gerencia; agentes do nível em paralelo sem dois nos
- **JEV-AI-SUGGESTION:** NAO
  mesmos arquivos; VIGIA; FINANCEIRO com limite e "salvar status"; formato do
  `STATUS_TAREFAS_ANDAMENTO.md`; `--checar` com código 0.
- **Entrega:** Claude Code (Haiku 5.5 · executor-leve; líder Opus 5.5) — `template-inicial-tasks-ia` `feb00eb`: seção `## Líder sargento: equipe em paralelo, VIGIA e FINANCEIRO` (só gerencia, paralelo sem arquivos em comum, herdr no PC e subagentes na nuvem, VIGIA 10 min, FINANCEIRO 85% e `STATUS_TAREFAS_ANDAMENTO.md`, retomar), 2 linhas na tabela "Quem é quem" e o `description`; cópias regeradas · **Verificação (líder):** diff lido pelo líder; `sincronizar-agentes.mjs --checar` código 0; linhas novas ≤ 100 caracteres

### LIDERAR-EQUIPE-SARGENTO.2 — Levar a seção aos outros 4 projetos

**Próximo passo:** copiar a mesma seção para `rea-app-clones`, `testes-de-frontend`,
`dashboard-ai` (fonte `.agents` + `sync:agentes`) e `aulasenai` (`.claude/skills`), sem
apagar o que é de cada projeto; um commit por projeto na `main`.

- **Nível:** PESADO — Jev `LEVE`, final proposto `PESADO`, confiança 0.27, ação `humano`, sinais de PESADO: massa, mais_de_3_arquivos
- **Modelo:** só Opus 5.5+/Fable ou DeepSeek — nunca outro (C22)
- **Effort:** high
- **Arquivos:** a skill `liderar-equipe` dos 4 projetos
- **Critérios de aceitação:** a seção idêntica nos 5; `--checar` 0 onde existe; nada além da skill.
- **Entrega:** Claude Code (Opus 5.5 · executor-pesado; líder Opus 5.5) — mesma seção nos outros 4: rea-app-clones `fc13d90`, testes-de-frontend `c387adb`, dashboard-ai `5b97029` (sem apagar o que é do projeto), aulasenai `7dc269d` (`.claude/skills`); o líder devolveu 2 correções: ressalva do modo sargento no "Proibido" (achada pelo próprio executor) e a referência do herdr para `rules-local/regras/herdr.md` (feita por um Haiku); template de novo em `170df75` · **Verificação (líder):** `--checar` 0 nos 4 com gerador; `diff` da seção "Líder sargento" contra o template: sem diferença nos 4; só a skill e as cópias mudaram em cada repositório
- **JEV-AI-SUGGESTION:** NAO
