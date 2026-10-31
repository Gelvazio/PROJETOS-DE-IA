# Plano de rollback — Agentes ao vivo

Este arquivo diz como voltar atrás na página "Agentes ao vivo", do passo mais leve ao mais pesado.
Nenhum passo cria variável nova. O que liga e desliga o canal ao vivo é a chave em
`assets/js/config.js`, e o servidor local já foi apagado.

## Nível 1 — desligar o canal ao vivo (sem mexer em código)

- **O que fazer:** em `dashboard/assets/js/config.js`, deixe `CANAL.chavePublicavel` vazia (`''`).
  Não precisa mexer em mais nada.
- **Efeito:** a página não abre o canal de Broadcast. Ela lê só o `tasks/STATUS.md` do
  GitHub raw: uma vez ao abrir e depois a cada `INTERVALO_FALLBACK_SEGUNDOS` (30 s).
- **Como conferir:** abra a página. O texto do indicador de conexão fica
  "Offline: lendo do GitHub", e o quadro continua aparecendo.
- **Para voltar:** preencha a chave de novo, do jeito que estava.

## Nível 2 — parar de publicar no canal

- **O que fazer:** no GitHub, apague o secret `SUPABASE_SECRET_KEY` (Settings → Secrets and
  variables → Actions), ou desative o workflow `.github/workflows/publicar-quadro.yml` na aba
  Actions.
- **Efeito:** a cada push em `tasks/STATUS.md`, o workflow sem o secret só mostra o aviso
  "Secret do Supabase não cadastrado; envio pulado." e termina sem enviar nada. Desativado, ele
  nem roda. A página continua lendo o GitHub raw.
- **Atenção:** se a chave continua na página, ela segue no canal aberto e mostra
  "Ao vivo: canal conectado", mesmo sem chegar dado novo. O fallback só liga quando o canal cai,
  então não liga sozinho. Para a página ler do GitHub, faça também o nível 1.
- **Como conferir:** na aba Actions, o último run de "Publicar quadro" mostra o aviso e nenhum
  envio.

## Nível 3 — trazer o servidor Python de volta

Os arquivos `dashboard/servidor.py` e `dashboard/config_graphs.py` foram apagados no commit
`0195cab`. As rotas `/api/agentes` e `/api/projetos` já tinham saído antes, no commit `1afa7b0`.

- **Opção A — só recuperar os dois arquivos, com as rotas:**
  `git checkout 1afa7b0^ -- dashboard/servidor.py dashboard/config_graphs.py`
  Use `1afa7b0^` e não `0195cab^`: o pai de `0195cab` já está sem as rotas.
- **Opção B — desfazer as duas remoções:** `git revert 0195cab 1afa7b0`. Isso também
  desfaz os ajustes do `publicar_quadro.py`, do README e dos testes que vieram no `0195cab`.
- **Aviso:** o front não volta sozinho. `agentes.js` e `config.js` mudaram depois, e o `api.js`
  foi apagado. Para o servidor voltar de verdade, é preciso reverter essas mudanças também.
  O código do servidor restaurado não foi testado.
- **Como conferir:** `git grep -n "/api/agentes" -- dashboard/servidor.py` deve achar a rota, e
  `python -m py_compile dashboard/servidor.py` deve passar.

## Quando NÃO é rollback

Se a página só está sem dado novo, isso não pede rollback. Antes, olhe o texto do indicador de
conexão na página (ao vivo, reconectando ou offline) e, no GitHub, a aba Actions (o último run de
"Publicar quadro"). Muitas vezes o quadro simplesmente não mudou, ou o workflow ainda não rodou.
