## Etapa 047-ad0d7fad — DASHBOARD-LEITURA-LOCAL: o dashboard lê o STATUS.md local em ambiente local

**Tarefa:** DASHBOARD-LEITURA-LOCAL · **Pedido em:** 2026-10-23 · **Criada por:** Claude Code (Sonnet 5.5) (local · main · rules-ai)
**Pedido:** "ajuste pra em ambiente local,pega do arquivo local"
**Objetivo:** a página `dashboard/index.html` lê o `tasks/STATUS.md` do disco quando roda em `localhost`, e do GitHub raw nos demais casos.

### DASHBOARD-LEITURA-LOCAL.1 — Leitura local do quadro quando o host é local

**Próximo passo:** ✅ entregue em 2026-10-23.

- **Nível:** MEDIO — código com lógica em 2 arquivos
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** em `localhost`, `127.0.0.1` ou `[::1]`, tentar `../tasks/STATUS.md` (servindo a pasta `rules-ai`) e, se falhar, cair no GitHub raw. Fora do host local, só o GitHub raw. `file://` não lê arquivo (o navegador bloqueia) e segue no GitHub.
- **Critérios de Aceitação:** host local lê o arquivo local; local indisponível cai no GitHub; host remoto não muda.
- **Verificação:** `node --check` nos dois JS e leitura do fluxo (sem navegador).
- **Entrega:** Claude Code (Sonnet 5.5) (local · main · rules-ai), 2026-10-23: `config.js` (`urlQuadroLocal`, `HOSTS_LOCAIS`), `canal.js` (tenta o arquivo local em host local e cai no GitHub raw) e `README.md` (servir a pasta `rules-ai`, abrir `/dashboard/`).
- **Verificação:** `node --check` nos dois JS ok; fluxo conferido por leitura. Não testado no navegador (regra): abrir `http://localhost:8080/dashboard/` com `python -m http.server 8080` na raiz do `rules-ai`.
