# Limites do Realtime × frequência de pushes (AGENTES-REALTIME.25)

Medido em 2026-10-23 no `rules-ai` (branch `main`). Veredito: **cabe, com folga enorme**.

## 1. Limites do Supabase Realtime (fato, com fonte)

Conferidos em 2026-10-23.

| Limite | Free | Pro | Fonte |
|---|---|---|---|
| Conexões simultâneas | 200 | 500 | [limites][lim] |
| Mensagens por segundo | 100 | 500 | [limites][lim] |
| Entradas em canal por segundo | 100 | 500 | [limites][lim] |
| Canais por conexão | 100 | 100 | [limites][lim] |
| Tamanho do payload de Broadcast | 256 KB | 3.000 KB | [limites][lim] |
| Mensagens incluídas por mês | 2 milhões | 5 milhões | [cobrança][cob] |
| Excedente de mensagens | não informado | US$ 2,50 por milhão | [cobrança][cob] |

[lim]: https://supabase.com/docs/guides/realtime/limits [cob]:
https://supabase.com/docs/guides/platform/billing-on-supabase

- A página de limites **não** traz cota mensal; a cota (2 milhões no Free) vem da página de
  cobrança.
- **Não verificado:** se cada entrega a um assinante conta como uma mensagem na cota mensal. Pela
  prudência, a conta abaixo multiplica por assinantes. Fonte que faltou: a página de preços/uso
  do Realtime ("Realtime messages") não deixou isso explícito.
- **Não verificado:** o plano em uso no projeto `AULAS SENAI`. Foi usado o Free (pior caso).

## 2. Frequência medida (fato do histórico local)

Dados dos últimos 30 dias (o histórico começa em 2026-10-16). Commits da `main` local, que estão
em dia com o `origin/main`. Commit não é igual a push: um push pode levar vários commits, então
esta é a **estimativa para cima** do número de execuções do workflow.

Só conta commit que mexe em `tasks/STATUS.md`, porque o workflow só dispara nesse caminho (`paths:
[tasks/STATUS.md]`).

| Medida | Resultado | Comando |
|---|---|---|
| Commits na `main` (todos) | 415 | `git log main --since="30 days ago" --format=%cI \| wc -l` |
| Commits que mudam o `STATUS.md` | **364** | `git log main --since="30 days ago" --format=%ct -- tasks/STATUS.md` |
| Melhor dia / pior dia (STATUS) | 8 / **117** (2026-10-23) | `... --format=%cd --date=format:%F -- tasks/STATUS.md \| sort \| uniq -c` |
| Pico em uma hora | **39** (2026-10-23, 12h) | `... --date=format:'%F %H' ... \| sort \| uniq -c \| sort -rn` |
| Pico em 2 minutos | **7** | janela deslizante de 120 s sobre `%ct` (awk) |
| Intervalos ≤ 10 s entre commits | 46 | diferença entre `%ct` consecutivos |
| Intervalos ≤ 60 s entre commits | 159 | idem |
| Execuções após a janela de 3 s | ≈ 327 | grupos de commits separados por mais de 3 s |

Por dia (STATUS): 16/10 → 26; 17/10 → 81; 18/10 → 105; 19/10 → 10; 20/10 → 17; 22/10 →
8; 23/10 → 117 (dia parcial).

Efeito do `concurrency` com `cancel-in-progress` + `sleep 3` (.14): só ajuda em commits com menos
de 3 s de intervalo (37 pares no período). Os demais viram uma mensagem cada. O pico de 7 commits
em 2 minutos continua gerando cerca de 7 mensagens: o ganho real da coalescência é pequeno aqui.

## 3. Comparação (estimativa)

Premissas: 1 mensagem por execução (evento `estado`), mais o evento `projetos` só quando a lista
muda (hoje: nunca, só há `rules-ai`). Ritmo de 2026-10-17 a 2026-10-23 ≈ 55 por dia (média),
com pior dia 117.

| Conta | Valor | Limite | Uso |
|---|---|---|---|
| Mensagens enviadas/mês, ritmo atual (≈ 364 em 30 dias; ponto de partida alto) | ≈ 400 | — | — |
| Mensagens enviadas/mês, pior dia repetido por 30 dias (117 × 30) | 3.510 | 2.000.000 | 0,18 % |
| Entregas/mês com 10 pessoas na página (3.510 × 10) | 35.100 | 2.000.000 | 1,8 % |
| Entregas/mês com 100 pessoas na página (3.510 × 100) | 351.000 | 2.000.000 | 17,5 % |
| Pico por segundo (7 commits em 2 min, 1 por vez; 100 pessoas) | ≤ 100 | 100/s | ver nota |
| Conexões (1 por aba aberta) | até 200 abas | 200 | limite duro |
| Tamanho da mensagem (72 tarefas, medido) | 19.219 bytes (≈ 18,8 KB) | 256 KB | ≈ 7,3 % |

- Nota do pico por segundo: cada envio vai a todos os assinantes ao mesmo tempo. Com 100 abas, uma
  mensagem já gera 100 entregas no mesmo segundo, que é o teto do Free. Acima de ~100 abas
  simultâneas isso vira o gargalo, não a cota mensal. Com 1 a 10 pessoas (uso previsto) não
  chega.
- Tamanho (**fato medido** em 2026-10-23): `python -B dashboard/publicar_quadro.py --simular` com a
  saída num arquivo fora do repositório; JSON compacto (`json.dumps` com `separators=(',',':')` e
  `ensure_ascii=False`, UTF-8) = **19.219 bytes** para 72 tarefas, ≈ 7,3 % de 256 KB (262.144
  bytes). O `STATUS.md` tem 40.817 bytes. O publicador já falha acima de 200 KB.
- Folga: **mais de 98 %** da cota mensal com 10 pessoas; ≈ 82 % ainda com 100 pessoas.

## 4. Veredito

**Cabe.** A frequência de pushes (centenas por mês) é milhares de vezes menor que a cota. O risco
é só de **conexões simultâneas** (200) e de **entregas no mesmo segundo** (100), e só se a
página for aberta por mais de ~100 pessoas ao mesmo tempo. Isso não é o caso hoje (repositório
do usuário e equipe de IA).

## 5. Plano B (só se a folga encolher)

Gatilhos para agir: uso passar de 50 % da cota mensal, mais de ~80 abas simultâneas, ou payload
acima de 150 KB.

1. Aumentar a janela de coalescência de 3 s para 10–15 s (`sleep` no workflow). Pelos dados, 46
   intervalos são ≤ 10 s e ≈ 100 a mais ≤ 60 s: uma janela de 60 s cortaria cerca de 40 % das
   mensagens nos dias de pico.
2. Publicar só quando o quadro muda de fato: comparar o JSON de `tarefas` com o último enviado e
   pular se igual (commit que mexe só em texto fora da tabela não deve gerar mensagem).
3. Mais de ~100 pessoas: subir para o plano Pro (500 conexões, 500 msg/s) ou servir o estado só
   pelo GitHub raw com leitura a cada 30 s (fallback .19), sem canal.
4. Payload perto de 200 KB: cortar tarefas concluídas antigas do envio.
