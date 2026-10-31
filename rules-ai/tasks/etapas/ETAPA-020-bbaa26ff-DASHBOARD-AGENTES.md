## Etapa 020-bbaa26ff — DASHBOARD-AGENTES: pasta `dashboard/` só com os Agentes ao vivo

**Tarefa:** DASHBOARD-AGENTES · **Pedido em:** 2026-10-18 11:59 · **Criada por:** Claude Code (Opus 5.5) (local · main)
**Pedido:** "crie 1 tarefa pra deixar apenas o Fluxo de Dados *3 - Agentes ao vivo*, nesta pasta dashboard"
**Objetivo:** a pasta `dashboard/` passa a ter só a página **Agentes ao vivo** (cena 3D das tarefas
reais do `tasks/STATUS.md`) e o servidor local que a alimenta; saem a rede neural 3D, a aba de
ferramentas de IA 3D, o coletor Python, o gerador de modelos 3D e a cena do prompt 04.

> 🟠 **Tarefa grande (`PESADO`)**: apaga arquivos em massa e muda vários arquivos ligados
> (servidor, módulos JS, menu). O plano é esta etapa; a execução **só começa depois do "sim" do
> usuário** e com as **Perguntas abertas** fechadas (C34).

### Escopo

**Entra (o que fica e é enxugado):**
- Página `agentes.html` e seus módulos: `agentes.js`, `agentes/*.js` (cena, fila com atraso, galhos,
  HUD, personagens, rótulos), `menu.js`, `api.js` (só `lerAgentes`), `config.js`, `visualizador.js`
  (só `criarBase` e `ajustarTamanho`), a forma simples usada pelos personagens, `base.css` e
  `graphs.css` (só os estilos usados).
- Servidor: `servidor.py` só com `/api/agentes` e `/api/projetos` (e os arquivos estáticos),
  `quadro_tarefas.py` sem mudança, `config_graphs.py` só com o que os agentes usam (fica `ATRASO_AGENTES`),
  `.env.example` só com `ATRASO_AGENTES`.
- `README.md` da pasta reescrito só para os Agentes ao vivo; caminho citado na regra C31 do
  `AGENTS.md` ajustado se a página mudar de lugar.

**Sai (apagado com `git rm`; o Git guarda o histórico):**
- Rede neural 3D: `index.html` atual, `assets/js/principal.js`, `assets/js/{cena,config,rede}/`,
  `assets/css/{cena,painel}.css`.
- Aba Ferramentas de IA 3D: `assets/js/ferramentas/`, `assets/js/dados/`, `assets/css/ferramentas.css`.
- Coletor: `scripts/`, `WEB-SCRAP.md`, `CLAUDE.md` (prompt de análise de mercado),
  `modelos-3d-de-ia.txt`.
- 3D GRAPHS AI e cena do prompt 04: `graphs/index.html`, `graphs/cena.html`, `principal.js`, `cena.js`,
  `chave.js`, `modal-config.js`, `saldo.js`, `cenas/` (JS e JSON) e os arquivos Python e o guia do gerador de modelos 3D
  (já removidos pela ETAPA-039).
- Prompts: os `.md` de `prompts/` e o `prompts/README.md`.

**Guardado (pergunta 4):**
- `dashboard/referencias/`: os 5 PNG de `prompts/` (incluindo `modelo.png`, desenho do mapa mental
  dos agentes) e o `coleta.json`, **versionados**.
- `dashboard/referencias/fora-do-git/` (no `.gitignore`): os 5 GLB gerados e `MODELOS-DE-IA/`.

**Não entra:**
- Mudar o comportamento dos Agentes ao vivo (globo, personagens, percentual C31, atraso, menu de
  projetos) — só tirar o que não é dele.
- Arquivos fora de `dashboard/`, exceto o quadro, esta etapa, a linha da C31 no `AGENTS.md`, o
  `.gitignore` e o `STATUS_PROJETO.md`.
- Apagar do disco qualquer arquivo fora do Git.

### Critério de pronto

- `git ls-files dashboard` lista só os arquivos da página Agentes ao vivo, do servidor e o README.
- Todo `import`, `href` e `src` local das páginas e módulos restantes aponta para arquivo que existe.
- `node --check` passa em todos os `.js` restantes e `python -m py_compile` nos `.py`.
- `/api/agentes` e `/api/projetos` devolvem o mesmo JSON de antes; as rotas antigas dão 404.
- `node spec/verificar-spec.mjs tasks/etapas/ETAPA-020-bbaa26ff-DASHBOARD-AGENTES.md` passa.
- O usuário confere no navegador que a página abre como antes (a IA não abre navegador).

### Riscos

| Risco | Plano B |
|---|---|
| Módulo dos agentes depender de algo que vai ser apagado (`cenas/formas.js`, `api.js`, `visualizador.js`) | Antes de apagar, listar os imports de cada módulo restante (INV-1); o que for usado é enxugado, não apagado |
| Apagar arquivo fora do Git (GLB gerados, PNG dos prompts, reels) é irreversível | Só mexer neles conforme a pergunta 4; resposta padrão sugerida: mover, não apagar |
| Mudar a página de lugar quebrar caminhos relativos (`../assets/css/base.css`) e o link da regra C31 | Mudança de lugar numa subtarefa só (`.2`), com conferência de INV-1 logo depois |
| Outra frente (herdr) editando o quadro ao mesmo tempo | Só mexer nas linhas desta tarefa; `git pull --rebase` antes de cada push |

### Requisitos

> Formato EARS.

| ID | Requisito (EARS) | Cobre | Verificação |
|----|------------------|-------|-------------|
| R1.1 | O SISTEMA DEVE ter em `dashboard/` (no Git) só os arquivos usados pela página Agentes ao vivo, pelo servidor dela e o `README.md` | DASHBOARD-AGENTES.1, .2 | `git ls-files dashboard` comparado com a lista da entrega |
| R2.1 | QUANDO o servidor receber `GET /api/agentes` ou `GET /api/projetos`, O SISTEMA DEVE devolver o mesmo JSON de antes da tarefa | DASHBOARD-AGENTES.3 | `python -c` chamando as duas rotas antes e depois; comparar as chaves e os valores |
| R2.2 | SE o pedido for `/api/estado`, `/api/modelos`, `/api/saldo`, `/api/cenas`, `/api/tarefa/<id>` ou `POST /api/gerar`, ENTÃO O SISTEMA DEVE responder 404 | DASHBOARD-AGENTES.3 | Leitura do código: só 2 rotas no mapa e `do_POST` sem rota |
| R2.3 | SE o caminho pedido for `.env`, arquivo oculto, `.py`, `.pyc` ou `__pycache__`, ENTÃO O SISTEMA DEVE responder 404 | DASHBOARD-AGENTES.3 | Leitura: `caminho_proibido` sem mudança |
| R3.1 | QUANDO a página dos Agentes ao vivo abrir, O SISTEMA DEVE mostrar o globo, os personagens com o percentual (C31), o atraso configurável e o menu de projetos, como hoje | DASHBOARD-AGENTES.4, .5 | `node --check` + INV-1; o usuário confere no navegador |
| R3.2 | O SISTEMA DEVE mostrar no menu só o link dos Agentes ao vivo e a linha de projetos | DASHBOARD-AGENTES.5 | Leitura de `ITENS_MENU` no `menu.js` |

**Fora do escopo (não-objetivos):**

- Recursos novos na página Agentes ao vivo.
- Mudar o `quadro_tarefas.py` (leitura do quadro) ou o formato do `tasks/STATUS.md`.

### Invariantes

| ID | Regra que vale sempre | Domínio da entrada | Como conferir | Teste automatizado |
|----|----------------------|--------------------|---------------|--------------------|
| INV-1 | Todo `import`, `href` e `src` local de cada `.html` e `.js` restante aponta para um arquivo que existe | todos os `.html` e `.js` de `dashboard/` depois de cada subtarefa | script de leitura na pasta da sessão (fora do repositório) que resolve cada caminho relativo e lista os que faltam | não: conferência por comando |
| INV-2 | Nenhum arquivo fora de `dashboard/` muda, exceto o quadro, esta etapa, a linha da C31 no `AGENTS.md`, o `.gitignore` e o `STATUS_PROJETO.md`; nenhum arquivo fora do Git é apagado do disco | todos os commits da tarefa | `git diff --name-only <antes>..HEAD` | não: conferência por comando |
| INV-3 | O servidor nunca entrega `.env`, arquivo oculto nem código Python | qualquer caminho pedido | leitura de `caminho_proibido` e do `do_GET` | não: leitura |

**Casos de borda que o código precisa sobreviver:**

- Página aberta sem o servidor local (o `menu.js` já cai no `PROJETOS_PADRAO`).
- `.env` ausente (atraso padrão 30 s).
- Projeto escolhido no menu sem `tasks/STATUS.md`.

### Perguntas abertas

| # | Pergunta | Resposta | Fechada em | Quem respondeu |
|---|----------|----------|------------|----------------|
| 1 | Onde fica a página: **a)** vira a página principal da pasta (`dashboard/index.html`, servidor em `dashboard/servidor.py`, sem a subpasta `graphs/`) **ou b)** continua em `dashboard/graphs/agentes.html` e só o resto sai? | **a)** vira a página principal da pasta, sem a subpasta `graphs/` | 2026-10-18 15:02 | Gelvazio ("1-a") |
| 2 | O que sai do Git é **a)** apagado (`git rm`; o histórico guarda) **ou b)** movido para outra pasta? | **a)** apagado com `git rm` | 2026-10-18 15:02 | Gelvazio ("2-a") |
| 3 | A tarefa DASHBOARD-REDE-NEURAL (falta a `.4`, painel 2D da rede) é **a)** cancelada e fechada, com as linhas ✅ dela movidas para o `task_complete.md`, **ou b)** mantida aberta? | **a)** cancelada e fechada | 2026-10-18 15:02 | Gelvazio ("3-a") |
| 4 | Arquivos **fora do Git** em `dashboard/` (5 GLB de ~42 MB em `graphs/modelos/`, os PNG de `prompts/`, `MODELOS-DE-IA/`, `scripts/saida/coleta.json`): **a)** mover para fora do repositório (pasta a combinar), **b)** apagar do disco (sem volta) **ou c)** deixar como estão? E o `prompts/modelo.png` (desenho de referência do mapa mental dos agentes) fica? | Os **5 PNG** (incluindo o `modelo.png`) e o **`coleta.json`** ficam e **passam a ser versionados** ("posso usar futuramente"). GLB e `MODELOS-DE-IA/` não foram citados: ficam como estão, fora do Git (ver Decisões) | 2026-10-18 15:02 | Gelvazio ("4-deixe os arquivos png e versione eles assim como o arquivo coleta.json deve ser versionado, poso usar futuramente") |

### Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-20 11:20 | Aprovado o plano de "só a parte de Agentes ao vivo, nada mais": o gerador 3D, a rede neural e a aba Ferramentas saem, conforme o escopo "Sai". Subtarefas .1 e .2 (PESADO) livres só para Opus 5.5+/Fable ou DeepSeek. Atenção: a `ETAPA-031` (.3 e .4) mexe em `agentes.js`, que esta etapa também enxuga; a ordem é decidida pelo líder antes de pegar a .3 da 031 | Gelvazio (mensagem "quero apenas a parte de agentes ao vivo, nada mais") | O usuário pediu só os Agentes ao vivo, que é exatamente este plano |
| 2026-10-18 15:02 | Os 5 PNG e o `coleta.json` vão para `dashboard/referencias/` (versionados); sai do `.gitignore` a linha `dashboard/scripts/saida/`. Os 5 GLB (`graphs/modelos/`, ~210 MB) e `MODELOS-DE-IA/` (páginas salvas do Instagram) **não são apagados nem versionados**: vão para `dashboard/referencias/fora-do-git/`, que entra no `.gitignore` | Claude Code (Opus 5.5) | Pergunta 4: o usuário só citou PNG e `coleta.json`; apagar arquivo fora do Git não tem volta, então o resto é guardado sem versionar |
| 2026-10-18 15:02 | A mudança local ainda sem commit no `prompts/MODELO-3D-REDE-NEURAL-04.md` é commitada antes do `git rm`, para o histórico guardá-la (resposta 2-a) | Claude Code (Opus 5.5) | Sem commit, o `git rm -f` a perderia de vez |
| 2026-10-18 11:59 | Registrada como tarefa grande (`PESADO`, spec C34): execução só depois das perguntas fechadas e do "sim" ao plano | Claude Code (Opus 5.5) | Apaga arquivos em massa e mexe em vários arquivos ligados |

### DASHBOARD-AGENTES.1 — Apagar o que não é dos Agentes ao vivo

**Próximo passo:** esperar o "sim" ao plano (perguntas fechadas em 15:02); listar os imports dos
módulos que ficam (INV-1) e só então rodar o `git rm` da lista "Sai" do Escopo.

- **Nível:** PESADO — apaga dados em massa (mais de 40 arquivos)
- **Modelo:** só Sonnet (ou DeepSeek, C35) — nunca outro (trocado do Opus em 2026-10-23, RECLASSIFICAR-PESADO-OPUS.2)
- **Effort:** high
- **Descrição:** commitar antes a mudança local do `prompts/MODELO-3D-REDE-NEURAL-04.md`; mover os
- **JEV-AI-SUGGESTION:** NAO
  5 PNG e o `coleta.json` para `dashboard/referencias/` e versioná-los (tirar
  `dashboard/scripts/saida/` do `.gitignore`); mover os GLB e `MODELOS-DE-IA/` para
  `dashboard/referencias/fora-do-git/` (no `.gitignore`); `git rm` da lista "Sai"; manter tudo o
  que algum módulo restante importa.
- **Critérios de aceitação:** R1.1 (parcial: nada da lista "Sai" no Git); INV-2; os 5 PNG e o
  `coleta.json` em `git ls-files dashboard/referencias`.

### DASHBOARD-AGENTES.2 — Página no lugar definido pela pergunta 1

**Próximo passo:** esperar a `.1`.

- **Nível:** PESADO — move vários arquivos ligados e ajusta caminhos relativos entre eles
- **Modelo:** só Sonnet (ou DeepSeek, C35) — nunca outro (trocado do Opus em 2026-10-23, RECLASSIFICAR-PESADO-OPUS.2)
- **Effort:** high
- **Descrição:** (resposta 1-a) `git mv` do `agentes.html` para `dashboard/index.html`, dos
- **JEV-AI-SUGGESTION:** NAO
  módulos, do CSS e dos `.py` de `graphs/` para a raiz de `dashboard/` (sem a subpasta `graphs/`);
  ajustar os caminhos relativos (CSS, import map, `PASTA_DASHBOARD`, `PASTA_FONTES`,
  `PROJETO_PADRAO`, `.gitignore` do `.env`) e o caminho citado na C31 do `AGENTS.md`.
- **Critérios de aceitação:** INV-1; INV-2.

### DASHBOARD-AGENTES.3 — Servidor só com as rotas dos agentes

**Próximo passo:** esperar a `.2`.

- **Nível:** MEDIO — lógica em 2 arquivos Python (`servidor.py`, `config_graphs.py`) e o `.env.example`
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Descrição:** tirar do `servidor.py` as rotas e imports do gerador 3D, da galeria e das cenas (fica
- **JEV-AI-SUGGESTION:** NAO
  `/api/agentes`, `/api/projetos` e `caminho_proibido`); tirar do `config_graphs.py` as constantes
  e funções do gerador 3D; `.env.example` só com `ATRASO_AGENTES`.
- **Critérios de aceitação:** R2.1, R2.2, R2.3; INV-3.

### DASHBOARD-AGENTES.4 — Módulos JS de apoio enxutos

**Próximo passo:** esperar a `.2`.

- **Nível:** MEDIO — lógica em 3 arquivos JS (`api.js`, `config.js`, `visualizador.js`)
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Descrição:** `api.js` só com `lerAgentes` (sem `chave.js`); `config.js` só com o que os
- **JEV-AI-SUGGESTION:** NAO
  agentes usam; `visualizador.js` só com `criarBase` e `ajustarTamanho` (sem `GLTFLoader`).
- **Critérios de aceitação:** R3.1; INV-1; `node --check` nos 3 arquivos.

### DASHBOARD-AGENTES.5 — Personagens, menu e CSS só dos agentes

**Próximo passo:** esperar a `.2`.

- **Nível:** MEDIO — lógica em 3 arquivos (`personagens.js`, `menu.js`, `graphs.css`)
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Descrição:** trazer para os agentes a forma simples que o `personagens.js` usa de
- **JEV-AI-SUGGESTION:** NAO
  `cenas/formas.js` (sem `GLTFLoader`) e apagar `cenas/formas.js`; `ITENS_MENU` só com "Agentes ao
  vivo" (sem `data-menu-ocultar` na página); `graphs.css` sem os estilos das páginas apagadas.
- **Critérios de aceitação:** R3.1, R3.2; INV-1; `node --check`.

### DASHBOARD-AGENTES.6 — README da pasta e quadro

**Próximo passo:** esperar a `.3`, a `.4` e a `.5`.

- **Nível:** LEVE — só `.md` (README da pasta e linhas do quadro)
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **Descrição:** reescrever `dashboard/README.md` só para os Agentes ao vivo (como abrir, rotas,
- **JEV-AI-SUGGESTION:** NAO
  `ATRASO_AGENTES`, regra C31, o que há em `referencias/`); resposta 3-a no quadro: a
  DASHBOARD-REDE-NEURAL.4 vira cancelada (motivo em "Pendências" do `STATUS.md`) e a mãe
  DASHBOARD-REDE-NEURAL fecha, com as linhas ✅ dela movidas para o `task_complete.md`.
- **Critérios de aceitação:** README sem citar o que saiu (`git grep` por "rede neural",
  "coletor" vazio em `dashboard/`); critério de pronto da etapa conferido.
