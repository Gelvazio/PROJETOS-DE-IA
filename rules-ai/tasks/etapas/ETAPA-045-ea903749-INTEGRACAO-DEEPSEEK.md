## Etapa 045-ea903749 — INTEGRACAO-DEEPSEEK: chamadas à API da DeepSeek nas tarefas simples

**Tarefa:** INTEGRACAO-DEEPSEEK · **Pedido em:** 2026-10-23 · **Criada por:** Claude Code (Haiku 5.5) (local · main · consumo-ia)
**Pedido:** "CRIE MAIS 1 TAREFA, DE NOME INTEGRACAO-DEEPSEEK, que deve integrar chamadas de api da deepseek nos modelos de IA nas tarefas mais simples conforme demanda e modelos da deepseek"
**Objetivo:** usar a API da DeepSeek para as tarefas mais simples (LEVE e parte da MEDIO), conforme a demanda, escolhendo o modelo DeepSeek de cada nível, sem tirar a decisão de nível do quadro.

### Escopo

- **Entra:** um cliente da API da DeepSeek; um roteador que escolhe o modelo DeepSeek pelo nível (`LEVE` → `deepseek-flash`; `MEDIO` → `deepseek-flash` com raciocínio; `PESADO` → `deepseek-v4-pro`, só se o usuário liberar); fallback para o modelo atual em qualquer falha; limite de custo e de tempo; auditoria sem texto; documentação.
- **Não entra:** mudar a matriz `regras/niveis-e-modelos.md` (é do usuário); reservar ou executar subtarefa por conta própria; trocar o nível de tarefa existente; mandar ao DeepSeek conteúdo de pasta proibida (C20, C23), `.env` ou diff inteiro; gravar chave em arquivo versionado.
- **Nível da mãe:** tarefa grande (banco não, mas segurança com chave e várias partes). Só começa com o "sim" do usuário ao plano desta etapa.

### Requisitos

- **R1.** QUANDO uma tarefa de nível `LEVE` for classificada, O SISTEMA DEVE usar o modelo `deepseek-flash` pela API da DeepSeek, com o mesmo `effort` da C21 (`low`). **Verificação:** chamada de teste com o texto de uma subtarefa `LEVE` e registro na auditoria.
- **R2.** QUANDO uma tarefa de nível `MEDIO` for classificada, O SISTEMA DEVE usar `deepseek-flash` com raciocínio. **Verificação:** a mesma chamada com o raciocínio ligado e o campo `modelo` gravado.
- **R3.** SE a API da DeepSeek falhar (rede, 401, 429, 529, timeout) OU o custo do dia passar do limite, ENTÃO O SISTEMA DEVE seguir com o modelo da matriz, sem bloquear a sessão. **Verificação:** simular falha com chave inválida e ver o fallback.
- **R4.** O SISTEMA DEVE ler a chave só da variável de ambiente `DEEPSEEK_API_KEY`. **Verificação:** `grep -r` no repositório não acha a chave; o arquivo de exemplo não a contém.
- **R5.** O SISTEMA DEVE gravar, por chamada, data, nível, modelo, tokens, custo e ação, sem o texto. **Verificação:** a linha da auditoria não contém o texto da mensagem.
- **R6.** ONDE a DeepSeek for chamada para `PESADO`, O SISTEMA DEVE pedir liberação do usuário antes. **Verificação:** a regra fica em Decisões.

### Invariantes

- **INV-1.** Nenhuma chave da DeepSeek aparece em log, em arquivo versionado ou na resposta da sessão. **Como conferir:** `git grep -n "sk-"` e leitura dos logs de auditoria (sem resultado = ok).
- **INV-2.** Nenhum caminho de erro vira `liberar` em silêncio: falha → matriz e `revisar`. **Como conferir:** teste de falha da R3.
- **INV-3.** Nenhum nível é rebaixado para caber no DeepSeek (C50, regra maior). **Como conferir:** a coluna Modelo de cada subtarefa continua igual à matriz.

### Perguntas abertas

- ✅ **P1.** Respondida em 2026-10-23: `LEVE` **e** `MEDIO` vão para o DeepSeek (R1 e R2).
- ✅ **P2.** Respondida em 2026-10-23: limite de **US$ 2 por dia** e **2.000 tokens por chamada** (R3).
- ✅ **P3.** Respondida em 2026-10-23: o cliente fica **só no `rules-ai`** (`scripts/deepseek/`).

### Riscos

- **Chave vazada:** guardada só no ambiente; INV-1 confere. Plano B: rotacionar a chave no painel da DeepSeek.
- **Custo alto:** limite de dia (P2). Plano B: desligar com `DEEPSEEK_MODO=off`.
- **Qualidade menor em PT-BR:** o Jev e o Sonnet revisam o que o DeepSeek fizer em `MEDIO`; `LEVE` sem revisão extra.

### Decisões

- 2026-10-23: tarefa criada a pedido do usuário; plano aguarda o "sim" dele; nenhuma subtarefa reservada.
- 2026-10-23: **plano aprovado pelo usuário** ("Aprovo o plano da INTEGRACAO-DEEPSEEK").
- 2026-10-23: **P1** — `LEVE` e `MEDIO` vão para o DeepSeek. **P2** — limite de **US$ 2 por dia** e **2.000 tokens por chamada**. **P3** — cliente só no `rules-ai`.
- 2026-10-23: limite por chamada (2.000 tokens) respondido pelo usuário; a `.4` deve gravá-lo como `DEEPSEEK_MAX_TOKENS`.
- 2026-10-23: a `.1` foi concluída; a `.2` (PESADO) está livre para o modelo dela (Sonnet, Opus 5.5+/Fable ou DeepSeek). Este registro não reserva nada.

### INTEGRACAO-DEEPSEEK.1 — Responder P1, P2 e P3 (decisões do usuário)

**Próximo passo:** ✅ concluída em 2026-10-23 (respostas em Decisões).

- **Nível:** Usuário — só o usuário decide
- **Modelo:** Usuário
- **Effort:** — (decisão do usuário)
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** manual
- **Descrição:** Fechar P1, P2 e P3 nesta etapa.
- **Critérios de Aceitação:** P1 a P3 com resposta registrada em Decisões.
- **Depende de:** Nenhuma
- **Verificação:** resposta do usuário na conversa.

### INTEGRACAO-DEEPSEEK.2 — Cliente da API da DeepSeek com chave só em variável de ambiente

**Próximo passo:** ✅ entregue em 2026-10-23; segue a .3 (roteador)

- **Nível:** PESADO — chave e segredo (sinal mais restritivo)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** manual
- **Descrição:** Criar um cliente único para a API da DeepSeek (R4), com redação de segredos (INV-1), tempo máximo e tratamento de erro sem exceção não tratada.
- **Arquivos:** módulo novo em `scripts/deepseek/` (cliente), `.env.example` (só nomes de variáveis)
- **Critérios de Aceitação:** R4 e INV-1 atendidos; sem chave, o cliente sai com erro claro e não chama a API.
- **Depende de:** INTEGRACAO-DEEPSEEK.1
- **Entrega:** `scripts/deepseek/cliente.mjs` (novo; `chamarDeepseek`, `estaDesligada`, `lerLimites`, `TIPOS_ERRO`) e `.env.example` (novo, só nomes: DEEPSEEK_API_KEY, DEEPSEEK_MODO, DEEPSEEK_MAX_TOKENS=2000, DEEPSEEK_MAX_CUSTO_DIA=2). Chave só de `process.env.DEEPSEEK_API_KEY`; redação reutiliza `redigirTexto` de `scripts/jev/guardrails/redigir.mjs`; `DEEPSEEK_TIMEOUT_MS` opcional (padrão 30000). O campo de raciocínio (`thinking: {type: "enabled"}`) fica isolado em `montarCorpo`; a .3 confirma o nome na documentação da DeepSeek.
- **Verificação:** `node --check scripts/deepseek/cliente.mjs` = ok; `git grep -n "sk-" -- scripts/deepseek .env.example` e `grep -rn` = sem resultado (INV-1, R4); `.env.example` não é ignorado (`!.env.example`) e só tem nomes; simulação com `fetchImpl` injetado (sem chamada real): sem chave e `off` não chamam a API; 401, 429, 500, 400, rede, timeout, resposta inválida e pedido inválido voltam `{ok:false, erro}` sem exceção; mensagem com e-mail sai mascarada no corpo enviado, `max_tokens` = 2000 e erro sem chave nem texto do pedido; maior linha = 98 caracteres.

### INTEGRACAO-DEEPSEEK.3 — Roteador de modelo por nível (LEVE e MEDIO)

**Próximo passo:** ✅ entregue em 2026-10-23; segue a .4 (limites)

- **Nível:** MEDIO — código com lógica, de 1 a 3 arquivos
- **Modelo:** só Sonnet ou DeepSeek — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** manual
- **Descrição:** Escolher o modelo DeepSeek por nível (R1 e R2), com o fallback da R3 e a auditoria da R5.
- **Arquivos:** `scripts/deepseek/roteador.mjs`, `scripts/deepseek/auditoria.mjs`
- **Critérios de Aceitação:** R1, R2, R3 e R5 atendidos.
- **Depende de:** INTEGRACAO-DEEPSEEK.2
- **Entrega:** `scripts/deepseek/roteador.mjs` (novo; `rotearChamada`, `MOTIVOS`, `ACOES`) e `scripts/deepseek/auditoria.mjs` (novo; `registrarChamada`, `somarCustoDoDia`, `lerTetoDiario`, `estimarCusto`, `formatarDia`); `.gitignore` ganhou `scripts/deepseek/saidas/`. Rotas: `LEVE` -> `deepseek-flash` sem raciocínio; `MEDIO` -> `deepseek-flash` com `thinking: {type: "enabled"}`; `PESADO` -> `{ usar: false, motivo: 'pesado-sem-liberacao' }` (R6; a liberação pelo usuário ainda não existe no código: PESADO nunca chama a API). Qualquer falha (erro do cliente, `off`, sem chave, teto do dia, auditoria ilegível, erro interno) devolve `{ usar: false, motivo }` sem lançar (R3, INV-2). Auditoria: 1 linha JSONL por chamada em `scripts/deepseek/saidas/auditoria-AAAA-MM.jsonl` com lista fechada de campos (data, dia, nivel, modelo, raciocinio, tokensEntrada, tokensSaida, custoUsd, acao, motivo), sem texto nem chave (R5). Teto do dia: `DEEPSEEK_MAX_CUSTO_DIA` (padrão US$ 2) comparado com a soma de `custoUsd` do dia na auditoria, antes de cada chamada; a .4 refina limites e tempo.
- **Verificação:** `node --check` em `roteador.mjs` e `auditoria.mjs` = ok; maior linha = 99 e 97 caracteres; `grep -n "sk-"` nos dois arquivos = sem resultado; `git check-ignore -v scripts/deepseek/saidas/auditoria-2026-10.jsonl` confirma a pasta ignorada. Script descartável fora do repositório (apagado depois), com `fetchImpl` injetado e pasta de auditoria temporária, sem chamada real: R1 (LEVE: modelo `deepseek-flash`, corpo sem `thinking`, linha `usada` com tokens 1000/500 e custo > 0); R2 (`medio` em minúsculas aceito: corpo com `thinking: {type: "enabled"}`, linha com `raciocinio: true`); R6 (PESADO devolve `pesado-sem-liberacao` e não faz nenhuma chamada); R3 (401 `chave-recusada`, 429 `limite-de-taxa`, 500 e 529 `servidor`, rede, timeout com `DEEPSEEK_TIMEOUT_MS=50`, sem chave, `DEEPSEEK_MODO=off` sem chamar, pedido sem mensagens, nível inválido, argumento `undefined`, auditoria ilegível -> todos `{ usar: false, motivo }` sem exceção; falhas deixam linha `fallback` com o motivo); R5 (arquivo bruto não contém o texto do pedido, a resposta nem a chave; campos exatamente os da lista fechada); teto (linha de US$ 2,50 no dia + linha corrompida: soma 2,5, LEVE devolve `limite-diario` sem chamar e audita `bloqueada`; com `DEEPSEEK_MAX_CUSTO_DIA=5` chama; outro dia soma 0). Resultado: TUDO OK.
- **Dúvidas registradas:** (1) o nome do campo que liga o raciocínio (`thinking: {type: "enabled"}`, em `montarCorpo` do cliente) não pôde ser confirmado na documentação pública sem acesso à rede: segue isolado em `montarCorpo` e deve ser conferido na primeira chamada real da .4/.5. (2) O preço por milhão de tokens usado na estimativa de custo (entrada US$ 0,28 e saída US$ 0,42, constantes `PRECO_ENTRADA_USD`/`PRECO_SAIDA_USD` em `auditoria.mjs`) é uma estimativa da tabela pública e deve ser conferido com a fatura do `deepseek-flash`. (3) Limite conhecido: se a gravação da auditoria falhar sempre (disco), o teto não é percebido; leitura ilegível já bloqueia a chamada.

### INTEGRACAO-DEEPSEEK.4 — Limite de custo, modo `off` e fallback de tempo

**Próximo passo:** ✅ entregue em 2026-10-23; segue a .5 (documentação)

- **Nível:** PESADO — custo e segurança (limite que bloqueia gasto)
- **Modelo:** só Opus 5.5+/Fable, Sonnet ou DeepSeek — nunca outro
- **Effort:** high
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** manual
- **Descrição:** Aplicar o limite de US$ 2 por dia (P2), o modo `DEEPSEEK_MODO=off` e o tempo máximo por chamada. Acima do limite, só a matriz.
- **Arquivos:** `scripts/deepseek/limites.mjs`
- **Critérios de Aceitação:** R3 atendida; `off` desliga a chamada sem apagar o código.
- **Depende de:** INTEGRACAO-DEEPSEEK.3
- **Entrega:** `scripts/deepseek/limites.mjs` (novo; único lugar que lê `DEEPSEEK_MODO`, `DEEPSEEK_MAX_CUSTO_DIA` padrão 2, `DEEPSEEK_MAX_TOKENS` padrão 2000 e `DEEPSEEK_TIMEOUT_MS` padrão 30000; exporta `lerLimites`, `estaDesligada`, `estimarTokensEntrada`, `passouDoTetoDeTokens`, `passouDoTetoDiario`, `limitarTempo`). Valor ausente, vazio, não numérico, zero, negativo ou com sufixo (`2abc`, `1e3`) volta ao padrão (antes `parseInt`/`parseFloat` aceitavam `2abc`). Integração com o mínimo de mudança: `cliente.mjs` perdeu as cópias de `inteiroPositivo`/`estaDesligada`/`lerLimites` e reexporta as de `limites.mjs`; `auditoria.mjs` manteve `lerTetoDiario` como fino repasse a `lerLimites`; `roteador.mjs` passou a usar `lerLimites` (barreiras na ordem: PESADO, nível inválido, `off` -> `desligado`, entrada estimada acima de `DEEPSEEK_MAX_TOKENS` -> novo motivo `limite-tokens`, gasto do dia >= teto -> `limite-diario`) e envolve a rota inteira em `limitarTempo` (tempo do cliente + 2 s de margem), com o motivo `timeout` e a rota separada em `rotearComSeguranca`. Já cobertos antes e reaproveitados sem reescrever: o `max_tokens` de saída e o abort por tempo no `fetch` (`cliente.mjs`, .2), a soma do dia e a linha `bloqueada`/`fallback` na auditoria (`auditoria.mjs`, .3). Decisão tomada aqui: o teto de 2.000 tokens vale para a saída (`max_tokens`) E para a entrada estimada (1 token a cada 3 caracteres, conservador); o limite geral de tempo é cinto-e-suspensório para um `fetch` que ignore o abort. `.env.example` não foi tocado (fora do escopo): falta só a linha opcional `DEEPSEEK_TIMEOUT_MS`.
- **Verificação:** `node --check` em `limites.mjs`, `roteador.mjs`, `cliente.mjs` e `auditoria.mjs` = ok; maior linha (em caracteres) = 96, 99, 98 e 97; arquivos com 125, 181, 189 e 140 linhas; `grep -rn "sk-" scripts/deepseek` = sem resultado (INV-1). Script descartável fora do repositório (apagado depois, assim como a pasta `scripts/deepseek/saidas/` que ele criou), com `fetchImpl` injetado e auditoria em pasta temporária, sem chamada real: valores inválidos (`''`, `abc`, `-5`, `0`, `1e3`, `2abc`, `NaN`, `Infinity`, `0.0`, `undefined`) nos três limites = padrões 2000 / US$ 2 / 30000; valores válidos lidos (`500`, `0.5`, `100`, `DEEPSEEK_MODO=' OFF '` = desligada); `max_tokens` do corpo enviado = 2000 mesmo com `DEEPSEEK_MAX_TOKENS=xx`; `DEEPSEEK_MODO=off` -> `{ usar: false, motivo: 'desligado' }` com 0 chamadas; entrada de 6001 caracteres -> `limite-tokens` com 0 chamadas, 6000 caracteres -> chama; gasto do dia US$ 2,00 na auditoria -> `limite-diario` com 0 chamadas e linha `bloqueada`, teto inválido (`-1`) cai no padrão e continua bloqueado, `DEEPSEEK_MAX_CUSTO_DIA=3` libera; `fetch` que respeita o abort com `DEEPSEEK_TIMEOUT_MS=60` -> `timeout` em < 1,5 s; `fetch` que ignora o abort (promessa eterna) com `DEEPSEEK_TIMEOUT_MS=50` -> `timeout` entre 2 s e 3,5 s pelo limitador geral; `DEEPSEEK_TIMEOUT_MS=-3` -> padrão e chamada normal; `limitarTempo` com rejeição devolve o valor de falha; `rotearChamada(undefined)`, `(null, null)`, pedido sem mensagens, nível `XYZ` e `PESADO` -> sempre `{ usar: false, ... }`, nunca lança. Resultado: TUDO OK. Não foi criado teste automatizado permanente: se o usuário quiser um para estes limites, precisa de subtarefa de teste própria (Haiku).

### INTEGRACAO-DEEPSEEK.5 — Documentar a integração

**Próximo passo:** ✅ entregue em 2026-10-23; etapa 045 concluída (quadro atualizado na conferência).

- **Nível:** LEVE — só texto e configuração
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** manual
- **Descrição:** Escrever `docs/DEEPSEEK-INTEGRACAO.md` (como ligar, desligar, rotacionar a chave e ler a auditoria) e linkar em `regras/niveis-e-modelos.md` só como nota (a matriz fica com o usuário).
- **Arquivos:** `docs/DEEPSEEK-INTEGRACAO.md`
- **Critérios de Aceitação:** o doc cita as variáveis `DEEPSEEK_API_KEY`, `DEEPSEEK_MODO` e o limite de P2.
- **Depende de:** INTEGRACAO-DEEPSEEK.4
- **Entrega:** `docs/DEEPSEEK-INTEGRACAO.md` (novo; o que é, como ligar, variáveis, como desligar, rotacionar a chave, auditoria, motivos de fallback e o que ainda não foi testado) e `.env.example` (linha opcional `DEEPSEEK_TIMEOUT_MS=30000` acrescentada; nenhuma linha apagada). `regras/niveis-e-modelos.md` não foi editado (pedido do usuário).
- **Verificação:** leitura do doc contra o código de `scripts/deepseek/`. Cada variável e onde o código a lê: `DEEPSEEK_API_KEY` em `cliente.mjs` (`chamarDeepseek`, lida de `process.env`, não de `.env`); `DEEPSEEK_MODO` em `limites.mjs` (`estaDesligada`, valor `off` sem diferenciar maiúsculas) e reaproveitada em `cliente.mjs` e `roteador.mjs`; `DEEPSEEK_MAX_CUSTO_DIA` em `limites.mjs` (`lerLimites`, padrão 2, decimal), usada em `roteador.mjs` e `auditoria.mjs` (`lerTetoDiario`); `DEEPSEEK_MAX_TOKENS` em `limites.mjs` (padrão 2000, inteiro), usada em `cliente.mjs` (`max_tokens`) e `roteador.mjs` (entrada estimada, 1 token a cada 3 caracteres); `DEEPSEEK_TIMEOUT_MS` em `limites.mjs` (padrão 30000, inteiro), usada em `cliente.mjs` (`enviar`) e `roteador.mjs` (`limitarTempo`, +2 s). Motivos de fallback conferidos em `roteador.mjs`, `cliente.mjs` e `limites.mjs` (ordem das barreiras, ações `usada`, `fallback`, `bloqueada`). Campos da auditoria conferidos em `auditoria.mjs` (`montarLinha`, lista fechada). Nenhuma chamada real à API. Sem teste automatizado (regra do projeto).

### INTEGRACAO-DEEPSEEK.6 — Testes dos limites e do roteador da DeepSeek

**Próximo passo:** ✅ entregue em 2026-10-23.

- **Nível:** LEVE — conferência ou ajuste de texto
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Fonte:** manual
- **Descrição:** Escrever, rodar e confirmar testes (liberados pelo usuário, só Haiku/Gemini Flash/DeepSeek Flash) para `scripts/deepseek/limites.mjs` e `roteador.mjs`: valores inválidos caem nos padrões; `off` não chama a API; limite de tokens; limite diário; tempo; PESADO nunca chama; nada lança; auditoria sem texto. `fetch` injetado e pasta temporária; sem chamada real. Sem alterar o código: defeito vira relato.
- **Arquivos:** `scripts/deepseek/testes/limites.mjs`
- **Critérios de Aceitação:** `node scripts/deepseek/testes/limites.mjs` passa; relatório do que cada teste cobre.
- **Depende de:** INTEGRACAO-DEEPSEEK.4
- **Entrega:** Claude Code (Haiku 5.5 · agente), 2026-10-23: scripts/deepseek/testes/limites.mjs (13 testes)
- **Verificação:** `node --check` = ok; `node scripts/deepseek/testes/limites.mjs` = 13 passaram, 0 falharam; maior linha = 100; nenhuma pasta temporária sobrou; `scripts/deepseek/saidas/` não foi criada e `git ls-files scripts/deepseek/saidas` = vazio; `sk-` no teste = sem resultado. Defeitos achados (código não alterado): (a) resposta HTTP 200 com JSON inválido sai como `rede` e não como `resposta-invalida` (`cliente.mjs`, `enviar`: o `json()` fica dentro do `try` que classifica tudo como rede); (b) quando o limite geral de tempo corta um `fetch` que ignora o abort, nenhuma linha de auditoria é gravada nesse caminho (confirmado com fetch simulado: 0 linhas), contra R5.
