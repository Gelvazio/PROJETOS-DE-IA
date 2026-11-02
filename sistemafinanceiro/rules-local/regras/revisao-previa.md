# 🔍 Revisão prévia — toda subtarefa revisada por 1 Haiku (effort xhigh) antes de ser feita (C62)

Decidida em 2026-11-02 (C62; pedido do usuário: "toda tarefa que for criada deve ser revisada por 1
agente Haiku e 1 Sonnet antes de ser feita"). Ajustada no mesmo dia (pedido do usuário): só 1
revisor, Haiku com `effort xhigh`; campo Leitura permitida; revisor com leitura limitada. Motivo: um
executor gastou 10 min e 50% da sessão lendo o projeto inteiro sem necessidade. Vale para **todas as
IAs e todos os projetos**. Complementa `ciclo-da-task.md` (passo "Revisar") e `jev.md`.

> **Projeto no banco (C58):** no `rules-ai`, **ainda não existe RPC** para gravar a revisão em `quadro_tarefas` (as RPC são `reservar`, `entregar`, `criar_subtarefa`, `liberar` e `mudar_status`). Até ela existir, o líder grava a linha `Revisão: …` no começo do `p_verificacao` da RPC `entregar`, e a falta da RPC fica como pendência para o usuário. Nos projetos em `.md`, a revisão vai na seção da subtarefa, na etapa.

## A regra

- ✅ Toda **subtarefa** criada (inclusive as criadas no caminho pela C26) passa por **1 revisão**
  antes de alguém reservá-la para executar, feita pelo **modelo rápido** com o maior esforço de
  raciocínio que a ferramenta tiver.
- ✅ No Claude Code: **Haiku 5.5 com `effort xhigh`**. Isso vale só para o agente revisor e prevalece
  sobre a tabela de `esforco.md` (`executor-leve` continua `low`).
- ✅ Se a ferramenta não aceitar `xhigh` para o Haiku, usar o maior esforço aceito e registrar na
  Revisão qual foi usado.
- ✅ Vale **por subtarefa**, não só na mãe.

## Perfil do revisor

- ✅ O revisor atua como **especialista sênior em desenvolvimento de software, com mais de 15 anos
  de experiência** (pedido do usuário, 2026-11-02).
- ✅ No Claude Code, o prompt do agente revisor começa dizendo esse perfil.
- ✅ Revisa com esse olhar: ambiguidade no pedido, escopo grande demais para uma subtarefa, solução
  frágil ou mais complexa que o necessário, risco escondido e verificação fraca.
- ⛔ O perfil não dá ao revisor poder de executar, reclassificar nível (Jev, C52) nem aprovar plano
  de tarefa grande (isso é do usuário).

## Leitura permitida

- ✅ Toda subtarefa traz o campo `Leitura permitida:` com a lista **curta** de arquivos e pastas que
  o executor pode abrir (caminhos exatos; pasta só quando necessário).
- ✅ A revisão confere que o campo existe, que é curto e que basta para fazer a subtarefa. Se faltar
  ou for genérico ("o projeto", "tudo"), REPROVADO.
- ⛔ O executor **não lê** nada fora da lista. Se precisar, para, avisa o líder (ou o usuário) e a
  lista é ampliada antes; ampliação grande volta para revisão.
- Origem: o caso dos 10 minutos e 50% da sessão gastos lendo o projeto inteiro.

## Limite de leitura do revisor

- ⛔ O revisor lê **só** o texto da subtarefa (e da mãe) e os arquivos citados nela. **Nunca** o
  projeto inteiro, nem busca ampla por pastas.
- ✅ Se não der para avaliar só com isso, é sinal de subtarefa mal descrita: REPROVADO com o motivo,
  não "ler mais".

## Equivalente em outras IAs

| Ferramenta | Revisor (todos com o raciocínio no máximo disponível) |
|------------|--------------------------------------------------------|
| Claude Code | Haiku 5.5 (`effort xhigh`) |
| Gemini CLI | Flash |
| Antigravity | Gemini Flash |
| Grok | rápido |
| DeepSeek | V4.1 Flash |
| OpenCode | deepseek-flash |
| Codex, Cursor, Qoder, Devin, Copilot | o modelo mais rápido da ferramenta |

## O que o revisor confere

- Objetivo claro.
- Escopo: o que entra e o que não entra.
- Critério de pronto.
- Arquivos citados existem.
- Leitura permitida existe, é curta e suficiente.
- Verificação definida.
- Risco escondido: banco, segurança, apagar dados.
- Se o nível gravado pelo Jev parece coerente. ⚠️ O revisor só **aponta**; quem muda nível é o Jev
  (C52).

## Resultado

O revisor grava na subtarefa `APROVADO` ou `REPROVADO: <motivo>`, no campo:

`Revisão: Haiku (effort xhigh) <APROVADO|REPROVADO: motivo> (<data hora>)`

Se o esforço usado foi outro (ver "A regra"), o campo registra o esforço real.

## Bloqueio

- ⛔ Sem a aprovação, ninguém reserva a subtarefa.
- ❌ **Reprovada:** quem criou corrige a subtarefa e manda revisar de novo.
- ⛔ **Sem revisor disponível:** a subtarefa fica livre, sem execução, e a IA avisa o usuário.

## Limites

- ⛔ Revisar **não é pegar tarefa**. O Haiku revisar MEDIO/PESADO não viola C2/C22. Nenhum revisor
  executa nada.
- ⛔ A revisão **não substitui** o Jev (C52) nem a conferência da entrega (C41): ela acontece
  **antes**; aquelas, **depois**.
- ⛔ O Opus continua fora (C60): não é revisor.

## Equipe de agentes do Claude Code

O líder dispara 1 revisor Haiku com `effort: xhigh` logo depois que o Jev classificar, e só reserva
ou delega depois da aprovação.

## Como conferir

```
☐ Toda subtarefa nova tem 1 revisão Haiku com effort xhigh antes de ser reservada?
☐ A revisão está gravada na subtarefa, no campo Revisão, com data e hora?
☐ A subtarefa tem Leitura permitida curta, e o executor não leu fora dela?
☐ O revisor leu só a subtarefa e os arquivos citados?
☐ Nenhum revisor executou a subtarefa nem pegou tarefa?
☐ Subtarefa reprovada ou sem revisor não foi reservada?
☐ O prompt do revisor trouxe o perfil de especialista sênior (15+ anos)?
```
