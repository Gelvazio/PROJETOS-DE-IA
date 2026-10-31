#!/usr/bin/env bash
# Hook SessionStart do Claude Code: faz o passo 1 do essentials.md sozinho.
# Traz a `main` (fetch + pull --rebase) só quando é seguro; nos outros casos só avisa.
# Nunca bloqueia a sessão: termina sempre com código 0. O que ele imprime vai para o
# contexto do Claude, por isso as mensagens são curtas.

BRANCH_PRINCIPAL="main"
REMOTO="origin"
PREFIXO="[hook sincronizar-main]"

# Escreve uma mensagem com o prefixo do hook.
# $1 - texto da mensagem.
avisar() {
  echo "$PREFIXO $1"
}

# Diz se há arquivos alterados ou novos (fora do .gitignore) na árvore de trabalho.
# Retorno: 0 quando a árvore está limpa, 1 quando há mudanças.
arvore_esta_limpa() {
  [ -z "$(git status --porcelain 2>/dev/null)" ]
}

# Faz o fetch e, se for seguro, o pull --rebase da branch principal.
sincronizar() {
  cd "${CLAUDE_PROJECT_DIR:-.}" || return
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || return

  if ! git fetch --all --prune --quiet 2>/dev/null; then
    avisar "fetch falhou (sem rede?). Rode git fetch --all --prune antes de ler o quadro."
    return
  fi

  local branch_atual
  branch_atual="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)"
  if [ "$branch_atual" != "$BRANCH_PRINCIPAL" ]; then
    avisar "na branch '$branch_atual', não em '$BRANCH_PRINCIPAL': pull não feito."
    return
  fi

  if ! arvore_esta_limpa; then
    avisar "há arquivos alterados: pull não feito. Faça git pull --rebase depois de commitar."
    return
  fi

  if git pull --rebase --quiet "$REMOTO" "$BRANCH_PRINCIPAL" 2>/dev/null; then
    avisar "$BRANCH_PRINCIPAL sincronizada ($(git rev-parse --short HEAD))."
  else
    git rebase --abort >/dev/null 2>&1
    avisar "pull --rebase falhou e foi desfeito. Sincronize à mão (git-quick.md)."
  fi
}

export GIT_TERMINAL_PROMPT=0
sincronizar
exit 0
