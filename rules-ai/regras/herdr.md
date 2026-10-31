# 🐑 herdr — agentes em painéis (C33)

Decidido em 2026-10-18 (origem: `REA-APP-CLONES`, etapa 015 do `rules-ai`). Vale para todos os
projetos e todas as IAs. Quadro e reserva: `ciclo-da-task.md` e `frentes-e-reserva.md`. Nível e
modelo: `niveis-e-modelos.md`. Git: `git-geral.md`. Disparo automático: `gerenciador-centralizado.md`.

## O que é

herdr é um **runtime de terminais**: um servidor em background que guarda os terminais dos agentes em
painéis. Fecha o laptop, reinicia a máquina, troca de computador — as sessões continuam e o layout
volta. Ele **não é um agente** e não substitui Claude Code, Codex, Grok, Cursor etc.: ele é o dono dos
terminais deles (22 CLIs detectados; Apache 2.0). Fonte: <https://herdr.dev>.

## Instalar (uma vez por máquina)

- Windows: `irm https://herdr.dev/install.ps1 | iex`
- macOS/Linux: `curl -fsSL https://herdr.dev/install.sh | sh`
- Skill global: `npx skills add Gelvazio/herdr --skill herdr -g`
- Integração de cada IA usada: `herdr integration install claude` (e `codex`, `grok`, `cursor`,
  `devin`, `antigravity-cli` conforme o caso).

## Quando usar

- ✅ Só **dentro do herdr** (com `HERDR_ENV=1` setada) **e** com pedido do usuário na conversa.
- ✅ Para paralelizar trabalho **já autorizado**: abrir outro agente num painel como **agente de
  equipe** do líder, ou retomar sessão que o usuário deixou aberta.
- ⛔ Fora do herdr, ou sem pedido do usuário: não abrir painel por conta própria.
- ⛔ Disparo **automático** de sessões continua em pausa (C28).

## Abrir outra IA num painel

1. O painel é uma **frente**: em "Em uso por" vai
   `<IA (modelo)> (herdr <painel>) (desde <data hora>)`.
2. O **nível** da subtarefa decide o modelo (`niveis-e-modelos.md`); o agente do painel não escolhe
   nível para caber nele.
3. **O líder** edita o quadro e reserva; a conferência, o commit e o push da entrega são do Haiku
   (C41, `niveis-e-modelos.md`); o agente do painel entrega e devolve, não commita.
4. Em `rules-ai` e `gerenciador-de-ia` (C29), painéis abertos pelo líder trabalham **sob a trava
   dele** (`tasks/.sessao-ativa`): agente de equipe não conta como sessão nova, mas painel que o
   líder não abriu conta.

## Nunca

- ⛔ Responder aprovação ou permissão **no lugar do usuário** (nem com `--dangerously-skip-permissions`,
  que não é autorização).
- ⛔ Fechar painel que não abriu, nem parar/reiniciar o servidor do herdr.
- ⛔ Usar painel para furar reserva, nível ou a trava de sessão.
- ⛔ Pedir à outra IA do painel que assuma tarefa fora do nível dela.

Skill operacional do herdr: `herdr --skill` (instalada global, uma cópia só, da versão instalada).
