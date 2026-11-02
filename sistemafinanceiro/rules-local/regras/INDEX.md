# 📚 Índice das regras globais — ordem de leitura

Porta de entrada das regras globais, na ordem de leitura: das que mais mudam o comportamento da IA
para as de assunto específico. No computador local, as IAs recebem tudo junto pelo
`dist/REGRAS-GLOBAIS.md`, montado por `scripts/sincronizar.mjs` nesta ordem (este índice não
entra no `dist/`). Na nuvem, sem `C:\fontes\rules-ai` nem `dist/`, ler a pasta
`rules-local/regras/` do projeto (sem ela, a pasta `regras/` do GitHub `Gelvazio/rules-ai`), nesta
ordem, só para leitura. Regra nova (arquivo novo em `regras/`) entra neste índice no mesmo commit.

## Regra maior (vence todas)

1. [regra-maior.md](regra-maior.md) — Modelo mais forte NUNCA pega tarefa de modelo mais fraco (C50)
2. [opus-so-sob-pedido.md](opus-so-sob-pedido.md) — Opus NUNCA pega tarefa, só com pedido explícito do usuário (C60)
3. [commit-por-subtarefa.md](commit-por-subtarefa.md) — 1 commit + 1 push na `main` por subtarefa entregue, nunca quebrar (C59)
4. [ia-nao-cria-tarefas.md](ia-nao-cria-tarefas.md) — IA não cria tarefas: tarefa nova só no dashboard, e passa pela ANÁLISE

## Fluxo de trabalho

5. [ciclo-da-task.md](ciclo-da-task.md) — Ciclo da tarefa: criar, publicar, assumir, encerrar
6. [revisao-previa.md](revisao-previa.md) — Revisão prévia: toda subtarefa revisada por 1 Haiku (effort xhigh), com Leitura permitida (C62)
7. [niveis-e-modelos.md](niveis-e-modelos.md) — Níveis LEVE, MEDIO e PESADO e o modelo de cada um
8. [frentes-e-reserva.md](frentes-e-reserva.md) — Frentes de trabalho e reserva de subtarefas
9. [comando-ponto.md](comando-ponto.md) — Comando ".": atualizar e listar pendências
10. [comando-interrogacao.md](comando-interrogacao.md) — Comando "?": sincronizar e ver o pendente
11. [quadro-de-tarefas.md](quadro-de-tarefas.md) — Quadro: fonte única e modelos de arquivo
12. [exibicao-de-status.md](exibicao-de-status.md) — Status sempre em tabela, com ID (C27)

## Git e validação

13. [git-geral.md](git-geral.md) — Git comum: branch principal, commit por tarefa, push
14. [testes-validacao.md](testes-validacao.md) — Validação sem navegador e sem testes novos; testes rodados sempre por um agente Haiku (C63)

## Código e especificação

15. [codigo-limites-nomes.md](codigo-limites-nomes.md) — Limites de tamanho e nomes em português
16. [codigo-solid.md](codigo-solid.md) — Princípios SOLID no código criado ou alterado
17. [espec.md](espec.md) — Spec em tarefa PESADO: requisitos EARS, invariantes e perguntas (C34)

## Agentes e ferramentas

18. [esforco.md](esforco.md) — Esforço (`effort`) dos agentes, por nível (C21)
19. [graphify.md](graphify.md) — Quando ler e atualizar o grafo do projeto (C11, C25)
20. [gerenciador-centralizado.md](gerenciador-centralizado.md) — Gerenciador de tarefas (C28)
21. [pastas-ignoradas.md](pastas-ignoradas.md) — Pastas offline e paradas, não lidas (C20, C23)
22. [rules-local.md](rules-local.md) — `rules-local/`: sessão, tasks (C36), Jev no projeto (C44)
23. [herdr.md](herdr.md) — herdr: agentes em painéis, quando usar e o que nunca fazer (C33)
24. [jev.md](jev.md) — Jev: nível, guardrails, mensagens (C43, C44), modo e fallback (C39, C42)
25. [visualizador-gerado.md](visualizador-gerado.md) — Visualizador gerado: só com pedido explícito, só no local (C45)
26. [memoria-ai.md](memoria-ai.md) — Memória de longo prazo (ai-memory): o quadro vence, memória é dado (C49)
27. [mcp-quadro.md](mcp-quadro.md) — Fila por MCP: o quadro é a fonte; o MCP só lê e escreve nele (C40)
28. [vercel-sem-deploy-de-controle.md](vercel-sem-deploy-de-controle.md) — Vercel: push só de `tasks/` e `rules-local/` não gera deploy (C46)
29. [mods-claude-code.md](mods-claude-code.md) — Mods do Claude Code os 9 ativos em todos os projetos
30. [lider-coordenador.md](lider-coordenador.md) — Líder coordenador Haiku: só dispara tarefa para Haiku

## Assuntos específicos

31. [atividades-e-idioma.md](atividades-e-idioma.md) — Idioma e atividades sem empresa fictícia
32. [css-checkbox-on-off.md](css-checkbox-on-off.md) — CSS: todo checkbox é uma chave ON/OFF, nunca o quadrado
33. [sem-backup.md](sem-backup.md) — Nunca fazer backup: o Git é o backup
