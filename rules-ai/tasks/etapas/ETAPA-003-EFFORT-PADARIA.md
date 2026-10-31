## Etapa 003 — EFFORT-PADARIA: testar `low`, `medium` e `high` em todos os modelos com um projeto de padaria

**Tarefa:** EFFORT-PADARIA · **Pedido em:** 2026-10-16 20:02 · **Criada por:** Claude Code (Opus 5.5) (local · main)
**Pedido:** "crie 1 tarefa mais complexa, que consiga testar os 3 tipos de effort, em todos os modelos, e pra isso, crie 1 projeto simples de padaria, na pasta testes-effort-padaria, salve ela no quadro e assuma"
**Objetivo:** um desafio de raciocínio com várias etapas (produção, estoque, compras, descontos e escala de forno) que **não** se resolve com um script de força bruta, para medir se o `effort` muda tokens, tempo e **acerto** em cada modelo.

> 📦 **Movida em 2026-10-18 19:00** para o quadro do projeto `C:/fontes/testes-effort-padaria` (`tasks/STATUS.md`, etapa 001), a pedido do usuário ("ESTA TAREFA EFFORT-PADARIA, MOVA PARA O PROJETO C:\fontes	estes-effort-padaria"). Este arquivo fica só como histórico; o gabarito ficou no `rules-ai` (`gabaritos/EFFORT-PADARIA.md`).

> 🌐 **TAREFA GLOBAL** (todos os projetos e IAs). Continua a `CONFEFFORT-GLOBAL` (etapa 002): lá o problema era fácil e os agentes resolveram por script; aqui o agente é proibido de executar código.

### Escopo

- **Entra:** pasta `C:\fontes\testes-effort-padaria` (README, `AGENTS.md`, `dados/*.md` e `DESAFIO.md`); gabarito calculado por script **fora do projeto** e guardado só nesta etapa; uma rodada por modelo × `effort`; relatório comparativo.
- **Não entra:** código de aplicação da padaria; testes automatizados (regra global); mudar o `effort` dos agentes dos projetos (decisão depois do relatório).

### Protocolo de medição

1. Agente descartável do modelo, com o `effort` da rodada, recebe o mesmo enunciado: ler só a pasta do projeto, **sem executar código**, responder no formato do `DESAFIO.md`.
2. Medidas: tokens totais, tempo, chamadas de ferramenta e **nota** (itens certos / total, conferidos contra o gabarito).
3. Claude (Haiku, Sonnet, Opus): o líder Opus 5.5 dispara os agentes de cada modelo pelo parâmetro `effort`. Gemini e DeepSeek: só pela ferramenta deles, com a configuração equivalente de raciocínio.

### Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-16 20:02 | Projeto só com dados e enunciado (sem app), agente proibido de rodar código | Claude Code (Opus 5.5) | A rodada 2 da etapa 002 mostrou que, com script, o `effort` quase não aparece |
| 2026-10-16 20:02 | Subtarefas .3 a .5 rodadas pelo líder Opus com agentes do modelo de cada uma (o modelo medido é o do agente) | Claude Code (Opus 5.5) | Fluxo de equipe de `niveis-e-modelos.md` |
| 2026-10-16 20:02 | Pasta sem remoto no GitHub: repositório Git local; push quando o usuário criar o remoto | Claude Code (Opus 5.5) | Criar repositório no GitHub é ação externa |

### EFFORT-PADARIA.1 — Criar o projeto `testes-effort-padaria`

**Próximo passo:** — (entregue).

- **Nível:** MEDIO — vários arquivos de dados ligados entre si, sem código.
- **Entrega:** commit `4411bcf` em `testes-effort-padaria` (repositório local, sem remoto) e linha no mapa `C:/fontes/CLAUDE.md` · **Verificação:** os 7 arquivos conferidos contra o gabarito (todos os números usados existem nos dados).
- **JEV-AI-SUGGESTION:** NAO

### EFFORT-PADARIA.2 — Gabarito

- **Nível:** MEDIO — cálculo por script na pasta temporária da sessão; resultado só nesta etapa.
- **Entrega:** gabarito abaixo (script `gabarito.py` na pasta temporária da sessão, frações exatas; forno por soma de subconjuntos). **Verificação:** ovos 94,5 → 95; leite 6.600 ml; forno 607 min no total, ímpar → ótimo 304.
- **JEV-AI-SUGGESTION:** NAO

> 🔒 Gabarito movido para `gabaritos/EFFORT-PADARIA.md` (raiz do `rules-ai`).

### EFFORT-PADARIA.3 a .7 — Rodadas por modelo

- **.3** Haiku 5.5 (`low`, `medium`, `high`) · **.4** Sonnet 5.5 · **.5** Opus 5.5 (+ `xhigh`) · **.6** Gemini Pro (só Gemini CLI) · **.7** DeepSeek raciocínio (só DeepSeek).
- **Nível:** .3 LEVE, .4 MEDIO, .5 PESADO, .6 e .7 MEDIO (nível do modelo medido).

### EFFORT-PADARIA.8 — Relatório comparativo · EFFORT-PADARIA.9 — Aceite do usuário
- **JEV-AI-SUGGESTION:** NAO

#### EFFORT-PADARIA.3 — Haiku 5.5 — resultado (2026-10-16 20:15, líder Claude Code Opus 5.5)

| effort | nota | tokens | tempo | leituras |
|---|---|---|---|---|
| `low` | 38/38 | 52.476 | 27,7 s | 7 |
| `medium` | 38/38 | 54.252 (+3,4%) | 33,2 s (+20%) | 8 |
| `high` | 38/38 | 56.776 (+8,2%) | 41,4 s (+49%) | 8 |

**Conclusão: `effort` aplicado no Haiku** — tokens e tempo crescem de `low` a `high`; a nota já é máxima em `low` (o desafio não separa os níveis pelo acerto neste modelo). Nenhum agente executou código.

#### EFFORT-PADARIA.4 — Sonnet 5.5 — resultado (2026-10-16 20:20, líder Claude Code Opus 5.5)

| effort | nota | tokens | tempo | leituras |
|---|---|---|---|---|
| `low` | 38/38 | 50.183 | 27,5 s | 8 |
| `medium` | 38/38 | 50.354 (+0,3%) | 27,5 s (0%) | 8 |
| `high` | 38/38 | 51.627 (+2,9%) | 27,9 s (+1%) | 8 |

**Conclusão: no Sonnet o `effort` tem efeito fraco** — `low` e `medium` iguais; `high` só um pouco mais de tokens. Coincide com a CONFEFFORT-GLOBAL.6 (etapa 002). Nota máxima nos três; nenhum agente executou código.

#### EFFORT-PADARIA.5 — Opus 5.5 — resultado (2026-10-16 20:30, líder Claude Code Opus 5.5)

| effort | nota | tokens | tempo | leituras |
|---|---|---|---|---|
| `low` | 38/38 | 50.084 | 34,7 s | 8 |
| `medium` | 38/38 | 50.254 (+0,3%) | 35,7 s (+3%) | 8 |
| `high` | 38/38 | 50.358 (+0,5%) | 36,0 s (+4%) | 8 |
| `xhigh` | 38/38 | 52.065 (+4,0%) | 49,2 s (+42%) | 8 |

**Conclusão: no Opus, `low` a `high` quase iguais; só `xhigh` muda** (mais tempo e tokens, mesma nota).

#### EFFORT-PADARIA.8 — Relatório comparativo (2026-10-16 20:31)

| Modelo | `low` → `high`: tokens | `low` → `high`: tempo | Nota | Leitura |
|---|---|---|---|---|
| Haiku 5.5 | +8,2% | +49% | 38/38 nos 3 | `effort` aplicado e visível |
| Sonnet 5.5 | +2,9% | +1% | 38/38 nos 3 | efeito fraco (igual à etapa 002) |
| Opus 5.5 | +0,5% (`xhigh` +4,0%) | +4% (`xhigh` +42%) | 38/38 nos 4 | só `xhigh` muda |

**Conclusões:**
1. O `effort` **é aplicado** nos três modelos Claude (tokens e tempo nunca diminuem com o nível), mas o efeito é forte só no Haiku e no `xhigh` do Opus.
2. **Nenhum nível mudou a nota**: os 10 agentes acertaram 38/38. Para este tipo de tarefa (contas em várias etapas), subir o `effort` só aumenta custo e tempo.
3. Recomendação para decisão do usuário: manter `low` em `LEVE` e `medium` em `MEDIO`; em `PESADO`, `high` basta — `xhigh` só com pedido. Repetir o teste com um desafio em que algum modelo erre, para medir ganho de acerto.
4. Ressalva: 1 execução por nível; Gemini e DeepSeek (.6 e .7) ainda faltam.

#### EFFORT-PADARIA.9 — Aceite

- 2026-10-16: usuário respondeu "aceito" ao relatório da .8. A mãe continua aberta até a .6 (Gemini) e a .7 (DeepSeek).
