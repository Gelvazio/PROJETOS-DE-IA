# DeepSeek na integração do rules-ai

Este documento explica, em linguagem simples, como a integração com a API da DeepSeek funciona,
como ligar, desligar e rotacionar a chave e como ler a auditoria. Ele descreve o que o código faz
hoje (arquivos em `scripts/deepseek/`). Etapa: 045, subtarefa INTEGRACAO-DEEPSEEK.5.

## O que é

- A API da DeepSeek pode ser usada **só para tarefas LEVE e MEDIO**.
- Tarefa **PESADO nunca** chama a DeepSeek. Hoje o código não tem nenhuma forma de liberar
  PESADO: qualquer pedido PESADO volta com o motivo `pesado-sem-liberacao` e a API não é chamada.
  Liberar PESADO exige mudança no código, decidida pelo usuário.
- O **nível continua vindo do quadro**. A integração não muda nível, status, reserva nem a matriz
  `regras/niveis-e-modelos.md`.
- Modelos escolhidos pelo roteador (`scripts/deepseek/roteador.mjs`):
  - `LEVE` → `deepseek-flash`, sem raciocínio;
  - `MEDIO` → `deepseek-flash` com raciocínio ligado.
- **Ainda não há ponto de entrada no fluxo do quadro.** Nenhuma skill, gancho ou script chama
  o roteador hoje. Ele é um módulo com a função `rotearChamada`, pronto para ser chamado por quem
  precisar.
- Em qualquer falha, ou quando uma regra barra a chamada, a sessão **segue com o modelo da matriz**.
  Nada bloqueia a sessão.

## Como ligar

1. Crie a chave no painel da DeepSeek.
2. Defina a variável `DEEPSEEK_API_KEY` **no ambiente do sistema** (no Windows: Variáveis de
   ambiente do usuário; na nuvem: configurações do ambiente).
3. Não coloque a chave em nenhum arquivo do projeto, nem em `.env`. O código lê a chave só de
   `process.env` e **não carrega arquivo `.env` sozinho**.

Sem `DEEPSEEK_API_KEY`, a API não é chamada e a auditoria registra o motivo `sem-chave`.

## Variáveis

| Variável | Padrão | O que faz | Onde o código lê |
|---|---|---|---|
| `DEEPSEEK_API_KEY` | (nenhum) | A chave da API. Sem ela, nada é chamado. | `cliente.mjs`, em `chamarDeepseek` |
| `DEEPSEEK_MODO` | ligado (vazio) | Com o valor `off` (sem diferenciar maiúsculas), a DeepSeek fica desligada. | `limites.mjs`, em `estaDesligada`; usado também por `cliente.mjs` e `roteador.mjs` |
| `DEEPSEEK_MAX_CUSTO_DIA` | 2 | Teto de custo do dia, em dólares. Aceita decimal (ex.: `1.5`). Quando o custo somado do dia chega a esse valor, as chamadas param. | `limites.mjs` (`lerLimites`); usado em `roteador.mjs` e em `auditoria.mjs` (`lerTetoDiario`) |
| `DEEPSEEK_MAX_TOKENS` | 2000 | Teto de tokens. Vale para a resposta (`max_tokens`) e para a entrada estimada: uma entrada acima do teto é barrada (motivo `limite-tokens`). A estimativa é de 1 token para cada 3 caracteres. Aceita só número inteiro. | `limites.mjs` (`lerLimites`); `cliente.mjs` (corpo enviado); `roteador.mjs` (entrada) |
| `DEEPSEEK_TIMEOUT_MS` | 30000 | Tempo máximo de cada chamada, em milissegundos. Passou disso, o cliente cancela a requisição. Aceita só número inteiro. | `limites.mjs` (`lerLimites`); `cliente.mjs` (cancelamento do envio); `roteador.mjs` (limite geral, com 2 segundos de folga a mais) |

- Valor vazio, texto, zero, negativo ou com sufixo (ex.: `2abc`, `1e3`) **volta ao padrão**. Um
  valor inválido nunca zera um limite.
- O custo do dia é uma **estimativa**: o código usa o preço fixo de US$ 0,28 por milhão de tokens
  de entrada e US$ 0,42 por milhão de tokens de saída. Confira sempre na fatura da DeepSeek.

## Como desligar

- **Sem apagar código:** defina `DEEPSEEK_MODO=off` no ambiente. Nenhuma chamada é feita, e a
  auditoria registra `desligado`. Para voltar, apague a variável ou deixe-a vazia.
- **Sem chave:** apague `DEEPSEEK_API_KEY`. A auditoria registra `sem-chave`.

## Como rotacionar a chave

1. No painel da DeepSeek, gere uma **nova** chave.
2. Troque o valor de `DEEPSEEK_API_KEY` no ambiente do sistema (no PC e, se usar, na nuvem).
3. No painel da DeepSeek, **apague a chave antiga**.
4. Nunca cole a chave em arquivo, em commit, em conversa ou em log.

## Como ler a auditoria

- Arquivo: `scripts/deepseek/saidas/auditoria-AAAA-MM.jsonl`, um por mês. A pasta `saidas/` fica
  fora do Git (está no `.gitignore`).
- Cada linha é um JSON, uma tentativa de chamada. Campos:
  - `data` (instante, ISO) e `dia` (AAAA-MM-DD, usado no teto diário);
  - `nivel`, `modelo` e `raciocinio`;
  - `tokensEntrada` e `tokensSaida`;
  - `custoUsd` (estimado);
  - `acao`: `usada`, `fallback` ou `bloqueada`;
  - `motivo` (vazio quando a chamada deu certo).
- **Nunca há texto da mensagem, resposta ou chave.**
- Significado das ações:
  - `usada`: a DeepSeek respondeu;
  - `fallback`: a DeepSeek estava desligada ou não respondeu; a matriz segue;
  - `bloqueada`: a chamada foi barrada antes de ir à API.

## Motivos de fallback

| Motivo | Quando acontece | Ação na auditoria |
|---|---|---|
| `pesado-sem-liberacao` | Nível PESADO | `bloqueada` |
| `nivel-invalido` | Nível que não é LEVE nem MEDIO | `bloqueada` |
| `desligado` | `DEEPSEEK_MODO=off` | `fallback` |
| `limite-tokens` | Entrada estimada acima de `DEEPSEEK_MAX_TOKENS` | `bloqueada` |
| `limite-diario` | Custo do dia chegou a `DEEPSEEK_MAX_CUSTO_DIA` | `bloqueada` |
| `auditoria-ilegivel` | O arquivo da auditoria existe mas não pode ser lido | `bloqueada` |
| `timeout` | A chamada passou de `DEEPSEEK_TIMEOUT_MS` | `fallback` |
| `sem-chave` | `DEEPSEEK_API_KEY` vazia ou ausente | `fallback` |
| `chave-recusada` | A API respondeu 401 ou 403 | `fallback` |
| `limite-de-taxa` | A API respondeu 429 | `fallback` |
| `servidor` | A API respondeu 5xx | `fallback` |
| `requisicao` | A API respondeu outro 4xx | `fallback` |
| `rede` | Falha de rede | `fallback` |
| `resposta-invalida` | A resposta veio sem o formato esperado | `fallback` |

- A ordem das barreiras é: PESADO, nível inválido, `DEEPSEEK_MODO=off`, entrada grande demais,
  custo do dia. Só depois disso a API é chamada.
- Se o limite geral de tempo estourar (cerca de 2 segundos depois de `DEEPSEEK_TIMEOUT_MS`), a
  sessão segue com a matriz e **nenhuma linha é gravada**.
- Erro interno do roteador também não grava linha; a sessão segue com a matriz.

## O que ainda não foi testado

- **Nenhuma chamada real à API** foi feita. Os testes da etapa usaram uma função de envio falsa.
- O nome do campo que liga o raciocínio (`thinking: {type: "enabled"}`, em `montarCorpo` de
  `cliente.mjs`) não foi confirmado na documentação pública. Confirme na primeira chamada real.
- Os preços usados na estimativa de custo devem ser conferidos com a fatura.
- Se a gravação da auditoria falhar sempre (por exemplo, disco cheio), o teto diário não é
  percebido.
