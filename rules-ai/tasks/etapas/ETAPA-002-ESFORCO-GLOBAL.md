## Etapa 002 — ESFORCO-GLOBAL e CONFEFFORT-GLOBAL: esforço (`effort`) vale para todos os projetos

**Tarefas:** ESFORCO-GLOBAL e CONFEFFORT-GLOBAL · **Pedido em:** 2026-10-16 19:51 · **Criada por:** Claude Code (Sonnet 5.5) (local · main)
**Pedido:** "ESTAS 2 TAREFAS DEVEM SERVIR DE FORMA GLOBAL, ASSUMA ELAS E DEIXE ISSO CLARO"
**Objetivo:** levar para o `rules-ai` (global) as duas tarefas que nasceram no REA: o esforço por
nível de agente (ESFORCO) e a conferência de que o `effort` é aplicado em cada modelo (CONFEFFORT).

> 🌐 **ESTAS DUAS TAREFAS SÃO GLOBAIS:** valem para todos os projetos de `C:\fontes` e todas as IAs.
> Origem: REA, etapas 011-9d3e7a52 (ESFORCO, concluída) e 012-5b1f0c86 (CONFEFFORT, pendente). A
> partir de 2026-10-16 19:51 o quadro oficial é **este** (`rules-ai/tasks/STATUS.md`); o REA só guarda
> o histórico e aponta para cá.

### Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-16 19:51 | Quadro oficial das duas tarefas passa a ser o do `rules-ai`; as linhas do REA viram histórico/apontamento | Gelvazio | "devem servir de forma global" |
| 2026-10-16 19:51 | Esforço por nível (aprovado no REA, 2026-10-16 12:49): `LEVE` = `low`, `MEDIO` = `medium`, `PESADO` = `high` | Gelvazio | "SIM" à tabela proposta na ETAPA-011 |
| 2026-10-16 19:51 | CONFEFFORT continua com uma subtarefa **por modelo**, cada uma só pelo modelo escrito nela | Gelvazio | Pedido original da ETAPA-012 |

### ESFORCO-GLOBAL.1 — Regra global `regras/esforco.md`

**Próximo passo:** — (entregue).

- **Nível:** LEVE — só `.md` · **Modelo:** Claude Code Sonnet 5.5 pega por não haver subtarefa MEDIO livre para esta frente sem violar "1 por frente"; registrado.
- **Critérios de aceitação:** regra sincronizada nas IAs; `CONFLITOS.md` com a decisão (C21).
- **Entrega:** `regras/esforco.md`, C21 em `CONFLITOS.md`, sincronizada nas IAs · **Verificação:** `sincronizar.mjs --aplicar` gravou as IAs e o unificado inclui `esforco.md`.
- **JEV-AI-SUGGESTION:** NAO

### ESFORCO-GLOBAL.2 — Aceite do usuário

**Próximo passo:** 👀 depois da .1.

- **Nível:** LEVE — conferência do usuário.
- **JEV-AI-SUGGESTION:** NAO

### CONFEFFORT-GLOBAL — Subtarefas por modelo

Procedimento e problema padrão: os da ETAPA-012 do REA (`REA-APP-CLONES/tasks/etapas/ETAPA-012-5b1f0c86-CONFEFFORT.md`), sem mudar uma palavra. Cada subtarefa só pelo modelo indicado.

- **CONFEFFORT-GLOBAL.1** — Haiku 5.5 (LEVE) · **.2** — Sonnet 5.5 (MEDIO) · **.3** — Opus 5.5 (PESADO, incluir `xhigh`) · **.4** — Gemini Pro (MEDIO) · **.5** — DeepSeek raciocínio (MEDIO).
- **Critérios de aceitação:** tabela com `low`/`medium`/`high` (tokens, tempo, tamanho) e conclusão em uma linha (`aplicado`, `ignorado` ou `não deu para medir`).
- **Entrega:** — · **Verificação:** — (por subtarefa, na hora de executar).

#### CONFEFFORT-GLOBAL.1 — Haiku 5.5 — resultado (2026-10-23, Claude Haiku 5.5, local · main)

**Próximo passo:** — (entregue).

- **Nível:** LEVE · **Modelo:** só Haiku 5.5 · **Effort:** low
- **Entrega:** 3 agentes descartáveis `model: haiku`, um por `effort` (low, medium, high; parâmetro `effort` do Agent), problema padrão da ETAPA-012 do REA colado sem mudar uma palavra; medidas do relatório de uso de cada subagente. Nenhum arquivo do repositório foi alterado pela medição.

| effort | tokens totais | tempo | resposta |
|---|---|---|---|
| `low` | 129.116 | 23.591 ms | 39 de 40 ordens listadas (a 40ª ficou "ver nota"; o próprio agente admitiu a falha); método em 3 passos |
| `medium` | 128.205 | 20.145 ms | 40 ordens, lista completa, método em 4 passos com conferência |
| `high` | 132.099 | 35.192 ms | 40 ordens, lista completa, método em 6 passos, conferência por exclusão |

**Conclusão (uma linha): não deu para medir com confiança** — só `high` se afasta (+2,3% de tokens e +49% de tempo em relação a `low`); `low` e `medium` ficam iguais e tokens e tempo não crescem de forma contínua de `low` a `high`.
Ressalvas: 1 execução por nível (amostra pequena; o tempo varia muito entre execuções); o `effort` foi passado pelo parâmetro do Agent, não por frontmatter em cópia temporária (a ferramenta Agent não carrega definição de agente de pasta temporária); o mapeamento de `effort` para cada resultado segue a ordem de retorno dos três agentes (o retorno não traz o `effort`); os tokens incluem o contexto fixo do subagente (~129 mil, bem acima dos ~40 mil das rodadas do Opus), por isso só a diferença importa.

- **Verificação:** os 3 relatórios de uso (`subagent_tokens` e `duration_ms`) lidos no retorno dos agentes; as contas finais (40) conferidas por exclusão (60 − 20 = 40), não linha a linha das listas; a lista do `low` tem 39 entradas.
- **JEV-AI-SUGGESTION:** NAO

#### CONFEFFORT-GLOBAL.2 — Sonnet 5.5 — resultado (2026-10-16 20:05, Claude Code Sonnet 5.5, local · main)

Agentes descartáveis `model: sonnet` (parâmetro `effort` do Agent), problema padrão colado sem mudar uma palavra; medidas do relatório de uso de cada subagente:

| effort | tokens totais | tempo | resposta |
|---|---|---|---|
| `low` | 41.253 | 14.119 ms | 40 ordens, lista completa |
| `medium` | 41.331 | 14.513 ms | 40 ordens, lista completa |
| `high` | 41.424 | 14.515 ms | 40 ordens, lista completa |

**Conclusão (uma linha): `effort` ignorado ou sem efeito mensurável neste problema** — diferença de 0,4% nos tokens e de 0,4 s, sem passos de raciocínio a mais; os três acertaram.
Ressalva: o problema pode ser fácil demais para o Sonnet gastar raciocínio extra e o relatório de uso não separa tokens de raciocínio; para decidir remover ou ajustar o campo, repetir com problema mais difícil.

### CONFEFFORT-GLOBAL.6 — Sonnet 5.5: 2ª rodada com problema difícil

**Próximo passo:** rodar 9 agentes (3 por `effort`) e comparar tokens, tempo e tamanho.

- **Nível:** MEDIO · **Modelo:** só Claude Code Sonnet 5.5. Pedido do usuário ("sim") depois de a rodada 1 não mostrar diferença.
- **Problema:** 9 pessoas A–I com 9 restrições cruzadas; gabarito 77 (força bruta em Python). Critério: tokens/tempo crescem de `low` a `high`, `effort` ignorado ou só `high` muda.
- **Entrega:** — · **Verificação:** —
- **JEV-AI-SUGGESTION:** NAO

#### CONFEFFORT-GLOBAL.6 — resultado (2026-10-16 20:25, Claude Code Sonnet 5.5, local · main)

9 agentes `model: sonnet` (3 por `effort`), mesmo enunciado (9 pessoas, 9 regras; gabarito 77). Todos acertaram 77, resolvendo por script Python (1 a 2 chamadas de ferramenta).

| effort | tokens (3 execuções) | média | tempo (3 execuções) | média |
|---|---|---|---|---|
| `low` | 42.503 · 42.512 · 42.615 | 42.543 | 8,6 · 7,9 · 8,2 s | 8,2 s |
| `medium` | 42.761 · 42.578 · 42.604 | 42.648 | 8,4 · 7,4 · 9,7 s | 8,5 s |
| `high` | 43.247 · 43.843 · 42.490 | 43.193 | 12,4 · 14,9 · 8,7 s | 12,0 s |

**Conclusão (uma linha): `low` e `medium` indistinguíveis; só `high` mostra diferença, e pequena** (+1,5% de tokens, +46% de tempo; 2 das 3 execuções de `high` usaram 2 chamadas de ferramenta, a terceira ficou igual a `low`/`medium`).
Ressalvas: amostra de 3 por nível; o problema foi resolvido por força bruta (pouco raciocínio a regular); o relatório de uso não separa tokens de raciocínio. Recomendação para decisão do usuário: manter `high` só no `executor-pesado`; `low` vs `medium` não se comprovou.

#### CONFEFFORT-GLOBAL.3 — Opus 5.5 — resultado (2026-10-17 13:05, Claude Code Opus 5.5, local · main)

- **Nível:** PESADO · **Modelo:** só Claude Code Opus 5.5.
- **Entrega:** 4 agentes descartáveis `model: opus`, um por nível (parâmetro `effort` do Agent),
  problema padrão da ETAPA-012 do REA, sem ferramentas; medidas do relatório de uso de cada um:

| effort | tokens totais | tempo | resposta |
|---|---|---|---|
| `low` | 39.893 | 19.010 ms | 40 ordens, lista completa, conta + conferência por complemento |
| `medium` | 40.206 | 21.810 ms | 40 ordens, lista completa, duas formas de contar |
| `high` | 40.380 | 22.911 ms | 40 ordens, lista completa, tabela das 10 bases + conferência |
| `xhigh` | 40.823 | 26.635 ms | 40 ordens, lista completa, explicita a premissa de "antes", duas contagens e verificação |

**Conclusão (uma linha): `effort` aplicado** — tokens e tempo crescem em ordem de `low` a `xhigh`
(+2,3% de tokens, +40% de tempo), e a resposta fica mais cuidadosa a cada nível; os quatro acertaram 40.
- **Verificação:** os 4 relatórios de uso (tokens e `duration_ms`) lidos pelo líder; as 40 ordens
  conferem nas 4 respostas. Ressalvas: 1 execução por nível; os tokens incluem o contexto fixo do
  agente (~38 mil), então a diferença absoluta é pequena e o tempo é o sinal mais claro.

### CONFEFFORT-GLOBAL.7 — Atualizar a C21 com a conferência do Opus

**Próximo passo:** — (entregue).

- **Nível:** LEVE — só `.md` e rodar um script já existente.
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **Pedido:** "sim, abra a subtarefa e atualize a C21" (2026-10-17 13:11); criada no caminho (C26).
- **Descrição:** (1) em `regras/esforco.md`, trocar a linha que começa com "- Conferência do Sonnet
- **JEV-AI-SUGGESTION:** NAO
  5.5 (CONFEFFORT-GLOBAL.2 e .6)" por:
  `- Conferência por modelo: **Sonnet 5.5** (CONFEFFORT-GLOBAL.2 e .6): `low` e `medium` sem diferença mensurável; só `high` mostrou efeito pequeno. **Opus 5.5** (CONFEFFORT-GLOBAL.3, 2026-10-17): `effort` aplicado — tokens e tempo crescem de `low` a `xhigh` (+2,3% de tokens, +40% de tempo), todos com a resposta certa. Faltam Haiku, Gemini e DeepSeek.`;
  (2) em `STATUS_PROJETO.md`, nova linha no topo de "O que mudou desde a última gravação";
  (3) `node scripts/sincronizar.mjs --aplicar` (a C21 está nos arquivos globais das IAs) e conferir
  que `dist/REGRAS-GLOBAIS.md` contém "**Opus 5.5** (CONFEFFORT-GLOBAL.3".
- **Critério de pronto:** só essa linha muda em `esforco.md`; sincronizador sem erro.
- **Entrega (2026-10-17 13:12, Haiku · executor-leve; líder Opus 5.5):** `regras/esforco.md` (1 linha), `STATUS_PROJETO.md`; `sincronizar.mjs --aplicar` sem erro (Gemini CLI, Codex, Grok, Qoder, opencode, Devin e Kiro gravados; Claude Code igual).
- **Verificação (líder):** `git diff --stat` = 1 linha trocada em `esforco.md` e 1 inserida no status; `dist/REGRAS-GLOBAIS.md` contém a linha nova.

### ESFORCO-GLOBAL.3, .4 e .5 — `effort` em todos os agentes e em todas as tarefas pendentes

**Pedido (2026-10-16 20:40):** "2-aceito; 1-crie em todas as tarefas o effort; 3-adicione o effort sempre, se não usa, é só o modelo ignorar, faça isso pra todas as tarefas que estão pendentes no quadro de tarefas em todos os projetos"

- **.3** (MEDIO): `effort:` no frontmatter dos agentes (`classificador-tarefas`/`executor-leve` = low, `executor-medio` = medium, `executor-pesado` = high), em todos os projetos que têm agentes; cópias por IA regeradas pelo script de cada projeto. IA que não usa o campo o ignora.
- **.4** (PESADO, mudança em massa): em cada linha ⬜ dos quadros, acrescentar `effort` derivado do nível (LEVE=low, MEDIO=medium, PESADO=high). Linha sem nível: classificar pelos sinais de `niveis-e-modelos.md` (na dúvida sobe) e gravar `nível · effort`. Aceite do usuário = `effort low`. Fora: `DEMAIS-PROJETOS-DE-SISTEMAS-MANTER-OFFLINE` (regra C20) e `ajax-ai-by-pewdiepie` (cópias de terceiros).
- **Decisão** (2026-10-16 20:40, Gelvazio): o `effort` vai **sempre**, em todas as tarefas e IAs; quem não usa ignora.

- **.3 entregue (2026-10-16 20:50):** `effort` em 19 agentes — aulasenai `38d5d701` (7, inclusive revisor e auditores = medium), template `fbeba06`, testes-de-frontend e dashboard-ai (cópias por `npm run sync:agentes`). Por engano entraram arquivos não rastreados de outras frentes (aulasenai `.agents/`, template `.codex/hooks*`); tirados do Git no commit seguinte, continuam no disco.

- **.4 entregue (2026-10-16 21:00):** `effort` em 319 linhas ⬜ de 7 quadros. Com nível já gravado (152): `· effort <x>` na célula do nível. Sem nível (167): classificadas por script (sinais de `niveis-e-modelos.md`; nome da matéria não conta como sinal) e gravado `` `NIVEL · effort x` `` no título.
  | Quadro | Commit | Linhas |
  |---|---|---|
  | REA | `929f7d0` | 138 com nível |
  | aulasenai | `1f8deb81` (+ visualizador regenerado) | 9 com nível + 94 classificadas (53 PESADO, 35 MEDIO, 6 LEVE) |
  | rules-ai | `7d11a27` | 6 |
  | testes-de-frontend | `dfd32ae` | 9 classificadas |
  | AUTOMATIZACAO-LEITURA-EMAILS | `cca6e23` | 25 classificadas |
  | dashboard-plataformas-de-ia | `5789c64` | 4 classificadas |
  | dashboard-ai (9 cópias, mesmo repositório) | `36f2b2a` | 39 classificadas |
  **Verificação:** simulação revisada linha a linha antes de aplicar (corrigidos: nome de matéria com "Arquitetura"/"Segurança", "banco de horas", "migrado", gerador/visualizador como código); push conferido (local = remoto) nos 7. Fora: pasta offline (C20) e `ajax-ai-by-pewdiepie`. Classificação automática: quem pegar a tarefa pode reclassificar (subir o nível).

### ESFORCO-GLOBAL.6 — Limpar o `esforco.md` (só a regra; resultados ficam aqui)

**Próximo passo:** — (entregue).

- **Nível:** LEVE — só `.md` e rodar um script já existente.
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **Pedido:** "sim, abra a subtarefa e limpe o esforco.md" (2026-10-17 13:15); criada no caminho (C26).
- **Motivo:** os resultados das conferências são histórico, não mudam o que a IA faz e entram no
- **JEV-AI-SUGGESTION:** NAO
  contexto de toda sessão de todas as IAs (via `dist/REGRAS-GLOBAIS.md`).
- **Descrição:** em `regras/esforco.md`: (1) apagar a linha que começa com "- Conferência por
  modelo: **Sonnet 5.5**" e a linha que começa com "- Teste da padaria (EFFORT-PADARIA"; (2) trocar
  a linha 4 `IAs.** Conferência por modelo: tarefa `CONFEFFORT-GLOBAL` (`rules-ai/tasks/STATUS.md`).`
  por `IAs.** Conferência por modelo: tarefa `CONFEFFORT-GLOBAL`; resultados nas etapas 002 e 003 do `rules-ai` (não ler para escolher o esforço).`;
  (3) nova linha no topo de "O que mudou desde a última gravação" do `STATUS_PROJETO.md`;
  (4) `node scripts/sincronizar.mjs --aplicar` e conferir que `dist/REGRAS-GLOBAIS.md` **não** contém
  "Teste da padaria (EFFORT-PADARIA".
- **Critério de pronto:** `esforco.md` sem as 2 linhas e com a linha 4 nova; nada mais muda.
- **Entrega (2026-10-17 13:16, Haiku · executor-leve; líder Opus 5.5):** `regras/esforco.md`, `STATUS_PROJETO.md`; `sincronizar.mjs --aplicar` sem erro (7 IAs gravadas; Claude Code igual).
- **Verificação (líder):** `git diff --stat` = só `esforco.md` e o status; `dist/REGRAS-GLOBAIS.md` sem "Teste da padaria" e com "não ler para escolher o esforço".

#### Resultados retirados do `esforco.md` (histórico, 2026-10-17)

- Conferência por modelo: **Sonnet 5.5** (CONFEFFORT-GLOBAL.2 e .6): `low` e `medium` sem diferença mensurável; só `high` mostrou efeito pequeno. **Opus 5.5** (CONFEFFORT-GLOBAL.3, 2026-10-17): `effort` aplicado — tokens e tempo crescem de `low` a `xhigh` (+2,3% de tokens, +40% de tempo), todos com a resposta certa. Faltam Haiku, Gemini e DeepSeek.
- Teste da padaria (EFFORT-PADARIA, etapa 003): o `effort` é aplicado nos 3 modelos Claude, forte só no Haiku e no `xhigh` do Opus; nenhum nível mudou a nota (38/38 em todos). Subir o nível aumenta custo e tempo sem ganho de acerto nesse tipo de tarefa.
