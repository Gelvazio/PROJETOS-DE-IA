## Etapa 054-c91d4e27 — JEV-SEMPRE: o Jev AI sempre escolhe o modelo, nunca a IA sozinha

**Tarefa:** JEV-SEMPRE · **Pedido em:** 2026-10-24 08:54 · **Criada por:** Claude Code (Sonnet 5.5) (local · main · rules-ai)
**Pedido:** "QUERO QUE VOCE ESCREVA UMA REGRA MUITO CLARA NAS REGRAS GLOBAIS, ONDE TEM A REGRA DE CRIAR TAREFA E ESCOLHER MODELO -> E MUITO IMPORTANTE QUE SEMPRE SEJA USADO O JEV PRA ESCOLHER OS MODELOS!" e, em seguida: "NUNCA, JAMAIS ESCOLHA UM MODELO SEM O JEV AI"
**Objetivo:** nenhuma IA escreve nível, modelo ou `effort` de tarefa ou subtarefa por conta própria: quem decide é sempre o Jev; sem o Jev, a subtarefa fica sem nível e ninguém a pega.

### Escopo

- **Entra:** regra clara e proibitiva em `regras/ciclo-da-task.md`, `regras/niveis-e-modelos.md`, `regras/jev.md` e `regras/frentes-e-reserva.md`; entrada no Registro de decisões do `STATUS.md`; `dist/` e `VERSAO.md` regerados sem `--aplicar`.
- **Não entra:** mudar a matriz de quem pega cada nível, o limiar do Jev (0,80) ou o código do Jev; reclassificar as subtarefas já existentes (isso é outro pedido).
- **Muda em relação à C42 e à C47:** o recurso "sem o Jev vale o sinal mais restritivo" deixa de existir para escolher o modelo. Sem o Jev, a subtarefa fica **sem nível**, ninguém a pega e a IA avisa o usuário.

### Decisões

- 2026-10-24 08:54: pedido direto do usuário, que dita o conteúdo da regra; tarefa **pequena** de texto em regras (nenhum banco, nenhuma segurança, nenhum código). A regra vale para **todas as IAs e todos os projetos**.
- 2026-10-24 08:54: nível, modelo e `effort` das subtarefas desta tarefa **não foram escolhidos pela IA**: vêm do Jev (`node scripts/jev.mjs classificar --id <ID> --gravar`).

### JEV-SEMPRE.1 — Escrever a regra "o Jev sempre escolhe o modelo" nas regras globais

**Próximo passo:** concluída; a .2 regera o `dist/`.

- **Nível:** PESADO — classificado (sinais)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **Fonte:** sinais
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** escrever, de forma curta e proibitiva, em `ciclo-da-task.md` (passo de criar), `niveis-e-modelos.md` (seção do Jev), `jev.md` e `frentes-e-reserva.md` que: (1) quem cria ou divide tarefa **nunca** escreve `Nível`, `Modelo` nem `Effort`; (2) a classificação é sempre `node scripts/jev.mjs classificar --id <ID> --gravar`; (3) sem o Jev (sem chave, `JEV_MODO=off`, falha) a subtarefa fica **sem nível**, ninguém a pega e a IA avisa o usuário; (4) mudar de modelo, ampliar ou restringir quem pega (ex.: "Haiku ou DeepSeek") também passa pelo Jev ou por ordem escrita do usuário; (5) a IA que escolher modelo sem o Jev comete infração igual à da regra maior. Registrar a decisão no Registro de decisões do `STATUS.md`.
- **Critérios de Aceitação:** a regra aparece, com as mesmas palavras-chave, nos quatro arquivos; nenhum trecho ainda diz que a IA escolhe nível pelos sinais; a C42/C47 está ajustada.
- **Depende de:** Nenhuma
- **Entrega:** commit "feat(JEV-SEMPRE.1)" (regras/ciclo-da-task.md, niveis-e-modelos.md, jev.md, frentes-e-reserva.md; decisão no STATUS.md)
- **Verificação:** a regra C52 aparece nos 4 arquivos (grep "C52"); `niveis-e-modelos.md` e `jev.md` não dizem mais que a IA escolhe pelos sinais quando o Jev falha

### JEV-SEMPRE.2 — Regerar `dist/REGRAS-GLOBAIS.md` e `VERSAO.md` (sem `--aplicar`)

**Próximo passo:** concluída; a .3 leva às IAs (`--aplicar`, usuário).

- **Nível:** LEVE — classificado (sinais)
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **Fonte:** sinais
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** rodar `node scripts/sincronizar.mjs` sem `--aplicar` e conferir que o `dist/` contém a regra nova.
- **Critérios de Aceitação:** `dist/REGRAS-GLOBAIS.md` e `VERSAO.md` regerados; a regra aparece no `dist/`.
- **Depende de:** JEV-SEMPRE.1
- **Entrega:** commit "feat(JEV-SEMPRE.2)" (VERSAO.md regerado; `dist/REGRAS-GLOBAIS.md` é local, fora do Git)
- **Verificação:** `dist/REGRAS-GLOBAIS.md` contém a regra C52 (grep "C52", 10 ocorrências); `VERSAO.md` regerado para `2026-10-24-238070b8`

### JEV-SEMPRE.3 — Levar às IAs (`node scripts/sincronizar.mjs --aplicar`)

**Próximo passo:** o usuário roda `node scripts/sincronizar.mjs --aplicar` no computador dele.

- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** o usuário roda `node scripts/sincronizar.mjs --aplicar` no computador dele (grava os arquivos globais das IAs).
- **Critérios de Aceitação:** arquivos globais das IAs com a regra nova.
- **Depende de:** JEV-SEMPRE.2

### JEV-SEMPRE.4 — O comando do Jev não grava nada quando o Jev falha (sem chave, `JEV_MODO=off`, rede, 401, 429, 529, timeout)

**Próximo passo:** concluída.

- **Nível:** MEDIO — classificado (sinais)
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Fonte:** sinais
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** ajustar `scripts/jev/` (comando `classificar --gravar`) para, quando o Jev não responder, **recusar a gravação** e deixar a subtarefa sem nível, com mensagem clara ao usuário (C52); hoje ele grava o nível pelos sinais (`Fonte: sinais`) também nesse caso. Mantém a gravação pelo sinal mais restritivo quando o Jev **respondeu** com confiança baixa.
- **Critérios de Aceitação:** com `JEV_MODO=off` e sem chave, `classificar --id <ID> --gravar` sai com código de erro e não altera o quadro nem a etapa; com o Jev respondendo, o comportamento atual se mantém.
- **Depende de:** JEV-SEMPRE.1
- **Entrega:** commit "feat(JEV-SEMPRE.4)" (scripts/jev/cli/comando-classificar.mjs)
- **Verificação:** `node --check`; com `JEV_MODO=off` e com chave inválida (401) o `--gravar` sai com código 2 e 5, imprime a mensagem C52 e não grava; com o Jev respondendo, o comportamento anterior é mantido
