## Etapa 010-ceb4e6f4 — NIVEL: Cada sessão só pega subtarefa do seu nível, com trava

**Tarefa:** NIVEL · **Pedido em:** 2026-10-15 23:52 · **Criada por:** Claude Code (Opus 5.5) (local · main)
**Pedido:** "esta anotado que cada sessao so pode pegar a tarefa do seu respectivo modelo?" →
proposta das opções 1 (só o seu nível) e 2 (trava no hook) → "faça as duas"
**Objetivo:** cada modelo pega **só** subtarefas do próprio nível (Opus/Fable não descem para
MEDIO/LEVE) e uma trava recusa a reserva fora do nível.

### Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-15 23:52 | Regra passa de "até o nível" para "só o seu nível"; trava no `pre-commit` do Git (vale para todas as IAs), lendo o modelo do nome da frente | Gelvazio (aprovou as duas opções) | "faça as duas" |
| 2026-10-15 23:58 | **Aceite** da entrega (NIVEL.1 e NIVEL.2) | Gelvazio | "aceito" |

### NIVEL.1 — Regra "só o seu nível" nas regras, skills e no inicializador

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — muda a regra de quem pega o quê em mais de 3 arquivos ligados · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Descrição:** `multiplas-ias.md`, skills `classificar-tarefa` e `proxima-task` (fonte em
- **JEV-AI-SUGGESTION:** NAO
  `.agents/`, cópias pelo `sync:agentes`) e `inicializar-sessao.mjs` sem descer de nível.
- **Critérios de Aceitação:** nenhum texto diz mais que modelo forte pega nível mais leve; o
  inicializador com Opus não oferece MEDIO/LEVE.
- **Entrega:** commit `feat(NIVEL.1)` · **Verificação:** busca por "mais leve", "igual ou
  abaixo", "até o máximo" nas regras/skills/hooks: só sobram os textos novos (as cópias em
  `.claude/` e `.grok/` são regeradas pelo `pre-commit`); `node --check` no inicializador; com
  Opus ele lista só PESADO, com Sonnet só MEDIO, com Haiku só LEVE. Feita por Claude Code
  (Opus 5.5) (local · main), 2026-10-15.

### NIVEL.2 — Trava no `pre-commit`: reserva fora do nível é recusada

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — hook do Git que bloqueia commits de todas as IAs · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Descrição:** `.githooks/conferir-nivel-reserva.mjs` compara o `STATUS.md` do commit com o do
- **JEV-AI-SUGGESTION:** NAO
  `HEAD`; em cada reserva nova, o nível da coluna `Modelo` precisa ser o nível do modelo do nome
  da frente (matriz da skill `classificar-tarefa`). Chamado pelo `.githooks/pre-commit`;
  escape `IA_SEM_TRAVA=1` só com pedido do usuário; regra em `git-quick.md`.
- **Critérios de Aceitação:** reserva certa passa; Haiku em PESADO, Opus em LEVE e Sonnet em
  PESADO são recusados; commit sem `STATUS.md` não é afetado.
- **Entrega:** commit `feat(NIVEL.2)` · **Verificação:** `node --check` e `sh -n`; testado com
  cópias do quadro: Opus em PESADO passa; Haiku em PESADO, Sonnet executor em PESADO, Opus em
  LEVE e Devin em MEDIO são recusados (saída 1); Sonnet e Codex em MEDIO, Haiku e Gemini Flash
  em LEVE passam; modelo fora da matriz só avisa; quadro sem mudança e `IA_SEM_TRAVA=1` passam.
  O próprio commit de entrega passou pelo `pre-commit` novo. Feita por Claude Code (Opus 5.5)
  (local · main), 2026-10-15.
- **Anotação:** a trava lê o modelo do **nome da frente**, que a própria IA escreve; ela pega o
  engano (ex.: sessão Haiku mandada pegar PESADO), não uma IA que mente o nome.
