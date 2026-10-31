# Dashboard — Agentes ao vivo

Mostra em 3D o trabalho real dos agentes. O quadro vem do `tasks/STATUS.md` do projeto escolhido no
menu (padrão `rules-ai`), lido pelo canal de Broadcast do Supabase ou direto do GitHub raw. A lista
de projetos vem de `dashboard/projetos.json`. Só leitura.

## Como usar

Não há mais servidor Python. Sirva a pasta estática, a partir de `C:\fontes\rules-ai`:

```
python -m http.server 8080
```

Abra http://localhost:8080/dashboard/ (assim a página lê o `tasks/STATUS.md` do disco; fora de localhost ela lê o GitHub raw). Também dá para abrir `dashboard/index.html` direto, mas os módulos
JS do navegador costumam exigir `http://`.

## Agentes ao vivo

Tela inteira, só com o menu em cima. As tarefas pendentes formam um **globo** no centro (bloqueadas
piscam em vermelho e as que aguardam o usuário em amarelo); cada nome da coluna "Em uso por" vira um
personagem **parado** em volta do globo, ligado a ele por um galho (mapa mental de
`dashboard/prompts/modelo.png`), com o nome escrito em cima e as tarefas que está fazendo em ramos que
saem dele, e o **percentual** de cada uma na cabeça (regra C31 do `AGENTS.md`: ` · NN%` no fim da
coluna "Em uso por"); as concluídas vão para um **anel** colado ao globo. Cor do cartão pelo nível.
Reservar e concluir viram voos do cartão. A página anima cada mudança só depois do **atraso**
(padrão 30 s, `ATRASO_PADRAO_SEGUNDOS` em `assets/js/config.js`; o seletor na tela vale para o
navegador).

### De onde vem o quadro (três modos)

Não existe servidor Python para isso: a página lê tudo do navegador, e basta servir os arquivos
estáticos (por exemplo `python -m http.server` na pasta `dashboard`).

1. **Canal ao vivo (normal):** a página lê o `tasks/STATUS.md` do GitHub raw uma vez ao abrir e
   assina o canal de Broadcast do Supabase; cada push do quadro chega pelo canal, sem consulta
   periódica. Se o canal cai e volta, a página relê o quadro inteiro.
2. **Fallback do GitHub raw a cada 30 s:** liga **só** quando o canal não está disponível: sem
   chave publicável em `CANAL.chavePublicavel`, ou canal caído por mais de 30 s. Lê o
   `STATUS.md` do GitHub raw a cada `INTERVALO_FALLBACK_SEGUNDOS` (30 s) com o leitor
   `assets/js/agentes/quadro.js`, e **para** assim que o canal volta.
3. **Sem rede:** nada novo chega. A cena fica no último quadro lido, o aviso da página mostra o
   erro da leitura e a página volta sozinha quando a rede voltar (o fallback tenta de novo a cada
   30 s; o canal reconecta e relê o quadro).

## Menu

`assets/js/menu.js` monta o mesmo menu em todas as páginas (`<nav data-menu>`). Para acrescentar uma
página, basta uma linha em `ITENS_MENU`; uma página esconde links com `data-menu-ocultar`. Acima dele
fica a linha dos projetos (`PROJETOS`), com o projeto atual em destaque.

## Configurar

- `CANAL.chavePublicavel`, em `assets/js/config.js`: chave publicável do Supabase
  (`sb_publishable_…`), pública por desenho; preenchida pelo usuário (.12). Vazia, o canal
  não liga e vale só o fallback do GitHub raw.
- `SUPABASE_SECRET_KEY`: secret do repositório no GitHub, lido só pelo workflow
  `.github/workflows/publicar-quadro.yml`. Nunca vai para o navegador nem para o repositório.

## Publicar o quadro e testar o canal

O envio é feito pelo workflow `.github/workflows/publicar-quadro.yml` (na raiz do `rules-ai`). Ele roda
a cada push na `main` que altera `tasks/STATUS.md`, executa `dashboard/publicar_quadro.py` e envia o
evento `estado` ao canal `quadro:rules-ai`.

- **Onde fica o secret:** em `Settings → Secrets and variables → Actions` do repositório
  `Gelvazio/rules-ai`, com o nome `SUPABASE_SECRET_KEY`. Ele não vai para arquivo, para o HTML nem para
  o log. Sem o secret, o workflow pula o envio com um aviso e não falha.
- **Conferir sem enviar:** na raiz do `rules-ai`, `python -B dashboard/publicar_quadro.py --simular`
  imprime o payload que seria enviado e não abre conexão. Sem `--simular`, o comando envia de verdade e
  precisa da variável de ambiente `SUPABASE_SECRET_KEY`; sem ela, sai com erro e não grava nada.
- **Testar o canal (depois de cadastrar o secret):** faça um push que altere `tasks/STATUS.md` na
  `main`, acompanhe a execução na aba `Actions` (passo de publicação) e confira em `dashboard/index.html`
  se as tarefas mudam sem recarregar a página. A mudança chega em até 60 s e aparece na cena depois do
  atraso de 30 s.

### Quando o canal cair

- A página mantém o último quadro lido e, em até 30 s, passa a ler o `STATUS.md` do GitHub raw a cada
  30 s (modo 2 de "De onde vem o quadro"). Quando o canal volta, ela para de ler e relê o quadro inteiro.
- Sem rede, nada novo chega; a página tenta de novo sozinha (modo 3).
- Se o canal não voltar, confira nesta ordem: `CANAL.chavePublicavel` preenchida em
  `assets/js/config.js`; última execução do workflow com sucesso na aba `Actions`; secret
  `SUPABASE_SECRET_KEY` cadastrado. A tela continua certa pelo fallback, só mais lenta.

## Arquivos

- `publicar_quadro.py`: publica o quadro no canal `quadro:<projeto>`; roda pelo workflow
  `.github/workflows/publicar-quadro.yml`, na raiz do `rules-ai`. `ATRASO_PADRAO_SEGUNDOS` e
  `INTERVALO_FALLBACK_SEGUNDOS` do envelope espelham o `assets/js/config.js`.
- `privacidade_quadro.py`: filtra os campos e redige segredo e dados pessoais antes de publicar.
- `quadro_tarefas.py`: lê a tabela do `tasks/STATUS.md` em Python; usado por `publicar_quadro.py` e
  pelo teste de paridade.
- `gerar_projetos.py` e `projetos.json`: gera e guarda a lista de projetos do menu (`--verificar`
  confere se o arquivo está em dia).
- `LIMITES-REALTIME.md`: medição dos limites do Realtime frente à frequência dos pushes.
- `testes/`: invariantes `invariante_paridade_quadro.py`, `invariante_payload_quadro.py` e
  `invariantes_broadcast.py`, e o medidor `medir_latencia.mjs` (instrumento, não teste).
- `index.html`, `assets/js/agentes.js` e `assets/js/agentes/` (`canal.js` assina o Broadcast;
  `quadro.js` lê o GitHub raw; fila com atraso, cena, personagens, rótulos, painéis).
- `assets/js/` (`config.js`, `visualizador.js`, `menu.js`) e `assets/css/`.

## Chamadas do Jev (CHAMADAS JEV AI)

A página `dashboard/JEV-AI-CALLS.html` mostra as chamadas que o Jev fez à API, uma por linha.

- **Resumo (cartões):** total de chamadas, custo em US$, tokens de entrada e de saída, latência
  média (ms) e percentual de chamadas com situação diferente de `ok`.
- **Tabela:** data, ação, modelo, perguntas, tokens, custo, latência, situação, tentativas e
  erro, das mais novas para as mais antigas.
- **Filtros:** por ação e por situação; `Todas` não filtra.

Lê `scripts/jev/saidas/chamadas.jsonl` (na raiz do `rules-ai`), que fica fora do Git. Sem o
arquivo, a página mostra um aviso em vez da tabela.

Como abrir: na raiz do `rules-ai`, rode `python -m http.server 8080` e abra
`http://localhost:8080/dashboard/JEV-AI-CALLS.html`. No menu, **CHAMADAS JEV AI** abre em nova
janela.

- Só funciona em localhost, servindo a raiz do `rules-ai`, com o arquivo local. Abrir por
  `file://` não lê o `chamadas.jsonl`.
- O texto das mensagens nunca aparece: o registro guarda só o hash do estado (`hash_state`).
