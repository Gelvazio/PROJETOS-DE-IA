## Etapa 007-2bd3351f — SERVIDOR: Servidor local do clone (Python + FastAPI)

**Tarefa:** SERVIDOR · **Pedido em:** 2026-10-15 23:34 · **Criada por:** Claude Code (Opus 5.5) (local · main)
**Pedido:** "referente ao clone.4.1, tem como eu criar este servidor aqui local em python numa pasta
de nome server em C:\fontes\REA-APP-CLONES\apps-cloned\chaos-code ?" · respostas: "1-sim;2-sim;
3-pela tela e o admin por comando;Subdivida no maximo de tasks possiveis,pra modelos menores
poderem pegar tambem"
**Objetivo:** ter um servidor próprio, local, que faça o papel do `chaoscode.ai` para o clone:
login OAuth (com tela de cadastro), projetos, tarefas, imagens, modelos de agente e atualizador.

> Tarefa **grande** (login, tokens, banco): este é o plano. Só executar depois da aprovação do
> usuário (registrada em "Decisões").

### Escopo

- **Entra:** pasta `apps-cloned/chaos-code/server/`, Python 3.14 + FastAPI + Uvicorn + SQLite,
  porta `3000` só em `127.0.0.1`; servidor de autorização OAuth 2 com PKCE, registro dinâmico de
  cliente, troca e renovação de token, revogação e descoberta; cadastro de usuário pela tela;
  admin criado por comando (`python -m servidor criar-admin`); rotas da API vistas no original;
  `latest.json` do atualizador.
- **Não entra:** publicar na internet, HTTPS, e-mail (confirmação/recuperação de senha), testes
  automatizados novos (regra do projeto), mudar o cliente (isso é a CLONE.4/CLONE.5).
- **Critério de pronto:** `py_compile` em todos os arquivos, `import servidor.app` sem erro, rotas
  registradas conferidas contra o inventário e aceite do usuário rodando o servidor.

### Premissas

- Os campos das rotas da API e do login vêm do inventário (CLONE.1.3 e CLONE.1.5); as partes de
  OAuth seguem as RFCs (6749, 7636, 7591, 7009, 8414) e podem começar antes.
- Ambiente virtual `.venv` dentro de `server/` (fora do Git).

### Riscos

| Risco | Plano B |
|---|---|
| Original espera campos diferentes das RFCs | Ajustar os esquemas quando a CLONE.1.5 sair (subtarefa nova se for grande) |
| Senhas e tokens vazarem pelo banco ou pelo Git | Só hash no banco; `dados/` e `.venv/` no `.gitignore` |
| Muitas subtarefas mexendo no `app.py` | O `app.py` registra cada roteador uma vez; quem entrega uma rota só acrescenta 1 linha |
| Validar sem subir servidor (regra do projeto) | `py_compile` + importar o app + listar rotas; rodar fica para o aceite do usuário |

### Decisões

| Data | Decisão | Quem | Por quê |
|---|---|---|---|
| 2026-10-15 23:34 | FastAPI + SQLite; porta 3000; cadastro pela tela e admin por comando; dividir no máximo para modelos menores | Gelvazio | Respostas "1-sim;2-sim;3-pela tela e o admin por comando" |
| 2026-10-15 23:41 | **Plano aprovado** (54 subtarefas, escopo da etapa) | Gelvazio | "sim" |

### SERVIDOR.1 — Pasta, dependências e `.gitignore`

**Próximo passo:** —

- **Nível:** LEVE — configuração sem lógica · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** Nenhuma
- **Descrição:** criar `apps-cloned/chaos-code/server/` com `requirements.txt` (fastapi, uvicorn, jinja2, python-multipart, itsdangerous), pacote `servidor/` com `__init__.py` e `.gitignore` (`.venv/`, `dados/*.sqlite3`, `dados/imagens/`).
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** `apps-cloned/chaos-code/server/requirements.txt`, `server/servidor/__init__.py` e `server/.gitignore`.
- **Verificação:** `py_compile` de `servidor/__init__.py` ok (C:\Python314). O `import servidor.app` **não** passa ainda: `servidor/app.py` só existe na SERVIDOR.48. Conferir esse import quando a SERVIDOR.48 for entregue.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.2 — Constantes do servidor

**Próximo passo:** subtarefa entregue.

- **Nível:** LEVE — só constantes · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** SERVIDOR.1
- **Descrição:** `apps-cloned/chaos-code/server/servidor/constantes.py`: host `127.0.0.1`, porta `3000`, validade do código (60 s), do token de acesso (1 h) e de renovação (30 dias), nomes das tabelas, pastas de dados, rotas.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** `apps-cloned/chaos-code/server/servidor/constantes.py` (commit `feat(SERVIDOR.2)`).
- **Verificação:** `py_compile` ok (C:\Python314). O `import servidor.app` fica para a SERVIDOR.48 (o `app.py` ainda não existe).
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.3 — Mensagens das telas e erros

**Próximo passo:** —

- **Nível:** LEVE — só textos · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** SERVIDOR.1
- **Descrição:** `apps-cloned/chaos-code/server/servidor/mensagens.py`: textos de login, cadastro, consentimento e erros, em português.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** `apps-cloned/chaos-code/server/servidor/mensagens.py` com os textos das telas (login, cadastro, consentimento, erro) e das mensagens de erro, como constantes `MSG_*`.
- **Verificação:** `py_compile` de `servidor/mensagens.py` ok (C:\Python314). O `import servidor.app` **não** passa ainda: `servidor/app.py` só existe na SERVIDOR.48. Conferir quando a SERVIDOR.48 for entregue.
- **Anotação:** os textos são provisórios, em português; conferir com os textos do original (CLONE.1.10, interface embutida) quando ela for extraída.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.4 — Configuração por variável de ambiente

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — lógica simples em 1 arquivo · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** SERVIDOR.2
- **Descrição:** `apps-cloned/chaos-code/server/servidor/configuracao.py`: lê `CHAOS_SERVIDOR_*` (porta, pasta de dados, chave da sessão) com padrão das constantes; gera e guarda a chave da sessão na pasta de dados se não existir.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** commit `feat(SERVIDOR.4)` — `apps-cloned/chaos-code/server/servidor/configuracao.py` (`carregar_configuracao`, `Configuracao`).
- **Verificação:** `py_compile` ok (C:\Python314) e execução avulsa com pasta temporária: porta por variável, erro para porta inválida, chave de sessão gerada e reaproveitada. O `import servidor.app` fica para a SERVIDOR.48.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.5 — Esquemas Pydantic do OAuth

**Próximo passo:** —

- **Nível:** LEVE — só tipos (RFC 7591, 6749, 7009) · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** SERVIDOR.1
- **Descrição:** `apps-cloned/chaos-code/server/servidor/esquemas/oauth.py`: registro de cliente, resposta de token, erro OAuth.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** `apps-cloned/chaos-code/server/servidor/esquemas/oauth.py` (pedido e resposta de registro, token, revogação e erro, com `alias` nos nomes do RFC) e `esquemas/__init__.py`.
- **Verificação:** `py_compile` de `esquemas/oauth.py` e `esquemas/__init__.py` ok (C:\Python314); linhas até 100 caracteres. O `import servidor.app` **não** passa ainda (`app.py` só na SERVIDOR.48). Pydantic não está instalado nesta máquina, então a validação real dos modelos fica para a SERVIDOR.48.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.6 — Esquemas Pydantic da API

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — só tipos copiados do inventário · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** SERVIDOR.1, CLONE.1.3
- **Descrição:** `apps-cloned/chaos-code/server/servidor/esquemas/api.py`: usuário, projeto, tarefa, imagem, modelo de agente.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** commit `feat(SERVIDOR.6)` — `apps-cloned/chaos-code/server/servidor/esquemas/api.py` (36 modelos Pydantic: usuário, projeto, tarefa com meta e filtros, imagem, modelo de agente no formato `{ templates }`). Feita por Claude Code (Haiku 5.5 · herdr hk1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `py_compile` e `import servidor.esquemas.api` ok (executor e líder; Pydantic 2.13.4 já instalado); `RespostaModelosAgente.model_validate` validou os 12 modelos do seed. O `import servidor.app` fica para a SERVIDOR.48. Em aberto: campos de `UsuarioApi` (só `id`), campos *(inferido)*.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.7 — Esquema do banco (SQL)

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — SQL · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** SERVIDOR.2
- **Descrição:** `apps-cloned/chaos-code/server/servidor/banco/esquema.sql`: usuarios (com `eh_admin`), clientes_oauth, codigos_autorizacao, tokens, projetos, tarefas, imagens, modelos_agente — chaves, índices e `ON DELETE`.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** commit `feat(SERVIDOR.7)` — `apps-cloned/chaos-code/server/servidor/banco/esquema.sql`: `PRAGMA foreign_keys`, 8 tabelas STRICT idempotentes (usuarios com `eh_admin`, clientes_oauth públicos, codigos_autorizacao com S256 e uso único, tokens só com hash e família de renovação, projetos, tarefas com lixeira, imagens, modelos_agente), CHECKs, 14 índices e ON DELETE CASCADE/SET NULL. Feita por Claude Code (Opus 5.5 · herdr op3; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** esquema carregado em SQLite `:memory:` (executor e líder): 8 tabelas e 8 chaves estrangeiras; executor rodou 2× (idempotente), `integrity_check` ok, 12 inserções inválidas barradas e cascata conferida. Em aberto: listas de `situacao`/`prioridade` sem CHECK (valores não comprovados); papéis do projeto sem tabela.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.8 — Conexão e criação do banco SQLite

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — banco · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** SERVIDOR.4, SERVIDOR.7
- **Descrição:** `apps-cloned/chaos-code/server/servidor/banco/conexao.py`: abrir conexão (`foreign_keys=ON`), criar as tabelas na 1ª vez, dependência FastAPI que entrega a conexão.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** commit `feat(SERVIDOR.8)` — `apps-cloned/chaos-code/server/servidor/banco/conexao.py` (abrir conexão com `foreign_keys`, `sqlite3.Row`, WAL e `busy_timeout`; criar as tabelas pelo `esquema.sql`; `preparar_banco` para a subida; gerador que confirma, desfaz no erro e fecha; dependência FastAPI `obter_conexao`), `banco/__init__.py`, 3 constantes em `constantes.py`; o líder acrescentou `dados/*.sqlite3-*` no `server/.gitignore` (arquivos do WAL). Feita por Claude Code (Opus 5.5 · herdr op3; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `py_compile` ok; com o FastAPI só na pasta de rascunho (o Python da máquina não tem), executor e líder criaram um banco temporário: `foreign_keys`=1, `journal_mode`=wal, 8 tabelas, gerador fecha. A SERVIDOR.48 deve guardar a configuração em `app.state` e chamar `preparar_banco`.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.9 — Hash de senha (scrypt)

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — segurança · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** SERVIDOR.2
- **Descrição:** `apps-cloned/chaos-code/server/servidor/seguranca/senha.py`: `gerar_hash_senha` e `conferir_senha` com `hashlib.scrypt` e `hmac.compare_digest`.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** commit `feat(SERVIDOR.9)` — `apps-cloned/chaos-code/server/servidor/seguranca/senha.py`: `gerar_hash_senha` com `hashlib.scrypt` (N=32768, r=8, p=1, sal aleatório, `maxmem` explícito, NFKC) no formato `scrypt$n$r$p$sal$hash`; `conferir_senha` com `hmac.compare_digest` (hash mal formado → False); senha vazia/longa recusada; `precisa_refazer_hash`. Constantes no topo do módulo. Feita por Claude Code (Opus 5.5 · herdr op3; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `py_compile` e import ok; executor: ~100 ms por hash, certa/errada, sal diferente, 9 formas de adulteração → False, limites → `ValueError`; líder conferiu tempo (0,10 s), certa/errada e hash lixo.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.10 — Geração e hash de tokens

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — segredos · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** SERVIDOR.2
- **Descrição:** `apps-cloned/chaos-code/server/servidor/seguranca/tokens.py`: `secrets.token_urlsafe` e SHA-256 (no banco só o hash).
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** commit `feat(SERVIDOR.10)` — `apps-cloned/chaos-code/server/servidor/seguranca/tokens.py` (tokens com `secrets.token_urlsafe`: acesso 43, renovação 64, código 43, CSRF 43, família 22, sem prefixo; hash SHA-256 hex para o banco; comparação em tempo constante com filtro de formato; expiração em segundos Unix com relógio injetável), `seguranca/__init__.py` e bloco de constantes em `constantes.py`. Feita por Claude Code (Opus 5.5 · herdr op2; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `py_compile` ok; executor gerou 1000 tokens de cada tipo (todos distintos, tamanhos e alfabeto certos) e conferiu hash, comparação e expiração; líder importou o módulo e conferiu token certo/errado.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.11 — Conferência do PKCE (S256)

**Próximo passo:** —

- **Nível:** PESADO — segurança · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** SERVIDOR.2
- **Descrição:** `apps-cloned/chaos-code/server/servidor/seguranca/pkce.py`: confere `code_verifier` contra `code_challenge` (RFC 7636).
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.12 — Proteção CSRF dos formulários

**Próximo passo:** —

- **Nível:** PESADO — segurança · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** SERVIDOR.10
- **Descrição:** `apps-cloned/chaos-code/server/servidor/seguranca/csrf.py`: gerar e conferir o token escondido dos formulários.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.13 — Limite de tentativas de login

**Próximo passo:** —

- **Nível:** PESADO — segurança · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** SERVIDOR.2
- **Descrição:** `apps-cloned/chaos-code/server/servidor/seguranca/limite_tentativas.py`: bloqueio temporário por usuário/IP após N erros.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.14 — Repositório de usuários

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — SQL · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** SERVIDOR.8, SERVIDOR.9
- **Descrição:** `apps-cloned/chaos-code/server/servidor/banco/usuarios_repositorio.py`: criar, buscar por e-mail/id, conferir senha.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Anotação:** (líder, da SERVIDOR.9) quando o e-mail não existe, conferir a senha contra um hash falso fixo para o tempo de resposta ficar igual (evita descobrir e-mails pelo tempo).
- **Entrega:** commit `feat(SERVIDOR.14)` — `apps-cloned/chaos-code/server/servidor/banco/usuarios_repositorio.py`: criar (e-mail normalizado e único sem diferenciar maiúsculas, hash scrypt, `eh_admin`), buscar por e-mail/id (dataclass sem hash), `autenticar_usuario` com hash falso quando o e-mail não existe (tempo igual), `registrar_ultimo_login`, `definir_admin`; SQL parametrizado; `ErroEmailJaCadastrado`. Feita por Claude Code (Opus 5.5 · herdr op3; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `py_compile` ok; executor e líder importaram com banco `:memory:` criado pelo esquema (FastAPI do rascunho da SERVIDOR.8); executor: e-mail repetido em outra caixa recusado, 5 e-mails inválidos, senha certa/errada, tempo senha errada × e-mail inexistente com diferença ≤ 1% (mediana de 7), injeção de SQL no e-mail não quebra.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.15 — Repositório de clientes OAuth

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — SQL · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** SERVIDOR.8
- **Descrição:** `apps-cloned/chaos-code/server/servidor/banco/clientes_repositorio.py`: registrar e buscar cliente, conferir `redirect_uri`.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** commit `feat(SERVIDOR.15)` — `apps-cloned/chaos-code/server/servidor/banco/clientes_repositorio.py`: registrar cliente público (redirect só loopback `127.0.0.1`/`[::1]`, `authorization_code` obrigatório, só `code`, sem segredo), buscar por `client_id` e `conferir_redirect` com igualdade exata exceto a porta do loopback (RFC 8252 §7.3). Feita por Claude Code (Opus 5.5 · herdr op3; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `py_compile` ok (executor e líder); conferência com banco `:memory:`: registrar e buscar, redirect certo/outra porta/sem porta aceitos, 10 formas de redirect malicioso ou diferente recusadas, 8 registros inválidos recusados.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.16 — Repositório de códigos de autorização

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — SQL · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** SERVIDOR.8, SERVIDOR.10
- **Descrição:** `apps-cloned/chaos-code/server/servidor/banco/codigos_repositorio.py`: criar e consumir uma vez só, com validade.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** commit `feat(SERVIDOR.16)` — `apps-cloned/chaos-code/server/servidor/banco/codigos_repositorio.py`: repositório dos códigos de autorização (guarda só o hash, uso único, código inutilizado antes de conferir client_id, redirect_uri e PKCE, `apagar_codigos_vencidos`), no padrão do repositório de clientes (SERVIDOR.15). Feita por Claude Code (Opus 5.5 · herdr op3; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `py_compile` ok (executor e líder, C:\Python314); 305 linhas, nenhuma acima de 100. Em aberto: ligar código e família de tokens para revogar no reuso (SERVIDOR.17/36) e chamar `apagar_codigos_vencidos` na SERVIDOR.35 ou na subida do app (SERVIDOR.48).
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.17 — Repositório de tokens

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — SQL + segredos · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** SERVIDOR.8, SERVIDOR.10
- **Descrição:** `apps-cloned/chaos-code/server/servidor/banco/tokens_repositorio.py`: criar par acesso/renovação, buscar pelo hash, girar a renovação, revogar.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** commit `feat(SERVIDOR.17)` — `apps-cloned/chaos-code/server/servidor/banco/tokens_repositorio.py`: tokens de acesso e de renovação guardados só pelo hash, família por login, giro da renovação com detecção de reuso (RFC 9700: reuso derruba a família), revogação por token, família e cliente, `apagar_tokens_vencidos`. Feita por Claude Code (Opus 5.5 · herdr op3; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `py_compile` ok (executor e líder, C:\Python314); conferência em Python com SQLite temporário (executor). Em aberto: renovações em paralelo derrubam a família (plano B: janela de tolerância), sem prazo máximo absoluto da sessão, chamar `apagar_tokens_vencidos` na SERVIDOR.48.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.18 — Repositório de projetos

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — SQL · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** SERVIDOR.8, SERVIDOR.6
- **Descrição:** `apps-cloned/chaos-code/server/servidor/banco/projetos_repositorio.py`: CRUD filtrado pelo dono.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** commit `feat(SERVIDOR.18)` — `apps-cloned/chaos-code/server/servidor/banco/projetos_repositorio.py`: CRUD de projetos por dono (outro dono não vê nem altera), paginação, validações (nome até 200, descrição até 5000, página 50/200 — *provisórios*, constantes no topo), apagar leva tarefas e imagens junto. Feita por Claude Code (Opus 5.5 · herdr op4; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `py_compile` ok (executor e líder, C:\Python314); conferência em Python com SQLite temporário (dono, injeção de SQL, entradas inválidas, cascata). Em aberto: arquivos de `dados/imagens/` precisam ser apagados pela rota (SERVIDOR.41/20); `role`, `project_role_*` e `permissions` são montados na rota (SERVIDOR.40/41).
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.19 — Repositório de tarefas

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — SQL · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** SERVIDOR.18
- **Descrição:** `apps-cloned/chaos-code/server/servidor/banco/tarefas_repositorio.py`: CRUD dentro do projeto do dono.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** commit `feat(SERVIDOR.19)` — `apps-cloned/chaos-code/server/servidor/banco/tarefas_repositorio.py`: criar, buscar, listar com filtros (status, priority, tags) e paginação, contar, alterar só os campos enviados, lixeira com restauração em até 7 dias e limpeza da lixeira vencida; dono conferido pelo projeto em todo SQL; datas de início e conclusão automáticas pela situação. Feita por Claude Code (Opus 5.5 · herdr op4; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `py_compile` ok (executor e líder); conferência em Python do executor com SQLite temporário.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.20 — Repositório de imagens

**Próximo passo:** —

- **Nível:** PESADO — SQL · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** SERVIDOR.18
- **Descrição:** `apps-cloned/chaos-code/server/servidor/banco/imagens_repositorio.py`: metadados no banco, arquivo em `dados/imagens/`.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.21 — Repositório de modelos de agente

**Próximo passo:** —

- **Nível:** PESADO — SQL · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** SERVIDOR.8, SERVIDOR.6
- **Descrição:** `apps-cloned/chaos-code/server/servidor/banco/modelos_agente_repositorio.py`: listar, criar, editar, remover.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.22 — Dados iniciais dos modelos de agente

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — só JSON copiado do inventário · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** CLONE.1.8
- **Descrição:** apps-cloned/chaos-code/server/dados_iniciais/modelos_agente.json.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** commit `feat(SERVIDOR.22)` — `apps-cloned/chaos-code/server/dados_iniciais/modelos_agente.json` (objeto `{ templates: [...] }` com os 12 modelos do inventário, sem renomear campos). Feita por Claude Code (Haiku 5.5 · herdr hk1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `json.load` ok; executor e líder compararam com `modelos-agente-embutidos.json`: lista idêntica (12 modelos, `systemPrompt` iguais). O `import servidor.app` do critério fica para quando o `app.py` existir (SERVIDOR.48). Anotação para a SERVIDOR.21/23: o `api.md` chama o título de `name`, os embutidos usam `title`; decidir o mapeamento na rota.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.23 — Carga dos dados iniciais

**Próximo passo:** —

- **Nível:** MEDIO — 1 função · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** SERVIDOR.21, SERVIDOR.22
- **Descrição:** `apps-cloned/chaos-code/server/servidor/banco/carga_inicial.py`: insere os modelos se a tabela estiver vazia.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.24 — Sessão do navegador (cookie assinado)

**Próximo passo:** —

- **Nível:** PESADO — login · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** SERVIDOR.4, SERVIDOR.14
- **Descrição:** `apps-cloned/chaos-code/server/servidor/seguranca/sessao.py`: entrar/sair na sessão (`SessionMiddleware`), `HttpOnly`, `SameSite=Lax`, usuário logado da sessão.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.25 — Autenticação Bearer da API

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — login · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** SERVIDOR.17
- **Descrição:** `apps-cloned/chaos-code/server/servidor/seguranca/autenticacao.py`: dependência que lê `Authorization: Bearer`, confere o token e devolve o usuário (401 com `WWW-Authenticate`).
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** commit `feat(SERVIDOR.25)` — `apps-cloned/chaos-code/server/servidor/seguranca/autenticacao.py` (dependência FastAPI que lê `Authorization: Bearer`, confere o token de acesso pelo hash e devolve usuário, cliente e escopo; `obter_usuario_atual`) e `apps-cloned/chaos-code/server/servidor/rotas/erros.py` (401 `invalid_token` com `WWW-Authenticate`). Feita por Claude Code (Opus 5.5 · herdr op3; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `py_compile` ok (executor e líder); conferência em Python do executor (token certo, sem cabeçalho/Basic, 8 recusas, usuário apagado). Em aberto: a SERVIDOR.48 precisa chamar `registrar_tratadores_de_erro` e guardar `app.state.configuracao`; escopo `mcp:*` não é conferido aqui.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.26 — Exigir administrador

**Próximo passo:** —

- **Nível:** PESADO — papéis/permissões · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** SERVIDOR.25
- **Descrição:** `apps-cloned/chaos-code/server/servidor/seguranca/admin.py`: dependência que recusa (403) quem não é admin.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.27 — Tokens de tema (CSS)

**Próximo passo:** —

- **Nível:** LEVE — só CSS `:root` · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** SERVIDOR.1
- **Descrição:** apps-cloned/chaos-code/server/servidor/estaticos/estilo.css (cores do Chaos Code quando a CLONE.1.10 sair; até lá, neutras).
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** `apps-cloned/chaos-code/server/servidor/estaticos/estilo.css` com os tokens em `:root` (cores, fontes, espaçamentos, raio, largura do cartão).
- **Verificação:** o critério de `py_compile` não se aplica a CSS; conferido por leitura (sem validador de CSS nesta máquina). Cores neutras até a CLONE.1.10.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.28 — Modelo base das telas (`base.html`)

**Próximo passo:** —

- **Nível:** LEVE — só HTML Jinja · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** SERVIDOR.27
- **Descrição:** `apps-cloned/chaos-code/server/servidor/telas/base.html`: estrutura semântica, link do CSS, bloco de mensagem.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** `apps-cloned/chaos-code/server/servidor/telas/base.html` (`header`, `main`, `footer`, blocos `titulo` e `conteudo`, mensagem com `role="alert"`, sem estilo nem script inline).
- **Verificação:** o `py_compile` não se aplica a HTML; conferido por leitura e busca de `style=` e `onclick` (nenhum). O `import servidor.app` fica para a SERVIDOR.48. Renderização real só depois da SERVIDOR.48.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.29 — Tela de login (`login.html`)

**Próximo passo:** —

- **Nível:** LEVE — só HTML · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** SERVIDOR.28, SERVIDOR.3
- **Descrição:** `apps-cloned/chaos-code/server/servidor/telas/login.html`: e-mail, senha, campo CSRF, link para cadastro.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** `apps-cloned/chaos-code/server/servidor/telas/login.html` (estende `base.html`; e-mail, senha, campo `csrf_token` oculto, link para cadastro). Os textos vêm de `textos` (as constantes `MSG_LOGIN_*` de `mensagens.py`, que a rota passa no contexto) e os endereços de `endereco_login`, `endereco_cadastro` e `token_csrf`, também do contexto.
- **Verificação:** `py_compile` não se aplica a HTML; conferido por leitura e busca de `style=`/`onclick` (nenhum). A rota que monta o contexto é da SERVIDOR.32/35; renderização real depois da SERVIDOR.48.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.30 — Tela de cadastro (`cadastro.html`)

**Próximo passo:** —

- **Nível:** LEVE — só HTML · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** SERVIDOR.28, SERVIDOR.3
- **Descrição:** `apps-cloned/chaos-code/server/servidor/telas/cadastro.html`: nome, e-mail, senha, confirmação, campo CSRF.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** `apps-cloned/chaos-code/server/servidor/telas/cadastro.html` (estende `base.html`; nome, e-mail, senha, confirmação, `csrf_token` oculto, link para o login). Textos de `textos` (`MSG_CADASTRO_*`, `MSG_LOGIN_*`) e endereços/token do contexto, como na SERVIDOR.29.
- **Verificação:** `py_compile` não se aplica a HTML; conferido por leitura e busca de `style=`/`onclick` (nenhum). Renderização real depois da SERVIDOR.48.
- **Anotação:** o rótulo "Confirmar senha" está fixo no HTML; não há constante para ele em `mensagens.py`. Anotado para revisar se a SERVIDOR.3 for ajustada.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.31 — Tela de consentimento e de erro

**Próximo passo:** —

- **Nível:** LEVE — só HTML · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** SERVIDOR.28, SERVIDOR.3
- **Descrição:** `apps-cloned/chaos-code/server/servidor/telas/consentimento.html` e `apps-cloned/chaos-code/server/servidor/telas/erro.html`.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** `apps-cloned/chaos-code/server/servidor/telas/consentimento.html` (permitir/negar, com campos ocultos do OAuth: `client_id`, `redirect_uri`, `state`, `code_challenge` S256) e `apps-cloned/chaos-code/server/servidor/telas/erro.html` (mensagem e link de volta). Ambos estendem `base.html`.
- **Verificação:** `py_compile` não se aplica a HTML; conferido por leitura e busca de `style=`/`onclick` (nenhum). Renderização real depois da SERVIDOR.48.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.32 — Rota de cadastro pela tela

**Próximo passo:** —

- **Nível:** PESADO — criação de usuário · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** SERVIDOR.12, SERVIDOR.14, SERVIDOR.30
- **Descrição:** `apps-cloned/chaos-code/server/servidor/rotas/cadastro.py`: GET mostra, POST valida (e-mail único, senha mínima) e cria usuário comum (nunca admin).
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.33 — Descoberta OAuth (`.well-known`)

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — JSON fixo de metadados · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** SERVIDOR.2
- **Descrição:** `apps-cloned/chaos-code/server/servidor/rotas/descoberta.py`: `/.well-known/oauth-authorization-server` (RFC 8414).
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** commit `feat(SERVIDOR.33)` — `server/servidor/rotas/descoberta.py` (`montar_metadados`, rota `/.well-known/oauth-authorization-server`), `rotas/__init__.py` e 6 constantes OAuth em `constantes.py`.
- **Verificação:** `py_compile` ok (C:\Python314). O FastAPI não está instalado nesta máquina, então o import do roteador e o `import servidor.app` ficam para a SERVIDOR.48 / aceite.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.34 — Registro de cliente (`/api/oauth/register`)

**Próximo passo:** —

- **Nível:** PESADO — login · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** SERVIDOR.5, SERVIDOR.15
- **Descrição:** `apps-cloned/chaos-code/server/servidor/rotas/oauth_registro.py` (RFC 7591, só cliente público).
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.35 — Autorização (`/authorize`)

**Próximo passo:** —

- **Nível:** PESADO — login · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** SERVIDOR.11, SERVIDOR.12, SERVIDOR.13, SERVIDOR.16, SERVIDOR.24, SERVIDOR.29, SERVIDOR.31
- **Descrição:** `apps-cloned/chaos-code/server/servidor/rotas/oauth_autorizacao.py`: confere cliente/`redirect_uri`/PKCE, pede login e consentimento, devolve `code` + `state`.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.36 — Token: troca do código (`authorization_code`)

**Próximo passo:** —

- **Nível:** PESADO — login · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** SERVIDOR.16, SERVIDOR.17, SERVIDOR.11
- **Descrição:** `apps-cloned/chaos-code/server/servidor/rotas/oauth_token.py`: confere código, PKCE e cliente; devolve tokens.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.37 — Token: renovação (`refresh_token`)

**Próximo passo:** —

- **Nível:** PESADO — login · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** SERVIDOR.36
- **Descrição:** no mesmo `apps-cloned/chaos-code/server/servidor/rotas/oauth_token.py`: gira a renovação e invalida a antiga.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.38 — Revogação (`/api/oauth/revoke`)

**Próximo passo:** nenhum — concluída.

- **Nível:** PESADO — login · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** SERVIDOR.17
- **Descrição:** `apps-cloned/chaos-code/server/servidor/rotas/oauth_revogacao.py` (RFC 7009).
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** commit `feat(SERVIDOR.38)` — `apps-cloned/chaos-code/server/servidor/rotas/oauth_revogacao.py`: `POST /api/oauth/revoke` (RFC 7009) com corpo JSON (como o cliente da CLONE.4.9) ou formulário; exige `token` e `client_id` (senão 400 `invalid_request`); só o cliente dono revoga e revogar a renovação derruba a família; responde 200 sem corpo com `Cache-Control: no-store` mesmo para token desconhecido, já revogado ou de outro cliente; ignora `token_type_hint`. `esquemas/oauth.py`: `PedidoRevogacao` ganhou `id_cliente` (alias `client_id`, opcional). Feita por Claude Code (Opus 5.5 · herdr op3; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `py_compile` ok (executor e líder); conferência do executor com TestClient e SQLite temporário (5 casos de 200 e 8 de 400). `import servidor.app` só depois da SERVIDOR.48, que também precisa registrar este roteador e os tratadores de erro.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.39 — Erros padronizados

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — 1 arquivo · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** SERVIDOR.5
- **Descrição:** `apps-cloned/chaos-code/server/servidor/rotas/erros.py`: formato `{"error", "error_description"}` no OAuth e JSON simples na API, sem vazar detalhes internos.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** commit `feat(SERVIDOR.39)` — `server/servidor/rotas/erros.py` (`ErroServidor`, `montar_corpo_erro`, `registrar_tratadores_de_erro`) e `PREFIXO_ROTAS_OAUTH` em `constantes.py`.
- **Verificação:** `py_compile` ok (C:\Python314). FastAPI não instalado aqui: o import do módulo e o `import servidor.app` ficam para a SERVIDOR.48 / aceite. Formato da API (`{"error","message"}`) é provisório até o inventário CLONE.1.3.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.40 — Rota do usuário (`/api/oauth/user/projects`)

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — 1 rota · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** SERVIDOR.18, SERVIDOR.25
- **Descrição:** `apps-cloned/chaos-code/server/servidor/rotas/api_usuario.py`.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** commit `feat(SERVIDOR.40)` — `apps-cloned/chaos-code/server/servidor/rotas/api_usuario.py`: `GET /api/oauth/user/projects` com Bearer (`obter_usuario_atual`), lista os projetos do dono por nome (até `LIMITE_MAXIMO_LISTAGEM` = 200, sem paginação) montados por `montar_projeto_api`, resposta `RespostaProjetos` = `{"projects": [...]}` sem envelope `success` *(inferido: o 2º campo de `ApiProjectsResponse` não foi identificado)*. Feita por Claude Code (Sonnet 5.5 · executor-medio; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** Líder conferiu: `py_compile` ok e nenhuma linha acima de 100 (contagem em caracteres pelo Python); sem TestClient. A SERVIDOR.48 faz o `include_router(api_usuario.roteador)`.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.41 — Rotas de projetos (`/api/projects/...`)

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — 1 arquivo de rotas · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** SERVIDOR.18, SERVIDOR.25
- **Descrição:** `apps-cloned/chaos-code/server/servidor/rotas/api_projetos.py`.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** commit `feat(SERVIDOR.41)` — `apps-cloned/chaos-code/server/servidor/rotas/api_projetos.py` (5 rotas com Bearer: GET/POST `/api/projects` com `limit`/`offset` e `{success, data, meta}`, GET/PATCH/DELETE `/api/projects/{id}`; outro dono ou id que não é UUID → 404; inválidos → 400; DELETE apaga também imagem e miniatura em `dados/imagens/`, ignorando caminhos que saem da pasta), `apps-cloned/chaos-code/server/servidor/rotas/montagem_projeto.py` (`montar_projeto_api`: papel de dono, `project_role_*` e `permissions` *(inferidos)*, reaproveitável pela SERVIDOR.40) e 4 classes novas em `apps-cloned/chaos-code/server/servidor/esquemas/api.py`. Feita por Claude Code (Sonnet 5.5 · herdr sn1; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** `py_compile` ok nos 3 arquivos (executor e líder), linhas 1 e 7 de `api_projetos.py` passam de 100 (correção na SERVIDOR.55); conferência do executor com TestClient e SQLite em memória (criar 201, 400, meta, PATCH, 404 de outro dono, DELETE 204 com arquivos e cascata). Em aberto: SERVIDOR.48 faz o `include_router` e preenche `app.state.configuracao`; trocar a leitura direta da tabela `imagens` por função da SERVIDOR.20 quando ela existir.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.42 — Rotas de tarefas

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — 1 arquivo de rotas · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** SERVIDOR.19, SERVIDOR.25
- **Descrição:** `apps-cloned/chaos-code/server/servidor/rotas/api_tarefas.py`.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** commit `feat(SERVIDOR.42)` — `apps-cloned/chaos-code/server/servidor/rotas/api_tarefas.py`: 6 rotas com Bearer e envelope `{success, data, meta}` — GET/POST `/api/projects/{p}/tasks` (filtros `status`, `priority`, `tags` repetidas ou com vírgula, `limit`/`offset`, `meta` com total), GET/PATCH/DELETE `/api/projects/{p}/tasks/{id}` (PATCH só os campos enviados, DELETE 204 para a lixeira) e POST `.../restore`; 404 para projeto/tarefa de outro dono, na lixeira ou id inválido; 400 com a mensagem do repositório; datas em ISO 8601 UTC. Esquemas já existiam em `esquemas/api.py`. Feita por Claude Code (Sonnet 5.5 · executor-medio; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** Líder conferiu: `py_compile` ok, nenhuma linha acima de 100 e nenhuma função acima de 45 linhas (contagem por `ast`); sem TestClient. A SERVIDOR.48 faz o `include_router(api_tarefas.roteador)`.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.43 — Rotas de imagens (enviar e baixar)

**Próximo passo:** —

- **Nível:** MEDIO — 1 arquivo de rotas · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** SERVIDOR.20, SERVIDOR.25
- **Descrição:** `apps-cloned/chaos-code/server/servidor/rotas/api_imagens.py` (limite de tamanho e tipo).
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.44 — Rota de modelos de agente (`/api/client/agent-templates`)

**Próximo passo:** —

- **Nível:** MEDIO — 1 rota · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** SERVIDOR.21, SERVIDOR.25
- **Descrição:** `apps-cloned/chaos-code/server/servidor/rotas/api_modelos_agente.py` (leitura).
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.45 — Rotas de admin dos modelos de agente

**Próximo passo:** —

- **Nível:** PESADO — permissão de admin · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** SERVIDOR.21, SERVIDOR.26
- **Descrição:** `apps-cloned/chaos-code/server/servidor/rotas/admin_modelos_agente.py`: criar, editar, remover.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.46 — Exemplo de `latest.json`

**Próximo passo:** —

- **Nível:** LEVE — só JSON · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** SERVIDOR.1
- **Descrição:** apps-cloned/chaos-code/server/dados_iniciais/latest.json no formato do atualizador.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** `apps-cloned/chaos-code/server/dados_iniciais/latest.json` (campos `version`, `notes`, `pub_date`, `platforms`, igual ao `LatestJson` da CLONE.12.1).
- **Verificação:** JSON carregado com `json.load` (C:\Python314): ok, versão `0.2.0`, plataforma `windows-x86_64`. A assinatura é um marcador de exemplo, não válida: não serve para a CLONE.12.4 conferir de verdade.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.47 — Rota do atualizador (`/releases/latest.json`)

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — 1 rota · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** SERVIDOR.4, SERVIDOR.46
- **Descrição:** `apps-cloned/chaos-code/server/servidor/rotas/atualizador.py`: entrega o arquivo da pasta de dados.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Entrega:** commit `feat(SERVIDOR.47)` — `server/servidor/rotas/atualizador.py` (`entregar_manifesto`, `localizar_manifesto`, `ler_manifesto`) e 2 constantes em `constantes.py`.
- **Verificação:** `py_compile` ok (C:\Python314). A rota espera `app.state.configuracao` (a fábrica da SERVIDOR.48 deve preencher). FastAPI não instalado aqui: `import servidor.app` fica para a SERVIDOR.48 / aceite.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.48 — Fábrica do app FastAPI

**Próximo passo:** —

- **Nível:** MEDIO — liga as rotas · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** SERVIDOR.8, SERVIDOR.24, SERVIDOR.39
- **Descrição:** `apps-cloned/chaos-code/server/servidor/app.py`: `criar_app()` com middlewares, estáticos, telas e um `include_router` por arquivo de `rotas/` (as rotas que ainda não existirem entram quando forem entregues).
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **Anotação:** (líder, das SERVIDOR.8 e 14) na subida: `app.state.configuracao = carregar_configuracao()`, `preparar_banco(configuracao.caminho_banco)` e `obter_hash_falso()` (aquece o hash falso para o 1º login ter o tempo igual). O FastAPI não está instalado no Python da máquina: criar o `.venv` com o `requirements.txt` (SERVIDOR.50/51).
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.49 — Comando `criar-admin`

**Próximo passo:** —

- **Nível:** PESADO — cria administrador · **Modelo:** Claude Code Opus 5.5 ou superior, ou Fable (só eles)
- **Depende de:** SERVIDOR.14
- **Descrição:** `apps-cloned/chaos-code/server/servidor/comandos/criar_admin.py`: pede e-mail e senha (`getpass`), cria ou promove a admin.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.50 — Ponto de entrada (`python -m servidor`)

**Próximo passo:** —

- **Nível:** MEDIO — 1 arquivo · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** SERVIDOR.48, SERVIDOR.49
- **Descrição:** `apps-cloned/chaos-code/server/servidor/__main__.py`: sem argumento sobe o Uvicorn em `127.0.0.1:3000`; `criar-admin` chama o comando.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.51 — Scripts de iniciar (Windows)

**Próximo passo:** —

- **Nível:** LEVE — script simples · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** SERVIDOR.50
- **Descrição:** apps-cloned/chaos-code/server/iniciar.ps1 e criar-admin.ps1 (criam a `.venv` se faltar).
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.52 — README do servidor

**Próximo passo:** —

- **Nível:** LEVE — só `.md` · **Modelo:** Claude Code Haiku 5.5 (ou Gemini Flash, Grok rápido, DeepSeek Flash, Antigravity, Codex, Cursor, Devin)
- **Depende de:** SERVIDOR.51
- **Descrição:** apps-cloned/chaos-code/server/README.md: instalar, rodar, criar admin, rotas e variáveis.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.53 — Conferência final do servidor

**Próximo passo:** —

- **Nível:** MEDIO — revisão de várias partes · **Modelo:** Claude Code Sonnet 5.5 (ou Gemini Pro, Grok principal, DeepSeek de raciocínio, Codex, Cursor)
- **Depende de:** SERVIDOR.32 a SERVIDOR.52
- **Descrição:** importar o app, listar as rotas registradas e conferir contra o inventário (CLONE.1.3, CLONE.1.5); `py_compile` em todos os arquivos.
- **Critérios de Aceitação:** `python -m py_compile` no arquivo e `python -c "import servidor.app"` em `server/`.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.54 — Aceite do usuário

**Próximo passo:** —

- **Nível:** LEVE — o usuário roda e confirma · **Modelo:** Usuário (não é tarefa de IA)
- **Depende de:** SERVIDOR.53
- **Descrição:** o usuário roda `iniciar.ps1`, cadastra pela tela, cria o admin por comando e confirma.
- **Critérios de Aceitação:** o usuário confirma.
- **JEV-AI-SUGGESTION:** NAO

### SERVIDOR.55 — Linhas longas no `api_projetos.py` (correção da SERVIDOR.41)

**Próximo passo:** nenhum — concluída.

- **Nível:** MEDIO — código Python (1 arquivo) · **Modelo:** Claude Code Sonnet 5.5
- **Depende de:** SERVIDOR.41
- **Descrição:** criada em 2026-10-18 07:27 pelo líder (C26) — na entrega da SERVIDOR.41 a verificação
- **JEV-AI-SUGGESTION:** NAO
  registrou "nenhuma linha acima de 100", mas as linhas 1 e 7 de `api_projetos.py` passam de 100
  caracteres (o líder gravou o texto antes de ler a contagem).
- **Critérios de Aceitação:** `py_compile` ok e nenhuma linha acima de 100 no arquivo.
- **Entrega:** commit `feat(SERVIDOR.55)` — `apps-cloned/chaos-code/server/servidor/rotas/api_projetos.py`: linhas 1 e 7 do docstring do topo quebradas para caber em 100 caracteres; só o texto do docstring mudou. Feita por Claude Code (Sonnet 5.5 · executor-medio; líder Opus 5.5) (local · main), 2026-10-18.
- **Verificação:** Líder conferiu depois da correção: `py_compile` ok e contagem em caracteres pelo Python sem nenhuma linha acima de 100.
