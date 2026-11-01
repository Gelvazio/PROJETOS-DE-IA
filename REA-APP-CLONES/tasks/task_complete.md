# ✅ Concluídas — REA APP CLONES

> Tarefas e subtarefas **concluídas**. O quadro [`STATUS.md`](STATUS.md) só tem o que está aberto ou em
> andamento: toda linha que vira ✅ é **recortada** de lá e colada no fim da tabela abaixo, no mesmo commit da
> entrega (regra em [`quadro.md`](../.claude/rules/tasks/quadro.md)). Entrega e verificação de cada uma ficam
> na etapa (coluna "Etapa"). Reabrir = mover a linha de volta ao `STATUS.md`.

## ✅ Concluídas

| Tarefa | Título | Prioridade | Modelo | Depende de | Status | Em uso por | Etapa |
|---|---|---|---|---|---|---|---|
| REPO | **Iniciar o repositório Git** | 🟠 Alta | — | Nenhuma | ✅ Concluído | — (não reservável) | [ETAPA-001](etapas/ETAPA-001-0fb937e7-INICIAR-REPO.md) |
| REPO.1 | Iniciar o Git na `main` com `.gitignore` e quadro | 🟠 Alta | — | Nenhuma | ✅ Concluído | — | [ETAPA-001](etapas/ETAPA-001-0fb937e7-INICIAR-REPO.md) |
| GHIDRA.1 | Extrair o Ghidra 12.1.4 em `tools/ghidra` | 🟠 Alta | — | Nenhuma | ✅ Concluído | — | [ETAPA-002](etapas/ETAPA-002-b1069931-GHIDRA.md) |
| GHIDRA.2 | Criar a variável de usuário `GHIDRA_INSTALL_DIR` | 🟠 Alta | — | GHIDRA.1 | ✅ Concluído | — | [ETAPA-002](etapas/ETAPA-002-b1069931-GHIDRA.md) |
| GHIDRA.3 | Decidir se `tools/` vai para o Git (decisão: fica fora, por enquanto) | 🟠 Alta | — | GHIDRA.1 | ✅ Concluído | — | [ETAPA-002](etapas/ETAPA-002-b1069931-GHIDRA.md) |
| TEMPLATE.1 | Alinhar o histórico local ao `origin/main` (rebase) | 🟠 Alta | — | Nenhuma | ✅ Concluído | — | [ETAPA-003](etapas/ETAPA-003-14b8cb75-TEMPLATE.md) |
| TEMPLATE.4 | Migrar o `STATUS.md` antigo da raiz para `tasks/` | 🟠 Alta | — | Nenhuma | ✅ Concluído | — | [ETAPA-003](etapas/ETAPA-003-14b8cb75-TEMPLATE.md) |
| TEMPLATE.2 | Copiar os arquivos versionados do template | 🟠 Alta | — | TEMPLATE.1 | ✅ Concluído | — | [ETAPA-003](etapas/ETAPA-003-14b8cb75-TEMPLATE.md) |
| TEMPLATE.3 | Adaptar o template a este projeto | 🟠 Alta | — | TEMPLATE.2 | ✅ Concluído | — | [ETAPA-003](etapas/ETAPA-003-14b8cb75-TEMPLATE.md) |
| TEMPLATE.5 | Instalar os hooks do Git neste clone | 🟠 Alta | — | TEMPLATE.2 | ✅ Concluído | — | [ETAPA-003](etapas/ETAPA-003-14b8cb75-TEMPLATE.md) |
| IGNORE | **Ignorar o executável analisado em `apps-to-be-clone/`** | 🟡 Média | — | Nenhuma | ✅ Concluído | — (não reservável) | [ETAPA-004](etapas/ETAPA-004-c5c1b50f-IGNORE-APPS.md) |
| IGNORE.1 | Pôr os binários de `apps-to-be-clone/` no `.gitignore` | 🟡 Média | — | Nenhuma | ✅ Concluído | — | [ETAPA-004](etapas/ETAPA-004-c5c1b50f-IGNORE-APPS.md) |
| TEMPLATE.6 | Aceite do usuário | 🟠 Alta | — | TEMPLATE.5 | ✅ Concluído | — | [ETAPA-003](etapas/ETAPA-003-14b8cb75-TEMPLATE.md) |
| TEMPLATE | **Colocar o repositório no padrão do template de IA** | 🟠 Alta | — | Nenhuma | ✅ Concluído | — (não reservável) | [ETAPA-003](etapas/ETAPA-003-14b8cb75-TEMPLATE.md) |
| GHIDRA.4 | Instalar o JDK 21 pelo instalador em `tools/jdk-21/` | 🟠 Alta | — | Nenhuma | ✅ Concluído | — | [ETAPA-002](etapas/ETAPA-002-b1069931-GHIDRA.md) |
| CLONE.2 | Esqueleto Electron + TypeScript | 🟠 Alta | — | Nenhuma | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| GHIDRA.5 | Reiniciar o Claude Code e confirmar o Ghidra disponível no REA | 🟠 Alta | — | GHIDRA.4 | ✅ Concluído | — | [ETAPA-002](etapas/ETAPA-002-b1069931-GHIDRA.md) |
| GHIDRA | **Motor de análise (Ghidra) para o REA** | 🟠 Alta | — | Nenhuma | ✅ Concluído | — (não reservável) | [ETAPA-002](etapas/ETAPA-002-b1069931-GHIDRA.md) |
| MODELO.1 | Coluna "Modelo" no quadro e no modelo do quadro | 🟠 Alta | LEVE · Haiku 5.5 | Nenhuma | ✅ Concluído | — | [ETAPA-006](etapas/ETAPA-006-42e7edab-MODELO.md) |
| MODELO.2 | Dividir as subtarefas do CLONE no máximo possível | 🟠 Alta | MEDIO · Sonnet 5.5 | MODELO.1 | ✅ Concluído | — | [ETAPA-006](etapas/ETAPA-006-42e7edab-MODELO.md) |
| MODELO | **Modelo de IA em cada subtarefa e divisão do CLONE** | 🟠 Alta | — | Nenhuma | ✅ Concluído | — (não reservável) | [ETAPA-006](etapas/ETAPA-006-42e7edab-MODELO.md) |
| CLONE.12.1 | Tipos do `latest.json` e constantes do atualizador | 🟠 Alta | LEVE · Haiku 5.5 | Nenhuma | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| SERVIDOR.1 | Pasta, dependências e `.gitignore` | 🟠 Alta | LEVE · Haiku 5.5 | Nenhuma | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.3 | Mensagens das telas e erros | 🟠 Alta | LEVE · Haiku 5.5 | SERVIDOR.1 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.5 | Esquemas Pydantic do OAuth | 🟠 Alta | LEVE · Haiku 5.5 | SERVIDOR.1 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.27 | Tokens de tema (CSS) | 🟠 Alta | LEVE · Haiku 5.5 | SERVIDOR.1 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.28 | Modelo base das telas (`base.html`) | 🟠 Alta | LEVE · Haiku 5.5 | SERVIDOR.27 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.29 | Tela de login (`login.html`) | 🟠 Alta | LEVE · Haiku 5.5 | SERVIDOR.28, SERVIDOR.3 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.30 | Tela de cadastro (`cadastro.html`) | 🟠 Alta | LEVE · Haiku 5.5 | SERVIDOR.28, SERVIDOR.3 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.31 | Tela de consentimento e de erro | 🟠 Alta | LEVE · Haiku 5.5 | SERVIDOR.28, SERVIDOR.3 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.46 | Exemplo de `latest.json` | 🟠 Alta | LEVE · Haiku 5.5 | SERVIDOR.1 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| CLONE.4.1 | Definir o servidor do clone | 🟠 Alta | Usuário | Nenhuma | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| INICIO.1 | Hook de início que lista as subtarefas livres do modelo da sessão | 🟠 Alta | MEDIO · Sonnet 5.5 | Nenhuma | ✅ Concluído | — | [ETAPA-008](etapas/ETAPA-008-0a81b4ea-INICIALIZADOR.md) |
| INICIO | **Inicializador com as pendências do modelo da sessão** | 🟠 Alta | — | Nenhuma | ✅ Concluído | — (não reservável) | [ETAPA-008](etapas/ETAPA-008-0a81b4ea-INICIALIZADOR.md) |
| CLONE.1.1 | Mapa dos módulos `chaos_code_v3_client_lib::*` | 🟠 Alta | PESADO · Opus 5.5 | Nenhuma | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| SERVIDOR.2 | Constantes do servidor | 🟠 Alta | LEVE · Haiku 5.5 | SERVIDOR.1 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| NIVEL.1 | Regra "só o seu nível" nas regras, skills e no inicializador | 🟠 Alta | PESADO · Opus 5.5 | Nenhuma | ✅ Concluído | — | [ETAPA-010](etapas/ETAPA-010-ceb4e6f4-NIVEL.md) |
| GRAFO.1 | Regra `.claude/rules/graphify.md`, indexada e apontada no checklist | 🟡 Média | LEVE · Haiku 5.5 | Nenhuma | ✅ Concluído | — | [ETAPA-009](etapas/ETAPA-009-6a27b4e5-GRAFO.md) |
| GRAFO | **Regra: rodar o graphify a cada mudança e consultar o grafo a cada chat** | 🟡 Média | — | Nenhuma | ✅ Concluído | — (não reservável) | [ETAPA-009](etapas/ETAPA-009-6a27b4e5-GRAFO.md) |
| NIVEL.2 | Trava no `pre-commit`: reserva fora do nível é recusada | 🟠 Alta | PESADO · Opus 5.5 | NIVEL.1 | ✅ Concluído | — | [ETAPA-010](etapas/ETAPA-010-ceb4e6f4-NIVEL.md) |
| NIVEL | **Cada sessão só pega subtarefa do seu nível, com trava** | 🟠 Alta | — | Nenhuma | ✅ Concluído | — (não reservável) | [ETAPA-010](etapas/ETAPA-010-ceb4e6f4-NIVEL.md) |
| CLONE.1.8 | Textos de prompts e modelos de agente | 🟠 Alta | MEDIO · Sonnet 5.5 | CLONE.1.1 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.1.9 | Gerador de imagem e atualizador do original | 🟠 Alta | MEDIO · Sonnet 5.5 | CLONE.1.1 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.12.2 | Comparar versões (semver) | 🟠 Alta | MEDIO · Sonnet 5.5 | CLONE.12.1 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.12.3 | Buscar o `latest.json` e ver se há atualização | 🟠 Alta | MEDIO · Sonnet 5.5 | CLONE.12.2 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| SERVIDOR.4 | Configuração por variável de ambiente | 🟠 Alta | MEDIO · Sonnet 5.5 | SERVIDOR.2 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.33 | Descoberta OAuth (`.well-known`) | 🟠 Alta | MEDIO · Sonnet 5.5 | SERVIDOR.2 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.39 | Erros padronizados | 🟠 Alta | MEDIO · Sonnet 5.5 | SERVIDOR.5 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.47 | Rota do atualizador (`/releases/latest.json`) | 🟠 Alta | MEDIO · Sonnet 5.5 | SERVIDOR.4, SERVIDOR.46 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| CLONE.1.2 | Comandos Tauri (`invoke`) do original | 🟠 Alta | PESADO · Opus 5.5 | CLONE.1.1 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| ESFORCO.1 | `effort` no classificador-tarefas e no executor-leve | 🟡 Média | LEVE · Haiku 5.5 | Nenhuma | ✅ Concluído | — | [ETAPA-011](etapas/ETAPA-011-9d3e7a52-ESFORCO.md) |
| ESFORCO.2 | `effort` no executor-medio e no executor-pesado | 🟡 Média | LEVE · Haiku 5.5 | Nenhuma | ✅ Concluído | — | [ETAPA-011](etapas/ETAPA-011-9d3e7a52-ESFORCO.md) |
| ESFORCO | **Esforço (`effort`) fixo no frontmatter dos agentes** | 🟡 Média | — | Nenhuma | ✅ Concluído | — (não reservável) | [ETAPA-011](etapas/ETAPA-011-9d3e7a52-ESFORCO.md) |
| ALINHAR.1 | `graphify.md` segue o global (C11) | 🟠 Alta | LEVE · só Haiku 5.5 | Nenhuma | ✅ Concluído | — | [ETAPA-013](etapas/ETAPA-013-7c4a1e90-ALINHAR-GLOBAL.md) |
| ALINHAR.2 | Frase final `TAREFA FINALIZADA E SINCRONIZADA!` (C1) | 🟠 Alta | LEVE · só Haiku 5.5 | Nenhuma | ✅ Concluído | — | [ETAPA-013](etapas/ETAPA-013-7c4a1e90-ALINHAR-GLOBAL.md) |
| ALINHAR.3 | Ordem criar → publicar → assumir (C9) e tabela de frentes no texto (C3) | 🟠 Alta | LEVE · só Haiku 5.5 | Nenhuma | ✅ Concluído | — | [ETAPA-013](etapas/ETAPA-013-7c4a1e90-ALINHAR-GLOBAL.md) |
| ALINHAR.4 | Tabela "🧭 Frentes de trabalho" no `STATUS.md` e conferência dos hooks | 🟠 Alta | MEDIO · só Sonnet 5.5 | ALINHAR.3 | ✅ Concluído | — | [ETAPA-013](etapas/ETAPA-013-7c4a1e90-ALINHAR-GLOBAL.md) |
| ALINHAR.5 | Nível "até o máximo do modelo": regras, skills e trava (C2) | 🟠 Alta | PESADO · só Opus 5.5 | Nenhuma | ✅ Concluído | — | [ETAPA-013](etapas/ETAPA-013-7c4a1e90-ALINHAR-GLOBAL.md) |
| ALINHAR.6 | Aceite do usuário | 🟠 Alta | Usuário | ALINHAR.1 a ALINHAR.5 | ✅ Concluído | — | [ETAPA-013](etapas/ETAPA-013-7c4a1e90-ALINHAR-GLOBAL.md) |
| ALINHAR | **Alinhar as regras do REA às regras globais (`rules-ai`)** | 🟠 Alta | — | Nenhuma | ✅ Concluído | — (não reservável) | [ETAPA-013](etapas/ETAPA-013-7c4a1e90-ALINHAR-GLOBAL.md) |
| CAMINHO.1 | Corrigir o caminho com caracteres de controle | 🟠 Alta | LEVE · Haiku 5.5 | Nenhuma | ✅ Concluído | — | [ETAPA-014](etapas/ETAPA-014-e727457b-CAMINHO-HOOKS.md) |
| CAMINHO.2 | Versionar os hooks do Codex | 🟠 Alta | LEVE · Haiku 5.5 | Nenhuma | ✅ Concluído | — | [ETAPA-014](etapas/ETAPA-014-e727457b-CAMINHO-HOOKS.md) |
| CAMINHO.3 | Fim de linha LF nos hooks do Codex | 🟠 Alta | LEVE · Haiku 5.5 | CAMINHO.2 | ✅ Concluído | — | [ETAPA-014](etapas/ETAPA-014-e727457b-CAMINHO-HOOKS.md) |
| CAMINHO | **Corrigir o caminho quebrado e versionar os hooks do Codex** | 🟠 Alta | — | Nenhuma | ✅ Concluído | — | [ETAPA-014](etapas/ETAPA-014-e727457b-CAMINHO-HOOKS.md) |
| CLONE.7.2 | Prompts do grafo em constantes | 🟠 Alta | LEVE · Haiku 5.5 · effort low | CLONE.1.8 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.10.1 | Tipos de agente e modelo de agente | 🟠 Alta | LEVE · Haiku 5.5 · effort low | CLONE.1.8 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.1.5 | Login OAuth, cofre e aparelho do original | 🟠 Alta | PESADO · Opus 5.5 · effort high | CLONE.1.1 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.11.1 | Constantes e tipos da geração de imagem | 🟠 Alta | LEVE · Haiku 5.5 · effort low | CLONE.1.9 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.1.3 | Endpoints da API e formatos de pedido/resposta | 🟠 Alta | PESADO · Opus 5.5 · effort high | CLONE.1.1 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| SERVIDOR.22 | Dados iniciais dos modelos de agente | 🟠 Alta | LEVE · Haiku 5.5 · effort low | CLONE.1.8 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| CLONE.5.1 | Tipos das respostas da API | 🟠 Alta | LEVE · Haiku 5.5 · effort low | CLONE.1.3 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.1.6 | Vetores e grafo do original | 🟠 Alta | PESADO · Opus 5.5 · effort high | CLONE.1.1 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| SERVIDOR.6 | Esquemas Pydantic da API | 🟠 Alta | LEVE · Haiku 5.5 · effort low | SERVIDOR.1, CLONE.1.3 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| CLONE.6.1 | Tipos de pedaço, vetor e resultado | 🟠 Alta | LEVE · Haiku 5.5 · effort low | CLONE.1.6 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.6.2 | Constantes de vetores | 🟠 Alta | LEVE · Haiku 5.5 · effort low | CLONE.1.6 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.1.7 | Ferramentas MCP e configuração nos CLIs/WSL | 🟠 Alta | PESADO · Opus 5.5 · effort high | CLONE.1.1 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.1.10 | Extrair a interface embutida (assets) | 🟠 Alta | PESADO · Opus 5.5 · effort high | CLONE.1.1 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.7.1 | Tipos do grafo | 🟠 Alta | LEVE · Haiku 5.5 · effort low | CLONE.1.6 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.1.4 | Formatos dos arquivos `*.json` locais | 🟠 Alta | PESADO · Opus 5.5 · effort high | CLONE.1.1 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.6.4 | Similaridade de cosseno | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.6.1 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.13.1 | Tokens de tema (cores, fontes, medidas) | 🟠 Alta | LEVE · Haiku 5.5 · effort low | CLONE.1.10 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| SERVIDOR.7 | Esquema do banco (SQL) | 🟠 Alta | PESADO · Opus 5.5 · effort high | SERVIDOR.2 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| CLONE.2.1 | Tirar a pasta `dist/` do Git (gerada pelo build) | 🟠 Alta | LEVE · Haiku 5.5 · effort low | CLONE.2 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.4.2 | Tipos e constantes do OAuth | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.1.5, CLONE.4.1 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.4.5 | Identificação do aparelho | 🟠 Alta | PESADO · Opus 5.5 · effort high | CLONE.1.5 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| SERVIDOR.8 | Conexão e criação do banco SQLite | 🟠 Alta | PESADO · Opus 5.5 · effort high | SERVIDOR.4, SERVIDOR.7 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| CLONE.1.11 | Índice do inventário (`INVENTARIO.md`) | 🟠 Alta | LEVE · Haiku 5.5 · effort low | CLONE.1.2 a CLONE.1.10 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.4.10 | Modo simulado (`auth::mock`) | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.4.2 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.4.3 | Gerador PKCE | 🟠 Alta | PESADO · Opus 5.5 · effort high | CLONE.4.2 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.4.6 | Registro do cliente (`/api/oauth/register`) | 🟠 Alta | PESADO · Opus 5.5 · effort high | CLONE.4.2 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.6.5 | Contrato do provedor de embedding + fábrica | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.6.1 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.3.2 | Constantes da pasta de dados e nomes de arquivo | 🟠 Alta | LEVE · Haiku 5.5 · effort low | CLONE.1.4 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.3.1 | Tipos dos arquivos locais | 🟠 Alta | LEVE · Haiku 5.5 · effort low | CLONE.1.4 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.4.7 | Autorização no navegador do sistema + callback local | 🟠 Alta | PESADO · Opus 5.5 · effort high | CLONE.4.3, CLONE.4.6 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.6.3 | Divisor de texto (chunker) | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.6.1, CLONE.6.2 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.8.1 | Lista e schemas das ferramentas MCP | 🟠 Alta | LEVE · Haiku 5.5 · effort low | CLONE.1.7 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.12.4 | Conferir a assinatura minisign (Ed25519) | 🟠 Alta | PESADO · Opus 5.5 · effort high | CLONE.12.1 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.3.8 | Alinhar os tipos de vetores, imagem e grafo ao inventário dos arquivos locais | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.3.1 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.13.3 | Estrutura das telas e navegação | 🟠 Alta | PESADO · Opus 5.5 · effort high | CLONE.13.1 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.9.1 | Lista dos CLIs suportados | 🟠 Alta | LEVE · Haiku 5.5 · effort low | CLONE.1.7 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.3.3 | Caminhos da pasta de dados | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.3.2 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.7.6 | Detecção de comunidades | 🟠 Alta | PESADO · Opus 5.5 · effort high | CLONE.7.1 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.3.4 | Leitor e gravador de JSON com gravação segura | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.3.3 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| SERVIDOR.10 | Geração e hash de tokens | 🟠 Alta | PESADO · Opus 5.5 · effort high | SERVIDOR.2 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| CLONE.13.2 | Textos da interface em constantes | 🟠 Alta | LEVE · Haiku 5.5 · effort low | CLONE.1.10 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| SERVIDOR.9 | Hash de senha (scrypt) | 🟠 Alta | PESADO · Opus 5.5 · effort high | SERVIDOR.2 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| CLONE.3.5 | Repositório de projetos | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.3.1, CLONE.3.4 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.7.12 | Tipo `Community` igual ao original (`keywords`, id numérico) | 🟠 Alta | LEVE · Haiku 5.5 · effort low | CLONE.7.6 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.4.4 | Cofre de tokens (`safeStorage`) | 🟠 Alta | PESADO · Opus 5.5 · effort high | CLONE.3.4, CLONE.4.2 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.3.6 | Serviço de projetos (`project::manager`) | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.3.5 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| SERVIDOR.14 | Repositório de usuários | 🟠 Alta | PESADO · Opus 5.5 · effort high | SERVIDOR.8, SERVIDOR.9 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| CLONE.7.4 | Armazenamento do grafo | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.3.4, CLONE.7.1 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.3.7 | Canais IPC de projetos | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.3.6 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.4.8 | Troca do código e renovação do token (`/api/oauth/token`) | 🟠 Alta | PESADO · Opus 5.5 · effort high | CLONE.4.4, CLONE.4.7 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| SERVIDOR.15 | Repositório de clientes OAuth | 🟠 Alta | PESADO · Opus 5.5 · effort high | SERVIDOR.8 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| CLONE.10.2 | Leitor de frontmatter | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.10.1 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.6.6 | Chaves de API dos provedores (cofre) | 🟠 Alta | PESADO · Opus 5.5 · effort high | CLONE.4.4 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| SERVIDOR.16 | Repositório de códigos de autorização | 🟠 Alta | PESADO · Opus 5.5 · effort high | SERVIDOR.8, SERVIDOR.10 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| CLONE.9.2 | Descobrir CLIs instalados | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.9.1 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.7.9 | Reordenação (rerank) | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.6.4 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.4.9 | Sair e revogar (`/api/oauth/revoke`) | 🟠 Alta | PESADO · Opus 5.5 · effort high | CLONE.4.8 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.6.7 | Provedor OpenAI | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.6.5, CLONE.6.6 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.6.8 | Provedor Gemini | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.6.5, CLONE.6.6 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.6.9 | Provedor OpenRouter | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.6.5, CLONE.6.6 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| SERVIDOR.17 | Repositório de tokens | 🟠 Alta | PESADO · Opus 5.5 · effort high | SERVIDOR.8, SERVIDOR.10 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.18 | Repositório de projetos | 🟠 Alta | PESADO · Opus 5.5 · effort high | SERVIDOR.8, SERVIDOR.6 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| CLONE.7.3 | Cliente de LLM para o grafo | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.6.6 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.11.2 | Chamada à API Gemini | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.11.1, CLONE.6.6 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.12.6 | Histórico de atualizações | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.12.1, CLONE.3.4 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.10.3 | Gravar agente na pasta do CLI | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.10.2, CLONE.9.2 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.11.3 | Gravar a imagem no projeto | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.11.1, CLONE.3.3 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.12.5 | Baixar e instalar a atualização | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.12.3, CLONE.12.4 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.7.8 | Transformação de consulta | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.7.2, CLONE.7.3 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.6.10 | Índice vetorial (gravar, carregar, buscar) | 🟠 Alta | PESADO · Opus 5.5 · effort high | CLONE.3.4, CLONE.6.4 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| SERVIDOR.25 | Autenticação Bearer da API | 🟠 Alta | PESADO · Opus 5.5 · effort high | SERVIDOR.17 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| CLONE.4.11 | Serviço de login (junta as peças) | 🟠 Alta | PESADO · Opus 5.5 · effort high | CLONE.4.5, CLONE.4.8, CLONE.4.9, CLONE.4.10 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.7.7 | Resumo das comunidades | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.7.3, CLONE.7.6 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.9.5 | Detectar o WSL e o IP | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.1.7 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| SERVIDOR.19 | Repositório de tarefas | 🟠 Alta | PESADO · Opus 5.5 · effort high | SERVIDOR.18 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| CLONE.11.4 | Canais IPC de imagem | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.11.2, CLONE.11.3 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.12.7 | Canais IPC do atualizador | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.12.5, CLONE.12.6 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| SERVIDOR.38 | Revogação (`/api/oauth/revoke`) | 🟠 Alta | PESADO · Opus 5.5 · effort high | SERVIDOR.17 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| RETOMAR.1 | Passo de leitura no `essentials.md` | 🟠 Alta | LEVE · Haiku 5.5 · effort low | Nenhuma | ✅ Concluído | — | [ETAPA-016](etapas/ETAPA-016-57182721-RETOMAR.md) |
| RETOMAR | **Ler o status das tarefas e o prompt do líder ao começar** | 🟠 Alta | — | Nenhuma | ✅ Concluído | — | [ETAPA-016](etapas/ETAPA-016-57182721-RETOMAR.md) |
| SERVIDOR.41 | Rotas de projetos (`/api/projects/...`) | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | SERVIDOR.18, SERVIDOR.25 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.55 | Linhas longas no `api_projetos.py` (correção da SERVIDOR.41) | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | SERVIDOR.41 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.40 | Rota do usuário (`/api/oauth/user/projects`) | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | SERVIDOR.18, SERVIDOR.25 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.42 | Rotas de tarefas | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | SERVIDOR.19, SERVIDOR.25 | ✅ Concluído | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| CLONE.5.2 | Cliente HTTP base com token | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.4.11, CLONE.5.1 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| LIGHTBOT.1 | Jogo completo em `apps-cloned/light-bot/` | 🟡 Média | PESADO · só Opus 5.5+ ou Fable · effort high | Nenhuma | ✅ Concluído | — | [ETAPA-019](etapas/ETAPA-019-3f57d79f-LIGHTBOT.md) |
| **LIGHTBOT** | **Clone do jogo Light-Bot (Robô de Luz)** | 🟡 Média | — | Nenhuma | ✅ Concluído | — (não reservável) | [ETAPA-019](etapas/ETAPA-019-3f57d79f-LIGHTBOT.md) |
| **COMMIT.INICIAL.RULES-AI** | **Commit e push inicial do quadro com a tarefa COMMIT.INICIAL.RULES-AI (mudança em massa em 5 repositórios)** | 🟡 Média | — | Nenhuma | ✅ Concluído | — (não reservável) | [ETAPA-020](etapas/ETAPA-020-8951bfc3-COMMIT-INICIAL-RULES-AI.md) |
| COMMIT.INICIAL.RULES-AI.1 | Registrar a tarefa no quadro, commit e push na `main` · `PESADO · effort high` | 🟡 Média | PESADO · só Sonnet, Opus 5.5+ ou Fable · effort high | Nenhuma | ✅ Concluído | — | [ETAPA-020](etapas/ETAPA-020-8951bfc3-COMMIT-INICIAL-RULES-AI.md) |
| **JEV-NAO** | **Marcar JEV-AI-SUGGESTION: NAO nas etapas do projeto (C47)** | 🟡 Média | — | Nenhuma | ✅ Concluído | — (não reservável) | [ETAPA-022](etapas/ETAPA-022-0fb7545b-JEV-NAO-MARCAR-SUGESTAO.md) |
| JEV-NAO.1 | Rodar o script que marca JEV-AI-SUGGESTION: NAO nas subtarefas | 🟡 Média | LEVE · Haiku 5.5 · effort low | Nenhuma | ✅ Concluído | — | [ETAPA-022](etapas/ETAPA-022-0fb7545b-JEV-NAO-MARCAR-SUGESTAO.md) |
| CLONE.5.4 | API de tarefas | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.5.2 | ✅ Concluído | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
