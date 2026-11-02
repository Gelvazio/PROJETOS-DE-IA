# 🎚️ Níveis de tarefa — quem pega o quê

> **Projeto no banco (C58):** no `rules-ai` (e no `aulasenai`, depois do corte) não existe `tasks/STATUS.md`, `task_complete.md`, `RECADOS.md` nem etapa em `.md`: onde esta regra os cita, vale a tabela `quadro_*` equivalente do Supabase (`quadro-de-tarefas.md`, "Cada informação em um lugar só"), lida com a chave `anon` e gravada só pelas RPC. Mudança na tabela de níveis vai para `quadro_decisoes`; a entrega do Haiku é a RPC `entregar`. Nos projetos em `.md`, o texto abaixo vale como está.

> 🚫 **Regra C60:** o Opus NUNCA pega tarefa, em nenhum nível, a não ser que o usuário peça explicitamente (`opus-so-sob-pedido.md`); onde esta matriz cita Opus, vale só com esse pedido.
> 🥇 **Regra maior (C50):** modelo mais forte NUNCA pega tarefa de modelo mais fraco — `regra-maior.md`.
> 🧠 **Regra C52:** o nível e o modelo de toda subtarefa são SEMPRE escolhidos pelo Jev AI; NUNCA, JAMAIS
> pela IA sozinha — `ciclo-da-task.md` (seção do Jev) e `jev.md`.

Cada subtarefa tem um **nível**, para que modelos mais fracos façam as tarefas simples e o modelo
forte fique com as difíceis. Vale para **todas as IAs**. Reserva: `frentes-e-reserva.md`.

## Os 3 níveis

| Nível | Em palavras simples | Sinais |
|---|---|---|
| `PESADO` | difícil | banco (SQL, RLS, RPC, seeds), login/papéis/permissões, chaves ou segredos, segurança, arquitetura, mais de 3 arquivos ligados, mudança em massa, apagar dados |
| `MEDIO` | média | código com lógica (JS, Python, geradores, telas), de 1 a 3 arquivos |
| `LEVE` | fácil | só `.md`, textos, linhas do quadro, formatação, configuração simples sem lógica |

- **O sinal mais restritivo vence** ("1 arquivo, mas é SQL" = `PESADO`). **Na dúvida, sobe o nível.**

## Quem pega cada nível

| Ferramenta | `LEVE` | `MEDIO` | `PESADO` |
|---|---|---|---|
| **Claude Code** | Haiku 5.5 | Sonnet | **Sonnet, com `effort xhigh`** (C61) |
| **Gemini CLI** | Flash | Pro | ⛔ |
| **Antigravity** | Gemini Flash | ⛔ | ⛔ |
| **Grok** | rápido | principal | ⛔ |
| **DeepSeek** | V4.1 Flash | raciocínio | ✅ só V4 Flash, com `effort high` (C65) |
| **OpenCode** | DeepSeek V4.1 Flash (`deepseek-flash`) | DeepSeek V4.1 Flash com thinking (`deepseek-flash`) | ⛔ (C61) |
| **Codex** / **Cursor** | ✅ | ✅ | ⛔ |
| **Qoder** | ✅ | ✅ | ⛔ |
| **Devin** (SWE-2) | ✅ | ✅ | ✅ (C64) |
| **Copilot** | ✅ | ✅ | ⛔ |

- `LEVE` é **Haiku 5.5** (Claude Code) **ou DeepSeek V4.1 Flash** — a coluna `Modelo` do quadro grava
  `só Haiku 5.5 ou DeepSeek V4.1 Flash` (C53, 2026-10-24).
- ⚡ **C61 (2026-11-01, ordem do usuário): TODA tarefa `PESADO` vai para o Sonnet, com `effort xhigh`** — a coluna `Modelo`
  grava `PESADO · só Sonnet · effort xhigh`; Opus (C60), Fable e DeepSeek **não** pegam `PESADO` — o DeepSeek V4 Flash volta a pegar pela C65, abaixo.
  **C64 (2026-11-01, ordem do usuário): Devin (SWE-2) também pega `PESADO`** — a coluna `Modelo` pode
  gravar `PESADO · só Sonnet ou Devin (SWE-2 High Lightning) · effort xhigh`; Copilot segue `⛔`.
  **C65 (2026-11-01, ordem do usuário): DeepSeek V4 Flash, com `effort high`, também pega `PESADO`**
  — a coluna `Modelo` pode gravar `PESADO · só Sonnet, Devin (SWE-2 High Lightning) ou DeepSeek V4 Flash · effort xhigh/high`;
  DeepSeek V4 Pro e DeepSeek raciocínio seguem fora do `PESADO` (C61).
  O histórico abaixo (C35, C37, C48) fica só como registro:
- (histórico) `PESADO` exigia **Claude Code com Sonnet, Opus 5.5 ou superior, ou Fable, ou DeepSeek** — no **OpenCode**,
  com `deepseek-v4-pro` (C35 e C37, 2026-10-18; altera a C22: o DeepSeek deixou de ser `⛔` em
  `PESADO`; C48, 2026-10-22: o Sonnet também pega `PESADO`).
- ⛔ **NUNCA executar subtarefa que não é do seu modelo** (C2, 2026-10-16 22:53): cada IA só pega
  os níveis marcados na **sua** linha — no Claude Code, Haiku **só** `LEVE`, Sonnet `MEDIO` **e** `PESADO`
  (C48, C61); Opus (C60) e Fable não pegam tarefa. Nem acima nem abaixo, e **sem exceção** (nem com autorização).
- A tabela é do usuário: mudança nela vai para o "Registro de decisões" do `tasks/STATUS.md`.
- Regras de banco (quem pode falar com o banco, produção) são do projeto.

## Como usar

- **Reserva com IA + modelo:** "Em uso por" = `<IA (modelo)> (<frente>) (desde <data hora>)`. É
  assim que se sabe o nível máximo de quem reservou.
- Cada IA só pega subtarefa do **seu** nível (a coluna **Modelo** do quadro diz qual). Sem
  subtarefa livre do seu nível → não pega nenhuma e avisa o usuário.
- **Onde fica o nível:** 1º item da seção da subtarefa na etapa —
  `- **Nível:** MEDIO — motivo curto` (o sinal que decidiu).
- **Quem classifica:** **sempre o Jev** (C52). Quem cria ou divide a subtarefa **não escreve** o
  nível: roda `node scripts/jev.mjs classificar --id <ID> --gravar`. Subtarefa sem nível → o Jev
  classifica antes de alguém pegar; sem o Jev, ela fica sem nível e ninguém a pega.
- Subtarefa de outro nível → liberar a reserva, reclassificar ou dividir; ⛔ nunca mudar o nível
  para caber na sua ferramenta.

## Quem classifica: o Jev (C47)

- Subtarefa **sem nível** é classificada pelo Jev (`node scripts/jev.mjs classificar --gravar`,
  `jev.md`): com confiança ≥ 0,80 ele grava nível, modelo e `effort`, podendo **subir ou baixar**;
  abaixo disso, vale o sinal mais restritivo que o **próprio comando do Jev** aplica (**na dúvida,
  sobe o nível**). Se o Jev **falhar ou estiver desligado**, nada é gravado (C52).
- Fica em cada subtarefa o campo `JEV-AI-SUGGESTION: SIM|NAO` (`SIM` = o Jev escolheu).
- Nível escrito por pessoa não é reclassificado sem `--reclassificar` pedido pelo usuário. A matriz
  "quem pega cada nível" continua do usuário; o Jev não a altera.

## Equipe de agentes do Claude Code

O líder (Opus 5.5+ ou Fable) reserva **uma subtarefa por vez**, delega ao agente do nível
(`executor-leve` = Haiku, `executor-medio` = Sonnet, `executor-pesado` = Opus) e valida a
entrega. O líder reserva (commit + push da reserva) e edita o quadro; o `classificador-tarefas` só
grava a linha `- **Nível:**` nas etapas.

**Conferência, commit e push da entrega são do Haiku (C41).** Quando o executor entrega, o Haiku
(`executor-leve`) confere (arquivos, sintaxe e o registro da Verificação), move a linha para o
`task_complete.md` no mesmo commit e dá o push. Em entrega `PESADO` ele confere só arquivos,
sintaxe e Verificação, sem consultar banco. Se achar problema, **não commita** e cria na mesma mãe
a subtarefa `Verificação: <problema>` (`MEDIO · só Sonnet`, C26). O Haiku continua sem executar
subtarefa `MEDIO` ou `PESADO` (C22). Sessão que trabalha sozinha, sem equipe, mantém o fluxo
normal: quem executa commita.

Quem **executa** é o agente do nível: na reserva vai o modelo dele, ex.:
`Claude Code (Haiku 5.5 · executor-leve; líder Opus 5.5) (<frente>) (desde …)`.
