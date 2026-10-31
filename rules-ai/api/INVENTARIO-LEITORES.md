# Inventário de leitores e escritores do quadro em markdown (MIGRAR-TAREFAS-API.3)

Levantado em 2026-10-23 no `rules-ai`. Decisão do usuário: no `rules-ai` não existe tarefa em
markdown; tudo vai para a API e, no fim, os `.md` de tarefa são apagados. Esta lista diz quem
depende hoje de `tasks/STATUS.md`, `tasks/task_complete.md`, `tasks/RECADOS.md`,
`tasks/etapas/*.md`, `tasks/.sessao-ativa` e `tasks/GERENCIADOR-HERDR/`.

Legenda: L = leitura, E = escrita, L/E = os dois, M = só menção (texto, comentário, regra).
Subtarefas: .17 gerenciador, .18 mcp, .19 jev, .20 python/marcar, .21 dashboard py, .22 workflow,
.23 dashboard js, .24-.27 regras, .29 docs. "NOVA" = proposta, sem dono hoje.

## 1. MCP (`mcp/`) — .18

| Arquivo | Função/trecho | L/E | Arquivo de tarefa | Subtarefa |
|---|---|---|---|---|
| mcp/config.mjs | `ARQUIVO_STATUS`, `ARQUIVO_CONCLUIDAS`, `PASTA_ETAPAS`, limite de leitura | M (constantes) | STATUS, task_complete, etapas | .18 |
| mcp/projetos.mjs | lista projetos com `tasks/STATUS.md`; resolve caminho permitido (STATUS, task_complete, `etapas/*.md`) | L | STATUS, task_complete, etapas | .18 |
| mcp/quadro.mjs | leitor/escritor do quadro (`task_next`, `task_finish`, move linha, grava seção da etapa, escrita atômica) | L/E | STATUS, task_complete, etapas | .18 |
| mcp/testes/quadro.mjs | testes do leitor/escritor com quadros de exemplo | L/E (fixtures) | STATUS, task_complete, etapas | .18 |

## 2. Gerenciador (`scripts/gerenciador*`) — .17

| Arquivo | Função/trecho | L/E | Arquivo de tarefa | Subtarefa |
|---|---|---|---|---|
| scripts/gerenciador.mjs | modo `ver`: lê STATUS e task_complete do `origin/main` de cada projeto (candidatos da config) | L | STATUS, task_complete | .17 |
| scripts/gerenciador/quadro.mjs | leitura de linhas, mapa ID concluído, cálculo de subtarefas livres | L | STATUS, task_complete | .17 |
| scripts/gerenciador.config.json | `arquivosQuadro`, `arquivosConcluidas` | M (config) | STATUS, task_complete | .17 |
| scripts/gerenciador/testes/gerenciador.mjs | testes do quadro/livres | L (fixtures) | STATUS, task_complete | .17 |

## 3. Jev (`scripts/jev*`) — .19

| Arquivo | Função/trecho | L/E | Arquivo de tarefa | Subtarefa |
|---|---|---|---|---|
| scripts/jev.mjs | CLI `classificar --quadro tasks/STATUS.md --gravar`, guardrails | L/E | STATUS, etapas | .19 |
| scripts/jev/estado.mjs | `ARQUIVO_QUADRO`; coletor cego do quadro + seção da subtarefa na etapa | L | STATUS, task_complete, etapas | .19 |
| scripts/jev/gravacao.mjs | edição do texto do quadro (coluna Modelo) e da seção | E (texto em memória) | STATUS, etapas | .19 |
| scripts/jev/gravador.mjs | grava Nível, Modelo, Effort, JEV-AI-SUGGESTION, Fonte na etapa e Modelo no STATUS | E | STATUS, etapas | .19 |
| scripts/jev/benchmarks/construir-golden.mjs | monta `golden.jsonl` lendo `C:/fontes/*/tasks` (outros projetos) | L | STATUS, task_complete | .19 (só se os outros projetos seguirem em md; ver riscos) |
| scripts/jev/benchmarks/casos-sinteticos.mjs | caso sintético que cita `tasks/STATUS.md` | M | STATUS | .19 |
| scripts/jev/benchmarks/golden.jsonl | dado de benchmark com texto de quadro | M (dado) | STATUS | .19 |
| scripts/jev/testes/guardrails-escopo.mjs | caso de teste com `tasks/STATUS.md` como arquivo alterado | M | STATUS | .19 |
| scripts/jev/testes/invariantes.mjs | invariantes do Jev que citam quadro/etapa | L (fixtures) | STATUS, etapas | .19 |

## 4. Scripts Python e outros scripts — .20

| Arquivo | Função/trecho | L/E | Arquivo de tarefa | Subtarefa |
|---|---|---|---|---|
| scripts/marcar_jev_ai_suggestion.py | `PASTA_ETAPAS = tasks/etapas`; marca JEV-AI-SUGGESTION em todas as etapas | L/E | etapas | .20 |
| scripts/testes/ai-memory-invariantes.mjs | lista de arquivos de quadro que a memória não pode ler/escrever | M | STATUS, task_complete, etapas | NOVA (.30) |
| scripts/ai-memory-auditar.mjs | padrão `tasks/` na auditoria da memória | M | pasta tasks | NOVA (.30) |
| scripts/instalar-ai-memory.mjs | `ignore_paths` com `tasks/**` | M | pasta tasks | NOVA (.30) |

(`scripts/sincronizar.mjs`, `scripts/UPDATE.py`, `scripts/instalar-rules-local.mjs`,
`scripts/pacote-rules-local.mjs` e `scripts/deepseek/*` foram conferidos: não tocam o quadro.)

## 5. Dashboard Python (`dashboard/*.py`) — .21

| Arquivo | Função/trecho | L/E | Arquivo de tarefa | Subtarefa |
|---|---|---|---|---|
| dashboard/quadro_tarefas.py | `CAMINHO_QUADRO = tasks/STATUS.md`; `ler_quadro()`, lista de projetos com STATUS | L | STATUS | .21 |
| dashboard/publicar_quadro.py | publica o quadro no Supabase Broadcast (contrato da etapa 031) | L | STATUS (e etapa 031 citada) | .21 |
| dashboard/testes/invariante_paridade_quadro.py | paridade Python x JS lendo STATUS de cada projeto | L | STATUS | .21 |
| dashboard/testes/medir_latencia.mjs | medição: instrução de alterar o STATUS e dar push | M | STATUS | .21 |

## 6. Dashboard JS (`dashboard/assets/js`) — .23

| Arquivo | Função/trecho | L/E | Arquivo de tarefa | Subtarefa |
|---|---|---|---|---|
| dashboard/assets/js/config.js | `urlQuadro` (raw GitHub) e `urlQuadroLocal ../tasks/STATUS.md` | L | STATUS | .23 |
| dashboard/assets/js/agentes.js | página "Agentes ao vivo" lê STATUS (ao vivo ou fallback) | L | STATUS | .23 |
| dashboard/assets/js/agentes/canal.js | texto do STATUS da primeira origem; estado inicial | L | STATUS | .23 |
| dashboard/assets/js/agentes/quadro.js | parser de tarefas do texto do STATUS | L | STATUS | .23 |

## 7. Workflow e Git — .22

| Arquivo | Função/trecho | L/E | Arquivo de tarefa | Subtarefa |
|---|---|---|---|---|
| .github/workflows/publicar-quadro.yml | gatilho `paths: [tasks/STATUS.md]`; roda `publicar_quadro.py` | L (gatilho) | STATUS | .22 |
| .gitignore | linha 152 `tasks/.sessao-ativa` | M | .sessao-ativa | NOVA (.31) |

## 8. API (`api/`) — origem dos dados, não leitor a adaptar

| Arquivo | Função/trecho | L/E | Arquivo de tarefa | Subtarefa |
|---|---|---|---|---|
| api/gerar-db.mjs | gera `db.json` lendo STATUS e task_complete (`PADRAO_ETAPA`) | L | STATUS, task_complete, etapas | NOVA (.32): é a ponte atual md -> API; some quando o md sumir |
| api/db.json | dado gerado com os links `etapas/...` | M (dado) | STATUS, task_complete, etapas | idem .32 |
| api/package.json | descrição "derivada de tasks/STATUS.md..." | M | STATUS, task_complete | .29 |
| api/README.md | explica a origem md | M | STATUS, task_complete | .29 |

## 9. Spec

| Arquivo | Função/trecho | L/E | Arquivo de tarefa | Subtarefa |
|---|---|---|---|---|
| spec/verificar-spec.mjs | gate: lê `tasks/etapas/ETAPA-*.md` (`PASTA_ETAPAS`) | L | etapas | NOVA (.33): gate passa a ler a etapa da API |
| spec/README.md | uso do gate com caminho de etapa | M | etapas | .29 |
| spec/templates/invariantes.md, perguntas-abertas.md, requisitos.md | citam etapa/quadro | M | etapas | .29 |

## 10. Regras, AGENTS e CONFLITOS — .24 a .27

Agrupamento sugerido (a etapa define o corte exato): .24 ciclo/quadro/frentes/níveis; .25
comandos (`.`/`?`), gerenciador e herdr; .26 mcp-quadro/jev/memória/espec; .27 demais, AGENTS,
CONFLITOS.

| Arquivo | Trecho | L/E | Arquivo de tarefa | Subtarefa |
|---|---|---|---|---|
| regras/quadro-de-tarefas.md | modelo do STATUS, task_complete, etapa (12 ocorrências) | M | todos | .24 |
| regras/ciclo-da-task.md | ciclo cria/move linhas (8) | M | STATUS, task_complete, etapas | .24 |
| regras/frentes-e-reserva.md | reserva, recados (5) | M | STATUS, RECADOS | .24 |
| regras/niveis-e-modelos.md | onde fica o nível, mover para task_complete (2) | M | STATUS, etapas, task_complete | .24 |
| regras/regra-maior.md | coluna Modelo do STATUS | M | STATUS | .24 |
| regras/comando-ponto.md | `.` lê STATUS (2) | M | STATUS | .25 |
| regras/comando-interrogacao.md | `?` lê STATUS (2) | M | STATUS, .sessao-ativa | .25 |
| regras/gerenciador-centralizado.md | gerenciador lê STATUS | M | STATUS | .25 |
| regras/herdr.md | quadro/reserva do painel, .sessao-ativa | M | STATUS, .sessao-ativa | .25 |
| regras/mcp-quadro.md | MCP lê/escreve STATUS, task_complete, etapa (4) | M | todos | .26 |
| regras/jev.md | grava nível na etapa e STATUS | M | STATUS, etapas | .26 |
| regras/memoria-ai.md | quadro vence a memória (2) | M | STATUS, etapas | .26 |
| regras/espec.md | spec vive na etapa | M | etapas | .26 |
| regras/graphify.md | fim de tarefa = linha movida | M | task_complete | .27 |
| regras/rules-local.md | sincronização de tasks cria STATUS/etapa (4) | M | STATUS, etapas | .27 |
| regras/visualizador-gerado.md | cita `tasks/` e STATUS | M | STATUS | .27 |
| AGENTS.md | trava `tasks/.sessao-ativa`, "Em uso por" no STATUS | M (procedimento) | STATUS, .sessao-ativa | .27 |
| CONFLITOS.md | decisões que citam quadro | M | STATUS | .27 |
| STATUS_PROJETO.md | histórico cita quadro | M | STATUS | .29 |

## 11. Docs — .29

| Arquivo | Trecho | L/E | Arquivo de tarefa | Subtarefa |
|---|---|---|---|---|
| docs/AI-MEMORY-HOOKS.md | memória e quadro | M | STATUS | .29 |
| docs/AI-MEMORY-MEDICAO.md | memória e quadro | M | STATUS | .29 |
| dashboard/README.md | explica a fonte STATUS | M | STATUS | .29 |
| dashboard/LIMITES-REALTIME.md | gatilho por STATUS | M | STATUS | .29 |
| dashboard/ROLLBACK-AGENTES.md | rollback do canal por STATUS | M | STATUS | .29 |

## Não coberto por nenhuma subtarefa

1. `api/gerar-db.mjs` e `api/db.json`: a ponte atual md -> API; precisa de dono (proposta .32).
2. `spec/verificar-spec.mjs`: o gate lê `tasks/etapas/*.md`; precisa de dono (proposta .33).
3. `.gitignore` (`tasks/.sessao-ativa`) e a trava de sessão do `AGENTS.md` (procedimento que lê e
   apaga o arquivo): a .27 cobre o texto, mas não onde a trava passa a viver (proposta .31).
4. `scripts/testes/ai-memory-invariantes.mjs`, `scripts/ai-memory-auditar.mjs` e
   `scripts/instalar-ai-memory.mjs` (proteção da memória contra `tasks/`): proposta .30.
5. `tasks/RECADOS.md` e `tasks/GERENCIADOR-HERDR/`: só citados em regras; nenhum código os lê.
   Falta decidir onde os recados vivem na API.
6. Projetos fora do `rules-ai` (aulasenai, dashboard-ai) que o gerenciador, o MCP e o
   `construir-golden.mjs` ainda leem em markdown: as .17/.18/.19 precisam manter suporte a `.md`
   nesses projetos (a decisão vale só para o `rules-ai`).
7. Sincronização de tasks do `rules-local` (cria mãe `RL-...` em STATUS/etapa): coberta só pelo
   texto da regra (.27); o procedimento no `rules-ai` precisa de novo destino.

## Riscos de corte (o que quebra se o `.md` sumir antes da adaptação)

| Se sumir | Quebra |
|---|---|
| `tasks/STATUS.md` | workflow `publicar-quadro.yml` (gatilho e leitura); `dashboard/quadro_tarefas.py` e `publicar_quadro.py`; página "Agentes ao vivo" (`config.js`, `quadro.js`, `canal.js`); `mcp/*` (`task_next` e `task_finish` com quadro inválido); `scripts/gerenciador*`; `scripts/jev/estado.mjs`; `api/gerar-db.mjs`; teste de paridade |
| `tasks/task_complete.md` | dependências ✅ no gerenciador e no MCP (subtarefa fica bloqueada ou livre por engano); `api/gerar-db.mjs`; destino de `task_finish` |
| `tasks/etapas/*.md` | `spec/verificar-spec.mjs` (gate); gravador do Jev (sem seção para gravar o nível); `marcar_jev_ai_suggestion.py`; `task_finish` (anotar entrega); leitura do "Próximo passo" na retomada |
| `tasks/.sessao-ativa` | trava de sessão do `AGENTS.md`; sem o arquivo, duas sessões podem trabalhar juntas |
| `tasks/RECADOS.md`, `tasks/GERENCIADOR-HERDR/` | nenhum código quebra; regras e IAs perdem o canal de recados e as notas do herdr |
| Todos, ao mesmo tempo | regras `.` e `?`, sincronização do `rules-local` e o hook de sessão (leem o quadro por texto); `benchmarks/construir-golden.mjs` (lê quadros de `C:/fontes`) |
