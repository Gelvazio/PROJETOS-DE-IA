# Página de modelos gratuitos do OpenRouter (models-openrouter-ai.html)

**Data de Criação:** 2026-10-13  
**Status Geral:** ✅ Concluído em 2026-10-13 (aguardando aceite do usuário). Itens extras: correção da cor do texto de preço no tema escuro do index.html.  
**Prioridade:** Média

---

## 📌 Objetivo

Adicionar um menu no `index.html` que abre uma nova página, `models-openrouter-ai.html`, listando os
**19 modelos gratuitos** do OpenRouter (extraídos de `open-routers-models.json`) com filtros, para
o usuário escolher um modelo sem custo (ex.: para usar no Hermes Agent).

---

## 📋 Escopo

**Entra:**
- Menu de navegação no cabeçalho do `index.html` (Dashboard · Modelos OpenRouter).
- Página nova com cards dos 19 modelos (preço de entrada e saída = 0) e filtros.
- Tema escuro/claro, igual ao dashboard (mesma chave `theme` do localStorage).

**Não entra:**
- Os outros 442 modelos pagos do JSON.
- Chamadas à API do OpenRouter em tempo real (a página abre por `file://`, sem servidor).
- Testes automatizados e abertura de navegador (regras do CLAUDE.md global).

**Filtros propostos:**
1. Busca por nome ou ID.
2. Fabricante (derivado do prefixo do ID: nvidia, google, poolside…).
3. Contexto mínimo (qualquer · ≥ 64K · ≥ 256K · ≥ 1M).
4. Tool calling (todos · somente com suporte).
5. Tipo de saída (todos · somente texto).
6. Ordenação (contexto maior→menor · nome A→Z).
7. Contador "N de 19 modelos" e botão "Limpar filtros".

**Cada card mostra:** nome, ID (com botão copiar), fabricante, contexto, tool calling, saída, preço
(gratuito) e a descrição que existir no JSON.

**Tecnologias:** HTML5, CSS com variáveis, JavaScript puro (sem dependências).

**Dados:** o JSON tem 770 KB e o navegador bloqueia `fetch` de arquivo local. Por isso os 19
modelos serão extraídos **uma vez** do JSON para `assets/js/models-openrouter-dados.js` (campos
necessários apenas). Para atualizar, basta repetir a extração.

---

## 📊 Plano de Execução

### Etapa 1: Extrair os 19 modelos gratuitos
- **Status:** ⬜ Pendente
- **Ação:** Filtrar `open-routers-models.json` (prompt = 0 e completion = 0) e gerar o arquivo de dados com id, nome, fabricante, contexto, tool calling, saída e descrição.
- **Arquivo:** `assets/js/models-openrouter-dados.js` (novo)
- **Verificação:** `node --check` no arquivo e conferir que o total é 19.

### Etapa 2: Constantes da página
- **Status:** ⬜ Pendente
- **Ação:** Criar constantes (chave do tema, mensagens, faixas de contexto, textos dos filtros).
- **Arquivo:** `assets/js/models-openrouter-constantes.js` (novo)
- **Verificação:** `node --check`.

### Etapa 3: Lógica de filtros e ordenação
- **Status:** ⬜ Pendente
- **Ação:** Funções puras (≤ 45 linhas, return early, nomes em português): `filtrarModelos`, `ordenarModelos`, `listarFabricantes`.
- **Arquivo:** `assets/js/models-openrouter-filtros.js` (novo)
- **Verificação:** `node --check` e leitura do código.

### Etapa 4: Renderização e tema
- **Status:** ⬜ Pendente
- **Ação:** Montar os cards, ligar eventos dos filtros (sem JS inline), botão copiar ID e alternância de tema.
- **Arquivo:** `assets/js/models-openrouter-pagina.js` (novo)
- **Verificação:** `node --check`.

### Etapa 5: Estilos da página
- **Status:** ⬜ Pendente
- **Ação:** Criar CSS com os mesmos tokens de cor do dashboard (claro/escuro), grid de cards e barra de filtros responsiva.
- **Arquivo:** `assets/css/models-openrouter.css` (novo)
- **Verificação:** Leitura do arquivo (sem abrir navegador).

### Etapa 6: Página HTML
- **Status:** ⬜ Pendente
- **Ação:** Criar a página semântica (header, nav, main, section), carregando os scripts na ordem: constantes → dados → filtros → página.
- **Arquivo:** `models-openrouter-ai.html` (novo)
- **Verificação:** Leitura do arquivo e conferência dos caminhos dos scripts.

### Etapa 7: Menu no index.html
- **Status:** ⬜ Pendente
- **Ação:** Adicionar `<nav>` no cabeçalho com os links "Dashboard" e "Modelos OpenRouter", mais o CSS do menu no `<style>` existente.
- **Arquivo:** `index.html`
- **Verificação:** Leitura do trecho alterado.

### Etapa 8: Registro e commit
- **Status:** ⬜ Pendente
- **Ação:** Atualizar `STATUS.md` e fazer commit local só dos arquivos da tarefa (sem push).
- **Arquivo:** `STATUS.md` e os arquivos acima
- **Verificação:** `git diff --cached --name-only` antes do commit.

---

## ⚠️ Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|-------|---|---|
| Lista de gratuitos mudar no OpenRouter | Alta | Mostrar a data da extração na página; repetir a extração quando quiser |
| Não poder validar visualmente (regra: nunca abrir navegador) | Média | Conferir por leitura e `node --check`; você testa abrindo o HTML |
| Limites de uso dos modelos `:free` não constam no JSON | Alta | Aviso na página: "gratuito" vem do preço; podem existir limites de uso |
| Aumentar o `index.html` (já tem 1124 linhas, acima do limite de 1000) | Baixa | Só adicionar o menu (≈ 15 linhas); a página nova fica em arquivos separados |

---

## 📝 Notas

- O `index.html` já ultrapassa 1000 linhas; esta tarefa não o refatora, só acrescenta o menu.
- A tarefa anterior ("Ferramentas e Recursos") está parcial: a Etapa 1 (AGENTS.md) foi feita; as
  Etapas 2 a 5 de `docs/criar-secao-ferramentas-recursos.md` seguem pendentes.

---

## ✅ Checklist Final

- [ ] Menu criado no `index.html`
- [ ] `models-openrouter-ai.html` com 19 modelos e filtros
- [ ] Tema escuro/claro funcionando por leitura do código
- [ ] `node --check` sem erros em todos os `.js`
- [ ] `STATUS.md` atualizado
- [ ] Commit realizado (sem push)
