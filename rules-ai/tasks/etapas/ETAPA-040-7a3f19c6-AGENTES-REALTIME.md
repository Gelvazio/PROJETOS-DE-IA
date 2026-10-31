## Etapa 040-7a3f19c6 — AGENTES-REALTIME: `/api/agentes` e `/api/projetos` por Supabase Realtime

**Tarefa:** AGENTES-REALTIME · **Pedido em:** 2026-10-23 11:24 · **Criada por:** Claude Code (Sonnet 5.5) (local · main · rules-ai)
**Pedido:** "CRIE 1 TAREFA PRA FAZER ISSO, COM O MAXIMO DE SUB-TAREFAS POSSIVEIS: */api/agentes* PARA SUPABASE REALTIME"
**Objetivo:** a página "Agentes ao vivo" deixa de depender do servidor Python (`/api/agentes` e `/api/projetos`) e passa a receber o quadro por Supabase Realtime, sem perder o atraso configurável, os projetos e o fallback.

> 🟠 **Tarefa grande (`PESADO`)**: mexe em segurança (chaves, canal, secrets), em vários repositórios e em
> várias partes. O plano é esta etapa; a execução **só começa depois do "sim" do usuário** e com as
> **Perguntas abertas** fechadas (C34). Nada foi alterado além do quadro.

> ⚠️ **Sobreposição achada:** a ETAPA-031 (MIGRAR-AGENTES-BROADCAST, aprovada e em execução) já migra a
> mesma página para Supabase Realtime **Broadcast**, sem tabela. Esta tarefa foi escrita como
> **complemento** dela (pergunta 1, resposta recomendada **a**). Se a resposta for outra, o plano é
> reescrito e volta para aprovação.

### Contexto

- Hoje `agentes.js` consulta `GET /api/agentes` a cada 10 s e o menu consulta `GET /api/projetos`; as duas
  rotas vivem em `dashboard/servidor.py` e leem o `tasks/STATUS.md` do disco (`quadro_tarefas.py`).
- A regra `regras/quadro-de-tarefas.md` proíbe cópia da fila em tabela de banco: o `STATUS.md` é a fonte
  única. Por isso o plano usa **Broadcast** (transmite, não guarda). Usar tabela + `postgres_changes`
  exigiria uma exceção parecida com a C49 (pergunta 1, opção b).
- A 031 cobre: publicador Python, workflow, assinatura do canal na página, estado inicial e fallback
  (.1 a .5). Esta tarefa cobre o que sobra para tirar as duas rotas do servidor.

### Escopo

**Entra:** lista de projetos sem servidor; leitor do `STATUS.md` em JS; contrato estendido; privacidade e
autorização do canal; secrets; workflow para os outros repositórios; coalescer e ordenar mensagens;
página sem `setInterval`; indicador de conexão; reconexão; fallback; remover as duas rotas do
`servidor.py`; medições; documentação; rollback.

**Não entra:** tabela no Supabase (salvo pergunta 1-b); mudar o formato do `STATUS.md`; abrir navegador
(a conferência na tela é do usuário, `.29`).

### Critério de pronto

- A página "Agentes ao vivo" abre e anima sem o `servidor.py` rodando.
- `git grep "/api/agentes\|/api/projetos"` só aparece no fallback documentado (ou em nada, conforme a pergunta 4).
- `node spec/verificar-spec.mjs tasks/etapas/ETAPA-040-7a3f19c6-AGENTES-REALTIME.md` passa.
- Nenhuma chave secreta em arquivo versionado.

### Riscos

| Risco | Plano B |
|---|---|
| Duplicar o trabalho da MIGRAR-AGENTES-BROADCAST | Pergunta 1; as subtarefas citam a 031 como dependência e não refazem o publicador |
| Títulos de tarefas de outros projetos (ex.: `aulasenai`) saírem na nuvem | Pergunta 3; guardrail e teste de invariante (.8 e .9) |
| Chave secreta vazar no navegador ou no Git | .11, .22 e .23; chave secreta só em secrets do GitHub |
| Limite do plano gratuito do Realtime | .14 coalesce pushes; .25 mede a folga |
| `agentes.js`, `api.js` e `menu.js` editados por outras etapas ao mesmo tempo (020, 031) | Conferir o quadro antes de reservar; `git pull --rebase` antes de cada push |
| Parser JS diferente do Python | .6 compara os dois em todos os quadros |

### Requisitos

> Formato EARS.

| ID | Requisito (EARS) | Cobre | Verificação |
|----|------------------|-------|-------------|
| R1.1 | QUANDO um `tasks/STATUS.md` liberado for enviado ao GitHub, O SISTEMA DEVE publicar o quadro no canal do projeto em até 10 s | AGENTES-REALTIME.24 | script de latência da .24 |
| R1.2 | QUANDO a página abrir sem o `servidor.py`, O SISTEMA DEVE mostrar o estado atual do quadro lido do GitHub | AGENTES-REALTIME.5, AGENTES-REALTIME.19 | leitura do código e conferência do usuário (.29) |
| R2.1 | O SISTEMA DEVE enviar ao canal só os campos `tarefa`, `titulo`, `pai`, `mae`, `nivel`, `status`, `agente`, `desde`, `progresso`, `global`, `indice`, e os metadados do envelope `versao`, `projeto`, `atualizado_em`, `commit`, `publicado_em`, `sequencia`, `atraso_padrao`, `intervalo` | AGENTES-REALTIME.8, AGENTES-REALTIME.9 | script de invariante da .9 |
| R2.2 | SE o projeto estiver em `DEMAIS-PROJETOS-*`, ENTÃO O SISTEMA DEVE não listar, ler nem publicar | AGENTES-REALTIME.8, AGENTES-REALTIME.9 | script de invariante da .9 |
| R3.1 | QUANDO o canal cair, O SISTEMA DEVE mostrar "reconectando" e, ao voltar, reler o estado completo | AGENTES-REALTIME.17, AGENTES-REALTIME.18 | leitura do código |
| R3.2 | SE chegar mensagem com `sequencia` menor ou igual à atual, ENTÃO O SISTEMA DEVE descartá-la | AGENTES-REALTIME.14, AGENTES-REALTIME.18 | leitura do código |
| R4.1 | O SISTEMA DEVE manter a chave secreta apenas em secrets do GitHub e em variável de ambiente | AGENTES-REALTIME.11, AGENTES-REALTIME.23 | `git grep` de padrões de chave vazio |
| R5.1 | ONDE o `servidor.py` seguir existindo, O SISTEMA DEVE responder 404 a `/api/agentes` e `/api/projetos`, salvo se a pergunta 4 mandar manter como fallback | AGENTES-REALTIME.20 | leitura do mapa de rotas |

**Fora do escopo (não-objetivos):** cópia da fila em tabela; mandar dados de volta do Supabase para o
`STATUS.md`; mudar regras de reserva.

### Invariantes

| ID | Regra que vale sempre | Domínio da entrada | Como conferir | Teste automatizado |
|----|----------------------|--------------------|---------------|--------------------|
| INV-1 | O payload tem só os campos permitidos em R2.1 | todo `STATUS.md` liberado | script da .9 | sim: script da .9 |
| INV-2 | Nenhum projeto de `DEMAIS-PROJETOS-*` aparece no payload nem em `projetos.json` | todas as pastas de `C:\fontes` | script da .9 | sim: mesmo script |
| INV-3 | Nenhuma chave secreta em arquivo versionado nem no HTML | todos os arquivos versionados | `git grep -n -E "service_role\|sb_secret_\|SUPABASE_SERVICE\|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\."` vazio | não: conferência por comando |
| INV-4 | O leitor JS devolve o mesmo resultado que `quadro_tarefas.py` | todos os `STATUS.md` liberados | script da .6 | sim: script da .6 |
| INV-5 | Todo `import`, `href` e `src` local dos `.html` e `.js` restantes aponta para arquivo que existe | todos os `.html` e `.js` de `dashboard/` | script temporário na pasta da sessão (fora do repositório), descrito na Verificação da .30 | não: conferência por comando |

**Casos de borda que o código precisa sobreviver:** `STATUS.md` sem a coluna "Modelo"; projeto sem quadro;
canal fora do ar na abertura; mensagem duplicada; dois pushes em menos de 2 s; repositório privado.

### Perguntas abertas

| # | Pergunta | Resposta | Fechada em | Quem respondeu |
|---|----------|----------|------------|----------------|
| 1 | A ETAPA-031 (MIGRAR-AGENTES-BROADCAST, aprovada) já migra a página por Broadcast. **a)** esta tarefa a **complementa** e cuida do que sobra de `/api/agentes` e `/api/projetos` (recomendado); **b)** esta tarefa a **substitui** por tabela + `postgres_changes` (exige exceção à regra "sem cópia da fila em tabela de banco" e cancela a 031); **c)** cancelar esta tarefa? | ✅ **a)** complementa a MIGRAR-AGENTES-BROADCAST | 2026-10-23 13:09 | Usuário ("faça tudo recomendado"); 5 e 6 alinhadas à ETAPA-031 pelo líder |
| 2 | O canal é **a)** público (quem tem a chave publicável vê os títulos das tarefas liberadas) ou **b)** privado, com login? | ✅ **a)** público (chave publicável; só títulos de tarefas liberadas) | 2026-10-23 13:09 | Usuário ("faça tudo recomendado"); 5 e 6 alinhadas à ETAPA-031 pelo líder |
| 3 | Quais projetos publicam: **a)** só o `rules-ai` (recomendado para começar) ou **b)** todos os de `C:\fontes` com quadro, menos `DEMAIS-PROJETOS-*` (os títulos do `aulasenai` podem ter dados pedagógicos)? | ✅ **a)** só o `rules-ai`, para começar | 2026-10-23 13:09 | Usuário ("faça tudo recomendado"); 5 e 6 alinhadas à ETAPA-031 pelo líder |
| 4 | O `servidor.py` depois disso: **a)** aposentado (basta `python -m http.server`); **b)** mantido só como fallback local; **c)** mantido só para arquivos estáticos? | ✅ **a)** aposentado (basta `python -m http.server`) | 2026-10-23 13:09 | Usuário ("faça tudo recomendado"); 5 e 6 alinhadas à ETAPA-031 pelo líder |
| 5 | O Supabase é **a)** um projeto novo e dedicado (recomendado: não mistura com os dados de alunos do `aulasenai`) ou **b)** um projeto existente? | ✅ **b)** projeto existente **AULAS SENAI** (`hxlvonriearllcmfqeri`), só o canal de Broadcast, sem tabela nem dado — igual à decisão do usuário de 2026-10-20 08:35 na ETAPA-031 (a recomendação "projeto novo" foi trocada para não contradizer a 031) | 2026-10-23 13:09 | Usuário ("faça tudo recomendado"); 5 e 6 alinhadas à ETAPA-031 pelo líder |
| 6 | A página roda **a)** só no seu computador ou **b)** também hospedada (Vercel, GitHub Pages)? | ✅ **b)** hospedada na Vercel, igual à pergunta 4 da ETAPA-031 (a resposta "só no computador" foi trocada para não contradizer a 031) | 2026-10-23 13:09 | Usuário ("faça tudo recomendado"); 5 e 6 alinhadas à ETAPA-031 pelo líder |

### Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-23 11:24 | Registrada como tarefa grande (`PESADO`, spec C34), com 31 subtarefas; execução só depois das perguntas fechadas e do "sim". Escrita como complemento da ETAPA-031 | Claude Code (Sonnet 5.5) | Banco/segurança/várias partes; a 031 já cobre parte do caminho |
| 2026-10-23 11:24 | Níveis e modelos propostos pela matriz e pelos sinais; `JEV-AI-SUGGESTION: NAO` em todas até rodar `node scripts/jev.mjs classificar` | Claude Code (Sonnet 5.5) | O Jev não foi rodado nesta sessão |
| 2026-10-23 13:09 | **"Sim" ao plano:** o usuário respondeu "faça tudo recomendado". Perguntas fechadas: 1-a, 2-a, 3-a, 4-a; 5 e 6 seguem as decisões do usuário na ETAPA-031 (projeto AULAS SENAI e Vercel). Também autorizou liberar a reserva parada da MIGRAR-AGENTES-BROADCAST.1 e usar a conta D na equipe herdr | Usuário (registrado pelo líder Opus 5.5) | Destrava a execução (C34) |
| 2026-10-23 13:25 | Ajustes da conferência da .2 (achados do agente h1): R2.1/INV-1 passam a listar os metadados do envelope (`projeto`, `commit`, `publicado_em`, `sequencia`, `atraso_padrao`, `intervalo`) que a .4 e a .14 exigem; INV-3 com os padrões exatos do `git grep`; INV-5 com o script nomeado; linha solta das Decisões voltou para a tabela | Líder (Opus 5.5 · sargento) | Mudança material de requisito registrada (C34, regra 5); não muda o escopo |
| 2026-10-23 13:34 | Contrato: `atualizado_em` fica no evento `estado` (como na 031 e no publicador já entregue); R2.1 passa a citar `versao` e `atualizado_em` no envelope | Líder (Opus 5.5 · sargento) | Evita mexer na 031 e no publicador; nada depende de tirar o campo |
| 2026-10-23 15:45 | **A chave `FONTE_AGENTES` da `.28` não existe e não vai existir:** o seletor de fonte acabou sendo a própria `CANAL.chavePublicavel` do `config.js` (vazia = só o GitHub raw; preenchida = canal ao vivo com o raw como reserva), e o servidor local foi apagado na `.21`. A `.28` passa a documentar o rollback real (esvaziar a chave; `git revert` do commit da `.21` para trazer o servidor de volta; tirar o secret ou desligar o workflow para parar de publicar). Mudança material registrada (C34, regra 5) | Líder (Opus 5.5 · sargento) | Criar a variável só para o rollback seria código novo sem uso; o rollback de verdade já existe sem ela |
| 2026-10-23 14:30 | **A `.24` foi dividida:** ela entrega o *instrumento* (script de medição, critério "script pronto e verificado") e a medição ponta a ponta virou a **`.33`**, que depende da `.12`. A `.30` passa a depender da `.33`. Mudança material de critério registrada (C34, regra 5) | Líder (Opus 5.5 · sargento) | Sem a chave publicável da `.12` (ação do usuário) não existe canal para medir; deixar a `.24` aberta travaria a `.29` sem motivo |

### AGENTES-REALTIME.1 — Fechar as 6 perguntas abertas e aprovar o plano

**Próximo passo:** nenhum — entregue.

- **Nível:** Usuário — só o usuário pode fazer (resposta, conta ou conferência na tela)
- **Modelo:** Usuário — nunca outro
- **Effort:** — (ação do usuário)
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Responder as perguntas 1 a 6 da etapa e dar o "sim" ao plano.
- **Critérios de Aceitação:** Nenhum `⬜` em Perguntas abertas; "sim" registrado em Decisões.
- **Depende de:** Nenhuma
- **Entrega:** respostas e "sim" do usuário em 2026-10-23 13:09 (tabela Perguntas abertas e Decisões).
- **Verificação:** nenhum `⬜` em Perguntas abertas; "sim" nas Decisões.

### AGENTES-REALTIME.2 — Fechar a spec e rodar o gate `verificar-spec.mjs`

**Próximo passo:** nenhum — entregue.

- **Nível:** LEVE — só texto, configuração simples ou comando de fechamento
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Conferir Requisitos, Invariantes e Perguntas da etapa e rodar `node spec/verificar-spec.mjs`.
- **Critérios de Aceitação:** Gate sai com código 0.
- **Depende de:** AGENTES-REALTIME.1

- **Entrega:** conferência da spec feita por h1 (Haiku 5.5, herdr w2:pY, conta D); os 4 ajustes apontados (R2.1/INV-1, INV-3, INV-5, linha solta das Decisões) foram aplicados pelo líder no commit f576817.
- **Verificação:** node spec/verificar-spec.mjs tasks/etapas/ETAPA-040-7a3f19c6-AGENTES-REALTIME.md saiu 0 antes e depois dos ajustes (conferido pelo líder).

### AGENTES-REALTIME.3 — Inventário do que ainda pede `/api/agentes` e `/api/projetos`

**Próximo passo:** nenhum — entregue.

- **Nível:** MEDIO — código com lógica em poucos arquivos, sem banco
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Listar no corpo da etapa cada arquivo e campo que consome as duas rotas (`tarefas`, `atualizado_em`, `projeto`, `atraso_padrao`, `intervalo`, `padrao`, `projetos`), com o plano de onde cada campo passa a vir.
- **Critérios de Aceitação:** Tabela campo → nova origem, sem campo órfão.
- **Depende de:** AGENTES-REALTIME.1

- **Entrega:** inventário campo → nova origem (abaixo), feito por sn1 (Sonnet 5.5, herdr w2:pZ, conta D).
- **Verificação:** leitura de dashboard/servidor.py, quadro_tarefas.py, config_graphs.py e dos consumidores em dashboard/assets/js (config.js, api.js, agentes.js, menu.js, fila-atrasada.js), README e .env.example; nenhum outro projeto de C:\fontes chama as rotas; todo campo tem nova origem (nenhum órfão).

#### Inventário AGENTES-REALTIME.3 (levantado em 2026-10-23, só leitura)

**Produtor das rotas:** `dashboard/servidor.py` (`do_GET`, linha 44: mapa de rotas; `rota_agentes` 61-66; `rota_projetos` 68-70), apoiado em `dashboard/quadro_tarefas.py` (`ler_quadro`, `listar_projetos`, `caminho_do_quadro`) e `dashboard/config_graphs.py` (`PROJETO_PADRAO`, `INTERVALO_COLETA_SEGUNDOS=10`, `atraso_agentes()` ← `ATRASO_AGENTES` do `.env`, padrão 30).

**Consumidores (único fora do servidor é o front do `dashboard/`; nenhum outro projeto de `C:\fontes` chama as rotas):**

| Arquivo | Linhas | O que faz com a rota |
|---|---|---|
| `dashboard/assets/js/config.js` | 4-6 | `ROTAS.agentes = '/api/agentes'` (constante) |
| `dashboard/assets/js/api.js` | 16-19 | `lerAgentes(projeto)` → `GET /api/agentes?projeto=<pasta>` |
| `dashboard/assets/js/agentes.js` | 14, 46-59, 77-98 | 1ª leitura + `setInterval(ler, intervalo*1000)`; usa `tarefas`, `intervalo`, `atraso_padrao`; mensagem de erro cita `servidor.py` e a rota (85-87) |
| `dashboard/assets/js/menu.js` | 7-9, 53-66, 77 | `fetch('/api/projetos')` → `padrao`, `projetos[{id,nome}]`; fallback `PROJETOS_PADRAO` |
| `dashboard/assets/js/agentes/fila-atrasada.js` | 14 | só comentário (`tarefas` "vindas de /api/agentes"); a lógica usa os campos das tarefas |
| `dashboard/README.md` | 4, 37, 40 | documentação das rotas (alvo da .26/.27) |
| `dashboard/index.html` | 17-18 | carrega `menu.js` e `agentes.js` (consumidores indiretos) |
| `dashboard/.env.example` | 3 | `ATRASO_AGENTES=30` (origem de `atraso_padrao`) |

**Tabela campo → nova origem (sem campo órfão):**

| Campo (rota) | Quem lê hoje | Origem atual | Nova origem | Subtarefa |
|---|---|---|---|---|
| `tarefas[]` (`tarefa`, `titulo`, `pai`, `mae`, `nivel`, `status`, `agente`, `desde`, `progresso`, `global`, `indice`) — `/api/agentes` | `agentes.js` (cena, fila, HUD via `cena-agentes.js`, `fila-atrasada.js`, `hud-agentes.js`, `personagens.js`) | `quadro_tarefas.ler_quadro` lê `tasks/STATUS.md` do disco | **Canal Broadcast `quadro:<projeto>`, evento `estado`** (031.1/.2/.3), mesmos 11 campos (R2.1). Estado inicial e reconexão: `STATUS.md` do **GitHub raw** lido por parser JS (.5, porta de `quadro_tarefas.py`; paridade .6) | .4, .5, .6, .8, .9, .15, .18 |
| `atualizado_em` — `/api/agentes` | **nenhum** (só devolvido; `agentes.js` não lê) | `st_mtime` do arquivo | Substituído por `publicado_em` + `commit` + `sequencia` no payload do canal (031.1; R3.2 descarta `sequencia` ≤ atual). Fallback raw: hora do `fetch`. Pode ser descartado na página | .4, .14, .18 |
| `projeto` — `/api/agentes` | **nenhum** (só devolvido; a página já sabe o `?projeto=` da URL, `agentes.js` linha 14) | eco do parâmetro | Nome do canal `quadro:<projeto>` (e campo `projeto` no payload, por conferência). Valor vem da URL, como hoje | .4, .15 |
| `atraso_padrao` — `/api/agentes` | `agentes.js` 94 → `ligarAtraso(padrao, ...)` (HUD) | `ATRASO_AGENTES` do `.env` (padrão 30) | **Constante em `assets/js/config.js`** (`ATRASO_PADRAO_SEGUNDOS = 30`); o seletor na tela já guarda o valor do usuário. `.env` deixa de ser lido (se a pergunta 4-a, `.env` aposentado na .21) | .15, .22 |
| `intervalo` — `/api/agentes` | `agentes.js` 58 (`setInterval`) | `INTERVALO_COLETA_SEGUNDOS = 10` | Some do fluxo normal (sem `setInterval`, .15). Fica só como constante `INTERVALO_FALLBACK_SEGUNDOS` no `config.js` para o fallback de 10 s (031.4) e o GitHub raw a cada 30 s (.19) | .15, .19 |
| `padrao` — `/api/projetos` | `menu.js` 53-55 (projeto marcado quando a URL não traz `?projeto`) | `PROJETO_PADRAO` = nome da pasta pai do dashboard (`rules-ai`) | Campo `padrao` do **`projetos.json` estático** (versionado, ao lado do dashboard); hoje `PROJETOS_PADRAO.padrao = 'rules-ai'` já existe no `menu.js` | .4, .7, .16 |
| `projetos[{id,nome}]` — `/api/projetos` | `menu.js` 53-56, 60-62 | varredura de `C:\fontes` (`listar_projetos`: pastas com `tasks/STATUS.md`, sem `DEMAIS-PROJETOS-*` e sem `.`) | **`projetos.json` estático**, gerado por script na publicação (varredura fica fora do navegador), só `rules-ai` por ora (pergunta 3-a), com guarda anti-`DEMAIS-PROJETOS-*` (INV-2). `nome` = `nome_do_projeto` (gerado no script, não no front) | .4, .7, .9, .16 |
| Erro `{"erro": ...}` + HTTP 400/404 (`executar`, `caminho_do_quadro`: projeto sem quadro / quadro ausente) | `api.js` 7 (`dados.erro`), `agentes.js` 85-90 | `ValueError` no servidor | Projeto fora de `projetos.json` → aviso na página; canal sem mensagem/`fetch` raw falho → estado "reconectando/offline" (.17); texto de `agentes.js` 86-87 (reiniciar `servidor.py`) é reescrito | .15, .17, .19 |
| Servidor em si (`servidor.py`, `config_graphs.py`, `.env`) | — | — | Aposentados (pergunta 4-a): basta `python -m http.server` | .20, .21, .22 |

**Conclusões / pendências para o líder:**
1. `atualizado_em` e `projeto` não têm leitor no front: não são órfãos de verdade, mas a .4 deve decidir se mantém no contrato (recomendado: manter `projeto`/`publicado_em`/`sequencia`/`commit`, descartar `atualizado_em`).
2. `intervalo` e `atraso_padrao` viram constantes do `config.js` (não vêm mais do servidor); decisão de nomes na .15/.22.
3. O contrato do canal da 031.1 ainda não foi fechado (reserva parada); a coluna "Nova origem" assume os nomes da 031 (`quadro:<projeto>`, evento `estado`, `commit`, `publicado_em`) e a `sequencia` desta etapa (R3.2).
4. `ROTAS.agentes` em `config.js` e `ROTA_PROJETOS` em `menu.js` devem sair; `INV-5` cobre links locais quebrados depois.

### AGENTES-REALTIME.4 — Contrato do canal estendido: lista de projetos, metadados e versão

**Próximo passo:** nenhum — entregue.

- **Nível:** PESADO — banco, segurança, segredo ou contrato entre várias partes
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Estender o contrato da MIGRAR-AGENTES-BROADCAST.1 para cobrir a lista de projetos, `atraso_padrao`, `intervalo` e o campo `sequencia`; sem criar tabela.
- **Critérios de Aceitação:** Contrato escrito na etapa e igual ao da 031 nos campos comuns.
- **Depende de:** AGENTES-REALTIME.3, MIGRAR-AGENTES-BROADCAST.1
- **Entrega:** contrato estendido (abaixo), feito por sn2 (Sonnet 5.5, herdr w2:p11, conta D).
- **Verificação:** comparação com as seções 3 a 7 do contrato da 031 e com o inventário da .3: campos comuns iguais. Decisão do líder em 2026-10-23 13:34: o atualizado_em **fica** no estado (o publicador da 031.2 já o envia e nada depende de tirá-lo), então o item 1 da seção 4 e a linha atualizado_em da seção 3 abaixo não se aplicam.

#### Contrato estendido (AGENTES-REALTIME.4)

> Fechado em 2026-10-23 por Claude Code (Sonnet 5.5), executor da equipe herdr. **Só acrescenta** à
> seção "Contrato do canal" da ETAPA-031 (.1): projeto, chaves, canal `quadro:<projeto>`, evento
> `estado`, forma de envio e segurança continuam como lá. Nenhuma tabela; só Broadcast.

##### 1. Campos comuns (idênticos à 031, seção 3)

`versao`, `projeto`, `atraso_padrao`, `intervalo`, `commit`, `publicado_em`, `sequencia` e `tarefas[]`
(11 campos: `tarefa`, `titulo`, `pai`, `mae`, `nivel`, `status`, `agente`, `desde`, `progresso`,
`global`, `indice`) mantêm tipo, origem e regra da 031. Resumo do que a ETAPA-040 usa:

| Campo | Onde | Regra (igual à 031) |
|---|---|---|
| `versao` | `estado` e `projetos` | inteiro, começa em `1`; a página ignora versão que não conhece |
| `sequencia` | `estado` e `projetos` | `GITHUB_RUN_NUMBER`; a página descarta `sequencia` ≤ última aplicada (R3.2); `0` em `--simular` e no estado inicial lido do GitHub raw |
| `atraso_padrao` | `estado` | inteiro (s), 30; a página lê do payload, com a constante `ATRASO_PADRAO_SEGUNDOS` do `config.js` como reserva |
| `intervalo` | `estado` | inteiro (s), 10; só serve ao fallback (031.4); sem `setInterval` no fluxo normal |

##### 2. Evento `projetos` (canal `quadro:_indice`)

Mesma forma da seção 4 da 031; aqui ficam as regras que ela deixou para a 040:

```json
{ "versao": 1, "padrao": "rules-ai", "publicado_em": "2026-10-23T16:10:05Z", "sequencia": 412,
  "projetos": [ { "id": "rules-ai", "nome": "Rules Ai" } ] }
```

| Campo | Tipo | Regra |
|---|---|---|
| `versao` | inteiro | `1` |
| `padrao` | texto | projeto marcado quando a URL não traz `?projeto`; precisa existir em `projetos[].id`; hoje `rules-ai` |
| `publicado_em` | texto ISO 8601 UTC | hora do envio |
| `sequencia` | inteiro | `GITHUB_RUN_NUMBER`; ordem própria do canal `_indice` (a página guarda uma última `sequencia` por canal, não uma global) |
| `projetos[]` | lista | só `id` e `nome`, **nenhum outro campo** (INV-1) |
| `projetos[].id` | texto | nome da pasta = sufixo do canal `quadro:<id>`; nunca começa com `DEMAIS-PROJETOS-` nem com `.` (INV-2, C20/C23) |
| `projetos[].nome` | texto | gerado no publicador (nome da pasta com `-`/`_` → espaço e iniciais maiúsculas, como `listar_projetos`); a página não deriva |

- Hoje a lista tem só `rules-ai` (pergunta 3-a); quem gera é o script do publicador (.7), que lê os
  projetos liberados da configuração do repositório, **não** varre `C:\fontes` no runner.
- O mesmo conteúdo é versionado em `projetos.json` (mesmos campos, sem `sequencia`/`publicado_em`) ao lado
  do dashboard. Ele é o **estado inicial e o fallback**: o Broadcast não guarda histórico, então quem
  entra depois da mensagem lê o `projetos.json`, e a mensagem seguinte só vale com `sequencia` maior.
- Tamanho: ≈ 100 bytes por projeto, muito abaixo dos 256 KB.
- Envio: `POST …/api/broadcast/quadro%3A_indice/events/projetos` com `apikey` secreta, igual à seção 5 da
  031 (mesmo plano B de lote). Publicado no mesmo workflow, só quando a lista muda.

##### 3. O que sai do payload

| Campo | Decisão | Por quê |
|---|---|---|
| `atualizado_em` | **sai do `estado`** | nenhum leitor no front (inventário .3); `publicado_em` + `commit` + `sequencia` o substituem. O fallback raw usa a hora do `fetch` |
| `ROTAS`, erro `{"erro": …}` | não existem no canal | projeto fora de `projetos.json` → aviso na página; canal mudo → "reconectando/offline" (.17) |

`projeto` **fica** no `estado`: a página já sabe o `?projeto=`, mas o campo serve de conferência contra
mensagem enviada ao canal errado (a página descarta se `projeto` ≠ sufixo do canal).

##### 4. Diferenças em relação à 031

1. **`atualizado_em`:** a 031 (seção 3, exemplo e tabela) o mantém no `estado`; este contrato o remove.
   Ação: a 031 precisa tirar a linha do exemplo e da tabela, e o `git log -1 --format=%cI` do
   workflow (seção 5) deixa de ser necessário — `fetch-depth: 0` pode voltar ao padrão. Se o líder
   preferir não mexer na 031, é só manter o campo: nada mais neste contrato depende dele.
2. **`atraso_padrao`/`intervalo`:** a 031 já os leva no `estado`; aqui só se registra que a página também
   tem constantes de reserva no `config.js` (sem conflito).
3. **`projetos`:** a 031 só dá a forma e remete a geração à 040; este contrato fixa `padrao` obrigatório,
   `nome` gerado no publicador, `projetos.json` como estado inicial e `sequencia` por canal.
4. Segurança (canal público que também aceita envio, validação de `versao`/`projeto`/`sequencia`)
   inalterada; para `projetos`, a página também descarta `id` proibido ou fora de `projetos.json`.

##### 5. Conferência (para a Verificação da .4)

- Campos comuns do `estado` e da forma do `projetos`: `diff` visual com as seções 3 e 4 da 031 —
  iguais, salvo `atualizado_em` (item 1 acima).
- INV-1 (só campos permitidos) e INV-2 (nenhum `DEMAIS-PROJETOS-*`) valem para os dois eventos.

### AGENTES-REALTIME.5 — Leitor do `STATUS.md` em JavaScript (porta de `quadro_tarefas.py`)

**Próximo passo:** nenhum — entregue.

- **Nível:** MEDIO — código com lógica em poucos arquivos, sem banco
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Criar `assets/js/agentes/quadro.js` com o mesmo resultado do parser Python, para o estado inicial lido do GitHub sem servidor.
- **Critérios de Aceitação:** Mesmos campos e valores que o Python em todos os quadros (INV-4); `node --check`.
- **Depende de:** AGENTES-REALTIME.3
- **Entrega:** dashboard/assets/js/agentes/quadro.js, lerQuadro(texto) -> { tarefas } (commit desta entrega), feito por sn3 (Sonnet 5.5, herdr w2:p12, conta D).
- **Verificação:** node --check ok; comparação JS × Python (quadro_tarefas.ler_quadro) no tasks/STATUS.md do rules-ai: IGUAL 85 85 (rodada de novo pelo líder); linhas ≤ 100. Os outros quadros ficam para a .6.

### AGENTES-REALTIME.6 — Invariante de paridade: parser JS igual ao Python

**Próximo passo:** nenhum — entregue.

- **Nível:** PESADO — banco, segurança, segredo ou contrato entre várias partes
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Script de comparação que roda os dois parsers em todos os `tasks/STATUS.md` de `C:\fontes` (sem as pastas proibidas) e lista as diferenças. Teste de invariante permitido em PESADO.
- **Critérios de Aceitação:** INV-4 sem diferença; comando registrado na Verificação.
- **Depende de:** AGENTES-REALTIME.5
- **Entrega:** dashboard/testes/invariante_paridade_quadro.py (teste de invariante INV-4, C34; commit desta entrega), feito por sn3 (Sonnet 5.5, herdr w2:p12, conta D).
- **Verificação:** python -B dashboard/testes/invariante_paridade_quadro.py: ok nos 15 casos (14 de borda + liberado:rules-ai), "INV-4: sem diferença", código 0 (rodado de novo pelo líder). Achado: quadro_tarefas.py lança IndexError com linha mais curta que a coluna Tarefa (o JS não); aberta a .32. Dígitos Unicode não testados.

### AGENTES-REALTIME.7 — Lista de projetos sem `/api/projetos`

**Próximo passo:** nenhum — entregue.

- **Nível:** MEDIO — código com lógica em poucos arquivos, sem banco
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** O publicador gera o `projetos.json` (id e nome de cada projeto com quadro, sem `DEMAIS-PROJETOS-*`) e a página lê dele; `PROJETOS_PADRAO` fica como último recurso.
- **Critérios de Aceitação:** Menu de projetos monta sem o servidor Python.
- **Depende de:** AGENTES-REALTIME.4
- **Entrega:** dashboard/gerar_projetos.py (gera a lista só dos projetos liberados, sem DEMAIS-PROJETOS-* nem pastas com ponto; --verificar) e dashboard/projetos.json (commit desta entrega), feito por sn2 (Sonnet 5.5, herdr w2:p11, conta D).
- **Verificação:** python -B dashboard/gerar_projetos.py --verificar: "em dia", código 0; projetos.json com padrao rules-ai e só id/nome (contrato da .4) (conferido pelo líder). O menu passa a ler o projetos.json na .16, que depende desta; o publicador pode importar montar_lista() para o evento projetos.

### AGENTES-REALTIME.8 — Guardrail de privacidade no publicador

**Próximo passo:** nenhum — entregue.

- **Nível:** PESADO — banco, segurança, segredo ou contrato entre várias partes
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** O publicador só envia a lista de campos permitida, nunca pastas C20/C23, e passa o texto dos títulos pela redação de segredos/PII (`scripts/jev/redigir.mjs` ou equivalente) antes de enviar.
- **Critérios de Aceitação:** INV-1 e INV-2 valem; nenhum dado pessoal no payload de exemplo.
- **Depende de:** AGENTES-REALTIME.4, MIGRAR-AGENTES-BROADCAST.2
- **Entrega:** dashboard/privacidade_quadro.py (proteger_estado e proteger_indice: só campos permitidos, redige segredo e dado pessoal, recusa DEMAIS-PROJETOS-*) ligado em dashboard/publicar_quadro.py antes de serializar, registrando só a contagem de achados (commit desta entrega), feito por op1 (Opus 5.5, herdr w2:pX, conta D).
- **Verificação:** invariantes_broadcast.py: 0 falhas; publicar_quadro.py --simular sai 0 com 9 campos no envelope, 82 tarefas e nenhum achado; conferência fora do repositório: 7 casos sensíveis mascarados (idempotente), 3 textos normais intactos, campos extras retirados (conferido pelo líder). O teste versionado das INV-1/INV-2 fica com a .9; o proteger_indice entra quando o evento projetos for publicado.

### AGENTES-REALTIME.9 — Teste de invariante do payload (campos e projetos permitidos)

**Próximo passo:** nenhum — entregue.

- **Nível:** PESADO — banco, segurança, segredo ou contrato entre várias partes
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Script que gera o payload de todos os quadros e confere INV-1 (só campos permitidos) e INV-2 (nenhum projeto proibido). Permitido em PESADO.
- **Critérios de Aceitação:** Comando passa e fica na Verificação.
- **Depende de:** AGENTES-REALTIME.8
- **Entrega:** dashboard/testes/invariante_payload_quadro.py (teste de invariante INV-1 e INV-2, C34; commit desta entrega), feito por op1 (Opus 5.5, herdr w2:pX, conta D).
- **Verificação:** python -B dashboard/testes/invariante_payload_quadro.py: 22 ok, 0 falhas, código 0 — rodado de novo pelo líder depois da mudança da .14 no publicador. Sem rede, sem gravar e sem imprimir títulos.

### AGENTES-REALTIME.10 — Autorização do canal (público ou privado) conforme a pergunta 2

**Próximo passo:** nenhum — entregue.

- **Nível:** PESADO — banco, segurança, segredo ou contrato entre várias partes
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Se privado: política em `realtime.messages` e login; se público: confirmar que só vai o que a pergunta 3 liberou e que a chave publicável não lê tabela alguma.
- **Critérios de Aceitação:** Resposta da pergunta 2 aplicada; nenhuma tabela exposta.
- **Depende de:** AGENTES-REALTIME.1, AGENTES-REALTIME.4
- **Entrega:** texto da autorização do canal público (abaixo), feito por sn3 (Sonnet 5.5, herdr w2:p12, conta D).
- **Verificação:** leitura do contrato da 031 (seções 1 a 7) e da 040; conferência do líder: nenhum .from(, .rpc( nem postgres_changes no JS do dashboard (só um Array.from em galhos.js, que não é do Supabase) e git grep de chave secreta vazio. Limite registrado: em canal público, mensagem bem-formada com sequencia alta não é barrada; o dano é só na tela até o próximo push.

#### Autorização do canal (AGENTES-REALTIME.10)

> Aplica a resposta **2-a** (canal público), fechada em 2026-10-23 13:09. Usa a seção 7 do contrato da
> MIGRAR-AGENTES-BROADCAST.1 (ETAPA-031) e o contrato da AGENTES-REALTIME.4. Nenhuma tabela é criada.

##### 1. O que "público" significa aqui

| Item | Situação |
|---|---|
| Canais | `quadro:rules-ai` (evento `estado`) e `quadro:_indice` (evento `projetos`), sem `private: true` |
| Quem ouve | qualquer um com a chave **publicável** `sb_publishable_…` (está no `config.js`, é pública por desenho) |
| Quem envia | o publicador, com a chave **secreta** `sb_secret_…` (só no secret `SUPABASE_SECRET_KEY` do GitHub). **Porém**, em canal público a chave publicável também consegue enviar: a RLS só vale para canal privado |
| Tabelas | **nenhuma** é criada nem lida. O Broadcast não grava nada; a chave publicável não dá acesso a tabela do `AULAS SENAI` por causa deste canal |
| Conteúdo | só os campos de R2.1 de tarefas liberadas do `rules-ai`: o mesmo que já é público no GitHub (pergunta 3-a). Nada de `aulasenai` (dados pedagógicos) nem de `DEMAIS-PROJETOS-*` (INV-1, INV-2) |

**Aceite:** a pergunta 2 está aplicada (público) e nenhuma tabela foi exposta. A conferência é por
leitura: `git grep` de INV-3 vazio; nenhum `from(`/`.rpc(`/`postgres_changes` em `dashboard/assets/js`.

##### 2. Como a página descarta mensagem falsa

Como qualquer um pode enviar, a página trata toda mensagem como não confiável. Em `aplicarEstado`
(e no equivalente de `projetos`), nesta ordem; qualquer falha **descarta em silêncio** (sem mexer na
tela, sem erro visível, no máximo `console.debug` sem o conteúdo):

1. `payload` é objeto e `versao` é a conhecida (`1`); outra versão é ignorada.
2. `projeto` do payload é igual ao sufixo do canal e consta em `projetos.json` (para `projetos`: cada
   `id` consta em `projetos.json`, não começa com `DEMAIS-PROJETOS-` nem com `.`).
3. Só chaves permitidas: o envelope (`versao`, `projeto`, `atualizado_em`, `atraso_padrao`,
   `intervalo`, `commit`, `publicado_em`, `sequencia`, `tarefas`) e os 11 campos de cada tarefa.
   Chave extra faz descartar a mensagem inteira (não só a chave).
4. Tipos certos: `sequencia`, `atraso_padrao`, `intervalo` e `progresso` inteiros; `mae` e `global`
   booleanos; `tarefas` é lista; textos com tamanho razoável (ex.: ≤ 500 caracteres) e sempre
   inseridos com `textContent`, **nunca** `innerHTML`.
5. `sequencia` maior que a última aplicada **daquele canal** (R3.2). Mensagem repetida ou antiga cai aqui.
6. `commit` com 40 caracteres hexadecimais (campo de conferência, não prova de origem).

**Limite honesto:** estas regras barram lixo, canal errado, versão antiga e repetição, mas **não** barram
um envio bem-formado com `sequencia` alta e tarefas inventadas; quem tem a chave publicável pode
publicá-lo e a página o mostraria até o próximo push real. Mitigações já previstas, sem custo:
a próxima publicação real do workflow tem `sequencia` do `GITHUB_RUN_NUMBER` e o estado é sempre o
quadro inteiro (nunca diferença), e o estado inicial/reconexão volta do GitHub raw, que é a fonte
de verdade. O dano máximo é cosmético e passageiro (títulos falsos na tela), sem vazar dado privado.

##### 3. O que mudaria se o usuário escolher canal privado depois (pergunta 2-b)

| Onde | Mudança |
|---|---|
| Supabase (painel, passo do usuário) | desligar **Allow public access** nas configurações do Realtime |
| Banco | política RLS em `realtime.messages`: `SELECT` (receber) só para usuário autenticado permitido; **sem** `INSERT` para `authenticated`/`anon`, de modo que só a chave secreta envie. Isso é política de autorização, não tabela de dados |
| Publicador (`publicar_quadro.py`) | acrescentar `?private=true` no POST (seção 5 da 031) ou `"private": true` no lote do plano B |
| Página (`agentes.js`, `agentes/canal.js`) | `supabase.channel('quadro:rules-ai', { config: { private: true } })` e login antes de assinar (`supabase.auth.signInWithPassword` ou link mágico); chamar `realtime.setAuth()` com o token; tratar "sem sessão" como estado próprio |
| Chave publicável | continua só como `apikey`; quem autoriza passa a ser o JWT do usuário |
| Hospedagem (Vercel) | a página passa a exigir login; o estado inicial pelo GitHub raw segue só se o repositório for público |
| Contrato | campos e eventos iguais; muda só o tipo do canal (linha "Tipo do canal" da seção 2 da 031) e a seção 7 |
| Subtarefas afetadas | .10 (refazer), .11 (sem novo segredo), .15/.17 (login e reconexão), .23 e .29 (conferência) |

O estado inicial pelo GitHub raw não depende do canal; por isso a mudança é isolada na assinatura e no envio.

### AGENTES-REALTIME.11 — Segredos do publicador: onde ficam e como rodam

**Próximo passo:** nenhum — entregue.

- **Nível:** PESADO — banco, segurança, segredo ou contrato entre várias partes
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Definir `SUPABASE_URL`, chave publicável e chave secreta: a secreta só em secrets do GitHub e em variável de ambiente local; nunca em arquivo versionado nem no HTML.
- **Critérios de Aceitação:** Lista de variáveis e de onde cada uma vive; INV-3.
- **Depende de:** AGENTES-REALTIME.4
- **Entrega (2026-10-23 17:06, Claude Code (Opus 5.5) (local · main · rules-ai)):** tabela de variáveis e regras da chave secreta (abaixo). Só documentação: nenhum código, workflow ou secret alterado.
- **Verificação:** leitura de `dashboard/publicar_quadro.py` (a chave vem só de `os.environ["SUPABASE_SECRET_KEY"]`; erros saem só com o código HTTP ou o tipo da exceção, nunca com a chave), de `.github/workflows/publicar-quadro.yml` (secret só no passo "Enviar", gatilho só `push` na `main`, `permissions: contents: read`, `persist-credentials: false`), de `dashboard/assets/js/config.js` (`chavePublicavel` vazia) e do `.gitignore` (`.env`, `.env.*` e `dashboard/.env` ignorados; `dashboard/.env` não existe). INV-3: `git grep -n -E "service_role|sb_secret_|SUPABASE_SERVICE|eyJ…"` só acha padrões de detecção e textos de teste (`privacidade_quadro.py`, `ai-memory-auditar.mjs`, benchmarks e testes do Jev); `git grep` de valor real (`sb_secret_` seguido de 10+ caracteres ou JWT) vazio.

#### Segredos do publicador (AGENTES-REALTIME.11)

> Vale para o projeto **AULAS SENAI** (`hxlvonriearllcmfqeri`, pergunta 5-b), canal público (2-a) e só o
> `rules-ai` publicando (3-a). Contrato e chaves seguem a seção 7 da ETAPA-031.

##### 1. Variáveis e onde cada uma vive

| Variável | Valor | É segredo? | Onde vive | Nunca em |
|---|---|---|---|---|
| `SUPABASE_URL` | `https://hxlvonriearllcmfqeri.supabase.co` | não | constante `URL_PADRAO` do `publicar_quadro.py` e `CANAL.url` do `config.js`; a variável de ambiente só serve para apontar para outro projeto (não cadastrar no GitHub hoje) | — |
| chave publicável | `sb_publishable_…` | não (pública por desenho) | `CANAL.chavePublicavel` em `dashboard/assets/js/config.js`, preenchida pelo usuário na .12 | — |
| `SUPABASE_SECRET_KEY` | `sb_secret_…` | **sim** | secret de Actions do repositório `Gelvazio/rules-ai` (Settings → Secrets and variables → Actions) → `env` só do passo "Enviar o quadro ao Broadcast"; no PC, só como variável da sessão do terminal para um teste manual | arquivo versionado, `dashboard/.env` (o publicador não lê `.env`), `config.js`, HTML, log, quadro, etapa, chat, variável de ambiente permanente do Windows |
| `ATRASO_AGENTES` | `30` | não | `dashboard/.env` (local, ignorado) ou `.env.example` | — |
| `GITHUB_RUN_NUMBER`, `GITHUB_SHA` | do Actions | não | fornecidas pelo runner (`sequencia` e `commit`) | — |

##### 2. Regras da chave secreta

1. **Chave nova e só desta função:** no painel do AULAS SENAI (Project Settings → API Keys → *Create new
   secret key*), nome `publicar-quadro-rules-ai`. ⛔ Nunca reaproveitar a `service_role` legada que está em
   `aulasenai\scripts\variaveis.js` (pendente de rotação): a `sb_secret_` nova pode ser revogada sozinha,
   sem derrubar o sistema de aulas.
2. **Privilégio:** toda `sb_secret_` tem acesso total ao banco do projeto (ignora a RLS), inclusive às
   tabelas de alunos. Por isso ela fica num único secret, num único passo e num workflow que roda só em
   `push` na `main` (sem `pull_request`, sem `workflow_dispatch` com entrada livre).
3. **Logs:** o Actions mascara o valor do secret; o publicador nunca o imprime. ⛔ Não acrescentar
   `set -x`, `env`, `printenv` nem `echo` de variável ao workflow.
4. **Teste local** (raro; o normal é `--simular`, que não precisa de chave):
   `$env:SUPABASE_SECRET_KEY = '<colar>'; python -B dashboard/publicar_quadro.py; Remove-Item Env:SUPABASE_SECRET_KEY`
   — no terminal, nunca em arquivo, nunca no chat da IA.
5. **Vazou ou suspeita:** revogar a chave no painel → criar outra → trocar o secret no GitHub. Nenhuma
   mudança de código.
6. **Outros repositórios (.13):** o workflow reutilizável recebe o secret por nome
   (`secrets: SUPABASE_SECRET_KEY: ${{ secrets.SUPABASE_SECRET_KEY }}`), nunca com `secrets: inherit`;
   cada repositório liberado cadastra o próprio secret. Hoje só o `rules-ai` (3-a).

##### 3. Alternativa para o usuário decidir na .12 (não aplicada)

Como o canal é **público** (.10), o endpoint de Broadcast também aceita envio com a chave **publicável**.
Usar a publicável no publicador tiraria do GitHub o único segredo com acesso total ao banco do AULAS
SENAI, sem piorar o canal (qualquer um com a publicável já pode enviar, .10 §2). Custo: muda a decisão
"chave secreta no publicador" da ETAPA-031 (seções 5 e 7) e o nome do secret; vira subtarefa nova se o
usuário escolher. Recomendação desta entrega: **manter a secreta** (decisão aprovada) até a .12, e o
usuário decide ao cadastrar.

##### 4. Para a .23 (auditoria)

- Fixar `actions/checkout@v4` por hash de commit (hoje por etiqueta).
- Repetir o INV-3 e conferir, com a chave publicável, que nenhuma tabela do AULAS SENAI é lida (`.10`).

### AGENTES-REALTIME.12 — Criar ou escolher o projeto Supabase e cadastrar os secrets

**Próximo passo:** seguir a seção "Segredos do publicador" da .11 (criar a chave nova e dedicada, cadastrar o secret `SUPABASE_SECRET_KEY` no `rules-ai`) e decidir a alternativa do item 3 dela.

- **Nível:** Usuário — só o usuário pode fazer (resposta, conta ou conferência na tela)
- **Modelo:** Usuário — nunca outro
- **Effort:** — (ação do usuário)
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Criar o projeto (pergunta 5), copiar a URL e a chave publicável para o `config`, e cadastrar a chave secreta só nos secrets do GitHub dos repositórios da pergunta 3.
- **Critérios de Aceitação:** Secrets cadastrados; nada colado no chat.
- **Depende de:** AGENTES-REALTIME.11

### AGENTES-REALTIME.13 — Workflow reutilizável para os outros repositórios

**Próximo passo:** esperar MIGRAR-AGENTES-BROADCAST.2, AGENTES-REALTIME.12.

- **Nível:** MEDIO — código com lógica em poucos arquivos, sem banco
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Transformar o workflow da 031 em reutilizável (`workflow_call`) e aplicar aos repositórios liberados na pergunta 3.
- **Critérios de Aceitação:** Cada repositório liberado tem o workflow chamando o central.
- **Depende de:** MIGRAR-AGENTES-BROADCAST.2, AGENTES-REALTIME.12

### AGENTES-REALTIME.14 — Coalescer pushes seguidos e ordenar mensagens

**Próximo passo:** nenhum — entregue.

- **Nível:** MEDIO — código com lógica em poucos arquivos, sem banco
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** No publicador, juntar pushes próximos em uma mensagem e numerar com `sequencia`, para a página descartar mensagem velha.
- **Critérios de Aceitação:** Duas gravações em 2 s geram uma mensagem; `sequencia` crescente.
- **Depende de:** AGENTES-REALTIME.4, MIGRAR-AGENTES-BROADCAST.2
- **Entrega:** dashboard/publicar_quadro.py usa GITHUB_RUN_NUMBER como sequencia (0 em --simular; sem ele e sem --simular sai 1) e .github/workflows/publicar-quadro.yml junta pushes seguidos com concurrency e cancel-in-progress (commit desta entrega), feito por sn2 (Sonnet 5.5, herdr w2:p11, conta D).
- **Verificação:** invariantes_broadcast.py 0 falhas; --simular com e sem GITHUB_RUN_NUMBER sai 0; workflow válido (yaml.safe_load) (conferido pelo líder). Não testado no Actions de verdade (medição na .24, ponta a ponta na .29). O descarte de sequencia menor ou igual na página é da .18.

### AGENTES-REALTIME.15 — Página sem o `setInterval` do servidor

**Próximo passo:** nenhum — entregue.

- **Nível:** MEDIO — código com lógica em poucos arquivos, sem banco
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Em `agentes.js`, tirar a consulta a cada 10 s à rota local; `atraso_padrao` e `intervalo` passam a vir do `config.js` e do canal.
- **Critérios de Aceitação:** `agentes.js` não chama `lerAgentes` em laço; `node --check`.
- **Depende de:** MIGRAR-AGENTES-BROADCAST.3, AGENTES-REALTIME.3
- **Entrega:** `dashboard/assets/js/config.js` troca `ROTAS` pelas constantes `ATRASO_PADRAO_SEGUNDOS` (30) e `INTERVALO_FALLBACK_SEGUNDOS` (10); `dashboard/assets/js/api.js` **apagado** (só tinha `lerAgentes`, virou código morto); `dashboard/assets/js/agentes.js` sem o import de `api.js`, com o GitHub raw como única fonte, o intervalo do `vigiarQuadro` vindo da constante, aviso quando o `?projeto=` não é o publicado e a mensagem de erro sem citar o `servidor.py` (commit desta entrega). Feito por sn1 (Sonnet 5.5, herdr w2:pZ, conta D).
- **Verificação:** `node --input-type=module --check` passa em `agentes.js` e `config.js`; `git grep -n "/api/agentes\|/api/projetos\|api\.js\|lerAgentes" -- dashboard/assets dashboard/index.html` vazio; as 4 linhas acima de 100 caracteres já existiam no `HEAD` anterior (conferido com `git show HEAD:…`), nenhuma nova (conferido pelo líder). O intervalo de 30 s do fallback é da `.19`; a conferência na tela é do usuário (`.29`).

### AGENTES-REALTIME.16 — Menu de projetos lê o `projetos.json`

**Próximo passo:** nenhum — entregue.

- **Nível:** MEDIO — código com lógica em poucos arquivos, sem banco
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** `menu.js` lê a lista de projetos do `projetos.json` e usa `PROJETOS_PADRAO` se falhar.
- **Critérios de Aceitação:** Menu abre sem `/api/projetos`.
- **Depende de:** AGENTES-REALTIME.7
- **Entrega:** dashboard/assets/js/menu.js lê o projetos.json (PROJETOS_PADRAO como último recurso) (commit desta entrega), feito por sn2 (Sonnet 5.5, herdr w2:p11, conta D).
- **Verificação:** node --check menu.js ok; linhas ≤ 100; projetos.json no formato que preencherProjetos espera (conferido pelo líder). Conferência na tela fica com o usuário (.29).

### AGENTES-REALTIME.17 — Indicador de conexão na tela (ao vivo, reconectando, offline)

**Próximo passo:** nenhum — entregue.

- **Nível:** MEDIO — código com lógica em poucos arquivos, sem banco
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Mostrar no HUD o estado do canal Realtime.
- **Critérios de Aceitação:** Três estados visíveis no código do HUD.
- **Depende de:** MIGRAR-AGENTES-BROADCAST.3
- **Entrega:** `dashboard/assets/js/agentes/hud-agentes.js` ganhou o mapa `CONEXAO` (`aovivo`, `reconectando`, `offline`), os textos de cada estado e `marcarConexao(estado)`, que escreve por `textContent` (regra da `.10`) e troca a classe do elemento; `dashboard/index.html` ganhou o `<p id="estado-conexao">` dentro do HUD, com `aria-live="polite"` e o padrão `offline`; `dashboard/assets/css/graphs.css` ganhou a classe e os três modificadores, e `dashboard/assets/css/base.css` o token `--cor-ao-vivo`; em `dashboard/assets/js/agentes.js`, o `criarFallback` passa a marcar `AO_VIVO` quando o canal conecta, `RECONECTANDO` na queda e `OFFLINE` quando a espera vence e o polling liga. Feito por sn2 (Sonnet 5.5, herdr w2:p11, conta D).
- **Verificação:** `node --input-type=module --check` ok nos três `.js`; `estado-conexao` aparece uma única vez no `index.html`; cor por token (`var(--cor-ao-vivo)`, `--cor-ativo`, `--cor-texto-suave`), nenhum hexadecimal novo solto; nenhuma linha acima de 100 caracteres criada (comparado com o `HEAD` anterior arquivo por arquivo; o `agentes.js` até perdeu uma). O caso "sem chave publicável" cai no padrão `offline` do próprio HTML, porque esse caminho não chama `marcarConexao` (conferido pelo líder). A conferência na tela é do usuário (`.29`).
- **Anotação:** entregue no mesmo commit da `.19` porque as duas mexeram em `agentes.js` em paralelo, em zonas combinadas (a `.19` no cabeçalho/`PADROES_RAW`, a `.17` no `criarFallback`), e os trechos ficaram intercalados no mesmo arquivo.

### AGENTES-REALTIME.18 — Reconexão com estado completo e descarte de mensagem fora de ordem

**Próximo passo:** nenhum — entregue.

- **Nível:** MEDIO — código com lógica em poucos arquivos, sem banco
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Ao reconectar, ler o estado inicial de novo e aplicar só mensagens com `sequencia` maior que a atual.
- **Critérios de Aceitação:** Leitura do código: reconectar não duplica nem perde animação.
- **Depende de:** AGENTES-REALTIME.14, AGENTES-REALTIME.15
- **Entrega:** `dashboard/assets/js/agentes/canal.js` — o estado da assinatura virou um objeto (`ultima`, `geracao`, `caiu`); ao voltar de uma queda, `reler()` busca o estado completo do GitHub raw e **só o aplica se a `geracao` não mudou** (se chegou mensagem do canal enquanto a leitura estava a caminho, a leitura é descartada e a `ultima` nunca é zerada); a validação ganhou os itens 3, 4 e 6 da lista da `.10` — `CAMPOS_ENVELOPE` (9 chaves), `CAMPOS_TAREFA` (11 chaves), chave extra reprova a mensagem inteira, tipos conferidos (`sequencia` inteiro, `mae`/`global` booleanos, texto ≤ 500), `commit` com 40 hexadecimais. `agentes.js` não precisou mudar (`criarAplicador` compara retratos, então reaplicar o mesmo estado gera diferença vazia). Commit desta entrega. Feito por sn1 (Sonnet 5.5, herdr w2:pZ, conta D).
- **Verificação:** `node --input-type=module --check` ok; harness fora do repositório (pasta da sessão) com o `mensagemValida` real contra o payload real do `publicar_quadro.py --simular`: 10 casos, todos como esperado — payload real com `sequencia` 412 **aceito**; `sequencia` igual ou menor **descartada** (R3.2); chave extra no envelope, chave extra na tarefa, `commit` fora de 40 hex, `projeto` errado, `versao` desconhecida, texto acima de 500 e `mae` não booleano **descartados**. Conferido também que o envelope do publicador tem exatamente as 9 chaves e as tarefas exatamente os 11 campos, com `mae`/`global` booleanos, `progresso` inteiro ou nulo e maior texto de 157 caracteres (conferido pelo líder). Nota: no `--simular` a `sequencia` é 0 de propósito (contrato da `.4`), por isso ela só é aceita a partir de 1, como no Actions.

### AGENTES-REALTIME.19 — Fallback sem Supabase e sem servidor (GitHub raw a cada 30 s)

**Próximo passo:** nenhum — entregue.

- **Nível:** MEDIO — código com lógica em poucos arquivos, sem banco
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Se o canal cai e não há servidor local, a página lê o `STATUS.md` do GitHub a cada 30 s com o leitor JS.
- **Critérios de Aceitação:** Fallback documentado e ativado só após a queda do canal.
- **Depende de:** MIGRAR-AGENTES-BROADCAST.4, AGENTES-REALTIME.5
- **Entrega:** `dashboard/assets/js/config.js` — `INTERVALO_FALLBACK_SEGUNDOS` passou de 10 para **30** (o 10 era o intervalo do servidor aposentado); `dashboard/assets/js/agentes.js` — o `intervalo` saiu do `PADROES_RAW` (ninguém mais o lê do payload) e o cabeçalho do arquivo não fala mais em servidor local; `dashboard/README.md` ganhou a seção "De onde vem o quadro (três modos)": canal ao vivo, fallback do GitHub raw a cada 30 s e sem rede, deixando escrito que não existe mais servidor Python para isso e que basta `python -m http.server`. Feito por sn1 (Sonnet 5.5, herdr w2:pZ, conta D).
- **Verificação:** `node --input-type=module --check` ok; por leitura, o polling de 30 s liga em **dois** caminhos — `ligarCanal` quando não há `CANAL.chavePublicavel`, e o `setTimeout` de `ATRASO_QUEDA_MS` (30 s) quando o canal está caído — e **para** em `criarFallback` assim que `conectado` volta a ser verdadeiro (`vigia.parar()` + `cancelar()`); `git grep "\.intervalo"` em `dashboard/assets` vazio (nenhum resto lendo o campo do payload); nenhuma linha acima de 100 caracteres criada, e o `README.md` perdeu uma das antigas (conferido pelo líder).
- **Anotação:** entregue no mesmo commit da `.17` (mesmo arquivo `agentes.js`, zonas combinadas e trechos intercalados).

### AGENTES-REALTIME.20 — Tirar `/api/agentes` e `/api/projetos` do `servidor.py` (conforme a pergunta 4)

**Próximo passo:** nenhum — entregue.

- **Nível:** MEDIO — código com lógica em poucos arquivos, sem banco
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Remover `rota_agentes` e `rota_projetos` e os imports de `quadro_tarefas`; o servidor devolve 404 nessas rotas ou é aposentado.
- **Critérios de Aceitação:** Resposta da pergunta 4 aplicada; `py_compile` ok.
- **Depende de:** AGENTES-REALTIME.15, AGENTES-REALTIME.16, AGENTES-REALTIME.19
- **Entrega:** `dashboard/servidor.py` sem `rota_agentes`, `rota_projetos`, o mapa de rotas do `do_GET`, o helper `executar`, o `do_POST` e o import de `quadro_tarefas`; do `config_graphs` sobrou só `HOST`, `PASTA_DASHBOARD` e `PORTA_PADRAO`. O que ficou é um servidor de arquivos estáticos com a guarda `caminho_proibido` (que **não** era das rotas: ela impede servir `.env`, `.py`, `.pyc`, ocultos e `__pycache__`). Apagar o arquivo é a `.21`. Commit desta entrega. Feito por sn1 (Sonnet 5.5, herdr w2:pZ, conta D).
- **Verificação:** `python -m py_compile dashboard/servidor.py` ok; `git grep -n "/api/agentes\|/api/projetos" -- dashboard/ ':!dashboard/README.md'` **vazio** (nenhum código cita as rotas); os três nomes importados existem no `config_graphs.py` (linhas 5, 8 e 9); nenhuma linha acima de 100 caracteres (conferido pelo líder).
- **Anotação:** achado para a `.21` — o `config_graphs.py` **não** é só do servidor: o `dashboard/publicar_quadro.py` importa dele `INTERVALO_COLETA_SEGUNDOS` e `atraso_agentes()` e usa os dois no envelope (`intervalo` e `atraso_padrao`). Apagar o `config_graphs.py` quebraria o publicador; a `.21` tem de mover esses dois valores antes.

### AGENTES-REALTIME.21 — Aposentar `servidor.py`, `config_graphs.py` e o `.env` do dashboard (se a pergunta 4 for a)

**Próximo passo:** nenhum — entregue.

- **Nível:** MEDIO — código com lógica em poucos arquivos, sem banco
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Se aposentado: apagar os arquivos e documentar `python -m http.server` (ou abrir `index.html`) como forma de ver a página. Se não, esta subtarefa é cancelada.
- **Critérios de Aceitação:** Nenhum arquivo órfão; INV-5 ok.
- **Depende de:** AGENTES-REALTIME.20
- **Entrega:** `dashboard/servidor.py` e `dashboard/config_graphs.py` **apagados**. Antes de apagar, os dois valores que o publicador tirava do `config_graphs` viraram constantes do próprio `dashboard/publicar_quadro.py` (`ATRASO_PADRAO_SEGUNDOS = 30` e `INTERVALO_FALLBACK_SEGUNDOS = 30`, que espelham o `assets/js/config.js`) — o campo `intervalo` **continua** no envelope, como o contrato da `.4` exige, só mudou de onde o número vem. `dashboard/testes/invariantes_broadcast.py` deixou de importar o `servidor` (o INV-2 passou a comparar o payload com a saída de `ler_quadro` mais `projeto`/`atraso_padrao`/`intervalo`). `dashboard/.env.example` perdeu o `ATRASO_AGENTES` (ninguém mais lê o `.env`) e ficou só com as variáveis do Supabase, que o medidor da `.24` usa. `dashboard/README.md`: "Como usar" passou a ser `python -m http.server 8080 --directory dashboard` e a lista de Arquivos trocou o servidor pelo publicador. Commit desta entrega. Feito por sn1 (Sonnet 5.5, herdr w2:pZ, conta D).
- **Verificação:** `git grep "config_graphs\|import servidor"` em `dashboard/` só acha a frase do README que diz que os dois foram aposentados; `python -m py_compile` passa em todos os `.py` de `dashboard/` e `dashboard/testes/`; os **três** testes de invariante passam — `invariantes_broadcast.py` e `invariante_payload_quadro.py` com "0 falha(s)" e `invariante_paridade_quadro.py` com "INV-4: sem diferença"; `publicar_quadro.py --simular` sai 0 com as **9** chaves do envelope e `atraso_padrao` 30 / `intervalo` 30; **INV-5** conferido por script na pasta da sessão (fora do repositório) que resolve todo `import`/`href`/`src` local dos `.html` e `.js` de `dashboard/`: **0 referência quebrada** (o `api.js` apagado na `.15` não deixou resto); a única linha acima de 100 caracteres do `publicar_quadro.py` já existia no `HEAD` anterior (conferido pelo líder).
- **Anotação:** o `dashboard/README.md` ainda cita `/api/agentes` na linha 4 e na linha 56 — de propósito: essa limpeza é da `.26`.

### AGENTES-REALTIME.22 — Variáveis e `.gitignore`: `.env.example` e `config.js`

**Próximo passo:** nenhum — entregue.

- **Nível:** MEDIO — código com lógica em poucos arquivos, sem banco
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Acrescentar `SUPABASE_URL` e a chave publicável (vazias) ao `.env.example`/`config.js`; a chave secreta só aparece em comentário "nunca aqui".
- **Critérios de Aceitação:** Nenhum valor real em arquivo versionado.
- **Depende de:** AGENTES-REALTIME.11
- **Entrega:** `dashboard/.env.example` ganhou a seção do Supabase Realtime com `SUPABASE_URL` (valor público do AULAS SENAI), `SUPABASE_PUBLISHABLE_KEY=` vazia (com a nota de que o valor de verdade vive no `config.js` e que esta variável só alimenta o `testes/medir_latencia.mjs`) e a `SUPABASE_SECRET_KEY` **só como comentário** "NUNCA aqui"; `dashboard/assets/js/config.js` com o comentário do `CANAL` reescrito pela tabela 1 da `.11` (o arquivo vai para o navegador, só entra o que é público; ⛔ a chave secreta nunca entra). O `.gitignore` não foi tocado porque já cobria `.env`, `.env.*` (com `!.env.example`) e `dashboard/.env`. Commit desta entrega. Feito por sn2 (Sonnet 5.5, herdr w2:p11, conta D).
- **Verificação:** INV-3 — `git grep -n -E "sb_secret_[A-Za-z0-9_-]{10,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\."` vazio (nenhum valor real de chave em arquivo versionado); `node --input-type=module --check` ok no `config.js`; nenhuma linha acima de 100 caracteres nos dois arquivos; `.gitignore` conferido nas linhas 69-71 e 155 (conferido pelo líder).

### AGENTES-REALTIME.23 — Auditoria de segredo e de exposição

**Próximo passo:** esperar AGENTES-REALTIME.10, AGENTES-REALTIME.22, AGENTES-REALTIME.13.

- **Nível:** PESADO — banco, segurança, segredo ou contrato entre várias partes
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** `git grep` por padrões de chave secreta, conferência de que a chave publicável não lê nenhuma tabela (consulta com ela) e advisors do Supabase.
- **Critérios de Aceitação:** Nenhum achado crítico; resultado na Verificação.
- **Depende de:** AGENTES-REALTIME.10, AGENTES-REALTIME.22, AGENTES-REALTIME.13

### AGENTES-REALTIME.24 — Medir a latência do `push` até o evento recebido

**Próximo passo:** nenhum — entregue (o instrumento). A medição ponta a ponta ficou na `.33`, que depende da chave da `.12`.

- **Nível:** MEDIO — código com lógica em poucos arquivos, sem banco
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Script Node que assina o canal e mede o tempo entre o push do `STATUS.md` e a mensagem, sem navegador.
- **Critérios de Aceitação:** Script pronto e verificado, com a meta de 10 s codificada. **A medição em si passou para a `.33`** (decisão do líder de 2026-10-23 14:30, registrada nas Decisões: sem a chave publicável da `.12`, que é ação do usuário, não existe canal para medir).
- **Depende de:** MIGRAR-AGENTES-BROADCAST.2, MIGRAR-AGENTES-BROADCAST.3
- **Entrega:** `dashboard/testes/medir_latencia.mjs` — assina `quadro:<projeto>` pelo WebSocket nativo do Node (sem pacote, sem navegador), calcula a latência de `publicado_em` até o recebimento, imprime `commit` e `sequencia`, aceita `--projeto`, `--tempo-limite` e `--json`, e sai 0 (mediu), 1 (tempo limite ou falha) ou 2 (falta configuração). A chave vem só de `SUPABASE_PUBLISHABLE_KEY` ou do `config.js`; nenhuma chave no arquivo (commit desta entrega). Feito por sn2 (Sonnet 5.5, herdr w2:p11, conta D).
- **Verificação:** `node --check dashboard/testes/medir_latencia.mjs` ok; rodado sem a chave, sai com código 2 e a mensagem que aponta a `.12`; nenhuma linha acima de 100 caracteres (conferido pelo líder, Node v24.16.0). ⚠️ A latência real **não** foi medida: falta a chave publicável (`.12`, 👀 do usuário) — por isso a `.33`.

### AGENTES-REALTIME.33 — Rodar a medição de latência ponta a ponta

**Próximo passo:** esperar a `.12` (o usuário cadastrar a chave publicável e o secret); depois rodar `node dashboard/testes/medir_latencia.mjs --tempo-limite 180` numa janela e dar push no `tasks/STATUS.md` na outra.

- **Nível:** MEDIO — roda o instrumento da `.24` e registra o número; sem banco e sem segredo novo (aberta pelo líder a partir da `.24`, C26)
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Com a chave publicável cadastrada, medir a latência do `push` até o evento recebido com o script da `.24` e registrar o número aqui (R1.1, meta de 10 s).
- **Critérios de Aceitação:** Latência medida e registrada na Verificação, com a data e o `sequencia`/`commit` da mensagem usada; se passar de 10 s, abrir o plano B (janela de coalescência ou plano Pro, `dashboard/LIMITES-REALTIME.md`).
- **Depende de:** AGENTES-REALTIME.12, AGENTES-REALTIME.24

### AGENTES-REALTIME.25 — Conferir os limites do plano Supabase contra a frequência de pushes

**Próximo passo:** nenhum — entregue.

- **Nível:** MEDIO — código com lógica em poucos arquivos, sem banco
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Comparar mensagens por segundo e por mês permitidas com os pushes reais dos projetos liberados.
- **Critérios de Aceitação:** Folga registrada ou plano B (coalescer mais).
- **Depende de:** AGENTES-REALTIME.14
- **Entrega:** `dashboard/LIMITES-REALTIME.md` — limites do Realtime com fonte (200 conexões e 100 mensagens/s no Free, 2 milhões de mensagens/mês pela página de cobrança), frequência real medida no histórico da `main` (364 commits que mexem no `STATUS.md` em 30 dias, pior dia 117, pico de 39 por hora e 7 em 2 minutos, com os comandos `git log` usados), a comparação e o plano B com gatilhos. **Veredito: cabe** — 0,18 % da cota mensal no pior dia repetido, 1,8 % com 10 pessoas na página. Commit desta entrega. Feito por sn3 (Sonnet 5.5, herdr w2:p12, conta D).
- **Verificação:** os fatos citados foram conferidos no repositório pelo líder: o workflow dispara só em `push` na `main` com `paths: [tasks/STATUS.md]`, tem `concurrency` com `cancel-in-progress` e o `sleep 3` da `.14`, e o `publicar_quadro.py` tem `LIMITE_BYTES = 200 * 1024`. O tamanho da mensagem é **medido**, não estimado: 19.219 bytes para 72 tarefas (JSON compacto, UTF-8), ≈ 7,3 % do limite de 256 KB — o líder repetiu a medição e achou 18.988 bytes para 71 tarefas, coerente. Fato e estimativa estão separados no texto, e dois itens ficaram marcados **não verificado** (se cada entrega a um assinante conta na cota mensal, e qual o plano do projeto AULAS SENAI — foi usado o Free, pior caso). As 4 linhas acima de 100 caracteres que sobraram são linhas de tabela Markdown.

### AGENTES-REALTIME.26 — Documentar o fluxo no `README.md` do dashboard

**Próximo passo:** nenhum — entregue.

- **Nível:** LEVE — só texto, configuração simples ou comando de fechamento
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Como configurar, variáveis, secrets, fallback e como voltar ao servidor local.
- **Critérios de Aceitação:** README descreve os três modos e não cita rota removida.
- **Depende de:** AGENTES-REALTIME.20
- **Entrega:** `dashboard/README.md` — abertura reescrita (o quadro vem do `STATUS.md` pelo canal de Broadcast ou pelo GitHub raw, e a lista de projetos do `projetos.json`); seção **Configurar** nova (chave publicável no `config.js`, da `.12`, e o secret `SUPABASE_SECRET_KEY` só no workflow, sem nenhum valor escrito); lista de **Arquivos** refeita, com `privacidade_quadro.py`, `gerar_projetos.py`, `projetos.json`, `LIMITES-REALTIME.md`, `testes/` (os 3 invariantes e o medidor) e o workflow, e sem `servidor.py`, `config_graphs.py` e `api.js`, que não existem mais. Os três modos já tinham entrado na `.19`. Commit desta entrega. Feito por h1 (Haiku 5.5, herdr w2:pY, conta D).
- **Verificação:** `git grep -n -e '/api/agentes' -e '/api/projetos' -- dashboard/` **vazio**; as 5 linhas acima de 100 caracteres são as mesmas do `HEAD` anterior, nenhuma nova; todos os arquivos citados na lista existem no disco e nenhum apagado é citado (conferido pelo líder).

### AGENTES-REALTIME.27 — Atualizar menções a `/api/agentes` em `AGENTS.md` e docs

**Próximo passo:** nenhum — entregue.

- **Nível:** LEVE — só texto, configuração simples ou comando de fechamento
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** `git grep "/api/agentes"` e ajustar o que ficou desatualizado (por exemplo a regra C31).
- **Critérios de Aceitação:** Só o fallback documentado cita a rota.
- **Depende de:** AGENTES-REALTIME.20
- **Entrega:** só texto de comentário e documentação: `dashboard/assets/js/agentes/canal.js` (linha 2) e `dashboard/assets/js/agentes/fila-atrasada.js` (JSDoc de `indexar`) não falam mais em `/api/agentes`, e o `AGENTS.md` (linha 35, seção da C31) passou a apontar `dashboard/index.html` no lugar de `dashboard/graphs/agentes.html`, pasta que não existe mais. Commit desta entrega. Feito por h1 (Haiku 5.5, herdr w2:pY, conta D).
- **Verificação:** `git grep -n -e '/api/agentes' -e '/api/projetos' -- .` não acha mais nada fora de `tasks/` (histórico), `scripts/jev/benchmarks/golden.jsonl` (dado de teste), `STATUS_PROJETO.md` (registro datado) e `dashboard/README.md` (que é da `.26`); `git grep "graphs/agentes.html"` fora de `tasks/` vazio; `node --input-type=module --check` ok nos dois `.js`; as 2 linhas acima de 100 caracteres do `fila-atrasada.js` já existiam no `HEAD` anterior; a C31 **não** descrevia o percentual como vindo da rota, só o caminho da página estava errado (conferido pelo líder). Nada da pasta `regras/` foi tocado.
- **Anotação:** a primeira rodada veio incompleta por erro meu na ordem (passei `git grep "a\|b"`, que o `git grep` não casa sem `-e`); refeito com `-e`.

### AGENTES-REALTIME.28 — Plano de rollback com a chave `FONTE_AGENTES`

**Próximo passo:** esperar AGENTES-REALTIME.19.

- **Nível:** LEVE — só texto, configuração simples ou comando de fechamento
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Documentar como voltar a `local` (servidor Python) ou `broadcast` sem apagar código.
- **Critérios de Aceitação:** Rollback descrito e conferível por leitura.
- **Depende de:** AGENTES-REALTIME.19

### AGENTES-REALTIME.29 — Conferir no navegador: abre sem servidor e anima ao dar push

**Próximo passo:** esperar a resposta do usuário.

- **Nível:** Usuário — só o usuário pode fazer (resposta, conta ou conferência na tela)
- **Modelo:** Usuário — nunca outro
- **Effort:** — (ação do usuário)
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** O usuário abre a página sem o `servidor.py`, dá push num `STATUS.md` liberado e confere a animação (a IA não abre navegador).
- **Critérios de Aceitação:** Página anima a mudança; indicador "ao vivo".
- **Depende de:** AGENTES-REALTIME.18, AGENTES-REALTIME.24

### AGENTES-REALTIME.30 — Conferência final

**Próximo passo:** esperar AGENTES-REALTIME.23, AGENTES-REALTIME.26, AGENTES-REALTIME.27, AGENTES-REALTIME.28, AGENTES-REALTIME.29.

- **Nível:** MEDIO — código com lógica em poucos arquivos, sem banco
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** `git grep` da rota, `node --check`, `py_compile`, gate da spec, comparação de paridade e secrets.
- **Critérios de Aceitação:** Critério de pronto da etapa inteiro.
- **Depende de:** AGENTES-REALTIME.23, AGENTES-REALTIME.26, AGENTES-REALTIME.27, AGENTES-REALTIME.28, AGENTES-REALTIME.29

### AGENTES-REALTIME.31 — Fechamento: grafo, `STATUS_PROJETO.md` e mover a tarefa para `task_complete.md`

**Próximo passo:** esperar AGENTES-REALTIME.30.

- **Nível:** LEVE — só texto, configuração simples ou comando de fechamento
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Rodar o graphify, atualizar o `STATUS_PROJETO.md` e fechar a mãe.
- **Critérios de Aceitação:** Mãe movida; grafo atualizado.
- **Depende de:** AGENTES-REALTIME.30

### AGENTES-REALTIME.32 — Corrigir o `IndexError` do `quadro_tarefas.py` com linha curta

**Próximo passo:** nenhum — entregue.

- **Nível:** MEDIO — correção de bug em código Python, 1 arquivo (aberta pelo líder a partir do achado da .6, C26)
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** `dashboard/quadro_tarefas.py` lança `IndexError` quando uma linha da tabela tem menos colunas que a posição da coluna Tarefa; o leitor JS (`quadro.js`) ignora a linha. Igualar o Python ao JS. Por ser correção de bug, um caso que reproduza a falha pode entrar no teste de paridade.
- **Arquivos:** `dashboard/quadro_tarefas.py` (e `dashboard/testes/invariante_paridade_quadro.py`, só o caso novo)
- **Critérios de Aceitação:** linha curta não quebra o Python; teste de paridade com o caso novo sai 0.
- **Depende de:** AGENTES-REALTIME.6
- **Entrega:** dashboard/quadro_tarefas.py ignora linha mais curta que a coluna Tarefa (como o JS) e caso novo em dashboard/testes/invariante_paridade_quadro.py (correção de bug; commit desta entrega), feito por sn3 (Sonnet 5.5, herdr w2:p12, conta D).
- **Verificação:** python -B dashboard/testes/invariante_paridade_quadro.py: código 0 com o caso novo (rodado pelo líder). O caso não foi rodado contra o código antigo; a causa foi confirmada por leitura.
