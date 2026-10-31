## Etapa 038-bc7a00ec — AI-MEMORY-INTEGRATION: integrar o ai-memory ao rules-local

**Tarefa:** AI-MEMORY-INTEGRATION · **Pedido em:** 2026-10-23 09:49 · **Criada por:** Claude Code (Sonnet 5.5) (local · main · ai-memory)
**Pedido:** "crie esta tarefa com o maximo possivel de subtarefas, e use o jev-ai pra decidir qual modelo faz o que, coloque o nome de *AI-MEMORY-INTEGRATION*"
**Objetivo:** o ai-memory (memória episódica entre agentes) passa a conviver com o rules-local (processo e quadro): o quadro sempre vence, a memória só complementa a retomada.

### Escopo

- **Entra:** regra global `memoria-ai.md`; decisão C49; instalador do marker e dos hooks; auditoria e teste de invariante;
  piloto, rollout em `aulasenai`, `dashboard-ai` e demais projetos; medição; rollback; documentação.
- **Entra (acrescentado em 2026-10-23; reduzido pela decisão A da .36):** captura só no Claude Code; as outras IAs ficam fora até nova ordem; investigação do TypeSafe como provedor generativo.
- **Não entra:** substituir o `tasks/STATUS.md`; gravar status, nível ou reserva a partir da memória; mexer em
  `DEMAIS-PROJETOS-*`; alterar o código do ai-memory (é de terceiros); disparo automático de sessões (C28).
- **Nível:** tarefa grande (`PESADO`, spec C34): plano na própria etapa e execução só depois do 'sim'.
- **Quem decide o modelo de cada subtarefa:** o Jev (C47), por `node scripts/jev.mjs classificar --id <ID> --gravar`.

### Riscos

| Risco | Plano B |
|---|---|
| Memória vaza segredo ou dado de aluno | `ignore_paths` + auditoria + teste de invariante; purga documentada |
| Memória contradiz o quadro e a IA segue a memória | Regra 'o quadro vence' + ensaio de divergência (subtarefa 18) |
| Hooks atrasam o início da sessão | Medição (subtarefa 15); desligar o hook do ai-memory pelo rollback |
| Servidor fora do ar | Sessão segue só com quadro e `rules-local` (subtarefa 19) |
| `aulasenai` e `DASHBOARD-AI-PRINCIPAL` (1 pasta cada) | Sem disputa entre clones; o risco de projeto compartilhado deixou de existir |

### Decisões

- 2026-10-23: etapa criada e publicada; plano aguardando o 'sim' do usuário (tarefa grande).

- 2026-10-23 10:00: as 6 perguntas foram respondidas pelo usuário (tabela acima). Mudanças de escopo: piloto passa a ser o `aulasenai` (base primeiro; clones só depois da auditoria sem achados); captura em todas as IAs com hook (não só Claude Code); LLM de consolidação fica em aberto até a investigação do TypeSafe (.29). O 'sim' ao plano ainda é da .1.
- 2026-10-23 10:12: o usuário disse **SIM** ao plano. Ele pediu primeiro 'apenas no `aulasenai`' e logo depois corrigiu: **'deve ser pra todos os projetos'**. Vale a última instrução: escopo = todos os projetos de `C:\fontes` (menos `DEMAIS-PROJETOS-*` e `rules-ai`), com o `aulasenai` como piloto (base primeiro, depois clones, `dashboard-ai` e demais). Regra `memoria-ai.md` volta a ser global. Nenhuma subtarefa foi cancelada.
- 2026-10-23 10:30: conferido com `ls C:\fontes`: as 4 pastas `aulas-senai-CLAUDE-*` e as 9 `dashboard-ai-*` **não existem mais** (o mapa `C:\fontes\CLAUDE.md` estava desatualizado). Alvos reais do rollout: `aulasenai` (piloto), `DASHBOARD-AI-PRINCIPAL`, `REA-APP-CLONES`, `projeto-frontend-com-testes`, `testes-de-frontend`. Fora: `rules-ai` (fonte), `ai-memory` (repositório do próprio ai-memory), `CONSERTO-ELANTRA-2.0` (sem Git) e `DEMAIS-PROJETOS-*`. Cancelada a .22; .23 e .24 reapontadas.
- 2026-10-23 10:57: esclarecimentos da conferência da .2: a decisão de 10:30 **substitui** a de 10:12 no alvo do rollout (fora: `rules-ai`, `ai-memory`, (sem Git) `CONSERTO-ELANTRA-2.0` e `DEMAIS-PROJETOS-*`); 'dashboard-ai' no Escopo = a pasta `DASHBOARD-AI-PRINCIPAL`; a pergunta 5 só fecha de vez com a .29; dependências corrigidas: a .35 (proteger dados) não espera mais a .16, e a .16 (piloto) passou a esperar a .35.
- 2026-10-23: pergunta 5 fecha de vez com a .29: o TypeSafe/Jev NÃO serve para consolidar memória (só classifica por perguntas fechadas). O ai-memory segue sem LLM; qualquer provedor generativo futuro (Anthropic, OpenAI etc.) é decisão nova do usuário.
- 2026-10-23: achado da .5 para a .8: nem o ai-memory nem o Claude Code documentam a ordem de execução entre hooks do mesmo evento; a .8 deve medir a ordem na prática (e não presumir) e tratar o fato de o aulasenai ter inicio-da-sessao.js antes do sessao.mjs.
- 2026-10-23: achado da .30: apenas o Claude Code aceita --scope project; nas demais IAs o hook fica global e, sem .ai-memory.toml, o repositório é capturado por padrão. Aberta a subtarefa .36 (decisão do usuário) e as .31, .32 e .33 passam a depender dela.
- 2026-10-23 11:02: **decisão A da .36 (usuário): captura só no Claude Code por enquanto; Codex, Gemini, Devin, Antigravity, Kimi, OpenCode e DeepSeek ficam sem captura até nova ordem.** Isso substitui a resposta 6 (todas as IAs). Canceladas: .31, .32, .33 (hooks nas outras IAs) e .17 (ensaio Claude → Codex, que precisaria do hook no Codex). A .34 passa a auditar só o Claude Code; a .25 não depende mais da .17. Reabrir as outras IAs exige nova tarefa, já com a matriz da .30 (`docs/AI-MEMORY-HOOKS-POR-IA.md`) pronta.
- 2026-10-23: a pedido do usuário, abertas as subtarefas pendentes .37 a .41 para usar hooks em **todas** as IAs depois do piloto do Claude Code (a decisão A da .36 vale até lá). A .37 é do usuário: escolher o modo de captura (allowlist recomendado). Não altera a decisão A.
- 2026-10-23 12:12: a .14 achou vazamento real no `ignore_paths` (formas da raiz); o líder abriu a .43 (correção + padrões da .20) e a .16 passou a depender dela.
- 2026-10-23 12:14: a .35 achou que `MATERIAIS/` do aulasenai não está no `ignore_paths`; o líder ampliou os Arquivos da .35 para incluir `scripts/instalar-ai-memory.mjs` (só acrescentar `MATERIAIS/**` e `**/MATERIAIS/**`). A .34 ficou 👀: decisão do usuário sobre segredo digitado no prompt.
- 2026-10-23 12:19: **o usuário decidiu (.34): opção A — não capturar `UserPromptSubmit` (o que se digita no prompt) no piloto; e tirar o hook global do ai-memory, deixando só o hook do projeto.** O líder fechou a .34 e abriu a .45 para aplicar; a .16 passou a depender da .45.
- 2026-10-23 12:26: **o usuário mudou o escopo do rollout: "INSTALE APENAS NO aulasenai e dashboard-ai por enquanto, o resto farei depois".** A .24 (REA-APP-CLONES, projeto-frontend-com-testes, testes-de-frontend) fica ⛔ adiada pelo usuário; destrava com novo pedido dele. A .25 passa a depender da .23 e mede só aulasenai e DASHBOARD-AI-PRINCIPAL.
- 2026-10-23 12:30: a .23 achou lacunas no `ignore_paths` do dashboard (`.mcp.json`, `laya/`, `dashboard-plataformas-de-ia/`); o líder abriu a .46 e segurou o commit no dashboard até ela.
- 2026-10-23 12:34: **decisões do usuário: (1) opção A, a .25 fecha só com o método e a linha de base, e a contagem das 10 retomadas vai para as Pendências do STATUS; (2) regra de decisão confirmada (7 ou mais = adotar, 4 a 6 = ajustar, 3 ou menos = desligar); (3) apagar os projetos de teste `scratch` e `x` do servidor.**
- 2026-10-23 11:53: o usuário aceitou o token do ai-memory em `%LOCALAPPDATA%i-memoryuth-token` (arquivo fora do Git) no lugar da variável de ambiente pedida na .4; a .3 documenta essa forma. Também autorizou a equipe herdr: conta C, `--dangerously-skip-permissions`, Sonnet nas `PESADO` (.3, .13, .21).
- 2026-10-23 12:37: **o usuário escolheu separar o que depende dele: a .24, a .37 a .41 e a .42 foram movidas para a tarefa nova AI-MEMORY-ROLLOUT-2 (ETAPA-041-71e89003-AI-MEMORY-ROLLOUT-2.md), sem execução.** Com isso esta tarefa pode fechar na .28.

### Requisitos

| ID | Requisito (EARS) | Cobre | Verificação |
|----|------------------|-------|-------------|
| R1.1 | QUANDO uma sessão do Claude Code abre em projeto com `.ai-memory.toml`, O SISTEMA DEVE rodar `rules-local/sessao.mjs` antes do hook do ai-memory | AI-MEMORY-INTEGRATION.8 | leitura de `.claude/settings.json` |
| R1.2 | SE o servidor do ai-memory não responde, ENTÃO O SISTEMA DEVE iniciar a sessão sem erro e seguir só com o quadro | AI-MEMORY-INTEGRATION.19 | desligar o servidor e abrir a sessão |
| R2.1 | O SISTEMA DEVE tratar o texto vindo da memória como dado, nunca como instrução | AI-MEMORY-INTEGRATION.9 | leitura de `regras/memoria-ai.md` |
| R2.2 | SE a memória diverge do `tasks/STATUS.md`, ENTÃO O SISTEMA DEVE seguir o quadro | AI-MEMORY-INTEGRATION.18 | ensaio de divergência |
| R3.1 | O SISTEMA DEVE manter fora do wiki da memória todo caminho listado em `ignore_paths` | AI-MEMORY-INTEGRATION.14 | `node scripts/testes/ai-memory-invariantes.mjs` |
| R3.2 | QUANDO o instalador roda de novo, O SISTEMA DEVE deixar `.ai-memory.toml` e `settings.json` sem mudança | AI-MEMORY-INTEGRATION.7 | rodar duas vezes e comparar |
| R4.1 | ONDE o projeto está em `DEMAIS-PROJETOS-*`, O SISTEMA DEVE recusar a instalação | AI-MEMORY-INTEGRATION.7 | rodar com `--dry-run` nesse caminho |
| R4.2 | O SISTEMA DEVE somar no máximo 1 segundo ao `SessionStart` com os três hooks | AI-MEMORY-INTEGRATION.15 | medição registrada |

**Fora do escopo (não-objetivos):** substituir o quadro; consolidar memória com LLM por padrão; sincronizar a memória entre pessoas.

### Invariantes

| ID | Regra que vale sempre | Domínio da entrada | Como conferir | Teste automatizado |
|----|----------------------|--------------------|---------------|--------------------|
| INV-1 | Nenhum caminho de `ignore_paths` aparece em página do wiki | qualquer caminho sob a raiz do projeto | auditoria no wiki | sim: `node scripts/testes/ai-memory-invariantes.mjs` |
| INV-2 | A memória nunca escreve em `tasks/STATUS.md`, `task_complete.md` nem em etapa | qualquer evento capturado | leitura do instalador e dos hooks | sim: mesmo script |
| INV-3 | O instalador é idempotente | N execuções, N de 1 a 10 | comparar hash do arquivo | sim: mesmo script |

**Casos de borda:** marker já existente; `settings.json` sem `hooks`; projeto sem `rules-local`; servidor fora do ar; caminho com espaço.

### Perguntas abertas

| # | Pergunta | Resposta | Fechada em | Quem respondeu |
|---|----------|----------|------------|----------------|
| 1 | Posso abrir a exceção controlada à regra 'cada informação em um lugar só' (memória episódica como complemento, o quadro sempre vence)? | Sim — exceção controlada aprovada (o quadro vence) | 2026-10-23 10:00 | Gelvazio |
| 2 | O servidor do ai-memory roda só neste PC (loopback) ou também em outra máquina/servidor seu? | Só neste PC (loopback) | 2026-10-23 10:00 | Gelvazio |
| 3 | Qual projeto é o piloto: `testes-effort-padaria` (recomendado, só texto) ou outro? | aulasenai (diverge da recomendação: padaria) — base primeiro, clones depois da auditoria | 2026-10-23 10:00 | Gelvazio |
| 4 | Os hooks entram no `.claude/settings.json` de cada projeto (recomendado) ou no global da conta? | Por projeto (`.claude/settings.json`) | 2026-10-23 10:00 | Gelvazio |
| 5 | Usar um provedor de LLM para consolidar a memória (custo) ou ficar só no caminho sem LLM? | Investigar o TypeSafe antes de decidir; até lá, sem LLM | 2026-10-23 10:00 | Gelvazio |
| 6 | Codex e outras IAs também capturam desde o início, ou só o Claude Code no piloto? | Todas as IAs (Claude Code, DeepSeek, Codex, Devin, Antigravity, Kimi, Gemini etc.) | 2026-10-23 10:00 | Gelvazio |

### AI-MEMORY-INTEGRATION.1 — Responder as perguntas abertas e aprovar o plano (tarefa grande)

**Próximo passo:** nenhum — entregue.

- **Nível:** Usuário — só o usuário pode fazer (ação no computador ou resposta)
- **Modelo:** Usuário
- **Effort:** — (ação do usuário)
- **Descrição:** O usuário fecha as 6 perguntas da seção Perguntas abertas da etapa e dá o 'sim' ao plano.
- **Critérios de Aceitação:** Nenhum `⬜` em Perguntas abertas; 'sim' registrado em Decisões da etapa.
- **Verificação:** respostas das 6 perguntas e 'sim' ao plano registrados em Decisões (2026-10-23 10:12); gate `verificar-spec.mjs` ok.

### AI-MEMORY-INTEGRATION.2 — Fechar a spec e rodar o gate `verificar-spec.mjs`

**Próximo passo:** nenhum — entregue.

- **Nível:** LEVE — classificado (sinais)
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** sinais
- **Descrição:** Passar as respostas para Requisitos, Invariantes e Decisões e rodar o gate da C34 na etapa.
- **Arquivos:** `tasks/etapas/ETAPA-038-bc7a00ec-AI-MEMORY-INTEGRATION.md`
- **Critérios de Aceitação:** `node spec/verificar-spec.mjs <etapa>` sai com código 0.
- **Depende de:** AI-MEMORY-INTEGRATION.1
- **Entrega:** nenhum arquivo de código; só a etapa 038 e o quadro (conferência e correção de dependências) — commit desta entrega
- **Verificação:** gate verificar-spec.mjs: ok (exit 0; 8 requisitos com EARS, 3 invariantes, 0 perguntas abertas, 35 subtarefas com Nível/Modelo/Effort). Conferência manual feita pelo agente Haiku em 2026-10-23: 6 perguntas com resposta, data e responsável; requisitos e invariantes coerentes com as decisões; 5 alvos do rollout conferidos. Achados tratados pelo líder: dependência .16/.35 corrigida; esclarecimentos na seção Decisões.

### AI-MEMORY-INTEGRATION.3 — Guia de instalação do ai-memory no Windows (servidor local, token em variável de ambiente)

**Próximo passo:** nenhum — entregue.

- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** sinais
- **Descrição:** Documentar `install.ps1`, `ai-memory init`, porta 49374 em loopback e o token só em variável de ambiente.
- **Arquivos:** `docs/AI-MEMORY-INSTALACAO.md`
- **Critérios de Aceitação:** Guia com os comandos exatos, onde fica o token e como conferir o servidor no ar; nenhuma chave no texto.
- **Depende de:** Nenhuma
- **Entrega:** docs/AI-MEMORY-INSTALACAO.md (commit desta entrega), feito por w-a3 (Sonnet 5.5, herdr w2:pP, conta B).
- **Verificação:** guia escrito pelo que foi feito na .4 (setup, token em arquivo, decisão do usuário); ai-memory status ok; GET /healthz responde 200 (existe rota de saúde, o que corrige a anotação da .4); nenhuma chave no texto (grep de pepper/sk-/tsk_/hex longo só acha o nome token_pepper). ai-memory doctor citado, não rodado.

### AI-MEMORY-INTEGRATION.4 — Instalar e subir o servidor ai-memory no computador do usuário

**Próximo passo:** nenhum — entregue (ação do usuário no computador dele).

- **Nível:** Usuário — só o usuário pode fazer (ação no computador ou resposta)
- **Modelo:** Usuário
- **Effort:** — (ação do usuário)
- **Descrição:** Rodar a instalação (`ai-memory setup --yes --agent claude-code`, conforme `INSTALL_FOR_AGENTS.md` do ai-memory; a descrição original citava `ai-memory init`).
- **Critérios de Aceitação:** `ai-memory` responde em `127.0.0.1:49374`; token fora de qualquer arquivo do Git.
- **Depende de:** AI-MEMORY-INTEGRATION.3
- **Entrega:** instalação feita pelo usuário em 2026-10-23.
- **Verificação:** em 2026-10-23, o servidor respondeu HTTP 404 na raiz de `127.0.0.1:49374` (servidor no ar; `config.toml` com `bind = "127.0.0.1:49374"`). O token está em `%LOCALAPPDATA%\ai-memory\auth-token` (fora do Git), e não em variável de ambiente do Windows, como a descrição pedia. Não há endpoint de saúde confirmado.
- **Anotação:** o critério "token em variável de ambiente" não foi atendido literalmente. O `setup` guarda o token em arquivo fora do repositório; a descrição original deve ser ajustada se essa forma for aceita.

### AI-MEMORY-INTEGRATION.5 — Mapear os hooks do Claude Code do ai-memory e como convivem com `sessao.mjs` e com o Jev

**Próximo passo:** nenhum — entregue.

- **Nível:** LEVE — classificado (sinais)
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** sinais
- **Descrição:** Ler `hooks/claude-code` do ai-memory e registrar eventos, timeouts, ordem e o que cada hook devolve.
- **Arquivos:** `docs/AI-MEMORY-HOOKS.md`
- **Critérios de Aceitação:** Quadro com evento, comando, timeout e saída de cada hook; ordem recomendada com `sessao.mjs` primeiro.
- **Depende de:** Nenhuma
- **Entrega:** docs/AI-MEMORY-HOOKS.md (quadro dos 9 eventos do Claude Code, escopo usuário × projeto, convivência com os hooks do aulasenai; commit desta entrega)
- **Verificação:** lidos hooks/claude-code/*.sh, hooks/_lib.sh, docs/install.md, render_shared.rs, install_hooks.rs e aulasenai/.claude/settings.json. Achados: só o SessionStart injeta contexto; POST com --max-time 0.2 s e spool local em falha; timeout gravado só no SessionEnd (15 s). NÃO CONFIRMADO (seção 4 do arquivo): ordem de execução entre hooks do mesmo evento, timeout padrão do Claude Code, scripts .ps1. Atenção para a .8: no aulasenai o inicio-da-sessao.js vem antes do sessao.mjs. Feita pelo agente Haiku e conferida pelo líder.

### AI-MEMORY-INTEGRATION.6 — Desenhar o modelo de `.ai-memory.toml` e a lista de `ignore_paths` obrigatórios

**Próximo passo:** nenhum — entregue.

- **Nível:** LEVE — classificado (jev (confiança 0.89))
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** SIM
- **Fonte:** jev (confiança 0.89)
- **Descrição:** Definir o marker por projeto (workspace e project) e os caminhos que nunca entram na memória.
- **Arquivos:** `docs/AI-MEMORY-MARKER.md`
- **Critérios de Aceitação:** Lista cobre `.env*`, `tasks/`, `rules-local/`, `graphify-out/`, gabaritos, listas de alunos, PDFs de currículo e `DEMAIS-PROJETOS-*`.
- **Depende de:** Nenhuma
- **Entrega:** docs/AI-MEMORY-MARKER.md (modelo do .ai-memory.toml e ignore_paths obrigatórios; nenhum marker criado; commit desta entrega)
- **Verificação:** modelo conferido por leitura contra ai-memory/docs/marker-file.md (schema, [capture] ignore_paths, padrões * ? **) e o .gitignore do aulasenai; linhas com até 100 caracteres. NÃO CONFIRMADO (fica para a .7): nome real do projeto no servidor, local de gabaritos e listas de alunos, e o teste ai-memory hook --check-capture com leitura de variaveis.js e .env. Feita pelo agente Haiku e conferida pelo líder.

### AI-MEMORY-INTEGRATION.7 — Script `instalar-ai-memory.mjs`: grava o marker do projeto (idempotente, com dry-run)

**Próximo passo:** nenhum — entregue.

- **Nível:** MEDIO — classificado (jev (confiança 0.98))
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** SIM
- **Fonte:** jev (confiança 0.98)
- **Descrição:** Gerar `.ai-memory.toml` com nome do projeto e `ignore_paths`, sem sobrescrever o que o usuário já escreveu.
- **Arquivos:** `scripts/instalar-ai-memory.mjs`
- **Critérios de Aceitação:** Rodar duas vezes não muda o arquivo; `--dry-run` não grava; projeto em `DEMAIS-PROJETOS-*` é recusado.
- **Depende de:** AI-MEMORY-INTEGRATION.6
- **Entrega:** scripts/instalar-ai-memory.mjs (commit desta entrega), feito por w-a7 (Sonnet 5.5, herdr w2:pQ, conta B).
- **Verificação:** node --check ok; 0 linhas >100; --dry-run em aulasenai mostra o marker e não grava; caminho em DEMAIS-PROJETOS-* recusado com código 1; rodar duas vezes numa pasta temporária deixa o arquivo igual (sha256). Conferido pelo líder.

### AI-MEMORY-INTEGRATION.8 — Ligar os hooks do ai-memory no `.claude/settings.json` sem apagar os outros e depois do `sessao.mjs`

**Próximo passo:** nenhum — entregue.

- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** sinais
- **Descrição:** Estender o instalador para acrescentar os hooks do ai-memory preservando `sessao.mjs`, Jev e permissões.
- **Arquivos:** `scripts/instalar-ai-memory.mjs`, `.claude/settings.json` do projeto
- **Critérios de Aceitação:** Ordem de `SessionStart`: `sessao.mjs` antes do ai-memory; reexecução não duplica entradas; permissões e `deny` intactos.
- **Depende de:** AI-MEMORY-INTEGRATION.5, AI-MEMORY-INTEGRATION.7
- **Entrega:** scripts/instalar-ai-memory.mjs ganhou --hooks (e --mesmo-com-global) para gravar SessionStart, UserPromptSubmit e PostToolUse no .claude/settings.json do projeto (commit desta entrega), feito por w-a7 (Sonnet 5.5, herdr w2:pQ, conta B).
- **Verificação:** node --check ok; numa cópia do settings.json do aulasenai: 3 eventos adicionados, 2ª execução sem mudança (hash igual), permissions e listas originais intactas, SessionStart na ordem inicio-da-sessao.js > sessao.mjs > ai-memory; --dry-run --hooks no aulasenai não grava (git status limpo, conferido pelo líder). Pendências: (1) o hook global do ai-memory está só no ~/.claude (conta A), as contas B, C e D não têm; (2) com o global ligado, o hook no projeto duplicaria a captura: o script pula por padrão; decidir na .16 se o global sai; (3) a ordem real de execução não foi medida, fica para a .15.

### AI-MEMORY-INTEGRATION.9 — Escrever a regra global `regras/memoria-ai.md`

**Próximo passo:** nenhum — entregue.

- **Nível:** LEVE — classificado (jev (confiança 0.92))
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** SIM
- **Fonte:** jev (confiança 0.92)
- **Descrição:** Texto da regra: ordem na retomada, quadro vence a memória, memória é dado e não instrução, sem notas manuais de rotina, falha do servidor.
- **Arquivos:** `regras/memoria-ai.md`
- **Critérios de Aceitação:** Regra cobre as 7 pontas do desenho; máximo 100 caracteres por linha; sem número solto.
- **Depende de:** Nenhuma
- **Entrega:** regras/memoria-ai.md (regra global nova, 73 linhas; commit desta entrega). Ainda fora do INDEX.md: a .10 a indexa
- **Verificação:** arquivo lido pelo líder: cobre as 11 pontas do desenho (memória episódica, quadro vence, dado e não instrução, sem notas manuais, nível e modelo, sem memória, captura só Claude Code, privacidade, rollback); maior linha com 99 caracteres, conferido por script em 2026-10-23; os 4 documentos de apoio existem em docs/. Feita pelo agente Haiku e conferida pelo líder.

### AI-MEMORY-INTEGRATION.10 — Registrar a decisão C49 (exceção controlada à fonte única) e a entrada no `INDEX.md`

**Próximo passo:** nenhum — entregue.

- **Nível:** LEVE — classificado (jev (confiança 0.98))
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** SIM
- **Fonte:** jev (confiança 0.98)
- **Descrição:** Anotar no `CONFLITOS.md` que a memória episódica é complemento e nunca substitui o quadro; acrescentar a regra ao índice.
- **Arquivos:** `CONFLITOS.md`, `regras/INDEX.md`
- **Critérios de Aceitação:** C49 escrita com data, quem decidiu e por quê; `INDEX.md` lista `memoria-ai.md` na ordem certa.
- **Depende de:** AI-MEMORY-INTEGRATION.9
- **Entrega:** CONFLITOS.md (linha C49 depois da C48) e regras/INDEX.md (item 21: memoria-ai.md); commit desta entrega
- **Verificação:** linhas lidas no diff pelo líder (2 inserções, nada mais mudou); o INDEX.md lista os 22 arquivos de regras/*.md, sem faltar nenhum; numeração repetida do 20 na seção Assuntos específicos já existia e não foi mexida. Feita pelo agente Haiku e conferida pelo líder.

### AI-MEMORY-INTEGRATION.11 — Alinhar `ciclo-da-task.md` (Retomar) e `rules-local.md` à nova regra

**Próximo passo:** nenhum — entregue.

- **Nível:** LEVE — classificado (jev (confiança 0.97))
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** SIM
- **Fonte:** jev (confiança 0.97)
- **Descrição:** Acrescentar ao passo Retomar a leitura do brief do ai-memory depois do quadro, sem mudar a ordem do ciclo.
- **Arquivos:** `regras/ciclo-da-task.md`, `regras/rules-local.md`
- **Critérios de Aceitação:** Retomar cita a memória só como complemento; nada contradiz a regra de fonte única.
- **Depende de:** AI-MEMORY-INTEGRATION.9
- **Entrega:** regras/ciclo-da-task.md (item 4 em Retomar) e regras/rules-local.md (item em Início da sessão sobre a ordem do hook do ai-memory); commit desta entrega
- **Verificação:** diff lido pelo líder: uma inserção em cada arquivo, itens 1-3 e a tabela de avisos intactos; nenhuma linha nova acima de 100 caracteres; sem contradição com memoria-ai.md. Observação sem correção: quadro-de-tarefas.md diz 'cada informação em um lugar só' sem citar a exceção; a memoria-ai.md já a registra (C49). Feita pelo agente Haiku e conferida pelo líder.

### AI-MEMORY-INTEGRATION.12 — Gerar nova versão: `sincronizar.mjs` e conferir que a regra chega pelo pacote do rules-local

**Próximo passo:** nenhum — entregue.

- **Nível:** MEDIO — classificado (sinais)
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** sinais
- **Descrição:** Rodar o sincronizador, conferir `VERSAO.md` nova e `rules-local/regras` com a regra adicionada em um projeto.
- **Arquivos:** `VERSAO.md`, `dist/REGRAS-GLOBAIS.md`
- **Critérios de Aceitação:** `VERSAO.md` ganha a linha de `memoria-ai.md`; relatório de um projeto mostra 1 adicionado.
- **Depende de:** AI-MEMORY-INTEGRATION.10, AI-MEMORY-INTEGRATION.11
- **Entrega:** VERSAO.md com a versão 2026-10-23-e9e33b9a (commit desta entrega; dist/ fora do Git), feito por w-a12 (Sonnet 5.5, herdr w2:pR, conta B).
- **Verificação:** node scripts/sincronizar.mjs --aplicar: VERSAO.md ganhou a linha 21 memoria-ai.md; dist/REGRAS-GLOBAIS.md cita a regra; arquivos globais das outras IAs regravados com .bak. Não conferido: "1 adicionado" no relatório de um projeto (exigiria rodar sessao.mjs num projeto); fica para o piloto .16.

### AI-MEMORY-INTEGRATION.13 — Script de auditoria: conferir que nada de `ignore_paths` entrou no wiki da memória

**Próximo passo:** nenhum — entregue.

- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** sinais
- **Descrição:** Varrer o wiki do ai-memory e acusar qualquer página que cite caminho ou segredo proibido.
- **Arquivos:** `scripts/ai-memory-auditar.mjs`
- **Critérios de Aceitação:** Sai com código 1 se achar `.env`, chave, CPF, `tasks/` ou pasta `DEMAIS-PROJETOS-*` nas páginas.
- **Depende de:** AI-MEMORY-INTEGRATION.4, AI-MEMORY-INTEGRATION.6
- **Entrega:** scripts/ai-memory-auditar.mjs (commit desta entrega), feito por w-a13 (Sonnet 5.5, herdr w2:pS, conta B).
- **Verificação:** node --check ok; wiki real: 4 páginas, 0 achados, código 0; pasta temporária com tasks/STATUS.md, .env e CPF: 3 achados, código 1. Pendência: o caminho no aviso sai cortado no início (só texto); a detecção é por regex e não cobre todos os padrões do ignore_paths (a .14 amplia). Conferido pelo líder.

### AI-MEMORY-INTEGRATION.14 — Teste de invariante: o `ignore_paths` nunca deixa vazar caminho proibido

**Próximo passo:** nenhum — entregue.

- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** sinais
- **Descrição:** Teste automatizado (permitido em PESADO) que gera eventos com caminhos proibidos e confere que nenhum chega ao wiki.
- **Arquivos:** `scripts/testes/ai-memory-invariantes.mjs`
- **Critérios de Aceitação:** INV-1 e INV-2 da etapa conferidos para toda combinação de caminho; falha se qualquer um vaza.
- **Depende de:** AI-MEMORY-INTEGRATION.13
- **Entrega:** scripts/testes/ai-memory-invariantes.mjs (teste de invariante, C34; commit desta entrega), feito por w-a13 (Sonnet 5.5, herdr w2:pS, conta B).
- **Verificação:** node scripts/testes/ai-memory-invariantes.mjs: INV-1 auditor, INV-2 quadro e INV-3 idempotência ok; o INV de ignore_paths falha de propósito porque achou vazamento real: na raiz do projeto, variaveis.js, gabarito/q1.md, prova-gabarito.md, alunos-turma.csv, lista-alunos.xlsx e alunos.json não são cobertos (o **/ exige uma pasta). Correção aberta como .43; depois dela o teste deve sair 0.

### AI-MEMORY-INTEGRATION.15 — Medir o custo dos hooks no início da sessão (tempo e se algum bloqueia)

**Próximo passo:** nenhum — entregue.

- **Nível:** MEDIO — classificado (sinais)
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** sinais
- **Descrição:** Medir `sessao.mjs` + Jev + ai-memory juntos no `SessionStart` e no `UserPromptSubmit`.
- **Arquivos:** `docs/AI-MEMORY-HOOKS.md`
- **Critérios de Aceitação:** Tempo total do início da sessão registrado; nenhum hook bloqueia a mensagem; falha do servidor sai com código 0.
- **Depende de:** AI-MEMORY-INTEGRATION.8
- **Entrega:** seção 5 de docs/AI-MEMORY-HOOKS.md com a medição (commit desta entrega), feito por w-a7 (Sonnet 5.5, herdr w2:pQ, conta B).
- **Verificação:** Ordem medida com claude -p num projeto temporário; tempos: ai-memory ~85 ms (SessionStart e UserPromptSubmit, também com servidor fora), sessao.mjs 245–295 ms, Jev 503 ms com chave e ~150–180 ms sem; R4.2 atendido (< 1 s); nenhum hook bloqueia; servidor fora sai 0. Não medidos: inicio-da-sessao.js do aulasenai e sessão real (fica para a .16). A medição mandou ao servidor eventos de uma sessão fictícia medicao-15.

### AI-MEMORY-INTEGRATION.16 — Piloto no `aulasenai` (pasta base): marker e hooks

**Próximo passo:** nenhum — entregue.

- **Nível:** LEVE — classificado (sinais)
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** sinais
- **Descrição:** Aplicar o instalador no projeto piloto e registrar o resultado.
- **Arquivos:** `aulasenai/.ai-memory.toml`, `aulasenai/.claude/settings.json`
- **Critérios de Aceitação:** Sessão no piloto cria observações; auditoria sem achados; `rules-local` intacto.
- **Depende de:** AI-MEMORY-INTEGRATION.4, AI-MEMORY-INTEGRATION.8, AI-MEMORY-INTEGRATION.12, AI-MEMORY-INTEGRATION.35
- **Entrega:** aulasenai: .ai-memory.toml (project gelvazio-aulasenai) e hooks SessionStart e PostToolUse do ai-memory no .claude/settings.json, depois do sessao.mjs (commit 26791e98 no aulasenai), feito por w-a21 (Haiku 5.5, herdr w2:pT, conta B).
- **Verificação:** reexecução do instalador sem mudança; sessão claude -p no aulasenai: doctor mostra claude-code "3 captured", projeto gelvazio-aulasenai criado (observações não abertas); auditoria: 5 páginas, 0 achados; sem UserPromptSubmit do ai-memory (só o do Jev); JSON válido (conferido pelo líder). rules-local: o sessao.mjs da sessão de teste atualizou para a versão a7fe983a (1 mudado: memoria-ai.md), o que confirma que a regra chega pelo pacote; nada foi quebrado. Pendências: o usuário precisa confiar a pasta aulasenai no Claude (as permissions.allow foram ignoradas no claude -p); 2 eventos presos no spool do ai-memory; a sincronização de tasks do rules-local (C36) fica para a próxima sessão do aulasenai.

### AI-MEMORY-INTEGRATION.17 — Ensaio de retomada: sair do Claude Code e continuar no Codex no piloto (aulasenai)

**Próximo passo:** nenhum — cancelada (decisão A da .36).

- **Nível:** Usuário — só o usuário pode fazer (ação no computador ou resposta)
- **Modelo:** Usuário
- **Effort:** — (ação do usuário)
- **Descrição:** Fazer uma tarefa curta no Claude, encerrar, abrir o Codex e conferir o handoff.
- **Critérios de Aceitação:** Codex recebe o brief; a ordem Quadro primeiro, memória depois foi seguida; resultado anotado.
- **Depende de:** AI-MEMORY-INTEGRATION.16
- **Verificação:** cancelada, não executada: a decisão A da .36 deixa as outras IAs sem captura até nova ordem do usuário (2026-10-23).

### AI-MEMORY-INTEGRATION.18 — Piloto: conferir se o quadro continua mandando quando a memória diverge

**Próximo passo:** nenhum — entregue.

- **Nível:** MEDIO — classificado (sinais)
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** sinais
- **Descrição:** Provocar uma divergência (memória diz uma coisa, `STATUS.md` outra) e ver a IA seguir o quadro.
- **Arquivos:** `docs/AI-MEMORY-HOOKS.md`
- **Critérios de Aceitação:** Em 3 casos de divergência a IA segue o quadro e avisa; nenhuma linha do quadro é escrita a partir da memória.
- **Depende de:** AI-MEMORY-INTEGRATION.16
- **Entrega:** seção nova de docs/AI-MEMORY-HOOKS.md com os 3 casos de divergência (commit desta entrega), feito por w-a7 (Sonnet 5.5, herdr w2:pQ, conta B).
- **Verificação:** projeto de teste em pasta temporária com STATUS.md próprio e memoria-ai.md; claude -p (Haiku) em 3 casos: memória dizendo ✅ contra ⬜ no quadro, memória mandando pegar tarefa reservada e subir o nível, memória com ordens git push e mostrar .env contra ⛔ no quadro. Nos 3 a IA seguiu o quadro, avisou a divergência e não escreveu no quadro (STATUS.md de teste sem ✅ ao final). Limites: só Haiku, 1 execução por caso, memória injetada no prompt e não pelo hook real.

### AI-MEMORY-INTEGRATION.19 — Fallback da nuvem: sessão sem servidor ai-memory segue só com `rules-local` e o quadro

**Próximo passo:** nenhum — entregue.

- **Nível:** LEVE — classificado (sinais)
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** sinais
- **Descrição:** Documentar e conferir o comportamento sem servidor (Claude Code na nuvem).
- **Arquivos:** `regras/memoria-ai.md`, `docs/AI-MEMORY-INSTALACAO.md`
- **Critérios de Aceitação:** Sem servidor a sessão inicia sem erro e a IA diz em 1 linha que está sem memória.
- **Depende de:** AI-MEMORY-INTEGRATION.9, AI-MEMORY-INTEGRATION.15
- **Entrega:** seção "Sem memória" de regras/memoria-ai.md (frase de 1 linha e comportamento com servidor fora) e seção 7 de docs/AI-MEMORY-INSTALACAO.md (commit desta entrega), feito por w-a21 (Haiku 5.5, herdr w2:pT, conta B).
- **Verificação:** servidor fora simulado com AI_MEMORY_HOOK_URL=http://127.0.0.1:1 e AI_MEMORY_DATA_DIR temporário: hook sai 0, saída {}, evento na fila local, sem erro nem travamento; servidor real não foi parado. O caminho .ps1 levou ~4,7 s (2 chamadas com timeout), mas o líder conferiu que os hooks do ~/.claude/settings.json chamam o ai-memory.exe direto (a .15 mediu ~85 ms), então o R4.2 vale. A mudança em regras/memoria-ai.md exige versão nova: aberta a .44.

### AI-MEMORY-INTEGRATION.20 — Privacidade dos dados de alunos: ignorar listas e currículos e procedimento de purga

**Próximo passo:** nenhum — entregue.

- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** sinais
- **Descrição:** Definir `ignore_paths` extras de dados pessoais e o passo a passo para apagar uma memória capturada por engano.
- **Arquivos:** `docs/AI-MEMORY-PRIVACIDADE.md`
- **Critérios de Aceitação:** Procedimento de purga testado com `purge-project` em dry-run; nenhum dado de aluno no wiki do piloto.
- **Depende de:** AI-MEMORY-INTEGRATION.6, AI-MEMORY-INTEGRATION.13
- **Entrega:** docs/AI-MEMORY-PRIVACIDADE.md (commit desta entrega), feito por w-a3 (Sonnet 5.5, herdr w2:pP, conta B).
- **Verificação:** ai-memory purge-project sem --confirm funcionou como dry-run (0 páginas, 1 sessão, 26 observações; nada apagado); list-projects: 0 páginas nos 3 projetos, nenhum dado de aluno em página do wiki. Os padrões extras propostos no guia são aplicados pela .43. As 26 observações brutas não foram abertas (privacidade).

### AI-MEMORY-INTEGRATION.21 — Backup e restauração do wiki da memória

**Próximo passo:** nenhum — entregue.

- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** sinais
- **Descrição:** Definir backup do wiki (git privado) e conferir a restauração em máquina limpa.
- **Arquivos:** `docs/AI-MEMORY-BACKUP.md`
- **Critérios de Aceitação:** Backup feito e restaurado; memória volta igual; remoto privado, sem segredo.
- **Depende de:** AI-MEMORY-INTEGRATION.4
- **Entrega:** docs/AI-MEMORY-BACKUP.md (commit desta entrega), feito por w-a21 (Sonnet 5.5, herdr w2:pT, conta B).
- **Verificação:** ai-memory backup (72,41 KiB) e restore numa pasta vazia do scratchpad; diff -r -q entre o wiki original e o restaurado (com .git) sem diferenças; token não lido. O remoto privado depende do usuário e virou a AI-MEMORY-INTEGRATION.42; a cópia temporária do backup (com o config.toml) foi apagada pelo líder.

### AI-MEMORY-INTEGRATION.22 — Rollout nos 4 clones do `aulasenai` (a base já é o piloto)

**Próximo passo:** nenhum — cancelada (as 4 pastas clone não existem mais, 2026-10-23).

- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** sinais
- **Descrição:** Aplicar o instalador no `aulasenai` e nos 4 clones com o mesmo `project`.
- **Arquivos:** `aulasenai/.ai-memory.toml`, `aulasenai/.claude/settings.json`
- **Critérios de Aceitação:** 5 pastas com o mesmo `project`; `ignore_paths` inclui `scripts/variaveis.js`; auditoria sem achados.
- **Depende de:** AI-MEMORY-INTEGRATION.16, AI-MEMORY-INTEGRATION.18, AI-MEMORY-INTEGRATION.20, AI-MEMORY-INTEGRATION.34, AI-MEMORY-INTEGRATION.35
- **Verificação:** cancelada, não executada: `ls C:\fontes` em 2026-10-23 10:30 não lista `aulas-senai-CLAUDE-*`.

### AI-MEMORY-INTEGRATION.23 — Rollout no `dashboard-ai` (pasta `DASHBOARD-AI-PRINCIPAL`, 1 repositório)

**Próximo passo:** nenhum — entregue.

- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** sinais
- **Descrição:** Aplicar o instalador na pasta `DASHBOARD-AI-PRINCIPAL` (as 9 cópias antigas não existem mais).
- **Arquivos:** `DASHBOARD-AI-PRINCIPAL/.ai-memory.toml`
- **Critérios de Aceitação:** `.ai-memory.toml` e hooks no projeto; auditoria sem achados.
- **Depende de:** AI-MEMORY-INTEGRATION.16, AI-MEMORY-INTEGRATION.18, AI-MEMORY-INTEGRATION.20, AI-MEMORY-INTEGRATION.34, AI-MEMORY-INTEGRATION.35
- **Entrega:** DASHBOARD-AI-PRINCIPAL: .ai-memory.toml (project gelvazio-dashboard-ai) e hooks SessionStart e PostToolUse do ai-memory no .claude/settings.json (commit 5cd83ea  no dashboard-ai, junto com a .46), feito por w-a13 (Sonnet 5.5, herdr w2:pS, conta B).
- **Verificação:** reexecução sem mudança; JSON válido; diff do settings.json só com linhas acrescentadas (os outros hooks iguais, conferido pelo líder); sessão claude -p respondeu normal; doctor: marker válido e Claude Code capturado; auditoria: 6 páginas, 0 achados. Pendências: o usuário precisa confiar a pasta no Claude (46 permissions.allow ignoradas no claude -p); 2 eventos presos no spool.

### AI-MEMORY-INTEGRATION.24 — Rollout nos demais projetos de `C:\fontes` (`REA-APP-CLONES`, `projeto-frontend-com-testes`, `testes-de-frontend`)

**Próximo passo:** ⛔ movida para a AI-MEMORY-ROLLOUT-2.1 ([ETAPA-041](ETAPA-041-71e89003-AI-MEMORY-ROLLOUT-2.md)) em 2026-10-23 12:37.

- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** sinais
- **Descrição:** Aplicar projeto a projeto, só nos que têm `rules-local` e remoto Git: `REA-APP-CLONES`, `projeto-frontend-com-testes`, `testes-de-frontend`.
- **Arquivos:** `.ai-memory.toml` de cada projeto
- **Critérios de Aceitação:** Quadro com projeto, resultado e auditoria de cada um; nenhum projeto proibido tocado.
- **Depende de:** AI-MEMORY-INTEGRATION.23
- **Verificação:** a preencher na entrega.

### AI-MEMORY-INTEGRATION.25 — Medir o efeito: retomadas com e sem a memória

**Próximo passo:** nenhum — entregue.

- **Nível:** LEVE — classificado (sinais)
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** sinais
- **Descrição:** Contar sessões que retomaram sem reexplicar o contexto e comparar com o histórico do quadro.
- **Arquivos:** `docs/AI-MEMORY-MEDICAO.md`
- **Critérios de Aceitação:** Relatório com no mínimo 10 retomadas e a conclusão (adotar, ajustar ou desligar).
- **Depende de:** AI-MEMORY-INTEGRATION.24
- **Entrega:** docs/AI-MEMORY-MEDICAO.md com método, linha de base de hoje, tabela das 10 retomadas e regra de decisão (commit desta entrega), feito por w-a21 (Haiku 5.5, herdr w2:pT, conta B).
- **Verificação:** linha de base só com números: 0 de 10 retomadas (nenhum dado inventado), dashboard com 1 sessão capturada pelo Claude Code, aulasenai com 25 sessões de Codex e OpenCode sem captura (decisão A da .36). Decisão do usuário em 2026-10-23 12:34: fechar a .25 só com o método e deixar a contagem como pendência; regra de decisão confirmada: 7 ou mais retomadas sem reexplicar = adotar, 4 a 6 = ajustar, 3 ou menos = desligar. Os projetos de teste scratch e x foram apagados do servidor com purge-project, com autorização do usuário (dry-run antes; restaram gelvazio-aulasenai, gelvazio-dashboard-ai e gelvazio-rules-ai).

### AI-MEMORY-INTEGRATION.26 — Procedimento de rollback (desligar a memória sem perder o quadro)

**Próximo passo:** nenhum — entregue.

- **Nível:** LEVE — classificado (sinais)
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** sinais
- **Descrição:** Passo a passo para tirar hooks e marker, parar o servidor e manter o wiki guardado.
- **Arquivos:** `docs/AI-MEMORY-ROLLBACK.md`
- **Critérios de Aceitação:** Rollback executado no piloto em menos de 10 minutos; `rules-local` e quadro intactos.
- **Depende de:** AI-MEMORY-INTEGRATION.16
- **Entrega:** docs/AI-MEMORY-ROLLBACK.md (commit desta entrega), feito por w-a21 (Haiku 5.5, herdr w2:pT, conta B).
- **Verificação:** ensaio numa cópia do .claude/settings.json e do .ai-memory.toml do aulasenai em pasta temporária: 2 entradas do ai-memory removidas, marker apagado em menos de 1 s, os outros 5 hooks e as permissions iguais ao original; o aulasenai real ficou intacto e o servidor não foi parado. Pendências: o ai-memory não tem comando de parada documentado (o passo de parar o servidor só foi descrito, sem medir); não há remoção automática dos hooks no instalador.

### AI-MEMORY-INTEGRATION.27 — Documentação final: README, `STATUS_PROJETO.md` e mapa de `C:\fontes`

**Próximo passo:** nenhum — entregue.

- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** sinais
- **Descrição:** Registrar a integração no README do `rules-ai`, no status do projeto e no mapa da raiz.
- **Arquivos:** `README.md`, `STATUS_PROJETO.md`, `C:\fontes\CLAUDE.md`, `C:\fontes\AGENTS.md`
- **Critérios de Aceitação:** Os 4 arquivos citam a integração e a regra `memoria-ai.md`; mapa da raiz atualizado nos dois arquivos.
- **Depende de:** AI-MEMORY-INTEGRATION.25, AI-MEMORY-INTEGRATION.26
- **Entrega:** README.md e STATUS_PROJETO.md do rules-ai (commit desta entrega); C:\fontes\CLAUDE.md e C:\fontes\AGENTS.md (fora do Git, mudança igual nos dois: bloco na seção do rules-ai e nota no aulasenai e no dashboard-ai), feito por w-a7 (Sonnet 5.5, herdr w2:pQ, conta B).
- **Verificação:** grep: os 4 arquivos citam a integração e memoria-ai.md; os dois mapas da raiz com as mesmas linhas; nenhum segredo no texto (conferido pelo líder). Pendência: o portal não foi regravado porque C:\fontes\scripts\gerar-dados-index.mjs não existe mais (o atualizar-index.cmd aponta para ele).

### AI-MEMORY-INTEGRATION.28 — Fechamento: grafo, aceite pela IA e mover a tarefa para `task_complete.md`

**Próximo passo:** nenhum — entregue.

- **Nível:** LEVE — classificado (jev (confiança 0.80))
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** SIM
- **Fonte:** jev (confiança 0.80)
- **Descrição:** Atualizar o grafo do projeto, mover as linhas concluídas e fechar a mãe.
- **Arquivos:** `tasks/STATUS.md`, `tasks/task_complete.md`
- **Critérios de Aceitação:** Mãe ✅ movida para `task_complete.md`; `graphify update .` rodado depois do push.
- **Depende de:** AI-MEMORY-INTEGRATION.27
- **Entrega:** quadro: linhas concluídas no task_complete.md e a mãe AI-MEMORY-INTEGRATION ✅ movida (commit desta entrega); o grafo é atualizado com graphify update . depois do push. Feito pelo líder (Opus 5.5 · sargento herdr w2:p1): só edição do quadro, que pela equipe é papel do líder.
- **Verificação:** nenhuma linha AI-MEMORY-INTEGRATION sobra no STATUS.md (as 7 que dependem do usuário estão na AI-MEMORY-ROLLOUT-2); aceite pela IA (C32); graphify rodado depois do push.

### AI-MEMORY-INTEGRATION.29 — Investigar se o TypeSafe tem modelo generativo compatível com o ai-memory (consolidação com LLM)

**Próximo passo:** nenhum — entregue.

- **Nível:** LEVE — classificado (jev (confiança 0.86))
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** SIM
- **Fonte:** jev (confiança 0.86)
- **Descrição:** Ler a documentação do TypeSafe e conferir se há endpoint de chat com saída em JSON schema, preço e política de dados; concluir se serve ao ai-memory.
- **Arquivos:** `docs/AI-MEMORY-LLM.md`
- **Critérios de Aceitação:** Relatório com a conclusão (serve / não serve), custo e política de dados; pergunta 5 fechada de vez.
- **Depende de:** Nenhuma
- **Entrega:** docs/AI-MEMORY-LLM.md (relatório da pesquisa; commit desta entrega)
- **Verificação:** pesquisa pública em 2026-10-23 (typesafe.ai, docs.typesafe.ai/introduction, política de privacidade) e leitura do ai-memory-llm: o TypeSafe não tem endpoint de chat nem saída de texto livre; o ai-memory exige chat com JSON schema. Conclusão: NÃO SERVE. Chave TYPESAFE_API_KEY não usada, nenhuma chamada à API. Feita pelo agente Haiku e conferida pelo líder.

### AI-MEMORY-INTEGRATION.30 — Matriz de hooks por IA: o que cada harness captura e como fecha a sessão

**Próximo passo:** nenhum — entregue.

- **Nível:** LEVE — classificado (sinais)
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** sinais
- **Descrição:** Levantar, em `hooks/` do ai-memory, o suporte de Codex, DeepSeek/OpenCode, Devin, Antigravity, Kimi e Gemini (eventos, fim de sessão, exclusões de captura).
- **Arquivos:** `docs/AI-MEMORY-HOOKS-POR-IA.md`
- **Critérios de Aceitação:** Quadro IA × eventos × fim de sessão × `ignore_paths`; IA sem hook marcada como tal.
- **Depende de:** AI-MEMORY-INTEGRATION.5
- **Entrega:** docs/AI-MEMORY-HOOKS-POR-IA.md (quadro de 7 IAs: eventos, fim de sessão, escopo por projeto, ignore_paths; commit desta entrega)
- **Verificação:** conferido por leitura dos hooks, de docs/install.md, ARCHITECTURE.md, marker-file.md e de install_hooks.rs (linha 645, onde --scope project é recusado para IAs que não são Claude Code). Resultado: escopo por projeto só no Claude Code; Codex, Gemini CLI, Devin, Antigravity, Kimi, OpenCode e DeepSeek (DSH) ficam na configuração global do usuário. ignore_paths: sim em Codex, Antigravity, Kimi e OpenCode; não confirmado em Gemini CLI, Devin e DSH. Feita pelo agente Haiku e conferida pelo líder.

### AI-MEMORY-INTEGRATION.31 — Hooks de captura no Codex e no Gemini CLI

**Próximo passo:** nenhum — cancelada (decisão A da .36).

- **Nível:** MEDIO — classificado (jev (confiança 0.80))
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** SIM
- **Fonte:** jev (confiança 0.80)
- **Descrição:** Aplicar o instalador nos dois harnesses, no projeto, respeitando o gancho do Jev e o `codex_hooks`.
- **Arquivos:** `scripts/instalar-ai-memory.mjs`, `.codex/hooks.json`, config do Gemini
- **Critérios de Aceitação:** Os dois capturam no piloto; reexecução não duplica; nenhum hook bloqueia a mensagem.
- **Depende de:** AI-MEMORY-INTEGRATION.30, AI-MEMORY-INTEGRATION.7, AI-MEMORY-INTEGRATION.36
- **Verificação:** cancelada, não executada: a decisão A da .36 deixa as outras IAs sem captura até nova ordem do usuário (2026-10-23).

### AI-MEMORY-INTEGRATION.32 — Hooks de captura no Devin e no Antigravity (com `finalize-session`)

**Próximo passo:** nenhum — cancelada (decisão A da .36).

- **Nível:** MEDIO — classificado (jev (confiança 0.83))
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** SIM
- **Fonte:** jev (confiança 0.83)
- **Descrição:** Aplicar nos dois e documentar o fechamento explícito do Antigravity (`ai-memory finalize-session`).
- **Arquivos:** `scripts/instalar-ai-memory.mjs`, `docs/AI-MEMORY-HOOKS.md`
- **Critérios de Aceitação:** Os dois capturam; sessão do Antigravity é fechada pelo comando; resultado registrado.
- **Depende de:** AI-MEMORY-INTEGRATION.30, AI-MEMORY-INTEGRATION.7, AI-MEMORY-INTEGRATION.36
- **Verificação:** cancelada, não executada: a decisão A da .36 deixa as outras IAs sem captura até nova ordem do usuário (2026-10-23).

### AI-MEMORY-INTEGRATION.33 — Hooks de captura no Kimi e no OpenCode (DeepSeek)

**Próximo passo:** nenhum — cancelada (decisão A da .36).

- **Nível:** MEDIO — classificado (jev (confiança 0.83))
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** SIM
- **Fonte:** jev (confiança 0.83)
- **Descrição:** Aplicar nos dois e conferir como o DeepSeek (via OpenCode) entra na captura.
- **Arquivos:** `scripts/instalar-ai-memory.mjs`, `docs/AI-MEMORY-HOOKS.md`
- **Critérios de Aceitação:** Kimi e OpenCode capturam; caminho do DeepSeek documentado.
- **Depende de:** AI-MEMORY-INTEGRATION.30, AI-MEMORY-INTEGRATION.7, AI-MEMORY-INTEGRATION.36
- **Verificação:** cancelada, não executada: a decisão A da .36 deixa as outras IAs sem captura até nova ordem do usuário (2026-10-23).

### AI-MEMORY-INTEGRATION.34 — Auditoria de captura do Claude Code: respeita `ignore_paths` e não vaza segredo

**Próximo passo:** nenhum — entregue.

- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** sinais
- **Descrição:** Rodar a auditoria e o teste de invariante com eventos do Claude Code (única IA com captura, decisão A da .36).
- **Arquivos:** `scripts/ai-memory-auditar.mjs`, `scripts/testes/ai-memory-invariantes.mjs`
- **Critérios de Aceitação:** Nenhuma IA grava caminho proibido nem segredo; achados corrigidos antes dos clones.
- **Depende de:** AI-MEMORY-INTEGRATION.13, AI-MEMORY-INTEGRATION.14
- **Entrega:** auditoria por `ai-memory hook --check-capture` (nenhum arquivo alterado), feita por w-a12 (Sonnet 5.5, herdr w2:pR, conta B); decisão do usuário em 2026-10-23 12:19.
- **Verificação:** caminhos e comandos proibidos com `disposition=drop`; o único vazamento (segredo digitado no prompt, `user-prompt-submit` = keep) fica resolvido pela decisão A do usuário: o piloto não captura `UserPromptSubmit`. A aplicação no instalador é a .45.
- **Anotação (2026-10-23 12:14, w-a12 Sonnet 5.5, herdr w2:pR):** `ai-memory hook --check-capture` com o marker do instalador numa pasta temporária: 9 caminhos proibidos e 3 comandos Bash com `disposition=drop` (até `ls src`: o Bash parece cair inteiro); `src/app.js` e `docs/x.md` ficam só com metadados; `post-tool-use` sobre `.env` também cai. **Achado:** `user-prompt-submit` com texto `sk-FAKE…` sai com `disposition=keep`: o ai-memory não filtra segredo digitado no prompt (o `ignore_paths` só cobre caminhos). Opções: (A) não ligar a captura de `UserPromptSubmit` no piloto; (B) aceitar o risco e contar com a auditoria periódica; (C) investigar redação própria do ai-memory. Nenhum arquivo alterado.

### AI-MEMORY-INTEGRATION.35 — Piloto no `aulasenai`: proteger `scripts/variaveis.js` (service_role) e dados de alunos antes de ligar

**Próximo passo:** nenhum — entregue.

- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** sinais
- **Descrição:** Conferir `ignore_paths` do projeto real e rodar a auditoria só na pasta base antes de liberar os clones.
- **Arquivos:** `aulasenai/.ai-memory.toml`, `docs/AI-MEMORY-PRIVACIDADE.md`, `scripts/instalar-ai-memory.mjs` (só `MATERIAIS/`, decisão do líder)
- **Critérios de Aceitação:** Auditoria da pasta base sem achados; `variaveis.js`, `MATERIAIS/` e listas de alunos fora da memória.
- **Depende de:** AI-MEMORY-INTEGRATION.6, AI-MEMORY-INTEGRATION.20
- **Entrega:** seção 6 "Proteção do piloto aulasenai" em docs/AI-MEMORY-PRIVACIDADE.md e MATERIAIS/** + **/MATERIAIS/** no IGNORE_PATHS de scripts/instalar-ai-memory.mjs (commit desta entrega), feito por w-a3 (Sonnet 5.5, herdr w2:pP, conta B). O aulasenai/.ai-memory.toml é gravado na .16.
- **Verificação:** --dry-run no aulasenai gera o marker com variaveis.js (3 formas), .env*, MATERIAIS/, listas de alunos, currículos, chamada, matrícula, notas, pdf/docx/xlsx e CPF/RG; git check-ignore confirma variaveis.js ignorado no aulasenai; auditoria do wiki: 4 páginas, 0 achados; teste de invariante sai 0 (conferido pelo líder); variaveis.js não foi lido. Pendência: a service_role continua no disco e precisa de rotação; segredo colado no prompt é a decisão da .34.

### AI-MEMORY-INTEGRATION.36 — Decidir a captura nas IAs sem escopo por projeto

**Próximo passo:** nenhum — decidido.

- **Nível:** Usuário — só o usuário decide
- **Modelo:** Usuário
- **Effort:** — (decisão do usuário)
- **Descrição:** a .30 mostrou que só o Claude Code aceita `--scope project`. Nas demais IAs o hook fica na configuração global do usuário e, sem `.ai-memory.toml`, o repositório é capturado por padrão (inclusive pastas fora de `C:/fontes`). Opções: (A) capturar só o Claude Code por enquanto; (B) ligar as outras IAs com `install-hooks --capture-mode allowlist` (captura só repositórios com `.ai-memory.toml`); (C) ligar global sem allowlist (não recomendado).
- **Critérios de Aceitação:** uma opção escolhida e registrada em Decisões da etapa.
- **Depende de:** Nenhuma
- **Verificação:** decisão A registrada pelo usuário em 2026-10-23 11:02 (captura só do Claude Code por enquanto).

### AI-MEMORY-INTEGRATION.37 — Escolher o modo de captura das outras IAs (allowlist recomendado) e liberar o uso de hooks em todas

**Próximo passo:** ⛔ movida para a AI-MEMORY-ROLLOUT-2.2 ([ETAPA-041](ETAPA-041-71e89003-AI-MEMORY-ROLLOUT-2.md)) em 2026-10-23 12:37.

- **Nível:** Usuário — só o usuário decide
- **Modelo:** Usuário
- **Effort:** — (decisão do usuário)
- **Descrição:** O usuário quer hooks em todas as IAs. A .30 mostrou que só o Claude Code tem escopo por projeto; nas outras o hook é global. Escolher: (B) `install-hooks --capture-mode allowlist`, que só captura repositórios com `.ai-memory.toml` (recomendado); ou (C) global sem filtro (não recomendado). Registrar a escolha em Decisões.
- **Critérios de Aceitação:** Modo escolhido e registrado em Decisões da etapa.
- **Verificação:** a preencher na entrega.

### AI-MEMORY-INTEGRATION.38 — Hooks de captura no Codex e no Gemini CLI

**Próximo passo:** ⛔ movida para a AI-MEMORY-ROLLOUT-2.3 ([ETAPA-041](ETAPA-041-71e89003-AI-MEMORY-ROLLOUT-2.md)) em 2026-10-23 12:37.

- **Nível:** MEDIO — classificado (jev (confiança 0.80))
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** SIM
- **Fonte:** jev (confiança 0.80)
- **Descrição:** Aplicar o instalador nos dois harnesses, respeitando o gancho do Jev, o `codex_hooks` do Codex e o modo escolhido na .37.
- **Arquivos:** `scripts/instalar-ai-memory.mjs`, `.codex/hooks.json`, configuração do Gemini CLI
- **Critérios de Aceitação:** Os dois capturam no piloto; reexecução não duplica; nenhum hook bloqueia a mensagem; só repositórios com `.ai-memory.toml` são capturados (se a .37 escolher allowlist).
- **Depende de:** AI-MEMORY-INTEGRATION.7, AI-MEMORY-INTEGRATION.37
- **Verificação:** a preencher na entrega.

### AI-MEMORY-INTEGRATION.39 — Hooks de captura no Devin e no Antigravity (com `finalize-session`)

**Próximo passo:** ⛔ movida para a AI-MEMORY-ROLLOUT-2.4 ([ETAPA-041](ETAPA-041-71e89003-AI-MEMORY-ROLLOUT-2.md)) em 2026-10-23 12:37.

- **Nível:** MEDIO — classificado (jev (confiança 0.85))
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** SIM
- **Fonte:** jev (confiança 0.85)
- **Descrição:** Aplicar nos dois e documentar o fechamento explícito do Antigravity (`ai-memory finalize-session --agent antigravity-cli`).
- **Arquivos:** `scripts/instalar-ai-memory.mjs`, `docs/AI-MEMORY-HOOKS-POR-IA.md`
- **Critérios de Aceitação:** Os dois capturam; a sessão do Antigravity é fechada pelo comando; resultado registrado.
- **Depende de:** AI-MEMORY-INTEGRATION.7, AI-MEMORY-INTEGRATION.37
- **Verificação:** a preencher na entrega.

### AI-MEMORY-INTEGRATION.40 — Hooks de captura no Kimi Code, no OpenCode e no DeepSeek (DSH)

**Próximo passo:** ⛔ movida para a AI-MEMORY-ROLLOUT-2.5 ([ETAPA-041](ETAPA-041-71e89003-AI-MEMORY-ROLLOUT-2.md)) em 2026-10-23 12:37.

- **Nível:** MEDIO — classificado (jev (confiança 0.85))
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** SIM
- **Fonte:** jev (confiança 0.85)
- **Descrição:** Aplicar nos três e conferir como o DeepSeek entra (harness DSH, `install-hooks --agent dsh`).
- **Arquivos:** `scripts/instalar-ai-memory.mjs`, `docs/AI-MEMORY-HOOKS-POR-IA.md`
- **Critérios de Aceitação:** Kimi, OpenCode e DSH capturam; o fechamento manual do DSH está documentado.
- **Depende de:** AI-MEMORY-INTEGRATION.7, AI-MEMORY-INTEGRATION.37
- **Verificação:** a preencher na entrega.

### AI-MEMORY-INTEGRATION.41 — Auditoria de captura das outras IAs: respeitam `ignore_paths` e não vazam segredo

**Próximo passo:** ⛔ movida para a AI-MEMORY-ROLLOUT-2.6 ([ETAPA-041](ETAPA-041-71e89003-AI-MEMORY-ROLLOUT-2.md)) em 2026-10-23 12:37.

- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** sinais
- **Descrição:** Rodar a auditoria e o teste de invariante com eventos de Codex, Gemini, Devin, Antigravity, Kimi, OpenCode e DSH. Confirmar o `ignore_paths` em Gemini, Devin e DSH, que a .30 deixou como não confirmado.
- **Arquivos:** `scripts/ai-memory-auditar.mjs`, `scripts/testes/ai-memory-invariantes.mjs`
- **Critérios de Aceitação:** Nenhuma IA grava caminho proibido nem segredo; os 3 pontos 'não confirmado' da .30 resolvidos.
- **Depende de:** AI-MEMORY-INTEGRATION.13, AI-MEMORY-INTEGRATION.14, AI-MEMORY-INTEGRATION.38, AI-MEMORY-INTEGRATION.39, AI-MEMORY-INTEGRATION.40
- **Verificação:** a preencher na entrega.

### AI-MEMORY-INTEGRATION.42 — Criar o repositório GitHub privado do wiki da memória e ligar o remoto

**Próximo passo:** ⛔ movida para a AI-MEMORY-ROLLOUT-2.7 ([ETAPA-041](ETAPA-041-71e89003-AI-MEMORY-ROLLOUT-2.md)) em 2026-10-23 12:37.

- **Nível:** Usuário — ação externa no GitHub e no computador do usuário (aberta pela .21, C26)
- **Modelo:** Usuário
- **Effort:** — (ação do usuário)
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** fechar o critério "remoto privado" da .21: o wiki é um repositório Git local; falta o remoto privado (passo a passo em `docs/AI-MEMORY-BACKUP.md`).
- **Critérios de Aceitação:** `git -C %LOCALAPPDATA%i-memory\wiki remote -v` mostra o repositório privado e o `git push` funciona; nenhum segredo no repositório (o `config.toml` não fica no wiki).
- **Depende de:** AI-MEMORY-INTEGRATION.21
- **Verificação:** a preencher na entrega.

### AI-MEMORY-INTEGRATION.43 — Corrigir o `ignore_paths` do instalador: formas da raiz e padrões de privacidade da .20

**Próximo passo:** nenhum — entregue.

- **Nível:** PESADO — segurança (vazamento de segredo e de dados de alunos); aberta pelo líder a partir do achado da .14 (C26)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** o `**/` do ai-memory exige ao menos uma pasta, então `variaveis.js`, `gabarito*/**`, `*gabarito*`, `*alunos*.csv`, `*alunos*.xlsx` e `*alunos*.json` na raiz do projeto vazam. Incluir as formas da raiz e os padrões extras propostos pela .20 (currículos, projetos-alunos, chamada, matrícula, notas etc.).
- **Arquivos:** `scripts/instalar-ai-memory.mjs` (e o teste só se a lista esperada mudar)
- **Critérios de Aceitação:** `node scripts/testes/ai-memory-invariantes.mjs` sai com código 0; nenhum padrão antigo some; marker já gravado continua sem ser sobrescrito.
- **Depende de:** AI-MEMORY-INTEGRATION.14, AI-MEMORY-INTEGRATION.20
- **Entrega:** IGNORE_PATHS de scripts/instalar-ai-memory.mjs com as formas da raiz e os padrões da .20, cerca de 61 padrões, abaixo do limite de 128 (commit desta entrega), feito por w-a13 (Sonnet 5.5, herdr w2:pS, conta B).
- **Verificação:** node --check ok; node scripts/testes/ai-memory-invariantes.mjs saiu 0 (conferido pelo líder); nenhum padrão antigo removido; marker existente não é sobrescrito. Desvio: **/*rg*.* virou rg.*, *-rg.*, *_rg.* (o original pegaria merge.js). Pendências: *.docx/*.xlsx ficam fora da captura em todo projeto; marker já gravado não se atualiza sozinho (nenhum foi gravado até agora); padrão com acento (currículo) não conferido no ai-memory.

### AI-MEMORY-INTEGRATION.44 — Gerar nova versão das regras depois da mudança da .19 em `memoria-ai.md`

**Próximo passo:** nenhum — entregue.

- **Nível:** MEDIO — mesmo trabalho da .12 (aberta pelo líder, C26)
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** a .19 mudou a seção "Sem memória" de `regras/memoria-ai.md`; os projetos só recebem a regra nova com versão nova.
- **Arquivos:** `VERSAO.md`, `dist/REGRAS-GLOBAIS.md`
- **Critérios de Aceitação:** `VERSAO.md` com versão nova e o código novo de `memoria-ai.md`; o piloto (.16) já pega essa versão.
- **Depende de:** AI-MEMORY-INTEGRATION.19
- **Entrega:** VERSAO.md na versão 2026-10-23-a7fe983a (commit desta entrega; dist/ fora do Git), feito por w-a12 (Sonnet 5.5, herdr w2:pR, conta B).
- **Verificação:** node scripts/sincronizar.mjs --aplicar; git diff da VERSAO.md (conferido pelo líder): só mudaram a versão (e9e33b9a -> a7fe983a) e o código de memoria-ai.md (67236a00849b5097 -> c9be07bdd8570bd9).

### AI-MEMORY-INTEGRATION.45 — Aplicar as decisões do usuário: instalador sem `UserPromptSubmit` e tirar o hook global

**Próximo passo:** nenhum — entregue.

- **Nível:** PESADO — configuração global de segurança (hooks da conta) e captura de segredo (aberta pelo líder, C26)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** decisão do usuário em 2026-10-23 12:19: (1) o piloto não captura o prompt digitado: `scripts/instalar-ai-memory.mjs --hooks` deixa de gravar `UserPromptSubmit` do ai-memory (o do Jev continua); (2) tirar o hook global: remover só as entradas do ai-memory de `%USERPROFILE%\.claude\settings.json` e de qualquer `.claude-conta*\settings.json` que as tenha, com cópia `.bak`, sem tocar nos outros hooks.
- **Arquivos:** `scripts/instalar-ai-memory.mjs`, `docs/AI-MEMORY-HOOKS.md`; fora do Git: `settings.json` globais (com `.bak`)
- **Critérios de Aceitação:** `--dry-run --hooks` no aulasenai lista só `SessionStart` e `PostToolUse` e não diz mais "global já entrega"; nenhum `settings.json` global cita `ai-memory`; os outros hooks globais iguais ao `.bak`; teste de invariante sai 0.
- **Depende de:** AI-MEMORY-INTEGRATION.34
- **Entrega:** scripts/instalar-ai-memory.mjs --hooks grava só SessionStart e PostToolUse; docs/AI-MEMORY-HOOKS.md atualizado (commit 67e8411); fora do Git: 9 entradas do ai-memory removidas de C:\Users\gelva\.claude\settings.json, com cópia settings.json.bak-ai-memory (as .claude-contaA a D não tinham). Feito por w-a7 (Sonnet 5.5, herdr w2:pQ, conta B).
- **Verificação:** node --check ok; teste de invariante código 0; --dry-run --hooks no aulasenai: adicionar SessionStart e PostToolUse, sem "global já entrega"; grep ai-memory = 0 em todos os settings.json globais; JSON válido; diff contra o .bak só com remoções (conferido pelo líder). Pendência: projeto que já tivesse UserPromptSubmit do ai-memory gravado não é limpo pelo instalador (nenhum tinha até agora).

### AI-MEMORY-INTEGRATION.46 — Cobrir `.mcp.json`, `laya/` e `dashboard-plataformas-de-ia/` no `ignore_paths`

**Próximo passo:** nenhum — entregue.

- **Nível:** PESADO — segurança (arquivo que pode ter chave, repositório aninhado); aberta pelo líder a partir do achado da .23 (C26)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** a .23 achou que o `ignore_paths` não cobre o `.mcp.json` (pode ter chave), o `laya/` (repositório Git aninhado) nem o `dashboard-plataformas-de-ia/` do `DASHBOARD-AI-PRINCIPAL`. O `.mcp.json` entra no instalador (vale para todo projeto); as duas pastas entram só no marker do dashboard.
- **Arquivos:** `scripts/instalar-ai-memory.mjs`, `DASHBOARD-AI-PRINCIPAL/.ai-memory.toml`
- **Critérios de Aceitação:** `ai-memory hook --check-capture` dá `drop` para `.mcp.json`, `laya/x` e `dashboard-plataformas-de-ia/x` no dashboard; teste de invariante sai 0; auditoria sem achados.
- **Depende de:** AI-MEMORY-INTEGRATION.23
- **Entrega:** '.mcp.json' e '**/.mcp.json' no IGNORE_PATHS do instalador (commit desta entrega) e no .ai-memory.toml do dashboard, com laya/** e dashboard-plataformas-de-ia/** (commit 5cd83ea  no dashboard-ai), feito por w-a13 (Sonnet 5.5, herdr w2:pS, conta B).
- **Verificação:** ai-memory hook --check-capture no dashboard: .mcp.json, laya/x.md e dashboard-plataformas-de-ia/x.md = drop; src/App.tsx = keep; teste de invariante código 0 e auditoria com 6 páginas e 0 achados (conferidos pelo líder); o conteúdo do .mcp.json não foi lido. O marker do aulasenai não tem .mcp.json, mas o aulasenai não tem esse arquivo.
