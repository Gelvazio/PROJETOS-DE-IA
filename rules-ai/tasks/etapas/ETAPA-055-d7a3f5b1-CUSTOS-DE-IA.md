## Etapa 055-d7a3f5b1 — CUSTOS-DE-IA: menu "Custos de IA" no dashboard com modelos e custos de Claude, DeepSeek, Codex e Gemini

**Tarefa:** CUSTOS-DE-IA · **Pedido em:** 2026-10-24 08:57 · **Criada por:** Claude Code (Sonnet 5.5) (local · main · rules-ai)
**Pedido:** "crie 1 quadro agora de nome quado-modelos-de-ias.html, e nele coloque os modelos do claude e custos, do deepseek e custos, do codex e custos, do gemini e custos, e estes dados devem vir de um json de nome custos-de-ia.json, os valores devem ser buscados na internet" · "use o visual futurista" (`prompts/VISUAL-FUTURISTA.md`) · "isso deve ser um menu de nome *Custos de IA* no dashboard de tarefas" · "que deve abrir em nova aba o arquivo html de custos"
**Objetivo:** item de menu **Custos de IA** no dashboard que abre em nova aba a página `quadro-modelos-de-ias.html`, com modelos e custos dos quatro fornecedores lidos de `custos-de-ia.json`.

### Escopo

- **Entra:** `dashboard/custos-de-ia.json` (preços buscados na internet, com fonte e data), `dashboard/quadro-modelos-de-ias.html` (+ `assets/css/custos-de-ia.css` e `assets/js/custos-de-ia.js`) no visual futurista, e o item de menu em `menu.js`.
- **Não entra:** mudar outras páginas do dashboard, calcular consumo ou gasto real, abrir navegador para validar.

### Decisões

- 2026-10-24 08:57: pedido direto do usuário; tarefa **pequena** (poucos arquivos novos, sem banco nem segurança). O nome do arquivo foi escrito como "quado-modelos-de-ias.html" no pedido; foi entendido como **`quadro-modelos-de-ias.html`** (erro de digitação). Se for outro o nome desejado, é renomear.
- 2026-10-24 08:57: nível, modelo e `effort` das subtarefas **não foram escolhidos pela IA**: vêm do Jev (C52).
- 2026-10-24 08:57: os preços vêm só de fontes oficiais pesquisadas na internet; valor não encontrado fica `null`.

### CUSTOS-DE-IA.1 — Buscar na internet os modelos e preços de Claude, DeepSeek, Codex (OpenAI) e Gemini e gravar `dashboard/custos-de-ia.json`

**Próximo passo:** concluída.

- **Nível:** LEVE — classificado (sinais)
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **Fonte:** sinais
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** pesquisar nas páginas oficiais de preços (Anthropic, DeepSeek, OpenAI, Google) os modelos atuais e o custo por 1 milhão de tokens (entrada, saída e, quando existir, cache); gravar `dashboard/custos-de-ia.json` com `geradoEm`, `moeda`, `unidade` e, por fornecedor, a lista de modelos com preços, `fonte` (URL) e `coletadoEm`; valor que não for encontrado fica `null`, nunca inventado.
- **Critérios de Aceitação:** o JSON é válido (`node -e`), tem os 4 fornecedores, cada preço tem `fonte` e `coletadoEm`, e nenhum valor foi estimado.
- **Depende de:** Nenhuma
- **Entrega:** commit "feat(CUSTOS-DE-IA.1)" (dashboard/custos-de-ia.json)
- **Verificação:** `JSON.parse` ok; 4 fornecedores (claude 16, deepseek 2, codex 11, gemini 10 modelos), todos com `fonte` e `coletadoEm`; nenhum preço de entrada ou saída `null`; 3 modelos codex (gpt-5.2-codex, gpt-5.1-codex, gpt-5-codex) vieram de snippets das páginas oficiais de modelo, não da página de preços, e estão marcados na observação

### CUSTOS-DE-IA.2 — Criar a página `dashboard/quadro-modelos-de-ias.html` (CSS e JS próprios) que lê o `custos-de-ia.json` no visual futurista

**Próximo passo:** concluída.

- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **Fonte:** sinais
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** página no padrão de `JEV-AI-CALLS.html`: `base.css` + `tema-futurista.css` (ver `prompts/VISUAL-FUTURISTA.md`) + `assets/css/custos-de-ia.css` + `assets/js/custos-de-ia.js`; um cartão por fornecedor (Claude, DeepSeek, Codex, Gemini) com a tabela de modelos e custos, a data da coleta e o link da fonte; erro claro se o JSON não carregar; SOLID, funções ≤45 linhas, nomes em português, sem estilo nem script inline.
- **Critérios de Aceitação:** a página lista os 4 fornecedores com modelos e custos vindos só do JSON; sem valor fixo no HTML ou no JS; `node --check` passa; layout de uma coluna até 720 px.
- **Depende de:** CUSTOS-DE-IA.1
- **Entrega:** commit "feat(CUSTOS-DE-IA.2)" (dashboard/quadro-modelos-de-ias.html, assets/css/custos-de-ia.css, assets/js/custos-de-ia.js)
- **Verificação:** `node --check` no JS; nenhuma linha acima de 100 caracteres; nenhuma função acima de 45 linhas; sem `style=`/`onclick` no HTML; `formatarPreco` e `montarFornecedor` carregam em módulo; nenhum preço fixo no HTML nem no JS; conferência na tela é do usuário (regra: sem navegador)

### CUSTOS-DE-IA.3 — Acrescentar o item de menu **Custos de IA** em `dashboard/assets/js/menu.js` abrindo a página em nova aba

**Próximo passo:** concluída.

- **Nível:** MEDIO — classificado (sinais)
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Fonte:** sinais
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** uma linha em `ITENS_MENU` (`texto: 'Custos de IA'`, `href: 'quadro-modelos-de-ias.html'`, `novaAba: true`), como o item CHAMADAS JEV AI.
- **Critérios de Aceitação:** o menu mostra `Custos de IA` e o link abre em nova aba (`target=_blank`, `rel=noopener`).
- **Depende de:** CUSTOS-DE-IA.2
- **Entrega:** commit "feat(CUSTOS-DE-IA.3)" (dashboard/assets/js/menu.js: item "Custos de IA", `novaAba: true`)
- **Verificação:** linha acrescentada em `ITENS_MENU` ao lado de CHAMADAS JEV AI; `node --check` do menu; `target=_blank` e `rel=noopener` vêm de `criarLink` quando `novaAba` é true

### CUSTOS-DE-IA.4 — Conferir: JSON válido, sintaxe, nomes de arquivo, limites de código e que a página só usa dados do JSON

**Próximo passo:** concluída. O usuário confere a página na tela (regra: sem navegador).

- **Nível:** MEDIO — classificado (sinais)
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Fonte:** sinais
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** conferir por leitura e comandos (sem navegador): `node --check`, `JSON.parse`, ausência de preços fixos no HTML/JS, referências do menu e das folhas de estilo existentes; avisar o usuário de que a conferência na tela é dele.
- **Critérios de Aceitação:** todos os comandos passam; lista do que só o usuário pode ver na tela.
- **Depende de:** CUSTOS-DE-IA.3
- **Entrega:** commit "feat(CUSTOS-DE-IA.4)" (conferência; nenhum arquivo de código alterado)
- **Verificação:** `JSON.parse` do custos-de-ia.json (4 fornecedores, 39 modelos, nenhuma entrada/saída nula); `node --check` em custos-de-ia.js e menu.js; nenhuma linha acima de 100 caracteres; sem `style=`/`onclick` no HTML; nenhum preço fixo no HTML/JS; o menu e a página usam as classes `.barra` e `.abas__botao` do tema-futurista.css; a página precisa de servidor (como CHAMADAS JEV AI); **só o usuário vê a tela**
