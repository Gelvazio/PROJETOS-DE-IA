# rea-app-clones

**REA APP CLONES** — usar o [REA](README_pt-BR.md) (engenharia reversa com IA) para entender como
aplicativos funcionam e recriar as funcionalidades deles no nosso código.

## Pastas

```
apps-to-be-clone/   aplicativos (binários) a analisar
apps-cloned/        o que já foi reconstruído
tools/              ferramentas locais de análise (Ghidra, JDK) — fora do Git
README_pt-BR.md     documentação do REA (cópia do projeto oficial morluto/rea)
```

## Regras e tarefas

Este repositório segue o template
[`template-inicial-tasks-ia`](https://github.com/Gelvazio/template-inicial-tasks-ia): regras únicas
para todas as IAs em [`AGENTS.md`](AGENTS.md) e quadro de tarefas em [`tasks/STATUS.md`](tasks/STATUS.md).
Abra o [`index.html`](index.html) para o guia da estrutura.

Depois de clonar, instale os hooks do Git (uma vez por clone):

```bash
npm run hooks:instalar
```

## Ghidra para o REA

1. Extraia o Ghidra 12.1.x em `tools/ghidra` e instale um JDK 21.
2. Crie a variável de usuário `GHIDRA_INSTALL_DIR` apontando para `tools/ghidra`.
3. Reinicie o agente de IA.

## Licença

[MIT](LICENSE)
