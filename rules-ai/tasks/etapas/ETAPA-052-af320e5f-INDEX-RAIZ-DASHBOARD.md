## Etapa 052-af320e5f — INDEX-RAIZ-DASHBOARD: index.html na raiz que abre o dashboard

**Tarefa:** INDEX-RAIZ-DASHBOARD · **Pedido em:** 2026-10-23 19:43 · **Criada por:** Claude Code (Sonnet 5.5) (local · main · rules-ai)
**Pedido:** "na raiz de C:\fontes\rules-ai\ crie 1 arquivo index.html que chame C:\fontes\rules-ai\dashboard\index.html"
**Objetivo:** abrir `index.html` na raiz do `rules-ai` leva direto a `dashboard/index.html`.

### Escopo

- **Entra:** 1 arquivo `index.html` na raiz do `rules-ai`, só HTML, que redireciona para `dashboard/index.html` (caminho relativo, funciona por `file://` e por servidor), com um link de reserva na página.
- **Não entra:** mudar o dashboard, o servidor, o menu ou qualquer outro arquivo.

### Decisões

- 2026-10-23 19:43: pedido direto do usuário; tarefa **pequena** (1 arquivo, só HTML, sem banco nem segurança). "Chamar" foi entendido como redirecionar (`<meta http-equiv="refresh">`), sem JavaScript nem `iframe`.

### INDEX-RAIZ-DASHBOARD.1 — Criar o `index.html` da raiz

**Próximo passo:** concluída.

- **Nível:** LEVE — um HTML estático, sem lógica
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** criar `C:\fontes\rules-ai\index.html` (`lang="pt-BR"`, `charset`, `viewport`, título curto, `<meta http-equiv="refresh" content="0; url=dashboard/index.html">`, e no corpo um `<a href="dashboard/index.html">` de reserva). Sem `style=""`, sem `onclick`, sem JavaScript.
- **Critérios de Aceitação:** o arquivo existe na raiz; o caminho `dashboard/index.html` existe a partir dele; nenhum outro arquivo alterado.
- **Depende de:** Nenhuma
- **Entrega:** commit "feat(INDEX-RAIZ-DASHBOARD.1)"
- **Verificação:** arquivo conferido por leitura (meta refresh e link de reserva para dashboard/index.html; sem style, onclick, script nem iframe; dashboard/index.html existe a partir da raiz); página não aberta (a IA não abre navegador)
