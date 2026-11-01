# STATUS — REA APP CLONES

**Objetivo:** usar o REA (engenharia reversa com IA) para entender aplicativos e recriar as
funcionalidades deles, com as ferramentas de análise sempre à mão no repositório.
**Partes interessadas:** Gelvazio (decide, aprova e usa) · agentes de IA executam pelo quadro.
**Links:** [Regras](../AGENTS.md) · [Etapas](etapas/) · [Concluídas](task_complete.md) · [Recados](RECADOS.md)

Legenda: ⬜ Pendente · 🔄 Em progresso · ✅ Concluído · ⛔ Bloqueado · 👀 Aguardando o usuário ·
Prioridade: 🔴 Máxima · 🟠 Alta · 🟡 Média · 🟢 Baixa

## 🧭 Frentes de trabalho

Uma linha por frente (`<IA (modelo)> (<ambiente> · <branch>)`). Cada sessão atualiza **só a linha dela**, ao começar e ao parar; sem pendência → `⏹️ Encerrada`. O próximo passo de cada frente é o da etapa dela.

| Frente | Tarefa (etapa) | Situação | Atualizado em |
|---|---|---|---|
| Claude Code (Sonnet 5.5) (local · main) | COMMIT.INICIAL.RULES-AI.1 concluída ([ETAPA-020](etapas/ETAPA-020-8951bfc3-COMMIT-INICIAL-RULES-AI.md)) | ⏹️ Encerrada | 2026-10-23 09:43 |
| Claude Code (Sonnet 5.5) (local · main) | ALINHAR.1 a ALINHAR.5 entregues; aguarda aceite ([ETAPA-013](etapas/ETAPA-013-7c4a1e90-ALINHAR-GLOBAL.md)) | ⏹️ Encerrada | 2026-10-16 15:40 |
| Claude Code (Opus 5.5) (local · main) | CAMINHO.1 a CAMINHO.3 entregues ([ETAPA-014](etapas/ETAPA-014-e727457b-CAMINHO-HOOKS.md)) | ⏹️ Encerrada | 2026-10-16 19:54 |
| Claude Code (Opus 5.5) (nuvem · main) | HERDR criada; trabalhando na HERDR-GLOBAL.1 (`rules-ai`) antes da HERDR.1 ([ETAPA-015](etapas/ETAPA-015-b445d913-HERDR.md)) | 🔄 Em execução | 2026-10-17 23:30 |
| Claude Code (Opus 5.5) (nuvem · main · s2) | CLONE.1.3 liberada pelo usuário em 2026-10-18 00:08 (sessão parada) | ⏹️ Encerrada | 2026-10-18 00:08 |
| Claude Code (Opus 5.5) (local · main) — líder | Sargento: equipe parada (semana em 96%; zera 21/10 07:00). Retomar pelo tasks/STATUS_TAREFAS_ANDAMENTO.md | ⏹️ Encerrada | 2026-10-18 07:27 |
| Claude Code (Sonnet 5.5 · herdr sn2; líder Opus 5.5) (local · main) | CLONE.9.5 entregue; créditos acabando | ⏹️ Encerrada | 2026-10-18 07:04 |
| Claude Code (Sonnet 5.5 · herdr sn1; líder Opus 5.5) (local · main) | SERVIDOR.41 entregue | ⏹️ Encerrada | 2026-10-18 07:27 |
| Claude Code (Opus 5.5 · herdr op1; líder Opus 5.5) (local · main) | CLONE.1.7 entregue; painel trocado pelo Sonnet (sn1) | ⏹️ Encerrada | 2026-10-18 00:33 |
| Claude Code (Opus 5.5 · herdr op2; líder Opus 5.5) (local · main) | CLONE.4.11 entregue; créditos acabando | ⏹️ Encerrada | 2026-10-18 07:04 |
| Claude Code (Opus 5.5 · herdr op3; líder Opus 5.5) (local · main) | SERVIDOR.38 entregue; créditos acabando | ⏹️ Encerrada | 2026-10-18 07:17 |
| Claude Code (Haiku 5.5 · herdr hk1; líder Opus 5.5) (local · main) | CLONE.7.12 entregue; sem LEVE livre, painel trocado pelo Sonnet (sn2) | ⏹️ Encerrada | 2026-10-18 05:09 |
| Claude Code (Opus 5.5 · herdr op4; líder Opus 5.5) (local · main) | SERVIDOR.19 entregue; créditos acabando | ⏹️ Encerrada | 2026-10-18 07:04 |
| Claude Code (Opus 5.5 · herdr op5; líder Opus 5.5) (local · main) | CLONE.6.11 liberada sem começar (créditos acabando) | ⏹️ Encerrada | 2026-10-18 07:16 |
| Claude Code (Sonnet 5.5 · herdr sn3; líder Opus 5.5) (local · main) | CLONE.11.4 entregue; créditos acabando | ⏹️ Encerrada | 2026-10-18 07:04 |
| Claude Code (Sonnet 5.5 · herdr sn4; líder Opus 5.5) (local · main) | CLONE.12.7 entregue; créditos acabando | ⏹️ Encerrada | 2026-10-18 07:04 |
| Claude Code (Opus 5.5) (local · main) — LIGHTBOT | LIGHTBOT.1 entregue ([ETAPA-019](etapas/ETAPA-019-3f57d79f-LIGHTBOT.md)) | ⏹️ Encerrada | 2026-10-22 17:20 |

## 📌 Tarefas

Cada **subtarefa** é uma linha própria e pode ser reservada por **qualquer IA** (coluna "Em uso por"). A linha em
**negrito** é a tarefa-mãe: não se reserva; ela fecha quando todas as subtarefas estiverem ✅. Aqui só ficam
tarefas **abertas ou em andamento**: linha que vira ✅ é movida para o [`task_complete.md`](task_complete.md).

| Tarefa | Título | Prioridade | Modelo | Depende de | Status | Em uso por | Etapa |
|---|---|---|---|---|---|---|---|
| CLONE | **Clonar o Chaos Code v3 em Node/TypeScript + Electron** | 🟠 Alta | — | Nenhuma | 🔄 Em progresso | — (não reservável) | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.5.7 | Canais IPC da API | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.5.3, CLONE.5.4, CLONE.5.5, CLONE.5.6 | 🔄 Em execução | Claude Code (Sonnet 5.5 · executor-medio; líder Opus 5.5) (local · main) (desde 2026-11-01 16:40) | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.6.11 | Serviço de indexação do projeto | 🟠 Alta | PESADO · Opus 5.5 · effort high | CLONE.3.6, CLONE.6.3, CLONE.6.7, CLONE.6.8, CLONE.6.9, CLONE.6.10 | 🔄 Em execução | Claude Code (Opus 5.5 · executor-pesado; líder Opus 5.5) (local · main) (desde 2026-11-01 16:20) | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.6.12 | Canais IPC de vetores | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.6.11 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.7.5 | Extração de entidades e relações | 🟠 Alta | PESADO · Opus 5.5 · effort high | CLONE.7.2, CLONE.7.3, CLONE.7.4 | 🔄 Em execução | Claude Code (Opus 5.5 · executor-pesado; líder Opus 5.5) (local · main) (desde 2026-11-01 16:20) | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.7.10 | Serviço de consulta (grafo + vetores) | 🟠 Alta | PESADO · Opus 5.5 · effort high | CLONE.6.11, CLONE.7.5, CLONE.7.7, CLONE.7.8, CLONE.7.9 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.7.11 | Canais IPC do grafo | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.7.10 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.8.2 | Servidor HTTP em `/mcp/{project_id}` | 🟠 Alta | PESADO · Opus 5.5 · effort high | CLONE.3.6 | 🔄 Em execução | Claude Code (Opus 5.5 · executor-pesado; líder Opus 5.5) (local · main) (desde 2026-11-01 16:20) | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.8.3 | Token de sessão `X-MCP-Session-Token` | 🟠 Alta | PESADO · Opus 5.5 · effort high | CLONE.8.2 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.8.4 | Descoberta OAuth (`.well-known`) | 🟠 Alta | PESADO · Opus 5.5 · effort high | CLONE.8.2, CLONE.4.2 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.8.5 | Ferramenta de busca nos vetores | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.6.11, CLONE.8.1 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.8.6 | Ferramenta de consulta ao grafo | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.7.10, CLONE.8.1 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.8.7 | Ferramentas de tarefas | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.5.4, CLONE.8.1 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.8.8 | Ferramentas de projeto | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.5.3, CLONE.8.1 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.8.9 | Roteador MCP (liga ferramentas ao servidor) | 🟠 Alta | PESADO · Opus 5.5 · effort high | CLONE.8.3, CLONE.8.4, CLONE.8.5, CLONE.8.6, CLONE.8.7, CLONE.8.8 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.8.10 | Canais IPC do MCP (ligar/desligar, porta) | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.8.9 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.9.3 | Configurar o Claude Code (`claude mcp add`) | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.9.2, CLONE.8.3 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.9.4 | Configurar os outros CLIs | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.9.2, CLONE.8.3 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.9.6 | Liberar o localhost para o WSL (`netsh`) | 🟠 Alta | PESADO · Opus 5.5 · effort high | CLONE.9.5, CLONE.8.2 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.9.7 | Canais IPC de CLIs e WSL | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.9.3, CLONE.9.4, CLONE.9.6 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.10.4 | Serviço de agentes | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.5.6, CLONE.10.3 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.10.5 | Canais IPC de agentes | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.10.4 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.13.4 | Tela de login | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.13.3, CLONE.4.12 | 🔄 Em execução | Claude Code (Sonnet 5.5 · executor-medio; líder Opus 5.5) (local · main) (desde 2026-11-01 16:40) | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.13.5 | Tela de projetos | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.13.3, CLONE.3.7, CLONE.5.7 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.13.6 | Tela de tarefas | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.13.3, CLONE.5.7 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.13.7 | Tela de indexação e busca | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.13.3, CLONE.6.12 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.13.8 | Tela do grafo | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.13.3, CLONE.7.11 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.13.9 | Tela do MCP, CLIs e WSL | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.13.3, CLONE.8.10, CLONE.9.7 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.13.10 | Tela de agentes | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.13.3, CLONE.10.5 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.13.11 | Tela de imagens | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.13.3, CLONE.11.4 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.13.12 | Tela de configurações e atualização | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.13.3, CLONE.12.7 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.13.13 | Tela do Dashboard (início) | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.13.3, CLONE.3.7, CLONE.5.7 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.14.1 | Conferir o inventário contra o clone | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | CLONE.13.4 a CLONE.13.13 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.14.2 | README de como rodar e o que testar | 🟠 Alta | LEVE · Haiku 5.5 · effort low | CLONE.14.1 | ⬜ Pendente | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| CLONE.14.3 | Aceite do usuário | 🟠 Alta | Usuário | CLONE.14.2 | 👀 Aguardando o usuário | — | [ETAPA-005](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| SERVIDOR | **Servidor local do clone (Python + FastAPI)** | 🟠 Alta | — | Nenhuma | 🔄 Em progresso | — (não reservável) | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.11 | Conferência do PKCE (S256) | 🟠 Alta | PESADO · Opus 5.5 · effort high | SERVIDOR.2 | ⬜ Pendente | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.12 | Proteção CSRF dos formulários | 🟠 Alta | PESADO · Opus 5.5 · effort high | SERVIDOR.10 | ⬜ Pendente | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.13 | Limite de tentativas de login | 🟠 Alta | PESADO · Opus 5.5 · effort high | SERVIDOR.2 | ⬜ Pendente | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.20 | Repositório de imagens | 🟠 Alta | PESADO · Opus 5.5 · effort high | SERVIDOR.18 | ⬜ Pendente | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.21 | Repositório de modelos de agente | 🟠 Alta | PESADO · Opus 5.5 · effort high | SERVIDOR.8, SERVIDOR.6 | ⬜ Pendente | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.23 | Carga dos dados iniciais | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | SERVIDOR.21, SERVIDOR.22 | ⬜ Pendente | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.24 | Sessão do navegador (cookie assinado) | 🟠 Alta | PESADO · Opus 5.5 · effort high | SERVIDOR.4, SERVIDOR.14 | ⬜ Pendente | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.26 | Exigir administrador | 🟠 Alta | PESADO · Opus 5.5 · effort high | SERVIDOR.25 | ⬜ Pendente | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.32 | Rota de cadastro pela tela | 🟠 Alta | PESADO · Opus 5.5 · effort high | SERVIDOR.12, SERVIDOR.14, SERVIDOR.30 | ⬜ Pendente | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.34 | Registro de cliente (`/api/oauth/register`) | 🟠 Alta | PESADO · Opus 5.5 · effort high | SERVIDOR.5, SERVIDOR.15 | ⬜ Pendente | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.35 | Autorização (`/authorize`) | 🟠 Alta | PESADO · Opus 5.5 · effort high | SERVIDOR.11, SERVIDOR.12, SERVIDOR.13, SERVIDOR.16, SERVIDOR.24, SERVIDOR.29, SERVIDOR.31 | ⬜ Pendente | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.36 | Token: troca do código (`authorization_code`) | 🟠 Alta | PESADO · Opus 5.5 · effort high | SERVIDOR.16, SERVIDOR.17, SERVIDOR.11 | ⬜ Pendente | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.37 | Token: renovação (`refresh_token`) | 🟠 Alta | PESADO · Opus 5.5 · effort high | SERVIDOR.36 | ⬜ Pendente | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.43 | Rotas de imagens (enviar e baixar) | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | SERVIDOR.20, SERVIDOR.25 | ⬜ Pendente | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.44 | Rota de modelos de agente (`/api/client/agent-templates`) | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | SERVIDOR.21, SERVIDOR.25 | ⬜ Pendente | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.45 | Rotas de admin dos modelos de agente | 🟠 Alta | PESADO · Opus 5.5 · effort high | SERVIDOR.21, SERVIDOR.26 | ⬜ Pendente | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.48 | Fábrica do app FastAPI | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | SERVIDOR.8, SERVIDOR.24, SERVIDOR.39 | ⬜ Pendente | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.49 | Comando `criar-admin` | 🟠 Alta | PESADO · Opus 5.5 · effort high | SERVIDOR.14 | ⬜ Pendente | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.50 | Ponto de entrada (`python -m servidor`) | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | SERVIDOR.48, SERVIDOR.49 | ⬜ Pendente | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.51 | Scripts de iniciar (Windows) | 🟠 Alta | LEVE · Haiku 5.5 · effort low | SERVIDOR.50 | ⬜ Pendente | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.52 | README do servidor | 🟠 Alta | LEVE · Haiku 5.5 · effort low | SERVIDOR.51 | ⬜ Pendente | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.53 | Conferência final do servidor | 🟠 Alta | MEDIO · Sonnet 5.5 · effort medium | SERVIDOR.32 a SERVIDOR.52 | ⬜ Pendente | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| SERVIDOR.54 | Aceite do usuário | 🟠 Alta | Usuário | SERVIDOR.53 | 👀 Aguardando o usuário | — | [ETAPA-007](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| HERDR | **Integrar o herdr (agentes em painéis) à equipe de agentes** | 🟡 Média | — | Nenhuma | 🔄 Em progresso | — (não reservável) | [ETAPA-015](etapas/ETAPA-015-b445d913-HERDR.md) |
| HERDR.1 | Modo herdr na skill `liderar-equipe` | 🟡 Média | PESADO · Opus 5.5 · effort high | HERDR-GLOBAL.1 (`rules-ai`) | ⬜ Pendente | — | [ETAPA-015](etapas/ETAPA-015-b445d913-HERDR.md) |
| HERDR.2 | Ponteiro para a regra global do herdr em `multiplas-ias.md` | 🟡 Média | LEVE · Haiku 5.5 · effort low | HERDR.1 | ⬜ Pendente | — | [ETAPA-015](etapas/ETAPA-015-b445d913-HERDR.md) |
| CONFEFFORT | **Conferir o esforço (`effort`) em cada modelo** | 🟡 Média | — | Nenhuma | ⛔ Movida para o quadro global (rules-ai: CONFEFFORT-GLOBAL) | — (não reservável) | [ETAPA-012](etapas/ETAPA-012-5b1f0c86-CONFEFFORT.md) |
| CONFEFFORT.1 | Haiku 5.5: conferir o `effort` | 🟡 Média | LEVE · só Haiku 5.5 | Nenhuma | ⛔ Movida para o quadro global (rules-ai: CONFEFFORT-GLOBAL) | — | [ETAPA-012](etapas/ETAPA-012-5b1f0c86-CONFEFFORT.md) |
| CONFEFFORT.2 | Sonnet 5.5: conferir o `effort` | 🟡 Média | MEDIO · só Sonnet 5.5 | Nenhuma | ⛔ Movida para o quadro global (rules-ai: CONFEFFORT-GLOBAL) | — | [ETAPA-012](etapas/ETAPA-012-5b1f0c86-CONFEFFORT.md) |
| CONFEFFORT.3 | Opus 5.5: conferir o `effort` | 🟡 Média | PESADO · só Opus 5.5 | Nenhuma | ⛔ Movida para o quadro global (rules-ai: CONFEFFORT-GLOBAL) | — | [ETAPA-012](etapas/ETAPA-012-5b1f0c86-CONFEFFORT.md) |
| CONFEFFORT.4 | Gemini Pro: conferir o esforço | 🟡 Média | MEDIO · só Gemini Pro | Nenhuma | ⛔ Movida para o quadro global (rules-ai: CONFEFFORT-GLOBAL) | — | [ETAPA-012](etapas/ETAPA-012-5b1f0c86-CONFEFFORT.md) |
| CONFEFFORT.5 | DeepSeek (raciocínio): conferir o esforço | 🟡 Média | MEDIO · só DeepSeek (raciocínio) | Nenhuma | ⛔ Movida para o quadro global (rules-ai: CONFEFFORT-GLOBAL) | — | [ETAPA-012](etapas/ETAPA-012-5b1f0c86-CONFEFFORT.md) |
| **RL-58881388-NIVEIS-E-MODELOS** | **Ajustar o projeto à regra niveis-e-modelos.md (rules-local 2026-10-20-58881388)** | 🟡 Média | — | Nenhuma | ⬜ Pendente | — (não reservável) | [ETAPA-017](etapas/ETAPA-017-d767aafc-RL-58881388-NIVEIS-E-MODELOS.md) |
| RL-58881388-NIVEIS-E-MODELOS.1 | Matriz da skill `classificar-tarefa` igual à regra global | 🟡 Média | LEVE · só Haiku 5.5 | Nenhuma | ⬜ Pendente | — | [ETAPA-017](etapas/ETAPA-017-d767aafc-RL-58881388-NIVEIS-E-MODELOS.md) |
| **RL-6637F9D5-NIVEIS-E-MODELOS** | **Ajustar o projeto à regra niveis-e-modelos.md (rules-local 2026-10-22-6637f9d5)** | 🟡 Média | — | Nenhuma | ⬜ Pendente | — (não reservável) | [ETAPA-018](etapas/ETAPA-018-4b0ff54f-RL-6637F9D5-NIVEIS-E-MODELOS.md) |
| RL-6637F9D5-NIVEIS-E-MODELOS.1 | Sonnet em `PESADO` na skill e nas regras do REA | 🟡 Média | PESADO · só Opus 5.5+ ou Fable · effort high | Nenhuma | ⬜ Pendente | — | [ETAPA-018](etapas/ETAPA-018-4b0ff54f-RL-6637F9D5-NIVEIS-E-MODELOS.md) |
| **RL-4F19D945-NIVEIS-E-MODELOS** | **Ajustar o projeto à regra niveis-e-modelos.md (rules-local 2026-10-23-4f19d945)** | 🟡 Média | — | Nenhuma | ⬜ Pendente | — (não reservável) | [ETAPA-021](etapas/ETAPA-021-c8981c58-RL-4F19D945-NIVEIS-E-MODELOS.md) |
| RL-4F19D945-NIVEIS-E-MODELOS.1 | Alinhar a matriz de níveis do projeto à C48 | 🟡 Média | LEVE · Haiku 5.5 · effort low | Nenhuma | ⬜ Pendente | — | [ETAPA-021](etapas/ETAPA-021-c8981c58-RL-4F19D945-NIVEIS-E-MODELOS.md) |

## Escopo do projeto

- **Entra:** análise de aplicativos com o REA (pastas `apps-to-be-clone/` e `apps-cloned/`),
  ferramentas de análise locais em `tools/` (Ghidra, JDK — fora do Git por enquanto), regras e quadro do template de IA.
- **Não entra:** analisar software sem autorização do dono; executar binários de origem desconhecida
  fora de análise estática.

## 🗂️ Etapas

| Etapa | Assunto | Arquivo |
|---|---|---|
| 001-0fb937e7 | REPO: iniciar o repositório Git | [ETAPA-001-0fb937e7-INICIAR-REPO.md](etapas/ETAPA-001-0fb937e7-INICIAR-REPO.md) |
| 002-b1069931 | GHIDRA: motor de análise para o REA | [ETAPA-002-b1069931-GHIDRA.md](etapas/ETAPA-002-b1069931-GHIDRA.md) |
| 003-14b8cb75 | TEMPLATE: padrão do template de IA | [ETAPA-003-14b8cb75-TEMPLATE.md](etapas/ETAPA-003-14b8cb75-TEMPLATE.md) |
| 004-c5c1b50f | IGNORE: executável analisado fora do Git | [ETAPA-004-c5c1b50f-IGNORE-APPS.md](etapas/ETAPA-004-c5c1b50f-IGNORE-APPS.md) |
| 005-40073ee0 | CLONE: clonar o Chaos Code v3 (Electron + TS) | [ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md](etapas/ETAPA-005-40073ee0-CLONE-CHAOS-CODE.md) |
| 006-42e7edab | MODELO: modelo de IA em cada subtarefa e divisão do CLONE | [ETAPA-006-42e7edab-MODELO.md](etapas/ETAPA-006-42e7edab-MODELO.md) |
| 007-2bd3351f | SERVIDOR: servidor local do clone (Python + FastAPI) | [ETAPA-007-2bd3351f-SERVIDOR.md](etapas/ETAPA-007-2bd3351f-SERVIDOR.md) |
| 008-0a81b4ea | INICIO: inicializador com as pendências do modelo da sessão | [ETAPA-008-0a81b4ea-INICIALIZADOR.md](etapas/ETAPA-008-0a81b4ea-INICIALIZADOR.md) |
| 009-6a27b4e5 | GRAFO: regra para rodar e consultar o graphify | [ETAPA-009-6a27b4e5-GRAFO.md](etapas/ETAPA-009-6a27b4e5-GRAFO.md) |
| 010-ceb4e6f4 | NIVEL: cada sessão só pega subtarefa do seu nível, com trava | [ETAPA-010-ceb4e6f4-NIVEL.md](etapas/ETAPA-010-ceb4e6f4-NIVEL.md) |
| 011-9d3e7a52 | ESFORCO: esforço (`effort`) fixo no frontmatter dos agentes | [ETAPA-011-9d3e7a52-ESFORCO.md](etapas/ETAPA-011-9d3e7a52-ESFORCO.md) |
| 012-5b1f0c86 | CONFEFFORT: conferir o `effort` em cada modelo | [ETAPA-012-5b1f0c86-CONFEFFORT.md](etapas/ETAPA-012-5b1f0c86-CONFEFFORT.md) |
| 013-7c4a1e90 | ALINHAR: alinhar as regras do REA às regras globais (`rules-ai`) | [ETAPA-013-7c4a1e90-ALINHAR-GLOBAL.md](etapas/ETAPA-013-7c4a1e90-ALINHAR-GLOBAL.md) |
| 014-e727457b | CAMINHO: corrigir o caminho quebrado e versionar os hooks do Codex | [ETAPA-014-e727457b-CAMINHO-HOOKS.md](etapas/ETAPA-014-e727457b-CAMINHO-HOOKS.md) |
| 015-b445d913 | HERDR: integrar o herdr (agentes em painéis) à equipe de agentes | [ETAPA-015-b445d913-HERDR.md](etapas/ETAPA-015-b445d913-HERDR.md) |
| 016-57182721 | RETOMAR: ler o status das tarefas e o prompt do líder ao começar | [ETAPA-016-57182721-RETOMAR.md](etapas/ETAPA-016-57182721-RETOMAR.md) |
| 017-d767aafc | RL-58881388-NIVEIS-E-MODELOS: ajustar a skill à regra niveis-e-modelos.md (rules-local) | [ETAPA-017-d767aafc-RL-58881388-NIVEIS-E-MODELOS.md](etapas/ETAPA-017-d767aafc-RL-58881388-NIVEIS-E-MODELOS.md) |
| 018-4b0ff54f | RL-6637F9D5-NIVEIS-E-MODELOS: Sonnet em PESADO na skill (rules-local) | [ETAPA-018-4b0ff54f-RL-6637F9D5-NIVEIS-E-MODELOS.md](etapas/ETAPA-018-4b0ff54f-RL-6637F9D5-NIVEIS-E-MODELOS.md) |
| 019-3f57d79f | LIGHTBOT: clone do jogo Light-Bot | [ETAPA-019-3f57d79f-LIGHTBOT.md](etapas/ETAPA-019-3f57d79f-LIGHTBOT.md) |
| 020-8951bfc3 | COMMIT.INICIAL.RULES-AI: commit e push inicial do quadro | [ETAPA-020-8951bfc3-COMMIT-INICIAL-RULES-AI.md](etapas/ETAPA-020-8951bfc3-COMMIT-INICIAL-RULES-AI.md) |
| 022-0fb7545b | JEV-NAO: Marcar JEV-AI-SUGGESTION: NAO nas etapas do projeto (C47) | [ETAPA-022-0fb7545b-JEV-NAO-MARCAR-SUGESTAO.md](etapas/ETAPA-022-0fb7545b-JEV-NAO-MARCAR-SUGESTAO.md) |

## Riscos

| Risco | Chance | Impacto | Plano B | Situação |
|---|---|---|---|---|
| Duas frentes editarem o `STATUS.md` ao mesmo tempo | Média | Conflito no push | Cada frente mexe só nas próprias linhas; sincronizar e reler antes do push | Acompanhando |

## Bloqueios gerais (sem tarefa)

| Data | Motivo | O que destrava | Resolvido em |
|---|---|---|---|

## Registro de decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-18 00:08 | Equipe no herdr: líder Opus 5.5 + até 4 sessões Claude Code em painéis (cada uma frente própria, só do seu nível); só o líder usa Git e edita o quadro; reserva da CLONE.1.3 (nuvem · s2) liberada | Gelvazio | "pode liberar e assumir, commita o .gitignore, 4 sessões" |
| 2026-10-14 08:30 | Versionar `tools/` (Ghidra 12.1.4 e instalador do JDK 21); arquivos acima de 50 MB vão pelo Git LFS | Gelvazio | "adicionei as ferramentas pra versionar tb, pra eu ter elas sempre na mão"; o GitHub recusa arquivo acima de 100 MB |
| 2026-10-14 09:23 | Adotar o template `template-inicial-tasks-ia` em tudo, inclusive o push automático na reserva e na entrega (substitui o "deixe o push pra eu fazer depois") | Gelvazio | "SIGA O TEMPLATE EM TUDO" |
| 2026-10-14 09:28 | `tools/` volta a ficar **fora do Git** (no `.gitignore`); o commit local que versionava a pasta foi desfeito antes de ir para o GitHub | Gelvazio | "removi o tools pelo ignore por enquanto"; escolheu desfazer o commit para o push não levar ~1 GB |
| 2026-10-15 23:58 | Trava no `.githooks/pre-commit` recusa reserva fora do nível do modelo da frente (todas as IAs) | Gelvazio | "faça as duas" (opção 2) |
| 2026-10-15 23:55 | Cada modelo pega **só** subtarefa do seu nível (Opus/Fable não descem mais para MEDIO/LEVE) | Gelvazio | "faça as duas" (opção 1) |
| 2026-10-15 23:50 | Ao abrir a sessão, o hook `inicializar-sessao.mjs` lista as subtarefas livres do nível do modelo e a sessão **reserva e começa a primeira sem perguntar** | Gelvazio | "lista a tarefa e ja pega ela,a proxima da lista" |
| 2026-10-15 23:30 | Quadro ganha a coluna `Modelo` (nível + modelo indicado) e o hook `exigir-reserva` passa a achar as colunas pelo título | Gelvazio (pedido) | "coloque o modelo em todas as tasks", para pegar cada uma com outro modelo em outra sessão |
| 2026-10-14 09:23 | Histórico local alinhado ao `origin/main` por **rebase** (o template proíbe `git merge`) | Gelvazio (aprovou o plano) | O GitHub já tinha o commit inicial com `LICENSE` e `README.md` |
| 2026-10-15 23:55 | Regra do graphify no REA: rodar `/graphify --update` após cada mudança e consultar o grafo (`graphify-out/`) antes de responder sobre o projeto; vale só para o REA e prevalece sobre a regra global | Gelvazio (pedido) | "adicione 1 regra no claude.md, que a cada mudança o graphify deve rodar, e a cada chat deve ser consultado o grafo" |

## Pendências (ficou para depois)

| Data | Pendência | Motivo |
|---|---|---|

## Lições aprendidas

| Data | Lição | Regra criada |
|---|---|---|
