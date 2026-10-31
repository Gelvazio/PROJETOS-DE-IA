## Etapa 006 — GATILHO-GLOBAL: mensagem `;` = pegue a próxima tarefa do seu modelo

**Tarefa:** GATILHO-GLOBAL · **Pedido em:** 2026-10-17 11:53 · **Criada por:** Claude Code (Sonnet 5.5) (local · main)
**Pedido:** "este ;, é um gatilho pra *Pegue a proxima tarefa disponivel para seu modelo*, anote esta
regra em rules-ai, global e aqui no projeto tambem,e rode o sincronizador de regras globais"
(o "projeto" é o `gerenciador-de-ia`, tarefa #3 do quadro dele)
**Objetivo:** toda IA, em qualquer projeto, que receber uma mensagem só com `;` pega a próxima
subtarefa livre **do seu modelo**, executa e entrega, sem perguntar.

> 🌐 **GLOBAL:** vale para todos os projetos e IAs. O usuário decidiu a regra na mesma conversa
> (conflito C24, já decidido: não fica em "Pendente de decisão").

### Texto da regra (copiar sem mudar, em `regras/frentes-e-reserva.md`, no fim do arquivo)

```markdown
## Gatilho `;` — pegue a próxima tarefa do seu modelo

- Mensagem do usuário **só com `;`** = "Pegue a próxima tarefa disponível para o seu modelo".
  Vale para todas as IAs, sem confirmar nada antes.
- A IA faz, nesta ordem: **1)** sincronizar com o remoto; **2)** ler o `STATUS.md`; **3)** escolher a
  subtarefa por "Pegar uma subtarefa" (livre, dependências ✅, **do seu modelo**, maior
  prioridade); **4)** reservar (commit + push); **5)** executar até entregar; **6)** encerrar pelo
  ciclo da task e responder só **TAREFA FINALIZADA E SINCRONIZADA!**
- **Sem subtarefa livre do seu modelo** → não pega nenhuma e diz ao usuário qual modelo tem
  subtarefa livre (o `;` nunca autoriza pegar tarefa de outro modelo: `niveis-e-modelos.md`).
- Tarefa grande sem o "sim" do usuário ao plano **não** é pega pelo `;` (fica 👀 até o "sim").
- É **uma** subtarefa por mensagem `;`; para a seguinte, o usuário manda `;` de novo.
```

### GATILHO-GLOBAL.1 — Regra global, conflito C24 e status do projeto

**Próximo passo:** nenhum. Subtarefa entregue em 2026-10-17 16:24.

- **Nível:** LEVE — só `.md`.
- **Modelo:** só Haiku — nunca outro (regra C22, sem exceção; o pedido veio a uma sessão Sonnet).
- **Descrição:** (1) acrescentar o "Texto da regra" acima ao fim de `regras/frentes-e-reserva.md`
- **JEV-AI-SUGGESTION:** NAO
  (o arquivo fica com menos de 5 KB); (2) em `CONFLITOS.md`, na tabela "Decididos depois", a linha
  `| C24 | Gatilho `;` | ✅ Mensagem só com `;` = pegar a próxima subtarefa livre do **seu** modelo; regra em `regras/frentes-e-reserva.md`. Pedido do usuário em 2026-10-17 |`
  logo depois da C23; (3) em `STATUS_PROJETO.md`, nova linha no topo de "O que mudou desde a última
  gravação" com data e hora (Brasília) e o que mudou (regra do `;`, C24 e sincronização).
- **Critérios de aceitação:** o texto da regra está idêntico ao acima; C24 está no `CONFLITOS.md`;
  `STATUS_PROJETO.md` registra a mudança com data e hora.
- **Entrega:** commit `docs(regras): gatilho ; (C24) em frentes-e-reserva.md e no CONFLITOS.md` (regra, C24 e `STATUS_PROJETO.md`) · **Verificação:** `grep` achou o título "## Gatilho `;`" em `regras/frentes-e-reserva.md` (linha 50) e a linha C24 no `CONFLITOS.md` (linha 50); o arquivo tem 4.078 bytes, abaixo de 5 KB; o texto da regra é o da etapa, sem mudança.

### GATILHO-GLOBAL.2 — Rodar o sincronizador

**Próximo passo:** nenhum. Subtarefa entregue em 2026-10-17 16:24.

- **Nível:** LEVE — só roda o script existente, sem escrever código.
- **Modelo:** só Haiku — nunca outro.
- **Descrição:** na pasta `C:\fontes\rules-ai`, rodar `node scripts/sincronizar.mjs` (confere o que
- **JEV-AI-SUGGESTION:** NAO
  mudaria) e depois `node scripts/sincronizar.mjs --aplicar`. **O usuário pediu esta execução** nesta
  tarefa (a `MODELO-GLOBAL.2` deixou o `--aplicar` com o usuário; aqui ele autorizou a IA). O script
  grava `dist/REGRAS-GLOBAIS.md` e o bloco marcado do arquivo global de cada IA (com cópia `.bak`).
- **Critérios de aceitação:** `dist/REGRAS-GLOBAIS.md` contém o "Gatilho `;`"; a saída lista cada IA
  (Claude Code, Gemini CLI, Codex, Grok, Qoder, opencode, Devin, Kiro) como atualizada ou igual;
  nada fora do bloco marcado foi alterado.
- **Entrega:** sincronizador `--aplicar` rodado (autorizado pelo usuário); gravados Gemini CLI, Codex, Grok, Qoder, opencode, Devin e Kiro; Claude Code igual (importa o `dist`) · **Verificação:** `dist/REGRAS-GLOBAIS.md` tem o título "## Gatilho `;`" (linha 323); `~/.claude/CLAUDE.md` tem `@C:/fontes/rules-ai/dist/REGRAS-GLOBAIS.md` (linha 538).

### Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-17 11:53 | Gatilho `;` é regra global (C24), em `regras/frentes-e-reserva.md` | Gelvazio | "anote esta regra em rules-ai, global" |
| 2026-10-17 11:53 | O `;` não vale para tarefa de outro modelo nem para tarefa grande sem "sim" | Claude Code (Sonnet 5.5) | A C22 não admite exceção; o `;` só escolhe a tarefa, não muda as regras |
