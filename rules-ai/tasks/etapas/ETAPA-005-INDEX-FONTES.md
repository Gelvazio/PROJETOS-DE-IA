## Etapa 005 — INDEX-FONTES: cards e modais no `C:\fontes\index.html`

**Tarefa:** INDEX-FONTES · **Pedido em:** 2026-10-17 · **Criada por:** Claude Code (Opus 5.5) (local · main)
**Pedido:** "leia C:\fontes\index.html, ele deve ler as regras de rules-ai e mostrar de forma
estilizada tambem, crie 4 cards, 2 em cada linha, no inicio dele: CLAUDE-RAIZ, RULES-AI (com as
regras), OPUS-LIDER e TAREFAS (pendentes e completas de rules-ai/tasks)"
**Objetivo:** página única em `C:\fontes` que mostra, de forma estilizada, o mapa da raiz, as regras
globais, o CLAUDE.md do líder Opus e o quadro do `rules-ai`.

### Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-17 | `rules-ai` não tem `CLAUDE.md`: o card RULES-AI mostra o `AGENTS.md` + `regras/*.md` + `CONFLITOS.md` | Claude Code (Opus 5.5) | Arquivo pedido não existe; `AGENTS.md` é o equivalente |
| 2026-10-17 | Conteúdo embutido em `assets/js/dados.js`, gerado por `node scripts/gerar-dados-index.mjs` (atalho `atualizar-index.cmd`) | Claude Code (Opus 5.5) | A página abre com duplo clique (`file://`), onde o navegador bloqueia ler outros arquivos |
| 2026-10-17 | Executada direto, sem plano à parte | Claude Code (Opus 5.5) | Pedido completo; sem banco, segurança nem dados apagados |

### INDEX-FONTES.1 — Cards, modais e gerador de dados

**Próximo passo:** — (entregue).

- **Nível:** PESADO — mais de 3 arquivos ligados (HTML, CSS, módulos JS e gerador).
- **Modelo:** só Opus 5.5+ ou Fable — nunca outro.
- **Descrição:** 4 cards (2 por linha) no topo do `index.html`, cada um abre um modal estilizado.
- **Critérios de Aceitação:** os 4 modais mostram o conteúdo certo; o corpo da página mostra o
- **JEV-AI-SUGGESTION:** NAO
  `CLAUDE.md` da raiz e as regras do `rules-ai`; abre com duplo clique.
- **Entrega:** `C:\fontes\index.html`, `assets/css/estilo.css`, `assets/js/` (`markdown.js`,
  `modal.js`, `tarefas.js`, `pagina.js`, `dados.js` gerado), `scripts/gerar-dados-index.mjs` e
  `atualizar-index.cmd` (fora do Git: `C:\fontes` não é repositório).
- **Verificação:** `node --check` nos 5 scripts; leitura das tabelas rodada no Node (15 linhas
  abertas em 5 grupos, 22 concluídas, 14 documentos do rules-ai); linhas ≤ 100 caracteres. O visual
  **não** foi aberto no navegador (regra): o usuário confere com duplo clique no `index.html`.
