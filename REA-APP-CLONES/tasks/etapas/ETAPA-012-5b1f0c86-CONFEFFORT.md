## Etapa 012-5b1f0c86 — CONFEFFORT: Conferir o esforço (`effort`) em cada modelo

> 🌐 **MOVIDA PARA O QUADRO GLOBAL (2026-10-16 19:51):** esta tarefa agora é global e vive em
> `C:\fontes\rules-ai\tasks\STATUS.md` como `CONFEFFORT-GLOBAL` (etapa 002). Não reservar aqui; este arquivo fica como histórico e procedimento.

**Tarefa:** CONFEFFORT · **Pedido em:** 2026-10-16 13:20 · **Criada por:** Claude Code (Sonnet 5.5) (local · main)
**Pedido:** "CRIE 1 TAREFA QUE FAÇA ISSO EM CADA MODELO, HAIKU, SONNET OU OPUS, OU GEMINI, OU
DEEPSEEK E SÓ DEVE SER EXECUTADA PELO REFERIDO MODELO, PRA CONFERIR ISSO"
**Objetivo:** descobrir, **dentro de cada modelo**, se o `effort` fixado no frontmatter dos agentes
(ETAPA-011) é de fato aplicado, e registrar a prova (ou a falta dela). O teste feito só com o
`executor-leve` mostrou que o agente não enxerga o próprio esforço (ver Contexto).

### Contexto

- Na ETAPA-011 os 4 agentes receberam `effort:` (`low`, `low`, `medium`, `high`). Um agente de
  teste leu `effort: low` mas respondeu que **não sabe** o esforço usado na execução: a conferência
  não pode ser só perguntar ao modelo.
- Por isso a conferência usa **evidência de fora**: tokens de raciocínio, tempo e tamanho da
  resposta num **problema padrão**, comparados entre `low`, `medium` e `high` do mesmo modelo.

### Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-16 13:20 | Uma subtarefa **por modelo** (Haiku, Sonnet, Opus, Gemini, DeepSeek); cada uma só pode ser pega **pelo modelo escrito nela** (coluna `Modelo`, "só <modelo>") | Gelvazio (pedido) | "SÓ DEVE SER EXECUTADA PELO REFERIDO MODELO" |
| 2026-10-16 13:20 | Tarefa **pequena**: só `.md` e anotação na etapa, sem código, banco ou segurança; o pedido do usuário detalha o escopo | Claude Code (Sonnet 5.5) | `ciclo-da-task.md` (pequena × grande) |
| 2026-10-16 13:20 | Gemini e DeepSeek entram no nível `MEDIO` (Gemini Pro e modelo de raciocínio), como na matriz da skill `classificar-tarefa` | Claude Code (Sonnet 5.5) | O `pre-commit` só confere o **nível**; a exclusividade por modelo é regra de texto (ver Anotação) |

### Problema padrão (o mesmo em todas as subtarefas)

Colar este enunciado, sem mudar uma palavra, e registrar a resposta e as medidas:

> Em uma fila há 7 pessoas: A, B, C, D, E, F, G. B está antes de D. C está imediatamente depois
> de A. E não é nem a primeira nem a última. F está depois de G. D está antes de A. Quantas
> ordens são possíveis? Liste todas e mostre como chegou ao total.

Resposta de referência: o modelo deve **mostrar a conta**; o que se compara aqui é o **esforço**
(tokens de raciocínio, tempo, passos), não só o acerto.

### Procedimento (cada subtarefa)

1. Conferir que você é o modelo da subtarefa (nome exato da frente; sem isso, **parar**).
2. Para cada nível `low`, `medium` e `high`: rodar o problema padrão num agente descartável do
   próprio modelo com aquele `effort` no frontmatter (cópia em pasta temporária fora do repositório;
   nada de editar os agentes reais).
3. Medir por fora: tokens totais do subagente, tempo e tamanho da resposta (relatório de uso ou
   transcript do subagente). **Não** aceitar "acho que estou em medium" como prova.
4. Concluir em uma linha: `effort aplicado` (tokens/tempo crescem de `low` a `high`),
   `effort ignorado` (sem diferença) ou `não deu para medir` (e por quê).
5. Registrar na seção da subtarefa (Entrega e Verificação) com a tabela das 3 medidas.

### CONFEFFORT.1 — Haiku 5.5: conferir o `effort`

**Próximo passo:** sessão Claude Code com Haiku 5.5 reserva e segue o Procedimento.

- **Nível:** LEVE — só medir e anotar, sem código · **Modelo:** só Claude Code Haiku 5.5 (nenhum outro modelo pega)
- **Descrição:** Procedimento acima, com agentes de modelo `haiku`.
- **Critérios de Aceitação:** tabela com as 3 medidas (`low`, `medium`, `high`) e a conclusão em uma linha.
- **Entrega:** — · **Verificação:** —
- **JEV-AI-SUGGESTION:** NAO

### CONFEFFORT.2 — Sonnet 5.5: conferir o `effort`

**Próximo passo:** sessão Claude Code com Sonnet 5.5 reserva e segue o Procedimento.

- **Nível:** MEDIO — medir em 3 execuções e comparar · **Modelo:** só Claude Code Sonnet 5.5 (nenhum outro modelo pega)
- **Descrição:** Procedimento acima, com agentes de modelo `sonnet`.
- **Critérios de Aceitação:** como na CONFEFFORT.1.
- **Entrega:** — · **Verificação:** —
- **JEV-AI-SUGGESTION:** NAO

### CONFEFFORT.3 — Opus 5.5: conferir o `effort`

**Próximo passo:** sessão Claude Code com Opus 5.5 (ou superior) reserva e segue o Procedimento.

- **Nível:** PESADO — nível do Opus na matriz (a tarefa em si é só medir) · **Modelo:** só Claude Code Opus 5.5 (nenhum outro modelo pega)
- **Descrição:** Procedimento acima, com agentes de modelo `opus`; incluir também `xhigh`.
- **Critérios de Aceitação:** como na CONFEFFORT.1, com a linha extra do `xhigh`.
- **Entrega:** — · **Verificação:** —
- **JEV-AI-SUGGESTION:** NAO

### CONFEFFORT.4 — Gemini Pro: conferir o esforço

**Próximo passo:** sessão Gemini CLI com modelo Pro reserva, descobre qual é o equivalente de
`effort` no Gemini CLI (ex.: orçamento de raciocínio/`thinking`) e segue o Procedimento.

- **Nível:** MEDIO — nível do Gemini Pro na matriz · **Modelo:** só Gemini CLI com modelo Pro (nenhum outro modelo pega)
- **Descrição:** o Gemini CLI pode não ter `effort` no frontmatter; registrar **qual** configuração
- **JEV-AI-SUGGESTION:** NAO
  controla o raciocínio e medir `baixo` × `médio` × `alto` nela. Se não houver como variar, concluir
  `não deu para medir` com o motivo.
- **Critérios de Aceitação:** como na CONFEFFORT.1, indicando a configuração usada.
- **Entrega:** — · **Verificação:** —

### CONFEFFORT.5 — DeepSeek (modelo de raciocínio): conferir o esforço

**Próximo passo:** sessão DeepSeek com o modelo de raciocínio reserva, descobre o equivalente de
`effort` na ferramenta usada e segue o Procedimento.

- **Nível:** MEDIO — nível do modelo de raciocínio do DeepSeek na matriz · **Modelo:** só DeepSeek (modelo de raciocínio) (nenhum outro modelo pega)
- **Descrição:** igual à CONFEFFORT.4, para o DeepSeek.
- **Critérios de Aceitação:** como na CONFEFFORT.4.
- **Entrega:** — · **Verificação:** —
- **JEV-AI-SUGGESTION:** NAO

### Anotação

- A trava do `pre-commit` confere só o **nível**: Sonnet, Gemini Pro e DeepSeek (raciocínio) são todos
  `MEDIO`. A exclusividade por modelo vale pelo texto "só <modelo>" na coluna `Modelo` e na seção;
  quem não for o modelo escrito **não reserva**, mesmo que o hook deixe passar.
- Quando as 5 estiverem ✅, a mãe fecha; juntar as conclusões numa linha por modelo no
  "Registro de decisões" do `STATUS.md` e, se algum modelo ignorar o `effort`, abrir tarefa para
  remover ou ajustar o campo nos agentes.
