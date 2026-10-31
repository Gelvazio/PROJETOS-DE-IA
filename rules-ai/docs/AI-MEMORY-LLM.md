# AI-MEMORY-INTEGRATION.29: TypeSafe serve como LLM generativo para o ai-memory?

**Data da pesquisa:** 2026-10-23
**Subtarefa:** AI-MEMORY-INTEGRATION.29 (nível LEVE)
**Escopo:** só documentação pública. Nenhuma chamada à API com a chave
`TYPESAFE_API_KEY`, nenhuma alteração no ai-memory, no quadro (`tasks/`) ou no Git.

## Conclusão

**NÃO SERVE** como provedor de consolidação LLM do ai-memory. O TypeSafe (Jev) devolve
decisões tipadas (choice, score, noul), não texto, e não documenta endpoint de chat,
completions nem compatibilidade OpenAI ou Anthropic.

## 1. O que o ai-memory exige de um provedor

Evidência local em `C:\fontes\ai-memory`:

- **Endpoint de chat obrigatório.** Todo provedor de chat implementa `LlmProvider`
  (`crates\ai-memory-llm\src\provider.rs`), com `complete` (chat) e
  `complete_structured_raw` (saída com JSON schema).
- **JSON schema obrigatório para saída estruturada.** Regra 7 de invariantes
  (`docs\ARCHITECTURE.md`, linha 1047): "JSON-schema structured outputs only" e
  "no XML or wrapper libraries". A consolidação e o "dream pass" usam JSON schema
  (`docs\ARCHITECTURE.md`, linhas 633 e 329-330).
- **Dialetos HTTP.** `anthropic.rs` usa `POST {base}/v1/messages`. `openai_compat.rs` usa
  `POST {base}/v1/chat/completions` com `response_format=json_schema` no modo estrito
  (`AI_MEMORY_LLM_COMPAT_STRICT`, padrão true). Sem `response_format` aceito, há
  fallback para parser tolerante de JSON em prosa.
- **Base URL configurável.** `AI_MEMORY_LLM_BASE_URL` é obrigatória para `openai-compat`
  (`docs\ARCHITECTURE.md`, linhas 1464 e 1532).
- **Embeddings são outro caminho.** `AI_MEMORY_EMBEDDING_PROVIDER` aceita `openai`,
  `voyage`, `google`, `gemini`, `openai-compat` ou `copilot` (linha 1597). Não é o
  caso do TypeSafe, que não documenta embeddings.

## 2. O TypeSafe tem modelo generativo compatível?

**Evidência a favor:** nenhuma encontrada.

**Evidência contra:**

- `https://typesafe.ai` (lido em 2026-10-23): o Jev é apresentado como "System One
  Model" em acesso antecipado. Diz que o modelo "returns typed decisions with calibrated
  probabilities" e que a empresa segue "not chat". Não lista endpoints de chat.
- `https://docs.typesafe.ai/introduction` (lido em 2026-10-23): o fluxo é estado mais
  perguntas tipadas em uma requisição. Tipos: **Choice** (`choice`, `probabilities`,
  `confidence`), **Score** (`score`, `probabilities`, `confidence`) e **Noul** (valor
  de 0 a 1). Diz que "o modelo não gera texto livre". Não há endpoint de
  chat/completions nem de mensagens.
- Compatibilidade com OpenAI ou Anthropic: **não confirmado**, e a documentação lida não
  menciona. Não há base URL ou formato de corpo documentado.
- Saída em JSON schema: **não confirmada**. A página fala em "typed outputs", que são
  tipos fixos de pergunta, não um schema livre fornecido pelo cliente.
- Busca pública (WebSearch) por "TypeSafe AI API chat completions" não trouxe nenhuma
  documentação do TypeSafe, só de OpenAI, Mistral e outros.
- Config local `C:\fontes\rules-ai\scripts\jev\config.mjs` e `cliente.mjs` usam
  `POST {url}/v1/systemone` com `{state, model, questions}`, e a resposta traz
  `answers`, `usage` e `model`. Isso confirma a API do Jev para perguntas fechadas,
  coerente com a documentação pública. Não confirmei a referência completa do endpoint
  nem o formato de autenticação na página pública.

## 3. Preço, limites e política de dados

**Preço (confirmado na home, `https://typesafe.ai`):** US$ 42 por bilhão de tokens de
entrada, equivalente a US$ 0,042 por milhão. Coincide com
`PRECO_USD_POR_MILHAO_ENTRADA = 0.042` em `scripts\jev\config.mjs`. A saída não é
cobrada, segundo a configuração local. A home diz que o preço é "238x" menor que o do
Claude Fable 5.1. Não confirmei se o preço é promocional.

**Limites (rate limits, tamanho de contexto, cota):** **não confirmado**. Não aparece
em nenhuma página lida. A configuração local usa `JEV_MAX_TOKENS` com padrão de 1 milhão
de tokens por rodada, decisão local e não limite do fornecedor.

**Política de dados (`https://typesafe.ai/legal/privacy-policy`, lida em 2026-10-23):**

- Não treina nem faz fine-tuning com os Inputs (prompts, dados e instruções).
- Os dados são mantidos "pelo tempo razoavelmente necessário" para prestar o serviço,
  sem prazo fixo. Exclusão sob solicitação.
- Hospedagem nos Estados Unidos. Transferência de usuários do EEE e do Reino Unido para
  os EUA.
- Compartilha com afiliadas, fornecedores e prestadores de serviço, com parceiros de
  análise (cita Google Analytics), com autoridades e em fusões ou venda de ativos.
- **Não confirmado:** prazo de retenção específico da API, retenção de logs de uso,
  retenção de outputs, lista de subprocessadores, DPA, residência de dados fora dos EUA.
- A página tem datas inconsistentes (publicada em "Oct 19, 2026", atualizada em
  "Nov 19, 2025"). Vale conferir com o fornecedor antes de enviar dados de sessão.

## 4. Análise

| Critério do ai-memory | TypeSafe (Jev) | Situação |
|---|---|---|
| Endpoint de chat/completions | não documentado | NÃO SERVE |
| Mensagens (`/v1/messages`) | não documentado | NÃO SERVE |
| Compatível com OpenAI (`openai-compat`) | não confirmado | não confirmado |
| Saída em JSON schema livre | não; saída em tipos fixos | NÃO SERVE |
| Embeddings | não documentado | não confirmado |
| Texto livre para consolidar páginas | não ("não gera texto livre") | NÃO SERVE |
| Preço barato | US$ 0,042 por milhão de entrada | a favor |
| Não treina com inputs | sim, segundo a política | a favor |

**Por que não é INCONCLUSIVO:** o critério central do ai-memory é gerar texto
estruturado com JSON schema, e a documentação pública do TypeSafe diz que o modelo não
gera texto livre. Mesmo que exista uma API de chat fora da documentação pública, a
consolidação não funcionaria com o produto descrito. Os pontos "não confirmado" são
secundários (limites, DPA, retenção de logs).

**Uso possível (fora do escopo da pergunta):** o Jev serve para classificação de
subtarefas e de mensagens (perguntas fechadas), que é o uso já implantado em
`scripts\jev\`. Não serve para consolidação de memória, resumo nem reescrita de páginas.

## 5. O que falta confirmar (se a decisão mudar)

1. Se o TypeSafe publica uma API de chat/completions ou de mensagens (qualquer
   dialeto), com URL, cabeçalhos e corpo. Confirmar em `docs.typesafe.ai/llms.txt`.
2. Se há saída em JSON schema livre, e não só tipos fixos.
3. Limites de taxa e de tokens por requisição e por minuto.
4. Retenção de logs e de outputs da API, DPA e lista de subprocessadores.
5. Se o preço de US$ 0,042 por milhão é permanente.

## Linha para o campo Verificação

Pesquisa pública em 2026-10-23 (typesafe.ai, docs.typesafe.ai/introduction, política de
privacidade): sem endpoint de chat e sem saída de texto livre; ai-memory exige chat com
JSON schema (ai-memory-llm/src/provider.rs e openai_compat.rs). Conclusão: NÃO SERVE.
Chave não usada, nenhuma chamada à API.
