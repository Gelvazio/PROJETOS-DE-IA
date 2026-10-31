## Etapa 021-c8981c58 — RL-4F19D945-NIVEIS-E-MODELOS: Ajustar o projeto à regra niveis-e-modelos.md (rules-local 2026-10-23-4f19d945)

**Tarefa:** RL-4F19D945-NIVEIS-E-MODELOS · **Pedido em:** 2026-10-23 10:51 · **Criada por:** Claude Code (Sonnet 5.5) (local · main · ai-memory)
**Pedido:** sincronização de tasks do rules-local: mudado niveis-e-modelos.md, 2026-10-22-00769678 -> 2026-10-23-4f19d945 (C36). Pedido do usuário: "atualize os rules-local antes".
**Objetivo:** alinhar os arquivos do projeto que espelham a matriz de níveis à regra nova: o Sonnet também pega `PESADO` (C48), e o Jev classifica e grava o nível das subtarefas (C47).

### RL-4F19D945-NIVEIS-E-MODELOS.1 — Alinhar a matriz de níveis do projeto à C48

**Próximo passo:** trocar, nos arquivos abaixo, "`PESADO` só Opus 5.5+/Fable" por "Sonnet, Opus 5.5+ ou Fable (ou DeepSeek)", conforme `rules-local/regras/niveis-e-modelos.md`.

- **Nível:** LEVE — só texto em arquivos de regra, skills e comandos, sem lógica
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **Descrição:** a regra global passou a aceitar o Sonnet em `PESADO` (C48). Os arquivos do projeto que repetem a matriz ainda dizem que `PESADO` é só do Opus/Fable.
- **Arquivos:** `.claude/skills/classificar-tarefa/SKILL.md`, `.claude/skills/liderar-equipe/SKILL.md`, `.claude/skills/proxima-task/SKILL.md`, `.agents/skills/classificar-tarefa/SKILL.md`, `.agents/skills/liderar-equipe/SKILL.md`, `.agents/skills/proxima-task/SKILL.md`, `.claude/rules/multiplas-ias.md`, `.gemini/commands/liderar-equipe.toml`, `.gemini/commands/classificar-tarefa.toml`
- **Critérios de Aceitação:** nenhum desses arquivos afirma que `PESADO` é só do Opus/Fable; o texto bate com `rules-local/regras/niveis-e-modelos.md`; nada além da matriz muda.
- **Entrega:** a preencher · **Verificação:** a preencher (`grep` por "só Opus" nos arquivos acima não acha mais a frase antiga)
- **JEV-AI-SUGGESTION:** NAO
