## Etapa 044-7a4d8f72 — REGRA-MAIS-FORTE-NUNCA: modelo mais forte nunca pega tarefa de modelo mais fraco

**Tarefa:** REGRA-MAIS-FORTE-NUNCA · **Pedido em:** 2026-10-23 13:26 · **Criada por:** Claude Code (Opus 5.5 · sargento herdr w2:p1) (local · main · rules-ai)
**Pedido:** "adicione 1 regra global de pegar tarefa que deve ser a maior de todas! NUNCA UM MODELO MAIS FORTE, PODE PEGAR TAREFA DE 1 MAIS FRACO! NUNCA, GRAVE ISSO EM rules-ai global"
**Objetivo:** a regra passa a ser a primeira das regras globais (a que vence todas), para todas as IAs.

### Decisões

- 2026-10-23 13:26: pedido do usuário; vira a decisão **C50**. Reforça a C2 (cada IA só o seu nível) com prioridade máxima. Vale também para o líder: subtarefa `LEVE` ou `MEDIO` nunca é feita pelo Opus/Fable, mesmo de fechamento; o líder só reserva, confere e commita (edição do quadro não é subtarefa).

### REGRA-MAIS-FORTE-NUNCA.1 — Escrever a regra e registrar a C50

**Próximo passo:** nenhum — entregue.

- **Nível:** LEVE — só `.md`
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** criar `regras/regra-maior.md`; pôr como item 0, antes de tudo, no `regras/INDEX.md`; linha C50 no `CONFLITOS.md`; uma linha em `regras/niveis-e-modelos.md` apontando para ela; entrada com data e hora no `STATUS_PROJETO.md`.
- **Arquivos:** `regras/regra-maior.md`, `regras/INDEX.md`, `CONFLITOS.md`, `regras/niveis-e-modelos.md`, `STATUS_PROJETO.md`
- **Critérios de Aceitação:** a regra existe, é a 1ª do índice e cita a C50; nada mais muda nos arquivos.
- **Depende de:** Nenhuma
- **Entrega:** regras/regra-maior.md (nova), regras/INDEX.md (item 0, seção "Regra maior"), CONFLITOS.md (C50), regras/niveis-e-modelos.md (aviso no topo) e STATUS_PROJETO.md (commit desta entrega), feito por h1 (Haiku 5.5, herdr w2:pY, conta D).
- **Verificação:** diff da regra contra o texto combinado: igual; INDEX com a regra antes de "Fluxo de trabalho"; linha C50 com as mesmas 5 colunas da C49; linha de niveis-e-modelos.md corrigida (faltava o nome do arquivo); conferido pelo líder com git diff.

### REGRA-MAIS-FORTE-NUNCA.2 — Gerar a nova versão das regras

**Próximo passo:** nenhum — entregue.

- **Nível:** MEDIO — roda o sincronizador (script) e confere a saída
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **JEV-AI-SUGGESTION:** NAO
- **Descrição:** `node scripts/sincronizar.mjs --aplicar`; conferir que `dist/REGRAS-GLOBAIS.md` começa pela regra nova e que a `VERSAO.md` ganhou a linha dela.
- **Arquivos:** `VERSAO.md`, `dist/REGRAS-GLOBAIS.md`
- **Critérios de Aceitação:** `VERSAO.md` com versão nova e `regra-maior.md`; a regra é o 1º bloco do `dist/`.
- **Depende de:** REGRA-MAIS-FORTE-NUNCA.1
- **Entrega:** VERSAO.md na versão 2026-10-23-265a119a com regra-maior.md (commit desta entrega; dist/ fora do Git), feito por sn1 (Sonnet 5.5, herdr w2:pZ, conta D).
- **Verificação:** node scripts/sincronizar.mjs --aplicar; VERSAO.md com a linha 1 regra-maior.md f0c7e50ae85c602b; dist/REGRAS-GLOBAIS.md começa pela regra maior logo depois do cabeçalho (conferido pelo líder). Os projetos recebem a regra pelo rules-local na próxima sessão de cada um.
