## Etapa 004 — ANALISES-JSON: script que lê C:\fontes e gera analises.json

**Tarefa:** ANALISES-JSON · **Pedido em:** 2026-11-03 · **Criada por:** Devin (SWE-2 Max) (local · main)
**Pedido:** "CRIE 1 ARQUIVO EM PYTHON QUE LEIA TUDO AQUI DA PASTA exceto rules-ai e aulasenai, e
coloque num arquivo de nome analises.json, deve conter tudo pra ia gerar 1 analise de tudo e fazer
uma melhor organizacao depois"
**Objetivo:** um script `analises.py` na raiz que varre `C:\fontes` (exceto `rules-ai`,
`aulasenai` e `ai-memory`, pedido do usuário; e `DEMAIS-PROJETOS-NAO-MEXER-AGORA`, proibida pela
regra C23) e grava `analises.json` com árvore de diretórios, metadados e conteúdo dos arquivos de
texto — material para uma IA analisar tudo e planejar uma organização melhor.

### Escopo
- **Entra:** `analises.py` na raiz; `analises.json` gerado por ele; leitura de todos os arquivos de
  texto da raiz, `COORDENACAO-DE-PROJETOS`, `plugins`, `sistemafinanceiro` e `tasks`.
- **Não entra:** `rules-ai`, `aulasenai`, `ai-memory`, `DEMAIS-PROJETOS-*` (C23), `.git`, `node_modules`,
  `dist`, `__pycache__`, `graphify-out`, `output` do AutoSwarm e o pacote vendored
  `autoswarm-v1.0.0` (só contam e pesam no resumo); segredos (`.env*`, `*.key`, `*.pem`,
  `config-de-tarefa-agendada.txt`, `variaveis.js`) têm o conteúdo omitido; binários só com
  metadados.

### Subtarefas

### ANALISES-JSON.1 — Criar analises.py, rodar e validar analises.json
- **Nível:** PESADO — classificado (Jev sugeriu MEDIO 0,94; matriz decidiu PESADO · effort xhigh)
- **Modelo:** Devin (SWE-2 High Lightning) — executando
- **Descrição:** script Python único que percorre a raiz, respeita as exclusões, lê textos (UTF-8,
  fallback latin-1), trunca arquivos grandes, gera árvore + resumo por pasta e grava o JSON.
- **Critérios de Aceitação:** `python analises.py` gera `analises.json` válido; nenhum caminho de
  `rules-ai`, `aulasenai` ou `DEMAIS-PROJETOS-*` no JSON; nenhum conteúdo de segredo; binários só
  com metadados.
- **Verificação:** rodar o script e conferir o JSON (contagens, exclusões, campos).
