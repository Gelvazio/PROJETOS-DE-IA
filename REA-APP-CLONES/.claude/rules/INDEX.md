# 📖 Índice de regras — `.claude/rules/`

Cada arquivo trata de **um assunto** e tem no máximo 5 KB. Abra só o que a tarefa pedir.
**Cada regra existe em um arquivo só**: para mudar uma regra, edite o arquivo do assunto; os outros
só apontam para ele. Porta de entrada para todas as IAs: [`AGENTS.md`](../../AGENTS.md).

## 🔴 Sempre (início de sessão)

| Arquivo | Assunto |
|---------|---------|
| `essentials.md` | Checklist de início: sincronizar, o que ler e em que ordem |
| `git-quick.md` | Tudo na `main`; hooks; quando commitar; mensagens; proibições |
| `graphify.md` | Ler o relatório antes de criar e de executar tarefa; update no início da conversa e ao fim da tarefa; consultar o grafo (regra global C25) |

## 🗂️ Tarefas — pasta `tasks/`, reutilizável em outros projetos

| Arquivo | Assunto |
|---------|---------|
| `tasks/quadro.md` | Fonte única: onde fica cada informação; tarefa × subtarefa; modelos do `STATUS.md` e da etapa |
| `tasks/ciclo-da-task.md` | O que vira TASK; abrir, pequena × grande (plano na etapa), executar, encerrar, retomar |
| `tasks/frentes-e-reserva.md` | Várias sessões/IAs: frentes, reserva de subtarefa, prioridade, limites, conflitos |

## 🟠 Coordenar várias IAs

| Arquivo | Assunto |
|---------|---------|
| `multiplas-ias.md` | Tamanho das subtarefas; **nível** (LEVE/MEDIO/PESADO) e quem pega; equipe de agentes; tarefa de banco (produção exige autorização do usuário); trava especial; hooks que exigem a tarefa |

## 🟡 Código e validação

| Arquivo | Assunto |
|---------|---------|
| `codigo-solid.md` | SOLID e aplicação em JS/TS, Python, HTML e CSS |
| `codigo-limites-nomes.md` | Limites (arquivo, função, linha), constantes, nomes em português, legibilidade |
| `testes-validacao.md` | Nunca abrir navegador; nunca escrever testes (exceto bug) |

## Visualizador

`index.html` (com os scripts de `visualizador/`) mostra as regras e o quadro lendo os `.md`. Ele
usa a lista de arquivos **deste índice**: regra nova precisa de linha aqui para aparecer lá. Abrir
por um servidor local na raiz do repositório, ou ele lê do GitHub (repositório em
`visualizador/fonte.js`).

## Como criar ou mudar uma regra

1. Ache o arquivo do assunto acima; se nenhum servir, crie um novo (≤ 5 KB) e liste aqui. Regra
   de tarefas que sirva para qualquer projeto vai para `tasks/`, sem nada específico deste projeto.
2. Não repita a regra em outro arquivo (nem no `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`…) — aponte para
   ele.
3. Registre a mudança no "Registro de decisões" do `tasks/STATUS.md`.

---

Última atualização: 2026-10-14 (criação do template, ETAPA-001)
