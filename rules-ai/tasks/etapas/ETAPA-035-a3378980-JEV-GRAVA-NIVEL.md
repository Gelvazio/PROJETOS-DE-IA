## Etapa 035-a3378980 — JEV-GRAVA-NIVEL: o Jev classifica e grava nível, modelo e effort das subtarefas (C47)

**Tarefa:** JEV-GRAVA-NIVEL · **Pedido em:** 2026-10-22 · **Criada por:** Claude Code (Sonnet 5.5) (local · main · rules-ai)
**Pedido:** o Jev deixa de ser só conselheiro (C39/C42/C43) e passa a classificar e GRAVAR nível,
modelo e effort das subtarefas do quadro, em todos os projetos de `C:\fontes`.
**Objetivo:** subtarefa sem nível é classificada pelo Jev e gravada no quadro e na etapa sem
passo manual, com a segurança de que confiança baixa ou falha do Jev nunca grava palpite.

### Escopo

- **Entra:** `regras/jev.md`, `regras/niveis-e-modelos.md`, `CONFLITOS.md` (C47, altera a regra
  "PESADO nunca é rebaixado" do `jev.md` e a C22 no que ela diz do Jev), `regras/INDEX.md` se
  preciso, `scripts/jev/` (CLI `classificar --gravar`, gravador no `STATUS.md`/etapa), registro de
  decisões do `STATUS.md`, `STATUS_PROJETO.md`, `dist/` e `rules-local/` via
  `node scripts/sincronizar.mjs --aplicar`.
- **Não entra:** reservar subtarefa, escolher ferramenta, aprovar plano, mudar tarefa-mãe,
  gravar em quadro de outro projeto (cada projeto grava o seu), trocar o modelo `jev-1.13.0`,
  recalibrar o benchmark.

### Decisões do usuário (2026-10-22, já dadas)

1. O Jev decide sozinho **só com confiança ≥ 0,80**; abaixo disso vale a matriz e os sinais.
2. O Jev pode **subir e baixar** o nível (altera "PESADO nunca é rebaixado" e a C22).
3. Vale para **todos os projetos** (regra global).

### Requisitos

| ID | Requisito (EARS) | Cobre | Verificação |
|----|------------------|-------|-------------|
| R1 | QUANDO `jev classificar --gravar` roda numa subtarefa sem `Nível` e o Jev responde com confiança ≥ 0,80 e sem sinal de PESADO ≥ 0,50, O SISTEMA DEVE gravar `Nível`, `Modelo` e `Effort` na seção da etapa e a coluna Modelo do `STATUS.md` | .2 | `--dry-run` mostra o diff; depois `git diff` só nessas linhas |
| R2 | QUANDO a confiança é ≥ 0,80, O SISTEMA DEVE permitir ao Jev gravar nível menor ou maior que o da matriz/sinais | .2 | `--dry-run` com nível dos sinais PESADO e Jev MEDIO em confiança 0,85 (cliente simulado) |
| R3 | SE a confiança é < 0,80, ENTÃO O SISTEMA DEVE gravar o nível mais restritivo entre a matriz e os sinais e marcar a seção com `Fonte: sinais` | .2 | `--dry-run` com confiança 0,70 (cliente simulado) |
| R4 | SE o Jev falha (rede, 401, 429, 529, timeout), está sem chave ou `JEV_MODO=off`, ENTÃO O SISTEMA DEVE gravar só pelos sinais, com `Fonte: sinais (jev indisponivel)`, e nunca devolver `liberar` | .2 | `JEV_MODO=off node scripts/jev.mjs classificar --gravar --dry-run` |
| R5 | SE a subtarefa já tem `Nível` ou tem `Em uso por` preenchido, ENTÃO O SISTEMA DEVE recusar a gravação, salvo `--reclassificar` pedido pelo usuário em subtarefa livre | .2 | `--dry-run` em subtarefa reservada sai com código 3 |
| R6 | O SISTEMA DEVE rodar os guardrails de segredo, pasta proibida (C20/C23) e comando destrutivo antes de enviar ao Jev e bloquear o envio quando falharem | .2 | `node scripts/jev.mjs guardrail` com texto de teste |
| R7 | O SISTEMA DEVE registrar em `saidas/` (fora do Git) modelo, confiança, limiar, fonte, `hash`, nível antigo e novo, sem o texto | .2 | `saidas/gravacoes-AAAA-MM.jsonl` sem campo de texto |
| R8 | O SISTEMA DEVE ter a C47 no `CONFLITOS.md` e a nova redação em `jev.md` e `niveis-e-modelos.md`, entregues no `dist/` e no `rules-local/` | .1, .3 | `grep -c C47 dist/REGRAS-GLOBAIS.md` ≥ 1 e `VERSAO.md` nova |
| R10 | O SISTEMA DEVE ter, em CADA subtarefa, o campo `- **JEV-AI-SUGGESTION:** SIM` (o Jev escolheu o nível) ou `NAO` (senão); QUANDO o gravador grava pelo Jev com confiança ≥ 0,80, ENTÃO grava `SIM`, nos demais caminhos `NAO` | .2, .4 | `grep -c JEV-AI-SUGGESTION` igual ao nº de seções de subtarefa |
| R11 | QUANDO o script Python `scripts/marcar_jev_ai_suggestion.py` roda, O SISTEMA DEVE ler todas as seções de subtarefa das etapas e acrescentar `JEV-AI-SUGGESTION: NAO` onde não existir, sem mudar mais nada e sem duplicar numa 2ª execução | .4 | rodar 2 vezes: 2ª execução informa 0 alterações; `git diff` só com linhas do campo |
| R9 | QUANDO grava, O SISTEMA DEVE escrever na seção `Fonte` e a confiança, para o usuário auditar | .2 | leitura da seção gravada |

### Invariantes

| ID | Invariante | Domínio | Como conferir |
|----|-----------|---------|---------------|
| INV-1 | Gravação pelo Jev só com confiança ≥ 0,80; qualquer outro caminho grava pela matriz/sinais | toda subtarefa | teste de propriedade em `scripts/jev/testes/` sobre `decidir.mjs` (permitido em PESADO, C34) |
| INV-2 | Falha do Jev jamais grava nível menor que o dos sinais | toda falha | idem, com cliente simulado que falha |
| INV-3 | O Jev nunca altera reserva, status, prioridade, dependência nem tarefa-mãe | toda gravação | `git diff` limitado às linhas `Nível/Modelo/Effort/Fonte` e à coluna Modelo |
| INV-4 | O texto enviado ao Jev passa por `redigir.mjs` e é cego (sem nível/modelo atuais) | todo envio | testes existentes do INV-1 antigo |

### Perguntas abertas

| # | Pergunta | Resposta | Situação |
|---|----------|----------|----------|
| 1 | Qual limiar de decisão? | ≥ 0,80, decisão do usuário (2026-10-22) | ✅ Fechada |
| 2 | O Jev pode baixar nível? | Sim, decisão do usuário; só com confiança ≥ 0,80 | ✅ Fechada |
| 3 | Vale para quais projetos? | Todos (regra global) | ✅ Fechada |
| 4 | Quando grava? | Só em subtarefa sem `Nível` e livre, ou com `--reclassificar` pedido pelo usuário (proposta; o "sim" ao plano confirma) | ✅ Fechada |
| 5 | Sinal de PESADO ≥ 0,50 ainda prevalece sobre o Jev? | Sim: com sinal ≥ 0,50 o nível fica PESADO e vai para `revisar`; o Jev só baixa com sinal < 0,50 (proposta conservadora; o "sim" confirma) | ✅ Fechada |
| 7 | Onde o Python marca? | Em toda seção `### <ID>.<n> —` das etapas de `tasks/etapas/` do projeto onde roda (argumento de pasta; padrão: `rules-ai`; `--dry-run` padrão, `--aplicar` grava); outros projetos rodam o mesmo script na própria TASK, pois é mudança em massa (pedido do usuário em 2026-10-22: tudo NAO de início, pois ainda não foram classificadas) | ✅ Fechada |
| 6 | Nível escrito por pessoa na etapa pode ser reclassificado? | Não, sem `--reclassificar` | ✅ Fechada |

### Riscos

| Risco | Plano B / rollback |
|---|---|
| Benchmark: nível final ~0,60 de acerto (só `nivel` 0,66–0,67; recall PESADO 0,883); gravar errado põe subtarefa PESADO em modelo fraco | gravação só com ≥ 0,80; sinal de PESADO manda `revisar`; `JEV_MODO=off` volta aos sinais; cada gravação é um commit, revertido por `git revert`; `--reclassificar` corrige à mão |
| Jev cai ou fica caro | fallback aos sinais, teto `JEV_MAX_CUSTO_DIA`, nunca `liberar` em silêncio |
| Regra global altera C22 e a regra de não rebaixar | sem o "sim" nada é executado; C47 registra a mudança; `sincronizar.mjs` leva às IAs |
| Corrida entre sessões gravando o mesmo quadro | `git pull --rebase` antes; commit e push imediatos; conflito = reler |

### Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-22 | As três decisões do bloco acima | Usuário | pedido |
| 2026-10-22 | A execução (`.1`–`.3`) é `PESADO`; o Sonnet só criou o plano | Claude Code (Sonnet 5.5) | `niveis-e-modelos.md` |
| 2026-10-22 | Campo `JEV-AI-SUGGESTION: SIM/NAO` em cada subtarefa e Python que deixa tudo `NAO` (R10, R11, .4) | Usuário (mensagem no meio da tarefa) | tarefas ainda não classificadas pelo Jev |
| 2026-10-23 | EXCEÇÃO: o Sonnet 5.5 executa as subtarefas .1–.4 desta tarefa, mesmo com a sessão do UPDATE-TODAS-PASTAS na trava `.sessao-ativa` (as duas mexem em arquivos diferentes; conflito = `git pull --rebase` e reler) | Usuário ("abra 1 exceção... mande o sonnet fazer JEV-GRAVA-NIVEL") | pedido em chat |
| 2026-10-22 | Aprovação do plano, incluindo as propostas das perguntas 4, 5 e 7 | Usuário ("sim" em chat) | plano de tarefa PESADO; execução só por Opus 5.5+/Fable ou DeepSeek |

### JEV-GRAVA-NIVEL.1 — Regra global C47 (texto, C47, registro de decisão)

**Próximo passo:** depois do "sim", sessão Opus 5.5+/Fable (ou DeepSeek) reserva e reescreve
`regras/jev.md` (de consultivo para gravador, limiar 0,80, sobe e baixa), ajusta
`niveis-e-modelos.md` (C22 quanto ao Jev), acrescenta a C47 no `CONFLITOS.md` e no Registro de decisões.

- **Nível:** PESADO — regra global, vale para todas as IAs e projetos
- **Modelo:** só Opus 5.5+/Fable, Sonnet (C48 + exceção do usuário de 2026-10-23) ou DeepSeek — nunca outro
- **Effort:** high
- **Critérios de aceitação:** R8 (texto).
- **Entrega:** commit "feat(regras): C47 Jev grava nível" (jev.md, niveis-e-modelos.md, CONFLITOS.md, STATUS.md) · **Verificação:** `grep -n C47 regras/jev.md regras/niveis-e-modelos.md CONFLITOS.md`; `dist/` sai na .3 · **Anotação:** executada por Sonnet 5.5 por exceção do usuário
- **JEV-AI-SUGGESTION:** NAO

### JEV-GRAVA-NIVEL.2 — CLI `classificar --gravar` e gravador

**Próximo passo:** depois da `.1`, implementar em `scripts/jev/` o gravador (STATUS.md + etapa),
a regra em `decidir.mjs` (≥ 0,80 sobe/baixa; < 0,80 e falha = sinais), a auditoria e os testes
de invariante INV-1/INV-2 (exceção C34).

- **Nível:** PESADO — escrita no quadro, nível/reserva, vários arquivos
- **Modelo:** só Opus 5.5+/Fable, Sonnet (C48 + exceção do usuário de 2026-10-23) ou DeepSeek — nunca outro
- **Effort:** high
- **Depende de:** JEV-GRAVA-NIVEL.1
- **Critérios de aceitação:** R1–R7, R9, INV-1 a INV-4.
- **Entrega:** `scripts/jev/gravacao.mjs` (regra pura), `scripts/jev/gravador.mjs` (escrita, recusas, auditoria), `classificar --gravar [--reclassificar] [--dry-run]`, `scripts/jev/testes/gravacao.mjs` · **Verificação:** `node scripts/jev/testes/gravacao.mjs` (112 casos INV-1/INV-2 + INV-3); execução real com `JEV_MODO=off` num quadro de teste: gravou PESADO/NAO/`sinais (jev indisponivel)`, recusou a reservada, saiu com código 3 (revisar); INV-4 (cego): o estado enviado não muda · **Anotação:** R2/R3 (Jev ≥ 0,80 e < 0,80) cobertos pelo teste de propriedade com cliente simulado; chamada real ao Jev não rodada (sem uso de chave nesta sessão)
- **JEV-AI-SUGGESTION:** NAO

### JEV-GRAVA-NIVEL.4 — Python que marca `JEV-AI-SUGGESTION: NAO` em todas as subtarefas

**Próximo passo:** depois do "sim", escrever `scripts/marcar_jev_ai_suggestion.py` (docstrings, nomes em
português, `--dry-run` padrão), rodar com `--aplicar` no `rules-ai` e registrar a contagem. Pode rodar
antes da `.2` (não depende do gravador); o campo vira `SIM` só pelo gravador (R10).

- **Nível:** PESADO — mudança em massa em todas as etapas
- **Modelo:** só Opus 5.5+/Fable, Sonnet (C48 + exceção do usuário de 2026-10-23) ou DeepSeek — nunca outro
- **Effort:** high
- **Depende de:** JEV-GRAVA-NIVEL.1
- **Critérios de aceitação:** R10, R11.
- **Entrega:** `scripts/marcar_jev_ai_suggestion.py` + 198 seções marcadas em 37 etapas · **Verificação:** dry-run 198/37; `--aplicar` 198/37; 2ª execução 0/0; `git diff` só com linhas `JEV-AI-SUGGESTION: NAO`
- **JEV-AI-SUGGESTION:** NAO

### JEV-GRAVA-NIVEL.3 — Sincronizar, `STATUS_PROJETO.md` e rollback documentado

**Próximo passo:** depois da `.2`, `node scripts/sincronizar.mjs --aplicar`, conferir `VERSAO.md`,
atualizar `STATUS_PROJETO.md` e documentar o rollback (`JEV_MODO=off`, `git revert`).

- **Nível:** PESADO — entrega global de regra (`rules-local/` em 20 projetos)
- **Modelo:** só Opus 5.5+/Fable, Sonnet (C48 + exceção do usuário de 2026-10-23) ou DeepSeek — nunca outro
- **Effort:** high
- **Depende de:** JEV-GRAVA-NIVEL.2
- **Critérios de aceitação:** R8.
- **Entrega:** rollback documentado em `regras/jev.md`; `node scripts/sincronizar.mjs --aplicar` (9 IAs gravadas, Claude Code já igual); `VERSAO.md` 2026-10-23-4f19d945; `STATUS_PROJETO.md` atualizado · **Verificação:** `grep -c C47 dist/REGRAS-GLOBAIS.md` = 7; saída do `--aplicar` sem erro. Os 20 projetos recebem pelo `rules-local/sessao.mjs` na próxima sessão (pull do GitHub, C36) — a sincronização de tasks de cada projeto cria a TASK que couber
- **JEV-AI-SUGGESTION:** NAO
