# 🤖 Gerenciador centralizado de tarefas

Vale para todas as IAs (C28). Quem mantém o gerenciador é o `rules-ai`: `scripts/gerenciador.mjs`,
com a configuração em `scripts/gerenciador.config.json` (tarefa GERENCIADOR-GLOBAL, etapa 009).

## O que ele faz

Lê o quadro (`tasks/STATUS.md`) de cada projeto da lista de configuração, pelo `origin/main`, e
mostra quais subtarefas estão livres para cada modelo. Ele **não** reserva tarefa: quem reserva é a
própria sessão, pela regra do `;` (C24) e por `frentes-e-reserva.md`.

## Modos

- **`ver`** (padrão): mostra a tabela de subtarefas livres por projeto e modelo (C27) e avisa quando
  um modelo ocioso ganha tarefa. Não abre sessão.
- **`disparar`**: abre a sessão de um modelo ocioso com `;` e modelo fixo. **Só com ordem explícita
  do usuário, registrada no quadro.** Hoje está **em pausa** (registro da etapa 009, decisão de 13:30).

## Regras do modo `disparar`

- Só entra modelo **ocioso**: sem linha `🔄` dele no quadro e sem processo aberto pelo gerenciador.
- Só **Haiku** e **Sonnet** entram no disparo automático. Opus e Fable nunca disparam sozinhos.
- Ciclo de **30 s**, projeto por projeto.
- No máximo **1 sessão ativa por modelo** e um limite de disparos por hora, definido na configuração.
- Sem subtarefa livre do modelo → não dispara. Nunca pega subtarefa de outro modelo (C22).
- Cada disparo registra hora, projeto, modelo, subtarefa, PID, saída e custo, num registro local
  fora do Git.

## Como parar

- Criar o arquivo `scripts/PARAR` interrompe o gerenciador na próxima volta, sem abrir sessão.
- Só uma instância roda por vez (trava com o PID).

## Limites

- Não escreve em quadro de outro projeto.
- Não guarda chave, token ou segredo no script nem na configuração.
- Nunca lê as pastas `DEMAIS-PROJETOS-*` (C20, C23).
