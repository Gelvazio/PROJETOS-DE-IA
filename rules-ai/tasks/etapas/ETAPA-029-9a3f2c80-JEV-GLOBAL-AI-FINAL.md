## Etapa 029-9a3f2c80 — JEV-GLOBAL-AI-FINAL: o Jev classifica toda mensagem, em todos os projetos

**Tarefa:** JEV-GLOBAL-AI-FINAL · **Pedido em:** 2026-10-20 00:06 · **Criada por:** Claude Code (Opus 5.5) (local · main · rules-ai)
**Pedido:** "O JEV ESTA INSTALADO E RODANDO PRA CLASSIFICAR MENSAGENS EM TODOS OS PROJETOS?" →
"QUERO QUE CRIE A TAREFA COM O MAXIMO DE SUBTAREFAS POSSIVEIS, MAS QUERO TAMBEM QUE JA USE O *JEV AI*
AGORA PRA CLASSIFICAR QUAL MODELO DE IA VAI FAZER CADA TAREFA OU SUBTAREFA" · "E AGORA SO PUBLIQUE
ESSA TAREFA NO QUADO,OUTRA IA VAI PEGAR DEPOIS,COLOQUE O NOME DE *JEV-GLOBAL-AI-FINAL*"
**Objetivo:** cada mensagem do usuário, em qualquer projeto de `C:\fontes`, passa pelo Jev antes da
resposta da IA: ele sugere nível, modelo e `effort` do pedido e roda os guardrails no texto, sempre
como conselheiro (C39, C42). Hoje o Jev só roda quando alguém chama `scripts/jev.mjs` (conferido em
2026-10-20 00:00: nenhum gancho em nenhum `settings.json`).

### Escopo

- **Entra:** regra `regras/jev.md` (seção de mensagens) e decisão **C43**; subcomando
  `scripts/jev.mjs mensagem`; perguntas, guardrails, limite de custo, tempo máximo, filtro e
  auditoria das mensagens em `scripts/jev/`; ganchos de prompt do Claude Code (todas as contas) e do
  Codex; texto para as IAs sem gancho; rollback do gancho; skill `classificar-tarefa` global e dos
  projetos que a têm (sem o Laya, com o Jev); correção do INV-1 do `testes/invariantes.mjs`; ensaio
  medido; `sincronizar.mjs --aplicar`; `STATUS_PROJETO.md` e o mapa de `C:\fontes`.
- **Não entra:** trocar o modelo `jev-1.13.0`; benchmark novo de nível; servidor próprio; o Jev
  reservar, escrever no quadro, bloquear a mensagem do usuário ou decidir o nível de subtarefas do quadro
  (a decisão do Jev vale só na mensagem, pergunta 6); projetos em
  `DEMAIS-PROJETOS-*` (C20, C23).
- **Número da decisão:** C41 está reservada para a HAIKU-COMMIT-GLOBAL e C42 é a JEV-SEM-LAYA; por
  isso esta é a **C43**, que também muda a C39 na mensagem (o Jev decide com confiança ≥ 0,80).

### Riscos

| Risco | Plano B |
|---|---|
| Custo por mensagem cresce sem controle | limite diário (`JEV_MAX_CUSTO_DIA`) e filtro de mensagens triviais; estourou → só sinais |
| Gancho deixa a IA lenta | tempo máximo por mensagem; passou → segue sem o Jev, sem erro na tela |
| Segredo do usuário vai para a API | `redigir.mjs` antes de todo envio; auditoria só com `hash` |
| Gancho quebra o `settings.json` de uma conta | `sincronizar.mjs` só acrescenta o gancho, guarda cópia `.bak` e confere o JSON antes de gravar |
| Jev erra o nível (benchmark cego: ~60% de acerto no nível final) | decide só com confiança ≥ 0,80 e sem sinal de PESADO; senão vale a matriz e a revisão humana; o ensaio da .21 mede o acerto antes do rollout |

### Requisitos

| ID | Requisito (EARS) | Cobre | Verificação |
|----|------------------|-------|-------------|
| R1.1 | QUANDO o usuário envia uma mensagem no Claude Code ou no Codex, O SISTEMA DEVE acrescentar ao contexto da IA a sugestão de nível, modelo e `effort` do Jev antes da resposta | JEV-GLOBAL-AI-FINAL.2, .3, .10, .11, .12 | ensaio da .21 (contexto aparece na resposta); leitura do gancho |
| R1.2 | SE o Jev falhar, estiver sem chave, com `JEV_MODO=off`, `JEV_MENSAGENS=off` ou com o limite do dia estourado, ENTÃO O SISTEMA DEVE seguir só pelos sinais da skill sem impedir a mensagem | .5, .6, .14 | rodar o gancho sem chave e com `off`: código 0, mensagem passa |
| R1.3 | O SISTEMA DEVE gastar no máximo 4 s por mensagem no gancho | .6 | ensaio da .21: maior latência ≤ 4 s |
| R1.4 | O SISTEMA DEVE pular o Jev em mensagens de até 3 caracteres e nas que começam com `/` | .7 | rodar o gancho com `.`, `;`, `?` e `/model`: nenhuma chamada no registro |
| R2.1 | O SISTEMA DEVE mascarar segredo e dado pessoal antes de enviar a mensagem ao Jev | .2, .9 | rodar com texto contendo `tsk_…` e CPF de teste: `state` enviado mascarado (`--dry-run`) |
| R2.2 | O SISTEMA DEVE gravar na auditoria só `hash`, nível, custo e ação, nunca o texto da mensagem | .8 | `grep` do texto de teste em `scripts/jev/saidas/` sem resultado |
| R2.3 | QUANDO o custo do dia passar de `JEV_MAX_CUSTO_DIA`, O SISTEMA DEVE parar de chamar o Jev até o dia seguinte | .5 | rodar com limite 0: nenhuma chamada, aviso no contexto |
| R3.1 | QUANDO um guardrail achar segredo, pasta proibida, comando destrutivo ou aprovação indevida na mensagem, O SISTEMA DEVE avisar no contexto da IA | .4 | rodar o gancho com um exemplo de cada: aviso presente |
| R4.1 | QUANDO a regra mudar, O SISTEMA DEVE gravar o arquivo global de cada IA | .22 | saída do `sincronizar.mjs --aplicar` |
| R4.2 | O SISTEMA DEVE ter a skill `classificar-tarefa` sem citar o Laya, na fonte global e nos projetos que a têm | .15, .16, .17, .18, .19 | `grep -ci laya` = 0 em cada `SKILL.md` |
| R6.1 | QUANDO a confiança do Jev para a mensagem for ≥ 0,80 e não houver sinal de PESADO, O SISTEMA DEVE usar o nível e o modelo sugeridos pelo Jev como decisão para aquela mensagem | JEV-GLOBAL-AI-FINAL.24 | rodar o comando `mensagem` com um caso de confiança alta: saída marca `decisao: jev` |
| R6.2 | SE a confiança do Jev for menor que 0,80 ou houver sinal de PESADO, ENTÃO O SISTEMA DEVE usar a matriz de níveis (nível mais alto entre Jev e sinais) e marcar revisão humana | JEV-GLOBAL-AI-FINAL.24 | rodar com caso de confiança baixa e com sinal de PESADO: saída marca `decisao: matriz` e `revisar` |
| R5.1 | O SISTEMA DEVE passar no `node scripts/jev/testes/invariantes.mjs` | .20 | código de saída 0 |

**Fora do escopo:** benchmark novo; servidor próprio; projetos `DEMAIS-PROJETOS-*`.

### Invariantes

| ID | Regra que vale sempre | Domínio da entrada | Como conferir | Teste automatizado |
|----|----------------------|--------------------|---------------|--------------------|
| INV-1 | O `state` enviado ao Jev nunca traz nível, modelo ou `effort` já decididos | toda mensagem e toda subtarefa | `node scripts/jev/testes/invariantes.mjs` | sim: o teste que já existe (corrigido na .20) |
| INV-2 | O gancho nunca bloqueia nem altera a mensagem do usuário: só acrescenta contexto | toda mensagem, em toda IA com gancho | leitura do gancho; ensaio da .21 | não: leitura e ensaio |
| INV-3 | Falha do Jev nunca vira `liberar` | todo caminho de erro do gancho e dos guardrails | `grep -rn liberar scripts/jev --include=*.mjs` + leitura | não: leitura |
| INV-4 | A chave `TYPESAFE_API_KEY` nunca aparece em log, saída ou arquivo versionado | `scripts/jev/saidas/`, saída do gancho, Git | `grep -rn "tsk_" scripts/jev/saidas` e `git grep -n tsk_` sem resultado | não: grep |
| INV-5 | O Jev não escreve no quadro e não reserva; só decide o modelo da **mensagem** com confiança ≥ 0,80 e sem sinal de PESADO; um sinal de PESADO nunca é rebaixado | toda execução | leitura de `comando-mensagem.mjs`; `git diff tasks/` vazio depois do ensaio | não: leitura |

**Casos de borda:** mensagem vazia; mensagem só com anexo; mensagem com mais de 4000 caracteres
(corta antes de enviar); sem internet; projeto sem `tasks/`; duas mensagens seguidas em menos de 1 s.

### Perguntas abertas

| # | Pergunta | Resposta | Fechada em | Quem respondeu |
|---|----------|----------|------------|----------------|
| 1 | Em quais IAs o gancho roda? | Claude Code (todas as contas) e Codex; as outras só pela instrução da regra | 2026-10-20 00:18 | Gelvazio (chat) |
| 2 | Qual o limite de custo? | US$ 1,00 por dia e 2.000 tokens por mensagem | 2026-10-20 00:18 | Gelvazio (chat) |
| 3 | O guardrail na mensagem bloqueia ou só avisa? | Só avisa (o gancho nunca bloqueia, INV-2) | 2026-10-20 00:18 | Gelvazio (chat) |
| 4 | Quais mensagens pulam o Jev? | Até 3 caracteres (`.`, `;`, `?`) e comandos `/` | 2026-10-20 00:18 | Gelvazio (chat) |
| 5 | Qual o tempo máximo por mensagem? | 4 s | 2026-10-20 00:18 | Gelvazio (chat) |
| 6 | A sugestão de modelo da mensagem decide quem faz? | **Sim, o Jev decide** quando a confiança for ≥ 0,80 e não houver sinal de PESADO; abaixo de 0,80, ou com sinal de PESADO, vale a matriz de níveis (nível mais alto entre Jev e sinais) e a revisão humana. Vale só para a **mensagem**: a classificação de subtarefas do quadro continua conselho (C39). Muda a C39 → decisão **C43** | 2026-10-20 00:18 | Gelvazio (chat) ("O Jev decide" · "Decide só com confiança ≥ 0,80") |

Todas fechadas em 2026-10-20 00:18 pelas respostas do usuário no chat.

### Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-20 00:06 | Tarefa criada e publicada sem executar; outra IA pega depois; aguarda o "sim" ao plano | Claude Code (Opus 5.5) | pedido do usuário ("SO PUBLIQUE ESSA TAREFA NO QUADO") e tarefa grande |
| 2026-10-20 00:10 | Nível das 23 subtarefas sugerido pelo Jev (`jev.mjs classificar --id`, `jev-1.13.0`, custo total US$ 0,001); vale o nível final do Jev + sinais, e o líder só eleva: .12 e .22 de LEVE para PESADO (configuração global e mudança em massa). Ações `humano`/`revisar` conferidas pelo líder (.4, .11, .16, .19, .21 mantidas) | Claude Code (Opus 5.5) | pedido do usuário ("JA USE O *JEV AI* AGORA PRA CLASSIFICAR"); C39 (o Jev sugere, não rebaixa) |
| 2026-10-20 00:18 | Plano aprovado ("Sim, aprovo") e as 6 perguntas respondidas no chat; a resposta da 6 (o Jev decide com confiança ≥ 0,80) muda o escopo: entram R6.1, R6.2, a subtarefa .24 e a C43 mudando a C39 na mensagem; INV-5 ajustado. Aguarda o novo "sim" a essa mudança | Gelvazio · Claude Code (Opus 5.5) | regra de mudança material de escopo (ciclo-da-task) |
| 2026-10-20 00:19 | Mudança da pergunta 6 e subtarefa .24 aprovadas ("S8m,aprovo"); plano final aprovado, subtarefas livres para o modelo de cada uma | Gelvazio | resposta no chat |
| 2026-10-20 00:27 | Execução na nuvem (`claude/untitled-session-tevg7e`) pela equipe: líder Opus 5.5 com as PESADAS (.4, .9, .11, .12, .19), Sonnet 5.5 nas MEDIO e Haiku 5.5 nas LEVE (C22). O que só existe no computador (contas do Claude Code, `~/.codex`, skill global, `--aplicar`, chave real) fica 👀 para o usuário | Claude Code (Opus 5.5) | pedido do usuário ("Faça JEV-GLOBAL-AI-FINAL, chame outros agentes se precisar, cobre eles como um líder, e prossiga sem parar") |
| 2026-10-20 00:45 | Guardrails da mensagem só na camada determinística (sem consultar o Jev): o orçamento de 4 s e US$ 1/dia é da classificação; menção ambígua de pasta vira aviso de conferência | Claude Code (Opus 5.5) | R1.3, R2.3 e INV-2 |
| 2026-10-20 00:50 | Skills dos outros projetos commitadas em ramos `claude/untitled-session-tevg7e` (não direto na `main` de outro repositório); na .19 também o agente `classificador-tarefas` e a `liderar-equipe` do `dashboard-ai` saem do Laya (o código `worker/` do produto fica como está) | Claude Code (Opus 5.5) | ramo designado da sessão; a skill nova contradiria o agente |
| 2026-10-20 08:00 | .11 e .12 substituídas pela C44 (RULES-LOCAL-JEV, etapa 030): o gancho vive no `.claude/settings.json` e no `.codex/hooks.json` de cada projeto; o `sincronizar.mjs --aplicar` agora tira o gancho global | Gelvazio · Claude Code (Opus 5.5) | resposta 1 do usuário ("só do projeto") |

### JEV-GLOBAL-AI-FINAL.1 — Regra `jev.md`: seção "Classificar mensagens" e decisão C43

**Próximo passo:** escrever em `regras/jev.md` a seção de mensagens (quando roda, o que faz, custo,
tempo máximo, privacidade, fallback, rollback), a C43 no `CONFLITOS.md` e a linha no `regras/INDEX.md`.

- **Nível:** LEVE — Jev `LEVE`, final proposto `LEVE`, confiança 0.89, ação `revisar`
- **Modelo:** só Haiku — nunca outro (C22)
- **Effort:** low
- **Arquivos:** `regras/jev.md`, `CONFLITOS.md`, `regras/INDEX.md`
- **Critérios de aceitação:** R1.1 a R3.1, R6.1 e R6.2 descritos na regra; C43 muda a C39 só na
- **JEV-AI-SUGGESTION:** NAO
  mensagem; INV-2 e INV-5 no texto.
- **Entrega:** Claude Code (Haiku 5.5 · executor-leve; líder Opus 5.5) — seção `## Classificar mensagens (C43)` e passo 4 do rollback em `regras/jev.md`, C43 no `CONFLITOS.md`, linha do `regras/INDEX.md`; líder devolveu 4 correções (instrução das IAs sem gancho, tabela, fontes, linha longa) e acrescentou `sinais` · **Verificação (líder):** diff lido; R1.1–R3.1, R6.1, R6.2, INV-2 e INV-5 no texto

### JEV-GLOBAL-AI-FINAL.2 — Subcomando `node scripts/jev.mjs mensagem`

**Próximo passo:** criar `scripts/jev/cli/comando-mensagem.mjs` (lê o texto pela entrada padrão ou
`--texto`, mascara com `redigir.mjs`, pergunta ao Jev e devolve resumo de até 3 linhas) e ligar no
`scripts/jev.mjs`.

- **Nível:** MEDIO — Jev `MEDIO`, final proposto `MEDIO`, confiança 0.91, ação `sugestao_automatica`
- **Modelo:** só Sonnet — nunca outro (C22)
- **Effort:** medium
- **Arquivos:** `scripts/jev.mjs`, `scripts/jev/cli/comando-mensagem.mjs` (novo)
- **Critérios de aceitação:** R2.1; `--dry-run` mostra o `state` mascarado; `node --check`.
- **Entrega:** Claude Code (Sonnet 5.5 · executor-medio; líder Opus 5.5) — `scripts/jev/cli/comando-mensagem.mjs`, `scripts/jev/mensagem/` (classificar, estado, perguntas, decisao, limite, auditoria, contexto) e o subcomando no `scripts/jev.mjs` · **Verificação (líder):** `--dry-run` com `tsk_…` e CPF mostra `[CHAVE]` e `[CPF]` (R2.1); `node --check` ok
- **JEV-AI-SUGGESTION:** NAO

### JEV-GLOBAL-AI-FINAL.3 — Perguntas do Jev para mensagem e estado cego da mensagem

**Próximo passo:** criar `scripts/jev/perguntas-mensagem.mjs` (é pedido que muda algo? nível? toca
banco, segurança ou várias partes?) e o montador de `state` da mensagem, sem nomes de modelo.

- **Nível:** MEDIO — Jev `MEDIO`, final proposto `MEDIO`, confiança 0.89, ação `sugestao_automatica`
- **Modelo:** só Sonnet — nunca outro (C22)
- **Effort:** medium
- **Arquivos:** `scripts/jev/perguntas-mensagem.mjs` (novo), `scripts/jev/estado.mjs`
- **Critérios de aceitação:** R1.1; INV-1 vale também para a mensagem.
- **Entrega:** Claude Code (Sonnet 5.5 · executor-medio; líder Opus 5.5) — `scripts/jev/mensagem/perguntas.mjs` (`muda_algo`, nível, 4 sinais) e `mensagem/estado.mjs` (state `{projeto, mensagem}` cego, cortado em 4000 caracteres e no teto de tokens) · **Verificação (líder):** `testes/mensagem.mjs` ok; INV-1 vale também na mensagem (`removerRotulos`)
- **JEV-AI-SUGGESTION:** NAO

### JEV-GLOBAL-AI-FINAL.4 — Guardrails aplicados ao texto da mensagem

**Próximo passo:** chamar os guardrails `segredo`, `pasta`, `comando` e `aprovacao` sobre o texto da
mensagem dentro do `comando-mensagem.mjs`, só como aviso (nunca bloqueio).

- **Nível:** PESADO — Jev `PESADO`, final proposto `PESADO`, confiança 0.35, ação `humano`, sinais de PESADO: segredo, mais_de_3_arquivos
- **Modelo:** só Opus 5.5+/Fable ou DeepSeek — nunca outro (C22)
- **Effort:** high
- **Arquivos:** `scripts/jev/cli/comando-mensagem.mjs`, `scripts/jev/guardrails/`
- **Critérios de aceitação:** R3.1; INV-2 e INV-3.
- **Entrega:** Claude Code (Opus 5.5 · líder) — `scripts/jev/guardrails/mensagem.mjs`: segredo, pasta, comando e aprovação só na camada determinística, só avisos, erro vira aviso de revisão (INV-3) · **Verificação (líder):** um exemplo de cada guardrail gera aviso sem o valor achado, texto limpo sem aviso, cada um < 20 ms; caso R3.1 no `testes/mensagem.mjs`
- **JEV-AI-SUGGESTION:** NAO

### JEV-GLOBAL-AI-FINAL.5 — Limite de custo por mensagem e por dia

**Próximo passo:** criar `JEV_MAX_TOKENS_MENSAGEM` e `JEV_MAX_CUSTO_DIA` em `scripts/jev/config.mjs`
e o contador diário local em `scripts/jev/saidas/` (fora do Git).

- **Nível:** MEDIO — Jev `MEDIO`, final proposto `MEDIO`, confiança 0.89, ação `sugestao_automatica`
- **Modelo:** só Sonnet — nunca outro (C22)
- **Effort:** medium
- **Arquivos:** `scripts/jev/config.mjs`, `scripts/jev/metricas.mjs` ou módulo novo de custo
- **Critérios de aceitação:** R1.2 e R2.3.
- **Entrega:** Claude Code (Sonnet 5.5 · executor-medio; líder Opus 5.5) — `JEV_MAX_CUSTO_DIA` (US$ 1,00) e `JEV_MAX_TOKENS_MENSAGEM` (2000) em `config.mjs` (`carregarConfiguracaoMensagem`); soma do dia pela auditoria · **Verificação (líder):** limite 0 e limite acumulado → nenhuma chamada, contexto "limite do dia" (R2.3)
- **JEV-AI-SUGGESTION:** NAO

### JEV-GLOBAL-AI-FINAL.6 — Tempo máximo e fallback do gancho

**Próximo passo:** criar `JEV_TEMPO_MAXIMO_MENSAGEM_MS` (proposta 4000) e fazer o comando
`mensagem` sair com código 0 e contexto "só sinais" em qualquer falha, sem erro na tela.

- **Nível:** MEDIO — Jev `MEDIO`, final proposto `MEDIO`, confiança 0.97, ação `sugestao_automatica`
- **Modelo:** só Sonnet — nunca outro (C22)
- **Effort:** medium
- **Arquivos:** `scripts/jev/config.mjs`, `scripts/jev/cli/comando-mensagem.mjs`
- **Critérios de aceitação:** R1.2 e R1.3; INV-2 e INV-3.
- **Entrega:** Claude Code (Sonnet 5.5 · executor-medio; líder Opus 5.5) — `JEV_TEMPO_MAXIMO_MENSAGEM_MS` (4000), cliente sem repetições e `comTempoMaximo`; toda falha vira `decisao: sinais` · **Verificação (líder):** servidor lento volta no tempo máximo; 500/401/429/JSON ruim/rede → só sinais, código 0 (R1.2, R1.3)
- **JEV-AI-SUGGESTION:** NAO

### JEV-GLOBAL-AI-FINAL.7 — Filtro de mensagens triviais

**Próximo passo:** pular a chamada ao Jev em mensagens de até 3 caracteres e nas que começam com `/`.

- **Nível:** MEDIO — Jev `MEDIO`, final proposto `MEDIO`, confiança 0.98, ação `revisar`
- **Modelo:** só Sonnet — nunca outro (C22)
- **Effort:** medium
- **Arquivos:** `scripts/jev/cli/comando-mensagem.mjs`
- **Critérios de aceitação:** R1.4.
- **Entrega:** Claude Code (Sonnet 5.5 · executor-medio; líder Opus 5.5) — filtro `ehMensagemTrivial` (até 3 caracteres, `/`) · **Verificação (líder):** `.`, `;`, `?`, `/model` → pulado, 0 requisições (R1.4); ensaio do líder: 76–81 ms sem chamada
- **JEV-AI-SUGGESTION:** NAO

### JEV-GLOBAL-AI-FINAL.8 — Auditoria das mensagens sem o texto

**Próximo passo:** gravar em `scripts/jev/saidas/mensagens-AAAA-MM.jsonl` só data, projeto, `hash`,
nível sugerido, confiança, custo e ação.

- **Nível:** MEDIO — Jev `MEDIO`, final proposto `MEDIO`, confiança 0.92, ação `sugestao_automatica`
- **Modelo:** só Sonnet — nunca outro (C22)
- **Effort:** medium
- **Arquivos:** `scripts/jev/cli/comando-mensagem.mjs`, `scripts/jev/saidas/` (fora do Git)
- **Critérios de aceitação:** R2.2; INV-4.
- **Entrega:** Claude Code (Sonnet 5.5 · executor-medio; líder Opus 5.5) — `mensagem/auditoria.mjs`: `scripts/jev/saidas/mensagens-AAAA-MM.jsonl` só com data, projeto, hash, decisão, nível, confiança, custo, latência e ação · **Verificação (líder):** texto e chave de teste ausentes da auditoria (R2.2, INV-4); `git check-ignore` confirma `saidas/` fora do Git
- **JEV-AI-SUGGESTION:** NAO

### JEV-GLOBAL-AI-FINAL.9 — Chave única do gancho

**Próximo passo:** garantir que o gancho, rodando em qualquer projeto, lê `TYPESAFE_API_KEY` só do
ambiente ou de `C:\fontes\rules-ai\.env`, nunca copia a chave para outro projeto e nunca a imprime.

- **Nível:** PESADO — Jev `PESADO`, final proposto `PESADO`, confiança 0.98, ação `revisar`, sinais de PESADO: segredo
- **Modelo:** só Opus 5.5+/Fable ou DeepSeek — nunca outro (C22)
- **Effort:** high
- **Arquivos:** `scripts/jev/cliente.mjs`, `scripts/jev/config.mjs`
- **Critérios de aceitação:** R2.1; INV-4.
- **Entrega:** Claude Code (Opus 5.5 · líder) — conferência: o gancho lê a chave só por `config.mjs` (ambiente ou `.env` da raiz do rules-ai, achado pelo caminho do script, de qualquer pasta); a chave não vai para `settings.json`/`hooks.json` · **Verificação (líder):** gancho rodado de `/tmp` sem chave → contexto "Jev indisponível", código 0; `git grep tsk_` só acha chaves falsas de teste; `scripts/jev/saidas` sem `tsk_` (INV-4)
- **JEV-AI-SUGGESTION:** NAO

### JEV-GLOBAL-AI-FINAL.10 — Gancho do Claude Code (`UserPromptSubmit`)

**Próximo passo:** criar `scripts/jev/ganchos/claude-prompt.mjs`, que lê o JSON do gancho, chama o
comando `mensagem` e devolve `additionalContext` com nível, modelo, `effort` e alertas.

- **Nível:** MEDIO — Jev `MEDIO`, final proposto `MEDIO`, confiança 0.95, ação `sugestao_automatica`
- **Modelo:** só Sonnet — nunca outro (C22)
- **Effort:** medium
- **Arquivos:** `scripts/jev/ganchos/claude-prompt.mjs` (novo)
- **Critérios de aceitação:** R1.1; INV-2 (nunca `decision: block`).
- **Entrega:** Claude Code (Sonnet 5.5 · executor-medio; líder Opus 5.5) — `scripts/jev/ganchos/claude-prompt.mjs` (`hookSpecificOutput.additionalContext`, nunca `decision`) · **Verificação (líder):** ensaio do líder com servidor falso: `decisao jev` (MEDIO) e `matriz` (PESADO por sinal de banco, com alerta de `git reset --hard`), ~150 ms; JSON inválido → código 0 sem saída (INV-2)
- **JEV-AI-SUGGESTION:** NAO

### JEV-GLOBAL-AI-FINAL.11 — Instalar o gancho no Claude Code (todas as contas)

**Próximo passo:** (usuário, no computador) rodar `node scripts/sincronizar.mjs` (prévia) e depois `--aplicar`;
conferir `UserPromptSubmit` do Jev em `~/.claude/settings.json` e nas contas A, B e C.

- **Nível:** PESADO — Jev `MEDIO`, final proposto `PESADO`, confiança 0.48, ação `humano`, sinais de PESADO: massa
- **Modelo:** só Opus 5.5+/Fable ou DeepSeek — nunca outro (C22)
- **Effort:** high
- **Arquivos:** `scripts/sincronizar.mjs`, `settings.json` das 4 contas
- **Critérios de aceitação:** R1.1; JSON válido antes e depois; ganchos antigos preservados.
- **Entrega:** Claude Code (Opus 5.5 · líder) — `scripts/jev/ganchos/instalar.mjs` chamado pelo `scripts/sincronizar.mjs`: acrescenta o `UserPromptSubmit` do Jev em `~/.claude/settings.json` e nas contas A, B e C (timeout 10 s), preserva ganchos, grava `.bak`, confere o JSON e pula arquivo inválido · **Verificação (líder):** teste com pasta de usuário falsa: ganchos antigos preservados, `.bak` criado, JSON inválido pulado sem gravar, 2ª rodada `igual`; prévia na nuvem: `mudaria Claude Code (gancho)`. Instalação de verdade = `--aplicar` no computador do usuário (.22)
- **JEV-AI-SUGGESTION:** NAO

### JEV-GLOBAL-AI-FINAL.12 — Gancho do Codex (global)

**Próximo passo:** (usuário, no computador) ligar `codex_hooks = true` em `[features]` do `~/.codex/config.toml`,
rodar o `--aplicar` e conferir a sugestão do Jev numa mensagem do Codex.

- **Nível:** PESADO — Jev `LEVE`, final proposto `LEVE`, confiança 0.48, ação `humano`; elevado pelo líder: grava o gancho global do Codex pelo `sincronizar.mjs` (configuração global, como a .11)
- **Modelo:** só Opus 5.5+/Fable ou DeepSeek — nunca outro (C22)
- **Effort:** high
- **Arquivos:** `scripts/sincronizar.mjs`, `~/.codex/hooks.json`
- **Critérios de aceitação:** R1.1; JSON válido; ganchos antigos preservados.
- **Entrega:** Claude Code (Opus 5.5 · líder) — `scripts/jev/ganchos/codex-prompt.mjs` (reaproveita o gancho do Claude Code) e a entrada em `~/.codex/hooks.json` pelo mesmo instalador; aviso quando falta `codex_hooks = true` no `config.toml` (não editado) · **Verificação (líder):** sem chave: contexto "Jev indisponível", código 0; JSON do `hooks.json` validado no teste. Formato do Codex lido só no resumo da busca (PR #14626): conferir na versão instalada
- **JEV-AI-SUGGESTION:** NAO

### JEV-GLOBAL-AI-FINAL.13 — Tabela de IAs com e sem gancho de prompt

**Próximo passo:** conferir quais IAs (Gemini, Grok, Qoder, opencode, Devin, Kiro, Hermes, Kilo)
têm gancho de prompt e escrever em `regras/jev.md` a tabela e a instrução para as que não têm.

- **Nível:** LEVE — Jev `LEVE`, final proposto `LEVE`, confiança 0.94, ação `revisar`
- **Modelo:** só Haiku — nunca outro (C22)
- **Effort:** low
- **Arquivos:** `regras/jev.md`
- **Critérios de aceitação:** tabela com uma linha por IA e a fonte de cada informação.
- **Entrega:** Claude Code (Haiku 5.5 · executor-leve; líder Opus 5.5) — tabela `### Quais IAs têm gancho de prompt` e `### IAs sem gancho de prompt` em `regras/jev.md` · **Verificação (líder):** Claude Code e Codex com gancho; as outras 8 "não conferido" (as páginas não abriram na nuvem) → instrução da regra
- **JEV-AI-SUGGESTION:** NAO

### JEV-GLOBAL-AI-FINAL.14 — Rollback do gancho (`JEV_MENSAGENS=off`)

**Próximo passo:** criar a variável `JEV_MENSAGENS` (`ativo`/`off`), que desliga só o gancho (a
classificação de subtarefas continua), e escrever o passo a passo de rollback na regra.

- **Nível:** MEDIO — Jev `MEDIO`, final proposto `MEDIO`, confiança 0.95, ação `sugestao_automatica`
- **Modelo:** só Sonnet — nunca outro (C22)
- **Effort:** medium
- **Arquivos:** `scripts/jev/config.mjs`, `scripts/jev/cli/comando-mensagem.mjs`, `regras/jev.md`
- **Critérios de aceitação:** R1.2; com `off` o gancho sai em menos de 100 ms, sem chamada.
- **Entrega:** Claude Code (Sonnet 5.5 · executor-medio; líder Opus 5.5) — `JEV_MENSAGENS` (`ativo`/`off`); texto do rollback pelo Haiku na .1 · **Verificação (líder):** `JEV_MENSAGENS=off` e `JEV_MODO=off` → pulado, sem chamada nem auditoria (R1.2)
- **JEV-AI-SUGGESTION:** NAO

### JEV-GLOBAL-AI-FINAL.15 — Skill global `classificar-tarefa` sem o Laya

**Próximo passo:** (usuário, no computador) copiar a seção `### Pergunta ao Jev` de
`template-inicial-tasks-ia/.agents/skills/classificar-tarefa/SKILL.md` para
`C:\Users\gelva\.claude\skills\classificar-tarefa\SKILL.md`, tirar o Laya e conferir `grep -ci laya` = 0.

- **Nível:** LEVE — Jev `LEVE`, final proposto `LEVE`, confiança 0.92, ação `sugestao_automatica`
- **Modelo:** só Haiku — nunca outro (C22)
- **Effort:** low
- **Arquivos:** `C:\Users\gelva\.claude\skills\classificar-tarefa\SKILL.md`
- **Critérios de aceitação:** R4.2.
- **Entrega:** — · **Verificação:** —
- **JEV-AI-SUGGESTION:** NAO

### JEV-GLOBAL-AI-FINAL.16 — Skill do `template-inicial-tasks-ia` chamando o Jev

**Próximo passo:** na skill `classificar-tarefa` do template, tentar o Jev primeiro (como a global)
e tirar o Laya; commit no repositório do template.

- **Nível:** MEDIO — Jev `MEDIO`, final proposto `MEDIO`, confiança 0.25, ação `humano`
- **Modelo:** só Sonnet — nunca outro (C22)
- **Effort:** medium
- **Arquivos:** `C:\fontes\template-inicial-tasks-ia\.claude\skills\classificar-tarefa\SKILL.md` (e a fonte `.agents`)
- **Critérios de aceitação:** R4.2.
- **Entrega:** Claude Code (Sonnet 5.5 · executor-medio; líder Opus 5.5) — `template-inicial-tasks-ia`: `.agents/skills/classificar-tarefa/SKILL.md` com a seção `### Pergunta ao Jev` (texto padrão do líder) e as cópias regeradas; commit `1957f76` no ramo `claude/untitled-session-tevg7e` (falta levar à `main`) · **Verificação (líder):** `sincronizar-agentes.mjs --checar` código 0; `grep -ci laya` = 0 e `jev` = 12 nas cópias (R4.2)
- **JEV-AI-SUGGESTION:** NAO

### JEV-GLOBAL-AI-FINAL.17 — Skill do `REA-APP-CLONES` chamando o Jev

**Próximo passo:** mesmo ajuste da .16 no `REA-APP-CLONES` (rodar `npm run sync:agentes` se a fonte
for `.agents`).

- **Nível:** LEVE — Jev `LEVE`, final proposto `LEVE`, confiança 0.72, ação `revisar`
- **Modelo:** só Haiku — nunca outro (C22)
- **Effort:** low
- **Arquivos:** `C:\fontes\REA-APP-CLONES\.claude\skills\classificar-tarefa\SKILL.md` (e a fonte `.agents`)
- **Critérios de aceitação:** R4.2.
- **Entrega:** Claude Code (Haiku 5.5 · executor-leve; líder Opus 5.5) — `rea-app-clones`: mesma seção e cópias regeradas; commit `d738997` no ramo `claude/untitled-session-tevg7e` (falta levar à `main`) · **Verificação (líder):** `--checar` código 0; laya 0, jev 12; seção idêntica ao texto padrão (R4.2)
- **JEV-AI-SUGGESTION:** NAO

### JEV-GLOBAL-AI-FINAL.18 — Skill do `testes-de-frontend` chamando o Jev

**Próximo passo:** mesmo ajuste da .16 no `testes-de-frontend`.

- **Nível:** LEVE — Jev `LEVE`, final proposto `LEVE`, confiança 0.69, ação `revisar`
- **Modelo:** só Haiku — nunca outro (C22)
- **Effort:** low
- **Arquivos:** `C:\fontes\testes-de-frontend\.claude\skills\classificar-tarefa\SKILL.md` (e a fonte `.agents`)
- **Critérios de aceitação:** R4.2.
- **Entrega:** Claude Code (Haiku 5.5 · executor-leve; líder Opus 5.5) — `testes-de-frontend`: mesma seção e cópias regeradas; commit `9ad417d` no ramo `claude/untitled-session-tevg7e` (falta levar à `main`) · **Verificação (líder):** `--checar` código 0; laya 0, jev 12; seção idêntica ao texto padrão (R4.2)
- **JEV-AI-SUGGESTION:** NAO

### JEV-GLOBAL-AI-FINAL.19 — Skill do `dashboard-ai-claude-code-senai` chamando o Jev

**Próximo passo:** mesmo ajuste da .16 no `dashboard-ai-claude-code-senai` (as 9 cópias do
dashboard dividem o repositório: commitar uma vez e puxar nas outras).

- **Nível:** PESADO — Jev `LEVE`, final proposto `PESADO`, confiança 0.06, ação `humano`, sinais de PESADO: massa
- **Modelo:** só Opus 5.5+/Fable ou DeepSeek — nunca outro (C22)
- **Effort:** high
- **Arquivos:** `C:\fontes\dashboard-ai-claude-code-senai\.claude\skills\classificar-tarefa\SKILL.md` (e a fonte `.agents`)
- **Critérios de aceitação:** R4.2.
- **Entrega:** Claude Code (Opus 5.5 · líder) — `dashboard-ai` (repositório das cópias `dashboard-ai-*`): a seção do Laya Server virou `### Pergunta ao Jev`, limiar 0,7 → 0,60, exemplos `(Jev 0,91)`; também o agente `classificador-tarefas` e a `liderar-equipe` sem o Laya (o código `worker/` do produto não foi tocado); commit `c70369b` no ramo `claude/untitled-session-tevg7e` (falta levar à `main` e puxar nas cópias) · **Verificação (líder):** `--checar` código 0; `grep -ci laya` = 0 na skill, nas cópias e no agente (R4.2)
- **JEV-AI-SUGGESTION:** NAO

### JEV-GLOBAL-AI-FINAL.20 — Corrigir o INV-1 do `testes/invariantes.mjs`

**Próximo passo:** descobrir por que o teste acha `modelo Claude` no `state` dos quadros reais
(`conferirQuadrosReais`) e corrigir o coletor `estado.mjs` (é correção de bug: teste já existe).

- **Nível:** MEDIO — Jev `MEDIO`, final proposto `MEDIO`, confiança 0.98, ação `sugestao_automatica`
- **Modelo:** só Sonnet — nunca outro (C22)
- **Effort:** medium
- **Arquivos:** `scripts/jev/estado.mjs`, `scripts/jev/testes/invariantes.mjs`
- **Critérios de aceitação:** R5.1; INV-1.
- **Entrega:** Claude Code (Sonnet 5.5 · executor-medio; líder Opus 5.5) — `estado.mjs`: `subtarefa: sanitizarTexto(item.id)` (o ID `HAIKU-COMMIT-GLOBAL.1` vazava "Haiku") · **Verificação (líder):** `node scripts/jev/testes/invariantes.mjs` código 0 (179 subtarefas reais) (R5.1)
- **JEV-AI-SUGGESTION:** NAO

### JEV-GLOBAL-AI-FINAL.21 — Ensaio medido em 2 projetos

**Próximo passo:** enviar 20 mensagens reais (10 no `rules-ai`, 10 no `aulasenai`) com o gancho
ligado e anotar na etapa latência, custo, nível sugerido e alertas de cada uma.

- **Nível:** MEDIO — Jev `MEDIO`, final proposto `MEDIO`, confiança 0.31, ação `humano`
- **Modelo:** só Sonnet — nunca outro (C22)
- **Effort:** medium
- **Arquivos:** esta etapa; `scripts/jev/saidas/` (fora do Git)
- **Critérios de aceitação:** R1.1, R1.3, R1.4 e R2.2 conferidos com números; INV-2 e INV-5.
- **Entrega:** Claude Code (Sonnet 5.5 · executor-medio; líder Opus 5.5) — 1º ensaio com servidor falso (o líder devolveu a falha de 4074 ms; corrigida com `MARGEM_SAIDA_MS`); 2º ensaio com o **Jev REAL** (`jev-1.13.0`, 2026-10-20 10:02 UTC): 20 mensagens pelo gancho (10 `rules-ai`, 10 `aulasenai`), processo mediana 590 ms e máximo 849 ms, Jev mediana 521 ms; nível certo em 16 de 17 (94%; o erro foi um pedido ambíguo, LEVE com confiança 0,64, que foi para revisão); decisões jev 7, matriz 10, sinais 3; custo real US$ 0,00057 (≈ US$ 0,000034 por mensagem). Na nuvem o Node precisa de `NODE_USE_ENV_PROXY=1`, `NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt` e `NODE_NO_WARNINGS=1` (no Windows local, nada disso) · **Verificação (líder):** R1.1 17/17 com contexto; R1.3 máx. 849 ms; R1.4 0 chamadas nos triviais; R2.2 0 trechos na auditoria; INV-2 20/20 código 0 sem `block`; INV-4 o líder conferiu: a chave real em 0 arquivos (ensaio, repositório e Git); INV-5 6 sinais de PESADO → PESADO e `tasks/` intacto
- **JEV-AI-SUGGESTION:** NAO

### JEV-GLOBAL-AI-FINAL.22 — Levar às IAs (`sincronizar.mjs --aplicar`)

**Próximo passo:** ✅ conferido em 2026-10-23; `--aplicar` já feito (duas vezes, com autorização do
usuário); resta a .23.

- **Nível:** PESADO — Jev `LEVE`, final proposto `LEVE`, confiança 0.40, ação `humano`; elevado pelo líder: grava o arquivo global de todas as IAs (mudança em massa, como a JEV-SEM-LAYA.2)
- **Modelo:** só Sonnet ou DeepSeek — nunca outro (C22) (trocado do Opus em 2026-10-23, RECLASSIFICAR-PESADO-OPUS.2)
- **Effort:** high
- **Arquivos:** `dist/REGRAS-GLOBAIS.md`, `VERSAO.md`, arquivos globais das IAs
- **Critérios de aceitação:** R4.1.
- **Entrega:** `node scripts/sincronizar.mjs --aplicar` rodado em 2026-10-23 (duas vezes, com autorização
  do usuário): gravou o bloco gerenciado em Gemini CLI, Codex, Grok, Qoder, opencode, Devin, Kiro,
  Hermes e Kilo; as 4 contas do Claude Code já estavam iguais. Versão `2026-10-23-df176636`
  (`dist/REGRAS-GLOBAIS.md`, 1444 linhas, com a C43, a C47 e a C46). Conferência feita por Claude Code
  (Sonnet 5.5), sem gravar nada e sem Git · **Verificação:** (1) `node scripts/sincronizar.mjs`
  (prévia, sem `--aplicar`): "versão sem mudança: 2026-10-23-df176636" e 13 linhas `igual` (4 contas
  Claude Code + 9 IAs); (2) o texto entre `rules-ai:inicio` e `rules-ai:fim` de cada um dos 9
  arquivos globais tem 1444 linhas e o mesmo `sha256` do `dist/REGRAS-GLOBAIS.md` (`eaf44e429574`);
  (3) `grep -c` em cada um dos 9: seção "Classificar mensagens (C43)" = 1, `decisao: jev` = 1, C47 = 8,
  C46 = 1, C41/C46 = 6; (4) as 4 contas do Claude Code importam `@C:/fontes/rules-ai/dist/REGRAS-GLOBAIS.md`
  (que tem a C43) e o `settings.json` das 4 tem 0 ocorrências de `jev`; a prévia diz "sem o Jev
  global" nas 4; (5) `~/.codex/hooks.json` não existe (sem gancho global antigo). **Fora do R4.1, do
  usuário:** o aviso da prévia (`codex_hooks = true` em `[features]` do `~/.codex/config.toml`) é
  ligação à mão do gancho de projeto do Codex (C44), não bloqueia esta subtarefa. Obs.: o cabeçalho
  dos arquivos globais não traz a versão; ela está em `VERSAO.md` e a igualdade é provada pelo hash.
- **JEV-AI-SUGGESTION:** NAO

### JEV-GLOBAL-AI-FINAL.23 — Fechamento: status do projeto e mapa de `C:\fontes`

**Próximo passo:** registrar no `STATUS_PROJETO.md`, citar o gancho no mapa `C:\fontes\CLAUDE.md` e
`C:\fontes\AGENTS.md` (os dois iguais) e regravar o portal com `atualizar-index.cmd`.

- **Nível:** LEVE — Jev `LEVE`, final proposto `LEVE`, confiança 0.88, ação `sugestao_automatica`
- **Modelo:** só Haiku — nunca outro (C22)
- **Effort:** low
- **Arquivos:** `STATUS_PROJETO.md`, `C:\fontes\CLAUDE.md`, `C:\fontes\AGENTS.md`
- **Critérios de aceitação:** os dois mapas iguais; portal regravado.
- **Entrega:** Claude Code (Haiku 5.5 · executor-leve; líder Opus 5.5) — `STATUS_PROJETO.md`: estado, itens 6–10 do que espera o usuário e histórico de 2026-10-20 01:10. Falta o mapa `C:\fontes\CLAUDE.md`/`AGENTS.md` e o `atualizar-index.cmd` (só no computador) · **Verificação (líder):** diff lido pelo líder
- **JEV-AI-SUGGESTION:** NAO

### JEV-GLOBAL-AI-FINAL.24 — O Jev decide o modelo da mensagem (confiança ≥ 0,80)

**Próximo passo:** no `comando-mensagem.mjs`, marcar `decisao: jev` quando a confiança for ≥ 0,80 e
não houver sinal de PESADO; senão `decisao: matriz` (nível mais alto entre Jev e sinais) e
`revisar`; mostrar a decisão no contexto do gancho.

- **Nível:** MEDIO — Jev `MEDIO`, final proposto `MEDIO`, confiança 0.98, ação `sugestao_automatica`
- **Modelo:** só Sonnet — nunca outro (C22)
- **Effort:** medium
- **Arquivos:** `scripts/jev/cli/comando-mensagem.mjs`, `scripts/jev/decidir.mjs`
- **Critérios de aceitação:** R6.1 e R6.2; INV-5 (sinal de PESADO nunca rebaixado).
- **Entrega:** Claude Code (Sonnet 5.5 · executor-medio; líder Opus 5.5) — `mensagem/decisao.mjs`: `jev` com confiança ≥ 0,80 e sem sinal; senão `matriz` + `revisar`; PESADO nunca rebaixado; líder pediu a troca do ternário aninhado · **Verificação (líder):** R6.1 e R6.2 no `testes/mensagem.mjs`; ensaio: Jev LEVE + sinal de banco → PESADO `matriz` (INV-5)
- **JEV-AI-SUGGESTION:** NAO
