# Benchmark do Jev (JEV-RULES-AI.3)

Mede o quanto o Jev acerta o **nível** (LEVE/MEDIO/PESADO) das subtarefas do quadro, com o state
**cego** (sem rótulo), e compara com o Laya local quando ele está no ar.

## Arquivos

| Arquivo | Para quê |
|---|---|
| `golden.jsonl` | 180 casos: `id`, `esperado`, `state_sem_rotulo`, `tags`, `fonte`, `auditado` |
| `construir-golden.mjs` | Regera o golden a partir dos quadros de `C:/fontes/*/tasks` (somente leitura) |
| `casos-sinteticos.mjs` | 24 casos sintéticos de borda (8 por nível) |
| `auditoria.mjs` | Itens lidos à mão (39) e os de rótulo duvidoso (4) |
| `saidas/` | Relatórios `.json`, `.md` e `.auditoria.jsonl` (fora do Git) |

## Como o golden é montado

- **156 reais** (52 por nível): subtarefas com nível na coluna Modelo do quadro e seção na etapa,
  amostradas por hash, alternando entre projetos. O rótulo é o nível que já estava no quadro.
- **24 sintéticos** de borda: palavra enganosa (texto sobre chave sem mexer em chave), 1 arquivo
  mas SQL/RLS, inglês, descrição curta, mudança em massa etc.
- **Cego:** o state passa por `estado.mjs` e por um resíduo extra (linha `Entrega`, `executor-<nível>`,
  `--leve/--medio/--pesado`). Nunca lê `DEMAIS-PROJETOS-*`.
- Regerar: `node scripts/jev/benchmarks/construir-golden.mjs` (determinístico).

## Rodar

```
node scripts/jev/avaliar.mjs --backend jev --variante cego --golden scripts/jev/benchmarks/golden.jsonl
node scripts/jev/avaliar.mjs --backend jev --variante revisor      # vazamento: state + nivel_atual
node scripts/jev/avaliar.mjs --backend ambos --variante cego       # Laya só se responder em :8000
node scripts/jev/avaliar.mjs --backend jev --repeticoes 3          # estabilidade
```

Opções: `--limite N`, `--concorrencia 3`, `--semente 7`. Custo de uma rodada completa: ~US$ 0,009.
A chave vem de `TYPESAFE_API_KEY` (ambiente ou `.env`); nada é impresso.

## O que o relatório traz

Acurácia com IC de Wilson, matriz 3×3, recall/precisão/F1 por nível (recall de PESADO com IC),
macro-F1, Brier multiclasse, ECE, curva cobertura × precisão, p50/p95, erros, tokens, custo
(US$ e R$ a 6,00), estabilidade entre repetições, subgrupos (reais, sintéticos, auditados, borda,
rótulo duvidoso) e, com os dois backends, McNemar exato + bootstrap pareado. Duas visões: **nível
final** (Jev + sinais de PESADO, o que o rules-ai usaria) e **nível sugerido** (só a pergunta `nivel`).
