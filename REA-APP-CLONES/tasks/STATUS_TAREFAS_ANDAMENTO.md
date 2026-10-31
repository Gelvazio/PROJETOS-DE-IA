# Status das tarefas em andamento (equipe herdr)

Gerado em 2026-10-18 07:01 porque os créditos da conta vão acabar. Cada agente acrescentou
a própria seção abaixo: subtarefa, o que já foi feito (arquivos), o que falta e o próximo passo.
Quem retomar: leia a seção do agente e continue de onde parou (as reservas estão no `STATUS.md`).


## sn1 (Claude Code Sonnet 5.5 · herdr sn1) — CLONE.7.7: Resumo das comunidades
- **Situação:** pronta
- **Feito:** `apps-cloned/chaos-code/src/main/grafo/resumo-comunidades.ts` criado. `resumirComunidades(grafo, entidades, { completarLlm?, gerarEmbeddings? })` completa a saída de `detectarComunidades`: resumo por LLM (com 4 pedidos ao mesmo tempo, mantendo o resumo "Grupo temático contendo: …" se falhar) e `summary_embedding` em lotes de 150. Entrada não é alterada; sem dependências devolve igual.
- **Verificação feita:** `npm run build` ok. `npm run typecheck` sem erro no arquivo; acusou erros só em `atualizador.canais.ts` e `imagem.canais.ts` (de outros agentes em andamento). Conferência por node/esbuild com LLM e embeddings falsos: 1 resumo por LLM, 2 falhas mantendo o resumo, embeddings nas 3 comunidades, `null` quando o gerador falha ou devolve quantidade errada, entrada intacta.
- **Falta:** ligar `resumirComunidades` ao pipeline de sincronização (gravação do `communities.json`). O prompt de resumo com LLM é escolha do clone (o inventário só traz o resumo sem LLM).
- **Próximo passo:** o líder rodar `npm run typecheck` quando os outros agentes terminarem, registrar a entrega da CLONE.7.7 e fazer o commit.

## sn2 (Claude Code Sonnet 5.5) — CLONE.9.5: Detectar o WSL e o IP
- **Situação:** pronta
- **Feito:** `apps-cloned/chaos-code/src/main/wsl/deteccao.ts` criado: `detectarWslInstalado`, `listarDistrosRodando`, `detectarIpHostWindows` (mirrored = 127.0.0.1; senão IP do adaptador WSL no netsh, em inglês e português), `verificarStatusWsl` (campos de `check_wsl_status`), `ErroDeteccaoWsl`. Processo e arquivos injetados, sem shell. Nenhum outro arquivo alterado.
- **Verificação feita:** `npm run typecheck` e `npm run build` em apps-cloned/chaos-code sem erro; conferência por node (esbuild, dependências falsas) com netsh em inglês/português, mirrored, netsh com falha, fora do Windows e aviso dispensado; nenhuma linha acima de 100 caracteres.
- **Falta:** nada da subtarefa. Quadro (STATUS.md, etapa, commit) é do líder.
- **Próximo passo:** líder conferir, mover a linha para task_complete.md e commitar. Em aberto: regra de `localhost_forwarding` é inferida (true, salvo `localhostForwarding=false` no .wslconfig); passos 5 e 6 do WSL ficam para CLONE.9.6.

## sn3 — CLONE.11.4: Canais IPC de imagem
- **Situação:** pronta
- **Feito:** criados `src/compartilhado/tipos-ipc-imagem.ts` (ApiImagem e tipos do pedido e do resultado), `src/main/imagem/imagem.servico.ts` (ServicoImagem: configuração com chaves mascaradas pelo cofre, geração Gemini e gravação no projeto) e `src/main/imagem/imagem.canais.ts` (registrarCanaisImagem com validação). Alterados, com edições mínimas: `compartilhado/constantes.ts` (3 canais imagem:*), `main/canais.ts` (servicoImagem no ContextoCanais e registro), `main/principal.ts` (montarServicoImagem com safeStorage), `preload/preload.ts` (3 funções e ApiImagem no ApiExposta) e `renderer/global.d.ts` (& ApiImagem). Tudo em apps-cloned/chaos-code.
- **Verificação feita:** `npm run typecheck` sem erro; `npm run build` concluído; conferência por node (esbuild) com cofre, disco, rede e ipc falsos: chave completa só no cofre, máscara devolvida não sobrescreve a chave, gravação .tmp + renomear, entradas erradas devolvem { erro }.
- **Falta:** nada da subtarefa. Fora do escopo: nenhuma tela usa os canais ainda; só o Gemini local está ligado (openai e platform só são guardados). O global.d.ts importa ApiAtualizador (CLONE.12.7, outro agente) mas a linha Window ainda não o inclui.
- **Próximo passo:** o líder confere, faz commit de CLONE.11.4 (arquivos acima) e atualiza o quadro; a tela de Configurações (CLONE.13.x) passa a usar obterConfiguracaoImagem, definirConfiguracaoImagem e gerarImagem.

## sn4 — CLONE.12.7: Canais IPC do atualizador
- **Situação:** pronta
- **Feito:** criados `src/compartilhado/tipos-ipc-atualizador.ts` (ApiAtualizador, evento de progresso), `src/main/atualizador/atualizador.servico.ts` (ServicoAtualizador: verificar, baixarEInstalar, cancelar, salvarEstadoPre, obterHistorico, confirmarNaAbertura, progresso), `atualizador.canais.ts` (5 canais + evento) e `atualizador.fabrica.ts` (dependências reais). Alterados com edições pequenas: `constantes.ts` (6 nomes em CANAIS_IPC), `main/canais.ts` (servicoAtualizador), `main/principal.ts` (monta o serviço e confirma a versão ao abrir), `preload/preload.ts` e `renderer/global.d.ts` (& ApiAtualizador). Antes, na mesma sessão: CLONE.7.3 (`grafo/cliente-llm.ts`) e CLONE.7.8 (`grafo/transformar-consulta.ts`), ambas prontas.
- **Verificação feita:** `npm run typecheck` e `npm run build` em apps-cloned/chaos-code sem erro; linhas <= 100; conferência por node (esbuild) com ipc falso e arquivo real temporário: 5 canais, erros viram { erro }, falha fechada com chave inválida, histórico gravado e boot_count somado.
- **Falta:** get/set_update_config e get_update_channel (sem módulo de preferências); reiniciar o app após instalar; `CHAVE_PUBLICA_ATUALIZACAO` ainda é marcador; Electron não foi aberto.
- **Próximo passo:** o líder conferir, commitar `feat(CLONE.12.7)` com o quadro e mover a linha para task_complete.md.

## op4 — SERVIDOR.19: Repositório de tarefas
- **Situação:** pronta (falta só o commit do líder). A SERVIDOR.18 (repositório de projetos), feita antes por este agente, também está pronta.
- **Feito:** `apps-cloned/chaos-code/server/servidor/banco/tarefas_repositorio.py` (novo): criar, buscar, listar com filtros por status/priority/tags e paginação, contar, alterar só os campos enviados, mandar para a lixeira, restaurar em até 7 dias e limpar a lixeira vencida. O dono é conferido pelo projeto em todo SQL. Datas de início e conclusão automáticas pela situação. Valores do inventário (mcp-cli-wsl.md, ferramentas 13 a 18). `apps-cloned/chaos-code/server/servidor/banco/projetos_repositorio.py` (SERVIDOR.18): CRUD de projetos filtrado pelo dono.
- **Verificação feita:** `C:\Python314\python.exe -m py_compile` nos dois arquivos: ok. Nenhuma linha passa de 100 caracteres e todas as funções têm até 45 linhas, até 3 parâmetros e docstring. Conferência com SQLite temporário na pasta de rascunho: tarefas 58/58 OK, projetos 37/37 OK. `import servidor.app` não testado (sem FastAPI aqui; app.py vem na SERVIDOR.48).
- **Falta:** commit e quadro (líder). Em aberto: o esquema.sql tem DEFAULT 'todo', mas o inventário diz backlog (o repositório grava sempre explícito); transições de status livres (o inventário não diz quais são permitidas); a SERVIDOR.42 converte as datas Unix para texto e o ItemTarefa para ItemChecklist; a SERVIDOR.48 chama apagar_tarefas_vencidas_da_lixeira; a SERVIDOR.41/20 apaga os arquivos das imagens ao apagar o projeto.
- **Próximo passo:** líder conferir e commitar `feat(SERVIDOR.19)` (e `feat(SERVIDOR.18)`, se ainda não foi), mover as linhas para task_complete.md e liberar a SERVIDOR.20 e a SERVIDOR.42.

## op3 — SERVIDOR.38: Revogação (`/api/oauth/revoke`)
- **Situação:** em andamento (código escrito, falta conferir)
- **Feito:** criado `apps-cloned/chaos-code/server/servidor/rotas/oauth_revogacao.py` — `roteador` com `POST /api/oauth/revoke` (RFC 7009): lê o corpo em JSON (como o cliente `src/main/login/revogacao.ts` manda) ou em formulário urlencoded; exige `token` e `client_id` (senão 400 `invalid_request` no formato OAuth); chama `tokens_repositorio.revogar_token` (só o cliente dono revoga; renovação derruba a família); responde 200 sem corpo com `Cache-Control: no-store` mesmo com token desconhecido; ignora `token_type_hint`. Alterado (compartilhado, mudança mínima) `servidor/esquemas/oauth.py`: `PedidoRevogacao` ganhou `id_cliente` (alias `client_id`, opcional).
- **Verificação feita:** nenhuma.
- **Falta:** `py_compile` dos 2 arquivos; limite de 100 caracteres por linha; conferência com FastAPI do rascunho (`pacotes/` em C:\Users\gelva\AppData\Local\Temp\claude\C--fontes-REA-APP-CLONES\6af53688-0966-4d47-af71-c046bf6b258d\scratchpad, precisa instalar `python-multipart` lá para o formulário) e banco SQLite temporário: 200 com token válido/desconhecido/de outro cliente, revogação de renovação derrubando o acesso, 400 sem token/sem client_id/JSON ruim/tipo de corpo não aceito. Registrar o roteador no app fica para a SERVIDOR.48.
- **Próximo passo:** em `apps-cloned/chaos-code/server`, rodar `C:\Python314\python.exe -m py_compile servidor/rotas/oauth_revogacao.py servidor/esquemas/oauth.py`, depois a conferência com `TestClient` (modelo: `verificar_autenticacao.py` no mesmo rascunho) e escrever o relatório.

## op2 — CLONE.4.11: Serviço de login (junta as peças)
- **Situação:** pronta (código e conferência feitos; falta o líder commitar)
- **Feito:**
  - `apps-cloned/chaos-code/src/main/login/login.servico.ts` (novo):
    - `ServicoLogin` implementa o `ProvedorLogin` com `inicializar`, `aoMudarEstado`, entrar, sair, renovar, estado e token de acesso.
    - Entrar segue os passos 1 a 10: confere a plataforma, autoriza no navegador, monta os campos do aparelho (se falhar, o login segue sem eles), troca o código e muda o estado.
    - Dois logins ao mesmo tempo viram um só. Login que falha volta ao estado anterior, com o erro.
    - `invalid_grant` na renovação deixa o estado em `sessao_expirada`.
    - Ao abrir o app, tokens sem cliente salvo são apagados.
    - `adaptarComEventos` dá eventos de estado ao modo simulado; `deveUsarLoginSimulado` lê `CHAOS_CLONE_LOGIN_SIMULADO=1`; `criarServicoLogin` escolhe entre real e simulado.
  - `apps-cloned/chaos-code/src/main/login/login.dependencias.ts` (novo):
    - `criarDependenciasLoginReal({ urlServidor, pastaDados, versaoCliente, safeStorage, abrirNavegador, registrarLog? })`, sem importar o Electron.
    - `verificarPlataforma` faz um GET com tempo limite de 10 s; se falhar: "Plataforma inacessível em … Verifique se o servidor está rodando."
    - O cliente salvo só é usado se for do mesmo servidor.
  - `token.ts` (mudança mínima): `DadosTrocaCodigo.aparelho?`, e os 5 campos `device_*` vão no corpo da troca do código (*inferido*).
  - `aparelho.ts` (mudança mínima): passa a usar `ARQUIVO_IDENTIFICACAO_APARELHO` de `constantes.ts` (unificação pedida na CLONE.4.5).
- **Verificação feita:**
  - `npm run build`: ok.
  - `npm run typecheck`: 1 erro fora da subtarefa, em `src/main/principal.ts:38`. O `ContextoCanais` agora exige `servicoImagem` e `servicoAtualizador` (trabalho de outra frente). Os arquivos de login não têm erro.
  - Nenhuma linha passa de 100 caracteres.
  - Bundle esbuild sem `require("electron")`.
  - Conferência A (dependências falsas): 16 grupos ok.
  - Conferência B (de ponta a ponta, pasta temporária, `fetch` e navegador falsos, `safeStorage` AES-GCM):
    - registro, callback real em 127.0.0.1, troca com os `device_*`;
    - `auth_tokens.json` sem token em texto puro e log sem token;
    - reabrir o app lê a sessão; sair revoga com o `client_id` e apaga;
    - plataforma fora dá a mensagem certa.
- **Falta:**
  - Ligar o serviço no `principal.ts` e nos canais IPC (CLONE.4.12).
  - Resolver o erro do `principal.ts` (de outra frente).
  - Detalhe: o log de `token.ts` mostra `//api/oauth/token` quando a URL termina com `/` (só no texto do log; o pedido sai certo).
  - Detalhe: o `LoginSimulado` grava `expires_at` em ms, e o real em segundos.
- **Próximo passo:** o líder confere os 4 arquivos e commita `feat(CLONE.4.11)`; depois a CLONE.4.12 usa `criarServicoLogin` + `criarDependenciasLoginReal` com `safeStorage` e `shell.openExternal`.

## op5 — CLONE.6.11: Serviço de indexação do projeto
- **Situação:** não começou (só leitura e desenho; nenhum arquivo do repositório criado ou alterado nesta subtarefa)
- **Feito:** nada gravado. Já lidos: seção da etapa, `divisor.ts` (`dividirEmPedacos`), `provedor-embedding.ts` (`FabricaProvedoresEmbedding`, `dividirEmLotes`, `executarComNovasTentativas`), `provedores/openai.ts` (`registrarProvedorOpenAi`), `gemini.ts` e `openrouter.ts` (só `criarProvedor*`, sem função de registro), `chaves-provedores.ts` (`preencherChavesEmbedder`), `projeto.servico.ts` (`ServicoProjetos.abrir`), `indice.ts`/`hnsw.ts` (CLONE.6.10).
- **Verificação feita:** nenhuma.
- **Falta:** tudo. Desenho previsto: (1) `vetores/controle-taxa.ts` com `executarComConcorrencia` (24) e limitador de RPM em janela de 60 s (80 × 80% = 64), relógio e espera injetados; (2) `vetores/fonte-artigos-pasta.ts`: lê .md/.markdown/.txt do `local_path` do projeto (pula pastas ocultas e node_modules; id = caminho relativo com `/`; versão = mtime; sem `local_path` → erro `local_path_required`); (3) `vetores/indexacao.servico.ts`: fábrica com openai/gemini/openrouter registrados (Custom fica em aberto), config do embedder injetada + `preencherChavesEmbedder`, sync incremental por `sync_state.article_versions` (fases fetching → chunking → embedding → saving → done/cancelled, AbortSignal), id da entrada `<artigo>#<chunk_index>`, `source_type` `chunk`, remove apagados/alterados, dimensão diferente → reindexa tudo, grava `vectors.json`, atualiza `sync_state` e `stats` do projeto (salvar injetado), uma indexação por projeto por vez, cache do índice por projeto; `buscar(idProjeto, consulta, k)` com k 1–100 (padrão 5) e consulta até 10.000 caracteres; (4) em `vetores/constantes.ts` (mudança mínima): `TOP_K_BUSCA_PADRAO = 5`, `TOP_K_BUSCA_MAXIMO = 100`, `LIMITE_CONSULTA_CARACTERES = 10000`. Filtro por `source_type`: o inventário não pede (entidades ficam em `entities.json`).
- **Próximo passo:** criar `apps-cloned/chaos-code/src/main/vetores/controle-taxa.ts` conforme o desenho acima; depois a fonte, o serviço, e rodar `npm run typecheck`, `npm run build` e a conferência por node (esbuild para a pasta de rascunho) com fetch, cofre e projetos falsos.

## Líder (Claude Code Opus 5.5, painel w1:p1)
- **Situação:** coordenação parada por falta de créditos.
- **Feito nesta sessão:** CLONE.6.6 (eu) e 18 entregas dos agentes com commit e push (CLONE.4.9,
  6.7, 6.8, 6.9, 6.10, 7.3, 7.8, 7.9, 9.2, 10.3, 11.2, 11.3, 12.5, 12.6; SERVIDOR.16, 17, 18, 25).
- **Atenção:** o código das 8 subtarefas acima está **no disco, sem commit** (só este arquivo foi
  commitado). Não usar `git stash`/`checkout --`. O typecheck falhava em `principal.ts` por causa
  dos canais IPC da 11.4/12.7 ainda pela metade.
- **Próximo passo:** quem retomar como líder: reabrir os agentes (herdr, conta com crédito),
  mandar cada um retomar pela própria seção deste arquivo, conferir (typecheck/build ou
  py_compile) e commitar uma subtarefa por vez com `fechar.py`-equivalente (linha para o
  `task_complete.md` + Entrega/Verificação na etapa).

## Atualização do líder — 2026-10-18 07:04
- **Commitadas e enviadas** (uma por commit, typecheck e build ok com tudo junto): CLONE.4.11,
  CLONE.7.7, CLONE.9.5, SERVIDOR.19, CLONE.11.4 e CLONE.12.7. As seções acima dessas 6 valem só
  como histórico.
- **Ainda em aberto:** SERVIDOR.38 (op3: `rotas/oauth_revogacao.py` e `esquemas/oauth.py` no
  disco, sem commit, falta conferir) e CLONE.6.11 (op5: nada gravado). Reservas no `STATUS.md`.
