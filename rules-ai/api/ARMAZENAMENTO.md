# Armazenamento multi-projeto da API (decisão da MIGRAR-TAREFAS-API.53)

Entrada: `api/SCHEMA.md` (seção 7.1, item 6) e as Decisões P1 a P8 da etapa 053.
Premissas fixas: json-server é a única dependência; `db.json` versionado no Git; nuvem lê o
arquivo do Git (só leitura); reserva atômica por um middleware; ids `<projeto>:<codigo>`.

## 1. Números medidos (2026-10-23, só leitura)

Comandos: `wc -lc <arquivo>`, `ls <pasta> | wc -l`, `du -sk <pasta>`,
`cat <pasta>/*.md | wc -lc` (bytes reais do texto das etapas).

| Projeto | STATUS.md | task_complete.md | Etapas (arquivos) | Etapas (texto) | Etapas (du) |
|---|---|---|---|---|---|
| aulasenai | 2.182 linhas / 533 KB | 9 linhas / 2 KB | 510 | 28.406 linhas / 2.341 KB | 3.824 KB |
| DASHBOARD-AI-PRINCIPAL | 134 linhas / 18 KB | 3.708 linhas / 411 KB | 29 | 2.245 linhas / 248 KB | 324 KB |
| rules-ai | 288 linhas / 71 KB | 145 linhas / 40 KB | 53 | 9.717 linhas / 762 KB | 892 KB |

`api/db.json` atual do rules-ai: 4.356 linhas / 141 KB (só tarefas, sem etapas completas).
Observação: o aulasenai mantém o histórico no próprio STATUS (task_complete quase vazio); o
dashboard-ai faz o contrário (histórico no task_complete).

### Estimativa do `db.json` depois da carga (etapas completas + tarefas)

Regra usada: texto das etapas x 1,05 (escape de JSON) + (STATUS + task_complete) x 1,3
(campos derivados, ids, JSON indentado) + ~50 KB de metadados.

| Projeto | Estimativa | Observação |
|---|---|---|
| rules-ai | ~1,1 a 1,2 MB | bate com a estimativa do SCHEMA (1,2 MB) |
| DASHBOARD-AI-PRINCIPAL | ~1,2 MB | dominado pelo histórico de 3.708 linhas |
| aulasenai | ~3,3 a 4,5 MB | etapas 2,4 MB + ~2.200 linhas de tarefas |
| Os três juntos (opção A) | ~5,6 a 6,9 MB | |

Diff típico de uma entrega (subtarefa concluída): move 1 linha de aberta para concluída (2
registros alterados), acrescenta Entrega/Verificação na seção da etapa (1 campo de texto longo
vira uma linha trocada) e muda `meta`/`sequencia`. São de 6 a 15 linhas de diff, mas a linha
da seção da etapa pode ter alguns KB. O diff em si é igual em qualquer opção; o que muda é
**quanto do arquivo é reescrito** e **com quem conflita**.

## 2. Opções comparadas

| Critério | A. `db.json` único | B. 1 arquivo por projeto, 1 processo, 1 porta | C. 1 json-server por projeto | D. Híbrido (textos fora) |
|---|---|---|---|---|
| Arquivo e diff no Git | ~6 a 7 MB; toda escrita reescreve tudo; clone e histórico crescem pelos 3 projetos | cada arquivo de 1 a 4 MB; o rules-ai nunca carrega o peso do aulasenai | igual a B | db pequeno (<1 MB); textos em arquivos à parte |
| Tempo para subir | ~6 MB relidos e regravados a cada escrita (centenas de ms) | cada escrita regrava só o arquivo do projeto; subida soma os 3 | igual a B, com 3 processos | rápido |
| Leitura pela nuvem (raw do GitHub) | 1 URL de ~6 MB para qualquer consulta | 1 URL por projeto, baixa só o necessário | igual a B | 2 URLs por projeto |
| Conflito de merge entre projetos | frentes de projetos diferentes colidem no mesmo arquivo | isolado por projeto | isolado | isolado, mas 2 fontes |
| Atomicidade das reservas | 1 middleware, 1 trava: ótima | 1 middleware, 1 trava de processo (processo único): ótima | 3 processos: trava por processo e coordenada; reserva entre projetos não atômica | ótima, porém etapas fora da API (quebra R6.1) |
| `monitorado:false` / remover projeto | campo no registro; remover = apagar registros de um arquivo grande | campo no registro e remover = apagar 1 arquivo e 1 linha da lista | derrubar 1 processo | apagar 2 arquivos |
| Consulta cruzada | direta | rota agregada do launcher ou 3 chamadas | 3 chamadas | igual a B |
| Código extra | nenhum | launcher pequeno (~40 linhas) com um router por arquivo | nenhum | parser e loader extras |
| Dependência nova | não | não | não | não |

## 3. DECISÃO recomendada: B, com um único processo

Um processo `node api/servidor.mjs` (usa o módulo `json-server` já instalado) que:

- cria **um Express** e **um router do json-server por arquivo** `api/dados/<projeto>.json`
  (json-server 0.17 é Express: `server.use('/<projeto>', jsonServer.router(arquivo))`);
- instala **o mesmo middleware de reserva** antes dos routers, em fila serial dentro do
  processo (a atomicidade vem do processo único mais a trava de PID, como no gerenciador);
- publica `GET /projetos` (lista, `monitorado`, `aguardando`) e `GET /` com os links.

Por que B e não A: o aulasenai sozinho pesa de 3 a 4 MB e tem ~28 mil linhas de etapas; em A
cada reserva do rules-ai reescreveria o arquivo dos três e frentes de projetos diferentes
colidiriam no mesmo arquivo. Por que não C: várias portas e perda da atomicidade entre
projetos. Por que não D: quebra a R6.1 (etapas na API).

O ponto único de leitura continua simples: **uma porta** (3000, padrão do json-server) e a
rota `/<projeto>/<colecao>` (ex.: `/rules-ai/tarefas?disponivel=true`). A nuvem lê
`https://raw.githubusercontent.com/Gelvazio/rules-ai/main/api/dados/<projeto>.json`.

### O que muda no SCHEMA.md (não editado aqui)

- Cada `api/dados/<projeto>.json` tem **as mesmas coleções** do schema; `projeto` continua em
  todo registro e o id continua `<projeto>:<codigo>`. Ids, INV e estado não mudam. A seção 7.1
  item 6 passa de "em aberto" para "decidido: B".
- O `api/db.json` atual vira `api/dados/rules-ai.json` na .5 (carga). A lista de projetos
  (nome, `monitorado`, `aguardando`, repositório) fica em `api/dados/_projetos.json`, lida
  pelo launcher.
- **Para a .4, .5 e .7:** (a) o carregador (.5) recebe `--projeto <nome>` e grava só o arquivo
  desse projeto; (b) o serializador (.7) lê e grava por arquivo, nunca o conjunto; (c) a
  concorrência (CONCORRENCIA.md) vale por processo: **um** servidor e uma trava de PID;
  `_expand` entre projetos não existe (referências sempre dentro do projeto); (d) o middleware
  descobre o arquivo pelo prefixo da rota.

## 4. Plano de rota

Agora (só rules-ai): `api/dados/rules-ai.json` (~1,2 MB) e `npm start` sobe o servidor com 1
router; a lista de projetos tem só `rules-ai`. Nada muda para quem usa só ele.

Quando o aulasenai entrar (.54, depois do corte .48): carga com `--projeto aulasenai` (gera
`api/dados/aulasenai.json`, ~4 MB), linha nova em `_projetos.json` com `monitorado:true`
(P7: aulasenai continua monitorado e intocado) e reinício do servidor. O rules-ai não muda de
arquivo nem de rota. O dashboard-ai segue o mesmo caminho depois, com `aguardando:true` até
entrar. Remover um projeto: apagar o arquivo e a linha de `_projetos.json`.

## 5. Em aberto para o usuário

1. **Aprovar B** (um processo, um arquivo por projeto, rota `/<projeto>/...`) e a pasta
   `api/dados/`.
2. **Onde ficam os dados do aulasenai e do dashboard-ai:** no Git do rules-ai (proposto, lugar
   único) ou em cada repositório (então o servidor precisa de cada pasta e a nuvem de cada raw).
3. **Peso no Git:** ~4 MB do aulasenai regravados em cada entrega aumentam o histórico; aceitar
   (proposto) ou limitar o texto das etapas antigas.
4. **Histórico do aulasenai está no STATUS** (task_complete quase vazio): a carga trata linhas
   concluídas do STATUS como concluídas, sem mover o arquivo de origem (P7: intocado).
5. **Não testado:** o roteamento de vários routers do json-server 0.17 no mesmo Express é
   conhecido, mas deve ser conferido na primeira implementação do launcher.
