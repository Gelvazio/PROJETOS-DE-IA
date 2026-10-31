## Etapa 031-a3249f9e — MIGRAR-AGENTES-BROADCAST: "Agentes ao vivo" por Supabase Broadcast

**Tarefa:** MIGRAR-AGENTES-BROADCAST · **Pedido em:** 2026-10-20 10:57 · **Criada por:** Claude Code (Haiku 5.5) (local · main · rules-ai)
**Pedido:** "crie esta task - Migrar só a página 'Agentes ao vivo' para Broadcast" (depois da conversa sobre migrar o servidor para Supabase Realtime)
**Objetivo:** a página "Agentes ao vivo" recebe a mudança do quadro na hora em que o `tasks/STATUS.md` chega ao GitHub, por **Supabase Realtime Broadcast**, sem a página perguntar a cada 10 s e sem o servidor Python rodando.
**Situação:** 👀 **plano e spec (C34) aguardando o "sim" do usuário.** Nenhuma subtarefa pode ser reservada antes da aprovação, e as perguntas abertas precisam estar fechadas.

---

### Contexto e problema

- Hoje a página consulta `GET /api/agentes` a cada 10 s, e o servidor (`dashboard/servidor.py`) lê o `tasks/STATUS.md` do disco. Sem o servidor rodando, a página não mostra nada.
- A regra `regras/quadro-de-tarefas.md` proíbe "cópia da fila em tabela de banco", e a MCP-QUADRO definiu que **o Git é a trava**. Por isso esta migração **não usa tabela nem `postgres_changes`**: só Broadcast, que transmite a mensagem e não guarda nada.
- O `STATUS.md` continua sendo a **fonte única**. O Supabase só recebe o resultado já lido e o repassa à página.
- A leitura do quadro já existe em Python (`dashboard/quadro_tarefas.py`). Reaproveitá-la evita duplicar o parser em Node.

### Escopo

**Entra:**

- Publicador `dashboard/publicar_quadro.py` (Python, só biblioteca padrão): lê o quadro com `quadro_tarefas.ler_quadro` e envia a mensagem por HTTP ao endpoint de broadcast do Supabase. Modo `--simular` mostra o payload sem enviar.
- Workflow `.github/workflows/publicar-quadro.yml` no `rules-ai`: roda a cada push que altera `tasks/STATUS.md` e usa **secrets do GitHub** (a chave secreta nunca vai ao navegador).
- Página `dashboard/index.html` e `dashboard/assets/js/agentes.js`: assina o canal `quadro:<projeto>` com a **chave publicável**, recebe a mensagem e atualiza a tela sem recarregar.
- Estado inicial ao abrir a página: lido do `STATUS.md` público no GitHub (`raw.githubusercontent.com`).
- Fallback: se o canal ficar sem conexão por 30 s, a página volta a consultar a cada 10 s (`/api/agentes` se houver servidor; senão o GitHub raw).
- Documentação do fluxo no `dashboard/README.md`.

**Não entra:**

- Tabela no Supabase, `postgres_changes`, RLS de tabela e qualquer cópia da fila em banco.
- Publicar projetos além do escolhido na pergunta 3 (cada repositório só recebe o workflow depois da aprovação).
- Mudar o formato do `STATUS.md`, as regras de reserva ou o `gerenciador-centralizado.md`.
- Abrir navegador ou rodar servidor de desenvolvimento para validar (regra de testes): a conferência na tela é feita pelo usuário.

### Premissas

- O repositório `Gelvazio/rules-ai` é público (o estado inicial lê o `STATUS.md` pelo GitHub sem token). Se for privado, a pergunta 5 muda.
- Python 3 com biblioteca padrão está disponível no computador e no runner do GitHub Actions.
- A chave publicável do Supabase pode ficar no HTML: ela não dá acesso a dados quando não há tabela nem política de leitura (o canal é só de transmissão).
- O endpoint REST de broadcast e o formato das mensagens são confirmados na documentação do Supabase na subtarefa .1, antes de qualquer código.

### Arquitetura

```
git push (tasks/STATUS.md)
  → GitHub Actions: python dashboard/publicar_quadro.py
      → quadro_tarefas.ler_quadro(...)          (mesma leitura do servidor)
      → POST broadcast  canal "quadro:rules-ai"  (chave secreta, só no runner)

navegador (agentes.html)
  → GET raw.githubusercontent.com/.../tasks/STATUS.md   (estado inicial)
  → assina "quadro:rules-ai" com a chave publicável     (atualizações)
  → se o canal cair por 30 s: polling a cada 10 s       (fallback)
```

Contrato da mensagem (evento `estado`): os mesmos campos que `GET /api/agentes` já devolve (`tarefas`, `atualizado_em`, `projeto`) mais `commit` e `publicado_em`. A página não precisa de um formato novo.

### Segurança

- Chave **secreta** do Supabase: só em `Settings → Secrets` do GitHub. Nunca em arquivo versionado, nunca no HTML, nunca no log (INV-1).
- Chave **publicável**: no navegador; não dá acesso a dados porque não existe tabela.
- Publicador lê **só** os projetos da lista permitida e ignora `DEMAIS-PROJETOS-*` (C20/C23) (INV-4).
- O publicador não escreve em nenhum arquivo do repositório (INV-3).

### Requisitos

| ID | Requisito (EARS) | Cobre | Verificação |
|----|------------------|-------|-------------|
| R1.1 | QUANDO um push altera `tasks/STATUS.md` na `main`, O SISTEMA DEVE enviar o quadro ao canal `quadro:rules-ai` em até 60 s | MIGRAR-AGENTES-BROADCAST.2 | execução do workflow após um push de teste; registrar o tempo na Verificação |
| R1.2 | SE o envio falhar, ENTÃO O SISTEMA DEVE encerrar o workflow com erro e não alterar nenhum arquivo do repositório | MIGRAR-AGENTES-BROADCAST.2 | chave inválida em ensaio local com `--simular` desligado; `git status` igual antes e depois |
| R1.3 | O SISTEMA DEVE montar a mensagem com os mesmos campos de `GET /api/agentes` | MIGRAR-AGENTES-BROADCAST.1, .2 | teste de invariante INV-2 comparando as duas saídas |
| R2.1 | QUANDO a página abre, O SISTEMA DEVE mostrar o estado inicial lido do GitHub, sem depender do servidor local | MIGRAR-AGENTES-BROADCAST.3 | usuário abre a página sem o servidor rodando |
| R2.2 | QUANDO chega uma mensagem do canal, O SISTEMA DEVE atualizar as tarefas na tela sem recarregar a página | MIGRAR-AGENTES-BROADCAST.3 | usuário faz um push de teste e confere a tela |
| R2.3 | SE o canal ficar sem conexão por mais de 30 s, ENTÃO O SISTEMA DEVE voltar a consultar a cada 10 s até reconectar | MIGRAR-AGENTES-BROADCAST.4 | usuário desliga a rede por 40 s e confere o aviso e a volta |
| R3.1 | O SISTEMA DEVE usar no navegador somente a chave publicável do Supabase | MIGRAR-AGENTES-BROADCAST.3 | `grep` por `service_role` e `sb_secret` em `dashboard/` retorna vazio (INV-1) |

**Não-objetivos:** tabela ou banco, publicar projetos fora da lista aprovada, painel novo, histórico de mudanças.

### Invariantes

| ID | Regra que vale sempre | Domínio da entrada | Como conferir | Teste automatizado |
|----|----------------------|--------------------|---------------|--------------------|
| INV-1 | Nenhuma chave secreta aparece em arquivo versionado, no HTML/JS publicado nem no log do workflow | qualquer arquivo de `dashboard/` e qualquer linha de log | `grep` de padrões de chave secreta em `dashboard/` e no log do workflow | sim: `dashboard/testes/invariantes_broadcast.py` |
| INV-2 | A mensagem tem exatamente os campos de `GET /api/agentes`, e a página aceita a mensagem sem campo extra | qualquer quadro válido do repositório | comparar a saída de `ler_quadro` com o payload de `--simular` | sim: `dashboard/testes/invariantes_broadcast.py` |
| INV-3 | O publicador nunca grava arquivo do repositório | qualquer execução, com e sem falha | hash de todos os arquivos do repositório antes e depois | sim: `dashboard/testes/invariantes_broadcast.py` |
| INV-4 | Nenhum projeto `DEMAIS-PROJETOS-*` é lido nem publicado | qualquer nome de pasta de `C:\fontes` | o conjunto de projetos publicados não tem nome que comece com `DEMAIS-PROJETOS-` | sim: `dashboard/testes/invariantes_broadcast.py` |

Teste automatizado de invariante é permitido aqui porque a tarefa é `PESADO` (C34, `regras/espec.md`).

### Perguntas abertas

> Cada `⬜` abaixo **bloqueia** a execução até o "sim" do usuário. As recomendações não fecham nada sozinhas.

| # | Pergunta | Resposta | Fechada em | Quem respondeu |
|---|----------|----------|------------|----------------|
| 1 | Onde roda o publicador? **Recomendado:** GitHub Actions no push (funciona com o PC desligado; exige um secret no GitHub). Alternativa: gancho local (só com o PC ligado). | ✅ GitHub Actions no push | 2026-10-20 | Usuário (aprovou as recomendações) |
| 2 | Qual projeto Supabase usar? **Recomendado:** criar um só para os agentes, sem misturar com o `aulasenai`. Alternativa: usar o projeto que já existe. | ✅ ~~Projeto novo~~ → **usar o projeto `AULAS SENAI`** (`hxlvonriearllcmfqeri`), só o canal de Broadcast, sem tabela nem dado (a organização já tem 2 projetos; um 3º no plano gratuito pode ser recusado ou ter custo) | 2026-10-20 08:35 | Gelvazio (chat, mudou a resposta) |
| 3 | Quais projetos publicam? **Recomendado:** só `rules-ai` nesta etapa. Alternativa: todos os que têm `tasks/STATUS.md` (exige o workflow em cada repositório, em outra aprovação). | ✅ Só `rules-ai` nesta etapa | 2026-10-20 | Usuário (aprovou as recomendações) |
| 4 | Onde a página "Agentes ao vivo" fica publicada? Se for só no PC, o fallback usa `/api/agentes`. Se for no GitHub Pages, o fallback usa só o GitHub raw. | ✅ Hospedada na Vercel (hospedagem externa; o usuário publica depois). Sem servidor Python, o fallback usa só o GitHub raw | 2026-10-20 | Usuário |
| 5 | O `rules-ai` é público? **Recomendado:** sim, para a página ler o `STATUS.md` pelo GitHub sem token. Se for privado, o estado inicial passa a depender do servidor local. | ✅ Sim: `gh repo view` confirma `PUBLIC` | 2026-10-20 | Usuário (aprovou as recomendações) e Claude Code (Haiku 5.5) (conferência) |

### Decisões

- **Aprovação (2026-10-20 10:59):** o usuário aprovou o plano e as recomendações das perguntas 1, 2, 3 e 5. A pergunta 4 segue ⬜ porque não tinha recomendação; ela bloqueia a subtarefa .4 e o gate desta etapa até ser respondida.
- **Pergunta 4 (2026-10-20):** a página vai para a Vercel. Como a Vercel não roda `servidor.py`, o fallback de R2.3 usa só o GitHub raw (não `/api/agentes`).
- **Liberação:** a subtarefa .1 fica disponível só para Opus 5.5+/Fable ou DeepSeek (PESADO). Esta sessão (Haiku 5.5) não executa nenhuma subtarefa desta etapa.

- **Parser:** o publicador reaproveita `dashboard/quadro_tarefas.py` (Python) em vez de portar para Node, para não duplicar a leitura do quadro (plano, 2026-10-20).
- **Sem tabela:** o Supabase só transmite; nada é guardado (regra `quadro-de-tarefas.md` e MCP-QUADRO).
- **Execução na nuvem (2026-10-20 08:35):** líder "sargento" Claude Code (Opus 5.5), que só gerencia (`tasks/GERENCIADOR-HERDR/PROMPT_PARA_O_LIDER.md`); sem herdr na nuvem, os "terminais" são subagentes do nível (Opus para PESADO, Sonnet para MEDIO, Haiku para LEVE), com VIGIA e FINANCEIRO (Haiku) e orçamento de 1,5 milhão de tokens de subagentes. Respostas do usuário no chat: "Usar o AULAS SENAI", "Faço o código, você põe o secret", "Sim, adapte com subagentes".
- **Secret do GitHub (2026-10-20 08:35):** a IA não grava secrets; código, workflow e testes vão para a `main` e o teste ao vivo (push → tela) fica 👀 até o usuário cadastrar o secret.
- **Atraso de 30 s:** continua valendo no navegador, para a animação dos agentes, como hoje (`ATRASO_AGENTES`).

### Riscos e plano B

| Risco | Plano B |
|---|---|
| O endpoint REST de broadcast mudou ou exige outra forma de autenticação | Parar na .1, registrar o achado e voltar para o usuário antes de criar o publicador |
| O workflow atrasa e a tela fica desatualizada | Fallback de 10 s (R2.3) mantém a tela certa, só mais lenta |
| Chave secreta vaza em log | INV-1 falha o teste; o workflow não imprime variável de ambiente |
| Projeto privado (pergunta 5) | Estado inicial passa a usar o `/api/agentes`; a página exige o servidor local |

### Subtarefas

### MIGRAR-AGENTES-BROADCAST.1 — Contrato do canal, endpoint confirmado e gate da spec

**Próximo passo:** nenhum — entregue.
- **Nível:** PESADO — chaves, endpoint externo e contrato que todas as outras subtarefas usam.
- **Modelo:** só Opus 5.5+ ou Fable ou DeepSeek — nunca outro.
- **Effort:** high
- **Depende de:** Nenhuma.
- **Descrição:** definir o payload (mesmos campos de `GET /api/agentes`, mais `commit` e `publicado_em`), o canal, o evento e a forma de envio. Sem criar nenhum arquivo no repositório.
- **Arquivos:** esta etapa (seção de contrato).
- **Critérios de Aceitação:** endpoint e chave publicável confirmados com link da documentação; contrato escrito; gate da spec passa.
- **Entrega:** contrato do canal escrito nesta seção (abaixo), feito por op1 (Opus 5.5, herdr w2:pX, conta D).
- **Verificação:** endpoint REST de Broadcast e chave publicável conferidos na documentação do Supabase (links no contrato); node spec/verificar-spec.mjs tasks/etapas/ETAPA-031-a3249f9e-MIGRAR-AGENTES-BROADCAST.md saiu 0 (conferido pelo líder). Pendências: canal público aceita envio falso (a página valida versao, projeto e sequencia; bloquear exige canal privado, decisão do usuário); a INV-2 da 031 precisa citar commit, publicado_em, sequencia e versao; o código HTTP de sucesso só se confirma na .2.
- **Estimativa:** 1 h.
- **JEV-AI-SUGGESTION:** NAO

- **Anotação (2026-10-23 13:09):** a reserva da sessão na nuvem (desde 2026-10-20 08:35, 0%) foi liberada a pedido do usuário; nada desta subtarefa tinha sido entregue.

#### Contrato do canal (MIGRAR-AGENTES-BROADCAST.1)

> Fechado em 2026-10-23 por Claude Code (Opus 5.5), executor da equipe herdr. Vale também para a
> AGENTES-REALTIME.4 (ETAPA-040), que só **acrescenta** o evento `projetos` e não muda os campos comuns.
> Documentação conferida em 2026-10-23 (links no fim desta seção).

#### 1. Projeto e chaves

| Item | Valor |
|---|---|
| Projeto Supabase | `AULAS SENAI` — `https://hxlvonriearllcmfqeri.supabase.co` (pergunta 2) |
| O que se usa | **só Realtime Broadcast**; nenhuma tabela, nenhum `postgres_changes`, nada gravado |
| Chave de envio (publicador) | chave **secreta** `sb_secret_…`, só no secret do GitHub `SUPABASE_SECRET_KEY` → variável de ambiente do runner; nunca impressa nem gravada (INV-1) |
| Chave de recepção (página) | chave **publicável** `sb_publishable_…`, em `dashboard/assets/js/config.js` (segura no navegador, segundo a doc) |
| Como a chave vai na requisição | cabeçalho `apikey: <chave>`; **não** usar `Authorization: Bearer` com as chaves novas (não são JWT) |
| Chaves legadas | `anon`/`service_role` (JWT `eyJ…`) **não** são usadas: o Supabase as descontinua até o fim de 2026 |

#### 2. Canal e eventos

| Item | Valor |
|---|---|
| Canal (topic) | `quadro:<projeto>`, onde `<projeto>` é o nome da pasta (o `id` de `/api/projetos`). Nesta etapa só `quadro:rules-ai` (pergunta 3). Sem prefixo `realtime:` no REST; o topic não pode ser `realtime` |
| Tipo do canal | **público** (sem `private: true`), decisão da pergunta 2-a da ETAPA-040 |
| Evento do quadro | `estado` — o quadro inteiro do projeto (nunca diferença parcial) |
| Evento da lista (ETAPA-040 .4) | `projetos`, no canal `quadro:_indice` (o `_` evita choque com nome de pasta) |
| Projetos proibidos | nome que comece com `DEMAIS-PROJETOS-` nunca vira canal nem aparece em `projetos` (C20/C23, INV-4) |

#### 3. Payload do evento `estado`

Mesmos campos de `GET /api/agentes` (`dashboard/servidor.py`, `rota_agentes`) mais `commit`,
`publicado_em`, `sequencia` e `versao`. **Nenhum campo além destes** (INV-2 da 031, INV-1 da 040).

```json
{
  "versao": 1,
  "projeto": "rules-ai",
  "atualizado_em": "2026-10-23T13:09:00-03:00",
  "atraso_padrao": 30,
  "intervalo": 10,
  "commit": "3870e2f…(40 caracteres)",
  "publicado_em": "2026-10-23T16:10:05Z",
  "sequencia": 412,
  "tarefas": [
    {
      "tarefa": "MIGRAR-AGENTES-BROADCAST.1",
      "titulo": "Contrato do canal…",
      "pai": "MIGRAR-AGENTES-BROADCAST",
      "mae": false,
      "nivel": "PESADO",
      "status": "andamento",
      "agente": "Claude Code (Opus 5.5)",
      "desde": "2026-10-23 13:10",
      "progresso": 0,
      "global": false,
      "indice": 57
    }
  ]
}
```

| Campo | Tipo | Origem / regra |
|---|---|---|
| `versao` | inteiro | versão do contrato; começa em `1`. A página ignora mensagem com versão que não conhece |
| `projeto` | texto | nome da pasta; igual ao sufixo do canal |
| `atualizado_em` | texto ISO 8601 | **data do último commit que mexeu no `STATUS.md`** (`git log -1 --format=%cI -- tasks/STATUS.md`). No runner o `mtime` do arquivo é a hora do checkout, por isso não serve |
| `atraso_padrao` | inteiro (s) | mesmo valor de `atraso_agentes()` do servidor (hoje `ATRASO_AGENTES`, 30 s) |
| `intervalo` | inteiro (s) | `INTERVALO_COLETA_SEGUNDOS` (10 s); a página usa no fallback (R2.3) |
| `commit` | texto | SHA completo do push (`GITHUB_SHA`) |
| `publicado_em` | texto ISO 8601 UTC | hora do envio no runner |
| `sequencia` | inteiro | `GITHUB_RUN_NUMBER` (cresce a cada execução do workflow, na ordem dos pushes). A página descarta `sequencia` ≤ à última aplicada (R3.2 da 040). Em `--simular` vale `0` |
| `tarefas[]` | lista | exatamente a saída de `quadro_tarefas.ler_quadro(...)["tarefas"]`, com os 11 campos `tarefa`, `titulo`, `pai`, `mae`, `nivel`, `status`, `agente`, `desde`, `progresso`, `global`, `indice` (R2.1 da 040) |

Limites: o Broadcast aceita até **256 KB** por mensagem e 100 mensagens/s no plano gratuito. O quadro
atual do `rules-ai` (88 linhas) dá **≈ 25 KB**. Se passar de 200 KB, o publicador falha com erro claro
(R1.2) em vez de cortar tarefas.

#### 4. Payload do evento `projetos` (canal `quadro:_indice`, ETAPA-040 .4)

Mesmos campos de `GET /api/projetos` mais `versao`, `publicado_em` e `sequencia`:

```json
{ "versao": 1, "padrao": "rules-ai", "publicado_em": "2026-10-23T16:10:05Z", "sequencia": 412,
  "projetos": [ { "id": "rules-ai", "nome": "Rules Ai" } ] }
```

Nesta etapa a lista tem só `rules-ai` (pergunta 3); a forma de gerá-la sem ler `C:\fontes` no runner fica
com a ETAPA-040.

#### 5. Forma de envio (publicador, `dashboard/publicar_quadro.py`)

Endpoint REST de um evento por chamada (doc "Broadcast → Send messages using REST"):

```
POST https://hxlvonriearllcmfqeri.supabase.co/realtime/v1/api/broadcast/{topic}/events/{evento}
apikey: $SUPABASE_SECRET_KEY
Content-Type: application/json

<payload do evento, como na seção 3>
```

- `{topic}` vai codificado com `urllib.parse.quote("quadro:rules-ai", safe="")`; `{evento}` = `estado`.
- Canal público: **sem** `?private=true`.
- Sucesso = qualquer resposta 2xx (a doc não fixa o código). Outro código, erro de rede ou tempo acima de
  15 s → sai com código ≠ 0 e mensagem sem a chave (R1.2, INV-1). Sem nova tentativa automática: o
  próximo push republica o estado inteiro.
- Plano B, se o endpoint por evento recusar o `:` no caminho: o lote `POST /realtime/v1/api/broadcast`
  com `{"messages":[{"topic":"quadro:rules-ai","event":"estado","payload":{…}}]}` (a doc diz que ele
  "continua disponível").
- Só biblioteca padrão (`urllib.request`, `json`); a chave vem de `os.environ`, nunca de argumento de
  linha de comando nem de arquivo.
- `--simular` imprime o payload e não abre conexão.
- Workflow: `on: push` com `branches: [main]` e `paths: [tasks/STATUS.md]`; `concurrency` com
  `cancel-in-progress: true` para não publicar fora de ordem; `fetch-depth: 0` (ou ao menos o histórico
  do `STATUS.md`) para calcular `atualizado_em`.

#### 6. Recepção (página, `dashboard/assets/js/agentes.js`)

```js
const canal = supabase.channel('quadro:rules-ai')
canal
  .on('broadcast', { event: 'estado' }, (mensagem) => aplicarEstado(mensagem.payload))
  .subscribe()
```

- O cliente é criado com `createClient(URL, CHAVE_PUBLICAVEL)`.
- `aplicarEstado` confere `versao`, `projeto` e `sequencia` antes de mexer na tela; mensagem fora do
  formato é descartada (proteção contra envio falso, ver seção 7).
- Estado inicial: `STATUS.md` pelo GitHub raw, lido no mesmo formato de `tarefas` (R2.1); a mensagem
  seguinte só é aplicada se `sequencia` for maior que a última (o estado inicial começa em `0`).
- Conexão pública só com chave de API dura no máximo **24 h**: a página precisa reassinar quando o canal
  fechar (a reconexão é da .4 desta etapa e da .17 da 040).

#### 7. Segurança do canal público

- O canal é público: quem tiver a chave publicável pode **ouvir e também enviar** no canal (a doc só aplica
  RLS a canais `private: true`). Por isso o payload só leva o que já é público no GitHub (repositório
  público, pergunta 5) e a página valida cada mensagem.
- Para impedir envio falso seria preciso canal privado + política RLS em `realtime.messages` e desligar
  "Allow public access" nas configurações do Realtime. Isso **não** é tabela de dados, mas muda a
  pergunta 2-a da 040: fica como pendência para o usuário.

#### Documentação conferida

- Broadcast (REST, assinatura, topic): https://supabase.com/docs/guides/realtime/broadcast
- Chaves de API (publicável × secreta, cabeçalho `apikey`, fim das legadas, 24 h no Realtime): https://supabase.com/docs/guides/api/api-keys
- Limites do Realtime (256 KB, 100 msg/s, 200 conexões no gratuito): https://supabase.com/docs/guides/realtime/limits
- Autorização (canal privado, "Allow public access"): https://supabase.com/docs/guides/realtime/authorization

### MIGRAR-AGENTES-BROADCAST.2 — Publicador e workflow do GitHub Actions

**Próximo passo:** nenhum — entregue.
- **Nível:** PESADO — segredo, workflow e envio externo; mais de 3 arquivos.
- **Modelo:** só Opus 5.5+ ou Fable ou DeepSeek — nunca outro.
- **Effort:** high
- **Depende de:** MIGRAR-AGENTES-BROADCAST.1.
- **Descrição:** o publicador lê o quadro, monta o payload e envia; falha encerra com erro sem gravar nada. O workflow roda no push que altera o `STATUS.md` e usa o secret.
- **Arquivos:** `dashboard/publicar_quadro.py`, `dashboard/testes/invariantes_broadcast.py`, `.github/workflows/publicar-quadro.yml`.
- **Critérios de Aceitação:** `--simular` imprime o payload sem enviar; INV-1 a INV-4 passam; workflow só lê o secret do GitHub.
- **Entrega:** dashboard/publicar_quadro.py, dashboard/testes/invariantes_broadcast.py (teste de invariante, C34) e .github/workflows/publicar-quadro.yml (commit desta entrega), feito por op1 (Opus 5.5, herdr w2:pX, conta D).
- **Verificação:** python -B dashboard/testes/invariantes_broadcast.py: 0 falhas; publicar_quadro.py --simular sai 0 com o payload (≈ 32 KB); sem a chave e sem --simular sai 1 com erro claro; workflow válido (yaml.safe_load) e pula com aviso enquanto o secret SUPABASE_SECRET_KEY não existir; git grep de service_role/sb_secret_ vazio (conferido pelo líder). Pendências: teste ao vivo (R1.1) depois do secret (AGENTES-REALTIME.12); plano B de envio em lote não implementado; o teste INV-3 pode dar falso negativo se outra sessão gravar arquivos ao mesmo tempo.
- **Estimativa:** 3 h.
- **JEV-AI-SUGGESTION:** NAO

### MIGRAR-AGENTES-BROADCAST.3 — Página assina o canal e recebe o estado inicial

**Próximo passo:** nenhum — entregue.
- **Nível:** MEDIO — código com lógica em 2 arquivos.
- **Modelo:** só Sonnet — nunca outro.
- **Effort:** medium
- **Depende de:** MIGRAR-AGENTES-BROADCAST.2.
- **Descrição:** trocar a consulta periódica pelo canal; manter o atraso de animação (`ATRASO_AGENTES`); a chave publicável fica em `assets/js/config.js`.
- **Arquivos:** `dashboard/assets/js/agentes.js`, `dashboard/assets/js/config.js`.
- **Critérios de Aceitação:** sem a chave secreta em nenhum arquivo (R3.1); tela atualiza com a mensagem; sem erro de sintaxe.
- **Entrega:** dashboard/assets/js/agentes/canal.js (iniciarCanal e lerEstadoInicial pelo GitHub raw com o leitor quadro.js), constante CANAL em dashboard/assets/js/config.js (chave publicável vazia por enquanto) e ligação em dashboard/assets/js/agentes.js (commit desta entrega), feito por sn1 (Sonnet 5.5, herdr w2:pZ, conta D).
- **Verificação:** node --check ok nos 3 arquivos; canal.js e api.js importados no Node; com a chave vazia iniciarCanal devolve null sem erro; git grep de service_role/sb_secret_ vazio (conferido pelo líder). Pendências: preencher CANAL.chavePublicavel (usuário); conferência na tela (AGENTES-REALTIME.29); o setInterval e /api/agentes saem na AGENTES-REALTIME.15.
- **Estimativa:** 2 h.
- **JEV-AI-SUGGESTION:** NAO

### MIGRAR-AGENTES-BROADCAST.4 — Fallback quando o canal cai

**Próximo passo:** nenhum — entregue.
- **Nível:** MEDIO — lógica de reconexão em 1 arquivo.
- **Modelo:** só Sonnet — nunca outro.
- **Effort:** medium
- **Depende de:** MIGRAR-AGENTES-BROADCAST.3.
- **Descrição:** o polling usa só o GitHub raw, porque a página fica na Vercel (pergunta 4).
- **Arquivos:** `dashboard/assets/js/agentes.js`.
- **Critérios de Aceitação:** R2.3 atendido pelo código; sem polling enquanto o canal estiver conectado.
- **Entrega:** fallback em dashboard/assets/js/agentes.js e agentes/canal.js: com o canal fora (ou sem chave publicável) a página lê o STATUS.md pelo GitHub raw em intervalo e avisa; volta ao canal quando ele reconecta (commit desta entrega), feito por sn1 (Sonnet 5.5, herdr w2:pZ, conta D).
- **Verificação:** node --check ok nos dois arquivos (conferido pelo líder). Não testado: R2.3 com a rede desligada por 40 s (conferência na tela, AGENTES-REALTIME.29). /api/agentes ainda é o fallback do modo servidor local; sai na AGENTES-REALTIME.15.
- **Estimativa:** 1 h.
- **JEV-AI-SUGGESTION:** NAO

### MIGRAR-AGENTES-BROADCAST.5 — Documentação e fechamento

**Próximo passo:** nenhum — entregue. Falta só o teste na tela pelo usuário (R2.1 a R2.3; AGENTES-REALTIME.29).
- **Nível:** LEVE — só Markdown.
- **Modelo:** só Haiku — nunca outro.
- **Effort:** low
- **Depende de:** MIGRAR-AGENTES-BROADCAST.4.
- **Descrição:** documentar onde está o secret, como rodar `--simular` e como testar o canal.
- **Arquivos:** `dashboard/README.md`.
- **Critérios de Aceitação:** README descreve o fluxo sem citar chave.
- **Entrega:** `dashboard/README.md` (seções novas "Publicar o quadro e testar o canal" e "Quando o canal cair"; o restante do README já trazia o fluxo do Broadcast e o secret). Sem commit nesta sessão: o commit fica com o Haiku-comitê, por Claude Code (Haiku 5.5).
- **Verificação:** `grep -E "service_role|sb_secret_"` e padrões de chave real em `dashboard/README.md`: vazio. README relido: secret, `--simular`, teste do canal e o que fazer quando o canal cai estão descritos. Nenhum outro arquivo de `dashboard/` foi tocado (o README não estava modificado antes da edição).
- **Estimativa:** 30 min.
- **JEV-AI-SUGGESTION:** NAO

### Critérios de pronto da tarefa-mãe

- Todas as subtarefas ✅, com entrega (commit) e verificação.
- Usuário confirma na tela: estado inicial, atualização ao vivo e fallback (R2.1 a R2.3).
- Invariantes INV-1 a INV-4 passam no `dashboard/testes/invariantes_broadcast.py`.

### Validação geral

- Gate da spec: `node spec/verificar-spec.mjs` sai com 0.
- Testes de invariante: `python dashboard/testes/invariantes_broadcast.py`.
- Teste na tela: feito pelo usuário; a IA não abre navegador.

### Aprovação

👀 **Plano aprovado em 2026-10-20 10:59.** Todas as 5 perguntas fechadas (a 4: Vercel, com fallback só pelo GitHub raw). Liberada a subtarefa MIGRAR-AGENTES-BROADCAST.1, para o modelo PESADO. O workflow só vai para outros repositórios depois de aprovação própria (pergunta 3).

### Referências

- `dashboard/servidor.py` (rota `GET /api/agentes`) e `dashboard/quadro_tarefas.py`.
- `regras/espec.md` (C34) e `spec/templates/`.
- Documentação do Supabase Realtime, Broadcast (a confirmar na subtarefa .1).
