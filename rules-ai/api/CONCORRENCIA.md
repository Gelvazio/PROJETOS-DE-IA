# Concorrência e reserva atômica da API do quadro (MIGRAR-TAREFAS-API.6)

Estratégia **para aprovação**, conforme a decisão P4 do usuário: reserva atômica por um middleware
mínimo do próprio json-server (`--middlewares`, 1 arquivo), json-server 0.17.4 como única
dependência, escrita só por `POST /operacoes/<nome>` (`SCHEMA.md` seção 4). Conferido lendo
`api/node_modules` (json-server 0.17.4, lowdb 1.0.0, steno 0.4.4) e por experimento (seção 6).

---

## 1. O problema

- Duas frentes (ex.: Sonnet e Haiku) mandam `reservar` da **mesma** subtarefa quase ao mesmo tempo.
  Sem proteção, as duas leem "livre", as duas gravam e a última vence: duas IAs trabalham na mesma
  subtarefa (viola INV-3).
- O json-server padrão **não tem compare-and-set**: `PATCH /tarefas/<id>` grava o que vier, sem
  condição ("só se `emUsoPor` estiver vazio"). Hoje a trava era o push do Git; na API ela precisa
  nascer dentro da gravação.
- O `db.json` é versionado no Git (R5.2): o arquivo pode mudar por fora da API (`git pull`,
  `git checkout`), o que cria uma segunda fonte de escrita.

## 2. Como o middleware garante a exclusão (um processo)

### 2.1 O que o json-server/lowdb realmente faz (evidência no código)

| Fato | Arquivo e trecho |
|---|---|
| A CLI (`npm start`) abre o banco com o adaptador **assíncrono** | `node_modules/json-server/lib/cli/utils/load.js`: `resolve(low(new FileAsync(source)))` |
| O estado vive **em memória**; a leitura e a mudança das rotas são síncronas sobre ele | `node_modules/lowdb/lib/main.js`: `db.getState()` devolve `db.__wrapped__`; `server/router/plural.js`: `create`/`update`/`destroy` mudam o estado com `db.get(...).insert/updateById/removeById(...).value()` e só depois chamam `next()` |
| A gravação em disco é `db.write()`, que devolve **Promise** e o json-server **não a aguarda** | `server/router/write.js`: `return (req, res, next) => { db.write(); next(); }` (resposta sai antes de o disco confirmar) |
| O disco é gravado pelo `steno`: **uma escrita por vez** por arquivo, arquivo temporário `.~db.json` + `rename`; se chega escrita com outra em andamento, guarda só a **última** (`nextData`) | `node_modules/steno/index.js`: `Writer.prototype.write` (`this.lock`, `this.nextData`, `getTempFile`, `fs.rename`) |
| O middleware de `--middlewares` recebe só `(req, res, next)`, mas o `db` está em `req.app.db` | `lib/cli/run.js`, `createApp`: `app.use(middlewares)` antes do router e `app.db = router.db`; o `body-parser` já rodou (`jsonServer.defaults({ bodyParser: true })`) |
| Com `--watch`, mudança do arquivo no disco **diferente da memória** reinicia o servidor e **relê o disco** | `lib/cli/run.js`: `fs.watch(watchedDir...)` → `!_.isEqual(obj, app.db.getState())` → `server.destroy(() => start())` |

Consequências: (a) a **fonte da verdade em tempo de execução é a memória do processo**, o disco
é uma cópia gravada de forma assíncrona; (b) o `db.write()` nunca bloqueia o tick; (c) o
`--watch` é perigoso aqui (ver 2.4 e 3.4).

### 2.2 A região crítica

Node executa **um** trecho síncrono por vez. Duas requisições HTTP só se intercalam nos pontos de
`await`/callback. Logo, a operação `reservar` é atômica se **não houver `await` entre ler e mudar**:

```
POST /operacoes/reservar  (async, em api/middleware.mjs)
  1. valida o payload                                  (síncrono)
  2. estado = req.app.db.getState()                    (síncrono)
  3. tarefa = achar(estado.tarefas, id)                (síncrono)
  4. confere TODAS as pré-condições (seção 4)          (síncrono)  -> se falhar: 409
  5. muda tarefa, mãe, frente, derivados               (síncrono)  <- região crítica termina aqui
  6. await req.app.db.write()                          (só depois de mudar a memória)
  7. responde 200 (ou 500 se o disco falhou, ver 2.3)
```

Os passos 2 a 5 formam um bloco sem `await`: a segunda requisição só roda o passo 2 depois que a
primeira terminou o 5 e já vê `emUsoPor` preenchido, então cai no 409 do passo 4. Não precisa de
mutex nem de fila **desde que** o código mantenha essa regra: *proibido `await` (ou qualquer
chamada assíncrona) entre a conferência (4) e a mudança (5)*. Se uma pré-condição um dia precisar de
chamada assíncrona (ex.: consultar o Jev), ela roda **antes** do passo 2, e o passo 4 repete a
conferência sobre o estado atual. Alternativa se isso for inevitável: fila de promessas
(`cadeia = cadeia.then(operacao)`) por cima do mesmo bloco; não é necessária na v1.

### 2.3 Gravação e durabilidade

- A resposta `200` só sai **depois** de `await db.write()`: quem recebe "reservei" sabe que o
  `steno` já renomeou o arquivo. O `db.write()` do lowdb serializa (`JSON.stringify`) o estado do
  momento da chamada, e o `steno` coalesce chamadas seguidas (só a última `nextData` vai ao disco), então
  gravações rápidas em sequência não perdem a mais nova.
- Falha de disco (promessa rejeitada): o middleware **desfaz** só os registros que ele mudou (guarda
  cópia deles antes do passo 5, restaura de forma síncrona) e responde `500`. A reserva não
  existe nem na memória.
- A serialização final do arquivo (ordem fixa de chaves, `SCHEMA.md` seção 5) é do serializador
  próprio; o lowdb padrão usa `JSON.stringify(obj, null, 2)` (`lowdb/adapters/_stringify`). O
  middleware chama o serializador no lugar do `db.write()` simples (ponto de integração da .8/.9); a
  exclusão não muda, porque a escrita continua depois do bloco síncrono.
- `PATCH`/`PUT`/`DELETE` das rotas padrão também mudam a memória de forma síncrona (`plural.js`),
  mas o middleware recusa antes os campos de estado (400) e `PUT`/`DELETE` (405), então só passam
  campos que não competem por exclusão.

### 2.4 Por que `--watch` sai

Com `--watch`, depois de cada gravação o `fs.watch` relê o arquivo e compara com a memória. Se
outra operação já mudou a memória (disco um passo atrás), o json-server vê "diferente" e **reinicia
lendo o disco**, que pode ter o estado velho: a reserva em memória some. Decisão: o `npm start`
**não usa `--watch`** (a .8 ajusta o script). A recarga depois de mudança externa é feita por
`POST /operacoes/recarregar` (seção 3.4), de forma explícita e dentro da mesma região crítica.

## 3. Dois processos no mesmo arquivo

O bloco síncrono só protege **dentro de um processo**. Dois processos (dois `npm start`, ou um
script gravando o `db.json`) têm memórias separadas: cada um acha "livre" e o último `rename` vence.

### 3.1 Defesas

| Defesa | Como |
|---|---|
| Porta fixa **3333** | o segundo `npm start` falha com `EADDRINUSE` (a CLI já sai com o erro, `run.js`); é a trava natural, mas some se alguém sobe em outra porta (`--port`) |
| Arquivo de trava **`api/.servidor.lock`** | JSON `{ "pid": <número>, "porta": 3333, "desde": "<ISO>" }`, criado na subida com `wx` (falha se existir); ignorado pelo Git (`api/.gitignore`: `.servidor.lock`, `.~db.json`) |
| Recusa de subir com PID vivo | ao iniciar, se a trava existe: `process.kill(pid, 0)`; sem exceção = processo vivo → o novo **não sobe** e diz o PID; `ESRCH` = trava velha → remove e segue |
| Limpeza | `exit`, `SIGINT`, `SIGTERM` removem a trava; queda brusca deixa trava velha, tratada pelo teste do PID |
| Quem sobe | um lançador de 1 arquivo (`api/iniciar.mjs`) confere a trava e depois executa o `json-server` com `--middlewares`; o `npm start` chama o lançador (a .8 cria; json-server segue a única dependência) |

### 3.2 O que a trava não cobre

PID reaproveitado pelo Windows para outro programa (raro): a recusa seria falsa; o aviso mostra o
PID e a hora (`desde`) para o usuário decidir apagar a trava. Nada de `kill` automático.

### 3.3 Git mexendo no `db.json` com a API ligada

`git pull`, `checkout`, `revert` ou `stash` reescrevem o arquivo por baixo da memória do servidor.
Duas regras:

1. **Antes** de `git pull`/`checkout` que toque `api/db.json`, não há reserva em curso a proteger:
   quem puxa roda `POST /operacoes/recarregar` **depois** do pull (ou reinicia a API).
2. O servidor **nunca grava por cima** de arquivo que mudou por fora: antes de cada `db.write()` o
   middleware compara o `mtime`/hash do arquivo com o do último que ele leu ou gravou; se for
   diferente, responde `409 { motivo: "db_alterado_por_fora" }` e não grava, até `recarregar`.
   (Na v1 basta o `mtime`; hash se der falso positivo.)

### 3.4 `recarregar`

`POST /operacoes/recarregar` (só `127.0.0.1`): na mesma região síncrona, lê o arquivo (`readFileSync`),
valida o JSON e troca o estado (`db.setState(novo)`), devolvendo `meta.sequencia`. Reserva em
curso (passo 6 pendente) termina antes, porque a recarga espera a escrita da fila terminar
(`await` do `write` anterior, **fora** do bloco de reserva; a recarga é a única operação que
fica fora da regra "sem `await`" por não competir por reserva).

### 3.5 Sem nuvem e sem outra máquina

Ver seção 7: a trava vale só no computador onde a API roda.

## 4. Pré-condições que a exclusão protege

Todas conferidas **dentro** do bloco síncrono (2.2), sobre o estado atual, e recusadas com **HTTP
409** e corpo `{ "motivo": "...", "donoAtual": "<emUsoPor ou null>", "tarefa": { ...registro atual } }`.
Payload malformado ou campo de estado em `PATCH` direto: `400`. Id inexistente: `404`.

| Operação | Pré-condições (todas, na região crítica) | `motivo` no 409 |
|---|---|---|
| `reservar` | `tipo=sub`; `statusCodigo=pendente`; `emUsoPor=null`; sem `travaEspecial`; todas as `dependeDe` concluídas ou canceladas; `nivel` presente; `modeloIa` atende a coluna `modelo` e a matriz (C22, C50); a `frente` não tem outra tarefa `em_execucao` | `ocupada` (traz `donoAtual`), `trava`, `dependencia`, `modelo`, `frente_ocupada`, `nao_subtarefa` |
| `entregar` | `statusCodigo=em_execucao`; `emUsoPor` começa com a **própria** `frente`; `entrega` e `verificacao` não vazias | `nao_e_o_dono` (traz `donoAtual`), `estado_invalido`, `sem_entrega` |
| `liberar` | reserva é da `frente` (ou `autor=usuario`) | `nao_e_o_dono` |
| `criarSubtarefa` | mãe existe e é a **mãe atual** da frente (a frente tem tarefa `em_execucao` dessa mãe); nunca cria mãe; **o próximo número é calculado dentro do bloco** (maior sufixo existente da mãe + 1, contando também arquivadas); o `id` novo não pode existir | `mae_invalida`, `mae_nao_e_da_frente`, `id_ja_existe` |

Pontos de atenção para o código da .13 a .15:

- `criarSubtarefa`: duas frentes criando subtarefa na mesma mãe ao mesmo tempo recebem números
  diferentes (`.71` e `.72`) porque o cálculo do próximo número e a inserção estão no mesmo
  bloco; id repetido nunca é aceito (a coleção `tarefas` exige `id` único e o carregador/INV-2
  conferem).
- `entregar` repete a checagem do dono mesmo que a `reservar` já tenha acontecido: outra frente
  pode ter chamado `liberar` e reservado de novo no intervalo.
- A recalculada de `disponivel`, da mãe e da linha da frente fica no **mesmo** bloco; nunca em
  uma segunda requisição.

## 5. Cenário de teste do INV-3 (script da .13)

Pré-requisitos: API no ar em `127.0.0.1:3333` com o `db.json` de teste (cópia descartável com 1
subtarefa `p:T.1` livre, dependências ✅ e `nivel: MEDIO`; **nunca** o `db.json` real), N frentes
distintas, todas `ia=Claude Code`, `modeloIa=Sonnet`.

Passo a passo, para cada **N em 2, 3, ..., 10**:

1. Restaurar o banco de teste (`p:T.1` livre) e conferir `GET /tarefas/p%3AT.1` → `emUsoPor: null`.
2. Disparar **N** `POST /operacoes/reservar` **ao mesmo tempo** (uma só rodada, sem esperar uma
   resposta para mandar a outra) com `frente = frente-1 ... frente-N`.
3. Contar os códigos HTTP e ler `GET /tarefas/p%3AT.1`.
4. Critério (todos obrigatórios):
   - exatamente **1** resposta `200` e **N-1** respostas `409` com `motivo: "ocupada"`;
   - nenhum `5xx` e nenhuma resposta `200` extra;
   - `emUsoPor` é **um único valor**, igual à `frente` da resposta `200`, e `donoAtual` nos 409 é
     esse mesmo valor;
   - `statusCodigo = em_execucao`; só **uma** tarefa com `emUsoPor` daquela frente;
   - o `api/db.json` em disco (lido depois de 500 ms) tem o mesmo dono (a gravação aconteceu antes
     do `200`);
   - repetir cada N por **20 rodadas** (concorrência sorteada) sem nenhuma falha.

Comando que a .13 vai usar (Node 24, sem dependência; `fetch` embutido):

```
node api/testes/inv3-reservas.mjs --n 2..10 --rodadas 20 --url http://127.0.0.1:3333
```

Núcleo do script (esqueleto fixo):

```js
const respostas = await Promise.all(
  Array.from({ length: n }, (_, i) =>
    fetch(`${url}/operacoes/reservar`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: 'p:T.1', frente: `frente-${i + 1}`, ia: 'Claude Code', modeloIa: 'Sonnet' }),
    }).then(async (r) => ({ status: r.status, corpo: await r.json() })),
  ),
);
const sucessos = respostas.filter((r) => r.status === 200).length;
const conflitos = respostas.filter((r) => r.status === 409).length;
// falha se sucessos !== 1 || conflitos !== n - 1 || emUsoPor múltiplo
```

Equivalente rápido por `curl` (confirmação manual, N=10):

```
for i in $(seq 1 10); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://127.0.0.1:3333/operacoes/reservar \
    -H 'content-type: application/json' \
    -d "{\"id\":\"p:T.1\",\"frente\":\"frente-$i\",\"ia\":\"Claude Code\",\"modeloIa\":\"Sonnet\"}" &
done | sort | uniq -c        # esperado: 1 200 e 9 409
wait
```

Verificação extra do teste de dois processos (3.1): subir um segundo `npm start` com a API ligada →
deve falhar e imprimir o PID; apagar a trava com o PID morto e subir → deve subir.

## 6. Evidência já obtida (experimento descartável, fora do repositório)

Servidor Node mínimo com a **mesma estratégia** e o **mesmo adaptador real** do json-server
(`lowdb 1.0.0` `FileAsync` do `api/node_modules`): estado em memória, conferir e mudar sem `await`,
`await db.write()` e só então responder. Dez requisições simultâneas de `reservar` da mesma
subtarefa:

| Variante | N | 200 | 409 | Estado final |
|---|---|---|---|---|
| Estratégia deste documento (sem `await` entre checar e mudar) | 2 | 1 | 1 | um único dono |
| Estratégia deste documento | 10 | **1** | **9** | `emUsoPor: "frente-0"` também no disco |
| **Controle** com `await` de 5 ms entre checar e mudar | 10 | **7** | 3 | 7 frentes acharam "livre" (INV-3 violado) |

Conclusão: a exclusão vem de **não ter ponto de `await` na região crítica**; o controle prova que o
teste da .13 detecta a falha quando a regra é quebrada. O script do experimento não foi
versionado.

## 7. O que fica fora

- **Várias máquinas ou nuvem:** a API e a trava só valem no computador onde ela roda. A nuvem e
  qualquer outra máquina **só leem** o `api/db.json` do Git (R3.2) e **não reservam**; avisam o
  usuário que a ação é local. Duas máquinas com API própria reservando a mesma subtarefa não são
  protegidas (o Git fica com um conflito de merge no `db.json`, resolvido à mão).
- Mesmo computador com **dois repositórios** clonados (cada um com a sua API) não é protegido.
- Escrita direta no `db.json` por editor ou script sem passar pela API: só detectada pelo `mtime`
  (3.3); não impedida.
- Autenticação: a API escuta só em `127.0.0.1`; qualquer processo local pode chamá-la (aceito na v1).
- Transação entre várias operações (reservar + anotar decisão): cada operação é atômica sozinha.

## 8. Pontos em aberto

1. `api/package.json` ainda usa `--watch` e `json-server` sem `--middlewares`: a .8 deve trocar o
   `start` pelo lançador com trava, sem `--watch` (seção 2.4).
2. O `db.write()` do lowdb usa `JSON.stringify(..., null, 2)`; a ordem fixa de chaves
   (`SCHEMA.md` seção 5) exige o serializador próprio chamado pelo middleware: combinar com a .9.
3. `recarregar` e a checagem de `mtime` são propostas desta estratégia; entram na .13 (ou numa
   subtarefa nova da mãe, se o líder preferir) e precisam do "sim" do usuário junto com o resto.
