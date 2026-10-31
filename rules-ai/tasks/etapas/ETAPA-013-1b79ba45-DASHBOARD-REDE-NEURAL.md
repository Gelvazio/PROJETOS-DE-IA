## Etapa 013-1b79ba45 — DASHBOARD-REDE-NEURAL: visualização 3D das camadas de uma rede neural

> ❌ **Tarefa cancelada pelo usuário em 2026-10-18 18:58** ("ESTA TAREFA DASHBOARD-REDE-NEURAL, PODE EXCLUIR"). A subtarefa .4 não será feita; o que já foi entregue continua no repositório.

**Tarefa:** DASHBOARD-REDE-NEURAL · **Pedido em:** 2026-10-17 17:19 · **Criada por:** Claude Code (Opus 5.5) (local · main)
**Pedido:** "crie 1 task, pra criar isso em *rules-ai* numa pasta de nome dashboard", depois da
análise do reel `instagram.com/techwith.ram/reel/DeIyAuUJ_eb` ("3D visualisation of layers of
Neural Network", com o cálculo dos pesos em cada nó oculto e a probabilidade na saída).
**Objetivo:** criar em `C:\fontes\rules-ai\dashboard\` uma página estática com Three.js que mostra
uma rede neural em 3D, propaga o sinal camada por camada, explica o cálculo de cada neurônio e
mostra as probabilidades da saída.

> 🟠 **Tarefa grande** (estrutura nova com vários arquivos ligados e cena 3D inteira): o plano é
> esta etapa e a execução **só começa depois do "sim" do usuário**.

### Escopo

**Entra:**
- Pasta `dashboard/` com `index.html` (só estrutura + import map), `assets/css/` e `assets/js/`
  (ES modules, sem bundler e sem `package.json`), e um `README.md` curto (como abrir).
- Rede totalmente conectada fixa: 4 entradas → 6 → 5 ocultos → 3 saídas; pesos e vieses gerados
  com **semente fixa** (mesmo resultado a cada abertura).
- Propagação: `z = Σ(entrada × peso) + viés`, ReLU nas ocultas e softmax na saída.
- Cena: neurônios como esferas, uma camada atrás da outra; ligações com cor pelo sinal do peso
  (azul negativo, vermelho positivo) e espessura/opacidade pelo tamanho; botão **Propagar** anima
  as camadas acendendo em sequência; `OrbitControls`; rótulos com `CSS2DRenderer`.
- Clique num neurônio oculto ou de saída → painel 2D com o cálculo completo daquele nó.
- Painel com os 4 valores de entrada editáveis e as barras de probabilidade das 3 saídas.
- Three.js `0.170.0` exato pelo `cdn.jsdelivr.net` (nunca `@latest`); cores e medidas em
  constantes nomeadas e tokens `:root`.

**Não entra:**
- Treinar rede de verdade, ler pesos de arquivo externo (fica como ideia para depois).
- Qualquer chamada a API de IA, token, chave, login ou banco.
- Efeitos pesados (bloom, partículas): só se o usuário pedir numa tarefa nova.
- Publicar (GitHub Pages) e mexer em outras pastas do `rules-ai`.

### Critério de pronto

- `node --check` passa em todo `.js`; `grep -rniE "anthropic|openai|gemini|api[_-]?key|process\.env" dashboard`
  não acha nada; os únicos hosts de rede são `cdn.jsdelivr.net`.
- O modelo da rede roda com `node` (sem DOM) e imprime ativações e probabilidades que somam 1.
- Limites do código: arquivo ≤ 1000 linhas, função ≤ 45, linha ≤ 100, JSDoc, nomes em português.
- O visual (cores, animação, clique) é conferido **pelo usuário** no navegador
  (`python -m http.server 8080` dentro de `dashboard/`), porque a IA não abre navegador.

### Riscos

| Risco | Plano B |
|---|---|
| ES modules não abrem com duplo clique (`file://`) | README explica o `python -m http.server`; sem servidor de desenvolvimento |
| Muitas linhas (4·6 + 6·5 + 5·3 = 69) pesam ou poluem a cena | Opacidade pelo peso e esconder pesos pequenos com um botão |
| `dist` está no `.gitignore` do `rules-ai` | A pasta se chama `dashboard`, não cai no ignore; conferir com `git check-ignore` |

### DASHBOARD-REDE-NEURAL.1 — Estrutura da pasta `dashboard/`

**Próximo passo:** — (entregue).

- **Nível:** LEVE — HTML de estrutura, CSS de tokens e `.md`, sem lógica.
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **Descrição:** `dashboard/index.html` (import map do `three@0.170.0` e addons, áreas da cena e do
- **JEV-AI-SUGGESTION:** NAO
  painel, sem CSS/JS inline), `dashboard/assets/css/base.css` (tokens `:root`, layout),
  `dashboard/assets/css/painel.css` e `dashboard/README.md` (o que é e como abrir).
- **Critérios de aceitação:** sem `style=""`/`onclick`; versão exata do Three.js; README com o
  comando do servidor estático.
- **Entrega (2026-10-17 17:23, Haiku 5.5 · executor-leve; líder Opus 5.5):** `dashboard/index.html`, `assets/css/base.css`, `assets/css/painel.css`, `README.md`.
- **Verificação (líder):** import map com `three@0.170.0` exato; sem `style=""`/`onclick`; nenhuma linha > 100; `git check-ignore` não ignora a pasta.

### DASHBOARD-REDE-NEURAL.2 — Modelo da rede (pesos e propagação)

**Próximo passo:** — (entregue).

- **Nível:** MEDIO — lógica em JS em 1 a 3 arquivos, sem DOM.
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Descrição:** `assets/js/config/rede.js` (tamanhos das camadas, semente, constantes) e
- **JEV-AI-SUGGESTION:** NAO
  `assets/js/rede/rede-neural.js` (gerador com semente, pesos/vieses, `propagar(entradas)` que
  devolve, por camada e por neurônio, `z`, ativação e as parcelas `entrada × peso`; ReLU e
  softmax).
- **Critérios de aceitação:** roda com `node`; probabilidades somam 1; mesma semente = mesmos pesos.
- **Entrega (2026-10-17 17:24, Sonnet 5.5 · executor-medio; líder Opus 5.5):** `assets/js/config/rede.js` e `assets/js/rede/rede-neural.js` (`criarRede`, `propagar`, `relu`, `softmax`, gerador mulberry32).
- **Verificação (líder):** `node --check` ok; conferência com `node` fora do repositório: probabilidades [0,378; 0,355; 0,267], soma 1; mesma semente = mesmos pesos; erros em português para tamanhos e entradas inválidos.

### DASHBOARD-REDE-NEURAL.3 — Cena 3D com propagação animada

**Próximo passo:** — (entregue 2026-10-18).

- **Nível:** PESADO — cena 3D inteira, mais de 3 arquivos ligados.
- **Modelo:** só Opus 5.5+ ou Fable — nunca outro
- **Effort:** high
- **Descrição:** `assets/js/cena/` (renderer, câmera, luzes, `OrbitControls`, neurônios, ligações,
- **JEV-AI-SUGGESTION:** NAO
  rótulos `CSS2DRenderer`, animação camada a camada com `requestAnimationFrame`, seleção por clique
  com `Raycaster`), `assets/js/config/cores.js` e `assets/js/principal.js` ligando modelo → cena.
- **Critérios de aceitação:** `node --check` em todos; a cena só lê o modelo (não calcula nada);
  clique emite o neurônio escolhido para o painel.
- **Entrega (2026-10-18, Claude Code (Opus 5.5) (local · main)):** `assets/js/config/cores.js`,
  `assets/js/config/cena.js`, `assets/js/cena/` (`tema.js`, `palco.js`, `neuronios.js`,
  `ligacoes.js`, `animacao.js`, `selecao.js`, `cena-rede.js`), `assets/js/principal.js`,
  `assets/css/cena.css` e o link dele no `index.html`.
- **Contrato para o painel (.4):** o `principal.js` dispara em `window` `rede:propagada`
  (`detail = { rede, resultado }`) e `rede:neuronio-selecionado`
  (`detail = { indiceCamada, indiceNeuronio, nomeCamada, neuronio }`, com `parcelas`, `vies`, `z`
  e `ativacao` vindos de `propagar()`); `obterEstado()` devolve o último resultado. O
  `principal.js` já lê os 4 campos e liga o botão Propagar; o painel só desenha.
- **Verificação:** `node --check` em todos os `.js` novos; nenhuma linha > 100; grep de
  chaves/APIs vazio; simulação com `node` (Three.js substituído por um stub, fora do repositório):
  a entrada acende em 0 ms, a oculta 1 aos 600 ms e a saída aos 1800 ms, os rótulos finais são
  0,378 · 0,355 · 0,267 (iguais ao modelo, soma 1) e o pulso das ligações volta à opacidade base.
  Visual (cores, giro e clique) **não** conferido no navegador (regra): o usuário confere com
  `python -m http.server 8080` em `dashboard/`.

### DASHBOARD-REDE-NEURAL.4 — Painel 2D (cálculo, entradas e probabilidades)

> ❌ **Cancelada em 2026-10-18 18:58** pelo usuário ("ESTA TAREFA DASHBOARD-REDE-NEURAL, PODE EXCLUIR"), junto com a tarefa-mãe. Não será feita.

**Próximo passo:** criar `assets/js/tela/painel.js` ouvindo os eventos da `.3` (contrato na seção da `.3`).

- **Nível:** MEDIO — tela em JS, 1 a 3 arquivos.
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Descrição:** `assets/js/tela/painel.js`: campos dos 4 valores de entrada, botão Propagar,
- **JEV-AI-SUGGESTION:** NAO
  cálculo detalhado do neurônio clicado (`Σ(entrada × peso) + viés = z → ativação`) e barras de
  probabilidade das saídas.
- **Critérios de aceitação:** sem regra de cálculo no painel (usa o resultado do modelo); números
  com 3 casas; `node --check` passa.

### DASHBOARD-REDE-NEURAL.5 — Aceite do usuário

**Próximo passo:** esperar a `.4`; o usuário abre a página e confere o visual.

- **Nível:** —
- **Modelo:** Usuário · effort low
- **Descrição:** conferir no navegador cores, animação, clique e probabilidades.
- **JEV-AI-SUGGESTION:** NAO

### DASHBOARD-REDE-NEURAL.6 — Coletor Python dos links do `dashboard/CLAUDE.md`

**Status:** ✅ entregue 2026-10-17 15:25. Coleta de 15:22: L04, L05, L06, L08, L09 e L10 acessados; L07 bloqueado por verificação anti-bot; L01–L03 manuais; 403 nas extras do Canva; cotação 5,0627.

- **Nível:** MEDIO — script Python com 4 arquivos pequenos, roteiro pronto no `WEB-SCRAP.md`.
- **Modelo:** executada pelo Opus 5.5 a pedido do usuário
- **Effort:** medium
- **Descrição:** `dashboard/scripts/` com `config_coleta.py`, `extrator_pagina.py`, `cotacao.py`,
- **JEV-AI-SUGGESTION:** NAO
  `coletar.py` e `requirements.txt`; Playwright para os sites em JavaScript (L04–L10), mais as
  páginas de preço/API/termos achadas; cotação USD-BRL da AwesomeAPI. L01–L03 (Instagram) ficam
  `nao_verificado` (coleta manual). Saída em `dashboard/scripts/saida/coleta.json` (fora do Git).
- **Critérios de aceitação:** `py_compile` passa; a execução grava um JSON válido; falhas
  (timeout, 403, captcha) ficam registradas sem burlar proteção.

### DASHBOARD-REDE-NEURAL.7 — Aba "Ferramentas de IA 3D" no `index.html`

**Status:** ✅ entregue 2026-10-17 15:44. Aba com resumo (coleta, cotação, 10/10 links com dados), tabela comparativa, cartões L04–L10 e reels L01–L03 com legenda; aba da rede neural intacta.

- **Nível:** MEDIO — gerador Python + tela em JS/CSS.
- **Modelo:** executada pelo Opus 5.5 a pedido do usuário
- **Effort:** medium
- **Descrição:** `scripts/gerar_dados_painel.py` lê `scripts/saida/coleta.json` e as páginas salvas em
- **JEV-AI-SUGGESTION:** NAO
  `MODELOS-DE-IA/` e grava `assets/js/dados/ferramentas.js` (sem o texto bruto das páginas);
  `assets/js/ferramentas/` desenha a aba (cards por link, preços em US$ e R$, formatos, reels).
  A aba da rede neural continua igual.
- **Critérios de aceitação:** `py_compile` e `node --check` passam; a aba abre sem depender do
  `principal.js` (cena 3D, `.3`).

### DASHBOARD-REDE-NEURAL.8 — Menu "3D GRAPHS AI" e pasta `dashboard/graphs/`

**Status:** ✅ entregue 2026-10-17 15:53. Servidor testado sem chave real (rotas, bloqueio de `.env`/`.py`, confirmação de custo, `task_id` inválido); geração real depende da chave do usuário.

- **Nível:** PESADO — pasta nova, servidor + integração com API paga + cena 3D.
- **Modelo:** Opus 5.5 (a pedido do usuário)
- **Effort:** high
- **Descrição:** botão "3D GRAPHS AI" no cabeçalho do `index.html` (link na mesma aba) para
- **JEV-AI-SUGGESTION:** NAO
  `graphs/index.html`: visualizador Three.js 0.170.0 de GLB, campo de prompt e botão Gerar
  (texto → 3D por API paga, integração depois removida), progresso e galeria. `graphs/servidor.py` (biblioteca padrão) serve o dashboard e
  repassa as chamadas com a chave do `.env` (fora do Git); GLB salvos em
  `graphs/modelos/` (fora do Git). Sem chave: a página abre, mostra a galeria e um exemplo
  procedural, e o Gerar fica desligado.
- **Critérios de aceitação:** `py_compile` e `node --check` passam; servidor sobe e responde
  `/api/estado` sem chave; nenhuma chave no front-end; confirmação de custo antes de gerar.
- **Pendente:** URL base e auth conferidas em 2026-10-17 16:18 (401 com chave falsa); corpo da tarefa e campos
  de saída a conferir na primeira geração com chave válida.

### DASHBOARD-REDE-NEURAL.9 — Ícone de configuração e chave no `localStorage`

**Status:** ✅ entregue 2026-10-17 16:18. Testado: chave do cabeçalho tem prioridade, `.env` como alternativa, chave malformada ignorada, chave não aparece no log; o serviço real responde 401 a chave falsa (URL base e auth confirmadas).

- **Nível:** MEDIO — modal em JS + ajuste no servidor.
- **Modelo:** Opus 5.5 (a pedido do usuário)
- **Effort:** medium
- **Descrição:** engrenagem no cabeçalho de `graphs/index.html` abre um `<dialog>` para salvar,
- **JEV-AI-SUGGESTION:** NAO
  mostrar/ocultar e remover a chave no `localStorage`. O front manda a chave num
  cabeçalho só para o servidor local, que a repassa; sem ela, vale o `.env`.
- **Critérios de aceitação:** `py_compile` e `node --check` passam; o servidor usa a chave do
  cabeçalho e cai no `.env` sem ela; a chave nunca aparece em resposta nem em log.

### DASHBOARD-REDE-NEURAL.10 — Pasta `dashboard/prompts/`

**Status:** ✅ entregue 2026-10-17 16:21.

- **Nível:** LEVE — 1 pasta com README (o Git não versiona pasta vazia).
- **Descrição:** pasta para guardar os prompts do dashboard, um `.md` por prompt.
- **JEV-AI-SUGGESTION:** NAO

### DASHBOARD-REDE-NEURAL.11 — Um prompt por imagem em `dashboard/prompts/`

**Status:** ✅ entregue 2026-10-17 16:31.

- **Nível:** MEDIO — ler 4 imagens e escrever 4 prompts.
- **Descrição:** `MODELO-3D-REDE-NEURAL-01.md` a `04.md`, cada um com a descrição da imagem e um
- **JEV-AI-SUGGESTION:** NAO
  prompt pronto para recriar a tela como página HTML: 01 orquestrador de agentes em anel; 02
  infográfico "1 agente no lugar de 25 assentos"; 03 painel de robô com toro 3D de partículas
  (Three.js); 04 animação do infográfico 02. Nomes genéricos e dados fictícios com aviso. As
  imagens `.png` (capturas de reels de terceiros) ficam fora do commit.

### DASHBOARD-REDE-NEURAL.12 — Prompts independentes

**Status:** ✅ entregue 2026-10-17 16:34.

- **Nível:** LEVE — ajuste de 2 prompts e do README da pasta.
- **Descrição:** nenhum prompt cita outro prompt nem outra imagem. O 04 foi reescrito como
- **JEV-AI-SUGGESTION:** NAO
  infográfico completo com foco na animação da rede do agente; o 02 perdeu a menção ao 04.

### DASHBOARD-REDE-NEURAL.15 — Correção: ⚙ na cena e validação da chave

**Status:** ✅ entregue 2026-10-17 16:50.

- **Problema:** o botão Gerar não habilitava. O servidor local não estava rodando, a `cena.html`
- **JEV-AI-SUGGESTION:** NAO
  não tinha a ⚙, e a validação da chave (`[\w.-]{8,200}`) recusaria chaves com `+`, `/` ou `=`.
- **Correção:** ⚙ e modal na `cena.html` (o botão "Gerar os que faltam" liga ao salvar a chave,
  sem recarregar); validação no modal e no servidor trocada por ASCII visível sem espaço
  (8 a 300 caracteres). Servidor reiniciado na porta 8080.

### DASHBOARD-REDE-NEURAL.17 — Saldo de créditos no cabeçalho

**Status:** ✅ entregue 2026-10-17 16:57.

- **Nível:** MEDIO — rota do servidor + módulo `saldo.js` nas duas páginas.
- **Descrição:** `/api/saldo` devolve `{saldo, congelado}` (lidos de `balance` e `frozen` da V3);
- **JEV-AI-SUGGESTION:** NAO
  `assets/js/saldo.js` mostra "Saldo: N créditos" ao lado da ⚙ em `index.html` e `cena.html`,
  com o valor em US$ no título; atualiza ao abrir, ao salvar a chave e depois de cada geração.
  Testado sem chave e com chave falsa; o formato com saldo real depende de uma conta com créditos.

### DASHBOARD-REDE-NEURAL.18 — Página "Agentes ao vivo" (tarefas reais em 3D, com atraso)

**Status:** ✅ entregue 2026-10-17 17:37.

- **Nível:** PESADO — só Opus 5.5+ ou Fable · effort high.
- **Objetivo:** mostrar na interface 3D o trabalho real dos agentes, ligado às tarefas do
- **JEV-AI-SUGGESTION:** NAO
  `rules-ai/tasks/STATUS.md`, "ao vivo" com atraso configurável (padrão 30 s).
- **Back-end (Python, biblioteca padrão):**
  - `graphs/quadro_tarefas.py` novo: `ler_quadro(caminho)` lê a tabela "📌 Tarefas" e devolve
    `tarefa`, `titulo`, `pai`, `nivel` (LEVE/MEDIO/PESADO/USUARIO), `status` (pendente,
    progresso, concluido, bloqueado, aguardando), `em_uso_por`, `desde`, `global`.
  - `config_graphs.py`: `ARQUIVO_QUADRO`, `INTERVALO_COLETA_SEGUNDOS = 10`, `atraso_agentes()`
    (`ATRASO_AGENTES` no `.env`, padrão 30; acrescentar no `.env.example`).
  - `servidor.py`: rota `GET /api/agentes` (só leitura) com `atualizado_em`, `atraso_padrao`,
    `intervalo` e `tarefas`.
- **Front-end (ES modules, sem bundler):**
  - `graphs/agentes.html` nova (estrutura da `cena.html`) + link no menu do `graphs/index.html`.
  - `assets/js/api.js`: `lerAgentes()`.
  - `assets/js/agentes.js`: entrada da página (base de `visualizador.js`, polling de 10 s, laço).
  - `assets/js/agentes/fila-atrasada.js`: `compararRetratos` → eventos (`nova`, `reservada`,
    `concluida`, `bloqueada`, `aguardando`, `liberada`) e fila com `mostrarEm = recebido + atraso`.
  - `assets/js/agentes/cena-agentes.js`: trilhas por status, tarefas como blocos com rótulo
    (cor pelo nível), agentes Haiku/Sonnet/Opus reaproveitando as formas/GLB do `prompt-04.json`
    via `criarObjeto`; reserva = agente voa até o bloco e liga uma linha; conclusão = pulso verde.
    `prefers-reduced-motion` sem animação.
  - `assets/js/agentes/hud-agentes.js`: contadores, últimos eventos (hora do `desde`), seletor
    de atraso (0/10/30/60/120 s, `localStorage` com try/catch) e selo "ao vivo −30 s".
- **Fora do escopo:** outros quadros, transcripts das sessões, Supabase/Realtime, modelos 3D novos
  para os agentes.
- **Fidelidade:** a cena só vê o que os agentes registram no quadro (granularidade do `STATUS.md`).
- **Verificação:** `ler_quadro` via `python -c` confere contagem e campos; `curl
  localhost:8080/api/agentes` devolve JSON; `node --check` nos `.js`; `compararRetratos` testado
  com `node`; limites de 1000 linhas por arquivo e 45 por função. Visual conferido pelo usuário
  (`.19`). Reiniciar o `servidor.py` depois desta versão.

- **Entregue (2026-10-17 17:37), com os pedidos feitos durante a execução:**
  - Nome do agente como no quadro: um personagem por nome da coluna "Em uso por", com o nome
    escrito em cima ("Claude Code" / "Opus 5.5 · local · main"); forma e cor pelo modelo citado.
  - `agentes.html` em tela inteira, só com o menu em cima (sem títulos nem textos); contagem,
    atraso e eventos ficam sobre a cena.
  - `assets/js/menu.js`: menu único (Dashboard, 3D GRAPHS AI, Cena do prompt 04, Agentes ao vivo)
    usado em `index.html`, `cena.html` e `agentes.html`, com a página aberta destacada.
  - Os personagens usam só formas simples (os modelos GLB gerados foram deixados de lado por serem
    pesados demais: 1,4 milhão de triângulos cada).
  - Conferido: `node --check` em todos os `.js`, `py_compile`, fila testada com `node`
    (nada sai aos 29 s, tudo sai aos 30 s), servidor de teste na porta 8091 com `/api/agentes`
    devolvendo as 36 linhas do quadro e `.py` bloqueado (404).

### DASHBOARD-REDE-NEURAL.20 — Globo das pendentes com agentes em órbita

**Status:** ✅ entregue 2026-10-17 17:41.

- **Nível:** PESADO — só Opus 5.5+ ou Fable · effort high.
- **Pedido:** "as tarefas pendentes devem ser um globo no centro, e os agentes devem ficar ao redor,
- **JEV-AI-SUGGESTION:** NAO
  como que orbitando esta esfera maior, com as tarefas que estão fazendo".
- **Entregue:** `assets/js/agentes/cena-agentes.js` reescrito (mesma interface: `sincronizar`,
  `aplicarEvento`, `desenhar`, `contagem`). Globo translúcido girando, com as pendentes
  distribuídas na superfície (espiral de Fibonacci); bloqueadas piscam em vermelho e as que aguardam
  o usuário em amarelo. Cada agente orbita o globo na própria órbita (raio e inclinação alternados),
  com as tarefas em andamento girando em volta dele, ligadas por linha. Concluídas num anel externo
  inclinado, sem rótulo, com placa "Concluídas · N". Cada cartão persegue a sua vaga a cada quadro:
  reservar e concluir viram voos. Câmera recuada; movimento reduzido congela as órbitas.
- **Conferido:** `node --check`; o visual fica para o aceite (`.19`).

### DASHBOARD-REDE-NEURAL.21 — Correção: rótulos nítidos

**Status:** ✅ entregue 2026-10-17 17:49.

- **Problema:** "os textos estão foscos". Os rótulos eram texturas de canvas (512×128) esticadas
- **JEV-AI-SUGGESTION:** NAO
  em sprites; com a distância e o zoom, o texto borrava.
- **Correção:** `assets/js/agentes/rotulos.js` passa a criar `CSS2DObject` (HTML); `agentes.js`
  ganha a camada `CSS2DRenderer` sobre o canvas (sem capturar o mouse) e a desenha a cada quadro;
  estilos `.rotulo3d` e `.camada-rotulos` no `graphs.css`. Mesma interface (`criarRotulo`,
  `descartarRotulo`), então a cena e os personagens não mudaram.
- **Conferido:** `node --check`; `CSS2DRenderer.js` do `three@0.170.0` responde 200 no jsDelivr.

### DASHBOARD-REDE-NEURAL.22 — Percentual na cabeça do agente

**Status:** ✅ entregue 2026-10-17 17:55.

- **Pedido:** "colocar na cabeça de cada agente que está trabalhando, o percentual que já fez da
- **JEV-AI-SUGGESTION:** NAO
  tarefa". O quadro não guardava percentual; decisão do usuário: o agente escreve no quadro, regra
  só do `rules-ai`.
- **Regra C31 (`AGENTS.md`):** ` · NN%` no fim da célula "Em uso por" (0% ao reservar, atualizar a
  cada avanço, `—` ao concluir).
- **Código:** `quadro_tarefas.py` lê o percentual (campo `progresso`, `None` quando não informado) e
  o tira do nome do agente; a fila gera o evento `avancou` quando só o percentual muda; cada agente
  que trabalha ganha um selo acima do nome com barra e "NN%" (uma linha por tarefa, com o final do
  id, se tiver mais de uma; "—%" quando o agente não informou); o histórico mostra "avançou X (NN%)".
- **Conferido:** `node --check`; fila com `node` (0% → 40% gera `avancou:40`); `/api/agentes` no
  servidor reiniciado devolve `.22` com 80% (esta própria tarefa, atualizada pela regra) e `.3` sem
  percentual.

### DASHBOARD-REDE-NEURAL.23 — Linha do projeto atual no menu

**Status:** ✅ entregue 2026-10-17 17:58.

- **Nível:** LEVE · effort low.
- **Entregue:** `assets/js/menu.js` ganha a lista `PROJETOS` (hoje só "Rules Ai", o atual) e põe
- **JEV-AI-SUGGESTION:** NAO
  uma linha nova acima do menu das páginas, nas 3 páginas, com o projeto atual em destaque. Para
  outro projeto, basta uma linha em `PROJETOS`. O `graphs.css` deixou de usar alturas fixas de
  cabeçalho (`--altura-cabecalho`, `--altura-barra`): o corpo virou coluna flexível e a área
  principal ocupa o resto da tela, então o menu em 2 linhas não empurra a cena para fora.
- **Conferido:** `node --check`; visual no aceite (`.19`).

### DASHBOARD-REDE-NEURAL.24 — Menu de projetos troca o quadro lido

**Status:** ✅ entregue 2026-10-17 18:05.

- **Servidor:** `/api/projetos` lista as pastas de `C:\fontes` com `tasks\STATUS.md` (nunca as
- **JEV-AI-SUGGESTION:** NAO
  `DEMAIS-PROJETOS-*`, regras C20 e C23), com nome legível ("rules-ai" → "Rules Ai"); 19 projetos
  hoje. `/api/agentes?projeto=<pasta>` lê o quadro do projeto pedido (padrão: `rules-ai`); id fora
  da lista é recusado (testado com `../rules-ai` e `DEMAIS-PROJETOS-NAO-MEXER-AGORA`).
- **Leitor:** `quadro_tarefas.py` acha as colunas pelo nome do cabeçalho (os `dashboard-ai-*` e o
  `testes-de-frontend` não têm "Modelo"; os do `aulasenai` têm "Verificado"). Os 19 quadros leem.
- **Menu:** `menu.js` carrega os projetos do servidor (sem servidor, fica só "Rules Ai"); clicar
  recarrega a página com `?projeto=`, e os links das páginas levam o parâmetro junto.
- **Quadros grandes:** o `aulasenai` tem 711 pendentes. Acima de 40 pendentes no globo, as comuns
  ficam sem rótulo (bloqueadas e aguardando mantêm) e os cartões encolhem; geometria compartilhada.

### DASHBOARD-REDE-NEURAL.25 — Mapa mental (modelo.png)

**Status:** ✅ entregue 2026-10-17 18:05.

- **Pedido:** seguir `dashboard/prompts/modelo.png` (mapa mental): globo girando no centro e os
- **JEV-AI-SUGGESTION:** NAO
  agentes espalhados em volta; "os agentes não giram, apenas apontam para o globo".
- **Entregue:** `assets/js/agentes/galhos.js` (novo) com a geometria do mapa: agentes parados numa
  elipse em volta do globo (o primeiro em cima, à esquerda), galho grosso e curvo da cor do agente
  saindo da superfície do globo até ele, e as tarefas do agente abertas em leque para fora, em
  ramos finos curvos. `cena-agentes.js` usa essas posições no lugar das órbitas; concluídas num anel
  colado ao globo (raio 4,2) com a placa embaixo; câmera de frente.
- **Conferido:** `node --check`; servidor reiniciado, `galhos.js` servido (200). Visual no aceite.

### DASHBOARD-REDE-NEURAL.26 — Menu enxuto no agentes.html

**Status:** ✅ entregue 2026-10-17 18:07.

- **Nível:** LEVE · effort low.
- **Entregue:** `menu.js` aceita `data-menu-ocultar="<href> <href>"` no `<nav data-menu>`; o
- **JEV-AI-SUGGESTION:** NAO
  `agentes.html` esconde Dashboard, 3D GRAPHS AI e Cena do prompt 04 (fica a linha dos projetos e
  "Agentes ao vivo"). `index.html` e `cena.html` seguem com o menu completo.
- **Conferido:** `node --check`.

### DASHBOARD-REDE-NEURAL.27 — Globo menor, agentes afastados e fio até cada tarefa

**Status:** ✅ entregue 2026-10-17 18:08.

- **Entregue:** globo com raio 2 (era 3) e anel das concluídas com raio 2,9 (era 4,2); agentes
- **JEV-AI-SUGGESTION:** NAO
  numa elipse maior (9,6 × 5,8, era 7,2 × 4,4) e ramos de 2,4; câmera recuada (z = 23). Cada tarefa
  em andamento ganha um fio fino e claro (`criarFio`/`atualizarFio` em `galhos.js`) da superfície do
  globo até ela, além do ramo do agente. Com o globo menor, o limite de rótulos no globo caiu para
  25 pendentes e os cartões encolhem a partir de 27.
- **Conferido:** `node --check`.

### DASHBOARD-REDE-NEURAL.19 — Aceite do usuário
- **JEV-AI-SUGGESTION:** NAO

**Status:** 👀 aguardando o usuário (reiniciar o `servidor.py` antes). O usuário abre `http://localhost:8080/graphs/agentes.html`, muda o status
de uma tarefa no quadro e confere a animação cerca de 30 s depois.

## Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-17 17:19 | Tarefa criada só com o plano; execução depende do "sim" do usuário | Claude Code (Opus 5.5) | Tarefa grande (estrutura nova, cena 3D inteira) |
| 2026-10-17 17:21 | Plano aprovado; execução pelo líder Opus 5.5 com agentes por nível (Haiku .1, Sonnet .2 e .4, Opus .3) | Gelvazio | "sim, aprovo o plano da DASHBOARD-REDE-NEURAL (etapa 013)" |
| 2026-10-17 15:03 | `.6` criada (C26): coletor Python dos links do `dashboard/CLAUDE.md` | Gelvazio | "crie 1 pasta scripts nele crie e rode o app em python que coleta os dados dos sites solicitados" |
| 2026-10-17 15:37 | `.7` criada (C26): aba de ferramentas no `index.html` | Gelvazio | "leia coleta.json e atualize o dashboard em index.html com as informacoes..." |
| 2026-10-17 16:21 | `.10` criada (C26): pasta `dashboard/prompts/` | Gelvazio | "crie 1 nova pasta de nome prompts" |
| 2026-10-17 16:31 | `.11` criada (C26): um prompt por imagem em `dashboard/prompts/` | Gelvazio | "CRIE 1 prompt pra cada imagem nela..." |
| 2026-10-17 16:34 | `.12` (C26): prompts independentes | Gelvazio | "cada prompt deve ser unico, e nao referenciar os outros" |
| 2026-10-17 16:50 | `.15` (correção): ⚙ na cena e validação da chave | Gelvazio | "n habilitou" |
| 2026-10-17 16:57 | `.17` (C26): saldo de créditos no cabeçalho | Gelvazio | "sim, mostre o saldo de créditos na página" |
| 2026-10-17 17:10 | `.18` criada (C26) com plano aprovado: fonte só o `rules-ai/tasks/STATUS.md`, atraso configurável (30 s); só registrada no quadro | Gelvazio | "como eu posso usar esta interface em 3D, pra mostrar o trabalho real dos meus agentes..." / "apenas grave a tarefa no quadro de tasks" |
| 2026-10-17 17:37 | `.18` executada; nome do agente nos personagens, tela inteira só com o menu e `menu.js` único | Gelvazio | "execute a tarefa .18" e pedidos durante a execução |
| 2026-10-17 17:41 | `.20` (C26): globo das pendentes no centro, agentes em órbita com as tarefas que fazem, concluídas num anel | Gelvazio | "as tarefas pendentes devem ser um globo no centro..." |
| 2026-10-17 17:49 | `.21` (C26, correção): rótulos em HTML (CSS2DRenderer) no lugar da textura de canvas | Gelvazio | "os textos estão foscos" |
| 2026-10-17 17:55 | `.22` (C26) e regra C31: percentual escrito pelo agente em "Em uso por", mostrado na cabeça dele | Gelvazio | "tem como colocar na cabeça de cada agente..." → "Agente escreve no quadro" / "Só no rules-ai" |
| 2026-10-17 17:58 | `.23` (C26): linha do projeto atual (Rules Ai) acima do menu | Gelvazio | "crie 1 menu em cima em mais 1 linha no menu com o nome do Projeto Atual, sendo este o Rules Ai" |
| 2026-10-17 18:05 | `.24` (C26): menu de projetos troca o quadro lido | Gelvazio | "faça o menu de projetos trocar o quadro lido" |
| 2026-10-17 18:05 | `.25` (C26): mapa mental do `modelo.png`, agentes parados apontando para o globo | Gelvazio | "leia a imagem modelo.png..." / "os agentes não giram, apenas apontam para o globo" |
| 2026-10-17 18:07 | `.26` (C26): agentes.html sem Dashboard, 3D GRAPHS AI e Cena do prompt 04 no menu | Gelvazio | "no arquivo agentes.html, remova os menus..." |
| 2026-10-17 18:08 | `.27` (C26): globo menor, agentes mais afastados, fio do globo até cada tarefa em andamento | Gelvazio | "deixe o globo menor e os agentes mais afastados..." |
