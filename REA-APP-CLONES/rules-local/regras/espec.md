# 🧾 Spec em tarefa `PESADO` — requisitos, invariantes e perguntas abertas (C34)

Decidido em 2026-10-18. Vale para **todas as IAs e todos os projetos**. Complementa
`ciclo-da-task.md` (o plano continua sendo a **etapa**, nunca em `docs/` — C10), `testes-validacao.md`
e `niveis-e-modelos.md`.

## Quando vale

- ✅ **Só tarefa `PESADO`** (a definição é a de `ciclo-da-task.md`: banco, segurança, várias partes,
  estrutura/gerador novo, mudança em massa, apagar dados).
- ❌ `LEVE` e `MEDIO` **não** usam spec: seguem só a etapa normal. Não transformar tarefa pequena em
  cerimônia.

## As 3 seções obrigatórias na etapa

Antes de reservar ou executar a **primeira** subtarefa, a etapa ganha três seções (modelos prontos em
`spec/templates/`, um arquivo por seção):

| Seção | O que exige |
|---|---|
| `### Requisitos` | cada requisito com critério **EARS** e a **Verificação** (comando, leitura ou consulta) |
| `### Invariantes` | regra que vale para **toda** entrada, com o **domínio** e **como conferir** — ou `N/A` justificado |
| `### Perguntas abertas` | toda dúvida que muda o resultado, **fechada** (nenhum `⬜`) |

Formas EARS aceitas (só estas cinco): `QUANDO … O SISTEMA DEVE …` · `SE …, ENTÃO …` ·
`ENQUANTO …, …` · `ONDE …, …` · `O SISTEMA DEVE …`. Proibido adjetivo sem número ou comportamento
observável ("rápido", "amigável", "tratar erros").

## Regras

1. **Pergunta aberta com `⬜` bloqueia a execução**: não reservar nem executar subtarefa enquanto
   houver. Dúvida que não muda o resultado não vira pergunta — vira linha em **Decisões**.
2. Requisito sem critério EARS **não entra**; invariante sem "como conferir" **não entra**.
3. **Teste automatizado de invariante é permitido só em `PESADO`** (exceção de
   `testes-validacao.md`), declarado na seção Invariantes, com o comando na Verificação da subtarefa.
   Fora de `PESADO`, a conferência é por leitura, comando ou consulta.
4. O **gate** faz parte da Verificação da primeira subtarefa:
   `node spec/verificar-spec.mjs tasks/etapas/ETAPA-<n>-<hash>-<NOME>.md` (sai com código 1 quando
   falta seção, EARS, invariante ou pergunta fechada, e quando falta `Nível`/`Modelo`/`Effort`).
5. Mudança **material** de requisito depois de aprovado → atualizar a etapa e registrar em
   **Decisões**; não alterar em silêncio.
6. A spec vale para `PESADO` criada **depois** desta regra; etapas anteriores não são revalidadas.

## O que a spec não é

- ❌ Não é `docs/` nem pasta paralela: o plano é a **etapa**.
- ❌ Não é PRD, não é promessa de teste, não duplica regra de outro arquivo — aponta para ele.
- ❌ Não é obrigatória em `LEVE`/`MEDIO`, nem desculpa para alongar tarefa simples.
