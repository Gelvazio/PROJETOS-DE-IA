## Etapa 003-b7d3f9a2 — UNIFICAR-PROJETOS: juntar 3 projetos em rules-ai/dashboard

**Tarefa:** UNIFICAR-PROJETOS · **Pedido em:** 2026-11-01 · **Criada por:** Claude Code (Sonnet 5.5) (local · main)
**Pedido:** "crie 1 tarefa com o máximo de tarefa possível, pra juntar em 1 só projeto,
`C:\fontes\dashboard-plataformas-de-ia`, `C:\fontes\rules-ai\dashboard` e `C:\fontes\COORDENACAO-DE-PROJETOS`"; "o projeto principal deve ser
`C:\fontes\rules-ai\dashboard`"; "máximo de sub-tarefa, no caso".
**Objetivo:** reunir os conteúdos de `dashboard-plataformas-de-ia` e de `COORDENACAO-DE-PROJETOS`
dentro de `rules-ai/dashboard`, que passa a ser o projeto único e principal.

### Tarefa grande
Várias partes, estrutura nova, mudança em massa, em repositório público (`rules-ai`) e ainda
apaga/arquiva pastas. Exige plano, resumo ao usuário e **"sim"** antes de executar. Nenhuma
subtarefa foi reservada nem executada.

### Escopo
- **Entra:** copiar para `C:\fontes\rules-ai\dashboard` os arquivos, páginas e documentos dos dois projetos de origem;
  menu único; página das chamadas do AutoSwarm; ajuste de caminhos e links; documentação e índices.
- **Não entra:** mexer no kanban/globo atuais (`agentes.js`, `kanban.js`...); migrar o clone
  `COORDENACAO-DE-PROJETOS/AutoSwarm/` (repositório de terceiros, fica fora); apagar qualquer pasta.
- **Critério de pronto:** todo o conteúdo útil dos dois projetos abre pelo menu do dashboard; nada
  das origens foi apagado; verificações das subtarefas ✅.

### Mapa de destino (proposta, fecha na subtarefa .4)
| Origem | Destino em `rules-ai/dashboard` |
|---|---|
| `dashboard-plataformas-de-ia/index.html` e `models-openrouter-ai.html` | `plataformas.html`, `models-openrouter-ai.html` |
| `dashboard-plataformas-de-ia/assets/*` | `assets/js/plataformas/`, `assets/css/plataformas.css` |
| `dashboard-plataformas-de-ia/AGENTS.md`, `SKILLS.md`, `docs/` | `docs/plataformas/` |
| `dashboard-plataformas-de-ia/open-routers-models.json` | `dados/open-routers-models.json` |
| `COORDENACAO-DE-PROJETOS/01..07-*` | `projetos-de-ia/01..07-*` |
| `COORDENACAO-DE-PROJETOS/index.html`, `estilo.css`, `markdown.css`, `copiar.js` | `projetos-de-ia.html`, `assets/` |
| `COORDENACAO-DE-PROJETOS/AUTO-SWARM-*.md`, `definir-autoswarm-home.cmd` | `docs/autoswarm/`, `scripts/` |

### Riscos
- **Repositório público:** `rules-ai` é público. Os prompts dos 7 projetos (ideias de negócio) e as
  análises de plataformas passariam a ser públicos. Plano B: manter essas pastas fora do Git do
  `rules-ai` (`.gitignore`) e só linkar localmente.
- **Peso:** `rules-ai/dashboard` já tem 203 MB (`modelos/`). Não aumentar com binários.
- **Quadros diferentes:** o `dashboard` lê o `tasks/STATUS.md` do `rules-ai` via GitHub raw/Supabase;
  migrar quadros de outros projetos para lá pode quebrar o leitor. Plano B: não migrar quadros.
- **Regras do rules-ai são mais rígidas** (uma sessão por vez, C29; visualizador C45; Vercel C46).
- **Colisão de nomes** de CSS/JS entre os três (`estilo.css`, `base.css`...). Plano B: prefixos.

### Requisitos
- QUANDO uma página migrada for aberta pelo menu, O SISTEMA DEVE carregar sem erro de arquivo
  ausente. Verificação: subtarefa .45.
- O SISTEMA DEVE manter os arquivos originais dos dois projetos de origem sem alteração até o
  "sim" da subtarefa .54. Verificação: `diff` das origens contra o backup (.5).
- SE um arquivo migrado tiver segredo, token ou caminho pessoal, ENTÃO ele NÃO DEVE ser publicado.
  Verificação: subtarefa .47.
- ONDE o repositório de destino for público, O SISTEMA DEVE respeitar a decisão da pergunta 1.

### Invariantes
- **INV-1:** nenhum arquivo dos projetos de origem é apagado ou alterado durante a tarefa.
  Domínio: as duas pastas de origem. Como conferir: `diff -r` origem × backup da .5.
- **INV-2:** os arquivos atuais do kanban/globo (`agentes.js`, `agentes/*`, `kanban.css`,
  `graphs.css`) ficam idênticos. Como conferir: `git diff --stat` neles vazio (.46).
- **INV-3:** nenhum arquivo novo passa de 1000 linhas nem função de 45. Como conferir: contagem (.42).

### Perguntas abertas
- ⬜ **1.** O `rules-ai` é público: os prompts/ideias dos 7 projetos e os documentos de plataformas
  podem ir para lá, ou ficam só locais (fora do Git)?
- ⬜ **2.** Ao final, as pastas antigas são **arquivadas** em `_backup\` ou **apagadas**? (padrão
  proposto: arquivar; nunca apagar sem novo "sim")
- ⬜ **3.** Os quadros de tarefas (`tasks/`) dos dois projetos migram para o quadro do `rules-ai` ou
  ficam só como histórico em `docs/`? (padrão proposto: histórico em `docs/`)

### Decisões
- 2026-11-01 — Projeto principal e destino: `rules-ai/dashboard` (usuário).
- 2026-11-01 — Quantidade máxima de subtarefas, uma por arquivo/pasta migrado (usuário).
- 2026-11-01 — Níveis, modelos e `effort` ficam **sem preencher**: serão classificados pelo Jev
  (regra C52). Nenhuma IA escolheu nível.


### Fase A — Preparação

### UNIFICAR-PROJETOS.1 — Inventariar arquivos, tamanhos e dependências dos 3 projetos
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: nenhuma).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** nenhuma
- **Descrição:** Inventariar arquivos, tamanhos e dependências dos 3 projetos. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura dos arquivos de origem e destino.

### UNIFICAR-PROJETOS.2 — Mapear URLs, caminhos absolutos e referências cruzadas entre os 3
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.1).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.1
- **Descrição:** Mapear URLs, caminhos absolutos e referências cruzadas entre os 3. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** `grep` dos caminhos.

### UNIFICAR-PROJETOS.3 — Conferir trava de sessão e regras do rules-ai/dashboard (CLAUDE.md, AGENTS.md)
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: nenhuma).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** nenhuma
- **Descrição:** Conferir trava de sessão e regras do rules-ai/dashboard (CLAUDE.md, AGENTS.md). Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura das regras.

### UNIFICAR-PROJETOS.4 — Definir o mapa de destino das pastas dentro de rules-ai/dashboard
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.2, UNIFICAR-PROJETOS.3).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.2, UNIFICAR-PROJETOS.3
- **Descrição:** Definir o mapa de destino das pastas dentro de rules-ai/dashboard. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** mapa escrito na etapa.

### UNIFICAR-PROJETOS.5 — Fazer backup (cópia fora de qualquer repositório) dos 3 projetos
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.1).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.1
- **Descrição:** Fazer backup (cópia fora de qualquer repositório) dos 3 projetos. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** conferir contagem de arquivos da cópia.

### UNIFICAR-PROJETOS.6 — Registrar as decisões das perguntas abertas na etapa
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.4).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.4
- **Descrição:** Registrar as decisões das perguntas abertas na etapa. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** Decisões da etapa preenchidas.


### Fase B — dashboard-plataformas-de-ia → dashboard

### UNIFICAR-PROJETOS.7 — Migrar o conteúdo de plataformas (AGENTS.md da origem) para docs/plataformas.md
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.6).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.6
- **Descrição:** Migrar o conteúdo de plataformas (AGENTS.md da origem) para docs/plataformas.md. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura dos arquivos de origem e destino.

### UNIFICAR-PROJETOS.8 — Migrar SKILLS.md
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.6).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.6
- **Descrição:** Migrar SKILLS.md. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura dos arquivos de origem e destino.

### UNIFICAR-PROJETOS.9 — Migrar README.md e LICENSE (licença preservada)
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.6).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.6
- **Descrição:** Migrar README.md e LICENSE (licença preservada). Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura dos arquivos de origem e destino.

### UNIFICAR-PROJETOS.10 — Migrar docs/criar-secao-ferramentas-recursos.md
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.6).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.6
- **Descrição:** Migrar docs/criar-secao-ferramentas-recursos.md. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura dos arquivos de origem e destino.

### UNIFICAR-PROJETOS.11 — Migrar docs/pagina-models-openrouter-ai.md
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.6).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.6
- **Descrição:** Migrar docs/pagina-models-openrouter-ai.md. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura dos arquivos de origem e destino.

### UNIFICAR-PROJETOS.12 — Migrar open-routers-models.json
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.6).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.6
- **Descrição:** Migrar open-routers-models.json. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** `node` abre o JSON sem erro.

### UNIFICAR-PROJETOS.13 — Migrar os 4 JS models-openrouter-* para assets/js
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.6).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.6
- **Descrição:** Migrar os 4 JS models-openrouter-* para assets/js. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** `node --check` nos JS e leitura.

### UNIFICAR-PROJETOS.14 — Migrar os CSS da origem para assets/css (com prefixo)
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.6).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.6
- **Descrição:** Migrar os CSS da origem para assets/css (com prefixo). Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura dos arquivos de origem e destino.

### UNIFICAR-PROJETOS.15 — Migrar models-openrouter-ai.html como página do dashboard (menu e tema futurista)
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.12, UNIFICAR-PROJETOS.13, UNIFICAR-PROJETOS.14).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.12, UNIFICAR-PROJETOS.13, UNIFICAR-PROJETOS.14
- **Descrição:** Migrar models-openrouter-ai.html como página do dashboard (menu e tema futurista). Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** `node --check` nos JS e leitura.

### UNIFICAR-PROJETOS.16 — Migrar o index.html (abas) para plataformas.html
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.7, UNIFICAR-PROJETOS.14).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.7, UNIFICAR-PROJETOS.14
- **Descrição:** Migrar o index.html (abas) para plataformas.html. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** `node --check` nos JS e leitura.

### UNIFICAR-PROJETOS.17 — Migrar o histórico do STATUS.md (etapas 1 a 11) para uma etapa histórica
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.6).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.6
- **Descrição:** Migrar o histórico do STATUS.md (etapas 1 a 11) para uma etapa histórica. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura dos arquivos de origem e destino.

### UNIFICAR-PROJETOS.18 — Recriar as pendências (item 10.2 aba Ferramentas; 11.10 aceite) como subtarefas
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.17).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.17
- **Descrição:** Recriar as pendências (item 10.2 aba Ferramentas; 11.10 aceite) como subtarefas. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** subtarefas no quadro.


### Fase C — COORDENACAO-DE-PROJETOS → dashboard

### UNIFICAR-PROJETOS.19 — Migrar o index.html dos 7 cards como página projetos-de-ia.html
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.6).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.6
- **Descrição:** Migrar o index.html dos 7 cards como página projetos-de-ia.html. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** `node --check` nos JS e leitura.

### UNIFICAR-PROJETOS.20 — Migrar 01-AGENTE-WHATSAPP
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.19).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.19
- **Descrição:** Migrar 01-AGENTE-WHATSAPP. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura dos arquivos de origem e destino.

### UNIFICAR-PROJETOS.21 — Migrar 02-SITE-DO-MAPS
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.19).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.19
- **Descrição:** Migrar 02-SITE-DO-MAPS. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura dos arquivos de origem e destino.

### UNIFICAR-PROJETOS.22 — Migrar 03-MAQUINA-DE-ANUNCIOS
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.19).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.19
- **Descrição:** Migrar 03-MAQUINA-DE-ANUNCIOS. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura dos arquivos de origem e destino.

### UNIFICAR-PROJETOS.23 — Migrar 04-AGENTE-DE-VOZ
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.19).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.19
- **Descrição:** Migrar 04-AGENTE-DE-VOZ. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura dos arquivos de origem e destino.

### UNIFICAR-PROJETOS.24 — Migrar 05-MAQUINA-DE-CARROSSEIS
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.19).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.19
- **Descrição:** Migrar 05-MAQUINA-DE-CARROSSEIS. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura dos arquivos de origem e destino.

### UNIFICAR-PROJETOS.25 — Migrar 06-VIDEO-DE-IMOVEL
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.19).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.19
- **Descrição:** Migrar 06-VIDEO-DE-IMOVEL. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura dos arquivos de origem e destino.

### UNIFICAR-PROJETOS.26 — Migrar 07-ASSISTENTE-PESSOAL
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.19).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.19
- **Descrição:** Migrar 07-ASSISTENTE-PESSOAL. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura dos arquivos de origem e destino.

### UNIFICAR-PROJETOS.27 — Unificar estilo.css e markdown.css com o tema-futurista
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.19).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.19
- **Descrição:** Unificar estilo.css e markdown.css com o tema-futurista. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura dos arquivos de origem e destino.

### UNIFICAR-PROJETOS.28 — Migrar copiar.js
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.19).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.19
- **Descrição:** Migrar copiar.js. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** `node --check` nos JS e leitura.

### UNIFICAR-PROJETOS.29 — Migrar VISUAL-FUTURISTA.md
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.6).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.6
- **Descrição:** Migrar VISUAL-FUTURISTA.md. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura dos arquivos de origem e destino.

### UNIFICAR-PROJETOS.30 — Preservar no destino a regra 'melhoria de prompt só no PROMPT_BASE.md'
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.20, UNIFICAR-PROJETOS.21, UNIFICAR-PROJETOS.22, UNIFICAR-PROJETOS.23, UNIFICAR-PROJETOS.24, UNIFICAR-PROJETOS.25, UNIFICAR-PROJETOS.26).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.20, UNIFICAR-PROJETOS.21, UNIFICAR-PROJETOS.22, UNIFICAR-PROJETOS.23, UNIFICAR-PROJETOS.24, UNIFICAR-PROJETOS.25, UNIFICAR-PROJETOS.26
- **Descrição:** Preservar no destino a regra 'melhoria de prompt só no PROMPT_BASE.md'. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** regra presente no CLAUDE.md do dashboard.

### UNIFICAR-PROJETOS.31 — Migrar AUTO-SWARM-AGENT-COORDINATOR.md
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.6).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.6
- **Descrição:** Migrar AUTO-SWARM-AGENT-COORDINATOR.md. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura dos arquivos de origem e destino.

### UNIFICAR-PROJETOS.32 — Migrar definir-autoswarm-home.cmd e ajustar o caminho de AUTOSWARM_HOME
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.31).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.31
- **Descrição:** Migrar definir-autoswarm-home.cmd e ajustar o caminho de AUTOSWARM_HOME. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura do script.

### UNIFICAR-PROJETOS.33 — Decidir o lugar do clone AutoSwarm/ (fica fora do Git do dashboard)
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.6).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.6
- **Descrição:** Decidir o lugar do clone AutoSwarm/ (fica fora do Git do dashboard). Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** decisão nas Decisões.

### UNIFICAR-PROJETOS.34 — Migrar o quadro tasks/ e as regras .claude/rules/tasks do COORDENACAO
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.6).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.6
- **Descrição:** Migrar o quadro tasks/ e as regras .claude/rules/tasks do COORDENACAO. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** linhas migradas no quadro de destino.


### Fase D — Integração

### UNIFICAR-PROJETOS.35 — Menu unificado: abas novas em assets/js/menu.js
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.15, UNIFICAR-PROJETOS.16, UNIFICAR-PROJETOS.19).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.15, UNIFICAR-PROJETOS.16, UNIFICAR-PROJETOS.19
- **Descrição:** Menu unificado: abas novas em assets/js/menu.js. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** `node --check` nos JS e leitura.

### UNIFICAR-PROJETOS.36 — Atualizar projetos.json para listar os novos conteúdos
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.35).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.35
- **Descrição:** Atualizar projetos.json para listar os novos conteúdos. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** `node` abre o JSON sem erro.

### UNIFICAR-PROJETOS.37 — Resolver conflitos de nomes de arquivos e de classes CSS (prefixos)
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.14, UNIFICAR-PROJETOS.27).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.14, UNIFICAR-PROJETOS.27
- **Descrição:** Resolver conflitos de nomes de arquivos e de classes CSS (prefixos). Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** `grep` de nomes repetidos.

### UNIFICAR-PROJETOS.38 — Ajustar caminhos relativos e links das páginas migradas
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.35, UNIFICAR-PROJETOS.37).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.35, UNIFICAR-PROJETOS.37
- **Descrição:** Ajustar caminhos relativos e links das páginas migradas. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** `grep` de links quebrados.

### UNIFICAR-PROJETOS.39 — Script que roda `autoswarm calls` e grava autoswarm-calls.json
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.32).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.32
- **Descrição:** Script que roda `autoswarm calls` e grava autoswarm-calls.json. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** saída JSON válida.

### UNIFICAR-PROJETOS.40 — Página AUTOSWARM-CALLS.html no molde de JEV-AI-CALLS.html
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.39, UNIFICAR-PROJETOS.35).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.39, UNIFICAR-PROJETOS.35
- **Descrição:** Página AUTOSWARM-CALLS.html no molde de JEV-AI-CALLS.html. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** `node --check` nos JS e leitura.

### UNIFICAR-PROJETOS.41 — Cruzar chamadas do AutoSwarm com as tarefas do quadro (ID no prompt)
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.40).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.40
- **Descrição:** Cruzar chamadas do AutoSwarm com as tarefas do quadro (ID no prompt). Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura do código.

### UNIFICAR-PROJETOS.42 — Aplicar SOLID, limite de 45 linhas por função e 1000 por arquivo nos JS/Python migrados
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.38).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.38
- **Descrição:** Aplicar SOLID, limite de 45 linhas por função e 1000 por arquivo nos JS/Python migrados. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** contagem de linhas.

### UNIFICAR-PROJETOS.43 — Documentar as funções migradas (JSDoc e docstring)
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.42).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.42
- **Descrição:** Documentar as funções migradas (JSDoc e docstring). Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura.


### Fase E — Verificação

### UNIFICAR-PROJETOS.44 — Rodar `node --check` em todos os JS do dashboard
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.43).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.43
- **Descrição:** Rodar `node --check` em todos os JS do dashboard. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** saída sem erro.

### UNIFICAR-PROJETOS.45 — Conferir links e caminhos por leitura e `grep`
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.38).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.38
- **Descrição:** Conferir links e caminhos por leitura e `grep`. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** nenhum link quebrado.

### UNIFICAR-PROJETOS.46 — Conferir que o kanban e o globo atuais seguem intactos (diff dos arquivos antigos)
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.38).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.38
- **Descrição:** Conferir que o kanban e o globo atuais seguem intactos (diff dos arquivos antigos). Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** diff sem mudança nos arquivos antigos.

### UNIFICAR-PROJETOS.47 — Conferir privacidade: sem segredo, token ou caminho pessoal antes de publicar
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.38).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.38
- **Descrição:** Conferir privacidade: sem segredo, token ou caminho pessoal antes de publicar. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** `grep` de padrões de segredo.


### Fase F — Fechamento

### UNIFICAR-PROJETOS.48 — Atualizar o README e o CLAUDE.md do dashboard
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.44, UNIFICAR-PROJETOS.45, UNIFICAR-PROJETOS.46, UNIFICAR-PROJETOS.47).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.44, UNIFICAR-PROJETOS.45, UNIFICAR-PROJETOS.46, UNIFICAR-PROJETOS.47
- **Descrição:** Atualizar o README e o CLAUDE.md do dashboard. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura.

### UNIFICAR-PROJETOS.49 — Atualizar o mapa C:\fontes\CLAUDE.md e AGENTS.md
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.48).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.48
- **Descrição:** Atualizar o mapa C:\fontes\CLAUDE.md e AGENTS.md. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura.

### UNIFICAR-PROJETOS.50 — Atualizar o portal index.html da raiz e seus dados
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.48).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.48
- **Descrição:** Atualizar o portal index.html da raiz e seus dados. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura.

### UNIFICAR-PROJETOS.51 — Atualizar o índice C:\fontes\tasks\STATUS.md
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.48).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.48
- **Descrição:** Atualizar o índice C:\fontes\tasks\STATUS.md. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura.

### UNIFICAR-PROJETOS.52 — Conferir vercel.json e .vercelignore do rules-ai (regra C46)
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.48).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.48
- **Descrição:** Conferir vercel.json e .vercelignore do rules-ai (regra C46). Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura.

### UNIFICAR-PROJETOS.53 — Commit e push no rules-ai (e na raiz para o que ficar nela)
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.47, UNIFICAR-PROJETOS.48).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.47, UNIFICAR-PROJETOS.48
- **Descrição:** Commit e push no rules-ai (e na raiz para o que ficar nela). Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** commits na main.

### UNIFICAR-PROJETOS.54 — Arquivar as pastas antigas em _backup (só com o 'sim' do usuário)
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.53).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.53
- **Descrição:** Arquivar as pastas antigas em _backup (só com o 'sim' do usuário). Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** pastas movidas, nada apagado.

### UNIFICAR-PROJETOS.55 — Tirar os projetos antigos do índice e do mapa
**Próximo passo:** aguardar o "sim" do usuário ao plano; depois reservar (livre, dependências: UNIFICAR-PROJETOS.54).
- **Nível:** (a classificar pelo Jev)
- **Modelo:** (a classificar pelo Jev)
- **Effort:** (a classificar pelo Jev)
- **JEV-AI-SUGGESTION:** NAO
- **Dependências:** UNIFICAR-PROJETOS.54
- **Descrição:** Tirar os projetos antigos do índice e do mapa. Origem e destino conforme o mapa da etapa; origens nunca alteradas.
- **Critérios de Aceitação:** feito o que o título diz, sem tocar nos arquivos de origem (INV-1).
- **Verificação:** leitura.
