# 🎛️ Esforço (`effort`) dos agentes

Decidido em 2026-10-16 (C21; origem: REA, etapa 011-9d3e7a52). **Vale para todos os projetos e todas as
IAs.** Conferência por modelo: tarefa `CONFEFFORT-GLOBAL`; resultados nas etapas 002 e 003 do `rules-ai` (não ler para escolher o esforço).

- ✅ Todo agente de equipe declara o esforço no frontmatter (`effort:`), para valer sempre, sem
  depender do esforço da sessão do líder.
- Esforço por **nível** do agente (`niveis-e-modelos.md`):

| Agente / nível | `effort` |
|---|---|
| `classificador-tarefas` e `executor-leve` (`LEVE`) | `low` |
| `executor-medio` (`MEDIO`) | `medium` |
| `executor-pesado` (`PESADO`) | `high` (ajustável; `xhigh` só com pedido do usuário) |

- Editar só a **fonte** dos agentes (no REA e nos dashboards, `.agents/agents/*.md`); as cópias por IA
  são regeradas pelo script do projeto (`npm run sync:agentes`).
- ⚠️ O agente **não enxerga** o próprio esforço: conferir por fora (tokens, tempo, tamanho da
  resposta), como manda a `CONFEFFORT-GLOBAL`. Nem toda IA tem `effort` (Gemini, DeepSeek): usar a
  configuração equivalente de raciocínio da ferramenta.
- ✅ **Toda tarefa e subtarefa declara o `effort`** junto do nível no quadro (`LEVE · effort low`, `MEDIO · effort medium`, `PESADO · effort high`), em **todas as IAs**: quem não tem `effort` (Gemini, DeepSeek, Copilot…) simplesmente ignora o campo (decisão do usuário, 2026-10-16 20:40).
