## Etapa 025-367236b0 — JEV-RULES-AI: Jev no rules-ai para nível/effort e guardrails

**Tarefa:** JEV-RULES-AI · **Pedido em:** 2026-10-18 15:55 · **Criada por:** DeepSeek Harness (lead) (local · main)
**Pedido:** "crie um plano SUPER DETALHADO de como implementar o JEV no rules-ai, pra decisão de modelo e effot do modelo, e também nestes casos: [escopo, critérios de aceite, segredo/PII, pasta proibida, comando destrutivo, aprovação indevida]. coloque a task no quadro do rules-ai"
**Objetivo:** usar o Jev como **conselheiro estruturado** do rules-ai — sugerir nível (e, por consequência, modelo e `effort` pela matriz/C21) e servir de segunda camada nos guardrails — sem escrever no quadro, sem reservar e sem decidir no lugar do humano.
**Situação:** ✅ **concluída em 2026-10-18 17:40** (critério numérico do benchmark não atingido — ver Decisões e Pendências). Plano aprovado em 2026-10-18 16:45 ("faça esta tarefa" + "faça direto sem modo sugestão"); execução pelo sargento (herdr) com um agente por subtarefa.

---

### Contexto e problema

- Hoje o `rules-ai` decide nível pela skill `classificar-tarefa` (sinais + Laya local em `/v1/systemone`, limiar 0,70 de `answer_confidence`) e deriva modelo pela matriz de `niveis-e-modelos.md`; o `effort` é fixo por nível (C21: LEVE=low, MEDIO=medium, PESADO=high).
- O Jev foi testado no `PROJETO-JEV-AI` (fora deste repositório): no mesmo conjunto de 18 subtarefas, acertou **15/15** com nível definido, contra 7/15 do Laya; latência de **0,26 s** contra 3,7 s; custo de ~R$ 0,0035 por rodada. Relatórios em `C:\fontes\PROJETO-JEV-AI\docs\relatorios\classificacao-jev*.json`.
- ⚠️ **Achado que muda o desenho:** aquele teste **não era cego** — o `state` levava `nivel_atual` e a descrição recortada da etapa quase sempre tinha `**Nível:** MEDIO`. O Jev podia ler a resposta. O teste pesado deste plano precisa **remover o rótulo** e ser revalidado.
- Guardrails hoje são manuais/inexistentes: escopo, critérios de aceite, segredo/PII, pasta proibida, comando destrutivo e aprovação indevida dependem de leitura humana.

### Escopo

**Entra:**

- Cliente HTTP do Jev, coletor de estado **cego**, perguntas de classificação e agregação nível → modelo/effort.
- Benchmark dourado (150–200 casos) com métricas de acurácia, recall de PESADO, calibração e custo.
- Guardrails dos seis casos do pedido: escopo, critérios de aceite, segredo/PII, pasta proibida, comando destrutivo e aprovação indevida.
- CLI `scripts/jev.mjs`, integração com a skill global `classificar-tarefa` (com fallback Laya) e regra global `regras/jev.md` + `CONFLITOS.md` C39.
- Rollout com flag, validação e rollback.

**Não entra:**

- Escrever no `tasks/STATUS.md`, reservar subtarefa, mover linha para `task_complete.md` ou alterar nível sozinho.
- Trocar a matriz de `niveis-e-modelos.md`, a C21 (`effort`) ou as regras de reserva.
- Dashboard/3D, `dashboard/graphs/` ou `DASHBOARD-AGENTES` (tarefa própria, em 👀).
- Substituir o Laya; ele continua como fallback local.
- Enviar segredo bruto, diff inteiro ou conteúdo de `.env` ao Jev.
- Aprovar plano, responder permissão ou executar comando destrutivo sem humano.

### Premissas

- Node.js ≥ 22 (máquina: 24.16); `fetch` nativo, sem dependência npm nova.
- Chave em `TYPESAFE_API_KEY` (ambiente ou `.env` local, já ignorado pelo `.gitignore`); nunca versionada.
- Modelo fixado em `jev-1.13.0` no início; alias `jev-latest` só depois de revalidar.
- Laya disponível em `http://localhost:8000` (Docker) como fallback.
- Português do Brasil é o idioma do estado; inglês fora do escopo inicial.
- O `effort` **não** é decidido pelo Jev: a C21 manda `low`/`medium`/`high` pelo nível. O Jev pode sugerir, mas o código só usa a sugestão para **sinalizar revisão**, nunca para reduzir.

### Arquitetura

```
scripts/jev.mjs                  CLI (classificar | guardrail | avaliar | custo)
scripts/jev/cliente.mjs          HTTP /v1/systemone, retry, timeout, usage/custo, log
scripts/jev/config.mjs           env, preço, limites, flags, caminhos
scripts/jev/estado.mjs           lê quadro/etapa, remove rótulos, monta state cego
scripts/jev/perguntas.mjs        perguntas fixas (classificação e guardrails)
scripts/jev/modelos.mjs          matriz nível → modelos elegíveis e effort (C21)
scripts/jev/decidir.mjs          agrega respostas, aplica limiares e produz o JSON
scripts/jev/guardrails/*.mjs     escopo, aceite, segredo, pasta, comando, aprovação
scripts/jev/avaliar.mjs          benchmark, métricas e comparação Jev × Laya
scripts/jev/benchmarks/          golden.jsonl + saídas (saídas fora do Git)
```

Fluxo da classificação: `estado.mjs` lê a subtarefa/etapa → `estado.mjs` remove rótulos → `cliente.mjs` chama o Jev → `decidir.mjs` combina `nivel` + sinais + confiança → JSON de sugestão. O quadro é **somente leitura**: o script não escreve, não reserva e não altera nível.

Saída da classificação:

```json
{
  "subtarefa": "EXEMPLO.1",
  "nivel_sugerido": "MEDIO",
  "nivel_final_proposto": "MEDIO",
  "effort_final_proposto": "medium",
  "modelos_elegiveis": ["Claude Code (Sonnet)", "Gemini CLI (Pro)", "DeepSeek (raciocínio)"],
  "confianca": 0.87,
  "fonte_confianca": "confidence",
  "sinais": { "banco": 0.02, "segredo": 0.01, "massa": 0.10, "mais_de_3_arquivos": 0.40, "risco": 1.2 },
  "acao": "sugestao_automatica",
  "motivos": ["sem sinal de PESADO", "1 a 3 arquivos", "confiança ≥ limiar"],
  "modelo": "jev-1.13.0",
  "uso": { "input_tokens": 1234, "output_tokens": 0 },
  "custo_usd": 0.000052
}
```

Regras de agregação:

1. **Nível:** `nivel_final_proposto = mais restritivo(janela do Jev, sinais)`; sinal de PESADO eleva, nunca rebaixa. Se o Jev disser LEVE e um sinal de PESADO vier ≥ 0,50, o resultado é PESADO e a ação é `revisar`.
2. **Effort:** `LEVE→low`, `MEDIO→medium`, `PESADO→high` (C21). A sugestão de `effort` do Jev só aparece como diagnóstico; divergência vira `revisar`.
3. **Modelo:** lista da matriz de `niveis-e-modelos.md`; o Jev **não escolhe ferramenta**, só o nível que alimenta a matriz. Nunca reservar.
4. **Confiança (Jev):** `confidence` do `choice`, fórmula `(p_max − 1/n)/(1 − 1/n)`. Começo proposto: ≥ 0,80 sugestão automática; 0,60–0,80 revisar; < 0,60 humano.
5. **Confiança (Laya, fallback):** `answer_confidence` (= `p_max`), limiar existente 0,70. Limiares **não** migram entre os dois.
6. **State cego:** remover `nivel_atual`, linhas `Nível:`, `Modelo:`, `Effort:`, `só Haiku/Sonnet/Opus`, `effort low/medium/high` e nomes de modelo do texto. Manter objetivo, descrição sem rótulo, arquivos citados e critérios de aceite. Segredo encontrado no texto é mascarado antes de enviar.

### Guardrails

Todos são **segunda camada**: primeiro validação determinística (regex, caminho, allowlist), depois o Jev. Nenhum substitui teste, permissão, scanner de segredo ou decisão humana. Ações possíveis: `liberar`, `avisar`, `revisar`, `bloquear`.

| Caso | Entrada | Perguntas do Jev | Regra de decisão | Nunca |
|---|---|---|---|---|
| **Escopo** | descrição da subtarefa, arquivos previstos, `git diff --name-status` e resumo do diff | `noul`: fora do escopo? arquivo não previsto? | p ≥ 0,90 → `avisar` + revisão; 0,60–0,90 → `avisar`; < 0,60 → `liberar` | bloquear sozinho; ler diff inteiro sem necessidade |
| **Critérios de aceite** | critérios da etapa + resumo da entrega/arquivos/testes | um `noul` por critério (até 8) | todos p ≥ 0,80 → `liberar`; algum < 0,50 → `revisar`; senão `avisar`; score composto no código | declarar aceite; ignorar teste que falhou |
| **Segredo/PII** | texto **mascarado** (regex antes) | `noul` por tipo: chave/token, CPF/RG/endereço, e-mail/telefone | qualquer p ≥ 0,80 → `bloquear` e registrar sem ecoar o valor | enviar segredo bruto ao Jev; logar o valor |
| **Pasta proibida** | caminhos normalizados (absolutos) e menções textuais | `noul` só para menção ambígua | prefixo de C20/C23 → `bloquear` determinístico; Jev só confirma menção | abrir/ler a pasta para “conferir”; mandar conteúdo |
| **Comando destrutivo** | comando + contexto | `score` de risco e `noul` “pode apagar/sobrescrever?” | regex/allowlist primeiro; p ≥ 0,70 → `bloquear` até confirmação humana explícita | executar com base só no Jev; aprovar no lugar do usuário |
| **Aprovação indevida** | mensagem que o agente vai enviar | `noul`: está respondendo aprovação/permissão no lugar do usuário? | p ≥ 0,70 → `bloquear` a mensagem (C32) e reformular | aceitar “sim” genérico como aprovação |

Cuidados de implementação:

- **Redigir antes de enviar:** `guardrails/redigir.mjs` mascara chaves (`sk-`, `tsk_`, `Bearer`, `ghp_`, JWT), CPF/RG, e-mail e telefone; o estado enviado ao Jev contém só o texto mascarado. O valor original nunca vai para log nem para a API.
- **Log de auditoria** (`scripts/jev/saidas/guardrails.jsonl`, fora do Git): caso, alvo, probabilidade, limiar, ação, modelo/versão, tokens, custo, `hash` do input — sem conteúdo sensível.
- **Falso positivo:** ação máxima é `avisar` para escopo/aceite; `bloquear` só nos casos de segurança e com escape humano documentado.
- **Falha do Jev:** cai para Laya; se os dois falharem, o guardrail retorna `revisar` (nunca `liberar` silencioso).

### Requisitos

| ID | Requisito (EARS) | Cobre | Verificação |
|----|------------------|-------|-------------|
| R1.1 | QUANDO o operador rodar `node scripts/jev.mjs classificar`, O SISTEMA DEVE gerar sugestão de nível, effort e modelos elegíveis sem escrever no quadro | JEV-RULES-AI.2 | executar em 10 subtarefas e conferir hash do `STATUS.md` antes/depois |
| R1.2 | SE a `TYPESAFE_API_KEY` estiver ausente, ENTÃO O SISTEMA DEVE sair com código 1 e mensagem clara, sem ligar o modo automático | JEV-RULES-AI.1 | rodar com a variável vazia e conferir código/mensagem |
| R1.3 | QUANDO montar o `state`, O SISTEMA DEVE remover `nivel_atual`, linhas `Nível:`/`Modelo:`/`Effort:` e nomes de modelo do texto | JEV-RULES-AI.2 | `node scripts/jev/testes/invariantes.mjs` (teste permitido em PESADO) |
| R2.1 | O SISTEMA DEVE aplicar a regra mais restritiva: sinal de PESADO eleva o nível, nunca rebaixa | JEV-RULES-AI.2 | casos sintéticos LEVE+banco, MEDIO+segredo, PESADO sem sinal |
| R2.2 | O SISTEMA DEVE derivar o `effort` da C21 pelo nível final e nunca reduzi-lo por sugestão do modelo | JEV-RULES-AI.2 | tabela de 3 níveis × 3 sugestões do Jev |
| R2.3 | O SISTEMA DEVE listar os modelos elegíveis pela matriz de `niveis-e-modelos.md` e não reservar nenhum | JEV-RULES-AI.2 | conferir a lista para LEVE/MEDIO/PESADO |
| R3.1 | QUANDO o guardrail de escopo rodar, O SISTEMA DEVE classificar a mudança em dentro/ambígua/fora e nunca bloquear sozinho | JEV-RULES-AI.4 | 20 casos sintéticos com diff e escopo |
| R3.2 | QUANDO houver segredo/PII, O SISTEMA DEVE bloquear e registrar a decisão sem registrar o valor | JEV-RULES-AI.5 | 20 casos com `sk-`, CPF, e-mail; conferir log |
| R3.3 | SE o comando não estiver na allowlist, ENTÃO O SISTEMA DEVE exigir confirmação humana explícita antes de executar | JEV-RULES-AI.5 | casos `git reset --hard`, `rm -rf`, `DROP TABLE` |
| R3.4 | QUANDO a mensagem do agente responder aprovação no lugar do usuário, O SISTEMA DEVE bloquear o envio | JEV-RULES-AI.5 | 10 mensagens de aprovação e 10 benignas |
| R4.1 | O SISTEMA DEVE registrar cada decisão em JSONL com modelo, versão, confiança, limiar, tokens, custo e ação | JEV-RULES-AI.1 | conferir uma linha por chamada |
| R4.2 | QUANDO `JEV_MODO=off`, O SISTEMA DEVE manter o comportamento anterior (sinais + Laya, sem Jev); o padrão é `JEV_MODO=ativo` (mudança de 2026-10-18 16:45) | JEV-RULES-AI.8 | rodar com off e comparar a saída da skill com a versão anterior |
| R5.1 | QUANDO a integração global for aplicada, O SISTEMA DEVE passar por `node scripts/sincronizar.mjs` (simulação) antes do `--aplicar` | JEV-RULES-AI.7 | rodar a simulação e conferir o diff |

**Não-objetivos:** escrever no quadro, reservar tarefa, escolher ferramenta, trocar a matriz/C21, aprovar plano, responder permissão, substituir Laya, mexer no dashboard.

### Invariantes

| ID | Regra que vale sempre | Domínio da entrada | Como conferir | Teste automatizado |
|----|----------------------|--------------------|---------------|--------------------|
| INV-1 | O `state` enviado ao Jev não contém rótulo de nível/modelo/effort | qualquer subtarefa do quadro | `node scripts/jev/testes/invariantes.mjs` | sim: comando acima |
| INV-2 | Nenhum segredo/PII bruto sai para a API ou para o log | qualquer texto/diff | teste com chaves sintéticas + leitura do JSONL | sim: `scripts/jev/testes/segredo.mjs` |
| INV-3 | O script é somente leitura no quadro: hash de `tasks/STATUS.md` e `task_complete.md` não muda | qualquer execução | hash antes/depois | sim: `scripts/jev/testes/somente-leitura.mjs` |
| INV-4 | Mesmas respostas produzem o mesmo nível/effort/modelo | qualquer conjunto de `answers` | teste de agregação com respostas fixas | sim: `scripts/jev/testes/agregacao.mjs` |
| INV-5 | O custo por rodada respeita `JEV_MAX_TOKENS` e aborta antes de estourar | qualquer lote | simular uso acima do limite | sim: `scripts/jev/testes/custo.mjs` |
| INV-6 | Falha do Jev cai para Laya ou `revisar`; nunca `liberar` silencioso | rede/API fora | desligar o endpoint e rodar | sim: comando acima |

**Casos de borda:** estado vazio, subtarefa sem etapa, JSONL corrompido, 401/429/529, timeout, resposta sem `answers`, `nivel` fora das opções, texto em inglês, diff binário, caminho com `..`, comando com `&&`/pipe.

### Perguntas abertas

> As respostas abaixo são a **proposta do plano**; o "sim" do usuário as fecha oficialmente e libera a execução.

| # | Pergunta | Resposta | Fechada em | Quem respondeu |
|---|----------|----------|------------|----------------|
| 1 | O Jev decide sozinho nível/modelo/effort? | ✅ Não: sugere; o código aplica a regra mais restritiva, a matriz e a C21; humano confirma | 2026-10-18 | Plano (DeepSeek Harness) |
| 2 | Onde mora o código? | ✅ Em `scripts/jev/` no próprio `rules-ai`, sem dependência npm nova | 2026-10-18 | Plano (DeepSeek Harness) |
| 3 | O Jev substitui o Laya? | ✅ Não; o Laya continua como fallback local e o Jev é o principal quando houver chave | 2026-10-18 | Plano (DeepSeek Harness) |
| 4 | Guardrails bloqueiam ou avisam? | ✅ Bloqueiam só segredo/PII, pasta proibida, comando destrutivo e aprovação indevida; escopo/aceite só avisam | 2026-10-18 | Plano (DeepSeek Harness) |
| 5 | Segredo bruto pode ir para a API? | ✅ Não; regex + máscara antes de qualquer chamada; log sem valor | 2026-10-18 | Plano (DeepSeek Harness) |
| 6 | Atualizar a skill global `classificar-tarefa`? | ✅ Sim, com backup e fallback Laya; sem chave, o comportamento atual não muda | 2026-10-18 | Plano (DeepSeek Harness) |
| 7 | Qual modelo usar no início? | ✅ `jev-1.13.0` fixo; `jev-latest` só após revalidação | 2026-10-18 | Plano (DeepSeek Harness) |
| 8 | Qual amostra do benchmark? | ✅ 150–200 casos rotulados: 1/3 por nível, 20 de borda, 30–50 auditados à mão | 2026-10-18 | Plano (DeepSeek Harness) |

### Riscos e plano B

| Risco | Plano B |
|---|---|
| Vazamento de rótulo inflar o resultado | sanitização + INV-1 + benchmark cego; reprovar se o teste cego cair muito |
| Falso negativo em PESADO (deixar passar risco) | sinais determinísticos + `revisar` obrigatório quando qualquer flag ≥ 0,50; humano decide |
| Custo/rate limit | `JEV_MAX_TOKENS`, log de uso, concorrência 2–4, retry; fallback Laya |
| Chave no Git/log | `.env` ignorado, mascaramento, teste INV-2, revisão antes do commit |
| Alias mudar de versão | fixar `jev-1.13.0`; trocar só com benchmark |
| PT-BR mais fraco | benchmark em PT-BR; fallback Laya; não usar em decisão irreversível |
| Conflito com `DASHBOARD-AGENTES` | dashboard fora do escopo; nada em `dashboard/` |
| Sincronização global indevida | `sincronizar.mjs` só simulação até o "sim"; `--aplicar` é ação do usuário |
| Latência em guardrail | rodar em paralelo/assíncrono; p95 alvo < 2 s por item |

### Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-18 15:55 | JEV-RULES-AI registrada como tarefa grande (`PESADO`, spec C34 na etapa 025); execução só depois do "sim" | DeepSeek Harness (lead) | pedido direto do usuário; cria estrutura nova e mexe em chave/segurança |
| 2026-10-18 | Jev é conselheiro: sugere nível; modelo e effort continuam determinísticos (matriz + C21) | DeepSeek Harness (lead) | não violar C2/C22/C35 nem deixar modelo escolher ferramenta |
| 2026-10-18 | Laya permanece fallback; limiares de confiança separados por backend | DeepSeek Harness (lead) | fórmulas diferentes (`answer_confidence` × `confidence`) |
| 2026-10-18 | O teste do `PROJETO-JEV-AI` tinha vazamento de rótulo; o benchmark desta etapa será cego | DeepSeek Harness (lead) | 15/15 do Jev não é medida justa sem remover `nivel_atual`/`Nível:` |
| 2026-10-18 | Nada será aplicado globalmente sem o "sim" e sem `sincronizar.mjs` de simulação | DeepSeek Harness (lead) | regra do `rules-ai` para mudança global |
| 2026-10-18 16:45 | **Plano e spec aprovados** pelo usuário ("FAÇA ESTA TAREFA *JEV-RULES-AI* USANDO O *PROMPT_PARA_O_LIDER.md*" e "nada disso, faça direto sem modo sugestão, pois até hoje eu nem tinha nada") | Usuário (registrado por Claude Code (Opus 5.5), sargento herdr) | "sim" claro ao plano |
| 2026-10-18 16:45 | **Mudança de escopo da .8:** sem modo `sugestao` e sem as 2 semanas de medição; o Jev entra **direto ativo** (`JEV_MODO=ativo` padrão, `off` só para rollback). Continua valendo que o Jev **não escreve no quadro, não reserva e não rebaixa nível** (invariantes) | Usuário | não havia classificador automático antes; nada a comparar em sombra |
| 2026-10-18 16:45 | Chave `TYPESAFE_API_KEY` copiada de `PROJETO-JEV-AI/.env` para o `.env` do `rules-ai` (ignorado pelo Git) | Claude Code (Opus 5.5), sargento herdr | o benchmark real (.3) precisa da chave; nunca versionada |
| 2026-10-18 17:40 | Mãe fechada com o critério numérico do benchmark **não atingido** (acurácia 0,61 × meta 0,90; recall PESADO 0,88 × 0,95; Laya fora do ar). Todas as 9 subtarefas ✅; o resto dos critérios de pronto foi cumprido. Calibração dos limiares e comparação com o Laya ficam em Pendências | Claude Code (Opus 5.5), sargento herdr | o usuário pediu ativação direta; o comportamento é seguro (baixa confiança → `revisar`/`humano`, nunca rebaixa) |

### JEV-RULES-AI.1 — Cliente Jev (HTTP, retry, timeout, chave, custo e log)

**Próximo passo:** nenhum — ✅ concluída.
- **Nível:** PESADO — lida com chave/segredo e chamada externa.
- **Modelo:** só Opus 5.5+ ou Fable, ou DeepSeek — nunca outro.
- **Effort:** high
- **Depende de:** Nenhuma.
- **Descrição:** `POST https://api.typesafe.ai/v1/systemone` com `Authorization: Bearer` lida de `TYPESAFE_API_KEY`; timeout `JEV_TIMEOUT_MS` (padrão 60000); retry exponencial para 429/529/5xx (máx. 3), sem retry para 401/400/422; parsing de `answers`/`usage`; preço `US$ 0,042/M` de entrada; log JSONL com id, modelo/versão, tokens, custo, latência e `hash` do state — **sem chave e sem conteúdo sensível**; mensagem clara se a chave faltar.
- **Arquivos:** `scripts/jev/config.mjs`, `scripts/jev/cliente.mjs`, `scripts/jev/testes/cliente-mock.mjs`, `scripts/jev/saidas/.gitkeep`.
- **Critérios de Aceitação:** mock responde 200/429/401; 429 repete e sucede; 401 não repete; custo calculado confere; log não contém chave; `node --check` passa.
- **Verificação:** `node --check scripts/jev/cliente.mjs`; `node scripts/jev/testes/cliente-mock.mjs`; leitura do JSONL de teste.
- **Estimativa:** 2 h.
- **Entrega:** commit `feat(JEV-RULES-AI.1)` — `scripts/jev/config.mjs`, `cliente.mjs`, `testes/cliente-mock.mjs`, `saidas/.gitkeep` + `.gitignore` dos logs; executor jev1 (Opus 5.5, herdr w2:pG). Obs.: por erro de caminho no brief, o VIGIA (Haiku) também executou a subtarefa; o jev1 substituiu todos os arquivos pela sua versão (16:59) — vale só a versão do Opus.
- **Verificação (líder):** `node --check` nos 3 arquivos ok; `node scripts/jev/testes/cliente-mock.mjs` 13 casos ok (200, 429→sucesso, 529 até o limite, 401/422/timeout sem retry, sem chave, `JEV_MODO=off`, limite de tokens por rodada); chamada real `jev-1.13.0` ok (317 tokens, US$ 0,000013); valor da chave ausente de `scripts/jev/`; nenhuma função > 45 linhas.
- **JEV-AI-SUGGESTION:** NAO

### JEV-RULES-AI.2 — Coletor de estado cego e decisão de nível/effort/modelo

**Próximo passo:** nenhum — ✅ concluída.
- **Nível:** MEDIO — lógica em 3–4 arquivos, sem chave.
- **Modelo:** só Sonnet — nunca outro.
- **Effort:** medium
- **Depende de:** JEV-RULES-AI.1.
- **Descrição:** ler `tasks/STATUS.md` e a seção da subtarefa em `tasks/etapas/*.md`; **remover rótulos** (`nivel_atual`, `Nível:`, `Modelo:`, `Effort:`, nomes de modelo); montar `state` com id, título, etapa, prioridade, descrição limpa, arquivos e critérios; perguntas: `nivel` (choice 3), `effort` (choice low/medium/high, diagnóstico), `risco` (score), `banco`/`segredo`/`massa`/`mais_de_3_arquivos` (noul); agregar por regra mais restritiva; derivar effort/modelos da C21 e da matriz; limiares de confiança; modo `--dry-run` que só imprime o JSON.
- **Arquivos:** `scripts/jev/estado.mjs`, `scripts/jev/perguntas.mjs`, `scripts/jev/modelos.mjs`, `scripts/jev/decidir.mjs`, `scripts/jev/testes/agregacao.mjs`.
- **Critérios de Aceitação:** 10 subtarefas reais em dry-run; INV-1 e INV-4 passam; nenhum hash do quadro muda; lista de modelos confere com a matriz; saída no formato da seção Arquitetura.
- **Verificação:** `node --check` nos 4 arquivos; `node scripts/jev.mjs classificar --dry-run --limite 10`; `node scripts/jev/testes/invariantes.mjs`.
- **Estimativa:** 3 h.
- **Entrega:** commit `feat(JEV-RULES-AI.2)` — `modelos.mjs`, `perguntas.mjs`, `estado.mjs`, `decidir.mjs`, `testes/agregacao.mjs` (INV-4), `testes/invariantes.mjs` (INV-1); executor jev2 (Sonnet 5.5). Obs.: `risco` (score) é só informativo e vem na escala 0..n−1 do Jev (achado da .5); normalizar se um dia entrar na decisão.
- **Verificação (líder):** `node --check` ok; `agregacao.mjs` e `invariantes.mjs` ok (INV-1 em 158 subtarefas reais); dry-run real em 10 subtarefas (12.783 tokens, US$ 0,00047); hash de `STATUS.md`/`task_complete.md` igual antes/depois (INV-3); chave ausente de `scripts/jev/`.
- **JEV-AI-SUGGESTION:** NAO

### JEV-RULES-AI.3 — Benchmark dourado e métricas (cego × revisor)

**Próximo passo:** nenhum — ✅ concluída.
- **Nível:** MEDIO — scripts de avaliação e dados, sem chave.
- **Modelo:** só Sonnet — nunca outro.
- **Effort:** medium
- **Depende de:** JEV-RULES-AI.2.
- **Descrição:** fontes: subtarefas concluídas (`task_complete.md`/etapas), amostra auditada à mão (30–50) e casos sintéticos de borda; cada item tem `id`, `esperado`, `state_sem_rotulo`, `tags`; variantes `cego` e `revisor`; 3 repetições opcionais; backends Jev (`jev-1.13.0`) e Laya; métricas: acurácia, matriz 3×3, recall de PESADO, macro-F1, ECE/Brier multiclasse, curva cobertura×precisão, p50/p95, erros, tokens e custo; comparação pareada (McNemar + bootstrap); relatório JSON/Markdown em `scripts/jev/benchmarks/saidas/` (fora do Git).
- **Arquivos:** `scripts/jev/avaliar.mjs`, `scripts/jev/metricas.mjs`, `scripts/jev/benchmarks/golden.jsonl`, `scripts/jev/benchmarks/README.md`.
- **Critérios de Aceitação:** ≥150 itens, 1/3 por nível, ≥20 casos de borda, ≥30 auditados; roda Jev e Laya; relatório com recall de PESADO e IC; custo total < R$ 1,00.
- **Verificação:** `node scripts/jev/avaliar.mjs --backend jev --variante cego --golden scripts/jev/benchmarks/golden.jsonl`; conferir o resumo e o JSONL de auditoria.
- **Estimativa:** 4 h.
- **Entrega:** commit `feat(JEV-RULES-AI.3)` — `avaliar.mjs`, `metricas.mjs`, `relatorio-avaliacao.mjs`, `benchmarks/` (golden 180: 60/60/60, 156 reais + 24 de borda, 39 auditados); executor jev3 (Sonnet 5.5). **Resultado cego (jev-1.13.0):** acurácia do nível final 0,606 [0,533; 0,674], recall de PESADO 0,883 [0,778; 0,942]; só o `nivel` sugerido: 0,667; com o rótulo vazando: 0,85 (confirma o vazamento do teste antigo). Sinais de PESADO elevam 44 casos LEVE/MEDIO. Custo total US$ 0,047; p50 240 ms. **Laya fora do ar** (localhost:8000 recusou): comparação Jev × Laya implementada mas não executada.
- **Verificação (líder):** `node --check` em todos; 180 linhas no golden, sem dado pessoal; saídas ignoradas pelo Git; `agregacao`/`invariantes` continuam ok; nenhuma função > 45 linhas.
- **JEV-AI-SUGGESTION:** NAO

### JEV-RULES-AI.4 — Guardrails de escopo e critérios de aceite

**Próximo passo:** nenhum — ✅ concluída.
- **Nível:** MEDIO — lógica em 2–3 arquivos.
- **Modelo:** só Sonnet — nunca outro.
- **Effort:** medium
- **Depende de:** JEV-RULES-AI.1.
- **Descrição:** `guardrails/escopo.mjs` recebe descrição, arquivos previstos, `git diff --name-status` e resumo; `guardrails/aceite.mjs` recebe critérios e evidência; perguntas `noul` (escopo/arquivo) e um `noul` por critério; agregação e ações `liberar`/`avisar`/`revisar`; **nunca bloquear**; log JSONL; integração com `git diff` sem ler conteúdo sensível.
- **Arquivos:** `scripts/jev/guardrails/escopo.mjs`, `scripts/jev/guardrails/aceite.mjs`, `scripts/jev/testes/guardrails-escopo.mjs`.
- **Critérios de Aceitação:** 20 casos de escopo (5 fora, 5 ambíguos, 10 dentro) e 20 de aceite; nenhum falso bloqueio; ações coerentes; sem segredo no log.
- **Verificação:** `node scripts/jev/testes/guardrails-escopo.mjs`; revisão manual de 5 saídas.
- **Estimativa:** 2 h.
- **Entrega:** commit `feat(JEV-RULES-AI.4)` — `guardrails/avisos.mjs`, `escopo.mjs`, `aceite.mjs`, `testes/guardrails-escopo.mjs`; executor jev4 (Sonnet 5.5). Ação máxima `revisar` (nunca bloqueia); falha do Jev → `revisar`.
- **Verificação (líder):** `node --check` ok; `guardrails-escopo.mjs` ok (20 escopo + 20 aceite) também com o `redigir.mjs` real da .5; sem segredo no log.
- **JEV-AI-SUGGESTION:** NAO

### JEV-RULES-AI.5 — Guardrails de segredo/PII, pasta proibida, comando destrutivo e aprovação indevida

**Próximo passo:** nenhum — ✅ concluída.
- **Nível:** PESADO — segurança, segredo e comando destrutivo.
- **Modelo:** só Opus 5.5+ ou Fable, ou DeepSeek — nunca outro.
- **Effort:** high
- **Depende de:** JEV-RULES-AI.1.
- **Descrição:** `redigir.mjs` mascara chaves (`sk-`, `tsk_`, `Bearer`, `ghp_`, JWT), CPF/RG, e-mail e telefone; `segredo.mjs` (regex + `noul` por tipo no texto mascarado, bloqueia p ≥ 0,80); `pasta-proibida.mjs` (normalização de caminho + prefixos C20/C23, determinístico; Jev só para menção ambígua); `comando-destrutivo.mjs` (regex/allowlist primeiro; `score`/`noul` para ambíguo; exige confirmação humana); `aprovacao.mjs` (`noul` “responde aprovação no lugar do usuário?”, bloqueia p ≥ 0,70, C32).
- **Arquivos:** `scripts/jev/guardrails/redigir.mjs`, `segredo.mjs`, `pasta-proibida.mjs`, `comando-destrutivo.mjs`, `aprovacao.mjs`, `scripts/jev/testes/guardrails-seguranca.mjs`.
- **Critérios de Aceitação:** 20 casos de segredo/PII (incluindo falsos positivos), 20 de pasta, 20 de comando, 20 de aprovação; nenhum segredo bruto no log; bloqueios corretos; escape humano documentado.
- **Verificação:** `node scripts/jev/testes/guardrails-seguranca.mjs`; ler 10 linhas do JSONL e conferir mascaramento.
- **Estimativa:** 3 h.
- **Entrega:** commit `feat(JEV-RULES-AI.5)` — `guardrails/redigir.mjs`, `seguranca-base.mjs`, `segredo.mjs`, `pasta-proibida.mjs`, `comando-destrutivo.mjs`, `aprovacao.mjs`, `testes/guardrails-seguranca.mjs`, `testes/segredo.mjs` (INV-2); executor jev5 (Opus 5.5). PII achada por regex bloqueia de forma determinística (R3.2); escape humano só com `confirmacaoHumana` do alvo exato; aprovação indevida sem escape.
- **Verificação (líder):** `node --check` ok; `guardrails-seguranca.mjs` 94 casos ok; `segredo.mjs` (INV-2) 300 textos ok; 9 avaliações reais com o Jev coerentes (US$ 0,0002); nenhum valor sensível nem chave nos logs.
- **JEV-AI-SUGGESTION:** NAO

### JEV-RULES-AI.6 — CLI e integração com a skill `classificar-tarefa`

**Próximo passo:** nenhum — ✅ concluída.
- **Nível:** MEDIO — CLI + ajuste de skill, sem chave.
- **Modelo:** só Sonnet — nunca outro.
- **Effort:** medium
- **Depende de:** JEV-RULES-AI.2, JEV-RULES-AI.3.
- **Descrição:** CLI com subcomandos `classificar`, `guardrail`, `avaliar` e `custo`; saída em tabela e JSON; a skill global `C:\Users\gelva\.agents\skills\classificar-tarefa\SKILL.md` passa a tentar o CLI Jev quando `TYPESAFE_API_KEY` existir e cair para o curl do Laya quando não existir; limiares separados (Jev `confidence`, Laya `answer_confidence`); backup `.bak` da skill; documentação curta no próprio `SKILL.md`.
- **Arquivos:** `scripts/jev.mjs`, `C:\Users\gelva\.agents\skills\classificar-tarefa\SKILL.md` (fora do repositório, com backup).
- **Critérios de Aceitação:** com chave, usa Jev; sem chave, o comportamento atual do Laya continua idêntico; 3 projetos testados; rollback pelo `.bak`.
- **Verificação:** rodar com e sem `TYPESAFE_API_KEY`; comparar a saída da skill; `node --check scripts/jev.mjs`.
- **Estimativa:** 2 h.
- **Entrega:** commit `feat(JEV-RULES-AI.6)` — `scripts/jev.mjs` + `scripts/jev/cli/*` (`classificar | guardrail | avaliar | custo`; códigos 0 ok, 1 erro/sem chave, 2 off, 3 revisar, 4 bloquear, 5 Jev indisponível); skill global `~/.agents/skills/classificar-tarefa/SKILL.md` com passo "Jev primeiro" e fallback Laya/sinais inalterado (backup `SKILL.md.bak`, fora do repositório); executor jev6 (Sonnet 5.5). Guardrails funcionam sem chave (camada determinística + `revisar`).
- **Verificação (líder):** `node --check` ok; sem chave → código 1; `JEV_MODO=off` → 2; `git reset --hard` → 4 (bloquear); 3 projetos lidos (REA, aulasenai, gerenciador-de-ia) com hash dos quadros igual antes/depois (INV-3); todos os testes de `scripts/jev/testes/` ok; chave ausente de `scripts/` e da skill.
- **JEV-AI-SUGGESTION:** NAO

### JEV-RULES-AI.7 — Regra global `regras/jev.md` + INDEX + C39

**Próximo passo:** nenhum — ✅ concluída.
- **Nível:** LEVE — só `.md` e índice.
- **Modelo:** só Haiku — nunca outro.
- **Effort:** low
- **Depende de:** JEV-RULES-AI.2, JEV-RULES-AI.5.
- **Descrição:** `regras/jev.md` define: quando usar (classificação e guardrails), caráter consultivo, matriz/C21 continuam donas do modelo/effort, chave/custo/privacidade, mascaramento, fallback Laya, `JEV_MODO=off` por padrão, rollback; `regras/INDEX.md` ganha o item 20; `CONFLITOS.md` ganha C39 com a decisão do usuário; `README.md` não muda (lista IAs, não regras).
- **Arquivos:** `regras/jev.md`, `regras/INDEX.md`, `CONFLITOS.md`.
- **Critérios de Aceitação:** regra na ordem do INDEX; `node scripts/sincronizar.mjs` mostra o bloco sem erro; nenhum `--aplicar` sem o "sim"; C39 registrada com data/quem.
- **Verificação:** `node scripts/sincronizar.mjs`; leitura do diff; `git diff --check`.
- **Estimativa:** 1 h.
- **Entrega:** commit `feat(JEV-RULES-AI.7)` — `regras/jev.md` (4,0 KB), item 19 do `regras/INDEX.md`, C39 no `CONFLITOS.md`, `VERSAO.md` regenerada pela simulação (`2026-10-18-384984ac`); executor jev7 (Haiku 5.5). A seção "Estado da implementação" da regra é atualizada na .8.
- **Verificação (líder):** `node scripts/sincronizar.mjs` (simulação) sem erro; nenhum `--aplicar`; regra ≤ 5 KB; C39 com data e frase do pedido; `git diff --check` ok.
- **JEV-AI-SUGGESTION:** NAO

### JEV-RULES-AI.9 — Fechar vazamento de rótulo no `estado.mjs` e no detector do INV-1

**Próximo passo:** nenhum — ✅ concluída.
- **Nível:** MEDIO — ajuste de lógica em 2 arquivos, sem chave nova.
- **Modelo:** só Sonnet — nunca outro.
- **Effort:** medium
- **Depende de:** JEV-RULES-AI.2, JEV-RULES-AI.3.
- **Descrição:** criada em 2026-10-18 17:30 pelo sargento (C26) a partir do achado da .3: o `estado.mjs` ainda deixa passar pistas de nível — linhas `**Entrega (… · executor-leve; líder …):**`, `**Verificação (líder):**`, `executor-(leve|medio|pesado)` e flags `--leve/--medio/--pesado`. O `construir-golden.mjs` já limpa isso; levar o mesmo filtro para o `estado.mjs` e para o detector do INV-1.
- **Arquivos:** `scripts/jev/estado.mjs`, `scripts/jev/testes/invariantes.mjs`.
- **Critérios de Aceitação:** INV-1 pega os novos padrões (casos adversariais) e passa nas subtarefas reais; benchmark cego rodado de novo com os números registrados no relatório.
- **Verificação:** `node scripts/jev/testes/invariantes.mjs`; `node scripts/jev/avaliar.mjs --backend jev --variante cego --golden scripts/jev/benchmarks/golden.jsonl`.
- **Estimativa:** 1 h.
- **Entrega:** commit `feat(JEV-RULES-AI.9)` — `estado.mjs` descarta linhas `Entrega/Verificação (…)` e troca `executor-<nível>`/`--<nível>`; `testes/invariantes.mjs` com 3 detectores e 7 casos adversariais; executor jev9 (Sonnet 5.5). Benchmark cego refeito: final 0,600, sugerido 0,667, recall PESADO 0,883 — o vazamento não mudava o resultado.
- **Verificação (líder):** `node --check` ok; INV-1 ok em 159 subtarefas reais + 7 adversariais; `agregacao` ok; benchmark cego 180 itens sem erro (US$ 0,009).
- **JEV-AI-SUGGESTION:** NAO

### JEV-RULES-AI.8 — Ativação direta, validação final e rollback

**Próximo passo:** nenhum — ✅ concluída.
- **Nível:** MEDIO — operação e validação.
- **Modelo:** só Sonnet — nunca outro.
- **Effort:** medium
- **Depende de:** JEV-RULES-AI.3, JEV-RULES-AI.4, JEV-RULES-AI.5, JEV-RULES-AI.6, JEV-RULES-AI.7, JEV-RULES-AI.9.
- **Descrição:** (escopo mudado em 2026-10-18 16:45, ver Decisões) flag `JEV_MODO=ativo|off`, padrão `ativo`; sem modo sugestão e sem período de medição. Rodar a validação geral da etapa; testar rollback (flag `off` → skill volta ao fluxo Laya/sinais); registrar números do benchmark na etapa; atualizar `STATUS_PROJETO.md`.
- **Arquivos:** `scripts/jev/config.mjs` (flag), `regras/jev.md` (seção rollout), etapa e `STATUS_PROJETO.md`.
- **Critérios de Aceitação:** `ativo` classifica e roda os guardrails; `off` = comportamento antigo; rollback em < 10 min; relatório final com números; sem segredo em log.
- **Verificação:** rodar `ativo`/`off`; `git status`; leitura do relatório.
- **Estimativa:** 1 h.
- **Entrega:** commit `feat(JEV-RULES-AI.8)` — `regras/jev.md` (estado da implementação e rollback, 4,4 KB), `golden.jsonl` regravado, `STATUS_PROJETO.md`, `VERSAO.md` (simulação `2026-10-18-87fd6c11`); cópia da skill do Claude Code alinhada à fonte `.agents` (backup `.bak`, fora do repositório); executor jev8 (Sonnet 5.5). Jev ativo por padrão (`JEV_MODO` ausente → `ativo`).
- **Verificação (líder):** Validação geral: gate da spec 4/4; `node --check` em 34 arquivos; todos os testes de `scripts/jev/testes/` ok; `classificar --dry-run --limite 10` somente leitura (INV-3); rollback `JEV_MODO=off` → código 2, guardrail determinístico continua bloqueando `rm -rf`, skill volta ao fluxo Laya/sinais, tempo << 10 min; benchmark cego final 0,611 / sugerido 0,661 / recall PESADO 0,883; nenhuma chave em logs/arquivos; nenhum `--aplicar`.
- **JEV-AI-SUGGESTION:** NAO

### Critérios de pronto da tarefa-mãe

- [ ] Benchmark **cego** com ≥150 casos: acurácia geral ≥ 90%, **recall de PESADO ≥ 95%**, diferença pareada vs Laya significativa (McNemar p < 0,05). ⚠️ **Não atingido:** 180 casos, acurácia final 0,61, recall PESADO 0,88, Laya fora do ar (sem McNemar). Mitigação: confiança baixa já cai em `revisar`/`humano` e nada rebaixa nível; calibração ficou como pendência do `STATUS.md`.
- [x] Guardrails: 0 segredo bruto em log/API; bloqueios corretos nos 20 casos de segurança; nenhum falso bloqueio nos 20 benignos.
- [x] Script somente leitura (INV-3) e `JEV_MODO=off` sem mudança de comportamento.
- [x] Skill com fallback Laya testada em 3 projetos.
- [x] Regra `regras/jev.md` + INDEX + C39 aprovados; `sincronizar.mjs` simulação sem erro.
- [x] Rollback testado e documentado; custo por rodada dentro do limite.
- [x] Todos os gates (`spec/verificar-spec.mjs`), `node --check` e verificações das subtarefas registrados na etapa.

### Validação geral

```powershell
node spec/verificar-spec.mjs tasks/etapas/ETAPA-025-367236b0-JEV-RULES-AI.md
node --check scripts/jev.mjs
node --check scripts/jev/cliente.mjs
node scripts/jev.mjs classificar --dry-run --limite 10
node scripts/jev/avaliar.mjs --backend jev --variante cego --golden scripts/jev/benchmarks/golden.jsonl
node scripts/sincronizar.mjs
git diff --check
```

Sem navegador. Testes automatizados só os invariantes declarados (PESADO, C34); fora disso, conferência por leitura/comando.

### Cronograma (estimativa)

| Subtarefa | Horas |
|---|---|
| .1 Cliente | 2 |
| .2 Estado/decisão | 3 |
| .3 Benchmark | 4 |
| .4 Guardrails escopo/aceite | 2 |
| .5 Guardrails segurança | 3 |
| .6 CLI/skill | 2 |
| .7 Regra global | 1 |
| .8 Rollout | 2 |
| **Total** | **19 h** (3–5 dias úteis, em série) |

### Aprovação

✅ **Aprovado pelo usuário em 2026-10-18 16:45** (ver Decisões), com a .8 mudada para ativação direta. O `--aplicar` global do sincronizador continua sendo ação do usuário.

### Referências

- Regras: `regras/ciclo-da-task.md`, `quadro-de-tarefas.md`, `niveis-e-modelos.md`, `esforco.md`, `espec.md`, `seguranca`/`C20`/`C23`, `C32`.
- `C:\fontes\PROJETO-JEV-AI\AGENTS.md` (seções 4.6, 4.7, 4.8 e 4.9) e relatórios `classificacao-jev*.json`/`classificacao-laya-*.json`.
- TypeSafe: <https://docs.typesafe.ai/api>, <https://docs.typesafe.ai/confidence>, <https://docs.typesafe.ai/cookbooks/llm_guardrails>.
- Skill: `C:\Users\gelva\.agents\skills\classificar-tarefa\SKILL.md`.
- Gate: `spec/verificar-spec.mjs`; templates em `spec/templates/`.
