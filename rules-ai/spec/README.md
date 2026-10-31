# spec/ — blocos-modelo do fluxo de spec

Fonte da regra: `regras/espec.md` (**C34**). Vale para tarefa **`PESADO`** (`regras/ciclo-da-task.md`).

## Como usar

1. Abrir a etapa em `tasks/etapas/ETAPA-<n>-<hash>-<NOME>.md` — **o plano é a etapa**, nunca em `docs/` (C10).
2. Copiar os 3 blocos para dentro da etapa, **antes** de executar a primeira subtarefa:
   `templates/requisitos.md`, `templates/invariantes.md`, `templates/perguntas-abertas.md`.
3. Fechar todas as perguntas abertas (nenhum `⬜`).
4. Conferir: `node spec/verificar-spec.mjs tasks/etapas/ETAPA-<n>-<hash>-<NOME>.md`.
5. Só então reservar e executar (`regras/frentes-e-reserva.md`).

## O que **não** fica aqui

Plano de tarefa, requisito de projeto ou cópia de regra. `spec/` guarda **só** modelo e gate.

## Arquivos

| Arquivo | Serve para | Vai para a etapa como |
|---|---|---|
| `templates/requisitos.md` | requisito verificável em formato EARS | `### Requisitos` |
| `templates/invariantes.md` | regra que vale para toda entrada (e como conferir) | `### Invariantes` |
| `templates/perguntas-abertas.md` | dúvida que **bloqueia** a execução até ser respondida | `### Perguntas abertas` |
| `verificar-spec.mjs` | gate: confere se as 3 seções existem e se a etapa está executável | — (só roda) |

> O gate **não** roda nem cria teste. A exceção de teste automatizado é só para `PESADO`, declarada
> na seção Invariantes (`regras/testes-validacao.md`).
