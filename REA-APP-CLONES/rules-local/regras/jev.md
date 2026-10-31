# 🧠 Jev — classificador de nível e guardrails (JEV-RULES-AI)

Decidido em 2026-10-18 (etapa 025, JEV-RULES-AI; pedido do usuário registrado na C39); reserva só
pelos sinais desde 2026-10-19 (C42, etapa 028). Vale para todas as IAs e para todo projeto que use o `rules-ai`. Nível e modelo: `niveis-e-modelos.md`.
Effort: `esforco.md`. Quadro: `quadro-de-tarefas.md`. Chave e log: só no computador local.

## 🧠 Regra C52: o Jev escolhe o modelo, sempre

- ⛔ NUNCA, JAMAIS nenhuma IA escolhe nível, modelo ou `effort` sem o Jev. A regra completa, com o que
  fazer quando o Jev está indisponível, está em `ciclo-da-task.md` (seção "O Jev AI escolhe o modelo").
- O Jev indisponível **não** libera a IA para escolher pelos sinais: a subtarefa fica sem nível e
  ninguém a pega (altera a C42 e a C47 neste ponto).

## O que é

O Jev é um serviço externo (TypeSafe, modelo `jev-1.13.0`, fixo) que responde perguntas fechadas
sobre uma subtarefa ou um texto. O `rules-ai` o usa como **classificador**: abaixo de 0,80 ele só sugere; com ≥ 0,80
grava (C47). Código em `scripts/jev/` (sem dependência npm nova).

## Quando usar

- **Classificação:** sugerir o nível (`LEVE`, `MEDIO`, `PESADO`) de uma subtarefa do quadro, com o
  `effort` e os modelos elegíveis da matriz.
- **Guardrails** (segunda camada, depois de validação determinística):
  - escopo e critérios de aceite: só **avisam** (ação máxima `revisar`);
  - segredo/PII e pasta proibida (C20, C23): **bloqueiam**;
  - comando destrutivo: **bloqueia** até confirmação humana explícita do alvo exato;
  - aprovação indevida (C32): **bloqueia** a mensagem.

## Jev grava nível, modelo e effort das subtarefas (C47)

Decidido em 2026-10-22 (etapa 035, JEV-GRAVA-NIVEL; pedido do usuário). **Altera** o antigo caráter
consultivo e a regra "PESADO nunca é rebaixado" (C39) **na subtarefa**; a C22 continua valendo para
quem executa. Vale para **todos os projetos e todas as IAs**.

- ✅ O Jev **classifica e grava** `Nível`, `Modelo` e `Effort` na seção da subtarefa (etapa) e a
  coluna Modelo do `STATUS.md`: `node scripts/jev.mjs classificar --id <ID> --gravar`
  (`--dry-run` só mostra o que gravaria).
- ✅ **Limiar 0,80:** com `confidence` ≥ 0,80 **e** nenhum sinal de PESADO ≥ 0,50, o Jev decide
  sozinho e pode **subir ou baixar** o nível. Grava `JEV-AI-SUGGESTION: SIM` e `Fonte: jev (confiança X)`.
- ✅ **Abaixo de 0,80 ou sinal de PESADO ≥ 0,50** (o Jev respondeu): grava o nível **mais restritivo** entre a matriz e os sinais, com
  `JEV-AI-SUGGESTION: NAO` e `Fonte: sinais`; com sinal de PESADO ≥ 0,50 também devolve `revisar`.
  **Nunca** `liberar` em silêncio.
- ⛔ **Falha do Jev** (rede, 401, 429, 529, timeout, sem chave, `JEV_MODO=off`): **não grava nada**;
  a subtarefa fica sem nível e ninguém a pega (C52). A IA avisa o usuário.
- ✅ **Campo `JEV-AI-SUGGESTION: SIM|NAO`** em toda seção de subtarefa: `SIM` só se o Jev escolheu
  (≥ 0,80); `NAO` nos demais casos e nas ainda não classificadas. O script
  `scripts/marcar_jev_ai_suggestion.py` deixa tudo `NAO` onde o campo não existe.
- ⛔ Só grava em subtarefa **livre e sem `Nível`**; nível escrito por pessoa ou subtarefa reservada
  só muda com `--reclassificar` pedido pelo usuário, em subtarefa livre.
- ⛔ O Jev **não reserva**, não escolhe ferramenta, não muda status, prioridade, dependência nem
  tarefa-mãe, não aprova plano, não responde permissão e não executa comando.
- ⛔ Cada gravação sai em **um commit** (reversível por `git revert`). Auditoria em
  `saidas/gravacoes-AAAA-MM.jsonl` (fora do Git), sem o texto.
- O `effort` continua vindo da C21 pelo nível final; a matriz de `niveis-e-modelos.md` dá os modelos.

## Modo, rollback e fallback

- Variável `JEV_MODO`: `ativo` (padrão) ou `off`. Com `off`, a classificação segue só pelos sinais
  da skill, sem chamada a nenhum servidor. `off` é o **rollback** do gancho de mensagens;
  **para a escolha de modelo vale a C52** (sem o Jev, ninguém escolhe).
- Sem `TYPESAFE_API_KEY`, o script sai com erro claro e não liga o modo automático; a classificação
  segue só pelos sinais.
- Falha do Jev (rede, 401, 429, 529, timeout): **não há outro servidor de reserva** (C42). A
  classificação segue só pelos sinais da skill (na dúvida, sobe o nível) e o guardrail devolve
  `revisar`. **Nunca** `liberar` em silêncio.
- Limiar: o Jev usa `confidence`; abaixo de 0,60 a decisão é humana.

## Chave, privacidade e custo

- Chave só em `TYPESAFE_API_KEY` (ambiente ou `.env` local, ignorado pelo Git). Nunca em log, nunca
  em arquivo versionado, nunca impressa.
- Antes de qualquer envio, o texto passa por `redigir.mjs`: mascara chaves (`sk-`, `tsk_`, `Bearer`,
  `ghp_`, JWT), CPF, RG, e-mail e telefone. Segredo bruto nunca vai à API.
- Estado enviado à classificação é **cego**: sem `Nível:`, `Modelo:`, `Effort:`, `nivel_atual` e
  sem nomes de modelo (INV-1).
- Custo por rodada respeita `JEV_MAX_TOKENS`; o script aborta antes de estourar (INV-5).
- Log de auditoria em `scripts/jev/saidas/` (fora do Git): modelo, versão, confiança, limiar, tokens,
  custo, ação e `hash` do conteúdo, **sem o valor sensível**.

## Estado da implementação

- Ativo desde 2026-10-18: cliente, coletor cego, perguntas, matriz, agregação, 6 guardrails, CLI
  `node scripts/jev.mjs classificar | guardrail | avaliar | custo` e a skill `classificar-tarefa`
  (tenta o Jev primeiro; sem chave, `off` ou falha segue só pelos sinais).
- Benchmark cego (180 itens, `scripts/jev/benchmarks/`): nível final 0,60–0,61, só `nivel`
  0,66–0,67, recall de PESADO 0,883 (final). O "15/15" antigo vazava `nivel_atual` (com ele:
  0,85). Uso real: `confianca` < 0,60 pede decisão humana. Nas subtarefas o Jev decide só com
  ≥ 0,80 (C47); na mensagem, ver C43.
- Se o Jev falhar em PT-BR ou em decisão irreversível, não usar a sugestão sem revisão humana.

## Rollback

1. Definir `JEV_MODO=off` no ambiente (ou no `.env` local): o CLI sai com código 2 e a skill segue
   só pelos sinais; guardrails ambíguos viram `revisar`, os determinísticos continuam.
2. Total: copiar `SKILL.md.bak` sobre `SKILL.md` (fonte `.agents` e cópia `.claude`). Medido: segundos.
3. Se for preciso, reverter o commit da integração. Prazo: menos de 10 minutos.
4. Só a gravação do nível (C47): sem `--gravar` o `classificar` volta a só sugerir; para desfazer
   gravações já feitas, `git revert` do commit da gravação (cada gravação é um commit) ou
   `--reclassificar` a pedido do usuário. `JEV_MODO=off` grava só pelos sinais (PESADO, na dúvida).
5. Só o gancho de mensagens: `JEV_MENSAGENS=off` desliga só o gancho (a classificação de
   subtarefas continua). Para tirar o gancho de vez num projeto, remover a entrada
   `UserPromptSubmit` do Jev do `.claude/settings.json` e do `.codex/hooks.json` **do projeto**
   (C44). O `instalar-rules-local.mjs` recoloca a entrada se for rodado de novo.

## Limites

- ⛔ O Jev decide sozinho nível, modelo e `effort` **só com confiança ≥ 0,80** e sem sinal de
  PESADO ≥ 0,50, na subtarefa (C47) e na mensagem (C43). Abaixo disso vale a matriz e os sinais.
- ⛔ Não enviar conteúdo de pasta proibida, diff inteiro ou `.env` ao Jev.
- ⛔ Não trocar `jev-1.13.0` por `jev-latest` sem nova validação no benchmark.

## Classificar mensagens (C43)

Decidido em 2026-10-20 (etapa 029, JEV-GLOBAL-AI-FINAL). Pedido do usuário em 2026-10-20 00:06 e
respostas em 2026-10-20 00:18. Vale para toda mensagem do usuário, em todo projeto de `C:\fontes`.

### Quando roda

- Toda mensagem do usuário no Claude Code e no Codex, pelo gancho de prompt (`UserPromptSubmit`)
  **do projeto** (C44). O gancho fica no `.claude/settings.json` e no `.codex/hooks.json` do
  projeto e roda a cópia `rules-local/jev/` (`rules-local.md`). Não é mais gancho da conta.
- O `sincronizar.mjs --aplicar` **tira** o gancho global antigo da conta, se ele existir
  (Claude Code em todas as contas e `~/.codex/hooks.json`; guarda cópia `.bak`).
- A mesma mensagem não chama o Jev 2 vezes em 10 s: o gancho grava uma marca pelo `hash` dela
  (em `saidas/`, fora do Git) e a 2ª chamada sai sem chamar o Jev.
- Nas outras IAs, pela instrução desta regra (tabela abaixo).

### O que faz

- Sugere nível, modelo e `effort` para o pedido. A sugestão entra no contexto da IA antes da
  resposta.
- Roda os guardrails de segredo, pasta proibida, comando destrutivo e aprovação indevida no texto.
  Só **avisa**. Nunca bloqueia nem muda a mensagem (INV-2).
- Comando: `node scripts/jev.mjs mensagem [--texto …] [--projeto …] [--dry-run] [--json]`.
- Gancho: `scripts/jev/ganchos/claude-prompt.mjs`, copiado para
  `rules-local/jev/ganchos/claude-prompt.mjs` de cada projeto.

### Decisão

- Confiança ≥ 0,80 e nenhum sinal de PESADO → `decisao: jev`. O Jev decide o modelo daquela
  mensagem.
- Senão → `decisao: matriz`. Vale o nível mais alto entre o Jev e os sinais, e a mensagem vai
  para revisão humana (`revisar`).
- A decisão vale só para a mensagem. A classificação de subtarefas do quadro segue a C47 (acima).
- ⛔ Um sinal de PESADO ≥ 0,50 nunca é rebaixado, na mensagem nem na subtarefa (INV-5).

### Mensagens puladas

- Até 3 caracteres (`.`, `;`, `?`).
- Mensagens que começam com `/` (comandos).

### Custo

- `JEV_MAX_CUSTO_DIA`: US$ 1,00 por dia.
- `JEV_MAX_TOKENS_MENSAGEM`: 2.000 tokens por mensagem.
- Estourou o limite do dia → só sinais até o dia seguinte.

### Tempo máximo

- `JEV_TEMPO_MAXIMO_MENSAGEM_MS`: 4 s por mensagem.
- Passou do tempo → segue sem o Jev, sem erro na tela.

### Privacidade

- O texto passa por `redigir.mjs` antes do envio. Segredo bruto nunca vai à API.
- A auditoria fica em `saidas/mensagens-AAAA-MM.jsonl` (`scripts/jev/saidas/` no `rules-ai`,
  `rules-local/jev/saidas/` no projeto; fora do Git). Guarda só `hash`, nível, custo e ação.
  Nunca guarda o texto (INV-4).
- No `rules-ai`, a chave vem do ambiente ou do `.env` da raiz dele. Na cópia do projeto
  (`rules-local/jev/`), a chave vem **só do ambiente** (C44). Nunca é copiada para outro projeto
  nem impressa.

### Fallback

- Falha, sem chave, `JEV_MODO=off` ou `JEV_MENSAGENS=off` → só sinais. A mensagem passa.
- Nenhum caminho de erro vira `liberar` (INV-3).

### Quais IAs têm gancho de prompt

| IA | Gancho de prompt? | Como o Jev entra | Fonte |
|----|-------------------|------------------|-------|
| Claude Code | Sim (`UserPromptSubmit` no `.claude/settings.json` do projeto) | gancho `rules-local/jev/ganchos/claude-prompt.mjs`, gravado pelo `instalar-rules-local.mjs` (C44) | `code.claude.com/docs/en/hooks` |
| Codex | Sim (`UserPromptSubmit` no `.codex/hooks.json` do projeto; exige `codex_hooks = true` em `[features]` do `~/.codex/config.toml`) | gancho `rules-local/jev/ganchos/codex-prompt.mjs`, gravado pelo `instalar-rules-local.mjs` (C44) | `openai/codex` PR #14626 (lido só no resumo da busca; conferir na versão instalada) |
| Gemini CLI | não conferido (página não abriu) | instrução da regra (abaixo) | `geminicli.com/docs/hooks/reference` |
| Grok | não conferido (página não abriu) | instrução da regra (abaixo) | `docs.x.ai/build/features/hooks` |
| Qoder | não conferido (página não abriu) | instrução da regra (abaixo) | `docs.qoder.com/cli/hooks-reference` |
| opencode | não conferido (fontes divergem, espelho) | instrução da regra (abaixo) | `mintlify.com/anomalyco/opencode/sdk/plugin-api` |
| Devin | não conferido (não cita gancho) | instrução da regra (abaixo) | `cli.devin.ai/docs/essential-commands` |
| Kiro | não conferido (página não abriu) | instrução da regra (abaixo) | `kiro.dev/docs/cli/hooks` |
| Hermes Agent | não conferido (página não abriu) | instrução da regra (abaixo) | `hermes-agent.nousresearch.com/docs/user-guide/features/hooks` |
| Kilo Code | não conferido (não é gancho) | instrução da regra (abaixo) | `kilo.ai/docs/features/footgun-prompting` |

"Não conferido" é tratado como **sem gancho** até alguém conferir a página oficial.

### IAs sem gancho de prompt

- Antes de responder pedido que muda algo (código, arquivo, quadro ou comando), rodar
  `node C:\fontes\rules-ai\scripts\jev.mjs mensagem --texto "<pedido>"` e seguir a linha
  `decisao`: `jev` → nível e modelo do Jev; `matriz` ou `sinais` → matriz de
  `niveis-e-modelos.md` e skill `classificar-tarefa`.
- Se o comando falhar, seguir pelos sinais da skill `classificar-tarefa`, sem bloquear a resposta.
- Pergunta, conversa e mensagens puladas (até 3 caracteres ou que começam com `/`) não precisam
  do comando.
