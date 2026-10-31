## Etapa 019-6a76e10c — RULES-LOCAL-GLOBAL: regras globais importadas em `rules-local/` no início de cada sessão

**Tarefa:** RULES-LOCAL-GLOBAL · **Pedido em:** 2026-10-18 10:38 · **Criada por:** Claude Code (Opus 5.5) (local · main)
**Pedido:** "CRIE 1 TAREFA QUE IMPORTE AS REGRAS GLOBAIS SEMPRE NO INICIO DE CADA SESSAO, PARA TODOS
OS PROJETOS DA PASTA C:\fontes\, exceto a pasta C:\fontes\DEMAIS-PROJETOS-NAO-MEXER-AGORA\ e
C:\fontes\scripts\, sempre que iniciar 1 nova sessao, deve atualizar as regras globais do
repositorio https://github.com/Gelvazio/rules-ai e colocar na pasta local do projeto de nome
rules-local, nesta mesma pasta deve ter 1 arquivo de nome VERSAO.md, que deve comparar com a versao
global, que deve existir em https://github.com/Gelvazio/rules-ai/VERSAO.md, SE A VERSAO LOCAL FOR
IGUAL DA NUVEM, NAO FAZ NADA, SE FOR DIFERENTE, DEVE DISPARAR A TAREFA DE SINCRONIZAR TASKS,
AVALIANDO ITEM POR ITEM, E VENDO O QUE FOI MUDADO, ADICIONADO OU REMVIDO. Salve esta tarefa aqui no
quadro das tasks em C:\fontes\rules-ai\tasks\STATUS.md"
**Objetivo:** cada projeto de `C:\fontes` passa a ter uma cópia das regras globais em
`rules-local/`, conferida pela versão (`VERSAO.md`) a cada sessão nova, local ou na nuvem, e
qualquer mudança de versão dispara uma sincronização que mostra, item por item, o que foi mudado,
adicionado ou removido.

> 🟠 **Tarefa grande (`PESADO`)**: mexe em vários repositórios (mudança em massa), cria
> gerador/script novo e ganchos de sessão. O plano é esta etapa; a execução **só começa depois do
> "sim" do usuário** e com as **Perguntas abertas** fechadas (C34).

### Escopo

**Entra:**
- `VERSAO.md` na raiz do `rules-ai` (lido pela nuvem em
  `https://raw.githubusercontent.com/Gelvazio/rules-ai/main/VERSAO.md`), atualizado pelo
  `scripts/sincronizar.mjs` quando as regras mudam.
- Script de sessão (Node, sem dependências) que baixa a `VERSAO.md` do GitHub, compara com
  `rules-local/VERSAO.md` e, se diferente, baixa as regras novas, compara item por item e grava o
  relatório de mudanças.
- Regra global nova em `regras/` (e no `regras/INDEX.md`) dizendo o que a IA faz no início da
  sessão e o que é a "tarefa de sincronizar tasks".
- Instalação em cada projeto: pasta `rules-local/`, gancho `SessionStart` do Claude Code e aviso
  no `AGENTS.md`/`CLAUDE.md` para as IAs sem gancho; commit + push em cada repositório.

**Não entra:**
- `C:\fontes\DEMAIS-PROJETOS-NAO-MEXER-AGORA\` e `C:\fontes\scripts\` (pedido do usuário).
- `C:\fontes\DEMAIS-PROJETOS-DE-SISTEMAS-MANTER-OFFLINE\` (C20: só entra se o usuário pedir pelo
  nome; ver pergunta 4).
- Banco de dados, chaves ou tokens (o `rules-ai` é público: leitura sem credencial).
- Mudar o conteúdo das regras globais existentes (só a regra nova da sessão).

### Critério de pronto

- `VERSAO.md` publicada no GitHub e respondendo 200 no endereço `raw`.
- Em cada projeto do escopo: `rules-local/VERSAO.md` igual à da nuvem e o gancho de sessão
  versionado; uma sessão nova com versão igual não muda nenhum arquivo.
- Com uma versão diferente (simulada numa cópia), o script grava o relatório com as listas de
  regras mudadas, adicionadas e removidas e avisa a sessão para disparar a sincronização.
- `node spec/verificar-spec.mjs` passa nesta etapa (sem pergunta `⬜`).

### Riscos

| Risco | Plano B |
|---|---|
| Sessão sem internet (ou GitHub fora) | O script não falha a sessão: avisa "sem acesso ao rules-ai" e segue com o `rules-local/` atual |
| Pastas que são clones do mesmo repositório (`aulasenai` ×5, `dashboard-ai-*` ×9) gravam o mesmo `rules-local/` | Instalar uma vez por repositório remoto; os outros clones recebem pelo `git pull --rebase` |
| IA sem gancho de sessão (Gemini, Codex, Grok, DeepSeek…) não roda o script sozinha | Aviso no `AGENTS.md` manda rodar o comando no início; o gancho automático é só do Claude Code |
| Gancho atrasar o início da sessão | Tempo-limite curto no download (constante no script); passou do tempo, segue sem atualizar |
| Mudança em massa errar num repositório | Instalar primeiro em 1 projeto piloto, conferir, e só então nos outros |

### Requisitos

> Formato EARS. Ajustados às respostas de 2026-10-18 13:49 (perguntas 1 a 6).

| ID | Requisito (EARS) | Cobre | Verificação |
|----|------------------|-------|-------------|
| R1.1 | QUANDO as regras de `regras/` mudarem e o `sincronizar.mjs` rodar, O SISTEMA DEVE gravar uma `VERSAO.md` nova na raiz do `rules-ai` com versão diferente da anterior | RULES-LOCAL-GLOBAL.1 | Rodar o script antes e depois de mudar 1 regra numa cópia; comparar as duas `VERSAO.md` |
| R1.2 | SE as regras não mudarem, ENTÃO O SISTEMA DEVE manter a `VERSAO.md` idêntica (byte a byte) | RULES-LOCAL-GLOBAL.1 | Rodar 2 vezes seguidas; `git diff --exit-code VERSAO.md` |
| R2.1 | QUANDO uma sessão nova começar num projeto do escopo, O SISTEMA DEVE ler a `VERSAO.md` da nuvem e a `rules-local/VERSAO.md` | RULES-LOCAL-GLOBAL.2 | Rodar o script numa cópia e ler a saída |
| R2.2 | SE a versão local for igual à da nuvem, ENTÃO O SISTEMA DEVE terminar sem gravar nenhum arquivo | RULES-LOCAL-GLOBAL.2 | `git status --short` vazio depois do script |
| R2.3 | SE a versão local for diferente da da nuvem (ou não existir), ENTÃO O SISTEMA DEVE baixar as regras para `rules-local/`, gravar a lista de regras mudadas, adicionadas e removidas e avisar a sessão para disparar a sincronização | RULES-LOCAL-GLOBAL.2 | Simular versão antiga numa cópia; ler o relatório e a saída |
| R2.4 | SE o GitHub não responder no tempo-limite, ENTÃO O SISTEMA DEVE avisar "sem acesso ao rules-ai" e terminar com código 0, sem apagar o `rules-local/` | RULES-LOCAL-GLOBAL.2 | Rodar com endereço inválido numa cópia |
| R2.5 | O SISTEMA DEVE decidir se sincroniza **só** pela comparação entre a `rules-local/VERSAO.md` e a `VERSAO.md` da nuvem (a `VERSAO.md` local é o arquivo controlador do `rules-local/`) | RULES-LOCAL-GLOBAL.2 | Leitura do código: nenhum outro arquivo decide a sincronização |
| R2.6 | SE algum arquivo do `rules-local/` não bater com o código registrado para ele na `rules-local/VERSAO.md` (ou faltar), ENTÃO O SISTEMA DEVE tratar como versão diferente e baixar tudo de novo | RULES-LOCAL-GLOBAL.2 | Numa cópia, alterar 1 regra do `rules-local/` à mão e rodar o script: ele restaura e avisa |
| R2.7 | QUANDO a sincronização baixar as regras, O SISTEMA DEVE gravar a `rules-local/VERSAO.md` **por último**, só depois de todas as regras gravadas e conferidas | RULES-LOCAL-GLOBAL.2 | Leitura do código + simular falha de rede no meio: a `VERSAO.md` local fica a antiga |
| R3.1 | QUANDO a sessão receber o aviso de versão diferente, O SISTEMA DEVE mostrar o relatório (mudado, adicionado, removido) e avaliar cada item contra o projeto | RULES-LOCAL-GLOBAL.3 | Leitura da regra nova e do relatório de uma simulação |
| R3.2 | QUANDO um item do relatório exigir ajuste no projeto, O SISTEMA DEVE criar 1 TASK no quadro do projeto (`tasks/STATUS.md` ou `STATUS.md`), com etapa, subtarefa e nível, citando a regra e a versão | RULES-LOCAL-GLOBAL.3 | Simulação numa cópia: 1 regra mudada que exige ajuste ⇒ 1 TASK nova |
| R3.3 | SE já existir no quadro uma TASK para a mesma regra e a mesma versão, ENTÃO O SISTEMA DEVE não criar outra | RULES-LOCAL-GLOBAL.3 | Rodar a simulação 2 vezes: o quadro tem 1 TASK só |
| R4.1 | O SISTEMA DEVE ter `rules-local/` (versionada no Git) e o gancho de sessão nos 18 repositórios com GitHub do escopo, e em nenhuma pasta fora dele | RULES-LOCAL-GLOBAL.4 | Listagem das pastas de `C:\fontes` com e sem `rules-local/` |
| R4.2 | O SISTEMA DEVE ter, em cada projeto do escopo, a `rules-local/VERSAO.md` igual à da nuvem ao fim da instalação | RULES-LOCAL-GLOBAL.4 | Em cada projeto: rodar o script dá "versão igual" e `git status --short` vazio |

**Fora do escopo (não-objetivos):**

- Editar as regras dentro do `rules-local/` à mão (é cópia; a fonte continua `rules-ai/regras/`).
- Reescrever o `sincronizar.mjs` ou os arquivos globais das IAs (continuam como estão).

### Invariantes

| ID | Regra que vale sempre | Domínio da entrada | Como conferir | Teste automatizado |
|----|----------------------|--------------------|---------------|--------------------|
| INV-1 | Versão igual ⇒ nenhum arquivo do projeto muda | qualquer projeto do escopo, qualquer estado do `rules-local/` com versão igual | `git status --short` vazio depois do script | não: conferência por comando |
| INV-2 | O script nunca apaga nem escreve fora de `rules-local/` | qualquer resposta da rede (200, 404, erro, tempo esgotado) | leitura do código (todo caminho gravado começa em `rules-local/`) + simulação | não: leitura + comando |
| INV-4 | `rules-local/VERSAO.md` igual à da nuvem ⇒ todo arquivo do `rules-local/` bate com o código registrado nela (a `VERSAO.md` controla a pasta) | qualquer projeto do escopo, depois de qualquer execução do script (com ou sem falha no meio) | simulação: falha no meio + arquivo editado à mão; conferir códigos contra a `VERSAO.md` | não: conferência por comando |
| INV-3 | Mudado + adicionado + removido + igual = todas as regras da versão antiga e da nova, sem repetir | quaisquer dois conjuntos de arquivos de regras (vazio, iguais, disjuntos) | simulação com 3 casos numa cópia | não: conferência por comando |

**Casos de borda que o código precisa sobreviver:**

- `rules-local/` inexistente (primeira sessão); `VERSAO.md` local vazia ou corrompida.
- Sem internet, GitHub 404/500, resposta parcial.
- Regra renomeada (aparece como removida + adicionada).
- Duas sessões abrindo ao mesmo tempo no mesmo projeto.

### Perguntas abertas

| # | Pergunta | Resposta | Fechada em | Quem respondeu |
|---|----------|----------|------------|----------------|
| 1 | O que a "tarefa de sincronizar tasks" faz com cada item mudado/adicionado/removido: só mostra o relatório, ou também cria uma TASK no quadro do projeto para ajustar o projeto à regra nova? | **b)** mostra o relatório **e** cria uma TASK no quadro do projeto para cada ajuste necessário | 2026-10-18 13:49 | Gelvazio (`task-sincronizador-local.png`) |
| 2 | A pasta `rules-local/` fica versionada no Git de cada projeto (vai junto para a nuvem) ou fica fora do Git (`.gitignore`, baixada a cada sessão)? | **a)** versionada: vai junto para a nuvem e funciona sem internet | 2026-10-18 13:49 | Gelvazio (`task-sincronizador-local.png`) |
| 3 | Como a sessão roda a verificação: gancho automático `SessionStart` no Claude Code + aviso no `AGENTS.md` para as outras IAs, ou só o aviso no `AGENTS.md` para todas? | **a)** gancho `SessionStart` no Claude Code + aviso no `AGENTS.md` para as outras IAs | 2026-10-18 13:49 | Gelvazio (`task-sincronizador-local.png`) |
| 4 | Quais pastas entram: só os repositórios Git com GitHub (18), ou também `testes-effort-padaria` (Git sem remoto), `CONFIG-DEEPSEEK` e `assets` (sem Git), e a `DEMAIS-PROJETOS-DE-SISTEMAS-MANTER-OFFLINE` (C20)? | **a)** só os repositórios com GitHub (18 pastas) | 2026-10-18 13:49 | Gelvazio (`task-sincronizador-local.png`) |
| 5 | A versão é um número que alguém sobe à mão (ex.: `1.4.0`) ou é gerada sozinha pelo `sincronizar.mjs` a partir do conteúdo das regras (data + código do conteúdo)? | **a)** gerada sozinha pelo `sincronizar.mjs` (data + código do conteúdo) | 2026-10-18 13:49 | Gelvazio (`task-sincronizador-local.png`) |
| 6 | (pedido do usuário, sem pergunta) | **A `VERSAO.md` é o arquivo controlador do `rules-local/` em cada projeto** — "me garanta que isso será feito": virou R2.5, R2.6, R2.7, R4.2 e INV-4 | 2026-10-18 13:49 | Gelvazio (`task-sincronizador-local.png`) |

### Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-18 14:10 | **Formato combinado** (`.6`): código = SHA-256 do texto sem BOM e com LF (16 caracteres por arquivo, 8 na versão); versão `AAAA-MM-DD-<código>` só muda quando o conteúdo muda; item do relatório = 1 arquivo (detalhe pelo `git diff`); 4 scripts em `rules-local/` copiados de `scripts/rules-local/`, sem se atualizarem pela `VERSAO.md`; ver a seção "Formato combinado" | Claude Code (Opus 5.5 · OP-6) | Contrato único para as subtarefas paralelas |
| 2026-10-18 11:42 | **Divisão para paralelismo** (aprovada, "SIM"): o formato combinado (`.6`) vem primeiro; o script de sessão foi dividido em peças `.7` (download), `.8` (comparação) e `.9` (conferência), juntadas pela `.2`; a `.3` passa a depender só da `.6`; a instalação virou lista de repositórios (`.11`), instalador (`.12`), aviso (`.13`), piloto (`.4`) e 3 lotes (`.14` a `.16`). Escopo, requisitos e invariantes não mudam | Gelvazio | Mais paralelismo (até 8 agentes na onda 1) |
| 2026-10-18 10:38 | O endereço `https://github.com/Gelvazio/rules-ai/VERSAO.md` é a página do arquivo; o script lê o conteúdo cru em `https://raw.githubusercontent.com/Gelvazio/rules-ai/main/VERSAO.md` | Claude Code (Opus 5.5) | A página do GitHub devolve HTML, não o texto do arquivo |
| 2026-10-18 10:38 | O repositório `rules-ai` é público (`raw` respondeu 200 em 2026-10-18 10:38): sem chave nem token | Claude Code (Opus 5.5) | Conferido com `curl` |
| 2026-10-18 10:38 | O próprio `rules-ai` não ganha `rules-local/` (ele é a fonte) | Claude Code (Opus 5.5) | Cópia de si mesmo não acrescenta nada |
| 2026-10-18 13:50 | **Plano aprovado** ("SIM") — execução liberada, só o escopo desta etapa | Gelvazio | Resposta ao resumo de 13:49 |
| 2026-10-18 13:49 | Respostas: 1-b, 2-a, 3-a, 4-a, 5-a; e a `VERSAO.md` é o controlador do `rules-local/` em cada projeto (R2.5–R2.7, R4.2, INV-4) | Gelvazio | `task-sincronizador-local.png` |
| 2026-10-18 13:49 | A regra nova autoriza a sessão a criar TASK (mãe nova) no quadro do projeto para cada ajuste vindo do relatório — exceção pontual à C26 | Claude Code (Opus 5.5) | Resposta 1-b |
| 2026-10-18 10:38 | Clones do mesmo repositório (`aulasenai` ×5, `dashboard-ai` ×9) recebem a instalação uma vez por repositório remoto | Claude Code (Opus 5.5) | Evita 14 commits iguais e conflitos |

### Formato combinado

> Contrato da `.6` (2026-10-18). As subtarefas `.1`, `.7`, `.8`, `.9`, `.2`, `.3`, `.10`, `.12` e
> `.13` seguem só esta seção. Mudar algo daqui = atualizar esta seção + linha em **Decisões**.
> "Item" do relatório = **1 arquivo de regra**; o detalhe dentro do arquivo vem do
> `git diff -- rules-local/regras/` (a pasta é versionada, então o texto antigo está no Git).

#### F1. Código do conteúdo (hash) e normalização

- **Normalizar** o texto antes de calcular: tirar o BOM do início (`\uFEFF`) e trocar todo `\r\n`
  por `\n`. Nada mais (sem `trim`, sem mexer em espaços). Assim o mesmo arquivo dá o mesmo código
  com `core.autocrlf=true` (Windows) ou sem ele (nuvem).
- **Código de um arquivo:** SHA-256 (`node:crypto`) do texto normalizado em UTF-8, em hexadecimal
  minúsculo, **primeiros 16 caracteres** (`TAMANHO_CODIGO_ARQUIVO = 16`).
- **Código do conteúdo (da versão):** montar uma linha `<arquivo> <código>\n` por regra, **na
  ordem da tabela da `VERSAO.md`**, juntar tudo (sem separador extra) e calcular o SHA-256 do
  resultado; **primeiros 8 caracteres** (`TAMANHO_CODIGO_VERSAO = 8`).

```js
const normalizarTexto = (texto) => texto.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
const calcularCodigo = (texto, tamanho) =>
  createHash('sha256').update(normalizarTexto(texto), 'utf8').digest('hex').slice(0, tamanho);
```

- O mesmo algoritmo existe em 2 lugares, de propósito: no `scripts/sincronizar.mjs` (`.1`, quem
  **gera**) e no `rules-local/conferir.mjs` (`.9`, quem **confere**). Os scripts do `rules-local/`
  rodam nos outros projetos sem o `rules-ai` por perto, então não importam nada de fora da pasta.
  A conferência cruzada (códigos da `.1` = códigos calculados pela `.9`) fica na `.2`.

#### F2. `VERSAO.md` (raiz do `rules-ai` e `rules-local/VERSAO.md`)

- **Quem grava na raiz do `rules-ai`:** o `scripts/sincronizar.mjs` (`.1`), em toda execução (com
  ou sem `--aplicar`, como o `dist/`). **Quem grava no projeto:** só o `rules-local/sessao.mjs`
  (`.2`), copiando **exatamente** o texto baixado da nuvem.
- **Quais arquivos entram na tabela, nesta ordem:** `INDEX.md` primeiro (número 0), depois os de
  `listarArquivosDeRegras()` do `sincronizar.mjs` (os do índice, na ordem dele; depois os que não
  estão no índice, em ordem alfabética), ou seja, o mesmo conjunto do `dist/` mais o índice.
  Mudar a ordem no índice muda o código do `INDEX.md` e, portanto, a versão.
- **Versão:** `AAAA-MM-DD-<código do conteúdo>`. A data é o dia (fuso `America/Sao_Paulo`) em que
  o código do conteúdo mudou.
- **Igual byte a byte quando nada muda (R1.2):** antes de gravar, o `.1` lê a `VERSAO.md` que já
  existe; se a linha `Versão` dela termina com o **mesmo** código do conteúdo calculado agora, **não
  grava** (mantém a data antiga). Só com código diferente (ou arquivo ausente/corrompido) grava a
  `VERSAO.md` nova com a data de hoje. A data nunca muda sozinha.
- **Arquivo:** UTF-8 sem BOM, fim de linha `\n`, termina com `\n`. Sem hora, sem nome de máquina,
  sem nada que mude entre execuções.
- **Nome de arquivo válido na tabela:** `^[A-Za-z0-9._-]+\.md$` (sem `/`, sem `\`). Quem lê
  rejeita o resto (INV-2: nada sai do `rules-local/`).

Exemplo completo (com as regras de 2026-10-18 13:50; os códigos são reais):

```markdown
# VERSAO — regras globais do rules-ai

<!-- gerado por scripts/sincronizar.mjs; não editar -->

- **Versão:** 2026-10-18-ff11fc59
- **Algoritmo:** sha256 do texto (sem BOM, fim de linha LF); 16 caracteres por arquivo, 8 na versão
- **Fonte:** https://github.com/Gelvazio/rules-ai/tree/main/regras

## Regras

| # | Arquivo | Código |
|---|---------|--------|
| 0 | INDEX.md | 19076a4f82247905 |
| 1 | ciclo-da-task.md | 0f655a1970c31da1 |
| 2 | niveis-e-modelos.md | ae07ca7d285ebc14 |
| 3 | frentes-e-reserva.md | 35dc8d1e8f3c16f0 |
| 4 | comando-ponto.md | 25fab5e441b75d40 |
| 5 | comando-interrogacao.md | e81811ae12199f38 |
| 6 | quadro-de-tarefas.md | 412bac4a23471c1a |
| 7 | exibicao-de-status.md | 762e831da32bdc80 |
| 8 | git-geral.md | 9d2938daf92d3efe |
| 9 | testes-validacao.md | 233579829f757900 |
| 10 | codigo-limites-nomes.md | ca88cca3360ef918 |
| 11 | codigo-solid.md | 6f3e1050946d15af |
| 12 | espec.md | 1cfd3d3f1e4c4742 |
| 13 | esforco.md | d897c4cb72bd6c76 |
| 14 | graphify.md | f31357d0386045d2 |
| 15 | gerenciador-centralizado.md | c6f5535db0d613a4 |
| 16 | pastas-ignoradas.md | b33814d65cafd940 |
| 17 | atividades-e-idioma.md | a37b651279928422 |
```

- **Como ler (`.9`, `lerVersao`):** versão pela linha `^- \*\*Versão:\*\* (\d{4}-\d{2}-\d{2}-[0-9a-f]{8})$`;
  regras pelas linhas `^\| (\d+) \| ([A-Za-z0-9._-]+\.md) \| ([0-9a-f]{16}) \|$`, na ordem em que
  aparecem. **Corrompida** (= versão diferente) quando: falta a linha da versão; não há nenhuma
  regra; um arquivo aparece 2 vezes; ou o código do conteúdo recalculado das linhas não bate com o
  final da versão. As outras linhas (título, comentário, Algoritmo, Fonte) não são conferidas.
- **Comparar local × nuvem (R2.5):** iguais ⇔ `normalizarTexto(local) === normalizarTexto(nuvem)`
  **e** `conferirPasta` íntegro (R2.6). Nenhum outro arquivo decide.

#### F3. Conteúdo do `rules-local/` em cada projeto

| Caminho no projeto | O que é | Quem cria / grava |
|---|---|---|
| `rules-local/sessao.mjs` | Script de sessão (entrada; junta as peças) | `.2` escreve; `.12` copia |
| `rules-local/baixar.mjs` | Download com tempo-limite | `.7` escreve; `.12` copia |
| `rules-local/comparar.mjs` | Comparação item por item (função pura) | `.8` escreve; `.12` copia |
| `rules-local/conferir.mjs` | Hash, leitura da `VERSAO.md` e conferência da pasta | `.9` escreve; `.12` copia |
| `rules-local/VERSAO.md` | Controlador da pasta (cópia exata da nuvem) | `sessao.mjs`, **por último** |
| `rules-local/regras/<arquivo>.md` | Regras baixadas (texto exato do `raw`), inclusive `INDEX.md` | `sessao.mjs` |
| `rules-local/RELATORIO.md` | Relatório da última sincronização (F5) | `sessao.mjs` |
| `rules-local/.gitattributes` | `* text eol=lf` (checkout igual ao `raw` também no Windows) | `.12` |
| `rules-local/.gitignore` | `.trava` | `.12` |
| `rules-local/.trava` | Trava de 2 sessões ao mesmo tempo (fora do Git) | `sessao.mjs` cria e apaga |

- **Fonte dos 4 scripts no `rules-ai`:** `scripts/rules-local/*.mjs` (mesmos nomes). O `.12` copia
  **todos os `*.mjs`** dessa pasta. Os scripts **não** entram na `VERSAO.md` e não se atualizam
  sozinhos: correção nos scripts chega aos projetos rodando o instalador de novo (`.12`).
- Os scripts usam só módulos `node:` (Node 18+, por causa do `fetch` e do `AbortSignal.timeout`),
  `export` nomeado, sem `default`, e acham a própria pasta por
  `dirname(fileURLToPath(import.meta.url))` (funciona de qualquer pasta atual).
- **INV-2:** o `sessao.mjs` só grava, apaga ou cria dentro da pasta dele; em `regras/` só apaga
  `*.md` que não estão na tabela nova. Nunca usa Git.

#### F4. Assinatura dos módulos

**`.7` — `rules-local/baixar.mjs`** (nunca lança exceção; erro vira `{ ok: false }`)

```js
export const URL_RAW_BASE = 'https://raw.githubusercontent.com/Gelvazio/rules-ai/main';
export const TEMPO_LIMITE_MS = 5000;
/** opcoes = { urlBase = URL_RAW_BASE, tempoLimiteMs = TEMPO_LIMITE_MS, buscar = fetch } */
export async function baixarTexto(caminhoRelativo, opcoes = {})
//   GET `${urlBase}/${caminhoRelativo}` com AbortSignal.timeout(tempoLimiteMs)
//   -> { ok: true, texto } | { ok: false, motivo } ; motivo: 'tempo esgotado' | 'HTTP 404' |
//      'erro de rede: <mensagem>'
export async function baixarVersao(opcoes = {})          // = baixarTexto('VERSAO.md', opcoes)
export async function baixarRegras(arquivos, opcoes = {})
//   arquivos: string[] (nomes da tabela); baixa `regras/<arquivo>` em paralelo (Promise.all)
//   -> { ok: true, textos: Map<arquivo, texto> } | { ok: false, motivo, arquivo }
```

**`.8` — `rules-local/comparar.mjs`** (função pura, sem disco nem rede)

```js
export function compararListas(antiga, nova)
//   antiga, nova: Map<arquivo, código> (antiga vazia quando não há VERSAO.md local válida)
//   -> { mudado: string[], adicionado: string[], removido: string[], igual: string[] }
//   cada lista em ordem alfabética (sort padrão), sem repetir; renomeado = removido + adicionado
//   INV-3: mudado + adicionado + removido + igual = união das chaves das duas listas
```

**`.9` — `rules-local/conferir.mjs`** (só leitura)

```js
export const ARQUIVO_VERSAO = 'VERSAO.md';
export const PASTA_REGRAS = 'regras';
export function normalizarTexto(texto)            // F1
export function calcularCodigo(texto, tamanho = 16)  // F1 (16 = arquivo; 8 = versão)
export function lerVersao(texto)
//   -> { ok: true, versao, regras: Map<arquivo, código> } | { ok: false, motivo }
//   texto null/vazio -> { ok: false, motivo: 'VERSAO.md ausente' }; outros: 'VERSAO.md corrompida'
export function conferirPasta(pastaRulesLocal)
//   lê <pasta>/VERSAO.md e confere cada <pasta>/regras/<arquivo> pelo código
//   -> { integro: true, versao } |
//      { integro: false, motivo, arquivos: [{ arquivo, problema }] }
//   problema: 'faltando' | 'diferente' | 'sobrando' (.md em regras/ fora da tabela)
```

**`.2` — `rules-local/sessao.mjs`** (entrada; termina **sempre** com código 0)

1. `nuvem = await baixarVersao({ urlBase: process.env.RULES_LOCAL_URL_BASE ?? URL_RAW_BASE })`;
   falhou → aviso "sem acesso" (F5) e sai. `lerVersao(nuvem.texto)` inválida → aviso "nuvem
   inconsistente" e sai.
2. Lê a `VERSAO.md` local (ausente = `null`) e roda `conferirPasta`. Texto normalizado igual
   **e** íntegro → aviso "versão igual" e sai **sem gravar nada** (INV-1; nem a trava).
3. Diferente: pega a trava (`.trava`, `openSync` com `'wx'`, conteúdo `pid` + hora; trava com mais
   de `TRAVA_VALIDADE_MS = 120000` é considerada abandonada e trocada). Trava ocupada → aviso
   "outra sessão sincronizando" e sai.
4. `baixarRegras([...nuvem.regras.keys()])`; falhou → aviso "sem acesso", solta a trava e sai sem
   gravar. Confere `calcularCodigo(texto) === código da tabela` de cada uma; algum não bate (cache do
   `raw` desencontrado) → aviso "nuvem inconsistente", solta a trava e sai sem gravar.
5. `compararListas(antiga, nuvem.regras)` (antiga = `lerVersao(local).regras` ou `new Map()`).
6. Grava, nesta ordem: as regras em `regras/`; apaga os `*.md` de `regras/` fora da tabela nova;
   `RELATORIO.md`; **por último** a `VERSAO.md` (texto exato da nuvem, R2.7). Solta a trava.
7. Imprime o aviso "versão nova" (F5). Erro inesperado em qualquer ponto → solta a trava, imprime
   `rules-local: erro inesperado: <mensagem>` e sai com 0.

#### F5. Relatório de mudanças e avisos

**Arquivo:** `rules-local/RELATORIO.md`, regravado a cada sincronização (nunca quando a versão é
igual). O histórico fica no Git. Exemplo:

```markdown
# Relatório de mudanças — rules-local

<!-- gerado por rules-local/sessao.mjs; não editar -->

- **Versão anterior:** 2026-10-10-1a2b3c4d
- **Versão nova:** 2026-10-18-ff11fc59
- **Gerado em:** 2026-10-18 14:05 (Brasília)
- **Motivo:** versão diferente
- **Totais:** 1 mudado · 1 adicionado · 1 removido · 15 igual

## Itens

| Situação | Arquivo | Código anterior | Código novo |
|---|---|---|---|
| mudado | ciclo-da-task.md | 9c1d0e2f3a4b5c6d | 0f655a1970c31da1 |
| adicionado | rules-local.md | — | 7e8f9a0b1c2d3e4f |
| removido | regra-antiga.md | 5a6b7c8d9e0f1a2b | — |

## Restaurados

| Arquivo | Problema |
|---|---|
```

- **Versão anterior:** a da `VERSAO.md` local válida, ou `nenhuma`.
- **Motivo** (um destes): `versão diferente` · `rules-local ausente` (sem `VERSAO.md` local) ·
  `VERSAO.md local corrompida` · `conferência falhou` (versão igual, mas arquivo
  faltando/diferente/sobrando; R2.6).
- **Itens:** só `mudado`, `adicionado` e `removido`, nessa ordem e, dentro de cada um, em ordem
  alfabética; o `igual` aparece só nos Totais. Tabela vazia quando não há item.
- **Restaurados:** os `arquivos` do `conferirPasta` quando ele não está íntegro; tabela vazia nos
  outros casos.

**Avisos impressos na saída** (prefixo `rules-local:`; é o que a sessão lê):

| Caso | Texto exato (uma linha cada) |
|---|---|
| Versão igual | `rules-local: versão igual (<versão>); nada a fazer.` |
| Sem acesso (R2.4) | `rules-local: sem acesso ao rules-ai (<motivo>); seguindo com a versão local <versão\|nenhuma>.` |
| Nuvem inconsistente | `rules-local: nuvem inconsistente (<motivo>); nada gravado, tentar na próxima sessão.` |
| Outra sessão | `rules-local: outra sessão está sincronizando; seguindo com a versão local.` |
| Versão nova (linha 1) | `rules-local: VERSÃO NOVA <anterior\|nenhuma> -> <nova> (<n> mudado, <n> adicionado, <n> removido).` |
| Versão nova (linha 2) | `rules-local: relatório em rules-local/RELATORIO.md.` |
| Versão nova (linha 3) | `rules-local: DISPARAR A SINCRONIZAÇÃO DE TASKS (regras/rules-local.md) antes do primeiro pedido.` |

- A frase-gatilho para a IA é **`DISPARAR A SINCRONIZAÇÃO DE TASKS`** (a `.3` escreve na regra
  nova: viu essa frase → segue a sincronização de tasks; viu as outras → não faz nada).
- O script **não** faz commit: o commit do `rules-local/` (com o quadro, quando houver TASK nova) é
  da sessão, pela regra da `.3`.

#### F6. Comando do gancho e do aviso

- **Comando (aviso do `AGENTS.md`, `.13`, rodado na raiz do projeto):** `node rules-local/sessao.mjs`
- **Comando do gancho:** `node "$CLAUDE_PROJECT_DIR/rules-local/sessao.mjs"` (mesmo padrão dos
  ganchos que já existem em `C:\fontes`).
- **Trecho do `.claude/settings.json`** (o `.12` acrescenta este item ao vetor
  `hooks.SessionStart` existente, sem apagar os outros; já existe item cujo `command` contém
  `rules-local/sessao.mjs` → não faz nada; sem arquivo → cria só com isto):

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/rules-local/sessao.mjs\"",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

- **Aviso no `AGENTS.md` (`.13`):** o modelo fica em `scripts/rules-local/aviso-agents.md` (não é
  `.mjs`, o `.12` não copia para o `rules-local/`); o `.12` coloca o texto entre
  `<!-- rules-local:inicio -->` e `<!-- rules-local:fim -->` no `AGENTS.md` (sem ele, no
  `CLAUDE.md`; sem nenhum dos dois, avisa e pula), trocando o bloco se já existir.
- **Instalador (`.12`):** `node scripts/instalar-rules-local.mjs <pasta-do-projeto>`. Copia os
  `*.mjs`, grava `.gitattributes` e `.gitignore` (F3), o gancho (acima) e o aviso, e roda o
  `rules-local/sessao.mjs` do projeto para baixar as regras da nuvem (por isso a `.1` já precisa
  estar publicada). Não faz commit. Na segunda vez não muda nada.

#### F7. Constantes

| Constante | Valor | Onde fica |
|---|---|---|
| `URL_RAW_BASE` | `https://raw.githubusercontent.com/Gelvazio/rules-ai/main` | `baixar.mjs` (exportada) |
| `TEMPO_LIMITE_MS` | `5000` (por pedido; os de regras vão em paralelo) | `baixar.mjs` (exportada) |
| `RULES_LOCAL_URL_BASE` | variável de ambiente que troca a `URL_RAW_BASE` (só para simular, R2.4) | lida no `sessao.mjs` |
| `TAMANHO_CODIGO_ARQUIVO` / `TAMANHO_CODIGO_VERSAO` | `16` / `8` | `conferir.mjs` e `sincronizar.mjs` |
| `ARQUIVO_VERSAO` · `PASTA_REGRAS` | `'VERSAO.md'` · `'regras'` | `conferir.mjs` (exportadas) |
| `ARQUIVO_RELATORIO` · `ARQUIVO_TRAVA` | `'RELATORIO.md'` · `'.trava'` | `sessao.mjs` |
| `TRAVA_VALIDADE_MS` | `120000` | `sessao.mjs` |
| `PREFIXO_AVISO` | `'rules-local:'` | `sessao.mjs` |
| `FUSO_HORARIO` | `'America/Sao_Paulo'` (data da versão e "Gerado em") | `sincronizar.mjs` e `sessao.mjs` |
| Tempo do gancho | `30` segundos | `.claude/settings.json` |

### RULES-LOCAL-GLOBAL.1 — `VERSAO.md` no `rules-ai`, gerada pelo `sincronizar.mjs`

**Próximo passo:** líder conferir e commitar.

- **Nível:** MEDIO — lógica em JS em 1 arquivo (`scripts/sincronizar.mjs`) + 1 `.md` gerado.
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Descrição:** o `sincronizar.mjs` grava `VERSAO.md` na raiz (versão gerada: data + código do conteúdo),
- **JEV-AI-SUGGESTION:** NAO
  com a versão e a lista das regras e o código do conteúdo de cada uma (é o que permite comparar
  item por item depois); não muda o arquivo se as regras não mudaram. Atualizar o README.
- **Critérios de aceitação:** R1.1 e R1.2; `node --check`; funções ≤ 45 linhas.
- **Verificação:** `node spec/verificar-spec.mjs tasks/etapas/ETAPA-019-6a76e10c-RULES-LOCAL-GLOBAL.md`
  (gate da C34, antes de começar) + os comandos de R1.1 e R1.2.
- **Entrega:** `scripts/sincronizar.mjs` (F1/F2: `normalizarTexto`, `calcularCodigo`, `gravarVersao`),
  `VERSAO.md` (raiz, gerada), `README.md` (explicação). Commit: a cargo do líder.
- **Verificação (SN-1, 2026-10-18):** gate da spec ✅ (todas as linhas ✅); `node --check` ✅; script
  sem `--aplicar` 2× seguidas → `VERSAO.md` idêntica (`cmp`) e 2ª saída "versão sem mudança" (R1.2);
  versão gerada `2026-10-18-ff11fc59` = a do exemplo da F2; em cópia no scratchpad, 1 linha a mais em
  `git-geral.md` → versão passou a `…-99a89e38` (R1.1). A `VERSAO.md` será regerada pelo líder no fim
  (a `.3` mexe em `regras/`).

### RULES-LOCAL-GLOBAL.2 — Script de sessão: comparar versões e listar mudanças

**Próximo passo:** líder conferir e commitar.

> Desde a divisão: download, comparação e conferência saem prontos da `.7`, `.8` e `.9`; esta subtarefa junta as peças e cuida da gravação (`VERSAO.md` por último, R2.5–R2.7), do relatório, do aviso, de duas sessões ao mesmo tempo e de INV-1, INV-2 e INV-4.

- **Nível:** PESADO — script novo com rede, gravação em massa nos projetos e casos de erro.
- **Modelo:** só Opus 5.5+ ou Fable (ou DeepSeek, C35) — nunca outro
- **Effort:** high
- **Descrição:** script Node sem dependências (vai dentro de `rules-local/`, para rodar também na
- **JEV-AI-SUGGESTION:** NAO
  nuvem): baixa a `VERSAO.md` da nuvem; igual → sai sem gravar; diferente ou ausente → baixa as
  regras do `regras/INDEX.md`, compara com as locais (por arquivo e por item de cada arquivo),
  grava `rules-local/` e o relatório de mudanças (mudado, adicionado, removido) e imprime o aviso
  para a sessão disparar a sincronização. Tempo-limite e falha de rede sem quebrar a sessão.
- **Critérios de aceitação:** R2.1 a R2.4; INV-1 a INV-3; casos de borda da seção Invariantes.
- **Entrega:** `scripts/rules-local/sessao.mjs` (F3/F4/F5/F7; junta `baixar.mjs`, `comparar.mjs`
  e `conferir.mjs` sem alterá-los). Commit: a cargo do líder.
- **Verificação (OP-2, 2026-10-18 12:05):** `node --check` ok; 22 funções, maior com 26 linhas;
  nenhuma linha > 100. **Conferência cruzada F1:** `lerVersao(VERSAO.md da raiz)` ok
  (`2026-10-18-ef54a693`, 19 regras) e os 19 códigos da `.1` = `calcularCodigo` da `.9` sobre
  `regras/*.md` (0 divergências, nenhum `.md` fora da tabela). **Simulação** em projeto Git
  temporário no scratchpad (`core.autocrlf=true` + `.gitattributes`/`.gitignore` do F3), com
  servidor local no lugar do raw (`RULES_LOCAL_URL_BASE`): (1) sem `rules-local` → "VERSÃO NOVA
  nenhuma -> …", 19 adicionado; (2) e (4) versão igual → `git status --short` vazio (INV-1, R2.2);
  (3) versão antiga → 1 mudado, 1 adicionado, 1 removido (renomeação = removido + adicionado),
  `RELATORIO.md` no formato F5; (5) endereço inválido, HTTP 500, tempo esgotado e 404 →
  "sem acesso", saída 0, nada mudado (R2.4); (6) regra editada, faltando e `.md` sobrando →
  motivo "conferência falhou", 3 em Restaurados e pasta restaurada (R2.6); (7) `VERSAO.md` local
  lixo e vazia → "VERSAO.md local corrompida", anterior "nenhuma"; (8) regra truncada →
  "nuvem inconsistente", 404 numa regra → "sem acesso", nada gravado; (9) falha no meio da
  gravação (EISDIR) → "erro inesperado", saída 0, `VERSAO.md` local continua a antiga (R2.7,
  INV-4); próxima execução restaura e a seguinte dá "versão igual"; (10) duas sessões ao mesmo
  tempo → uma sincroniza, a outra "outra sessão está sincronizando", trava apagada no fim;
  (11) trava com 5 min é trocada; trava nova bloqueia. **Raw real:** projeto vazio, rodado de
  outra pasta atual → baixou `2026-10-18-ef54a693`; 2ª execução "versão igual" e
  `git status --short` vazio; `rules-local/VERSAO.md` = `VERSAO.md` da raiz. INV-2 por leitura:
  todo caminho gravado/apagado passa por `caminhoNaPasta` (dentro do `rules-local/`); sem Git.
- **Anotação:** com a trava na mão o script relê o estado local (outra sessão pode ter acabado de
  gravar) e, se ficou igual, só avisa "versão igual". Os 3 módulos são importados de forma
  estática: se faltar um deles no projeto, o Node sai com código 1 antes do script rodar (caso de
  instalação quebrada; o `.12` copia os 4).

### RULES-LOCAL-GLOBAL.3 — Regra global da sessão e da "sincronização de tasks"

**Próximo passo:** líder conferir e commitar.

- **Nível:** PESADO — regra global nova, vale para todas as IAs e projetos.
- **Modelo:** só Opus 5.5+ ou Fable (ou DeepSeek, C35) — nunca outro
- **Effort:** high
- **Descrição:** `regras/rules-local.md` (o que a IA faz no início da sessão, o que fazer com o
- **JEV-AI-SUGGESTION:** NAO
  aviso de versão diferente, conforme a pergunta 1) e a linha nova no `regras/INDEX.md`; registro
  como decisão nova no `CONFLITOS.md`.
- **Critérios de aceitação:** R3.1; regra no índice; o `sincronizar.mjs` não avisa regra fora do
  índice.
- **Entrega:** `regras/rules-local.md` (novo: o que é o `rules-local/`, início da sessão com a
  tabela dos avisos de F5, sincronização de tasks em 6 passos, limites) e `regras/INDEX.md` (linha
  17 nova em "Agentes e ferramentas", `atividades-e-idioma.md` passa a 18, e a frase da nuvem
  aponta para `rules-local/regras/`). Sem `CONFLITOS.md` (a C36 já está lá, da `.10`), sem
  `sincronizar.mjs`, sem `--aplicar`. Commit pelo líder.
- **Verificação:** leitura contra R3.1–R3.3 e F2–F6 (frase-gatilho, textos dos avisos, comandos do
  gancho e do aviso, commit pela sessão); `node -e` com o mesmo padrão de link do `sincronizar.mjs`
  (`PADRAO_LINK_INDICE`) no `INDEX.md`: 18 no índice = 18 em `regras/`, nenhuma fora do índice,
  nenhuma inexistente (o `sincronizar.mjs` não avisa); nenhuma linha acima de 100 caracteres nos
  2 arquivos. Não rodei o `sincronizar.mjs` (ele grava `dist/` e `VERSAO.md`, que são da `.1`).
- **Anotação (para o líder conferir):** 3 escolhas feitas na regra, dentro do escopo da `.3`:
  (1) a sincronização é rotina autorizada pela regra e **não** vira TASK; só os ajustes viram;
  (2) R3.3 pelo ID determinístico `RL-<código da versão>-<ARQUIVO>` (ex.:
  `RL-FF11FC59-CICLO-DA-TASK`), procurado no `STATUS.md` e no `task_complete.md`;
  (3) versão anterior `nenhuma` (instalação) não avalia item a item nem cria TASK — senão a
  instalação dos lotes criaria 18 TASKs por projeto. ⚠️ Mudar o `INDEX.md` e criar a regra muda a
  `VERSAO.md` (a `.1` precisa rodar depois deste commit para publicar a versão com a regra nova).

### RULES-LOCAL-GLOBAL.4 — Instalar no projeto piloto

**Próximo passo:** líder conferir e commitar.

> Desde a divisão: esta subtarefa é só o **piloto**; os outros repositórios ficam nos lotes `.14`, `.15` e `.16` (lista da `.11`).

- **Nível:** PESADO — mudança em massa em vários repositórios.
- **Modelo:** só Opus 5.5+ ou Fable (ou DeepSeek, C35) — nunca outro
- **Effort:** high
- **Descrição:** em 1 projeto piloto, depois nos outros (uma vez por repositório remoto):
- **JEV-AI-SUGGESTION:** NAO
  `rules-local/` (script + `VERSAO.md` + regras), gancho `SessionStart` em `.claude/settings.json`
  (conforme a pergunta 3), aviso no `AGENTS.md`/`CLAUDE.md`, `.gitignore` conforme a pergunta 2;
  commit + push em cada repositório; os outros clones com `git pull --rebase`.
- **Critérios de aceitação:** R4.1; em cada projeto, rodar o script dá "versão igual" e
  `git status --short` vazio.
- **Entrega (piloto `C:\fontes\template-inicial-tasks-ia`):** commit `4b24b83` no
  `Gelvazio/template-inicial-tasks-ia` (push `1738d53..4b24b83`), com `rules-local/` (4 `.mjs`,
  `.gitattributes`, `.gitignore`, `VERSAO.md`, `RELATORIO.md`, `regras/` com 19 arquivos),
  `.claude/settings.json` (gancho de F6 acrescentado no fim do `SessionStart`, o
  `sincronizar-main.sh` e os outros ganchos intactos) e `AGENTS.md` (bloco
  `rules-local:inicio/fim` no fim). No `rules-ai`, só esta seção (sem Git).
- **Verificação (OP-4, 2026-10-18):** `git pull --rebase` no piloto (já em dia); instalador →
  `6 criado, 2 atualizado`, `VERSÃO NOVA nenhuma -> 2026-10-18-ef54a693 (19 adicionado)`,
  `rules-local íntegro`, saída 0; `rules-local/VERSAO.md` = `VERSAO.md` da raiz (`cmp`) = a do
  `raw` (`ef54a693`). Depois do commit + push: `node rules-local/sessao.mjs` → `versão igual
  (2026-10-18-ef54a693)`; mesmo resultado rodado de `C:\` com caminho absoluto (como o gancho);
  2ª execução do instalador → nada muda; `git status --short` sem nenhum arquivo da instalação
  (R4.2); `HEAD` = `origin/main`; `git ls-files --eol rules-local` → `i/lf w/lf eol=lf`. R4.1 até
  aqui: das pastas de `C:\fontes` (fora `DEMAIS-PROJETOS-*`), só o piloto tem `rules-local/`.
- **Anotação — ajuste para depois (não alterei o `sessao.mjs`):** confirmado: a linha 3 do aviso
  "versão nova" (`scripts/rules-local/sessao.mjs:351`, igual ao texto de F5) cita
  `(regras/rules-local.md)`, mas no projeto o caminho é `rules-local/regras/rules-local.md`.
  Corrigir F5 + `sessao.mjs` juntos e reinstalar (o script não chega pela `VERSAO.md`).
- **Anotação — para os lotes `.14`–`.16`:**
  (1) O piloto já tinha arquivos fora do Git antes da instalação (`.codex/hooks.json`,
  `.codex/hooks/`, `.vscode/`); não mexi. Em cada repositório, guardar o `git status --short`
  **antes** e conferir R4.2 como "nenhum arquivo da instalação sobrando", não "saída vazia".
  (2) A instalação sempre imprime `DISPARAR A SINCRONIZAÇÃO DE TASKS` com versão anterior
  `nenhuma`: pela regra `rules-local.md` é "sem ajuste — instalação", **nenhuma TASK** no quadro do
  projeto; o commit é o da instalação (mensagem do líder), com `git add` só de `rules-local/`,
  `.claude/settings.json` e `AGENTS.md`/`CLAUDE.md`.
  (3) O `AGENTS.md` do piloto estava em LF no disco: o Git avisa "LF will be replaced by CRLF";
  é só aviso (o índice fica LF).
  (4) Repositórios do mesmo modelo têm `pre-push` que faz `git fetch` e recusa se o remoto andou:
  `git pull --rebase origin main` antes do push. O `pre-commit` só age com `.agents/` no commit.
  (5) A versão publicada hoje é `2026-10-18-ef54a693` (19 regras, já com `rules-local.md`); se o
  `rules-ai` publicar outra versão no meio dos lotes, os repositórios ficam com versões diferentes
  até a próxima sessão de cada um (esperado).
  (6) Lote B: a pasta de instalação do `dashboard-ai` ainda está "a definir" (`.11`).

### RULES-LOCAL-GLOBAL.6 — Formato combinado dos arquivos

**Próximo passo:** líder conferir e commitar.

- **Nível:** PESADO — decide a arquitetura que todas as outras peças seguem
- **Modelo:** só Opus 5.5+ ou Fable (ou DeepSeek, C35) — nunca outro
- **Effort:** high
- **Descrição:** escrever nesta etapa, numa seção "Formato combinado": o formato exato da `VERSAO.md` (versão = data + código do conteúdo; lista de regras com o código de cada uma; algoritmo do código), o formato do relatório de mudanças (arquivo, nome, colunas), o conteúdo de `rules-local/` (nomes dos arquivos do script e das regras), a assinatura de cada módulo (`.7` download, `.8` comparação, `.9` conferência) e o comando que o gancho e o aviso chamam.
- **Critérios de aceitação:** as subtarefas `.1`, `.7`, `.8`, `.9`, `.3`, `.10` e `.12` conseguem trabalhar só com esta seção, sem perguntar.
- **Entrega:** seção "### Formato combinado" (F1 a F7) nesta etapa, antes da `.1`, e linha em
- **JEV-AI-SUGGESTION:** NAO
  **Decisões** (2026-10-18 14:10). Só este arquivo; commit pelo líder.
- **Verificação:** `node spec/verificar-spec.mjs tasks/etapas/ETAPA-019-6a76e10c-RULES-LOCAL-GLOBAL.md`
  → saída 0 (14 requisitos EARS, 4 invariantes, nenhuma pergunta aberta, 16 subtarefas completas).
  O exemplo da `VERSAO.md` foi conferido por `node -e` com as próprias regras de leitura de F2: versão
  `2026-10-18-ff11fc59`, 18 linhas, código do conteúdo recalculado = `ff11fc59` e os 18 códigos
  iguais aos de `regras/*.md` hoje. O formato do gancho segue o dos `settings.json` que já existem
  em `C:\fontes` (`node "$CLAUDE_PROJECT_DIR/..."`).
- **Anotação:** a `.13` (aviso) e a `.12` (instalador) também têm o que precisam em F6.

### RULES-LOCAL-GLOBAL.7 — Módulo de download com tempo-limite

**Próximo passo:** líder conferir e commitar.

- **Nível:** MEDIO — 1 arquivo JS, sem gravação em disco
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Descrição:** módulo `.mjs` sem dependências (assinatura da `.6`): baixa a `VERSAO.md` e as regras do `raw.githubusercontent.com`, com tempo-limite em constante; erro, 404/500 e tempo esgotado viram resultado "sem acesso", nunca exceção.
- **Critérios de aceitação:** R2.4 (parte da rede); funções ≤ 45 linhas; `node --check`.
- **Verificação:** `node --check` + chamada com endereço inválido e com o endereço real.
- **Entrega:** `scripts/rules-local/baixar.mjs` (F3/F4/F7: `URL_RAW_BASE`, `TEMPO_LIMITE_MS`, `baixarTexto`, `baixarVersao`, `baixarRegras`). Sem commit (líder).
- **Verificação (feita):** `node --check` OK. Endereço inválido → `erro de rede: fetch failed`; IP sem resposta com 300 ms → `tempo esgotado`; `raw` real `nao-existe.md` → `HTTP 404`; `baixarRegras(['INDEX.md'])` real → `ok` com 1 texto; com arquivo inexistente → `{ ok: false, motivo: 'HTTP 404', arquivo }`. `baixarVersao()` real deu `HTTP 404` porque a `VERSAO.md` ainda não foi publicada (`.1`): esperado.
- **JEV-AI-SUGGESTION:** NAO

### RULES-LOCAL-GLOBAL.8 — Comparação item por item

**Próximo passo:** líder conferir e commitar.

- **Nível:** MEDIO — função pura em 1 arquivo JS
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Descrição:** módulo `.mjs` com função pura que recebe as listas antiga e nova (nome → código) e devolve mudado, adicionado, removido e igual; regra renomeada = removida + adicionada.
- **Critérios de aceitação:** INV-3; funções ≤ 45 linhas; `node --check`.
- **Verificação:** conferência por `node -e` com os 3 casos (vazio, iguais, disjuntos) e uma renomeação.
- **Entrega:** `scripts/rules-local/comparar.mjs` (`compararListas(antiga, nova)`, F4; sem commit — do líder).
- **Verificação feita:** `node --check` ok; `node -e` com 6 casos (vazio×vazio, vazio×nova, iguais, disjuntos, 1 mudado, renomeação): resultado conforme F4 e INV-3 (soma das 4 listas = união das chaves) verdadeira em todos.
- **JEV-AI-SUGGESTION:** NAO

### RULES-LOCAL-GLOBAL.9 — Conferência do `rules-local/` contra a `VERSAO.md`

**Próximo passo:** líder conferir e commitar.

- **Nível:** MEDIO — 1 arquivo JS, só leitura
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Descrição:** módulo `.mjs` que lê a `rules-local/VERSAO.md` (vazia ou corrompida conta como diferente) e confere o código de cada arquivo do `rules-local/`; devolve "íntegro" ou a lista dos arquivos que não batem ou faltam. Não grava nada.
- **Critérios de aceitação:** R2.6 (parte da conferência); funções ≤ 45 linhas; `node --check`.
- **Verificação:** conferência numa cópia: arquivo editado à mão e arquivo faltando aparecem na lista.
- **Entrega:** `scripts/rules-local/conferir.mjs` (exports F4: `ARQUIVO_VERSAO`, `PASTA_REGRAS`, `normalizarTexto`, `calcularCodigo`, `lerVersao`, `conferirPasta`; só `node:`; sem gravação).
- **Verificação feita:** `node --check` ok; nenhuma linha > 100 caracteres; simulação em pasta temporária (fora do repositório): pasta íntegra ⇒ `integro: true`; arquivo editado ⇒ `diferente`, arquivo apagado ⇒ `faltando`, `.md` extra ⇒ `sobrando`; `VERSAO.md` vazia/ausente ⇒ `VERSAO.md ausente`; texto lixo e versão com código errado ⇒ `VERSAO.md corrompida`; BOM e CRLF não mudam o código. Falta a conferência cruzada com a `.1` (fica na `.2`).
- **JEV-AI-SUGGESTION:** NAO

### RULES-LOCAL-GLOBAL.10 — Registro no `CONFLITOS.md`

**Próximo passo:** líder conferir e commitar.

- **Nível:** LEVE — só `.md`
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **Descrição:** acrescentar ao `CONFLITOS.md` a decisão nova (regras globais em `rules-local/` por projeto, conferidas pela `VERSAO.md`; exceção pontual à C26 para criar TASK a partir do relatório).
- **Critérios de aceitação:** linha nova no formato do arquivo, sem mexer nas outras.
- **Entrega:** `CONFLITOS.md` (1 linha nova, `C36`, na tabela "Decididos depois (2026-10-16)", antes de "Pendente de decisão"). Usei `C36` porque `C31` e `C33` não existem e a última é `C35`.
- **Verificação:** `git diff --stat CONFLITOS.md` = 1 inserção, nenhum outro arquivo tocado (aviso de CRLF do Git é só aviso de checkout).
- **JEV-AI-SUGGESTION:** NAO

### RULES-LOCAL-GLOBAL.11 — Lista dos 18 repositórios do escopo

**Próximo passo:** — (entregue; a pasta de instalação do `dashboard-ai` fica para quem pegar o lote B, que confere qual clone está mais em dia).

- **Nível:** LEVE — levantamento, sem código
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **Descrição:** listar as pastas de `C:\fontes` com Git e remoto no GitHub (fora `DEMAIS-PROJETOS-*`, `scripts` e o próprio `rules-ai`), agrupando os clones do mesmo remoto (1 linha por remoto, com as pastas clones), e propor a divisão em piloto + lotes A, B e C.
- **Critérios de aceitação:** tabela Remoto · Pasta de instalação · Clones · Lote nesta seção; total de remotos confere com a pergunta 4.
- **Entrega:** esta tabela (só esta seção, sem outros arquivos).
- **Verificação:** `git -C <pasta> remote get-url origin` em cada pasta de `C:\fontes` (fora `DEMAIS-PROJETOS-*`, `scripts`, `rules-ai`). Resultado: **19 pastas com remoto GitHub, 7 remotos**. A pergunta 4 diz 18 pastas; a contagem real é 19 (1 a mais). Não alterei a pergunta: o líder decide.
- **Pastas sem remoto (fora da lista, conforme pergunta 4):** `CONFIG-DEEPSEEK`, `assets`, `testes-effort-padaria`.
- **JEV-AI-SUGGESTION:** NAO

| Remoto | Pasta de instalação | Clones | Lote |
|--------|---------------------|--------|------|
| Gelvazio/template-inicial-tasks-ia | template-inicial-tasks-ia | — | **Piloto** (1 pasta; base de projetos, pequena, baixo risco) |
| Gelvazio/aulasenai | aulasenai | aulas-senai-CLAUDE-HAIKU, aulas-senai-CLAUDE-OPUS-LIDER, aulas-senai-CLAUDE-OPUS, aulas-senai-CLAUDE-SONNET | A (5 pastas) |
| Gelvazio/dashboard-ai | **a definir** (proposta: dashboard-ai-claude-code-senai; nenhuma pasta sem sufixo) | dashboard-ai-claude-code-gmail, dashboard-ai-claude-code-hotmail, dashboard-ai-codex, dashboard-ai-deepseek, dashboard-ai-devin, dashboard-ai-gemini, dashboard-ai-kiro-crew, dashboard-ai-qoder (+ a proposta acima) | B (9 pastas) |
| Gelvazio/PLATAFORMA-ENVIO-CURRICULOS | PLATAFORMA-ENVIO-CURRICULOS | — | C (4 pastas, com os 3 abaixo) |
| Gelvazio/rea-app-clones | REA-APP-CLONES | — | C |
| Gelvazio/gerenciador-de-ia | gerenciador-de-ia | — | C |
| Gelvazio/testes-de-frontend | testes-de-frontend | — | C |

Divisão: piloto 1 pasta · lote A 5 · lote B 9 · lote C 4 (total 19). O lote B é o maior por ser o único remoto com 9 pastas; se quiser equilibrar, dá para separar as pastas `dashboard-ai-*` em duas partes, mas isso quebra a regra de um remoto por lote.

### RULES-LOCAL-GLOBAL.12 — Instalador

**Próximo passo:** líder conferir e commitar.

- **Nível:** PESADO — gravação em vários repositórios e gancho de sessão
- **Modelo:** só Opus 5.5+ ou Fable (ou DeepSeek, C35) — nunca outro
- **Effort:** high
- **Descrição:** script no `rules-ai` que, para um repositório, monta `rules-local/` (script + `VERSAO.md` + regras), acrescenta o gancho `SessionStart` ao `.claude/settings.json` sem apagar o que existe e não faz commit (o commit é de quem instala). Idempotente.
- **Critérios de aceitação:** rodar 2 vezes numa cópia não muda nada na segunda; `settings.json` existente preservado.
- **Verificação:** execução numa cópia temporária + `git status --short`.
- **Entrega:** `scripts/instalar-rules-local.mjs` (novo, só este arquivo de código + esta seção;
- **JEV-AI-SUGGESTION:** NAO
  nenhum projeto de `C:\fontes` foi tocado). Commit pelo líder.
- **Verificação (feita por Claude Code (Opus 5.5 · herdr OP-12), 2026-10-18):** `node --check` ok;
  nenhuma linha > 100; funções ≤ 45 linhas. Teste numa pasta temporária da sessão, com um
  `rules-ai` falso (cópia do instalador + `sessao.mjs`/`conferir.mjs`/`aviso-agents.md` falsos,
  porque os reais ainda estão sendo escritos) e 7 repositórios `git init` de teste:
  (1) `settings.json` copiado do `aulasenai` → o `diff` com o original mostra só o item novo no
  fim do `SessionStart` (permissões e os outros ganchos intactos); (2) sem `settings.json` e só com
  `CLAUDE.md` → cria o `settings.json` só com o gancho de F6 e põe o aviso no `CLAUDE.md`;
  (3) `AGENTS.md` com CRLF → bloco gravado em CRLF; (4) bloco antigo no meio do `AGENTS.md` →
  trocado no lugar, resto intacto; gancho já existente (com `rules-local\sessao.mjs`, barra
  invertida) → `settings.json` não muda (mesmo md5); (5) **2ª execução** em 3 repositórios depois
  de um commit, rodando de outra pasta atual (`C:\`) com caminho absoluto → `0 criado, 0
  atualizado, 7 igual`, `git status --short` vazio e saída 0; `.trava` criada à mão fica ignorada;
  `git ls-files --eol` → tudo `i/lf w/lf attr/text eol=lf`; (6) erros com saída 1 e **nada
  gravado**: `settings.json` inválido, marca de início sem a de fim, sem `aviso-agents.md`, sem
  `sessao.mjs` na fonte, pasta sem `.git`, pasta dentro de `DEMAIS-PROJETOS-*`, a própria raiz do
  `rules-ai`, sem argumento; (7) com o `conferir.mjs` real da `.9` e uma `VERSAO.md` falsa →
  "rules-local NÃO íntegro: VERSAO.md corrompida" e saída 1; script da fonte alterado → a nova
  execução mostra `atualizado rules-local/conferir.mjs` (é assim que correção chega aos projetos).
- **Anotação (escolhas onde F6 não detalha; nenhuma muda o contrato):** confere tudo **antes** de
  gravar (erro → nada gravado); só grava arquivo cujo conteúdo muda; os `*.mjs` vão com fim de
  linha LF (igual ao checkout com `eol=lf`); o `settings.json` só é regravado quando o gancho é
  acrescentado, com o recuo, o fim de linha e o BOM que ele já tinha; bloco do aviso sem marcas →
  acrescentado no **fim** do arquivo, depois de uma linha em branco; se o modelo da `.13` já trouxer
  as marcas, elas são tiradas e repostas; recusa a raiz do `rules-ai`, pastas `DEMAIS-PROJETOS-*`
  e pastas sem `.git`; no fim confere a pasta com o `conferirPasta` do próprio `rules-local/` e sai
  com 1 quando não está íntegra (ex.: sem internet), para quem instala ver; não apaga `*.mjs` que
  saiu da fonte. **Depende da `.13`** (`scripts/rules-local/aviso-agents.md`): sem ele o
  instalador para com erro — a `.4` já espera a `.13`.

### RULES-LOCAL-GLOBAL.13 — Aviso no `AGENTS.md`/`CLAUDE.md`

**Próximo passo:** líder conferir e commitar.

- **Nível:** LEVE — só texto
- **Modelo:** só Haiku — nunca outro
- **Effort:** low
- **Descrição:** trecho padrão (curto) para o `AGENTS.md`/`CLAUDE.md` dos projetos, mandando as IAs sem gancho rodarem o comando da `.6` no início da sessão; guardado como modelo no `rules-ai` para o instalador e os lotes usarem.
- **Critérios de aceitação:** texto aponta para `regras/rules-local.md` e traz o comando exato.
- **Entrega:** `scripts/rules-local/aviso-agents.md` (arquivo-modelo, caminho da etapa; aponta para `rules-local/regras/rules-local.md`). Removidos `scripts/modelos/aviso-rules-local.md` e a pasta `scripts/modelos/` (ficou vazia).
- **Verificação:** leitura do arquivo: traz `node rules-local/sessao.mjs` (F6), cita `rules-local/regras/rules-local.md` e a frase-gatilho `DISPARAR A SINCRONIZAÇÃO DE TASKS` (F5); `ls scripts/modelos` dá "No such file" e `scripts/rules-local/` tem o `aviso-agents.md` ao lado dos `.mjs`.
- **JEV-AI-SUGGESTION:** NAO

### RULES-LOCAL-GLOBAL.14 — Instalar no lote A

**Próximo passo:** líder conferir e commitar.

- **Nível:** PESADO — mudança em massa
- **Modelo:** só Opus 5.5+ ou Fable (ou DeepSeek, C35) — nunca outro
- **Effort:** high
- **Descrição:** instalar com o instalador nos repositórios do lote A (lista da `.11`), commit + push em cada um; clones com `git pull --rebase`.
- **Critérios de aceitação:** R4.1 e R4.2 em cada repositório do lote.
- **Verificação:** em cada repositório: script dá "versão igual" e `git status --short` vazio.
- **Entrega (OP-14, 2026-10-18) — `Gelvazio/aulasenai`, instalado em `C:\fontes\aulasenai`:**
- **JEV-AI-SUGGESTION:** NAO
  commit `05b9878d` (push `68f48658..05b9878d`), com `rules-local/` (4 `.mjs`, `.gitattributes`,
  `.gitignore`, `VERSAO.md`, `RELATORIO.md`, `regras/` com 19 arquivos), `.claude/settings.json`
  (gancho de F6 no fim do `SessionStart`; o `inicio-da-sessao.js`, os outros ganchos e as
  permissões intactos) e `AGENTS.md` (bloco `rules-local:inicio/fim` no fim). Nenhuma TASK no
  quadro do projeto (instalação). No `rules-ai`, só esta seção (sem Git).
- **Verificação (OP-14, 2026-10-18):** árvore do `aulasenai` já tinha mudanças de outras sessões
  (`README.md`, `MATERIAIS/…`, `GERADOR-AULAS/…`, `.agents/`, `.codex/`, `tasks/PROMPT_*`…), mas
  nenhuma em `AGENTS.md`, `CLAUDE.md` ou `.claude/settings.json` → instalação liberada;
  `git status --short` guardado antes. `git pull --rebase origin main` trouxe 2 commits do quadro
  (sem arquivo em comum com a árvore suja); o repositório tem `rebase.autoStash=true` no
  `.git/config`, o autostash foi reaplicado sem conflito e o `git status --short` ficou idêntico ao
  de antes (`diff`). Instalador → `6 criado, 2 atualizado`, `VERSÃO NOVA nenhuma ->
  2026-10-18-ef54a693 (19 adicionado)`, `rules-local íntegro`, saída 0. `git diff --cached
  --name-only` = só `rules-local/`, `.claude/settings.json` e `AGENTS.md`. Visualizador
  `.claude/rules/index.html` não regenerado: a regra do projeto só pede ao mudar `.claude/rules/`
  ou encerrar tarefa. **R4.2:** `node rules-local/sessao.mjs` → `versão igual
  (2026-10-18-ef54a693)` (também de `C:\` com caminho absoluto); `git status --short` = o de antes
  (nenhum arquivo da instalação sobrando); `HEAD` = `origin/main`; `git ls-files --eol
  rules-local` → `i/lf w/lf attr/text eol=lf`; 2ª execução do instalador → `0 criado, 0
  atualizado, 7 igual`.
- **Clones (regra 6):** `aulas-senai-CLAUDE-HAIKU`, `aulas-senai-CLAUDE-OPUS` e
  `aulas-senai-CLAUDE-SONNET` estavam limpos → `git pull --rebase origin main` (`b78fb901` →
  `05b9878d`, = `origin/main`), `sessao.mjs` → `versão igual`, `git status --short` vazio.
  `aulas-senai-CLAUDE-OPUS-LIDER` → **clone pulado (árvore suja: `.agents/` e `.codex/` fora do
  Git), recebe no próximo pull**.

### RULES-LOCAL-GLOBAL.15 — Instalar no lote B

**Próximo passo:** líder conferir e commitar.

- **Nível:** PESADO — mudança em massa
- **Modelo:** só Opus 5.5+ ou Fable (ou DeepSeek, C35) — nunca outro
- **Effort:** high
- **Descrição:** como a `.14`, para o lote B.
- **Critérios de aceitação:** R4.1 e R4.2 em cada repositório do lote.
- **Pasta de instalação (escolha do OP-15, 2026-10-18):** `dashboard-ai-codex`. Motivo: depois do
- **JEV-AI-SUGGESTION:** NAO
  `git fetch` nas 9 pastas, foi a **única** com árvore limpa e em dia com `origin/main`
  (`93d93ff`). A proposta da `.11` (`dashboard-ai-claude-code-senai`) estava 7 commits atrás e com
  4 pastas fora do Git (`.codex/`, `.kiro/`, `dashboard-plataformas-de-ia/`, `laya/`) — não mexi.
- **Entrega:** commit `385b9a9` no `Gelvazio/dashboard-ai` (push `93d93ff..385b9a9`, feito da
  pasta `dashboard-ai-codex`), com `rules-local/` (4 `.mjs`, `.gitattributes`, `.gitignore`,
  `VERSAO.md`, `RELATORIO.md`, `regras/` com 19 arquivos), `.claude/settings.json` (gancho de F6
  acrescentado no fim do `SessionStart`, depois do `sincronizar-main.sh`; permissões e os outros
  ganchos intactos) e `AGENTS.md` (bloco `rules-local:inicio/fim` no fim). Nenhuma TASK no quadro
  do projeto (instalação = "sem ajuste — instalação"). No `rules-ai`, só esta seção (sem Git).
- **Verificação (OP-15, 2026-10-18):** `git status --short` ANTES vazio; `git pull --rebase` (já
  em dia); instalador → `6 criado, 2 atualizado`, `VERSÃO NOVA nenhuma -> 2026-10-18-ef54a693
  (19 adicionado)`, `rules-local íntegro`, saída 0; `git diff` revisto (só o item novo no
  `settings.json` e o bloco no `AGENTS.md`); `rules-local/VERSAO.md` = `VERSAO.md` do `rules-ai`
  (`cmp`); `git diff --cached --name-only` = só `rules-local/`, `.claude/settings.json` e
  `AGENTS.md`; hooks `pre-commit`/`pre-push` passaram. **R4.2** depois do push:
  `node rules-local/sessao.mjs` → `versão igual (2026-10-18-ef54a693)`, saída 0; igual rodado de
  `C:\` com caminho absoluto (como o gancho); 2ª execução do instalador → `0 criado, 0 atualizado,
  7 igual`; `git status --short` vazio; `HEAD` = `origin/main`; `git ls-files --eol rules-local`
  → 27 arquivos `i/lf w/lf`.
- **Clones (regra 6: pull só com `git status --short` vazio; nada de stash/reset/checkout):**

| Clone | Árvore | Ação | Resultado |
|---|---|---|---|
| `dashboard-ai-claude-code-hotmail` | limpa | `pull --rebase` | em `385b9a9`; `sessao.mjs` → `versão igual`; status vazio |
| `dashboard-ai-deepseek` | limpa | `pull --rebase` | em `385b9a9`; `sessao.mjs` → `versão igual`; status vazio |
| `dashboard-ai-devin` | limpa | `pull --rebase` | em `385b9a9`; `sessao.mjs` → `versão igual`; status vazio |
| `dashboard-ai-kiro-crew` | limpa | `pull --rebase` | em `385b9a9`; `sessao.mjs` → `versão igual`; status vazio |
| `dashboard-ai-claude-code-senai` | 4 pastas fora do Git (`.codex/`, `.kiro/`, `dashboard-plataformas-de-ia/`, `laya/`) | pulado | clone pulado (árvore suja), recebe no próximo pull |
| `dashboard-ai-qoder` | `M README.md`, `M database/README.md` | pulado | clone pulado (árvore suja), recebe no próximo pull |
| `dashboard-ai-claude-code-gmail` | 3 `.gemini/commands/*.toml` modificados + **conflito `UU public/painel.html`** (10 atrás) | pulado | clone pulado (árvore suja), recebe no próximo pull |
| `dashboard-ai-gemini` | 3 `.gemini/commands/*.toml` modificados + **conflito `UU .claude/settings.json`** (10 atrás) | pulado | clone pulado (árvore suja), recebe no próximo pull |

- **Anotação (para o usuário):** `dashboard-ai-claude-code-gmail` e `dashboard-ai-gemini` estão
  com conflito não resolvido (`UU`) de outra sessão — no `gemini` é no próprio
  `.claude/settings.json`, que a instalação mexe. Quando essas sessões resolverem e
  sincronizarem, o `pull --rebase` traz o `rules-local/` e o gancho; se o conflito do `gemini` for
  resolvido apagando o item novo do gancho, o `rules-local/` funciona pelo aviso do `AGENTS.md`,
  mas o gancho some (rodar o instalador de novo nesse clone devolve).

### RULES-LOCAL-GLOBAL.16 — Instalar no lote C

**Próximo passo:** líder conferir e commitar; `gerenciador-de-ia` fica BLOQUEADO até o usuário
decidir o `AGENTS.md` fora do Git (ver Anotação).

- **Nível:** PESADO — mudança em massa
- **Modelo:** só Opus 5.5+ ou Fable (ou DeepSeek, C35) — nunca outro
- **Effort:** high
- **Descrição:** como a `.14`, para o lote C.
- **Critérios de aceitação:** R4.1 e R4.2 em cada repositório do lote.
- **Entrega (Claude Code (Opus 5.5 · herdr OP-16), 2026-10-18):** 3 de 4 repositórios, cada um
- **JEV-AI-SUGGESTION:** NAO
  com `rules-local/` (4 `.mjs`, `.gitattributes`, `.gitignore`, `VERSAO.md`, `RELATORIO.md`,
  `regras/` com 19), `.claude/settings.json` e `AGENTS.md` (bloco `rules-local:inicio/fim` no fim):

| Repositório (pasta) | Commit / push | R4.2 | Clones |
|---|---|---|---|
| `Gelvazio/PLATAFORMA-ENVIO-CURRICULOS` | `c40785f` (`3d56a02..c40785f`); `.claude/settings.json` **criado** (não existia) | ✅ `versão igual (2026-10-18-ef54a693)`, `git status --short` vazio (já estava vazio antes) | — (sem clones) |
| `Gelvazio/rea-app-clones` (`REA-APP-CLONES`) | `011b77f` (`ca6a9a6..011b77f`); gancho acrescentado no fim do `SessionStart` | ✅ `versão igual`; `git status --short` **igual ao de antes** (graphify-out, `Usersgelva.claude-contaC/`, `tasks/PROMPT_FINANCEIRO.md` de outra sessão, intactos) | — |
| `Gelvazio/testes-de-frontend` | `bd5ab7f` (`dfd32ae..bd5ab7f`); gancho acrescentado no fim do `SessionStart` | ✅ `versão igual`; `git status --short` **igual ao de antes** (mudanças de outra sessão em `aulas/` e `projetos-alunos/`, intactas) | — |
| `Gelvazio/gerenciador-de-ia` | ⛔ **não instalado** | — | — |

- **Verificação:** antes de cada um, `git status --short` guardado e `git fetch` (os 4 em `0 0`
  com `origin/main`); `git pull --rebase origin main` → "Already up to date"; instalador rodado do
  `rules-ai` → `VERSÃO NOVA nenhuma -> 2026-10-18-ef54a693 (19 adicionado)`, `rules-local
  íntegro`, saída 0; `git diff` do `settings.json` só com o item novo e do `AGENTS.md` só com o
  bloco; `git diff --cached --name-only` = 27 de `rules-local/` + `.claude/settings.json` +
  `AGENTS.md` (29); push sem recusa do `pre-push`; depois: `node rules-local/sessao.mjs` →
  `versão igual (2026-10-18-ef54a693); nada a fazer.`, `HEAD` = `origin/main`,
  `rules-local/VERSAO.md` = `VERSAO.md` do `rules-ai` (`cmp`), `git ls-files --eol rules-local` →
  27 `i/lf w/lf`. Nenhuma TASK criada nos quadros (instalação = "sem ajuste — instalação").
- **Anotação — `gerenciador-de-ia` BLOQUEADO:** o `AGENTS.md` está **fora do Git** (`?? AGENTS.md`,
  gravado em 2026-10-17 20:36, diferente do `CLAUDE.md` versionado) — mudança de outra sessão
  num arquivo que o instalador toca (ele põe o aviso no `AGENTS.md` quando existe). O projeto
  também tem a regra "uma sessão por vez" (`CLAUDE.md` §10; sem `tasks/.sessao-ativa` agora).
  Destrava: o usuário (ou a sessão dona) versionar ou apagar esse `AGENTS.md`; depois rodar o
  instalador e o mesmo fluxo acima.

### RULES-LOCAL-GLOBAL.17 — Instalar no `gerenciador-de-ia`

**Próximo passo:** líder conferir e commitar.

- **Nível:** PESADO — mudança em repositório de outro projeto (mesmo motivo dos lotes)
- **Modelo:** só Opus 5.5+ ou Fable (ou DeepSeek, C35) — nunca outro
- **Effort:** high
- **Descrição:** criada em 2026-10-18 12:10 (C26) pelo líder: o lote C (`.16`) instalou em 3 de 4
- **JEV-AI-SUGGESTION:** NAO
  repositórios; o `gerenciador-de-ia` tem um `AGENTS.md` fora do Git, de outra sessão
  (2026-10-17 20:36), e o instalador escreveria nele.
- **Critérios de aceitação:** R4.1 e R4.2 no `gerenciador-de-ia`.
- **Verificação:** como a `.16`.
- **Entrega (Claude Code (Opus 5.5 · herdr OP-19), 2026-10-18):** commit `290d5e4` no
  `Gelvazio/gerenciador-de-ia` (push `95a0ccb..290d5e4`), com `rules-local/` (4 `.mjs`,
  `.gitattributes`, `.gitignore`, `VERSAO.md`, `RELATORIO.md`, `regras/` com 19),
  `.claude/settings.json` **criado** (não existia; só o gancho `SessionStart`) e `CLAUDE.md`
  (bloco `rules-local:inicio/fim` no fim; sem `AGENTS.md` desde a `.19`). Sem clones. No
  `rules-ai`, só esta seção (sem Git). Trava `tasks/.sessao-ativa` gravada no início da `.19`,
  regravada na `.17` e apagada ao terminar.
- **Verificação (feita):** antes: `git status --short` vazio, `git fetch` → `0 0` com
  `origin/main`, `git pull --rebase` → "Already up to date"; instalador rodado do `rules-ai` →
  `7 criado, 1 atualizado`, `VERSÃO NOVA nenhuma -> 2026-10-18-f4bfe8d8 (19 adicionado)` (versão
  mais nova que a dos lotes, `ef54a693`, como previa a Anotação (5) da `.4`; o aviso já sai com
  `rules-local/regras/rules-local.md`, da `.18`), `rules-local íntegro`, saída 0; `git diff` do
  `CLAUDE.md` só com o bloco; `git diff --cached --name-only` = 27 de `rules-local/` +
  `.claude/settings.json` + `CLAUDE.md` (29); push sem recusa. Depois: `node rules-local/sessao.mjs`
  → `versão igual (2026-10-18-f4bfe8d8); nada a fazer.` (também rodado de `C:\` com caminho
  absoluto); `git status --short` vazio (R4.2); `HEAD` = `origin/main` (`290d5e4`);
  `rules-local/VERSAO.md` = `VERSAO.md` do `rules-ai` (`cmp`); `git ls-files --eol rules-local` →
  27 `i/lf w/lf`; 2ª execução do instalador → nada muda. R4.1: `gerenciador-de-ia` agora tem
  `rules-local/`. Nenhuma TASK criada no quadro (instalação = "sem ajuste — instalação").

### RULES-LOCAL-GLOBAL.18 — Caminho certo da regra no aviso do `sessao.mjs`

**Próximo passo:** líder conferir e commitar; depois reinstalar nos repositórios já instalados
(o instalador roda de novo; esta subtarefa não reinstalou nada).

- **Nível:** MEDIO — ajuste de texto em 1 arquivo JS, com reinstalação depois
- **Modelo:** só Sonnet — nunca outro
- **Effort:** medium
- **Descrição:** criada em 2026-10-18 12:10 (C26) pelo líder: o aviso impresso diz
- **JEV-AI-SUGGESTION:** NAO
  `(regras/rules-local.md)`, mas nos projetos a regra fica em `rules-local/regras/rules-local.md`
  (anotado pelo OP-4 no piloto). A cópia do script nos 7 repositórios instalados só muda quando o
  instalador rodar de novo neles.
- **Critérios de aceitação:** o aviso cita `rules-local/regras/rules-local.md`; `node --check`.
- **Verificação:** rodar o `sessao.mjs` numa cópia com versão diferente e ler o aviso.
- **Entrega:** `scripts/rules-local/sessao.mjs` linha 351 (aviso agora cita
  `rules-local/regras/rules-local.md`, quebrado em 2 linhas para caber em 100 colunas; lógica
  intacta). Era o único texto do script com esse caminho. Reinstalação nos 7 repositórios fica
  para o líder.
- **Verificação (feita):** `node --check scripts/rules-local/sessao.mjs` → OK; `grep` confirma só
  o caminho novo no script. Não rodei o script numa cópia com versão diferente (leitura apenas).

### RULES-LOCAL-GLOBAL.19 — Tirar o `AGENTS.md` solto do `gerenciador-de-ia`

**Próximo passo:** líder conferir e commitar.

- **Nível:** PESADO — remove arquivo de outro projeto (apagar dados)
- **Modelo:** só Opus 5.5+ ou Fable (ou DeepSeek, C35) — nunca outro
- **Effort:** high
- **Descrição:** criada em 2026-10-18 12:15 pelo líder, a pedido do usuário ("FACA A SUA SUGESTAO -> CRIE 1
- **JEV-AI-SUGGESTION:** NAO
  SUB-TAREFA PRA RESOLVER O PROBLEMA"). O `C:\fontes\gerenciador-de-ia\AGENTS.md` (fora do Git,
  2026-10-17 20:36) é uma cópia do `CLAUDE.md` versionado em que "Claude Code" virou "Codex" por
  troca cega: links quebrados (`.Codex/rules/tasks/...`), frente e tabela de níveis erradas. As
  regras valem no `CLAUDE.md`. Sugestão aprovada: guardar cópia em
  `C:\Users\gelva\.claude\backups\gerenciador-de-ia-AGENTS.md-2026-10-18.md`, remover o arquivo
  da pasta e respeitar a trava `tasks/.sessao-ativa` do projeto (seção 10 do `CLAUDE.md`).
  Sem `AGENTS.md`, o instalador da `.17` põe o aviso no `CLAUDE.md` (F6).
- **Critérios de aceitação:** cópia de segurança idêntica (mesmo hash); `git status --short` do
  projeto sem `?? AGENTS.md`; nenhum outro arquivo do projeto alterado.
- **Verificação:** `sha256sum` da cópia = do original antes de remover; `git status --short`.
- **Entrega (Claude Code (Opus 5.5 · herdr OP-19), 2026-10-18 15:16):** cópia em
  `C:\Users\gelva\.claude\backups\gerenciador-de-ia-AGENTS.md-2026-10-18.md` (pasta `backups`
  criada); `C:\fontes\gerenciador-de-ia\AGENTS.md` removido. Nenhum arquivo versionado mudou
  (sem commit no projeto). Trava `tasks/.sessao-ativa` gravada ao começar (não havia trava).
- **Verificação (feita):** `diff CLAUDE.md AGENTS.md` → só 10 trechos, todos troca cega
  (`CLAUDE.md`→`AGENTS.md` no título e na linha 4, "Claude Code"→"Codex" nas linhas 27, 94 e 232,
  `.claude/rules/`→`.Codex/rules/` nos 5 links das linhas 219–227); o resto idêntico (262 linhas
  cada, inclusive a §10). `sha256sum` original = cópia =
  `8e58cc9b3386816499a8dcd5cefd4b5c989233f7ec4fe9c8d40bab8fa59ebad7` e `cmp` sem diferença;
  depois do `rm`, `git status --short` vazio (saída 0).

### RULES-LOCAL-GLOBAL.20 — Instalar no `testes-effort-padaria`

**Próximo passo:** líder conferir e commitar.

- **Nível:** PESADO — mudança em repositório de outro projeto (mesmo motivo dos lotes)
- **Modelo:** só Opus 5.5+ ou Fable (ou DeepSeek, C35) — nunca outro
- **Effort:** high
- **Descrição:** criada em 2026-10-18 12:24 a pedido do usuário ("sim"): o `testes-effort-padaria` ganhou o
- **JEV-AI-SUGGESTION:** NAO
  remoto `Gelvazio/testes-effort-padaria` (commit `abf0b11`) e entrou no escopo da pergunta 4
  (só repositórios com GitHub). A tarefa-mãe foi reaberta para esta subtarefa.
- **Critérios de aceitação:** R4.1 e R4.2 no `testes-effort-padaria`.
- **Verificação:** como a `.16`.
- **Entrega (Claude Code (Opus 5.5 · herdr OP-20), 2026-10-18):** commit `5721e22` no
  `Gelvazio/testes-effort-padaria` (push `abf0b11..5721e22`), com `rules-local/` (4 `.mjs`,
  `.gitattributes`, `.gitignore`, `VERSAO.md`, `RELATORIO.md`, `regras/` com 19),
  `.claude/settings.json` **criado** (não existia; só o gancho `SessionStart`) e `AGENTS.md`
  (bloco `rules-local:inicio/fim` no fim). Sem clones. O projeto não tem `tasks/` nem hooks Git
  próprios. No `rules-ai`, só esta seção (sem Git).
- **Verificação (feita):** antes: `git status --short` vazio, `git fetch` → `0 0` com
  `origin/main`, `git pull --rebase` → "Already up to date"; instalador rodado do `rules-ai` →
  `7 criado, 1 atualizado`, `VERSÃO NOVA nenhuma -> 2026-10-18-f4bfe8d8 (19 adicionado)`,
  `rules-local íntegro`, saída 0; `git diff` do `AGENTS.md` só com o bloco; `git diff --cached
  --name-only` = 27 de `rules-local/` + `.claude/settings.json` + `AGENTS.md` (29); push sem
  recusa. Depois: `node rules-local/sessao.mjs` → `versão igual (2026-10-18-f4bfe8d8); nada a
  fazer.` (também rodado de `C:\` com caminho absoluto); `git status --short` vazio (R4.2);
  `HEAD` = `origin/main` (`5721e22`); `rules-local/VERSAO.md` = `VERSAO.md` do `rules-ai`
  (`cmp`); `git ls-files --eol rules-local` → 27 `i/lf w/lf`; 2ª execução do instalador → nada
  muda. R4.1: `testes-effort-padaria` agora tem `rules-local/`. Nenhuma TASK criada
  (instalação = "sem ajuste — instalação"; o projeto nem tem quadro).

### RULES-LOCAL-GLOBAL.5 — Levar a regra nova às IAs (`--aplicar`)

**Próximo passo:** — (feito pelo usuário em 2026-10-18).

- **Verificação:** `rules-local` presente no `dist/REGRAS-GLOBAIS.md`, no `~/.gemini/GEMINI.md` e no `~/.codex/AGENTS.md` (23 ocorrências cada); `~/.claude` e `~/.claude-contaC` importam o `dist/`.
- **JEV-AI-SUGGESTION:** NAO

- **Nível:** —
- **Modelo:** Usuário
- **Effort:** low
