## Etapa 050-1ea67666 — DASHBOARD-JEV-CALLS: Menu CHAMADAS JEV AI e página JEV-AI-CALLS.html

**Tarefa:** DASHBOARD-JEV-CALLS · **Pedido em:** 2026-10-23 19:36 · **Criada por:** Claude Code (Sonnet 5.5) (local · main · rules-ai)
**Pedido:** "adicione um menu de nome *CHAMADAS JEV AI*, que deve abrir numa nova janela de nome JEV-AI-CALLS.html, com os dados das chamados do JEV AI" · "dispare agora 1 agente rpa fa zer isso"
**Objetivo:** Um menu do dashboard que abre `JEV-AI-CALLS.html` em nova janela com os dados das chamadas ao Jev.

### Escopo

- **Entra:** item de menu `CHAMADAS JEV AI` (nova janela), página `dashboard/JEV-AI-CALLS.html` com resumo e tabela das chamadas ao Jev lidas de `scripts/jev/saidas/chamadas.jsonl`, só leitura.
- **Não entra:** gravar nada, ler texto de mensagem (o registro só tem hash), publicar na internet, mudar o Jev (`scripts/jev/`), as outras páginas do dashboard.

### Riscos

- O arquivo fica fora do Git (`scripts/jev/saidas/`): fora de localhost a página mostra o aviso, não dados.
- `AGENTES-REALTIME.*` mexe em `menu.js`/`agentes.js`: aqui só a linha do menu é tocada.

### Decisões

- 2026-10-23 19:36: pedido direto do usuário ("dispare agora 1 agente pra fazer isso") — ajuste pequeno em `dashboard/` (menu + 1 página), sem banco nem segurança; executa sem plano separado.


### DASHBOARD-JEV-CALLS.1 — Menu CHAMADAS JEV AI e a página JEV-AI-CALLS.html

**Próximo passo:** concluída; segue a .2 (documentação).

- **Nível:** MEDIO — código com lógica, poucos arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Acrescentar em `dashboard/assets/js/menu.js` (`ITENS_MENU`) o item `{ texto: 'CHAMADAS JEV AI', href: 'JEV-AI-CALLS.html', novaAba: true }` (abre em nova janela). Criar `dashboard/JEV-AI-CALLS.html` (mesma barra e `<nav data-menu>` do `index.html`, título `CHAMADAS JEV AI`), `dashboard/assets/js/jev-ai-calls.js` e `dashboard/assets/css/jev-ai-calls.css` (tokens do `tema-futurista.css`). A página lê, por `fetch`, o `../scripts/jev/saidas/chamadas.jsonl` (uma linha JSON por chamada ao Jev; servido pelo `python -m http.server` na raiz do `rules-ai`, como diz o README do dashboard), mostra um resumo (total de chamadas, custo em US$, tokens de entrada e saída, latência média, % de `situacao` diferente de `ok`) e uma tabela das chamadas, mais novas primeiro (data, ação, modelo, perguntas, tokens, custo, latência, situação, tentativas, código de erro), com filtro por ação e por situação. Só campos que o registro já tem; o texto da mensagem nunca existe nesse arquivo (guarda só hash). Falha ao ler (arquivo ausente, 404, host que não é local) → mensagem clara na tela, sem quebrar. Linha inválida do jsonl é pulada e contada num aviso. Sem dependência npm nem CDN novo. Respeita `codigo-limites-nomes.md` e `codigo-solid.md` (funções de até 45 linhas, JSDoc, nomes em português sem acento, constantes no topo, linhas de até 100 colunas, sem `style=""` nem `onclick`).
- **Critérios de Aceitação:** o menu mostra CHAMADAS JEV AI e abre `JEV-AI-CALLS.html` em nova janela; a tabela e o resumo batem com `chamadas.jsonl` (total de linhas válidas, soma de `custo_usd` e de tokens conferidos por comando); `node --check` passa nos JS; nenhum arquivo fora de `dashboard/`.
- **Depende de:** Nenhuma
- **Entrega:** commit "feat(DASHBOARD-JEV-CALLS.1)"; menu.js entrou só com a linha do CHAMADAS JEV AI (as demais alterações do menu.js são de outra frente e seguem fora do commit).
- **Verificação:** node --check ok; JSDoc nas 16 funções; resumo conferido de forma independente sobre chamadas.jsonl (1584 chamadas, custo US$ 0,0801741, 1.908.908 tokens de entrada, 261.223 de saída, latência média 248,2 ms, 0% de erro); DOM só com createElement/textContent; tela não aberta (a IA não abre navegador): o usuário confere com `python -m http.server 8080` na raiz do rules-ai e abrindo http://localhost:8080/dashboard/JEV-AI-CALLS.html

### DASHBOARD-JEV-CALLS.2 — Documentar a página e fechar

**Próximo passo:** concluída; falta só a entrada no STATUS_PROJETO.md, que o líder registra no fechamento

- **Nível:** LEVE — só texto e constantes, sem lógica
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** Uma seção curta no `dashboard/README.md` (o que mostra, de onde lê, que só funciona servindo a raiz do `rules-ai` em localhost e que o texto das mensagens nunca é exibido) e entrada no `STATUS_PROJETO.md`.
- **Critérios de Aceitação:** README correto e coerente com a página entregue.
- **Depende de:** DASHBOARD-JEV-CALLS.1
- **Entrega:** commit "docs(DASHBOARD-JEV-CALLS.2)" (seção Chamadas do Jev no dashboard/README.md)
- **Verificação:** caminhos citados existem; linhas até 100 colunas; o texto das mensagens não é exibido (o registro guarda só hash)
### DASHBOARD-JEV-CALLS.3 — Garantir que CHAMADAS JEV AI abre em nova janela

**Próximo passo:** concluída; o working tree do menu.js segue com alterações de outra frente (itens do menu) fora do commit

- **Nível:** MEDIO — código com lógica em `menu.js`
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** A .1 entregou o item com `novaAba: true`, mas o `criarLink` do `menu.js` commitado só lê `{ texto, href }`; a versão do working tree (alteração de outra frente, não commitada) já faz `target="_blank"`. Ver o estado do Git: se a outra frente já commitou o `menu.js`, só confirmar; senão, commitar apenas o trecho de `criarLink` que trata `novaAba`.
- **Critérios de Aceitação:** o `menu.js` commitado põe `target="_blank"` e `rel="noopener"` em item com `novaAba`; `node --check` passa.
- **Depende de:** DASHBOARD-JEV-CALLS.1
- **Entrega:** commit "fix(DASHBOARD-JEV-CALLS.3)" (menu.js: criarLink trata novaAba, só esse trecho)
- **Verificação:** node --check ok; diff contra o HEAD mostra só o criarLink; a tela não foi aberta (a IA não abre navegador): o usuário confere que CHAMADAS JEV AI abre em nova janela
